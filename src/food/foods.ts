/**
 * ## Foods
 *
 * Finds foods through the reader, mine first, then on Open Food Facts, sends new foods to `Foods.md`,
 * loads the meals of a day with what they give, and writes amounts as the page shows them:
 * for the food view and the entry by category of the day alike.
 */


/**
 * Energy and nutrients, of 100 g of a food or of what I ate, as the reader sends them.
 *
 * - `kcal`: Energy in kcal.
 * - `protein`: Protein in grams.
 * - `carbs`: Carbohydrates in grams.
 * - `fat`: Fat in grams.
 */
export type Nutrients = {
    kcal: number;
    protein: number;
    carbs: number;
    fat: number;
};

/**
 * A food, one row of `Foods.md`: its {@link Nutrients} per 100 g with its name, portion and barcode.
 *
 * - `name`: Name, by which a meal lists it, like `Reis` of `X-FOOD:Reis;150`.
 * - `portion`: Usual portion in grams, which counts when a meal lists the food without grams.
 * - `barcode`: Open Food Facts barcode it came from, empty for a food added by hand.
 */
export type Food = Nutrients & {
    name: string;
    portion: number;
    barcode: string;
};

/**
 * A product of Open Food Facts as a {@link Food} to add, its portion the serving Open Food Facts gives, else 100 g.
 *
 * - `brand`: Its first brand, like `Golden Sun`, empty when none is known.
 */
export type Product = Food & {
    brand: string;
};

/**
 * What a search finds, as the reader sends it.
 *
 * - `foods`: My foods found, the most eaten first; all of them for an empty search.
 * - `products`: Products of Open Food Facts that are not among my foods, the best match first;
 *   none for a search of only a few letters; `null` when Open Food Facts cannot be reached.
 */
export type FoodsFound = {
    foods: Food[];
    products: Product[] | null;
};

/**
 * A food of a meal with what it gives, as the reader sends it.
 *
 * - `name`: Name of the food, as the meal lists it.
 * - `grams`: Grams eaten as the meal lists them, else the usual portion of the food.
 * - `estimate`: Whether the grams are the usual portion, because the meal lists none.
 * - `known`: Whether `Foods.md` holds the food; an unknown food gives nothing.
 */
export type Eaten = Nutrients & {
    name: string;
    grams: number;
    estimate: boolean;
    known: boolean;
};

/**
 * A meal, a log entry of the category `Food`, with what it gives, as the reader sends it.
 *
 * - `id`: Identifier of the entry.
 * - `start`: Start as ISO instant.
 * - `title`: What I ate, like `Reis-Bohnen-Eier`.
 * - `location`: Where, like `HomeMunich`, empty when it has none.
 * - `foods`: Its foods with what each gives, none when it lists none.
 * - `estimate`: Whether one of its foods counts its usual portion.
 */
export type Meal = Nutrients & {
    id: string;
    start: string;
    title: string;
    location: string;
    foods: Eaten[];
    estimate: boolean;
};

/**
 * The meals of a day with what they give together, as the reader sends them.
 *
 * - `meals`: Meals of the day, in the order of their starts.
 * - `estimate`: Whether a food of a meal counts its usual portion.
 */
export type FoodDay = Nutrients & {
    meals: Meal[];
    estimate: boolean;
};


/**
 * Finds foods by a name or a barcode: my foods first, then the products of Open Food Facts.
 *
 * @param query - Search as typed, like `ric` or `20112745`; empty for all my foods
 * @returns Foods found
 * @throws {Error} - When the reader cannot answer
 */
export async function foodsFind(query: string): Promise<FoodsFound> {
    const response: Response = await fetch(`/api/food/search?q=${encodeURIComponent(query)}`);
    if (!response.ok)
        throw new Error(`Reader answered ${response.status}`);
    return await response.json() as FoodsFound;
}

/**
 * Sends a new food to the reader, which adds it to `Foods.md`.
 *
 * @param food - Food to add, picked from Open Food Facts or typed by hand
 * @returns The food as the reader wrote it, its name cleaned and its numbers rounded
 * @throws {Error} - When the reader does not take the food, like for a name another food has
 */
export async function foodSend(food: Food): Promise<Food> {
    const response: Response = await fetch("/api/food/foods", { method: "POST", body: JSON.stringify(food) });
    if (!response.ok)
        throw new Error(`Reader answered ${response.status}`);
    return await response.json() as Food;
}

/**
 * Loads the meals of a day with what they give from the reader.
 *
 * @param day - Day like `2026-10-10`
 * @returns The meals of the day with what they give together
 * @throws {Error} - When the reader cannot answer
 */
export async function foodDayLoad(day: string): Promise<FoodDay> {
    const response: Response = await fetch(`/api/food/day?date=${day}`);
    if (!response.ok)
        throw new Error(`Reader answered ${response.status}`);
    return await response.json() as FoodDay;
}

/**
 * Writes an amount as the page shows it, in English, with a comma between thousands.
 *
 * @param value - Amount
 * @param digits - Most decimals to show, like 0 for kcal and 1 for nutrients per 100 g
 * @returns Amount like `1,284` or `7.4`
 */
export function amountOf(value: number, digits: number): string {
    return value.toLocaleString("en-GB", { maximumFractionDigits: digits });
}

/**
 * Makes an element with a class and a text.
 *
 * @param tag - Name of the element, like `div`
 * @param className - Class, empty for none
 * @param text - Text, empty for none
 * @returns Element
 */
export function elementOf(tag: string, className: string, text: string): HTMLElement {
    const element: HTMLElement = document.createElement(tag);
    element.className = className;
    element.textContent = text;
    return element;
}
