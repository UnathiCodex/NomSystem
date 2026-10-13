/**
 * ## Skill in the entry by category
 *
 * A skill entry in the dialog, for a box of the plan and the log alike, one row per field, each one line showing
 * its value, see `choices.ts`: on top its skill and its type side by side, like `IN2028` and `VO`, the type `None`
 * for my own learning or a project, like `WokFlow`; the reader writes what it is from both, like
 * `IN2028_BusinessAnalyticsMachineLearning (VO)`, see `reader/documents.ts`, and writes it anew when I change
 * either later. Below the times its place, with its whole line and its pencil below it, see `categories.ts`;
 * its chapters and its topics; then its semester, from which semester the lecture or the material is,
 * not when I did it:
 * the semester of the day of the dialog, which follows that day as I type it, until I pick another, offered with
 * the two before it, like `2026W`, `2026S` and `2025W`, or typed with `+`, like `2024W`.
 * The one Skill list shows the skills of the semester, a module by its code, like `IN2028`, a project by its folder
 * name, like `WokFlow`, and its search every module folder, since I sometimes attend another module.
 * The Chapters list, several to pick, names the chapters of my system the entry belongs to, of every type,
 * like a lecture of `02 Logistic Poisson Regression` or exam training over several; the reader writes one
 * `X-CHAPTER` each. The Topics list, several to pick, holds the real documents the entry used and follows the type,
 * see {@link materialFolders}: for my own learning the notes of the chapters of the module, for a type the files
 * of the folder of its material in the folder of the semester of the entry, like `TUM_2026W` for `2026W`:
 * a lecture's slides in `VO_UniversityLectureLessons`, the sheet of an exercise or a tutorial
 * in `TU_UniversityTutorExercises`, a homework's in `HU_UniversityHomeExercises`; picks a list does not offer,
 * like an older entry's, stay picked until I take them back; a project offers none.
 * Each document picked gets its line below the list, its name and its topic, filled from its name, like
 * `Logistic Regression` of `04_LogisticRegression.pdf`, which I may change; the reader writes it as the `X-TOPIC`
 * of its `ATTACH`, since the entry states its topics itself and its links only point to more,
 * see `reader/documents.ts`.
 * The note is only my free note.
 * The tasks of the chapters picked come after the semester, the due ones first, then a result for each task picked:
 * Right, Wrong, Stuck with where I got stuck, or Skip with a reason, and after Right, Wrong or Stuck
 * one tap for my effort, low, medium or high; a task left without result is no attempt and is not written.
 * Any type may hold attempts, like the tasks I solved in a tutorial. Every field may stay empty, the skill too.
 * A skill entry of the log already logged shows what it is as written, a module opening in the notes view,
 * and the document it used by its name, opening in a new tab, see `../skill/links.ts`, and its attempts, which stay;
 * new ones are added after them. Everything stays editable, its skill too, whose older attempts keep their task.
 * Saving sends a skill entry of the log to the reader's one writer of skill entries, with the times, the place
 * and the note of the dialog; a skill box of the plan has the same fields but tasks and attempts, which only happen
 * in the log, and the dialog writes it itself as a box with its chapters and documents.
 *
 * - `./choices.ts`: Pickers, each one line in a row with its name, and two rows side by side.
 * - `../skill/attempts.ts`: Loads the tasks with when they are due and what a module offers, groups the tasks,
 *   writes days out and sends skill entries.
 * - `../today.ts`: Gives today's calendar date, for the tasks due.
 * - `../skill/links.ts`: Shows what a skill entry is and a link of it by its name.
 * - `fullcalendar`: Calendar that shows the entries.
 */

import { choiceOf, choicesOf, groupedSearchOf, pairOf, rowOf, searchOf } from "./choices.ts";
import {
    dayTextOf, groupsOf, moduleLoad, semesterBefore, semesterOf, skillEntrySend, skillingLoad,
} from "../skill/attempts.ts";
import { calendarTodayOf } from "../today.ts";
import { linkElementOf, skillTitleElementOf } from "../skill/links.ts";

import type { Calendar } from "fullcalendar";
import type { Choice } from "./choices.ts";
import type { EntryFields } from "./entries.ts";
import type {
    AttemptNew, Effort, Group, Link, ModuleContents, Result, SkillModule, SkillTask, Skilling,
} from "../skill/attempts.ts";


/**
 * A task picked for the entry, with its result and my effort as picked so far.
 *
 * - `task`: Identity of the task, like `IN2028/Airline Revenue Interval`.
 * - `result`: Result, empty before it is picked.
 * - `effort`: My effort, empty before it is picked and for a skip.
 * - `detail`: Where I got stuck or why I skipped, empty when not given.
 */
type AttemptPick = {
    task: string;
    result: Result | "";
    effort: Effort | "";
    detail: string;
};

/**
 * What is picked for the skill entry so far.
 *
 * - `module`: Name of the skill, a module code like `IN2028` or a project like `WokFlow`, empty before it is picked.
 * - `type`: Its type, like `VO`, empty before it is picked and for none.
 * - `semester`: Its semester, like `2025W`, empty while it is the semester of the day of the dialog,
 *   see {@link semesterDay}.
 * - `chapters`: Names to read of the chapters, like `01 Regression Analysis`.
 * - `documents`: Paths of the documents from the module folder, in the order they were picked.
 * - `topics`: Topic of each chapter by its name and of each document by its path, as changed or kept;
 *   one without has the topic of its name, see {@link topicOf}.
 * - `attempts`: Tasks picked, in the order they were picked, each with its result.
 */
type SkillPicks = {
    module: string;
    type: string;
    semester: string;
    chapters: string[];
    documents: string[];
    topics: { [value: string]: string };
    attempts: AttemptPick[];
};

/**
 * Skill and type of a skill entry, which boxes and the log both have.
 *
 * - `module`: Name of the skill, like `IN2028` or `WokFlow`, empty before it is picked.
 * - `type`: Its type, like `VO`, empty before it is picked and for none.
 */
export type ModuleType = {
    module: string;
    type: string;
};

/**
 * A skill entry as the dialog opens it, empty values for a new one.
 *
 * - `module`: Name of the skill, like `IN2028` or `WokFlow`.
 * - `type`: Its type, like `VO`, empty for none.
 * - `semester`: Its semester, its `X-SEMESTER`, like `2026W`, empty for a new one and an older one without.
 * - `title`: What it is as written, its `SUMMARY`, like `IN2028_BusinessAnalyticsMachineLearning (VO)`, in the log.
 * - `titleLink`: The folder of its skill, the `ALTREP` of its `SUMMARY`, in the log, empty for none.
 * - `chapters`: Names to read of its chapters, in the log.
 * - `links`: Its links as the reader gave them, to its document, in the log.
 * - `attempts`: Its `X-ATTEMPT`s as the reader gave them, in the log, like `IN2028/Airline Revenue Interval;right;low`,
 *   or `140500;IN2028/Airline Revenue Interval;right` with the time of the tap when a button wrote it.
 */
export type SkillValues = {
    module: string;
    type: string;
    semester: string;
    title: string;
    titleLink: string;
    chapters: string[];
    links: Link[];
    attempts: string[];
};

/**
 * Results to pick for each task, each with its name.
 */
const resultChoices: Choice[] = [
    { value: "right", text: "Right", group: "" },
    { value: "wrong", text: "Wrong", group: "" },
    { value: "stuck", text: "Stuck", group: "" },
    { value: "skipped", text: "Skip", group: "" },
];

/**
 * Modules with their tasks and the lists to pick from, as the reader gave them when `Skill` was picked.
 */
let skilling: Skilling = { modules: [], skills: [], otherModules: [], skips: [], types: [], efforts: [], lost: [] };

/**
 * What is picked so far.
 */
let picks: SkillPicks = {
    module: "", type: "", semester: "", chapters: [], documents: [], topics: {}, attempts: [],
};

/**
 * Beginning of the name of the folder of the material of each type in a module, whose files the topics offer
 * for an entry of that type: a lecture's slides in `VO_UniversityLectureLessons`, the sheet of an exercise
 * or a tutorial in `TU_UniversityTutorExercises`, a homework's in `HU_UniversityHomeExercises`, an exam's
 * in `FA_UniversityModuleExaminations`, a practical course's in a folder starting with `PR_`.
 */
const materialFolders: { [type: string]: string } = {
    VO: "VO_", UE: "TU_", TU: "TU_", HU: "HU_", FA: "FA_", PR: "PR_",
};

/**
 * Beginning of the path of a note of a chapter from the module folder, the folder of its chapter, like
 * `01_RegressionAnalysis/` of `01_RegressionAnalysis/01_01_SampleMeanStandardError.md`.
 */
const chapterFolder: RegExp = /^\d{2}_[^/]*\//;

/**
 * Day of the dialog, like `2026-10-13`, whose semester the entry has while I pick none, see {@link skillDaySet}.
 */
let semesterDay: string = "";

/**
 * Semester typed with `+`, like `2024W` or `2024w`: a year and `W` for a winter or `S` for a summer.
 */
const semesterForm: RegExp = /^\d{4}[WS]$/i;

/**
 * Where the fields of `Skill` show and the call that tells the dialog of a change, as last shown, so a changed day
 * shows its semester, see {@link skillDaySet}, and a changed place its line, see {@link skillPlaceShow};
 * `null` before the fields of `Skill` show.
 *
 * - `head`: Place of skill and type, above the times.
 * - `more`: Place of the fields below the times, before the note.
 * - `place`: Rows of the place of the entry, which `categories.ts` builds, put first below the times.
 * - `changed`: Tells the dialog that what is picked changed, so it allows saving or not.
 */
type SkillShown = {
    head: HTMLElement;
    more: HTMLElement;
    place: HTMLElement[];
    changed: () => void;
};

/**
 * Where the fields of `Skill` last showed, see {@link SkillShown}, `null` before they show.
 */
let shownIn: SkillShown | null = null;

/**
 * Chapters and documents of the skill picked, as the reader gave them, none before a skill is picked and for a project.
 */
let contents: ModuleContents = { chapters: [], documents: [] };

/**
 * Time of the tap at the start of an `X-ATTEMPT` a button wrote, like `140500` for 14:05, or `14:05` in an older one,
 * see `reader/skill.ts`.
 */
const tapTime: RegExp = /^\d{2}:?\d{2}(?:\d{2})?$/;

/**
 * `X-ATTEMPT`s of the skill entry of the log being changed, which stay as they are, none for any other.
 */
let logged: string[] = [];

/**
 * What the skill entry of the log being changed is and its links, as the reader gave them, empty for any other.
 */
let linked: { title: string; titleLink: string; links: Link[] } = { title: "", titleLink: "", links: [] };

/**
 * Whether the dialog writes a box of the plan, which has the same fields as the log but tasks and attempts,
 * which only happen in the log.
 */
let inPlan: boolean = false;


/**
 * Gives the paths of the documents of a skill entry or a box from its links: its files in the folder of its module,
 * from that folder, as the Topics list offers them, each path without `NomSkillingmodules` and the folder
 * of the module; a file with its fingerprint, or one in a folder of material, like the slides a lecture of my plan
 * links without fingerprint, never the folder of a chapter, which lies right in the module.
 * - `rest`: Path of a link from the folder of its module, empty for the folder of a module itself.
 *
 * @param links - Links of the entry, like `NomSkillingmodules/IN2028_…/VO_…/04_….pdf`
 * @returns Paths like `VO_UniversityLectureLessons/TUM_2025W/04_LogisticPoissonRegression.pdf`, in their order
 */
function documentPathsOf(links: Link[]): string[] {
    return links
        .filter((link: Link): boolean => link.path.startsWith("NomSkillingmodules/"))
        .filter((link: Link): boolean => {
            const rest: string = link.path.split("/").slice(2).join("/");
            return rest !== "" && (link.fingerprint !== "" || rest.includes("/"));
        })
        .map((link: Link): string => link.path.split("/").slice(2).join("/"));
}

/**
 * Builds the links of the entry being changed, one after the other: what it is as written, a module opening
 * in the notes view, then its files, each by its name, see `../skill/links.ts`; a folder in an older `ATTACH`
 * stays out, since what it is links its folder.
 * - `files`: Its links to files.
 *
 * @returns Row of the links, none for a new entry
 */
function linkedOf(): HTMLElement[] {
    const files: Link[] = linked.links.filter((link: Link): boolean => link.fingerprint !== "");
    if (linked.title === "")
        return [];
    const list: HTMLDivElement = document.createElement("div");
    list.className = "entry-links";
    list.append(skillTitleElementOf(linked.title, linked.titleLink), ...files.map(linkElementOf));
    return [rowOf("Links", list)];
}

/**
 * Makes a calm grey hint in place of a picker, like `No chapters yet` for a module without chapter folders.
 *
 * @param text - Hint
 * @returns Hint
 */
function hintOf(text: string): HTMLParagraphElement {
    const hint: HTMLParagraphElement = document.createElement("p");
    hint.className = "entry-none";
    hint.textContent = text;
    return hint;
}

/**
 * Builds the search of the Skill list: while nothing is typed the skills of the semester and the skill picked,
 * while I type every skill and module folder that holds the words, the skills of the semester first.
 * Each shows its name, a module its code, like `IN2028`, a project its folder name, like `WokFlow`.
 * - `choices`: Every skill and module, the skills of the semester first, each its name as value and text.
 * - `shown`: Skills the search looks through.
 *
 * @returns Search for the picker
 */
function moduleSearchOf(): (text: string) => Promise<Choice[]> {
    const choices: Choice[] = [...skilling.skills, ...skilling.otherModules].map(choiceOf);
    return async (text: string): Promise<Choice[]> => {
        const shown: Choice[] = text.trim() !== "" ? choices : choices.filter((choice: Choice): boolean =>
            choice.value === picks.module || skilling.skills.includes(choice.value));
        return await searchOf(shown)(text);
    };
}

/**
 * Gives the semester of the entry as it stands: the one picked, else the semester of a day.
 *
 * @param day - Day like `2026-10-13`
 * @returns Semester like `2026W`
 */
export function skillSemesterOf(day: string): string {
    return picks.semester !== "" ? picks.semester : semesterOf(day);
}

/**
 * Builds the choices of the semester, newest first: the semester of the day of the dialog and the two before it,
 * and the one picked when it is none of them, like `2024W` typed with `+`, before or after them.
 * - `near`: The semester of the day and the two before it.
 * - `rankOf`: Ranks a semester by its year and season, a winter after the summer of its year.
 *
 * @returns Choices of the semester
 */
function semesterChoicesOf(): Choice[] {
    const near: string[] = [semesterOf(semesterDay)];
    near.push(semesterBefore(near[0]), semesterBefore(semesterBefore(near[0])));
    return [...near, ...(picks.semester === "" || near.includes(picks.semester) ? [] : [picks.semester])]
        .sort((first: string, second: string): number => semesterRankOf(second) - semesterRankOf(first))
        .map(choiceOf);
}

/**
 * Ranks a semester by its year and season, a winter after the summer of its year, so the newer ranks higher.
 *
 * @param semester - Semester like `2026W`
 * @returns Rank like 4053 for `2026W` and 4052 for `2026S`
 */
function semesterRankOf(semester: string): number {
    return Number(semester.slice(0, 4)) * 2 + (semester.endsWith("W") ? 1 : 0);
}

/**
 * Gives the semester of the folder a document lies in, like `2026W` of `TUM_2026W`.
 * - `semester`: The first semester its folders name, `null` for none.
 *
 * @param path - Path of the document from the module folder, like `VO_…/TUM_2026W/04_LogisticPoissonRegression.pdf`
 * @returns Semester like `2026W`, empty for a document in no folder of a semester
 */
function documentSemesterOf(path: string): string {
    const semester: RegExpMatchArray | null = path.split("/").slice(0, -1).join("/").match(/\d{4}[WS]/);
    return semester === null ? "" : semester[0];
}

/**
 * Takes a semester typed with `+`, like `2024w`, in capitals, or none when it is no semester.
 *
 * @param text - Typed text
 * @returns Semester like `2024W`, `null` for none
 */
async function semesterAdd(text: string): Promise<string | null> {
    return semesterForm.test(text.trim()) ? text.trim().toUpperCase() : null;
}

/**
 * Writes the name of the folder of a chapter to read, as the reader names it, see `titleOf` in `reader/notes.ts`:
 * its number, a space, then its words apart, like `01 Regression Analysis` of `01_RegressionAnalysis`.
 *
 * @param folder - Name of the folder of a chapter
 * @returns Its name to read
 */
function chapterNameOf(folder: string): string {
    return folder.replace("_", " ").replace(/(?<=\p{Ll})(?=\p{Lu})/gu, " ");
}

/**
 * Gives the chapters the Chapters list offers: the chapters of the module, then the chapters picked that are
 * none of them, like one whose folder is gone, so I can take them back.
 *
 * @returns Names to read of the chapters, like `01 Regression Analysis`
 */
function chapterChoicesOf(): Choice[] {
    return [...contents.chapters, ...picks.chapters.filter((chapter: string): boolean =>
        !contents.chapters.includes(chapter))].map(choiceOf);
}

/**
 * Gives the documents the Topics list offers, see the top of this file: for a type the files of the folder
 * of its material, see {@link materialFolders}, in the folder of the semester of the entry, like `TUM_2026W`
 * for `2026W`; for my own learning the notes of the chapters of the module, like
 * `01_RegressionAnalysis/01_01_SampleMeanStandardError.md`; each by path; then the documents picked that are none
 * of them, like the slides of an older entry from another semester, so I can take them back.
 * - `folder`: Beginning of the name of the folder of the material of the type, empty for my own learning.
 * - `semester`: Semester of the entry, like `2026W`.
 * - `offered`: Paths of the documents offered.
 *
 * @returns Paths like `VO_UniversityLectureLessons/TUM_2026W/04_LogisticPoissonRegression.pdf`
 */
function topicDocumentsOf(): string[] {
    const folder: string = materialFolders[picks.type] ?? "";
    const semester: string = skillSemesterOf(semesterDay);
    const offered: string[] = contents.documents
        .filter((path: string): boolean => folder === "" ? chapterFolder.test(path)
            : path.startsWith(folder) && documentSemesterOf(path) === semester)
        .sort((first: string, second: string): number => first.localeCompare(second));
    return [...offered, ...picks.documents.filter((path: string): boolean => !offered.includes(path))];
}

/**
 * Builds the choices of the Topics list, the documents, see {@link topicDocumentsOf}, each its path as value,
 * its name as text and as group the folders between the folder of its material and it, like
 * `04_LogisticPoissonRegression.pdf` under `TUM_2026W`, or the chapter of a note, like `01 Regression Analysis`.
 * - `parts`: Parts of the path of a document.
 *
 * @returns Choices of the topics
 */
function topicChoicesOf(): Choice[] {
    return topicDocumentsOf().map((path: string): Choice => {
        const parts: string[] = path.split("/");
        if (chapterFolder.test(path))
            return { value: path, text: parts.at(-1) ?? path, group: chapterNameOf(parts[0]) };
        return { value: path, text: parts.at(-1) ?? path, group: parts.slice(1, -1).join("/") };
    });
}

/**
 * Writes the topic of a document as it stands until I change it, as the reader does, see `topicOf`
 * in `reader/documents.ts`: the name of its file to read, without its ending and the numbers in front of it,
 * `_` as spaces, words and numbers apart, like `Logistic Regression` of `04_LogisticRegression.pdf`,
 * `Sample Mean Standard Error` of the note `01_01_SampleMeanStandardError.md`, or `Sheet 03` of `Sheet03.pdf`.
 * - `name`: The name of the file without its ending.
 *
 * @param path - Path of a document, like `VO_…/TUM_2026W/04_LogisticRegression.pdf`
 * @returns The topic
 */
function topicOf(path: string): string {
    const name: string = (path.split("/").at(-1) ?? path).replace(/\.[^.]*$/, "");
    return name.replace(/^(?:\d+_)+/, "").replaceAll("_", " ")
        .replace(/(?<=\p{Ll})(?=\p{Lu})|(?<=\p{L})(?=\d)/gu, " ").trim();
}

/**
 * Gives the topics of the links of a skill entry or a box to documents, as the dialog keys them, each by its path
 * from the module folder, see {@link documentPathsOf}; a link without topic and the folder of a chapter an older entry
 * links are left out.
 * - `documents`: Paths of its documents.
 * - `rest`: Path of a link from the folder of its module.
 *
 * @param links - Links of the entry, like `NomSkillingmodules/IN2028_…/VO_…/04_LogisticRegression.pdf`
 * @returns Topics like `Logistic Regression` by path
 */
function linkTopicsOf(links: Link[]): { [value: string]: string } {
    const documents: string[] = documentPathsOf(links);
    return Object.fromEntries(links
        .filter((link: Link): boolean => link.topic !== "")
        .flatMap((link: Link): [string, string][] => {
            const rest: string = link.path.split("/").slice(2).join("/");
            return documents.includes(rest) ? [[rest, link.topic]] : [];
        }));
}

/**
 * Builds the topics of the documents picked, one line each below the Topics list, in line with it:
 * the name of its file, then its topic in a field, filled from its name, see {@link topicOf}, which I may change;
 * empty, it is the topic of its name again.
 * - `name`: Name of the file of a document.
 *
 * @returns The lines of the topics, none while nothing is picked
 */
function topicsOf(): HTMLElement[] {
    return picks.documents.map((path: string): HTMLElement => {
        const name: string = path.split("/").at(-1) ?? path;
        const line: HTMLLabelElement = document.createElement("label");
        const label: HTMLSpanElement = document.createElement("span");
        const input: HTMLInputElement = document.createElement("input");
        line.className = "skill-topic";
        label.className = "skill-topic-name";
        label.textContent = name;
        label.title = name;
        input.type = "text";
        input.autocomplete = "off";
        input.value = picks.topics[path] ?? topicOf(path);
        input.setAttribute("aria-label", `Topic of ${name}`);
        input.addEventListener("input", (): void => {
            picks.topics[path] = input.value.trim() === "" ? topicOf(path) : input.value.trim();
        });
        line.append(label, input);
        return line;
    });
}

/**
 * Gives the topics to send for the documents picked, see {@link topicsOf}: each as changed or kept,
 * else the topic of its name.
 *
 * @returns Topics by the path of each document
 */
function topicsPicked(): { [value: string]: string } {
    return Object.fromEntries(picks.documents.map((path: string): [string, string] =>
        [path, picks.topics[path] ?? topicOf(path)]));
}

/**
 * Builds the choices of the tasks of the chapters picked, in groups by when they are due, the due ones first,
 * as the skill view orders them; a later task shows its day.
 *
 * @param tasks - Tasks of the chapters picked
 * @returns Choices of the tasks
 */
function taskChoicesOf(tasks: SkillTask[]): Choice[] {
    return groupsOf(tasks, calendarTodayOf()).flatMap((group: Group): Choice[] =>
        group.tasks.map((task: SkillTask): Choice => ({
            value: task.id,
            text: group.name === "Later" && task.due !== "" ? `${task.name} · ${dayTextOf(task.due, true)}` : task.name,
            group: group.name,
        })));
}

/**
 * Builds the result of a task picked: its name, whole in its tooltip, the line of its result, and below that line,
 * for Stuck, the field for where I got stuck, for Skip the line of the reasons, and after Right, Wrong or Stuck
 * the line of my effort, like `low effort`, each grey what it is while empty.
 * - `detail`: Place of the field or the reasons, and of the efforts.
 * - `detailShow`: Shows the field or the reasons and the efforts for the result picked.
 *
 * @param pick - Task picked, changed as its result and effort are picked
 * @param name - Name of the task
 * @param changed - Tells the dialog that what is picked changed
 * @returns Result of the task
 */
function resultElementOf(pick: AttemptPick, name: string, changed: () => void): HTMLElement {
    const element: HTMLDivElement = document.createElement("div");
    const label: HTMLSpanElement = document.createElement("span");
    const detail: HTMLDivElement = document.createElement("div");
    const detailShow: () => void = (): void => {
        const parts: HTMLElement[] = [];
        if (pick.result === "stuck") {
            const input: HTMLInputElement = document.createElement("input");
            input.type = "text";
            input.placeholder = "Where stuck, like step 3";
            input.autocomplete = "off";
            input.value = pick.detail;
            input.addEventListener("input", (): void => {
                pick.detail = input.value.trim();
            });
            parts.push(input);
        } else if (pick.result === "skipped") {
            parts.push(choicesOf({
                search: searchOf(skilling.skips.map(choiceOf)), picked: pick.detail === "" ? [] : [pick.detail],
                many: false, adding: false, empty: "Why skipped",
                pick: (values: string[]): void => {
                    pick.detail = values[0] ?? "";
                },
            }));
        }
        if (pick.result !== "" && pick.result !== "skipped")
            parts.push(choicesOf({
                search: searchOf(skilling.efforts.map((effort: string): Choice =>
                    ({ value: effort, text: `${effort} effort`, group: "" }))),
                picked: pick.effort === "" ? [] : [pick.effort], many: false, adding: false, empty: "Effort",
                pick: (values: string[]): void => {
                    pick.effort = (values[0] ?? "") as Effort | "";
                },
            }));
        detail.replaceChildren(...parts);
        detail.querySelector("input")?.focus();
    };

    element.className = "skill-result";
    label.className = "skill-result-name";
    label.textContent = name;
    label.title = name;
    detail.className = "skill-result-detail";
    element.append(label, choicesOf({
        search: searchOf(resultChoices), picked: pick.result === "" ? [] : [pick.result], many: false, adding: false,
        empty: "Result",
        pick: (values: string[]): void => {
            pick.result = (values[0] ?? "") as Result | "";
            pick.detail = "";
            pick.effort = "";
            detailShow();
            changed();
        },
    }), detail);
    detailShow();
    return element;
}

/**
 * Builds the attempts of the entry being changed, which stay: one line per attempt, its task and result,
 * with my effort and where I got stuck or why I skipped.
 * - `parts`: An `X-ATTEMPT` cut at each `;`: task, result, effort, and where I got stuck or why I skipped,
 *   without the time of the tap a button wrote at its start, see {@link tapTime}.
 *
 * @returns Attempts, none for an entry without attempts
 */
function loggedOf(): HTMLElement[] {
    if (logged.length === 0)
        return [];

    const list: HTMLUListElement = document.createElement("ul");
    list.className = "entry-skill";
    list.append(...logged.map((value: string): HTMLLIElement => {
        const parts: string[] = value.split(";");
        if (tapTime.test(parts[0]))
            parts.shift();
        const effort: string = parts[2] ?? "";
        const item: HTMLLIElement = document.createElement("li");
        item.textContent = [parts[0].slice(parts[0].indexOf("/") + 1), parts[1], effort === "" ? "" : `${effort} effort`,
            parts.slice(3).join(";")].filter((part: string): boolean => part !== "").join(" · ");
        return item;
    }));
    return [rowOf("Logged", list)];
}

/**
 * Loads the chapters and documents of the skill picked, in plan and log alike, none while no skill is picked,
 * none for a project, and none for a module without folder, like a module code of the plan that has none,
 * so its entry still opens; what comes for a skill picked before another one is dropped.
 * - `module`: Skill picked when the loading starts.
 * - `none`: No chapters and no documents.
 * - `loaded`: Chapters and documents of the module.
 */
async function contentsLoad(): Promise<void> {
    const module: string = picks.module;
    const none: ModuleContents = { chapters: [], documents: [] };
    const loaded: ModuleContents = module === "" ? none
        : await moduleLoad(module).catch((error: unknown): ModuleContents => {
            console.error(error);
            return none;
        });
    if (module === picks.module)
        contents = loaded;
}

/**
 * Builds the tasks of the chapters picked, in the log, the due ones first, see {@link taskChoicesOf}, and below them
 * a result for each task picked, see {@link resultElementOf}; drops the tasks picked that are offered no more,
 * like those of a chapter taken back. Picking tasks shows their results as they are picked, the list staying open.
 * - `module`: Module of the semester picked, with its tasks, `undefined` for another module or before one is picked.
 * - `tasks`: Tasks of the chapters picked.
 * - `results`: Place of the results of the tasks picked.
 * - `resultsShow`: Shows a result for each task picked.
 *
 * @param changed - Tells the dialog that what is picked changed, so it allows saving or not
 * @returns The row of the tasks and the results, none while the chapters picked have no tasks
 */
function tasksOf(changed: () => void): HTMLElement[] {
    const module: SkillModule | undefined = skilling.modules.find((candidate: SkillModule): boolean =>
        candidate.code === picks.module);
    const tasks: SkillTask[] = module?.tasks.filter((task: SkillTask): boolean => picks.chapters.includes(task.chapter)) ?? [];
    picks.attempts = picks.attempts.filter((pick: AttemptPick): boolean =>
        tasks.some((task: SkillTask): boolean => task.id === pick.task));
    const results: HTMLDivElement = document.createElement("div");
    const resultsShow: () => void = (): void => {
        results.replaceChildren(...picks.attempts.map((pick: AttemptPick): HTMLElement => resultElementOf(pick,
            tasks.find((task: SkillTask): boolean => task.id === pick.task)?.name ?? pick.task, changed)));
    };
    if (inPlan || tasks.length === 0)
        return [];

    results.className = "skill-results";
    resultsShow();
    return [rowOf("Tasks", choicesOf({
        search: searchOf(taskChoicesOf(tasks)), picked: picks.attempts.map((pick: AttemptPick): string => pick.task),
        many: true, adding: false, empty: "None",
        pick: (values: string[]): void => {
            picks.attempts = values.map((task: string): AttemptPick =>
                picks.attempts.find((pick: AttemptPick): boolean => pick.task === task)
                ?? { task: task, result: "", effort: "", detail: "" });
            resultsShow();
            changed();
        },
    })), results];
}

/**
 * Builds the row of the chapters of my system the entry belongs to, in the log, several to pick from the chapters
 * of the module, see {@link chapterChoicesOf}, for every type, or `No chapters yet` for a module without chapter
 * folders; picking chapters shows their tasks again as they are picked, see {@link tasksOf}, the list staying open.
 * - `choices`: Choices of the list.
 *
 * @param tasksShow - Shows the tasks of the chapters picked
 * @param changed - Tells the dialog that what is picked changed, so it allows saving or not
 * @returns The row
 */
function chapterRowOf(tasksShow: () => void, changed: () => void): HTMLElement {
    const choices: Choice[] = chapterChoicesOf();
    if (choices.length === 0)
        return rowOf("Chapters", hintOf("No chapters yet"));
    return rowOf("Chapters", choicesOf({
        search: searchOf(choices), picked: picks.chapters, many: true, adding: false, empty: "None",
        pick: (values: string[]): void => {
            picks.chapters = values;
            tasksShow();
            changed();
        },
    }));
}

/**
 * Builds the row of the topics, in the log, see the top of this file: the Topics list, several to pick, the real
 * documents the entry used, whose choices follow the type and the semester, see {@link topicChoicesOf}, or a hint
 * while it has none, like `No chapter notes yet` for my own learning in a module without notes. Picking documents
 * shows their lines as they are picked, see {@link topicsOf}, the list staying open on top.
 * - `choices`: Choices of the list.
 *
 * @param topicsShow - Shows the lines of the topics picked
 * @param changed - Tells the dialog that what is picked changed, so it allows saving or not
 * @returns The row
 */
function topicRowOf(topicsShow: () => void, changed: () => void): HTMLElement {
    const choices: Choice[] = topicChoicesOf();
    if (choices.length === 0)
        return rowOf("Topics", hintOf(picks.type === "" ? "No chapter notes yet"
            : `No ${picks.type} files of ${skillSemesterOf(semesterDay)} yet`));
    return rowOf("Topics", choicesOf({
        search: groupedSearchOf(choices), picked: picks.documents, many: true, adding: false, empty: "None",
        pick: (values: string[]): void => {
            picks.documents = values;
            topicsShow();
            changed();
        },
    }));
}

/**
 * Shows the fields of `Skill` as picked so far, see the top of this file: skill and type side by side above
 * the times; below them the place, in the log the chapters, see {@link chapterRowOf}, the topics, see
 * {@link topicRowOf}, with a line for each topic picked, see {@link topicsOf}, and a hint when a document picked
 * is in the module no more, which the reader could not find by its fingerprint either; then the semester,
 * and in the log the tasks of the chapters picked with a result for each task picked, see {@link tasksOf},
 * the links of the entry, see {@link linkedOf}, and the attempts the entry has.
 * Picking a skill loads its chapters and documents and shows the fields again, with no topics or tasks picked;
 * picking a type or a semester shows them again, the topics offering what follows from them.
 * - `again`: Shows the fields again and tells the dialog.
 * - `topics`: Place of the lines of the topics picked and of the hint.
 * - `tasks`: Place of the tasks and their results.
 * - `topicsShow`: Shows the lines of the topics picked and the hint.
 * - `tasksShow`: Shows the tasks of the chapters picked and their results.
 * - `rows`: Rows below the times.
 *
 * @param shown - Where the fields show, see {@link SkillShown}
 */
function picksShow(shown: SkillShown): void {
    const again: () => void = (): void => {
        picksShow(shown);
        shown.changed();
    };
    const topics: HTMLDivElement = document.createElement("div");
    const tasks: HTMLDivElement = document.createElement("div");
    const topicsShow: () => void = (): void => {
        topics.replaceChildren(...topicsOf(), ...(picks.documents.some((path: string): boolean =>
            !contents.documents.includes(path))
            ? [hintOf("Not in the module any more, not even by its fingerprint; the link stays as written")] : []));
    };
    const tasksShow: () => void = (): void => {
        tasks.replaceChildren(...tasksOf(shown.changed));
    };

    shown.head.replaceChildren(pairOf(
        rowOf("Skill", choicesOf({
            search: moduleSearchOf(), picked: picks.module === "" ? [] : [picks.module], many: false, adding: false,
            empty: "Pick one",
            pick: (values: string[]): void => {
                picks = { ...picks, module: values[0] ?? "", chapters: [], documents: [], topics: {}, attempts: [] };
                contentsLoad().then(again).catch((error: unknown): void => console.error(error));
            },
        })),
        rowOf("Type", choicesOf({
            search: searchOf(skilling.types.map(choiceOf)), picked: picks.type === "" ? [] : [picks.type],
            many: false, adding: false, empty: "None",
            pick: (values: string[]): void => {
                picks.type = values[0] ?? "";
                again();
            },
        }))));
    topics.className = "skill-topics";
    tasks.className = "skill-tasks";
    topicsShow();
    tasksShow();
    const rows: HTMLElement[] = [...shown.place];
    if (picks.module !== "")
        rows.push(chapterRowOf(tasksShow, shown.changed), topicRowOf(topicsShow, shown.changed), topics);
    rows.push(rowOf("Semester", choicesOf({
        search: searchOf(semesterChoicesOf()), picked: [skillSemesterOf(semesterDay)], many: false, adding: true,
        add: semesterAdd,
        pick: (values: string[]): void => {
            picks.semester = values[0] ?? "";
            again();
        },
    })));
    shownIn = shown;
    shown.more.replaceChildren(...rows, tasks, ...(inPlan ? [] : linkedOf()), ...loggedOf());
}

/**
 * Shows the fields of `Skill` for a box of the plan or an entry of the log, as it has them, see {@link picksShow}.
 *
 * @param head - Place of skill and type in the dialog, above the times
 * @param more - Place of the fields below the times, before the note
 * @param place - Rows of the place of the entry, put first below the times
 * @param plan - Whether it is a box of the plan, which takes no tasks and attempts
 * @param values - Values of the entry, empty for a new one
 * @param day - Day of the dialog, like `2026-10-13`, whose semester the entry has while it has none
 * @param changed - Tells the dialog that what is picked changed, so it allows saving or not
 * @throws {Error} - When the reader cannot answer
 */
export async function skillFieldsShow(head: HTMLElement, more: HTMLElement, place: HTMLElement[], plan: boolean,
                                      values: SkillValues, day: string, changed: () => void): Promise<void> {

    skilling = await skillingLoad();
    inPlan = plan;
    semesterDay = day;
    logged = plan ? [] : values.attempts;
    linked = plan ? { title: "", titleLink: "", links: [] }
        : { title: values.title, titleLink: values.titleLink, links: values.links };
    picks = {
        module: values.module, type: values.type, semester: values.semester, chapters: values.chapters,
        documents: documentPathsOf(values.links), topics: linkTopicsOf(values.links), attempts: [],
    };
    await contentsLoad();
    picksShow({ head: head, more: more, place: place, changed: changed });
}

/**
 * Links of a skill entry or box as picked, which the reader writes, see `linksOf` in `reader/documents.ts`.
 *
 * - `chapters`: Names to read of its chapters, its `X-CHAPTER`s, like `01 Regression Analysis`.
 * - `documents`: Paths of its documents from the folder of its skill, its `ATTACH`es.
 * - `topics`: Topic of each document by its path, its `X-TOPIC`.
 */
export type SkillLinks = {
    chapters: string[];
    documents: string[];
    topics: { [path: string]: string };
};

/**
 * Reads the chapters and documents picked with their topics, of a box of the plan or an entry of the log.
 *
 * @returns Chapters, documents and topics, none while nothing is picked
 */
export function skillLinksRead(): SkillLinks {
    return { chapters: picks.chapters, documents: picks.documents, topics: topicsPicked() };
}

/**
 * Shows the rows of the place of the entry anew, with the other fields as picked, like after my place was changed
 * in `Places.md`, see `placeChange` in `categories.ts`.
 *
 * @param place - Rows of the place
 */
export function skillPlaceShow(place: HTMLElement[]): void {
    if (shownIn !== null)
        picksShow({ ...shownIn, place: place });
}

/**
 * Takes a new day of the dialog, as I type it: while I picked no semester the entry has the semester of that day,
 * so the fields show again when that semester is another, the topics with the files of that semester.
 * - `before`: Semester of the day before.
 *
 * @param day - Day like `2027-04-02`
 */
export function skillDaySet(day: string): void {
    const before: string = semesterOf(semesterDay);
    semesterDay = day;
    if (picks.semester === "" && semesterOf(day) !== before && shownIn !== null)
        picksShow(shownIn);
}

/**
 * Reads the skill and the type picked, of a box of the plan or an entry of the log.
 *
 * @returns Skill and type, each empty while not picked, the type also for none
 */
export function skillModuleType(): ModuleType {
    return { module: picks.module, type: picks.type };
}

/**
 * Sends the skill entry of the log as picked, with the times, place, semester, note and box of the dialog,
 * new or as the changes of the entry being changed, then loads the log of the shown day again.
 * - {@link EventSourceApi#refetch}: Loads the entries of a calendar of the reader again.
 * - `attempts`: The tasks picked with their results, as attempts to send, a task without result left out.
 *
 * @param calendar - Calendar of the day
 * @param id - Identifier of the entry being changed, empty for a new one
 * @param fields - Fields, note, times and box of the dialog
 * @throws {Error} - When the reader does not take the entry
 */
export async function skillSave(calendar: Calendar, id: string, fields: EntryFields): Promise<void> {
    const attempts: AttemptNew[] = picks.attempts.filter((pick: AttemptPick): boolean => pick.result !== "")
        .map((pick: AttemptPick): AttemptNew => ({
            task: pick.task,
            part: "",
            result: pick.result as Result,
            effort: pick.result === "skipped" ? "" : pick.effort,
            stuck: pick.result === "stuck" ? pick.detail : "",
            skip: pick.result === "skipped" ? pick.detail : "",
        }));

    await skillEntrySend(id, {
        type: picks.type, module: picks.module, semester: fields.semester, chapters: picks.chapters,
        documents: picks.documents, topics: topicsPicked(), attempts: attempts,
        location: fields.location, planned: fields.planned, note: fields.note, start: fields.start, end: fields.end,
    });
    calendar.getEventSourceById("log")?.refetch();
}
