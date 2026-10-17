/**
 * ## Keys
 *
 * The keys of a Markdown file in the editor, as in Obsidian, see `./editor.ts`; they go before CodeMirror's usual keys:
 * - Enter continues a list, a task list or a quote on the next line, and on an empty item moves it one level out,
 *   at the outermost level ends the list; on a further line of a point it starts the next point too, on a spacer line
 *   the next point of its level, see {@link furtherContinue};
 *   Shift+Enter goes on in the same point on the next line, a spacer line without a new bullet,
 *   see {@link pointContinue}, which on a phone or tablet, whose keyboard has no Shift+Enter, a button does,
 *   see `./editor.ts`; Backspace right after the `-` of a new, empty item makes it the same spacer line,
 *   see {@link spacerBackward}, else right after the `-` of an item or the `>` of a quote takes it away;
 *   Backspace on an empty spacer line moves it one level out, at the outermost level makes it a plain empty line,
 *   see {@link spacerOutward}; so a list is left one level at a time, with a new bullet by Enter or without one by
 *   Backspace. The first text typed on an empty spacer line takes the place of the spacer, but `- ` typed there
 *   starts the next point of its level, see {@link spacerTyping}.
 * - Tab moves a list item one step in, Shift+Tab one step out, always with its sub-points and further lines,
 *   see {@link itemIndent}, and a spacer line one level, see {@link spacerIndent}; outside a list Tab writes a tab
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
import { foldedRanges, syntaxTree } from "@codemirror/language";
import { deleteMarkupBackward, insertNewlineContinueMarkupCommand } from "@codemirror/lang-markdown";

import type { ChangeSpec, EditorState, Extension, Line, SelectionRange, StateCommand } from "@codemirror/state";
import type { Command } from "@codemirror/view";
import type { SyntaxNode } from "@lezer/common";


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
export const pointContinue: Command = (view: EditorView): boolean => {
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
 * - `line`: The line of the cursor.
 * - `item`: The list item it stands in, `null` outside a list.
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
    if (item?.prevSibling?.name !== "ListItem" && item?.parent?.parent?.name !== "ListItem")
        return false;

    const insert: string = textIndentationOf(line.text) + spacer;
    view.dispatch({
        changes: { from: line.from, to: line.to, insert: insert },
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
 * Gives the level a spacer line stands at, see {@link spacerLevelsOf}: the innermost whose indentation it reaches.
 *
 * @param levels - Indentations of the levels, from the outermost
 * @param line - The spacer line
 * @returns Number of the level, `-1` for none, outside the list
 */
function spacerLevelOf(levels: string[], line: Line): number {
    return levels.findLastIndex((indentation: string): boolean => columnsOf(indentation) <= columnsOf(line.text));
}

/**
 * Finds the point a spacer line stands in by its level, see {@link spacerLevelOf}: the innermost point whose text it
 * reaches, not always the innermost point above it, into whose text Markdown reads it; Enter and a `- ` typed on it
 * start the next point after this one, see {@link furtherContinue} and {@link spacerTyping}.
 * - `level`: Its level.
 *
 * @param state - Text
 * @param line - The spacer line
 * @returns The point, `ListItem`, `null` outside the list
 */
function spacerItemOf(state: EditorState, line: Line): SyntaxNode | null {
    const level: number = spacerLevelOf(spacerLevelsOf(state, line), line);
    return level >= 0 ? itemsOf(state, line)[level] : null;
}

/**
 * Moves an empty spacer line one level out with Backspace, see {@link spacerLevelsOf}: from the text of a point to the
 * text of the point it stands in, whose guide line then runs on through it, from the outermost point out of the list
 * as a plain empty line; so Backspace leaves a list one level at a time, as Enter does on an empty item, never at once
 * to the left edge, and from each level a `- ` typed or Enter goes on with the list of that level, see
 * {@link spacerTyping}. With the cursor at the start of the line, and on any other line, it leaves the key to the next.
 * - `range`: The cursor.
 * - `line`: Its line.
 * - `levels`: The levels the spacer may stand at.
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
    const target: number = spacerLevelOf(levels, line) - 1;
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

        const target: number = spacerLevelOf(levels, line) + (inward ? 1 : -1);
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
 * {@link spacerOutward}. Anywhere else it leaves the key to the next, CodeMirror's Markdown, which continues a list
 * from the line of a `-`.
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
    view.dispatch({
        changes: blank ? { from: line.from, to: line.to, insert: insert }
            : { from: range.head, insert: view.state.lineBreak + insert },
        selection: { anchor: blank ? line.from + insert.length : range.head + view.state.lineBreak.length + insert.length },
        scrollIntoView: true,
        userEvent: "input",
    });
    return true;
};

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
 * Lets the first text typed on an empty spacer line take the place of the spacer, see {@link spacer}: the line stays
 * in its point as a further line, its text under the point's text, not one blank further right, since the spacer is
 * needed only while the line is empty.
 * A `-`, `*` or `+` typed first waits after the spacer, the line still a spacer line of its level: a space after it
 * starts the next point of that level, see {@link spacerItemOf}, as Enter does, with the indentation of that point's
 * `-`, so the `- ` stands where Backspace took it away, see {@link spacerOutward}, and Obsidian reads it as the next
 * point of that level, not as a sub-point; any other text after it takes the place of the spacer too.
 * - `line`: The line typed on.
 * - `waiting`: Indentation and `-`, `*` or `+` of a line where one waits after the spacer, `null` for none.
 * - `item`: The point of the spacer's level, `null` for no space typed or no point.
 * - `insert`: What the line becomes.
 *
 * @returns Handler of typed text
 */
const spacerTyping: Extension = EditorView.inputHandler.of((view: EditorView, from: number, to: number,
                                                            text: string): boolean => {
    const line: Line = view.state.doc.lineAt(from);
    if (from !== to || from !== line.to || /[\r\n]/.test(text))
        return false;

    const waiting: RegExpExecArray | null = /^([ \t]*)⠀([-*+])$/.exec(line.text);
    let insert: string;
    if (waiting !== null) {
        const item: SyntaxNode | null = text === " " ? spacerItemOf(view.state, line) : null;
        insert = item !== null ? (/^[ \t]*/.exec(view.state.doc.lineAt(item.from).text)?.[0] ?? "") + waiting[2] + " "
            : waiting[1] + waiting[2] + text;
    } else if (emptySpacerRule.test(line.text)) {
        insert = line.text.slice(0, -spacer.length) + (/^[-*+]$/.test(text) ? spacer : "") + text;
    } else {
        return false;
    }
    view.dispatch({ changes: { from: line.from, to: line.to, insert: insert },
        selection: { anchor: line.from + insert.length }, userEvent: "input.type" });
    return true;
});

/**
 * Keys of a Markdown file, see the top of this file; Enter, Tab and Shift+Tab, Alt+Up and Alt+Down try the list item
 * first, Backspace, Tab and Shift+Tab a spacer line before it, then the key goes on to the next command,
 * CodeMirror's own; and the first text typed on an empty spacer line in place of the spacer, see {@link spacerTyping}.
 */
export const markdownKeys: Extension = [spacerTyping, Prec.high(keymap.of([
    { key: "Enter", run: furtherContinue },
    { key: "Enter", run: insertNewlineContinueMarkupCommand({ nonTightLists: false }) },
    { key: "Shift-Enter", run: pointContinue },
    { key: "Backspace", run: spacerBackward },
    { key: "Backspace", run: spacerOutward },
    { key: "Backspace", run: deleteMarkupBackward },
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
