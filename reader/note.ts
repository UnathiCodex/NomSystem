/**
 * ## Daily notes
 *
 * Reads the daily notes of the new system, one per day, like `2026/2026_10/2026_10_12.md`, and writes into them
 * what I write in the dashboard, all a note holds: my gratitude into the callout `> [!tip] Dankbarkeiten`, as points,
 * and my short paragraph about the day overall into the callout `> [!note] Tagesfazit`, as text.
 * A day has no note until I first write one of them: each callout is added the first time I write into it,
 * my gratitude before my paragraph, and taken out again with its head when I empty it;
 * every other line of a note stays as it is.
 *
 * - `node:fs`: Works with files and folders on the disk.
 * - `node:path`: Builds file paths for the operating system.
 * - `./sources.ts`: Names the folder of the new system and tells which files the reader may write.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { writeAllowed, writeRoot } from "./sources.ts";


/**
 * Titles of the callouts of a daily note: my gratitude and my paragraph about the day.
 */
export type CalloutTitle = "Dankbarkeiten" | "Tagesfazit";

/**
 * A callout text, as my gratitude and my paragraph about the day send it.
 *
 * - `date`: Date of the daily note, like `2026-07-03`.
 * - `title`: Title of the callout.
 * - `text`: Text of the callout, as {@link calloutsRead} gives it.
 */
export type CalloutNew = {
    date: string;
    title: CalloutTitle;
    text: string;
};

/**
 * The callouts of a daily note, the only ones the reader writes: my gratitude and my paragraph about the day.
 */
const titles: CalloutTitle[] = ["Dankbarkeiten", "Tagesfazit"];

/**
 * Head of each callout, the line above its lines.
 */
const heads: { [title in CalloutTitle]: string } = {
    Dankbarkeiten: "> [!tip] Dankbarkeiten",
    Tagesfazit: "> [!note] Tagesfazit",
};

/**
 * The callout of my paragraph about the day: text instead of points.
 */
const paragraph: CalloutTitle = "Tagesfazit";

/**
 * Start of a point line in my gratitude.
 */
const pointStart: string = "> - ";


/**
 * Builds the path of the daily note of a date in the new system.
 *
 * @param date - Date like `2026-10-12`
 * @returns Path `<JJJJ>/<JJJJ_MM>/<JJJJ_MM_TT>.md` in the folder of the new system, like `2026/2026_10/2026_10_12.md`
 * @throws {Error} - When the date is not written like `2026-10-12`
 */
function noteFileOf(date: string): string {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date))
        throw new Error(`No date ${date}`);

    const [year, month, dayOfMonth]: string[] = date.split("-");
    return join(writeRoot, year, `${year}_${month}`, `${year}_${month}_${dayOfMonth}.md`);
}

/**
 * Finds the lines of a callout in a note: after its head `> [!type] Title`,
 * every following line that starts with `>`.
 *
 * @param lines - Lines of a note
 * @param title - Title of the callout
 * @returns Index of the first line after the head and of the first line after the callout,
 *   or `null` when the note has no such callout
 */
function calloutFind(lines: string[], title: CalloutTitle): [number, number] | null {
    const head: number = lines.findIndex((line: string): boolean =>
        new RegExp(`^> \\[!\\w+\\][+-]? *${title}\\s*$`).test(line));
    if (head === -1)
        return null;

    let end: number = head + 1;
    while (end < lines.length && lines[end].startsWith(">"))
        end++;
    return [head + 1, end];
}

/**
 * Takes the lines of a callout out of a note.
 *
 * @param note - Text of a note
 * @param title - Title of the callout
 * @returns Lines of the callout, none when the note has no such callout
 */
function calloutLinesOf(note: string, title: CalloutTitle): string[] {
    const lines: string[] = note.split("\n");
    const found: [number, number] | null = calloutFind(lines, title);
    return found === null ? [] : lines.slice(...found);
}

/**
 * Reads the daily note of a date.
 * - `file`: The note of the date in the new system.
 *
 * @param date - Date like `2026-07-03`
 * @returns Markdown text of the note, or `null` when the day has no note
 * @throws {Error} - When the date is not written like `2026-07-03`
 */
export function noteRead(date: string): string | null {
    const file: string = noteFileOf(date);
    return existsSync(file) ? readFileSync(file, "utf8") : null;
}

/**
 * Reads a callout of the daily note of a date as text to edit, each line without its `> `:
 * one point per line without `> - `, a further line of a point indented as in the note;
 * my paragraph about the day as it stands, since it has no points.
 *
 * @param date - Date like `2026-07-03`
 * @param title - Title of the callout
 * @returns Text of the callout, empty for a day without note or a note without the callout
 * @throws {Error} - When the date is not written like `2026-07-03`
 */
function calloutTextRead(date: string, title: CalloutTitle): string {
    return calloutLinesOf(noteRead(date) ?? "", title)
        .map((line: string): string => title !== paragraph && line.startsWith(pointStart)
            ? line.slice(pointStart.length)
            : line.replace(/^> ?/, ""))
        .join("\n");
}

/**
 * Reads my gratitude and my paragraph about the day of the daily note of a date as texts to edit,
 * see {@link calloutTextRead}.
 *
 * @param date - Date like `2026-07-03`
 * @returns Text of each callout
 * @throws {Error} - When the date is not written like `2026-07-03`
 */
export function calloutsRead(date: string): { [title in CalloutTitle]: string } {
    return {
        Dankbarkeiten: calloutTextRead(date, "Dankbarkeiten"),
        Tagesfazit: calloutTextRead(date, "Tagesfazit"),
    };
}

/**
 * Turns the text of my gratitude into the lines of its callout:
 * every line a point, an indented line a further line of the point before.
 * - `lines`: Lines made so far.
 *
 * @param text - Text as my gratitude sends it, one point per line
 * @returns Lines like `> - Schön, dass alle da waren`, none for an empty text
 */
function pointLinesOf(text: string): string[] {
    const lines: string[] = [];
    for (const raw of text.split("\n")) {
        const line: string = raw.trimEnd();
        if (line === "")
            continue;
        if (/^\s/.test(line) && lines.length > 0)
            lines.push(`> ${line}`);
        else
            lines.push(`${pointStart}${line.trim()}`);
    }
    return lines;
}

/**
 * Turns the text of my paragraph about the day into the lines of its callout: every line after `> `,
 * an empty line between two paragraphs as `>`, none at its ends.
 * - `kept`: The text without spaces and empty lines at its ends.
 *
 * @param text - Text as my paragraph sends it
 * @returns Lines like `> Ein ruhiger Tag`, none for an empty text
 */
function paragraphLinesOf(text: string): string[] {
    const kept: string = text.trim();
    return kept === "" ? [] : kept.split("\n").map((line: string): string => `> ${line}`.trimEnd());
}

/**
 * Puts the new lines of a callout into the lines of a note, each callout parted from what stands before
 * and after it by an empty line: in place of its old lines; without new lines, the callout taken out with its head
 * and the empty line after it; while the note has no such callout, the callout added with its head, my gratitude
 * before my paragraph when the note has that already, else at the end of the note.
 * - `found`: Lines of the callout in the note, see {@link calloutFind}, `null` when the note has none.
 * - `head`: Line of the head of the callout found.
 * - `after`: First line after the callout found and the empty line after it.
 * - `next`: Lines of my paragraph, which my gratitude goes before, `null` for none and when the paragraph is added.
 * - `at`: Line the new callout goes before: the head of my paragraph, or the end of the note.
 *
 * @param lines - Lines of the note, changed in place
 * @param title - Title of the callout
 * @param calloutLines - Its new lines, none to take it out
 */
function calloutPut(lines: string[], title: CalloutTitle, calloutLines: string[]): void {
    const found: [number, number] | null = calloutFind(lines, title);
    if (found !== null && calloutLines.length > 0) {
        lines.splice(found[0], found[1] - found[0], ...calloutLines);
        return;
    }
    if (found !== null) {
        const head: number = found[0] - 1;
        const after: number = lines[found[1]] === "" ? found[1] + 1 : found[1];
        lines.splice(head, after - head);
        return;
    }

    const next: [number, number] | null = title === paragraph ? null : calloutFind(lines, paragraph);
    if (next === null && lines.length > 0 && lines[lines.length - 1] !== "")
        lines.push("");
    const at: number = next === null ? lines.length : next[0] - 1;
    lines.splice(at, 0, heads[title], ...calloutLines, "");
}

/**
 * Writes the text of a callout into the daily note of its date, see {@link calloutPut}: my gratitude as points,
 * see {@link pointLinesOf}, my paragraph as text, see {@link paragraphLinesOf}; an empty text takes the callout out,
 * and leaves a day without note, or a note without the callout, as it is.
 * - `file`: The note of the date in the new system.
 * - `note`: Text of the note, empty for a day without note.
 * - `lines`: Lines of the note, none for an empty one.
 * - `calloutLines`: New lines of the callout, none for an empty text.
 *
 * @param callout - Callout text as my gratitude or my paragraph sends it
 * @throws {Error} - When the date is not written like `2026-07-03`, the title is none of {@link titles},
 *   or the note would lie outside the new system
 */
export function calloutWrite(callout: CalloutNew): void {
    const { date, title, text }: CalloutNew = callout;
    if (!titles.includes(title))
        throw new Error(`No callout ${title}`);
    const file: string = noteFileOf(date);
    if (!writeAllowed(file))
        throw new Error(`No writing outside the new system: ${file}`);

    const note: string = noteRead(date) ?? "";
    const lines: string[] = note === "" ? [] : note.split("\n");
    const calloutLines: string[] = title === paragraph ? paragraphLinesOf(text) : pointLinesOf(text);
    if (calloutLines.length === 0 && calloutFind(lines, title) === null)
        return;
    calloutPut(lines, title, calloutLines);
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, lines.join("\n"));
}
