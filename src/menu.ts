/**
 * ## Menu
 *
 * One plain button `⋯` that holds what a thing can do, on the computer as on a phone, so both show the same:
 * a click opens its items as a small menu below it, each its icon and then its words, like `Move`,
 * so the line beside it keeps its room; a click on an item, or beside the menu, closes it.
 * A box of the day has one, see `day/boxes.ts`, and a task, see `skill/task.ts`, whose field of my comment after Wrong
 * opens below its cross in the same place and look, see {@link menuAnchor}.
 *
 * - `./icons.ts`: Puts the icon `⋯` into its button, and an icon with words into each item.
 * - `lucide`: The icon `⋯`.
 * - `./menu.css`: Look of the button and its menu.
 */

import { iconPut, iconWordsOf } from "./icons.ts";
import { Ellipsis } from "lucide";
import "./menu.css";

import type { IconNode } from "lucide";


/**
 * Makes one item of a menu, its icon and then its words, like `Move`.
 *
 * @param icon - Icon, like `ArrowRight`
 * @param words - What it does, like `Move`
 * @param click - What a click does
 * @returns Item
 */
export function menuItemOf(icon: IconNode, words: string, click: () => void): HTMLButtonElement {
    const item: HTMLButtonElement = document.createElement("button");
    item.type = "button";
    item.className = "menu-item";
    item.replaceChildren(...iconWordsOf(icon, words));
    item.addEventListener("click", click);
    return item;
}

/**
 * Makes a menu open from its button, see the top of this file: shown over the page as a popover, the button's popover
 * target, which closes by itself on a click beside it or Escape; right before it opens, it moves below the button,
 * its right edge under the button's, and once open, above the button instead when it would reach below the window,
 * like a long menu low on the page.
 * - `margin`: Room between the button and the menu, the menu's margin above, kept below it when above the button.
 * - {@link ToggleEvent}: Fires before and after a popover opens or closes, `newState` telling which.
 *
 * @param menu - The menu, in the look of `./menu.css`
 * @param button - The button that opens and closes it
 */
export function menuAnchor(menu: HTMLElement, button: HTMLButtonElement): void {
    menu.classList.add("menu");
    menu.popover = "auto";
    button.popoverTargetElement = menu;
    menu.addEventListener("beforetoggle", (event: ToggleEvent): void => {
        if (event.newState !== "open")
            return;
        const rect: DOMRect = button.getBoundingClientRect();
        menu.style.top = `${rect.bottom}px`;
        menu.style.right = `${document.documentElement.clientWidth - rect.right}px`;
    });
    menu.addEventListener("toggle", (event: ToggleEvent): void => {
        if (event.newState !== "open" || menu.getBoundingClientRect().bottom <= innerHeight)
            return;
        const margin: number = parseFloat(getComputedStyle(menu).marginTop);
        const top: number = button.getBoundingClientRect().top - menu.offsetHeight - 2 * margin;
        menu.style.top = `${Math.max(0, top)}px`;
    });
}

/**
 * Puts items behind one button `⋯`, see the top of this file.
 * - `place`: The button with its menu.
 * - `more`: The button `⋯`, which opens and closes the menu, see {@link menuAnchor}.
 * - `menu`: The menu, which a click on an item closes.
 *
 * @param items - Items, like `Move` and `Skip`
 * @returns The button `⋯` with its menu
 */
export function menuOf(items: HTMLElement[]): HTMLElement {
    const place: HTMLElement = document.createElement("div");
    const more: HTMLButtonElement = document.createElement("button");
    const menu: HTMLElement = document.createElement("div");
    more.type = "button";
    more.className = "menu-more";
    iconPut(more, Ellipsis, "More");
    menuAnchor(menu, more);
    menu.append(...items);
    menu.addEventListener("click", (): void => menu.hidePopover());
    place.className = "menu-place";
    place.append(more, menu);
    return place;
}
