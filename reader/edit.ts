/**
 * ## Edit
 *
 * Writes a note of my modules as I saved it in the editor, right at its place in `NomSkillingmodules`:
 * exactly the text sent, nothing reformatted, and first keeps the change as a unified diff in the folder of my edits,
 * so the AI can turn my corrections into rules of my style, see `editor` in `sources.ts`.
 * Paths are those of the scripts view, from `NomSkillingmodules`, like
 * `IN2028_BusinessAnalyticsMachineLearning/01_RegressionAnalysis/01_01_SampleMeanEstimator.md`.
 *
 * - `node:fs`: Reads and writes files.
 * - `node:path`: Builds file paths for the operating system.
 * - `diff`: Writes a change as a unified diff, as `git diff` does.
 * - `temporal-polyfill`: Gives the time in Berlin, for the name of a diff.
 * - `./sources.ts`: Names the folder of my modules and the folder of my edits.
 */

import { appendFileSync, mkdirSync, readFileSync, realpathSync, statSync, writeFileSync } from "node:fs";
import { basename, extname, join, sep } from "node:path";
import { createTwoFilesPatch, FILE_HEADERS_ONLY } from "diff";
import { Temporal } from "temporal-polyfill";
import { editor } from "./sources.ts";


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
    const root: string = realpathSync(editor.modules);
    const file: string = realpathSync(join(root, path));
    const parts: string[] = file.slice(root.length + 1).split(sep);
    if (!file.startsWith(`${root}${sep}`) || parts.some((part: string): boolean => part.startsWith("."))
        || extname(file).toLowerCase() !== ".md" || !statSync(file).isFile())
        throw new Error(`No writing but notes of my modules: ${path}`);
    return file;
}

/**
 * Writes the time now in Berlin for the name of a diff, so the diffs sort by time.
 *
 * @returns Time like `2026-10-10_213501`
 */
function stampOf(): string {
    return Temporal.Now.plainDateTimeISO("Europe/Berlin").toString({ smallestUnit: "second" })
        .replace("T", "_").replaceAll(":", "");
}


/**
 * Writes a note of my modules as I saved it, when its file did not change since the editor read it:
 * first its change as a unified diff into the folder of my edits, named by the time and the note,
 * like `2026-10-10_213501_01_01_SampleMeanEstimator.diff`, a second save in the same second added to it;
 * then the text, exactly as sent. A text without change writes nothing.
 * - {@link createTwoFilesPatch}: Writes the change as `git diff` does, with the path of the note
 *   in `NomSkillingmodules`.
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
    if (change.text === old)
        return true;

    mkdirSync(editor.edits, { recursive: true });
    appendFileSync(join(editor.edits, `${stampOf()}_${basename(file, extname(file))}.diff`),
        createTwoFilesPatch(`a/${change.path}`, `b/${change.path}`, old, change.text, undefined, undefined,
            { headerOptions: FILE_HEADERS_ONLY }));
    writeFileSync(file, change.text);
    return true;
}
