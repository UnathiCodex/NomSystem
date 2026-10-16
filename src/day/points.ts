/**
 * ## Points
 *
 * A list of points for the sections of the daily note, my gratitude and my points about the day, shown as Markdown
 * shows a list: each point a bullet with a small field of its own beside it, wrapping and growing with its text.
 * Enter starts the next point below, taking along the text after the cursor, on an empty point it does nothing;
 * Shift+Enter goes on in the same point on a new line, where I find a break nice, as in the editor;
 * Backspace at the start of an empty point removes it, at the start of one with text joins it to the point above;
 * the arrows up and down at the start and at the end of a point go to the point above and below.
 * Text pasted or dropped over several lines becomes one point per line, a `- ` in front of a line dropped.
 * A list without points shows one empty point, so there is always a bullet to write at; a click beside the points
 * goes to the end of the last.
 * The section keeps the points as its own list, one `- ` line each, see `reader/note.ts`, a new line of a point
 * as its further line, two spaces in, under its text, as my notes write it.
 * On a phone a point takes no new line: its further line follows its text after a space, so the narrow screen breaks
 * no point where it has room, and every new line its keyboard types starts the next point, also the Enter that ends
 * a word still being typed, which the keyboard sends without its key; a point written there is saved on one line.
 *
 * - `../phone.ts`: Tells a phone, whose points take no new line.
 */

import { phone } from "../phone.ts";


/**
 * A point in a line of a section as it may be written or pasted, `- ` in front, which the list leaves out.
 */
const marker: RegExp = /^\s*[-*•]\s+/;


/**
 * Gives the fields of the points of a list, in order.
 *
 * @param list - List of points
 * @returns Their fields
 */
function fieldsOf(list: HTMLElement): HTMLTextAreaElement[] {
    return [...list.querySelectorAll<HTMLTextAreaElement>("textarea")];
}

/**
 * Makes a point: a list item, its bullet drawn by the list, with its field.
 * - `item`: The list item.
 * - `field`: Its field, one line high at first and growing with its text.
 *
 * @param text - Text of the point
 * @returns The field, inside its list item
 */
function pointOf(text: string): HTMLTextAreaElement {
    const item: HTMLLIElement = document.createElement("li");
    const field: HTMLTextAreaElement = document.createElement("textarea");
    item.className = "note-point";
    field.rows = 1;
    field.value = text;
    field.setAttribute("aria-label", "Point");
    item.append(field);
    return field;
}

/**
 * Puts the cursor into the field of a point.
 *
 * @param field - Field of a point
 * @param at - Where the cursor goes, like 0 for the start
 */
function caretPut(field: HTMLTextAreaElement, at: number): void {
    field.focus();
    field.setSelectionRange(at, at);
}

/**
 * Shows the text of a section as points, one empty point for none.
 * - `points`: Texts of the points, a further line on a new line of its point, on a phone after a space.
 *
 * @param list - List of points
 * @param text - Text of the section as the reader gives it, one point per line, a further line indented
 */
export function pointsShow(list: HTMLElement, text: string): void {
    const points: string[] = [];
    for (const line of text.split("\n")) {
        if (line.trim() === "")
            continue;
        if (/^\s/.test(line) && points.length > 0)
            points[points.length - 1] = `${points[points.length - 1]}${phone ? " " : "\n"}${line.trim()}`;
        else
            points.push(line.replace(marker, "").trim());
    }
    list.replaceChildren(...(points.length > 0 ? points : [""]).map((point: string): HTMLElement =>
        pointOf(point).parentElement as HTMLElement));
}

/**
 * Reads the points of a list as the text of a section: one point per line, a new line of a point as its further
 * line, two spaces in, empty points and lines left out.
 *
 * @param list - List of points
 * @returns Text of the section, empty for no points
 */
export function pointsRead(list: HTMLElement): string {
    return fieldsOf(list)
        .map((field: HTMLTextAreaElement): string => field.value.split("\n")
            .map((line: string): string => line.replace(/\s+/g, " ").trim())
            .filter((line: string): boolean => line !== "")
            .join("\n  "))
        .filter((point: string): boolean => point !== "")
        .join("\n");
}

/**
 * Puts points in place of a point after a paste or a drop of several lines: one point per line,
 * a `- ` in front dropped, empty lines left out; the cursor at the end of the last.
 * - `lines`: The lines of its text that hold something.
 * - `fields`: Fields of the new points.
 *
 * @param field - Field of the point
 */
function pointSplit(field: HTMLTextAreaElement): void {
    const lines: string[] = field.value.split("\n")
        .map((line: string): string => line.replace(marker, "").trim())
        .filter((line: string): boolean => line !== "");
    const fields: HTMLTextAreaElement[] = (lines.length > 0 ? lines : [""]).map(pointOf);
    (field.parentElement as HTMLElement).replaceWith(...fields.map((other: HTMLTextAreaElement): HTMLElement =>
        other.parentElement as HTMLElement));
    const last: HTMLTextAreaElement = fields[fields.length - 1];
    caretPut(last, last.value.length);
}

/**
 * Starts the next point below a point, taking along the text after the cursor; on an empty point does nothing.
 * - `next`: Field of the new point below.
 *
 * @param field - Field of the point
 * @param changed - Tells that the points changed, like a save that waits for a pause
 */
function pointNext(field: HTMLTextAreaElement, changed: () => void): void {
    if (field.value.trim() === "")
        return;
    const next: HTMLTextAreaElement = pointOf(field.value.slice(field.selectionEnd).trim());
    field.value = field.value.slice(0, field.selectionStart).trimEnd();
    (field.parentElement as HTMLElement).after(next.parentElement as HTMLElement);
    caretPut(next, 0);
    changed();
}

/**
 * Handles Enter, Backspace and the arrows in the field of a point, see the top of this file.
 * - `fields`: Fields of the points of the list.
 * - `index`: Place of the point among them.
 * - `caret`: Where the cursor stands, `null` while text is selected.
 * - `above`, `below`: Fields of the points above and below, `undefined` for none.
 * - `joined`: Where the text of the point starts in the point above, once joined to it.
 *
 * @param list - List of points
 * @param field - Field the key was pressed in
 * @param event - Key pressed
 * @param changed - Tells that the points changed, like a save that waits for a pause
 */
function keyHandle(list: HTMLElement, field: HTMLTextAreaElement, event: KeyboardEvent, changed: () => void): void {
    if (event.isComposing || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey)
        return;
    const fields: HTMLTextAreaElement[] = fieldsOf(list);
    const index: number = fields.indexOf(field);
    const caret: number | null = field.selectionStart === field.selectionEnd ? field.selectionStart : null;
    const above: HTMLTextAreaElement | undefined = fields[index - 1];
    const below: HTMLTextAreaElement | undefined = fields[index + 1];

    if (event.key === "Enter") {
        event.preventDefault();
        pointNext(field, changed);
    } else if (event.key === "Backspace" && caret === 0 && above !== undefined) {
        event.preventDefault();
        const joined: number = above.value.length;
        above.value = field.value === "" ? above.value : `${above.value}${above.value === "" ? "" : " "}${field.value}`;
        (field.parentElement as HTMLElement).remove();
        caretPut(above, field.value === "" || joined === 0 ? joined : joined + 1);
        changed();
    } else if (event.key === "ArrowUp" && caret === 0 && above !== undefined) {
        event.preventDefault();
        caretPut(above, above.value.length);
    } else if (event.key === "ArrowDown" && caret === field.value.length && below !== undefined) {
        event.preventDefault();
        caretPut(below, 0);
    }
}

/**
 * Makes a list a list of points, see the top of this file; its points are shown by {@link pointsShow}.
 * - `keydown`: Handles Enter, Backspace and the arrows in a point.
 * - `beforeinput`: On a phone starts the next point in place of a new line its keyboard types without the key Enter.
 * - `input`: Splits a point into one per line after a paste or a drop of several lines, not after Shift+Enter,
 *   whose new line stays in its point, and tells of the change.
 * - `focusout`: Tells that the focus left the list, not when it only went to another of its points.
 * - `click`: Puts the cursor at the end of the last point on a click into the list beside its points.
 *
 * @param list - List, like the one of my gratitude
 * @param changed - Tells that the points changed, like a save that waits for a pause
 * @param left - Tells that the focus left the list, like a save right away
 */
export function pointsStart(list: HTMLElement, changed: () => void, left: () => void): void {
    list.addEventListener("keydown", (event: KeyboardEvent): void => {
        if (event.target instanceof HTMLTextAreaElement)
            keyHandle(list, event.target, event, changed);
    });
    list.addEventListener("beforeinput", (event: InputEvent): void => {
        if (phone && event.target instanceof HTMLTextAreaElement
            && ["insertLineBreak", "insertParagraph"].includes(event.inputType)) {
            event.preventDefault();
            pointNext(event.target, changed);
        }
    });
    list.addEventListener("input", (event: Event): void => {
        if (event.target instanceof HTMLTextAreaElement && event instanceof InputEvent
            && ["insertFromPaste", "insertFromDrop"].includes(event.inputType) && event.target.value.includes("\n"))
            pointSplit(event.target);
        changed();
    });
    list.addEventListener("focusout", (event: FocusEvent): void => {
        if (!(event.relatedTarget instanceof Node && list.contains(event.relatedTarget)))
            left();
    });
    list.addEventListener("click", (event: MouseEvent): void => {
        const last: HTMLTextAreaElement | undefined = fieldsOf(list).at(-1);
        if (!(event.target instanceof HTMLTextAreaElement) && last !== undefined)
            caretPut(last, last.value.length);
    });
}
