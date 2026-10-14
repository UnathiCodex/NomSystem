/**
 * ## Meals
 *
 * My meals of `Meals.md`, each only its composition, one or more of my foods without grams, servings or variants,
 * since I prepare it a little differently every time: shared by the food view, whose section lists them above
 * my foods, and by the entry by category of the day, whose search finds them above my foods, see `../day/meal.ts`.
 * - The form of a new meal: the name of the meal, which the reader writes in one word, as all my names are,
 *   like `ChiliConCarne` of `Chili con Carne`, shown below the field as I type; its foods, each its name with its brand
 *   and store in brackets and a small grey `×`, and below them the food search, which adds one;
 *   `Cancel` and `Save`, which takes no click until the meal has a name and a food.
 * - The row of a meal in the section of the food view: its name, its foods in brackets after it by their names,
 *   and at the right what it gave the last time I ate it, see `dishesRead` in `reader/food.ts`.
 * - The section of the food view: `Meals`, then a search field, as the foods have one, which shows only the meals
 *   whose name or foods hold what is typed, ignoring case and accents, see {@link dishesFound}, like `reis` finding
 *   every meal with rice; then the row of each meal; a click shows its foods below it, each with
 *   its `×` while it has more than one, and right after its name the small grey plus, like `ChiliConCarne +`, which
 *   opens the food search below its foods and closes it again, a food picked changed for good in `Meals.md` at once;
 *   a click on the row but on its plus hides its foods again; the `×` of the meal, whose first click only asks,
 *   as the remove of the entry dialog does,
 *   the cross turning into a question mark, `Really remove?` as its tooltip. Right after the name `Meals` the one plus
 *   of a new meal, see `plusPut` in `../icons.ts`, as every plus stands right after what it adds to, which opens
 *   the form at the end of the meals.
 *
 * - `./foods.ts`: Loads my foods and meals, sends and removes meals, writes amounts and makes elements and buttons.
 * - `./search.ts`: The food search, which adds a food to a meal.
 * - `../search.ts`: Compares the text typed in the search of the meals with their names and foods.
 * - `../icons.ts`: Puts the one plus and the one `×` into the buttons, and the plain question mark, their words
 *   as tooltip.
 * - `./meals.css`: Look of the form and of the section.
 */

import { amountOf, bracketsWatch, buttonOf, dishDelete, dishesLoad, dishSend, elementOf, foodNameOf } from "./foods.ts";
import { foodSearchClear, foodSearchOf } from "./search.ts";
import { crossPut, iconPut, plusPut, QuestionMark } from "../icons.ts";
import { matchesAll, wordsOf } from "../search.ts";
import "./meals.css";

import type { Dish, Food } from "./foods.ts";


/**
 * What the form of a new meal tells.
 *
 * - `name`: Name the field starts with, as typed in a search, empty for none.
 * - `saved`: Takes my meals once the reader wrote the meal, and its name in small letters.
 * - `cancelled`: Comes on `Cancel`.
 */
type FormSetup = {
    name: string;
    saved: (dishes: Dish[], name: string) => void;
    cancelled: () => void;
};


/**
 * Writes a name of mine as the reader writes it, in one word, each word with a capital, the rest as typed, a comma
 * between two digits a point and every other comma gone, since the comma parts names, like `ChiliConCarne`
 * of `Chili con Carne`, see `oneWordOf` in `reader/food.ts`.
 *
 * @param typed - Name as typed
 * @returns Name in one word
 */
function oneWordOf(typed: string): string {
    return typed.replace(/(\d),(?=\d)/g, "$1.").replace(/[|;,]/g, " ").split(/\s+/)
        .filter((word: string): boolean => word !== "")
        .map((word: string): string => word.charAt(0).toUpperCase() + word.slice(1)).join("");
}

/**
 * Writes kcal as the page shows them, whole.
 *
 * @param kcal - kcal
 * @returns Text like `520 kcal`
 */
export function kcalTextOf(kcal: number): string {
    return `${amountOf(kcal, 0)} kcal`;
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
 * Makes the cells of the row of a meal in the food view: its name with its foods in brackets after it by their names
 * alone, as a food has its brand and store, like `ChiliConCarne (Hackfleisch, Kidneybohnen, Tomaten)`, going on below
 * where the row has no room, never cut; and at the right what it gave the last time I ate it, like `443 kcal`;
 * all in one colour and one size.
 * - `name`: Its name with its foods.
 *
 * @param dish - Meal of `Meals.md`
 * @returns Its name with its foods, and its kcal
 */
function dishCellsOf(dish: Dish): HTMLElement[] {
    const name: HTMLElement = elementOf("span", "dish-name", dish.name);
    name.append(elementOf("span", "dish-parts",
        ` (${dish.foods.map((line: string): string => line.split(";")[0]).join(", ")})`));
    return [name, elementOf("span", "dish-meta", kcalTextOf(dish.kcal))];
}

/**
 * Writes a food of a meal by its name, brand and store, the line `Meals.md` keeps of it.
 *
 * @param food - Food of `Foods.md`
 * @returns Line like `Hackfleisch;Gut & Günstig;Edeka`
 */
function lineOfFood(food: Food): string {
    return `${food.name};${food.brand};${food.store}`;
}

/**
 * Makes the name of a food of a meal, see `foodNameOf` in `./foods.ts`, like `Hackfleisch (Gut & Günstig, Edeka)`.
 * - `name`, `brand`, `store`: The parts of the line.
 *
 * @param line - Food of a meal, like `Hackfleisch;Gut & Günstig;Edeka`
 * @returns The name
 */
function lineNameOf(line: string): HTMLElement {
    const [name, brand, store]: string[] = line.split(";");
    return foodNameOf("dish-name", name, brand ?? "", store ?? "");
}

/**
 * Makes the one plus of every list that adds one more, see `plusPut` in `../icons.ts`, its words as tooltip.
 * - `button`: The +.
 *
 * @param words - What it adds, like `New meal`
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
 * Builds the form of a new meal, see the top of this file. When the reader does not take it, the form stays and
 * says so.
 * - `foods`: Its foods so far, see {@link lineOfFood}.
 * - `name`: Field of the name of the meal, `Name of the meal` grey in it while empty.
 * - `written`: The name in one word, as the reader writes it, below the field.
 * - `rows`: Rows of the foods.
 * - `error`: Hint that the reader did not take it.
 * - `save`: The button `Save`.
 * - `ready`: Lets `Save` take clicks once the meal has a name and a food.
 * - `foodsShow`: Shows the rows of the foods.
 * - `search`: The food search, which adds a food.
 *
 * @param setup - What the form starts with and what it tells
 * @returns The form
 */
export function mealFormOf(setup: FormSetup): HTMLElement {
    let foods: string[] = [];
    const form: HTMLElement = elementOf("div", "dish-form", "");
    const name: HTMLInputElement = document.createElement("input");
    const written: HTMLElement = elementOf("p", "dish-hint", "");
    const rows: HTMLElement = elementOf("div", "dish-foods", "");
    bracketsWatch(rows);
    const error: HTMLElement = elementOf("p", "dish-hint", "Not saved: it needs a name and a food");
    const buttons: HTMLElement = elementOf("div", "dish-buttons", "");
    const save: HTMLButtonElement = buttonOf("dish-save", "Save meal", (): void => {
        save.disabled = true;
        dishSend(name.value.trim(), foods)
            .then((dishes: Dish[]): void => setup.saved(dishes, oneWordOf(name.value).toLowerCase()))
            .catch((reason: unknown): void => {
                console.error(reason);
                error.hidden = false;
                ready();
            });
    });
    const ready: () => void = (): void => {
        written.textContent = oneWordOf(name.value) === name.value.trim() || name.value.trim() === ""
            ? "" : `Saved as ${oneWordOf(name.value)}`;
        save.disabled = name.value.trim() === "" || foods.length === 0;
    };
    const foodsShow: () => void = (): void => {
        rows.replaceChildren(...foods.map((line: string): HTMLElement => {
            const row: HTMLElement = elementOf("div", "dish-food", "");
            row.append(lineNameOf(line), removeOf(`Remove ${line.split(";")[0]}`, (): void => {
                foods = foods.filter((other: string): boolean => other !== line);
                foodsShow();
            }));
            return row;
        }));
        ready();
    };
    const search: HTMLElement = foodSearchOf({
        pick: (food: Food): void => {
            if (!foods.includes(lineOfFood(food)))
                foods.push(lineOfFood(food));
            foodsShow();
            foodSearchClear(search);
        },
        before: null,
        products: true,
        nothing: "Nothing found; the plus beside Foods adds a food by hand",
    });

    name.type = "text";
    name.className = "dish-field";
    name.autocomplete = "off";
    name.value = setup.name;
    name.placeholder = "Name of the meal";
    name.setAttribute("aria-label", "Name of the meal");
    name.addEventListener("keydown", (event: KeyboardEvent): void => {
        if (event.key === "Enter")
            event.preventDefault();
    });
    name.addEventListener("input", (): void => {
        error.hidden = true;
        ready();
    });
    error.hidden = true;
    buttons.append(buttonOf("", "Cancel", setup.cancelled), save);
    form.append(name, written, rows, search, error, buttons);
    foodsShow();
    return form;
}

/**
 * Builds the section of my meals in the food view, see the top of this file, loading my meals,
 * and again after every meal added, changed or removed.
 * - `section`: The section.
 * - `search`: The search field of the meals, `Search meals` grey in it while empty.
 * - `list`: Place of the rows of the meals and, at their end, of the form of a new meal while open.
 * - `dishes`: My meals.
 * - `open`: Name of the meal whose foods show, in small letters, empty for none.
 * - `adding`: Name of the meal whose food search shows, in small letters, empty for none.
 * - `asked`: Name of the meal whose `×` asked `Really remove?`, in small letters, empty for none.
 * - `form`: The form of a new meal while open, `null` for none.
 * - `toggle`: Shows the foods of a meal, or hides them again, its food search with them.
 * - `load`: Loads my meals again and shows them.
 * - `change`: Sends a meal with its foods changed for good and shows my meals as the reader sends them.
 * - `formOpen`: Opens the form of a new meal at the end of the meals.
 * - `heading`: The name `Meals` with its plus.
 * - `show`: Shows the meals whose name or foods hold the words typed in the search, all of them for none typed,
 *   or a hint when none does, then the form while open; the row of the meal whose foods show no button but a row
 *   that a click hides again, see `rowOf` in `../day/choices.ts`, since its plus stands inside it, right after its name.
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
    let form: HTMLElement | null = null;

    const load: () => void = (): void => {
        dishesLoad().then((meals: Dish[]): void => {
            dishes = meals;
            show();
        }).catch((error: unknown): void => {
            console.error(error);
            list.replaceChildren(elementOf("p", "food-none", "The meals cannot be read"));
        });
    };
    const change: (dish: Dish, foods: string[]) => void = (dish: Dish, foods: string[]): void => {
        dishSend(dish.name, foods).then((meals: Dish[]): void => {
            dishes = meals;
            show();
        }).catch((error: unknown): void => console.error(error));
    };
    const formOpen: () => void = (): void => {
        const opened: HTMLElement = mealFormOf({
            name: "",
            saved: (meals: Dish[], saved: string): void => {
                dishes = meals;
                open = saved;
                form = null;
                show();
            },
            cancelled: (): void => {
                form = null;
                show();
            },
        });
        form = opened;
        show();
        opened.querySelector("input")?.focus();
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
            const line: HTMLElement = elementOf("div", "dish-line", "");
            const cells: HTMLElement[] = dishCellsOf(dish);
            const row: HTMLElement = open === key ? elementOf("div", "dish-row", "")
                : buttonOf("dish-row", "", (): void => toggle(key));
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
            if (asked === key)
                iconPut(remove, QuestionMark, "Really remove?");
            row.append(...cells);
            row.setAttribute("aria-expanded", String(open === key));
            line.append(row, remove);
            if (open !== key)
                return [line];

            cells[0].append(plusOf(`Add a food to ${dish.name}`, (): void => {
                adding = adding === key ? "" : key;
                show();
            }));
            row.addEventListener("click", (event: MouseEvent): void => {
                if ((event.target as HTMLElement).closest("button") === null)
                    toggle(key);
            });

            const detail: HTMLElement = elementOf("div", "dish-detail", "");
            detail.append(...dish.foods.map((food: string): HTMLElement => {
                const foodRow: HTMLElement = elementOf("div", "dish-food", "");
                foodRow.append(lineNameOf(food), ...dish.foods.length > 1
                    ? [removeOf(`Remove ${food.split(";")[0]}`, (): void =>
                        change(dish, dish.foods.filter((other: string): boolean => other !== food)))]
                    : []);
                return foodRow;
            }));
            if (adding === key) {
                const search: HTMLElement = foodSearchOf({
                    pick: (food: Food): void => {
                        adding = "";
                        change(dish, [...dish.foods.filter((other: string): boolean => other !== lineOfFood(food)),
                            lineOfFood(food)]);
                    },
                    before: null,
                    products: true,
                    nothing: "Nothing found; the plus beside Foods adds a food by hand",
                });
                detail.append(search);
                queueMicrotask((): void => search.querySelector("input")?.focus());
            }
            return [line, detail];
        });
        list.replaceChildren(...rows,
            ...dishes.length === 0 && form === null ? [elementOf("p", "food-none", "No meals yet")] : [],
            ...dishes.length > 0 && shown.length === 0 ? [elementOf("p", "food-none", "None of my meals matches")] : [],
            ...form === null ? [] : [form]);
    };
    const heading: HTMLElement = elementOf("h2", "food-heading", "Meals");

    heading.append(plusOf("New meal", formOpen));
    search.type = "search";
    search.className = "dish-search";
    search.placeholder = "Search meals";
    search.autocomplete = "off";
    search.setAttribute("aria-label", "Search meals");
    search.addEventListener("input", show);
    section.append(heading, search, list);
    load();
    return section;
}
