/**
 * ## Food
 *
 * Shows what I ate on a day, and my foods, in the scheme of the day view; my water I count in the trackers of the day.
 * The bar of the day, as the day has it: its weekday short and its date, like `Tue, 13.10.2026`, between the arrows
 * to the day before and after, a small icon beside it back to today, faded and off on today.
 * The day: the number of its meals and its totals
 * of kcal, protein, carbs and fat, all alike, without goals, so the log stays a log, not calorie control;
 * then each meal of the log: its start, linking to the day in the day view,
 * what and where, and its kcal, below it each of its foods with its grams and kcal.
 * A food listed without grams counts its usual portion; every amount is rounded and an estimate anyway,
 * so none is marked as one. A food not in `Foods.md` and a meal that lists no foods count nothing,
 * and a line below the totals says so.
 * My meals: each only its foods, and new meals, above my foods, see `meals.ts`.
 * My foods: the food search, which finds mine first, then those of Open Food Facts, and adds new ones, see `search.ts`.
 * It opens on today's calendar date, which turns at 00:00, also after a reload, and while it shows today it moves on
 * with it; only a link like `/food?date=2026-10-10` opens on that day, see `today.ts`.
 *
 * - `./foods.ts`: Loads the meals of a day, writes amounts and makes elements.
 * - `./search.ts`: Finds foods, mine first, then on Open Food Facts, and adds new ones.
 * - `./meals.ts`: The section of my meals.
 * - `../day/places.ts`: Gives the name of the place of a meal.
 * - `../day/times.ts`: Writes a day as its date, like `13.10.2026`.
 * - `../skill/attempts.ts`: Writes a date as a day in the form of the reader.
 * - `../today.ts`: Gives today's calendar date and the day a link asks for, and moves the food view on to the new day
 *   while it shows today.
 * - `../icons.ts`: Puts the arrows and the icon back to today into their buttons, their words as tooltip.
 * - `lucide`: The icons of the arrows and of today.
 * - `./food.css`: Look of the food view.
 */

import { amountOf, elementOf, foodDayLoad, foodNameOf } from "./foods.ts";
import { foodSearchOf } from "./search.ts";
import { mealsSectionOf } from "./meals.ts";
import { labelOf } from "../day/places.ts";
import { dateTextOf } from "../day/times.ts";
import { dayOf } from "../skill/attempts.ts";
import { askedDayOf, calendarTodayOf, todayFollow } from "../today.ts";
import { iconPut } from "../icons.ts";
import { CalendarCheck, ChevronLeft, ChevronRight } from "lucide";
import "./food.css";

import type { Eaten, FoodDay, Meal } from "./foods.ts";


/**
 * Day shown, like `2026-10-10`.
 */
let shown: string = "";


/**
 * Writes an amount with its unit, whole.
 *
 * @param value - Amount
 * @param unit - Unit, like `kcal` or `g`
 * @returns Text like `1,284 kcal` or `62 g`
 */
function amountTextOf(value: number, unit: string): string {
    return `${amountOf(value, 0)} ${unit}`;
}

/**
 * Turns a day into its date at midnight in local time.
 *
 * @param day - Day like `2026-10-10`
 * @returns Date
 */
function dateOf(day: string): Date {
    const [year, month, date]: number[] = day.split("-").map(Number);
    return new Date(year, month - 1, date);
}

/**
 * Shows the totals of a day: the number of meals, kcal, protein, carbs and fat, each with its name small above;
 * below them a line for each kind of food or meal they leave out.
 * - `totals`: The totals side by side.
 * - `tiles`: Name and amount of each total.
 * - `unknown`: Names of the foods not in `Foods.md`, each once.
 * - `empty`: Number of meals that list no foods.
 * - `hints`: Lines below the totals, empty ones left out.
 *
 * @param day - Meals of the day with what they give together
 */
function totalsShow(day: FoodDay): void {
    const totals: HTMLElement = elementOf("div", "food-totals", "");
    const tiles: [string, string][] = [
        ["Meals", String(day.meals.length)],
        ["Energy", amountTextOf(day.kcal, "kcal")],
        ["Protein", amountTextOf(day.protein, "g")],
        ["Carbs", amountTextOf(day.carbs, "g")],
        ["Fat", amountTextOf(day.fat, "g")],
    ];
    for (const [name, amount] of tiles) {
        const tile: HTMLElement = elementOf("div", "food-total", "");
        tile.append(elementOf("span", "food-label", name), elementOf("span", "food-amount", amount));
        totals.append(tile);
    }

    const unknown: string[] = [];
    for (const meal of day.meals)
        for (const eaten of meal.foods)
            if (!eaten.known && !unknown.includes(eaten.name))
                unknown.push(eaten.name);
    const empty: number = day.meals.filter((meal: Meal): boolean => meal.foods.length === 0).length;
    const hints: string[] = [
        unknown.length > 0 ? `Not counted, not in my foods: ${unknown.join(", ")}` : "",
        empty > 0 ? `Not counted: ${empty} ${empty === 1 ? "meal lists" : "meals list"} no foods` : "",
    ];
    document.getElementById("food-totals")?.replaceChildren(totals, ...hints
        .filter((hint: string): boolean => hint !== "")
        .map((hint: string): HTMLElement => elementOf("p", "food-hint", hint)));
}

/**
 * Builds the line of a food of a meal: its name, its brand and store in brackets after it, those it has,
 * as everywhere, like `Reis (Golden Sun, Lidl)`, marked when not in `Foods.md`, its grams and its kcal.
 * - `name`: Name of the food, see `foodNameOf` in `./foods.ts`.
 *
 * @param eaten - Food with what it gives
 * @returns Line in the columns of the meals, the first one empty
 */
function eatenLineOf(eaten: Eaten): HTMLElement {
    const line: HTMLElement = elementOf("div", "food-line", "");
    const name: HTMLElement = foodNameOf("food-what", eaten.name, eaten.brand, eaten.store);
    if (!eaten.known)
        name.append(elementOf("span", "food-place", " · not in my foods"));
    line.append(
        elementOf("span", "", ""),
        name,
        elementOf("span", "food-grams", eaten.grams > 0 ? amountTextOf(eaten.grams, "g") : ""),
        elementOf("span", "food-kcal", eaten.known ? amountTextOf(eaten.kcal, "kcal") : ""),
    );
    return line;
}

/**
 * Builds the lines of a meal: its start, linking to its day in the day view, what and where, and its kcal,
 * none when it lists no foods, since then it counts nothing; below it a line per food, or a hint when it lists none.
 * - `head`: Line of the meal itself.
 * - `start`: Its start, like `13:00`.
 * - `what`: What I ate, then where.
 *
 * @param meal - Meal with what it gives
 * @returns Lines of the meal
 */
function mealLinesOf(meal: Meal): HTMLElement[] {
    const head: HTMLElement = elementOf("div", "food-line food-meal", "");
    const start: HTMLAnchorElement = document.createElement("a");
    const what: HTMLElement = elementOf("span", "food-what", meal.title);
    start.className = "food-time";
    start.href = `/?date=${shown}`;
    start.textContent = new Date(meal.start).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
    if (meal.location !== "")
        what.append(elementOf("span", "food-place", ` · ${labelOf(meal.location)}`));
    head.append(start, what, elementOf("span", "", ""),
        elementOf("span", "food-kcal", meal.foods.length > 0 ? amountTextOf(meal.kcal, "kcal") : ""));

    const lines: HTMLElement[] = meal.foods.map(eatenLineOf);
    if (meal.foods.length === 0) {
        const none: HTMLElement = elementOf("div", "food-line", "");
        none.append(elementOf("span", "", ""), elementOf("span", "food-place", "No foods listed"));
        lines.push(none);
    }
    return [head, ...lines];
}

/**
 * Shows a day: writes its weekday short and its date in the bar, like `Tue, 13.10.2026`, turns the icon back to today
 * off on today, then loads its meals and shows them with their totals, unless another day was asked for meanwhile.
 * - `food`: Meals of the day with what they give.
 * - `lines`: Lines of all meals.
 *
 * @param day - Day like `2026-10-10`
 * @throws {Error} - When the reader cannot answer
 */
async function dayShow(day: string): Promise<void> {
    shown = day;
    (document.getElementById("food-weekday") as HTMLElement).textContent =
        new Date(`${day}T12:00:00`).toLocaleDateString("en-GB", { weekday: "short" });
    (document.getElementById("food-date") as HTMLElement).textContent = dateTextOf(day);
    (document.getElementById("food-today") as HTMLButtonElement).disabled = day === calendarTodayOf();

    const food: FoodDay = await foodDayLoad(day);
    if (day !== shown)
        return;
    const lines: HTMLElement[] = food.meals.flatMap(mealLinesOf);
    totalsShow(food);
    if (lines.length === 0)
        lines.push(elementOf("p", "food-none", "No meals in the log on this day"));
    document.getElementById("food-meals")?.replaceChildren(...lines);
}

/**
 * Shows a day, or a hint when the reader cannot read its meals.
 *
 * @param day - Day like `2026-10-10`
 */
function dayOpen(day: string): void {
    dayShow(day).catch((error: unknown): void => {
        console.error(error);
        document.getElementById("food-totals")?.replaceChildren();
        document.getElementById("food-meals")?.replaceChildren(elementOf("p", "food-none", "The meals cannot be read"));
    });
}

/**
 * Shows the day some days before or after the one shown.
 * - `date`: Date of the day to show.
 *
 * @param days - Days to go, like -1 for the day before
 */
function dayMove(days: number): void {
    const date: Date = dateOf(shown);
    date.setDate(date.getDate() + days);
    dayOpen(dayOf(date));
}


/**
 * Starts the food view after the router has put its HTML into the page:
 * the arrows and the icon back to today, the day a link asks for or today's calendar date, which moves on
 * to the new day by itself while it is shown, see `today.ts`, my meals and the food search.
 * - `before`, `after`, `today`: Buttons to the day before and after, and back to today.
 */
export function foodStart(): void {
    const before: HTMLElement = document.getElementById("food-before") as HTMLElement;
    const after: HTMLElement = document.getElementById("food-after") as HTMLElement;
    const today: HTMLElement = document.getElementById("food-today") as HTMLElement;
    iconPut(before, ChevronLeft, "Day before");
    iconPut(after, ChevronRight, "Day after");
    iconPut(today, CalendarCheck, "Back to today");
    before.addEventListener("click", (): void => dayMove(-1));
    after.addEventListener("click", (): void => dayMove(1));
    today.addEventListener("click", (): void => dayOpen(calendarTodayOf()));
    document.getElementById("food-dishes")?.append(mealsSectionOf());
    document.getElementById("food-search")?.append(foodSearchOf(null, null));
    dayOpen(askedDayOf() ?? calendarTodayOf());
    todayFollow((): string => shown, dayOpen);
}
