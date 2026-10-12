/**
 * ## Evening
 *
 * What I write into the daily note of the shown day, any time of the day, at the top of the note:
 * my gratitude, a list of points, see `points.ts`, into the callout Dankbarkeiten,
 * and one short paragraph about the day overall into the callout Tagesfazit.
 * Both are saved into the day's note a moment after I stop typing, and when I leave a field or the day;
 * the note below leaves both callouts out.
 * It is all that is left of the evening panel: what happened is my log and the boxes for tomorrow are plan entries,
 * so neither is written any more, and the notes keep what they hold.
 *
 * - `./note.ts`: Loads and writes the callouts of a daily note and shows the note.
 * - `./points.ts`: Writes a list of points like a Markdown list.
 */

import { calloutsLoad, calloutSend, noteShow } from "./note.ts";
import { pointsRead, pointsShow, pointsStart } from "./points.ts";

import type { CalloutTitle } from "./note.ts";


/**
 * A field of the daily note I write.
 *
 * - `id`: Identifier of its text area, like `gratitude`.
 * - `title`: Callout it writes into, like `Dankbarkeiten`.
 * - `points`: Whether it is a list of points, else one paragraph.
 */
type Box = {
    id: string;
    title: CalloutTitle;
    points: boolean;
};

/**
 * The fields of the daily note I write: my gratitude and my paragraph about the day.
 */
const boxes: Box[] = [
    { id: "gratitude", title: "Dankbarkeiten", points: true },
    { id: "day-paragraph", title: "Tagesfazit", points: false },
];

/**
 * Milliseconds the typing has to pause before the fields are saved.
 */
const pause: number = 1000;

/**
 * Day whose texts the fields hold, like `2026-10-10`, empty before the first day is shown.
 */
let shown: string = "";

/**
 * Texts of the fields as last loaded or saved, as their callouts hold them, by the titles of the callouts.
 */
let saved: Map<CalloutTitle, string> = new Map();

/**
 * Timer of the save waiting for the pause, 0 for none.
 */
let waiting: number = 0;


/**
 * Gives the text area of a field.
 *
 * @param box - Field
 * @returns Its text area
 */
function areaOf(box: Box): HTMLTextAreaElement {
    return document.getElementById(box.id) as HTMLTextAreaElement;
}

/**
 * Reads the text of a field as its callout holds it: the points of my gratitude, see `points.ts`,
 * my paragraph without spaces at its ends.
 *
 * @param box - Field
 * @returns Its text, empty for none
 */
function textOf(box: Box): string {
    return box.points ? pointsRead(areaOf(box)) : areaOf(box).value.trim();
}

/**
 * Shows the hint that the reader did not take a text.
 *
 * @param error - Error of the request
 */
function errorShow(error: unknown): void {
    console.error(error);
    document.getElementById("note-boxes-error")?.removeAttribute("hidden");
}

/**
 * Saves each field whose text changed, one after the other, since both write into the same note,
 * then shows the note again, which the first save of a day may create.
 * - `day`: Day the texts belong to.
 * - `changed`: Fields whose text changed since it was loaded or saved.
 *
 * @throws {Error} - When the reader does not take a text
 */
async function boxesSave(): Promise<void> {
    clearTimeout(waiting);
    const day: string = shown;
    const changed: Box[] = boxes.filter((box: Box): boolean => textOf(box) !== (saved.get(box.title) ?? ""));
    if (day === "" || changed.length === 0)
        return;

    for (const box of changed) {
        const text: string = textOf(box);
        await calloutSend(day, box.title, text);
        saved.set(box.title, text);
    }
    document.getElementById("note-boxes-error")?.setAttribute("hidden", "");
    if (day === shown)
        await noteShow(day);
}

/**
 * Shows my gratitude and my paragraph of a day, after saving what was typed for the day shown before.
 * - `callouts`: Callouts of the day's note.
 *
 * @param day - Day like `2026-10-10`
 * @throws {Error} - When the reader gives no valid answer
 */
export async function eveningShow(day: string): Promise<void> {
    await boxesSave().catch(errorShow);
    shown = day;
    const callouts: { [title in CalloutTitle]: string } = await calloutsLoad(day);
    if (day !== shown)
        return;
    saved = new Map(boxes.map((box: Box): [CalloutTitle, string] => [box.title, callouts[box.title]]));
    boxes.forEach((box: Box): void => {
        if (box.points)
            pointsShow(areaOf(box), callouts[box.title]);
        else
            areaOf(box).value = callouts[box.title];
    });
    document.getElementById("note-boxes-error")?.setAttribute("hidden", "");
}

/**
 * Starts the fields after the router has put their HTML into the page: my gratitude a list of points;
 * both saved a moment after the typing pauses and when a field loses the focus.
 */
export function eveningStart(): void {
    boxes.forEach((box: Box): void => {
        if (box.points)
            pointsStart(areaOf(box));
        areaOf(box).addEventListener("input", (): void => {
            clearTimeout(waiting);
            waiting = window.setTimeout((): void => {
                boxesSave().catch(errorShow);
            }, pause);
        });
        areaOf(box).addEventListener("blur", (): void => {
            boxesSave().catch(errorShow);
        });
    });
}
