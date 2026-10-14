/**
 * ## Meal in the entry by category
 *
 * A meal of the log, `Food`, in three rows of the dialog, like every field, each of the last two with its own list
 * right under it, see `listOf` in `choices.ts`, so meals and foods never mix:
 * - Summary: what I ate, written by itself, never typed: the meals, then the foods eaten beside them, parted by `, `,
 *   like `ChiliConCarne, Weißbrot`, and grey beside it what they give together, like `660 kcal`.
 * - Meals: my meals of `Meals.md`, each made of two or more of my foods, in variants as I made it, each with its
 *   servings, see `../food/meals.ts`; each meal picked a row: its name with a chevron, which shows its foods for one
 *   serving below it, its variant grey after the name, its servings eaten, like `1` or `0.5`, its kcal and `×`,
 *   which removes it. Its list finds my meals as I type, each with how many variants and the kcal of a serving
 *   of the latest grey beside it; a meal of one variant goes in at once, one of more opens its variants, the latest
 *   first, each with its foods, servings and kcal of a serving, and `+ New variant`, a copy of the latest to change;
 *   the list ends with `+ New meal`. Both turn the list into the form of a meal, see `mealFormOf` in
 *   `../food/meals.ts`; the variant saved goes into `Meals.md` and into this meal at once.
 * - Foods: foods eaten beside the meals, like `Weißbrot` beside `ChiliConCarne`, each a row with its name, its grams,
 *   its kcal and a small grey `×`, which removes it, like a food I did not eat of a cooking.
 *   Its list is the food search, see `../food/search.ts`: my foods first, then those of Open Food Facts;
 *   a click on one of my foods takes it, and so does adding a product, which goes into `Foods.md` first.
 *   Grams are optional: a food without them counts its usual portion, shown grey in its empty field;
 *   every amount is rounded and an estimate anyway, so none is marked as one. Enter in its grams opens the list again.
 * Below each, grey, `+ Meal` and `+ Food` open their lists once one is picked; an empty row opens its list on a click.
 * The dialog writes each food as a line `X-FOOD`: first the foods of each meal with their grams for its servings eaten,
 * the meal, its servings eaten and its variant, like `Hackfleisch;125;ChiliConCarne;1;09.10.2026`, so the log keeps
 * the meal as it was that day, whatever I change in `Meals.md` later; then the foods beside by their labels, name,
 * brand and store, each with its grams, its usual portion when none are typed, like `Brot · Mestemacher · Edeka;50`
 * or `Döner;~400` with grams guessed; and the summary as its what, see {@link mealTitle}.
 * A meal written before my meals, named on its own, like `Bortzeit`, opens as that one meal with its foods,
 * so its name stays.
 * A cooking of the log, `Cook`, lists what went into the pot in two of these rows, Summary and Foods, each food with
 * its grams, like `Hackfleisch;Gut & Günstig;Edeka;500`, and counts no kcal, see `reader/food.ts`.
 * A meal may draw from one of my cookings of the days before it in a row of its own, see {@link cookedRowOf}:
 * its foods come along with their grams of the pot, which I type over with what I ate, no total for the pot,
 * and the meal writes `X-COOKED` with the cooking's identifier and its foods with their grams as its own lines,
 * so meal and cooking each keep their foods, see {@link mealCooked}.
 * A meal eaten out, where nothing can be weighed, I log by photo through Claude, who writes its entry through the reader;
 * the dialog itself takes no photo.
 *
 * - `./choices.ts`: Rows of the dialog, the lists that open right under them, and the picker of a cooking.
 * - `./times.ts`: Writes the day and time of a cooking.
 * - `../skill/attempts.ts`: Gives the day of an instant.
 * - `../food/foods.ts`: Finds my foods, loads my meals, writes amounts and makes elements.
 * - `../food/meals.ts`: The form of a new meal or variant, and the texts of variants.
 * - `../food/search.ts`: The food search.
 * - `../icons.ts`: Puts the icons into the buttons, their words as tooltip.
 * - `lucide`: The icons remove and add, and those that show or hide the foods of a meal.
 */

import { choicesOf, listOf, rowOf, searchOf } from "./choices.ts";
import { dateTextOf, timeOf } from "./times.ts";
import { dayOf } from "../skill/attempts.ts";
import { amountOf, dishesLoad, elementOf, foodsFind } from "../food/foods.ts";
import { kcalTextOf, mealFormOf, variantTextOf } from "../food/meals.ts";
import { foodSearchClear, foodSearchOf } from "../food/search.ts";
import { iconOf, iconPut, iconWordsOf } from "../icons.ts";
import { ChevronDown, ChevronRight, Plus, X } from "lucide";

import type { Choice } from "./choices.ts";
import type { Dish, Food, FoodsFound, Variant } from "../food/foods.ts";


/**
 * A food picked, beside the meals or as part of one.
 *
 * - `name`, `brand`, `store`: Name of the food in `Foods.md`, its brand and the store I bought it in,
 *   like `Skyr natur`, `K-Classic` and `Kaufland`; brand and store empty in a line written before foods had them.
 * - `grams`: Grams as typed, like `150` or `7,5`, of one serving for the food of a meal; empty for its usual portion.
 * - `fromCooking`: Whether it came with the cooking the meal draws from, see {@link drawnShow}.
 */
type FoodPick = {
    name: string;
    brand: string;
    store: string;
    grams: string;
    fromCooking?: boolean;
};

/**
 * A line `X-FOOD` cut into its parts, see {@link lineOf}.
 *
 * - `name`, `brand`, `store`: Its food, brand and store empty in a line written before foods had them.
 * - `grams`: Grams as written, like `150` or `~400`; empty for none.
 * - `meal`, `servings`, `variant`: For the food of one of my meals the meal, its servings eaten and its variant,
 *   each empty when the line gives none.
 */
type Line = {
    name: string;
    brand: string;
    store: string;
    grams: string;
    meal: string;
    servings: string;
    variant: string;
};

/**
 * A cooking of the log as the reader sends it, one a meal may draw from.
 *
 * - `id`: Identifier of its entry.
 * - `category`: Its category, `Cook`.
 * - `title`: What it was, like `Hackfleisch, Kidneybohnen, Tomaten`.
 * - `start`: Start as ISO instant.
 * - `foods`: Its lines `X-FOOD`, what went into the pot, like `Hackfleisch · Gut & Günstig · Edeka;500`.
 */
type Cooking = {
    id: string;
    category: string;
    title: string;
    start: string;
    foods: string[];
};

/**
 * What a meal needs to draw from a cooking, see {@link cookedRowOf}; a cooking itself draws from none.
 *
 * - `cooked`: Identifier of the cooking it draws from as written, its `X-COOKED`, empty for none.
 * - `start`: Start of the meal, whose cookings of the days before it are offered.
 */
export type Drawing = {
    cooked: string;
    start: Date;
};

/**
 * A meal picked.
 *
 * - `name`: Name of the meal, like `ChiliConCarne`.
 * - `variant`: Name of its variant, like `09.10.2026`; empty for a meal written before my meals.
 * - `portions`: Servings eaten as typed, like `0,5`; empty for one.
 * - `foods`: Its foods with their grams of one serving.
 * - `open`: Whether its foods show below its row.
 */
type MealPick = {
    name: string;
    variant: string;
    portions: string;
    foods: FoodPick[];
    open: boolean;
};

/**
 * Category of meals, whose foods count what I ate.
 */
export const foodName: string = "Food";

/**
 * Category of cookings, whose foods tell what went into the pot and count nothing.
 */
export const cookName: string = "Cook";

/**
 * Days before a meal whose cookings it may draw from, about as long as cooked food keeps in the fridge.
 */
const cookingDays: number = 3;

/**
 * My cookings of the days before the meal that list foods, the nearest first, see {@link cookingsLoad}.
 */
let cookings: Cooking[] = [];

/**
 * Identifier of the cooking the meal draws from, empty for none.
 */
let cooked: string = "";

/**
 * My foods by their keys, see {@link keyOf}, and by their names alone in small letters, for lines written before
 * foods had brand and store; loaded when the meal was built, with every food added since.
 */
let mine: Map<string, Food> = new Map();

/**
 * My meals of `Meals.md`, loaded when the meal was built, with every variant added since.
 */
let dishes: Dish[] = [];

/**
 * Meals picked, in the order they were picked.
 */
let meals: MealPick[] = [];

/**
 * Foods picked beside the meals, in the order they were picked.
 */
let picks: FoodPick[] = [];

/**
 * Text of the summary, and grey beside it the kcal of the whole meal.
 */
let summary: HTMLElement = document.createElement("span");

/**
 * Line below the meals, which opens their list.
 */
let mealsLine: HTMLButtonElement = document.createElement("button");

/**
 * Line below the foods beside the meals, which opens their list.
 */
let foodsLine: HTMLButtonElement = document.createElement("button");

/**
 * Place of the rows of the meals picked.
 */
let mealsRows: HTMLElement = document.createElement("div");

/**
 * Place of the rows of the foods picked.
 */
let foodsRows: HTMLElement = document.createElement("div");

/**
 * List of the meals, with its search field, the variants of a meal, or the form of a meal in its place.
 */
let mealsBox: HTMLElement = document.createElement("div");

/**
 * The food search in the list of the foods, emptied as the list opens.
 */
let foodsSearch: HTMLElement = document.createElement("div");

/**
 * Closes the list of the meals.
 */
let mealsClose: () => void = (): void => {};

/**
 * Closes the list of the foods.
 */
let foodsClose: () => void = (): void => {};


/**
 * Writes the key of a food, by which a line `X-FOOD` finds it, as the reader does: its name, brand and store
 * parted by `;`, in small letters, like `skyr natur;k-classic;kaufland`.
 *
 * @param food - Food or food picked
 * @returns Key
 */
function keyOf(food: { name: string; brand: string; store: string }): string {
    return `${food.name};${food.brand};${food.store}`.toLowerCase();
}

/**
 * Keeps a food among my foods by its key and, unless a food of its name came first, by its name alone,
 * see {@link mine}.
 *
 * @param food - Food of `Foods.md`
 */
function mineAdd(food: Food): void {
    mine.set(keyOf(food), food);
    if (!mine.has(food.name.toLowerCase()))
        mine.set(food.name.toLowerCase(), food);
}

/**
 * Makes a food picked of a line `X-FOOD`, see {@link lineOf}.
 *
 * @param read - Line in its parts
 * @param grams - Grams the food picked gets, empty for its usual portion
 * @returns The food picked
 */
function pickOf(read: Line, grams: string): FoodPick {
    return { name: read.name, brand: read.brand, store: read.store, grams: grams };
}

/**
 * Finds a food picked among my foods: by its name, brand and store, one without both by its name alone.
 *
 * @param pick - Food picked
 * @returns The food in `Foods.md`, `undefined` for one it does not hold
 */
function foodOf(pick: FoodPick): Food | undefined {
    return mine.get(keyOf(pick)) ?? (pick.brand === "" && pick.store === "" ? mine.get(pick.name.toLowerCase()) : undefined);
}

/**
 * Tells whether a part of a line `X-FOOD` is grams, like `150` or `~400`.
 *
 * @param part - Part of the line
 * @returns Whether it is grams
 */
function gramsIs(part: string): boolean {
    return /^~?\s*\d+(?:[.,]\d+)?$/.test(part);
}

/**
 * Turns a line `X-FOOD` into its parts, as the reader reads it: one of today of four parts, its food's name, brand
 * and store, then its grams, like `Skyr natur;K-Classic;Kaufland;150`, told by its last part being grams and its
 * second none; an older one names its food alone, its grams after it, and for the food of a meal the meal,
 * its servings eaten and its variant, a line of a meal without grams, like `Salz;ChiliConCarne;1;09.10.2026`,
 * told apart by its second part being no number.
 * - `parts`: The parts of the line, without spaces at their ends.
 * - `grams`: Whether the second part of an older line is grams.
 * - `rest`: What follows the food and its grams in an older line.
 *
 * @param line - Line like `Skyr natur;K-Classic;Kaufland;150`, `Reis;150`, `Eier`
 *   or `Hackfleisch;125;ChiliConCarne;1;09.10.2026`
 * @returns The line in its parts
 */
function lineOf(line: string): Line {
    const parts: string[] = line.split(";").map((part: string): string => part.trim());
    if (parts.length === 4 && !gramsIs(parts[1]) && gramsIs(parts[3]))
        return { name: parts[0], brand: parts[1], store: parts[2], grams: parts[3], meal: "", servings: "", variant: "" };
    const grams: boolean = parts.length > 1 && gramsIs(parts[1]);
    const rest: string[] = grams ? parts.slice(2) : parts.slice(1);
    return {
        name: parts[0], brand: "", store: "", grams: grams ? parts[1] : "",
        meal: rest[0] ?? "", servings: rest[1] ?? "", variant: rest[2] ?? "",
    };
}

/**
 * Reads a number as typed, a decimal comma counting as a point and a `~` before it, which marks grams guessed,
 * not weighed, like `~400` from a photo, left out.
 *
 * @param text - Number as typed, like `150`, `0,5` or `~400`
 * @returns The number, `null` for an empty text, not a number for a text that is none
 */
function numberOf(text: string): number | null {
    return text === "" ? null : Number(text.replace(/^~\s*/, "").replace(",", "."));
}

/**
 * Writes grams to one decimal at most, as `X-FOOD` and the fields take them, like `62.5` or `125`.
 *
 * @param grams - Grams
 * @returns Text
 */
function gramsTextOf(grams: number): string {
    return String(Math.round(grams * 10) / 10);
}

/**
 * Tells what a food picked gives: its grams, or its usual portion when none are typed, times the servings,
 * times its kcal per 100 g.
 * - `food`: The food in `Foods.md`, `undefined` for one it does not hold.
 * - `counted`: Grams counted.
 *
 * @param pick - Food picked
 * @param times - Servings eaten, 1 for a food beside the meals
 * @returns kcal; 0 for a food not in `Foods.md` or grams that are no number
 */
function kcalOf(pick: FoodPick, times: number): number {
    const food: Food | undefined = foodOf(pick);
    const counted: number = (numberOf(pick.grams) ?? food?.portion ?? 0) * times;
    return Number.isFinite(counted) ? counted / 100 * (food?.kcal ?? 0) : 0;
}

/**
 * Tells what a meal picked gives: what its foods give for its servings eaten.
 *
 * @param meal - Meal picked
 * @returns kcal, 0 while its servings are no number
 */
function mealKcalOf(meal: MealPick): number {
    const times: number = numberOf(meal.portions) ?? 1;
    return meal.foods.reduce((sum: number, pick: FoodPick): number => sum + kcalOf(pick, times), 0);
}

/**
 * Writes foods with their grams, like `Käse 50 g, Gurkensalat`.
 *
 * @param foods - Foods with their grams
 * @returns Text
 */
function foodsTextOf(foods: FoodPick[]): string {
    return foods.map((pick: FoodPick): string => pick.grams === "" ? pick.name : `${pick.name} ${pick.grams} g`).join(", ");
}

/**
 * Makes a button that does not send the form of the dialog around it.
 *
 * @param className - Class, empty for none
 * @param text - Text, empty for none
 * @param click - What a click does
 * @returns Button
 */
function buttonOf(className: string, text: string, click: () => void): HTMLButtonElement {
    const button: HTMLButtonElement = document.createElement("button");
    button.type = "button";
    button.className = className;
    button.textContent = text;
    button.addEventListener("click", click);
    return button;
}

/**
 * Makes the row at the end of a list that adds, like `+ New meal`, the icon of every + of the page before its words,
 * as the lists of `choices.ts` have it.
 * - `button`: The row.
 *
 * @param words - What it adds, like `New meal`
 * @param click - What a click does
 * @returns The row
 */
function addButtonOf(words: string, click: () => void): HTMLButtonElement {
    const button: HTMLButtonElement = buttonOf("picker-new", "", click);
    button.append(...iconWordsOf(Plus, words));
    return button;
}

/**
 * Makes the small field of a number, grams or servings, with its unit after it, what it counts while empty grey in it,
 * marking itself invalid while its text is no number above 0, so the dialog does not send it.
 *
 * @param value - Value as typed, empty for none
 * @param empty - What it counts while empty, like the usual portion
 * @param unit - Unit after it, like `g` or `×`
 * @param name - Words for screen readers, like `Grams of Brot`
 * @param typed - Takes the text typed
 * @returns The field with its unit, and the text field itself
 */
function numberFieldOf(value: string, empty: string, unit: string, name: string,
                       typed: (text: string) => void): [HTMLElement, HTMLInputElement] {
    const label: HTMLElement = elementOf("label", "meal-grams", "");
    const input: HTMLInputElement = document.createElement("input");
    input.type = "text";
    input.inputMode = "decimal";
    input.autocomplete = "off";
    input.value = value;
    input.placeholder = empty;
    input.setAttribute("aria-label", name);
    input.addEventListener("input", (): void => {
        const number: number | null = numberOf(input.value.trim());
        input.setCustomValidity(number === null || number > 0 ? "" : "A number above 0, or empty");
        typed(input.value.trim());
    });
    label.append(input, ` ${unit}`);
    return [label, input];
}

/**
 * Tells whether the list of the foods is closed.
 *
 * @returns Whether it is closed
 */
function foodsClosed(): boolean {
    return foodsSearch.closest(".picker-box")?.hasAttribute("hidden") ?? true;
}

/**
 * Builds the row of a food beside the meals: its name, its brand and store grey after it, like
 * `Skyr natur · K-Classic · Kaufland`, marked when `Foods.md` does not hold it, its grams,
 * its kcal and a small grey `×`, which removes it, as a value picked in every list of the dialog.
 * - `food`: The food in `Foods.md`, `undefined` for one it does not hold.
 * - `place`: Its brand and store, those it has.
 * - `kcal`: Cell of its kcal.
 * - `remove`: Its `×`.
 *
 * @param pick - Food picked, changed as its grams are typed
 * @param changed - Tells the dialog that the meal changed
 * @returns Row
 */
function foodRowOf(pick: FoodPick, changed: () => void): HTMLElement {
    const row: HTMLElement = elementOf("div", "meal-row", "");
    const food: Food | undefined = foodOf(pick);
    const place: string[] = [pick.brand, pick.store].filter((part: string): boolean => part !== "");
    const name: HTMLElement = elementOf("span", "meal-name", pick.name);
    const kcal: HTMLElement = elementOf("span", "meal-kcal", food === undefined ? "" : kcalTextOf(kcalOf(pick, 1)));
    const [grams, input]: [HTMLElement, HTMLInputElement] = numberFieldOf(pick.grams,
        food === undefined ? "" : amountOf(food.portion, 0), "g", `Grams of ${pick.name}`, (text: string): void => {
            pick.grams = text;
            kcal.textContent = food === undefined ? "" : kcalTextOf(kcalOf(pick, 1));
            summaryShow();
            changed();
        });
    const remove: HTMLButtonElement = buttonOf("picker-added-remove", "", (): void => {
        picks = picks.filter((other: FoodPick): boolean => other !== pick);
        rowsShow(changed);
        changed();
    });

    if (place.length > 0)
        name.append(elementOf("span", "meal-label", ` · ${place.join(" · ")}`));
    if (food === undefined)
        name.append(elementOf("span", "meal-unknown", " · not in my foods"));
    name.title = name.textContent ?? "";
    input.addEventListener("keydown", (event: KeyboardEvent): void => {
        if (event.key !== "Enter")
            return;
        event.preventDefault();
        if (foodsClosed())
            foodsLine.click();
    });
    iconPut(remove, X, `Remove ${pick.name}`);
    row.append(name, grams, kcal, remove);
    return row;
}

/**
 * Builds the row of a meal picked: its name with a chevron, which shows or hides its foods with their grams of one
 * serving below the row, its variant grey after the name, its servings eaten, its kcal for them, and `×`,
 * which removes it.
 * - `toggle`: Its name with the chevron and its variant.
 * - `kcal`: Cell of its kcal.
 * - `rows`: The row, and below it its foods while shown.
 *
 * @param meal - Meal picked, changed as its servings are typed
 * @param changed - Tells the dialog that the meal changed
 * @returns The row, with its foods below it while shown
 */
function mealRowOf(meal: MealPick, changed: () => void): HTMLElement[] {
    const row: HTMLElement = elementOf("div", "meal-row", "");
    const toggle: HTMLButtonElement = buttonOf("meal-dish-toggle", "", (): void => {
        meal.open = !meal.open;
        rowsShow(changed);
    });
    const name: HTMLElement = elementOf("span", "meal-name", meal.name);
    const kcal: HTMLElement = elementOf("span", "meal-kcal", kcalTextOf(mealKcalOf(meal)));
    const [portions]: [HTMLElement, HTMLInputElement] = numberFieldOf(meal.portions, "1", "×",
        `Servings of ${meal.name}`, (text: string): void => {
            meal.portions = text;
            kcal.textContent = kcalTextOf(mealKcalOf(meal));
            summaryShow();
            changed();
        });
    const remove: HTMLButtonElement = buttonOf("picker-added-remove", "", (): void => {
        meals = meals.filter((other: MealPick): boolean => other !== meal);
        rowsShow(changed);
        changed();
    });
    const rows: HTMLElement[] = [row];

    if (meal.variant !== "")
        name.append(elementOf("span", "meal-unknown", ` · ${meal.variant}`));
    name.title = name.textContent ?? "";
    toggle.append(iconOf(meal.open ? ChevronDown : ChevronRight), name);
    toggle.setAttribute("aria-expanded", String(meal.open));
    toggle.title = meal.open ? "Hide its foods" : "Show its foods for a serving";
    iconPut(remove, X, `Remove ${meal.name}`);
    row.append(toggle, portions, kcal, remove);
    if (meal.open)
        rows.push(elementOf("p", "meal-dish-foods", foodsTextOf(meal.foods)));
    return rows;
}

/**
 * Shows the summary, see {@link mealTitle}, and grey beside it the kcal of the whole meal; nothing while nothing
 * is picked.
 * - `total`: kcal of the meals and the foods beside them.
 */
function summaryShow(): void {
    const total: number = meals.reduce((sum: number, meal: MealPick): number => sum + mealKcalOf(meal), 0)
        + picks.reduce((sum: number, pick: FoodPick): number => sum + kcalOf(pick, 1), 0);
    summary.replaceChildren(mealTitle());
    if (meals.length > 0 || picks.length > 0)
        summary.append(elementOf("span", "picker-detail", kcalTextOf(total)));
}

/**
 * Shows the lines of the meals and the foods below their rows: while some are picked, the square + of the page,
 * `Add a meal` or `Add a food` as its tooltip, see `.picker-line.meal-add` in `day.css`; nothing while none is,
 * so the empty row opens its list like every empty field.
 */
function linesShow(): void {
    mealsLine.replaceChildren(...meals.length === 0 ? [] : [iconOf(Plus)]);
    mealsLine.title = meals.length === 0 ? "" : "Add a meal";
    mealsLine.classList.toggle("picker-empty", meals.length === 0);
    mealsLine.classList.toggle("meal-add", meals.length > 0);
    foodsLine.replaceChildren(...picks.length === 0 ? [] : [iconOf(Plus)]);
    foodsLine.title = picks.length === 0 ? "" : "Add a food";
    foodsLine.classList.toggle("picker-empty", picks.length === 0);
    foodsLine.classList.toggle("meal-add", picks.length > 0);
}

/**
 * Shows the rows of the meals and of the foods picked, then the summary and the lines.
 *
 * @param changed - Tells the dialog that the meal changed
 */
function rowsShow(changed: () => void): void {
    mealsRows.replaceChildren(...meals.flatMap((meal: MealPick): HTMLElement[] => mealRowOf(meal, changed)));
    foodsRows.replaceChildren(...picks.map((pick: FoodPick): HTMLElement => foodRowOf(pick, changed)));
    summaryShow();
    linesShow();
}

/**
 * Picks a food from the search of the foods as one more food, unless it is picked already; then closes the list
 * and puts the cursor into the field of its grams.
 * - `pick`: The food as picked, with its name, brand and store and no grams yet.
 * - `same`: Whether a food picked is this one, by name, brand and store, ignoring case.
 * - `index`: Place of the food among the foods picked.
 *
 * @param food - Food picked or just added to `Foods.md`
 * @param changed - Tells the dialog that the meal changed
 */
function foodPick(food: Food, changed: () => void): void {
    const pick: FoodPick = { name: food.name, brand: food.brand, store: food.store, grams: "" };
    mineAdd(food);
    const same: (other: FoodPick) => boolean = (other: FoodPick): boolean => keyOf(other) === keyOf(food);
    let index: number = picks.findIndex(same);
    if (index === -1)
        index = picks.push(pick) - 1;
    rowsShow(changed);
    changed();
    foodsClose();
    foodsRows.querySelectorAll<HTMLInputElement>(".meal-grams input")[index]?.focus();
}

/**
 * Picks a variant of one of my meals, one serving with its foods for one serving, their grams for the whole, or their
 * usual portions for a food without, divided by its servings, unless the meal is picked already in that variant;
 * then closes the list and puts the cursor into the field of its servings.
 * - `index`: Place of the meal among the meals picked.
 *
 * @param dish - Meal of `Meals.md`
 * @param variant - Its variant
 * @param changed - Tells the dialog that the meal changed
 */
function dishPick(dish: Dish, variant: Variant, changed: () => void): void {
    let index: number = meals.findIndex((meal: MealPick): boolean =>
        meal.name.toLowerCase() === dish.name.toLowerCase() && meal.variant === variant.label);
    if (index === -1) {
        index = meals.push({
            name: dish.name, variant: variant.label, portions: "", open: false,
            foods: variant.foods.map((line: string): FoodPick => {
                const read: Line = lineOf(line);
                const whole: number | null = numberOf(read.grams) ?? foodOf(pickOf(read, ""))?.portion ?? null;
                return pickOf(read, whole === null ? "" : gramsTextOf(whole / variant.servings));
            }),
        }) - 1;
        rowsShow(changed);
        changed();
    }
    mealsClose();
    mealsRows.querySelectorAll<HTMLInputElement>(".meal-grams input")[index]?.focus();
}

/**
 * Turns the list of the meals into the form of a meal, see `mealFormOf` in `../food/meals.ts`: a new meal named
 * as typed, or a new variant of a meal, a copy of its latest; saved, its variant goes into this meal at once,
 * cancelled, the list shows again.
 * - `form`: The form.
 *
 * @param name - Name typed, or the name of the meal of a new variant
 * @param dish - Meal of a new variant, `null` for a new meal
 * @param changed - Tells the dialog that the meal changed
 */
function formShow(name: string, dish: Dish | null, changed: () => void): void {
    const latest: Variant | undefined = dish?.variants.at(-1);
    const form: HTMLElement = mealFormOf({
        name: name, fixed: dish !== null, servings: latest?.servings ?? 1, foods: latest?.foods ?? [], mine: mine,
        saved: (sent: Dish[], saved: string): void => {
            dishes = sent;
            const found: Dish | undefined = dishes.find((one: Dish): boolean => one.name.toLowerCase() === saved);
            const added: Variant | undefined = found?.variants.at(-1);
            if (found !== undefined && added !== undefined)
                dishPick(found, added, changed);
        },
        cancelled: (): void => mealsListShow(changed),
    });
    mealsBox.replaceChildren(form);
    form.querySelector("input")?.focus();
}

/**
 * Shows the variants of a meal in the list of the meals: `‹ All meals` back, then its variants, the latest first,
 * each with its foods for the whole, its servings and the kcal of a serving grey beside it, and `+ New variant`,
 * a copy of the latest to change.
 * - `list`: The variants.
 *
 * @param dish - Meal of `Meals.md`
 * @param changed - Tells the dialog that the meal changed
 */
function variantsShow(dish: Dish, changed: () => void): void {
    const list: HTMLElement = elementOf("div", "picker-list", "");
    list.append(buttonOf("picker-new", `‹ All meals · ${dish.name}`, (): void => mealsListShow(changed)),
        ...[...dish.variants].reverse().map((variant: Variant): HTMLElement => {
            const button: HTMLButtonElement = buttonOf("", variant.label, (): void => dishPick(dish, variant, changed));
            button.append(elementOf("span", "picker-detail", `${amountOf(variant.servings, 0)} `
                + `${variant.servings === 1 ? "serving" : "servings"} · ${kcalTextOf(variant.kcal)} a serving · `
                + variantTextOf(variant.foods)));
            return button;
        }), addButtonOf("New variant", (): void => formShow(dish.name, dish, changed)));
    mealsBox.replaceChildren(list);
}

/**
 * Shows the list of the meals in its box: the search field, my meals whose name holds what is typed, ignoring case
 * and spaces, each with how many variants and the kcal of a serving of the latest grey beside it, and
 * `+ New meal` at its end, naming what is typed while no meal has it.
 * - `input`: The search field.
 * - `list`: The meals found.
 * - `listShow`: Shows the meals found for what is typed.
 *
 * @param changed - Tells the dialog that the meal changed
 */
function mealsListShow(changed: () => void): void {
    const input: HTMLInputElement = document.createElement("input");
    const list: HTMLElement = elementOf("div", "picker-list", "");
    const listShow: () => void = (): void => {
        const typed: string = input.value.trim();
        const key: string = typed.replace(/\s+/g, "").toLowerCase();
        const known: boolean = dishes.some((dish: Dish): boolean => dish.name.toLowerCase() === key);
        list.replaceChildren(...dishes
            .filter((dish: Dish): boolean => dish.name.toLowerCase().includes(key))
            .map((dish: Dish): HTMLElement => {
                const latest: Variant | undefined = dish.variants.at(-1);
                const button: HTMLButtonElement = buttonOf("", dish.name, (): void => {
                    if (dish.variants.length === 1 && latest !== undefined)
                        dishPick(dish, latest, changed);
                    else
                        variantsShow(dish, changed);
                });
                button.append(elementOf("span", "picker-detail", dish.variants.length === 1
                    ? `${kcalTextOf(latest?.kcal ?? 0)} a serving · ${variantTextOf(latest?.foods ?? [])}`
                    : `${dish.variants.length} variants · ${kcalTextOf(latest?.kcal ?? 0)} a serving of the latest`));
                return button;
            }), addButtonOf(typed === "" || known ? "New meal" : `New meal „${typed}“`,
            (): void => formShow(known ? "" : typed, null, changed)));
    };
    input.type = "text";
    input.className = "picker-search";
    input.placeholder = "Search or add a meal";
    input.autocomplete = "off";
    input.addEventListener("input", listShow);
    input.addEventListener("keydown", (event: KeyboardEvent): void => {
        if (event.key === "Enter")
            event.preventDefault();
    });
    listShow();
    mealsBox.replaceChildren(input, list);
    input.focus();
}

/**
 * Loads my cookings of the days before a meal from the reader, those that list foods and start before it,
 * the nearest first, see {@link cookingDays}.
 * - `from`: Start of those days.
 * - `entries`: Entries of the log of those days.
 *
 * @param start - Start of the meal
 * @returns The cookings
 * @throws {Error} - When the reader cannot answer
 */
async function cookingsLoad(start: Date): Promise<Cooking[]> {
    const from: Date = new Date(start.getTime() - cookingDays * 24 * 60 * 60 * 1000);
    const response: Response = await fetch(`/api/day/log?start=${from.toISOString()}&end=${start.toISOString()}`);
    if (!response.ok)
        throw new Error(`Reader answered ${response.status}`);
    const entries: Cooking[] = await response.json() as Cooking[];
    return entries
        .filter((entry: Cooking): boolean => entry.category === cookName && entry.foods.length > 0
            && Date.parse(entry.start) < start.getTime())
        .sort((first: Cooking, second: Cooking): number => second.start.localeCompare(first.start));
}

/**
 * Writes a cooking as the list of the cookings offers it: what it was and when it started,
 * like `Hackfleisch, Kidneybohnen, Tomaten · Sun, 13.10.2026 16:00`.
 * - `start`: Its start.
 *
 * @param cooking - Cooking
 * @returns Text
 */
function cookingTextOf(cooking: Cooking): string {
    const start: Date = new Date(cooking.start);
    return `${cooking.title} · ${start.toLocaleDateString("en-GB", { weekday: "short" })}, ${dateTextOf(dayOf(start))} `
        + timeOf(start);
}

/**
 * Puts the foods of the cooking the meal draws from first among its foods, in place of those it brought before,
 * each with the grams it had among the foods already, else its grams of the pot, all of it, which I type over
 * with what I ate in its row; none while no cooking is picked.
 * - `cooking`: The cooking picked, `undefined` for none.
 * - `before`: Grams typed of each food so far, by its key.
 * - `drawn`: The foods of the cooking.
 *
 * @param changed - Tells the dialog that the meal changed
 */
function drawnShow(changed: () => void): void {
    const cooking: Cooking | undefined = cookings.find((one: Cooking): boolean => one.id === cooked);
    const before: Map<string, string> = new Map(picks.map((pick: FoodPick): [string, string] => [keyOf(pick), pick.grams]));
    const drawn: FoodPick[] = (cooking?.foods ?? []).map((line: string): FoodPick => {
        const read: Line = lineOf(line);
        return { ...pickOf(read, before.get(keyOf(read)) ?? read.grams), fromCooking: true };
    });
    picks = [...drawn, ...picks.filter((pick: FoodPick): boolean =>
        pick.fromCooking !== true && !drawn.some((other: FoodPick): boolean => keyOf(other) === keyOf(pick)))];
    rowsShow(changed);
    changed();
}

/**
 * Builds the row of the cooking a meal draws from, see the top of this file: a small grey plus while none is picked,
 * `Draw from a cooking` its tooltip, whose list offers my cookings of the days before the meal, the nearest first;
 * picked, the cooking shows in the line and its foods come along, see {@link drawnShow}; picking it again takes it
 * back with its foods.
 * - `textOf`: Text of a cooking by its identifier, also of one no longer among them.
 *
 * @param changed - Tells the dialog that the meal changed
 * @returns The row
 */
function cookedRowOf(changed: () => void): HTMLElement {
    const textOf: (id: string) => string = (id: string): string => {
        const cooking: Cooking | undefined = cookings.find((one: Cooking): boolean => one.id === id);
        return cooking === undefined ? "A cooking of another day" : cookingTextOf(cooking);
    };
    return rowOf("Cooked", choicesOf({
        search: searchOf(cookings.map((cooking: Cooking): Choice => ({
            value: cooking.id, text: cookingTextOf(cooking), group: "",
        }))),
        picked: cooked === "" ? [] : [cooked],
        many: false,
        adding: false,
        empty: "Draw from a cooking",
        emptyIcon: Plus,
        textOf: textOf,
        pick: (picked: string[]): void => {
            if ((picked[0] ?? "") === cooked)
                return;
            cooked = picked[0] ?? "";
            drawnShow(changed);
        },
    }));
}

/**
 * Gives the identifier of the cooking the meal draws from, for its `X-COOKED`; empty for none.
 *
 * @returns Identifier, empty for none
 */
export function mealCooked(): string {
    return cooked;
}

/**
 * Builds a row with its picker, like the meals or the foods: the rows picked, the line below them, which opens
 * the list under it, see `listOf` in `choices.ts`.
 * - `picker`: Rows, line and list.
 * - `close`: Closes the list.
 *
 * @param name - Name of the row, like `Meals`
 * @param line - The line
 * @param rows - Place of the rows picked
 * @param box - The list
 * @param opened - Comes once the list is open
 * @param closed - Comes once the list is closed
 * @returns The row and what closes its list
 */
function pickerRowOf(name: string, line: HTMLButtonElement, rows: HTMLElement, box: HTMLElement, opened: () => void,
                     closed: () => void): [HTMLElement, () => void] {
    const picker: HTMLElement = elementOf("div", "meal picker", "");
    line.className = "picker-line";
    const close: () => void = listOf(picker, line, box, opened, closed);
    picker.append(rows, line, box);
    return [rowOf(name, picker), close];
}

/**
 * Builds the meal, see the top of this file, with the foods it lists already, after loading my foods and my meals:
 * the rows of its summary, its meals and its foods. The lines `X-FOOD` of a meal go to its meal, by the meal,
 * the servings eaten and the variant they carry, their grams back to one serving; a meal written before my meals,
 * named on its own, like `Bortzeit`, takes all its foods as that one meal.
 * - `found`: All my foods, as the search finds them for an empty text.
 * - `mealsMine`: My meals of `Meals.md`.
 * - `times`, `one`: Servings a line carries, and its grams back to one serving.
 * - `last`: The meal the lines so far went to.
 * - `foodsBox`: The list of the foods, with the food search.
 * - `mealsRow`, `foodsRow`: The rows of the meals and of the foods.
 * - `cooks`: My cookings of the days before a meal, none for a cooking.
 * - `brought`: Keys of the foods of the cooking the meal draws from, whose lines came with it.
 *
 * @param lines - Lines `X-FOOD` of the meal, like `Skyr natur;K-Classic;Kaufland;150`; none for a new meal
 * @param title - Summary of the meal written before, like `ChiliConCarne, Brot`; empty for a new meal
 * @param changed - Tells the dialog that the meal changed
 * @param drawing - The cooking a meal draws from and its start, see {@link Drawing}; `null` for a cooking,
 *   which shows only its summary and its foods
 * @returns The rows of summary, meals and foods, to put into the dialog in place of the summary
 * @throws {Error} - When the reader cannot answer
 */
export async function mealOf(lines: string[], title: string, changed: () => void, drawing: Drawing | null):
    Promise<HTMLElement[]> {
    const [found, mealsMine, cooks]: [FoodsFound, Dish[], Cooking[]] = await Promise.all([foodsFind("", "", 1),
        dishesLoad(), drawing === null ? Promise.resolve([]) : cookingsLoad(drawing.start)]);
    dishes = mealsMine;
    cookings = cooks;
    cooked = drawing?.cooked ?? "";
    mine = new Map();
    found.foods.forEach(mineAdd);
    meals = [];
    picks = [];
    lines.map(lineOf).forEach((read: Line): void => {
        if (read.meal === "") {
            picks.push(pickOf(read, read.grams));
            return;
        }
        const times: number = numberOf(read.servings) ?? 1;
        const one: string = numberOf(read.grams) === null ? "" : gramsTextOf((numberOf(read.grams) ?? 0) / times);
        let last: MealPick | undefined = meals.at(-1);
        if (last === undefined || last.name !== read.meal || last.variant !== read.variant
            || (numberOf(last.portions) ?? 1) !== times) {
            last = { name: read.meal, variant: read.variant, portions: times === 1 ? "" : String(times), foods: [], open: false };
            meals.push(last);
        }
        last.foods.push(pickOf(read, one));
    });
    if (meals.length === 0 && picks.length > 0 && title.trim() !== ""
        && title.trim().toLowerCase() !== picks.map((pick: FoodPick): string => pick.name).join(", ").toLowerCase()) {
        meals = [{ name: title.trim(), variant: "", portions: "", foods: picks, open: false }];
        picks = [];
    }
    const brought: Set<string> = new Set((cookings.find((one: Cooking): boolean => one.id === cooked)?.foods ?? [])
        .map((line: string): string => keyOf(lineOf(line))));
    picks.forEach((pick: FoodPick): void => {
        pick.fromCooking = brought.has(keyOf(pick));
    });

    summary = elementOf("span", "meal-summary", "");
    mealsLine = document.createElement("button");
    foodsLine = document.createElement("button");
    mealsRows = elementOf("div", "meal-rows", "");
    foodsRows = elementOf("div", "meal-rows", "");
    mealsBox = elementOf("div", "picker-box meal-box", "");
    foodsSearch = foodSearchOf((food: Food): void => foodPick(food, changed), null);
    const foodsBox: HTMLElement = elementOf("div", "picker-box meal-box", "");
    foodsBox.append(foodsSearch);
    const [mealsRow, closeMeals]: [HTMLElement, () => void] = pickerRowOf("Meals", mealsLine, mealsRows, mealsBox,
        (): void => mealsListShow(changed), (): void => mealsBox.replaceChildren());
    const [foodsRow, closeFoods]: [HTMLElement, () => void] = pickerRowOf("Foods", foodsLine, foodsRows, foodsBox,
        (): void => {
            foodSearchClear(foodsSearch);
            foodsSearch.querySelector("input")?.focus();
        }, (): void => {});
    mealsClose = closeMeals;
    foodsClose = closeFoods;
    rowsShow(changed);
    if (drawing === null)
        return [rowOf("Summary", summary), foodsRow];
    return [rowOf("Summary", summary), cookedRowOf(changed), mealsRow, foodsRow];
}

/**
 * Gives the meal as lines `X-FOOD`: first the foods of each meal with their grams for its servings eaten, from its
 * usual portion when none are given, the meal, its servings eaten and its variant, like
 * `Hackfleisch;125;ChiliConCarne;1;09.10.2026`, an unknown food without grams like `Salz;ChiliConCarne;1;09.10.2026`;
 * then the foods beside the meals, each its name, brand and store, then its grams typed, else its usual portion,
 * parted by `;`, like `Skyr natur;K-Classic;Kaufland;150` or `Reis;;;80` of a food without brand and store,
 * so every line says which product it was and how much; a food `Foods.md` does not hold, without grams, by its
 * name alone; a decimal comma as a point.
 * - `times`: Servings eaten of a meal.
 * - `tail`: The meal, its servings eaten and its variant, as each line of its foods ends.
 * - `one`: Grams of one serving of a food of a meal, `null` for an unknown food without grams.
 * - `portion`: Usual portion of a food beside the meals, `undefined` for an unknown one.
 * - `grams`: Its grams as written, empty for an unknown food without grams.
 *
 * @returns Lines in the order of the meals and the foods picked
 */
export function mealFoods(): string[] {
    return [
        ...meals.flatMap((meal: MealPick): string[] => {
            const times: number = numberOf(meal.portions) ?? 1;
            const tail: string = [meal.name, String(times), ...meal.variant === "" ? [] : [meal.variant]].join(";");
            return meal.foods.map((pick: FoodPick): string => {
                const one: number | null = numberOf(pick.grams) ?? foodOf(pick)?.portion ?? null;
                return one === null ? `${pick.name};${tail}` : `${pick.name};${gramsTextOf(one * times)};${tail}`;
            });
        }),
        ...picks.map((pick: FoodPick): string => {
            const portion: number | undefined = foodOf(pick)?.portion;
            const grams: string = pick.grams !== "" ? pick.grams.replace(",", ".")
                : portion === undefined ? "" : gramsTextOf(portion);
            return grams === "" ? pick.name : `${pick.name};${pick.brand};${pick.store};${grams}`;
        }),
    ];
}

/**
 * Gives the summary of the meal: the names of the meals, then of the foods beside them without brand and store,
 * in the order picked, parted by `, `, like `ChiliConCarne, Weißbrot`.
 *
 * @returns Summary, empty while nothing is picked
 */
export function mealTitle(): string {
    return [...meals.map((meal: MealPick): string => meal.name),
        ...picks.map((pick: FoodPick): string => pick.name.split(" · ")[0])].join(", ");
}
