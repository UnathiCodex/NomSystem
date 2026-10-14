/**
 * ## Food
 *
 * Reads my foods from `Foods.md`, finds foods by a name or a barcode, mine first, then on Open Food Facts,
 * page by page, adds new foods to `Foods.md`, keeps my meals in `Meals.md`, reads the meals of a day from the log
 * with what they give.
 * `Meals.md` holds my meals, each only its composition, two or more of my foods without grams, servings or variants,
 * since I prepare it a little differently every time: one Markdown table with one row per food of a meal, the meal,
 * the food, its brand and its store; an entry brings them at their usual portion, which I change there.
 * A meal is named as all my names are, in one word without spaces, each word with a capital, like `ChiliConCarne`
 * of `Chili con Carne`.
 * `Foods.md` is one Markdown table with one row per food: its name, kcal, protein, carbs and fat per 100 g,
 * its usual portion in grams, the Open Food Facts barcode it came from, and its brand and store, like `Milbona`
 * and `Lidl`, so the same name of two shops never mixes up; the barcode empty for a food added by hand, while every
 * food added has its brand and store, typed where Open Food Facts knows none, so all foods are written alike.
 * A row written before brand and store were kept has neither, and the table gets their columns with the next food.
 * A meal is a log entry of the category `Food`: `SUMMARY` what I ate, its foods parted by `, `,
 * like `Reis, Bohnen, Eier`, `LOCATION` where, and one line `X-FOOD` per food: its name, brand and store in `Foods.md`,
 * then the grams I ate, each part parted by `;`, like `X-FOOD:Skyr natur;K-Classic;Kaufland;150`, so the log tells
 * which product it was, see {@link lineOf}; a line written before foods had brand and store names its food alone,
 * like `X-FOOD:Reis;150`, and one without grams, like `X-FOOD:Eier`, counts the usual portion of its food,
 * an estimate. A cooking, `Cook`, lists what went into the pot the same way, like
 * `X-FOOD:Hackfleisch;Gut & Günstig;Edeka;500`, which counts nothing.
 * Grams guessed, not weighed, like those Claude reads from a photo of a meal, carry `~`, like `X-FOOD:Döner;~400`,
 * and count as an estimate too, since a guess from a photo is about a third off (Fridolfsson 2025).
 * A food of one of my meals carries the meal as a fifth part, like `X-FOOD:Hackfleisch;Gut & Günstig;Edeka;125;ChiliConCarne`,
 * so the log keeps what the meal held that day, whatever I change in `Meals.md` later; its what names the meal,
 * then the foods eaten beside it, like `ChiliConCarne, Weißbrot`; an older line of a meal carried its servings eaten
 * and its variant, like `Hackfleisch;62.5;ChiliConCarne;0.5;09.10.2026`, still read.
 * A product of Open Food Facts is a pack as sold, its values per 100 g, with the size of the pack, like `450 g`,
 * and the serving its maker gives, like 36 g, which only the product itself tells, not the search,
 * so the reader asks for the serving of each product found and keeps it.
 * Open Food Facts is asked anonymously: a request carries the search and the name of the dashboard,
 * never my email or my name.
 *
 * - `node:fs`: Reads and writes `Foods.md` and `Meals.md`.
 * - `node:path`: Gives the folder of `Foods.md` and `Meals.md`.
 * - `./calendar.ts`: Reads the log and gives the day of an instant in Berlin time.
 * - `./sources.ts`: Names `Foods.md`, `Meals.md`, the log and the addresses of Open Food Facts,
 *   and tells which files the reader may write.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { berlinDateOf, entriesRead } from "./calendar.ts";
import { food, writeAllowed } from "./sources.ts";

import type { Entry } from "./calendar.ts";


/**
 * Energy and nutrients, of 100 g of a food or of what I ate.
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
 * - `name`: Name, by which a meal lists it, like `Reis` of `X-FOOD:Reis;150`; unique, without `|` and `;`.
 * - `portion`: Usual portion in grams, which counts when a meal lists the food without grams.
 * - `barcode`: Open Food Facts barcode it came from, like `20112745`; empty for a food added by hand.
 * - `brand`: Its brand, like `Milbona`, empty only in a row written before every food had one.
 * - `store`: The store I bought it in, like `Lidl`, empty only in a row written before every food had one.
 */
export type Food = Nutrients & {
    name: string;
    portion: number;
    barcode: string;
    brand: string;
    store: string;
};

/**
 * A product of Open Food Facts as a {@link Food} to add: its name as Open Food Facts writes it,
 * its portion the serving its maker gives, 0 when it gives none.
 *
 * - `pack`: Size of the pack as sold, like `450 g` or `140 g (7 x 20 g)`, empty when none is known.
 */
export type Product = Food & {
    pack: string;
};

/**
 * What a search finds.
 *
 * - `foods`: My foods whose name holds the search, ignoring case, or whose barcode it is, the most eaten first,
 *   equal ones alphabetical; all of them for an empty search.
 * - `products`: Products of Open Food Facts on the page asked for that are not among my foods,
 *   the best match first; none for a search shorter than {@link searchLength};
 *   `null` when Open Food Facts cannot be reached.
 * - `total`: Number of products of Open Food Facts the search matches, my foods among them;
 *   a lower bound, like 10,000, when not `exact`.
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
 * One page of the products of a search of Open Food Facts.
 *
 * - `products`: Products that can count, the best match first.
 * - `total`, `exact`, `more`: As those of {@link FoodsFound}.
 */
type ProductsPage = {
    products: Product[];
    total: number;
    exact: boolean;
    more: boolean;
};

/**
 * A food of a meal with what it gives, its {@link Nutrients}.
 *
 * - `name`: Name of the food, as the meal lists it, like `Skyr natur`.
 * - `brand`, `store`: Its brand and the store I bought it in, like `K-Classic` and `Kaufland`; empty where the line
 *   names none, so the page shows them grey after the name, as everywhere.
 * - `grams`: Grams eaten as the meal lists them, else the usual portion of the food; 0 for an unknown food without grams.
 * - `estimate`: Whether the grams are the usual portion, because the meal lists none, or guessed, marked by `~`.
 * - `known`: Whether `Foods.md` holds the food; an unknown food gives nothing.
 */
export type Eaten = Nutrients & {
    name: string;
    brand: string;
    store: string;
    grams: number;
    estimate: boolean;
    known: boolean;
};

/**
 * A line `X-FOOD` as read, see {@link lineOf}.
 *
 * - `name`: Name of its food, like `Skyr natur`.
 * - `brand`, `store`: Brand of its food and the store I bought it in, like `K-Classic` and `Kaufland`;
 *   empty in a line written before foods had them.
 * - `grams`: Grams it gives, `null` for none.
 * - `guessed`: Whether its grams are guessed, not weighed, marked by `~`, like `~400`.
 * - `meal`: The meal of mine its food belongs to, empty for none.
 */
type Line = {
    name: string;
    brand: string;
    store: string;
    grams: number | null;
    guessed: boolean;
    meal: string;
};

/**
 * A meal, a log entry of the category `Food`, with what it gives, the sum of its foods.
 *
 * - `id`: Identifier of the entry.
 * - `start`: Start as ISO instant.
 * - `title`: What I ate, its `SUMMARY`, like `Reis, Bohnen, Eier`.
 * - `location`: Where, its `LOCATION`, like `HomeMunich`, empty when it has none.
 * - `foods`: Its foods in the order of its lines `X-FOOD`, none when it lists none.
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
 * A meal of mine, as `Meals.md` holds it: only its composition, two or more of my foods without grams.
 *
 * - `name`: Name of the meal, like `ChiliConCarne`; unique, without spaces, `|` and `;`.
 * - `foods`: Its foods by name, brand and store parted by `;`, like `Hackfleisch;Gut & Günstig;Edeka`, in their order;
 *   by their names alone in a table written before foods had brand and store.
 * - `kcal`: What it gives with each food at its usual portion.
 */
export type Dish = {
    name: string;
    foods: string[];
    kcal: number;
};

/**
 * The meals of a day with what they give together.
 *
 * - `meals`: Meals that start on the day in Berlin time, in the order of their starts.
 * - `estimate`: Whether a food of a meal counts its usual portion.
 */
export type FoodDay = Nutrients & {
    meals: Meal[];
    estimate: boolean;
};

/**
 * A product as Open Food Facts sends it, with the fields of {@link productFields}; each may be missing.
 *
 * - `code`: Barcode.
 * - `product_name`: Name.
 * - `brands`: Brands, a list from the search, a text parted by commas from the products.
 * - `stores`: Stores that sell it, as the brands.
 * - `quantity`: Size of the pack as its maker writes it, like `450g`.
 * - `serving_quantity`: Grams of a serving, as number or as text; only the products send it, never the search.
 * - `nutriments`: Nutrients by their names, like `energy-kcal_100g` or `proteins_100g`.
 */
type ProductSent = {
    code?: string;
    product_name?: string;
    brands?: string | string[];
    stores?: string | string[];
    quantity?: string;
    serving_quantity?: number | string;
    nutriments?: { [nutrient: string]: number | string | undefined };
};

/**
 * Answer of Open Food Facts: from the search its `hits`, their number, `count`, exact or a lower bound,
 * and its number of pages, `page_count`; from the products the `product`, missing for an unknown barcode.
 */
type Answer = {
    hits?: ProductSent[];
    count?: number;
    is_count_exact?: boolean;
    page_count?: number;
    product?: ProductSent;
};

/**
 * Category of meals, written as `CATEGORIES:Food` by the entry by category of the day.
 */
export const foodName: string = "Food";

/**
 * Head of the table of `Foods.md`, the header and the line below it, with the columns of brand and store.
 *
 * @returns The two lines
 */
function tableHeadOf(): string[] {
    return [
        "| Food | kcal | Protein | Carbs | Fat | Portion | Barcode | Brand | Store |",
        "| --- | ---: | ---: | ---: | ---: | ---: | --- | --- | --- |",
    ];
}

/**
 * Text a new `Foods.md` starts with: its title, what its columns hold, how a meal lists a food,
 * and the head of its table, the header and the line below it, see {@link tableHeadOf}.
 */
const fileHead: string[] = [
    "# Foods",
    "",
    "My foods: kcal, protein, carbs and fat per 100 g, the usual portion in grams, the Open Food Facts barcode,",
    "and the brand and the store, so the same name of two shops never mixes up.",
    "A meal in the log lists a food by its name, brand and store, then the grams I ate, like",
    "`X-FOOD:Skyr natur;K-Classic;Kaufland;150`; a cooking lists what went into the pot the same way.",
    "",
    ...tableHeadOf(),
];

/**
 * Lines of the table of `Foods.md` before its rows: the header and the line below it.
 */
const tableHead: number = 2;

/**
 * Text a new `Meals.md` starts with: its title, what it holds, and the head of its table.
 */
const mealsHead: string[] = [
    "# Meals",
    "",
    "My meals, each only its foods, by name, brand and store; an entry brings them at their usual portion,",
    "which I change there, so a meal changed here leaves past days as they were.",
    "",
    "| Meal | Food | Brand | Store |",
    "| --- | --- | --- | --- |",
];

/**
 * Line `X-FOOD` written before foods had brand and store, which names its food alone: the name of a food, then `;`
 * and the grams when given, `~` before grams guessed, then for a food of one of my meals `;` with the meal,
 * `;` with its servings eaten and maybe `;` with its variant, like `Reis;150`, `Milch;200.5`, `Döner;~400`, `Eier`
 * or `Hackfleisch;62.5;ChiliConCarne;0.5;09.10.2026`; see {@link lineOf} for the line of today.
 */
const foodLine: RegExp =
    /^([^;]+?)(?:;\s*(~)?\s*(\d+(?:[.,]\d+)?))?(?:;\s*([^;|]+?)\s*;\s*(\d+(?:[.,]\d+)?)(?:\s*;\s*([^;|]*?))?)?\s*$/;

/**
 * Grams as a part of a line `X-FOOD`, `~` before grams guessed, like `150`, `200.5` or `~400`.
 */
const gramsPart: RegExp = /^(~)?\s*(\d+(?:[.,]\d+)?)$/;

/**
 * Barcode, as a search may be one: 8 to 14 digits, like `20112745` or `4316268460989`.
 */
const barcode: RegExp = /^\d{8,14}$/;

/**
 * Fewest characters a search needs to ask Open Food Facts, since fewer find mostly noise; a barcode is longer.
 */
const searchLength: number = 3;

/**
 * Name the dashboard gives itself when it asks Open Food Facts, which asks apps for one;
 * on purpose without an email or a name, so nothing about me leaves.
 */
const agent: string = "NomSystemDashboard/0.1";

/**
 * Fields of a product the reader asks Open Food Facts for, see {@link ProductSent}.
 */
const productFields: string = "code,product_name,brands,stores,quantity,serving_quantity,nutriments";

/**
 * Languages of the names a search looks in: German, since I shop in Germany, and English.
 */
const searchLanguages: string = "de,en";

/**
 * Products of Open Food Facts on a page of a search; those without name or kcal and those among my foods fall out.
 */
const pageSize: number = 8;

/**
 * Grams of the serving of each product asked for, by its barcode, 0 for none, see {@link servingAsk};
 * kept while the reader runs, so a product found again asks nothing.
 */
const servings: Map<string, number> = new Map();

/**
 * Milliseconds Open Food Facts gets to answer, before a search goes on without it.
 */
const answerTime: number = 5000;

/**
 * Milliseconds of a day.
 */
const dayLength: number = 24 * 60 * 60 * 1000;


/**
 * Turns the text of a number into the number, a decimal comma counting as a point.
 *
 * @param text - Number as written, like `7.4` or `7,4`; missing in a short row
 * @returns Number, 0 for an empty or unreadable text
 */
function numberOf(text: string | undefined): number {
    return Number((text ?? "").replace(",", ".")) || 0;
}

/**
 * Rounds a number as `Foods.md` writes it: kcal and portions whole, nutrients to one decimal.
 *
 * @param value - Number
 * @param digits - Decimals to keep
 * @returns Rounded number
 */
function roundOf(value: number, digits: number): number {
    return Math.round(value * 10 ** digits) / 10 ** digits;
}

/**
 * Cleans a name for `Foods.md` and the lines `X-FOOD`: `|` and `;` become spaces,
 * spaces in a row one, none at the ends.
 *
 * @param name - Name as typed or as Open Food Facts writes it, like `SUPREME  RICE`
 * @returns Clean name, like `SUPREME RICE`
 */
function nameOf(name: string): string {
    return name.replace(/[|;]/g, " ").replace(/\s+/g, " ").trim();
}

/**
 * Cleans a brand or a store for `Foods.md`: as a name, see {@link nameOf}, and without quotes and backslashes.
 *
 * @param brand - Brand as typed or as Open Food Facts writes it, like ` Gut & Günstig`
 * @returns Clean brand, like `Gut & Günstig`
 */
function brandOf(brand: string): string {
    return nameOf(brand.replace(/["\\]/g, " "));
}

/**
 * Gives the first of the brands or stores of a product, as the search sends a list and a product a text
 * parted by commas, cleaned for `Foods.md`, see {@link nameOf}.
 *
 * @param sent - Brands or stores as sent, like `["Milbona", "Lidl"]` or `Milbona, Lidl`; missing for none
 * @returns The first, like `Milbona`, empty for none
 */
function firstOf(sent: string | string[] | undefined): string {
    return nameOf(([sent ?? ""].flat()[0] ?? "").split(",")[0]);
}

/**
 * Writes the size of a pack with a space between number and unit, like `450 g` of `450g`, spaces in a row one;
 * nothing for a size without a weight or volume, like `1 pcs`, which tells nothing of what it gives.
 * - `pack`: The size written.
 *
 * @param quantity - Size as its maker writes it, like `450g` or `140 g (7 x 20 g)`; missing when none is known
 * @returns Size, like `450 g`, empty for none
 */
function packOf(quantity: string | undefined): string {
    const pack: string = (quantity ?? "").replace(/(\d)(?=[a-zA-Z])/g, "$1 ").replace(/\s+/g, " ").trim();
    return /\d\s*(k?g|m?l|cl|dl)\b/i.test(pack) ? pack : "";
}

/**
 * Reads my foods, the rows of the table of `Foods.md`: its lines starting with `|`, after the head of the table.
 * A number that cannot be read counts as 0, a row without a name stays out.
 * - `cells`: Cells of a row, without the empty texts before its first `|` and after its last.
 *
 * @returns Foods in the order of the table, none while `Foods.md` does not exist
 */
function foodsRead(): Food[] {
    if (!existsSync(food.foods))
        return [];

    return readFileSync(food.foods, "utf8").split("\n")
        .filter((line: string): boolean => line.startsWith("|"))
        .slice(tableHead)
        .map((line: string): string[] => line.split("|").slice(1, -1).map((cell: string): string => cell.trim()))
        .filter((cells: string[]): boolean => (cells[0] ?? "") !== "")
        .map((cells: string[]): Food => ({
            name: cells[0], kcal: numberOf(cells[1]), protein: numberOf(cells[2]), carbs: numberOf(cells[3]),
            fat: numberOf(cells[4]), portion: numberOf(cells[5]), barcode: cells[6] ?? "", brand: cells[7] ?? "",
            store: cells[8] ?? "",
        }));
}

/**
 * Reads the meals of a range: the log entries of the category `Food`.
 *
 * @param start - Start of the range as ISO instant
 * @param end - End of the range, excluded, in the same form
 * @returns Log entries of the meals
 */
function mealsRead(start: string, end: string): Entry[] {
    return entriesRead(food.log, start, end).filter((entry: Entry): boolean => entry.category === foodName);
}

/**
 * Writes the label of a food as the page shows it: its name, then its brand and store in brackets, those it has,
 * like `Skyr natur (K-Classic, Kaufland)`, since they only tell which one it is.
 *
 * @param food - Food with its name, brand and store
 * @returns Label, the name alone for a food without brand and store
 */
export function labelOf(food: { name: string; brand: string; store: string }): string {
    const place: string[] = [food.brand, food.store].filter((part: string): boolean => part !== "");
    return place.length === 0 ? food.name : `${food.name} (${place.join(", ")})`;
}

/**
 * Writes the key of a food, by which a line `X-FOOD` finds it among my foods: its name, brand and store
 * parted by `;`, in small letters, like `skyr natur;k-classic;kaufland`.
 *
 * @param food - Food or line with its name, brand and store
 * @returns Key
 */
function keyOf(food: { name: string; brand: string; store: string }): string {
    return `${food.name};${food.brand};${food.store}`.toLowerCase();
}

/**
 * Reads my foods by their keys, see {@link keyOf}, and by their names alone in small letters, for a line written
 * before foods had brand and store, the first food of a name.
 * - `mine`: My foods by key and by name.
 *
 * @returns Foods by their keys and names
 */
function foodsByKeyRead(): Map<string, Food> {
    const mine: Map<string, Food> = new Map();
    foodsRead().forEach((row: Food): void => {
        mine.set(keyOf(row), row);
        if (!mine.has(row.name.toLowerCase()))
            mine.set(row.name.toLowerCase(), row);
    });
    return mine;
}

/**
 * Finds the food of a line among my foods: by its name, brand and store, a line without both by its name alone.
 *
 * @param read - Line as read, see {@link lineOf}
 * @param mine - My foods by their keys and names, see {@link foodsByKeyRead}
 * @returns The food, `undefined` when `Foods.md` holds none
 */
function foodOfLine(read: Line, mine: Map<string, Food>): Food | undefined {
    return mine.get(keyOf(read)) ?? (read.brand === "" && read.store === "" ? mine.get(read.name.toLowerCase()) : undefined);
}

/**
 * Cuts a line `X-FOOD` of today into its five parts: its food's name, brand and store, its grams, empty for a food
 * `Foods.md` does not hold, and the meal of mine it belongs to, like `Skyr natur;K-Classic;Kaufland;150`,
 * `Reis;;;80` of a food without brand and store, or `Hackfleisch;Gut & Günstig;Edeka;125;ChiliConCarne`,
 * told by its second part being no grams and its fourth grams or empty; the foods of a meal in `Meals.md`
 * without grams, like `Hackfleisch;Gut & Günstig;Edeka`.
 *
 * @param line - Value of the line
 * @returns Its five parts, empty where it has none, `null` for a line written before foods had brand and store
 */
function partsOf(line: string): string[] | null {
    const parts: string[] = line.split(";").map((part: string): string => part.trim());
    if ((parts.length === 4 || parts.length === 5) && !gramsPart.test(parts[1])
        && (parts[3] === "" || gramsPart.test(parts[3])))
        return [...parts, ""].slice(0, 5);
    if (parts.length === 3 && !gramsPart.test(parts[1]) && !gramsPart.test(parts[2]))
        return [...parts, "", ""];
    return null;
}

/**
 * Reads a line `X-FOOD`: one of today by its parts, see {@link partsOf}, an older one by {@link foodLine},
 * which names its food alone.
 * - `parts`: Parts of a line of today, `null` for an older one.
 * - `grams`: Its grams cut into `~` and number, `null` for none.
 * - `old`: An older line cut into its parts, `null` when it is none.
 *
 * @param line - Value of the line, like `Skyr natur;K-Classic;Kaufland;150` or `Reis;150`
 * @returns The line as read
 */
function lineOf(line: string): Line {
    const parts: string[] | null = partsOf(line);
    if (parts !== null) {
        const grams: RegExpExecArray | null = gramsPart.exec(parts[3]);
        return {
            name: parts[0], brand: parts[1], store: parts[2], grams: grams === null ? null : numberOf(grams[2]),
            guessed: grams?.[1] !== undefined, meal: parts[4],
        };
    }
    const old: RegExpExecArray | null = foodLine.exec(line.trim());
    return {
        name: old === null ? line.trim() : old[1].trim(), brand: "", store: "",
        grams: old?.[3] === undefined ? null : numberOf(old[3]), guessed: old?.[2] !== undefined, meal: old?.[4] ?? "",
    };
}

/**
 * Counts how often each food was eaten: the lines `X-FOOD` of the meals in the log up to now.
 * - `uses`: Number of lines by the key of their food, see {@link keyOf}.
 *
 * @returns Number of lines by the key of their food
 */
function usesRead(): Map<string, number> {
    const uses: Map<string, number> = new Map();
    mealsRead("1970-01-01T00:00:00Z", new Date().toISOString())
        .flatMap((meal: Entry): string[] => meal.foods)
        .forEach((line: string): void => {
            const key: string = keyOf(lineOf(line));
            uses.set(key, (uses.get(key) ?? 0) + 1);
        });
    return uses;
}

/**
 * Builds the address that asks Open Food Facts for a search:
 * for a barcode its product, else a page of the products whose names match, in {@link searchLanguages}.
 *
 * @param query - Name or barcode
 * @param page - Page, 1 for the first
 * @returns Address with the fields to send
 */
function addressOf(query: string, page: number): URL {
    const address: URL = new URL(barcode.test(query) ? `${food.product}${query}` : food.search);
    if (!barcode.test(query)) {
        address.searchParams.set("q", query);
        address.searchParams.set("langs", searchLanguages);
        address.searchParams.set("page_size", String(pageSize));
        address.searchParams.set("page", String(page));
    }
    address.searchParams.set("fields", productFields);
    return address;
}

/**
 * Turns a product as Open Food Facts sends it into a {@link Product}, rounded as `Foods.md` writes it;
 * a missing nutrient counts as 0, a missing serving too, which then is asked for, see {@link servingsFill}.
 * - `nutrients`: Its nutrients by their names.
 * - `kcal`: Its kcal per 100 g, not a number when missing.
 * - `name`: Its clean name, see {@link nameOf}.
 *
 * @param sent - Product as sent
 * @returns Product, or `null` when it has no name or no kcal, so it cannot count
 */
function productOf(sent: ProductSent): Product | null {
    const nutrients: { [nutrient: string]: number | string | undefined } = sent.nutriments ?? {};
    const kcal: number = Number(nutrients["energy-kcal_100g"]);
    const name: string = nameOf(sent.product_name ?? "");
    if (name === "" || !Number.isFinite(kcal))
        return null;

    return {
        name: name,
        kcal: roundOf(kcal, 0),
        protein: roundOf(Number(nutrients.proteins_100g) || 0, 1),
        carbs: roundOf(Number(nutrients.carbohydrates_100g) || 0, 1),
        fat: roundOf(Number(nutrients.fat_100g) || 0, 1),
        portion: roundOf(Number(sent.serving_quantity), 0) || 0,
        barcode: sent.code ?? "",
        brand: firstOf(sent.brands),
        store: firstOf(sent.stores),
        pack: packOf(sent.quantity),
    };
}

/**
 * Asks Open Food Facts for the serving of a product, anonymously, see {@link agent}, unless asked before,
 * see {@link servings}; an unknown barcode answers `404 Not Found` and has none.
 * - `known`: Grams of the serving asked for before, `undefined` when not asked yet.
 * - `address`: Address of the product, asking only for its serving.
 * - `grams`: Grams of its serving, 0 for none.
 *
 * @param code - Barcode of the product
 * @returns Grams of its serving, 0 when its maker gives none
 * @throws {Error} - When Open Food Facts does not answer in time or answers with an error
 */
async function servingAsk(code: string): Promise<number> {
    const known: number | undefined = servings.get(code);
    if (known !== undefined)
        return known;

    const address: URL = new URL(`${food.product}${code}`);
    address.searchParams.set("fields", "serving_quantity");
    const response: Response = await fetch(address, {
        headers: { "User-Agent": agent },
        signal: AbortSignal.timeout(answerTime),
    });
    if (!response.ok && response.status !== 404)
        throw new Error(`Open Food Facts answered ${response.status}`);
    const grams: number = roundOf(Number((await response.json() as Answer).product?.serving_quantity), 0) || 0;
    servings.set(code, grams);
    return grams;
}

/**
 * Fills in the serving of each product without one, which the search of Open Food Facts never sends,
 * asking for all of them at once; a product whose serving cannot be asked for keeps none.
 *
 * @param products - Products, some without serving
 * @returns The products with their servings, in their order
 */
async function servingsFill(products: Product[]): Promise<Product[]> {
    return await Promise.all(products.map(async (product: Product): Promise<Product> => {
        if (product.portion > 0 || product.barcode === "")
            return product;
        try {
            return { ...product, portion: await servingAsk(product.barcode) };
        } catch (error: unknown) {
            console.error(new Date().toISOString(), "Open Food Facts", product.barcode, error);
            return product;
        }
    }));
}

/**
 * Asks Open Food Facts for a page of the products of a search, anonymously, see {@link agent}.
 * An unknown barcode answers `404 Not Found`, with an answer without product; a barcode has one page.
 * - `answer`: Answer of Open Food Facts.
 * - `sent`: Products as sent, the hits of a search or the one product of a barcode.
 * - `products`: Those that can count.
 *
 * @param query - Name or barcode
 * @param page - Page, 1 for the first
 * @returns The page of products
 * @throws {Error} - When Open Food Facts does not answer in time or answers with an error
 */
async function productsAsk(query: string, page: number): Promise<ProductsPage> {
    const response: Response = await fetch(addressOf(query, page), {
        headers: { "User-Agent": agent },
        signal: AbortSignal.timeout(answerTime),
    });
    if (!response.ok && response.status !== 404)
        throw new Error(`Open Food Facts answered ${response.status}`);

    const answer: Answer = await response.json() as Answer;
    const sent: ProductSent[] = answer.hits ?? (answer.product === undefined ? [] : [answer.product]);
    const products: Product[] = sent
        .map((product: ProductSent): Product | null => productOf(product))
        .filter((product: Product | null): product is Product => product !== null);
    return {
        products: products,
        total: answer.count ?? products.length,
        exact: answer.is_count_exact ?? true,
        more: page < (answer.page_count ?? 0),
    };
}

/**
 * Finds foods by a name or a barcode, see {@link FoodsFound}: my foods first, then a page of the products
 * of Open Food Facts, each with its serving, see {@link servingsFill}.
 * The one search for foods, of the food view and of the entry by category of the day.
 * - `query`: Search without spaces at its ends, in small letters.
 * - `mine`: My foods.
 * - `uses`: How often each food was eaten, see {@link usesRead}.
 * - `foods`: My foods found.
 * - `none`: What a search finds on Open Food Facts that does not ask it.
 * - `found`: The page of products found.
 *
 * @param text - Search as typed, like `ric` or `20112745`
 * @param page - Page of the products, 1 for the first; anything else that is no whole number above 0 counts as 1
 * @returns Foods found
 */
export async function foodsFind(text: string, page: number): Promise<FoodsFound> {
    const query: string = text.trim().toLowerCase();
    const mine: Food[] = foodsRead();
    const uses: Map<string, number> = usesRead();
    const foods: Food[] = mine
        .filter((candidate: Food): boolean => labelOf(candidate).toLowerCase().includes(query) || candidate.barcode === query)
        .sort((first: Food, second: Food): number =>
            (uses.get(keyOf(second)) ?? 0) - (uses.get(keyOf(first)) ?? 0)
            || first.name.localeCompare(second.name));
    const none: Omit<FoodsFound, "foods" | "products"> = { total: 0, exact: true, more: false };
    if (query.length < searchLength)
        return { foods: foods, products: [], ...none };

    try {
        const found: ProductsPage = await productsAsk(query, Number.isInteger(page) && page > 0 ? page : 1);
        const products: Product[] = await servingsFill(found.products.filter((product: Product): boolean =>
            !mine.some((candidate: Food): boolean => candidate.barcode === product.barcode)));
        return { foods: foods, products: products, total: found.total, exact: found.exact, more: found.more };
    } catch (error: unknown) {
        console.error(new Date().toISOString(), "Open Food Facts", error);
        return { foods: foods, products: null, ...none };
    }
}

/**
 * Adds a food to `Foods.md` as the last row of its table, with its brand and store, every other line staying as it is,
 * but a head of the table without their columns, which gets them, see {@link tableHeadOf};
 * creates `Foods.md` with its head, see {@link fileHead}, when it does not exist yet.
 * Cleans the name, see {@link nameOf}, and rounds the numbers, see {@link roundOf}.
 * A value typed that is no number comes as `null`, since JSON has no `NaN`, and is refused like any other non-number.
 * - `values`: Values of the food as sent, each to be a number of 0 or more.
 * - `added`: The food as written.
 * - `lines`: Lines of `Foods.md`.
 * - `last`: Index of the last line of its table.
 * - `header`: Index of the header of its table.
 *
 * @param sent - Food as the page sends it, picked from Open Food Facts with its brand and store, or typed by hand
 * @returns The food as written
 * @throws {Error} - When the name is empty or another food has its name, brand and store, ignoring case,
 *   the brand or the store is empty,
 *   a value is no number of 0 or more, the portion not more than 0, the barcode not only digits,
 *   or `Foods.md` lies outside the new system or holds no table
 */
export function foodAdd(sent: Food): Food {
    const values: unknown[] = [sent.kcal, sent.protein, sent.carbs, sent.fat, sent.portion];
    if (!values.every((value: unknown): boolean => typeof value === "number" && value >= 0))
        throw new Error(`No numbers of a food: ${JSON.stringify(sent)}`);

    const added: Food = {
        name: nameOf(String(sent.name ?? "")),
        kcal: roundOf(sent.kcal, 0),
        protein: roundOf(sent.protein, 1),
        carbs: roundOf(sent.carbs, 1),
        fat: roundOf(sent.fat, 1),
        portion: roundOf(sent.portion, 0),
        barcode: String(sent.barcode ?? "").trim(),
        brand: brandOf(String(sent.brand ?? "")),
        store: brandOf(String(sent.store ?? "")),
    };
    if (added.name === "" || foodsRead().some((mine: Food): boolean => keyOf(mine) === keyOf(added)))
        throw new Error(`No new food: ${labelOf(added)}`);
    if (added.brand === "" || added.store === "")
        throw new Error(`No brand or store of a food: ${JSON.stringify(sent)}`);
    if (added.portion === 0)
        throw new Error(`No portion of a food: ${JSON.stringify(sent)}`);
    if (!/^\d*$/.test(added.barcode))
        throw new Error(`No barcode: ${added.barcode}`);
    if (!writeAllowed(food.foods))
        throw new Error(`No writing outside the new system: ${food.foods}`);

    const lines: string[] = existsSync(food.foods) ? readFileSync(food.foods, "utf8").split("\n") : [...fileHead, ""];
    const last: number = lines.findLastIndex((line: string): boolean => line.startsWith("|"));
    const header: number = lines.findIndex((line: string): boolean => line.startsWith("|"));
    if (last === -1)
        throw new Error(`No table in ${food.foods}`);

    lines.splice(last + 1, 0, `| ${added.name} | ${added.kcal} | ${added.protein} | ${added.carbs} | ${added.fat} `
        + `| ${added.portion} | ${added.barcode} | ${added.brand} | ${added.store} |`);
    if (!lines[header].includes("| Brand |"))
        lines.splice(header, tableHead, ...tableHeadOf());
    mkdirSync(dirname(food.foods), { recursive: true });
    writeFileSync(food.foods, lines.join("\n"));
    return added;
}

/**
 * Adds up what foods or meals give.
 *
 * @param parts - What each gives
 * @returns Their sum, 0 each for none
 */
function sumOf(parts: Nutrients[]): Nutrients {
    return parts.reduce((sum: Nutrients, part: Nutrients): Nutrients => ({
        kcal: sum.kcal + part.kcal, protein: sum.protein + part.protein, carbs: sum.carbs + part.carbs, fat: sum.fat + part.fat,
    }), { kcal: 0, protein: 0, carbs: 0, fat: 0 });
}

/**
 * Turns a line `X-FOOD` of a meal into what its food gives, see {@link Eaten}, with its name, brand and store
 * as the line writes them.
 * - `read`: The line as read, see {@link lineOf}.
 * - `known`: The food in `Foods.md`, `undefined` when it holds none, see {@link foodOfLine}.
 * - `grams`: Grams that count.
 * - `share`: Share of 100 g eaten, 0 for an unknown food.
 *
 * @param line - Line like `Skyr natur;K-Classic;Kaufland;150` or `Reis;150`
 * @param mine - My foods by their keys and names, see {@link foodsByKeyRead}
 * @returns The food with what it gives
 */
function eatenOf(line: string, mine: Map<string, Food>): Eaten {
    const read: Line = lineOf(line);
    const known: Food | undefined = foodOfLine(read, mine);
    const grams: number = read.grams ?? known?.portion ?? 0;
    const share: number = known === undefined ? 0 : grams / 100;
    return {
        name: read.name, brand: read.brand, store: read.store, grams: grams, estimate: read.grams === null || read.guessed,
        known: known !== undefined,
        kcal: share * (known?.kcal ?? 0), protein: share * (known?.protein ?? 0),
        carbs: share * (known?.carbs ?? 0), fat: share * (known?.fat ?? 0),
    };
}

/**
 * Turns the log entry of a meal into a {@link Meal}.
 * - `foods`: Its foods with what each gives.
 *
 * @param entry - Log entry of the category `Food`
 * @param mine - My foods by their keys and names, see {@link foodsByKeyRead}
 * @returns Meal with what it gives
 */
function mealOf(entry: Entry, mine: Map<string, Food>): Meal {
    const foods: Eaten[] = entry.foods.map((line: string): Eaten => eatenOf(line, mine));
    return {
        ...sumOf(foods), id: entry.id, start: entry.start, title: entry.title, location: entry.location,
        foods: foods, estimate: foods.some((eaten: Eaten): boolean => eaten.estimate),
    };
}

/**
 * Reads the meals of a day with what they give: the log entries of the category `Food` that start on the day
 * in Berlin time, from 00:00 to 00:00, read from noon the day before to noon the day after, which holds the whole day.
 * A food counts its grams, or its usual portion when the meal lists none; a food not in `Foods.md` counts nothing.
 * - `noon`: Noon of the day in UTC, in milliseconds.
 * - `mine`: My foods by their keys and names, see {@link foodsByKeyRead}.
 * - `meals`: Meals of the day with what they give.
 *
 * @param date - Day like `2026-10-10`
 * @returns The meals of the day with what they give together
 * @throws {Error} - When the date is not written like `2026-10-10`
 */
export function foodDayRead(date: string): FoodDay {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date))
        throw new Error(`No date ${date}`);

    const noon: number = new Date(`${date}T12:00:00Z`).getTime();
    const mine: Map<string, Food> = foodsByKeyRead();
    const meals: Meal[] = mealsRead(new Date(noon - dayLength).toISOString(), new Date(noon + dayLength).toISOString())
        .filter((entry: Entry): boolean => berlinDateOf(new Date(entry.start)) === date)
        .sort((first: Entry, second: Entry): number => first.start.localeCompare(second.start))
        .map((entry: Entry): Meal => mealOf(entry, mine));
    return { ...sumOf(meals), meals: meals, estimate: meals.some((meal: Meal): boolean => meal.estimate) };
}

/**
 * Gives what the meals among entries give, counted as {@link foodDayRead} counts them, for the entries of the day view:
 * each entry of the category `Food` that lists foods.
 * - `mine`: My foods by their keys and names, see {@link foodsByKeyRead}.
 *
 * @param entries - Entries, like those of a day
 * @returns {@link Meal} of each entry that is one, by the identifier of the entry
 */
export function mealsOf(entries: Entry[]): Map<string, Meal> {
    const mine: Map<string, Food> = foodsByKeyRead();
    return new Map(entries
        .filter((entry: Entry): boolean => entry.category === foodName && entry.foods.length > 0)
        .map((entry: Entry): [string, Meal] => [entry.id, mealOf(entry, mine)]));
}

/**
 * Tells whether a line `X-FOOD` sent to be written is well formed: one of today, see {@link partsOf}, a name,
 * brand and store without `|`, like `Skyr natur;K-Classic;Kaufland;150`, grams above 0 or none, and maybe the meal
 * it belongs to; or an older one,
 * see {@link foodLine}, a name without `;` and `|`, then grams above 0 when given, like `Reis;150` or `Eier`,
 * and for a food of a meal the meal, servings above 0 and maybe its variant, like `Hackfleisch;62.5;ChiliConCarne;0.5`.
 * Whether `Foods.md` holds the food is not asked, so a meal keeps a food that left `Foods.md` when it is moved.
 * - `read`: The line as read, see {@link lineOf}.
 * - `parts`: A line of today cut into its five parts, `null` for an older one.
 * - `old`: An older line cut into its parts, `null` when it is none.
 *
 * @param line - Line as the page sends it
 * @returns Whether the line may be written
 */
export function foodLineAllows(line: string): boolean {
    const read: Line = lineOf(line);
    const parts: string[] | null = partsOf(line);
    if (parts !== null)
        return read.name !== "" && !parts.some((part: string): boolean => part.includes("|"))
            && (read.grams === null || read.grams > 0);
    const old: RegExpExecArray | null = foodLine.exec(line.trim());
    return old !== null && read.name !== "" && !/[;|]/.test(read.name) && (read.grams === null || read.grams > 0)
        && (old[5] === undefined || numberOf(old[5]) > 0);
}

/**
 * Writes a name of mine as all my names are written, in one word, each word with a capital, the rest as typed,
 * like `ChiliConCarne` of `Chili con Carne` or `Käsesalat` of `käsesalat`, cleaned for a table, see {@link nameOf}.
 *
 * @param typed - Name as typed
 * @returns Name in one word
 */
function oneWordOf(typed: string): string {
    return nameOf(typed).split(" ").filter((word: string): boolean => word !== "")
        .map((word: string): string => word.charAt(0).toUpperCase() + word.slice(1)).join("");
}

/**
 * Reads my meals of `Meals.md`, each with its foods in their order, see {@link Dish}; a table written before, in
 * variants with servings and grams, by the foods of all its variants, by their names alone.
 * - `mine`: My foods by their keys and names, see {@link foodsByKeyRead}.
 * - `rows`: The lines of the table.
 * - `old`: Whether the table was written in variants, its header naming `Variant`.
 * - `dishes`: The meals read so far, by their names in small letters.
 *
 * @returns My meals in the order of the table, none while `Meals.md` does not exist
 */
export function dishesRead(): Dish[] {
    if (!existsSync(food.meals))
        return [];

    const mine: Map<string, Food> = foodsByKeyRead();
    const rows: string[] = readFileSync(food.meals, "utf8").split("\n").filter((line: string): boolean => line.startsWith("|"));
    const old: boolean = rows[0]?.includes("| Variant |") ?? false;
    const dishes: Map<string, Dish> = new Map();
    rows.slice(tableHead)
        .map((line: string): string[] => line.split("|").slice(1, -1).map((cell: string): string => cell.trim()))
        .filter((cells: string[]): boolean => (cells[0] ?? "") !== "" && (cells[old ? 3 : 1] ?? "") !== "")
        .forEach((cells: string[]): void => {
            const dish: Dish = dishes.get(cells[0].toLowerCase()) ?? { name: cells[0], foods: [], kcal: 0 };
            const line: string = old ? cells[3] : `${cells[1]};${cells[2] ?? ""};${cells[3] ?? ""}`;
            if (!dish.foods.includes(line))
                dish.foods.push(line);
            dishes.set(cells[0].toLowerCase(), dish);
        });
    return [...dishes.values()].map((dish: Dish): Dish => ({
        ...dish, kcal: sumOf(dish.foods.map((line: string): Eaten => eatenOf(line, mine))).kcal,
    }));
}

/**
 * Writes my meals into `Meals.md` anew, its head first, see {@link mealsHead}, then a row per food of each meal,
 * so a table written before in variants turns into the table of today.
 * - `rows`: The rows of the table.
 *
 * @param dishes - My meals to write, in their order
 */
function dishesWrite(dishes: Dish[]): void {
    const rows: string[] = dishes.flatMap((dish: Dish): string[] => dish.foods.map((line: string): string => {
        const read: Line = lineOf(line);
        return `| ${dish.name} | ${read.name} | ${read.brand} | ${read.store} |`;
    }));
    mkdirSync(dirname(food.meals), { recursive: true });
    writeFileSync(food.meals, [...mealsHead, ...rows, ""].join("\n"));
}

/**
 * Writes a meal into `Meals.md`, new or changed for good, its foods in place of those it had, at its place,
 * a new meal last; the name in one word, see {@link oneWordOf}, each food by its name, brand and store,
 * cleaned for a table, see {@link nameOf}, each once.
 * - `meals`: My meals so far.
 * - `name`: Name of the meal, as a meal of mine of the name, ignoring case, already writes it.
 * - `foods`: Its foods, like `Hackfleisch;Gut & Günstig;Edeka`.
 *
 * @param sent - Name and foods as the page sends them
 * @returns All my meals
 * @throws {Error} - When the name is empty, it holds fewer than two foods, or `Meals.md` lies outside the new system
 */
export function dishAdd(sent: { name?: string; foods?: string[] }): Dish[] {
    const meals: Dish[] = dishesRead();
    const typed: string = oneWordOf(String(sent.name ?? ""));
    const name: string = meals.find((dish: Dish): boolean => dish.name.toLowerCase() === typed.toLowerCase())?.name
        ?? typed;
    const foods: string[] = [...new Set((sent.foods ?? []).map((line: string): string => {
        const read: Line = lineOf(String(line));
        return [read.name, read.brand, read.store].map(nameOf).join(";");
    }))].filter((line: string): boolean => !line.startsWith(";"));
    if (name === "")
        throw new Error("No name of a meal");
    if (foods.length < 2)
        throw new Error(`No foods of a meal: ${JSON.stringify(sent.foods)}`);
    if (!writeAllowed(food.meals))
        throw new Error(`No writing outside the new system: ${food.meals}`);

    const at: number = meals.findIndex((dish: Dish): boolean => dish.name.toLowerCase() === name.toLowerCase());
    const meal: Dish = { name: name, foods: foods, kcal: 0 };
    dishesWrite(at === -1 ? [...meals, meal] : meals.map((dish: Dish, index: number): Dish => index === at ? meal : dish));
    return dishesRead();
}

/**
 * Removes a meal from `Meals.md`, ignoring case, every other meal staying as it is.
 *
 * @param name - Name of the meal
 * @returns All my meals left
 * @throws {Error} - When `Meals.md` lies outside the new system
 */
export function dishRemove(name: string): Dish[] {
    if (!existsSync(food.meals))
        return [];
    if (!writeAllowed(food.meals))
        throw new Error(`No writing outside the new system: ${food.meals}`);
    dishesWrite(dishesRead().filter((dish: Dish): boolean => dish.name.toLowerCase() !== name.trim().toLowerCase()));
    return dishesRead();
}

