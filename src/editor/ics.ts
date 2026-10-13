/**
 * ## Calendar files
 *
 * Shows an `.ics` file in the editor easy to read, the file itself staying exactly as it is: every line left-aligned
 * at the depth of its block, each line inside a `BEGIN:` and its `END:` one step further in, like the lines
 * of a `VEVENT` inside `VCALENDAR`, and an empty line's room above each entry of the calendar, a `BEGIN:` right
 * inside `VCALENDAR`, so the entries stand apart. A folded line, starting with a space, stays in the block of the line
 * it continues. Only the look changes: the steps and the room are drawn by the stylesheet, see `.ics-depth-1`
 * and `.ics-entry` in `editor.css`, no character is added.
 *
 * - `@codemirror/state`: The text and its lines.
 * - `@codemirror/view`: Decorations of whole lines, and how they reach the editor.
 */

import { StateField } from "@codemirror/state";
import { Decoration, EditorView } from "@codemirror/view";

import type { EditorState, Extension, Line, Range, Transaction } from "@codemirror/state";
import type { DecorationSet } from "@codemirror/view";


/**
 * Most steps a line of a calendar file is drawn further in; a deeper line, rare, like inside a `VALARM` of a `VEVENT`
 * of a series, stays at it.
 */
const deepest: number = 4;


/**
 * Gives the decorations of the lines of a calendar file, see the top of this file: the step of each line,
 * as a class like `ics-depth-1`, and for each entry, a `BEGIN:` right inside `VCALENDAR`, the room above it.
 * - `decorations`: Decorations found so far, in the order of the lines.
 * - `depth`: Depth of the block the next line lies in, 0 outside every block.
 * - `number`: Number of a line, from 1.
 * - `line`, `text`: A line and its text.
 * - `step`: Step the line is drawn at: an `END:` at the depth of its `BEGIN:`, a further line one inside.
 * - `entry`: Whether the line begins an entry of the calendar.
 *
 * @param state - State of the editor, with the text of the file
 * @returns Decorations of the lines
 */
function decorationsOf(state: EditorState): DecorationSet {
    const decorations: Range<Decoration>[] = [];
    let depth: number = 0;
    for (let number: number = 1; number <= state.doc.lines; number++) {
        const line: Line = state.doc.line(number);
        const text: string = line.text;
        if (/^END:/i.test(text))
            depth = Math.max(0, depth - 1);
        const step: number = Math.min(depth, deepest);
        const entry: boolean = depth === 1 && /^BEGIN:/i.test(text);
        decorations.push(Decoration.line({ class: `ics-depth-${step}${entry ? " ics-entry" : ""}` }).range(line.from));
        if (/^BEGIN:/i.test(text))
            depth += 1;
    }
    return Decoration.set(decorations);
}

/**
 * The look of a calendar file for the editor, see the top of this file: its lines decorated once as it opens,
 * and again whenever its text changes.
 *
 * @returns Extension of the editor
 */
export function icsLook(): Extension {
    return StateField.define<DecorationSet>({
        create: decorationsOf,
        update: (decorations: DecorationSet, transaction: Transaction): DecorationSet =>
            transaction.docChanged ? decorationsOf(transaction.state) : decorations,
        provide: (field: StateField<DecorationSet>): Extension => EditorView.decorations.from(field),
    });
}
