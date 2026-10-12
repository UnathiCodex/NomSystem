/**
 * ## Categories
 *
 * Entry by category, for plan and log alike: a fixed list of categories, each with its fields,
 * like `Way` with `By`, `From` and `To`.
 * Each field offers its values from the log itself, the most used first, equal ones alphabetical:
 * from the entries of the new system by their fields, and from the old log titles since 2024,
 * `Verb Objekt Ort` giving the object, and routes `<From>-<To>` giving both places.
 * Places are one list for every category.
 * A value offered in the code may come with steps, which the dialog shows while it is picked:
 * `Body` offers my neck routine, `Neck short` and `Neck long`, each with its exercises, see {@link neckRoutines},
 * and below them the note of the last entry of it, like `Last time: band red · 3×10`, so the load can rise.
 * A dish, the what of `Food` and `Cook`, names its foods parted by `, `, like `Reis, Bohnen, Eier`,
 * also when it comes from an old title, which joined them with `-`, like `Cook Reis-Bohnen-Eier`.
 * `Skill` is a category without such fields: in plan and log a module and a type, like `IN2028 VO`,
 * see {@link skillTypes}; in the log also its chapters, its document and its attempts, which only the skill area writes,
 * see `skill.ts`.
 * A box of the plan takes only what I intend and would otherwise forget, so not `Sleep`, `Food`, `Cook`, `Drink`
 * and `Game`, which happen anyway, see {@link unplannedNames}; `Watch` stays, since a cinema or a match has its time.
 *
 * - `./calendar.ts`: Reads `.ics` files into entries.
 * - `./sources.ts`: Names every folder and file the reader reads.
 */

import { entriesRead } from "./calendar.ts";
import { day } from "./sources.ts";

import type { Entry, EntryTexts } from "./calendar.ts";


/**
 * Field of an entry a field of a category writes into:
 * `title` into `SUMMARY`, `from` into `X-FROM`, `location` into `LOCATION`.
 */
export type FieldKey = "title" | "from" | "location";

/**
 * A field of a category, picked from its list.
 *
 * - `name`: Name shown, like `By`.
 * - `key`: Field of the entry it writes into.
 * - `values`: Values to pick, the most used first; in the code only those offered before any use.
 * - `steps`: Steps of a value offered in the code, by the value, which the dialog shows while it is picked,
 *   like the exercises of `Neck short`; none for the other values.
 */
export type Field = {
    name: string;
    key: FieldKey;
    values: string[];
    steps: { [value: string]: string[] };
};

/**
 * A category with its fields.
 * A category without a field `title` writes its own name as `SUMMARY`, like `Sleep`.
 *
 * - `name`: Name of the category, written as `CATEGORIES`, like `Way`.
 * - `fields`: Its fields, in the order they are picked.
 */
export type Category = {
    name: string;
    fields: Field[];
};

/**
 * A {@link Category} as the page gets it, which also tells whether a box of the plan may have it.
 *
 * - `plan`: Whether a box of the plan may have the category, all but {@link unplannedNames}.
 */
export type CategoryShown = Category & {
    plan: boolean;
};

/**
 * My neck routine, offered as the what of `Body`, each with its steps, which the dialog shows while it is picked:
 * strengthening of the neck, shoulders and shoulder blades, chosen by research
 * (`.claude/studies/science.md`, point 16).
 * `Neck short` every study day, about 5 minutes: lateral raises with an elastic band eased neck pain
 * with 2 minutes a day as much as with 12. `Neck long` on three of those days, about 20 minutes: the short one
 * and four exercises more, three sets each, the load rising from about 12 repetitions toward 8,
 * as in a trial in trapezius myalgia (Gross 2015). Regularity is the dose, so the trackers count the sessions
 * of seven days against my goal, see `trackers.ts`; strengthening helped after 10 to 20 weeks, not yet after 4,
 * so the routine is judged after 10 to 12 weeks.
 */
export const neckRoutines: { [what: string]: string[] } = {
    "Neck short": [
        "About 5 minutes, every study day",
        "Lateral raises with an elastic band, 2 minutes",
        "Chin nods, 10 holds of 10 seconds",
    ],
    "Neck long": [
        "About 20 minutes, on 3 study days a week",
        "Lateral raises with an elastic band, 2 minutes",
        "Chin nods, 10 holds of 10 seconds",
        "Shrugs, one-arm rows, reverse flies, upright rows",
        "3 sets each, from about 12 toward 8 repetitions",
    ],
};

/**
 * Builds a category with the fields `What` and `Place`.
 *
 * @param name - Name of the category, like `Food`
 * @param routines - Values offered as its what before any use, each with its steps, like {@link neckRoutines};
 *   none for most categories
 * @returns Category to pick what and where
 */
function categoryOf(name: string, routines: { [what: string]: string[] }): Category {
    return {
        name: name,
        fields: [
            { name: "What", key: "title", values: Object.keys(routines), steps: routines },
            { name: "Place", key: "location", values: [], steps: {} },
        ],
    };
}

/**
 * Category of skill entries, written as `CATEGORIES:Skill`: in plan and log a module and a type,
 * in the log also its chapters, its document and its attempts, which only the skill area writes.
 */
export const skillName: string = "Skill";

/**
 * Types of a skill entry, the abbreviations of my old naming `[CODE] TYP`, each written as its `X-TYPE`:
 * `VO` a lecture and `TU` a tutorial I attend, `HU` a homework sheet I work on, `DEV` my own study,
 * solving the tasks of my notes, `FA` an exam and `PR` a practical course.
 */
export const skillTypes: string[] = ["VO", "TU", "HU", "DEV", "FA", "PR"];

/**
 * Categories whose what is a dish: its foods parted by `, `, like `Reis, Bohnen, Eier`.
 */
const dishCategories: string[] = ["Food", "Cook"];

/**
 * Categories no box of the plan has, since they happen anyway: my sleep, my meals and their cooking, my drinks
 * and what I play.
 */
const unplannedNames: string[] = ["Sleep", "Food", "Cook", "Drink", "Game"];

/**
 * Categories with their fields, in the order of their importance for my life, the one order of every list of them.
 */
const categories: Category[] = [
    { name: skillName, fields: [] },
    { name: "Sleep", fields: [{ name: "Place", key: "location", values: [], steps: {} }] },
    categoryOf("Food", {}),
    categoryOf("Cook", {}),
    categoryOf("Body", neckRoutines),
    categoryOf("Meditate", {}),
    {
        name: "Way",
        fields: [
            {
                name: "By", key: "title", values: ["Walk", "Bike", "U-Bahn", "S-Bahn", "Tram", "Bus", "Train", "Car"],
                steps: {},
            },
            { name: "From", key: "from", values: [], steps: {} },
            { name: "To", key: "location", values: [], steps: {} },
        ],
    },
    categoryOf("Talk", {}),
    categoryOf("Drink", {}),
    categoryOf("Watch", {}),
    categoryOf("Game", {}),
];

/**
 * Start of the log the lists read: since 1 January 2024 its titles are `Verb Objekt Ort`.
 */
const vocabularyStart: string = "2024-01-01T00:00:00Z";

/**
 * Old route titles, `<From>-<To>` like `HomeMunich-TumGarching`.
 */
const route: RegExp = /^([^\s-]+)-([^\s-]+)$/;


/**
 * Reads the timed log entries from 2024 up to an instant.
 *
 * @param now - Present as ISO instant
 * @returns Log entries that started before the instant
 */
function logsRead(now: string): Entry[] {
    return entriesRead(day.log, vocabularyStart, now).filter((log: Entry): boolean => !log.allDay);
}

/**
 * Takes the object of an old log title of a category, the word after its verb, as the what of a new entry:
 * `Watch` of `Watch YouTube Wissen` gives `YouTube`; a dish gets `, ` between its foods in place of `-`,
 * so `Cook` of `Cook Reis-Eier-Tomaten Socials` gives `Reis, Eier, Tomaten`.
 * - `words`: Words of the title, the verb first.
 *
 * @param title - Old log title
 * @param name - Name of the category, the verb
 * @returns Object, empty when the title is not of the category
 */
function objectOf(title: string, name: string): string {
    const words: string[] = title.split(" ");
    if (words[0] !== name || words.length < 2)
        return "";
    return dishCategories.includes(name) ? words[1].replaceAll("-", ", ") : words[1];
}

/**
 * Lists the places of log entries: places and starts of new entries, both ends of old routes.
 *
 * @param logs - Log entries
 * @returns Every use of a place, a place as often as it was used
 */
function placeUsesOf(logs: Entry[]): string[] {
    return logs.flatMap((log: Entry): string[] =>
        log.category !== "" ? [log.location, log.from] : (log.title.match(route)?.slice(1) ?? []));
}

/**
 * Lists the values of the field `title` of a category in log entries:
 * the what of new entries, the object of old titles.
 *
 * @param logs - Log entries
 * @param name - Name of the category
 * @returns Every use of a value, a value as often as it was used, empty for an entry of another verb
 */
function titleUsesOf(logs: Entry[], name: string): string[] {
    return logs.flatMap((log: Entry): string[] => {
        if (log.category === "")
            return [objectOf(log.title, name)];
        if (log.category === name)
            return [log.title];
        return [];
    });
}

/**
 * Orders values by how often they were used, the most used first, equal ones alphabetical.
 *
 * @param uses - Every use of a value
 * @param offered - Values offered even when never used
 * @returns Each value once, without empty ones
 */
function valuesOrder(uses: string[], offered: string[]): string[] {
    const counts: Map<string, number> = new Map([...offered, ...uses]
        .filter((value: string): boolean => value !== "")
        .map((value: string): [string, number] => [value, 0]));
    uses.filter((value: string): boolean => counts.has(value))
        .forEach((value: string): void => {
            counts.set(value, (counts.get(value) ?? 0) + 1);
        });
    return [...counts.keys()].sort((first: string, second: string): number =>
        (counts.get(second) ?? 0) - (counts.get(first) ?? 0) || first.localeCompare(second));
}

/**
 * Gives the steps of each value with steps, and after them the note of the last log entry of the value,
 * like `Last time: band red · 3×10` for `Neck long`.
 * - `last`: Last log entry of the category and the value with a note, `undefined` for none.
 *
 * @param logs - Log entries up to now, in any order
 * @param name - Name of the category, like `Body`
 * @param steps - Steps of each value, like {@link neckRoutines}
 * @returns Steps of each value, with the last note
 */
function stepsWithNoteOf(logs: Entry[], name: string, steps: { [what: string]: string[] }): { [what: string]: string[] } {
    return Object.fromEntries(Object.entries(steps).map(([what, own]: [string, string[]]): [string, string[]] => {
        const last: Entry | undefined = logs
            .filter((log: Entry): boolean => log.category === name && log.title === what && log.note.trim() !== "")
            .sort((first: Entry, second: Entry): number => first.start.localeCompare(second.start))
            .at(-1);
        return [what, last === undefined ? own : [...own, `Last time: ${last.note.trim()}`]];
    }));
}

/**
 * Reads the categories with the values of their fields, see {@link valuesOrder},
 * each telling whether a box of the plan may have it; a value with steps gets the note of its last entry,
 * see {@link stepsWithNoteOf}.
 * - `logs`: Log entries up to now.
 * - `places`: One list of places for every field of a place.
 *
 * @param now - Present as ISO instant, as the page knows it
 * @returns {@link CategoryShown}s in their order
 */
export function categoriesRead(now: string): CategoryShown[] {
    const logs: Entry[] = logsRead(now);
    const places: string[] = valuesOrder(placeUsesOf(logs), []);
    return categories.map((category: Category): CategoryShown => ({
        name: category.name,
        fields: category.fields.map((field: Field): Field => ({
            ...field,
            values: field.key === "title" ? valuesOrder(titleUsesOf(logs, category.name), field.values) : places,
            steps: stepsWithNoteOf(logs, category.name, field.steps),
        })),
        plan: !unplannedNames.includes(category.name),
    }));
}

/**
 * Reads how long the entries of a category usually last: the median length of the new entries of the category
 * and of the old titles with its verb since 2024, like 30 minutes for `Food`.
 * - `lengths`: Length of each entry in minutes, the shortest first.
 *
 * @param name - Name of the category, like `Food`
 * @param now - Present as ISO instant
 * @returns Minutes, 30 when the category has no entries yet
 */
export function usualLengthRead(name: string, now: string): number {
    const lengths: number[] = logsRead(now)
        .filter((log: Entry): boolean => log.category === name || (log.category === "" && objectOf(log.title, name) !== ""))
        .map((log: Entry): number => Math.round((Date.parse(log.end) - Date.parse(log.start)) / 60000))
        .sort((first: number, second: number): number => first - second);
    return lengths[Math.floor(lengths.length / 2)] ?? 30;
}

/**
 * Finds where the last way before an instant ended: the place of the last new `Way`, or the end of the last old route.
 * - `last`: Last way that started before the instant.
 *
 * @param before - Start of the new entry as ISO instant
 * @returns Place, empty when there was no way before
 */
export function wayEndRead(before: string): string {
    const last: Entry | undefined = logsRead(before)
        .filter((log: Entry): boolean =>
            log.category === "Way" || (log.category === "" && route.test(log.title)))
        .sort((first: Entry, second: Entry): number => second.start.localeCompare(first.start))[0];
    if (last === undefined)
        return "";
    if (last.category === "Way")
        return last.location;
    return last.title.match(route)?.[2] ?? "";
}

/**
 * Writes what a skill entry was, its `SUMMARY`, from its module and type joined by a space,
 * as the lectures imported into the plan have it.
 *
 * @param module - Module code, like `IN2028`
 * @param type - One of the {@link skillTypes}, like `VO`
 * @returns What, like `IN2028 VO`
 */
export function skillTitleOf(module: string, type: string): string {
    return `${module} ${type}`;
}

/**
 * Tells whether the fields of an entry fit its category, in plan and log alike:
 * the category is in the list, what is picked or, without a field `title`, the name of the category,
 * `from` is only set when the category has the field, and module and type stay empty.
 * `Skill` is a module code, like `IN2028`, one of the {@link skillTypes}, and what written from both,
 * see {@link skillTitleOf}; its chapters, document and attempts in the log only the skill area writes.
 * - `keys`: Fields of the category.
 *
 * @param fields - Text fields of an entry or a box to write
 * @returns Whether the entry may be written
 */
export function categoryAllows(fields: EntryTexts): boolean {
    const category: Category | undefined = categories.find((candidate: Category): boolean =>
        candidate.name === fields.category);
    if (category === undefined)
        return false;
    if (category.name === skillName)
        return /^\w+$/.test(fields.module) && skillTypes.includes(fields.type)
            && fields.title === skillTitleOf(fields.module, fields.type) && fields.from === "";

    const keys: FieldKey[] = category.fields.map((field: Field): FieldKey => field.key);
    return (keys.includes("title") ? fields.title.trim() !== "" : fields.title === category.name)
        && (keys.includes("from") || fields.from === "") && fields.module === "" && fields.type === "";
}

/**
 * Tells whether the fields of a box of the plan fit its category, as those of an entry, see {@link categoryAllows},
 * and the category is one I plan, not one of {@link unplannedNames}.
 *
 * @param fields - Text fields of a box to write
 * @returns Whether the box may be written
 */
export function planAllows(fields: EntryTexts): boolean {
    return categoryAllows(fields) && !unplannedNames.includes(fields.category);
}
