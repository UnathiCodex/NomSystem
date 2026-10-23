/**
 * ## Tutorials
 *
 * The tutorials of my modules week by week, as the tutorials view shows them, see `src/tutor/tutor.ts`: every module
 * with groups, those of its file `University/<module folder>_Groups.ics`, see `groupsRead` in `course.ts`, one card
 * per type with groups, like `TU`, each with every session of every group in the week, the box of the plan of that
 * week, which goes to the session I go to, and the group I was at last before it. Which session I go to a week is
 * the box of that week, picked in the view, see `weekPick` in `course.ts`, else where I was last time, see
 * `groupFollow` there. A module without groups, like one with a single exercise or no tutorials at all, shows none,
 * its boxes staying in the plan as they are.
 *
 * - `node:fs`: Tells whether a module has a file of groups.
 * - `./calendar.ts`: Gives the day of a session in Berlin time.
 * - `./categories.ts`: Gives the semester of a day.
 * - `./course.ts`: Reads the groups and the skill boxes of a module and gives the week of a day and of a box.
 * - `./notes.ts`: Lists the folders of my modules and gives the code of a module.
 * - `./sources.ts`: Names the file of the groups of a module.
 */

import { existsSync } from "node:fs";
import { berlinDateOf } from "./calendar.ts";
import { semesterOf } from "./categories.ts";
import { courseBoxesRead, groupsRead, mondayOf, weekOf } from "./course.ts";
import { codeOf, moduleFoldersRead } from "./notes.ts";
import { groupsEnding, skillFileOf } from "./sources.ts";

import type { Box, BoxState } from "./boxes.ts";
import type { Attendee } from "./calendar.ts";
import type { Group, Session } from "./course.ts";


/**
 * A session of a group in a week, as the tutorials view shows it.
 *
 * - `group`: Its group, like `03`.
 * - `start`: Its start as ISO instant, like `2026-11-05T15:00:00.000Z`.
 * - `minutes`: Its length in minutes, like 120.
 * - `location`, `locationLink`: Its room as an entry writes it, with its link, those of its group.
 * - `online`, `onlineLink`: Its platform online with the link of its meeting, those of its group, see `Online`
 *   in `calendar.ts`; empty for none.
 * - `attendees`: Its tutor, that of its group; none while unknown.
 */
export type TutorSession = {
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
 * A card of the tutorials view: one type with groups of a module in a week.
 *
 * - `module`: Name of the folder of the module, like `IN0009_BetriebssystemeSystemsoftware`.
 * - `type`: The type of its groups, like `TU`.
 * - `sessions`: Every session of its groups in the week, the earliest first; none in a week none meets,
 *   like in the holidays.
 * - `box`: The box of the plan of the type that week, see `Box` in `boxes.ts`, one done before an open one,
 *   one skipped and one the university cancelled last; `null` for none.
 * - `last`: The group I was at last before the week, that of the last box of the type done with a group;
 *   empty for none.
 */
export type TutorCard = {
    module: string;
    type: string;
    sessions: TutorSession[];
    box: Box | null;
    last: string;
};

/**
 * The tutorials of a week, as the tutorials view shows them.
 *
 * - `monday`: The Monday of the week, like `2026-11-02`.
 * - `cards`: Its cards, by module, then by type.
 */
export type TutorWeek = {
    monday: string;
    cards: TutorCard[];
};

/**
 * Order of the boxes of a week, which one a card shows when the plan has several: done, open, skipped, cancelled
 * by the university.
 */
const stateOrder: BoxState[] = ["done", "open", "dropped", "university"];


/**
 * Gives the sessions of the groups of a type in a week, each with the room and the tutor of its group.
 * - `own`: Whether a session falls into the week.
 *
 * @param groups - The groups of the type
 * @param monday - The Monday of the week, like `2026-11-02`
 * @returns The sessions, the earliest first
 */
function sessionsOf(groups: Group[], monday: string): TutorSession[] {
    const own: (session: Session) => boolean = (session: Session): boolean =>
        mondayOf(berlinDateOf(new Date(session.start))) === monday;
    return groups.flatMap((group: Group): TutorSession[] => group.sessions.filter(own)
        .map((session: Session): TutorSession => ({
            group: group.rule.group, start: session.start, minutes: session.minutes, location: group.rule.location,
            locationLink: group.rule.locationLink, online: group.rule.online, onlineLink: group.rule.onlineLink,
            attendees: group.rule.attendees,
        })))
        .sort((first: TutorSession, second: TutorSession): number => first.start.localeCompare(second.start));
}

/**
 * Reads the tutorials of the week of a day, see the top of this file: a card per module with groups in the semester
 * of the week and per type of its groups.
 * - `monday`: The Monday of the week.
 * - `semester`: Its semester.
 * - `rank`: Gives the place of a box in {@link stateOrder}.
 * - `groups`: The groups of a module.
 * - `boxes`: The skill boxes of a module of the semester.
 * - `types`: The types of its groups, in their order.
 * - `typed`: The boxes of a type.
 * - `done`: Those done with a group before the week, the earliest first.
 *
 * @param date - A day of the week, like `2026-11-05`
 * @returns The tutorials of the week
 * @throws {Error} - When the day is not written like `2026-11-05`
 */
export function tutorWeekRead(date: string): TutorWeek {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date))
        throw new Error(`No day: ${date}`);
    const monday: string = mondayOf(date);
    const semester: string = semesterOf(monday);
    const rank: (box: Box) => number = (box: Box): number =>
        stateOrder.includes(box.state) ? stateOrder.indexOf(box.state) : stateOrder.length;
    const cards: TutorCard[] = moduleFoldersRead()
        .filter((module: string): boolean => existsSync(skillFileOf(module, groupsEnding)))
        .flatMap((module: string): TutorCard[] => {
            const groups: Group[] = groupsRead(module, semester);
            const boxes: Box[] = groups.length === 0 ? [] : courseBoxesRead(codeOf(module), semester);
            const types: string[] = [...new Set(groups.map((group: Group): string => group.rule.type))];
            return types.map((type: string): TutorCard => {
                const typed: Box[] = boxes.filter((box: Box): boolean => box.type === type);
                const done: Box[] = typed.filter((box: Box): boolean => box.state === "done" && box.group !== ""
                    && weekOf(box) < monday);
                return {
                    module: module,
                    type: type,
                    sessions: sessionsOf(groups.filter((group: Group): boolean => group.rule.type === type), monday),
                    box: typed.filter((box: Box): boolean => weekOf(box) === monday)
                        .sort((first: Box, second: Box): number => rank(first) - rank(second))[0] ?? null,
                    last: done.at(-1)?.group ?? "",
                };
            });
        });
    return { monday: monday, cards: cards };
}
