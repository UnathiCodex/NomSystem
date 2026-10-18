/**
 * ## Suggestions
 *
 * Puts what I learn today into the plan of today as real boxes, without asking: one box per chapter with something
 * due today, a Task by its spacing or a section on round 0, see `today` of `SkillSection` in `skill.ts`, the same
 * chapters Learn shows, see `src/editor/today.ts`. A box of my own learning, without type and without time,
 * like a to-do, since only its length matters, not when: one study session, see `sessionMinutes` in `trackers.ts`,
 * like `SUMMARY:IN2028 Business Analytics Machine Learning` with `X-CHAPTER:01_RegressionAnalysis`
 * and `ESTIMATED-DURATION:PT1H`, see `boxes.ts`, and one `ATTACH` per note of the chapter with something due,
 * at most one Task each, like `ATTACH:NomSkillingmodules/IN2028_…/01_RegressionAnalysis/01_01_SampleMeanEstimator.md`,
 * as it stands when the box is written; its real length the log keeps.
 * A chapter gets no box while the plan of today holds one of it, open, done, skipped or pushed away, nor while a box
 * of it from a day before is still open: that one is carried along until I do it, see `boxesCarried` in `boxes.ts`;
 * nor once such a box is done by a log entry of today, like the box of 18.10 carried along and done by my session
 * of 19.10, which counts as the box of today.
 * Learning does the box: the session the learning view opens and the attempts of a session are logged from it,
 * see `studyBoxOf` in `boxes.ts`. Written before the plan of today or the learning view is read, see `reader.ts`,
 * so the box stands there before I begin; nothing written is taken out again.
 *
 * - `./boxes.ts`: Reads the boxes of today, those carried along and the skill boxes with their log entries,
 *   and adds a box.
 * - `./calendar.ts`: Gives today in Berlin time and adds a day to a day.
 * - `./categories.ts`: Names the category of skill entries.
 * - `./skill.ts`: Reads what of each section is due today.
 * - `./trackers.ts`: Holds the length of one study session.
 */

import { boxAdd, boxesCarried, boxesRead, skillBoxesRead } from "./boxes.ts";
import { berlinDateOf, dayAdd } from "./calendar.ts";
import { skillName } from "./categories.ts";
import { skillingRead } from "./skill.ts";
import { settings } from "./trackers.ts";

import type { Box } from "./boxes.ts";
import type { SkillModule, SkillSection } from "./skill.ts";


/**
 * Writes the boxes of the chapters due today into the plan of today, see the top of this file.
 * - `today`: Today in Berlin time.
 * - `boxes`: Skill boxes of today, in any state, those carried along to it, which are open, and those of a day before
 *   done by a log entry of today.
 * - `due`: Sections of a module with something due today, in their order.
 * - `chapters`: Their chapters, in their order.
 *
 * @throws {Error} - When a folder, a note, the log or the plan cannot be read, or a box cannot be written
 */
export function suggestionsWrite(): void {
    const today: string = berlinDateOf(new Date());
    const boxes: Box[] = [...boxesRead(today, dayAdd(today, 1))[0].boxes, ...boxesCarried(today),
        ...skillBoxesRead(dayAdd(today, 1)).filter((box: Box): boolean =>
            box.log !== null && berlinDateOf(new Date(box.log.start)) === today)]
        .filter((box: Box): boolean => box.category === skillName);
    skillingRead().modules.forEach((module: SkillModule): void => {
        const due: SkillSection[] = module.sections.filter((section: SkillSection): boolean => section.today !== "");
        const chapters: string[] = [...new Set(due.map((section: SkillSection): string => section.chapter))];
        chapters
            .filter((chapter: string): boolean => !boxes.some((box: Box): boolean =>
                box.module === module.code && box.chapters.includes(chapter)))
            .forEach((chapter: string): void => {
                boxAdd({
                    category: skillName, title: "", location: "", from: "", module: module.code, type: "",
                    semester: "", note: "", day: today, time: "", minutes: settings.sessionMinutes, deadline: "",
                    chapters: [chapter], documents: due
                        .filter((section: SkillSection): boolean => section.chapter === chapter)
                        .map((section: SkillSection): string => section.note.split("/").slice(1).join("/")),
                });
            });
    });
}
