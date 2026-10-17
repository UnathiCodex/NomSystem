/**
 * ## Tasks
 *
 * The rows of the tasks of a note in the editor, as the scripts view showed them under their headings,
 * see `../skill/task.ts`: under the heading `##` of each task of the semester its row, when it is due, its history,
 * the menu for the next attempt, which goes into the skill entry of the moment, Right, With tutor and Wrong once its
 * solution is unfolded, and right after an attempt the question for my effort on it; after each attempt
 * and effort the rows load again. A cold task, its heading ending with `(cold)`, shows a grey label in place of
 * `(cold)`, like `cold · 2 done · 1 right`, while the cursor is not on its heading.
 * Only a note with tasks of the semester has rows. A section, a note whose tasks make a section of the semester,
 * keeps its rows quiet, as a card does, without state, hint or numbers, and its `(cold)` hidden without a label,
 * since its round says what is due, see `./round.ts`, which hears of each load, see {@link tasksFollow}.
 *
 * - `@codemirror/state`, `@codemirror/view`: Hold the tasks of the note and draw the rows as widgets between its lines.
 * - `@codemirror/language`: Tells whether a solution is folded.
 * - `../skill/attempts.ts`: Loads the tasks with when they are due.
 * - `../today.ts`: Gives today's calendar date, for when a task is due.
 * - `../skill/task.ts`: Builds the row of a task and the label of a cold task.
 */

import { StateEffect, StateField } from "@codemirror/state";
import { Decoration, EditorView, WidgetType } from "@codemirror/view";
import { foldedRanges } from "@codemirror/language";
import { skillingLoad } from "../skill/attempts.ts";
import { calendarTodayOf } from "../today.ts";
import { coldLabelOf, taskRowOf } from "../skill/task.ts";

import type { EditorState, Extension, Line, Range, SelectionRange, StateEffectType, Transaction } from "@codemirror/state";
import type { DecorationSet } from "@codemirror/view";
import type { Effort, SkillModule, SkillSection, SkillTask, Skilling } from "../skill/attempts.ts";


/**
 * The tasks of the note, as loaded for its rows.
 *
 * - `path`: Path of the note, as the scripts view takes it.
 * - `tasks`: Its tasks of the semester, none for a note without.
 * - `skips`: Reasons to pick when skipping.
 * - `efforts`: Efforts to pick after an attempt, the lowest first.
 * - `today`: Today like `2026-10-10`.
 * - `section`: Its section, `null` for a note that is none.
 */
export type NoteTasks = {
    path: string;
    tasks: SkillTask[];
    skips: string[];
    efforts: Effort[];
    today: string;
    section: SkillSection | null;
};

/**
 * The rows of the note: its tasks and the widgets drawn for them.
 *
 * - `loaded`: The tasks of the note, `null` before they are loaded.
 * - `decorations`: The rows and labels of cold tasks.
 */
type Rows = {
    loaded: NoteTasks | null;
    decorations: DecorationSet;
};

/**
 * Heading `##` of a block, with its text as written.
 */
const blockRule: RegExp = /^##[ \t]+(.+?)[ \t]*$/;

/**
 * Heading of a solution, like `#### Solution` or `#### Solution (own, unchecked)`, as the scripts view folds it.
 */
const solutionRule: RegExp = /^####[ \t]+Solution\b/;

/**
 * End of the heading of a cold task, `(cold)` with the space before it, like in `Task. Kiosk Chain Review (cold)`.
 */
const coldMark: RegExp = /[ \t]*\(cold\)$/;

/**
 * Effect of the tasks of the note being loaded.
 */
const tasksLoaded: StateEffectType<NoteTasks> = StateEffect.define<NoteTasks>();

/**
 * Hears each load of the tasks, see {@link tasksFollow}, `null` for none.
 */
let follower: ((view: EditorView, loaded: NoteTasks) => void) | null = null;


/**
 * Row of a task under its heading, see `taskRowOf` in `../skill/task.ts`; Right and Wrong show while its solution
 * is unfolded, so a fold or an unfold draws the row anew.
 */
class RowWidget extends WidgetType {
    /**
     * The task.
     */
    readonly task: SkillTask;

    /**
     * The tasks of the note, with what the row picks from.
     */
    readonly loaded: NoteTasks;

    /**
     * Whether its solution is unfolded, `null` for a task without a solution.
     */
    readonly open: boolean | null;

    constructor(task: SkillTask, loaded: NoteTasks, open: boolean | null) {
        super();
        this.task = task;
        this.loaded = loaded;
        this.open = open;
    }

    /**
     * Tells whether another row is the same, so the drawn one stays: the same task with the same attempts and state,
     * its solution the same, quiet alike; so a load after a result draws only the row that changed, and the rows
     * outside the screen keep their measured heights, which keeps the page where it is.
     */
    override eq(other: RowWidget): boolean {
        return other.open === this.open && (other.loaded.section === null) === (this.loaded.section === null)
            && JSON.stringify(other.task) === JSON.stringify(this.task);
    }

    /**
     * Builds the row; each attempt or effort written loads the rows again, see {@link tasksLoad}.
     */
    toDOM(view: EditorView): HTMLElement {
        return taskRowOf(this.task, this.loaded.skips, this.loaded.efforts, this.loaded.today,
            this.open === null ? null : Object.assign(new EventTarget(), { open: this.open }), this.loaded.section !== null,
            (): Promise<void> => tasksLoad(view, this.loaded.path));
    }

    /**
     * Keeps clicks and keys in the row from the editor, so its buttons and fields work as in the scripts view.
     */
    override ignoreEvent(): boolean {
        return true;
    }
}

/**
 * Label of a cold task in place of its `(cold)`, see `coldLabelOf` in `../skill/task.ts`.
 */
class ColdWidget extends WidgetType {
    /**
     * The cold task.
     */
    readonly task: SkillTask;

    constructor(task: SkillTask) {
        super();
        this.task = task;
    }

    /**
     * Tells whether another label is that of the same task as loaded, so the drawn one stays.
     */
    override eq(other: ColdWidget): boolean {
        return other.task === this.task;
    }

    /**
     * Builds the label.
     */
    toDOM(): HTMLElement {
        return coldLabelOf(this.task);
    }
}


/**
 * Tells whether the solution of a task is unfolded: the first heading `#### Solution…` of its block, from its heading
 * to the next heading `##`.
 * - `line`: A line of the block.
 * - `open`: Whether its solution is unfolded, `null` while none is found.
 *
 * @param state - Text and folds of the note
 * @param heading - Line of the heading of the task
 * @returns Whether its solution is unfolded, `null` for a task without one
 */
function solutionOpenOf(state: EditorState, heading: Line): boolean | null {
    for (let number: number = heading.number + 1; number <= state.doc.lines; number++) {
        const line: Line = state.doc.line(number);
        if (blockRule.test(line.text))
            return null;
        if (!solutionRule.test(line.text))
            continue;
        let open: boolean = true;
        foldedRanges(state).between(line.to, line.to, (from: number): void => {
            open &&= from !== line.to;
        });
        return open;
    }
    return null;
}

/**
 * Builds the rows of the note, see the top of this file: a row after the heading of each task,
 * as wide as the page, and the label of a cold task in place of its `(cold)`
 * while the cursor is not on its heading.
 * - `decorations`: The rows and labels found so far.
 * - `line`: A line of the note, and `text` the text of its heading `##`, `undefined` for none.
 * - `task`: The task of the heading, `undefined` for any other block.
 * - `cold`: Where `(cold)` stands in the heading of a cold task, `null` for no such task.
 *
 * @param state - Text, cursor and folds of the note
 * @param loaded - The tasks of the note, `null` before they are loaded
 * @returns The rows
 */
function decorationsOf(state: EditorState, loaded: NoteTasks | null): DecorationSet {
    if (loaded === null || loaded.tasks.length === 0)
        return Decoration.none;

    const decorations: Range<Decoration>[] = [];
    for (let number: number = 1; number <= state.doc.lines; number++) {
        const line: Line = state.doc.line(number);
        const text: string | undefined = blockRule.exec(line.text)?.[1];
        if (text === undefined)
            continue;
        const task: SkillTask | undefined = loaded.tasks.find((candidate: SkillTask): boolean => candidate.heading === text);
        if (task === undefined)
            continue;
        const cold: RegExpExecArray | null = task.kind === "cold" ? coldMark.exec(line.text) : null;
        if (cold !== null && !state.selection.ranges.some((range: SelectionRange): boolean =>
            range.from <= line.to && range.to >= line.from))
            decorations.push((loaded.section === null ? Decoration.replace({ widget: new ColdWidget(task) })
                : Decoration.replace({})).range(line.from + cold.index, line.to));
        decorations.push(Decoration.widget({
            widget: new RowWidget(task, loaded, solutionOpenOf(state, line)), block: true, side: 1,
        }).range(line.to));
    }
    return Decoration.set(decorations, true);
}

/**
 * Lets something hear each load of the tasks, after their rows are drawn, like the round of a section,
 * see `./round.ts`.
 *
 * @param listener - Hears the editor and the tasks loaded
 */
export function tasksFollow(listener: (view: EditorView, loaded: NoteTasks) => void): void {
    follower = listener;
}

/**
 * Loads the tasks of the note from the reader and shows their rows, see the top of this file; without tasks of the
 * semester the note shows no rows. Then tells the one following, see {@link tasksFollow}.
 * - `skilling`: Everything the skill view shows, with every task of the semester.
 * - `loaded`: The tasks of the note with its section.
 *
 * @param view - The editor
 * @param path - Path of the note, as the scripts view takes it
 * @throws {Error} - When the reader cannot read the tasks
 */
export async function tasksLoad(view: EditorView, path: string): Promise<void> {
    const skilling: Skilling = await skillingLoad();
    const loaded: NoteTasks = {
        path: path,
        tasks: skilling.modules.flatMap((module: SkillModule): SkillTask[] => module.tasks)
            .filter((task: SkillTask): boolean => task.note === path),
        skips: skilling.skips,
        efforts: skilling.efforts,
        today: calendarTodayOf(),
        section: skilling.modules.flatMap((module: SkillModule): SkillSection[] => module.sections)
            .find((section: SkillSection): boolean => section.note === path) ?? null,
    };
    view.dispatch({ effects: tasksLoaded.of(loaded) });
    follower?.(view, loaded);
}

/**
 * The rows of the tasks of a note, see the top of this file: built again when the tasks load, the text or the cursor
 * changes, or something folds or unfolds; none until {@link tasksLoad} has loaded the tasks.
 * - {@link StateField}: Holds the rows; only a field may draw widgets between the lines.
 */
export const taskRows: Extension = StateField.define<Rows>({
    create: (): Rows => ({ loaded: null, decorations: Decoration.none }),
    update: (rows: Rows, transaction: Transaction): Rows => {
        let loaded: NoteTasks | null = rows.loaded;
        for (const effect of transaction.effects)
            if (effect.is(tasksLoaded))
                loaded = effect.value;
        if (loaded === rows.loaded && !transaction.docChanged && transaction.selection === undefined
            && foldedRanges(transaction.state) === foldedRanges(transaction.startState))
            return rows;
        return { loaded: loaded, decorations: decorationsOf(transaction.state, loaded) };
    },
    provide: (field: StateField<Rows>): Extension =>
        EditorView.decorations.from(field, (rows: Rows): DecorationSet => rows.decorations),
});
