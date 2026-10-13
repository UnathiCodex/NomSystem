/**
 * ## Places
 *
 * Reads and writes my places in `Places.md`, as `food.ts` does my foods in `Foods.md`: one Markdown table
 * with one row per place, its name, like `TumMain`, and its address with its country,
 * like `Arcisstraße 21, 80333 München, Deutschland`.
 * Every field of a place, the place of an entry and where a way starts, offers only these, see `categories.ts`,
 * and an entry writes its place as Google Calendar does, its name and its address in one line, see {@link lineOf},
 * like `TumMain, Arcisstraße 21, 80333 München, Deutschland`, as its `LOCATION`, and where its way starts
 * as its `X-FROM`, so it keeps the address it had then, also once the address in `Places.md` changes;
 * its name is the part before the first comma, see {@link labelOf}. An older entry keeps the name alone,
 * like `HomeMunich`.
 * The file starts without places: I add each place with its address from the dialog of the day the first time
 * I need it, and the reader creates the file with that first place.
 *
 * - `node:fs`: Reads and writes `Places.md`.
 * - `node:path`: Gives the folder of `Places.md`.
 * - `./sources.ts`: Names `Places.md` and tells which files the reader may write.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { day, writeAllowed } from "./sources.ts";


/**
 * A place, one row of `Places.md`.
 *
 * - `name`: Name, like `TumMain`; unique, ignoring case, without `|` and without a comma, which ends it in a line.
 * - `address`: Its address with its country, like `Arcisstraße 21, 80333 München, Deutschland`, without `|`.
 */
export type Place = {
    name: string;
    address: string;
};

/**
 * Lines a new `Places.md` starts with: the head of its table, the header and the line below it.
 */
const fileHead: string[] = ["| Place | Address |", "|---|---|"];

/**
 * Lines of the table of `Places.md` before its rows: the header and the line below it.
 */
const tableHead: number = 2;


/**
 * Cleans a text for a cell of `Places.md`: `|` and line breaks become spaces, spaces in a row one, none at the ends.
 *
 * @param text - Text as typed, like `Arcisstraße 21,  80333 München`
 * @returns Clean text, like `Arcisstraße 21, 80333 München`
 */
function cellOf(text: string): string {
    return text.replace(/\|/g, " ").replace(/\s+/g, " ").trim();
}

/**
 * Writes a place as an entry writes it, its name and its address in one line, as Google Calendar does.
 *
 * @param place - A place of `Places.md`
 * @returns Line like `TumMain, Arcisstraße 21, 80333 München, Deutschland`, the name alone without address
 */
export function lineOf(place: Place): string {
    return place.address === "" ? place.name : `${place.name}, ${place.address}`;
}

/**
 * Gives the name of the place of a line, the part before its first comma.
 *
 * @param line - Place as an entry writes it, like `TumMain, Arcisstraße 21, 80333 München, Deutschland`,
 *   or only its name, like `HomeMunich`
 * @returns Name like `TumMain`
 */
export function labelOf(line: string): string {
    return line.split(",")[0].trim();
}

/**
 * Reads my places, the rows of the table of `Places.md`: its lines starting with `|`, after the head of the table.
 * A row without a name stays out.
 * - `cells`: Cells of a row, without the empty texts before its first `|` and after its last.
 *
 * @returns Places in the order of the table, none while `Places.md` does not exist
 */
export function placesRead(): Place[] {
    if (!existsSync(day.places))
        return [];

    return readFileSync(day.places, "utf8").split("\n")
        .filter((line: string): boolean => line.startsWith("|"))
        .slice(tableHead)
        .map((line: string): string[] => line.split("|").slice(1, -1).map((cell: string): string => cell.trim()))
        .filter((cells: string[]): boolean => (cells[0] ?? "") !== "")
        .map((cells: string[]): Place => ({ name: cells[0], address: cells[1] ?? "" }));
}

/**
 * Adds a place to `Places.md` as the last row of its table, every other line staying as it is;
 * creates `Places.md` with the head of its table, see {@link fileHead}, when it does not exist yet.
 * Cleans name and address, see {@link cellOf}.
 * - `added`: The place as written.
 * - `lines`: Lines of `Places.md`.
 * - `last`: Index of the last line of its table.
 *
 * @param sent - Place as the page sends it, its name and its address as typed
 * @returns The place as written
 * @throws {Error} - When the name or the address is empty, the name holds a comma, another place has the name,
 *   ignoring case, or `Places.md` lies outside the new system or holds no table
 */
export function placeAdd(sent: Place): Place {
    const added: Place = { name: cellOf(String(sent.name ?? "")), address: cellOf(String(sent.address ?? "")) };
    if (added.name === "" || added.name.includes(",")
        || placesRead().some((mine: Place): boolean => mine.name.toLowerCase() === added.name.toLowerCase()))
        throw new Error(`No new name of a place: ${added.name}`);
    if (added.address === "")
        throw new Error(`No address of ${added.name}`);
    if (!writeAllowed(day.places))
        throw new Error(`No writing outside the new system: ${day.places}`);

    const lines: string[] = existsSync(day.places) ? readFileSync(day.places, "utf8").split("\n") : [...fileHead, ""];
    const last: number = lines.findLastIndex((line: string): boolean => line.startsWith("|"));
    if (last === -1)
        throw new Error(`No table in ${day.places}`);

    lines.splice(last + 1, 0, `| ${added.name} | ${added.address} |`);
    mkdirSync(dirname(day.places), { recursive: true });
    writeFileSync(day.places, lines.join("\n"));
    return added;
}
