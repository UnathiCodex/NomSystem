/**
 * ## Session
 *
 * No learning recorded without a session: before the learning view records something, where I stand with `Next`,
 * a result or the round check, a session of the module runs, its skill entry of the moment, into which the record
 * goes, see `reader/skill.ts`; reading a section needs none. While none runs, the day view's own dialog of a new entry
 * opens over the page, the one I log every entry with in the calendar, see `../day/categories.ts`: `Skill` and the
 * module picked, from now, to the minute, as long as my usual session, see `sessionMinutes` in `reader/trackers.ts`;
 * I fill and save it there as always, and the record follows into it. Cancelled, or saved as no session running now,
 * nothing is recorded and I stay where I was. A session of the module running now, now between its start and its end,
 * as the timer of the day shows it, see `../timer.ts`, counts without the dialog.
 * The dialog, its HTML from `../day/day.html`, its code and its look come into the page only the first time it opens,
 * so the scripts load no calendar before.
 *
 * - `../day/day.html?raw`: Html of the day as text, of which the dialog `#entry`.
 * - `../day/categories.ts`: Starts the dialog and opens it for a new skill entry of the module.
 * - `../day/trackers.ts`: Loads my settings, with the minutes of my usual session.
 * - `../day/times.ts`: Gives now to the minute, as the day view writes its entries.
 * - `../skill/attempts.ts`: Writes today's day in the form of the reader.
 * - `fullcalendar`, `fullcalendar/timegrid`: A calendar of a day, never drawn, which the dialog's writes ask for,
 *   to load its log again.
 * - `../day/day.css`, `../day/choices.css`, `../day/meal.css`: Look of the dialog and of its fields.
 */

import { nowOn } from "../day/times.ts";
import { dayOf } from "../skill/attempts.ts";

import type * as Categories from "../day/categories.ts";
import type * as Trackers from "../day/trackers.ts";
import type * as FullCalendar from "fullcalendar";
import type * as TimeGrid from "fullcalendar/timegrid";
import type { Session } from "../timer.ts";


/**
 * The code of the dialog of a new entry, once the dialog is in the page and started, `null` before it opened first.
 */
let dialogReady: Promise<typeof Categories> | null = null;


/**
 * Loads from the reader whether a session of a module runs now: its skill entry of the moment, see `sessionRead`
 * in `reader/skill.ts`, while its end lies after now.
 *
 * @param module - Code of the module, like `IN2028`
 * @returns Whether it runs
 * @throws {Error} - When the reader cannot answer
 */
async function runningIs(module: string): Promise<boolean> {
    const response: Response = await fetch(`/api/skill/session?module=${encodeURIComponent(module)}`);
    if (!response.ok)
        throw new Error(`Reader answered ${response.status}`);
    const session: Session | null = await response.json() as Session | null;
    return session !== null && Date.parse(session.end) > Date.now();
}

/**
 * Puts the dialog of a new entry of the day into the page and starts it, see `categoriesStart` in
 * `../day/categories.ts`, with a calendar of a day as the day view has, but never drawn and without entries, since
 * the learning view shows no log.
 * - `looks`: The look of the dialog, loading meanwhile.
 * - `html`, `categories`, `full`, `timeGrid`: The HTML of the day, with the dialog `#entry`, the code of the dialog,
 *   that of the calendar and of its view of a day.
 *
 * @returns The code of the dialog
 */
async function dialogStart(): Promise<typeof Categories> {
    const looks: Promise<unknown[]> = Promise.all([
        import("../day/day.css"), import("../day/choices.css"), import("../day/meal.css"),
    ]);
    const html: string = (await import("../day/day.html?raw")).default;
    const categories: typeof Categories = await import("../day/categories.ts");
    const full: typeof FullCalendar = await import("fullcalendar");
    const timeGrid: typeof TimeGrid = await import("fullcalendar/timegrid");
    await looks;
    document.body.append(new DOMParser().parseFromString(html, "text/html").getElementById("entry") as HTMLElement);
    categories.categoriesStart(new full.Calendar(document.createElement("div"),
        { plugins: [timeGrid.default], initialView: "timeGridDay" }));
    return categories;
}

/**
 * Makes sure a session of a module runs before the learning view records something, see the top of this file:
 * without one running now opens the dialog of a new entry for it and waits until it closes, saved or not.
 * - `categories`, `trackers`: The code of the dialog and of my settings.
 * - `minutes`: Minutes of my usual session.
 * - `start`: Now, to the minute.
 * - `closed`: Comes once the dialog closes.
 *
 * @param module - Code of the module, like `IN2028`
 * @returns Whether a session of the module runs now, so the record may follow
 * @throws {Error} - When the reader cannot answer
 */
export async function sessionEnsure(module: string): Promise<boolean> {
    if (await runningIs(module))
        return true;
    dialogReady ??= dialogStart();
    const categories: typeof Categories = await dialogReady;
    const trackers: typeof Trackers = await import("../day/trackers.ts");
    const minutes: number = (await trackers.trackersFetch(dayOf(new Date()))).settings.sessionMinutes;
    const start: Date = nowOn(new Date());
    const closed: Promise<void> = new Promise<void>((resolve: () => void): void =>
        document.getElementById("entry")?.addEventListener("close", (): void => resolve(), { once: true }));
    await categories.entryOpenSkill(module, start, new Date(start.getTime() + minutes * 60 * 1000));
    await closed;
    return await runningIs(module);
}
