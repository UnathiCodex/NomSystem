/**
 * ## Meals
 *
 * My meals of `Meals.md`, each made of two or more of my foods, in variants as I made it: shared by the food view,
 * whose section lists them with their variants above my foods, and by the entry by category of the day, which picks
 * them, see `../day/meal.ts`.
 * - The form of a new meal or a new variant: the name of the meal, which the reader writes in one word, as all my names
 *   are, like `ChiliConCarne` of `Chili con Carne`, shown below the field as I type; for a new variant the name
 *   of its meal alone, not to change; a note of the variant, like `mit Mais`, empty for none; how many servings
 *   the whole gives, like 4 for a pot; its foods, each with its grams for the whole, its kcal and `×`, and below them
 *   the food search, which adds one; `Cancel` and `Save`, which takes no click until the meal has a name and two foods.
 *   A new variant starts as a copy of the latest, to change what was different that time. Saved, the reader writes it
 *   into `Meals.md`, named by today and its note, like `13.10.2026 · MitMais`, see `reader/food.ts`.
 * - The section of the food view: `Meals` with its + for a new meal, the square + of the page, see `.chip-button`
 *   in `base.css`, then a row per meal: its name, how many variants
 *   and the kcal of a serving of the latest; a click shows below it its variants, the latest first, each its name,
 *   its servings and the kcal of a serving, its foods below, and `×`, whose first click only asks, as the remove of the entry
 *   dialog does, the cross turning into a question mark, `Really remove?` as its tooltip; then its + for a new variant.
 *
 * - `./foods.ts`: Loads my foods and meals, sends and removes variants, writes amounts and makes elements.
 * - `./search.ts`: The food search, which adds a food to the form.
 * - `../icons.ts`: Puts the icons into the buttons, their words as tooltip.
 * - `lucide`: The icons remove, ask and add.
 * - `./meals.css`: Look of the form and of the section.
 */

import { amountOf, dishDelete, dishesLoad, dishSend, elementOf, foodsFind } from "./foods.ts";
import { foodSearchClear, foodSearchOf } from "./search.ts";
import { iconPut } from "../icons.ts";
import { CircleQuestionMark, Plus, X } from "lucide";
import "./meals.css";

import type { Dish, Food, FoodsFound, Variant } from "./foods.ts";


/**
 * A food of a variant in the form: its name in `Foods.md` and its grams for the whole as typed, empty for its usual
 * portion.
 */
type DraftFood = {
    name: string;
    grams: string;
};

/**
 * What the form of a new meal or variant starts with and what it tells.
 *
 * - `name`: Name of the meal, empty for a new meal typed in the form.
 * - `fixed`: Whether the name is that of a meal of mine, which gets a new variant, so it cannot change.
 * - `servings`: Servings the whole gives at first.
 * - `foods`: Foods at first, lines of a food and its grams for the whole, like `Hackfleisch;500`.
 * - `mine`: My foods by their names in small letters, for their kcal, with every food added since.
 * - `saved`: Takes my meals once the reader wrote the variant, and the name of its meal in small letters.
 * - `cancelled`: Comes on `Cancel`.
 */
type FormSetup = {
    name: string;
    fixed: boolean;
    servings: number;
    foods: string[];
    mine: Map<string, Food>;
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
export function oneWordOf(typed: string): string {
    return typed.replace(/[|;]/g, " ").split(/\s+/).filter((word: string): boolean => word !== "")
        .map((word: string): string => word.charAt(0).toUpperCase() + word.slice(1)).join("");
}

/**
 * Turns a line of a food of a variant, like `Hackfleisch;500` or `Zwiebel`, into a food of the form.
 *
 * @param line - Line of a food and its grams for the whole
 * @returns Food of the form
 */
function draftOf(line: string): DraftFood {
    const [name, grams]: string[] = line.split(";");
    return { name: name.trim(), grams: (grams ?? "").trim() };
}

/**
 * Writes the foods of a variant with their grams for the whole, like `Hackfleisch 500 g, Zwiebel`.
 *
 * @param foods - Lines of foods and their grams for the whole
 * @returns Text
 */
export function variantTextOf(foods: string[]): string {
    return foods.map(draftOf)
        .map((food: DraftFood): string => food.grams === "" ? food.name : `${food.name} ${food.grams} g`).join(", ");
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
 * Tells what a food of the form gives: its grams for the whole, or its usual portion when none are typed,
 * times its kcal per 100 g.
 * - `food`: The food in `Foods.md`, `undefined` for one it does not hold.
 * - `grams`: Grams counted.
 *
 * @param draft - Food of the form
 * @param mine - My foods by their names in small letters
 * @returns kcal; 0 for a food not in `Foods.md` or grams that are no number
 */
function draftKcalOf(draft: DraftFood, mine: Map<string, Food>): number {
    const food: Food | undefined = mine.get(draft.name.toLowerCase());
    const grams: number = draft.grams === "" ? food?.portion ?? 0 : Number(draft.grams.replace(",", "."));
    return Number.isFinite(grams) ? grams / 100 * (food?.kcal ?? 0) : 0;
}

/**
 * Makes a button that does not send the form of a dialog around it.
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
 * Makes a + of the page, see `.chip-button` in `base.css`: the square button with the icon plus, its words as tooltip.
 * - `button`: The +.
 *
 * @param words - What it adds, like `New variant`
 * @param click - What a click does
 * @returns The +
 */
function plusOf(words: string, click: () => void): HTMLButtonElement {
    const button: HTMLButtonElement = buttonOf("chip-button", "", click);
    iconPut(button, Plus, words);
    return button;
}

/**
 * Makes a text field of the form, one chip high, Enter in it sending no form around it.
 *
 * @param value - Text at first
 * @param placeholder - Example shown grey while it is empty
 * @param name - Words for screen readers
 * @returns The field
 */
function fieldOf(value: string, placeholder: string, name: string): HTMLInputElement {
    const field: HTMLInputElement = document.createElement("input");
    field.type = "text";
    field.className = "dish-field";
    field.autocomplete = "off";
    field.value = value;
    field.placeholder = placeholder;
    field.setAttribute("aria-label", name);
    field.addEventListener("keydown", (event: KeyboardEvent): void => {
        if (event.key === "Enter")
            event.preventDefault();
    });
    return field;
}

/**
 * Builds the form of a new meal or a new variant, see the top of this file. When the reader does not take it,
 * the form stays and says so.
 * - `draft`: Foods of the variant.
 * - `name`: Field of the name of a new meal; for a new variant only its name as heading.
 * - `written`: The name in one word, as the reader writes it, below the field.
 * - `note`, `servings`: Fields of the note and of the servings.
 * - `rows`: Rows of the foods.
 * - `hint`, `error`: Hint while it holds fewer than two foods, and that the reader did not take it.
 * - `save`: The button `Save`.
 * - `ready`: Lets `Save` take clicks once the meal has a name, servings of 1 or more and two foods.
 * - `draftShow`: Shows the rows of the foods.
 * - `search`: The food search, which adds a food.
 *
 * @param setup - What the form starts with and what it tells
 * @returns The form
 */
export function mealFormOf(setup: FormSetup): HTMLElement {
    let draft: DraftFood[] = setup.foods.map(draftOf);
    const form: HTMLElement = elementOf("div", "dish-form", "");
    const name: HTMLInputElement = fieldOf(setup.name, "Name of the meal, like Chili con Carne", "Name of the meal");
    const written: HTMLElement = elementOf("p", "dish-hint", "");
    const note: HTMLInputElement = fieldOf("", "Note of this variant, like mit Mais", "Note of the variant");
    const servings: HTMLInputElement = fieldOf(String(setup.servings), "", "Servings the whole gives");
    const servingsLabel: HTMLElement = elementOf("label", "dish-number", "");
    const rows: HTMLElement = elementOf("div", "dish-foods", "");
    const hint: HTMLElement = elementOf("p", "dish-hint", "A meal holds two foods or more; add them below");
    const error: HTMLElement = elementOf("p", "dish-hint", "Not saved: it needs a name, servings and two foods");
    const buttons: HTMLElement = elementOf("div", "dish-buttons", "");
    const save: HTMLButtonElement = buttonOf("dish-save", setup.fixed ? "Save variant" : "Save meal", (): void => {
        save.disabled = true;
        dishSend(name.value.trim(), note.value.trim(), Number(servings.value.replace(",", ".")),
            draft.map((food: DraftFood): string =>
                food.grams === "" ? food.name : `${food.name};${food.grams.replace(",", ".")}`))
            .then((dishes: Dish[]): void => setup.saved(dishes, oneWordOf(name.value).toLowerCase()))
            .catch((reason: unknown): void => {
                console.error(reason);
                error.hidden = false;
                ready();
            });
    });
    const ready: () => void = (): void => {
        const count: number = Number(servings.value.replace(",", "."));
        written.textContent = oneWordOf(name.value) === name.value.trim() || name.value.trim() === ""
            ? "" : `Saved as ${oneWordOf(name.value)}`;
        hint.hidden = draft.length >= 2;
        servings.setCustomValidity(Number.isFinite(count) && count >= 1 ? "" : "A number of 1 or more");
        save.disabled = name.value.trim() === "" || draft.length < 2 || !(Number.isFinite(count) && count >= 1);
    };
    const draftShow: () => void = (): void => {
        rows.replaceChildren(...draft.map((food: DraftFood): HTMLElement => {
            const row: HTMLElement = elementOf("div", "dish-food", "");
            const known: Food | undefined = setup.mine.get(food.name.toLowerCase());
            const kcal: HTMLElement = elementOf("span", "dish-kcal", kcalTextOf(draftKcalOf(food, setup.mine)));
            const grams: HTMLElement = elementOf("label", "dish-number", "");
            const input: HTMLInputElement = fieldOf(food.grams, known === undefined ? "" : amountOf(known.portion, 0),
                `Grams of ${food.name} for the whole`);
            const remove: HTMLButtonElement = buttonOf("dish-remove", "", (): void => {
                draft = draft.filter((other: DraftFood): boolean => other !== food);
                draftShow();
            });
            input.inputMode = "decimal";
            input.addEventListener("input", (): void => {
                food.grams = input.value.trim();
                kcal.textContent = kcalTextOf(draftKcalOf(food, setup.mine));
            });
            grams.append(input, " g");
            iconPut(remove, X, `Remove ${food.name}`);
            row.append(elementOf("span", "dish-name", food.name), grams, kcal, remove);
            return row;
        }));
        ready();
    };
    const search: HTMLElement = foodSearchOf((food: Food): void => {
        setup.mine.set(food.name.toLowerCase(), food);
        if (!draft.some((other: DraftFood): boolean => other.name.toLowerCase() === food.name.toLowerCase()))
            draft.push({ name: food.name, grams: "" });
        draftShow();
        foodSearchClear(search);
    }, null);

    servings.inputMode = "decimal";
    servingsLabel.append(servings, " servings the whole gives");
    name.addEventListener("input", (): void => {
        error.hidden = true;
        ready();
    });
    servings.addEventListener("input", ready);
    error.hidden = true;
    buttons.append(buttonOf("", "Cancel", setup.cancelled), save);
    form.append(...setup.fixed ? [elementOf("p", "dish-title", `New variant of ${setup.name}`)] : [name, written],
        note, servingsLabel, rows, hint, search, error, buttons);
    draftShow();
    return form;
}

/**
 * Builds the section of my meals in the food view, see the top of this file, loading my meals and my foods,
 * and again after every variant added or removed.
 * - `section`: The section.
 * - `list`: Place of the form of a new meal and of the rows of the meals.
 * - `dishes`, `mine`: My meals, and my foods by their names in small letters.
 * - `open`: Name of the meal whose variants show, in small letters, empty for none.
 * - `asked`: Meal and variant whose `×` asked `Really remove?`, empty for none.
 * - `form`: The form open, `null` for none.
 * - `load`: Loads my meals and foods again and shows them.
 * - `show`: Shows the form open and the meals.
 * - `formOpen`: Opens a form in place of any other, for a new meal or a new variant.
 *
 * @returns The section
 */
export function mealsSectionOf(): HTMLElement {
    const section: HTMLElement = elementOf("section", "food-dishes", "");
    const head: HTMLElement = elementOf("div", "dish-head", "");
    const list: HTMLElement = elementOf("div", "dish-list", "");
    const newMeal: HTMLButtonElement = plusOf("New meal", (): void => formOpen("", false, 1, []));
    let dishes: Dish[] = [];
    let mine: Map<string, Food> = new Map();
    let open: string = "";
    let asked: string = "";
    let form: HTMLElement | null = null;

    const load: () => void = (): void => {
        Promise.all([dishesLoad(), foodsFind("", "", 1)]).then(([meals, found]: [Dish[], FoodsFound]): void => {
            dishes = meals;
            mine = new Map(found.foods.map((food: Food): [string, Food] => [food.name.toLowerCase(), food]));
            show();
        }).catch((error: unknown): void => {
            console.error(error);
            list.replaceChildren(elementOf("p", "food-none", "The meals cannot be read"));
        });
    };
    const formOpen: (name: string, fixed: boolean, servings: number, foods: string[]) => void =
        (name: string, fixed: boolean, servings: number, foods: string[]): void => {
            const opened: HTMLElement = mealFormOf({
                name: name, fixed: fixed, servings: servings, foods: foods, mine: mine,
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
            const latest: Variant | undefined = dish.variants.at(-1);
            const row: HTMLButtonElement = buttonOf("dish-row", "", (): void => {
                open = open === dish.name.toLowerCase() ? "" : dish.name.toLowerCase();
                show();
            });
            row.append(elementOf("span", "dish-name", dish.name), elementOf("span", "dish-meta",
                `${dish.variants.length} ${dish.variants.length === 1 ? "variant" : "variants"}`
                + ` · ${kcalTextOf(latest?.kcal ?? 0)} a serving`));
            row.setAttribute("aria-expanded", String(open === dish.name.toLowerCase()));
            if (open !== dish.name.toLowerCase())
                return [row];

            const detail: HTMLElement = elementOf("div", "dish-detail", "");
            detail.append(...[...dish.variants].reverse().map((variant: Variant): HTMLElement => {
                const key: string = `${dish.name}|${variant.label}`;
                const line: HTMLElement = elementOf("div", "dish-variant", "");
                const remove: HTMLButtonElement = buttonOf("dish-remove", "", (): void => {
                    if (asked !== key) {
                        asked = key;
                        show();
                        return;
                    }
                    asked = "";
                    dishDelete(dish.name, variant.label).then((meals: Dish[]): void => {
                        dishes = meals;
                        show();
                    }).catch((error: unknown): void => console.error(error));
                });
                if (asked === key)
                    iconPut(remove, CircleQuestionMark, "Really remove?");
                else
                    iconPut(remove, X, `Remove the variant ${variant.label}`);
                line.append(elementOf("span", "dish-name", variant.label), elementOf("span", "dish-meta",
                    `${amountOf(variant.servings, 0)} ${variant.servings === 1 ? "serving" : "servings"}`
                    + ` · ${kcalTextOf(variant.kcal)} a serving`), remove,
                    elementOf("p", "dish-hint dish-variant-foods", variantTextOf(variant.foods)));
                return line;
            }), plusOf("New variant", (): void =>
                formOpen(dish.name, true, latest?.servings ?? 1, latest?.foods ?? [])));
            return [row, detail];
        });
        list.replaceChildren(...form === null ? [] : [form], ...rows,
            ...dishes.length === 0 && form === null ? [elementOf("p", "food-none", "No meals yet")] : []);
    };

    head.append(elementOf("h2", "food-heading", "Meals"), newMeal);
    section.append(head, list);
    load();
    return section;
}
