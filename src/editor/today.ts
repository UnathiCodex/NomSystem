/**
 * ## Today
 *
 * What the scripts view shows while no note is open: the day of learning, looking like the day view, see `../day/`:
 * the date as its bar shows it, the weekday small and grey above it, and one list below, each item due today a card
 * as a box of the plan, see `.box` in `../day/boxes.css`: its title the section in words and what is due, like
 * `Sample Mean Estimator · Task · Bakery Chain`, `Sample Mean Estimator · Example · Kiosk Half Trend` or
 * `Sample Mean Estimator · new`, below it grey the code of its module; a tap opens it, see `./round.ts`, which shows
 * only what is due. Nothing else.
 * The order is that of a session: the Tasks due first, each with what its failure today brings back right after it,
 * by the round's own ladder, one Example easier each, see `fallbacksOf` in `./round.ts`, then the section new today:
 * the one begun on its ladder, by an attempt or a `Next`, else the first not yet begun. A tap opens the round where
 * it stands, see `./round.ts`.
 * An item stays in its place, grey, as a done box of the plan does, once its round is closed by hand; an Example
 * brought back also once tried.
 *
 * - `../skill/attempts.ts`: Loads the tasks and sections with when each is due.
 * - `../notes/tree.ts`: Builds the address of a note at a heading.
 * - `../day/times.ts`: Writes the date as the day view does.
 * - `./round.ts`: What a failed Task brings back, by the round's own ladder, and when an attempt was made.
 * - `../day/boxes.css`: Look of the cards, those of the plan.
 */

import { skillingLoad } from "../skill/attempts.ts";
import { noteAddressOf } from "../notes/tree.ts";
import { dateTextOf } from "../day/times.ts";
import { fallbacksOf, timeOf } from "./round.ts";
import "../day/boxes.css";

import type { Attempt, SkillModule, SkillSection, SkillTask, Skilling } from "../skill/attempts.ts";
import type { Fallback } from "./round.ts";


/**
 * An item of today.
 *
 * - `title`: Its title, like `Sample Mean Estimator · Task · Bakery Chain`.
 * - `module`: Code of its module, like `IN2028`.
 * - `address`: Address it opens.
 * - `done`: Whether it is done today.
 */
type Item = {
    title: string;
    module: string;
    address: string;
    done: boolean;
};


/**
 * Writes the name of a section in words, like `Sample Mean Estimator` for `01_01_SampleMeanEstimator`.
 *
 * @param section - Section
 * @returns Its name
 */
function wordsOf(section: SkillSection): string {
    return section.title.replace(/^\d+_\d+_/, "").replace(/(?<=[a-z])(?=[A-Z])/g, " ");
}

/**
 * Builds the items of a module for today, see the top of this file.
 * - `items`, `fresh`: The Tasks with what their failures bring back, and the new sections.
 * - `tasks`, `cold`: Tasks of a section and its Task of today.
 * - `tried`: Its attempts at that Task today, skips left out.
 * - `again`: Whether what a failure brought back was tried after it.
 *
 * @param module - Module
 * @param today - Today like `2026-10-17`
 * @returns Items in order
 */
function itemsOf(module: SkillModule, today: string): Item[] {
    const items: Item[] = [];
    const fresh: Item[] = [];
    const sections: SkillSection[] = module.sections.filter((section: SkillSection): boolean => section.cold !== "");
    sections.forEach((section: SkillSection): void => {
        const tasks: SkillTask[] = module.tasks.filter((task: SkillTask): boolean => task.note === section.note);
        const cold: SkillTask | undefined = tasks.find((task: SkillTask): boolean => task.id === section.cold);
        if (cold === undefined)
            return;
        const tried: Attempt[] = cold.attempts.filter((attempt: Attempt): boolean =>
            attempt.day === today && attempt.result !== "skipped");
        if (section.ladder) {
            if (section.tried > 0 || section.at !== "" || section.closed)
                fresh.push({ title: `${wordsOf(section)} · new`, module: module.code,
                    address: noteAddressOf(section.note, ""), done: section.closed });
            return;
        }
        if (tried.length === 0 && (cold.due === "" || cold.due > today))
            return;
        items.push({ title: `${wordsOf(section)} · Task · ${cold.name}`, module: module.code,
            address: noteAddressOf(section.note, ""), done: section.closed });
        fallbacksOf(tasks, section.algorithm, cold, today).forEach((fallback: Fallback): void => {
            const again: boolean = fallback.task?.attempts.some((attempt: Attempt): boolean =>
                timeOf(attempt) > fallback.since) ?? false;
            items.push({ title: `${wordsOf(section)} · ${fallback.heading.replace(/^(\w+)\.[ \t]+/, "$1 · ")}`,
                module: module.code, address: noteAddressOf(section.note, ""), done: section.closed || again });
        });
    });
    const next: SkillSection | undefined = sections.find((section: SkillSection): boolean =>
        section.tried === 0 && section.at === "" && !section.closed);
    if (fresh.length === 0 && next !== undefined)
        fresh.push({ title: `${wordsOf(next)} · new`, module: module.code, address: noteAddressOf(next.note, ""), done: false });
    return [...items, ...fresh];
}

/**
 * Makes the card of an item, as a box of the plan: its title, below it grey the code of its module; a tap opens it.
 * - `card`, `body`: The card and its lines.
 *
 * @param item - Item
 * @returns The card
 */
function cardOf(item: Item): HTMLAnchorElement {
    const card: HTMLAnchorElement = document.createElement("a");
    const body: HTMLDivElement = document.createElement("div");
    const what: HTMLDivElement = document.createElement("div");
    const meta: HTMLDivElement = document.createElement("div");
    card.className = item.done ? "box today-card box-done" : "box today-card";
    card.href = item.address;
    body.className = "box-body";
    what.className = "box-what";
    what.textContent = item.title;
    meta.className = "box-meta";
    meta.textContent = item.module;
    body.append(what, meta);
    card.append(body);
    return card;
}

/**
 * Shows Today in its place, see the top of this file: the date of today as the day view's bar shows it,
 * then the cards, or `Nothing due` as the plan says `Nothing planned`.
 * - `skilling`: Every module with its tasks and sections.
 * - `items`: The items of today.
 *
 * @param place - Where Today goes, see `#editor-today` in `./editor.html`
 * @param today - Today like `2026-10-17`
 * @throws {Error} - When the reader cannot read the tasks
 */
export async function todayShow(place: HTMLElement, today: string): Promise<void> {
    const skilling: Skilling = await skillingLoad();
    const items: Item[] = skilling.modules.flatMap((module: SkillModule): Item[] => itemsOf(module, today));
    (place.querySelector(".day-weekday") as HTMLElement).textContent =
        new Date(`${today}T12:00:00`).toLocaleDateString("en-GB", { weekday: "long" });
    (place.querySelector(".day-date") as HTMLElement).textContent = dateTextOf(today);
    const list: HTMLElement = place.querySelector(".today-list") as HTMLElement;
    if (items.length === 0) {
        const none: HTMLParagraphElement = document.createElement("p");
        none.className = "plan-none";
        none.textContent = "Nothing due";
        list.replaceChildren(none);
    } else {
        list.replaceChildren(...items.map(cardOf));
    }
    place.hidden = false;
}
