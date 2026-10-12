/**
 * ## Gifts
 *
 * My gift ideas for the birthdays and holidays at the top of the plan, see `reader/gifts.ts`,
 * written only when I have one: a click on a birthday or holiday opens a small dialog with one field, my gift idea for it,
 * which `Enter` or the check saves into `Gifts.md`; an empty field, or the bin, takes the idea out again.
 * The plan shows each idea below its birthday or holiday, see `boxes.ts`, and loads again when the dialog closes.
 *
 * - `../icons.ts`: Puts the icons into the buttons of the dialog.
 * - `lucide`: The icons check, cross and bin.
 */

import { iconPut } from "../icons.ts";
import { Check, Trash2, X } from "lucide";

import type { Occasion } from "./boxes.ts";


/**
 * The birthday or holiday the dialog writes the gift idea of, and its day, like `2026-10-11`.
 */
let opened: { day: string; occasion: Occasion } = { day: "", occasion: { title: "", gift: "" } };


/**
 * Sends my gift idea for a birthday or holiday to the reader, an empty one to take it out again.
 *
 * @param day - Day of the birthday or holiday, like `2026-10-11`
 * @param occasion - Name of the birthday or holiday as my calendar writes it
 * @param gift - The gift, empty for none
 * @throws {Error} - When the reader does not take it
 */
async function giftSend(day: string, occasion: string, gift: string): Promise<void> {
    const response: Response = await fetch("/api/day/gifts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ day: day, occasion: occasion, gift: gift }),
    });
    if (!response.ok)
        throw new Error(`Reader answered ${response.status}`);
}

/**
 * Sends the gift idea of the field, or none when it is removed, then closes the dialog;
 * shows a hint when the reader does not take it.
 *
 * @param gift - The gift, empty for none
 */
function giftSave(gift: string): void {
    giftSend(opened.day, opened.occasion.title, gift.trim())
        .then((): void => (document.getElementById("gift") as HTMLDialogElement).close())
        .catch((error: unknown): void => {
            console.error(error);
            document.getElementById("gift-error")?.removeAttribute("hidden");
        });
}

/**
 * Opens the dialog of the gift idea for a birthday or holiday, its name small and grey above the field,
 * the field holding the idea I have, focused; the bin shows only when there is one to take out.
 * - {@link HTMLDialogElement#showModal}: Shows the dialog over the page, `Esc` closes it.
 *
 * @param day - Day of the birthday or holiday, like `2026-10-11`
 * @param occasion - The birthday or holiday with my gift idea for it
 */
export function giftOpen(day: string, occasion: Occasion): void {
    const field: HTMLInputElement = document.getElementById("gift-text") as HTMLInputElement;
    opened = { day: day, occasion: occasion };
    (document.getElementById("gift-occasion") as HTMLElement).textContent = occasion.title;
    field.value = occasion.gift;
    document.getElementById("gift-remove")?.toggleAttribute("hidden", occasion.gift === "");
    document.getElementById("gift-error")?.setAttribute("hidden", "");
    (document.getElementById("gift") as HTMLDialogElement).showModal();
    field.focus();
}

/**
 * Starts the dialog after the router has put its HTML into the page: the cross closes it, the bin takes the idea out,
 * `Enter` and the check save it.
 */
export function giftsStart(): void {
    iconPut(document.getElementById("gift-cancel") as HTMLElement, X, "Cancel");
    iconPut(document.getElementById("gift-remove") as HTMLElement, Trash2, "Remove");
    iconPut(document.getElementById("gift-save") as HTMLElement, Check, "Save");
    document.getElementById("gift-cancel")?.addEventListener("click", (): void =>
        (document.getElementById("gift") as HTMLDialogElement).close());
    document.getElementById("gift-remove")?.addEventListener("click", (): void => giftSave(""));
    document.getElementById("gift-form")?.addEventListener("submit", (event: SubmitEvent): void => {
        event.preventDefault();
        giftSave((document.getElementById("gift-text") as HTMLInputElement).value);
    });
}
