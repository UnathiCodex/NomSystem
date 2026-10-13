/**
 * ## Places
 *
 * A new place for a field of a place, the place of an entry or where a way starts, see `categories.ts`,
 * since the fields offer only my places of `Places.md`, each with its address, see `reader/places.ts`:
 * a place typed that is none of mine yet, then `+` or Enter, opens a small dialog over the entry by category
 * with three fields, the place, filled with what I typed, and its address with its country, both required,
 * and its link, like `https://nav.tum.de/room/0509.EG.980`, which may stay empty.
 * Save adds the place to `Places.md` and picks it; Cancel, `Esc` or a click beside the dialog pick nothing.
 * An entry writes a place as one line, its name and its address, like
 * `TumMain, Arcisstraße 21, 80333 München, Deutschland`, see {@link lineOf}; it shows by its name, the part
 * before the first comma, see {@link labelOf}, and the dialog shows the whole line, which opens the link
 * of the place, written with it as its `ALTREP`, or else Google Maps, see {@link mapsAddressOf}.
 *
 * - `../icons.ts`: Puts the icons into the buttons of the dialog.
 * - `lucide`: The icons check and cross.
 */

import { iconPut } from "../icons.ts";
import { Check, X } from "lucide";


/**
 * A place, as the reader writes it into `Places.md`.
 *
 * - `name`: Name, like `TumMain`, without a comma.
 * - `address`: Its address with its country, like `Arcisstraße 21, 80333 München, Deutschland`.
 * - `link`: Its link, like `https://nav.tum.de/room/0509.EG.980`, empty for none.
 */
export type Place = {
    name: string;
    address: string;
    link: string;
};

/**
 * Takes the place the open dialog saved, or `null` when it closed without saving, so the picker that opened it
 * picks the place or nothing; `null` while no dialog waits for an answer.
 */
let answer: ((place: Place | null) => void) | null = null;


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
 * Gives the address in Google Maps of a place as an entry writes it: a search of the whole line,
 * or, when its address is a link, like one pasted from Google Maps, that link.
 * - `address`: The line after its name.
 *
 * @param line - Place like `TumMain, Arcisstraße 21, 80333 München, Deutschland`
 * @returns Address like `https://www.google.com/maps/search/?api=1&query=TumMain%2C%20Arcisstra%C3%9Fe%2021…`
 */
export function mapsAddressOf(line: string): string {
    const address: string = line.slice(line.indexOf(",") + 1).trim();
    return /^https?:\/\/\S+$/.test(address) ? address
        : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(line)}`;
}


/**
 * Sends a new place to the reader, which adds it to `Places.md`.
 *
 * @param place - Name, address and link as typed
 * @returns The place as written, its name, address and link cleaned
 * @throws {Error} - When the reader does not take it, like for a name another place has
 */
async function placeSend(place: Place): Promise<Place> {
    const response: Response = await fetch("/api/day/places", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(place),
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
 * like `HomeMunich`, the address empty and focused, since the place is typed already, the link empty.
 * - {@link HTMLDialogElement#showModal}: Shows the dialog over the page and the entry by category, `Esc` closes it.
 *
 * @param name - Typed name of the place, like `HomeMunich`
 * @returns The place as written once it is saved, `null` when the dialog closes without saving
 */
export function placeOpen(name: string): Promise<Place | null> {
    (document.getElementById("place-name") as HTMLInputElement).value = name;
    (document.getElementById("place-address") as HTMLInputElement).value = "";
    (document.getElementById("place-link") as HTMLInputElement).value = "";
    document.getElementById("place-error")?.setAttribute("hidden", "");
    (document.getElementById("place") as HTMLDialogElement).showModal();
    document.getElementById("place-address")?.focus();
    return new Promise((resolve: (place: Place | null) => void): void => {
        answer = resolve;
    });
}

/**
 * Starts the dialog of a new place after the router has put its HTML into the page: the cross closes it,
 * `Enter` and the check save the place, and every closing without saving answers `null`, so nothing is picked.
 * - `close`: Comes when the dialog closes, by the cross, by `Esc` or by a click beside it.
 */
export function placesStart(): void {
    const dialog: HTMLDialogElement = document.getElementById("place") as HTMLDialogElement;
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
