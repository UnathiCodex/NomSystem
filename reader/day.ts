/**
 * ## Day
 *
 * Reads the log of a day, my one calendar, and adds, changes and removes its entries, by category, see `categories.ts`;
 * the plan of the day is a list of boxes beside it, see `boxes.ts`.
 * Writes into the logs of the new system, see `sources.ts`: a skill entry into the log of its skill,
 * like `Skilling/IN2028_BusinessAnalyticsMachineLearning_Log.ics`, any other into the log of its year in Berlin time,
 * like `Living/2026_Log.ics`; an entry whose start moves into another year, or that changes its category or its skill,
 * moves into the log it belongs into then, as one from a month file of the layout before.
 * A skill entry names the folder of its skill and its type in its `SUMMARY` alone, linking the folder:
 * `CATEGORIES:Skill`,
 * `SUMMARY;ALTREP="NomSkillingmodules/IN2028_…":IN2028_BusinessAnalyticsMachineLearning (VO)`,
 * without `X-TYPE` and `X-MODULE`, also one logged from a box, see `titleOf` in `documents.ts`;
 * its chapters, document and attempts the skill area writes, see `skill.ts`.
 *
 * A box of the plan goes into the log at its real time, dragged there or logged as expected with one tap,
 * see {@link boxLog}: the log entry points to it with the standard `RELATED-TO:<UID of the box>`, for one date
 * of a series with that date, like `RELATED-TO;X-RECURRENCE-ID=20261026T130000Z:<UID>`, see `relatedOf`
 * in `calendar.ts`, written once when the log entry is added, also when a box is logged through the dialog,
 * so the box shows as done, with expected and real time, and offers no second log; removing the log entry opens
 * the box again, and so does one click on the check of the done box, see {@link boxUndo}. An older log entry points
 * to its box with `X-PLANNED:<UID of the box>`, which is still read.
 *
 * The dialog of a box shows how long the last entries like it really lasted, see {@link realMinutesRead}.
 *
 * A meal of the log lists its foods as lines `X-FOOD`, like `X-FOOD:Skyr natur;K-Classic;Kaufland;150`: appended
 * with the entry, and replaced as a whole when the entry changes; the reader counts what each meal gives, see `food.ts`.
 * A cooking, `Cook`, lists what went into the pot the same way, like `X-FOOD:Hackfleisch;Gut & Günstig;Edeka;500`,
 * which counts nothing; a meal drawn from it holds `X-COOKED:<UID of the Cook entry>` and the foods it ate with their
 * grams, so each keeps its foods in its own lines and the meal what it was that day, whatever the cooking becomes
 * later; a link only ever points back in time, see {@link cookedCheck}.
 *
 * - `./boxes.ts`: Finds a box of the plan, an open one, and marks a box done or open again.
 * - `./calendar.ts`: Reads `.ics` files into entries, appends, changes and removes their events.
 * - `./categories.ts`: Tells whether the fields of an entry fit its category, and names the category of skill entries.
 * - `./documents.ts`: Writes what a skill entry was, linking the folder of its skill, gives its chapters,
 *   and the log an entry belongs into.
 * - `./food.ts`: Tells what meals give and whether a line `X-FOOD` is well formed.
 * - `./sources.ts`: Names every folder and file the reader reads.
 * - `./trackers.ts`: Tells whether an entry is a glass of water.
 */

import { boxDone, boxFind, boxOpenFind, boxReopen } from "./boxes.ts";
import { berlinDateOf, entriesRead, entryAppend, entryChange, entryFind, entryRemove, propertiesPut } from "./calendar.ts";
import { categoryAllows, semesterFor, skillName } from "./categories.ts";
import { calendarFileOf, chaptersOf, documentLinksOf, titleOf } from "./documents.ts";
import { foodLineAllows, foodName, mealsOf } from "./food.ts";
import { placeLinkOf } from "./places.ts";
import { day, logEnding } from "./sources.ts";
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
 * - `locationLink`: Link of the meeting of the place `Online` where the dialog asks for it, see `meeting`
 *   in `categories.ts`, as typed, written as the `ALTREP` of its `LOCATION`, see `placeLinkOf` in `places.ts`;
 *   left out for any other place, whose link the reader finds itself, and by a sender that does not know it,
 *   like the calendar after a drag, so the place keeps its link.
 * - `from`: Where a way starts.
 * - `module`: Module of a skill entry, like `IN2028`, empty for any other entry.
 * - `type`: Type of a skill entry, like `VO`, empty for any other entry.
 * - `semester`: Semester of a skill entry, like `2026W`, the semester of its day when empty, see `semesterFor`
 *   in `categories.ts`; empty for any other entry.
 * - `note`: Free note.
 * - `foods`: Foods of a meal or a cooking, its lines `X-FOOD` like `Reis;Golden Sun;Lidl;150`, none for any other entry.
 * - `planned`: Identifier of the box a new log entry is logged from, see `entryIdOf` in `calendar.ts`,
 *   written as its `RELATED-TO`, empty for none; written only when the entry is added.
 * - `pain`: My neck pain from 0 to 10 after `Neck long`, its `X-PAIN`, like `5`, empty for none;
 *   left out by a sender that does not know it, like the calendar after a drag, so it stays as it is.
 * - `cooked`: For a meal drawn from a cooking, its `X-COOKED`, the identifier of the cooking, empty for none;
 *   left out by a sender that does not know it, so it stays as it is, see {@link cookedCheck}.
 * - `start`: Start as ISO instant.
 * - `end`: End as ISO instant, after the start.
 */
export type EntryNew = {
    category: string;
    title: string;
    location: string;
    locationLink?: string;
    from: string;
    module: string;
    type: string;
    semester: string;
    note: string;
    foods: string[];
    planned: string;
    pain?: string;
    cooked?: string;
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
 * An entry as the day gets it: an {@link Entry}, with the chapters of a skill entry, what a meal gives,
 * and whether it is a glass of water.
 *
 * - `chapters`: Chapters a skill entry covered, from the folders it links and from older `X-CHAPTER`s,
 *   see `chaptersOf` in `documents.ts`; none for any other entry.
 * - `kcal`: kcal of a meal that lists foods, see `food.ts`; `null` for any other entry.
 *   The day hides them on its entries for now; its dialog and its trackers show them.
 * - `estimate`: Whether those kcal hold the usual portion of a food listed without grams.
 * - `glass`: Whether the entry is a glass of water, which the counter of the day shows instead of the time grid,
 *   see `trackers.ts`.
 */
export type DayEntry = Entry & {
    kcal: number | null;
    estimate: boolean;
    glass: boolean;
};

/**
 * Number of the last entries like a box whose real minutes its dialog shows, see {@link realMinutesRead}.
 */
const realCount: number = 3;

/**
 * Category of cooking, which lists what went into the pot like a meal, but counts no kcal.
 */
const cookName: string = "Cook";

/**
 * Gives the log an entry belongs into, see the top of this file: the log of its skill for a skill entry,
 * else the log of the year of its start in Berlin time, see `calendarFileOf` in `documents.ts`.
 *
 * @param fields - Category, skill and start of the entry, like `Skill`, `IN2028` and 2026-10-13 10:00
 * @returns Path like `Skilling/IN2028_BusinessAnalyticsMachineLearning_Log.ics` or `Living/2026_Log.ics`
 *   in `NomManagecalendar`
 */
export function logFileOf(fields: { category: string; module: string; start: Date }): string {
    return calendarFileOf(fields, berlinDateOf(fields.start), logEnding);
}

/**
 * Turns an entry as the page sends it into the fields to write: its place with its link, the one typed
 * for `Online` or the one the reader finds, see `placeLinkOf` in `places.ts`, and what a skill entry was
 * as the reader writes it, see `titleOf` in `documents.ts`.
 * - `title`, `titleLink`: What it was, its `SUMMARY`, and the link of it.
 *
 * @param entry - New or changed entry, with ISO instants
 * @param from - The box it is logged from or the entry being changed, `null` for none
 * @returns Fields and times
 * @throws {Error} - When the link typed for `Online` is no web address
 */
function fieldsOf(entry: EntryNew, from: { location: string; locationLink: string } | null): EntryFields {
    const [title, titleLink]: [string, string] = titleOf(entry);
    return {
        category: entry.category, title: title, titleLink: titleLink, location: entry.location,
        locationLink: placeLinkOf(entry.location, entry.locationLink, from), from: entry.from,
        module: entry.module, type: entry.type,
        semester: semesterFor(entry.category, entry.semester, berlinDateOf(new Date(entry.start))), note: entry.note,
        start: new Date(entry.start), end: new Date(entry.end),
    };
}

/**
 * Checks fields, foods and times of an entry of the log before they are written.
 * An entry has to fit its category, see {@link categoryAllows}, or keep what it was, or what the box it is logged
 * from was: the same category and title, for a skill entry the same skill and type, like an entry written before
 * its category got its rules, dragged to another time, or an older skill box `IN2028 DEV` of a type
 * no longer offered.
 * Only a meal lists foods, each line well formed, see {@link foodLineAllows}.
 * - `kept`: Whether the entry keeps what the entry being changed or its box was.
 *
 * @param fields - Fields and times to write
 * @param foods - Lines `X-FOOD` to write, none for an entry that is no meal
 * @param old - Entry being changed, or the box a new entry is logged from, `null` for none
 * @throws {Error} - When the fields or foods are not allowed or the end is not after the start
 */
function fieldsCheck(fields: EntryFields, foods: string[], old: Entry | Box | null): void {
    const kept: boolean = old !== null && old.title !== "" && fields.category === old.category
        && (fields.category === skillName ? fields.module === old.module && fields.type === old.type
            : fields.title === old.title);
    if (!(kept || categoryAllows(fields)))
        throw new Error(`No log entry ${fields.category} ${fields.title}`);
    if (foods.length > 0 && !([foodName, cookName].includes(fields.category) && foods.every(foodLineAllows)))
        throw new Error(`No foods ${foods.join(", ")} for ${fields.title}`);
    if (!(fields.start < fields.end))
        throw new Error(`${fields.title} needs an end after its start`);
}

/**
 * Reads the entries of the log that overlap a range, each meal with its kcal
 * and each glass of water marked, see {@link DayEntry}.
 * - `entries`: Entries of the range.
 * - `meals`: What the meals among them give, by their identifiers.
 *
 * @param start - Start of the range with offset, like `2026-07-03T00:00:00+02:00`
 * @param end - End of the range, excluded, in the same form
 * @returns {@link DayEntry}s overlapping the range
 */
export function dayEntriesRead(start: string, end: string): DayEntry[] {
    const entries: Entry[] = entriesRead(day.log, start, end);
    const meals: Map<string, Meal> = mealsOf(entries);
    return entries.map((entry: Entry): DayEntry => ({
        ...entry,
        chapters: chaptersOf(entry),
        kcal: meals.get(entry.id)?.kcal ?? null,
        estimate: meals.get(entry.id)?.estimate ?? false,
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
 * Checks the cooking a meal draws from, as the dialog sends it: empty for none, else the identifier of an entry
 * `Cook` of the log that starts before the meal; only a meal draws, and a link only ever points back in time,
 * so every day stays as it was once I close it.
 * - `cooking`: The entry of the cooking.
 *
 * @param category - Category of the entry, like `Food`
 * @param start - Start of the entry
 * @param cooked - Identifier of the cooking, empty for none
 * @throws {Error} - When an entry other than a meal draws, or the cooking is no entry `Cook` of the log
 *   that starts before the meal
 */
function cookedCheck(category: string, start: Date, cooked: string): void {
    if (cooked === "")
        return;
    if (category !== foodName)
        throw new Error(`Only a meal draws from a cooking: ${category}`);
    const cooking: Entry = entryFind(day.log, cooked)[1];
    if (cooking.category !== cookName || Date.parse(cooking.start) >= start.getTime())
        throw new Error(`No cooking before the meal: ${cooked}`);
}

/**
 * Reads how long the last entries of the log like a box really lasted, the latest first, so I anchor the expected
 * minutes of a box on what really happened, not on a hope, since plans run long (Buehler 1994): the last three
 * entries up to now with the same category and the same what, or for `Skill` the same module
 * and type, like `150, 165, 140` for `IN2028 VO`, or for `IN2028` without type.
 * - `now`: The moment.
 * - `like`: Whether an entry is like the box.
 *
 * @param category - Category of the box, like `Skill`
 * @param title - What of the box, like `Neck long`, ignored for `Skill`
 * @param module - Module of a skill box, like `IN2028`
 * @param type - Type of a skill box, like `VO`, empty for none
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
 * Adds an entry to the log, into the log it belongs into, see {@link logFileOf}, a meal with one line `X-FOOD`
 * per food, see {@link fieldsCheck}; an entry logged from a box with its `RELATED-TO`, after which the box is done,
 * see `boxDone` in `boxes.ts`;
 * a long neck session with my pain as `X-PAIN`, see {@link painCheck}; a meal drawn from a cooking with its
 * `X-COOKED`, see {@link cookedCheck}.
 * - `pain`: My pain, empty for none.
 * - `cooked`: Identifier of the cooking a meal draws from, empty for none.
 * - `own`: Properties of my own beyond the fields: the foods, the box, the pain and the cooking.
 * - `id`: Identifier of the new entry.
 *
 * @param entry - Entry as the entry by category or the counter of glasses sends it
 * @returns Identifier of the new entry
 * @throws {Error} - When the fields or foods are not allowed, the link typed for `Online` is no web address,
 *   the end is not after the start, or the box it is logged from is not open
 */
export function entryAdd(entry: EntryNew): string {
    const plan: Box | null = entry.planned === "" ? null : boxOpenFind(entry.planned);
    const fields: EntryFields = fieldsOf(entry, plan);
    fieldsCheck(fields, entry.foods, plan);

    const pain: string = entry.pain ?? "";
    painCheck(pain);
    const cooked: string = entry.cooked ?? "";
    cookedCheck(fields.category, fields.start, cooked);
    const own: [string, string | Link][] = entry.foods.map((food: string): [string, string] => ["x-food", food]);
    if (entry.planned !== "")
        own.push(["related-to", entry.planned]);
    if (pain !== "")
        own.push(["x-pain", pain]);
    if (cooked !== "")
        own.push(["x-cooked", cooked]);
    const id: string = entryAppend(logFileOf(fields), fields, own);
    if (entry.planned !== "")
        boxDone(entry.planned);
    return id;
}

/**
 * Logs a box at its real time, with one drop or one tap: a log entry of its category, what, place, and a skill entry
 * with its skill and type, written as the reader writes them, see `titleOf` in `documents.ts`, linking the folder
 * of its skill, from the start to the end the day sends,
 * pointing to the box with `RELATED-TO`, after which the box is done, see `boxDone` in `boxes.ts`. Its note stays
 * empty, since the note of a log entry is my diary note about what happened; a skill box hands on its links
 * to documents, like the slides of a lecture, see `documents.ts`, and its chapters as `X-CHAPTER`s, also those
 * whose folders an older box links; more chapters and documents a skill entry gets later in the dialog.
 * - `box`: The box.
 * - `skill`: Whether it is a skill box, whose links go along.
 * - `title`, `titleLink`: What it was, its `SUMMARY`, and the link of it.
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

    const skill: boolean = box.category === skillName;
    const [title, titleLink]: [string, string] = titleOf(box);
    const fields: EntryFields = {
        category: box.category, title: title, titleLink: titleLink, location: box.location,
        locationLink: box.locationLink, from: box.from, module: box.module, type: box.type,
        semester: semesterFor(box.category, box.semester, box.day), note: "",
        start: new Date(logged.start), end: new Date(logged.end),
    };
    fieldsCheck(fields, [], box);
    const id: string = entryAppend(logFileOf(fields), fields, [
        ["related-to", box.id],
        ...(skill ? documentLinksOf(box.links) : []).map((link: Link): [string, Link] => ["attach", link]),
        ...(skill ? box.chapters : []).map((chapter: string): [string, string] => ["x-chapter", chapter]),
    ]);
    boxDone(box.id);
    return id;
}

/**
 * Takes a done box back to open, with one click on its check, see the top of this file: removes the log entry
 * written from it, as if I had not logged it; one that holds what I added since, attempts, copies for my tutor
 * or a note, stays in the log and only lets go of the box, its `RELATED-TO` or its older `X-PLANNED` taken out.
 * A to-do done in another app, `COMPLETED` without log entry, is `NEEDS-ACTION` again.
 * - `box`: The box with its state and the times of its log entry.
 * - `logged`: The log entry pointing to it, `undefined` for none.
 * - `file`: `.ics` file of that log entry.
 *
 * @param id - Identifier of the box, like `study-13@nomsystem`
 * @throws {Error} - When there is no such box, it is not done, or it has a deadline, which only my tick decides,
 *   see `boxSubmit` in `boxes.ts`
 */
export function boxUndo(id: string): void {
    const [, , box]: [string, Entry, Box] = boxFind(id);
    if (box.state !== "done" || box.deadline !== "")
        throw new Error(`${box.title} is not done by a log entry`);
    const logged: Entry | undefined = box.log === null ? undefined
        : entriesRead(day.log, box.log.start, new Date(Date.parse(box.log.end) + 1).toISOString())
            .find((entry: Entry): boolean => entry.planned === id);
    if (logged !== undefined) {
        const [file]: [string, Entry] = entryFind(day.log, logged.id);
        if (logged.attempts.length > 0 || logged.tutors.length > 0 || logged.note.trim() !== "")
            propertiesPut(file, logged.id, [["related-to", []], ["x-planned", []]]);
        else
            entryRemove(file, logged.id);
    }
    boxReopen(id);
}

/**
 * Changes fields, foods, pain and times of an entry of the log, see {@link fieldsCheck}:
 * changed foods replace all lines `X-FOOD` of the entry first, a changed pain its `X-PAIN`, a changed cooking
 * of a meal its `X-COOKED`, see {@link cookedCheck}, then its fields and times change.
 * The entry moves into the log it belongs into now when that is another file, see {@link logFileOf}.
 *
 * @param change - Changed entry as the dialogs or the calendar send it, the calendar with the foods as they were
 * @throws {Error} - When there is no such entry, it may not be changed, the fields or foods are not allowed,
 *   the link typed for `Online` is no web address, or the end is not after the start
 */
export function entryEdit(change: EntryChange): void {
    const [file, entry]: [string, Entry] = entryFind(day.log, change.id);
    if (!entry.editable)
        throw new Error(`${entry.title} may not be changed`);

    const fields: EntryFields = fieldsOf(change, entry);
    fieldsCheck(fields, change.foods, entry);
    painCheck(change.pain ?? "");
    cookedCheck(fields.category, fields.start, change.cooked ?? entry.cooked);
    if (change.foods.join("\n") !== entry.foods.join("\n"))
        propertiesPut(file, entry.id, [["x-food", change.foods]]);
    if (change.pain !== undefined && change.pain !== entry.pain)
        propertiesPut(file, entry.id, [["x-pain", change.pain === "" ? [] : [change.pain]]]);
    if (change.cooked !== undefined && change.cooked !== entry.cooked)
        propertiesPut(file, entry.id, [["x-cooked", change.cooked === "" ? [] : [change.cooked]]]);
    entryChange(file, entry, fields, logFileOf(fields));
}

/**
 * Removes an entry of the log; when it was logged from a box, the box is open again, see `boxReopen` in `boxes.ts`.
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
