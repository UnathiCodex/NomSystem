/**
 * ## Tree
 *
 * The tree on the left of the editor, see `../editor/editor.ts`, which is the scripts view too,
 * as Obsidian's file explorer, of one of two roots at a time, each an area of its own in the rail:
 * - `NomSkillingmodules`, the book, the modules of the semester, one at a time, since I learn one module at a time:
 *   right below the name of the root the module picked, then its chapter picked, each a picker whose arrow brings
 *   its menu down below it and whose name opens the overview of the module, see {@link pickerOf}, then the notes
 *   of that chapter as a plain list, nothing folding, which open in the scripts view to write, saved right into their files;
 * - `NomManageplannings`, the open folder, my new system, as the reader lists it, without my old system
 *   `NomSystemprevious`, see `reader/files.ts`: a Markdown file, like `Foods.md`, opens in the editor to edit,
 *   an `.ics` file as its plain text to read, any other file shows faint and opens not.
 * The name of the root stands on top as a heading that never folds, so nothing lies deeper than it needs.
 * Of my modules the module and chapter of the note shown are picked; while none is shown, the module asked for,
 * else the first, with its first chapter. Of my new system its folders stand right below, folders first,
 * all closed but those on the way to the file shown.
 * Of my new system a search filters the tree as I type, see {@link searchStart}; my modules have none, their chapter
 * is short enough to see; the name of either root on top is no link.
 * Under the note shown stands its outline, as Obsidian's outline, see {@link outlineShow}; under a section its blocks
 * in the places of its round, see {@link roundListOf}; a click on the note shown folds them away, as a folder closes,
 * and a further click opens them again, see {@link outlineFold}.
 * Each name stands on one line, one too long for it ending in dots; its look is in `./notes.css`.
 *
 * - `../search.ts`: Compares a typed text with the paths of the files and notes, as every search of the page does.
 * - `../day/choices.ts`: Marks where a long name may go on below.
 * - `./markdown.ts`, `./math.ts`: Render the headings of the outline, their formulas as in the note.
 * - `lucide`, `../icons.ts`: The check and the cross of a block done in its round, and the search field of my new system.
 * - `../reader.ts`: Asks the reader for the tree.
 * - `../changes.ts`: Loads the tree of my new system anew after every change of its files, see {@link filesAgain}.
 */

import { matchesAll, wordsOf } from "../search.ts";
import { breakableOf } from "../day/choices.ts";
import { inlineHtmlOf } from "./markdown.ts";
import { mathRender } from "./math.ts";
import { iconOf, searchFieldOf } from "../icons.ts";
import { Check, X } from "lucide";
import { readerAsk } from "../reader.ts";
import { changesFollow } from "../changes.ts";


/**
 * A folder or file of `NomManageplannings`, as the reader sends it.
 *
 * - `name`: Its name, like `2026_10` or `Foods.md`.
 * - `path`: Its path from `NomManageplannings`, like `NomMetainformations/Foods.md`.
 * - `folder`: Whether it is a folder.
 * - `opens`: Whether the editor opens it: a Markdown or `.ics` file of the folders of my new system.
 * - `children`: What a folder holds, its folders first.
 */
type FileNode = {
    name: string;
    path: string;
    folder: boolean;
    opens: boolean;
    children: FileNode[];
};

/**
 * A note of a chapter, as the reader sends it.
 *
 * - `name`: Name of the file, like `01_01_EstimatorConfidenceInterval.md`.
 * - `path`: Path, from `NomSkillingmodules`.
 */
type NoteEntry = {
    name: string;
    path: string;
};

/**
 * A chapter with its notes, as the reader sends it.
 *
 * - `title`: Its name, like `01_RegressionAnalysis`.
 * - `notes`: Its notes in order.
 */
type Chapter = {
    title: string;
    notes: NoteEntry[];
};

/**
 * A module of the semester with its chapters, as the reader sends it.
 *
 * - `name`: Name of its folder, like `IN2028_BusinessAnalyticsMachineLearning`.
 * - `title`: Its name, like `IN2028_BusinessAnalyticsMachineLearning`.
 * - `chapters`: Its chapters that hold notes, in order.
 */
type NotesModule = {
    name: string;
    title: string;
    chapters: Chapter[];
};


/**
 * Makes a folder of the tree that folds, like a chapter: its name, and below it the place of its entries.
 *
 * @param name - Name shown, like `01_RegressionAnalysis`
 * @returns Folder, its entries to go into its last child
 */
export function folderOf(name: string): HTMLDetailsElement {
    const folder: HTMLDetailsElement = document.createElement("details");
    const summary: HTMLElement = document.createElement("summary");
    const children: HTMLDivElement = document.createElement("div");
    folder.className = "tree-folder";
    summary.textContent = breakableOf(name);
    children.className = "tree-children";
    folder.append(summary, children);
    return folder;
}

/**
 * Builds the address of a note in the scripts view.
 *
 * @param path - Path of the note
 * @param heading - Heading to scroll to, empty for the top
 * @returns Address like `/scripts?path=…#Heading`
 */
export function noteAddressOf(path: string, heading: string): string {
    const address: string = `/scripts?path=${encodeURIComponent(path)}`;
    if (heading === "")
        return address;
    return `${address}#${encodeURIComponent(heading)}`;
}

/**
 * Builds the address of the overview of a module in the scripts view, see `../editor/overview.ts`, with the chapter
 * to pick in the tree.
 *
 * @param module - Name of the folder of the module, like `IN2028_BusinessAnalyticsMachineLearning`
 * @param chapter - Name of the chapter, like `01_RegressionAnalysis`, empty for none
 * @returns Address like `/scripts?module=…&chapter=…`
 */
export function overviewAddressOf(module: string, chapter: string): string {
    const address: string = `/scripts?module=${encodeURIComponent(module)}`;
    if (chapter === "")
        return address;
    return `${address}&chapter=${encodeURIComponent(chapter)}`;
}

/**
 * Makes a folder or file of `NomManageplannings`: a folder with its entries and its path, so it opens again once
 * the tree is loaded anew, see {@link filesAgain}; a file that opens as a link to it in the editor, named as
 * on the disk, like `Foods.md`; any other file faint, opening nothing.
 * - `folder`: The folder of a folder.
 * - `link`: The link of a file that opens.
 * - `name`: The name of any other file.
 *
 * @param node - Folder or file as the reader sends it
 * @returns Its entry
 */
function fileNodeOf(node: FileNode): HTMLElement {
    if (node.folder) {
        const folder: HTMLDetailsElement = folderOf(node.name);
        folder.dataset.path = node.path;
        folder.lastElementChild?.append(...node.children.map(fileNodeOf));
        return folder;
    }
    if (node.opens) {
        const link: HTMLAnchorElement = document.createElement("a");
        link.className = "tree-file";
        link.dataset.path = node.path;
        link.href = `/edit?file=${encodeURIComponent(node.path)}`;
        link.textContent = breakableOf(node.name);
        return link;
    }
    const name: HTMLSpanElement = document.createElement("span");
    name.className = "tree-file tree-closed";
    name.dataset.path = node.path;
    name.title = "Only Markdown and .ics files of the folders of my new system open";
    name.textContent = breakableOf(node.name);
    return name;
}

/**
 * Folds the outline of the note shown, or the blocks of a section, away on a click on its entry, as a folder closes,
 * and opens it again on a further click, the note staying open and in place beside the tree: `tree-folded` on the
 * entry hides the outline below it, see `./notes.css`, and stays on it while the outline is built anew,
 * see {@link outlineShow}. A click on another note, on a note without an outline, or with a key held, acts as usual.
 * - {@link Event#stopPropagation}: Keeps the click from the tree, which would scroll the note to its top,
 *   see `treeClick` in `../editor/editor.ts`.
 * - `entry`: The entry clicked.
 *
 * @param event - Click on the entry of a note
 */
function outlineFold(event: MouseEvent): void {
    const entry: HTMLElement = event.currentTarget as HTMLElement;
    if (!entry.classList.contains("shown") || !entry.nextElementSibling?.classList.contains("tree-outline")
        || event.ctrlKey || event.metaKey || event.shiftKey)
        return;
    event.preventDefault();
    event.stopPropagation();
    entry.classList.toggle("tree-folded");
}

/**
 * Makes a module of the semester, shown once it is picked, see {@link chapterShow}: the name of its folder
 * and its name as data, so it can be picked, see {@link treeShow}, its chapters in it, each shown once it is picked,
 * its notes a plain list, which link to the scripts view, named without `.md` as in Obsidian, the note shown
 * folding its outline by a click on it, see {@link outlineFold};
 * a module without chapter notes holds a calm `No chapters yet`, as its overview says it.
 * - `element`: The module.
 * - `group`: A chapter.
 * - `link`: Link of a note.
 * - `none`: The hint for a module without chapters.
 *
 * @param module - Module with its chapters and their notes
 * @returns The module
 */
function moduleNodeOf(module: NotesModule): HTMLDivElement {
    const element: HTMLDivElement = document.createElement("div");
    element.className = "tree-module";
    element.dataset.module = module.name;
    element.dataset.title = module.title;
    element.append(...module.chapters.map((chapter: Chapter): HTMLDivElement => {
        const group: HTMLDivElement = document.createElement("div");
        group.className = "tree-chapter";
        group.dataset.chapter = chapter.title;
        group.append(...chapter.notes.map((note: NoteEntry): HTMLAnchorElement => {
            const link: HTMLAnchorElement = document.createElement("a");
            link.className = "tree-file";
            link.dataset.path = note.path;
            link.href = noteAddressOf(note.path, "");
            link.textContent = breakableOf(note.name.replace(/\.md$/i, ""));
            link.addEventListener("click", outlineFold);
            return link;
        }));
        return group;
    }));
    if (module.chapters.length === 0) {
        const none: HTMLParagraphElement = document.createElement("p");
        none.className = "tree-none";
        none.textContent = "No chapters yet";
        element.append(none);
    }
    return element;
}

/**
 * Makes a picker of the tree of my modules, see the top of this file: a row, the name of what is picked, no arrow,
 * since a click on it opens its menu, the browser's own popover, which a pick, Escape or a click beside it closes;
 * each choice a row, the one picked in the calm grey of what is picked. A pick shows it in the tree and opens
 * the overview of its module, see `../editor/overview.ts`, with what is picked.
 * - `pick`: The row, a button.
 * - `name`: The name of what is picked on it, see `.tree-pick` in `./notes.css`.
 * - `menu`: The menu.
 *
 * @param kind - What it picks, `module` or `chapter`, which names its anchor, see `.tree-pick` in `./notes.css`
 * @param choices - Gives what it may pick: the modules, or the chapters of the module picked
 * @param nameOf - Gives the name of a choice, like `01_RegressionAnalysis`
 * @param choose - Shows the choice picked
 * @param addressOf - Gives the address of the overview of what is picked, see {@link overviewAddressOf}
 * @returns The row and its menu
 */
function pickerOf(kind: string, choices: () => HTMLElement[], nameOf: (choice: HTMLElement) => string,
                  choose: (choice: HTMLElement) => void, addressOf: () => string): [HTMLButtonElement, HTMLDivElement] {
    const pick: HTMLButtonElement = document.createElement("button");
    const name: HTMLSpanElement = document.createElement("span");
    const menu: HTMLDivElement = document.createElement("div");
    pick.type = "button";
    pick.className = `tree-pick tree-pick-${kind}`;
    name.className = "tree-pick-name";
    pick.append(name);
    pick.popoverTargetElement = menu;
    menu.className = `tree-menu tree-menu-${kind}`;
    menu.popover = "auto";
    menu.addEventListener("beforetoggle", (event: ToggleEvent): void => {
        if (event.newState !== "open")
            return;
        menu.replaceChildren(...choices().map((choice: HTMLElement): HTMLButtonElement => {
            const row: HTMLButtonElement = document.createElement("button");
            row.type = "button";
            row.className = "tree-choice";
            row.classList.toggle("picked", choice.classList.contains("picked"));
            row.textContent = breakableOf(nameOf(choice));
            row.addEventListener("click", (): void => {
                menu.hidePopover();
                choose(choice);
                location.assign(addressOf());
            });
            return row;
        }));
    });
    return [pick, menu];
}

/**
 * Shows one chapter of one module in the tree of my modules, see the top of this file: their names in their pickers,
 * each by the name of its folder on one line, like `IN2028_BusinessAnalyticsMachineLearning` and
 * `01_RegressionAnalysis`; the notes of that chapter below, both marked `picked`, every other module and chapter hidden;
 * a module without chapters shows its hint `No chapters yet` and no picker of chapters.
 * - `chapterPick`: The picker of the chapter.
 * - `title`: Name of the folder of the module, like `IN2028_BusinessAnalyticsMachineLearning`.
 *
 * @param tree - The tree
 * @param module - The module, see {@link moduleNodeOf}
 * @param chapter - A chapter of it, `null` for a module without chapters
 */
export function chapterShow(tree: HTMLElement, module: HTMLElement, chapter: HTMLElement | null): void {
    tree.querySelectorAll<HTMLElement>(".tree-module").forEach((other: HTMLElement): void => {
        other.classList.toggle("picked", other === module);
    });
    module.querySelectorAll<HTMLElement>(".tree-chapter").forEach((other: HTMLElement): void => {
        other.classList.toggle("picked", other === chapter);
    });
    const chapterPick: HTMLButtonElement = tree.querySelector(".tree-pick-chapter") as HTMLButtonElement;
    const title: string = module.dataset.title ?? "";
    (tree.querySelector(".tree-pick-module > .tree-pick-name") as HTMLElement).textContent = breakableOf(title);
    (chapterPick.firstElementChild as HTMLElement).textContent = breakableOf(chapter?.dataset.chapter ?? "");
    chapterPick.hidden = chapter === null;
}

/**
 * Marks the file or note shown in the tree, and no other: picks the module and chapter of a note, see
 * {@link chapterShow}, opens every folder on the way to a file and scrolls the tree to it.
 * - {@link CSS.escape}: Writes a path so it can stand inside a selector.
 * - `link`: Entry of the file or note shown, `null` while it is not in the tree.
 * - `module`: The module of a note, `null` for a file of my new system.
 * - `folder`: A folder on the way to it, from the nearest one up to its root.
 *
 * @param tree - The tree
 * @param shown - Path of the file or note shown, like `NomMetainformations/Foods.md`
 *   or `IN2028_BusinessAnalyticsMachineLearning/01_RegressionAnalysis/01_01_SampleMeanStandardError.md`
 * @returns Its entry, `null` while it is not in the tree, like a note of a module not of the semester
 */
export function treeMark(tree: HTMLElement, shown: string): HTMLElement | null {
    tree.querySelectorAll(".tree-file.shown").forEach((file: Element): void => file.classList.remove("shown"));
    const link: HTMLElement | null =
        shown === "" ? null : tree.querySelector(`.tree-file[data-path="${CSS.escape(shown)}"]`);
    if (link === null)
        return null;

    link.classList.add("shown");
    const module: HTMLElement | null = link.closest(".tree-module");
    if (module !== null)
        chapterShow(tree, module, link.closest(".tree-chapter"));
    let folder: HTMLDetailsElement | null = link.closest("details");
    while (folder !== null) {
        folder.open = true;
        folder = folder.parentElement?.closest("details") ?? null;
    }
    link.scrollIntoView({ block: "nearest" });
    return link;
}

/**
 * Starts the search of my new system: as I type, only the files whose path holds each typed word show, every folder
 * on the way to them open; the folders open before the search open again once it is empty. Enter opens the first
 * file shown that opens, as a click on it does; Escape empties the search as in every search field of the page, by the
 * browser itself, which then tells `input` as for any change of the text, and so does the tree loaded anew, see
 * {@link filesAgain}, which the search then filters again.
 * - `opened`: Paths of the folders open before the search, `null` while nothing is typed; paths, not the folders
 *   themselves, so they still name the folders of the tree loaded anew.
 * - `files`: The files of the tree.
 * - `show`: Shows the tree for the typed text.
 *
 * @param tree - The tree
 * @param search - Its search field
 */
function searchStart(tree: HTMLElement, search: HTMLInputElement): void {
    let opened: Set<string> | null = null;
    const files: () => HTMLElement[] = (): HTMLElement[] => [...tree.querySelectorAll<HTMLElement>(".tree-file")];
    const show: () => void = (): void => {
        const words: string[] = wordsOf(search.value);
        const folders: HTMLDetailsElement[] = [...tree.querySelectorAll<HTMLDetailsElement>("details.tree-folder")];
        if (words.length === 0) {
            tree.querySelectorAll(".tree-unfound").forEach((element: Element): void =>
                element.classList.remove("tree-unfound"));
            if (opened !== null)
                folders.forEach((folder: HTMLDetailsElement): void => {
                    folder.open = opened?.has(folder.dataset.path ?? "") ?? false;
                });
            opened = null;
            return;
        }
        opened ??= new Set(folders.filter((folder: HTMLDetailsElement): boolean => folder.open)
            .map((folder: HTMLDetailsElement): string => folder.dataset.path ?? ""));
        files().forEach((file: HTMLElement): void => {
            file.classList.toggle("tree-unfound", !matchesAll(file.dataset.path ?? "", words));
        });
        folders.forEach((folder: HTMLDetailsElement): void => {
            const found: boolean = folder.querySelector(".tree-file:not(.tree-unfound)") !== null;
            folder.classList.toggle("tree-unfound", !found);
            if (found)
                folder.open = true;
        });
    };
    search.addEventListener("input", show);
    search.addEventListener("keydown", (event: KeyboardEvent): void => {
        if (event.key === "Enter")
            files().find((file: HTMLElement): boolean =>
                file instanceof HTMLAnchorElement && !file.classList.contains("tree-unfound"))?.click();
    });
}

/**
 * Loads the folders and files of my new system anew, as they lie on the disk now, like after Syncthing took away
 * a conflict copy, see `../changes.ts`, and puts them in place of those shown, the tree else as it was: the folders
 * open before open again, the file shown marked, see {@link treeMark}, the search filters them for its text,
 * see {@link searchStart}, and the tree stays scrolled where it was; the search keeps its place, so typing in it
 * goes on.
 * - `open`: Paths of the folders open before.
 * - `top`: How far the tree was scrolled.
 * - `entries`: The folders and files as they lie now.
 *
 * @param tree - The tree
 * @param search - Its search field
 * @param shown - Path of the file shown, empty for none
 * @throws {Error} - When the reader cannot answer
 */
async function filesAgain(tree: HTMLElement, search: HTMLInputElement, shown: string): Promise<void> {
    const open: string[] = [...tree.querySelectorAll<HTMLDetailsElement>("details.tree-folder[open]")]
        .map((folder: HTMLDetailsElement): string => folder.dataset.path ?? "");
    const top: number = tree.scrollTop;
    const entries: HTMLElement[] = (await readerAsk<FileNode[]>("/api/edit/tree")).map(fileNodeOf);
    tree.querySelectorAll(":scope > .tree-folder, :scope > .tree-file").forEach((entry: Element): void =>
        entry.remove());
    tree.append(...entries);
    tree.querySelectorAll<HTMLDetailsElement>("details.tree-folder").forEach((folder: HTMLDetailsElement): void => {
        folder.open = open.includes(folder.dataset.path ?? "");
    });
    treeMark(tree, shown);
    search.dispatchEvent(new Event("input"));
    tree.scrollTop = top;
}

/**
 * Place of a block of a section in its round, see `../editor/round.ts`: done, done with its last result failed, like
 * a Task after Wrong, the current one, later in the round, outside the round, or outside it but opened from the tree
 * and shown.
 */
export type BlockMark = "done" | "wrong" | "current" | "round" | "other" | "opened";

/**
 * Type word of a block of a section at the start of its heading, with the dot and space after it, like `Definition. `
 * of `Definition. Population and Sample`, see `.claude/modules/learning-system.md`.
 */
export const kindRule: RegExp = /^(Definition|Lemma|Algorithm|Example|Task)\.[ \t]+/;

/**
 * Builds the name of a block for the list of its section: its type word as a small grey box, then its name,
 * rendered, without an older `(cold)`, like `Definition` boxed and then `Population and Sample`.
 * - `kind`: The type word with the dot and space after it, `null` for a heading without one.
 * - `name`: The name, rendered.
 * - `box`: The box of the type word.
 *
 * @param heading - Heading as written
 * @returns The name
 */
function blockNameOf(heading: string): Node[] {
    const kind: RegExpExecArray | null = kindRule.exec(heading);
    const name: HTMLSpanElement = document.createElement("span");
    name.innerHTML = inlineHtmlOf(heading.slice(kind?.[0].length ?? 0).replace(/[ \t]*\(cold\)$/, ""));
    return kind === null ? [name] : [kindBoxOf(kind[1]), name];
}

/**
 * Builds the small grey box of a type word, like `Definition`, see `.block-kind` in `./notes.css`.
 *
 * @param kind - Type word
 * @returns The box
 */
function kindBoxOf(kind: string): HTMLSpanElement {
    const box: HTMLSpanElement = document.createElement("span");
    box.className = "block-kind";
    box.textContent = kind;
    return box;
}

/**
 * Builds the list of the blocks of a section in their order, each linking to its heading by its heading as written,
 * named by its type word as a small grey box and its name, see {@link blockNameOf}: a block done with a check after it,
 * or with a cross, the one its heading line has, once its last result failed, like `Food Truck` after Wrong, the one
 * shown in the calm grey of what is shown, a later one of the round plain, one outside the round grey.
 * Every block of the section stands in it, never hidden without a trace: once two or more blocks of one kind are
 * outside the round, like the Examples and Tasks round 0 does not need, they fold into one grey line of their kind
 * after its last block, its type word boxed as on their lines and how many, like `Task` boxed and `7 more`, the line
 * of the Tasks with the day the next one comes, like `Tomorrow`, which opens them on a click, as a folder; one alone
 * stays a line of its own, since folding it saves no room. A line I opened stays open while the list is built anew,
 * and the one holding the block shown opens.
 * - `list`: The list.
 * - `linkOf`: Makes the link to a block.
 * - `kindOf`: Gives the type word of a block, empty for none.
 * - `outside`: Whether a block is outside the round.
 * - `folded`: The type words whose blocks outside the round fold into one line.
 * - `inside`: The blocks of a type word outside the round.
 * - `fold`: The line of a type word with its blocks.
 *
 * @param path - Path of the note
 * @param blocks - Headings of its blocks in their order, each with its place
 * @param opened - Type words whose lines were open in the list before
 * @param next - The day the next Task comes, like `Tomorrow`, empty for none, see `roundNextOf` in `../editor/round.ts`
 * @returns The list
 */
export function roundListOf(path: string, blocks: [string, BlockMark][], opened: string[], next: string): HTMLElement {
    const list: HTMLDivElement = document.createElement("div");
    const linkOf: (block: [string, BlockMark]) => HTMLAnchorElement = ([heading, mark]: [string, BlockMark]): HTMLAnchorElement => {
        const link: HTMLAnchorElement = document.createElement("a");
        link.className = `tree-file tree-${mark}`;
        link.href = noteAddressOf(path, heading);
        link.dataset.heading = heading;
        link.append(...blockNameOf(heading));
        if (mark === "done" || mark === "wrong")
            link.append(iconOf(mark === "done" ? Check : X));
        return link;
    };
    const kindOf: (block: [string, BlockMark]) => string = (block: [string, BlockMark]): string =>
        kindRule.exec(block[0])?.[1] ?? "";
    const outside: (block: [string, BlockMark]) => boolean = (block: [string, BlockMark]): boolean =>
        block[1] === "other" || block[1] === "opened";
    const folded: string[] = [...new Set(blocks.map(kindOf))].filter((kind: string): boolean => kind !== ""
        && blocks.filter((block: [string, BlockMark]): boolean => kindOf(block) === kind && outside(block)).length > 1);
    list.className = "tree-children tree-outline tree-round";
    blocks.forEach((block: [string, BlockMark], index: number): void => {
        const kind: string = kindOf(block);
        if (!folded.includes(kind) || !outside(block))
            list.append(linkOf(block));
        if (!folded.includes(kind) || blocks.findLastIndex((other: [string, BlockMark]): boolean => kindOf(other) === kind) !== index)
            return;
        const inside: [string, BlockMark][] = blocks.filter((other: [string, BlockMark]): boolean =>
            kindOf(other) === kind && outside(other));
        const fold: HTMLDetailsElement = folderOf("");
        fold.firstElementChild?.append(kindBoxOf(kind), `${inside.length} more${kind === "Task" && next !== "" ? ` · ${next}` : ""}`);
        fold.classList.add("tree-kind");
        fold.dataset.kind = kind;
        fold.open = opened.includes(kind) || inside.some((other: [string, BlockMark]): boolean => other[1] === "opened");
        fold.lastElementChild?.append(...inside.map(linkOf));
        list.append(fold);
    });
    mathRender(list);
    return list;
}

/**
 * Puts the outline of the note shown under its entry in the tree, as Obsidian's outline: each heading `##` in order,
 * linking to it, each worked or faded task under the block above it that is no task, like
 * `Definition. Standard Error of the Mean`, which then folds its tasks by its arrow and still links to its heading
 * by its name; tasks named without their type word, `Example.`, `Completion.` or `Task.`, formulas rendered as in
 * the note. A block without tasks below it stays a plain link, and so does a task without such a block above it;
 * a cold task, a `Task.`, in a note written the older way `Task. … (cold)`, named also without `(cold)`, stands alone,
 * at the end of its section; there a plain `Task.` is worked or faded. An Example without a solution is theory.
 * The outline put before goes; a block I folded in it stays folded. A section shows the blocks of its round instead,
 * see {@link roundListOf}, a line of a kind I opened staying open.
 * - `entry`: Entry of the note in the tree, `null` while it is none, like a note of a module not of the semester.
 * - `folded`: Names of the blocks folded in the outline before.
 * - `kinds`: Type words of the lines of a kind open in the list of a section before.
 * - `outline`: The outline.
 * - `lines`: Lines of the note.
 * - `older`: Whether the note is written the older way.
 * - `end`, `solved`: Where the block of a heading ends, and whether it has a solution.
 * - `cold`, `ladder`: Whether a heading is that of a cold task, or of a worked or faded one.
 * - `block`: Link of the last block that is no task, until its first task makes it a folder.
 * - `tasks`: Place of the tasks below that block, the outline itself before the first block.
 * - `heading`: Text of a heading `##` as written, `undefined` for a line that is none.
 * - `link`: Link to a heading, its text rendered.
 *
 * @param tree - The tree
 * @param path - Path of the note shown
 * @param text - Text of the note
 * @param round - Headings of the blocks of a section with their places in its round, `null` for any other note
 * @param next - For a section the day its next Task comes, like `Tomorrow`, empty for none
 */
export function outlineShow(tree: HTMLElement, path: string, text: string, round: [string, BlockMark][] | null,
                            next: string): void {
    const entry: HTMLElement | null = tree.querySelector(`.tree-file.shown[data-path="${CSS.escape(path)}"]`);
    const folded: string[] = [...tree.querySelectorAll<HTMLDetailsElement>(".tree-outline details.tree-folder:not(.tree-kind, [open])")]
        .map((folder: HTMLDetailsElement): string => folder.querySelector<HTMLElement>(".tree-file")?.dataset.heading ?? "");
    const kinds: string[] = [...tree.querySelectorAll<HTMLDetailsElement>(".tree-round details.tree-kind[open]")]
        .map((fold: HTMLDetailsElement): string => fold.dataset.kind ?? "");
    tree.querySelectorAll(".tree-outline").forEach((outline: Element): void => outline.remove());
    if (entry === null)
        return;
    if (round !== null) {
        entry.after(roundListOf(path, round, kinds, next));
        return;
    }

    const outline: HTMLDivElement = document.createElement("div");
    const lines: string[] = text.split(/\r?\n/);
    const older: boolean = lines.some((line: string): boolean => /^## Task\..*\(cold\)[ \t]*$/.test(line));
    let block: HTMLAnchorElement | null = null;
    let tasks: HTMLElement = outline;
    outline.className = "tree-children tree-outline";
    lines.forEach((line: string, index: number): void => {
        const heading: string | undefined = /^##[ \t]+(.+?)[ \t]*$/.exec(line)?.[1];
        if (heading === undefined)
            return;
        const end: number = lines.findIndex((next: string, at: number): boolean => at > index && /^#{1,2}[ \t]/.test(next));
        const solved: boolean = lines.slice(index + 1, end === -1 ? undefined : end)
            .some((next: string): boolean => /^####[ \t]+Solution\b/.test(next));
        const cold: boolean = older ? /^Task\..*\(cold\)$/.test(heading) : heading.startsWith("Task. ");
        const ladder: boolean = !cold && (heading.startsWith("Completion. ") || (older && heading.startsWith("Task. "))
            || (heading.startsWith("Example. ") && solved));
        const link: HTMLAnchorElement = document.createElement("a");
        link.className = "tree-file";
        link.href = noteAddressOf(path, heading);
        link.dataset.heading = heading;
        link.innerHTML = inlineHtmlOf(cold || ladder
            ? heading.replace(/^(Task|Completion|Example)\.\s*/, "").replace(/[ \t]*\(cold\)$/, "") : heading);
        if (!cold && !ladder) {
            outline.append(link);
            block = link;
            tasks = outline;
        } else if (cold) {
            outline.append(link);
        } else {
            if (block !== null) {
                const folder: HTMLDetailsElement = folderOf("");
                folder.open = !folded.includes(block.dataset.heading ?? "");
                block.replaceWith(folder);
                folder.firstElementChild?.replaceChildren(block);
                tasks = folder.lastElementChild as HTMLElement;
                block = null;
            }
            tasks.append(link);
        }
    });
    mathRender(outline);
    entry.after(outline);
}

/**
 * A root of the tree, an area of its own in the rail: the modules of the semester or my new system.
 */
export type TreeRoot = "NomSkillingmodules" | "NomManageplannings";

/**
 * Loads one root of the tree from the reader and shows it, see the top of this file: its name as a heading,
 * then of my modules the pickers of module and chapter, see {@link pickerOf}, of my new system its
 * search, see {@link searchStart},
 * its folders or notes below, those of my new system loaded anew after every change of its files,
 * see {@link filesAgain}, the file or note shown marked, see {@link treeMark}; in the modules, while none is shown,
 * the module asked for is picked, like the module of a skill entry clicked in the day, see `../skill/links.ts`,
 * else the first module, with its first chapter.
 * - `heading`: The name of the root on top.
 * - `search`: The search of my new system, below its name.
 * - `modules`: Of my modules the modules, each with its chapters and notes, see {@link moduleNodeOf}.
 * - `choose`: Picks a module or a chapter: shows it, see {@link chapterShow};
 *   a module with the chapter of the note shown, if it holds the note, else with its first chapter.
 * - `moduleOf`: Gives the name of the folder of the module picked, for the address of its overview.
 * - `modulePick`, `chapterPick`: The pickers of module and chapter, each with its menu, their names opening
 *   the overview of the module, the chapter picked staying picked.
 * - `entries`: Of my new system its folders and files.
 * - `asked`: The module asked for, `null` for none.
 *
 * @param tree - Place of the tree
 * @param root - The root to show
 * @param shown - Path of the file or note shown, empty for none
 * @param module - Name of the folder of the module to open while none is shown,
 *   like `IN2028_BusinessAnalyticsMachineLearning`, empty for the first
 * @throws {Error} - When the reader cannot answer
 */
export async function treeShow(tree: HTMLElement, root: TreeRoot, shown: string, module: string): Promise<void> {
    const heading: HTMLHeadingElement = document.createElement("h2");
    heading.className = "tree-root";
    heading.textContent = root;
    tree.classList.toggle("is-files", root === "NomManageplannings");
    if (root === "NomManageplannings") {
        const search: HTMLInputElement = document.createElement("input");
        const entries: HTMLElement[] = (await readerAsk<FileNode[]>("/api/edit/tree")).map(fileNodeOf);
        tree.replaceChildren(heading, searchFieldOf(search, "Search files"), ...entries);
        searchStart(tree, search);
        treeMark(tree, shown);
        changesFollow((): void => {
            filesAgain(tree, search, shown).catch((error: unknown): void => console.error(error));
        });
        return;
    }

    const modules: HTMLDivElement[] = (await readerAsk<NotesModule[]>("/api/notes/modules")).map(moduleNodeOf);
    const choose: (choice: HTMLElement) => void = (choice: HTMLElement): void => {
        const picked: HTMLElement = choice.closest(".tree-module") as HTMLElement;
        const chapter: HTMLElement | null = choice !== picked ? choice
            : picked.querySelector(".tree-file.shown")?.closest<HTMLElement>(".tree-chapter")
                ?? picked.querySelector(".tree-chapter");
        chapterShow(tree, picked, chapter);
    };
    const moduleOf: () => string = (): string =>
        tree.querySelector<HTMLElement>(".tree-module.picked")?.dataset.module ?? "";
    const modulePick: [HTMLButtonElement, HTMLDivElement] = pickerOf("module", (): HTMLElement[] => modules,
        (choice: HTMLElement): string => choice.dataset.title ?? "", choose,
        (): string => overviewAddressOf(moduleOf(), ""));
    const chapterPick: [HTMLButtonElement, HTMLDivElement] = pickerOf("chapter", (): HTMLElement[] =>
        [...tree.querySelectorAll<HTMLElement>(".tree-module.picked > .tree-chapter")],
        (choice: HTMLElement): string => choice.dataset.chapter ?? "", choose,
        (): string => overviewAddressOf(moduleOf(),
            tree.querySelector<HTMLElement>(".tree-module.picked > .tree-chapter.picked")?.dataset.chapter ?? ""));
    tree.replaceChildren(heading, ...modulePick, ...chapterPick, ...modules);
    if (treeMark(tree, shown) !== null || modules.length === 0)
        return;
    const asked: HTMLDivElement | undefined = modules.find((element: HTMLDivElement): boolean =>
        element.dataset.module === module);
    choose(asked ?? modules[0]);
}
