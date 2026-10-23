/**
 * ## Boxes
 *
 * The plan of a day is a list of boxes, not a calendar: the log is my one calendar, see `day.ts`.
 * A box is what I intend to do on a day, by category like an entry of the log, with an expected time or without,
 * and with an expected duration or without: a lecture is a box with its time and duration, a study session one
 * with only its duration, a call one with neither. What happens anyway, like my sleep, I don't plan, see `categories.ts`.
 * When I do it, it goes into the log at its real time, see `boxLog` in `day.ts`, so expected and real time
 * can be compared later; a box I decide against is cancelled, dropped with one tap, and stays in its file
 * as `STATUS:CANCELLED`, so it can be counted; `STATUS:CANCELLED` is always my own decision, lectures included.
 * A box neither done nor cancelled stays on its day once that is over and is carried along to today,
 * see {@link boxesCarried}, lectures too, until I do it, cancel it or push it; it never moves into the next days
 * by itself, only when I push it there, a box whose day is over to tomorrow, see {@link boxPush}. A pushed box
 * stays greyed on each day it left, once per push, with the start and the length it had there, like a skipped box,
 * see {@link leftBoxesOf}; it is not carried along from there.
 * A lecture, an exercise, a tutorial and a sheet, a skill box of a type of {@link numberedTypes}, carries its number
 * in its series, the boxes of the same skill and type by date, as `X-NUMBER`, like `X-NUMBER:3`, the next one when
 * the dialog adds it, see {@link numberNextOf}. One the university cancels gets `X-NUMBER:NONE` by its own button,
 * see {@link boxUniversity}, and the later ones of its series move up a number; it is neither done nor carried along.
 * A box repeated weekly in the dialog of a new box, like my gym on Mondays and Thursdays, is no rule in a file either:
 * it is one box per date, each as the dialog adds one alone, see {@link boxesAdd}, a lecture's numbered as its series,
 * see `repeatApply` in `course.ts`.
 *
 * A box of the new system is a to-do of iCalendar, a `VTODO`, in the plan of its month, like `Living/2026_10_Plan.ics`,
 * or a skill box in the plan of its skill, like `University/IN2028_BusinessAnalyticsMachineLearning_Plan.ics`,
 * both in `NomManagecalendar`, see `sources.ts` and `calendar.ts`; a box moves into the plan it belongs into
 * when its day moves into another year or it changes its category or its skill, also one from a month file
 * of the layout before, see {@link planFileAfter}:
 * - its day and its expected time in `DTSTART`: `DTSTART;VALUE=DATE:20261013` without time,
 *   `DTSTART;TZID=Europe/Berlin:20261013T120000` with;
 * - or instead its deadline in `DUE`, like a homework I must hand in: `DUE;TZID=Europe/Berlin:20261023T120000`,
 *   or `DUE;VALUE=DATE:20261023` without time. iCalendar wants `DUE` of the same kind as `DTSTART`, both days or both
 *   times, so a box with a deadline has no `DTSTART`: the day of its deadline is its day, and it has no expected time.
 *   It shows from {@link deadlineDays} days before its deadline, so I start early, until the day of its deadline,
 *   once done only until the day of its last session, see {@link deadlineShows}, and on that day always, so I see there that it is done, at the top of each of those
 *   days, see {@link boxesRead}; it cannot be pushed. It is done only once I tick it submitted, see {@link boxSubmit},
 *   since the log entries pointing to it are its sessions, as many as it needs;
 * - its expected duration in `ESTIMATED-DURATION`, like `ESTIMATED-DURATION:PT1H15M`, left out when it has none:
 *   the property of the task extensions of iCalendar (draft-ietf-calext-ical-tasks, approved by the IETF and waiting
 *   for its RFC number), since RFC 5545 has none for how long a to-do takes: its `DURATION` is the window to do it in,
 *   and after a `DTSTART` without time it may only be whole days;
 * - its state in `STATUS`: `NEEDS-ACTION` while open, `COMPLETED` once done, without the moment it was done,
 *   since the log entry written from it holds its real time, and `CANCELLED` once dropped;
 * - each push to a later day, by its arrow or its day in the dialog, see {@link boxPush} and {@link boxEdit},
 *   in one `X-PUSHED` with its start and its length as they stood before, since the standard has nothing for it,
 *   like `X-PUSHED;TZID=Europe/Berlin;X-ESTIMATED-DURATION=PT3H15M;VALUE=DATE-TIME:20261016T150000`, see `pushAdd`
 *   in `calendar.ts`;
 * - its category, what, place, module, type, semester and note as an entry of the log has them, a skill box its
 *   semester as `X-SEMESTER`, like `X-SEMESTER:2026W`, see `semesterFor` in `categories.ts`, its chapters
 *   as `X-CHAPTER`s and the documents it will use as `ATTACH`es, like the slides of a lecture,
 *   see `linksOf` in `documents.ts`, which a log entry from it gets too.
 * The log entry written from a box points to it the standard way, with `RELATED-TO:<UID of the box>`, which gives
 * its real time, an older one with `X-PLANNED:<UID of the box>`: a box without deadline is done once a log entry
 * points to it, and any box once it is `COMPLETED`, like a box ticked in another app or a homework ticked submitted.
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
 * in `NomManagecalendar/Meta/`, see `sources.ts`, each on its date, a yearly series on each of its days,
 * with its category, like `Birthday: Karlbauer Florian` or `Holiday: Ostermontag (AT, DE)`, and my gift idea for it,
 * its `DESCRIPTION`, see `gifts.ts`; none of a file while it is missing.
 *
 * - `./calendar.ts`: Reads plan and log, writes to-dos, changes and removes them, and calculates with days.
 * - `./categories.ts`: Tells whether a box fits its category, names the category of skill entries,
 *   and gives the semester of a skill box.
 * - `./documents.ts`: Writes what a skill box is, linking the folder of its skill and of its material, its links
 *   to documents,
 *   reads its chapters, and gives the plan a box belongs into.
 * - `./notes.ts`: Finds the chapters of a module, which a skill box may name.
 * - `./places.ts`: Gives the link of the place of a box.
 * - `./sources.ts`: Names the plan, the log and the birthdays and holidays.
 */

import {
    berlinDateOf, berlinDayStartOf, berlinLater, dayAdd, entriesOnceRead, entriesRead, entryChange, entryIdOf,
    entryLookup, entryRemove, occurrenceLookup, occurrenceOwn, propertiesPut, pushAdd, pushTake, statusPut, todoAppend,
    todoChange,
} from "./calendar.ts";
import { attendeesAllow, categoryAllows, semesterFor, skillName } from "./categories.ts";
import { calendarFileOf, chaptersOf, linksOf, titleOf } from "./documents.ts";
import { moduleContentsRead, moduleFolderOf } from "./notes.ts";
import { onlineFor, placeLinkOf } from "./places.ts";
import { day, planEnding } from "./sources.ts";

import type { Attendee, Entry, EntryFields, EntryTexts, Link, Online, Push, TodoFields } from "./calendar.ts";


/**
 * State of a box: open, done, since a log entry points to it, dropped, cancelled by me, cancelled
 * by the university, its `X-NUMBER:NONE`, or pushed, as it shows greyed on a day it left, see {@link leftBoxesOf}.
 */
export type BoxState = "open" | "done" | "dropped" | "university" | "pushed";

/**
 * Types of skill boxes that carry their number in their series: lectures, exercises, central exercises, tutorials
 * and sheets; the series of the course of a module, see `course.ts`.
 */
export const numberedTypes: string[] = ["VO", "UE", "ZU", "TU", "HU"];

/**
 * A box, as the page shows it.
 *
 * - `id`: Identifier of its to-do or event, its `UID`, for an occurrence of a series with its start,
 *   see `entryIdOf` in `calendar.ts`.
 * - `category`, `title`, `titleLink`, `location`, `locationLink`, `online`, `onlineLink`, `passcode`, `from`, `module`,
 *   `type`, `semester`, `note`: As those of an entry, see `calendar.ts`, like the room of a lecture of my plan in `Skilling/` with its link
 *   as `ALTREP`.
 * - `day`: Its day, like `2026-10-13`; for a box with a deadline the day of its deadline.
 * - `time`: Expected time as ISO instant, empty for none.
 * - `minutes`: Expected duration in minutes, `null` for none.
 * - `deadline`: Deadline as ISO instant, or as its day like `2026-10-23` when it has no time; empty for none.
 * - `state`: Whether it is open, done, dropped, cancelled by the university, or pushed from the day it shows on.
 * - `pushed`: Where it stood before each push to a later day, in order, see `Push` in `calendar.ts`,
 *   like Fri, 16.10.2026, 15:00 for 195 minutes.
 * - `log`: Start and end of the log entry written from it, for a box with a deadline of its last session,
 *   as ISO instants, `null` for none.
 * - `editable`: Whether it can be changed, pushed and dropped: a to-do or an event with times, see `calendar.ts`,
 *   also one occurrence of a series.
 * - `series`: Whether it is one occurrence of a series, like a weekly lecture, which cannot be removed.
 * - `todo`: Whether it is a to-do; an event keeps its time and duration, see the top of this file.
 * - `links`: Its links, its `ATTACH`es, like the slides a lecture of my plan links, see `documents.ts`;
 *   none for none.
 * - `chapters`: Chapters of my system a skill box belongs to, its `X-CHAPTER`s, or those whose folders an older box
 *   links, see `chaptersOf` in `documents.ts`, like `02_LogisticPoissonRegression`; none for none.
 * - `number`: Its number in its series, its `X-NUMBER`, like `3`, `NONE` for one the university cancelled;
 *   empty for none.
 * - `group`: The group of a tutorial whose session it goes to, its `X-GROUP`, like `03`, see `course.ts`;
 *   empty for none.
 * - `picked`: Whether I picked its group by hand for its week, its `X-PICKED:TRUE`, see `weekPick` in `course.ts`.
 * - `moved`: For a box shown greyed on a day it was pushed from, where it went, see {@link Moved};
 *   `null` for any other.
 */
export type Box = EntryTexts & {
    id: string;
    day: string;
    time: string;
    minutes: number | null;
    deadline: string;
    state: BoxState;
    pushed: Push[];
    log: { start: string; end: string } | null;
    editable: boolean;
    series: boolean;
    todo: boolean;
    links: Link[];
    chapters: string[];
    number: string;
    group: string;
    picked: boolean;
    moved: Moved | null;
};

/**
 * Where a box went that shows greyed on a day it was pushed from, see {@link leftBoxesOf}.
 *
 * - `day`: The day it stands on now, like `2026-10-17`.
 * - `last`: Whether it is its last push and the box is still open and can be changed, so the push can be taken back,
 *   see {@link boxUnpush}.
 */
export type Moved = {
    day: string;
    last: boolean;
};

/**
 * A birthday or holiday of a day, as the page shows it.
 *
 * - `id`: Its identifier in `Birthdays.ics` or `Holidays.ics`, its `UID`, shared by every year of its series.
 * - `category`: Its category, like `Birthday` or `Holiday`, empty for none.
 * - `title`: Its name as its file writes it, like `Karlbauer Florian` or `Ostermontag (AT, DE)`.
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
 * - `online`, `onlineLink`, `passcode`: What I will do online, as for an entry of the log, see `EntryNew` in `day.ts`;
 *   left out by a sender that does not know them, like an accepted suggestion, so a changed box keeps them.
 * - `attendees`: Who I will be with, one `ATTENDEE` each; left out by a sender that does not know it, like
 *   an accepted suggestion, so a changed box keeps its people and a new one has none.
 * - `semester`: Semester of a skill box, like `2026W`, the semester of its day when empty, see `semesterFor`
 *   in `categories.ts`; empty for any other box.
 * - `day`: Its day, like `2026-10-13`; for a box with a deadline the day of its deadline.
 * - `time`: Expected time as ISO instant, on its day, empty for none and for a box with a deadline.
 * - `minutes`: Expected duration in whole minutes, `null` for none.
 * - `deadline`: Deadline as ISO instant, or as its day like `2026-10-23` without time, empty for none.
 * - `chapters`: Names of the chapters of my system a skill box belongs to, like `01_RegressionAnalysis`,
 *   none for none and for any other box.
 * - `documents`: Paths from the folder of its skill of the documents a skill box will use, like
 *   `VO_UniversityLectureLessons/TUM_2026W/01_Introduction.pdf`, none for none and for any other box.
 */
export type BoxNew = Omit<EntryTexts, "locationLink" | "titleLink" | "attendees" | keyof Online> & Partial<Online> & {
    attendees?: Attendee[];
    day: string;
    time: string;
    minutes: number | null;
    deadline: string;
    chapters: string[];
    documents: string[];
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
 * Gives the plan a box belongs into, see the top of this file: the plan of its skill for a skill box,
 * else the plan of the month of its day, see `calendarFileOf` in `documents.ts`.
 *
 * @param box - Category and skill of the box, like `Skill` and `IN2028`, or `Talk` and no skill
 * @param date - Its day, like `2026-10-13`
 * @returns Path like `University/IN2028_BusinessAnalyticsMachineLearning_Plan.ics` or `Living/2026_10_Plan.ics`
 *   in `NomManagecalendar`
 */
function planFileOf(box: { category: string; module: string }, date: string): string {
    return calendarFileOf(box, date, planEnding);
}

/**
 * Gives the plan file a box is written into once it changes, see the top of this file: the plan it belongs into
 * with its new category, skill and day, see {@link planFileOf}, also for a box from a month file of the layout before,
 * like `2026/2026_10/2026_10_Plan.ics`; always the file of its series for one occurrence of a series.
 *
 * @param file - Path of the plan file the box lies in
 * @param entry - Entry of the box
 * @param box - New category and skill of the box
 * @param date - New day of the box, like `2027-01-04`
 * @returns Path like `Living/2027_01_Plan.ics` or the path of its file
 */
function planFileAfter(file: string, entry: Entry, box: { category: string; module: string }, date: string): string {
    return entry.recurrence === "" ? planFileOf(box, date) : file;
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
 * or a little after it; for a box with a deadline its last session, so the entries go in by their start.
 *
 * @param to - The day, like `2026-10-13`
 * @returns Log entries by the identifier of their box
 */
function logsOf(to: string): Map<string, Entry> {
    return new Map(entriesRead(day.log, "1970-01-01T00:00:00Z", berlinDayStartOf(dayAdd(to, 1)))
        .filter((entry: Entry): boolean => entry.planned !== "")
        .sort((first: Entry, second: Entry): number => Date.parse(first.start) - Date.parse(second.start))
        .map((entry: Entry): [string, Entry] => [entry.planned, entry]));
}

/**
 * Gives the last day whose log entries tell the state of the boxes of a day, see {@link logsOf}: that day, or today
 * in Berlin time when it is later, since a box carried along is done by a log entry of the day I do it, like the box
 * of 18.10 my session of 22.10 did, which is done then on 18.10 too, and taken back with one click on its check.
 * - `today`: Today in Berlin time.
 *
 * @param date - The day, like `2026-10-18`
 * @returns The later of that day and today, like `2026-10-22`
 */
function logsUntilOf(date: string): string {
    const today: string = berlinDateOf(new Date());
    return date < today ? today : date;
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
 * Turns an entry of the plan, a to-do or an event, into a box, see the top of this file: dropped while I cancelled it,
 * done once it is `COMPLETED`, or one without deadline once a log entry points to it, cancelled by the university
 * while its number is `NONE`, else open.
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
    else if (entry.status === "COMPLETED" || (log !== undefined && entry.deadline === ""))
        state = "done";
    else if (entry.number === "NONE")
        state = "university";
    return {
        id: entryIdOf(entry), category: entry.category, title: entry.title, titleLink: entry.titleLink,
        location: entry.location, locationLink: entry.locationLink, online: entry.online, onlineLink: entry.onlineLink,
        passcode: entry.passcode, from: entry.from, attendees: entry.attendees,
        module: entry.module, type: entry.type, semester: entry.semester, note: entry.note,
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
        chapters: chaptersOf(entry),
        number: entry.number,
        group: entry.group,
        picked: entry.picked,
        moved: null,
    };
}

/**
 * Gives a box as it stood on each day it was pushed from, see the top of this file: once per push, greyed like
 * a skipped box, with the start and the length it had there, see `Push` in `calendar.ts`, else the length it has now,
 * without deadline, since a box with one is never pushed, and with the pushes before that one; each knows the day
 * the box stands on now, and the last one whether its push can be taken back, see {@link Moved}.
 *
 * @param box - The box as it stands now
 * @returns One greyed box per push, in the order of its pushes, none for a box never pushed
 */
function leftBoxesOf(box: Box): Box[] {
    return box.pushed.map((push: Push, index: number): Box => ({
        ...box, day: push.day, time: push.time, minutes: push.minutes ?? box.minutes, deadline: "", state: "pushed",
        pushed: box.pushed.slice(0, index), log: null,
        moved: { day: box.day, last: index === box.pushed.length - 1 && box.state === "open" && box.editable },
    }));
}

/**
 * Orders two boxes as the stations of the day, so the plan reads like the log: those with a time by their time,
 * like my lectures, also one cancelled or pushed away, which keeps its place faded, then those with a deadline by their
 * deadline, then those without either in the order they were read, the order I planned them in, the cancelled
 * and pushed ones of them last.
 * - `rankOf`: 0 for a box with a time, 1 for one with a deadline, 2 for one without, 3 for one without, cancelled
 *   or pushed.
 *
 * @param first - A box
 * @param second - Another box
 * @returns Below zero when the first comes first, above zero when the second does, zero when they stay as they are
 */
function boxCompare(first: Box, second: Box): number {
    const rankOf: (box: Box) => number = (box: Box): number => {
        if (box.time !== "")
            return 0;
        if (box.deadline !== "")
            return 1;
        return box.state === "dropped" || box.state === "university" || box.state === "pushed" ? 3 : 2;
    };
    return rankOf(first) - rankOf(second) || first.time.localeCompare(second.time)
        || first.deadline.localeCompare(second.deadline);
}

/**
 * Tells whether a box with a deadline shows on a day: on the day of its deadline always, so I see there that it is
 * done, and before it from {@link deadlineDays} days before that day, once done only until the day of its last session,
 * see {@link loggedDayOf}.
 * - `last`: Day of its last session once it is done, else, or when it has none, the day of its deadline.
 *
 * @param box - Box with a deadline
 * @param date - Day like `2026-10-20`
 * @returns Whether it shows on the day
 */
function deadlineShows(box: Box, date: string): boolean {
    const last: string = box.state === "done" && box.log !== null ? loggedDayOf(box) : box.day;
    return date === box.day || (dayAdd(box.day, -deadlineDays) <= date && date < box.day && date <= last);
}

/**
 * Gives the day of the log entry written from a box, in Berlin time.
 *
 * @param box - The box
 * @returns Day like `2026-10-19`, empty for a box without log entry
 */
function loggedDayOf(box: Box): string {
    return box.log === null ? "" : berlinDateOf(new Date(box.log.start));
}

/**
 * Reads the plans of the days of a range: the birthdays and holidays of each day with my gift ideas for them,
 * their `DESCRIPTION`s, and its boxes, each with its state and the time of its log entry.
 * A box belongs to the day it starts on, a box with a deadline to each day it shows on, see {@link deadlineShows},
 * and a pushed box greyed to each day it was pushed from, see {@link leftBoxesOf}, wherever it lies now;
 * a box without time and deadline carried along and done on a later day, see {@link boxesCarried}, also to the day
 * of its log entry, done, like the box of 18.10 for 01 Regression Analysis that my session of 19.10 did,
 * see {@link loggedDayOf}.
 * - `from`: Start of the first day, in Berlin time.
 * - `logs`: Log entries written from boxes, until {@link deadlineDays} days after the last day, or after today
 *   when it is later, see {@link logsOf} and {@link logsUntilOf}.
 * - `boxes`: Boxes of the plan from the first day to {@link deadlineDays} days after the last,
 *   so a deadline after the range shows in it.
 * - `left`: Boxes as they stood on the days of the range they were pushed from: those of the plan that happen once,
 *   whenever they lie, since one occurrence of a series becomes one of its own before it is pushed, see {@link boxOwn}.
 * - `done`: Boxes without time and deadline done by a log entry of a later day than their own, that day in the range.
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
    const logs: Map<string, Entry> = logsOf(dayAdd(logsUntilOf(end), deadlineDays));
    const boxes: Box[] = entriesRead(day.plan, from, berlinDayStartOf(dayAdd(end, deadlineDays)))
        .map((entry: Entry): Box => boxOf(entry, logs));
    const left: Box[] = entriesOnceRead(day.plan)
        .filter((entry: Entry): boolean =>
            entry.pushed.some((push: Push): boolean => start <= push.day && push.day < end))
        .flatMap((entry: Entry): Box[] => leftBoxesOf(boxOf(entry, logs)));
    const done: Box[] = entriesOnceRead(day.plan)
        .map((entry: Entry): Box => boxOf(entry, logs))
        .filter((box: Box): boolean => box.state === "done" && box.time === "" && box.deadline === ""
            && box.day < loggedDayOf(box) && start <= loggedDayOf(box) && loggedDayOf(box) < end);
    const occasions: Entry[] = entriesRead(day.system, from, berlinDayStartOf(end));

    const days: PlanDay[] = [];
    for (let date: string = start; date < end; date = dayAdd(date, 1)) {
        const planned: Box[] = [
            ...boxes.filter((box: Box): boolean => box.deadline === "" ? box.day === date : deadlineShows(box, date)),
            ...left.filter((box: Box): boolean => box.day === date),
            ...done.filter((box: Box): boolean => loggedDayOf(box) === date),
        ];
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
 * done, cancelled and open alike, each with its state, for the exam of each module, see `examOf` in `skill.ts`;
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
 * Finds a box of the plan by its identifier, with its state, also an occurrence of a series, see {@link planEntryFind},
 * by the log entries up to the day after its day or after today, the later, see {@link logsUntilOf}.
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
    return [file, entry, boxOf(entry, logsOf(dayAdd(logsUntilOf(date), 1)))];
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
 * Checks a new or changed box before it is written: its day, its fields, which fit its category,
 * see `categoryAllows` in `categories.ts`, or keep what the box was, its category and title, for a skill box its skill and type,
 * with well-formed people, see `attendeesAllow` in `categories.ts`,
 * like an older `IN2028 DEV` of a type no longer offered, its time on its day, its duration, whole minutes
 * of at most a day, its deadline, on its day and without expected time, see the top of this file, and the chapters
 * of a skill box among those of its module or those it had.
 * - `kept`: Whether a changed box keeps what it was.
 * - `deadlineDay`: Day of its deadline, empty for none.
 * - `folder`: Name of the folder of the module of a skill box, `undefined` for none.
 * - `offered`: Chapters of that module, and those the box had.
 *
 * @param box - The box as sent
 * @param old - The box as it was, `null` for a new one
 * @throws {Error} - When one of them is not right
 */
function boxCheck(box: BoxNew, old: Entry | null): void {
    const kept: boolean = old !== null && box.category === old.category && (box.category === skillName
        ? box.module === old.module && box.type === old.type : box.title === old.title)
        && attendeesAllow(box.attendees ?? []);
    dateCheck(box.day);
    if (!(kept || categoryAllows(box)))
        throw new Error(`No box ${box.category} ${box.title}`);
    if (box.time !== "" && berlinDateOf(new Date(box.time)) !== box.day)
        throw new Error(`${box.title}: its time lies on another day than ${box.day}`);
    if (box.minutes !== null && !(Number.isInteger(box.minutes) && box.minutes > 0 && box.minutes <= dayMinutes))
        throw new Error(`${box.title}: no duration of ${box.minutes} minutes`);
    const deadlineDay: string = box.deadline === "" || /^\d{4}-\d{2}-\d{2}$/.test(box.deadline) ? box.deadline
        : berlinDateOf(new Date(box.deadline));
    if (box.deadline !== "" && (deadlineDay !== box.day || box.time !== ""))
        throw new Error(`${box.title}: a box with a deadline lies on the day of its deadline, without expected time`);
    const folder: string | undefined = moduleFolderOf(box.module);
    const offered: string[] = [...(folder === undefined ? [] : moduleContentsRead(folder).chapters),
        ...(old === null ? [] : chaptersOf(old))];
    if (box.chapters.some((chapter: string): boolean => !offered.includes(chapter)))
        throw new Error(`${box.title}: no chapters ${box.chapters.join(", ")} in ${box.module}`);
}

/**
 * Gives the chapters of a skill box as its `X-CHAPTER`s and the documents it will use as its `ATTACH`es,
 * see `linksOf` in `documents.ts`, a document it linked already kept, also one not there yet, like the slides
 * of a lecture to come; for a box that is no skill box, or no more, none of them, but nothing for a box
 * that never was one, like a to-do of another app, so its links stay as they are. Given before anything
 * is written, so a document that is none of the module's changes nothing.
 *
 * @param box - The box as sent
 * @param old - The box as it was, `null` for a new one
 * @returns The properties to put, see {@link boxLinksPut}, none to leave them as they are
 * @throws {Error} - When a document is none of the module's
 */
function boxLinksOf(box: BoxNew, old: Entry | null): [string, (string | Link)[]][] {
    if (box.category === skillName)
        return [
            ["x-chapter", box.chapters],
            ["attach", linksOf(box.module, box.documents, old?.links ?? [])],
        ];
    if (old?.category === skillName)
        return [["x-chapter", []], ["attach", []]];
    return [];
}

/**
 * Writes the chapters and documents of a box, see {@link boxLinksOf}, leaving the box as it is for none.
 *
 * @param file - Path of the `.ics` file the box lies in now
 * @param id - Identifier of the box
 * @param links - The properties to put, see {@link boxLinksOf}
 */
function boxLinksPut(file: string, id: string, links: [string, (string | Link)[]][]): void {
    if (links.length > 0)
        propertiesPut(file, id, links);
}

/**
 * Turns a box as the page sends it into the fields of its to-do: its place with the link the reader finds,
 * see `placeLinkOf` in `places.ts`, what it does online as sent, else as it had it, see `onlineFor` there, and what
 * a skill box is as the reader writes it, see `titleOf` in `documents.ts`.
 * - `semester`: Semester of a skill box as it is written, see `semesterFor` in `categories.ts`, empty for any other.
 * - `title`, `titleLink`: What it is, its `SUMMARY`, and the link of it.
 *
 * @param box - New or changed box
 * @param old - The box as it was, `null` for a new one
 * @returns Fields of the to-do
 * @throws {Error} - When the link typed online is no web address
 */
function todoFieldsOf(box: BoxNew, old: Entry | null): TodoFields {
    const semester: string = semesterFor(box.category, box.semester, box.day);
    const [title, titleLink]: [string, string] = titleOf({ ...box, semester: semester }, old);
    return {
        category: box.category, title: title, titleLink: titleLink, location: box.location,
        locationLink: placeLinkOf(box.location, old), ...onlineFor(box, old), from: box.from,
        attendees: box.attendees ?? old?.attendees ?? [],
        module: box.module, type: box.type, semester: semester, note: box.note,
        day: box.day, time: box.time === "" ? null : new Date(box.time), minutes: box.minutes, deadline: box.deadline,
    };
}

/**
 * Turns a changed box that is an event of the plan, like a lecture imported from TUMonline, into its fields,
 * as {@link todoFieldsOf} does for a to-do: its start and its end from its time and its duration, which it keeps.
 * - `start`: Its new start.
 * - `semester`: Semester of a skill event as it is written, see `semesterFor` in `categories.ts`, empty for any other.
 * - `title`, `titleLink`: What it is, its `SUMMARY`, and the link of it.
 *
 * @param change - The changed box as the page sends it
 * @param old - The event as it was
 * @returns Fields and times of the event
 * @throws {Error} - When it would lose its time or its duration, or the link typed online is no web address
 */
function eventFieldsOf(change: BoxChange, old: Entry): EntryFields {
    if (change.time === "" || change.minutes === null)
        throw new Error(`${old.title} is an event of the plan and keeps its time and its duration`);
    const start: Date = new Date(change.time);
    const semester: string = semesterFor(change.category, change.semester, change.day);
    const [title, titleLink]: [string, string] = titleOf({ ...change, semester: semester }, old);
    return {
        category: change.category, title: title, titleLink: titleLink, location: change.location,
        locationLink: placeLinkOf(change.location, old), ...onlineFor(change, old), from: change.from,
        attendees: change.attendees ?? old.attendees,
        module: change.module, type: change.type, semester: semester,
        note: change.note,
        start: start, end: new Date(start.getTime() + change.minutes * minuteLength),
    };
}

/**
 * Reads the series of a skill box, see the top of this file: the boxes of the plan of the same skill and type, like
 * `IN2028` and `VO`, by date, whatever their state, each with its plan file, whatever form its `SUMMARY` has,
 * like `IN2028_BusinessAnalyticsMachineLearning (VO)` or an older `IN2028 Business Analytics Machine Learning (VO)`,
 * see `skillPartsOf` in `calendar.ts`; up to two years after today, so a daily box without end, like that of my diary,
 * is not walked through a century, which took seconds for each lecture cancelled or added.
 * - `entries`: Every entry of the plan up to then.
 *
 * @param module - Skill of the series, like `IN2028`
 * @param type - Its type, like `VO`
 * @returns The entries of the series, the earliest first
 */
function seriesOf(module: string, type: string): Entry[] {
    const entries: Entry[] = entriesRead(day.plan, "1970-01-01T00:00:00Z",
        berlinDayStartOf(dayAdd(berlinDateOf(new Date()), 2 * 366)));
    return entries
        .filter((entry: Entry): boolean => entry.category === skillName && entry.module === module
            && entry.type === type)
        .sort((first: Entry, second: Entry): number => first.start.localeCompare(second.start));
}

/**
 * Gives the next number of a series for a new skill box of a type of {@link numberedTypes}, see the top of this file:
 * one more than the highest number of the boxes of its series before its day, `1` for the first.
 * - `before`: Numbers of the boxes of its series before it, `NONE` left out.
 *
 * @param module - Skill of the new box, like `IN2028`
 * @param type - Its type, like `VO`
 * @param date - Its day, like `2026-10-20`
 * @returns The number, like `4`
 */
function numberNextOf(module: string, type: string, date: string): string {
    const before: number[] = seriesOf(module, type)
        .filter((entry: Entry): boolean => dayOf(entry) < date && /^\d+$/.test(entry.number))
        .map((entry: Entry): number => Number(entry.number));
    return String(Math.max(0, ...before) + 1);
}

/**
 * Adds a box to the plan, as a to-do in the plan it belongs into, see {@link planFileOf}, a skill box
 * with its chapters and documents, see {@link boxLinksPut}, a lecture, an exercise, a tutorial or a sheet
 * with its number in its series, see {@link numberNextOf}; nothing is written while it is not right.
 * - `file`: The plan it belongs into.
 * - `fields`: Fields of its to-do.
 * - `links`: Its chapters and documents.
 * - `id`: Identifier of the new box.
 *
 * @param box - The box as the page sends it
 * @returns Identifier of the new box
 * @throws {Error} - When the box is not right, see {@link boxCheck}, the link typed online is no web address,
 *   or a document is none of the module's
 */
export function boxAdd(box: BoxNew): string {
    boxCheck(box, null);
    const file: string = planFileOf(box, box.day);
    const fields: TodoFields = todoFieldsOf(box, null);
    const links: [string, (string | Link)[]][] = boxLinksOf(box, null);
    const id: string = todoAppend(file, fields);
    boxLinksPut(file, id, links);
    if (box.category === skillName && numberedTypes.includes(box.type))
        propertiesPut(file, id, [["x-number", [numberNextOf(box.module, box.type, box.day)]]]);
    return id;
}

/**
 * Adds boxes that differ only in their days and times, like the dates of a box repeated weekly, see `repeatApply`
 * in `course.ts`, each as {@link boxAdd} adds one, into the plan it belongs into, in their order; or only checks them,
 * for the preview of the dialog. The first is checked before any is written, as `boxAdd` checks it, with the link
 * of its place and its documents, since the others share all of it, their days and times checked by their rule,
 * so boxes the reader does not take write nothing.
 * - `first`: The first box, `undefined` for none.
 *
 * @param boxes - The boxes, the earliest first
 * @param dry - Whether only to check them, writing nothing
 * @returns Identifiers of the new boxes, none when only checked
 * @throws {Error} - When the first box is not right, see {@link boxCheck}, the link typed online is no web
 *   address, or a document is none of the module's
 */
export function boxesAdd(boxes: BoxNew[], dry: boolean): string[] {
    const first: BoxNew | undefined = boxes[0];
    if (first !== undefined) {
        boxCheck(first, null);
        todoFieldsOf(first, null);
        boxLinksOf(first, null);
    }
    return dry ? [] : boxes.map((box: BoxNew): string => boxAdd(box));
}

/**
 * Marks a box the university cancelled, like a lecture that does not take place, or takes that back, with one tap,
 * see the top of this file: cancelled, its number becomes `NONE`, and every later box of its series with a number
 * moves up one, `5` becoming `4`, once, here; taken back, it gets the number after the last one before it, or
 * the first number after it, or `1`, and every later box with a number moves down one again, so the numbers are
 * as before. Boxes I cancelled myself keep their numbers. One occurrence of a series changes alone, see {@link boxOwn}.
 * - `file`, `entry`, `box`: The box with its file.
 * - `series`: The boxes of its series, see {@link seriesOf}.
 * - `before`: The numbers of the boxes of its series before it, `NONE` left out.
 * - `after`: The boxes of its series after it with a number, the earliest first.
 * - `number`: The new number of the box.
 * - `step`: How much the later numbers change.
 *
 * @param id - Identifier of the box, like `lecture-26@nomsystem`
 * @param cancelled - Whether the university cancelled it, else taking that back
 * @throws {Error} - When there is no such box in the new system, it is not open, or, taken back, not cancelled
 *   by the university
 */
export function boxUniversity(id: string, cancelled: boolean): void {
    const [file, entry, box]: [string, Entry, Box] = boxFind(id);
    if (!entry.editable || box.state !== (cancelled ? "open" : "university"))
        throw new Error(`${entry.title} is no box of the new system to mark`);
    const series: Entry[] = seriesOf(entry.module, entry.type)
        .filter((other: Entry): boolean => entryIdOf(other) !== id);
    const before: number[] = series.filter((other: Entry): boolean => other.start < entry.start
        && /^\d+$/.test(other.number)).map((other: Entry): number => Number(other.number));
    const after: Entry[] = series.filter((other: Entry): boolean => other.start > entry.start
        && /^\d+$/.test(other.number));
    let number: string = "NONE";
    if (!cancelled)
        number = before.length > 0 ? String(Math.max(...before) + 1) : after[0]?.number ?? "1";
    const step: number = cancelled ? -1 : 1;
    boxOwn(file, entry);
    propertiesPut(file, id, [["x-number", [number]]]);
    after.forEach((other: Entry): void => {
        const [otherFile, otherEntry]: [string, Entry] = planEntryFind(entryIdOf(other));
        boxOwn(otherFile, otherEntry);
        propertiesPut(otherFile, entryIdOf(other), [["x-number", [String(Number(other.number) + step)]]]);
    });
}

/**
 * Changes a box of the new system, see {@link boxCheck}, one occurrence of a series alone, see {@link boxOwn};
 * a box moves into the plan it belongs into now when that is another file, see {@link planFileAfter}.
 * A to-do changes as it is sent; an event, like a lecture imported from TUMonline, keeps a time and a duration,
 * its start and its end. A skill box takes its chapters and documents, see {@link boxLinksPut}.
 * An open box without deadline whose day moves later is pushed, like with its arrow, see {@link boxPush}:
 * its start and its length as they stood go into one more `X-PUSHED`, like
 * `X-PUSHED;TZID=Europe/Berlin;X-ESTIMATED-DURATION=PT3H15M;VALUE=DATE-TIME:20261017T150000` for one moved
 * from Sat, 17.10.2026, 15:00 to Mon, 19.10.2026; a box moved earlier or with a deadline is not pushed.
 * All of it is checked before anything is written, so a change the reader does not take changes nothing.
 * - `todo`: New fields of a to-do, `null` for an event.
 * - `event`: New fields and times of an event, see {@link eventFieldsOf}, `null` for a to-do.
 * - `links`: Its chapters and documents, see {@link boxLinksOf}.
 * - `target`: The plan file it belongs into now.
 *
 * @param change - The changed box as the page sends it
 * @throws {Error} - When there is no such box in the new system, the box is not right, the link typed online
 *   is no web address, an event would lose its time or its duration, or a document is none of the module's
 */
export function boxEdit(change: BoxChange): void {
    const [file, entry, box]: [string, Entry, Box] = boxFind(change.id);
    if (!entry.editable)
        throw new Error(`${entry.title} may not be changed`);
    boxCheck(change, entry);
    const todo: TodoFields | null = entry.todo ? todoFieldsOf(change, entry) : null;
    const event: EntryFields | null = entry.todo ? null : eventFieldsOf(change, entry);
    const links: [string, (string | Link)[]][] = boxLinksOf(change, entry);
    boxOwn(file, entry);
    if (box.state === "open" && box.deadline === "" && change.deadline === "" && change.day > box.day)
        pushAdd(file, change.id, entry);
    const target: string = planFileAfter(file, entry, change, change.day);
    if (todo !== null)
        todoChange(file, entry, todo, target);
    else if (event !== null)
        entryChange(file, entry, event, target);
    boxLinksPut(target, change.id, links);
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
 * Pushes an open box of the new system with one tap, by its arrow, also one carried along: to the next day, or,
 * when its day is over, to tomorrow, the day after today in Berlin time, so it does not land on a day over too,
 * like a box of Wed, 14.10.2026 pushed on Fri, 16.10.2026 to Sat, 17.10.2026. Notes where it leaves in one more
 * `X-PUSHED`, then moves its day and its time by as many days, its time of day and its length kept, an event
 * its start and its end, into the plan of the next year when it moves into it, see {@link planFileAfter};
 * one occurrence of a series alone, see {@link boxOwn}.
 * A box with a deadline stays, since its day is the day of its deadline.
 * - `today`: Today in Berlin time.
 * - `next`: The day it goes to, the day after its own day or after today, the later of them.
 * - `days`: Days it moves by, one for a box whose day is not over.
 * - `texts`: Its text fields, as they are.
 *
 * @param id - Identifier of the box
 * @throws {Error} - When there is no such box in the new system, it is not open, or it has a deadline
 */
export function boxPush(id: string): void {
    const [file, entry, box]: [string, Entry, Box] = boxFind(id);
    if (!entry.editable || box.state !== "open" || box.deadline !== "")
        throw new Error(`${entry.title} is no open box of the new system without deadline`);

    const today: string = berlinDateOf(new Date());
    const next: string = dayAdd(box.day < today ? today : box.day, 1);
    const days: number = Math.round((Date.parse(next) - Date.parse(box.day)) / (dayMinutes * minuteLength));
    const texts: EntryTexts = {
        category: entry.category, title: entry.title, titleLink: entry.titleLink, location: entry.location,
        locationLink: entry.locationLink, online: entry.online, onlineLink: entry.onlineLink, passcode: entry.passcode,
        from: entry.from, attendees: entry.attendees, module: entry.module, type: entry.type, semester: entry.semester,
        note: entry.note,
    };
    boxOwn(file, entry);
    pushAdd(file, id, entry);
    if (entry.todo)
        todoChange(file, entry, {
            ...texts, day: next, time: box.time === "" ? null : berlinLater(new Date(box.time), days),
            minutes: entry.minutes, deadline: "",
        }, planFileAfter(file, entry, entry, next));
    else
        entryChange(file, entry, {
            ...texts, start: berlinLater(new Date(entry.start), days), end: berlinLater(new Date(entry.end), days),
        }, planFileAfter(file, entry, entry, next));
}

/**
 * Takes back the last push of an open box of the new system, by its arrow or by its day in the dialog: puts it back
 * where it stood before, its start and its length as its last `X-PUSHED` notes them, which goes, see `pushTake`
 * in `calendar.ts`, like WI1059 (VO) back from Mon, 19.10.2026, 10:00 for 2 hours to Sun, 18.10.2026, 15:00
 * for 3 hours 15 minutes; its length stays where the push noted none; into the plan of its month again,
 * see {@link planFileAfter}.
 * - `start`, `minutes`: Start and length before the push, see `pushTake`.
 * - `day`: Its day before the push.
 * - `texts`: Its text fields, as they are.
 *
 * @param id - Identifier of the box
 * @throws {Error} - When there is no such box in the new system, it is not open, or it was never pushed
 */
export function boxUnpush(id: string): void {
    const [file, entry, box]: [string, Entry, Box] = boxFind(id);
    if (!entry.editable || box.state !== "open" || entry.pushed.length === 0)
        throw new Error(`${entry.title} is no open box of the new system pushed before`);

    const [start, minutes]: [string, number | null] = pushTake(file, id, entry);
    const day: string = box.time === "" ? start : berlinDateOf(new Date(start));
    const texts: EntryTexts = {
        category: entry.category, title: entry.title, titleLink: entry.titleLink, location: entry.location,
        locationLink: entry.locationLink, online: entry.online, onlineLink: entry.onlineLink, passcode: entry.passcode,
        from: entry.from, attendees: entry.attendees, module: entry.module, type: entry.type, semester: entry.semester,
        note: entry.note,
    };
    if (entry.todo)
        todoChange(file, entry, {
            ...texts, day: day, time: box.time === "" ? null : new Date(start), minutes: minutes ?? entry.minutes,
            deadline: "",
        }, planFileAfter(file, entry, entry, day));
    else
        entryChange(file, entry, {
            ...texts, start: new Date(start), end: new Date(Date.parse(start)
                + (minutes === null ? Date.parse(entry.end) - Date.parse(entry.start) : minutes * 60 * 1000)),
        }, planFileAfter(file, entry, entry, day));
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
    statusPut(file, id, status);
}

/**
 * Marks a box done once a log entry pointing to it is written: a to-do that happens once becomes `COMPLETED`;
 * an event, which has no such status, and an occurrence of a series are done by the log entry alone;
 * one with a deadline stays open, since that log entry is one of its sessions, see {@link boxSubmit}.
 *
 * @param id - Identifier of the box, like `study-13@nomsystem`
 * @throws {Error} - When the plan holds no such box
 */
export function boxDone(id: string): void {
    const [file, entry]: [string, Entry] = planEntryFind(id);
    if (entry.todo && entry.editable && entry.recurrence === "" && entry.deadline === "")
        statusPut(file, id, "COMPLETED");
}

/**
 * Ticks a box with a deadline submitted, like a homework sheet I handed in, with one tap on `Submit` in its menu,
 * or takes the tick back with one on its check: it becomes `COMPLETED`, or `NEEDS-ACTION` again,
 * its sessions staying in the log.
 *
 * @param id - Identifier of the box, like `sheet-3@nomsystem`
 * @param submitted - Whether to tick it submitted, else to take the tick back
 * @throws {Error} - When there is no such box in the new system, it has no deadline, or it is not open,
 *   or not done for taking the tick back
 */
export function boxSubmit(id: string, submitted: boolean): void {
    const [file, entry, box]: [string, Entry, Box] = boxFind(id);
    if (!entry.editable || box.deadline === "" || box.state !== (submitted ? "open" : "done"))
        throw new Error(`${entry.title} cannot be ${submitted ? "ticked submitted" : "taken back"}`);
    statusPut(file, id, submitted ? "COMPLETED" : "NEEDS-ACTION");
}

/**
 * Opens a box again once the log entry written from it is removed: a done to-do of the new system becomes
 * `NEEDS-ACTION`; an occurrence of a series is open again by itself, and a box no longer in the plan stays as it is,
 * as one with a deadline does, since only my tick decides it, see {@link boxSubmit}.
 * - `found`: Its `.ics` file and its entry, `undefined` when it is gone.
 *
 * @param id - Identifier of the box
 */
export function boxReopen(id: string): void {
    const found: [string, Entry] | undefined = entryLookup(day.plan, id);
    if (found !== undefined && found[1].todo && found[1].editable && found[1].status === "COMPLETED"
        && found[1].deadline === "")
        statusPut(found[0], id, "NEEDS-ACTION");
}

/**
 * Tells whether a box is an open skill box of a module I log from my learning, see {@link skillBoxOf}: of the new
 * system, neither with a deadline, like a homework sheet, which I log myself, nor one occurrence of a series,
 * like a weekly lecture.
 *
 * @param box - The box
 * @param module - Module code, like `IN2028`
 * @returns Whether it is one
 */
function skillBoxOpen(box: Box, module: string): boolean {
    return box.category === skillName && box.module === module && box.state === "open" && box.editable
        && !box.series && box.deadline === "";
}

/**
 * Finds the open study box of a module for a day, one without time, like the box of a chapter the plan of today
 * holds, see `suggestions.ts`: of that day, else one carried along to it, see {@link boxesCarried}, the earliest
 * first; a box with chapters only for learning in one of them, see {@link skillBoxOpen}.
 * - `fits`: Whether a box is one.
 *
 * @param module - Module code, like `IN2028`
 * @param date - The day, like `2026-10-22`
 * @param chapters - Chapters I learn, like `01_RegressionAnalysis`, none when not known yet
 * @returns The box, `undefined` when there is none
 */
export function studyBoxOf(module: string, date: string, chapters: string[]): Box | undefined {
    const fits: (box: Box) => boolean = (box: Box): boolean => skillBoxOpen(box, module) && box.time === ""
        && (chapters.length === 0 || box.chapters.length === 0
            || box.chapters.some((chapter: string): boolean => chapters.includes(chapter)));
    return boxesRead(date, dayAdd(date, 1))[0].boxes.find(fits) ?? boxesCarried(date).find(fits);
}

/**
 * Finds the open skill box of a module for a moment, which the attempts of that moment log, see `skill.ts`:
 * one whose expected time and duration hold the moment, like a tutorial, else a study box, see {@link studyBoxOf}.
 * - `now`: The moment as milliseconds.
 *
 * @param module - Module code, like `IN2028`
 * @param moment - The moment, like now
 * @param chapters - Chapters of what I learn in it, like `01_RegressionAnalysis`
 * @returns The box, `undefined` when there is none
 */
export function skillBoxOf(module: string, moment: Date, chapters: string[]): Box | undefined {
    const date: string = berlinDateOf(moment);
    const now: number = moment.getTime();
    return boxesRead(date, dayAdd(date, 1))[0].boxes.find((box: Box): boolean => skillBoxOpen(box, module)
            && box.time !== "" && box.minutes !== null
            && Date.parse(box.time) <= now && now < Date.parse(box.time) + box.minutes * minuteLength)
        ?? studyBoxOf(module, date, chapters);
}
