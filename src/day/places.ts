/**
 * ## Places
 *
 * The parts of a place, which I type below it in the entry by category, see `minePartsOf` in `categories.ts`,
 * since the fields offer only my places of `Places.md`, each with its address, see `reader/places.ts`.
 * The address of a place has four parts, the columns of `Places.md`, as on an envelope in German, umlauts included,
 * see {@link Place}: its street with the number of the house, which may stay out, like `Burg-Eltz-Weg`, its code,
 * like `81375`, its town, like `München`, and its country, like `Deutschland`; then its link, which follows
 * the address as the search of Google Maps, in the form Google gives for it, see {@link mapsLinkOf}, until I type
 * a link myself, like the NavigaTUM page of a room. A place typed that is none of mine yet goes into `Places.md` at once, by its name,
 * and each part I write after it changes its row there, see {@link placeSend}: entries written before keep what
 * they have.
 * An entry writes a place as one line, its name and its address, like
 * `TUM Innenstadt, Arcisstraße 21, 80333, München, Deutschland`, see {@link lineOf}; it shows by its name, the part
 * before the first comma, see {@link labelOf}, and the dialog shows the whole line, which opens the link
 * of the place, written with it as its `ALTREP`, when it has one, and nothing else: nothing opens a map by itself,
 * only a link stored with the place opens on a click.
 * In the list of a field of a place a place shows by its name, its address grey beside it, see {@link placeChoiceOf}.
 * A way shows its route by labels, with an arrow drawn between them, see {@link whereLinkedOf}.
 * A place is only where I physically am: an entry that did something online shows its platform of `Online.md`,
 * like `Zoom`, instead of its place the same way, its name opening the link of its meeting or video,
 * see {@link whereLinkedOf}, its place still in the dialog;
 * a platform typed that is none of mine yet goes into `Online.md` at once, see {@link platformSend}.
 *
 * - `lucide`: The arrow of a route.
 * - `../icons.ts`: Makes the element of an icon.
 * - `../reader.ts`: Asks the reader.
 * - `./choices.ts`: The type of a choice of a list, for the type checker only.
 */

import { ArrowRight } from "lucide";
import { iconOf } from "../icons.ts";
import { readerAsk } from "../reader.ts";

import type { Choice } from "./choices.ts";


/**
 * A place, one row of `Places.md` or `Rooms.md`, as the reader writes it.
 *
 * - `name`: Name, like `TUM Innenstadt`, without a comma, which the reader drops, see `nameOf` in `reader/places.ts`.
 * - `street`: Its street with the number of the house, which may stay out, like `Arcisstraße 21`.
 * - `code`: Its code, the postcode, like `80333`.
 * - `city`: Its town, like `München`.
 * - `country`: Its country, like `Deutschland`.
 * - `link`: Its link, like `https://nav.tum.de/room/0509.EG.980`.
 *
 * Each empty for none.
 */
export type Place = {
    name: string;
    street: string;
    code: string;
    city: string;
    country: string;
    link: string;
};

/**
 * A platform of what I do online, one row of `Online.md`, as the reader writes it, see `Platform`
 * in `reader/places.ts`.
 *
 * - `name`: Name, like `Zoom`.
 * - `provider`: Who offers it, like `Zoom Video Communications`, empty for none.
 * - `link`: The link of its web app, like `https://zoom.us`, empty for none.
 */
export type Platform = {
    name: string;
    provider: string;
    link: string;
};


/**
 * Writes the address of a place in one line: its street, its code, its town and its country, parted
 * by commas, a part left out while empty.
 *
 * @param place - A place of `Places.md`
 * @returns Address like `Arcisstraße 21, 80333, München, Deutschland`, empty for none
 */
export function placeAddressOf(place: Place): string {
    return [place.street, place.code, place.city, place.country]
        .filter((part: string): boolean => part !== "").join(", ");
}

/**
 * Writes a place as an entry writes it into `LOCATION`, as Google Calendar does, its name and its address in one line,
 * see {@link placeAddressOf}.
 *
 * @param place - A place of `Places.md`
 * @returns Line like `TUM Innenstadt, Arcisstraße 21, 80333, München, Deutschland`, the name alone without address
 */
export function lineOf(place: Place): string {
    return placeAddressOf(place) === "" ? place.name : `${place.name}, ${placeAddressOf(place)}`;
}

/**
 * Gives the name of the place of a line, the part before its first comma, as the grid and the plan show it.
 *
 * @param line - Place as an entry writes it, like `TUM Innenstadt, Arcisstraße 21, 80333, München, Deutschland`,
 *   or an older one, only its name, like `Home Munich`
 * @returns Name like `TUM Innenstadt`
 */
export function labelOf(line: string): string {
    return line.split(",")[0].trim();
}

/**
 * Gives the address of a place as an entry writes it, the part after its name.
 *
 * @param line - Place like `TUM Innenstadt, Arcisstraße 21, 80333, München, Deutschland`, or only its name,
 *   like `Home Munich`
 * @returns Address like `Arcisstraße 21, 80333, München, Deutschland`, empty for none
 */
export function addressOf(line: string): string {
    return line.includes(",") ? line.slice(line.indexOf(",") + 1).trim() : "";
}

/**
 * Makes the choice of a place in the list of a field of a place, in the dialog and in the form of a series,
 * see `../editor/course.ts`: by its name, see {@link labelOf}, its address grey beside it.
 *
 * @param line - Place as an entry writes it, like `TUM Innenstadt, Arcisstraße 21, 80333, München, Deutschland`
 * @returns Choice, like one showing `TUM Innenstadt`
 */
export function placeChoiceOf(line: string): Choice {
    return { value: line, text: labelOf(line), group: "", detail: addressOf(line) };
}

/**
 * Category of ways, whose place shows as the route, see {@link whereOf}.
 */
export const wayName: string = "Way";

/**
 * Writes where an entry or a box was, by labels alone, see {@link labelOf}, as text, which tells whether it has
 * a place at all: the route of a way, from where it starts, its `X-FROM`, to its goal, its `LOCATION`,
 * like `Home Munich -> TUM Garching`, a missing end left out beside its arrow, like `-> TUM Garching`; the place
 * of any other entry, like `Home Munich`; for an entry that did something online its platform instead, like `Zoom`,
 * its place still in the dialog. The page shows it with the arrow drawn, see {@link whereLinkedOf}.
 * - `start`: Label of where a way starts, empty for none.
 * - `goal`: Label of the place or the goal, empty for none.
 *
 * @param category - Category of the entry, like `Way`
 * @param from - Where a way starts, like `Home Munich, Burgweg 1, 81375, München, Deutschland`, empty for none
 * @param location - Place or goal, like `TUM Garching, Boltzmannstraße 3, 85748, Garching, Deutschland`
 * @param online - Its platform online, like `Zoom`, empty for none
 * @returns Where it was, like `Home Munich -> TUM Garching`, empty for no place at all and nothing online
 */
export function whereOf(category: string, from: string, location: string, online: string): string {
    const start: string = labelOf(from);
    const goal: string = labelOf(location);
    if (online !== "")
        return online;
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
 * so it stands in the middle of the line, with a little room on both sides, see `.route-arrow` in `log.css`.
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
 * see {@link placeAnchorOf}; of a way its goal, which its `LOCATION` names, like `TUM Garching`; for an entry that did
 * something online its platform instead, the same way, a link to its meeting or video when it has one, like `Zoom`.
 * A place or a platform without link is plain text, never the link itself.
 * - `start`: Label of where a way starts, like `Home Munich`, empty for none.
 * - `goal`: Label of the place or the goal, like `TUM Garching`, empty for none.
 * - `place`: The place or the goal as shown, a link or plain text, none for none.
 *
 * @param category - Category of the entry, like `Way`
 * @param from - Where a way starts, like `Home Munich, Burgweg 1, 81375, München, Deutschland`, empty for none
 * @param location - Place or goal, like `TUM Garching, Boltzmannstraße 3, 85748, Garching, Deutschland`
 * @param link - Link of the place or the goal, its `ALTREP`, empty for none
 * @param online - Its platform online, like `Zoom`, empty for none
 * @param onlineLink - The link of its meeting or video, empty for none
 * @returns Where it was, its place, goal or platform a link, none for no place at all and nothing online
 */
export function whereLinkedOf(category: string, from: string, location: string, link: string, online: string,
                              onlineLink: string): (string | Node)[] {
    if (online !== "")
        return [onlineLink === "" ? online : placeAnchorOf(online, onlineLink)];
    const start: string = labelOf(from);
    const goal: string = labelOf(location);
    const place: (string | Node)[] = goal === "" ? [] : [link === "" ? goal : placeAnchorOf(goal, link)];
    if (category !== wayName || (start === "" && goal === ""))
        return place;
    return [start, routeArrowOf(), ...place];
}

/**
 * Gives the link of the search of an address in Google Maps, in the form Google gives for a link to it,
 * the address encoded for an address of the web, like
 * `https://www.google.com/maps/search/?api=1&query=Burg-Eltz-Weg%2C%2081375%20M%C3%BCnchen%2C%20Deutschland`
 * of `Burg-Eltz-Weg, 81375, München, Deutschland`.
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
 * an earlier one wrote it, its spaces as `+` and its code and town in one part, without a comma between them,
 * so the link of my place follows its address while it is that search.
 * - `plain`: Gives a link decoded, its `+` and commas as spaces, spaces in a row one, as written when it cannot
 *   be decoded, like a link with a `%` of its own, like `https://example.com/100%`.
 *
 * @param link - Link of a place, like `https://www.google.com/maps/search/?api=1&query=Burg-Eltz-Weg%2C+81375+…`
 * @param address - Address of the place, like `Burg-Eltz-Weg, 81375, München, Deutschland`
 * @returns Whether it is the search of the address
 */
export function mapsLinkIs(link: string, address: string): boolean {
    const plain: (text: string) => string = (text: string): string => {
        try {
            return decodeURIComponent(text.replace(/\+/g, " ")).replace(/[,\s]+/g, " ");
        } catch {
            return text;
        }
    };
    return plain(link) === plain(mapsLinkOf(address));
}

/**
 * Sends a place to the reader: a new one, which it adds to `Places.md`, a room to `Rooms.md`, or my place with its
 * name as it was, whose row it changes, keeping its name.
 *
 * @param place - Name, the parts of its address and link as typed
 * @param old - Name of my place being changed, like `TUM Innenstadt`, empty for a new one
 * @returns The place as written, its name, the parts of its address and link cleaned
 * @throws {Error} - When the reader does not take it, like for a name another place has or a link that is none
 */
export async function placeSend(place: Place, old: string): Promise<Place> {
    return readerAsk<Place>("/api/day/places", {
        method: old === "" ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(old === "" ? place : { ...place, old: old }),
    });
}

/**
 * Sends a platform to the reader: one typed in `Online` that is none of mine yet, which it adds to `Online.md`,
 * or my platform with its name as it was, whose row it changes, its name and who offers it as typed.
 *
 * @param platform - Its name, like `Webex`, and its provider as typed
 * @param old - Name of my platform being changed, like `Teams`, empty for a new one
 * @returns The platform as written, its name and provider cleaned
 * @throws {Error} - When the reader does not take it, like for a name another platform has
 */
export async function platformSend(platform: Platform, old: string): Promise<Platform> {
    return readerAsk<Platform>("/api/day/online", {
        method: old === "" ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(old === "" ? platform : { ...platform, old: old }),
    });
}
