/**
 * ## Day
 *
 * Shows the log of a day as my one calendar, a time grid of one column, and beside it the plan of the day,
 * not as a calendar but as a calm list of boxes, see `boxes.ts`; above both the arrows, `Today` and the date of the day;
 * at the right the trackers of the day, my sleep, my glasses of water and my food, and below them the daily note
 * with my gratitude and my paragraph about the day at its top, which a phone leaves out, see `main.ts`.
 * A click on the date opens a month to pick any day from, see `month.ts`.
 * A box goes into the log at its real time by dragging it there, or as expected with one tap on its ring.
 * The log is written by category: `+` above the time grid opens the entry by category for the last half hour,
 * a range selected in the time grid for that range; a click on an entry changes it.
 * Entries are moved and resized by dragging, and the reader writes them back into their files.
 * Entries look as Google Calendar shows them: what first, then the time, in one size, the time a light grey,
 * and a taller one its place and its note below, see {@link entryContentOf};
 * a dish, a meal or a cooking, lists its foods. The kcal of a meal stay hidden for a try; the dialog and the trackers
 * show them. A glass of water is no block but a small mark at the edge of the log,
 * since the counter of the trackers counts it.
 * The day opens on today's calendar date, which turns at 00:00, also after a reload, and while it shows today
 * it moves on with it; only a link to a day, like `/?date=2026-07-03` from the week, opens on that day,
 * which the address then keeps no more, see `today.ts`.
 * The grid runs from 00:00 to 05:00 of the next day and opens at 06:00, so an entry can be pulled past midnight
 * at its bottom and the hours after midnight show on both days, like a sleep from 01:00 at the bottom of 12 October
 * and at the top of 13 October; the trackers count it once, for the calendar day of its start, 13 October,
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
 * - `./evening.ts`: Writes my gratitude and my paragraph about the day into its daily note, any time of the day;
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
import { boxesSee, boxesStart, boxReceive, entryPartOf, whatOf } from "./boxes.ts";
import { monthStart } from "./month.ts";
import { giftsStart } from "./gifts.ts";
import { wayName, whereOf } from "./places.ts";
import { trackersSee } from "./trackers.ts";
import { dateTextOf, timeOf, timesStart } from "./times.ts";
import { dayOf } from "../skill/attempts.ts";
import { askedDayOf, calendarTodayOf, todayFollow } from "../today.ts";
import { iconPut } from "../icons.ts";
import { ChevronLeft, ChevronRight, Plus } from "lucide";
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
 * see {@link entryContentOf}: an entry of half an hour has room for one line, (30 - 11.25) / 15.75 = 1.19,
 * one of an hour for three, (60 - 11.25) / 15.75 = 3.1; a short one, as low as `eventShortHeight` in {@link dayStart}
 * or lower, has no space above and below its one line, 0.9rem high at a line height of 1.2,
 * so a quarter hour, 1rem high, holds it.
 */
const lineMinutes: number = 15.75;

/**
 * Shows the daily note of a day, like `2026-10-12`, with my gratitude and my paragraph about the day;
 * does nothing until {@link noteStart} has loaded them, and so nothing on a phone, which shows no daily note.
 */
let dayNoteShow: (date: string) => void = (): void => {};

/**
 * Hours of the time grid, from 00:00 of the shown day to 05:00 of the next, see `slotMinTime` and `slotMaxTime`.
 */
const gridHours: number = 29;


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
 * of `Haferflocken;60`, else from its what, parted by `, `, like `Reis`, `Bohnen` and `Eier` of `Reis, Bohnen, Eier`.
 * - `category`: Category of the entry.
 * - `foods`: Lines `X-FOOD` of the entry, none when it lists none.
 *
 * @param event - Entry
 * @returns Foods in their order, none for an entry that is no dish
 */
function dishOf(event: EventApi): string[] {
    const category: string = event.extendedProps.category ?? "";
    const foods: string[] = event.extendedProps.foods ?? [];
    if (category !== foodName && category !== cookName)
        return [];
    return foods.length > 0 ? foods.map((food: string): string => food.split(";")[0].trim()) : event.title.split(", ");
}

/**
 * Content of an entry of the log, as Google Calendar shows one: what first, then the time,
 * both in one size, the time a light grey, see {@link whatOf}; a dish lists its foods, see {@link dishOf},
 * parted by commas.
 * An entry of the whole day shows only what it was.
 * - A short entry, one line high, shows what, then its start after a comma, like `Talk: Planungen, 05:15`;
 *   what ends with an ellipsis where the line is cut, the time never, see `day.css`.
 * - A taller one with room for one line shows the same line with start and end,
 *   like `Skill: WokFlow, 20:00 – 20:30`.
 * - A taller one with room for two lines or more shows what on its first line, as written,
 *   like `Skill: IN2028_BusinessAnalyticsMachineLearning (VO)`,
 *   cut with an ellipsis, its start and end on the second, like `20:00 – 23:45`, with room for three lines
 *   its place on the third, like `HomeMunich`, cut with an ellipsis, and below them its note, as many lines of it
 *   as are left, cut with an ellipsis; no place when it has none, no note when it has none or no whole line is left.
 * - `category`: Category of the entry, empty for an entry without one.
 * - `foods`: Foods of a dish, none for any other entry.
 * - `what`: What the entry was, its foods for a dish, empty when it is its category, like an old `Sleep`
 *   written before it had its what.
 * - `place`: Place of the entry by its label, its `LOCATION`, like `HomeMunich`, for a way its route from its `X-FROM`,
 *   like `HomeMunich → TumGarching`, see `whereOf` in `places.ts`; empty when it has none.
 * - `note`: Note of the entry, its `DESCRIPTION`, empty when it has none.
 * - `start`, `end`: Start and end of the entry.
 * - `time`: Start of a short entry, start and end of a taller one.
 * - `line`: The first line, what, with the time after a comma when the entry has room for only this line,
 *   and for a way its route after a dot, like `Way: UBahn, 08:00 – 08:40 · HomeMunich → TumGarching`.
 * - `day`: Midnight of the shown day, where the grid starts.
 * - `top`, `bottom`: Start and end of the entry cut to the grid, from 00:00 of the shown day to 05:00 of the next,
 *   like 23:00 to 05:00 for a Sleep from 23:00 to 07:00 on 12 October.
 * - `lines`: Lines the shown part of a taller entry has room for, its height less the space of 0.75rem above
 *   and below its lines, see {@link lineMinutes}: that Sleep has (360 - 11.25) / 15.75 = 22 lines, not 29
 *   for its whole 8 hours.
 * - `timeLine`: The second line, start and end, light grey, cut with an ellipsis, see `.entry-time` in `day.css`.
 * - `shown`: The lines shown above the note: what, the time, and the place by its name, like `TumMain`, grey,
 *   see `.entry-place` in `day.css`.
 * - `below`: The note below the lines shown, grey, its line clamp the lines left, see `.entry-note` in `day.css`.
 *
 * @param info - Entry with its render details
 * @returns Lines of the entry for FullCalendar
 */
function entryContentOf(info: EventDisplayInfo): { domNodes: HTMLElement[] } {
    const category: string = info.event.extendedProps.category ?? "";
    const foods: string[] = dishOf(info.event);
    let what: string = info.event.title;
    if (foods.length > 0)
        what = foods.join(", ");
    else if (what === category)
        what = "";
    const place: string =
        whereOf(category, info.event.extendedProps.from ?? "", info.event.extendedProps.location ?? "");
    const note: string = (info.event.extendedProps.note ?? "").trim();
    const start: Date = info.event.start as Date;
    const end: Date = info.event.end ?? start;

    if (info.event.allDay)
        return { domNodes: [entryPartOf("div", "entry-title", whatOf(category, what))] };
    const time: string = info.isShort ? timeOf(start) : `${timeOf(start)} – ${timeOf(end)}`;
    const line: HTMLElement =
        entryPartOf("div", "entry-line", [entryPartOf("span", "entry-what", whatOf(category, what))]);
    const day: Date = info.view.currentStart;
    const top: number = Math.max(start.getTime(), day.getTime());
    const bottom: number =
        Math.min(end.getTime(), new Date(day.getFullYear(), day.getMonth(), day.getDate() + 1, 5).getTime());
    const lines: number = Math.floor(((bottom - top) / (60 * 1000) - 11.25) / lineMinutes);
    if (info.isShort || lines < 2) {
        line.append(entryPartOf("span", "entry-time", [`, ${time}`]));
        if (category === wayName && place !== "")
            line.append(entryPartOf("span", "entry-place entry-route", [`· ${place}`]));
        return { domNodes: [line] };
    }

    const timeLine: HTMLElement = entryPartOf("div", "entry-time", [time]);
    const shown: HTMLElement[] = [line, timeLine];
    if (place !== "" && lines >= 3)
        shown.push(entryPartOf("div", "entry-place", [place]));
    if (note === "" || lines <= shown.length)
        return { domNodes: shown };
    const below: HTMLElement = entryPartOf("div", "entry-note", [note]);
    below.style.webkitLineClamp = String(lines - shown.length);
    return { domNodes: [...shown, below] };
}

/**
 * Shows the date of the shown day above plan and log, its weekday and its date in my standard way,
 * like `Sunday, 11.10.2026`, `Today` faded when it is today's calendar date,
 * daily note, gratitude and paragraph of the day, see {@link dayNoteShow};
 * the boxes and the trackers follow the entries of the log, see `eventsSet` in {@link dayStart}.
 * - `weekday`: Weekday of the shown day, like `Sunday`, from the day at noon.
 *
 * @param info - Range of the shown day
 */
function dayShow(info: DatesSetInfo): void {
    const date: string = info.startStr.slice(0, 10);
    const weekday: string = new Date(`${date}T12:00:00`).toLocaleDateString("en-GB", { weekday: "long" });
    (document.getElementById("day-title") as HTMLElement).textContent = `${weekday}, ${dateTextOf(date)}`;
    todayButtonShow(date);
    dayNoteShow(date);
}

/**
 * Fades `Today` above plan and log while the shown day is today's calendar date, like 13.10.2026 on that day,
 * also once the day turned at 00:00 while the day stays, see `todayFollow` in `today.ts`.
 *
 * @param date - Shown day, like `2026-10-13`
 */
function todayButtonShow(date: string): void {
    (document.getElementById("day-today") as HTMLButtonElement).disabled = date === calendarTodayOf();
}

/**
 * Scrolls the time grid so that now stands in its middle, at each load of the page and when the day moves on
 * to the new day by itself, like 14:00 in the middle of 13.10.2026; at 00:20 today's page is 14 October,
 * whose grid cannot scroll above 00:00, so now simply stands near its top, and on 13 October, shown by its address,
 * 00:20 stands in the middle of the night below its evening.
 * A day without now keeps `scrollTime`, 06:00 at the top. It hands the time for the top to `scrollToTime`,
 * which FullCalendar keeps and applies again once it has measured the grid, so nothing undoes it.
 * - `hours`: Hours from the top of the grid, 00:00 of the shown day, to now, like 24.3 for 00:20 of the next day.
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
 * Loads the daily note with `import()`, its Markdown renderer with it, starts my gratitude and my paragraph
 * about the day, and shows them for the shown day and from then on for every day shown, see {@link dayShow}.
 * `evening.ts` comes first, since it loads `note.ts` too, which is then at hand at once.
 * - `evening`: Writes my gratitude and my paragraph about the day, see `evening.ts`.
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
 * the arrows and `Today` above plan and log move the calendar by a day or back to today, the date opens the month
 * to pick a day from, `+` above the time grid opens the entry by category of the log for the last half hour;
 * while it shows today, the day moves on to the new day by itself, now centred again, see `todayFollow` in `today.ts`,
 * and while it shows another day, `Today` follows the new day.
 * - `initialView`: A time grid of the shown day, one column, the log.
 * - `headerToolbar`: None, since the date and its buttons stand above plan and log together, see {@link dayShow}.
 * - `dayHeaders`: Leaves out the name of the day above the column, which the date above says already.
 * - `slotHeaderInnerClass`: Adds the class `slot-label` to the hour labels,
 *   so `day.css` sets their size and with it the height of the slots.
 * - `slotHeaderFormat`: Writes the hours in 24-hour form, like `14:00`; the entries write their times themselves.
 * - `eventContent`: Shows what an entry was, then its time, see {@link entryContentOf}.
 * - `eventShortHeight`: Makes entries short that have no room for one line with the space above and below it,
 *   as high as 39 px in the grid or lower at the page's root size of 20 px: such a line needs 36 px, 0.5rem above,
 *   a line of 1.05rem and 0.25rem below, see `.entry-inner` in `day.css`, and the inside of an entry is 3 px lower
 *   than its place in the grid; so they show one line with their start, like an entry of a quarter hour;
 *   one of half an hour, 41 px, is taller and shows its one line with start and end, see {@link entryContentOf}.
 * - `eventMinHeight`: Makes every entry at least as high as a quarter hour, 20 px, one line of an entry with its edge,
 *   so a shorter one, like ten minutes of my neck routine, still shows its line whole.
 * - `eventColor`: Edges the entries in the grey of the log from `variants.css`.
 * - `blockEventClass`: Adds the class `entry` to the entries,
 *   so `day.css` fills them in grey and only their edge keeps the grey of the log.
 * - `blockEventInnerClass`: Adds the class `entry-inner` to the inside of the entries,
 *   so `day.css` sets the size of their lines and cuts them at the edge of the entry instead of letting them stick out,
 *   and `entry-inner-short` to the inside of short ones, which takes away the space above and below their one line
 *   and keeps it 0.9rem high.
 * - `eventSources`: The log, see {@link logSourceOf}.
 * - `editable`: Lets entries be moved and resized, those that the reader marks `editable`.
 * - `snapDuration`: Moves, resizes and selects in steps of 15 minutes, while the grid keeps a line every 30 minutes.
 * - `eventDrop`, `eventResize`: Write a moved or resized entry back, see {@link entryDrag}.
 * - `droppable`: Takes the boxes dragged from the list.
 * - `eventAllow`: Takes boxes and entries only in the time grid, not in the row of the whole day.
 * - `eventReceive`: Logs a box dropped into the log at the time of the drop, see `boxes.ts`.
 * - `eventsSet`: Tells the boxes and the trackers the entries of the shown day, after every change.
 * - `eventClick`: Opens the entry by category for an entry that can be changed, see {@link entryClick}.
 * - `select`: Opens the entry by category for a range selected in the time grid.
 * - `selectAllow`: Allows selecting a time range, but not in the row of the whole day.
 * - `nowIndicatorLineClass`, `nowIndicatorDotClass`: Add the classes `now-line` and `now-dot` to the line of now
 *   and its dot, so `day.css` draws them calm grey behind the entries, never through their text.
 * - `slotMinTime`, `slotMaxTime`: Run the grid from 00:00 to 05:00 of the next day, so an entry can still be pulled
 *   past midnight at the bottom, below the evening before it; an entry from 01:00 to 02:00 on 13 October shows
 *   at the bottom of 12 October and at the top of 13 October. Only the grid shows it twice: the trackers
 *   and the done boxes ask the reader for the calendar day, 00:00 to 00:00, which counts it for 13 October,
 *   while FullCalendar fetches the log for the whole grid, 00:00 to 05:00 of the next day.
 * - `scrollTime`: Scrolls the grid to 06:00 at the start, for a day that does not hold now; today centres on now instead, see {@link nowCenter}.
 *
 * The theme keeps its own classes beside `slot-label`, `entry`, `entry-inner` and the others;
 * `day.css` wins because it comes after the theme's stylesheet.
 *
 * @param note - Whether the day shows its daily note, see {@link noteStart}; never on a phone
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
        blockEventInnerClass: (info: EventDisplayInfo): string =>
            info.isShort ? "entry-inner entry-inner-short" : "entry-inner",
        eventSources: [logSourceOf()],
        editable: true,
        snapDuration: "00:15:00",
        eventDrop: (info: EventChangeInfo): void => entryDrag(calendar, info),
        eventResize: (info: EventChangeInfo): void => entryDrag(calendar, info),
        droppable: true,
        eventAllow: (span: DateSpanApi): boolean => !span.allDay,
        eventReceive: (info: EventReceiveInfo): void => boxReceive(calendar, info),
        eventsSet: (events: EventApi[]): void => {
            boxesSee(calendar, events);
            trackersSee(calendar, events);
        },
        eventClick: entryClick,
        selectable: true,
        selectAllow: (span: DateSpanApi): boolean => !span.allDay,
        select: (info: DateSelectInfo): void => {
            entryOpen(info.start, info.end).catch((error: unknown): void => console.error(error));
        },
        nowIndicator: true,
        nowIndicatorLineClass: "now-line",
        nowIndicatorDotClass: "now-dot",
        slotMinTime: "00:00:00",
        slotMaxTime: "29:00:00",
        scrollTime: "06:00:00",
        datesSet: dayShow,
    });

    calendar.render();
    nowCenter(calendar);
    iconPut(document.getElementById("day-back") as HTMLElement, ChevronLeft, "Day before");
    iconPut(document.getElementById("day-next") as HTMLElement, ChevronRight, "Day after");
    iconPut(document.getElementById("log-new") as HTMLElement, Plus, "New entry");
    document.getElementById("day-back")?.addEventListener("click", (): void => calendar.prev());
    document.getElementById("day-today")?.addEventListener("click", (): void => calendar.gotoDate(calendarTodayOf()));
    document.getElementById("day-next")?.addEventListener("click", (): void => calendar.next());
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
    if (note)
        noteStart(calendar).catch((error: unknown): void => console.error(error));
}
