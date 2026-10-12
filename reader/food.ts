/**
 * ## Food
 *
 * Reads my foods from `Foods.md`, finds foods by a name or a barcode, mine first, then on Open Food Facts,
 * adds new foods to `Foods.md`, reads the meals of a day from the log with what they give,
 * and the foods a dish held the last time I ate it.
 * `Foods.md` is one Markdown table with one row per food: its name, kcal, protein, carbs and fat per 100 g,
 * its usual portion in grams, and the Open Food Facts barcode it came from, empty for a food added by hand.
 * A meal is a log entry of the category `Food`: `SUMMARY` what I ate, its foods parted by `, `,
 * like `Reis, Bohnen, Eier`, `LOCATION` where, and one line `X-FOOD` per food, its name in `Foods.md`
 * with the grams I ate, like `X-FOOD:Reis;150`, or without grams, like `X-FOOD:Eier`, when I could not weigh it,
 * as in a restaurant: then the food counts its usual portion, and what it gives is an estimate.
 * Grams guessed, not weighed, like those Claude reads from a photo of a meal, carry `~`, like `X-FOOD:Döner;~400`,
 * and count as an estimate too, since a guess from a photo is about a third off (Fridolfsson 2025).
 * Open Food Facts is asked anonymously: a request carries the search and the name of the dashboard,
 * never my email or my name.
 *
 * - `node:fs`: Reads and writes `Foods.md`.
 * - `node:path`: Gives the folder of `Foods.md`.
 * - `./calendar.ts`: Reads the log and gives the day I lived an instant in.
 * - `./sources.ts`: Names `Foods.md`, the log and the addresses of Open Food Facts, and tells which files the reader may write.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { entriesRead, livedDayOf } from "./calendar.ts";
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
 * A food, one row of `Foods.md`: its {@link Nutrients} per 100 g with its name, portion and barcode.
 *
 * - `name`: Name, by which a meal lists it, like `Reis` of `X-FOOD:Reis;150`; unique, without `|` and `;`.
 * - `portion`: Usual portion in grams, which counts when a meal lists the food without grams.
 * - `barcode`: Open Food Facts barcode it came from, like `20112745`; empty for a food added by hand.
 */
export type Food = Nutrients & {
    name: string;
    portion: number;
    barcode: string;
};

/**
 * A product of Open Food Facts as a {@link Food} to add: its name as Open Food Facts writes it,
 * its portion the serving Open Food Facts gives, else 100 g.
 *
 * - `brand`: Its first brand, like `Golden Sun`, empty when none is known.
 */
export type Product = Food & {
    brand: string;
};

/**
 * What a search finds.
 *
 * - `foods`: My foods whose name holds the search, ignoring case, or whose barcode it is, the most eaten first,
 *   equal ones alphabetical; all of them for an empty search.
 * - `products`: Products of Open Food Facts that are not among my foods, the best match first;
 *   none for a search shorter than {@link searchLength}; `null` when Open Food Facts cannot be reached.
 */
export type FoodsFound = {
    foods: Food[];
    products: Product[] | null;
};

/**
 * A food of a meal with what it gives, its {@link Nutrients}.
 *
 * - `name`: Name of the food, as the meal lists it.
 * - `grams`: Grams eaten as the meal lists them, else the usual portion of the food; 0 for an unknown food without grams.
 * - `estimate`: Whether the grams are the usual portion, because the meal lists none, or guessed, marked by `~`.
 * - `known`: Whether `Foods.md` holds the food; an unknown food gives nothing.
 */
export type Eaten = Nutrients & {
    name: string;
    grams: number;
    estimate: boolean;
    known: boolean;
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
 * - `serving_quantity`: Grams of a serving, as number or as text.
 * - `nutriments`: Nutrients by their names, like `energy-kcal_100g` or `proteins_100g`.
 */
type ProductSent = {
    code?: string;
    product_name?: string;
    brands?: string | string[];
    serving_quantity?: number | string;
    nutriments?: { [nutrient: string]: number | string | undefined };
};

/**
 * Answer of Open Food Facts: `hits` from the search, `product` from the products, missing for an unknown barcode.
 */
type Answer = {
    hits?: ProductSent[];
    product?: ProductSent;
};

/**
 * Category of meals, written as `CATEGORIES:Food` by the entry by category of the day.
 */
export const foodName: string = "Food";

/**
 * Text a new `Foods.md` starts with: its title, what its columns hold, how a meal lists a food,
 * and the head of its table, the header and the line below it.
 */
const fileHead: string[] = [
    "# Foods",
    "",
    "My foods: kcal, protein, carbs and fat per 100 g, the usual portion in grams, and the Open Food Facts barcode.",
    "A meal in the log lists a food by its name, like `X-FOOD:Reis;150` for 150 g, or `X-FOOD:Reis` for its portion.",
    "",
    "| Food | kcal | Protein | Carbs | Fat | Portion | Barcode |",
    "| --- | ---: | ---: | ---: | ---: | ---: | --- |",
];

/**
 * Lines of the table of `Foods.md` before its rows: the header and the line below it.
 */
const tableHead: number = 2;

/**
 * Line `X-FOOD` of a meal: the name of a food, then `;` and the grams when given, `~` before grams guessed,
 * like `Reis;150`, `Milch;200.5`, `Döner;~400` or `Eier`.
 */
const foodLine: RegExp = /^(.+?)(?:;\s*(~)?\s*(\d+(?:[.,]\d+)?))?\s*$/;

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
const productFields: string = "code,product_name,brands,serving_quantity,nutriments";

/**
 * Languages of the names a search looks in: German, since I shop in Germany, and English.
 */
const searchLanguages: string = "de,en";

/**
 * Products a search asks Open Food Facts for; those without name or kcal and those among my foods fall out.
 */
const productsAsked: number = 20;

/**
 * Most products of Open Food Facts a search gives.
 */
const productsGiven: number = 8;

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
            fat: numberOf(cells[4]), portion: numberOf(cells[5]), barcode: cells[6] ?? "",
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
 * Reads my foods by their names in small letters, as a meal finds them, see {@link foodsRead}.
 *
 * @returns Foods by their names in small letters
 */
function foodsByNameRead(): Map<string, Food> {
    return new Map(foodsRead().map((row: Food): [string, Food] => [row.name.toLowerCase(), row]));
}

/**
 * Splits a line `X-FOOD` into the name of its food and its grams, see {@link foodLine}.
 * - `parts`: The line cut into name and grams.
 *
 * @param line - Value of the line, like `Reis;150`
 * @returns Name, and grams or `null` when the line gives none
 */
function lineOf(line: string): [string, number | null] {
    const parts: RegExpExecArray | null = foodLine.exec(line.trim());
    if (parts === null)
        return [line, null];
    return [parts[1].trim(), parts[3] === undefined ? null : numberOf(parts[3])];
}

/**
 * Tells whether a line `X-FOOD` gives grams guessed, not weighed, marked by `~`, see {@link foodLine}.
 *
 * @param line - Value of the line, like `Döner;~400`
 * @returns Whether its grams are guessed
 */
function guessedIs(line: string): boolean {
    return foodLine.exec(line.trim())?.[2] !== undefined;
}

/**
 * Counts how often each food was eaten: the lines `X-FOOD` of the meals in the log up to now.
 * - `uses`: Number of lines by the name of their food in small letters.
 *
 * @returns Number of lines by the name of their food in small letters
 */
function usesRead(): Map<string, number> {
    const uses: Map<string, number> = new Map();
    mealsRead("1970-01-01T00:00:00Z", new Date().toISOString())
        .flatMap((meal: Entry): string[] => meal.foods)
        .forEach((line: string): void => {
            const name: string = lineOf(line)[0].toLowerCase();
            uses.set(name, (uses.get(name) ?? 0) + 1);
        });
    return uses;
}

/**
 * Builds the address that asks Open Food Facts for a search:
 * for a barcode its product, else the products whose names match, in {@link searchLanguages}.
 *
 * @param query - Name or barcode
 * @returns Address with the fields to send
 */
function addressOf(query: string): URL {
    const address: URL = new URL(barcode.test(query) ? `${food.product}${query}` : food.search);
    if (!barcode.test(query)) {
        address.searchParams.set("q", query);
        address.searchParams.set("langs", searchLanguages);
        address.searchParams.set("page_size", String(productsAsked));
    }
    address.searchParams.set("fields", productFields);
    return address;
}

/**
 * Turns a product as Open Food Facts sends it into a {@link Product}, rounded as `Foods.md` writes it;
 * a missing nutrient counts as 0.
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
        portion: roundOf(Number(sent.serving_quantity), 0) || 100,
        barcode: sent.code ?? "",
        brand: ([sent.brands ?? ""].flat()[0] ?? "").split(",")[0].trim(),
    };
}

/**
 * Asks Open Food Facts for the products of a search, anonymously, see {@link agent}.
 * An unknown barcode answers `404 Not Found`, with an answer without product.
 * - `answer`: Answer of Open Food Facts.
 * - `sent`: Products as sent, the hits of a search or the one product of a barcode.
 *
 * @param query - Name or barcode
 * @returns Products that can count, the best match first
 * @throws {Error} - When Open Food Facts does not answer in time or answers with an error
 */
async function productsAsk(query: string): Promise<Product[]> {
    const response: Response = await fetch(addressOf(query), {
        headers: { "User-Agent": agent },
        signal: AbortSignal.timeout(answerTime),
    });
    if (!response.ok && response.status !== 404)
        throw new Error(`Open Food Facts answered ${response.status}`);

    const answer: Answer = await response.json() as Answer;
    const sent: ProductSent[] = answer.hits ?? (answer.product === undefined ? [] : [answer.product]);
    return sent
        .map((product: ProductSent): Product | null => productOf(product))
        .filter((product: Product | null): product is Product => product !== null);
}

/**
 * Finds foods by a name or a barcode, see {@link FoodsFound}: my foods first, then the products of Open Food Facts.
 * The one search for foods, of the food view and of the entry by category of the day.
 * - `query`: Search without spaces at its ends, in small letters.
 * - `mine`: My foods.
 * - `uses`: How often each food was eaten, see {@link usesRead}.
 * - `foods`: My foods found.
 *
 * @param text - Search as typed, like `ric` or `20112745`
 * @returns Foods found
 */
export async function foodsFind(text: string): Promise<FoodsFound> {
    const query: string = text.trim().toLowerCase();
    const mine: Food[] = foodsRead();
    const uses: Map<string, number> = usesRead();
    const foods: Food[] = mine
        .filter((candidate: Food): boolean => candidate.name.toLowerCase().includes(query) || candidate.barcode === query)
        .sort((first: Food, second: Food): number =>
            (uses.get(second.name.toLowerCase()) ?? 0) - (uses.get(first.name.toLowerCase()) ?? 0)
            || first.name.localeCompare(second.name));
    if (query.length < searchLength)
        return { foods: foods, products: [] };

    try {
        const products: Product[] = (await productsAsk(query))
            .filter((product: Product): boolean =>
                !mine.some((candidate: Food): boolean => candidate.barcode === product.barcode))
            .slice(0, productsGiven);
        return { foods: foods, products: products };
    } catch (error: unknown) {
        console.error(new Date().toISOString(), "Open Food Facts", error);
        return { foods: foods, products: null };
    }
}

/**
 * Adds a food to `Foods.md` as the last row of its table, every other line staying as it is;
 * creates `Foods.md` with its head, see {@link fileHead}, when it does not exist yet.
 * Cleans the name, see {@link nameOf}, and rounds the numbers, see {@link roundOf}.
 * A value typed that is no number comes as `null`, since JSON has no `NaN`, and is refused like any other non-number.
 * - `values`: Values of the food as sent, each to be a number of 0 or more.
 * - `added`: The food as written.
 * - `lines`: Lines of `Foods.md`.
 * - `last`: Index of the last line of its table.
 *
 * @param sent - Food as the page sends it, picked from Open Food Facts or typed by hand
 * @returns The food as written
 * @throws {Error} - When the name is empty or another food has it, ignoring case, a value is no number of 0 or more,
 *   the portion not more than 0, the barcode not only digits, or `Foods.md` lies outside the new system or holds no table
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
    };
    if (added.name === "" || foodsRead().some((mine: Food): boolean => mine.name.toLowerCase() === added.name.toLowerCase()))
        throw new Error(`No new name of a food: ${added.name}`);
    if (added.portion === 0)
        throw new Error(`No portion of a food: ${JSON.stringify(sent)}`);
    if (!/^\d*$/.test(added.barcode))
        throw new Error(`No barcode: ${added.barcode}`);
    if (!writeAllowed(food.foods))
        throw new Error(`No writing outside the new system: ${food.foods}`);

    const lines: string[] = existsSync(food.foods) ? readFileSync(food.foods, "utf8").split("\n") : [...fileHead, ""];
    const last: number = lines.findLastIndex((line: string): boolean => line.startsWith("|"));
    if (last === -1)
        throw new Error(`No table in ${food.foods}`);

    lines.splice(last + 1, 0, `| ${added.name} | ${added.kcal} | ${added.protein} | ${added.carbs} | ${added.fat} `
        + `| ${added.portion} | ${added.barcode} |`);
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
 * Turns a line `X-FOOD` of a meal into what its food gives, see {@link Eaten}.
 * - `name`, `written`: Name of the food and the grams the line gives, `null` for none.
 * - `known`: The food in `Foods.md`, `undefined` when it holds none of the name.
 * - `grams`: Grams that count.
 * - `share`: Share of 100 g eaten, 0 for an unknown food.
 *
 * @param line - Line like `Reis;150`
 * @param mine - My foods by their names in small letters
 * @returns The food with what it gives
 */
function eatenOf(line: string, mine: Map<string, Food>): Eaten {
    const [name, written]: [string, number | null] = lineOf(line);
    const known: Food | undefined = mine.get(name.toLowerCase());
    const grams: number = written ?? known?.portion ?? 0;
    const share: number = known === undefined ? 0 : grams / 100;
    return {
        name: name, grams: grams, estimate: written === null || guessedIs(line), known: known !== undefined,
        kcal: share * (known?.kcal ?? 0), protein: share * (known?.protein ?? 0),
        carbs: share * (known?.carbs ?? 0), fat: share * (known?.fat ?? 0),
    };
}

/**
 * Turns the log entry of a meal into a {@link Meal}.
 * - `foods`: Its foods with what each gives.
 *
 * @param entry - Log entry of the category `Food`
 * @param mine - My foods by their names in small letters
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
 * as I live it, a meal after midnight until 05:00 on the evening before, see `livedDayOf` in `calendar.ts`,
 * read from noon the day before to noon the day after, which holds the whole day and its night.
 * A food counts its grams, or its usual portion when the meal lists none; a food not in `Foods.md` counts nothing.
 * - `noon`: Noon of the day in UTC, in milliseconds.
 * - `mine`: My foods by their names in small letters.
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
    const mine: Map<string, Food> = foodsByNameRead();
    const meals: Meal[] = mealsRead(new Date(noon - dayLength).toISOString(), new Date(noon + dayLength).toISOString())
        .filter((entry: Entry): boolean => livedDayOf(new Date(entry.start)) === date)
        .sort((first: Entry, second: Entry): number => first.start.localeCompare(second.start))
        .map((entry: Entry): Meal => mealOf(entry, mine));
    return { ...sumOf(meals), meals: meals, estimate: meals.some((meal: Meal): boolean => meal.estimate) };
}

/**
 * Gives what the meals among entries give, counted as {@link foodDayRead} counts them, for the entries of the day view:
 * each entry of the category `Food` that lists foods.
 * - `mine`: My foods by their names in small letters.
 *
 * @param entries - Entries, like those of a day
 * @returns {@link Meal} of each entry that is one, by the identifier of the entry
 */
export function mealsOf(entries: Entry[]): Map<string, Meal> {
    const mine: Map<string, Food> = foodsByNameRead();
    return new Map(entries
        .filter((entry: Entry): boolean => entry.category === foodName && entry.foods.length > 0)
        .map((entry: Entry): [string, Meal] => [entry.id, mealOf(entry, mine)]));
}

/**
 * Tells whether a line `X-FOOD` sent to be written is well formed, see {@link foodLine}:
 * a name without `;` and `|`, then grams above 0 when given, like `Reis;150` or `Eier`.
 * Whether `Foods.md` holds the food is not asked, so a meal keeps a food that left `Foods.md` when it is moved.
 * - `name`, `grams`: Name of the food and the grams the line gives, `null` for none.
 *
 * @param line - Line as the page sends it
 * @returns Whether the line may be written
 */
export function foodLineAllows(line: string): boolean {
    const [name, grams]: [string, number | null] = lineOf(line);
    return name !== "" && !/[;|]/.test(name) && (grams === null || grams > 0);
}

/**
 * Writes the what of a meal from its lines `X-FOOD`: the names of its foods in their order, parted by `, `,
 * like `Reis, Bohnen, Eier` of `Reis;150`, `Bohnen;100` and `Eier`, as the dialog of the day writes it too.
 *
 * @param foods - Lines `X-FOOD` of the meal
 * @returns What of the meal
 */
export function mealTitleOf(foods: string[]): string {
    return foods.map((line: string): string => lineOf(line)[0]).join(", ");
}

/**
 * Reads the foods of the last meal of a dish, so a dish eaten again starts with the foods it held:
 * the lines `X-FOOD` of the latest meal up to now whose what is the dish, ignoring case.
 * - `dish`: The dish in small letters, without spaces at its ends.
 *
 * @param title - What I ate, like `Reis, Bohnen, Eier`
 * @returns Its lines `X-FOOD` in their order, like `Reis;150`, none when no meal of the dish lists foods
 */
export function dishFoodsRead(title: string): string[] {
    const dish: string = title.trim().toLowerCase();
    return mealsRead("1970-01-01T00:00:00Z", new Date().toISOString())
        .filter((meal: Entry): boolean => meal.title.trim().toLowerCase() === dish && meal.foods.length > 0)
        .sort((first: Entry, second: Entry): number => first.start.localeCompare(second.start))
        .at(-1)?.foods ?? [];
}
