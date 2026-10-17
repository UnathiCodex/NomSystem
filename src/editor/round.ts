/**
 * ## Round
 *
 * The round of a section in the editor, the one view of a note: a section, a note with tasks of the semester, shows its
 * blocks, each `##` block, as the round holds them, never changing the text: only the current step stands on the page,
 * the text before and after it hidden, see {@link aloneOf}; the cold Task variants not due this round are folded away
 * whole. Under the current step stands `Next`: it checks a block without a result off, like theory, and opens the next;
 * a task stays unchecked until my result, which only its `⋯` writes. In the head stands only the round, like
 * `Round 1`, see {@link roundLineOf}; the tree lists the blocks with their places, see `roundListOf` in
 * `../notes/tree.ts`, and a click there shows a block alone, see {@link roundHeadingShow}.
 * What a round holds, only what it needs; the other blocks wait, grey in the tree:
 * - round 0, while the section learns the ladder, until a cold Task first comes back on a later day: every theory
 *   block in the order of the note, the Algorithm among them, and an older note's worked Examples, then one Example
 *   with gaps, the first, which gives almost every step, then one Task alone;
 *   that it is the first Example was Claude's choice, not mine;
 * - later: only the Task of today, once it is due.
 * A failure brings back one Example easier, the same day, see {@link fallbacksOf}: a wrong Task the last Example,
 * a wrong Example the one before it, a wrong first Example the Algorithm, read again; one Task per round decides when
 * the next round comes, see `reader/skill.ts`.
 * Where I am lives in the log alone, never in the browser or the note: `Next` writes the step it goes on to, where
 * I stand, into the one line `X-ROUND` of the section in the skill entry of the moment, written anew in its place,
 * and the reader gives it back with the section, see `RoundLine` in `reader/skill.ts`, so a round goes on where I left
 * it, in another sitting or on another day; the steps without a result before it, like theory, count as passed,
 * as do those an older line `seen` names.
 * A task counts as done by the log: in the ladder by any attempt, a Task once nothing of it is due today.
 * A click on a block in the tree shows it alone, back or ahead, and `Next` returns to the current step; the last step
 * has no `Next`, since a round closes only by hand, with the round check in the head, see {@link roundClose}, once its
 * Task has a result; the close writes `done` where the step stood, and Today follows.
 *
 * - `@codemirror/state`, `@codemirror/view`: Hold the place of `Next` and draw it as a widget below the current block.
 * - `@codemirror/language`: Folds and unfolds the blocks, as their arrows do.
 * - `../skill/attempts.ts`: Writes the days of the round line out.
 * - `./tasks.ts`: Hears each load of the tasks of the note, with its section.
 * - `./today.ts`: Lists what a failure brings back as cards, by {@link fallbacksOf}, so Today agrees with the round.
 * - `../notes/tree.ts`: The places of the blocks the tree shows.
 */

import { StateEffect, StateField } from "@codemirror/state";
import { Decoration, EditorView, WidgetType } from "@codemirror/view";
import { foldable, foldedRanges, foldEffect, unfoldEffect } from "@codemirror/language";
import { tasksFollow } from "./tasks.ts";

import type { EditorState, Extension, Line, Range, StateEffectType, Transaction } from "@codemirror/state";
import type { DecorationSet } from "@codemirror/view";
import type { Attempt, Result, SkillSection, SkillTask } from "../skill/attempts.ts";
import type { NoteTasks } from "./tasks.ts";
import type { BlockMark } from "../notes/tree.ts";


/**
 * A `##` block of the note: its heading as written, the number of its line, and its task, `null` for theory.
 */
type Block = {
    heading: string;
    line: number;
    task: SkillTask | null;
};

/**
 * A step of the round: its block, and for one a failure brought back the heading of the block whose failure began
 * the way down, like the Task, and when the failure right before it was, see {@link timeOf}, both empty for none.
 */
type Step = {
    block: Block;
    after: string;
    since: string;
};

/**
 * A block of the ladder, see {@link fallbacksOf}: its heading as written, and its task, `null` for the Algorithm.
 */
type Rung = {
    heading: string;
    task: SkillTask | null;
};

/**
 * A block a failure brings back, see {@link fallbacksOf}: its heading as written, its task, `null` for the Algorithm,
 * the heading of the block whose failure began the way down, like the Task, and when the failure right before it was,
 * the one that brought it, see {@link timeOf}.
 */
export type Fallback = {
    heading: string;
    task: SkillTask | null;
    after: string;
    since: string;
};

/**
 * The round shown.
 *
 * - `loaded`: The tasks of the note with its section, as loaded last.
 * - `section`: Its section.
 * - `seen`: Keys of the steps without a result passed with `Next`: those before where I stand by the log, and those
 *   an older line names, with those passed since.
 * - `at`: Key of the current step, pinned while the page shows, so a result moves nothing, only `Next`; empty for none.
 * - `changed`: Shows the places of the blocks anew, in the tree and on a phone.
 */
type Round = {
    loaded: NoteTasks;
    section: SkillSection;
    seen: string[];
    at: string;
    changed: () => void;
};

/**
 * Heading `##` of a block, with its text as written.
 */
const blockRule: RegExp = /^##[ \t]+(.+?)[ \t]*$/;

/**
 * Results that bring a block back: wrong, stuck, or right only with my tutor's help.
 */
const failed: Result[] = ["wrong", "stuck", "guided"];

/**
 * Effect of `Next` moving, to the end of a block, `null` for none.
 */
const nextMoved: StateEffectType<{ block: Block; end: number; next: boolean } | null> =
    StateEffect.define<{ block: Block; end: number; next: boolean } | null>();

/**
 * The round shown, `null` for a note that is no section.
 */
let round: Round | null = null;

/**
 * Heading of a block opened from the tree that is not the current step, shown alone in its place until `Next`;
 * empty for none.
 */
let opened: string = "";

/**
 * Where to go once the round of today is done: back to Today, see `./today.ts`.
 */
const todayAddress: string = "/scripts";


/**
 * Button `Next` below the current block, see {@link roundNext}.
 */
class NextWidget extends WidgetType {
    /**
     * Any `Next` is the same, so the drawn one stays.
     */
    override eq(): boolean {
        return true;
    }

    /**
     * Builds the button.
     */
    toDOM(view: EditorView): HTMLElement {
        const next: HTMLButtonElement = document.createElement("button");
        next.type = "button";
        next.className = "round-next";
        next.textContent = "Next";
        next.addEventListener("click", (): void => roundNext(view));
        return next;
    }

    /**
     * Keeps its click from the editor.
     */
    override ignoreEvent(): boolean {
        return true;
    }
}

/**
 * Where `Next` stands: built anew when it moves, carried along when the text changes.
 * - {@link StateField}: Only a field may draw a widget between the lines.
 */
const nextPlace: StateField<DecorationSet> = StateField.define<DecorationSet>({
    create: (): DecorationSet => Decoration.none,
    update: (place: DecorationSet, transaction: Transaction): DecorationSet => {
        for (const effect of transaction.effects)
            if (effect.is(nextMoved))
                return effect.value === null ? Decoration.none : aloneOf(transaction.state, effect.value.block, effect.value.end,
                    effect.value.next);
        return place.map(transaction.changes);
    },
    provide: (field: StateField<DecorationSet>): Extension => EditorView.decorations.from(field),
});


/**
 * Gives where a block ends: the end of its section, or of its heading line for a block with nothing below it.
 *
 * @param state - Text of the note
 * @param block - Block
 * @returns The place
 */
function endOf(state: EditorState, block: Block): number {
    return bodyOf(state, block)?.to ?? state.doc.line(block.line).to;
}

/**
 * Shows one block alone, as a card of Today asks: the text before it and after it hidden whole, `Next` below it unless
 * it is the last step, at the start of the line after it, so it never stands inside a folded solution at its end;
 * its heading marked as the first on the page, without the room above a heading, see `./editor.css`.
 * - `start`: Start of its heading line.
 * - `last`: Whether the block ends the note.
 *
 * @param state - Text of the note
 * @param block - The block shown
 * @param end - Where it ends
 * @param next - Whether `Next` stands below it
 * @returns What to draw
 */
function aloneOf(state: EditorState, block: Block, end: number, next: boolean): DecorationSet {
    const start: number = state.doc.line(block.line).from;
    const last: boolean = end >= state.doc.length;
    const marks: Range<Decoration>[] = [];
    if (start > 0)
        marks.push(Decoration.replace({ block: true }).range(0, start - 1));
    marks.push(Decoration.line({ class: "round-first" }).range(start));
    if (next)
        marks.push(Decoration.widget({ widget: new NextWidget(), block: true, side: last ? 1 : -1 }).range(last ? end : end + 1));
    if (!last)
        marks.push(Decoration.replace({ block: true }).range(end + 1, state.doc.length));
    return Decoration.set(marks);
}

/**
 * Reads the blocks of the note, each with its task.
 *
 * @param state - Text of the note
 * @param tasks - Its tasks
 * @returns Blocks in their order
 */
function blocksOf(state: EditorState, tasks: SkillTask[]): Block[] {
    const blocks: Block[] = [];
    for (let number: number = 1; number <= state.doc.lines; number++) {
        const heading: string | undefined = blockRule.exec(state.doc.line(number).text)?.[1];
        if (heading !== undefined)
            blocks.push({ heading: heading, line: number,
                task: tasks.find((task: SkillTask): boolean => task.heading === heading) ?? null });
    }
    return blocks;
}

/**
 * Gives when an attempt was made, to compare, by its place among all my attempts, see `Attempt` in
 * `../skill/attempts.ts`, so attempts of one day compare by the order I made them in, also without a time.
 *
 * @param attempt - Attempt
 * @returns Its place, written with nine digits, like `000000042`
 */
export function timeOf(attempt: Attempt): string {
    return String(attempt.order).padStart(9, "0");
}

/**
 * Gives the first attempt at a task after a time when it failed, wrong, stuck or guided: the first attempt decides,
 * skips left out.
 * - `attempt`: The first attempt.
 *
 * @param task - Task, `null` for none
 * @param after - Only attempts after this time count, see {@link timeOf}, empty for all
 * @param day - Only attempts of this day count, empty for all
 * @returns Its time, see {@link timeOf}, `null` for none or one not failed
 */
function failedAt(task: SkillTask | null, after: string, day: string): string | null {
    const attempt: Attempt | undefined = task?.attempts.find((candidate: Attempt): boolean =>
        candidate.result !== "skipped" && timeOf(candidate) > after && (day === "" || candidate.day === day));
    return attempt !== undefined && failed.includes(attempt.result) ? timeOf(attempt) : null;
}

/**
 * Gives what a failure of a task brings back the same day, one Example easier each, see the top of this file:
 * the ladder from the bottom up is the Algorithm, in an older note without one its last worked Example, then the
 * Examples with gaps, faded, in the order of the note; a failed Task brings back the last of them, a failed Example
 * the one below it, each next one only once the one before failed too, down to the bottom, which is read again;
 * each by its first attempt, see {@link failedAt}.
 * - `worked`: The last worked Example, the bottom of an older note without an Algorithm.
 * - `rungOf`: The rung of a task.
 * - `rungs`: The ladder from the bottom up.
 * - `index`: Place in the ladder of the block that failed last, above the top for a Task.
 * - `since`: When the block that failed last failed, `null` once nothing failed.
 *
 * @param tasks - Tasks of the section
 * @param algorithm - Heading of its Algorithm, empty for none, see `SkillSection` in `../skill/attempts.ts`
 * @param from - The task that failed
 * @param day - Only a failure of this day counts, empty for any
 * @returns What comes back, in order; none without a failure
 */
export function fallbacksOf(tasks: SkillTask[], algorithm: string, from: SkillTask, day: string): Fallback[] {
    const worked: SkillTask | undefined = tasks.filter((task: SkillTask): boolean => task.kind === "worked").at(-1);
    const rungOf: (task: SkillTask) => Rung = (task: SkillTask): Rung => ({ heading: task.heading, task: task });
    const rungs: Rung[] = [
        ...(algorithm !== "" ? [{ heading: algorithm, task: null }] : worked !== undefined ? [rungOf(worked)] : []),
        ...tasks.filter((task: SkillTask): boolean => task.kind === "faded").map(rungOf),
    ];
    const fallbacks: Fallback[] = [];
    let index: number = from.kind === "cold" ? rungs.length
        : rungs.findIndex((rung: Rung): boolean => rung.task?.id === from.id);
    let since: string | null = failedAt(from, "", day);
    while (index > 0 && since !== null) {
        const rung: Rung = rungs[index - 1];
        fallbacks.push({ heading: rung.heading, task: rung.task, after: from.heading, since: since });
        index--;
        since = index === 0 ? null : failedAt(rung.task, since, "");
    }
    return fallbacks;
}

/**
 * Gives the steps of today's round, see the top of this file.
 * - `step`: A step of a block itself.
 * - `back`: The steps a failure of a block brings back, see {@link fallbacksOf}.
 * - `cold`: The Task of today, `null` for none, with its steps.
 * - `first`: The first Example with gaps, the one of round 0.
 *
 * @param blocks - Blocks of the note
 * @param section - Its section
 * @param tasks - Its tasks
 * @param today - Today like `2026-10-17`
 * @returns Steps in order
 */
function stepsOf(blocks: Block[], section: SkillSection, tasks: SkillTask[], today: string): Step[] {
    const step: (block: Block) => Step = (block: Block): Step => ({ block: block, after: "", since: "" });
    const back: (from: Block, day: string) => Step[] = (from: Block, day: string): Step[] => from.task === null ? []
        : fallbacksOf(tasks, section.algorithm, from.task, day).flatMap((fallback: Fallback): Step[] => {
            const block: Block | undefined = blocks.find((candidate: Block): boolean =>
                candidate.heading === fallback.heading);
            return block === undefined ? [] : [{ block: block, after: fallback.after, since: fallback.since }];
        });
    const cold: Block | null = blocks.find((block: Block): boolean => block.task?.id === section.cold) ?? null;
    const coldSteps: Step[] = cold === null ? [] : [step(cold), ...back(cold, section.ladder ? "" : today)];
    if (!section.ladder) {
        const task: SkillTask | null = cold?.task ?? null;
        return task !== null && (task.attempts.some((attempt: Attempt): boolean => attempt.day === today)
            || (task.due !== "" && task.due <= today)) ? coldSteps : [];
    }
    const first: Block | undefined = blocks.find((block: Block): boolean => block.task?.kind === "faded");
    return [
        ...blocks.filter((block: Block): boolean => block.task === null ? !/^(Task|Completion)\./.test(block.heading)
            : block.task.kind === "worked").map(step),
        ...(first === undefined ? [] : [step(first), ...back(first, "")]),
        ...coldSteps,
    ];
}

/**
 * Gives the key of a step, which names it while the note changes: its heading, and for a step a failure brought back
 * the heading of the block whose failure began the way down, so each key is once in a round.
 *
 * @param step - Step
 * @returns Key like `Example. Kiosk Half Trend after Task. Juice Bar`
 */
function keyOf(step: Step): string {
    return step.after === "" ? step.block.heading : `${step.block.heading} after ${step.after}`;
}

/**
 * Tells whether a step has no result of its own, theory like the Algorithm, or a worked Example brought back,
 * so `Next` passes it.
 *
 * @param step - Step
 * @returns Whether it has no result
 */
function resultlessIs(step: Step): boolean {
    return step.block.task === null || (step.after !== "" && step.block.task.kind === "worked");
}

/**
 * Gives the steps without a result before where I stand, which count as passed, see {@link resultlessIs}.
 * - `index`: Place of the step I stand at, none before the first step and for one no longer in the round.
 *
 * @param steps - Steps of the round
 * @param at - Key of the step I stand at by the log, empty for none
 * @returns Their keys
 */
function passedOf(steps: Step[], at: string): string[] {
    const index: number = steps.findIndex((step: Step): boolean => keyOf(step) === at);
    return steps.slice(0, Math.max(0, index)).filter(resultlessIs).map(keyOf);
}

/**
 * Tells whether a step is done: theory, the Algorithm and a worked Example brought back once passed with `Next`;
 * an Example brought back once tried after the failure that brought it; the Task of the ladder once tried, also on
 * an earlier day of it, a later Task once nothing of it is due today, by its attempts of today; any other task
 * of the ladder once tried, on any day of it.
 * - `task`: Its task.
 *
 * @param shown - The round
 * @param step - Step
 * @returns Whether it is done
 */
function doneIs(shown: Round, step: Step): boolean {
    const task: SkillTask | null = step.block.task;
    const today: string = shown.loaded.today;
    if (task === null || resultlessIs(step))
        return shown.seen.includes(keyOf(step));
    if (step.after !== "")
        return task.attempts.some((attempt: Attempt): boolean => timeOf(attempt) > step.since);
    if (task.kind === "cold" && shown.section.ladder)
        return task.attempts.length > 0;
    if (task.kind === "cold")
        return task.attempts.some((attempt: Attempt): boolean => attempt.day === today)
            && (task.skipped || task.due === "" || task.due > today);
    return task.attempts.length > 0;
}

/**
 * Gives the steps of the round of the note shown.
 *
 * @param view - The editor
 * @param shown - The round
 * @returns Steps in order
 */
function roundStepsOf(view: EditorView, shown: Round): Step[] {
    return stepsOf(blocksOf(view.state, shown.loaded.tasks), shown.section, shown.loaded.tasks, shown.loaded.today);
}

/**
 * Gives the current step: the one pinned, see {@link Round}; none once the round is closed.
 *
 * @param shown - The round
 * @param steps - Its steps
 * @returns The step, `undefined` for none
 */
function currentOf(shown: Round, steps: Step[]): Step | undefined {
    if (shown.section.closed)
        return undefined;
    return steps.find((step: Step): boolean => keyOf(step) === shown.at) ?? steps[0];
}

/**
 * Gives where the round goes on when the page opens, from the log alone: from the step of the last `Next`, the first
 * step not done, else that step itself; without a `Next` yet, the first step not done, else the last step.
 * - `from`: Index of the step of the last `Next`, 0 for none or one no longer in the note.
 *
 * @param shown - The round
 * @param steps - Its steps
 * @returns Key of the step, empty for a round without steps
 */
function resumedOf(shown: Round, steps: Step[]): string {
    const from: number = Math.max(0, steps.findIndex((step: Step): boolean => keyOf(step) === shown.section.at));
    const step: Step | undefined = steps.slice(from).find((candidate: Step): boolean => !doneIs(shown, candidate))
        ?? steps[from] ?? steps.at(-1);
    return step === undefined ? "" : keyOf(step);
}

/**
 * Writes where I stand in the round shown into the log, its line `X-ROUND`, see `RoundLine` in `reader/skill.ts`.
 *
 * @param shown - The round
 * @param step - Key of the step I went on to, or `done` once I closed the round
 * @returns When the reader has written it
 * @throws {Error} - When the reader does not write it
 */
async function lineWrite(shown: Round, step: string): Promise<void> {
    const response: Response = await fetch("/api/skill/round", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section: `${shown.loaded.tasks[0]?.id.split("/")[0] ?? ""}/${shown.section.title}`,
            round: shown.section.round, step: step }),
    });
    if (!response.ok)
        throw new Error("The reader did not write the round");
}

/**
 * Tells whether a block is a Task variant not due this round, not on the page.
 *
 * @param shown - The round
 * @param block - Block
 * @returns Whether it is hidden
 */
function hiddenIs(shown: Round, block: Block): boolean {
    return block.task?.kind === "cold" && block.task.id !== shown.section.cold;
}

/**
 * Gives what a block folds: from the end of its heading line to the end of its section.
 *
 * @param state - Text of the note
 * @param block - Block
 * @returns The range, `null` for a block with nothing below its heading
 */
function bodyOf(state: EditorState, block: Block): { from: number; to: number } | null {
    const line: Line = state.doc.line(block.line);
    return foldable(state, line.from, line.to);
}

/**
 * Tells whether something folded starts at a place.
 *
 * @param state - Folds of the note
 * @param from - The place
 * @returns Whether it is folded
 */
function foldedAt(state: EditorState, from: number): boolean {
    let found: boolean = false;
    foldedRanges(state).between(from, from, (start: number): void => {
        found ||= start === from;
    });
    return found;
}

/**
 * Writes the round line, quiet as the small grey text of the day: only the round, like `Round 1`.
 *
 * @param shown - The round
 * @returns The line
 */
function roundLineOf(shown: Round): string {
    return `Round ${shown.section.round}`;
}

/**
 * Shows the round as it stands: the round line, `Next` below the current block, none after the last,
 * and the places of the blocks in the tree.
 * - `steps`: The steps of the round.
 * - `current`: The current step.
 * - `line`: The round line.
 *
 * @param view - The editor
 * @param shown - The round
 */
function roundDraw(view: EditorView, shown: Round): void {
    const steps: Step[] = roundStepsOf(view, shown);
    const current: Step | undefined = currentOf(shown, steps);
    const line: HTMLElement = document.getElementById("editor-round") as HTMLElement;
    line.textContent = roundLineOf(shown);
    line.hidden = false;
    const blocks: Block[] = blocksOf(view.state, shown.loaded.tasks);
    const alone: Block | undefined = blocks.find((block: Block): boolean => block.heading === opened) ?? current?.block;
    const next: boolean = alone !== current?.block || (current !== undefined && steps.indexOf(current) < steps.length - 1);
    view.dispatch({ effects: nextMoved.of(alone === undefined ? null
        : { block: alone, end: endOf(view.state, alone), next: next }) });
    closeShow(shown, steps);
    shown.changed();
}

/**
 * Opens a block, which then stands alone on the page, and scrolls the page to its top, so the name of the section
 * and its round stay in sight above it, once the page is drawn anew.
 * - {@link requestAnimationFrame}: Waits until the page is drawn next.
 *
 * @param view - The editor
 * @param block - Block
 */
function blockOpen(view: EditorView, block: Block): void {
    const body: { from: number; to: number } | null = bodyOf(view.state, block);
    if (body !== null && foldedAt(view.state, body.from))
        view.dispatch({ effects: unfoldEffect.of(body) });
    requestAnimationFrame((): void => {
        (document.querySelector(".editor-file") as HTMLElement).scrollTop = 0;
    });
}

/**
 * Goes on from the current step, see the top of this file: from a block shown from the tree, back to the current step;
 * else writes into the log which step comes next, so a step without a result before it counts as passed, and shows
 * it; the last step has no `Next`. Where I am moves at once; a line the reader does not take shows in the head, see
 * {@link failShow}.
 * - `steps`, `current`: The steps of the round and the current one.
 * - `following`: The step after it.
 *
 * @param view - The editor
 */
function roundNext(view: EditorView): void {
    if (round === null)
        return;
    const shown: Round = round;
    const steps: Step[] = roundStepsOf(view, shown);
    const current: Step | undefined = currentOf(shown, steps);
    if (current === undefined)
        return;
    if (opened !== "" && opened !== current.block.heading) {
        opened = "";
        blockOpen(view, current.block);
        roundDraw(view, shown);
        return;
    }
    opened = "";
    const following: Step | undefined = steps[steps.indexOf(current) + 1];
    if (following === undefined)
        return;
    const passed: boolean = resultlessIs(current) && !shown.seen.includes(keyOf(current));
    if (passed)
        shown.seen.push(keyOf(current));
    shown.at = keyOf(following);
    lineWrite(shown, keyOf(following)).catch(failShow);
    blockOpen(view, following.block);
    roundDraw(view, shown);
}

/**
 * Says in the head that the log did not take where I am, as a save that fails says so beside its button.
 *
 * @param error - Why, like a lost connection
 */
function failShow(error: unknown): void {
    console.error(error);
    (document.getElementById("editor-state") as HTMLElement).textContent = "Not saved";
}

/**
 * Shows the round check in the head, see {@link roundClose}: round, unlike the square save button beside it, as the ring
 * of a done box of the day; on while the round's Task has a result, in the calm grey of a main button then, as the save
 * button with changes; off and faint before; hidden once the round is closed or for a round without steps.
 * - `cold`: The Task of the round.
 *
 * @param shown - The round
 * @param steps - Its steps
 */
function closeShow(shown: Round, steps: Step[]): void {
    const close: HTMLButtonElement = document.getElementById("editor-close") as HTMLButtonElement;
    const cold: Step | undefined = steps.find((step: Step): boolean => step.block.task?.kind === "cold" && step.after === "");
    close.hidden = shown.section.closed || steps.length === 0;
    close.disabled = cold === undefined || !doneIs(shown, cold);
    close.title = close.disabled ? "Close the round once its Task has a result" : "Close the round";
}

/**
 * Closes the round shown by hand, the round check in the head: writes `done` where I stand into the log, then shows
 * Today, where the round stands done.
 */
export function roundClose(): void {
    if (round === null)
        return;
    lineWrite(round, "done").then((): void => {
        location.href = todayAddress;
    }).catch(failShow);
}

/**
 * Takes the tasks of the note as they load, see `tasksFollow` in `./tasks.ts`: for a section, the first time its round
 * from the log, where it goes on, see {@link resumedOf}, the blocks done and the current one open, the others folded, the Task variants not
 * due folded away whole, and where I am pinned to the current step, so a result moves nothing, only `Next` and a click;
 * each time after, like after a result, the round as it now stands.
 * - `fresh`: Whether the round of this note shows for the first time.
 * - `blocks`, `steps`, `current`: Blocks of the note, steps of the round and the current one.
 * - `folds`, `unfolds`: Blocks to fold and to unfold.
 * - `hidden`: Stretches of Task variants not due, each from the end of the line above its heading.
 *
 * @param view - The editor
 * @param loaded - The tasks of the note with its section
 * @param changed - Shows the places of the blocks anew
 */
function roundTake(view: EditorView, loaded: NoteTasks, changed: () => void): void {
    const section: SkillSection | null = loaded.section;
    if (section === null) {
        round = null;
        return;
    }
    const fresh: boolean = round === null || round.loaded.path !== loaded.path;
    const blocks: Block[] = blocksOf(view.state, loaded.tasks);
    const steps: Step[] = stepsOf(blocks, section, loaded.tasks, loaded.today);
    round = {
        loaded: loaded, section: section, changed: changed,
        seen: fresh ? [...section.seen, ...passedOf(steps, section.at)] : round?.seen ?? [],
        at: fresh ? "" : round?.at ?? "",
    };
    if (fresh)
        round.at = resumedOf(round, steps);
    if (fresh) {
        const shown: Round = round;
        const current: Step | undefined = currentOf(shown, steps);
        const open: (block: Block) => boolean = (block: Block): boolean => block === current?.block
            || steps.some((step: Step): boolean => step.block === block && doneIs(shown, step));
        const effects: StateEffect<{ from: number; to: number }>[] = [];
        blocks.forEach((block: Block): void => {
            const body: { from: number; to: number } | null = bodyOf(view.state, block);
            if (hiddenIs(shown, block)) {
                const line: Line = view.state.doc.line(block.line);
                effects.push(foldEffect.of({ from: Math.max(0, line.from - 1), to: body?.to ?? line.to }));
            } else if (body !== null && !open(block) && !foldedAt(view.state, body.from)) {
                effects.push(foldEffect.of(body));
            }
        });
        view.dispatch({ effects: effects });
        if (current !== undefined && current.block !== blocks[0])
            blockOpen(view, current.block);
    }
    roundDraw(view, round);
}

/**
 * Gives the places of the blocks of the round shown in their order, for the tree: done, the one shown, which is the
 * current step unless one was opened from the tree, later in the round, or outside it; the Task variants not due
 * left out.
 * - `steps`, `current`: Steps of the round and the current one.
 *
 * @param view - The editor
 * @returns Headings with their places, `null` for a note that is no section
 */
export function roundBlocksOf(view: EditorView): [string, BlockMark][] | null {
    if (round === null)
        return null;
    const shown: Round = round;
    const steps: Step[] = roundStepsOf(view, shown);
    const current: Step | undefined = currentOf(shown, steps);
    const alone: string = opened !== "" ? opened : current?.block.heading ?? "";
    return blocksOf(view.state, shown.loaded.tasks)
        .filter((block: Block): boolean => !hiddenIs(shown, block))
        .map((block: Block): [string, BlockMark] => {
            const own: Step[] = steps.filter((step: Step): boolean => step.block.heading === block.heading);
            if (alone === block.heading)
                return [block.heading, "current"];
            if (own.length === 0)
                return [block.heading, "other"];
            return [block.heading, own.every((step: Step): boolean => doneIs(shown, step)) ? "done" : "round"];
        });
}

/**
 * Shows a block by its heading alone, as its line in the tree asks, back or ahead, see the top of this file;
 * `Next` below it returns to the current step, which stays where it was.
 * - `block`: The block asked for.
 * - `current`: The current step.
 *
 * @param view - The editor
 * @param heading - Heading as written
 * @returns Whether the round took it, not for a note that is no section or a Task variant not due
 */
export function roundHeadingShow(view: EditorView, heading: string): boolean {
    if (round === null)
        return false;
    const shown: Round = round;
    const block: Block | undefined = blocksOf(view.state, shown.loaded.tasks)
        .find((candidate: Block): boolean => candidate.heading === heading);
    if (block === undefined || hiddenIs(shown, block))
        return false;
    const current: Step | undefined = currentOf(shown, roundStepsOf(view, shown));
    opened = current?.block.heading === heading ? "" : heading;
    blockOpen(view, block);
    roundDraw(view, shown);
    return true;
}

/**
 * Starts the round of the notes the editor shows: it hears each load of their tasks, see {@link roundTake}.
 *
 * @param changed - Shows the places of the blocks anew, in the tree and on a phone
 * @returns Extension for the editor, the place of `Next`
 */
export function roundStart(changed: () => void): Extension {
    tasksFollow((view: EditorView, loaded: NoteTasks): void => roundTake(view, loaded, changed));
    return nextPlace;
}
