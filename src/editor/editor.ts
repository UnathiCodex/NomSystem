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
 * A section, a note with tasks of the semester, shows its round in the same view: its name in words, its round below
 * it, like `Round 1`, then only the block due, `Next` below it, and in the tree, in place of the outline, its blocks
 * with their places, a click opening one, see `./round.ts`.
 * While no note is open, the page shows Today, the items due today as cards, see `./today.ts`.
 * The address names a note by its path in the scripts view and the heading to scroll to, like
 * `/scripts?path=Drafts/IN2028_BusinessAnalyticsMachineLearning/01_RegressionAnalysis/01_01_EstimatorConfidenceInterval.md#…`,
 * so a reload and the back button of the browser stay on it, and a file of my new system by its path in the tree,
 * like `/edit?file=NomMetainformations/Foods.md`.
 * Saves only with its button, the plain floppy disk of saving, so the round's check is the only check, its tooltip
 * `Save`, or Ctrl+S, never by itself, refused when the file changed on the disk since it was read, and asks before
 * leaving with changes unsaved, also for another file of the tree; the button faint while nothing is to save, its full
 * grey while there are changes, and beside it stands when it saved last, like `Saved 20:41`, or what went wrong.
 * A phone shows one thing at a time, as the day shows plan or log: the file, or the tree over it while the button
 * of the tree at the bottom is pressed, see {@link phoneShow}; the name of the file then scrolls away with it,
 * and the button of the tree, the notice and the save button stand at the bottom, see `./editor.css`.
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
 * - `./steps.ts`: Shows an unfolded solution one step at a time.
 * - `./tasks.ts`: Shows the rows of the tasks of a note.
 * - `./round.ts`: Shows the round of a section in the note.
 * - `../notes/tree.ts`: Shows the tree of one root, the file shown marked, and the outline of a note or the blocks
 *   of a section with their places.
 * - `../day/choices.ts`: Marks where the long name of a file may go on below, on a phone.
 * - `../phone.ts`: Tells a phone, which shows the tree or the file, one at a time.
 * - `lucide`, `../icons.ts`: The floppy disk of the save button, the check of the round's button and the tree of the
 *   button that shows the tree on a phone.
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
import { markdownKeys, pointContinue } from "./keys.ts";
import { obsidianSyntax } from "./syntax.ts";
import { headingShow, linksSet, livePreview, solutionsFold } from "./preview.ts";
import { solutionSteps } from "./steps.ts";
import { taskRows, tasksLoad } from "./tasks.ts";
import { roundBlocksOf, roundClose, roundHeadingShow, roundStart } from "./round.ts";
import { outlineShow, treeShow } from "../notes/tree.ts";
import { todayShow } from "./today.ts";
import { calendarTodayOf } from "../today.ts";
import { timeOf } from "../day/times.ts";
import { breakableOf } from "../day/choices.ts";
import { phone } from "../phone.ts";
import { Check, CornerDownLeft, ListTree, Save } from "lucide";
import { iconPut } from "../icons.ts";
import "../notes/notes.css";
import "./editor.css";

import type { Extension } from "@codemirror/state";
import type { Rect, ViewUpdate } from "@codemirror/view";
import type { LanguageSupport } from "@codemirror/language";
import type { Links } from "./preview.ts";
import type { BlockMark } from "../notes/tree.ts";


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
 * Whether the note shown is a section, whose save button shows only while it has changes, see {@link stateShow}.
 */
let sectionShown: boolean = false;

/**
 * Waiting rebuild of the outline after a change of the text, so typing builds it anew once, half a second after
 * it rests.
 */
let outlineWait: number = 0;


/**
 * Shows on a phone the file or the tree over it, see `.editor` in `./editor.css`, the button of the tree pressed
 * while the tree is shown; a computer shows both side by side anyway.
 *
 * @param shown - What to show, `file` or `tree`
 */
function phoneShow(shown: "file" | "tree"): void {
    (document.getElementById("editor") as HTMLElement).dataset.shown = shown;
    document.getElementById("editor-tree")?.setAttribute("aria-pressed", String(shown === "tree"));
}

/**
 * Shows whether the file has changes not yet saved: the save button in its full grey while it has, else faint,
 * in a section the save button only then, so beside the round check stands nothing more while nothing changed,
 * and beside it a notice when something went wrong, like `Not saved`, or for a file to read only.
 * - {@link EditorState#sliceDoc}: Gives the text, its lines joined by the line break of the file.
 *
 * @param notice - Notice of the moment, like `Not saved`, empty for none
 */
function stateShow(notice: string): void {
    const unsaved: boolean = view.state.sliceDoc() !== saved;
    const save: HTMLElement = document.getElementById("editor-save") as HTMLElement;
    save.classList.toggle("unsaved", unsaved);
    if (sectionShown)
        save.hidden = !unsaved;
    (document.getElementById("editor-state") as HTMLElement).textContent = notice;
}

/**
 * Saves the file: sends its text to the reader with the text it had when read or saved last;
 * the reader writes it when the file has not changed since, a draft with its change as a diff;
 * then says so beside the button with the time, like `Saved 20:41`, until the next change,
 * and a note takes the files its links lead to anew, so a link written since works, see `./preview.ts`.
 * Does nothing while a save is on its way, when nothing changed, or for a file to read only.
 * - `reread`: The note read anew with its links, `null` for a file of my new system or when it cannot be read.
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
            const reread: Opened | null = saveAddress === "/api/edit/note" ? await openedRead("") : null;
            if (reread !== null)
                linksSet(view, reread.links);
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
 * Starts the button of a new line in the same point, on a phone or tablet, whose keyboard has no Shift+Enter: it writes
 * what Shift+Enter writes, a line without a new bullet in the point of the cursor, its guide line running on, see
 * `pointContinue` in `./keys.ts`; a finger on it keeps the cursor in the text, so the keyboard stays open.
 * It shows while I write, see `updateListener` in {@link extensionsOf}.
 * - `button`: The button, at the bottom beside the save button.
 */
function newlineStart(): void {
    const button: HTMLButtonElement = document.getElementById("editor-newline") as HTMLButtonElement;
    iconPut(button, CornerDownLeft, "New line in this point");
    button.addEventListener("pointerdown", (event: PointerEvent): void => event.preventDefault());
    button.addEventListener("click", (): void => {
        pointContinue(view);
        view.focus();
    });
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
 * Builds the outline of a note in the tree anew, or for a section its blocks with their places in its round,
 * - `blocks`: The blocks of a section with their places, `null` for any other note.
 */
function outlineRefresh(): void {
    const blocks: [string, BlockMark][] | null = roundBlocksOf(view);
    if (outlineTree !== null)
        outlineShow(outlineTree, path, view.state.sliceDoc(), blocks);
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
 *   while the file scrolls, so moving up never hides the cursor under it; on a phone the name scrolls away
 *   with the file, and the bar at the bottom stands below the file, so the cursor needs no margin there.
 * - `solutionSteps`: The steps of an unfolded solution, one at a time, see `./steps.ts`.
 * - `taskRows`: The rows of the tasks of a note, once loaded, see `./tasks.ts`.
 * - `roundStart`: The round of a section, see `./round.ts`, which shows the places of its blocks anew as it moves.
 * - `updateListener`: Shows whether the file has unsaved changes after each change of the text, and builds the outline
 *   of a note anew once the typing rests, see {@link outlineRefresh}; on a phone shows the button of a new line in
 *   the same point while I write, see {@link newlineStart}.
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
            ({ top: phone ? 0 : (document.getElementById("editor-head") as HTMLElement).offsetHeight })),
        ...(opened.markdown ? [livePreview(opened.links), solutionSteps, taskRows, roundStart(outlineRefresh)] : []),
        ...(/\.ics$/i.test(path) ? [icsLook()] : []),
        EditorView.updateListener.of((update: ViewUpdate): void => {
            if (update.focusChanged)
                (document.getElementById("editor-newline") as HTMLElement).hidden =
                    !phone || !update.view.hasFocus || update.state.readOnly;
            if (!update.docChanged)
                return;
            stateShow("");
            clearTimeout(outlineWait);
            outlineWait = window.setTimeout(outlineRefresh, 500);
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
 * Scrolls the note shown to the heading of the address, see `headingShow` in `./preview.ts`, or to the very top of
 * the page, so the round line of a section and on a phone the name of the note, which scrolls away with it, stay
 * in sight.
 * - `heading`: The heading of the address, empty for none.
 */
function addressHeadingShow(): void {
    const heading: string = decodeURIComponent(location.hash.slice(1));
    if (heading === "")
        (document.querySelector(".editor-file") as HTMLElement).scrollTop = 0;
    else
        headingShow(view, heading);
}

/**
 * Scrolls to a heading of the note shown on a click on a link to it in the tree, like in its outline, without loading
 * the page again, and keeps it in the address and the history of the browser; a block of a section shows alone in its
 * round, see `roundHeadingShow` in `./round.ts`;
 * on a phone it shows the note in place of the tree first, see {@link phoneShow}; links to other notes, and clicks
 * with a key held, act as usual.
 * - {@link History#pushState}: Writes the address as a new step of the history, for the back button.
 * - `link`: The link clicked, `null` for none.
 * - `address`: Its address.
 *
 * @param event - Click inside the tree or the list of blocks
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
    phoneShow("file");
    if (!roundHeadingShow(view, decodeURIComponent(address.hash.slice(1))))
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
 * heading of the address, also when the back or forward button of the browser changes it; a section its round,
 * see `./round.ts`, its text hidden until its tasks are loaded, so its blocks fold before they show, scrolled to
 * its current block unless the address names a heading.
 * A phone shows the file, or the tree while no file is named, and the button of the tree switches between them,
 * off while there is no file to go back to, see {@link phoneShow}; the name of the file may go on below between
 * its parts there, see `breakableOf` in `../day/choices.ts`.
 * - `address`: The parameters of the address.
 * - `file`: Path of the file of my new system, empty for a note.
 * - `plannings`: Whether the editor shows my new system, for one of its files or at `/plannings`; else my modules.
 * - `tree`: Place of the tree, and `shown` the tree once it is shown.
 * - `treeButton`: The button that shows the tree on a phone.
 * - `opened`: The file read.
 * - `text`: Element of the text, with the look of the notes for Markdown, else of plain text.
 * - `pointerdown`: Comes when a finger touches the save button on a phone; `preventDefault` keeps the cursor
 *   in the text, so the keyboard stays open and I write on after saving.
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
    const treeButton: HTMLButtonElement = document.getElementById("editor-tree") as HTMLButtonElement;
    path = file !== "" ? file : address.get("path") ?? "";
    saveAddress = file !== "" ? "/api/edit/file" : "/api/edit/note";
    phoneShow(path === "" && plannings ? "tree" : "file");
    iconPut(treeButton, ListTree, "Tree");
    treeButton.disabled = path === "" && plannings;
    treeButton.addEventListener("click", (): void =>
        phoneShow(treeButton.getAttribute("aria-pressed") === "true" ? "file" : "tree"));
    const shown: Promise<void> = treeShow(tree, plannings ? "NomManageplannings" : "NomSkillingmodules", path,
        address.get("module") ?? "");
    shown.catch((error: unknown): void => console.error(error));
    const title: string = breakableOf(path.split("/").at(-1)?.replace(/\.md$/i, "") ?? "");
    if (plannings)
        (document.getElementById("editor-title") as HTMLElement).textContent = title;
    const close: HTMLButtonElement = document.getElementById("editor-close") as HTMLButtonElement;
    iconPut(close, Check, "Close the round");
    close.addEventListener("click", roundClose);
    newlineStart();
    if (path === "" && !plannings) {
        save.hidden = true;
        (document.getElementById("editor") as HTMLElement).classList.add("editor-on-today");
        await todayShow(document.getElementById("editor-today") as HTMLElement, calendarTodayOf());
        return;
    }
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
    iconPut(save, Save, "Save");
    save.addEventListener("click", noteSave);
    if (phone)
        save.addEventListener("pointerdown", (event: PointerEvent): void => event.preventDefault());
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

    text.style.visibility = "hidden";
    tasksLoad(view, path).catch((error: unknown): void => console.error(error)).finally((): void => {
        text.style.visibility = "";
        sectionShown = roundBlocksOf(view) !== null;
        if (sectionShown)
            stateShow("");
        else
            (document.getElementById("editor-title") as HTMLElement).textContent = title;
        if (!sectionShown)
            addressHeadingShow();
        else if (location.hash !== "")
            roundHeadingShow(view, decodeURIComponent(location.hash.slice(1)));
    });
    shown.then((): void => {
        outlineTree = tree;
        outlineRefresh();
    }).catch((error: unknown): void => console.error(error));
    tree.addEventListener("click", treeClick);
    window.addEventListener("popstate", addressHeadingShow);
}
