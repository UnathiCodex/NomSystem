/**
 * ## Places
 *
 * Reads and writes my places in `Places.md`, as `food.ts` does my foods in `Foods.md`: one Markdown table
 * with one row per place, its name, like `TUM Innenstadt`, and its address with its country,
 * like `Arcisstraße 21, 80333 München, Deutschland`.
 * Every field of a place, the place of an entry and where a way starts, offers only these, see `categories.ts`,
 * and an entry writes its place as Google Calendar does, its name and its address in one line, see {@link lineOf},
 * like `TUM Innenstadt, Arcisstraße 21, 80333 München, Deutschland`, as its `LOCATION`, and where its way starts
 * as its `X-FROM`, so it keeps the address it had then, also once the address in `Places.md` changes;
 * its name is the part before the first comma, see {@link labelOf}, so a name never holds a comma: one typed
 * or read with a comma loses it, see {@link nameOf}. An older entry keeps the name alone, like `Home Munich`.
 * A third column, `Link`, may hold a link of a place, like `https://nav.tum.de/room/0509.EG.980`, which an entry
 * writes with it as the standard parameter `ALTREP` of its `LOCATION`, see {@link placeLinkOf}.
 * The file starts without places: I add each place with its address from the dialog of the day the first time
 * I need it, and the reader creates the file with that first place; the pencil below a place picked in the dialog
 * changes its row, its name, its address and its link, see {@link placeChange}, while every entry written before
 * keeps the line and the link it had.
 * Beside it `Rooms.md` holds the rooms of the university in one table of the same form, `| Room | Address | Link |`,
 * like `0509.EG.980 (Audimax Werner-von-Siemens-Hörsaal)` with `Arcisstraße 21, 80333 München, Deutschland`
 * and `https://nav.tum.de/room/0509.EG.980`, read the same way, see {@link roomsRead}; an entry writes a room
 * as a place. A new place goes into `Rooms.md` when its name starts like the code of a room, digits and a dot,
 * see {@link roomForm}, otherwise into `Places.md`; a name is unique over both files.
 * A meeting online has one place of its own, `Online`, fixed here and in no file, see {@link onlineName},
 * which in a skill entry or box holds what I need to join and the link of the meeting, typed per entry.
 *
 * - `node:fs`: Reads and writes `Places.md` and `Rooms.md`.
 * - `node:path`: Gives the folder of a file.
 * - `./sources.ts`: Names `Places.md`, `Rooms.md`, the plan and the log, and tells which files the reader may write.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { day, writeAllowed } from "./sources.ts";


/**
 * A place, one row of `Places.md`, or a room, one row of `Rooms.md`.
 *
 * - `name`: Name, like `TUM Innenstadt`; unique, ignoring case, without `|` and without a comma, which ends it in a line,
 *   see {@link nameOf}.
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
 * - `old`: Name of the place as it was, like `TUM Innenstadt`.
 * - `name`: Its name as typed, maybe new, like `TUM Stammgelände`.
 * - `address`: Its address as typed.
 * - `link`: Its link as typed, empty for none.
 */
export type PlaceChanged = {
    old: string;
    name: string;
    address: string;
    link: string;
};

/**
 * Lines a new `Places.md` starts with: the head of its table, the header and the line below it.
 */
const fileHead: string[] = ["| Place | Address | Link |", "|---|---|---|"];

/**
 * Head of the table of a new `Rooms.md`, its header and the line below it.
 */
const roomHead: string[] = ["| Room | Address | Link |", "|---|---|---|"];

/**
 * Beginning of the name of a room, the code of a room of the TUM: digits and a dot, like `0509.EG.980` of
 * `0509.EG.980 (Audimax Werner-von-Siemens-Hörsaal)` or `8120.01.101` of `8120.01.101 (Audimax im Galileo)`.
 */
const roomForm: RegExp = /^\d+\./;

/**
 * A link of a place, a web address without spaces, like `https://nav.tum.de/room/0509.EG.980`.
 */
const linkForm: RegExp = /^https?:\/\/\S+$/;

/**
 * Lines of the table of `Places.md` before its rows: the header and the line below it.
 */
const tableHead: number = 2;

/**
 * The place of a meeting online, its name alone: offered once among my places, never a row of `Places.md`,
 * since every meeting has a link of its own. Where it asks for its meeting, in a skill entry or box, see `meeting`
 * in `categories.ts`, its link is typed per entry and written as the `ALTREP` of its `LOCATION`,
 * see {@link placeLinkOf}, and in place of an address it holds what I need to join, in the order of an address,
 * each part a fact of the meeting: its software, read from the host of its link, in place of the street, then
 * its ID and its passcode, a part left out while empty, like `Online, Teams, ID 123 456 789 012 345`;
 * elsewhere, like a call of `Talk`, it is `Online` alone.
 */
export const onlineName: string = "Online";

/**
 * The ways I meet online, each a row of `Online` in the list of places, with the way grey beside it as a place has
 * its address, like `Online, Teams`, so the list holds one row per way and never a row per link, see
 * `categoriesRead` in `categories.ts`; the entry then writes its meeting after it, like
 * `Online, Teams, ID 123 456 789 012 345`, and the calendar shows `Online (Teams)`.
 */
export const onlineWays: string[] = ["Teams", "Zoom", "BBB", "TUM-Live"];


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
 * Cleans the name of a place, its label, which never holds a comma, since an entry writes its place as one line
 * whose first comma ends the label: as a cell, see {@link cellOf}, each comma dropped, leaving a space,
 * as for a name of a room from NavigaTUM, `0509.EG.980 (Audimax, Werner-von-Siemens-Hörsaal)` becoming
 * `0509.EG.980 (Audimax Werner-von-Siemens-Hörsaal)`, and for a name typed with a comma.
 *
 * @param text - Name as typed or read, like `0509.EG.980 (Audimax, Werner-von-Siemens-Hörsaal)`
 * @returns Name without comma, like `0509.EG.980 (Audimax Werner-von-Siemens-Hörsaal)`
 */
function nameOf(text: string): string {
    return cellOf(text.replace(/,/g, " "));
}

/**
 * Writes a place as an entry writes it, its name and its address in one line, as Google Calendar does.
 *
 * @param place - A place of `Places.md`
 * @returns Line like `TUM Innenstadt, Arcisstraße 21, 80333 München, Deutschland`, the name alone without address
 */
export function lineOf(place: Place): string {
    return place.address === "" ? place.name : `${place.name}, ${place.address}`;
}

/**
 * Gives the name of the place of a line, the part before its first comma.
 *
 * @param line - Place as an entry writes it, like `TUM Innenstadt, Arcisstraße 21, 80333 München, Deutschland`,
 *   or only its name, like `Home Munich`
 * @returns Name like `TUM Innenstadt`
 */
export function labelOf(line: string): string {
    return line.split(",")[0].trim();
}

/**
 * Gives the link to write with a place as the `ALTREP` of `LOCATION`: for `Online` the link of the meeting
 * typed in the dialog, see {@link onlineName}; else, and from a sender that knows no typed link, like the calendar
 * after a drag, the link it had in the entry or box it comes from, like the box a log entry is logged from
 * or the entry being changed, while it is that same place, else the link of my place or the room of that line
 * in `Places.md` or `Rooms.md`, else none.
 * - `link`: The link typed, without spaces at its ends.
 * - `mine`: My place or the room of the line, `undefined` for none.
 *
 * @param line - Place as an entry writes it, like `TUM Innenstadt, Arcisstraße 21, 80333 München, Deutschland`
 * @param typed - Link typed for `Online`, like `https://teams.microsoft.com/meet/123456789012345?p=…`,
 *   empty for none; `undefined` from a sender that knows none
 * @param from - The entry or box it comes from, `null` for none
 * @returns Link like `https://nav.tum.de/room/0509.EG.980`, empty for none
 * @throws {Error} - When the link typed for `Online` is no web address
 */
export function placeLinkOf(line: string, typed: string | undefined,
                            from: { location: string; locationLink: string } | null): string {
    if (typed !== undefined && labelOf(line) === onlineName) {
        const link: string = typed.trim();
        if (link !== "" && !linkForm.test(link))
            throw new Error(`No link of ${onlineName}: ${link}`);
        return link;
    }
    if (from !== null && from.location === line)
        return from.locationLink;
    const mine: Place | undefined = [...placesRead(), ...roomsRead()]
        .find((place: Place): boolean => lineOf(place) === line);
    return mine?.link ?? "";
}

/**
 * Reads the rows of the table of `Places.md` or `Rooms.md`: its lines starting with `|`, after the head of the table.
 * A row without a name stays out, a row without link has none.
 * - `cells`: Cells of a row, without the empty texts before its first `|` and after its last.
 *
 * @param file - Path of the file, like that of `Rooms.md`
 * @returns Places in the order of the table, none while the file does not exist
 */
function tableRead(file: string): Place[] {
    if (!existsSync(file))
        return [];

    return readFileSync(file, "utf8").split("\n")
        .filter((line: string): boolean => line.startsWith("|"))
        .slice(tableHead)
        .map((line: string): string[] => line.split("|").slice(1, -1).map((cell: string): string => cell.trim()))
        .filter((cells: string[]): boolean => (cells[0] ?? "") !== "")
        .map((cells: string[]): Place => ({ name: nameOf(cells[0]), address: cells[1] ?? "", link: cells[2] ?? "" }));
}

/**
 * Reads my places, the rows of `Places.md`, see {@link tableRead}.
 *
 * @returns Places in the order of the table, none while `Places.md` does not exist
 */
export function placesRead(): Place[] {
    return tableRead(day.places);
}

/**
 * Reads the rooms of the university, the rows of `Rooms.md`, see {@link tableRead}, like
 * `0509.EG.980 (Audimax Werner-von-Siemens-Hörsaal)` with its address and its link to NavigaTUM.
 *
 * @returns Rooms in the order of the table, none while `Rooms.md` does not exist
 */
export function roomsRead(): Place[] {
    return tableRead(day.rooms);
}

/**
 * Cleans a place as the page sends it, see {@link cellOf}, a comma in its name dropped, see {@link nameOf},
 * and checks it against my other places, the rooms and `Online`, see {@link onlineName}: its name is needed,
 * its address and its link may stay empty, and an address needs no number of a house,
 * like `Burg-Eltz-Weg, 81375 München, Deutschland`.
 * - `clean`: The place cleaned.
 *
 * @param sent - Place as the page sends it, its name, its address and its link as typed
 * @param others - My other places and the rooms, whose names it may not have
 * @returns The place cleaned
 * @throws {Error} - When the name is empty, another place or `Online` has the name, ignoring case,
 *   or the link is no web address
 */
function placeCleanOf(sent: Place, others: Place[]): Place {
    const clean: Place = {
        name: nameOf(String(sent.name ?? "")), address: cellOf(String(sent.address ?? "")),
        link: cellOf(String(sent.link ?? "")),
    };
    if (clean.name === "" || clean.name.toLowerCase() === onlineName.toLowerCase()
        || others.some((mine: Place): boolean => mine.name.toLowerCase() === clean.name.toLowerCase()))
        throw new Error(`No new name of a place: ${clean.name}`);
    if (clean.link !== "" && !linkForm.test(clean.link))
        throw new Error(`No link of ${clean.name}: ${clean.link}`);
    return clean;
}

/**
 * Reads the lines of `Places.md` or `Rooms.md` to write a place into, a head of only two columns given the column
 * `Link`; those of a new file, the head of its table, see {@link fileHead} and {@link roomHead}, when it does not
 * exist yet.
 * - `lines`: Lines of the file.
 * - `first`, `last`: Index of the first line of its table, its header, and of its last.
 *
 * @param file - Path of the file, like that of `Places.md`
 * @returns Lines of the file
 * @throws {Error} - When the file lies outside the new system or holds no table
 */
function placeLinesRead(file: string): string[] {
    if (!writeAllowed(file))
        throw new Error(`No writing outside the new system: ${file}`);
    const lines: string[] = existsSync(file) ? readFileSync(file, "utf8").split("\n")
        : [...(file === day.rooms ? roomHead : fileHead), ""];
    const first: number = lines.findIndex((line: string): boolean => line.startsWith("|"));
    const last: number = lines.findLastIndex((line: string): boolean => line.startsWith("|"));
    if (first === -1 || last === first)
        throw new Error(`No table in ${file}`);
    if (lines[first].split("|").length - 2 < 3) {
        lines[first] = `${lines[first].trimEnd()} Link |`;
        lines[first + 1] = `${lines[first + 1].trimEnd()}---|`;
    }
    return lines;
}

/**
 * Writes a place as a row of the table of `Places.md` or `Rooms.md`.
 *
 * @param place - Place cleaned
 * @returns Row like `| TUM Innenstadt | Arcisstraße 21, 80333 München, Deutschland | https://nav.tum.de |`
 */
function rowOf(place: Place): string {
    return `| ${place.name} | ${place.address} | ${place.link} |`;
}

/**
 * Adds a place as the last row of the table of `Rooms.md` when its name starts like the code of a room,
 * see {@link roomForm}, like `5602.EG.001 (Hörsaal 1)`, else of `Places.md`, with its link or an empty cell,
 * every other line staying as it is, see {@link placeLinesRead}; creates the file when it does not exist yet.
 * - `added`: The place as written, cleaned, see {@link placeCleanOf}.
 * - `file`: `Rooms.md` or `Places.md`.
 * - `lines`: Lines of the file.
 * - `last`: Index of the last line of its table.
 *
 * @param sent - Place as the page sends it, its name, its address and its link as typed
 * @returns The place as written
 * @throws {Error} - When the name is empty, another place, a room or `Online` has the name, ignoring case,
 *   the link is no web address, or the file lies outside the new system or holds no table
 */
export function placeAdd(sent: Place): Place {
    const added: Place = placeCleanOf(sent, [...placesRead(), ...roomsRead()]);
    const file: string = roomForm.test(added.name) ? day.rooms : day.places;
    const lines: string[] = placeLinesRead(file);
    const last: number = lines.findLastIndex((line: string): boolean => line.startsWith("|"));
    lines.splice(last + 1, 0, rowOf(added));
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, lines.join("\n"));
    return added;
}

/**
 * Changes my place of a name in `Places.md`, or a room in `Rooms.md`, its name, its address and its link, in its own
 * row, every other line staying as it is, see {@link placeLinesRead}, and nothing else: every entry written before
 * keeps the line and the link it had, since each writes its place itself.
 * - `old`: The old name in small letters, as names compare, ignoring case.
 * - `file`: `Places.md`, or `Rooms.md` for a room.
 * - `changed`: The place as written, cleaned, see {@link placeCleanOf}.
 * - `lines`: Lines of the file.
 * - `first`: Index of the first line of its table, its header.
 * - `row`: Index of the row of the place, -1 for none.
 *
 * @param sent - The place as the page sends it, its old name and its name, address and link as typed
 * @returns The place as written
 * @throws {Error} - When no place has the old name, the name is empty, another place, a room or `Online` has
 *   the name, ignoring case, the link is no web address, or the file lies outside the new system
 */
export function placeChange(sent: PlaceChanged): Place {
    const old: string = nameOf(String(sent.old ?? "")).toLowerCase();
    const file: string = roomsRead().some((room: Place): boolean => room.name.toLowerCase() === old)
        ? day.rooms : day.places;
    const changed: Place = placeCleanOf(sent, [...placesRead(), ...roomsRead()].filter((mine: Place): boolean =>
        mine.name.toLowerCase() !== old));
    const lines: string[] = placeLinesRead(file);
    const first: number = lines.findIndex((line: string): boolean => line.startsWith("|"));
    const row: number = lines.findIndex((line: string, index: number): boolean => index >= first + tableHead
        && line.startsWith("|") && nameOf(line.split("|")[1] ?? "").toLowerCase() === old);
    if (old === "" || row === -1)
        throw new Error(`No place of the name: ${sent.old}`);
    lines[row] = rowOf(changed);
    writeFileSync(file, lines.join("\n"));
    return changed;
}
