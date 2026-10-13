/**
 * ## Tree
 *
 * The tree on the left of the scripts view, see `./notes.ts`, and of the editor, see `../editor/editor.ts`,
 * as Obsidian's file explorer, of one of two roots at a time, each an area of its own in the rail:
 * - `NomSkillingmodules`, the book, the modules of the semester, each folding its chapters, of its folder and of its
 *   drafts together, with their notes, which open in the scripts view to read; my module notes are written only
 *   through their drafts, whose pencil opens them in the editor;
 * - `NomManageplannings`, the open folder, my new system, as the reader lists it, without my old system
 *   `NomSystemprevious`, see `reader/files.ts`: a Markdown file, like `Foods.md`, opens in the editor to edit,
 *   an `.ics` file as its plain text to read, any other file shows faint and opens not.
 * The name of the root stands on top as a heading that never folds, its folders right below it, so nothing lies
 * deeper than it needs. Folders come first, all closed but those on the way to the file or note shown; while none is
 * shown, the first module opens, as the scripts view always opened it.
 * The look of the tree is in `./notes.css`.
 */


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
    summary.textContent = name;
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
        link.textContent = node.name;
        return link;
    }
    const name: HTMLSpanElement = document.createElement("span");
    name.className = "tree-file tree-closed";
    name.title = "Only Markdown and .ics files of the three folders of my new system open";
    name.textContent = node.name;
    return name;
}

/**
 * Makes a module of the semester: a folder by its name, like `IN2028_BusinessAnalyticsMachineLearning`,
 * the name of its folder as data, so it can be opened, see {@link treeShow}, its chapters in it, each folding
 * its notes, which link to the scripts view, named without `.md` as in Obsidian;
 * a module without chapter notes holds a calm `No chapters yet`, as the skill view says it.
 * - `folder`: Folder of the module.
 * - `chapter`: Folder of a chapter.
 * - `link`: Link of a note.
 * - `none`: The hint for a module without chapters.
 *
 * @param module - Module with its chapters and their notes
 * @returns Its folder
 */
function moduleNodeOf(module: NotesModule): HTMLDetailsElement {
    const folder: HTMLDetailsElement = folderOf(module.title);
    folder.dataset.module = module.name;
    folder.lastElementChild?.append(...module.chapters.map((chapter: Chapter): HTMLDetailsElement => {
        const chapterFolder: HTMLDetailsElement = folderOf(chapter.title);
        chapterFolder.lastElementChild?.append(...chapter.notes.map((note: NoteEntry): HTMLAnchorElement => {
            const link: HTMLAnchorElement = document.createElement("a");
            link.className = "tree-file";
            link.dataset.path = note.path;
            link.href = noteAddressOf(note.path, "");
            link.textContent = note.name.replace(/\.md$/i, "");
            return link;
        }));
        return chapterFolder;
    }));
    if (module.chapters.length === 0) {
        const none: HTMLParagraphElement = document.createElement("p");
        none.className = "tree-none";
        none.textContent = "No chapters yet";
        folder.lastElementChild?.append(none);
    }
    return folder;
}

/**
 * Marks the file or note shown in the tree, and no other: opens every folder on the way to it and scrolls the tree
 * to it.
 * - {@link CSS.escape}: Writes a path so it can stand inside a selector.
 * - `link`: Entry of the file or note shown, `null` while it is not in the tree.
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
    let folder: HTMLDetailsElement | null = link.closest("details");
    while (folder !== null) {
        folder.open = true;
        folder = folder.parentElement?.closest("details") ?? null;
    }
    link.scrollIntoView({ block: "nearest" });
    return link;
}

/**
 * A root of the tree, an area of its own in the rail: the modules of the semester or my new system.
 */
export type TreeRoot = "NomSkillingmodules" | "NomManageplannings";

/**
 * Loads one root of the tree from the reader and shows it, see the top of this file: its name as a heading, its
 * folders below, the file or note shown marked, see {@link treeMark}; in the modules, while none is shown, the module
 * asked for stands open, scrolled into sight, like the module of a skill entry clicked in the day,
 * see `../skill/links.ts`, else the first module.
 * - `heading`: The name of the root on top.
 * - `entries`: Its folders and files.
 * - `asked`: The folder of the module asked for, `null` for none.
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
    const entries: HTMLElement[] = root === "NomManageplannings"
        ? (await readerAsk<FileNode[]>("/api/edit/tree")).map(fileNodeOf)
        : (await readerAsk<NotesModule[]>("/api/notes/modules")).map(moduleNodeOf);
    tree.replaceChildren(heading, ...entries);
    if (treeMark(tree, shown) !== null || root === "NomManageplannings")
        return;
    const asked: HTMLDetailsElement | null = module === "" ? null
        : tree.querySelector<HTMLDetailsElement>(`details[data-module="${CSS.escape(module)}"]`);
    (asked ?? tree.querySelector<HTMLDetailsElement>(":scope > details"))?.setAttribute("open", "");
    asked?.scrollIntoView({ block: "nearest" });
}
