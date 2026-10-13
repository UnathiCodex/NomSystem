/**
 * ## Meal in the entry by category
 *
 * The what of a meal, the first field of `Food` in the log: one line like every field, the name of the meal,
 * which opens its list on top, see `popOf` in `choices.ts`: the food search, see `../food/search.ts`,
 * which finds my foods first, then those of Open Food Facts, and above them the meals I ate before that match
 * what is typed, the most eaten first, each way I ate them, its foods below a name of its own,
 * like `Brotzeit` over `Brot, Käse, Salat`. Each time the list opens, its search starts empty.
 * A click on a meal eaten before takes all its foods with their grams of the last time, and its name when it has
 * one of its own; a click on one of my foods takes that food, and so does adding a product, which goes into
 * `Foods.md` first. Foods taken stay, so a meal eaten before and a food more go together, like `Salat` and `Brot`.
 * Below the line the foods picked, each a row with its name, its grams, its kcal, `⇄`, which opens the list
 * to replace it in its place by another food, like `Käse` by `Aufstrich` for a meal a bit different this time,
 * and `×`, which removes it; the kcal of the whole meal below them. From six foods on, like a salad,
 * they fold into one line naming them, like `6 foods: Gurke, Tomate, …`, with their kcal, which a click unfolds.
 * Below the foods the field of the name: empty, the meal is named by its foods, like `Brot, Gouda, Butter`;
 * a name typed, like `Salat`, is its name of its own, shown in the line as it is typed, and offered again
 * under that name next time; `×` drops it, and so does removing the last food.
 * Grams are optional: a food without them counts its usual portion, shown grey in its empty field,
 * counted as the reader counts them; every amount is rounded and an estimate anyway, so none is marked as one.
 * Enter in a field of grams opens the list again, for the next food.
 * The dialog writes each food as a line `X-FOOD`, like `Reis;150`, `Döner;~400` with grams guessed,
 * or `Eier` without grams, and the name of the meal as its what, see {@link mealTitle}.
 * A meal eaten out, where nothing can be weighed, I log by photo through Claude, who writes its entry through the reader;
 * the dialog itself takes no photo.
 *
 * - `./choices.ts`: Opens the list of the what on top of the dialog.
 * - `../food/foods.ts`: Finds my foods, loads the meals eaten before, writes amounts and makes elements.
 * - `../food/search.ts`: The food search, with the meals eaten before above my foods.
 * - `../icons.ts`: Puts the icons into the buttons, their words as tooltip.
 * - `lucide`: The icons remove, replace, name, fold and unfold.
 */

import { popOf } from "./choices.ts";
import { amountOf, dishesLoad, elementOf, foodsFind } from "../food/foods.ts";
import { foodSearchClear, foodSearchOf } from "../food/search.ts";
import { iconOf, iconPut } from "../icons.ts";
import { ArrowLeftRight, ChevronDown, ChevronRight, Tag, X } from "lucide";

import type { Dish, Food, FoodsFound } from "../food/foods.ts";


/**
 * A food picked for the meal.
 *
 * - `name`: Name of the food in `Foods.md`.
 * - `grams`: Grams as typed, like `150` or `7,5`; empty for its usual portion.
 */
type FoodPick = {
    name: string;
    grams: string;
};

/**
 * Category of meals, the one whose entries list foods.
 */
export const foodName: string = "Food";

/**
 * Most meals eaten before the list shows while nothing is typed; once something is typed, all that match.
 */
const dishesFirst: number = 5;

/**
 * Number of foods from which they fold into one line, like those of a salad.
 */
const foldFrom: number = 6;

/**
 * My foods by their names in small letters, loaded when the meal was built, with every food added since.
 */
let mine: Map<string, Food> = new Map();

/**
 * The meals I ate before, the most eaten first, loaded when the meal was built.
 */
let dishes: Dish[] = [];

/**
 * Foods picked, in the order they were picked.
 */
let picks: FoodPick[] = [];

/**
 * Name of its own of the meal, like `Salat`; empty while it is named by its foods.
 */
let named: string = "";

/**
 * Whether the foods, folded from {@link foldFrom} on, show unfolded.
 */
let unfolded: boolean = false;

/**
 * Food whose `⇄` opened the list, to be replaced by the food picked; `null` while the list adds foods.
 */
let replacing: FoodPick | null = null;

/**
 * Place of the rows of the foods picked and of their sum, or of their folded line.
 */
let rows: HTMLElement = document.createElement("div");

/**
 * Field of the name of its own, below the foods, with its icon and `×`.
 */
let nameField: HTMLElement = document.createElement("label");

/**
 * The text field in {@link nameField}.
 */
let nameInput: HTMLInputElement = document.createElement("input");

/**
 * The food search in the list, emptied as the list opens.
 */
let searchElement: HTMLElement = document.createElement("div");

/**
 * Line of the what, the name of the meal, which opens its list.
 */
let line: HTMLButtonElement = document.createElement("button");

/**
 * List on top with the meals eaten before and the food search, which the line opens.
 */
let pop: HTMLElement = document.createElement("div");


/**
 * Turns a line `X-FOOD` into a food picked: its name, then the grams after `;`, when there are any.
 *
 * @param line - Line like `Reis;150` or `Eier`
 * @returns Food picked
 */
function pickOf(line: string): FoodPick {
    const [name, grams]: string[] = line.split(";");
    return { name: name.trim(), grams: (grams ?? "").trim() };
}

/**
 * Reads the grams of a food picked, a decimal comma counting as a point and a `~` before them,
 * which marks grams guessed, not weighed, like `~400` from a photo, left out.
 *
 * @param pick - Food picked
 * @returns Grams, `null` for none typed, not a number for a text that is none
 */
function gramsOf(pick: FoodPick): number | null {
    return pick.grams === "" ? null : Number(pick.grams.replace(/^~\s*/, "").replace(",", "."));
}

/**
 * Tells what a food picked gives: its grams, or its usual portion when none are typed, times its kcal per 100 g.
 * - `food`: The food in `Foods.md`, `undefined` for one it does not hold.
 * - `grams`: Grams typed.
 * - `counted`: Grams counted.
 *
 * @param pick - Food picked
 * @returns kcal; 0 for a food not in `Foods.md` or grams that are no number
 */
function kcalOf(pick: FoodPick): number {
    const food: Food | undefined = mine.get(pick.name.toLowerCase());
    const grams: number | null = gramsOf(pick);
    const counted: number = grams ?? food?.portion ?? 0;
    return Number.isFinite(counted) ? counted / 100 * (food?.kcal ?? 0) : 0;
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
 * Names foods by their names in their order, parted by `, `, as a meal without a name of its own is named.
 *
 * @param foods - Foods picked
 * @returns Name like `Haferflocken, Milch`, empty for none
 */
function foodsTitleOf(foods: FoodPick[]): string {
    return foods.map((pick: FoodPick): string => pick.name).join(", ");
}

/**
 * Makes a button that does not send the form of the dialog around it.
 *
 * @param className - Class, empty for none
 * @param click - What a click does
 * @returns Button
 */
function buttonOf(className: string, click: () => void): HTMLButtonElement {
    const button: HTMLButtonElement = document.createElement("button");
    button.type = "button";
    button.className = className;
    button.addEventListener("click", click);
    return button;
}

/**
 * Builds the row of a food picked: its name, marked when `Foods.md` does not hold it, the field of its grams
 * with its usual portion grey while empty, its kcal, `⇄`, which opens the list to replace it, and `×`,
 * which removes it and drops the name of its own with the last food.
 * The field marks itself invalid while its text is no number above 0, so the dialog does not send it.
 * - `food`: The food in `Foods.md`, `undefined` for one it does not hold.
 * - `kcal`: Cell of its kcal.
 * - `replace`, `remove`: Its buttons `⇄` and `×`.
 * - `kcalShow`: Writes its kcal, again as the grams change.
 *
 * @param pick - Food picked, changed as its grams are typed
 * @param changed - Tells the dialog that the foods changed
 * @returns Row
 */
function foodRowOf(pick: FoodPick, changed: () => void): HTMLElement {
    const row: HTMLElement = elementOf("div", "meal-row", "");
    const food: Food | undefined = mine.get(pick.name.toLowerCase());
    const name: HTMLElement = elementOf("span", "meal-name", pick.name);
    const grams: HTMLElement = elementOf("label", "meal-grams", "");
    const input: HTMLInputElement = document.createElement("input");
    const kcal: HTMLElement = elementOf("span", "meal-kcal", "");
    const replace: HTMLButtonElement = buttonOf("", (): void => {
        replacing = pick;
        pop.showPopover();
    });
    const remove: HTMLButtonElement = buttonOf("", (): void => {
        picks = picks.filter((other: FoodPick): boolean => other !== pick);
        if (picks.length === 0)
            named = "";
        rowsShow(changed);
        changed();
    });
    const kcalShow: () => void = (): void => {
        kcal.textContent = food === undefined ? "" : kcalTextOf(kcalOf(pick));
    };

    if (food === undefined)
        name.append(elementOf("span", "meal-unknown", " · not in my foods"));
    name.title = pick.name;
    input.type = "text";
    input.inputMode = "decimal";
    input.autocomplete = "off";
    input.value = pick.grams;
    input.placeholder = food === undefined ? "" : amountOf(food.portion, 0);
    input.setAttribute("aria-label", `Grams of ${pick.name}`);
    input.addEventListener("input", (): void => {
        pick.grams = input.value.trim();
        const value: number | null = gramsOf(pick);
        input.setCustomValidity(value === null || value > 0 ? "" : "Grams like 150, or empty for the usual portion");
        kcalShow();
        sumShow();
        changed();
    });
    input.addEventListener("keydown", (event: KeyboardEvent): void => {
        if (event.key !== "Enter")
            return;
        event.preventDefault();
        if (!pop.matches(":popover-open"))
            pop.showPopover();
    });
    grams.append(input, " g");
    iconPut(replace, ArrowLeftRight, `Replace ${pick.name}`);
    iconPut(remove, X, `Remove ${pick.name}`);
    row.append(name, grams, kcal, replace, remove);
    kcalShow();
    return row;
}

/**
 * Builds the folded line of {@link foldFrom} foods or more: its chevron, how many foods and their names,
 * like `6 foods: Gurke, Tomate, …`, cut where the line ends, and their kcal at the right; a click unfolds or folds them.
 * - `fold`: The line, a button.
 * - `count`: Chevron, how many foods and their names.
 *
 * @param changed - Tells the dialog that the foods changed
 * @returns The line
 */
function foldOf(changed: () => void): HTMLElement {
    const fold: HTMLButtonElement = buttonOf("meal-fold", (): void => {
        unfolded = !unfolded;
        rowsShow(changed);
    });
    const count: HTMLElement = elementOf("span", "meal-fold-count", "");
    count.append(iconOf(unfolded ? ChevronDown : ChevronRight),
        elementOf("span", "meal-fold-names", `${picks.length} foods: ${foodsTitleOf(picks)}`));
    fold.setAttribute("aria-expanded", String(unfolded));
    fold.append(count, elementOf("span", "meal-sum-kcal", ""));
    return fold;
}

/**
 * Writes the kcal of the whole meal, in the line of the sum below its foods or in their folded line.
 * - `total`: kcal of the meal.
 */
function sumShow(): void {
    const total: string = kcalTextOf(picks.reduce((sum: number, pick: FoodPick): number => sum + kcalOf(pick), 0));
    rows.querySelectorAll(".meal-sum-kcal").forEach((sum: Element): void => {
        sum.textContent = total;
    });
}

/**
 * Shows the name of the meal in the line of the what: its name of its own, else its foods, like
 * `Haferflocken, Milch`, or a grey dash while it has none.
 */
function lineShow(): void {
    line.textContent = mealTitle() === "" ? "—" : mealTitle();
    line.title = mealTitle();
    line.classList.toggle("picker-empty", mealTitle() === "");
}

/**
 * Shows the field of the name while foods are picked, with the name of its own, unless it is being typed,
 * and `×` only while there is a name to drop.
 */
function nameShow(): void {
    nameField.hidden = picks.length === 0;
    if (document.activeElement !== nameInput)
        nameInput.value = named;
    nameField.querySelector("button")?.toggleAttribute("hidden", named === "");
}

/**
 * Shows the foods picked below the line: a row per food and their sum below them, or from {@link foldFrom} foods on
 * their folded line, the rows below it while unfolded; then the name in the line and in its field.
 * - `folding`: Whether the foods fold.
 * - `shown`: Lines below the line of the what.
 *
 * @param changed - Tells the dialog that the foods changed
 */
function rowsShow(changed: () => void): void {
    const folding: boolean = picks.length >= foldFrom;
    const shown: HTMLElement[] = [];
    if (folding)
        shown.push(foldOf(changed));
    if (!folding || unfolded)
        shown.push(...picks.map((pick: FoodPick): HTMLElement => foodRowOf(pick, changed)));
    if (!folding && picks.length > 0)
        shown.push(elementOf("div", "meal-sum meal-sum-kcal", ""));
    rows.replaceChildren(...shown);
    sumShow();
    lineShow();
    nameShow();
}

/**
 * Picks a food from the search: in place of the food being replaced, see {@link replacing}, which simply goes
 * when the food is picked already; else as one more food, unless it is picked already. Then unfolds the foods,
 * closes the list and puts the cursor into the field of its grams.
 * - `index`: Place of the food among the foods picked.
 * - `at`: Place of the food being replaced, -1 for none.
 *
 * @param food - Food picked or just added to `Foods.md`
 * @param changed - Tells the dialog that the foods changed
 */
function foodPick(food: Food, changed: () => void): void {
    mine.set(food.name.toLowerCase(), food);
    let index: number = picks.findIndex((pick: FoodPick): boolean =>
        pick.name.toLowerCase() === food.name.toLowerCase());
    const at: number = replacing === null ? -1 : picks.indexOf(replacing);
    if (at !== -1 && index === -1) {
        picks[at] = { name: food.name, grams: "" };
        index = at;
    } else if (at !== -1 && index !== at) {
        picks.splice(at, 1);
        index = picks.findIndex((pick: FoodPick): boolean => pick.name.toLowerCase() === food.name.toLowerCase());
    } else if (index === -1)
        index = picks.push({ name: food.name, grams: "" }) - 1;
    replacing = null;
    unfolded = true;
    rowsShow(changed);
    changed();
    if (pop.matches(":popover-open"))
        pop.hidePopover();
    rows.querySelectorAll<HTMLInputElement>(".meal-grams input")[index]?.focus();
}

/**
 * Picks a meal eaten before: adds each of its foods not picked yet, with its grams of the last time,
 * and takes its name when it has one of its own and the meal has none yet; then closes the list.
 * - `foods`: Its foods as picks.
 *
 * @param dish - Meal eaten before
 * @param changed - Tells the dialog that the foods changed
 */
function dishPick(dish: Dish, changed: () => void): void {
    const foods: FoodPick[] = dish.foods.map(pickOf);
    foods
        .filter((food: FoodPick): boolean =>
            !picks.some((pick: FoodPick): boolean => pick.name.toLowerCase() === food.name.toLowerCase()))
        .forEach((food: FoodPick): void => {
            picks.push(food);
        });
    if (named === "" && dish.title.toLowerCase() !== foodsTitleOf(foods).toLowerCase())
        named = dish.title;
    unfolded = false;
    rowsShow(changed);
    changed();
    pop.hidePopover();
}

/**
 * Builds the rows of the list above my foods for what is typed: while a food is being replaced only which one,
 * like `Replace Käse`; else the meals eaten before whose name holds it, ignoring case,
 * the first {@link dishesFirst} while nothing is typed, each with its foods below a name of its own,
 * how often I ate it so and the kcal of the last time.
 * - `typed`: What is typed, without spaces at its ends, in small letters.
 * - `found`: The meals eaten before that match.
 * - `choiceOf`: Makes the row of a meal eaten before.
 *
 * @param query - The search as typed
 * @param changed - Tells the dialog that the foods changed
 * @returns Rows, none when nothing matches
 */
function beforeOf(query: string, changed: () => void): HTMLElement[] {
    if (replacing !== null)
        return [elementOf("p", "food-group meal-replace", `Replace ${replacing.name}`)];

    const typed: string = query.trim().toLowerCase();
    const found: Dish[] = dishes.filter((dish: Dish): boolean => dish.title.toLowerCase().includes(typed))
        .slice(0, typed === "" ? dishesFirst : undefined);
    const choiceOf: (dish: Dish) => HTMLElement = (dish: Dish): HTMLElement => {
        const choice: HTMLButtonElement = buttonOf("food-row meal-choice", (): void => dishPick(dish, changed));
        const name: HTMLElement = elementOf("span", "food-name", dish.title);
        const foods: string = foodsTitleOf(dish.foods.map(pickOf));
        if (foods.toLowerCase() !== dish.title.toLowerCase())
            name.append(elementOf("span", "meal-choice-foods", foods));
        choice.append(name, elementOf("span", "meal-choice-more", `${dish.meals}× · ${kcalTextOf(dish.kcal)}`));
        return choice;
    };
    return found.length === 0 ? [] : [elementOf("p", "food-group", "Eaten before"), ...found.map(choiceOf)];
}

/**
 * Builds the field of the name of its own, see the top of this file: its icon, the text field, which names
 * the meal as it is typed, Enter leaving it, and `×`, which drops the name.
 * - `clear`: The button `×`.
 * - `take`: Takes the name typed.
 *
 * @param changed - Tells the dialog that the foods changed
 * @returns The field
 */
function nameFieldOf(changed: () => void): HTMLElement {
    const field: HTMLElement = elementOf("label", "meal-label", "");
    const clear: HTMLButtonElement = buttonOf("", (): void => {
        nameInput.value = "";
        take();
    });
    const take: () => void = (): void => {
        named = nameInput.value.replace(/\s+/g, " ").trim();
        lineShow();
        clear.hidden = named === "";
        changed();
    };
    nameInput = document.createElement("input");
    nameInput.type = "text";
    nameInput.autocomplete = "off";
    nameInput.placeholder = "Name this meal, like Salat";
    nameInput.setAttribute("aria-label", "Name of the meal");
    nameInput.addEventListener("input", take);
    nameInput.addEventListener("keydown", (event: KeyboardEvent): void => {
        if (event.key !== "Enter")
            return;
        event.preventDefault();
        nameInput.blur();
    });
    iconPut(clear, X, "Drop the name");
    field.append(iconOf(Tag), nameInput, clear);
    return field;
}

/**
 * Builds the what of a meal, see the top of this file, with the foods and the name it has already,
 * after loading my foods and the meals eaten before: the line, its list on top with the food search, which starts
 * empty and focuses its field as the list opens, below the line the foods picked, then the field of the name.
 * A meal written before keeps its what as name of its own when it is not just its foods.
 * - `found`: All my foods, as the search finds them for an empty text.
 * - `eaten`: The meals eaten before.
 * - `meal`: The line, its list, the foods picked and the field of the name.
 *
 * @param lines - Lines `X-FOOD` of the meal, like `Reis;150`; none for a new meal
 * @param title - What of the meal written before, like `Salat`; empty for a new meal
 * @param changed - Tells the dialog that the foods changed
 * @returns The what of the meal, to put into the row of the what of the dialog
 * @throws {Error} - When the reader cannot answer
 */
export async function mealOf(lines: string[], title: string, changed: () => void): Promise<HTMLElement> {
    const [found, eaten]: [FoodsFound, Dish[]] = await Promise.all([foodsFind("", "", 1), dishesLoad()]);
    const meal: HTMLElement = elementOf("div", "meal", "");
    picks = lines.map(pickOf);
    named = picks.length > 0 && title.trim().toLowerCase() !== foodsTitleOf(picks).toLowerCase() ? title.trim() : "";
    unfolded = false;
    replacing = null;
    dishes = eaten;
    mine = new Map(found.foods.map((food: Food): [string, Food] => [food.name.toLowerCase(), food]));
    searchElement = foodSearchOf((food: Food): void => foodPick(food, changed),
        (query: string): HTMLElement[] => beforeOf(query, changed));
    rows = elementOf("div", "meal-rows", "");
    nameField = nameFieldOf(changed);
    line = document.createElement("button");
    pop = elementOf("div", "picker-pop meal-pop", "");
    line.className = "picker-line";
    pop.append(searchElement);
    popOf(line, pop, (): void => {
        foodSearchClear(searchElement);
        searchElement.querySelector("input")?.focus();
    }, (): void => {
        replacing = null;
    });
    rowsShow(changed);
    meal.append(line, pop, rows, nameField);
    return meal;
}

/**
 * Gives the foods picked as lines `X-FOOD`: the name, then `;` and the grams when typed, a decimal comma as a point.
 *
 * @returns Lines like `Reis;150` or `Eier`, in the order picked
 */
export function mealFoods(): string[] {
    return picks.map((pick: FoodPick): string =>
        pick.grams === "" ? pick.name : `${pick.name};${pick.grams.replace(",", ".")}`);
}

/**
 * Gives the what of the meal: its name of its own, like `Salat`, else the names of its foods in the order picked,
 * parted by `, `, like `Haferflocken, Milch`, as the reader names the meal eaten right after a cooking too.
 *
 * @returns What of the meal, empty while no food is picked
 */
export function mealTitle(): string {
    return named !== "" ? named : foodsTitleOf(picks);
}
