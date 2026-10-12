/**
 * ## Points
 *
 * A text area that is a list of points while I type, like a Markdown list, for the callouts of the daily note,
 * like my gratitude: each line is one point and starts with `- `. Enter starts the next point,
 * on an empty point it does nothing; Backspace on an empty point removes it,
 * and right after the `- ` of a point joins the point to the one above, undoing an Enter.
 * An empty area starts its first point when it gets the focus, and is empty again when left without text.
 * The callout keeps the points as its own list, see `reader/note.ts`; a line indented continues the point above.
 */


/**
 * Start of every point while I type.
 */
const marker: string = "- ";


/**
 * Shows the text of a callout as points.
 *
 * @param area - Text area of points
 * @param text - Text of the callout as the reader gives it, one point per line, a further line indented
 */
export function pointsShow(area: HTMLTextAreaElement, text: string): void {
    area.value = text.split("\n")
        .filter((line: string): boolean => line.trim() !== "")
        .map((line: string): string => /^\s/.test(line) ? line : `${marker}${line}`)
        .join("\n");
}

/**
 * Reads the points of a text area as the text of a callout: each line without its `- `, empty points left out.
 *
 * @param area - Text area of points
 * @returns Text of the callout, one point per line, a further line indented; empty for no points
 */
export function pointsRead(area: HTMLTextAreaElement): string {
    return area.value.split("\n")
        .map((line: string): string => line.replace(/^-(?: |$)/, ""))
        .filter((line: string): boolean => line.trim() !== "")
        .join("\n");
}

/**
 * Changes the text of a text area like typing does, the cursor after the new text,
 * and tells the listeners of the area, like a save that waits for a pause.
 * - {@link HTMLTextAreaElement#setRangeText}: Puts a text in place of a range of the text.
 *
 * @param area - Text area of points
 * @param text - New text, empty to remove the range
 * @param start - Start of the range
 * @param end - End of the range, excluded
 */
function textPut(area: HTMLTextAreaElement, text: string, start: number, end: number): void {
    area.setRangeText(text, start, end, "end");
    area.dispatchEvent(new Event("input"));
}

/**
 * Handles Enter and Backspace in a text area of points, see the top of this file.
 * - `caret`: Where the cursor stands.
 * - `lineStart`, `lineEnd`: Start of the line of the cursor and its end, before its line break.
 * - `lineBreak`: Where the line break after the cursor stands, -1 for none.
 * - `line`: The line of the cursor.
 * - `empty`: Whether the line is a point without text.
 *
 * @param area - Text area of points
 * @param event - Key pressed
 */
function keyHandle(area: HTMLTextAreaElement, event: KeyboardEvent): void {
    if (event.isComposing || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey)
        return;
    const caret: number = area.selectionStart;
    const lineStart: number = caret === 0 ? 0 : area.value.lastIndexOf("\n", caret - 1) + 1;
    const lineBreak: number = area.value.indexOf("\n", caret);
    const lineEnd: number = lineBreak === -1 ? area.value.length : lineBreak;
    const line: string = area.value.slice(lineStart, lineEnd);
    const empty: boolean = line.trim() === "" || line.trim() === "-";

    if (event.key === "Enter") {
        event.preventDefault();
        if (!empty)
            textPut(area, `\n${marker}`, Math.max(caret, lineStart + (line.startsWith(marker) ? marker.length : 0)),
                Math.max(area.selectionEnd, caret));
    } else if (event.key === "Backspace" && area.selectionEnd === caret) {
        if (empty) {
            event.preventDefault();
            if (lineStart > 0)
                textPut(area, "", lineStart - 1, lineEnd);
            else
                textPut(area, "", 0, Math.min(lineEnd + 1, area.value.length));
        } else if (lineStart > 0 && line.startsWith(marker) && caret === lineStart + marker.length) {
            event.preventDefault();
            textPut(area, "", lineStart - 1, caret);
        }
    }
}

/**
 * Makes a text area a list of points, see the top of this file.
 * - `focus`: Starts the first point of an empty area.
 * - `blur`: Empties an area left without text, so it shows as empty.
 *
 * @param area - Text area, like the one of my gratitude
 */
export function pointsStart(area: HTMLTextAreaElement): void {
    area.addEventListener("keydown", (event: KeyboardEvent): void => keyHandle(area, event));
    area.addEventListener("focus", (): void => {
        if (area.value === "")
            area.value = marker;
    });
    area.addEventListener("blur", (): void => {
        if (pointsRead(area) === "")
            area.value = "";
    });
}
