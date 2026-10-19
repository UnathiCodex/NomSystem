/**
 * ## Today
 *
 * What the scripts view shows while no note is open: the day of learning, looking like the day view, see `../day/`:
 * the date as its bar shows it, the weekday small and grey above it, and below it the entries of today, the same
 * as in the plan, one per chapter with something due, see `reader/suggestions.ts`: what it is in bold on one line,
 * like `Skill: IN2028 Business Analytics Machine Learning`, grey below it its length as its box in the plan has it
 * and its chapter, like `01h 00m · 01 Regression Analysis`; then one small box per note to do, each a link to it:
 * its number and name, like `01.01 Sample Mean Estimator`, a small box saying what is due, `Task`, `Example`
 * or `NEW`, and the name of the Task or Example, like `Online Games`; a tap opens the note where its round stands,
 * see `./round.ts`, which shows only what is due. Nothing else.
 * The order is that of a session: the Tasks due first, each with what its failure today brings back right after it,
 * by the round's own ladder, one Example easier each, see `fallbacksOf` in `./round.ts`, then the section new today,
 * see `todayMarked` in `reader/skill.ts`. A note to do stays in its place, grey, once its round is closed by hand;
 * an Example brought back also once tried; an entry turns grey once all its notes are.
 *
 * - `../skill/attempts.ts`: Loads the tasks and sections with what of each is due today, and writes a date as a day.
 * - `../skill/links.ts`: Writes a chapter in words.
 * - `../notes/tree.ts`: Builds the address of a note at a heading.
 * - `../day/times.ts`: Writes the date as the day view does, and a length.
 * - `./round.ts`: What a failed Task brings back, by the round's own ladder, and when an attempt was made.
 * - `../reader.ts`: Asks the reader for the boxes of today, whose lengths the entries show.
 * - `../day/boxes.css`: Look of the entries, those of the plan.
 */

import { dayOf, skillingLoad, skillName } from "../skill/attempts.ts";
import { chapterNameOf } from "../skill/links.ts";
import { noteAddressOf } from "../notes/tree.ts";
import { dateTextOf, lengthOf } from "../day/times.ts";
import { fallbacksOf, timeOf } from "./round.ts";
import { readerAsk } from "../reader.ts";
import "../day/boxes.css";

import type { Attempt, SkillModule, SkillSection, SkillTask, Skilling } from "../skill/attempts.ts";
import type { Box, PlanDay } from "../day/boxes.ts";
import type { Fallback } from "./round.ts";


/**
 * A note to do today.
 *
 * - `module`: Code of its module, like `IN2028`.
 * - `chapter`: Name of its chapter, like `01_RegressionAnalysis`.
 * - `section`: Its section, like `01.01 Sample Mean Estimator`, see {@link sectionNameOf}.
 * - `kind`: What is due, `Task`, `Example`, `Algorithm` or `NEW`.
 * - `name`: Name of the Task or Example, like `Online Games`, empty for `NEW`.
 * - `address`: Address it opens.
 * - `done`: Whether it is done today.
 */
export type Item = {
    module: string;
    chapter: string;
    section: string;
    kind: string;
    name: string;
    address: string;
    done: boolean;
};


/**
 * Writes the name of a section in words, like `Sample Mean Estimator` for `01_01_SampleMeanEstimator`.
 *
 * @param section - Section
 * @returns Its name
 */
export function wordsOf(section: SkillSection): string {
    return section.title.replace(/^\d+_\d+_/, "").replace(/(?<=[a-z])(?=[A-Z])/g, " ");
}

/**
 * Writes the number and name of a section, like `01.01 Sample Mean Estimator` for `01_01_SampleMeanEstimator`.
 *
 * @param section - Section
 * @returns Its number and name
 */
function sectionNameOf(section: SkillSection): string {
    const number: string = /^\d+_\d+/.exec(section.title)?.[0].replace("_", ".") ?? "";
    return number === "" ? wordsOf(section) : `${number} ${wordsOf(section)}`;
}

/**
 * Builds the notes to do of a module today, see the top of this file.
 * - `items`, `fresh`: The Tasks with what their failures bring back, and the sections new today.
 * - `tasks`, `cold`: Tasks of a section and its Task of today.
 * - `item`: A note to do of the section, what is due and its name.
 * - `again`: Whether what a failure brought back was tried after it.
 *
 * @param module - Module
 * @param today - Today like `2026-10-17`
 * @returns Items in order
 */
export function itemsOf(module: SkillModule, today: string): Item[] {
    const items: Item[] = [];
    const fresh: Item[] = [];
    module.sections.filter((section: SkillSection): boolean => section.today !== "").forEach((section: SkillSection):
        void => {
        const tasks: SkillTask[] = module.tasks.filter((task: SkillTask): boolean => task.note === section.note);
        const cold: SkillTask | undefined = tasks.find((task: SkillTask): boolean => task.id === section.cold);
        const item: (kind: string, name: string, done: boolean) => Item = (kind: string, name: string, done: boolean):
            Item => ({
            module: module.code, chapter: section.chapter, section: sectionNameOf(section), kind: kind, name: name,
            address: noteAddressOf(section.note, ""), done: done,
        });
        if (section.today === "new") {
            fresh.push(item("NEW", "", section.closed));
            return;
        }
        if (cold === undefined)
            return;
        items.push(item("Task", cold.name, section.closed));
        fallbacksOf(tasks, section.algorithm, cold, today).forEach((fallback: Fallback): void => {
            const again: boolean = fallback.task?.attempts.some((attempt: Attempt): boolean =>
                timeOf(attempt) > fallback.since) ?? false;
            const [, kind, name]: string[] = /^(\w+)\.[ \t]+(.*)$/.exec(fallback.heading) ?? ["", "", fallback.heading];
            items.push(item(kind, name, section.closed || again));
        });
    });
    return [...items, ...fresh];
}

/**
 * Makes the small box of a note to do: its section, the small box of what is due, and the name of the Task
 * or Example; a tap opens the note.
 * - `note`: The link.
 * - `kind`: The small box of what is due.
 *
 * @param item - The note to do
 * @returns Its element
 */
function noteOf(item: Item): HTMLAnchorElement {
    const note: HTMLAnchorElement = document.createElement("a");
    const kind: HTMLSpanElement = document.createElement("span");
    note.className = item.done ? "today-note today-note-done" : "today-note";
    note.href = item.address;
    kind.className = "today-kind";
    kind.textContent = item.kind;
    note.append(item.section, kind, ...(item.name === "" ? [] : [item.name]));
    return note;
}

/**
 * Makes the entry of a chapter, as its box in the plan: what it is in bold, grey its length and its chapter,
 * apart by a middle dot, then the small boxes of its notes to do.
 * - `entry`, `body`, `what`, `heading`, `meta`, `notes`: The entry and its lines.
 * - `box`: Its study box in the plan of today or carried along to it, one without time and deadline, as the reader
 *   writes it, see `reader/suggestions.ts`, `undefined` for none, like one I took out; never a lecture or a homework
 *   sheet of the chapter.
 * - `parts`: Its length and its chapter, as far as it has them.
 *
 * @param label - What its module is, like `IN2028 Business Analytics Machine Learning`
 * @param items - Its notes to do, all of one chapter
 * @param boxes - Skill boxes of today and those carried along to it
 * @returns The entry
 */
function entryOf(label: string, items: Item[], boxes: Box[]): HTMLElement {
    const entry: HTMLDivElement = document.createElement("div");
    const body: HTMLDivElement = document.createElement("div");
    const what: HTMLDivElement = document.createElement("div");
    const heading: HTMLElement = document.createElement("strong");
    const meta: HTMLDivElement = document.createElement("div");
    const notes: HTMLDivElement = document.createElement("div");
    const box: Box | undefined = boxes.find((candidate: Box): boolean =>
        candidate.module === items[0].module && candidate.chapters.includes(items[0].chapter)
        && candidate.time === "" && candidate.deadline === "");
    const parts: string[] = [...(box === undefined || box.minutes === null ? [] : [lengthOf(box.minutes)]),
        chapterNameOf(items[0].chapter)];
    entry.className = items.every((item: Item): boolean => item.done) ? "box today-entry box-done" : "box today-entry";
    body.className = "box-body";
    what.className = "box-what";
    heading.className = "entry-heading";
    heading.textContent = `${skillName}: ${label}`;
    what.append(heading);
    meta.className = "box-meta";
    meta.append(...parts.map((part: string, index: number): HTMLSpanElement => {
        const span: HTMLSpanElement = document.createElement("span");
        span.className = index === 0 ? "box-part box-time" : "box-part entry-parted";
        span.textContent = part;
        return span;
    }));
    notes.className = "today-notes";
    notes.append(...items.map(noteOf));
    body.append(what, meta, notes);
    entry.append(body);
    return entry;
}

/**
 * Shows Today in its place, see the top of this file: the date of today as the day view's bar shows it,
 * then the entries, or `Nothing due` as the plan says `Nothing planned`.
 * - `skilling`, `plans`, `carried`: Every module with its tasks and sections, the plan of today and the boxes carried
 *   along to it, those after the reader wrote the boxes of the chapters due today.
 * - `tomorrow`: The day after today, where the plan of today ends.
 * - `boxes`: Skill boxes of today and those carried along.
 * - `entries`: One per module and chapter with notes to do, in the order of their notes.
 *
 * @param place - Where Today goes, see `#editor-today` in `./editor.html`
 * @param today - Today like `2026-10-17`
 * @throws {Error} - When the reader cannot read the tasks or the plan
 */
export async function todayShow(place: HTMLElement, today: string): Promise<void> {
    const skilling: Skilling = await skillingLoad();
    const tomorrow: string = dayOf(new Date(Date.parse(`${today}T12:00:00`) + 24 * 60 * 60 * 1000));
    const [plans, carried]: [PlanDay[], Box[]] = await Promise.all([
        readerAsk<PlanDay[]>(`/api/day/boxes?start=${today}&end=${tomorrow}`),
        readerAsk<Box[]>(`/api/day/carried?date=${today}`),
    ]);
    const boxes: Box[] = [...plans[0].boxes, ...carried].filter((box: Box): boolean => box.category === skillName);
    const entries: HTMLElement[] = skilling.modules.flatMap((module: SkillModule): HTMLElement[] =>
        [...Map.groupBy(itemsOf(module, today), (item: Item): string => item.chapter).values()]
            .map((items: Item[]): HTMLElement => entryOf(skilling.labels[module.code] ?? module.code, items, boxes)));
    (place.querySelector(".day-weekday") as HTMLElement).textContent =
        new Date(`${today}T12:00:00`).toLocaleDateString("en-GB", { weekday: "long" });
    (place.querySelector(".day-date") as HTMLElement).textContent = dateTextOf(today);
    const list: HTMLElement = place.querySelector(".today-list") as HTMLElement;
    if (entries.length === 0) {
        const none: HTMLParagraphElement = document.createElement("p");
        none.className = "plan-none";
        none.textContent = "Nothing due";
        list.replaceChildren(none);
    } else {
        list.replaceChildren(...entries);
    }
    place.hidden = false;
}
