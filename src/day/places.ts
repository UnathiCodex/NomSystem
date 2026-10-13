/**
 * ## Places
 *
 * A new place for a field of a place, the place of an entry or where a way starts, see `categories.ts`,
 * since the fields offer only my places of `Places.md`, each with its address, see `reader/places.ts`:
 * a place typed that is none of mine yet, then `+` or Enter, opens a small dialog over the entry by category
 * with three fields, the place, filled with what I typed, its address with its country, like
 * `Burg-Eltz-Weg, 81375 München, Deutschland`, the number of the house optional, and its link, like
 * `https://nav.tum.de/room/0509.EG.980`; address and link may stay empty, each showing its form while empty.
 * Save adds the place to `Places.md` and picks it; Cancel, `Esc` or a click beside the dialog pick nothing.
 * The pencil below a place picked opens the same dialog filled with my place, see {@link placeEdit}, and Save
 * changes its row in `Places.md`, its name, its address and its link; entries written before keep their address
 * after a move, or take the new one when I say the old one was wrong, in one more row of the dialog.
 * An entry writes a place as one line, its name and its address, like
 * `TumMain, Arcisstraße 21, 80333 München, Deutschland`, see {@link lineOf}; it shows by its name, the part
 * before the first comma, see {@link labelOf}, and the dialog shows the whole line, which opens the link
 * of the place, written with it as its `ALTREP`, when it has one, and nothing else, no search of a map.
 * A way shows its route by labels, see {@link whereOf}.
 *
 * - `./choices.ts`: The picker whether entries written before keep their address.
 * - `../icons.ts`: Puts the icons into the buttons of the dialog.
 * - `lucide`: The icons check and cross.
 */

import { choicesOf, rowOf, searchOf } from "./choices.ts";
import { iconPut } from "../icons.ts";
import { Check, X } from "lucide";

import type { Choice } from "./choices.ts";


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
 * My place as the dialog changed it, see {@link placeEdit}.
 *
 * - `place`: The place as written.
 * - `fix`: Whether its old address was wrong, so the entries that carried it took the new one too.
 */
export type PlaceEdited = {
    place: Place;
    fix: boolean;
};

/**
 * Choices whether the entries written before keep the address they carry, after a move, or take the new one,
 * since the old one was wrong.
 */
const fixChoices: Choice[] = [
    { value: "keep", text: "Keep their address, I moved", group: "" },
    { value: "fix", text: "Correct theirs too, it was wrong", group: "" },
];

/**
 * Whether the entries written before take the new address of the place being changed, see {@link fixChoices}.
 */
let fixing: boolean = false;

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
 * Writes where an entry or a box was, by labels alone, see {@link labelOf}: the route of a way, from where it starts,
 * its `X-FROM`, to its goal, its `LOCATION`, like `HomeMunich → TumGarching`, a missing end left out beside
 * its arrow, like `→ TumGarching`; the place of any other entry, like `HomeMunich`.
 * - `start`: Label of where a way starts, empty for none.
 * - `goal`: Label of the place or the goal, empty for none.
 *
 * @param category - Category of the entry, like `Way`
 * @param from - Where a way starts, like `HomeMunich, Burgweg 1, 81375 München, Deutschland`, empty for none
 * @param location - Place or goal, like `TumGarching, Boltzmannstraße 3, 85748 Garching, Deutschland`
 * @returns Where it was, like `HomeMunich → TumGarching`, empty for no place at all
 */
export function whereOf(category: string, from: string, location: string): string {
    const start: string = labelOf(from);
    const goal: string = labelOf(location);
    if (category !== wayName || (start === "" && goal === ""))
        return goal;
    return `${start} → ${goal}`.trim();
}


/**
 * Sends a new place to the reader, which adds it to `Places.md`, or my place being changed, with its old name,
 * see {@link editing}, which the reader changes in its row, and whether its old address was wrong.
 *
 * @param place - Name, address and link as typed
 * @returns The place as written, its name, address and link cleaned
 * @throws {Error} - When the reader does not take it, like for a name another place has
 */
async function placeSend(place: Place): Promise<Place> {
    const response: Response = await fetch("/api/day/places", {
        method: editing === "" ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editing === "" ? place : { ...place, old: editing, fix: fixing }),
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
 *
 * @param name - Typed name of the place, like `HomeMunich`
 * @returns The place as written once it is saved, `null` when the dialog closes without saving
 */
export function placeOpen(name: string): Promise<Place | null> {
    editing = "";
    document.getElementById("place-fix")?.setAttribute("hidden", "");
    return placeShow({ name: name, address: "", link: "" }, "place-address");
}

/**
 * Opens the dialog of a place over the entry by category to change my place: its name, its address and its link
 * filled in, the name focused, and below them whether the entries written before keep the address they carry,
 * after a move, as it starts, or take the new one, since the old one was wrong, see {@link fixChoices}.
 * - `fix`: The row of that choice.
 * - `saved`: The place as written, `null` when the dialog closed without saving.
 *
 * @param place - My place as it is, like `TumMain` with its address and link
 * @returns The place as written and whether the old address was wrong, once it is saved, `null` when the dialog
 *   closes without saving
 */
export async function placeEdit(place: Place): Promise<PlaceEdited | null> {
    const fix: HTMLElement = document.getElementById("place-fix") as HTMLElement;
    editing = place.name;
    fixing = false;
    fix.replaceChildren(rowOf("Entries", choicesOf({
        search: searchOf(fixChoices), picked: ["keep"], many: false, adding: false,
        pick: (values: string[]): void => {
            fixing = values[0] === "fix";
        },
    })));
    fix.hidden = false;
    const saved: Place | null = await placeShow(place, "place-name");
    return saved === null ? null : { place: saved, fix: fixing };
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
