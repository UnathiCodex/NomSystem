/**
 * ## Series
 *
 * The one form of a series of my course, the lectures, exercises, tutorials and sheets of a module in a semester,
 * see `reader/course.ts`, wherever I change it: from the day, by `Series` in the menu `⋯` of one of its boxes or by the
 * pencil below the fields of a box of it, see `./boxes.ts` and `./categories.ts`, and from the page of its module,
 * by the pencil of its card or the plus of a new series, see `../editor/course.ts`; the same dialog in both places,
 * {@link seriesOpen}, so changing a series here or there is one and the same.
 * It looks like the dialog of an entry, one row per field, see `./choices.ts`: what the series is, as its boxes are
 * written, like `IN2028_BusinessAnalyticsMachineLearning (VO)`, its type picked for a new one; of a type with groups
 * my group, which made another one makes that group mine from its next session on; then when it meets: its days,
 * each a weekday with its times, `+` beside them for one more, like a lecture on Mondays 14:00–16:00 and on Thursdays
 * 10:00–12:00, numbered across both; its first and last day; then its boxes, see below, which also leave out a day,
 * bring it back and add an extra, a single date besides its weeks with its times; then its place, picked as in
 * the dialog, the rooms of the university among them as I type; what it does online, its platform with the link
 * and the passcode of its meetings; and who I am with. At the bottom the plan it writes into, small and grey,
 * Cancel and Save.
 * Nothing is written before I save: then the reader changes only open boxes from today on, a box done, skipped,
 * cancelled or pushed staying as it is, and numbers the series anew, see `seriesApply` in `reader/course.ts`.
 * Enter confirms only its field, Ctrl+Enter saves, Escape and a click beside it cancel.
 *
 * The boxes a series makes stay one calm line, see {@link previewSoon}, as the reader would write them, anew a moment
 * after each change: how many, then grey what to know, like `14 entries · 1 done · 2 left out`, and what a change
 * does, like `1 new · 2 changed`, their first and last day already in `Dates`;
 * a tap on it opens them below it as a list by month, the month short where the names of the rows stand, like
 * `Oct 2026`, each box one small grey box across the dialog, as a block of a section in the tree: its number, `–` for
 * one the university cancelled, its weekday and day, like `Friday, 16.10.2026`, grey its times and what the change
 * does to it, `extra` for an extra, and at its right its `⋯` while open, else the icon of its state as in the plan,
 * never its word: the check of one done, the cross of one I skipped, the calendar crossed out of one the university
 * cancelled, the arrow of one I pushed; a day left out stands among them grey, with the icon that brings it back.
 * The `⋯` skips a box, marks it cancelled by the university or leaves its day out, an extra removed instead, an icon
 * takes its state back; `+ Date` below the list adds an extra, its day to type, the times of the series to change,
 * a day left out brought back instead, numbered by its day as every box, see `numbersOf` in `reader/course.ts`;
 * each only in the form until I save, so a box done is only shown.
 * The row `Repeat` of a new box in the dialog of an entry has the same rows of days, dates and boxes,
 * see `./categories.ts`.
 *
 * - `./choices.ts`: The dashboard's own pickers, the rows of a form and the parts of a field.
 * - `./times.ts`: Starts the fields of times and days, and reads and writes times and days.
 * - `./places.ts`: Gives the name, the address and the parts of a place, its choice in a list, and adds a platform.
 * - `./entries.ts`: Gives the standard address of a name.
 * - `../skill/attempts.ts`: Writes a date as a day, and names the category of skill boxes.
 * - `../food/foods.ts`: Makes elements.
 * - `../icons.ts`: Puts the icons into the buttons, the plus that adds and the cross that takes back.
 * - `../menu.ts`: Puts the actions of a box behind one button `⋯`.
 * - `../reader.ts`: Asks the reader.
 * - `lucide`: The icons of the states of a box, of leaving a day out and bringing it back, of `+ Date`, of Cancel
 *   and of Save.
 * - `./series.css`: Look of the rows, of the boxes and of the dialog.
 */

import { breakableOf, choiceOf, choicesOf, pairOf, partFieldOf, partOf, rowOf, searchOf } from "./choices.ts";
import { dateFieldStart, dateParse, dateTextOf, timeFieldRead, timeFieldStart, timeOf } from "./times.ts";
import { addressOf, labelOf, placeChoiceOf, platformSend } from "./places.ts";
import { standardAddressOf } from "./entries.ts";
import { dayOf, skillName } from "../skill/attempts.ts";
import { elementOf } from "../food/foods.ts";
import { crossPut, iconOf, iconPut, plusPut } from "../icons.ts";
import { menuItemOf, menuOf } from "../menu.ts";
import { readerAsk } from "../reader.ts";
import { ArrowRight, CalendarMinus, CalendarOff, CalendarPlus, Check, Plus, X } from "lucide";
import "./series.css";

import type { Box, BoxState } from "./boxes.ts";
import type { Category, Field } from "./categories.ts";
import type { Choice } from "./choices.ts";
import type { Attendee, Online } from "./entries.ts";
import type { Platform } from "./places.ts";
import type { IconNode } from "lucide";


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
 * An extra of a series, a single date besides its weeks, as the reader takes it, see `Extra` in `reader/course.ts`.
 *
 * - `day`: Its day, like `2026-11-14`, empty while not typed as a day.
 * - `start`, `end`: Its times in Berlin time, like `10:00` and `12:00`, empty for none.
 */
export type Extra = {
    day: string;
    start: string;
    end: string;
};

/**
 * The days of a series as typed so far, see the top of this file.
 *
 * - `slots`: Its weekdays with their times, in the order of their rows.
 * - `before`: For each slot, the weekday of the slot of the series as read back whose boxes it takes, 0 for a slot
 *   added, all of them 0 for a new series, see `before` of `SeriesChange` in `reader/course.ts`.
 * - `extras`: Its single dates besides its weeks, in the order of their rows.
 * - `first`, `last`: Its first and last day, like `2026-10-19`, empty while not typed as a day.
 * - `excepts`: The days it leaves out, in order.
 */
export type Days = {
    slots: Slot[];
    before: number[];
    extras: Extra[];
    first: string;
    last: string;
    excepts: string[];
};

/**
 * A box of a series, as the reader sends it for the preview, see `Planned` in `reader/course.ts`: its identifier,
 * empty for a new one, its day, its time as ISO instant, empty for none, and its length in minutes, `null` for none,
 * its number, like `2`, `NONE` for one the university cancelled, empty for none, its state, `new` for a new one,
 * whether I pushed it, whether I may skip it or mark it cancelled, and what the change does to it.
 */
export type Planned = {
    id: string;
    day: string;
    time: string;
    minutes: number | null;
    number: string;
    state: BoxState | "new";
    pushed: boolean;
    editable: boolean;
    change: "new" | "changed" | "renumbered" | "removed" | "";
};

/**
 * The state I gave a box of a series in its form, by its identifier, until I save, see `states` of `SeriesChange`
 * in `reader/course.ts`.
 */
export type States = { [id: string]: BoxState };

/**
 * How the boxes of a series show, see {@link previewSoon}.
 *
 * - `ask`: Asks the reader what the series makes: its boxes, or a hint why it makes none, shown in their place;
 *   `null` while the series is not typed enough.
 * - `days`: The days of the series, whose days left out show among its boxes and which a row changes.
 * - `states`: The states I gave its boxes, which a row changes.
 * - `filled`: Builds the rows of the form anew from what it holds, once a row of a box changed it.
 */
export type Preview = {
    ask: (() => Promise<Planned[] | HTMLElement>) | null;
    days: Days;
    states: States;
    filled: () => void;
};

/**
 * A weekly rule of a series or a group, as the reader sends it and the form sends it back, see `Rule`
 * in `reader/course.ts`: its type, like `VO`, its slots and extras, its place with its link, what it does online,
 * who I am with, its first and last day, the days it leaves out, its group, like `03`, of my tutorials my group,
 * empty for none, and its semester, like `2026W`.
 */
export type Rule = Online & {
    type: string;
    slots: Slot[];
    extras: Extra[];
    location: string;
    locationLink: string;
    attendees: Attendee[];
    first: string;
    last: string;
    excepts: string[];
    group: string;
    semester: string;
};

/**
 * A series of the course, as the reader sends it: its rule read back from its boxes, and how many boxes it has.
 */
export type Series = {
    rule: Rule;
    count: number;
};

/**
 * A session of a group, as the reader sends it: its start as ISO instant and its length in minutes.
 */
export type Session = {
    start: string;
    minutes: number;
};

/**
 * A group of the tutorials of a module, as the reader sends it: its identifier, its rule with its group, like `03`,
 * and its sessions, the earliest first.
 */
export type Group = {
    id: string;
    rule: Rule;
    sessions: Session[];
};

/**
 * The course of a module in a semester, as the reader sends it, see `Course` in `reader/course.ts`.
 *
 * - `module`: Name of the folder of the module, like `IN2028_BusinessAnalyticsMachineLearning`.
 * - `semester`: The semester, like `2026W`.
 * - `boxes`: Its skill boxes of the semester, of every type, the earliest first.
 * - `series`: Its series, one per numbered type with boxes.
 * - `groups`: Its groups, by type and group.
 * - `folders`: The folder of the material of the semester of each type that has one, like
 *   `VO_UniversityLectureLessons/TUM_2026W` for `VO`.
 * - `file`: Its plan, like `University/IN2028_BusinessAnalyticsMachineLearning_Plan.ics`.
 */
export type Course = {
    module: string;
    semester: string;
    boxes: Box[];
    series: Series[];
    groups: Group[];
    folders: { [type: string]: string };
    file: string;
};

/**
 * The form of a series as typed so far, see {@link seriesOpen}: its days, see {@link Days}, their `before`
 * the weekdays of the slots of `old` whose boxes they take, and:
 *
 * - `type`: Its type, like `VO`, empty while none is picked.
 * - `old`: The rule as read back when the form opened, `null` for a new series.
 * - `location`, `locationLink`: Its place with its link.
 * - `online`, `onlineLink`, `passcode`: What its boxes do online.
 * - `attendees`: Who I am with.
 * - `group`: Of the tutorials of a module with groups the group picked, like `03`; one other than that of `old`
 *   makes the group mine, see `groupMine` in `reader/course.ts`; empty for none.
 * - `states`: The states I gave its boxes.
 */
type Form = Days & Online & {
    type: string;
    old: Rule | null;
    location: string;
    locationLink: string;
    attendees: Attendee[];
    group: string;
    states: States;
};

/**
 * Types of a series, which carry their number and which the university may cancel, see `numberedTypes`
 * in `reader/boxes.ts`.
 */
export const numberedTypes: string[] = ["VO", "UE", "ZU", "TU", "HU"];

/**
 * Waiting preview after a change, so typing asks the reader once, a moment after it rests, see {@link previewSoon}.
 */
let previewWait: number = 0;

/**
 * How many previews were asked for, so only the answer to the last one shows.
 */
let previewsAsked: number = 0;

/**
 * What the boxes of the form showed last, so the rows built anew show it at once until the reader answers again,
 * see {@link boxesRowOf}; none before the first answer.
 */
let previewShown: Node[] = [];

/**
 * Whether the boxes of the form show as a list below their line, opened and closed by a tap on it.
 */
let listOpened: boolean = false;

/**
 * The extra being typed below the list of the boxes, see {@link draftRowOf}, `null` while none is.
 */
let extraTyped: Extra | null = null;

/**
 * The course whose series the dialog shows, `null` before it opened.
 */
let course: Course | null = null;

/**
 * The form of the series in the dialog, `null` while it is closed.
 */
let typing: Form | null = null;

/**
 * The categories with the values of their fields, for the places and the people of the form, as loaded last.
 */
let categories: Category[] = [];

/**
 * Whether the dialog started, its buttons and keys, see {@link dialogStart}.
 */
let dialogStarted: boolean = false;


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
export function dayAdd(day: string, days: number): string {
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
 * Writes a slot as the heading of a card, a row of the table of the groups and a group in a list read it.
 *
 * @param slot - The slot
 * @returns Text like `Mon 14:00–16:00`
 */
export function slotTextOf(slot: Slot): string {
    return `${weekdayNameOf(slot.weekday, false)} ${slot.start}–${slot.end}`;
}

/**
 * Writes the room of a place short, as the rule of a series and the row of a box name it: a room of the university by
 * its code, like `5416.01.003` of `5416.01.003 (Hörsaal 2 "Interims II")`, any other place by its name,
 * like `Zoom`, see `labelOf` in `./places.ts`.
 *
 * @param line - Place as an entry writes it
 * @returns The room, empty for no place
 */
export function roomOf(line: string): string {
    return /^\d{4}\.\S+\.\S+/.test(labelOf(line)) ? labelOf(line).split(" ")[0] : labelOf(line);
}

/**
 * Tells whether a box of the plan is one of a series of my course, which its menu and its dialog open, see the top
 * of this file: a skill box of a numbered type with its number.
 *
 * @param box - The box
 * @returns Whether it is one
 */
export function seriesHas(box: Box): boolean {
    return box.category === skillName && numberedTypes.includes(box.type) && box.number !== "";
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
 * Tells whether a start and an end are typed enough: both a time, the start before the end.
 *
 * @param times - A slot or an extra
 * @returns Whether they are
 */
function timesReady(times: Slot | Extra): boolean {
    return times.start !== "" && times.end !== "" && times.start < times.end;
}

/**
 * Tells whether the days of a series are typed enough to make boxes: each a weekday, each once, with a start before
 * its end, each extra a day with a start before its end, and a first day on or before its last.
 *
 * @param days - The days of the series
 * @returns Whether they are
 */
export function daysReady(days: Days): boolean {
    return days.slots.every((slot: Slot): boolean => slot.weekday > 0 && timesReady(slot))
        && new Set(days.slots.map((slot: Slot): number => slot.weekday)).size === days.slots.length
        && days.extras.every((extra: Extra): boolean => extra.day !== "" && timesReady(extra))
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
 * Makes a field of a time or a day of a series, as the dialog has them, see `./times.ts`: plain, a time as wide as
 * its grey `hh:mm`, a day as wide as its value, checking itself; what I type goes into the series as I type it,
 * read as a time or a day.
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
 * Makes the fields of the times of a slot or an extra side by side, like `14:00 – 16:00`, see {@link rangeOf}.
 *
 * @param times - The slot or the extra, which takes what I type
 * @param changed - Tells the form that the series changed
 * @returns The two
 */
function timesRangeOf(times: Slot | Extra, changed: () => void): HTMLElement {
    return rangeOf(fieldOf("time-field", times.start, "Start", (time: string): void => {
        times.start = time;
    }, changed), fieldOf("time-field", times.end, "End", (time: string): void => {
        times.end = time;
    }, changed));
}

/**
 * Makes the button `×` that takes a day or an extra of a series back.
 * - `remove`: The button.
 *
 * @param words - What it takes back, its tooltip, like `Remove the day`
 * @param click - Takes it back
 * @returns The button
 */
function removeOf(words: string, click: () => void): HTMLButtonElement {
    const remove: HTMLButtonElement = document.createElement("button");
    remove.type = "button";
    crossPut(remove, words);
    remove.addEventListener("click", click);
    return remove;
}

/**
 * Makes the plus beside the name of a row that adds one more, like a day of a series.
 * - `plus`: The button.
 *
 * @param words - What it adds, its tooltip, like `Add a day`
 * @param click - Adds it
 * @returns The button
 */
function plusOf(words: string, click: () => void): HTMLButtonElement {
    const plus: HTMLButtonElement = document.createElement("button");
    plus.type = "button";
    plusPut(plus, words);
    plus.addEventListener("click", click);
    return plus;
}

/**
 * Makes the rows of the days of a series, each its weekday, picked from a list, grey `ddd` while none is picked,
 * as a time says `hh:mm`, and its times, with its `×` while there are several; `+` beside the name of the first adds one more, with the times of the last; a weekday picked anew
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
        ({ value: String(weekday), text: weekdayNameOf(weekday, false), group: "" }));
    const plus: HTMLButtonElement = plusOf("Add a day", (): void => {
        const last: Slot = days.slots[days.slots.length - 1];
        days.slots.push({ weekday: 0, start: last.start, end: last.end });
        days.before.push(0);
        filled();
    });
    return days.slots.map((slot: Slot, index: number): HTMLElement => {
        const value: HTMLElement = elementOf("div", "series-slot", "");
        value.append(choicesOf({
            search: searchOf(weekdays), picked: slot.weekday === 0 ? [] : [String(slot.weekday)], many: false,
            adding: false, noun: "day", empty: "ddd",
            pick: (values: string[]): void => {
                const weekday: number = Number(values[0] ?? slot.weekday);
                daysMove(days, slot.weekday, weekday);
                slot.weekday = weekday;
                filled();
            },
        }), timesRangeOf(slot, changed), ...(days.slots.length > 1 ? [removeOf("Remove the day", (): void => {
            days.slots.splice(index, 1);
            days.before.splice(index, 1);
            filled();
        })] : []));
        const row: HTMLElement = rowOf(index === 0 ? "Day" : "", value);
        if (index === 0)
            row.querySelector(".entry-name")?.append(plus);
        return row;
    });
}

/**
 * Makes the row of the first and the last day of a series, side by side with the range dash between them,
 * like `19.10.2026 – 01.02.2027`, each saying grey `dd.mm.yyyy` while empty, as the day of a deadline.
 * - `first`, `last`: The fields of the first and the last day.
 *
 * @param days - The days of the series
 * @param changed - Tells the form that the series changed
 * @returns The row
 */
export function datesRowOf(days: Days, changed: () => void): HTMLElement {
    const first: HTMLInputElement = fieldOf("date-field", days.first === "" ? "" : dateTextOf(days.first), "First day",
        (day: string): void => {
            days.first = day;
        }, changed);
    const last: HTMLInputElement = fieldOf("date-field", days.last === "" ? "" : dateTextOf(days.last), "Last day",
        (day: string): void => {
            days.last = day;
        }, changed);
    first.placeholder = "dd.mm.yyyy";
    last.placeholder = "dd.mm.yyyy";
    return rowOf("Dates", rangeOf(first, last));
}

/**
 * Makes the row of the boxes a series makes, showing what it showed last until the reader answers again,
 * see {@link previewSoon}.
 * - `preview`: The place of the boxes.
 *
 * @returns The row
 */
export function boxesRowOf(): HTMLElement {
    const preview: HTMLElement = elementOf("div", "series-preview", "");
    preview.append(...previewShown);
    return rowOf("Boxes", preview);
}

/**
 * Forgets what the boxes of a form showed, and folds their list, as a form of another series or another new box opens.
 */
export function previewForget(): void {
    clearTimeout(previewWait);
    previewsAsked += 1;
    previewShown = [];
    listOpened = false;
    extraTyped = null;
}

/**
 * Writes how many there are of something, like `2 left out`, or nothing for none.
 *
 * @param count - How many
 * @param words - What they are, like `left out`
 * @returns The part, none for none
 */
function countOf(count: number, words: string): string[] {
    return count === 0 ? [] : [`${count} ${words}`];
}

/**
 * Makes the line of the boxes of a series, see the top of this file: the fold arrow, how many entries there are,
 * white, then grey what a change does to them, while the series had boxes before, a box removed by a day left out
 * counted only as left out, and how many are done, skipped, cancelled, pushed and left out; a tap opens and closes
 * the list below it.
 * - `kept`: The boxes after the change, without those it removes.
 * - `had`: Whether the series had boxes before.
 * - `counted`: How many boxes of a state or a change there are.
 * - `line`: The line, a button.
 * - `parts`: Its grey parts.
 *
 * @param planned - The boxes as the reader would write them, removed ones too
 * @param left - The days left out, see {@link exceptsWithin}
 * @param toggle - Opens or closes the list
 * @returns The line
 */
function summaryOf(planned: Planned[], left: string[], toggle: () => void): HTMLButtonElement {
    const kept: Planned[] = planned.filter((box: Planned): boolean => box.change !== "removed");
    const had: boolean = planned.some((box: Planned): boolean => box.id !== "");
    const counted: (keep: (box: Planned) => boolean) => number = (keep: (box: Planned) => boolean): number =>
        planned.filter(keep).length;
    const line: HTMLButtonElement = document.createElement("button");
    const parts: string[] = [
        ...had ? countOf(counted((box: Planned): boolean => box.change === "new"), "new") : [],
        ...countOf(counted((box: Planned): boolean => box.change === "changed"), "changed"),
        ...countOf(counted((box: Planned): boolean => box.change === "removed" && !left.includes(box.day)),
            "removed"),
        ...countOf(counted((box: Planned): boolean => box.change !== "removed" && box.state === "done"), "done"),
        ...countOf(counted((box: Planned): boolean => box.state === "dropped"), "skipped"),
        ...countOf(counted((box: Planned): boolean => box.state === "university"), "cancelled"),
        ...countOf(counted((box: Planned): boolean => box.pushed), "pushed"),
        ...countOf(left.length, "left out"),
    ];
    line.type = "button";
    line.className = "series-summary";
    line.setAttribute("aria-expanded", String(listOpened));
    line.append(elementOf("span", "series-count", `${kept.length} ${kept.length === 1 ? "entry" : "entries"}`),
        ...parts.map((part: string): HTMLElement => elementOf("span", "entry-parted", part)));
    line.addEventListener("click", toggle);
    return line;
}

/**
 * Makes the icon of the state of a box in its row, as the plan shows it: a button that takes the state back,
 * see {@link States}, where it can be, else the icon alone.
 * - `mark`: The icon, a button or alone.
 *
 * @param icon - Icon, like `X`
 * @param word - The state, its tooltip, like `Skipped`
 * @param back - Takes the state back, `null` where it cannot be taken back
 * @returns The icon
 */
function markOf(icon: IconNode, word: string, back: (() => void) | null): HTMLElement {
    const mark: HTMLElement = document.createElement(back === null ? "span" : "button");
    if (mark instanceof HTMLButtonElement && back !== null) {
        mark.type = "button";
        mark.addEventListener("click", back);
    }
    mark.className = "box-state";
    iconPut(mark, icon, word);
    return mark;
}

/**
 * Makes what stands at the right of the row of a box, see the top of this file: its `⋯` while open or new, with `Skip`
 * and `Cancel` for a box I may give another state, and `Leave out` for one from today on whose day the series makes,
 * a day of its slots, which leaves that day out, or `Remove` for an extra, which takes it back; else the icon of its
 * state, see {@link markOf}, a skipped or cancelled box taking it back, a pushed or done box only shown.
 * - `today`: Today's date.
 * - `extra`: The extra on its day, `undefined` for none.
 * - `stated`: Gives the state to a box, until I save.
 * - `items`: The items of the menu.
 *
 * @param box - The box
 * @param preview - How the boxes show
 * @returns The `⋯` with its menu, or the icon
 */
function actionOf(box: Planned, preview: Preview): HTMLElement {
    const days: Days = preview.days;
    const today: string = dayOf(new Date());
    const extra: Extra | undefined = days.extras.find((one: Extra): boolean => one.day === box.day);
    const stated: (state: BoxState) => () => void = (state: BoxState): () => void => (): void => {
        preview.states[box.id] = state;
        preview.filled();
    };
    if (box.state === "done")
        return markOf(Check, "Done", null);
    if (box.state === "dropped")
        return markOf(X, "Skipped", box.editable ? stated("open") : null);
    if (box.state === "university")
        return markOf(CalendarOff, "Cancelled", box.editable ? stated("open") : null);
    if (box.change === "removed")
        return elementOf("span", "box-state", "");
    const items: HTMLButtonElement[] = [
        ...box.id !== "" && box.editable ? [menuItemOf(X, "Skip", stated("dropped")),
            menuItemOf(CalendarOff, "Cancel", stated("university"))] : [],
        ...box.day >= today && !box.pushed && (extra !== undefined || days.slots
            .some((slot: Slot): boolean => slot.weekday === weekdayOf(box.day)))
            ? [menuItemOf(CalendarMinus, extra !== undefined ? "Remove" : "Leave out", (): void => {
                if (extra !== undefined)
                    days.extras.splice(days.extras.indexOf(extra), 1);
                else
                    days.excepts = [...days.excepts, box.day].sort();
                preview.filled();
            })] : [],
    ];
    if (box.pushed && items.length === 0)
        return markOf(ArrowRight, "Pushed", null);
    return items.length === 0 ? elementOf("span", "box-state", "") : menuOf(items);
}

/**
 * Writes the day of a box or of a day left out in the list whole, with its year.
 *
 * @param day - The day, like `2026-10-16`
 * @returns Text like `Friday, 16.10.2026`
 */
function listDayOf(day: string): string {
    return `${weekdayNameOf(weekdayOf(day), true)}, ${dateTextOf(day)}`;
}

/**
 * Makes the row of a box in the list, see the top of this file: its number, `–` for one the university cancelled,
 * none for one the change removes, its weekday and day, see {@link listDayOf}, grey its times, like `14:00 – 16:00`,
 * and what the change does to it, like `new`, but while every box is new, `extra` after it for an extra, like
 * `new extra`, `pushed` for a box I pushed whose `⋯` stands in place of the arrow, then its `⋯` or its state,
 * see {@link actionOf}; greyed while not open, done, skipped, cancelled or removed, as in the plan.
 * - `row`: The row.
 * - `start`: Its start, `null` for none.
 * - `times`: Its times.
 * - `word`: What the change does to it, that I pushed it, and that it is an extra.
 *
 * @param box - The box
 * @param had - Whether the series had boxes before, so a new one says so
 * @param preview - How the boxes show
 * @returns The row
 */
function boxRowOf(box: Planned, had: boolean, preview: Preview): HTMLElement {
    const row: HTMLElement = elementOf("div", "series-row", "");
    const start: Date | null = box.time === "" ? null : new Date(box.time);
    let times: string = start === null ? "" : timeOf(start);
    if (start !== null && box.minutes !== null)
        times = `${times} – ${timeOf(new Date(start.getTime() + box.minutes * 60 * 1000))}`;
    let word: string = box.change === "renumbered" || (box.change === "new" && !had) ? "" : box.change;
    if (word === "" && box.pushed && box.editable && box.state === "open")
        word = "pushed";
    if (preview.days.extras.some((extra: Extra): boolean => extra.day === box.day))
        word = word === "" ? "extra" : `${word} extra`;
    row.classList.toggle("series-row-faded", box.change === "removed"
        || ["done", "dropped", "university"].includes(box.state));
    row.append(elementOf("span", "series-number", box.change === "removed" ? "" : box.number.replace("NONE", "–")),
        elementOf("span", "series-day", listDayOf(box.day)), elementOf("span", "series-times", times),
        elementOf("span", "series-word", word), actionOf(box, preview));
    return row;
}

/**
 * Makes the row of a day left out in the list: no number, its weekday and day, see {@link listDayOf}, and at its
 * right the icon that brings it back until I save, which says it is left out.
 * - `row`: The row.
 *
 * @param day - The day, like `2026-12-28`
 * @param preview - How the boxes show
 * @returns The row
 */
function leftRowOf(day: string, preview: Preview): HTMLElement {
    const row: HTMLElement = elementOf("div", "series-row series-row-faded", "");
    row.append(elementOf("span", "series-number", ""), elementOf("span", "series-day", listDayOf(day)),
        elementOf("span", "series-times", ""), elementOf("span", "series-word", ""),
        markOf(CalendarPlus, "Bring back", (): void => {
            preview.days.excepts = preview.days.excepts.filter((other: string): boolean => other !== day);
            preview.filled();
        }));
    return row;
}

/**
 * Makes the line `+ Date` below the list, the plus where the numbers stand, `Date` where the days stand, which opens
 * the row of an extra to type, see {@link draftRowOf}, with the times of the last day of the series.
 * - `add`: The line, a button.
 * - `plus`: The place of the plus.
 * - `last`: The last day of the series.
 *
 * @param preview - How the boxes show
 * @param redraw - Shows the list anew
 * @returns The line
 */
function addRowOf(preview: Preview, redraw: () => void): HTMLButtonElement {
    const add: HTMLButtonElement = document.createElement("button");
    const plus: HTMLElement = elementOf("span", "series-number", "");
    add.type = "button";
    add.className = "series-row series-add";
    add.setAttribute("aria-label", "Add a date");
    plus.append(iconOf(Plus));
    add.append(plus, elementOf("span", "series-day", "Date"));
    add.addEventListener("click", (): void => {
        const last: Slot = preview.days.slots[preview.days.slots.length - 1];
        extraTyped = { day: "", start: last.start, end: last.end };
        redraw();
        document.querySelector<HTMLInputElement>(".series-draft .date-field")?.focus();
    });
    return add;
}

/**
 * Makes the row of an extra being typed below the list, as a box stands in it: its day, grey `dd.mm.yyyy` while
 * empty, its times, those of the series at first, and its `×`, which takes it back. Typed enough, a day with a start
 * before its end, it joins the series as the focus leaves the row, by Enter too, and stands in the list by its day;
 * a day left out brought back instead; one taken back by its `×` never, though its field loses the focus as the list
 * shows anew.
 * - `row`: The row.
 * - `day`: The field of its day.
 *
 * @param extra - The extra being typed
 * @param preview - How the boxes show
 * @param redraw - Shows the list anew
 * @returns The row
 */
function draftRowOf(extra: Extra, preview: Preview, redraw: () => void): HTMLElement {
    const row: HTMLElement = elementOf("div", "series-row series-draft", "");
    const day: HTMLInputElement = fieldOf("date-field", extra.day === "" ? "" : dateTextOf(extra.day),
        "Day of the extra", (typed: string): void => {
            extra.day = typed;
        }, (): void => {});
    day.placeholder = "dd.mm.yyyy";
    row.append(elementOf("span", "series-number", ""), day, timesRangeOf(extra, (): void => {}),
        elementOf("span", "series-word", ""), removeOf("Take the date back", (): void => {
            extraTyped = null;
            redraw();
        }));
    row.addEventListener("focusout", (event: FocusEvent): void => {
        if (extraTyped !== extra || row.contains(event.relatedTarget as Node | null) || extra.day === ""
            || !timesReady(extra))
            return;
        extraTyped = null;
        if (preview.days.excepts.includes(extra.day))
            preview.days.excepts = preview.days.excepts.filter((other: string): boolean => other !== extra.day);
        else
            preview.days.extras.push(extra);
        preview.filled();
    });
    return row;
}

/**
 * Makes the list of the boxes of a series, see the top of this file: the boxes and the days left out by their days,
 * each month short at the left, like `Oct 2026`, where the names of the rows stand, its boxes beside it; a box a day
 * left out removes stands as that day, once; below them `+ Date`, see {@link addRowOf}, or the extra being typed,
 * see {@link draftRowOf}.
 * - `had`: Whether the series had boxes before.
 * - `items`: Each box and day left out with its place in time and its row.
 * - `list`: The list.
 * - `month`: The month of the row before, empty before the first.
 * - `boxes`: The boxes of that month.
 *
 * @param planned - The boxes as the reader would write them, removed ones too
 * @param left - The days left out
 * @param preview - How the boxes show
 * @param redraw - Shows the list anew
 * @returns The list
 */
function boxListOf(planned: Planned[], left: string[], preview: Preview, redraw: () => void): HTMLElement {
    const had: boolean = planned.some((box: Planned): boolean => box.id !== "");
    const items: [string, HTMLElement][] = [
        ...planned.filter((box: Planned): boolean => !(box.change === "removed" && left.includes(box.day)))
            .map((box: Planned): [string, HTMLElement] => [box.time || box.day, boxRowOf(box, had, preview)]),
        ...left.map((day: string): [string, HTMLElement] => [day, leftRowOf(day, preview)]),
    ].sort((first: [string, HTMLElement], second: [string, HTMLElement]): number => first[0].localeCompare(second[0]));
    const list: HTMLElement = elementOf("div", "series-list", "");
    let month: string = "";
    let boxes: HTMLElement = list;
    items.forEach(([moment, row]: [string, HTMLElement]): void => {
        const name: string = new Date(`${moment.slice(0, 10)}T12:00:00`)
            .toLocaleDateString("en-GB", { month: "short", year: "numeric" });
        if (name !== month) {
            boxes = elementOf("div", "series-boxes", "");
            list.append(elementOf("span", "entry-name series-month", name), boxes);
        }
        month = name;
        boxes.append(row);
    });
    list.append(extraTyped === null ? addRowOf(preview, redraw) : draftRowOf(extraTyped, preview, redraw));
    return list;
}

/**
 * Shows the boxes a series makes in the row of its boxes, see {@link boxesRowOf}, as the reader answers, see the top
 * of this file: their line, and below it their list while opened; in their place the hint why it makes none; nothing
 * while the series is not typed enough, or the reader does not take it, and only the answer to the last question.
 * - `place`: The place of the boxes, `null` while the form has none.
 * - `asked`: The number of this question.
 * - `answer`: What the reader answered.
 * - `left`: The days left out.
 * - `draw`: Shows the line, and the list while opened.
 *
 * @param form - The form of the series, which holds the row of its boxes
 * @param preview - How the boxes show
 * @throws {Error} - When the reader does not answer
 */
async function previewShow(form: HTMLElement, preview: Preview): Promise<void> {
    const asked: number = ++previewsAsked;
    const placeOf: () => HTMLElement | null = (): HTMLElement | null => form.querySelector(".series-preview");
    if (preview.ask === null) {
        previewShown = [];
        placeOf()?.replaceChildren();
        return;
    }
    let answer: Planned[] | HTMLElement;
    try {
        answer = await preview.ask();
    } catch (error: unknown) {
        if (asked === previewsAsked) {
            previewShown = [];
            placeOf()?.replaceChildren();
        }
        throw error;
    }
    if (asked !== previewsAsked)
        return;
    if (answer instanceof HTMLElement) {
        previewShown = [answer];
        placeOf()?.replaceChildren(answer);
        return;
    }
    const planned: Planned[] = answer;
    const left: string[] = exceptsWithin(preview.days);
    const draw: () => void = (): void => {
        previewShown = [summaryOf(planned, left, (): void => {
            listOpened = !listOpened;
            draw();
        }), ...listOpened ? [boxListOf(planned, left, preview, draw)] : []];
        placeOf()?.replaceChildren(...previewShown);
    };
    draw();
}

/**
 * Shows anew the boxes a series makes a moment after the typing rests, see {@link previewShow}, so typing asks
 * the reader once; a change before then takes the place of the one waiting.
 *
 * @param form - The form of the series, which holds the row of its boxes
 * @param preview - How the boxes show
 */
export function previewSoon(form: HTMLElement, preview: Preview): void {
    clearTimeout(previewWait);
    previewWait = window.setTimeout((): void => {
        previewShow(form, preview).catch((error: unknown): void => console.error(error));
    }, 150);
}

/**
 * Asks the reader for a change of the course, like a group made mine, as JSON.
 *
 * @param address - Address at the reader, like `/api/course/mine`
 * @param body - What to change
 * @returns Answer of the reader
 * @throws {Error} - When the reader does not take it
 */
export async function courseSend<T>(address: string, body: object): Promise<T> {
    return readerAsk<T>(address, { method: "POST", body: JSON.stringify(body) });
}

/**
 * Gives the groups of a type of the course of the dialog.
 *
 * @param type - Type, like `TU`
 * @returns Its groups, by group
 */
function groupsOf(type: string): Group[] {
    return (course?.groups ?? []).filter((group: Group): boolean => group.rule.type === type);
}

/**
 * Gives the choice of a group in a list, by its weekday, times and room, like `Group 03` with
 * `Wed 10:00–12:00 · 5610.01.011` beside it.
 *
 * @param group - The group
 * @returns Its choice
 */
export function groupChoiceOf(group: Group): Choice {
    return {
        value: group.rule.group, text: `Group ${group.rule.group}`, group: "",
        detail: `${group.rule.slots.map(slotTextOf).join(" · ")} · ${roomOf(group.rule.location)}`,
    };
}

/**
 * Gives a field of `Skill` as the reader offers it, its places, platforms or people, see `categoriesRead`
 * in `reader/categories.ts`.
 *
 * @param key - The field, `location`, `online` or `with`
 * @returns The field, `undefined` while the categories are not loaded
 */
function skillFieldOf(key: string): Field | undefined {
    return categories.find((category: Category): boolean => category.name === skillName)?.fields
        .find((field: Field): boolean => field.key === key);
}

/**
 * Tells whether the form of a series makes a group mine, see {@link Form}.
 *
 * @param form - The form
 * @returns Whether its group is another than that of the series as it opened
 */
function mineMade(form: Form): boolean {
    return form.group !== "" && form.group !== (form.old?.group ?? "");
}

/**
 * Tells whether the form of a series is typed enough to make boxes: its type picked, and, unless it makes a group
 * mine, its days, see {@link daysReady}.
 *
 * @param form - The form
 * @returns Whether it is ready
 */
function formReady(form: Form): boolean {
    if (form.type === "")
        return false;
    return mineMade(form) || daysReady(form);
}

/**
 * Sends the form of a series to the reader: a group made mine, see `groupMine` in `reader/course.ts`, else the series
 * by its rule and the states I gave its boxes, see `seriesApply` there, its days left out only those between its first
 * and its last day.
 *
 * @param form - The form, ready, see {@link formReady}
 * @param dry - Whether only to tell what it would make, for the preview
 * @returns The boxes of the series after the change
 * @throws {Error} - When the reader does not take it
 */
async function formSend(form: Form, dry: boolean): Promise<Planned[]> {
    if (mineMade(form))
        return courseSend<Planned[]>("/api/course/mine",
            { module: course?.module ?? "", type: form.type, group: form.group, dry: dry });
    return courseSend<Planned[]>("/api/course/series", {
        module: course?.module ?? "", old: form.old, before: form.before, states: form.states, dry: dry,
        rule: {
            type: form.type, slots: form.slots, extras: form.extras, location: form.location,
            locationLink: form.locationLink, online: form.online, onlineLink: form.onlineLink, passcode: form.passcode,
            attendees: form.attendees, first: form.first, last: form.last, excepts: exceptsWithin(form),
            group: form.old?.group ?? "", semester: course?.semester ?? "",
        },
    });
}

/**
 * Gives the form of the dialog, its element.
 *
 * @returns The form
 */
function formElementOf(): HTMLFormElement {
    return document.getElementById("series-form") as HTMLFormElement;
}

/**
 * Takes a change of the form of a series: allows saving while it is ready, see {@link formReady}, and shows anew
 * the boxes it makes as the reader would write them, see {@link formSend} and {@link previewSoon}, the days it leaves
 * out among them unless it makes a group mine.
 * - `save`: Its button Save.
 * - `form`: The form.
 */
function formChanged(): void {
    const save: HTMLButtonElement | null = formElementOf().querySelector(".panel-main");
    if (typing === null || save === null)
        return;
    const form: Form = typing;
    save.disabled = !formReady(form);
    previewSoon(formElementOf(), {
        ask: formReady(form) ? (): Promise<Planned[]> => formSend(form, true) : null,
        days: mineMade(form) ? { ...form, excepts: [], extras: [] } : form, states: form.states, filled: formFill,
    });
}

/**
 * Shows the address of the place of the form below it, small and grey, as the dialog does, a link to the link
 * of the place while it has one, never the link itself as text, so nothing for no place or a place without address.
 *
 * @param address - The address below the place
 * @param form - The form
 */
function addressShow(address: HTMLAnchorElement, form: Form): void {
    address.textContent = addressOf(form.location);
    if (form.locationLink !== "")
        address.href = form.locationLink;
    else
        address.removeAttribute("href");
    address.hidden = address.textContent === "";
}

/**
 * Makes the row of what the series is, as its boxes are written, like `IN2028_BusinessAnalyticsMachineLearning (VO)`:
 * the folder of its module and its type in brackets, a series that is there as plain text, which stays as it is,
 * a new one with its type picked from the numbered types without series, its list open as the dialog opens,
 * see {@link seriesOpen}.
 * - `module`: The folder of the module.
 * - `types`: The numbered types without series, and that of the form.
 * - `row`: The row of a series that is there.
 *
 * @param form - The form
 * @returns The row
 */
function seriesRowOf(form: Form): HTMLElement {
    const module: string = course?.module ?? "";
    const types: string[] = numberedTypes.filter((type: string): boolean =>
        type === form.type || !(course?.series ?? []).some((series: Series): boolean => series.rule.type === type));
    if (form.old !== null) {
        const row: HTMLElement = rowOf("Series", elementOf("span", "", breakableOf(`${module} (${form.type})`)));
        row.classList.add("panel-fixed");
        return row;
    }
    return rowOf("Series", pairOf(elementOf("span", "", breakableOf(module)), choicesOf({
        search: searchOf(types.map(choiceOf)), picked: form.type === "" ? [] : [form.type], many: false,
        adding: false, noun: "type", plus: true, empty: "Pick a type",
        pick: (values: string[]): void => {
            form.type = values[0] ?? "";
            form.group = "";
            formFill();
        },
    })));
}

/**
 * Makes the row of the place of the form, picked as in the dialog, see `placeSearchOf` in `./categories.ts`:
 * my places, the most used first, and as I type the rooms of the university too, each with its address
 * grey beside it, see `placeChoiceOf` in `./places.ts`, the place of the series among them; below it its address,
 * a link. A place picked takes the link of my place or room.
 * - `field`: The field of the place of `Skill`, `undefined` while the categories are not loaded.
 * - `address`: The address below the place.
 *
 * @param form - The form
 * @returns The row
 */
function placeRowOf(form: Form): HTMLElement {
    const field: Field | undefined = skillFieldOf("location");
    const address: HTMLAnchorElement = document.createElement("a");
    address.className = "entry-address";
    address.target = "_blank";
    address.rel = "noopener";
    addressShow(address, form);
    return rowOf("Place", choicesOf({
        search: async (text: string): Promise<Choice[]> => {
            const values: string[] = text.trim() === ""
                ? [...field?.values ?? [], ...(form.location === "" ? [] : [form.location])]
                : [...field?.values ?? [], ...field?.rooms ?? []];
            return await searchOf([...new Set(values)].map(placeChoiceOf))(text);
        },
        picked: form.location === "" ? [] : [form.location], many: false, adding: false, noun: "place",
        textOf: labelOf,
        below: [address],
        pick: (values: string[]): void => {
            const line: string = values[0] ?? "";
            if (line === form.location)
                return;
            form.location = line;
            form.locationLink = field?.places[line]?.link ?? "";
            formFill();
        },
    }));
}

/**
 * Makes the row of what the series does online in the form, as `Online` of the dialog, see `onlineRowOf`
 * in `./categories.ts`: its platform, my platforms the most used first, a platform typed added to `Online.md`,
 * see `platformSend` in `./places.ts`; below it, while one is picked, the link of its meetings, the link of its
 * web app of its row in it, as the dialog has it, until I type the link of the meetings in its place, which alone is
 * kept, and their passcode, the link last. Another platform picked empties both.
 * - `field`: The field `Online` of `Skill`, `undefined` while the categories are not loaded.
 * - `link`, `pass`: Fields of the link and the passcode.
 * - `parts`: The parts, shown while a platform is picked.
 * - `show`: Shows the parts for the platform picked.
 *
 * @param form - The form
 * @returns The row
 */
function onlineRowOf(form: Form): HTMLElement {
    const field: Field | undefined = skillFieldOf("online");
    const link: HTMLInputElement = partFieldOf("url", form.onlineLink, "Link online");
    const pass: HTMLInputElement = partFieldOf("text", form.passcode, "Passcode online");
    const parts: HTMLElement = elementOf("div", "field-parts", "");
    const show: () => void = (): void => {
        if (link !== document.activeElement)
            link.value = form.onlineLink !== "" ? form.onlineLink : field?.platforms[form.online]?.link ?? "";
        parts.hidden = form.online === "";
    };
    parts.append(partOf("Passcode", pass), partOf("Link", link));
    link.addEventListener("input", (): void => {
        form.onlineLink = link.value.trim() === (field?.platforms[form.online]?.link ?? "") ? ""
            : link.value.trim();
        formChanged();
    });
    pass.addEventListener("input", (): void => {
        form.passcode = pass.value.trim();
        formChanged();
    });
    show();
    return rowOf("Online", choicesOf({
        search: searchOf((field?.values ?? []).map(choiceOf)), picked: form.online === "" ? [] : [form.online],
        many: false, adding: true, noun: "platform", below: [parts],
        add: async (name: string): Promise<string | null> => {
            if (name.trim() === "")
                return null;
            const platform: Platform = await platformSend({ name: name, provider: "", link: "" }, "");
            field?.values.push(platform.name);
            if (field !== undefined)
                field.platforms[platform.name] = platform;
            return platform.name;
        },
        pick: (values: string[]): void => {
            const platform: string = values[0] ?? "";
            if (platform !== form.online) {
                form.onlineLink = "";
                form.passcode = "";
                pass.value = "";
            }
            form.online = platform;
            show();
            formChanged();
        },
    }));
}

/**
 * Makes the row of who I am with in the form, as `With` of the dialog: the names my entries wrote, the most used
 * first, several, a name typed added, each with the address it had, else that of its last entry, else its standard
 * address, see `standardAddressOf` in `./entries.ts`.
 * - `field`: The field `With` of `Skill`, `undefined` while the categories are not loaded.
 *
 * @param form - The form
 * @returns The row
 */
function withRowOf(form: Form): HTMLElement {
    const field: Field | undefined = skillFieldOf("with");
    return rowOf("With", choicesOf({
        search: searchOf((field?.values ?? []).map(choiceOf)),
        picked: form.attendees.map((attendee: Attendee): string => attendee.name), many: true, adding: true,
        add: async (name: string): Promise<string | null> => name.includes(",") ? null : name.trim(), noun: "person",
        pick: (names: string[]): void => {
            form.attendees = names.map((name: string): Attendee => ({
                name: name, address: form.attendees.find((attendee: Attendee): boolean => attendee.name === name)
                    ?.address ?? field?.links[name] ?? standardAddressOf(name),
            }));
            formChanged();
        },
    }));
}

/**
 * Makes the row of the group of the form of the tutorials of a module with groups: my group, picked from the groups,
 * see {@link groupChoiceOf}; another one picked makes it mine from its next session on, see `groupMine`
 * in `reader/course.ts`, its days, place, people and dates then those of the group, so their rows hide.
 *
 * @param form - The form
 * @returns The row
 */
function groupRowOf(form: Form): HTMLElement {
    return rowOf("Group", choicesOf({
        search: searchOf(groupsOf(form.type).map(groupChoiceOf)),
        picked: form.group === "" ? [] : [form.group], many: false, adding: false, noun: "group",
        pick: (values: string[]): void => {
            form.group = values[0] ?? form.old?.group ?? "";
            formFill();
        },
    }));
}

/**
 * Builds the rows of the form of a series anew from what it holds, see the top of this file: what it is, its group
 * while its type has groups, then, unless it makes a group mine, its days and its first and last day; its boxes; then, unless it makes a group mine, its place, what it does online and its people;
 * below them the hint when the reader does not take it, then the plan it writes into, a link that opens it
 * in the editor of my new system, like `/edit?file=NomManagecalendar%2FUniversity%2F…_Plan.ics`, Cancel and Save.
 * - `form`: The form.
 * - `rows`: Its rows.
 * - `fields`: The rows together.
 * - `buttons`: The plan, Cancel and Save.
 * - `file`: The link of the plan.
 * - `cancel`, `save`: Cancel and Save.
 * - `hint`: The hint when the reader does not take it.
 */
function formFill(): void {
    if (typing === null)
        return;
    const form: Form = typing;
    const mine: boolean = mineMade(form);
    const rows: HTMLElement[] = [seriesRowOf(form), ...groupsOf(form.type).length > 0 ? [groupRowOf(form)] : [],
        ...mine ? [] : [...slotRowsOf(form, formChanged, formFill), datesRowOf(form, formChanged)],
        boxesRowOf(),
        ...mine ? [] : [placeRowOf(form), onlineRowOf(form), withRowOf(form)]];
    const fields: HTMLElement = elementOf("div", "panel-form", "");
    fields.append(...rows);
    const buttons: HTMLElement = elementOf("div", "panel-buttons", "");
    const cancel: HTMLButtonElement = document.createElement("button");
    const save: HTMLButtonElement = document.createElement("button");
    cancel.type = "button";
    iconPut(cancel, X, "Cancel");
    cancel.addEventListener("click", (): void => (document.getElementById("series") as HTMLDialogElement).close());
    save.type = "submit";
    save.className = "panel-main";
    iconPut(save, Check, "Save");
    const hint: HTMLElement = elementOf("p", "panel-error", "Saving failed");
    hint.hidden = true;
    const file: HTMLAnchorElement = elementOf("a", "series-file", course?.file ?? "") as HTMLAnchorElement;
    file.href = `/edit?file=${encodeURIComponent(`NomManagecalendar/${course?.file ?? ""}`)}`;
    buttons.append(file, cancel, save);
    formElementOf().replaceChildren(fields, hint, buttons);
    formChanged();
}

/**
 * Saves the form of a series, see {@link formSend}, and closes the dialog, the day and the page of the module loading
 * anew as their files change; when the reader does not take it, the hint above the buttons says so and the dialog
 * stays open.
 */
async function formSave(): Promise<void> {
    if (typing === null || !formReady(typing))
        return;
    try {
        await formSend(typing, false);
    } catch (error: unknown) {
        console.error(error);
        formElementOf().querySelector(".panel-error")?.removeAttribute("hidden");
        return;
    }
    (document.getElementById("series") as HTMLDialogElement).close();
}

/**
 * Starts the dialog once for the page: its form saves by Save or Ctrl+Enter, Enter confirms only its field, as in
 * the dialog of an entry, and closed by Cancel, Escape or a click beside it, it forgets the form.
 * - `dialog`: The dialog.
 */
function dialogStart(): void {
    if (dialogStarted)
        return;
    dialogStarted = true;
    const dialog: HTMLDialogElement = document.getElementById("series") as HTMLDialogElement;
    formElementOf().addEventListener("submit", (event: SubmitEvent): void => {
        event.preventDefault();
        formSave().catch((error: unknown): void => console.error(error));
    });
    formElementOf().addEventListener("keydown", (event: KeyboardEvent): void => {
        if (event.key !== "Enter" || !(event.target instanceof HTMLInputElement) || event.defaultPrevented)
            return;
        event.preventDefault();
        event.target.blur();
        if (event.ctrlKey)
            formSave().catch((error: unknown): void => console.error(error));
    });
    dialog.addEventListener("close", (): void => {
        typing = null;
        previewForget();
    });
}

/**
 * Opens the dialog of a series, see the top of this file: the series of a type of a module in a semester as its rule
 * reads back, or, without type, a new series of the module, its type to pick, its days and dates empty, its list
 * of types open.
 * - `loaded`: The course and the categories, for its groups, places, platforms and people.
 * - `rule`: The rule of the series as read back, `null` for a new one.
 * - `dialog`: The dialog.
 *
 * @param module - Name of the folder of the module, like `IN2028_BusinessAnalyticsMachineLearning`, or its code,
 *   like `IN2028`
 * @param type - Type of the series, like `VO`, empty for a new one
 * @param semester - Its semester, like `2026W`, empty for that of today
 * @throws {Error} - When the reader cannot answer
 */
export async function seriesOpen(module: string, type: string, semester: string): Promise<void> {
    dialogStart();
    const loaded: [Course, Category[]] = await Promise.all([
        readerAsk<Course>(`/api/course/module?module=${encodeURIComponent(module)}&semester=${semester}`),
        readerAsk<Category[]>(`/api/day/categories?now=${encodeURIComponent(new Date().toISOString())}`),
    ]);
    [course, categories] = loaded;
    const rule: Rule | null = course.series.find((series: Series): boolean => series.rule.type === type)?.rule ?? null;
    previewForget();
    typing = {
        type: rule?.type ?? "", old: rule, slots: rule?.slots.map((slot: Slot): Slot => ({ ...slot }))
            ?? [{ weekday: 0, start: "", end: "" }],
        before: rule?.slots.map((slot: Slot): number => slot.weekday) ?? [0],
        extras: rule?.extras.map((extra: Extra): Extra => ({ ...extra })) ?? [], location: rule?.location ?? "",
        locationLink: rule?.locationLink ?? "", online: rule?.online ?? "", onlineLink: rule?.onlineLink ?? "",
        passcode: rule?.passcode ?? "", attendees: rule?.attendees ?? [], first: rule?.first ?? "",
        last: rule?.last ?? "", excepts: [...rule?.excepts ?? []], group: rule?.group ?? "", states: {},
    };
    formFill();
    const dialog: HTMLDialogElement = document.getElementById("series") as HTMLDialogElement;
    if (!dialog.open)
        dialog.showModal();
    (document.activeElement as HTMLElement | null)?.blur();
    if (rule === null)
        formElementOf().querySelector<HTMLButtonElement>(".picker-line")?.click();
}
