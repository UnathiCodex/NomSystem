/**
 * ## Meals
 *
 * My meals of `Meals.md`, each only its composition, two or more of my foods without grams, servings or variants,
 * since I prepare it a little differently every time: shared by the food view, whose section lists them above
 * my foods, and by the entry by category of the day, which picks them and brings their foods at their usual portion,
 * see `../day/meal.ts`.
 * - The form of a new meal: the name of the meal, which the reader writes in one word, as all my names are,
 *   like `ChiliConCarne` of `Chili con Carne`, shown below the field as I type; its foods, each its name with its brand
 *   and store in brackets and a small grey `×`, and below them the food search, which adds one;
 *   `Cancel` and `Save`, which takes no click until the meal has a name and two foods.
 * - The row of a meal, the same in the section of the food view and in the list of the meals of an entry: its name,
 *   its foods in brackets after it by their names, and at the right what it gives at the usual portions.
 * - The section of the food view: `Meals`, then the row of each meal; a click shows its foods below it, each with
 *   its `×` while it has more than two, and the small grey plus that adds one through the food search, changed for good
 *   in `Meals.md` at once; the `×` of the meal, whose first click only asks, as the remove of the entry dialog does,
 *   the cross turning into a question mark, `Really remove?` as its tooltip. At the end of the meals, a list without
 *   a search, the small grey plus of a new meal, see `.plus-quiet` in `base.css`, which turns into the form.
 *
 * - `./foods.ts`: Loads my foods and meals, sends and removes meals, writes amounts and makes elements and buttons.
 * - `./search.ts`: The food search, which adds a food to a meal.
 * - `../icons.ts`: Puts the one plus and the one `×` into the buttons, and the question mark, their words as tooltip.
 * - `lucide`: The icon ask.
 * - `./meals.css`: Look of the form and of the section.
 */

import { amountOf, buttonOf, dishDelete, dishesLoad, dishSend, elementOf, foodNameOf } from "./foods.ts";
import { foodSearchClear, foodSearchOf } from "./search.ts";
import { crossPut, iconPut, plusPut } from "../icons.ts";
import { CircleQuestionMark } from "lucide";
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
 * Writes a name of mine as the reader writes it, in one word, each word with a capital, the rest as typed,
 * like `ChiliConCarne` of `Chili con Carne`.
 *
 * @param typed - Name as typed
 * @returns Name in one word
 */
function oneWordOf(typed: string): string {
    return typed.replace(/[|;]/g, " ").split(/\s+/).filter((word: string): boolean => word !== "")
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
 * Makes the cells of the row of a meal, the same in the food view and in the list of the meals of an entry: its name
 * with its foods in brackets after it by their names alone, as a food has its brand and store, like
 * `ChiliConCarne (Hackfleisch, Kidneybohnen, Tomaten)`, going on below where the row has no room, never cut;
 * and at the right what it gives at the usual portions, like `443 kcal`; all in one colour and one size.
 * - `name`: Its name with its foods.
 *
 * @param dish - Meal of `Meals.md`
 * @returns Its name with its foods, and its kcal
 */
export function dishCellsOf(dish: Dish): HTMLElement[] {
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
 * - `hint`, `error`: Hint while it holds fewer than two foods, and that the reader did not take it.
 * - `save`: The button `Save`.
 * - `ready`: Lets `Save` take clicks once the meal has a name and two foods.
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
    const hint: HTMLElement = elementOf("p", "dish-hint", "A meal holds two foods or more; add them below");
    const error: HTMLElement = elementOf("p", "dish-hint", "Not saved: it needs a name and two foods");
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
        hint.hidden = foods.length >= 2;
        save.disabled = name.value.trim() === "" || foods.length < 2;
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
    const search: HTMLElement = foodSearchOf((food: Food): void => {
        if (!foods.includes(lineOfFood(food)))
            foods.push(lineOfFood(food));
        foodsShow();
        foodSearchClear(search);
    }, null);

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
    form.append(name, written, rows, hint, search, error, buttons);
    foodsShow();
    return form;
}

/**
 * Builds the section of my meals in the food view, see the top of this file, loading my meals,
 * and again after every meal added, changed or removed.
 * - `section`: The section.
 * - `list`: Place of the rows of the meals and, at their end, of the plus or the form of a new meal.
 * - `dishes`: My meals.
 * - `open`: Name of the meal whose foods show, in small letters, empty for none.
 * - `adding`: Name of the meal whose food search shows, in small letters, empty for none.
 * - `asked`: Name of the meal whose `×` asked `Really remove?`, in small letters, empty for none.
 * - `form`: The form of a new meal while open, `null` for none.
 * - `load`: Loads my meals again and shows them.
 * - `change`: Sends a meal with its foods changed for good and shows my meals as the reader sends them.
 * - `formOpen`: Turns the plus into the form of a new meal.
 * - `show`: Shows the meals, then the plus or the form.
 *
 * @returns The section
 */
export function mealsSectionOf(): HTMLElement {
    const section: HTMLElement = elementOf("section", "food-dishes", "");
    const list: HTMLElement = elementOf("div", "dish-list", "");
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
    const show: () => void = (): void => {
        const rows: HTMLElement[] = dishes.flatMap((dish: Dish): HTMLElement[] => {
            const key: string = dish.name.toLowerCase();
            const line: HTMLElement = elementOf("div", "dish-line", "");
            const row: HTMLButtonElement = buttonOf("dish-row", "", (): void => {
                open = open === key ? "" : key;
                adding = "";
                show();
            });
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
                iconPut(remove, CircleQuestionMark, "Really remove?");
            row.append(...dishCellsOf(dish));
            row.setAttribute("aria-expanded", String(open === key));
            line.append(row, remove);
            if (open !== key)
                return [line];

            const detail: HTMLElement = elementOf("div", "dish-detail", "");
            detail.append(...dish.foods.map((food: string): HTMLElement => {
                const foodRow: HTMLElement = elementOf("div", "dish-food", "");
                foodRow.append(lineNameOf(food), ...dish.foods.length > 2
                    ? [removeOf(`Remove ${food.split(";")[0]}`, (): void =>
                        change(dish, dish.foods.filter((other: string): boolean => other !== food)))]
                    : []);
                return foodRow;
            }));
            if (adding === key) {
                const search: HTMLElement = foodSearchOf((food: Food): void => {
                    adding = "";
                    change(dish, [...dish.foods.filter((other: string): boolean => other !== lineOfFood(food)),
                        lineOfFood(food)]);
                }, null);
                detail.append(search);
                queueMicrotask((): void => search.querySelector("input")?.focus());
            } else
                detail.append(plusOf("Add a food", (): void => {
                    adding = key;
                    show();
                }));
            return [line, detail];
        });
        list.replaceChildren(...rows,
            ...dishes.length === 0 && form === null ? [elementOf("p", "food-none", "No meals yet")] : [],
            form ?? plusOf("New meal", formOpen));
    };

    section.append(elementOf("h2", "food-heading", "Meals"), list);
    load();
    return section;
}
