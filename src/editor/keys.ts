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
 * - Alt+Up and Alt+Down move the line of the cursor, or the lines picked, one line up or down; a list item goes
 *   with its sub-points and further lines past the item before or after it, see {@link itemMove}.
 * - Ctrl+B and Ctrl+I make the text picked bold or italic, `**…**` and `*…*`, or take it back;
 *   with nothing picked the word at the cursor, see {@link markupToggle}.
 * - Ctrl+D takes away the line of the cursor, or the lines picked, as Obsidian's Delete paragraph.
 *
 * - `@codemirror/state`, `@codemirror/view`: The text with its cursor, and the keys.
 * - `@codemirror/commands`: CodeMirror's own commands: a tab at the cursor, indenting lines, deleting lines.
 * - `@codemirror/language`: The syntax tree of the note, which tells where a list item begins and ends.
 * - `@codemirror/lang-markdown`: Continues a list on Enter and takes its markup away on Backspace.
 */

import { EditorSelection, Prec, Transaction } from "@codemirror/state";
import { keymap } from "@codemirror/view";
import { deleteLine, indentLess, indentMore, insertTab } from "@codemirror/commands";
import { syntaxTree } from "@codemirror/language";
import { deleteMarkupBackward, insertNewlineContinueMarkupCommand } from "@codemirror/lang-markdown";

import type { ChangeSpec, EditorState, Extension, Line, SelectionRange, StateCommand } from "@codemirror/state";
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
 * Swaps two blocks of whole lines that stand right below each other, like a list item and the one before it,
 * and moves the cursor or what is picked along with the block it stands in.
 * - `upper`, `lower`: The text of the two blocks.
 *
 * @param view - The editor
 * @param from - Start of the first line of the upper block
 * @param middle - Start of the first line of the lower block
 * @param to - End of the last line of the lower block
 * @param inLower - Whether the cursor stands in the lower block, which then moves up, else in the upper one
 */
function blocksSwap(view: EditorView, from: number, middle: number, to: number, inLower: boolean): void {
    const upper: string = view.state.sliceDoc(from, middle - view.state.lineBreak.length);
    const lower: string = view.state.sliceDoc(middle, to);
    const shift: number = inLower ? -(upper.length + view.state.lineBreak.length) : lower.length + view.state.lineBreak.length;
    view.dispatch({
        changes: { from: from, to: to, insert: lower + view.state.lineBreak + upper },
        selection: EditorSelection.create(view.state.selection.ranges.map((range: SelectionRange): SelectionRange =>
            EditorSelection.range(range.anchor + shift, range.head + shift)), view.state.selection.mainIndex),
        scrollIntoView: true,
        userEvent: "move.line",
    });
}

/**
 * Moves a list item one up, Alt+Up, or down, Alt+Down, with its sub-points and further lines, past the item before
 * or after it in its list, with that item's own sub-points; the first or last item of its list moves one line,
 * still with its sub-points. Outside a list, and on lines picked beyond one item, it leaves the key to CodeMirror's
 * own Move line up or down, which moves the lines of the cursor or picked one line, as Obsidian does.
 * - `item`: The list item of the cursor.
 * - `first`, `last`: The first and the last line of the item.
 * - `sibling`: The item before or after it in its list, `null` for none.
 * - `line`: The line it moves past where it has no such item.
 *
 * @param down - Whether it moves down, else up
 * @returns The command
 */
function itemMove(down: boolean): Command {
    return (view: EditorView): boolean => {
        const item: SyntaxNode | null = itemAt(view.state);
        if (item === null || view.state.readOnly)
            return false;

        const first: Line = view.state.doc.lineAt(item.from);
        const last: Line = view.state.doc.lineAt(item.to);
        const sibling: SyntaxNode | null = down ? item.nextSibling : item.prevSibling;
        if (sibling?.name === "ListItem") {
            if (down)
                blocksSwap(view, first.from, view.state.doc.lineAt(sibling.from).from, view.state.doc.lineAt(sibling.to).to, false);
            else
                blocksSwap(view, view.state.doc.lineAt(sibling.from).from, first.from, last.to, true);
            return true;
        }
        if (down ? last.number === view.state.doc.lines : first.number === 1)
            return true;
        const line: Line = view.state.doc.line(down ? last.number + 1 : first.number - 1);
        if (down)
            blocksSwap(view, first.from, line.from, line.to, false);
        else
            blocksSwap(view, line.from, first.from, last.to, true);
        return true;
    };
}

/**
 * Counts the markup characters, like `*`, right before or after a place, up to three, as `***` is bold and italic.
 *
 * @param state - Text
 * @param pos - Place
 * @param forward - Whether to count after it, else before
 * @param char - Markup character, like `*`
 * @returns How many stand there in a row, at most three
 */
function marksCount(state: EditorState, pos: number, forward: boolean, char: string): number {
    let count: number = 0;
    while (count < 3 && state.sliceDoc(forward ? pos + count : pos - count - 1, forward ? pos + count + 1 : pos - count) === char)
        count++;
    return count;
}

/**
 * Makes text bold, Ctrl+B with `**`, or italic, Ctrl+I with `*`, as Obsidian does: the text picked, else the word
 * at the cursor, gets the markup around it, or loses it when it is already bold or italic, so the same key takes it
 * back; `***` counts as both. In empty space it writes the markup twice with the cursor between, to type into.
 * - `word`: The text to mark: the text picked, or the word at the cursor, `null` for none.
 * - `before`, `after`: The markup characters right before and after it.
 * - `marked`: Whether it is marked already: bold with two or three on both sides, italic with one or three.
 *
 * @param mark - Markup, `**` or `*`
 * @returns The command
 */
function markupToggle(mark: string): Command {
    return (view: EditorView): boolean => {
        if (view.state.readOnly)
            return false;

        view.dispatch(view.state.changeByRange((range: SelectionRange): { range: SelectionRange; changes: ChangeSpec } => {
            const word: SelectionRange | null = range.empty ? view.state.wordAt(range.head) : range;
            if (word === null)
                return { range: EditorSelection.cursor(range.head + mark.length), changes: { from: range.head, insert: mark + mark } };

            const before: number = marksCount(view.state, word.from, false, mark[0]);
            const after: number = marksCount(view.state, word.to, true, mark[0]);
            const marked: boolean = mark.length === 2 ? Math.min(before, after) >= 2 : Math.min(before, after) % 2 === 1;
            if (marked)
                return {
                    range: EditorSelection.range(range.anchor - mark.length, range.head - mark.length),
                    changes: [{ from: word.from - mark.length, to: word.from }, { from: word.to, to: word.to + mark.length }],
                };
            return {
                range: EditorSelection.range(range.anchor + mark.length, range.head + mark.length),
                changes: [{ from: word.from, insert: mark }, { from: word.to, insert: mark }],
            };
        }), { scrollIntoView: true, userEvent: "input" });
        return true;
    };
}

/**
 * Keys of a Markdown file, see the top of this file; Tab and Shift+Tab, Alt+Up and Alt+Down try the list item first,
 * then the key goes on to the next command, CodeMirror's own.
 */
export const markdownKeys: Extension = Prec.high(keymap.of([
    { key: "Enter", run: insertNewlineContinueMarkupCommand({ nonTightLists: false }) },
    { key: "Shift-Enter", run: pointContinue },
    { key: "Backspace", run: deleteMarkupBackward },
    { key: "Tab", run: itemIndent(true), shift: itemIndent(false) },
    { key: "Tab", run: insertTab, shift: indentLess },
    { key: "Alt-ArrowUp", run: itemMove(false) },
    { key: "Alt-ArrowDown", run: itemMove(true) },
    { key: "Mod-b", run: markupToggle("**") },
    { key: "Mod-i", run: markupToggle("*") },
    { key: "Mod-d", run: deleteLine },
]));
