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
 * A third column, `Link`, may hold a link of a place, like `https://nav.tum.de/room/0509.EG.980`, which an entry
 * writes with it as the standard parameter `ALTREP` of its `LOCATION`, see {@link placeLinkOf}.
 * The file starts without places: I add each place with its address from the dialog of the day the first time
 * I need it, and the reader creates the file with that first place; the pencil below a place picked in the dialog
 * changes its row, its name, its address and its link, see {@link placeChange}, while every entry written before
 * keeps the line and the link it had, after a move, or takes the new one, when the old address was wrong.
 *
 * - `node:fs`: Reads and writes `Places.md`.
 * - `node:path`: Gives the folder of `Places.md`.
 * - `./calendar.ts`: Corrects a wrong address in the entries that carry it.
 * - `./sources.ts`: Names `Places.md`, the plan and the log, and tells which files the reader may write.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { placeCorrect } from "./calendar.ts";
import { day, writeAllowed } from "./sources.ts";


/**
 * A place, one row of `Places.md`.
 *
 * - `name`: Name, like `TumMain`; unique, ignoring case, without `|` and without a comma, which ends it in a line.
 * - `address`: Its address with its country, like `Arcisstraße 21, 80333 München, Deutschland`, without `|`.
 * - `link`: Its link, like `https://nav.tum.de/room/0509.EG.980`, a web address without spaces; empty for none.
 */
export type Place = {
    name: string;
    address: string;
    link: string;
};

/**
 * A changed place, as the page sends it.
 *
 * - `old`: Name of the place as it was, like `TumMain`.
 * - `name`: Its name as typed, maybe new, like `TumStammgelände`.
 * - `address`: Its address as typed.
 * - `link`: Its link as typed, empty for none.
 * - `fix`: Whether the old address was wrong, so the entries that carry it take the new one too, rather than
 *   my place moving, after which they keep it.
 */
export type PlaceChanged = {
    old: string;
    name: string;
    address: string;
    link: string;
    fix: boolean;
};

/**
 * Lines a new `Places.md` starts with: the head of its table, the header and the line below it.
 */
const fileHead: string[] = ["| Place | Address | Link |", "|---|---|---|"];

/**
 * A link of a place, a web address without spaces, like `https://nav.tum.de/room/0509.EG.980`.
 */
const linkForm: RegExp = /^https?:\/\/\S+$/;

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
 * Gives the link to write with a place as the `ALTREP` of `LOCATION`: the link it had in the entry or box
 * it comes from, like the box a log entry is logged from or the entry being changed, while it is that same place,
 * else the link of my place of that line in `Places.md`, else none.
 * - `mine`: My place of the line, `undefined` for none.
 *
 * @param line - Place as an entry writes it, like `TumMain, Arcisstraße 21, 80333 München, Deutschland`
 * @param from - The entry or box it comes from, `null` for none
 * @returns Link like `https://nav.tum.de/room/0509.EG.980`, empty for none
 */
export function placeLinkOf(line: string, from: { location: string; locationLink: string } | null): string {
    if (from !== null && from.location === line)
        return from.locationLink;
    const mine: Place | undefined = placesRead().find((place: Place): boolean => lineOf(place) === line);
    return mine?.link ?? "";
}

/**
 * Reads my places, the rows of the table of `Places.md`: its lines starting with `|`, after the head of the table.
 * A row without a name stays out, a row without link has none.
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
        .map((cells: string[]): Place => ({ name: cells[0], address: cells[1] ?? "", link: cells[2] ?? "" }));
}

/**
 * Cleans a place as the page sends it, see {@link cellOf}, and checks it against my other places: its name
 * is needed, its address and its link may stay empty, and an address needs no number of a house, like
 * `Burg-Eltz-Weg, 81375 München, Deutschland`.
 * - `clean`: The place cleaned.
 *
 * @param sent - Place as the page sends it, its name, its address and its link as typed
 * @param others - My other places, whose names it may not have
 * @returns The place cleaned
 * @throws {Error} - When the name is empty or holds a comma, another place has the name, ignoring case,
 *   or the link is no web address
 */
function placeCleanOf(sent: Place, others: Place[]): Place {
    const clean: Place = {
        name: cellOf(String(sent.name ?? "")), address: cellOf(String(sent.address ?? "")),
        link: cellOf(String(sent.link ?? "")),
    };
    if (clean.name === "" || clean.name.includes(",")
        || others.some((mine: Place): boolean => mine.name.toLowerCase() === clean.name.toLowerCase()))
        throw new Error(`No new name of a place: ${clean.name}`);
    if (clean.link !== "" && !linkForm.test(clean.link))
        throw new Error(`No link of ${clean.name}: ${clean.link}`);
    return clean;
}

/**
 * Reads the lines of `Places.md` to write a place into, a head of only two columns given the column `Link`;
 * those of a new file, the head of its table, see {@link fileHead}, when it does not exist yet.
 * - `lines`: Lines of `Places.md`.
 * - `first`, `last`: Index of the first line of its table, its header, and of its last.
 *
 * @returns Lines of `Places.md`
 * @throws {Error} - When `Places.md` lies outside the new system or holds no table
 */
function placeLinesRead(): string[] {
    if (!writeAllowed(day.places))
        throw new Error(`No writing outside the new system: ${day.places}`);
    const lines: string[] = existsSync(day.places) ? readFileSync(day.places, "utf8").split("\n") : [...fileHead, ""];
    const first: number = lines.findIndex((line: string): boolean => line.startsWith("|"));
    const last: number = lines.findLastIndex((line: string): boolean => line.startsWith("|"));
    if (first === -1 || last === first)
        throw new Error(`No table in ${day.places}`);
    if (lines[first].split("|").length - 2 < 3) {
        lines[first] = `${lines[first].trimEnd()} Link |`;
        lines[first + 1] = `${lines[first + 1].trimEnd()}---|`;
    }
    return lines;
}

/**
 * Writes a place as a row of the table of `Places.md`.
 *
 * @param place - Place cleaned
 * @returns Row like `| TumMain | Arcisstraße 21, 80333 München, Deutschland | https://nav.tum.de |`
 */
function rowOf(place: Place): string {
    return `| ${place.name} | ${place.address} | ${place.link} |`;
}

/**
 * Adds a place to `Places.md` as the last row of its table, with its link or an empty cell, every other line
 * staying as it is, see {@link placeLinesRead}; creates `Places.md` when it does not exist yet.
 * - `added`: The place as written, cleaned, see {@link placeCleanOf}.
 * - `lines`: Lines of `Places.md`.
 * - `last`: Index of the last line of its table.
 *
 * @param sent - Place as the page sends it, its name, its address and its link as typed
 * @returns The place as written
 * @throws {Error} - When the name is empty or holds a comma, another place has the name, ignoring case,
 *   the link is no web address, or `Places.md` lies outside the new system or holds no table
 */
export function placeAdd(sent: Place): Place {
    const added: Place = placeCleanOf(sent, placesRead());
    const lines: string[] = placeLinesRead();
    const last: number = lines.findLastIndex((line: string): boolean => line.startsWith("|"));
    lines.splice(last + 1, 0, rowOf(added));
    mkdirSync(dirname(day.places), { recursive: true });
    writeFileSync(day.places, lines.join("\n"));
    return added;
}

/**
 * Changes my place of a name in `Places.md`, its name, its address and its link, in its own row, every other line
 * staying as it is, see {@link placeLinesRead}; every entry written before keeps the line and the link it had,
 * since each writes its place itself, after a move; when the old address was wrong, every entry and box of plan
 * and log that carries its old line, as its place or where its way starts, takes the new one with its link,
 * see `placeCorrect` in `calendar.ts`.
 * - `old`: The old name in small letters, as names compare, ignoring case.
 * - `changed`: The place as written, cleaned, see {@link placeCleanOf}.
 * - `lines`: Lines of `Places.md`.
 * - `first`: Index of the first line of its table, its header.
 * - `row`: Index of the row of the place, -1 for none.
 * - `before`: My place as it was.
 *
 * @param sent - The place as the page sends it, its old name and its name, address and link as typed
 * @returns The place as written
 * @throws {Error} - When no place has the old name, the name is empty or holds a comma, another place has the name,
 *   ignoring case, the link is no web address, or `Places.md` lies outside the new system
 */
export function placeChange(sent: PlaceChanged): Place {
    const old: string = String(sent.old ?? "").toLowerCase();
    const changed: Place = placeCleanOf(sent, placesRead().filter((mine: Place): boolean =>
        mine.name.toLowerCase() !== old));
    const lines: string[] = placeLinesRead();
    const first: number = lines.findIndex((line: string): boolean => line.startsWith("|"));
    const row: number = lines.findIndex((line: string, index: number): boolean => index >= first + tableHead
        && line.startsWith("|") && (line.split("|")[1] ?? "").trim().toLowerCase() === old);
    if (old === "" || row === -1)
        throw new Error(`No place of the name: ${sent.old}`);
    const before: Place | undefined = placesRead().find((mine: Place): boolean => mine.name.toLowerCase() === old);
    lines[row] = rowOf(changed);
    writeFileSync(day.places, lines.join("\n"));
    if (sent.fix === true && before !== undefined)
        placeCorrect([...day.plan, ...day.log], lineOf(before), lineOf(changed), changed.link);
    return changed;
}
