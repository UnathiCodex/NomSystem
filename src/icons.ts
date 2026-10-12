/**
 * ## Icons
 *
 * Icons for the obvious actions, like save, cancel, add, remove and history, from Lucide, the icon set of Obsidian;
 * only the icons used go into the page. A button with an icon keeps its words as tooltip and as its name
 * for screen readers; the icon draws in the grey of the button's text, one icon size big, see `variants.css`.
 * Where an icon would be unclear, like Right, Wrong, Stuck and Skip, the words stay.
 *
 * - `lucide`: Makes the SVG element of an icon.
 */

import { createElement } from "lucide";

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
