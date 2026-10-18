/**
 * ## Overview
 *
 * What the scripts view shows of a module, or of one of its chapters, where a note stands, once I click its name
 * in the tree, see `pickerOf` in `../notes/tree.ts`: where each of its sections stands, readable at a glance,
 * in the look of the day view, see `../day/`, as Today, see `./today.ts`:
 * - on top, as the date of the day, small and grey the way up, linking there, `NomSkillingmodules` to Today above
 *   a module, the module above a chapter, and below it its name, like `01_RegressionAnalysis`;
 * - below it grey how far it is, its sections ready of all, like `Ready 1 / 21`, how many Today lists open,
 *   like `2 due today`, and for a module its exam, like `Exam ≈ Thu, 25.02.2027`, as the skill view says them;
 * - then each section a card as a box of the plan, see `.box` in `../day/boxes.css`, in the order of the notes,
 *   a module's under the names of their chapters, each opening the overview of its chapter: the name of the section
 *   in words, like `Sample Mean Estimator`, below it grey the days I learned it, like
 *   `Learned on 11.10.2026 and 12.10.2026`, and beside it in columns, named once above them:
 *   - `Round`: its round, like `2`, the one its view shows, see `./round.ts`, `Ready` once its Task has its four runs
 *     spaced, `New` while I never learned it;
 *   - `Next`: `Today` while Today lists it open, see `itemsOf` in `./today.ts`, else the day its Task comes back,
 *     like `Mon, 19.10.2026`, else nothing;
 *   - `Right`, `Wrong`: how many of my attempts at its tasks were right, and how many not, its Examples among them;
 *   a section I never learned grey, as a box not for now, unless Today offers it; a tap on a card opens the section.
 * Everything is computed from the log by the reader, see `reader/skill.ts`, and what Today lists by Today's own rule;
 * nothing is kept here. The counts stand here and not at a task, so a task shows only itself, see `../skill/task.ts`.
 * Where the page is narrow, as on the laptop, a card holds its name on top and its values below it in one grey line,
 * each named, like `Round 2 · Today · 5 right · 1 wrong`.
 *
 * - `../skill/attempts.ts`: Loads the modules with their tasks and sections, and writes days out.
 * - `./today.ts`: What Today lists, and the name of a section in words.
 * - `../notes/tree.ts`: The addresses of a note and of an overview, and shows a chapter in the tree.
 * - `../day/choices.ts`: Marks where a long name may go on below.
 * - `../food/foods.ts`: Makes elements.
 * - `../day/boxes.css`: Look of the cards, those of the plan.
 * - `./overview.css`: Look of the overview.
 */

import { dayTextOf, skillingLoad } from "../skill/attempts.ts";
import { itemsOf, wordsOf } from "./today.ts";
import { chapterShow, noteAddressOf, overviewAddressOf } from "../notes/tree.ts";
import { breakableOf } from "../day/choices.ts";
import { elementOf } from "../food/foods.ts";
import "../day/boxes.css";
import "./overview.css";

import type { Attempt, SkillModule, SkillSection, SkillTask, Skilling } from "../skill/attempts.ts";
import type { Item } from "./today.ts";


/**
 * Where a section stands, as its card shows it.
 *
 * - `round`: Its round, like `2`, `Ready` once ready, `New` while never learned.
 * - `next`: `Today` while Today lists it open, else the day its Task comes back, like `Mon, 19.10.2026`, else empty.
 * - `right`: Number of my attempts at its tasks that were right.
 * - `wrong`: Number of them that were not, skips left out.
 * - `ready`: Whether it is ready.
 * - `fresh`: Whether I never learned it.
 * - `today`: Whether Today lists it open.
 */
type SectionState = {
    round: string;
    next: string;
    right: number;
    wrong: number;
    ready: boolean;
    fresh: boolean;
    today: boolean;
};

/**
 * Writes days as a list in words, like `11.10.2026, 12.10.2026 and 17.10.2026`.
 */
const dayList: Intl.ListFormat = new Intl.ListFormat("en-GB", { type: "conjunction" });


/**
 * Tells where a section stands, see the top of this file.
 * - `own`: Its tasks.
 * - `attempts`: My attempts at them, skips left out.
 * - `due`: The day its Task comes back, empty for none: the Task of today holds it, see `reader/skill.ts`.
 * - `fresh`: Whether I never learned it.
 *
 * @param module - Its module with its tasks
 * @param section - The section
 * @param open - Addresses of what Today lists open
 * @param today - Today like `2026-10-17`
 * @returns Where it stands
 */
function stateOf(module: SkillModule, section: SkillSection, open: Set<string>, today: string): SectionState {
    const own: SkillTask[] = module.tasks.filter((task: SkillTask): boolean => task.note === section.note);
    const attempts: Attempt[] = own.flatMap((task: SkillTask): Attempt[] => task.attempts)
        .filter((attempt: Attempt): boolean => attempt.result !== "skipped");
    const due: string = own.find((task: SkillTask): boolean => task.kind === "cold" && task.due !== "")?.due ?? "";
    const ready: boolean = own.some((task: SkillTask): boolean => task.id === section.cold && task.ready);
    const fresh: boolean = section.days.length === 0;
    const listed: boolean = open.has(noteAddressOf(section.note, ""));
    let round: string = String(section.round);
    if (ready)
        round = "Ready";
    else if (fresh)
        round = "New";
    return {
        round: round,
        next: listed ? "Today" : due > today ? dayTextOf(due, true) : "",
        right: attempts.filter((attempt: Attempt): boolean => attempt.result === "right").length,
        wrong: attempts.filter((attempt: Attempt): boolean => attempt.result !== "right").length,
        ready: ready,
        fresh: fresh,
        today: listed,
    };
}

/**
 * Makes a value of a card, with its name for a narrow page, see `.overview-label` in `./overview.css`.
 *
 * @param className - Class of its column, like `overview-round`
 * @param value - The value, empty for none
 * @param before - Its name before it, like `Round `, empty for none
 * @param after - Its name after it, like ` right`, empty for none
 * @returns The value
 */
function valueOf(className: string, value: string, before: string, after: string): HTMLElement {
    const element: HTMLElement = elementOf("span", `overview-value ${className}`, "");
    if (value === "")
        return element;
    element.append(...(before === "" ? [] : [elementOf("span", "overview-label", before)]), value,
        ...(after === "" ? [] : [elementOf("span", "overview-label", after)]));
    return element;
}

/**
 * Makes the card of a section, see the top of this file: a link to it, its name, its values in their columns,
 * and the days I learned it below its name.
 * - `card`: The card.
 * - `numbered`: Whether its round is a number, named `Round` on a narrow page.
 *
 * @param section - The section
 * @param state - Where it stands
 * @returns The card
 */
function cardOf(section: SkillSection, state: SectionState): HTMLAnchorElement {
    const card: HTMLAnchorElement = document.createElement("a");
    const numbered: boolean = /^\d+$/.test(state.round);
    card.className = "box overview-card";
    card.classList.toggle("overview-fresh", state.fresh && !state.today);
    card.href = noteAddressOf(section.note, "");
    card.append(elementOf("span", "overview-name", wordsOf(section)),
        valueOf("overview-round", state.round, numbered ? "Round " : "", ""),
        valueOf(`overview-next${state.today ? " overview-today" : ""}`, state.next,
            state.today || state.next === "" ? "" : "Next ", ""),
        valueOf("overview-count", state.fresh ? "" : String(state.right), "", " right"),
        valueOf("overview-count", state.fresh ? "" : String(state.wrong), "", " wrong"));
    if (!state.fresh)
        card.append(elementOf("span", "overview-days",
            `Learned on ${dayList.format(section.days.map((day: string): string => dayTextOf(day, false)))}`));
    return card;
}

/**
 * Makes the sections of one chapter, see the top of this file: a row naming the columns, in a module first
 * the name of the chapter, linking to its overview, and grey how many of its sections are ready; then their cards.
 * - `group`: The sections with their row.
 * - `head`: The row.
 * - `name`: The name of the chapter with its ready number.
 * - `link`: The link of the name.
 *
 * @param module - Its module
 * @param chapter - Name of the chapter, like `01_RegressionAnalysis`, empty in its own overview
 * @param sections - Its sections with where each stands
 * @returns The group
 */
function groupOf(module: SkillModule, chapter: string, sections: [SkillSection, SectionState][]): HTMLElement {
    const group: HTMLElement = elementOf("section", "overview-group", "");
    const head: HTMLElement = elementOf("div", "overview-head", "");
    const name: HTMLElement = elementOf("h3", "overview-chapter", "");
    if (chapter !== "") {
        const link: HTMLAnchorElement = document.createElement("a");
        link.href = overviewAddressOf(module.title, chapter);
        link.textContent = breakableOf(chapter);
        name.append(link, elementOf("span", "overview-ready", `Ready ${sections.filter(
            ([, state]: [SkillSection, SectionState]): boolean => state.ready).length} / ${sections.length}`));
    }
    head.append(name, ...["Round", "Next", "Right", "Wrong"].map((label: string): HTMLElement =>
        elementOf("span", `overview-column overview-column-${label.toLowerCase()}`, label)));
    group.append(head, ...sections.map(([section, state]: [SkillSection, SectionState]): HTMLAnchorElement =>
        cardOf(section, state)));
    return group;
}

/**
 * Writes how far a module or a chapter is, see the top of this file.
 * - `due`: How many of its sections Today lists open.
 * - `parts`: The parts of the line.
 *
 * @param states - Where each of its sections stands
 * @param module - Its module, for its exam, `null` for a chapter
 * @returns Line like `Ready 1 / 21 · 2 due today · Exam ≈ Thu, 25.02.2027`
 */
function summaryOf(states: SectionState[], module: SkillModule | null): string {
    const due: number = states.filter((state: SectionState): boolean => state.today).length;
    const parts: string[] = [
        `Ready ${states.filter((state: SectionState): boolean => state.ready).length} / ${states.length}`,
        due === 0 ? "Nothing due today" : `${due} due today`,
    ];
    if (module !== null)
        parts.push(`Exam ${module.exam.estimated ? "≈ " : ""}${dayTextOf(module.exam.day, true)}`);
    return parts.join(" · ");
}

/**
 * Gives the sections of a module, or of one of its chapters, each with where it stands, see {@link stateOf}.
 * - `open`: Addresses of what Today lists open in the module.
 *
 * @param module - The module with its tasks and sections
 * @param chapter - Name of the chapter, like `01_RegressionAnalysis`, empty for the whole module
 * @param today - Today like `2026-10-17`
 * @returns The sections in the order of the notes
 */
function sectionsOf(module: SkillModule, chapter: string, today: string): [SkillSection, SectionState][] {
    const open: Set<string> = new Set(itemsOf(module, today).filter((item: Item): boolean => !item.done)
        .map((item: Item): string => item.address));
    return module.sections.filter((section: SkillSection): boolean => chapter === "" || section.chapter === chapter)
        .map((section: SkillSection): [SkillSection, SectionState] => [section, stateOf(module, section, open, today)]);
}

/**
 * Shows the overview of a module or of one of its chapters in its place, see the top of this file;
 * a module without sections says `No chapters yet`, as the tree does, a chapter without them `No sections yet`.
 * - `skilling`: Every module with its tasks and sections.
 * - `found`: The module, `undefined` for one not of the semester.
 * - `sections`: Its sections, of the chapter only for a chapter, each with where it stands.
 * - `up`: The way up, small and grey above the name.
 * - `list`: The place of the cards.
 * - `chapters`: The chapters of a module, in the order of their sections.
 *
 * @param place - Where the overview goes, see `#editor-overview` in `./editor.html`
 * @param module - Name of the folder of the module, like `IN2028_BusinessAnalyticsMachineLearning`
 * @param chapter - Name of the chapter, like `01_RegressionAnalysis`, empty for the whole module
 * @param today - Today like `2026-10-17`
 * @throws {Error} - When the reader cannot read the tasks
 */
export async function overviewShow(place: HTMLElement, module: string, chapter: string, today: string): Promise<void> {
    const skilling: Skilling = await skillingLoad();
    const found: SkillModule | undefined = skilling.modules.find((candidate: SkillModule): boolean =>
        candidate.title === module);
    const sections: [SkillSection, SectionState][] = found === undefined ? [] : sectionsOf(found, chapter, today);
    const up: HTMLAnchorElement = place.querySelector(".overview-up") as HTMLAnchorElement;
    const list: HTMLElement = place.querySelector(".overview-list") as HTMLElement;
    up.href = chapter === "" ? "/scripts" : overviewAddressOf(module, "");
    up.textContent = breakableOf(chapter === "" ? "NomSkillingmodules" : module);
    (place.querySelector(".day-date") as HTMLElement).textContent = breakableOf(chapter === "" ? module : chapter);
    (place.querySelector(".overview-summary") as HTMLElement).textContent = summaryOf(
        sections.map(([, state]: [SkillSection, SectionState]): SectionState => state),
        chapter === "" ? found ?? null : null);
    if (found === undefined || sections.length === 0) {
        list.replaceChildren(elementOf("p", "plan-none", chapter === "" ? "No chapters yet" : "No sections yet"));
    } else if (chapter !== "") {
        list.replaceChildren(groupOf(found, "", sections));
    } else {
        const chapters: string[] = [...new Set(sections.map(([section]: [SkillSection, SectionState]): string =>
            section.chapter))];
        list.replaceChildren(...chapters.map((name: string): HTMLElement => groupOf(found, name,
            sections.filter(([section]: [SkillSection, SectionState]): boolean => section.chapter === name))));
    }
    place.hidden = false;
}

/**
 * Shows in the tree the chapter whose overview is shown, see `chapterShow` in `../notes/tree.ts`, once the tree is
 * there; the module the tree picks itself, from the address.
 * - `picked`: The module in the tree, `null` for one not in it.
 * - `shown`: The chapter in it, `null` for none.
 *
 * @param tree - The tree
 * @param module - Name of the folder of the module, like `IN2028_BusinessAnalyticsMachineLearning`
 * @param chapter - Name of the chapter, like `01_RegressionAnalysis`, empty for the whole module
 */
export function overviewTreeShow(tree: HTMLElement, module: string, chapter: string): void {
    const picked: HTMLElement | null = tree.querySelector(`.tree-module[data-module="${CSS.escape(module)}"]`);
    const shown: HTMLElement | null = picked?.querySelector(`.tree-chapter[data-chapter="${CSS.escape(chapter)}"]`) ?? null;
    if (picked !== null && shown !== null)
        chapterShow(tree, picked, shown);
}
