/**
 * ## Meal in the entry by category
 *
 * The foods of a meal, after the place of `Food`: one line like every field, the names of the foods picked,
 * which opens the food search as its list right under the row, see `listOf` in `choices.ts`
 * and `../food/search.ts`, which finds my foods first, then those of Open Food Facts; below the line the foods
 * picked, each a row with its name, its grams, its kcal and a button to remove it, and the kcal of the whole meal
 * below them.
 * A click on one of my foods picks it and closes the list, and so does adding a product, which goes into
 * `Foods.md` first.
 * Grams are optional: a food without them counts its usual portion, shown grey in its empty field,
 * so its kcal are an estimate, marked `≈`, and so is the sum that holds one, counted as the reader counts them.
 * Enter in a field of grams opens the list again, for the next food.
 * Picking the what of a meal without foods yet fills in the foods the dish held the last time, to change as I ate it.
 * The dialog writes each food as a line `X-FOOD`, like `Reis;150`, `Döner;~400` with grams guessed,
 * or `Eier` without grams, and names a meal with foods by them, like `Reis, Eier`, see {@link mealTitle}.
 * A meal eaten out, where nothing can be weighed, I log by photo through Claude, who writes its entry through the reader;
 * the dialog itself takes no photo.
 *
 * - `./choices.ts`: Opens the food search as a list under the line of the foods.
 * - `../food/foods.ts`: Finds my foods, writes amounts and makes elements.
 * - `../food/search.ts`: The food search.
 * - `../icons.ts`: Puts the icon of remove into the button of a row, its words as tooltip.
 * - `lucide`: The icon remove.
 */

import { listOf } from "./choices.ts";
import { amountOf, elementOf, foodsFind } from "../food/foods.ts";
import { foodSearchOf } from "../food/search.ts";
import { iconPut } from "../icons.ts";
import { X } from "lucide";

import type { Food, FoodsFound } from "../food/foods.ts";


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
 * My foods by their names in small letters, loaded when the foods were shown, with every food added since.
 */
let mine: Map<string, Food> = new Map();

/**
 * Foods picked, in the order they were picked.
 */
let picks: FoodPick[] = [];

/**
 * Place of the rows of the foods picked and of their sum.
 */
let rows: HTMLElement = document.createElement("div");

/**
 * Field of the food search, focused as its list opens.
 */
let search: HTMLInputElement | null = null;

/**
 * Line of the foods, the names of the foods picked, which opens the food search.
 */
let line: HTMLButtonElement = document.createElement("button");

/**
 * List with the food search, which the line opens under the row.
 */
let box: HTMLElement = document.createElement("div");

/**
 * Closes the list with the food search.
 */
let close: () => void = (): void => {};


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
 * Tells what a food picked gives: its grams, or its usual portion when none are typed, times its kcal per 100 g;
 * an estimate for the usual portion and for grams guessed, like `~400`.
 * - `food`: The food in `Foods.md`, `undefined` for one it does not hold.
 * - `grams`: Grams typed.
 *
 * @param pick - Food picked
 * @returns kcal and whether they are an estimate; 0 for a food not in `Foods.md` or grams that are no number
 */
function kcalOf(pick: FoodPick): [number, boolean] {
    const food: Food | undefined = mine.get(pick.name.toLowerCase());
    const grams: number | null = gramsOf(pick);
    const counted: number = grams ?? food?.portion ?? 0;
    return [Number.isFinite(counted) ? counted / 100 * (food?.kcal ?? 0) : 0, grams === null || pick.grams.startsWith("~")];
}

/**
 * Writes kcal as the page shows them, `≈` before an estimate.
 *
 * @param kcal - kcal
 * @param estimate - Whether they hold a usual portion
 * @returns Text like `≈ 617 kcal`
 */
function kcalTextOf(kcal: number, estimate: boolean): string {
    return `${estimate ? "≈ " : ""}${amountOf(kcal, 0)} kcal`;
}

/**
 * Builds the row of a food picked: its name, marked when `Foods.md` does not hold it, the field of its grams
 * with its usual portion grey while empty, its kcal, and the button that removes it.
 * The field marks itself invalid while its text is no number above 0, so the dialog does not send it.
 * - `food`: The food in `Foods.md`, `undefined` for one it does not hold.
 * - `kcal`: Cell of its kcal.
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
    const remove: HTMLButtonElement = document.createElement("button");
    const kcalShow: () => void = (): void => {
        const [value, estimate]: [number, boolean] = kcalOf(pick);
        kcal.textContent = food === undefined ? "" : kcalTextOf(value, estimate);
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
        if (box.hidden)
            line.click();
    });
    grams.append(input, " g");
    remove.type = "button";
    iconPut(remove, X, `Remove ${pick.name}`);
    remove.addEventListener("click", (): void => {
        picks = picks.filter((other: FoodPick): boolean => other !== pick);
        row.remove();
        sumShow();
        lineShow();
        changed();
    });
    row.append(name, grams, kcal, remove);
    kcalShow();
    return row;
}

/**
 * Shows the kcal of the whole meal below its foods, `≈` when one of them counts its usual portion;
 * nothing while no food is picked.
 * - `parts`: kcal of each food and whether it is an estimate.
 * - `sum`: Line of the sum, the last one of the rows, made when missing.
 */
function sumShow(): void {
    const parts: [number, boolean][] = picks.map(kcalOf);
    const sum: HTMLElement = rows.querySelector(".meal-sum") ?? elementOf("div", "meal-sum", "");
    sum.textContent = kcalTextOf(parts.reduce((total: number, [kcal]: [number, boolean]): number => total + kcal, 0),
        parts.some(([, estimate]: [number, boolean]): boolean => estimate));
    sum.hidden = picks.length === 0;
    rows.append(sum);
}

/**
 * Shows the names of the foods picked in the line of the foods, like `Haferflocken, Milch`, or grey `None`.
 */
function lineShow(): void {
    line.textContent = picks.length === 0 ? "None" : mealTitle();
    line.title = mealTitle();
    line.classList.toggle("picker-empty", picks.length === 0);
}

/**
 * Shows the rows of the foods picked, then their sum, and their names in the line.
 *
 * @param changed - Tells the dialog that the foods changed
 */
function rowsShow(changed: () => void): void {
    rows.replaceChildren(...picks.map((pick: FoodPick): HTMLElement => foodRowOf(pick, changed)));
    sumShow();
    lineShow();
}

/**
 * Picks a food from the search, unless it is picked already, closes the list and puts the cursor into the field
 * of its grams.
 *
 * @param food - Food picked or just added to `Foods.md`
 * @param changed - Tells the dialog that the foods changed
 */
function foodPick(food: Food, changed: () => void): void {
    mine.set(food.name.toLowerCase(), food);
    let index: number = picks.findIndex((pick: FoodPick): boolean =>
        pick.name.toLowerCase() === food.name.toLowerCase());
    if (index === -1) {
        index = picks.push({ name: food.name, grams: "" }) - 1;
        rowsShow(changed);
        changed();
    }
    close();
    rows.querySelectorAll<HTMLInputElement>(".meal-grams input")[index]?.focus();
}

/**
 * Builds the foods of a meal, see the top of this file, with the foods it lists already, after loading my foods:
 * the line, the foods picked, and the list with the food search, which focuses its field as it opens.
 * - `found`: All my foods, as the search finds them for an empty text.
 * - `foods`: The line, the foods picked and the list, a picker.
 * - `searchElement`: The food search.
 *
 * @param lines - Lines `X-FOOD` of the meal, like `Reis;150`; none for a new meal
 * @param changed - Tells the dialog that the foods changed
 * @returns The foods, to put into a row of the dialog
 * @throws {Error} - When the reader cannot answer
 */
export async function mealOf(lines: string[], changed: () => void): Promise<HTMLElement> {
    picks = lines.map(pickOf);
    const found: FoodsFound = await foodsFind("");
    const foods: HTMLElement = elementOf("div", "meal picker", "");
    const searchElement: HTMLElement = foodSearchOf((food: Food): void => foodPick(food, changed));
    mine = new Map(found.foods.map((food: Food): [string, Food] => [food.name.toLowerCase(), food]));
    rows = elementOf("div", "meal-rows", "");
    search = searchElement.querySelector("input");
    line = document.createElement("button");
    box = elementOf("div", "picker-box meal-box", "");
    line.className = "picker-line";
    box.append(searchElement);
    close = listOf(foods, line, box, (): void => search?.focus(), (): void => {});
    rowsShow(changed);
    foods.append(line, rows, box);
    return foods;
}

/**
 * Fills in the foods a dish held the last time it was eaten, while the meal lists none yet.
 * - `lines`: Lines `X-FOOD` of the last meal of the dish, none when none lists foods.
 *
 * @param title - Dish picked, like `Reis, Bohnen, Eier`
 * @param changed - Tells the dialog that the foods changed
 * @throws {Error} - When the reader cannot answer
 */
export async function mealDishFill(title: string, changed: () => void): Promise<void> {
    if (picks.length > 0)
        return;
    const response: Response = await fetch(`/api/food/dish?title=${encodeURIComponent(title)}`);
    if (!response.ok)
        throw new Error(`Reader answered ${response.status}`);
    const lines: string[] = await response.json() as string[];
    if (picks.length > 0 || lines.length === 0)
        return;
    picks = lines.map(pickOf);
    rowsShow(changed);
    changed();
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
 * Writes the what of the meal from the foods picked: their names in the order picked, parted by `, `,
 * like `Haferflocken, Milch`, as the reader names the meal eaten right after a cooking too.
 *
 * @returns What of the meal, empty while no food is picked
 */
export function mealTitle(): string {
    return picks.map((pick: FoodPick): string => pick.name).join(", ");
}
