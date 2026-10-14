/**
 * ## Meal in the entry by category
 *
 * A meal of the log, `Food`, in rows of the dialog, like every field, its meals and its foods each with its own list
 * right under it, see `listOf` in `choices.ts`, so meals and foods never mix:
 * - Summary: what I ate, written by itself, never typed: the meals, then the foods eaten beside them, parted by `, `,
 *   like `ChiliConCarne, Weißbrot`, and beside it what they give together, like `660 kcal`.
 * - Meals: my meals of `Meals.md`, each only its composition, two or more of my foods, see `../food/meals.ts`.
 *   A meal picked brings its foods at their usual portion: a row with its name, its kcal and a small grey `×`,
 *   which removes it, its foods indented below it, each a row as a food beside the meals has it, so I change the grams
 *   of each, or remove one I did not eat. Its list finds my meals as I type, each in the row of a meal of the food
 *   view, see `dishCellsOf` in `../food/meals.ts`, and while no meal has the name typed, the small grey plus with that
 *   name ends it, as in every list with a search, see `choices.ts`, and turns the list into the form of a meal,
 *   see `mealFormOf` in `../food/meals.ts`, named as typed; the meal saved goes into `Meals.md` and into this meal
 *   at once.
 * - Foods: foods eaten beside the meals, like `Weißbrot` beside `ChiliConCarne`, each a row with its name, its brand
 *   and store in brackets, its grams, its kcal and a small grey `×`, which removes it, like a food I did not eat
 *   of a cooking. Its list is the food search, see `../food/search.ts`: my foods first, then those of Open Food Facts;
 *   a click on one of my foods takes it, and so does adding a product, which goes into `Foods.md` first.
 *   Its grams start at its usual portion, white like every fact, and I type over them; a field I empty counts
 *   the usual portion too; every amount is rounded and an estimate anyway, so none is marked as one.
 *   Enter in its grams opens the list again.
 * Below each, the small grey plus of every list opens its list once one is picked; an empty row opens its list on a click.
 * The dialog writes each food as a line `X-FOOD`: its name, brand and store, then its grams, its usual portion when none
 * are typed, empty for a food `Foods.md` does not hold, and for a food of one of my meals the meal after them, like
 * `Hackfleisch;Gut & Günstig;Edeka;125;ChiliConCarne` or `Weißbrot;Harry;Rewe;50`, so the log keeps what the meal held
 * that day, whatever I change in `Meals.md` later; and the summary as its what, see {@link mealTitle}.
 * A meal whose summary names more than its foods, like `Bortzeit` written by hand, opens as that one meal with its
 * foods, so its name stays.
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
 * - `../food/foods.ts`: Finds my foods, loads my meals, writes amounts and makes elements and buttons.
 * - `../food/meals.ts`: The row of a meal, the form of a new meal, and kcal as the page writes them.
 * - `../food/search.ts`: The food search.
 * - `../icons.ts`: Puts the one plus and the one `×` into the buttons, their words as tooltip, and the plus
 *   with the text typed.
 */

import { choicesOf, listOf, rowOf, searchOf } from "./choices.ts";
import { dateTextOf, timeOf } from "./times.ts";
import { dayOf } from "../skill/attempts.ts";
import { amountOf, buttonOf, dishesLoad, elementOf, foodNameOf, foodsFind } from "../food/foods.ts";
import { dishCellsOf, kcalTextOf, mealFormOf } from "../food/meals.ts";
import { foodSearchClear, foodSearchOf } from "../food/search.ts";
import { crossPut, plusPut, plusTake, plusTypedPut } from "../icons.ts";

import type { Choice } from "./choices.ts";
import type { Dish, Food, FoodsFound } from "../food/foods.ts";


/**
 * A food picked, beside the meals or as part of one.
 *
 * - `name`, `brand`, `store`: Name of the food in `Foods.md`, its brand and the store I bought it in,
 *   like `Skyr natur`, `K-Classic` and `Kaufland`; brand and store empty in a line written before foods had them.
 * - `grams`: Grams as typed, like `150` or `7,5`; empty for its usual portion.
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
 * - `meal`: The meal of mine its food belongs to, empty for none.
 */
export type Line = {
    name: string;
    brand: string;
    store: string;
    grams: string;
    meal: string;
};

/**
 * A cooking of the log as the reader sends it, one a meal may draw from.
 *
 * - `id`: Identifier of its entry.
 * - `category`: Its category, `Cook`.
 * - `title`: What it was, like `Hackfleisch, Kidneybohnen, Tomaten`.
 * - `start`: Start as ISO instant.
 * - `foods`: Its lines `X-FOOD`, what went into the pot, like `Hackfleisch;Gut & Günstig;Edeka;500`.
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
 * A meal of mine picked, with its foods.
 *
 * - `name`: Name of the meal, like `ChiliConCarne`.
 * - `foods`: Its foods with their grams.
 */
type MealPick = {
    name: string;
    foods: FoodPick[];
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
 * My meals of `Meals.md`, loaded when the meal was built, with every meal added since.
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
 * List of the meals, with its search field, or the form of a meal in its place.
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
 * Turns a line `X-FOOD` into its parts, as the reader reads it: one of today names its food's name, brand and store,
 * then its grams, empty for a food `Foods.md` does not hold, and for the food of one of my meals the meal, like
 * `Skyr natur;K-Classic;Kaufland;150` or `Hackfleisch;Gut & Günstig;Edeka;125;ChiliConCarne`, told by its second part
 * being no grams and its fourth grams or empty; a food of a meal of `Meals.md` only its name, brand and store, like
 * `Hackfleisch;Gut & Günstig;Edeka`; an older line names its food alone, its grams after it, and for the food of a meal
 * the meal, then its servings eaten and its variant, which no longer count, like
 * `Hackfleisch;62.5;ChiliConCarne;0.5;09.10.2026`.
 * - `parts`: The parts of the line, without spaces at their ends.
 * - `grams`: Whether the second part of an older line is grams.
 *
 * @param line - Line like `Skyr natur;K-Classic;Kaufland;150`, `Hackfleisch;Gut & Günstig;Edeka`, `Reis;150` or `Eier`
 * @returns The line in its parts
 */
export function lineOf(line: string): Line {
    const parts: string[] = line.split(";").map((part: string): string => part.trim());
    if ((parts.length === 4 || parts.length === 5) && !gramsIs(parts[1]) && (parts[3] === "" || gramsIs(parts[3])))
        return { name: parts[0], brand: parts[1], store: parts[2], grams: parts[3], meal: parts[4] ?? "" };
    if (parts.length === 3 && !gramsIs(parts[1]) && !gramsIs(parts[2]))
        return { name: parts[0], brand: parts[1], store: parts[2], grams: "", meal: "" };
    const grams: boolean = parts.length > 1 && gramsIs(parts[1]);
    return { name: parts[0], brand: "", store: "", grams: grams ? parts[1] : "", meal: parts[grams ? 2 : 1] ?? "" };
}

/**
 * Reads a number as typed, a decimal comma counting as a point and a `~` before it, which marks grams guessed,
 * not weighed, like `~400` from a photo, left out.
 *
 * @param text - Number as typed, like `150`, `7,5` or `~400`
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
 * Tells what a food picked gives: its grams, or its usual portion when none are typed, times its kcal per 100 g.
 * - `food`: The food in `Foods.md`, `undefined` for one it does not hold.
 * - `counted`: Grams counted.
 *
 * @param pick - Food picked
 * @returns kcal; 0 for a food not in `Foods.md` or grams that are no number
 */
function kcalOf(pick: FoodPick): number {
    const food: Food | undefined = foodOf(pick);
    const counted: number = numberOf(pick.grams) ?? food?.portion ?? 0;
    return Number.isFinite(counted) ? counted / 100 * (food?.kcal ?? 0) : 0;
}

/**
 * Tells what a meal picked gives: what its foods give.
 *
 * @param meal - Meal picked
 * @returns kcal
 */
function mealKcalOf(meal: MealPick): number {
    return meal.foods.reduce((sum: number, pick: FoodPick): number => sum + kcalOf(pick), 0);
}

/**
 * Makes the small field of the grams of a food with `g` after it, starting at the grams typed, else at the usual
 * portion, which a click selects so I type over it; grey in it only once I empty it, the usual portion it then counts;
 * marking itself invalid while its text is no number above 0, so the dialog does not send it.
 *
 * @param value - Grams as typed, empty for none
 * @param empty - What it counts while empty, the usual portion
 * @param name - Words for screen readers, like `Grams of Brot`
 * @param typed - Takes the text typed
 * @returns The field with its unit, and the text field itself
 */
function gramsFieldOf(value: string, empty: string, name: string,
                      typed: (text: string) => void): [HTMLElement, HTMLInputElement] {
    const label: HTMLElement = elementOf("label", "meal-grams", "");
    const input: HTMLInputElement = document.createElement("input");
    input.type = "text";
    input.inputMode = "decimal";
    input.autocomplete = "off";
    input.value = value !== "" ? value : empty;
    input.placeholder = empty;
    input.addEventListener("focus", (): void => input.select());
    input.setAttribute("aria-label", name);
    input.addEventListener("input", (): void => {
        const number: number | null = numberOf(input.value.trim());
        input.setCustomValidity(number === null || number > 0 ? "" : "A number above 0, or empty");
        typed(input.value.trim());
    });
    label.append(input, " g");
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
 * Builds the row of a food, beside the meals or of one: its name, its brand and store in brackets after it, like
 * `Skyr natur (K-Classic, Kaufland)`, since they only tell which one it is, marked when `Foods.md` does not hold it,
 * its grams, its kcal and a small grey `×`, which removes it, as a value picked in every list of the dialog.
 * - `food`: The food in `Foods.md`, `undefined` for one it does not hold.
 * - `name`: Its name with its brand and store, see `foodNameOf` in `../food/foods.ts`.
 * - `kcal`: Cell of its kcal.
 * - `remove`: Its `×`.
 *
 * @param pick - Food picked, changed as its grams are typed
 * @param typed - Comes once its grams are typed, after its kcal show anew
 * @param removed - Takes it out of the meal, on its `×`
 * @returns Row
 */
function foodRowOf(pick: FoodPick, typed: () => void, removed: () => void): HTMLElement {
    const row: HTMLElement = elementOf("div", "meal-row", "");
    const food: Food | undefined = foodOf(pick);
    const name: HTMLElement = foodNameOf("meal-name", pick.name, pick.brand, pick.store);
    const kcal: HTMLElement = elementOf("span", "meal-kcal", food === undefined ? "" : kcalTextOf(kcalOf(pick)));
    const [grams, input]: [HTMLElement, HTMLInputElement] = gramsFieldOf(pick.grams,
        food === undefined ? "" : amountOf(food.portion, 0), `Grams of ${pick.name}`, (text: string): void => {
            pick.grams = text;
            kcal.textContent = food === undefined ? "" : kcalTextOf(kcalOf(pick));
            typed();
        });
    const remove: HTMLButtonElement = buttonOf("", "", removed);

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
    crossPut(remove, `Remove ${pick.name}`);
    row.append(name, grams, kcal, remove);
    return row;
}

/**
 * Builds the rows of a meal picked: its row, its name, its kcal and a small grey `×`, which removes it; below it
 * its foods, indented, each a row of a food, see {@link foodRowOf}; the meal goes with its last food.
 * - `kcal`: Cell of its kcal.
 * - `remove`: Its `×`.
 *
 * @param meal - Meal picked
 * @param changed - Tells the dialog that the meal changed
 * @returns Its row, then the rows of its foods
 */
function mealRowsOf(meal: MealPick, changed: () => void): HTMLElement[] {
    const row: HTMLElement = elementOf("div", "meal-row", "");
    const kcal: HTMLElement = elementOf("span", "meal-kcal", kcalTextOf(mealKcalOf(meal)));
    const remove: HTMLButtonElement = buttonOf("", "", (): void => {
        meals = meals.filter((other: MealPick): boolean => other !== meal);
        rowsShow(changed);
        changed();
    });

    crossPut(remove, `Remove ${meal.name}`);
    row.append(elementOf("span", "meal-name", meal.name), elementOf("span", "", ""), kcal, remove);
    return [row, ...meal.foods.map((pick: FoodPick): HTMLElement => {
        const part: HTMLElement = foodRowOf(pick, (): void => {
            kcal.textContent = kcalTextOf(mealKcalOf(meal));
            summaryShow();
            changed();
        }, (): void => {
            meal.foods = meal.foods.filter((other: FoodPick): boolean => other !== pick);
            meals = meals.filter((other: MealPick): boolean => other.foods.length > 0);
            rowsShow(changed);
            changed();
        });
        part.classList.add("meal-part");
        return part;
    })];
}

/**
 * Shows the summary, see {@link mealTitle}, and beside it the kcal of the whole meal, white like every kcal;
 * nothing while nothing is picked.
 * - `total`: kcal of the meals and the foods beside them.
 */
function summaryShow(): void {
    const total: number = meals.reduce((sum: number, meal: MealPick): number => sum + mealKcalOf(meal), 0)
        + picks.reduce((sum: number, pick: FoodPick): number => sum + kcalOf(pick), 0);
    summary.replaceChildren(mealTitle());
    if (meals.length > 0 || picks.length > 0)
        summary.append(elementOf("span", "meal-total", kcalTextOf(total)));
}

/**
 * Shows the lines of the meals and the foods below their rows: while some are picked, the one plus of every list
 * that adds one more, see `plusPut` in `../icons.ts`, `Add a meal` or `Add a food` as its tooltip; nothing while none
 * is, so the empty row opens its list like every empty field.
 */
function linesShow(): void {
    mealsLine.classList.add("picker-empty");
    foodsLine.classList.add("picker-empty");
    if (meals.length > 0)
        plusPut(mealsLine, "Add a meal");
    else
        plusTake(mealsLine);
    if (picks.length > 0)
        plusPut(foodsLine, "Add a food");
    else
        plusTake(foodsLine);
}

/**
 * Shows the rows of the meals and of the foods picked, then the summary and the lines.
 *
 * @param changed - Tells the dialog that the meal changed
 */
function rowsShow(changed: () => void): void {
    mealsRows.replaceChildren(...meals.flatMap((meal: MealPick): HTMLElement[] => mealRowsOf(meal, changed)));
    foodsRows.replaceChildren(...picks.map((pick: FoodPick): HTMLElement => foodRowOf(pick, (): void => {
        summaryShow();
        changed();
    }, (): void => {
        picks = picks.filter((other: FoodPick): boolean => other !== pick);
        rowsShow(changed);
        changed();
    })));
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
 * Picks one of my meals with its foods at their usual portion, unless it is picked already; then closes the list.
 *
 * @param dish - Meal of `Meals.md`
 * @param changed - Tells the dialog that the meal changed
 */
function dishPick(dish: Dish, changed: () => void): void {
    if (!meals.some((meal: MealPick): boolean => meal.name.toLowerCase() === dish.name.toLowerCase())) {
        meals.push({ name: dish.name, foods: dish.foods.map((line: string): FoodPick => pickOf(lineOf(line), "")) });
        rowsShow(changed);
        changed();
    }
    mealsClose();
}

/**
 * Turns the list of the meals into the form of a new meal, see `mealFormOf` in `../food/meals.ts`, named as typed;
 * saved, it goes into this meal at once, cancelled, the list shows again.
 * - `form`: The form.
 *
 * @param name - Name typed, empty for none
 * @param changed - Tells the dialog that the meal changed
 */
function formShow(name: string, changed: () => void): void {
    const form: HTMLElement = mealFormOf({
        name: name,
        saved: (sent: Dish[], saved: string): void => {
            dishes = sent;
            const found: Dish | undefined = dishes.find((one: Dish): boolean => one.name.toLowerCase() === saved);
            if (found !== undefined)
                dishPick(found, changed);
        },
        cancelled: (): void => mealsListShow(changed),
    });
    mealsBox.replaceChildren(form);
    form.querySelector("input")?.focus();
}

/**
 * Shows the list of the meals in its box, as every list with a search, see `choices.ts`: the search field, my meals
 * whose name holds what is typed, ignoring case and spaces, each in the row of a meal, see `dishCellsOf`
 * in `../food/meals.ts`, and while no meal has the name typed, the small grey plus with that name, `New meal`
 * its tooltip, which turns the list into the form of a meal named so; Enter picks the first meal found, else does
 * what the plus does.
 * - `input`: The search field.
 * - `list`: The meals found.
 * - `plus`: The plus with the name typed.
 * - `listShow`: Shows the meals found for what is typed, and the plus while none has that name.
 *
 * @param changed - Tells the dialog that the meal changed
 */
function mealsListShow(changed: () => void): void {
    const input: HTMLInputElement = document.createElement("input");
    const list: HTMLElement = elementOf("div", "picker-list", "");
    const plus: HTMLButtonElement = buttonOf("picker-new", "", (): void => formShow(input.value.trim(), changed));
    const listShow: () => void = (): void => {
        const typed: string = input.value.trim();
        const key: string = typed.replace(/\s+/g, "").toLowerCase();
        const found: Dish[] = dishes.filter((dish: Dish): boolean => dish.name.toLowerCase().includes(key));
        list.replaceChildren(...found.map((dish: Dish): HTMLElement => {
            const button: HTMLButtonElement = buttonOf("dish-row", "", (): void => dishPick(dish, changed));
            button.append(...dishCellsOf(dish));
            return button;
        }));
        plus.hidden = typed === "" || found.some((dish: Dish): boolean => dish.name.toLowerCase() === key);
        plusTypedPut(plus, typed);
    };
    input.type = "search";
    input.className = "picker-search";
    input.placeholder = "Search or add a meal";
    input.autocomplete = "off";
    input.addEventListener("input", listShow);
    input.addEventListener("keydown", (event: KeyboardEvent): void => {
        if (event.key !== "Enter")
            return;
        event.preventDefault();
        (list.querySelector("button") ?? (plus.hidden ? null : plus))?.click();
    });
    plus.title = "New meal";
    listShow();
    mealsBox.replaceChildren(input, list, plus);
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
        plus: true,
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
 * the rows of its summary, its meals and its foods. The lines `X-FOOD` of a meal go to its meal, by the meal
 * they carry; a meal whose summary names more than its foods, like `Bortzeit`, takes all its foods as that one meal.
 * - `found`: All my foods, as the search finds them for an empty text.
 * - `mealsMine`: My meals of `Meals.md`.
 * - `cooks`: My cookings of the days before a meal, none for a cooking.
 * - `last`: The meal the lines so far went to.
 * - `brought`: Keys of the foods of the cooking the meal draws from, whose lines came with it.
 * - `foodsBox`: The list of the foods, with the food search.
 * - `mealsRow`, `foodsRow`: The rows of the meals and of the foods.
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
    const [found, mealsMine, cooks]: [FoodsFound, Dish[], Cooking[]] = await Promise.all([foodsFind("", 1),
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
        let last: MealPick | undefined = meals.at(-1);
        if (last === undefined || last.name !== read.meal) {
            last = { name: read.meal, foods: [] };
            meals.push(last);
        }
        last.foods.push(pickOf(read, read.grams));
    });
    if (drawing !== null && meals.length === 0 && picks.length > 0 && title.trim() !== ""
        && title.trim().toLowerCase() !== picks.map((pick: FoodPick): string => pick.name).join(", ").toLowerCase()) {
        meals = [{ name: title.trim(), foods: picks }];
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
 * Writes a food picked as a line `X-FOOD`: its name, brand and store, then its grams typed, a decimal comma
 * as a point, else its usual portion, empty for a food `Foods.md` does not hold, parted by `;`,
 * like `Skyr natur;K-Classic;Kaufland;150`, so every line says which product it was and how much.
 * - `portion`: Its usual portion, `undefined` for an unknown food.
 * - `grams`: Its grams as written.
 *
 * @param pick - Food picked
 * @returns The line, without a meal
 */
function lineTextOf(pick: FoodPick): string {
    const portion: number | undefined = foodOf(pick)?.portion;
    const grams: string = pick.grams !== "" ? pick.grams.replace(",", ".")
        : portion === undefined ? "" : gramsTextOf(portion);
    return `${pick.name};${pick.brand};${pick.store};${grams}`;
}

/**
 * Gives the meal as lines `X-FOOD`, see {@link lineTextOf}: first the foods of each meal, its name after each,
 * like `Hackfleisch;Gut & Günstig;Edeka;125;ChiliConCarne`, then the foods beside the meals.
 *
 * @returns Lines in the order of the meals and the foods picked
 */
export function mealFoods(): string[] {
    return [
        ...meals.flatMap((meal: MealPick): string[] =>
            meal.foods.map((pick: FoodPick): string => `${lineTextOf(pick)};${meal.name}`)),
        ...picks.map(lineTextOf),
    ];
}

/**
 * Gives the summary of the meal: the names of the meals, then of the foods beside them without brand and store,
 * in the order picked, parted by `, `, like `ChiliConCarne, Weißbrot`.
 *
 * @returns Summary, empty while nothing is picked
 */
export function mealTitle(): string {
    return [...meals, ...picks].map((picked: MealPick | FoodPick): string => picked.name).join(", ");
}
