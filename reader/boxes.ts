/**
 * ## Boxes
 *
 * The plan of a day is a list of boxes, not a calendar: the log is my one calendar, see `day.ts`.
 * A box is what I intend to do on a day, by category like an entry of the log, with an expected time or without,
 * and with an expected duration or without: a lecture is a box with its time and duration, a study session one
 * with only its duration, a call one with neither. What happens anyway, like my sleep, I don't plan, see `categories.ts`.
 * When I do it, it goes into the log at its real time, see `boxLog` in `day.ts`, so expected and real time
 * can be compared later; a box I decide against is cancelled, dropped with one tap, and stays in its file
 * as `STATUS:CANCELLED`, so it can be counted. A box neither done nor cancelled stays on its day once that is over
 * and is carried along to today, see {@link boxesCarried}, until I do it or cancel it; it never moves into the next
 * days by itself, only when I push it there.
 *
 * A box of the new system is a to-do of iCalendar, a `VTODO`, in the plan file of its month,
 * like `2026/2026_10/2026_10_Plan.ics`, or in the plan of its module, like
 * `Skilling/IN2028_BusinessAnalyticsMachineLearning_Plan.ics`, both in `NomManagecalendar`, see `calendar.ts`;
 * a box of a month moves into the plan file of the month of its new day when its day changes, a box of a module stays:
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
 * - each push in one `X-PUSHED` with the day it was pushed from, as a date of the iCalendar format,
 *   like `X-PUSHED;VALUE=DATE:20261013`, since the standard has nothing for it;
 * - its category, what, place, module, type, semester and note as an entry of the log has them, a skill box its
 *   semester as `X-SEMESTER`, like `X-SEMESTER:2026W`, see `semesterFor` in `categories.ts`.
 * The log entry written from a box points to it the standard way, with `RELATED-TO:<UID of the box>`, which gives
 * its real time, an older one with `X-PLANNED:<UID of the box>`: a box is done once a log entry points to it,
 * or once it is `COMPLETED`, like a box ticked in another app.
 * An occurrence of a series in the plan, like a weekly lecture, is a box of its own: its identifier is the `UID`
 * of its series and its start as the series has it, after `#`,
 * like `weekly-lecture@nomsystem#2026-10-26T09:00:00.000Z`, see `entryIdOf` in `calendar.ts`, so its log entry
 * points to it alone, with that start as parameter, like
 * `RELATED-TO;X-RECURRENCE-ID=20261026T090000Z:weekly-lecture@nomsystem`, see `relatedOf` in `calendar.ts`,
 * and it is done by that log entry alone.
 * It is logged like any box, and dropped, pushed and changed alone, the series staying as it is: the first time,
 * it becomes a component of its own in the file of its series, with the same `UID` and its start in the series
 * as `RECURRENCE-ID`, see `occurrenceOwn` in `calendar.ts`, the way the standard changes one occurrence,
 * which a drop then marks `STATUS:CANCELLED`, as any dropped box, so it shows greyed and crossed and is counted;
 * it stays in that file, whatever its new day. It cannot be removed, since it belongs to its series.
 *
 * The plan files also hold events, `VEVENT`s, like the lectures imported from TUMonline.
 * Each is read as a box: its time is its start, its duration its length, and one of the whole day
 * is a box without time. A change keeps an event an event, so its time and duration stay: dropped, it is
 * `STATUS:CANCELLED`, which events have too, and it is done when a log entry points to it.
 *
 * Above its boxes a day shows its birthdays and holidays, those of `Birthdays.ics` and `Holidays.ics`
 * in `NomManagecalendar`, see `sources.ts`, each on its date, a yearly series on each of its days, with its category,
 * like `Birthday: KarlbauerFlorian` or `Holiday: Ostermontag (AT, DE)`, and my gift idea for it, its `DESCRIPTION`,
 * see `gifts.ts`; none of a file while it is missing.
 *
 * - `node:path`: Gives the name of a plan file.
 * - `./calendar.ts`: Reads plan and log, writes to-dos, changes and removes them, and calculates with days.
 * - `./categories.ts`: Tells whether a box fits its category, names the category of skill entries,
 *   and gives the semester of a skill box.
 * - `./documents.ts`: Writes what a skill box is, linking the folder of its skill.
 * - `./places.ts`: Gives the link of the place of a box.
 * - `./sources.ts`: Names the plan, the log and the birthdays and holidays, and builds the path of a plan file.
 */

import { basename } from "node:path";
import {
    berlinDateOf, berlinDayStartOf, berlinLater, dayAdd, entriesRead, entryChange, entryIdOf, entryLookup, entryRemove,
    occurrenceLookup, occurrenceOwn, pushesPut, statusPut, todoAppend, todoChange,
} from "./calendar.ts";
import { planAllows, semesterFor, skillName } from "./categories.ts";
import { titleOf } from "./documents.ts";
import { placeLinkOf } from "./places.ts";
import { day, monthFileOf, planEnding } from "./sources.ts";

import type { Entry, EntryFields, EntryTexts, Link, TodoFields } from "./calendar.ts";


/**
 * State of a box: open, done, since a log entry points to it, or dropped.
 */
export type BoxState = "open" | "done" | "dropped";

/**
 * A box, as the page shows it.
 *
 * - `id`: Identifier of its to-do or event, its `UID`, for an occurrence of a series with its start,
 *   see `entryIdOf` in `calendar.ts`.
 * - `category`, `title`, `titleLink`, `location`, `locationLink`, `from`, `module`, `type`, `semester`, `note`:
 *   As those of an entry, see `calendar.ts`, like the room of a lecture of my plan in `Skilling/` with its link
 *   as `ALTREP`.
 * - `day`: Its day, like `2026-10-13`; for a box with a deadline the day of its deadline.
 * - `time`: Expected time as ISO instant, empty for none.
 * - `minutes`: Expected duration in minutes, `null` for none.
 * - `deadline`: Deadline as ISO instant, or as its day like `2026-10-23` when it has no time; empty for none.
 * - `state`: Whether it is open, done or dropped.
 * - `pushed`: Days it was pushed from to the next day, in order, like `2026-10-12`.
 * - `log`: Start and end of the log entry written from it, as ISO instants, `null` for none.
 * - `editable`: Whether it can be changed, pushed and dropped: a to-do or an event with times, see `calendar.ts`,
 *   also one occurrence of a series.
 * - `series`: Whether it is one occurrence of a series, like a weekly lecture, which cannot be removed.
 * - `todo`: Whether it is a to-do; an event keeps its time and duration, see the top of this file.
 * - `links`: Its links, its `ATTACH`es, like the slides a lecture of my plan links, see `documents.ts`;
 *   none for none.
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
    series: boolean;
    todo: boolean;
    links: Link[];
};

/**
 * A birthday or holiday of a day, as the page shows it.
 *
 * - `id`: Its identifier in `Birthdays.ics` or `Holidays.ics`, its `UID`, shared by every year of its series.
 * - `category`: Its category, like `Birthday` or `Holiday`, empty for none.
 * - `title`: Its name as its file writes it, like `KarlbauerFlorian` or `Ostermontag (AT, DE)`.
 * - `gift`: My gift idea for it, its `DESCRIPTION`, see `gifts.ts`, empty for none.
 */
export type Occasion = {
    id: string;
    category: string;
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
 * - `category`, `title`, `location`, `from`, `module`, `type`, `note`: As those of an entry of the log;
 *   the link of its place the reader finds, see `placeLinkOf` in `places.ts`, and what a skill box is
 *   it writes from its skill and type, see `titleOf` in `documents.ts`.
 * - `semester`: Semester of a skill box, like `2026W`, the semester of its day when empty, see `semesterFor`
 *   in `categories.ts`; empty for any other box.
 * - `day`: Its day, like `2026-10-13`; for a box with a deadline the day of its deadline.
 * - `time`: Expected time as ISO instant, on its day, empty for none and for a box with a deadline.
 * - `minutes`: Expected duration in whole minutes, `null` for none.
 * - `deadline`: Deadline as ISO instant, or as its day like `2026-10-23` without time, empty for none.
 */
export type BoxNew = Omit<EntryTexts, "locationLink" | "titleLink"> & {
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
 * Builds the path of the plan file of the month of a day.
 *
 * @param date - Day like `2026-10-13`
 * @returns Path like `2026/2026_10/2026_10_Plan.ics` in `NomManagecalendar`
 */
function planFileOf(date: string): string {
    return monthFileOf(date, planEnding);
}

/**
 * Gives the plan file a box is written into once its day changes, see the top of this file: the plan file
 * of the month of its new day when it lies in the plan file of a month, like `2026_10_Plan.ics`,
 * else the file it lies in, like the plan of a module, `Skilling/IN2028_BusinessAnalyticsMachineLearning_Plan.ics`,
 * and always the file of its series for one occurrence of a series.
 *
 * @param file - Path of the plan file the box lies in
 * @param entry - Entry of the box
 * @param date - New day of the box, like `2026-11-02`
 * @returns Path like `2026/2026_11/2026_11_Plan.ics` or the path of its file
 */
function planFileAfter(file: string, entry: Entry, date: string): string {
    return entry.recurrence === "" && /^\d{4}_\d{2}_Plan\.ics$/.test(basename(file)) ? planFileOf(date) : file;
}

/**
 * Makes a box that is one occurrence of a series a component of its own before it is dropped, pushed or changed alone,
 * see `occurrenceOwn` in `calendar.ts`; any other box stays as it is.
 *
 * @param file - Path of the plan file the box lies in
 * @param entry - Entry of the box
 * @throws {Error} - When the file holds no such series or occurrence
 */
function boxOwn(file: string, entry: Entry): void {
    if (entry.recurrence !== "")
        occurrenceOwn(file, entry);
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
 * Reads the log entries written from boxes, from the first entry of the log to a day after a day,
 * so an entry of a box is found also when it lies long before the day of its box, like a homework I did early,
 * or a little after it.
 *
 * @param to - The day, like `2026-10-13`
 * @returns Log entries by the identifier of their box
 */
function logsOf(to: string): Map<string, Entry> {
    return new Map(entriesRead(day.log, "1970-01-01T00:00:00Z", berlinDayStartOf(dayAdd(to, 1)))
        .filter((entry: Entry): boolean => entry.planned !== "")
        .map((entry: Entry): [string, Entry] => [entry.planned, entry]));
}

/**
 * Finds the entry of the plan of a box by its identifier, see `entryIdOf` in `calendar.ts`: the to-do or event
 * that happens once with that `UID`, else the occurrence of a series named by the `UID` and the start after
 * the last `#`, a component of its own or not.
 * - `found`: Its `.ics` file and its entry, `undefined` while none is found.
 * - `at`: Place of the last `#`, -1 for none.
 *
 * @param id - Identifier of the box, like `weekly-lecture@nomsystem#2026-10-13T08:00:00.000Z`
 * @returns Path of its `.ics` file and its entry
 * @throws {Error} - When the plan holds no such entry
 */
function planEntryFind(id: string): [string, Entry] {
    let found: [string, Entry] | undefined = entryLookup(day.plan, id);
    const at: number = id.lastIndexOf("#");
    if (found === undefined && at !== -1)
        found = occurrenceLookup(day.plan, id.slice(0, at), id.slice(at + 1));
    if (found === undefined)
        throw new Error(`No box ${id}`);
    return found;
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
    const log: Entry | undefined = logs.get(entryIdOf(entry));
    let minutes: number | null = entry.minutes;
    if (!entry.todo)
        minutes = entry.allDay ? null : (Date.parse(entry.end) - Date.parse(entry.start)) / minuteLength;
    let state: BoxState = "open";
    if (entry.status === "CANCELLED")
        state = "dropped";
    else if (log !== undefined || entry.status === "COMPLETED")
        state = "done";
    return {
        id: entryIdOf(entry), category: entry.category, title: entry.title, titleLink: entry.titleLink,
        location: entry.location, locationLink: entry.locationLink, from: entry.from, module: entry.module,
        type: entry.type, semester: entry.semester, note: entry.note,
        day: dayOf(entry),
        time: entry.allDay ? "" : entry.start,
        minutes: minutes,
        deadline: entry.deadline,
        state: state,
        pushed: entry.pushed,
        log: log === undefined ? null : { start: log.start, end: log.end },
        editable: entry.editable,
        series: entry.recurrence !== "",
        todo: entry.todo,
        links: entry.links,
    };
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
 * - `last`: Day of its log entry, the day of its deadline while it has none.
 *
 * @param box - Box with a deadline
 * @param date - Day like `2026-10-20`
 * @returns Whether it shows on the day
 */
function deadlineShows(box: Box, date: string): boolean {
    const last: string = box.log === null ? box.day : berlinDateOf(new Date(box.log.start));
    return date === box.day || (dayAdd(box.day, -deadlineDays) <= date && date < box.day && date <= last);
}

/**
 * Reads the plans of the days of a range: the birthdays and holidays of each day with my gift ideas for them,
 * their `DESCRIPTION`s, and its boxes, each with its state and the time of its log entry.
 * A box belongs to the day it starts on, a box with a deadline to each day it shows on, see {@link deadlineShows}.
 * - `from`: Start of the first day, in Berlin time.
 * - `logs`: Log entries written from boxes, until {@link deadlineDays} days after the last day, see {@link logsOf}.
 * - `boxes`: Boxes of the plan from the first day to {@link deadlineDays} days after the last,
 *   so a deadline after the range shows in it.
 * - `occasions`: Birthdays and holidays of the days of the range, none of a file while it is missing.
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
    const occasions: Entry[] = entriesRead(day.system, from, berlinDayStartOf(end));

    const days: PlanDay[] = [];
    for (let date: string = start; date < end; date = dayAdd(date, 1)) {
        const planned: Box[] = boxes.filter((box: Box): boolean =>
            box.deadline === "" ? box.day === date : deadlineShows(box, date));
        days.push({
            day: date,
            occasions: occasions
                .filter((occasion: Entry): boolean => occasion.allDay
                    ? occasion.start <= date && occasion.end > date : dayOf(occasion) === date)
                .map((occasion: Entry): Occasion => ({
                    id: occasion.id, category: occasion.category, title: occasion.title, gift: occasion.note.trim(),
                })),
            boxes: planned.sort(boxCompare),
        });
    }
    return days;
}

/**
 * Reads the boxes carried along to a day: those of the days before it that are neither done nor cancelled,
 * also a box whose deadline is over and one date of a series, like a lecture I did not log, each on its own day,
 * by their days, the boxes of one day in their order, see {@link boxCompare}; they stay there until I do them
 * or cancel them.
 * - `logs`: Log entries written from boxes, up to the day after the day, see {@link logsOf}.
 *
 * @param date - The day, like `2026-10-13`, today on the page
 * @returns The boxes, the earliest first, none when all are done or cancelled
 * @throws {Error} - When the day is not written like `2026-10-13`
 */
export function boxesCarried(date: string): Box[] {
    dateCheck(date);
    const logs: Map<string, Entry> = logsOf(date);
    return entriesRead(day.plan, "1970-01-01T00:00:00Z", berlinDayStartOf(date))
        .map((entry: Entry): Box => boxOf(entry, logs))
        .filter((box: Box): boolean => box.state === "open" && box.day < date)
        .sort((first: Box, second: Box): number => first.day.localeCompare(second.day) || boxCompare(first, second));
}

/**
 * Reads the skill boxes of the plan, of every module and type, from the first entry of the plan to a day,
 * done, cancelled and open alike, each with its state, for the list of each module by type, see `skill.ts`;
 * a series without end stops at that day.
 * - `logs`: Log entries written from boxes, up to the day after the day, see {@link logsOf}.
 *
 * @param until - Day after the last, like `2027-10-14`
 * @returns The skill boxes, in the order they were read
 * @throws {Error} - When the day is not written like `2026-10-13`
 */
export function skillBoxesRead(until: string): Box[] {
    dateCheck(until);
    const logs: Map<string, Entry> = logsOf(until);
    return entriesRead(day.plan, "1970-01-01T00:00:00Z", berlinDayStartOf(until))
        .map((entry: Entry): Box => boxOf(entry, logs))
        .filter((box: Box): boolean => box.category === skillName);
}

/**
 * Finds a box of the plan by its identifier, with its state, also an occurrence of a series, see {@link planEntryFind}.
 * - `file`, `entry`: Its `.ics` file and its entry.
 * - `date`: Its day.
 *
 * @param id - Identifier of the box, like `study-13@nomsystem`
 * @returns Path of its `.ics` file, its entry and the box
 * @throws {Error} - When the plan holds no such box
 */
export function boxFind(id: string): [string, Entry, Box] {
    const [file, entry]: [string, Entry] = planEntryFind(id);
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
 * see {@link planAllows}, or keep what the box was, its category and title, for a skill box its skill and type,
 * like an older `IN2028 DEV` of a type no longer offered, its time on its day, its duration, whole minutes
 * of at most a day, and its deadline, on its day and without expected time, see the top of this file.
 * - `kept`: Whether a changed box keeps what it was.
 * - `deadlineDay`: Day of its deadline, empty for none.
 *
 * @param box - The box as sent
 * @param old - The box as it was, `null` for a new one
 * @throws {Error} - When one of them is not right
 */
function boxCheck(box: BoxNew, old: Entry | null): void {
    const kept: boolean = old !== null && box.category === old.category && (box.category === skillName
        ? box.module === old.module && box.type === old.type : box.title === old.title);
    dateCheck(box.day);
    if (!(kept || planAllows(box)))
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
 * Turns a box as the page sends it into the fields of its to-do: its place with its link, see `placeLinkOf`
 * in `places.ts`, and what a skill box is as the reader writes it, see `titleOf` in `documents.ts`.
 * - `title`, `titleLink`: What it is, its `SUMMARY`, and the link of it.
 *
 * @param box - New or changed box
 * @param old - The box as it was, `null` for a new one
 * @returns Fields of the to-do
 */
function todoFieldsOf(box: BoxNew, old: Entry | null): TodoFields {
    const [title, titleLink]: [string, string] = titleOf(box);
    return {
        category: box.category, title: title, titleLink: titleLink, location: box.location,
        locationLink: placeLinkOf(box.location, old), from: box.from, module: box.module, type: box.type,
        semester: semesterFor(box.category, box.semester, box.day), note: box.note,
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
    boxCheck(box, null);
    return todoAppend(planFileOf(box.day), todoFieldsOf(box, null));
}

/**
 * Changes a box of the new system, see {@link boxCheck}, one occurrence of a series alone, see {@link boxOwn};
 * a box of a month moves into the plan file of its new day when that is another, see {@link planFileAfter}.
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
    boxCheck(change, entry);
    boxOwn(file, entry);
    if (entry.todo) {
        todoChange(file, entry, todoFieldsOf(change, entry), planFileAfter(file, entry, change.day));
        return;
    }

    if (change.time === "" || change.minutes === null)
        throw new Error(`${entry.title} is an event of the plan and keeps its time and its duration`);
    const start: Date = new Date(change.time);
    const [title, titleLink]: [string, string] = titleOf(change);
    const fields: EntryFields = {
        category: change.category, title: title, titleLink: titleLink, location: change.location,
        locationLink: placeLinkOf(change.location, entry), from: change.from,
        module: change.module, type: change.type, semester: semesterFor(change.category, change.semester, change.day),
        note: change.note,
        start: start, end: new Date(start.getTime() + change.minutes * minuteLength),
    };
    entryChange(file, entry, fields, planFileAfter(file, entry, change.day));
}

/**
 * Removes a box of the new system that is not done, like one planned by mistake;
 * a box I decided against is dropped instead, see {@link boxDrop}, so it can be counted.
 * A done box stays, since its log entry points to it, and so does one occurrence of a series, which belongs to it.
 *
 * @param id - Identifier of the box
 * @throws {Error} - When there is no such box in the new system, it is done, or it is one occurrence of a series
 */
export function boxDelete(id: string): void {
    const [file, entry, box]: [string, Entry, Box] = boxFind(id);
    if (!entry.editable || box.state === "done" || box.series)
        throw new Error(`${entry.title} may not be removed`);
    entryRemove(file, id);
}

/**
 * Pushes an open box of the new system to the next day, with one tap: notes the day it leaves in one more `X-PUSHED`,
 * then moves its day and its time by one day, its time of day kept, a box of a month into the plan file
 * of the next day, see {@link planFileAfter}; one occurrence of a series alone, see {@link boxOwn}.
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
        category: entry.category, title: entry.title, titleLink: entry.titleLink, location: entry.location,
        locationLink: entry.locationLink, from: entry.from, module: entry.module, type: entry.type,
        semester: entry.semester, note: entry.note,
    };
    boxOwn(file, entry);
    pushesPut(file, id, [...entry.pushed, box.day]);
    if (entry.todo)
        todoChange(file, entry, {
            ...texts, day: next, time: box.time === "" ? null : berlinLater(new Date(box.time), 1), minutes: entry.minutes,
            deadline: "",
        }, planFileAfter(file, entry, next));
    else
        entryChange(file, entry, {
            ...texts, start: berlinLater(new Date(entry.start), 1), end: berlinLater(new Date(entry.end), 1),
        }, planFileAfter(file, entry, next));
}

/**
 * Drops a box of the new system that is not done, with one tap, or takes it back: a dropped box stays in its file
 * as `STATUS:CANCELLED`, so it can be counted; taken back, a to-do is `NEEDS-ACTION` again,
 * an event without status, as it was imported. One occurrence of a series drops alone, see {@link boxOwn},
 * like the lecture `IN2028 VO` on 26.10.2026, the series staying.
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
    boxOwn(file, entry);
    statusPut(file, id, status, null);
}

/**
 * Marks a box done once a log entry pointing to it is written: a to-do that happens once becomes `COMPLETED`,
 * as of now; an event, which has no such status, and an occurrence of a series are done by the log entry alone.
 *
 * @param id - Identifier of the box, like `study-13@nomsystem`
 * @throws {Error} - When the plan holds no such box
 */
export function boxDone(id: string): void {
    const [file, entry]: [string, Entry] = planEntryFind(id);
    if (entry.todo && entry.editable && entry.recurrence === "")
        statusPut(file, id, "COMPLETED", new Date());
}

/**
 * Opens a box again once the log entry written from it is removed: a done to-do of the new system becomes
 * `NEEDS-ACTION`; an occurrence of a series is open again by itself, and a box no longer in the plan stays as it is.
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
 * of that day, like a study session; never one with a deadline, like a homework sheet, which I log myself,
 * nor one occurrence of a series, like a weekly lecture.
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
        && !box.series && box.deadline === "");
    return boxes.find((box: Box): boolean => box.time !== "" && box.minutes !== null
            && Date.parse(box.time) <= now.getTime() && now.getTime() < Date.parse(box.time) + box.minutes * minuteLength)
        ?? boxes.find((box: Box): boolean => box.time === "");
}
