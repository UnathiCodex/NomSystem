/**
 * ## Week
 *
 * Shows the boxes of seven days, from today on, to see what is coming, like a doctor's visit,
 * while the day stays the start page: one row per day, its name at the left, then its birthdays and holidays
 * with my gift ideas and its boxes as the day shows them, see `boxes.ts`, side by side in columns of the same width,
 * so they are read whole:
 * those with a time first, with their time, like my lectures, then those without, a done one with its check;
 * the dropped ones stay out, and so does the log. A box with a deadline stands only on the day of its deadline,
 * where it is really due, done or not, not on each of the days before, as in the day,
 * and without how near it is, like `today`, since its row names the day.
 * Nothing moves here: a click on a day, anywhere in its row, opens it in the day view.
 * The arrows move by seven days, `Today` comes back, and a click on the days above opens a month,
 * whose clicked day becomes the first day shown, see `month.ts`; the address keeps the first day shown,
 * like `/week?date=2026-10-12`, so a reload stays on it. Today is today's calendar date, which turns at 00:00,
 * and a week from today moves on with it, see `today.ts`.
 *
 * - `../day/boxes.ts`: Loads the boxes of days, shows a box and the birthdays and holidays as the day does,
 *   and writes a day with its weekday.
 * - `../day/month.ts`: Picks the first day to show from a month.
 * - `../day/times.ts`: Writes a day in my standard way, like `12.10.2026`.
 * - `../skill/attempts.ts`: Writes a date as a day in the form of the reader.
 * - `../today.ts`: Gives today's calendar date and moves a week from today on to the new day.
 * - `../icons.ts`: Puts the icons into the arrows, and the check into a done box.
 * - `lucide`: The icons of the arrows and the check.
 * - `../day/day.css`: Look of the day, whose boxes the week shares.
 */

import { boxContentOf, boxesFetch, entryPartOf, occasionsOf, weekdayTextOf } from "../day/boxes.ts";
import { monthStart } from "../day/month.ts";
import { dateTextOf } from "../day/times.ts";
import { dayOf } from "../skill/attempts.ts";
import { calendarTodayOf, todayFollow } from "../today.ts";
import { iconOf, iconPut } from "../icons.ts";
import { Check, ChevronLeft, ChevronRight } from "lucide";
import "../day/day.css";

import type { Box, PlanDay } from "../day/boxes.ts";


/**
 * Days the week shows, from its first day on.
 */
const weekDays: number = 7;

/**
 * First day shown, like `2026-10-12`.
 */
let first: string = "";


/**
 * Adds days to a day, in local time.
 * - `date`: Noon of the day, so a change of the clocks never moves it to another day.
 *
 * @param day - Day like `2026-10-12`
 * @param days - Number of days to add
 * @returns Day like `2026-10-19`
 */
function daysLater(day: string, days: number): string {
    const date: Date = new Date(`${day}T12:00:00`);
    date.setDate(date.getDate() + days);
    return dayOf(date);
}

/**
 * Tells whether a box shows on a day of the week: never when dropped, a box with a deadline only on the day
 * of its deadline, its day, which the reader sends it for always, see `reader/boxes.ts`, any other box on its day.
 *
 * @param box - The box, as the reader sends it for the day
 * @param day - The day, like `2026-10-20`
 * @returns Whether it shows on the day
 */
function weekShows(box: Box, day: string): boolean {
    return box.state !== "dropped" && (box.deadline === "" || box.day === day);
}

/**
 * Makes a box of the week: as in the list of the day, its lines and, when it is done, its check at the left,
 * but without buttons and without how near its deadline is, see `boxes.ts`.
 *
 * @param box - The box
 * @param day - Day it shows on, like `2026-10-20`
 * @returns The box
 */
function boxOf(box: Box, day: string): HTMLElement {
    return entryPartOf("div", `box box-${box.state}`, [
        entryPartOf("span", "box-ring", box.state === "done" ? [iconOf(Check)] : []),
        entryPartOf("div", "box-body", boxContentOf(box, day, false)),
    ]);
}

/**
 * Makes the row of a day: a link that opens it in the day view, holding its name at the left, like `Tue, 13.10.2026`,
 * marked when it is today, and beside it its birthdays and holidays and its boxes that show on it,
 * see {@link weekShows}, or a calm hint when it has none.
 * - `row`: The link.
 * - `boxes`: Its boxes as elements.
 * - `items`: Birthdays, holidays and boxes, or the hint.
 *
 * @param plan - The plan of the day
 * @returns The row
 */
function dayRowOf(plan: PlanDay): HTMLElement {
    const row: HTMLAnchorElement = document.createElement("a");
    const boxes: HTMLElement[] = plan.boxes
        .filter((box: Box): boolean => weekShows(box, plan.day))
        .map((box: Box): HTMLElement => boxOf(box, plan.day));
    const items: HTMLElement[] = boxes.length > 0 || plan.occasions.length > 0
        ? [...occasionsOf(plan.occasions, null), ...boxes] : [entryPartOf("p", "plan-none", ["Nothing planned"])];
    row.className = "week-day";
    row.href = `/?date=${plan.day}`;
    if (plan.day === calendarTodayOf())
        row.setAttribute("aria-current", "date");
    row.append(
        entryPartOf("div", "week-day-name", [weekdayTextOf(plan.day)]),
        entryPartOf("div", "week-boxes", items),
    );
    return row;
}

/**
 * Shows the seven days from a first day on: their range as title, like `12.10.2026 – 18.10.2026`, and one row per day,
 * see {@link dayRowOf}; writes the first day into the address.
 * - `last`: The last day shown.
 * - `plans`: The plans of the seven days.
 * - {@link History#replaceState}: Changes the address without loading the page again.
 *
 * @param day - First day, like `2026-10-12`
 * @throws {Error} - When the reader cannot answer
 */
async function weekShow(day: string): Promise<void> {
    first = day;
    history.replaceState(null, "", `?date=${day}`);
    const last: string = daysLater(day, weekDays - 1);
    (document.getElementById("week-title") as HTMLElement).textContent =
        `${dateTextOf(day)} – ${dateTextOf(last)}`;
    const plans: PlanDay[] = await boxesFetch(day, daysLater(day, weekDays));
    if (day === first)
        document.getElementById("week-days")?.replaceChildren(...plans.map(dayRowOf));
}

/**
 * Starts the week after the router has put its HTML into the page, on the day of the address or today's calendar date:
 * the arrows move by seven days, `Today` comes back, the days above open the month to pick the first day from;
 * a week from today moves on to the new day by itself, see `todayFollow` in `today.ts`.
 * - `show`: Shows the seven days from a first day on.
 * - `shown`: Gives the seven days shown, the first first.
 */
export function weekStart(): void {
    const show: (day: string) => void = (day: string): void => {
        weekShow(day).catch((error: unknown): void => console.error(error));
    };
    const shown: () => string[] = (): string[] =>
        Array.from({ length: weekDays }, (_: unknown, index: number): string => daysLater(first, index));
    iconPut(document.getElementById("week-back") as HTMLElement, ChevronLeft, "Seven days back");
    iconPut(document.getElementById("week-next") as HTMLElement, ChevronRight, "Seven days on");
    document.getElementById("week-back")?.addEventListener("click", (): void => show(daysLater(first, -weekDays)));
    document.getElementById("week-today")?.addEventListener("click", (): void => show(calendarTodayOf()));
    document.getElementById("week-next")?.addEventListener("click", (): void => show(daysLater(first, weekDays)));
    monthStart(document.getElementById("week-title") as HTMLElement, shown, show);
    show(new URLSearchParams(location.search).get("date") ?? calendarTodayOf());
    todayFollow((): string => first, show);
}
