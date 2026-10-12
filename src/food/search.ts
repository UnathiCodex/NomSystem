/**
 * ## Food search
 *
 * The one search for foods, for the food view and the foods of a meal in the entry by category of the day:
 * a field where a few letters or a barcode find my foods first, the most eaten first,
 * and below them the products of Open Food Facts. It searches once the typing pauses, so a word asks only once;
 * an empty field lists all my foods. Each food shows kcal, protein, carbs and fat per 100 g and its usual portion.
 * A click on a product opens a short form below it to add it to my foods, with a name of my own and its portion,
 * both prefilled; `+ New food` at the end opens one to add a food by hand, with its values per 100 g.
 * Where a food is wanted, like in a meal, a click on one of my foods picks it, and so does adding one,
 * so a meal lists only foods of `Foods.md`. Nothing in the search is a form or sends one,
 * so it can stand inside the form of a dialog.
 *
 * - `./foods.ts`: Finds foods, sends new ones, writes amounts and makes elements.
 * - `../icons.ts`: Puts icons into the buttons, their words as tooltip.
 * - `lucide`: The icons add, cancel and new.
 * - `./search.css`: Look of the search, the same wherever it stands.
 */

import { amountOf, elementOf, foodSend, foodsFind } from "./foods.ts";
import { iconPut, iconWordsOf } from "../icons.ts";
import { Check, Plus, X } from "lucide";
import "./search.css";

import type { Food, FoodsFound, Product } from "./foods.ts";


/**
 * Takes a food picked or added, like into a meal; `null` where no food is wanted, like in the food view.
 */
type Pick = ((food: Food) => void) | null;

/**
 * Milliseconds the typing has to pause before the field searches, so a word asks Open Food Facts once, not per letter.
 */
const pause: number = 300;

/**
 * Fields of the form to add a food: the name shown and the value of the food it fills.
 * A product of Open Food Facts brings its values, so its form asks only for name and portion.
 */
const fields: [string, keyof Food][] = [
    ["Name", "name"], ["kcal", "kcal"], ["Protein", "protein"], ["Carbs", "carbs"], ["Fat", "fat"], ["Portion g", "portion"],
];


/**
 * Makes a button that does not send a form, also inside one.
 *
 * @param className - Class, empty for none
 * @param text - Text of the button
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
 * Builds the cells of the row of a food: its name, for a product with its brand after it,
 * then its values per 100 g and its portion, the numbers in columns;
 * protein, carbs and fat with the class `food-macro`, so a narrow place, like a meal, can leave them out.
 * - `name`: Name, with the brand of a product; cut with an ellipsis when too long, whole when pointed at.
 *
 * @param food - Food or product
 * @param brand - Brand of a product, empty for none
 * @returns Cells
 */
function cellsOf(food: Food, brand: string): HTMLElement[] {
    const name: HTMLElement = elementOf("span", "food-name", food.name);
    if (brand !== "")
        name.append(elementOf("span", "food-brand", ` · ${brand}`));
    name.title = name.textContent ?? "";
    return [
        name,
        elementOf("span", "food-value", amountOf(food.kcal, 0)),
        elementOf("span", "food-value food-macro", amountOf(food.protein, 1)),
        elementOf("span", "food-value food-macro", amountOf(food.carbs, 1)),
        elementOf("span", "food-value food-macro", amountOf(food.fat, 1)),
        elementOf("span", "food-value", `${amountOf(food.portion, 0)} g`),
    ];
}

/**
 * Builds the head of the columns, small and grey: what the values of a row are, see {@link cellsOf}.
 * - `classes`: Class of each column.
 *
 * @returns Row of the head
 */
function headOf(): HTMLElement {
    const head: HTMLElement = elementOf("div", "food-row food-columns", "");
    const classes: string[] = ["food-name", "food-value", "food-value food-macro", "food-value food-macro",
        "food-value food-macro", "food-value"];
    head.append(...["Per 100 g", "kcal", "Protein", "Carbs", "Fat", "Portion"].map((name: string, index: number): HTMLElement =>
        elementOf("span", classes[index], name)));
    return head;
}

/**
 * Reads a number as typed, a decimal comma counting as a point.
 *
 * @param text - Number as typed, like `7,4`
 * @returns Number, 0 for an empty text, not a number for an unreadable one, which the reader refuses
 */
function numberRead(text: string): number {
    return Number(text.replace(",", "."));
}

/**
 * Opens the form to add a food below a row or below `+ New food`, in place of any form open before:
 * name and portion prefilled from the food given, for a food by hand also its values per 100 g, empty where 0.
 * Add, its check, or Enter in a field, sends the food; Cancel, its cross, or Escape in a field, closes the form.
 * When the reader does not take the food, like for a name another food has, the form stays open and says so.
 * - `form`: The form, after the element.
 * - `inputs`: Text field of each value the form asks for.
 * - `error`: Hint that the reader did not take the food.
 * - `value`: Value as its field says, or as the food gives it when the form does not ask for it.
 * - `add`: Sends the food, the form taking no clicks meanwhile, so a double click adds it once.
 * - `save`, `cancel`: Buttons Add and Cancel.
 *
 * @param after - Row of the product, or the button `+ New food`
 * @param food - Food whose values fill the form
 * @param byHand - Whether the food is typed by hand, so the form asks for its values too
 * @param added - Takes the food once the reader wrote it
 */
function formShow(after: HTMLElement, food: Food, byHand: boolean, added: (food: Food) => void): void {
    after.parentElement?.querySelector(".food-form")?.remove();
    const form: HTMLElement = elementOf("div", "food-form", "");
    const inputs: Map<keyof Food, HTMLInputElement> = new Map();
    const error: HTMLElement = elementOf("p", "food-error", "Not saved: it needs a new name, numbers, and a portion above 0");
    const value: (key: keyof Food) => string = (key: keyof Food): string =>
        inputs.get(key)?.value.trim() ?? String(food[key]);
    const add: () => void = (): void => {
        form.inert = true;
        foodSend({
            name: value("name"), kcal: numberRead(value("kcal")), protein: numberRead(value("protein")),
            carbs: numberRead(value("carbs")), fat: numberRead(value("fat")), portion: numberRead(value("portion")),
            barcode: food.barcode,
        }).then(added).catch((reason: unknown): void => {
            console.error(reason);
            error.hidden = false;
            form.inert = false;
        });
    };

    fields
        .filter(([, key]: [string, keyof Food]): boolean => byHand || key === "name" || key === "portion")
        .forEach(([name, key]: [string, keyof Food]): void => {
            const label: HTMLElement = elementOf("label", key === "name" ? "food-field food-field-name" : "food-field", name);
            const input: HTMLInputElement = document.createElement("input");
            input.type = "text";
            input.autocomplete = "off";
            input.inputMode = key === "name" ? "text" : "decimal";
            input.value = key === "name" || food[key] !== 0 ? String(food[key]) : "";
            input.addEventListener("keydown", (event: KeyboardEvent): void => {
                if (event.key === "Enter") {
                    event.preventDefault();
                    add();
                } else if (event.key === "Escape") {
                    event.preventDefault();
                    form.remove();
                }
            });
            inputs.set(key, input);
            label.append(input);
            form.append(label);
        });
    const save: HTMLButtonElement = buttonOf("food-add", "", add);
    const cancel: HTMLButtonElement = buttonOf("", "", (): void => form.remove());
    iconPut(save, Check, "Add");
    iconPut(cancel, X, "Cancel");
    error.hidden = true;
    form.append(save, cancel, error);
    after.after(form);
    inputs.get("name")?.focus();
}

/**
 * Shows what a search found: the head of the columns, my foods, then, for a search of some letters,
 * the products of Open Food Facts, and `+ New food` at the end.
 * Where `pick` takes foods, a click on one of mine picks it; a click on a product opens the form to add it.
 * A food once added is searched for by its name, so it shows among my foods, and picked.
 * - `query`: The search as typed.
 * - `added`: Takes a food once the reader wrote it.
 * - `rows`: Rows of the results, with the names of the groups and the hints.
 *
 * @param input - Field of the search
 * @param results - Place of the results below the field
 * @param found - What the search found
 * @param pick - Takes a food picked or added, `null` where no food is wanted
 */
function resultsShow(input: HTMLInputElement, results: HTMLElement, found: FoodsFound, pick: Pick): void {
    const query: string = input.value.trim();
    const added: (food: Food) => void = (food: Food): void => {
        input.value = food.name;
        resultsLoad(input, results, pick);
        pick?.(food);
    };
    const rows: HTMLElement[] = [headOf(), elementOf("p", "food-group", "My foods")];

    if (found.foods.length === 0)
        rows.push(elementOf("p", "food-none", query === "" ? "No foods yet" : "None of my foods matches"));
    rows.push(...found.foods.map((food: Food): HTMLElement => {
        const row: HTMLElement = pick === null
            ? elementOf("div", "food-row", "")
            : buttonOf("food-row", "", (): void => pick(food));
        row.append(...cellsOf(food, ""));
        return row;
    }));

    if (query !== "") {
        rows.push(elementOf("p", "food-group", "Open Food Facts"));
        if (found.products === null)
            rows.push(elementOf("p", "food-none", "Open Food Facts cannot be reached"));
        else if (found.products.length === 0)
            rows.push(elementOf("p", "food-none", "No products: type more letters, or a barcode"));
        rows.push(...(found.products ?? []).map((product: Product): HTMLElement => {
            const row: HTMLButtonElement = buttonOf("food-row", "", (): void => formShow(row, product, false, added));
            row.append(...cellsOf(product, product.brand));
            return row;
        }));
    }

    const newFood: HTMLButtonElement = buttonOf("food-new", "", (): void => formShow(newFood,
        { name: query, kcal: 0, protein: 0, carbs: 0, fat: 0, portion: 100, barcode: "" }, true, added));
    newFood.append(...iconWordsOf(Plus, "New food"));
    rows.push(newFood);
    results.replaceChildren(...rows);
}

/**
 * Searches for the text of the field and shows what it finds, unless the text changed meanwhile,
 * so a late answer never covers a newer one.
 * - `query`: The search as typed when it started.
 *
 * @param input - Field of the search
 * @param results - Place of the results below the field
 * @param pick - Takes a food picked or added, `null` where no food is wanted
 */
function resultsLoad(input: HTMLInputElement, results: HTMLElement, pick: Pick): void {
    const query: string = input.value.trim();
    foodsFind(query).then((found: FoodsFound): void => {
        if (input.value.trim() === query)
            resultsShow(input, results, found, pick);
    }).catch((error: unknown): void => {
        console.error(error);
        results.replaceChildren(elementOf("p", "food-none", "The foods cannot be read"));
    });
}

/**
 * Builds the food search, see the top of this file, showing all my foods at first.
 * Typing searches once it pauses for {@link pause}; Enter searches at once, without sending a form around it.
 * - `search`: Field and results.
 * - `waiting`: Timer of the search waiting for the pause, 0 for none.
 *
 * @param pick - Takes a food picked or added, like into a meal; `null` where no food is wanted, like in the food view
 * @returns The search, to put into the page
 */
export function foodSearchOf(pick: Pick): HTMLElement {
    const search: HTMLElement = elementOf("div", "food-search", "");
    const input: HTMLInputElement = document.createElement("input");
    const results: HTMLElement = elementOf("div", "food-results", "");
    let waiting: number = 0;

    input.type = "search";
    input.placeholder = "Search foods, or type a barcode";
    input.autocomplete = "off";
    input.addEventListener("input", (): void => {
        clearTimeout(waiting);
        waiting = window.setTimeout((): void => resultsLoad(input, results, pick), pause);
    });
    input.addEventListener("keydown", (event: KeyboardEvent): void => {
        if (event.key !== "Enter")
            return;
        event.preventDefault();
        clearTimeout(waiting);
        resultsLoad(input, results, pick);
    });
    search.append(input, results);
    resultsLoad(input, results, pick);
    return search;
}
