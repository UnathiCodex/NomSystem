/**
 * ## Tree
 *
 * The tree on the left of the editor, see `../editor/editor.ts`, which is the scripts view too,
 * as Obsidian's file explorer, of one of two roots at a time, each an area of its own in the rail:
 * - `NomSkillingmodules`, the book, the modules of the semester, one at a time, since I learn one module at a time:
 *   right below the name of the root the module picked, then its chapter picked, of its folder and of its drafts
 *   together, each a picker whose menu comes down below it, see {@link pickerOf}, then the notes of that chapter
 *   as a plain list, nothing folding, which open in the scripts view to write; of my modules the reader writes only
 *   the drafts;
 * - `NomManageplannings`, the open folder, my new system, as the reader lists it, without my old system
 *   `NomSystemprevious`, see `reader/files.ts`: a Markdown file, like `Foods.md`, opens in the editor to edit,
 *   an `.ics` file as its plain text to read, any other file shows faint and opens not.
 * The name of the root stands on top as a heading that never folds, so nothing lies deeper than it needs.
 * Of my modules the module and chapter of the note shown are picked; while none is shown, the module asked for,
 * else the first, with its first chapter. Of my new system its folders stand right below, folders first,
 * all closed but those on the way to the file shown.
 * A search filters the tree as I type, as every list of the page has one, of my modules only the module picked,
 * see {@link searchStart}.
 * Under the note shown stands its outline, as Obsidian's outline, see {@link outlineShow}; under a section its blocks
 * in the places of its round, see {@link roundListOf}.
 * Each name stands on one line, one too long for it ending in dots; on a phone, whose tree is narrower than
 * a computer's, a name goes on below between its parts instead, like `IN2028_BusinessAnalytics` and `MachineLearning`,
 * see `breakableOf` in `../day/choices.ts`; its look is in `./notes.css`.
 *
 * - `../search.ts`: Compares a typed text with the paths of the files and notes, as every search of the page does.
 * - `../day/choices.ts`: Marks where a long name may go on below.
 * - `./markdown.ts`, `./math.ts`: Render the headings of the outline, their formulas as in the note.
 * - `lucide`, `../icons.ts`: The check of a block done in its round.
 */

import { matchesAll, wordsOf } from "../search.ts";
import { breakableOf } from "../day/choices.ts";
import { inlineHtmlOf } from "./markdown.ts";
import { mathRender } from "./math.ts";
import { iconOf } from "../icons.ts";
import { Check } from "lucide";


/**
 * A folder or file of `NomManageplannings`, as the reader sends it.
 *
 * - `name`: Its name, like `2026_10` or `Foods.md`.
 * - `path`: Its path from `NomManageplannings`, like `NomMetainformations/Foods.md`.
 * - `folder`: Whether it is a folder.
 * - `opens`: Whether the editor opens it: a Markdown or `.ics` file of the three folders of my new system.
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
 * - `path`: Path, from `NomSkillingmodules`, or with `Drafts/` before for a draft.
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
 * Asks the reader for something as JSON.
 *
 * @param address - Address at the reader, like `/api/edit/tree`
 * @returns Answer of the reader
 * @throws {Error} - When the reader cannot answer
 */
async function readerAsk<T>(address: string): Promise<T> {
    const response: Response = await fetch(address);
    if (!response.ok)
        throw new Error(`The reader could not answer ${address}`);
    return await response.json() as T;
}

/**
 * Makes a folder or file of `NomManageplannings`: a folder with its entries; a file that opens as a link
 * to it in the editor, named as on the disk, like `Foods.md`; any other file faint, opening nothing.
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
    name.title = "Only Markdown and .ics files of the three folders of my new system open";
    name.textContent = breakableOf(node.name);
    return name;
}

/**
 * Makes a module of the semester, shown once it is picked, see {@link chapterShow}: the name of its folder
 * and its name as data, so it can be picked, see {@link treeShow}, its chapters in it, each shown once it is picked,
 * its notes a plain list, which link to the scripts view, named without `.md` as in Obsidian;
 * a module without chapter notes holds a calm `No chapters yet`, as the skill view says it.
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
 * Makes a picker of the tree of my modules, see the top of this file: a row, the name of what is picked with a grey
 * arrow after it, which opens its menu right below it, the browser's own popover, which a pick, Escape or a click
 * beside it closes; each choice a row, the one picked in the calm grey of what is picked.
 * - `pick`: The row, a button.
 * - `name`: The name of what is picked on it, before its arrow, see `.tree-pick` in `./notes.css`.
 * - `menu`: The menu.
 *
 * @param kind - What it picks, `module` or `chapter`, which names its anchor, see `.tree-pick` in `./notes.css`
 * @param choices - Gives what it may pick: the modules, or the chapters of the module picked
 * @param nameOf - Gives the name of a choice, like `01_RegressionAnalysis`
 * @param choose - Shows the choice picked
 * @returns The row and its menu
 */
function pickerOf(kind: string, choices: () => HTMLElement[], nameOf: (choice: HTMLElement) => string,
                  choose: (choice: HTMLElement) => void): [HTMLButtonElement, HTMLDivElement] {
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
            });
            return row;
        }));
    });
    return [pick, menu];
}

/**
 * Shows one chapter of one module in the tree of my modules, see the top of this file: their names in their pickers,
 * the notes of that chapter below, both marked `picked`, every other module and chapter hidden, see `./notes.css`;
 * a module without chapters shows its hint `No chapters yet` and no picker of chapters.
 * - `chapterPick`: The picker of the chapter.
 *
 * @param tree - The tree
 * @param module - The module, see {@link moduleNodeOf}
 * @param chapter - A chapter of it, `null` for a module without chapters
 */
function chapterShow(tree: HTMLElement, module: HTMLElement, chapter: HTMLElement | null): void {
    tree.querySelectorAll<HTMLElement>(".tree-module").forEach((other: HTMLElement): void => {
        other.classList.toggle("picked", other === module);
    });
    module.querySelectorAll<HTMLElement>(".tree-chapter").forEach((other: HTMLElement): void => {
        other.classList.toggle("picked", other === chapter);
    });
    const chapterPick: HTMLButtonElement = tree.querySelector(".tree-pick-chapter") as HTMLButtonElement;
    (tree.querySelector(".tree-pick-module > .tree-pick-name") as HTMLElement).textContent =
        breakableOf(module.dataset.title ?? "");
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
 * Starts the search of the tree: as I type, only the files and notes whose path holds each typed word show,
 * of my modules only those of the module picked, of every chapter of it, like `regression` the notes
 * of `01_RegressionAnalysis` and `02_LogisticPoissonRegression`, of my new system every folder on the way to them open;
 * the outline of the note shown and the hint `No chapters yet` hidden; the folders open before the search open again
 * once it is empty, and only the chapter picked shows again. Enter opens the first file or note shown, as a click on it
 * does, Escape empties the search.
 * - `opened`: The folders open before the search, `null` while nothing is typed.
 * - `scope`: Where it searches: the module picked, else the whole tree.
 * - `show`: Shows the tree for the typed text, `tree-searching` on the tree while something is typed,
 *   so every chapter of the module picked shows, see `./notes.css`.
 * - `searched`: The files and notes searched, without the headings of the outline.
 *
 * @param tree - The tree
 * @param search - Its search field
 */
function searchStart(tree: HTMLElement, search: HTMLInputElement): void {
    let opened: Set<HTMLDetailsElement> | null = null;
    const scope: () => HTMLElement = (): HTMLElement =>
        tree.querySelector<HTMLElement>(".tree-module.picked") ?? tree;
    const searched: () => HTMLElement[] = (): HTMLElement[] => [...scope().querySelectorAll<HTMLElement>(".tree-file")]
        .filter((file: HTMLElement): boolean => file.closest(".tree-outline") === null);
    const show: () => void = (): void => {
        const words: string[] = wordsOf(search.value);
        const folders: HTMLDetailsElement[] = [...tree.querySelectorAll<HTMLDetailsElement>("details.tree-folder")]
            .filter((folder: HTMLDetailsElement): boolean => folder.closest(".tree-outline") === null);
        tree.classList.toggle("tree-searching", words.length > 0);
        if (words.length === 0) {
            tree.querySelectorAll(".tree-unfound").forEach((element: Element): void => element.classList.remove("tree-unfound"));
            if (opened !== null)
                folders.forEach((folder: HTMLDetailsElement): void => {
                    folder.open = opened?.has(folder) ?? false;
                });
            opened = null;
            return;
        }
        opened ??= new Set(folders.filter((folder: HTMLDetailsElement): boolean => folder.open));
        searched().forEach((file: HTMLElement): void => {
            file.classList.toggle("tree-unfound", !matchesAll(file.dataset.path ?? file.textContent ?? "", words));
        });
        tree.querySelectorAll(".tree-outline, .tree-none").forEach((element: Element): void => element.classList.add("tree-unfound"));
        folders.forEach((folder: HTMLDetailsElement): void => {
            const found: boolean = [...folder.querySelectorAll<HTMLElement>(".tree-file:not(.tree-unfound)")]
                .some((file: HTMLElement): boolean => file.closest(".tree-outline") === null);
            folder.classList.toggle("tree-unfound", !found);
            if (found)
                folder.open = true;
        });
        scope().querySelectorAll<HTMLElement>(".tree-chapter").forEach((chapter: HTMLElement): void => {
            chapter.classList.toggle("tree-unfound", chapter.querySelector(".tree-file:not(.tree-unfound)") === null);
        });
    };
    search.addEventListener("input", show);
    search.addEventListener("keydown", (event: KeyboardEvent): void => {
        if (event.key === "Enter")
            searched().find((file: HTMLElement): boolean =>
                file instanceof HTMLAnchorElement && !file.classList.contains("tree-unfound"))?.click();
        else if (event.key === "Escape") {
            search.value = "";
            show();
        }
    });
}

/**
 * Place of a block of a section in its round, see `../editor/round.ts`: done, the current one, later in the round,
 * or outside the round.
 */
export type BlockMark = "done" | "current" | "round" | "other";

/**
 * Builds the list of the blocks of a section in their order, each linking to its heading by its heading as written,
 * without an older `(cold)`: a block done with a check after it, the current one in the calm grey of what is shown,
 * a later one of the round plain, one outside the round grey; the same list stands in the tree and, on a phone,
 * above the note.
 * - `list`: The list.
 * - `link`: Link to a block.
 *
 * @param path - Path of the note
 * @param blocks - Headings of its blocks in their order, each with its place
 * @returns The list
 */
export function roundListOf(path: string, blocks: [string, BlockMark][]): HTMLElement {
    const list: HTMLDivElement = document.createElement("div");
    list.className = "tree-children tree-outline tree-round";
    list.append(...blocks.map(([heading, mark]: [string, BlockMark]): HTMLAnchorElement => {
        const link: HTMLAnchorElement = document.createElement("a");
        link.className = `tree-file tree-${mark}`;
        link.href = noteAddressOf(path, heading);
        link.dataset.heading = heading;
        link.innerHTML = inlineHtmlOf(heading.replace(/[ \t]*\(cold\)$/, ""));
        if (mark === "done")
            link.append(iconOf(Check));
        return link;
    }));
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
 * see {@link roundListOf}.
 * - `entry`: Entry of the note in the tree, `null` while it is none, like a note of a module not of the semester.
 * - `folded`: Names of the blocks folded in the outline before.
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
 */
export function outlineShow(tree: HTMLElement, path: string, text: string, round: [string, BlockMark][] | null): void {
    const entry: HTMLElement | null = tree.querySelector(`.tree-file.shown[data-path="${CSS.escape(path)}"]`);
    const folded: string[] = [...tree.querySelectorAll<HTMLDetailsElement>(".tree-outline details.tree-folder:not([open])")]
        .map((folder: HTMLDetailsElement): string => folder.querySelector<HTMLElement>(".tree-file")?.dataset.heading ?? "");
    tree.querySelectorAll(".tree-outline").forEach((outline: Element): void => outline.remove());
    if (entry === null)
        return;
    if (round !== null) {
        entry.after(roundListOf(path, round));
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
 * of my modules the pickers of module and chapter, see {@link pickerOf}, its search, see {@link searchStart},
 * its folders or notes below, the file or note shown marked, see {@link treeMark}; in the modules, while none is shown,
 * the module asked for is picked, like the module of a skill entry clicked in the day, see `../skill/links.ts`,
 * else the first module, with its first chapter.
 * - `heading`: The name of the root on top.
 * - `search`: The search of the tree, below the pickers.
 * - `modules`: Of my modules the modules, each with its chapters and notes, see {@link moduleNodeOf}.
 * - `choose`: Picks a module or a chapter: shows it, see {@link chapterShow}, and empties the search;
 *   a module with the chapter of the note shown, if it holds the note, else with its first chapter.
 * - `modulePick`, `chapterPick`: The pickers of module and chapter, each with its menu.
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
    const search: HTMLInputElement = document.createElement("input");
    search.type = "search";
    search.className = "tree-search";
    search.placeholder = "Search";
    search.autocomplete = "off";
    if (root === "NomManageplannings") {
        const entries: HTMLElement[] = (await readerAsk<FileNode[]>("/api/edit/tree")).map(fileNodeOf);
        tree.replaceChildren(heading, search, ...entries);
        searchStart(tree, search);
        treeMark(tree, shown);
        return;
    }

    const modules: HTMLDivElement[] = (await readerAsk<NotesModule[]>("/api/notes/modules")).map(moduleNodeOf);
    const choose: (choice: HTMLElement) => void = (choice: HTMLElement): void => {
        const picked: HTMLElement = choice.closest(".tree-module") as HTMLElement;
        const chapter: HTMLElement | null = choice !== picked ? choice
            : picked.querySelector(".tree-file.shown")?.closest<HTMLElement>(".tree-chapter")
                ?? picked.querySelector(".tree-chapter");
        chapterShow(tree, picked, chapter);
        search.value = "";
        search.dispatchEvent(new Event("input"));
    };
    const modulePick: [HTMLButtonElement, HTMLDivElement] = pickerOf("module", (): HTMLElement[] => modules,
        (choice: HTMLElement): string => choice.dataset.title ?? "", choose);
    const chapterPick: [HTMLButtonElement, HTMLDivElement] = pickerOf("chapter", (): HTMLElement[] =>
        [...tree.querySelectorAll<HTMLElement>(".tree-module.picked > .tree-chapter")],
        (choice: HTMLElement): string => choice.dataset.chapter ?? "", choose);
    tree.replaceChildren(heading, ...modulePick, ...chapterPick, search, ...modules);
    searchStart(tree, search);
    if (treeMark(tree, shown) !== null || modules.length === 0)
        return;
    const asked: HTMLDivElement | undefined = modules.find((element: HTMLDivElement): boolean =>
        element.dataset.module === module);
    choose(asked ?? modules[0]);
}
