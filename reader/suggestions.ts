/**
 * ## Suggestions
 *
 * Suggests study sessions for the plan of a day, from the tasks of my notes: computed every time, never written,
 * until I accept one in the day view, which writes it as a box of the plan with its duration and without time,
 * like `SUMMARY:IN2028 DEV` with `ESTIMATED-DURATION:PT1H15M`, see `boxes.ts`.
 * A session gets no time, since study planned as an appointment never held for me: I drag its box into the log
 * when I study. The day view asks for tomorrow only and shows them as dashed boxes below the boxes of the day,
 * see `src/day/boxes.ts`.
 * The numbers come from my settings, see `trackers.ts`:
 * - Minutes: the most minutes of learning a day, less the minutes of every skill box of the day that is not dropped,
 *   lectures and tutorials included, a box without duration counting as one session, so a day full of lectures
 *   gets fewer sessions or none; a skill box with a deadline, like a homework sheet, which shows on the days
 *   before its deadline, counts on each of them its share of the days left until it, its own day included,
 *   like 180 minutes of a sheet due in three days counting 45 today, and nothing once done; they make sessions
 *   of the session length, and a rest of at least one focused stretch makes one shorter session.
 * - Modules: each session goes to the module with the most tasks to do per session it has that day, its study boxes
 *   included, so the sessions spread over the modules by their tasks; a task to do is due by that day, or new:
 *   never tried and not done, see `skill.ts`; a skipped one is none. A module without tasks to do gets none.
 *
 * - `./boxes.ts`: Reads the boxes of the day.
 * - `./calendar.ts`: Adds a day to a day.
 * - `./categories.ts`: Names the category of skill entries and writes what a skill entry is.
 * - `./skill.ts`: Reads my tasks with when each is due.
 * - `./trackers.ts`: Holds my settings.
 */

import { boxesRead } from "./boxes.ts";
import { dayAdd } from "./calendar.ts";
import { skillName, skillTitleOf } from "./categories.ts";
import { skillingRead } from "./skill.ts";
import { settings } from "./trackers.ts";

import type { Box } from "./boxes.ts";
import type { Attempt, SkillModule, SkillTask } from "./skill.ts";


/**
 * A suggested study session, as the day view shows it.
 *
 * - `module`: Code of its module, like `IN2028`.
 * - `title`: What it is, like `IN2028 DEV`.
 * - `minutes`: How long it is expected to last.
 */
export type Suggestion = {
    module: string;
    title: string;
    minutes: number;
};

/**
 * A module with tasks to do on a day, while the sessions are handed out.
 *
 * - `code`: Module code, like `IN2028`.
 * - `tasks`: Number of its tasks to do, due or new.
 * - `sessions`: Its study sessions of the day so far, planned and suggested.
 */
type ModuleNeed = {
    code: string;
    tasks: number;
    sessions: number;
};

/**
 * Type of the suggested sessions: solving the tasks of my notes.
 */
const studyType: string = "DEV";


/**
 * Gives the lengths of the sessions of a day: as many of the session length as the minutes hold,
 * and one of the rest when it lasts at least one focused stretch, see `trackers.ts`.
 * - `whole`: Number of sessions of the session length.
 * - `rest`: Minutes left after them.
 *
 * @param minutes - Minutes of learning left for the day, below zero when the plan holds more
 * @returns Lengths in minutes, none when too few minutes are left
 */
function lengthsOf(minutes: number): number[] {
    const whole: number = Math.max(0, Math.floor(minutes / settings.sessionMinutes));
    const rest: number = minutes - whole * settings.sessionMinutes;
    return [
        ...Array.from({ length: whole }, (): number => settings.sessionMinutes),
        ...(rest >= settings.focusMinutes ? [rest] : []),
    ];
}

/**
 * Picks the module of the next session: the one with the most tasks to do per session it has with it,
 * the earlier one in the order of the modules of the semester when two are equal.
 *
 * @param needs - Modules with tasks to do, at least one
 * @returns The module, its sessions not counted up yet
 */
function moduleNext(needs: ModuleNeed[]): ModuleNeed {
    return needs.reduce((best: ModuleNeed, need: ModuleNeed): ModuleNeed =>
        need.tasks / (need.sessions + 1) > best.tasks / (best.sessions + 1) ? need : best);
}

/**
 * Gives the minutes a skill box takes from a day: its expected duration, one session without one;
 * for a box with a deadline its share of the days left until its deadline, the day and the deadline's day included,
 * since it shows on each of them, see the top of this file, and nothing once done, since then it shows
 * on the day of its deadline only to show it done, see `boxes.ts`.
 * - `whole`: Its minutes.
 * - `left`: Days left until its deadline, at least the day itself.
 *
 * @param box - Skill box of the day, not dropped
 * @param date - The day, like `2026-10-12`
 * @returns Minutes
 */
function minutesOf(box: Box, date: string): number {
    const whole: number = box.minutes ?? settings.sessionMinutes;
    if (box.deadline === "")
        return whole;
    if (box.state === "done")
        return 0;
    const left: number = Math.max(1, Math.round((Date.parse(box.day) - Date.parse(date)) / (24 * 60 * 60 * 1000)) + 1);
    return whole / left;
}

/**
 * Suggests the study sessions of a day, see the top of this file.
 * - `skills`: The skill boxes of the day that are not dropped, like lectures and study already planned,
 *   and those with a deadline shown on the day.
 * - `needs`: Modules with tasks to do on the day, each with its study boxes of that day.
 * - `minutes`: Minutes of learning left for the day.
 *
 * @param date - Day like `2026-10-12`
 * @returns Suggestions in the order they were handed out, none when no module has tasks to do or no time is left
 * @throws {Error} - When the date is not written like `2026-10-12`, or a folder or note cannot be read
 */
export function suggestionsRead(date: string): Suggestion[] {
    const skills: Box[] = boxesRead(date, dayAdd(date, 1))[0].boxes
        .filter((box: Box): boolean => box.category === skillName && box.state !== "dropped");
    const needs: ModuleNeed[] = skillingRead().modules.map((module: SkillModule): ModuleNeed => ({
        code: module.code,
        tasks: module.tasks.filter((task: SkillTask): boolean => !task.skipped && (task.due === ""
            ? !task.done && !task.ready && task.attempts.every((attempt: Attempt): boolean => attempt.result === "skipped")
            : task.due <= date)).length,
        sessions: skills.filter((box: Box): boolean => box.module === module.code && box.type === studyType
            && box.deadline === "").length,
    })).filter((need: ModuleNeed): boolean => need.tasks > 0);
    if (needs.length === 0)
        return [];

    const minutes: number = settings.studyMinutes
        - Math.round(skills.reduce((sum: number, box: Box): number => sum + minutesOf(box, date), 0));
    return lengthsOf(minutes).map((length: number): Suggestion => {
        const need: ModuleNeed = moduleNext(needs);
        need.sessions++;
        return { module: need.code, title: skillTitleOf(need.code, studyType), minutes: length };
    });
}
