/**
 * ## Food search
 *
 * The one search for foods, for the food view and the foods of a meal in the entry by category of the day:
 * a field where a few letters or a barcode find my foods first, the most eaten first, and below them, where asked,
 * the products of Open Food Facts, a page of them at a time, `More` loading the next page, beside it how many it shows
 * of how many the search matches, like `8 of 54`; in an entry my meals above my foods, see {@link SearchSetup}.
 * It searches once the typing pauses, so a word asks only once; an empty field lists all my foods. That nothing
 * is found it says in one grey line, only for the text as it stands, once its answer is in, never for a text typed
 * before, like a barcode typed digit by digit, whose first digits find nothing.
 * I search the food alone, like `räucherlachs`: Open Food Facts searches the names of its products, and a word of
 * a brand or a shop only ranks them, it filters nothing, so the brand and store of a product stand beside its name.
 * Every list of meals or foods looks alike, wherever it stands: a small grey head, `Per meal` or `Per 100 g` and
 * `kcal`, then one flat line per meal or food, its name, a food's brand and store in brackets after it, like
 * `Gouda (Milbona, Lidl)`, so the same name of two shops never mixes up, and its kcal as a bare number, the head
 * naming the unit once, see {@link listHeadOf} and {@link listLineOf}; a product also its pack small and grey below
 * its name, like `Pack 450 g`, which tells products apart.
 * A click on a product adds it to my foods as Open Food Facts gives it, no form in between, see `foodSend`
 * in `foods.ts`, and takes it like one of mine. Where a food is wanted, like in an entry, a click on one of my foods
 * picks it. A food found nowhere goes in by hand only in the food view, by the plus beside the name `Foods`,
 * see {@link foodNewShow}.
 * Nothing in the search is a form or sends one, so it can stand inside the form of a dialog.
 *
 * - `./foods.ts`: Finds foods, sends new foods, writes amounts and makes elements and buttons.
 * - `../icons.ts`: Puts icons into the buttons, their words as tooltip.
 * - `lucide`: The icons save and cancel.
 * - `./search.css`: Look of the search and of every list of meals or foods, the same wherever they stand.
 */

import { amountOf, bracketsWatch, buttonOf, elementOf, foodNameOf, foodSend, foodsFind } from "./foods.ts";
import { iconPut } from "../icons.ts";
import { Check, X } from "lucide";
import "./search.css";

import type { Food, FoodsFound } from "./foods.ts";


/**
 * What a search does, where it stands.
 *
 * - `pick`: Takes a food picked or added, like into an entry; `null` where no food is wanted, like in the food view.
 * - `before`: Builds the lines to show above my foods for the search as typed, like my meals in an entry with their
 *   head; `null` for none.
 * - `products`: Whether it finds products of Open Food Facts too; not for a meal of the food view, which takes only
 *   my foods.
 * - `nothing`: The one grey line when a search of some letters finds nothing, like where a food by hand goes in.
 */
export type SearchSetup = {
    pick: ((food: Food) => void) | null;
    before: ((query: string) => HTMLElement[]) | null;
    products: boolean;
    nothing: string;
};

/**
 * One search on the page, with what it shows.
 *
 * - `input`: Field of the search.
 * - `results`: Place of the results, below the field.
 * - `setup`: What it does, see {@link SearchSetup}.
 * - `page`: Last page of products shown, 1 for the first.
 * - `found`: What the search found, with the products of every page shown; `null` before its first answer.
 * - `asked`: Number of the last search asked, so a late answer never covers a newer one.
 */
type Search = {
    input: HTMLInputElement;
    results: HTMLElement;
    setup: SearchSetup;
    page: number;
    found: FoodsFound | null;
    asked: number;
};

/**
 * Milliseconds the typing has to pause before the field searches, so a word asks Open Food Facts once, not per letter.
 */
const pause: number = 300;

/**
 * Fields of the form of a food by hand: the name shown and the value of the food it fills.
 */
const fields: [string, "name" | "brand" | "store" | "kcal" | "protein" | "carbs" | "fat"][] = [
    ["Name", "name"], ["Brand", "brand"], ["Store", "store"], ["kcal", "kcal"], ["Protein", "protein"], ["Carbs", "carbs"],
    ["Fat", "fat"],
];

/**
 * Each search by its element on the page, so {@link foodSearchClear} and {@link foodNewShow} find it.
 */
const searches: WeakMap<HTMLElement, Search> = new WeakMap();


/**
 * Makes the head of a list of meals or foods, small and grey, in the columns of its lines, see {@link listLineOf}:
 * what one number is per, like `Per 100 g` or `Per meal`, and `kcal`, the unit of every number below, named once.
 * - `line`: The line of the head.
 * - `head`: The head itself, in the columns of a row.
 *
 * @param per - What a number is per, like `Per 100 g`
 * @returns The line of the head
 */
export function listHeadOf(per: string): HTMLElement {
    const line: HTMLElement = elementOf("div", "food-item", "");
    const head: HTMLElement = elementOf("div", "food-row food-columns", "");
    head.append(elementOf("span", "", per), elementOf("span", "food-value", "kcal"));
    line.append(head);
    return line;
}

/**
 * Makes the line of a meal or a food in a list, the same for both wherever it stands: its row, flat, the name with
 * what stands after it, like the brand and store of a food, and its kcal as a bare number, every digit equally wide,
 * the head naming the unit, see {@link listHeadOf}; then, where given, what stands at the end of the line, like
 * the small grey `×` of a meal, whose room every line keeps, so the numbers of all lists stand in one column.
 * - `line`: The line.
 * - `row`: Its row, a button where a click does something.
 *
 * @param name - Name of the meal or food, with what stands after or below it
 * @param kcal - Its kcal
 * @param click - What a click on the row does, like picking or opening it; `null` for a row a click does nothing on,
 *   or which takes its clicks itself, like that of a meal open, whose plus stands in it
 * @param end - What stands at the end of the line, like the `×` of a meal; `null` for nothing
 * @returns The line and its row
 */
export function listLineOf(name: HTMLElement, kcal: number, click: (() => void) | null, end: HTMLElement | null):
    [HTMLElement, HTMLElement] {
    const line: HTMLElement = elementOf("div", "food-item", "");
    const row: HTMLElement = click === null ? elementOf("div", "food-row", "") : buttonOf("food-row", "", click);
    row.append(name, elementOf("span", "food-value", amountOf(kcal, 0)));
    line.append(row);
    if (end !== null)
        line.append(end);
    return [line, row];
}

/**
 * Makes the two buttons of every change in place, as the dialogs end: the cross, which cancels, then the check,
 * which saves, in the calm grey of what is picked, see `.food-buttons` in `search.css`.
 * - `buttons`: The two buttons side by side.
 * - `cancel`, `save`: The cross and the check.
 *
 * @param cancelled - What the cross does
 * @param saved - What the check does
 * @returns The two buttons side by side
 */
export function editButtonsOf(cancelled: () => void, saved: () => void): HTMLElement {
    const buttons: HTMLElement = elementOf("span", "food-buttons", "");
    const cancel: HTMLButtonElement = buttonOf("", "", cancelled);
    const save: HTMLButtonElement = buttonOf("food-save", "", saved);
    iconPut(cancel, X, "Cancel");
    iconPut(save, Check, "Save");
    buttons.append(cancel, save);
    return buttons;
}

/**
 * Makes a field of a change in place, one chip high, like the name of a food or of a meal.
 * - `input`: The field.
 *
 * @param value - Text it starts with, empty for none
 * @param words - What it holds, for screen readers and grey in it while empty, like `Name of the meal`
 * @param saved - What Enter does
 * @param cancelled - What Escape does, which closes no dialog around it
 * @returns The field
 */
export function editFieldOf(value: string, words: string, saved: () => void, cancelled: () => void): HTMLInputElement {
    const input: HTMLInputElement = document.createElement("input");
    input.type = "text";
    input.className = "food-field-text";
    input.autocomplete = "off";
    input.value = value;
    input.placeholder = words;
    input.setAttribute("aria-label", words);
    input.addEventListener("keydown", (event: KeyboardEvent): void => {
        if (event.key === "Enter") {
            event.preventDefault();
            saved();
        } else if (event.key === "Escape") {
            event.preventDefault();
            event.stopPropagation();
            cancelled();
        }
    });
    return input;
}

/**
 * Makes the name of a food in its line: its name with its brand and store in brackets, see `foodNameOf`
 * in `foods.ts`, and for a product of Open Food Facts below it, small and grey, its pack, like `Pack 450 g`.
 * - `title`: Name, and below it the pack.
 *
 * @param food - Food or product
 * @param product - Whether it is a product of Open Food Facts, whose pack shows
 * @returns The name
 */
function titleOf(food: Food, product: boolean): HTMLElement {
    const title: HTMLElement = elementOf("span", "food-title", "");
    title.append(foodNameOf("food-name", food.name, food.brand, food.store));
    if (product && food.pack !== "")
        title.append(elementOf("span", "food-pack", `Pack ${food.pack}`));
    return title;
}

/**
 * Builds the line of a food of mine: a click picks it where foods are picked.
 *
 * @param search - The search
 * @param food - My food
 * @returns Its line
 */
function mineLineOf(search: Search, food: Food): HTMLElement {
    const pick: ((food: Food) => void) | null = search.setup.pick;
    return listLineOf(titleOf(food, false), food.kcal, pick === null ? null : (): void => pick(food), null)[0];
}

/**
 * Builds the line of a product of Open Food Facts: a click adds it to my foods as Open Food Facts gives it, the line
 * taking no clicks meanwhile, so a double click adds it once, then takes it, see {@link addedOf}; when the reader
 * does not take it, a line below says so.
 * - `line`, `row`: Its line and row.
 *
 * @param search - The search
 * @param product - The product
 * @returns Its line
 */
function productLineOf(search: Search, product: Food): HTMLElement {
    const [line, row]: [HTMLElement, HTMLElement] = listLineOf(titleOf(product, true), product.kcal, (): void => {
        row.inert = true;
        foodSend(product).then(addedOf(search)).catch((reason: unknown): void => {
            console.error(reason);
            row.inert = false;
            line.after(elementOf("p", "food-none food-nothing", `Not added: the reader did not take ${product.name}`));
        });
    }, null);
    return line;
}

/**
 * Shows what the search found: the lines above my foods, see {@link SearchSetup}, the head of the foods, my foods,
 * then, for a search of some letters, the products of Open Food Facts of every page loaded, how many of how many,
 * like `8 of 54`, and `More` while a next page holds more; that Open Food Facts cannot be reached, where asked;
 * one grey line when nothing is found at all.
 * - `found`: What the search found.
 * - `query`: The search as typed.
 * - `products`: Products shown.
 * - `rows`: Lines of the results, the line between my foods and the products, and the hints.
 *
 * @param search - The search
 */
function resultsShow(search: Search): void {
    const found: FoodsFound = search.found ?? { foods: [], products: [], total: 0, exact: true, more: false };
    const query: string = search.input.value.trim();
    const products: Food[] = query === "" ? [] : found.products ?? [];
    const rows: HTMLElement[] = [...search.setup.before?.(query) ?? []];

    if (found.foods.length > 0 || products.length > 0)
        rows.push(listHeadOf("Per 100 g"));
    rows.push(...found.foods.map((food: Food): HTMLElement => mineLineOf(search, food)));
    if (found.foods.length > 0 && products.length > 0)
        rows.push(elementOf("hr", "food-divider", ""));
    rows.push(...products.map((product: Food): HTMLElement => productLineOf(search, product)));
    if (products.length > 0)
        rows.push(moreOf(search, products.length, found));
    if (query !== "" && found.products === null)
        rows.push(elementOf("p", "food-none food-nothing", "Open Food Facts cannot be reached"));
    if (rows.length === 0)
        rows.push(elementOf("p", "food-none food-nothing", query === "" ? "No foods yet" : search.setup.nothing));
    search.results.replaceChildren(...rows);
}

/**
 * Gives what a search does with a food once the reader wrote it: searches for its name, so it shows among my foods,
 * and picks it where foods are picked.
 *
 * @param search - The search
 * @returns Takes the food written
 */
function addedOf(search: Search): (food: Food) => void {
    return (food: Food): void => {
        search.input.value = food.name;
        resultsLoad(search, 1);
        search.setup.pick?.(food);
    };
}

/**
 * Reads a number as typed, a decimal comma counting as a point.
 *
 * @param text - Number as typed, like `7,4`
 * @returns Number, `null` for an empty field, which leaves a nutrient unknown, never 0; not a number
 *   for an unreadable text, which the form refuses
 */
function numberRead(text: string): number | null {
    return text.trim() === "" ? null : Number(text.trim().replace(",", "."));
}

/**
 * Opens the form of a food by hand at the top of the results of a search, named as typed, for the plus beside
 * the name `Foods` of the food view, in place of one open before: its name, brand and store, its kcal and its protein,
 * carbs and fat per 100 g, each field its name small and grey above it; its name and its kcal it needs, brand and store
 * may stay empty, and protein, carbs or fat left empty is unknown, never 0, the one of them missing worked out
 * by the reader from the kcal, see `nutrientsOf` in `reader/food.ts`.
 * The check or Enter in a field sends the food; the cross or Escape in a field closes the form. When the reader
 * does not take the food, like for the name, brand and store of one of mine, or a field holds no number, the form
 * stays open and says so.
 * - `search`: The search, `undefined` for an element that is none.
 * - `form`: The form.
 * - `inputs`: Text field of each value.
 * - `error`: Hint that the food is not taken.
 * - `text`: Name, brand or store as its field says.
 * - `close`: Closes the form.
 * - `add`: Sends the food, the form taking no clicks meanwhile, so a double click adds it once; with no name or kcal,
 *   or a field that holds no number, it says so instead.
 *
 * @param element - The search, as {@link foodSearchOf} built it
 */
export function foodNewShow(element: HTMLElement): void {
    const search: Search | undefined = searches.get(element);
    if (search === undefined)
        return;
    search.results.querySelector(".food-form")?.remove();
    const form: HTMLElement = elementOf("div", "food-form", "");
    const inputs: Map<string, HTMLInputElement> = new Map();
    const error: HTMLElement = elementOf("p", "food-error",
        "Not saved: it needs a name and its kcal, numbers only, and no food of mine of this name, brand and store");
    const text: (key: string) => string = (key: string): string => inputs.get(key)?.value.trim() ?? "";
    const close: () => void = (): void => form.remove();
    const add: () => void = (): void => {
        const [kcal, protein, carbs, fat]: (number | null)[] = ["kcal", "protein", "carbs", "fat"]
            .map((key: string): number | null => numberRead(text(key)));
        if (text("name") === "" || kcal === null
            || [kcal, protein, carbs, fat].some((typed: number | null): boolean => Number.isNaN(typed))) {
            error.hidden = false;
            return;
        }
        form.inert = true;
        foodSend({
            name: text("name"), kcal: kcal, protein: protein, carbs: carbs, fat: fat, barcode: "", brand: text("brand"),
            store: text("store"), pack: "",
        }).then((food: Food): void => {
            form.remove();
            addedOf(search)(food);
        }).catch((reason: unknown): void => {
            console.error(reason);
            error.hidden = false;
            form.inert = false;
        });
    };

    fields.forEach(([name, key]: [string, string]): void => {
        const word: boolean = ["name", "brand", "store"].includes(key);
        const label: HTMLElement = elementOf("label",
            key === "name" ? "food-field food-field-name" : word ? "food-field food-field-word" : "food-field", name);
        const input: HTMLInputElement = editFieldOf(key === "name" ? search.input.value.trim() : "", name, add, close);
        input.inputMode = word ? "text" : "decimal";
        input.placeholder = "";
        inputs.set(key, input);
        label.append(input);
        form.append(label);
    });
    error.hidden = true;
    form.append(editButtonsOf(close, add), error);
    search.results.prepend(form);
    inputs.get("name")?.focus();
}

/**
 * Builds the line below the products: how many it shows of how many the search matches, like `8 of 54`,
 * `10,000+` when Open Food Facts gives only a lower bound, and `More`, while a next page holds more,
 * which loads it and takes no second click meanwhile.
 * - `line`: The line.
 * - `more`: The button `More`.
 *
 * @param search - The search
 * @param shown - Number of products shown
 * @param found - What the search found
 * @returns The line
 */
function moreOf(search: Search, shown: number, found: FoodsFound): HTMLElement {
    const line: HTMLElement = elementOf("div", "food-more", "");
    line.append(elementOf("span", "", `${amountOf(shown, 0)} of ${amountOf(Math.max(found.total, shown), 0)}`
        + `${found.exact ? "" : "+"}`));
    if (found.more) {
        const more: HTMLButtonElement = buttonOf("food-more-button", "More", (): void => {
            more.disabled = true;
            resultsLoad(search, search.page + 1);
        });
        line.append(more);
    }
    return line;
}

/**
 * Searches for the text of the field and shows what it finds, unless another search was asked meanwhile or the text
 * changed since, so a late answer never covers a newer one, and an answer that found nothing never stands below
 * a text it was not given for, see {@link nothingHide}: the first page in place of what was shown,
 * a later page after the products shown, which stay when Open Food Facts cannot be reached for it.
 * - `asked`: Number of this search.
 * - `text`: The text searched for.
 * - `before`: What the search had found before.
 *
 * @param search - The search
 * @param page - Page of the products, 1 for the first
 */
function resultsLoad(search: Search, page: number): void {
    const asked: number = ++search.asked;
    const text: string = search.input.value.trim();
    const before: FoodsFound | null = search.found;
    foodsFind(text, page, search.setup.products).then((found: FoodsFound): void => {
        if (asked !== search.asked || search.input.value.trim() !== text)
            return;
        search.page = page;
        search.found = page === 1 || before === null ? found : {
            ...found,
            foods: before.foods,
            products: [...(before.products ?? []), ...(found.products ?? [])],
            more: found.products !== null && found.more,
        };
        resultsShow(search);
    }).catch((error: unknown): void => {
        console.error(error);
        search.results.replaceChildren(elementOf("p", "food-none", "The foods cannot be read"));
    });
}

/**
 * Takes away the lines of a search that say nothing was found, like `Open Food Facts cannot be reached`, as soon as
 * the text changes, since they told of the text before; the answer for the text as it stands shows them again,
 * should it find nothing too, see {@link resultsLoad}.
 *
 * @param search - The search
 */
function nothingHide(search: Search): void {
    search.results.querySelectorAll(".food-nothing").forEach((line: Element): void => line.remove());
}

/**
 * Builds the food search, see the top of this file, showing all my foods at first.
 * Typing searches from the first page once it pauses for {@link pause}, the lines that found nothing for the text
 * before gone at once, see {@link nothingHide}; Enter searches at once, without sending a form around it.
 * - `element`: Field and results.
 * - `search`: The search with what it shows.
 * - `waiting`: Timer of the search waiting for the pause, 0 for none.
 *
 * @param setup - What the search does where it stands, see {@link SearchSetup}
 * @returns The search, to put into the page
 */
export function foodSearchOf(setup: SearchSetup): HTMLElement {
    const element: HTMLElement = elementOf("div", "food-search", "");
    const search: Search = {
        input: document.createElement("input"),
        results: elementOf("div", "food-results", ""),
        setup: setup,
        page: 1,
        found: null,
        asked: 0,
    };
    let waiting: number = 0;

    search.input.type = "search";
    search.input.placeholder = setup.before === null ? "Search foods or a barcode" : "Search meals, foods or a barcode";
    search.input.autocomplete = "off";
    search.input.addEventListener("input", (): void => {
        clearTimeout(waiting);
        nothingHide(search);
        waiting = window.setTimeout((): void => resultsLoad(search, 1), pause);
    });
    search.input.addEventListener("keydown", (event: KeyboardEvent): void => {
        if (event.key !== "Enter")
            return;
        event.preventDefault();
        clearTimeout(waiting);
        resultsLoad(search, 1);
    });
    bracketsWatch(search.results);
    element.append(search.input, search.results);
    searches.set(element, search);
    resultsLoad(search, 1);
    return element;
}

/**
 * Empties the field of a search and shows what an empty search finds, with the lines above my foods built anew,
 * like each time the list of an entry opens.
 *
 * @param element - The search, as {@link foodSearchOf} built it
 */
export function foodSearchClear(element: HTMLElement): void {
    const search: Search | undefined = searches.get(element);
    if (search === undefined)
        return;
    search.input.value = "";
    resultsLoad(search, 1);
}
