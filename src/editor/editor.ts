/**
 * ## Editor
 *
 * Edits a draft note as its text, its Markdown shown as in the notes view away from the cursor, see `./preview.ts`.
 * It edits the text of the file itself: saving writes exactly the edited text, nothing reformatted,
 * tabs, spacers `⠀` and soft hyphens, spaces at the ends of lines and the line breaks of the file as they were.
 * The reader writes only the unchecked drafts and keeps each change as a diff, so the AI learns my style from my corrections;
 * any other note opens to read only.
 * The address names the note by its path in the notes view, like
 * `/edit?path=Drafts/IN2028_BusinessAnalyticsMachineLearning/01_RegressionAnalysis/01_01_EstimatorConfidenceInterval.md`.
 * Saves with the save button or Ctrl+S, refused when the file changed on the disk since it was read,
 * and asks before leaving with changes unsaved.
 *
 * - `@codemirror/state`, `@codemirror/view`: The editor, CodeMirror 6, the engine of Obsidian's editor.
 * - `@codemirror/commands`: Undo, redo and the usual keys, Tab indenting a line.
 * - `@codemirror/language`: Reads the note as Markdown, indents with tabs.
 * - `@lezer/markdown`: Markdown parser, with GitHub's tables and the Obsidian syntax of `./syntax.ts`.
 * - `lucide`: The check of the save button, as the dialogs have it.
 * - `../icons.ts`: Puts the icon into the save button.
 * - `./syntax.ts`: Obsidian syntax for the Markdown parser.
 * - `./preview.ts`: Shows the Markdown as in the notes view.
 * - `../notes/notes.css`: Look of the notes, for the rendered formulas, tables and images.
 * - `./editor.css`: Look of the editor.
 */

import { EditorState } from "@codemirror/state";
import { EditorView, drawSelection, keymap } from "@codemirror/view";
import { defaultKeymap, history, historyKeymap, indentWithTab } from "@codemirror/commands";
import { Language, defineLanguageFacet, indentUnit } from "@codemirror/language";
import { GFM, parser } from "@lezer/markdown";
import { Check } from "lucide";
import { iconPut } from "../icons.ts";
import { obsidianSyntax } from "./syntax.ts";
import { livePreview } from "./preview.ts";
import "../notes/notes.css";
import "./editor.css";

import type { Extension } from "@codemirror/state";
import type { ViewUpdate } from "@codemirror/view";
import type { Links } from "./preview.ts";


/**
 * A note with the files its links lead to, as the reader sends it.
 *
 * - `path`: Path of the note.
 * - `text`: Text of the note, as it lies in the file.
 * - `links`: For each link of the note as written, the path of the file it leads to, `null` when it leads nowhere.
 */
type LinkedNote = {
    path: string;
    text: string;
    links: Links;
};

/**
 * Markdown as my notes are written: CommonMark with GitHub's tables, task lists, strikethrough and links,
 * and the Obsidian syntax of `./syntax.ts`.
 */
const markdownLanguage: Language = new Language(defineLanguageFacet(), parser.configure([GFM, obsidianSyntax]), [], "markdown");

/**
 * Path of the note, as the notes view takes it.
 */
let path: string = "";

/**
 * Text of the note as it lies in the file: as read, then as saved last.
 */
let saved: string = "";

/**
 * Whether a save is on its way.
 */
let saving: boolean = false;

/**
 * The editor, once the note is read.
 */
let view: EditorView;


/**
 * Shows whether the note has changes not yet saved: the save button in the calm grey of a main button while it has,
 * and beside it a notice, like `Saved`, else `Unsaved` while it has changes.
 * - {@link EditorState#sliceDoc}: Gives the text, its lines joined by the line break of the file.
 *
 * @param notice - Notice of the moment, like `Saved`, empty for none
 */
function stateShow(notice: string): void {
    const unsaved: boolean = view.state.sliceDoc() !== saved;
    (document.getElementById("editor-save") as HTMLElement).classList.toggle("unsaved", unsaved);
    let text: string = notice;
    if (text === "" && unsaved)
        text = "Unsaved";
    (document.getElementById("editor-state") as HTMLElement).textContent = text;
}

/**
 * Saves the note: sends its text to the reader with the text it had when read or saved last;
 * the reader writes it, and its change as a diff, when the file has not changed since.
 * Does nothing while a save is on its way, when nothing changed, or for a note to read only.
 */
async function noteSave(): Promise<void> {
    const text: string = view.state.sliceDoc();
    if (saving || text === saved || view.state.readOnly)
        return;

    saving = true;
    try {
        const response: Response = await fetch("/api/edit/note", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ path: path, base: saved, text: text }),
        });
        if (response.ok) {
            saved = text;
            stateShow("Saved");
        } else if (response.status === 409) {
            stateShow("Not saved: it changed on the disk, reload it");
        } else {
            stateShow("Not saved");
        }
    } catch (error: unknown) {
        console.error(error);
        stateShow("Not saved: the reader is not running");
    } finally {
        saving = false;
    }
}

/**
 * Saves on Ctrl+S, Cmd+S on a Mac, also while the cursor is outside the text, instead of the browser saving the page.
 *
 * @param event - Key pressed anywhere in the page
 */
function keyDown(event: KeyboardEvent): void {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        noteSave();
    }
}

/**
 * Builds the extensions of the editor for a note.
 * - `lineSeparator`: Splits and joins the lines by the line break of the file, `\r\n` or `\n`,
 *   so saving writes the line breaks as they were, also a single other one, which stays inside its line.
 * - `readOnly`: Lets me read a note that is no draft, never change it.
 * - `indentUnit`: Indents with a tab, as my notes do.
 * - `lineWrapping`: Wraps long lines at the reading width, as the notes view does, so I see where a line overflows.
 * - `darkTheme`: Draws cursor and selection for a dark page.
 * - `updateListener`: Shows whether the note has unsaved changes after each change of the text.
 *
 * @param note - Note with the files its links lead to
 * @returns Extensions
 */
function extensionsOf(note: LinkedNote): Extension[] {
    return [
        EditorState.lineSeparator.of(note.text.includes("\r\n") ? "\r\n" : "\n"),
        EditorState.readOnly.of(!path.startsWith("Drafts/")),
        markdownLanguage,
        indentUnit.of("\t"),
        history(),
        drawSelection(),
        keymap.of([...defaultKeymap, ...historyKeymap, indentWithTab]),
        EditorView.lineWrapping,
        EditorView.darkTheme.of(true),
        livePreview(note.links),
        EditorView.updateListener.of((update: ViewUpdate): void => {
            if (update.docChanged)
                stateShow("");
        }),
    ];
}


/**
 * Starts the editor after the router has put its HTML into the page: reads the note the address names
 * and shows it to edit, with the save button, Ctrl+S, and a question before leaving with changes unsaved;
 * a note that cannot be read shows a hint instead.
 * - `beforeunload`: Comes before the page closes or loads again; `preventDefault` makes the browser ask.
 */
export async function editorStart(): Promise<void> {
    path = new URLSearchParams(location.search).get("path") ?? "";
    (document.getElementById("editor-title") as HTMLElement).textContent = path.split("/").at(-1)?.replace(/\.md$/i, "") ?? "";
    const response: Response | null = path === "" ? null : await fetch(`/api/notes/note?path=${encodeURIComponent(path)}`);
    if (response === null || !response.ok) {
        (document.getElementById("editor-state") as HTMLElement).textContent = "This note cannot be read";
        return;
    }

    const note: LinkedNote = await response.json() as LinkedNote;
    saved = note.text;
    view = new EditorView({
        parent: document.getElementById("editor-text") as HTMLElement,
        state: EditorState.create({ doc: note.text, extensions: extensionsOf(note) }),
    });
    const save: HTMLElement = document.getElementById("editor-save") as HTMLElement;
    iconPut(save, Check, "Save");
    save.addEventListener("click", noteSave);
    save.hidden = view.state.readOnly;
    stateShow(view.state.readOnly ? "Read only: only drafts can be edited" : "");
    window.addEventListener("keydown", keyDown);
    window.addEventListener("beforeunload", (event: BeforeUnloadEvent): void => {
        if (view.state.sliceDoc() !== saved)
            event.preventDefault();
    });
}
