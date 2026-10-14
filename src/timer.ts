/**
 * ## Session timer
 *
 * A quiet timer in the bar of the day while a session of mine runs, taking the room between the date and the trackers,
 * in a soft frame like them: what its skill entry is at the left, as the log shows it, like `Skill: NomSystemdashboard`,
 * and how long it still runs at the right, in hours and minutes, like `01h 23m`; never on a phone.
 * Where the room is too small for the whole name, like on my laptop, the module shows by its code alone,
 * like `Skill: WI0219 (VO)`, as on the phone, so the bar keeps one line, see {@link timerFit}.
 * A session is the skill entry of the moment in the log, of every type, see `reader/skill.ts`: the first button
 * of a task starts one, and a box of the plan logged is one, a lecture too; it ends where its entry ends.
 * The timer asks the reader again every minute, and hides while no session runs and once it is over.
 *
 * - `./day/boxes.ts`: Writes what a skill entry is, as the log shows it.
 * - `./day/times.ts`: Writes times of day and a length in hours and minutes.
 * - `./skill/attempts.ts`: Names the category of skill entries.
 */

import { entryPartOf, shownWhatOf, whatOf } from "./day/boxes.ts";
import { lengthOf, timeOf } from "./day/times.ts";
import { skillName } from "./skill/attempts.ts";


/**
 * A session running now, as the reader sends it.
 *
 * - `module`: Name of its skill, like `IN2028` or `WokFlow`.
 * - `type`: Its type, `HU`, empty for none, like my own learning or a project.
 * - `title`: What its skill entry is as written, like `IN2028_BusinessAnalyticsMachineLearning (HU)`.
 * - `start`, `end`: Start and end of its skill entry, as ISO instants.
 */
type Session = {
    module: string;
    type: string;
    title: string;
    start: string;
    end: string;
};

/**
 * Milliseconds between two looks at the reader, one minute.
 */
const lookTime: number = 60 * 1000;


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
 * Shows the session running now in the timer, see the top of this file, or hides the timer while none runs
 * and once it is over; its start and end as tooltip, like `17:45 – 20:45`.
 * - `timer`: The timer in the bar of the day, in `day.html`.
 * - `left`: Whole minutes until its end, a minute begun counting whole, so `00h 01m` shows to the last minute.
 *
 * @throws {Error} - When the reader cannot answer
 */
async function timerShow(): Promise<void> {
    const timer: HTMLElement = document.getElementById("session-timer") as HTMLElement;
    const session: Session | null = await sessionLoad();
    const left: number = session === null ? 0 : Math.ceil((Date.parse(session.end) - Date.now()) / (60 * 1000));
    timer.hidden = session === null || left <= 0;
    if (session === null || left <= 0)
        return;

    timer.replaceChildren(
        entryPartOf("span", "session-what session-whole",
            whatOf(skillName, shownWhatOf(skillName, session.title, session.module, session.type))),
        entryPartOf("span", "session-what session-short",
            whatOf(skillName, session.type === "" ? session.module : `${session.module} (${session.type})`)),
        entryPartOf("span", "session-left", [lengthOf(left)]),
    );
    timer.title = `${timeOf(new Date(session.start))} – ${timeOf(new Date(session.end))}`;
    timerFit();
}

/**
 * Shows the whole name of the session where the timer has room for it, else its code alone, measured on the page,
 * so every name fits, the longest too, like `IN2028_BusinessAnalyticsMachineLearning (UE)`; the timer takes only
 * the room the bar has left, see `.session-timer` in `day/day.css`.
 * - `whole`: The whole name, measured while it shows.
 */
function timerFit(): void {
    const timer: HTMLElement = document.getElementById("session-timer") as HTMLElement;
    const whole: HTMLElement | null = timer.querySelector(".session-whole");
    timer.classList.remove("session-narrow");
    if (whole !== null && whole.scrollWidth > whole.clientWidth)
        timer.classList.add("session-narrow");
}

/**
 * Starts the timer of the day: shows it now, then every minute.
 * - `look`: Shows the timer, a failure only written to the console.
 * - {@link setInterval}: Calls a function again and again, after a number of milliseconds each time.
 * - {@link ResizeObserver}: Calls a function whenever an element changes its size, here the timer, so its name fits
 *   again when the window or the trackers beside it change.
 */
export function timerStart(): void {
    const look: () => void = (): void => {
        timerShow().catch((error: unknown): void => console.error(error));
    };
    look();
    setInterval(look, lookTime);
    new ResizeObserver(timerFit).observe(document.getElementById("session-timer") as HTMLElement);
}
