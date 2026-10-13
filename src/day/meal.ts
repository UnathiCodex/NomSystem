/**
 * ## Meal in the entry by category
 *
 * A meal of the log, `Food`, in three rows of the dialog, like every field, each of the last two with its own list
 * right under it, see `listOf` in `choices.ts`, so meals and foods never mix:
 * - Summary: what I ate, written by itself, never typed: the meals, then the foods eaten beside them, parted by `, `,
 *   like `Käsesalat, Brot`, and grey beside it what they give together, like `586 kcal`.
 * - Meals: my meals of `Meals.md`, each made of two or more of my foods with the grams of one portion;
 *   each meal picked a row: its name with a chevron, which shows its foods below it, its portions, like `1` or `0.5`,
 *   its kcal and `×`, which removes it. Its list finds my meals as I type, each with its foods and kcal grey beside it,
 *   and ends with `+ New meal`, which turns the list into the form of a new meal: its name, its foods with their grams
 *   of one portion, picked by the food search, and `Save meal` from two foods on; the meal saved goes into `Meals.md`
 *   and into this meal at once.
 * - Foods: foods eaten beside the meals, like `Brot` beside `Käsesalat`, each a row with its name, its grams,
 *   its kcal, `⇄`, which opens the list to replace it in its place by another food, and `×`, which removes it.
 *   Its list is the food search, see `../food/search.ts`: my foods first, then those of Open Food Facts;
 *   a click on one of my foods takes it, and so does adding a product, which goes into `Foods.md` first.
 *   Grams are optional: a food without them counts its usual portion, shown grey in its empty field;
 *   every amount is rounded and an estimate anyway, so none is marked as one. Enter in its grams opens the list again.
 * The dialog writes each food as a line `X-FOOD`: first the foods of each meal with their grams for its portions,
 * the meal and its portions, like `Käse;50;Käsesalat;0.5`, so the log keeps the meal as it was that day,
 * whatever I change in `Meals.md` later; then the foods beside, like `Brot;50`, `Döner;~400` with grams guessed,
 * or `Eier` without grams; and the summary as its what, see {@link mealTitle}.
 * A meal written before my meals, named on its own, like `Bortzeit`, opens as that one meal with its foods,
 * so its name stays.
 * A meal eaten out, where nothing can be weighed, I log by photo through Claude, who writes its entry through the reader;
 * the dialog itself takes no photo.
 *
 * - `./choices.ts`: Rows of the dialog, and the lists that open right under them.
 * - `../food/foods.ts`: Finds my foods, loads my meals and sends new ones, writes amounts and makes elements.
 * - `../food/search.ts`: The food search.
 * - `../icons.ts`: Puts the icons into the buttons, their words as tooltip.
 * - `lucide`: The icons remove, replace, and those that show or hide the foods of a meal.
 */

import { listOf, rowOf } from "./choices.ts";
import { amountOf, dishesLoad, dishSend, elementOf, foodsFind } from "../food/foods.ts";
import { foodSearchClear, foodSearchOf } from "../food/search.ts";
import { iconOf, iconPut } from "../icons.ts";
import { ArrowLeftRight, ChevronDown, ChevronRight, X } from "lucide";

import type { Dish, Food, FoodsFound } from "../food/foods.ts";


/**
 * A food picked, beside the meals or as part of one.
 *
 * - `name`: Name of the food in `Foods.md`.
 * - `grams`: Grams as typed, like `150` or `7,5`, of one portion for the food of a meal; empty for its usual portion.
 */
type FoodPick = {
    name: string;
    grams: string;
};

/**
 * A meal picked.
 *
 * - `name`: Name of the meal, like `Käsesalat`.
 * - `portions`: Portions as typed, like `0,5`; empty for one.
 * - `foods`: Its foods with their grams of one portion.
 * - `open`: Whether its foods show below its row.
 */
type MealPick = {
    name: string;
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
 * Food whose `⇄` opened the list of the foods, to be replaced by the food picked; `null` while the list adds foods.
 */
let replacing: FoodPick | null = null;

/**
 * Text of the summary, and grey beside it the kcal of the whole meal.
 */
let summary: HTMLElement = document.createElement("span");

/**
 * Line of the meals, their names, which opens their list.
 */
let mealsLine: HTMLButtonElement = document.createElement("button");

/**
 * Line of the foods beside the meals, their names, which opens their list.
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
 * List of the meals, with its search field, or the form of a new meal in its place.
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
 * Turns a line `X-FOOD` into its parts: the food, its grams, and for the food of a meal the meal and its portions.
 *
 * @param line - Line like `Reis;150`, `Eier` or `Käse;50;Käsesalat;0.5`
 * @returns Name, grams, meal and portions, each empty when the line gives none
 */
function partsOf(line: string): [string, string, string, string] {
    const parts: string[] = line.split(";").map((part: string): string => part.trim());
    if (parts.length === 3)
        return [parts[0], "", parts[1], parts[2]];
    return [parts[0], parts[1] ?? "", parts[2] ?? "", parts[3] ?? ""];
}

/**
 * Turns a line of a food of a meal of `Meals.md`, like `Käse;100` or `Gurkensalat`, into a food picked.
 *
 * @param line - Line of a food and its grams of one portion
 * @returns Food picked
 */
function pickOf(line: string): FoodPick {
    const [name, grams]: [string, string, string, string] = partsOf(line);
    return { name: name, grams: grams };
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
 * Tells what a food picked gives: its grams, or its usual portion when none are typed, times the portions,
 * times its kcal per 100 g.
 * - `food`: The food in `Foods.md`, `undefined` for one it does not hold.
 * - `counted`: Grams counted.
 *
 * @param pick - Food picked
 * @param times - Portions, 1 for a food beside the meals
 * @returns kcal; 0 for a food not in `Foods.md` or grams that are no number
 */
function kcalOf(pick: FoodPick, times: number): number {
    const food: Food | undefined = mine.get(pick.name.toLowerCase());
    const counted: number = (numberOf(pick.grams) ?? food?.portion ?? 0) * times;
    return Number.isFinite(counted) ? counted / 100 * (food?.kcal ?? 0) : 0;
}

/**
 * Tells what a meal picked gives: what its foods give for its portions.
 *
 * @param meal - Meal picked
 * @returns kcal, 0 while its portions are no number
 */
function mealKcalOf(meal: MealPick): number {
    const times: number = numberOf(meal.portions) ?? 1;
    return meal.foods.reduce((sum: number, pick: FoodPick): number => sum + kcalOf(pick, times), 0);
}

/**
 * Writes kcal as the page shows them, whole.
 *
 * @param kcal - kcal
 * @returns Text like `617 kcal`
 */
function kcalTextOf(kcal: number): string {
    return `${amountOf(kcal, 0)} kcal`;
}

/**
 * Writes foods with their grams, like `Käse 100 g, Gurkensalat`.
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
 * Makes the small field of a number, grams or portions, with its unit after it, what it counts while empty grey in it,
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
 * Builds the row of a meal picked: its name with a chevron, which shows or hides its foods with their grams
 * of one portion below the row, its portions, its kcal for them, and `×`, which removes it.
 * - `toggle`: Its name with the chevron.
 * - `kcal`: Cell of its kcal.
 * - `rows`: The row, and below it its foods while shown.
 *
 * @param meal - Meal picked, changed as its portions are typed
 * @param changed - Tells the dialog that the meal changed
 * @returns The row, with its foods below it while shown
 */
function mealRowOf(meal: MealPick, changed: () => void): HTMLElement[] {
    const row: HTMLElement = elementOf("div", "meal-row", "");
    const toggle: HTMLButtonElement = buttonOf("meal-dish-toggle", "", (): void => {
        meal.open = !meal.open;
        rowsShow(changed);
    });
    const kcal: HTMLElement = elementOf("span", "meal-kcal", kcalTextOf(mealKcalOf(meal)));
    const [portions]: [HTMLElement, HTMLInputElement] = numberFieldOf(meal.portions, "1", "×",
        `Portions of ${meal.name}`, (text: string): void => {
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

    toggle.append(iconOf(meal.open ? ChevronDown : ChevronRight), elementOf("span", "meal-name", meal.name));
    toggle.setAttribute("aria-expanded", String(meal.open));
    toggle.title = meal.open ? "Hide its foods" : "Show its foods";
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
 * Shows the lines of the meals and the foods below their rows: grey `+ Meal` and `+ Food` while some are picked,
 * nothing while none is, so the empty row opens its list like every empty field.
 */
function linesShow(): void {
    mealsLine.textContent = meals.length === 0 ? "" : "+ Meal";
    mealsLine.classList.toggle("picker-empty", meals.length === 0);
    mealsLine.classList.toggle("meal-add", meals.length > 0);
    foodsLine.textContent = picks.length === 0 ? "" : "+ Food";
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
 * Picks one of my meals, one portion with its foods of `Meals.md`, unless it is picked already; then closes the list
 * and puts the cursor into the field of its portions.
 * - `index`: Place of the meal among the meals picked.
 *
 * @param dish - Meal of `Meals.md`
 * @param changed - Tells the dialog that the meal changed
 */
function dishPick(dish: Dish, changed: () => void): void {
    let index: number = meals.findIndex((meal: MealPick): boolean => meal.name.toLowerCase() === dish.name.toLowerCase());
    if (index === -1) {
        index = meals.push({ name: dish.name, portions: "", foods: dish.foods.map(pickOf), open: false }) - 1;
        rowsShow(changed);
        changed();
    }
    mealsClose();
    mealsRows.querySelectorAll<HTMLInputElement>(".meal-grams input")[index]?.focus();
}

/**
 * Shows the list of the meals in its box: the search field, my meals whose name holds what is typed, ignoring case,
 * each with its foods and kcal grey beside it, and `+ New meal` at its end, naming what is typed while no meal has it.
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
        const known: boolean = dishes.some((dish: Dish): boolean => dish.name.toLowerCase() === typed.toLowerCase());
        list.replaceChildren(...dishes
            .filter((dish: Dish): boolean => dish.name.toLowerCase().includes(typed.toLowerCase()))
            .map((dish: Dish): HTMLElement => {
                const button: HTMLButtonElement = buttonOf("", dish.name, (): void => dishPick(dish, changed));
                button.append(elementOf("span", "picker-detail",
                    `${foodsTextOf(dish.foods.map(pickOf))} · ${kcalTextOf(dish.kcal)}`));
                return button;
            }), buttonOf("picker-new", typed === "" || known ? "+ New meal" : `+ New meal „${typed}“`,
            (): void => editorShow(known ? "" : typed, changed)));
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
 * Turns the list of the meals into the form of a new meal: its name, its foods, each with its grams of one portion
 * and `×`, a hint while it holds fewer than two foods, the food search, which adds a food to it, and `Cancel`,
 * back to the list, and `Save meal`, which takes no click until it has a name and two foods. Saved, the meal goes
 * into `Meals.md`, then into this meal as one portion; when the reader does not take it, like for a name another meal
 * has, the form stays and says so.
 * - `draft`: Foods of the new meal.
 * - `name`: Field of its name.
 * - `rows`: Rows of its foods.
 * - `hint`, `error`: Hint while it holds fewer than two foods, and that the reader did not take it.
 * - `save`: The button `Save meal`.
 * - `ready`: Lets `Save meal` take clicks once the meal has a name and two foods.
 * - `draftShow`: Shows the rows of its foods.
 * - `search`: The food search of the form.
 *
 * @param typed - Name typed into the search of the meals, empty for none
 * @param changed - Tells the dialog that the meal changed
 */
function editorShow(typed: string, changed: () => void): void {
    let draft: FoodPick[] = [];
    const editor: HTMLElement = elementOf("div", "meal-editor", "");
    const name: HTMLInputElement = document.createElement("input");
    const rows: HTMLElement = elementOf("div", "meal-rows", "");
    const hint: HTMLElement = elementOf("p", "meal-editor-hint", "A meal holds two foods or more; add them below");
    const error: HTMLElement = elementOf("p", "meal-editor-hint", "Not saved: it needs a name no meal has yet");
    const buttons: HTMLElement = elementOf("div", "meal-editor-buttons", "");
    const save: HTMLButtonElement = buttonOf("meal-editor-save", "Save meal", (): void => {
        save.disabled = true;
        dishSend(name.value.trim(), draft.map((pick: FoodPick): string =>
            pick.grams === "" ? pick.name : `${pick.name};${pick.grams.replace(",", ".")}`))
            .then((sent: Dish[]): void => {
                dishes = sent;
                const dish: Dish | undefined = dishes.find((other: Dish): boolean =>
                    other.name.toLowerCase() === name.value.trim().toLowerCase());
                if (dish !== undefined)
                    dishPick(dish, changed);
            }).catch((reason: unknown): void => {
                console.error(reason);
                error.hidden = false;
                ready();
            });
    });
    const ready: () => void = (): void => {
        hint.hidden = draft.length >= 2;
        save.disabled = name.value.trim() === "" || draft.length < 2;
    };
    const draftShow: () => void = (): void => {
        rows.replaceChildren(...draft.map((pick: FoodPick): HTMLElement => {
            const row: HTMLElement = elementOf("div", "meal-row", "");
            const food: Food | undefined = mine.get(pick.name.toLowerCase());
            const kcal: HTMLElement = elementOf("span", "meal-kcal", kcalTextOf(kcalOf(pick, 1)));
            const [grams]: [HTMLElement, HTMLInputElement] = numberFieldOf(pick.grams,
                food === undefined ? "" : amountOf(food.portion, 0), "g", `Grams of ${pick.name}`, (text: string): void => {
                    pick.grams = text;
                    kcal.textContent = kcalTextOf(kcalOf(pick, 1));
                });
            const remove: HTMLButtonElement = buttonOf("", "", (): void => {
                draft = draft.filter((other: FoodPick): boolean => other !== pick);
                draftShow();
            });
            iconPut(remove, X, `Remove ${pick.name}`);
            row.append(elementOf("span", "meal-name", pick.name), grams, kcal, elementOf("span", "", ""), remove);
            return row;
        }));
        ready();
    };
    const search: HTMLElement = foodSearchOf((food: Food): void => {
        mine.set(food.name.toLowerCase(), food);
        if (!draft.some((pick: FoodPick): boolean => pick.name.toLowerCase() === food.name.toLowerCase()))
            draft.push({ name: food.name, grams: "" });
        draftShow();
        foodSearchClear(search);
    }, null);

    name.type = "text";
    name.className = "picker-search";
    name.placeholder = "Name of the meal, like Käsesalat";
    name.autocomplete = "off";
    name.value = typed;
    name.addEventListener("input", (): void => {
        error.hidden = true;
        ready();
    });
    name.addEventListener("keydown", (event: KeyboardEvent): void => {
        if (event.key === "Enter")
            event.preventDefault();
    });
    error.hidden = true;
    buttons.append(buttonOf("", "Cancel", (): void => mealsListShow(changed)), save);
    editor.append(name, rows, hint, search, error, buttons);
    mealsBox.replaceChildren(editor);
    draftShow();
    (typed === "" ? name : search.querySelector("input") ?? name).focus();
}

/**
 * Builds a row with its picker, like the meals or the foods: the rows picked, the line below them, which opens
 * the list under it, see `listOf` in `choices.ts`.
 * - `picker`: Line, rows and list.
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
 * the rows of its summary, its meals and its foods. The lines `X-FOOD` of a meal go to its meal, by the meal and
 * the portions they carry, their grams back to one portion; a meal written before my meals, named on its own,
 * like `Bortzeit`, takes all its foods as that one meal.
 * - `found`: All my foods, as the search finds them for an empty text.
 * - `mealsMine`: My meals of `Meals.md`.
 * - `times`, `one`: Portions a line carries, and its grams back to one portion.
 * - `last`: The meal the lines so far went to.
 * - `foodsBox`: The list of the foods, with the food search.
 * - `mealsRow`, `foodsRow`: The rows of the meals and of the foods.
 *
 * @param lines - Lines `X-FOOD` of the meal, like `Reis;150`; none for a new meal
 * @param title - Summary of the meal written before, like `Käsesalat, Brot`; empty for a new meal
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
    lines.map(partsOf).forEach(([name, grams, meal, portions]: [string, string, string, string]): void => {
        if (meal === "") {
            picks.push({ name: name, grams: grams });
            return;
        }
        const times: number = numberOf(portions) ?? 1;
        const one: string = numberOf(grams) === null ? "" : String(Math.round((numberOf(grams) ?? 0) / times * 10) / 10);
        let last: MealPick | undefined = meals.at(-1);
        if (last === undefined || last.name !== meal || (numberOf(last.portions) ?? 1) !== times) {
            last = { name: meal, portions: times === 1 ? "" : String(times), foods: [], open: false };
            meals.push(last);
        }
        last.foods.push({ name: name, grams: one });
    });
    if (meals.length === 0 && picks.length > 0 && title.trim() !== ""
        && title.trim().toLowerCase() !== picks.map((pick: FoodPick): string => pick.name).join(", ").toLowerCase()) {
        meals = [{ name: title.trim(), portions: "", foods: picks, open: false }];
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
 * Gives the meal as lines `X-FOOD`: first the foods of each meal with their grams for its portions, from its usual
 * portion when none are given, the meal and its portions, like `Käse;50;Käsesalat;0.5`, an unknown food without grams
 * like `Salz;Käsesalat;0.5`; then the foods beside the meals, the name, then `;` and the grams when typed,
 * like `Brot;50` or `Eier`; a decimal comma as a point.
 * - `times`: Portions of a meal.
 * - `one`: Grams of one portion of a food of a meal, `null` for an unknown food without grams.
 *
 * @returns Lines in the order of the meals and the foods picked
 */
export function mealFoods(): string[] {
    return [
        ...meals.flatMap((meal: MealPick): string[] => {
            const times: number = numberOf(meal.portions) ?? 1;
            return meal.foods.map((pick: FoodPick): string => {
                const one: number | null = numberOf(pick.grams) ?? mine.get(pick.name.toLowerCase())?.portion ?? null;
                return one === null ? `${pick.name};${meal.name};${times}`
                    : `${pick.name};${Math.round(one * times * 10) / 10};${meal.name};${times}`;
            });
        }),
        ...picks.map((pick: FoodPick): string => pick.grams === "" ? pick.name : `${pick.name};${pick.grams.replace(",", ".")}`),
    ];
}

/**
 * Gives the summary of the meal: the names of the meals, then of the foods beside them, in the order picked,
 * parted by `, `, like `Käsesalat, Brot`, as the reader names the meal eaten right after a cooking too.
 *
 * @returns Summary, empty while nothing is picked
 */
export function mealTitle(): string {
    return [...meals.map((meal: MealPick): string => meal.name), ...picks.map((pick: FoodPick): string => pick.name)]
        .join(", ");
}
