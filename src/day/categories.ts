/**
 * ## Categories
 *
 * Writes plan and log the same way, by category, in one dialog without a title, all its room for the fields,
 * one column of rows in the order of the file, each its name grey at the left, all names equally wide, and its value
 * at the right, like `Category  Skill`, see `choices.ts`: start and end fixed at the top, then the category, below it
 * each of its fields one after another, the note always at the bottom, a click on a row opening its one list right
 * under it, then `Save`; an empty field stays empty, without dash or placeholder. Esc closes an open list, else
 * the dialog, and a click beside the dialog closes it without saving. A new entry opens with the list
 * of the categories open.
 * Every category has its `Summary`, the `SUMMARY` of its file, and its `Place`, a way also `From` before its place;
 * the summary of `Sleep` only `Night` or `Day`, a nap, that of `Way` my means of transport;
 * a value with steps shows them below its line while it is picked, with the note of its last entry;
 * `Body` is my body care, like `Shower`;
 * in the log, `Food` has its summary written by itself from its meals and its foods, each in a row of its own
 * with its own list, my meals of `Meals.md` and my foods, like `Käsesalat, Brot`, see `meal.ts`;
 * and `Cook` below them one tap for the meal eaten right after it, which the reader adds with the cooking,
 * pointing to it.
 * `Skill` is a skill and a type or none side by side, like `IN2028` and `VO` or the project `WokFlow`, in plan and log,
 * written by the reader as the folder of its skill with the type in brackets, like
 * `IN2028_BusinessAnalyticsMachineLearning (VO)`, its place and its semester; in the log also
 * its chapters, documents and attempts at tasks, each with its result and my effort, see `skill.ts`.
 * Every entry can carry a free note, typed like start and end.
 * The categories come in the order the reader gives them, by their importance for my life, without `Drink`, since
 * water has its own tracker; a box of the plan offers all but those I don't plan, `Sleep`, `Food`, `Cook`
 * and `Game`.
 * Each list comes from the log, the most used first, searched as I type, see `choices.ts`;
 * the typed text can be added as a new value with `+ New summary` at the end of the list, which is then picked,
 * the one way to write a new summary or another one in place of the one picked, but to the summary of `Sleep`
 * and `Way`, which take no new ones.
 * Places, the place of an entry and where a way starts, are only my places of `Places.md`, the most used first,
 * each by its name, like `TumMain`, its address grey beside it in the list; a picked one is written with its address,
 * as one line, like `TumMain, Arcisstraße 21, 80333 München, Deutschland`; its row shows its name with a pencil `✎`
 * beside it and its address small and grey below it, which opens the link of the place, its `ALTREP`, when it has
 * one; the pencil changes my place in `Places.md`, its name, its address and its link, and nothing else, entries
 * written before keeping what they have;
 * a new place is added with its address and maybe its link through a small dialog before it is picked,
 * see `places.ts`.
 * `From` starts where the last way before the entry ended.
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
 * from a suggested study session, filled in as suggested, see `suggestions.ts`,
 * and from a box that can be changed, to change it, or to log it instead, filled in as planned;
 * one that cannot, like an occurrence of a weekly lecture, opens it to be logged. A log entry logged from a box points
 * to it, also to an occurrence of a series, see `entries.ts`;
 * a box logged at its real time by dragging it into the log, or as expected by a tap, needs no dialog,
 * see `boxes.ts`. The dialog of an entry or a box being changed duplicates it with the copy at the left of its
 * buttons, see {@link entryDuplicate}.
 *
 * - `./choices.ts`: Pickers, each one line in a row with its name, its list on top.
 * - `./entries.ts`: Sends new, changed and removed entries to the reader.
 * - `./meal.ts`: A meal of the log: its summary, its meals and its foods, each picked from its own list.
 * - `./places.ts`: The dialog of a place, which adds a new one with its address to `Places.md` or changes mine.
 * - `./skill.ts`: The fields of `Skill`: skill and type, place, semester, chapters, documents,
 *   and in the log attempts.
 * - `./times.ts`: Turns dates into the values of time fields and back, writes and reads days like `13.10.2026`,
 *   and gives the times a box is logged at.
 * - `../skill/attempts.ts`: Names the category of skill entries.
 * - `../icons.ts`: Shows the icons of the copy, the bin and its question, Cancel and Save in their buttons,
 *   and the pencil of a place.
 * - `lucide`: The icons of the copy, the bin and its question, Cancel, Save and the pencil.
 * - `fullcalendar`: Calendar that shows the entries.
 */

import { choiceOf, choicesOf, listsStart, rowOf, searchOf } from "./choices.ts";
import { boxAdd, boxChange, boxDelete, entryAdd, entryChange, entryDelete } from "./entries.ts";
import { foodName, mealFoods, mealOf, mealTitle } from "./meal.ts";
import { labelOf, lineOf, placeEdit, placeOpen, placesStart } from "./places.ts";
import {
    skillDaySet, skillFieldsShow, skillLinksRead, skillModuleType, skillPlaceShow, skillSave, skillSemesterOf,
} from "./skill.ts";
import { boxTimesOf, dateOf, dateParse, dateTextOf, lengthOf, timeFieldRead, timeFieldShow, timeOf } from "./times.ts";
import { dayOf, skillName } from "../skill/attempts.ts";
import { iconPut } from "../icons.ts";
import { Check, CircleCheck, CircleQuestionMark, Copy, Pencil, Trash, X } from "lucide";

import type { Calendar, EventApi } from "fullcalendar";
import type { Box } from "./boxes.ts";
import type { Choice } from "./choices.ts";
import type { Place } from "./places.ts";
import type { BoxFields, EntryFields } from "./entries.ts";
import type { ModuleType, SkillLinks, SkillValues } from "./skill.ts";


/**
 * Field of an entry a field of a category writes into: `title`, `from` or `location`.
 */
type FieldKey = "title" | "from" | "location";

/**
 * A field of a category, as the reader gives it.
 *
 * - `name`: Name shown, like `Summary`.
 * - `key`: Field of the entry it writes into.
 * - `values`: Values to pick, the most used first.
 * - `steps`: Steps of a value offered in the code, by the value, like the exercises of `Neck short`.
 * - `fixed`: Whether it takes only its values, like `Night` and `Day` of `Sleep`, and no new ones.
 * - `rooms`: For a field of a place, the rooms of the university in `Rooms.md`, each as the line an entry writes,
 *   which its list offers only as I search, see {@link placeSearchOf}; none for any other field.
 * - `links`: For a field of a place, the link of each of my places and rooms that has one, by its line,
 *   like `https://nav.tum.de/room/0509.EG.980`; none for any other field.
 */
type Field = {
    name: string;
    key: FieldKey;
    values: string[];
    steps: { [value: string]: string[] };
    fixed: boolean;
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
 * - `values`: Values picked already, by the field they write into.
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
    note: string;
    foods: string[];
    skill: SkillValues;
    plan: Box | null;
    entry: EventApi | null;
    box: Box | null;
};

/**
 * Category of cooking, which offers the meal eaten right after it, and whose what is a dish, as a meal's is.
 */
export const cookName: string = "Cook";

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
let values: { [key in FieldKey]: string } = { title: "", from: "", location: "" };

/**
 * What the open dialog shows.
 */
let opened: EntryOpening = {
    target: "log", start: new Date(), end: new Date(), time: null, minutes: null, category: null,
    values: { title: "", from: "", location: "" }, note: "", foods: [], skill: skillNone, plan: null, entry: null, box: null,
};

/**
 * Category picked, `null` before picking.
 */
let chosen: Category | null = null;

/**
 * The rows of a meal of the log in place of its summary: its summary, written by itself, its meals and its foods,
 * see `meal.ts`, while `Food` is picked for the log; `null` for every other category, whose summary is a plain field.
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
 * What the real minutes under the minutes of a box were loaded for last: its category, what, module and type,
 * so they load again only when one of them changes.
 */
let realSeen: string = "";

/**
 * Median of the real minutes of the last entries like a new box, see {@link realShow}, `null` while none is loaded.
 */
let realMiddle: number | null = null;

/**
 * Whether I typed into the day of the end of a log entry since the dialog opened, so it no longer fills itself,
 * see {@link endDayFill}.
 */
let endDayTyped: boolean = false;



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
    const picked: { [key in FieldKey]: string } = { title: "", from: "", location: "" };
    (chosen?.fields ?? []).forEach((field: Field): void => {
        picked[field.key] = values[field.key];
    });
    return picked;
}

/**
 * Tells whether the dialog lists foods: those of a meal of the log, see `meal.ts`.
 *
 * @returns Whether `Food` is picked for the log and holds a food
 */
function foodsListed(): boolean {
    return chosen?.name === foodName && opened.target === "log" && mealFoods().length > 0;
}

/**
 * Allows saving once a category is picked: every other field may stay empty, but the times, which the browser
 * asks for before it sends the form; a skill entry may stay without skill, and a task picked without result
 * is left out, see `skill.ts`.
 */
function saveAllow(): void {
    (document.getElementById("entry-save") as HTMLButtonElement).disabled = chosen === null;
    realShow().catch((error: unknown): void => console.error(error));
}

/**
 * Shows under the end of a box how long the last three entries like it really lasted, the latest first,
 * like `Real, last 3: 02h 30m · 02h 45m · 02h 20m`, see `lengthOf` in `times.ts`, so I plan by what happened,
 * not by a hope (Buehler 1994);
 * a new box gets their median as its length, see {@link endFill}. Hidden for an entry of the log and while none
 * is logged.
 * - `line`: The line under the end.
 * - `texts`: Category, what, module and type picked.
 * - `key`: The same as one text, to load only when they change.
 * - `real`: Minutes of the last entries like the box, the latest first.
 * - `sorted`: The same, the shortest first.
 *
 * @throws {Error} - When the reader cannot answer
 */
async function realShow(): Promise<void> {
    const line: HTMLElement = document.getElementById("entry-real") as HTMLElement;
    const texts: BoxFields = textsRead();
    const key: string = JSON.stringify([opened.target, texts.category, texts.title, texts.module, texts.type]);
    if (key === realSeen)
        return;
    realSeen = key;
    realMiddle = null;
    line.hidden = true;
    if (opened.target !== "box" || texts.category === "")
        return;

    const response: Response = await fetch(`/api/day/real?${new URLSearchParams({
        category: texts.category, title: texts.title, module: texts.module, type: texts.type,
    })}`);
    if (!response.ok)
        throw new Error(`Reader answered ${response.status}`);
    const real: number[] = await response.json() as number[];
    if (key !== realSeen || real.length === 0)
        return;
    const sorted: number[] = [...real].sort((first: number, second: number): number => first - second);
    realMiddle = sorted[Math.floor(real.length / 2)];
    line.textContent = `Real, last ${real.length}: ${real.map(lengthOf).join(" · ")}`;
    line.hidden = false;
    endFill();
}

/**
 * Fills the end of a new box while its time is empty, from its start and the median of the real minutes of the last
 * entries like it, see {@link realShow}, like `16:00` to `18:30` for 150 minutes, with its day; nothing for a box
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
 * Takes a value picked into the list of every field of its kind that lacks it, like a new place,
 * because places are one list for every field of a place; a room picked stays among the rooms, which the list
 * offers only as I search, see {@link placeSearchOf}.
 *
 * @param field - Field the value was picked in
 * @param value - Value picked, maybe new
 */
function valueAdd(field: Field, value: string): void {
    (chosen?.fields ?? [])
        .filter((other: Field): boolean => (other.key === "title") === (field.key === "title")
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
 * wrote another way, like `UBahn` for `U-Bahn`: the value that reads the same without hyphens and spaces,
 * ignoring case; any other value as it is, also one no value reads like.
 * - `simple`: Writes a value without hyphens and spaces, in small letters.
 *
 * @param field - Field of the value, like the summary of `Way`
 * @param value - Value as written, like `U-Bahn`
 * @returns Value of the field, like `UBahn`
 */
function fixedValueOf(field: Field, value: string): string {
    const simple: (text: string) => string = (text: string): string => text.replace(/[-\s]/g, "").toLowerCase();
    if (!field.fixed || field.values.includes(value))
        return value;
    return field.values.find((candidate: string): boolean => simple(candidate) === simple(value)) ?? value;
}

/**
 * Makes the choice of a value of a field: a place by its name, see `labelOf` in `places.ts`, its address grey
 * beside it in the list, any other value as it is.
 *
 * @param field - Field of the value, like `Place`
 * @param value - Value, like `TumMain, Arcisstraße 21, 80333 München, Deutschland` or `Bahn`
 * @returns Choice, like one showing `TumMain`
 */
function fieldChoiceOf(field: Field, value: string): Choice {
    return field.key === "title" ? choiceOf(value)
        : { value: value, text: labelOf(value), group: "", detail: addressOf(value) };
}

/**
 * Gives the address of a place as an entry writes it, the part after its name.
 *
 * @param line - Place like `TumMain, Arcisstraße 21, 80333 München, Deutschland`, or only its name, like `HomeMunich`
 * @returns Address like `Arcisstraße 21, 80333 München, Deutschland`, empty for none
 */
function addressOf(line: string): string {
    return line.includes(",") ? line.slice(line.indexOf(",") + 1).trim() : "";
}

/**
 * Gives the link of the place of the entry, the box or the box to log the dialog opened with, its `ALTREP`.
 *
 * @returns Link like `https://nav.tum.de/room/0509.EG.980`, empty for none
 */
function openedLinkOf(): string {
    return opened.entry?.extendedProps.locationLink ?? opened.box?.locationLink ?? opened.plan?.locationLink ?? "";
}

/**
 * Gives my place of `Places.md` that the place picked in a field is, by its name, as its field offers it.
 *
 * @param field - Field of a place, like `From`
 * @returns The line of my place, like `TumMain, Arcisstraße 21, 80333 München, Deutschland`, `undefined` while
 *   the place picked is none of mine, like an older place by its name alone, or nothing is picked
 */
function mineOf(field: Field): string | undefined {
    const line: string = values[field.key];
    return line === "" ? undefined : field.values.find((value: string): boolean => labelOf(value) === labelOf(line));
}

/**
 * Shows the address of the place picked in a field below its label, small and grey, as a link that opens in a new tab
 * the link of the place, the one the place of the entry kept, its `ALTREP`, while it stays picked, else the link
 * of my place in `Places.md`, plain text for a place without link, which opens nothing, and beside the label
 * the pencil that changes my place, while it is one of mine, see {@link placeChange}; no address while no place
 * is picked, the link itself for a place with a link but without address, like `https://nav.tum.de/room/5602.EG.001`,
 * so every place with a link opens it here too, and nothing for an older place written by its name alone,
 * like `HomeMunich`, which has neither.
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
    const kept: string = field.key === "location" && line === opened.values.location ? openedLinkOf() : "";
    const link: string = kept !== "" ? kept : field.links[line] ?? "";
    address.textContent = addressOf(line) === "" ? link : addressOf(line);
    if (link !== "")
        address.href = link;
    else
        address.removeAttribute("href");
    address.hidden = address.textContent === "";
    pencil.hidden = mineOf(field) === undefined;
}

/**
 * Makes the pencil beside the label of the place picked in a field, which changes my place, see {@link placeChange},
 * and its address below the label, see {@link placePartsShow}.
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
    iconPut(pencil, Pencil, "Change the place in Places.md");
    pencil.addEventListener("click", (): void => {
        placeChange(field).catch(errorShow);
    });
    address.className = "entry-address";
    address.target = "_blank";
    address.rel = "noopener";
    placePartsShow(pencil, address, field);
    return [pencil, address];
}

/**
 * Changes my place picked in a field in `Places.md`, its name, its address and its link, through the dialog
 * of a place, see `placeEdit` in `places.ts`: every field of a place then offers it as changed, with its link.
 * Entries written before keep what they have, the entry of the dialog too while its place is the one it was written
 * with; a field that picked the place anew takes the new line. Then the fields show again.
 * - `old`: The line of my place as it was.
 * - `edited`: The place as written, `null` when the dialog closed without saving.
 * - `line`: Its new line.
 *
 * @param field - Field of the place, like `Place`
 * @throws {Error} - When the reader does not answer
 */
async function placeChange(field: Field): Promise<void> {
    const old: string | undefined = mineOf(field);
    if (old === undefined)
        return;
    const edited: Place | null = await placeEdit({
        name: labelOf(old), address: old.includes(",") ? old.slice(old.indexOf(",") + 1).trim() : "",
        link: field.links[old] ?? "",
    });
    if (edited === null)
        return;
    const line: string = lineOf(edited);
    categories.flatMap((category: Category): Field[] => category.fields)
        .filter((other: Field): boolean => other.key !== "title")
        .forEach((other: Field): void => {
            other.values = other.values.map((value: string): string => value === old ? line : value);
            delete other.links[old];
            if (edited.link !== "")
                other.links[line] = edited.link;
        });
    (Object.keys(values) as FieldKey[])
        .filter((key: FieldKey): boolean => key !== "title" && labelOf(values[key]) === labelOf(old)
            && values[key] !== opened.values[key])
        .forEach((key: FieldKey): void => {
            values[key] = line;
        });
    if (chosen?.name === skillName)
        skillPlaceShow(placeRowsOf());
    else
        fieldsShow();
}

/**
 * Opens the dialog of a new place for a field, see `placeOpen` in `places.ts`, and takes its link,
 * when it has one, into the links of every field of a place, since places are one list.
 * - `place`: The place saved, `null` when the dialog closed without saving.
 *
 * @param name - Typed name of the place, like `Audimax`
 * @returns The place as an entry writes it, like `Audimax, Arcisstraße 21, 80333 München, Deutschland`,
 *   `null` when none is saved
 */
async function placeAdd(name: string): Promise<string | null> {
    const place: Place | null = await placeOpen(name);
    if (place === null)
        return null;
    categories.flatMap((category: Category): Field[] => category.fields)
        .filter((field: Field): boolean => field.key !== "title" && place.link !== "")
        .forEach((field: Field): void => {
            field.links[lineOf(place)] = place.link;
        });
    return lineOf(place);
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
 * a new place only once it is saved with its address in the dialog of a new place, see `placeOpen` in `places.ts`;
 * a field of a place offers the rooms of the university only as I search, see {@link placeSearchOf}.
 * A place shows by its name, once, however often it was used and whatever address an entry kept, which a place picked
 * again keeps, with its pencil beside it and its address below it, see {@link placePartsOf}; a summary with the steps
 * of the value picked below it, see {@link stepsShow}. A meal of the log has its summary, its meals and its foods
 * in place of the summary, see {@link meal}.
 * - `place`: Pencil and address of a place, `null` for any other field.
 * - `steps`: Place of the steps of the field.
 *
 * @param field - Field of the category picked, like `Place`
 * @returns Its row
 */
function fieldRowsOf(field: Field): HTMLElement[] {
    if (field.key === "title" && meal !== null)
        return meal;
    const place: [HTMLButtonElement, HTMLAnchorElement] | null = field.key === "title" ? null : placePartsOf(field);
    const steps: HTMLElement = document.createElement("ul");
    steps.className = "entry-steps";
    stepsShow(steps, field);
    return [rowOf(field.name, choicesOf({
        search: field.key !== "title" ? placeSearchOf(field) : (text: string): Promise<Choice[]> =>
            searchOf(field.values.map((value: string): Choice => fieldChoiceOf(field, value)))(text),
        picked: values[field.key] === "" ? [] : [mineOf(field) ?? values[field.key]],
        many: false,
        adding: !field.fixed,
        add: field.key === "title" ? undefined : placeAdd,
        noun: field.key === "title" ? "summary" : "place",
        aside: place !== null ? [place[0]] : [],
        below: place !== null ? [place[1]] : [steps],
        locked: field.key === "title" && asPlanned(),
        pick: (picked: string[]): void => {
            const line: string = picked[0] ?? "";
            values[field.key] = field.key !== "title" && line !== "" && labelOf(line) === labelOf(values[field.key])
                ? values[field.key] : line;
            if (values[field.key] !== "")
                valueAdd(field, values[field.key]);
            if (place !== null)
                placePartsShow(place[0], place[1], field);
            stepsShow(steps, field);
            document.getElementById("entry-pain")?.toggleAttribute("hidden", !neckLongPicked());
            saveAllow();
        },
    }))];
}

/**
 * Builds the rows of the place of a skill entry, the one field of `Skill` from the reader, see {@link fieldRowsOf},
 * which `skill.ts` shows below skill and type.
 *
 * @returns The row of the place, none before `Skill` is picked
 */
function placeRowsOf(): HTMLElement[] {
    return (chosen?.fields ?? []).flatMap(fieldRowsOf);
}

/**
 * Tells whether the dialog logs a box of the plan that has a category, or changes an entry of the log logged from
 * a box, which points to it with `RELATED-TO`: its category and summary stay the plan's, so the link shows how
 * the plan was really done, while its times, place, semester and note change freely, like a lecture watched online
 * at home. A box without category leaves both open, to be picked.
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
 * before its place;
 * after the place for `Body` my neck pain, shown while `Neck long` is picked, see {@link painRowOf};
 * a meal of the log is its summary, see {@link meal}.
 * - `fields`: The fields of the category picked.
 */
function fieldsShow(): void {
    const fields: Field[] = chosen?.fields ?? [];
    document.getElementById("entry-fields")?.replaceChildren(...fields
        .filter((field: Field): boolean => field.key === "title").flatMap(fieldRowsOf));
    document.getElementById("entry-more")?.replaceChildren(...fields
        .filter((field: Field): boolean => field.key !== "title").flatMap(fieldRowsOf),
        ...painRowOf());
    saveAllow();
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
 * Picks a category: shows its fields, keeping the places picked under the category before, and an older value
 * of a field that takes only its values as that field writes it, see {@link fixedValueOf}.
 * A new entry of a category with the field `from` starts where the last way ended.
 * `Food` in the log shows its summary, its meals and its foods in place of the summary, with those of the meal being
 * changed, see `meal.ts`, built before its fields show, unless another category was picked meanwhile;
 * `Skill` shows its skill and type before the times, and its place, semester, chapters, documents and attempts
 * after them,
 * see `skill.ts`.
 * - `changing`: Whether the dialog changes a meal, whose foods and what the meal starts with.
 * - `built`: The rows of the meal.
 *
 * @param category - Category to pick, or `null` for none yet
 * @throws {Error} - When the reader gives no valid answer
 */
async function categoryPick(category: Category | null): Promise<void> {
    values = chosen === null ? { ...opened.values } : { ...valuesRead(), title: "" };
    chosen = category;
    (category?.fields ?? []).forEach((field: Field): void => {
        values[field.key] = fixedValueOf(field, values[field.key]);
    });
    meal = null;
    document.getElementById("entry-more")?.replaceChildren();
    if (category?.name === skillName) {
        await skillFieldsShow(document.getElementById("entry-fields") as HTMLElement,
            document.getElementById("entry-more") as HTMLElement, placeRowsOf(), opened.target === "box",
            opened.category === skillName ? opened.skill : skillNone, dayRead(), asPlanned(), saveAllow);
        saveAllow();
        return;
    }
    const starts: boolean = category?.fields.some((field: Field): boolean => field.key === "from") ?? false;
    if (starts && opened.entry === null && values.from === "")
        values.from = await wayEndLoad();
    if (category?.name === foodName && opened.target === "log") {
        const changing: boolean = opened.category === foodName;
        const built: HTMLElement[] = await mealOf(changing ? opened.foods : [], changing ? opened.values.title : "",
            saveAllow);
        if (chosen !== category)
            return;
        meal = built;
    }
    fieldsShow();
}

/**
 * Shows the category of the dialog as its first row, one line like every field, whose list offers the categories
 * in the order the reader gives them, for a box only those I plan. While a log entry is changed, `Skill` stays apart:
 * a skill entry cannot become another category, nor another entry a skill entry, because only the skill area writes
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
 * from its skill and type, like `IN2028_BusinessAnalyticsMachineLearning (VO)`, see `reader/documents.ts`,
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
 * - `skill`: Skill and type of a skill entry, empty for any other entry.
 * - `links`: Chapters and documents of a skill entry, none for any other entry.
 *
 * @returns Category, what, place, where a way starts, module, type, semester, note, chapters and documents,
 *   as a box of the day the dialog opened with, without time, duration and deadline; the semester of a skill entry
 *   as picked, else of that day
 */
function textsRead(): BoxFields {
    const picked: { [key in FieldKey]: string } = valuesRead();
    const skill: ModuleType = chosen?.name === skillName ? skillModuleType() : { module: "", type: "" };
    const links: SkillLinks =
        chosen?.name === skillName ? skillLinksRead() : { chapters: [], documents: [] };
    return {
        category: chosen?.name ?? "",
        title: titleRead(picked.title),
        location: picked.location,
        from: picked.from,
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
        category: texts.category, title: texts.title, location: texts.location, from: texts.from,
        module: texts.module, type: texts.type,
        semester: chosen?.name === skillName ? skillSemesterOf(dayOf(start)) : "", note: texts.note,
        foods: chosen?.name === foodName ? mealFoods() : [],
        planned: opened.entry === null ? opened.plan?.id ?? "" : "",
        pain: neckLongPicked() ? pain : "",
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
 * Shows the hint that the reader did not take what the dialog sent.
 *
 * @param error - Error of the request
 */
function errorShow(error: unknown): void {
    console.error(error);
    document.getElementById("entry-error")?.removeAttribute("hidden");
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
 * - `fields`: Fields, note and times of the dialog.
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
    if (chosen?.name === skillName)
        await skillSave(calendar, opened.entry?.id ?? "", fields);
    else if (opened.entry !== null)
        await entryChange(calendar, opened.entry.id, fields);
    else
        await entryAdd(calendar, fields);
    (document.getElementById("entry") as HTMLDialogElement).close();
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
        iconPut(button, CircleQuestionMark, "Really remove?");
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
}

/**
 * Shows the dialog as an opening says, a new one without category with the list of the categories open.
 * It has no title: below its fields, small and grey, the box a log entry comes from, with a pencil beside it to change
 * that box instead, when it can be changed; at the bottom the copy and the bin at the left, then for an open box being
 * changed the ring with its check, which logs it, as its ring in the plan does, then cancel and save, see `day.html`.
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
    chosen = null;
    realSeen = "";
    realMiddle = null;
    (document.getElementById("entry-real") as HTMLElement).hidden = true;
    removeAsked = false;
    pain = String(opening.entry?.extendedProps.pain ?? "");

    (document.getElementById("entry-plan-title") as HTMLElement).textContent =
        opening.plan === null ? "" : `From the plan: ${opening.plan.title}`;
    document.getElementById("entry-plan")?.toggleAttribute("hidden", opening.target === "box" || opening.plan === null);
    document.getElementById("entry-plan-log")?.toggleAttribute("hidden", opening.box?.state !== "open");
    document.getElementById("entry-plan-edit")?.toggleAttribute("hidden", opening.plan?.editable !== true);
    timesShow(opening);
    (document.getElementById("entry-note") as HTMLTextAreaElement).value = opening.note;
    iconPut(document.getElementById("entry-remove") as HTMLElement, Trash, "Remove");
    document.getElementById("entry-remove")?.toggleAttribute("hidden",
        opening.entry === null && (opening.box === null || opening.box.state === "done" || opening.box.series));
    document.getElementById("entry-duplicate")?.toggleAttribute("hidden",
        opening.entry === null && opening.box === null);
    document.getElementById("entry-error")?.setAttribute("hidden", "");
    await categoryPick(categories.find((category: Category): boolean => category.name === opening.category) ?? null);
    categoryShow();
    if (!dialog.open)
        dialog.showModal();
    (document.activeElement as HTMLElement | null)?.blur();
    if (chosen === null)
        document.querySelector<HTMLButtonElement>("#entry-category .picker-line")?.click();
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
        values: { title: "", from: "", location: "" }, note: "", foods: [], skill: skillNone,
        plan: null, entry: null, box: null,
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
 * Opens the dialog to log a box at a start and an end, like those of its drop into the log; a box with a category
 * comes with its category and fields picked as planned, a skill box with its skill, type, semester, chapters
 * and documents, see `skill.ts`, ready to save or to change, like a lecture with its chapters and slides;
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
            ? { title: box.title, from: box.from, location: box.location }
            : { title: "", from: "", location: "" },
        note: "", foods: [],
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
        values: { title: "", from: "", location: "" }, note: "", foods: [], skill: skillNone,
        plan: null, entry: null, box: null,
    });
}

/**
 * Opens the dialog for a new box from a suggested study session, filled in as suggested: `Skill`, its module and type
 * picked and its duration typed, without time, so I change it before saving, which accepts it, see `suggestions.ts`.
 *
 * @param day - A date on the day of the suggestion
 * @param module - Its module, like `IN2028`
 * @param type - Its type, empty for my own learning
 * @param minutes - Its expected duration
 * @throws {Error} - When the reader gives no valid answer
 */
export async function boxOpenSuggestion(day: Date, module: string, type: string, minutes: number): Promise<void> {
    await entryShow({
        target: "box", start: day, end: day, time: null, minutes: minutes, category: skillName,
        values: { title: "", from: "", location: "" }, note: "", foods: [],
        skill: { ...skillNone, module: module, type: type }, plan: null, entry: null, box: null,
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
        values: { title: box.title, from: box.from, location: box.location }, note: box.note, foods: [],
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
 *
 * @param entry - Entry to change
 * @throws {Error} - When the reader gives no valid answer
 */
export async function entryOpenEdit(entry: EventApi): Promise<void> {
    const props: { [field: string]: string } = entry.extendedProps;
    await entryShow({
        target: "log", start: entry.start as Date, end: entry.end as Date, time: null, minutes: null,
        category: props.category ?? null,
        values: { title: entry.title, from: props.from ?? "", location: props.location ?? "" },
        note: props.note ?? "", foods: entry.extendedProps.foods ?? [],
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
 * Starts the entry by category after the router has put its HTML into the page:
 * the copy duplicates the entry or the box being changed, see {@link entryDuplicate}, the pencil beside the box being
 * logged changes that box, the ring with its check logs the box being changed, as expected on the shown day,
 * which for a box with a deadline may lie before its own, in the dialog of the log, see `boxTimesOf` in `times.ts`;
 * typing a deadline turns start and end of a box off, see {@link deadlineSee}; typing the day, start or end
 * fills the day of the end, see {@link endDayFill}, until I type that day myself, and a start typed for a new box
 * its end, see {@link endFill}; typing a day of a skill entry gives it the semester of that day while I picked none,
 * see `skillDaySet` in `skill.ts`; times that are not right are not sent, see {@link timesCheck};
 * the dialog of a new place starts too, see `places.ts`.
 * - `endDay`: Field of the day of the end.
 * - `start`, `end`: The times the box is logged at as expected.
 *
 * @param calendar - Calendar of the day
 */
export function categoriesStart(calendar: Calendar): void {
    listsStart();
    placesStart();
    iconPut(document.getElementById("entry-cancel") as HTMLElement, X, "Cancel");
    iconPut(document.getElementById("entry-save") as HTMLElement, Check, "Save");
    document.getElementById("entry-cancel")?.addEventListener("click", (): void =>
        (document.getElementById("entry") as HTMLDialogElement).close());
    document.getElementById("entry-remove")?.addEventListener("click", (): void => {
        entryRemove(calendar).catch(errorShow);
    });
    iconPut(document.getElementById("entry-duplicate") as HTMLElement, Copy, "Duplicate");
    iconPut(document.getElementById("entry-plan-edit") as HTMLElement, Pencil, "Change the box in the plan");
    iconPut(document.getElementById("entry-plan-log") as HTMLElement, CircleCheck, "Log it");
    document.getElementById("entry-duplicate")?.addEventListener("click", (): void => {
        entryDuplicate().catch(errorShow);
    });
    document.getElementById("entry-plan-edit")?.addEventListener("click", (): void => {
        if (opened.plan !== null)
            boxOpenEdit(opened.plan).catch(errorShow);
    });
    document.getElementById("entry-plan-log")?.addEventListener("click", (): void => {
        if (opened.box === null)
            return;
        const [start, end]: [Date, Date] = boxTimesOf(opened.box, calendar.view.currentStart);
        entryOpenFromBox(opened.box, start, end).catch(errorShow);
    });
    ["entry-deadline-day", "entry-deadline-time"].forEach((id: string): void =>
        document.getElementById(id)?.addEventListener("input", deadlineSee));
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
    document.getElementById("entry-form")?.addEventListener("submit", (event: SubmitEvent): void => {
        event.preventDefault();
        if (timesCheck())
            entrySave(calendar).catch(errorShow);
    });
}
