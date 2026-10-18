/**
 * ## Edit
 *
 * Writes a note of my modules as I saved it in the editor, right at its place in `NomSkillingmodules`:
 * exactly the text sent, nothing reformatted, without a diff, as a file of my new system, see `files.ts`.
 * Paths are those of the scripts view, from `NomSkillingmodules`, like
 * `IN2028_BusinessAnalyticsMachineLearning/01_RegressionAnalysis/01_01_SampleMeanEstimator.md`.
 *
 * - `node:fs`: Reads and writes files.
 * - `node:path`: Builds file paths for the operating system.
 * - `./sources.ts`: Names the folder of my modules.
 */

import { readFileSync, realpathSync, statSync, writeFileSync } from "node:fs";
import { extname, join, sep } from "node:path";
import { notes } from "./sources.ts";


/**
 * A note as I saved it in the editor.
 *
 * - `path`: Path of the note, see the top of this file.
 * - `base`: Text of the note when the editor read it or saved it last, to tell whether the file changed since.
 * - `text`: Text to write.
 */
export type NoteChange = {
    path: string;
    base: string;
    text: string;
};


/**
 * Turns the path of a note into its file on the disk, only for a note `.md` of my modules that exists.
 * - {@link realpathSync}: Makes a path absolute and follows symbolic links, so no link leads outside.
 *
 * @param path - Path like `IN2028_BusinessAnalyticsMachineLearning/01_RegressionAnalysis/01_01_SampleMeanEstimator.md`
 * @returns File on the disk
 * @throws {Error} - When the path lies outside `NomSkillingmodules`, has a hidden part like `.obsidian` or `..`,
 *   is no note `.md`, or nothing lies there
 */
function noteFileOf(path: string): string {
    const root: string = realpathSync(notes.modules);
    const file: string = realpathSync(join(root, path));
    const parts: string[] = file.slice(root.length + 1).split(sep);
    if (!file.startsWith(`${root}${sep}`) || parts.some((part: string): boolean => part.startsWith("."))
        || extname(file).toLowerCase() !== ".md" || !statSync(file).isFile())
        throw new Error(`No writing but notes of my modules: ${path}`);
    return file;
}


/**
 * Writes a note of my modules as I saved it, exactly the text sent, when its file did not change since the editor
 * read it. A text without change writes nothing.
 * - `file`: The file on the disk.
 * - `bytes`, `old`: What it holds now, as bytes and as text.
 *
 * @param change - Note as saved
 * @returns Whether it is written, `false` when its file changed since the editor read it
 * @throws {Error} - When it is no note of my modules, see {@link noteFileOf}, or its file is no UTF-8 text,
 *   which could not be written back exactly
 */
export function noteWrite(change: NoteChange): boolean {
    const file: string = noteFileOf(change.path);
    const bytes: Buffer = readFileSync(file);
    const old: string = bytes.toString("utf8");
    if (!Buffer.from(old, "utf8").equals(bytes))
        throw new Error(`No UTF-8 text, so not written: ${change.path}`);
    if (old !== change.base)
        return false;
    if (change.text !== old)
        writeFileSync(file, change.text);
    return true;
}
