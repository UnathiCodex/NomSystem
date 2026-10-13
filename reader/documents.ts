/**
 * ## Documents
 *
 * Names a skill entry and links it to the folder of its skill and to the documents it used, like the slides
 * of a lecture, a sheet or the notes of a chapter, its paths from `NomWorkspace`, each with its topic;
 * each link only points to more, the entry states its facts itself, see `calendar.ts`, like the chapters
 * of my system it belongs to, one `X-CHAPTER` each, like `X-CHAPTER:02 Logistic Poisson Regression`.
 * Its `SUMMARY` is the name of the folder of its skill, with its type
 * in round brackets at the end when it has one, and links that folder as its `ALTREP`, see {@link skillTitleOf},
 * like `SUMMARY;ALTREP="NomSkillingmodules/IN2028_…":IN2028_BusinessAnalyticsMachineLearning (VO)`,
 * my own learning without brackets, a project like
 * `SUMMARY;ALTREP="NomProgramprojects/AsiaWok_Bonierungssystem_2026/WokFlow":WokFlow`.
 * Every real document a skill entry used is one `ATTACH` with its topic as parameter `X-TOPIC`, see `Link`
 * in `calendar.ts`, as many as it used, in the same form for every kind: a lecture its slides, like
 * `ATTACH;X-TOPIC="Logistic Regression";X-SHA256=9f86d081…:NomSkillingmodules/IN2028_…/VO_…/04_….pdf`,
 * an exercise or a tutorial its sheet in `TU_UniversityTutorExercises`, a homework its sheet
 * in `HU_UniversityHomeExercises`, and my own learning the notes of its chapters, like
 * `ATTACH;X-TOPIC="Sample Mean Standard Error";X-SHA256=…:NomSkillingmodules/IN2028_…/01_…/01_01_….md`.
 * Its topic is filled from the name of the file, see {@link topicOf}, until I change it; a file keeps
 * the fingerprint of its content, the SHA-256 of its bytes, as parameter, so the link survives a rename.
 * The folder of a chapter is no `ATTACH`: an older entry that links one names that chapter, which is still read,
 * see {@link chaptersOf}, and becomes its `X-CHAPTER` once the entry changes; its `DESCRIPTION` is only my free note.
 * The folder of a module in an `ATTACH` of an older entry counts no more and goes once the entry changes too.
 * The reader checks every link of the whole log when it starts and every night at 04:00, see {@link linksCheckStart}:
 * a module folder that is gone, like after a rename, is found again by the code of the entry's module,
 * see `moduleFolderOf` in `notes.ts`, and its `SUMMARY` names the folder found; a document whose path no longer leads
 * to a file, like after a rename or a move into another folder of the module, is looked for by its fingerprint
 * among the module's documents, and a chapter by the name of its folder in the module folder found or its drafts.
 * Each repair goes into the entry, every other line of the file as it is, and into the reader's console, with the old
 * and the new path. A link it cannot repair stays as written, like a document deleted or the folder of a project,
 * which has no code to find it by, and the skill view lists it, see {@link linksLostRead}.
 * Fingerprints are kept by path, size and time of change, so only new or changed files are read again.
 * The reader sends a file a skill entry links, read only, so the page opens it in the browser's own viewer,
 * see {@link linkedFileRead}; no other file of `NomWorkspace`.
 *
 * - `node:fs`: Reads files and their sizes and times of change.
 * - `node:path`: Builds file paths for the operating system.
 * - `node:crypto`: Computes the SHA-256 of a file.
 * - `./calendar.ts`: Reads the log, finds an entry's event, puts new values into it or changes its fields,
 *   writes its start and the days in Berlin time, and names the category of skill entries.
 * - `./notes.ts`: Finds the folder of a module by its code and of a chapter by its name, lists the documents
 *   of a module, names a folder to read, and gives the content type of a file.
 * - `./sources.ts`: Names `NomWorkspace`, the folders of my modules and of their drafts, the skills of the semester
 *   and the log of the skill area.
 */

import { existsSync, readFileSync, statSync } from "node:fs";
import { join, resolve, sep } from "node:path";
import { createHash } from "node:crypto";
import {
    berlinDateOf, berlinInstantOf, berlinTimeOf, dayAdd, entriesRead, entryChange, entryFind, propertiesPut, skillName,
} from "./calendar.ts";
import {
    chapterNameOf, codeOf, contentTypeOf, moduleContentsRead, moduleFolderOf,
} from "./notes.ts";
import { activeModules, draftsFolder, moduleIs, modulesFolder, projectOf, skillLog, vault } from "./sources.ts";

import type { Stats } from "node:fs";
import type { Entry, EntryFields, Link } from "./calendar.ts";
import type { NotesFile } from "./notes.ts";


/**
 * A fingerprint as computed, with what tells whether its file changed since.
 *
 * - `size`: Size of the file in bytes.
 * - `modified`: Time of the last change of the file in milliseconds.
 * - `fingerprint`: SHA-256 of the file's bytes, as 64 hexadecimal digits.
 */
type Fingerprint = {
    size: number;
    modified: number;
    fingerprint: string;
};

/**
 * A link of a skill entry the reader could not repair, as the skill view lists it.
 *
 * - `day`: Day its entry started in Berlin time, like `2026-10-13`.
 * - `skill`: What its entry was, like `IN2028_BusinessAnalyticsMachineLearning (VO)`.
 * - `path`: Path of the link from the folder of the entry's skill when it lies in it,
 *   like `VO_UniversityLectureLessons/TUM_2025W/04_Old.pdf`, else from `NomWorkspace`.
 */
export type LinkLost = {
    day: string;
    skill: string;
    path: string;
};

/**
 * Fingerprints computed so far, by the path of their file on the disk.
 */
const fingerprints: Map<string, Fingerprint> = new Map();

/**
 * Links the last check could not repair, see {@link linksCheck}, in the order of their entries.
 */
let lost: LinkLost[] = [];

/**
 * Hour of the night the reader checks every link again, in Berlin time.
 */
const checkHour: number = 4;

/**
 * A year in milliseconds: the whole log is read up to a year after now.
 */
const yearLength: number = 366 * 24 * 60 * 60 * 1000;


/**
 * Reads the entries of the whole log of the skill area, up to a year after now.
 *
 * @returns Entries of the log
 */
function logRead(): Entry[] {
    return entriesRead(skillLog, "1970-01-01T00:00:00Z", new Date(Date.now() + yearLength).toISOString());
}

/**
 * Builds the path on the disk of a path from `NomWorkspace`.
 *
 * @param path - Path parted by `/`, like `NomSkillingmodules/IN2028_BusinessAnalyticsMachineLearning`
 * @returns Path on the disk
 */
function diskOf(path: string): string {
    return join(vault, ...path.split("/"));
}

/**
 * Gives the fingerprint of a file, the SHA-256 of its bytes, computed again only when the file changed.
 * - `stats`: Size and time of change of the file now.
 * - `known`: Fingerprint computed before, `undefined` for a file not seen yet.
 * - `fingerprint`: Fingerprint computed now.
 * - {@link createHash}: Computes a hash of bytes, here SHA-256, written as hexadecimal digits.
 *
 * @param file - Path of the file on the disk
 * @returns Fingerprint as 64 hexadecimal digits
 * @throws {Error} - When the file cannot be read
 */
function fingerprintOf(file: string): string {
    const stats: Stats = statSync(file);
    const known: Fingerprint | undefined = fingerprints.get(file);
    if (known?.size === stats.size && known.modified === stats.mtimeMs)
        return known.fingerprint;

    const fingerprint: string = createHash("sha256").update(readFileSync(file)).digest("hex");
    fingerprints.set(file, { size: stats.size, modified: stats.mtimeMs, fingerprint: fingerprint });
    return fingerprint;
}

/**
 * Gives the folder of a skill by its name, as a path from `NomWorkspace`: a project of the semester by its folder name,
 * a module by its code, its folder in `NomSkillingmodules`, or a module of the semester whose folder is missing yet.
 * - `module`: Name of the module folder, `undefined` for none.
 *
 * @param code - Name of the skill, like `IN2028` or `WokFlow`
 * @returns Path like `NomSkillingmodules/IN2028_BusinessAnalyticsMachineLearning`, `undefined` for no skill of the name
 */
export function skillFolderOf(code: string): string | undefined {
    const module: string | undefined = moduleFolderOf(code)
        ?? activeModules.find((name: string): boolean => codeOf(name) === code);
    return projectOf(code) ?? (module === undefined ? undefined : `${modulesFolder}/${module}`);
}

/**
 * Names a skill entry as its `SUMMARY` says it, see the top of this file: the name of the folder of its skill,
 * with its type in round brackets when it has one; a skill without folder by its name alone; an entry without skill
 * by its type in brackets alone, like `(VO)`, or not at all.
 * - `folder`: Folder of the skill from `NomWorkspace`, see {@link skillFolderOf}, `undefined` for none.
 * - `name`: Name of that folder, the last part of its path.
 *
 * @param code - Name of the skill, like `IN2028` or `WokFlow`
 * @param type - Its type, like `VO`, empty for none, like my own learning
 * @returns What it is, like `IN2028_BusinessAnalyticsMachineLearning (VO)`, `IN2028_BusinessAnalyticsMachineLearning`
 *   or `WokFlow`, empty for neither skill nor type
 */
export function skillTitleOf(code: string, type: string): string {
    const folder: string | undefined = skillFolderOf(code);
    const name: string = folder?.split("/").at(-1) ?? code;
    if (type === "")
        return name;
    return name === "" ? `(${type})` : `${name} (${type})`;
}

/**
 * Gives what an entry or a box was as it is written, its `SUMMARY` and the `ALTREP` of it: for a skill entry
 * its skill and type, see {@link skillTitleOf}, linking the folder of its skill, see {@link skillFolderOf};
 * for any other its what as sent, without link.
 *
 * @param fields - Category, what, skill and type of the entry or the box, as sent
 * @returns `SUMMARY` and `ALTREP`, like `IN2028_BusinessAnalyticsMachineLearning (VO)`
 *   and `NomSkillingmodules/IN2028_BusinessAnalyticsMachineLearning`, or `Planungen` and an empty link
 */
export function titleOf(fields: { category: string; title: string; module: string; type: string }): [string, string] {
    if (fields.category !== skillName)
        return [fields.title, ""];
    return [skillTitleOf(fields.module, fields.type), skillFolderOf(fields.module) ?? ""];
}

/**
 * Topics of the documents of a skill entry as I changed or kept them in the dialog, by the path of each document
 * from the folder of its skill, like `VO_UniversityLectureLessons/TUM_2026W/04_LogisticRegression.pdf`.
 */
export type Topics = { [value: string]: string };

/**
 * Writes the topic of a file as its `X-TOPIC` holds it until I change it: its name to read, without
 * its ending and the numbers in front of it, `_` as spaces, words and numbers apart, like `Logistic Regression`
 * of `04_LogisticRegression.pdf`, `Sample Mean Standard Error` of the note `01_01_SampleMeanStandardError.md`,
 * or `Sheet 03` of `Sheet03.pdf`.
 *
 * @param name - Name of the file or the folder, the last part of its path
 * @returns The topic
 */
export function topicOf(name: string): string {
    return name.replace(/\.[^.]*$/, "").replace(/^(?:\d+_)+/, "").replaceAll("_", " ")
        .replace(/(?<=\p{Ll})(?=\p{Lu})|(?<=\p{L})(?=\d)/gu, " ").trim();
}

/**
 * Gives the topic of a link to write: the one sent, else the one the entry's link had, else the topic of its name,
 * see {@link topicOf}.
 *
 * @param sent - Topic sent from the dialog, `undefined` or empty for none
 * @param kept - The entry's link to the same file or chapter, `undefined` for none
 * @param name - Name of the file or the folder, like `04_LogisticRegression.pdf`
 * @returns The topic, like `Logistic Regression`
 */
function topicFor(sent: string | undefined, kept: Link | undefined, name: string): string {
    if (sent !== undefined && sent.trim() !== "")
        return sent.trim();
    if (kept !== undefined && kept.topic !== "")
        return kept.topic;
    return topicOf(name);
}

/**
 * Tells whether a link is one to the folder of a chapter, which an older entry has: a folder, without fingerprint,
 * named like a chapter, right in the folder of a module or of its drafts, unlike the folder of a module itself
 * in an `ATTACH` of an older entry, which counts no more.
 * - `parts`: The parts of its path.
 * - `inModule`, `inDrafts`: Whether it lies right in the folder of a module, or of its drafts.
 *
 * @param link - Link of a skill entry
 * @returns Whether it links a chapter
 */
function chapterLinkIs(link: Link): boolean {
    const parts: string[] = link.path.split("/");
    const inModule: boolean = moduleIs(link.path) && parts.length === 3;
    const inDrafts: boolean =
        link.path.startsWith(`${draftsFolder}/`) && parts.length === draftsFolder.split("/").length + 2;
    return link.fingerprint === "" && (inModule || inDrafts) && /^\d{2}_/.test(parts[parts.length - 1]);
}

/**
 * Gives the chapters of my system a skill entry belongs to, by their names to read: those of its `X-CHAPTER`s,
 * then those whose folders an older entry links, see {@link chapterLinkIs}, by the names of their folders,
 * whatever topics they have, each once.
 *
 * @param entry - Skill entry of the log
 * @returns Names like `02 Logistic Poisson Regression`, in order
 */
export function chaptersOf(entry: Entry): string[] {
    return [...new Set([
        ...entry.chapters,
        ...entry.links.filter(chapterLinkIs).map((link: Link): string => chapterNameOf(link.path)),
    ])];
}

/**
 * Gives the links of a skill entry to files, see the top of this file, without those to the folders of its chapters
 * and to the folder of its module, which an older entry may have.
 * - `parts`: Parts of the path of a link.
 *
 * @param links - Links of a skill entry
 * @returns Its links to files, in their order
 */
export function documentLinksOf(links: Link[]): Link[] {
    return links.filter((link: Link): boolean => {
        const parts: string[] = link.path.split("/");
        return !chapterLinkIs(link) && !(link.fingerprint === "" && moduleIs(link.path) && parts.length === 2);
    });
}

/**
 * Builds the links of a skill entry, its `ATTACH`es, one line each, see the top of this file: the documents it used,
 * each a file of its module with its fingerprint, each once, with its topic, see {@link topicFor}. A document
 * the entry links already keeps its link with its fingerprint, also when the reader could not find it any more,
 * and takes its new topic; one it links without fingerprint, like the slides a lecture of my plan links, gets
 * its fingerprint, or stays as written while its file is not there yet, like the slides of a lecture to come.
 * The folder of its skill is the `ALTREP` of its `SUMMARY`, its chapters its `X-CHAPTER`s.
 * - `folder`: Folder of the skill from `NomWorkspace`, see {@link skillFolderOf}, `undefined` for none.
 * - `path`: Path of a document from `NomWorkspace`.
 * - `kept`: The entry's link to that document, `undefined` for none.
 * - `topic`: Topic of the document.
 *
 * @param code - Name of the skill, like `IN2028` or `WokFlow`
 * @param documents - Paths of the documents from the folder of the skill,
 *   like `VO_…/04_LogisticRegression.pdf`, as the reader offered them, none for none
 * @param topics - Topics sent from the dialog, see {@link Topics}, none from anywhere else
 * @param links - Links the entry has, none for a new entry
 * @returns The links of its documents
 * @throws {Error} - When a document is none of the module's
 */
export function linksOf(code: string, documents: string[], topics: Topics, links: Link[]): Link[] {
    const folder: string | undefined = skillFolderOf(code);
    if (folder === undefined)
        return [];
    return [...new Set(documents)].map((document: string): Link => {
        const path: string = `${folder}/${document}`;
        const kept: Link | undefined = links.find((link: Link): boolean => link.path === path);
        const topic: string = topicFor(topics[document], kept, document.split("/").at(-1) ?? "");
        if (kept !== undefined && (kept.fingerprint !== "" || !existsSync(diskOf(path))))
            return { ...kept, topic: topic };
        if (!moduleIs(folder)
            || !moduleContentsRead(folder.slice(modulesFolder.length + 1)).documents.includes(document))
            throw new Error(`No document ${document} in ${code}`);
        return { path: path, fingerprint: fingerprintOf(diskOf(path)), topic: topic };
    });
}

/**
 * Repairs the links of a skill entry that lead nowhere, see the top of this file: each document by its fingerprint
 * among the documents of the module of the entry, each folder of a chapter an older entry links by its name
 * in the module folder found now, else in its drafts, like after the module folder was renamed or a draft
 * was checked; each keeps its topic. The folder of a module in an older `ATTACH` stays as it is.
 * - `folder`: Name of the folder of the entry's module, as found now, `undefined` for none, like for a project.
 * - `repaired`: The links as repaired so far, in their order.
 * - `missing`: The links that stay as written.
 * - `name`: Name of the folder of a chapter.
 * - `chapter`: Path of the folder of a chapter of that name in the module folder found now, or in its drafts,
 *   `undefined` for none.
 * - `found`: Path of the document with the fingerprint from the module folder, `undefined` for none.
 *
 * @param entry - Skill entry of the log
 * @returns Its links, those repaired with their new paths, and the links that stay lost
 */
function linksRepairOf(entry: Entry): [Link[], Link[]] {
    const folder: string | undefined = moduleFolderOf(entry.module);
    const missing: Link[] = [];
    const repaired: Link[] = entry.links.map((link: Link): Link => {
        if ((link.fingerprint === "" && !chapterLinkIs(link)) || existsSync(diskOf(link.path)))
            return link;
        if (link.fingerprint === "") {
            const name: string = link.path.split("/").at(-1) ?? "";
            const chapter: string | undefined = folder === undefined ? undefined
                : [`${modulesFolder}/${folder}/${name}`, `${draftsFolder}/${folder}/${name}`]
                    .find((path: string): boolean => existsSync(diskOf(path)));
            if (chapter !== undefined)
                return { ...link, path: chapter };
            missing.push(link);
            return link;
        }
        const found: string | undefined = folder === undefined ? undefined
            : moduleContentsRead(folder).documents.find((document: string): boolean =>
                fingerprintOf(join(diskOf(`${modulesFolder}/${folder}`), ...document.split("/"))) === link.fingerprint);
        if (found !== undefined)
            return { ...link, path: `${modulesFolder}/${folder}/${found}` };
        missing.push(link);
        return link;
    });
    return [repaired, missing];
}

/**
 * Writes a lost link as the skill view lists it, see {@link LinkLost}: a file of a module by its path in its module
 * folder, whatever that folder is called now, a file of a project by its path in the project's folder,
 * a folder by its path from `NomWorkspace`.
 * - `parts`: The parts of its path.
 *
 * @param entry - Skill entry of the log
 * @param path - Path of its link that leads nowhere, from `NomWorkspace`
 * @returns The lost link with its entry's day and skill, like `2026-10-13`,
 *   `IN2028_BusinessAnalyticsMachineLearning (VO)`, `VO_…/04_Old.pdf`
 */
function lostOf(entry: Entry, path: string): LinkLost {
    const parts: string[] = path.split("/");
    let shown: string = path;
    if (path !== entry.titleLink && moduleIs(path) && parts.length > 2)
        shown = parts.slice(2).join("/");
    else if (entry.titleLink !== "" && path.startsWith(`${entry.titleLink}/`))
        shown = path.slice(entry.titleLink.length + 1);
    return { day: berlinDateOf(new Date(entry.start)), skill: entry.title, path: shown };
}

/**
 * Prints a repair of a link of a skill entry into the reader's console, like `Repaired a link
 * of IN2028_BusinessAnalyticsMachineLearning (VO) on 2026-10-13 at 14:00: NomSkillingmodules/IN2028_…/04_Old.pdf
 * is now NomSkillingmodules/IN2028_…/04_New.pdf`.
 *
 * @param entry - Skill entry of the log, as it was
 * @param old - Path of the link as it was
 * @param path - Path of the link now
 */
function repairPrint(entry: Entry, old: string, path: string): void {
    console.log(new Date().toISOString(), `Repaired a link of ${entry.title}`
        + ` on ${berlinDateOf(new Date(entry.start))} at ${berlinTimeOf(new Date(entry.start))}:`
        + ` ${old} is now ${path}`);
}

/**
 * Repairs the folder of a skill entry, the `ALTREP` of its `SUMMARY`, when it leads nowhere: a module folder found
 * again by the code of the entry's module, see `moduleFolderOf` in `notes.ts`, its `SUMMARY` then naming the folder
 * found, see {@link skillTitleOf}; the folder of a project stays as written.
 * - `folder`: Name of the folder of the entry's module, as found now, `undefined` for none.
 * - `fields`: Fields and times of the entry, its `SUMMARY` and its `ALTREP` repaired.
 *
 * @param file - `.ics` file of the entry
 * @param entry - Skill entry of the log
 * @returns Whether its folder leads somewhere now
 */
function folderRepair(file: string, entry: Entry): boolean {
    if (entry.titleLink === "" || existsSync(diskOf(entry.titleLink)))
        return true;
    const folder: string | undefined = moduleIs(entry.titleLink) ? moduleFolderOf(entry.module) : undefined;
    if (folder === undefined)
        return false;

    const fields: EntryFields = {
        ...entry, title: skillTitleOf(entry.module, entry.type), titleLink: `${modulesFolder}/${folder}`,
        start: new Date(entry.start), end: new Date(entry.end),
    };
    entryChange(file, entry, fields, file);
    repairPrint(entry, entry.titleLink, fields.titleLink);
    return true;
}

/**
 * Checks every link of the skill entries of the whole log, up to a year after now, see the top of this file:
 * the folder of each, the `ALTREP` of its `SUMMARY`, see {@link folderRepair}, then its documents and chapters, see
 * {@link linksRepairOf}; writes the repaired links into their entries, prints each repair, see {@link repairPrint},
 * and keeps the links it could not repair for the skill view. Entries that cannot be changed stay as they are.
 * - `entries`: Skill entries of the log with links.
 * - `file`: `.ics` file of an entry.
 * - `folderFound`: Whether the folder of an entry leads somewhere now.
 * - `links`, `missing`: The links of an entry to files as repaired, and those that stay lost.
 *
 * @throws {Error} - When a module folder or file cannot be read, or the log cannot be written
 */
export function linksCheck(): void {
    const entries: Entry[] = logRead()
        .filter((entry: Entry): boolean => entry.category === skillName && entry.editable
            && (entry.titleLink !== "" || entry.links.length > 0))
        .sort((first: Entry, second: Entry): number => first.start.localeCompare(second.start));
    lost = entries.flatMap((entry: Entry): LinkLost[] => {
        const [file]: [string, Entry] = entryFind(skillLog, entry.id);
        const folderFound: boolean = folderRepair(file, entry);
        const [links, missing]: [Link[], Link[]] = linksRepairOf(entry);
        if (links.some((link: Link, index: number): boolean => link.path !== entry.links[index].path)) {
            propertiesPut(file, entry.id, [["attach", links]]);
            links.forEach((link: Link, index: number): void => {
                if (link.path !== entry.links[index].path)
                    repairPrint(entry, entry.links[index].path, link.path);
            });
        }
        return [...(folderFound ? [] : [entry.titleLink]), ...missing.map((link: Link): string => link.path)]
            .map((path: string): LinkLost => lostOf(entry, path));
    });
}

/**
 * Checks every link now, see {@link linksCheck}, and again every night at 04:00 in Berlin time, as long as the reader
 * runs; a failed check is printed and waits for the next.
 * - `check`: Checks the links, then waits for the next 04:00.
 * - `now`: The moment of the check.
 * - `next`: The next 04:00 after it, of today or of tomorrow.
 */
export function linksCheckStart(): void {
    const check: () => void = (): void => {
        try {
            linksCheck();
        } catch (error: unknown) {
            console.error(new Date().toISOString(), "The check of the links failed", error);
        }
        const now: Date = new Date();
        let next: Date = berlinInstantOf(berlinDateOf(now), checkHour);
        if (next <= now)
            next = berlinInstantOf(dayAdd(berlinDateOf(now), 1), checkHour);
        setTimeout(check, next.getTime() - now.getTime());
    };
    check();
}

/**
 * Gives the links the last check could not repair, see {@link linksCheck}.
 *
 * @returns Lost links in the order of their entries, like `2026-10-13`, `IN2028_BusinessAnalyticsMachineLearning (VO)`,
 *   `VO_…/04_Old.pdf`
 */
export function linksLostRead(): LinkLost[] {
    return lost;
}

/**
 * Reads a file a skill entry of the log links, to send it read only, so the page opens it in the browser's own viewer,
 * like the slides of a lecture as PDF; no other file, and none outside `NomWorkspace` or hidden, like `.git`.
 * - `linked`: Whether a skill entry of the whole log links the file, see {@link linksCheck}.
 * - `file`: Path of the file on the disk.
 * - `hidden`: Whether a part of the path starts with `.`, like `..` or `.git`.
 *
 * @param path - Path from `NomWorkspace`, like `NomSkillingmodules/IN2028_…/VO_…/04_LogisticPoissonRegression.pdf`
 * @returns File with its content type
 * @throws {Error} - When no skill entry links the file, it lies outside `NomWorkspace` or is hidden, or it is missing
 */
export function linkedFileRead(path: string): NotesFile {
    const linked: boolean = logRead().some((entry: Entry): boolean =>
        entry.links.some((link: Link): boolean => link.fingerprint !== "" && link.path === path));
    const file: string = diskOf(path);
    const hidden: boolean = path.split("/").some((part: string): boolean => part.startsWith("."));
    if (!linked || hidden || !resolve(file).startsWith(`${resolve(vault)}${sep}`))
        throw new Error(`No linked file ${path}`);
    return { type: contentTypeOf(file), content: readFileSync(file) };
}
