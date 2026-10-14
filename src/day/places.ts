/**
 * ## Places
 *
 * The parts of a place, which I type below it in the entry by category, see `minePartsOf` and `onlinePartsOf`
 * in `categories.ts`, since the fields offer only my places of `Places.md`, each with its address,
 * see `reader/places.ts`, and `Online`.
 * The address of a place has three parts, as on an envelope in German, umlauts included, see {@link addressPartsOf}:
 * its street with the number of the house, which may stay out, like `Burg-Eltz-Weg`, its postcode with its town,
 * like `81375 München`, and its country, like `Deutschland`; then its link, which follows the address as the search
 * of Google Maps, in the form Google gives for it, see {@link mapsLinkOf}, until I type a link myself, like
 * the NavigaTUM page of a room. A place typed that is none of mine yet goes into `Places.md` at once, by its name,
 * and each part I write after it changes its row there, see {@link placeSend}: entries written before keep what
 * they have.
 * An entry writes a place as one line, its name and its address, like
 * `TUM Innenstadt, Arcisstraße 21, 80333 München, Deutschland`, see {@link lineOf}; it shows by its name, the part
 * before the first comma, see {@link labelOf}, and the dialog shows the whole line, which opens the link
 * of the place, written with it as its `ALTREP`, when it has one, and nothing else: nothing opens a map by itself,
 * only a link stored with the place opens on a click.
 * A way shows its route by labels, with an arrow drawn between them, see {@link whereLinkedOf}.
 * A meeting online has its own place, `Online`, see {@link onlineName}, one generic place, whose parts I type
 * per entry in place of an address, the same three: its software, like `Teams`, who offers it, like `Microsoft`,
 * and its passcode, which a meeting may have, see {@link Online}; then its link, which follows its software as the
 * address of its web app, see {@link standardLinkOf}, until I paste the link of the meeting; it shows by its name
 * with its software in brackets, like `Online (Teams)`, see {@link shownOf}.
 *
 * - `lucide`: The arrow of a route.
 * - `../icons.ts`: Makes the element of an icon.
 */

import { ArrowRight } from "lucide";
import { iconOf } from "../icons.ts";


/**
 * A place, as the reader writes it into `Places.md`.
 *
 * - `name`: Name, like `TUM Innenstadt`, without a comma, which the reader drops, see `nameOf` in `reader/places.ts`.
 * - `address`: Its address with its country, like `Arcisstraße 21, 80333 München, Deutschland`.
 * - `link`: Its link, like `https://nav.tum.de/room/0509.EG.980`, empty for none.
 */
export type Place = {
    name: string;
    address: string;
    link: string;
};

/**
 * What `Online` holds in place of an address, see {@link onlineLineOf}, its three parts as I type them.
 *
 * - `software`: Its software, like `Teams`, in place of the street; empty for none.
 * - `provider`: Who offers it, like `Microsoft`, in place of the town; empty for none.
 * - `passcode`: The passcode of its meeting, like `Ab12Cd34`, in place of the country; empty for none, since many
 *   meetings have none.
 */
export type Online = {
    software: string;
    provider: string;
    passcode: string;
};

/**
 * The place of a meeting online, its name alone, offered once among my places and never a row of `Places.md`,
 * see `onlineName` in `reader/places.ts`: picked, I type its parts and paste its link per entry, see {@link Online}.
 */
export const onlineName: string = "Online";

/**
 * Address of the web app of a software of meetings, which the link of `Online` follows until I paste the link
 * of the meeting, see {@link standardLinkOf}: Teams, Zoom and TUM-Live, where I watch lectures.
 */
const standardLinks: { [software: string]: string } = {
    "Teams": "https://teams.microsoft.com",
    "Zoom": "https://zoom.us",
    "TUM-Live": "https://live.rbg.tum.de",
};

/**
 * Name the passcode of a meeting goes by in the line of `Online`, before its value, like `Passcode Ab12Cd34`,
 * so it never reads as a part of the address, see {@link onlineLineOf}.
 */
const passcodeName: string = "Passcode";


/**
 * Writes a place as an entry writes it into `LOCATION`, as Google Calendar does, its name and its address in one line.
 *
 * @param place - A place of `Places.md`
 * @returns Line like `TUM Innenstadt, Arcisstraße 21, 80333 München, Deutschland`
 */
export function lineOf(place: Place): string {
    return place.address === "" ? place.name : `${place.name}, ${place.address}`;
}

/**
 * Gives the name of the place of a line, the part before its first comma, as the grid and the plan show it.
 *
 * @param line - Place as an entry writes it, like `TUM Innenstadt, Arcisstraße 21, 80333 München, Deutschland`,
 *   or an older one, only its name, like `Home Munich`
 * @returns Name like `TUM Innenstadt`
 */
export function labelOf(line: string): string {
    return line.split(",")[0].trim();
}

/**
 * Gives a place as the grid and the plan show it: its name, see {@link labelOf}, and for `Online` its software
 * in brackets after it, read from its line, see {@link onlineOf}, like `Online (Teams)` of
 * `Online, Teams, Microsoft, Passcode Ab12Cd34`, as a type stands after its skill; `Online` without software alone.
 * - `label`: Its name.
 * - `way`: The software of `Online`, empty for none.
 *
 * @param line - Place as an entry writes it
 * @returns Place as shown, like `Online (Teams)` or `Home Munich`
 */
export function shownOf(line: string): string {
    const label: string = labelOf(line);
    const way: string = label === onlineName ? onlineOf(line).software : "";
    return way === "" ? label : `${label} (${way})`;
}

/**
 * Category of ways, whose place shows as the route, see {@link whereOf}.
 */
export const wayName: string = "Way";

/**
 * Writes where an entry or a box was, by labels alone, see {@link labelOf}, as text, which tells whether it has
 * a place at all: the route of a way, from where it starts, its `X-FROM`, to its goal, its `LOCATION`,
 * like `Home Munich -> TUM Garching`, a missing end left out beside its arrow, like `-> TUM Garching`; the place
 * of any other entry, like `Home Munich`. The page shows it with the arrow drawn, see {@link whereLinkedOf}.
 * - `start`: Label of where a way starts, empty for none.
 * - `goal`: Label of the place or the goal, empty for none.
 *
 * @param category - Category of the entry, like `Way`
 * @param from - Where a way starts, like `Home Munich, Burgweg 1, 81375 München, Deutschland`, empty for none
 * @param location - Place or goal, like `TUM Garching, Boltzmannstraße 3, 85748 Garching, Deutschland`
 * @returns Where it was, like `Home Munich -> TUM Garching`, empty for no place at all
 */
export function whereOf(category: string, from: string, location: string): string {
    const start: string = labelOf(from);
    const goal: string = shownOf(location);
    if (category !== wayName || (start === "" && goal === ""))
        return goal;
    return `${start} -> ${goal}`.trim();
}

/**
 * Makes the link of a place, its `ALTREP`, which opens in a new tab, like `8120.01.101 (Audimax im Galileo)` opening
 * `https://nav.tum.de/room/8120.01.101`. A click on it opens only the link, never the entry or the box it stands in,
 * so it does not reach their own click.
 * - `anchor`: The link.
 *
 * @param label - Label of the place, like `8120.01.101 (Audimax im Galileo)`
 * @param link - Its link, like `https://nav.tum.de/room/8120.01.101`
 * @returns The link
 */
function placeAnchorOf(label: string, link: string): HTMLAnchorElement {
    const anchor: HTMLAnchorElement = document.createElement("a");
    anchor.className = "place-link";
    anchor.href = link;
    anchor.target = "_blank";
    anchor.rel = "noopener";
    anchor.textContent = label;
    anchor.addEventListener("click", (event: MouseEvent): void => event.stopPropagation());
    return anchor;
}

/**
 * Makes the arrow of a route between where a way starts and its goal: drawn as an icon, not a character,
 * so it stands in the middle of the line, with a little room on both sides, see `.route-arrow` in `day.css`.
 * - `arrow`: The icon.
 *
 * @returns The arrow
 */
function routeArrowOf(): SVGElement {
    const arrow: SVGElement = iconOf(ArrowRight);
    arrow.classList.add("route-arrow");
    return arrow;
}

/**
 * Shows where an entry or a box was, as {@link whereOf} writes it, the arrow of a route drawn, see
 * {@link routeArrowOf}, like `Home Munich` → `TUM Garching`, and its place a link when it has one, its `ALTREP`,
 * see {@link placeAnchorOf}; of a way its goal, which its `LOCATION` names, like `TUM Garching`.
 * A place without link is plain text.
 * - `start`: Label of where a way starts, like `Home Munich`, empty for none.
 * - `goal`: Label of the place or the goal, like `TUM Garching`, empty for none.
 * - `place`: The place or the goal as shown, a link or plain text, none for none.
 *
 * @param category - Category of the entry, like `Way`
 * @param from - Where a way starts, like `Home Munich, Burgweg 1, 81375 München, Deutschland`, empty for none
 * @param location - Place or goal, like `TUM Garching, Boltzmannstraße 3, 85748 Garching, Deutschland`
 * @param link - Link of the place or the goal, its `ALTREP`, empty for none
 * @returns Where it was, its place or goal a link, none for no place at all
 */
export function whereLinkedOf(category: string, from: string, location: string, link: string): (string | Node)[] {
    const start: string = labelOf(from);
    const goal: string = shownOf(location);
    const place: (string | Node)[] = goal === "" ? [] : [link === "" ? goal : placeAnchorOf(goal, link)];
    if (category !== wayName || (start === "" && goal === ""))
        return place;
    return [start, routeArrowOf(), ...place];
}

/**
 * Reads the parts of `Online` from its line, see {@link onlineLineOf}: the part after `Passcode` its passcode,
 * the first other part its software, every other part after it who offers it; a part `ID` an earlier line wrote
 * stays out, since the link of a meeting holds its ID.
 * - `parts`: Parts of the line after `Online`, but its ID.
 * - `named`: Tells whether a part is the passcode.
 * - `address`: The other parts.
 *
 * @param line - Place as an entry writes it, like `Online, Teams, Microsoft, Passcode Ab12Cd34`
 * @returns Its software, provider and passcode, each empty for none
 */
export function onlineOf(line: string): Online {
    const parts: string[] = line.split(",").slice(1).map((part: string): string => part.trim())
        .filter((part: string): boolean => !part.startsWith("ID "));
    const named: (part: string) => boolean = (part: string): boolean => part.startsWith(`${passcodeName} `);
    const address: string[] = parts.filter((part: string): boolean => !named(part));
    return {
        software: address[0] ?? "",
        provider: address.slice(1).join(", "),
        passcode: parts.find(named)?.slice(passcodeName.length + 1) ?? "",
    };
}

/**
 * Writes the line of `Online`, as an entry writes it into `LOCATION`: `Online`, its software, who offers it,
 * then its passcode after its name, parted by commas like the parts of an address, a part left out while empty;
 * a comma typed in a part dropped, leaving a space, since a comma ends a part.
 * - `clean`: Cleans a part as typed: a comma dropped, spaces in a row one, none at the ends.
 * - `passcode`: The passcode, cleaned.
 *
 * @param online - Its software, provider and passcode, as typed
 * @returns Line like `Online, Teams, Microsoft, Passcode Ab12Cd34`, or `Online` alone
 */
export function onlineLineOf(online: Online): string {
    const clean: (text: string) => string = (text: string): string => text.replace(/[,\s]+/g, " ").trim();
    const passcode: string = clean(online.passcode);
    return [onlineName, clean(online.software), clean(online.provider),
        passcode === "" ? "" : `${passcodeName} ${passcode}`].filter((part: string): boolean => part !== "").join(", ");
}

/**
 * Gives the address of the web app of a software of meetings, see {@link standardLinks}, as the link of `Online`
 * until I paste the link of the meeting, ignoring case, like `https://teams.microsoft.com` for `teams`.
 *
 * @param software - Software as typed, like `Teams`
 * @returns Its address, empty for a software without one, like `BBB`
 */
export function standardLinkOf(software: string): string {
    return Object.entries(standardLinks).find(([name]: [string, string]): boolean =>
        name.toLowerCase() === software.trim().toLowerCase())?.[1] ?? "";
}

/**
 * Gives the link of the search of an address in Google Maps, in the form Google gives for a link to it,
 * the address encoded for an address of the web, like
 * `https://www.google.com/maps/search/?api=1&query=Burg-Eltz-Weg%2C%2081375%20M%C3%BCnchen%2C%20Deutschland`
 * of `Burg-Eltz-Weg, 81375 München, Deutschland`.
 *
 * @param address - Address as typed
 * @returns The link, empty for an empty address
 */
export function mapsLinkOf(address: string): string {
    return address.trim() === "" ? ""
        : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address.trim())}`;
}

/**
 * Tells whether a link is the search of an address in Google Maps, as {@link mapsLinkOf} makes it or in the form
 * an earlier one wrote it, its spaces as `+`, so the link of my place follows its address while it is that search.
 * - `plain`: Gives a link decoded, its `+` as spaces.
 *
 * @param link - Link of a place, like `https://www.google.com/maps/search/?api=1&query=Burg-Eltz-Weg%2C+81375+…`
 * @param address - Address of the place, like `Burg-Eltz-Weg, 81375 München, Deutschland`
 * @returns Whether it is the search of the address
 */
export function mapsLinkIs(link: string, address: string): boolean {
    const plain: (text: string) => string = (text: string): string => decodeURIComponent(text.replace(/\+/g, " "));
    return plain(link) === plain(mapsLinkOf(address));
}

/**
 * Parts an address into its three parts, as {@link Place} holds them parted by commas: its street, its postcode
 * with its town, and its country, the last two the last two parts, the street all before them, like
 * `Arcisstraße 21`, `80333 München` and `Deutschland`; an address of two parts its street and its postcode
 * with its town, of one its street.
 * - `parts`: Parts of the address, without spaces at their ends.
 *
 * @param address - Address, like `Arcisstraße 21, 80333 München, Deutschland`
 * @returns Street, postcode with town, and country, each empty for none
 */
export function addressPartsOf(address: string): [string, string, string] {
    const parts: string[] = address.split(",").map((part: string): string => part.trim())
        .filter((part: string): boolean => part !== "");
    if (parts.length < 3)
        return [parts[0] ?? "", parts[1] ?? "", ""];
    return [parts.slice(0, -2).join(", "), parts[parts.length - 2], parts[parts.length - 1]];
}

/**
 * Sends a place to the reader: a new one, which it adds to `Places.md`, a room to `Rooms.md`, or my place with its
 * name as it was, whose row it changes, keeping its name.
 *
 * @param place - Name, address and link as typed
 * @param old - Name of my place being changed, like `TUM Innenstadt`, empty for a new one
 * @returns The place as written, its name, address and link cleaned
 * @throws {Error} - When the reader does not take it, like for a name another place has or a link that is none
 */
export async function placeSend(place: Place, old: string): Promise<Place> {
    const response: Response = await fetch("/api/day/places", {
        method: old === "" ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(old === "" ? place : { ...place, old: old }),
    });
    if (!response.ok)
        throw new Error(`Reader answered ${response.status}`);
    return await response.json() as Place;
}
