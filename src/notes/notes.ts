/**
 * ## Card
 *
 * A due task of the skill view as a card, see `../skill/skill.ts`, at `/scripts?path=…&card=1#Task. …`:
 * its note rendered like Obsidian, read only, but only the task's text shows, see {@link cardSet}, then the question
 * which type it is and why, its solution, folded, opening one step per click, see {@link stepsPut}, its row with
 * the buttons for the next attempt, and a link to the whole note in the scripts view, which is the editor,
 * always writing, see `../editor/editor.ts`; this card is the one view that only reads a note.
 * Its links lead to notes and files of the same module, as the reader resolved them, like the lecture's slides;
 * a note opens in the scripts view, a PDF at the page its link names, like `#page=10`, and a link that leads nowhere
 * is faded and dotted, its tooltip naming what it looked for.
 * Images and embedded notes come from the reader, and the formulas are rendered last.
 * Under the heading of each task of the semester stands its row: when it is due, its history, and Right and Wrong
 * for the next attempt behind its `⋯`, the task judged as a whole.
 * The parts of a cold task that sit in its run while others are still open, like 1. and 2. before 3. of an older
 * attempt at one part, show greyed in its text.
 * Its row stays quiet, without state, hint or numbers, see `../skill/task.ts`.
 *
 * - `./markdown.ts`: Turns the Markdown of a note into HTML, with Obsidian's syntax.
 * - `./math.ts`: Renders the formulas, as Obsidian does.
 * - `./tree.ts`: Builds the address of a note in the scripts view.
 * - `../reader.ts`: Asks the reader for a note.
 * - `../skill/attempts.ts`: Loads the tasks with when they are due.
 * - `../today.ts`: Gives today's calendar date, for when a task is due.
 * - `../skill/task.ts`: Builds the row of a task with its menu.
 * - `./notes.css`: Look of the notes.
 */

import { htmlOf } from "./markdown.ts";
import { mathRender } from "./math.ts";
import { noteAddressOf } from "./tree.ts";
import { readerAsk } from "../reader.ts";
import { skillingLoad } from "../skill/attempts.ts";
import { calendarTodayOf } from "../today.ts";
import { taskRowOf } from "../skill/task.ts";
import "./notes.css";

import type { SkillModule, SkillTask, Skilling } from "../skill/attempts.ts";


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
 * Builds the address of a file of my modules at the reader, like an image of a note.
 *
 * @param path - Path
 * @returns Address like `/api/notes/file?path=…`
 */
function fileAddressOf(path: string): string {
    return `/api/notes/file?path=${encodeURIComponent(path)}`;
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
 * the menu for the next attempt, which goes into the skill entry of the moment, Right and Wrong once its solution
 * is open, Wrong with my short comment; after each attempt the rows load again. Only tasks of the modules
 * of the semester have a row.
 * The text of each part of a cold task that sits in its run shows greyed while others are still open,
 * see {@link partsGrey}.
 * - `tasks`: Tasks of the note, the first of each name.
 * - `today`: Today like `2026-10-10`.
 * - `fold`: Fold of a block.
 * - `solution`: Fold of the solution of a task, the fold inside its block, `null` for none.
 *
 * @param path - Path of the shown note
 * @throws {Error} - When the reader cannot read the tasks
 */
async function tasksShow(path: string): Promise<void> {
    const skilling: Skilling = await skillingLoad();
    const tasks: SkillTask[] = skilling.modules.flatMap((module: SkillModule): SkillTask[] => module.tasks)
        .filter((task: SkillTask): boolean => task.note === path);
    const today: string = calendarTodayOf();
    const text: HTMLElement = document.getElementById("notes-text") as HTMLElement;
    text.querySelectorAll(".task-row").forEach((row: Element): void => row.remove());
    text.querySelectorAll<HTMLElement>(":scope > .fold > summary > h2").forEach((heading: HTMLElement): void => {
        const fold: HTMLElement | null = heading.closest(".fold");
        const task: SkillTask | undefined = tasks.find((candidate: SkillTask): boolean =>
            candidate.heading === heading.dataset.heading);
        if (task === undefined)
            return;

        if (fold !== null)
            partsGrey(fold, task);
        const solution: HTMLDetailsElement | null =
            fold?.querySelector<HTMLDetailsElement>(":scope > .fold-content > details.fold") ?? null;
        fold?.querySelector(":scope > .fold-content")?.prepend(
            taskRowOf(task, today, solution, true, (): Promise<void> => tasksShow(path)));
    });
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
    text.querySelectorAll<HTMLElement>("details.fold > .fold-content > details.fold:not(.scene) > .fold-content").forEach(
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
 * Greys each part of a cold task that sits in its run while others are still open, so the open ones stand out to be
 * answered: its parts are the items of the numbered lists of its text, outside its solution, each by its number,
 * like `2` for the second item of a list starting at 1, as the reader reads them, see `partsOf` in `reader/skill.ts`.
 * - `list`: A numbered list of its text.
 *
 * @param fold - Fold of the task
 * @param task - The task
 */
function partsGrey(fold: HTMLElement, task: SkillTask): void {
    if (task.kind !== "cold" || task.parts.length === 0)
        return;
    fold.querySelectorAll<HTMLOListElement>(":scope > .fold-content > ol").forEach((list: HTMLOListElement): void => {
        [...list.children].forEach((item: Element, index: number): void => {
            item.classList.toggle("card-part-sat", !task.open.includes(String(list.start + index)));
        });
    });
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
 * Shows the note of a card: its text rendered with links, images, embeds and formulas, then the rows of its tasks;
 * then the card of the task, see {@link cardSet}, scrolled to its top. A note whose tasks cannot be read shows
 * without their rows.
 *
 * @param path - Path of the note
 * @param heading - Heading of the task
 * @throws {Error} - When the reader cannot read the note
 */
async function noteShow(path: string, heading: string): Promise<void> {
    const note: LinkedNote = await noteRead(path);
    const text: HTMLElement = document.getElementById("notes-text") as HTMLElement;
    text.innerHTML = htmlOf(note.text);
    await linksResolve(text, note, 0);
    mathRender(text);
    stepsPut(text);
    await tasksShow(path).catch((error: unknown): void => console.error(error));
    cardSet(path, heading);
    headingShow(heading);
}

/**
 * Shows the task as a card, as the due tasks of the skill view open: only the task's text, without its heading,
 * its source and the rest of the note, since a heading or the theory around it gives the method away, while choosing
 * the method is what mixed practice trains (Rohrer 2020); below the text the question which type it is and why,
 * then its solution, folded, and its row with the buttons, and a link to the whole note in the scripts view.
 * When the note holds no such task any more, the whole note shows.
 * - `notes`: The view, marked as a card for `notes.css`.
 * - `fold`: Fold of the task, `null` when the note holds none of its heading.
 * - `prompt`: The question with the link to the whole note.
 *
 * @param path - Path of the note
 * @param heading - Heading of the task as written
 */
function cardSet(path: string, heading: string): void {
    const notes: HTMLElement = document.querySelector(".notes") as HTMLElement;
    const text: HTMLElement = document.getElementById("notes-text") as HTMLElement;
    const fold: HTMLElement | null = [...text.querySelectorAll<HTMLElement>(":scope > .fold > summary > h2")]
        .find((element: HTMLElement): boolean => element.dataset.heading === heading)?.closest<HTMLElement>(".fold") ?? null;
    notes.classList.toggle("notes-card", fold !== null);
    if (fold === null)
        return;

    const prompt: HTMLElement = document.createElement("p");
    const whole: HTMLAnchorElement = document.createElement("a");
    whole.href = noteAddressOf(path, heading);
    whole.textContent = "Whole note";
    prompt.className = "card-prompt";
    prompt.append("Which type is this, and why? Say it before you solve. ", whole);
    fold.classList.add("card-task");
    fold.querySelector(":scope > .fold-content > details.fold")?.before(prompt);
}

/**
 * Starts the card after the router has put its HTML into the page: shows the note the address names, like
 * `/scripts?path=…&card=1#Task. …`, as the card of its task, see {@link noteShow}, or a hint when it cannot be read.
 */
export async function notesStart(): Promise<void> {
    await noteShow(new URLSearchParams(location.search).get("path") ?? "", decodeURIComponent(location.hash.slice(1)))
        .catch((error: unknown): void => {
            console.error(error);
            (document.getElementById("notes-text") as HTMLElement).innerHTML = `<p class="notes-none">This note cannot be read</p>`;
        });
}
