/**
 * ## Skill
 *
 * Reads the tasks of my chapter notes and my attempts at them, tells when each task is due,
 * and writes the skill entries of the log: the one writer of their chapters, documents and attempts,
 * for the scripts view and the entry by category alike.
 * Only the modules of the semester have tasks, see `activeModules`; their chapters and tasks are read live
 * from the folders every time, so a changed chapter changes the views too, and no list of them is kept anywhere.
 * A task is a heading `## Task. <name>` in a note of a chapter folder like `01_RegressionAnalysis`,
 * in the drafts or in my modules, with its source on the line below, its mode word first,
 * like `> Original: [[…/Endterm_Assignments.pdf#page=4|exam 2024/25 endterm 1a]]` or `> Generated: …`.
 * A cold task of its section, the one I solve alone with a part per idea, ends its heading with `(cold)`,
 * like `## Task. Kiosk Chain Review (cold)`, which is no part of its name; its parts are its lines starting
 * with a letter and `)`, like `a) Sales $X_1,X_2,X_3$ of three days`, before its solution.
 *
 * A skill entry of the log is one block of learning of a type, as in the plan: a lecture or a tutorial I attended,
 * a homework sheet I worked on, or study, solving the tasks of my notes, of any module of `NomSkillingmodules`,
 * also one of another semester I attend: `CATEGORIES:Skill`, its `SUMMARY` the name of the folder of its module
 * with its type in round brackets, linking the folder as `ALTREP`, without `X-MODULE` and `X-TYPE`,
 * `SUMMARY;ALTREP="NomSkillingmodules/IN2028_…":IN2028 Business Analytics Machine Learning (VO)`,
 * see `documents.ts`; or a block of work on a project of the semester, see `activeSkills` in `sources.ts`,
 * which behaves like a module without chapters and tasks, named by its folder, like `SUMMARY:WokFlow`;
 * the type may stay empty for any skill, like my own learning. Below them, each only when there is one:
 * - one `ATTACH` per real document it used, like the slides of a lecture, the sheet of an exercise or the notes
 *   of a chapter, just its path with the fingerprint of its content, so the link survives a rename,
 *   see `documents.ts`; its `DESCRIPTION` is only my free note;
 * - its semester, `X-SEMESTER`, see `semesterFor` in `categories.ts`;
 * - one `X-CHAPTER` per chapter of my system it belongs to, of any type,
 *   like `X-CHAPTER:02_LogisticPoissonRegression`, several for a session over several chapters, like exam training,
 *   the chapters of the tasks of its attempts always among them; an older entry that links the folder of a chapter
 *   instead gets its `X-CHAPTER` once it changes, see `chaptersOf` in `documents.ts`;
 * - one `X-ATTEMPT` per attempt at a task of my notes, of any type, like the tasks I solved in a tutorial:
 *   the time of the tap in Berlin time when a button wrote it, in the form of the iCalendar format, like `140500`
 *   for 14:05, its task with the part of a cold task after `#`, its result, my effort, and where I got stuck or why
 *   I skipped, see {@link AttemptLine}, like `X-ATTEMPT:140500;IN2028/Kiosk Chain Review#b;stuck;high;step 2`,
 *   an older one with its time like `14:05`; an attempt from the dialog has no time,
 *   like `X-ATTEMPT:IN2028/Kiosk Sales Standard Error;right`;
 * - one `X-TUTOR` per task I copied for my tutor in it, like `X-TUTOR:IN2028/Kiosk Sales Standard Error`,
 *   so a right attempt at it after that is guided, see {@link tutorAdd}, and the copies per chapter show
 *   how often I needed help, which should fall from chapter to chapter.
 * One tap after an attempt rates my effort, low, medium or high; until then it is empty and left out at the end,
 * like `X-ATTEMPT:140500;IN2028/Airline Revenue Interval;right`, and a skip has none.
 * A button of a task writes into the skill entry of the moment: the last one of the task's module that started before now
 * and ended at most half an hour ago, like a tutorial logged from the plan; it grows to the end of the quarter hour
 * of the attempt, so the half hour of a pause counts from the attempt.
 * Without one, a new entry starts, covering the quarter hour of the attempt, in the steps of the day view: of the type
 * of the open skill box of the module for now, logged from it, so the attempts do the box, see `skillBoxOf`
 * in `boxes.ts`, else without type, my own learning, like `IN2028`.
 * The skill entry of the moment of any module is the session running now, whose timer the page shows
 * when it is of a type I pace myself, my own learning or homework, see {@link sessionRead}.
 * Due by my protocol, per section, a note like `01_01_SampleMeanStandardError.md`, whose cold task carries its runs
 * (decisions 73 to 76 in `.claude/life/decisions.md`): a task of the ladder is new until tried, done once right,
 * and due 2 days after a wrong, stuck or guided attempt, until its section has its first cold run, after which
 * the ladder leaves the due list, since guidance hurts once a type is known (Tetzlaff 2025).
 * The cold task is one run of its section: each of its parts gets its own result, and the run counts once every part
 * sits, right on or after the day it was due; a failed part comes back alone 2 days later, and the section steps back
 * one run instead of to none (Rawson 2018). After the first run the section is due 7 days later, after the second
 * 21 days later; after the third it is ready, and comes back about 14 days before its exam, with one keep-up check
 * halfway when the exam lies more than 6 weeks off, see {@link exams} (Cepeda 2008, Rohrer 2005).
 * A right attempt before its day counts as none, so the runs stay spaced; a guided one, right after I copied
 * the task for my tutor, counts as none either, and the task is due 2 days later, cold.
 * A skipped task leaves the due list until its next attempt.
 *
 * - `./boxes.ts`: Finds the skill box of a module for now, marks a box done once a skill entry is logged from it,
 *   and reads the skill boxes of the plan, for the lists of each module by type.
 * - `./calendar.ts`: Reads the log, appends entries to it, changes their events, and adds days to a day.
 * - `./categories.ts`: Names the category and the types of skill entries and writes what a skill entry was.
 * - `./day.ts`: Gives the log an entry belongs into, the log of its skill.
 * - `./documents.ts`: Builds the links of a skill entry, to the folder of its skill, to its documents
 *   with their fingerprints and to the folders of its chapters, and gives the links it could not repair.
 * - `./notes.ts`: Reads the modules of the semester with their chapters and notes, and every module folder.
 * - `./places.ts`: Gives the link of the place of a skill entry.
 * - `./sources.ts`: Names the log of the skill area and the skills of the semester, its modules and its projects.
 */

import { boxDone, boxOpenFind, skillBoxesRead, skillBoxOf } from "./boxes.ts";
import {
    berlinDateOf, berlinTimeOf, dayAdd, entriesRead, entryAppend, entryChange, entryFind,
    propertiesPut,
} from "./calendar.ts";
import { semesterFor, skillName, skillTypes } from "./categories.ts";
import { logFileOf } from "./day.ts";
import {
    chaptersOf, documentLinksOf, linksLostRead, linksOf, skillFolderOf, skillLabelOf, titleOf,
} from "./documents.ts";
import {
    codeOf, fileRead, moduleContentsRead, moduleFolderOf, moduleFoldersRead, modulesRead, papersRead,
} from "./notes.ts";
import { placeLinkOf } from "./places.ts";
import { activeModules, activeSkills, projectOf, skillLog, skillNameOf } from "./sources.ts";

import type { Box, BoxState } from "./boxes.ts";
import type { Entry, EntryFields, Link } from "./calendar.ts";
import type { LinkLost } from "./documents.ts";
import type { Chapter, ModuleContents, NoteEntry, NotesModule, Paper } from "./notes.ts";


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
 * A task as a chapter note holds it.
 * Its identity is its module and its name, not its note or chapter, so it keeps its history when it moves.
 * A task whose wording improves keeps its heading and with it its history; a task thrown away disappears,
 * and its attempts stay in the log, because they happened, but count nowhere.
 * Names are unique within a module; a renamed one takes its attempts along, see {@link taskRename}.
 *
 * - `id`: Identity, `<module>/<name>`, like `IN2028/Airline Revenue Interval`, the first part of its `X-ATTEMPT`s.
 * - `name`: Name in its heading, like `Airline Revenue Interval` of `## Task. Airline Revenue Interval`.
 * - `heading`: Its heading as written, like `Task. Airline Revenue Interval`, for a link to it.
 * - `source`: Its source line without `> `: its mode word, `Original` or `Generated`, and its sources as written,
 *   like `Original: [[…/Endterm_Assignments.pdf#page=4|exam 2024/25 endterm 1a]]`, empty without one.
 * - `note`: Path of its note, as the scripts view takes it, like
 *   `Drafts/IN2028_BusinessAnalyticsMachineLearning/01_RegressionAnalysis/01_01_EstimatorConfidenceInterval.md`.
 * - `chapter`: Name of its chapter, like `01_RegressionAnalysis`.
 * - `section`: Name of its section, its note, like `01_01_SampleMeanStandardError`.
 * - `cold`: Whether it is a cold task of its section, its heading ending with `(cold)`.
 * - `parts`: Letters of the parts of a cold task, like `a`, `b` and `c`, none for one without parts and any other task.
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
 * An attempt, as the views show it.
 *
 * - `day`: Day its skill entry started in Berlin time, like `2026-10-10`.
 * - `time`: Time of the tap in Berlin time, like `14:05`, empty for an attempt from the dialog.
 * - `part`: Part of a cold task it is about, like `b`, empty for the whole task.
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
 * A {@link Task} with when it is due, see the top of this file.
 *
 * - `due`: Day it is due next, like `2026-10-12`; empty when nothing is due: a task never tried, a task of the ladder
 *   done or behind its section's first cold run, and a ready cold task until its exam comes near.
 * - `done`: For a task of the ladder, whether I solved it right once, or its section has a cold run.
 * - `level`: For a cold task, the runs of its section that count, 0 to 3.
 * - `open`: For a cold task, its parts still to sit in its run, all of them when none sits yet;
 *   none for a task without parts.
 * - `ready`: For a cold task, whether its section has its three runs, spaced as the protocol says.
 * - `skipped`: Whether its last attempt skipped it, which takes it out of the due list.
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
 * A section of a module, a note of a chapter, with the state of its cold task, the unit of the ready number.
 *
 * - `title`: Its name, like `01_01_SampleMeanStandardError`.
 * - `note`: Path of its note, as the scripts view takes it.
 * - `chapter`: Name of its chapter, like `01_RegressionAnalysis`.
 * - `cold`: Identity of its cold task, empty when it has none yet.
 * - `tasks`: Number of its tasks, the cold one included.
 * - `tried`: Number of its tasks I tried, skips not counted.
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
 * The exam of a module: its day, and whether that day is only estimated, like from the exams of earlier years.
 *
 * - `day`: Day of the exam, like `2027-02-25`.
 * - `estimated`: Whether the day is an estimate, until the university names it.
 */
export type ExamDate = {
    day: string;
    estimated: boolean;
};

/**
 * One entry of the plan of a module in the list of its type, see {@link plannedOf}.
 *
 * - `day`: Its day, like `2026-10-06`, for a homework sheet the day of its deadline.
 * - `time`: Its time as ISO instant, for a homework sheet the time of its deadline, empty for none.
 * - `state`: Whether it is open, done, since a log entry relates to it, dropped, which I cancelled, or cancelled
 *   by the university; the page tells an open one whose day is over from one still to come.
 * - `number`: Its number in its series as stored, its `X-NUMBER`, like `3`, `NONE` for one the university cancelled,
 *   empty for none, like an entry not numbered yet.
 */
export type PlannedEntry = {
    day: string;
    time: string;
    state: BoxState;
    number: string;
};

/**
 * The entries of the plan of a module of one type, like all its lectures `VO`.
 *
 * - `type`: The type, like `VO`.
 * - `entries`: Its entries by date, the cancelled ones among them, so each keeps its number.
 */
export type PlannedType = {
    type: string;
    entries: PlannedEntry[];
};

/**
 * A module of the semester with its tasks.
 *
 * - `code`: Module code, like `IN2028`, the part of its folder name before `_`.
 * - `title`: Its name, like `IN2028_BusinessAnalyticsMachineLearning`.
 * - `exam`: Its exam, see {@link exams}.
 * - `tasks`: Its tasks, by chapters, notes and headings in order, each name once.
 * - `sections`: Its sections in the same order, each with its cold task.
 * - `duplicates`: Tasks whose name an earlier task of the module has already, left out of `tasks`.
 * - `removed`: Number of attempts on tasks no note holds any more.
 * - `planned`: Its entries of the plan by type, like all its lectures, see {@link plannedOf}.
 * - `papers`: Its old exams, see `papersRead` in `notes.ts`.
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
 * Everything the skill and scripts views show of my tasks, and the skill entries of the day pick from.
 *
 * - `modules`: Modules of the semester in the order of their list, also those without tasks yet.
 * - `skills`: The skills of the semester for the Skill picker, in their order, by their names, see {@link skillNameOf}:
 *   a module by its code, like `IN2028`, a project by its folder name, like `WokFlow`.
 * - `otherModules`: The other module folders by their codes, like `IN0024`, for the search of the Skill picker,
 *   which reaches every module.
 * - `labels`: The name of each of them as a summary names it, airy, by its name, which the Skill picker shows,
 *   like `IN2028 Business Analytics Machine Learning` for `IN2028`, or `WokFlow` for a project, see `skillLabelOf`
 *   in `documents.ts`.
 * - `paths`: The folder of each of them from `NomWorkspace` by its name, which a skill entry links as the `ALTREP`
 *   of its `SUMMARY` and the dialog shows grey below the skill picked, like
 *   `NomSkillingmodules/IN2028_BusinessAnalyticsMachineLearning`, see `skillFolderOf` in `documents.ts`.
 * - `skips`: Reasons to pick when skipping a task.
 * - `types`: Types of a skill entry, like `VO`.
 * - `efforts`: Efforts to rate an attempt with, the lowest first.
 * - `lost`: Links of skill entries the reader could not repair at its last check, see `documents.ts`.
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
 * A new attempt, as a button of a task sends it, and as each attempt of a skill entry of the dialog comes.
 *
 * - `task`: Identity of the task, see {@link Task}.
 * - `part`: Part of a cold task, like `b`, empty for the whole task.
 * - `result`: Its {@link Result}; a button sends `right`, which the reader writes as `guided` after a copy for my tutor.
 * - `effort`: My {@link Effort} on it, empty when not rated yet, always for a skip.
 * - `stuck`: Where I got stuck, only with `stuck`, empty when not given.
 * - `skip`: Why I skipped the task, only with `skipped`, like one of {@link skips} or my own words, empty when not given.
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
 * A new skill entry of the log, as the entry by category sends it; an empty field is not written.
 *
 * - `type`: Its type, one of the types of `categories.ts`, like `VO`, empty for none.
 * - `module`: Name of its skill: the code of any module folder, like `IN2028`, or a project of the semester,
 *   like `WokFlow`.
 * - `semester`: Its semester, `X-SEMESTER`, like `2026W`, the semester of its day when empty,
 *   see `semesterFor` in `categories.ts`.
 * - `chapters`: Names of the chapters of my system it belongs to, like `01_RegressionAnalysis`,
 *   none for none.
 * - `documents`: Paths from the folder of its skill of the documents it used, files of its module, like
 *   `VO_UniversityLectureLessons/TUM_2025W/04_LogisticPoissonRegression.pdf` or the notes of a chapter,
 *   empty for none.
 * - `attempts`: Its attempts, in the order they were picked, none for none.
 * - `location`: Place, `LOCATION`, like the room of a lecture logged from its box.
 * - `locationLink`: Link of the meeting of the place `Online`, as typed, written as the `ALTREP` of its `LOCATION`;
 *   left out for any other place, as for any entry of the log, see `EntryNew` in `day.ts`.
 * - `planned`: Identifier of the box it is logged from, written as its `RELATED-TO`, empty for none.
 * - `note`: Free note, `DESCRIPTION`.
 * - `start`: Start as ISO instant.
 * - `end`: End as ISO instant, after the start.
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
    planned: string;
    note: string;
    start: string;
    end: string;
};

/**
 * A changed skill entry of the log, as the entry by category sends it: a {@link SkillEntryNew}
 * with the identifier `id` of the entry, whose `attempts` are only the new ones, added after those it has;
 * its box stays as it is, and its place keeps its link while it stays the same place.
 */
export type SkillEntryChange = SkillEntryNew & { id: string };

/**
 * My effort on the last attempt at a task, as the tap after the attempt sends it.
 *
 * - `task`: Identity of the task, see {@link Task}.
 * - `effort`: My {@link Effort}.
 */
export type EffortNew = {
    task: string;
    effort: Effort;
};

/**
 * A session of mine running now, as the timer of the day shows it, see {@link sessionRead}.
 *
 * - `module`: Name of its skill, like `IN2028` or `WokFlow`.
 * - `type`: Its type, `HU`, empty for none, like my own learning or a project.
 * - `title`: What its skill entry is, as written, like `IN2028 Business Analytics Machine Learning (HU)`.
 * - `start`, `end`: Start and end of its skill entry, as ISO instants; the timer counts down to its end.
 */
export type Session = {
    module: string;
    type: string;
    title: string;
    start: string;
    end: string;
};

/**
 * A module of the semester with the tasks of its chapter notes.
 *
 * - `code`: Module code, like `IN2028`.
 * - `title`: Its name, like `IN2028_BusinessAnalyticsMachineLearning`.
 * - `tasks`: Its tasks, by chapters, notes and headings in order.
 */
type ModuleTasks = {
    code: string;
    title: string;
    tasks: Task[];
};

/**
 * An attempt as the log holds it.
 *
 * - `task`: Identity of its task.
 * - `attempt`: The attempt, as the views show it.
 */
type LoggedAttempt = {
    task: string;
    attempt: Attempt;
};

/**
 * The parts of an `X-ATTEMPT`, see the top of this file and {@link attemptLineOf}.
 *
 * - `time`: Time of the tap, like `14:05`, written like `140500`, empty for none.
 * - `task`: Identity of the task, like `IN2028/Kiosk Chain Review`.
 * - `part`: Part of a cold task, like `b`, empty for the whole task.
 * - `result`: The result as written, like `stuck`.
 * - `effort`: My effort as written, empty for none.
 * - `detail`: Where I got stuck or why I skipped, empty for none.
 */
type AttemptLine = {
    time: string;
    task: string;
    part: string;
    result: string;
    effort: string;
    detail: string;
};

/**
 * Results an attempt can have.
 */
const results: Result[] = ["right", "guided", "wrong", "stuck", "skipped"];

/**
 * Efforts to rate an attempt with, the lowest first.
 */
const efforts: Effort[] = ["low", "medium", "high"];

/**
 * Reasons to pick when skipping a task: signals for the AI, which fixes or throws away the skipped tasks in batches.
 */
const skips: string[] = ["too hard", "too easy", "bad wording", "wrong", "not exam-relevant"];

/**
 * Days until a task is due again after a wrong or stuck attempt.
 */
const retryDays: number = 2;

/**
 * Days until a section is due again after its first and its second run;
 * after the third, one more than there are gaps, it is ready and due before its exam, see {@link examDueOf}.
 */
const spacingDays: number[] = [7, 21];

/**
 * Days before its exam a ready section comes back once more, cold.
 */
const examDays: number = 14;

/**
 * Days between a ready section and its exam beyond which one keep-up check lies halfway between, about 6 weeks,
 * since without one 70 % fell to 24 % in 9 weeks (Rohrer 2005).
 */
const keepUpDays: number = 42;

/**
 * Estimated exams of the modules of the semester whose exam the university has not named yet, by their codes;
 * a named exam stands in the plan of its module as a box of the type `FA`, which wins, see {@link examOf},
 * like WI1057 on 18.02.2027 at 17:00; a module neither planned nor listed is estimated at {@link examDefault}.
 * IN2028 is estimated from its endterms of the last years, all on the last Thursday or so of February:
 * 28.02.2022, 29.02.2024, 27.02.2025; IN0004 from its last two, each on the second Friday of February:
 * 14.02.2025, 13.02.2026.
 */
export const exams: { [code: string]: ExamDate } = {
    IN2028: { day: "2027-02-25", estimated: true },
    IN0004: { day: "2027-02-12", estimated: true },
};

/**
 * Exam of a module whose exam is not listed: the first Monday of the exam period after the lectures of 2026W,
 * the earliest it could be, so the last runs come in time.
 */
const examDefault: ExamDate = { day: "2027-02-15", estimated: true };

/**
 * Days after today up to which the lists of the plan of each module reach, see {@link plannedOf}: a year,
 * so a series without end stops.
 */
const plannedDays: number = 366;

/**
 * Part of a cold task, a line starting with its letter and `)`, like `b) Campus kiosk, seven days in July`.
 */
const partLine: RegExp = /^([a-z])\)\s/;

/**
 * Time of the tap at the start of an `X-ATTEMPT` in the form of the iCalendar format, hours, minutes and seconds,
 * like `140500` for 14:05, or of an older one like `14:05`; its hours and its minutes.
 */
const tapTime: RegExp = /^(\d{2}):?(\d{2})(?:\d{2})?$/;

/**
 * A quarter hour in milliseconds, the step of the day view.
 */
const quarterHour: number = 15 * 60 * 1000;

/**
 * Longest pause after a skill entry in which a button still writes into it, half an hour in milliseconds.
 */
const sessionPause: number = 30 * 60 * 1000;


/**
 * Heading of a task, `## Task. <name>`, or `## Task. <name> (cold)` for a cold task:
 * the heading as written, the name, and `(cold)` when it is there.
 */
const taskHeading: RegExp = /^## (Task\.[ \t]+(.+?)(?:[ \t]+(\(cold\)))?)[ \t]*$/;

/**
 * Source line of a task, `> Original: …` or `> Generated: …`, with its mode word and sources.
 */
const sourceLine: RegExp = /^>[ \t]*((?:Original|Generated):.*?)[ \t]*$/;


/**
 * Gives the name of a section from the path of its note, the name of the note as it is, without `.md`,
 * like `01_01_SampleMeanStandardError` of `…/01_01_SampleMeanStandardError.md`.
 *
 * @param note - Path of the note
 * @returns Name
 */
function sectionTitleOf(note: string): string {
    return (note.split("/").at(-1) ?? note).replace(/\.md$/, "");
}

/**
 * Reads the parts of a cold task: the letters of its lines that start with a letter and `)`, see {@link partLine},
 * from below its heading to the next heading, which is its solution or the next block, each letter once.
 * - `body`: Lines below the heading, up to the next heading.
 *
 * @param lines - Lines of the note
 * @param index - Line of the heading of the task
 * @returns Letters in their order, like `a`, `b` and `c`; none for a task without parts
 */
function partsOf(lines: string[], index: number): string[] {
    const end: number = lines.findIndex((line: string, at: number): boolean => at > index && line.startsWith("#"));
    const body: string[] = lines.slice(index + 1, end === -1 ? lines.length : end);
    return [...new Set(body.flatMap((line: string): string[] => partLine.exec(line)?.slice(1, 2) ?? []))];
}

/**
 * Reads the tasks of a note in their order: each heading `## Task. <name>` with the source line below it,
 * and for a cold task its parts.
 * - `lines`: Lines of the note.
 * - `section`: Name of the note's section.
 *
 * @param code - Module code of the note
 * @param chapter - Name of the chapter of the note
 * @param note - Path of the note, as the scripts view takes it
 * @returns Tasks of the note
 * @throws {Error} - When the note cannot be read
 */
function noteTasksRead(code: string, chapter: string, note: string): Task[] {
    const lines: string[] = fileRead(note).content.toString("utf8").split(/\r?\n/);
    const section: string = sectionTitleOf(note);
    return lines.flatMap((line: string, index: number): Task[] => {
        const heading: RegExpExecArray | null = taskHeading.exec(line);
        if (heading === null)
            return [];
        return [{
            id: `${code}/${heading[2]}`,
            name: heading[2],
            heading: heading[1],
            source: sourceLine.exec(lines[index + 1] ?? "")?.[1] ?? "",
            note: note,
            chapter: chapter,
            section: section,
            cold: heading[3] !== undefined,
            parts: heading[3] === undefined ? [] : partsOf(lines, index),
        }];
    });
}

/**
 * Reads the modules of the semester with their tasks, live from the folders: every chapter of the module and its drafts,
 * every note in the chapter, every task in the note, in the order of the menu of the scripts view.
 *
 * @returns Modules, also those without tasks
 * @throws {Error} - When a folder or note cannot be read
 */
function moduleTasksRead(): ModuleTasks[] {
    return modulesRead().map((module: NotesModule): ModuleTasks => ({
        code: codeOf(module.name),
        title: module.title,
        tasks: module.chapters.flatMap((chapter: Chapter): Task[] => chapter.notes.flatMap((note: NoteEntry): Task[] =>
            noteTasksRead(codeOf(module.name), chapter.title, note.path))),
    }));
}

/**
 * Reads every task of the modules of the semester.
 *
 * @returns Tasks in order
 * @throws {Error} - When a folder or note cannot be read
 */
function tasksRead(): Task[] {
    return moduleTasksRead().flatMap((module: ModuleTasks): Task[] => module.tasks);
}

/**
 * Reads the skill entries of the log that overlap a range, in the order of their starts.
 *
 * @param start - Start of the range as ISO instant
 * @param end - End of the range, excluded, as ISO instant
 * @returns Log entries `Skill`
 */
function skillEntriesRead(start: string, end: string): Entry[] {
    return entriesRead(skillLog, start, end)
        .filter((entry: Entry): boolean => entry.category === skillName)
        .sort((first: Entry, second: Entry): number => first.start.localeCompare(second.start));
}

/**
 * Cuts an `X-ATTEMPT` into its parts: the time of the tap first, when it has one, then the task with its part
 * after `#`, the result, my effort, and the rest where I got stuck or why I skipped, put together again,
 * since it may hold a `;`; a value without time, like one of the dialog, starts with its task.
 * - `fields`: The value cut at each `;`, without the time.
 * - `tap`: Hours and minutes of the time, `null` for none.
 * - `time`: The time, like `14:05`, empty for none.
 * - `task`, `part`: The task and its part, the part `undefined` for none.
 *
 * @param value - `X-ATTEMPT`, like `140500;IN2028/Kiosk Chain Review#b;stuck;high;step 2`,
 *   or `14:05;…` of an older one
 * @returns Its parts
 */
function attemptLineOf(value: string): AttemptLine {
    const fields: string[] = value.split(";");
    const tap: RegExpExecArray | null = tapTime.exec(fields[0]);
    const time: string = tap === null ? "" : `${tap[1]}:${tap[2]}`;
    if (time !== "")
        fields.shift();
    const [task, part]: (string | undefined)[] = (fields[0] ?? "").split("#");
    return {
        time: time, task: task ?? "", part: part ?? "", result: fields[1] ?? "", effort: fields[2] ?? "",
        detail: fields.slice(3).join(";"),
    };
}

/**
 * Writes the parts of an `X-ATTEMPT` back into one value, see {@link attemptLineOf}: its time in the form
 * of the iCalendar format, like `140500` for 14:05, also the time of an older one written like `14:05`,
 * leaving out the time when there is none and the empty parts at the end, like an effort not rated yet.
 * - `fields`: Task with its part, result, effort and detail.
 * - `end`: Number of them written, at least task and result.
 *
 * @param line - Parts of the attempt
 * @returns Value like `140500;IN2028/Kiosk Chain Review#b;stuck;;step 2` or `IN2028/Airline Revenue Interval;right`
 */
function lineValueOf(line: AttemptLine): string {
    const fields: string[] = [line.part === "" ? line.task : `${line.task}#${line.part}`, line.result, line.effort, line.detail];
    let end: number = fields.length;
    while (end > 2 && fields[end - 1] === "")
        end--;
    const kept: string[] = fields.slice(0, end);
    if (line.time !== "")
        kept.unshift(`${line.time.replace(":", "")}00`);
    return kept.join(";");
}

/**
 * Reads an attempt from its `X-ATTEMPT`, see {@link attemptLineOf}.
 * - `line`: Its parts.
 * - `result`: Result of the attempt.
 *
 * @param value - `X-ATTEMPT`, like `140500;IN2028/Kiosk Sales Standard Error;stuck;high;step 2`
 * @param day - Day its skill entry started in Berlin time
 * @returns The attempt with its task
 */
function attemptOf(value: string, day: string): LoggedAttempt {
    const line: AttemptLine = attemptLineOf(value);
    const result: Result = line.result as Result;
    return {
        task: line.task,
        attempt: {
            day: day, time: line.time, part: line.part, result: result, effort: line.effort as Effort | "",
            stuck: result === "stuck" ? line.detail : "", skip: result === "skipped" ? line.detail : "",
        },
    };
}

/**
 * Reads the attempts of a skill entry from its `X-ATTEMPT`s, see {@link attemptOf}.
 * - `day`: Day the entry started in Berlin time, the day of each of its attempts.
 *
 * @param entry - Log entry `Skill`
 * @returns Its attempts in order
 */
function loggedAttemptsOf(entry: Entry): LoggedAttempt[] {
    const day: string = berlinDateOf(new Date(entry.start));
    return entry.attempts.map((value: string): LoggedAttempt => attemptOf(value, day));
}

/**
 * Reads my attempts: those of the skill entries of the log up to now, in the order of their entries and within each.
 *
 * @returns Attempts with their tasks
 */
function attemptsRead(): LoggedAttempt[] {
    return skillEntriesRead("1970-01-01T00:00:00Z", new Date().toISOString()).flatMap(loggedAttemptsOf);
}

/**
 * Gives whole days from one day to another.
 *
 * @param from - Day like `2026-10-12`
 * @param to - Day like `2026-10-19`
 * @returns Days, like 7, below 0 when `to` lies before `from`
 */
function daysBetween(from: string, to: string): number {
    return Math.round((Date.parse(`${to}T12:00:00Z`) - Date.parse(`${from}T12:00:00Z`)) / (24 * 60 * 60 * 1000));
}

/**
 * Tells when a section is due after a run on a day, see the top of this file: after the first 7 days later,
 * after the second 21 days later; once ready, {@link examDays} before its exam, with a keep-up check halfway
 * while the exam lies more than {@link keepUpDays} off, and nothing once that last check before the exam is done.
 * - `check`: Day of the last check, before the exam.
 *
 * @param level - Runs that count, the new one included
 * @param day - Day of the run, like `2026-10-12`
 * @param exam - Exam of the module
 * @returns Day it is due next, empty for none
 */
function dueAfter(level: number, day: string, exam: ExamDate): string {
    if (level <= spacingDays.length)
        return dayAdd(day, spacingDays[level - 1]);
    const check: string = dayAdd(exam.day, -examDays);
    if (day >= check)
        return "";
    return daysBetween(day, exam.day) > keepUpDays ? dayAdd(day, Math.floor(daysBetween(day, check) / 2)) : check;
}

/**
 * Tells when a task of the ladder is due, see the top of this file: by its last attempt that is no skip,
 * done when that was right, due 2 days later when it was wrong, stuck or guided; done too, and never due,
 * once its section has a cold run.
 * - `last`: Its last attempt that is no skip.
 * - `done`: Whether it is done.
 *
 * @param task - Task of the ladder
 * @param attempts - Its attempts, in order
 * @param run - Whether its section has a cold run
 * @returns Task with when it is due
 */
function ladderScheduleOf(task: Task, attempts: Attempt[], run: boolean): SkillTask {
    const last: Attempt | undefined = attempts.findLast((attempt: Attempt): boolean => attempt.result !== "skipped");
    const done: boolean = run || last?.result === "right";
    return {
        ...task, due: done || last === undefined ? "" : dayAdd(last.day, retryDays), done: done, level: 0, open: [],
        ready: false, skipped: attempts.at(-1)?.result === "skipped", attempts: attempts,
    };
}

/**
 * Tells when a cold task is due by walking its attempts in order, see the top of this file: each part still open
 * in the run has its own day; a right attempt on or after that day sits the part, the whole task every part,
 * and the run counts once every part sits; a wrong, stuck or guided attempt opens its parts again, due 2 days later,
 * and steps the section back one run, once per run.
 * - `all`: Its parts, one empty part for a task without parts.
 * - `level`: Runs that count so far.
 * - `runs`: Runs ever done, also those a failure stepped back.
 * - `dues`: Parts still open in the run, each with the day it is due, empty for none.
 * - `begun`: Day of the first attempt of the run, empty before it; a part without a day of its own is due from it on.
 * - `failed`: Whether the run has stepped back already.
 * - `skipped`: Whether the attempts so far end with a skip.
 * - `parts`: Parts an attempt is about.
 * - `next`: Day the section is due after a run.
 * - `due`: The earliest day of the open parts, empty when none has one.
 *
 * @param task - Cold task
 * @param attempts - Its attempts, in order
 * @param exam - Exam of its module
 * @returns Task with when it is due, and whether its section ever had a run
 */
function coldScheduleOf(task: Task, attempts: Attempt[], exam: ExamDate): [SkillTask, boolean] {
    const all: string[] = task.parts.length === 0 ? [""] : task.parts;
    let level: number = 0;
    let runs: number = 0;
    let dues: Map<string, string> = new Map(all.map((part: string): [string, string] => [part, ""]));
    let begun: string = "";
    let failed: boolean = false;
    let skipped: boolean = false;
    attempts.forEach((attempt: Attempt): void => {
        skipped = attempt.result === "skipped";
        if (skipped)
            return;
        if (begun === "")
            begun = attempt.day;
        const parts: string[] = attempt.part === "" || !all.includes(attempt.part) ? all : [attempt.part];
        if (attempt.result !== "right") {
            parts.forEach((part: string): void => {
                dues.set(part, dayAdd(attempt.day, retryDays));
            });
            if (!failed)
                level = Math.max(0, level - 1);
            failed = true;
            return;
        }
        parts.filter((part: string): boolean => dues.has(part) && attempt.day >= (dues.get(part) ?? ""))
            .forEach((part: string): void => {
                dues.delete(part);
            });
        if (dues.size > 0)
            return;
        level = Math.min(level + 1, spacingDays.length + 1);
        runs++;
        const next: string = dueAfter(level, attempt.day, exam);
        dues = new Map(all.map((part: string): [string, string] => [part, next]));
        begun = "";
        failed = false;
    });
    const due: string = [...dues.values()].map((day: string): string => day === "" ? begun : day)
        .filter((day: string): boolean => day !== "").sort()[0] ?? "";
    return [{
        ...task, due: due, done: false, level: level, open: task.parts.length === 0 ? [] : [...dues.keys()],
        ready: level > spacingDays.length, skipped: skipped, attempts: attempts,
    }, runs > 0];
}

/**
 * Builds the sections of a module from its tasks, in their order: one per note, with its cold task, the first one
 * when a note has more, and how many of its tasks I tried.
 * - `notes`: Tasks by their notes, in order.
 *
 * @param tasks - Tasks of the module with when each is due
 * @returns Sections
 */
function sectionsOf(tasks: SkillTask[]): SkillSection[] {
    const notes: Map<string, SkillTask[]> = Map.groupBy(tasks, (task: SkillTask): string => task.note);
    return [...notes.values()].map((own: SkillTask[]): SkillSection => ({
        title: own[0].section,
        note: own[0].note,
        chapter: own[0].chapter,
        cold: own.find((task: SkillTask): boolean => task.cold)?.id ?? "",
        tasks: own.length,
        tried: own.filter((task: SkillTask): boolean =>
            task.attempts.some((attempt: Attempt): boolean => attempt.result !== "skipped")).length,
    }));
}

/**
 * Gives the time of an entry of the plan in the list of its type, see {@link PlannedEntry}: its expected time,
 * else the time of its deadline, like that of a homework sheet.
 *
 * @param box - Skill box of the plan
 * @returns ISO instant, empty for a box without time and without a deadline with time
 */
function plannedTimeOf(box: Box): string {
    if (box.time !== "")
        return box.time;
    return box.deadline === "" || /^\d{4}-\d{2}-\d{2}$/.test(box.deadline) ? "" : box.deadline;
}

/**
 * Lists the entries of the plan of a module by type, in the order of the types, like all its lectures `VO`:
 * each list by date, with its stored number, the cancelled entries among them; a type without entries
 * is left out, and so are my own learning, which has no type, and an older type no longer offered, like `DEV`.
 * - `own`: The boxes of the module.
 *
 * @param module - Module code, like `IN2028`
 * @param boxes - Skill boxes of the plan, see `skillBoxesRead` in `boxes.ts`
 * @returns The lists, one per type
 */
function plannedOf(module: string, boxes: Box[]): PlannedType[] {
    const own: Box[] = boxes.filter((box: Box): boolean => box.module === module);
    return skillTypes
        .map((type: string): PlannedType => ({
            type: type,
            entries: own
                .filter((box: Box): boolean => box.type === type)
                .map((box: Box): PlannedEntry =>
                    ({ day: box.day, time: plannedTimeOf(box), state: box.state, number: box.number }))
                .sort((first: PlannedEntry, second: PlannedEntry): number =>
                    first.day.localeCompare(second.day) || first.time.localeCompare(second.time)),
        }))
        .filter((planned: PlannedType): boolean => planned.entries.length > 0);
}

/**
 * Gives the exam of a module: the first box of the type `FA` of its plan from today on, its day as the university
 * named it, else its estimate, see {@link exams}, else {@link examDefault}.
 * - `today`: Today in Berlin time.
 * - `planned`: The first exam of its plan from today on, `undefined` for none.
 *
 * @param module - Code of the module, like `WI1057`
 * @param boxes - Skill boxes of the plan, see `skillBoxesRead` in `boxes.ts`
 * @returns Its exam
 */
function examOf(module: string, boxes: Box[]): ExamDate {
    const today: string = berlinDateOf(new Date());
    const planned: Box | undefined = boxes
        .filter((box: Box): boolean => box.module === module && box.type === "FA" && box.day >= today)
        .sort((first: Box, second: Box): number => first.day.localeCompare(second.day))[0];
    return planned !== undefined ? { day: planned.day, estimated: false } : exams[module] ?? examDefault;
}

/**
 * Reads everything the skill and scripts views show: per module of the semester its exam, its tasks with when each
 * is due, see the top of this file, its sections, the tasks whose name the module has already, and the number
 * of attempts on tasks no note holds any more; a module without chapter notes yet has no tasks.
 * Attempts on other modules count nowhere.
 * Also the entries of the plan of each module by type, see {@link plannedOf}, the skills of the semester and every
 * other module folder, the reasons to skip, the types of a skill entry and the efforts, for the pickers,
 * and the links the reader could not repair, see `documents.ts`.
 * - `attempts`: My attempts, in order.
 * - `boxes`: Skill boxes of the plan up to {@link plannedDays} days after today.
 * - `byTask`: The same attempts by the identity of their task.
 * - `unique`: Tasks of a module, each name once.
 * - `duplicates`: Tasks of a module whose name an earlier task has.
 * - `exam`: Exam of a module, see {@link examOf}.
 * - `attemptsOf`: Attempts at a task.
 * - `colds`: Cold tasks of a module with when each is due and whether its section had a run, by their notes,
 *   the first of a note.
 * - `tasks`: Tasks of a module with when each is due.
 *
 * @returns {@link Skilling}
 * @throws {Error} - When a folder or note cannot be read
 */
export function skillingRead(): Skilling {
    const attempts: LoggedAttempt[] = attemptsRead();
    const byTask: Map<string, LoggedAttempt[]> = Map.groupBy(attempts, (logged: LoggedAttempt): string => logged.task);
    const boxes: Box[] = skillBoxesRead(dayAdd(berlinDateOf(new Date()), plannedDays));
    const modules: SkillModule[] = moduleTasksRead().map((module: ModuleTasks): SkillModule => {
        const unique: Task[] = [];
        const duplicates: Task[] = [];
        module.tasks.forEach((task: Task): void => {
            if (unique.some((known: Task): boolean => known.id === task.id))
                duplicates.push(task);
            else
                unique.push(task);
        });
        const exam: ExamDate = examOf(module.code, boxes);
        const attemptsOf: (task: Task) => Attempt[] = (task: Task): Attempt[] =>
            (byTask.get(task.id) ?? []).map((logged: LoggedAttempt): Attempt => logged.attempt);
        const colds: Map<string, [SkillTask, boolean]> = new Map(unique
            .filter((task: Task): boolean => task.cold)
            .toReversed()
            .map((task: Task): [string, [SkillTask, boolean]] => [task.note, coldScheduleOf(task, attemptsOf(task), exam)]));
        const tasks: SkillTask[] = unique.map((task: Task): SkillTask => task.cold
            ? coldScheduleOf(task, attemptsOf(task), exam)[0]
            : ladderScheduleOf(task, attemptsOf(task), colds.get(task.note)?.[1] ?? false));
        const removed: number = attempts.filter((logged: LoggedAttempt): boolean => logged.task.split("/")[0] === module.code
            && !tasks.some((task: SkillTask): boolean => task.id === logged.task)).length;
        return {
            code: module.code, title: module.title, exam: exam, tasks: tasks, sections: sectionsOf(tasks),
            duplicates: duplicates, removed: removed, planned: plannedOf(module.code, boxes),
            papers: papersRead(module.title),
        };
    });

    const skills: string[] = activeSkills.map(skillNameOf);
    const others: string[] =
        moduleFoldersRead().filter((name: string): boolean => !activeModules.includes(name)).map(codeOf);
    return {
        modules: modules, skills: skills, otherModules: others,
        labels: Object.fromEntries([...skills, ...others].map((name: string): [string, string] =>
            [name, skillLabelOf(name)])),
        paths: Object.fromEntries([...skills, ...others].map((name: string): [string, string] =>
            [name, skillFolderOf(name) ?? ""])),
        skips: skips, types: skillTypes, efforts: efforts, lost: linksLostRead(),
    };
}

/**
 * Finds the folder of a module by its code: in `NomSkillingmodules`, else among the modules of the semester,
 * whose folder may be missing yet and then counts as empty, see `notes.ts`.
 *
 * @param code - Module code, like `IN2028`
 * @returns Name of its folder, like `IN2028_BusinessAnalyticsMachineLearning`
 * @throws {Error} - When no module folder and no module of the semester has the code
 */
function folderOf(code: string): string {
    const folder: string | undefined = moduleFolderOf(code)
        ?? activeModules.find((name: string): boolean => codeOf(name) === code);
    if (folder === undefined)
        throw new Error(`No module ${code}`);
    return folder;
}

/**
 * Reads what the dialog of a skill entry offers for a skill: for a module, any module folder, its chapters
 * and its documents, see `notes.ts`, none for a module of the semester whose folder is missing;
 * for a project of the semester none, since it behaves like a module without chapters and tasks.
 *
 * @param code - Name of the skill, a module code like `IN2028` or a project like `WokFlow`
 * @returns Chapters and documents of the skill
 * @throws {Error} - When no module folder, no module of the semester and no project has the name
 */
export function moduleRead(code: string): ModuleContents {
    if (projectOf(code) !== undefined)
        return { folder: "", drafts: "", chapters: [], documents: [] };
    return moduleContentsRead(folderOf(code));
}

/**
 * Writes an attempt as its `X-ATTEMPT`, after checking it: the time of the tap, its task with its part,
 * its result, my effort, and where I got stuck or why I skipped, in one line without line breaks,
 * see {@link lineValueOf}.
 * - `task`: Task of the attempt, as its note holds it now.
 * - `detail`: Where I got stuck or why I skipped.
 *
 * @param attempt - New attempt
 * @param tasks - Tasks of the modules of the semester
 * @param time - Time of the tap in Berlin time, like `14:05`, empty for an attempt from the dialog
 * @returns Value like `140500;IN2028/Kiosk Chain Review#b;stuck;high;step 2`
 * @throws {Error} - When no note holds the task, the part is none of the task's, the result or effort is unknown,
 *   a skip comes with an effort, or a reason to skip or where I got stuck comes with another result
 */
function attemptValueOf(attempt: AttemptNew, tasks: Task[], time: string): string {
    const task: Task | undefined = tasks.find((candidate: Task): boolean => candidate.id === attempt.task);
    if (task === undefined)
        throw new Error(`No task ${attempt.task}`);
    if (attempt.part !== "" && !task.parts.includes(attempt.part))
        throw new Error(`No part ${attempt.part} of ${attempt.task}`);
    if (!results.includes(attempt.result))
        throw new Error(`No result ${attempt.result}`);
    if (attempt.effort !== "" && (!efforts.includes(attempt.effort) || attempt.result === "skipped"))
        throw new Error(`No effort ${attempt.effort} with ${attempt.result}`);
    if ((attempt.stuck !== "" && attempt.result !== "stuck") || (attempt.skip !== "" && attempt.result !== "skipped"))
        throw new Error(`No detail with ${attempt.result}`);

    const detail: string = `${attempt.stuck}${attempt.skip}`.replace(/\s+/g, " ").trim();
    return lineValueOf({
        time: time, task: task.id, part: attempt.part, result: attempt.result, effort: attempt.effort, detail: detail,
    });
}

/**
 * Lists the chapters of a skill entry: those picked, then the chapters of the tasks of its attempts and tutors,
 * each once, since an entry covers the chapters of the tasks I worked on in it.
 * - `solved`: Chapter of each task, as its note lies now; none for a task no note holds any more.
 *
 * @param chapters - Chapters picked, by their names
 * @param worked - Identities of the tasks of its `X-ATTEMPT`s and `X-TUTOR`s
 * @param tasks - Tasks of the modules of the semester
 * @returns Chapters, each once, in this order
 */
function chaptersWith(chapters: string[], worked: string[], tasks: Task[]): string[] {
    const solved: string[] = [];
    for (const id of worked) {
        const task: Task | undefined = tasks.find((candidate: Task): boolean => candidate.id === id);
        if (task !== undefined)
            solved.push(task.chapter);
    }
    return [...new Set([...chapters, ...solved])];
}

/**
 * Gives the identities of the tasks of `X-ATTEMPT`s, see {@link attemptLineOf}.
 *
 * @param values - `X-ATTEMPT`s
 * @returns Identities, like `IN2028/Kiosk Chain Review`
 */
function tasksOf(values: string[]): string[] {
    return values.map((value: string): string => attemptLineOf(value).task);
}

/**
 * Checks a skill entry before it is written: one of the types, the type it had, like an older `DEV` no longer
 * offered, or none, a module with a folder, a project or no skill at all, chapters among the module's or among those
 * the entry had, new attempts at tasks of its module only, and an end after the start; the attempts a changed entry
 * has keep their task, also once I changed its skill.
 * - `offered`: Chapters of the module, see `notes.ts`.
 * - `unknown`: First chapter that is neither offered nor kept.
 *
 * @param entry - Skill entry as the page sends it
 * @param values - Its new `X-ATTEMPT`s
 * @param kept - Chapters the entry had, or the box a new entry is logged from, by the names they gave them,
 *   also once a folder has another name; none for a new entry without box
 * @param keptType - Type the entry or the box it is logged from had, like `DEV`, empty for none
 * @throws {Error} - When one of these does not hold
 */
function skillEntryCheck(entry: SkillEntryNew, values: string[], kept: string[], keptType: string): void {
    if (entry.type !== "" && entry.type !== keptType && !skillTypes.includes(entry.type))
        throw new Error(`No type ${entry.type}`);
    const offered: string[] = entry.module === "" ? [] : moduleRead(entry.module).chapters;
    const unknown: string | undefined = entry.chapters.find((chapter: string): boolean =>
        !offered.includes(chapter) && !kept.includes(chapter));
    if (unknown !== undefined)
        throw new Error(`No chapter ${unknown} in ${entry.module}`);
    if (values.some((value: string): boolean => attemptLineOf(value).task.split("/")[0] !== entry.module))
        throw new Error(`Only attempts at tasks of ${entry.module}`);
    if (!(new Date(entry.start) < new Date(entry.end)))
        throw new Error("A skill entry needs an end after its start");
}

/**
 * Writes a new skill entry into the log, into the log of its skill, see `logFileOf` in `day.ts`, from the entry
 * by category: `CATEGORIES` is `Skill`, `SUMMARY` its module and type with the folder of its skill as `ALTREP`,
 * like `IN2028 Business Analytics Machine Learning (VO)`, see `titleOf` in `documents.ts`, its place and note,
 * the documents it used, see `linksOf` in `documents.ts`, one `X-CHAPTER` per chapter,
 * see {@link chaptersWith}, one `X-ATTEMPT` per attempt, and the box it is logged from, which is done then.
 * - `tasks`: Tasks of the modules of the semester.
 * - `values`: `X-ATTEMPT`s of the entry.
 * - `chapters`: Its chapters, those picked and those of its attempts.
 * - `plan`: The box it is logged from, `null` for none, whose place keeps its link, see `placeLinkOf` in `places.ts`,
 *   and whose chapters it may keep by their names, see {@link skillEntryCheck}.
 * - `fields`: Fields and times of the entry.
 * - `own`: Its chapters, links, attempts and box, as properties of my own.
 *
 * @param entry - Skill entry as the page sends it
 * @throws {Error} - When an attempt is not right, see {@link attemptValueOf}, the entry is not right,
 *   see {@link skillEntryCheck}, a document is none of the module's, the link typed for `Online` is no web address,
 *   or the box it is logged from is not open
 */
export function skillEntryAdd(entry: SkillEntryNew): void {
    const tasks: Task[] = tasksRead();
    const values: string[] = entry.attempts.map((attempt: AttemptNew): string => attemptValueOf(attempt, tasks, ""));
    const plan: Box | null = entry.planned === "" ? null : boxOpenFind(entry.planned);
    skillEntryCheck(entry, values, plan?.chapters ?? [], plan?.type ?? "");

    const [title, titleLink]: [string, string] = titleOf({ ...entry, category: skillName, title: "" });
    const fields: EntryFields = {
        category: skillName, title: title, titleLink: titleLink, location: entry.location,
        locationLink: placeLinkOf(entry.location, entry.locationLink, plan), from: "",
        module: entry.module, type: entry.type,
        semester: semesterFor(skillName, entry.semester, berlinDateOf(new Date(entry.start))), note: entry.note.trim(),
        start: new Date(entry.start), end: new Date(entry.end),
    };
    const chapters: string[] = chaptersWith(entry.chapters, tasksOf(values), tasks);
    const own: [string, string | Link][] = linksOf(entry.module, entry.documents, [])
        .map((link: Link): [string, Link] => ["attach", link]);
    own.push(...chapters.map((chapter: string): [string, string] => ["x-chapter", chapter]));
    own.push(...values.map((value: string): [string, string] => ["x-attempt", value]));
    if (entry.planned !== "")
        own.push(["related-to", entry.planned]);
    entryAppend(logFileOf(fields), fields, own);
    if (entry.planned !== "")
        boxDone(entry.planned);
}

/**
 * Changes a skill entry of the log from the entry by category: its type, module, place, semester, chapters,
 * documents, note and times, and adds the new attempts after those it has, every other line as it is; the entry moves
 * into the log of its new skill when that is another file, see `logFileOf` in `day.ts`. What it is, its `SUMMARY`,
 * follows its skill and type, see `titleOf` in `documents.ts`, and its links its skill and documents, see `linksOf`
 * there: a document it had keeps its link with its fingerprint, a new one gets its own; its chapters are its
 * `X-CHAPTER`s, the folders of chapters an older entry links going. Its place keeps its link while it stays the same,
 * see `placeLinkOf` in `places.ts`.
 * - `file`: `.ics` file of the entry.
 * - `old`: The entry as it is.
 * - `tasks`: Tasks of the modules of the semester.
 * - `added`: `X-ATTEMPT`s of the new attempts.
 * - `values`: `X-ATTEMPT`s it has, then the new ones.
 * - `worked`: Identities of the tasks of its attempts and tutors at tasks of its skill, whose chapters it covered.
 *
 * @param change - Changed skill entry as the page sends it
 * @throws {Error} - When there is no such skill entry in the log of the new system, a new attempt is not right,
 *   see {@link attemptValueOf}, the entry is not right, see {@link skillEntryCheck}, a document is none
 *   of the module's, or the link typed for `Online` is no web address
 */
export function skillEntryEdit(change: SkillEntryChange): void {
    const [file, old]: [string, Entry] = entryFind(skillLog, change.id);
    if (!old.editable || old.category !== skillName)
        throw new Error(`${old.title} is no skill entry of the new system`);
    const tasks: Task[] = tasksRead();
    const added: string[] = change.attempts.map((attempt: AttemptNew): string => attemptValueOf(attempt, tasks, ""));
    const values: string[] = [...old.attempts, ...added];
    skillEntryCheck(change, added, chaptersOf(old), old.type);

    const worked: string[] = [...tasksOf(values), ...old.tutors]
        .filter((task: string): boolean => task.split("/")[0] === change.module);
    const chapters: string[] = chaptersWith(change.chapters, worked, tasks);
    propertiesPut(file, old.id, [
        ["x-chapter", chapters],
        ["attach", linksOf(change.module, change.documents, old.links)],
        ["x-attempt", values],
    ]);
    const [title, titleLink]: [string, string] = titleOf({ ...change, category: skillName, title: "" });
    const fields: EntryFields = {
        category: skillName, title: title, titleLink: titleLink, location: change.location,
        locationLink: placeLinkOf(change.location, change.locationLink, old), from: "",
        module: change.module, type: change.type,
        semester: semesterFor(skillName, change.semester, berlinDateOf(new Date(change.start))),
        note: change.note.trim(),
        start: new Date(change.start), end: new Date(change.end),
    };
    entryChange(file, old, fields, logFileOf(fields));
}

/**
 * Writes lines into the skill entry of the moment of a module, see the top of this file: adds the new `X-ATTEMPT`s
 * and `X-TUTOR`s after those it has, with the chapters of their tasks, and moves its end to the end of the quarter hour
 * of now, if that is later. Without an open entry of the module, starts one covering the quarter hour of now:
 * logged from the open skill box of the module for now, with its type, which is done then, else without type.
 * - `quarter`: End of the quarter hour of now, now rounded up to the quarter hour.
 * - `plan`: Open skill box of the module for now, see `skillBoxOf` in `boxes.ts`.
 * - `type`: Type of a new entry, the box's or none.
 * - `worked`: Identities of the tasks of the new lines.
 * - `chapters`: Chapters of a new entry, those of the tasks of the new lines, or of the open entry with them.
 * - `own`: The chapters, attempts, tutors and box of a new entry, as properties of my own.
 * - `start`: Start of a new entry, a quarter hour before its end.
 * - `fields`: Fields and times of a new entry, which go into the log of the module, see `logFileOf` in `day.ts`.
 * - `values`: `X-ATTEMPT`s of the open entry with the new ones.
 * - `properties`: Properties of the open entry to write again, its chapters as `X-CHAPTER`s and its links
 *   to files, without the folders of chapters an older entry links, see `documentLinksOf` in `documents.ts`.
 *
 * @param module - Module code, like `IN2028`
 * @param open - The skill entry of the moment of the module, `undefined` for none
 * @param attempts - New `X-ATTEMPT`s
 * @param tutors - New `X-TUTOR`s, identities of tasks
 * @param tasks - Tasks of the modules of the semester
 * @param now - The moment
 */
function momentWrite(module: string, open: Entry | undefined, attempts: string[], tutors: string[], tasks: Task[],
                     now: Date): void {

    const quarter: Date = new Date(Math.ceil(now.getTime() / quarterHour) * quarterHour);
    const worked: string[] = [...tasksOf(attempts), ...tutors];
    if (open === undefined) {
        const plan: Box | undefined = skillBoxOf(module, now);
        const type: string = plan?.type ?? "";
        const chapters: string[] = chaptersWith([], worked, tasks);
        const own: [string, string | Link][] = [
            ...chapters.map((chapter: string): [string, string] => ["x-chapter", chapter]),
            ...attempts.map((value: string): [string, string] => ["x-attempt", value]),
            ...tutors.map((task: string): [string, string] => ["x-tutor", task]),
        ];
        if (plan !== undefined)
            own.push(["related-to", plan.id]);
        const start: Date = new Date(quarter.getTime() - quarterHour);
        const [title, titleLink]: [string, string] =
            titleOf({ category: skillName, title: "", module: module, type: type });
        const fields: EntryFields = {
            category: skillName, title: title, titleLink: titleLink, location: plan?.location ?? "",
            locationLink: plan?.locationLink ?? "", from: "",
            module: module, type: type, semester: semesterFor(skillName, plan?.semester ?? "", berlinDateOf(start)),
            note: "", start: start, end: quarter,
        };
        entryAppend(logFileOf(fields), fields, own);
        if (plan !== undefined)
            boxDone(plan.id);
        return;
    }

    const values: string[] = [...open.attempts, ...attempts];
    const chapters: string[] =
        chaptersWith(chaptersOf(open), [...tasksOf(values), ...open.tutors, ...worked], tasks);
    const properties: [string, (string | Date | Link)[]][] = [
        ["x-chapter", chapters],
        ["attach", documentLinksOf(open.links)],
        ["x-attempt", values],
        ["x-tutor", [...open.tutors, ...tutors]],
    ];
    if (quarter > new Date(open.end))
        properties.push(["dtend", [quarter]]);
    const [file]: [string, Entry] = entryFind(skillLog, open.id);
    propertiesPut(file, open.id, properties);
}

/**
 * Finds the skill entry of the moment of a module: the last one of the module that started before now
 * and ended at most {@link sessionPause} ago.
 *
 * @param module - Module code, like `IN2028`
 * @param now - The moment
 * @returns The entry, `undefined` for none
 */
function momentOf(module: string, now: Date): Entry | undefined {
    return skillEntriesRead(new Date(now.getTime() - sessionPause).toISOString(), now.toISOString())
        .filter((entry: Entry): boolean => entry.module === module)
        .at(-1);
}

/**
 * Writes an attempt from a button of a task into the skill entry of the moment, see {@link momentWrite},
 * with the time of the tap; a right attempt at a task I copied for my tutor in that entry is written as guided,
 * since it was solved with help and counts as no hit, see the top of this file.
 * - `tasks`: Tasks of the modules of the semester.
 * - `module`: Module code of its task, the part of its identity before `/`.
 * - `now`: The moment of the attempt.
 * - `open`: The skill entry of the moment.
 * - `guided`: Whether a right attempt was helped, its task copied for my tutor in the entry.
 *
 * @param attempt - Attempt as the page sends it
 * @throws {Error} - When the attempt is not right, see {@link attemptValueOf}
 */
export function attemptAdd(attempt: AttemptNew): void {
    const tasks: Task[] = tasksRead();
    const module: string = attempt.task.split("/")[0];
    const now: Date = new Date();
    const open: Entry | undefined = momentOf(module, now);
    const guided: boolean = attempt.result === "right" && (open?.tutors.includes(attempt.task) ?? false);
    momentWrite(module, open,
        [attemptValueOf({ ...attempt, result: guided ? "guided" : attempt.result }, tasks, berlinTimeOf(now))],
        [], tasks, now);
}

/**
 * Writes that I copied a task for my tutor into the skill entry of the moment, as an `X-TUTOR`, see {@link momentWrite},
 * once per copy, so a right attempt at it after that is guided, see {@link attemptAdd}.
 * - `tasks`: Tasks of the modules of the semester.
 *
 * @param task - Identity of the task, like `IN2028/Kiosk Sales Standard Error`
 * @throws {Error} - When no note holds the task
 */
export function tutorAdd(task: string): void {
    const tasks: Task[] = tasksRead();
    if (!tasks.some((candidate: Task): boolean => candidate.id === task))
        throw new Error(`No task ${task}`);
    const module: string = task.split("/")[0];
    const now: Date = new Date();
    momentWrite(module, momentOf(module, now), [], [task], tasks, now);
}

/**
 * Reads the session running now, for the timer of the day: the skill entry of the moment, of any module,
 * the last one of the log that started before now and ended at most {@link sessionPause} ago, as the buttons of a task
 * write into it, see {@link attemptAdd}, of every type, a lecture as my own learning, so the timer of the day
 * always shows the session I am in.
 * - `now`: The moment.
 * - `open`: The skill entry of the moment.
 *
 * @returns The session, `null` while none runs
 */
export function sessionRead(): Session | null {
    const now: Date = new Date();
    const open: Entry | undefined = skillEntriesRead(new Date(now.getTime() - sessionPause).toISOString(), now.toISOString())
        .at(-1);
    if (open === undefined)
        return null;
    return {
        module: open.module, type: open.type, title: open.title,
        start: new Date(open.start).toISOString(), end: new Date(open.end).toISOString(),
    };
}

/**
 * Writes my effort into the last attempt at a task, the one the tap after it rates: writes its `X-ATTEMPT` again
 * with the effort, every other line as it is, see {@link lineValueOf}.
 * - `entry`: The last skill entry of the log holding an attempt at the task.
 * - `index`: Place of the last attempt at the task among the attempts of the entry.
 * - `line`: That attempt in its parts.
 * - `file`: `.ics` file of the entry.
 * - {@link Array#with}: Gives a copy of the attempts with one of them replaced.
 *
 * @param effort - Effort with its task
 * @throws {Error} - When the effort is unknown, the task has no attempt, or its last attempt is a skip
 */
export function effortSet(effort: EffortNew): void {
    if (!efforts.includes(effort.effort))
        throw new Error(`No effort ${effort.effort}`);
    const entry: Entry | undefined = skillEntriesRead("1970-01-01T00:00:00Z", new Date().toISOString())
        .filter((candidate: Entry): boolean => tasksOf(candidate.attempts).includes(effort.task))
        .at(-1);
    if (entry === undefined)
        throw new Error(`No attempt at ${effort.task}`);

    const index: number = tasksOf(entry.attempts).lastIndexOf(effort.task);
    const line: AttemptLine = attemptLineOf(entry.attempts[index]);
    if (line.result === "skipped")
        throw new Error(`No effort for a skip of ${effort.task}`);
    const [file]: [string, Entry] = entryFind(skillLog, entry.id);
    propertiesPut(file, entry.id, [["x-attempt", entry.attempts.with(index, lineValueOf({ ...line, effort: effort.effort }))]]);
}

/**
 * Renames a task in the log, in the same step as its heading in its note, so its history stays with it:
 * every attempt at it up to now gets the new identity in its `X-ATTEMPT`, and every copy for my tutor in its `X-TUTOR`,
 * every other line stays as it is.
 * For the AI, not for a button; run in the folder of the dashboard like
 * `node -e 'import("./reader/skill.ts").then((skill) => console.log(skill.taskRename("IN2028/Old Name", "IN2028/New Name")))'`.
 * - `tasks`: Tasks of the modules of the semester.
 * - `renamed`: Number of attempts renamed so far.
 *
 * @param from - Identity the task had, like `IN2028/Airline Revenue Interval`
 * @param to - Its new identity, in the same form
 * @returns Number of attempts renamed
 * @throws {Error} - When a note still holds the old identity or none holds the new one,
 *   so the heading has to be renamed first
 */
export function taskRename(from: string, to: string): number {
    const tasks: Task[] = tasksRead();
    if (tasks.some((task: Task): boolean => task.id === from) || !tasks.some((task: Task): boolean => task.id === to))
        throw new Error(`Rename the heading in its note first: ${from} to ${to}`);

    let renamed: number = 0;
    skillEntriesRead("1970-01-01T00:00:00Z", new Date().toISOString()).forEach((entry: Entry): void => {
        const values: string[] = entry.attempts.map((value: string): string => {
            const line: AttemptLine = attemptLineOf(value);
            return line.task === from ? lineValueOf({ ...line, task: to }) : value;
        });
        const tutors: string[] = entry.tutors.map((task: string): string => task === from ? to : task);
        const count: number = values.filter((value: string, index: number): boolean => value !== entry.attempts[index]).length;
        if (count === 0 && tutors.join("\n") === entry.tutors.join("\n"))
            return;
        const [file]: [string, Entry] = entryFind(skillLog, entry.id);
        propertiesPut(file, entry.id, [["x-attempt", values], ["x-tutor", tutors]]);
        renamed += count;
    });
    return renamed;
}
