/**
 * ## Keys
 *
 * The keys of a Markdown file in the editor, as in Obsidian, see `./editor.ts`; they go before CodeMirror's usual keys:
 * - Enter continues a list, a task list or a quote on the next line, and on an empty item moves it one level out,
 *   at the outermost level ends the list; on a further line of a point it starts the next point too, on a spacer line
 *   the next point of its level, see {@link furtherContinue};
 *   Shift+Enter goes on in the same point on the next line, a spacer line without a new bullet,
 *   see {@link pointContinue}; Backspace right after the `-` of a new, empty item makes it the same spacer line,
 *   see {@link spacerBackward}, else right after the `-` of an item or the `>` of a quote takes it away;
 *   Backspace on an empty spacer line moves it one level out, at the outermost level makes it a plain empty line,
 *   see {@link spacerOutward}, and on the last character of a further line leaves it a spacer line, see
 *   {@link textBackward}; so a list is left one level at a time, with a new bullet by Enter or without one by
 *   Backspace. On such an empty line `- ` starts the next point of its level, below a numbered point a sub-point,
 *   `-` and Tab a sub-point, and text typed there belongs to the point of its level, or after the list to no point,
 *   also in Obsidian, see {@link lineTyping} and {@link waitingIndent}.
 * - Tab moves a list item one step in, Shift+Tab one step out, always with its sub-points and further lines,
 *   see {@link itemIndent}, and a spacer line one level, see {@link spacerIndent}; every change of a list counts
 *   its numbered points in order again, a sub-list from `1.`, see {@link listChange}; outside a list Tab writes a tab
 *   where the cursor is, on several lines picked it moves them all one step in, and Shift+Tab one step out.
 * - Alt+Up and Alt+Down move the line of the cursor, or the lines picked, one line up or down; a list item goes
 *   with its sub-points and further lines past the item before or after it, see {@link itemMove}.
 * - Ctrl+Shift+Up and Ctrl+Shift+Down move the line of the cursor, or the lines picked, one line up or down,
 *   only them, as CodeMirror's Move line up and down.
 * - Ctrl+B and Ctrl+I make the text picked bold or italic, `**…**` and `*…*`, or take it back;
 *   with nothing picked the word at the cursor, see {@link markupToggle}.
 * - Ctrl+D takes away the line of the cursor, or the lines picked, as Obsidian's Delete paragraph.
 * - Arrow Down goes past a folded heading or point in one step, see {@link lineDown}.
 *
 * - `@codemirror/state`, `@codemirror/view`: The text with its cursor, and the keys.
 * - `@codemirror/commands`: CodeMirror's own commands: a tab at the cursor, indenting lines, deleting lines,
 *   moving a line up or down.
 * - `@codemirror/language`: The syntax tree of the note, which tells where a list item begins and ends,
 *   and what is folded.
 * - `@codemirror/lang-markdown`: Continues a list on Enter and takes its markup away on Backspace.
 */

import { EditorSelection, Prec, Transaction } from "@codemirror/state";
import { EditorView, keymap } from "@codemirror/view";
import {
    cursorLineDown, deleteLine, indentLess, indentMore, insertTab, moveLineDown, moveLineUp, selectLineDown,
} from "@codemirror/commands";
import { ensureSyntaxTree, foldedRanges, syntaxTree } from "@codemirror/language";
import { deleteMarkupBackward, insertNewlineContinueMarkupCommand } from "@codemirror/lang-markdown";

import type {
    ChangeSpec, EditorState, Extension, Line, SelectionRange, StateCommand, Text, TransactionSpec,
} from "@codemirror/state";
import type { Command } from "@codemirror/view";
import type { SyntaxNode, SyntaxNodeRef } from "@lezer/common";


/**
 * Spacer `⠀` (U+2800): a line of a list with nothing visible on it, which Markdown does not read as empty,
 * so the list and its guide line go on through it, blank in the preview, see `./preview.ts`.
 */
const spacer: string = "⠀";

/**
 * Spacer line: its indentation, then the spacer, maybe text after it.
 */
export const spacerRule: RegExp = /^[ \t]*⠀/;

/**
 * Empty spacer line: its indentation and the spacer, nothing after it.
 */
const emptySpacerRule: RegExp = /^[ \t]*⠀$/;

/**
 * Gives the indentation of the text of a point, as my notes indent a further line of it: its tabs and then as many
 * spaces as its `-` or number with the space after it, two under `- `, three under `1. `.
 * - `point`: Its tabs and its `-` or number with the space after it.
 *
 * @param text - Text of the line of the point, like `\t- θ (theta)`
 * @returns The indentation, like a tab and two spaces, `null` for a line that starts no point
 */
export function textIndentationOf(text: string): string | null {
    const point: RegExpExecArray | null = /^(\t*)((?:[-*+]|\d+[.)])[ \t])/.exec(text);
    return point !== null ? point[1] + " ".repeat(point[2].length) : null;
}

/**
 * Counts the columns of the indentation of a line as Markdown does, a tab up to the next multiple of 4.
 *
 * @param text - Text of the line
 * @returns Columns of its indentation
 */
export function columnsOf(text: string): number {
    let columns: number = 0;
    for (const char of /^[ \t]*/.exec(text)?.[0] ?? "")
        columns = char === "\t" ? columns + 4 - columns % 4 : columns + 1;
    return columns;
}

/**
 * Counts the points of the numbered lists a change touched in order again, as Obsidian does: a sub-list from `1.`,
 * a list at the left edge on from the number its first place had before, each point one more than the one before it,
 * its `.` or `)` kept. So a point moved in by Tab under `1.` becomes `1.` of its sub-list and the `3.` after it `2.`
 * again, `2.` moved above `1.` becomes `1.`; lists the change did not touch keep their numbers.
 * - `doc`: Text after the change.
 * - `from`, `to`: Where the change wrote, `to` on to the end of the line below, whose list it may have made a sub-list.
 * - `changes`: The numbers to write, each over a number that differs.
 * - `before`: Number on the first place of a list before the change, `null` for none.
 * - `number`: Number the next point of the list should have, `null` until its first point is read.
 * - `mark`: The number of a point with its `.` or `)`, `ListMark`.
 * - `written`: That number as written, like `3.`.
 * - `wanted`: The number it should have, like `2.`.
 *
 * @param change - The change, like a point moved in by Tab
 * @returns Changes of the numbers, none when every list touched counts in order
 */
function numbersFixed(change: Transaction): ChangeSpec[] {
    const doc: Text = change.newDoc;
    let from: number = doc.length;
    let to: number = 0;
    change.changes.iterChangedRanges((fromA: number, toA: number, fromB: number, toB: number): void => {
        from = Math.min(from, fromB);
        to = Math.max(to, toB);
    });
    to = doc.line(Math.min(doc.lineAt(to).number + 1, doc.lines)).to;
    const changes: ChangeSpec[] = [];
    ensureSyntaxTree(change.state, doc.length, 200)?.iterate({
        from: Math.min(from, to),
        to: to,
        enter: (node: SyntaxNodeRef): void => {
            if (node.name !== "OrderedList")
                return;
            const before: RegExpExecArray | null = /^[ \t]*(\d+)[.)]/
                .exec(change.startState.doc.lineAt(change.changes.invertedDesc.mapPos(node.from, -1)).text);
            let number: number | null = node.node.parent?.name === "ListItem" ? 1
                : before !== null ? Number(before[1]) : null;
            for (const item of node.node.getChildren("ListItem")) {
                const mark: SyntaxNode | null = item.getChild("ListMark");
                if (mark === null)
                    continue;
                const written: string = doc.sliceString(mark.from, mark.to);
                if (number === null)
                    number = Number.parseInt(written);
                const wanted: string = `${number}${written.slice(-1)}`;
                if (written !== wanted)
                    changes.push({ from: mark.from, to: mark.to, insert: wanted });
                number++;
            }
        },
    });
    return changes;
}

/**
 * Sends a change of a list to the editor with its numbered points counted in order again, see {@link numbersFixed},
 * both in one step of Undo, the cursor where the change put it.
 *
 * @param view - The editor
 * @param spec - The change, like a point moved in by Tab
 */
function listChange(view: EditorView, spec: TransactionSpec): void {
    view.dispatch(spec, { changes: numbersFixed(view.state.update(spec)), sequential: true });
}

/**
 * Goes on in the same point of a list on the next line, with Shift+Enter, where I want a new line but no new bullet,
 * as Enter starts the next point: a spacer line, see {@link spacer}, with the indentation of the point's text,
 * see {@link textIndentationOf}, the cursor after the spacer; below a further line or a spacer line with the same
 * indentation as that line; outside a list a plain new line with the indentation of the line.
 * The scripts view and the preview show such a line in its point, below its text, see `./preview.ts`.
 * - `line`: The line of the cursor.
 * - `indentation`: Indentation of the new line.
 *
 * @param view - The editor
 * @returns `true`, as it always takes the key
 */
const pointContinue: Command = (view: EditorView): boolean => {
    const line: Line = view.state.doc.lineAt(view.state.selection.main.head);
    const indentation: string = textIndentationOf(line.text) ?? /^[ \t]*/.exec(line.text)?.[0] ?? "";
    view.dispatch(view.state.update(view.state.replaceSelection(view.state.lineBreak + indentation
        + (itemOf(view.state, line) !== null ? spacer : "")), { scrollIntoView: true, userEvent: "input" }));
    return true;
};

/**
 * Makes a new, empty item a spacer line with Backspace right after its `-` or number, the same line Shift+Enter
 * on the point above writes, see {@link pointContinue}, instead of taking it out of the list: the indentation of its
 * text and the spacer. Only for an item below another point, the one before it in its list or the one it stands in;
 * anywhere else it leaves the key to the next, CodeMirror's Markdown, which takes the `-` away.
 * The first point of a sub-list, with no point before it in its list, leaves no sub-list behind: the spacer line goes
 * into the text of the point it stands in, and its own empty spacer lines go with it, so Enter, Tab and Backspace
 * below `1.` give back the text as it was, no deeper spacer line Markdown would read as code. An empty point Markdown
 * reads as text of the point above, like `\t- ` right below `1. one`, counts as such a first point.
 * The numbers of its list count in order again, see {@link listChange}.
 * - `line`: The line of the cursor.
 * - `item`: The list item it stands in, `null` outside a list.
 * - `own`: Whether Markdown reads the line as a point of its own, else as text of `item`.
 * - `parent`: The point it stands in.
 * - `first`: Whether it is the first point of a sub-list.
 * - `last`: Its last line, the line of the cursor or its last empty spacer line below it.
 * - `indentation`: The indentation of the text of the point the spacer line goes into, `null` for a point indented
 *   otherwise than by tabs, like by spaces, whose key it leaves to CodeMirror's Markdown too.
 * - `insert`: The spacer line.
 *
 * @param view - The editor
 * @returns Whether it took the key
 */
const spacerBackward: Command = (view: EditorView): boolean => {
    const line: Line = view.state.doc.lineAt(view.state.selection.main.head);
    if (!view.state.selection.main.empty || view.state.selection.main.head !== line.to
        || !/^\t*(?:[-*+]|\d+[.)]) $/.test(line.text))
        return false;
    const item: SyntaxNode | null = itemOf(view.state, line);
    const own: boolean = item !== null && view.state.doc.lineAt(item.from).number === line.number;
    const parent: SyntaxNode | null = own ? item?.parent?.parent ?? null : item;
    if (item === null || own && item.prevSibling?.name !== "ListItem" && parent?.name !== "ListItem")
        return false;

    const first: boolean = !own || item.prevSibling?.name !== "ListItem";
    let last: Line = line;
    while (own && first && last.number < view.state.doc.lineAt(item.to).number
           && emptySpacerRule.test(view.state.doc.line(last.number + 1).text))
        last = view.state.doc.line(last.number + 1);
    const indentation: string | null =
        textIndentationOf(first ? view.state.doc.lineAt(parent?.from ?? 0).text : line.text);
    if (indentation === null)
        return false;
    const insert: string = indentation + spacer;
    listChange(view, {
        changes: { from: line.from, to: last.to, insert: insert },
        selection: { anchor: line.from + insert.length },
        scrollIntoView: true,
        userEvent: "delete",
    });
    return true;
};

/**
 * Gives the points a line stands in, from the outermost to the innermost, see {@link itemOf}.
 * - `item`: A point it stands in, from the innermost outwards.
 * - `items`: The points found so far.
 *
 * @param state - Text
 * @param line - The line
 * @returns The points, `ListItem`, none outside a list
 */
function itemsOf(state: EditorState, line: Line): SyntaxNode[] {
    const items: SyntaxNode[] = [];
    for (let item: SyntaxNode | null = itemOf(state, line); item?.name === "ListItem"; item = item.parent?.parent ?? null)
        items.unshift(item);
    return items;
}

/**
 * Gives the levels a spacer line may stand at: the indentation of the text of each point it stands in,
 * from the outermost to the innermost, see {@link itemsOf}. Markdown reads a spacer line right below a point into
 * the text of the innermost point above it, whatever its indentation, see {@link itemOf}; its level follows its
 * indentation instead, as with any line of a list: it belongs to the innermost point whose text it reaches.
 * So below `\t- θ` a spacer with the indentation of the text of `- Estimator` ends the point `θ`,
 * but stays in `Estimator`.
 *
 * @param state - Text
 * @param line - The spacer line
 * @returns The indentations, none outside a list
 */
function spacerLevelsOf(state: EditorState, line: Line): string[] {
    return itemsOf(state, line).map((item: SyntaxNode): string => textIndentationOf(state.doc.lineAt(item.from).text) ?? "");
}

/**
 * Gives the level a spacer line, or any line of a list, stands at, see {@link spacerLevelsOf}: the innermost whose
 * indentation it reaches.
 *
 * @param levels - Indentations of the levels, from the outermost
 * @param text - Text of the line
 * @returns Number of the level, `-1` for none, outside the list
 */
function spacerLevelOf(levels: string[], text: string): number {
    return levels.findLastIndex((indentation: string): boolean => columnsOf(indentation) <= columnsOf(text));
}

/**
 * Finds the point a spacer line stands in by its level, see {@link spacerLevelOf}: the innermost point whose text it
 * reaches, not always the innermost point above it, into whose text Markdown reads it; Enter and a `- ` typed on it
 * start the next point after this one, see {@link furtherContinue} and {@link lineTyping}.
 * - `level`: Its level.
 *
 * @param state - Text
 * @param line - The spacer line
 * @returns The point, `ListItem`, `null` outside the list
 */
function spacerItemOf(state: EditorState, line: Line): SyntaxNode | null {
    const level: number = spacerLevelOf(spacerLevelsOf(state, line), line.text);
    return level >= 0 ? itemsOf(state, line)[level] : null;
}

/**
 * Moves an empty spacer line one level out with Backspace, see {@link spacerLevelsOf}: from the text of a point to the
 * text of the point it stands in, whose guide line then runs on through it, from the outermost point out of the list
 * as a plain empty line; so Backspace leaves a list one level at a time, as Enter does on an empty item, never at once
 * to the left edge, and from each level a `- ` typed or Enter goes on with the list of that level, see
 * {@link lineTyping}. A spacer line a sub-level deeper than the text of its point, with no sub-point there, which
 * Markdown reads as code, moves to the text of its point first. With the cursor at the start of the line, and on any
 * other line, it leaves the key to the next.
 * - `range`: The cursor.
 * - `line`: Its line.
 * - `levels`: The levels the spacer may stand at.
 * - `level`: Its level.
 * - `target`: Level it moves to, `-1` out of the list.
 * - `insert`: What the line becomes.
 *
 * @param view - The editor
 * @returns Whether it took the key
 */
const spacerOutward: Command = (view: EditorView): boolean => {
    const range: SelectionRange = view.state.selection.main;
    const line: Line = view.state.doc.lineAt(range.head);
    if (!range.empty || range.head === line.from || !emptySpacerRule.test(line.text))
        return false;
    const levels: string[] = spacerLevelsOf(view.state, line);
    const level: number = spacerLevelOf(levels, line.text);
    const target: number = level >= 0 && columnsOf(line.text) >= columnsOf(levels[level]) + 4 ? level : level - 1;
    if (target < -1)
        return false;

    const insert: string = target === -1 ? "" : levels[target] + spacer;
    view.dispatch({
        changes: { from: line.from, to: line.to, insert: insert },
        selection: { anchor: line.from + insert.length },
        scrollIntoView: true,
        userEvent: "delete.dedent",
    });
    return true;
};

/**
 * Leaves an emptied further line of a point in its place with Backspace on its last character: the line becomes
 * a spacer line with its indentation, see {@link spacer}, the cursor where its text began, instead of a line of blanks,
 * which Markdown reads as empty and the editor draws at the left edge; a further Backspace moves it one level out,
 * see {@link spacerOutward}, as in Google Docs.
 * - `range`: The cursor.
 * - `line`: Its line.
 * - `further`: Indentation of a line of one character, `null` for any other line.
 *
 * @param view - The editor
 * @returns Whether it took the key
 */
const textBackward: Command = (view: EditorView): boolean => {
    const range: SelectionRange = view.state.selection.main;
    const line: Line = view.state.doc.lineAt(range.head);
    const further: RegExpExecArray | null = /^([ \t]*)[^ \t⠀]$/u.exec(line.text);
    if (!range.empty || range.head !== line.to || further === null || itemOf(view.state, line) === null)
        return false;

    view.dispatch({
        changes: { from: line.from + further[1].length, to: line.to, insert: spacer },
        selection: { anchor: line.from + further[1].length + spacer.length },
        scrollIntoView: true,
        userEvent: "delete.backward",
    });
    return true;
};

/**
 * Tells whether Markdown would read a line of text into a deeper point than its indentation reaches: a line right
 * below a line of a point's text that starts no point itself goes on with that text, whatever its indentation,
 * so text with the indentation of the text of `x̄` right below its sub-point `:=` belongs to `:=`, and text at the left
 * edge right below a list to its last point; only a blank line before it ends that text, see {@link lineTyping}.
 * - `above`: The line above it.
 * - `levels`: Indentations of the text of the points the line above stands in, see {@link spacerLevelsOf}.
 *
 * @param state - Text
 * @param line - The line
 * @param text - What the line holds, with its indentation
 * @returns Whether its level lies outside the innermost point of the line above
 */
function lazyIs(state: EditorState, line: Line, text: string): boolean {
    if (line.number === 1)
        return false;
    const above: Line = state.doc.line(line.number - 1);
    const levels: string[] = /\S/.test(above.text) ? spacerLevelsOf(state, above) : [];
    return spacerLevelOf(levels, text) < levels.length - 1;
}

/**
 * Moves a spacer line one level in, Tab, or out, Shift+Tab, see {@link spacerLevelsOf}: out from the text of a point
 * to the text of the point it stands in, from the outermost out of the list; in to the text of the deeper point above
 * it, where there is one. On any other line it leaves the key to the next, see {@link itemIndent}.
 * - `line`: The line of the cursor.
 * - `levels`: The levels it may stand at.
 * - `target`: Level it moves to, `-1` out of the list.
 * - `indentation`: Its indentation now.
 *
 * @param inward - Whether it moves in, else out
 * @returns The command
 */
function spacerIndent(inward: boolean): Command {
    return (view: EditorView): boolean => {
        const line: Line = view.state.doc.lineAt(view.state.selection.main.head);
        if (view.state.doc.lineAt(view.state.selection.main.anchor).number !== line.number || !spacerRule.test(line.text))
            return false;
        const levels: string[] = spacerLevelsOf(view.state, line);
        if (levels.length === 0)
            return false;

        const target: number = spacerLevelOf(levels, line.text) + (inward ? 1 : -1);
        const indentation: string = /^[ \t]*/.exec(line.text)?.[0] ?? "";
        if (target >= -1 && target < levels.length)
            view.dispatch({
                changes: { from: line.from, to: line.from + indentation.length, insert: target === -1 ? "" : levels[target] },
                userEvent: inward ? "input.indent" : "delete.dedent",
            });
        return true;
    };
}

/**
 * Starts the next point with Enter on a further line of a point, the lines written below its text, see
 * {@link pointContinue}, as Enter does on the line of its `-`, as Obsidian does: the new line takes the point's tabs
 * and its `-`, or its number counted on, like `2.` after `1.`, and what stood right of the cursor; an empty further
 * line becomes the new point itself, so no empty line stays behind. On a spacer line the point is that of its level,
 * see {@link spacerItemOf}, so Enter goes on with the list of the level Backspace moved it to, see
 * {@link spacerOutward}; the points after it count on, see {@link listChange}. Anywhere else it leaves the key to the
 * next, CodeMirror's Markdown, which continues a list from the line of a `-`.
 * - `range`: The cursor.
 * - `line`: Its line.
 * - `item`: The list item it stands in, `null` outside a list.
 * - `first`: The first line of the item, with its `-` or number.
 * - `blank`: Whether the line of the cursor holds nothing but the room of a further line, maybe with a spacer;
 *   the item is then that of the line above, for a spacer line that of its level.
 * - `point`: Its tabs, then its `-`, or its number and the `.` or `)` after it; `null` for no point.
 * - `insert`: What the line of the new point begins with.
 *
 * @param view - The editor
 * @returns Whether it took the key
 */
const furtherContinue: Command = (view: EditorView): boolean => {
    const range: SelectionRange = view.state.selection.main;
    const line: Line = view.state.doc.lineAt(range.head);
    const blank: boolean = line.length > 0 && /^\s*⠀?$/.test(line.text);
    const item: SyntaxNode | null = !range.empty ? null
        : spacerRule.test(line.text) ? spacerItemOf(view.state, line)
            : blank && line.number > 1 ? itemOf(view.state, view.state.doc.line(line.number - 1)) : itemAt(view.state);
    if (item === null || view.state.doc.lineAt(item.from).number === line.number)
        return false;

    const first: Line = view.state.doc.lineAt(item.from);
    const point: RegExpExecArray | null = /^([ \t]*)(?:([-*+])|(\d+)([.)]))[ \t]/.exec(first.text);
    if (point === null)
        return false;
    const insert: string = `${point[1]}${point[2] ?? `${Number(point[3]) + 1}${point[4]}`} `;
    listChange(view, {
        changes: blank ? { from: line.from, to: line.to, insert: insert }
            : { from: range.head, insert: view.state.lineBreak + insert },
        selection: { anchor: blank ? line.from + insert.length : range.head + view.state.lineBreak.length + insert.length },
        scrollIntoView: true,
        userEvent: "input",
    });
    return true;
};

/**
 * Continues a list on Enter by CodeMirror's Markdown, on an empty point one level out, with the numbers counted
 * in order again, see {@link listChange}, so the `3.` of a sub-list below an emptied `2.` becomes `1.`.
 *
 * @param view - The editor
 * @returns Whether it took the key
 */
const markupContinue: Command = (view: EditorView): boolean =>
    insertNewlineContinueMarkupCommand({ nonTightLists: false })({
        state: view.state,
        dispatch: (transaction: Transaction): void => listChange(view, {
            changes: transaction.changes,
            selection: transaction.selection,
            scrollIntoView: true,
            userEvent: transaction.annotation(Transaction.userEvent),
        }),
    });

/**
 * Finds the list item a line stands in: the innermost item around the start of its text, so a further line of a point
 * or a sub-point is found too.
 * - `node`: A piece of syntax around the start of the text, from the innermost outwards.
 *
 * @param state - Text
 * @param line - The line
 * @returns The item, `ListItem`, `null` outside a list
 */
function itemOf(state: EditorState, line: Line): SyntaxNode | null {
    for (let node: SyntaxNode | null = syntaxTree(state).resolveInner(line.from + (/^[ \t]*/.exec(line.text)?.[0].length ?? 0), 1);
         node !== null; node = node.parent)
        if (node.name === "ListItem")
            return node;
    return null;
}

/**
 * Finds the list item the cursor stands in, or the lines picked, when they lie on its lines, see {@link itemOf}.
 * - `item`: The item of the first line of what is picked.
 *
 * @param state - Text and cursor
 * @returns The item, `ListItem`, `null` outside a list or when the lines picked reach beyond it
 */
function itemAt(state: EditorState): SyntaxNode | null {
    const item: SyntaxNode | null = itemOf(state, state.doc.lineAt(state.selection.main.from));
    return item !== null && state.selection.main.to <= state.doc.lineAt(item.to).to ? item : null;
}

/**
 * Runs one of CodeMirror's commands on the lines of a list item, from the line of its `-` to its last sub-point or
 * further line, as if they were picked, and keeps my cursor where it was in the text; the numbers of the lists it
 * touched count in order again, see {@link listChange}.
 *
 * @param view - The editor
 * @param item - The list item
 * @param command - CodeMirror's command, like `indentMore`
 */
function itemLinesRun(view: EditorView, item: SyntaxNode, command: StateCommand): void {
    const lines: SelectionRange = EditorSelection.range(view.state.doc.lineAt(item.from).from, view.state.doc.lineAt(item.to).to);
    command({
        state: view.state.update({ selection: lines }).state,
        dispatch: (transaction: Transaction): void => listChange(view, {
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
 * and moves the cursor or what is picked along with the block it stands in; numbered points count in order again,
 * so `2.` moved above `1.` becomes `1.`, see {@link listChange}.
 * - `upper`, `lower`: The text of the two blocks.
 * - `shift`: How far the cursor moves with its block.
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
    listChange(view, {
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
 * Moves the cursor a line down, Arrow Down, or picks up to there, Shift+Arrow Down, by CodeMirror's own command,
 * but past a folded heading or point in one step: CodeMirror's step ends first at the end of what is folded,
 * which stands on the same line, so a first Arrow Down seemed to do nothing.
 * - `line`: The line the cursor stood on.
 * - `folded`: Whether the step ended at the end of what that line folds.
 *
 * @param command - CodeMirror's command, `cursorLineDown` or `selectLineDown`
 * @returns The command
 */
function lineDown(command: Command): Command {
    return (view: EditorView): boolean => {
        const line: Line = view.state.doc.lineAt(view.state.selection.main.head);
        if (!command(view))
            return false;
        let folded: boolean = false;
        foldedRanges(view.state).between(line.to, line.to, (from: number, to: number): void => {
            folded ||= from === line.to && to === view.state.selection.main.head;
        });
        if (folded)
            command(view);
        return true;
    };
}

/**
 * Spacer line with a `-`, `*` or `+` waiting after the spacer, typed on an empty spacer line, see {@link lineTyping}:
 * its indentation and the mark.
 */
const waitingRule: RegExp = /^([ \t]*)⠀([-*+])$/;

/**
 * Gives the start of a new point that a `-`, `*` or `+` waiting on a spacer line of a point begins, see
 * {@link lineTyping}: by a space the next point of that point's level, with the indentation of its `-`, below
 * a numbered point a sub-point of it, since a `- ` beside `1.` would end the numbered list; by Tab always a sub-point,
 * see {@link waitingIndent}. Sub-points take one tab more, as my notes indent them.
 * - `indentation`: Indentation of the point's `-` or number.
 * - `sub`: Whether the new point is a sub-point.
 *
 * @param state - Text
 * @param item - The point of the spacer line's level, see {@link spacerItemOf}
 * @param mark - The mark typed, like `-`
 * @param inward - Whether Tab was pressed, which always makes a sub-point
 * @returns The start of the line, like `\t- `
 */
function pointStartOf(state: EditorState, item: SyntaxNode, mark: string, inward: boolean): string {
    const indentation: string = /^[ \t]*/.exec(state.doc.lineAt(item.from).text)?.[0] ?? "";
    const sub: boolean = inward || item.parent?.name === "OrderedList";
    return indentation + (sub ? "\t" : "") + mark + " ";
}

/**
 * Makes the `-`, `*` or `+` waiting on a spacer line a sub-point with Tab, see {@link pointStartOf}: below
 * `1. Compute sample mean` a `-` and Tab give `\t- ` under it, the cursor after it, ready to type, as Tab moves a new
 * point in; on any other line it leaves the key to the next.
 * - `line`: The line of the cursor.
 * - `waiting`: Indentation and mark of the line, `null` for a line without a waiting mark.
 * - `item`: The point of the spacer line's level, `null` outside a list.
 * - `insert`: What the line becomes.
 *
 * @param view - The editor
 * @returns Whether it took the key
 */
const waitingIndent: Command = (view: EditorView): boolean => {
    const line: Line = view.state.doc.lineAt(view.state.selection.main.head);
    const waiting: RegExpExecArray | null = waitingRule.exec(line.text);
    const item: SyntaxNode | null = waiting !== null && view.state.selection.main.empty
        ? spacerItemOf(view.state, line) : null;
    if (waiting === null || item === null)
        return false;

    const insert: string = pointStartOf(view.state, item, waiting[2], true);
    view.dispatch({
        changes: { from: line.from, to: line.to, insert: insert },
        selection: { anchor: line.from + insert.length },
        scrollIntoView: true,
        userEvent: "input.indent",
    });
    return true;
};

/**
 * Writes the first text typed on an empty line of a list where its level says, as Google Docs keeps a line in its place:
 * - On an empty spacer line, see {@link spacer}, the text takes the place of the spacer: the line stays in the point
 *   of its level as a further line, its text under the point's text, since the spacer is needed only while the line
 *   is empty.
 * - A `-`, `*` or `+` typed first waits after the spacer, the line still a spacer line of its level: a space after it
 *   starts the next point of that level, see {@link spacerItemOf}, as Enter does, with the indentation of that point's
 *   `-`, so the `- ` stands where Backspace took it away, see {@link spacerOutward}, and Obsidian reads it as the next
 *   point of that level, not as a sub-point; below a numbered point, like `1. Compute sample mean`, a sub-point of it,
 *   `\t- `, since a `- ` beside `1.` would end its numbered list; Tab after it makes a sub-point too, see
 *   {@link waitingIndent}; any other text after it takes the place of the spacer too.
 * - On an empty line right below a list, where Enter or Backspace ended it, the same, as on a spacer line outside it.
 * - Where Markdown would read the text into a deeper point than its level, see {@link lazyIs}, like text with the
 *   indentation of the text of `x̄` right below its sub-point `:=`, or text at the left edge right below a list,
 *   a blank line goes before it, which ends the deeper point, so the text belongs to `x̄`, or stands after the list,
 *   in Obsidian too; the editor draws that blank line as every empty line, one line high, see `spaceLook`
 *   in `./preview.ts`.
 * - `line`: The line typed on.
 * - `waiting`: Indentation and `-`, `*` or `+` of a line where one waits after the spacer, `null` for none,
 *   see {@link waitingRule}.
 * - `empty`: Indentation of the line while it is an empty spacer line or an empty line below a list, `null` else.
 * - `item`: The point of the spacer's level, `null` for none.
 * - `insert`: What the line becomes.
 * - `textual`: Whether it becomes a line of text, not a point and not a spacer line with a waiting `-`.
 * - `blank`: The line break of the blank line before it, empty for none.
 *
 * @returns Handler of typed text
 */
const lineTyping: Extension = EditorView.inputHandler.of((view: EditorView, from: number, to: number,
                                                          text: string): boolean => {
    const line: Line = view.state.doc.lineAt(from);
    if (from !== to || from !== line.to || /[\r\n]/.test(text))
        return false;

    const waiting: RegExpExecArray | null = waitingRule.exec(line.text);
    const empty: string | null = emptySpacerRule.test(line.text) ? line.text.slice(0, -spacer.length)
        : line.length === 0 && lazyIs(view.state, line, "") ? "" : null;
    let insert: string;
    let textual: boolean = true;
    if (waiting !== null && text === " ") {
        const item: SyntaxNode | null = spacerItemOf(view.state, line);
        insert = item === null ? waiting[1] + waiting[2] + " " : pointStartOf(view.state, item, waiting[2], false);
        textual = false;
    } else if (waiting !== null) {
        insert = waiting[1] + waiting[2] + text;
    } else if (empty !== null && /^[-*+]$/.test(text)) {
        insert = empty + spacer + text;
        textual = false;
    } else if (empty !== null) {
        insert = empty + text;
    } else {
        return false;
    }
    const blank: string = textual && lazyIs(view.state, line, insert) ? view.state.lineBreak : "";
    view.dispatch({ changes: { from: line.from, to: line.to, insert: blank + insert },
        selection: { anchor: line.from + blank.length + insert.length }, scrollIntoView: true, userEvent: "input.type" });
    return true;
});

/**
 * Keys of a Markdown file, see the top of this file; Enter, Tab and Shift+Tab, Alt+Up and Alt+Down try the list item
 * first, Backspace, Tab and Shift+Tab a spacer line before it, Tab a waiting `-` before that, then the key goes on
 * to the next command,
 * CodeMirror's own; and the first text typed on an empty line of a list where its level says, see {@link lineTyping}.
 */
export const markdownKeys: Extension = [lineTyping, Prec.high(keymap.of([
    { key: "Enter", run: furtherContinue },
    { key: "Enter", run: markupContinue },
    { key: "Shift-Enter", run: pointContinue },
    { key: "Backspace", run: spacerBackward },
    { key: "Backspace", run: spacerOutward },
    { key: "Backspace", run: textBackward },
    { key: "Backspace", run: deleteMarkupBackward },
    { key: "Tab", run: waitingIndent },
    { key: "Tab", run: spacerIndent(true), shift: spacerIndent(false) },
    { key: "Tab", run: itemIndent(true), shift: itemIndent(false) },
    { key: "Tab", run: insertTab, shift: indentLess },
    { key: "Alt-ArrowUp", run: itemMove(false) },
    { key: "Alt-ArrowDown", run: itemMove(true) },
    { key: "Mod-Shift-ArrowUp", run: moveLineUp },
    { key: "Mod-Shift-ArrowDown", run: moveLineDown },
    { key: "Mod-b", run: markupToggle("**") },
    { key: "Mod-i", run: markupToggle("*") },
    { key: "Mod-d", run: deleteLine },
    { key: "ArrowDown", run: lineDown(cursorLineDown), shift: lineDown(selectLineDown) },
]))];
