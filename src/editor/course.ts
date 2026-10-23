/**
 * ## Course
 *
 * The course of a module on its page, above its chapters, see `./overview.ts`, as the reader reads it in the semester
 * of today, see `reader/course.ts`: one card per type with boxes, in the order {@link typeOrder}, the card
 * of the tutorials also while only its groups are known; after them one plus, which adds a series of a new type;
 * a module with neither says `No series yet` before it. Then a thin line, and below it my own learning, the chapters.
 *
 * A card is the numbered list of its boxes, each row the same unit as a box of the plan, see `../day/boxes.ts`:
 * its type and number, like `VO 2`, `VO –` for one the university cancelled, its weekday and date,
 * like `Mon, 26.10.2026`, then grey its times, like `14:00 – 16:00`, never a length, its place, like
 * `5416.01.003 (Hörsaal 2 "Interims II")`, which opens its link, and who I am with, like a tutor; at its right `Next`
 * on the next open box, how near an exam is, like `in 77 days`, as the deadline of a box says it, and the menu `⋯`
 * of an open box with the words of the plan, `Log`, `Move`, `Cancel`, which the university cancels, and `Skip`;
 * a box no longer open shows in that place the icon of its state, as in the plan, which takes it back with one click:
 * the check of a box logged, the cross of one I skipped, the calendar crossed out of one the university cancelled.
 * A box done and one cancelled are greyed as in the plan, and so is a box not done whose day is over, which stays
 * in sight. Done rows fold into one line, like `✓ 1 done`, and after `Next` and two more the rest folds into one,
 * like `11 more · until 01.02.2027`; a click opens and closes either. A tap on a row opens its box as the day view
 * does, in the day view's own dialog, see `./dialog.ts`; the card loads anew once it closes.
 *
 * The heading of a card names its type, like `VO`, and at its right its rule, its weekdays with their times and its
 * room, a link, like `Mon 14:00–16:00 · 5416.01.003`, or `Mon 12:00–13:30 · Tue 16:00–17:30 · 8120.01.101` for lectures
 * on two weekdays, of my tutorials my group first, like `Group 03 · Wed 10:00–12:00 · 5610.01.011`; then the one
 * pencil, which opens the dialog of the series, see {@link seriesShow}. Below the heading, small and grey,
 * the folder of the material of the type of the semester, while it exists, like
 * `VO_UniversityLectureLessons/TUM_2026W`.
 * The card of the tutorials of a module with groups says `No group yet` in place of its rule while I have none,
 * which picks my group from the dashboard's own list, its sessions to come becoming my series; each open box to come
 * has its group in its row, picked from the same list, which moves only that week's box to another group, `⇄` beside
 * it while it goes to another group than mine, my group moving it back; and below its rows the folded line
 * `10 groups` opens the week of its groups, this week first, see {@link groupWeekOf}.
 *
 * The week of the groups is a line with its number and its days, like `Week 43 · 19.10. – 25.10.2026`, between
 * the arrows to the week before and after, and the icon back to this week, off on this week; then every session
 * of every group in that week, the earliest first, each a row on the grid of a box: a circle where a box has its type
 * and number, its day, grey its times, its room with its link and its tutor, then its group. The session I go to that
 * week is marked, its circle filled and its row in the grey of a choice: the one the box of the week goes to, else,
 * in a week without box, that of the group I was at last; a session over is grey. A click on a session picks it
 * for its week, see `weekPick` in `reader/course.ts`: the box of the week goes to it, a week without box gets one,
 * and with no series yet the sessions of the group from that week on become my series; a session over too, while
 * its week is not logged, as where I was after all; nothing in a week logged or cancelled by the university.
 * The marked session of an open box has the menu `⋯` of its box, of a logged box the check, and the session of a box
 * skipped or cancelled by the university its icon, each as on the row of the box. A week I do not touch follows
 * the group I logged last, which the reader does as I log, see `groupFollow` there. A week its groups do not meet,
 * like in the holidays, says `No group meets this week`.
 *
 * The pencil of a card and the plus of a new series open the day view's dialog of a series, see `../day/series.ts`,
 * the same one a box of the series opens from the day, so a series changes here as there; the course loads anew
 * as its files change.
 * Phones show no course, since they show only the day.
 *
 * - `./dialog.ts`: The day view's dialogs of an entry, which opens a box tapped and logs one, and of a series.
 * - `../day/entries.ts`: Logs a box, takes it back, pushes, cancels and skips it, as the plan does.
 * - `../day/choices.ts`: The dashboard's own pickers.
 * - `../day/places.ts`: Gives the place of a box with its link.
 * - `../day/series.ts`: Opens the dialog of a series, sends a change of the course, names the numbered types,
 *   writes a slot, a room and a group, and gives the weekday of a day, its Monday, its name and a day some days after.
 * - `../day/times.ts`: Gives the times a box is logged at, writes times and days, and writes how near a day is.
 * - `../skill/attempts.ts`: Writes a date as a day and a day as the page shows it.
 * - `../today.ts`: Gives today's calendar date.
 * - `../food/foods.ts`: Makes elements.
 * - `../icons.ts`: Puts the icons into the buttons, and the plus that adds a series.
 * - `../menu.ts`: Puts the actions of a box behind one button `⋯`.
 * - `../changes.ts`: Loads the course anew the moment a file of my new system changes.
 * - `../reader.ts`: Asks the reader.
 * - `lucide`: The icons of the actions and states of a box, of the pencil, of the arrows of a week and of this week.
 * - `../day/boxes.css`, `../day/log.css`, `../day/day.css`, `../day/choices.css`: Look of the states of a box,
 *   of a place with its link, of the rows of a dialog and of the pickers, as in the day.
 * - `./course.css`: Look of the course.
 */

import { dialogOf } from "./dialog.ts";
import { boxDrop, boxLog, boxPush, boxSubmit, boxUndo, boxUniversity } from "../day/entries.ts";
import { choicesOf, listsStart, searchOf } from "../day/choices.ts";
import { whereLinkedOf } from "../day/places.ts";
import {
    courseSend, dayAdd, groupChoiceOf, mondayOf, numberedTypes, roomOf, seriesOpen, slotTextOf, weekdayNameOf,
    weekdayOf,
} from "../day/series.ts";
import { boxTimesOf, dateTextOf, nearOf, timeOf } from "../day/times.ts";
import { dayOf, dayTextOf } from "../skill/attempts.ts";
import { calendarTodayOf } from "../today.ts";
import { elementOf } from "../food/foods.ts";
import { iconPut, iconWordsOf, plusPut } from "../icons.ts";
import { menuItemOf, menuOf } from "../menu.ts";
import { changesFollow } from "../changes.ts";
import { readerAsk } from "../reader.ts";
import { ArrowRight, CalendarCheck, CalendarOff, Check, ChevronLeft, ChevronRight, Pencil, X } from "lucide";
import "../day/boxes.css";
import "../day/log.css";
import "../day/day.css";
import "../day/choices.css";
import "./course.css";

import type { Dialog } from "./dialog.ts";
import type { Box } from "../day/boxes.ts";
import type { Attendee } from "../day/entries.ts";
import type { Choice } from "../day/choices.ts";
import type { Course, Group, Planned, Series, Session, Slot } from "../day/series.ts";
import type { IconNode } from "lucide";


/**
 * Order of the cards of the types, the courses of the university as they come in a week: lectures, central exercises,
 * exercises, tutorials, homework, a practical course, and the exams last.
 */
const typeOrder: string[] = ["VO", "ZU", "UE", "TU", "HU", "PR", "FA"];

/**
 * Rows of a card that show after the next open box, itself included, before the rest folds.
 */
const shownAhead: number = 3;

/**
 * The course as loaded last, `null` before.
 */
let shown: Course | null = null;

/**
 * Where the cards stand, `null` before the page of a module shows.
 */
let place: HTMLElement | null = null;

/**
 * Name of the folder of the module shown, like `IN2028_BusinessAnalyticsMachineLearning`.
 */
let module: string = "";

/**
 * Lines opened by a click, by their card and kind, like `VO done`, `VO more` or `TU groups`.
 */
const opened: Set<string> = new Set();

/**
 * How many weeks after this one the week of the groups of a card shows, by its type, like 1 for `TU` on the next
 * week, see {@link groupWeekOf}; a card left out shows this week.
 */
const weeks: Map<string, number> = new Map();

/**
 * Order of the boxes of a type in one week, which one its week of the groups goes by while it has several,
 * see {@link weekBoxOf}: done, open, skipped, cancelled by the university.
 */
const stateOrder: string[] = ["done", "open", "dropped", "university"];

/**
 * Whether the course loads anew once the dialog of an entry closes, see {@link dialogShow}.
 */
let dialogFollowed: boolean = false;


/**
 * Gives the groups of a type of the course shown.
 *
 * @param type - Type, like `TU`
 * @returns Its groups, by group
 */
function groupsOf(type: string): Group[] {
    return (shown?.groups ?? []).filter((group: Group): boolean => group.rule.type === type);
}

/**
 * Loads the course of the module shown from the reader in the semester of today and shows it, see {@link cardsShow}.
 *
 * @throws {Error} - When the reader cannot answer
 */
async function courseLoad(): Promise<void> {
    shown = await readerAsk<Course>(`/api/course/module?module=${encodeURIComponent(module)}&semester=`);
    cardsShow();
}

/**
 * Opens the dialog of a series of the course shown, the same as from the day, see `seriesOpen` in `../day/series.ts`,
 * the day view's dialogs put into the page first, see {@link dialogShow}.
 *
 * @param type - Type of the series, like `VO`, empty for a new one
 */
function seriesShow(type: string): void {
    dialogShow().then((): Promise<void> => seriesOpen(module, type, shown?.semester ?? ""))
        .catch((error: unknown): void => console.error(error));
}

/**
 * Sends a change of the course to the reader and then loads the course anew, saying in the console when the reader
 * does not take it.
 *
 * @param send - Sends the change
 */
function act(send: () => Promise<unknown>): void {
    send().then((): Promise<void> => courseLoad()).catch((error: unknown): void => console.error(error));
}

/**
 * Gives the dialog of an entry, see `./dialog.ts`, the first time also loading the course anew whenever it closes,
 * saved or not, as the plan does.
 * - `dialog`: The dialog.
 *
 * @returns The dialog
 */
async function dialogShow(): Promise<Dialog> {
    const dialog: Dialog = await dialogOf();
    if (!dialogFollowed)
        document.getElementById("entry")?.addEventListener("close", (): void => {
            courseLoad().catch((error: unknown): void => console.error(error));
        });
    dialogFollowed = true;
    return dialog;
}

/**
 * Opens a box tapped as the day view does, see `boxClick` in `../day/boxes.ts`: a box that can be changed in the
 * dialog to change it, an open one that cannot in the dialog of the log, at the times it is logged at.
 * - `dialog`: The dialog.
 * - `start`, `end`: The times it is logged at.
 *
 * @param box - The box
 * @throws {Error} - When the reader does not answer
 */
async function boxOpen(box: Box): Promise<void> {
    const dialog: Dialog = await dialogShow();
    if (box.editable)
        await dialog.categories.boxOpenEdit(box);
    else if (box.state === "open") {
        const [start, end]: [Date, Date] = boxTimesOf(box, new Date(`${box.day}T12:00:00`));
        await dialog.categories.entryOpenFromBox(box, start, end);
    }
}

/**
 * Makes the menu `⋯` of an open box with the words of the plan, see `actionsOf` in `../day/boxes.ts`: `Log`, which
 * logs it as expected, `Submit` in its place for a box with a deadline, then, for a box that can be changed, `Move`
 * but for a box with a deadline, `Cancel` for a box of a numbered type, which the university cancels, and `Skip`;
 * a click on it never opens the box.
 * - `log`: Logs the box as expected, at its times, see `boxTimesOf` in `../day/times.ts`.
 * - `items`: The items of the menu.
 * - `menu`: The button `⋯` with its menu.
 *
 * @param box - The box, open
 * @returns The button `⋯` with its menu
 */
function actionsOf(box: Box): HTMLElement {
    const log: () => Promise<void> = async (): Promise<void> => {
        const [start, end]: [Date, Date] = boxTimesOf(box, new Date(`${box.day}T12:00:00`));
        await boxLog((await dialogShow()).calendar, box.id, start, end);
    };
    const items: HTMLButtonElement[] = [
        box.deadline === "" ? menuItemOf(Check, "Log", (): void => act(log))
            : menuItemOf(Check, "Submit", (): void => act((): Promise<void> => boxSubmit(box.id, true))),
        ...(!box.editable || box.deadline !== "" ? []
            : [menuItemOf(ArrowRight, "Move", (): void => act((): Promise<void> => boxPush(box.id, true)))]),
        ...(!box.editable || !numberedTypes.includes(box.type) ? []
            : [menuItemOf(CalendarOff, "Cancel", (): void => act((): Promise<void> => boxUniversity(box.id, true)))]),
        ...(!box.editable ? [] : [menuItemOf(X, "Skip", (): void => act((): Promise<void> => boxDrop(box.id, true)))]),
    ];
    const menu: HTMLElement = menuOf(items);
    menu.addEventListener("click", (event: MouseEvent): void => event.stopPropagation());
    return menu;
}

/**
 * Makes the state of a box no longer open in the place of its `⋯`, as the plan shows it, see `stateOf`
 * in `../day/boxes.ts`: the check of a box logged, `Logged`, or ticked submitted, `Submitted`, the cross of one
 * I skipped, `Skipped`, the calendar crossed out of one the university cancelled, `Cancelled`; a click on it takes that
 * back,
 * as there, for a box that can be changed, a logged one always.
 * - `state`: Its icon, its word and how it is taken back, `null` where it cannot be.
 * - `button`: The icon as a button, or alone.
 *
 * @param box - The box, no longer open
 * @returns Its icon
 */
function stateOf(box: Box): HTMLElement {
    const undo: () => Promise<void> = async (): Promise<void> => boxUndo((await dialogShow()).calendar, box.id);
    let state: [IconNode, string, (() => Promise<void>) | null] = [CalendarOff, "Cancelled",
        box.editable ? (): Promise<void> => boxUniversity(box.id, false) : null];
    if (box.state === "done")
        state = box.deadline === "" ? [Check, "Logged", undo]
            : [Check, "Submitted", (): Promise<void> => boxSubmit(box.id, false)];
    else if (box.state === "dropped")
        state = [X, "Skipped", box.editable ? (): Promise<void> => boxDrop(box.id, false) : null];
    const [icon, word, back]: [IconNode, string, (() => Promise<void>) | null] = state;
    const button: HTMLElement = document.createElement(back === null ? "span" : "button");
    if (button instanceof HTMLButtonElement)
        button.type = "button";
    button.className = "box-state";
    iconPut(button, icon, word);
    button.addEventListener("click", (event: MouseEvent): void => {
        event.stopPropagation();
        if (back !== null)
            act(back);
    });
    return button;
}

/**
 * Tells whether a session of a group is over.
 *
 * @param session - The session
 * @returns Whether its end lies before now
 */
function overOf(session: Session): boolean {
    return Date.parse(session.start) + session.minutes * 60 * 1000 <= Date.now();
}

/**
 * Gives the sessions of the groups of a type in a week, each with its group, the earliest first.
 *
 * @param type - Type, like `TU`
 * @param week - Monday of the week, like `2026-10-19`
 * @returns The sessions with their groups
 */
function meetingsOf(type: string, week: string): [Group, Session][] {
    return groupsOf(type).flatMap((group: Group): [Group, Session][] => group.sessions
        .filter((session: Session): boolean => mondayOf(dayOf(new Date(session.start))) === week)
        .map((session: Session): [Group, Session] => [group, session]))
        .sort((first: [Group, Session], second: [Group, Session]): number =>
            first[1].start.localeCompare(second[1].start));
}

/**
 * Gives the week of a box in its series, by its Monday, as the reader counts it, see `weekOf` in `reader/course.ts`:
 * that of the day it stood on before its first push, else of its day.
 *
 * @param box - The box
 * @returns Day like `2026-10-19`
 */
function boxWeekOf(box: Box): string {
    return mondayOf(box.pushed[0]?.day ?? box.day);
}

/**
 * Makes the group of a box of a type with groups in its row, see the top of this file: its group, like `Group 03`,
 * `⇄` beside it while it goes to another group than mine; of an open box to come a picker, its list the groups meeting
 * in its week, each by its weekday, times and room, mine marked, whose session is not over yet, a pick moving only
 * this box to the session of that group, see `weekMove` in `reader/course.ts`; of any other box its group grey,
 * as the line of the picker; an empty place for a box without group.
 * - `meeting`: The groups meeting in the week of the box, each with its session not over yet, the earliest first.
 * - `other`: `⇄` while it goes to another group than mine, none else.
 * - `picker`: The picker.
 *
 * @param box - The box
 * @param mine - My group, like `03`, empty for none
 * @returns The picker, its group, or an empty place
 */
function weekPickOf(box: Box, mine: string): HTMLElement {
    const meeting: [Group, Session][] = meetingsOf(box.type, mondayOf(box.day))
        .filter(([, session]: [Group, Session]): boolean => !overOf(session));
    const other: HTMLElement[] = box.group !== "" && box.group !== mine ? [elementOf("span", "course-other", "⇄")] : [];
    if (meeting.length === 0 || box.state !== "open" || !box.editable || box.pushed.length > 0
        || box.day < calendarTodayOf()) {
        const group: HTMLElement = elementOf("span", "course-group", box.group === "" ? "" : `Group ${box.group}`);
        group.append(...other);
        return group;
    }
    const picker: HTMLElement = choicesOf({
        search: searchOf(meeting.map(([group, session]: [Group, Session]): Choice => ({
            value: group.rule.group, text: `Group ${group.rule.group}`, group: "",
            detail: [`${weekdayNameOf(weekdayOf(dayOf(new Date(session.start))), false)} ${timeOf(new Date(session
                .start))}–${timeOf(new Date(Date.parse(session.start) + session.minutes * 60 * 1000))}`,
            roomOf(group.rule.location), ...(group.rule.group === mine ? ["mine"] : [])].join(" · "),
        }))),
        picked: box.group === "" ? [] : [box.group], many: false, adding: false, noun: "group",
        textOf: (value: string): string => `Group ${value}`,
        aside: other,
        pick: (values: string[]): void => {
            const group: string | undefined = values[0];
            if (group === undefined || group === box.group)
                cardsShow();
            else
                act((): Promise<null> => courseSend<null>("/api/course/week", { box: box.id, group: group }));
        },
    });
    picker.classList.add("course-pick");
    picker.addEventListener("click", (event: MouseEvent): void => event.stopPropagation());
    return picker;
}

/**
 * Makes the row of a box, see the top of this file: its type and number, its day, grey its times, its place short,
 * see {@link roomOf}, as a plan box writes a room, like `14:00 – 16:00 · 5416.01.003`, with its link, and its people,
 * then its group, see {@link weekPickOf}, then what stands at its right,
 * like `Next`, then its menu `⋯` while open, else its state; a box not done whose day is over greyed; a tap on it
 * opens it, see {@link boxOpen}.
 * - `row`: The row.
 * - `start`: Its start, `null` for a box without time.
 * - `meta`: Its times, place and people, apart by middle dots.
 * - `people`: Who I am with, by their names.
 *
 * @param box - The box
 * @param mark - What stands at its right, like `Next` or `in 77 days`, empty for nothing
 * @param mine - My group of its type, like `03`, empty for none
 * @returns The row
 */
function boxRowOf(box: Box, mark: string, mine: string): HTMLElement {
    const row: HTMLElement = elementOf("div", `course-row course-${box.state}`, "");
    const start: Date | null = box.time === "" ? null : new Date(box.time);
    const meta: HTMLElement = elementOf("span", "course-meta", "");
    const people: string = box.attendees.map((attendee: Attendee): string => attendee.name).join(", ");
    const parts: (string | Node)[][] = [
        start === null ? [] : [box.minutes === null ? timeOf(start)
            : `${timeOf(start)} – ${timeOf(new Date(start.getTime() + box.minutes * 60 * 1000))}`],
        whereLinkedOf(box.category, box.from, roomOf(box.location), box.locationLink, box.online, box.onlineLink),
        people === "" ? [] : [people],
    ].filter((part: (string | Node)[]): boolean => part.length > 0);
    parts.forEach((part: (string | Node)[], index: number): void => {
        const span: HTMLElement = elementOf("span", index === 0 ? "" : "entry-parted", "");
        span.append(...part);
        meta.append(span);
    });
    row.classList.toggle("course-missed", box.state === "open" && box.day < calendarTodayOf());
    row.append(
        elementOf("span", "course-what", `${box.type} ${box.number === "NONE" ? "–" : box.number}`.trim()),
        elementOf("span", "course-day", dayTextOf(box.day, true)),
        meta,
        weekPickOf(box, mine),
        elementOf("span", "course-mark", mark),
        box.state === "open" ? actionsOf(box) : stateOf(box),
    );
    row.title = box.note;
    row.addEventListener("click", (): void => {
        boxOpen(box).catch((error: unknown): void => console.error(error));
    });
    return row;
}

/**
 * Makes a folded line of a card, see the top of this file, which a click opens and closes, the card showing anew.
 * - `line`: The line, a button.
 * - `key`: Its card and kind, like `VO done`.
 *
 * @param type - Type of its card, like `VO`
 * @param kind - What it folds, `done`, `more` or `groups`
 * @param parts - What it says, like the check and `1 done`
 * @returns The line
 */
function foldOf(type: string, kind: string, parts: (string | Node)[]): HTMLButtonElement {
    const line: HTMLButtonElement = document.createElement("button");
    const key: string = `${type} ${kind}`;
    line.type = "button";
    line.className = "course-fold";
    line.append(...parts);
    line.setAttribute("aria-expanded", String(opened.has(key)));
    line.addEventListener("click", (): void => {
        if (!opened.delete(key))
            opened.add(key);
        cardsShow();
    });
    return line;
}

/**
 * Makes the rows of the boxes of a card, see the top of this file: the line of the done ones, folded unless opened,
 * then every box of a day over, the done ones only while opened, each in its row, see {@link boxRowOf}; then from
 * today on the next open box, marked `Next`, and the rows up to two after it, the rest folded into one line,
 * like `11 more · until 01.02.2027`, unless opened; an exam says how near it is in place of `Next`, like `in 77 days`.
 * - `today`: Today's calendar date.
 * - `past`, `coming`: The boxes of the days over and those from today on.
 * - `done`: The boxes over that are done.
 * - `next`: The next open box from today on, `undefined` for none.
 * - `cut`: How many boxes to come show.
 * - `rest`: Those that fold.
 * - `markOf`: Gives what stands at the right of a box.
 *
 * @param type - The type, like `VO`
 * @param boxes - Its boxes, the earliest first
 * @param mine - My group of the type, empty for none
 * @returns The rows and the lines
 */
function rowsOf(type: string, boxes: Box[], mine: string): HTMLElement[] {
    const today: string = calendarTodayOf();
    const past: Box[] = boxes.filter((box: Box): boolean => box.day < today);
    const coming: Box[] = boxes.filter((box: Box): boolean => box.day >= today);
    const done: Box[] = past.filter((box: Box): boolean => box.state === "done");
    const next: Box | undefined = coming.find((box: Box): boolean => box.state === "open");
    const cut: number = next === undefined ? shownAhead : coming.indexOf(next) + shownAhead;
    const rest: Box[] = coming.slice(cut);
    const markOf: (box: Box) => string = (box: Box): string => {
        if (type === "FA")
            return box.state === "open" && box.day >= today ? nearOf(box.day, today) : "";
        return box === next ? "Next" : "";
    };
    return [
        ...(done.length === 0 ? [] : [foldOf(type, "done", iconWordsOf(Check, `${done.length} done`))]),
        ...past.filter((box: Box): boolean => box.state !== "done" || opened.has(`${type} done`))
            .map((box: Box): HTMLElement => boxRowOf(box, markOf(box), mine)),
        ...coming.slice(0, opened.has(`${type} more`) ? coming.length : cut)
            .map((box: Box): HTMLElement => boxRowOf(box, markOf(box), mine)),
        ...(rest.length === 0 ? []
            : [foldOf(type, "more", [`${rest.length} more · until ${dateTextOf(rest[rest.length - 1].day)}`])]),
    ];
}

/**
 * Gives the number of a week as the calendar counts it, ISO 8601: the week whose Thursday is the first of its year
 * is week 1, so the last days of December may belong to week 1 of the year after.
 * - `thursday`: The Thursday of the week, whose year the week belongs to.
 * - `year`, `month`, `date`: The Thursday's parts.
 * - `days`: Days from the first of January to that Thursday.
 *
 * @param monday - The Monday of the week, like `2026-11-02`
 * @returns Its number, like 45
 */
function weekNumberOf(monday: string): number {
    const thursday: string = dayAdd(monday, 3);
    const [year, month, date]: number[] = thursday.split("-").map(Number);
    const days: number = (Date.UTC(year, month - 1, date) - Date.UTC(year, 0, 1)) / (24 * 60 * 60 * 1000);
    return Math.floor(days / 7) + 1;
}

/**
 * Writes the days of a week, its first and last day, the dash a space from either, its year once at the end, or at both
 * when the week runs into the next year.
 * - `sunday`: Its last day.
 *
 * @param monday - The Monday of the week, like `2026-11-02`
 * @returns Days like `02.11. – 08.11.2026`, or `28.12.2026 – 03.01.2027`
 */
function daysTextOf(monday: string): string {
    const sunday: string = dayAdd(monday, 6);
    const first: string = monday.slice(0, 4) === sunday.slice(0, 4) ? dateTextOf(monday).slice(0, 6)
        : dateTextOf(monday);
    return `${first} – ${dateTextOf(sunday)}`;
}

/**
 * Gives the box of a type in a week, see {@link boxWeekOf}, one done before an open one, one skipped and one
 * the university cancelled last, see {@link stateOrder}.
 * - `rank`: Gives the place of a box in that order, any other state after them.
 *
 * @param type - Type, like `TU`
 * @param week - Monday of the week, like `2026-10-19`
 * @returns The box, `undefined` for none
 */
function weekBoxOf(type: string, week: string): Box | undefined {
    const rank: (box: Box) => number = (box: Box): number =>
        stateOrder.includes(box.state) ? stateOrder.indexOf(box.state) : stateOrder.length;
    return (shown?.boxes ?? []).filter((box: Box): boolean => box.type === type && boxWeekOf(box) === week)
        .sort((first: Box, second: Box): number => rank(first) - rank(second))[0];
}

/**
 * Gives the group I was at last before a week: that of the last box of the type done with a group before it.
 *
 * @param type - Type, like `TU`
 * @param week - Monday of the week, like `2026-10-19`
 * @returns The group, like `03`, empty for none
 */
function lastGroupOf(type: string, week: string): string {
    return (shown?.boxes ?? []).filter((box: Box): boolean => box.type === type && box.state === "done"
        && box.group !== "" && boxWeekOf(box) < week).at(-1)?.group ?? "";
}

/**
 * Gives the session of a group among the sessions of a week, on a day when one is given, else its first.
 * - `own`: The sessions of the group.
 *
 * @param meetings - The sessions of the week with their groups
 * @param group - The group, like `04`, empty for none
 * @param day - The day, like `2026-11-06`, empty for any
 * @returns The session, `undefined` for none
 */
function sessionOf(meetings: [Group, Session][], group: string, day: string): Session | undefined {
    const own: Session[] = meetings.filter(([one]: [Group, Session]): boolean => group !== "" && one.rule.group === group)
        .map(([, session]: [Group, Session]): Session => session);
    return own.find((session: Session): boolean => dayOf(new Date(session.start)) === day) ?? own[0];
}

/**
 * Makes the row of a session of a group in the week of the groups, see the top of this file: its circle, its day,
 * grey its times, its room or its platform online, a link where it has one, and its tutor, then its group, then
 * what stands at its right; marked while I go to it, grey once over; a click picks it for its week, but in a week
 * logged or cancelled by the university, and on the session of an open box, which it goes to already.
 * - `start`, `end`: Its start and end.
 * - `fixed`: Whether a click does nothing.
 * - `row`: The row.
 * - `meta`: Its times, its room and its tutor, apart by middle dots.
 * - `tutor`: Its tutor, by name.
 * - `parts`: Its times, its room and its tutor, each its parts, none left out.
 * - `right`: What stands at its right: the `⋯` of the open box it goes to, the state of the box it went to or was
 *   skipped or cancelled at, see {@link stateOf}, else nothing.
 *
 * @param type - Type of the group, like `TU`
 * @param group - The group
 * @param session - Its session
 * @param box - The box of the week, `undefined` for none
 * @param marked - Whether it is the session I go to
 * @param own - Whether it is the session the box of the week stands at
 * @returns The row
 */
function sessionRowOf(type: string, group: Group, session: Session, box: Box | undefined, marked: boolean,
                      own: boolean): HTMLElement {
    const start: Date = new Date(session.start);
    const end: Date = new Date(start.getTime() + session.minutes * 60 * 1000);
    const fixed: boolean = box !== undefined && (box.state === "done" || box.state === "university"
        || (marked && box.state === "open"));
    const row: HTMLElement = elementOf("div", "course-row course-session", "");
    const meta: HTMLElement = elementOf("span", "course-meta", "");
    const tutor: string = group.rule.attendees.map((attendee: Attendee): string => attendee.name).join(", ");
    let right: HTMLElement = elementOf("span", "", "");
    if (box !== undefined && marked && box.state === "open")
        right = actionsOf(box);
    else if (box !== undefined && own && box.state !== "open" && stateOrder.includes(box.state))
        right = stateOf(box);
    const parts: (string | Node)[][] = [
        [`${timeOf(start)} – ${timeOf(end)}`],
        whereLinkedOf("Skill", "", roomOf(group.rule.location), group.rule.locationLink, group.rule.online,
            group.rule.onlineLink),
        tutor === "" ? [] : [tutor],
    ].filter((part: (string | Node)[]): boolean => part.length > 0);
    parts.forEach((part: (string | Node)[], index: number): void => {
        const span: HTMLElement = elementOf("span", index === 0 ? "" : "entry-parted", "");
        span.append(...part);
        meta.append(span);
    });
    meta.querySelector("a")?.addEventListener("click", (event: MouseEvent): void => event.stopPropagation());
    row.classList.toggle("course-on", marked);
    row.classList.toggle("course-over", overOf(session));
    row.classList.toggle("course-fixed", fixed);
    row.append(
        elementOf("span", "course-ring", ""),
        elementOf("span", "course-day", dayTextOf(dayOf(start), true)),
        meta,
        elementOf("span", "course-group", `Group ${group.rule.group}`),
        elementOf("span", "course-mark", ""),
        right,
    );
    if (!fixed)
        row.addEventListener("click", (): void => act((): Promise<null> => courseSend<null>("/api/course/pick",
            { module: module, type: type, group: group.rule.group, start: session.start })));
    return row;
}

/**
 * Makes the line of the week of the groups of a type, see the top of this file: its number and its days between
 * the arrows to the week before and after, then the icon back to this week, off on this week; each shows the card anew.
 * - `shift`: Weeks after this one the card shows.
 * - `line`: The line.
 * - `buttonOf`: Makes a button with its icon and its word as tooltip, which shows the card some weeks after this one.
 *
 * @param type - Type, like `TU`
 * @param week - Monday of the week, like `2026-10-19`
 * @returns The line
 */
function weekLineOf(type: string, week: string): HTMLElement {
    const shift: number = weeks.get(type) ?? 0;
    const line: HTMLElement = elementOf("div", "course-week", "");
    const buttonOf: (icon: IconNode, word: string, to: number) => HTMLButtonElement =
        (icon: IconNode, word: string, to: number): HTMLButtonElement => {
            const button: HTMLButtonElement = document.createElement("button");
            button.type = "button";
            iconPut(button, icon, word);
            button.addEventListener("click", (): void => {
                weeks.set(type, to);
                cardsShow();
            });
            return button;
        };
    const today: HTMLButtonElement = buttonOf(CalendarCheck, "Back to this week", 0);
    today.disabled = shift === 0;
    line.append(buttonOf(ChevronLeft, "Week before", shift - 1),
        elementOf("span", "", `Week ${weekNumberOf(week)} · ${daysTextOf(week)}`),
        buttonOf(ChevronRight, "Week after", shift + 1), today);
    return line;
}

/**
 * Makes the week of the groups of a type, see the top of this file: its line, see {@link weekLineOf}, then a row
 * per session of its groups in that week, see {@link sessionRowOf}, or `No group meets this week`.
 * - `week`: Monday of the week shown.
 * - `meetings`: Its sessions with their groups.
 * - `box`: The box of the week, see {@link weekBoxOf}, `undefined` for none.
 * - `own`: The session the box stands at, `undefined` for none.
 * - `marked`: The session I go to: that of an open or logged box, in a week without box that of the group I was
 *   at last, see {@link lastGroupOf}; none for a box skipped or cancelled by the university.
 *
 * @param type - Type, like `TU`
 * @returns The line and the rows
 */
function groupWeekOf(type: string): HTMLElement[] {
    const week: string = dayAdd(mondayOf(calendarTodayOf()), 7 * (weeks.get(type) ?? 0));
    const meetings: [Group, Session][] = meetingsOf(type, week);
    const box: Box | undefined = weekBoxOf(type, week);
    const own: Session | undefined = box === undefined ? undefined : sessionOf(meetings, box.group, box.day);
    let marked: Session | undefined = undefined;
    if (box === undefined)
        marked = sessionOf(meetings, lastGroupOf(type, week), "");
    else if (box.state === "open" || box.state === "done")
        marked = own;
    return [
        weekLineOf(type, week),
        ...(meetings.length === 0 ? [elementOf("p", "course-none", "No group meets this week")]
            : meetings.map(([group, session]: [Group, Session]): HTMLElement =>
                sessionRowOf(type, group, session, box, session === marked, session === own))),
    ];
}

/**
 * Makes the picker of my group in the heading of the card of a type with groups but no series yet, see the top of this
 * file: `No group yet`, its list the groups, each by its weekday, times and room; a pick makes the group mine,
 * its sessions to come becoming my series, see `groupMine` in `reader/course.ts`.
 * - `picker`: The picker.
 *
 * @param type - The type, like `TU`
 * @returns The picker
 */
function minePickOf(type: string): HTMLElement {
    const picker: HTMLElement = choicesOf({
        search: searchOf(groupsOf(type).map(groupChoiceOf)),
        picked: [], many: false, adding: false, noun: "group", empty: "No group yet",
        pick: (values: string[]): void => {
            if (values[0] !== undefined)
                act((): Promise<Planned[]> =>
                    courseSend<Planned[]>("/api/course/mine", { module: module, type: type, group: values[0] }));
        },
    });
    picker.classList.add("course-pick");
    return picker;
}

/**
 * Makes the heading of a card, see the top of this file: its type, at its right its rule, my group first, then
 * the weekdays with their times and the room, short, see {@link roomOf}, a link to the link of the place, then
 * the pencil, which opens the form of the series; for a type with groups but no series the picker of my group,
 * see {@link minePickOf}; for any other nothing at its right.
 * - `head`: The heading.
 * - `rule`: Its rule, beside the pencil, its parts apart by middle dots, as the line of a box.
 * - `pencil`: The pencil.
 *
 * @param type - The type, like `VO`
 * @param series - Its series, `undefined` for none
 * @returns The heading
 */
function headOf(type: string, series: Series | undefined): HTMLElement {
    const head: HTMLElement = elementOf("div", "course-head", "");
    head.append(elementOf("h3", "overview-chapter", type));
    if (series === undefined) {
        if (groupsOf(type).length > 0)
            head.append(minePickOf(type));
        return head;
    }
    const rule: HTMLElement = elementOf("span", "course-rule", "");
    const pencil: HTMLButtonElement = document.createElement("button");
    pencil.type = "button";
    pencil.className = "entry-pencil";
    iconPut(pencil, Pencil, "Change the series");
    pencil.addEventListener("click", (): void => seriesShow(type));
    [
        ...(series.rule.group === "" ? [] : [[`Group ${series.rule.group}`]]),
        ...series.rule.slots.map((slot: Slot): string[] => [slotTextOf(slot)]),
        ...(series.rule.location === "" && series.rule.online === "" ? []
            : [whereLinkedOf("Skill", "", roomOf(series.rule.location), series.rule.locationLink, series.rule.online,
                series.rule.onlineLink)]),
    ].forEach((part: (string | Node)[], index: number): void => {
        const span: HTMLElement = elementOf("span", index === 0 ? "" : "entry-parted", "");
        span.append(...part);
        rule.append(span);
    });
    rule.append(pencil);
    head.append(rule);
    return head;
}

/**
 * Makes the card of a type, see the top of this file: its heading, see {@link headOf}, below it the folder of its
 * material of the semester, while it exists, then its rows, see {@link rowsOf}, and for a type with groups the folded
 * line of its groups with their week, see {@link groupWeekOf}.
 * - `boxes`: Its boxes.
 * - `series`: Its series, `undefined` for none.
 * - `groups`: Its groups.
 * - `card`: The card.
 * - `body`: Its rows, on a card filled as a box of the plan.
 *
 * @param type - The type, like `VO`
 * @returns The card
 */
function cardOf(type: string): HTMLElement {
    const boxes: Box[] = (shown?.boxes ?? []).filter((box: Box): boolean => box.type === type);
    const series: Series | undefined = shown?.series.find((one: Series): boolean => one.rule.type === type);
    const groups: Group[] = groupsOf(type);
    const card: HTMLElement = elementOf("section", "overview-group course-card", "");
    const body: HTMLElement = elementOf("div", "overview-card", "");
    const folder: string = shown?.folders[type] ?? "";
    card.dataset.type = type;
    card.append(headOf(type, series), ...(folder === "" ? [] : [elementOf("p", "course-folder", folder)]));
    body.append(...rowsOf(type, boxes, series?.rule.group ?? ""));
    if (groups.length > 0)
        body.append(foldOf(type, "groups", [`${groups.length} groups`]),
            ...(opened.has(`${type} groups`) ? groupWeekOf(type) : []));
    card.append(body);
    return card;
}

/**
 * Shows the course of the module as loaded last, see the top of this file: its cards, then the plus that opens
 * the dialog of a new series, `No series yet` before it while there is no card.
 * - `types`: The types with boxes or groups, in their order.
 * - `plus`: The plus.
 */
function cardsShow(): void {
    if (place === null || shown === null)
        return;
    const course: Course = shown;
    const types: string[] = typeOrder.filter((type: string): boolean => course.boxes
        .some((box: Box): boolean => box.type === type) || groupsOf(type).length > 0);
    const plus: HTMLButtonElement = document.createElement("button");
    plus.type = "button";
    plusPut(plus, "New series");
    plus.addEventListener("click", (): void => seriesShow(""));
    place.replaceChildren(...types.map(cardOf),
        ...(types.length === 0 ? [elementOf("p", "plan-none", "No series yet")] : []), plus);
}

/**
 * Shows the course of a module in its place on its page, see the top of this file, and loads it anew the moment
 * a file of my new system changes, see `../changes.ts`, or the dialog of an entry closes; its lists close on Escape
 * and on a click beside them, as in the dialog, see `listsStart` in `../day/choices.ts`.
 *
 * @param element - Where the cards go, see `.overview-course` in `./editor.html`
 * @param folder - Name of the folder of the module, like `IN2028_BusinessAnalyticsMachineLearning`
 * @throws {Error} - When the reader cannot answer
 */
export async function courseShow(element: HTMLElement, folder: string): Promise<void> {
    place = element;
    module = folder;
    listsStart();
    changesFollow((): void => {
        courseLoad().catch((error: unknown): void => console.error(error));
    });
    await courseLoad();
}
