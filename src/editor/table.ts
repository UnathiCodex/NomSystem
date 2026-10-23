/**
 * ## Table
 *
 * A table of a note opened over the whole page, as Notion opens a page in full, see `BlockWidget` in `./preview.ts`:
 * its rows scrolling both ways under its head row, its cells as wide as their text, see `.table-viewer`
 * in `../notes/notes.css`, the cross at its top left closing it, as `Esc` does, at its top right the save button
 * of the editor again, its floppy disk faint or full grey as there, and beside it whether the changes are saved.
 * I edit it as a spreadsheet, never its Markdown: a click on a cell, its head too, shows the text of the cell to type
 * in, `Enter` keeps it and goes a row down, `Tab` keeps it and goes a cell right, `Shift+Tab` left, `Esc` takes it
 * back, a click elsewhere keeps it; the plus below the table adds an empty row at its end, ready to type.
 * Each change goes at once into the text of the editor, only the cell changed, the rest of its line and every
 * other line as they were, so the editor below shows it and saves it as any change, by the save button or Ctrl+S,
 * never by itself, refused when the file changed on the disk since it was read, see `noteSave` in `./editor.ts`:
 * the save button of the table presses that of the editor, and both show what the editor's shows.
 * A link in a cell opens by a click with Ctrl held, Cmd on a Mac, which closes the table; a plain click edits its cell.
 * A file to read only, like an `.ics` file, shows its table only to read.
 *
 * - `lucide`, `../icons.ts`: The cross that closes it, the floppy disk of saving and the one plus of every list,
 *   which adds a row.
 */

import { Save, X } from "lucide";
import { iconPut, plusPut } from "../icons.ts";

import type { Line } from "@codemirror/state";
import type { EditorView } from "@codemirror/view";


/**
 * A line of a table: begins with `|`, after the indentation and the `>` of a quote or callout around it.
 */
const rowRule: RegExp = /^[ \t>]*\|/;

/**
 * Opens a table of the note over the whole page, see the top of this file.
 * - `editorSave`, `editorState`: The save button of the editor and whether its changes are saved, like `Saved 20:41`,
 *   see `./editor.html`, which the save button and the state of the table repeat.
 * - `holder`: Holds the table, drawn anew from the text after each change, see `show`.
 * - `commit`: Keeps the text typed into the cell being edited and edits the cell given next, `null` while no cell
 *   is edited, see `edit`.
 * - {@link MutationObserver}: Repeats the grey of the editor's save button and its state whenever they change.
 * - `mousedown`: A press on a cell edits it, without taking the focus from the cell being edited, which keeps
 *   its text first; a press with Ctrl or Cmd held on a link leaves the click to follow it.
 * - `click`: A click with Ctrl or Cmd held on a link follows it and closes the table; a plain one stays on the page.
 * - `keydown`: `Esc` closes the table while no cell is edited; the cell being edited takes its own keys first.
 *
 * @param view - The editor
 * @param from - Start of the first line of the table, its head
 * @param render - Renders Markdown as the note shows it, see `blockRender` in `./preview.ts`
 * @param follow - Follows the link clicked, and tells whether it was one
 */
export function tableOpen(view: EditorView, from: number, render: (markdown: string) => HTMLElement,
                          follow: (event: MouseEvent) => boolean): void {
    const editorSave: HTMLElement = document.getElementById("editor-save") as HTMLElement;
    const editorState: HTMLElement = document.getElementById("editor-state") as HTMLElement;
    const viewer: HTMLDivElement = document.createElement("div");
    const close: HTMLButtonElement = document.createElement("button");
    const state: HTMLSpanElement = document.createElement("span");
    const save: HTMLButtonElement = document.createElement("button");
    const body: HTMLDivElement = document.createElement("div");
    const holder: HTMLDivElement = document.createElement("div");
    const add: HTMLButtonElement = document.createElement("button");
    let table: HTMLTableElement = document.createElement("table");
    let commit: ((next: [number, number] | null) => void) | null = null;

    /**
     * Gives the lines of the table as they stand in the text now, from its head to its last row.
     */
    const linesOf = (): Line[] => {
        const lines: Line[] = [];
        for (let number: number = view.state.doc.lineAt(from).number;
             number <= view.state.doc.lines && rowRule.test(view.state.doc.line(number).text); number++)
            lines.push(view.state.doc.line(number));
        return lines;
    };

    /**
     * Gives the line of a row of the table, the head being 0, the line of `-` under the head left out.
     */
    const lineOf = (row: number): Line => linesOf()[row === 0 ? 0 : row + 1];

    /**
     * Draws the table anew from the text, its links telling how they open.
     */
    const show = (): void => {
        const lines: Line[] = linesOf();
        table = render(lines.map((line: Line): string => line.text).join("\n")).querySelector("table")
            ?? document.createElement("table");
        table.querySelectorAll<HTMLAnchorElement>("a").forEach((link: HTMLAnchorElement): void => {
            link.title = "Ctrl+click to open";
        });
        holder.replaceChildren(table);
    };

    /**
     * Gives the cell after a cell, or before it, going on in the next or previous row, `null` past the table.
     */
    const besideOf = (row: number, column: number, step: number): [number, number] | null => {
        const cells: number = table.rows[row].cells.length;
        if (column + step >= 0 && column + step < cells)
            return [row, column + step];
        if (step > 0 && row + 1 < table.rows.length)
            return [row + 1, 0];
        if (step < 0 && row > 0)
            return [row - 1, table.rows[row - 1].cells.length - 1];
        return null;
    };

    /**
     * Edits a cell: shows its text in a field in its place, see the top of this file.
     * - `done`: Whether the text is kept or taken back already, so a blur after `Enter` keeps nothing twice.
     * - `end`: Keeps the text typed, `null` to take it back, draws the table anew, and edits the cell given next.
     */
    const edit = (row: number, column: number): void => {
        const cell: HTMLTableCellElement | undefined = table.rows[row]?.cells[column];
        if (cell === undefined)
            return;

        const input: HTMLInputElement = document.createElement("input");
        let done: boolean = false;
        const end = (value: string | null, next: [number, number] | null): void => {
            if (done)
                return;
            done = true;
            commit = null;
            const line: Line = lineOf(row);
            const text: string = value === null ? line.text : cellWritten(line.text, column, value);
            if (text !== line.text)
                view.dispatch({ changes: { from: line.from, to: line.to, insert: text } });
            show();
            if (next !== null)
                edit(next[0], next[1]);
        };
        input.className = "table-cell-input";
        input.value = cellTextOf(lineOf(row).text, column);
        input.addEventListener("keydown", (event: KeyboardEvent): void => {
            if (event.key === "Enter") {
                event.preventDefault();
                end(input.value, row + 1 < table.rows.length ? [row + 1, column] : null);
            } else if (event.key === "Tab") {
                event.preventDefault();
                end(input.value, besideOf(row, column, event.shiftKey ? -1 : 1));
            } else if (event.key === "Escape") {
                event.stopPropagation();
                end(null, null);
            } else if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
                end(input.value, null);
            }
        });
        input.addEventListener("blur", (): void => end(input.value, null));
        commit = (next: [number, number] | null): void => end(input.value, next);
        cell.replaceChildren(input);
        input.focus();
    };

    /**
     * Repeats the grey of the editor's save button and whether its changes are saved.
     */
    const saveShow = (): void => {
        save.classList.toggle("unsaved", editorSave.classList.contains("unsaved"));
        state.textContent = editorState.textContent;
    };
    const watch: MutationObserver = new MutationObserver(saveShow);

    /**
     * Closes `Esc` while no cell is edited.
     */
    const keyDown = (event: KeyboardEvent): void => {
        if (event.key === "Escape")
            shut();
    };

    /**
     * Closes the table, keeping the text of a cell being edited.
     */
    const shut = (): void => {
        commit?.(null);
        watch.disconnect();
        window.removeEventListener("keydown", keyDown);
        viewer.remove();
    };

    viewer.className = "table-viewer markdown";
    viewer.setAttribute("role", "dialog");
    viewer.setAttribute("aria-label", "Table");
    close.className = "table-viewer-close";
    close.type = "button";
    iconPut(close, X, "Close");
    close.addEventListener("click", shut);
    state.className = "table-viewer-state";
    save.className = "editor-save table-viewer-save";
    save.type = "button";
    iconPut(save, Save, "Save");
    save.hidden = view.state.readOnly;
    save.addEventListener("mousedown", (event: MouseEvent): void => event.preventDefault());
    save.addEventListener("click", (): void => {
        commit?.(null);
        editorSave.click();
    });
    body.className = "table-viewer-body";
    add.type = "button";
    plusPut(add, "Add a row");
    add.classList.add("table-viewer-add");
    add.hidden = view.state.readOnly;
    add.addEventListener("click", (): void => {
        const last: Line = linesOf()[linesOf().length - 1];
        const indentation: string = /^[ \t>]*/.exec(last.text)?.[0] ?? "";
        view.dispatch({ changes: { from: last.to, insert: `${view.state.lineBreak}${indentation}| `
                + `${Array<string>(table.rows[0].cells.length).fill("").join(" | ")} |` } });
        show();
        edit(table.rows.length - 1, 0);
    });
    body.append(holder, add);
    viewer.append(close, state, save, body);
    viewer.addEventListener("mousedown", (event: MouseEvent): void => {
        const target: Element = event.target as Element;
        const cell: HTMLTableCellElement | null = target.closest("td, th");
        if (event.button !== 0 || cell === null || target.closest("input") !== null || view.state.readOnly
            || ((event.ctrlKey || event.metaKey) && target.closest("a") !== null))
            return;
        event.preventDefault();
        const at: [number, number] = [[...table.rows].indexOf(cell.parentElement as HTMLTableRowElement), cell.cellIndex];
        if (commit !== null)
            commit(at);
        else
            edit(at[0], at[1]);
    });
    viewer.addEventListener("click", (event: MouseEvent): void => {
        if ((event.ctrlKey || event.metaKey) && follow(event))
            shut();
        else if ((event.target as Element).closest("a") !== null)
            event.preventDefault();
    });
    show();
    saveShow();
    watch.observe(editorSave, { attributes: true, attributeFilter: ["class"] });
    watch.observe(editorState, { childList: true, characterData: true, subtree: true });
    document.body.append(viewer);
    window.addEventListener("keydown", keyDown);
    close.focus();
}

/**
 * Finds the `|` of a line of a table that part its cells, an escaped one, `\|`, like in `[[Note\|Text]]`, left out.
 *
 * @param text - The line
 * @returns Where each `|` stands
 */
function barsOf(text: string): number[] {
    const bars: number[] = [];
    for (let index: number = 0; index < text.length; index++)
        if (text[index] === "|" && text[index - 1] !== "\\")
            bars.push(index);
    return bars;
}

/**
 * Gives the text of a cell of a line of a table as I type it, without the spaces around it and with its `\|`
 * as `|`; empty for a cell the line lacks.
 *
 * @param text - The line
 * @param column - Number of the cell, the first being 0
 * @returns Its text, like `[[Note|Text]]`
 */
function cellTextOf(text: string, column: number): string {
    const bars: number[] = barsOf(text);
    if (column >= bars.length)
        return "";
    return text.slice(bars[column] + 1, bars[column + 1] ?? text.length).trim().replace(/\\\|/g, "|");
}

/**
 * Writes the text of a cell into a line of a table, its `|` escaped as `\|`, between the spaces the cell had,
 * one on each side for an empty one, like `| 4311501435229 |`; the rest of the line as it was. A line with fewer cells
 * gets the missing ones at its end, empty ones as `|  |`, as every empty cell of my tables.
 * - `cells`: How many cells the line has, ended by its last `|`.
 *
 * @param text - The line
 * @param column - Number of the cell, the first being 0
 * @param value - Its text as typed
 * @returns The line with it
 */
function cellWritten(text: string, column: number, value: string): string {
    const bars: number[] = barsOf(text);
    const escaped: string = value.trim().replace(/\|/g, "\\|");
    if (column + 1 < bars.length) {
        const old: string = text.slice(bars[column] + 1, bars[column + 1]);
        const before: string = old.trim() === "" ? " " : /^\s*/.exec(old)?.[0] ?? "";
        const after: string = old.trim() === "" ? " " : /\s*$/.exec(old)?.[0] ?? "";
        return `${text.slice(0, bars[column] + 1)}${before}${escaped}${after}${text.slice(bars[column + 1])}`;
    }

    let written: string = text.trimEnd();
    if (!written.endsWith("|") || written.endsWith("\\|"))
        written += " |";
    for (let cells: number = barsOf(written).length - 1; cells < column; cells++)
        written += "  |";
    return `${written} ${escaped} |`;
}
