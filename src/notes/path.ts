/**
 * ## Path
 *
 * The learning path of a section, a note with tasks of the semester, as the scripts view opens it: one block at a time,
 * since a whole note at once is too much to start with, see `../editor/editor.ts`. A block is a `##` block of the note.
 * The main area shows only the current block, whole, and under it `Next`, which passes it and shows the next one.
 * On the right the navigator lists the steps of the round: those done with a check, the current one, the later ones
 * greyed; below a line every other block of the note, greyed too, like the cold variants not due. A click on a step done
 * or on another block shows it to read, like going back to the definition, and `Next` returns to where I was.
 * A task keeps its solution folded, its steps one at a time, and its row with the `⋯` for the result, see
 * `../skill/task.ts`; `Next` waits for its result. Its source and the `(cold)` of an older heading stay out of the path.
 * A task's kind comes from the reader, by the type word of its heading, see `reader/skill.ts`.
 * What a round holds, see `roundOf` in `reader/skill.ts`:
 * - round 0, until a cold task first comes back: every theory block in the order of the note, like Definition, Example
 *   and Algorithm, then the worked tasks, then the faded ones, then the cold variant of today; after a wrong, stuck or
 *   guided result on a faded one, a worked one again before the next faded one: the next one not shown again yet,
 *   else the first;
 * - from round 1: only the cold variant of today, once it is due; after a wrong, stuck or guided result one faded task
 *   not tried before today follows the same day.
 * How far I got in a round is kept in the browser, and a step whose result is given counts as passed on loading.
 * After the last step, when the section comes back, like `Round 1 on Mon, 19.10.2026`; between two rounds only that.
 *
 * - `./markdown.ts`, `./math.ts`: Render the note, the headings of the navigator and their formulas.
 * - `./notes.ts`: Points its links, puts the steps of the solutions and greys the parts of a cold task that sit.
 * - `./tree.ts`: Builds the address of a heading in the whole note.
 * - `../skill/attempts.ts`: Loads the tasks with their attempts and the rounds, and writes days out.
 * - `../skill/task.ts`: Builds the row of a task with its menu.
 * - `../today.ts`: Gives today's calendar date.
 * - `lucide`, `../icons.ts`: The check of a step done.
 */

import { htmlOf, inlineHtmlOf } from "./markdown.ts";
import { mathRender } from "./math.ts";
import { linksResolve, partsGrey, stepsPut } from "./notes.ts";
import { noteAddressOf } from "./tree.ts";
import { dayTextOf, skillingLoad } from "../skill/attempts.ts";
import { taskRowOf } from "../skill/task.ts";
import { calendarTodayOf } from "../today.ts";
import { Check } from "lucide";
import { iconPut } from "../icons.ts";

import type { LinkedNote } from "./notes.ts";
import type { Attempt, Result, SkillModule, SkillSection, SkillTask, Skilling } from "../skill/attempts.ts";


/**
 * A `##` block of the note: its heading as written, its fold, and its task, `null` for theory.
 */
type Block = {
    heading: string;
    fold: HTMLDetailsElement;
    task: SkillTask | null;
};

/**
 * A step of a round: its block, and whether it shows a worked task again after a failed faded one, which then
 * waits for no result.
 */
type Step = {
    block: Block;
    again: boolean;
};

/**
 * The learning path shown.
 *
 * - `element`: Element of the main area, holding the block in view.
 * - `navigator`: Element of the navigator on the right.
 * - `note`: The note with its links.
 * - `skilling`: Tasks and sections of the semester, as loaded last.
 * - `section`: Section of the note, as loaded last.
 * - `blocks`: All blocks of the note.
 * - `round`: Steps of today's round, in order.
 * - `key`: Key in the browser's storage of how far I got in this round.
 * - `today`: Today like `2026-10-17`.
 * - `passed`: Number of steps passed, the next one being the current one.
 * - `viewed`: Index of a step done or of another block shown to read, see {@link listedOf}, `null` while the current
 *   one shows.
 */
type Path = {
    element: HTMLElement;
    navigator: HTMLElement;
    note: LinkedNote;
    skilling: Skilling;
    section: SkillSection;
    blocks: Block[];
    round: Step[];
    key: string;
    today: string;
    passed: number;
    viewed: number | null;
};

/**
 * End of an older heading of a cold task, `(cold)` with the space before it.
 */
const coldMark: RegExp = /[ \t]*\(cold\)$/;

/**
 * Results that ask for support: wrong, stuck, or right only with my tutor's help.
 */
const failed: Result[] = ["wrong", "stuck", "guided"];

/**
 * The learning path shown, `null` before one shows.
 */
let shown: Path | null = null;


/**
 * Tells whether the result of a step is given: of a task as a whole, or of each of its parts, in round 0 by any
 * attempt, which may span days, later by one of today; theory and a worked task shown again have none.
 * - `counted`: Its attempts that count.
 *
 * @param step - Step
 * @param round - Round of the section
 * @param today - Today like `2026-10-17`
 * @returns Whether its result is given
 */
function resultGiven(step: Step, round: number, today: string): boolean {
    const task: SkillTask | null = step.block.task;
    if (task === null || step.again)
        return false;
    const counted: Attempt[] = task.attempts.filter((attempt: Attempt): boolean => round === 0 || attempt.day === today);
    return counted.some((attempt: Attempt): boolean => attempt.part === "")
        || (task.parts.length > 0
            && task.parts.every((part: string): boolean => counted.some((attempt: Attempt): boolean => attempt.part === part)));
}

/**
 * Tells whether a task has a wrong, stuck or guided attempt that counts.
 *
 * @param task - Task
 * @param day - Only attempts of this day count, empty for all
 * @returns Whether it has one
 */
function failedOnce(task: SkillTask | null, day: string): boolean {
    return task?.attempts.some((attempt: Attempt): boolean =>
        failed.includes(attempt.result) && (day === "" || attempt.day === day)) ?? false;
}

/**
 * Gives the steps of today's round, see the top of this file.
 * - `of`: The blocks of a kind, in the order of the note, `null` for theory.
 * - `cold`: The cold variant of today, `null` for none.
 * - `worked`, `faded`: The worked and the faded tasks.
 * - `again`: How many worked tasks showed again so far.
 * - `last`: The last attempt of today at the cold variant that is no skip.
 * - `support`: The faded task that follows a failed cold task.
 *
 * @param blocks - All blocks of the note
 * @param section - Its section
 * @param today - Today like `2026-10-17`
 * @returns Steps of the round, in order
 */
function roundOf(blocks: Block[], section: SkillSection, today: string): Step[] {
    const of: (kind: SkillTask["kind"] | null) => Block[] = (kind: SkillTask["kind"] | null): Block[] =>
        blocks.filter((block: Block): boolean => (block.task?.kind ?? null) === kind);
    const step: (block: Block) => Step = (block: Block): Step => ({ block: block, again: false });
    const cold: Block | null = blocks.find((block: Block): boolean => block.task?.id === section.cold) ?? null;
    const worked: Block[] = of("worked");
    const faded: Block[] = of("faded");
    if (section.round === 0) {
        let again: number = 0;
        return [
            ...of(null).map(step),
            ...worked.map(step),
            ...faded.flatMap((block: Block): Step[] => {
                if (!failedOnce(block.task, "") || worked.length === 0)
                    return [step(block)];
                const shownAgain: Block = worked[again] ?? worked[0];
                again++;
                return [step(block), { block: shownAgain, again: true }];
            }),
            ...(cold === null ? [] : [step(cold)]),
        ];
    }

    if (cold === null || !(cold.task?.attempts.some((attempt: Attempt): boolean => attempt.day === today)
        || (cold.task !== null && cold.task.due !== "" && cold.task.due <= today)))
        return [];
    const support: Block | undefined = !failedOnce(cold.task, today) ? undefined
        : faded.find((block: Block): boolean => !(block.task?.attempts.some((attempt: Attempt): boolean =>
            attempt.day < today && attempt.result !== "skipped") ?? false));
    return [step(cold), ...(support === undefined ? [] : [step(support)])];
}

/**
 * Gives what the navigator lists: the steps of the round, then every other block of the note, in its order.
 *
 * @param path - The path
 * @returns Blocks listed, those of the round first
 */
function listedOf(path: Path): Block[] {
    const round: Block[] = path.round.map((step: Step): Block => step.block);
    return [...round, ...path.blocks.filter((block: Block): boolean => !round.includes(block))];
}

/**
 * Shows the block in view in the main area, alone and open, and `Next` under it: under the current step it passes it,
 * waiting for the result of a task; under a step done or another block, shown to read, it goes back to the current one;
 * after the last step, when the section comes back. A task of the round gets its row anew, so a result shows at once;
 * another block shows without it, to read only. Then the navigator, see {@link navigatorLay}.
 * - `step`: The step in view, `undefined` for another block and once every step is passed.
 * - `block`: The block in view, `undefined` once every step is passed.
 * - `next`: Button `Next`.
 * - `cold`: The cold variant of today, for when it comes back.
 *
 * @param path - The path
 */
function pathLay(path: Path): void {
    const step: Step | undefined = path.round[path.viewed ?? path.passed];
    const block: Block | undefined = path.viewed === null ? step?.block : listedOf(path)[path.viewed];
    navigatorLay(path);
    if (block !== undefined) {
        block.fold.classList.add("path-current");
        block.fold.open = true;
        block.fold.querySelector(":scope > .fold-content > .task-row")?.remove();
        if (block.task !== null && step !== undefined) {
            partsGrey(block.fold, block.task);
            block.fold.querySelector(":scope > .fold-content")?.prepend(taskRowOf(block.task, path.skilling.skips,
                path.skilling.efforts, path.today,
                block.fold.querySelector<HTMLDetailsElement>(":scope > .fold-content > details.fold"), true,
                (): Promise<void> => pathReload(path)));
        }
        const next: HTMLButtonElement = document.createElement("button");
        next.type = "button";
        next.className = "path-next";
        next.textContent = "Next";
        next.disabled = path.viewed === null && step !== undefined && step.block.task !== null && !step.again
            && !resultGiven(step, path.section.round, path.today);
        next.addEventListener("click", (): void => pathNext(path));
        path.element.replaceChildren(block.fold, next);
        return;
    }

    path.element.replaceChildren();
    const cold: SkillTask | undefined = path.skilling.modules.flatMap((module: SkillModule): SkillTask[] => module.tasks)
        .find((task: SkillTask): boolean => task.id === path.section.cold);
    if (cold === undefined || cold.skipped || cold.due <= path.today)
        return;
    const back: HTMLElement = document.createElement("p");
    back.className = "path-back";
    back.textContent = `Round ${path.round.length === 0 ? path.section.round : path.section.round + 1} on `
        + dayTextOf(cold.due, true);
    path.element.append(back);
}

/**
 * Lists in the navigator on the right the steps of the round, then below a line every other block of the note,
 * each by its heading, a task's without its type word and `(cold)`: a step done with its check, a click showing it again;
 * the current one plain, a click going back to it; a later one greyed, taking no click; another block greyed too,
 * a click showing it to read; the block in view marked in the calm grey of what is shown.
 * - `listed`: The blocks listed.
 * - `item`: Line of a block.
 * - `other`: Whether it is a block outside the round.
 * - `line`: The line between the round and the other blocks.
 *
 * @param path - The path
 */
function navigatorLay(path: Path): void {
    const listed: Block[] = listedOf(path);
    path.navigator.hidden = false;
    path.navigator.replaceChildren(...listed.flatMap((block: Block, index: number): HTMLElement[] => {
        const item: HTMLButtonElement = document.createElement("button");
        const other: boolean = index >= path.round.length;
        item.type = "button";
        item.className = "path-step";
        item.innerHTML = inlineHtmlOf(block.task === null ? block.heading
            : block.heading.replace(/^(Task|Completion|Example)\.\s*/, "").replace(coldMark, ""));
        item.disabled = !other && index > path.passed;
        item.classList.toggle("path-step-done", !other && index < path.passed);
        item.classList.toggle("path-step-other", other);
        if (index === (path.viewed ?? (path.passed < path.round.length ? path.passed : -1)))
            item.setAttribute("aria-current", "step");
        if (!other && index < path.passed) {
            const check: HTMLElement = document.createElement("span");
            check.className = "path-check";
            iconPut(check, Check, "Done");
            item.append(check);
        }
        item.addEventListener("click", (): void => pathView(path, index));
        if (index !== path.round.length || index === 0)
            return [item];
        const line: HTMLElement = document.createElement("div");
        line.className = "path-line";
        return [line, item];
    }));
    mathRender(path.navigator);
}

/**
 * Shows a block of the navigator in the main area: a step done or another block to read, or the current step.
 *
 * @param path - The path
 * @param index - Index of the block in the navigator, see {@link listedOf}
 */
function pathView(path: Path, index: number): void {
    path.viewed = index < path.passed || index >= path.round.length ? index : null;
    pathLay(path);
    document.querySelector(".editor-file")?.scrollTo(0, 0);
}

/**
 * Goes on from the block in view: from a step done or another block back to the current step, from the current one
 * to the next, keeping how far I got in the browser.
 *
 * @param path - The path
 */
function pathNext(path: Path): void {
    if (path.viewed === null) {
        path.passed++;
        localStorage.setItem(path.key, String(path.passed));
    }
    path.viewed = null;
    pathLay(path);
    document.querySelector(".editor-file")?.scrollTo(0, 0);
}

/**
 * Loads the tasks again after a result, and with them the steps of the round, like a worked task again after
 * a failed faded one.
 *
 * @param path - The path
 */
async function pathReload(path: Path): Promise<void> {
    path.skilling = await skillingLoad();
    path.section = sectionFind(path.skilling, path.note.path) ?? path.section;
    const tasks: SkillTask[] = tasksOf(path.skilling, path.note.path);
    path.blocks.forEach((block: Block): void => {
        block.task = block.task === null ? null
            : tasks.find((candidate: SkillTask): boolean => candidate.id === block.task?.id) ?? block.task;
    });
    path.round = roundOf(path.blocks, path.section, path.today);
    pathLay(path);
}

/**
 * Finds the section of a note.
 *
 * @param skilling - Tasks and sections of the semester
 * @param note - Path of the note
 * @returns Its section, `undefined` for a note that is none
 */
function sectionFind(skilling: Skilling, note: string): SkillSection | undefined {
    return skilling.modules.flatMap((module: SkillModule): SkillSection[] => module.sections)
        .find((candidate: SkillSection): boolean => candidate.note === note);
}

/**
 * Gives the tasks of a note.
 *
 * @param skilling - Tasks and sections of the semester
 * @param note - Path of the note
 * @returns Its tasks, in order
 */
function tasksOf(skilling: Skilling, note: string): SkillTask[] {
    return skilling.modules.flatMap((module: SkillModule): SkillTask[] => module.tasks)
        .filter((task: SkillTask): boolean => task.note === note);
}

/**
 * Shows a block of the note by its heading, as a link to it asks: a step done, the current one or a block outside
 * the round in the main area, see {@link pathView}; a step not reached yet opens the whole note at it.
 * - `index`: Index of the block in the navigator, -1 for none.
 *
 * @param heading - Heading as written
 */
export function pathHeadingShow(heading: string): void {
    if (shown === null)
        return;
    const index: number = listedOf(shown).findIndex((block: Block): boolean => block.heading === heading);
    if (index === -1 || (index > shown.passed && index < shown.round.length))
        location.assign(noteAddressOf(shown.note.path, heading));
    else
        pathView(shown, index);
}

/**
 * Shows a note as the learning path of its section, see the top of this file, when it is one.
 * - `skilling`: Tasks and sections of the semester.
 * - `section`: Section of the note.
 * - `blocks`: The blocks of the note, a task's heading without an older `(cold)`; a heading of a task the reader
 *   left out, like one whose name an earlier task has, left out too.
 * - `round`: Steps of the round.
 * - `key`: Key in the browser's storage of how far I got in this round.
 * - `today`: Today like `2026-10-17`.
 * - `passed`: Number of steps passed: as kept, at least those up to the last one whose result is given.
 *
 * @param element - Element of the main area
 * @param navigator - Element of the navigator
 * @param note - Note with its links
 * @returns Round of the section, `null` when the note is no section, then left empty
 * @throws {Error} - When the reader cannot read the tasks
 */
export async function pathShow(element: HTMLElement, navigator: HTMLElement, note: LinkedNote): Promise<number | null> {
    const skilling: Skilling = await skillingLoad();
    const section: SkillSection | undefined = sectionFind(skilling, note.path);
    if (section === undefined)
        return null;

    element.innerHTML = htmlOf(note.text);
    await linksResolve(element, note, 0);
    mathRender(element);
    stepsPut(element);
    const blocks: Block[] = [...element.querySelectorAll<HTMLDetailsElement>(":scope > details.fold")]
        .map((fold: HTMLDetailsElement): Block => {
            const heading: HTMLElement | null = fold.querySelector(":scope > summary > h2");
            const text: string = heading?.dataset.heading ?? "";
            const task: SkillTask | null = tasksOf(skilling, note.path).find((candidate: SkillTask): boolean =>
                candidate.heading === text) ?? null;
            if (task !== null) {
                fold.classList.add("path-task");
                const last: ChildNode | null | undefined = heading?.lastChild;
                if (last?.nodeType === Node.TEXT_NODE)
                    last.textContent = (last.textContent ?? "").replace(coldMark, "");
            }
            return { heading: text, fold: fold, task: task };
        })
        .filter((block: Block): boolean => block.task !== null || !/^(Task|Completion)\./.test(block.heading));
    const today: string = calendarTodayOf();
    const round: Step[] = roundOf(blocks, section, today);
    const key: string = `path ${note.path} ${section.round}`;
    const passed: number = Math.max(Number(localStorage.getItem(key) ?? "0"),
        ...round.map((step: Step, index: number): number => resultGiven(step, section.round, today) ? index + 1 : 0));
    shown = {
        element: element, navigator: navigator, note: note, skilling: skilling, section: section, blocks: blocks,
        round: round, key: key, today: today, passed: passed, viewed: null,
    };
    pathLay(shown);

    element.addEventListener("click", (event: MouseEvent): void => {
        const link: HTMLAnchorElement | null = (event.target as Element).closest("a[href]");
        if (link !== null && !event.ctrlKey && !event.metaKey && !event.shiftKey) {
            const address: URL = new URL(link.href);
            if (address.pathname === "/scripts" && address.searchParams.get("path") === note.path && address.hash !== "") {
                event.preventDefault();
                pathHeadingShow(decodeURIComponent(address.hash.slice(1)));
            }
        }
        if ((event.target as Element).closest(".path-current > summary") !== null)
            event.preventDefault();
    });
    return section.round;
}
