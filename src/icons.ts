/**
 * ## Icons
 *
 * Icons for the obvious actions, like save, cancel, add, remove and history, from Lucide, the icon set of Obsidian;
 * only the icons used go into the page. A button with an icon keeps its words as tooltip and as its name
 * for screen readers; the icon draws in the grey of the button's text, one icon size big, see `variants.css`.
 * Where an icon would be unclear, like Right, Wrong, Stuck and Skip, the words stay.
 * One plus adds one more and one `×` takes a value back, made only here, so they look and act the same everywhere,
 * for a meal, a food, a chapter, a type, a document or a way, see {@link plusPut} and {@link crossPut}.
 *
 * - `lucide`: Makes the SVG element of an icon; the icons plus and cross.
 */

import { createElement, Plus, X } from "lucide";

import type { IconNode } from "lucide";


/**
 * Makes the element of an icon, hidden from screen readers, which read the words of its button instead.
 * Lucide draws it 24 px big; its class `lucide`, which `createElement` leaves out, lets `base.css` size it.
 * - {@link createElement}: Makes the SVG element of an icon, which draws in the colour of the text.
 *
 * @param icon - Icon, like `Check`
 * @returns SVG element of the icon
 */
export function iconOf(icon: IconNode): SVGElement {
    return createElement(icon, { class: "lucide", "aria-hidden": "true" });
}

/**
 * Shows an icon in a button in place of its words, which stay as its tooltip and its name for screen readers.
 *
 * @param button - Button, like the save button of a dialog
 * @param icon - Icon, like `Check`
 * @param words - What the button does, like `Save`
 */
export function iconPut(button: HTMLElement, icon: IconNode, words: string): void {
    button.replaceChildren(iconOf(icon));
    button.title = words;
    button.setAttribute("aria-label", words);
}

/**
 * Makes an icon with words beside it, like the number of attempts of a history.
 *
 * @param icon - Icon, like `History`
 * @param words - Words after the icon, like `3`
 * @returns Icon and words, to put into a button
 */
export function iconWordsOf(icon: IconNode, words: string): Node[] {
    return [iconOf(icon), document.createTextNode(words)];
}

/**
 * Shows the small grey plus of every list in a button, see `.plus-quiet` in `base.css`: the one plus that adds one more,
 * like a meal, a food, a chapter, a type or a document, its words as tooltip and as its name for screen readers.
 *
 * @param button - Button, like the line below the meals picked
 * @param words - What it adds, like `Add a meal`
 */
export function plusPut(button: HTMLElement, words: string): void {
    iconPut(button, Plus, words);
    button.classList.add("plus-quiet");
}

/**
 * Takes the plus out of a button again, with its tooltip and its name for screen readers, so the button shows
 * its text or nothing, like the line of a field once a value is picked.
 *
 * @param button - Button that showed the plus
 */
export function plusTake(button: HTMLElement): void {
    button.replaceChildren();
    button.classList.remove("plus-quiet");
    button.removeAttribute("aria-label");
    button.removeAttribute("title");
}

/**
 * Shows the small grey plus with the text typed in a button at the end of a list with a search, like `+ “skyr”`,
 * see `.picker-new` in `base.css`, so a plus inside a list always names what it adds.
 *
 * @param button - Button at the end of the list
 * @param typed - Text typed, like `skyr`
 */
export function plusTypedPut(button: HTMLElement, typed: string): void {
    button.replaceChildren(iconOf(Plus), `“${typed}”`);
}

/**
 * Shows the small grey `×` of every list in a button, see `.cross-quiet` in `base.css`: the one `×` that takes
 * a value picked back, like a food, a meal or a chapter, its words as tooltip and as its name for screen readers.
 *
 * @param button - Button beside the value
 * @param words - What it takes back, like `Remove Hackfleisch`
 */
export function crossPut(button: HTMLElement, words: string): void {
    iconPut(button, X, words);
    button.classList.add("cross-quiet");
}
