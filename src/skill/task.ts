/**
 * ## Task
 *
 * What the views show of one task: when it is due, and its history folded behind a small button
 * that opens all its attempts, each with its day, its result and my comment on what went wrong, an older one also
 * with its time, its part, my effort, where I got stuck or why I skipped, and a link to the day; in the scripts view
 * and in a card, under the heading of the task, its row with one button `⋯` for the next attempt, as a box of the day
 * has, see `../menu.ts`.
 * Its menu writes into the skill entry of the moment, through the reader's one writer of attempts, the task judged
 * as a whole: Right at once, Wrong opens one short field below the task for my comment on what went wrong, which
 * Enter writes with it, also empty, and Escape closes without writing.
 * The menu shows only once the solution of the task is open, so I judge against it, not by feeling, since
 * self-grading runs generous (León 2023); a task without a solution shows it always. A broken task I tell my tutor
 * in the chat.
 * A card and a section in the editor keep the row quiet, as quiet as a box of the day: only the `⋯`, after it grey
 * the result of today once there is one, like `wrong`, no state, no hint and no history.
 *
 * - `./attempts.ts`: Sends attempts, and writes days out.
 * - `../icons.ts`: Puts icons, alone or with words, into buttons.
 * - `../menu.ts`: Puts the items for the next attempt behind one button `⋯`.
 * - `lucide`: The icons of the history and of the items.
 * - `./task.css`: Look of the row and the history of a task.
 */

import { attemptSend, dayTextOf } from "./attempts.ts";
import { iconOf, iconWordsOf } from "../icons.ts";
import { menuItemOf, menuOf } from "../menu.ts";
import { Check, History, X } from "lucide";
import "./task.css";

import type { Attempt, SkillTask } from "./attempts.ts";


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
 * Tells when a task is due, as a line of its own, where no group of due tasks names it, see `reader/skill.ts`:
 * a task due, a cold task ready with nothing due, a task of the ladder done, else new.
 *
 * @param task - Task
 * @param today - Today like `2026-10-10`
 * @returns Text like `Due today`, also for a task due earlier, `Due Mon, 12.10.2026`, `New`, `Ready`, `Done`
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
 * Builds the label of a cold task, to stand grey beside its heading in the scripts view in place of its `(cold)`:
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
 * Writes the result of an attempt, with my comment on what went wrong, an older one also after its part, with where
 * I got stuck or why I skipped, and my effort when I rated it.
 * - `result`: The result with where I got stuck or why I skipped.
 * - `part`: The part before it, empty for the whole task.
 *
 * @param attempt - Attempt
 * @returns Text like `right · low effort`, `2. stuck at step 3`, `1. wrong: weights add up to 1.2`, `right with tutor`
 *   or `skipped: too easy`
 */
export function resultTextOf(attempt: Attempt): string {
    let result: string = attempt.result;
    if (attempt.error !== "")
        result = `wrong: ${attempt.error}`;
    else if (attempt.stuck !== "")
        result = `stuck at ${attempt.stuck}`;
    else if (attempt.skip !== "")
        result = `skipped: ${attempt.skip}`;
    else if (attempt.result === "guided")
        result = "right with tutor";
    const part: string = attempt.part === "" ? "" : `${attempt.part}. `;
    return attempt.effort === "" ? `${part}${result}` : `${part}${result} · ${attempt.effort} effort`;
}

/**
 * Builds the history of a task: a small button with the history icon and the number of attempts, closed at first,
 * that opens all attempts, the latest first, each its day, linking to the day in the day view, and its result.
 *
 * @param task - Task
 * @param counted - Whether the button shows the number of attempts beside its icon
 * @returns History, none for a task never tried
 */
export function historyOf(task: SkillTask, counted: boolean): HTMLElement[] {
    if (task.attempts.length === 0)
        return [];

    const history: HTMLDetailsElement = document.createElement("details");
    const summary: HTMLElement = elementOf("summary", "", "");
    const list: HTMLElement = elementOf("ol", "", "");
    history.className = "task-history";
    summary.append(...(counted ? iconWordsOf(History, String(task.attempts.length)) : [iconOf(History)]));
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
 * @param result - Result of the attempt
 * @param comment - My comment on what went wrong, empty for none and for right
 * @param written - Shows the task again once the attempt is written
 */
function attemptWrite(row: HTMLElement, task: SkillTask, result: "right" | "wrong", comment: string,
                      written: () => Promise<void>): void {

    row.inert = true;
    attemptSend({ task: task.id, result: result, comment: comment })
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
 * Opens the field for my comment on what went wrong below a task, focused: Enter writes the attempt as wrong
 * with the comment, also with none, Escape closes the place of the field without writing.
 * - `input`: The field.
 *
 * @param row - Row of the task
 * @param task - Task
 * @param written - Shows the task again once the attempt is written
 */
function wrongShow(row: HTMLElement, task: SkillTask, written: () => Promise<void>): void {
    const form: HTMLElement = row.querySelector(".task-form") as HTMLElement;
    const input: HTMLInputElement = document.createElement("input");
    input.type = "text";
    input.placeholder = "What went wrong";
    input.autocomplete = "off";
    input.addEventListener("keydown", (event: KeyboardEvent): void => {
        if (event.key === "Enter")
            attemptWrite(row, task, "wrong", input.value.trim(), written);
        else if (event.key === "Escape")
            form.hidden = true;
    });
    form.replaceChildren(input);
    form.hidden = false;
    input.focus();
}

/**
 * Builds the row of a task under its heading in the scripts view: when it is due, then its button `⋯` with Right
 * and Wrong, see the top of this file, then its history and the place for the field of my comment, each across the
 * row. The button hides, keeping its place, until the solution is open, and the row marks itself so meanwhile,
 * a grey hint after the state saying so, see `task.css`; a card's row shows neither state nor hint nor history.
 * - `more`: The button `⋯` of the task with its menu.
 * - `judged`: Shows the button while the solution is open, or always when the task has none.
 * - `done`: The last attempt of today, whose result a card shows.
 *
 * @param task - Task
 * @param today - Today like `2026-10-10`
 * @param solution - Fold of the task's solution, `null` when it has none: whether it is open, and a `toggle` when that
 *   changes, like the fold of a card, or as the editor draws the row anew on each fold, see `../editor/tasks.ts`
 * @param card - Whether the row stands on a card or in a section, quiet
 * @param written - Shows the task again once an attempt is written
 * @returns Row
 */
export function taskRowOf(task: SkillTask, today: string, solution: (EventTarget & { open: boolean }) | null,
                          card: boolean, written: () => Promise<void>): HTMLElement {

    const row: HTMLElement = elementOf("div", `task-row${card ? " task-quiet" : ""}`, "");
    const form: HTMLElement = elementOf("div", "task-form", "");
    const more: HTMLElement = menuOf([
        menuItemOf(Check, "Right", (): void => attemptWrite(row, task, "right", "", written)),
        menuItemOf(X, "Wrong", (): void => wrongShow(row, task, written)),
    ]);
    const judged: () => void = (): void => {
        row.classList.toggle("task-unjudged", solution !== null && !solution.open);
    };

    form.hidden = true;
    const done: Attempt | undefined = task.attempts.findLast((attempt: Attempt): boolean => attempt.day === today);
    row.append(...(card ? [] : [elementOf("span", "task-state", stateTextOf(task, today)),
        elementOf("span", "task-hint", "Right and Wrong once the solution is open")]), more,
        ...(card && done !== undefined ? [elementOf("span", "task-state", resultTextOf(done))] : []),
        ...(card ? [] : historyOf(task, true)), form);
    judged();
    solution?.addEventListener("toggle", judged);
    return row;
}
