/**
 * ## Gifts
 *
 * Reads and writes my gift ideas for birthdays and holidays in `Gifts.md`, as `food.ts` does my foods in `Foods.md`:
 * one Markdown table with one row per gift idea, the day of its birthday or holiday, like `11.10.2026`,
 * the birthday or holiday as `Birthdays.ics` names it, like `Geburtstag: KarlbauerFlorian`, and the gift.
 * The birthdays and holidays lie in `Birthdays.ics`, which the reader only reads, so my gift ideas for them lie here,
 * apart; the plan of a day shows each below its birthday or holiday, see `boxes.ts`.
 * I write one only when I have one.
 *
 * - `node:fs`: Reads and writes `Gifts.md`.
 * - `node:path`: Gives the folder of `Gifts.md`.
 * - `./sources.ts`: Names `Gifts.md` and tells which files the reader may write.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { day, writeAllowed } from "./sources.ts";


/**
 * A gift idea, one row of `Gifts.md`.
 *
 * - `day`: Day of its birthday or holiday, like `2026-10-11`.
 * - `occasion`: The birthday or holiday as my calendar names it, like `Geburtstag: KarlbauerFlorian`.
 * - `gift`: The gift, like `Buch über Rom`; an empty one, as the page sends it, takes the idea out again.
 */
export type Gift = {
    day: string;
    occasion: string;
    gift: string;
};

/**
 * Text a new `Gifts.md` starts with: its title, what its columns hold, and the head of its table,
 * the header and the line below it.
 */
const fileHead: string[] = [
    "# Gifts",
    "",
    "My gift ideas: the day of a birthday or holiday, its name as my calendar writes it, and the gift.",
    "",
    "| Day | Occasion | Gift |",
    "| --- | --- | --- |",
];

/**
 * Lines of the table of `Gifts.md` before its rows: the header and the line below it.
 */
const tableHead: number = 2;


/**
 * Cleans a text for a cell of `Gifts.md`: `|` and line breaks become spaces, spaces in a row one, none at the ends;
 * so a birthday or holiday is found by its clean name, also one like `Trip to … || Start: …`.
 *
 * @param text - Text as typed or as my calendar writes it
 * @returns Clean text
 */
function cellOf(text: string): string {
    return text.replace(/\|/g, " ").replace(/\s+/g, " ").trim();
}

/**
 * Writes a day as `Gifts.md` does, in my standard way with the year.
 *
 * @param date - Day like `2026-10-11`
 * @returns Day like `11.10.2026`
 */
function fileDayOf(date: string): string {
    const [year, month, dayOfMonth]: string[] = date.split("-");
    return `${dayOfMonth}.${month}.${year}`;
}

/**
 * Reads a day as `Gifts.md` writes it.
 *
 * @param text - Day like `11.10.2026`
 * @returns Day like `2026-10-11`, empty for a text written otherwise
 */
function dayOfFile(text: string): string {
    const parts: RegExpMatchArray | null = text.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
    return parts === null ? "" : `${parts[3]}-${parts[2]}-${parts[1]}`;
}

/**
 * Splits a line of the table into its cells, without the empty texts before its first `|` and after its last.
 *
 * @param line - Line starting with `|`
 * @returns Its cells without spaces at their ends
 */
function cellsOf(line: string): string[] {
    return line.split("|").slice(1, -1).map((cell: string): string => cell.trim());
}

/**
 * Reads my gift ideas, the rows of the table of `Gifts.md`: its lines starting with `|`, after the head of the table.
 * A row whose day cannot be read stays out.
 *
 * @returns Gift ideas in the order of the table, none while `Gifts.md` does not exist
 */
export function giftsRead(): Gift[] {
    if (!existsSync(day.gifts))
        return [];

    return readFileSync(day.gifts, "utf8").split("\n")
        .filter((line: string): boolean => line.startsWith("|"))
        .slice(tableHead)
        .map(cellsOf)
        .map((cells: string[]): Gift => ({
            day: dayOfFile(cells[0] ?? ""), occasion: cells[1] ?? "", gift: cells[2] ?? "",
        }))
        .filter((gift: Gift): boolean => gift.day !== "");
}

/**
 * Finds my gift idea for a birthday or holiday of a day, by its clean name, see {@link cellOf}.
 *
 * @param gifts - My gift ideas, see {@link giftsRead}
 * @param date - Day like `2026-10-11`
 * @param occasion - The birthday or holiday as my calendar names it
 * @returns The gift, empty for none
 */
export function giftOf(gifts: Gift[], date: string, occasion: string): string {
    return gifts.find((gift: Gift): boolean => gift.day === date && gift.occasion === cellOf(occasion))?.gift ?? "";
}

/**
 * Writes my gift idea for a birthday or holiday of a day into `Gifts.md`, every other line staying as it is:
 * changes its row when it has one, else adds one as the last row of the table, and takes its row out
 * when the gift is empty; creates `Gifts.md` with its head, see {@link fileHead}, when it does not exist yet.
 * - `written`: The gift idea as written, its texts clean, see {@link cellOf}.
 * - `lines`: Lines of `Gifts.md`.
 * - `row`: Index of the line of its row, -1 for none.
 * - `last`: Index of the last line of the table.
 * - `text`: Its row as written.
 *
 * @param sent - Gift idea as the page sends it
 * @throws {Error} - When the day is not written like `2026-10-11`, the birthday or holiday has no name,
 *   or `Gifts.md` lies outside the new system or holds no table
 */
export function giftWrite(sent: Gift): void {
    const written: Gift = { day: String(sent.day ?? ""), occasion: cellOf(String(sent.occasion ?? "")),
        gift: cellOf(String(sent.gift ?? "")) };
    if (!/^\d{4}-\d{2}-\d{2}$/.test(written.day))
        throw new Error(`No date ${written.day}`);
    if (written.occasion === "")
        throw new Error(`No birthday or holiday: ${JSON.stringify(sent)}`);
    if (!writeAllowed(day.gifts))
        throw new Error(`No writing outside the new system: ${day.gifts}`);

    const lines: string[] = existsSync(day.gifts) ? readFileSync(day.gifts, "utf8").split("\n") : [...fileHead, ""];
    const row: number = lines.findIndex((line: string): boolean => line.startsWith("|")
        && dayOfFile(cellsOf(line)[0] ?? "") === written.day && cellsOf(line)[1] === written.occasion);
    const last: number = lines.findLastIndex((line: string): boolean => line.startsWith("|"));
    const text: string = `| ${fileDayOf(written.day)} | ${written.occasion} | ${written.gift} |`;
    if (last === -1)
        throw new Error(`No table in ${day.gifts}`);

    if (row !== -1 && written.gift === "")
        lines.splice(row, 1);
    else if (row !== -1)
        lines[row] = text;
    else if (written.gift !== "")
        lines.splice(last + 1, 0, text);
    else
        return;
    mkdirSync(dirname(day.gifts), { recursive: true });
    writeFileSync(day.gifts, lines.join("\n"));
}
