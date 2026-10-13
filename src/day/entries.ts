/**
 * ## Entries
 *
 * Sends new, changed and removed entries of the log to the reader, the meal of a cooking, and the boxes of the plan:
 * new, changed and removed ones, a box logged at its real time or taken back, pushed to the next day or dropped.
 * After a change of the log the log of the shown day loads again, so the page shows what the files hold,
 * and with it the boxes, which are done once a log entry points to them, see `boxes.ts`;
 * after a change of a box alone, its sender loads the boxes again itself.
 *
 * - `fullcalendar`: Calendar that shows the log.
 */

import type { Calendar } from "fullcalendar";


/**
 * Fields and times of an entry of the log to send; an empty field is not written.
 *
 * - `category`: Category picked, `CATEGORIES`.
 * - `title`: What picked, `SUMMARY`.
 * - `location`: Place picked, `LOCATION`.
 * - `from`: Where a way starts, `X-FROM`.
 * - `module`: Module of a skill entry, like `IN2028`, written by the reader only in its `SUMMARY`,
 *   like `IN2028_BusinessAnalyticsMachineLearning (VO)`.
 * - `type`: Type of a skill entry, like `VO`, written only in its `SUMMARY`.
 * - `semester`: Semester of a skill entry, `X-SEMESTER`, like `2026W`, empty for any other entry; the reader fills
 *   in the semester of its day for a skill entry sent without one.
 * - `note`: Free note, `DESCRIPTION`.
 * - `foods`: Foods of a meal, its lines `X-FOOD` like `Reis;150`, none for any other entry.
 * - `planned`: Identifier of the box a new log entry is logged from, written as `RELATED-TO`, empty for none;
 *   the reader writes it only for a new entry.
 * - `pain`: My neck pain from 0 to 10 after `Neck long`, `X-PAIN`, empty for none; left out, it stays as it is,
 *   like after a drag.
 * - `start`: Start of the entry.
 * - `end`: End of the entry, after the start.
 */
export type EntryFields = {
    category: string;
    title: string;
    location: string;
    from: string;
    module: string;
    type: string;
    semester: string;
    note: string;
    foods: string[];
    planned: string;
    pain?: string;
    start: Date;
    end: Date;
};

/**
 * Fields of a box of the plan to send; an empty field is not written.
 *
 * - `category`, `title`, `location`, `from`, `module`, `type`, `semester`, `note`: As those of {@link EntryFields}.
 * - `day`: Day of the box, like `2026-10-13`; for a box with a deadline the day of its deadline.
 * - `time`: Expected time on its day, `null` for none and for a box with a deadline.
 * - `minutes`: Expected duration in minutes, `null` for none.
 * - `deadline`: Deadline as the reader takes it: ISO instant, or its day like `2026-10-23` without time;
 *   empty for none.
 * - `chapters`, `documents`, `topics`: Chapters and documents of a skill box with their topics, see `SkillLinks`
 *   in `skill.ts`; none for any other box.
 */
export type BoxFields = {
    category: string;
    title: string;
    location: string;
    from: string;
    module: string;
    type: string;
    semester: string;
    note: string;
    day: string;
    time: Date | null;
    minutes: number | null;
    deadline: string;
    chapters: string[];
    documents: string[];
    topics: { [path: string]: string };
};


/**
 * Sends a request to the reader.
 *
 * @param method - HTTP method, like `POST`
 * @param address - Address of the request
 * @param body - Data to send, or `null`
 * @returns Answer of the reader, like the identifier of a new entry, `null` for none
 * @throws {Error} - When the reader does not take the request
 */
async function requestSend(method: string, address: string, body: object | null): Promise<unknown> {
    const response: Response = await fetch(address, {
        method: method,
        body: body === null ? null : JSON.stringify(body),
    });
    if (!response.ok)
        throw new Error(`Reader answered ${response.status}`);
    return await response.json();
}

/**
 * Sends a request that changes the log, then loads the log of the shown day again.
 * - {@link EventSourceApi#refetch}: Loads the entries of a calendar of the reader again.
 *
 * @param calendar - Calendar of the day
 * @param method - HTTP method, like `POST`
 * @param address - Address of the request
 * @param body - Data to send, or `null`
 * @returns Answer of the reader, like the identifier of a new entry, `null` for none
 * @throws {Error} - When the reader does not take the request
 */
async function logSend(calendar: Calendar, method: string, address: string, body: object | null): Promise<unknown> {
    const answer: unknown = await requestSend(method, address, body);
    calendar.getEventSourceById("log")?.refetch();
    return answer;
}

/**
 * Turns the fields of an entry into the form the reader takes, with ISO instants.
 *
 * @param fields - Fields and times
 * @returns Fields to send
 */
function bodyOf(fields: EntryFields): object {
    return { ...fields, start: fields.start.toISOString(), end: fields.end.toISOString() };
}

/**
 * Turns the fields of a box into the form the reader takes: its time as ISO instant, empty for none.
 *
 * @param fields - Fields of the box
 * @returns Fields to send
 */
function boxBodyOf(fields: BoxFields): object {
    return { ...fields, time: fields.time === null ? "" : fields.time.toISOString() };
}

/**
 * Adds an entry to the log.
 *
 * @param calendar - Calendar of the day
 * @param fields - Fields and times of the new entry
 * @returns Identifier of the new entry
 * @throws {Error} - When the reader does not take the entry
 */
export async function entryAdd(calendar: Calendar, fields: EntryFields): Promise<string> {
    return await logSend(calendar, "POST", "/api/day/log", bodyOf(fields)) as string;
}

/**
 * Adds the meal of a cooking to the log, eaten right after it: the reader writes it with the dish and place of the cooking,
 * as long as my meals usually last, with the foods the dish held the last time, pointing to the cooking.
 *
 * @param calendar - Calendar of the day
 * @param cook - Identifier of the entry `Cook`
 * @throws {Error} - When the reader does not take the meal, like for a cooking eaten already
 */
export async function mealAfterCookAdd(calendar: Calendar, cook: string): Promise<void> {
    await logSend(calendar, "POST", "/api/day/eaten", { cook: cook });
}

/**
 * Changes fields and times of an entry of the log.
 *
 * @param calendar - Calendar of the day
 * @param id - Identifier of the entry
 * @param fields - New fields and times
 * @throws {Error} - When the reader does not take the change
 */
export async function entryChange(calendar: Calendar, id: string, fields: EntryFields): Promise<void> {
    await logSend(calendar, "PATCH", "/api/day/log", { id: id, ...bodyOf(fields) });
}

/**
 * Removes an entry of the log; the reader opens the box it was logged from again.
 *
 * @param calendar - Calendar of the day
 * @param id - Identifier of the entry
 * @throws {Error} - When the reader does not remove the entry
 */
export async function entryDelete(calendar: Calendar, id: string): Promise<void> {
    await logSend(calendar, "DELETE", `/api/day/log?id=${encodeURIComponent(id)}`, null);
}

/**
 * Logs a box at its real time, dropped into the log or tapped: the reader writes a log entry like it, pointing to it,
 * then the log of the shown day loads again, and with it the boxes, so the box shows as done.
 *
 * @param calendar - Calendar of the day
 * @param box - Identifier of the box
 * @param start - Real start
 * @param end - Real end
 * @throws {Error} - When the reader does not log it, like for a box done already
 */
export async function boxLog(calendar: Calendar, box: string, start: Date, end: Date): Promise<void> {
    await logSend(calendar, "POST", "/api/day/logged",
        { box: box, start: start.toISOString(), end: end.toISOString() });
}

/**
 * Takes a done box back to open, with one click on its check: the reader removes the log entry written from it,
 * or, when that holds what I added since, like attempts or a note, only lets it go of the box, see `boxUndo`
 * in `reader/day.ts`; then the log of the shown day loads again, and with it the boxes.
 *
 * @param calendar - Calendar of the day
 * @param id - Identifier of the box
 * @throws {Error} - When the reader does not take it back, like for a box that is not done
 */
export async function boxUndo(calendar: Calendar, id: string): Promise<void> {
    await logSend(calendar, "POST", "/api/day/undone", { box: id });
}

/**
 * Adds a box to the plan.
 *
 * @param fields - Fields of the new box
 * @returns Identifier of the new box
 * @throws {Error} - When the reader does not take the box
 */
export async function boxAdd(fields: BoxFields): Promise<string> {
    return await requestSend("POST", "/api/day/boxes", boxBodyOf(fields)) as string;
}

/**
 * Changes a box of the plan.
 *
 * @param id - Identifier of the box
 * @param fields - New fields
 * @throws {Error} - When the reader does not take the change
 */
export async function boxChange(id: string, fields: BoxFields): Promise<void> {
    await requestSend("PATCH", "/api/day/boxes", { id: id, ...boxBodyOf(fields) });
}

/**
 * Removes a box of the plan, one planned by mistake.
 *
 * @param id - Identifier of the box
 * @throws {Error} - When the reader does not remove the box, like a done one
 */
export async function boxDelete(id: string): Promise<void> {
    await requestSend("DELETE", `/api/day/boxes?id=${encodeURIComponent(id)}`, null);
}

/**
 * Pushes an open box to the next day.
 *
 * @param id - Identifier of the box
 * @throws {Error} - When the reader does not push it
 */
export async function boxPush(id: string): Promise<void> {
    await requestSend("POST", "/api/day/pushed", { box: id });
}

/**
 * Drops a box, or takes a dropped box back.
 *
 * @param id - Identifier of the box
 * @param dropped - Whether to drop it, else to take it back
 * @throws {Error} - When the reader does not take it
 */
export async function boxDrop(id: string, dropped: boolean): Promise<void> {
    await requestSend("POST", "/api/day/dropped", { box: id, dropped: dropped });
}
