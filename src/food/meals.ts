/**
 * ## Meals
 *
 * My meals of `Meals.md`, each only its composition, one or more of my foods without grams, servings or variants,
 * since I prepare it a little differently every time. A meal goes into `Meals.md` from an entry, named in its search,
 * see `../day/meal.ts`; the food view lists my meals above my foods, where I change and remove them, and the search
 * of an entry finds them above my foods too, each with its first foods in brackets, see {@link dishNameOf}.
 * - The line of a meal, wherever it stands, is that of every list of meals or foods, see `listLineOf` in `search.ts`:
 *   its name with its first two foods grey in brackets, see {@link dishNameOf}, and what it gave the last time I ate
 *   it, a bare number under the head `My meals` and `kcal / meal`; for a meal never eaten what its foods give at the
 *   grams I logged each with last, see `dishesRead` in `reader/food.ts`.
 * - The section of the food view, built as that of my foods: `Meals`, then a search field, which shows only the meals
 *   whose name or foods hold what is typed, ignoring case and accents, see {@link dishesFound}, like `reis` finding
 *   every meal with rice; then the head and the line of each meal, the small grey `×` at its end, whose first click
 *   only asks, as the remove of the entry dialog does, the cross turning into the plain question mark,
 *   `Really remove?` as its tooltip. A click on a line opens the meal below it: on top its name, which changes in place
 *   by a click into it, as that of a food, renaming it wherever it stands, also in every entry that holds it, see
 *   `dishRename` in `reader/food.ts`; then its short title, see {@link dishNameOf}; then its foods, each with
 *   its brand and store in brackets, its standard grams, which change in place, and its `×` while the meal has more
 *   than one, ordered by their standard grams by themselves, the most first, see `rankOf` in `reader/food.ts`, so
 *   the foods that matter most stand first and show in the brackets of its line while it has no short title;
 *   right after
 *   the name of the meal the small grey plus, like `Chili con Carne +`, which opens below its foods the search of my
 *   foods and of Open Food Facts by name or barcode, as the plus of a meal in an entry does, and closes it again;
 *   a food picked, a product taken into my foods first, changed for good in `Meals.md` at once, the search staying
 *   open and empty for the next, since I mostly add many; a click on the line but on its plus closes the meal
 *   again.
 *
 * - `./foods.ts`: Loads my meals, sends and removes meals, writes amounts and makes elements and buttons.
 * - `./search.ts`: The search of my foods and of Open Food Facts, which adds a food to a meal, and the head and lines
 *   of every list.
 * - `../search.ts`: Compares the text typed in the search of the meals with their names and foods.
 * - `../icons.ts`: Puts the one plus and the one `×` into the buttons, and the plain question mark, their words
 *   as tooltip.
 * - `./meals.css`: Look of the section and of a meal opened.
 */

import {
    amountOf, bracketsWatch, buttonOf, dishDelete, dishesLoad, dishRename, dishSend, elementOf, foodNameOf,
} from "./foods.ts";
import { foodSearchOf, inlineFieldOf, listHeadOf, listLineOf } from "./search.ts";
import { crossPut, iconPut, plusPut, QuestionMark } from "../icons.ts";
import { matchesAll, wordsOf } from "../search.ts";
import "./meals.css";

import type { Dish, Food } from "./foods.ts";


/**
 * Writes the name of a meal as the reader writes it, as typed, its spaces too, a comma between two digits a point,
 * every other comma gone, since the comma parts names, and spaces in a row one, like `Chili con Carne`, see
 * `mealNameOf` in `reader/food.ts`.
 *
 * @param typed - Name as typed
 * @returns Name of the meal
 */
export function mealNameOf(typed: string): string {
    return typed.replace(/(\d),(?=\d)/g, "$1.").replace(/\s*,\s*/g, " ").replace(/[|;]/g, " ").replace(/\s+/g, " ").trim();
}

/**
 * Writes kcal as the page shows them in an entry, whole, with their unit.
 *
 * @param kcal - kcal
 * @returns Text like `520 kcal`
 */
export function kcalTextOf(kcal: number): string {
    return `${amountOf(kcal, 0)} kcal`;
}

/**
 * Makes the name of a meal as the search of an entry shows it: its name, then grey in brackets its first two foods
 * by their names, and `…` when it has more, like `Chili con Carne (Hackfleisch gemischt, Kidneybohnen, …)`, so I still
 * know what is in it, as a food has its brand and store in brackets.
 * - `name`: The name.
 * - `foods`: Names of its foods.
 *
 * @param dish - Meal of `Meals.md`
 * @returns The name
 */
export function dishNameOf(dish: Dish): HTMLElement {
    const name: HTMLElement = elementOf("span", "food-name", dish.name);
    const foods: string[] = dish.foods.map((line: string): string => line.split(";")[0]);
    name.append(elementOf("span", "food-brand", ` (${dish.short !== "" ? dish.short
        : [...foods.slice(0, 2), ...foods.length > 2 ? ["…"] : []].join(", ")})`));
    return name;
}

/**
 * Finds the meals whose name or foods hold every word typed, ignoring case and accents, see `../search.ts`,
 * like `reis` finding every meal with rice; all of them for nothing typed.
 *
 * @param dishes - My meals
 * @param typed - Text typed
 * @returns The meals found, in their order
 */
export function dishesFound(dishes: Dish[], typed: string): Dish[] {
    return dishes.filter((dish: Dish): boolean => matchesAll([dish.name,
        ...dish.foods.map((line: string): string => line.split(";")[0])].join(" "), wordsOf(typed)));
}

/**
 * Makes the one plus of every list that adds one more, see `plusPut` in `../icons.ts`, its words as tooltip.
 * - `button`: The +.
 *
 * @param words - What it adds, like `Add a food to Chili con Carne`
 * @param click - What a click does
 * @returns The +
 */
function plusOf(words: string, click: () => void): HTMLButtonElement {
    const button: HTMLButtonElement = buttonOf("", "", click);
    plusPut(button, words);
    return button;
}

/**
 * Makes the one `×` of every list that takes a value back, see `crossPut` in `../icons.ts`, its words as tooltip.
 * - `button`: The ×.
 *
 * @param words - What it removes, like `Remove Hackfleisch`
 * @param click - What a click does
 * @returns The ×
 */
function removeOf(words: string, click: () => void): HTMLButtonElement {
    const button: HTMLButtonElement = buttonOf("", "", click);
    crossPut(button, words);
    return button;
}

/**
 * Makes the line of a food of a meal opened: its name with its brand and store in brackets, see `foodNameOf`
 * in `./foods.ts`, its standard grams, which change in place by a click into them, and its `×` where given.
 * - `part`: The line.
 * - `name`, `brand`, `store`: The parts of the food.
 * - `amount`: Its grams with their unit.
 *
 * @param food - Food of the meal, like `Hackfleisch;Gut & Günstig;Edeka`
 * @param grams - Field of its standard grams, see {@link gramsFieldOf}
 * @param remove - Its `×`, `null` while it is the only food of the meal
 * @returns The line
 */
function partOf(food: string, grams: HTMLInputElement, remove: HTMLButtonElement | null): HTMLElement {
    const part: HTMLElement = elementOf("div", "food-part", "");
    const [name, brand, store]: string[] = food.split(";");
    const amount: HTMLElement = elementOf("span", "food-value food-grams", "");
    amount.append(grams, " g");
    part.append(foodNameOf("food-name", name, brand ?? "", store ?? ""), amount);
    if (remove !== null)
        part.append(remove);
    return part;
}

/**
 * Makes the field of the standard grams of a food of a meal opened, see {@link inlineFieldOf}: plain as every value,
 * a click puts the cursor into it, Enter or leaving it saves a change; empty for none set, 0 for a food I rarely put
 * in; a text that is no number of 0 or more takes nothing and shows the grams again.
 * - `input`: The field.
 * - `typed`: The grams typed, `null` for none, not a number for an unreadable text.
 *
 * @param grams - Its standard grams, `null` for none
 * @param name - Name of the food, for screen readers
 * @param saved - Takes the grams typed, `null` for none
 * @returns The field
 */
function gramsFieldOf(grams: number | null, name: string, saved: (grams: number | null) => void): HTMLInputElement {
    const input: HTMLInputElement = inlineFieldOf(grams === null ? "" : String(grams), `Grams of ${name}`, (): void => {
        const text: string = input.value.trim().replace(",", ".");
        const typed: number | null = text === "" ? null : Number(text);
        if (typed !== null && !(typed >= 0)) {
            input.value = grams === null ? "" : String(grams);
            return;
        }
        saved(typed);
    });
    input.inputMode = "decimal";
    input.classList.add("food-inline-grams");
    return input;
}

/**
 * Builds the section of my meals in the food view, see the top of this file, loading my meals,
 * and again after every meal changed or removed.
 * - `section`: The section.
 * - `search`: The search field of the meals, `Search meals` grey in it while empty.
 * - `list`: Place of the head and the lines of the meals.
 * - `dishes`: My meals.
 * - `open`: Name of the meal opened, in small letters, empty for none.
 * - `adding`: Name of the meal whose search of my foods shows, in small letters, empty for none.
 * - `asked`: Name of the meal whose `×` asked `Really remove?`, in small letters, empty for none.
 * - `load`: Loads my meals again and shows them.
 * - `change`: Sends a meal with its foods changed for good and shows my meals as the reader sends them.
 * - `toggle`: Opens a meal, or closes it again, its search of my foods with it.
 * - `show`: Shows the meals found for the words typed in the search, all of them for none typed, or a hint when none
 *   is found; the row of the meal opened no button but a row that a click closes again, since its plus stands inside it.
 * - `shown`: The meals found.
 *
 * @returns The section
 */
export function mealsSectionOf(): HTMLElement {
    const section: HTMLElement = elementOf("section", "food-dishes", "");
    const search: HTMLInputElement = document.createElement("input");
    const list: HTMLElement = elementOf("div", "dish-list", "");
    bracketsWatch(list);
    let dishes: Dish[] = [];
    let open: string = "";
    let adding: string = "";
    let asked: string = "";

    const load: () => void = (): void => {
        dishesLoad().then((meals: Dish[]): void => {
            dishes = meals;
            show();
        }).catch((error: unknown): void => {
            console.error(error);
            list.replaceChildren(elementOf("p", "food-none", "The meals cannot be read"));
        });
    };
    const send: (dish: Dish, foods: string[], short: string, grams: (number | null)[]) => void = (dish: Dish,
        foods: string[], short: string, grams: (number | null)[]): void => {
        dishSend(dish.name, foods, short, grams).then((meals: Dish[]): void => {
            dishes = meals;
            show();
        }).catch((error: unknown): void => console.error(error));
    };
    const change: (dish: Dish, foods: string[]) => void = (dish: Dish, foods: string[]): void => {
        dishSend(dish.name, foods).then((meals: Dish[]): void => {
            dishes = meals;
            show();
        }).catch((error: unknown): void => console.error(error));
    };
    const toggle: (key: string) => void = (key: string): void => {
        open = open === key ? "" : key;
        adding = "";
        show();
    };
    const show: () => void = (): void => {
        const shown: Dish[] = dishesFound(dishes, search.value);
        const rows: HTMLElement[] = shown.flatMap((dish: Dish): HTMLElement[] => {
            const key: string = dish.name.toLowerCase();
            const name: HTMLElement = open === key ? elementOf("span", "food-name", dish.name) : dishNameOf(dish);
            const remove: HTMLButtonElement = removeOf(`Remove ${dish.name}`, (): void => {
                if (asked !== key) {
                    asked = key;
                    show();
                    return;
                }
                asked = "";
                dishDelete(dish.name).then((meals: Dish[]): void => {
                    dishes = meals;
                    show();
                }).catch((error: unknown): void => console.error(error));
            });
            const [line, row]: [HTMLElement, HTMLElement] = listLineOf(name, dish.kcal,
                open === key ? null : (): void => toggle(key), remove);
            if (asked === key)
                iconPut(remove, QuestionMark, "Really remove?");
            row.setAttribute("aria-expanded", String(open === key));
            if (open !== key)
                return [line];

            name.append(plusOf(`Add a food to ${dish.name}`, (): void => {
                adding = adding === key ? "" : key;
                show();
            }));
            row.addEventListener("click", (event: MouseEvent): void => {
                if ((event.target as HTMLElement).closest("button") === null)
                    toggle(key);
            });
            const detail: HTMLElement = elementOf("div", "food-detail", "");
            const facts: HTMLElement = elementOf("div", "food-facts", "");
            const error: HTMLElement = elementOf("p", "food-error",
                "Not changed: it needs a name, and no other meal of mine may have it");
            const rename: HTMLInputElement = inlineFieldOf(dish.name, "Name", (): void => {
                detail.inert = true;
                dishRename(dish.name, rename.value).then((meals: Dish[]): void => {
                    dishes = meals;
                    open = mealNameOf(rename.value).toLowerCase();
                    show();
                }).catch((reason: unknown): void => {
                    console.error(reason);
                    error.hidden = false;
                    detail.inert = false;
                });
            });
            const short: HTMLInputElement = inlineFieldOf(dish.short, "Short", (): void =>
                send(dish, dish.foods, short.value, dish.standard));
            const parts: HTMLElement = elementOf("div", "dish-foods", "");
            facts.append(elementOf("span", "food-fact", "Name"), rename, elementOf("span", "food-fact", "Short"), short,
                elementOf("span", "food-fact", "Foods"), parts);
            error.hidden = true;
            detail.append(facts, error);
            parts.append(...dish.foods.map((food: string, index: number): HTMLElement => {
                const grams: HTMLInputElement = gramsFieldOf(dish.standard[index] ?? null, food.split(";")[0],
                    (typed: number | null): void => send(dish, dish.foods, dish.short,
                        dish.standard.map((other: number | null, at: number): number | null => at === index ? typed : other)));
                const part: HTMLElement = partOf(food, grams, dish.foods.length > 1
                    ? removeOf(`Remove ${food.split(";")[0]}`, (): void =>
                        change(dish, dish.foods.filter((other: string): boolean => other !== food)))
                    : null);
                return part;
            }));
            if (adding === key) {
                const foods: HTMLElement = foodSearchOf({
                    pick: (food: Food): void => {
                        const added: string = `${food.name};${food.brand};${food.store}`;
                        change(dish, [...dish.foods.filter((other: string): boolean => other !== added), added]);
                    },
                    meals: null,
                    products: true,
                    nothing: "Nothing found",
                });
                parts.append(foods);
                queueMicrotask((): void => foods.querySelector("input")?.focus());
            }
            return [line, detail];
        });
        list.replaceChildren(...shown.length > 0 ? [listHeadOf("My meals", "kcal / meal"), ...rows] : [],
            ...dishes.length === 0 ? [elementOf("p", "food-none", "No meals yet")] : [],
            ...dishes.length > 0 && shown.length === 0 ? [elementOf("p", "food-none", "None of my meals matches")] : []);
    };

    search.type = "search";
    search.className = "dish-search";
    search.placeholder = "Search meals";
    search.autocomplete = "off";
    search.setAttribute("aria-label", "Search meals");
    search.addEventListener("input", show);
    section.append(elementOf("h2", "food-heading", "Meals"), search, list);
    load();
    return section;
}
