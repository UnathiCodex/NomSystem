/**
 * ## Choices
 *
 * The dashboard's own picker, in place of the browser's drop-downs, for every field of a dialog that picks:
 * categories, places, summaries, ways to travel, skills, types, chapters, documents, semesters, tasks and efforts.
 * A field is one row of its dialog: its name at the left, then one line showing its value, like
 * `IN2028_BusinessAnalyticsMachineLearning (VO)`, empty without one, no dash and no placeholder; a click anywhere
 * on the row opens its list right under the line, inside the dialog, pushing the rows below it down, never covering
 * its own row, see {@link listOf}; only one list is open at a time, and Esc or a click beside it closes it.
 * A list of one value to pick closes as I pick; one of several, like tasks, stays open, its picks lighter rows,
 * never checkboxes, until I close it. A field of several values may also add each value as a row of its own,
 * like the chapters of a skill entry: each pick closes the list and adds a row with a small × to take it back,
 * and opening the list again adds the next one, see {@link addedRowsOf}.
 * A search field at its top, like `Search or add a place`, filters the values as I type, ignoring case and accents:
 * a value matches when each typed word stands somewhere in its name, so `mensa garch` finds `Mensa-Garching`;
 * Enter picks the first match. Each value shows its whole name, its detail grey beside it, like the address
 * of a place; where a list takes new values, `+ New place` at its end adds the typed text, or first asks for what
 * a new value needs, like the address of a new place; a fixed list, like the categories, has none.
 * Values keep their order, like the most used first; a group, like `Due today`, stands above its first value.
 * Picked values are a lighter grey; a click picks a value, a click on a picked one takes it back.
 * The values come from a search function, so a list can later come from the reader, like the foods.
 * A short list that takes no new values, like the types, needs no search field and has none.
 * A value wider than its row goes on below, never cut, a long name broken where its parts meet,
 * see {@link breakableOf}.
 *
 * - `../icons.ts`: Puts the icon of every + of the page before the words of `+ New …`, and the cross into the button
 *   that takes a value back.
 * - `lucide`: The icons plus and cross.
 */

import { iconPut, iconWordsOf } from "../icons.ts";
import { Plus, X } from "lucide";


/**
 * Marks where a long name may go on over a next line, where it is wider than its room, as on a phone, in the line
 * of a field and in an entry or a box of the day: after each `_` and between a small and a capital letter, so
 * `IN0004_EinfuehrungRechnerarchitektur (VO)` breaks into `IN0004_Einfuehrung` and `Rechnerarchitektur (VO)`
 * instead of right after `Skill:` and within a word, see `.entry-whole`, `.box-what` and `.picker-line` in `day.css`;
 * the mark is a space of no width, U+200B, which shows nothing.
 *
 * @param text - Text with a long name, like `IN0004_EinfuehrungRechnerarchitektur (VO)`
 * @returns The same text with the marks
 */
export function breakableOf(text: string): string {
    return text.replace(/_/g, "_\u200b").replace(/([a-zäöüß])([A-ZÄÖÜ])/g, "$1\u200b$2");
}

/**
 * A value to pick.
 *
 * - `value`: Value, like `IN2028/Airline Revenue Interval`.
 * - `text`: Text shown and searched, like `Airline Revenue Interval · due Mon, 12.10.2026`.
 * - `group`: Name of its group, like `Due today`, empty for none.
 * - `detail`: Grey detail beside the text in the list, like the address of a place; left out for none.
 */
export type Choice = {
    value: string;
    text: string;
    group: string;
    detail?: string;
};

/**
 * How a picker is built.
 *
 * - `search`: Gives the values for a typed text, all of them for an empty one, see {@link searchOf}.
 * - `picked`: Values picked at first.
 * - `many`: Whether more than one value may be picked.
 * - `adding`: Whether `+ New …` at the end of the list adds the typed text as a new value.
 * - `add`: Takes the typed text as a new value before it is picked, like a new place through its dialog,
 *   also an empty one, and gives the value to pick, `null` to pick none; left out, `+ New …` picks the typed text
 *   itself.
 * - `pick`: Takes the values picked after each change, in the order they were picked; for a list of one value
 *   once it is closed.
 * - `empty`: What the line shows, grey, while nothing is picked; nothing when left out, as every field of the entry
 *   by category has it.
 * - `noun`: What a value is, like `place` or `summary`, for the search field, `Search or add a place`,
 *   and for `+ New place`; `value` when left out.
 * - `aside`: Elements beside the line, like the pencil of a place; none when left out.
 * - `below`: Elements below the line and above the list, like the address of a place; none when left out.
 */
export type ChoicesSetup = {
    search: (text: string) => Promise<Choice[]>;
    picked: string[];
    many: boolean;
    adding: boolean;
    add?: (text: string) => Promise<string | null>;
    pick: (values: string[]) => void;
    empty?: string;
    noun?: string;
    aside?: HTMLElement[];
    below?: HTMLElement[];
};

/**
 * How the rows of a field of several values are built, each value picked a row of its own, see {@link addedRowsOf}.
 *
 * - `choices`: Values to offer, in their order; a value picked already stays out of the list.
 * - `picked`: Values picked, in the order they were picked, also those the list does not offer, like a chapter
 *   whose folder has another name now.
 * - `textOf`: Text of a value picked in its row, like the name of the file of a document of its path.
 * - `grouped`: Whether the search looks at the group of a value too, see {@link groupedSearchOf}.
 * - `noun`: What a value is, like `chapter`, for the search of the list.
 * - `hint`: Shown in place of the line while there are no values to offer at all, like `No chapters yet`;
 *   left out, the field then has no row of its own, only the rows of the values picked, the first named by it.
 * - `change`: Takes the values picked after each pick and each value taken back, in their order.
 */
export type AddedSetup = {
    choices: Choice[];
    picked: string[];
    textOf: (value: string) => string;
    grouped: boolean;
    noun: string;
    hint?: HTMLElement;
    change: (values: string[]) => void;
};

/**
 * Most characters the texts of a list may have together to show without a search field, like `Night` and `Day`;
 * a list with more gets one above it.
 */
const searchedLength: number = 60;

/**
 * The picker whose list is open, `null` while none is, so only one list is open at a time, see {@link listOf}.
 */
let openPicker: HTMLElement | null = null;

/**
 * Closes the list that is open, `null` while none is.
 */
let openClose: (() => void) | null = null;

/**
 * Whether the lists started for the page, see {@link listsStart}, so the router can start the day again.
 */
let listsStarted: boolean = false;


/**
 * Makes a choice that shows its value, without group.
 *
 * @param value - Value, like `HomeMunich`
 * @returns Choice
 */
export function choiceOf(value: string): Choice {
    return { value: value, text: value, group: "" };
}

/**
 * Writes a text as the search compares it: in small letters and without accents, so `munchen` finds `München`.
 * - {@link String#normalize}: With `NFD`, parts a letter like `ü` into `u` and its accent, which is then dropped.
 *
 * @param text - Text, like `München`
 * @returns Text like `munchen`
 */
function searchTextOf(text: string): string {
    return text.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLocaleLowerCase();
}

/**
 * Splits a typed text into the words the search compares.
 *
 * @param text - Typed text, like `Mensa Garch`
 * @returns Words like `mensa`, `garch`
 */
function wordsOf(text: string): string[] {
    return searchTextOf(text).split(/\s+/).filter((word: string): boolean => word !== "");
}

/**
 * Builds the search of a list of my own: the choices whose text holds each word of the typed text, in their order.
 * - `words`: Words of the typed text, as the search compares them.
 *
 * @param choices - Choices, in their order
 * @returns Search for {@link ChoicesSetup}
 */
export function searchOf(choices: Choice[]): (text: string) => Promise<Choice[]> {
    return async (text: string): Promise<Choice[]> => {
        const words: string[] = wordsOf(text);
        return choices.filter((choice: Choice): boolean =>
            words.every((word: string): boolean => searchTextOf(choice.text).includes(word)));
    };
}

/**
 * Builds the search of a list whose values stand under their groups, like documents under their folders:
 * the choices whose group and text together hold each word of the typed text, in their order,
 * so `vo 2025 04` finds `TUM_2025W/04_LogisticPoissonRegression.pdf` under `VO_UniversityLectureLessons`.
 * - `words`: Words of the typed text, as the search compares them.
 *
 * @param choices - Choices, in their order
 * @returns Search for {@link ChoicesSetup}
 */
export function groupedSearchOf(choices: Choice[]): (text: string) => Promise<Choice[]> {
    return async (text: string): Promise<Choice[]> => {
        const words: string[] = wordsOf(text);
        return choices.filter((choice: Choice): boolean =>
            words.every((word: string): boolean => searchTextOf(`${choice.group} ${choice.text}`).includes(word)));
    };
}

/**
 * Makes a button of a picker.
 *
 * @param text - Text of the button
 * @param chosen - Whether it shows as picked
 * @param click - What a click does
 * @returns Button
 */
function buttonOf(text: string, chosen: boolean, click: () => void): HTMLButtonElement {
    const button: HTMLButtonElement = document.createElement("button");
    button.type = "button";
    button.textContent = text;
    button.classList.toggle("chosen", chosen);
    button.addEventListener("click", click);
    return button;
}

/**
 * Makes the button of a value in a list: its text, and its detail grey beside it, like the address of a place.
 * - `detail`: The grey detail.
 *
 * @param choice - The value
 * @param chosen - Whether it shows as picked
 * @param click - What a click does
 * @returns Button
 */
function valueButtonOf(choice: Choice, chosen: boolean, click: () => void): HTMLButtonElement {
    const button: HTMLButtonElement = buttonOf(choice.text, chosen, click);
    button.dataset.value = choice.value;
    if ((choice.detail ?? "") !== "") {
        const detail: HTMLSpanElement = document.createElement("span");
        detail.className = "picker-detail";
        detail.textContent = choice.detail ?? "";
        button.append(detail);
    }
    return button;
}

/**
 * Makes a list that the line of a field opens and closes right under it, inside the dialog, see the top
 * of this file: it opens on a click on the line, closing the list open before, and closes on another click on the line,
 * on Esc, see {@link listsStart}, and on a click beside its picker; open, it shows in sight, as the dialog scrolls.
 *
 * @param picker - The picker, the line and its list
 * @param line - The line of the field, a button
 * @param box - The list
 * @param opened - Comes once the list is open, like to focus its search field
 * @param closed - Comes once the list is closed
 * @returns Closes the list, like after a pick
 */
export function listOf(picker: HTMLElement, line: HTMLButtonElement, box: HTMLElement, opened: () => void,
                       closed: () => void): () => void {

    const close: () => void = (): void => {
        if (box.hidden)
            return;
        box.hidden = true;
        picker.classList.remove("picker-open");
        if (openPicker === picker) {
            openPicker = null;
            openClose = null;
        }
        closed();
    };
    line.type = "button";
    box.hidden = true;
    line.addEventListener("click", (): void => {
        if (!box.hidden) {
            close();
            return;
        }
        openClose?.();
        box.hidden = false;
        picker.classList.add("picker-open");
        openPicker = picker;
        openClose = close;
        box.scrollIntoView({ block: "nearest" });
        opened();
    });
    return close;
}

/**
 * Builds a picker, see the top of this file: the line of the field, showing the texts of the values picked,
 * with what stands beside and below it, and its list, which the line opens and closes, see {@link listOf}:
 * the search field, when the list is long or takes new values, above the values found, and `+ New …` at the end,
 * where new values are taken. Values picked but not found, like a place an entry kept, come first while nothing
 * is typed; `+ New …` names the typed text while no value has it already, nor shows it, case and accents ignored.
 * - `head`: The line with what stands beside it.
 * - `line`: The line of the field, the button that opens the list.
 * - `box`: The list under the line, with its search field.
 * - `newButton`: `+ New …` at the end of the list.
 * - `noun`: What a value is, like `place`.
 * - `chosen`: Values picked so far, in the order they were picked.
 * - `texts`: Text of each value seen, for the line.
 * - `long`: Whether the list is long enough for a search field, more than {@link searchedLength} characters
 *   of all values together, fixed at the start.
 * - `found`: Values found for the typed text.
 * - `close`: Closes the list.
 * - `lineShow`: Shows the texts of the values picked in the line, or nothing without them.
 * - `toggle`: Picks a value or takes it back, shows it in the line, and tells the dialog; a list of one value
 *   closes first.
 * - `show`: Shows the values found for the text of the search field, unless a newer text came meanwhile,
 *   and names the typed text in `+ New …`.
 * - `typedPick`: Picks the value Enter or `+ New …` gives, empties the search and shows all values again,
 *   the value picked scrolled into sight, like a new dish at the end of a long list; a value picked already,
 *   like the place an entry kept, now added to my places, stays picked, and the dialog is told again.
 * - `typedAdd`: Takes the typed text as a new value, by `+ New …` or by Enter when nothing matches: picks it,
 *   or, with `add`, what `add` gives for it, also for an empty text, and nothing when it gives `null`, the text
 *   staying typed; an empty text without `add` puts the focus into the search field instead.
 *
 * @param setup - How the picker is built
 * @returns Picker
 */
export function choicesOf(setup: ChoicesSetup): HTMLDivElement {
    const picker: HTMLDivElement = document.createElement("div");
    const head: HTMLDivElement = document.createElement("div");
    const line: HTMLButtonElement = document.createElement("button");
    const box: HTMLDivElement = document.createElement("div");
    const input: HTMLInputElement = document.createElement("input");
    const list: HTMLDivElement = document.createElement("div");
    const newButton: HTMLButtonElement = document.createElement("button");
    const noun: string = setup.noun ?? "value";
    let chosen: string[] = [...setup.picked];
    const texts: Map<string, string> = new Map();
    let long: boolean = false;
    let found: Choice[] = [];
    let close: () => void = (): void => {};

    const lineShow: () => void = (): void => {
        const text: string = chosen.map((value: string): string => texts.get(value) ?? value).join(", ");
        line.textContent = text === "" ? setup.empty ?? "" : breakableOf(text);
        line.title = text;
        line.classList.toggle("picker-empty", text === "");
    };
    const toggle: (value: string) => void = (value: string): void => {
        if (chosen.includes(value))
            chosen = chosen.filter((other: string): boolean => other !== value);
        else
            chosen = setup.many ? [...chosen, value] : [value];
        list.querySelectorAll<HTMLButtonElement>("button[data-value]").forEach((button: HTMLButtonElement): void => {
            button.classList.toggle("chosen", chosen.includes(button.dataset.value ?? ""));
        });
        lineShow();
        if (!setup.many)
            close();
        setup.pick(chosen);
    };
    const show: () => Promise<void> = async (): Promise<void> => {
        const text: string = input.value.trim();
        const choices: Choice[] = await setup.search(text);
        if (input.value.trim() !== text)
            return;

        choices.forEach((choice: Choice): void => {
            texts.set(choice.value, choice.text);
        });
        const missing: Choice[] = text !== "" ? [] : chosen
            .filter((value: string): boolean => !choices.some((choice: Choice): boolean => choice.value === value))
            .map(choiceOf);
        found = [...missing, ...choices];
        list.replaceChildren(...found.flatMap((choice: Choice, index: number): HTMLElement[] => {
            const button: HTMLButtonElement =
                valueButtonOf(choice, chosen.includes(choice.value), (): void => toggle(choice.value));
            if (choice.group === "" || choice.group === found[index - 1]?.group)
                return [button];
            const group: HTMLParagraphElement = document.createElement("p");
            group.className = "picker-group";
            group.textContent = choice.group;
            return [group, button];
        }));
        newButton.replaceChildren(...iconWordsOf(Plus, text !== "" && !found.some((choice: Choice): boolean =>
            searchTextOf(choice.value) === searchTextOf(text) || searchTextOf(choice.text) === searchTextOf(text))
            ? `New ${noun} “${text}”` : `New ${noun}`));
    };
    const typedPick: (value: string) => void = (value: string): void => {
        input.value = "";
        if (chosen.includes(value)) {
            if (!setup.many)
                close();
            setup.pick(chosen);
        } else
            toggle(value);
        show().then((): void => {
            lineShow();
            list.querySelector(`button[data-value="${CSS.escape(value)}"]`)?.scrollIntoView({ block: "nearest" });
        }).catch((error: unknown): void => console.error(error));
    };
    const typedAdd: (text: string) => void = (text: string): void => {
        if (setup.add === undefined) {
            if (text === "")
                input.focus();
            else
                typedPick(text);
            return;
        }
        setup.add(text).then((value: string | null): void => {
            if (value !== null)
                typedPick(value);
        }).catch((error: unknown): void => console.error(error));
    };

    picker.className = "picker";
    head.className = "picker-head";
    line.className = "picker-line";
    box.className = "picker-box";
    input.type = "search";
    input.className = "picker-search";
    input.placeholder = setup.adding ? `Search or add a ${noun}` : "Search";
    input.autocomplete = "off";
    list.className = "picker-list";
    newButton.type = "button";
    newButton.className = "picker-new";
    input.addEventListener("input", (): void => {
        show().catch((error: unknown): void => console.error(error));
    });
    input.addEventListener("keydown", (event: KeyboardEvent): void => {
        if (event.key !== "Enter")
            return;
        event.preventDefault();
        const text: string = input.value.trim();
        const first: Choice | undefined = found[0];
        if (first !== undefined)
            typedPick(first.value);
        else if (setup.adding && text !== "")
            typedAdd(text);
    });
    newButton.addEventListener("click", (): void => typedAdd(input.value.trim()));
    close = listOf(picker, line, box, (): void => {
        if (box.contains(input))
            input.focus();
        list.querySelector(".chosen")?.scrollIntoView({ block: "nearest" });
    }, (): void => {
        if (input.value !== "") {
            input.value = "";
            show().catch((error: unknown): void => console.error(error));
        }
    });

    setup.search("").then((choices: Choice[]): void => {
        long = choices.reduce((length: number, choice: Choice): number => length + choice.text.length, 0)
            > searchedLength;
        box.replaceChildren(...(long || setup.adding ? [input] : []), list, ...(setup.adding ? [newButton] : []));
        show().then(lineShow).catch((error: unknown): void => console.error(error));
    }).catch((error: unknown): void => console.error(error));
    lineShow();
    head.append(line, ...setup.aside ?? []);
    picker.append(head, ...setup.below ?? [], box);
    return picker;
}

/**
 * Puts two pickers side by side in one row, like the skill and the type of a skill entry in its summary,
 * the first wider, the second below it where the row has no room for both, as on a phone; the list of either opens
 * below both, as wide as the row, see `.panel-pair` in `day.css`.
 *
 * @param first - Picker at the left
 * @param second - Picker at the right
 * @returns The two pickers in one line
 */
export function pairOf(first: HTMLElement, second: HTMLElement): HTMLDivElement {
    const pair: HTMLDivElement = document.createElement("div");
    pair.className = "panel-pair";
    pair.append(first, second);
    return pair;
}

/**
 * Makes the row of a value picked of a field of several values, below the row of the field, see {@link addedRowsOf}:
 * its name, mostly none, its text, like `02_LogisticPoissonRegression`, going on below where it is wider than
 * its row, see {@link breakableOf}, and a small × that takes it back.
 * - `text`: The text in its own element, its whole text in its tooltip.
 * - `remove`: The ×.
 *
 * @param name - Name of the row, like `Chapter`, empty for none
 * @param text - Text of the value, like `04_LogisticRegression.pdf`
 * @param remove - Takes the value back
 * @returns Row
 */
export function addedRowOf(name: string, text: string, remove: () => void): HTMLDivElement {
    const value: HTMLDivElement = document.createElement("div");
    const shown: HTMLSpanElement = document.createElement("span");
    const button: HTMLButtonElement = document.createElement("button");
    value.className = "picker-added";
    shown.className = "picker-added-text";
    shown.textContent = breakableOf(text);
    shown.title = text;
    button.type = "button";
    button.className = "picker-added-remove";
    iconPut(button, X, `Remove ${text}`);
    button.addEventListener("click", remove);
    value.append(shown, button);
    return rowOf(name, value);
}

/**
 * Builds the rows of a field of several values, like the chapters or the documents of a skill entry: its row
 * with the line of its list, empty, see {@link choicesOf}, whose pick closes the list and adds
 * the value as a row of its own below, see {@link addedRowOf}; opening the list again adds the next one.
 * The list offers the values not picked yet, and has no row while every value is picked; while there are none
 * at all, a hint stands in place of its line, or without hint the field has no row of its own.
 * - `offered`: Values the list offers.
 * - `head`: The row of the field, with the line of the list or the hint, none without either.
 *
 * @param name - Name of the field, like `Chapters`
 * @param setup - How the rows are built
 * @returns The row of the field, then one row per value picked
 */
export function addedRowsOf(name: string, setup: AddedSetup): HTMLDivElement[] {
    const offered: Choice[] = setup.choices.filter((choice: Choice): boolean => !setup.picked.includes(choice.value));
    let head: HTMLDivElement[] = setup.hint === undefined || setup.choices.length > 0 ? [] : [rowOf(name, setup.hint)];
    if (offered.length > 0)
        head = [rowOf(name, choicesOf({
            search: setup.grouped ? groupedSearchOf(offered) : searchOf(offered), picked: [], many: false,
            adding: false, noun: setup.noun,
            pick: (values: string[]): void => {
                if (values.length > 0)
                    setup.change([...setup.picked, values[0]]);
            },
        }))];
    return [
        ...head,
        ...setup.picked.map((value: string, index: number): HTMLDivElement =>
            addedRowOf(head.length === 0 && index === 0 ? name : "", setup.textOf(value), (): void =>
                setup.change(setup.picked.filter((other: string): boolean => other !== value)))),
    ];
}

/**
 * Makes a row of a dialog: the name of a field before its picker, like `Place`. A click anywhere on the row
 * but on something to click itself, like the pencil of a place, opens the list of its first picker, see
 * {@link listOf}, or puts the focus into its first field. No `<label>`, which would pass a click on the name
 * to the first button of the picker.
 * - `target`: What was clicked.
 * - `line`: The line of the first picker of the row, `null` for none.
 *
 * @param name - Name of the field
 * @param picker - Picker of the field
 * @returns Row
 */
export function rowOf(name: string, picker: HTMLElement): HTMLDivElement {
    const row: HTMLDivElement = document.createElement("div");
    const label: HTMLSpanElement = document.createElement("span");
    row.className = "panel-field";
    label.className = "entry-name";
    label.textContent = name;
    row.addEventListener("click", (event: MouseEvent): void => {
        const target: HTMLElement = event.target as HTMLElement;
        const line: HTMLButtonElement | null = row.querySelector(".picker-line");
        if (target.closest("button, input, textarea, a, .picker-box") !== null)
            return;
        if (line !== null)
            line.click();
        else
            row.querySelector<HTMLInputElement>("input, textarea")?.focus();
    });
    row.append(label, picker);
    return row;
}

/**
 * Starts the lists of the pickers once for the page, however often the day starts: Esc closes the open list
 * and not the dialog around it, and a click beside the picker of the open list closes it, see {@link listOf}.
 * - `keydown`: Comes before the dialog sees Esc, since it listens first.
 * - `click`: Comes before the element clicked sees it, so the list is closed before another one opens; the click
 *   still goes to the element under the pointer, though the rows move as the list closes.
 */
export function listsStart(): void {
    if (listsStarted)
        return;
    listsStarted = true;
    document.addEventListener("keydown", (event: KeyboardEvent): void => {
        if (event.key !== "Escape" || openClose === null)
            return;
        event.preventDefault();
        event.stopPropagation();
        openClose();
    }, true);
    document.addEventListener("click", (event: MouseEvent): void => {
        if (openPicker !== null && !openPicker.contains(event.target as Node))
            openClose?.();
    }, true);
}
