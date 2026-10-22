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
 * pencil, which opens the form of the series in the card, see {@link formOpen}. Below the heading, small and grey,
 * the folder of the material of the type of the semester, while it exists, like
 * `VO_UniversityLectureLessons/TUM_2026W`.
 * The card of the tutorials of a module with groups says `No group yet` in place of its rule while I have none,
 * which picks my group from the dashboard's own list, its sessions to come becoming my series; each open box to come
 * has its group in its row, picked from the same list, which moves only that week's box to another group, `⇄` beside
 * it while it goes to another group than mine, my group moving it back; and below its rows the folded line
 * `10 groups` opens the table of the groups as the university lists them: Day, First date, Start, End, Group, Room,
 * Tutor and the days it leaves out, the tutor empty while unknown.
 *
 * The form of a series opens in its card, in the look of the dialog of an entry, one row per field, see
 * `../day/choices.ts`: its type, of a type with groups its group, which made another one makes that group mine from
 * its next session on; its days, each a weekday with its times, `+` beside them for one more, like a lecture
 * on Mondays and on Tuesdays, numbered across both; its place, picked as in the dialog, the rooms of the university
 * among them as I type, `Online` with its parts; who I am with; its first and last day; the days it leaves out, each
 * with its `×`, a field below to add one; then the boxes it makes, numbered, each with its day, a day left out as `·`,
 * as the reader would write them, see `seriesApply` in `reader/course.ts`, anew after every change; then the plan
 * it writes into, Cancel and Save. Enter confirms only its field, Ctrl+Enter saves, Escape cancels.
 * Phones show no course, since they show only the day.
 *
 * - `./dialog.ts`: The day view's dialog of an entry, which opens a box tapped and logs one.
 * - `../day/entries.ts`: Logs a box, takes it back, pushes, cancels and skips it, as the plan does, and gives
 *   the standard address of a name.
 * - `../day/choices.ts`: The dashboard's own pickers, the rows of a form and the parts of a field.
 * - `../day/places.ts`: Gives the name, the address and the parts of a place, its link, and its choice in a list.
 * - `../day/times.ts`: Gives the times a box is logged at, writes and reads times and days, starts the fields of times
 *   and days, and writes how near a day is.
 * - `../skill/attempts.ts`: Writes a date as a day and a day as the page shows it.
 * - `../today.ts`: Gives today's calendar date.
 * - `../food/foods.ts`: Makes elements.
 * - `../icons.ts`: Puts the icons into the buttons, the plus that adds and the cross that takes back.
 * - `../menu.ts`: Puts the actions of a box behind one button `⋯`.
 * - `../changes.ts`: Loads the course anew the moment a file of my new system changes.
 * - `../reader.ts`: Asks the reader.
 * - `lucide`: The icons of the actions and states of a box, of the pencil, of Cancel and of Save.
 * - `../day/boxes.css`, `../day/log.css`, `../day/day.css`, `../day/choices.css`: Look of the states of a box,
 *   of a place with its link, of the rows of a form and of the pickers, as in the day.
 * - `./course.css`: Look of the course.
 */

import { dialogOf } from "./dialog.ts";
import { boxDrop, boxLog, boxPush, boxSubmit, boxUndo, boxUniversity, standardAddressOf } from "../day/entries.ts";
import { choiceOf, choicesOf, listsStart, partFieldOf, partOf, rowOf, searchOf } from "../day/choices.ts";
import {
    addressOf, labelOf, onlineLineOf, onlineName, onlineOf, placeChoiceOf, shownOf, standardLinkOf, whereLinkedOf,
} from "../day/places.ts";
import {
    boxTimesOf, dateFieldStart, dateParse, dateTextOf, nearOf, timeFieldRead, timeFieldStart, timeOf,
} from "../day/times.ts";
import { dayOf, dayTextOf } from "../skill/attempts.ts";
import { calendarTodayOf } from "../today.ts";
import { elementOf } from "../food/foods.ts";
import { crossPut, iconOf, iconPut, iconWordsOf, plusPut } from "../icons.ts";
import { menuItemOf, menuOf } from "../menu.ts";
import { changesFollow } from "../changes.ts";
import { readerAsk } from "../reader.ts";
import { ArrowRight, CalendarOff, Check, Pencil, X } from "lucide";
import "../day/boxes.css";
import "../day/log.css";
import "../day/day.css";
import "../day/choices.css";
import "./course.css";

import type { Dialog } from "./dialog.ts";
import type { Box, BoxState } from "../day/boxes.ts";
import type { Attendee } from "../day/entries.ts";
import type { Category, Field } from "../day/categories.ts";
import type { Choice } from "../day/choices.ts";
import type { IconNode } from "lucide";


/**
 * A slot of a rule, one weekday with its times, as the reader sends it, see `Slot` in `reader/course.ts`.
 *
 * - `weekday`: Its weekday, from 1 for Monday to 7 for Sunday, 0 while the form has none picked.
 * - `start`, `end`: Its times in Berlin time, like `14:00` and `16:00`, empty for none.
 */
type Slot = {
    weekday: number;
    start: string;
    end: string;
};

/**
 * A weekly rule of a series or a group, as the reader sends it and the form sends it back, see `Rule`
 * in `reader/course.ts`.
 *
 * - `type`: Type of its boxes, like `VO`.
 * - `slots`: Its weekdays with their times.
 * - `location`, `locationLink`: Its place as an entry writes it, with its link.
 * - `attendees`: Who I am with, like a tutor.
 * - `first`, `last`: Its first and last day, like `2026-10-19`.
 * - `excepts`: The days of its slots between them it leaves out, like `2026-12-28`.
 * - `group`: The group its boxes go to, like `03`, of my tutorials my group; empty for none.
 * - `semester`: Its semester, like `2026W`.
 */
type Rule = {
    type: string;
    slots: Slot[];
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
type Series = {
    rule: Rule;
    count: number;
};

/**
 * A session of a group, as the reader sends it: its start as ISO instant and its length in minutes.
 */
type Session = {
    start: string;
    minutes: number;
};

/**
 * A group of the tutorials of a module, as the reader sends it: its identifier, its rule with its group, like `03`,
 * and its sessions, the earliest first.
 */
type Group = {
    id: string;
    rule: Rule;
    sessions: Session[];
};

/**
 * The course of a module in the semester of today, as the reader sends it, see `Course` in `reader/course.ts`.
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
type Course = {
    module: string;
    semester: string;
    boxes: Box[];
    series: Series[];
    groups: Group[];
    folders: { [type: string]: string };
    file: string;
};

/**
 * A box of a series after a change, as the reader sends it for the preview of the form, see `Planned`
 * in `reader/course.ts`: its identifier, its day and number after the change, its state, `new` for a new one,
 * and whether the change adds, changes or removes it.
 */
type Planned = {
    id: string;
    day: string;
    number: string;
    state: BoxState | "new";
    change: "new" | "changed" | "removed" | "";
};

/**
 * The form of a series as typed so far, see {@link formOpen}.
 *
 * - `type`: Its type, like `VO`, empty while none is picked.
 * - `old`: The rule as read back when the form opened, `null` for a new series.
 * - `slots`: Its weekdays with their times, in the order of their rows.
 * - `before`: For each slot, the weekday of the slot of `old` whose boxes it takes, 0 for a slot added.
 * - `location`, `locationLink`: Its place with its link.
 * - `attendees`: Who I am with.
 * - `first`, `last`: Its first and last day, like `2026-10-19`, empty while not typed as a day.
 * - `excepts`: The days it leaves out, in order.
 * - `group`: Of the tutorials of a module with groups the group picked, like `03`; one other than that of `old`
 *   makes the group mine, see `groupMine` in `reader/course.ts`; empty for none.
 */
type Form = {
    type: string;
    old: Rule | null;
    slots: Slot[];
    before: number[];
    location: string;
    locationLink: string;
    attendees: Attendee[];
    first: string;
    last: string;
    excepts: string[];
    group: string;
};

/**
 * Order of the cards of the types, the courses of the university as they come in a week: lectures, central exercises,
 * exercises, tutorials, homework, a practical course, and the exams last.
 */
const typeOrder: string[] = ["VO", "ZU", "UE", "TU", "HU", "PR", "FA"];

/**
 * Types of a series, which carry their number, see `numberedTypes` in `reader/boxes.ts`.
 */
const numberedTypes: string[] = ["VO", "UE", "ZU", "TU", "HU"];

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
 * The form of a series being typed, `null` while none is open.
 */
let typing: Form | null = null;

/**
 * The element of the form being typed, `null` while none is open.
 */
let formElement: HTMLFormElement | null = null;

/**
 * Whether a file changed while the form was open, so the course loads anew once it closes.
 */
let waiting: boolean = false;

/**
 * The categories with the values of their fields, for the places and the people of the form, as loaded last.
 */
let categories: Category[] = [];

/**
 * Waiting preview of the form after a change, so typing asks the reader once, a moment after it rests.
 */
let previewWait: number = 0;

/**
 * How many previews the form asked for, so only the answer to the last one shows.
 */
let previewsAsked: number = 0;

/**
 * Whether the course loads anew once the dialog of an entry closes, see {@link dialogShow}.
 */
let dialogFollowed: boolean = false;


/**
 * Gives the weekday of a day.
 *
 * @param day - Day like `2026-10-19`
 * @returns 1 for Monday to 7 for Sunday
 */
function weekdayOf(day: string): number {
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
function mondayOf(day: string): string {
    return dayAdd(day, 1 - weekdayOf(day));
}

/**
 * Writes the name of a weekday in English, as the dates of the page write it.
 *
 * @param weekday - 1 for Monday to 7 for Sunday
 * @param whole - Whether to write it whole, like `Monday`, else short, like `Mon`
 * @returns Name of the weekday
 */
function weekdayNameOf(weekday: number, whole: boolean): string {
    return new Date(2026, 9, 18 + weekday).toLocaleDateString("en-GB", { weekday: whole ? "long" : "short" });
}

/**
 * Writes a slot as the heading of a card and a row of the table of the groups read it.
 *
 * @param slot - The slot
 * @returns Text like `Mon 14:00–16:00`
 */
function slotTextOf(slot: Slot): string {
    return `${weekdayNameOf(slot.weekday, false)} ${slot.start}–${slot.end}`;
}

/**
 * Writes the room of a place short, as the rule of a series and the row of a box name it: a room of the university by
 * its code, like `5416.01.003` of `5416.01.003 (Hörsaal 2 "Interims II")`, any other place as the plan shows it,
 * like `Online (Zoom)`, see `shownOf` in `../day/places.ts`.
 *
 * @param line - Place as an entry writes it
 * @returns The room, empty for no place
 */
function roomOf(line: string): string {
    return /^\d{4}\.\S+\.\S+/.test(labelOf(line)) ? labelOf(line).split(" ")[0] : shownOf(line);
}

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
 * Asks the reader for a change of the course, like a group made mine, as JSON.
 *
 * @param address - Address at the reader, like `/api/course/mine`
 * @param body - What to change
 * @returns Answer of the reader
 * @throws {Error} - When the reader does not take it
 */
async function courseSend<T>(address: string, body: object): Promise<T> {
    return readerAsk<T>(address, { method: "POST", body: JSON.stringify(body) });
}

/**
 * Loads the course of the module shown from the reader and shows it, see {@link cardsShow}; while the form of a series
 * is open, only notes that it waits, so nothing I type is lost.
 *
 * @throws {Error} - When the reader cannot answer
 */
async function courseLoad(): Promise<void> {
    if (typing !== null) {
        waiting = true;
        return;
    }
    shown = await readerAsk<Course>(`/api/course/module?module=${encodeURIComponent(module)}`);
    cardsShow();
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
 * Makes the group of a box of a type with groups in its row, see the top of this file: its group, like `Group 03`,
 * `⇄` beside it while it goes to another group than mine; of an open box to come a picker, its list the groups meeting
 * in its week, each by its weekday, times and room, mine marked, whose session is not over yet, a pick moving only
 * this box to the session of that group, see `weekMove` in `reader/course.ts`; of any other box its group grey,
 * as the line of the picker; an empty place for a box without group.
 * - `week`: Monday of the week of the box.
 * - `now`: Now in milliseconds.
 * - `meeting`: The groups meeting in that week, each with its session, the earliest first.
 * - `other`: `⇄` while it goes to another group than mine, none else.
 * - `picker`: The picker.
 *
 * @param box - The box
 * @param mine - My group, like `03`, empty for none
 * @returns The picker, its group, or an empty place
 */
function weekPickOf(box: Box, mine: string): HTMLElement {
    const week: string = mondayOf(box.day);
    const now: number = Date.now();
    const meeting: [Group, Session][] = groupsOf(box.type).flatMap((group: Group): [Group, Session][] => group.sessions
        .filter((session: Session): boolean => mondayOf(dayOf(new Date(session.start))) === week
            && Date.parse(session.start) + session.minutes * 60 * 1000 > now)
        .map((session: Session): [Group, Session] => [group, session]))
        .sort((first: [Group, Session], second: [Group, Session]): number =>
            first[1].start.localeCompare(second[1].start));
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
        whereLinkedOf(box.category, box.from, roomOf(box.location), box.locationLink),
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
 * Makes the table of the groups of a type, see the top of this file, as the university lists them: per group
 * its weekday, first day, start, end, group, room short with its link, see {@link roomOf}, tutor, empty while
 * unknown, and the days it leaves out.
 * - `table`: The table, a grid.
 * - `slot`: The one slot of a group.
 * - `room`: Its room.
 *
 * @param groups - The groups, by group
 * @returns The table
 */
function groupsTableOf(groups: Group[]): HTMLElement {
    const table: HTMLElement = elementOf("div", "course-groups", "");
    table.append(...["Day", "First date", "Start", "End", "Group", "Room", "Tutor", "Except"]
        .map((name: string): HTMLElement => elementOf("span", "course-groups-name", name)));
    groups.forEach((group: Group): void => {
        const slot: Slot = group.rule.slots[0];
        const room: HTMLElement = elementOf("span", "", "");
        room.append(...whereLinkedOf("Skill", "", roomOf(group.rule.location), group.rule.locationLink));
        table.append(
            elementOf("span", "", weekdayNameOf(slot.weekday, false)),
            elementOf("span", "", dateTextOf(group.rule.first)),
            elementOf("span", "", slot.start),
            elementOf("span", "", slot.end),
            elementOf("span", "", group.rule.group),
            room,
            elementOf("span", "", group.rule.attendees.map((attendee: Attendee): string => attendee.name).join(", ")),
            elementOf("span", "course-groups-except",
                group.rule.excepts.map((day: string): string => dateTextOf(day).slice(0, 6)).join(", ")),
        );
    });
    return table;
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
        search: searchOf(groupsOf(type).map((group: Group): Choice => ({
            value: group.rule.group, text: `Group ${group.rule.group}`, group: "",
            detail: `${group.rule.slots.map(slotTextOf).join(" · ")} · ${roomOf(group.rule.location)}`,
        }))),
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
    pencil.addEventListener("click", (): void => formOpen(series.rule));
    [
        ...(series.rule.group === "" ? [] : [[`Group ${series.rule.group}`]]),
        ...series.rule.slots.map((slot: Slot): string[] => [slotTextOf(slot)]),
        ...(series.rule.location === "" ? []
            : [whereLinkedOf("Skill", "", roomOf(series.rule.location), series.rule.locationLink)]),
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
 * line of its groups with their table, see {@link groupsTableOf}; while the form of its series is open, the form
 * in place of its rows.
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
    if (typing !== null && typing.old?.type === type && formElement !== null) {
        card.append(formElement);
        return card;
    }
    body.append(...rowsOf(type, boxes, series?.rule.group ?? ""));
    if (groups.length > 0)
        body.append(foldOf(type, "groups", [`${groups.length} groups`]),
            ...(opened.has(`${type} groups`) ? [groupsTableOf(groups)] : []));
    card.append(body);
    return card;
}

/**
 * Shows the course of the module as loaded last, see the top of this file: its cards, the form of a new series
 * while open, then the plus that opens it, `No series yet` before it while there is no card.
 * - `types`: The types with boxes or groups, in their order.
 * - `plus`: The plus.
 * - `fresh`: The form of a new series, `null` while none is open.
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
    plus.addEventListener("click", (): void => formOpen(null));
    const fresh: HTMLElement | null = typing === null || typing.old !== null || formElement === null ? null
        : elementOf("section", "overview-group course-card", "");
    fresh?.append(formElement as HTMLFormElement);
    place.replaceChildren(...types.map(cardOf),
        ...(types.length === 0 && fresh === null ? [elementOf("p", "plan-none", "No series yet")] : []),
        ...(fresh === null ? [plus] : [fresh]));
}

/**
 * Gives a field of `Skill` as the reader offers it, its places or its people, see `categoriesRead`
 * in `reader/categories.ts`.
 *
 * @param key - The field, `location` or `with`
 * @returns The field, `undefined` while the categories are not loaded
 */
function skillFieldOf(key: string): Field | undefined {
    return categories.find((category: Category): boolean => category.name === "Skill")?.fields
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
 * mine, each day a weekday, each once, with a start before its end, and a first day on or before its last.
 *
 * @param form - The form
 * @returns Whether it is ready
 */
function formReady(form: Form): boolean {
    if (form.type === "")
        return false;
    if (mineMade(form))
        return true;
    return form.slots.every((slot: Slot): boolean => slot.weekday > 0 && slot.start !== "" && slot.end !== ""
            && slot.start < slot.end)
        && new Set(form.slots.map((slot: Slot): number => slot.weekday)).size === form.slots.length
        && form.first !== "" && form.last !== "" && form.first <= form.last;
}

/**
 * Sends the form of a series to the reader: a group made mine, see `groupMine` in `reader/course.ts`, else the series
 * by its rule, see `seriesApply` there, its days left out only those between its first and its last day.
 *
 * @param form - The form, ready, see {@link formReady}
 * @param dry - Whether only to tell what it would make, for the preview
 * @returns The boxes of the series after the change
 * @throws {Error} - When the reader does not take it
 */
async function formSend(form: Form, dry: boolean): Promise<Planned[]> {
    if (mineMade(form))
        return courseSend<Planned[]>("/api/course/mine",
            { module: module, type: form.type, group: form.group, dry: dry });
    return courseSend<Planned[]>("/api/course/series", {
        module: module, old: form.old, before: form.before, dry: dry,
        rule: {
            type: form.type, slots: form.slots, location: form.location, locationLink: form.locationLink,
            attendees: form.attendees, first: form.first, last: form.last, group: form.old?.group ?? "",
            excepts: form.excepts.filter((day: string): boolean => form.first <= day && day <= form.last),
            semester: shown?.semester ?? "",
        },
    });
}

/**
 * Shows the boxes the form of a series makes, as the reader would write them, see {@link formSend}: each its number,
 * `–` for one the university cancelled, the check of one done, a new one outlined, with its day below it, like `19.10`,
 * a day left out as `·`, in the order of their days; then how many there are, like `14 boxes`; nothing while the form
 * is not ready or the reader does not take it, like for dates too far apart, and only the answer to the last question.
 * - `preview`: The place of the preview.
 * - `asked`: The number of this question.
 * - `planned`: The boxes, without those removed.
 * - `items`: The boxes and the days left out, each its day with its element.
 *
 * @throws {Error} - When the reader does not answer
 */
async function previewShow(): Promise<void> {
    const preview: HTMLElement | null = formElement?.querySelector(".course-preview") ?? null;
    if (typing === null || preview === null)
        return;
    const form: Form = typing;
    const asked: number = ++previewsAsked;
    if (!formReady(form)) {
        preview.replaceChildren();
        return;
    }
    let planned: Planned[];
    try {
        planned = (await formSend(form, true)).filter((box: Planned): boolean => box.change !== "removed");
    } catch (error: unknown) {
        if (asked === previewsAsked)
            preview.replaceChildren();
        throw error;
    }
    if (asked !== previewsAsked)
        return;
    const items: [string, HTMLElement][] = [
        ...planned.map((box: Planned): [string, HTMLElement] => {
            const chip: HTMLElement = elementOf("span", `course-chip course-chip-${box.state}`, "");
            chip.append(...(box.state === "done" ? [iconOf(Check)] : []), box.number === "NONE" ? "–" : box.number);
            return [box.day, chip];
        }),
        ...(mineMade(form) ? [] : form.excepts.filter((day: string): boolean => form.first <= day && day <= form.last))
            .map((day: string): [string, HTMLElement] => [day, elementOf("span", "course-chip course-chip-none", "·")]),
    ].sort((first: [string, HTMLElement], second: [string, HTMLElement]): number => first[0].localeCompare(second[0]));
    preview.replaceChildren(...items.map(([day, chip]: [string, HTMLElement]): HTMLElement => {
        const item: HTMLElement = elementOf("span", "course-preview-item", "");
        item.append(chip, elementOf("span", "course-preview-day", dateTextOf(day).slice(0, 5)));
        return item;
    }), elementOf("span", "course-preview-count", `${planned.length} boxes`));
}

/**
 * Takes a change of the form of a series: allows saving while it is ready, see {@link formReady}, and asks for its
 * preview anew a moment after the typing rests, see {@link previewShow}.
 */
function formChanged(): void {
    const save: HTMLButtonElement | null = formElement?.querySelector(".panel-main") ?? null;
    if (typing === null || save === null)
        return;
    save.disabled = !formReady(typing);
    clearTimeout(previewWait);
    previewWait = window.setTimeout((): void => {
        previewShow().catch((error: unknown): void => console.error(error));
    }, 150);
}

/**
 * Moves the days of the form of a series that fall on the weekday of a slot to its new weekday in their week,
 * its first day, its last and the days it leaves out, so a lecture moved from Monday to Tuesday keeps its weeks,
 * like `19.10.2026–01.02.2027` becoming `20.10.2026–02.02.2027`.
 * - `move`: Moves a day on the old weekday.
 *
 * @param form - The form
 * @param from - The old weekday, 0 for none yet
 * @param to - The new weekday
 */
function daysMove(form: Form, from: number, to: number): void {
    const move: (day: string) => string = (day: string): string =>
        from !== 0 && day !== "" && weekdayOf(day) === from ? dayAdd(day, to - from) : day;
    form.first = move(form.first);
    form.last = move(form.last);
    form.excepts = form.excepts.map(move).sort();
}

/**
 * Makes a field of a time or a day of the form, as the dialog has them, see `../day/times.ts`: plain, as wide as
 * its value, checking itself; what I type goes into the form as I type it, read as a time or a day.
 * - `input`: The field.
 *
 * @param kind - `time-field` or `date-field`
 * @param value - Its value at first, like `14:00` or `19.10.2026`
 * @param name - What it holds, for screen readers, like `Start of Monday`
 * @param take - Takes what is typed, `14:15` of `1415`, empty for no time or day
 * @returns The field
 */
function fieldOf(kind: string, value: string, name: string, take: (value: string) => void): HTMLInputElement {
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
        formChanged();
    });
    return input;
}

/**
 * Makes two fields of the form side by side with the range dash between them, as start and end of the dialog,
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
 * Makes the rows of the days of the form, each its weekday, picked from a list, and its times, with its `×` while
 * there are several; `+` beside the name of the first adds one more, with the times of the last; a weekday picked anew
 * moves the days of the form with it, see {@link daysMove}.
 * - `weekdays`: The weekdays to pick from.
 * - `plus`: The plus.
 *
 * @param form - The form
 * @returns The rows
 */
function slotRowsOf(form: Form): HTMLElement[] {
    const weekdays: Choice[] = [1, 2, 3, 4, 5, 6, 7].map((weekday: number): Choice =>
        ({ value: String(weekday), text: weekdayNameOf(weekday, true), group: "" }));
    const plus: HTMLButtonElement = document.createElement("button");
    plus.type = "button";
    plusPut(plus, "Add a day");
    plus.addEventListener("click", (): void => {
        const last: Slot = form.slots[form.slots.length - 1];
        form.slots.push({ weekday: 0, start: last.start, end: last.end });
        form.before.push(0);
        formFill();
    });
    return form.slots.map((slot: Slot, index: number): HTMLElement => {
        const value: HTMLElement = elementOf("div", "course-slot", "");
        const remove: HTMLButtonElement = document.createElement("button");
        remove.type = "button";
        crossPut(remove, "Remove the day");
        remove.addEventListener("click", (): void => {
            form.slots.splice(index, 1);
            form.before.splice(index, 1);
            formFill();
        });
        value.append(choicesOf({
            search: searchOf(weekdays), picked: slot.weekday === 0 ? [] : [String(slot.weekday)], many: false,
            adding: false, noun: "day",
            pick: (values: string[]): void => {
                const weekday: number = Number(values[0] ?? slot.weekday);
                daysMove(form, slot.weekday, weekday);
                slot.weekday = weekday;
                formFill();
            },
        }), rangeOf(fieldOf("time-field", slot.start, "Start", (time: string): void => {
            slot.start = time;
        }), fieldOf("time-field", slot.end, "End", (time: string): void => {
            slot.end = time;
        })), ...(form.slots.length > 1 ? [remove] : []));
        const row: HTMLElement = rowOf(index === 0 ? "Day" : "", value);
        if (index === 0)
            row.querySelector(".entry-name")?.append(plus);
        return row;
    });
}

/**
 * Makes the parts of `Online` picked as the place of the form, as the dialog has them, see `onlinePartsOf`
 * in `../day/categories.ts`: its software, who offers it and its passcode, then its link, which follows its software
 * as the address of its web app, see `standardLinkOf` in `../day/places.ts`, until I paste the link of the meeting.
 * - `online`: The parts of `Online` as they stand.
 * - `software`, `provider`, `passcode`, `link`: Fields of its parts and its link.
 * - `follows`: Whether the link follows the software.
 * - `write`: Writes the place and its link into the form, and shows the place's address.
 * - `parts`: The parts.
 *
 * @param form - The form
 * @param address - The address below the place, which shows the place as written
 * @returns The parts
 */
function onlinePartsOf(form: Form, address: HTMLAnchorElement): HTMLElement {
    const online: { software: string; provider: string; passcode: string } = onlineOf(form.location);
    const software: HTMLInputElement = partFieldOf("text", online.software, "Software of Online");
    const provider: HTMLInputElement = partFieldOf("text", online.provider, "Provider of Online");
    const passcode: HTMLInputElement = partFieldOf("text", online.passcode, "Passcode of Online");
    const link: HTMLInputElement = partFieldOf("url", form.locationLink, "Link of Online");
    let follows: boolean = form.locationLink === "" || form.locationLink === standardLinkOf(online.software);
    const write: () => void = (): void => {
        form.location = onlineLineOf({ software: software.value, provider: provider.value, passcode: passcode.value });
        addressShow(address, form);
        formChanged();
    };
    software.addEventListener("input", (): void => {
        if (follows) {
            link.value = standardLinkOf(software.value);
            form.locationLink = link.value;
        }
        write();
    });
    provider.addEventListener("input", write);
    passcode.addEventListener("input", write);
    link.addEventListener("input", (): void => {
        follows = false;
        form.locationLink = link.value.trim();
        write();
    });
    const parts: HTMLElement = elementOf("div", "field-parts", "");
    parts.append(partOf("Software", software), partOf("Provider", provider), partOf("Passcode", passcode),
        partOf("Link", link));
    return parts;
}

/**
 * Shows the address of the place of the form below it, small and grey, as the dialog does, a link to the link
 * of the place while it has one, the link itself for a place without address, nothing for no place.
 *
 * @param address - The address below the place
 * @param form - The form
 */
function addressShow(address: HTMLAnchorElement, form: Form): void {
    address.textContent = addressOf(form.location) === "" ? form.locationLink : addressOf(form.location);
    if (form.locationLink !== "")
        address.href = form.locationLink;
    else
        address.removeAttribute("href");
    address.hidden = address.textContent === "";
}

/**
 * Makes the row of the place of the form, picked as in the dialog, see `placeSearchOf` in `../day/categories.ts`:
 * my places, the most used first, with `Online`, and as I type the rooms of the university too, each with its address
 * grey beside it, see `placeChoiceOf` in `../day/places.ts`, the place of the series among them; below it its address,
 * a link, and for `Online` its parts, see {@link onlinePartsOf}. A place picked takes the link of my place or room,
 * `Online` picked anew none, as a new meeting.
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
        below: [address, ...(labelOf(form.location) === onlineName ? [onlinePartsOf(form, address)] : [])],
        pick: (values: string[]): void => {
            const line: string = values[0] ?? "";
            if (line === form.location)
                return;
            form.location = line;
            form.locationLink = labelOf(line) === onlineName ? "" : field?.links[line] ?? "";
            formFill();
        },
    }));
}

/**
 * Makes the row of who I am with in the form, as `With` of the dialog: the names my entries wrote, the most used
 * first, several, a name typed added, each with the address it had, else that of its last entry, else its standard
 * address, see `standardAddressOf` in `../day/entries.ts`.
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
 * Makes the row of the days the form leaves out: each day with its `×`, which takes it back, then a field to type one
 * more, like `24.12.2026`, taken once it is a day, by Enter or as I leave the field.
 * - `days`: The days and the field.
 * - `input`: The field.
 * - `take`: Takes the day typed.
 *
 * @param form - The form
 * @returns The row
 */
function exceptRowOf(form: Form): HTMLElement {
    const days: HTMLElement = elementOf("div", "course-excepts", "");
    const input: HTMLInputElement = fieldOf("date-field", "", "Day to leave out", (): void => {});
    const take: () => void = (): void => {
        const day: string | null = dateParse(input.value);
        if (day === null || form.excepts.includes(day))
            return;
        form.excepts = [...form.excepts, day].sort();
        formFill();
        formElement?.querySelector<HTMLInputElement>(".course-excepts input")?.focus();
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
    days.append(...form.excepts.map((day: string): HTMLElement => {
        const except: HTMLElement = elementOf("span", "course-except", dateTextOf(day));
        const remove: HTMLButtonElement = document.createElement("button");
        remove.type = "button";
        crossPut(remove, `Remove ${dateTextOf(day)}`);
        remove.addEventListener("click", (): void => {
            form.excepts = form.excepts.filter((other: string): boolean => other !== day);
            formFill();
        });
        except.append(remove);
        return except;
    }), input);
    return rowOf("Except", days);
}

/**
 * Makes the row of the group of the form of the tutorials of a module with groups: my group, picked from the groups,
 * each by its weekday, times and room; another one picked makes it mine from its next session on, see
 * `groupMine` in `reader/course.ts`, its days, place, people and dates then those of the group, so their rows hide.
 *
 * @param form - The form
 * @returns The row
 */
function groupRowOf(form: Form): HTMLElement {
    return rowOf("Group", choicesOf({
        search: searchOf(groupsOf(form.type).map((group: Group): Choice => ({
            value: group.rule.group, text: `Group ${group.rule.group}`, group: "",
            detail: `${group.rule.slots.map(slotTextOf).join(" · ")} · ${roomOf(group.rule.location)}`,
        }))),
        picked: form.group === "" ? [] : [form.group], many: false, adding: false, noun: "group",
        pick: (values: string[]): void => {
            form.group = values[0] ?? form.old?.group ?? "";
            formFill();
        },
    }));
}

/**
 * Builds the rows of the form of a series anew from what it holds, see the top of this file: its type, its group while
 * its type has groups, its days, place, people, first and last day and the days it leaves out, unless it makes a group
 * mine, then the boxes it makes; below them the hint when the reader does not take it, then the plan it writes into,
 * Cancel and Save.
 * - `form`: The form.
 * - `types`: The numbered types without series, for a new one.
 * - `rows`: Its rows.
 * - `preview`: The place of the boxes it makes.
 * - `fields`: The rows together.
 * - `buttons`: The plan, Cancel and Save.
 * - `cancel`, `save`: Cancel and Save.
 * - `hint`: The hint when the reader does not take it.
 */
function formFill(): void {
    if (typing === null || formElement === null)
        return;
    const form: Form = typing;
    const types: string[] = numberedTypes.filter((type: string): boolean =>
        type === form.type || !(shown?.series ?? []).some((series: Series): boolean => series.rule.type === type));
    const rows: HTMLElement[] = [rowOf("Type", choicesOf({
        search: searchOf(types.map(choiceOf)), picked: form.type === "" ? [] : [form.type], many: false,
        adding: false, locked: form.old !== null, noun: "type",
        pick: (values: string[]): void => {
            form.type = values[0] ?? "";
            form.group = "";
            formFill();
        },
    }))];
    if (groupsOf(form.type).length > 0)
        rows.push(groupRowOf(form));
    if (!mineMade(form))
        rows.push(...slotRowsOf(form), placeRowOf(form), withRowOf(form),
            rowOf("Dates", rangeOf(fieldOf("date-field", form.first === "" ? "" : dateTextOf(form.first), "First day",
                (day: string): void => {
                    form.first = day;
                }), fieldOf("date-field", form.last === "" ? "" : dateTextOf(form.last), "Last day",
                (day: string): void => {
                    form.last = day;
                }))), exceptRowOf(form));
    const preview: HTMLElement = elementOf("div", "course-preview", "");
    rows.push(rowOf("Boxes", preview));
    const fields: HTMLElement = elementOf("div", "panel-form", "");
    fields.append(...rows);
    const buttons: HTMLElement = elementOf("div", "panel-buttons", "");
    const cancel: HTMLButtonElement = document.createElement("button");
    const save: HTMLButtonElement = document.createElement("button");
    cancel.type = "button";
    iconPut(cancel, X, "Cancel");
    cancel.addEventListener("click", formClose);
    save.type = "submit";
    save.className = "panel-main";
    iconPut(save, Check, "Save");
    const hint: HTMLElement = elementOf("p", "panel-error", "Saving failed");
    hint.hidden = true;
    buttons.append(elementOf("span", "course-file", shown?.file ?? ""), cancel, save);
    formElement.replaceChildren(fields, hint, buttons);
    formChanged();
}

/**
 * Closes the form of a series without saving, and shows the course as loaded last, or loads it anew when a file
 * changed meanwhile.
 */
function formClose(): void {
    typing = null;
    formElement = null;
    if (waiting) {
        waiting = false;
        courseLoad().catch((error: unknown): void => console.error(error));
        return;
    }
    cardsShow();
}

/**
 * Saves the form of a series, see {@link formSend}, closes it and loads the course anew; when the reader does not take
 * it, the hint above the buttons says so and the form stays open.
 *
 * @throws {Error} - When the course cannot be loaded anew
 */
async function formSave(): Promise<void> {
    if (typing === null || !formReady(typing))
        return;
    try {
        await formSend(typing, false);
    } catch (error: unknown) {
        console.error(error);
        formElement?.querySelector(".panel-error")?.removeAttribute("hidden");
        return;
    }
    typing = null;
    formElement = null;
    waiting = false;
    await courseLoad();
}

/**
 * Closes the form of a series on Escape, wherever the focus is, like still on the pencil that opened it; not while
 * a list is open, which Escape closes first, see `listsStart` in `../day/choices.ts`, nor while a dialog is open
 * over the page, which Escape closes.
 *
 * @param event - Key pressed anywhere in the page
 */
function formEscape(event: KeyboardEvent): void {
    if (event.key === "Escape" && typing !== null && !event.defaultPrevented
        && document.querySelector("dialog[open]") === null)
        formClose();
}

/**
 * Opens the form of a series, see the top of this file: in its card filled as its rule reads back, or, for a new
 * series, after the cards, without type, its days and dates empty, its list of types open; one form at a time.
 * Enter confirms only its field, as in the dialog, Ctrl+Enter confirms it too and saves, like a day typed to leave
 * out, and Escape cancels, see {@link formEscape}.
 * - `form`: The form.
 * - `categories`: The categories, for its places and people.
 *
 * @param rule - The rule of the series as read back, `null` for a new series
 */
function formOpen(rule: Rule | null): void {
    typing = {
        type: rule?.type ?? "", old: rule, slots: rule?.slots.map((slot: Slot): Slot => ({ ...slot }))
            ?? [{ weekday: 0, start: "", end: "" }],
        before: rule?.slots.map((slot: Slot): number => slot.weekday) ?? [0], location: rule?.location ?? "",
        locationLink: rule?.locationLink ?? "", attendees: rule?.attendees ?? [], first: rule?.first ?? "",
        last: rule?.last ?? "", excepts: [...rule?.excepts ?? []], group: rule?.group ?? "",
    };
    formElement = document.createElement("form");
    formElement.className = "panel course-form";
    formElement.addEventListener("submit", (event: SubmitEvent): void => {
        event.preventDefault();
        formSave().catch((error: unknown): void => console.error(error));
    });
    formElement.addEventListener("keydown", (event: KeyboardEvent): void => {
        if (event.key !== "Enter" || !(event.target instanceof HTMLInputElement) || event.defaultPrevented)
            return;
        event.preventDefault();
        event.target.blur();
        if (event.ctrlKey)
            formSave().catch((error: unknown): void => console.error(error));
    });
    readerAsk<Category[]>(`/api/day/categories?now=${encodeURIComponent(new Date().toISOString())}`)
        .then((loaded: Category[]): void => {
            categories = loaded;
            formFill();
            cardsShow();
            if (rule === null)
                formElement?.querySelector<HTMLButtonElement>(".picker-line")?.click();
        }).catch((error: unknown): void => console.error(error));
}

/**
 * Shows the course of a module in its place on its page, see the top of this file, and loads it anew the moment
 * a file of my new system changes, see `../changes.ts`, or the dialog of an entry closes; its lists close on Escape
 * and on a click beside them, as in the dialog, see `listsStart` in `../day/choices.ts`, and its form on Escape,
 * see {@link formEscape}.
 *
 * @param element - Where the cards go, see `.overview-course` in `./editor.html`
 * @param folder - Name of the folder of the module, like `IN2028_BusinessAnalyticsMachineLearning`
 * @throws {Error} - When the reader cannot answer
 */
export async function courseShow(element: HTMLElement, folder: string): Promise<void> {
    place = element;
    module = folder;
    listsStart();
    document.addEventListener("keydown", formEscape);
    changesFollow((): void => {
        courseLoad().catch((error: unknown): void => console.error(error));
    });
    await courseLoad();
}
