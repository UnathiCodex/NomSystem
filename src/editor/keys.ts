/**
 * ## Keys
 *
 * The keys of a Markdown file in the editor, as in Obsidian, see `./editor.ts`; they go before CodeMirror's usual keys:
 * - Enter continues a list, a task list or a quote on the next line, and on an empty item ends the list, one level
 *   at a time; Shift+Enter goes on in the same point on the next line, see {@link pointContinue};
 *   Backspace right after the `-` of an item or the `>` of a quote takes it away.
 * - Tab moves a list item one step in, Shift+Tab one step out, always with its sub-points and further lines,
 *   see {@link itemIndent}; outside a list Tab writes a tab where the cursor is, on several lines picked it moves
 *   them all one step in, and Shift+Tab one step out.
 *
 * - `@codemirror/state`, `@codemirror/view`: The text with its cursor, and the keys.
 * - `@codemirror/commands`: CodeMirror's own commands: a tab at the cursor, indenting lines.
 * - `@codemirror/language`: The syntax tree of the note, which tells where a list item begins and ends.
 * - `@codemirror/lang-markdown`: Continues a list on Enter and takes its markup away on Backspace.
 */

import { EditorSelection, Prec, Transaction } from "@codemirror/state";
import { keymap } from "@codemirror/view";
import { indentLess, indentMore, insertTab } from "@codemirror/commands";
import { syntaxTree } from "@codemirror/language";
import { deleteMarkupBackward, insertNewlineContinueMarkupCommand } from "@codemirror/lang-markdown";

import type { EditorState, Extension, Line, SelectionRange, StateCommand } from "@codemirror/state";
import type { Command, EditorView } from "@codemirror/view";
import type { SyntaxNode } from "@lezer/common";


/**
 * Goes on in the same point of a list on the next line, with Shift+Enter, where I find a break nice, as Enter starts
 * the next point: the new line stands under the text of the point, its tabs and then as many spaces as its `-`
 * or number with the space after it, two under `- `, three under `1. `, as my notes write a further line of a point;
 * a further line keeps its own indentation; outside a list it is a plain new line.
 * The scripts view and the preview show such a line in its point, below its text, see `./preview.ts`.
 * - `line`: The line of the cursor.
 * - `point`: Its tabs and its `-` or number with the space after it, `null` for a line that starts no point.
 * - `indentation`: Indentation of the new line.
 *
 * @param view - The editor
 * @returns `true`, as it always takes the key
 */
const pointContinue: Command = (view: EditorView): boolean => {
    const line: Line = view.state.doc.lineAt(view.state.selection.main.head);
    const point: RegExpExecArray | null = /^(\t*)((?:[-*+]|\d+[.)])[ \t])/.exec(line.text);
    const indentation: string = point !== null ? point[1] + " ".repeat(point[2].length)
        : /^[ \t]*/.exec(line.text)?.[0] ?? "";
    view.dispatch(view.state.update(view.state.replaceSelection(view.state.lineBreak + indentation),
        { scrollIntoView: true, userEvent: "input" }));
    return true;
};

/**
 * Finds the list item the cursor stands in, or the lines picked, when they lie on its lines: the innermost item
 * around the start of the text of the first line, so a further line of a point or a sub-point is found too.
 * - `line`: First line of what is picked.
 * - `last`: Last line of what is picked.
 * - `node`: A piece of syntax around the start of the text, from the innermost outwards.
 *
 * @param state - Text and cursor
 * @returns The item, `ListItem`, `null` outside a list or when the lines picked reach beyond it
 */
function itemAt(state: EditorState): SyntaxNode | null {
    const line: Line = state.doc.lineAt(state.selection.main.from);
    const last: Line = state.doc.lineAt(state.selection.main.to);
    for (let node: SyntaxNode | null = syntaxTree(state).resolveInner(line.from + (/^[ \t]*/.exec(line.text)?.[0].length ?? 0), 1);
         node !== null; node = node.parent)
        if (node.name === "ListItem")
            return last.to <= state.doc.lineAt(node.to).to ? node : null;
    return null;
}

/**
 * Runs one of CodeMirror's commands on the lines of a list item, from the line of its `-` to its last sub-point or
 * further line, as if they were picked, and keeps my cursor where it was in the text.
 *
 * @param view - The editor
 * @param item - The list item
 * @param command - CodeMirror's command, like `indentMore`
 */
function itemLinesRun(view: EditorView, item: SyntaxNode, command: StateCommand): void {
    const lines: SelectionRange = EditorSelection.range(view.state.doc.lineAt(item.from).from, view.state.doc.lineAt(item.to).to);
    command({
        state: view.state.update({ selection: lines }).state,
        dispatch: (transaction: Transaction): void => view.dispatch({
            changes: transaction.changes,
            selection: view.state.selection.map(transaction.changes, 1),
            userEvent: transaction.annotation(Transaction.userEvent),
        }),
    });
}

/**
 * Moves a list item one step in, Tab, or out, Shift+Tab, with its sub-points and further lines, as Obsidian does:
 * in only below an item of its own list, under which it then stands, out only from a sub-point.
 * Outside a list, and on lines picked beyond one item, it leaves the key to the next, see {@link markdownKeys}.
 * - `item`: The list item of the cursor.
 * - `nested`: Whether it is a sub-point, an item of a list inside another item.
 *
 * @param inward - Whether it moves in, else out
 * @returns The command
 */
function itemIndent(inward: boolean): Command {
    return (view: EditorView): boolean => {
        const item: SyntaxNode | null = itemAt(view.state);
        if (item === null)
            return false;

        const nested: boolean = item.parent?.parent?.name === "ListItem";
        if (inward && item.prevSibling?.name === "ListItem")
            itemLinesRun(view, item, indentMore);
        else if (!inward && nested)
            itemLinesRun(view, item, indentLess);
        return true;
    };
}

/**
 * Keys of a Markdown file, see the top of this file; Tab and Shift+Tab try the list item first, then the key goes on
 * to the next command, CodeMirror's own.
 */
export const markdownKeys: Extension = Prec.high(keymap.of([
    { key: "Enter", run: insertNewlineContinueMarkupCommand({ nonTightLists: false }) },
    { key: "Shift-Enter", run: pointContinue },
    { key: "Backspace", run: deleteMarkupBackward },
    { key: "Tab", run: itemIndent(true), shift: itemIndent(false) },
    { key: "Tab", run: insertTab, shift: indentLess },
]));
