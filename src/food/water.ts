/**
 * ## Water
 *
 * My water in the bar of the food view, at its right end, for the day it shows, in a soft frame like the trackers
 * of the day: first a glass, so it says water at a glance, then a bar as full as the glasses reach my goal,
 * then `−`, the glasses of the day, like `6`, and `+`, as the counter of the day had them, and grey the litres
 * against my goal, like `1.5 / 2.5 l`.
 * Every other drink, like `Kaffee`, counts as a glass too; `+` logs one more glass of water,
 * at the time of the tap on the shown day, `−` takes the last glass of water back. A day still to come takes no glasses.
 * A glass is a log entry `Drink` `Water` of five minutes, sent to the one writer of the log, see `../day/entries.ts`;
 * the day view shows glasses only as small marks in its time grid. The water loads again after every glass.
 *
 * - `../day/trackers.ts`: Loads the trackers of a day, for its glasses and my goal.
 * - `../day/entries.ts`: Sends new and removed entries to the reader.
 * - `../day/times.ts`: Gives now on the shown day.
 * - `./foods.ts`: Writes amounts and makes elements.
 * - `../today.ts`: Gives today's calendar date.
 * - `../icons.ts`: Makes the glass and puts the icons into the buttons, their words as tooltip.
 * - `lucide`: The icons glass, minus and plus.
 */

import { trackersFetch } from "../day/trackers.ts";
import { entryAdd, entryDelete } from "../day/entries.ts";
import { nowOn } from "../day/times.ts";
import { amountOf, elementOf } from "./foods.ts";
import { calendarTodayOf } from "../today.ts";
import { iconOf, iconPut } from "../icons.ts";
import { GlassWater, Minus, Plus } from "lucide";

import type { Glass, Trackers } from "../day/trackers.ts";


/**
 * Minutes a glass of water lasts in the log.
 */
const glassMinutes: number = 5;

/**
 * Day the water shows, like `2026-10-10`.
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
 * Builds the water: the glass, the bar as full as the glasses reach my goal, `−`, which takes the last glass of water
 * back, the glasses of the day, every drink one glass, `+`, which logs one more glass of water, and grey the litres
 * against my goal; the words of the buttons for screen readers and as tooltip.
 * The water takes no clicks while a glass is sent, so a double tap logs one glass; it loads again once the log changed.
 * - `count`: Number of glasses.
 * - `goal`: Number of glasses of my goal.
 * - `last`: The last glass of water that can be taken back, `undefined` for none.
 * - `coming`: Whether the day is still to come.
 * - `send`: Sends a change of the glasses, the water inert meanwhile, then loads the water of the day shown by then again.
 *
 * @param frame - Frame of the water
 * @param trackers - Trackers of the day
 * @param day - Day like `2026-10-10`
 * @returns Parts of the water, side by side
 */
function waterOf(frame: HTMLElement, trackers: Trackers, day: string): Node[] {
    const glass: SVGElement = iconOf(GlassWater);
    const bar: HTMLElement = elementOf("div", "water-bar", "");
    const fill: HTMLElement = elementOf("div", "water-fill", "");
    const less: HTMLButtonElement = document.createElement("button");
    const add: HTMLButtonElement = document.createElement("button");
    const count: number = trackers.glasses.length;
    const goal: number = Math.round(trackers.settings.waterMl / trackers.settings.glassMl);
    const last: Glass | undefined = trackers.glasses.filter((one: Glass): boolean => one.water && one.editable).at(-1);
    const coming: boolean = day > calendarTodayOf();
    const send: (change: () => Promise<void>) => void = (change: () => Promise<void>): void => {
        frame.inert = true;
        change()
            .then((): Promise<void> => waterShow(shown))
            .catch((error: unknown): void => console.error(error))
            .finally((): void => {
                frame.inert = false;
            });
    };

    glass.classList.add("water-glass");
    fill.style.width = `${Math.min(count / goal, 1) * 100}%`;
    bar.append(fill);
    bar.title = `${count} of ${goal} glasses; every other drink counts as a glass too`;
    less.type = "button";
    less.className = "water-step";
    iconPut(less, Minus, "One glass of water less");
    less.disabled = coming || last === undefined;
    less.addEventListener("click", (): void => send((): Promise<void> => entryDelete(null, last?.id ?? "")));
    add.type = "button";
    add.className = "water-step";
    iconPut(add, Plus, "One glass of water more");
    add.disabled = coming;
    add.addEventListener("click", (): void => send((): Promise<void> => glassAdd(day)));
    return [glass, bar, less, elementOf("span", "water-count", String(count)), add, elementOf("span", "water-litres",
        `${amountOf(count * trackers.settings.glassMl / 1000, 2)} / ${amountOf(trackers.settings.waterMl / 1000, 2)} l`)];
}

/**
 * Loads the trackers of a day and shows its water, unless another day was asked for meanwhile.
 * - `frame`: Frame of the water.
 * - `trackers`: Trackers of the day.
 *
 * @param day - Day like `2026-10-10`
 * @throws {Error} - When the reader cannot answer
 */
async function waterShow(day: string): Promise<void> {
    shown = day;
    const frame: HTMLElement = document.getElementById("food-water") as HTMLElement;
    const trackers: Trackers = await trackersFetch(day);
    if (day !== shown)
        return;
    frame.replaceChildren(...waterOf(frame, trackers, day));
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
