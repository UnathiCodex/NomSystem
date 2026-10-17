/**
 * ## Attempts
 *
 * Loads my tasks with when each is due from the reader, and what a module offers a skill entry,
 * orders the tasks into groups by when they are due, writes days out as the page shows them,
 * and sends to the reader's one writer of skill entries: an attempt from a button of a task into the skill entry
 * of the moment, my effort on it from the tap after it, and a whole skill entry from the entry by category.
 *
 * - `../day/entries.ts`: Names who I was with in a skill entry.
 */

import type { Attendee } from "../day/entries.ts";


/**
 * Result of an attempt: solved right, solved right with my tutor's help, solved wrong, stuck on the way,
 * or the task skipped.
 */
export type Result = "right" | "guided" | "wrong" | "stuck" | "skipped";

/**
 * My effort on an attempt, as one tap after it rates it.
 */
export type Effort = "low" | "medium" | "high";

/**
 * An attempt, as the reader sends it.
 *
 * - `day`: Day its skill entry started, like `2026-10-10`.
 * - `time`: Time of the tap, like `14:05`, empty for an attempt from the dialog.
 * - `part`: Part of a cold task it is about, like `2`, empty for the whole task.
 * - `result`: Its {@link Result}.
 * - `effort`: My {@link Effort} on it, empty before I rated it and for a skip.
 * - `stuck`: Where I got stuck, like `step 3`, empty when not given.
 * - `skip`: Why I skipped the task, like `too hard`, empty when not given.
 */
export type Attempt = {
    day: string;
    time: string;
    part: string;
    result: Result;
    effort: Effort | "";
    stuck: string;
    skip: string;
};

/**
 * A task as a chapter note holds it, as the reader sends it.
 *
 * - `id`: Identity, `<module>/<name>`, like `IN2028/Airline Revenue Interval`.
 * - `name`: Name in its heading, like `Airline Revenue Interval`.
 * - `heading`: Its heading as written, like `Task. Airline Revenue Interval`.
 * - `source`: Its source line without `> `, like `Original: [[…|exam 2024/25 endterm 1a]]`, empty without one.
 * - `note`: Path of its note, as the scripts view takes it.
 * - `chapter`: Name of its chapter, like `01_RegressionAnalysis`.
 * - `section`: Name of its section, its note, like `01_01_SampleMeanStandardError`.
 * - `cold`: Whether it is a cold task of its section, its heading ending with `(cold)`.
 * - `parts`: Numbers of the parts of a cold task, like `1`, `2` and `3`, none for any other task.
 */
export type Task = {
    id: string;
    name: string;
    heading: string;
    source: string;
    note: string;
    chapter: string;
    section: string;
    cold: boolean;
    parts: string[];
};

/**
 * A {@link Task} with when it is due, as the reader sends it, see `reader/skill.ts`.
 *
 * - `due`: Day it is due next, like `2026-10-12`; empty when nothing is due, like for a task never tried.
 * - `done`: For a task of the ladder, whether I solved it right once, or its section has a cold run.
 * - `level`: For a cold task, the runs of its section that count, 0 to 3.
 * - `open`: For a cold task, its parts still to sit in its run; none for a task without parts.
 * - `ready`: For a cold task, whether its section has its three runs.
 * - `skipped`: Whether its last attempt skipped it.
 * - `attempts`: All its attempts, the latest last.
 */
export type SkillTask = Task & {
    due: string;
    done: boolean;
    level: number;
    open: string[];
    ready: boolean;
    skipped: boolean;
    attempts: Attempt[];
};

/**
 * A section of a module, a note of a chapter, as the reader sends it.
 *
 * - `title`: Its name, like `01_01_SampleMeanStandardError`.
 * - `note`: Path of its note.
 * - `chapter`: Name of its chapter.
 * - `cold`: Identity of its cold task, empty when it has none yet.
 * - `tasks`: Number of its tasks.
 * - `tried`: Number of its tasks I tried.
 */
export type SkillSection = {
    title: string;
    note: string;
    chapter: string;
    cold: string;
    tasks: number;
    tried: number;
};

/**
 * The exam of a module, as the reader sends it.
 *
 * - `day`: Day of the exam, like `2027-02-25`.
 * - `estimated`: Whether the day is an estimate.
 */
export type ExamDate = {
    day: string;
    estimated: boolean;
};

/**
 * One entry of the plan of a module in the list of its type, as the reader sends it.
 *
 * - `day`: Its day, like `2026-10-06`, for a homework sheet the day of its deadline.
 * - `time`: Its time as ISO instant, for a homework sheet the time of its deadline, empty for none.
 * - `state`: Whether it is open, done, since a log entry relates to it, dropped, which I cancelled, or cancelled
 *   by the university.
 * - `number`: Its number in its series as stored, like `3`, `NONE` for one the university cancelled, empty for none.
 */
export type PlannedEntry = {
    day: string;
    time: string;
    state: "open" | "done" | "dropped" | "university";
    number: string;
};

/**
 * The entries of the plan of a module of one type, like all its lectures `VO`, as the reader sends them.
 *
 * - `type`: The type, like `VO`.
 * - `entries`: Its entries by date, the cancelled ones among them, so each keeps its number.
 */
export type PlannedType = {
    type: string;
    entries: PlannedEntry[];
};

/**
 * A module of the semester with its tasks, as the reader sends it.
 *
 * - `code`: Module code, like `IN2028`.
 * - `title`: Its name, like `IN2028_BusinessAnalyticsMachineLearning`.
 * - `exam`: Its exam.
 * - `tasks`: Its tasks in the order of the notes.
 * - `sections`: Its sections in the same order.
 * - `duplicates`: Tasks whose name an earlier task of the module has already.
 * - `removed`: Number of attempts on tasks no note holds any more.
 * - `planned`: Its entries of the plan by type, in the order of the types, a type without entries left out.
 * - `papers`: Its old exams, the newest first.
 */
export type SkillModule = {
    code: string;
    title: string;
    exam: ExamDate;
    tasks: SkillTask[];
    sections: SkillSection[];
    duplicates: Task[];
    removed: number;
    planned: PlannedType[];
    papers: Paper[];
};

/**
 * An old exam of a module, its files in the folder of its examinations, as the reader sends it.
 *
 * - `semester`: Folder of its semester, like `TUM_2024W`.
 * - `kind`: Its kind, like `Endterm`, `Retake` or `Mock`.
 * - `files`: Its files, each its name, like `Assignments` or `Solutions`, and its path in `NomSkillingmodules`.
 */
export type Paper = {
    semester: string;
    kind: string;
    files: { name: string; path: string }[];
};

/**
 * Everything the skill view shows, and the skill entries of the day pick from, as the reader sends it.
 *
 * - `modules`: Modules of the semester in their order, also those without tasks yet.
 * - `skills`: The skills of the semester in their order, for the Skill picker: a module by its code, like `IN2028`,
 *   a project by its folder name, like `WokFlow`.
 * - `otherModules`: The other module folders by their codes, like `IN0024`, for the search of the Skill picker.
 * - `labels`: The name of each of them as a summary names it, airy, which the Skill picker shows,
 *   like `IN2028 Business Analytics Machine Learning` for `IN2028`.
 * - `paths`: The folder of each of them from `NomWorkspace`, which a skill entry links, shown grey below the skill
 *   picked, like `NomSkillingmodules/IN2028_BusinessAnalyticsMachineLearning`.
 * - `skips`: Reasons to pick when skipping a task.
 * - `types`: Types of a skill entry, like `VO`.
 * - `efforts`: Efforts to rate an attempt with, the lowest first.
 * - `lost`: Links of skill entries the reader could not repair at its last check.
 */
export type Skilling = {
    modules: SkillModule[];
    skills: string[];
    otherModules: string[];
    labels: { [name: string]: string };
    paths: { [name: string]: string };
    skips: string[];
    types: string[];
    efforts: Effort[];
    lost: LinkLost[];
};

/**
 * A link of a skill entry to a file or a folder, its `ATTACH`, as the reader sends it, see `reader/documents.ts`.
 *
 * - `path`: Path from `NomWorkspace`, parted by `/`, like `NomSkillingmodules/IN2028_BusinessAnalyticsMachineLearning`.
 * - `fingerprint`: SHA-256 of a file, empty for a folder.
 */
export type Link = {
    path: string;
    fingerprint: string;
};

/**
 * A link of a skill entry the reader could not repair, as the skill view lists it.
 *
 * - `day`: Day its entry started, like `2026-10-13`.
 * - `skill`: What its entry was, like `IN2028 Business Analytics Machine Learning (VO)`.
 * - `path`: Path of the link from the folder of its skill, like `VO_UniversityLectureLessons/TUM_2025W/04_Old.pdf`,
 *   or from `NomWorkspace` when it lies outside it.
 */
export type LinkLost = {
    day: string;
    skill: string;
    path: string;
};

/**
 * What a skill offers a skill entry, as the reader sends it; a project offers nothing.
 *
 * - `folder`: The module folder from `NomWorkspace`, like `NomSkillingmodules/IN2028_BusinessAnalyticsMachineLearning`,
 *   empty for a project.
 * - `drafts`: The folder of its drafts from `NomWorkspace`, like
 *   `NomSystemdashboard/.claude/modules/drafts/IN2028_BusinessAnalyticsMachineLearning`, empty for a project.
 * - `chapters`: Names of its chapter folders, also of the empty ones, like `05 Decision Trees Ensembles`.
 * - `documents`: Its files outside the chapter folders, the university's material, and the notes of its chapters,
 *   by their paths from the module folder, like `VO_UniversityLectureLessons/TUM_2025W/04_….pdf`
 *   or `01_RegressionAnalysis/01_01_SampleMeanStandardError.md`; the notes of a chapter without notes there
 *   from its drafts, like `Drafts/01_RegressionAnalysis/01_01_EstimatorConfidenceInterval.md`.
 */
export type ModuleContents = {
    folder: string;
    drafts: string;
    chapters: string[];
    documents: string[];
};

/**
 * A new attempt to send, from a button of a task or as one of a skill entry.
 *
 * - `task`: Identity of the task.
 * - `part`: Part of a cold task, like `2`, empty for the whole task.
 * - `result`: Its {@link Result}.
 * - `effort`: My {@link Effort} on it, empty when not rated, always for a skip.
 * - `stuck`: Where I got stuck, only with `stuck`, empty when not given.
 * - `skip`: Why I skipped the task, only with `skipped`: a reason of {@link Skilling}, my own words, or both.
 */
export type AttemptNew = {
    task: string;
    part: string;
    result: Result;
    effort: Effort | "";
    stuck: string;
    skip: string;
};

/**
 * A new skill entry of the log to send from the entry by category; an empty field is not written.
 *
 * - `type`: Its type, like `VO`, empty for none.
 * - `module`: Name of its skill, a module code like `IN2028` or a project like `WokFlow`.
 * - `semester`: Its semester, like `2026W`: from which semester the lecture or the material is, see {@link semesterOf}.
 * - `chapters`: Names of the chapters it covered, none for none.
 * - `documents`: Paths from the folder of its skill of the documents it used, none for none; the reader links each
 *   with its fingerprint, see `reader/documents.ts`.
 * - `attempts`: Its attempts, none for none.
 * - `location`: Place, like the room of a lecture logged from the plan.
 * - `locationLink`: Link of the meeting of the place `Online`, as pasted, the `ALTREP` of its `LOCATION`;
 *   left out for any other place, whose link the reader finds itself.
 * - `attendees`: Who I was with, see `Attendee` in `../day/entries.ts`, none for nobody.
 * - `planned`: Identifier of the plan entry it is logged from, empty for none.
 * - `note`: Free note.
 * - `start`: Start of the entry.
 * - `end`: End of the entry, after the start.
 */
export type SkillEntryNew = {
    type: string;
    module: string;
    semester: string;
    chapters: string[];
    documents: string[];
    attempts: AttemptNew[];
    location: string;
    locationLink?: string;
    attendees: Attendee[];
    planned: string;
    note: string;
    start: Date;
    end: Date;
};

/**
 * Tasks that are due alike.
 *
 * - `name`: Name of the group, like `Due today`.
 * - `tasks`: Its tasks.
 */
export type Group = {
    name: string;
    tasks: SkillTask[];
};

/**
 * Category of skill entries in the entry by category.
 */
export const skillName: string = "Skill";


/**
 * Loads everything the skill view shows from the reader.
 *
 * @returns Modules with their tasks and the reasons to skip
 * @throws {Error} - When the reader cannot answer
 */
export async function skillingLoad(): Promise<Skilling> {
    const response: Response = await fetch("/api/skill/tasks");
    if (!response.ok)
        throw new Error(`Reader answered ${response.status}`);
    return await response.json() as Skilling;
}

/**
 * Loads what a skill offers a skill entry from the reader, its chapters and its documents, none for a project.
 *
 * @param code - Name of the skill, a module code like `IN2028` or a project like `WokFlow`
 * @returns Chapters and documents of the skill
 * @throws {Error} - When the reader cannot answer, like for a module without folder
 */
export async function moduleLoad(code: string): Promise<ModuleContents> {
    const response: Response = await fetch(`/api/skill/module?code=${encodeURIComponent(code)}`);
    if (!response.ok)
        throw new Error(`Reader answered ${response.status}`);
    return await response.json() as ModuleContents;
}

/**
 * Sends something to write to the reader, as JSON.
 *
 * @param method - HTTP method, `POST` for something new, `PATCH` for a change
 * @param address - Address at the reader, like `/api/skill/attempt`
 * @param body - What to write
 * @throws {Error} - When the reader does not take it
 */
async function readerSend(method: string, address: string, body: object): Promise<void> {
    const response: Response = await fetch(address, { method: method, body: JSON.stringify(body) });
    if (!response.ok)
        throw new Error(`Reader answered ${response.status}`);
}

/**
 * Sends a new attempt from a button of a task to the reader, which writes it into the skill entry of the moment.
 *
 * @param attempt - Attempt to write
 * @throws {Error} - When the reader does not take the attempt
 */
export async function attemptSend(attempt: AttemptNew): Promise<void> {
    await readerSend("POST", "/api/skill/attempt", attempt);
}

/**
 * Sends my effort on the last attempt at a task to the reader, from the tap after the attempt.
 *
 * @param task - Identity of the task, like `IN2028/Airline Revenue Interval`
 * @param effort - My effort
 * @throws {Error} - When the reader does not take the effort
 */
export async function effortSend(task: string, effort: Effort): Promise<void> {
    await readerSend("POST", "/api/skill/effort", { task: task, effort: effort });
}

/**
 * Sends a skill entry of the log to the reader, with ISO instants: a new one to write,
 * or with the identifier of an entry the changes of that entry, its attempts added after those it has.
 *
 * @param id - Identifier of the entry to change, empty for a new entry
 * @param entry - Skill entry, for a change with only the new attempts
 * @throws {Error} - When the reader does not take the entry
 */
export async function skillEntrySend(id: string, entry: SkillEntryNew): Promise<void> {
    const body: object = { ...entry, start: entry.start.toISOString(), end: entry.end.toISOString() };
    if (id === "")
        await readerSend("POST", "/api/skill/entry", body);
    else
        await readerSend("PATCH", "/api/skill/entry", { ...body, id: id });
}

/**
 * Writes the day of a date in local time, in the form of the days of the reader.
 *
 * @param date - Date on the day
 * @returns Day like `2026-10-10`
 */
export function dayOf(date: Date): string {
    const month: string = String(date.getMonth() + 1).padStart(2, "0");
    const day: string = String(date.getDate()).padStart(2, "0");
    return `${date.getFullYear()}-${month}-${day}`;
}

/**
 * Writes a day out as the page shows it, in my standard way with its year, and its short weekday in English before it
 * where that helps, like for the day a task is due, as the date of the day shows it.
 *
 * @param day - Day like `2026-10-17`
 * @param weekday - Whether to write the weekday
 * @returns Day like `17.10.2026`, or `Sat, 17.10.2026`
 */
export function dayTextOf(day: string, weekday: boolean): string {
    const [year, month, number]: number[] = day.split("-").map(Number);
    const text: string = day.split("-").reverse().join(".");
    if (!weekday)
        return text;
    const date: Date = new Date(year, month - 1, number);
    return `${date.toLocaleDateString("en-GB", { weekday: "short" })}, ${text}`;
}

/**
 * Gives the semester of a day, which the dialog fills in for a skill entry until I pick another, as the reader does,
 * see `semesterOf` in `reader/categories.ts`: October to March a winter, April to September a summer; January to March
 * belong to the winter that began the year before.
 * - `year`, `month`: Year and month of the day.
 *
 * @param day - Day like `2027-02-15`
 * @returns Semester like `2026W`, or `2027S` for `2027-05-04`
 */
export function semesterOf(day: string): string {
    const [year, month]: number[] = day.split("-").map(Number);
    if (month >= 10)
        return `${year}W`;
    if (month <= 3)
        return `${year - 1}W`;
    return `${year}S`;
}

/**
 * Orders tasks, like those of a module or of a chapter, into groups by when they are due, see `reader/skill.ts`:
 * due today, also those due earlier, the earliest first; new ones, never tried, in the order of the notes;
 * later ones by their day; done ones, the ladder behind me and the ready cold tasks; skipped ones last.
 * - `open`: Tasks not skipped.
 * - `fresh`: Whether a task was never tried, skips aside.
 * - `byDue`: Compares two tasks by their due day, the earliest first.
 *
 * @param tasks - Tasks in the order of the notes
 * @param today - Today like `2026-10-10`
 * @returns Groups `Due today`, `New`, `Later`, `Done` and `Skipped`, also empty ones
 */
export function groupsOf(tasks: SkillTask[], today: string): Group[] {
    const open: SkillTask[] = tasks.filter((task: SkillTask): boolean => !task.skipped);
    const fresh: (task: SkillTask) => boolean = (task: SkillTask): boolean =>
        task.attempts.every((attempt: Attempt): boolean => attempt.result === "skipped");
    const byDue: (first: SkillTask, second: SkillTask) => number = (first: SkillTask, second: SkillTask): number =>
        first.due.localeCompare(second.due);
    const dueToday: SkillTask[] = open.filter((task: SkillTask): boolean => task.due !== "" && task.due <= today);
    const later: SkillTask[] = open.filter((task: SkillTask): boolean => task.due > today);
    return [
        { name: "Due today", tasks: dueToday.sort(byDue) },
        { name: "New", tasks: open.filter((task: SkillTask): boolean => task.due === "" && fresh(task) && !task.done) },
        { name: "Later", tasks: later.sort(byDue) },
        { name: "Done", tasks: open.filter((task: SkillTask): boolean => task.due === "" && (task.done || !fresh(task))) },
        { name: "Skipped", tasks: tasks.filter((task: SkillTask): boolean => task.skipped) },
    ];
}
