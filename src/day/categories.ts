/**
 * ## Categories
 *
 * Writes plan and log the same way, by category: pick the category from the list at the left of the dialog,
 * then each of its fields from its own list, then save; Esc or a click beside the dialog closes it without saving.
 * A `Way` is `By`, `From` and `To`, every other category `What` and `Place`, the what of `Sleep` only `Night` or `Day`,
 * a nap;
 * a value with steps shows them below its list while it is picked, like the exercises of my neck routine in `Body`;
 * in the log, `Food` below them its foods, each with its grams, and what the meal gives, see `meal.ts`,
 * a meal with foods named by them, like `Haferflocken, Milch`, so its what only picks an earlier meal to fill them in,
 * and `Cook` below them one tap for the meal eaten right after it, which the reader adds with the cooking,
 * pointing to it.
 * `Skill` is a skill and a type or none, like `IN2028 VO` or the project `WokFlow`, in plan and log; in the log also
 * the chapters it covered, the document it used and attempts at tasks, each with its result and my effort,
 * see `skill.ts`.
 * Every entry can carry a free note, typed like start and end.
 * The categories come in the order the reader gives them, by their importance for my life;
 * a box of the plan offers all but those I don't plan, `Sleep`, `Food`, `Cook`, `Drink` and `Game`.
 * Each list comes from the log, the most used first, searched as I type, see `choices.ts`;
 * the typed text can be added as a new value, which is then picked, but to the what of `Sleep`, which takes no new one.
 * Places, the place of an entry and where a way starts, are only my places of `Places.md`, the most used first;
 * a new place is added with its address through a small dialog before it is picked, see `places.ts`.
 * `From` starts where the last way before the entry ended.
 * An entry of the log has a day like `13.10.2026`, the calendar date of its start, typed to move it to any other day,
 * a start, a plain time on that day, and an end, a plain time with its own day beside it, which fills itself
 * with the day, or the day after while the end time lies at or before the start time, until I type over it,
 * see {@link endDayFill}; all saved exactly as they show. A box of the plan has a day like `19.10.2026`,
 * typed to move it to any other day, an expected time and an expected duration
 * in minutes, each optional, but for a lecture imported from TUMonline, which keeps both, see `reader/boxes.ts`,
 * and optionally a deadline, a day like `23.10.2026` with a time or without; a box with a deadline lies
 * on the day of its deadline and has no expected time, so both their fields are off while the day of a deadline
 * is typed.
 * The dialog opens for the log from `+` above the time grid, from a range selected in the time grid,
 * and from a log entry that can be changed, to change it; for a box from `+` above the list of boxes,
 * from a suggested study session, filled in as suggested, see `suggestions.ts`,
 * and from a box that can be changed, to change it, or to log it instead, filled in as planned;
 * one that cannot, like an occurrence of a weekly lecture, opens it to be logged. A log entry logged from a box points
 * to it, also to an occurrence of a series, see `entries.ts`;
 * a box logged at its real time by dragging it into the log, or as expected by a tap, needs no dialog,
 * see `boxes.ts`.
 *
 * - `./choices.ts`: Pickers, in rows with their names.
 * - `./entries.ts`: Sends new, changed and removed entries to the reader.
 * - `./meal.ts`: The foods of a meal, the fields of `Food` below what and place.
 * - `./places.ts`: The dialog of a new place, which adds it with its address to `Places.md`.
 * - `./skill.ts`: The fields of `Skill`: skill and type, and in the log chapters, document and attempts.
 * - `./times.ts`: Turns dates into the values of time fields and back, writes and reads days like `13.10.2026`,
 *   and gives the times a box is logged at.
 * - `../skill/attempts.ts`: Names the category of skill entries.
 * - `../icons.ts`: Shows icons in the buttons of the dialog, its words as tooltip.
 * - `lucide`: The icons save, cancel and remove.
 * - `fullcalendar`: Calendar that shows the entries.
 */

import { choiceOf, choicesOf, rowOf, searchOf } from "./choices.ts";
import { boxAdd, boxChange, boxDelete, entryAdd, entryChange, entryDelete, mealAfterCookAdd } from "./entries.ts";
import { foodName, mealDishFill, mealFoods, mealOf, mealTitle } from "./meal.ts";
import { placeOpen, placesStart } from "./places.ts";
import { skillFieldsShow, skillModuleType, skillReady, skillSave } from "./skill.ts";
import { boxTimesOf, dateOf, dateParse, dateTextOf, timeFieldRead, timeFieldShow, timeOf } from "./times.ts";
import { dayOf, skillName } from "../skill/attempts.ts";
import { iconPut } from "../icons.ts";
import { Check, CircleQuestionMark, Trash2, X } from "lucide";

import type { Calendar, EventApi } from "fullcalendar";
import type { Box } from "./boxes.ts";
import type { Choice } from "./choices.ts";
import type { BoxFields, EntryFields } from "./entries.ts";
import type { ModuleType, SkillValues } from "./skill.ts";


/**
 * Field of an entry a field of a category writes into: `title`, `from` or `location`.
 */
type FieldKey = "title" | "from" | "location";

/**
 * A field of a category, as the reader gives it.
 *
 * - `name`: Name shown, like `By`.
 * - `key`: Field of the entry it writes into.
 * - `values`: Values to pick, the most used first.
 * - `steps`: Steps of a value offered in the code, by the value, like the exercises of `Neck short`.
 * - `fixed`: Whether it takes only its values, like `Night` and `Day` of `Sleep`, and no new ones.
 */
type Field = {
    name: string;
    key: FieldKey;
    values: string[];
    steps: { [value: string]: string[] };
    fixed: boolean;
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
const skillNone: SkillValues = { module: "", type: "", chapters: [], links: [], attempts: [] };

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
 * Whether the remove button was clicked once and waits for the second click.
 */
let removeAsked: boolean = false;

/**
 * Whether the meal of a cooking is to be added right after it when the dialog saves.
 */
let eatenAfter: boolean = false;

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
 * Gives the start of the entry as the fields of the dialog say: its time on its typed day, like `01:45`
 * on `13.10.2026`, on the day the dialog opened with should the typed day be no date.
 * - `day`: Typed day, like `2026-10-13`.
 *
 * @returns Start of the entry
 */
function startRead(): Date {
    const day: string =
        dateParse((document.getElementById("entry-log-day") as HTMLInputElement).value) ?? dayOf(opened.start);
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
 * Allows saving once a category is picked and, when it has the field `title`, its value too,
 * unless it is a meal of the log that lists foods, which name it;
 * a skill entry once its skill is picked, and a result for each task picked, see `skill.ts`.
 * - `titled`: Whether the category picked has the field `title`.
 */
function saveAllow(): void {
    const titled: boolean = chosen?.fields.some((field: Field): boolean => field.key === "title") ?? false;
    (document.getElementById("entry-save") as HTMLButtonElement).disabled = chosen === null
        || (titled && valuesRead().title === "" && !foodsListed())
        || (chosen.name === skillName && !skillReady());
    realShow().catch((error: unknown): void => console.error(error));
}

/**
 * Shows under the minutes of a box how long the last three entries like it really lasted, the latest first,
 * like `Real, last 3: 150 · 165 · 140 min`, so I plan by what happened, not by a hope (Buehler 1994);
 * a new box whose minutes are still empty gets their median. Hidden for an entry of the log and while none is logged.
 * - `line`: The line under the minutes.
 * - `texts`: Category, what, module and type picked.
 * - `key`: The same as one text, to load only when they change.
 * - `real`: Minutes of the last entries like the box, the latest first.
 * - `middle`: Their median, the middle one when sorted.
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
    const minutes: HTMLInputElement = document.getElementById("entry-minutes") as HTMLInputElement;
    const sorted: number[] = [...real].sort((first: number, second: number): number => first - second);
    const middle: number = sorted[Math.floor(real.length / 2)];
    line.textContent = `Real, last ${real.length}: ${real.join(" · ")} min`;
    line.hidden = false;
    if (opened.box === null && minutes.value === "")
        minutes.value = String(middle);
}

/**
 * Takes a value picked into the list of every field of its kind that lacks it, like a new place,
 * because places are one list for every field of a place.
 *
 * @param field - Field the value was picked in
 * @param value - Value picked, maybe new
 */
function valueAdd(field: Field, value: string): void {
    (chosen?.fields ?? [])
        .filter((other: Field): boolean =>
            (other.key === "title") === (field.key === "title") && !other.values.includes(value))
        .forEach((other: Field): void => {
            other.values.push(value);
        });
}

/**
 * Builds the row that offers the meal of a cooking, eaten right after it: one chip, picked by one tap;
 * only for a cooking of the log no meal points to yet.
 *
 * @returns Row, none for any other entry
 */
function eatenRowOf(): HTMLElement[] {
    if (opened.target !== "log" || chosen?.name !== cookName || opened.entry?.extendedProps.eaten === true)
        return [];
    return [rowOf("Meal", choicesOf({
        search: searchOf([{ value: "eaten", text: "Eaten right after", group: "" }]),
        picked: eatenAfter ? ["eaten"] : [],
        many: false,
        adding: false,
        pick: (picked: string[]): void => {
            eatenAfter = picked.length > 0;
        },
    }))];
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
 * Builds the row of my neck pain for `Body` in the log: 0 to 10, one chip picked by one tap, the outcome
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
 * Shows one picker per field of the category picked, see {@link choicesOf}: its values, the most used first,
 * searched as I type, the typed text taken as a new value with `+`, see {@link valueAdd}, but in a field
 * that takes no new values, like the what of `Sleep`,
 * a new place only once it is saved with its address in the dialog of a new place, see `placeOpen` in `places.ts`;
 * below the picker of a field whose values have steps, the steps of the value picked, see {@link stepsShow};
 * for a cooking below them the meal eaten right after it, see {@link eatenRowOf}, and for `Body` my neck pain,
 * shown while `Neck long` is picked, see {@link painRowOf}.
 * The what of a meal fills in the foods its dish held the last time, while the meal lists none, see `meal.ts`.
 * - `rows`: Row of each field, and below it the place of its steps when its values have steps.
 * - `steps`: Place of the steps of a field.
 */
function fieldsShow(): void {
    const rows: HTMLElement[] = (chosen?.fields ?? []).flatMap((field: Field): HTMLElement[] => {
        const steps: HTMLElement = document.createElement("ul");
        steps.className = "entry-steps";
        stepsShow(steps, field);
        const row: HTMLElement = rowOf(field.name, choicesOf({
            search: (text: string): Promise<Choice[]> => searchOf(field.values.map(choiceOf))(text),
            picked: values[field.key] === "" ? [] : [values[field.key]],
            many: false,
            adding: !field.fixed,
            add: field.key === "title" ? undefined : placeOpen,
            pick: (picked: string[]): void => {
                values[field.key] = picked[0] ?? "";
                if (values[field.key] !== "")
                    valueAdd(field, values[field.key]);
                if (chosen?.name === foodName && opened.target === "log" && field.key === "title"
                    && values.title !== "")
                    mealDishFill(values.title, saveAllow).catch((error: unknown): void => console.error(error));
                stepsShow(steps, field);
                document.getElementById("entry-pain")?.toggleAttribute("hidden", !neckLongPicked());
                saveAllow();
            },
        }));
        return Object.keys(field.steps).length > 0 ? [row, steps] : [row];
    });
    document.getElementById("entry-fields")?.replaceChildren(...rows, ...eatenRowOf(), ...painRowOf());
    saveAllow();
}

/**
 * Loads where the last way before the start of the entry ended, from the reader.
 *
 * @returns Place, empty when there was no way before
 * @throws {Error} - When the reader gives no valid answer
 */
async function wayEndLoad(): Promise<string> {
    const response: Response = await fetch(`/api/day/way-end?before=${startRead().toISOString()}`);
    return await response.json();
}

/**
 * Picks a category: shows its button picked and its fields, keeping the places picked under the category before.
 * A new entry of a category with the field `from` starts where the last way ended.
 * `Food` in the log shows its foods below its fields, those of the meal being changed,
 * see `meal.ts`; `Skill` shows its skill and type, and in the log its chapters, document and attempts, see `skill.ts`.
 * - `fields`: Place of the fields in the dialog.
 * - `meal`: Foods of a meal, put below the fields unless another category was picked meanwhile.
 *
 * @param category - Category to pick, or `null` for none yet
 * @throws {Error} - When the reader gives no valid answer
 */
async function categoryPick(category: Category | null): Promise<void> {
    values = chosen === null ? { ...opened.values } : { ...valuesRead(), title: "" };
    chosen = category;
    document.querySelectorAll<HTMLButtonElement>("#entry-categories button").forEach((button: HTMLButtonElement): void => {
        button.classList.toggle("chosen", button.textContent === category?.name);
    });
    if (category?.name === skillName) {
        await skillFieldsShow(document.getElementById("entry-fields") as HTMLElement, opened.target === "box",
            opened.category === skillName ? opened.skill : skillNone, saveAllow);
        saveAllow();
        return;
    }
    const starts: boolean = category?.fields.some((field: Field): boolean => field.key === "from") ?? false;
    if (starts && opened.entry === null && values.from === "")
        values.from = await wayEndLoad();
    fieldsShow();
    if (category?.name === foodName && opened.target === "log") {
        const meal: HTMLElement = await mealOf(opened.category === foodName ? opened.foods : [], saveAllow);
        if (chosen === category)
            document.getElementById("entry-fields")?.append(rowOf("Foods", meal));
        saveAllow();
    }
}

/**
 * Shows one button per category in the dialog, one below the other at its left; for a box only the categories I plan.
 * While a log entry is changed, `Skill` stays apart: a skill entry cannot become another category,
 * nor another entry a skill entry, because only the skill area writes the chapters, document and attempts
 * of a skill entry of the log; a skill box is a plain box, which may change its category.
 */
function namesShow(): void {
    const buttons: HTMLButtonElement[] = categories.filter((category: Category): boolean =>
        opened.target === "log" || category.plan).map((category: Category): HTMLButtonElement => {
        const button: HTMLButtonElement = document.createElement("button");
        button.type = "button";
        button.textContent = category.name;
        button.disabled = opened.target === "log" && opened.entry !== null
            && (category.name === skillName) !== (opened.category === skillName);
        button.addEventListener("click", (): void => {
            categoryPick(category).catch(errorShow);
        });
        return button;
    });
    document.getElementById("entry-categories")?.replaceChildren(...buttons);
}

/**
 * Reads what the entry was, its `SUMMARY`: a skill entry its skill and type joined by a space, like `IN2028 VO`,
 * its skill alone without type, like `WokFlow`,
 * a meal of the log with foods their names, see {@link mealTitle};
 * else what is picked, like `Night` of `Sleep`, or the name of a category without the field `title`.
 *
 * @param picked - What is picked in its list, empty for none
 * @returns What the entry was
 */
function titleRead(picked: string): string {
    if (chosen?.name === skillName)
        return skillModuleType().type === "" ? skillModuleType().module
            : `${skillModuleType().module} ${skillModuleType().type}`;
    if (foodsListed())
        return mealTitle();
    return chosen?.fields.some((field: Field): boolean => field.key === "title") ? picked : chosen?.name ?? "";
}

/**
 * Reads the text fields of the dialog, as an entry of the log and a box have them.
 * A skill entry keeps the place it had, since `Skill` has no field of a place,
 * like the room of a lecture imported into the plan.
 * - `picked`: Values picked in the lists.
 * - `skill`: Skill and type of a skill entry, empty for any other entry.
 *
 * @returns Category, what, place, where a way starts, module, type and note, as a box of the day the dialog opened with,
 *   without time, duration and deadline
 */
function textsRead(): BoxFields {
    const picked: { [key in FieldKey]: string } = valuesRead();
    const skill: ModuleType = chosen?.name === skillName ? skillModuleType() : { module: "", type: "" };
    return {
        category: chosen?.name ?? "",
        title: titleRead(picked.title),
        location: chosen?.name === skillName && opened.category === skillName
            ? opened.values.location : picked.location,
        from: picked.from,
        module: skill.module,
        type: skill.type,
        note: (document.getElementById("entry-note") as HTMLTextAreaElement).value.trim(),
        day: dayOf(opened.start),
        time: null,
        minutes: null,
        deadline: "",
    };
}

/**
 * Gives the end of the entry as the fields of the dialog say: its time on the typed day of the end, like `07:30`
 * on `13.10.2026`, on the day of the start should the typed day be no date.
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
 * Fills the day of the end of a log entry as day, start and end are typed, until I type into it myself:
 * the day, or the day after while the end time lies at or before the start time, like a night of sleep,
 * `12.10.2026`, `23:30` to `07:30`, ending on `13.10.2026`; nothing while one of them is no day or no time.
 * - `day`: Typed day, like `2026-10-12`.
 * - `start`, `end`: Typed start and end time, like `23:30` and `07:30`.
 * - `next`: The day after the typed day.
 */
function endDayFill(): void {
    const day: string | null = dateParse((document.getElementById("entry-log-day") as HTMLInputElement).value);
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
        module: texts.module, type: texts.type, note: texts.note,
        foods: chosen?.name === foodName ? mealFoods() : [],
        planned: opened.entry === null ? opened.plan?.id ?? "" : "",
        pain: neckLongPicked() ? pain : "",
        start: start,
        end: end,
    };
}

/**
 * Reads fields, note, day, expected time, expected duration and deadline of the dialog for a box, on its typed day,
 * its expected time on that day, so `19.10.2026` and `09:15` move a box of 12 October at 14:00 to 19 October at 09:15,
 * and the reader into the plan file of that day; or with a deadline on the day of its deadline,
 * without expected time; an empty time, duration or deadline is none.
 * - `day`: Typed day, like `2026-10-19`, the day the dialog opened with should it be no date.
 * - `time`: Typed expected time, empty for none.
 * - `minutes`: Typed expected duration, empty for none.
 * - `deadlineDay`: Typed day of the deadline, like `2026-10-23`, empty for none.
 * - `deadlineTime`: Typed time of the deadline, empty for none.
 *
 * @returns Fields of the box
 */
function boxFieldsRead(): BoxFields {
    const day: string =
        dateParse((document.getElementById("entry-box-day") as HTMLInputElement).value) ?? dayOf(opened.start);
    const time: string = timeFieldRead(document.getElementById("entry-time") as HTMLInputElement);
    const minutes: string = (document.getElementById("entry-minutes") as HTMLInputElement).value.trim();
    const deadlineDay: string =
        dateParse((document.getElementById("entry-deadline-day") as HTMLInputElement).value) ?? "";
    const deadlineTime: string = timeFieldRead(document.getElementById("entry-deadline-time") as HTMLInputElement);
    return {
        ...textsRead(),
        day: deadlineDay === "" ? day : deadlineDay,
        time: deadlineDay !== "" || time === "" ? null : dateOf(new Date(`${day}T12:00:00`), time),
        minutes: minutes === "" ? null : Number(minutes),
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
 * - `fields`: Fields, note, day, expected time, duration and deadline of the dialog.
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
 * see {@link boxSave}. A skill entry goes to the one writer of skill entries, see `skill.ts`,
 * and a cooking with its meal picked adds the meal right after it, once the cooking is written.
 * - `fields`: Fields, note and times of the dialog.
 * - `id`: Identifier of the entry, of the new one once it is written.
 *
 * @param calendar - Calendar of the day
 * @throws {Error} - When the reader does not take the entry or the meal
 */
async function entrySave(calendar: Calendar): Promise<void> {
    if (opened.target === "box") {
        await boxSave();
        return;
    }
    const fields: EntryFields = fieldsRead();
    let id: string = opened.entry?.id ?? "";
    if (chosen?.name === skillName)
        await skillSave(calendar, id, fields);
    else if (opened.entry !== null)
        await entryChange(calendar, opened.entry.id, fields);
    else
        id = await entryAdd(calendar, fields);
    if (chosen?.name === cookName && eatenAfter)
        await mealAfterCookAdd(calendar, id);
    (document.getElementById("entry") as HTMLDialogElement).close();
}

/**
 * Removes the entry of the log or the box being changed on the second click, then closes the dialog;
 * the first click only asks, its trash turning into a question mark of the same size, so the button never jumps. A box planned by mistake is removed; a box I decided against is dropped instead,
 * with its cross in the list, so it can be counted.
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
 * Turns the day and the expected time of a box off while the day of a deadline is typed, since a box with a deadline
 * lies on the day of its deadline and has no expected time, so `23.10.2026` typed as deadline leaves the day unread;
 * and asks for the day of a deadline while its time is typed, since a time alone is no deadline.
 * - `deadlineDay`, `deadlineTime`: Fields of the day and the time of the deadline.
 */
function deadlineSee(): void {
    const deadlineDay: HTMLInputElement = document.getElementById("entry-deadline-day") as HTMLInputElement;
    const deadlineTime: HTMLInputElement = document.getElementById("entry-deadline-time") as HTMLInputElement;
    (document.getElementById("entry-box-day") as HTMLInputElement).disabled = deadlineDay.value.trim() !== "";
    (document.getElementById("entry-time") as HTMLInputElement).disabled = deadlineDay.value.trim() !== "";
    deadlineDay.required = deadlineTime.value.trim() !== "";
}

/**
 * Shows the times of the dialog: the day, start and end of an entry of the log, or the day, the expected time
 * and duration of a box and its deadline, the other times hidden and disabled, so the browser checks only the times
 * shown before it sends the form. The day of an entry of the log is the calendar date of the start it opens with,
 * like `13.10.2026` for a selection at 01:45 at the bottom of 12 October, the day of its end the calendar date
 * of the end it opens with, which fills itself again as I type, see {@link endDayFill}.
 * The day of a box is the day the dialog opened with, like `12.10.2026`, the shown day for a new one.
 * The expected time and duration of a box may stay empty, but for an event of the plan, which keeps both
 * and has no deadline, since only a to-do has one.
 * - `boxed`: Whether the dialog writes a box.
 * - `logDay`: Field of the day of an entry of the log.
 * - `endDay`: Field of the day of its end.
 * - `day`: Field of the day of the box.
 * - `required`: Whether the box needs both, being an event of the plan.
 * - `deadline`: Deadline of the box being changed, empty for none and for a new box.
 *
 * @param opening - What the dialog shows
 */
function timesShow(opening: EntryOpening): void {
    const boxed: boolean = opening.target === "box";
    const required: boolean = opening.box !== null && !opening.box.todo;
    const logTimes: HTMLFieldSetElement = document.getElementById("entry-log-times") as HTMLFieldSetElement;
    const boxTimes: HTMLFieldSetElement = document.getElementById("entry-box-times") as HTMLFieldSetElement;
    const logDay: HTMLInputElement = document.getElementById("entry-log-day") as HTMLInputElement;
    const endDay: HTMLInputElement = document.getElementById("entry-end-day") as HTMLInputElement;
    const day: HTMLInputElement = document.getElementById("entry-box-day") as HTMLInputElement;
    const time: HTMLInputElement = document.getElementById("entry-time") as HTMLInputElement;
    const minutes: HTMLInputElement = document.getElementById("entry-minutes") as HTMLInputElement;
    const deadlineDay: HTMLInputElement = document.getElementById("entry-deadline-day") as HTMLInputElement;
    const deadline: string = opening.box?.deadline ?? "";
    logTimes.hidden = boxed;
    logTimes.disabled = boxed;
    boxTimes.hidden = !boxed;
    boxTimes.disabled = !boxed;
    logDay.value = dateTextOf(dayOf(opening.start));
    logDay.setCustomValidity("");
    endDay.value = dateTextOf(dayOf(opening.end));
    endDay.setCustomValidity("");
    endDayTyped = false;
    timeFieldShow(document.getElementById("entry-start") as HTMLInputElement, opening.start);
    timeFieldShow(document.getElementById("entry-end") as HTMLInputElement, opening.end);
    day.value = dateTextOf(dayOf(opening.start));
    day.setCustomValidity("");
    timeFieldShow(time, opening.time);
    minutes.value = opening.minutes === null ? "" : String(opening.minutes);
    time.required = required;
    minutes.required = required;
    document.querySelectorAll(".entry-deadline").forEach((label: Element): void => {
        label.toggleAttribute("hidden", required);
    });
    deadlineDay.value = deadline === "" ? "" : dateTextOf(opening.box?.day ?? "");
    deadlineDay.setCustomValidity("");
    timeFieldShow(document.getElementById("entry-deadline-time") as HTMLInputElement,
        deadline === "" || deadline === opening.box?.day ? null : new Date(deadline));
    deadlineSee();
}

/**
 * Shows the dialog as an opening says, each value picked in a long list scrolled into sight once the dialog shows,
 * like the dish of a meal being changed.
 * Above the categories, small and grey: `Plan` for a box, with `Log it` to log an open box being changed,
 * or the box a log entry comes from, with `Edit plan` to change it instead, when it can be changed.
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
    (document.getElementById("entry-real") as HTMLElement).hidden = true;
    removeAsked = false;
    eatenAfter = false;
    pain = String(opening.entry?.extendedProps.pain ?? "");

    let planTitle: string = "";
    if (opening.target === "box")
        planTitle = "Plan";
    else if (opening.plan !== null)
        planTitle = `From the plan: ${opening.plan.title}`;
    (document.getElementById("entry-plan-title") as HTMLElement).textContent = planTitle;
    document.getElementById("entry-plan")?.toggleAttribute("hidden", opening.target === "log" && opening.plan === null);
    document.getElementById("entry-plan-log")?.toggleAttribute("hidden", opening.box?.state !== "open");
    document.getElementById("entry-plan-edit")?.toggleAttribute("hidden", opening.plan?.editable !== true);
    timesShow(opening);
    (document.getElementById("entry-note") as HTMLTextAreaElement).value = opening.note;
    iconPut(document.getElementById("entry-save") as HTMLElement, Check,
        opening.entry === null && opening.box === null ? "Save" : "Save changes");
    iconPut(document.getElementById("entry-remove") as HTMLElement, Trash2, "Remove");
    document.getElementById("entry-remove")?.toggleAttribute("hidden",
        opening.entry === null && (opening.box === null || opening.box.state === "done"));
    document.getElementById("entry-error")?.setAttribute("hidden", "");
    namesShow();
    await categoryPick(categories.find((category: Category): boolean => category.name === opening.category) ?? null);
    if (!dialog.open)
        dialog.showModal();
    (document.activeElement as HTMLElement | null)?.blur();
    document.querySelectorAll("#entry-fields .picker-list .chosen").forEach((chosen: Element): void =>
        chosen.scrollIntoView({ block: "nearest" }));
}

/**
 * Opens the dialog for a new entry of the log with start and end, its day the calendar date of the start,
 * like `13.10.2026` for a selection at 01:45 at the bottom of 12 October.
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
 * comes with its category and fields picked as planned, a skill box with its skill and type,
 * ready to save or to change, like a lecture with its chapters and slides; a box without category,
 * like a to-do another app wrote, without them.
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
        note: "", foods: [], skill: { ...skillNone, module: box.module, type: box.type },
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
 * @param type - Its type, `DEV`
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
 * Opens the dialog to change a box of the new system, its fields picked, a skill box with its skill and type,
 * its expected time and duration typed as far as it has them.
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
        skill: { ...skillNone, module: box.module, type: box.type }, plan: null, entry: null, box: box,
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
            module: props.module ?? "", type: props.type ?? "", chapters: entry.extendedProps.chapters ?? [],
            links: entry.extendedProps.links ?? [], attempts: entry.extendedProps.attempts ?? [],
        },
        plan: null, entry: entry, box: null,
    });
}

/**
 * Starts the entry by category after the router has put its HTML into the page:
 * `Edit plan` changes the box being logged, `Log it` logs the box being changed, as expected on the shown day,
 * which for a box with a deadline may lie before its own, in the dialog of the log, see `boxTimesOf` in `times.ts`;
 * typing a deadline turns the day and the expected time off, see {@link deadlineSee}; typing the day, start or end
 * of a log entry fills the day of its end, see {@link endDayFill}, until I type that day myself; a log entry whose end
 * does not lie after its start is not sent, the day of its end saying so; the dialog of a new place starts too,
 * see `places.ts`.
 * - `endDay`: Field of the day of the end of a log entry.
 * - `start`, `end`: The times the box is logged at as expected.
 *
 * @param calendar - Calendar of the day
 */
export function categoriesStart(calendar: Calendar): void {
    placesStart();
    iconPut(document.getElementById("entry-cancel") as HTMLElement, X, "Cancel");
    document.getElementById("entry-cancel")?.addEventListener("click", (): void =>
        (document.getElementById("entry") as HTMLDialogElement).close());
    document.getElementById("entry-remove")?.addEventListener("click", (): void => {
        entryRemove(calendar).catch(errorShow);
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
    ["entry-log-day", "entry-start", "entry-end"].forEach((id: string): void =>
        document.getElementById(id)?.addEventListener("input", endDayFill));
    const endDay: HTMLInputElement = document.getElementById("entry-end-day") as HTMLInputElement;
    endDay.addEventListener("input", (): void => {
        endDayTyped = true;
    });
    document.getElementById("entry-form")?.addEventListener("submit", (event: SubmitEvent): void => {
        event.preventDefault();
        if (opened.target === "log" && endRead(startRead()) <= startRead()) {
            endDay.setCustomValidity("The end lies after the start");
            endDay.reportValidity();
            return;
        }
        entrySave(calendar).catch(errorShow);
    });
}
