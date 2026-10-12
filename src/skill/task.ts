/**
 * ## Task
 *
 * What the views show of one task: when it is due, and its history folded behind a small button
 * that opens all its attempts, each with its day and time, its part, its result, my effort, where I got stuck
 * or why I skipped, and a link to the day; in the notes view, under the heading of the task, its row with the buttons
 * for the next attempt.
 * The buttons write into the skill entry of the moment, through the reader's one writer of attempts:
 * Right and Wrong at once; Stuck opens one short field for where I got stuck, Enter writes it;
 * Skip offers the reasons to pick, with a field for my own words, which Enter writes without a reason.
 * Right and Wrong show only once the solution of the task is open, so I judge against it, not by feeling,
 * since self-grading runs generous (León 2023); Stuck and Skip show always.
 * A cold task with parts, a), b), c), has one line of Right, Wrong and Stuck per part, since each part gets its own
 * result, a check after a part that sits in the run; Skip stays for the whole task.
 * Right after an attempt that is no skip, the row offers one tap for my effort on it, low, medium or high,
 * as long as the attempt is of today and has none.
 * After the buttons, a quiet copy icon puts the text for my tutor on the clipboard, the task with my attempts
 * and the theory of its note, to paste into the Claude app on my second screen, see `../notes/tutor.ts`;
 * it also tells the reader, so a right attempt after it counts as guided, not as a hit.
 *
 * - `./attempts.ts`: Sends attempts, efforts and copies for my tutor, and writes days out.
 * - `../icons.ts`: Puts icons, alone or with words, into buttons.
 * - `lucide`: The icons of the history, of copying and of the check after it.
 * - `./task.css`: Look of the row and the history of a task.
 */

import { attemptSend, dayTextOf, effortSend, tutorSend } from "./attempts.ts";
import { iconPut, iconWordsOf } from "../icons.ts";
import { Check, Copy, History } from "lucide";
import "./task.css";

import type { Attempt, Effort, Result, SkillTask } from "./attempts.ts";


/**
 * Milliseconds the check stands in place of the copy icon after copying.
 */
const copiedTime: number = 2000;


/**
 * Makes an element with a class and a text.
 *
 * @param tag - Name of the element, like `div`
 * @param className - Class, empty for none
 * @param text - Text, empty for none
 * @returns Element
 */
function elementOf(tag: string, className: string, text: string): HTMLElement {
    const element: HTMLElement = document.createElement(tag);
    element.className = className;
    element.textContent = text;
    return element;
}

/**
 * Makes a button with words.
 *
 * @param text - Words of the button
 * @param click - What a click does
 * @returns Button
 */
function buttonOf(text: string, click: () => void): HTMLButtonElement {
    const button: HTMLButtonElement = document.createElement("button");
    button.type = "button";
    button.textContent = text;
    button.addEventListener("click", click);
    return button;
}

/**
 * Tells when a task is due, as a line of its own, where no group of due tasks names it, see `reader/skill.ts`:
 * a task due, a cold task ready with nothing due, a task of the ladder done, else new.
 *
 * @param task - Task
 * @param today - Today like `2026-10-10`
 * @returns Text like `Due today`, also for a task due earlier, `Due Monday, 12.10.2026`, `New`, `Ready`, `Done`
 *   or `Skipped: too easy`
 */
export function stateTextOf(task: SkillTask, today: string): string {
    if (task.skipped) {
        const skip: string = task.attempts.at(-1)?.skip ?? "";
        return skip === "" ? "Skipped" : `Skipped: ${skip}`;
    }
    if (task.due !== "")
        return task.due <= today ? "Due today" : `Due ${dayTextOf(task.due, true)}`;
    if (task.ready)
        return "Ready";
    return task.done ? "Done" : "New";
}

/**
 * Builds the label of a cold task, to stand grey beside its heading in the notes view in place of its `(cold)`:
 * that it is cold, how often I tried it and how often I got it right, skips left out.
 *
 * @param task - Cold task
 * @returns Label like `cold · 2 done · 1 right`
 */
export function coldLabelOf(task: SkillTask): HTMLElement {
    const done: number = task.attempts.filter((attempt: Attempt): boolean => attempt.result !== "skipped").length;
    const right: number = task.attempts.filter((attempt: Attempt): boolean => attempt.result === "right").length;
    return elementOf("span", "task-cold", `cold · ${done} done · ${right} right`);
}

/**
 * Writes the result of an attempt, after its part, with where I got stuck or why I skipped, and my effort when I rated it.
 * - `result`: The result with where I got stuck or why I skipped.
 * - `part`: The part before it, empty for the whole task.
 *
 * @param attempt - Attempt
 * @returns Text like `right · low effort`, `b) stuck at step 3`, `right with tutor` or `skipped: too easy`
 */
export function resultTextOf(attempt: Attempt): string {
    let result: string = attempt.result;
    if (attempt.stuck !== "")
        result = `stuck at ${attempt.stuck}`;
    else if (attempt.skip !== "")
        result = `skipped: ${attempt.skip}`;
    else if (attempt.result === "guided")
        result = "right with tutor";
    const part: string = attempt.part === "" ? "" : `${attempt.part}) `;
    return attempt.effort === "" ? `${part}${result}` : `${part}${result} · ${attempt.effort} effort`;
}

/**
 * Builds the history of a task: a small button with the history icon and the number of attempts, closed at first,
 * that opens all attempts, the latest first, each its day, linking to the day in the day view, and its result.
 *
 * @param task - Task
 * @returns History, none for a task never tried
 */
export function historyOf(task: SkillTask): HTMLElement[] {
    if (task.attempts.length === 0)
        return [];

    const history: HTMLDetailsElement = document.createElement("details");
    const summary: HTMLElement = elementOf("summary", "", "");
    const list: HTMLElement = elementOf("ol", "", "");
    history.className = "task-history";
    summary.append(...iconWordsOf(History, String(task.attempts.length)));
    summary.title = "History";
    summary.setAttribute("aria-label", `History, ${task.attempts.length} ${task.attempts.length === 1 ? "attempt" : "attempts"}`);
    list.append(...task.attempts.toReversed().map((attempt: Attempt): HTMLElement => {
        const item: HTMLElement = elementOf("li", "", "");
        const day: HTMLAnchorElement = document.createElement("a");
        day.href = `/?date=${attempt.day}`;
        day.textContent = attempt.time === "" ? dayTextOf(attempt.day, false) : `${dayTextOf(attempt.day, false)}, ${attempt.time}`;
        item.append(day, ` · ${resultTextOf(attempt)}`);
        return item;
    }));
    history.append(summary, list);
    return [history];
}

/**
 * Writes an attempt at a task into the skill entry of the moment, then shows the task again.
 * The row of the task takes no clicks meanwhile, so a double click writes one attempt;
 * when the reader does not take the attempt, the row says so.
 * - {@link HTMLElement#inert}: Makes an element and its content take no clicks and no typing.
 *
 * @param row - Row of the task
 * @param task - Task
 * @param part - Part of a cold task, empty for the whole task
 * @param result - Result of the attempt
 * @param stuck - Where I got stuck, empty for none
 * @param skip - Why I skipped, empty for none
 * @param written - Shows the task again once the attempt is written
 */
function attemptWrite(row: HTMLElement, task: SkillTask, part: string, result: Result, stuck: string, skip: string,
                      written: () => Promise<void>): void {

    row.inert = true;
    attemptSend({ task: task.id, part: part, result: result, effort: "", stuck: stuck, skip: skip })
        .then(written).catch((error: unknown): void => failShow(row, error));
}

/**
 * Says below a task that saving failed, and lets the row take clicks again.
 *
 * @param row - Row of the task
 * @param error - Why saving failed, like a lost connection
 */
function failShow(row: HTMLElement, error: unknown): void {
    console.error(error);
    const form: HTMLElement = row.querySelector(".task-form") as HTMLElement;
    form.replaceChildren(elementOf("p", "", "Saving failed"));
    form.hidden = false;
    row.inert = false;
}

/**
 * Writes my effort into the last attempt at a task, then shows the task again;
 * the row takes no clicks meanwhile, and says so when the reader does not take the effort.
 *
 * @param row - Row of the task
 * @param task - Task
 * @param effort - My effort
 * @param written - Shows the task again once the effort is written
 */
function effortWrite(row: HTMLElement, task: SkillTask, effort: Effort, written: () => Promise<void>): void {
    row.inert = true;
    effortSend(task.id, effort).then(written).catch((error: unknown): void => failShow(row, error));
}

/**
 * Builds the tap for my effort on the last attempt at a task, right after it: `Effort` and the efforts to pick,
 * one tap writes it; only while that attempt is of today, is no skip and has no effort yet.
 * - `last`: The last attempt at the task.
 * - `tap`: The tap, across the row.
 *
 * @param row - Row of the task
 * @param task - Task
 * @param efforts - Efforts to pick, the lowest first
 * @param today - Today like `2026-10-10`
 * @param written - Shows the task again once the effort is written
 * @returns Tap, none when there is nothing to rate
 */
function effortTapOf(row: HTMLElement, task: SkillTask, efforts: Effort[], today: string,
                     written: () => Promise<void>): HTMLElement[] {

    const last: Attempt | undefined = task.attempts.at(-1);
    if (last === undefined || last.day !== today || last.result === "skipped" || last.effort !== "")
        return [];

    const tap: HTMLElement = elementOf("div", "task-effort", "");
    tap.append(elementOf("span", "task-effort-name", "Effort"), ...efforts.map((effort: Effort): HTMLButtonElement =>
        buttonOf(effort, (): void => effortWrite(row, task, effort, written))));
    return [tap];
}

/**
 * Makes the short text field below a task: Enter sends its text, Escape closes the place of the field.
 *
 * @param form - Place below the task
 * @param placeholder - Hint in the empty field
 * @param enter - What Enter does with the text
 * @returns Text field
 */
function fieldOf(form: HTMLElement, placeholder: string, enter: (text: string) => void): HTMLInputElement {
    const input: HTMLInputElement = document.createElement("input");
    input.type = "text";
    input.placeholder = placeholder;
    input.autocomplete = "off";
    input.addEventListener("keydown", (event: KeyboardEvent): void => {
        if (event.key === "Enter")
            enter(input.value.trim());
        else if (event.key === "Escape")
            form.hidden = true;
    });
    return input;
}

/**
 * Opens the field for where I got stuck below a task, focused: Enter writes the attempt as stuck.
 *
 * @param row - Row of the task
 * @param task - Task
 * @param part - Part of a cold task, empty for the whole task
 * @param written - Shows the task again once the attempt is written
 */
function stuckShow(row: HTMLElement, task: SkillTask, part: string, written: () => Promise<void>): void {
    const form: HTMLElement = row.querySelector(".task-form") as HTMLElement;
    const input: HTMLInputElement = fieldOf(form, part === "" ? "Where stuck, like step 3" : `Where stuck in ${part}), like step 3`,
        (text: string): void => attemptWrite(row, task, part, "stuck", text, "", written));
    form.replaceChildren(input);
    form.hidden = false;
    input.focus();
}

/**
 * Opens the reasons to skip below a task, with a field for my own words, focused:
 * a click on a reason writes the skip with the reason and the words, Enter writes it with the words alone.
 *
 * @param row - Row of the task
 * @param task - Task
 * @param skips - Reasons to pick
 * @param written - Shows the task again once the attempt is written
 */
function skipShow(row: HTMLElement, task: SkillTask, skips: string[], written: () => Promise<void>): void {
    const form: HTMLElement = row.querySelector(".task-form") as HTMLElement;
    const input: HTMLInputElement = fieldOf(form, "Why, optional",
        (text: string): void => attemptWrite(row, task, "", "skipped", "", text, written));
    form.replaceChildren(...skips.map((skip: string): HTMLButtonElement => buttonOf(skip, (): void => {
        const words: string = input.value.trim();
        attemptWrite(row, task, "", "skipped", "", words === "" ? skip : `${skip}: ${words}`, written);
    })), input);
    form.hidden = false;
    input.focus();
}

/**
 * Makes the quiet copy icon of a block, which puts the text for my tutor on the clipboard, and then does
 * what else the copy means, like telling the reader; a check stands in its place for a moment after copying,
 * so I see it worked.
 * - {@link Clipboard#writeText}: Puts a text on the clipboard; the page may, being served from `localhost`
 *   or over HTTPS.
 *
 * @param tutor - Text for my tutor, see `../notes/tutor.ts`
 * @param copied - What else to do once it is copied
 * @returns Button
 */
export function tutorCopyOf(tutor: () => string, copied: () => Promise<void>): HTMLButtonElement {
    const button: HTMLButtonElement = document.createElement("button");
    button.type = "button";
    button.className = "task-tutor";
    iconPut(button, Copy, "Copy for tutor");
    button.addEventListener("click", (): void => {
        navigator.clipboard.writeText(tutor()).then((): Promise<void> => {
            iconPut(button, Check, "Copied");
            setTimeout((): void => iconPut(button, Copy, "Copy for tutor"), copiedTime);
            return copied();
        }).catch((error: unknown): void => console.error(error));
    });
    return button;
}

/**
 * Makes Right, Wrong and Stuck for a task or one of its parts; Right and Wrong as judges, see {@link taskRowOf}.
 *
 * @param row - Row of the task
 * @param task - Task
 * @param part - Part of a cold task, empty for the whole task
 * @param written - Shows the task again once the attempt is written
 * @returns Buttons
 */
function resultButtonsOf(row: HTMLElement, task: SkillTask, part: string, written: () => Promise<void>): HTMLButtonElement[] {
    const judges: HTMLButtonElement[] = [
        buttonOf("Right", (): void => attemptWrite(row, task, part, "right", "", "", written)),
        buttonOf("Wrong", (): void => attemptWrite(row, task, part, "wrong", "", "", written)),
    ];
    judges.forEach((button: HTMLButtonElement): void => button.classList.add("task-judge"));
    return [...judges, buttonOf("Stuck", (): void => stuckShow(row, task, part, written))];
}

/**
 * Builds the lines of the parts of a cold task, one per part: its letter, a check once it sits in the run,
 * and Right, Wrong and Stuck for it.
 *
 * @param row - Row of the task
 * @param task - Cold task with parts
 * @param written - Shows the task again once the attempt is written
 * @returns Lines, across the row
 */
function partLinesOf(row: HTMLElement, task: SkillTask, written: () => Promise<void>): HTMLElement[] {
    return task.parts.map((part: string): HTMLElement => {
        const line: HTMLElement = elementOf("div", "task-part", "");
        const name: HTMLElement = elementOf("span", "task-part-name", `${part})`);
        if (!task.open.includes(part))
            name.append(checkOf());
        name.title = task.open.includes(part) ? "Still to sit in this run" : "Sits in this run";
        line.append(name, ...resultButtonsOf(row, task, part, written));
        return line;
    });
}

/**
 * Makes a small check, as after a part that sits.
 *
 * @returns Element with the check
 */
function checkOf(): HTMLElement {
    const check: HTMLElement = elementOf("span", "task-part-check", "");
    iconPut(check, Check, "Sits");
    return check;
}

/**
 * Builds the row of a task under its heading in the notes view: when it is due at the left, the buttons at the right
 * with the copy icon for my tutor after them, for a cold task with parts one line of buttons per part below them,
 * then the tap for my effort on the attempt just made, its history and the place for the field of Stuck and Skip,
 * each across the row. Right and Wrong hide until the solution is open, and the row marks itself so meanwhile,
 * a grey hint after the state saying so, see `task.css`.
 * - `judged`: Shows Right and Wrong while the solution is open, or always when the task has none.
 *
 * @param task - Task
 * @param skips - Reasons to pick when skipping
 * @param efforts - Efforts to pick after an attempt, the lowest first
 * @param today - Today like `2026-10-10`
 * @param tutor - Gives the text for my tutor, which the copy icon puts on the clipboard
 * @param solution - Fold of the task's solution, `null` when it has none
 * @param written - Shows the task again once an attempt or an effort is written
 * @returns Row
 */
export function taskRowOf(task: SkillTask, skips: string[], efforts: Effort[], today: string, tutor: () => string,
                          solution: HTMLDetailsElement | null, written: () => Promise<void>): HTMLElement {

    const row: HTMLElement = elementOf("div", "task-row", "");
    const buttons: HTMLElement = elementOf("div", "task-buttons", "");
    const form: HTMLElement = elementOf("div", "task-form", "");
    const parted: boolean = task.cold && task.parts.length > 0;
    const judged: () => void = (): void => {
        row.classList.toggle("task-unjudged", solution !== null && !solution.open);
    };

    buttons.append(
        ...(parted ? [] : resultButtonsOf(row, task, "", written)),
        buttonOf("Skip", (): void => skipShow(row, task, skips, written)),
        tutorCopyOf(tutor, (): Promise<void> => tutorSend(task.id)),
    );
    form.hidden = true;
    row.append(elementOf("span", "task-state", stateTextOf(task, today)),
        elementOf("span", "task-hint", "Right and Wrong once the solution is open"), buttons,
        ...(parted ? partLinesOf(row, task, written) : []),
        ...effortTapOf(row, task, efforts, today, written), ...historyOf(task), form);
    judged();
    solution?.addEventListener("toggle", judged);
    return row;
}
