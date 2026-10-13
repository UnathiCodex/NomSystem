/**
 * ## Places
 *
 * A new place for a field of a place, the place of an entry or where a way starts, see `categories.ts`,
 * since the fields offer only my places of `Places.md`, each with its address, see `reader/places.ts`:
 * a place typed that is none of mine yet, then `+` or Enter, opens a small dialog over the entry by category
 * with two fields, the place, filled with what I typed, and its address, both required.
 * Save adds the place to `Places.md` and picks it; Cancel, `Esc` or a click beside the dialog pick nothing.
 *
 * - `../icons.ts`: Puts the icons into the buttons of the dialog.
 * - `lucide`: The icons check and cross.
 */

import { iconPut } from "../icons.ts";
import { Check, X } from "lucide";


/**
 * A place, as the reader writes it into `Places.md`.
 *
 * - `name`: Name, like `TumMain`, written as the `LOCATION` of an entry.
 * - `address`: Its address, like `Arcisstraße 21, 80333 München`.
 */
type Place = {
    name: string;
    address: string;
};

/**
 * Takes the name of the place the open dialog saved, or `null` when it closed without saving, so the picker
 * that opened it picks the place or nothing; `null` while no dialog waits for an answer.
 */
let answer: ((name: string | null) => void) | null = null;


/**
 * Sends a new place to the reader, which adds it to `Places.md`.
 *
 * @param place - Name and address as typed
 * @returns The place as written, its name and address cleaned
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
 * Sends the place of the fields, then closes the dialog and gives the name as written to the picker that opened it;
 * shows a hint and stays open when the reader does not take it.
 * - `take`: Takes the name, kept apart before the dialog closes, so its closing answers nothing more.
 */
function placeSave(): void {
    placeSend({
        name: (document.getElementById("place-name") as HTMLInputElement).value,
        address: (document.getElementById("place-address") as HTMLInputElement).value,
    }).then((place: Place): void => {
        const take: ((name: string | null) => void) | null = answer;
        answer = null;
        (document.getElementById("place") as HTMLDialogElement).close();
        take?.(place.name);
    }).catch((error: unknown): void => {
        console.error(error);
        document.getElementById("place-error")?.removeAttribute("hidden");
    });
}

/**
 * Opens the dialog of a new place over the entry by category: the place filled with the typed text,
 * like `HomeMunich`, the address empty and focused, since the place is typed already.
 * - {@link HTMLDialogElement#showModal}: Shows the dialog over the page and the entry by category, `Esc` closes it.
 *
 * @param name - Typed name of the place, like `HomeMunich`
 * @returns The name of the place as written once it is saved, `null` when the dialog closes without saving
 */
export function placeOpen(name: string): Promise<string | null> {
    (document.getElementById("place-name") as HTMLInputElement).value = name;
    (document.getElementById("place-address") as HTMLInputElement).value = "";
    document.getElementById("place-error")?.setAttribute("hidden", "");
    (document.getElementById("place") as HTMLDialogElement).showModal();
    document.getElementById("place-address")?.focus();
    return new Promise((resolve: (name: string | null) => void): void => {
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
