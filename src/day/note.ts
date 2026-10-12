/**
 * ## Daily note
 *
 * Shows the daily note of a day from the diary, read only, as the reader gives it: without the parts that are
 * just as in the template, like `### Events` with only `- Informationen`; `day.css` hides the rules left between them.
 * Loads and writes its callouts, for my gratitude and my paragraph about the day;
 * the reader writes them into the note of the new system.
 *
 * - `marked`: Turns Markdown into HTML.
 */

import { Marked, type Tokens } from "marked";


/**
 * Titles of the callouts the page reads and writes, as the reader names them.
 */
export type CalloutTitle = "Tagesplanungen" | "Masterinformationen" | "Dankbarkeiten" | "Tagesfazit";


/**
 * Turns a `csv` code block, like the Skilling block, into a table with its first row as head.
 * Splits rows at line breaks and cells at commas, as the Obsidian plugin `csv-codeblock` does,
 * so the table shows what Obsidian shows.
 * - {@link HTMLElement#outerHTML}: HTML of the table, cell texts escaped by `textContent`.
 *
 * @param csv - Text of the code block
 * @returns HTML of the table
 */
function tableOf(csv: string): string {
    const table: HTMLTableElement = document.createElement("table");
    csv.split("\n")
        .filter((row: string): boolean => row.length > 0)
        .forEach((row: string, index: number): void => {
            const line: HTMLTableRowElement = table.insertRow();
            row.split(",").forEach((text: string): void => {
                const cell: HTMLTableCellElement = document.createElement(index === 0 ? "th" : "td");
                cell.textContent = text;
                line.append(cell);
            });
        });
    return table.outerHTML;
}

/**
 * Markdown reader that shows `csv` code blocks as tables, see {@link tableOf}.
 * - `code`: Renders a code block; `false` leaves every other language to `marked`.
 */
const markdown: Marked = new Marked({
    renderer: {
        code: (block: Tokens.Code): string | false => block.lang === "csv" && tableOf(block.text),
    },
});


/**
 * Turns an Obsidian note into plain Markdown.
 * - Front matter between the first two `---` lines goes, the page shows the date already.
 * - The callout Tagesplanungen with the line `---` below goes, the list of boxes beside the log shows its boxes.
 * - The callouts Dankbarkeiten and Tagesfazit go, my gratitude and my paragraph about the day above the note show them.
 * - A callout head like `> [!abstract] Masterinformationen` becomes a heading inside its quote.
 *
 * @param note - Text of the note file
 * @returns Markdown that `marked` reads
 */
function markdownOf(note: string): string {
    return note
        .replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, "")
        .replace(/^> \[!\w+\][+-]? *Tagesplanungen\s*\n(?:>.*\n)*\s*(?:---\s*\n)?/m, "")
        .replace(/^> \[!\w+\][+-]? *(?:Dankbarkeiten|Tagesfazit)\s*\n(?:>.*(?:\n|$))*/gm, "")
        .replace(/^> \[!\w+\][+-]? ?(.*)$/gm, "> ### $1");
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
 * Loads the callouts of the daily note of a date from the reader.
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
 * Sends the text of a callout to the reader, which writes it into the daily note of its date in the new system.
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
