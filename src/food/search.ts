/**
 * ## Food search
 *
 * The one search for foods, for the food view and the foods of a meal in the entry by category of the day:
 * a field where a few letters or a barcode find my foods first, the most eaten first, and below them, where asked,
 * the products of Open Food Facts, a page of them at a time, `More` loading the next page, beside it how many it shows
 * of how many the search matches, like `8 of 54`; in an entry my meals above my foods, see {@link SearchSetup}.
 * Its sections stand apart at a glance, a thin grey line between them, each its name small and grey above it,
 * `My meals`, `My foods` and `Open Food Facts`, with the unit of its numbers at the right, `kcal / meal` or
 * `kcal / 100 g`, see {@link listHeadOf}.
 * It searches once the typing pauses, so a word asks only once; an empty field lists all my foods in the food view,
 * and nothing where a food is picked, like the search of an entry or the plus of a meal, whose list would grow long:
 * there a list shows only once I search. That nothing
 * is found it says in one grey line, only for the text as it stands, once its answer is in, never for a text typed
 * before, like a barcode typed digit by digit, whose first digits find nothing.
 * I search the food alone, like `räucherlachs`: Open Food Facts searches the names of its products, and a word of
 * a brand or a shop only ranks them, it filters nothing, so the brand and store of a product stand beside its name.
 * Every list of meals or foods looks alike, wherever it stands: one flat line per meal or food, nothing in it
 * but its name, a food's brand and store in brackets after it, like `Gouda (Milbona, Lidl)`, so the same name of two
 * shops never mixes up, and its kcal as a bare number, a meal's whole, a food's per 100 g, the head of its section
 * naming the unit once, see {@link listLineOf}; a product of Open Food Facts also its pack small and grey below
 * its name, like `Pack 265 g`, which tells products apart.
 * A click on a product adds it to my foods as Open Food Facts gives it, no form in between, see `foodSend`
 * in `foods.ts`, and takes it like one of mine. Where a food is wanted, like in an entry, a click on one of my foods
 * picks it; in the food view, which wants none, it opens the food below its line: its protein, carbs and fat per 100 g,
 * one unknown empty, never 0, its pack and its barcode where known, and its name, brand and store to change,
 * see {@link detailOf}. A food found nowhere goes in by hand only in the food view, by the plus beside the name
 * `Foods`, see {@link foodNewShow}.
 * Nothing in the search is a form or sends one, so it can stand inside the form of a dialog.
 *
 * - `./foods.ts`: Finds foods, sends new and renamed foods, writes amounts and makes elements and buttons.
 * - `../icons.ts`: Puts icons into the buttons, their words as tooltip.
 * - `lucide`: The icons save and cancel.
 * - `./search.css`: Look of the search and of every list of meals or foods, the same wherever they stand.
 */

import { amountOf, bracketsWatch, buttonOf, elementOf, foodChange, foodDelete, foodNameOf, foodSend, foodsFind }
    from "./foods.ts";
import { crossPut, iconOf, iconPut, QuestionMark } from "../icons.ts";
import { Check, Plus, X } from "lucide";
import "./search.css";

import type { Food, FoodsFound, Product } from "./foods.ts";


/**
 * What a search does, where it stands.
 *
 * - `pick`: Takes a food picked or added, like into an entry; `null` where no food is wanted, like in the food view,
 *   where a click on one of my foods opens it, see {@link detailOf}.
 * - `meals`: Builds the lines of my meals to show above my foods for the search as typed, see `listLineOf`,
 *   in an entry; `null` for none.
 * - `products`: Whether it finds products of Open Food Facts too; not for a meal of the food view, which takes only
 *   my foods.
 * - `nothing`: The one grey line when a search of some letters finds nothing, like where a food by hand goes in.
 */
export type SearchSetup = {
    pick: ((food: Food) => void) | null;
    meals: ((query: string) => HTMLElement[]) | null;
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
 * - `open`: Key of my food open below its line, see {@link keyOf}, empty for none.
 * - `shown`: The text the results shown were found for.
 * - `enter`: Whether Enter waits for the results of the text typed, to take the first, see {@link firstPick}.
 * - `asking`: Key of my food whose `×` asked `Really remove?`, empty for none.
 * - `reveal`: Whether the food open goes into sight once shown, as after a click on it in a meal, see {@link foodShow}.
 */
type Search = {
    input: HTMLInputElement;
    results: HTMLElement;
    setup: SearchSetup;
    page: number;
    found: FoodsFound | null;
    asked: number;
    open: string;
    shown: string;
    enter: boolean;
    asking: string;
    reveal: boolean;
};

/**
 * Milliseconds the typing has to pause before the field searches, so a word asks Open Food Facts once, not per letter.
 */
const pause: number = 300;

/**
 * Fields of the form of a food by hand: the name shown, the value of the food it fills and its unit after it, empty
 * for none.
 */
const fields: [string, "name" | "brand" | "store" | "kcal" | "protein" | "carbs" | "fat" | "piece" | "pack", string][] = [
    ["Name", "name", ""], ["Brand", "brand", ""], ["Store", "store", ""], ["kcal", "kcal", "kcal"],
    ["Protein", "protein", "g"], ["Carbs", "carbs", "g"], ["Fat", "fat", "g"], ["Piece", "piece", "g"], ["Pack", "pack", ""],
];

/**
 * Each search by its element on the page, so {@link foodSearchClear} and {@link foodNewShow} find it.
 */
const searches: WeakMap<HTMLElement, Search> = new WeakMap();


/**
 * Writes the key of a food: its name, brand and store parted by `;`, in small letters, as the reader keys it.
 *
 * @param food - Food
 * @returns Key like `skyr natur;k-classic;kaufland`
 */
function keyOf(food: { name: string; brand: string; store: string }): string {
    return `${food.name};${food.brand};${food.store}`.toLowerCase();
}

/**
 * Makes the head of a list or a section of meals or foods, small and grey, in the columns of its lines, see
 * {@link listLineOf}: its name, like `My foods`, and the unit of every number below, named once, like `kcal / 100 g`.
 * - `line`: The line of the head.
 * - `head`: The head itself, in the columns of a row.
 *
 * @param name - Name of the list or section, like `My meals`
 * @param unit - Unit of its numbers, like `kcal`
 * @returns The line of the head
 */
export function listHeadOf(name: string, unit: string): HTMLElement {
    const line: HTMLElement = elementOf("div", "food-item", "");
    const head: HTMLElement = elementOf("div", "food-row food-columns", "");
    head.append(elementOf("span", "", name), elementOf("span", "food-value", unit));
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
 * @param kcal - Its kcal; `null` while unknown, like those of a product Open Food Facts gives without them, which
 *   leaves the number empty
 * @param click - What a click on the row does, like picking or opening it; `null` for a row a click does nothing on,
 *   or which takes its clicks itself, like that of a meal open, whose plus stands in it
 * @param end - What stands at the end of the line, like the `×` of a meal; `null` for nothing
 * @returns The line and its row
 */
export function listLineOf(name: HTMLElement, kcal: number | null, click: (() => void) | null,
                           end: HTMLElement | null): [HTMLElement, HTMLElement] {
    const line: HTMLElement = elementOf("div", "food-item", "");
    const row: HTMLElement = click === null ? elementOf("div", "food-row", "") : buttonOf("food-row", "", click);
    row.append(name, elementOf("span", "food-value", kcal === null ? "" : amountOf(kcal, 0)));
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
 * Makes a value that changes in place, like the name, brand or store of a food of mine or the name of a meal of mine,
 * see `../food/meals.ts`: its text as plain as every value
 * beside it, no frame, a click puts the cursor into it, see `.food-inline` in `search.css`; Enter or leaving it saves
 * a change, Escape takes the change back.
 * - `input`: The value.
 *
 * @param value - Its text
 * @param words - What it is, for screen readers, like `Brand`
 * @param saved - Sends the change, after a change only
 * @returns The value
 */
export function inlineFieldOf(value: string, words: string, saved: () => void): HTMLInputElement {
    const input: HTMLInputElement = document.createElement("input");
    input.type = "text";
    input.className = "food-inline";
    input.autocomplete = "off";
    input.value = value;
    input.setAttribute("aria-label", words);
    input.addEventListener("keydown", (event: KeyboardEvent): void => {
        if (event.key === "Enter") {
            event.preventDefault();
            input.blur();
        } else if (event.key === "Escape") {
            event.preventDefault();
            event.stopPropagation();
            input.value = value;
            input.blur();
        }
    });
    input.addEventListener("change", saved);
    return input;
}

/**
 * Builds a food of mine opened below its line in the food view, in two columns as the parts of a dialog, each its name
 * small and grey, then its value, every value as high as a field, so the rows stand equally apart: on top its name,
 * brand and store, which change in place by a click into them, see {@link inlineFieldOf}, renaming it wherever it
 * stands, see `foodChange` in `foods.ts`; then its kcal, protein, carbs and fat per 100 g, the grams of one piece and
 * its pack. A food I made by hand, without barcode, changes them all in place, so a mistake of mine is mended; one of
 * Open Food Facts keeps its kcal, nutrients and pack as they came, one unknown empty, never 0, and shows its barcode;
 * the grams of one piece change in place for every food, since how big a piece is only I know. A click on its line
 * closes it again. When the reader does not take a change, the food stays open and says so.
 * - `own`: Whether I made it by hand.
 * - `detail`: The food opened.
 * - `facts`: Its values in two columns.
 * - `factAdd`: Adds a value with its name.
 * - `fields`: Its values that change in place, by their keys.
 * - `text`: The text of a value that changes, as typed.
 * - `error`: Hint that the reader did not take the change.
 * - `save`: Sends the values, the food taking no clicks meanwhile, and shows the search anew, the food staying open
 *   under its new name; a number that is none, like `abc`, takes nothing and says so.
 * - `fieldAdd`: Adds a value that changes in place, with its unit after it where it has one.
 * - `gramsOf`: Writes grams of a nutrient as a fixed value, empty while unknown.
 *
 * @param search - The search
 * @param food - My food
 * @returns The food opened
 */
function detailOf(search: Search, food: Food): HTMLElement {
    const own: boolean = food.barcode === "";
    const detail: HTMLElement = elementOf("div", "food-detail", "");
    const facts: HTMLElement = elementOf("div", "food-facts", "");
    const factAdd: (name: string, value: Node | string) => void = (name: string, value: Node | string): void => {
        facts.append(elementOf("span", "food-fact", name), typeof value === "string" ? elementOf("span", "", value) : value);
    };
    const fields: Map<string, HTMLInputElement> = new Map();
    const text: (key: string) => string = (key: string): string => fields.get(key)?.value.trim() ?? "";
    const error: HTMLElement = elementOf("p", "food-error",
        "Not changed: it needs a name and its kcal, numbers only, and no other food of mine may have this name, "
        + "brand and store");
    const save: () => void = (): void => {
        const [kcal, protein, carbs, fat, piece]: (number | null)[] = ["kcal", "protein", "carbs", "fat", "piece"]
            .map((key: string): number | null => numberRead(text(key)));
        if (text("name") === "" || (own && kcal === null)
            || [kcal, protein, carbs, fat, piece].some((typed: number | null): boolean => Number.isNaN(typed))) {
            error.hidden = false;
            return;
        }
        detail.inert = true;
        foodChange(food, {
            name: text("name"), brand: text("brand"), store: text("store"), piece: piece,
            ...own && kcal !== null ? { kcal: kcal, protein: protein, carbs: carbs, fat: fat, pack: text("pack") } : {},
        }).then((): void => {
            search.open = keyOf({ ...food, name: text("name"), brand: text("brand"), store: text("store") });
            resultsLoad(search, 1);
        }).catch((reason: unknown): void => {
            console.error(reason);
            error.hidden = false;
            detail.inert = false;
        });
    };
    const fieldAdd: (name: string, key: string, value: string, unit: string) => void = (name: string, key: string,
        value: string, unit: string): void => {
        const input: HTMLInputElement = inlineFieldOf(value, name, save);
        fields.set(key, input);
        if (unit === "") {
            factAdd(name, input);
            return;
        }
        const amount: HTMLElement = elementOf("span", "food-grams", "");
        input.inputMode = "decimal";
        input.classList.add("food-inline-grams");
        amount.append(input, unit);
        amount.addEventListener("click", (): void => input.focus());
        factAdd(name, amount);
    };
    const gramsOf: (grams: number | null) => string = (grams: number | null): string =>
        grams === null ? "" : `${amountOf(grams, 1)} g`;
    const numberOf: (value: number | null) => string = (value: number | null): string =>
        value === null ? "" : String(value);

    fieldAdd("Name", "name", food.name, "");
    fieldAdd("Brand", "brand", food.brand, "");
    fieldAdd("Store", "store", food.store, "");
    if (own) {
        fieldAdd("kcal", "kcal", String(food.kcal), "kcal");
        fieldAdd("Protein", "protein", numberOf(food.protein), "g");
        fieldAdd("Carbs", "carbs", numberOf(food.carbs), "g");
        fieldAdd("Fat", "fat", numberOf(food.fat), "g");
    } else {
        factAdd("Protein", gramsOf(food.protein));
        factAdd("Carbs", gramsOf(food.carbs));
        factAdd("Fat", gramsOf(food.fat));
    }
    fieldAdd("Piece", "piece", numberOf(food.piece), "g");
    if (own)
        fieldAdd("Pack", "pack", food.pack, "");
    else if (food.pack !== "")
        factAdd("Pack", food.pack);
    if (food.barcode !== "")
        factAdd("Barcode", food.barcode);
    error.hidden = true;
    detail.append(facts, error);
    return detail;
}

/**
 * Builds the line of a food of mine: a click picks it where foods are picked, else opens it below its line or closes
 * it again, see {@link detailOf}; in the food view its small grey `×` at its end, which removes it from `Foods.md`,
 * its first click only asking, a plain question mark, `Really remove?`, as for a meal; entries and meals listing it
 * keep their lines, which then count nothing.
 * - `key`: Its key.
 * - `open`: Whether it is open.
 * - `remove`: Its `×`, `null` where foods are picked.
 * - `line`, `row`: Its line and row.
 *
 * @param search - The search
 * @param food - My food
 * @returns Its line, and the food opened below it while open
 */
function mineLinesOf(search: Search, food: Food): HTMLElement[] {
    const key: string = keyOf(food);
    const open: boolean = search.setup.pick === null && search.open === key;
    const remove: HTMLButtonElement | null = search.setup.pick !== null ? null : buttonOf("", "", (): void => {
        if (search.asking !== key) {
            search.asking = key;
            resultsShow(search);
            return;
        }
        search.asking = "";
        foodDelete(food).then((): void => resultsLoad(search, 1))
            .catch((error: unknown): void => console.error(error));
    });
    if (remove !== null)
        crossPut(remove, `Remove ${food.name}`);
    if (remove !== null && search.asking === key)
        iconPut(remove, QuestionMark, "Really remove?");
    const [line, row]: [HTMLElement, HTMLElement] = listLineOf(foodNameOf("food-name", food.name, food.brand, food.store),
        food.kcal, (): void => {
        if (search.setup.pick !== null) {
            search.setup.pick(food);
            return;
        }
        search.open = open ? "" : key;
        resultsShow(search);
    }, remove);
    if (search.setup.pick === null)
        row.setAttribute("aria-expanded", String(open));
    return open ? [line, detailOf(search, food)] : [line];
}

/**
 * Makes the name of a product of Open Food Facts in its line: its name with its brand and store in brackets, see
 * `foodNameOf` in `foods.ts`, and below it, small and grey, its pack, like `Pack 265 g`, where known.
 * - `title`: Name, and below it the pack.
 *
 * @param product - The product
 * @returns The name
 */
function productNameOf(product: Product): HTMLElement {
    const title: HTMLElement = elementOf("span", "food-title", "");
    title.append(foodNameOf("food-name", product.name, product.brand, product.store));
    if (product.pack !== "")
        title.append(elementOf("span", "food-pack", `Pack ${product.pack}`));
    return title;
}

/**
 * Builds the line of a product of Open Food Facts: a click adds it to my foods as Open Food Facts gives it, the line
 * taking no clicks meanwhile, so a double click adds it once, then takes it, see {@link addedOf}; when the reader
 * does not take it, a line below says so. A product whose kcal Open Food Facts does not know shows no number, and
 * a click opens the form of a food by hand with its name, brand, store, barcode and pack, the cursor in its kcal,
 * which I type from its pack, see {@link newFormShow}, so nothing goes in without its kcal and nothing made up.
 * - `kcal`: Its kcal, `null` while unknown.
 * - `line`, `row`: Its line and row.
 *
 * @param search - The search
 * @param product - The product
 * @returns Its line
 */
function productLineOf(search: Search, product: Product): HTMLElement {
    const [line, row]: [HTMLElement, HTMLElement] = listLineOf(productNameOf(product), product.kcal, (): void => {
        const kcal: number | null = product.kcal;
        if (kcal === null) {
            newFormShow(search, product);
            return;
        }
        row.inert = true;
        foodSend({ ...product, kcal: kcal }).then(addedOf(search)).catch((reason: unknown): void => {
            console.error(reason);
            row.inert = false;
            line.after(elementOf("p", "food-none food-nothing", `Not added: the reader did not take ${product.name}`));
        });
    }, null);
    line.classList.add("food-product");
    return line;
}

/**
 * Shows what the search found in its sections, each its head, see {@link listHeadOf}, a thin grey line between them,
 * those that found nothing left out: my meals, where the search shows them, see {@link SearchSetup}; my foods;
 * then, for a search of some letters, the products of Open Food Facts of every page loaded, how many of how many,
 * like `8 of 54`, and `More` while a next page holds more, or that Open Food Facts cannot be reached;
 * one grey line when nothing is found at all.
 * - `found`: What the search found.
 * - `query`: The search as typed.
 * - `meals`: Lines of my meals found.
 * - `products`: Products shown.
 * - `sections`: The sections that found something, each its head and its lines.
 *
 * @param search - The search
 */
function resultsShow(search: Search): void {
    const found: FoodsFound = search.found ?? { foods: [], products: [], total: 0, exact: true, more: false };
    const query: string = search.input.value.trim();
    if (search.setup.pick !== null && query === "") {
        search.results.replaceChildren();
        search.shown = query;
        search.enter = false;
        return;
    }
    const meals: HTMLElement[] = search.setup.meals?.(query) ?? [];
    const products: Product[] = query === "" ? [] : found.products ?? [];
    const sections: HTMLElement[][] = [];

    if (meals.length > 0)
        sections.push([listHeadOf("My meals", "kcal / meal"), ...meals]);
    const fresh: HTMLElement[] = newFoodOf(search, query, found.foods);
    if (found.foods.length > 0 || fresh.length > 0)
        sections.push([listHeadOf("My foods", "kcal / 100 g"),
            ...found.foods.flatMap((food: Food): HTMLElement[] => mineLinesOf(search, food)), ...fresh]);
    if (products.length > 0)
        sections.push([listHeadOf("Open Food Facts", "kcal / 100 g"),
            ...products.map((product: Product): HTMLElement => productLineOf(search, product)),
            moreOf(search, products.length, found)]);
    else if (query !== "" && found.products === null)
        sections.push([listHeadOf("Open Food Facts", ""),
            elementOf("p", "food-none food-nothing", "Open Food Facts cannot be reached")]);
    search.results.replaceChildren(...sections.length === 0
        ? [elementOf("p", "food-none food-nothing", query !== "" ? search.setup.nothing
            : search.setup.meals === null ? "No foods yet" : "No meals or foods yet")]
        : sections.flatMap((section: HTMLElement[], index: number): HTMLElement[] =>
            index === 0 ? section : [elementOf("hr", "food-divider", ""), ...section]));
    search.shown = query;
    if (search.reveal) {
        search.reveal = false;
        search.results.querySelector(".food-detail")?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    if (search.enter) {
        search.enter = false;
        firstPick(search);
    }
}

/**
 * Takes what Enter takes in a search that picks, like that of a dialog: the first of my meals or foods it shows,
 * never a product of Open Food Facts, which goes into my foods only by a click, nor a new meal or food; nothing
 * in a search that only shows.
 *
 * @param search - The search
 */
function firstPick(search: Search): void {
    if (search.setup.pick === null)
        return;
    search.results.querySelector<HTMLElement>(".food-item:not(.food-product) > button.food-row")?.click();
}

/**
 * Makes the one plus of a new food in every search of my foods, last among them, like `+ New food “Döner”`, while
 * the text typed is no food of mine, nor a barcode: a click opens the form of a food by hand at the top of the
 * results, named as typed, see {@link newFormShow}, the food saved there picked at once where foods are picked,
 * else shown among my foods.
 * - `plus`: The plus.
 *
 * @param search - The search
 * @param query - The search as typed
 * @param mine - My foods found
 * @returns The plus, none where it is not offered
 */
function newFoodOf(search: Search, query: string, mine: Food[]): HTMLElement[] {
    if (query === "" || /^\d{8,14}$/.test(query)
        || mine.some((food: Food): boolean => food.name.toLowerCase() === query.toLowerCase()))
        return [];
    const plus: HTMLButtonElement = buttonOf("picker-new", "", (): void => newFormShow(search, null));
    plus.replaceChildren(iconOf(Plus), `New food “${query}”`);
    plus.title = "New food by hand, its kcal typed next";
    return [plus];
}

/**
 * Gives what a search does with a food once the reader wrote it: clears the text typed, so the list shows all my
 * foods again, the new one among them, closed, and I am out of the search, see {@link foodSearchClear}; and picks it
 * where foods are picked.
 *
 * @param search - The search
 * @returns Takes the food written
 */
function addedOf(search: Search): (food: Food) => void {
    return (food: Food): void => {
        search.input.value = "";
        search.open = "";
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
 * the name `Foods` of the food view, in place of one open before, in the look of a food of mine opened, see
 * {@link detailOf}: its name, brand and store, its kcal and its protein, carbs and fat per 100 g, the grams of one
 * piece, like 50 of a Semmel, and its pack, in two columns, each its name small and grey, then its value, plain with
 * a thin line below to type on, see `.food-inline-new` in `search.css`, its unit after a number, a click on its name
 * putting the cursor into it; its name, brand, store and kcal it needs, since I keep my own brands and places
 * always, like my bakery and where it is, and protein, carbs or fat left empty is unknown, never 0, the one of them
 * missing worked out by the reader from the kcal, see `nutrientsOf` in `reader/food.ts`.
 * The check or Enter in a field sends the food; the cross or Escape in a field closes the form. When the reader
 * does not take the food, like for the name, brand and store of one of mine, or a field holds no number, the form
 * stays open and says so.
 * - `search`: The search, `undefined` for an element that is none.
 * - `form`: The form.
 * - `facts`: Its values in two columns.
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
    if (search !== undefined)
        newFormShow(search, null);
}

/**
 * Opens the form of a food by hand in a search, see {@link foodNewShow}, named as typed in the search, the cursor in
 * its kcal, or in its name while none is typed; for a product of Open Food Facts without kcal its name, brand and
 * store filled in and its barcode and pack kept, see {@link productLineOf}.
 * - `start`: What each field starts with.
 * - `form`: The form.
 * - `facts`: Its values in two columns.
 * - `inputs`: Text field of each value.
 * - `error`: Hint that the food is not taken.
 * - `text`: Name, brand or store as its field says.
 * - `close`: Closes the form.
 * - `add`: Sends the food, see {@link foodNewShow}.
 *
 * @param search - The search
 * @param product - Product of Open Food Facts the food is, `null` for a food of my own
 */
function newFormShow(search: Search, product: Product | null): void {
    search.results.querySelector(".food-form")?.remove();
    const start: Map<string, string> = new Map([["name", product?.name ?? search.input.value.trim()],
        ["brand", product?.brand ?? ""], ["store", product?.store ?? ""], ["pack", product?.pack ?? ""]]);
    const form: HTMLElement = elementOf("div", "food-form food-detail", "");
    const facts: HTMLElement = elementOf("div", "food-facts", "");
    const inputs: Map<string, HTMLInputElement> = new Map();
    const error: HTMLElement = elementOf("p", "food-error", "Not saved: it needs a name, a brand, a store and its kcal, "
        + "numbers only, and no food of mine of this name, brand and store");
    const text: (key: string) => string = (key: string): string => inputs.get(key)?.value.trim() ?? "";
    const close: () => void = (): void => form.remove();
    const add: () => void = (): void => {
        const [kcal, protein, carbs, fat, piece]: (number | null)[] = ["kcal", "protein", "carbs", "fat", "piece"]
            .map((key: string): number | null => numberRead(text(key)));
        if (text("name") === "" || text("brand") === "" || text("store") === "" || kcal === null
            || [kcal, protein, carbs, fat, piece].some((typed: number | null): boolean => Number.isNaN(typed))) {
            error.hidden = false;
            return;
        }
        form.inert = true;
        foodSend({
            name: text("name"), kcal: kcal, protein: protein, carbs: carbs, fat: fat, barcode: product?.barcode ?? "",
            brand: text("brand"), store: text("store"), pack: text("pack"), piece: piece,
        }).then((food: Food): void => {
            form.remove();
            addedOf(search)(food);
        }).catch((reason: unknown): void => {
            console.error(reason);
            error.hidden = false;
            form.inert = false;
        });
    };

    fields.forEach(([name, key, unit]: [string, string, string]): void => {
        const label: HTMLElement = elementOf("span", "food-fact", name);
        const input: HTMLInputElement = editFieldOf(start.get(key) ?? "", name, add, close);
        const amount: HTMLElement = elementOf("span", "food-grams", "");
        input.className = "food-inline food-inline-new";
        input.inputMode = unit === "" ? "text" : "decimal";
        input.placeholder = "";
        label.addEventListener("click", (): void => input.focus());
        inputs.set(key, input);
        if (unit !== "") {
            input.classList.add("food-inline-grams");
            amount.append(input, unit);
            amount.addEventListener("click", (): void => input.focus());
        }
        facts.append(label, unit === "" ? input : amount);
    });
    error.hidden = true;
    form.append(facts, editButtonsOf(close, add), error);
    search.results.prepend(form);
    inputs.get(text("name") === "" ? "name" : "kcal")?.focus();
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
        open: "",
        shown: "",
        enter: false,
        asking: "",
        reveal: false,
    };
    let waiting: number = 0;

    search.input.type = "search";
    search.input.placeholder = setup.meals === null ? "Search foods or a barcode" : "Search meals, foods or a barcode";
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
        if (search.found !== null && search.shown === search.input.value.trim()) {
            firstPick(search);
            return;
        }
        search.enter = true;
        resultsLoad(search, 1);
    });
    bracketsWatch(search.results);
    element.append(search.input, search.results);
    searches.set(element, search);
    resultsLoad(search, 1);
    return element;
}

/**
 * Shows one of my foods opened in a search that only shows, like that of the food view: the field emptied, so all
 * my foods show, the food open below its line and moved into sight, as a click on a food of a meal asks, see
 * `../food/meals.ts`.
 *
 * @param element - The search, as {@link foodSearchOf} built it
 * @param food - The food, its name, brand and store
 */
export function foodShow(element: HTMLElement, food: { name: string; brand: string; store: string }): void {
    const search: Search | undefined = searches.get(element);
    if (search === undefined)
        return;
    search.input.value = "";
    search.open = keyOf(food);
    search.reveal = true;
    resultsLoad(search, 1);
}

/**
 * Empties the field of a search, closes a food open, and shows what an empty search finds, with my meals found anew,
 * like each time the list of an entry opens.
 *
 * @param element - The search, as {@link foodSearchOf} built it
 */
export function foodSearchClear(element: HTMLElement): void {
    const search: Search | undefined = searches.get(element);
    if (search === undefined)
        return;
    search.input.value = "";
    search.open = "";
    resultsLoad(search, 1);
}
