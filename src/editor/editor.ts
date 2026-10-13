/**
 * ## Editor
 *
 * Edits a draft note or a Markdown file of my new system as its text, its Markdown shown as in the notes view
 * away from the cursor, see `./preview.ts`.
 * It edits the text of the file itself: saving writes exactly the edited text, nothing reformatted,
 * tabs, spacers `⠀` and soft hyphens, spaces at the ends of lines and the line breaks of the file as they were.
 * Of my modules the reader writes only the unchecked drafts and keeps each change as a diff, so the AI learns my style
 * from my corrections; any other note opens to read only.
 * One view with the notes view: on the left the same tree with its two roots, see `../notes/tree.ts`;
 * in `NomManageplannings` a click on a Markdown file of the three folders of my new system, like `Foods.md`,
 * `Places.md` or a daily note, opens it here to edit, saved back into its file without a diff; an `.ics` file opens
 * as its plain text, to read only; any other file shows in the tree, faint, and opens not.
 * A note of `NomSkillingmodules` opens in the notes view, a draft from there by its pencil here.
 * The address names a file of my new system by its path in the tree, like `/edit?file=NomMetainformations/Foods.md`,
 * and a draft by its path in the notes view, like
 * `/edit?path=Drafts/IN2028_BusinessAnalyticsMachineLearning/01_RegressionAnalysis/01_01_EstimatorConfidenceInterval.md`.
 * Saves with the save button or Ctrl+S, refused when the file changed on the disk since it was read,
 * and asks before leaving with changes unsaved, also for another file of the tree.
 *
 * - `@codemirror/state`, `@codemirror/view`: The editor, CodeMirror 6, the engine of Obsidian's editor.
 * - `@codemirror/commands`: Undo, redo and the usual keys, Tab indenting a line.
 * - `@codemirror/language`: Reads the note as Markdown, indents with tabs.
 * - `@lezer/markdown`: Markdown parser, with GitHub's tables and the Obsidian syntax of `./syntax.ts`.
 * - `lucide`: The check of the save button, as the dialogs have it.
 * - `../icons.ts`: Puts the icon into the save button.
 * - `./syntax.ts`: Obsidian syntax for the Markdown parser.
 * - `./preview.ts`: Shows the Markdown as in the notes view.
 * - `../notes/tree.ts`: Shows the tree with its two roots, the file shown marked.
 * - `../notes/notes.css`: Look of the notes, for the rendered formulas, tables and images, and of the tree.
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
import { treeShow } from "../notes/tree.ts";
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
 * A file of my new system, as the reader sends it.
 *
 * - `path`: Its path in the tree, like `NomMetainformations/Foods.md`.
 * - `text`: Its text, as it lies in the file.
 * - `editable`: Whether I may change it: a Markdown file, not an `.ics` file.
 */
type SystemFile = {
    path: string;
    text: string;
    editable: boolean;
};

/**
 * The file the editor shows, a draft note or a file of my new system, see {@link openedRead}.
 *
 * - `text`: Its text, as it lies in the file.
 * - `links`: For a note of my modules the files its links lead to; none for a file of my new system,
 *   whose links stay as they are written.
 * - `markdown`: Whether it is Markdown, shown with its preview; else its plain text, like an `.ics` file.
 * - `editable`: Whether I may change it: a draft note or a Markdown file of my new system.
 */
type Opened = {
    text: string;
    links: Links;
    markdown: boolean;
    editable: boolean;
};

/**
 * Markdown as my notes are written: CommonMark with GitHub's tables, task lists, strikethrough and links,
 * and the Obsidian syntax of `./syntax.ts`.
 */
const markdownLanguage: Language = new Language(defineLanguageFacet(), parser.configure([GFM, obsidianSyntax]), [], "markdown");

/**
 * Path of the file: of a note as the notes view takes it, of a file of my new system as the tree names it.
 */
let path: string = "";

/**
 * Address of the reader that writes the file: `/api/edit/note` for a draft, which keeps a diff,
 * `/api/edit/file` for a file of my new system.
 */
let saveAddress: string = "/api/edit/note";

/**
 * Text of the file as it lies on the disk: as read, then as saved last.
 */
let saved: string = "";

/**
 * Whether a save is on its way.
 */
let saving: boolean = false;

/**
 * The editor, once the file is read.
 */
let view: EditorView;


/**
 * Shows whether the file has changes not yet saved: the save button in the calm grey of a main button while it has,
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
 * Saves the file: sends its text to the reader with the text it had when read or saved last;
 * the reader writes it when the file has not changed since, a draft with its change as a diff.
 * Does nothing while a save is on its way, when nothing changed, or for a file to read only.
 */
async function noteSave(): Promise<void> {
    const text: string = view.state.sliceDoc();
    if (saving || text === saved || view.state.readOnly)
        return;

    saving = true;
    try {
        const response: Response = await fetch(saveAddress, {
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
 * Builds the extensions of the editor for a file.
 * - `lineSeparator`: Splits and joins the lines by the line break of the file, `\r\n` or `\n`,
 *   so saving writes the line breaks as they were, also a single other one, which stays inside its line.
 * - `readOnly`: Lets me read a note that is no draft, or an `.ics` file, never change it.
 * - `markdownLanguage`, `livePreview`: Read a Markdown file as Markdown and show it as in the notes view;
 *   any other file stays its plain text.
 * - `indentUnit`: Indents with a tab, as my notes do.
 * - `lineWrapping`: Wraps long lines at the reading width, as the notes view does, so I see where a line overflows.
 * - `darkTheme`: Draws cursor and selection for a dark page.
 * - `updateListener`: Shows whether the file has unsaved changes after each change of the text.
 *
 * @param opened - The file
 * @returns Extensions
 */
function extensionsOf(opened: Opened): Extension[] {
    return [
        EditorState.lineSeparator.of(opened.text.includes("\r\n") ? "\r\n" : "\n"),
        EditorState.readOnly.of(!opened.editable),
        ...(opened.markdown ? [markdownLanguage] : []),
        indentUnit.of("\t"),
        history(),
        drawSelection(),
        keymap.of([...defaultKeymap, ...historyKeymap, indentWithTab]),
        EditorView.lineWrapping,
        EditorView.darkTheme.of(true),
        ...(opened.markdown ? [livePreview(opened.links)] : []),
        EditorView.updateListener.of((update: ViewUpdate): void => {
            if (update.docChanged)
                stateShow("");
        }),
    ];
}


/**
 * Reads the file the address names, see the top of this file: a file of my new system, else a note.
 * - `response`: Answer of the reader.
 * - `sent`: The file of my new system as the reader sends it.
 * - `note`: The note as the reader sends it.
 *
 * @param file - Path of a file of my new system, like `NomMetainformations/Foods.md`, empty for a note
 * @returns The file, `null` when the reader cannot read it
 */
async function openedRead(file: string): Promise<Opened | null> {
    if (file !== "") {
        const response: Response = await fetch(`/api/edit/file?path=${encodeURIComponent(file)}`);
        if (!response.ok)
            return null;
        const sent: SystemFile = await response.json() as SystemFile;
        return { text: sent.text, links: {}, markdown: /\.md$/i.test(sent.path), editable: sent.editable };
    }

    const response: Response = await fetch(`/api/notes/note?path=${encodeURIComponent(path)}`);
    if (!response.ok)
        return null;
    const note: LinkedNote = await response.json() as LinkedNote;
    return { text: note.text, links: note.links, markdown: true, editable: path.startsWith("Drafts/") };
}

/**
 * Starts the editor after the router has put its HTML into the page: shows the tree on the left,
 * reads the file the address names and shows it to edit, with the save button, Ctrl+S, and a question
 * before leaving with changes unsaved; a file to read only says so, a file that cannot be read shows a hint instead,
 * and so does the editor while it shows no file.
 * - `address`: The parameters of the address.
 * - `file`: Path of the file of my new system, empty for a note.
 * - `opened`: The file read.
 * - `text`: Element of the text, with the look of the notes for Markdown, else of plain text.
 * - `beforeunload`: Comes before the page closes or loads again, also for another file of the tree;
 *   `preventDefault` makes the browser ask.
 */
export async function editorStart(): Promise<void> {
    const address: URLSearchParams = new URLSearchParams(location.search);
    const file: string = address.get("file") ?? "";
    const save: HTMLElement = document.getElementById("editor-save") as HTMLElement;
    path = file !== "" ? file : address.get("path") ?? "";
    saveAddress = file !== "" ? "/api/edit/file" : "/api/edit/note";
    treeShow(document.getElementById("notes-tree") as HTMLElement, path)
        .catch((error: unknown): void => console.error(error));
    (document.getElementById("editor-title") as HTMLElement).textContent =
        path.split("/").at(-1)?.replace(/\.md$/i, "") ?? "";
    const opened: Opened | null = path === "" ? null : await openedRead(file);
    if (opened === null) {
        save.hidden = true;
        (document.getElementById("editor-state") as HTMLElement).textContent =
            path === "" ? "Choose a note or a file on the left" : "This file cannot be read";
        return;
    }

    const text: HTMLElement = document.getElementById("editor-text") as HTMLElement;
    text.classList.toggle("markdown", opened.markdown);
    text.classList.toggle("editor-plain", !opened.markdown);
    saved = opened.text;
    view = new EditorView({
        parent: text,
        state: EditorState.create({ doc: opened.text, extensions: extensionsOf(opened) }),
    });
    iconPut(save, Check, "Save");
    save.addEventListener("click", noteSave);
    save.hidden = view.state.readOnly;
    if (!view.state.readOnly)
        stateShow("");
    else
        stateShow(file === "" ? "Read only: only drafts can be edited" : "Read only");
    window.addEventListener("keydown", keyDown);
    window.addEventListener("beforeunload", (event: BeforeUnloadEvent): void => {
        if (view.state.sliceDoc() !== saved)
            event.preventDefault();
    });
}
