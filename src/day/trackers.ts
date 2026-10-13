/**
 * ## Trackers
 *
 * The card of the trackers of the shown day, below the log above the daily note, as the reader counts them,
 * see `reader/trackers.ts`, calm and basic, side by side in one line, without descriptions under the pointer:
 * - Sleep: how long the night of the day lasted, the sleep I woke up from that morning, like `07h 30m`;
 *   its goal, the spread of my bedtime and the average of the week left out for now, since other things come first.
 * - Water: the glasses of the day between `−` and `+`, like `6`, without a goal, and beside them what they make
 *   in litres, like `1.5 l`; every other drink, like `Kaffee`, counts as a glass too; `+` logs one more glass
 *   of water, at the time of the tap on the shown day, `−` takes the last glass of water back.
 *   A day still to come takes no glasses.
 * - Food: the kcal of the day's meals, a total without goal, and in brackets after it the number of the meals,
 *   like `1,850 kcal (3 meals)`, so a meal missing shows, linking to the day in the food view.
 * - Neck: two tiles over the seven days up to the day: on how many of my study days I did
 *   a neck routine, short or long, like `2 / 5` over `short · study days`, a check from two thirds of them on,
 *   since about two thirds of the sessions already gave the large effects (Chen 2018), and on how many days a long
 *   one against my goal, like `1 / 3` over `long · 7 days`, a check once it is reached; a session is an entry `Body`
 *   of my neck routine, written by the entry by category, and a study day a day with an entry `Skill`;
 *   then my neck pain, rated 0 to 10 with each long session, the mean of my first four weeks against the last four,
 *   like `5.2 → 4.0` over `pain`, the outcome the routine is judged by.
 *   Hidden until I start my neck routine, see {@link neckShown}; its code stays.
 * A glass is a log entry `Drink` `Water` of five minutes, sent to the one writer of the log, see `entries.ts`;
 * the time grid shows glasses only as small marks, see `day.ts`. The card loads again whenever the log of the day changes.
 * The food view loads the trackers too, for the water of its day.
 *
 * - `./entries.ts`: Sends new and removed entries to the reader.
 * - `./times.ts`: Gives now on the shown day.
 * - `../food/foods.ts`: Writes amounts and makes elements.
 * - `../skill/attempts.ts`: Writes a date as a day in the form of the reader.
 * - `../today.ts`: Gives today's calendar date.
 * - `../icons.ts`: Makes the icons of the buttons.
 * - `lucide`: The icons glass, minus, plus and check.
 * - `fullcalendar`: Calendar that shows the day.
 */

import { entryAdd, entryDelete } from "./entries.ts";
import { lengthOf, nowOn } from "./times.ts";
import { amountOf, elementOf } from "../food/foods.ts";
import { dayOf } from "../skill/attempts.ts";
import { calendarTodayOf } from "../today.ts";
import { iconOf, iconWordsOf } from "../icons.ts";
import { Check, GlassWater, Minus, Plus } from "lucide";

import type { Calendar, EventApi } from "fullcalendar";
import type { Nutrients } from "../food/foods.ts";


/**
 * My goals for the trackers, the size of a glass and the numbers of my learning, as the reader sends them.
 *
 * - `sleepHours`: Hours of sleep I want a night.
 * - `sleepBand`: Fewest and most hours of a healthy night.
 * - `glassMl`: Millilitres of one glass of water.
 * - `waterMl`: Millilitres of water I want a day.
 * - `bedtimeVaried`: Minutes my bedtime may vary over the week, up or down, for its check.
 * - `neckLongWeek`: Long neck sessions I want in seven days; a short one, or a long, on every study day.
 * - `sessionMinutes`: Minutes of one suggested study session.
 * - `studyMinutes`: Minutes of learning a day at most, lectures included.
 * - `focusMinutes`: Minutes of a session after which its timer suggests a short break.
 */
type TrackerSettings = {
    sleepHours: number;
    sleepBand: [number, number];
    glassMl: number;
    waterMl: number;
    bedtimeVaried: number;
    neckLongWeek: number;
    sessionMinutes: number;
    studyMinutes: number;
    focusMinutes: number;
};

/**
 * A night of sleep, as the reader sends it.
 *
 * - `minutes`: Minutes asleep.
 * - `asleep`: When I fell asleep, like `23:30`.
 * - `awake`: When I woke up, like `07:15`.
 */
type Night = {
    minutes: number;
    asleep: string;
    awake: string;
};

/**
 * My sleep on a day, as the reader sends it.
 *
 * - `night`: The night that ended on the day, `null` when none is logged.
 * - `minutes`: Average minutes of the nights of the week, `null` when none is logged.
 * - `varied`: How much my bedtime varied over the week, in minutes, `null` for fewer than two nights.
 * - `nights`: Number of nights of the week logged.
 */
type SleepDay = {
    night: Night | null;
    minutes: number | null;
    varied: number | null;
    nights: number;
};

/**
 * A glass of a drink, of water or of another drink, like `Kaffee`, as the reader sends it.
 *
 * - `id`: Identifier of its entry.
 * - `start`: When I drank it, as ISO instant.
 * - `water`: Whether it is a glass of water, which the counter may take back.
 * - `editable`: Whether its entry can be changed, so it can be taken back.
 */
type Glass = {
    id: string;
    start: string;
    water: boolean;
    editable: boolean;
};

/**
 * My neck routine in the seven days up to a day and my neck pain, as the reader sends them.
 *
 * - `short`: My study days on which I did a neck routine, short or long.
 * - `studyDays`: My study days, days with an entry `Skill` in the log.
 * - `long`: Days with a long neck session.
 * - `painFirst`: Mean of my pain in the first four weeks I rated it, `null` before the first rating.
 * - `painLast`: Mean of my pain in the last four weeks up to the day, `null` while those still are the first four.
 */
type NeckWeek = {
    short: number;
    studyDays: number;
    long: number;
    painFirst: number | null;
    painLast: number | null;
};

/**
 * The trackers of a day, as the reader sends them.
 *
 * - `settings`: My goals, the size of a glass and the numbers of my learning.
 * - `sleep`: My sleep, which the card leaves out for now.
 * - `glasses`: My glasses of water and of every other drink, in the order I drank them.
 * - `neck`: My neck routine in the seven days up to the day.
 * - `food`: What my meals gave, `estimate` when one of them counts a usual portion, and the number of my meals.
 */
export type Trackers = {
    settings: TrackerSettings;
    sleep: SleepDay;
    glasses: Glass[];
    neck: NeckWeek;
    food: Nutrients & { estimate: boolean; meals: number };
};

/**
 * Minutes a glass of water lasts in the log.
 */
const glassMinutes: number = 5;

/**
 * Whether the card shows the tiles of my neck, see {@link neckOf}: not until I start my neck routine,
 * then `true`.
 */
const neckShown: boolean = false;

/**
 * What the card was loaded for last: the day and the log entries of it, so it loads again only when they change.
 */
let seen: string = "";


/**
 * Makes the check of a goal met, small and grey, see the class `tracker-check` in `day.css`.
 *
 * @returns Icon of the check
 */
function checkOf(): SVGElement {
    const check: SVGElement = iconOf(Check);
    check.classList.add("tracker-check");
    return check;
}

/**
 * Makes a tile of a tracker, of the neck: its value over its name, a check after a value
 * in the healthy band or at its goal, a dash for a value not logged.
 *
 * @param value - Value, empty for none
 * @param met - Whether it lies in the healthy band or reaches its goal
 * @param name - What the value is, like `long · 7 days`
 * @returns Tile
 */
function tileOf(value: string, met: boolean, name: string): HTMLElement {
    const tile: HTMLElement = elementOf("div", "tile", "");
    const amount: HTMLElement = elementOf("span", "tile-value", value === "" ? "–" : value);
    if (value !== "" && met)
        amount.append(checkOf());
    tile.append(amount, elementOf("span", "tile-name", name));
    return tile;
}

/**
 * Logs one more glass of water, at now on the shown day, five minutes long, see `nowOn` in `times.ts`.
 * - `start`: Start of the glass.
 *
 * @param calendar - Calendar of the day
 * @throws {Error} - When the reader does not take the glass
 */
async function glassAdd(calendar: Calendar): Promise<void> {
    const start: Date = nowOn(calendar.view.currentStart);
    await entryAdd(calendar, {
        category: "Drink", title: "Water", location: "", from: "", module: "", type: "", semester: "", note: "",
        foods: [], planned: "", start: start, end: new Date(start.getTime() + glassMinutes * 60 * 1000),
    });
}

/**
 * Builds the water: `−`, which takes the last glass of water back, the glass with the glasses of the day,
 * every drink one glass, like `6`, and `+`, which logs one more glass of water; beside them, grey, what the glasses
 * make in litres, like `1.5 l` of six glasses of 250 ml; the words of the buttons only for screen readers,
 * no description under the pointer, no goal.
 * The row takes no clicks while a glass is sent, so a double tap logs one glass; the card loads again once the log changed.
 * - `count`: Number of glasses.
 * - `glasses`: The glass with their number.
 * - `litres`: What they make, in litres.
 * - `last`: The last glass of water that can be taken back, `undefined` for none.
 * - `coming`: Whether the day is still to come.
 * - `send`: Sends a change of the glasses, the row inert meanwhile.
 *
 * @param calendar - Calendar of the day
 * @param trackers - Trackers of the day
 * @param day - The shown day, like `2026-10-10`
 * @returns Row of the water
 */
function waterOf(calendar: Calendar, trackers: Trackers, day: string): HTMLElement {
    const row: HTMLElement = elementOf("div", "tracker-row", "");
    const less: HTMLButtonElement = document.createElement("button");
    const add: HTMLButtonElement = document.createElement("button");
    const count: number = trackers.glasses.length;
    const glasses: HTMLElement = elementOf("span", "water-count", "");
    const litres: number = count * trackers.settings.glassMl / 1000;
    const last: Glass | undefined = trackers.glasses.filter((glass: Glass): boolean => glass.water && glass.editable).at(-1);
    const coming: boolean = day > calendarTodayOf();
    const send: (change: () => Promise<void>) => void = (change: () => Promise<void>): void => {
        row.inert = true;
        change().catch((error: unknown): void => {
            console.error(error);
            row.inert = false;
        });
    };

    less.type = "button";
    less.className = "water-step";
    less.append(iconOf(Minus));
    less.setAttribute("aria-label", "One glass less");
    less.disabled = coming || last === undefined;
    less.addEventListener("click", (): void =>
        send((): Promise<void> => entryDelete(calendar, last?.id ?? "")));
    glasses.append(...iconWordsOf(GlassWater, String(count)));
    add.type = "button";
    add.className = "water-step";
    add.append(iconOf(Plus));
    add.setAttribute("aria-label", "One glass more");
    add.disabled = coming;
    add.addEventListener("click", (): void => send((): Promise<void> => glassAdd(calendar)));
    row.append(elementOf("span", "tracker-name", "Water"), less, glasses, add,
        elementOf("span", "water-litres", `${amountOf(litres, 2)} l`));
    return row;
}

/**
 * Builds the food: the kcal of the day's meals, rounded and so never marked as an estimate, and in brackets the number
 * of the meals, like `1,850 kcal (3 meals)` or `0 kcal (0 meals)`, linking to the day in the food view.
 * - `food`: What the meals gave.
 *
 * @param trackers - Trackers of the day
 * @param day - The shown day, like `2026-10-10`
 * @returns Row of the food
 */
function foodOf(trackers: Trackers, day: string): HTMLElement {
    const row: HTMLElement = elementOf("div", "tracker-row", "");
    const link: HTMLAnchorElement = document.createElement("a");
    const food: Nutrients & { estimate: boolean; meals: number } = trackers.food;
    link.className = "tracker-link";
    link.href = `/food?date=${day}`;
    link.textContent = `${amountOf(food.kcal, 0)} kcal (${food.meals} ${food.meals === 1 ? "meal" : "meals"})`;
    row.append(elementOf("span", "tracker-name", "Food"), link);
    return row;
}

/**
 * Builds the sleep: how long the night of the day lasted, the sleep I woke up from that morning, in hours
 * and minutes, each two digits, like `07h 30m`, or `08h 00m` on the hour; a dash while no night is logged.
 * - `night`: The night of the day, `null` for none.
 * - `length`: How long it lasted as shown, see `lengthOf` in `times.ts`.
 *
 * @param trackers - Trackers of the day
 * @returns Row of the sleep
 */
function sleepOf(trackers: Trackers): HTMLElement {
    const row: HTMLElement = elementOf("div", "tracker-row", "");
    const night: Night | null = trackers.sleep.night;
    const length: string = night === null ? "–" : lengthOf(night.minutes);
    row.append(elementOf("span", "tracker-name", "Sleep"), elementOf("span", "tracker-value", length));
    return row;
}

/**
 * Builds the neck: two tiles over the seven days up to the day, on how many of my study days I did a neck routine,
 * short or long, like `2 / 5`, a check from two thirds on, a dash while the week has no study day,
 * and on how many days a long one against my goal, like `1 / 3`, a check once reached;
 * then my neck pain, like `5.2 → 4.0`, or the first mean alone in the first four weeks, a dash before any rating.
 * - `neck`: My neck routine of the seven days.
 * - `goal`: Days with a long neck session I want in seven days.
 * - `pain`: My pain as the tile writes it.
 * - `tiles`: The tiles side by side.
 *
 * @param trackers - Trackers of the day
 * @returns Row of the neck
 */
function neckOf(trackers: Trackers): HTMLElement {
    const neck: NeckWeek = trackers.neck;
    const goal: number = trackers.settings.neckLongWeek;
    const pain: string = neck.painFirst === null ? ""
        : neck.painLast === null ? amountOf(neck.painFirst, 1) : `${amountOf(neck.painFirst, 1)} → ${amountOf(neck.painLast, 1)}`;
    const row: HTMLElement = elementOf("div", "tracker-row", "");
    const tiles: HTMLElement = elementOf("div", "tiles", "");
    tiles.append(
        tileOf(neck.studyDays === 0 ? "" : `${neck.short} / ${neck.studyDays}`, neck.short * 3 >= neck.studyDays * 2,
            "short · study days"),
        tileOf(`${neck.long} / ${goal}`, neck.long >= goal, "long · 7 days"),
        tileOf(pain, false, "pain"),
    );
    row.append(elementOf("span", "tracker-name", "Neck"), tiles);
    return row;
}

/**
 * Loads the trackers of a day from the reader.
 *
 * @param day - Day like `2026-10-10`
 * @returns The trackers of the day
 * @throws {Error} - When the reader cannot answer
 */
export async function trackersFetch(day: string): Promise<Trackers> {
    const response: Response = await fetch(`/api/day/trackers?date=${day}`);
    if (!response.ok)
        throw new Error(`Reader answered ${response.status}`);
    return await response.json() as Trackers;
}

/**
 * Loads the trackers of the shown day and shows them, unless another day is shown meanwhile;
 * the neck only once {@link neckShown}.
 * - `day`: The shown day.
 * - `trackers`: Its trackers.
 *
 * @param calendar - Calendar of the day
 * @throws {Error} - When the reader cannot answer
 */
async function trackersLoad(calendar: Calendar): Promise<void> {
    const day: string = dayOf(calendar.view.currentStart);
    const trackers: Trackers = await trackersFetch(day);
    if (day !== dayOf(calendar.view.currentStart))
        return;
    document.getElementById("trackers")?.replaceChildren(sleepOf(trackers), waterOf(calendar, trackers, day),
        foodOf(trackers, day), ...(neckShown ? [neckOf(trackers)] : []));
}

/**
 * Loads the trackers again when the shown day or its log entries changed, as the calendar tells after every change.
 * - `key`: The shown day with the start, end, what and foods of each of its log entries.
 *
 * @param calendar - Calendar of the day
 * @param events - All events of the shown day
 */
export function trackersSee(calendar: Calendar, events: EventApi[]): void {
    const key: string = JSON.stringify([dayOf(calendar.view.currentStart), ...events
        .filter((event: EventApi): boolean => event.source?.id === "log")
        .map((event: EventApi): unknown[] => [event.id, event.startStr, event.endStr, event.title, event.extendedProps.foods])]);
    if (key === seen)
        return;
    seen = key;
    trackersLoad(calendar).catch((error: unknown): void => {
        console.error(error);
        document.getElementById("trackers")?.replaceChildren(elementOf("p", "tracker-meta", "The trackers cannot be read"));
    });
}
