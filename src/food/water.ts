/**
 * ## Water
 *
 * The card of my water in the food view, above my foods, for the day the food view shows:
 * its name with the litres against my goal, like `1.5 / 2.5 l`, below it a bar as full as the glasses reach my goal,
 * beside the bar a button with only a glass on it, and `−`.
 * Every other drink, like `Kaffee`, counts as a glass too; a tap on the glass logs one more glass of water,
 * at the time of the tap on the shown day, `−` takes the last glass of water back. A day still to come takes no glasses.
 * A glass is a log entry `Drink` `Water` of five minutes, sent to the one writer of the log, see `../day/entries.ts`;
 * the day view shows glasses only as small marks in its time grid. The card loads again after every glass.
 *
 * - `../day/trackers.ts`: Loads the trackers of a day, for its glasses and my goal.
 * - `../day/entries.ts`: Sends new and removed entries to the reader.
 * - `../day/times.ts`: Gives now on the shown day.
 * - `./foods.ts`: Writes amounts and makes elements.
 * - `../today.ts`: Gives today's calendar date.
 * - `../icons.ts`: Puts icons into the buttons, their words as tooltip.
 * - `lucide`: The icons glass and minus.
 */

import { trackersFetch } from "../day/trackers.ts";
import { entryAdd, entryDelete } from "../day/entries.ts";
import { nowOn } from "../day/times.ts";
import { amountOf, elementOf } from "./foods.ts";
import { calendarTodayOf } from "../today.ts";
import { iconPut } from "../icons.ts";
import { GlassWater, Minus } from "lucide";

import type { Glass, Trackers } from "../day/trackers.ts";


/**
 * Minutes a glass of water lasts in the log.
 */
const glassMinutes: number = 5;

/**
 * Day the card shows, like `2026-10-10`.
 */
let shown: string = "";


/**
 * Logs one more glass of water, at now on a day, five minutes long, see `nowOn` in `times.ts`.
 * - `start`: Start of the glass.
 *
 * @param day - Day like `2026-10-10`
 * @throws {Error} - When the reader does not take the glass
 */
async function glassAdd(day: string): Promise<void> {
    const start: Date = nowOn(new Date(`${day}T00:00`));
    await entryAdd(null, {
        category: "Drink", title: "Water", location: "", from: "", module: "", type: "", semester: "", note: "",
        foods: [], planned: "", start: start, end: new Date(start.getTime() + glassMinutes * 60 * 1000),
    });
}

/**
 * Builds the card of the water: its name with the litres against my goal, every drink one glass; below it the bar,
 * at its right the glass, which logs one more glass of water, and `−`, which takes the last glass of water back.
 * The card takes no clicks while a glass is sent, so a double tap logs one glass; it loads again once the log changed.
 * - `count`: Number of glasses.
 * - `goal`: Number of glasses of my goal.
 * - `last`: The last glass of water that can be taken back, `undefined` for none.
 * - `coming`: Whether the day is still to come.
 * - `send`: Sends a change of the glasses, the card inert meanwhile, then loads the card of the day shown by then again.
 *
 * @param card - Card of the water
 * @param trackers - Trackers of the day
 * @param day - Day like `2026-10-10`
 * @returns Lines of the card
 */
function waterOf(card: HTMLElement, trackers: Trackers, day: string): HTMLElement[] {
    const head: HTMLElement = elementOf("div", "water-head", "");
    const bar: HTMLElement = elementOf("div", "water-bar", "");
    const fill: HTMLElement = elementOf("div", "water-fill", "");
    const row: HTMLElement = elementOf("div", "water-row", "");
    const add: HTMLButtonElement = document.createElement("button");
    const less: HTMLButtonElement = document.createElement("button");
    const count: number = trackers.glasses.length;
    const goal: number = Math.round(trackers.settings.waterMl / trackers.settings.glassMl);
    const last: Glass | undefined = trackers.glasses.filter((glass: Glass): boolean => glass.water && glass.editable).at(-1);
    const coming: boolean = day > calendarTodayOf();
    const send: (change: () => Promise<void>) => void = (change: () => Promise<void>): void => {
        card.inert = true;
        change()
            .then((): Promise<void> => waterShow(shown))
            .catch((error: unknown): void => console.error(error))
            .finally((): void => {
                card.inert = false;
            });
    };

    head.append(elementOf("h2", "food-heading", "Water"), elementOf("span", "water-litres",
        `${amountOf(count * trackers.settings.glassMl / 1000, 2)} / ${amountOf(trackers.settings.waterMl / 1000, 2)} l`));
    fill.style.width = `${Math.min(count / goal, 1) * 100}%`;
    bar.append(fill);

    add.type = "button";
    add.className = "water-add";
    iconPut(add, GlassWater, `One glass of water more; ${count} of ${goal} glasses, every other drink counts as a glass too`);
    add.disabled = coming;
    add.addEventListener("click", (): void => send((): Promise<void> => glassAdd(day)));
    less.type = "button";
    less.className = "water-less";
    iconPut(less, Minus, "One glass less");
    less.disabled = coming || last === undefined;
    less.addEventListener("click", (): void => send((): Promise<void> => entryDelete(null, last?.id ?? "")));
    row.append(bar, add, less);
    return [head, row];
}

/**
 * Loads the trackers of a day and shows its water, unless another day was asked for meanwhile.
 * - `card`: Card of the water.
 * - `trackers`: Trackers of the day.
 *
 * @param day - Day like `2026-10-10`
 * @throws {Error} - When the reader cannot answer
 */
async function waterShow(day: string): Promise<void> {
    shown = day;
    const card: HTMLElement = document.getElementById("food-water") as HTMLElement;
    const trackers: Trackers = await trackersFetch(day);
    if (day !== shown)
        return;
    card.replaceChildren(...waterOf(card, trackers, day));
}

/**
 * Shows the water of a day, or a hint when the reader cannot read it.
 *
 * @param day - Day like `2026-10-10`
 */
export function waterOpen(day: string): void {
    waterShow(day).catch((error: unknown): void => {
        console.error(error);
        document.getElementById("food-water")?.replaceChildren(elementOf("p", "food-none", "The water cannot be read"));
    });
}
