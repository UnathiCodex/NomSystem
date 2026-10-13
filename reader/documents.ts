/**
 * ## Documents
 *
 * Links a skill entry of the log to the university document it used, like the slides of a lecture or a sheet,
 * so that the link survives a rename: the entry keeps the document's path from its module folder together with
 * a fingerprint of its content, the SHA-256 of its bytes, in one line `X-DOCUMENT`, like
 * `X-DOCUMENT:VO_UniversityLectureLessons/TUM_2025W/04_LogisticPoissonRegression.pdf;9f86d081…`.
 * When the path no longer leads to a file, like after a rename or a move into another folder of the module,
 * the reader looks for the fingerprint among the module's documents and repairs the link in the entry,
 * every other line of the file as it is; it prints each repair into its console, with the old and the new path.
 * A link whose fingerprint is nowhere in the module, like after the file was deleted, stays as written.
 * Fingerprints are kept by path, size and time of change, so only new or changed files are read again.
 *
 * - `node:fs`: Reads files and their sizes and times of change.
 * - `node:path`: Builds file paths for the operating system.
 * - `node:crypto`: Computes the SHA-256 of a file.
 * - `./calendar.ts`: Finds an entry's event in the log, puts new values into it, and writes its start in Berlin time.
 * - `./notes.ts`: Finds the folder of a module by its code and lists its documents.
 * - `./sources.ts`: Names the folder of my modules and the log of the skill area.
 */

import { existsSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { createHash } from "node:crypto";
import { berlinDateOf, berlinTimeOf, entryFind, propertiesPut } from "./calendar.ts";
import { moduleContentsRead, moduleFolderOf } from "./notes.ts";
import { notes, skillLog } from "./sources.ts";

import type { Stats } from "node:fs";
import type { Entry } from "./calendar.ts";


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
 * Fingerprints computed so far, by the path of their file on the disk.
 */
const fingerprints: Map<string, Fingerprint> = new Map();


/**
 * Builds the path on the disk of a document of a module.
 *
 * @param folder - Name of the module folder, like `IN2028_BusinessAnalyticsMachineLearning`
 * @param path - Path of the document from the module folder, like `VO_UniversityLectureLessons/TUM_2025W/04_…pdf`
 * @returns Path on the disk
 */
function fileOf(folder: string, path: string): string {
    return join(notes.modules, folder, ...path.split("/"));
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
 * Splits the value of an `X-DOCUMENT` at its last `;` into the document's path and its fingerprint.
 * - `end`: Place of the last `;`, -1 for none.
 *
 * @param value - Value like `VO_UniversityLectureLessons/TUM_2025W/04_LogisticPoissonRegression.pdf;9f86d081…`
 * @returns Path from the module folder and fingerprint, empty when the value has none
 */
export function documentPartsOf(value: string): [string, string] {
    const end: number = value.lastIndexOf(";");
    if (end === -1)
        return [value, ""];
    return [value.slice(0, end), value.slice(end + 1)];
}

/**
 * Writes the value of an `X-DOCUMENT` for a document of a module: its path with its fingerprint after `;`.
 * - `folder`: Module folder of the code.
 *
 * @param code - Module code, like `IN2028`
 * @param path - Path of the document from the module folder, as the reader offered it
 * @returns Value like `VO_UniversityLectureLessons/TUM_2025W/04_LogisticPoissonRegression.pdf;9f86d081…`
 * @throws {Error} - When the module has no folder or the path is none of its documents
 */
export function documentValueOf(code: string, path: string): string {
    const folder: string | undefined = moduleFolderOf(code);
    if (folder === undefined || !moduleContentsRead(folder).documents.includes(path))
        throw new Error(`No document ${path} in ${code}`);
    return `${path};${fingerprintOf(fileOf(folder, path))}`;
}

/**
 * Repairs the document links of skill entries of the log whose path no longer leads to a file, see the top of this file:
 * finds the document with the same fingerprint in the module folder, writes its path into the entry's `X-DOCUMENT`
 * and prints the repair, like `Repaired the document of IN2028 VO on 2026-10-13 at 14:00: VO_…/04_Old.pdf is now VO_…/04_New.pdf`.
 * Entries without document, with a document in its place, or that cannot be changed stay as they are.
 * - `path`, `fingerprint`: Path and fingerprint of the document of the entry.
 * - `folder`: Module folder of the entry, `undefined` when the module has none.
 * - `found`: Path of the document with the fingerprint, `undefined` when there is none.
 * - `value`: Repaired value of the `X-DOCUMENT`.
 * - `file`: `.ics` file of the entry.
 *
 * @param entries - Entries of the log, like those of a day
 * @returns The same entries, each repaired one with its new document
 * @throws {Error} - When a module folder or file cannot be read, or the log cannot be written
 */
export function documentsRepair(entries: Entry[]): Entry[] {
    return entries.map((entry: Entry): Entry => {
        const [path, fingerprint]: [string, string] = documentPartsOf(entry.document);
        if (entry.document === "" || !entry.editable || fingerprint === "")
            return entry;
        const folder: string | undefined = moduleFolderOf(entry.module);
        if (folder === undefined || existsSync(fileOf(folder, path)))
            return entry;

        const found: string | undefined = moduleContentsRead(folder).documents
            .find((document: string): boolean => fingerprintOf(fileOf(folder, document)) === fingerprint);
        if (found === undefined)
            return entry;

        const value: string = `${found};${fingerprint}`;
        const [file]: [string, Entry] = entryFind(skillLog, entry.id);
        propertiesPut(file, entry.id, [["x-document", [value]]]);
        console.log(new Date().toISOString(), `Repaired the document of ${entry.title} on ${berlinDateOf(new Date(entry.start))}`
            + ` at ${berlinTimeOf(new Date(entry.start))}: ${path} is now ${found}`);
        return { ...entry, document: value };
    });
}
