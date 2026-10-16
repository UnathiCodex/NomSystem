/**
 * ## Search of the log
 *
 * Finds entries in my whole log, not only the shown day, like every `Talk` to add who was there with `With`:
 * a small button beside `Log +` opens the search, on a phone a button in the bar while the log shows, and what
 * I type finds every entry that holds each typed word in its summary, its category, its place, its people or its note,
 * as every search of the page compares, see `../search.ts`, like `Talk` or `Sophale`. The results stand newest first,
 * each what it was, like `Talk: Artificial Intelligence`, and below it small and grey its day, its time, its place
 * and who I was with, like `Friday, 16.10.2026 · 13:45 – 14:15 · Mensa Leopoldstraße · Kicktipp`. A click on a result shows its day and opens
 * its dialog there; closing that dialog, saved or not, brings the search back with what I typed, read anew,
 * so I go from one result to the next. The search brings its dialog itself, `search.html`.
 *
 * - `./search.html?raw`: Html of the dialog of the search as text, packed into the built code by Vite.
 * - `./categories.ts`: Opens the dialog of an entry.
 * - `./boxes.ts`: Writes what an entry was as the log shows it, and builds the parts of a result.
 * - `./places.ts`: Gives the place of an entry by its label.
 * - `./times.ts`: Writes the times and the date of an entry.
 * - `../skill/attempts.ts`: Writes a date as a day in the form of the reader.
 * - `../search.ts`: Compares a typed text with an entry, alike everywhere.
 * - `../icons.ts`: Puts the icon of the search into its buttons.
 * - `lucide`: The icon of the search.
 */

import searchHtml from "./search.html?raw";
import { entryOpenEdit } from "./categories.ts";
import { entryPartOf, shownWhatOf, whatOf } from "./boxes.ts";
import { whereOf } from "./places.ts";
import { dateTextOf, timeOf } from "./times.ts";
import { dayOf } from "../skill/attempts.ts";
import { matchesAll, wordsOf } from "../search.ts";
import { iconPut } from "../icons.ts";
import { Search } from "lucide";

import type { Calendar, EventApi } from "fullcalendar";
import type { Attendee } from "./entries.ts";


/**
 * An entry of the log as the reader sends it for the search, the fields the search reads of it.
 *
 * - `id`: Its identifier, which the calendar of its day knows it by.
 * - `category`: Its category, like `Talk`.
 * - `title`: What it was, its `SUMMARY`, like `Artificial Intelligence`.
 * - `module`, `type`: Skill and type of a skill entry, like `IN2028` and `VO`, empty for any other entry.
 * - `location`: Its place, its `LOCATION`, like `Mensa Leopoldstraße, Leopoldstraße 13a, 80802 München, Deutschland`.
 * - `from`: Where a way starts, its `X-FROM`, empty for none.
 * - `attendees`: Who I was with, none for nobody.
 * - `note`: Its note, its `DESCRIPTION`.
 * - `start`, `end`: Its start and end as ISO instants.
 */
type LogEntry = {
    id: string;
    category: string;
    title: string;
    module: string;
    type: string;
    location: string;
    from: string;
    attendees: Attendee[];
    note: string;
    start: string;
    end: string;
};

/**
 * Every entry of the log, newest first, as read when the search opened last.
 */
let entries: LogEntry[] = [];

/**
 * Whether the search comes back once the dialog of an entry opened from it closes, see {@link resultOpen}.
 */
let returning: boolean = false;


/**
 * Gives what an entry was as the log shows it, like `Artificial Intelligence`, a skill entry by its skill and type,
 * see `shownWhatOf` in `boxes.ts`; empty when it is its category, like an old `Sleep`.
 * - `shown`: What it was, or its category.
 *
 * @param entry - The entry
 * @returns What it was
 */
function whatTextOf(entry: LogEntry): string {
    const shown: string = shownWhatOf(entry.category, entry.title, entry.module, entry.type);
    return shown === entry.category ? "" : shown;
}

/**
 * Gives the text the search compares with what I type: the summary of an entry, its category, its place,
 * its people and its note, like `Talk Artificial Intelligence Mensa Leopoldstraße … Kicktipp`.
 *
 * @param entry - The entry
 * @returns Its text
 */
function searchedOf(entry: LogEntry): string {
    return [entry.category, entry.title, entry.module, entry.type, entry.location, entry.from,
        ...entry.attendees.map((person: Attendee): string => person.name), entry.note].join(" ");
}

/**
 * Builds a result: what the entry was in the bold of the log, like `Talk: Artificial Intelligence`, see `whatOf`
 * in `boxes.ts`, and below it, small and grey, its day with its weekday written out, its time, its place by its label
 * and who I was with, parted by middle dots, like `Friday, 16.10.2026 · 13:45 – 14:15 · Mensa Leopoldstraße · Kicktipp`;
 * no place or nobody leaves its part out; a phone shows place and people on a line of their own, see `day.css`.
 * - `start`, `end`: Start and end of the entry.
 * - `day`: Day of its start, like `2026-10-16`.
 * - `weekday`: Its weekday, like `Friday`.
 * - `place`: Its place by its label, see `whereOf` in `places.ts`, empty for none.
 * - `people`: The names of who I was with, like `Sophale, Willi`, empty for nobody.
 * - `where`: Its place and who I was with, those it has.
 * - `meta`: The grey line below what it was, its day and time, then where, which a phone shows on a line of its own.
 * - `button`: The result, which opens the entry.
 *
 * @param calendar - Calendar of the day
 * @param entry - The entry
 * @returns The result
 */
function resultOf(calendar: Calendar, entry: LogEntry): HTMLLIElement {
    const start: Date = new Date(entry.start);
    const end: Date = new Date(entry.end);
    const day: string = dayOf(start);
    const weekday: string = start.toLocaleDateString("en-GB", { weekday: "long" });
    const place: string = whereOf(entry.category, entry.from, entry.location);
    const people: string = entry.attendees.map((person: Attendee): string => person.name).join(", ");
    const where: string[] = [place, people].filter((part: string): boolean => part !== "");
    const meta: HTMLElement = entryPartOf("span", "search-meta", [entryPartOf("span", "search-when",
        [`${weekday}, ${dateTextOf(day)}`, entryPartOf("span", "entry-parted", [`${timeOf(start)} – ${timeOf(end)}`])])]);
    if (where.length > 0)
        meta.append(entryPartOf("span", "search-where entry-parted", [where[0],
            ...where.slice(1).map((part: string): HTMLElement => entryPartOf("span", "entry-parted", [part]))]));
    const button: HTMLButtonElement = document.createElement("button");
    button.type = "button";
    button.className = "search-result";
    button.append(entryPartOf("span", "search-what", whatOf(entry.category, whatTextOf(entry))), meta);
    button.addEventListener("click", (): void => {
        resultOpen(calendar, entry).catch((error: unknown): void => console.error(error));
    });
    const item: HTMLLIElement = document.createElement("li");
    item.append(button);
    return item;
}

/**
 * Shows the entries that hold each word typed, newest first, every entry while nothing is typed.
 * - `words`: The words typed, see `wordsOf` in `../search.ts`.
 *
 * @param calendar - Calendar of the day
 */
function resultsShow(calendar: Calendar): void {
    const words: string[] = wordsOf((document.getElementById("search-text") as HTMLInputElement).value);
    (document.getElementById("search-results") as HTMLElement).replaceChildren(...entries
        .filter((entry: LogEntry): boolean => matchesAll(searchedOf(entry), words))
        .map((entry: LogEntry): HTMLLIElement => resultOf(calendar, entry)));
}

/**
 * Opens the search with what I typed last, its results at the place I left them, and reads the log anew,
 * so an entry changed from it, like a `Talk` with its people added, shows as it is now; a hint in the dialog
 * says when the reader cannot answer.
 * - `dialog`: The dialog of the search.
 * - `results`: The list of the results, which keeps where it was scrolled to.
 * - `scrolled`: Where it was scrolled to before it was read anew.
 * - `response`: The answer of the reader.
 * - {@link HTMLDialogElement#showModal}: Shows the search over the page, `Esc` and a click beside it close it.
 *
 * @param calendar - Calendar of the day
 */
async function searchOpen(calendar: Calendar): Promise<void> {
    const dialog: HTMLDialogElement = document.getElementById("search") as HTMLDialogElement;
    const results: HTMLElement = document.getElementById("search-results") as HTMLElement;
    const scrolled: number = results.scrollTop;
    dialog.showModal();
    const response: Response = await fetch("/api/day/all");
    document.getElementById("search-error")?.toggleAttribute("hidden", response.ok);
    if (!response.ok)
        return;
    entries = await response.json() as LogEntry[];
    resultsShow(calendar);
    results.scrollTop = scrolled;
}

/**
 * Waits until the calendar shows an entry, as it does once the log of its day is read.
 * - `found`: Gives the entry once the calendar has it, `null` before.
 * - `seen`: Looks for it after every change of the entries, see `eventsSet`.
 *
 * @param calendar - Calendar of the day
 * @param id - Identifier of the entry
 * @returns The entry, `null` when the calendar shows it not within 5 seconds
 */
function entryAwait(calendar: Calendar, id: string): Promise<EventApi | null> {
    return new Promise((found: (entry: EventApi | null) => void): void => {
        const seen: () => void = (): void => {
            const entry: EventApi | null = calendar.getEventById(id);
            if (entry === null)
                return;
            calendar.off("eventsSet", seen);
            found(entry);
        };
        calendar.on("eventsSet", seen);
        seen();
        window.setTimeout((): void => {
            calendar.off("eventsSet", seen);
            found(calendar.getEventById(id));
        }, 5000);
    });
}

/**
 * Shows the day of a result and opens the dialog of its entry there, after closing the search, which comes back
 * once that dialog closes, see {@link searchStart}; an entry the calendar does not show brings the search back
 * at once.
 * - `day`: The day of its start, like `2026-10-16`.
 * - `event`: The entry as the calendar shows it.
 *
 * @param calendar - Calendar of the day
 * @param entry - The entry of the result
 */
async function resultOpen(calendar: Calendar, entry: LogEntry): Promise<void> {
    const day: string = dayOf(new Date(entry.start));
    (document.getElementById("search") as HTMLDialogElement).close();
    if (dayOf(calendar.view.currentStart) !== day)
        calendar.gotoDate(day);
    const event: EventApi | null = await entryAwait(calendar, entry.id);
    if (event === null) {
        await searchOpen(calendar);
        return;
    }
    returning = true;
    await entryOpenEdit(event);
}

/**
 * Starts the search after the router has put the HTML of the day into the page: puts its dialog into the page,
 * its buttons open it, beside `Log +` and in the bar of a phone, what I type shows its results at once, and the dialog
 * of an entry opened from it brings it back when it closes.
 * - `buttons`: The buttons that open the search.
 *
 * @param calendar - Calendar of the day
 */
export function searchStart(calendar: Calendar): void {
    document.body.insertAdjacentHTML("beforeend", searchHtml);
    const buttons: HTMLElement[] = ["log-search", "day-search"]
        .map((id: string): HTMLElement => document.getElementById(id) as HTMLElement);
    buttons.forEach((button: HTMLElement): void => {
        iconPut(button, Search, "Search the log");
        button.addEventListener("click", (): void => {
            searchOpen(calendar).catch((error: unknown): void => console.error(error));
        });
    });
    document.getElementById("search-text")?.addEventListener("input", (): void => resultsShow(calendar));
    document.getElementById("entry")?.addEventListener("close", (): void => {
        if (!returning)
            return;
        returning = false;
        searchOpen(calendar).catch((error: unknown): void => console.error(error));
    });
}
