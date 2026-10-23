/**
 * ## Dialog
 *
 * The day view's own dialog of an entry, the one I log every entry with in the calendar, see `../day/categories.ts`,
 * in the scripts view: for the session the learning view asks for before it records, see `./session.ts`, and for
 * a box of the plan tapped on the page of a module, which it opens as the day view does, see `./course.ts`; with it
 * the day view's dialog of a series, which the page of a module opens, see `../day/series.ts`.
 * The dialog, its HTML from `../day/day.html`, its code and its look come into the page only the first time it opens,
 * so the scripts load no calendar before.
 *
 * - `../day/day.html?raw`: Html of the day as text, of which the dialogs `#entry` and `#series`.
 * - `../day/categories.ts`: Starts the dialog and opens it.
 * - `../day/times.ts`: Starts the fields of the times of the dialog, as the day view starts them.
 * - `fullcalendar`, `fullcalendar/timegrid`: A calendar of a day, never drawn, which the dialog's writes ask for,
 *   to load its log again.
 * - `../day/day.css`, `../day/choices.css`, `../day/meal.css`: Look of the dialog and of its fields.
 */

import { timesStart } from "../day/times.ts";

import type * as Categories from "../day/categories.ts";
import type * as FullCalendar from "fullcalendar";
import type * as TimeGrid from "fullcalendar/timegrid";


/**
 * The dialog of an entry in the page, once started, see {@link dialogOf}.
 *
 * - `categories`: The code of the dialog, which opens it for an entry or a box.
 * - `calendar`: A calendar of a day, never drawn and without entries, which the dialog writes with, like a box
 *   logged, since the scripts view shows no log.
 */
export type Dialog = {
    categories: typeof Categories;
    calendar: FullCalendar.Calendar;
};

/**
 * The dialog once in the page and started, `null` before it opened first.
 */
let dialogReady: Promise<Dialog> | null = null;


/**
 * Puts the dialog of an entry of the day into the page and starts it, see `categoriesStart` in `../day/categories.ts`,
 * with a calendar of a day as the day view has, but never drawn and without entries, since the scripts view shows
 * no log; its look loaded in the order the day loads it, so `choices.css` wins over `day.css` as there, like a row
 * that keeps only a list taking no room; its times and days checked and written as the day view does,
 * see `timesStart` in `../day/times.ts`, like `14:15` of `1415`.
 * - `html`, `categories`, `full`, `timeGrid`: The HTML of the day, with the dialogs `#entry` and `#series`, the code
 *   of the dialog, that of the calendar and of its view of a day.
 * - `day`: The HTML of the day as a document, whose dialogs go into the page.
 * - `calendar`: The calendar, never drawn.
 *
 * @returns The dialog
 */
async function dialogStart(): Promise<Dialog> {
    await import("../day/day.css");
    await import("../day/choices.css");
    await import("../day/meal.css");
    const html: string = (await import("../day/day.html?raw")).default;
    const categories: typeof Categories = await import("../day/categories.ts");
    const full: typeof FullCalendar = await import("fullcalendar");
    const timeGrid: typeof TimeGrid = await import("fullcalendar/timegrid");
    const calendar: FullCalendar.Calendar = new full.Calendar(document.createElement("div"),
        { plugins: [timeGrid.default], initialView: "timeGridDay" });
    const day: Document = new DOMParser().parseFromString(html, "text/html");
    document.body.append(day.getElementById("entry") as HTMLElement, day.getElementById("series") as HTMLElement);
    categories.categoriesStart(calendar);
    timesStart();
    return { categories: categories, calendar: calendar };
}

/**
 * Gives the dialog of an entry, put into the page and started the first time, see {@link dialogStart}.
 *
 * @returns The dialog
 */
export function dialogOf(): Promise<Dialog> {
    dialogReady ??= dialogStart();
    return dialogReady;
}
