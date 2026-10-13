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
 * - Empty lines as high as the space the scripts view leaves between the blocks around them, see {@link spaceLook}.
 * - Bold, italic, struck and code without `**`, `*`, `~~` and `` ` ``, Markdown links and wiki links
 *   `[[Note#Heading|Text]]` as their text; the markup of the piece the cursor touches shows.
 * - Line breaks `<br>` and break opportunities `<wbr>` drawn as in the scripts view, so `<br><wbr>` at the end of a line
 *   leaves an empty line below it; as their text while the cursor touches them.
 * - Task boxes `[ ]` and `[x]` as the boxes of the scripts view, as written on the line of the cursor.
 * - Formulas `$…$` and `$$…$$` rendered as in the scripts view, as their TeX while the cursor touches them;
 *   a formula `$$…$$` being edited shows rendered below its TeX, as in Obsidian.
 * - Images `![[Image.svg|300]]` shown; tables, callouts `> [!note] Title`, code blocks and HTML blocks like `<table>`
 *   rendered as in the scripts view, those right below each other as one, as their text while the cursor is on one
 *   of their lines, as Obsidian shows a callout.
 * - Spacers `⠀` (U+2800) and invisible characters like the soft hyphen blank, as in the scripts view;
 *   on the line of the cursor as faint dots, so I see where they stand.
 * A click on a rendered piece puts the cursor there, so it shows as text; while the editor is not focused,
 * like before the first click, the whole note shows rendered.
 * Links resolve as the reader found them when the note was read: a link that leads nowhere fades,
 * a link or image written since shows once the note is read again.
 *
 * - `@codemirror/state`, `@codemirror/view`: Hold the text and the cursor, draw the text with decorations and widgets,
 *   and put lines into elements with block wrappers.
 * - `@codemirror/language`: Gives the syntax tree of the note, read with `./syntax.ts`.
 * - `@lezer/highlight`: Gives pieces of the syntax the classes of their look, see `./editor.css`.
 * - `../notes/math.ts`: Renders formulas as the scripts view does.
 * - `../notes/markdown.ts`: Renders tables, callouts, code blocks and HTML blocks as the scripts view does.
 */

import { RangeSet, StateEffect, StateField } from "@codemirror/state";
import { BlockWrapper, Decoration, EditorView, WidgetType } from "@codemirror/view";
import { syntaxHighlighting, syntaxTree } from "@codemirror/language";
import { tagHighlighter, tags } from "@lezer/highlight";
import { mathRender } from "../notes/math.ts";
import { htmlOf } from "../notes/markdown.ts";

import type { EditorState, Extension, Line, Range, SelectionRange, StateEffectType, Transaction } from "@codemirror/state";
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
 */
type Look = {
    state: EditorState;
    links: Links;
    focused: boolean;
    decorations: Range<Decoration>[];
    wrappers: Range<BlockWrapper>[];
    rendered: number[];
};

/**
 * Look of a note: its decorations and the elements its lines stand in.
 *
 * - `decorations`: Hidden markup, rendered pieces and classes of lines and text.
 * - `wrappers`: Elements around lines, like `ul` and `li`.
 */
type Drawing = {
    decorations: DecorationSet;
    wrappers: RangeSet<BlockWrapper>;
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
 * Spacer or other invisible character on the line of the cursor, drawn as a faint dot.
 */
const spacerMark: Decoration = Decoration.mark({ class: "cm-spacer" });

/**
 * Link that leads nowhere, faded as in the scripts view.
 */
const unresolved: Decoration = Decoration.mark({ class: "is-unresolved" });

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
 * Task box of a list item, as the scripts view shows it: a box that cannot be ticked here.
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
     * Shows the box, as marked writes it for the scripts view.
     */
    toDOM(): HTMLElement {
        const box: HTMLInputElement = document.createElement("input");
        box.type = "checkbox";
        box.disabled = true;
        box.checked = this.done;
        return box;
    }

    /**
     * Lets a click reach the editor, which puts the cursor at the box, so it shows as text.
     */
    override ignoreEvent(): boolean {
        return false;
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
 * with their images, formulas and links, a link that leads nowhere faded, and with the space the scripts view leaves
 * above and below them.
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
     * Whether they stand right below a heading, which begins their section, so no space stands above them,
     * as in the scripts view, see `./editor.css`.
     */
    readonly belowHeading: boolean;

    /**
     * Space the scripts view leaves above the block after them, in CSS, which takes in their own space below,
     * see `./editor.css`.
     */
    readonly below: string;

    constructor(markdown: string, links: Links, belowHeading: boolean, below: string) {
        super();
        this.markdown = markdown;
        this.links = links;
        this.belowHeading = belowHeading;
        this.below = below;
    }

    /**
     * Tells whether other blocks look the same, so the rendered ones stay.
     */
    override eq(other: BlockWidget): boolean {
        return other.markdown === this.markdown && other.belowHeading === this.belowHeading && other.below === this.below;
    }

    /**
     * Renders the blocks; once an image of them is loaded, the editor measures its lines again.
     */
    toDOM(view: EditorView): HTMLElement {
        const block: HTMLDivElement = document.createElement("div");
        block.className = this.belowHeading ? "cm-rendered cm-below-heading" : "cm-rendered";
        block.style.setProperty("--space-below", this.below);
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
        return block;
    }

    /**
     * Lets a click reach the editor, which puts the cursor into the block, so it shows as text.
     */
    override ignoreEvent(): boolean {
        return false;
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
 */
function wrap(look: Look, node: SyntaxNode, tagName: string, attributes: { [name: string]: string } = {}): void {
    let depth: number = 0;
    for (let parent: SyntaxNode | null = node.parent; parent !== null; parent = parent.parent)
        if (wrapped.includes(parent.name))
            depth++;
    look.wrappers.push(BlockWrapper.create({ tagName: tagName, attributes: attributes, rank: 100 - depth })
        .range(look.state.doc.lineAt(node.from).from, node.to));
}

/**
 * Heading `##`: its line in an `h2`, as the scripts view draws it, its `##` hidden,
 * on the line of the cursor shown left of the text, which keeps its place.
 *
 * @param look - Look being built
 * @param node - Heading, like `ATXHeading2`
 * @returns `true`, to look into its text
 */
function headingLook(look: Look, node: SyntaxNode): boolean {
    const line: Line = look.state.doc.lineAt(node.from);
    const mark: SyntaxNode | null = node.getChild("HeaderMark");
    wrap(look, node, `h${node.name.slice(-1)}`);
    if (mark !== null && touched(look, line.from, line.to))
        look.decorations.push(hanging.range(mark.from, markEndOf(look, mark)));
    else if (mark !== null)
        hide(look, mark.from, markEndOf(look, mark));
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
 * Markdown link `[Text](Address)`: only its text while the cursor does not touch it.
 * Brackets without an address, like the `[!note]` of a callout, are no link, as in the scripts view, and stay as written.
 *
 * @param look - Look being built
 * @param node - Link
 * @returns `true`, to look into its text
 */
function linkLook(look: Look, node: SyntaxNode): boolean {
    const marks: SyntaxNode[] = node.getChildren("LinkMark");
    if (node.getChild("URL") !== null && marks.length >= 2 && !touched(look, node.from, node.to)) {
        hide(look, node.from, marks[0].to);
        hide(look, marks[1].from, node.to);
    }
    return true;
}

/**
 * Wiki link or embed, while the cursor does not touch it: an embedded image shown,
 * else only its text after `|`, or its target without one, faded when it leads nowhere.
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
    if (path === null && shownFrom < shownTo)
        look.decorations.push(unresolved.range(shownFrom, shownTo));
    return false;
}

/**
 * Formula: rendered while the cursor does not touch it, else its TeX, a formula `$$…$$` rendered below it.
 *
 * @param look - Look being built
 * @param node - Formula, `InlineMath`
 * @returns `false`, as it has nothing inside to look into
 */
function mathLook(look: Look, node: SyntaxNode): boolean {
    const text: string = look.state.sliceDoc(node.from, node.to);
    const display: boolean = text.startsWith("$$");
    const tex: string = display ? text.slice(2, -2) : text.slice(1, -1);
    if (!touched(look, node.from, node.to))
        look.decorations.push(Decoration.replace({ widget: new MathWidget(tex, display, false) }).range(node.from, node.to));
    else if (display)
        look.decorations.push(Decoration.widget({ widget: new MathWidget(tex, true, true), side: 1 }).range(node.to));
    return false;
}

/**
 * List: its lines in a `ul` or `ol`, as the scripts view draws them, a numbered list counting from its first number.
 *
 * @param look - Look being built
 * @param node - `BulletList` or `OrderedList`
 * @returns `true`, to look into its items
 */
function listLook(look: Look, node: SyntaxNode): boolean {
    const first: SyntaxNode | null = node.firstChild?.getChild("ListMark") ?? null;
    const start: number = node.name === "OrderedList" && first !== null ? parseInt(look.state.sliceDoc(first.from, first.to)) : 1;
    wrap(look, node, node.name === "BulletList" ? "ul" : "ol", start === 1 ? {} : { start: String(start) });
    return true;
}

/**
 * List item: its lines in an `li`, which draws its bullet or number as in the scripts view;
 * while the cursor is on its first line, without them, as its marker shows there as written, see {@link listMarkLook}.
 *
 * @param look - Look being built
 * @param node - `ListItem`
 * @returns `true`, to look into its text
 */
function itemLook(look: Look, node: SyntaxNode): boolean {
    const line: Line = look.state.doc.lineAt(node.from);
    wrap(look, node, "li", touched(look, line.from, line.to) ? { class: "cm-source" } : {});
    return true;
}

/**
 * Marker of a list item, `-` or a number like `1.`, with the indentation before it and the spaces after it:
 * hidden, as the item's `li` draws its bullet or number; on the line of the cursor shown as written,
 * in place of the bullet or number, see `./editor.css`, its indentation still hidden.
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
    if (!touched(look, line.from, line.to))
        hide(look, node.from, textFrom);
    else
        look.decorations.push((node.parent?.parent?.name === "BulletList" ? bulletMark : numberMark).range(node.from, textFrom));
    return true;
}

/**
 * Paragraph: the indentation of its further lines hidden, as the scripts view leaves it out,
 * in a list item putting them under the item's text.
 *
 * @param look - Look being built
 * @param node - `Paragraph`, or `Task`, the paragraph of a task item
 * @returns `true`, to look into its text
 */
function paragraphLook(look: Look, node: SyntaxNode): boolean {
    const last: number = look.state.doc.lineAt(node.to).number;
    for (let number: number = look.state.doc.lineAt(node.from).number + 1; number <= last; number++) {
        const line: Line = look.state.doc.line(number);
        hide(look, line.from, line.from + (/^[ \t]*/.exec(line.text)?.[0].length ?? 0));
    }
    return true;
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
 * not touch it, see {@link BreakWidget}; any other tag stays as written.
 *
 * @param look - Look being built
 * @param node - Tag, `HTMLTag`
 * @returns `false`, as it has nothing inside to look into
 */
function htmlTagLook(look: Look, node: SyntaxNode): boolean {
    const tagName: string | undefined = breakRule.exec(look.state.sliceDoc(node.from, node.to))?.[1].toLowerCase();
    if (tagName !== undefined && !touched(look, node.from, node.to))
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
 * Gives the space the scripts view leaves above a block of the note, by the rules of `../notes/notes.css`:
 * none above the first block, above a list and right below a heading, whose section it begins;
 * 1.5em above a paragraph, 1em above a quote; above a heading 1rem below a heading or an HTML block that is no table,
 * and below a callout, unless the heading is a `##`, whose section folds apart from the one before; else 2.5rem.
 * The text is 1rem big, so its em are rem.
 *
 * @param look - Look being built
 * @param block - Block, like a `Paragraph`
 * @param before - Block before it, `null` for the first
 * @returns Space in CSS, like `1.5rem`
 */
function spaceAboveOf(look: Look, block: SyntaxNode, before: SyntaxNode | null): string {
    const heading: RegExp = /Heading/;
    if (before === null)
        return "0rem";
    if (heading.test(block.name))
        return heading.test(before.name) || (before.name === "HTMLBlock" && !/^\s*<table/i.test(look.state.sliceDoc(before.from, before.to)))
            || (calloutIs(look, before) && block.name !== "ATXHeading2") ? "1rem" : "2.5rem";
    if (heading.test(before.name))
        return "0rem";
    if (block.name === "Paragraph")
        return "1.5rem";
    if (block.name === "Blockquote")
        return "1rem";
    return "0rem";
}

/**
 * Table, callout, code block or HTML block, with those right below it: their whole lines rendered as one while the
 * cursor is on none of them, so the space between them is that of the scripts view, no space above them right below
 * a heading, and below them the space the scripts view leaves above the next block of the note,
 * see {@link spaceAboveOf}.
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
    const below: string = last.nextSibling === null || node.parent?.name !== "Document"
        ? "0rem" : spaceAboveOf(look, last.nextSibling, last);
    const markdown: string = look.state.sliceDoc(from, to);
    const indentation: RegExp = new RegExp(`^${/^[ \t]*/.exec(markdown)?.[0] ?? ""}`, "gm");
    const belowHeading: boolean = /Heading/.test(node.prevSibling?.name ?? "");
    const block: BlockWidget = new BlockWidget(markdown.replace(indentation, ""), look.links, belowHeading, below);
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
 * Empty lines between the blocks of the note together as high as the space the scripts view leaves between them,
 * the larger of the space below the block before, 1em below a quote, and the space above the block after,
 * see {@link spaceAboveOf}, shared evenly by several, since the scripts view leaves the same space for any number
 * of them; without height next to a block rendered whole, which keeps its own space.
 * - `first`: Number of the first empty line after the block before.
 * - `count`: How many empty lines stand between the two blocks.
 *
 * @param look - Look being built
 */
function spaceLook(look: Look): void {
    let before: SyntaxNode | null = null;
    for (let block: SyntaxNode | null = syntaxTree(look.state).topNode.firstChild; block !== null; block = block.nextSibling) {
        const rendered: boolean = look.rendered.includes(block.from) || (before !== null && look.rendered.includes(before.from));
        const height: string = rendered ? "0rem"
            : `max(${before?.name === "Blockquote" ? "1rem" : "0rem"}, ${spaceAboveOf(look, block, before)})`;
        const first: number = before === null ? 1 : look.state.doc.lineAt(before.to).number + 1;
        const count: number = look.state.doc.lineAt(block.from).number - first;
        const space: Decoration = Decoration.line({ attributes: { style: `height: calc(${height} / ${Math.max(count, 1)})` } });
        for (let number: number = first; number < first + count; number++)
            look.decorations.push(space.range(look.state.doc.line(number).from));
        before = block;
    }
}

/**
 * Shows the spacers and invisible characters on the lines of the cursor as faint dots, see {@link invisibleRule}.
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
 * @param state - Text, cursor and syntax tree of the note
 * @param links - Files the links of the note lead to
 * @returns Look of the note
 */
function drawingOf(state: EditorState, links: Links): Drawing {
    const look: Look = { state: state, links: links, focused: state.field(focused), decorations: [], wrappers: [], rendered: [] };
    syntaxTree(state).iterate({
        enter: (node: SyntaxNodeRef): boolean => looks[node.name]?.(look, node.node) ?? true,
    });
    spaceLook(look);
    spacersLook(look);
    return { decorations: Decoration.set(look.decorations, true), wrappers: BlockWrapper.set(look.wrappers, true) };
}


/**
 * Live preview of a note, see the top of this file: its look, built again when the text, the cursor,
 * the focus or the syntax tree changes, and the classes of its syntax.
 * - {@link StateField}: Holds the look; only a field may hide line breaks, like those inside a table.
 * - {@link EditorView.decorations}, {@link EditorView.blockWrappers}: Take the decorations and elements of the look.
 * - {@link EditorView.focusChangeEffect}: Tells {@link focused} when the editor gets or loses the focus.
 *
 * @param links - Files the links of the note lead to, as the reader found them
 * @returns Extension for the editor
 */
export function livePreview(links: Links): Extension {
    const look: StateField<Drawing> = StateField.define<Drawing>({
        create: (state: EditorState): Drawing => drawingOf(state, links),
        update: (drawing: Drawing, transaction: Transaction): Drawing =>
            transaction.docChanged || transaction.selection !== undefined
                || transaction.state.field(focused) !== transaction.startState.field(focused)
                || syntaxTree(transaction.state) !== syntaxTree(transaction.startState)
                ? drawingOf(transaction.state, links)
                : drawing,
        provide: (field: StateField<Drawing>): Extension => [
            EditorView.decorations.from(field, (drawing: Drawing): DecorationSet => drawing.decorations),
            EditorView.blockWrappers.from(field, (drawing: Drawing): RangeSet<BlockWrapper> => drawing.wrappers),
        ],
    });
    return [
        focused,
        look,
        EditorView.focusChangeEffect.of((_state: EditorState, focusing: boolean): StateEffect<boolean> => focusChange.of(focusing)),
        syntaxHighlighting(highlighter),
    ];
}
