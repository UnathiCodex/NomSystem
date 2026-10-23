/**
 * ## Tutorials
 *
 * Shows the tutorials of my modules week by week, in the scheme of the food and the sport view, whose look it takes,
 * see `../food/food.css`. The bar of the shown week, as the day has its day: the number of the week small and grey
 * above its days, a breath further from them than a weekday from its date, like `Week 45` over
 * `02.11. – 08.11.2026`, between the arrows to the week before and after, a small icon beside it back to this week,
 * faded and off on this week.
 * Below it one card per module with groups and per type of its groups, see `reader/tutor.ts`, named as its folder is,
 * like `IN0009_BetriebssystemeSystemsoftware`, its type in brackets after it only for a module with groups of two
 * types, then every session of every group in the week, the earliest first, each one row: a circle, its weekday and
 * date, like `Fri 06.11.`, its times, like `12:00 – 14:00`, its group, like `Group 04`, then grey its room, a link
 * where it has one, and its tutor. The session I go to that week is marked, its circle filled and its row in the grey of a choice:
 * the one the box of the week goes to, else, in a week without box, that of the group I was at last; a session over
 * is grey; no word says why, the mark is enough.
 * A click on a session picks it for its week, see `weekPick` in `reader/course.ts`: the box of the week goes to it with
 * its day, its times, its room, its tutor and its group, a week without box getting one, and with no series yet my
 * series from that week on; a session over too, while its week is not logged, as where I was after all. A week I do
 * not touch follows the group I logged last, which the reader does as I log, see `groupFollow` there.
 * The marked session of an open box has the menu `⋯` with the words of the plan, `Log`, which logs it at its times,
 * and `Skip`, which drops it; logged, the check of the plan stands in its place, which takes the log back with one
 * click, as in the plan; skipped, the row of its group shows the cross and no session is marked, the cross taking it
 * back, and so does the crossed calendar of a tutorial the university cancelled, see `../day/boxes.ts`.
 * A week its groups do not meet, like in the holidays, says `No tutorial this week`; without any module with groups,
 * the view says so in place of its cards.
 * It opens on the week of today, which turns with today at 00:00, and while it shows this week it moves on with it;
 * only a link like `/tutor?date=2026-11-05` opens on the week of that day, see `../today.ts`. The week loads anew
 * the moment a file of my new system changes, see `../changes.ts`, like a tutorial logged on my phone.
 * Phones show no tutorials, since they show only the day, where I log the box of the week, see `../main.ts`.
 *
 * - `../day/entries.ts`: Skips a box and takes that back, and takes back a box the university cancelled.
 * - `../day/places.ts`: Gives the name of a room and shows it as a link to it.
 * - `../day/times.ts`: Writes a time and a day as its date, and gives the times a box is logged at.
 * - `../skill/attempts.ts`: Writes a date as a day.
 * - `../today.ts`: Gives today's calendar date and the day a link asks for, and moves the view on to the new week
 *   while it shows this week.
 * - `../changes.ts`: Loads the week anew the moment a file of my new system changes.
 * - `../food/foods.ts`: Makes elements.
 * - `../icons.ts`: Puts the icons into their buttons, their words as tooltip.
 * - `../menu.ts`: Puts `Log` and `Skip` behind one button `⋯`.
 * - `../reader.ts`: Asks the reader.
 * - `lucide`: The icons of the arrows, of this week and of the states of a box.
 * - `../food/food.css`: Look of the food view, which the tutorials view takes.
 * - `../day/boxes.css`: Look of the state of a box, as in the plan.
 * - `./tutor.css`: What the tutorials view adds to it.
 */

import { boxDrop, boxUniversity } from "../day/entries.ts";
import { labelOf, whereLinkedOf } from "../day/places.ts";
import { boxTimesOf, dateTextOf, timeOf } from "../day/times.ts";
import { dayOf } from "../skill/attempts.ts";
import { askedDayOf, calendarTodayOf, todayFollow } from "../today.ts";
import { changesFollow } from "../changes.ts";
import { elementOf } from "../food/foods.ts";
import { iconPut } from "../icons.ts";
import { menuItemOf, menuOf } from "../menu.ts";
import { readerAsk } from "../reader.ts";
import { CalendarCheck, CalendarOff, Check, ChevronLeft, ChevronRight, X } from "lucide";
import "../food/food.css";
import "../day/boxes.css";
import "./tutor.css";

import type { Box } from "../day/boxes.ts";
import type { Attendee } from "../day/entries.ts";
import type { IconNode } from "lucide";


/**
 * A session of a group in the week, as the reader sends it, see `TutorSession` in `reader/tutor.ts`: its group,
 * like `03`, its start as ISO instant, its length in minutes, the room of its group with its link, its platform online
 * with the link of its meeting, and its tutor.
 */
type Session = {
    group: string;
    start: string;
    minutes: number;
    location: string;
    locationLink: string;
    online: string;
    onlineLink: string;
    attendees: Attendee[];
};

/**
 * A card of the view, one type with groups of a module in the week, as the reader sends it, see `TutorCard`
 * in `reader/tutor.ts`: the folder of the module, the type, the sessions of its groups, the box of the week, `null`
 * for none, and the group I was at last before the week, empty for none.
 */
type Card = {
    module: string;
    type: string;
    sessions: Session[];
    box: Box | null;
    last: string;
};

/**
 * The tutorials of a week, as the reader sends them, see `TutorWeek` in `reader/tutor.ts`: its Monday and its cards.
 */
type Week = {
    monday: string;
    cards: Card[];
};


/**
 * A day of the week shown: today while it shows this week, so it moves on with today, else its Monday or the day
 * a link asked for, like `2026-11-05`.
 */
let shown: string = "";


/**
 * Gives the day some days after another, in local time.
 * - `year`, `month`, `date`: The day's parts.
 *
 * @param day - Day like `2026-11-05`
 * @param days - Days to go, like -7 for a week before
 * @returns Day like `2026-10-29`
 */
function dayAddOf(day: string, days: number): string {
    const [year, month, date]: number[] = day.split("-").map(Number);
    return dayOf(new Date(year, month - 1, date + days));
}

/**
 * Gives the Monday of the week of a day, which names its week.
 * - `year`, `month`, `date`: The day's parts.
 *
 * @param day - Day like `2026-11-05`
 * @returns Day like `2026-11-02`
 */
function mondayOf(day: string): string {
    const [year, month, date]: number[] = day.split("-").map(Number);
    return dayAddOf(day, -((new Date(year, month - 1, date).getDay() + 6) % 7));
}

/**
 * Gives the number of a week as the calendar counts it, ISO 8601: the week whose Thursday is the first of its year
 * is week 1, so the last days of December may belong to week 1 of the year after.
 * - `thursday`: The Thursday of the week, whose year the week belongs to.
 * - `year`, `month`, `date`: The Thursday's parts.
 * - `days`: Days from the first of January to that Thursday.
 *
 * @param monday - The Monday of the week, like `2026-11-02`
 * @returns Its number, like 45
 */
function weekNumberOf(monday: string): number {
    const thursday: string = dayAddOf(monday, 3);
    const [year, month, date]: number[] = thursday.split("-").map(Number);
    const days: number = (Date.UTC(year, month - 1, date) - Date.UTC(year, 0, 1)) / (24 * 60 * 60 * 1000);
    return Math.floor(days / 7) + 1;
}

/**
 * Writes the days of a week, its first and last day, the dash a space from either, its year once at the end, or at both
 * when the week runs into the next year.
 * - `sunday`: Its last day.
 *
 * @param monday - The Monday of the week, like `2026-11-02`
 * @returns Days like `02.11. – 08.11.2026`, or `28.12.2026 – 03.01.2027`
 */
function daysTextOf(monday: string): string {
    const sunday: string = dayAddOf(monday, 6);
    const first: string = monday.slice(0, 4) === sunday.slice(0, 4) ? dateTextOf(monday).slice(0, 6)
        : dateTextOf(monday);
    return `${first} – ${dateTextOf(sunday)}`;
}

/**
 * Writes the room of a place short, as the course of a module names it: a room of the university by its code, like
 * `2910.01.103` of `2910.01.103 (CIP-Raum)`, any other place by its name, like `LMU B 101`.
 *
 * @param line - Place as an entry writes it
 * @returns The room, empty for no place
 */
function roomOf(line: string): string {
    return /^\d{4}\.\S+\.\S+/.test(labelOf(line)) ? labelOf(line).split(" ")[0] : labelOf(line);
}

/**
 * Tells whether a session is over.
 *
 * @param session - The session
 * @returns Whether its end lies before now
 */
function overOf(session: Session): boolean {
    return Date.parse(session.start) + session.minutes * 60 * 1000 <= Date.now();
}

/**
 * Gives the session of a group in the week, on a day when one is given, else its first.
 * - `own`: The sessions of the group.
 *
 * @param card - The card
 * @param group - The group, like `04`, empty for none
 * @param day - The day, like `2026-11-06`, empty for any
 * @returns The session, `undefined` for none
 */
function sessionOf(card: Card, group: string, day: string): Session | undefined {
    const own: Session[] = card.sessions.filter((session: Session): boolean => group !== "" && session.group === group);
    return own.find((session: Session): boolean => dayOf(new Date(session.start)) === day) ?? own[0];
}

/**
 * Gives the session marked as the one I go to in the week, see the top of this file: the one the box of the week
 * goes to while it is open or logged, in a week without box that of the group I was at last; none for a box skipped
 * or cancelled by the university.
 *
 * @param card - The card
 * @returns The session, `undefined` for none
 */
function markedOf(card: Card): Session | undefined {
    if (card.box === null)
        return sessionOf(card, card.last, "");
    return card.box.state === "open" || card.box.state === "done" ? sessionOf(card, card.box.group, card.box.day)
        : undefined;
}

/**
 * Sends a change of the week to the reader and then shows the week anew, saying in the console when the reader does
 * not take it.
 *
 * @param send - Sends the change
 */
function act(send: () => Promise<unknown>): void {
    send().then((): void => weekOpen(shown)).catch((error: unknown): void => console.error(error));
}

/**
 * Asks the reader to change something, as JSON.
 *
 * @param address - Address at the reader, like `/api/tutor/pick`
 * @param body - What to change
 * @returns Answer of the reader
 * @throws {Error} - When the reader does not take it
 */
function changeSend(address: string, body: object): Promise<unknown> {
    return readerAsk<unknown>(address, { method: "POST", body: JSON.stringify(body) });
}

/**
 * Makes a button of the state of a box no longer open, as the plan shows it, see `stateOf` in `../day/boxes.ts`:
 * its icon with its word as tooltip, a click taking the state back.
 * - `button`: The button.
 *
 * @param icon - Its icon, like `Check`
 * @param word - Its word, like `Logged`
 * @param back - Takes the state back
 * @returns The button
 */
function stateButtonOf(icon: IconNode, word: string, back: () => Promise<unknown>): HTMLButtonElement {
    const button: HTMLButtonElement = document.createElement("button");
    button.type = "button";
    button.className = "box-state";
    iconPut(button, icon, word);
    button.addEventListener("click", (event: MouseEvent): void => {
        event.stopPropagation();
        act(back);
    });
    return button;
}

/**
 * Makes what stands at the right of a session, see the top of this file: on the marked session of an open box its
 * menu `⋯`, `Log` at the times of the box and `Skip`; on that of a logged box the check, which takes the log back;
 * on the session of the group of a box skipped the cross, of one the university cancelled the crossed calendar,
 * each taking that back; an empty place on any other.
 * - `box`: The box of the week, `null` for none.
 * - `start`, `end`: The times the box is logged at, see `boxTimesOf` in `../day/times.ts`.
 * - `menu`: The button `⋯` with its menu.
 *
 * @param card - The card
 * @param session - The session
 * @param marked - Whether it is the session marked
 * @returns What stands at its right
 */
function stateOf(card: Card, session: Session, marked: boolean): HTMLElement {
    const box: Box | null = card.box;
    if (box === null)
        return elementOf("span", "", "");
    if (marked && box.state === "open") {
        const [start, end]: [Date, Date] = boxTimesOf(box, new Date(`${box.day}T12:00:00`));
        const menu: HTMLElement = menuOf([
            menuItemOf(Check, "Log", (): void => act((): Promise<unknown> => changeSend("/api/day/logged",
                { box: box.id, start: start.toISOString(), end: end.toISOString() }))),
            menuItemOf(X, "Skip", (): void => act((): Promise<void> => boxDrop(box.id, true))),
        ]);
        menu.addEventListener("click", (event: MouseEvent): void => event.stopPropagation());
        return menu;
    }
    if (marked && box.state === "done")
        return stateButtonOf(Check, "Logged", (): Promise<unknown> => changeSend("/api/day/undone", { box: box.id }));
    if (session !== sessionOf(card, box.group, box.day))
        return elementOf("span", "", "");
    if (box.state === "dropped")
        return stateButtonOf(X, "Skipped", (): Promise<void> => boxDrop(box.id, false));
    if (box.state === "university")
        return stateButtonOf(CalendarOff, "Cancelled", (): Promise<void> => boxUniversity(box.id, false));
    return elementOf("span", "", "");
}

/**
 * Makes the row of a session, see the top of this file: its circle, its weekday and date, its times, its group, grey
 * its room or its platform online, a link where it has one, and its tutor, then what stands at its right,
 * see {@link stateOf}; marked while I go to it, grey once over; a click picks it for its week, but in a week logged
 * or cancelled by the university, and on the session of an open box, which it goes to already.
 * - `start`, `end`: Its start and end.
 * - `marked`: Whether it is the session marked.
 * - `box`: The box of the week, `null` for none.
 * - `fixed`: Whether a click does nothing.
 * - `row`: The row.
 * - `meta`: Its room and its tutor, apart by a middle dot.
 * - `tutor`: Its tutor, by name.
 *
 * @param card - The card
 * @param session - The session
 * @returns The row
 */
function rowOf(card: Card, session: Session): HTMLElement {
    const start: Date = new Date(session.start);
    const end: Date = new Date(start.getTime() + session.minutes * 60 * 1000);
    const marked: boolean = session === markedOf(card);
    const box: Box | null = card.box;
    const fixed: boolean = box !== null && (box.state === "done" || box.state === "university"
        || (marked && box.state === "open"));
    const row: HTMLElement = elementOf("div", "tutor-row", "");
    const meta: HTMLElement = elementOf("span", "tutor-meta", "");
    const tutor: string = session.attendees.map((attendee: Attendee): string => attendee.name).join(", ");
    meta.append(...whereLinkedOf("Skill", "", roomOf(session.location), session.locationLink, session.online,
        session.onlineLink),
        ...(tutor === "" ? [] : [elementOf("span", "entry-parted", tutor)]));
    row.classList.toggle("tutor-on", marked);
    row.classList.toggle("tutor-over", overOf(session));
    row.classList.toggle("tutor-fixed", fixed);
    row.append(
        elementOf("span", "tutor-ring", ""),
        elementOf("span", "", `${start.toLocaleDateString("en-GB", { weekday: "short" })} ${dateTextOf(dayOf(start))
            .slice(0, 6)}`),
        elementOf("span", "", `${timeOf(start)} – ${timeOf(end)}`),
        elementOf("span", "", `Group ${session.group}`),
        meta,
        stateOf(card, session, marked),
    );
    meta.querySelector("a")?.addEventListener("click", (event: MouseEvent): void => event.stopPropagation());
    if (!fixed)
        row.addEventListener("click", (): void => act((): Promise<unknown> => changeSend("/api/tutor/pick",
            { module: card.module, type: card.type, group: session.group, start: session.start })));
    return row;
}

/**
 * Makes the card of a type of a module, see the top of this file: its name, then the rows of its sessions,
 * or `No tutorial this week`.
 * - `section`: The card.
 *
 * @param card - The card
 * @param typed - Whether its module has groups of more than one type, so its name says its type
 * @returns The card
 */
function cardOf(card: Card, typed: boolean): HTMLElement {
    const section: HTMLElement = elementOf("section", "tutor-card", "");
    section.append(elementOf("h3", "tutor-module", typed ? `${card.module} (${card.type})` : card.module),
        ...(card.sessions.length === 0 ? [elementOf("p", "food-none", "No tutorial this week")]
            : card.sessions.map((session: Session): HTMLElement => rowOf(card, session))));
    return section;
}

/**
 * Draws the tutorials of the week shown, a card per module and type, or that no module has groups.
 * - `typed`: Gives whether a module has more than one card.
 *
 * @param week - The tutorials of the week
 */
function weekDraw(week: Week): void {
    const typed: (module: string) => boolean = (module: string): boolean =>
        week.cards.filter((card: Card): boolean => card.module === module).length > 1;
    document.getElementById("tutor-cards")?.replaceChildren(...week.cards.length === 0
        ? [elementOf("p", "food-none", "No module with tutorial groups yet")]
        : week.cards.map((card: Card): HTMLElement => cardOf(card, typed(card.module))));
}

/**
 * Shows the week of a day: writes its number and its days in the bar, turns the icon back to this week off on this
 * week, then loads its tutorials and draws them, unless another week was asked for meanwhile.
 * - `monday`: The Monday of the week.
 * - `week`: Its tutorials.
 *
 * @param date - A day of the week, like `2026-11-05`
 * @throws {Error} - When the reader cannot answer
 */
async function weekShow(date: string): Promise<void> {
    const monday: string = mondayOf(date);
    shown = date;
    (document.getElementById("tutor-week") as HTMLElement).textContent = `Week ${weekNumberOf(monday)}`;
    (document.getElementById("tutor-days") as HTMLElement).textContent = daysTextOf(monday);
    (document.getElementById("tutor-today") as HTMLButtonElement).disabled = monday === mondayOf(calendarTodayOf());

    const week: Week = await readerAsk<Week>(`/api/tutor/week?date=${date}`);
    if (date !== shown)
        return;
    weekDraw(week);
}

/**
 * Shows the week of a day, or a hint when the reader cannot read its tutorials.
 *
 * @param date - A day of the week, like `2026-11-05`
 */
function weekOpen(date: string): void {
    weekShow(date).catch((error: unknown): void => {
        console.error(error);
        document.getElementById("tutor-cards")?.replaceChildren(elementOf("p", "food-none",
            "The tutorials cannot be read"));
    });
}

/**
 * Shows the week some weeks before or after the one shown: today for this week, else its Monday.
 * - `monday`: The Monday of the week to show.
 * - `today`: Today's calendar date.
 *
 * @param weeks - Weeks to go, like -1 for the week before
 */
function weekMove(weeks: number): void {
    const monday: string = dayAddOf(mondayOf(shown), 7 * weeks);
    const today: string = calendarTodayOf();
    weekOpen(monday === mondayOf(today) ? today : monday);
}


/**
 * Starts the tutorials view after the router has put its HTML into the page: the arrows and the icon back to this week,
 * the week a link asks for or that of today, which moves on to the new week by itself while it is shown, see
 * `today.ts`, and loads anew after every change of the files, see `../changes.ts`.
 * - `before`, `after`, `today`: Buttons to the week before and after, and back to this week.
 */
export function tutorStart(): void {
    const before: HTMLElement = document.getElementById("tutor-before") as HTMLElement;
    const after: HTMLElement = document.getElementById("tutor-after") as HTMLElement;
    const today: HTMLElement = document.getElementById("tutor-today") as HTMLElement;
    iconPut(before, ChevronLeft, "Week before");
    iconPut(after, ChevronRight, "Week after");
    iconPut(today, CalendarCheck, "Back to this week");
    before.addEventListener("click", (): void => weekMove(-1));
    after.addEventListener("click", (): void => weekMove(1));
    today.addEventListener("click", (): void => weekOpen(calendarTodayOf()));
    weekOpen(askedDayOf() ?? calendarTodayOf());
    todayFollow((): string => shown, weekOpen);
    changesFollow((): void => weekOpen(shown));
}
