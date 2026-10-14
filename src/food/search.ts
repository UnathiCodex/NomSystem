/**
 * ## Food search
 *
 * The one search for foods, for the food view and the foods of a meal in the entry by category of the day:
 * a field where a few letters or a barcode find my foods first, the most eaten first,
 * and below them the products of Open Food Facts, a page of them at a time, `More` loading the next page,
 * beside it how many it shows of how many the search matches, like `8 of 54`.
 * It searches once the typing pauses, so a word asks only once; an empty field lists all my foods.
 * Below the field the brands as chips: `All brands`, then those of `Brands.md`, Edeka first, then the square + of the
 * page, see `.chip-button` in `base.css`, `Brand` as its tooltip, which takes any brand typed; a chip picked shows only products of its brand, my foods stay all,
 * and carries `×`, which removes its brand from `Brands.md`.
 * Each food shows kcal, protein, carbs and fat per 100 g and its usual portion, its brand after its name and below it
 * small its store, like `Gouda · Milbona` over `Lidl`, so the same name of two shops never mixes up; a product also
 * its pack, like `Pack 450 g · Lidl`, and as portion the serving its maker gives, `none` when it gives none.
 * A click on a product opens a short form below it to add it to my foods, with a name of my own and its portion,
 * both prefilled, 100 g for a product without serving, its name with its brand after it when one of my foods has
 * its name already; it goes into `Foods.md` with its brand and store, and its brand into `Brands.md`,
 * a chip from then on.
 * The square + at the end, `Own food by hand, when nothing is found` as its tooltip, for a food found nowhere,
 * opens one to add it with its values per 100 g typed.
 * Where a food is wanted, like in a meal, a click on one of my foods picks it, and so does adding one,
 * so a meal lists only foods of `Foods.md`; there rows of its own may stand above my foods, like the meals eaten before,
 * built anew for each search. Nothing in the search is a form or sends one, so it can stand inside the form of a dialog.
 *
 * - `./foods.ts`: Finds foods, loads and sends brands, sends new foods, writes amounts and makes elements.
 * - `../icons.ts`: Puts icons into the buttons, their words as tooltip.
 * - `lucide`: The icons add, cancel and new.
 * - `./search.css`: Look of the search, the same wherever it stands.
 */

import { amountOf, brandDelete, brandSend, brandsLoad, elementOf, foodSend, foodsFind } from "./foods.ts";
import { iconPut } from "../icons.ts";
import { Check, Plus, X } from "lucide";
import "./search.css";

import type { Food, FoodsFound, Product } from "./foods.ts";


/**
 * Takes a food picked or added, like into a meal; `null` where no food is wanted, like in the food view.
 */
type Pick = ((food: Food) => void) | null;

/**
 * Builds rows to show above my foods for the search as typed, like the meals eaten before that match it;
 * `null` for none, like in the food view.
 */
type Before = ((query: string) => HTMLElement[]) | null;

/**
 * One search on the page, with what it shows.
 *
 * - `input`: Field of the search.
 * - `chips`: Place of the chips of the brands, below the field.
 * - `results`: Place of the results, below the chips.
 * - `pick`: Takes a food picked or added, `null` where no food is wanted.
 * - `before`: Builds the rows above my foods, `null` for none.
 * - `brands`: Brands offered as chips, the first first.
 * - `brand`: Brand picked, empty for every brand.
 * - `page`: Last page of products shown, 1 for the first.
 * - `found`: What the search found, with the products of every page shown; `null` before its first answer.
 * - `asked`: Number of the last search asked, so a late answer never covers a newer one.
 */
type Search = {
    input: HTMLInputElement;
    chips: HTMLElement;
    results: HTMLElement;
    pick: Pick;
    before: Before;
    brands: string[];
    brand: string;
    page: number;
    found: FoodsFound | null;
    asked: number;
};

/**
 * Milliseconds the typing has to pause before the field searches, so a word asks Open Food Facts once, not per letter.
 */
const pause: number = 300;

/**
 * Fields of the form to add a food: the name shown and the value of the food it fills.
 */
const fields: [string, keyof Food][] = [
    ["Name", "name"], ["Brand", "brand"], ["Store", "store"], ["kcal", "kcal"], ["Protein", "protein"], ["Carbs", "carbs"],
    ["Fat", "fat"], ["Portion g", "portion"],
];

/**
 * Values the form asks for every food, a product of Open Food Facts too, which brings the rest: its name, its brand
 * and the store I bought it in, so every food has all three, like `Skyr natur · K-Classic · Kaufland`, and its portion.
 */
const asked: (keyof Food)[] = ["name", "brand", "store", "portion"];

/**
 * Portion of a product without serving that the form to add it starts with, in grams.
 */
const portionUsual: number = 100;

/**
 * Each search by its element on the page, so {@link foodSearchClear} finds it.
 */
const searches: WeakMap<HTMLElement, Search> = new WeakMap();


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
 * Builds the cells of the row of a food: its name with its brand and store grey in brackets after it, like
 * `Skyr natur (K-Classic, Kaufland)`, below it small the pack of a product, like `Pack 450 g`, then its values
 * per 100 g and its portion, `none` for a product without serving, the numbers in columns; protein, carbs and fat
 * with the class `food-macro`, so a narrow place, like a meal, can leave them out.
 * - `title`: Name, and below it the pack.
 * - `name`: Name with its brand and store; cut with an ellipsis when too long, whole when pointed at.
 * - `place`: Brand and store, those known.
 *
 * @param food - Food or product
 * @param pack - Pack of a product, like `450 g`, empty for none
 * @returns Cells
 */
function cellsOf(food: Food, pack: string): HTMLElement[] {
    const title: HTMLElement = elementOf("span", "food-title", "");
    const name: HTMLElement = elementOf("span", "food-name", food.name);
    const place: string[] = [food.brand, food.store].filter((part: string): boolean => part !== "");
    if (place.length > 0)
        name.append(elementOf("span", "food-brand", ` (${place.join(", ")})`));
    name.title = name.textContent ?? "";
    title.append(name);
    if (pack !== "")
        title.append(elementOf("span", "food-pack", `Pack ${pack}`));
    return [
        title,
        elementOf("span", "food-value", amountOf(food.kcal, 0)),
        elementOf("span", "food-value food-macro", amountOf(food.protein, 1)),
        elementOf("span", "food-value food-macro", amountOf(food.carbs, 1)),
        elementOf("span", "food-value food-macro", amountOf(food.fat, 1)),
        food.portion > 0
            ? elementOf("span", "food-value", `${amountOf(food.portion, 0)} g`)
            : elementOf("span", "food-value food-value-none", "none"),
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
 * Opens the form to add a food below a row or below the + of an own food by hand, in place of any form open before:
 * name, brand, store and portion prefilled from the food given, empty where it has none, for a food by hand also
 * its values per 100 g, empty where 0, see {@link asked}.
 * Add, its check, or Enter in a field, sends the food with its brand and store; Cancel, its cross, or Escape in a field,
 * closes the form. When the reader does not take the food, like for a name another food has,
 * the form stays open and says so.
 * - `form`: The form, after the element.
 * - `inputs`: Text field of each value the form asks for.
 * - `error`: Hint that the reader did not take the food.
 * - `value`: Value as its field says, or as the food gives it when the form does not ask for it.
 * - `add`: Sends the food, the form taking no clicks meanwhile, so a double click adds it once.
 * - `save`, `cancel`: Buttons Add and Cancel.
 *
 * @param after - Row of the product, or the + of an own food by hand
 * @param food - Food whose values fill the form
 * @param byHand - Whether the food is typed by hand, so the form asks for its values too
 * @param added - Takes the food once the reader wrote it
 */
function formShow(after: HTMLElement, food: Food, byHand: boolean, added: (food: Food) => void): void {
    after.parentElement?.querySelector(".food-form")?.remove();
    const form: HTMLElement = elementOf("div", "food-form", "");
    const inputs: Map<keyof Food, HTMLInputElement> = new Map();
    const error: HTMLElement = elementOf("p", "food-error",
        "Not saved: it needs a new name, a brand and a store, numbers, and a portion above 0");
    const value: (key: keyof Food) => string = (key: keyof Food): string =>
        inputs.get(key)?.value.trim() ?? String(food[key]);
    const add: () => void = (): void => {
        form.inert = true;
        foodSend({
            name: value("name"), kcal: numberRead(value("kcal")), protein: numberRead(value("protein")),
            carbs: numberRead(value("carbs")), fat: numberRead(value("fat")), portion: numberRead(value("portion")),
            barcode: food.barcode, brand: value("brand"), store: value("store"),
        }).then(added).catch((reason: unknown): void => {
            console.error(reason);
            error.hidden = false;
            form.inert = false;
        });
    };

    fields
        .filter(([, key]: [string, keyof Food]): boolean => byHand || asked.includes(key))
        .forEach(([name, key]: [string, keyof Food]): void => {
            const word: boolean = typeof food[key] === "string";
            const label: HTMLElement = elementOf("label",
                key === "name" ? "food-field food-field-name" : word ? "food-field food-field-word" : "food-field", name);
            const input: HTMLInputElement = document.createElement("input");
            input.type = "text";
            input.autocomplete = "off";
            input.inputMode = word ? "text" : "decimal";
            input.value = food[key] === 0 ? "" : String(food[key]);
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
 * Shows the chips of the brands: `All brands`, each brand, the one picked in the grey of what is picked,
 * and the + of a brand, which turns into a field for a brand to add, see {@link brandType}.
 * A click on a chip picks its brand and searches again from the first page; the chip of a brand picked carries `×`,
 * which removes its brand, see {@link brandRemove}.
 * - `chipOf`: Makes the chip of a brand, empty for every brand.
 * - `add`: The + of a brand.
 *
 * @param search - The search
 */
function chipsShow(search: Search): void {
    const chipOf: (brand: string) => HTMLElement = (brand: string): HTMLElement => {
        if (brand !== "" && brand === search.brand)
            return pickedChipOf(search, brand);
        const chip: HTMLButtonElement = buttonOf(brand === search.brand ? "food-chip food-chip-on" : "food-chip",
            brand === "" ? "All brands" : brand, (): void => {
                search.brand = brand;
                chipsShow(search);
                resultsLoad(search, 1);
            });
        chip.setAttribute("aria-pressed", String(brand === search.brand));
        return chip;
    };
    const add: HTMLButtonElement = buttonOf("chip-button", "", (): void => brandType(search, add));
    iconPut(add, Plus, "Brand");
    search.chips.replaceChildren(chipOf(""), ...search.brands.map(chipOf), add);
}

/**
 * Makes the chip of the brand picked: its name in the grey of what is picked and `×`, which removes the brand.
 * - `chip`: The chip, holding its name and `×`.
 * - `remove`: The button `×`.
 *
 * @param search - The search
 * @param brand - The brand picked, like `Lidl`
 * @returns The chip
 */
function pickedChipOf(search: Search, brand: string): HTMLElement {
    const chip: HTMLElement = elementOf("span", "food-chip food-chip-on", brand);
    const remove: HTMLButtonElement = buttonOf("food-chip-remove", "", (): void => brandRemove(search, brand, remove));
    iconPut(remove, X, `Remove the brand ${brand}`);
    chip.append(remove);
    return chip;
}

/**
 * Removes a brand from `Brands.md`, then shows every brand again and searches again from the first page;
 * its `×` takes no second click meanwhile. A product of the brand added later brings it back.
 *
 * @param search - The search
 * @param brand - The brand, like `Lidl`
 * @param remove - Its button `×`
 */
function brandRemove(search: Search, brand: string, remove: HTMLButtonElement): void {
    remove.disabled = true;
    brandDelete(brand).then((brands: string[]): void => {
        search.brands = brands;
        search.brand = "";
        chipsShow(search);
        resultsLoad(search, 1);
    }).catch((error: unknown): void => {
        console.error(error);
        remove.disabled = false;
    });
}

/**
 * Turns the + of a brand into a field for a brand, any one, like `Spar`: Enter sends it to `Brands.md`,
 * then picks it and searches again, so it stays a chip from then on; Escape, or leaving the field empty,
 * turns it back into the chip. When the reader does not take the brand, the field stays and is marked invalid.
 * - `field`: The field, in place of the chip.
 * - `typed`: The brand typed, without spaces at its ends.
 *
 * @param search - The search
 * @param chip - The + of a brand
 */
function brandType(search: Search, chip: HTMLElement): void {
    const field: HTMLInputElement = document.createElement("input");
    field.type = "text";
    field.className = "food-chip-field";
    field.placeholder = "Brand";
    field.autocomplete = "off";
    field.setAttribute("aria-label", "Brand to add");
    field.addEventListener("keydown", (event: KeyboardEvent): void => {
        const typed: string = field.value.trim();
        if (event.key === "Escape") {
            event.preventDefault();
            event.stopPropagation();
            chipsShow(search);
        } else if (event.key === "Enter") {
            event.preventDefault();
            if (typed === "")
                return;
            field.disabled = true;
            brandSend(typed).then((brands: string[]): void => {
                search.brands = brands;
                search.brand = brands.find((brand: string): boolean => brand.toLowerCase() === typed.toLowerCase())
                    ?? brands.at(-1) ?? "";
                chipsShow(search);
                resultsLoad(search, 1);
            }).catch((error: unknown): void => {
                console.error(error);
                field.disabled = false;
                field.setAttribute("aria-invalid", "true");
            });
        }
    });
    field.addEventListener("blur", (): void => {
        if (field.value.trim() === "" && field.isConnected)
            chipsShow(search);
    });
    chip.replaceWith(field);
    field.focus();
}

/**
 * Loads the brands of the chips again and shows them, like after a product added brought its brand,
 * unless a brand is being typed into the field of the + of a brand, which would go with the chips shown anew.
 *
 * @param search - The search
 */
function brandsShow(search: Search): void {
    brandsLoad().then((brands: string[]): void => {
        search.brands = brands;
        if (search.chips.querySelector(".food-chip-field") === null)
            chipsShow(search);
    }).catch((error: unknown): void => console.error(error));
}

/**
 * Shows what the search found: the rows above my foods, see {@link Before}, the head of the columns, my foods,
 * then, for a search of some letters,
 * the products of Open Food Facts of every page loaded, under the brand picked, how many of how many,
 * like `8 of 54`, `More` while a next page holds more, and the + of an own food by hand at the end.
 * Where `pick` takes foods, a click on one of mine picks it; a click on a product opens the form to add it.
 * A food once added is searched for by its name, so it shows among my foods, and picked;
 * the chips load again, for the brand it brought.
 * - `found`: What the search found.
 * - `query`: The search as typed.
 * - `added`: Takes a food once the reader wrote it.
 * - `rows`: Rows of the results, with the names of the groups and the hints.
 * - `products`: Products shown.
 * - `taken`: Whether one of my foods found has the name of a product already, so its form adds the brand to the name.
 *
 * @param search - The search
 */
function resultsShow(search: Search): void {
    const found: FoodsFound = search.found ?? { foods: [], products: [], total: 0, exact: true, more: false };
    const query: string = search.input.value.trim();
    const added: (food: Food) => void = (food: Food): void => {
        search.input.value = food.name;
        resultsLoad(search, 1);
        brandsShow(search);
        search.pick?.(food);
    };
    const rows: HTMLElement[] = [...search.before?.(query) ?? [], headOf(), elementOf("p", "food-group", "My foods")];

    if (found.foods.length === 0)
        rows.push(elementOf("p", "food-none", query === "" ? "No foods yet" : "None of my foods matches"));
    rows.push(...found.foods.map((food: Food): HTMLElement => {
        const row: HTMLElement = search.pick === null
            ? elementOf("div", "food-row", "")
            : buttonOf("food-row", "", (): void => search.pick?.(food));
        row.append(...cellsOf(food, ""));
        return row;
    }));

    if (query !== "") {
        const products: Product[] = found.products ?? [];
        rows.push(elementOf("p", "food-group", search.brand === "" ? "Open Food Facts" : `Open Food Facts · ${search.brand}`));
        if (found.products === null)
            rows.push(elementOf("p", "food-none", "Open Food Facts cannot be reached"));
        else if (products.length === 0)
            rows.push(elementOf("p", "food-none", search.brand === "" ? "No products: type more letters"
                : `No products of ${search.brand}: type more letters, or pick All brands`));
        rows.push(...products.map((product: Product): HTMLElement => {
            const taken: boolean = found.foods.some((food: Food): boolean =>
                food.name.toLowerCase() === product.name.toLowerCase());
            const row: HTMLButtonElement = buttonOf("food-row", "", (): void => formShow(row, {
                ...product, portion: product.portion || portionUsual,
                name: taken ? `${product.name} ${product.brand || product.store}`.trim() : product.name,
            }, false, added));
            row.append(...cellsOf(product, product.pack));
            return row;
        }));
        if (products.length > 0)
            rows.push(moreOf(search, products.length, found));
    }

    const newFood: HTMLButtonElement = buttonOf("chip-button food-new", "", (): void => formShow(newFood,
        { name: query, kcal: 0, protein: 0, carbs: 0, fat: 0, portion: portionUsual, barcode: "", brand: "", store: "" },
        true, added));
    iconPut(newFood, Plus, "Own food by hand, when nothing is found");
    rows.push(newFood);
    search.results.replaceChildren(...rows);
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
        const more: HTMLButtonElement = buttonOf("food-chip", "More", (): void => {
            more.disabled = true;
            resultsLoad(search, search.page + 1);
        });
        line.append(more);
    }
    return line;
}

/**
 * Searches for the text of the field, of the brand picked, and shows what it finds, unless another search was asked
 * meanwhile, so a late answer never covers a newer one: the first page in place of what was shown,
 * a later page after the products shown, which stay when Open Food Facts cannot be reached for it.
 * - `asked`: Number of this search.
 * - `before`: What the search had found before.
 *
 * @param search - The search
 * @param page - Page of the products, 1 for the first
 */
function resultsLoad(search: Search, page: number): void {
    const asked: number = ++search.asked;
    const before: FoodsFound | null = search.found;
    foodsFind(search.input.value.trim(), search.brand, page).then((found: FoodsFound): void => {
        if (asked !== search.asked)
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
 * Builds the food search, see the top of this file, showing all my foods at first, and the chips once loaded.
 * Typing searches from the first page once it pauses for {@link pause}; Enter searches at once,
 * without sending a form around it.
 * - `element`: Field, chips and results.
 * - `search`: The search with what it shows.
 * - `waiting`: Timer of the search waiting for the pause, 0 for none.
 *
 * @param pick - Takes a food picked or added, like into a meal; `null` where no food is wanted, like in the food view
 * @param before - Builds rows to show above my foods, like the meals eaten before; `null` for none
 * @returns The search, to put into the page
 */
export function foodSearchOf(pick: Pick, before: Before): HTMLElement {
    const element: HTMLElement = elementOf("div", "food-search", "");
    const search: Search = {
        input: document.createElement("input"),
        chips: elementOf("div", "food-chips", ""),
        results: elementOf("div", "food-results", ""),
        pick: pick,
        before: before,
        brands: [],
        brand: "",
        page: 1,
        found: null,
        asked: 0,
    };
    let waiting: number = 0;

    search.input.type = "search";
    search.input.placeholder = "Search foods";
    search.input.autocomplete = "off";
    search.input.addEventListener("input", (): void => {
        clearTimeout(waiting);
        waiting = window.setTimeout((): void => resultsLoad(search, 1), pause);
    });
    search.input.addEventListener("keydown", (event: KeyboardEvent): void => {
        if (event.key !== "Enter")
            return;
        event.preventDefault();
        clearTimeout(waiting);
        resultsLoad(search, 1);
    });
    element.append(search.input, search.chips, search.results);
    searches.set(element, search);
    chipsShow(search);
    brandsShow(search);
    resultsLoad(search, 1);
    return element;
}

/**
 * Empties the field of a search and shows what an empty search finds, with the rows above my foods built anew,
 * like each time the list of a meal opens.
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
