/**
 * ## Course
 *
 * The course of a module in the semester of today, which the page of the module shows above its chapters, one card
 * per type, see `src/editor/course.ts`: its boxes of the plan of every type, its series and the groups of its
 * tutorials; the series of a box of the plan opens in the same form from the day, see `src/day/series.ts`, read
 * in the semester of that box.
 * A series is no rule in a file: the plan holds one box per lecture, see `boxes.ts`, and the series of a type is read
 * back from its boxes, every box of one numbered type of a module in its semester, see `numberedTypes` in `boxes.ts`,
 * numbered across every weekday they fall on, like IN0004's lectures on Mondays and on Tuesdays at their own times.
 * Its rule is the one most of its boxes follow, see {@link ruleOf}: its slots, each a weekday at least two of its boxes
 * fall on, with the time most of them have there, like `Mon 12:00–13:30` and `Tue 16:00–17:30`, the place and
 * the people most of them have, its first day and its last, the days of a slot without box between them left out,
 * like `Mon 14:00–16:00 · 19.10.2026–01.02.2027 · except 28.12., 04.01.`, and its extras, single dates besides its
 * weeks, each with its own times, like a session on Sat, 14.11.2026, 10:00–12:00 or a repetition in March;
 * a box that differs from it stays as it is, like a lecture moved once to another room or another day of its week,
 * and a box pushed to a later day counts on the day it left, see {@link datedOf}. Extras are read back as well,
 * so no line of a file holds a rule.
 * The boxes of my tutorials that go to a group, by their `X-GROUP`, follow the rule of my group: my group is stored
 * nowhere, it is the group most of my open boxes go to, see {@link mineOf}, and a box of another group is a week I go
 * to that group instead.
 *
 * The groups of the tutorials of a module lie beside its plan, in `University/<module folder>_Groups.ics`,
 * see `groupsEnding` in `sources.ts`, one weekly event per group as TUMonline lists it, see {@link groupPut}:
 * its first session as `DTSTART` and `DTEND` in Berlin time, `RRULE:FREQ=WEEKLY;UNTIL=…` with the start of its last
 * session in UTC, as the standard wants it beside a time zone, one `EXDATE` per week it leaves out,
 * `CATEGORIES:Skill`, its `SUMMARY` as that of a box, like `IN2028_BusinessAnalyticsMachineLearning (TU)`,
 * its room as `LOCATION` with its link, its tutor as `ATTENDEE` only once known, `X-GROUP:03` and `X-SEMESTER:2026W`.
 *
 * Five changes write the boxes of a series, week by week, see {@link draftsOf}, each leaving every box done,
 * cancelled by me or pushed where it is, since those are mine, see {@link changeable}, and each numbering the boxes
 * of the type anew by their places, see {@link numbersOf}:
 * - its rule changed in the form of the series, see {@link seriesApply}: each date of the rule takes the box of its
 *   week with what changed of its slot, a date without box gets one, and a box no date of its week takes goes,
 *   but only open boxes from today on, see {@link ahead}, so a day over stays as it was; in the same form I skip a box
 *   or mark it cancelled by the university, or take that back, see {@link stateSet}, all of it written as I save;
 * - a group made mine, see {@link groupMine}: from the week of its next session on, my boxes go to its sessions,
 *   also a week I went to another group, so the series follows the group from then on; with no series yet,
 *   its sessions to come become one;
 * - one week's tutorial moved to another group, see {@link weekMove}: its day, its time, its length, its place,
 *   its tutor and its group, its number kept;
 * - one session of a group picked for its week in the card of its type, see {@link weekPick}: the box of its week goes
 *   to it as by {@link weekMove}, a week without box gets one, and with no series from that week on yet the sessions
 *   of the group from then on become one;
 * - a tutorial logged, see {@link groupFollow}: every later week goes to the group I was at, so a week I pick nothing
 *   finds me where I was last time.
 * A box whose group I picked by hand for its week, by a pick or a week moved, carries `X-PICKED:TRUE`, and the later
 * weeks never take it along when they follow the group I was at; a group made mine takes it back.
 * The reader offers each as a route, see `reader.ts`, so Claude fills series and groups through the same code;
 * none of them shares anything with anyone, see `shared.ts`.
 *
 * A new box repeated weekly in its dialog, by its row `Repeat`, has such a rule too, see {@link repeatApply}:
 * a skill box of a numbered type of a module becomes its series as the form of a new series makes it, numbered,
 * while its type has no box in the semester yet; any other box, like one of a project or my gym, one box per date,
 * each as the dialog adds one alone, see `boxesAdd` in `boxes.ts`.
 *
 * - `node:path`: Builds and names the paths of the plan and the groups.
 * - `./boxes.ts`: Reads the skill boxes with their states, finds a box, removes one, adds boxes and takes back one
 *   I skipped, and names the numbered types.
 * - `./calendar.ts`: Reads the groups, writes boxes and groups, and calculates with days and times in Berlin time.
 * - `./categories.ts`: Gives the semester of a day and tells well-formed people.
 * - `./documents.ts`: Writes what a box or a group is, linking the folder of its material.
 * - `./notes.ts`: Lists the folders of my modules and of their material, and gives the code of a module.
 * - `./places.ts`: Gives the link of a place.
 * - `./sources.ts`: Names `NomManagecalendar` and the plan and the groups of a module.
 */

import { basename, dirname, relative, sep } from "node:path";
import { boxDelete, boxDrop, boxesAdd, boxFind, numberedTypes, skillBoxesRead } from "./boxes.ts";
import {
    berlinDateOf, berlinDayStartOf, berlinInstantOf, berlinTimeOf, dayAdd, entriesRead, entryAppend, entryRemove,
    icsTextOf, propertiesPut, skillName, todoAppend, todoChange,
} from "./calendar.ts";
import { attendeesAllow, semesterOf } from "./categories.ts";
import { titleOf } from "./documents.ts";
import { codeOf, moduleFolderOf, moduleFoldersRead, semesterFoldersRead } from "./notes.ts";
import { onlineFor, placeLinkOf } from "./places.ts";
import { calendarRoot, groupsEnding, planEnding, skillFileOf } from "./sources.ts";

import type { Box, BoxNew, BoxState } from "./boxes.ts";
import type { Attendee, Entry, EntryFields, Online, Push } from "./calendar.ts";


/**
 * A slot of a rule, one weekday of it with its time, see {@link Rule}.
 *
 * - `weekday`: Its weekday, from 1 for Monday to 7 for Sunday.
 * - `start`: Its time of start in Berlin time, like `14:00`; empty for boxes without time.
 * - `end`: Its time of end in Berlin time, like `16:00`, after its start; empty for boxes without time.
 */
export type Slot = {
    weekday: number;
    start: string;
    end: string;
};

/**
 * A single date of a rule outside its weeks, see {@link Rule}, like a session on a Saturday.
 *
 * - `day`: Its day, like `2026-11-14`.
 * - `start`, `end`: Its times in Berlin time, like `10:00` and `12:00`, as those of a slot.
 */
export type Extra = {
    day: string;
    start: string;
    end: string;
};

/**
 * A weekly rule, of a series or of a group, see the top of this file: as read back from its boxes or its sessions,
 * see {@link ruleOf}, as the form of a series sends it, see {@link seriesApply}, or as a group is written,
 * see {@link groupPut}.
 *
 * - `type`: Type of its boxes, like `VO`.
 * - `slots`: Its weekdays with their times, by weekday, each weekday once; a group has one.
 * - `extras`: Its single dates besides its weeks, like a session on a Saturday, by their days; none for none,
 *   as for every group.
 * - `location`: Its place as an entry writes it, see `lineOf` in `places.ts`, like
 *   `5416.01.003 (Hörsaal 2 "Interims II"), Lichtenbergstraße 2b, 85748, Garching bei München, Deutschland`,
 *   empty for none.
 * - `locationLink`: Link of its place, like `https://nav.tum.de/room/5416.01.003`, the place keeping the link it has
 *   or taking that of `Places.md` or `Rooms.md`, see `placeLinkOf` in `places.ts`.
 * - `online`, `onlineLink`, `passcode`: What its boxes do online, like the stream of a lecture on `TUM-Live`
 *   with its link, see `Online` in `calendar.ts`.
 * - `attendees`: Who I am with, like a tutor, see `Attendee` in `calendar.ts`; none for nobody.
 * - `first`: The first day of its weeks, like `2026-10-19`; an extra may lie before it.
 * - `last`: The last day of its weeks, like `2027-02-01`, on or after its first; an extra may lie after it.
 * - `excepts`: The days of its slots between its first and its last day it leaves out, like `2026-12-28`, in order;
 *   none for none.
 * - `group`: The group its boxes go to, like `03`: of a group its own, of my tutorials my group, see {@link mineOf};
 *   empty for none.
 * - `semester`: Its semester, like `2026W`.
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
 * A series of the course, see the top of this file.
 *
 * - `rule`: Its rule, read back from its boxes, see {@link ruleOf}.
 * - `count`: How many boxes it has, of every state.
 */
export type Series = {
    rule: Rule;
    count: number;
};

/**
 * A session of a group, as the page shows it.
 *
 * - `start`: Its start as ISO instant, like `2026-10-27T09:00:00.000Z`.
 * - `minutes`: Its length in minutes, like 120.
 */
export type Session = {
    start: string;
    minutes: number;
};

/**
 * A group of the tutorials of a module, see the top of this file, as the page shows it.
 *
 * - `id`: Its identifier in the file of the groups, its `UID`.
 * - `rule`: Its rule, read back from its sessions, see {@link ruleOf}: its type, its one slot, its room, its tutor,
 *   its first and last day, the weeks it leaves out, its group, like `03`, and its semester.
 * - `sessions`: Its sessions, the earliest first.
 */
export type Group = {
    id: string;
    rule: Rule;
    sessions: Session[];
};

/**
 * The course of a module in the semester of today, see the top of this file, as the page shows it.
 *
 * - `module`: Name of the folder of the module, like `IN2028_BusinessAnalyticsMachineLearning`.
 * - `semester`: The semester, like `2026W`.
 * - `boxes`: Its skill boxes of the semester, of every type, each with its state, see `Box` in `boxes.ts`,
 *   the earliest first.
 * - `series`: Its series, one per numbered type with boxes, see {@link seriesListOf}.
 * - `groups`: Its groups of the semester, by type and group.
 * - `folders`: The folder of the material of the semester of each type that has one, from the module folder,
 *   like `VO_UniversityLectureLessons/TUM_2026W` for `VO`, see `semesterFoldersRead` in `notes.ts`.
 * - `file`: Its plan in `NomManagecalendar`, like `University/IN2028_BusinessAnalyticsMachineLearning_Plan.ics`.
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
 * A change of a series, as the form of a series sends it, see {@link seriesApply}.
 *
 * - `module`: Name of the folder of the module, like `IN2028_BusinessAnalyticsMachineLearning`.
 * - `rule`: The rule as typed, its slots in the order of the form.
 * - `old`: The rule as read back when the form opened, `null` for a new series.
 * - `before`: For each slot of the rule, the weekday of the slot of `old` whose boxes it takes, like 1 for a slot
 *   moved from Monday to Tuesday, 0 for a slot added; left out, each slot takes those of the slot of its own weekday.
 * - `states`: The state I gave a box of the series in the form, by its identifier: `open`, `dropped`, skipped by me,
 *   or `university`, cancelled by the university, see `BoxState` in `boxes.ts`; left out for none.
 * - `dry`: Whether only to tell what the change would make, for the preview of the form, writing nothing.
 */
export type SeriesChange = {
    module: string;
    rule: Rule;
    old: Rule | null;
    before?: number[];
    states?: { [id: string]: BoxState };
    dry: boolean;
};

/**
 * A group made mine, as the page sends it, see {@link groupMine}.
 *
 * - `module`: Name of the folder of the module, like `IN2028_BusinessAnalyticsMachineLearning`.
 * - `type`: Type of the group, like `TU`.
 * - `group`: The group, like `03`.
 * - `dry`: Whether only to tell what that would make, for the preview of the form, writing nothing; false when left
 *   out.
 */
export type MineChange = {
    module: string;
    type: string;
    group: string;
    dry?: boolean;
};

/**
 * One week's box moved to another group, as the page sends it, see {@link weekMove}.
 *
 * - `box`: Identifier of the box.
 * - `group`: The group it goes to that week, like `06`.
 */
export type WeekChange = {
    box: string;
    group: string;
};

/**
 * One session of a group picked for its week, as the card of its type sends it, see {@link weekPick}.
 *
 * - `module`: Name of the folder of the module, like `IN0009_BetriebssystemeSystemsoftware`.
 * - `type`: Type of the group, like `TU`.
 * - `group`: The group, like `03`.
 * - `start`: The start of the session as ISO instant, like `2026-11-05T15:00:00.000Z`.
 */
export type PickChange = {
    module: string;
    type: string;
    group: string;
    start: string;
};

/**
 * A group to write, see {@link groupPut}.
 *
 * - `module`: Name of the folder of the module, like `IN2028_BusinessAnalyticsMachineLearning`.
 * - `rule`: Its rule, with its one slot and its group, like `03`.
 */
export type GroupNew = {
    module: string;
    rule: Rule;
};

/**
 * A group to remove, see {@link groupRemove}.
 *
 * - `module`: Name of the folder of the module, like `IN2028_BusinessAnalyticsMachineLearning`.
 * - `type`: Its type, like `TU`.
 * - `group`: The group, like `03`.
 * - `semester`: Its semester, like `2026W`.
 */
export type GroupGone = {
    module: string;
    type: string;
    group: string;
    semester: string;
};

/**
 * A new box repeated weekly, as its dialog sends it with its row `Repeat` open, see {@link repeatApply}.
 *
 * - `box`: The box as the dialog sends one made once, see `BoxNew` in `boxes.ts`, without its day, time, length
 *   and deadline, which each date sets.
 * - `slots`: Its weekdays with their times, in the order of the dialog.
 * - `extras`: Its single dates besides its weeks, see {@link Extra}.
 * - `first`, `last`: Its first and last day, like `2026-10-19`.
 * - `excepts`: The days of its slots between them it leaves out, like `2026-12-28`.
 * - `dry`: Whether only to tell what it would make, for the preview of the dialog, writing nothing.
 */
export type RepeatChange = {
    box: Omit<BoxNew, "day" | "time" | "minutes" | "deadline">;
    slots: Slot[];
    extras: Extra[];
    first: string;
    last: string;
    excepts: string[];
    dry: boolean;
};

/**
 * A box of a series after a change, see {@link seriesApply}, for the preview of the form.
 *
 * - `id`: Its identifier, empty for a new one.
 * - `day`: Its day after the change, like `2026-10-26`.
 * - `time`: Its time after the change as ISO instant, empty for none.
 * - `minutes`: Its length after the change in minutes, `null` for none.
 * - `number`: Its number after the change, like `2`, `NONE` for one the university cancelled, empty for none.
 * - `state`: Its state, as the change gives it, see `BoxState` in `boxes.ts`, `new` for a new one.
 * - `pushed`: Whether I pushed it to a later day, so it stands no more on its own day, see `Push` in `calendar.ts`.
 * - `editable`: Whether I may skip it or mark it cancelled by the university: a to-do of the new system, no date
 *   of a series of the file, not done; a new one too.
 * - `change`: `new`, `changed`, its day, time, place, what it does online or its people, `renumbered`, only its number,
 *   its group or whether I picked it, or `removed`; empty for one that stays as it is, or whose state alone changes.
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
 * What a rule is read back from, see {@link ruleOf}: a box at its place in its series, see {@link datedOf},
 * or a session of a group; its day, its time as ISO instant, empty for none, its length in minutes, `null` for none,
 * its place with its link, what it does online and who I am with.
 */
type Dated = Pick<Box, "day" | "time" | "minutes" | "location" | "locationLink" | "attendees"> & Online;

/**
 * A date of a rule, see {@link datesOf}: its day, its times, like `14:00` and `16:00`, as those of its slot or its
 * extra, and the place of its slot in the rule, -1 for an extra.
 */
type RuleDate = Extra & {
    slot: number;
};

/**
 * What of a box a change of a series sets, see {@link draftSet}: its day, its time with its length, its place
 * with its link, what it does online, its people and its group.
 */
type Field = "day" | "time" | "location" | "online" | "attendees" | "group";

/**
 * A date of a series after a change, see {@link draftsOf}.
 *
 * - `day`: Its day, like `2026-10-26`.
 * - `start`: Its time of start in Berlin time, like `14:00`, empty for none.
 * - `minutes`: Its length in minutes, `null` for none.
 * - `location`, `locationLink`: Its place with its link.
 * - `online`, `onlineLink`, `passcode`: What it does online.
 * - `attendees`: Who I am with.
 * - `group`: The group it goes to, like `03`, empty for none.
 * - `picked`: Whether I picked its group by hand for its week, see the top of this file; set with its group.
 * - `before`: The weekday the box it takes fell on before the change, 1 for Monday to 7 for Sunday: that of its slot
 *   as the form opened, like 1 for a slot moved from Monday to Tuesday, else its own.
 * - `fields`: What of the box it takes changes, see {@link Field}.
 * - `made`: Whether it gets a new box while no box of its week is there to take, see {@link draftsOf}.
 * - `added`: Whether it is a date of a slot or an extra added in the form, which takes only a box of its own weekday,
 *   never one of another day of its week, so a Thursday added never takes the box of a Monday left out.
 */
type Target = Online & {
    day: string;
    start: string;
    minutes: number | null;
    location: string;
    locationLink: string;
    attendees: Attendee[];
    group: string;
    picked: boolean;
    before: number;
    fields: Field[];
    made: boolean;
    added: boolean;
};

/**
 * A box of a type as a change of a series plans it, see {@link draftsOf}, before anything is written.
 *
 * - `box`: The box as it stands, `null` for a new one.
 * - `day`, `time`, `minutes`, `location`, `locationLink`, `online`, `onlineLink`, `passcode`, `attendees`, `group`,
 *   `picked`, `number`: As those of a box after the change, see `Box` in `boxes.ts`.
 * - `removed`: Whether the change removes it.
 */
type Draft = Online & {
    box: Box | null;
    day: string;
    time: string;
    minutes: number | null;
    location: string;
    locationLink: string;
    attendees: Attendee[];
    group: string;
    picked: boolean;
    number: string;
    removed: boolean;
};

/**
 * Everything of a box a group made mine, a week moved to a group, a session picked, a group followed or a new slot
 * sets, see {@link draftSet}.
 */
const allFields: Field[] = ["day", "time", "location", "online", "attendees", "group"];

/**
 * Most weeks a rule may span, about a year, so a slip of a year typed makes no hundreds of boxes.
 */
const ruleWeeks: number = 53;

/**
 * A week in milliseconds.
 */
const weekLength: number = 7 * 24 * 60 * 60 * 1000;


/**
 * Gives the weekday of a day.
 *
 * @param day - Day like `2026-10-19`
 * @returns 1 for Monday to 7 for Sunday, like 1
 */
function weekdayOf(day: string): number {
    return (new Date(`${day}T12:00:00Z`).getUTCDay() + 6) % 7 + 1;
}

/**
 * Gives the Monday of the week of a day, which names its week.
 *
 * @param day - Day like `2026-10-22`
 * @returns Day like `2026-10-19`
 */
function mondayOf(day: string): string {
    return dayAdd(day, 1 - weekdayOf(day));
}

/**
 * Reads a time of day as minutes after midnight.
 * - `hours`, `minutes`: Its hours and minutes.
 *
 * @param time - Time like `14:15`
 * @returns Minutes like 855
 */
function minutesOf(time: string): number {
    const [hours, minutes]: number[] = time.split(":").map(Number);
    return hours * 60 + minutes;
}

/**
 * Gives the instant of a time of a day in Berlin time.
 * - `hours`, `minutes`: Hours and minutes of the time.
 *
 * @param day - Day like `2026-10-19`
 * @param time - Time like `14:15`
 * @returns The instant
 */
function instantOf(day: string, time: string): Date {
    const [hours, minutes]: number[] = time.split(":").map(Number);
    return berlinInstantOf(day, hours, minutes);
}

/**
 * Gives the first day of a semester, from which its course is read for a year, so a retake after its end belongs
 * to it, like the retake of a winter in April.
 *
 * @param semester - Semester, like `2026W`
 * @returns Day like `2026-10-01`, or `2027-04-01` for `2027S`
 */
function semesterBeginOf(semester: string): string {
    return `${semester.slice(0, 4)}-${semester.endsWith("W") ? "10" : "04"}-01`;
}

/**
 * Gives of a list the value whose key most of them have, the earliest of those equally many.
 * - `counts`: How many of them have each key.
 *
 * @param values - Values, in their order
 * @param keyOf - Gives the key of a value, like its place
 * @returns The value, `undefined` for none
 */
function modeOf<T>(values: T[], keyOf: (value: T) => string): T | undefined {
    const counts: Map<string, number> = new Map();
    values.forEach((value: T): void => {
        counts.set(keyOf(value), (counts.get(keyOf(value)) ?? 0) + 1);
    });
    return values.reduce((best: T | undefined, value: T): T | undefined => best === undefined
        || (counts.get(keyOf(value)) ?? 0) > (counts.get(keyOf(best)) ?? 0) ? value : best, undefined);
}

/**
 * Gives a box at its place in its series, see the top of this file: where it stood before its first push,
 * see `Push` in `calendar.ts`, else where it stands, so a lecture pushed to the next day counts on its own day.
 * - `left`: Where it stood before its first push, `undefined` for a box never pushed.
 *
 * @param box - The box
 * @returns The box at its place in its series
 */
function datedOf(box: Box): Dated {
    const left: Push | undefined = box.pushed[0];
    return left === undefined ? box : { ...box, day: left.day, time: left.time, minutes: left.minutes ?? box.minutes };
}

/**
 * Gives the week of a box in its series, by its Monday, see {@link datedOf}.
 *
 * @param box - The box
 * @returns Day like `2026-10-19`
 */
function weekOf(box: Box): string {
    return mondayOf(datedOf(box).day);
}

/**
 * Takes out of the boxes of a week the first that falls on a weekday, else, with `any`, the earliest of them,
 * see {@link draftsOf} and {@link ruleOf}.
 * - `found`: Its place among them, -1 for none.
 *
 * @param boxes - The boxes of a week still free, the earliest first; the one taken goes out of them
 * @param weekday - The weekday, 1 for Monday to 7 for Sunday
 * @param any - Whether to take the earliest when none falls on the weekday
 * @param dayOf - Gives the day of a box at its place in its series, like `2026-10-19`
 * @returns The box, `undefined` for none
 */
function weekTake<T>(boxes: T[], weekday: number, any: boolean, dayOf: (box: T) => string): T | undefined {
    let found: number = boxes.findIndex((box: T): boolean => weekdayOf(dayOf(box)) === weekday);
    if (found === -1 && any && boxes.length > 0)
        found = 0;
    return found === -1 ? undefined : boxes.splice(found, 1)[0];
}

/**
 * Gives the times of what a rule is read back from, as a slot or an extra has them, see {@link Slot}.
 *
 * @param item - A box or a session
 * @returns Its start and its end in Berlin time, like `14:00` and `16:00`, both empty without time
 */
function timesOf(item: Dated): [string, string] {
    return item.time === "" ? ["", ""] : [berlinTimeOf(new Date(item.time)),
        berlinTimeOf(new Date(Date.parse(item.time) + (item.minutes ?? 0) * 60 * 1000))];
}

/**
 * Reads back the weekly rule of a series or a group, see the top of this file: its slots, each weekday at least two
 * of what it follows fall on, else the one most of them fall on, with the time and length most of them have there;
 * the place, what they do online and the people most of them have, the earliest of those equally many; its weeks,
 * from the first box on the weekday of a slot to the last, a box on another day of a week taking the place
 * of a missing one, like a lecture moved once from Monday to Tuesday; the days of its slots in its weeks without a box;
 * and every other box as an extra, one more in a week, like a session on a Saturday, or one outside its weeks,
 * like a repetition in March.
 * - `counts`: How many of what it follows fall on each weekday.
 * - `weekdays`: The weekdays of its slots, in order.
 * - `timed`: Of a slot the one whose time and length most of it have, `undefined` while none has a time.
 * - `placed`: The one whose place most of them have.
 * - `met`: The one whose platform, link and passcode online most of them have.
 * - `people`: The one whose people most of them have.
 * - `sorted`: All, by their days.
 * - `onSlots`: The days of those on the weekday of a slot, in order, else of all.
 * - `from`, `to`: The first and the last of them.
 * - `days`: The days of its weeks, those on a slot and those taking the place of a missing one.
 * - `extras`: The extras, those outside its weeks first.
 * - `excepts`: The days of its slots without a box.
 * - `free`: The boxes of a week no day of a slot took yet, by their days.
 * - `missing`: The days of the slots of a week without a box on their weekday.
 * - `taken`: The box on the weekday of a slot of a week, `undefined` for none.
 *
 * @param type - Type of the series, like `VO`
 * @param items - What the rule follows: the boxes of a series, of my tutorials those of my group, or the sessions
 *   of a group; at least one
 * @param all - What its days come from: every box of the series, also of a week at another group
 * @param group - Its group, like `03`, empty for none
 * @param semester - Its semester, like `2026W`
 * @returns The rule
 */
function ruleOf(type: string, items: Dated[], all: Dated[], group: string, semester: string): Rule {
    const counts: Map<number, number> = new Map();
    items.forEach((item: Dated): void => {
        counts.set(weekdayOf(item.day), (counts.get(weekdayOf(item.day)) ?? 0) + 1);
    });
    let weekdays: number[] = [...counts.keys()].filter((weekday: number): boolean => (counts.get(weekday) ?? 0) >= 2)
        .sort();
    if (weekdays.length === 0)
        weekdays = [weekdayOf(modeOf(items, (item: Dated): string => String(weekdayOf(item.day)))?.day ?? all[0].day)];
    const slots: Slot[] = weekdays.map((weekday: number): Slot => {
        const timed: Dated | undefined = modeOf(items.filter((item: Dated): boolean => item.time !== ""
            && weekdayOf(item.day) === weekday),
        (item: Dated): string => `${berlinTimeOf(new Date(item.time))} ${item.minutes}`);
        const [start, end]: [string, string] = timed === undefined ? ["", ""] : timesOf(timed);
        return { weekday: weekday, start: start, end: end };
    });
    const placed: Dated | undefined = modeOf(items, (item: Dated): string => item.location);
    const met: Dated | undefined = modeOf(items, (item: Dated): string =>
        JSON.stringify([item.online, item.onlineLink, item.passcode]));
    const people: Dated | undefined = modeOf(items, (item: Dated): string => JSON.stringify(item.attendees));
    const sorted: Dated[] = [...all].sort((first: Dated, second: Dated): number =>
        (first.time || first.day).localeCompare(second.time || second.day));
    let onSlots: string[] = sorted.map((item: Dated): string => item.day)
        .filter((day: string): boolean => weekdays.includes(weekdayOf(day)));
    if (onSlots.length === 0)
        onSlots = sorted.map((item: Dated): string => item.day);
    const [from, to]: [string, string] = [onSlots[0], onSlots[onSlots.length - 1]];
    const days: string[] = [];
    const extras: Dated[] = sorted.filter((item: Dated): boolean =>
        mondayOf(item.day) < mondayOf(from) || mondayOf(item.day) > mondayOf(to));
    const excepts: string[] = [];
    for (let week: string = mondayOf(from); week <= to; week = dayAdd(week, 7)) {
        const free: Dated[] = sorted.filter((item: Dated): boolean => mondayOf(item.day) === week);
        const missing: string[] = [];
        slots.map((slot: Slot): string => dayAdd(week, slot.weekday - 1))
            .filter((day: string): boolean => from <= day && day <= to)
            .forEach((day: string): void => {
                const taken: Dated | undefined = weekTake(free, weekdayOf(day), false, (item: Dated): string => item.day);
                if (taken === undefined)
                    missing.push(day);
                else
                    days.push(taken.day);
            });
        days.push(...free.slice(0, missing.length).map((item: Dated): string => item.day));
        extras.push(...free.slice(missing.length));
        excepts.push(...missing.slice(free.length));
    }
    days.sort();
    return {
        type: type,
        slots: slots,
        extras: extras.map((item: Dated): Extra => {
            const [start, end]: [string, string] = timesOf(item);
            return { day: item.day, start: start, end: end };
        }).sort((first: Extra, second: Extra): number => first.day.localeCompare(second.day)),
        location: placed?.location ?? "",
        locationLink: placed?.locationLink ?? "",
        online: met?.online ?? "",
        onlineLink: met?.onlineLink ?? "",
        passcode: met?.passcode ?? "",
        attendees: people?.attendees ?? [],
        first: days[0] ?? from,
        last: days[days.length - 1] ?? to,
        excepts: excepts.sort(),
        group: group,
        semester: semester,
    };
}

/**
 * Gives the dates of a rule, see the top of this file: the day of each of its slots in each week from its first day
 * to its last, but the days it leaves out, and its extras, each with its times and the place of its slot in the rule.
 * - `dates`: The dates so far.
 * - `day`: The day of a slot of a week.
 *
 * @param rule - The rule
 * @returns Dates, by their days
 */
function datesOf(rule: Rule): RuleDate[] {
    const dates: RuleDate[] = rule.extras.map((extra: Extra): RuleDate => ({ ...extra, slot: -1 }));
    for (let week: string = mondayOf(rule.first); week <= rule.last; week = dayAdd(week, 7))
        rule.slots.forEach((slot: Slot, index: number): void => {
            const day: string = dayAdd(week, slot.weekday - 1);
            if (rule.first <= day && day <= rule.last && !rule.excepts.includes(day))
                dates.push({ day: day, start: slot.start, end: slot.end, slot: index });
        });
    return dates.sort((first: RuleDate, second: RuleDate): number =>
        first.day.localeCompare(second.day) || first.start.localeCompare(second.start));
}

/**
 * Gives my group of a type, see the top of this file: the group most of my open boxes of it go to, the earliest
 * of those equally many, else the one most of them went to, like after the last tutorial of a semester; empty
 * while none goes to a group.
 * - `grouped`: The boxes that go to a group.
 * - `open`: Those of them still open.
 *
 * @param boxes - The boxes of a type of a semester, the earliest first
 * @returns The group, like `03`, empty for none
 */
function mineOf(boxes: Box[]): string {
    const grouped: Box[] = boxes.filter((box: Box): boolean => box.group !== "");
    const open: Box[] = grouped.filter((box: Box): boolean => box.state === "open");
    return modeOf(open.length > 0 ? open : grouped, (box: Box): string => box.group)?.group ?? "";
}

/**
 * Stops a module folder of none of my modules, which no course reads or writes.
 *
 * @param module - Name of the folder of the module, like `IN2028_BusinessAnalyticsMachineLearning`
 * @throws {Error} - When `NomSkillingmodules` holds no such module folder
 */
function folderCheck(module: string): void {
    if (!moduleFoldersRead().includes(module))
        throw new Error(`No module folder ${module}`);
}

/**
 * Reads the skill boxes of a module of a semester, see `skillBoxesRead` in `boxes.ts`: those of its semester,
 * a box without one by the semester of its day, read up to a year after the semester begins, so a retake after its end
 * is among them; the earliest first.
 *
 * @param code - Code of the module, like `IN2028`
 * @param semester - Semester, like `2026W`
 * @returns Its boxes
 */
function courseBoxesRead(code: string, semester: string): Box[] {
    return skillBoxesRead(dayAdd(semesterBeginOf(semester), 366))
        .filter((box: Box): boolean => box.module === code
            && (box.semester === "" ? semesterOf(box.day) : box.semester) === semester)
        .sort((first: Box, second: Box): number => (first.time || first.day).localeCompare(second.time || second.day));
}

/**
 * Reads the groups of a module of a semester from the file of its groups, see the top of this file, each with
 * its sessions, read up to a year after the semester begins, and its rule read back from them, see {@link ruleOf};
 * none while the file is missing.
 * - `file`: The file of its groups.
 * - `begin`: The first day of the semester.
 * - `sessions`: The sessions of every group of the semester, each an entry, see `Entry` in `calendar.ts`, the earliest
 *   first.
 * - `own`: The sessions of one group.
 * - `dated`: Them as what its rule is read back from.
 *
 * @param module - Name of the folder of the module, like `IN2028_BusinessAnalyticsMachineLearning`
 * @param semester - Semester, like `2026W`
 * @returns Its groups, by type and group
 */
function groupsRead(module: string, semester: string): Group[] {
    const file: string = skillFileOf(module, groupsEnding);
    const begin: string = semesterBeginOf(semester);
    const sessions: Entry[] = entriesRead([{ folder: dirname(file), ending: basename(file) }],
        berlinDayStartOf(begin), berlinDayStartOf(dayAdd(begin, 366)))
        .filter((entry: Entry): boolean => entry.category === skillName && !entry.allDay
            && (entry.semester === "" ? semesterOf(berlinDateOf(new Date(entry.start))) : entry.semester) === semester)
        .sort((first: Entry, second: Entry): number => first.start.localeCompare(second.start));
    return [...new Set(sessions.map((entry: Entry): string => entry.id))].map((id: string): Group => {
        const own: Entry[] = sessions.filter((entry: Entry): boolean => entry.id === id);
        const dated: Dated[] = own.map((entry: Entry): Dated => ({
            day: berlinDateOf(new Date(entry.start)), time: entry.start,
            minutes: (Date.parse(entry.end) - Date.parse(entry.start)) / (60 * 1000), location: entry.location,
            locationLink: entry.locationLink, online: entry.online, onlineLink: entry.onlineLink, passcode: entry.passcode,
            attendees: entry.attendees,
        }));
        return {
            id: id,
            rule: ruleOf(own[0].type, dated, dated, own[0].group, semester),
            sessions: dated.map((item: Dated): Session => ({ start: item.time, minutes: item.minutes ?? 0 })),
        };
    }).sort((first: Group, second: Group): number => first.rule.type.localeCompare(second.rule.type)
        || first.rule.group.localeCompare(second.rule.group, undefined, { numeric: true }));
}

/**
 * Reads back the series of a module from its boxes of a semester, see the top of this file: one per numbered type
 * with boxes, see `numberedTypes` in `boxes.ts`, its rule read back from all its boxes, or from those of my group
 * while they go to groups, see {@link mineOf}; each with how many boxes it has.
 * - `typed`: The boxes of a type.
 * - `mine`: My group of the type, empty for none.
 * - `own`: The boxes the rule follows.
 *
 * @param boxes - Its boxes of the semester, the earliest first
 * @param semester - Semester, like `2026W`
 * @returns Its series, in the order of the types
 */
function seriesListOf(boxes: Box[], semester: string): Series[] {
    return numberedTypes.flatMap((type: string): Series[] => {
        const typed: Box[] = boxes.filter((box: Box): boolean => box.type === type);
        const mine: string = mineOf(typed);
        const own: Box[] = typed.filter((box: Box): boolean => mine === "" || box.group === mine);
        return typed.length === 0 ? []
            : [{ rule: ruleOf(type, own.map(datedOf), typed.map(datedOf), mine, semester), count: typed.length }];
    });
}

/**
 * Reads the course of a module in a semester, the semester of today unless named, like that of a box of the plan
 * whose series opens from the day, see the top of this file and {@link Course}.
 * - `folder`: Name of the folder of the module.
 * - `semester`: The semester.
 * - `boxes`: Its skill boxes of the semester.
 *
 * @param module - Name of the folder of the module, like `IN2028_BusinessAnalyticsMachineLearning`, or its code,
 *   like `IN2028`, as a box of the plan names it
 * @param named - Semester, like `2026W`, empty for that of today in Berlin time
 * @returns Its course
 * @throws {Error} - When `NomSkillingmodules` holds no such module folder, or the semester is not written
 *   like `2026W`
 */
export function courseRead(module: string, named: string): Course {
    const folder: string = moduleFolderOf(codeOf(module)) ?? module;
    folderCheck(folder);
    const semester: string = named === "" ? semesterOf(berlinDateOf(new Date())) : named;
    if (!/^\d{4}[WS]$/.test(semester))
        throw new Error(`No semester ${semester}`);
    const boxes: Box[] = courseBoxesRead(codeOf(folder), semester);
    return {
        module: folder,
        semester: semester,
        boxes: boxes,
        series: seriesListOf(boxes, semester),
        groups: groupsRead(folder, semester),
        folders: semesterFoldersRead(folder, semester),
        file: relative(calendarRoot, skillFileOf(folder, planEnding)).split(sep).join("/"),
    };
}

/**
 * Tells whether the weeks of a rule are well formed, see {@link Rule}: slots on different weekdays, each with a start
 * before its end, its first day on or before its last, at most {@link ruleWeeks} weeks apart, its days and the days
 * it leaves out written like `2026-10-19`, and its extras, each a day with a start before its end, at most
 * {@link ruleWeeks} weeks from its first day, so a slip of a year typed makes no box far away.
 * - `day`, `time`: A day and a time well written.
 * - `timesRight`: Whether a start lies before its end, both well written.
 * - `near`: Whether a day lies at most {@link ruleWeeks} weeks from the first day.
 *
 * @param rule - The rule as sent
 * @returns Whether they are
 */
function weeksRight(rule: Rule): boolean {
    const day: RegExp = /^\d{4}-\d{2}-\d{2}$/;
    const time: RegExp = /^([01]\d|2[0-3]):[0-5]\d$/;
    const timesRight: (times: Extra | Slot) => boolean = (times: Extra | Slot): boolean => time.test(times.start)
        && time.test(times.end) && minutesOf(times.start) < minutesOf(times.end);
    const near: (other: string) => boolean = (other: string): boolean =>
        Math.abs(Date.parse(other) - Date.parse(rule.first)) <= ruleWeeks * weekLength;
    return Array.isArray(rule.extras) && rule.slots.length > 0 && rule.slots.every((slot: Slot): boolean =>
            Number.isInteger(slot.weekday)
            && slot.weekday >= 1 && slot.weekday <= 7 && timesRight(slot))
        && new Set(rule.slots.map((slot: Slot): number => slot.weekday)).size === rule.slots.length
        && day.test(rule.first) && day.test(rule.last) && rule.first <= rule.last && near(rule.last)
        && rule.excepts.every((except: string): boolean => day.test(except))
        && rule.extras.every((extra: Extra): boolean => day.test(extra.day) && near(extra.day) && timesRight(extra));
}

/**
 * Stops a rule not well formed, see {@link Rule}: of a numbered type, see `numberedTypes` in `boxes.ts`, its weeks
 * well formed, see {@link weeksRight}, a semester like `2026W`, well-formed people, see `attendeesAllow`
 * in `categories.ts`, and a group without spaces or empty.
 *
 * @param rule - The rule as sent
 * @throws {Error} - When it is not well formed
 */
function ruleCheck(rule: Rule): void {
    if (!numberedTypes.includes(rule.type) || !weeksRight(rule) || !/^\d{4}[WS]$/.test(rule.semester)
        || !attendeesAllow(rule.attendees) || !/^[\w-]*$/.test(rule.group))
        throw new Error(`No rule of a series: ${JSON.stringify(rule)}`);
}

/**
 * Tells whether a change of a series may change or remove a box, see the top of this file: a to-do of the new system,
 * no date of a series of the file, never pushed, open or cancelled by the university; never one done, which the log
 * points to, nor one I cancelled or pushed, which are my own decisions.
 *
 * @param box - The box
 * @returns Whether a change may change or remove it
 */
function changeable(box: Box): boolean {
    return box.editable && box.todo && !box.series && box.pushed.length === 0
        && (box.state === "open" || box.state === "university");
}

/**
 * Tells whether I may give a box another state in the form of its series, see `states` of {@link SeriesChange}:
 * a to-do of the new system, no date of a series of the file, neither done, which the log decides, nor pushed away
 * from a day, as it shows on that day.
 *
 * @param box - The box
 * @returns Whether I may
 */
function stateable(box: Box): boolean {
    return box.editable && box.todo && !box.series && box.state !== "done" && box.state !== "pushed";
}

/**
 * Gives a box with the state I gave it in the form of its series, see `states` of {@link SeriesChange}, as a change
 * of the series then plans it, see {@link draftsOf}: skipped, it keeps its number and its place; cancelled by the
 * university, its number is `NONE`; open again, it takes its number anew, see {@link numbersOf}.
 * A box I may give no state, see {@link stateable}, and a state I may not give stay as they are.
 *
 * @param box - The box as it stands
 * @param state - The state I gave it, `undefined` for none
 * @returns The box with its state
 */
function stateSet(box: Box, state: BoxState | undefined): Box {
    if (state === undefined || state === box.state || !stateable(box) || !["open", "dropped", "university"]
        .includes(state))
        return box;
    let number: string = box.number === "NONE" ? "" : box.number;
    if (state === "university")
        number = "NONE";
    return { ...box, state: state, number: number };
}

/**
 * Tells whether a box lies today or later in Berlin time, the only kind a changed rule moves or removes, see
 * {@link seriesApply}, so a box of a day over stays as it was, open or not.
 *
 * @param box - The box
 * @returns Whether it does
 */
function ahead(box: Box): boolean {
    return box.day >= berlinDateOf(new Date());
}

/**
 * Makes the draft of a box as it stands, see {@link Draft}.
 *
 * @param box - The box
 * @returns Its draft
 */
function draftOf(box: Box): Draft {
    return {
        box: box, day: box.day, time: box.time, minutes: box.minutes, location: box.location,
        locationLink: box.locationLink, online: box.online, onlineLink: box.onlineLink, passcode: box.passcode,
        attendees: box.attendees, group: box.group, picked: box.picked, number: box.number, removed: false,
    };
}

/**
 * Gives the date a session of a group sets the box of its week to, see {@link draftSet}: all of it, its day, its time,
 * its length, the room, what it does online, the tutor and the group, with whether I picked it by hand.
 * - `day`: The day of the session.
 *
 * @param group - The group
 * @param session - Its session
 * @param picked - Whether I picked it by hand for its week, see the top of this file
 * @returns The date
 */
function targetOf(group: Group, session: Session, picked: boolean): Target {
    const day: string = berlinDateOf(new Date(session.start));
    return {
        day: day, start: berlinTimeOf(new Date(session.start)), minutes: session.minutes,
        location: group.rule.location, locationLink: group.rule.locationLink, online: group.rule.online,
        onlineLink: group.rule.onlineLink, passcode: group.rule.passcode, attendees: group.rule.attendees,
        group: group.rule.group, picked: picked, before: weekdayOf(day), fields: allFields, made: true, added: false,
    };
}

/**
 * Sets a draft of a box from the date of the series it takes, see {@link draftsOf}: what changed of it,
 * see {@link Field}, its day, its time with its length, its place with its link, what it does online, its people
 * and its group with whether I picked it by hand;
 * the rest as it was, a time kept at its time of day on a new day, like 14:00 of a lecture moved from Monday
 * to Tuesday.
 * - `day`: Its day after.
 * - `start`: Its time of day after, empty for a box without time.
 *
 * @param draft - The draft of the box
 * @param target - The date it takes
 * @returns The draft as set
 */
function draftSet(draft: Draft, target: Target): Draft {
    const day: string = target.fields.includes("day") ? target.day : draft.day;
    let start: string = draft.time === "" ? "" : berlinTimeOf(new Date(draft.time));
    if (target.fields.includes("time"))
        start = target.start;
    return {
        ...draft,
        day: day,
        time: start === "" ? "" : instantOf(day, start).toISOString(),
        minutes: target.fields.includes("time") ? target.minutes : draft.minutes,
        location: target.fields.includes("location") ? target.location : draft.location,
        locationLink: target.fields.includes("location") ? target.locationLink : draft.locationLink,
        online: target.fields.includes("online") ? target.online : draft.online,
        onlineLink: target.fields.includes("online") ? target.onlineLink : draft.onlineLink,
        passcode: target.fields.includes("online") ? target.passcode : draft.passcode,
        attendees: target.fields.includes("attendees") ? target.attendees : draft.attendees,
        group: target.fields.includes("group") ? target.group : draft.group,
        picked: target.fields.includes("group") ? target.picked : draft.picked,
    };
}

/**
 * Plans a change of a series week by week, see the top of this file, from the first week it reaches to its last:
 * each date of a week takes the box of the week that fell on the weekday of its slot before, see `before`
 * of {@link Target}, else, but for a date added, the earliest box of the week no date took yet, like a lecture moved
 * once to another day;
 * a box a change may not change, see {@link changeable}, stays as it is all the same, so its date gets no new box;
 * a box a change may change takes what changed of its date, see {@link draftSet}; a date without box gets a new one,
 * with all of its date, while it is made, see `made` of {@link Target}; every other box of the week a change may change
 * goes.
 * A box of a week outside those reached stays as it is, but for its number, see {@link numbersOf}.
 * - `drafts`: The drafts so far: every box outside the weeks reached, then the weeks one by one.
 * - `seriesDayOf`: Gives the day of a box at its place in its series, see {@link datedOf}.
 * - `dates`: The dates of a week.
 * - `free`: The boxes of the week no date took yet, the earliest first.
 * - `taken`: The box each date of the week takes, `undefined` for none.
 *
 * @param series - Every box of the series, the earliest first
 * @param targets - The dates of the series after the change, in order
 * @param weeks - Monday of the first and of the last week the change reaches
 * @param touched - Tells whether the change may change a box, like not one of a week I go to another group
 * @returns The drafts of every box of the series, removed ones too, and of the new ones
 */
function draftsOf(series: Box[], targets: Target[], weeks: [string, string], touched: (box: Box) => boolean): Draft[] {
    const [from, to]: [string, string] = weeks;
    const drafts: Draft[] = series.filter((box: Box): boolean => weekOf(box) < from || weekOf(box) > to).map(draftOf);
    const seriesDayOf: (box: Box) => string = (box: Box): string => datedOf(box).day;
    for (let week: string = from; week <= to; week = dayAdd(week, 7)) {
        const dates: Target[] = targets.filter((target: Target): boolean => mondayOf(target.day) === week);
        const free: Box[] = series.filter((box: Box): boolean => weekOf(box) === week);
        const taken: (Box | undefined)[] = dates.map((target: Target): Box | undefined =>
            weekTake(free, target.before, false, seriesDayOf));
        dates.forEach((target: Target, index: number): void => {
            if (!target.added)
                taken[index] ??= weekTake(free, target.before, true, seriesDayOf);
        });
        dates.forEach((target: Target, index: number): void => {
            const box: Box | undefined = taken[index];
            if (box === undefined && target.made)
                drafts.push({
                    box: null, day: target.day, time: target.start === "" ? ""
                        : instantOf(target.day, target.start).toISOString(), minutes: target.minutes,
                    location: target.location, locationLink: target.locationLink, online: target.online,
                    onlineLink: target.onlineLink, passcode: target.passcode, attendees: target.attendees,
                    group: target.group, picked: target.picked, number: "", removed: false,
                });
            else if (box !== undefined)
                drafts.push(touched(box) ? draftSet(draftOf(box), target) : draftOf(box));
        });
        drafts.push(...free.map((box: Box): Draft => ({ ...draftOf(box), removed: touched(box) })));
    }
    return drafts;
}

/**
 * Numbers the boxes of a type of a semester after a change, see the top of this file, the way `boxUniversity`
 * in `boxes.ts` keeps them: by their places in the series, see {@link datedOf}, each box one more than the box before
 * it, a new one, one done, one I skipped and one I pushed alike, so no number stands twice, like a Thursday added
 * before a Monday I skipped; only its number changes, never its state, day or time; one the university cancelled keeps
 * `NONE` and counts not; one of another app or one date of a series of a file, which the dashboard does not number,
 * keeps its number, the next going on from it.
 * - `placeOf`: Gives the place of a draft in the series: where its box stood before its first push, else its time,
 *   or its day for a box without time, after the change.
 * - `last`: The number of the box before.
 *
 * @param drafts - The drafts of every box of the type, see {@link draftsOf}, numbered in place
 */
function numbersOf(drafts: Draft[]): void {
    const placeOf: (draft: Draft) => string = (draft: Draft): string => {
        const left: Push | undefined = draft.box?.pushed[0];
        return left === undefined ? draft.time || draft.day : left.time || left.day;
    };
    let last: number = 0;
    drafts.filter((draft: Draft): boolean => !draft.removed)
        .sort((first: Draft, second: Draft): number => placeOf(first).localeCompare(placeOf(second)))
        .forEach((draft: Draft): void => {
            if (draft.number === "NONE")
                return;
            if (draft.box !== null && !(draft.box.editable && draft.box.todo && !draft.box.series)) {
                last = /^\d+$/.test(draft.number) ? Number(draft.number) : last;
                return;
            }
            last += 1;
            draft.number = String(last);
        });
}

/**
 * Tells whether a draft of a box that stays sets its day, its time, its length, its place, what it does online
 * or its people anew.
 *
 * @param draft - The draft of a box that stays
 * @param box - The box as it stands
 * @returns Whether one of them changes
 */
function draftMoved(draft: Draft, box: Box): boolean {
    return draft.day !== box.day || draft.time !== box.time || draft.minutes !== box.minutes
        || draft.location !== box.location || draft.locationLink !== box.locationLink || draft.online !== box.online
        || draft.onlineLink !== box.onlineLink || draft.passcode !== box.passcode
        || JSON.stringify(draft.attendees) !== JSON.stringify(box.attendees);
}

/**
 * Writes a change of a series as planned, see {@link draftsOf}, into the plan of the module, every other line of it
 * as it is: a box removed goes, see `boxDelete` in `boxes.ts`; a new one is a to-do as the dialog adds one, see
 * `todoAppend` in `calendar.ts`, what it is written as the folder of the module with its type in brackets, linking
 * the folder of its material, see `titleOf` in `documents.ts`, with its place, its people, its `X-NUMBER`, its
 * `X-GROUP` while it goes to a group, `X-PICKED:TRUE` while I picked it by hand, and its `X-SEMESTER`; of a box that
 * stays only what changed against its file: skipped or open again, see `boxDrop` in `boxes.ts`, its day, its time
 * and its place as the dialog changes them, see `todoChange` in `calendar.ts`, its number, `NONE` once the university
 * cancelled it, its group and whether I picked it in their lines.
 * - `file`: The plan of the module.
 * - `stands`: A box that stays as its file holds it now.
 * - `code`: The code of the module, like `IN2028`.
 * - `title`, `titleLink`: What a new box is, its `SUMMARY` and the `ALTREP` of it, the same for all.
 *
 * @param module - Name of the folder of the module, like `IN2028_BusinessAnalyticsMachineLearning`
 * @param type - Type of the boxes, like `TU`
 * @param semester - Their semester, like `2026W`
 * @param drafts - The drafts of the boxes, see {@link draftsOf}
 * @throws {Error} - When a box cannot be found or written, like one done meanwhile
 */
function draftsWrite(module: string, type: string, semester: string, drafts: Draft[]): void {
    const file: string = skillFileOf(module, planEnding);
    const code: string = codeOf(module);
    const [title, titleLink]: [string, string] =
        titleOf({ category: skillName, title: "", module: code, type: type, semester: semester }, null);
    drafts.forEach((draft: Draft): void => {
        const box: Box | null = draft.box;
        if (box === null) {
            const id: string = todoAppend(file, {
                category: skillName, title: title, titleLink: titleLink, location: draft.location,
                locationLink: draft.locationLink, online: draft.online, onlineLink: draft.onlineLink,
                passcode: draft.passcode, from: "", attendees: draft.attendees, module: code, type: type,
                semester: semester, note: "", day: draft.day, time: draft.time === "" ? null : new Date(draft.time),
                minutes: draft.minutes, deadline: "",
            });
            propertiesPut(file, id, [
                ["x-number", [draft.number]],
                ["x-group", draft.group === "" ? [] : [draft.group]],
                ["x-picked", draft.picked ? ["TRUE"] : []],
            ]);
            return;
        }
        if (draft.removed) {
            boxDelete(box.id);
            return;
        }
        const [boxFile, entry, stands]: [string, Entry, Box] = boxFind(box.id);
        if ((box.state === "dropped") !== (stands.state === "dropped"))
            boxDrop(box.id, box.state === "dropped");
        if (draftMoved(draft, box))
            todoChange(boxFile, entry, {
                ...entry, location: draft.location, locationLink: draft.locationLink, online: draft.online,
                onlineLink: draft.onlineLink, passcode: draft.passcode, attendees: draft.attendees,
                day: draft.day, time: draft.time === "" ? null : new Date(draft.time), minutes: draft.minutes,
            }, boxFile);
        if (draft.number !== stands.number || draft.group !== stands.group || draft.picked !== stands.picked)
            propertiesPut(boxFile, box.id, [
                ["x-number", draft.number === "" ? [] : [draft.number]],
                ["x-group", draft.group === "" ? [] : [draft.group]],
                ["x-picked", draft.picked ? ["TRUE"] : []],
            ]);
    });
}

/**
 * Gives the boxes of a series as planned, see {@link draftsOf}, for the preview of the form: each with its day,
 * its times and its number after the change, its state, whether I pushed it and may give it another state, and whether
 * the change adds, changes, renumbers or removes it.
 * - `change`: What the change does to a box.
 *
 * @param drafts - The drafts of every box of the series, numbered, see {@link numbersOf}
 * @returns The boxes, removed ones too, by their days
 */
function plannedOf(drafts: Draft[]): Planned[] {
    return drafts.map((draft: Draft): Planned => {
        let change: Planned["change"] = "";
        if (draft.box === null)
            change = "new";
        else if (draft.removed)
            change = "removed";
        else if (draftMoved(draft, draft.box))
            change = "changed";
        else if (draft.number !== draft.box.number || draft.group !== draft.box.group
            || draft.picked !== draft.box.picked)
            change = "renumbered";
        return {
            id: draft.box?.id ?? "", day: draft.day, time: draft.time, minutes: draft.minutes, number: draft.number,
            state: draft.box?.state ?? "new", pushed: (draft.box?.pushed.length ?? 0) > 0,
            editable: draft.box === null || stateable(draft.box), change: change,
        };
    }).sort((first: Planned, second: Planned): number =>
        (first.time || first.day).localeCompare(second.time || second.day));
}

/**
 * Tells what of a date of a rule changed against the slot or the extra whose boxes it takes in the rule as read back
 * when the form opened, which then goes into every box it takes, see {@link draftSet}: its weekday, its time, and what
 * changed of the whole rule, its place, what it does online or its people; all of it for a slot or an extra added.
 * - `changed`: Each field with whether it changed.
 *
 * @param before - The slot or the extra as read back, `undefined` for one added
 * @param date - The slot or the extra as typed
 * @param shared - What changed of the whole rule, its place, what it does online or its people
 * @returns What changed
 */
function slotFieldsOf(before: Slot | Extra | undefined, date: Slot | Extra, shared: Field[]): Field[] {
    if (before === undefined)
        return ["day", "time", "location", "online", "attendees"];
    const changed: [Field, boolean][] = [
        ["day", "weekday" in before && "weekday" in date && before.weekday !== date.weekday],
        ["time", before.start !== date.start || before.end !== date.end],
    ];
    return [...changed.filter(([, differs]: [Field, boolean]): boolean => differs)
        .map(([field]: [Field, boolean]): Field => field), ...shared];
}

/**
 * Changes a series by its rule, as typed in its form, see the top of this file, or only tells what that would make,
 * for the preview of the form: first each box takes the state I gave it, see {@link stateSet}; then each date
 * of the rule takes the box of its week of the slot it takes the boxes of, see `before` of {@link SeriesChange},
 * an extra the box of its day, with what changed of its slot or its extra, see {@link slotFieldsOf}, all of it for a new
 * series or a slot or an extra added; a date without box gets one, for a series that has boxes only from today on;
 * a box no date takes goes, but only an open one from today on, see {@link ahead}, every other box staying, see
 * {@link changeable}, and so does that of a week I go to another group; then the boxes of the type are numbered anew,
 * see {@link numbersOf}.
 * A new box goes to my group while my tutorials go to groups, and takes the place of the rule with its link,
 * see `placeLinkOf` in `places.ts`, and what the rule does online, see `onlineFor` there.
 * - `rule`, `old`: The rule as typed and as read back.
 * - `today`: Today in Berlin time.
 * - `typed`: The boxes of its type of its semester, each with the state I gave it.
 * - `mine`: My group of the type, see {@link mineOf}, empty for none.
 * - `link`: The link of the place of the rule.
 * - `online`: What the rule does online, as written.
 * - `changed`: Each field of the whole rule, its place, what it does online and its people, with whether it changed.
 * - `shared`: Those of them that changed.
 * - `wasOf`: Gives the slot or the extra of the rule as read back whose boxes a date takes, `undefined` for none.
 * - `targets`: The dates of the rule.
 * - `weeks`: The weeks the change reaches, from the first of the rule or the series to the last of either.
 * - `drafts`: The boxes of the type as planned.
 *
 * @param change - The change as the form sends it
 * @returns The boxes of the series after the change, removed ones too, by their times
 * @throws {Error} - When there is no such module folder, the rule is not well formed, the link online is no
 *   web address, or a box cannot be written
 */
export function seriesApply(change: SeriesChange): Planned[] {
    folderCheck(change.module);
    ruleCheck(change.rule);
    const rule: Rule = change.rule;
    const old: Rule | null = change.old;
    const today: string = berlinDateOf(new Date());
    const typed: Box[] = courseBoxesRead(codeOf(change.module), rule.semester)
        .filter((box: Box): boolean => box.type === rule.type)
        .map((box: Box): Box => stateSet(box, change.states?.[box.id]));
    const mine: string = mineOf(typed);
    const link: string = placeLinkOf(rule.location, old);
    const online: Online = onlineFor(rule, null);
    const changed: [Field, boolean][] = old === null ? [] : [
        ["location", old.location !== rule.location],
        ["online", old.online !== online.online || old.onlineLink !== online.onlineLink
            || old.passcode !== online.passcode],
        ["attendees", JSON.stringify(old.attendees) !== JSON.stringify(rule.attendees)],
    ];
    const shared: Field[] = changed.filter(([, differs]: [Field, boolean]): boolean => differs)
        .map(([field]: [Field, boolean]): Field => field);
    const wasOf: (date: RuleDate) => Slot | Extra | undefined = (date: RuleDate): Slot | Extra | undefined =>
        date.slot === -1 ? old?.extras.find((extra: Extra): boolean => extra.day === date.day)
            : old?.slots.find((slot: Slot): boolean =>
                slot.weekday === (change.before?.[date.slot] ?? rule.slots[date.slot].weekday));
    const targets: Target[] = datesOf(rule).map((date: RuleDate): Target => {
        const was: Slot | Extra | undefined = wasOf(date);
        return {
            day: date.day, start: date.start, minutes: minutesOf(date.end) - minutesOf(date.start),
            location: rule.location, locationLink: link, ...online, attendees: rule.attendees, group: mine,
            picked: false, before: was !== undefined && "weekday" in was ? was.weekday : weekdayOf(date.day),
            fields: slotFieldsOf(was, date.slot === -1 ? date : rule.slots[date.slot], shared),
            made: old === null || date.day >= today, added: was === undefined,
        };
    });
    const weeks: string[] = [mondayOf(rule.first), mondayOf(rule.last), ...targets.map((target: Target): string =>
        mondayOf(target.day)), ...typed.map(weekOf)].sort();
    const drafts: Draft[] = draftsOf(typed, targets, [weeks[0], weeks[weeks.length - 1]],
        (box: Box): boolean => changeable(box) && ahead(box) && (box.group === "" || box.group === mine));
    numbersOf(drafts);
    if (!change.dry)
        draftsWrite(change.module, rule.type, rule.semester, drafts);
    return plannedOf(drafts);
}

/**
 * Makes a new box of the dialog once per date of its weekly rule, see the top of this file, or only tells what that
 * would make, for the preview of the dialog. A skill box of a numbered type of a module becomes its series as the form
 * of a new series makes it, see {@link seriesApply}, with the place, the people and the semester of the box, so
 * the page of the module shows it as the card of its type, numbered; while its type has a box in that semester,
 * its series is there already, which only the form of that series changes, so nothing is made. Any other box, like
 * one of a project or my gym, is added once per date into the plan it belongs into, as the dialog adds one alone,
 * see `boxesAdd` in `boxes.ts`: its day the date, its time and length those of the slot or the extra of the date,
 * no deadline.
 * - `box`: The box as sent.
 * - `rule`: Its rule, its days with the fields of the box.
 * - `module`: Name of the folder of the module of a skill box of a numbered type, `undefined` for any other box.
 * - `boxes`: The boxes of any other box, one per date.
 *
 * @param change - The box and its days, as the dialog sends them
 * @returns The boxes it makes, by their days; `null` for a series of a type with a box in its semester already
 * @throws {Error} - When the rule or the box is not well formed, the link online is no web address, a document is
 *   none of the module's, or a box cannot be written
 */
export function repeatApply(change: RepeatChange): Planned[] | null {
    const box: RepeatChange["box"] = change.box;
    const rule: Rule = {
        type: box.type, slots: change.slots, extras: change.extras, location: box.location, locationLink: "",
        online: box.online ?? "", onlineLink: box.onlineLink ?? "", passcode: box.passcode ?? "",
        attendees: box.attendees ?? [], first: change.first, last: change.last, excepts: change.excepts, group: "",
        semester: box.semester,
    };
    const module: string | undefined = box.category === skillName && numberedTypes.includes(box.type)
        ? moduleFolderOf(box.module) : undefined;
    if (module !== undefined)
        return courseBoxesRead(box.module, box.semester).some((one: Box): boolean => one.type === box.type) ? null
            : seriesApply({ module: module, rule: rule, old: null, dry: change.dry });
    if (!weeksRight(rule))
        throw new Error(`No days of a box: ${JSON.stringify(rule)}`);
    const boxes: BoxNew[] = datesOf(rule).map((date: RuleDate): BoxNew => ({
        ...box, day: date.day, time: instantOf(date.day, date.start).toISOString(),
        minutes: minutesOf(date.end) - minutesOf(date.start), deadline: "",
    }));
    boxesAdd(boxes, change.dry);
    return boxes.map((one: BoxNew): Planned => ({
        id: "", day: one.day, time: one.time, minutes: one.minutes, number: "", state: "new", pushed: false,
        editable: true, change: "new",
    }));
}

/**
 * Makes a group mine, see the top of this file, or only tells what that would make, for the preview of the form:
 * from the week of its next session that is not over on, the boxes of its type go to its sessions, its day, time,
 * length, room, tutor and group, also the box of a week I went to another group or picked by hand, so the series
 * follows the group from then on, a session without box getting one, a box of a week it does not meet going, but every
 * box a change may not change staying, see {@link changeable}; a week before stays as it is, like this week's box at another group
 * while the group meets only from next week on. With no series yet, its sessions to come become one. Then the boxes
 * of the type are numbered anew, see {@link numbersOf}, from 1 for a new series.
 * - `semester`: The semester of today.
 * - `group`: The group, `undefined` for none.
 * - `now`: Now in milliseconds.
 * - `coming`: Its sessions not over.
 * - `typed`: The boxes of its type of the semester.
 * - `from`: Monday of the week of its next session.
 * - `targets`: Its sessions not over, as the dates of the series.
 * - `weeks`: The weeks of the group and of the boxes from that week on.
 * - `drafts`: The boxes of the type as planned.
 *
 * @param change - The group, as the page sends it
 * @returns The boxes of the series after the change, removed ones too, by their days
 * @throws {Error} - When there is no such module folder or group, the group meets no more, or a box cannot be written
 */
export function groupMine(change: MineChange): Planned[] {
    folderCheck(change.module);
    const semester: string = semesterOf(berlinDateOf(new Date()));
    const group: Group | undefined = groupsRead(change.module, semester)
        .find((one: Group): boolean => one.rule.type === change.type && one.rule.group === change.group);
    const now: number = Date.now();
    const coming: Session[] = (group?.sessions ?? [])
        .filter((session: Session): boolean => Date.parse(session.start) + session.minutes * 60 * 1000 > now);
    if (group === undefined || coming.length === 0)
        throw new Error(`No group ${change.type} ${change.group} with sessions to come in ${change.module}`);
    const typed: Box[] = courseBoxesRead(codeOf(change.module), semester)
        .filter((box: Box): boolean => box.type === change.type);
    const from: string = mondayOf(berlinDateOf(new Date(coming[0].start)));
    const targets: Target[] = coming.map((session: Session): Target => targetOf(group, session, false));
    const weeks: string[] = [...targets.map((target: Target): string => mondayOf(target.day)), ...typed.map(weekOf)]
        .filter((week: string): boolean => week >= from).sort();
    const drafts: Draft[] = draftsOf(typed, targets, [from, weeks[weeks.length - 1]], changeable);
    numbersOf(drafts);
    if (change.dry !== true)
        draftsWrite(change.module, change.type, semester, drafts);
    return plannedOf(drafts);
}

/**
 * Moves one week's box to the session of another group in its week, see the top of this file: its day, its time,
 * its length, its room, its tutor and its group, its number kept, picked by hand; moved to my group, it is back.
 * - `box`: The box.
 * - `module`: Name of the folder of its module, `undefined` for none.
 * - `semester`: Its semester.
 * - `group`: The group, `undefined` for none.
 * - `session`: The session of the group in the week of the box, `undefined` for none.
 *
 * @param change - The box and the group, as the page sends them
 * @throws {Error} - When there is no such box, it is not open or may not change, see {@link changeable},
 *   or there is no such group, or it does not meet in that week
 */
export function weekMove(change: WeekChange): void {
    const [, , box]: [string, Entry, Box] = boxFind(change.box);
    const module: string | undefined = moduleFolderOf(box.module);
    if (module === undefined || box.category !== skillName || box.state !== "open" || !changeable(box))
        throw new Error(`${box.title} is no open box to move to a group`);
    const semester: string = box.semester === "" ? semesterOf(box.day) : box.semester;
    const group: Group | undefined = groupsRead(module, semester)
        .find((one: Group): boolean => one.rule.type === box.type && one.rule.group === change.group);
    const session: Session | undefined = group?.sessions.find((one: Session): boolean =>
        mondayOf(berlinDateOf(new Date(one.start))) === mondayOf(box.day));
    if (group === undefined || session === undefined)
        throw new Error(`No session of group ${change.group} in the week of ${box.day}`);
    draftsWrite(module, box.type, semester, [draftSet(draftOf(box), targetOf(group, session, true))]);
}

/**
 * Picks one session of a group for its week, as the card of its type sends it, see the top of this file: a box I skipped
 * that week is open again, one a change may change, see {@link changeable}; then the open box of the week goes
 * to the session, its day, its time, its length, its room,
 * its tutor and its group, picked by hand, its number kept. A week without box gets one, picked by hand, and with
 * no box of the type after that week the sessions of the group from that week on become my series, one per week,
 * so later weeks follow it; then the boxes of the type are numbered anew, see {@link numbersOf}.
 * A week done, or whose box may not change, see {@link changeable}, stays as it is.
 * - `semester`: The semester of the session.
 * - `group`, `session`: The group and its session, `undefined` for none.
 * - `week`: Monday of the week of the session.
 * - `weekOfSession`: Gives the Monday of the week of a session.
 * - `typedRead`: Reads the boxes of the type of the semester.
 * - `typed`: The boxes of the type of the semester.
 * - `skipped`: The box of the week I skipped, `undefined` for none.
 * - `box`: The open box of the week a change may change, `undefined` for none.
 * - `later`: Whether a box of the type falls after the week.
 * - `firsts`: Without later box the first session of the group of every later week, else none.
 * - `targets`: The dates: the session, then those of the later weeks.
 * - `drafts`: The boxes of the type as planned.
 *
 * @param change - The session, as the page sends it
 * @throws {Error} - When there is no such module folder, group or session, the week is done or its box may not change,
 *   or a box cannot be written
 */
export function weekPick(change: PickChange): void {
    folderCheck(change.module);
    const semester: string = semesterOf(berlinDateOf(new Date(change.start)));
    const group: Group | undefined = groupsRead(change.module, semester)
        .find((one: Group): boolean => one.rule.type === change.type && one.rule.group === change.group);
    const session: Session | undefined = group?.sessions
        .find((one: Session): boolean => Date.parse(one.start) === Date.parse(change.start));
    if (group === undefined || session === undefined)
        throw new Error(`No session of group ${change.type} ${change.group} at ${change.start} in ${change.module}`);
    const weekOfSession: (one: Session) => string = (one: Session): string => mondayOf(berlinDateOf(new Date(one.start)));
    const week: string = weekOfSession(session);
    const typedRead: () => Box[] = (): Box[] => courseBoxesRead(codeOf(change.module), semester)
        .filter((one: Box): boolean => one.type === change.type);
    let typed: Box[] = typedRead();
    const skipped: Box | undefined = typed.find((one: Box): boolean => weekOf(one) === week && one.state === "dropped"
        && changeable({ ...one, state: "open" }));
    if (skipped !== undefined) {
        boxDrop(skipped.id, false);
        typed = typedRead();
    }
    const box: Box | undefined = typed.find((one: Box): boolean => weekOf(one) === week && changeable(one)
        && one.state === "open");
    if (box !== undefined) {
        draftsWrite(change.module, change.type, semester, [draftSet(draftOf(box), targetOf(group, session, true))]);
        return;
    }
    if (typed.some((one: Box): boolean => weekOf(one) === week))
        throw new Error(`The ${change.type} of ${change.module} in the week of ${week} is done or may not change`);
    const later: boolean = typed.some((one: Box): boolean => weekOf(one) > week);
    const firsts: Session[] = later ? [] : group.sessions.filter((one: Session, index: number): boolean =>
        weekOfSession(one) > week && group.sessions
            .findIndex((other: Session): boolean => weekOfSession(other) === weekOfSession(one)) === index);
    const targets: Target[] = [targetOf(group, session, true),
        ...firsts.map((one: Session): Target => targetOf(group, one, false))];
    const drafts: Draft[] = draftsOf(typed, targets,
        [week, mondayOf(targets[targets.length - 1].day)], (): boolean => false);
    numbersOf(drafts);
    draftsWrite(change.module, change.type, semester, drafts);
}

/**
 * Lets the later weeks follow the group of a tutorial I logged, see the top of this file, so a week I pick nothing
 * finds me where I was last time: every open box of its type after its week that goes to another group, a change may
 * change, see {@link changeable}, and I did not pick by hand goes to the session of that group in its week, its day,
 * its time, its length, its room, its tutor and its group, its number kept; a week the group does not meet stays.
 * Only the last tutorial logged leads, so one logged late, before a later one done, moves nothing. It never fails
 * the log it follows: what it cannot move stays, and the console says why.
 * - `box`: The box logged.
 * - `module`: Name of the folder of its module, `undefined` for none.
 * - `semester`: Its semester.
 * - `group`: Its group, `undefined` for none.
 * - `week`: Monday of its week in its series, see {@link weekOf}.
 * - `typed`: The boxes of its type of the semester.
 * - `drafts`: The later boxes moved to the group.
 *
 * @param id - Identifier of the box logged, like `c6ca13a7-…@nomsystem`
 */
export function groupFollow(id: string): void {
    try {
        const [, , box]: [string, Entry, Box] = boxFind(id);
        const module: string | undefined = moduleFolderOf(box.module);
        if (module === undefined || box.category !== skillName || box.group === "" || box.state !== "done")
            return;
        const semester: string = box.semester === "" ? semesterOf(box.day) : box.semester;
        const group: Group | undefined = groupsRead(module, semester)
            .find((one: Group): boolean => one.rule.type === box.type && one.rule.group === box.group);
        const week: string = weekOf(box);
        const typed: Box[] = courseBoxesRead(codeOf(module), semester)
            .filter((one: Box): boolean => one.type === box.type);
        if (group === undefined || typed.some((one: Box): boolean => one.state === "done" && weekOf(one) > week))
            return;
        const drafts: Draft[] = typed.filter((one: Box): boolean => weekOf(one) > week && one.state === "open"
            && changeable(one) && !one.picked && one.group !== "" && one.group !== box.group)
            .flatMap((one: Box): Draft[] => {
                const session: Session | undefined = group.sessions
                    .find((own: Session): boolean => mondayOf(berlinDateOf(new Date(own.start))) === weekOf(one));
                return session === undefined ? [] : [draftSet(draftOf(one), targetOf(group, session, false))];
            });
        draftsWrite(module, box.type, semester, drafts);
    } catch (error: unknown) {
        console.error(new Date().toISOString(), "The later tutorials cannot follow", id, error);
    }
}

/**
 * Removes the groups of a type and a group of a semester from the file of the groups of a module, each its event
 * with every line of it; a session of it changed alone, which the dashboard never writes, stays.
 * - `file`: The file of the groups.
 * - `found`: The groups to remove.
 *
 * @param gone - The group, as sent
 * @returns How many were removed
 */
function groupsTake(gone: GroupGone): number {
    const file: string = skillFileOf(gone.module, groupsEnding);
    const found: Group[] = groupsRead(gone.module, gone.semester)
        .filter((group: Group): boolean => group.rule.type === gone.type && group.rule.group === gone.group);
    found.forEach((group: Group): void => entryRemove(file, group.id));
    return found.length;
}

/**
 * Writes a group into the file of the groups of a module, see the top of this file, in place of one of the same type,
 * group and semester: one weekly event of its one slot, its first session as `DTSTART` and `DTEND`,
 * `RRULE:FREQ=WEEKLY;UNTIL=…` with the start of its last session in UTC, like `UNTIL=20270202T090000Z`, one `EXDATE`
 * per week it leaves out, like `EXDATE;TZID=Europe/Berlin:20261110T100000`, what it is as a box of its type is,
 * see `titleOf` in `documents.ts`, its room with its link, see `placeLinkOf` in `places.ts`, what it does online,
 * see `onlineFor` there, its tutor, `X-GROUP` and `X-SEMESTER`; the file made when missing.
 * - `rule`: The rule of the group, without extras, since a group meets weekly, so a group sent without them is right.
 * - `slot`: Its one slot.
 * - `days`: The days of its sessions.
 * - `code`: Code of the module, like `IN2028`.
 * - `title`, `titleLink`: What it is, its `SUMMARY` and the `ALTREP` of it.
 * - `start`: The start of its first session.
 * - `minutes`: The length of each session.
 * - `fields`: Its fields and the times of its first session.
 * - `until`: The start of its last session, in the form of the iCalendar format in UTC.
 * - `left`: The days it leaves out between its first and its last session.
 *
 * @param change - The group with its rule, as sent
 * @returns Identifier of the group written
 * @throws {Error} - When there is no such module folder, the rule is not well formed, has no group or not one slot,
 *   it holds no session, or the link online is no web address
 */
export function groupPut(change: GroupNew): string {
    folderCheck(change.module);
    const rule: Rule = { ...change.rule, extras: [] };
    ruleCheck(rule);
    const slot: Slot = rule.slots[0];
    const days: string[] = datesOf(rule).map((date: RuleDate): string => date.day);
    if (rule.group === "" || rule.slots.length !== 1 || days.length === 0)
        throw new Error(`No group of sessions: ${JSON.stringify(rule)}`);
    const code: string = codeOf(change.module);
    const [title, titleLink]: [string, string] =
        titleOf({ category: skillName, title: "", module: code, type: rule.type, semester: rule.semester }, null);
    const start: Date = instantOf(days[0], slot.start);
    const minutes: number = minutesOf(slot.end) - minutesOf(slot.start);
    const fields: EntryFields = {
        category: skillName, title: title, titleLink: titleLink, location: rule.location,
        locationLink: placeLinkOf(rule.location, null), ...onlineFor(rule, null), from: "", attendees: rule.attendees,
        module: code, type: rule.type, semester: rule.semester, note: "",
        start: start, end: new Date(start.getTime() + minutes * 60 * 1000),
    };
    const until: string = icsTextOf(instantOf(days[days.length - 1], slot.start).toISOString());
    const left: string[] = rule.excepts.filter((day: string): boolean => days[0] < day
        && day < days[days.length - 1] && weekdayOf(day) === slot.weekday);
    groupsTake({ module: change.module, type: rule.type, group: rule.group, semester: rule.semester });
    return entryAppend(skillFileOf(change.module, groupsEnding), fields, [
        ["rrule", `FREQ=WEEKLY;UNTIL=${until}`],
        ...left.map((day: string): [string, Date] => ["exdate", instantOf(day, slot.start)]),
        ["x-group", rule.group],
    ]);
}

/**
 * Removes a group from the file of the groups of a module, see {@link groupsTake}.
 *
 * @param gone - The group, as sent
 * @throws {Error} - When there is no such module folder or group
 */
export function groupRemove(gone: GroupGone): void {
    folderCheck(gone.module);
    if (groupsTake(gone) === 0)
        throw new Error(`No group ${gone.type} ${gone.group} of ${gone.semester} in ${gone.module}`);
}
