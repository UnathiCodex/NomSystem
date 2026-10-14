/**
 * ## Foods
 *
 * Finds foods through the reader, mine first, then on Open Food Facts, page by page, sends new foods to `Foods.md`,
 * loads my meals of `Meals.md`, sends new and changed ones and removes them,
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
 * A food, one row of `Foods.md`: its {@link Nutrients} per 100 g with its name, portion, barcode, brand and store.
 *
 * - `name`: Name, by which a meal lists it, like `Reis` of `X-FOOD:Reis;150`.
 * - `portion`: Usual portion in grams, which counts when a meal lists the food without grams.
 * - `barcode`: Open Food Facts barcode it came from, empty for a food added by hand.
 * - `brand`: Its first brand, like `Milbona`, empty when none is known.
 * - `store`: The first store that sells it, like `Lidl`, empty when none is known.
 */
export type Food = Nutrients & {
    name: string;
    portion: number;
    barcode: string;
    brand: string;
    store: string;
};

/**
 * A product of Open Food Facts as a {@link Food} to add, its portion the serving its maker gives, 0 when it gives none.
 *
 * - `pack`: Size of the pack as sold, like `450 g`, empty when none is known.
 */
export type Product = Food & {
    pack: string;
};

/**
 * What a search finds, as the reader sends it.
 *
 * - `foods`: My foods found, the most eaten first; all of them for an empty search; of every brand.
 * - `products`: Products of Open Food Facts on the page asked for, of the brand picked, that are not among my foods,
 *   the best match first; none for a search of only a few letters; `null` when Open Food Facts cannot be reached.
 * - `total`: Number of products of Open Food Facts the search matches; a lower bound, like 10,000, when not `exact`.
 * - `exact`: Whether `total` is exact.
 * - `more`: Whether a page after the one asked for holds more products.
 */
export type FoodsFound = {
    foods: Food[];
    products: Product[] | null;
    total: number;
    exact: boolean;
    more: boolean;
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
 * A meal of mine, as the reader sends it from `Meals.md`: only its composition, two or more of my foods without grams.
 *
 * - `name`: Name of the meal, in one word, like `ChiliConCarne`.
 * - `foods`: Its foods by name, brand and store parted by `;`, like `Hackfleisch;Gut & Günstig;Edeka`, in their order.
 * - `kcal`: What it gives with each food at its usual portion.
 */
export type Dish = {
    name: string;
    foods: string[];
    kcal: number;
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
 * Finds foods by a name or a barcode: my foods first, then a page of the products of Open Food Facts.
 *
 * @param query - Search as typed, like `ric` or `20112745`; empty for all my foods
 * @param page - Page of the products, 1 for the first
 * @returns Foods found
 * @throws {Error} - When the reader cannot answer
 */
export async function foodsFind(query: string, page: number): Promise<FoodsFound> {
    const response: Response = await fetch(`/api/food/search?q=${encodeURIComponent(query)}&page=${page}`);
    if (!response.ok)
        throw new Error(`Reader answered ${response.status}`);
    return await response.json() as FoodsFound;
}

/**
 * Loads my meals of `Meals.md` from the reader, in the order of the file.
 *
 * @returns My meals, each with its foods
 * @throws {Error} - When the reader cannot answer
 */
export async function dishesLoad(): Promise<Dish[]> {
    const response: Response = await fetch("/api/food/meals");
    if (!response.ok)
        throw new Error(`Reader answered ${response.status}`);
    return await response.json() as Dish[];
}

/**
 * Sends a meal to the reader, new or changed for good, which writes it into `Meals.md`; the reader writes the name
 * in one word, like `ChiliConCarne` of `Chili con Carne`.
 *
 * @param name - Name of the meal
 * @param foods - Its foods by name, brand and store, like `Hackfleisch;Gut & Günstig;Edeka`
 * @returns All my meals after
 * @throws {Error} - When the reader does not take the meal, like one of a single food
 */
export async function dishSend(name: string, foods: string[]): Promise<Dish[]> {
    const response: Response = await fetch("/api/food/meals", {
        method: "POST", body: JSON.stringify({ name: name, foods: foods }),
    });
    if (!response.ok)
        throw new Error(`Reader answered ${response.status}`);
    return await response.json() as Dish[];
}

/**
 * Removes a meal through the reader from `Meals.md`.
 *
 * @param name - Name of the meal
 * @returns All my meals after
 * @throws {Error} - When the reader does not remove the meal
 */
export async function dishDelete(name: string): Promise<Dish[]> {
    const response: Response = await fetch(`/api/food/meals?meal=${encodeURIComponent(name)}`, { method: "DELETE" });
    if (!response.ok)
        throw new Error(`Reader answered ${response.status}`);
    return await response.json() as Dish[];
}

/**
 * Sends a new food to the reader, which adds it to `Foods.md` with its brand and store.
 *
 * @param food - Food to add, picked from Open Food Facts with its brand and store, or typed by hand without
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
 * Writes an amount as the page shows it, in English, with a comma between thousands and always as many decimals
 * as asked, so a number keeps its width as it changes, like the date of a day: `1.00` litres, never `1`,
 * and `0.0` g of a nutrient, never `0`.
 *
 * @param value - Amount
 * @param digits - Decimals to show, like 0 for kcal, 1 for nutrients per 100 g and 2 for litres
 * @returns Amount like `1,284`, `7.4` or `1.00`
 */
export function amountOf(value: number, digits: number): string {
    return value.toLocaleString("en-GB", { minimumFractionDigits: digits, maximumFractionDigits: digits });
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
