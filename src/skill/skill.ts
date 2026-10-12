/**
 * ## Skill
 *
 * The overview of each module of the semester, kept simple: how far it is, what is due today,
 * and every section by chapter with its state, see `reader/skill.ts`; each task links to its heading in the notes view,
 * where I solve it, record the attempt and see its history and source.
 * - At the top the name of the module and the ready number, its sections whose cold task has its three runs,
 *   like `Ready 0 / 36`, since the section is the unit, not the task; below it grey its exam,
 *   like `Exam ≈ Thursday, 25.02.2027`, `≈` while the day is estimated; then what needs a look:
 *   task headings found twice and attempts on removed tasks.
 * - Due today: the tasks due today or earlier, the earliest first, a cold task with its parts still open;
 *   each opens as a card, its text alone, so I choose the method myself, see `cardSet` in `../notes/notes.ts`.
 * - The chapters, each open at first and folding by a click on its line, which shows how many of its sections are ready;
 *   in each its sections, closed, each with how many of its tasks I tried and the state of its cold task at the right,
 *   like `4 / 12 tried · Due Sunday, 18.10.2026`; a section opens to its tasks, each with its state:
 *   `New`, `Due today`, `Due Monday, 12.10.2026`, `Done`, `Ready` or `Skipped`.
 * A module without tasks, since it has no chapter notes yet, shows only its name and `No chapters yet`.
 * Formulas `$…$` in names are rendered as in the notes.
 *
 * - `./attempts.ts`: Loads the tasks with when they are due, writes days out and gives today as I live it.
 * - `./task.ts`: Tells when a task is due.
 * - `../notes/math.ts`: Renders the formulas as the notes view does, loaded only when there is one.
 * - `./skill.css`: Look of the skill view.
 */

import { dayTextOf, skillingLoad, todayOf } from "./attempts.ts";
import { stateTextOf } from "./task.ts";
import "./skill.css";

import type { SkillModule, SkillSection, SkillTask, Skilling, Task } from "./attempts.ts";


/**
 * Formula `$…$` within a text, as Obsidian reads it: no space after the opening `$`, none before the closing one
 * and no digit after it, so `$5 and $6` stays text; a backslash keeps the next character. With its TeX.
 */
const formula: RegExp = /\$(?![\s$])((?:\\.|[^\\$])+?)(?<!\s)\$(?!\d)/;


/**
 * Makes an element with a class and a text.
 *
 * @param tag - Name of the element, like `div`
 * @param className - Class, empty for none
 * @param text - Text, empty for none
 * @returns Element
 */
function elementOf(tag: string, className: string, text: string): HTMLElement {
    const element: HTMLElement = document.createElement(tag);
    element.className = className;
    element.textContent = text;
    return element;
}

/**
 * Puts a text into an element, each formula `$…$` of it as an element of the class `math` with its TeX,
 * as the notes have them, for `../notes/math.ts` to render.
 * - `parts`: The text cut at its formulas, text and TeX taking turns, see {@link String#split}.
 *
 * @param element - Element to fill
 * @param text - Text, like `choosing $z$ or $t$`
 * @returns The element
 */
function textPut(element: HTMLElement, text: string): HTMLElement {
    const parts: string[] = text.split(formula);
    element.append(...parts.map((part: string, index: number): Node =>
        index % 2 === 0 ? document.createTextNode(part) : elementOf("span", "math math-inline", part)));
    return element;
}

/**
 * Makes a link.
 *
 * @param className - Class, empty for none
 * @param text - Text of the link, formulas rendered
 * @param address - Address it opens
 * @returns Link
 */
function linkOf(className: string, text: string, address: string): HTMLAnchorElement {
    const link: HTMLAnchorElement = document.createElement("a");
    link.className = className;
    link.href = address;
    textPut(link, text);
    return link;
}

/**
 * Builds the address of a note in the notes view, at a heading.
 *
 * @param note - Path of the note
 * @param heading - Heading, empty for the top
 * @returns Address like `/notes?path=…#Task.%20Airline%20Revenue%20Interval`
 */
function noteAddressOf(note: string, heading: string): string {
    const address: string = `/notes?path=${encodeURIComponent(note)}`;
    if (heading === "")
        return address;
    return `${address}#${encodeURIComponent(heading)}`;
}

/**
 * Builds the address of a task as a card in the notes view, its text alone, as a due task opens, see `cardSet`
 * in `../notes/notes.ts`.
 *
 * @param task - Task
 * @returns Address like `/notes?path=…&card=1#Task.%20Kiosk%20Chain%20Review%20(cold)`
 */
function cardAddressOf(task: SkillTask): string {
    return `/notes?path=${encodeURIComponent(task.note)}&card=1#${encodeURIComponent(task.heading)}`;
}

/**
 * Builds the line of a task: its name linking to its heading in the notes view, or to its card, `cold` after a cold task
 * with its parts still open when only some are, and its state at the right, grey, when given.
 * - `name`: Link of the task.
 *
 * @param task - Task
 * @param state - Its state, like `New`, empty for none
 * @param card - Whether the name opens the task as a card, see {@link cardAddressOf}
 * @returns Line
 */
function taskLineOf(task: SkillTask, state: string, card: boolean): HTMLElement {
    const line: HTMLElement = elementOf("li", "skill-task", "");
    const name: HTMLElement = linkOf("skill-name", task.name, card ? cardAddressOf(task) : noteAddressOf(task.note, task.heading));
    if (task.cold) {
        let cold: string = " cold";
        if (task.open.length > 0 && task.open.length < task.parts.length)
            cold += ` · ${task.open.map((part: string): string => `${part})`).join(" ")}`;
        name.append(elementOf("span", "skill-cold", cold));
    }
    line.append(name);
    if (state !== "")
        line.append(elementOf("span", "skill-state", state));
    return line;
}

/**
 * Builds the tasks due today or earlier, the earliest first, under their heading with their number;
 * a hint when nothing is due.
 * - `due`: Tasks due, not skipped.
 * - `part`: The part with its heading.
 * - `list`: The tasks.
 *
 * @param tasks - Tasks of the module
 * @param today - Today like `2026-10-10`
 * @returns Part of the overview
 */
function dueTodayOf(tasks: SkillTask[], today: string): HTMLElement {
    const due: SkillTask[] = tasks
        .filter((task: SkillTask): boolean => !task.skipped && task.due !== "" && task.due <= today)
        .sort((first: SkillTask, second: SkillTask): number => first.due.localeCompare(second.due));
    const part: HTMLElement = elementOf("section", "skill-part", "");
    const heading: HTMLElement = elementOf("h3", "", "Due today ");
    const list: HTMLElement = elementOf("ul", "skill-tasks", "");
    heading.append(elementOf("span", "skill-count", String(due.length)));
    list.append(...due.map((task: SkillTask): HTMLElement => taskLineOf(task, "", true)));
    part.append(heading, due.length === 0 ? elementOf("p", "skill-none", "Nothing due today") : list);
    return part;
}

/**
 * Builds a section with its tasks: a fold, closed, whose line holds its name linking to its note,
 * and at the right how many of its tasks I tried and the state of its cold task; open, the line of each task.
 * - `own`: Its tasks.
 * - `cold`: Its cold task, `undefined` for none yet.
 * - `state`: The tried tasks and the state of the cold task.
 *
 * @param section - Section
 * @param tasks - Tasks of the module
 * @param today - Today like `2026-10-10`
 * @returns Fold of the section
 */
function sectionOf(section: SkillSection, tasks: SkillTask[], today: string): HTMLElement {
    const own: SkillTask[] = tasks.filter((task: SkillTask): boolean => task.note === section.note);
    const cold: SkillTask | undefined = own.find((task: SkillTask): boolean => task.id === section.cold);
    const fold: HTMLDetailsElement = document.createElement("details");
    const summary: HTMLElement = elementOf("summary", "skill-task", "");
    const list: HTMLElement = elementOf("ul", "skill-tasks skill-section-tasks", "");
    let state: string = `${section.tried} / ${section.tasks} tried`;
    if (cold !== undefined && stateTextOf(cold, today) !== "")
        state += ` · ${stateTextOf(cold, today)}`;
    fold.className = "skill-section";
    summary.append(linkOf("skill-name", section.title, noteAddressOf(section.note, "")), elementOf("span", "skill-state", state));
    list.append(...own.map((task: SkillTask): HTMLElement => taskLineOf(task, stateTextOf(task, today), false)));
    fold.append(summary, list);
    return fold;
}

/**
 * Counts the sections whose cold task is ready.
 *
 * @param module - Module with its tasks
 * @param sections - Sections of the module, like those of a chapter
 * @returns Number of ready sections
 */
function readyOf(module: SkillModule, sections: SkillSection[]): number {
    return sections.filter((section: SkillSection): boolean => module.tasks.some((task: SkillTask): boolean =>
        task.id === section.cold && task.ready)).length;
}

/**
 * Builds every section of the module chapter by chapter, in the order of the notes, see {@link sectionOf};
 * each chapter open, folding by its line, which shows how many of its sections are ready.
 * - `chapters`: Chapters in the order of the sections.
 *
 * @param module - Module with its tasks and sections
 * @param today - Today like `2026-10-10`
 * @returns Chapters
 */
function chaptersOf(module: SkillModule, today: string): HTMLElement[] {
    const chapters: string[] = [...new Set(module.sections.map((section: SkillSection): string => section.chapter))];
    return chapters.map((chapter: string): HTMLElement => {
        const own: SkillSection[] = module.sections.filter((section: SkillSection): boolean => section.chapter === chapter);
        const folder: HTMLDetailsElement = document.createElement("details");
        const summary: HTMLElement = elementOf("summary", "", chapter);
        folder.className = "skill-chapter";
        folder.open = true;
        summary.append(elementOf("span", "skill-count", `${readyOf(module, own)} / ${own.length} ready`));
        folder.append(summary, ...own.map((section: SkillSection): HTMLElement => sectionOf(section, module.tasks, today)));
        return folder;
    });
}

/**
 * Builds the overview of a module, see the top of this file; a module without tasks shows `No chapters yet`.
 *
 * @param module - Module with its tasks
 * @param today - Today like `2026-10-10`
 * @returns Section of the module
 */
function moduleElementOf(module: SkillModule, today: string): HTMLElement {
    const section: HTMLElement = elementOf("section", "skill-module", "");
    const head: HTMLElement = elementOf("div", "skill-head", "");

    head.append(elementOf("h2", "", module.title));
    if (module.tasks.length > 0)
        head.append(elementOf("span", "skill-ready", `Ready ${readyOf(module, module.sections)} / ${module.sections.length}`));
    section.append(head, elementOf("p", "skill-exam",
        `Exam ${module.exam.estimated ? "≈ " : ""}${dayTextOf(module.exam.day, true)}`));
    module.duplicates.forEach((task: Task): void => {
        const notice: HTMLElement = elementOf("p", "skill-notice", "Task heading found twice: ");
        notice.append(linkOf("", task.name, noteAddressOf(task.note, task.heading)));
        section.append(notice);
    });
    if (module.removed > 0)
        section.append(elementOf("p", "skill-notice",
            `${module.removed} ${module.removed === 1 ? "attempt" : "attempts"} on removed tasks`));
    if (module.tasks.length === 0)
        section.append(elementOf("p", "skill-none", "No chapters yet"));
    else
        section.append(dueTodayOf(module.tasks, today), ...chaptersOf(module, today));
    return section;
}

/**
 * Loads the tasks from the reader and shows the overview of every module, then renders the formulas, if there are any.
 * - `modules`: Place of the modules in the view.
 *
 * @throws {Error} - When the reader cannot answer
 */
async function skillShow(): Promise<void> {
    const skilling: Skilling = await skillingLoad();
    const today: string = todayOf();
    const modules: HTMLElement = document.getElementById("skill-modules") as HTMLElement;
    modules.replaceChildren(...skilling.modules.map((module: SkillModule): HTMLElement => moduleElementOf(module, today)));
    if (modules.querySelector(".math") !== null)
        (await import("../notes/math.ts")).mathRender(modules);
}


/**
 * Starts the skill view after the router has put its HTML into the page,
 * or shows a hint when the reader cannot read the tasks.
 */
export async function skillStart(): Promise<void> {
    await skillShow().catch((error: unknown): void => {
        console.error(error);
        document.getElementById("skill-modules")?.replaceChildren(
            elementOf("p", "skill-none", "The tasks cannot be read"));
    });
}
