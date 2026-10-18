/**
 * ## Notes
 *
 * Reads my modules for the scripts view, read only: the modules of the semester with their chapters
 * and notes for the menu, a note with the files its links lead to, the links of the notes that lead nowhere,
 * and single files, like the images of a note; for the skill entries of the day, every module folder
 * with its chapters and the university's documents in it.
 * Each module is a vault of its own, as in Obsidian, so a link leads to a file of the same module.
 * A note of any module can be read, also of one that is not in the menu.
 * Paths come and go with `/` from `NomSkillingmodules`,
 * like `MA0902_ReelleAnalysisInformatik/05_WichtigeFunktionstypen/Tangens.svg`.
 * Hidden files and folders, like `.obsidian`, stay out, as in Obsidian.
 * A missing folder counts as empty, like a module of the semester whose folder is not made yet, or `NomSkillingmodules`
 * itself; a missing note or file is an error.
 *
 * - `node:fs`: Reads files and folders on the disk.
 * - `node:path`: Builds file paths, `posix` with `/` for paths inside the modules.
 * - `./sources.ts`: Names the folder of my modules for the scripts view, and the modules of the semester.
 */

import { existsSync, readdirSync, readFileSync, realpathSync } from "node:fs";
import { extname, join, posix, sep } from "node:path";
import { activeModules, modulesFolder, notes } from "./sources.ts";

import type { Dirent } from "node:fs";


/**
 * A note of a chapter, as the menu lists it.
 *
 * - `name`: Name of the file, like `01_01_EstimatorConfidenceInterval.md`.
 * - `path`: Path, see the top of this file.
 */
export type NoteEntry = {
    name: string;
    path: string;
};

/**
 * A chapter of a module with its notes.
 *
 * - `title`: Its name, the name of its folder as it is, like `01_RegressionAnalysis`.
 * - `notes`: Its notes, sorted as Obsidian's file explorer does.
 */
export type Chapter = {
    title: string;
    notes: NoteEntry[];
};

/**
 * A module of the semester with its chapters.
 *
 * - `name`: Name of its folder, like `IN2028_BusinessAnalyticsMachineLearning`.
 * - `title`: Its name, the name of its folder as it is, like `IN2028_BusinessAnalyticsMachineLearning`.
 * - `chapters`: Its chapters that hold notes, in the order of their folders.
 */
export type NotesModule = {
    name: string;
    title: string;
    chapters: Chapter[];
};

/**
 * A note with the files its links lead to.
 *
 * - `path`: Path of the note, see the top of this file.
 * - `text`: Markdown text of the note.
 * - `links`: For each link of the note as written, like `05_06_EulerTrigonometrie` of
 *   `[[05_06_EulerTrigonometrie#05.06. Definition. Eulersche Formel|Eulersche Formel]]` or `./img/Singleton.png`
 *   of `![Singleton](./img/Singleton.png)`: path of the file it leads to, `null` when it leads nowhere.
 */
export type LinkedNote = {
    path: string;
    text: string;
    links: { [link: string]: string | null };
};

/**
 * A file with its content type, as the browser gets it.
 *
 * - `type`: Content type, like `image/svg+xml`.
 * - `content`: Bytes of the file.
 */
export type NotesFile = {
    type: string;
    content: Buffer;
};

/**
 * A link of a note that leads nowhere.
 *
 * - `note`: Path of the note, see the top of this file.
 * - `link`: The link as written, like `VO_UniversityLectureLessons/TUM_2025W/04_LogisticPoissonRegression.pdf`
 *   of `[[VO_UniversityLectureLessons/TUM_2025W/04_LogisticPoissonRegression.pdf#page=10|lecture 04 slide 10]]`.
 */
export type BrokenLink = {
    note: string;
    link: string;
};

/**
 * What a module folder holds besides its notes, for a skill entry of the day.
 *
 * - `folder`: The module folder from `NomWorkspace`, like `NomSkillingmodules/IN2028_BusinessAnalyticsMachineLearning`,
 *   empty for a project.
 * - `chapters`: Names of its chapter folders, also of the empty ones, like `05_DecisionTreesEnsembles`, in order.
 * - `documents`: Its files outside the chapter folders, the university's material, and the notes of its chapters,
 *   by their paths from the module folder, like `VO_UniversityLectureLessons/TUM_2025W/04_….pdf`
 *   or `01_RegressionAnalysis/01_01_SampleMeanStandardError.md`, in order.
 */
export type ModuleContents = {
    folder: string;
    chapters: string[];
    documents: string[];
};

/**
 * An old exam of a module, its files in a folder of a semester in the folder of its examinations, see {@link papersRead}.
 *
 * - `semester`: Folder of its semester, like `TUM_2024W`.
 * - `kind`: Its kind, the part of the names of its files before the first `_`, like `Endterm`, `Retake` or `Mock`.
 * - `files`: Its files, each its name, the rest of the name of its file without its ending, like `Assignments`
 *   or `Solutions`, and its path in `NomSkillingmodules`, which the scripts view opens, see {@link fileRead}.
 */
export type Paper = {
    semester: string;
    kind: string;
    files: { name: string; path: string }[];
};

/**
 * Folder of the examinations of a module, its old exams in a folder per semester.
 */
const examsFolder: string = "FA_UniversityModuleExaminations";

/**
 * Kinds of old exams in the order they show in, any other after them by its name.
 */
const paperKinds: string[] = ["Endterm", "Retake", "Mock"];

/**
 * Wiki link or embed, like `[[05_06_EulerTrigonometrie#…|…]]` or `![[Tangens.svg|300]]`:
 * its target before `#`, `|` or the `\|` written in tables.
 */
const wikiLink: RegExp = /\[\[([^\]#|\\]*)/g;

/**
 * Markdown link or image, like `[Text](Note.md#Heading)` or `![Singleton](./img/Singleton.png)`:
 * its address before `#`, written plain or in `<…>`.
 */
const markdownLink: RegExp = /\]\(\s*(?:<([^>#]*)|([^\s)#]*))/g;

/**
 * Address with a scheme, like `https://…` or `mailto:…`: a link out of the vault, never resolved.
 */
const external: RegExp = /^[a-z][a-z\d+.-]*:/i;

/**
 * Content types of the files the scripts view shows or opens, and of the files skill entries link,
 * by their ending; any other file comes as bytes.
 */
const types: { [ending: string]: string } = {
    ".md": "text/markdown; charset=utf-8",
    ".txt": "text/plain; charset=utf-8",
    ".pdf": "application/pdf",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".webp": "image/webp",
};

/**
 * Sorts names as Obsidian's file explorer does: alphabetical, numbers by their value, case ignored.
 */
const collator: Intl.Collator = new Intl.Collator(undefined, { numeric: true, sensitivity: "base" });

/**
 * Chapter folder, like `01_RegressionAnalysis`: two digits and `_` first.
 */
const chapterFolder: RegExp = /^\d{2}_/;

/**
 * Module folder, like `IN2028_BusinessAnalyticsMachineLearning`: its code, capitals and then digits, and `_` first,
 * so a folder like `_Inbox` is none.
 */
const moduleFolder: RegExp = /^[A-Z]+\d+_/;


/**
 * Builds the place of a path on the disk, inside `NomSkillingmodules`, as written, without following links.
 *
 * @param path - Path like `IN2028_BusinessAnalyticsMachineLearning/01_RegressionAnalysis`
 * @returns Place on the disk, like `…/NomSkillingmodules/IN2028_BusinessAnalyticsMachineLearning/01_RegressionAnalysis`
 */
function placeOf(path: string): string {
    return join(notes.modules, path);
}

/**
 * Turns a path into the path on the disk, only when it stays inside `NomSkillingmodules`.
 * - {@link realpathSync}: Makes a path absolute and follows symbolic links, so no link leads outside.
 *
 * @param path - Path like `MA0902_ReelleAnalysisInformatik/05_WichtigeFunktionstypen`
 * @returns Path on the disk
 * @throws {Error} - When a part of the path starts with `.`, like `..` or `.obsidian`, when it leads outside
 *   its folder, or when nothing lies there
 */
function diskPathOf(path: string): string {
    if (path.split("/").some((part: string): boolean => part.startsWith(".")))
        throw new Error(`No hidden path and no way up: ${path}`);

    const root: string = realpathSync(notes.modules);
    const file: string = realpathSync(placeOf(path));
    if (file !== root && !file.startsWith(`${root}${sep}`))
        throw new Error(`No reading outside the modules: ${path}`);
    return file;
}

/**
 * Gives the module of a path, the vault its links stay in.
 *
 * @param path - Path like `MA0902_ReelleAnalysisInformatik/05_WichtigeFunktionstypen/05_07_TrigonometrischeFunktionen.md`
 * @returns Path of its module, like `MA0902_ReelleAnalysisInformatik`
 */
function moduleOf(path: string): string {
    return path.split("/")[0];
}

/**
 * Gives the module code of a module folder, the part of its name before `_`.
 *
 * @param name - Folder name, like `IN2028_BusinessAnalyticsMachineLearning`
 * @returns Code, like `IN2028`
 */
export function codeOf(name: string): string {
    return name.split("_")[0];
}

/**
 * Reads the entries of a folder without hidden ones, as Obsidian lists a vault; a missing folder counts as empty.
 *
 * @param folder - Path of the folder, like `MA0902_ReelleAnalysisInformatik`
 * @returns Entries of the folder, none for a missing folder
 */
function entriesRead(folder: string): Dirent[] {
    if (!existsSync(placeOf(folder)))
        return [];
    return readdirSync(diskPathOf(folder), { withFileTypes: true })
        .filter((entry: Dirent): boolean => !entry.name.startsWith("."));
}

/**
 * Lists every file below a folder, without hidden files and folders, as Obsidian lists a vault.
 *
 * @param folder - Path of the folder, like `MA0902_ReelleAnalysisInformatik`
 * @returns Paths of the files
 */
function filesRead(folder: string): string[] {
    return entriesRead(folder).flatMap((entry: Dirent): string[] => {
        const path: string = posix.join(folder, entry.name);
        return entry.isDirectory() ? filesRead(path) : [path];
    });
}

/**
 * Lists the files the links of a note may lead to, the files of its module, by their paths in it, each with its path,
 * see the top of this file.
 *
 * @param module - Path of the module of the note, like `IN2028_BusinessAnalyticsMachineLearning`
 * @returns Path of each file, like `IN2028_BusinessAnalyticsMachineLearning/VO_UniversityLectureLessons/TUM_2025W/…`,
 *   by its path in the module, like `VO_UniversityLectureLessons/TUM_2025W/…`
 */
function vaultFilesRead(module: string): Map<string, string> {
    return new Map(filesRead(module).map((file: string): [string, string] => [file.slice(module.length + 1), file]));
}

/**
 * Finds the file a link leads to, as Obsidian does in `getLinkpathDest`, ignoring case:
 * - an empty link, like the one of `[[#Heading]]`, leads to the note itself;
 * - candidates are the files with the link's name, like `Tangens.svg`;
 *   when its name has no ending or no file has it, the files with `.md` added, like `03_05_AbsoluteKonvergenz.md`;
 * - a plain name with one candidate leads to it;
 * - else the candidate at the link's path, from the note's folder for `./` and `../`, else from the module;
 * - else the candidate whose path ends with the link, the note's folder first, the shortest path first.
 *
 * @param link - Link as Obsidian reads it, like `03_05_AbsoluteKonvergenz` or `./img/Singleton.png`
 * @param note - Path of the note in its module, like `05_WichtigeFunktionstypen/05_07_TrigonometrischeFunktionen.md`
 * @param files - Paths of all files in the module
 * @returns Path of the file in the module, or `null` when the link leads nowhere
 */
function linkResolve(link: string, note: string, files: string[]): string | null {
    if (link === "")
        return note;

    const named: (path: string) => string[] = (path: string): string[] =>
        files.filter((file: string): boolean => posix.basename(file).toLowerCase() === posix.basename(path));
    let path: string = link.toLowerCase();
    let candidates: string[] = posix.basename(path).includes(".") ? named(path) : [];
    if (candidates.length === 0) {
        path = `${link}.md`.toLowerCase();
        candidates = named(path);
    }
    if (candidates.length === 0)
        return null;
    if (!path.includes("/") && candidates.length === 1)
        return candidates[0];

    const folder: string = note.includes("/") ? note.slice(0, note.lastIndexOf("/")).toLowerCase() : "";
    const exact: string = path.startsWith("./") || path.startsWith("../")
        ? posix.join(folder, path)
        : path.replace(/^\//, "");
    const found: string | undefined = candidates.find((file: string): boolean => file.toLowerCase() === exact);
    if (found !== undefined)
        return found;
    if (link.startsWith("/"))
        return null;

    const endings: string[] = candidates
        .filter((file: string): boolean => file.toLowerCase().endsWith(path))
        .sort((first: string, second: string): number => first.length - second.length);
    const nearby: string | undefined = endings.find((file: string): boolean => file.toLowerCase().startsWith(folder));
    if (nearby !== undefined)
        return nearby;
    if (endings.length > 0)
        return endings[0];
    return null;
}

/**
 * Reads a link as Obsidian does: with `%20` and the like decoded, as written when it cannot be decoded.
 *
 * @param link - Link as written, like `Note%20One.md`
 * @returns Decoded link, like `Note One.md`
 */
function linkDecode(link: string): string {
    try {
        return decodeURIComponent(link);
    } catch {
        return link;
    }
}

/**
 * Reads the modules of the semester, see {@link activeModules}, each with its chapters and their notes, for the menu:
 * the chapter folders of the module, like `01_RegressionAnalysis`, each with its notes, the `.md` files right in it.
 * Chapters without notes stay out, and so do the other folders, like `FA_UniversityModuleExaminations`
 * with the university's material, and the other files, like images.
 *
 * @returns Modules in the order of the list, a module whose folder is missing without chapters
 */
export function modulesRead(): NotesModule[] {
    return activeModules.map((module: string): NotesModule => ({
        name: module,
        title: module,
        chapters: entriesRead(module)
            .filter((chapter: Dirent): boolean => chapter.isDirectory() && chapterFolder.test(chapter.name))
            .map((chapter: Dirent): Chapter => ({
                title: chapter.name,
                notes: entriesRead(`${module}/${chapter.name}`)
                    .filter((note: Dirent): boolean => !note.isDirectory() && note.name.toLowerCase().endsWith(".md"))
                    .map((note: Dirent): NoteEntry =>
                        ({ name: note.name, path: `${module}/${chapter.name}/${note.name}` }))
                    .sort((first: NoteEntry, second: NoteEntry): number => collator.compare(first.name, second.name)),
            }))
            .sort((first: Chapter, second: Chapter): number => collator.compare(first.title, second.title))
            .filter((chapter: Chapter): boolean => chapter.notes.length > 0),
    }));
}

/**
 * Lists every module folder in `NomSkillingmodules`, like `IN0024_OperationsResearch`, also of the modules
 * that are not of the semester, as Obsidian's file explorer sorts them.
 *
 * @returns Names of the module folders
 */
export function moduleFoldersRead(): string[] {
    return entriesRead("")
        .filter((entry: Dirent): boolean => entry.isDirectory() && moduleFolder.test(entry.name))
        .map((entry: Dirent): string => entry.name)
        .sort(collator.compare);
}

/**
 * Finds the folder of a module in `NomSkillingmodules` by its code.
 *
 * @param code - Module code, like `IN2028`
 * @returns Name of its folder, like `IN2028_BusinessAnalyticsMachineLearning`, `undefined` when no folder has the code
 */
export function moduleFolderOf(code: string): string | undefined {
    return moduleFoldersRead().find((name: string): boolean => codeOf(name) === code);
}

/**
 * Reads what a module folder holds for a skill entry, see {@link ModuleContents}: the chapter folders of the module,
 * and as documents every file of the module outside them, like the lecture's slides, and the notes of its chapters,
 * like `01_RegressionAnalysis/01_01_SampleMeanStandardError.md`, but not their images.
 * - `chapters`: Names of the chapter folders, in order.
 * - `notes`: Paths of the notes of every chapter from the module folder.
 * - `material`: Paths of the files of the module outside its chapter folders.
 *
 * @param module - Name of the module folder, like `IN2028_BusinessAnalyticsMachineLearning`
 * @returns Chapters and documents of the module, none for a missing folder
 */
export function moduleContentsRead(module: string): ModuleContents {
    const chapters: string[] = entriesRead(module)
        .filter((entry: Dirent): boolean => entry.isDirectory() && chapterFolder.test(entry.name))
        .map((entry: Dirent): string => entry.name).sort(collator.compare);
    const notes: string[] = chapters.flatMap((chapter: string): string[] => entriesRead(`${module}/${chapter}`)
        .filter((note: Dirent): boolean => !note.isDirectory() && note.name.toLowerCase().endsWith(".md"))
        .map((note: Dirent): string => `${chapter}/${note.name}`));
    const material: string[] = entriesRead(module)
        .flatMap((entry: Dirent): string[] => entry.isDirectory()
            ? (chapterFolder.test(entry.name) ? [] : filesRead(`${module}/${entry.name}`))
            : [`${module}/${entry.name}`])
        .map((file: string): string => file.slice(module.length + 1));
    return {
        folder: `${modulesFolder}/${module}`,
        chapters: chapters, documents: [...material, ...notes].sort(collator.compare),
    };
}

/**
 * Reads the old exams of a module from the folder of its examinations, see {@link Paper}: one per semester and kind,
 * the newest semester first, its endterm before its retake and its mock, like `TUM_2024W` `Endterm` with
 * `Assignments` and `Solutions`; none for a module without such a folder.
 * - `papers`: The old exams by semester and kind, as found.
 * - `parts`: Folder of the semester and name of a file.
 * - `kind`, `name`: The part of the name of a file before its first `_`, and the rest without its ending.
 *
 * @param module - Name of the module folder, like `IN2028_BusinessAnalyticsMachineLearning`
 * @returns Its old exams in order
 */
export function papersRead(module: string): Paper[] {
    const papers: Map<string, Paper> = new Map();
    filesRead(posix.join(module, examsFolder)).forEach((path: string): void => {
        const parts: string[] = path.slice(module.length + examsFolder.length + 2).split("/");
        if (parts.length !== 2)
            return;
        const base: string = parts[1].replace(/\.[^.]+$/, "");
        const kind: string = base.split("_")[0];
        const name: string = base.slice(kind.length + 1) || base;
        const key: string = `${parts[0]}/${kind}`;
        const paper: Paper = papers.get(key) ?? { semester: parts[0], kind: kind, files: [] };
        paper.files.push({ name: name, path: path });
        papers.set(key, paper);
    });
    const rank: (kind: string) => number = (kind: string): number =>
        paperKinds.includes(kind) ? paperKinds.indexOf(kind) : paperKinds.length;
    return [...papers.values()].sort((first: Paper, second: Paper): number =>
        second.semester.localeCompare(first.semester) || rank(first.kind) - rank(second.kind)
        || first.kind.localeCompare(second.kind));
}

/**
 * Gives the name of the chapter whose folder a path leads to, like the folder an older skill entry links.
 *
 * @param path - Path of the folder of a chapter from `NomWorkspace`,
 *   like `NomSkillingmodules/IN2028_BusinessAnalyticsMachineLearning/02_LogisticPoissonRegression`
 * @returns Name like `02_LogisticPoissonRegression`
 */
export function chapterNameOf(path: string): string {
    return path.split("/").at(-1) ?? "";
}

/**
 * Finds the files the wiki links, embeds, Markdown links and images of a note lead to, see {@link linkResolve}.
 * - `note`: Path of the note in its module.
 * - `inModule`: Paths in the module of the files the links may lead to.
 * - `links`: Links of the note as written, without links out of the vault, like `https://…`.
 *
 * @param text - Text of the note
 * @param path - Path of the note
 * @param files - Files the links of the note may lead to, see {@link vaultFilesRead}
 * @returns For each link as written, path of the file it leads to, `null` when it leads nowhere
 */
function linksOf(text: string, path: string, files: Map<string, string>): { [link: string]: string | null } {
    const note: string = path.slice(moduleOf(path).length + 1);
    const inModule: string[] = [...files.keys()];
    const links: string[] = [
        ...[...text.matchAll(wikiLink)].map((match: RegExpExecArray): string => match[1].trim()),
        ...[...text.matchAll(markdownLink)].map((match: RegExpExecArray): string => match[1] ?? match[2]),
    ].filter((link: string): boolean => !external.test(link));

    return Object.fromEntries(links.map((link: string): [string, string | null] => {
        const found: string | null = linkResolve(linkDecode(link), note, inModule);
        return [link, found === null ? null : files.get(found) ?? null];
    }));
}

/**
 * Reads a note with the files its wiki links, embeds, Markdown links and images lead to, see {@link linksOf}:
 * within its module, see {@link vaultFilesRead}.
 * Lists the files of its module once, which takes up to a few hundred milliseconds in a module with code.
 *
 * @param path - Path of the note, like
 *   `MA0902_ReelleAnalysisInformatik/05_WichtigeFunktionstypen/05_07_TrigonometrischeFunktionen.md`
 * @returns Note with its links
 * @throws {Error} - When the note lies outside `NomSkillingmodules`, or is missing
 */
export function linkedNoteRead(path: string): LinkedNote {
    const text: string = readFileSync(diskPathOf(path), "utf8");
    return { path: path, text: text, links: linksOf(text, path, vaultFilesRead(moduleOf(path))) };
}

/**
 * Reads the links that lead nowhere in the notes of the semester, the chapter notes of the modules
 * the menu shows, each link once per note, like a link to a slide whose file was renamed.
 * Lists the files of each module once.
 * - `vaults`: Files the links may lead to, by the path of the module of a note, as listed so far.
 * - `root`: Path of the module of a note, like `IN2028_BusinessAnalyticsMachineLearning`.
 * - `files`: Files the links of the note may lead to.
 *
 * @returns Links that lead nowhere, by the order of the menu
 * @throws {Error} - When a folder or note cannot be read
 */
export function brokenLinksRead(): BrokenLink[] {
    const vaults: Map<string, Map<string, string>> = new Map();
    return modulesRead().flatMap((module: NotesModule): NoteEntry[] =>
        module.chapters.flatMap((chapter: Chapter): NoteEntry[] => chapter.notes)
    ).flatMap((note: NoteEntry): BrokenLink[] => {
        const root: string = moduleOf(note.path);
        const files: Map<string, string> = vaults.get(root) ?? vaultFilesRead(root);
        vaults.set(root, files);
        return Object.entries(linksOf(readFileSync(diskPathOf(note.path), "utf8"), note.path, files))
            .filter(([, file]: [string, string | null]): boolean => file === null)
            .map(([link]: [string, string | null]): BrokenLink => ({ note: note.path, link: link }));
    });
}

/**
 * Gives the content type of a file by its ending, see {@link types}.
 *
 * @param file - Path of the file, like `…/04_LogisticPoissonRegression.pdf`
 * @returns Content type, like `application/pdf`, `application/octet-stream` for any other ending
 */
export function contentTypeOf(file: string): string {
    return types[extname(file).toLowerCase()] ?? "application/octet-stream";
}

/**
 * Reads a file of my modules with its content type, like an image of a note or a PDF to open.
 *
 * @param path - Path like `MA0902_ReelleAnalysisInformatik/05_WichtigeFunktionstypen/Tangens.svg`
 * @returns File with its content type
 * @throws {Error} - When the file lies outside `NomSkillingmodules`, or is missing
 */
export function fileRead(path: string): NotesFile {
    const file: string = diskPathOf(path);
    return { type: contentTypeOf(file), content: readFileSync(file) };
}
