/**
 * ## Session timer
 *
 * A quiet timer in the bar of the day, always there, taking the room between the date and the trackers,
 * in a soft frame like them: while a session of mine runs what its skill entry is at the left, as the log shows it,
 * like `Skill: NomSystemdashboard`, and how long it still runs at the right, in hours and minutes, like `01h 23m`;
 * while none runs `None` and `00h 00m`, `None` in the white and bold of a session's name, so I see at once what runs,
 * and the bar never jumps; on a phone on a line of its own.
 * Where the room is too small for the whole name, like on my laptop, it is cut with an ellipsis at its end,
 * like `Skill: WI0219_InvestitionFin…`, the time always whole; a short code would not work for every name.
 * A session is the skill entry of the moment in the log, of every type, see `reader/skill.ts`: the first button
 * of a task starts one, and a box of the plan logged is one, a lecture too; it ends where its entry ends.
 * The timer asks the reader again every minute, and each time the log was read, like after I saved, ended or removed
 * an entry, so a skill entry whose time holds now shows at once, and one I end goes back to `None`,
 * see {@link timerSee}.
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
 * - `title`: What its skill entry is as written, like `IN2028 Business Analytics Machine Learning (HU)`.
 * - `start`, `end`: Start and end of its skill entry, as ISO instants.
 */
export type Session = {
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
 * Shows the session running now in the timer, see the top of this file, its start and end as tooltip,
 * like `17:45 – 20:45`; `None` and `00h 00m` while none runs and once it is over, without tooltip.
 * - `timer`: The timer in the bar of the day, in `day.html`.
 * - `left`: Whole minutes until its end, a minute begun counting whole, so `00h 01m` shows to the last minute.
 *
 * @throws {Error} - When the reader cannot answer
 */
async function timerShow(): Promise<void> {
    const timer: HTMLElement = document.getElementById("session-timer") as HTMLElement;
    const session: Session | null = await sessionLoad();
    const left: number = session === null ? 0 : Math.ceil((Date.parse(session.end) - Date.now()) / (60 * 1000));
    if (session === null || left <= 0) {
        timer.replaceChildren(entryPartOf("span", "session-what", whatOf("", "None")),
            entryPartOf("span", "session-left", [lengthOf(0)]));
        timer.removeAttribute("title");
        return;
    }

    timer.replaceChildren(
        entryPartOf("span", "session-what",
            whatOf(skillName, shownWhatOf(skillName, session.title, session.module, session.type))),
        entryPartOf("span", "session-left", [lengthOf(left)]),
    );
    timer.title = `${timeOf(new Date(session.start))} – ${timeOf(new Date(session.end))}`;
}

/**
 * Looks at the reader for the session running now and shows it in the timer, a failure only written to the console;
 * the day calls it each time it has read the log, see `eventSourceSuccess` in `day/day.ts`, so a skill entry saved,
 * ended or removed shows at once, without loading the page again.
 */
export function timerSee(): void {
    timerShow().catch((error: unknown): void => console.error(error));
}

/**
 * Starts the timer of the day: shows it now, then every minute.
 * - {@link setInterval}: Calls a function again and again, after a number of milliseconds each time.
 */
export function timerStart(): void {
    timerSee();
    setInterval(timerSee, lookTime);
}
