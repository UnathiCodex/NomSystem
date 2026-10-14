/**
 * ## Places
 *
 * A new place for a field of a place, the place of an entry or where a way starts, see `categories.ts`,
 * since the fields offer only my places of `Places.md`, each with its address, see `reader/places.ts`:
 * a place typed that is none of mine yet, then `+` or Enter, opens a small dialog over the entry by category
 * with three fields, the place, filled with what I typed, its address in German as on an envelope, umlauts included,
 * with its country, like `Burg-Eltz-Weg, 81375 München, Deutschland`, the number of the house optional, and its link,
 * like `https://nav.tum.de/room/0509.EG.980`; address and link may stay empty, each showing its form while empty.
 * As I type the address of a new place, its link follows as the search of the address in Google Maps, in the form
 * Google gives for it, see {@link mapsLinkOf}, which I keep or delete; a link I typed or pasted myself, like the
 * NavigaTUM page of a room, stays as it is.
 * Save adds the place to `Places.md` and picks it; Cancel, `Esc` or a click beside the dialog pick nothing.
 * The pencil below a place picked opens the same dialog filled with my place, see {@link placeEdit}, and Save
 * changes its row in `Places.md`, its name, its address and its link, and nothing else, asking nothing more:
 * entries written before keep what they have.
 * An entry writes a place as one line, its name and its address, like
 * `TumMain, Arcisstraße 21, 80333 München, Deutschland`, see {@link lineOf}; it shows by its name, the part
 * before the first comma, see {@link labelOf}, and the dialog shows the whole line, which opens the link
 * of the place, written with it as its `ALTREP`, when it has one, and nothing else: nothing opens a map by itself,
 * only a link stored with the place opens on a click.
 * A way shows its route by labels, with an arrow drawn between them, see {@link whereLinkedOf}.
 * A meeting online has its own place, `Online`, see {@link onlineName}, which in a skill entry or box holds what
 * I need to join, see {@link Meeting}, and the link I paste per entry; it shows by its name alone, like every place.
 *
 * - `lucide`: The arrow of a route, and the icons of Cancel and Save.
 * - `../icons.ts`: Makes the element of an icon, and shows an icon in a button.
 */

import { ArrowRight, Check, X } from "lucide";
import { iconOf, iconPut } from "../icons.ts";


/**
 * A place, as the reader writes it into `Places.md`.
 *
 * - `name`: Name, like `TumMain`, without a comma, which the reader drops, see `nameOf` in `reader/places.ts`.
 * - `address`: Its address with its country, like `Arcisstraße 21, 80333 München, Deutschland`.
 * - `link`: Its link, like `https://nav.tum.de/room/0509.EG.980`, empty for none.
 */
export type Place = {
    name: string;
    address: string;
    link: string;
};

/**
 * What I need to join a meeting online, the parts of the address of `Online` in the order of an address,
 * each a fact of the meeting, see {@link meetingLineOf}.
 *
 * - `software`: Its software, in place of the street, like `Teams`, read from the host of its link,
 *   see {@link meetingSoftwareOf}, or as an older entry typed it; empty for none.
 * - `id`: Its ID, as its software writes it, like `123 456 789 012 345`, empty for none.
 * - `passcode`: Its passcode, like `Ab12Cd34`, empty for none.
 */
export type Meeting = {
    software: string;
    id: string;
    passcode: string;
};

/**
 * The place of a meeting online, its name alone, offered once among my places and never a row of `Places.md`,
 * see `onlineName` in `reader/places.ts`: in a skill entry or box I paste its link, the link of the meeting,
 * per entry, and in place of an address it holds what I need to join, see {@link Meeting}; elsewhere, like
 * in a call of `Talk`, it is a plain place.
 */
export const onlineName: string = "Online";

/**
 * Software of a meeting by the host of its link, see {@link meetingSoftwareOf}: `teams.microsoft.com` Teams,
 * any host of `zoom.us`, like `tum-conf.zoom.us`, Zoom, a host starting with `bbb.`, like `bbb.tum.de`, BBB,
 * and `live.rbg.tum.de` or `tum.live` TUM-Live, where I watch lectures.
 */
const meetingHosts: { [software: string]: RegExp } = {
    "Teams": /^teams\.microsoft\.com$/,
    "Zoom": /(?:^|\.)zoom\.us$/,
    "BBB": /^bbb\./,
    "TUM-Live": /^(?:live\.rbg\.tum\.de|tum\.live)$/,
};

/**
 * Names the ID and the passcode of a meeting go by in the line of `Online`, each before its value,
 * like `ID 123 456 789 012 345`, see `onlineName` in `reader/places.ts`.
 */
const meetingNames: { id: string; passcode: string } = { id: "ID", passcode: "Passcode" };

/**
 * Takes the place the open dialog saved, or `null` when it closed without saving, so the picker that opened it
 * picks the place or nothing; `null` while no dialog waits for an answer.
 */
let answer: ((place: Place | null) => void) | null = null;

/**
 * Name of my place the open dialog changes, like `TumMain`, empty while it adds a new place.
 */
let editing: string = "";

/**
 * Whether the link of the open dialog follows the address as I type it, see {@link mapsLinkOf}: for a new place
 * until I type in the link myself, never for my place being changed.
 */
let linkFollows: boolean = false;


/**
 * Writes a place as an entry writes it into `LOCATION`, as Google Calendar does, its name and its address in one line.
 *
 * @param place - A place of `Places.md`
 * @returns Line like `TumMain, Arcisstraße 21, 80333 München, Deutschland`
 */
export function lineOf(place: Place): string {
    return place.address === "" ? place.name : `${place.name}, ${place.address}`;
}

/**
 * Gives the name of the place of a line, the part before its first comma, as the grid and the plan show it.
 *
 * @param line - Place as an entry writes it, like `TumMain, Arcisstraße 21, 80333 München, Deutschland`,
 *   or an older one, only its name, like `HomeMunich`
 * @returns Name like `TumMain`
 */
export function labelOf(line: string): string {
    return line.split(",")[0].trim();
}

/**
 * Category of ways, whose place shows as the route, see {@link whereOf}.
 */
export const wayName: string = "Way";

/**
 * Writes where an entry or a box was, by labels alone, see {@link labelOf}, as text, which tells whether it has
 * a place at all: the route of a way, from where it starts, its `X-FROM`, to its goal, its `LOCATION`,
 * like `HomeMunich -> TumGarching`, a missing end left out beside its arrow, like `-> TumGarching`; the place
 * of any other entry, like `HomeMunich`. The page shows it with the arrow drawn, see {@link whereLinkedOf}.
 * - `start`: Label of where a way starts, empty for none.
 * - `goal`: Label of the place or the goal, empty for none.
 *
 * @param category - Category of the entry, like `Way`
 * @param from - Where a way starts, like `HomeMunich, Burgweg 1, 81375 München, Deutschland`, empty for none
 * @param location - Place or goal, like `TumGarching, Boltzmannstraße 3, 85748 Garching, Deutschland`
 * @returns Where it was, like `HomeMunich -> TumGarching`, empty for no place at all
 */
export function whereOf(category: string, from: string, location: string): string {
    const start: string = labelOf(from);
    const goal: string = labelOf(location);
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
 * {@link routeArrowOf}, like `HomeMunich` → `TumGarching`, and its place a link when it has one, its `ALTREP`,
 * see {@link placeAnchorOf}; of a way its goal, which its `LOCATION` names, like `TumGarching`.
 * A place without link is plain text.
 * - `start`: Label of where a way starts, like `HomeMunich`, empty for none.
 * - `goal`: Label of the place or the goal, like `TumGarching`, empty for none.
 * - `place`: The place or the goal as shown, a link or plain text, none for none.
 *
 * @param category - Category of the entry, like `Way`
 * @param from - Where a way starts, like `HomeMunich, Burgweg 1, 81375 München, Deutschland`, empty for none
 * @param location - Place or goal, like `TumGarching, Boltzmannstraße 3, 85748 Garching, Deutschland`
 * @param link - Link of the place or the goal, its `ALTREP`, empty for none
 * @returns Where it was, its place or goal a link, none for no place at all
 */
export function whereLinkedOf(category: string, from: string, location: string, link: string): (string | Node)[] {
    const start: string = labelOf(from);
    const goal: string = labelOf(location);
    const place: (string | Node)[] = goal === "" ? [] : [link === "" ? goal : placeAnchorOf(goal, link)];
    if (category !== wayName || (start === "" && goal === ""))
        return place;
    return [start, routeArrowOf(), ...place];
}

/**
 * Reads what I need to join a meeting online from the line of `Online`, see {@link meetingLineOf}: the part after
 * `ID` its ID, the part after `Passcode` its passcode, the first other part its software.
 * - `parts`: Parts of the address, after `Online`.
 * - `named`: Gives the value of the part of a name, empty for none.
 *
 * @param line - Place as an entry writes it, like `Online, Teams, ID 123 456 789 012 345`
 * @returns Its software, ID and passcode, each empty for none
 */
export function meetingOf(line: string): Meeting {
    const parts: string[] = line.split(",").slice(1).map((part: string): string => part.trim());
    const named: (name: string) => string = (name: string): string =>
        parts.find((part: string): boolean => part.startsWith(`${name} `))?.slice(name.length + 1) ?? "";
    return {
        software: parts.find((part: string): boolean => !Object.values(meetingNames)
            .some((name: string): boolean => part.startsWith(`${name} `))) ?? "",
        id: named(meetingNames.id),
        passcode: named(meetingNames.passcode),
    };
}

/**
 * Writes the line of `Online` for a meeting, as an entry writes it into `LOCATION`: `Online`, its software,
 * then its ID and its passcode, each after its name, parted by commas like the parts of an address, a part left out
 * while empty, a comma typed in a part dropped, leaving a space, since a comma ends a part.
 * - `clean`: Cleans a part as typed: a comma dropped, spaces in a row one, none at the ends.
 * - `id`, `passcode`: ID and passcode, cleaned.
 *
 * @param meeting - Its software, ID and passcode, as typed
 * @returns Line like `Online, Teams, ID 123 456 789 012 345, Passcode Ab12Cd34`, or `Online` alone
 */
export function meetingLineOf(meeting: Meeting): string {
    const clean: (text: string) => string = (text: string): string => text.replace(/[,\s]+/g, " ").trim();
    const id: string = clean(meeting.id);
    const passcode: string = clean(meeting.passcode);
    return [
        onlineName, clean(meeting.software), id === "" ? "" : `${meetingNames.id} ${id}`,
        passcode === "" ? "" : `${meetingNames.passcode} ${passcode}`,
    ].filter((part: string): boolean => part !== "").join(", ");
}

/**
 * Reads the software of a meeting from the host of its link, see {@link meetingHosts}.
 * - `host`: Host of the link in small letters, like `tum-conf.zoom.us`, empty for no web address.
 *
 * @param link - Link of a meeting, like `https://tum-conf.zoom.us/j/12345678901?pwd=…`
 * @returns Software like `Zoom`, empty for a host none of them has
 */
export function meetingSoftwareOf(link: string): string {
    const host: string = /^https?:\/\/([^/?#:]+)/i.exec(link.trim())?.[1].toLowerCase() ?? "";
    return Object.entries(meetingHosts).find(([, form]: [string, RegExp]): boolean => form.test(host))?.[0] ?? "";
}

/**
 * Reads the ID of a meeting from its link, written as its software writes it in an invitation, for the two links
 * I checked, by the software of their host, see {@link meetingSoftwareOf}: Teams, `…/meet/<ID>?p=…`, in groups
 * of three from the left, like `123 456 789 012 345`; Zoom, `…/j/<ID>?pwd=…`, three digits and the rest in two
 * halves, like `123 4567 8901`. No link holds the passcode: `p` and `pwd` are codes of their own, not the passcode
 * of the invitation, and a link of BBB or TUM-Live holds no ID.
 * - `software`: Software of the link.
 * - `teams`, `zoom`: The digits of the ID in a link of Teams or of Zoom, empty for none.
 * - `half`: Where the second half of the digits of Zoom after the first three begins.
 *
 * @param link - Link of a meeting, like `https://teams.microsoft.com/meet/123456789012345?p=…`
 * @returns ID like `123 456 789 012 345`, empty for a link without one
 */
export function meetingIdOf(link: string): string {
    const software: string = meetingSoftwareOf(link);
    const teams: string = software === "Teams" ? /\/meet\/(\d+)/.exec(link)?.[1] ?? "" : "";
    const zoom: string = software === "Zoom" ? /\/j\/(\d{9,})/.exec(link)?.[1] ?? "" : "";
    const half: number = 3 + Math.floor((zoom.length - 3) / 2);
    if (teams !== "")
        return teams.replace(/\d{3}(?=\d)/g, "$& ");
    return zoom === "" ? "" : `${zoom.slice(0, 3)} ${zoom.slice(3, half)} ${zoom.slice(half)}`;
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
function mapsLinkOf(address: string): string {
    return address.trim() === "" ? ""
        : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address.trim())}`;
}


/**
 * Sends a new place to the reader, which adds it to `Places.md`, or my place being changed, with its old name,
 * see {@link editing}, which the reader changes in its row.
 *
 * @param place - Name, address and link as typed
 * @returns The place as written, its name, address and link cleaned
 * @throws {Error} - When the reader does not take it, like for a name another place has
 */
async function placeSend(place: Place): Promise<Place> {
    const response: Response = await fetch("/api/day/places", {
        method: editing === "" ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editing === "" ? place : { ...place, old: editing }),
    });
    if (!response.ok)
        throw new Error(`Reader answered ${response.status}`);
    return await response.json() as Place;
}

/**
 * Sends the place of the fields, then closes the dialog and gives the place as written to the picker that opened it;
 * shows a hint and stays open when the reader does not take it.
 * - `take`: Takes the place, kept apart before the dialog closes, so its closing answers nothing more.
 */
function placeSave(): void {
    placeSend({
        name: (document.getElementById("place-name") as HTMLInputElement).value,
        address: (document.getElementById("place-address") as HTMLInputElement).value,
        link: (document.getElementById("place-link") as HTMLInputElement).value,
    }).then((place: Place): void => {
        const take: ((place: Place | null) => void) | null = answer;
        answer = null;
        (document.getElementById("place") as HTMLDialogElement).close();
        take?.(place);
    }).catch((error: unknown): void => {
        console.error(error);
        document.getElementById("place-error")?.removeAttribute("hidden");
    });
}

/**
 * Opens the dialog of a new place over the entry by category: the place filled with the typed text,
 * like `HomeMunich`, the address empty and focused, since the place is typed already, the link empty, following
 * the address as I type it, see {@link linkFollows};
 * the place focused while nothing is typed, like for `+ New place` of an empty search.
 *
 * @param name - Typed name of the place, like `HomeMunich`
 * @returns The place as written once it is saved, `null` when the dialog closes without saving
 */
export function placeOpen(name: string): Promise<Place | null> {
    editing = "";
    linkFollows = true;
    return placeShow({ name: name, address: "", link: "" }, name === "" ? "place-name" : "place-address");
}

/**
 * Opens the dialog of a place over the entry by category to change my place: its name, its address and its link
 * filled in, the name focused; it asks nothing more, the entries written before keeping what they have.
 *
 * @param place - My place as it is, like `TumMain` with its address and link
 * @returns The place as written once it is saved, `null` when the dialog closes without saving
 */
export function placeEdit(place: Place): Promise<Place | null> {
    editing = place.name;
    linkFollows = false;
    return placeShow(place, "place-name");
}

/**
 * Shows the dialog of a place with its fields filled, focusing one, and waits for its answer.
 * - {@link HTMLDialogElement#showModal}: Shows the dialog over the page and the entry by category, `Esc` closes it.
 *
 * @param place - Name, address and link to fill in
 * @param focused - Identifier of the field to focus, like `place-address`
 * @returns The place as written once it is saved, `null` when the dialog closes without saving
 */
function placeShow(place: Place, focused: string): Promise<Place | null> {
    (document.getElementById("place-name") as HTMLInputElement).value = place.name;
    (document.getElementById("place-address") as HTMLInputElement).value = place.address;
    (document.getElementById("place-link") as HTMLInputElement).value = place.link;
    document.getElementById("place-error")?.setAttribute("hidden", "");
    (document.getElementById("place") as HTMLDialogElement).showModal();
    document.getElementById(focused)?.focus();
    return new Promise((resolve: (place: Place | null) => void): void => {
        answer = resolve;
    });
}

/**
 * Starts the dialog of a new place after the router has put its HTML into the page: `Cancel` closes it,
 * `Enter` and `Save` save the place, and every closing without saving answers `null`, so nothing is picked;
 * the link of a new place follows its address as I type it, until I type in the link myself, see {@link linkFollows}.
 * - `close`: Comes when the dialog closes, by `Cancel`, by `Esc` or by a click beside it.
 * - `input`: Comes as I type in a field.
 */
export function placesStart(): void {
    const dialog: HTMLDialogElement = document.getElementById("place") as HTMLDialogElement;
    const address: HTMLInputElement = document.getElementById("place-address") as HTMLInputElement;
    const link: HTMLInputElement = document.getElementById("place-link") as HTMLInputElement;
    address.addEventListener("input", (): void => {
        if (linkFollows)
            link.value = mapsLinkOf(address.value);
    });
    link.addEventListener("input", (): void => {
        linkFollows = false;
    });
    iconPut(document.getElementById("place-cancel") as HTMLElement, X, "Cancel");
    iconPut(document.getElementById("place-save") as HTMLElement, Check, "Save");
    document.getElementById("place-cancel")?.addEventListener("click", (): void => dialog.close());
    dialog.addEventListener("close", (): void => {
        answer?.(null);
        answer = null;
    });
    document.getElementById("place-form")?.addEventListener("submit", (event: SubmitEvent): void => {
        event.preventDefault();
        placeSave();
    });
}
