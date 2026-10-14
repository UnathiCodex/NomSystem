/**
 * ## Foods
 *
 * Finds foods through the reader, mine first, then on Open Food Facts, page by page, sends new foods to `Foods.md`
 * and renames them, loads the grams I logged each food with last, loads my meals of `Meals.md`, sends new and changed ones and removes
 * them, loads the meals of a day with what they give, writes amounts as the page shows them,
 * and makes the elements and buttons of both, the names of foods with their brackets kept alike in a list:
 * for the food view and the entry by category of the day alike.
 */


/**
 * Energy and nutrients of 100 g of a food, or of what one food of a meal gave, as the reader sends them, as far as
 * they are known: kcal always, protein, carbs and fat `null` where unknown, never 0, see `reader/food.ts`.
 *
 * - `kcal`: Energy in kcal.
 * - `protein`: Protein in grams, `null` when unknown.
 * - `carbs`: Carbohydrates in grams, `null` when unknown.
 * - `fat`: Fat in grams, `null` when unknown.
 */
export type Nutrients = {
    kcal: number;
    protein: number | null;
    carbs: number | null;
    fat: number | null;
};

/**
 * What meals gave together, as the reader sends it, each the sum of what is known.
 *
 * - `kcal`: Energy in kcal.
 * - `protein`: Protein in grams.
 * - `carbs`: Carbohydrates in grams.
 * - `fat`: Fat in grams.
 */
export type Totals = {
    kcal: number;
    protein: number;
    carbs: number;
    fat: number;
};

/**
 * A food, one row of `Foods.md`, or a product of Open Food Facts as it would go there: its {@link Nutrients}
 * per 100 g with its name, barcode, brand, store and pack.
 *
 * - `name`: Name, by which a meal lists it, like `Reis` of `X-FOOD:Reis;Golden Sun;Lidl;150`.
 * - `barcode`: Open Food Facts barcode it came from, empty for a food added by hand.
 * - `brand`: Its first brand, like `Milbona`, empty when none is known.
 * - `store`: The first store that sells it, like `Lidl`, empty when none is known.
 * - `pack`: Size of its pack as sold, like `450 g`, empty when none is known.
 */
export type Food = Nutrients & {
    name: string;
    barcode: string;
    brand: string;
    store: string;
    pack: string;
};

/**
 * A product of Open Food Facts as a search sends it: a {@link Food}, its kcal `null` where Open Food Facts does not know
 * them, like `Zwiebeln` of Edeka, so it still shows and I type its kcal from the pack, see `./search.ts`.
 */
export type Product = Omit<Food, "kcal"> & {
    kcal: number | null;
};

/**
 * What a search finds, as the reader sends it.
 *
 * - `foods`: My foods found, the most eaten first; all of them for an empty search; of every brand.
 * - `products`: Products of Open Food Facts on the page asked for that are not among my foods, each as it would go
 *   into `Foods.md`, its kcal `null` where unknown, the best match first; none for a search of only a few letters or of my foods only;
 *   `null` when Open Food Facts cannot be reached.
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
 * A food of a meal with what it gives, as the reader sends it, a nutrient its food does not know unknown too.
 *
 * - `name`: Name of the food, as the meal lists it, like `Skyr natur`.
 * - `brand`, `store`: Its brand and the store I bought it in, like `K-Classic` and `Kaufland`; empty where the line
 *   names none.
 * - `grams`: Grams eaten as the meal lists them, 0 for none, which count nothing.
 * - `estimate`: Whether the grams are guessed, marked by `~`.
 * - `known`: Whether `Foods.md` holds the food; an unknown food gives nothing.
 * - `meal`: The meal of mine it belongs to in this entry, like `ChiliConCarne`; empty for a food eaten by itself.
 */
export type Eaten = Nutrients & {
    name: string;
    brand: string;
    store: string;
    grams: number;
    estimate: boolean;
    known: boolean;
    meal: string;
};

/**
 * A meal, a log entry of the category `Food`, with what it gives, as the reader sends it.
 *
 * - `id`: Identifier of the entry.
 * - `start`: Start as ISO instant.
 * - `title`: What I ate, like `Reis-Bohnen-Eier`.
 * - `location`: Where, like `HomeMunich`, empty when it has none.
 * - `foods`: Its foods with what each gives, none when it lists none.
 * - `estimate`: Whether one of its foods counts grams guessed.
 */
export type Meal = Totals & {
    id: string;
    start: string;
    title: string;
    location: string;
    foods: Eaten[];
    estimate: boolean;
};

/**
 * A meal of mine, as the reader sends it from `Meals.md`: one list of every food I may put in, never variants,
 * each with the grams I put in as a rule, and what they give.
 *
 * - `name`: Name of the meal, like `Chili con Carne`.
 * - `short`: What its brackets show, as I typed it, like `Hackfleisch, Tomaten`; empty for its first two foods.
 * - `foods`: Its foods by name, brand and store parted by `;`, like `Hackfleisch;Gut & Günstig;Edeka`, in their order.
 * - `standard`: The grams of each food, in their order, which an entry starts with: 0 for one I rarely put in,
 *   `null` for none set yet.
 * - `kcal`: What its foods give at those grams; `null` while none has grams.
 */
export type Dish = {
    name: string;
    short: string;
    foods: string[];
    standard: (number | null)[];
    kcal: number | null;
};

/**
 * The meals of a day with what they give together, as the reader sends them.
 *
 * - `meals`: Meals of the day, in the order of their starts.
 * - `estimate`: Whether a food of a meal counts grams guessed.
 */
export type FoodDay = Totals & {
    meals: Meal[];
    estimate: boolean;
};


/**
 * Finds foods by a name or a barcode: my foods first, then, where asked, a page of the products of Open Food Facts.
 *
 * @param query - Search as typed, like `ric` or `20112745`; empty for all my foods
 * @param page - Page of the products, 1 for the first
 * @param products - Whether Open Food Facts is asked too; not for a meal of mine, which takes only my foods
 * @returns Foods found
 * @throws {Error} - When the reader cannot answer
 */
export async function foodsFind(query: string, page: number, products: boolean): Promise<FoodsFound> {
    const response: Response = await fetch(
        `/api/food/search?q=${encodeURIComponent(query)}&page=${page}&products=${products ? 1 : 0}`);
    if (!response.ok)
        throw new Error(`Reader answered ${response.status}`);
    return await response.json() as FoodsFound;
}

/**
 * Loads my meals of `Meals.md` from the reader, in the order of the file.
 *
 * @returns My meals, each with its foods and what it gave
 * @throws {Error} - When the reader cannot answer
 */
export async function dishesLoad(): Promise<Dish[]> {
    const response: Response = await fetch("/api/food/meals");
    if (!response.ok)
        throw new Error(`Reader answered ${response.status}`);
    return await response.json() as Dish[];
}

/**
 * Sends a meal to the reader, new or changed for good, which writes it into `Meals.md`; the name keeps its spaces,
 * like `Chili con Carne`, the reader only taking its commas.
 *
 * @param name - Name of the meal
 * @param foods - Its foods by name, brand and store, like `Hackfleisch;Gut & Günstig;Edeka`
 * @returns All my meals after
 * @throws {Error} - When the reader does not take the meal, like one without name or food
 */
export async function dishSend(name: string, foods: string[], short?: string, grams?: (number | null)[]):
    Promise<Dish[]> {
    const response: Response = await fetch("/api/food/meals", {
        method: "POST", body: JSON.stringify({ name: name, foods: foods, short: short, grams: grams }),
    });
    if (!response.ok)
        throw new Error(`Reader answered ${response.status}`);
    return await response.json() as Dish[];
}

/**
 * Renames a meal through the reader wherever it stands, in `Meals.md` and in every entry that holds it.
 *
 * @param old - Name of the meal
 * @param name - Its new name as typed
 * @returns All my meals after
 * @throws {Error} - When the reader does not take the name, like an empty one or that of another meal of mine
 */
export async function dishRename(old: string, name: string): Promise<Dish[]> {
    const response: Response = await fetch("/api/food/meals", {
        method: "PATCH", body: JSON.stringify({ old: old, name: name }),
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
 * Sends a new food to the reader, which adds it to `Foods.md`: a product of Open Food Facts as it gives it,
 * or a food typed by hand.
 *
 * @param food - Food to add
 * @returns The food as the reader wrote it, its name cleaned and its numbers rounded; for a product that is one of my
 *   foods already, like the same beans in a bigger can, that food
 * @throws {Error} - When the reader does not take the food, like a food by hand with the name, brand and store
 *   of one of mine
 */
export async function foodSend(food: Food): Promise<Food> {
    const response: Response = await fetch("/api/food/foods", { method: "POST", body: JSON.stringify(food) });
    if (!response.ok)
        throw new Error(`Reader answered ${response.status}`);
    return await response.json() as Food;
}

/**
 * Removes a food of mine from `Foods.md` through the reader; entries and meals listing it keep their lines.
 * - `query`: Its name, brand and store as parameters of the address.
 *
 * @param food - The food
 * @throws {Error} - When the reader does not remove it
 */
export async function foodDelete(food: Food): Promise<void> {
    const query: URLSearchParams = new URLSearchParams({ name: food.name, brand: food.brand, store: food.store });
    const response: Response = await fetch(`/api/food/foods?${query}`, { method: "DELETE" });
    if (!response.ok)
        throw new Error(`Reader answered ${response.status}`);
}

/**
 * Renames a food of mine through the reader, in `Foods.md`, in my meals and in every entry of the log naming it.
 *
 * @param food - The food as `Foods.md` holds it
 * @param name - Its new name
 * @param brand - Its new brand, empty for none
 * @param store - Its new store, empty for none
 * @returns The food as the reader wrote it, its name, brand and store cleaned
 * @throws {Error} - When the reader does not take it, like for an empty name or one another food of mine has
 *   with that brand and store
 */
export async function foodChange(food: Food, name: string, brand: string, store: string): Promise<Food> {
    const response: Response = await fetch("/api/food/foods", {
        method: "PATCH", body: JSON.stringify({
            old: { name: food.name, brand: food.brand, store: food.store }, name: name, brand: brand, store: store,
        }),
    });
    if (!response.ok)
        throw new Error(`Reader answered ${response.status}`);
    return await response.json() as Food;
}

/**
 * Loads from the reader the grams I logged each food with last in an entry of a category, at which a food picked
 * into an entry of it starts.
 *
 * @param category - Category of the entry, `Food` or `Cook`
 * @returns Grams by the key of each food, its name, brand and store parted by `;` in small letters, like
 *   `sonnenmais zart;gut&günstig;edeka`; a food never logged there with grams is not among them
 * @throws {Error} - When the reader cannot answer
 */
export async function gramsLoad(category: string): Promise<Map<string, number>> {
    const response: Response = await fetch(`/api/food/grams?category=${encodeURIComponent(category)}`);
    if (!response.ok)
        throw new Error(`Reader answered ${response.status}`);
    return new Map(Object.entries(await response.json() as { [key: string]: number }));
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
 * and `0.0` g of a nutrient, never `0`; an unknown amount, like the fat of a food nobody gives, as nothing,
 * no dash and no `?`, so it never reads as 0.
 *
 * @param value - Amount, `null` when unknown
 * @param digits - Decimals to show, like 0 for kcal, 1 for nutrients per 100 g and 2 for litres
 * @returns Amount like `1,284`, `7.4` or `1.00`, empty when unknown
 */
export function amountOf(value: number | null, digits: number): string {
    return value === null ? ""
        : value.toLocaleString("en-GB", { minimumFractionDigits: digits, maximumFractionDigits: digits });
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

/**
 * Makes the name of a food, the same wherever it stands: its name, then its brand and store grey in brackets, those
 * it has, like `Skyr natur (K-Classic, Kaufland)`, since they only tell which one it is; in the size of the name,
 * never cut, on a line of their own below it where one name of the list has no room, see {@link bracketsWatch}.
 * - `shown`: The name with its brand and store.
 * - `place`: Brand and store, those it has.
 *
 * @param className - Class of the name where it stands, like `food-name` in the food search
 * @param name - Name, like `Skyr natur`
 * @param brand - Brand, empty for none
 * @param store - Store, empty for none
 * @returns The name
 */
export function foodNameOf(className: string, name: string, brand: string, store: string): HTMLElement {
    const shown: HTMLElement = elementOf("span", className, name);
    const place: string[] = [brand, store].filter((part: string): boolean => part !== "");
    if (place.length > 0)
        shown.append(elementOf("span", "food-brand", ` (${place.join(", ")})`));
    return shown;
}

/**
 * Keeps the brackets after the names of a list alike, like the brand and store of the foods:
 * all on the line of their name while every one fits there, else every one on a line of its own below its name,
 * never one here and one there; looked at again whenever the list changes or gets narrower or wider.
 * A bracket hidden, like the brand of a food of a meal on a phone, counts as fitting.
 * - `width`: Width of the list when last looked at, so a change of its height alone looks at nothing.
 * A list watched inside another, like the food search inside the parts of a meal, keeps its own brackets.
 * - `fits`: Whether a bracket stands on the first line of its name, after it.
 * - `look`: Looks at the brackets of this list and puts them all on the line of their names, or all below them.
 *
 * @param list - List of names, like the results of the food search
 */
export function bracketsWatch(list: HTMLElement): void {
    let width: number = -1;
    list.dataset.brackets = "";
    const fits: (bracket: HTMLElement) => boolean = (bracket: HTMLElement): boolean => {
        const parts: DOMRectList = bracket.getClientRects();
        const name: Node | null = bracket.parentElement?.firstChild ?? null;
        if (parts.length === 0 || name === null || name.nodeType !== Node.TEXT_NODE)
            return true;
        const range: Range = document.createRange();
        range.selectNodeContents(name);
        const first: DOMRect | undefined = range.getClientRects()[0];
        return first === undefined || parts[parts.length - 1].bottom <= first.bottom + 1;
    };
    const look: () => void = (): void => {
        const brackets: HTMLElement[] = [...list.querySelectorAll<HTMLElement>(".food-brand")]
            .filter((bracket: HTMLElement): boolean => bracket.parentElement?.closest("[data-brackets]") === list);
        brackets.forEach((bracket: HTMLElement): void => bracket.classList.remove("bracket-below"));
        const below: boolean = !brackets.every(fits);
        brackets.forEach((bracket: HTMLElement): void => {
            bracket.classList.toggle("bracket-below", below);
        });
    };
    new ResizeObserver((entries: ResizeObserverEntry[]): void => {
        const now: number = entries[0]?.contentRect.width ?? width;
        if (now === width)
            return;
        width = now;
        look();
    }).observe(list);
    new MutationObserver(look).observe(list, { childList: true, subtree: true });
}

/**
 * Makes a button that does not send a form, also inside one, like the form of the dialog of an entry.
 *
 * @param className - Class, empty for none
 * @param text - Text, empty for none
 * @param click - What a click does
 * @returns Button
 */
export function buttonOf(className: string, text: string, click: () => void): HTMLButtonElement {
    const button: HTMLButtonElement = document.createElement("button");
    button.type = "button";
    button.className = className;
    button.textContent = text;
    button.addEventListener("click", click);
    return button;
}
