/**
 * ## Suggestions
 *
 * The study sessions the reader suggests for tomorrow's plan, see `reader/suggestions.ts`, computed and never written
 * until I accept one: dashed boxes below the boxes of tomorrow, each with its module and its expected duration,
 * and a check and a cross at its right, see `boxes.ts`. The check accepts it, writing a box like `IN2028 DEV`
 * with its duration and without time, which I drag into the log when I study; the cross dismisses it
 * for as long as the page stays open; a click on it opens the entry by category of a new box filled in as suggested,
 * to change it before saving, which accepts it too.
 * Every change of the plan suggests anew, since the plan sets the minutes left.
 * Only tomorrow gets suggestions, the day I plan in the evening before.
 *
 * - `./entries.ts`: Sends the accepted session to the reader.
 * - `./categories.ts`: Opens the entry by category of a new box from a suggestion.
 * - `../skill/attempts.ts`: Names the category of skill entries and writes a date as a day.
 * - `../today.ts`: Gives today's calendar date.
 */

import { boxAdd } from "./entries.ts";
import { boxOpenSuggestion } from "./categories.ts";
import { dayOf, skillName } from "../skill/attempts.ts";
import { calendarTodayOf } from "../today.ts";


/**
 * A suggested study session, as the reader sends it.
 *
 * - `module`: Code of its module, like `IN2028`.
 * - `title`: What it is, like `IN2028 DEV`.
 * - `minutes`: How long it is expected to last.
 */
type SuggestionSent = {
    module: string;
    title: string;
    minutes: number;
};

/**
 * A suggested study session as the list shows it: a {@link SuggestionSent} with its key `key`
 * while the page stays open, set as it loads: its day, its module and its count among the suggestions of its module,
 * like `2026-10-14 IN2028 2`.
 */
export type Suggestion = SuggestionSent & { key: string };

/**
 * Type of the suggested sessions, `DEV`, like `SUMMARY:IN2028 DEV`.
 */
const studyType: string = "DEV";

/**
 * Keys of the suggestions dismissed while the page is open.
 */
const dismissed: Set<string> = new Set();


/**
 * Gives tomorrow, the one day with suggestions: the day after today's calendar date, so at 00:40 on 14 October
 * tomorrow is 15 October.
 * - `tomorrow`: Today at noon, one day later.
 *
 * @returns Day like `2026-10-12`
 */
function tomorrowOf(): string {
    const tomorrow: Date = new Date(`${calendarTodayOf()}T12:00:00`);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return dayOf(tomorrow);
}

/**
 * Loads the suggestions of a day from the reader, when it is tomorrow, each with its key, without the dismissed ones.
 * - `suggestions`: Suggestions of the reader, without their keys.
 * - `counts`: Suggestions of each module so far, by its code.
 *
 * @param day - Day like `2026-10-14`
 * @returns Suggestions, none for any other day
 * @throws {Error} - When the reader cannot answer
 */
export async function suggestionsLoad(day: string): Promise<Suggestion[]> {
    if (day !== tomorrowOf())
        return [];

    const response: Response = await fetch(`/api/day/suggestions?date=${day}`);
    if (!response.ok)
        throw new Error(`Reader answered ${response.status}`);
    const suggestions: SuggestionSent[] = await response.json();
    const counts: Map<string, number> = new Map();
    return suggestions
        .map((suggestion: SuggestionSent): Suggestion => {
            counts.set(suggestion.module, (counts.get(suggestion.module) ?? 0) + 1);
            return { ...suggestion, key: `${day} ${suggestion.module} ${counts.get(suggestion.module)}` };
        })
        .filter((suggestion: Suggestion): boolean => !dismissed.has(suggestion.key));
}

/**
 * Accepts a suggestion: writes it as a box of its day, a skill box of its module of the type DEV,
 * with its duration and without time.
 *
 * @param suggestion - Suggestion to accept
 * @param day - Its day, like `2026-10-14`
 * @throws {Error} - When the reader does not take the box
 */
export async function suggestionAccept(suggestion: Suggestion, day: string): Promise<void> {
    await boxAdd({
        category: skillName, title: suggestion.title, location: "", from: "",
        module: suggestion.module, type: studyType, note: "", day: day, time: null, minutes: suggestion.minutes,
        deadline: "",
    });
}

/**
 * Dismisses a suggestion while the page stays open, so it stays out when the suggestions load again,
 * see {@link suggestionsLoad}.
 *
 * @param suggestion - Suggestion to dismiss
 */
export function suggestionDismiss(suggestion: Suggestion): void {
    dismissed.add(suggestion.key);
}

/**
 * Opens the entry by category of a new box filled in as suggested, its module, the type DEV and its duration
 * picked, so I change it before saving, which accepts it.
 *
 * @param suggestion - Suggestion to open
 * @param day - A date on its day
 * @throws {Error} - When the reader gives no valid answer
 */
export async function suggestionOpen(suggestion: Suggestion, day: Date): Promise<void> {
    await boxOpenSuggestion(day, suggestion.module, studyType, suggestion.minutes);
}
