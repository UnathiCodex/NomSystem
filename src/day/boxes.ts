/**
 * ## Boxes
 *
 * The plan of the shown day as a calm list of boxes beside the log, which is my one calendar, see `reader/boxes.ts`:
 * its birthdays and holidays at the top, each with my gift idea for it below, when I have one, see `gifts.ts`,
 * and a line below them, then the boxes with a deadline, then those with an expected time,
 * by their time, like my lectures, then those without, then tomorrow's suggested study sessions, dashed,
 * see `suggestions.ts`, and the dropped boxes last.
 * A box shows its category in bold with a colon and what, like `Skill: WI1059 HU`, as an entry of the log does, and below them, grey,
 * its expected time and duration, its place and how often it was pushed, like `12:00 · 90 min · Hörsaal 2`;
 * an open box pushed three times or more asks instead of counting on, `pushed 3 times · smaller or drop?`,
 * since a task I keep pushing is often too big or no longer wanted, and a click on it opens it to cut it.
 * A box with a deadline shows from four days before it, see `reader/boxes.ts`, until it is done,
 * and on the day of its deadline always, done or not, and looks like every other box,
 * but for its deadline on a grey line of its own, like `Deadline Fri, 23.10.2026, 12:00`,
 * and how near it is starting the line below, like `in 3 days · 120 min`; it has no arrow,
 * since it stays on the day of its deadline.
 * An open box is dragged into the log at the real time: the reader writes a log entry like it, pointing to it,
 * as long as its expected duration, else half an hour, and I resize the entry when it lasted otherwise.
 * The ring at its left logs it as expected with one tap: from its expected time, else ending now, see `times.ts`;
 * when the reader does not log a box dropped or tapped, a hint says so above the list until it loads again.
 * A done box shows a check in its ring and, faded, expected and real time,
 * like `expected 12:00 · 90 min → 12:15 · 85 min`, and `done` with the day it was done, without time,
 * when that is another day, like `done Fri, 09.10.2026` for a box done a day early;
 * a done box with a deadline shows its check alone, no done line, since it is gone the next day anyway,
 * like `Skill: WI1059 HU` with `Deadline Mon, 12.10.2026, 12:00`, not `done 05:15 · 15 min`.
 * An open box that can be changed is pushed to the next day with one tap on its arrow, or dropped with one tap
 * on its cross; a dropped box stays in its file, see `reader/boxes.ts`, and shows struck through at the end
 * of the list, where one tap takes it back.
 * `+` above the list opens the entry by category for a new box of the shown day; a click on a box changes it,
 * see `categories.ts`. A box without category, like a to-do another app wrote into the plan, opens the entry
 * by category of the log instead of being logged at once, when it is dropped or its ring tapped, since the log needs
 * a category; a box that cannot be changed, like an occurrence of a weekly lecture, is logged like any other,
 * and opens the entry by category of the log when clicked.
 * The list loads again when the shown day or its log changes, since a box is done once a log entry points to it,
 * when the entry by category closes, and after a push, a drop or a suggestion accepted.
 * The week shows the boxes of seven days the same way, without their buttons, see `week.ts`.
 *
 * - `fullcalendar/interaction`: Drags the boxes into the log.
 * - `./entries.ts`: Sends logged, pushed and dropped boxes to the reader.
 * - `./categories.ts`: Opens the entry by category for a new box, a box to change, and a box to log through it.
 * - `./suggestions.ts`: Loads the study sessions suggested for tomorrow, accepts and dismisses them.
 * - `./gifts.ts`: Opens the dialog of the gift idea for a birthday or holiday.
 * - `./places.ts`: Gives the name of the place of a box.
 * - `./times.ts`: Gives the times a box is logged at with one tap, and writes times of day.
 * - `../skill/attempts.ts`: Names the category of skill entries, writes a date as a day,
 *   and gives the day of a date.
 * - `../icons.ts`: Puts icons into the buttons, their words as tooltip.
 * - `lucide`: The icons plus, check, arrow, cross, undo and gift.
 * - `fullcalendar`: Calendar of the log the boxes are dropped into.
 */

import { Draggable } from "fullcalendar/interaction";
import { boxDrop, boxLog, boxPush } from "./entries.ts";
import { boxOpenEdit, boxOpenNew, entryOpenFromBox } from "./categories.ts";
import { suggestionAccept, suggestionDismiss, suggestionOpen, suggestionsLoad } from "./suggestions.ts";
import { giftOpen } from "./gifts.ts";
import { labelOf } from "./places.ts";
import { boxMinutes, boxTimesOf, dateTextOf, timeOf } from "./times.ts";
import { dayOf, skillName } from "../skill/attempts.ts";
import { iconOf, iconPut } from "../icons.ts";
import { ArrowRight, Check, Gift, Plus, Undo2, X } from "lucide";

import type { Calendar, EventApi, EventReceiveInfo } from "fullcalendar";
import type { IconNode } from "lucide";
import type { Suggestion } from "./suggestions.ts";


/**
 * State of a box: open, done, since a log entry points to it, or dropped.
 */
export type BoxState = "open" | "done" | "dropped";

/**
 * A box, as the reader sends it.
 *
 * - `id`: Identifier of its to-do or event, for an occurrence of a series with its start after `#`,
 *   like `weekly-lecture@nomsystem#2026-10-13T08:00:00.000Z`.
 * - `category`: Category, like `Skill`, empty for a box without one, like a to-do another app wrote.
 * - `title`: What, like `WI1059 HU`.
 * - `location`: Place, empty for none.
 * - `from`: Where a way starts, empty for none.
 * - `module`: Module of a skill box, like `WI1059`, empty for any other box.
 * - `type`: Type of a skill box, like `HU`, empty for any other box.
 * - `note`: Free note.
 * - `day`: Its day, like `2026-10-13`; for a box with a deadline the day of its deadline.
 * - `time`: Expected time as ISO instant, empty for none.
 * - `minutes`: Expected duration in minutes, `null` for none.
 * - `deadline`: Deadline as ISO instant, or as its day like `2026-10-23` when it has no time; empty for none.
 * - `state`: Whether it is open, done or dropped.
 * - `pushed`: Days it was pushed from to the next day, in order.
 * - `log`: Start and end of the log entry written from it, as ISO instants, `null` for none.
 * - `editable`: Whether it can be changed, pushed, dropped and removed: a to-do or an event with times
 *   that happens once; an occurrence of a series cannot.
 * - `todo`: Whether it is a to-do; an event, like a lecture imported from TUMonline, keeps its time and duration.
 */
export type Box = {
    id: string;
    category: string;
    title: string;
    location: string;
    from: string;
    module: string;
    type: string;
    note: string;
    day: string;
    time: string;
    minutes: number | null;
    deadline: string;
    state: BoxState;
    pushed: string[];
    log: { start: string; end: string } | null;
    editable: boolean;
    todo: boolean;
};

/**
 * A birthday or holiday of a day, as the reader sends it.
 *
 * - `id`: Its identifier in `Birthdays.ics` or `Holidays.ics`, shared by every year of it.
 * - `category`: Its category, like `Birthday` or `Holiday`, empty for none.
 * - `title`: Its name as its file writes it, like `KarlbauerFlorian` or `Ostermontag (AT, DE)`.
 * - `gift`: My gift idea for it, its `DESCRIPTION`, empty for none.
 */
export type Occasion = {
    id: string;
    category: string;
    title: string;
    gift: string;
};

/**
 * The plan of a day, as the reader sends it.
 *
 * - `day`: The day, like `2026-10-13`.
 * - `occasions`: Its birthdays and holidays, each with my gift idea for it.
 * - `boxes`: Its boxes: those with a time first, by their time, then those without, the dropped ones last.
 */
export type PlanDay = {
    day: string;
    occasions: Occasion[];
    boxes: Box[];
};

/**
 * The plan of the shown day, as loaded last.
 */
let shown: PlanDay = { day: "", occasions: [], boxes: [] };

/**
 * The study sessions suggested for the shown day, as loaded last, none for any day but tomorrow.
 */
let suggested: Suggestion[] = [];

/**
 * What the list was loaded for last: the day and the log entries of it, so it loads again only when they change.
 */
let seen: string = "";


/**
 * Makes an element of an entry or a box, a line or a part of one, from texts and elements, like the category in bold;
 * the entries of the log in `day.ts` are made of them too.
 *
 * @param tag - Name of the element, `div` for a line, `span` for a part of a line
 * @param className - Class, like `entry-time`
 * @param parts - Texts and elements in it, in order
 * @returns Element
 */
export function entryPartOf(tag: string, className: string, parts: (string | Node)[]): HTMLElement {
    const element: HTMLElement = document.createElement(tag);
    element.className = className;
    element.append(...parts);
    return element;
}

/**
 * Makes what an entry or a box is: its category in bold with a colon, so the list scans fast, then its what,
 * like **`Skill:`**` WI1059 HU` or **`Sleep:`**` Night`; only the what of an entry without category, only the category
 * without colon of an entry whose what it is, like an old **`Sleep`**, written before it had its what.
 * - `bold`: The category in bold, in the size of the rest, with the colon inside when a what follows.
 *
 * @param category - Category, empty for an entry without one
 * @param what - What the entry was, empty when it is its category
 * @returns Texts and elements of what the entry was
 */
export function whatOf(category: string, what: string): (string | Node)[] {
    if (category === "")
        return [what];
    const bold: HTMLElement = entryPartOf("strong", "entry-category", [what === "" ? category : `${category}:`]);
    return what === "" ? [bold] : [bold, ` ${what}`];
}

/**
 * Loads the plans of the days of a range from the reader.
 *
 * @param start - First day, like `2026-10-13`
 * @param end - Day after the last, like `2026-10-14` for one day
 * @returns {@link PlanDay} of each day, in order
 * @throws {Error} - When the reader cannot answer
 */
export async function boxesFetch(start: string, end: string): Promise<PlanDay[]> {
    const response: Response = await fetch(`/api/day/boxes?start=${start}&end=${end}`);
    if (!response.ok)
        throw new Error(`Reader answered ${response.status}`);
    return await response.json() as PlanDay[];
}

/**
 * Writes what was expected of a box, as far as it has it: its expected time and duration, like `12:00 · 90 min`.
 *
 * @param box - The box
 * @returns Its expected time and duration, empty when it has neither
 */
function expectedOf(box: Box): string {
    return [box.time === "" ? "" : timeOf(new Date(box.time)), box.minutes === null ? "" : `${box.minutes} min`]
        .filter((part: string): boolean => part !== "").join(" · ");
}

/**
 * Writes a day with its short weekday, like `Fri, 23.10.2026`, a comma between weekday and date
 * as in the date of the day.
 * - `weekday`: Its weekday, like `Fri`, from the day at noon.
 *
 * @param day - Day like `2026-10-23`
 * @returns The day with its weekday
 */
export function weekdayTextOf(day: string): string {
    const weekday: string = new Date(`${day}T12:00:00`).toLocaleDateString("en-GB", { weekday: "short" });
    return `${weekday}, ${dateTextOf(day)}`;
}

/**
 * Writes the deadline of a box, like `Deadline Fri, 23.10.2026, 12:00`;
 * a deadline without time is its day, so it shows without time.
 * - `time`: Its time after a comma, empty for a deadline without time.
 *
 * @param box - Box with a deadline
 * @returns Its deadline
 */
function deadlineTextOf(box: Box): string {
    const time: string = box.deadline === box.day ? "" : `, ${timeOf(new Date(box.deadline))}`;
    return `Deadline ${weekdayTextOf(box.day)}${time}`;
}

/**
 * Writes how near the deadline of an open box is on a day: `today`, `tomorrow` or `in 3 days`.
 * - `days`: Whole days from the day to the deadline, from noon to noon, so a day the clocks change counts right.
 *
 * @param box - Box with a deadline
 * @param day - Day the box shows on, like `2026-10-20`
 * @returns How near it is
 */
function nearOf(box: Box, day: string): string {
    const days: number = Math.round((Date.parse(`${box.day}T12:00:00`) - Date.parse(`${day}T12:00:00`))
        / (24 * 60 * 60 * 1000));
    if (days === 0)
        return "today";
    if (days === 1)
        return "tomorrow";
    return `in ${days} days`;
}

/**
 * Pushes after which an open box asks whether to make it smaller or drop it.
 */
const pushesAsking: number = 3;

/**
 * Writes the grey line below what a box is, in parts: none for a done box with a deadline, since it is gone the next
 * day anyway and its check says it is done, like `Skill: WI1059 HU` with its deadline alone, not `done 05:15 · 15 min`;
 * for a box done on the day shown what was expected and what was real, like `expected 12:00 · 90 min`
 * and `→ 12:15 · 85 min`, or `done 14:00 · 30 min` without expectation;
 * for any other box how near its deadline is, see {@link nearOf}, what is expected, its place by its name,
 * like `TumMain`, see `labelOf` in `places.ts`, or for a done one
 * `done` and the day it was done, like `done Fri, 09.10.2026` for a box done a day early,
 * and how often it was pushed, as one part, like `in 3 days · 120 min` or `75 min · pushed once`,
 * and from {@link pushesAsking} pushes on, while it is open, the question `smaller or drop?` after them;
 * the week leaves out how near a deadline is, since it shows a deadline only on its own day, which its row names.
 * - `lived`: Day of the start of its log entry, empty for none.
 * - `expected`: What was expected.
 * - `pushes`: How often it was pushed, empty for never, with the question when it asks.
 * - `near`: How near its deadline is, empty for a box without, one not open, or in the week.
 * - `done`: `done` and the day it was done, only `done` without log entry, like a box ticked in another app.
 * - `open`: The one part of a box without log entry on the day shown.
 * - `start`, `end`: Real start and end, of its log entry.
 * - `real`: Real start and minutes.
 *
 * @param box - The box
 * @param day - Day the box shows on, like `2026-10-20`
 * @param nearShown - Whether to write how near its deadline is, as the day does, but not the week
 * @returns The parts of the line, none when there is nothing to write
 */
function metaPartsOf(box: Box, day: string, nearShown: boolean): string[] {
    if (box.state === "done" && box.deadline !== "")
        return [];
    const lived: string = box.log === null ? "" : dayOf(new Date(box.log.start));
    const expected: string = expectedOf(box);
    let pushes: string = "";
    if (box.pushed.length === 1)
        pushes = "pushed once";
    else if (box.pushed.length > 1)
        pushes = `pushed ${box.pushed.length} times`;
    if (box.pushed.length >= pushesAsking && box.state === "open")
        pushes += " · smaller or drop?";
    if (box.log === null || lived !== day) {
        const near: string = !nearShown || box.deadline === "" || box.state !== "open" ? "" : nearOf(box, day);
        const done: string = lived === "" ? "done" : `done ${weekdayTextOf(lived)}`;
        const open: string = [near, expected, box.state === "done" ? done : labelOf(box.location), pushes]
            .filter((part: string): boolean => part !== "").join(" · ");
        return open === "" ? [] : [open];
    }

    const start: Date = new Date(box.log.start);
    const end: Date = new Date(box.log.end);
    const real: string = `${timeOf(start)} · ${Math.round((end.getTime() - start.getTime()) / 60000)} min`;
    return expected === "" ? [`done ${real}`] : [`expected ${expected}`, `→ ${real}`];
}

/**
 * Makes the lines of a box, in the day and in the week alike: what it is, see {@link whatOf},
 * its deadline on a grey line of its own when it has one, see {@link deadlineTextOf},
 * and below them the grey line of what is expected, see {@link metaPartsOf}, its parts side by side, the second below
 * the first where the line has no room for both, so expected and real time are never cut.
 * - `parts`: The parts of the grey line.
 *
 * @param box - The box
 * @param day - Day the box shows on, like `2026-10-20`
 * @param nearShown - Whether to write how near its deadline is, as the day does, but not the week
 * @returns Its lines
 */
export function boxContentOf(box: Box, day: string, nearShown: boolean): HTMLElement[] {
    const parts: string[] = metaPartsOf(box, day, nearShown);
    return [
        entryPartOf("div", "box-what", whatOf(box.category, box.title === box.category ? "" : box.title)),
        ...(box.deadline === "" ? [] : [entryPartOf("div", "box-meta", [
            entryPartOf("span", "box-part", [deadlineTextOf(box)])])]),
        ...(parts.length === 0 ? [] : [entryPartOf("div", "box-meta", parts.map((part: string): HTMLElement =>
            entryPartOf("span", "box-part", [part])))]),
    ];
}

/**
 * Makes the birthdays and holidays of a day, each a grey line above its boxes with its category in bold and a colon
 * as every entry has it, like **`Birthday:`**` KarlbauerFlorian`, see {@link whatOf}, and below it, after a gift,
 * my gift idea for it, when I have one. In the day a click on one opens the dialog of its gift idea, see `gifts.ts`,
 * and one without an idea shows the gift at its right under the pointer; the week only shows them.
 * - `element`: A birthday or holiday with its idea.
 * - `hint`: The gift under the pointer, none in the week and for one with an idea.
 *
 * @param occasions - Birthdays and holidays with my gift ideas
 * @param open - Opens the dialog of the gift idea for one, `null` in the week
 * @returns One element each
 */
export function occasionsOf(occasions: Occasion[], open: ((occasion: Occasion) => void) | null): HTMLElement[] {
    return occasions.map((occasion: Occasion): HTMLElement => {
        const hint: HTMLElement[] = open === null || occasion.gift !== ""
            ? [] : [entryPartOf("span", "occasion-hint", [iconOf(Gift)])];
        const element: HTMLElement = entryPartOf("div", "occasion", [
            entryPartOf("div", "occasion-title", [...whatOf(occasion.category, occasion.title), ...hint]),
            ...(occasion.gift === "" ? [] : [entryPartOf("div", "occasion-gift", [iconOf(Gift), occasion.gift])]),
        ]);
        if (open !== null) {
            element.classList.add("occasion-open");
            element.title = occasion.gift === "" ? "Gift idea" : "Change gift idea";
            element.addEventListener("click", (): void => open(occasion));
        }
        return element;
    });
}

/**
 * Logs a box as expected, with one tap, see {@link boxTimesOf}; a box without category opens the entry by category
 * of the log at those times instead, since the log needs a category.
 * - `start`, `end`: The times it is logged at.
 *
 * @param calendar - Calendar of the day
 * @param box - The box
 * @throws {Error} - When the reader does not log it, or does not answer
 */
async function boxTap(calendar: Calendar, box: Box): Promise<void> {
    const [start, end]: [Date, Date] = boxTimesOf(box, calendar.view.currentStart);
    await (box.category === "" ? entryOpenFromBox(box, start, end) : boxLog(calendar, box.id, start, end));
}

/**
 * Acts on a click on what a box is: a box that can be changed opens the entry by category to change it,
 * an open one that cannot, like an occurrence of a series, the entry by category of the log at the times of a tap,
 * see {@link boxTap}.
 * - `start`, `end`: The times of a tap.
 *
 * @param calendar - Calendar of the day
 * @param box - The box
 * @throws {Error} - When the reader does not answer
 */
async function boxClick(calendar: Calendar, box: Box): Promise<void> {
    if (box.editable)
        await boxOpenEdit(box);
    else if (box.state === "open") {
        const [start, end]: [Date, Date] = boxTimesOf(box, calendar.view.currentStart);
        await entryOpenFromBox(box, start, end);
    }
}

/**
 * Makes the ring at the left of a box: for an open box a button, an empty ring like the circle
 * of a to-do, its check showing under the pointer, which logs it as expected, see {@link boxTap};
 * for a done box the check alone, grey; for a dropped box an empty place.
 * - `ring`: The button of an open box.
 *
 * @param calendar - Calendar of the day
 * @param box - The box
 * @returns The ring
 */
function ringOf(calendar: Calendar, box: Box): HTMLElement {
    if (box.state !== "open")
        return entryPartOf("span", "box-ring", box.state === "done" ? [iconOf(Check)] : []);

    const ring: HTMLButtonElement = document.createElement("button");
    ring.type = "button";
    ring.className = "box-ring";
    iconPut(ring, Check, "Log as expected");
    ring.addEventListener("click", (): void => {
        boxTap(calendar, box).catch(logFailShow);
    });
    return ring;
}

/**
 * Says above the list of boxes that the reader did not log a box dropped into the log or tapped,
 * like after a lost connection, until the list loads again.
 *
 * @param error - Why logging failed
 */
function logFailShow(error: unknown): void {
    console.error(error);
    document.getElementById("plan-error")?.removeAttribute("hidden");
}

/**
 * Makes one small button at the right of a box, an icon, its words as tooltip, which sends a change of the box
 * and then loads the list again.
 * - `button`: The button.
 *
 * @param calendar - Calendar of the day
 * @param icon - Icon, like `ArrowRight`
 * @param words - What it does, like `To tomorrow`
 * @param send - Sends the change to the reader
 * @returns The button
 */
function actionOf(calendar: Calendar, icon: IconNode, words: string, send: () => Promise<void>): HTMLButtonElement {
    const button: HTMLButtonElement = document.createElement("button");
    button.type = "button";
    button.className = "box-action";
    iconPut(button, icon, words);
    button.addEventListener("click", (): void => {
        send().then((): Promise<void> => boxesLoad(calendar)).catch((error: unknown): void => console.error(error));
    });
    return button;
}

/**
 * Makes the buttons at the right of a box that can be changed: for an open box the arrow, which pushes it
 * to the next day, but for a box with a deadline, which stays on the day of its deadline, and the cross,
 * which drops it; for a dropped box the arrow back, which takes it back; none for a done box and for a box
 * that cannot be changed, like an occurrence of a series.
 *
 * @param calendar - Calendar of the day
 * @param box - The box
 * @returns The buttons in a row, none for a box without
 */
function actionsOf(calendar: Calendar, box: Box): HTMLElement[] {
    if (!box.editable || box.state === "done")
        return [];
    return [entryPartOf("div", "box-actions", box.state === "dropped"
        ? [actionOf(calendar, Undo2, "Take back", (): Promise<void> => boxDrop(box.id, false))]
        : [
            ...(box.deadline !== "" ? []
                : [actionOf(calendar, ArrowRight, "To tomorrow", (): Promise<void> => boxPush(box.id))]),
            actionOf(calendar, X, "Drop", (): Promise<void> => boxDrop(box.id, true)),
        ])];
}

/**
 * Makes a box of the list: its ring, see {@link ringOf}, its lines, see {@link boxContentOf}, which change it
 * when clicked, see {@link boxClick}, and its buttons, see {@link actionsOf}.
 * An open box has the class `box-draggable`, so it can be dragged into the log, see {@link boxesStart},
 * and keeps its place in the list, its category, its title and its minutes in the log as data of its element.
 * - `element`: The box.
 * - `body`: Its lines.
 *
 * @param calendar - Calendar of the day
 * @param box - The box
 * @param index - Its place in the boxes of the shown day
 * @returns The box
 */
function boxElementOf(calendar: Calendar, box: Box, index: number): HTMLElement {
    const element: HTMLElement = entryPartOf("div", `box box-${box.state}`, []);
    const body: HTMLElement = entryPartOf("div", "box-body", boxContentOf(box, shown.day, true));
    element.classList.toggle("box-draggable", box.state === "open");
    element.dataset.index = String(index);
    element.dataset.category = box.category;
    element.dataset.title = box.title;
    element.dataset.minutes = String(box.minutes ?? boxMinutes);
    body.addEventListener("click", (): void => {
        boxClick(calendar, box).catch((error: unknown): void => console.error(error));
    });
    element.append(ringOf(calendar, box), body, ...actionsOf(calendar, box));
    return element;
}

/**
 * Makes a suggested study session of the list, dashed: what it is, its expected duration, and at its right
 * the check, which plans it, and the cross, which dismisses it; a click on it opens the entry by category
 * of a new box filled in as suggested, see `suggestions.ts`.
 * - `element`: The suggestion.
 * - `body`: Its lines.
 *
 * @param calendar - Calendar of the day
 * @param suggestion - The suggestion
 * @returns The suggestion
 */
function suggestionElementOf(calendar: Calendar, suggestion: Suggestion): HTMLElement {
    const element: HTMLElement = entryPartOf("div", "box box-suggested", []);
    const body: HTMLElement = entryPartOf("div", "box-body", [
        entryPartOf("div", "box-what", whatOf(skillName, suggestion.title)),
        entryPartOf("div", "box-meta", [`${suggestion.minutes} min · suggested`]),
    ]);
    body.addEventListener("click", (): void => {
        suggestionOpen(suggestion, calendar.view.currentStart).catch((error: unknown): void => console.error(error));
    });
    element.append(entryPartOf("span", "box-ring", []), body, entryPartOf("div", "box-actions", [
        actionOf(calendar, Check, "Plan it", (): Promise<void> => suggestionAccept(suggestion, shown.day)),
        actionOf(calendar, X, "Dismiss", async (): Promise<void> => suggestionDismiss(suggestion)),
    ]));
    return element;
}

/**
 * Shows the plan of the shown day in the list: its birthdays and holidays, its boxes that are not dropped,
 * the suggested study sessions, then the dropped boxes; a calm hint when the day has none of them.
 * - `elements`: Boxes and suggestions as elements, in order.
 * - `boxes`: The boxes as elements, each with its place among the boxes of the day.
 * - `dropped`: Whether a box is dropped.
 *
 * @param calendar - Calendar of the day
 */
function boxesShow(calendar: Calendar): void {
    const dropped: (box: Box) => boolean = (box: Box): boolean => box.state === "dropped";
    const boxes: HTMLElement[] = shown.boxes.map((box: Box, index: number): HTMLElement =>
        boxElementOf(calendar, box, index));
    const elements: HTMLElement[] = [
        ...occasionsOf(shown.occasions, giftOpen),
        ...boxes.filter((element: HTMLElement, index: number): boolean => !dropped(shown.boxes[index])),
        ...suggested.map((suggestion: Suggestion): HTMLElement => suggestionElementOf(calendar, suggestion)),
        ...boxes.filter((element: HTMLElement, index: number): boolean => dropped(shown.boxes[index])),
    ];
    document.getElementById("plan-boxes")?.replaceChildren(...(elements.length > 0 ? elements
        : [entryPartOf("p", "plan-none", ["Nothing planned"])]));
}

/**
 * Loads the plan of the shown day and its suggested study sessions, and shows them, unless another day is shown
 * meanwhile, without the hint of a box not logged, see {@link logFailShow}.
 * - `day`: The shown day.
 * - `plans`: Its plan, the one day of the range.
 * - `suggestions`: Its suggested study sessions.
 *
 * @param calendar - Calendar of the day
 * @throws {Error} - When the reader cannot answer
 */
async function boxesLoad(calendar: Calendar): Promise<void> {
    const day: string = dayOf(calendar.view.currentStart);
    const [plans, suggestions]: [PlanDay[], Suggestion[]] = await Promise.all([
        boxesFetch(day, dayOf(calendar.view.currentEnd)), suggestionsLoad(day),
    ]);
    if (day !== dayOf(calendar.view.currentStart))
        return;
    shown = plans[0];
    suggested = suggestions;
    document.getElementById("plan-error")?.setAttribute("hidden", "");
    boxesShow(calendar);
}

/**
 * Loads the list again when the shown day or its log entries changed, as the calendar tells after every change,
 * since a box is done once a log entry points to it.
 * - `key`: The shown day with the start and end of each of its log entries.
 *
 * @param calendar - Calendar of the day
 * @param events - All events of the shown day
 */
export function boxesSee(calendar: Calendar, events: EventApi[]): void {
    const key: string = JSON.stringify([dayOf(calendar.view.currentStart), ...events
        .filter((event: EventApi): boolean => event.source?.id === "log")
        .map((event: EventApi): string[] => [event.id, event.startStr, event.endStr])]);
    if (key === seen)
        return;
    seen = key;
    boxesLoad(calendar).catch((error: unknown): void => {
        console.error(error);
        document.getElementById("plan-boxes")?.replaceChildren(entryPartOf("p", "plan-none", ["The plan cannot be read"]));
    });
}

/**
 * Logs a box dropped into the log, at the time of the drop, as long as the box was when dragged;
 * a box without category opens the entry by category of the log at those times instead;
 * a hint above the list says when the reader does not log it, see {@link logFailShow}.
 * Takes the dropped entry out of the calendar again, because only the reader writes entries.
 * - `revert`: Removes the dropped entry from the calendar.
 * - `box`: The box, by its place among the boxes of the shown day.
 * - `start`, `end`: Where it was dropped.
 *
 * @param calendar - Calendar of the day
 * @param info - Dropped entry, with the element of the box
 */
export function boxReceive(calendar: Calendar, info: EventReceiveInfo): void {
    info.revert();
    const box: Box = shown.boxes[Number(info.draggedEl.dataset.index)];
    const start: Date = info.event.start as Date;
    const end: Date = info.event.end as Date;
    (box.category === "" ? entryOpenFromBox(box, start, end) : boxLog(calendar, box.id, start, end))
        .catch(logFailShow);
}

/**
 * Starts the list after the router has put its HTML into the page: the open boxes become draggable into the log,
 * `+` opens the entry by category for a new box, and the list loads again whenever the entry by category
 * or the dialog of a gift idea closes.
 * - {@link Draggable}: Turns elements into something FullCalendar takes when dropped.
 * - `itemSelector`: Drags only open boxes.
 * - `eventData`: Entry the dragged box becomes, with its category, its title and its minutes, so the log shows it
 *   as an entry, as long as it will be, while it is dragged.
 * - `close`: Comes when a dialog closes, saved or not.
 *
 * @param calendar - Calendar of the day
 */
export function boxesStart(calendar: Calendar): void {
    new Draggable(document.getElementById("plan-boxes") as HTMLElement, {
        itemSelector: ".box-draggable",
        eventData: (item: HTMLElement): { title: string; duration: { minutes: number }; category: string } => ({
            title: item.dataset.title ?? "", duration: { minutes: Number(item.dataset.minutes) },
            category: item.dataset.category ?? "",
        }),
    });
    iconPut(document.getElementById("plan-new") as HTMLElement, Plus, "New box");
    document.getElementById("plan-new")?.addEventListener("click", (): void => {
        boxOpenNew(calendar.view.currentStart).catch((error: unknown): void => console.error(error));
    });
    ["entry", "gift"].forEach((id: string): void => document.getElementById(id)?.addEventListener("close", (): void => {
        boxesLoad(calendar).catch((error: unknown): void => console.error(error));
    }));
}
