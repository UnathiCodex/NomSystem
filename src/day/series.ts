/**
 * ## Series
 *
 * The rows of a weekly series, one and the same wherever a series is typed: in the form of a series on the page
 * of a module, see `../editor/course.ts`, and in the row `Repeat` of the dialog of a new box, see `./categories.ts`.
 * Its days, each a weekday picked from a list with its times, its `×` while there are several, `+` beside the name
 * of the first for one more, a weekday picked anew moving the days of the series with it; its first and last day;
 * the days it leaves out, each with its `×`, a field below to add one; then the boxes it makes, as the reader would
 * write them, anew a moment after each change: each its number, `–` for one the university cancelled, none for a box
 * without number, the check of one done, a new one outlined, with its day below it, like `19.10`, a day left out
 * as `·`, in the order of their days, then how many there are, like `14 boxes`; in their place a hint why it makes
 * none, like for a series its type has already; nothing while it is not typed enough or the reader does not take it,
 * like for dates too far apart.
 *
 * - `./choices.ts`: The dashboard's own pickers and the rows of a form.
 * - `./times.ts`: Starts the fields of times and days, and reads and writes times and days.
 * - `../skill/attempts.ts`: Writes a date as a day.
 * - `../food/foods.ts`: Makes elements.
 * - `../icons.ts`: Puts the plus that adds and the cross that takes back into their buttons, and makes the check
 *   of a box done.
 * - `lucide`: The check of a box done.
 * - `./series.css`: Look of the rows.
 */

import { choicesOf, rowOf, searchOf } from "./choices.ts";
import { dateFieldStart, dateParse, dateTextOf, timeFieldRead, timeFieldStart } from "./times.ts";
import { dayOf } from "../skill/attempts.ts";
import { elementOf } from "../food/foods.ts";
import { crossPut, iconOf, plusPut } from "../icons.ts";
import { Check } from "lucide";
import "./series.css";

import type { BoxState } from "./boxes.ts";
import type { Choice } from "./choices.ts";


/**
 * A slot of a series, one weekday with its times, as the reader takes it, see `Slot` in `reader/course.ts`.
 *
 * - `weekday`: Its weekday, from 1 for Monday to 7 for Sunday, 0 while none is picked.
 * - `start`, `end`: Its times in Berlin time, like `14:00` and `16:00`, empty for none.
 */
export type Slot = {
    weekday: number;
    start: string;
    end: string;
};

/**
 * The days of a series as typed so far, see the top of this file.
 *
 * - `slots`: Its weekdays with their times, in the order of their rows.
 * - `before`: For each slot, the weekday of the slot of the series as read back whose boxes it takes, 0 for a slot
 *   added, all of them 0 for a new series, see `before` of `SeriesChange` in `reader/course.ts`.
 * - `first`, `last`: Its first and last day, like `2026-10-19`, empty while not typed as a day.
 * - `excepts`: The days it leaves out, in order.
 */
export type Days = {
    slots: Slot[];
    before: number[];
    first: string;
    last: string;
    excepts: string[];
};

/**
 * A box of a series, as the reader sends it for the preview, see `Planned` in `reader/course.ts`: its identifier,
 * its day and number, like `2`, `NONE` for one the university cancelled, empty for none, its state, `new` for a new
 * one, and whether the change adds, changes or removes it.
 */
export type Planned = {
    id: string;
    day: string;
    number: string;
    state: BoxState | "new";
    change: "new" | "changed" | "removed" | "";
};

/**
 * Waiting preview after a change, so typing asks the reader once, a moment after it rests, see {@link previewSoon}.
 */
let previewWait: number = 0;

/**
 * How many previews were asked for, so only the answer to the last one shows.
 */
let previewsAsked: number = 0;


/**
 * Gives the weekday of a day.
 *
 * @param day - Day like `2026-10-19`
 * @returns 1 for Monday to 7 for Sunday
 */
export function weekdayOf(day: string): number {
    return (new Date(`${day}T12:00:00`).getDay() + 6) % 7 + 1;
}

/**
 * Adds days to a day.
 * - `date`: The day at noon, moved.
 *
 * @param day - Day like `2026-10-19`
 * @param days - Number of days to add
 * @returns Day like `2026-10-26`
 */
function dayAdd(day: string, days: number): string {
    const date: Date = new Date(`${day}T12:00:00`);
    date.setDate(date.getDate() + days);
    return dayOf(date);
}

/**
 * Gives the Monday of the week of a day, which names its week.
 *
 * @param day - Day like `2026-10-22`
 * @returns Day like `2026-10-19`
 */
export function mondayOf(day: string): string {
    return dayAdd(day, 1 - weekdayOf(day));
}

/**
 * Writes the name of a weekday in English, as the dates of the page write it.
 *
 * @param weekday - 1 for Monday to 7 for Sunday
 * @param whole - Whether to write it whole, like `Monday`, else short, like `Mon`
 * @returns Name of the weekday
 */
export function weekdayNameOf(weekday: number, whole: boolean): string {
    return new Date(2026, 9, 18 + weekday).toLocaleDateString("en-GB", { weekday: whole ? "long" : "short" });
}

/**
 * Gives the days a series leaves out between its first and its last day, the only ones it sends and shows.
 *
 * @param days - The days of the series
 * @returns Days like `2026-12-28`, in order
 */
export function exceptsWithin(days: Days): string[] {
    return days.excepts.filter((day: string): boolean => days.first <= day && day <= days.last);
}

/**
 * Tells whether the days of a series are typed enough to make boxes: each a weekday, each once, with a start before
 * its end, and a first day on or before its last.
 *
 * @param days - The days of the series
 * @returns Whether they are
 */
export function daysReady(days: Days): boolean {
    return days.slots.every((slot: Slot): boolean => slot.weekday > 0 && slot.start !== "" && slot.end !== ""
            && slot.start < slot.end)
        && new Set(days.slots.map((slot: Slot): number => slot.weekday)).size === days.slots.length
        && days.first !== "" && days.last !== "" && days.first <= days.last;
}

/**
 * Moves the days of a series that fall on the weekday of a slot to its new weekday in their week, its first day,
 * its last and the days it leaves out, so a lecture moved from Monday to Tuesday keeps its weeks,
 * like `19.10.2026–01.02.2027` becoming `20.10.2026–02.02.2027`.
 * - `move`: Moves a day on the old weekday.
 *
 * @param days - The days of the series
 * @param from - The old weekday, 0 for none yet
 * @param to - The new weekday
 */
function daysMove(days: Days, from: number, to: number): void {
    const move: (day: string) => string = (day: string): string =>
        from !== 0 && day !== "" && weekdayOf(day) === from ? dayAdd(day, to - from) : day;
    days.first = move(days.first);
    days.last = move(days.last);
    days.excepts = days.excepts.map(move).sort();
}

/**
 * Makes a field of a time or a day of a series, as the dialog has them, see `./times.ts`: plain, as wide as
 * its value, checking itself; what I type goes into the series as I type it, read as a time or a day.
 * - `input`: The field.
 *
 * @param kind - `time-field` or `date-field`
 * @param value - Its value at first, like `14:00` or `19.10.2026`
 * @param name - What it holds, for screen readers, like `Start of Monday`
 * @param take - Takes what is typed, `14:15` of `1415`, empty for no time or day
 * @param changed - Tells the form that the series changed
 * @returns The field
 */
function fieldOf(kind: string, value: string, name: string, take: (value: string) => void,
                 changed: () => void): HTMLInputElement {
    const input: HTMLInputElement = document.createElement("input");
    input.className = kind;
    input.type = "text";
    input.inputMode = kind === "time-field" ? "numeric" : "decimal";
    input.autocomplete = "off";
    input.value = value;
    input.setAttribute("aria-label", name);
    if (kind === "time-field")
        timeFieldStart(input);
    else
        dateFieldStart(input);
    input.addEventListener("input", (): void => {
        take(kind === "time-field" ? timeFieldRead(input) : dateParse(input.value) ?? "");
        changed();
    });
    return input;
}

/**
 * Makes two fields of a series side by side with the range dash between them, as start and end of the dialog,
 * like `14:00 – 16:00` or `19.10.2026 – 01.02.2027`.
 * - `range`: The two.
 * - `first`: The first with the dash.
 *
 * @param from - The first field
 * @param to - The second field
 * @returns The two
 */
function rangeOf(from: HTMLInputElement, to: HTMLInputElement): HTMLElement {
    const range: HTMLElement = elementOf("span", "entry-range", "");
    const first: HTMLElement = elementOf("span", "entry-moment", "");
    first.append(from, elementOf("span", "entry-dash", "–"));
    range.append(first, to);
    return range;
}

/**
 * Makes the rows of the days of a series, each its weekday, picked from a list, and its times, with its `×` while
 * there are several; `+` beside the name of the first adds one more, with the times of the last; a weekday picked anew
 * moves the days of the series with it, see {@link daysMove}.
 * - `weekdays`: The weekdays to pick from.
 * - `plus`: The plus.
 *
 * @param days - The days of the series
 * @param changed - Tells the form that the series changed
 * @param filled - Builds the rows of the form anew from what it holds, once a day is added, taken back or moved
 * @returns The rows
 */
export function slotRowsOf(days: Days, changed: () => void, filled: () => void): HTMLElement[] {
    const weekdays: Choice[] = [1, 2, 3, 4, 5, 6, 7].map((weekday: number): Choice =>
        ({ value: String(weekday), text: weekdayNameOf(weekday, true), group: "" }));
    const plus: HTMLButtonElement = document.createElement("button");
    plus.type = "button";
    plusPut(plus, "Add a day");
    plus.addEventListener("click", (): void => {
        const last: Slot = days.slots[days.slots.length - 1];
        days.slots.push({ weekday: 0, start: last.start, end: last.end });
        days.before.push(0);
        filled();
    });
    return days.slots.map((slot: Slot, index: number): HTMLElement => {
        const value: HTMLElement = elementOf("div", "series-slot", "");
        const remove: HTMLButtonElement = document.createElement("button");
        remove.type = "button";
        crossPut(remove, "Remove the day");
        remove.addEventListener("click", (): void => {
            days.slots.splice(index, 1);
            days.before.splice(index, 1);
            filled();
        });
        value.append(choicesOf({
            search: searchOf(weekdays), picked: slot.weekday === 0 ? [] : [String(slot.weekday)], many: false,
            adding: false, noun: "day",
            pick: (values: string[]): void => {
                const weekday: number = Number(values[0] ?? slot.weekday);
                daysMove(days, slot.weekday, weekday);
                slot.weekday = weekday;
                filled();
            },
        }), rangeOf(fieldOf("time-field", slot.start, "Start", (time: string): void => {
            slot.start = time;
        }, changed), fieldOf("time-field", slot.end, "End", (time: string): void => {
            slot.end = time;
        }, changed)), ...(days.slots.length > 1 ? [remove] : []));
        const row: HTMLElement = rowOf(index === 0 ? "Day" : "", value);
        if (index === 0)
            row.querySelector(".entry-name")?.append(plus);
        return row;
    });
}

/**
 * Makes the row of the first and the last day of a series, side by side with the range dash between them,
 * like `19.10.2026 – 01.02.2027`.
 *
 * @param days - The days of the series
 * @param changed - Tells the form that the series changed
 * @returns The row
 */
export function datesRowOf(days: Days, changed: () => void): HTMLElement {
    return rowOf("Dates", rangeOf(fieldOf("date-field", days.first === "" ? "" : dateTextOf(days.first), "First day",
        (day: string): void => {
            days.first = day;
        }, changed), fieldOf("date-field", days.last === "" ? "" : dateTextOf(days.last), "Last day",
        (day: string): void => {
            days.last = day;
        }, changed)));
}

/**
 * Makes the row of the days a series leaves out: each day with its `×`, which takes it back, then a field to type one
 * more, like `24.12.2026`, taken once it is a day, by Enter or as I leave the field; a day taken stands among
 * the others by its date, before the field, which stays where it is, the cursor in it.
 * - `excepts`: The days and the field.
 * - `input`: The field.
 * - `show`: Shows the days left out before the field, in order.
 * - `take`: Takes the day typed.
 *
 * @param days - The days of the series
 * @param changed - Tells the form that the series changed
 * @returns The row
 */
export function exceptRowOf(days: Days, changed: () => void): HTMLElement {
    const excepts: HTMLElement = elementOf("div", "series-excepts", "");
    const input: HTMLInputElement = fieldOf("date-field", "", "Day to leave out", (): void => {}, changed);
    const show: () => void = (): void => {
        excepts.querySelectorAll(".series-except").forEach((except: Element): void => except.remove());
        input.before(...days.excepts.map((day: string): HTMLElement => {
            const except: HTMLElement = elementOf("span", "series-except", dateTextOf(day));
            const remove: HTMLButtonElement = document.createElement("button");
            remove.type = "button";
            crossPut(remove, `Remove ${dateTextOf(day)}`);
            remove.addEventListener("click", (): void => {
                days.excepts = days.excepts.filter((other: string): boolean => other !== day);
                show();
                changed();
            });
            except.append(remove);
            return except;
        }));
    };
    const take: () => void = (): void => {
        const day: string | null = dateParse(input.value);
        if (day === null || days.excepts.includes(day))
            return;
        days.excepts = [...days.excepts, day].sort();
        input.value = "";
        show();
        changed();
    };
    input.placeholder = "dd.mm.yyyy";
    input.addEventListener("keydown", (event: KeyboardEvent): void => {
        if (event.key !== "Enter" || event.ctrlKey)
            return;
        event.preventDefault();
        event.stopPropagation();
        take();
    });
    input.addEventListener("change", take);
    excepts.append(input);
    show();
    return rowOf("Except", excepts);
}

/**
 * Makes the row of the boxes a series makes, empty until they show, see {@link previewSoon}.
 *
 * @returns The row
 */
export function boxesRowOf(): HTMLElement {
    return rowOf("Boxes", elementOf("div", "series-preview", ""));
}

/**
 * Shows the boxes a series makes in the row of its boxes, see {@link boxesRowOf}, as the reader answers, see the top
 * of this file, or the hint in their place; nothing while the series is not typed enough, or the reader does not take
 * it, and only the answer to the last question.
 * - `preview`: The place of the preview, `null` while the form has none.
 * - `asked`: The number of this question.
 * - `answer`: What the reader answered.
 * - `planned`: The boxes, without those removed.
 * - `items`: The boxes and the days left out, each its day with its element.
 *
 * @param form - The form of the series, which holds the row of its boxes
 * @param ask - Asks the reader what the series makes: its boxes, or a hint why it makes none, shown in their place;
 *   `null` while the series is not typed enough
 * @param excepts - The days it leaves out, shown among its boxes, see {@link exceptsWithin}
 * @throws {Error} - When the reader does not answer
 */
async function previewShow(form: HTMLElement, ask: (() => Promise<Planned[] | string>) | null,
                           excepts: string[]): Promise<void> {
    const preview: HTMLElement | null = form.querySelector(".series-preview");
    const asked: number = ++previewsAsked;
    if (preview === null)
        return;
    if (ask === null) {
        preview.replaceChildren();
        return;
    }
    let answer: Planned[] | string;
    try {
        answer = await ask();
    } catch (error: unknown) {
        if (asked === previewsAsked)
            preview.replaceChildren();
        throw error;
    }
    if (asked !== previewsAsked)
        return;
    if (typeof answer === "string") {
        preview.replaceChildren(elementOf("p", "entry-none", answer));
        return;
    }
    const planned: Planned[] = answer.filter((box: Planned): boolean => box.change !== "removed");
    const items: [string, HTMLElement][] = [
        ...planned.map((box: Planned): [string, HTMLElement] => {
            const chip: HTMLElement = elementOf("span", `series-chip series-chip-${box.state}`, "");
            chip.append(...(box.state === "done" ? [iconOf(Check)] : []), box.number === "NONE" ? "–" : box.number);
            return [box.day, chip];
        }),
        ...excepts.map((day: string): [string, HTMLElement] => [day, elementOf("span", "series-chip series-chip-none",
            "·")]),
    ].sort((first: [string, HTMLElement], second: [string, HTMLElement]): number => first[0].localeCompare(second[0]));
    preview.replaceChildren(...items.map(([day, chip]: [string, HTMLElement]): HTMLElement => {
        const item: HTMLElement = elementOf("span", "series-preview-item", "");
        item.append(chip, elementOf("span", "series-preview-day", dateTextOf(day).slice(0, 5)));
        return item;
    }), elementOf("span", "series-preview-count", `${planned.length} boxes`));
}

/**
 * Shows anew the boxes a series makes a moment after the typing rests, see {@link previewShow}, so typing asks
 * the reader once; a change before then takes the place of the one waiting.
 *
 * @param form - The form of the series, which holds the row of its boxes
 * @param ask - Asks the reader what the series makes, see {@link previewShow}; `null` while it is not typed enough
 * @param excepts - The days it leaves out, shown among its boxes
 */
export function previewSoon(form: HTMLElement, ask: (() => Promise<Planned[] | string>) | null,
                            excepts: string[]): void {
    clearTimeout(previewWait);
    previewWait = window.setTimeout((): void => {
        previewShow(form, ask, excepts).catch((error: unknown): void => console.error(error));
    }, 150);
}
