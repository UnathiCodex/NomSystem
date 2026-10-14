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
 *   its kcal, `⇄`, which opens the list to replace it in its place by another food, and `×`, which removes it.
 *   Its list is the food search, see `../food/search.ts`: my foods first, then those of Open Food Facts;
 *   a click on one of my foods takes it, and so does adding a product, which goes into `Foods.md` first.
 *   Grams are optional: a food without them counts its usual portion, shown grey in its empty field;
 *   every amount is rounded and an estimate anyway, so none is marked as one. Enter in its grams opens the list again.
 * Below each, grey, `+ Meal` and `+ Food` open their lists once one is picked; an empty row opens its list on a click.
 * The dialog writes each food as a line `X-FOOD`: first the foods of each meal with their grams for its servings eaten,
 * the meal, its servings eaten and its variant, like `Hackfleisch;125;ChiliConCarne;1;09.10.2026`, so the log keeps
 * the meal as it was that day, whatever I change in `Meals.md` later; then the foods beside, like `Brot;50`,
 * `Döner;~400` with grams guessed, or `Eier` without grams; and the summary as its what, see {@link mealTitle}.
 * A meal written before my meals, named on its own, like `Bortzeit`, opens as that one meal with its foods,
 * so its name stays.
 * A meal eaten out, where nothing can be weighed, I log by photo through Claude, who writes its entry through the reader;
 * the dialog itself takes no photo.
 *
 * - `./choices.ts`: Rows of the dialog, and the lists that open right under them.
 * - `../food/foods.ts`: Finds my foods, loads my meals, writes amounts and makes elements.
 * - `../food/meals.ts`: The form of a new meal or variant, and the texts of variants.
 * - `../food/search.ts`: The food search.
 * - `../icons.ts`: Puts the icons into the buttons, their words as tooltip.
 * - `lucide`: The icons remove, replace, and those that show or hide the foods of a meal.
 */

import { listOf, rowOf } from "./choices.ts";
import { amountOf, dishesLoad, elementOf, foodsFind } from "../food/foods.ts";
import { kcalTextOf, mealFormOf, variantTextOf } from "../food/meals.ts";
import { foodSearchClear, foodSearchOf } from "../food/search.ts";
import { iconOf, iconPut, iconWordsOf } from "../icons.ts";
import { ArrowLeftRight, ChevronDown, ChevronRight, Plus, X } from "lucide";

import type { Dish, Food, FoodsFound, Variant } from "../food/foods.ts";


/**
 * A food picked, beside the meals or as part of one.
 *
 * - `name`: Name of the food in `Foods.md`.
 * - `grams`: Grams as typed, like `150` or `7,5`, of one serving for the food of a meal; empty for its usual portion.
 */
type FoodPick = {
    name: string;
    grams: string;
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
 * Category of meals, the one whose entries list foods.
 */
export const foodName: string = "Food";

/**
 * My foods by their names in small letters, loaded when the meal was built, with every food added since.
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
 * Food whose `⇄` opened the list of the foods, to be replaced by the food picked; `null` while the list adds foods.
 */
let replacing: FoodPick | null = null;

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
 * Tells whether a part of a line `X-FOOD` is grams, like `150` or `~400`.
 *
 * @param part - Part of the line
 * @returns Whether it is grams
 */
function gramsIs(part: string): boolean {
    return /^~?\s*\d+(?:[.,]\d+)?$/.test(part);
}

/**
 * Turns a line `X-FOOD` into its parts: the food, its grams, and for the food of a meal the meal, its servings eaten
 * and its variant; a line of a meal without grams, like `Salz;ChiliConCarne;1;09.10.2026`, told apart by its second
 * part being no number.
 * - `parts`: The parts of the line, without spaces at their ends.
 * - `grams`: Whether its second part is grams.
 *
 * @param line - Line like `Reis;150`, `Eier` or `Hackfleisch;125;ChiliConCarne;1;09.10.2026`
 * @returns Name, grams, meal, servings eaten and variant, each empty when the line gives none
 */
function partsOf(line: string): [string, string, string, string, string] {
    const parts: string[] = line.split(";").map((part: string): string => part.trim());
    const grams: boolean = parts.length > 1 && gramsIs(parts[1]);
    const rest: string[] = grams ? parts.slice(2) : parts.slice(1);
    return [parts[0], grams ? parts[1] : "", rest[0] ?? "", rest[1] ?? "", rest[2] ?? ""];
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
    const food: Food | undefined = mine.get(pick.name.toLowerCase());
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
 * Builds the row of a food beside the meals: its name, marked when `Foods.md` does not hold it, its grams,
 * its kcal, `⇄`, which opens the list of the foods to replace it, and `×`, which removes it.
 * - `food`: The food in `Foods.md`, `undefined` for one it does not hold.
 * - `kcal`: Cell of its kcal.
 * - `replace`, `remove`: Its buttons `⇄` and `×`.
 *
 * @param pick - Food picked, changed as its grams are typed
 * @param changed - Tells the dialog that the meal changed
 * @returns Row
 */
function foodRowOf(pick: FoodPick, changed: () => void): HTMLElement {
    const row: HTMLElement = elementOf("div", "meal-row", "");
    const food: Food | undefined = mine.get(pick.name.toLowerCase());
    const name: HTMLElement = elementOf("span", "meal-name", pick.name);
    const kcal: HTMLElement = elementOf("span", "meal-kcal", food === undefined ? "" : kcalTextOf(kcalOf(pick, 1)));
    const [grams, input]: [HTMLElement, HTMLInputElement] = numberFieldOf(pick.grams,
        food === undefined ? "" : amountOf(food.portion, 0), "g", `Grams of ${pick.name}`, (text: string): void => {
            pick.grams = text;
            kcal.textContent = food === undefined ? "" : kcalTextOf(kcalOf(pick, 1));
            summaryShow();
            changed();
        });
    const replace: HTMLButtonElement = buttonOf("", "", (): void => {
        replacing = pick;
        if (foodsClosed())
            foodsLine.click();
        else {
            foodSearchClear(foodsSearch);
            foodsSearch.querySelector("input")?.focus();
        }
    });
    const remove: HTMLButtonElement = buttonOf("", "", (): void => {
        picks = picks.filter((other: FoodPick): boolean => other !== pick);
        rowsShow(changed);
        changed();
    });

    if (food === undefined)
        name.append(elementOf("span", "meal-unknown", " · not in my foods"));
    name.title = pick.name;
    input.addEventListener("keydown", (event: KeyboardEvent): void => {
        if (event.key !== "Enter")
            return;
        event.preventDefault();
        if (foodsClosed())
            foodsLine.click();
    });
    iconPut(replace, ArrowLeftRight, `Replace ${pick.name}`);
    iconPut(remove, X, `Remove ${pick.name}`);
    row.append(name, grams, kcal, replace, remove);
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
    const remove: HTMLButtonElement = buttonOf("", "", (): void => {
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
    row.append(toggle, portions, kcal, elementOf("span", "", ""), remove);
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
 * Picks a food from the search of the foods: in place of the food being replaced, see {@link replacing}, which simply
 * goes when the food is picked already; else as one more food, unless it is picked already. Then closes the list
 * and puts the cursor into the field of its grams.
 * - `same`: Whether a food picked is this one, ignoring case.
 * - `index`: Place of the food among the foods picked.
 * - `at`: Place of the food being replaced, -1 for none.
 *
 * @param food - Food picked or just added to `Foods.md`
 * @param changed - Tells the dialog that the meal changed
 */
function foodPick(food: Food, changed: () => void): void {
    mine.set(food.name.toLowerCase(), food);
    const same: (pick: FoodPick) => boolean = (pick: FoodPick): boolean =>
        pick.name.toLowerCase() === food.name.toLowerCase();
    let index: number = picks.findIndex(same);
    const at: number = replacing === null ? -1 : picks.indexOf(replacing);
    if (at !== -1 && index === -1) {
        picks[at] = { name: food.name, grams: "" };
        index = at;
    } else if (at !== -1 && index !== at) {
        picks.splice(at, 1);
        index = picks.findIndex(same);
    } else if (index === -1)
        index = picks.push({ name: food.name, grams: "" }) - 1;
    replacing = null;
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
                const [name, grams]: string[] = line.split(";").map((part: string): string => part.trim());
                const whole: number | null = numberOf(grams ?? "") ?? mine.get(name.toLowerCase())?.portion ?? null;
                return { name: name, grams: whole === null ? "" : gramsTextOf(whole / variant.servings) };
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
 *
 * @param lines - Lines `X-FOOD` of the meal, like `Reis;150`; none for a new meal
 * @param title - Summary of the meal written before, like `ChiliConCarne, Brot`; empty for a new meal
 * @param changed - Tells the dialog that the meal changed
 * @returns The rows of summary, meals and foods, to put into the dialog in place of the summary
 * @throws {Error} - When the reader cannot answer
 */
export async function mealOf(lines: string[], title: string, changed: () => void): Promise<HTMLElement[]> {
    const [found, mealsMine]: [FoodsFound, Dish[]] = await Promise.all([foodsFind("", "", 1), dishesLoad()]);
    dishes = mealsMine;
    mine = new Map(found.foods.map((food: Food): [string, Food] => [food.name.toLowerCase(), food]));
    meals = [];
    picks = [];
    replacing = null;
    lines.map(partsOf).forEach(([name, grams, meal, portions, variant]: [string, string, string, string, string]): void => {
        if (meal === "") {
            picks.push({ name: name, grams: grams });
            return;
        }
        const times: number = numberOf(portions) ?? 1;
        const one: string = numberOf(grams) === null ? "" : gramsTextOf((numberOf(grams) ?? 0) / times);
        let last: MealPick | undefined = meals.at(-1);
        if (last === undefined || last.name !== meal || last.variant !== variant || (numberOf(last.portions) ?? 1) !== times) {
            last = { name: meal, variant: variant, portions: times === 1 ? "" : String(times), foods: [], open: false };
            meals.push(last);
        }
        last.foods.push({ name: name, grams: one });
    });
    if (meals.length === 0 && picks.length > 0 && title.trim() !== ""
        && title.trim().toLowerCase() !== picks.map((pick: FoodPick): string => pick.name).join(", ").toLowerCase()) {
        meals = [{ name: title.trim(), variant: "", portions: "", foods: picks, open: false }];
        picks = [];
    }

    summary = elementOf("span", "meal-summary", "");
    mealsLine = document.createElement("button");
    foodsLine = document.createElement("button");
    mealsRows = elementOf("div", "meal-rows", "");
    foodsRows = elementOf("div", "meal-rows", "");
    mealsBox = elementOf("div", "picker-box meal-box", "");
    foodsSearch = foodSearchOf((food: Food): void => foodPick(food, changed), (): HTMLElement[] =>
        replacing === null ? [] : [elementOf("p", "food-group meal-replace", `Replace ${replacing.name}`)]);
    const foodsBox: HTMLElement = elementOf("div", "picker-box meal-box", "");
    foodsBox.append(foodsSearch);
    const [mealsRow, closeMeals]: [HTMLElement, () => void] = pickerRowOf("Meals", mealsLine, mealsRows, mealsBox,
        (): void => mealsListShow(changed), (): void => mealsBox.replaceChildren());
    const [foodsRow, closeFoods]: [HTMLElement, () => void] = pickerRowOf("Foods", foodsLine, foodsRows, foodsBox,
        (): void => {
            foodSearchClear(foodsSearch);
            foodsSearch.querySelector("input")?.focus();
        }, (): void => {
            replacing = null;
        });
    mealsClose = closeMeals;
    foodsClose = closeFoods;
    rowsShow(changed);
    return [rowOf("Summary", summary), mealsRow, foodsRow];
}

/**
 * Gives the meal as lines `X-FOOD`: first the foods of each meal with their grams for its servings eaten, from its
 * usual portion when none are given, the meal, its servings eaten and its variant, like
 * `Hackfleisch;125;ChiliConCarne;1;09.10.2026`, an unknown food without grams like `Salz;ChiliConCarne;1;09.10.2026`;
 * then the foods beside the meals, the name, then `;` and the grams when typed, like `Brot;50` or `Eier`;
 * a decimal comma as a point.
 * - `times`: Servings eaten of a meal.
 * - `tail`: The meal, its servings eaten and its variant, as each line of its foods ends.
 * - `one`: Grams of one serving of a food of a meal, `null` for an unknown food without grams.
 *
 * @returns Lines in the order of the meals and the foods picked
 */
export function mealFoods(): string[] {
    return [
        ...meals.flatMap((meal: MealPick): string[] => {
            const times: number = numberOf(meal.portions) ?? 1;
            const tail: string = [meal.name, String(times), ...meal.variant === "" ? [] : [meal.variant]].join(";");
            return meal.foods.map((pick: FoodPick): string => {
                const one: number | null = numberOf(pick.grams) ?? mine.get(pick.name.toLowerCase())?.portion ?? null;
                return one === null ? `${pick.name};${tail}` : `${pick.name};${gramsTextOf(one * times)};${tail}`;
            });
        }),
        ...picks.map((pick: FoodPick): string => pick.grams === "" ? pick.name : `${pick.name};${pick.grams.replace(",", ".")}`),
    ];
}

/**
 * Gives the summary of the meal: the names of the meals, then of the foods beside them, in the order picked,
 * parted by `, `, like `ChiliConCarne, Weißbrot`.
 *
 * @returns Summary, empty while nothing is picked
 */
export function mealTitle(): string {
    return [...meals.map((meal: MealPick): string => meal.name), ...picks.map((pick: FoodPick): string => pick.name)]
        .join(", ");
}
