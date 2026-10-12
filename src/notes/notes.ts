/**
 * ## Notes
 *
 * Shows a menu on the left and the chosen note on the right, rendered like Obsidian, read only.
 * The menu holds the modules of the semester at the top and below them the chapters of the chosen one,
 * each folding its notes, or `No chapters yet`; under the shown note stands its outline, as Obsidian's outline.
 * The reader gives the modules, each with the chapters of its folder and of its drafts together.
 * Paths are those of the reader: from `NomSkillingmodules`, or with `Drafts/` before for the drafts.
 * A note opens from the menu or from a link in a note, without loading the page again; a link may also lead
 * to a note of a module not in the menu. Its links lead to notes and files of the same module, as the reader resolved them,
 * a draft's also to the files of its module, like the lecture's slides; a PDF opens at the page its link names,
 * like `#page=10`, and a link that leads nowhere is faded and dotted, its tooltip naming what it looked for.
 * Images and embedded notes come from the reader, and the formulas are rendered last.
 * Here I read and solve: each block under a heading `##` folds by a click on its heading, and under the heading
 * of each task of the semester stands its row: when it is due, its history, the buttons for the next attempt,
 * the copy icon for my tutor, and right after an attempt the tap for my effort on it; a theory block has the copy
 * icon alone. A solution opens one step per click, see {@link stepsPut}.
 * A cold task, its heading ending with `(cold)`, shows a grey label beside its heading in place of `(cold)`,
 * like `cold · 2 done · 1 right`.
 * The address keeps the shown note and heading, like `/notes?path=MA0902_…/05_07_TrigonometrischeFunktionen.md#…`,
 * so a reload and the back button of the browser stay on it.
 *
 * - `./markdown.ts`: Turns the Markdown of a note into HTML, with Obsidian's syntax.
 * - `./math.ts`: Renders the formulas, as Obsidian does.
 * - `../skill/attempts.ts`: Loads the tasks with when they are due and gives today as I live it.
 * - `../skill/task.ts`: Builds the row of a task with its buttons, the label of a cold task, and the copy icon.
 * - `./tutor.ts`: Writes the text for my tutor about a task or a theory block, which its copy icon puts
 *   on the clipboard.
 * - `lucide`: The pencil beside the name of a draft.
 * - `../icons.ts`: Puts the pencil into its link.
 * - `./notes.css`: Look of the menu and of the notes.
 */

import { htmlOf } from "./markdown.ts";
import { mathRender } from "./math.ts";
import { skillingLoad, todayOf } from "../skill/attempts.ts";
import { coldLabelOf, taskRowOf, tutorCopyOf } from "../skill/task.ts";
import { theoryTextOf, tutorTextOf } from "./tutor.ts";
import { Pencil } from "lucide";
import { iconPut } from "../icons.ts";
import "./notes.css";

import type { SkillModule, SkillTask, Skilling } from "../skill/attempts.ts";


/**
 * A note of a chapter, as the reader sends it.
 *
 * - `name`: Name of the file, like `01_01_EstimatorConfidenceInterval.md`.
 * - `path`: Path.
 */
type NoteEntry = {
    name: string;
    path: string;
};

/**
 * A chapter with its notes, as the reader sends it.
 *
 * - `title`: Its name to read, like `01 Regression Analysis`.
 * - `notes`: Its notes in order.
 */
type Chapter = {
    title: string;
    notes: NoteEntry[];
};

/**
 * A module of the semester with its chapters, as the reader sends it.
 *
 * - `name`: Name of its folder, like `IN2028_BusinessAnalyticsMachineLearning`.
 * - `title`: Its name to read, like `IN2028 Business Analytics Machine Learning`.
 * - `chapters`: Its chapters that hold notes, in order.
 */
type NotesModule = {
    name: string;
    title: string;
    chapters: Chapter[];
};

/**
 * A note with the files its links lead to, as the reader sends it.
 *
 * - `path`: Path of the note.
 * - `text`: Markdown text of the note.
 * - `links`: For each link of the note as written, the path of the file it leads to, `null` when it leads nowhere.
 */
type LinkedNote = {
    path: string;
    text: string;
    links: { [link: string]: string | null };
};

/**
 * How deep embedded notes may lie in each other, so a note that embeds itself ends.
 */
const embedDepth: number = 3;

/**
 * End of the heading of a cold task, `(cold)` with the space before it, like in `Task. Kiosk Chain Review (cold)`.
 */
const coldMark: RegExp = /[ \t]*\(cold\)$/;

/**
 * Modules of the semester with their chapters and notes, as the reader gave them when the view opened.
 */
let modules: NotesModule[] = [];

/**
 * Name of the folder of the module whose chapters the menu shows, empty before the first.
 */
let shownModule: string = "";

/**
 * Path of the note shown, empty before the first.
 */
let shownPath: string = "";


/**
 * Builds the address of a file of my modules at the reader, like an image of a note.
 *
 * @param path - Path
 * @returns Address like `/api/notes/file?path=…`
 */
function fileAddressOf(path: string): string {
    return `/api/notes/file?path=${encodeURIComponent(path)}`;
}

/**
 * Builds the address of a note in the notes view.
 *
 * @param path - Path of the note
 * @param heading - Heading to scroll to, empty for the top
 * @returns Address like `/notes?path=…#Heading`
 */
function noteAddressOf(path: string, heading: string): string {
    const address: string = `/notes?path=${encodeURIComponent(path)}`;
    if (heading === "")
        return address;
    return `${address}#${encodeURIComponent(heading)}`;
}

/**
 * Asks the reader for something as JSON.
 *
 * @param address - Address at the reader, like `/api/notes/modules`
 * @returns Answer of the reader
 * @throws {Error} - When the reader cannot answer, like for a missing note
 */
async function readerAsk<T>(address: string): Promise<T> {
    const response: Response = await fetch(address);
    if (!response.ok)
        throw new Error(`The reader could not answer ${address}`);
    return await response.json() as T;
}

/**
 * Asks the reader for a note with the files its links lead to.
 *
 * @param path - Path of the note
 * @returns Note with its links
 * @throws {Error} - When the reader cannot read the note
 */
function noteRead(path: string): Promise<LinkedNote> {
    return readerAsk<LinkedNote>(`/api/notes/note?path=${encodeURIComponent(path)}`);
}

/**
 * Makes a folder of the menu that folds, like a chapter: its name, and below it the place of its entries.
 *
 * @param name - Name shown, like `01 Regression Analysis`
 * @returns Folder, its entries to go into its last child
 */
function folderOf(name: string): HTMLDetailsElement {
    const folder: HTMLDetailsElement = document.createElement("details");
    const summary: HTMLElement = document.createElement("summary");
    const children: HTMLDivElement = document.createElement("div");
    folder.className = "tree-folder";
    summary.textContent = name;
    children.className = "tree-children";
    folder.append(summary, children);
    return folder;
}

/**
 * Builds a chapter of the menu: its name to read as a folder, its notes in it, each linking to the note,
 * named without `.md` as in Obsidian.
 *
 * @param chapter - Chapter with its notes
 * @returns Folder of the chapter, closed
 */
function chapterElementOf(chapter: Chapter): HTMLDetailsElement {
    const folder: HTMLDetailsElement = folderOf(chapter.title);
    folder.lastElementChild?.append(...chapter.notes.map((note: NoteEntry): HTMLAnchorElement => {
        const link: HTMLAnchorElement = document.createElement("a");
        link.className = "tree-file";
        link.dataset.path = note.path;
        link.href = noteAddressOf(note.path, "");
        link.textContent = note.name.replace(/\.md$/i, "");
        return link;
    }));
    return folder;
}

/**
 * Builds the outline of the shown note, as Obsidian's outline: each heading `##` in order, linking to it,
 * each task under the block above it that is no task, like `Definition. Standard Error of the Mean`,
 * which then folds its tasks by its arrow and still links to its heading by its name;
 * tasks named without `Task.`, formulas as rendered in the note.
 * A block without tasks below it stays a plain link, and so does a task without such a block above it;
 * a cold task, named also without `(cold)`, stands alone, at the end of its section.
 * - `block`: Link of the last block that is no task, until its first task makes it a folder.
 * - `tasks`: Place of the tasks below that block, the outline itself before the first block.
 * - `link`: Link to a heading, with copies of the heading's text and formulas, without the label of a cold task.
 *
 * @returns Outline, to stand under the shown note in the menu
 */
function outlineOf(): HTMLDivElement {
    const outline: HTMLDivElement = document.createElement("div");
    let block: HTMLAnchorElement | null = null;
    let tasks: HTMLElement = outline;
    outline.className = "tree-children tree-outline";
    document.querySelectorAll<HTMLElement>("#notes-text > .fold > summary > h2").forEach((heading: HTMLElement): void => {
        const text: string = heading.dataset.heading ?? "";
        const link: HTMLAnchorElement = document.createElement("a");
        link.className = "tree-file";
        link.href = noteAddressOf(shownPath, text);
        link.append(...[...heading.childNodes]
            .filter((node: Node): boolean => !(node instanceof Element && node.classList.contains("task-cold")))
            .map((node: Node): Node => node.cloneNode(true)));
        if (!text.startsWith("Task. ")) {
            outline.append(link);
            block = link;
            tasks = outline;
            return;
        }

        if (link.firstChild?.nodeType === Node.TEXT_NODE)
            link.firstChild.textContent = (link.firstChild.textContent ?? "").replace(/^Task\.\s*/, "");
        if (coldMark.test(text)) {
            if (link.lastChild?.nodeType === Node.TEXT_NODE)
                link.lastChild.textContent = (link.lastChild.textContent ?? "").replace(coldMark, "");
            outline.append(link);
            return;
        }
        if (block !== null) {
            const folder: HTMLDetailsElement = folderOf("");
            folder.open = true;
            block.replaceWith(folder);
            folder.firstElementChild?.replaceChildren(block);
            tasks = folder.lastElementChild as HTMLElement;
            block = null;
        }
        tasks.append(link);
    });
    return outline;
}

/**
 * Marks the shown note in the menu, when it is among the chapters shown: opens its chapter, marks it,
 * puts its outline under it and scrolls the menu to it.
 * - {@link CSS.escape}: Writes a path so it can stand inside a selector.
 * - `file`: Entry of the shown note in the menu.
 */
function noteMark(): void {
    const menu: HTMLElement = document.getElementById("notes-tree") as HTMLElement;
    menu.querySelectorAll(".tree-outline").forEach((outline: Element): void => outline.remove());
    menu.querySelectorAll(".tree-file.shown").forEach((file: Element): void => file.classList.remove("shown"));
    const file: HTMLElement | null = menu.querySelector(`.tree-file[data-path="${CSS.escape(shownPath)}"]`);
    if (file === null)
        return;

    file.classList.add("shown");
    (file.closest("details") as HTMLDetailsElement).open = true;
    file.after(outlineOf());
    file.scrollIntoView({ block: "nearest" });
}

/**
 * Shows a module in the menu: marks it, and shows its chapters below the modules, closed but the one of the shown note,
 * or a calm `No chapters yet` for a module without chapter notes, as the skill view says it.
 * - `chapters`: Folders of the chapters of the module.
 * - `none`: The hint for a module without them.
 *
 * @param name - Name of the folder of the module
 */
function moduleShow(name: string): void {
    const module: NotesModule | undefined = modules.find((candidate: NotesModule): boolean => candidate.name === name);
    const chapters: HTMLElement[] = (module?.chapters ?? []).map(chapterElementOf);
    const none: HTMLParagraphElement = document.createElement("p");
    shownModule = name;
    none.className = "tree-none";
    none.textContent = "No chapters yet";
    document.querySelectorAll<HTMLButtonElement>("#notes-modules button").forEach((button: HTMLButtonElement): void => {
        button.classList.toggle("shown", button.dataset.name === name);
    });
    document.getElementById("notes-chapters")?.replaceChildren(...(chapters.length > 0 || module === undefined ? chapters : [none]));
    noteMark();
}

/**
 * Shows the modules of the semester at the top of the menu, each by its name to read, a click showing its chapters.
 */
function modulesShow(): void {
    document.getElementById("notes-modules")?.replaceChildren(...modules.map((module: NotesModule): HTMLButtonElement => {
        const button: HTMLButtonElement = document.createElement("button");
        button.type = "button";
        button.dataset.name = module.name;
        button.textContent = module.title;
        button.addEventListener("click", (): void => moduleShow(module.name));
        return button;
    }));
}

/**
 * Shows in the menu the module of the shown note, when it is a module of the semester, and marks the note there.
 * A note of another module leaves the menu as it is, unmarked.
 * - `module`: Module of the semester holding the note.
 */
function treeReveal(): void {
    const module: NotesModule | undefined = modules.find((candidate: NotesModule): boolean =>
        candidate.chapters.some((chapter: Chapter): boolean =>
            chapter.notes.some((note: NoteEntry): boolean => note.path === shownPath)));
    if (module !== undefined && module.name !== shownModule)
        moduleShow(module.name);
    else
        noteMark();
}

/**
 * Takes the section under a heading out of a note, as Obsidian embeds `![[Note#Heading]]`:
 * from the heading to the next heading of the same or a higher level.
 *
 * @param text - Text of the note
 * @param heading - Heading as written, like `05.06. Definition. Eulersche Formel`
 * @returns Markdown of the section, empty when the note has no such heading
 */
function sectionOf(text: string, heading: string): string {
    const lines: string[] = text.split("\n");
    const levelOf: (line: string) => number = (line: string): number => /^(#{1,6})[ \t]/.exec(line)?.[1].length ?? 0;
    const start: number = lines.findIndex((line: string): boolean =>
        levelOf(line) > 0 && line.replace(/^#+[ \t]+/, "").trim() === heading);
    if (start === -1)
        return "";

    const end: number = lines.findIndex((line: string, index: number): boolean =>
        index > start && levelOf(line) > 0 && levelOf(line) <= levelOf(lines[start]));
    return lines.slice(start, end === -1 ? undefined : end).join("\n");
}

/**
 * Points a link of a note at the file the reader found: a note opens in the view at its heading,
 * any other file in a new tab, at the place its link names after `#`, like a PDF at its page with `#page=10`,
 * which the browser's PDF viewer opens; a link that leads nowhere stays faded and dead, as in Obsidian,
 * dotted below and with a tooltip naming what it looked for, so a broken source stands out.
 *
 * @param link - Link of a rendered note
 * @param path - Path of the file it leads to, `null` when there is none
 * @param heading - Heading to scroll to, or place in the file, like `page=10`; empty for the top
 */
function linkPoint(link: HTMLAnchorElement, path: string | null, heading: string): void {
    if (path === null) {
        link.classList.add("is-unresolved");
        link.title = `Leads nowhere: ${link.dataset.link ?? ""}`;
    } else if (path.toLowerCase().endsWith(".md")) {
        link.href = noteAddressOf(path, heading);
    } else {
        link.href = heading === "" ? fileAddressOf(path) : `${fileAddressOf(path)}#${heading}`;
        link.target = "_blank";
    }
}

/**
 * Fills an embedded note with its text, or with the section under its heading, rendered with its own links.
 *
 * @param embed - Empty element of the embed
 * @param path - Path of the embedded note, `null` when the link leads nowhere
 * @param heading - Heading of the section to embed, empty for the whole note
 * @param depth - How deep the embed lies in other embeds, the shown note being 0
 * @throws {Error} - When the reader cannot read the note
 */
async function embedShow(embed: HTMLElement, path: string | null, heading: string, depth: number): Promise<void> {
    if (path === null || depth >= embedDepth) {
        embed.classList.add("is-unresolved");
        embed.textContent = embed.dataset.link ?? "";
        return;
    }

    const note: LinkedNote = await noteRead(path);
    embed.innerHTML = htmlOf(heading === "" ? note.text : sectionOf(note.text, heading));
    await linksResolve(embed, note, depth + 1);
}

/**
 * Points the links, images and embedded notes of a rendered note at the files the reader found for them,
 * see {@link linkPoint} and {@link embedShow}; an image that leads nowhere shows its name.
 * Links out of my modules, like `https://…`, open in a new tab.
 *
 * @param element - Rendered note
 * @param note - Note with its links
 * @param depth - How deep the note lies in embeds, the shown note being 0
 * @throws {Error} - When the reader cannot read an embedded note
 */
async function linksResolve(element: HTMLElement, note: LinkedNote, depth: number): Promise<void> {
    const embeds: Promise<void>[] = [];
    element.querySelectorAll<HTMLElement>("[data-link]").forEach((linked: HTMLElement): void => {
        const path: string | null = note.links[linked.dataset.link ?? ""] ?? null;
        const heading: string = linked.dataset.heading ?? "";
        if (linked instanceof HTMLImageElement && path !== null)
            linked.src = fileAddressOf(path);
        else if (linked instanceof HTMLImageElement)
            linked.classList.add("is-unresolved");
        else if (linked instanceof HTMLAnchorElement)
            linkPoint(linked, path, heading);
        else
            embeds.push(embedShow(linked, path, heading, depth));
    });
    element.querySelectorAll<HTMLAnchorElement>("a[href]:not(.internal-link)").forEach((link: HTMLAnchorElement): void => {
        link.target = "_blank";
        link.rel = "noopener";
    });
    await Promise.all(embeds);
}

/**
 * Shows under the heading of each task of the shown note the row of the task: when it is due, its history,
 * the buttons for the next attempt, which go into the skill entry of the moment, Right and Wrong once its solution
 * is open, the copy icon for my tutor, and right after an attempt the tap for my effort on it;
 * after each attempt and effort the rows load again. Only tasks of the modules of the semester have a row.
 * A theory block, a block that is no task, gets the copy icon alone beside its heading, see `tutor.ts`.
 * - `tasks`: Tasks of the note, the first of each name.
 * - `today`: Today like `2026-10-10`.
 * - `fold`: Fold of a block.
 * - `solution`: Fold of the solution of a task, the fold inside its block, `null` for none.
 *
 * @param path - Path of the shown note
 * @param note - Markdown text of the shown note, for the text for my tutor
 * @throws {Error} - When the reader cannot read the tasks
 */
async function tasksShow(path: string, note: string): Promise<void> {
    const skilling: Skilling = await skillingLoad();
    if (path !== shownPath)
        return;

    const tasks: SkillTask[] = skilling.modules.flatMap((module: SkillModule): SkillTask[] => module.tasks)
        .filter((task: SkillTask): boolean => task.note === path);
    const today: string = todayOf();
    const text: HTMLElement = document.getElementById("notes-text") as HTMLElement;
    text.querySelectorAll(".task-row, .theory-row").forEach((row: Element): void => row.remove());
    text.querySelectorAll<HTMLElement>(":scope > .fold > summary > h2").forEach((heading: HTMLElement): void => {
        const fold: HTMLElement | null = heading.closest(".fold");
        const task: SkillTask | undefined = tasks.find((candidate: SkillTask): boolean =>
            candidate.heading === heading.dataset.heading);
        if (task === undefined) {
            if (tasks.length > 0 && !(heading.dataset.heading ?? "").startsWith("Task."))
                fold?.querySelector(":scope > .fold-content")?.prepend(theoryRowOf(heading.dataset.heading ?? "", note));
            return;
        }

        if (task.cold)
            coldLabelPut(heading, task);
        const solution: HTMLDetailsElement | null =
            fold?.querySelector<HTMLDetailsElement>(":scope > .fold-content > details.fold") ?? null;
        fold?.querySelector(":scope > .fold-content")?.prepend(
            taskRowOf(task, skilling.skips, skilling.efforts, today, (): string => tutorTextOf(task, note), solution,
                (): Promise<void> => tasksShow(path, note)));
    });
}

/**
 * Builds the row of a theory block: the quiet copy icon alone, which puts the block with its instruction
 * for my tutor on the clipboard, see `theoryTextOf` in `tutor.ts`.
 * - `row`: The row, at the right.
 *
 * @param heading - Heading of the block as written
 * @param note - Markdown text of the note
 * @returns Row
 */
function theoryRowOf(heading: string, note: string): HTMLElement {
    const row: HTMLElement = document.createElement("div");
    row.className = "task-row theory-row";
    row.append(tutorCopyOf((): string => theoryTextOf(heading, note), async (): Promise<void> => {}));
    return row;
}

/**
 * Turns each solution of the shown note into steps that open one per click, see `../skill/task.ts`:
 * its steps are the items of its lists, each in the order of the text, a parent before its own items,
 * and its other blocks, like a formula of its own; once the solution is open, the first step shows,
 * and below the solution `Next step` shows the next one and `Show all` the rest, as worked steps one at a time
 * let me predict each before I see it (van den Broek 2025).
 * - `content`: Content of a solution.
 * - `steps`: Its steps in order.
 * - `buttons`: Row of `Next step` and `Show all`.
 * - `shown`: Number of steps shown.
 * - `show`: Shows the steps up to a number, and the buttons while steps are hidden.
 *
 * @param text - Element of the shown note
 */
function stepsPut(text: HTMLElement): void {
    text.querySelectorAll<HTMLElement>("details.fold > .fold-content > details.fold > .fold-content").forEach(
        (content: HTMLElement): void => {
            const steps: HTMLElement[] = [...content.querySelectorAll<HTMLElement>(":scope > :not(ul, ol), li")];
            if (steps.length < 2)
                return;
            const buttons: HTMLElement = document.createElement("div");
            const next: HTMLButtonElement = document.createElement("button");
            const all: HTMLButtonElement = document.createElement("button");
            let shown: number = 1;
            const show: (count: number) => void = (count: number): void => {
                shown = Math.min(count, steps.length);
                steps.forEach((step: HTMLElement, index: number): void => {
                    step.classList.toggle("step-hidden", index >= shown);
                });
                buttons.hidden = shown >= steps.length;
            };
            buttons.className = "steps-buttons";
            next.type = "button";
            next.textContent = "Next step";
            next.addEventListener("click", (): void => show(shown + 1));
            all.type = "button";
            all.textContent = "Show all";
            all.addEventListener("click", (): void => show(steps.length));
            buttons.append(next, all);
            content.after(buttons);
            show(1);
        });
}

/**
 * Puts the label of a cold task beside its heading in place of its `(cold)`, see `../skill/task.ts`,
 * or in place of the label put before, so its numbers follow each attempt.
 * - `text`: Last text of the heading, which ends with `(cold)` until the first label.
 *
 * @param heading - Heading of the task
 * @param task - Cold task
 */
function coldLabelPut(heading: HTMLElement, task: SkillTask): void {
    heading.querySelector(".task-cold")?.remove();
    const text: ChildNode | null = heading.lastChild;
    if (text?.nodeType === Node.TEXT_NODE)
        text.textContent = (text.textContent ?? "").replace(coldMark, "");
    heading.append(coldLabelOf(task));
}

/**
 * Scrolls the note to a heading, opening the folded blocks around it, or to its top when the heading is empty or missing.
 * - `target`: The first heading with the text.
 *
 * @param heading - Heading as written, like `05.07. Definition. Tangens Cotangens`
 */
function headingShow(heading: string): void {
    const note: HTMLElement = document.getElementById("notes-note") as HTMLElement;
    const target: HTMLElement | undefined = [...note.querySelectorAll<HTMLElement>("#notes-text :is(h1, h2, h3, h4, h5, h6)")]
        .find((element: HTMLElement): boolean => element.dataset.heading === heading);
    if (heading === "" || target === undefined) {
        note.scrollTo(0, 0);
        return;
    }

    for (let fold: HTMLDetailsElement | null = target.closest("details"); fold !== null;
         fold = fold.parentElement?.closest("details") ?? null)
        fold.open = true;
    target.scrollIntoView();
}

/**
 * Shows a note: its name as title, as Obsidian does, for a draft with the pencil that opens it in the editor beside it,
 * its text rendered with links, images, embeds and formulas,
 * then the rows of its tasks; then scrolls to the heading and marks the note in the menu. The note shown already only scrolls.
 * A note asked for while another still loads wins; a note whose tasks cannot be read shows without their rows.
 *
 * @param path - Path of the note
 * @param heading - Heading to scroll to, empty for the top
 * @throws {Error} - When the reader cannot read the note
 */
async function noteShow(path: string, heading: string): Promise<void> {
    if (path === shownPath) {
        cardSet(heading);
        headingShow(heading);
        return;
    }

    shownPath = path;
    const note: LinkedNote = await noteRead(path);
    if (path !== shownPath)
        return;

    const text: HTMLElement = document.getElementById("notes-text") as HTMLElement;
    const edit: HTMLAnchorElement = document.getElementById("notes-edit") as HTMLAnchorElement;
    (document.getElementById("notes-title") as HTMLElement).textContent = path.split("/").at(-1)?.replace(/\.md$/i, "") ?? "";
    edit.href = `/edit?path=${encodeURIComponent(path)}`;
    edit.hidden = !path.startsWith("Drafts/");
    text.innerHTML = htmlOf(note.text);
    await linksResolve(text, note, 0);
    mathRender(text);
    stepsPut(text);
    await tasksShow(path, note.text).catch((error: unknown): void => console.error(error));
    cardSet(heading);
    headingShow(heading);
    treeReveal();
}

/**
 * Shows a task as a card when the address asks for it with `card`, like `/notes?path=…&card=1#Task. …`,
 * as the due tasks of the skill view open: only the task's text, without its heading, its source and the rest
 * of the note, since a heading or the theory around it gives the method away, while choosing the method
 * is what mixed practice trains (Rohrer 2020); below the text the question which type it is and why,
 * then its solution, folded, and its row with the buttons, and a link to the whole note.
 * Without `card` the note shows whole again.
 * - `card`: Whether the address asks for a card.
 * - `notes`: The notes view, marked as a card for `notes.css`.
 * - `fold`: Fold of the task.
 * - `prompt`: The question with the link to the whole note.
 *
 * @param heading - Heading of the task as written
 */
function cardSet(heading: string): void {
    const card: boolean = new URLSearchParams(location.search).has("card");
    const notes: HTMLElement = document.querySelector(".notes") as HTMLElement;
    const text: HTMLElement = document.getElementById("notes-text") as HTMLElement;
    text.querySelectorAll(".card-task").forEach((task: Element): void => task.classList.remove("card-task"));
    text.querySelectorAll(".card-prompt").forEach((prompt: Element): void => prompt.remove());
    let fold: HTMLElement | null = null;
    if (card) {
        const target: HTMLElement | undefined = [...text.querySelectorAll<HTMLElement>(":scope > .fold > summary > h2")]
            .find((element: HTMLElement): boolean => element.dataset.heading === heading);
        fold = target?.closest<HTMLElement>(".fold") ?? null;
    }
    notes.classList.toggle("notes-card", fold !== null);
    if (fold === null)
        return;

    const prompt: HTMLElement = document.createElement("p");
    const whole: HTMLAnchorElement = document.createElement("a");
    whole.href = noteAddressOf(shownPath, heading);
    whole.textContent = "Whole note";
    prompt.className = "card-prompt";
    prompt.append("Which type is this, and why? Say it before you solve. ", whole);
    fold.classList.add("card-task");
    fold.querySelector(":scope > .fold-content > details.fold")?.before(prompt);
}

/**
 * Shows the note the address names, like `/notes?path=…#Heading`, or a hint when it cannot be read.
 */
function addressShow(): void {
    const path: string | null = new URLSearchParams(location.search).get("path");
    if (path === null)
        return;

    noteShow(path, decodeURIComponent(location.hash.slice(1))).catch((error: unknown): void => {
        console.error(error);
        shownPath = "";
        (document.getElementById("notes-text") as HTMLElement).innerHTML = `<p class="notes-none">This note cannot be read</p>`;
    });
}

/**
 * Opens a note from a click on a link to it, in the menu or in a note, without loading the page again,
 * and keeps it in the address and the history of the browser. Other links, and clicks with a key held, act as usual.
 * - {@link History#pushState}: Writes the address as a new step of the history, for the back button.
 *
 * @param event - Click inside the notes view
 */
function linkClick(event: MouseEvent): void {
    const link: HTMLAnchorElement | null = (event.target as Element).closest("a[href]");
    if (link === null || link.target === "_blank" || event.ctrlKey || event.metaKey || event.shiftKey)
        return;

    const address: URL = new URL(link.href);
    if (address.origin !== location.origin || address.pathname !== "/notes")
        return;

    event.preventDefault();
    history.pushState(null, "", address);
    addressShow();
}


/**
 * Starts the notes view after the router has put its HTML into the page:
 * puts the pencil into its link, shows the modules of the semester in the menu with the chapters of the first,
 * then the note of the address.
 * - `popstate`: Comes when the back or forward button of the browser changes the address.
 *
 * @throws {Error} - When the reader cannot read the modules
 */
export async function notesStart(): Promise<void> {
    modules = await readerAsk<NotesModule[]>("/api/notes/modules");
    iconPut(document.getElementById("notes-edit") as HTMLElement, Pencil, "Edit");
    modulesShow();
    moduleShow(modules[0]?.name ?? "");
    (document.querySelector(".notes") as HTMLElement).addEventListener("click", linkClick);
    window.addEventListener("popstate", addressShow);
    addressShow();
}
