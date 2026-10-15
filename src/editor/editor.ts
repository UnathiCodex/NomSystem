/**
 * ## Editor
 *
 * Edits a note of my modules or a Markdown file of my new system as its text, its Markdown shown as in Obsidian's
 * live preview away from the cursor, see `./preview.ts`. The scripts view, `/scripts`, is this editor, always writing,
 * with no view beside it to read only; a due task of the skill view opens as a card, see `../notes/notes.ts`.
 * It edits the text of the file itself: saving writes exactly the edited text, nothing reformatted,
 * tabs, spacers `⠀` and soft hyphens, spaces at the ends of lines and the line breaks of the file as they were.
 * Of my modules the reader writes only the unchecked drafts and keeps each change as a diff, so the AI learns my style
 * from my corrections; any other note of my modules opens to read only.
 * On the left the tree of one root, see `../notes/tree.ts`: `NomSkillingmodules` at `/scripts`, the outline of the note
 * under it, built anew as I write, whose headings scroll the note to them without loading the page again;
 * `NomManageplannings` for a file of my new system and at `/plannings`, where a click on a Markdown file of the three
 * folders of my new system, like `Foods.md`, `Places.md` or a daily note, opens it here to edit, saved back into its
 * file without a diff; an `.ics` file opens as its plain text, to read only, each block of it drawn one step in and its
 * entries apart, see `./ics.ts`; any other file shows in the tree, faint, and opens not.
 * A note of my modules shows the rows of its tasks under their headings, see `./tasks.ts`.
 * The address names a note by its path in the scripts view and the heading to scroll to, like
 * `/scripts?path=Drafts/IN2028_BusinessAnalyticsMachineLearning/01_RegressionAnalysis/01_01_EstimatorConfidenceInterval.md#…`,
 * so a reload and the back button of the browser stay on it, and a file of my new system by its path in the tree,
 * like `/edit?file=NomMetainformations/Foods.md`.
 * Saves only with its button, a check as the save of the dialogs, its tooltip `Save`, or Ctrl+S, never by itself,
 * refused when the file changed on the disk since it was read, and asks before leaving with changes unsaved, also
 * for another file of the tree; the button turns the calm grey of a main button while there are changes, and beside it
 * stands when it saved last, like `Saved 20:41`, or what went wrong.
 *
 * - `@codemirror/state`, `@codemirror/view`: The editor, CodeMirror 6, the engine of Obsidian's editor.
 * - `@codemirror/commands`: Undo, redo and the usual keys, Tab indenting a line.
 * - `@codemirror/language`: Indents with tabs.
 * - `@codemirror/lang-markdown`: Reads the note as Markdown.
 * - `@lezer/markdown`: GitHub's tables, task lists and strikethrough for the Markdown parser.
 * - `./ics.ts`: Shows an `.ics` file with its blocks one step in and its entries apart.
 * - `./keys.ts`: The keys of a Markdown file as in Obsidian, like Enter continuing a list.
 * - `./syntax.ts`: Obsidian syntax for the Markdown parser.
 * - `./preview.ts`: Shows the Markdown as in the scripts view, folds its sections and scrolls to a heading.
 * - `./tasks.ts`: Shows the rows of the tasks of a note.
 * - `../notes/tree.ts`: Shows the tree of one root, the file shown marked, and the outline of a note.
 * - `lucide`, `../icons.ts`: The check of the save button.
 * - `../notes/notes.css`: Look of the notes, for the rendered formulas, tables and images, and of the tree.
 * - `./editor.css`: Look of the editor.
 */

import { EditorState } from "@codemirror/state";
import { EditorView, drawSelection, keymap } from "@codemirror/view";
import { defaultKeymap, history, historyKeymap, indentWithTab } from "@codemirror/commands";
import { indentUnit } from "@codemirror/language";
import { markdown } from "@codemirror/lang-markdown";
import { GFM } from "@lezer/markdown";
import { icsLook } from "./ics.ts";
import { markdownKeys } from "./keys.ts";
import { obsidianSyntax } from "./syntax.ts";
import { headingShow, livePreview, solutionsFold } from "./preview.ts";
import { taskRows, tasksLoad } from "./tasks.ts";
import { outlineShow, treeShow } from "../notes/tree.ts";
import { timeOf } from "../day/times.ts";
import { Check } from "lucide";
import { iconPut } from "../icons.ts";
import "../notes/notes.css";
import "./editor.css";

import type { Extension } from "@codemirror/state";
import type { Rect, ViewUpdate } from "@codemirror/view";
import type { LanguageSupport } from "@codemirror/language";
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
 * and the Obsidian syntax of `./syntax.ts`; a URL pasted over selected text makes it a link, as in Obsidian.
 * Its keys are those of `./keys.ts`, and it completes no HTML tags.
 */
const markdownSupport: LanguageSupport =
    markdown({ extensions: [GFM, obsidianSyntax], addKeymap: false, completeHTMLTags: false });

/**
 * Path of the file: of a note as the scripts view takes it, of a file of my new system as the tree names it.
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
 * The tree of my modules, while the editor shows a note of them, for its outline; `null` for a file of my new system.
 */
let outlineTree: HTMLElement | null = null;

/**
 * Waiting rebuild of the outline after a change of the text, so typing builds it anew once, half a second after
 * it rests.
 */
let outlineWait: number = 0;


/**
 * Shows whether the file has changes not yet saved: the save button in the calm grey of a main button while it has,
 * and beside it a notice when something went wrong, like `Not saved`, or for a file to read only.
 * - {@link EditorState#sliceDoc}: Gives the text, its lines joined by the line break of the file.
 *
 * @param notice - Notice of the moment, like `Not saved`, empty for none
 */
function stateShow(notice: string): void {
    const unsaved: boolean = view.state.sliceDoc() !== saved;
    (document.getElementById("editor-save") as HTMLElement).classList.toggle("unsaved", unsaved);
    (document.getElementById("editor-state") as HTMLElement).textContent = notice;
}

/**
 * Saves the file: sends its text to the reader with the text it had when read or saved last;
 * the reader writes it when the file has not changed since, a draft with its change as a diff;
 * then says so beside the button with the time, like `Saved 20:41`, until the next change.
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
            stateShow(`Saved ${timeOf(new Date())}`);
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
 * - `markdownSupport`, `markdownKeys`, `livePreview`: Read a Markdown file as Markdown, take its keys as in Obsidian,
 *   see `./keys.ts`, and show it as in the scripts view;
 *   any other file stays its plain text, an `.ics` file with its blocks one step in, see `./ics.ts`.
 * - `indentUnit`: Indents with a tab, as my notes do.
 * - `lineWrapping`: Wraps long lines at the reading width, as the scripts view does, so I see where a line overflows.
 * - `darkTheme`: Draws cursor and selection for a dark page.
 * - `scrollMargins`: Keeps the cursor below the head with the name and the save button, which stays on top
 *   while the file scrolls, so moving up never hides the cursor under it.
 * - `taskRows`: The rows of the tasks of a note, once loaded, see `./tasks.ts`.
 * - `updateListener`: Shows whether the file has unsaved changes after each change of the text, and builds the outline
 *   of a note anew once the typing rests.
 *
 * @param opened - The file
 * @returns Extensions
 */
function extensionsOf(opened: Opened): Extension[] {
    return [
        EditorState.lineSeparator.of(opened.text.includes("\r\n") ? "\r\n" : "\n"),
        EditorState.readOnly.of(!opened.editable),
        ...(opened.markdown ? [markdownSupport, markdownKeys] : []),
        indentUnit.of("\t"),
        history(),
        drawSelection(),
        keymap.of([...defaultKeymap, ...historyKeymap, indentWithTab]),
        EditorView.lineWrapping,
        EditorView.darkTheme.of(true),
        EditorView.scrollMargins.of((): Partial<Rect> =>
            ({ top: (document.getElementById("editor-head") as HTMLElement).offsetHeight })),
        ...(opened.markdown ? [livePreview(opened.links), taskRows] : []),
        ...(/\.ics$/i.test(path) ? [icsLook()] : []),
        EditorView.updateListener.of((update: ViewUpdate): void => {
            if (!update.docChanged)
                return;
            stateShow("");
            clearTimeout(outlineWait);
            outlineWait = window.setTimeout((): void => {
                if (outlineTree !== null)
                    outlineShow(outlineTree, path, view.state.sliceDoc());
            }, 500);
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
 * Scrolls the note shown to the heading of the address, see `headingShow` in `./preview.ts`, or to its top.
 */
function addressHeadingShow(): void {
    headingShow(view, decodeURIComponent(location.hash.slice(1)));
}

/**
 * Scrolls to a heading of the note shown on a click on a link to it in the tree, like in its outline, without loading
 * the page again, and keeps it in the address and the history of the browser; links to other notes, and clicks
 * with a key held, act as usual.
 * - {@link History#pushState}: Writes the address as a new step of the history, for the back button.
 * - `link`: The link clicked, `null` for none.
 * - `address`: Its address.
 *
 * @param event - Click inside the tree
 */
function treeClick(event: MouseEvent): void {
    const link: HTMLAnchorElement | null = (event.target as Element).closest("a[href]");
    if (link === null || event.ctrlKey || event.metaKey || event.shiftKey)
        return;

    const address: URL = new URL(link.href);
    if (address.pathname !== "/scripts" || address.searchParams.get("path") !== path)
        return;
    event.preventDefault();
    window.history.pushState(null, "", address);
    addressHeadingShow();
}

/**
 * Starts the editor after the router has put its HTML into the page: shows the tree on the left, that of my new system
 * for one of its files and at `/plannings`, else that of my modules, the module of the address picked while no note
 * is shown, like `/scripts?module=IN2028_BusinessAnalyticsMachineLearning` from a skill entry, see `../notes/tree.ts`;
 * reads the file the address names and shows it to edit, its solutions folded, see `./preview.ts`, with the save
 * button, Ctrl+S, and a question before leaving with changes unsaved; a file to read only says so, a file that cannot
 * be read shows a hint instead, and so does the editor while it shows no file.
 * A note of my modules gets the rows of its tasks, see `./tasks.ts`, its outline in the tree, and scrolls to the
 * heading of the address, also when the back or forward button of the browser changes it.
 * - `address`: The parameters of the address.
 * - `file`: Path of the file of my new system, empty for a note.
 * - `plannings`: Whether the editor shows my new system, for one of its files or at `/plannings`; else my modules.
 * - `tree`: Place of the tree, and `shown` the tree once it is shown.
 * - `opened`: The file read.
 * - `text`: Element of the text, with the look of the notes for Markdown, else of plain text.
 * - `beforeunload`: Comes before the page closes or loads again, also for another file of the tree;
 *   `preventDefault` makes the browser ask.
 * - `popstate`: Comes when the back or forward button of the browser changes the address.
 */
export async function editorStart(): Promise<void> {
    const address: URLSearchParams = new URLSearchParams(location.search);
    const file: string = address.get("file") ?? "";
    const save: HTMLElement = document.getElementById("editor-save") as HTMLElement;
    const plannings: boolean = file !== "" || location.pathname === "/plannings";
    const tree: HTMLElement = document.getElementById("notes-tree") as HTMLElement;
    path = file !== "" ? file : address.get("path") ?? "";
    saveAddress = file !== "" ? "/api/edit/file" : "/api/edit/note";
    const shown: Promise<void> = treeShow(tree, plannings ? "NomManageplannings" : "NomSkillingmodules", path,
        address.get("module") ?? "");
    shown.catch((error: unknown): void => console.error(error));
    (document.getElementById("editor-title") as HTMLElement).textContent =
        path.split("/").at(-1)?.replace(/\.md$/i, "") ?? "";
    const opened: Opened | null = path === "" ? null : await openedRead(file);
    if (opened === null) {
        save.hidden = true;
        (document.getElementById("editor-state") as HTMLElement).textContent =
            path === "" ? `Choose a ${plannings ? "file" : "note"} on the left` : "This file cannot be read";
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
    if (opened.markdown)
        solutionsFold(view);
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
    if (plannings || !opened.markdown)
        return;

    tasksLoad(view, path).catch((error: unknown): void => console.error(error));
    addressHeadingShow();
    shown.then((): void => {
        outlineTree = tree;
        outlineShow(tree, path, view.state.sliceDoc());
    }).catch((error: unknown): void => console.error(error));
    tree.addEventListener("click", treeClick);
    window.addEventListener("popstate", addressHeadingShow);
}
