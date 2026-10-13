/**
 * ## Daily note
 *
 * Shows the daily note of a day, read only, below my gratitude and my paragraph about the day, which the fields above
 * it show, so the note leaves their two callouts out: what is left shows as Markdown, nothing for a note
 * that holds only them, as the dashboard writes it.
 * Loads and writes those two callouts; the reader writes them into the note of the day, see `reader/note.ts`.
 *
 * - `marked`: Turns Markdown into HTML.
 */

import { Marked } from "marked";


/**
 * Titles of the callouts the page reads and writes, as the reader names them: my gratitude and my paragraph
 * about the day.
 */
export type CalloutTitle = "Dankbarkeiten" | "Tagesfazit";


/**
 * Markdown reader of the daily note.
 */
const markdown: Marked = new Marked();


/**
 * Takes my gratitude and my paragraph about the day out of a note, its callouts Dankbarkeiten and Tagesfazit,
 * each its head and every line starting with `>` below it, since the fields above the note show them.
 *
 * @param note - Text of the note file
 * @returns Markdown of the rest of the note, which `marked` reads
 */
function markdownOf(note: string): string {
    return note.replace(/^> \[!\w+\][+-]? *(?:Dankbarkeiten|Tagesfazit)\s*\n(?:>.*(?:\n|$))*/gm, "");
}

/**
 * Shows the daily note of a date, or a hint when the day has none.
 * - {@link Marked#parse}: Turns Markdown into HTML, with `async: false` directly as text.
 *
 * @param date - Date like `2026-07-03`
 * @throws {Error} - When the reader gives no valid answer
 */
export async function noteShow(date: string): Promise<void> {
    const response: Response = await fetch(`/api/day/note?date=${date}`);
    const note: string | null = await response.json();

    const element: HTMLElement = document.getElementById("day-note-text") as HTMLElement;
    element.innerHTML = note === null
        ? `<p class="day-note-none">No daily note on this day</p>`
        : markdown.parse(markdownOf(note), { async: false });
}

/**
 * Loads my gratitude and my paragraph about the day of the daily note of a date from the reader.
 *
 * @param date - Date like `2026-07-03`
 * @returns Text of each callout by its title, one point per line, a further line indented; empty for none
 * @throws {Error} - When the reader gives no valid answer
 */
export async function calloutsLoad(date: string): Promise<{ [title in CalloutTitle]: string }> {
    const response: Response = await fetch(`/api/day/callouts?date=${date}`);
    if (!response.ok)
        throw new Error(`Reader answered ${response.status}`);
    return await response.json();
}

/**
 * Sends the text of a callout to the reader, which writes it into the daily note of its date.
 *
 * @param date - Date like `2026-07-03`
 * @param title - Title of the callout
 * @param text - Text of the callout, one point per line, a further line indented
 * @throws {Error} - When the reader does not take the text
 */
export async function calloutSend(date: string, title: CalloutTitle, text: string): Promise<void> {
    const response: Response = await fetch("/api/day/callouts", {
        method: "POST",
        body: JSON.stringify({ date: date, title: title, text: text }),
    });
    if (!response.ok)
        throw new Error(`Reader answered ${response.status}`);
}
