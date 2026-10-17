/**
 * ## Session
 *
 * No learning without a session: before I go through a section, with `Next`, a result or the round check, a session
 * of its module runs, the skill entry of the moment of the module, into which the round writes, see `reader/skill.ts`.
 * When a section opens and none runs now, the learning view asks one short question, as a card over the section
 * like a dialog of the day: how long, 25, 50 or 75 minutes, 75 picked, my session, or other minutes typed; then the
 * one writer of skill entries writes the Skill entry of the module, as the dialog of the day writes it, from now,
 * to the minute, until the length picked, see `skillEntrySend` in `../skill/attempts.ts`, and the section opens.
 * A session of the module that runs now, now between its start and its end, as the timer of the day shows it,
 * see `../timer.ts`, counts without a question. Cancel goes back to Today, since a section opens only in a session.
 *
 * - `../skill/attempts.ts`: Loads the modules with their sections and names, and sends the new skill entry.
 * - `../day/times.ts`: Gives now to the minute, as the day view writes its entries.
 * - `lucide`, `../icons.ts`: The cross of Cancel and the check of Start.
 * - `./session.css`: Look of the question.
 */

import { skillEntrySend, skillingLoad } from "../skill/attempts.ts";
import { nowOn } from "../day/times.ts";
import { Check, X } from "lucide";
import { iconPut } from "../icons.ts";
import "./session.css";

import type { SkillModule, SkillSection, Skilling } from "../skill/attempts.ts";
import type { Session } from "../timer.ts";


/**
 * Lengths of a session to pick, in minutes; the last, 75, is my session and picked at first.
 */
const lengths: number[] = [25, 50, 75];

/**
 * Where Cancel goes: back to Today, see `./today.ts`.
 */
const todayAddress: string = "/scripts";


/**
 * Loads the session of a module running now from the reader: its skill entry of the moment, see `sessionRead`
 * in `reader/skill.ts`, while its end lies after now.
 *
 * @param module - Code of the module, like `IN2028`
 * @returns Whether it runs
 * @throws {Error} - When the reader cannot answer
 */
async function runningIs(module: string): Promise<boolean> {
    const response: Response = await fetch(`/api/skill/session?module=${encodeURIComponent(module)}`);
    if (!response.ok)
        throw new Error(`Reader answered ${response.status}`);
    const session: Session | null = await response.json() as Session | null;
    return session !== null && Date.parse(session.end) > Date.now();
}

/**
 * Makes an element with its class and text.
 *
 * @param tag - Its tag, like `p`
 * @param name - Its class
 * @param text - Its text, empty for none
 * @returns The element
 */
function partOf<K extends keyof HTMLElementTagNameMap>(tag: K, name: string, text: string): HTMLElementTagNameMap[K] {
    const part: HTMLElementTagNameMap[K] = document.createElement(tag);
    part.className = name;
    part.textContent = text;
    return part;
}

/**
 * Asks how long the session is, see the top of this file: a row with what its entry will be, like
 * `IN2028 Business Analytics Machine Learning`, a row with the lengths and the field for other minutes, then Cancel
 * and Start; Enter starts too. A choice picks its length and empties the field, typing in the field picks its minutes,
 * Start off while the field holds no whole number of minutes from 1. Starting writes the entry and closes the question;
 * a write the reader refuses says so above the buttons, as a dialog of the day does.
 * - `dialog`: The question, modal over the section, so nothing of it can be gone through meanwhile.
 * - `picked`: The length picked of the choices, which counts while the field is empty.
 * - `choices`: The buttons of the lengths, in their `row`, and `field` the field for other minutes, with `other`
 *   around it.
 * - `minutesOf`: The minutes of the session, those typed or those picked, `0` for no whole number of minutes from 1.
 * - `show`: Shows what is picked, and turns Start on or off.
 *
 * @param module - Code of the module, like `IN2028`
 * @param label - What its entry will be, like `IN2028 Business Analytics Machine Learning`
 * @returns When the entry is written
 */
function lengthAsk(module: string, label: string): Promise<void> {
    const dialog: HTMLDialogElement = partOf("dialog", "session-panel", "");
    const form: HTMLFormElement = partOf("form", "session-form", "");
    const what: HTMLElement = partOf("p", "session-row", "");
    const length: HTMLElement = partOf("div", "session-row", "");
    const row: HTMLElement = partOf("div", "session-choices", "");
    const other: HTMLLabelElement = partOf("label", "session-other", "");
    const field: HTMLInputElement = partOf("input", "", "");
    const error: HTMLElement = partOf("p", "session-error", "Saving failed");
    const buttons: HTMLElement = partOf("div", "session-buttons", "");
    const cancel: HTMLButtonElement = partOf("button", "", "");
    const start: HTMLButtonElement = partOf("button", "session-main", "");
    let picked: number = lengths.at(-1) ?? 0;
    const choices: HTMLButtonElement[] = lengths.map((minutes: number): HTMLButtonElement => {
        const choice: HTMLButtonElement = partOf("button", "", `${minutes} min`);
        choice.type = "button";
        choice.addEventListener("click", (): void => {
            picked = minutes;
            field.value = "";
            show();
        });
        return choice;
    });
    const minutesOf: () => number = (): number => field.value.trim() === "" ? picked
        : /^\d+$/.test(field.value.trim()) ? Number(field.value.trim()) : 0;
    const show: () => void = (): void => {
        choices.forEach((choice: HTMLButtonElement, index: number): void =>
            choice.setAttribute("aria-pressed", String(field.value.trim() === "" && lengths[index] === picked)));
        other.classList.toggle("session-picked", field.value.trim() !== "");
        start.disabled = minutesOf() < 1;
    };

    field.type = "text";
    field.inputMode = "numeric";
    field.autocomplete = "off";
    field.placeholder = "Other";
    field.setAttribute("aria-label", "Other minutes");
    field.addEventListener("input", show);
    other.append(field, " min");
    row.append(...choices, other);
    what.append(partOf("span", "session-name", "Skill"), partOf("span", "", label));
    length.append(partOf("span", "session-name", "Length"), row);
    error.hidden = true;
    cancel.type = "button";
    iconPut(cancel, X, "Cancel");
    start.type = "submit";
    iconPut(start, Check, "Start");
    buttons.append(cancel, start);
    form.append(what, length, error, buttons);
    dialog.append(form);
    (document.getElementById("editor") ?? document.body).append(dialog);
    show();

    const leave: () => void = (): void => {
        location.href = todayAddress;
    };
    cancel.addEventListener("click", leave);
    dialog.addEventListener("cancel", (event: Event): void => {
        event.preventDefault();
        leave();
    });
    return new Promise<void>((resolve: () => void): void => {
        form.addEventListener("submit", (event: SubmitEvent): void => {
            event.preventDefault();
            const from: Date = nowOn(new Date());
            start.disabled = true;
            skillEntrySend("", {
                type: "", module: module, semester: "", chapters: [], documents: [], attempts: [],
                location: "", attendees: [], planned: "", note: "",
                start: from, end: new Date(from.getTime() + minutesOf() * 60 * 1000),
            }).then((): void => {
                dialog.close();
                dialog.remove();
                resolve();
            }).catch((failure: unknown): void => {
                console.error(failure);
                error.hidden = false;
                show();
            });
        });
        dialog.showModal();
        start.focus({ focusVisible: false });
    });
}

/**
 * Makes sure a session of the module of a section runs before I go through it, see the top of this file: without one
 * running now asks how long it is, and writes it.
 * - `skilling`: The modules of the semester with their sections and names.
 * - `module`: The module of the section, `undefined` for a note that is no section.
 *
 * @param path - Path of the note of the section, as the scripts view takes it
 * @returns When a session of its module runs
 * @throws {Error} - When the reader cannot answer
 */
export async function sessionEnsure(path: string): Promise<void> {
    const skilling: Skilling = await skillingLoad();
    const module: SkillModule | undefined = skilling.modules.find((candidate: SkillModule): boolean =>
        candidate.sections.some((section: SkillSection): boolean => section.note === path));
    if (module === undefined || await runningIs(module.code))
        return;
    await lengthAsk(module.code, skilling.labels[module.code] ?? module.code);
}
