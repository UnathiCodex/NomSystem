/**
 * ## Skill in the entry by category
 *
 * A skill entry in the dialog, for a box of the plan and the log alike, one row per field, each one line showing
 * its value, see `choices.ts`: below the times and the category its summary, its skill and its type side by side
 * on one line, like `IN2028_BusinessAnalyticsMachineLearning` and `VO`, no type, the type empty, for my own learning
 * or a project, like `WokFlow`; the reader writes what it is from both, like
 * `IN2028 Business Analytics Machine Learning (VO)`, see `reader/documents.ts`, and writes it anew when I change either
 * later. Then its place, its name with its pencil and its address below it, see `categories.ts`, as every category
 * has it; then in this order its semester, and its chapters one after another, each with its documents.
 * Its semester says from which semester the lecture or the material is, not when I did it:
 * the semester of the day of the dialog, which follows that day as I type it, until I pick another from its list,
 * never typed: that semester first, then every semester the module has material for, newest first.
 * The one Skill list shows the skills of the semester by the whole names of their folders, like
 * `IN2028_BusinessAnalyticsMachineLearning` or the project `WokFlow`, and its search every module folder,
 * since I sometimes attend another module.
 * Chapters come one after another once a skill is picked, see {@link chapterRowsOf}: the list of an empty row
 * `Chapter` offers the chapters of my system of the module, by the names of their folders, for every type, like
 * a lecture of `02_LogisticPoissonRegression` or exam training over several; a pick closes the list and makes
 * the row the chapter's, its name a link that opens the chapter in the scripts view, without the module, which
 * the summary names, with a small × that takes it back, see `addedRowOf` in `choices.ts`, and unlocks its
 * documents; below them the next empty row `Chapter` adds the next. A module without chapters says so in the row,
 * `No chapters yet`. The reader writes one `X-CHAPTER` each, and an entry keeps the name a chapter had, also once
 * its folder has another name.
 * The documents are the real documents the entry used, several, each a row with a small ×, see `addedRowsOf`
 * in `choices.ts`: for my own learning, no type, the notes of each chapter picked right below it; for a type,
 * once a chapter is picked, below all chapters the files of the folder fitting the type and the semester,
 * see {@link materialFolders}, the folder of the semester like `TUM_2026W` for `2026W`: a lecture's slides
 * in `VO_UniversityLectureLessons`, the sheet of an exercise or a tutorial in `TU_UniversityTutorExercises`,
 * a homework's in `HU_UniversityHomeExercises`; a project offers none. Each document picked is its row showing
 * the name of its file, like `04_LogisticRegression.pdf`, which says what it is; the reader writes just its path
 * as its `ATTACH`, see `reader/documents.ts`. Picks a list does not offer, like an older entry's, stay as rows
 * until I take them back. The note is only my free note.
 * The tasks of the chapters picked come after the documents, the due ones first, then a result for each task picked,
 * the task judged as a whole: Right, or Wrong with a short field for my comment on what went wrong; a task left
 * without result is no attempt and is not written.
 * Any type may hold attempts, like the tasks I solved in a tutorial. Every field may stay empty, the skill too.
 * Below skill and type stands the link of the summary, small and grey, as every summary has it, with its pencil
 * after the type, see `summaryPartsOf` in `categories.ts`: while I type none, the folder of its skill, the path its
 * entry links, like `NomSkillingmodules/IN2028_BusinessAnalyticsMachineLearning`, for a type on into the folder
 * of its material and of the semester, like `…/VO_UniversityLectureLessons/TUM_2026W`, a module opening
 * in the scripts view, see {@link skillPathOf}. A skill entry of the log already logged shows its attempts, which stay;
 * new ones are added after them. Everything stays editable, its skill too, whose older attempts keep their task.
 * Saving sends a skill entry of the log to the reader's one writer of skill entries, with the times, the place
 * and the note of the dialog; a skill box of the plan has the same fields but tasks and attempts, which only happen
 * in the log, and the dialog writes it itself as a box with its chapters and documents.
 *
 * - `./choices.ts`: Pickers, each one line in a row with its name, two side by side in one row, and the rows
 *   of a field of several values; marks where a long name may go on over a next line.
 * - `../skill/attempts.ts`: Loads the tasks with when they are due and what a module offers, groups the tasks,
 *   writes days out and sends skill entries.
 * - `../today.ts`: Gives today's calendar date, for the tasks due.
 * - `../skill/links.ts`: Names the folder of my modules.
 * - `fullcalendar`: Calendar that shows the entries.
 */

import {
    addedRowOf, addedRowsOf, addRowOf, breakableOf, choiceOf, choicesOf, lineMove, pairOf, rowOf, searchOf,
} from "./choices.ts";
import {
    dayTextOf, groupsOf, moduleLoad, semesterOf, skillEntrySend, skillingLoad,
} from "../skill/attempts.ts";
import { calendarTodayOf } from "../today.ts";
import { modulesFolder } from "../skill/links.ts";

import type { Calendar } from "fullcalendar";
import type { Choice } from "./choices.ts";
import type { EntryFields } from "./entries.ts";
import type {
    AttemptNew, Group, Link, ModuleContents, SkillModule, SkillTask, Skilling,
} from "../skill/attempts.ts";


/**
 * A task picked for the entry, with its result as picked so far.
 *
 * - `task`: Identity of the task, like `IN2028/Airline Revenue Interval`.
 * - `result`: Result, right or wrong, empty before it is picked.
 * - `comment`: My comment on what went wrong, empty when not given.
 */
type AttemptPick = {
    task: string;
    result: "right" | "wrong" | "";
    comment: string;
};

/**
 * What is picked for the skill entry so far.
 *
 * - `module`: Name of the skill, a module code like `IN2028` or a project like `WokFlow`, empty before it is picked.
 * - `type`: Its type, like `VO`, empty before it is picked and for none.
 * - `semester`: Its semester, like `2025W`, empty while it is the semester of the day of the dialog,
 *   see {@link semesterDay}.
 * - `chapters`: Names of the chapters, like `01_RegressionAnalysis`.
 * - `documents`: Paths of the documents from the module folder, in the order they were picked.
 * - `attempts`: Tasks picked, in the order they were picked, each with its result.
 */
type SkillPicks = {
    module: string;
    type: string;
    semester: string;
    chapters: string[];
    documents: string[];
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
 * - `title`: What it is as written, its `SUMMARY`, like `IN2028 Business Analytics Machine Learning (VO)`, in the log.
 * - `titleLink`: Its link, the `ALTREP` of its `SUMMARY`, in the log: the folder of its skill, or a web address I typed;
 *   empty for none.
 * - `chapters`: Names of its chapters, in the log.
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
];

/**
 * Modules with their tasks and the lists to pick from, as the reader gave them when `Skill` was picked.
 */
let skilling: Skilling = {
    modules: [], skills: [], otherModules: [], labels: {}, paths: {}, types: [], lost: [],
};

/**
 * What is picked so far.
 */
let picks: SkillPicks = {
    module: "", type: "", semester: "", chapters: [], documents: [], attempts: [],
};

/**
 * Beginning of the name of the folder of the material of each type in a module, whose files the Documents list offers
 * for an entry of that type: a lecture's slides in `VO_UniversityLectureLessons`, the sheet of an exercise
 * in `UE_UniversityModuleExercises`, of a central exercise in `ZU_UniversityCentralExercises`, of a tutorial
 * in `TU_UniversityTutorExercises`, a homework's in `HU_UniversityHomeExercises`, an exam's
 * in `FA_UniversityModuleExaminations`, a practical course's in a folder starting with `PR_`.
 */
const materialFolders: { [type: string]: string } = {
    VO: "VO_", UE: "UE_", ZU: "ZU_", TU: "TU_", HU: "HU_", FA: "FA_", PR: "PR_",
};

/**
 * Path of a note of a chapter from the module folder, its chapter folder caught, like `01_RegressionAnalysis`
 * of `01_RegressionAnalysis/01_01_SampleMeanStandardError.md`, see `ModuleContents`.
 */
const chapterNote: RegExp = /^(\d{2}_[^/]*)\/[^/]+$/;

/**
 * Day of the dialog, like `2026-10-13`, whose semester the entry has while I pick none, see {@link skillDaySet}.
 */
let semesterDay: string = "";

/**
 * Where the fields of `Skill` show and the call that tells the dialog of a change, as last shown, so a changed day
 * shows its semester, see {@link skillDaySet}, and a changed place its line, see {@link skillPlaceShow};
 * `null` before the fields of `Skill` show.
 *
 * - `head`: Place of skill and type, below the category.
 * - `more`: Place of the fields below them, before the note.
 * - `place`: Rows of the place of the entry, which `categories.ts` builds, put first below skill and type.
 * - `summary`: Pencil, link and the part to type it of the summary, which `categories.ts` builds as for every summary,
 *   see `summaryPartsOf` there: the pencil after the type, the link and the part below skill and type.
 * - `changed`: Tells the dialog that what is picked changed, so it shows the link of the summary anew and allows
 *   saving or not.
 */
type SkillShown = {
    head: HTMLElement;
    more: HTMLElement;
    place: HTMLElement[];
    summary: HTMLElement[];
    changed: () => void;
};

/**
 * Where the fields of `Skill` last showed, see {@link SkillShown}, `null` before they show.
 */
let shownIn: SkillShown | null = null;

/**
 * Chapters and documents of the skill picked, as the reader gave them, none before a skill is picked and for a project.
 */
let contents: ModuleContents = { folder: "", chapters: [], documents: [] };

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
 * Whether the dialog writes a box of the plan, which has the same fields as the log but tasks and attempts,
 * which only happen in the log.
 */
let inPlan: boolean = false;

/**
 * First choice of the list of types, which takes the type back, my own learning without type.
 */
const noType: string = "None";

/**
 * Whether the dialog changes an entry of the log logged from a box of the plan, whose skill and type stay the plan's,
 * see `asPlanned` in `categories.ts`.
 */
let asPlanned: boolean = false;


/**
 * Gives the paths of the documents of a skill entry or a box from its links, as the Documents list offers them,
 * see `ModuleContents`: its files in the folder of its module from that folder; a file with its fingerprint,
 * or one in a folder of material, like the slides a lecture of my plan links without fingerprint, never the folder
 * of a chapter, which lies right in the module.
 * - `rest`: Path of a link from the folder of the module, `null` for a link outside it.
 *
 * @param links - Links of the entry, like `NomSkillingmodules/IN2028_…/VO_…/04_….pdf`
 * @returns Paths like `VO_UniversityLectureLessons/TUM_2025W/04_LogisticPoissonRegression.pdf`
 *   or `01_RegressionAnalysis/01_01_SampleMeanStandardError.md`, in their order
 */
function documentPathsOf(links: Link[]): string[] {
    return links.flatMap((link: Link): string[] => {
        const rest: string | null = contents.folder !== "" && link.path.startsWith(`${contents.folder}/`)
            ? link.path.slice(contents.folder.length + 1) : null;
        return rest !== null && (link.fingerprint !== "" || rest.includes("/")) ? [rest] : [];
    });
}

/**
 * Gives the folders of the material of the entry below the folder of its module, which its link goes on into,
 * as the reader writes it, see `skillLinkOf` in `reader/documents.ts`: for a type the folder of its material,
 * see {@link materialFolders}, and in it the folder of the semester of the entry, as far as the module holds files
 * there, like `VO_UniversityLectureLessons` and `TUM_2026W`, or `VO_UniversityLectureLessons` alone while it holds
 * no slides of that semester; none for my own learning, for a project and for a module without material of the type.
 * - `folder`: Beginning of the name of the folder of the material of the type, `undefined` for none.
 * - `semester`: Semester of the entry, like `2026W`.
 * - `material`: Paths of the documents in the folder of the material, each parted by `/`.
 * - `inSemester`: Path of a document in the folder of the semester there, `undefined` for none.
 *
 * @returns Names of the folders, like `VO_UniversityLectureLessons` and `TUM_2026W`, none for none
 */
function materialOf(): string[] {
    const folder: string | undefined = materialFolders[picks.type];
    const semester: string = skillSemesterOf(semesterDay);
    const material: string[][] = folder === undefined ? [] : contents.documents
        .map((path: string): string[] => path.split("/"))
        .filter((parts: string[]): boolean => parts.length > 1 && parts[0].startsWith(folder));
    const inSemester: string[] | undefined = material.find((parts: string[]): boolean =>
        parts.length > 2 && /\d{4}[WS]/.exec(parts[1])?.[0] === semester);
    return inSemester?.slice(0, 2) ?? material[0]?.slice(0, 1) ?? [];
}

/**
 * Gives the folder of the skill picked, the path its entry links as the `ALTREP` of its `SUMMARY` while I type
 * no link, as the reader writes it, like `NomSkillingmodules/IN2028_BusinessAnalyticsMachineLearning`, for a type
 * on into the folders of its material, see {@link materialOf}, like
 * `NomSkillingmodules/MGT1372_EntrepreneurialBusiness/VO_UniversityLectureLessons/TUM_2026W`, so it follows the type
 * and the semester as I pick them; a project its path alone, like `NomManageplannings/NomFrequencediary`.
 * - `path`: The folder of the skill picked, empty for none.
 *
 * @returns The folder, empty while no skill is picked
 */
export function skillPathOf(): string {
    const path: string = skilling.paths[picks.module] ?? "";
    return path === "" ? "" : [path, ...materialOf()].join("/");
}

/**
 * Shows the folder of the skill picked, see {@link skillPathOf}, as the link below the summary, small and grey,
 * as a place has its address below it, see `summaryPartsOf` in `categories.ts`: for a module a link that opens
 * the module in the scripts view in a new tab, underlined under the pointer, for a project, which the scripts view
 * has not, its path alone; hidden while no skill is picked. Where it is wider than its row, as on a phone, it goes on
 * below after a `/`, after a `_` or between the words of a name, like `NomSkillingmodules/IN2028_Business`
 * and `AnalyticsMachineLearning`, never within a word, see {@link breakableOf}.
 * - `folder`: The folder of the skill picked without its material, empty for none.
 *
 * @param link - The link below the summary
 */
export function skillPathShow(link: HTMLAnchorElement): void {
    const folder: string = skilling.paths[picks.module] ?? "";
    link.textContent = breakableOf(skillPathOf()).replaceAll("/", "/\u200b");
    if (folder.startsWith(`${modulesFolder}/`))
        link.href = `/scripts?module=${encodeURIComponent(folder.slice(modulesFolder.length + 1))}`;
    else
        link.removeAttribute("href");
    link.hidden = folder === "";
}

/**
 * Makes a calm grey hint in place of a picker, like the one for a document the module holds no more.
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
 * Each shows its name airy, as a summary names it, like `IN2028 Business Analytics Machine Learning`, a project
 * like `WokFlow`, and is picked by its name, a module its code, like `IN2028`.
 * My modules of the university stand apart from my projects of programming, each under its small grey head,
 * `Modules` and `Projects`, a thin line between them, as the sections of the food search, see `.picker-group`
 * in `choices.css`; a module known by its code, letters then digits, like `IN2028` or `MGT1372`.
 * - `module`: Whether a skill is a module of the university.
 * - `choices`: Every skill and module, the modules first, the skills of the semester first in each, each its name
 *   as value, its name airy as text, its kind as group.
 * - `shown`: Skills the search looks through.
 *
 * @returns Search for the picker
 */
function moduleSearchOf(): (text: string) => Promise<Choice[]> {
    const module: (name: string) => boolean = (name: string): boolean => /^[A-Z]{2,4}\d{3,6}$/.test(name);
    const named: string[] = [...skilling.skills, ...skilling.otherModules];
    const choices: Choice[] = [...named.filter(module), ...named.filter((name: string): boolean => !module(name))]
        .map((name: string): Choice =>
            ({ value: name, text: skilling.labels[name] ?? name, group: module(name) ? "Modules" : "Projects" }));
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
 * Builds the choices of the semester, picked from them, never typed: the semester of the day of the dialog first,
 * then every semester the module has material for, by the folders of its material, like `TUM_2026S`, `TUM_2024W`
 * and `LMU_2024S` giving `2026S`, `2024W` and `2024S`, newest first, see {@link documentSemesterOf}; and the one
 * picked when it is none of them, like that of an older entry, among them by its rank.
 * - `current`: The semester of the day of the dialog.
 * - `others`: The other semesters, each once.
 *
 * @returns Choices of the semester
 */
function semesterChoicesOf(): Choice[] {
    const current: string = semesterOf(semesterDay);
    const others: string[] = [...new Set([...contents.documents.map(documentSemesterOf), picks.semester])]
        .filter((semester: string): boolean => semester !== "" && semester !== current)
        .sort((first: string, second: string): number => semesterRankOf(second) - semesterRankOf(first));
    return [current, ...others].map(choiceOf);
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
 * Gives the chapter a document belongs to, by the name of the folder of a note of a chapter,
 * like `01_RegressionAnalysis` of `01_RegressionAnalysis/01_01_SampleMeanStandardError.md`, see {@link chapterNote}.
 *
 * @param path - Path of a document from the module folder
 * @returns Name of its chapter, empty for a document of no chapter, like the slides of a lecture
 */
function chapterOfDocument(path: string): string {
    return path.match(chapterNote)?.[1] ?? "";
}

/**
 * Gives the documents a Documents list offers, see the top of this file: for my own learning the notes of a chapter,
 * see {@link chapterOfDocument}, like `01_RegressionAnalysis/01_01_SampleMeanStandardError.md`; for a type
 * the files of the folder of its material, see {@link materialFolders}, in the folder of the semester of the entry,
 * like `TUM_2026W` for `2026W`; each by path, in the order of their paths.
 * - `folder`: Beginning of the name of the folder of the material of the type, empty for my own learning.
 * - `semester`: Semester of the entry, like `2026W`.
 *
 * @param chapter - Chapter whose notes my own learning offers, like `01_RegressionAnalysis`
 * @returns Paths like `VO_UniversityLectureLessons/TUM_2026W/04_LogisticPoissonRegression.pdf`
 */
function documentsOfferedOf(chapter: string): string[] {
    const folder: string = materialFolders[picks.type] ?? "";
    const semester: string = skillSemesterOf(semesterDay);
    return contents.documents
        .filter((path: string): boolean => folder === "" ? chapterOfDocument(path) === chapter
            : path.startsWith(folder) && documentSemesterOf(path) === semester)
        .sort((first: string, second: string): number => first.localeCompare(second));
}

/**
 * Builds the choices of a Documents list, see {@link documentsOfferedOf}, each its path as value, the name of its file
 * as text, and as group for a file of material the folders between the folder of its material and it, like
 * `04_LogisticPoissonRegression.pdf` under `TUM_2026W`, none for a note.
 * - `parts`: Parts of the path of a document.
 *
 * @param chapter - Chapter whose notes my own learning offers, like `01_RegressionAnalysis`
 * @returns Choices of the documents
 */
function documentChoicesOf(chapter: string): Choice[] {
    return documentsOfferedOf(chapter).map((path: string): Choice => {
        const parts: string[] = path.split("/");
        if (chapterOfDocument(path) !== "")
            return { value: path, text: parts.at(-1) ?? path, group: "" };
        return { value: path, text: parts.at(-1) ?? path, group: parts.slice(1, -1).join("/") };
    });
}

/**
 * Gives the name of the file of a document, which says what it is, as its row shows it.
 *
 * @param path - Path of a document, like `VO_…/TUM_2026W/04_LogisticRegression.pdf`
 * @returns Name like `04_LogisticRegression.pdf`
 */
function fileNameOf(path: string): string {
    return path.split("/").at(-1) ?? path;
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
 * for Wrong, the field for my comment on what went wrong.
 * - `detail`: Place of the field.
 * - `detailShow`: Shows the field for Wrong.
 *
 * @param pick - Task picked, changed as its result and comment are picked
 * @param name - Name of the task
 * @param changed - Tells the dialog that what is picked changed
 * @returns Result of the task
 */
function resultElementOf(pick: AttemptPick, name: string, changed: () => void): HTMLElement {
    const element: HTMLDivElement = document.createElement("div");
    const label: HTMLSpanElement = document.createElement("span");
    const detail: HTMLDivElement = document.createElement("div");
    const detailShow: () => void = (): void => {
        if (pick.result !== "wrong") {
            detail.replaceChildren();
            return;
        }
        const input: HTMLInputElement = document.createElement("input");
        input.type = "text";
        input.placeholder = "What went wrong";
        input.setAttribute("aria-label", "What went wrong");
        input.autocomplete = "off";
        input.value = pick.comment;
        input.addEventListener("input", (): void => {
            pick.comment = input.value.trim();
        });
        detail.replaceChildren(input);
        input.focus();
    };

    element.className = "skill-result";
    label.className = "skill-result-name";
    label.textContent = name;
    label.title = name;
    detail.className = "skill-result-detail";
    element.append(label, choicesOf({
        search: searchOf(resultChoices), picked: pick.result === "" ? [] : [pick.result], many: false, adding: false,
        pick: (values: string[]): void => {
            pick.result = values[0] === "right" || values[0] === "wrong" ? values[0] : "";
            pick.comment = "";
            detailShow();
            changed();
        },
    }), detail);
    detailShow();
    return element;
}

/**
 * Builds the attempts of the entry being changed, which stay: one line per attempt, its task and result, with my
 * comment on what went wrong, an older one also with my effort, where I got stuck or why I skipped.
 * - `parts`: An `X-ATTEMPT` cut at each `;`: task, result and comment, of an older one task, result, effort, and where
 *   I got stuck, why I skipped or what went wrong, without the time of the tap a button wrote at its start,
 *   see {@link tapTime}.
 * - `older`: Whether it is written the older way, its task with its module, see `reader/skill.ts`.
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
        const older: boolean = parts[0].includes("/");
        const effort: string = older ? parts[2] ?? "" : "";
        const item: HTMLLIElement = document.createElement("li");
        item.textContent = [parts[0].slice(parts[0].indexOf("/") + 1), parts[1], effort === "" ? "" : `${effort} effort`,
            parts.slice(older ? 3 : 2).join(";")].filter((part: string): boolean => part !== "").join(" · ");
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
    const none: ModuleContents = { folder: "", chapters: [], documents: [] };
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
 * @returns The row of the tasks with the results below its line, none while the chapters picked have no tasks
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
        below: [results],
        search: searchOf(taskChoicesOf(tasks)), picked: picks.attempts.map((pick: AttemptPick): string => pick.task),
        many: true, adding: false, noun: "task",
        pick: (values: string[]): void => {
            picks.attempts = values.map((task: string): AttemptPick =>
                picks.attempts.find((pick: AttemptPick): boolean => pick.task === task)
                ?? { task: task, result: "", comment: "" });
            resultsShow();
            changed();
        },
    }))];
}

/**
 * Builds the rows of the chapters of my system the entry belongs to and of its documents, in plan and log,
 * one chapter after another, see the top of this file, once a skill is picked: each chapter picked its row,
 * the first named `Chapter`, its name a link to it in the scripts view, see {@link chapterLinkOf}, with a small ×
 * that takes it back, see `addedRowOf` in `choices.ts`, and for my own
 * learning the one plus right after its name, `Add a document` as its tooltip, and right below it, indented under
 * a thin grey line, its documents, the notes of that chapter, each with its ×, see {@link documentRowsOf}; for a type
 * the documents of its material once a chapter is picked, or while the entry has some, below all chapters; then,
 * while the module has chapters left, the list that adds one by the names of their folders, its plus beside the name
 * `Chapter`, `Add a chapter` as its tooltip, see `addRowOf` in `choices.ts`, as a meal adds its next food: every plus
 * right after what it adds to, none on a line of its own; a module without any chapter folder,
 * like `MGT1372` before its chapters are written, holds a calm `No chapters yet` in the row `Chapter`, as the scripts
 * view says it, so the row never just disappears; a project has no chapters and no row. A chapter keeps the name it has
 * in the entry, also once its folder has another name. Taking back a chapter of my own learning takes back
 * its notes too; documents of my own learning that belong to no chapter picked stay below, to be taken back.
 * Each change shows the fields again, the tasks of the chapters picked with them, see {@link tasksOf}.
 * - `own`: Whether it is my own learning, without type, whose documents belong to their chapters.
 * - `offered`: Chapters of the module not picked yet.
 * - `rows`: The rows so far.
 * - `loose`: Documents of my own learning of no chapter picked.
 *
 * @param again - Shows the fields again and tells the dialog
 * @returns The rows, none while no skill is picked
 */
function chapterRowsOf(again: () => void): HTMLElement[] {
    if (picks.module === "")
        return [];
    const own: boolean = picks.type === "";
    const offered: Choice[] = contents.chapters.filter((chapter: string): boolean => !picks.chapters.includes(chapter))
        .map(choiceOf);
    const rows: HTMLElement[] = [];
    picks.chapters.forEach((chapter: string, index: number): void => {
        const row: HTMLElement = addedRowOf(index === 0 ? "Chapter" : "", chapter, (): void => {
            picks.chapters = picks.chapters.filter((other: string): boolean => other !== chapter);
            if (own)
                picks.documents = picks.documents.filter((path: string): boolean =>
                    chapterOfDocument(path) !== chapter);
            again();
        }, chapterLinkOf(chapter));
        const documents: HTMLElement[] = own ? documentRowsOf(documentChoicesOf(chapter),
            picks.documents.filter((path: string): boolean => chapterOfDocument(path) === chapter), again, true) : [];
        const list: HTMLElement | undefined = documents.find((one: HTMLElement): boolean =>
            one.querySelector(".picker-line") !== null);
        const text: HTMLElement | null = row.querySelector(".picker-added-text");
        if (list !== undefined && text !== null)
            lineMove(list, text);
        rows.push(row, ...documents);
    });
    const first: HTMLElement | undefined = rows[0];
    const loose: string[] = picks.documents.filter((path: string): boolean =>
        !picks.chapters.includes(chapterOfDocument(path)));
    if (own)
        rows.push(...documentRowsOf([], loose, again, false));
    else if (picks.chapters.length > 0 || picks.documents.length > 0)
        rows.push(...documentRowsOf(documentChoicesOf(""), picks.documents, again, false));
    if (offered.length > 0)
        rows.push(addRowOf("Chapter", first, choicesOf({
            search: searchOf(offered), picked: [], many: false, adding: false, noun: "chapter",
            empty: "Add a chapter", plus: true,
            pick: (values: string[]): void => {
                picks.chapters = [...picks.chapters, ...values];
                again();
            },
        })));
    else if (contents.chapters.length === 0 && picks.chapters.length === 0 && contents.folder !== "")
        rows.push(rowOf("Chapter", hintOf("No chapters yet")));
    return rows;
}

/**
 * Gives the link of a chapter picked, which opens it in the scripts view in this window at its first note, like
 * `/scripts?path=IN2028_BusinessAnalyticsMachineLearning%2F01_RegressionAnalysis%2F01_01_….md`, the module already
 * named by the summary above; none for a chapter without notes, like one whose folder has another name now.
 * - `module`: Name of the module folder, like `IN2028_BusinessAnalyticsMachineLearning`.
 * - `note`: Path of the first note of the chapter from the module folder, `undefined` for none.
 *
 * @param chapter - Name of the chapter, like `01_RegressionAnalysis`
 * @returns Address like `/scripts?path=…`, empty for none
 */
function chapterLinkOf(chapter: string): string {
    const module: string = contents.folder.slice(modulesFolder.length + 1);
    const note: string | undefined = contents.documents.find((path: string): boolean =>
        chapterOfDocument(path) === chapter);
    if (note === undefined)
        return "";
    return `/scripts?path=${encodeURIComponent(`${module}/${note}`)}`;
}

/**
 * Builds the rows of documents, see `addedRowsOf` in `choices.ts`: the Documents list of what it offers, see
 * {@link documentChoicesOf}, and a row per document picked of it, the name of its file, see {@link fileNameOf};
 * no list while it offers nothing, like for a chapter without notes, and a hint below when a document picked
 * is in the module no more, which the reader could not find by its fingerprint either. Inside a chapter they stand
 * below it, indented under a thin grey line, see `nested` in `choices.ts`, their plus moved after the chapter's name.
 * - `rows`: The rows of the list and of the documents picked.
 *
 * @param choices - Documents the list offers, none for no list
 * @param shown - Documents picked that these rows show, a part of all documents picked
 * @param again - Shows the fields again and tells the dialog
 * @param nested - Whether they stand inside the chapter above them
 * @returns The rows, none for neither documents offered nor picked
 */
function documentRowsOf(choices: Choice[], shown: string[], again: () => void, nested: boolean): HTMLElement[] {
    const rows: HTMLElement[] = addedRowsOf("Documents", {
        choices: choices, picked: shown, textOf: fileNameOf, grouped: true, noun: "document", nested: nested,
        change: (values: string[]): void => {
            picks.documents = [...picks.documents.filter((path: string): boolean => !shown.includes(path)), ...values];
            again();
        },
    });
    if (shown.some((path: string): boolean => !contents.documents.includes(path)))
        rows.push(rowOf("",
            hintOf("Not in the module any more, not even by its fingerprint; the link stays as written")));
    return rows;
}

/**
 * Shows the fields of `Skill` as picked so far, see the top of this file: skill and type side by side in the row
 * of its summary below the category; below them the place, the semester, the chapters one after another with their
 * documents, see {@link chapterRowsOf}, and in the log the tasks of the chapters picked with a result
 * for each task picked, see {@link tasksOf}, and the attempts the entry has; the pencil of the summary after the type
 * and its link below skill and type, see {@link SkillShown}.
 * Picking a skill loads its chapters and documents and shows the fields again, with no chapters, documents or tasks
 * picked; picking a type, a semester, a chapter or a document, or taking one back, shows them again, the documents
 * offering what follows from them.
 * - `again`: Shows the fields again and tells the dialog.
 *
 * @param shown - Where the fields show, see {@link SkillShown}
 */
function picksShow(shown: SkillShown): void {
    const again: () => void = (): void => {
        picksShow(shown);
        shown.changed();
    };

    shown.head.replaceChildren(rowOf("Summary", pairOf(
        choicesOf({
            search: moduleSearchOf(), picked: picks.module === "" ? [] : [picks.module], many: false, adding: false,
            noun: "skill", locked: asPlanned, below: shown.summary.slice(1),
            pick: (values: string[]): void => {
                picks = { ...picks, module: values[0] ?? "", chapters: [], documents: [], attempts: [] };
                contentsLoad().then(again).catch((error: unknown): void => console.error(error));
            },
        }),
        choicesOf({
            search: searchOf([noType, ...skilling.types].map(choiceOf)), picked: picks.type === "" ? [] : [picks.type],
            many: false, adding: false, noun: "type", locked: asPlanned, empty: "Add a type", plus: true,
            aside: shown.summary.slice(0, 1),
            pick: (values: string[]): void => {
                picks.type = values[0] === noType ? "" : values[0] ?? "";
                again();
            },
        }))));
    shownIn = shown;
    shown.more.replaceChildren(
        ...shown.place,
        rowOf("Semester", choicesOf({
            search: searchOf(semesterChoicesOf()), picked: [skillSemesterOf(semesterDay)], many: false, adding: false,
            noun: "semester",
            pick: (values: string[]): void => {
                picks.semester = values[0] ?? "";
                again();
            },
        })),
        ...chapterRowsOf(again),
        ...tasksOf(shown.changed),
        ...loggedOf(),
    );
}

/**
 * Shows the fields of `Skill` for a box of the plan or an entry of the log, as it has them, see {@link picksShow}.
 *
 * @param head - Place of skill and type in the dialog, below the category
 * @param more - Place of the fields below them, before the note
 * @param place - Rows of the place of the entry, put first below skill and type
 * @param plan - Whether it is a box of the plan, which takes no tasks and attempts
 * @param values - Values of the entry, empty for a new one
 * @param day - Day of the dialog, like `2026-10-13`, whose semester the entry has while it has none
 * @param planned - Whether it is an entry of the log logged from a box of the plan, whose skill and type stay the plan's
 * @param changed - Tells the dialog that what is picked changed, so it shows the link of the summary anew and allows
 *   saving or not
 * @param summary - Pencil, link and the part to type it of the summary, see {@link SkillShown}; none when left out
 * @throws {Error} - When the reader cannot answer
 */
export async function skillFieldsShow(head: HTMLElement, more: HTMLElement, place: HTMLElement[], plan: boolean,
                                      values: SkillValues, day: string, planned: boolean,
                                      changed: () => void, summary: HTMLElement[] = []): Promise<void> {

    skilling = await skillingLoad();
    inPlan = plan;
    asPlanned = planned;
    semesterDay = day;
    logged = plan ? [] : values.attempts;
    picks = {
        module: values.module, type: values.type, semester: values.semester, chapters: values.chapters,
        documents: [], attempts: [],
    };
    await contentsLoad();
    picks.documents = documentPathsOf(values.links);
    picksShow({ head: head, more: more, place: place, summary: summary, changed: changed });
}

/**
 * Links of a skill entry or box as picked, which the reader writes, see `linksOf` in `reader/documents.ts`.
 *
 * - `chapters`: Names of its chapters, its `X-CHAPTER`s, like `01_RegressionAnalysis`.
 * - `documents`: Paths of its documents from the folder of its skill, its `ATTACH`es.
 */
export type SkillLinks = {
    chapters: string[];
    documents: string[];
};

/**
 * Reads the chapters and documents picked, of a box of the plan or an entry of the log.
 *
 * @returns Chapters and documents, none while nothing is picked
 */
export function skillLinksRead(): SkillLinks {
    return { chapters: picks.chapters, documents: picks.documents };
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
 * so the fields show again when that semester is another, the documents with the files of that semester,
 * and the link of the summary with the folder of that semester.
 * - `before`: Semester of the day before.
 *
 * @param day - Day like `2027-04-02`
 */
export function skillDaySet(day: string): void {
    const before: string = semesterOf(semesterDay);
    semesterDay = day;
    if (picks.semester === "" && semesterOf(day) !== before && shownIn !== null) {
        picksShow(shownIn);
        shownIn.changed();
    }
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
 * Sends the skill entry of the log as picked, with the times, place, people, semester, note and box of the dialog,
 * new or as the changes of the entry being changed, then loads the log of the shown day again; a change only while
 * the file holds the entry as the dialog opened it, see `skillEntrySend` in `../skill/attempts.ts`, else nothing.
 * - {@link EventSourceApi#refetch}: Loads the entries of a calendar of the reader again.
 * - `attempts`: The tasks picked with their results, as attempts to send, a task without result left out.
 * - `saved`: Whether the reader wrote it.
 *
 * @param calendar - Calendar of the day
 * @param id - Identifier of the entry being changed, empty for a new one
 * @param fields - Fields, note, times and box of the dialog
 * @param version - Fingerprint of the entry being changed as the dialog opened it, see `version` of `Entry`
 *   in `reader/calendar.ts`; empty for a new one
 * @returns Whether it is written, `false` when the file changed the entry since the dialog opened it
 * @throws {Error} - When the reader does not take the entry for another reason
 */
export async function skillSave(calendar: Calendar, id: string, fields: EntryFields,
                                version: string): Promise<boolean> {
    const attempts: AttemptNew[] = picks.attempts.flatMap((pick: AttemptPick): AttemptNew[] => pick.result === "" ? []
        : [{ task: pick.task, result: pick.result, comment: pick.result === "wrong" ? pick.comment : "" }]);

    const saved: boolean = await skillEntrySend(id, {
        type: picks.type, module: picks.module, semester: fields.semester, chapters: picks.chapters,
        documents: picks.documents, attempts: attempts,
        titleLink: fields.titleLink, location: fields.location, locationLink: fields.locationLink,
        attendees: fields.attendees ?? [],
        planned: fields.planned, note: fields.note,
        start: fields.start, end: fields.end,
    }, version);
    if (saved)
        calendar.getEventSourceById("log")?.refetch();
    return saved;
}
