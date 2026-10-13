/**
 * ## Day
 *
 * Reads the log of a day, my one calendar, and adds, changes and removes its entries, by category, see `categories.ts`;
 * the plan of the day is a list of boxes beside it, see `boxes.ts`.
 * Writes into the month files of the log of the new system, like `2026/2026_10/2026_10_Log.ics`,
 * by the month in Berlin time; an entry whose start moves into another month moves into the file of that month.
 * A skill entry names its module and type, like the lectures imported from TUMonline:
 * `CATEGORIES:Skill`, `SUMMARY:IN2028 VO`, `X-TYPE:VO`, `X-MODULE:IN2028`;
 * its chapters, document and attempts the skill area writes, see `skill.ts`; every skill entry links the folder
 * of its skill, also one logged from a box, see `documents.ts`.
 *
 * A box of the plan goes into the log at its real time, dragged there or logged as expected with one tap,
 * see {@link boxLog}: the log entry points to it with `X-PLANNED:<UID of the box>`, written once when the log entry
 * is added, also when a box is logged through the dialog, so the box shows as done, with expected and real time,
 * and offers no second log; removing the log entry opens the box again.
 *
 * The dialog of a box shows how long the last entries like it really lasted, see {@link realMinutesRead}.
 *
 * A meal of the log lists its foods as lines `X-FOOD`, like `X-FOOD:Reis;150`: appended with the entry,
 * and replaced as a whole when the entry changes; the reader counts what each meal gives, see `food.ts`.
 * A meal eaten right after cooking points to its entry `Cook` with `X-COOKED:<UID of the Cook entry>`,
 * written once when the meal is added, so the dialog offers that meal only once.
 *
 * - `./boxes.ts`: Finds an open box of the plan, and marks a box done or open again.
 * - `./calendar.ts`: Reads `.ics` files into entries, appends, changes and removes their events.
 * - `./categories.ts`: Tells whether the fields of an entry fit its category, how long a meal usually lasts,
 *   and names the category of skill entries.
 * - `./documents.ts`: Builds the link of a skill entry to the folder of its skill.
 * - `./food.ts`: Tells what meals give, whether a line `X-FOOD` is well formed, what a dish held the last time,
 *   and how a meal is named by its foods.
 * - `./sources.ts`: Names every folder and file the reader reads, and builds the path of a month file.
 * - `./trackers.ts`: Tells whether an entry is a glass of water.
 */

import { boxDone, boxOpenFind, boxReopen } from "./boxes.ts";
import { berlinDateOf, entriesRead, entryAppend, entryChange, entryFind, entryRemove, propertiesPut } from "./calendar.ts";
import { categoryAllows, skillName, usualLengthRead } from "./categories.ts";
import { linksOf } from "./documents.ts";
import { dishFoodsRead, foodLineAllows, foodName, mealsOf, mealTitleOf } from "./food.ts";
import { day, logEnding, monthFileOf } from "./sources.ts";
import { glassIs } from "./trackers.ts";

import type { Box } from "./boxes.ts";
import type { Entry, EntryFields, Link } from "./calendar.ts";
import type { Meal } from "./food.ts";


/**
 * A new entry of the log, as the entry by category sends it; an empty field is not written.
 *
 * - `category`: Category picked.
 * - `title`: What picked.
 * - `location`: Place picked.
 * - `from`: Where a way starts.
 * - `module`: Module of a skill entry, like `IN2028`, empty for any other entry.
 * - `type`: Type of a skill entry, like `VO`, empty for any other entry.
 * - `note`: Free note.
 * - `foods`: Foods of a meal, its lines `X-FOOD` like `Reis;150`, none for any other entry.
 * - `planned`: Identifier of the box a new log entry is logged from, its `X-PLANNED`, empty for none;
 *   written only when the entry is added.
 * - `pain`: My neck pain from 0 to 10 after `Neck long`, its `X-PAIN`, like `5`, empty for none;
 *   left out by a sender that does not know it, like the calendar after a drag, so it stays as it is.
 * - `start`: Start as ISO instant.
 * - `end`: End as ISO instant, after the start.
 */
export type EntryNew = {
    category: string;
    title: string;
    location: string;
    from: string;
    module: string;
    type: string;
    note: string;
    foods: string[];
    planned: string;
    pain?: string;
    start: string;
    end: string;
};

/**
 * A changed entry, as the dialogs send it after editing and the calendar after dragging:
 * an {@link EntryNew} with the identifier `id` of the entry.
 */
export type EntryChange = EntryNew & { id: string };

/**
 * A box logged at its real time, as the day sends it after a drop into the log or a tap on its ring.
 *
 * - `box`: Identifier of the box.
 * - `start`: Real start as ISO instant.
 * - `end`: Real end as ISO instant, after the start.
 */
export type BoxLogged = {
    box: string;
    start: string;
    end: string;
};

/**
 * An entry as the day gets it: an {@link Entry}, with what a meal gives, whether a cooking was eaten,
 * and whether it is a glass of water.
 *
 * - `kcal`: kcal of a meal that lists foods, see `food.ts`; `null` for any other entry.
 *   The day hides them on its entries for now; its dialog and its trackers show them.
 * - `estimate`: Whether those kcal hold the usual portion of a food listed without grams.
 * - `eaten`: Whether a meal of the same range points to this entry `Cook` with its `X-COOKED`.
 * - `glass`: Whether the entry is a glass of water, which the counter of the day shows instead of the time grid,
 *   see `trackers.ts`.
 */
export type DayEntry = Entry & {
    kcal: number | null;
    estimate: boolean;
    eaten: boolean;
    glass: boolean;
};

/**
 * Category of cooking, whose meal may follow it, see {@link mealAfterCookAdd}.
 */
const cookName: string = "Cook";

/**
 * A day in milliseconds.
 */
const dayLength: number = 24 * 60 * 60 * 1000;

/**
 * Number of the last entries like a box whose real minutes its dialog shows, see {@link realMinutesRead}.
 */
const realCount: number = 3;



/**
 * Builds the path of the month file of the log for the start of an entry, in Berlin time.
 *
 * @param start - Start of the entry
 * @returns Path like `2026/2026_10/2026_10_Log.ics` in `NomSystemcalendar`
 */
export function fileOf(start: Date): string {
    return monthFileOf(berlinDateOf(start), logEnding);
}

/**
 * Turns an entry as the page sends it into the fields to write.
 *
 * @param entry - New or changed entry, with ISO instants
 * @returns Fields and times
 */
function fieldsOf(entry: EntryNew): EntryFields {
    return {
        category: entry.category, title: entry.title, location: entry.location, from: entry.from,
        module: entry.module, type: entry.type, note: entry.note,
        start: new Date(entry.start), end: new Date(entry.end),
    };
}

/**
 * Checks fields, foods and times of an entry of the log before they are written.
 * An entry has to fit its category, see {@link categoryAllows}, or keep the category and title it had,
 * like an entry written before its category got its rules, dragged to another time.
 * Only a meal lists foods, each line well formed, see {@link foodLineAllows}.
 * - `kept`: Whether an entry being changed keeps its category and title.
 *
 * @param fields - Fields and times to write
 * @param foods - Lines `X-FOOD` to write, none for an entry that is no meal
 * @param old - Entry being changed, `null` for a new entry
 * @throws {Error} - When the fields or foods are not allowed or the end is not after the start
 */
function fieldsCheck(fields: EntryFields, foods: string[], old: Entry | null): void {
    const kept: boolean = old !== null && old.title !== ""
        && fields.title === old.title && fields.category === old.category;
    if (!(kept || categoryAllows(fields)))
        throw new Error(`No log entry ${fields.category} ${fields.title}`);
    if (foods.length > 0 && !(fields.category === foodName && foods.every(foodLineAllows)))
        throw new Error(`No foods ${foods.join(", ")} for ${fields.title}`);
    if (!(fields.start < fields.end))
        throw new Error(`${fields.title} needs an end after its start`);
}

/**
 * Reads the entries of the log that overlap a range, each meal with its kcal,
 * each cooking eaten and each glass of water marked, see {@link DayEntry}.
 * - `entries`: Entries of the range.
 * - `meals`: What the meals among them give, by their identifiers.
 * - `cooked`: Identifiers of the entries `Cook` the meals among them point to.
 *
 * @param start - Start of the range with offset, like `2026-07-03T00:00:00+02:00`
 * @param end - End of the range, excluded, in the same form
 * @returns {@link DayEntry}s overlapping the range
 */
export function dayEntriesRead(start: string, end: string): DayEntry[] {
    const entries: Entry[] = entriesRead(day.log, start, end);
    const meals: Map<string, Meal> = mealsOf(entries);
    const cooked: Set<string> = new Set(entries.map((entry: Entry): string => entry.cooked));
    return entries.map((entry: Entry): DayEntry => ({
        ...entry,
        kcal: meals.get(entry.id)?.kcal ?? null,
        estimate: meals.get(entry.id)?.estimate ?? false,
        eaten: entry.category === cookName && cooked.has(entry.id),
        glass: glassIs(entry),
    }));
}

/**
 * Checks my neck pain as the dialog sends it: a whole number from 0 to 10, or empty for none.
 *
 * @param pain - Pain, like `5`
 * @throws {Error} - When it is anything else
 */
function painCheck(pain: string): void {
    if (!/^(?:\d|10)?$/.test(pain))
        throw new Error(`No pain from 0 to 10: ${pain}`);
}

/**
 * Reads how long the last entries of the log like a box really lasted, the latest first, so I anchor the expected
 * minutes of a box on what really happened, not on a hope, since plans run long (Buehler 1994): the last three
 * entries up to now with the same category and the same what, or for `Skill` the same module
 * and type, like `150, 165, 140` for `IN2028 DEV`.
 * - `now`: The moment.
 * - `like`: Whether an entry is like the box.
 *
 * @param category - Category of the box, like `Skill`
 * @param title - What of the box, like `Neck long`, ignored for `Skill`
 * @param module - Module of a skill box, like `IN2028`
 * @param type - Type of a skill box, like `DEV`
 * @returns Minutes of each, the latest first, none for none
 */
export function realMinutesRead(category: string, title: string, module: string, type: string): number[] {
    const now: Date = new Date();
    const like: (entry: Entry) => boolean = (entry: Entry): boolean => entry.category === category && !entry.allDay
        && (category === skillName ? entry.module === module && entry.type === type : entry.title === title);
    return entriesRead(day.log, "1970-01-01T00:00:00Z", now.toISOString())
        .filter((entry: Entry): boolean => like(entry) && Date.parse(entry.end) <= now.getTime())
        .sort((first: Entry, second: Entry): number => second.start.localeCompare(first.start))
        .slice(0, realCount)
        .map((entry: Entry): number => Math.round((Date.parse(entry.end) - Date.parse(entry.start)) / 60000));
}

/**
 * Gives the link of a skill entry to the folder of its skill, which every skill entry gets by itself,
 * see `documents.ts`.
 *
 * @param fields - Fields of an entry to write
 * @returns `ATTACH` of the folder, like `NomSkillingmodules/IN2028_BusinessAnalyticsMachineLearning`;
 *   none for an entry of another category and for a skill without folder
 */
function skillLinksOf(fields: EntryFields): [string, Link][] {
    if (fields.category !== skillName)
        return [];
    return linksOf(fields.module, "", []).map((link: Link): [string, Link] => ["attach", link]);
}

/**
 * Adds an entry to the log, into the month file of its start, a meal with one line `X-FOOD` per food,
 * see {@link fieldsCheck}; an entry logged from a box with its `X-PLANNED`, after which the box is done;
 * a long neck session with my pain as `X-PAIN`, see {@link painCheck}; a skill entry with the link to the folder
 * of its skill, see {@link skillLinksOf}.
 * - `pain`: My pain, empty for none.
 * - `own`: Properties of my own beyond the fields: the foods, the box, the pain and the link of a skill entry.
 * - `id`: Identifier of the new entry.
 *
 * @param entry - Entry as the entry by category or the counter of glasses sends it
 * @returns Identifier of the new entry
 * @throws {Error} - When the fields or foods are not allowed, the end is not after the start,
 *   or the box it is logged from is not open
 */
export function entryAdd(entry: EntryNew): string {
    const fields: EntryFields = fieldsOf(entry);
    fieldsCheck(fields, entry.foods, null);
    if (entry.planned !== "")
        boxOpenFind(entry.planned);

    const pain: string = entry.pain ?? "";
    painCheck(pain);
    const own: [string, string | Link][] = entry.foods.map((food: string): [string, string] => ["x-food", food]);
    if (entry.planned !== "")
        own.push(["x-planned", entry.planned]);
    if (pain !== "")
        own.push(["x-pain", pain]);
    own.push(...skillLinksOf(fields));
    const id: string = entryAppend(fileOf(fields.start), fields, own);
    if (entry.planned !== "")
        boxDone(entry.planned);
    return id;
}

/**
 * Logs a box at its real time, with one drop or one tap: a log entry of its category, what, place, and a skill entry
 * with its skill and type and the link to the folder of its skill, from the start to the end the day sends,
 * pointing to the box with `X-PLANNED`, after which the box is done. Its note stays empty, since the note
 * of a log entry is my diary note about what happened; chapters and a document a skill entry gets later in the dialog.
 * - `box`: The box.
 * - `fields`: Fields and times of the log entry.
 * - `id`: Identifier of the new log entry.
 *
 * @param logged - The box with its real start and end
 * @returns Identifier of the new log entry
 * @throws {Error} - When there is no such box, it is not open or has no category, or the times are not right
 */
export function boxLog(logged: BoxLogged): string {
    const box: Box = boxOpenFind(logged.box);
    if (box.category === "")
        throw new Error(`${box.title} has no category; the dialog logs it`);

    const fields: EntryFields = {
        category: box.category, title: box.title, location: box.location, from: box.from,
        module: box.module, type: box.type, note: "",
        start: new Date(logged.start), end: new Date(logged.end),
    };
    fieldsCheck(fields, [], null);
    const id: string = entryAppend(fileOf(fields.start), fields, [["x-planned", box.id], ...skillLinksOf(fields)]);
    boxDone(box.id);
    return id;
}

/**
 * Adds the meal of a cooking to the log, eaten right after it: `Food` at the place of the entry `Cook`,
 * from the end of the cooking for as long as my meals usually last, with the foods the dish held the last time,
 * named by them, see {@link mealTitleOf}, else by the dish of the cooking,
 * and `X-COOKED` with the identifier of the entry `Cook`, so the two point to each other.
 * - `cook`: The entry `Cook`.
 * - `foods`: Lines `X-FOOD` the dish held the last time, none when no meal of it lists foods.
 * - `fields`: Fields and times of the meal.
 *
 * @param id - Identifier of the entry `Cook`
 * @returns Identifier of the new meal
 * @throws {Error} - When there is no such entry in the new system, it is no cooking, or a meal points to it already
 */
export function mealAfterCookAdd(id: string): string {
    const [, cook]: [string, Entry] = entryFind(day.log, id);
    if (!cook.editable || cook.category !== cookName)
        throw new Error(`${cook.title} is no cooking of the new system`);
    if (entriesRead(day.log, cook.start, new Date(Date.parse(cook.end) + dayLength).toISOString())
        .some((entry: Entry): boolean => entry.cooked === id))
        throw new Error(`${cook.title} is eaten already`);

    const start: Date = new Date(cook.end);
    const foods: string[] = dishFoodsRead(cook.title);
    const fields: EntryFields = {
        category: foodName, title: foods.length > 0 ? mealTitleOf(foods) : cook.title, location: cook.location,
        from: "", module: "", type: "", note: "",
        start: start, end: new Date(start.getTime() + usualLengthRead(foodName, start.toISOString()) * 60 * 1000),
    };
    fieldsCheck(fields, foods, null);
    return entryAppend(fileOf(start), fields,
        [...foods.map((food: string): [string, string] => ["x-food", food]), ["x-cooked", id]]);
}

/**
 * Changes fields, foods, pain and times of an entry of the log, see {@link fieldsCheck}:
 * changed foods replace all lines `X-FOOD` of the entry first, a changed pain its `X-PAIN`,
 * then its fields and times change.
 * The entry moves into the month file of its new start when that is another file.
 *
 * @param change - Changed entry as the dialogs or the calendar send it, the calendar with the foods as they were
 * @throws {Error} - When there is no such entry, it may not be changed, the fields or foods are not allowed,
 *   or the end is not after the start
 */
export function entryEdit(change: EntryChange): void {
    const [file, entry]: [string, Entry] = entryFind(day.log, change.id);
    if (!entry.editable)
        throw new Error(`${entry.title} may not be changed`);

    const fields: EntryFields = fieldsOf(change);
    fieldsCheck(fields, change.foods, entry);
    painCheck(change.pain ?? "");
    if (change.foods.join("\n") !== entry.foods.join("\n"))
        propertiesPut(file, entry.id, [["x-food", change.foods]]);
    if (change.pain !== undefined && change.pain !== entry.pain)
        propertiesPut(file, entry.id, [["x-pain", change.pain === "" ? [] : [change.pain]]]);
    entryChange(file, entry, fields, fileOf(fields.start));
}

/**
 * Removes an entry of the log; when it was logged from a box, the box is open again, see `boxes.ts`.
 *
 * @param id - Identifier of the entry
 * @throws {Error} - When there is no such entry or it may not be removed
 */
export function entryDelete(id: string): void {
    const [file, entry]: [string, Entry] = entryFind(day.log, id);
    if (!entry.editable)
        throw new Error(`${entry.title} may not be removed`);

    entryRemove(file, entry.id);
    if (entry.planned !== "")
        boxReopen(entry.planned);
}
