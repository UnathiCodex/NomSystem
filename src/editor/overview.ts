/**
 * ## Overview
 *
 * What the scripts view shows of a module where a note stands, once I click the name of the module or of one of its
 * chapters in the tree, see `pickerOf` in `../notes/tree.ts`: where each of its sections stands, kept simple,
 * in the look of the day view, see `../day/`, as Today, see `./today.ts`:
 * - on top, as the date of the day, small and grey `NomSkillingmodules`, linking to Today, and below it the name
 *   of the module, like `IN2028_BusinessAnalyticsMachineLearning`;
 * - then each chapter by its name, like `01_RegressionAnalysis`, with `Round` grey at the right, and below it its card,
 *   filled as a box of the plan; in it each section a row, in the order of the notes, as high and as far apart
 *   as the rows of the tree, see `.tree-file` in `../notes/notes.css`: the name of the section as the tree names it,
 *   like `01_01_SampleMeanEstimator`, and its round, like `2`, the one its view shows, see `./round.ts`,
 *   `Ready` once its Task has its runs spaced, `New` while I never learned it; a tap on a row opens the section.
 * Nothing more, until I want more: every further piece only after Claude recommends it and I say yes.
 * Everything is computed from the log by the reader, see `reader/skill.ts`; nothing is kept here.
 *
 * - `../skill/attempts.ts`: Loads the modules with their tasks and sections.
 * - `../notes/tree.ts`: The address of a note, and shows a chapter in the tree.
 * - `../day/choices.ts`: Marks where a long name may go on below.
 * - `../food/foods.ts`: Makes elements.
 * - `../day/boxes.css`: Look of `No chapters yet`, as the plan's `Nothing planned`.
 * - `./overview.css`: Look of the overview.
 */

import { skillingLoad } from "../skill/attempts.ts";
import { chapterShow, noteAddressOf } from "../notes/tree.ts";
import { breakableOf } from "../day/choices.ts";
import { elementOf } from "../food/foods.ts";
import "../day/boxes.css";
import "./overview.css";

import type { SkillModule, SkillSection, SkillTask, Skilling } from "../skill/attempts.ts";


/**
 * Tells the round of a section, see the top of this file.
 * - `ready`: Whether its Task has its runs spaced.
 *
 * @param module - Its module with its tasks
 * @param section - The section
 * @returns Its round, like `2`, `Ready` or `New`
 */
function roundOf(module: SkillModule, section: SkillSection): string {
    const ready: boolean = module.tasks.some((task: SkillTask): boolean => task.id === section.cold && task.ready);
    if (ready)
        return "Ready";
    return section.days.length === 0 ? "New" : String(section.round);
}

/**
 * Makes the row of a section, see the top of this file: a link to it, its name and its round.
 * - `row`: The row.
 *
 * @param module - Its module with its tasks
 * @param section - The section
 * @returns The row
 */
function rowOf(module: SkillModule, section: SkillSection): HTMLAnchorElement {
    const row: HTMLAnchorElement = document.createElement("a");
    row.className = "overview-row";
    row.href = noteAddressOf(section.note, "");
    row.append(elementOf("span", "overview-name", section.title),
        elementOf("span", "overview-round", roundOf(module, section)));
    return row;
}

/**
 * Makes the sections of one chapter, see the top of this file: its name with `Round` at the right, then their card.
 * - `group`: The chapter.
 * - `head`: The line of its name.
 * - `card`: The card of its rows.
 *
 * @param module - Its module
 * @param chapter - Name of the chapter, like `01_RegressionAnalysis`
 * @returns The group
 */
function groupOf(module: SkillModule, chapter: string): HTMLElement {
    const group: HTMLElement = elementOf("section", "overview-group", "");
    const head: HTMLElement = elementOf("div", "overview-head", "");
    const card: HTMLElement = elementOf("div", "overview-card", "");
    head.append(elementOf("h3", "overview-chapter", breakableOf(chapter)),
        elementOf("span", "overview-column", "Round"));
    card.append(...module.sections.filter((section: SkillSection): boolean => section.chapter === chapter)
        .map((section: SkillSection): HTMLAnchorElement => rowOf(module, section)));
    group.append(head, card);
    return group;
}

/**
 * Shows the overview of a module in its place, see the top of this file; a module without sections says
 * `No chapters yet`, as the tree does.
 * - `skilling`: Every module with its tasks and sections.
 * - `found`: The module, `undefined` for one not of the semester.
 * - `up`: The way up, small and grey above the name.
 * - `list`: The place of the chapters.
 *
 * @param place - Where the overview goes, see `#editor-overview` in `./editor.html`
 * @param module - Name of the folder of the module, like `IN2028_BusinessAnalyticsMachineLearning`
 * @throws {Error} - When the reader cannot read the tasks
 */
export async function overviewShow(place: HTMLElement, module: string): Promise<void> {
    const skilling: Skilling = await skillingLoad();
    const found: SkillModule | undefined = skilling.modules.find((candidate: SkillModule): boolean =>
        candidate.title === module);
    const up: HTMLAnchorElement = place.querySelector(".overview-up") as HTMLAnchorElement;
    const list: HTMLElement = place.querySelector(".overview-list") as HTMLElement;
    up.href = "/scripts";
    up.textContent = "NomSkillingmodules";
    (place.querySelector(".day-date") as HTMLElement).textContent = breakableOf(module);
    if (found === undefined || found.sections.length === 0)
        list.replaceChildren(elementOf("p", "plan-none", "No chapters yet"));
    else
        list.replaceChildren(...[...new Set(found.sections.map((section: SkillSection): string => section.chapter))]
            .map((chapter: string): HTMLElement => groupOf(found, chapter)));
    place.hidden = false;
}

/**
 * Shows in the tree the chapter of the address, see `chapterShow` in `../notes/tree.ts`, once the tree is there,
 * like the chapter whose name I clicked; the module the tree picks itself, from the address.
 * - `picked`: The module in the tree, `null` for one not in it.
 * - `shown`: The chapter in it, `null` for none.
 *
 * @param tree - The tree
 * @param module - Name of the folder of the module, like `IN2028_BusinessAnalyticsMachineLearning`
 * @param chapter - Name of the chapter, like `01_RegressionAnalysis`, empty for none
 */
export function overviewTreeShow(tree: HTMLElement, module: string, chapter: string): void {
    const picked: HTMLElement | null = tree.querySelector(`.tree-module[data-module="${CSS.escape(module)}"]`);
    const shown: HTMLElement | null = picked?.querySelector(`.tree-chapter[data-chapter="${CSS.escape(chapter)}"]`) ?? null;
    if (picked !== null && shown !== null)
        chapterShow(tree, picked, shown);
}
