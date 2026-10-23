/**
 * ## Boxes
 *
 * The plan of the shown day as a calm list of boxes beside the log, which is my one calendar, see `reader/boxes.ts`:
 * its birthdays and holidays at the top, each looking like a box, with my gift idea for it beside it, when I have one,
 * see `gifts.ts`, then the boxes one after another like the stations of the day, as real as the log:
 * those with an expected time by their time, like my lectures, a cancelled one faded in its place, then those with
 * a deadline, then those without either, like the chapters I learn today, which the reader puts there itself,
 * see `reader/suggestions.ts`, and the cancelled boxes without time last; on today below them the boxes carried along,
 * see below.
 * Every box has the same lines, open or done: its category in bold with a colon and what,
 * like `Skill: IN0004_EinfuehrungRechnerarchitektur (VO)`, as an entry of the log does, on one line, ending in `…`
 * where it is too long; then grey its expected time, its length only where no end shows it, with its place after them,
 * by its label alone, like `11:30 – 13:00 · Audimax im Galileo` or `01h 00m · Home Munich`, the place opening its link
 * on a click when it has one; then its deadline, when it has one, see below; then its chapters, each opening
 * the overview of its module in the scripts view, like `01_RegressionAnalysis`; then the documents it will use, each on a line of its own with a bullet, by the last
 * part of its path, like `04_LogisticPoissonRegression.pdf`, none for a lecture, whose slides are not known before,
 * and none for a note, like those a box of the chapters due today links, see `reader/suggestions.ts`;
 * a line without anything to say is left out. Every line stays one line, ending in `…` where it is too long,
 * like a long place, so a box keeps its few lines.
 * No line counts the pushes or asks about them: a box goes on as often as I push it, and one I no longer want
 * I skip myself.
 * A box with a deadline shows from four days before it, see `reader/boxes.ts`, until it is done,
 * and on the day of its deadline always, done or not, and looks like every other box, its deadline on a line of its own
 * below its length and place, with how near it is, like `Deadline: Fri, 23.10.2026 · 12:00 · in 3 days`, its day
 * left out on that day itself, like `Deadline: 12:00 · today`, see {@link deadlinePartsOf}; it has no `Move`, since it
 * stays on the day of its deadline. Its sessions are dragged into the log, as many as it needs, and leave it open;
 * `Submit` in its menu ticks it submitted, which alone makes it done, see `reader/boxes.ts`.
 * An open box is dragged into the log at the real time: the reader writes a log entry like it, pointing to it,
 * as long as its expected duration, else half an hour, and I resize the entry when it lasted otherwise.
 * An open box shows `⋯` at its right, not only under the pointer, whose menu holds all it can do: first
 * `Log`, which logs it as expected with one tap, from its expected time, else ending now, see `times.ts`, then like skip,
 * see below; nothing stands at its left, so its lines start at the edge of the card, as those of every box do;
 * when the reader does not log a box dropped or tapped, a hint says so above the list until it loads again.
 * A box no longer open shows in that place one small grey icon for its state, the one of what made it in the menu,
 * like the cross for `Skip`, see {@link stateOf}, and a click on it takes that back, so everything undoes with
 * one click: a logged box goes back to open, its log entry removed unless that holds what I added since,
 * see `boxUndo` in `entries.ts`.
 * A done box keeps exactly the lines it had open, only greyed with its check; its real time and length
 * the log shows. An open box is as bright on a day that is over as on today, so a day before looks like today.
 * An open box that can be changed is skipped, cancelled, with `Skip`, or pushed to the next day,
 * one whose day is over to tomorrow, with `Move`, both in the menu of its `⋯`; a skipped box stays in its file,
 * see `reader/boxes.ts`, and shows greyed, never struck through, at the end of the list, where its cross
 * takes it back.
 * A pushed box stays greyed on each day it left, once per push, with the start and the length it had there,
 * see `leftBoxesOf` in `reader/boxes.ts`; a click on its lines leads to the day it stands on now, and the arrow
 * of the last of them takes that push back. Skipped, cancelled by the university and pushed look and work alike,
 * greyed with their icon, and none of them is carried along.
 * A box neither done nor cancelled stays on its day once that is over and is carried
 * along on today: below the list of today, under `Carried along`, each with its day, like `Mon, 12.10.2026 · 00h 45m`,
 * the earliest first, see `boxesCarried` in `reader/boxes.ts`, until I do it, dragged into the log or as expected,
 * cancel it with `Skip`, or push it with `Move`, there and on its own day alike, which takes it to tomorrow,
 * the day after today, not the day after its own, see `boxPush` in `reader/boxes.ts`; a click on it changes it,
 * like its day. It never moves into the next days by itself.
 * `+` beside the name of the plan opens the entry by category for a new box of the shown day; a click on a box changes it,
 * see `categories.ts`. A box without category, like a to-do another app wrote into the plan, opens the entry
 * by category of the log instead of being logged at once, when it is dropped or logged as expected, since the log needs
 * a category; a box that cannot be changed, like an occurrence of a weekly lecture, is logged like any other,
 * and opens the entry by category of the log when clicked.
 * The list loads again when the shown day or its log changes, since a box is done once a log entry points to it,
 * when the entry by category closes, and after a push or a cancel.
 *
 * - `fullcalendar/interaction`: Drags the boxes into the log.
 * - `./entries.ts`: Sends logged, taken back, pushed and cancelled boxes to the reader, and names who I will be with.
 * - `./series.ts`: Names the numbered types, tells a box of a series of my course and opens the dialog of its series.
 * - `./categories.ts`: Opens the entry by category for a new box, a box to change, and a box to log through it.
 * - `./gifts.ts`: Opens the dialog of the gift idea for a birthday or holiday.
 * - `./places.ts`: Gives the name of the place of a box, a link when it has one.
 * - `./times.ts`: Gives the times a box is logged at with one tap, writes times of day and how near a deadline is.
 * - `../skill/attempts.ts`: Names the category of skill entries, writes a date as a day,
 *   and gives the day of a date.
 * - `../today.ts`: Gives today's calendar date, which tells whether the day of a box is over.
 * - `../icons.ts`: Puts icons into the buttons, their words as tooltip.
 * - `../menu.ts`: Puts the buttons of a box behind one button `⋯`.
 * - `../phone.ts`: Tells a phone, which shows a skill by its code alone.
 * - `../reader.ts`: Asks the reader.
 * - `lucide`: The icons plus, check, arrow, cross, calendar crossed out, repeat and gift.
 * - `fullcalendar`: Calendar of the log the boxes are dropped into.
 */

import { Draggable } from "fullcalendar/interaction";
import { boxDrop, boxLog, boxPush, boxSubmit, boxUndo, boxUniversity } from "./entries.ts";
import { boxOpenEdit, boxOpenNew, entryOpenFromBox } from "./categories.ts";
import { giftOpen } from "./gifts.ts";
import { breakableOf } from "./choices.ts";
import { whereLinkedOf, whereOf } from "./places.ts";
import { linkNameOf, modulesFolder } from "../skill/links.ts";
import { boxMinutes, boxTimesOf, lengthOf, nearOf, timeOf } from "./times.ts";
import { numberedTypes, seriesHas, seriesOpen } from "./series.ts";
import { dayOf, dayTextOf, semesterOf, skillName } from "../skill/attempts.ts";
import { calendarTodayOf } from "../today.ts";
import { iconOf, iconPut, plusPut } from "../icons.ts";
import { menuItemOf, menuOf } from "../menu.ts";
import { phone } from "../phone.ts";
import { readerAsk } from "../reader.ts";
import { ArrowRight, CalendarOff, Check, Gift, Repeat, X } from "lucide";

import type { Calendar, EventApi, EventReceiveInfo } from "fullcalendar";
import type { IconNode } from "lucide";
import type { Attendee } from "./entries.ts";
import type { Link } from "../skill/attempts.ts";


/**
 * State of a box: open, done, since a log entry points to it, dropped, which I cancelled, `STATUS:CANCELLED`,
 * cancelled by the university, its `X-NUMBER:NONE`, or pushed, as it shows greyed on a day it left,
 * see `reader/boxes.ts`.
 */
export type BoxState = "open" | "done" | "dropped" | "university" | "pushed";

/**
 * A box, as the reader sends it.
 *
 * - `id`: Identifier of its to-do or event, for an occurrence of a series with its start after `#`,
 *   like `weekly-lecture@nomsystem#2026-10-13T08:00:00.000Z`.
 * - `category`: Category, like `Skill`, empty for a box without one, like a to-do another app wrote.
 * - `title`: What, like `WI1059 HU`.
 * - `titleLink`: Link of what it is, its `ALTREP`, like the page of an event, for a skill box the folder of its skill
 *   or of its material while I typed none, empty for none.
 * - `location`: Place, like `TUM Innenstadt, Arcisstraße 21, 80333 München, Deutschland`, empty for none.
 * - `locationLink`: Link of its place, its `ALTREP`, like `https://nav.tum.de/room/0509.EG.980`, empty for none.
 * - `online`, `onlineLink`, `passcode`: What it does online, see `Online` in `entries.ts`, each empty for none.
 * - `from`: Where a way starts, empty for none.
 * - `attendees`: Who I will be with, see `Attendee` in `entries.ts`, none for nobody.
 * - `module`: Module of a skill box, like `WI1059`, empty for any other box.
 * - `type`: Type of a skill box, like `HU`, empty for any other box.
 * - `semester`: Semester of a skill box, like `2026W`, empty for none, like an older box, and for any other box.
 * - `note`: Free note.
 * - `day`: Its day, like `2026-10-13`; for a box with a deadline the day of its deadline.
 * - `time`: Expected time as ISO instant, empty for none.
 * - `minutes`: Expected duration in minutes, `null` for none.
 * - `deadline`: Deadline as ISO instant, or as its day like `2026-10-23` when it has no time; empty for none.
 * - `state`: Whether it is open, done, dropped, which is cancelled, cancelled by the university, or pushed from the day
 *   it shows on.
 * - `pushed`: Where it stood before each push to a later day, in order, see {@link Push}.
 * - `log`: Start and end of the log entry written from it, for a box with a deadline of its last session,
 *   as ISO instants, `null` for none.
 * - `editable`: Whether it can be changed, pushed and dropped: a to-do or an event with times,
 *   also one occurrence of a series, alone, like the lecture `IN2028 VO` on 26.10.2026.
 * - `series`: Whether it is one occurrence of a series, which cannot be removed.
 * - `todo`: Whether it is a to-do; an event, like a lecture imported from TUMonline, keeps its time and duration.
 * - `links`: Its links, like the slides a lecture of my plan links, which a log entry from it gets too.
 * - `chapters`: Chapters of my system a skill box belongs to, like `02_LogisticPoissonRegression`, which a log entry
 *   from it gets too; none for none.
 * - `number`: Its number in its series, like `3`, `NONE` for one the university cancelled, empty for none.
 * - `group`: The group of a tutorial whose session it goes to, like `03`, see `../editor/course.ts`; empty for none.
 * - `moved`: For a box shown greyed on a day it was pushed from, where it went, see {@link Moved};
 *   `null` for any other.
 */
export type Box = {
    id: string;
    category: string;
    title: string;
    titleLink: string;
    location: string;
    locationLink: string;
    online: string;
    onlineLink: string;
    passcode: string;
    from: string;
    attendees: Attendee[];
    module: string;
    type: string;
    semester: string;
    note: string;
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
    moved: Moved | null;
};

/**
 * Where a box stood before one push to a later day, as the reader sends it, see `Push` in `reader/calendar.ts`.
 *
 * - `day`: Its day before, like `2026-10-16`.
 * - `time`: Its start before as ISO instant, empty for a box without time.
 * - `minutes`: Its length before in minutes, `null` where the push noted none.
 */
export type Push = {
    day: string;
    time: string;
    minutes: number | null;
};

/**
 * Where a box went that shows greyed on a day it was pushed from, as the reader sends it.
 *
 * - `day`: The day it stands on now, like `2026-10-17`, where a click on its lines leads.
 * - `last`: Whether it is its last push and the box is still open, so its arrow takes the push back.
 */
export type Moved = {
    day: string;
    last: boolean;
};

/**
 * A birthday or holiday of a day, as the reader sends it.
 *
 * - `id`: Its identifier in `Birthdays.ics` or `Holidays.ics`, shared by every year of it.
 * - `category`: Its category, like `Birthday` or `Holiday`, empty for none.
 * - `title`: Its name as its file writes it, like `Karlbauer Florian` or `Ostermontag (AT, DE)`.
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
 * - `boxes`: Its boxes: those with a time first, by their time, then those without, the cancelled ones last.
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
 * The boxes carried along to the shown day, as loaded last: those of the days before it, neither done nor cancelled,
 * the earliest first; none for any day but today.
 */
let carried: Box[] = [];

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
 * Makes what an entry or a box is, the first line of each, in bold as a whole, so the list scans fast:
 * its category, a colon and its what, like **`Skill: WI1059_FinancialAccounting (HU)`** or **`Sleep: Night`**;
 * only the what of an entry without category, only the category without colon of an entry whose what it is,
 * like an old **`Sleep`**, written before it had its what.
 * - `text`: The line, category and what.
 *
 * @param category - Category, empty for an entry without one
 * @param what - What the entry was, empty when it is its category
 * @returns The line in bold
 */
export function whatOf(category: string, what: string): (string | Node)[] {
    let text: string = what === "" ? category : `${category}: ${what}`;
    if (category === "")
        text = what;
    return [entryPartOf("strong", "entry-heading", [text])];
}

/**
 * Gives what an entry or a box shows as its what, see {@link whatOf}: a skill entry or box by its what as its file
 * writes it, the name of the folder of its skill and its type in brackets, like
 * `IN0004_EinfuehrungRechnerarchitektur (VO)`, so it reads as the file and the folder in the file manager do;
 * an entry written while a summary named its module in words, like `IN0004 Einfuehrung Rechnerarchitektur (VO)`,
 * by the folder its words were made of, its code and `_` before them and their spaces taken out, the same
 * `IN0004_EinfuehrungRechnerarchitektur (VO)`; on a phone by its code alone with its type, like `IN0004 (VO)`, so it
 * stays short there, and so does an older entry like `IN0004 VO`; a project by its name, like `WokFlow`; one without
 * skill and type, like an older entry, and any other entry or box by its what as written.
 * - `name`: Its what without its type in brackets, like `IN0004 Einfuehrung Rechnerarchitektur`.
 * - `folder`: The folder of its skill made of the words of that name, like `IN0004_EinfuehrungRechnerarchitektur`.
 *
 * @param category - Its category, like `Skill`
 * @param title - Its what as written, its `SUMMARY`, like `IN0004_EinfuehrungRechnerarchitektur (VO)`
 * @param module - Its skill, like `IN0004`, empty for none
 * @param type - Its type, like `VO`, empty for none
 * @returns What it shows, like `IN0004_EinfuehrungRechnerarchitektur (VO)`
 */
export function shownWhatOf(category: string, title: string, module: string, type: string): string {
    const name: string = title.replace(/ \(\w+\)$/, "");
    if (category !== skillName || (module === "" && type === "") || (!phone && title.startsWith(`${module}_`)))
        return title;
    if (phone || !name.startsWith(`${module} `) || name === `${module} ${type}`)
        return type === "" ? module : `${module} (${type})`;
    const folder: string = `${module}_${name.slice(module.length + 1).replaceAll(" ", "")}`;
    return type === "" ? folder : `${folder} (${type})`;
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
    return readerAsk<PlanDay[]>(`/api/day/boxes?start=${start}&end=${end}`);
}

/**
 * Loads the boxes carried along to a day from the reader: those of the days before it, neither done nor cancelled,
 * see `boxesCarried` in `reader/boxes.ts`.
 *
 * @param day - The day, like `2026-10-13`, today
 * @returns The boxes, the earliest first
 * @throws {Error} - When the reader cannot answer
 */
async function carriedFetch(day: string): Promise<Box[]> {
    return readerAsk<Box[]>(`/api/day/carried?date=${day}`);
}

/**
 * Writes the parts of the line of the time and length of a box, the second of its lines, see {@link boxContentOf},
 * which a middle dot parts, the same whether it is open or done, since the log shows its real time: its own day
 * when it is carried along to a later day, like `Mon, 12.10.2026`, its expected start and end, else its expected
 * duration, like `01h 15m`, see `lengthOf` in `times.ts`, never how often it was pushed; that a box was cancelled
 * or pushed away shows its icon at its right, see {@link stateOf}.
 * - `over`: Its own day, for an open box without deadline carried along to a later day, else empty.
 * - `start`: Its expected start, `null` for none.
 * - `when`: Its expected start and end, or its start alone without duration, empty for neither.
 * - `length`: Its expected duration, empty for none and where its start shows its time.
 *
 * @param box - The box
 * @param day - Day the box shows on, like `2026-10-20`
 * @returns The parts of the line, in order, none when there is nothing to write
 */
function timePartsOf(box: Box, day: string): string[] {
    const over: string = box.state === "open" && box.deadline === "" && box.day < day ? dayTextOf(box.day, true) : "";
    const start: Date | null = box.time === "" ? null : new Date(box.time);
    let when: string = start === null ? "" : timeOf(start);
    if (start !== null && box.minutes !== null)
        when = `${timeOf(start)} – ${timeOf(new Date(start.getTime() + box.minutes * 60 * 1000))}`;
    const length: string = box.minutes === null || start !== null ? "" : lengthOf(box.minutes);
    return [over, when, length].filter((part: string): boolean => part !== "");
}

/**
 * Writes the parts of the line of the deadline of a box, below the line of its time, see {@link boxContentOf},
 * which a middle dot parts: the day of its deadline, its time, none for a deadline without time, and how near it is
 * while it is open, see `nearOf` in `times.ts`, not for a box carried along; its day left out on that day itself,
 * unless nothing else is left to write, like `Fri, 23.10.2026 · 12:00 · in 3 days` and `12:00 · today`.
 * - `time`: Its time, empty for a deadline without time.
 * - `near`: How near it is, empty for a box not open, or one carried along.
 * - `rest`: Its time and how near it is, as far as there is something to write.
 *
 * @param box - The box
 * @param day - Day the box shows on, like `2026-10-20`
 * @param nearShown - Whether to write how near its deadline is, not for a box carried along
 * @returns The parts of the line, in order, none for a box without deadline
 */
function deadlinePartsOf(box: Box, day: string, nearShown: boolean): string[] {
    if (box.deadline === "")
        return [];
    const time: string = box.deadline === box.day ? "" : timeOf(new Date(box.deadline));
    const near: string = !nearShown || box.state !== "open" ? "" : nearOf(box.day, day);
    const rest: string[] = [time, near].filter((part: string): boolean => part !== "");
    return box.day === day && rest.length > 0 ? rest : [dayTextOf(box.day, true), ...rest];
}

/**
 * Makes the parts of a line of times, the first plain, each further one after its dot, see `.entry-parted`
 * in `day.css`, in one part of the line, so they stay together on a phone too.
 *
 * @param parts - The parts, like `Wed, 14.10.2026` and `13:15 – 14:45`
 * @param start - What stands before the first, like `Deadline: `, empty for nothing
 * @returns The part of the line, `null` for no parts
 */
function timesOf(parts: string[], start: string): HTMLElement | null {
    return parts.length === 0 ? null : entryPartOf("span", "box-part box-time", parts.map((part: string,
        index: number): string | Node => index === 0 ? `${start}${part}` : entryPartOf("span", "entry-parted", [part])));
}

/**
 * Makes the lines of a box, the same whether it is open or done, see the top
 * of this file, as an entry of the log has them: what it is in bold, see {@link whatOf},
 * like **`Skill: IN0004_EinfuehrungRechnerarchitektur (VO)`**, see {@link shownWhatOf}, on one line, see `.box-what`
 * in `boxes.css`; then its time in the light grey of a time, its parts apart by a middle dot
 * with room on both sides, see {@link timePartsOf}, and after it its place in the darker grey, by its label alone,
 * its address hidden, like `16:00 – 17:30 · Audimax im Galileo`, a way its route, like `Home Munich → TUM Garching`,
 * see `whereLinkedOf` in `places.ts`, a place with a link opening it on a click instead of the box; then its deadline
 * on a line of its own in the grey of a time, see {@link deadlinePartsOf}; then its chapters on a line of their own
 * in the same grey, apart by a middle dot, see {@link chaptersOf}; then its documents, one per line with a bullet,
 * see {@link topicsOf}; a line without anything to say is left out.
 * - `what`: What it is as shown.
 * - `times`: Its time, see {@link timesOf}, `null` for none.
 * - `place`: The label of its place or the route of a way, empty for none.
 * - `meta`: Its time and its place, as far as it has them, the place after a dot when a time stands before it.
 * - `deadline`: Its deadline after `Deadline: `, `null` for none.
 * - `chapters`: Its chapters, each after a dot but the first.
 * - `topics`: Its documents.
 *
 * @param box - The box
 * @param day - Day the box shows on, like `2026-10-20`
 * @param nearShown - Whether to write how near its deadline is, not for a box carried along
 * @returns Its lines
 */
function boxContentOf(box: Box, day: string, nearShown: boolean): HTMLElement[] {
    const what: string = shownWhatOf(box.category, box.title, box.module, box.type);
    const times: HTMLElement | null = timesOf(timePartsOf(box, day), "");
    const place: string = whereOf(box.category, box.from, box.location, box.online);
    const meta: HTMLElement[] = [
        ...(times === null ? [] : [times]),
        ...(place === "" ? [] : [entryPartOf("span", times === null ? "box-part" : "box-part entry-parted",
            whereLinkedOf(box.category, box.from, box.location, box.locationLink, box.online, box.onlineLink))]),
    ];
    const deadline: HTMLElement | null = timesOf(deadlinePartsOf(box, day, nearShown), "Deadline: ");
    const chapters: HTMLElement[] = chaptersOf(box).map((chapter: Node, index: number): HTMLElement =>
        entryPartOf("span", index === 0 ? "box-part" : "box-part entry-parted", [chapter]));
    const topics: string[] = topicsOf(box);
    return [
        entryPartOf("div", "box-what", whatOf(box.category, what === box.category ? "" : what)),
        ...(meta.length === 0 ? [] : [entryPartOf("div", "box-meta", meta)]),
        ...(deadline === null ? [] : [entryPartOf("div", "box-meta", [deadline])]),
        ...(chapters.length === 0 ? [] : [entryPartOf("div", "box-meta box-chapters", chapters)]),
        ...(topics.length === 0 ? [] : [entryPartOf("ul", "box-topics", topics.map((topic: string): HTMLElement =>
            entryPartOf("li", "", [breakableOf(topic)])))]),
    ];
}

/**
 * Gives the chapters of a skill box by the names of their folders, like `01_RegressionAnalysis`, each a link that
 * opens the overview of its module in the scripts view in this window, the chapter picked in the tree, never a second
 * one, like `/scripts?module=IN2028_BusinessAnalyticsMachineLearning&chapter=01_RegressionAnalysis`,
 * instead of the box, as the place opens its link; plain on a phone, which has no scripts view, and for a box whose summary links
 * no module folder.
 * - `module`: Name of the folder of its module, the part of the link of its summary after `NomSkillingmodules/`,
 *   like `IN2028_BusinessAnalyticsMachineLearning`, empty for none.
 * - `anchor`: The link of a chapter.
 *
 * @param box - The box
 * @returns Its chapters, in order, none for none
 */
function chaptersOf(box: Box): Node[] {
    const [folder, module]: string[] = box.titleLink.split("/");
    return box.chapters.map((chapter: string): Node => {
        if (phone || folder !== modulesFolder || module === undefined)
            return document.createTextNode(chapter);
        const anchor: HTMLAnchorElement = document.createElement("a");
        anchor.className = "chapter-link";
        anchor.href = `/scripts?module=${encodeURIComponent(module)}&chapter=${encodeURIComponent(chapter)}`;
        anchor.textContent = chapter;
        anchor.addEventListener("click", (event: MouseEvent): void => event.stopPropagation());
        return anchor;
    });
}

/**
 * Gives the documents a box will use, as I planned them, each by its name, the last part of its path,
 * like `04_LogisticPoissonRegression.pdf`; a folder it links, which an older box may, shows as its chapter
 * or not at all, see `chaptersOf` in `reader/documents.ts`.
 *
 * @param box - The box
 * @returns Its documents, in order, none for none
 */
function topicsOf(box: Box): string[] {
    return box.links.filter((link: Link): boolean => link.fingerprint !== "").map(linkNameOf);
}

/**
 * Makes the birthdays and holidays of a day, each above its boxes looking like a box, see {@link boxElementOf},
 * so it reads as an appointment of the day: its category in bold with a colon as what a box is, like
 * **`Birthday:`**` Karlbauer Florian`, see {@link whatOf}, and beside it, after a middle dot, my gift idea for it,
 * when I have one, like `· Concert tickets`, ending in `…` where the line is too narrow, as what a box is does,
 * and no buttons, since it is never logged. A click on it opens the dialog of its gift idea, see `gifts.ts`,
 * and one without an idea shows the gift at its right under the pointer.
 * - `after`: My gift idea after its dot, else the gift under the pointer.
 * - `element`: A birthday or holiday with its idea.
 *
 * @param occasions - Birthdays and holidays with my gift ideas
 * @param open - Opens the dialog of the gift idea for one
 * @returns One element each
 */
function occasionsOf(occasions: Occasion[], open: (occasion: Occasion) => void): HTMLElement[] {
    return occasions.map((occasion: Occasion): HTMLElement => {
        const after: HTMLElement = occasion.gift === "" ? entryPartOf("span", "occasion-hint", [iconOf(Gift)])
            : entryPartOf("span", "entry-parted occasion-gift", [occasion.gift]);
        const element: HTMLElement = entryPartOf("div", "box occasion", [entryPartOf("div", "box-body", [
            entryPartOf("div", "box-what", [...whatOf(occasion.category, occasion.title), after])])]);
        element.title = occasion.gift === "" ? "Gift idea" : "Change gift idea";
        element.addEventListener("click", (): void => open(occasion));
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
 * Acts on a click on what a box is: a box greyed on a day it was pushed from leads to the day it stands on now;
 * a box that can be changed, also one occurrence of a series, opens the entry
 * by category to change it, an open one that cannot, like a lecture of a file outside the new system, the entry
 * by category of the log at the times of a tap, see {@link boxTap}.
 * - `start`, `end`: The times of a tap.
 *
 * @param calendar - Calendar of the day
 * @param box - The box
 * @throws {Error} - When the reader does not answer
 */
async function boxClick(calendar: Calendar, box: Box): Promise<void> {
    if (box.moved !== null)
        calendar.gotoDate(box.moved.day);
    else if (box.editable)
        await boxOpenEdit(box);
    else if (box.state === "open") {
        const [start, end]: [Date, Date] = boxTimesOf(box, calendar.view.currentStart);
        await entryOpenFromBox(box, start, end);
    }
}

/**
 * Makes the state of a box no longer open, at its right in the place of the menu `⋯` of an open box,
 * see {@link actionsOf}: one small grey icon, the one of what made it in the menu, its word as tooltip,
 * see {@link stateMarkOf}: the check for a done box, `Logged`, and for a done box with a deadline, `Submitted`,
 * the cross for one I skipped, `Skipped`, the calendar crossed out for one the university cancelled, `Cancelled`,
 * the arrow for one greyed on a day it was pushed from, `Moved`; a click on it takes that back, as the menu did it:
 * a done box back to open, see `boxUndo` in `entries.ts`, a box with a deadline its tick, see `boxSubmit`, a skipped
 * or cancelled box back to open, and a box greyed on the day of its last push that push; only the icon, without
 * button, for a box greyed on the day of an earlier push, since only the last push can be taken back, and for a box
 * that cannot be changed, but for a done one.
 *
 * @param calendar - Calendar of the day
 * @param box - The box, no longer open
 * @returns Its icon
 */
function stateOf(calendar: Calendar, box: Box): HTMLElement {
    if (box.state === "done")
        return box.deadline === ""
            ? stateMarkOf(calendar, Check, "Logged", (): Promise<void> => boxUndo(calendar, box.id))
            : stateMarkOf(calendar, Check, "Submitted", (): Promise<void> => boxSubmit(box.id, false));
    if (box.state === "dropped")
        return stateMarkOf(calendar, X, "Skipped", box.editable ? (): Promise<void> => boxDrop(box.id, false) : null);
    if (box.state === "university")
        return stateMarkOf(calendar, CalendarOff, "Cancelled",
            box.editable ? (): Promise<void> => boxUniversity(box.id, false) : null);
    return stateMarkOf(calendar, ArrowRight, "Moved",
        box.editable && box.moved?.last === true ? (): Promise<void> => boxPush(box.id, false) : null);
}

/**
 * Makes the icon of the state of a box, see {@link stateOf}, as large and in the same place as `⋯`,
 * see `.box-state` in `boxes.css`: a button where the state can be taken back, which a click does and then loads
 * the list again, lighter under the pointer like `⋯`; else the icon alone.
 * - `mark`: The icon alone.
 * - `button`: The icon as button.
 *
 * @param calendar - Calendar of the day
 * @param icon - Icon, like `X`
 * @param word - The state, its tooltip, like `Skipped`
 * @param back - Sends taking it back to the reader, `null` where it cannot be taken back
 * @returns The icon
 */
function stateMarkOf(calendar: Calendar, icon: IconNode, word: string,
    back: (() => Promise<void>) | null): HTMLElement {
    if (back === null) {
        const mark: HTMLElement = entryPartOf("span", "box-state", []);
        iconPut(mark, icon, word);
        return mark;
    }
    const button: HTMLButtonElement = document.createElement("button");
    button.type = "button";
    button.className = "box-state";
    iconPut(button, icon, word);
    button.addEventListener("click", (): void => {
        back().then((): Promise<void> => boxesLoad(calendar)).catch((error: unknown): void => console.error(error));
    });
    return button;
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
 * Makes one button of the menu of a box, its icon and then its words, like `Move`, which sends a change
 * of the box and then loads the list again, see `menuItemOf` in `../menu.ts`.
 *
 * @param calendar - Calendar of the day
 * @param icon - Icon, like `ArrowRight`
 * @param words - What it does, like `Move`
 * @param send - Sends the change to the reader
 * @returns The button
 */
function actionOf(calendar: Calendar, icon: IconNode, words: string, send: () => Promise<void>): HTMLButtonElement {
    return menuItemOf(icon, words, (): void => {
        send().then((): Promise<void> => boxesLoad(calendar)).catch((error: unknown): void => console.error(error));
    });
}

/**
 * Puts the buttons of a box behind one button `⋯` at its right, see `../menu.ts`
 * and `.box-actions` in `boxes.css`, so the line of what the box is keeps its room.
 * - `place`: The button `⋯` with its menu.
 *
 * @param buttons - The buttons, like the arrow and the cross
 * @returns The button `⋯` with its menu
 */
function actionsRowOf(buttons: HTMLButtonElement[]): HTMLElement {
    const place: HTMLElement = menuOf(buttons);
    place.classList.add("box-actions");
    return place;
}

/**
 * Makes the menu of an open box, behind its button `⋯`, see {@link actionsRowOf}: first `Log`, the one button
 * that logs it with one tap, see {@link boxTap}, a hint above the list saying when the reader does not log it,
 * see {@link logFailShow}, for a box with a deadline `Submit` instead, which ticks it submitted, its sessions staying
 * in the log, see `boxSubmit` in `entries.ts`, both also for a box that cannot be changed, like a lecture of a file
 * outside the new system, whose menu holds nothing else; then `Move`, which pushes it to the next day, one whose day
 * is over to tomorrow, also one carried along, see `boxPush` in `reader/boxes.ts`, but for a box with a deadline,
 * which stays on the day of its deadline; then for a lecture, an exercise, a tutorial or a sheet,
 * see `numberedTypes` in `series.ts`, `Cancel`, which marks it cancelled by the university, see `boxUniversity`
 * in `entries.ts`; then `Skip`, which cancels it; last, for a box of a series of my course, `Series`, which opens
 * the dialog of its series, see `seriesOpen` in `series.ts`. A box no longer open shows its state in that place
 * instead, see {@link stateOf}. One occurrence of a series has them too and changes alone, the series staying.
 * - `first`: `Log`, or `Submit` for a box with a deadline.
 *
 * @param calendar - Calendar of the day
 * @param box - The box, open
 * @returns The button `⋯` with its menu
 */
function actionsOf(calendar: Calendar, box: Box): HTMLElement {
    const first: HTMLButtonElement = box.deadline === ""
        ? menuItemOf(Check, "Log", (): void => {
            boxTap(calendar, box).catch(logFailShow);
        })
        : actionOf(calendar, Check, "Submit", (): Promise<void> => boxSubmit(box.id, true));
    if (!box.editable)
        return actionsRowOf([first]);
    return actionsRowOf([
        first,
        ...(box.deadline !== "" ? []
            : [actionOf(calendar, ArrowRight, "Move", (): Promise<void> => boxPush(box.id, true))]),
        ...(box.category === skillName && numberedTypes.includes(box.type)
            ? [actionOf(calendar, CalendarOff, "Cancel", (): Promise<void> =>
                boxUniversity(box.id, true))] : []),
        actionOf(calendar, X, "Skip", (): Promise<void> => boxDrop(box.id, true)),
        ...seriesHas(box) ? [menuItemOf(Repeat, "Series", (): void => {
            seriesOpen(box.module, box.type, box.semester || semesterOf(box.day))
                .catch((error: unknown): void => console.error(error));
        })] : [],
    ]);
}

/**
 * Makes a box of the list: its lines, see {@link boxContentOf}, which change it when clicked, see {@link boxClick},
 * and at their right its menu `⋯` while open, see {@link actionsOf}, else its state, see {@link stateOf};
 * in the list carried along with its own day and without how near its deadline is, since its deadline line names it.
 * An open box has the class `box-draggable`, so it can be dragged into the log, see {@link boxesStart},
 * and keeps its identifier, which names it when it is dropped, see {@link boxReceive}, its category, its title
 * and its minutes in the log as data of its element.
 * - `element`: The box.
 * - `body`: Its lines.
 *
 * @param calendar - Calendar of the day
 * @param box - The box
 * @param carriedShown - Whether it shows in the list carried along, else among the boxes of the shown day
 * @returns The box
 */
function boxElementOf(calendar: Calendar, box: Box, carriedShown: boolean): HTMLElement {
    const element: HTMLElement = entryPartOf("div", `box box-${box.state}`, []);
    const body: HTMLElement = entryPartOf("div", "box-body", boxContentOf(box, shown.day, !carriedShown));
    element.classList.toggle("box-draggable", box.state === "open");
    element.dataset.id = box.id;
    element.dataset.category = box.category;
    element.dataset.title = box.title;
    element.dataset.minutes = String(box.minutes ?? boxMinutes);
    element.addEventListener("click", (event: MouseEvent): void => {
        if (event.target === element || body.contains(event.target as Node))
            boxClick(calendar, box).catch((error: unknown): void => console.error(error));
    });
    element.append(body, box.state === "open" ? actionsOf(calendar, box) : stateOf(calendar, box));
    return element;
}

/**
 * Sections of the plan, in order, each named as the folder of its plans in `NomManagecalendar`, see `reader/sources.ts`.
 */
const sections: string[] = ["Skilling", "University", "Living"];

/**
 * Gives the section of the plan a box stands in, as the folder of the plan it lies in, see `calendarFileOf`
 * in `reader/documents.ts`: a box of another category than a skill `Living`, like sleep, a skill box of a module,
 * whose summary links a folder in `NomSkillingmodules`, `University`, any other skill box `Skilling`.
 *
 * @param box - The box
 * @returns Name of its section, like `University`
 */
function sectionOf(box: Box): string {
    if (box.category !== skillName)
        return "Living";
    return box.titleLink.split("/")[0] === modulesFolder ? "University" : "Skilling";
}

/**
 * Gives the boxes of the list in the order of their places: those of the shown day, then those carried along,
 * among which a box dragged into the log is found by its identifier, see {@link boxReceive}.
 *
 * @returns The boxes
 */
function listedOf(): Box[] {
    return [...shown.boxes, ...carried];
}

/**
 * Shows the plan of the shown day in the list: its birthdays and holidays, then its boxes in their sections,
 * see {@link sections}, each below its name on a thin line, a section without boxes left out, in each its boxes
 * that are not cancelled, then the cancelled ones; a calm hint when the day has none of them;
 * below them, on today, the boxes carried along under `Carried along`, when there are any.
 * - `elements`: Birthdays, holidays, names of sections and boxes as elements, in order.
 * - `boxes`: The boxes as elements, in the order of the boxes of the day.
 * - `dropped`: Whether a box is cancelled.
 * - `inSection`: The boxes of a section as elements, the cancelled ones last.
 * - `carriedElements`: The heading and the boxes carried along, none when there are none.
 *
 * @param calendar - Calendar of the day
 */
function boxesShow(calendar: Calendar): void {
    const dropped: (box: Box) => boolean = (box: Box): boolean => box.state === "dropped";
    const boxes: HTMLElement[] = shown.boxes.map((box: Box): HTMLElement => boxElementOf(calendar, box, false));
    const elements: HTMLElement[] = [
        ...occasionsOf(shown.occasions, giftOpen),
        ...sections.flatMap((section: string): HTMLElement[] => {
            const inSection: HTMLElement[] = [
                ...boxes.filter((element: HTMLElement, index: number): boolean =>
                    sectionOf(shown.boxes[index]) === section && !dropped(shown.boxes[index])),
                ...boxes.filter((element: HTMLElement, index: number): boolean =>
                    sectionOf(shown.boxes[index]) === section && dropped(shown.boxes[index])),
            ];
            return inSection.length === 0 ? [] : [entryPartOf("h3", "plan-section", [section]), ...inSection];
        }),
    ];
    const carriedElements: HTMLElement[] = carried.length === 0 ? [] : [
        entryPartOf("h3", "plan-carried", ["Carried along"]),
        ...carried.map((box: Box): HTMLElement => boxElementOf(calendar, box, true)),
    ];
    document.getElementById("plan-boxes")?.replaceChildren(...(elements.length > 0 ? elements
        : [entryPartOf("p", "plan-none", ["Nothing planned"])]), ...carriedElements);
}

/**
 * Loads the plan of the shown day and, on today, the boxes carried along to it,
 * and shows them, unless another day is shown meanwhile, without the hint of a box not logged, see {@link logFailShow}.
 * - `day`: The shown day.
 * - `plans`: Its plan, the one day of the range.
 * - `carriedNow`: The boxes carried along to it, none for any day but today.
 *
 * @param calendar - Calendar of the day
 * @throws {Error} - When the reader cannot answer
 */
async function boxesLoad(calendar: Calendar): Promise<void> {
    const day: string = dayOf(calendar.view.currentStart);
    const [plans, carriedNow]: [PlanDay[], Box[]] = await Promise.all([
        boxesFetch(day, dayOf(calendar.view.currentEnd)),
        day === calendarTodayOf() ? carriedFetch(day) : Promise.resolve([]),
    ]);
    if (day !== dayOf(calendar.view.currentStart))
        return;
    shown = plans[0];
    carried = carriedNow;
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
    boxesAgain(calendar);
}

/**
 * Loads the list of the shown day again, as its plan lies in the files now, like when I come back to the page;
 * says so in the list when the reader cannot answer.
 *
 * @param calendar - Calendar of the day
 */
export function boxesAgain(calendar: Calendar): void {
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
 * - `box`: The box, the open one of its identifier among the boxes of the shown day and those carried along,
 *   see {@link listedOf}, so a list loaded anew while I drag, like after a change on another device, logs the box
 *   I dragged, never the one that took its place; `undefined` once it is open no more, which the hint tells.
 * - `start`, `end`: Where it was dropped.
 *
 * @param calendar - Calendar of the day
 * @param info - Dropped entry, with the element of the box
 */
export function boxReceive(calendar: Calendar, info: EventReceiveInfo): void {
    info.revert();
    const box: Box | undefined = listedOf().find((one: Box): boolean => one.state === "open"
        && one.id === info.draggedEl.dataset.id);
    if (box === undefined) {
        logFailShow(new Error(`No open box ${info.draggedEl.dataset.id ?? ""}`));
        return;
    }
    const start: Date = info.event.start as Date;
    const end: Date = info.event.end as Date;
    (box.category === "" ? entryOpenFromBox(box, start, end) : boxLog(calendar, box.id, start, end))
        .catch(logFailShow);
}

/**
 * Follows an open box I press, see {@link boxesStart}: once it moves, the arrow of the day after is outlined, and
 * the box let go on that arrow is pushed to the day after, as its own arrow does, and the day view follows it there;
 * let go anywhere else, FullCalendar takes it, like into the log. A press that ends without being let go here,
 * like one the browser takes for a scroll or one let go outside the window, is followed no more, at the latest
 * once the next press comes, so a later click on the arrow never pushes a box pressed long before.
 * - `item`: The box pressed, `null` for a press beside an open box.
 * - `day`: The day view, which outlines the arrow while the box moves.
 * - `move`: Outlines the arrow once the pointer moves.
 * - `end`: Ends following the box.
 * - `up`: Takes the box let go.
 *
 * @param calendar - Calendar of the day
 * @param down - The press
 */
function boxDragFollow(calendar: Calendar, down: PointerEvent): void {
    const item: HTMLElement | null = (down.target as HTMLElement).closest<HTMLElement>(".box-draggable");
    const day: HTMLElement | null = document.querySelector(".day");
    if (item === null)
        return;
    const move: (event: PointerEvent) => void = (event: PointerEvent): void => {
        if (Math.abs(event.clientX - down.clientX) + Math.abs(event.clientY - down.clientY) > 4)
            day?.classList.add("day-pushing");
    };
    const end: () => void = (): void => {
        document.removeEventListener("pointermove", move);
        document.removeEventListener("pointerup", up);
        document.removeEventListener("pointercancel", end);
        document.removeEventListener("pointerdown", end, true);
        day?.classList.remove("day-pushing");
    };
    const up: (event: PointerEvent) => void = (event: PointerEvent): void => {
        const rect: DOMRect | undefined = document.getElementById("day-next")?.getBoundingClientRect();
        end();
        if (rect === undefined || event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top
            || event.clientY > rect.bottom)
            return;
        boxPush(item.dataset.id ?? "", true).then((): void => calendar.next()).catch(logFailShow);
    };
    document.addEventListener("pointermove", move);
    document.addEventListener("pointerup", up);
    document.addEventListener("pointercancel", end);
    document.addEventListener("pointerdown", end, true);
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
 * A box pressed and let go on the arrow of the day after is pushed there, see {@link boxDragFollow}.
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
    document.getElementById("plan-boxes")?.addEventListener("pointerdown", (event: PointerEvent): void =>
        boxDragFollow(calendar, event));
    plusPut(document.getElementById("plan-new") as HTMLElement, "New box");
    document.getElementById("plan-new")?.addEventListener("click", (): void => {
        boxOpenNew(calendar.view.currentStart).catch((error: unknown): void => console.error(error));
    });
    ["entry", "gift"].forEach((id: string): void => document.getElementById(id)?.addEventListener("close", (): void => {
        boxesLoad(calendar).catch((error: unknown): void => console.error(error));
    }));
}
