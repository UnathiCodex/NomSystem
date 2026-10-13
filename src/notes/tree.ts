/**
 * ## Tree
 *
 * Folders of a menu on the left, as Obsidian's file explorer has them, shared by the notes view and the editor;
 * their look is in `./notes.css`.
 */


/**
 * Makes a folder of the menu that folds, like a chapter: its name, and below it the place of its entries.
 *
 * @param name - Name shown, like `01 Regression Analysis`
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
