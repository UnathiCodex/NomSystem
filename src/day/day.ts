/**
 * ## Day
 *
 * Shows the log of a day as my one calendar, a time grid of one column, and beside it the plan of the day,
 * not as a calendar but as a calm list of boxes, see `boxes.ts`; above both the date of the day between its arrows,
 * with a small icon back to today on any other day;
 * at the right the trackers of the day, my sleep, my glasses of water and my food, and below them the daily note
 * with my gratitude and my points about the day at its top, which a phone leaves out, see `main.ts`.
 * A click on the date opens a month to pick any day from, see `month.ts`.
 * A box goes into the log at its real time by dragging it there, or as expected with one tap on its ring.
 * The log is written by category: `+` below the time grid opens the entry by category for the last half hour,
 * a range selected in the time grid for that range, on a phone by a short press into the grid and pulling it down
 * over the time, as in Google Calendar; a click on an entry changes it.
 * Entries are moved and resized by dragging, and the reader writes them back into their files.
 * Entries look as Google Calendar shows them: what first, then the time, then the place, in one size, the time a light
 * grey, and a taller one its note below, see {@link entryContentOf};
 * a dish, a meal or a cooking, lists its foods. The kcal of a meal stay hidden for a try; the dialog and the trackers
 * show them. A glass of water is no block but a small mark at the edge of the log,
 * since the counter of the trackers counts it.
 * The day opens on today's calendar date, which turns at 00:00, also after a reload, and while it shows today
 * it moves on with it; only a link to a day, like `/?date=2026-07-03` from the food view, opens on that day,
 * which the address then keeps no more, see `today.ts`.
 * The grid runs over the calendar day, from 00:00 to 24:00, and opens at 06:00; an entry past midnight shows on both
 * days, cut at midnight, like a sleep from 23:00 to 07:00 at the bottom of 12 October and at the top of 13 October,
 * see {@link dayStart}.
 *
 * - `fullcalendar`: Draws the calendar.
 * - `fullcalendar/timegrid`: Draws the time grid of the day.
 * - `fullcalendar/interaction`: Selects a time range, drags entries and takes boxes dropped from the list.
 * - `fullcalendar/themes/forma`: Look of the calendar, coloured by `variants.css`.
 * - `fullcalendar/locales/en-gb`: English names of days, months and buttons, the day before the month.
 * - `./note.ts`: Shows the daily note of a day, with its Markdown renderer; loaded with `import()`
 *   only with the daily note, so a phone never loads it, see {@link noteStart}.
 * - `./entries.ts`: Sends changed entries to the reader.
 * - `./categories.ts`: Writes the log by category, each field picked from its own list.
 * - `./meal.ts`: Names the category of meals.
 * - `./boxes.ts`: Shows the boxes of the day beside the log, logs a box dropped into it, and makes what an entry is.
 * - `./evening.ts`: Writes my gratitude and my points about the day into its daily note, any time of the day;
 *   loaded like `./note.ts`.
 * - `./month.ts`: Picks the day to show from a month.
 * - `./gifts.ts`: Writes my gift ideas for the birthdays and holidays of the plan.
 * - `./places.ts`: Gives the name of the place of an entry, the part of its line before the first comma.
 * - `./trackers.ts`: Shows my sleep, my glasses of water, my food and my neck sessions of the day.
 * - `./times.ts`: Reads the typed times of the panels, writes the times of entries and the date of the day.
 * - `../skill/attempts.ts`: Writes a date as a day in the form of the reader.
 * - `../today.ts`: Gives today's calendar date and the day a link asks for, and moves the day on to the new day
 *   while it shows today.
 * - `../icons.ts`: Puts the icons of the arrows and of `+` into their buttons.
 * - `../timer.ts`: Shows the timer of a session running now in the bar of the day.
 * - `lucide`: The icons of the arrows and plus.
 */

import { Calendar } from "fullcalendar";
import timeGridPlugin from "fullcalendar/timegrid";
import interactionPlugin from "fullcalendar/interaction";
import themePlugin from "fullcalendar/themes/forma";
import englishLocale from "fullcalendar/locales/en-gb";
import { entryChange } from "./entries.ts";
import { categoriesStart, cookName, entryOpen, entryOpenEdit, entryOpenNow } from "./categories.ts";
import { foodName } from "./meal.ts";
import { boxesSee, boxesStart, boxReceive, entryPartOf, shownWhatOf, whatOf } from "./boxes.ts";
import { breakableOf } from "./choices.ts";
import { monthStart } from "./month.ts";
import { giftsStart } from "./gifts.ts";
import { whereLinkedOf, whereOf } from "./places.ts";
import { trackersSee } from "./trackers.ts";
import { dateTextOf, timeOf, timesStart } from "./times.ts";
import { dayOf } from "../skill/attempts.ts";
import { askedDayOf, calendarTodayOf, todayFollow } from "../today.ts";
import { iconPut } from "../icons.ts";
import { timerStart } from "../timer.ts";
import { CalendarCheck, ChevronLeft, ChevronRight, Plus } from "lucide";
import "fullcalendar/skeleton.css";
import "fullcalendar/themes/forma/theme.css";
import "./day.css";

import type {
    DateSelectInfo, DateSpanApi, DatesSetInfo, EventApi, EventChangeInfo, EventClickInfo, EventDisplayInfo,
    EventInput, EventReceiveInfo, EventSourceInput,
} from "fullcalendar";


/**
 * Minutes of the time grid one line of a taller entry fills: half an hour of the grid is 2rem high, twice the margin
 * and once the line of an hour label, see `.slot-label` in `day.css`, and a line of a taller entry 1.05rem,
 * its text of 0.75rem at a line height of 1.4, see `.entry-inner`; so a line fills 15.75 minutes,
 * and the space of 0.5rem above its first line and 0.25rem below its last, 0.75rem, fills 11.25 minutes,
 * see {@link linesOf}: an entry of half an hour has room for one line, (30 - 11.25) / 15.75 = 1.19,
 * one of an hour for three, (60 - 11.25) / 15.75 = 3.1; a short one, as low as `eventShortHeight` in {@link dayStart}
 * or lower, has no space above and below its one line, 0.9rem high at a line height of 1.2,
 * so a quarter hour, 1rem high, holds it.
 */
const lineMinutes: number = 15.75;

/**
 * Shows the daily note of a day, like `2026-10-12`, with my gratitude and my points about the day;
 * does nothing until {@link noteStart} has loaded them, and so nothing on a phone, which shows no daily note.
 */
let dayNoteShow: (date: string) => void = (): void => {};

/**
 * Hours of the time grid, from 00:00 to 24:00 of the shown day, see `slotMinTime` and `slotMaxTime`.
 */
const gridHours: number = 24;


/**
 * Event source of the log of the reader. FullCalendar adds `start` and `end` of the shown day to the address,
 * and takes the field `editable` of each entry, so only entries that can be changed are dragged.
 * - `eventDataTransform`: Lets the entries that can be changed react to a click, see {@link entryClick};
 *   a glass of water shows as a background entry of the class `glass-mark`, which `day.css` draws as a small mark.
 *
 * @returns Event source for FullCalendar
 */
function logSourceOf(): EventSourceInput {
    return {
        id: "log",
        url: "/api/day/log",
        eventDataTransform: (entry: EventInput): EventInput => {
            if (entry.glass === true)
                return { ...entry, display: "background", className: "glass-mark" };
            return { ...entry, interactive: entry.editable === true };
        },
    };
}

/**
 * Opens the entry by category to change a clicked entry; one that cannot be changed, like an occurrence of a series
 * or an entry of the whole day, stays as it is.
 * - `startEditable`: Whether the entry can be changed, the field `editable` of the reader.
 *
 * @param info - Clicked entry
 */
function entryClick(info: EventClickInfo): void {
    if (info.event.startEditable === true)
        entryOpenEdit(info.event).catch((error: unknown): void => console.error(error));
}

/**
 * Writes an entry moved or resized by dragging into its file, with its fields as they were;
 * puts it back where it was when the reader does not take the change.
 *
 * @param calendar - Calendar of the day
 * @param info - Entry after dragging, with the way back
 */
function entryDrag(calendar: Calendar, info: EventChangeInfo): void {
    const entry: EventApi = info.event;
    entryChange(calendar, entry.id, {
        category: entry.extendedProps.category ?? "",
        title: entry.title,
        location: entry.extendedProps.location ?? "",
        from: entry.extendedProps.from ?? "",
        module: entry.extendedProps.module ?? "",
        type: entry.extendedProps.type ?? "",
        semester: entry.extendedProps.semester ?? "",
        note: entry.extendedProps.note ?? "",
        foods: entry.extendedProps.foods ?? [],
        planned: "",
        start: entry.start as Date,
        end: entry.end as Date,
    }).catch((error: unknown): void => {
        console.error(error);
        info.revert();
    });
}

/**
 * Lists the foods of a dish, a meal or a cooking: a meal's from its lines `X-FOOD`, like `Haferflocken`
 * of `Haferflocken;60`, the foods of one of my meals once by the name of that meal, which their lines carry after
 * their grams, like `ChiliConCarne` of `Hackfleisch;125;ChiliConCarne;1;09.10.2026` and `Salz;ChiliConCarne;1`,
 * see `meal.ts`;
 * else from its what, parted by `, `, like `Reis`, `Bohnen` and `Eier` of `Reis, Bohnen, Eier`.
 * - `category`: Category of the entry.
 * - `foods`: Lines `X-FOOD` of the entry, none when it lists none.
 * - `names`: The names listed so far.
 * - `parts`, `grams`, `meal`: The parts of a line, whether its second is grams, and the meal it carries, empty for none.
 *
 * @param event - Entry
 * @returns Foods and meals in their order, none for an entry that is no dish
 */
function dishOf(event: EventApi): string[] {
    const category: string = event.extendedProps.category ?? "";
    const foods: string[] = event.extendedProps.foods ?? [];
    const names: string[] = [];
    if (category !== foodName && category !== cookName)
        return [];
    if (foods.length === 0)
        return event.title.split(", ");
    foods.forEach((food: string): void => {
        const parts: string[] = food.split(";").map((part: string): string => part.trim());
        const grams: boolean = /^~?\s*\d+(?:[.,]\d+)?$/.test(parts[1] ?? "");
        const meal: string = (grams ? parts[2] : parts.length >= 3 ? parts[1] : "") ?? "";
        if (meal === "")
            names.push(parts[0]);
        else if (names.at(-1) !== meal)
            names.push(meal);
    });
    return names;
}

/**
 * Lines an entry of the time grid has room for, its shown part less the space of 0.75rem above and below its lines,
 * see {@link lineMinutes}: an entry of a quarter hour or half an hour has room for one line,
 * (30 - 11.25) / 15.75 = 1.19, one of 45 minutes for two, (45 - 11.25) / 15.75 = 2.14, one of an hour for three,
 * and a Sleep from 23:00 to 07:00 on 12 October, shown from 23:00 to 24:00, for (60 - 11.25) / 15.75 = 3,
 * not 29 for its whole 8 hours.
 * A short entry, see `eventShortHeight` in {@link dayStart}, has room for one line, its space above and below left out.
 * - `start`, `end`: Start and end of the entry.
 * - `day`: Midnight of the shown day, where the grid starts.
 * - `top`, `bottom`: Start and end of the entry cut to the grid, from 00:00 to 24:00 of the shown day,
 *   like 23:00 to 24:00 for that Sleep.
 *
 * @param info - Entry of the time grid with its render details
 * @returns Lines, at least 1
 */
function linesOf(info: EventDisplayInfo): number {
    const start: Date = info.event.start as Date;
    const end: Date = info.event.end ?? start;
    const day: Date = info.view.currentStart;
    const top: number = Math.max(start.getTime(), day.getTime());
    const bottom: number =
        Math.min(end.getTime(), new Date(day.getFullYear(), day.getMonth(), day.getDate() + 1).getTime());
    if (info.isShort)
        return 1;
    return Math.max(1, Math.floor(((bottom - top) / (60 * 1000) - 11.25) / lineMinutes));
}

/**
 * Content of an entry of the log, as Google Calendar shows one: what first in bold, see {@link whatOf}, then its time
 * in normal weight and the light grey of a time, then its place lighter still; a dish lists its foods,
 * see {@link dishOf}, parted by commas. Every entry shows its place by its label alone, its address hidden,
 * a way its route, see `whereOf` in `places.ts`; a place with a link opens it on a click, see `whereLinkedOf`.
 * What is never cut and the time never cut; only the place gives way where a line is too narrow,
 * cut with an ellipsis, see `day.css`.
 * An entry of the whole day shows only what it was.
 * - An entry with room for one line, of a quarter hour or half an hour, see {@link linesOf}, shows what,
 *   then its start and end, then its place, parted by a middle dot with space on both sides, which `day.css` draws,
 *   never by commas, since names hold commas,
 *   like `Skill: IN0004_EinfuehrungRechnerarchitektur (VO) · 16:00 – 16:30 · 8120.01.101 (Audimax im Galileo)`;
 *   where an entry is narrower than what and its time, as on a phone, what stays whole and its time moves
 *   onto a next line, which the entry hides, and only what wider than the whole entry ends with an ellipsis.
 * - An entry with room for two lines, of 45 minutes, shows what on its first line and start and end on its second
 *   with its place after a dot, like `16:00 – 16:45 · 8120.01.101 (Audimax im Galileo)`, both lines centred
 *   in the entry, see `entry-inner-middle` in {@link dayStart}.
 * - An entry with room for three lines or more shows what, start and end and its place on lines of their own
 *   from its top, and below them its note, as many lines of it as are left, cut with an ellipsis;
 *   no place line when it has none, no note when it has none or no whole line is left.
 * Where what is wider than the entry, as on a phone, it takes a line more, broken where a word ends or, for a long name
 * like `IN0004_EinfuehrungRechnerarchitektur`, where its parts meet, see {@link breakableOf}; the lines below then
 * move down, and those the entry has no more room for stay hidden, see `.entry-lines` in `day.css`.
 * - `category`: Category of the entry, empty for an entry without one.
 * - `foods`: Foods of a dish, none for any other entry.
 * - `what`: What the entry was, a skill entry as its file writes it, like `IN0004_EinfuehrungRechnerarchitektur (VO)`,
 *   see `shownWhatOf` in `boxes.ts`, its foods for a dish, empty when it is its category, like an old `Sleep`
 *   written before it had its what.
 * - `from`: Where a way starts, its `X-FROM`, empty for none.
 * - `location`: Place of the entry, its `LOCATION`, like `HomeMunich, Burgweg 1, 81375 München, Deutschland`.
 * - `place`: Place of the entry by its label, like `HomeMunich`, for a way its route from its `X-FROM`,
 *   like `HomeMunich -> TumGarching`, see `whereOf` in `places.ts`, shown with its arrow drawn; empty when it has none.
 * - `link`: Link of the place, its `ALTREP`, like `https://nav.tum.de/room/8120.01.101`, empty for none.
 * - `note`: Note of the entry, its `DESCRIPTION`, empty when it has none.
 * - `start`, `end`: Start and end of the entry.
 * - `time`: Start and end, like `16:00 – 16:30`.
 * - `lines`: Lines the entry has room for, see {@link linesOf}.
 * - `whole`: What on its own lines, where its long names may break, see {@link breakableOf}.
 * - `shown`: The lines of the entry, which `.entry-lines` holds to the lines it has room for.
 * - `line`: The one line of an entry with room for one: what, its time and its place, in parts beside each other,
 *   see `.entry-line` in `day.css`.
 * - `timeLine`: The line with the time, alone or with its place beside it.
 * - `below`: The note below the lines shown, grey, its line clamp the lines left, see `.entry-note` in `day.css`.
 * - `content`: All lines, as high as the lines the entry has room for, so a line moved down by what taking two lines
 *   is hidden as a whole and never shows cut in half at the bottom of the entry; how many in `data-lines`,
 *   fitted to the part of the entry in sight once it is on the page, see {@link linesFit}.
 *
 * @param info - Entry with its render details
 * @returns Lines of the entry for FullCalendar
 */
function entryContentOf(info: EventDisplayInfo): { domNodes: HTMLElement[] } {
    const category: string = info.event.extendedProps.category ?? "";
    const foods: string[] = dishOf(info.event);
    let what: string = shownWhatOf(category, info.event.title, info.event.extendedProps.module ?? "",
        info.event.extendedProps.type ?? "");
    if (foods.length > 0)
        what = foods.join(", ");
    else if (what === category)
        what = "";
    const from: string = info.event.extendedProps.from ?? "";
    const location: string = info.event.extendedProps.location ?? "";
    const place: string = whereOf(category, from, location);
    const link: string = info.event.extendedProps.locationLink ?? "";
    const note: string = (info.event.extendedProps.note ?? "").trim();
    const start: Date = info.event.start as Date;
    const end: Date = info.event.end ?? start;

    if (info.event.allDay)
        return { domNodes: [entryPartOf("div", "entry-title", whatOf(category, what))] };
    const time: string = `${timeOf(start)} – ${timeOf(end)}`;
    const lines: number = linesOf(info);
    const whole: (string | Node)[] = whatOf(category, breakableOf(what));
    let shown: HTMLElement[];
    if (lines < 2) {
        const line: HTMLElement = entryPartOf("div", "entry-line", [
            entryPartOf("span", "entry-what", whatOf(category, what)),
            entryPartOf("span", "entry-time entry-parted", [time]),
        ]);
        if (place !== "")
            line.append(entryPartOf("span", "entry-place entry-parted entry-beside",
                whereLinkedOf(category, from, location, link)));
        shown = [line];
    } else if (lines === 2) {
        const timeLine: HTMLElement = entryPartOf("div", "entry-line", [entryPartOf("span", "entry-time", [time])]);
        if (place !== "")
            timeLine.append(entryPartOf("span", "entry-place entry-parted entry-beside",
                whereLinkedOf(category, from, location, link)));
        shown = [entryPartOf("div", "entry-whole", whole), timeLine];
    } else {
        shown = [entryPartOf("div", "entry-whole", whole), entryPartOf("div", "entry-time", [time])];
        if (place !== "")
            shown.push(entryPartOf("div", "entry-place", whereLinkedOf(category, from, location, link)));
        if (note !== "" && lines > shown.length) {
            const below: HTMLElement = entryPartOf("div", "entry-note", [note]);
            below.style.webkitLineClamp = String(lines - shown.length);
            shown.push(below);
        }
    }
    const content: HTMLElement = entryPartOf("div", "entry-lines", shown);
    content.style.maxHeight = `${lines}lh`;
    content.dataset.lines = String(lines);
    requestAnimationFrame((): void => linesFit(content, gridOf(content)));
    return { domNodes: [content] };
}

/**
 * Fits the lines of an entry to the part of it in sight: scrolled partly out of sight at the top, an entry keeps
 * its lines 0.5rem below the top of the grid, as `.entry-lines` in `day.css` makes them stick, and those its rest
 * has no more room for, less the space below them, hide as a whole from the bottom, so no line is ever cut
 * at the top and `Sleep: Night` stays in sight the longest; an entry in sight keeps the lines it has room for.
 * - `inside`: Inside of the entry, with the space above and below its lines.
 * - `top`: Where the lines stick, 0.5rem below the top of the grid.
 * - `bottom`: Where the space below the lines begins.
 * - `room`: Whole lines between them.
 *
 * @param lines - All lines of an entry, how many it has room for in `data-lines`, see {@link entryContentOf}
 * @param grid - Grid of the log, which scrolls the entries
 */
function linesFit(lines: HTMLElement, grid: HTMLElement): void {
    const inside: HTMLElement = lines.parentElement as HTMLElement;
    const top: number = grid.getBoundingClientRect().top + parseFloat(getComputedStyle(lines).top);
    const bottom: number = inside.getBoundingClientRect().bottom - parseFloat(getComputedStyle(inside).paddingBottom);
    const room: number = Math.floor((bottom - top) / parseFloat(getComputedStyle(lines).lineHeight));
    lines.style.maxHeight = `${Math.max(0, Math.min(Number(lines.dataset.lines), room))}lh`;
}

/**
 * The grid of the log around an element in it: the nearest box around it that scrolls.
 *
 * @param element - An element in the grid, like the lines of an entry
 * @returns The grid, the whole page for an element no longer on it
 */
function gridOf(element: HTMLElement): HTMLElement {
    let grid: HTMLElement = element;
    while (grid.parentElement !== null && getComputedStyle(grid).overflowY !== "auto")
        grid = grid.parentElement;
    return grid;
}

/**
 * Shows the date of the shown day above plan and log, its weekday short and its date in my standard way,
 * like `Sun, 11.10.2026`, always fully readable, with the icon back to today on any other day,
 * see {@link todayButtonShow}, and its daily note, gratitude and points about the day, see {@link dayNoteShow};
 * the boxes and the trackers follow the entries of the log, see `eventsSet` in {@link dayStart}.
 * The comma after the weekday is drawn by `day.css`, which on a phone puts the weekday above the date instead.
 * - `weekday`: Weekday of the shown day, like `Sun`, from the day at noon.
 *
 * @param info - Range of the shown day
 */
function dayShow(info: DatesSetInfo): void {
    const date: string = info.startStr.slice(0, 10);
    const weekday: string = new Date(`${date}T12:00:00`).toLocaleDateString("en-GB", { weekday: "short" });
    (document.getElementById("day-weekday") as HTMLElement).textContent = weekday;
    (document.getElementById("day-date") as HTMLElement).textContent = dateTextOf(date);
    todayButtonShow(date);
    dayNoteShow(date);
}

/**
 * Turns the small icon back to today beside the date on while the shown day is another than today's calendar date;
 * on today, like 13.10.2026 on that day, it shows faded and off, so the bar looks the same on every day, see
 * `.day-today` in `day.css`; also once the day turned at 00:00 while the day stays, see `todayFollow` in `today.ts`.
 *
 * @param date - Shown day, like `2026-10-13`
 */
function todayButtonShow(date: string): void {
    (document.getElementById("day-today") as HTMLButtonElement).disabled = date === calendarTodayOf();
}

/**
 * Shows plan or log on a phone, one at a time, see `.day-switch` in `day.css`, the button of the shown one picked;
 * the time grid, which measures itself again once it shows, scrolls to now then, see {@link nowCenter}.
 * - `main`: Plan and log with their bar, which `day.css` shows one of by its `data-shown`.
 *
 * @param calendar - Calendar of the day
 * @param shown - `plan` or `log`
 */
function phoneShow(calendar: Calendar, shown: "plan" | "log"): void {
    const main: HTMLElement = document.getElementById("day-main") as HTMLElement;
    main.dataset.shown = shown;
    document.getElementById("day-show-plan")?.setAttribute("aria-pressed", String(shown === "plan"));
    document.getElementById("day-show-log")?.setAttribute("aria-pressed", String(shown === "log"));
    if (shown === "log")
        nowCenter(calendar);
}

/**
 * Scrolls the time grid so that now stands in its middle, at each load of the page and when the day moves on
 * to the new day by itself, like 14:00 in the middle of 13.10.2026; at 00:20 today's page is 14 October,
 * whose grid cannot scroll above 00:00, so now simply stands near its top.
 * A day without now keeps `scrollTime`, 06:00 at the top. It hands the time for the top to `scrollToTime`,
 * which FullCalendar keeps and applies again once it has measured the grid, so nothing undoes it.
 * - `hours`: Hours from the top of the grid, 00:00 of the shown day, to now, like 14.5 for 14:30.
 * - `hourHeight`: Height of an hour of the grid in pixels, two half hours of 2rem, see {@link lineMinutes}.
 * - `visibleHours`: Hours the grid shows at once, from the height of its box, like 9.4.
 *
 * @param calendar - Calendar of the day
 */
function nowCenter(calendar: Calendar): void {
    const hours: number = (Date.now() - calendar.view.currentStart.getTime()) / (60 * 60 * 1000);
    if (hours < 0 || hours > gridHours)
        return;
    const hourHeight: number = 4 * parseFloat(getComputedStyle(document.documentElement).fontSize);
    const visibleHours: number = (document.getElementById("day-calendar") as HTMLElement).clientHeight / hourHeight;
    calendar.scrollToTime({ hours: hours - visibleHours / 2 });
}

/**
 * Loads the daily note with `import()`, its Markdown renderer with it, starts my gratitude and my points
 * about the day, and shows them for the shown day and from then on for every day shown, see {@link dayShow}.
 * `evening.ts` comes first, since it loads `note.ts` too, which is then at hand at once.
 * - `evening`: Writes my gratitude and my points about the day, see `evening.ts`.
 * - `note`: Shows the daily note of a day, see `note.ts`.
 *
 * @param calendar - Calendar of the day, for the shown day
 */
async function noteStart(calendar: Calendar): Promise<void> {
    const evening: { eveningShow: (day: string) => Promise<void>; eveningStart: () => void } =
        await import("./evening.ts");
    const note: { noteShow: (date: string) => Promise<void> } = await import("./note.ts");
    evening.eveningStart();
    dayNoteShow = (date: string): void => {
        note.noteShow(date).catch((error: unknown): void => console.error(error));
        evening.eveningShow(date).catch((error: unknown): void => console.error(error));
    };
    dayNoteShow(dayOf(calendar.view.currentStart));
}

/**
 * Starts the day after the router has put its HTML into the page, on the day a link asks for or today's calendar date,
 * see `askedDayOf` in `today.ts`:
 * the arrows beside the date above plan and log move the calendar by a day, the icon beside it back to today,
 * the date opens the month to pick a day from, `+` below the time grid opens the entry by category of the log
 * for the last half hour; on a phone the buttons at the bottom switch between plan and log, see {@link phoneShow},
 * and their `+` starts a box or an entry of the shown one; while it shows today, the day moves on to the new day
 * by itself, now centred again, see `todayFollow` in `today.ts`, and while it shows another day, the icon back
 * to today follows the new day. While the grid scrolls, the lines of every entry fit to the part of it in sight,
 * see {@link linesFit}; the calendar catches the scroll on its way down to the grid, `capture`, since it never rises.
 * - `initialView`: A time grid of the shown day, one column, the log.
 * - `headerToolbar`: None, since the date and its buttons stand above plan and log together, see {@link dayShow}.
 * - `dayHeaders`: Leaves out the name of the day above the column, which the date above says already.
 * - `slotHeaderInnerClass`: Adds the class `slot-label` to the hour labels,
 *   so `day.css` sets their size and with it the height of the slots.
 * - `slotHeaderFormat`: Writes the hours in 24-hour form, like `14:00`; the entries write their times themselves.
 * - `eventContent`: Shows what an entry was, then its time and its place, see {@link entryContentOf}.
 * - `eventShortHeight`: Makes entries short that have no room for one line with the space above and below it,
 *   as high as 39 px in the grid or lower at the page's root size of 20 px: such a line needs 36 px, 0.5rem above,
 *   a line of 1.05rem and 0.25rem below, see `.entry-inner` in `day.css`, and the inside of an entry is 3 px lower
 *   than its place in the grid; so they show their one line without that space, like an entry of a quarter hour;
 *   one of half an hour, 41 px, is taller and shows its one line with it, see {@link entryContentOf}.
 * - `eventMinHeight`: Makes every entry at least as high as a quarter hour, 20 px, one line of an entry with its edge,
 *   so a shorter one, like ten minutes of my neck routine, still shows its line whole.
 * - `eventColor`: Edges the entries in the grey of the log from `variants.css`.
 * - `blockEventClass`: Adds the class `entry` to the entries,
 *   so `day.css` fills them in grey and only their edge keeps the grey of the log.
 * - `blockEventInnerClass`: Adds the class `entry-inner` to the inside of the entries,
 *   so `day.css` sets the size of their lines and cuts them at the edge of the entry instead of letting them stick out,
 *   and `entry-inner-short` to the inside of short ones, which takes away the space above and below their one line
 *   and keeps it 0.9rem high, and `entry-inner-middle` to the inside of those with room for two lines,
 *   of 45 minutes, which centres their two lines in the entry, see {@link linesOf}.
 * - `eventSources`: The log, see {@link logSourceOf}.
 * - `editable`: Lets entries be moved and resized, those that the reader marks `editable`.
 * - `snapDuration`: Moves, resizes and selects in steps of 15 minutes, while the grid keeps a line every 30 minutes.
 * - `eventDrop`, `eventResize`: Write a moved or resized entry back, see {@link entryDrag}.
 * - `droppable`: Takes the boxes dragged from the list.
 * - `eventAllow`: Takes boxes and entries only in the time grid, not in the row of the whole day.
 * - `eventReceive`: Logs a box dropped into the log at the time of the drop, see `boxes.ts`.
 * - `eventsSet`: Tells the boxes the entries of the shown day, after every change.
 * - `eventSourceSuccess`: Loads the trackers again each time the log was read, see `trackersSee` in `trackers.ts`.
 * - `eventClick`: Opens the entry by category for an entry that can be changed, see {@link entryClick}.
 * - `select`: Opens the entry by category for a range selected in the time grid.
 * - `selectAllow`: Allows selecting a time range, but not in the row of the whole day.
 * - `selectLongPressDelay`: Starts a selection on a phone after a short press of 300 ms, in place of FullCalendar's
 *   long press of a second, so a finger presses into the time grid and pulls the range down over the time,
 *   as in Google Calendar; a swipe moves at once, so it scrolls the grid, and once the grid scrolled FullCalendar
 *   selects nothing. An entry keeps the long press of a second before it is dragged, so a slow tap never moves it.
 * - `nowIndicatorLineClass`, `nowIndicatorDotClass`: Add the classes `now-line` and `now-dot` to the line of now
 *   and its dot, so `day.css` draws them calm grey behind the entries, never through their text.
 * - `slotMinTime`, `slotMaxTime`: Run the grid over the calendar day, 00:00 to 24:00, as the trackers and the done
 *   boxes count it; an entry past midnight shows on both days, cut at midnight.
 * - `scrollTime`: Scrolls the grid to 06:00 at the start, for a day that does not hold now; today centres on now instead, see {@link nowCenter}.
 *
 * The theme keeps its own classes beside `slot-label`, `entry`, `entry-inner` and the others;
 * `day.css` wins because it comes after the theme's stylesheet.
 *
 * @param note - Whether the day shows its daily note, see {@link noteStart}, and the timer of a session, see
 *   `timer.ts`; never on a phone
 */
export function dayStart(note: boolean): void {
    const calendar: Calendar = new Calendar(document.getElementById("day-calendar") as HTMLElement, {
        plugins: [timeGridPlugin, interactionPlugin, themePlugin],
        locale: englishLocale,
        initialView: "timeGridDay",
        initialDate: askedDayOf() ?? calendarTodayOf(),
        height: "100%",
        headerToolbar: false,
        dayHeaders: false,
        allDayText: "",
        slotHeaderFormat: { hour: "2-digit", minute: "2-digit", hour12: false },
        slotHeaderInnerClass: "slot-label",
        eventContent: entryContentOf,
        eventShortHeight: 39,
        eventMinHeight: 20,
        eventColor: "var(--log)",
        blockEventClass: "entry",
        blockEventInnerClass: (info: EventDisplayInfo): string => {
            if (info.isShort)
                return "entry-inner entry-inner-short";
            return linesOf(info) === 2 ? "entry-inner entry-inner-middle" : "entry-inner";
        },
        eventSources: [logSourceOf()],
        editable: true,
        snapDuration: "00:15:00",
        eventDrop: (info: EventChangeInfo): void => entryDrag(calendar, info),
        eventResize: (info: EventChangeInfo): void => entryDrag(calendar, info),
        droppable: true,
        eventAllow: (span: DateSpanApi): boolean => !span.allDay,
        eventReceive: (info: EventReceiveInfo): void => boxReceive(calendar, info),
        eventsSet: (events: EventApi[]): void => boxesSee(calendar, events),
        eventSourceSuccess: (): void => trackersSee(calendar),
        eventClick: entryClick,
        selectable: true,
        selectAllow: (span: DateSpanApi): boolean => !span.allDay,
        selectLongPressDelay: 300,
        select: (info: DateSelectInfo): void => {
            entryOpen(info.start, info.end).catch((error: unknown): void => console.error(error));
        },
        nowIndicator: true,
        nowIndicatorLineClass: "now-line",
        nowIndicatorDotClass: "now-dot",
        slotMinTime: "00:00:00",
        slotMaxTime: "24:00:00",
        scrollTime: "06:00:00",
        datesSet: dayShow,
    });

    calendar.render();
    nowCenter(calendar);
    iconPut(document.getElementById("day-back") as HTMLElement, ChevronLeft, "Day before");
    iconPut(document.getElementById("day-next") as HTMLElement, ChevronRight, "Day after");
    iconPut(document.getElementById("log-new") as HTMLElement, Plus, "New entry");
    iconPut(document.getElementById("day-today") as HTMLElement, CalendarCheck, "Back to today");
    iconPut(document.getElementById("day-new") as HTMLElement, Plus, "New box or entry");
    document.getElementById("day-show-plan")?.addEventListener("click", (): void => phoneShow(calendar, "plan"));
    document.getElementById("day-show-log")?.addEventListener("click", (): void => phoneShow(calendar, "log"));
    document.getElementById("day-new")?.addEventListener("click", (): void => {
        const shown: string = (document.getElementById("day-main") as HTMLElement).dataset.shown ?? "plan";
        document.getElementById(shown === "log" ? "log-new" : "plan-new")?.click();
    });
    document.getElementById("day-back")?.addEventListener("click", (): void => calendar.prev());
    document.getElementById("day-today")?.addEventListener("click", (): void => calendar.gotoDate(calendarTodayOf()));
    document.getElementById("day-next")?.addEventListener("click", (): void => calendar.next());
    document.getElementById("day-calendar")?.addEventListener("scroll", (event: Event): void => {
        const grid: HTMLElement = event.target as HTMLElement;
        for (const lines of grid.querySelectorAll<HTMLElement>(".entry-lines"))
            linesFit(lines, grid);
    }, { capture: true });
    document.getElementById("log-new")?.addEventListener("click", (): void => {
        entryOpenNow(calendar).catch((error: unknown): void => console.error(error));
    });
    categoriesStart(calendar);
    boxesStart(calendar);
    monthStart(document.getElementById("day-title") as HTMLElement, (): string[] => [dayOf(calendar.view.currentStart)],
        (day: string): void => calendar.gotoDate(day));
    todayFollow((): string => dayOf(calendar.view.currentStart), (day: string): void => {
        calendar.gotoDate(day);
        nowCenter(calendar);
    }, (): void => todayButtonShow(dayOf(calendar.view.currentStart)));
    giftsStart();
    timesStart();
    if (note) {
        noteStart(calendar).catch((error: unknown): void => console.error(error));
        timerStart();
    }
}
