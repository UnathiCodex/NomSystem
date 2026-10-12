/**
 * ## Boxes
 *
 * The plan of a day is a list of boxes, not a calendar: the log is my one calendar, see `day.ts`.
 * A box is what I intend to do on a day, by category like an entry of the log, with an expected time or without,
 * and with an expected duration or without: a lecture is a box with its time and duration, a study session one
 * with only its duration, a call one with neither. What happens anyway, like my sleep, I don't plan, see `categories.ts`.
 * When I do it, it goes into the log at its real time, see `boxLog` in `day.ts`, so expected and real time
 * can be compared later; a box not done is pushed to the next day or dropped, and stays in its file as dropped,
 * so it can be counted.
 *
 * A box of the new system is a to-do of iCalendar, a `VTODO`, in the plan file of its month,
 * like `2026/2026_10/2026_10_Plan.ics`, see `calendar.ts`:
 * - its day and its expected time in `DTSTART`: `DTSTART;VALUE=DATE:20261013` without time,
 *   `DTSTART;TZID=Europe/Berlin:20261013T120000` with;
 * - or instead its deadline in `DUE`, like a homework I must hand in: `DUE;TZID=Europe/Berlin:20261023T120000`,
 *   or `DUE;VALUE=DATE:20261023` without time. iCalendar wants `DUE` of the same kind as `DTSTART`, both days or both
 *   times, so a box with a deadline has no `DTSTART`: the day of its deadline is its day, and it has no expected time.
 *   It shows from {@link deadlineDays} days before its deadline, so I start early, until it is done, at the latest
 *   on the day of its deadline, and on that day always, so I see there that it is done, at the top of each of those
 *   days, see {@link boxesRead}; it cannot be pushed;
 * - its expected duration in `ESTIMATED-DURATION`, like `ESTIMATED-DURATION:PT1H15M`, left out when it has none:
 *   the property of the task extensions of iCalendar (draft-ietf-calext-ical-tasks, approved by the IETF and waiting
 *   for its RFC number), since RFC 5545 has none for how long a to-do takes: its `DURATION` is the window to do it in,
 *   and after a `DTSTART` without time it may only be whole days;
 * - its state in `STATUS`: `NEEDS-ACTION` while open, `COMPLETED` with `COMPLETED`, the moment in UTC it was logged,
 *   and `CANCELLED` once dropped;
 * - each push in one `X-PUSHED` with the day it was pushed from, like `X-PUSHED:2026-10-13`, since the standard
 *   has nothing for it;
 * - its category, what, place, module, type and note as an entry of the log has them.
 * The log entry written from a box points to it with `X-PLANNED:<UID of the box>`, which gives its real time:
 * a box is done once a log entry points to it, or once it is `COMPLETED`, like a box ticked in another app.
 *
 * The plan files also hold events, `VEVENT`s: the lectures imported from TUMonline into the new system, and the plans
 * of the archive. Each is read as a box: its time is its start, its duration its length, and one of the whole day
 * is a box without time. A change keeps an event an event, so its time and duration stay: dropped, it is
 * `STATUS:CANCELLED`, which events have too, and it is done when a log entry points to it.
 * Old daily notes of the archive list their boxes in the callout Tagesplanungen; each without a plan entry of the same
 * title is a box too, without category, which the entry by category logs, see `src/day/boxes.ts`.
 *
 * Above its boxes a day shows its birthdays and holidays, those of my old calendar, see `sources.ts`, each on its date;
 * only my days that move from year to year, like Easter, move to their day by a rule, see {@link movingRules},
 * and no day is added.
 *
 * - `date-holidays`: Gives the day of each of my days that move, by its rule, in a year.
 * - `./calendar.ts`: Reads plan and log, writes to-dos, changes and removes them, and calculates with days.
 * - `./categories.ts`: Tells whether a box fits its category, and names the category of skill entries.
 * - `./gifts.ts`: Reads my gift ideas for the birthdays and holidays.
 * - `./note.ts`: Reads the boxes of an old daily note.
 * - `./sources.ts`: Names the plan, the log and the birthdays and holidays, and builds the path of a plan file.
 */

import Holidays from "date-holidays";
import {
    berlinDateOf, berlinDayStartOf, berlinLater, dayAdd, entriesRead, entryChange, entryFind, entryLookup, entryRemove,
    livedDayOf, propertiesPut, statusPut, todoAppend, todoChange,
} from "./calendar.ts";
import { planAllows, skillName } from "./categories.ts";
import { giftOf, giftsRead } from "./gifts.ts";
import { pointsRead } from "./note.ts";
import { day, monthFileOf, planEnding } from "./sources.ts";

import type { HolidaysTypes } from "date-holidays";
import type { Entry, EntryFields, EntryTexts, TodoFields } from "./calendar.ts";
import type { Gift } from "./gifts.ts";


/**
 * State of a box: open, done, since a log entry points to it, or dropped.
 */
export type BoxState = "open" | "done" | "dropped";

/**
 * A box, as the page shows it.
 *
 * - `id`: Identifier of its to-do or event, its `UID`; empty for a box of an old daily note.
 * - `category`, `title`, `location`, `from`, `module`, `type`, `note`: As those of an entry, see `calendar.ts`;
 *   a box of an old daily note has only its title.
 * - `day`: Its day, like `2026-10-13`; for a box with a deadline the day of its deadline.
 * - `time`: Expected time as ISO instant, empty for none.
 * - `minutes`: Expected duration in minutes, `null` for none.
 * - `deadline`: Deadline as ISO instant, or as its day like `2026-10-23` when it has no time; empty for none.
 * - `state`: Whether it is open, done or dropped.
 * - `pushed`: Days it was pushed from to the next day, in order, like `2026-10-12`.
 * - `log`: Start and end of the log entry written from it, as ISO instants, `null` for none.
 * - `editable`: Whether it lies in the new system, so it can be changed, pushed, dropped and removed.
 * - `todo`: Whether it is a to-do; an event keeps its time and duration, see the top of this file.
 */
export type Box = EntryTexts & {
    id: string;
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
 * A birthday or holiday of a day, as the page shows it.
 *
 * - `title`: Its name as my calendar writes it, like `Geburtstag: KarlbauerFlorian`.
 * - `gift`: My gift idea for it, see `gifts.ts`, empty for none.
 */
export type Occasion = {
    title: string;
    gift: string;
};

/**
 * The plan of a day, as the page shows it.
 *
 * - `day`: The day, like `2026-10-13`.
 * - `occasions`: Its birthdays and holidays, each with my gift idea for it.
 * - `boxes`: Its boxes in their order, see {@link boxCompare}.
 */
export type PlanDay = {
    day: string;
    occasions: Occasion[];
    boxes: Box[];
};

/**
 * A new box, as the entry by category and an accepted suggestion send it; an empty field is not written.
 *
 * - `category`, `title`, `location`, `from`, `module`, `type`, `note`: As those of an entry of the log.
 * - `day`: Its day, like `2026-10-13`; for a box with a deadline the day of its deadline.
 * - `time`: Expected time as ISO instant, on its day, empty for none and for a box with a deadline.
 * - `minutes`: Expected duration in whole minutes, `null` for none.
 * - `deadline`: Deadline as ISO instant, or as its day like `2026-10-23` without time, empty for none.
 */
export type BoxNew = EntryTexts & {
    day: string;
    time: string;
    minutes: number | null;
    deadline: string;
};

/**
 * A changed box, as the entry by category sends it: a {@link BoxNew} with the identifier `id` of the box.
 */
export type BoxChange = BoxNew & { id: string };

/**
 * A minute in milliseconds.
 */
const minuteLength: number = 60 * 1000;

/**
 * Most minutes a box may be expected to last: a day.
 */
const dayMinutes: number = 24 * 60;

/**
 * Days before its deadline a box with a deadline shows in the plan, see {@link deadlineShows}.
 */
const deadlineDays: number = 4;

/**
 * Start of the log of the new system, 1 August 2026, after the archive's: only the new system logs boxes.
 */
const newSystemStart: string = "2026-08-01";

/**
 * My days of the old calendar that move from year to year, by their name there, each with the rule of `date-holidays`
 * that gives its day in a year: Easter and the days counted from it, a Sunday of a month, the last Sunday of March,
 * or a day of the Chinese year. Their yearly series keep the date of their first year, like Easter Sunday
 * on 31 March, right only in 2024, so each of their days moves to the day of its rule in its year, see {@link movedOf}.
 */
const movingRules: Record<string, string> = {
    "Faschingdienstag (Karneval)": "easter -47",
    "Gedenktag (Welt): Karsamstag": "easter -1",
    "Feiertag (Welt): Ostersonntag": "easter",
    "Feiertag (Welt): Ostermontag": "easter 1",
    "Feiertag (Nation): ChristiHimmelfahrt": "easter 39",
    "Feiertag: Pfingsten": "easter 49",
    "Feiertag: Pfingstmontag": "easter 50",
    "Feiertag (Nation): Fronleichnam": "easter 60",
    "Gedenktag: Muttertag": "2nd sunday in May",
    "Gedenktag: Vatertag": "2nd sunday in June",
    "Tag (Welt): Sommerzeit Beginn": "sunday before 04-01",
    "Feiertag (China): Silvester": "chinese 01-0-00",
    "Feiertag (China): Neujahr": "chinese 01-0-01",
    "Feiertag (China): 元宵节 Laternenfest": "chinese 01-0-15",
    "Feiertag (China): 端午节 Drachenbootfest": "chinese 05-0-05",
    "China-Feiertag: Mondfest 中秋节": "chinese 08-0-15",
};

/**
 * Calendar of `date-holidays` that knows only my days that move, see {@link movingDaysOf}.
 */
const movingDays: Holidays = movingDaysOf();


/**
 * Builds the path of the plan file of the month of a day.
 *
 * @param date - Day like `2026-10-13`
 * @returns Path like `2026/2026_10/2026_10_Plan.ics` in the folder of the new system
 */
function planFileOf(date: string): string {
    return monthFileOf(date, planEnding);
}

/**
 * Gives the day of an entry: the day of a whole-day entry, else the day of its start in Berlin time.
 *
 * @param entry - Entry of the plan or the log
 * @returns Day like `2026-10-13`
 */
function dayOf(entry: Entry): string {
    return entry.allDay ? entry.start : berlinDateOf(new Date(entry.start));
}

/**
 * Stops a day not written like `2026-10-13`.
 *
 * @param date - Day as sent
 * @throws {Error} - When it is not written like `2026-10-13`
 */
function dateCheck(date: string): void {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date))
        throw new Error(`No date ${date}`);
}

/**
 * Builds the calendar of `date-holidays` that knows only my days that move, each by its rule, see {@link movingRules}:
 * without a country, so it adds no day of its own.
 * - `calendar`: The calendar.
 *
 * @returns The calendar
 */
function movingDaysOf(): Holidays {
    const calendar: Holidays = new Holidays();
    Object.entries(movingRules).forEach(([title, rule]: [string, string]): void => {
        calendar.setHoliday(rule, { name: title, type: "observance" });
    });
    return calendar;
}

/**
 * Moves a birthday or holiday of my old calendar that moves from year to year to the day of its rule in its year,
 * see {@link movingRules}, like Easter Sunday 2027 from 31 March to 28 March; any other stays as it is.
 * - `moved`: Its day in its year by its rule, `undefined` for one that does not move.
 *
 * @param occasion - Birthday or holiday of my old calendar
 * @returns It on its day
 */
function movedOf(occasion: Entry): Entry {
    const moved: HolidaysTypes.Holiday | undefined = occasion.title in movingRules
        ? movingDays.getHolidays(occasion.start.slice(0, 4))
            .find((holiday: HolidaysTypes.Holiday): boolean => holiday.name === occasion.title)
        : undefined;
    return moved === undefined ? occasion
        : { ...occasion, start: moved.date.slice(0, 10), end: dayAdd(moved.date.slice(0, 10), 1) };
}

/**
 * Reads the log entries written from boxes, from the start of the new system to a day after a day,
 * so an entry of a box is found also when it lies long before the day of its box, like a homework I did early,
 * or a little after it.
 *
 * @param to - The day, like `2026-10-13`
 * @returns Log entries by the identifier of their box
 */
function logsOf(to: string): Map<string, Entry> {
    return new Map(entriesRead(day.log, berlinDayStartOf(newSystemStart), berlinDayStartOf(dayAdd(to, 1)))
        .filter((entry: Entry): boolean => entry.planned !== "")
        .map((entry: Entry): [string, Entry] => [entry.planned, entry]));
}

/**
 * Turns an entry of the plan, a to-do or an event, into a box, see the top of this file.
 * - `log`: The log entry written from it, `undefined` for none.
 *
 * @param entry - Entry of the plan
 * @param logs - Log entries written from boxes, by the identifier of their box
 * @returns The box
 */
function boxOf(entry: Entry, logs: Map<string, Entry>): Box {
    const log: Entry | undefined = logs.get(entry.id);
    let minutes: number | null = entry.minutes;
    if (!entry.todo)
        minutes = entry.allDay ? null : (Date.parse(entry.end) - Date.parse(entry.start)) / minuteLength;
    let state: BoxState = "open";
    if (entry.status === "CANCELLED")
        state = "dropped";
    else if (log !== undefined || entry.status === "COMPLETED")
        state = "done";
    return {
        id: entry.id, category: entry.category, title: entry.title, location: entry.location, from: entry.from,
        module: entry.module, type: entry.type, note: entry.note,
        day: dayOf(entry),
        time: entry.allDay ? "" : entry.start,
        minutes: minutes,
        deadline: entry.deadline,
        state: state,
        pushed: entry.pushed,
        log: log === undefined ? null : { start: log.start, end: log.end },
        editable: entry.editable,
        todo: entry.todo,
    };
}

/**
 * Lists the boxes of the daily note of a day, from its callout Tagesplanungen, as old notes of the archive have it,
 * each without a box of the plan of the same title: a box without category, time or duration, which stays open.
 *
 * @param date - Day like `2026-07-03`
 * @param planned - Boxes of the plan of the day
 * @returns Boxes of the note, none for a note without the callout
 */
function noteBoxesOf(date: string, planned: Box[]): Box[] {
    return pointsRead(date, "Tagesplanungen")
        .filter((title: string): boolean => !planned.some((box: Box): boolean => box.title === title))
        .map((title: string): Box => ({
            id: "", category: "", title: title, location: "", from: "", module: "", type: "", note: "",
            day: date, time: "", minutes: null, deadline: "", state: "open", pushed: [], log: null, editable: false,
            todo: false,
        }));
}

/**
 * Orders two boxes: those with a deadline first, by their deadline, since nothing is more urgent,
 * then those with a time, by their time, like my lectures, then those without, in the order they were read,
 * the order I planned them in; the dropped ones last, in the same order.
 * - `rankOf`: 0 for a box with a deadline, 1 for one with a time, 2 for one without, 3 more when dropped.
 *
 * @param first - A box
 * @param second - Another box
 * @returns Below zero when the first comes first, above zero when the second does, zero when they stay as they are
 */
function boxCompare(first: Box, second: Box): number {
    const rankOf: (box: Box) => number = (box: Box): number =>
        (box.deadline !== "" ? 0 : box.time === "" ? 2 : 1) + (box.state === "dropped" ? 3 : 0);
    return rankOf(first) - rankOf(second) || first.deadline.localeCompare(second.deadline)
        || first.time.localeCompare(second.time);
}

/**
 * Tells whether a box with a deadline shows on a day: on the day of its deadline always, so I see there that it is
 * done, and before it from {@link deadlineDays} days before that day, once done only until the day of its log entry.
 * - `last`: Day of its log entry as I live it, the day of its deadline while it has none.
 *
 * @param box - Box with a deadline
 * @param date - Day like `2026-10-20`
 * @returns Whether it shows on the day
 */
function deadlineShows(box: Box, date: string): boolean {
    const last: string = box.log === null ? box.day : livedDayOf(new Date(box.log.start));
    return date === box.day || (dayAdd(box.day, -deadlineDays) <= date && date < box.day && date <= last);
}

/**
 * Reads the plans of the days of a range: the birthdays and holidays of each day with my gift ideas for them,
 * and its boxes, those of the plan, each with its state and the time of its log entry, then those of an old daily note.
 * A box belongs to the day it starts on, a box with a deadline to each day it shows on, see {@link deadlineShows}.
 * - `from`: Start of the first day, in Berlin time.
 * - `logs`: Log entries written from boxes, until {@link deadlineDays} days after the last day, see {@link logsOf}.
 * - `boxes`: Boxes of the plan from the first day to {@link deadlineDays} days after the last,
 *   so a deadline after the range shows in it.
 * - `occasions`: Birthdays and holidays of the whole years of the range, those that move on their day,
 *   see {@link movedOf}, since one may lie outside the range in my old calendar and inside it on its day;
 *   a day shows each name once, since two series may move to the same day, like the two of Chinese New Year's Eve.
 * - `gifts`: My gift ideas.
 * - `days`: The plans so far.
 * - `planned`: Boxes of the plan of one day.
 *
 * @param start - First day, like `2026-10-13`
 * @param end - Day after the last, like `2026-10-14` for one day
 * @returns {@link PlanDay} of each day, in order
 * @throws {Error} - When a day is not written like `2026-10-13`
 */
export function boxesRead(start: string, end: string): PlanDay[] {
    dateCheck(start);
    dateCheck(end);
    const from: string = berlinDayStartOf(start);
    const logs: Map<string, Entry> = logsOf(dayAdd(end, deadlineDays));
    const boxes: Box[] = entriesRead(day.plan, from, berlinDayStartOf(dayAdd(end, deadlineDays)))
        .map((entry: Entry): Box => boxOf(entry, logs));
    const occasions: Entry[] = entriesRead(day.system, berlinDayStartOf(`${start.slice(0, 4)}-01-01`),
        berlinDayStartOf(`${Number(end.slice(0, 4)) + 1}-01-01`)).map(movedOf);
    const gifts: Gift[] = giftsRead();

    const days: PlanDay[] = [];
    for (let date: string = start; date < end; date = dayAdd(date, 1)) {
        const planned: Box[] = boxes.filter((box: Box): boolean =>
            box.deadline === "" ? box.day === date : deadlineShows(box, date));
        days.push({
            day: date,
            occasions: [...new Set(occasions
                .filter((occasion: Entry): boolean => occasion.allDay
                    ? occasion.start <= date && occasion.end > date : dayOf(occasion) === date)
                .map((occasion: Entry): string => occasion.title))]
                .map((title: string): Occasion => ({ title: title, gift: giftOf(gifts, date, title) })),
            boxes: [...planned, ...noteBoxesOf(date, planned)].sort(boxCompare),
        });
    }
    return days;
}

/**
 * Finds a box of the plan by its identifier, with its state.
 * - `file`, `entry`: Its `.ics` file and its entry.
 * - `date`: Its day.
 *
 * @param id - Identifier of the box
 * @returns Path of its `.ics` file, its entry and the box
 * @throws {Error} - When the plan holds no to-do or event that happens once with the identifier
 */
export function boxFind(id: string): [string, Entry, Box] {
    const [file, entry]: [string, Entry] = entryFind(day.plan, id);
    const date: string = dayOf(entry);
    return [file, entry, boxOf(entry, logsOf(dayAdd(date, 1)))];
}

/**
 * Finds an open box, the only kind to log: a done box is logged already, a dropped one I decided against.
 * - `box`: The box with its state.
 *
 * @param id - Identifier of the box
 * @returns The box
 * @throws {Error} - When there is no such box, or it is not open
 */
export function boxOpenFind(id: string): Box {
    const [, , box]: [string, Entry, Box] = boxFind(id);
    if (box.state !== "open")
        throw new Error(`${box.title} is ${box.state} already`);
    return box;
}

/**
 * Checks a new or changed box before it is written: its day, its fields, which fit its category, one I plan,
 * see {@link planAllows}, its time on its day, its duration, whole minutes of at most a day,
 * and its deadline, on its day and without expected time, see the top of this file.
 * - `deadlineDay`: Day of its deadline, empty for none.
 *
 * @param box - The box as sent
 * @throws {Error} - When one of them is not right
 */
function boxCheck(box: BoxNew): void {
    dateCheck(box.day);
    if (!planAllows(box))
        throw new Error(`No box ${box.category} ${box.title}`);
    if (box.time !== "" && berlinDateOf(new Date(box.time)) !== box.day)
        throw new Error(`${box.title}: its time lies on another day than ${box.day}`);
    if (box.minutes !== null && !(Number.isInteger(box.minutes) && box.minutes > 0 && box.minutes <= dayMinutes))
        throw new Error(`${box.title}: no duration of ${box.minutes} minutes`);
    const deadlineDay: string = box.deadline === "" || /^\d{4}-\d{2}-\d{2}$/.test(box.deadline) ? box.deadline
        : berlinDateOf(new Date(box.deadline));
    if (box.deadline !== "" && (deadlineDay !== box.day || box.time !== ""))
        throw new Error(`${box.title}: a box with a deadline lies on the day of its deadline, without expected time`);
}

/**
 * Turns a box as the page sends it into the fields of its to-do.
 *
 * @param box - New or changed box
 * @returns Fields of the to-do
 */
function todoFieldsOf(box: BoxNew): TodoFields {
    return {
        category: box.category, title: box.title, location: box.location, from: box.from,
        module: box.module, type: box.type, note: box.note,
        day: box.day, time: box.time === "" ? null : new Date(box.time), minutes: box.minutes, deadline: box.deadline,
    };
}

/**
 * Adds a box to the plan, as a to-do in the plan file of its day, see the top of this file.
 *
 * @param box - The box as the page sends it
 * @returns Identifier of the new box
 * @throws {Error} - When the box is not right, see {@link boxCheck}
 */
export function boxAdd(box: BoxNew): string {
    boxCheck(box);
    return todoAppend(planFileOf(box.day), todoFieldsOf(box));
}

/**
 * Changes a box of the new system, see {@link boxCheck}; it moves into the plan file of its new day when that is another.
 * A to-do changes as it is sent; an event, like a lecture imported from TUMonline, keeps a time and a duration,
 * its start and its end.
 * - `start`: New start of an event.
 * - `fields`: New fields and times of an event.
 *
 * @param change - The changed box as the page sends it
 * @throws {Error} - When there is no such box in the new system, the box is not right,
 *   or an event would lose its time or its duration
 */
export function boxEdit(change: BoxChange): void {
    const [file, entry]: [string, Entry, Box] = boxFind(change.id);
    if (!entry.editable)
        throw new Error(`${entry.title} may not be changed`);
    boxCheck(change);
    if (entry.todo) {
        todoChange(file, entry, todoFieldsOf(change), planFileOf(change.day));
        return;
    }

    if (change.time === "" || change.minutes === null)
        throw new Error(`${entry.title} is an event of the plan and keeps its time and its duration`);
    const start: Date = new Date(change.time);
    const fields: EntryFields = {
        category: change.category, title: change.title, location: change.location, from: change.from,
        module: change.module, type: change.type, note: change.note,
        start: start, end: new Date(start.getTime() + change.minutes * minuteLength),
    };
    entryChange(file, entry, fields, planFileOf(change.day));
}

/**
 * Removes a box of the new system that is not done, like one planned by mistake;
 * a box I decided against is dropped instead, see {@link boxDrop}, so it can be counted.
 * A done box stays, since its log entry points to it.
 *
 * @param id - Identifier of the box
 * @throws {Error} - When there is no such box in the new system, or it is done
 */
export function boxDelete(id: string): void {
    const [file, entry, box]: [string, Entry, Box] = boxFind(id);
    if (!entry.editable || box.state === "done")
        throw new Error(`${entry.title} may not be removed`);
    entryRemove(file, id);
}

/**
 * Pushes an open box of the new system to the next day, with one tap: notes the day it leaves in one more `X-PUSHED`,
 * then moves its day and its time by one day, its time of day kept, into the plan file of the next day.
 * A box with a deadline stays, since its day is the day of its deadline.
 * - `next`: The next day.
 * - `texts`: Its text fields, as they are.
 *
 * @param id - Identifier of the box
 * @throws {Error} - When there is no such box in the new system, it is not open, or it has a deadline
 */
export function boxPush(id: string): void {
    const [file, entry, box]: [string, Entry, Box] = boxFind(id);
    if (!entry.editable || box.state !== "open" || box.deadline !== "")
        throw new Error(`${entry.title} is no open box of the new system without deadline`);

    const next: string = dayAdd(box.day, 1);
    const texts: EntryTexts = {
        category: entry.category, title: entry.title, location: entry.location, from: entry.from,
        module: entry.module, type: entry.type, note: entry.note,
    };
    propertiesPut(file, id, [["x-pushed", [...entry.pushed, box.day]]]);
    if (entry.todo)
        todoChange(file, entry, {
            ...texts, day: next, time: box.time === "" ? null : berlinLater(new Date(box.time), 1), minutes: entry.minutes,
            deadline: "",
        }, planFileOf(next));
    else
        entryChange(file, entry, {
            ...texts, start: berlinLater(new Date(entry.start), 1), end: berlinLater(new Date(entry.end), 1),
        }, planFileOf(next));
}

/**
 * Drops a box of the new system that is not done, with one tap, or takes it back: a dropped box stays in its file
 * as `STATUS:CANCELLED`, so it can be counted; taken back, a to-do is `NEEDS-ACTION` again,
 * an event without status, as it was imported.
 *
 * @param id - Identifier of the box
 * @param dropped - Whether to drop it, else to take it back
 * @throws {Error} - When there is no such box in the new system, or it is done
 */
export function boxDrop(id: string, dropped: boolean): void {
    const [file, entry, box]: [string, Entry, Box] = boxFind(id);
    if (!entry.editable || box.state === "done")
        throw new Error(`${entry.title} cannot be dropped`);
    let status: string = "";
    if (dropped)
        status = "CANCELLED";
    else if (entry.todo)
        status = "NEEDS-ACTION";
    statusPut(file, id, status, null);
}

/**
 * Marks a box done once a log entry pointing to it is written: a to-do of the new system becomes `COMPLETED`,
 * as of now; an event, which has no such status, is done by the log entry alone.
 *
 * @param id - Identifier of the box
 * @throws {Error} - When the plan holds no to-do or event that happens once with the identifier
 */
export function boxDone(id: string): void {
    const [file, entry]: [string, Entry] = entryFind(day.plan, id);
    if (entry.todo && entry.editable)
        statusPut(file, id, "COMPLETED", new Date());
}

/**
 * Opens a box again once the log entry written from it is removed: a done to-do of the new system becomes
 * `NEEDS-ACTION`; a box no longer in the plan stays as it is.
 * - `found`: Its `.ics` file and its entry, `undefined` when it is gone.
 *
 * @param id - Identifier of the box
 */
export function boxReopen(id: string): void {
    const found: [string, Entry] | undefined = entryLookup(day.plan, id);
    if (found !== undefined && found[1].todo && found[1].editable && found[1].status === "COMPLETED")
        statusPut(found[0], id, "NEEDS-ACTION", null);
}

/**
 * Finds the open skill box of a module for a moment, which the attempts of that moment log, see `skill.ts`:
 * one of the new system whose expected time and duration hold the moment, like a tutorial, else one without time
 * of that day, like a study session; never one with a deadline, like a homework sheet, which I log myself.
 * - `boxes`: Open skill boxes of the module of the day without deadline, in the new system.
 *
 * @param module - Module code, like `IN2028`
 * @param now - The moment, like now
 * @returns The box, `undefined` when there is none
 */
export function skillBoxOf(module: string, now: Date): Box | undefined {
    const date: string = berlinDateOf(now);
    const boxes: Box[] = boxesRead(date, dayAdd(date, 1))[0].boxes.filter((box: Box): boolean =>
        box.category === skillName && box.module === module && box.state === "open" && box.editable
        && box.deadline === "");
    return boxes.find((box: Box): boolean => box.time !== "" && box.minutes !== null
            && Date.parse(box.time) <= now.getTime() && now.getTime() < Date.parse(box.time) + box.minutes * minuteLength)
        ?? boxes.find((box: Box): boolean => box.time === "");
}
