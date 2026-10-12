/**
 * ## Tray
 *
 * Shows the boxes of the daily note's Tagesplanungen above the time grid, for old daily notes that still have them;
 * a day without boxes shows no tray, since new notes have none.
 * A box without plan entry is dragged into the plan column;
 * a box with one shows its start and stays where it is.
 *
 * - `fullcalendar/interaction`: Drags the boxes into the calendar.
 */

import { Draggable } from "fullcalendar/interaction";

import type { EventApi } from "fullcalendar";


/**
 * Boxes of the shown day, as the reader gives them.
 */
let boxes: string[] = [];

/**
 * Starts of the plan entries of the shown day by their title.
 */
let planned: Map<string, Date> = new Map();


/**
 * Shows the boxes, a box with plan entry faded and with its start; hides the tray when the day has no boxes.
 */
function trayShow(): void {
    const items: HTMLElement[] = boxes.map((box: string): HTMLElement => {
        const item: HTMLDivElement = document.createElement("div");
        const start: Date | undefined = planned.get(box);
        item.className = start === undefined ? "tray-box" : "tray-box planned";
        item.dataset.title = box;
        item.textContent = start === undefined ? box : `${start.toTimeString().slice(0, 5)} ${box}`;
        return item;
    });

    document.getElementById("tray-boxes")?.replaceChildren(...items);
    document.getElementById("tray")?.toggleAttribute("hidden", items.length === 0);
}

/**
 * Loads the boxes of a date from the reader, then shows them.
 *
 * @param date - Date like `2026-07-03`
 * @throws {Error} - When the reader gives no valid answer
 */
export async function trayLoad(date: string): Promise<void> {
    const response: Response = await fetch(`/api/day/tray?date=${date}`);
    boxes = await response.json();
    trayShow();
}

/**
 * Takes the plan entries out of the events of the calendar, then shows the boxes.
 * - `source.id`: Calendar of the reader the event comes from, `plan` for plan entries.
 *
 * @param events - All events of the shown day
 */
export function trayPlan(events: EventApi[]): void {
    planned = new Map(events
        .filter((event: EventApi): boolean => event.source?.id === "plan" && event.start !== null)
        .map((event: EventApi): [string, Date] => [event.title, event.start as Date]));
    trayShow();
}

/**
 * Lists the boxes that have no plan entry yet.
 *
 * @returns Texts of the open boxes
 */
export function trayOpen(): string[] {
    return boxes.filter((box: string): boolean => !planned.has(box));
}

/**
 * Lets the open boxes be dragged into the calendar, each as an entry of one hour.
 * - {@link Draggable}: Turns elements into something FullCalendar takes when dropped.
 * - `itemSelector`: Drags only boxes without plan entry.
 * - `eventData`: Entry the dragged box becomes, with the text of the box as title.
 */
export function trayStart(): void {
    new Draggable(document.getElementById("tray-boxes") as HTMLElement, {
        itemSelector: ".tray-box:not(.planned)",
        eventData: (item: HTMLElement): { title: string; duration: string } =>
            ({ title: item.dataset.title ?? "", duration: "01:00" }),
    });
}
