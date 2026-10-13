/**
 * ## Session timer
 *
 * A quiet timer at the right of the areas while a session of mine runs, in every area: what its skill entry is
 * as written, a module opening in the notes view, and the minutes since its skill entry started,
 * like `IN2028_BusinessAnalyticsMachineLearning · 32 min` or `WokFlow · 32 min`, in grey, then the document it uses
 * by its name, opening in a new tab, see `skill/links.ts`.
 * A session is the skill entry of the moment, of a type I pace myself, homework, or none, my own learning
 * or work on a project,
 * see `reader/skill.ts`: the first button of a task starts one, and a study session logged from the plan is one.
 * One calm mark at a time says what to do, in the light grey of the text, no sound and no popup, the first that holds:
 * - after 4 hours of learning today, lectures included: `4 h today: stop by plan`;
 * - after a whole session, 75 minutes: `Session done, 20 min away`;
 * - after one focused stretch, 45 minutes since the session started or since my last break in it:
 *   `Short break: Neck short or a walk, away from the phone`, with a button that logs `Body` `Neck short`
 *   at now, five minutes long, which is a break, so the stretch starts again after it.
 * The numbers are my settings, see `reader/trackers.ts`.
 * The timer asks the reader again every minute, and hides while no session runs.
 *
 * - `./icons.ts`: Makes the icon of the mark.
 * - `lucide`: The icon footprints.
 * - `./skill/links.ts`: Shows what a skill entry is and a link of it by its name.
 */

import { iconOf } from "./icons.ts";
import { Footprints } from "lucide";
import { linkElementOf, skillTitleElementOf } from "./skill/links.ts";

import type { Link } from "./skill/attempts.ts";


/**
 * A session running now, as the reader sends it.
 *
 * - `module`: Name of its skill, like `IN2028` or `WokFlow`.
 * - `type`: Its type, `HU`, empty for none, like my own learning or a project.
 * - `title`: What its skill entry is as written, like `IN2028_BusinessAnalyticsMachineLearning (HU)`.
 * - `titleLink`: The folder of its skill from `NomWorkspace`, empty for none.
 * - `start`: Start of its skill entry, as ISO instant.
 * - `links`: Links of its skill entry to files, the document it uses.
 * - `focusStart`: Start of the focused stretch running now, the start or the end of my last break, as ISO instant.
 * - `dayMinutes`: Minutes of learning today, from 00:00, lectures included.
 * - `focusMinutes`: Minutes of a focused stretch after which the timer suggests a short break away from the phone.
 * - `sessionMinutes`: Minutes of a whole session.
 * - `studyMinutes`: Minutes of learning a day at most.
 */
type Session = {
    module: string;
    type: string;
    title: string;
    titleLink: string;
    start: string;
    links: Link[];
    focusStart: string;
    dayMinutes: number;
    focusMinutes: number;
    sessionMinutes: number;
    studyMinutes: number;
};

/**
 * Milliseconds between two looks at the reader, one minute.
 */
const lookTime: number = 60 * 1000;

/**
 * Minutes of a break the button of the mark logs, my neck routine `Neck short`.
 */
const breakMinutes: number = 5;


/**
 * Loads the session running now from the reader.
 *
 * @returns The session, `null` while none runs
 * @throws {Error} - When the reader cannot answer
 */
async function sessionLoad(): Promise<Session | null> {
    const response: Response = await fetch("/api/skill/session");
    if (!response.ok)
        throw new Error(`Reader answered ${response.status}`);
    return await response.json() as Session | null;
}

/**
 * Logs my break: an entry `Body` `Neck short` from now on, {@link breakMinutes} long, then shows the timer again.
 * - `start`: Now, without its seconds.
 *
 * @throws {Error} - When the reader does not take the entry
 */
async function breakLog(): Promise<void> {
    const start: Date = new Date();
    start.setSeconds(0, 0);
    const response: Response = await fetch("/api/day/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            category: "Body", title: "Neck short", location: "", from: "", module: "", type: "", note: "", foods: [],
            planned: "", start: start.toISOString(), end: new Date(start.getTime() + breakMinutes * 60 * 1000).toISOString(),
        }),
    });
    if (!response.ok)
        throw new Error(`Reader answered ${response.status}`);
    await timerShow();
}

/**
 * Makes the button of the mark of a short break, which logs `Neck short` as my break.
 *
 * @returns Button
 */
function breakButtonOf(): HTMLButtonElement {
    const button: HTMLButtonElement = document.createElement("button");
    button.type = "button";
    button.className = "session-break-log";
    button.textContent = "Neck short";
    button.title = `Log Neck short from now, ${breakMinutes} minutes, as my break`;
    button.addEventListener("click", (): void => {
        button.disabled = true;
        breakLog().catch((error: unknown): void => {
            console.error(error);
            button.disabled = false;
        });
    });
    return button;
}

/**
 * Gives the mark the timer shows, see the top of this file.
 *
 * @param session - The session running now
 * @param minutes - Whole minutes since the session started
 * @param focus - Whole minutes since its focused stretch started, below 0 during a break
 * @returns The words of the mark and whether it offers to log a break; empty words for no mark
 */
function markOf(session: Session, minutes: number, focus: number): [string, boolean] {
    if (session.dayMinutes >= session.studyMinutes)
        return [`${Math.round(session.studyMinutes / 60)} h today: stop by plan`, false];
    if (minutes >= session.sessionMinutes)
        return ["Session done, 20 min away", false];
    if (focus >= session.focusMinutes)
        return ["Short break: Neck short or a walk, away from the phone", true];
    return ["", false];
}

/**
 * Shows the session running now in the timer, see the top of this file, or hides the timer while none runs.
 * - `timer`: The timer at the right of the areas, in `index.html`.
 * - `minutes`: Whole minutes since the session started.
 * - `focus`: Whole minutes since its focused stretch started.
 * - `mark`, `offers`: Words of the mark, empty for none, and whether it offers to log a break.
 * - `dotOf`: Makes a dot of its own, so the gap of the timer parts it from its neighbours.
 * - `parts`: What the skill entry is, see `skill/links.ts`, the minutes and the mark, each after a dot.
 * - `links`: The links of its skill entry to files, each after a dot.
 *
 * @throws {Error} - When the reader cannot answer
 */
async function timerShow(): Promise<void> {
    const timer: HTMLElement = document.getElementById("session-timer") as HTMLElement;
    const session: Session | null = await sessionLoad();
    timer.hidden = session === null;
    if (session === null)
        return;

    const minutes: number = Math.max(0, Math.floor((Date.now() - Date.parse(session.start)) / (60 * 1000)));
    const focus: number = Math.floor((Date.now() - Date.parse(session.focusStart)) / (60 * 1000));
    const [mark, offers]: [string, boolean] = markOf(session, minutes, focus);
    const dotOf: () => HTMLSpanElement = (): HTMLSpanElement => {
        const dot: HTMLSpanElement = document.createElement("span");
        dot.textContent = "·";
        return dot;
    };
    const parts: (HTMLElement | string)[] = [skillTitleElementOf(session.title, session.titleLink), dotOf(),
        `${minutes} min`, ...(mark === "" ? [] : [dotOf(), mark])];
    const links: HTMLElement[] = session.links.flatMap((link: Link): HTMLElement[] => [dotOf(), linkElementOf(link)]);
    timer.classList.toggle("session-break", mark !== "");
    timer.replaceChildren(...(mark === "" ? [] : [iconOf(Footprints)]), ...parts, ...links,
        ...(offers ? [breakButtonOf()] : []));
    timer.title = mark === ""
        ? `Session running since ${new Date(session.start).toTimeString().slice(0, 5)}; `
            + `${session.dayMinutes} min of learning today`
        : `${mark}; ${session.dayMinutes} min of learning today`;
}

/**
 * Starts the timer in every area, after the router has marked the shown one: shows it now, then every minute.
 * - `look`: Shows the timer, a failure only written to the console.
 * - {@link setInterval}: Calls a function again and again, after a number of milliseconds each time.
 */
export function timerStart(): void {
    const look: () => void = (): void => {
        timerShow().catch((error: unknown): void => console.error(error));
    };
    look();
    setInterval(look, lookTime);
}
