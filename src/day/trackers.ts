/**
 * ## Trackers
 *
 * The card of the trackers of the shown day above the daily note, as the reader counts them, see `reader/trackers.ts`:
 * - Sleep: my goal with its healthy band under its name; first how much my bedtime varied over the week,
 *   a check within 30 minutes up or down, since regularity is the lever; then how long I slept the night
 *   that ended on the day, and on average over the week, a check in the healthy band.
 * - Food: the number of the day's meals under its name, like `3 meals`, so a meal missing shows, then their kcal
 *   and protein, totals without goals, rounded and so never marked as estimates, linking to the day in the food view.
 * - Neck: two tiles like those of the sleep, over the seven days up to the day: on how many of my study days I did
 *   a neck routine, short or long, like `2 / 5` over `short · study days`, a check from two thirds of them on,
 *   since about two thirds of the sessions already gave the large effects (Chen 2018), and on how many days a long
 *   one against my goal, like `1 / 3` over `long · 7 days`, a check once it is reached; a session is an entry `Body`
 *   of my neck routine, written by the entry by category, and a study day a day with an entry `Skill`;
 *   then my neck pain, rated 0 to 10 with each long session, the mean of my first four weeks against the last four,
 *   like `5.2 → 4.0` over `pain`, the outcome the routine is judged by.
 *   Hidden until I start my neck routine, see {@link neckShown}; its code stays.
 * My water I count in the food view, see `../food/water.ts`, which loads the trackers too, for the glasses of its day;
 * the time grid shows glasses only as small marks, see `day.ts`. The card loads again whenever the log of the day changes.
 *
 * - `../food/foods.ts`: Writes amounts and makes elements.
 * - `../skill/attempts.ts`: Writes a date as a day in the form of the reader.
 * - `../icons.ts`: Makes the icon of the check.
 * - `lucide`: The icon of the check.
 * - `fullcalendar`: Calendar that shows the day.
 */

import { amountOf, elementOf } from "../food/foods.ts";
import { dayOf } from "../skill/attempts.ts";
import { iconOf } from "../icons.ts";
import { Check } from "lucide";

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
 * A glass of a drink, of water or of another drink, like `Kaffee`, as the reader sends it, for the water of the food view.
 *
 * - `id`: Identifier of its entry.
 * - `start`: When I drank it, as ISO instant.
 * - `water`: Whether it is a glass of water, which the counter may take back.
 * - `editable`: Whether its entry can be changed, so it can be taken back.
 */
export type Glass = {
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
 * - `sleep`: My sleep.
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
 * Whether the card shows the tiles of my neck, see {@link neckOf}: not until I start my neck routine,
 * then `true`.
 */
const neckShown: boolean = false;

/**
 * What the card was loaded for last: the day and the log entries of it, so it loads again only when they change.
 */
let seen: string = "";


/**
 * Writes minutes as hours and minutes, like a duration on a clock.
 *
 * @param minutes - Minutes, like 435
 * @returns Text like `7:15 h`
 */
function hoursOf(minutes: number): string {
    return `${Math.floor(minutes / 60)}:${String(minutes % 60).padStart(2, "0")} h`;
}

/**
 * Writes minutes as a span in words.
 *
 * @param minutes - Minutes, like 100
 * @returns Text like `1 h 40 min`, `25 min` or `2 h`
 */
function spanOf(minutes: number): string {
    const hours: number = Math.floor(minutes / 60);
    return [hours > 0 ? `${hours} h` : "", minutes % 60 > 0 || hours === 0 ? `${minutes % 60} min` : ""]
        .filter((part: string): boolean => part !== "").join(" ");
}

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
 * Makes a tile of a tracker, of the sleep or the neck: its value over its name, a check after a value
 * in the healthy band or at its goal, a dash for a value not logged.
 *
 * @param value - Value, empty for none
 * @param met - Whether it lies in the healthy band or reaches its goal
 * @param name - What the value is, like `last night`
 * @param tooltip - More about the value, like when I fell asleep and woke up
 * @returns Tile
 */
function tileOf(value: string, met: boolean, name: string, tooltip: string): HTMLElement {
    const tile: HTMLElement = elementOf("div", "tile", "");
    const amount: HTMLElement = elementOf("span", "tile-value", value === "" ? "–" : value);
    if (value !== "" && met)
        amount.append(checkOf());
    tile.title = tooltip;
    tile.append(amount, elementOf("span", "tile-name", name));
    return tile;
}

/**
 * Builds the sleep: under its name my goal with its healthy band, like `8 h · 7–9`; then tiles of how much my bedtime
 * varied over the week, a check within my limit, and of how long I slept last night and on average over the week,
 * a check in the healthy band.
 * - `sleep`: My sleep on the day.
 * - `low`, `high`: Fewest and most hours of a healthy night.
 * - `healthy`: Whether minutes of sleep lie in the healthy band.
 * - `name`: Name of the tracker with the goal under it.
 * - `tiles`: The tiles side by side.
 *
 * @param trackers - Trackers of the day
 * @returns Row of the sleep
 */
function sleepOf(trackers: Trackers): HTMLElement {
    const sleep: SleepDay = trackers.sleep;
    const [low, high]: [number, number] = trackers.settings.sleepBand;
    const healthy: (minutes: number | null) => boolean = (minutes: number | null): boolean =>
        minutes !== null && minutes >= low * 60 && minutes <= high * 60;
    const row: HTMLElement = elementOf("div", "tracker-row", "");
    const name: HTMLElement = elementOf("span", "tracker-name", "Sleep");
    const tiles: HTMLElement = elementOf("div", "tiles", "");
    name.append(elementOf("span", "", `${trackers.settings.sleepHours} h · ${low}–${high}`));
    name.title = `Goal ${trackers.settings.sleepHours} hours a night; a healthy night lasts ${low} to ${high} hours`;
    tiles.append(
        tileOf(sleep.varied === null ? "" : `±${spanOf(sleep.varied)}`, (sleep.varied ?? 0) <= trackers.settings.bedtimeVaried,
            "bedtime varied", `How much my bedtime varied over the nights of the 7 days, a check within `
                + `${trackers.settings.bedtimeVaried} minutes; regular sleep goes with better grades`),
        tileOf(sleep.night === null ? "" : hoursOf(sleep.night.minutes), healthy(sleep.night?.minutes ?? null), "last night",
            sleep.night === null ? "No night logged; a sleep Day, or one under 3 hours, is a nap"
                : `Asleep ${sleep.night.asleep}, awake ${sleep.night.awake}`),
        tileOf(sleep.minutes === null ? "" : hoursOf(sleep.minutes), healthy(sleep.minutes), "Ø 7 days",
            `${sleep.nights} ${sleep.nights === 1 ? "night" : "nights"} logged in the 7 days up to this day`),
    );
    row.append(name, tiles);
    return row;
}

/**
 * Builds the food: under its name the number of the day's meals, like `3 meals`, as the sleep has its goal there;
 * beside it their kcal and protein, like `1,850 kcal · 95 g protein`, linking to the day in the food view.
 * - `food`: What the meals gave.
 * - `name`: Name of the tracker with the number of meals under it.
 *
 * @param trackers - Trackers of the day
 * @param day - The shown day, like `2026-10-10`
 * @returns Row of the food
 */
function foodOf(trackers: Trackers, day: string): HTMLElement {
    const row: HTMLElement = elementOf("div", "tracker-row", "");
    const link: HTMLAnchorElement = document.createElement("a");
    const food: Nutrients & { estimate: boolean; meals: number } = trackers.food;
    const name: HTMLElement = elementOf("span", "tracker-name", "Food");
    link.className = "tracker-link";
    link.href = `/food?date=${day}`;
    link.textContent = food.meals === 0
        ? "No meals logged"
        : `${amountOf(food.kcal, 0)} kcal · ${amountOf(food.protein, 0)} g protein`;
    if (food.meals > 0)
        name.append(elementOf("span", "", `${food.meals} ${food.meals === 1 ? "meal" : "meals"}`));
    row.append(name, link);
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
            "short · study days", "Study days of the 7 up to this day, days with a Skill entry, on which I did "
                + "a neck routine, short or long; a check from two thirds of them on"),
        tileOf(`${neck.long} / ${goal}`, neck.long >= goal, "long · 7 days",
            `Days with Neck long in the 7 up to this day, against ${goal}`),
        tileOf(pain, false, "pain", "My neck pain from 0 to 10, rated with each Neck long: "
            + "the mean of my first 4 weeks against the last 4; judge the routine after 10 to 12 weeks"),
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
    document.getElementById("trackers")?.replaceChildren(sleepOf(trackers), foodOf(trackers, day),
        ...(neckShown ? [neckOf(trackers)] : []));
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
