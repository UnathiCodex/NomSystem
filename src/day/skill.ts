/**
 * ## Skill in the entry by category
 *
 * A skill entry in the dialog, for a box of the plan and the log alike: its skill and its type, like `IN2028` and `VO`,
 * each picked from its list, the type optional, like for my own learning or a project, `WokFlow`; the reader writes
 * what it is from both, like `IN2028_BusinessAnalyticsMachineLearning (VO)`, see `reader/documents.ts`;
 * in the log below them the chapters it covered, the document it used, like the slides of a lecture or a sheet,
 * and attempts at the tasks of my notes, all optional, so a lecture logged from its box gets its chapters
 * and document later.
 * The one Skill picker shows the skills of the semester, a module by its code, like `IN2028`, a project by its folder
 * name, like `WokFlow`, and its search every module folder, since I sometimes attend another module.
 * A module picked offers its chapter folders, `No chapters yet` when it has none,
 * and its files outside them, each under the kind of material it is, like `VO_UniversityLectureLessons`,
 * searched by folder and name together; a project offers neither, like a module without chapters.
 * The tasks of the chapters picked come below, the due ones first, then a result for each task picked:
 * Right, Wrong, Stuck with where I got stuck, or Skip with a reason, and after Right, Wrong or Stuck
 * one tap for my effort, low, medium or high. Any type may hold attempts, like the tasks I solved in a tutorial.
 * Chapters show their names to read, like `01 Regression Analysis`.
 * A skill entry of the log already logged shows what it is as written, a module opening in the notes view,
 * and the document it used by its name, opening in a new tab, see `../skill/links.ts`, and its attempts, which stay;
 * new ones are added after them, and its skill stays while it has attempts, since they are attempts at its tasks.
 * Saving sends a skill entry of the log to the reader's one writer of skill entries, with the times and the note
 * of the dialog; a skill box of the plan is a plain box, which the dialog writes itself.
 *
 * - `./choices.ts`: Pickers, in rows with their names.
 * - `../skill/attempts.ts`: Loads the tasks with when they are due and what a module offers, groups the tasks,
 *   writes days out and sends skill entries.
 * - `../today.ts`: Gives today's calendar date, for the tasks due.
 * - `../skill/links.ts`: Shows what a skill entry is and a link of it by its name.
 * - `fullcalendar`: Calendar that shows the entries.
 */

import { choiceOf, choicesOf, groupedSearchOf, rowOf, searchOf } from "./choices.ts";
import { dayTextOf, groupsOf, moduleLoad, skillEntrySend, skillingLoad } from "../skill/attempts.ts";
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
 * - `chapters`: Names to read of the chapters, like `01 Regression Analysis`.
 * - `document`: Path of the document from the module folder, empty for none.
 * - `attempts`: Tasks picked, in the order they were picked, each with its result.
 */
type SkillPicks = {
    module: string;
    type: string;
    chapters: string[];
    document: string;
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
let picks: SkillPicks = { module: "", type: "", chapters: [], document: "", attempts: [] };

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
 * Whether the dialog writes a box of the plan, which takes only module and type.
 */
let inPlan: boolean = false;


/**
 * Gives the path of the document of a skill entry from its links: its file in the folder of its module,
 * from that folder, as the document picker offers it, the path of the file without `NomSkillingmodules`
 * and the folder of the module.
 * - `file`: The link to a file of a module, `undefined` for none.
 *
 * @param links - Links of the entry, like `NomSkillingmodules/IN2028_…/VO_…/04_….pdf`
 * @returns Path like `VO_UniversityLectureLessons/TUM_2025W/04_LogisticPoissonRegression.pdf`, empty for none
 */
function documentPathOf(links: Link[]): string {
    const file: Link | undefined = links.find((link: Link): boolean =>
        link.fingerprint !== "" && link.path.startsWith("NomSkillingmodules/"));
    return file === undefined ? "" : file.path.split("/").slice(2).join("/");
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
 * Builds the search of the Skill picker: while nothing is typed the skills of the semester and the skill picked,
 * while I type every skill and module folder that holds the words, the skills of the semester first;
 * only the skill picked while the entry has attempts, since they are attempts at its tasks.
 * Each shows its name, a module its code, like `IN2028`, a project its folder name, like `WokFlow`.
 * - `choices`: Every skill and module, the skills of the semester first, each its name as value and text.
 * - `shown`: Skills the search looks through.
 *
 * @returns Search for the picker
 */
function moduleSearchOf(): (text: string) => Promise<Choice[]> {
    const choices: Choice[] = [...skilling.skills, ...skilling.otherModules].map(choiceOf);
    return async (text: string): Promise<Choice[]> => {
        if (logged.length > 0)
            return choices.filter((choice: Choice): boolean => choice.value === picks.module);
        const shown: Choice[] = text.trim() !== "" ? choices : choices.filter((choice: Choice): boolean =>
            choice.value === picks.module || skilling.skills.includes(choice.value));
        return await searchOf(shown)(text);
    };
}

/**
 * Builds the choices of the documents of the module picked: each its path as value, under the folder it lies in
 * at the top of the module as group, the rest of its path as text, so its semester always shows,
 * like `TUM_2025W/04_LogisticPoissonRegression.pdf` under `VO_UniversityLectureLessons`.
 * - `slash`: Place of the first `/` of the path, -1 for a file at the top of the module.
 *
 * @returns Choices of the documents, in the order of their paths
 */
function documentChoicesOf(): Choice[] {
    return contents.documents.map((path: string): Choice => {
        const slash: number = path.indexOf("/");
        return { value: path, text: path.slice(slash + 1), group: slash === -1 ? "" : path.slice(0, slash) };
    });
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
 * Builds the result of a task picked: its name, whole in its tooltip, the results to pick, and below them,
 * for Stuck, the field for where I got stuck, for Skip the reasons to pick, and after Right, Wrong or Stuck
 * my effort, low, medium or high, one tap.
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
                many: false, adding: false,
                pick: (values: string[]): void => {
                    pick.detail = values[0] ?? "";
                },
            }));
        }
        if (pick.result !== "" && pick.result !== "skipped")
            parts.push(rowOf("Effort", choicesOf({
                search: searchOf(skilling.efforts.map(choiceOf)), picked: pick.effort === "" ? [] : [pick.effort],
                many: false, adding: false,
                pick: (values: string[]): void => {
                    pick.effort = (values[0] ?? "") as Effort | "";
                },
            })));
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
 * Loads the chapters and documents of the skill picked, none while no skill is picked or in the plan,
 * none for a project, and none for a module without folder, like a module code of the plan that has none, so its entry still opens;
 * what comes for a skill picked before another one is dropped.
 * - `module`: Skill picked when the loading starts.
 * - `none`: No chapters and no documents.
 * - `loaded`: Chapters and documents of the module.
 */
async function contentsLoad(): Promise<void> {
    const module: string = picks.module;
    const none: ModuleContents = { chapters: [], documents: [] };
    const loaded: ModuleContents = module === "" || inPlan ? none
        : await moduleLoad(module).catch((error: unknown): ModuleContents => {
            console.error(error);
            return none;
        });
    if (module === picks.module)
        contents = loaded;
}

/**
 * Shows the fields of `Skill` as picked so far: skill and type, and in the log the chapters of the skill,
 * or `No chapters yet`, its documents, with a hint when the document of the entry is in the module no more,
 * which the reader could not find by its fingerprint either, the links of the entry, see {@link linkedOf}, the tasks
 * of the chapters picked, a result for each task picked, and the attempts the entry has.
 * Picking a skill loads its chapters and documents and shows the fields again,
 * with no chapters, document or tasks picked; picking chapters shows them again, keeping the tasks picked
 * that are still offered.
 * - `module`: Module of the semester picked, with its tasks, `undefined` for another module or before one is picked.
 * - `tasks`: Tasks of the chapters picked.
 * - `again`: Shows the fields again and tells the dialog.
 * - `results`: Place of the results of the tasks picked.
 * - `resultsShow`: Shows a result for each task picked.
 *
 * @param fields - Place of the fields in the dialog
 * @param changed - Tells the dialog that what is picked changed, so it allows saving or not
 */
function picksShow(fields: HTMLElement, changed: () => void): void {
    const module: SkillModule | undefined = skilling.modules.find((candidate: SkillModule): boolean =>
        candidate.code === picks.module);
    const tasks: SkillTask[] = module?.tasks.filter((task: SkillTask): boolean => picks.chapters.includes(task.chapter)) ?? [];
    picks.attempts = picks.attempts.filter((pick: AttemptPick): boolean =>
        tasks.some((task: SkillTask): boolean => task.id === pick.task));
    const again: () => void = (): void => {
        picksShow(fields, changed);
        changed();
    };
    const results: HTMLDivElement = document.createElement("div");
    const resultsShow: () => void = (): void => {
        results.replaceChildren(...picks.attempts.map((pick: AttemptPick): HTMLElement => resultElementOf(pick,
            tasks.find((task: SkillTask): boolean => task.id === pick.task)?.name ?? pick.task, changed)));
    };

    const rows: HTMLElement[] = [
        rowOf("Skill", choicesOf({
            search: moduleSearchOf(), picked: picks.module === "" ? [] : [picks.module], many: false, adding: false,
            pick: (values: string[]): void => {
                picks = { ...picks, module: values[0] ?? "", chapters: [], document: "", attempts: [] };
                contentsLoad().then(again).catch((error: unknown): void => console.error(error));
            },
        })),
        rowOf("Type", choicesOf({
            search: searchOf(skilling.types.map(choiceOf)), picked: picks.type === "" ? [] : [picks.type],
            many: false, adding: false,
            pick: (values: string[]): void => {
                picks.type = values[0] ?? "";
                changed();
            },
        })),
    ];
    if (!inPlan && picks.module !== "") {
        rows.push(rowOf("Chapters", contents.chapters.length === 0 && picks.chapters.length === 0
            ? hintOf("No chapters yet")
            : choicesOf({
                search: searchOf(contents.chapters.map(choiceOf)), picked: picks.chapters, many: true, adding: false,
                pick: (values: string[]): void => {
                    picks.chapters = values;
                    again();
                },
            })));
        rows.push(rowOf("Document", contents.documents.length === 0 && picks.document === ""
            ? hintOf("No documents")
            : choicesOf({
                search: groupedSearchOf(documentChoicesOf()), picked: picks.document === "" ? [] : [picks.document],
                many: false, adding: false,
                pick: (values: string[]): void => {
                    picks.document = values[0] ?? "";
                },
            })));
        if (picks.document !== "" && !contents.documents.includes(picks.document))
            rows.push(rowOf("", hintOf("Not in the module any more, not even by its fingerprint; the link stays as written")));
    }
    if (!inPlan && tasks.length > 0)
        rows.push(rowOf("Tasks", choicesOf({
            search: searchOf(taskChoicesOf(tasks)), picked: picks.attempts.map((pick: AttemptPick): string => pick.task),
            many: true, adding: false,
            pick: (values: string[]): void => {
                picks.attempts = values.map((task: string): AttemptPick =>
                    picks.attempts.find((pick: AttemptPick): boolean => pick.task === task)
                    ?? { task: task, result: "", effort: "", detail: "" });
                resultsShow();
                changed();
            },
        })));
    results.className = "skill-results";
    resultsShow();
    fields.replaceChildren(...rows, ...(inPlan ? [] : linkedOf()), results, ...loggedOf());
}

/**
 * Shows the fields of `Skill` for a box of the plan or an entry of the log, as it has them, see {@link picksShow}.
 *
 * @param fields - Place of the fields in the dialog
 * @param plan - Whether it is a box of the plan, which takes only skill and type
 * @param values - Values of the entry, empty for a new one
 * @param changed - Tells the dialog that what is picked changed, so it allows saving or not
 * @throws {Error} - When the reader cannot answer
 */
export async function skillFieldsShow(fields: HTMLElement, plan: boolean, values: SkillValues,
                                      changed: () => void): Promise<void> {

    skilling = await skillingLoad();
    inPlan = plan;
    logged = plan ? [] : values.attempts;
    linked = plan ? { title: "", titleLink: "", links: [] }
        : { title: values.title, titleLink: values.titleLink, links: values.links };
    picks = {
        module: values.module, type: values.type, chapters: values.chapters, document: documentPathOf(values.links),
        attempts: [],
    };
    await contentsLoad();
    picksShow(fields, changed);
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
 * Tells whether the skill entry can be saved: its skill picked, its type when one is wanted, and a result
 * for every task picked.
 *
 * @returns Whether it can be saved
 */
export function skillReady(): boolean {
    return picks.module !== "" && picks.attempts.every((pick: AttemptPick): boolean => pick.result !== "");
}

/**
 * Sends the skill entry of the log as picked, with the times, place, note and box of the dialog,
 * new or as the changes of the entry being changed, then loads the log of the shown day again.
 * - {@link EventSourceApi#refetch}: Loads the entries of a calendar of the reader again.
 * - `attempts`: The tasks picked with their results, as attempts to send.
 *
 * @param calendar - Calendar of the day
 * @param id - Identifier of the entry being changed, empty for a new one
 * @param fields - Fields, note, times and box of the dialog
 * @throws {Error} - When a result is missing, or the reader does not take the entry
 */
export async function skillSave(calendar: Calendar, id: string, fields: EntryFields): Promise<void> {
    if (!skillReady())
        throw new Error("Pick the skill and the results of the tasks first");
    const attempts: AttemptNew[] = picks.attempts.map((pick: AttemptPick): AttemptNew => ({
        task: pick.task,
        part: "",
        result: pick.result as Result,
        effort: pick.result === "skipped" ? "" : pick.effort,
        stuck: pick.result === "stuck" ? pick.detail : "",
        skip: pick.result === "skipped" ? pick.detail : "",
    }));

    await skillEntrySend(id, {
        type: picks.type, module: picks.module, chapters: picks.chapters, document: picks.document, attempts: attempts,
        location: fields.location, planned: fields.planned, note: fields.note, start: fields.start, end: fields.end,
    });
    calendar.getEventSourceById("log")?.refetch();
}
