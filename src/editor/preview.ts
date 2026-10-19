/**
 * ## Live preview
 *
 * Shows a note in the editor as Obsidian's live preview does: the text of the file as it is, its Markdown drawn
 * as in the scripts view with the markup hidden, and the markup shown where the cursor is, to edit it.
 * Only the look changes, never the text: every hidden or rendered piece stays in the text as written.
 * Away from the cursor a note looks as in the scripts view, drawn by the rules of the scripts view
 * in `../notes/notes.css`:
 * - Headings, lists and quotes stand in the elements the scripts view draws them in, `h1` to `h6`, `ul`, `ol`, `li`
 *   and `blockquote`, so they get its sizes, its bullets and numbers, its indentation per level with an item's
 *   wrapped and further lines under its text, its guide lines and the line of quotes.
 *   Their `##`, `>`, indentation, `-` and `1.` are hidden; on the line of the cursor the `##` and `>` show left of the text,
 *   and the `-` or number of an item shows in place of its bullet or number, so the text never moves.
 * - Every empty line one line high, as I wrote it, so the space between two blocks shows how many empty lines stand
 *   between them, like the one below the `Generated:` quote, see {@link spaceLook}.
 * - The type word of a block of a section at the start of a heading `##`, like `Definition. `, a small grey box before
 *   the name, as in the tree, hanging left of the page where the file has room, see `./editor.css`, as written on
 *   the line of the cursor, see {@link headingLook}; a click on the box does nothing, see {@link kindClicked}.
 * - Bold, italic, struck and code without `**`, `*`, `~~` and `` ` ``, Markdown links and wiki links
 *   `[[Note#Heading|Text]]` as their text; the markup of the piece the cursor touches shows.
 * - Line breaks `<br>` and break opportunities `<wbr>` drawn as in the scripts view, so `<br><wbr>` at the end of a line
 *   leaves an empty line below it; as their text while the cursor touches them.
 * - Task boxes `[ ]` and `[x]` as the boxes of the scripts view, which a click ticks, as written on the line of the cursor.
 * - Formulas `$…$` and `$$…$$` rendered as in the scripts view, never broken inside, with the punctuation right after
 *   one on its line, see {@link mathLook}; as their TeX while the cursor touches them;
 *   a formula `$$…$$` being edited shows rendered below its TeX, as in Obsidian.
 * - Images `![[Image.svg|300]]` shown; tables, callouts `> [!note] Title`, code blocks and HTML blocks like `<table>`
 *   rendered as in the scripts view, those right below each other as one, as their text while the cursor is on one
 *   of their lines, as Obsidian shows a callout.
 * - Spacers `⠀` (U+2800) and invisible characters like the soft hyphen blank, as in the scripts view; the spacer
 *   of a spacer line without room, so the cursor on it stands where its text will begin, see {@link paragraphLook}.
 * - The cursor never stands in what is hidden, so every key moves it where I see it, see {@link caretPlaceOf}.
 * - Each heading folds its section, up to the next heading of its level or higher, by a click on its arrow after its
 *   text, as in the scripts view, and each list item with sub-points folds them and its further lines by its arrow
 *   left of its bullet, shown under the pointer, as in Obsidian; one click folds, one click unfolds,
 *   see {@link FoldWidget}; a solution, the section under `#### Solution`, comes folded, see {@link solutionsFold},
 *   so I try a task before I see its solution, but that of a worked Example, which I study whole; folded headings
 *   of a level stand close below each other as a list, see {@link spaceLook}.
 * A click on a rendered piece puts the cursor there, so it shows as text; while the editor is not focused,
 * like before the first click, the whole note shows rendered.
 * A click on a rendered link follows it, as in Obsidian, and so does a click with Ctrl held on a link shown as text,
 * see {@link linkFollow}: a note opens in the scripts view at its heading, a heading of the same note scrolls into
 * sight, in a section its block shows alone, as a click in the tree shows it, any other file, like a PDF at its page,
 * opens in this window, in Chrome's own viewer, and an address of the web in a new tab.
 * Links resolve as the reader found them when the note was read or saved last, see {@link linksSet}: a link that leads
 * nowhere fades and leads nowhere, a link or image written since works once the note is saved.
 *
 * - `@codemirror/state`, `@codemirror/view`: Hold the text and the cursor, draw the text with decorations and widgets,
 *   and put lines into elements with block wrappers.
 * - `@codemirror/language`: Gives the syntax tree of the note, read with `./syntax.ts`, and folds its sections,
 *   as CodeMirror's Markdown finds them: a heading's up to the next heading of its level or higher,
 *   a list item's from the end of its first line.
 * - `@lezer/highlight`: Gives pieces of the syntax the classes of their look, see `./editor.css`.
 * - `../notes/math.ts`: Renders formulas as the scripts view does.
 * - `../notes/markdown.ts`: Renders tables, callouts, code blocks and HTML blocks as the scripts view does, and tells
 *   the punctuation that stays on the line of a formula.
 * - `../notes/tree.ts`: Builds the address of a note in the scripts view, for a link to follow, and tells the type word
 *   of a block at the start of its heading.
 * - `./keys.ts`: Tells a spacer line and the indentation of the text of a list item, for where the item ends.
 * - `./round.ts`: Shows a block of a section alone, for a link to its heading.
 * - `./steps.ts`: Tells a worked Example, whose solution comes unfolded, and whether a section is folded.
 */

import { EditorState, RangeSet, StateEffect, StateField } from "@codemirror/state";
import { BlockWrapper, Decoration, EditorView, WidgetType, keymap } from "@codemirror/view";
import {
    codeFolding, foldable, foldedRanges, foldEffect, foldKeymap, forceParsing, syntaxHighlighting, syntaxTree, unfoldEffect,
} from "@codemirror/language";
import { tagHighlighter, tags } from "@lezer/highlight";
import { mathRender } from "../notes/math.ts";
import { htmlOf, punctuationRule } from "../notes/markdown.ts";
import { kindRule, noteAddressOf } from "../notes/tree.ts";
import { columnsOf, spacerRule, textIndentationOf } from "./keys.ts";
import { roundHeadingShow } from "./round.ts";
import { foldedAt, workedIs } from "./steps.ts";

import type { Extension, Line, Range, SelectionRange, StateEffectType, Transaction, TransactionSpec } from "@codemirror/state";
import type { DecorationSet } from "@codemirror/view";
import type { Highlighter } from "@lezer/highlight";
import type { SyntaxNode, SyntaxNodeRef } from "@lezer/common";


/**
 * For each link of a note as written, like `01_05_IncomeResiduals.svg` of `![[01_05_IncomeResiduals.svg|420]]`:
 * path of the file it leads to, `null` when it leads nowhere, as the reader sends it.
 */
export type Links = {
    [link: string]: string | null;
};

/**
 * What the look of a note is built from, see {@link decorationsOf}.
 *
 * - `state`: Text, cursor and syntax tree of the note.
 * - `links`: Files the links of the note lead to.
 * - `focused`: Whether the editor has the focus, so I am editing.
 * - `decorations`: Decorations found so far.
 * - `wrappers`: Elements found so far that lines stand in, like the `li` of a list item.
 * - `rendered`: Starts of the blocks rendered whole so far, like a table, see {@link blockLook}.
 * - `roomless`: Starts of the empty lines found so far that are drawn without height while the cursor is not on them.
 */
type Look = {
    state: EditorState;
    links: Links;
    focused: boolean;
    decorations: Range<Decoration>[];
    wrappers: Range<BlockWrapper>[];
    rendered: number[];
    roomless: number[];
};

/**
 * Look of a note: its decorations and the elements its lines stand in.
 *
 * - `decorations`: Hidden markup, rendered pieces and classes of lines and text.
 * - `wrappers`: Elements around lines, like `ul` and `li`.
 * - `roomless`: Starts of the empty lines drawn without height while the cursor is not on them, which the cursor
 *   passes over, see {@link caretPlaceOf}.
 */
type Drawing = {
    decorations: DecorationSet;
    wrappers: RangeSet<BlockWrapper>;
    roomless: number[];
};

/**
 * Endings of images shown when embedded, as in the scripts view.
 */
const imageEndings: string[] = ["png", "jpg", "jpeg", "gif", "bmp", "svg", "webp", "avif"];

/**
 * Pieces of syntax drawn in an element of their own, see {@link wrap}, nesting in each other.
 */
const wrapped: string[] = ["BulletList", "OrderedList", "ListItem", "Blockquote"];

/**
 * Blocks rendered whole while the cursor is on none of their lines, see {@link blockLook}.
 */
const renderedWhole: string[] = ["Table", "FencedCode", "HTMLBlock"];

/**
 * First line of a callout from its `>`, like `> [!note] Title`, as the scripts view reads it, see `../notes/markdown.ts`.
 */
const calloutRule: RegExp = /^>[ \t]?\[![^\]]+\]/;

/**
 * Line break `<br>` or break opportunity `<wbr>` within a line, written like `<br>`, `<br/>` or `<br />`.
 */
const breakRule: RegExp = /^<(br|wbr)\s*\/?>$/i;

/**
 * Address with a scheme, like `https://…`: a link out of my modules, opened as it is, as in the scripts view.
 */
const externalRule: RegExp = /^[a-z][a-z\d+.-]*:/i;

/**
 * Heading of a note, `##` and its text, with the text as written.
 */
const headingRule: RegExp = /^#{1,6}[ \t]+(.*?)[ \t]*$/;

/**
 * Heading of a solution, like `#### Solution` or `#### Solution (own, unchecked)`, as the scripts view folds it.
 */
const solutionRule: RegExp = /^####[ \t]+Solution\b/;

/**
 * Spacers `⠀` and invisible format characters, like the soft hyphen and the zero-width space.
 */
const invisibleRule: RegExp = /[\u2800\p{Cf}]/gu;

/**
 * Markup hidden.
 */
const hidden: Decoration = Decoration.replace({});

/**
 * Bullet `-` of the list item the cursor is on, as written, in place of the bullet, see `./editor.css`.
 */
const bulletMark: Decoration = Decoration.mark({ class: "cm-list-mark cm-list-bullet" });

/**
 * Number like `1.` of the list item the cursor is on, as written, in place of the number, see `./editor.css`.
 */
const numberMark: Decoration = Decoration.mark({ class: "cm-list-mark cm-list-number" });

/**
 * Markup `##` of a heading or `>` of a quote on the line of the cursor, left of the text, see `./editor.css`.
 */
const hanging: Decoration = Decoration.mark({ class: "cm-hanging" });

/**
 * Type word of a block at the start of its heading, like `Definition`, as a small grey box, see `../notes/notes.css`.
 */
const kindBox: Decoration = Decoration.mark({ class: "block-kind" });

/**
 * Spacer or other invisible character on the line of the cursor, drawn as a faint dot.
 */
const spacerMark: Decoration = Decoration.mark({ class: "cm-spacer" });

/**
 * Text of a rendered link, which a click follows, see {@link linkClicked}.
 */
const followable: Decoration = Decoration.mark({ class: "cm-follow" });

/**
 * Text of a rendered link out of my modules, like `https://…`, which a click opens in a new tab, with Obsidian's arrow
 * out of a box after it, as in the scripts view, see `../notes/notes.css`.
 */
const external: Decoration = Decoration.mark({ class: "cm-follow cm-external" });

/**
 * Blank line without height, see {@link spaceLook}.
 */
const noHeight: Decoration = Decoration.line({ attributes: { style: "height: 0" } });

/**
 * Formula with the punctuation right after it, kept on one line, see {@link mathLook} and `../notes/notes.css`;
 * inclusive at its start, so it opens before the drawn formula and holds it, not only the punctuation.
 */
const unbroken: Decoration = Decoration.mark({ class: "math-unbroken", inclusiveStart: true });

/**
 * Heading right below the folded section of a heading of its level, see {@link belowFoldIs}.
 */
const belowFold: Decoration = Decoration.line({ class: "cm-below-fold" });

/**
 * Line of a code block being edited.
 */
const codeLine: Decoration = Decoration.line({ class: "cm-code-block" });

/**
 * Effect of the editor getting the focus, `true`, or losing it, `false`.
 */
const focusChange: StateEffectType<boolean> = StateEffect.define<boolean>();

/**
 * Whether the editor has the focus, from the last {@link focusChange}; not at first.
 */
const focused: StateField<boolean> = StateField.define<boolean>({
    create: (): boolean => false,
    update: (value: boolean, transaction: Transaction): boolean => {
        for (const effect of transaction.effects)
            if (effect.is(focusChange))
                return effect.value;
        return value;
    },
});

/**
 * Effect of the reader having found the files the links of the note lead to anew, see {@link linksSet}.
 */
const linksFound: StateEffectType<Links> = StateEffect.define<Links>();

/**
 * Files the links of the note lead to, as the reader found them when the note was read or saved last;
 * none at first, see {@link livePreview}.
 */
const linkTargets: StateField<Links> = StateField.define<Links>({
    create: (): Links => ({}),
    update: (links: Links, transaction: Transaction): Links => {
        for (const effect of transaction.effects)
            if (effect.is(linksFound))
                return effect.value;
        return links;
    },
});

/**
 * Classes of the pieces of syntax, for their look in `./editor.css`; markup like `##`, `**` and `1.` is `cm-mark`.
 */
const highlighter: Highlighter = tagHighlighter([
    { tag: tags.strong, class: "cm-strong" },
    { tag: tags.emphasis, class: "cm-emphasis" },
    { tag: tags.strikethrough, class: "cm-strikethrough" },
    { tag: tags.monospace, class: "cm-monospace" },
    { tag: tags.link, class: "cm-link" },
    { tag: tags.url, class: "cm-url" },
    { tag: tags.processingInstruction, class: "cm-mark" },
]);


/**
 * Fold arrow of a heading or a list item, see the top of this file: down while open, turned right while folded;
 * a click on it folds or unfolds, see {@link foldToggle}, and leaves the cursor where it is.
 */
class FoldWidget extends WidgetType {
    /**
     * Whether it belongs to a list item, else to a heading.
     */
    readonly item: boolean;

    /**
     * Whether what it folds is folded.
     */
    readonly folded: boolean;

    constructor(item: boolean, folded: boolean) {
        super();
        this.item = item;
        this.folded = folded;
    }

    /**
     * Tells whether another arrow looks the same, so the drawn one stays.
     */
    override eq(other: FoldWidget): boolean {
        return other.item === this.item && other.folded === this.folded;
    }

    /**
     * Draws the arrow, its words for screen readers and as tooltip, which folds or unfolds on a click.
     */
    toDOM(view: EditorView): HTMLElement {
        const arrow: HTMLSpanElement = document.createElement("span");
        arrow.className = `cm-fold ${this.item ? "cm-fold-item" : "cm-fold-heading"}${this.folded ? " cm-folded" : ""}`;
        arrow.title = this.folded ? "Unfold" : "Fold";
        arrow.setAttribute("aria-label", arrow.title);
        arrow.addEventListener("mousedown", (event: MouseEvent): void => {
            event.preventDefault();
            foldToggle(view, view.posAtDOM(arrow));
        });
        return arrow;
    }

    /**
     * Keeps a click on the arrow from the editor, which would put the cursor there.
     */
    override ignoreEvent(): boolean {
        return true;
    }
}

/**
 * Formula rendered by MathJax, as the scripts view renders it: `$…$` within the line, `$$…$$` on its own.
 */
class MathWidget extends WidgetType {
    /**
     * TeX of the formula, without its `$`.
     */
    readonly tex: string;

    /**
     * Whether it is a formula `$$…$$`.
     */
    readonly display: boolean;

    /**
     * Whether it shows below its TeX being edited.
     */
    readonly preview: boolean;

    constructor(tex: string, display: boolean, preview: boolean) {
        super();
        this.tex = tex;
        this.display = display;
        this.preview = preview;
    }

    /**
     * Tells whether another formula looks the same, so the rendered one stays.
     */
    override eq(other: MathWidget): boolean {
        return other.tex === this.tex && other.display === this.display && other.preview === this.preview;
    }

    /**
     * Renders the formula as the scripts view does, from an element of the class `math` with its TeX.
     */
    toDOM(): HTMLElement {
        const box: HTMLSpanElement = document.createElement("span");
        const math: HTMLSpanElement = document.createElement("span");
        box.className = "cm-math";
        if (this.preview)
            box.className = "cm-math cm-math-preview";
        else if (this.display)
            box.className = "cm-math cm-math-display";
        math.className = `math math-${this.display ? "block" : "inline"}`;
        math.textContent = this.tex;
        box.append(math);
        mathRender(box);
        return box;
    }

    /**
     * Lets a click reach the editor, which puts the cursor at the formula, so it shows as TeX.
     */
    override ignoreEvent(): boolean {
        return false;
    }
}

/**
 * Embedded image, as the scripts view shows it.
 */
class ImageWidget extends WidgetType {
    /**
     * Address of the image at the reader.
     */
    readonly address: string;

    /**
     * Width, like `300` from `|300` or `|300x200`, empty for the image's own.
     */
    readonly width: string;

    /**
     * Height, like `200` from `|300x200`, empty for the image's own.
     */
    readonly height: string;

    constructor(address: string, width: string, height: string) {
        super();
        this.address = address;
        this.width = width;
        this.height = height;
    }

    /**
     * Tells whether another image looks the same, so the shown one stays.
     */
    override eq(other: ImageWidget): boolean {
        return other.address === this.address && other.width === this.width && other.height === this.height;
    }

    /**
     * Shows the image; once loaded, the editor measures its lines again.
     */
    toDOM(view: EditorView): HTMLElement {
        const image: HTMLImageElement = document.createElement("img");
        image.className = "internal-embed";
        image.src = this.address;
        if (this.width !== "")
            image.setAttribute("width", this.width);
        if (this.height !== "")
            image.setAttribute("height", this.height);
        image.addEventListener("load", (): void => view.requestMeasure());
        return image;
    }

    /**
     * Lets a click reach the editor, which puts the cursor at the image, so it shows as text.
     */
    override ignoreEvent(): boolean {
        return false;
    }
}

/**
 * Task box of a list item, as the scripts view shows it, which a click ticks or unticks, as in Obsidian: `[ ]` becomes
 * `[x]` and back, the cursor staying where it is; in a file to read only it cannot be ticked.
 */
class TaskBoxWidget extends WidgetType {
    /**
     * Whether it is ticked, `[x]`.
     */
    readonly done: boolean;

    constructor(done: boolean) {
        super();
        this.done = done;
    }

    /**
     * Tells whether another box looks the same, so the shown one stays.
     */
    override eq(other: TaskBoxWidget): boolean {
        return other.done === this.done;
    }

    /**
     * Shows the box, as marked writes it for the scripts view; a click writes `x` or a space between its brackets.
     * - `pos`: Start of the box in the text, its `[`.
     */
    toDOM(view: EditorView): HTMLElement {
        const box: HTMLInputElement = document.createElement("input");
        box.type = "checkbox";
        box.disabled = view.state.readOnly;
        box.checked = this.done;
        box.addEventListener("mousedown", (event: MouseEvent): void => {
            event.preventDefault();
            if (view.state.readOnly)
                return;
            const pos: number = view.posAtDOM(box);
            view.dispatch({ changes: { from: pos + 1, to: pos + 2, insert: this.done ? " " : "x" }, userEvent: "input" });
        });
        return box;
    }

    /**
     * Keeps a click on the box from the editor, which would put the cursor there: the box ticks itself.
     */
    override ignoreEvent(): boolean {
        return true;
    }
}

/**
 * Line break `<br>` or break opportunity `<wbr>`, drawn as the element itself, as in the scripts view:
 * `<br>` breaks the line, and a `<wbr>` after it at the end of a line holds the empty line below it.
 */
class BreakWidget extends WidgetType {
    /**
     * Element drawn, `br` or `wbr`.
     */
    readonly tagName: string;

    constructor(tagName: string) {
        super();
        this.tagName = tagName;
    }

    /**
     * Tells whether another break is the same element, so the drawn one stays.
     */
    override eq(other: BreakWidget): boolean {
        return other.tagName === this.tagName;
    }

    /**
     * Draws the element.
     */
    toDOM(): HTMLElement {
        const box: HTMLSpanElement = document.createElement("span");
        box.append(document.createElement(this.tagName));
        return box;
    }

    /**
     * Lets a click reach the editor, which puts the cursor at the break, so it shows as text.
     */
    override ignoreEvent(): boolean {
        return false;
    }
}

/**
 * Tables, callouts, code blocks or HTML blocks right below each other, rendered as the scripts view renders them,
 * with their images, formulas and links, a link that leads nowhere faded, without space of their own above and below
 * them, which only the empty lines around them give, as around any block, see `./editor.css`.
 */
class BlockWidget extends WidgetType {
    /**
     * Markdown of the blocks, their whole lines.
     */
    readonly markdown: string;

    /**
     * Files the links of the note lead to.
     */
    readonly links: Links;

    /**
     * Length of their lines in the note, with their indentation, from the start of the first line to the end of the last.
     */
    readonly length: number;

    constructor(markdown: string, links: Links, length: number) {
        super();
        this.markdown = markdown;
        this.links = links;
        this.length = length;
    }

    /**
     * Tells whether other blocks look the same, so the rendered ones stay.
     */
    override eq(other: BlockWidget): boolean {
        return other.markdown === this.markdown && other.length === this.length && other.links === this.links;
    }

    /**
     * Renders the blocks; once an image of them is loaded, the editor measures its lines again.
     * A click on a link of them follows it, see {@link addressFollow}, a click on the title of a callout that folds
     * opens or closes it, as in the scripts view, and the editor measures its lines again; any other click puts
     * the cursor at the place of their text I clicked, see {@link blockPlaceOf}, so they show as text with the cursor
     * there, ready to type.
     * - `from`: Start of their first line.
     * - `link`: The link clicked, `null` for none.
     */
    toDOM(view: EditorView): HTMLElement {
        const block: HTMLDivElement = document.createElement("div");
        block.className = "cm-rendered";
        block.innerHTML = htmlOf(this.markdown);
        block.querySelectorAll<HTMLImageElement>("img[data-link]").forEach((image: HTMLImageElement): void => {
            const path: string | null = this.links[image.dataset.link ?? ""] ?? null;
            if (path !== null)
                image.src = fileAddressOf(path);
            image.addEventListener("load", (): void => view.requestMeasure());
        });
        block.querySelectorAll<HTMLAnchorElement>("a[data-link]").forEach((link: HTMLAnchorElement): void => {
            if (this.links[link.dataset.link ?? ""] === null)
                link.classList.add("is-unresolved");
        });
        mathRender(block);
        block.addEventListener("mousedown", (event: MouseEvent): void => {
            if (event.button !== 0)
                return;
            event.preventDefault();
            if ((event.target as Element).closest("a, summary") !== null)
                return;
            const from: number = view.posAtDOM(block);
            view.focus();
            view.dispatch({ selection: { anchor: blockPlaceOf(view, from, from + this.length, event) } });
        });
        block.addEventListener("toggle", (): void => view.requestMeasure(), true);
        block.addEventListener("click", (event: MouseEvent): void => {
            const link: HTMLAnchorElement | null = (event.target as Element).closest("a");
            if (link === null)
                return;
            event.preventDefault();
            addressFollow(view, link.dataset.link === undefined ? link.getAttribute("href") ?? ""
                : `${link.dataset.link}#${link.dataset.heading ?? ""}`, this.links);
        });
        return block;
    }

    /**
     * Keeps clicks in the blocks from the editor, which would put the cursor at their start or end:
     * the blocks place the cursor themselves.
     */
    override ignoreEvent(): boolean {
        return true;
    }
}


/**
 * Builds the address of a file at the reader, like an image of a note.
 *
 * @param path - Path, as the scripts view takes it
 * @returns Address like `/api/notes/file?path=…`
 */
function fileAddressOf(path: string): string {
    return `/api/notes/file?path=${encodeURIComponent(path)}`;
}

/**
 * Finds the place in the text of rendered blocks that a click hit, see {@link BlockWidget}: in a table the cell
 * clicked, see {@link cellPlaceOf}; elsewhere, like in a code block, the letter clicked, found by the text around it;
 * else the end of the blocks, after a code block's closing fence, so typing never breaks it.
 * - {@link Document#caretPositionFromPoint}: Gives the text and the letter under the pointer.
 * - `caret`: The letter clicked, `null` beside any text.
 * - `cell`: The cell of a table clicked, `null` for none.
 * - `text`: The text around the letter clicked, empty for none.
 * - `at`: Where that text stands in the lines of the blocks, -1 for nowhere.
 *
 * @param view - The editor
 * @param from - Start of the first line of the blocks
 * @param to - End of their last line
 * @param event - The click
 * @returns The place for the cursor
 */
function blockPlaceOf(view: EditorView, from: number, to: number, event: MouseEvent): number {
    const caret: CaretPosition | null = document.caretPositionFromPoint(event.clientX, event.clientY);
    const cell: HTMLTableCellElement | null = (event.target as Element).closest("td, th");
    if (cell !== null)
        return cellPlaceOf(view, from, to, cell, caret);

    const text: string = caret?.offsetNode.nodeType === Node.TEXT_NODE ? caret.offsetNode.textContent ?? "" : "";
    const at: number = text.trim() === "" ? -1 : view.state.sliceDoc(from, to).indexOf(text);
    return at === -1 ? to : from + at + (caret?.offset ?? 0);
}

/**
 * Finds the place in the text of a table for a click on one of its cells: its row is a line of the table, the line
 * of `-` under the head left out, the tables of the blocks being their runs of lines that begin with `|`; in the row
 * the text of the cell, after its `|`, at the letter clicked where the cell's text holds it as it is, like a number,
 * else at its start, like for a formula.
 * - `table`: The table of the cell, and `tables` all tables of the blocks.
 * - `first`, `last`: Numbers of the first and the last line of the blocks.
 * - `runs`: First line of each run of lines that begin with `|`, the tables in the text.
 * - `row`: Number of the cell's row in its table, the head being 0.
 * - `line`: The line of that row.
 * - `bars`: How many `|` stand before the cell's text so far, escaped ones like in `[[…\|…]]` not counted.
 * - `start`: Start of the cell's text in its line.
 * - `text`, `at`: The text around the letter clicked, and where it stands in the cell's text, -1 for nowhere.
 *
 * @param view - The editor
 * @param from - Start of the first line of the blocks
 * @param to - End of their last line
 * @param cell - The cell clicked
 * @param caret - The letter clicked, `null` beside any text
 * @returns The place for the cursor
 */
function cellPlaceOf(view: EditorView, from: number, to: number, cell: HTMLTableCellElement,
                     caret: CaretPosition | null): number {
    const table: HTMLTableElement = cell.closest("table") as HTMLTableElement;
    const tables: HTMLTableElement[] = [...(table.closest(".cm-rendered")?.querySelectorAll("table") ?? [])];
    const first: number = view.state.doc.lineAt(from).number;
    const last: number = view.state.doc.lineAt(to).number;
    const runs: number[] = [];
    for (let number: number = first; number <= last; number++)
        if (/^[ \t>]*\|/.test(view.state.doc.line(number).text)
            && (number === first || !/^[ \t>]*\|/.test(view.state.doc.line(number - 1).text)))
            runs.push(number);
    const row: number = [...table.rows].indexOf(cell.parentElement as HTMLTableRowElement);
    if (runs[tables.indexOf(table)] === undefined || row === -1)
        return to;

    const line: Line = view.state.doc.line(Math.min(runs[tables.indexOf(table)] + row + (row > 0 ? 1 : 0), last));
    let bars: number = 0;
    let start: number = line.length;
    for (let index: number = 0; index < line.length; index++)
        if (line.text[index] === "|" && line.text[index - 1] !== "\\" && bars++ === cell.cellIndex) {
            start = index + 1 + (/^[ \t]*/.exec(line.text.slice(index + 1))?.[0].length ?? 0);
            break;
        }
    const text: string = caret?.offsetNode.nodeType === Node.TEXT_NODE ? caret.offsetNode.textContent ?? "" : "";
    const at: number = text.trim() === "" ? -1 : line.text.slice(start).split(/(?<!\\)\|/)[0].indexOf(text);
    return line.from + start + (at === -1 ? 0 : at + (caret?.offset ?? 0));
}

/**
 * Tells whether the cursor or a selection touches a stretch of the text, also at its ends, while I am editing.
 *
 * @param look - Look being built
 * @param from - Start of the stretch
 * @param to - End of the stretch
 * @returns Whether it is touched
 */
function touched(look: Look, from: number, to: number): boolean {
    return look.focused
        && look.state.selection.ranges.some((range: SelectionRange): boolean => range.from <= to && range.to >= from);
}

/**
 * Tells whether the cursor stands on a line while I am editing, the end of a selection counting as the cursor.
 *
 * @param look - Look being built
 * @param line - The line
 * @returns Whether the cursor stands on it
 */
function cursorOn(look: Look, line: Line): boolean {
    return look.focused
        && look.state.selection.ranges.some((range: SelectionRange): boolean => range.head >= line.from && range.head <= line.to);
}

/**
 * Tells whether the cursor or a selection lies on a line of a stretch of the text.
 *
 * @param look - Look being built
 * @param from - Start of the stretch
 * @param to - End of the stretch
 * @returns Whether a line of it is touched
 */
function linesTouched(look: Look, from: number, to: number): boolean {
    return touched(look, look.state.doc.lineAt(from).from, look.state.doc.lineAt(to).to);
}

/**
 * Tells whether a block is a callout, a quote whose first line is like `> [!note] Title`, see {@link calloutRule}.
 *
 * @param look - Look being built
 * @param node - Block, like a `Blockquote`
 * @returns Whether it is a callout
 */
function calloutIs(look: Look, node: SyntaxNode): boolean {
    return node.name === "Blockquote" && calloutRule.test(look.state.sliceDoc(node.from, look.state.doc.lineAt(node.from).to));
}

/**
 * Hides a stretch of markup.
 *
 * @param look - Look being built
 * @param from - Start of the markup
 * @param to - End of the markup
 */
function hide(look: Look, from: number, to: number): void {
    if (from < to)
        look.decorations.push(hidden.range(from, to));
}

/**
 * Gives the end of markup like `##` or `>`, with the space or tab after it, which goes with it.
 *
 * @param look - Look being built
 * @param mark - Markup
 * @returns Its end, after the space or tab
 */
function markEndOf(look: Look, mark: SyntaxNode): number {
    return /[ \t]/.test(look.state.sliceDoc(mark.to, mark.to + 1)) ? mark.to + 1 : mark.to;
}

/**
 * Gives each line of a stretch of the text a class, like the lines of a code block.
 *
 * @param look - Look being built
 * @param from - Start of the stretch
 * @param to - End of the stretch
 * @param line - Decoration with the class
 */
function linesMark(look: Look, from: number, to: number, line: Decoration): void {
    const last: number = look.state.doc.lineAt(to).number;
    for (let number: number = look.state.doc.lineAt(from).number; number <= last; number++)
        look.decorations.push(line.range(look.state.doc.line(number).from));
}

/**
 * Puts the lines of a piece of syntax into an element, as the scripts view draws the piece, like a list item
 * into an `li`, so the rules of the scripts view give it their look. Pieces inside each other nest by rank:
 * the deeper a piece lies among those of {@link wrapped}, the lower its rank.
 * - {@link BlockWrapper}: Element around the lines starting in a stretch of the text.
 *
 * @param look - Look being built
 * @param node - Piece of syntax, like a `ListItem`
 * @param tagName - Element, like `li`
 * @param attributes - Attributes of the element, like a class
 * @param to - Where the lines put into it end, the end of the piece unless told: a heading's right after the start of
 *   its line, so the row of a task after it, see `./tasks.ts`, stands outside it, in the text of the note
 */
function wrap(look: Look, node: SyntaxNode, tagName: string, attributes: { [name: string]: string } = {},
              to: number = node.to): void {
    let depth: number = 0;
    for (let parent: SyntaxNode | null = node.parent; parent !== null; parent = parent.parent)
        if (wrapped.includes(parent.name))
            depth++;
    look.wrappers.push(BlockWrapper.create({ tagName: tagName, attributes: attributes, rank: 100 - depth })
        .range(look.state.doc.lineAt(node.from).from, to));
}

/**
 * Puts the fold arrow of a heading after its text, or of a list item at the start of its line, from where `./editor.css`
 * moves it left of its bullet, when the line folds something, see {@link FoldWidget}.
 * - {@link foldable}: Gives what a line folds, by CodeMirror's Markdown, `null` for nothing.
 *
 * @param look - Look being built
 * @param line - Line of the heading or the list item
 * @param item - Whether it is a list item, else a heading
 */
function foldLook(look: Look, line: Line, item: boolean): void {
    if (foldable(look.state, line.from, line.to) === null)
        return;

    look.decorations.push(Decoration.widget({ widget: new FoldWidget(item, foldedAt(look.state, line.to)),
        side: item ? -1 : 1 }).range(item ? line.from : line.to));
}

/**
 * Heading `##`: its line in an `h2`, as the scripts view draws it, its `##` hidden,
 * on the line of the cursor shown left of the text, which keeps its place; its fold arrow after its text.
 * The type word of a block at its start, like `Definition` of `## Definition. Population and Sample`, a small grey
 * box before the name, its dot and space hidden, while the cursor is not on the line, see {@link kindRule};
 * no text to click into, see {@link kindClicked}.
 * - `kind`: The type word with the dot and space after it, `null` for a heading without one.
 * - `start`: Where the text of the heading starts.
 *
 * @param look - Look being built
 * @param node - Heading, like `ATXHeading2`
 * @returns `true`, to look into its text
 */
function headingLook(look: Look, node: SyntaxNode): boolean {
    const line: Line = look.state.doc.lineAt(node.from);
    const mark: SyntaxNode | null = node.getChild("HeaderMark");
    wrap(look, node, `h${node.name.slice(-1)}`, {}, line.from + 1);
    if (mark !== null && touched(look, line.from, line.to))
        look.decorations.push(hanging.range(mark.from, markEndOf(look, mark)));
    else if (mark !== null) {
        const start: number = markEndOf(look, mark);
        const kind: RegExpExecArray | null = node.name === "ATXHeading2" ? kindRule.exec(look.state.sliceDoc(start, line.to)) : null;
        hide(look, mark.from, start);
        if (kind !== null) {
            look.decorations.push(kindBox.range(start, start + kind[1].length));
            hide(look, start + kind[1].length, start + kind[0].length);
        }
    }
    foldLook(look, line, false);
    return true;
}

/**
 * Bold, italic, struck or code: its `**`, `*`, `~~` or `` ` `` hidden while the cursor does not touch it.
 *
 * @param look - Look being built
 * @param node - Bold, italic, struck or code
 * @returns `true`, to look into its text
 */
function markupLook(look: Look, node: SyntaxNode): boolean {
    if (!touched(look, node.from, node.to))
        for (let child: SyntaxNode | null = node.firstChild; child !== null; child = child.nextSibling)
            if (child.name.endsWith("Mark"))
                hide(look, child.from, child.to);
    return true;
}

/**
 * Markdown link `[Text](Address)`: only its text while the cursor does not touch it, which a click follows,
 * a link out of my modules with an arrow after it, one that leads nowhere faded, see {@link unresolvedOf}.
 * - `url`: Its address, `null` for brackets without one.
 * - `address`: The address as written, without `<` and `>`.
 * - `target`: The file it leads to, before `#`, as the reader lists it.
 * Brackets without an address, like the `[!note]` of a callout, are no link, as in the scripts view, and stay as written.
 *
 * @param look - Look being built
 * @param node - Link
 * @returns `true`, to look into its text
 */
function linkLook(look: Look, node: SyntaxNode): boolean {
    const marks: SyntaxNode[] = node.getChildren("LinkMark");
    const url: SyntaxNode | null = node.getChild("URL");
    if (url === null || marks.length < 2 || touched(look, node.from, node.to))
        return true;

    const address: string = look.state.sliceDoc(url.from, url.to).replace(/^<|>$/g, "");
    const target: string = address.split("#")[0].trim();
    hide(look, node.from, marks[0].to);
    hide(look, marks[1].from, node.to);
    if (marks[0].to < marks[1].from)
        look.decorations.push((externalRule.test(address) ? external
            : look.links[target] === null ? unresolvedOf(target) : followable).range(marks[0].to, marks[1].from));
    return true;
}

/**
 * Address of the web written as it is, like `https://…`, which GitHub's Markdown takes as a link:
 * followed by a click while the cursor does not touch it, with an arrow after it as a link out of my modules;
 * the address of a Markdown link is hidden there anyway.
 *
 * @param look - Look being built
 * @param node - Address, `URL`
 * @returns `false`, as it has nothing inside to look into
 */
function urlLook(look: Look, node: SyntaxNode): boolean {
    if (node.parent?.name !== "Link" && node.parent?.name !== "Image" && !touched(look, node.from, node.to))
        look.decorations.push(external.range(node.from, node.to));
    return false;
}

/**
 * Wiki link or embed, while the cursor does not touch it: an embedded image shown,
 * else only its text after `|`, or its target without one, which a click follows, faded when it leads nowhere.
 * Its target is the link before `#`, `|` or the `\|` written in tables, as the reader lists it.
 *
 * @param look - Look being built
 * @param node - `WikiLink` like `[[Note#Heading|Text]]` or `WikiEmbed` like `![[Image.svg|300]]`
 * @returns `false`, as it has nothing inside to look into
 */
function wikiLinkLook(look: Look, node: SyntaxNode): boolean {
    if (touched(look, node.from, node.to))
        return false;

    const text: string = look.state.sliceDoc(node.from, node.to);
    const open: number = node.name === "WikiEmbed" ? 3 : 2;
    const bar: RegExpExecArray | null = /\\?\|/.exec(text);
    const shownFrom: number = node.from + (bar === null ? open : bar.index + bar[0].length);
    const shownTo: number = node.to - 2;
    const target: string = /^!?\[\[([^\]#|\\]*)/.exec(text)?.[1].trim() ?? "";
    const path: string | null | undefined = look.links[target];
    const ending: string = /\.([a-z\d]+)$/i.exec(target)?.[1].toLowerCase() ?? "md";
    const size: RegExpExecArray | null = /^(\d+)(?:x(\d+))?$/.exec(look.state.sliceDoc(shownFrom, shownTo));

    if (node.name === "WikiEmbed" && imageEndings.includes(ending) && typeof path === "string") {
        const image: ImageWidget = new ImageWidget(fileAddressOf(path), size?.[1] ?? "", size?.[2] ?? "");
        look.decorations.push(Decoration.replace({ widget: image }).range(node.from, node.to));
        return false;
    }
    hide(look, node.from, shownFrom);
    hide(look, shownTo, node.to);
    if (shownFrom < shownTo)
        look.decorations.push((path === null ? unresolvedOf(target) : followable).range(shownFrom, shownTo));
    return false;
}

/**
 * Text of a link that leads nowhere: faded and dotted below, as in the scripts view, its tooltip naming what it
 * looked for, so a broken source stands out, and no click follows it.
 *
 * @param target - What the link looked for, like `VO_UniversityLectureLessons/TUM_2025W/04_….pdf`
 * @returns Its look
 */
function unresolvedOf(target: string): Decoration {
    return Decoration.mark({ class: "is-unresolved", attributes: { title: `Leads nowhere: ${target}` } });
}

/**
 * Formula: rendered while the cursor does not touch it, a formula `$…$` with the punctuation right after it, like `,`,
 * on its line, as in the scripts view, see `mathInline` in `../notes/markdown.ts`; else its TeX, a formula `$$…$$`
 * rendered below it.
 * - `after`: The rest of its line.
 * - `punctuation`: How many characters of punctuation follow it.
 *
 * @param look - Look being built
 * @param node - Formula, `InlineMath`
 * @returns `false`, as it has nothing inside to look into
 */
function mathLook(look: Look, node: SyntaxNode): boolean {
    const text: string = look.state.sliceDoc(node.from, node.to);
    const display: boolean = text.startsWith("$$");
    const tex: string = display ? text.slice(2, -2) : text.slice(1, -1);
    const after: string = look.state.sliceDoc(node.to, look.state.doc.lineAt(node.to).to);
    const punctuation: number = display ? 0 : punctuationRule.exec(after)?.[0].length ?? 0;
    if (!touched(look, node.from, node.to)) {
        look.decorations.push(Decoration.replace({ widget: new MathWidget(tex, display, false) }).range(node.from, node.to));
        if (punctuation > 0)
            look.decorations.push(unbroken.range(node.from, node.to + punctuation));
    } else if (display) {
        look.decorations.push(Decoration.widget({ widget: new MathWidget(tex, true, true), side: 1 }).range(node.to));
    }
    return false;
}

/**
 * List: its lines in a `ul` or `ol`, up to where its last item ends, see {@link itemEndOf}, as the scripts view draws
 * them, a numbered list counting from its first number.
 *
 * @param look - Look being built
 * @param node - `BulletList` or `OrderedList`
 * @returns `true`, to look into its items
 */
function listLook(look: Look, node: SyntaxNode): boolean {
    const first: SyntaxNode | null = node.firstChild?.getChild("ListMark") ?? null;
    const start: number = node.name === "OrderedList" && first !== null ? parseInt(look.state.sliceDoc(first.from, first.to)) : 1;
    wrap(look, node, node.name === "BulletList" ? "ul" : "ol", start === 1 ? {} : { start: String(start) },
        node.lastChild !== null ? itemEndOf(look, node.lastChild) : node.to);
    return true;
}

/**
 * Finds where a list item ends by the indentation of its lines: Markdown reads spacer lines right below it into its
 * text, whatever their indentation, see `spacerLevelsOf` in `./keys.ts`; those at its end that do not reach its text
 * belong to a point it stands in, or to no list, and stand after it, so a spacer line with the indentation of the text
 * of `- Estimator` right below its sub-point `\t- θ` ends `θ`, but stays in `Estimator`.
 * - `first`: The first line of the item.
 * - `text`: Columns of the indentation of its text.
 * - `line`: Its last line so far.
 *
 * @param look - Look being built
 * @param node - `ListItem`
 * @returns End of its last line
 */
function itemEndOf(look: Look, node: SyntaxNode): number {
    const first: Line = look.state.doc.lineAt(node.from);
    const text: number = columnsOf(textIndentationOf(first.text) ?? "");
    let line: Line = look.state.doc.lineAt(node.to);
    while (line.number > first.number && spacerRule.test(line.text) && columnsOf(line.text) < text)
        line = look.state.doc.line(line.number - 1);
    return line.to;
}

/**
 * List item: its lines in an `li`, up to where it ends, see {@link itemEndOf}, which draws its bullet or number as in
 * the scripts view;
 * while the cursor is on its first line, without them, as its marker shows there as written, see {@link listMarkLook};
 * its fold arrow left of its bullet when it has sub-points, which folds them with its further lines.
 *
 * @param look - Look being built
 * @param node - `ListItem`
 * @returns `true`, to look into its text
 */
function itemLook(look: Look, node: SyntaxNode): boolean {
    const line: Line = look.state.doc.lineAt(node.from);
    wrap(look, node, "li", touched(look, line.from, line.to) ? { class: "cm-source" } : {}, itemEndOf(look, node));
    if (node.getChild("BulletList") !== null || node.getChild("OrderedList") !== null)
        foldLook(look, line, true);
    return true;
}

/**
 * Marker of a list item, `-` or a number like `1.`, with the indentation before it and the spaces after it:
 * hidden, as the item's `li` draws its bullet or number; on the line of the cursor shown as written,
 * in place of the bullet or number, see `./editor.css`, its indentation still hidden; of a `-` the spaces after it
 * hidden too, so the cursor after them stands where the text begins, also on a new, empty item.
 *
 * @param look - Look being built
 * @param node - Marker, `ListMark`
 * @returns `true`
 */
function listMarkLook(look: Look, node: SyntaxNode): boolean {
    const line: Line = look.state.doc.lineAt(node.from);
    const textFrom: number = node.to + (/^[ \t]*/.exec(look.state.sliceDoc(node.to, line.to))?.[0].length ?? 0);
    if (/^[ \t]*$/.test(look.state.sliceDoc(line.from, node.from)))
        hide(look, line.from, node.from);
    if (!touched(look, line.from, line.to)) {
        hide(look, node.from, textFrom);
    } else if (node.parent?.parent?.name === "BulletList") {
        look.decorations.push(bulletMark.range(node.from, node.to));
        hide(look, node.to, textFrom);
    } else {
        look.decorations.push(numberMark.range(node.from, textFrom));
    }
    return true;
}

/**
 * Paragraph: the indentation of its lines hidden, as the scripts view leaves it out, in a list item putting them
 * under the item's text, and with it the spacer of a spacer line, see `spacerRule` in `./keys.ts`, so the line is blank
 * without the room of a blank and the cursor on it stands where its text begins, never one blank further right.
 * - `first`: The first line of the paragraph.
 * - `line`: One of its lines.
 * - `blank`: Its indentation, with the spacer of a spacer line.
 *
 * @param look - Look being built
 * @param node - `Paragraph`, or `Task`, the paragraph of a task item
 * @returns `true`, to look into its text
 */
function paragraphLook(look: Look, node: SyntaxNode): boolean {
    const first: Line = look.state.doc.lineAt(node.from);
    if (/^[ \t]*$/.test(look.state.sliceDoc(first.from, node.from)))
        hide(look, first.from, look.state.sliceDoc(node.from, node.from + 1) === "⠀" ? node.from + 1 : node.from);
    const last: number = look.state.doc.lineAt(node.to).number;
    for (let number: number = first.number + 1; number <= last; number++) {
        const line: Line = look.state.doc.line(number);
        const blank: number = /^[ \t]*⠀?/.exec(line.text)?.[0].length ?? 0;
        hide(look, line.from, line.from + blank);
    }
    return true;
}

/**
 * Gives how much of the start of a line the look hides, see {@link paragraphLook} and {@link listMarkLook}:
 * of a line of a paragraph its indentation, with the spacer of a spacer line; of the line of a list item
 * the indentation before its `-` or number; nothing of a line of blanks, a code block, a table or a quote,
 * whose blanks show.
 * - `blanks`: Its indentation.
 * - `node`: A piece of syntax around the start of its text, from the innermost outwards.
 *
 * @param state - Text and syntax tree
 * @param line - The line
 * @returns Number of characters hidden at its start
 */
function hiddenStartOf(state: EditorState, line: Line): number {
    const blanks: number = /^[ \t]*/.exec(line.text)?.[0].length ?? 0;
    if (blanks === line.length)
        return 0;
    for (let node: SyntaxNode | null = syntaxTree(state).resolveInner(line.from + blanks, 1); node !== null; node = node.parent) {
        if (node.name === "Paragraph" || node.name === "Task")
            return blanks + (line.text[blanks] === "⠀" ? 1 : 0);
        if (node.name === "ListItem")
            return blanks;
        if (["FencedCode", "CodeBlock", "HTMLBlock", "Table", "Blockquote"].includes(node.name))
            return 0;
    }
    return 0;
}

/**
 * Keeps the cursor off what the look hides, so every key moves it where I see it: put into the hidden start of a line,
 * see {@link hiddenStartOf}, by a click, Home or an arrow up or down, it goes to where the text begins, on an empty
 * spacer line to its end; moved left out of the text of a line it goes on to the end of the line above, as from the
 * start of any line. An empty line drawn without height, see {@link spaceLook}, it passes
 * over in the direction it moved, so such a line never opens as the cursor comes. Only for a cursor moved alone, never
 * while text is picked or changed.
 * - `state`: Text and cursor before the move, the same text after it.
 * - `roomless`: Starts of the empty lines drawn without height while the cursor is not on them.
 * - `head`: Where the cursor was put.
 * - `before`: Where it stood.
 * - `place`: Where it goes instead, the same for no change.
 * - `line`: The line of the place.
 * - `start`: Where the text of that line begins.
 *
 * @param look - Look of the note, which tells the empty lines drawn without height
 * @returns Filter of the changes of the editor
 */
function caretPlaceOf(look: StateField<Drawing>): Extension {
    return EditorState.transactionFilter.of((transaction: Transaction): TransactionSpec | readonly TransactionSpec[] => {
        if (transaction.docChanged || transaction.selection === undefined || transaction.selection.ranges.length > 1
            || !transaction.selection.main.empty || !transaction.isUserEvent("select"))
            return transaction;

        const state: EditorState = transaction.startState;
        const roomless: number[] = state.field(look).roomless;
        const head: number = transaction.selection.main.head;
        const before: number = state.selection.main.head;
        let place: number = head;
        for (let line: Line = state.doc.lineAt(place); ; line = state.doc.lineAt(place)) {
            const start: number = line.from + hiddenStartOf(state, line);
            if (roomless.includes(line.from) && place > before)
                place = state.doc.line(line.number + 1).from;
            else if (roomless.includes(line.from) && line.number > 1)
                place = state.doc.line(line.number - 1).to;
            else if (place < start && before >= start && before <= line.to && line.number > 1)
                place = state.doc.line(line.number - 1).to;
            else if (place < start)
                place = start;
            else
                break;
            if (state.doc.lineAt(place).number === line.number)
                break;
        }
        return place === head ? transaction : [transaction, { selection: { anchor: place }, sequential: true }];
    });
}

/**
 * Task box `[ ]` or `[x]` of a list item: the box of the scripts view, as written on the line of the cursor.
 *
 * @param look - Look being built
 * @param node - Box, `TaskMarker`
 * @returns `false`, as it has nothing inside to look into
 */
function taskBoxLook(look: Look, node: SyntaxNode): boolean {
    const line: Line = look.state.doc.lineAt(node.from);
    const done: boolean = /x/i.test(look.state.sliceDoc(node.from, node.to));
    if (!touched(look, line.from, line.to))
        look.decorations.push(Decoration.replace({ widget: new TaskBoxWidget(done) }).range(node.from, node.to));
    return false;
}

/**
 * Quote: its lines in a `blockquote`, with the line of quotes beside them, as the scripts view draws it.
 * A callout, a quote whose first line is like `> [!note] Title`, renders whole as in the scripts view while the cursor
 * is on none of its lines, see {@link blockLook}, else shows as a quote.
 *
 * @param look - Look being built
 * @param node - Quote, `Blockquote`
 * @returns Whether to look into its text, as it shows as a quote
 */
function quoteLook(look: Look, node: SyntaxNode): boolean {
    if (calloutIs(look, node) && !blockLook(look, node))
        return false;
    wrap(look, node, "blockquote");
    return true;
}

/**
 * Inline HTML: a line break `<br>` or break opportunity `<wbr>` drawn as in the scripts view while the cursor does
 * not touch it, see {@link BreakWidget}; any other tag stays as written, and so does every tag of a table shown as
 * its text, whose rows a break would split.
 * - `table`: Whether the tag stands in a table.
 *
 * @param look - Look being built
 * @param node - Tag, `HTMLTag`
 * @returns `false`, as it has nothing inside to look into
 */
function htmlTagLook(look: Look, node: SyntaxNode): boolean {
    const tagName: string | undefined = breakRule.exec(look.state.sliceDoc(node.from, node.to))?.[1].toLowerCase();
    let table: boolean = false;
    for (let parent: SyntaxNode | null = node.parent; parent !== null; parent = parent.parent)
        table ||= parent.name === "Table";
    if (tagName !== undefined && !table && !touched(look, node.from, node.to))
        look.decorations.push(Decoration.replace({ widget: new BreakWidget(tagName) }).range(node.from, node.to));
    return false;
}

/**
 * Marker `>` of a quote, hidden, on the line of the cursor shown left of the text, which keeps its place.
 *
 * @param look - Look being built
 * @param node - Marker, `QuoteMark`
 * @returns `true`
 */
function quoteMarkLook(look: Look, node: SyntaxNode): boolean {
    if (linesTouched(look, node.from, node.to))
        look.decorations.push(hanging.range(node.from, markEndOf(look, node)));
    else
        hide(look, node.from, markEndOf(look, node));
    return true;
}

/**
 * Table, callout, code block or HTML block, with those right below it: their whole lines rendered as one while the
 * cursor is on none of them, so the space between them is that of the scripts view; above and below them only
 * the empty lines around them, as around any block, see {@link spaceLook}.
 *
 * @param look - Look being built
 * @param node - `Table`, `FencedCode`, `HTMLBlock`, or a callout, `Blockquote`
 * @returns Whether to look into it, as it shows as text
 */
function blockLook(look: Look, node: SyntaxNode): boolean {
    if (look.rendered.includes(node.from))
        return false;

    let last: SyntaxNode = node;
    while (last.nextSibling !== null && renderedWhole.includes(last.nextSibling.name)
        && look.state.doc.lineAt(last.nextSibling.from).number === look.state.doc.lineAt(last.to).number + 1)
        last = last.nextSibling;
    const from: number = look.state.doc.lineAt(node.from).from;
    const to: number = look.state.doc.lineAt(last.to).to;
    if (touched(look, from, to))
        return true;

    for (let block: SyntaxNode | null = node; block !== null && block.from <= last.from; block = block.nextSibling)
        look.rendered.push(block.from);
    const markdown: string = look.state.sliceDoc(from, to);
    const indentation: RegExp = new RegExp(`^${/^[ \t]*/.exec(markdown)?.[0] ?? ""}`, "gm");
    const block: BlockWidget = new BlockWidget(markdown.replace(indentation, ""), look.links, to - from);
    look.decorations.push(Decoration.replace({ widget: block, block: true }).range(from, to));
    return false;
}

/**
 * Code block: rendered as in the scripts view while the cursor is on none of its lines,
 * else each of its lines on grey, in a font of fixed width.
 *
 * @param look - Look being built
 * @param node - Code block, `FencedCode`
 * @returns Whether to look into it, as it shows as text
 */
function codeLook(look: Look, node: SyntaxNode): boolean {
    if (!blockLook(look, node))
        return false;

    linesMark(look, node.from, node.to, codeLine);
    return true;
}

/**
 * Look of each piece of syntax by its name; each tells whether to look into the piece, at the pieces inside it.
 */
const looks: { [name: string]: (look: Look, node: SyntaxNode) => boolean } = {
    ATXHeading1: headingLook,
    ATXHeading2: headingLook,
    ATXHeading3: headingLook,
    ATXHeading4: headingLook,
    ATXHeading5: headingLook,
    ATXHeading6: headingLook,
    Emphasis: markupLook,
    StrongEmphasis: markupLook,
    Strikethrough: markupLook,
    InlineCode: markupLook,
    Link: linkLook,
    URL: urlLook,
    WikiLink: wikiLinkLook,
    WikiEmbed: wikiLinkLook,
    InlineMath: mathLook,
    BulletList: listLook,
    OrderedList: listLook,
    ListItem: itemLook,
    ListMark: listMarkLook,
    Paragraph: paragraphLook,
    Task: paragraphLook,
    TaskMarker: taskBoxLook,
    Blockquote: quoteLook,
    QuoteMark: quoteMarkLook,
    HTMLTag: htmlTagLook,
    FencedCode: codeLook,
    Table: blockLook,
    HTMLBlock: blockLook,
};

/**
 * Tells a heading right below the folded section of a heading of its level, like `## Definition. Estimator`
 * below the folded `## Definition. Random Sample`, see {@link spaceLook}.
 * - {@link foldedRanges}: The parts of the note folded now, a section from the end of the line of its heading
 *   to the end of its last block.
 * - `level`: Start of the line of a heading of its level, like `## `.
 * - `folded`: Whether such a section ends with the block before.
 *
 * @param look - Look being built
 * @param block - Block of the note
 * @param before - Block before it, `null` for the first
 * @returns Whether it is such a heading
 */
function belowFoldIs(look: Look, block: SyntaxNode, before: SyntaxNode | null): boolean {
    if (before === null || !/^ATXHeading\d$/.test(block.name))
        return false;

    const level: RegExp = new RegExp(`^#{${block.name.slice(-1)}}[ \\t]`);
    let folded: boolean = false;
    foldedRanges(look.state).between(before.to, before.to, (from: number, to: number): void => {
        folded ||= to === before.to && level.test(look.state.doc.lineAt(from).text);
    });
    return folded;
}

/**
 * Empty lines between the blocks of the note: each one line high, as every line, so the space between two blocks
 * shows how many empty lines I wrote between them, like the one below the `Generated:` quote, and stays as it is
 * when the cursor comes and goes. Only a heading right below the folded section of a heading of its level stands
 * right below that heading, without the room above a heading and the empty lines between them without height,
 * so folded headings stand close below each other as a list, see {@link belowFoldIs}; the cursor passes over those
 * empty lines, see {@link caretPlaceOf}.
 * - `first`: Number of the first empty line after the block before.
 * - `line`: One of the empty lines.
 *
 * @param look - Look being built
 */
function spaceLook(look: Look): void {
    let before: SyntaxNode | null = null;
    for (let block: SyntaxNode | null = syntaxTree(look.state).topNode.firstChild; block !== null; block = block.nextSibling) {
        if (before !== null && belowFoldIs(look, block, before)) {
            look.decorations.push(belowFold.range(look.state.doc.lineAt(block.from).from));
            const first: number = look.state.doc.lineAt(before.to).number + 1;
            for (let number: number = first; number < look.state.doc.lineAt(block.from).number; number++) {
                const line: Line = look.state.doc.line(number);
                look.roomless.push(line.from);
                if (!cursorOn(look, line))
                    look.decorations.push(noHeight.range(line.from));
            }
        }
        before = block;
    }
}

/**
 * Keeps the spacers and invisible characters on the lines of the cursor invisible, see {@link invisibleRule}.
 *
 * @param look - Look being built
 */
function spacersLook(look: Look): void {
    if (!look.focused)
        return;

    for (const range of look.state.selection.ranges) {
        const from: number = look.state.doc.lineAt(range.from).from;
        for (const match of look.state.sliceDoc(from, look.state.doc.lineAt(range.to).to).matchAll(invisibleRule))
            look.decorations.push(spacerMark.range(from + match.index, from + match.index + match[0].length));
    }
}

/**
 * Builds the look of the whole note for its text and cursor, see the top of this file.
 * - {@link Tree#iterate}: Goes through the pieces of syntax in the order of the text, into a piece while told to.
 * - {@link Decoration.set}, {@link BlockWrapper.set}: Sort the decorations and elements by their place.
 *
 * @param state - Text, cursor, syntax tree and links of the note
 * @returns Look of the note
 */
function drawingOf(state: EditorState): Drawing {
    const look: Look = {
        state: state, links: state.field(linkTargets), focused: state.field(focused), decorations: [], wrappers: [], rendered: [],
        roomless: [],
    };
    syntaxTree(state).iterate({
        enter: (node: SyntaxNodeRef): boolean => looks[node.name]?.(look, node.node) ?? true,
    });
    spaceLook(look);
    spacersLook(look);
    return {
        decorations: Decoration.set(look.decorations, true), wrappers: BlockWrapper.set(look.wrappers, true), roomless: look.roomless,
    };
}

/**
 * Folds what the line of a place folds, see {@link foldLook}, or unfolds it when it is folded.
 * - `line`: The line, of a heading or a list item.
 * - `folded`: What of it is folded, `null` while nothing is.
 * - `range`: What it folds.
 *
 * @param view - The editor
 * @param pos - A place on the line, like that of its fold arrow
 */
function foldToggle(view: EditorView, pos: number): void {
    const line: Line = view.state.doc.lineAt(pos);
    let folded: { from: number; to: number } | null = null;
    foldedRanges(view.state).between(line.to, line.to, (from: number, to: number): void => {
        if (from === line.to)
            folded = { from: from, to: to };
    });
    const range: { from: number; to: number } | null = folded ?? foldable(view.state, line.from, line.to);
    if (range !== null)
        view.dispatch({ effects: (folded === null ? foldEffect : unfoldEffect).of(range) });
}

/**
 * Folds every solution of the note, the section under each heading `#### Solution…`, as the scripts view shows
 * it at first, so I try a task before I see its solution, but that of a worked Example; the whole note read first, as the editor reads at first
 * only what it shows.
 * - {@link forceParsing}: Reads the syntax of the note up to its end, for at most a second.
 * - `ranges`: The sections of the solutions.
 *
 * @param view - The editor
 */
export function solutionsFold(view: EditorView): void {
    forceParsing(view, view.state.doc.length, 1000);
    const ranges: { from: number; to: number }[] = [];
    for (let number: number = 1; number <= view.state.doc.lines; number++) {
        const line: Line = view.state.doc.line(number);
        const range: { from: number; to: number } | null = solutionRule.test(line.text) && !workedIs(view.state, line)
            ? foldable(view.state, line.from, line.to) : null;
        if (range !== null)
            ranges.push(range);
    }
    view.dispatch({ effects: ranges.map((range: { from: number; to: number }): StateEffect<{ from: number; to: number }> =>
        foldEffect.of(range)) });
}

/**
 * Scrolls the note to a heading, so it stands right below the head of the editor, unfolding what folds it away,
 * or to its top when the heading is empty or the note has none of that text.
 * - `unfolds`: Unfolding what folds the heading away.
 * - `line`: The line of the heading, `undefined` for none.
 *
 * @param view - The editor
 * @param heading - Heading as written, like `Definition. Standard Error of the Mean`
 */
export function headingShow(view: EditorView, heading: string): void {
    let line: Line | undefined;
    const unfolds: StateEffect<{ from: number; to: number }>[] = [];
    for (let number: number = 1; heading !== "" && line === undefined && number <= view.state.doc.lines; number++)
        if (headingRule.exec(view.state.doc.line(number).text)?.[1] === heading)
            line = view.state.doc.line(number);
    foldedRanges(view.state).between(line?.from ?? 0, line?.from ?? 0, (from: number, to: number): void => {
        unfolds.push(unfoldEffect.of({ from: from, to: to }));
    });
    view.dispatch({ effects: [...unfolds, EditorView.scrollIntoView(line?.from ?? 0, { y: "start" })] });
}

/**
 * Finds the link at a place of the note: a wiki link, a Markdown link, or an address written as it is.
 * - `url`: An address found on the way, `null` for none.
 *
 * @param state - Text and syntax tree of the note
 * @param pos - The place
 * @returns The link, `WikiLink`, `Link` or `URL`, `null` for none
 */
function linkAt(state: EditorState, pos: number): SyntaxNode | null {
    let url: SyntaxNode | null = null;
    for (let node: SyntaxNode | null = syntaxTree(state).resolveInner(pos, 1); node !== null; node = node.parent) {
        if (node.name === "WikiLink" || node.name === "Link")
            return node;
        if (node.name === "URL")
            url = node;
    }
    return url;
}

/**
 * Follows a link, as the scripts view does: a note opens in the scripts view at the heading after `#`, a heading
 * of the same note, like `[[#Task. Kiosk Sales Standard Error|…]]`, scrolls into sight, see {@link headingShow};
 * any other file opens in this window at the place after `#`, like a PDF at its page with `#page=10`, an address
 * of the web in a new tab; a link that leads nowhere does nothing.
 * - `url`: The address of a Markdown link or an address written as it is.
 *
 * @param view - The editor
 * @param node - The link, see {@link linkAt}
 * @param links - Files the links of the note lead to
 */
function linkFollow(view: EditorView, node: SyntaxNode, links: Links): void {
    const url: SyntaxNode | null = node.name === "URL" ? node : node.getChild("URL");
    addressFollow(view, node.name === "WikiLink"
        ? /^\[\[([^\]|\\]*)/.exec(view.state.sliceDoc(node.from, node.to))?.[1] ?? ""
        : url === null ? "" : view.state.sliceDoc(url.from, url.to).replace(/^<|>$/g, ""), links);
}

/**
 * Follows a link by its address as written, see {@link linkFollow}; a heading of the same note in a section shows its
 * block alone, see `roundHeadingShow` in `./round.ts`, since every other block there is hidden; a note opens in this
 * window, and so does any other file, like a PDF in Chrome's own viewer, never in a second tab of NomSystem;
 * only an address of the web, like `https://…`, opens in a new tab.
 * - `hash`: Where its `#` stands, -1 for none.
 * - `target`, `heading`: The link to a file before `#`, empty for the note itself, and the place in it after `#`.
 * - `path`: The file it leads to, as the reader found it, `null` for none.
 *
 * @param view - The editor
 * @param address - The link as written, like `01_01_SampleMeanStandardError#Theorem. Central Limit Theorem`
 *   or `https://…`
 * @param links - Files the links of the note lead to
 */
function addressFollow(view: EditorView, address: string, links: Links): void {
    if (externalRule.test(address)) {
        window.open(address, "_blank", "noopener");
        return;
    }

    const hash: number = address.indexOf("#");
    const target: string = (hash === -1 ? address : address.slice(0, hash)).trim();
    const heading: string = hash === -1 ? "" : address.slice(hash + 1).trim();
    const path: string | null = links[target] ?? null;
    if (target === "") {
        if (!roundHeadingShow(view, heading, true))
            headingShow(view, heading);
    } else if (path !== null && /\.md$/i.test(path))
        location.assign(noteAddressOf(path, heading));
    else if (path !== null)
        location.assign(heading === "" ? fileAddressOf(path) : `${fileAddressOf(path)}#${heading}`);
}

/**
 * Follows the link of a click: one of a rendered link, see {@link followable}, or with Ctrl held, on a Mac with Cmd,
 * one of a link shown as its text. Taking the mouse button down there keeps the cursor where it is, so the link
 * stays rendered; letting it go follows it, see {@link linkFollow}; any other click goes on to the editor.
 * - `pos`: The place of the text clicked, `null` beside the text.
 * - `node`: The link there, `null` for none.
 *
 * @param event - Mouse button taken down, `mousedown`, or a click, `click`
 * @param view - The editor
 * @returns Whether it was a click on a link, which the editor then leaves alone
 */
function linkClicked(event: MouseEvent, view: EditorView): boolean {
    if (event.button !== 0 || (!(event.target as Element).closest(".cm-follow") && !event.ctrlKey && !event.metaKey))
        return false;

    const pos: number | null = view.posAtCoords({ x: event.clientX, y: event.clientY });
    const node: SyntaxNode | null = pos === null ? null : linkAt(view.state, pos);
    if (node === null)
        return false;
    event.preventDefault();
    if (event.type === "click")
        linkFollow(view, node, view.state.field(linkTargets));
    return true;
}

/**
 * Leaves a click on the type word of a heading, its small grey box, see {@link headingLook}, to nothing: the box is
 * no text, so the cursor never goes into it and the heading stays drawn; a click on the name edits it as before.
 *
 * @param event - Mouse button taken down, `mousedown`
 * @returns Whether it was a click on the box, which the editor then leaves alone
 */
function kindClicked(event: MouseEvent): boolean {
    if ((event.target as Element).closest(".block-kind") === null)
        return false;
    event.preventDefault();
    return true;
}

/**
 * Takes the files the links of the note lead to anew, as the reader found them for the note just saved,
 * so a link written since works and one that leads nowhere fades.
 *
 * @param view - The editor
 * @param links - Files the links of the note lead to
 */
export function linksSet(view: EditorView, links: Links): void {
    view.dispatch({ effects: linksFound.of(links) });
}

/**
 * Live preview of a note, see the top of this file: its look, built again when the text, the cursor,
 * the focus, the syntax tree, what is folded or the files its links lead to change, and the classes of its syntax.
 * - {@link StateField}: Holds the look; only a field may hide line breaks, like those inside a table.
 * - {@link EditorView.decorations}, {@link EditorView.blockWrappers}: Take the decorations and elements of the look.
 * - {@link EditorView.focusChangeEffect}: Tells {@link focused} when the editor gets or loses the focus.
 * - {@link EditorView.domEventHandlers}: Follow a link clicked, see {@link linkClicked}, before the editor
 *   puts the cursor there.
 * - {@link codeFolding}: Holds what is folded, without the `…` CodeMirror puts in place of it, since the arrow
 *   turned right tells it; {@link foldKeymap} folds and unfolds by keys too, like Ctrl+Shift+[ and Ctrl+Shift+].
 *
 * @param links - Files the links of the note lead to, as the reader found them when it was read
 * @returns Extension for the editor
 */
export function livePreview(links: Links): Extension {
    const look: StateField<Drawing> = StateField.define<Drawing>({
        create: (state: EditorState): Drawing => drawingOf(state),
        update: (drawing: Drawing, transaction: Transaction): Drawing =>
            transaction.docChanged || transaction.selection !== undefined
                || transaction.state.field(focused) !== transaction.startState.field(focused)
                || syntaxTree(transaction.state) !== syntaxTree(transaction.startState)
                || foldedRanges(transaction.state) !== foldedRanges(transaction.startState)
                || transaction.state.field(linkTargets) !== transaction.startState.field(linkTargets)
                ? drawingOf(transaction.state)
                : drawing,
        provide: (field: StateField<Drawing>): Extension => [
            EditorView.decorations.from(field, (drawing: Drawing): DecorationSet => drawing.decorations),
            EditorView.blockWrappers.from(field, (drawing: Drawing): RangeSet<BlockWrapper> => drawing.wrappers),
        ],
    });
    return [
        focused,
        linkTargets.init((): Links => links),
        codeFolding({ placeholderDOM: (): HTMLElement => document.createElement("span") }),
        keymap.of(foldKeymap),
        look,
        caretPlaceOf(look),
        EditorView.focusChangeEffect.of((_state: EditorState, focusing: boolean): StateEffect<boolean> => focusChange.of(focusing)),
        EditorView.domEventHandlers({ mousedown: kindClicked }),
        EditorView.domEventHandlers({ mousedown: linkClicked, click: linkClicked }),
        syntaxHighlighting(highlighter),
    ];
}
