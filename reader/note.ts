/**
 * ## Daily notes
 *
 * Reads the daily notes with their callouts, like `> [!info] Tagesplanungen`, whose boxes the plan of their day shows,
 * and writes the two callouts I write: my gratitude into `> [!tip] Dankbarkeiten`, as points,
 * and my short paragraph about the day overall into `> [!note] Tagesfazit`, as text;
 * what the other callouts hold stays as it is.
 * The template has no `Tagesfazit`: a note gets it after my gratitude with my first paragraph, and loses it again
 * when I empty the paragraph, so an empty text puts back what the template has, as for my gratitude.
 * A day's note of the new system comes first, else the one of the archive.
 * The day shows a note without its parts that are just as in the template, which hold only placeholders,
 * like `### Events` with only `- Informationen`; the file stays as it is.
 * A write goes only into the new system: it starts from the note the day has, or from the template
 * with its calendar week and semester, and changes only the lines of the callout.
 *
 * - `node:fs`: Works with files and folders on the disk.
 * - `node:path`: Builds file paths for the operating system.
 * - `temporal-polyfill`: Calculates with dates, like the calendar week.
 * - `./sources.ts`: Names every folder and file the reader reads and tells which it may write.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { Temporal } from "temporal-polyfill";
import { day, writeAllowed, writeRoot } from "./sources.ts";


/**
 * Titles of the callouts the dashboard reads and writes.
 */
export type CalloutTitle = "Tagesplanungen" | "Masterinformationen" | "Dankbarkeiten" | "Tagesfazit";

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
 * The callouts the dashboard writes, my gratitude and my paragraph about the day; the others it only reads.
 */
const written: CalloutTitle[] = ["Dankbarkeiten", "Tagesfazit"];

/**
 * The callout of my paragraph about the day: text instead of points, and not in the template.
 */
const paragraph: CalloutTitle = "Tagesfazit";

/**
 * Head of the callout of my paragraph, as a note gets it after my gratitude.
 */
const paragraphHead: string = `> [!note] ${paragraph}`;

/**
 * Start of a point line in my gratitude, as in the template.
 */
const pointStart: string = "> - ";

/**
 * Start of a part of a note: the line break before a callout like `> [!abstract] Masterinformationen`,
 * a heading like `### Events`, or a rule `---`; a part runs up to the next start.
 */
const partStart: RegExp = /\n(?=> \[!|#+ |---)/;


/**
 * Builds the paths of the daily note of a date, in the new system and in the archive.
 *
 * @param date - Date like `2026-10-12`
 * @returns Path `<JJJJ>/<JJJJ_MM>/<JJJJ_MM_TT>.md` in the new system,
 *   and path `FrequenzEreignis<JJJJ>/<JJJJMM>/<JJJJMMTT>.md` in the diary of the archive
 * @throws {Error} - When the date is not written like `2026-10-12`
 */
function noteFiles(date: string): { current: string; archived: string } {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date))
        throw new Error(`No date ${date}`);

    const [year, month, dayOfMonth]: string[] = date.split("-");
    return {
        current: join(writeRoot, year, `${year}_${month}`, `${year}_${month}_${dayOfMonth}.md`),
        archived: join(day.notes, `FrequenzEreignis${year}`, `${year}${month}`, `${year}${month}${dayOfMonth}.md`),
    };
}

/**
 * Creates the text of a new daily note from the template,
 * with the calendar week and the semester of the date.
 * A semester runs from April to September (`S`) or from October to March (`W`).
 * - {@link Temporal.PlainDate}: Date without time, gives the calendar week as `weekOfYear`.
 *
 * @param date - Date like `2026-10-10`
 * @returns Text of the note
 */
function noteCreate(date: string): string {
    const plain: Temporal.PlainDate = Temporal.PlainDate.from(date);
    let semester: string;
    if (plain.month >= 4 && plain.month <= 9)
        semester = `${plain.year}S`;
    else if (plain.month >= 10)
        semester = `${plain.year}W`;
    else
        semester = `${plain.year - 1}W`;

    return readFileSync(day.noteTemplate, "utf8")
        .replace(/^Kalenderwoche: .*$/m, `Kalenderwoche: ${plain.weekOfYear}`)
        .replace(/^(Semester:\n {2}- ).*$/m, `$1${semester}`);
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
 * Reads the lines of a callout in the daily note of a date.
 * Lines just as in the template count as none, because they only hold its placeholders.
 *
 * @param date - Date like `2026-07-03`
 * @param title - Title of the callout
 * @returns Lines of the callout, none when the note or the callout is missing
 * @throws {Error} - When the date is not written like `2026-07-03`
 */
function calloutLinesRead(date: string, title: CalloutTitle): string[] {
    const lines: string[] = calloutLinesOf(noteRead(date) ?? "", title);
    const placeholders: string[] = calloutLinesOf(readFileSync(day.noteTemplate, "utf8"), title);
    return lines.join("\n") === placeholders.join("\n") ? [] : lines;
}

/**
 * Reads the daily note of a date: the one of the new system, else the one of the archive.
 *
 * @param date - Date like `2026-07-03`
 * @returns Markdown text of the note, or `null` when the day has no note
 * @throws {Error} - When the date is not written like `2026-07-03`
 */
export function noteRead(date: string): string | null {
    const files: { current: string; archived: string } = noteFiles(date);
    const file: string | undefined = [files.current, files.archived].find((path: string): boolean => existsSync(path));
    return file === undefined ? null : readFileSync(file, "utf8");
}

/**
 * Reads the daily note of a date as the day shows it: without its parts that are just as in the template,
 * see {@link partStart}, like `### Events` with only `- Informationen`, since they hold only placeholders.
 * Rules and the front matter always stay; the file stays as it is.
 * - `note`: Text of the note.
 * - `placeholders`: Parts of the template that start with a callout or a heading,
 *   without the empty lines at their ends.
 *
 * @param date - Date like `2026-07-03`
 * @returns Markdown text of the note without placeholders, or `null` when the day has no note
 * @throws {Error} - When the date is not written like `2026-07-03`
 */
export function noteShownRead(date: string): string | null {
    const note: string | null = noteRead(date);
    if (note === null)
        return null;

    const placeholders: string[] = readFileSync(day.noteTemplate, "utf8").split(partStart)
        .filter((part: string): boolean => !part.startsWith("---"))
        .map((part: string): string => part.trimEnd());
    return note.split(partStart)
        .filter((part: string): boolean => !placeholders.includes(part.trimEnd()))
        .join("\n");
}

/**
 * Reads the points of a callout in the daily note of a date, each without its further lines.
 *
 * @param date - Date like `2026-07-03`
 * @param title - Title of the callout
 * @returns Texts of the points, none for a missing note and for the placeholders of the template
 * @throws {Error} - When the date is not written like `2026-07-03`
 */
export function pointsRead(date: string, title: CalloutTitle): string[] {
    return calloutLinesRead(date, title)
        .map((line: string): string | undefined => line.match(/^> - (?:\[.\] )?(.*)$/)?.[1])
        .filter((point: string | undefined): point is string => point !== undefined);
}

/**
 * Reads a callout of the daily note of a date as text to edit, each line without its `> `:
 * one point per line without `> - `, a further line of a point indented as in the note;
 * my paragraph about the day as it stands, since it has no points.
 *
 * @param date - Date like `2026-07-03`
 * @param title - Title of the callout
 * @returns Text of the callout, empty for a missing note and for the placeholders of the template
 * @throws {Error} - When the date is not written like `2026-07-03`
 */
function calloutTextRead(date: string, title: CalloutTitle): string {
    return calloutLinesRead(date, title)
        .map((line: string): string => title !== paragraph && line.startsWith(pointStart)
            ? line.replace(/^> - (?:\[.\] )?/, "")
            : line.replace(/^> ?/, ""))
        .join("\n");
}

/**
 * Reads the callouts of the daily note of a date as texts to edit, see {@link calloutTextRead}.
 *
 * @param date - Date like `2026-07-03`
 * @returns Text of each callout
 * @throws {Error} - When the date is not written like `2026-07-03`
 */
export function calloutsRead(date: string): { [title in CalloutTitle]: string } {
    return {
        Tagesplanungen: calloutTextRead(date, "Tagesplanungen"),
        Masterinformationen: calloutTextRead(date, "Masterinformationen"),
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
 * Puts the lines of my paragraph about the day into the lines of a note: in place of the old ones;
 * after my gratitude, behind an empty line and its head, while the note has none;
 * no lines take the callout out with its head and that empty line, as the template has none.
 * - `start`: First line to take out: the head of the callout, or the empty line before it.
 * - `gratitude`: Lines of my gratitude.
 *
 * @param lines - Lines of the note, changed in place
 * @param found - Lines of the callout in the note, see {@link calloutFind}, `null` when the note has none
 * @param paragraphLines - New lines, none to take the callout out
 * @throws {Error} - When the note has neither the callout nor my gratitude to put it after
 */
function paragraphPut(lines: string[], found: [number, number] | null, paragraphLines: string[]): void {
    if (found !== null && paragraphLines.length > 0) {
        lines.splice(found[0], found[1] - found[0], ...paragraphLines);
    } else if (found !== null) {
        let start: number = found[0] - 1;
        if (lines[start - 1] === "")
            start--;
        lines.splice(start, found[1] - start);
    } else if (paragraphLines.length > 0) {
        const gratitude: [number, number] | null = calloutFind(lines, "Dankbarkeiten");
        if (gratitude === null)
            throw new Error(`No callout Dankbarkeiten to put ${paragraph} after`);
        lines.splice(gratitude[1], 0, "", paragraphHead, ...paragraphLines);
    }
}

/**
 * Writes the text of a callout into the daily note of its date in the new system, only those I write, see {@link written}.
 * Starts from the note the day has, see {@link noteRead}, or from the template when it has none.
 * My gratitude becomes points, see {@link pointLinesOf}, and an empty text puts the placeholders of the template back;
 * my paragraph becomes text, see {@link paragraphPut}, and an empty one in a note without it leaves the note as it is.
 * - `file`: The note of the date in the new system.
 * - `lines`: Lines of the note.
 * - `found`: Lines of the callout in the note.
 * - `points`: Lines of my gratitude.
 *
 * @param callout - Callout text as my gratitude or my paragraph sends it
 * @throws {Error} - When the date is not written like `2026-07-03`, the callout is not one I write or is missing,
 *   or the note would lie outside the new system
 */
export function calloutWrite(callout: CalloutNew): void {
    const { date, title, text }: CalloutNew = callout;
    if (!written.includes(title))
        throw new Error(`No writing into the callout ${title}`);

    const file: string = noteFiles(date).current;
    if (!writeAllowed(file))
        throw new Error(`No writing outside the new system: ${file}`);
    const lines: string[] = (noteRead(date) ?? noteCreate(date)).split("\n");
    const found: [number, number] | null = calloutFind(lines, title);
    if (title === paragraph) {
        if (found === null && text.trim() === "")
            return;
        paragraphPut(lines, found, paragraphLinesOf(text));
    } else if (found === null) {
        throw new Error(`No callout ${title} in the note of ${date}`);
    } else {
        const points: string[] = pointLinesOf(text);
        lines.splice(found[0], found[1] - found[0],
            ...(points.length > 0 ? points : calloutLinesOf(readFileSync(day.noteTemplate, "utf8"), title)));
    }
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, lines.join("\n"));
}
