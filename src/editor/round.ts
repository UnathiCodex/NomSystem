/**
 * ## Round
 *
 * The round of a section in the editor, the one view of a note: a section, a note with tasks of the semester, shows its
 * blocks, each `##` block, as the round of today holds them, see `roundOf` in `reader/skill.ts`, by folding only,
 * never changing the text. The blocks done and the current block stand open, the later blocks of the round and those
 * outside it folded, their headings visible, a click on the arrow opening one; the cold Task variants not due this round
 * are folded away whole, heading and all, so they are not on the page. Under the current block stands `Next`,
 * always on: it checks a block without a result off, like theory, and opens the next; a task stays unchecked until
 * my result, which only its `⋯` writes. Above the note the round line says what this round holds and what comes next,
 * see {@link roundLineOf}; the tree lists the blocks with their places, see `roundListOf` in `../notes/tree.ts`,
 * and a click there opens a block, ahead too, see {@link roundHeadingShow}.
 * What a round holds:
 * - while the section learns the ladder, until a cold Task first comes back on a later day: every theory block in the
 *   order of the note, the worked Examples, the faded Completions, then one Task alone;
 * - later: only the Task of today, once it is due.
 * A wrong, stuck or guided Completion brings back the Example shown longest ago right after it, and a wrong, stuck
 * or guided Task the Completion tried longest ago, the same day, see {@link longestAgoOf}.
 * A task counts as done by the log: in the ladder by any attempt, a Task once nothing of it is due today;
 * a block without a result, by `Next`, kept in the browser by its heading, never by its place, so a regenerated note
 * keeps it; where I am in the round only for the day.
 *
 * - `@codemirror/state`, `@codemirror/view`: Hold the place of `Next` and draw it as a widget below the current block.
 * - `@codemirror/language`: Folds and unfolds the blocks, as their arrows do.
 * - `../skill/attempts.ts`: Writes the days of the round line out.
 * - `./tasks.ts`: Hears each load of the tasks of the note, with its section.
 * - `../notes/tree.ts`: The places of the blocks the tree shows.
 */

import { StateEffect, StateField } from "@codemirror/state";
import { Decoration, EditorView, WidgetType } from "@codemirror/view";
import { foldable, foldedRanges, foldEffect, unfoldEffect } from "@codemirror/language";
import { dayTextOf } from "../skill/attempts.ts";
import { tasksFollow } from "./tasks.ts";

import type { EditorState, Extension, Line, StateEffectType, Transaction } from "@codemirror/state";
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
 * A step of the round: its block, and the heading of the block whose failure brought it back, empty for none.
 */
type Step = {
    block: Block;
    after: string;
};

/**
 * What the browser keeps of a round: the day, where I am that day, `null` for not yet, empty after the last step,
 * and the steps without a result I passed with `Next`, by {@link keyOf}.
 */
type Kept = {
    day: string;
    at: string | null;
    seen: string[];
};

/**
 * The round shown.
 *
 * - `loaded`: The tasks of the note with its section, as loaded last.
 * - `section`: Its section.
 * - `key`: Key in the browser's storage of what is kept of the round, with the headings of the note in it, so a note
 *   generated anew starts its round afresh, see {@link headingsKeyOf}.
 * - `kept`: What is kept of it.
 * - `changed`: Shows the places of the blocks anew, in the tree and on a phone.
 */
type Round = {
    loaded: NoteTasks;
    section: SkillSection;
    key: string;
    kept: Kept;
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
const nextMoved: StateEffectType<number | null> = StateEffect.define<number | null>();

/**
 * The round shown, `null` for a note that is no section.
 */
let round: Round | null = null;


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
                return effect.value === null ? Decoration.none
                    : Decoration.set([Decoration.widget({ widget: new NextWidget(), block: true, side: 1 }).range(effect.value)]);
        return place.map(transaction.changes);
    },
    provide: (field: StateField<DecorationSet>): Extension => EditorView.decorations.from(field),
});


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
 * Gives the time of an attempt to compare, like `2026-10-17 14:05`.
 *
 * @param attempt - Attempt
 * @returns Its day and time
 */
function timeOf(attempt: Attempt): string {
    return `${attempt.day} ${attempt.time}`;
}

/**
 * Gives the first wrong, stuck or guided attempt at a task.
 *
 * @param task - Task, `null` for none
 * @param day - Only attempts of this day count, empty for all
 * @returns Its time, see {@link timeOf}, `null` for none
 */
function failedAt(task: SkillTask | null, day: string): string | null {
    const attempt: Attempt | undefined = task?.attempts.find((candidate: Attempt): boolean =>
        failed.includes(candidate.result) && (day === "" || candidate.day === day));
    return attempt === undefined ? null : timeOf(attempt);
}

/**
 * Picks the block shown or tried longest ago before a failure: the one whose last attempt before it is the oldest,
 * one never tried first, the first in the note on a tie; my choice, since the protocol names none.
 * - `lastOf`: Time of the last attempt of a block before the failure, empty for none.
 *
 * @param blocks - Blocks to pick from, in the order of the note
 * @param before - Time of the failure, see {@link timeOf}
 * @returns The block, `undefined` for none to pick
 */
function longestAgoOf(blocks: Block[], before: string): Block | undefined {
    const lastOf: (block: Block) => string = (block: Block): string =>
        block.task?.attempts.filter((attempt: Attempt): boolean => timeOf(attempt) < before).map(timeOf).at(-1) ?? "";
    return blocks.reduce((oldest: Block | undefined, block: Block): Block =>
        oldest === undefined || lastOf(block) < lastOf(oldest) ? block : oldest, undefined);
}

/**
 * Gives the steps of today's round, see the top of this file.
 * - `of`: The blocks of a kind, theory for `null`, a heading of a task the reader left out not among them.
 * - `cold`: The Task of today, `null` for none.
 * - `back`: A step bringing a block back after a failure at a time, none without a failure or a block to bring back.
 *
 * @param blocks - Blocks of the note
 * @param section - Its section
 * @param today - Today like `2026-10-17`
 * @returns Steps in order
 */
function stepsOf(blocks: Block[], section: SkillSection, today: string): Step[] {
    const of: (kind: SkillTask["kind"] | null) => Block[] = (kind: SkillTask["kind"] | null): Block[] =>
        blocks.filter((block: Block): boolean => (block.task?.kind ?? null) === kind
            && (block.task !== null || !/^(Task|Completion)\./.test(block.heading)));
    const step: (block: Block) => Step = (block: Block): Step => ({ block: block, after: "" });
    const back: (from: Block, at: string | null, pool: Block[]) => Step[] =
        (from: Block, at: string | null, pool: Block[]): Step[] => {
            const block: Block | undefined = at === null ? undefined : longestAgoOf(pool, at);
            return block === undefined ? [] : [{ block: block, after: from.heading }];
        };
    const cold: Block | null = blocks.find((block: Block): boolean => block.task?.id === section.cold) ?? null;
    const worked: Block[] = of("worked");
    const faded: Block[] = of("faded");
    const coldSteps: Step[] = cold === null ? [] : [step(cold), ...back(cold, failedAt(cold.task, today), faded)];
    if (section.ladder)
        return [
            ...[...of(null), ...worked].map(step),
            ...faded.flatMap((block: Block): Step[] => [step(block), ...back(block, failedAt(block.task, ""), worked)]),
            ...coldSteps,
        ];
    const task: SkillTask | null = cold?.task ?? null;
    return task !== null && (task.attempts.some((attempt: Attempt): boolean => attempt.day === today)
        || (task.due !== "" && task.due <= today)) ? coldSteps : [];
}

/**
 * Gives the key of a step, which names it while the note changes: its heading, and after a failure the heading of
 * the block that failed.
 *
 * @param step - Step
 * @returns Key like `Example. Unbiased Mean Check after Completion. Cautious Owner Estimate`
 */
function keyOf(step: Step): string {
    return step.after === "" ? step.block.heading : `${step.block.heading} after ${step.after}`;
}

/**
 * Gives a short key of the headings of a note's blocks, so what the browser keeps of a round belongs to the note
 * as it was: a note generated anew, with other blocks, starts its round afresh, instead of finding its round done
 * by the headings of the old one.
 * - `hash`: Hash of the headings, one after the other.
 *
 * @param blocks - Blocks of the note
 * @returns Key like `k3f9a2c`
 */
function headingsKeyOf(blocks: Block[]): string {
    let hash: number = 5381;
    [...blocks.map((block: Block): string => block.heading).join("\n")].forEach((character: string): void => {
        hash = (hash * 33 + character.charCodeAt(0)) >>> 0;
    });
    return `k${hash.toString(36)}`;
}

/**
 * Tells whether a step is done: theory and an Example brought back once passed with `Next`; a Task once nothing of it
 * is due today, by its attempts of today; a Completion brought back once tried after the failure; any other task
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
    if (task === null || (step.after !== "" && task.kind === "worked"))
        return shown.kept.seen.includes(keyOf(step));
    if (task.kind === "cold")
        return task.attempts.some((attempt: Attempt): boolean => attempt.day === today)
            && (task.skipped || task.due === "" || task.due > today);
    if (step.after !== "") {
        const failure: string = failedAt(shown.loaded.tasks.find((candidate: SkillTask): boolean =>
            candidate.heading === step.after) ?? null, today) ?? "";
        return task.attempts.some((attempt: Attempt): boolean => timeOf(attempt) > failure);
    }
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
    return stepsOf(blocksOf(view.state, shown.loaded.tasks), shown.section, shown.loaded.today);
}

/**
 * Gives the current step: the one I am at today, else the first not done; none after the last.
 *
 * @param shown - The round
 * @param steps - Its steps
 * @returns The step, `undefined` for none
 */
function currentOf(shown: Round, steps: Step[]): Step | undefined {
    if (shown.kept.at === "")
        return undefined;
    return steps.find((step: Step): boolean => keyOf(step) === shown.kept.at)
        ?? steps.find((step: Step): boolean => !doneIs(shown, step));
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
 * Saves what is kept of the round in the browser.
 *
 * @param shown - The round
 */
function keep(shown: Round): void {
    localStorage.setItem(shown.key, JSON.stringify(shown.kept));
}

/**
 * Writes the round line, see the top of this file: in the ladder `Round 0 · today: theory, Examples, Completions,
 * then one Task alone`, later `Round 1 · one Task alone`, then what comes after a right and after a failed Task
 * with their days, or once the Task of today has its result, what comes next; between two rounds when the next comes.
 * - `cold`: The Task of today.
 * - `next`: Number of the next round.
 * - `wrong`, `right`: What follows a failed and a right Task.
 *
 * @param shown - The round
 * @returns The line
 */
function roundLineOf(shown: Round): string {
    const section: SkillSection = shown.section;
    const today: string = shown.loaded.today;
    const cold: SkillTask | undefined = shown.loaded.tasks.find((task: SkillTask): boolean => task.id === section.cold);
    const head: string = section.ladder ? `Round ${section.round} · today: theory, Examples, Completions, then one Task alone`
        : `Round ${section.round} · one Task alone`;
    const wrong: (day: string) => string = (day: string): string =>
        `wrong: a Completion right away, this round again on ${dayTextOf(day, true)}`;
    const right: (day: string) => string = (day: string): string => `right: round ${section.round + 1} on ${dayTextOf(day, true)}`;
    if (cold === undefined)
        return head;
    const tried: Attempt[] = cold.attempts.filter((attempt: Attempt): boolean =>
        attempt.day === today && attempt.result !== "skipped");
    if (tried.length > 0 && cold.due !== "" && cold.due > today)
        return `${head} · ${failedAt(cold, today) === null ? right(cold.due) : wrong(cold.due)}`;
    if (section.ladder)
        return head;
    if (cold.due === "")
        return `Round ${section.round} · ready`;
    if (cold.due > today)
        return `Round ${section.round} · one Task alone on ${dayTextOf(cold.due, true)}`;
    return `${head} · ${right(section.rightDue)} · ${wrong(section.wrongDue)}`;
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
    view.dispatch({ effects: nextMoved.of(current === undefined ? null : bodyOf(view.state, current.block)?.to
        ?? view.state.doc.line(current.block.line).to) });
    shown.changed();
}

/**
 * Opens a block and scrolls to it, its heading right below the head of the editor, once the page is drawn anew,
 * since scrolling at once lands on the heights the editor guessed for the folds before it measured them.
 * - {@link requestAnimationFrame}: Waits until the page is drawn next.
 *
 * @param view - The editor
 * @param block - Block
 */
function blockOpen(view: EditorView, block: Block): void {
    const body: { from: number; to: number } | null = bodyOf(view.state, block);
    if (body !== null && foldedAt(view.state, body.from))
        view.dispatch({ effects: unfoldEffect.of(body) });
    requestAnimationFrame((): void => view.dispatch({
        effects: EditorView.scrollIntoView(view.state.doc.line(block.line).from, { y: "start" }),
    }));
}

/**
 * Goes on from the current step: checks it off when it takes no result, keeps that and where I am, opens the next
 * step and puts `Next` below it; after the last, `Next` goes and the round line tells what comes next.
 * - `steps`, `current`: The steps of the round and the current one.
 * - `following`: The step after it, `undefined` after the last.
 *
 * @param view - The editor
 */
function roundNext(view: EditorView): void {
    if (round === null)
        return;
    const steps: Step[] = roundStepsOf(view, round);
    const current: Step | undefined = currentOf(round, steps);
    if (current === undefined)
        return;
    if ((current.block.task === null || (current.after !== "" && current.block.task.kind === "worked"))
        && !round.kept.seen.includes(keyOf(current)))
        round.kept.seen.push(keyOf(current));
    const following: Step | undefined = steps[steps.indexOf(current) + 1];
    round.kept.at = following === undefined ? "" : keyOf(following);
    keep(round);
    if (following !== undefined)
        blockOpen(view, following.block);
    roundDraw(view, round);
}

/**
 * Takes the tasks of the note as they load, see `tasksFollow` in `./tasks.ts`: for a section, the first time its round
 * from what the browser keeps, the blocks done and the current one open, the others folded, the Task variants not
 * due folded away whole, and where I am pinned to the current step, so a result moves nothing, only `Next` and a click;
 * each time after, like after a result, the round as it now stands.
 * - `fresh`: Whether the round of this note shows for the first time.
 * - `stored`: What the browser keeps of it, `null` for nothing.
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
    const key: string = `round ${loaded.path} ${section.round} ${headingsKeyOf(blocksOf(view.state, loaded.tasks))}`;
    const stored: Kept | null = fresh ? JSON.parse(localStorage.getItem(key) ?? "null") as Kept | null : round?.kept ?? null;
    round = {
        loaded: loaded, section: section, key: key, changed: changed,
        kept: { day: loaded.today, at: stored?.day === loaded.today ? stored.at : null, seen: stored?.seen ?? [] },
    };
    if (fresh) {
        const shown: Round = round;
        const blocks: Block[] = blocksOf(view.state, loaded.tasks);
        const steps: Step[] = stepsOf(blocks, section, loaded.today);
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
        if (shown.kept.at === null && current !== undefined)
            shown.kept.at = keyOf(current);
    }
    roundDraw(view, round);
}

/**
 * Gives the places of the blocks of the round shown in their order, for the tree: done, the current one, later in the
 * round, or outside it; the Task variants not due left out.
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
    return blocksOf(view.state, shown.loaded.tasks)
        .filter((block: Block): boolean => !hiddenIs(shown, block))
        .map((block: Block): [string, BlockMark] => {
            const own: Step[] = steps.filter((step: Step): boolean => step.block.heading === block.heading);
            if (current?.block.heading === block.heading)
                return [block.heading, "current"];
            if (own.length === 0)
                return [block.heading, "other"];
            return [block.heading, own.every((step: Step): boolean => doneIs(shown, step)) ? "done" : "round"];
        });
}

/**
 * Opens a block by its heading, as its line in the tree asks: a block of the round becomes the current one, ahead too,
 * at its first step not done; any other block only opens.
 * - `blocks`, `block`: Blocks of the note and the one asked for.
 * - `own`: Its steps in the round.
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
    const own: Step[] = roundStepsOf(view, shown).filter((step: Step): boolean => step.block.heading === heading);
    if (own.length > 0) {
        shown.kept.at = keyOf(own.find((step: Step): boolean => !doneIs(shown, step)) ?? own[0]);
        keep(shown);
    }
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
