/**
 * ## Documents
 *
 * Links a skill entry of the log to the folder of its skill and to the document it used, like the slides of a lecture
 * or a sheet, each with one `ATTACH`, its path from `NomWorkspace`, see `Link` in `calendar.ts`:
 * every skill entry gets the folder of its skill by itself,
 * like `ATTACH:NomSkillingmodules/IN2028_BusinessAnalyticsMachineLearning`, and the document I pick keeps
 * the fingerprint of its content, the SHA-256 of its bytes, as parameter, so the link survives a rename, like
 * `ATTACH;X-SHA256=9f86d081…:NomSkillingmodules/IN2028_…/VO_UniversityLectureLessons/TUM_2025W/04_Logistic….pdf`.
 * The reader checks every link of the whole log when it starts and every night at 04:00, see {@link linksCheckStart}:
 * a module folder that is gone, like after a rename, is found again by the code of the entry's module,
 * see `moduleFolderOf` in `notes.ts`; a document whose path no longer leads to a file, like after a rename or a move
 * into another folder of the module, is looked for by its fingerprint among the module's documents.
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
 * - `./calendar.ts`: Reads the log, finds an entry's event, puts new values into it, and writes its start
 *   and the days in Berlin time.
 * - `./categories.ts`: Names the category of skill entries.
 * - `./notes.ts`: Finds the folder of a module by its code, lists its documents, and gives the content type of a file.
 * - `./sources.ts`: Names `NomWorkspace`, the folder of my modules, the skills of the semester and the log
 *   of the skill area.
 */

import { existsSync, readFileSync, statSync } from "node:fs";
import { join, resolve, sep } from "node:path";
import { createHash } from "node:crypto";
import {
    berlinDateOf, berlinInstantOf, berlinTimeOf, dayAdd, entriesRead, entryFind, propertiesPut,
} from "./calendar.ts";
import { skillName } from "./categories.ts";
import { codeOf, contentTypeOf, moduleContentsRead, moduleFolderOf } from "./notes.ts";
import { activeModules, moduleIs, modulesFolder, projectOf, skillLog, vault } from "./sources.ts";

import type { Stats } from "node:fs";
import type { Entry, Link } from "./calendar.ts";
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
 * - `skill`: What its entry was, like `IN2028 VO`.
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
 * Builds the links of a skill entry, see the top of this file: the folder of its skill, then the document it used,
 * a file of its module with its fingerprint; a document the entry links already keeps its link as it is,
 * also when the reader could not find it any more.
 * - `folder`: Folder of the skill from `NomWorkspace`, see {@link skillFolderOf}.
 * - `path`: Path of the document from `NomWorkspace`.
 * - `kept`: The entry's link to that document, `undefined` for none.
 *
 * @param code - Name of the skill, like `IN2028` or `WokFlow`
 * @param document - Path of the document from the folder of the skill, like `VO_…/04_LogisticPoissonRegression.pdf`,
 *   as the reader offered it, empty for none
 * @param links - Links the entry has, none for a new entry
 * @returns Links, the folder first; none for a skill without folder
 * @throws {Error} - When the document is none of the module's
 */
export function linksOf(code: string, document: string, links: Link[]): Link[] {
    const folder: string | undefined = skillFolderOf(code);
    if (folder === undefined)
        return [];
    if (document === "")
        return [{ path: folder, fingerprint: "" }];

    const path: string = `${folder}/${document}`;
    const kept: Link | undefined = links.find((link: Link): boolean => link.fingerprint !== "" && link.path === path);
    if (kept !== undefined)
        return [{ path: folder, fingerprint: "" }, kept];
    if (!moduleIs(folder) || !moduleContentsRead(folder.slice(modulesFolder.length + 1)).documents.includes(document))
        throw new Error(`No document ${document} in ${code}`);
    return [{ path: folder, fingerprint: "" }, { path: path, fingerprint: fingerprintOf(diskOf(path)) }];
}

/**
 * Repairs the links of a skill entry that lead nowhere, see the top of this file: first its folder, a module folder
 * found again by the code of its module, then each document, by its fingerprint among the documents of that module.
 * - `folder`: Name of the folder of the entry's module, as found now, `undefined` for none, like for a project.
 * - `repaired`: The links as repaired so far, in their order.
 * - `missing`: The links that stay as written.
 * - `found`: Path of the document with the fingerprint from the module folder, `undefined` for none.
 *
 * @param entry - Skill entry of the log
 * @returns Its links, those repaired with their new paths, and the links that stay lost
 */
function linksRepairOf(entry: Entry): [Link[], Link[]] {
    const folder: string | undefined = moduleFolderOf(entry.module);
    const missing: Link[] = [];
    const repaired: Link[] = entry.links.map((link: Link): Link => {
        if (existsSync(diskOf(link.path)))
            return link;
        if (link.fingerprint === "" && moduleIs(link.path) && folder !== undefined)
            return { path: `${modulesFolder}/${folder}`, fingerprint: "" };
        const found: string | undefined = link.fingerprint === "" || folder === undefined ? undefined
            : moduleContentsRead(folder).documents.find((document: string): boolean =>
                fingerprintOf(join(diskOf(`${modulesFolder}/${folder}`), ...document.split("/"))) === link.fingerprint);
        if (found !== undefined)
            return { path: `${modulesFolder}/${folder}/${found}`, fingerprint: link.fingerprint };
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
 * - `folder`: The link of the entry to the folder of its project the link lies in, `undefined` for none.
 *
 * @param entry - Skill entry of the log
 * @param link - Its link that leads nowhere
 * @returns The lost link with its entry's day and skill, like `2026-10-13`, `IN2028 VO`, `VO_…/04_Old.pdf`
 */
function lostOf(entry: Entry, link: Link): LinkLost {
    const parts: string[] = link.path.split("/");
    const folder: Link | undefined = entry.links.find((own: Link): boolean =>
        own.fingerprint === "" && link.path.startsWith(`${own.path}/`));
    let path: string = link.path;
    if (link.fingerprint !== "" && moduleIs(link.path) && parts.length > 2)
        path = parts.slice(2).join("/");
    else if (folder !== undefined)
        path = link.path.slice(folder.path.length + 1);
    return { day: berlinDateOf(new Date(entry.start)), skill: entry.title, path: path };
}

/**
 * Checks every link of the skill entries of the whole log, up to a year after now, see the top of this file:
 * writes the repaired links into their entries, prints each repair, like `Repaired a link of IN2028 VO
 * on 2026-10-13 at 14:00: NomSkillingmodules/IN2028_…/04_Old.pdf is now NomSkillingmodules/IN2028_…/04_New.pdf`,
 * and keeps the links it could not repair for the skill view. Entries that cannot be changed stay as they are.
 * - `entries`: Skill entries of the log with links.
 * - `links`, `missing`: The links of an entry as repaired, and those that stay lost.
 * - `file`: `.ics` file of an entry with a repair.
 *
 * @throws {Error} - When a module folder or file cannot be read, or the log cannot be written
 */
export function linksCheck(): void {
    const entries: Entry[] = logRead()
        .filter((entry: Entry): boolean => entry.category === skillName && entry.editable && entry.links.length > 0)
        .sort((first: Entry, second: Entry): number => first.start.localeCompare(second.start));
    lost = entries.flatMap((entry: Entry): LinkLost[] => {
        const [links, missing]: [Link[], Link[]] = linksRepairOf(entry);
        if (links.some((link: Link, index: number): boolean => link.path !== entry.links[index].path)) {
            const [file]: [string, Entry] = entryFind(skillLog, entry.id);
            propertiesPut(file, entry.id, [["attach", links]]);
            links.forEach((link: Link, index: number): void => {
                if (link.path !== entry.links[index].path)
                    console.log(new Date().toISOString(), `Repaired a link of ${entry.title}`
                        + ` on ${berlinDateOf(new Date(entry.start))} at ${berlinTimeOf(new Date(entry.start))}:`
                        + ` ${entry.links[index].path} is now ${link.path}`);
            });
        }
        return missing.map((link: Link): LinkLost => lostOf(entry, link));
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
 * @returns Lost links in the order of their entries, like `2026-10-13`, `IN2028 VO`, `VO_…/04_Old.pdf`
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
