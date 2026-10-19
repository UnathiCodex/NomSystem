/**
 * ## Categories
 *
 * Writes plan and log the same way, by category, in one dialog without a title, all its room for the fields,
 * one column of rows in the order of the file, each its name grey at the left, all names equally wide, and its value
 * at the right, like `Category  Skill`, see `choices.ts`: start and end fixed at the top, then the category, below it
 * each of its fields one after another, the note always at the bottom, a click on a row opening its one list right
 * under it, then `Save`; an empty field stays empty, without dash or placeholder. Esc closes an open list, else
 * the dialog, and a click beside the dialog closes it without saving. Enter in a field confirms only that field,
 * and the entry saves only by its check or by Ctrl+Enter, see {@link enterTake}. A new entry opens with the list
 * of the categories open. A changed entry of the log saves only while its file still holds it as the dialog opened it,
 * the first save winning, else the dialog says so above its buttons, see {@link entrySave}.
 * Every category has its `Summary`, the `SUMMARY` of its file, its `Place`, a way also `From` before its place,
 * and `With` right below its place, who I was with, see {@link withRowOf};
 * the summary of `Sleep` only `Night` or `Day`, a nap, that of `Way` my means of transport;
 * a value with steps shows them below its line while it is picked, with the note of its last entry;
 * `Body` is my body care, one or several, like `Shower` or `Caring, Shower`;
 * in the log, `Food` has its summary written by itself from its meals and its foods, each in a row of its own
 * with its own list, my meals of `Meals.md` and my foods, like `Käsesalat, Brot`, see `meal.ts`;
 * and `Cook` below them one tap for the meal eaten right after it, which the reader adds with the cooking,
 * pointing to it.
 * `Sport` in the log has below its place its workout, its exercises and its videos, see `sport.ts`, and no note,
 * since what I did stands in its rows.
 * `Skill` is a skill and a type or none side by side, like `IN2028` and `VO` or the project `WokFlow`, in plan and log,
 * written by the reader as the folder of its skill with the type in brackets, like
 * `IN2028 Business Analytics Machine Learning (VO)`, its place and its semester; in the log also
 * its chapters, documents and attempts at tasks, each with its result and my effort, see `skill.ts`.
 * Every entry can carry a free note, typed like start and end.
 * The categories come in the order the reader gives them, by their importance for my life, without `Drink`, since
 * water has its own tracker; a box of the plan offers all but those I don't plan, `Sleep`, `Food`, `Cook`
 * and `Game`.
 * Each list comes from the log, the most used first, searched as I type, see `choices.ts`;
 * the typed text can be added as a new value with `+ New summary` at the end of the list, which is then picked,
 * the one way to write a new summary or another one in place of the one picked, but to the summary of `Sleep`
 * and `Way`, which take no new ones.
 * Every summary has a pencil `✎` beside it, as a place has, that of `Skill` after its type, the same for every type,
 * which shows below it its link to type, like the page of an event, a web address, written as the `ALTREP` of its
 * `SUMMARY` and shown small and grey below the summary, opening it, see {@link summaryPartsOf}; while I type none,
 * the summary of `Skill` links the folder of its skill, for a type on into the folder of its material, which
 * the reader writes, shown there and grey in the field to type, see `skill.ts`.
 * Places, the place of an entry and where a way starts, are only my places of `Places.md`, the most used first,
 * each by its name, like `TUM Innenstadt`, its address grey beside it in the list; a picked one is written with its address,
 * as one line, like `TUM Innenstadt, Arcisstraße 21, 80333 München, Deutschland`; its row shows its name with a pencil `✎`
 * beside it and its address small and grey below it, which opens the link of the place, its `ALTREP`, when it has
 * one; the pencil shows its parts below it, see {@link minePartsOf}, its name, address, postcode with town, country
 * and link, each one row, as the foods of a meal stand, which change my place in `Places.md` as I type them, entries
 * written before keeping what they have; a new place goes into `Places.md` by its typed name when picked, its parts
 * showing below it at once, so I type them next, see {@link placeAdd}.
 * `Online`, the place of a meeting online, stands once among my places, but for a way, one generic place: picked,
 * it shows its parts the same way, typed per entry, its software, who offers it and its passcode in place of
 * an address, then its link, see {@link onlinePartsOf}.
 * A new entry or box, also one logged from a box, starts where the last way before it ended: a way its `From`,
 * every other category its place, with its link, as picked from the list, see {@link wayEndFill}; a way's place,
 * its goal, stays empty.
 * Plan and log use one and the same dialog with the same fields and lists, see `skill.ts`: an entry of the log
 * and a box of the plan alike have a start and an end, each a day like `13.10.2026` and a plain time, as calendar apps
 * write them: the day of the start, its calendar date, typed to move it to any other day, and the day of the end,
 * which fills itself with the day of the start, or the day after while the end time lies at or before
 * the start time, until I type over it, see {@link endDayFill}; all saved exactly as they show.
 * The times of a box may stay empty, a box of its day, but for a lecture imported from TUMonline, which keeps both,
 * see `reader/boxes.ts`; its start is its expected time, the minutes to its end its expected duration.
 * Only a to-do of the plan has one more field, its deadline, a day like `23.10.2026` with a time or without; a box
 * with a deadline lies on the day of its deadline and has no expected time, so start and end are off while
 * the day of a deadline is typed.
 * The dialog opens for the log from `+` below the time grid, from a range selected in the time grid,
 * and from a log entry that can be changed, to change it; for a box from `+` below the list of boxes,
 * and from a box that can be changed, to change it, or to log it instead, filled in as planned;
 * one that cannot, like an occurrence of a weekly lecture, opens it to be logged. A log entry logged from a box points
 * to it, also to an occurrence of a series, see `entries.ts`;
 * a box logged at its real time by dragging it into the log, or as expected by a tap, needs no dialog,
 * see `boxes.ts`. The dialog of an entry or a box being changed duplicates it with the copy at the left of its
 * buttons, see {@link entryDuplicate}.
 *
 * - `./choices.ts`: Pickers, each one line in a row with its name, its list on top.
 * - `./entries.ts`: Sends new, changed and removed entries to the reader, and names who I was with.
 * - `./meal.ts`: A meal of the log: its summary and its meals and foods, picked from one search, and its new meals.
 * - `./sport.ts`: A session of sport of the log: its workout, its exercises and its videos.
 * - `./places.ts`: The dialog of a place, which adds a new one with its address to `Places.md` or changes mine.
 * - `./skill.ts`: The fields of `Skill`: skill and type, place, semester, chapters, documents,
 *   and in the log attempts; the folder its summary links while I type no link.
 * - `./times.ts`: Turns dates into the values of time fields and back, writes and reads days like `13.10.2026`,
 *   and gives the times a box is logged at.
 * - `../skill/attempts.ts`: Names the category of skill entries.
 * - `../icons.ts`: Shows the icons of the copy, the bin and its question, Cancel and Save in their buttons,
 *   and the pencil of a place and of a summary; makes the plain question mark of the bin.
 * - `../search.ts`: Writes a name without accents for its standard address in `With`.
 * - `../reader.ts`: Asks the reader.
 * - `lucide`: The icons of the copy, the bin, Cancel, Save and the pencil.
 * - `fullcalendar`: Calendar that shows the entries.
 */

import { choiceOf, choicesOf, listsStart, rowOf, searchOf } from "./choices.ts";
import { boxAdd, boxChange, boxDelete, entryAdd, entryChange, entryDelete } from "./entries.ts";
import { cookName, foodName, mealCooked, mealFoods, mealOf, mealTitle } from "./meal.ts";
import { sportName, sportOpen, sportRead, sportRowsOf } from "./sport.ts";
import {
    addressPartsOf, labelOf, lineOf, mapsLinkIs, mapsLinkOf, onlineLineOf, onlineName, onlineOf, placeSend,
    standardLinkOf,
} from "./places.ts";
import {
    skillDaySet, skillFieldsShow, skillLinksRead, skillModuleType, skillPathOf, skillPathShow, skillPlaceShow,
    skillSave, skillSemesterOf,
} from "./skill.ts";
import { dateOf, dateParse, dateTextOf, timeFieldRead, timeFieldShow, timeOf } from "./times.ts";
import { dayOf, skillName } from "../skill/attempts.ts";
import { iconPut, QuestionMark } from "../icons.ts";
import { searchTextOf } from "../search.ts";
import { readerAsk } from "../reader.ts";
import { Check, Copy, Pencil, Trash, X } from "lucide";

import type { Calendar, EventApi } from "fullcalendar";
import type { Box } from "./boxes.ts";
import type { Choice } from "./choices.ts";
import type { Online, Place } from "./places.ts";
import type { Attendee, BoxFields, EntryFields } from "./entries.ts";
import type { ModuleType, SkillLinks, SkillValues } from "./skill.ts";


/**
 * Field of an entry a field of a category writes into: `title`, `from`, `location` or `with`, its people.
 */
type FieldKey = "title" | "from" | "location" | "with";

/**
 * Fields of a place, where an entry is and where a way starts, which share one list of places.
 */
const placeKeys: FieldKey[] = ["from", "location"];

/**
 * A field of a category, as the reader gives it.
 *
 * - `name`: Name shown, like `Summary`.
 * - `key`: Field of the entry it writes into.
 * - `values`: Values to pick, the most used first.
 * - `steps`: Steps of a value offered in the code, by the value, like the exercises of `Neck short`.
 * - `fixed`: Whether it takes only its values, like `Night` and `Day` of `Sleep`, and no new ones.
 * - `many`: Whether it takes several of its values, parted by `, `, like the means of a way, `U-Bahn, Bus`,
 *   or my body care, `Caring, Shower`, see {@link manyRowOf}, or the people of `With`, `Sophale, Willi`,
 *   see {@link withRowOf}; one when left out.
 * - `rooms`: For a field of a place, the rooms of the university in `Rooms.md`, each as the line an entry writes,
 *   which its list offers only as I search, see {@link placeSearchOf}; none for any other field.
 * - `links`: For a field of a place, the link of each of my places and rooms that has one, by its line,
 *   like `https://nav.tum.de/room/0509.EG.980`; for `With` the address of each name its last entry wrote,
 *   like `sophale@invalid`; none for any other field.
 */
type Field = {
    name: string;
    key: FieldKey;
    values: string[];
    steps: { [value: string]: string[] };
    fixed: boolean;
    many?: boolean;
    rooms: string[];
    links: { [value: string]: string };
};

/**
 * A category, as the reader gives it; without a field `title` its name would be the title, as in an old `Sleep`
 * written before it had its what.
 *
 * - `name`: Name of the category, like `Way`.
 * - `fields`: Its fields, in the order they are picked.
 * - `plan`: Whether a box of the plan may have it, all but those I don't plan.
 */
type Category = {
    name: string;
    fields: Field[];
    plan: boolean;
};

/**
 * What the dialog writes: an entry of the log, or a box of the plan.
 */
type EntryTarget = "log" | "box";

/**
 * What the dialog shows when it opens.
 *
 * - `target`: What the dialog writes, an entry of the log or a box of the plan.
 * - `start`: Start of an entry of the log; for a box any time on its day. Its day is the day of the times of the dialog.
 * - `end`: End of an entry of the log; for a box the same as `start`.
 * - `time`: Expected time of a box, `null` for none and for an entry of the log.
 * - `minutes`: Expected duration of a box in minutes, `null` for none and for an entry of the log.
 * - `category`: Category picked already, else `null`.
 * - `values`: Values picked already, by the field they write into; for `with` the names, like `Sophale, Willi`.
 * - `addresses`: Address of each name of `With` as the entry, the box or the box to log has it,
 *   or the one it is a copy of, like `sophale@invalid`; none for nobody.
 * - `titleLink`: Link of what it was, the `ALTREP` of its `SUMMARY`, as the entry, the box or the box to log has it,
 *   or the one it is a copy of, for a skill entry the folder of its skill or of its material, or a web address typed;
 *   empty for none.
 * - `locationLink`: Link of its place, its `ALTREP`, as the entry, the box or the box to log has it,
 *   or the one it is a copy of; empty for none.
 * - `note`: Note of the entry.
 * - `foods`: Foods of the meal the dialog changes, its lines `X-FOOD`; none for any other entry.
 * - `skill`: Skill, type, chapters, links and attempts of the skill entry the dialog changes or logs from a box;
 *   empty for any other entry.
 * - `plan`: Box a new entry of the log is logged from, else `null`.
 * - `entry`: Entry of the log the dialog changes, else `null`.
 * - `box`: Box the dialog changes, else `null`.
 */
type EntryOpening = {
    target: EntryTarget;
    start: Date;
    end: Date;
    time: Date | null;
    minutes: number | null;
    category: string | null;
    values: { [key in FieldKey]: string };
    addresses: { [name: string]: string };
    titleLink: string;
    locationLink: string;
    note: string;
    foods: string[];
    skill: SkillValues;
    plan: Box | null;
    entry: EventApi | null;
    box: Box | null;
};

/**
 * Category and what of my long neck session, which I rate my neck pain with, see {@link painRowOf}.
 */
const neckLong: [string, string] = ["Body", "Neck long"];

/**
 * Values of a skill entry that has none yet, for an entry of another category or a new one.
 */
const skillNone: SkillValues = {
    module: "", type: "", semester: "", title: "", titleLink: "", chapters: [], links: [], attempts: [],
};

/**
 * Categories with the values of their fields, as the reader gave them when the dialog opened.
 */
let categories: Category[] = [];

/**
 * Values picked in the lists of the fields, by the field they write into, empty for none.
 */
let values: { [key in FieldKey]: string } = { title: "", from: "", location: "", with: "" };

/**
 * What the open dialog shows.
 */
let opened: EntryOpening = {
    target: "log", start: new Date(), end: new Date(), time: null, minutes: null, category: null,
    values: { title: "", from: "", location: "", with: "" }, addresses: {}, titleLink: "", locationLink: "", note: "",
    foods: [], skill: skillNone, plan: null, entry: null, box: null,
};

/**
 * Link of `Online` picked as the place, as pasted, written as the `ALTREP` of its `LOCATION`, see
 * {@link onlinePartsOf}; empty for none and while another place is picked.
 */
let onlineLink: string = "";

/**
 * Field of a place whose place shows its parts below it, to type them, see {@link partsOf}: after a new place
 * is added or `Online` picked, or by its pencil; `null` while none does.
 */
let partsOpen: FieldKey | null = null;

/**
 * Line of the place just added, see {@link placeAdd}, so picking it shows its parts; empty for none.
 */
let addedLine: string = "";

/**
 * A link typed below a summary, a web address without spaces, like `https://github.com/UnathiCodex/NomSystem`,
 * as the reader takes it, see `linkForm` in `reader/places.ts`; any other link of a skill entry is the folder
 * the reader writes.
 */
const linkForm: RegExp = /^https?:\/\/\S+$/;

/**
 * Link of what the entry or the box was, typed below its summary by its pencil, see {@link summaryPartsOf},
 * written as the `ALTREP` of its `SUMMARY`, like the page of an event, a web address; empty for none, a skill entry
 * then linking the folder of its skill or of its material, which the reader writes.
 */
let summaryLink: string = "";

/**
 * Whether the summary shows its link to type below it, opened and closed by its pencil, see {@link summaryPartsOf}.
 */
let summaryOpen: boolean = false;

/**
 * Pencil beside the summary, its link below it and the field to type it as shown, see {@link summaryPartsOf};
 * `null` while no summary shows them.
 */
let summaryShown: [HTMLButtonElement, HTMLAnchorElement, HTMLInputElement] | null = null;

/**
 * Category picked, `null` before picking.
 */
let chosen: Category | null = null;

/**
 * The rows of a meal or a cooking of the log in place of its summary: its summary, written by itself, and its foods,
 * a meal also the cooking it draws from and its meals, see `meal.ts`, while `Food` or `Cook` is picked for the log;
 * `null` for every other category, whose summary is a plain field.
 */
let meal: HTMLElement[] | null = null;

/**
 * Whether the remove button was clicked once and waits for the second click.
 */
let removeAsked: boolean = false;

/**
 * My neck pain from 0 to 10 picked for a long neck session, empty for none.
 */
let pain: string = "";

/**
 * What the real minutes of the last entries like a box were loaded for last: its category, what, module and type,
 * so they load again only when one of them changes, see {@link realLoad}.
 */
let realSeen: string = "";

/**
 * Median of the real minutes of the last entries like a new box, see {@link realLoad}, `null` while none is loaded.
 */
let realMiddle: number | null = null;

/**
 * Whether I typed into the day of the end of a log entry since the dialog opened, so it no longer fills itself,
 * see {@link endDayFill}.
 */
let endDayTyped: boolean = false;

/**
 * Address of each name of `With` as the dialog has it, by name, like `sophale@invalid`: as the entry or the box had it,
 * or as typed by its pencil, see {@link withRowOf}; a name without one takes it by {@link personAddressOf}.
 */
let addresses: { [name: string]: string } = {};

/**
 * Whether the names of `With` show their addresses below them to type, opened and closed by its pencil,
 * see {@link withRowOf}.
 */
let withOpen: boolean = false;

/**
 * Place a new entry or box started with, where the last way before it ended, see {@link wayEndFill}, so a way picked
 * after it starts there instead of going there; empty while none was filled in.
 */
let placeFilled: string = "";



/**
 * Loads the categories with the values of their fields from the reader.
 *
 * @returns Categories in their order
 * @throws {Error} - When the reader gives no valid answer
 */
async function categoriesLoad(): Promise<Category[]> {
    const response: Response = await fetch(`/api/day/categories?now=${new Date().toISOString()}`);
    return await response.json();
}

/**
 * Gives the start of the entry or the box as the fields of the dialog say: its time on its typed day, like `01:45`
 * on `13.10.2026`, on the day the dialog opened with should the typed day be no date.
 * - `day`: Typed day, like `2026-10-13`.
 *
 * @returns Start of the entry
 */
function startRead(): Date {
    const day: string =
        dateParse((document.getElementById("entry-start-day") as HTMLInputElement).value) ?? dayOf(opened.start);
    return dateOf(new Date(`${day}T12:00:00`),
        timeFieldRead(document.getElementById("entry-start") as HTMLInputElement));
}

/**
 * Reads the values picked in the lists of the fields of the category picked.
 * - `picked`: Values by the field they write into, empty for a field the category does not have.
 *
 * @returns Values by the field they write into
 */
function valuesRead(): { [key in FieldKey]: string } {
    const picked: { [key in FieldKey]: string } = { title: "", from: "", location: "", with: "" };
    (chosen?.fields ?? []).forEach((field: Field): void => {
        picked[field.key] = values[field.key];
    });
    return picked;
}

/**
 * Tells whether the dialog lists foods: those of a meal or a cooking of the log, see `meal.ts`.
 *
 * @returns Whether `Food` or `Cook` is picked for the log and holds a food
 */
function foodsListed(): boolean {
    return [foodName, cookName].includes(chosen?.name ?? "") && opened.target === "log" && mealFoods().length > 0;
}

/**
 * Allows saving once a category is picked: every other field may stay empty, but the times, which the browser
 * asks for before it sends the form; a skill entry may stay without skill, and a task picked without result
 * is left out, see `skill.ts`. Called on every change of the fields, it also shows the pencil and the link
 * of the summary as it now is, see {@link summaryPartsShow}.
 */
function saveAllow(): void {
    (document.getElementById("entry-save") as HTMLButtonElement).disabled = chosen === null;
    summaryPartsShow();
    realLoad().catch((error: unknown): void => console.error(error));
}

/**
 * Loads how long the last three entries like a box really lasted, and gives a new box their median as its length,
 * see {@link endFill}, so I plan by what happened, not by a hope (Buehler 1994); the dialog shows them no more,
 * since a line of minutes under the deadline only puzzled me. Nothing for an entry of the log and while none is logged.
 * - `texts`: Category, what, module and type picked.
 * - `key`: The same as one text, to load only when they change.
 * - `real`: Minutes of the last entries like the box, the latest first.
 * - `sorted`: The same, the shortest first.
 *
 * @throws {Error} - When the reader cannot answer
 */
async function realLoad(): Promise<void> {
    const texts: BoxFields = textsRead();
    const key: string = JSON.stringify([opened.target, texts.category, texts.title, texts.module, texts.type]);
    if (key === realSeen)
        return;
    realSeen = key;
    realMiddle = null;
    if (opened.target !== "box" || texts.category === "")
        return;

    const real: number[] = await readerAsk<number[]>(`/api/day/real?${new URLSearchParams({
        category: texts.category, title: texts.title, module: texts.module, type: texts.type,
    })}`);
    if (key !== realSeen || real.length === 0)
        return;
    const sorted: number[] = [...real].sort((first: number, second: number): number => first - second);
    realMiddle = sorted[Math.floor(real.length / 2)];
    endFill();
}

/**
 * Fills the end of a new box while its time is empty, from its start and the median of the real minutes of the last
 * entries like it, see {@link realLoad}, like `16:00` to `18:30` for 150 minutes, with its day; nothing for a box
 * being changed, an entry of the log, a box without start time, or while no entry like it is logged.
 * - `end`: Field of the time of the end.
 * - `start`: Start of the box as typed.
 */
function endFill(): void {
    const end: HTMLInputElement = document.getElementById("entry-end") as HTMLInputElement;
    if (opened.target !== "box" || opened.box !== null || realMiddle === null || end.value.trim() !== ""
        || timeFieldRead(document.getElementById("entry-start") as HTMLInputElement) === "")
        return;
    const start: Date = startRead();
    timeFieldShow(end, new Date(start.getTime() + realMiddle * 60 * 1000));
    endDayFill();
}

/**
 * Puts the end of a session of sport at its start and the minutes of its videos after, as `sport.ts` asks while
 * it holds only videos, like `18:00` to `18:30` for two videos of 15 minutes, with its day; nothing while the start
 * has no time.
 *
 * @param minutes - Minutes of its videos together
 */
function endFit(minutes: number): void {
    if (timeFieldRead(document.getElementById("entry-start") as HTMLInputElement) === "")
        return;
    timeFieldShow(document.getElementById("entry-end") as HTMLInputElement,
        new Date(startRead().getTime() + minutes * 60 * 1000));
    endDayFill();
}

/**
 * Tells whether a field is one of a place, see {@link placeKeys}.
 *
 * @param field - Field of a category, like `From`
 * @returns Whether it picks a place
 */
function placeIs(field: Field): boolean {
    return placeKeys.includes(field.key);
}

/**
 * Takes a value picked into the list of every field of its kind that lacks it, like a new place,
 * because places are one list for every field of a place; a room picked stays among the rooms, which the list
 * offers only as I search, see {@link placeSearchOf}.
 *
 * @param field - Field the value was picked in
 * @param value - Value picked, maybe new
 */
function valueAdd(field: Field, value: string): void {
    (chosen?.fields ?? [])
        .filter((other: Field): boolean => (other.key === field.key || (placeIs(other) && placeIs(field)))
            && !other.values.includes(value) && !other.rooms.includes(value))
        .forEach((other: Field): void => {
            other.values.push(value);
        });
}

/**
 * Tells whether the dialog writes a long neck session into the log, which takes my neck pain.
 *
 * @returns Whether `Body` `Neck long` is picked for the log
 */
function neckLongPicked(): boolean {
    return opened.target === "log" && chosen?.name === neckLong[0] && values.title === neckLong[1];
}

/**
 * Builds the row of my neck pain for `Body` in the log: 0 to 10 one below the other, one picked by one tap, the outcome
 * my neck routine is judged by, see `reader/trackers.ts`; shown only while `Neck long` is picked.
 *
 * @returns Row, none for any other category or the plan
 */
function painRowOf(): HTMLElement[] {
    if (opened.target !== "log" || chosen?.name !== neckLong[0])
        return [];
    const row: HTMLElement = rowOf("Pain", choicesOf({
        search: searchOf(Array.from({ length: 11 }, (_: unknown, number: number): Choice =>
            ({ value: String(number), text: String(number), group: "" }))),
        picked: pain === "" ? [] : [pain],
        many: false,
        adding: false,
        pick: (picked: string[]): void => {
            pain = picked[0] ?? "";
        },
    }));
    row.id = "entry-pain";
    row.hidden = !neckLongPicked();
    return [row];
}

/**
 * Shows the steps of the value picked in a field, like the exercises of `Neck short`, one per line;
 * hides their place while the value picked has none.
 *
 * @param steps - Place of the steps below the picker of the field
 * @param field - Field with the steps of its values
 */
function stepsShow(steps: HTMLElement, field: Field): void {
    steps.replaceChildren(...(field.steps[values[field.key]] ?? []).map((step: string): HTMLLIElement => {
        const line: HTMLLIElement = document.createElement("li");
        line.textContent = step;
        return line;
    }));
    steps.hidden = steps.childElementCount === 0;
}

/**
 * Gives the value of a field that takes only its values, like my means of transport, for a value an older entry
 * wrote another way, like `U-Bahn` for `UBahn`: the value that reads the same without hyphens and spaces,
 * ignoring case; any other value as it is, also one no value reads like.
 * - `simple`: Writes a value without hyphens and spaces, in small letters.
 *
 * @param field - Field of the value, like the summary of `Way`
 * @param value - Value as written, like `UBahn`
 * @returns Value of the field, like `U-Bahn`
 */
function fixedValueOf(field: Field, value: string): string {
    const simple: (text: string) => string = (text: string): string => text.replace(/[-\s]/g, "").toLowerCase();
    if (!field.fixed || field.values.includes(value))
        return value;
    return field.values.find((candidate: string): boolean => simple(candidate) === simple(value)) ?? value;
}

/**
 * Makes the choice of a value of a field: a place by its name, see `labelOf` in `places.ts`, its address grey
 * beside it in the list, `Online` the names of its parts, see {@link onlineDetail}; any other value as it is.
 *
 * @param field - Field of the value, like `Place`
 * @param value - Value, like `TUM Innenstadt, Arcisstraße 21, 80333 München, Deutschland` or `Bahn`
 * @returns Choice, like one showing `TUM Innenstadt`
 */
function fieldChoiceOf(field: Field, value: string): Choice {
    return field.key === "title" ? choiceOf(value) : {
        value: value, text: labelOf(value), group: "",
        detail: labelOf(value) === onlineName ? onlineDetail : addressOf(value),
    };
}

/**
 * What `Online` shows grey beside it in the list of a place, in place of an address, see {@link fieldChoiceOf}:
 * the names of its parts, as {@link onlinePartsOf} shows them, so I see what I type for it; without its link,
 * as my places show their address without theirs.
 */
const onlineDetail: string = "Software, Provider, Passcode";

/**
 * Gives the address of a place as an entry writes it, the part after its name.
 *
 * @param line - Place like `TUM Innenstadt, Arcisstraße 21, 80333 München, Deutschland`, or only its name, like `Home Munich`
 * @returns Address like `Arcisstraße 21, 80333 München, Deutschland`, empty for none
 */
function addressOf(line: string): string {
    return line.includes(",") ? line.slice(line.indexOf(",") + 1).trim() : "";
}

/**
 * Gives the place offered in a field that the place picked is, by its name, as its field offers it: my place
 * of `Places.md`, or `Online`.
 *
 * @param field - Field of a place, like `From`
 * @returns The line of my place, like `TUM Innenstadt, Arcisstraße 21, 80333 München, Deutschland`, or `Online`,
 *   `undefined` while the place picked is none offered, like an older place by its name alone, or nothing is picked
 */
function mineOf(field: Field): string | undefined {
    const line: string = values[field.key];
    return line === "" ? undefined : field.values.find((value: string): boolean => labelOf(value) === labelOf(line));
}

/**
 * Shows the address of the place picked in a field below its label, small and grey, as a link that opens in a new tab
 * the link of the place: for `Online` the link typed below it, see {@link onlinePartsOf}, else the one the place
 * of the entry kept, its `ALTREP`, while it stays picked, else the link of my place in `Places.md`; plain text
 * for a place without link, which opens nothing; no address while no place is picked, the link itself for a place
 * with a link but without address, like `https://nav.tum.de/room/5602.EG.001`, so every place with a link opens it
 * here too, and nothing for an older place written by its name alone, like `Home Munich`, which has neither;
 * beside the label the pencil, which shows and hides the parts of the place, see {@link partsToggle}, while it is
 * one of mine or `Online`.
 * - `line`: The place picked.
 * - `kept`: The link of the place the entry kept, empty for none.
 * - `link`: The link to open, empty for none.
 *
 * @param pencil - The pencil beside the label, see {@link placePartsOf}
 * @param address - The address below the label
 * @param field - Field, like `Place`
 */
function placePartsShow(pencil: HTMLButtonElement, address: HTMLAnchorElement, field: Field): void {
    const line: string = values[field.key];
    const kept: string = field.key === "location" && line === opened.values.location ? opened.locationLink : "";
    const link: string = onlinePicked(field) ? onlineLink : kept !== "" ? kept : field.links[line] ?? "";
    address.textContent = addressOf(line) === "" ? link : addressOf(line);
    if (link !== "")
        address.href = link;
    else
        address.removeAttribute("href");
    address.hidden = address.textContent === "";
    pencil.hidden = mineOf(field) === undefined;
}

/**
 * Makes the pencil beside the label of the place picked in a field, which shows and hides its parts,
 * see {@link partsToggle}, and its address below the label, see {@link placePartsShow}.
 * - `pencil`: The pencil, `✎`.
 * - `address`: The address.
 *
 * @param field - Field of a place, like `Place`
 * @returns The pencil and the address
 */
function placePartsOf(field: Field): [HTMLButtonElement, HTMLAnchorElement] {
    const pencil: HTMLButtonElement = document.createElement("button");
    const address: HTMLAnchorElement = document.createElement("a");
    pencil.type = "button";
    pencil.className = "entry-pencil";
    iconPut(pencil, Pencil, "Change the place");
    pencil.addEventListener("click", (): void => partsToggle(field));
    address.className = "entry-address";
    address.target = "_blank";
    address.rel = "noopener";
    placePartsShow(pencil, address, field);
    return [pencil, address];
}

/**
 * Shows the rows of the places anew, with the other fields as picked: those of a skill entry where `skill.ts`
 * shows them, see `skillPlaceShow`, any other's with all fields, see {@link fieldsShow}.
 */
function placesShow(): void {
    if (chosen?.name === skillName)
        skillPlaceShow(placeRowsOf());
    else
        fieldsShow();
}

/**
 * Tells whether `Online` is picked in a field of a place.
 *
 * @param field - Field of the category picked, like `Place`
 * @returns Whether `Online` is picked
 */
function onlinePicked(field: Field): boolean {
    return placeIs(field) && labelOf(values[field.key]) === onlineName;
}

/**
 * Tells whether the place picked in a field shows its parts below it, see {@link partsOf}: while they are open
 * for the field and the place is one of mine or `Online`.
 *
 * @param field - Field of the category picked, like `Place`
 * @returns Whether its parts show
 */
function partsShown(field: Field): boolean {
    return partsOpen === field.key && mineOf(field) !== undefined;
}

/**
 * Shows the rows of the places anew, after the parts of a field opened or closed, the first part focused
 * while they show, so I type at once, found by the key of their field, see {@link partsOf}.
 *
 * @param field - Field of the place, like `Place`
 */
function partsShow(field: Field): void {
    placesShow();
    if (partsShown(field))
        document.querySelector<HTMLInputElement>(`#entry .field-parts[data-field="${field.key}"] input`)?.focus();
}

/**
 * Shows the parts of the place picked in a field below it, or hides them while they show, see {@link partsOf};
 * one field at a time shows them.
 *
 * @param field - Field of the place, like `Place`
 */
function partsToggle(field: Field): void {
    partsOpen = partsOpen === field.key ? null : field.key;
    partsShow(field);
}

/**
 * Makes the field of a part of a place, a plain field without placeholder, empty until I type or paste into it,
 * see {@link partsOf}.
 * - `input`: The field.
 *
 * @param type - Type of the field, `url` for a link, else `text`
 * @param value - What it holds at first, like `Arcisstraße 21`
 * @param name - What it holds, for screen readers, like `Address of the place`
 * @returns The field
 */
function partFieldOf(type: string, value: string, name: string): HTMLInputElement {
    const input: HTMLInputElement = document.createElement("input");
    input.type = type;
    input.value = value;
    input.autocomplete = "off";
    input.setAttribute("aria-label", name);
    return input;
}

/**
 * Makes a part of a place, see {@link partsOf}: its name small and grey, then its field; a click on the name puts
 * the focus into the field.
 * - `part`: The part, a label around name and field.
 * - `label`: Its name.
 *
 * @param name - Name of the part, like `Address`
 * @param input - Its field
 * @returns The part
 */
function partOf(name: string, input: HTMLInputElement): HTMLLabelElement {
    const part: HTMLLabelElement = document.createElement("label");
    const label: HTMLSpanElement = document.createElement("span");
    part.className = "field-part";
    label.className = "entry-name";
    label.textContent = name;
    part.append(label, input);
    return part;
}

/**
 * Builds the parts of the place picked in a field, as the foods of a meal and the documents of a chapter stand:
 * indented under the place with a thin grey line at their left, see `.field-parts` in `day.css`: for my place its name,
 * then for my place and for `Online` alike three parts in place of an address and the link last,
 * see {@link minePartsOf} and {@link onlinePartsOf}; they carry the key of their field, like `location`, so the dialog
 * finds them apart from those of another place and from the link of the summary.
 * - `element`: The parts.
 *
 * @param field - Field of the place, like `Place`
 * @param parts - Pencil and address of the place, see {@link placePartsOf}
 * @returns The parts
 */
function partsOf(field: Field, parts: [HTMLButtonElement, HTMLAnchorElement]): HTMLElement {
    const element: HTMLElement = onlinePicked(field) ? onlinePartsOf(field, parts) : minePartsOf(field, parts);
    element.dataset.field = field.key;
    return element;
}

/**
 * Takes my place as the reader wrote it into every field of a place, since places are one list: each offers its new
 * line in place of its old one, with its link, and a field that picked it takes the new line, like the place of the
 * entry whose parts I type; entries written before keep what they have.
 * - `line`: Its new line.
 *
 * @param old - Its line as it was, like `Café, Leopoldstraße 1, 80802 München, Deutschland`
 * @param place - The place as written
 */
function placeTake(old: string, place: Place): void {
    const line: string = lineOf(place);
    categories.flatMap((category: Category): Field[] => category.fields)
        .filter(placeIs)
        .forEach((other: Field): void => {
            other.values = other.values.map((value: string): string => value === old ? line : value);
            delete other.links[old];
            if (place.link !== "")
                other.links[line] = place.link;
        });
    (Object.keys(values) as FieldKey[])
        .filter((key: FieldKey): boolean => placeKeys.includes(key) && values[key] === old)
        .forEach((key: FieldKey): void => {
            values[key] = line;
        });
}

/**
 * Builds the parts of my place picked in a field, see {@link partsOf}: its name, which renames it, then its address,
 * its postcode with its town and its country, see `addressPartsOf` in `places.ts`, then its link, which follows
 * the address as the search of Google Maps while it is that search or empty, see `mapsLinkIs`, until I type a link
 * myself, like the NavigaTUM page of a room. A part goes into `Places.md` as I leave it, the row of my place changed,
 * see `placeSend` in `places.ts`, every field of a place taking it as written, see {@link placeTake}; a new name
 * shows the rows anew, the part I went on to keeping the cursor; when the reader does not take a part, like a name
 * another place has or a link that is no web address, a grey line says so.
 * - `line`: The line of my place, as last written.
 * - `street`, `town`, `country`: The parts of its address.
 * - `name`, `address`, `postcode`, `land`, `link`: Fields of the name, the street, the postcode with the town,
 *   the country and the link.
 * - `follows`: Whether the link follows the address.
 * - `typed`: The address as typed, its parts parted by commas.
 * - `hint`: Line saying that the reader did not take a part.
 * - `write`: Sends my place as typed and takes it as written.
 * - `element`: The parts.
 *
 * @param field - Field of the place, like `Place`
 * @param parts - Pencil and address of the place, see {@link placePartsOf}
 * @returns The parts
 */
function minePartsOf(field: Field, parts: [HTMLButtonElement, HTMLAnchorElement]): HTMLElement {
    let line: string = mineOf(field) ?? values[field.key];
    const [street, town, country]: [string, string, string] = addressPartsOf(addressOf(line));
    const name: HTMLInputElement = partFieldOf("text", labelOf(line), "Name of the place");
    const address: HTMLInputElement = partFieldOf("text", street, "Address of the place");
    const postcode: HTMLInputElement = partFieldOf("text", town, "Postcode and town of the place");
    const land: HTMLInputElement = partFieldOf("text", country, "Country of the place");
    const link: HTMLInputElement = partFieldOf("url", field.links[line] ?? "", "Link of the place");
    let follows: boolean = link.value === "" || mapsLinkIs(link.value, addressOf(line));
    const typed: () => string = (): string => [address, postcode, land]
        .map((part: HTMLInputElement): string => part.value.trim())
        .filter((part: string): boolean => part !== "").join(", ");
    const hint: HTMLParagraphElement = document.createElement("p");
    hint.className = "entry-none";
    hint.textContent = "Not saved: it needs a new name, and a link only as a web address";
    hint.hidden = true;
    const write: () => void = (): void => {
        placeSend({ name: name.value, address: typed(), link: link.value }, labelOf(line)).then((place: Place): void => {
            const renamed: boolean = place.name !== labelOf(line);
            const typing: string | null = document.activeElement?.getAttribute("aria-label") ?? null;
            placeTake(line, place);
            line = lineOf(place);
            hint.hidden = true;
            placePartsShow(parts[0], parts[1], field);
            if (!renamed)
                return;
            placesShow();
            document.querySelector<HTMLInputElement>(`#entry .field-parts input[aria-label="${typing}"]`)?.focus();
        }).catch((error: unknown): void => {
            console.error(error);
            hint.hidden = false;
        });
    };
    for (const part of [address, postcode, land])
        part.addEventListener("input", (): void => {
            if (follows)
                link.value = mapsLinkOf(typed());
        });
    link.addEventListener("input", (): void => {
        follows = false;
    });
    for (const part of [name, address, postcode, land, link])
        part.addEventListener("change", write);
    const element: HTMLElement = document.createElement("div");
    element.className = "field-parts";
    element.append(partOf("Name", name), partOf("Address", address), partOf("Postcode", postcode),
        partOf("Country", land), partOf("Link", link), hint);
    return element;
}

/**
 * Builds the parts of `Online` picked in a field, see {@link partsOf}, typed per entry: its software, who offers it
 * and its passcode in place of an address, see `Online` in `places.ts`, then its link, which follows its software
 * as the address of its web app, see `standardLinkOf`, while it is that address or empty, until I paste the link
 * of the meeting. Each change writes the line of the place anew, like `Online, Teams, Microsoft, Passcode Ab12Cd34`,
 * see `onlineLineOf`, shown as its address; its link goes along when the entry is saved, see {@link textsRead}.
 * - `online`: The parts of `Online` picked.
 * - `software`, `provider`, `passcode`, `link`: Fields of its parts and its link.
 * - `follows`: Whether the link follows the software.
 * - `write`: Writes the line of the place from the fields, and shows it as its address.
 * - `element`: The parts.
 *
 * @param field - Field of the place, like `Place`
 * @param parts - Pencil and address of the place, see {@link placePartsOf}
 * @returns The parts
 */
function onlinePartsOf(field: Field, parts: [HTMLButtonElement, HTMLAnchorElement]): HTMLElement {
    const online: Online = onlineOf(values[field.key]);
    const software: HTMLInputElement = partFieldOf("text", online.software, "Software of Online");
    const provider: HTMLInputElement = partFieldOf("text", online.provider, "Provider of Online");
    const passcode: HTMLInputElement = partFieldOf("text", online.passcode, "Passcode of Online");
    const link: HTMLInputElement = partFieldOf("url", onlineLink, "Link of Online");
    let follows: boolean = onlineLink === "" || onlineLink === standardLinkOf(online.software);
    const write: () => void = (): void => {
        values[field.key] = onlineLineOf({ software: software.value, provider: provider.value, passcode: passcode.value });
        placePartsShow(parts[0], parts[1], field);
    };
    software.addEventListener("input", (): void => {
        if (follows) {
            link.value = standardLinkOf(software.value);
            onlineLink = link.value;
        }
        write();
    });
    provider.addEventListener("input", write);
    passcode.addEventListener("input", write);
    link.addEventListener("input", (): void => {
        follows = false;
        onlineLink = link.value.trim();
        write();
    });
    const element: HTMLElement = document.createElement("div");
    element.className = "field-parts";
    element.append(partOf("Software", software), partOf("Provider", provider), partOf("Passcode", passcode),
        partOf("Link", link));
    return element;
}

/**
 * Shows the link of what the entry or the box was below its summary, small and grey, as a link that opens
 * in a new tab, like the address of a place, see {@link placePartsShow}: the link itself, like the page of an event;
 * for a skill entry while I type none the folder of its skill, which opens in this window, being NomSystem's own,
 * see `skillPathShow` in `skill.ts`, also grey
 * in the field to type; nothing while it has none; the pencil beside the summary while the summary names something,
 * see {@link titleRead}, a skill entry by its skill or its type.
 * - `pencil`, `link`, `field`: Pencil, link and field of the summary as shown.
 * - `skill`: Skill and type of a skill entry, `null` for any other entry.
 */
function summaryPartsShow(): void {
    if (summaryShown === null)
        return;
    const [pencil, link, field]: [HTMLButtonElement, HTMLAnchorElement, HTMLInputElement] = summaryShown;
    const skill: ModuleType | null = chosen?.name === skillName ? skillModuleType() : null;
    pencil.hidden = skill === null ? titleRead(valuesRead().title) === "" : skill.module === "" && skill.type === "";
    field.placeholder = skill === null ? "" : skillPathOf();
    if (skill !== null && summaryLink === "") {
        skillPathShow(link);
        return;
    }
    link.textContent = summaryLink;
    link.target = "_blank";
    if (summaryLink !== "")
        link.href = summaryLink;
    else
        link.removeAttribute("href");
    link.hidden = summaryLink === "";
}

/**
 * Makes the link of what the entry or the box was, as a place has its parts, see {@link placePartsOf}: the pencil
 * beside its summary, which shows and hides the link to type, the link below the summary, see {@link summaryPartsShow},
 * and below that the link to type, one part `Link` indented with the grey line at its left, see {@link partOf},
 * empty until I type or paste one, like the page of an event; it goes along when the entry is saved,
 * see {@link textsRead}. Every summary has them, that of a skill entry beside and below its skill and type,
 * see `skill.ts`.
 * - `pencil`: The pencil, `✎`.
 * - `link`: The link below the summary.
 * - `field`: The field of the link to type.
 * - `parts`: The part holding it, shown while the pencil opened it, see {@link summaryOpen}.
 *
 * @returns Pencil, link and the part to type it, to put beside and below the summary
 */
function summaryPartsOf(): [HTMLButtonElement, HTMLAnchorElement, HTMLElement] {
    const pencil: HTMLButtonElement = document.createElement("button");
    const link: HTMLAnchorElement = document.createElement("a");
    const field: HTMLInputElement = partFieldOf("url", summaryLink, "Link of the summary");
    const parts: HTMLElement = document.createElement("div");
    pencil.type = "button";
    pencil.className = "entry-pencil";
    iconPut(pencil, Pencil, "Change the link");
    link.className = "entry-address";
    link.rel = "noopener";
    parts.className = "field-parts";
    parts.append(partOf("Link", field));
    parts.hidden = !summaryOpen;
    pencil.addEventListener("click", (): void => {
        summaryOpen = !summaryOpen;
        parts.hidden = !summaryOpen;
        if (summaryOpen)
            field.focus();
    });
    field.addEventListener("input", (): void => {
        summaryLink = field.value.trim();
        summaryPartsShow();
    });
    summaryShown = [pencil, link, field];
    summaryPartsShow();
    return [pencil, link, parts];
}

/**
 * Puts the link of a meal or a cooking beside and below its summary, which `meal.ts` writes by itself from its foods,
 * see {@link summaryPartsOf}: the pencil right after the summary, the link and the part to type it below it.
 * - `value`: The summary with its link.
 *
 * @param row - The row of the summary, see `mealOf` in `meal.ts`
 */
function mealLinkPut(row: HTMLElement): void {
    const value: HTMLDivElement = document.createElement("div");
    value.append(row.lastElementChild as HTMLElement, ...summaryPartsOf());
    row.append(value);
}

/**
 * Tells the dialog that what is picked for a skill entry changed: shows the link of its summary anew, which follows
 * its skill, type and semester while I type none, see {@link summaryPartsShow}, and allows saving or not.
 */
function skillChanged(): void {
    summaryPartsShow();
    saveAllow();
}

/**
 * Adds a place typed that is none of mine yet, see the top of this file: the reader writes it into `Places.md`
 * at once by its name, a room into `Rooms.md`, and picked it shows its parts, so I type its address and its link
 * below it next, its name still to mend, see {@link minePartsOf}; nothing for an empty name, which no place has.
 * - `place`: The place as written.
 *
 * @param field - Field of a place, like `Place`
 * @param name - Typed name of the place, like `Café Rischart`
 * @returns The place as an entry writes it, its name alone, like `Café Rischart`, `null` when none is written
 * @throws {Error} - When the reader does not take it, like for a name another place has
 */
async function placeAdd(field: Field, name: string): Promise<string | null> {
    if (name.trim() === "")
        return null;
    const place: Place = await placeSend({ name: name, address: "", link: "" }, "");
    addedLine = lineOf(place);
    partsOpen = field.key;
    return addedLine;
}

/**
 * Builds the search of the list of a field of a place: while nothing is typed my places, the most used first,
 * and the place picked when it is none of them, like a room or an older place by its name alone, so its line
 * shows it by its label; as I type my places, then the rooms of the university, like `Audimax` or `0509` finding
 * `0509.EG.980 (Audimax Werner-von-Siemens-Hörsaal)`, each with its address beside it, see {@link fieldChoiceOf}.
 * - `line`: The place picked, empty for none.
 * - `shown`: Places the search looks through, each once.
 *
 * @param field - Field of a place, like `Place`
 * @returns Search for the picker
 */
function placeSearchOf(field: Field): (text: string) => Promise<Choice[]> {
    return async (text: string): Promise<Choice[]> => {
        const line: string = values[field.key];
        const shown: string[] = text.trim() !== "" ? [...new Set([...field.values, ...field.rooms])]
            : [...field.values, ...(line === "" || mineOf(field) !== undefined ? [] : [line])];
        return await searchOf(shown.map((value: string): Choice => fieldChoiceOf(field, value)))(text);
    };
}

/**
 * Builds the row of a field of the category picked: its name and one line showing its value, see {@link choicesOf},
 * whose list offers its values, the most used first, searched as I type, the typed text taken as a new value
 * with `+ New …`, see {@link valueAdd}, but in a field that takes no new values, like the summary of `Sleep`,
 * a new place written into `Places.md` by its name, see {@link placeAdd};
 * a field of a place offers the rooms of the university only as I search, see {@link placeSearchOf}.
 * A place shows by its name, once, however often it was used and whatever address an entry kept, which a place picked
 * again keeps, with its pencil beside it and its address below it, see {@link placePartsOf}; a summary with the steps
 * of the value picked below it, see {@link stepsShow}. A meal of the log has its summary, its meals and its foods
 * in place of the summary, see {@link meal}. A summary has its pencil beside it and its link below it,
 * see {@link summaryPartsOf}. A place shows its parts below it, see {@link partsOf}, once added and
 * as `Online` is picked, or by its pencil, and hides them as another place is picked; `Online` picked while the parts
 * of my place show, or a place added, shows its own parts in place of theirs; `Online` picked anew starts
 * without link, as a new meeting.
 * - `place`: Pencil and address of a place, `null` for any other field.
 * - `summary`: Pencil, link and the part to type it of a summary, see {@link summaryPartsOf}, none for a place.
 * - `steps`: Place of the steps of the field.
 * - `shown`: Whether the place shows its parts, see {@link partsShown}.
 *
 * @param field - Field of the category picked, like `Place`
 * @returns Its row, with the parts of its place where they show
 */
function fieldRowsOf(field: Field): HTMLElement[] {
    if (field.key === "with")
        return [withRowOf(field)];
    if (field.key === "title" && meal !== null)
        return meal;
    if (field.key === "title" && field.many === true && !asPlanned())
        return [manyRowOf(field)];
    const place: [HTMLButtonElement, HTMLAnchorElement] | null = field.key === "title" ? null : placePartsOf(field);
    const summary: HTMLElement[] = field.key === "title" ? summaryPartsOf() : [];
    const steps: HTMLElement = document.createElement("ul");
    const shown: boolean = partsShown(field);
    steps.className = "entry-steps";
    stepsShow(steps, field);
    return [rowOf(field.name, choicesOf({
        search: field.key !== "title" ? placeSearchOf(field) : (text: string): Promise<Choice[]> =>
            searchOf(field.values.map((value: string): Choice => fieldChoiceOf(field, value)))(text),
        picked: values[field.key] === "" ? [] : [mineOf(field) ?? values[field.key]],
        many: false,
        adding: !field.fixed,
        add: field.key === "title" ? undefined : (name: string): Promise<string | null> => placeAdd(field, name),
        noun: field.key === "title" ? "summary" : "place",
        aside: place !== null ? [place[0]] : summary.slice(0, 1),
        below: place === null ? [...summary.slice(1), steps] : [place[1], ...shown ? [partsOf(field, place)] : []],
        locked: field.key === "title" && asPlanned(),
        pick: (picked: string[]): void => {
            const line: string = picked[0] ?? "";
            const before: string = labelOf(values[field.key]);
            values[field.key] = field.key !== "title" && line !== "" && labelOf(line) === before
                ? values[field.key] : line;
            if (line !== "")
                valueAdd(field, line);
            if (place !== null && labelOf(line) !== before) {
                onlineLink = "";
                if (line === addedLine || labelOf(line) === onlineName)
                    partsOpen = field.key;
                else if (partsOpen === field.key)
                    partsOpen = null;
            }
            if (place !== null) {
                addedLine = "";
                placePartsShow(place[0], place[1], field);
            }
            stepsShow(steps, field);
            document.getElementById("entry-pain")?.toggleAttribute("hidden", !neckLongPicked());
            saveAllow();
            if (partsShown(field) !== shown || (shown && labelOf(line) !== before))
                partsShow(field);
        },
    }))];
}

/**
 * Builds the row of a summary of several values, like the means of a way, since I change on it, like U-Bahn then bus,
 * or my body care, like `Caring, Shower`:
 * one line of the row, the values picked concatenated as one summary, parted by `, `, like `U-Bahn, Bus`, which is
 * also how the entry writes them; its list, a menu, takes a value or takes it back by a click and stays open
 * for the next, see `many` in `choices.ts`, and takes a new value where the field takes new ones, like `Body`,
 * not `Way`. A way keeps the order picked, the order I rode in; any other summary the order of its list, the most used
 * first, a new value last, like `Caring, Shower`, see {@link rankOf}. While none is picked, the row empty without
 * a plus, as
 * every field of one value, since a click into it opens its list; its pencil beside it and its link below it,
 * see {@link summaryPartsOf}.
 * - `picked`: The values picked, in their order.
 * - `pencil`, `link`, `linkParts`: Pencil, link and the part to type it of the summary.
 *
 * @param field - Field of several values, like the summary of `Way` or `Body`
 * @returns Its row
 */
function manyRowOf(field: Field): HTMLElement {
    const picked: string[] = values[field.key] === "" ? [] : values[field.key].split(", ");
    const [pencil, link, linkParts]: [HTMLButtonElement, HTMLAnchorElement, HTMLElement] = summaryPartsOf();
    return rowOf(field.name, choicesOf({
        search: searchOf(field.values.map(choiceOf)), picked: picked, many: true, adding: !field.fixed,
        noun: "summary",
        aside: [pencil], below: [link, linkParts],
        order: field.fixed ? undefined : (chosen: string[]): string[] => [...chosen]
            .sort((first: string, second: string): number => rankOf(field, first) - rankOf(field, second)),
        pick: (chosen: string[]): void => {
            values[field.key] = chosen.join(", ");
            saveAllow();
        },
    }));
}

/**
 * Gives where a value stands in the list of a field, the most used first, a value not in it, a new one, after all.
 *
 * @param field - Field of several values, like the summary of `Body`
 * @param value - Value picked, like `Shower`
 * @returns Its place, from 0
 */
function rankOf(field: Field, value: string): number {
    const at: number = field.values.indexOf(value);
    return at === -1 ? field.values.length : at;
}

/**
 * Gives the standard address of a name of `With`: the name in small letters, ä, ö, ü and ß as ae, oe, ue and ss,
 * every other letter with an accent plainly, like é as e, see `searchTextOf` in `../search.ts`, every other character
 * but a–z and 0–9 a dot, like a space, never two in a row and none at either end, then `@invalid`, the ending
 * reserved for addresses that never work, so nothing reaches anybody, like `herr.mueller@invalid` of `Herr Müller`
 * and `jose.garcia@invalid` of `José García`.
 * - `local`: The part before `@`.
 *
 * @param name - Name, like `Herr Müller`
 * @returns Address, like `herr.mueller@invalid`
 */
function standardAddressOf(name: string): string {
    const local: string = searchTextOf(name.toLowerCase().replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue")
        .replace(/ß/g, "ss")).replace(/[^a-z0-9]+/g, ".").replace(/^\.|\.$/g, "");
    return `${local}@invalid`;
}

/**
 * Gives the address of a name of `With`: as the dialog has it, see {@link addresses}, else as its last entry wrote it,
 * else the standard one, see {@link standardAddressOf}.
 *
 * @param field - The field `With`, with the address of each name its last entry wrote
 * @param name - Name, like `Sophale`
 * @returns Address, like `sophale@invalid`
 */
function personAddressOf(field: Field, name: string): string {
    return addresses[name] ?? field.links[name] ?? standardAddressOf(name);
}

/**
 * Builds the parts below the names of `With`, see {@link withRowOf}: each name small and grey, then its address
 * to type, like `sophale@invalid`, if I ever want a real e-mail there, as the parts of a place stand,
 * see {@link partOf}; an address goes along as typed when the entry is saved, see {@link peopleRead}, an empty one
 * as the name's standard address.
 * - `input`: Field of the address of a name.
 *
 * @param field - The field `With`
 * @param names - Names picked, like `Sophale` and `Willi`
 * @returns The part of each name
 */
function withPartsOf(field: Field, names: string[]): HTMLLabelElement[] {
    return names.map((name: string): HTMLLabelElement => {
        const input: HTMLInputElement = partFieldOf("email", personAddressOf(field, name), `Address of ${name}`);
        input.addEventListener("input", (): void => {
            addresses[name] = input.value.trim() === "" ? standardAddressOf(name) : input.value.trim();
        });
        return partOf(name, input);
    });
}

/**
 * Builds the row of `With`, who I was with, one or more people or groups, mostly one group, like `Socials`,
 * sometimes several, like `Sophale, Willi`: one line of the row, the names picked parted by `, `, as the means
 * of a way, see {@link manyRowOf}; its list offers the names my earlier entries wrote, the most used first, takes
 * a name or takes it back by a click and stays open for the next, and adds a typed name, `Search or add a person`,
 * but none with a comma, which parts names; beside the line the pencil, while a name is picked, which shows below it
 * the address of each name to change, see {@link withPartsOf}. Who I was with shows only here, not in the time grid
 * or the plan.
 * - `picked`: The names picked, in their order.
 * - `pencil`: The pencil, `✎`.
 * - `parts`: The addresses below the names, shown while the pencil opened them.
 * - `show`: Shows the pencil and the addresses for the names picked.
 *
 * @param field - The field `With`
 * @returns Its row
 */
function withRowOf(field: Field): HTMLElement {
    const picked: string[] = values.with === "" ? [] : values.with.split(", ");
    const pencil: HTMLButtonElement = document.createElement("button");
    const parts: HTMLElement = document.createElement("div");
    const show: (names: string[]) => void = (names: string[]): void => {
        pencil.hidden = names.length === 0;
        parts.hidden = !withOpen || names.length === 0;
        parts.replaceChildren(...withPartsOf(field, names));
    };
    pencil.type = "button";
    pencil.className = "entry-pencil";
    iconPut(pencil, Pencil, "Change the addresses");
    pencil.addEventListener("click", (): void => {
        withOpen = !withOpen;
        show(values.with === "" ? [] : values.with.split(", "));
        if (withOpen)
            parts.querySelector("input")?.focus();
    });
    parts.className = "field-parts";
    parts.dataset.field = field.key;
    show(picked);
    return rowOf(field.name, choicesOf({
        search: searchOf(field.values.map(choiceOf)), picked: picked, many: true, adding: true,
        add: async (name: string): Promise<string | null> => name.includes(",") ? null : name.trim(),
        noun: "person",
        aside: [pencil], below: [parts],
        pick: (names: string[]): void => {
            values.with = names.join(", ");
            names.forEach((name: string): void => valueAdd(field, name));
            show(names);
            saveAllow();
        },
    }));
}

/**
 * Reads who I was with as picked in `With`, each name with its address, see {@link personAddressOf}.
 * - `field`: The field `With` of the category picked, `undefined` for none.
 *
 * @returns The people, none while none is picked
 */
function peopleRead(): Attendee[] {
    const field: Field | undefined = chosen?.fields.find((other: Field): boolean => other.key === "with");
    if (field === undefined || values.with === "")
        return [];
    return values.with.split(", ")
        .map((name: string): Attendee => ({ name: name, address: personAddressOf(field, name) }));
}

/**
 * Builds the rows of the place of a skill entry and of who I was with, the fields of `Skill` from the reader,
 * see {@link fieldRowsOf}, which `skill.ts` shows below skill and type.
 *
 * @returns The rows of the place and of `With`, none before `Skill` is picked
 */
function placeRowsOf(): HTMLElement[] {
    return (chosen?.fields ?? []).flatMap(fieldRowsOf);
}

/**
 * Tells whether the dialog logs a box of the plan that has a category, or changes an entry of the log logged from
 * a box, which points to it with `RELATED-TO`: its category and summary stay the plan's, so the link shows how
 * the plan was really done, while its times, place, people, semester and note change freely, like a lecture
 * watched online at home. A box without category leaves both open, to be picked.
 *
 * @returns Whether it does
 */
function asPlanned(): boolean {
    return opened.target === "log" && opened.category !== null
        && (opened.plan !== null || (opened.entry?.extendedProps.planned ?? "") !== "");
}

/**
 * Shows the fields of the category picked, each its rows, see {@link fieldRowsOf}, in the order of the file,
 * the same for every category, below the times and the category: what, then its place, a way where it starts
 * before its place, then who I was with, see {@link withRowOf};
 * after them for `Body` my neck pain, shown while `Neck long` is picked, see {@link painRowOf};
 * a meal of the log is its summary, see {@link meal}.
 * - `fields`: The fields of the category picked.
 */
function fieldsShow(): void {
    const fields: Field[] = chosen?.fields ?? [];
    document.getElementById("entry-fields")?.replaceChildren(...fields
        .filter((field: Field): boolean => field.key === "title").flatMap(fieldRowsOf));
    document.getElementById("entry-more")?.replaceChildren(...fields
        .filter((field: Field): boolean => field.key !== "title").flatMap(fieldRowsOf),
        ...painRowOf(), ...sportShown() ? sportRowsOf(saveAllow, endFit) : []);
    document.getElementById("entry-note")?.closest(".panel-field")?.toggleAttribute("hidden", sportShown());
    saveAllow();
}

/**
 * Tells whether the dialog shows a session of sport, with its workout, exercises and videos, see `sport.ts`.
 *
 * @returns Whether `Sport` is picked for the log
 */
function sportShown(): boolean {
    return chosen?.name === sportName && opened.target === "log";
}

/**
 * Loads where the last way before the start of the entry ended, from the reader; for a box without start time
 * the last way before the end of its day, like where I will be that day.
 * - `before`: The moment the way ended before.
 *
 * @returns Place, empty when there was no way before
 * @throws {Error} - When the reader gives no valid answer
 */
async function wayEndLoad(): Promise<string> {
    const before: Date = timeFieldRead(document.getElementById("entry-start") as HTMLInputElement) === ""
        ? dateOf(new Date(`${dayRead()}T12:00:00`), "23:59") : startRead();
    const response: Response = await fetch(`/api/day/way-end?before=${before.toISOString()}`);
    return await response.json();
}

/**
 * Fills in where a new entry or box starts, also one logged from a box, as where the last way before it ended,
 * see {@link wayEndLoad}: a way its `From`, every other category its place, while that field is empty; nothing for
 * an entry or a box being changed. The place is my place or room of that name as its list offers it, so it shows
 * with its link, as picked there, like `Mensa Leopoldstraße` for a Talk after a way that ended there; a way picked
 * after another category leaves the place filled in for it, so its place, its goal, stays empty; nothing once another
 * category was picked meanwhile.
 * - `way`: Whether the category is `Way`, which has the field `from`.
 * - `field`: The field to fill in, `From` of a way, else `Place`.
 * - `line`: The place where the last way ended, as that way wrote it.
 *
 * @param category - Category picked
 * @throws {Error} - When the reader gives no valid answer
 */
async function wayEndFill(category: Category): Promise<void> {
    const way: boolean = category.fields.some((field: Field): boolean => field.key === "from");
    const field: Field | undefined =
        category.fields.find((other: Field): boolean => other.key === (way ? "from" : "location"));
    if (way && placeFilled !== "" && values.location === placeFilled)
        values.location = "";
    if (field === undefined || opened.entry !== null || opened.box !== null || values[field.key] !== "")
        return;
    const line: string = await wayEndLoad();
    if (chosen !== category)
        return;
    values[field.key] = [...field.values, ...field.rooms]
        .find((value: string): boolean => line !== "" && labelOf(value) === labelOf(line)) ?? line;
    if (!way)
        placeFilled = values.location;
}

/**
 * Picks a category: shows its fields, keeping the places picked under the category before, but not its summary
 * with its link, and an older value of a field that takes only its values as that field writes it,
 * see {@link fixedValueOf}.
 * A new entry starts where the last way before it ended, see {@link wayEndFill}.
 * `Food` in the log shows its summary, its meals and its foods in place of the summary, with those of the meal being
 * changed, see `meal.ts`, built before its fields show, unless another category was picked meanwhile;
 * `Skill` shows its skill and type before the times, and its place, semester, chapters, documents and attempts
 * after them,
 * see `skill.ts`; `Sport` in the log loads my workouts, exercises and videos, with those of the session being changed,
 * see `sport.ts`.
 * - `changing`: Whether the dialog changes a meal, whose foods and what the meal starts with.
 * - `built`: The rows of the meal, its summary with its link, see {@link mealLinkPut}.
 *
 * @param category - Category to pick, or `null` for none yet
 * @throws {Error} - When the reader gives no valid answer
 */
async function categoryPick(category: Category | null): Promise<void> {
    values = chosen === null ? { ...opened.values } : { ...valuesRead(), title: "" };
    if (chosen !== null)
        summaryLink = "";
    summaryShown = null;
    chosen = category;
    (category?.fields ?? []).forEach((field: Field): void => {
        values[field.key] = (field.many === true ? values[field.key].split(", ") : [values[field.key]])
            .map((value: string): string => fixedValueOf(field, value)).join(", ");
    });
    meal = null;
    document.getElementById("entry-more")?.replaceChildren();
    if (category !== null)
        await wayEndFill(category);
    if (category?.name === skillName) {
        await skillFieldsShow(document.getElementById("entry-fields") as HTMLElement,
            document.getElementById("entry-more") as HTMLElement, placeRowsOf(), opened.target === "box",
            opened.category === skillName ? opened.skill : skillNone, dayRead(), asPlanned(), skillChanged,
            summaryPartsOf());
        skillChanged();
        return;
    }
    if ((category?.name === foodName || category?.name === cookName) && opened.target === "log") {
        const changing: boolean = opened.category === category.name;
        const built: HTMLElement[] = await mealOf(changing ? opened.foods : [], changing ? opened.values.title : "",
            saveAllow, category.name === cookName ? null
                : {
                    cooked: changing ? String(opened.entry?.extendedProps.cooked ?? "") : "", start: startRead(),
                    id: changing ? opened.entry?.id ?? "" : "",
                });
        if (chosen !== category)
            return;
        meal = built;
        mealLinkPut(built[0]);
    }
    if (category?.name === sportName && opened.target === "log") {
        await sportOpen(opened.category === sportName ? opened.entry?.extendedProps ?? null : null);
        if (chosen !== category)
            return;
    }
    fieldsShow();
}

/**
 * Shows the category of the dialog as its first row, one line like every field, whose list offers the categories
 * in the order the reader gives them, for a box only those I plan. While a log entry is changed, `Skill` stays apart:
 * a skill entry cannot become another category, nor another entry a skill entry, because only `reader/skill.ts` writes
 * the documents and attempts of a skill entry of the log; a skill box is a plain box, which may change its category.
 * - `offered`: The categories the list offers.
 */
function categoryShow(): void {
    const offered: Category[] = categories.filter((category: Category): boolean =>
        (opened.target === "log" || category.plan) && !(opened.target === "log" && opened.entry !== null
            && (category.name === skillName) !== (opened.category === skillName)));
    document.getElementById("entry-category")?.replaceChildren(rowOf("Category", choicesOf({
        search: searchOf(offered.map((category: Category): Choice => choiceOf(category.name))),
        picked: chosen === null ? [] : [chosen.name],
        many: false,
        adding: false,
        noun: "category",
        locked: asPlanned(),
        pick: (picked: string[]): void => {
            categoryPick(offered.find((category: Category): boolean => category.name === picked[0]) ?? null)
                .catch(errorShow);
        },
    })));
}

/**
 * Reads what the entry was, its `SUMMARY`: nothing for a skill entry, which the reader names itself
 * from its skill and type, like `IN2028 Business Analytics Machine Learning (VO)`, see `reader/documents.ts`,
 * a meal of the log with foods their names, see {@link mealTitle};
 * else what is picked, like `Night` of `Sleep`, or the name of a category without the field `title`.
 *
 * @param picked - What is picked in its list, empty for none
 * @returns What the entry was
 */
function titleRead(picked: string): string {
    if (chosen?.name === skillName)
        return "";
    if (foodsListed())
        return mealTitle();
    return chosen?.fields.some((field: Field): boolean => field.key === "title") ? picked : chosen?.name ?? "";
}

/**
 * Reads the text fields of the dialog, as an entry of the log and a box have them, a skill entry its place too,
 * like the room of a lecture imported into the plan, and its chapters and documents.
 * - `picked`: Values picked in the lists.
 * - `online`: Whether `Online` is the place, whose link goes along, see {@link onlinePicked}.
 * - `skill`: Skill and type of a skill entry, empty for any other entry.
 * - `links`: Chapters and documents of a skill entry, none for any other entry.
 *
 * @returns Category, what with its link, see {@link summaryLink}, place with the link of `Online`, where a way starts,
 *   who I was with, see {@link peopleRead}, module, type, semester, note, chapters and documents, as a box of the day
 *   the dialog opened with, without time, duration and deadline;
 *   the semester of a skill entry as picked, else of that day
 */
function textsRead(): BoxFields {
    const picked: { [key in FieldKey]: string } = valuesRead();
    const online: boolean = (chosen?.fields ?? []).some(onlinePicked);
    const skill: ModuleType = chosen?.name === skillName ? skillModuleType() : { module: "", type: "" };
    const links: SkillLinks =
        chosen?.name === skillName ? skillLinksRead() : { chapters: [], documents: [] };
    return {
        category: chosen?.name ?? "",
        title: titleRead(picked.title),
        titleLink: summaryLink,
        location: picked.location,
        locationLink: online ? onlineLink : undefined,
        from: picked.from,
        attendees: peopleRead(),
        module: skill.module,
        type: skill.type,
        semester: chosen?.name === skillName ? skillSemesterOf(dayOf(opened.start)) : "",
        note: (document.getElementById("entry-note") as HTMLTextAreaElement).value.trim(),
        day: dayOf(opened.start),
        time: null,
        minutes: null,
        deadline: "",
        ...links,
    };
}

/**
 * Gives the day of the entry as the fields of the dialog say: the typed day of its start, for a box with a deadline
 * the typed day of its deadline; the day the dialog opened with while the typed day is no date.
 * - `deadlineDay`: Typed day of the deadline of a box, `null` for none and for an entry of the log.
 * - `typed`: The typed day, `null` when it is no date.
 *
 * @returns Day like `2026-10-13`
 */
function dayRead(): string {
    const deadlineDay: string | null = opened.target === "box"
        ? dateParse((document.getElementById("entry-deadline-day") as HTMLInputElement).value) : null;
    const typed: string | null =
        deadlineDay ?? dateParse((document.getElementById("entry-start-day") as HTMLInputElement).value);
    return typed ?? dayOf(opened.start);
}

/**
 * Gives the end of the entry or the box as the fields of the dialog say: its time on the typed day of the end,
 * like `07:30` on `13.10.2026`, on the day of the start should the typed day be no date.
 * - `day`: Typed day of the end, like `2026-10-13`.
 *
 * @param start - Start of the entry, see {@link startRead}
 * @returns End of the entry
 */
function endRead(start: Date): Date {
    const day: string =
        dateParse((document.getElementById("entry-end-day") as HTMLInputElement).value) ?? dayOf(start);
    return dateOf(new Date(`${day}T12:00:00`), timeFieldRead(document.getElementById("entry-end") as HTMLInputElement));
}

/**
 * Fills the day of the end as the day of the start and the times are typed, until I type into it myself:
 * the day of the start, or the day after while the end time lies at or before the start time, like a night of sleep,
 * `12.10.2026 23:30` to `13.10.2026 07:30`; nothing while one of them is no day or no time.
 * - `day`: Typed day of the start, like `2026-10-12`.
 * - `start`, `end`: Typed start and end time, like `23:30` and `07:30`.
 * - `next`: The day after the typed day.
 */
function endDayFill(): void {
    const day: string | null = dateParse((document.getElementById("entry-start-day") as HTMLInputElement).value);
    const start: string = timeFieldRead(document.getElementById("entry-start") as HTMLInputElement);
    const end: string = timeFieldRead(document.getElementById("entry-end") as HTMLInputElement);
    if (endDayTyped || day === null || start === "" || end === "")
        return;
    const next: Date = new Date(`${day}T12:00:00`);
    next.setDate(next.getDate() + 1);
    const field: HTMLInputElement = document.getElementById("entry-end-day") as HTMLInputElement;
    field.value = dateTextOf(end <= start ? dayOf(next) : day);
    field.setCustomValidity("");
}

/**
 * Reads fields, note and times of the dialog for an entry of the log, and the box a new log entry is logged from,
 * also an occurrence of a series, which is a box of its own, see `reader/boxes.ts`.
 * The start is a plain time on the typed day, the calendar date of the start, see {@link startRead},
 * the end a plain time on its own typed day, see {@link endRead}, like a night of sleep: `12.10.2026`, `23:30`
 * to `07:30` on `13.10.2026`. What the fields show is exactly what is saved.
 * - `texts`: Text fields of the dialog.
 *
 * @returns Fields of the entry
 */
function fieldsRead(): EntryFields {
    const start: Date = startRead();
    const end: Date = endRead(start);
    const texts: BoxFields = textsRead();
    return {
        category: texts.category, title: texts.title, titleLink: texts.titleLink, location: texts.location,
        locationLink: texts.locationLink,
        from: texts.from, attendees: texts.attendees, module: texts.module, type: texts.type,
        semester: chosen?.name === skillName ? skillSemesterOf(dayOf(start)) : "", note: texts.note,
        foods: [foodName, cookName].includes(chosen?.name ?? "") ? mealFoods() : [],
        cooked: chosen?.name === foodName ? mealCooked() : "",
        planned: opened.entry === null ? opened.plan?.id ?? "" : "",
        pain: neckLongPicked() ? pain : "",
        ...sportShown() ? sportRead() : { workout: "", exercises: [], videos: [] },
        start: start,
        end: end,
    };
}

/**
 * Reads fields, note, start, end and deadline of the dialog for a box, as for an entry of the log: its day is the day
 * of its start, its expected time its start, its expected duration the minutes from its start to its end,
 * so `19.10.2026 09:15` to `10:45` moves a box of 12 October at 14:00 to 19 October at 09:15 for 90 minutes,
 * and the reader into the plan it belongs into; a box whose times stay empty lies on its day without time,
 * keeping the duration it had, like `00h 45m`; with a deadline it lies on the day of its deadline, without
 * expected time, start and end off, keeping the duration it had; an empty deadline is none.
 * - `day`: Typed day of the start, like `2026-10-19`, the day the dialog opened with should it be no date.
 * - `startTime`, `endTime`: Typed times of start and end, empty for none.
 * - `deadlineDay`: Typed day of the deadline, like `2026-10-23`, empty for none.
 * - `deadlineTime`: Typed time of the deadline, empty for none.
 * - `start`: Start of the box, `null` without start time.
 * - `minutes`: Minutes from its start to its end, the ones it had while both times stay empty, else `null`
 *   without both.
 *
 * @returns Fields of the box
 */
function boxFieldsRead(): BoxFields {
    const day: string =
        dateParse((document.getElementById("entry-start-day") as HTMLInputElement).value) ?? dayOf(opened.start);
    const startTime: string = timeFieldRead(document.getElementById("entry-start") as HTMLInputElement);
    const endTime: string = timeFieldRead(document.getElementById("entry-end") as HTMLInputElement);
    const deadlineDay: string =
        dateParse((document.getElementById("entry-deadline-day") as HTMLInputElement).value) ?? "";
    const deadlineTime: string = timeFieldRead(document.getElementById("entry-deadline-time") as HTMLInputElement);
    const start: Date | null = startTime === "" ? null : dateOf(new Date(`${day}T12:00:00`), startTime);
    let minutes: number | null = start === null || endTime === "" ? null
        : Math.round((endRead(start).getTime() - start.getTime()) / (60 * 1000));
    if (deadlineDay !== "" || (startTime === "" && endTime === ""))
        minutes = opened.minutes;
    return {
        ...textsRead(),
        semester: chosen?.name === skillName ? skillSemesterOf(deadlineDay === "" ? day : deadlineDay) : "",
        day: deadlineDay === "" ? day : deadlineDay,
        time: deadlineDay !== "" ? null : start,
        minutes: minutes,
        deadline: deadlineDay === "" || deadlineTime === "" ? deadlineDay
            : dateOf(new Date(`${deadlineDay}T12:00:00`), deadlineTime).toISOString(),
    };
}

/**
 * Shows a hint of the dialog, which stands below its rows, right above its buttons, see `day.html`, and scrolls
 * the dialog down to it, so a long one, like a meal of many foods, shows it too instead of keeping it below its rows.
 * - `dialog`: The dialog.
 *
 * @param id - Identifier of the hint, like `entry-error`
 */
function hintShow(id: string): void {
    const dialog: HTMLDialogElement = document.getElementById("entry") as HTMLDialogElement;
    document.getElementById(id)?.removeAttribute("hidden");
    dialog.scrollTo({ top: dialog.scrollHeight });
}

/**
 * Shows the hint that the reader did not take what the dialog sent, `Saving failed`, see {@link hintShow}.
 *
 * @param error - Error of the request
 */
function errorShow(error: unknown): void {
    console.error(error);
    hintShow("entry-error");
}

/**
 * Sends the new or changed box to the reader, then closes the dialog, after which the list of boxes loads again,
 * see `boxes.ts`.
 * - `fields`: Fields, note, start, end and deadline of the dialog.
 *
 * @throws {Error} - When the reader does not take the box
 */
async function boxSave(): Promise<void> {
    const fields: BoxFields = boxFieldsRead();
    if (opened.box !== null)
        await boxChange(opened.box.id, fields);
    else
        await boxAdd(fields);
    (document.getElementById("entry") as HTMLDialogElement).close();
}

/**
 * Sends the new or changed entry to the reader, into the log, then closes the dialog; a box goes into the plan,
 * see {@link boxSave}. A skill entry goes to the one writer of skill entries, see `skill.ts`.
 * A changed entry, a skill entry alike, goes with its fingerprint as the dialog opened it, and the reader writes it only
 * while its file still holds it so, see `entryChange` in `entries.ts` and `skillSave` in `skill.ts`: the first save
 * wins. When the file changed it since, like Eier renamed on the phone while the dialog on the laptop showed Eier,
 * nothing is saved and the dialog stays open, saying `Not saved: it changed on the disk, close and open it again`,
 * see {@link hintShow}; opened again, it shows the entry as the file holds it, to change and save once more.
 * - `fields`: Fields, note and times of the dialog.
 * - `version`: Fingerprint of the entry being changed as the dialog opened it, see `version` of `Entry`
 *   in `reader/calendar.ts`; empty for a new one.
 * - `saved`: Whether the reader wrote it, `false` when the file changed the entry since the dialog opened it.
 *
 * @param calendar - Calendar of the day
 * @throws {Error} - When the reader does not take the entry
 */
async function entrySave(calendar: Calendar): Promise<void> {
    if (opened.target === "box") {
        await boxSave();
        return;
    }
    const fields: EntryFields = fieldsRead();
    const version: string = opened.entry?.extendedProps.version ?? "";
    let saved: boolean = true;
    if (chosen?.name === skillName)
        saved = await skillSave(calendar, opened.entry?.id ?? "", fields, version);
    else if (opened.entry !== null)
        saved = await entryChange(calendar, opened.entry.id, fields, version);
    else
        await entryAdd(calendar, fields);
    if (saved)
        (document.getElementById("entry") as HTMLDialogElement).close();
    else
        hintShow("entry-changed");
}

/**
 * Removes the entry of the log or the box being changed on the second click, then closes the dialog;
 * the first click only asks, the bin turning into a question mark, `Really remove?` as its tooltip. A box planned by mistake is removed;
 * a box I decided against is dropped instead, with its cross in the list, so it can be counted.
 *
 * @param calendar - Calendar of the day
 * @throws {Error} - When the reader does not remove the entry or the box
 */
async function entryRemove(calendar: Calendar): Promise<void> {
    const button: HTMLButtonElement = document.getElementById("entry-remove") as HTMLButtonElement;
    if (!removeAsked) {
        removeAsked = true;
        iconPut(button, QuestionMark, "Really remove?");
        return;
    }

    if (opened.target === "box")
        await boxDelete(opened.box?.id ?? "");
    else
        await entryDelete(calendar, opened.entry?.id ?? "");
    (document.getElementById("entry") as HTMLDialogElement).close();
}

/**
 * Turns start and end of a box off while the day of a deadline is typed, since a box with a deadline lies on the day
 * of its deadline and has no expected time, so `23.10.2026` typed as deadline leaves them unread;
 * and asks for the day of a deadline while its time is typed, since a time alone is no deadline.
 * - `deadlineDay`, `deadlineTime`: Fields of the day and the time of the deadline.
 * - `off`: Whether start and end are off.
 */
function deadlineSee(): void {
    const deadlineDay: HTMLInputElement = document.getElementById("entry-deadline-day") as HTMLInputElement;
    const deadlineTime: HTMLInputElement = document.getElementById("entry-deadline-time") as HTMLInputElement;
    const off: boolean = opened.target === "box" && deadlineDay.value.trim() !== "";
    ["entry-start-day", "entry-start", "entry-end-day", "entry-end"].forEach((id: string): void => {
        (document.getElementById(id) as HTMLInputElement).disabled = off;
    });
    deadlineDay.required = deadlineTime.value.trim() !== "";
}

/**
 * Marks the row of the deadline empty while neither its day nor its time holds anything, so a phone shows it one line
 * high, its empty fields beside its name, as every empty row, see `.entry-deadline-empty` in `day.css`; looked at
 * when the dialog opens and when I leave one of its fields, never while I type, so the row never changes under
 * my finger.
 * - `row`: The row of the deadline.
 */
function deadlineEmptyShow(): void {
    const row: HTMLElement = document.getElementById("entry-deadline") as HTMLElement;
    row.classList.toggle("entry-deadline-empty", [...row.querySelectorAll("input")]
        .every((field: HTMLInputElement): boolean => field.value.trim() === ""));
}

/**
 * Shows the times of the dialog, the same for an entry of the log and a box of the plan: the day and the time
 * of the start and of the end, and for a box its deadline, hidden and disabled for an entry of the log,
 * so the browser checks only the times shown before it sends the form. The day of the start is the calendar date
 * of the start it opens with, like `13.10.2026` for a selection at 01:45 on 13 October, the day
 * of its end the calendar date of the end it opens with, which fills itself again as I type, see {@link endDayFill}.
 * A box starts at its expected time, on the day the dialog opened with, like `12.10.2026`, the shown day for a new one,
 * and ends after its expected duration; its times may stay empty, but for an event of the plan, which keeps both
 * and has no deadline, since only a to-do has one.
 * - `boxed`: Whether the dialog writes a box.
 * - `required`: Whether the times are needed: for an entry of the log and an event of the plan.
 * - `start`: Start shown, the expected time of a box, `null` for none.
 * - `end`: End shown, after the expected duration of a box, `null` for none.
 * - `deadline`: Deadline of the box being changed, empty for none and for a new box.
 *
 * @param opening - What the dialog shows
 */
function timesShow(opening: EntryOpening): void {
    const boxed: boolean = opening.target === "box";
    const required: boolean = !boxed || (opening.box !== null && !opening.box.todo);
    const start: Date | null = boxed ? opening.time : opening.start;
    const end: Date | null = !boxed ? opening.end : opening.time === null || opening.minutes === null ? null
        : new Date(opening.time.getTime() + opening.minutes * 60 * 1000);
    const startDay: HTMLInputElement = document.getElementById("entry-start-day") as HTMLInputElement;
    const endDay: HTMLInputElement = document.getElementById("entry-end-day") as HTMLInputElement;
    const startTime: HTMLInputElement = document.getElementById("entry-start") as HTMLInputElement;
    const endTime: HTMLInputElement = document.getElementById("entry-end") as HTMLInputElement;
    const deadlineRow: HTMLElement = document.getElementById("entry-deadline") as HTMLElement;
    const deadlineDay: HTMLInputElement = document.getElementById("entry-deadline-day") as HTMLInputElement;
    const deadline: string = opening.box?.deadline ?? "";
    startDay.value = dateTextOf(dayOf(opening.start));
    startDay.setCustomValidity("");
    endDay.value = dateTextOf(dayOf(end ?? opening.start));
    endDay.setCustomValidity("");
    endDayTyped = false;
    timeFieldShow(startTime, start);
    timeFieldShow(endTime, end);
    startTime.required = required;
    endTime.required = required;
    deadlineRow.hidden = required;
    deadlineRow.querySelectorAll("input").forEach((field: HTMLInputElement): void => {
        field.disabled = required;
    });
    deadlineDay.value = deadline === "" ? "" : dateTextOf(opening.box?.day ?? "");
    deadlineDay.setCustomValidity("");
    timeFieldShow(document.getElementById("entry-deadline-time") as HTMLInputElement,
        deadline === "" || deadline === opening.box?.day ? null : new Date(deadline));
    deadlineSee();
    deadlineEmptyShow();
}

/**
 * Shows the dialog as an opening says, a new one without category with the list of the categories open.
 * It has no title: below its fields, small and grey, the box a log entry comes from, with a pencil beside it to change
 * that box instead, when it can be changed; at the bottom the copy and the bin at the left, then cancel and save,
 * see `day.html`.
 * The first button, which the dialog focuses as it opens, loses the focus again, so its ring never looks like a pick.
 * - `dialog`: The dialog, open already when one of those two buttons opens it anew.
 * - {@link HTMLDialogElement#showModal}: Shows the dialog over the page, `Esc` closes it.
 *
 * @param opening - What the dialog shows
 * @throws {Error} - When the reader gives no valid answer
 */
async function entryShow(opening: EntryOpening): Promise<void> {
    const dialog: HTMLDialogElement = document.getElementById("entry") as HTMLDialogElement;
    categories = await categoriesLoad();
    opened = opening;
    onlineLink = labelOf(opening.values.location) === onlineName ? opening.locationLink : "";
    summaryLink = opening.category === skillName && !linkForm.test(opening.titleLink) ? "" : opening.titleLink;
    summaryOpen = false;
    partsOpen = null;
    addresses = { ...opening.addresses };
    withOpen = false;
    addedLine = "";
    placeFilled = "";
    chosen = null;
    realSeen = "";
    realMiddle = null;
    removeAsked = false;
    pain = String(opening.entry?.extendedProps.pain ?? "");

    (document.getElementById("entry-plan-title") as HTMLElement).textContent =
        opening.plan === null ? "" : `From the plan: ${opening.plan.title}`;
    document.getElementById("entry-plan")?.toggleAttribute("hidden", opening.target === "box" || opening.plan === null);
    document.getElementById("entry-plan-edit")?.toggleAttribute("hidden", opening.plan?.editable !== true);
    timesShow(opening);
    (document.getElementById("entry-note") as HTMLTextAreaElement).value = opening.note;
    iconPut(document.getElementById("entry-remove") as HTMLElement, Trash, "Remove");
    document.getElementById("entry-remove")?.toggleAttribute("hidden",
        opening.entry === null && (opening.box === null || opening.box.state === "done" || opening.box.series));
    document.getElementById("entry-duplicate")?.toggleAttribute("hidden",
        opening.entry === null && opening.box === null);
    document.getElementById("entry-error")?.setAttribute("hidden", "");
    document.getElementById("entry-changed")?.setAttribute("hidden", "");
    await categoryPick(categories.find((category: Category): boolean => category.name === opening.category) ?? null);
    categoryShow();
    if (!dialog.open)
        dialog.showModal();
    (document.activeElement as HTMLElement | null)?.blur();
    if (chosen === null)
        document.querySelector<HTMLButtonElement>("#entry-category .picker-line")?.click();
}

/**
 * Gives the names of who I was with as `With` shows them, parted by `, `.
 *
 * @param people - The people of an entry or a box
 * @returns Names, like `Sophale, Willi`, empty for nobody
 */
function namesOf(people: Attendee[]): string {
    return people.map((person: Attendee): string => person.name).join(", ");
}

/**
 * Gives the address of each person of an entry or a box by name, as it wrote them, see {@link addresses}.
 *
 * @param people - The people of an entry or a box
 * @returns Address by name, like `sophale@invalid` for `Sophale`
 */
function addressesOf(people: Attendee[]): { [name: string]: string } {
    return Object.fromEntries(people.map((person: Attendee): [string, string] => [person.name, person.address]));
}

/**
 * Opens the dialog for a new entry of the log with start and end, its day the calendar date of the start,
 * like `13.10.2026` for a selection at 01:45 on 13 October.
 *
 * @param start - Start of the new entry
 * @param end - End of the new entry
 * @throws {Error} - When the reader gives no valid answer
 */
export async function entryOpen(start: Date, end: Date): Promise<void> {
    await entryShow({
        target: "log", start: start, end: end, time: null, minutes: null, category: null,
        values: { title: "", from: "", location: "", with: "" }, addresses: {}, titleLink: "", locationLink: "",
        note: "", foods: [], skill: skillNone, plan: null, entry: null, box: null,
    });
}

/**
 * Opens the dialog for a new log entry of the last half hour before the time of now on the shown day, in quarter hours,
 * so on today's page the half hour before now: at 14:10 on 13.10.2026 from 13:30 to 14:00, its day the shown day;
 * only before 00:30 the half hour starts the evening before, so its day is the day before, like `13.10.2026`,
 * `23:45` to `00:15` at 00:20 on 14 October.
 * - `end`: The time of now on the shown day, in quarter hours.
 *
 * @param calendar - Calendar of the day
 * @throws {Error} - When the reader gives no valid answer
 */
export async function entryOpenNow(calendar: Calendar): Promise<void> {
    const end: Date = dateOf(calendar.view.currentStart, timeOf(new Date()));
    end.setMinutes(end.getMinutes() - end.getMinutes() % 15, 0, 0);
    await entryOpen(new Date(end.getTime() - 30 * 60 * 1000), end);
}

/**
 * Opens the dialog for a new skill entry of the log with start and end, `Skill` and its module picked, the rest as for
 * any new entry, like the place where the last way ended: the session the learning view asks for before it records,
 * see `../editor/session.ts`.
 *
 * @param module - Its module, like `IN2028`
 * @param start - Start of the new entry
 * @param end - End of the new entry
 * @throws {Error} - When the reader gives no valid answer
 */
export async function entryOpenSkill(module: string, start: Date, end: Date): Promise<void> {
    await entryShow({
        target: "log", start: start, end: end, time: null, minutes: null, category: skillName,
        values: { title: "", from: "", location: "", with: "" }, addresses: {}, titleLink: "", locationLink: "",
        note: "", foods: [], skill: { ...skillNone, module: module }, plan: null, entry: null, box: null,
    });
}

/**
 * Opens the dialog to log a box at a start and an end, like those of its drop into the log; a box with a category
 * comes with its category and fields picked as planned, its people too, a skill box with its skill, type, semester,
 * chapters and documents, see `skill.ts`, ready to save or to change, like a lecture with its chapters and slides;
 * a box without category, like a to-do another app wrote, without them.
 * - `planned`: Whether the box has a category.
 *
 * @param box - Box to log
 * @param start - Start of the log entry
 * @param end - End of the log entry
 * @throws {Error} - When the reader gives no valid answer
 */
export async function entryOpenFromBox(box: Box, start: Date, end: Date): Promise<void> {
    const planned: boolean = box.category !== "";
    await entryShow({
        target: "log", start: start, end: end, time: null, minutes: null, category: planned ? box.category : null,
        values: planned
            ? { title: box.title, from: box.from, location: box.location, with: namesOf(box.attendees) }
            : { title: "", from: "", location: "", with: "" },
        addresses: planned ? addressesOf(box.attendees) : {},
        titleLink: planned ? box.titleLink : "", locationLink: planned ? box.locationLink : "", note: "", foods: [],
        skill: {
            ...skillNone, module: box.module, type: box.type, semester: box.semester, chapters: box.chapters,
            links: box.links,
        },
        plan: box, entry: null, box: null,
    });
}

/**
 * Opens the dialog for a new box of a day, without category, time or duration.
 *
 * @param day - A date on the day of the box
 * @throws {Error} - When the reader gives no valid answer
 */
export async function boxOpenNew(day: Date): Promise<void> {
    await entryShow({
        target: "box", start: day, end: day, time: null, minutes: null, category: null,
        values: { title: "", from: "", location: "", with: "" }, addresses: {}, titleLink: "", locationLink: "",
        note: "", foods: [], skill: skillNone, plan: null, entry: null, box: null,
    });
}

/**
 * Opens the dialog to change a box of the new system, its fields picked, a skill box with its skill, type, chapters
 * and documents, its start and end typed as far as it has them.
 * - `day`: A date on its day, at its expected time when it has one.
 *
 * @param box - Box to change
 * @throws {Error} - When the reader gives no valid answer
 */
export async function boxOpenEdit(box: Box): Promise<void> {
    const day: Date = box.time === "" ? new Date(`${box.day}T12:00:00`) : new Date(box.time);
    await entryShow({
        target: "box", start: day, end: day, time: box.time === "" ? null : day, minutes: box.minutes,
        category: box.category === "" ? null : box.category,
        values: { title: box.title, from: box.from, location: box.location, with: namesOf(box.attendees) },
        addresses: addressesOf(box.attendees), titleLink: box.titleLink, locationLink: box.locationLink, note: box.note,
        foods: [],
        skill: {
            ...skillNone, module: box.module, type: box.type, semester: box.semester, chapters: box.chapters,
            links: box.links,
        },
        plan: null, entry: null, box: box,
    });
}

/**
 * Opens the dialog to change an entry of the log of the new system, its fields picked, a meal with its foods,
 * a skill entry with its skill, type, chapters, links and attempts.
 * - `props`: Fields of the entry as the reader gave them.
 * - `people`: Who I was with, as the reader gave them.
 *
 * @param entry - Entry to change
 * @throws {Error} - When the reader gives no valid answer
 */
export async function entryOpenEdit(entry: EventApi): Promise<void> {
    const props: { [field: string]: string } = entry.extendedProps;
    const people: Attendee[] = entry.extendedProps.attendees ?? [];
    await entryShow({
        target: "log", start: entry.start as Date, end: entry.end as Date, time: null, minutes: null,
        category: props.category ?? null,
        values: { title: entry.title, from: props.from ?? "", location: props.location ?? "", with: namesOf(people) },
        addresses: addressesOf(people),
        titleLink: props.titleLink ?? "", locationLink: props.locationLink ?? "", note: props.note ?? "",
        foods: entry.extendedProps.foods ?? [],
        skill: {
            module: props.module ?? "", type: props.type ?? "", semester: props.semester ?? "", title: entry.title,
            titleLink: props.titleLink ?? "",
            chapters: entry.extendedProps.chapters ?? [], links: entry.extendedProps.links ?? [],
            attempts: entry.extendedProps.attempts ?? [],
        },
        plan: null, entry: entry, box: null,
    });
}

/**
 * Opens the dialog anew for a copy of the entry of the log or the box it shows, as it was saved: a new entry
 * or a new box with the same category, fields, note, times and foods, a skill one with its skill, type, semester,
 * chapters and documents, but without its attempts, the box it was logged from and its deadline, so I change
 * what differs, like its day, and save it as one more; the entry or the box itself stays as it is.
 * A copy of a box is always a to-do, also that of a lecture imported from TUMonline.
 */
async function entryDuplicate(): Promise<void> {
    await entryShow({
        ...opened,
        skill: { ...opened.skill, title: "", titleLink: "", attempts: [] },
        plan: null, entry: null, box: null,
    });
}

/**
 * Checks the times before the dialog sends them, saying what is wrong at its field: the end lies after the start,
 * for an entry of the log and for a box with both times, and a box with the time of its end has the time of its start;
 * a box with a deadline has no times to check.
 * - `startTime`, `endTime`: Fields of the times of start and end.
 * - `field`: The field that is wrong, `null` for none.
 *
 * @returns Whether the times are right
 */
function timesCheck(): boolean {
    const startTime: HTMLInputElement = document.getElementById("entry-start") as HTMLInputElement;
    const endTime: HTMLInputElement = document.getElementById("entry-end") as HTMLInputElement;
    let field: HTMLInputElement | null = null;
    if (startTime.disabled)
        return true;
    if (timeFieldRead(startTime) === "" && timeFieldRead(endTime) !== "") {
        field = startTime;
        field.setCustomValidity("A start before the end");
    } else if (timeFieldRead(startTime) !== "" && timeFieldRead(endTime) !== ""
        && endRead(startRead()) <= startRead()) {
        field = document.getElementById("entry-end-day") as HTMLInputElement;
        field.setCustomValidity("The end lies after the start");
    }
    field?.reportValidity();
    return field === null;
}

/**
 * Takes Enter in the dialog, see the top of this file, for an entry of the log and a box of the plan alike:
 * Ctrl+Enter from any field saves it, as its check does, before the field sees the key; Enter in a field without
 * its own use of it, like a time, a day, a part of a place or an address of `With`, only confirms that field,
 * what I typed staying and the cursor leaving it, instead of sending the form; a field that uses Enter keeps it,
 * like a list taking its first match, the grams of a food opening the list again or a field of a food saving
 * that food, and the note keeps it as a new line.
 * - `form`: The form of the dialog.
 */
function enterTake(): void {
    const form: HTMLFormElement = document.getElementById("entry-form") as HTMLFormElement;
    form.addEventListener("keydown", (event: KeyboardEvent): void => {
        if (event.key !== "Enter" || !event.ctrlKey)
            return;
        event.preventDefault();
        event.stopPropagation();
        form.requestSubmit();
    }, true);
    form.addEventListener("keydown", (event: KeyboardEvent): void => {
        if (event.key !== "Enter" || event.defaultPrevented || !(event.target instanceof HTMLInputElement))
            return;
        event.preventDefault();
        event.target.blur();
    });
}

/**
 * Starts the entry by category after the router has put its HTML into the page:
 * the copy duplicates the entry or the box being changed, see {@link entryDuplicate}, the pencil beside the box being
 * logged changes that box; the dialog logs no box, since the menu of the box in the plan does that already;
 * typing a deadline turns start and end of a box off, see {@link deadlineSee}; typing the day, start or end
 * fills the day of the end, see {@link endDayFill}, until I type that day myself, and a start typed for a new box
 * its end, see {@link endFill}; typing a day of a skill entry gives it the semester of that day while I picked none,
 * see `skillDaySet` in `skill.ts`; times that are not right are not sent, see {@link timesCheck}; Enter confirms
 * only its field, see {@link enterTake};
 * the dialog of a new place starts too, see `places.ts`.
 * - `endDay`: Field of the day of the end.
 *
 * @param calendar - Calendar of the day
 */
export function categoriesStart(calendar: Calendar): void {
    listsStart();
    iconPut(document.getElementById("entry-cancel") as HTMLElement, X, "Cancel");
    iconPut(document.getElementById("entry-save") as HTMLElement, Check, "Save");
    document.getElementById("entry-cancel")?.addEventListener("click", (): void =>
        (document.getElementById("entry") as HTMLDialogElement).close());
    document.getElementById("entry-remove")?.addEventListener("click", (): void => {
        entryRemove(calendar).catch(errorShow);
    });
    iconPut(document.getElementById("entry-duplicate") as HTMLElement, Copy, "Duplicate");
    iconPut(document.getElementById("entry-plan-edit") as HTMLElement, Pencil, "Change the box in the plan");
    document.getElementById("entry-duplicate")?.addEventListener("click", (): void => {
        entryDuplicate().catch(errorShow);
    });
    document.getElementById("entry-plan-edit")?.addEventListener("click", (): void => {
        if (opened.plan !== null)
            boxOpenEdit(opened.plan).catch(errorShow);
    });
    ["entry-deadline-day", "entry-deadline-time"].forEach((id: string): void => {
        document.getElementById(id)?.addEventListener("input", deadlineSee);
        document.getElementById(id)?.addEventListener("change", deadlineEmptyShow);
    });
    ["entry-start-day", "entry-start", "entry-end"].forEach((id: string): void =>
        document.getElementById(id)?.addEventListener("input", endDayFill));
    document.getElementById("entry-start")?.addEventListener("change", endFill);
    ["entry-start-day", "entry-deadline-day"].forEach((id: string): void =>
        document.getElementById(id)?.addEventListener("input", (): void => {
            if (chosen?.name === skillName)
                skillDaySet(dayRead());
        }));
    const endDay: HTMLInputElement = document.getElementById("entry-end-day") as HTMLInputElement;
    endDay.addEventListener("input", (): void => {
        endDayTyped = true;
    });
    enterTake();
    document.getElementById("entry-form")?.addEventListener("submit", (event: SubmitEvent): void => {
        event.preventDefault();
        if (timesCheck())
            entrySave(calendar).catch(errorShow);
    });
}
