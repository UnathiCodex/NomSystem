/**
 * ## Calendars
 *
 * Reads `.ics` files into entries, their events, `VEVENT`, and their to-dos, `VTODO`, the boxes of the plan,
 * see `boxes.ts`; appends events and to-dos to them, changes and removes single ones,
 * and moves one from one file into another, like into the log of another year.
 * Keeps each read file until it changes on disk, so a file is read again only once it changed.
 * Every entry states its facts in its own lines, for every field, now and later: a link, the `ALTREP` of a `SUMMARY`
 * or a `LOCATION` or an `ATTACH`, only points to more and is never the only place of a fact, since a folder may be
 * renamed or vanish; so a skill entry names its skill in its `SUMMARY` and its semester in its `X-SEMESTER`,
 * a place its label and address in its `LOCATION`.
 * Writes only into the three folders of the new system, with times in Berlin time, every date and time in the form
 * of the iCalendar format, also in a property or a parameter of my own, like `20261026T130000Z` or `20261026`,
 * never like `2026-10-26T13:00:00.000Z`; puts the lines of every entry it writes, new or changed, into one fixed
 * order, see {@link lineOrder}, and leaves every other line as it is, byte for byte.
 *
 * - `node:fs`: Works with files and folders on the disk.
 * - `node:path`: Builds file paths for the operating system.
 * - `node:crypto`: Creates random identifiers.
 * - `ical.js`: Reads and writes the iCalendar format of `.ics` files.
 * - `./sources.ts`: Names the files of a calendar and the folder of my modules, and tells which files the reader
 *   may write.
 */

import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { randomUUID } from "node:crypto";
import ICAL from "ical.js";
import { modulesFolder, writeAllowed } from "./sources.ts";

import type { CalendarSource } from "./sources.ts";


/**
 * One calendar entry, as the page shows it.
 *
 * - `id`: Identifier of the event, its `UID`, like `b8f1e81f-15b4-460e-910d-ef6b1b3d09b3@nomsystem`;
 *   all occurrences of a series share it, like those of a birthday.
 * - `category`: Category of the entry, its `CATEGORIES`, like `Way`; empty for an entry without one, like a birthday.
 * - `title`: Summary of the entry, what it was, like `UBahn`, for a skill entry the name of the folder of its skill
 *   with its type in round brackets, like `IN2028_BusinessAnalyticsMachineLearning (VO)`, see {@link skillPartsOf};
 *   empty for an entry without `SUMMARY`.
 * - `titleLink`: Link of what it was, the standard parameter `ALTREP` of its `SUMMARY`: for a skill entry the folder
 *   of its skill from `NomWorkspace`, like `NomSkillingmodules/IN2028_BusinessAnalyticsMachineLearning`,
 *   see `documents.ts`; empty when it has none.
 * - `location`: Place of the entry, its `LOCATION`, like `TumMain, Arcisstraße 21, 80333 München, Deutschland`,
 *   or `HomeMunich` in an older entry, empty when the event has none.
 * - `locationLink`: Link of its place, the standard parameter `ALTREP` of its `LOCATION`,
 *   like `https://nav.tum.de/room/0509.EG.980`, empty when it has none.
 * - `from`: Where a way starts, its `X-FROM`, empty when the event has none.
 * - `module`: Skill of a skill entry from its `SUMMARY`, the code of a module, like `IN2028`, or a project,
 *   like `WokFlow`, see {@link skillPartsOf}; empty for any other entry.
 * - `type`: Type of a skill entry from its `SUMMARY`, like `VO`, empty for none, like my own learning or a project,
 *   and for any other entry.
 * - `semester`: Semester of a skill entry, its `X-SEMESTER`, like `2026W`: from which semester the lecture
 *   or the material is, not when I did it, see `semesterOf` in `categories.ts`; empty when the event has none,
 *   like an older skill entry, and for any other entry.
 * - `chapters`: Chapters of an older skill entry of the log, its `X-CHAPTER`s in order, each by its name,
 *   like `01_RegressionAnalysis`, none when the event has none; a skill entry now links the folders of its chapters,
 *   see `chaptersOf` in `documents.ts`.
 * - `links`: Links of a skill entry of the log to the folder of its skill and the document it used, its `ATTACH`es
 *   in order, see {@link Link} and `documents.ts`; none when the event has none.
 * - `attempts`: Attempts of a skill entry of the log, its `X-ATTEMPT`s in order,
 *   like `140500;IN2028/Kiosk Sales Standard Error;stuck;high;step 2`, none when the event has none.
 * - `tutors`: Tasks I copied for my tutor in a skill entry of the log, its `X-TUTOR`s in order,
 *   like `IN2028/Kiosk Sales Standard Error`, none when the event has none.
 * - `foods`: Foods of a meal or a cooking, its `X-FOOD`s in order, each a food of `Foods.md` by its name, brand
 *   and store with the grams, like `Skyr natur;K-Classic;Kaufland;150`, an older one by its name alone,
 *   like `Reis;150`; none when the event has none.
 * - `cooked`: For a meal drawn from a cooking, the identifier of that entry `Cook`, its `X-COOKED`;
 *   empty when the event has none.
 * - `pain`: My neck pain from 0 to 10 after a long neck session, its `X-PAIN`, like `5`, empty when the event has none.
 * - `planned`: Identifier of the box a log entry was logged from, see {@link plannedOf}: the `UID` of its
 *   `RELATED-TO`, like `study-13@nomsystem`, for one date of a series with that date after `#`,
 *   like `weekly-lecture@nomsystem#2026-10-13T08:00:00.000Z` of
 *   `RELATED-TO;X-RECURRENCE-ID=20261013T080000Z:weekly-lecture@nomsystem`, see {@link entryIdOf};
 *   for an older entry its `X-PLANNED`, which holds the identifier so; empty when the event has neither.
 * - `note`: Free note, its `DESCRIPTION`, empty when the event has none.
 * - `todo`: Whether the entry is a to-do, a `VTODO`, a box of the plan; else it is an event, a `VEVENT`.
 * - `status`: Its `STATUS`, like `CANCELLED` for a dropped box or `COMPLETED` for a done one, empty when it has none.
 * - `completed`: When a to-do was done, its `COMPLETED`, as ISO instant, like the moment I ticked a homework submitted;
 *   empty when it has none and for an event.
 * - `minutes`: Expected duration of a to-do in minutes, its `ESTIMATED-DURATION`, like 75 of `PT1H15M`;
 *   `null` for none and for an event, whose length lies between its start and its end.
 * - `deadline`: Deadline of a to-do, its `DUE`, as ISO instant, or as date like `2026-10-23` when it has no time;
 *   empty for none and for an event.
 * - `pushed`: Days a box was pushed from to the next day, its `X-PUSHED`s in order, like `2026-10-12`
 *   of `X-PUSHED;VALUE=DATE:20261012`, see {@link pushedDayOf}; none when it has none.
 * - `number`: Number of a lecture, an exercise, a tutorial or a sheet in its series, its `X-NUMBER`, like `3`,
 *   `NONE` for one the university cancelled, see `boxUniversity` in `boxes.ts`; empty for none.
 * - `written`: When the entry was written, its `DTSTAMP`, as ISO instant, which the reader sets once as it adds an entry;
 *   empty when the event has none.
 * - `editable`: Whether the dashboard may change the entry: it lies in the new system and has times or is a to-do;
 *   also one occurrence of a series, which becomes a component of its own once it is changed alone,
 *   see {@link occurrenceOwn}. FullCalendar lets only these events be dragged.
 * - `start`: Start as ISO instant like `2026-07-03T09:15:00.000Z`,
 *   or as date like `2026-07-03` when all-day; a to-do starts at its `DTSTART`, a day or a time,
 *   and a to-do with a deadline but no `DTSTART` on the day of its deadline, as a whole day.
 * - `end`: End, excluded, in the same form as `start`; a to-do of a day ends with the day,
 *   a to-do with a time where it starts, since how long it takes is its `minutes`.
 * - `allDay`: Whether the entry covers whole days, for a to-do whether it has no time.
 * - `recurrence`: For an occurrence of a series its start as the series has it, like `2026-10-13T08:00:00.000Z`,
 *   or `2026-10-13` for a series of whole days, for a changed occurrence its `RECURRENCE-ID`;
 *   empty for an entry that happens once.
 */
export type Entry = {
    id: string;
    category: string;
    title: string;
    titleLink: string;
    location: string;
    locationLink: string;
    from: string;
    module: string;
    type: string;
    semester: string;
    chapters: string[];
    links: Link[];
    attempts: string[];
    tutors: string[];
    foods: string[];
    cooked: string;
    pain: string;
    planned: string;
    note: string;
    todo: boolean;
    status: string;
    completed: string;
    minutes: number | null;
    deadline: string;
    pushed: string[];
    number: string;
    written: string;
    editable: boolean;
    start: string;
    end: string;
    allDay: boolean;
    recurrence: string;
};

/**
 * A link of an entry to a file or a folder, one `ATTACH`: its value a path from `NomWorkspace`, never absolute,
 * since `NomWorkspace` lies elsewhere on each computer, and for a file the fingerprint of its content as parameter,
 * so the link survives a rename, see `documents.ts`, like
 * `ATTACH;X-SHA256=9f86d081…:NomSkillingmodules/IN2028_…/VO_…/04_LogisticRegression.pdf`,
 * or `ATTACH:NomSkillingmodules/IN2028_…/02_LogisticPoissonRegression` for the folder of a chapter in an older entry;
 * nothing more, the name of the file says what it is. The value is no full URI, so other calendar apps may ignore it.
 *
 * - `path`: Path from `NomWorkspace`, parted by `/`, like `NomSkillingmodules/IN2028_BusinessAnalyticsMachineLearning`.
 * - `fingerprint`: SHA-256 of the file's bytes, its parameter `X-SHA256`, as 64 hexadecimal digits; empty for a folder.
 */
export type Link = {
    path: string;
    fingerprint: string;
};

/**
 * Text fields of an event or a to-do to write; an empty field is not written.
 *
 * - `category`: Category of the entry, `CATEGORIES`.
 * - `title`: What, `SUMMARY`.
 * - `titleLink`: Link of what it was, the parameter `ALTREP` of `SUMMARY`, like the folder of the skill
 *   of a skill entry, written only with its `SUMMARY`, empty for none.
 * - `location`: Place, `LOCATION`.
 * - `locationLink`: Link of the place, the parameter `ALTREP` of `LOCATION`, written only with its place,
 *   empty for none.
 * - `from`: Where a way starts, `X-FROM`.
 * - `module`: Skill of a skill entry, not written, since its `SUMMARY` names it, see {@link skillPartsOf}.
 * - `type`: Type of a skill entry, not written, since its `SUMMARY` names it.
 * - `semester`: Semester of a skill entry, `X-SEMESTER`, like `2026W`; empty for any other entry.
 * - `note`: Free note, `DESCRIPTION`.
 */
export type EntryTexts = {
    category: string;
    title: string;
    titleLink: string;
    location: string;
    locationLink: string;
    from: string;
    module: string;
    type: string;
    semester: string;
    note: string;
};

/**
 * Fields and times of an event to write: its {@link EntryTexts}, its start and its end.
 *
 * - `start`: Start of the entry.
 * - `end`: End of the entry, after the start.
 */
export type EntryFields = EntryTexts & {
    start: Date;
    end: Date;
};

/**
 * Fields of a to-do to write, a box of the plan: its {@link EntryTexts}, its day and, when it has them,
 * its expected time, its expected duration and its deadline.
 *
 * - `day`: Day of the to-do, like `2026-10-13`, its `DTSTART;VALUE=DATE` when it has no time;
 *   with a deadline the day of its deadline, and no `DTSTART`, see {@link todoAppend}.
 * - `time`: Expected time, its `DTSTART` in Berlin time, on its day; `null` for none and with a deadline.
 * - `minutes`: Expected duration in minutes, its `ESTIMATED-DURATION`; `null` for none.
 * - `deadline`: Deadline, its `DUE`, as ISO instant, or as day like `2026-10-23` without time; empty for none.
 */
export type TodoFields = EntryTexts & {
    day: string;
    time: Date | null;
    minutes: number | null;
    deadline: string;
};

/**
 * A read `.ics` file.
 *
 * - `modified`: Time of the last change on disk in milliseconds.
 * - `entries`: {@link Entry}s that happen once, events and to-dos.
 * - `series`: Recurring events, each knowing its replaced occurrences.
 */
type Calendar = {
    modified: number;
    entries: Entry[];
    series: ICAL.Event[];
};

/**
 * Range of time in both forms of {@link Entry}, so entries compare as plain text.
 *
 * - `days`: First day and day after the last, like `2026-07-03` and `2026-07-04`.
 * - `instants`: Start and end as ISO instants.
 */
type Range = {
    days: [string, string];
    instants: [string, string];
};

/**
 * Text of an `.ics` file as lines.
 *
 * - `lines`: Lines of the file; a line starting with a space or a tab continues the line before,
 *   as the format folds long lines.
 * - `newline`: Line break of the file, `\r\n` as the reader writes new files, or `\n`.
 */
type FileLines = {
    lines: string[];
    newline: string;
};

/**
 * Read {@link Calendar}s by their file path.
 */
const calendars: Map<string, Calendar> = new Map();

/**
 * Time zone of the times the dashboard writes, while I live in Germany.
 */
const zoneName: string = "Europe/Berlin";

/**
 * Definition of {@link zoneName} as the iCalendar format writes it into each new file,
 * with summer time from the last Sunday of March to the last Sunday of October.
 */
const zoneComponent: ICAL.Component = new ICAL.Component(ICAL.parse([
    "BEGIN:VTIMEZONE", `TZID:${zoneName}`,
    "BEGIN:DAYLIGHT", "TZOFFSETFROM:+0100", "TZOFFSETTO:+0200", "TZNAME:CEST",
    "DTSTART:19700329T020000", "RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU", "END:DAYLIGHT",
    "BEGIN:STANDARD", "TZOFFSETFROM:+0200", "TZOFFSETTO:+0100", "TZNAME:CET",
    "DTSTART:19701025T030000", "RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU", "END:STANDARD",
    "END:VTIMEZONE",
].join("\r\n")));

/**
 * Time zone {@link zoneName}, to turn instants into Berlin time.
 */
const zone: ICAL.Timezone = new ICAL.Timezone(zoneComponent);

/**
 * Order of the lines of every event and to-do the reader writes, new or changed, by the names of their properties,
 * see {@link linesOrdered}: who it is, `UID` and `DTSTAMP`; when, `DTSTART`, `DTEND`, for a to-do `DUE`,
 * `DURATION` and `ESTIMATED-DURATION` after them, then `RRULE`, `RDATE`, `EXDATE` and `RECURRENCE-ID`;
 * what, `CATEGORIES`, `SUMMARY`, `STATUS`, with `COMPLETED` after it; where, `LOCATION`; more about it,
 * `DESCRIPTION`, `ATTACH` and `RELATED-TO`; then every other line of the standard, then the `X-` lines,
 * each in the order it had, those of a skill entry last, see {@link lineEnding}.
 */
const lineOrder: string[] = [
    "UID", "DTSTAMP",
    "DTSTART", "DTEND", "DUE", "DURATION", "ESTIMATED-DURATION", "RRULE", "RDATE", "EXDATE", "RECURRENCE-ID",
    "CATEGORIES", "SUMMARY", "STATUS", "COMPLETED",
    "LOCATION",
    "DESCRIPTION", "ATTACH", "RELATED-TO",
];

/**
 * The last lines of every event and to-do, after every other `X-` line, in this order: the semester of a skill entry,
 * `X-SEMESTER`, then all its `X-CHAPTER`s, then all its `X-ATTEMPT`s.
 */
const lineEnding: string[] = ["X-SEMESTER", "X-CHAPTER", "X-ATTEMPT"];

/**
 * The parameter `ALTREP` in double quotes, as the standard writes a link there, also one without `:`, like
 * `SUMMARY;ALTREP="NomSkillingmodules/IN2028_…":…`: `ical.js` quotes on its own only a value with `,`, `:` or `;`,
 * and every value of a parameter of several values that asks for it, so `ALTREP` is described as one, of one value
 * here, see {@link textPropertyOf}; one value still reads as its text.
 */
ICAL.design.icalendar.param.altrep = { multiValue: ",", multiValueSeparateDQuote: true };

/**
 * Category of skill entries, `CATEGORIES:Skill`, whose `SUMMARY` names their skill and type, see {@link skillPartsOf};
 * the categories of `categories.ts` name it too.
 */
export const skillName: string = "Skill";


/**
 * Reads the skill and the type of a skill entry from its `SUMMARY`, the name of the folder of its skill with its type
 * in round brackets at the end when it has one, like `IN2028_BusinessAnalyticsMachineLearning (VO)`, my own learning
 * without brackets, like `IN2028_BusinessAnalyticsMachineLearning`: its skill is the code of a module, the part
 * of the name before the first `_`, like `IN2028`, or all of it for a project, a skill whose folder, the `ALTREP`
 * of the `SUMMARY`, lies outside `NomSkillingmodules`, like `WokFlow`. An older `SUMMARY` without brackets
 * but with a space, like `IN2028 VO`, has its skill and type parted at the first space. A skill entry carries
 * no `X-MODULE` and no `X-TYPE`; those lines of an older entry count no more and go once its `SUMMARY` changes,
 * see {@link textsPut}. An entry without skill has only its type in brackets, like `(VO)`, or no `SUMMARY`.
 * - `bracketed`: Name and type of a `SUMMARY` with a type in brackets, `null` for none.
 * - `space`: Place of the first space, -1 for none.
 * - `name`: Name of the folder of the skill.
 *
 * @param summary - `SUMMARY` of a skill entry, like `IN2028_BusinessAnalyticsMachineLearning (VO)`
 * @param link - Its `ALTREP`, like `NomSkillingmodules/IN2028_BusinessAnalyticsMachineLearning`, empty for none
 * @returns Skill and type, like `IN2028` and `VO`, or `WokFlow` and an empty type
 */
function skillPartsOf(summary: string, link: string): [string, string] {
    const bracketed: RegExpExecArray | null = /^(.*?) ?\((\w+)\)$/.exec(summary);
    const space: number = summary.indexOf(" ");
    if (bracketed === null && space !== -1)
        return [summary.slice(0, space), summary.slice(space + 1)];
    const name: string = bracketed?.[1] ?? summary;
    const project: boolean = link !== "" && !link.startsWith(`${modulesFolder}/`);
    return [project ? name : name.split("_")[0], bracketed?.[2] ?? ""];
}

/**
 * Turns an `ical.js` time into the form of {@link Entry}.
 * - {@link ICAL.Time#toJSDate}: Converts into a JS date in the time zone of the event.
 *
 * @param time - Start or end of an event
 * @returns Date for an all-day time, else ISO instant
 */
function textOf(time: ICAL.Time): string {
    return time.isDate ? time.toString() : time.toJSDate().toISOString();
}

/**
 * Reads a date or a time in the form of the iCalendar format, as a parameter of my own holds it.
 * - {@link ICAL.design}: Turns a value of the iCalendar format into the form `ical.js` reads,
 *   like `2026-10-26T13:00:00Z` of `20261026T130000Z`.
 *
 * @param value - Date like `20261026`, or time in UTC like `20261026T130000Z`
 * @returns The date or the time
 */
function icsTimeRead(value: string): ICAL.Time {
    return /^\d{8}$/.test(value) ? ICAL.Time.fromDateString(ICAL.design.icalendar.value.date.fromICAL(value))
        : ICAL.Time.fromDateTimeString(ICAL.design.icalendar.value["date-time"].fromICAL(value));
}

/**
 * Writes a date or an instant of the form of {@link Entry} in the form of the iCalendar format, an instant in UTC,
 * as a parameter of my own holds it, see {@link relatedOf}.
 * - `time`: The date or the instant in UTC.
 * - {@link ICAL.Time#toICALString}: Writes a time in the iCalendar format.
 *
 * @param text - Date like `2026-10-26`, or ISO instant like `2026-10-26T13:00:00.000Z`
 * @returns Date like `20261026`, or time like `20261026T130000Z`
 */
function icsTextOf(text: string): string {
    const time: ICAL.Time = /^\d{4}-\d{2}-\d{2}$/.test(text) ? ICAL.Time.fromDateString(text)
        : ICAL.Time.fromJSDate(new Date(text), true);
    return time.toICALString();
}

/**
 * Reads the identifier of the box a log entry was logged from, see {@link Entry}: the `UID` of its `RELATED-TO`,
 * and for one date of a series that date, its parameter `X-RECURRENCE-ID`, after `#`, as {@link entryIdOf} writes it;
 * else, for an older entry, its `X-PLANNED`, which holds the identifier so.
 * - `related`: Its first `RELATED-TO`, `null` for none.
 * - `recurrence`: Its date of a series, like `20261013T080000Z`, empty for none.
 *
 * @param component - The event
 * @returns Identifier like `study-13@nomsystem` or `weekly-lecture@nomsystem#2026-10-13T08:00:00.000Z`,
 *   empty for none
 */
function plannedOf(component: ICAL.Component): string {
    const related: ICAL.Property | null = component.getFirstProperty("related-to");
    if (related === null)
        return String(component.getFirstPropertyValue("x-planned") ?? "");
    const recurrence: string = String(related.getParameter("x-recurrence-id") ?? "");
    return recurrence === "" ? String(related.getFirstValue())
        : `${related.getFirstValue()}#${textOf(icsTimeRead(recurrence))}`;
}

/**
 * Reads the day of one `X-PUSHED`: a date of the iCalendar format, like `X-PUSHED;VALUE=DATE:20261012`,
 * or of an older box written like `X-PUSHED:2026-10-12`.
 *
 * @param value - Its value, a date or a text
 * @returns Day like `2026-10-12`
 */
function pushedDayOf(value: unknown): string {
    if (value instanceof ICAL.Time)
        return value.toString();
    return /^\d{8}$/.test(String(value)) ? icsTimeRead(String(value)).toString() : String(value);
}

/**
 * Reads the expected duration of a to-do, its `ESTIMATED-DURATION`: the property of the task extensions of iCalendar,
 * which `ical.js` does not know yet, so it gives its value as text, like `PT1H15M`.
 * - {@link ICAL.Duration.fromString}: Reads a duration of the iCalendar format.
 *
 * @param component - The to-do
 * @returns Minutes, `null` when it has none
 */
function minutesOf(component: ICAL.Component): number | null {
    const value: unknown = component.getFirstPropertyValue("estimated-duration");
    return value === null ? null : ICAL.Duration.fromString(String(value)).toSeconds() / 60;
}

/**
 * Reads the deadline of a to-do, its `DUE`, in the form of {@link Entry}.
 *
 * @param component - The to-do
 * @returns Date for a deadline without time, else ISO instant; empty when it has none
 */
function deadlineOf(component: ICAL.Component): string {
    const due: unknown = component.getFirstPropertyValue("due");
    return due instanceof ICAL.Time ? textOf(due) : "";
}

/**
 * Gives the day of a to-do with a deadline but no `DTSTART`, the day of its deadline in Berlin time,
 * as the start and the end of a whole day.
 * - `due`: Its `DUE`, a day or a time.
 * - `day`: Its day, like `2026-10-23`.
 * - {@link ICAL.Time.fromDateString}: Reads a day like `2026-10-23` into a time without time of day.
 *
 * @param component - The to-do
 * @returns Start of its day and start of the next
 */
function deadlineDayOf(component: ICAL.Component): [ICAL.Time, ICAL.Time] {
    const due: ICAL.Time = component.getFirstPropertyValue("due") as ICAL.Time;
    const day: string = due.isDate ? due.toString() : berlinDateOf(due.toJSDate());
    return [ICAL.Time.fromDateString(day), ICAL.Time.fromDateString(dayAdd(day, 1))];
}

/**
 * Turns an event or a to-do with a start and an end into an {@link Entry}.
 * `ical.js` reads a to-do as it reads an event: its start from `DTSTART`, its end the end of its day,
 * or its start when it has a time, see {@link Entry}.
 * - `todo`: Whether it is a to-do.
 * - `category`: Its `CATEGORIES`, empty for none.
 * - `module`, `type`: Skill and type of a skill entry from its `SUMMARY`, see {@link skillPartsOf}, else empty.
 * - `stamp`: Its `DTSTAMP`, an `ical.js` time when it has one.
 * - `completed`: Its `COMPLETED`, an `ical.js` time when it has one.
 * - `recurrence`: For a changed occurrence its `RECURRENCE-ID`, for an occurrence of a series its start,
 *   empty for an event that happens once.
 *
 * @param event - Event with title and place, or the series of an occurrence, or a to-do
 * @param start - Start of the event or the occurrence
 * @param end - End of the event or the occurrence
 * @param writable - Whether the file of the event may be written
 * @returns Entry as the page shows it
 */
function entryOf(event: ICAL.Event, start: ICAL.Time, end: ICAL.Time, writable: boolean): Entry {
    const todo: boolean = event.component.name === "vtodo";
    const category: string = String(event.component.getFirstPropertyValue("categories") ?? "");
    const titleLink: string = String(event.component.getFirstProperty("summary")?.getParameter("altrep") ?? "");
    const [module, type]: [string, string] =
        category === skillName ? skillPartsOf(event.summary ?? "", titleLink) : ["", ""];
    const stamp: unknown = event.component.getFirstPropertyValue("dtstamp");
    const completed: unknown = event.component.getFirstPropertyValue("completed");
    let recurrence: string = "";
    if (event.isRecurrenceException())
        recurrence = textOf(event.recurrenceId);
    else if (event.isRecurring())
        recurrence = textOf(start);
    return {
        id: event.uid,
        category: category,
        title: event.summary ?? "",
        titleLink: titleLink,
        location: event.location ?? "",
        locationLink: String(event.component.getFirstProperty("location")?.getParameter("altrep") ?? ""),
        from: String(event.component.getFirstPropertyValue("x-from") ?? ""),
        module: module,
        type: type,
        semester: String(event.component.getFirstPropertyValue("x-semester") ?? ""),
        chapters: event.component.getAllProperties("x-chapter")
            .map((property: ICAL.Property): string => String(property.getFirstValue())),
        links: event.component.getAllProperties("attach").map((property: ICAL.Property): Link => ({
            path: String(property.getFirstValue()), fingerprint: String(property.getParameter("x-sha256") ?? ""),
        })),
        attempts: event.component.getAllProperties("x-attempt")
            .map((property: ICAL.Property): string => String(property.getFirstValue())),
        tutors: event.component.getAllProperties("x-tutor")
            .map((property: ICAL.Property): string => String(property.getFirstValue())),
        foods: event.component.getAllProperties("x-food")
            .map((property: ICAL.Property): string => String(property.getFirstValue())),
        cooked: String(event.component.getFirstPropertyValue("x-cooked") ?? ""),
        pain: String(event.component.getFirstPropertyValue("x-pain") ?? ""),
        planned: plannedOf(event.component),
        note: event.description ?? "",
        todo: todo,
        status: String(event.component.getFirstPropertyValue("status") ?? ""),
        completed: completed instanceof ICAL.Time ? completed.toJSDate().toISOString() : "",
        minutes: todo ? minutesOf(event.component) : null,
        deadline: todo ? deadlineOf(event.component) : "",
        pushed: event.component.getAllProperties("x-pushed")
            .map((property: ICAL.Property): string => pushedDayOf(property.getFirstValue())),
        number: String(event.component.getFirstPropertyValue("x-number") ?? ""),
        written: stamp instanceof ICAL.Time ? stamp.toJSDate().toISOString() : "",
        editable: writable && (todo || !start.isDate),
        start: textOf(start),
        end: textOf(end),
        allDay: start.isDate,
        recurrence: recurrence,
    };
}

/**
 * Reads an `.ics` file into a {@link Calendar}, its events and its to-dos; a to-do without `DTSTART`
 * lies on the day of its deadline, its `DUE`, see {@link deadlineDayOf}, and one with neither,
 * which would belong to every day until done, has no day of the plan and is left out.
 * Registers the time zones of the file first, so times with a `TZID` convert correctly.
 * A changed occurrence has the `UID` of its series and a `RECURRENCE-ID`.
 * It stays an entry of its own at its new time,
 * and its series learns that it replaces the occurrence at the old time.
 * - {@link ICAL.parse}: Parses the text of the file into nested arrays.
 * - {@link ICAL.Event}: Reads an event, and a to-do the same way, by their common properties.
 * - {@link ICAL.Event#relateException}: Marks one occurrence of a series as replaced by a changed one.
 *
 * @param file - Path of the `.ics` file
 * @param modified - Time of the last change on disk
 * @returns Calendar of the file
 */
function calendarRead(file: string, modified: number): Calendar {
    const root: ICAL.Component = new ICAL.Component(ICAL.parse(readFileSync(file, "utf8")));
    root.getAllSubcomponents("vtimezone")
        .forEach((zone: ICAL.Component): void => ICAL.TimezoneService.register(zone));

    const events: ICAL.Event[] = [
        ...root.getAllSubcomponents("vevent"),
        ...root.getAllSubcomponents("vtodo")
            .filter((todo: ICAL.Component): boolean => todo.hasProperty("dtstart") || todo.hasProperty("due")),
    ].map((component: ICAL.Component): ICAL.Event => new ICAL.Event(component));
    const series: Map<string, ICAL.Event> = new Map(events
        .filter((event: ICAL.Event): boolean => event.isRecurring())
        .map((event: ICAL.Event): [string, ICAL.Event] => [event.uid, event]));
    events
        .filter((event: ICAL.Event): boolean => event.isRecurrenceException())
        .forEach((change: ICAL.Event): void => series.get(change.uid)?.relateException(change));

    const writable: boolean = writeAllowed(file);
    return {
        modified: modified,
        entries: events
            .filter((event: ICAL.Event): boolean => !event.isRecurring())
            .map((event: ICAL.Event): Entry => event.component.hasProperty("dtstart")
                ? entryOf(event, event.startDate, event.endDate, writable)
                : entryOf(event, ...deadlineDayOf(event.component), writable)),
        series: [...series.values()],
    };
}

/**
 * Gives the {@link Calendar} of a file, read again only when the file changed on disk.
 *
 * @param file - Path of the `.ics` file
 * @returns Calendar of the file
 */
function calendarOf(file: string): Calendar {
    const modified: number = statSync(file).mtimeMs;
    const known: Calendar | undefined = calendars.get(file);
    if (known?.modified === modified)
        return known;

    const calendar: Calendar = calendarRead(file, modified);
    calendars.set(file, calendar);
    return calendar;
}

/**
 * Lists the `.ics` files of calendar sources.
 * A folder that does not exist yet, like the new system before its first entry, gives no files.
 *
 * @param sources - Calendars, each the files of a folder with a name ending
 * @returns Paths of the `.ics` files
 */
function filesOf(sources: CalendarSource[]): string[] {
    return sources
        .filter((source: CalendarSource): boolean => existsSync(source.folder))
        .flatMap((source: CalendarSource): string[] =>
            readdirSync(source.folder, { recursive: true, encoding: "utf8" })
                .filter((name: string): boolean => name.endsWith(source.ending))
                .map((name: string): string => join(source.folder, name)));
}

/**
 * Gives the bounds of a {@link Range} in the form of an {@link Entry}.
 *
 * @param allDay - Whether the entry covers whole days
 * @param range - Range in both forms
 * @returns Days for an all-day entry, else instants
 */
function boundsOf(allDay: boolean, range: Range): [string, string] {
    return allDay ? range.days : range.instants;
}

/**
 * Lists the occurrences of a series that start before the end of a range, in order.
 * Leaves out the replaced ones, their changed versions are entries of their own.
 * - {@link ICAL.Event#iterator}: Walks the starts of all occurrences, without the excluded ones.
 * - {@link ICAL.Event#getOccurrenceDetails}: Gives start and end of one occurrence,
 *   and as `item` the changed version when the occurrence is replaced.
 *
 * @param series - Recurring event
 * @param range - Range whose end stops the walk
 * @param writable - Whether the file of the series may be written, so an occurrence may be changed alone
 * @returns {@link Entry} of each occurrence that is not replaced
 */
function occurrencesOf(series: ICAL.Event, range: Range, writable: boolean): Entry[] {
    const occurrences: Entry[] = [];
    const walk: ICAL.RecurExpansion = series.iterator();

    let start: ICAL.Time | undefined = walk.next();
    while (start !== undefined && textOf(start) < boundsOf(start.isDate, range)[1]) {
        const details: { item: ICAL.Event; startDate: ICAL.Time; endDate: ICAL.Time } =
            series.getOccurrenceDetails(start);
        if (details.item === series)
            occurrences.push(entryOf(series, details.startDate, details.endDate, writable));
        start = walk.next();
    }
    return occurrences;
}

/**
 * Reads the entries of calendar sources that start in a range or overlap it, the first so a to-do with a time
 * but no length, which ends where it starts, is found too; a source whose folder or files are missing gives none.
 * Compares all-day entries by their dates and timed entries by their instants,
 * so a birthday stays on its date in every time zone.
 *
 * @param sources - Calendars, each the files of a folder with a name ending
 * @param start - Start of the range with offset, like `2026-07-03T00:00:00+02:00`
 * @param end - End of the range, excluded, in the same form
 * @returns {@link Entry}s overlapping the range
 */
export function entriesRead(sources: CalendarSource[], start: string, end: string): Entry[] {
    const range: Range = {
        days: [start.slice(0, 10), end.slice(0, 10)],
        instants: [new Date(start).toISOString(), new Date(end).toISOString()],
    };

    return filesOf(sources)
        .flatMap((file: string): Entry[] => [
            ...calendarOf(file).entries,
            ...calendarOf(file).series.flatMap((series: ICAL.Event): Entry[] =>
                occurrencesOf(series, range, writeAllowed(file))),
        ])
        .filter((entry: Entry): boolean => {
            const [from, to]: [string, string] = boundsOf(entry.allDay, range);
            return entry.start < to && (entry.start >= from || entry.end > from);
        });
}

/**
 * Looks for the entry of the one event or to-do with an identifier in calendar sources.
 * An occurrence of a series has the identifier of its series, so it counts as none, a changed one too,
 * see {@link occurrenceLookup}.
 *
 * @param sources - Calendars, each the files of a folder with a name ending
 * @param id - Identifier of the event or to-do
 * @returns Path of its `.ics` file and its {@link Entry}, `undefined` when no entry that happens once has the identifier
 */
export function entryLookup(sources: CalendarSource[], id: string): [string, Entry] | undefined {
    for (const file of filesOf(sources)) {
        const entry: Entry | undefined = calendarOf(file).entries
            .find((candidate: Entry): boolean => candidate.id === id && candidate.recurrence === "");
        if (entry !== undefined)
            return [file, entry];
    }
    return undefined;
}

/**
 * Finds the `.ics` file of the event, to-do or series with an identifier in calendar sources, like a birthday
 * of `Birthdays.ics`, a yearly series.
 *
 * @param sources - Calendars, each the files of a folder with a name ending
 * @param id - Identifier, its `UID`, like `birthday-anna@nomsystem`
 * @returns Path of the file, `undefined` when none holds the identifier
 */
export function fileOfId(sources: CalendarSource[], id: string): string | undefined {
    return filesOf(sources).find((file: string): boolean =>
        calendarOf(file).entries.some((entry: Entry): boolean => entry.id === id)
        || calendarOf(file).series.some((series: ICAL.Event): boolean => series.uid === id));
}

/**
 * Looks for an occurrence of a series in calendar sources by the identifier of the series and the start
 * of the occurrence as the series has it, see {@link Entry}: a changed occurrence among the entries of a file,
 * else the occurrence the series itself has at that start.
 * - `calendar`: A file read.
 * - `changed`: The changed occurrence with that `RECURRENCE-ID`, `undefined` for none.
 * - `series`: The series with the identifier, `undefined` for none in the file.
 * - `day`: Day of the occurrence, like `2026-10-13`.
 * - `range`: From the start of the occurrence to a moment later, or to the next day for a series of whole days,
 *   so walking the series stops right after it, see {@link occurrencesOf}.
 * - `occurrence`: The occurrence of the series at that start, `undefined` for none.
 *
 * @param sources - Calendars, each the files of a folder with a name ending
 * @param id - Identifier of the series, like `weekly-lecture@nomsystem`
 * @param recurrence - Start of the occurrence as the series has it, like `2026-10-13T08:00:00.000Z`
 * @returns Path of its `.ics` file and its {@link Entry}, `undefined` when no series has such an occurrence
 */
export function occurrenceLookup(sources: CalendarSource[], id: string,
                                 recurrence: string): [string, Entry] | undefined {

    for (const file of filesOf(sources)) {
        const calendar: Calendar = calendarOf(file);
        const changed: Entry | undefined = calendar.entries
            .find((candidate: Entry): boolean => candidate.id === id && candidate.recurrence === recurrence);
        if (changed !== undefined)
            return [file, changed];

        const series: ICAL.Event | undefined =
            calendar.series.find((candidate: ICAL.Event): boolean => candidate.uid === id);
        const day: string = recurrence.slice(0, 10);
        const range: Range = {
            days: [day, dayAdd(day, 1)],
            instants: [recurrence, new Date(Date.parse(recurrence) + 1).toISOString()],
        };
        const occurrence: Entry | undefined = series === undefined ? undefined
            : occurrencesOf(series, range, writeAllowed(file))
                .find((candidate: Entry): boolean => candidate.recurrence === recurrence);
        if (occurrence !== undefined)
            return [file, occurrence];
    }
    return undefined;
}

/**
 * Finds the entry of the one event or to-do with an identifier in calendar sources, see {@link entryLookup}.
 * - `found`: Path and entry, `undefined` for none.
 *
 * @param sources - Calendars, each the files of a folder with a name ending
 * @param id - Identifier of the event or to-do
 * @returns Path of its `.ics` file and its {@link Entry}
 * @throws {Error} - When no entry that happens once has the identifier
 */
export function entryFind(sources: CalendarSource[], id: string): [string, Entry] {
    const found: [string, Entry] | undefined = entryLookup(sources, id);
    if (found === undefined)
        throw new Error(`No entry ${id}`);
    return found;
}

/**
 * Stops a write outside the three folders of the new system, like into my modules.
 *
 * @param file - Path of the file to write
 * @throws {Error} - When the file lies outside the folders of the new system
 */
function writeCheck(file: string): void {
    if (!writeAllowed(file))
        throw new Error(`No writing outside the new system: ${file}`);
}

/**
 * Reads an `.ics` file as {@link FileLines}.
 *
 * @param file - Path of the `.ics` file
 * @returns Lines of the file with its line break
 */
function linesRead(file: string): FileLines {
    const text: string = readFileSync(file, "utf8");
    const newline: string = text.includes("\r\n") ? "\r\n" : "\n";
    return { lines: text.split(newline), newline: newline };
}

/**
 * Writes {@link FileLines} into an `.ics` file, creating its folders when missing.
 *
 * @param file - Path of the `.ics` file
 * @param text - Lines with their line break
 */
function linesWrite(file: string, text: FileLines): void {
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, text.lines.join(text.newline));
}

/**
 * Creates an empty calendar with only the header the standard asks for, `PRODID` and `VERSION`,
 * and the time zone {@link zoneName}, which every `DTSTART` names. No `X-WR-CALNAME`, since its name is the name
 * of its file, like `2026_Log`, no `X-WR-TIMEZONE`, no `CALSCALE`, since `GREGORIAN` is the default,
 * and no `METHOD`, which only invitations need.
 *
 * @returns Calendar without events
 */
function calendarCreate(): ICAL.Component {
    const root: ICAL.Component = new ICAL.Component("vcalendar");
    root.addPropertyWithValue("prodid", "-//NomSystem//Dashboard//DE");
    root.addPropertyWithValue("version", "2.0");
    root.addSubcomponent(zoneComponent);
    return root;
}

/**
 * Gives the place of a line of an event or a to-do in the fixed order, see {@link lineOrder}:
 * the place of its property in the list, after them every other line of the standard, then the `X-` lines,
 * and last those of {@link lineEnding}, in their order.
 * - `name`: Name of its property, like `DTSTART` of `DTSTART;TZID=Europe/Berlin:20261013T100000`.
 * - `place`: Its place in the list, -1 for none.
 *
 * @param line - First line of a property
 * @returns Its rank, the lower the earlier
 */
function lineRankOf(line: string): number {
    const name: string = line.split(/[;:]/)[0].toUpperCase();
    const place: number = lineOrder.indexOf(name);
    if (place !== -1)
        return place;
    if (lineEnding.includes(name))
        return lineOrder.length + 2 + lineEnding.indexOf(name);
    return name.startsWith("X-") ? lineOrder.length + 1 : lineOrder.length;
}

/**
 * Puts the lines of an event or a to-do into the fixed order, see {@link lineOrder}: each property with the lines
 * that continue it, lines of the same rank in the order they had, and the components inside it, like an alarm,
 * at its end as they are, before its last line, like `END:VEVENT`.
 * - `properties`: Each property, its rank and its lines, in the order they stood.
 * - `inner`: Lines of the components inside it.
 * - `depth`: Number of components inside it the line is in.
 * - {@link Array#sort}: Keeps the order of lines of the same rank.
 *
 * @param component - Lines from `BEGIN:VEVENT` to `END:VEVENT`, or of a to-do
 * @returns The same lines in the fixed order
 */
function linesOrdered(component: string[]): string[] {
    const properties: [number, string[]][] = [];
    const inner: string[] = [];
    let depth: number = 0;
    component.slice(1, -1).forEach((line: string): void => {
        if (line.startsWith("BEGIN:"))
            depth++;
        if (depth > 0)
            inner.push(line);
        else if (/^[ \t]/.test(line) && properties.length > 0)
            properties[properties.length - 1][1].push(line);
        else
            properties.push([lineRankOf(line), [line]]);
        if (line.startsWith("END:"))
            depth--;
    });
    return [
        component[0],
        ...properties
            .sort((first: [number, string[]], second: [number, string[]]): number => first[0] - second[0])
            .flatMap(([, lines]: [number, string[]]): string[] => lines),
        ...inner,
        component[component.length - 1],
    ];
}

/**
 * Puts the lines of an event or a to-do, in the fixed order, see {@link linesOrdered}, before the last line
 * `END:VCALENDAR` of an `.ics` file, so everything already in the file stays as it is, byte for byte.
 * A missing file is created with the header of a new calendar, see {@link calendarCreate}.
 * - {@link ICAL.Component#toString}: Writes a component in the iCalendar format, lines parted by `\r\n`.
 *
 * @param file - Path of the `.ics` file
 * @param event - Lines from `BEGIN:VEVENT` to `END:VEVENT`, or from `BEGIN:VTODO` to `END:VTODO`
 * @throws {Error} - When the file has no line `END:VCALENDAR`
 */
function componentInsert(file: string, event: string[]): void {
    const text: FileLines = existsSync(file)
        ? linesRead(file)
        : { lines: `${calendarCreate().toString()}\r\n`.split("\r\n"), newline: "\r\n" };
    const calendarEnd: number = text.lines.lastIndexOf("END:VCALENDAR");
    if (calendarEnd === -1)
        throw new Error(`No END:VCALENDAR in ${file}`);

    text.lines.splice(calendarEnd, 0, ...linesOrdered(event));
    linesWrite(file, text);
}

/**
 * Finds the first property of a name among the lines of an event or a to-do,
 * leaving out the components inside it, like an alarm.
 * - `depth`: Number of components inside the event the line is in.
 *
 * @param event - Lines from `BEGIN:VEVENT` to `END:VEVENT`, or of a to-do
 * @param name - Name of the property, like `DTSTART`
 * @returns Index of its first line and of the line after its last, or `null` when the event has none
 */
function propertyFind(event: string[], name: string): [number, number] | null {
    const head: RegExp = new RegExp(`^${name}[;:]`, "i");
    let depth: number = 0;
    for (let index: number = 1; index < event.length - 1; index++) {
        if (event[index].startsWith("BEGIN:"))
            depth++;
        else if (event[index].startsWith("END:"))
            depth--;
        else if (depth === 0 && head.test(event[index])) {
            let next: number = index + 1;
            while (/^[ \t]/.test(event[next]))
                next++;
            return [index, next];
        }
    }
    return null;
}

/**
 * Gives the identifier of an entry: its `UID`, for one occurrence of a series the `UID` of its series and its start
 * in the series after `#`, see {@link Entry}, since each occurrence is a box of its own in the plan,
 * like `weekly-lecture@nomsystem#2026-10-26T09:00:00.000Z`.
 *
 * @param entry - Entry of the plan or the log
 * @returns Identifier, like `study-13@nomsystem`
 */
export function entryIdOf(entry: Entry): string {
    return entry.recurrence === "" ? entry.id : `${entry.id}#${entry.recurrence}`;
}

/**
 * Gives a property of an event or a to-do as one line, unfolded.
 * - `place`: Index of its first line and of the line after its last, `null` for none.
 *
 * @param event - Lines from `BEGIN:VEVENT` to `END:VEVENT`, or of a to-do
 * @param name - Name of the property, like `UID`
 * @returns Line like `UID:weekly-lecture@nomsystem`, empty when the event has none
 */
function unfoldedOf(event: string[], name: string): string {
    const place: [number, number] | null = propertyFind(event, name);
    return place === null ? ""
        : event.slice(...place).map((part: string): string => part.replace(/^[ \t]/, "")).join("");
}

/**
 * Finds the lines of every event or to-do with an identifier, see {@link entryIdOf}: with its `UID`
 * and without `RECURRENCE-ID`, or, for an identifier with `#`, with the `UID` before it and the `RECURRENCE-ID`
 * after it, compared as instants, like `RECURRENCE-ID;TZID=Europe/Berlin:20261026T100000`
 * for `weekly-lecture@nomsystem#2026-10-26T09:00:00.000Z`.
 * - {@link ICAL.Property.fromString}: Reads one line of a property, its time in the time zone it names.
 * - `at`: Place of the last `#`, -1 for none.
 * - `uid`, `recurrence`: `UID` and `RECURRENCE-ID` looked for, the latter empty for none.
 * - `changed`: Line of the `RECURRENCE-ID` of an event, empty for none.
 * - `start`: Its `RECURRENCE-ID` as instant or day, see {@link textOf}, empty for none.
 *
 * @param lines - Lines of an `.ics` file
 * @param id - Identifier of the event or to-do
 * @returns Index of each line `BEGIN:VEVENT` or `BEGIN:VTODO` and of the line after its `END:VEVENT` or `END:VTODO`
 */
function componentsOf(lines: string[], id: string): [number, number][] {
    const at: number = id.lastIndexOf("#");
    const uid: string = at === -1 ? id : id.slice(0, at);
    const recurrence: string = at === -1 ? "" : id.slice(at + 1);
    const found: [number, number][] = [];
    let begin: number = -1;
    lines.forEach((line: string, index: number): void => {
        if (line === "BEGIN:VEVENT" || line === "BEGIN:VTODO")
            begin = index;
        else if ((line === "END:VEVENT" || line === "END:VTODO") && begin !== -1) {
            const event: string[] = lines.slice(begin, index + 1);
            const changed: string = unfoldedOf(event, "RECURRENCE-ID");
            const start: string =
                changed === "" ? "" : textOf(ICAL.Property.fromString(changed).getFirstValue() as ICAL.Time);
            if (unfoldedOf(event, "UID").replace(/^UID:/i, "") === uid && start === recurrence)
                found.push([begin, index + 1]);
        }
    });
    return found;
}

/**
 * Finds the lines of the one event or to-do with an identifier, see {@link componentsOf}.
 * - `found`: Lines of each event or to-do with the identifier.
 *
 * @param lines - Lines of an `.ics` file
 * @param id - Identifier of the event or to-do
 * @returns Index of its line `BEGIN:VEVENT` or `BEGIN:VTODO` and of the line after its `END:VEVENT` or `END:VTODO`
 * @throws {Error} - When no event or to-do, or more than one, has the identifier
 */
function componentFind(lines: string[], id: string): [number, number] {
    const found: [number, number][] = componentsOf(lines, id);
    if (found.length !== 1)
        throw new Error(`${found.length} events ${id}`);
    return found[0];
}

/**
 * Builds a property of a time of an occurrence in the form of the `DTSTART` of its series:
 * with the same `TZID`, like `TZID=Europe/Berlin`, in UTC with `Z`, or a day with `VALUE=DATE`,
 * so calendar apps and `ical.js` match the `RECURRENCE-ID` with the occurrence.
 * - `property`: The property.
 * - `zoneId`: `TZID` of the `DTSTART` of the series, empty for none.
 *
 * @param series - The series
 * @param name - Name of the property, like `recurrence-id`
 * @param time - The time, in the time zone of the series
 * @returns Property to write
 */
function seriesTimeOf(series: ICAL.Event, name: string, time: ICAL.Time): ICAL.Property {
    const property: ICAL.Property = new ICAL.Property(name);
    const zoneId: string = String(series.component.getFirstProperty("dtstart")?.getParameter("tzid") ?? "");
    property.setValue(time);
    if (zoneId !== "" && !time.isDate)
        property.setParameter("tzid", zoneId);
    return property;
}

/**
 * Makes one occurrence of a series a component of its own, so it can be dropped, pushed or changed alone,
 * the way the standard changes one occurrence: a copy of its series with the same `UID` right after it,
 * without `RRULE`, `RDATE` and `EXDATE`, its `DTSTAMP` now, its `DTSTART` and its `DTEND` those of the occurrence,
 * and as `RECURRENCE-ID` the start it has in the series, like `RECURRENCE-ID;TZID=Europe/Berlin:20261026T100000`;
 * its lines in the fixed order, see {@link linesOrdered}; the series stays as it is, every other line of the file too.
 * From then on the occurrence is that component, found by its identifier with `#`, see {@link entryIdOf}.
 * An occurrence that is a component of its own already stays.
 * - `text`: Lines of the file.
 * - `series`: The series, `undefined` when the file holds none of the identifier.
 * - `walk`, `start`: Walk through the starts of the series, up to the start of the occurrence.
 * - `details`: Start and end of the occurrence.
 * - `place`: Index of the first line of the series and of the line after its last.
 * - `own`: Lines of the component of the occurrence.
 *
 * @param file - Path of the `.ics` file of the series
 * @param entry - The occurrence, see {@link Entry}
 * @throws {Error} - When the file lies outside the new system, or holds no such series or occurrence
 */
export function occurrenceOwn(file: string, entry: Entry): void {
    writeCheck(file);
    const text: FileLines = linesRead(file);
    if (componentsOf(text.lines, entryIdOf(entry)).length > 0)
        return;

    const series: ICAL.Event | undefined =
        calendarOf(file).series.find((candidate: ICAL.Event): boolean => candidate.uid === entry.id);
    if (series === undefined)
        throw new Error(`No series ${entry.id} in ${file}`);
    const walk: ICAL.RecurExpansion = series.iterator();
    let start: ICAL.Time | undefined = walk.next();
    while (start !== undefined && textOf(start) < entry.recurrence)
        start = walk.next();
    if (start === undefined || textOf(start) !== entry.recurrence)
        throw new Error(`No occurrence ${entryIdOf(entry)}`);

    const details: { startDate: ICAL.Time; endDate: ICAL.Time } = series.getOccurrenceDetails(start);
    const place: [number, number] = componentFind(text.lines, entry.id);
    const own: string[] = text.lines.slice(...place);
    propertyPut(own, "rrule", []);
    propertyPut(own, "rdate", []);
    propertyPut(own, "exdate", []);
    propertyPut(own, "dtstamp", [ICAL.Time.fromJSDate(new Date(), true)]);
    propertyPut(own, "dtstart", [seriesTimeOf(series, "dtstart", details.startDate)]);
    if (propertyFind(own, "dtend") !== null)
        propertyPut(own, "dtend", [seriesTimeOf(series, "dtend", details.endDate)]);
    propertyPut(own, "recurrence-id", [seriesTimeOf(series, "recurrence-id", start)]);
    text.lines.splice(place[1], 0, ...linesOrdered(own));
    linesWrite(file, text);
}

/**
 * Turns an instant into Berlin time.
 * - {@link ICAL.Time.fromJSDate}: Turns a JS date into an `ical.js` time, in UTC with `true`.
 * - {@link ICAL.Time#convertToZone}: Gives the same instant in another time zone.
 *
 * @param instant - Start or end of an entry
 * @returns Time in {@link zoneName}
 */
function berlinOf(instant: Date): ICAL.Time {
    return ICAL.Time.fromJSDate(instant, true).convertToZone(zone);
}

/**
 * Writes the date of an instant in Berlin time.
 *
 * @param instant - Start of an entry
 * @returns Date like `2026-07-03`
 */
export function berlinDateOf(instant: Date): string {
    return berlinOf(instant).toString().slice(0, 10);
}

/**
 * Writes the time of day of an instant in Berlin time.
 *
 * @param instant - An instant, like the start of a sleep
 * @returns Time like `23:30`
 */
export function berlinTimeOf(instant: Date): string {
    return berlinOf(instant).toString().slice(11, 16);
}

/**
 * Adds days to a day.
 *
 * @param day - Day like `2026-10-10`
 * @param days - Number of days to add
 * @returns Day like `2026-10-12`
 */
export function dayAdd(day: string, days: number): string {
    const date: Date = new Date(`${day}T00:00:00Z`);
    date.setUTCDate(date.getUTCDate() + days);
    return date.toISOString().slice(0, 10);
}

/**
 * Moves an instant by whole days in Berlin time, keeping its time of day, also over a day the clocks change,
 * like a box at 12:00 pushed to the next day.
 * - `time`: The instant in Berlin time, moved.
 * - {@link ICAL.Time#adjust}: Adds days, hours, minutes and seconds to a time, in its time zone.
 *
 * @param instant - An instant, like the expected time of a box
 * @param days - Number of days to move it by
 * @returns The instant at the same time of day, days later
 */
export function berlinLater(instant: Date, days: number): Date {
    const time: ICAL.Time = berlinOf(instant);
    time.adjust(days, 0, 0, 0);
    return time.toJSDate();
}

/**
 * Writes the start of a day in Berlin time with its offset, the form of a range of {@link entriesRead},
 * so whole-day entries compare by the day and timed ones by the instant.
 * - `start`: Midnight of the day in Berlin time.
 * - `offset`: Minutes Berlin time is ahead of UTC then, 120 in summer.
 * - {@link ICAL.Timezone#utcOffset}: Gives the offset of a time zone at a time, in seconds.
 *
 * @param day - Day like `2026-10-13`
 * @returns Start like `2026-10-13T00:00:00+02:00`
 */
export function berlinDayStartOf(day: string): string {
    const [year, month, date]: number[] = day.split("-").map(Number);
    const start: ICAL.Time = ICAL.Time.fromData({ year: year, month: month, day: date, hour: 0, minute: 0, second: 0 }, zone);
    const offset: number = zone.utcOffset(start) / 60;
    return `${day}T00:00:00+${String(Math.floor(offset / 60)).padStart(2, "0")}:${String(offset % 60).padStart(2, "0")}`;
}

/**
 * Turns an hour of a day in Berlin time into an instant, right also on the days the clocks change.
 * - {@link ICAL.Time.fromData}: Builds a time from its parts, in a time zone.
 * - {@link ICAL.Time#toJSDate}: Gives the instant of a time.
 *
 * @param day - Day like `2026-10-12`
 * @param hour - Hour of the day, from 0 to 23, like 9 for 09:00
 * @returns The instant, like `2026-10-12T07:00:00.000Z` for 09:00 in summer time
 */
export function berlinInstantOf(day: string, hour: number): Date {
    const [year, month, date]: number[] = day.split("-").map(Number);
    return ICAL.Time.fromData({ year: year, month: month, day: date, hour: hour, minute: 0, second: 0 }, zone)
        .toJSDate();
}

/**
 * Builds a property; a time in Berlin time gets the parameter `TZID`, like `DTSTART;TZID=Europe/Berlin:…`,
 * a link its path as value and the fingerprint of a file as parameter `X-SHA256`, see {@link Link}.
 *
 * @param name - Name of the property, like `dtstart`, `attach` for a link
 * @param value - Value of the property
 * @returns Property to write
 */
function propertyOf(name: string, value: string | ICAL.Time | Link): ICAL.Property {
    const property: ICAL.Property = new ICAL.Property(name);
    if (typeof value === "string" || value instanceof ICAL.Time)
        property.setValue(value);
    else {
        property.setValue(value.path);
        if (value.fingerprint !== "")
            property.setParameter("x-sha256", value.fingerprint);
    }
    if (value instanceof ICAL.Time && value.zone === zone)
        property.setParameter("tzid", zoneName);
    return property;
}

/**
 * Builds the property of a text field of an entry, see {@link textsOf}: its `LOCATION` with the link of its place
 * as the standard parameter `ALTREP`, when it has one, like
 * `LOCATION;ALTREP="https://nav.tum.de/room/0509.EG.980":Audimax 0509.EG.980\, Arcisstraße 21\, 80333 München…`,
 * and its `SUMMARY` with its link the same way, like the folder of a skill,
 * `SUMMARY;ALTREP="NomSkillingmodules/IN2028_…":IN2028_BusinessAnalyticsMachineLearning (VO)`;
 * every other one as its text.
 *
 * @param name - Name of the property, like `location`
 * @param value - Its text, like `Audimax 0509.EG.980, Arcisstraße 21, 80333 München, Deutschland`
 * @param fields - Text fields of the entry, with the link of its place
 * @returns Property to write
 */
function textPropertyOf(name: string, value: string, fields: EntryTexts): ICAL.Property {
    const property: ICAL.Property = propertyOf(name, value);
    if (name === "location" && fields.locationLink !== "")
        property.setParameter("altrep", [fields.locationLink]);
    if (name === "summary" && fields.titleLink !== "")
        property.setParameter("altrep", [fields.titleLink]);
    return property;
}

/**
 * Builds the `RELATED-TO` of a log entry, which points to the box it was logged from by its `UID`, the standard way,
 * like `RELATED-TO:study-13@nomsystem`; for one date of a series that date goes along as parameter `X-RECURRENCE-ID`
 * in the form of the iCalendar format, see {@link icsTextOf}, since the `UID` names the whole series,
 * like `RELATED-TO;X-RECURRENCE-ID=20261026T130000Z:weekly-lecture@nomsystem`.
 * - `at`: Place of the last `#` in the identifier, -1 for none.
 * - `property`: The property.
 *
 * @param box - Identifier of the box, see {@link entryIdOf}, like `weekly-lecture@nomsystem#2026-10-26T13:00:00.000Z`
 * @returns Property to write
 */
function relatedOf(box: string): ICAL.Property {
    const at: number = box.lastIndexOf("#");
    const property: ICAL.Property = propertyOf("related-to", at === -1 ? box : box.slice(0, at));
    if (at !== -1)
        property.setParameter("x-recurrence-id", icsTextOf(box.slice(at + 1)));
    return property;
}

/**
 * Builds a property of a new entry beyond its fields, see {@link entryAppend}: the box a log entry was logged from
 * as its `RELATED-TO`, see {@link relatedOf}, every other one with its value as it is, see {@link propertyOf}.
 *
 * @param name - Name of the property, like `x-food`, `related-to` for the box
 * @param value - Value of the property, the identifier of the box for `related-to`
 * @returns Property to write
 */
function ownPropertyOf(name: string, value: string | Link): ICAL.Property {
    return name === "related-to" && typeof value === "string" ? relatedOf(value) : propertyOf(name, value);
}

/**
 * Puts a property into the lines of an event, one line per value: takes out all its old lines
 * and puts the new ones where the first old one stood, or before the end of the event when there was none;
 * no value removes the property. Most properties have one value, the `X-ATTEMPT`s of a skill entry one per attempt,
 * its `ATTACH`es one per link.
 * - `at`: Line of the first old value, or the end of the event.
 * - {@link ICAL.Property#toICALString}: Writes a property in the iCalendar format, as one line.
 * - {@link ICAL.helpers.foldline}: Folds a line after every 75 bytes, parting the lines by `\r\n`.
 *
 * @param event - Lines from `BEGIN:VEVENT` to `END:VEVENT`, changed in place
 * @param name - Name of the property, like `dtstart`
 * @param values - New values, none to remove the property; a property built already, like a `LOCATION`
 *   with its `ALTREP`, see {@link textPropertyOf}, goes in as it is
 */
function propertyPut(event: string[], name: string, values: (string | ICAL.Time | Link | ICAL.Property)[]): void {
    let at: number = event.length - 1;
    for (let old: [number, number] | null = propertyFind(event, name); old !== null; old = propertyFind(event, name)) {
        at = Math.min(at, old[0]);
        event.splice(old[0], old[1] - old[0]);
    }
    event.splice(at, 0, ...values.flatMap((value: string | ICAL.Time | Link | ICAL.Property): string[] =>
        ICAL.helpers.foldline((value instanceof ICAL.Property ? value : propertyOf(name, value)).toICALString())
            .split("\r\n")));
}

/**
 * Text fields of an entry with the names of their properties, in the order they are written;
 * the skill and type of a skill entry stand only in its `SUMMARY`, see {@link skillPartsOf}.
 *
 * @param fields - Text fields of an event or a to-do
 * @returns Name of each property with its value, empty when it is not written
 */
function textsOf(fields: EntryTexts): [string, string][] {
    return [
        ["categories", fields.category],
        ["summary", fields.title],
        ["location", fields.location],
        ["x-from", fields.from],
        ["description", fields.note],
        ["x-semester", fields.semester],
    ];
}

/**
 * Appends an entry to an `.ics` file, creating file and folders when missing.
 * Writes start and end in Berlin time, and only the text fields and the properties beyond them that are not empty,
 * its place with its link, see {@link textPropertyOf}, the box it was logged from as `RELATED-TO`,
 * see {@link ownPropertyOf}.
 * - `id`: Identifier of the new event, its `UID`.
 *
 * @param file - Path of the `.ics` file
 * @param fields - Fields and times of the entry
 * @param own - Properties beyond the fields, each its name with its value,
 *   like `["x-attempt", "IN2028/Airline Revenue Interval;right"]` of a skill entry or `["x-food", "Reis;150"]`
 *   of a meal, `["attach", link]` for a link, see {@link Link}, or `["related-to", "study-13@nomsystem"]`
 *   for the box it was logged from
 * @returns Identifier of the new entry, like `b8f1e81f-15b4-460e-910d-ef6b1b3d09b3@nomsystem`
 * @throws {Error} - When the file lies outside the new system or has no line `END:VCALENDAR`
 */
export function entryAppend(file: string, fields: EntryFields, own: [string, string | Link][]): string {
    writeCheck(file);
    const id: string = `${randomUUID()}@nomsystem`;
    const event: ICAL.Component = new ICAL.Component("vevent");
    event.addProperty(propertyOf("dtstart", berlinOf(fields.start)));
    event.addProperty(propertyOf("dtend", berlinOf(fields.end)));
    event.addPropertyWithValue("dtstamp", ICAL.Time.fromJSDate(new Date(), true));
    event.addPropertyWithValue("uid", id);
    textsOf(fields)
        .filter(([, value]: [string, string]): boolean => value !== "")
        .forEach(([name, value]: [string, string]): void => {
            event.addProperty(textPropertyOf(name, value, fields));
        });
    own.filter(([, value]: [string, string | Link]): boolean => value !== "")
        .forEach(([name, value]: [string, string | Link]): void => {
            event.addProperty(ownPropertyOf(name, value));
        });
    componentInsert(file, event.toString().split("\r\n"));
    return id;
}

/**
 * Gives the `DTSTART` of a to-do: its day, written as `DTSTART;VALUE=DATE:20261013`, when it has no time,
 * else its time in Berlin time.
 * - {@link ICAL.Time.fromDateString}: Reads a day like `2026-10-13` into a time without time of day.
 *
 * @param fields - Fields of the to-do
 * @returns Value of its `DTSTART`
 */
function todoStartOf(fields: TodoFields): ICAL.Time {
    return fields.time === null ? ICAL.Time.fromDateString(fields.day) : berlinOf(fields.time);
}

/**
 * Gives the `DUE` of a to-do: its deadline, written as `DUE;VALUE=DATE:20261023` when it has no time,
 * else its time in Berlin time, like `DUE;TZID=Europe/Berlin:20261023T120000`.
 *
 * @param deadline - Deadline as ISO instant, or as day like `2026-10-23`
 * @returns Value of its `DUE`
 */
function deadlineTimeOf(deadline: string): ICAL.Time {
    return /^\d{4}-\d{2}-\d{2}$/.test(deadline) ? ICAL.Time.fromDateString(deadline) : berlinOf(new Date(deadline));
}

/**
 * Writes minutes as a duration of the iCalendar format, the value of an `ESTIMATED-DURATION`.
 * - {@link ICAL.Duration.fromSeconds}: Builds a duration from seconds.
 *
 * @param minutes - Minutes, like 75
 * @returns Duration like `PT1H15M`
 */
function durationOf(minutes: number): string {
    return ICAL.Duration.fromSeconds(minutes * 60).toString();
}

/**
 * Appends a to-do to an `.ics` file, a box of the plan, creating file and folders when missing:
 * its day or its time as `DTSTART`, or instead its deadline as `DUE`, its expected duration as `ESTIMATED-DURATION`
 * when it has one, `STATUS:NEEDS-ACTION`, since it is open, and only the text fields that are not empty.
 * A to-do with a deadline has no `DTSTART`: iCalendar (RFC 5545) wants `DUE` of the same kind as `DTSTART`,
 * both days or both times, and later, so the day of its deadline is its day, see {@link deadlineDayOf}.
 * - `id`: Identifier of the new to-do, its `UID`.
 *
 * @param file - Path of the `.ics` file
 * @param fields - Fields of the to-do
 * @returns Identifier of the new to-do, like `b8f1e81f-15b4-460e-910d-ef6b1b3d09b3@nomsystem`
 * @throws {Error} - When the file lies outside the new system or has no line `END:VCALENDAR`
 */
export function todoAppend(file: string, fields: TodoFields): string {
    writeCheck(file);
    const id: string = `${randomUUID()}@nomsystem`;
    const todo: ICAL.Component = new ICAL.Component("vtodo");
    if (fields.deadline === "")
        todo.addProperty(propertyOf("dtstart", todoStartOf(fields)));
    else
        todo.addProperty(propertyOf("due", deadlineTimeOf(fields.deadline)));
    if (fields.minutes !== null)
        todo.addProperty(propertyOf("estimated-duration", durationOf(fields.minutes)));
    todo.addPropertyWithValue("dtstamp", ICAL.Time.fromJSDate(new Date(), true));
    todo.addPropertyWithValue("uid", id);
    todo.addPropertyWithValue("status", "NEEDS-ACTION");
    textsOf(fields)
        .filter(([, value]: [string, string]): boolean => value !== "")
        .forEach(([name, value]: [string, string]): void => {
            todo.addProperty(textPropertyOf(name, value, fields));
        });
    componentInsert(file, todo.toString().split("\r\n"));
    return id;
}

/**
 * Puts the text fields that changed into the lines of an event or a to-do, a new place with its link,
 * see {@link textPropertyOf}; a place that stays keeps its line as it is, with its `ALTREP`.
 * A skill entry whose `SUMMARY` is written anew loses the lines `X-MODULE` and `X-TYPE` of an older entry,
 * since its `SUMMARY` names both now, see {@link skillPartsOf}.
 * - `textsOld`: Its text fields as read, with the names of their properties.
 *
 * @param component - Lines of the event or the to-do, changed in place
 * @param entry - Its entry as read
 * @param fields - New text fields
 */
function textsPut(component: string[], entry: Entry, fields: EntryTexts): void {
    const textsOld: [string, string][] = textsOf(entry);
    textsOf(fields).forEach(([name, value]: [string, string], index: number): void => {
        if (value !== textsOld[index][1])
            propertyPut(component, name, value === "" ? [] : [textPropertyOf(name, value, fields)]);
    });
    if (fields.category === skillName && fields.title !== entry.title) {
        propertyPut(component, "x-module", []);
        propertyPut(component, "x-type", []);
    }
}

/**
 * Writes the changed lines of an event or a to-do back where they stood in their file, or moves them into another file,
 * like the log of another year: writes them there first, so a failure in between leaves them twice
 * instead of losing them; its lines in the fixed order, see {@link linesOrdered}. Every other line of both files
 * stays as it is, byte for byte.
 *
 * @param file - Path of the `.ics` file of the event or the to-do
 * @param text - Lines of that file as read
 * @param place - Index of its first line and of the line after its last in the file
 * @param component - Its changed lines
 * @param target - Path of the `.ics` file it belongs into, `file` when it stays
 */
function componentWrite(file: string, text: FileLines, place: [number, number], component: string[],
                        target: string): void {

    const [begin, end]: [number, number] = place;
    if (target === file)
        text.lines.splice(begin, end - begin, ...linesOrdered(component));
    else {
        componentInsert(target, component);
        text.lines.splice(begin, end - begin);
    }
    linesWrite(file, text);
}

/**
 * Changes fields and times of the event of an entry, writing only the properties that changed,
 * and moves it into another file when one is given, see {@link componentWrite}.
 * - `place`: Index of its first line and of the line after its last in the file.
 *
 * @param file - Path of the `.ics` file of the event
 * @param entry - Entry of the event as read
 * @param fields - New fields and times
 * @param target - Path of the `.ics` file the event belongs into, `file` when it stays
 * @throws {Error} - When a file lies outside the new system or does not hold the event once
 */
export function entryChange(file: string, entry: Entry, fields: EntryFields, target: string): void {
    writeCheck(file);
    writeCheck(target);
    const text: FileLines = linesRead(file);
    const place: [number, number] = componentFind(text.lines, entryIdOf(entry));
    const event: string[] = text.lines.slice(...place);

    textsPut(event, entry, fields);
    if (fields.start.getTime() !== new Date(entry.start).getTime())
        propertyPut(event, "dtstart", [berlinOf(fields.start)]);
    if (fields.end.getTime() !== new Date(entry.end).getTime())
        propertyPut(event, "dtend", [berlinOf(fields.end)]);
    componentWrite(file, text, place, event, target);
}

/**
 * Changes the fields of a to-do, a box of the plan, writing only the properties that changed: its texts,
 * its `DTSTART` when its day or its time changed, its `DUE` when its deadline changed, its `ESTIMATED-DURATION`
 * when its expected duration changed; a to-do that gets a deadline loses its `DTSTART`, and one that loses
 * its deadline gets one, see {@link todoAppend}; moves it into another file when one is given,
 * see {@link componentWrite}.
 * - `place`: Index of its first line and of the line after its last in the file.
 * - `start`: Its new start in the form of {@link Entry}, its day without time, else its instant.
 *
 * @param file - Path of the `.ics` file of the to-do
 * @param entry - Entry of the to-do as read
 * @param fields - New fields
 * @param target - Path of the `.ics` file the to-do belongs into, `file` when it stays
 * @throws {Error} - When a file lies outside the new system or does not hold the to-do once
 */
export function todoChange(file: string, entry: Entry, fields: TodoFields, target: string): void {
    writeCheck(file);
    writeCheck(target);
    const text: FileLines = linesRead(file);
    const place: [number, number] = componentFind(text.lines, entryIdOf(entry));
    const todo: string[] = text.lines.slice(...place);

    textsPut(todo, entry, fields);
    const start: string = fields.time === null ? fields.day : fields.time.toISOString();
    if (fields.deadline === "" && (start !== entry.start || entry.deadline !== ""))
        propertyPut(todo, "dtstart", [todoStartOf(fields)]);
    if (fields.deadline !== "" && entry.deadline === "")
        propertyPut(todo, "dtstart", []);
    if (fields.deadline !== entry.deadline)
        propertyPut(todo, "due", fields.deadline === "" ? [] : [deadlineTimeOf(fields.deadline)]);
    if (fields.minutes !== entry.minutes)
        propertyPut(todo, "estimated-duration", fields.minutes === null ? [] : [durationOf(fields.minutes)]);
    componentWrite(file, text, place, todo, target);
}

/**
 * Puts new values into properties of the event or to-do with an identifier, replacing all old lines of each,
 * like the end, the `X-CHAPTER`s and the `X-ATTEMPT`s of a skill entry that gets one more attempt;
 * a date goes in Berlin time, a link as `ATTACH`, see {@link Link}. Every other line of the file stays as it is,
 * byte for byte.
 *
 * @param file - Path of the `.ics` file
 * @param id - Identifier of the event or to-do
 * @param properties - Properties, each its name with its new values, like `["x-attempt", ["IN2028/…;right", …]]`
 * @throws {Error} - When the file lies outside the new system or does not hold the event once
 */
export function propertiesPut(file: string, id: string, properties: [string, (string | Date | Link)[]][]): void {
    writeCheck(file);
    const text: FileLines = linesRead(file);
    const place: [number, number] = componentFind(text.lines, id);
    const event: string[] = text.lines.slice(...place);
    properties.forEach(([name, values]: [string, (string | Date | Link)[]]): void => propertyPut(event, name,
        values.map((value: string | Date | Link): string | ICAL.Time | Link =>
            value instanceof Date ? berlinOf(value) : value)));
    componentWrite(file, text, place, event, file);
}

/**
 * Sets the state of a box of the plan: its `STATUS`, and for a done to-do its `COMPLETED`,
 * the moment it was done, in UTC as the standard wants it; a status that is not done takes `COMPLETED` out.
 * Every other line of the file stays as it is, byte for byte.
 * - `values`: `COMPLETED` in UTC, none when there is none.
 * - {@link ICAL.Time.fromJSDate}: Turns a JS date into an `ical.js` time, in UTC with `true`.
 *
 * @param file - Path of the `.ics` file
 * @param id - Identifier of the to-do or the event
 * @param status - New `STATUS`, like `CANCELLED`, empty to take it out, as for an event of the plan that is open again
 * @param completed - When a to-do was done, `null` for any other status and for an event
 * @throws {Error} - When the file lies outside the new system or does not hold the to-do or the event once
 */
export function statusPut(file: string, id: string, status: string, completed: Date | null): void {
    writeCheck(file);
    const text: FileLines = linesRead(file);
    const place: [number, number] = componentFind(text.lines, id);
    const component: string[] = text.lines.slice(...place);
    const values: ICAL.Time[] = completed === null ? [] : [ICAL.Time.fromJSDate(completed, true)];
    propertyPut(component, "status", status === "" ? [] : [status]);
    propertyPut(component, "completed", values);
    componentWrite(file, text, place, component, file);
}

/**
 * Notes the days a box was pushed from to the next day, one `X-PUSHED` each, as dates of the iCalendar format,
 * like `X-PUSHED;VALUE=DATE:20261012`, replacing all its old lines, also those of an older box written
 * like `X-PUSHED:2026-10-12`. Every other line of the file stays as it is, byte for byte.
 * - {@link ICAL.Time.fromDateString}: Reads a day like `2026-10-12` into a time without time of day.
 *
 * @param file - Path of the `.ics` file
 * @param id - Identifier of the to-do or the event
 * @param days - Days it was pushed from, in order, like `2026-10-12`
 * @throws {Error} - When the file lies outside the new system or does not hold the to-do or the event once
 */
export function pushesPut(file: string, id: string, days: string[]): void {
    writeCheck(file);
    const text: FileLines = linesRead(file);
    const place: [number, number] = componentFind(text.lines, id);
    const component: string[] = text.lines.slice(...place);
    propertyPut(component, "x-pushed", days.map((pushed: string): ICAL.Time => ICAL.Time.fromDateString(pushed)));
    componentWrite(file, text, place, component, file);
}

/**
 * Removes the event or to-do with an identifier from an `.ics` file.
 * Every other line of the file stays as it is, byte for byte.
 *
 * @param file - Path of the `.ics` file
 * @param id - Identifier of the event or to-do
 * @throws {Error} - When the file lies outside the new system or does not hold the event once
 */
export function entryRemove(file: string, id: string): void {
    writeCheck(file);
    const text: FileLines = linesRead(file);
    const [begin, end]: [number, number] = componentFind(text.lines, id);
    text.lines.splice(begin, end - begin);
    linesWrite(file, text);
}
