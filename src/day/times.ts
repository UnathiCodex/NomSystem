/**
 * ## Times
 *
 * Turns dates into the values of time fields and back, for the panels of the day, and gives the times a box
 * is logged at with one tap.
 * A time field is one text field, typed in 24-hour form whatever the browser's language:
 * `14` is 14:00, `1415` and `14:15` are 14:15, `915` and `9:15` are 09:15.
 * When the field loses focus, its time shows as `HH:MM`; any other text marks the field invalid,
 * so the browser does not send the form and says what it takes instead. An empty field is left to its `required`:
 * start and end of a log entry need a time, the expected time of a box may stay empty.
 * A date field, like the day of a deadline, takes a date in my standard way with its year, `23.10.2026`,
 * and marks itself invalid the same way.
 *
 * - `../skill/attempts.ts`: Writes a date as a day, gives today as I live it and the hour my day starts.
 * - `./boxes.ts`: The type of a box, for the type checker only.
 */

import { dayOf, dayStartHour, todayOf } from "../skill/attempts.ts";

import type { Box } from "./boxes.ts";


/**
 * Minutes a box without expected duration lasts when it goes into the log, like the last half hour `+` of the log opens.
 */
export const boxMinutes: number = 30;


/**
 * Writes the time of a date as `HH:MM`, the value of a time field.
 *
 * @param date - Date with the time
 * @returns Time like `09:15`
 */
export function timeOf(date: Date): string {
    return date.toTimeString().slice(0, 5);
}

/**
 * Puts a time of a time field on the day of a date.
 *
 * @param day - Date on the day
 * @param time - Time like `09:15`
 * @returns Date of the day at the time
 */
export function dateOf(day: Date, time: string): Date {
    const [hours, minutes]: number[] = time.split(":").map(Number);
    const date: Date = new Date(day);
    date.setHours(hours, minutes, 0, 0);
    return date;
}

/**
 * Gives now on a shown day, to the minute: now itself while the day is today as I live it, since after midnight
 * now lies on the next calendar day, like 01:10 of 13 October on 12 October; on any other day the time of now
 * on that day as I live it, a time before 05:00 in the night after it, like a glass of water added to a past day.
 * - `now`: Now, without its seconds.
 * - `then`: The time of now on the shown day.
 *
 * @param day - The shown day, like the start of the calendar's day
 * @returns The instant
 */
export function nowOn(day: Date): Date {
    const now: Date = new Date();
    now.setSeconds(0, 0);
    if (dayOf(day) === todayOf())
        return now;
    const then: Date = dateOf(day, timeOf(now));
    if (then.getHours() < dayStartHour)
        then.setDate(then.getDate() + 1);
    return then;
}

/**
 * Reads a typed time: the hours, then, with or without `:`, two digits of minutes if there are any.
 * - `match`: Hours and minutes of the text, the minutes `undefined` when only hours are typed.
 *
 * @param text - Typed text, like `915`
 * @returns Time like `09:15`, or `null` when the text is no time of the day
 */
function timeParse(text: string): string | null {
    const match: RegExpMatchArray | null = text.trim().match(/^(\d{1,2})(?::?(\d{2}))?$/);
    if (match === null || Number(match[1]) > 23 || Number(match[2] ?? 0) > 59)
        return null;
    return `${match[1].padStart(2, "0")}:${match[2] ?? "00"}`;
}

/**
 * Shows the time of a date in a time field and marks the field valid.
 *
 * @param field - Time field, like `<input id="entry-start">`
 * @param date - Date with the time, `null` for an empty field, like a box without expected time
 */
export function timeFieldShow(field: HTMLInputElement, date: Date | null): void {
    field.value = date === null ? "" : timeOf(date);
    field.setCustomValidity("");
}

/**
 * Reads the time of a time field.
 *
 * @param field - Time field
 * @returns Time like `09:15`, empty when the text is no time
 */
export function timeFieldRead(field: HTMLInputElement): string {
    return timeParse(field.value) ?? "";
}

/**
 * Writes a day in my standard way, like `23.10.2026`, the value of a date field.
 *
 * @param day - Day like `2026-10-23`
 * @returns Date like `23.10.2026`
 */
export function dateTextOf(day: string): string {
    return day.split("-").reverse().join(".");
}

/**
 * Reads a typed date in my standard way: day, month and year with dots between, like `23.10.2026` or `1.2.2027`.
 * - `match`: Day, month and year of the text.
 * - `day`: The day, like `2026-10-23`.
 * - `date`: The day at noon, which is no date or another day for a day the month lacks, like `31.02.2027`.
 *
 * @param text - Typed text
 * @returns Day like `2026-10-23`, or `null` when the text is no date
 */
export function dateParse(text: string): string | null {
    const match: RegExpMatchArray | null = text.trim().match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
    if (match === null)
        return null;
    const day: string = `${match[3]}-${match[2].padStart(2, "0")}-${match[1].padStart(2, "0")}`;
    const date: Date = new Date(`${day}T12:00:00`);
    return date.getDate() === Number(match[1]) && date.getMonth() + 1 === Number(match[2]) ? day : null;
}

/**
 * Gives the times a box is logged at as expected, with one tap: from its expected time for its expected duration,
 * else ending now on the shown day; for {@link boxMinutes} when it has no duration.
 * - `length`: Its length in milliseconds.
 * - `start`: Its expected time.
 * - `end`: Now on the shown day, to the minute.
 *
 * @param box - The box
 * @param day - A date on the shown day
 * @returns Start and end
 */
export function boxTimesOf(box: Box, day: Date): [Date, Date] {
    const length: number = (box.minutes ?? boxMinutes) * 60 * 1000;
    if (box.time !== "") {
        const start: Date = new Date(box.time);
        return [start, new Date(start.getTime() + length)];
    }
    const end: Date = dateOf(day, timeOf(new Date()));
    return [new Date(end.getTime() - length), end];
}

/**
 * Starts the time and date fields after the router has put its HTML into the page:
 * each marks itself invalid while its text is neither empty nor a time, or a date, and writes its time as `HH:MM`,
 * or its date as `DD.MM.YYYY`, when it loses focus.
 * - {@link HTMLInputElement#setCustomValidity}: Marks a field invalid with a message, or valid with an empty one;
 *   the browser shows the message instead of sending the form.
 * - `change`: Comes when a changed field loses focus.
 * - `day`: Typed date as day, `null` when it is no date.
 */
export function timesStart(): void {
    document.querySelectorAll<HTMLInputElement>(".time-field").forEach((field: HTMLInputElement): void => {
        field.addEventListener("input", (): void =>
            field.setCustomValidity(field.value.trim() !== "" && timeParse(field.value) === null
                ? "Time like 14:00, 1415 or 14" : ""));
        field.addEventListener("change", (): void => {
            field.value = timeParse(field.value) ?? field.value;
        });
    });
    document.querySelectorAll<HTMLInputElement>(".date-field").forEach((field: HTMLInputElement): void => {
        field.addEventListener("input", (): void =>
            field.setCustomValidity(field.value.trim() !== "" && dateParse(field.value) === null
                ? "Date like 23.10.2026" : ""));
        field.addEventListener("change", (): void => {
            const day: string | null = dateParse(field.value);
            field.value = day === null ? field.value : dateTextOf(day);
        });
    });
}
