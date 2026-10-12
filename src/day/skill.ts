/**
 * ## Skill in the entry by category
 *
 * A skill entry in the dialog, for a box of the plan and the log alike: its module and its type, like `IN2028 VO`,
 * each picked from its list; in the log below them the chapters it covered, the document it used,
 * like the slides of a lecture or a sheet, and attempts at the tasks of my notes, all optional,
 * so a lecture logged from its box gets its chapters and document later.
 * The module picker shows the modules of the semester, and its search every module folder, since I sometimes attend
 * another module. A module picked offers its chapter folders, `No chapters yet` when it has none,
 * and its files outside them, each under the kind of material it is, like `VO_UniversityLectureLessons`,
 * searched by folder and name together.
 * The tasks of the chapters picked come below, the due ones first, then a result for each task picked:
 * Right, Wrong, Stuck with where I got stuck, or Skip with a reason, and after Right, Wrong or Stuck
 * one tap for my effort, low, medium or high. Any type may hold attempts, like the tasks I solved in a tutorial.
 * Modules and chapters show their names to read, like `IN2028 Business Analytics Machine Learning`
 * and `01 Regression Analysis`.
 * A skill entry of the log already logged shows its attempts, which stay; new ones are added after them,
 * and its module stays while it has attempts, since they are attempts at its tasks.
 * Saving sends a skill entry of the log to the reader's one writer of skill entries, with the times and the note
 * of the dialog; a skill box of the plan is a plain box, which the dialog writes itself.
 *
 * - `./choices.ts`: Pickers, in rows with their names.
 * - `../skill/attempts.ts`: Loads the tasks with when they are due and what a module offers, groups the tasks,
 *   writes days out, gives today as I live it and sends skill entries.
 * - `fullcalendar`: Calendar that shows the entries.
 */

import { choiceOf, choicesOf, groupedSearchOf, rowOf, searchOf } from "./choices.ts";
import { dayTextOf, groupsOf, moduleLoad, skillEntrySend, skillingLoad, todayOf } from "../skill/attempts.ts";

import type { Calendar } from "fullcalendar";
import type { Choice } from "./choices.ts";
import type { EntryFields } from "./entries.ts";
import type {
    AttemptNew, Effort, Group, ModuleContents, ModuleName, Result, SkillModule, SkillTask, Skilling,
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
 * - `module`: Code of the module, like `IN2028`, empty before it is picked.
 * - `type`: Its type, like `VO`, empty before it is picked.
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
 * Module and type of a skill entry, which boxes and the log both have.
 *
 * - `module`: Code of the module, like `IN2028`, empty before it is picked.
 * - `type`: Its type, like `VO`, empty before it is picked.
 */
export type ModuleType = {
    module: string;
    type: string;
};

/**
 * A skill entry as the dialog opens it, empty values for a new one.
 *
 * - `module`: Code of the module, like `IN2028`.
 * - `type`: Its type, like `VO`.
 * - `chapters`: Names to read of its chapters, in the log.
 * - `document`: Its `X-DOCUMENT` as the reader gave it, its path and fingerprint, in the log.
 * - `attempts`: Its `X-ATTEMPT`s as the reader gave them, in the log, like `IN2028/Airline Revenue Interval;right;low`.
 */
export type SkillValues = {
    module: string;
    type: string;
    chapters: string[];
    document: string;
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
let skilling: Skilling = { modules: [], allModules: [], skips: [], types: [], efforts: [] };

/**
 * What is picked so far.
 */
let picks: SkillPicks = { module: "", type: "", chapters: [], document: "", attempts: [] };

/**
 * Chapters and documents of the module picked, as the reader gave them, none before a module is picked.
 */
let contents: ModuleContents = { chapters: [], documents: [] };

/**
 * `X-ATTEMPT`s of the skill entry of the log being changed, which stay as they are, none for any other.
 */
let logged: string[] = [];

/**
 * Whether the dialog writes a box of the plan, which takes only module and type.
 */
let inPlan: boolean = false;


/**
 * Gives the path of a document from its `X-DOCUMENT`, the part before its last `;`, which holds its fingerprint.
 *
 * @param value - `X-DOCUMENT`, like `VO_UniversityLectureLessons/TUM_2025W/04_LogisticPoissonRegression.pdf;9f86d081…`
 * @returns Path, empty for an empty value
 */
function documentPathOf(value: string): string {
    return value.includes(";") ? value.slice(0, value.lastIndexOf(";")) : value;
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
 * Builds the search of the module picker: while nothing is typed the modules of the semester and the module picked,
 * while I type every module folder that holds the words, the modules of the semester first;
 * only the module picked while the entry has attempts, since they are attempts at its tasks.
 * - `choices`: Every module, each its code as value, its name to read as text.
 * - `shown`: Modules the search looks through.
 *
 * @returns Search for the picker
 */
function moduleSearchOf(): (text: string) => Promise<Choice[]> {
    const choices: Choice[] = skilling.allModules.map((module: ModuleName): Choice =>
        ({ value: module.code, text: module.title, group: "" }));
    return async (text: string): Promise<Choice[]> => {
        if (logged.length > 0)
            return choices.filter((choice: Choice): boolean => choice.value === picks.module);
        const shown: Choice[] = text.trim() !== "" ? choices : choices.filter((choice: Choice): boolean =>
            choice.value === picks.module || skilling.modules.some((module: SkillModule): boolean => module.code === choice.value));
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
    return groupsOf(tasks, todayOf()).flatMap((group: Group): Choice[] =>
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
 * - `parts`: An `X-ATTEMPT` cut at each `;`: task, result, effort, and where I got stuck or why I skipped.
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
        const effort: string = parts[2] ?? "";
        const item: HTMLLIElement = document.createElement("li");
        item.textContent = [parts[0].slice(parts[0].indexOf("/") + 1), parts[1], effort === "" ? "" : `${effort} effort`,
            parts.slice(3).join(";")].filter((part: string): boolean => part !== "").join(" · ");
        return item;
    }));
    return [rowOf("Logged", list)];
}

/**
 * Loads the chapters and documents of the module picked, none while no module is picked or in the plan,
 * and none for a module without folder, like a module code of the plan that has none, so its entry still opens;
 * what comes for a module picked before another one is dropped.
 * - `module`: Module picked when the loading starts.
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
 * Shows the fields of `Skill` as picked so far: module and type, and in the log the chapters of the module,
 * or `No chapters yet`, its documents, with a hint when the document of the entry is in the module no more,
 * which the reader could not find by its fingerprint either, the tasks of the chapters picked, a result for each task picked,
 * and the attempts the entry has. Picking a module loads its chapters and documents and shows the fields again,
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
        rowOf("Module", choicesOf({
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
    fields.replaceChildren(...rows, results, ...loggedOf());
}

/**
 * Shows the fields of `Skill` for a box of the plan or an entry of the log, as it has them, see {@link picksShow}.
 *
 * @param fields - Place of the fields in the dialog
 * @param plan - Whether it is a box of the plan, which takes only module and type
 * @param values - Values of the entry, empty for a new one
 * @param changed - Tells the dialog that what is picked changed, so it allows saving or not
 * @throws {Error} - When the reader cannot answer
 */
export async function skillFieldsShow(fields: HTMLElement, plan: boolean, values: SkillValues,
                                      changed: () => void): Promise<void> {

    skilling = await skillingLoad();
    inPlan = plan;
    logged = plan ? [] : values.attempts;
    picks = {
        module: values.module, type: values.type, chapters: values.chapters, document: documentPathOf(values.document),
        attempts: [],
    };
    await contentsLoad();
    picksShow(fields, changed);
}

/**
 * Reads the module and the type picked, of a box of the plan or an entry of the log.
 *
 * @returns Module and type, each empty while not picked
 */
export function skillModuleType(): ModuleType {
    return { module: picks.module, type: picks.type };
}

/**
 * Tells whether the skill entry can be saved: module and type picked, and a result for every task picked.
 *
 * @returns Whether it can be saved
 */
export function skillReady(): boolean {
    return picks.module !== "" && picks.type !== ""
        && picks.attempts.every((pick: AttemptPick): boolean => pick.result !== "");
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
        throw new Error("Pick module, type and the results of the tasks first");
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
