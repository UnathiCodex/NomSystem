/**
 * ## Choices
 *
 * The dashboard's own picker, in place of the browser's drop-downs, for every list of a dialog:
 * places, whats, ways to travel, modules, types, chapters, documents, tasks and efforts. A search field at its top filters the values
 * as I type, ignoring case and accents: a value matches when each typed word stands somewhere in its name,
 * so `mensa garch` finds `Mensa-Garching`; Enter picks the first match,
 * and where a list takes new values, `+` adds the typed text, or first asks for what a new value needs,
 * like the address of a new place. The values show as a list with one whole name per row, also a few short ones,
 * like `0` to `10`, six rows and a half high, then scrolling, see `.picker-list` in `day.css`.
 * Values keep their order, like the most used first; a group, like `Due today`, stands above its first value.
 * Picked values are a lighter grey; a click picks a value, a click on a picked one takes it back.
 * The values come from a search function, so a list can later come from the reader, like the foods.
 * A short list that takes no new values, like a single module, needs no search field and has none.
 */


/**
 * A value to pick.
 *
 * - `value`: Value, like `IN2028/Airline Revenue Interval`.
 * - `text`: Text shown and searched, like `Airline Revenue Interval · due Monday, 12.10.2026`.
 * - `group`: Name of its group, like `Due today`, empty for none.
 */
export type Choice = {
    value: string;
    text: string;
    group: string;
};

/**
 * How a picker is built.
 *
 * - `search`: Gives the values for a typed text, all of them for an empty one, see {@link searchOf}.
 * - `picked`: Values picked at first.
 * - `many`: Whether more than one value may be picked.
 * - `adding`: Whether `+` adds the typed text as a new value.
 * - `add`: Takes the typed text as a new value before it is picked, like a new place through its dialog,
 *   and gives the value to pick, `null` to pick none; left out, `+` picks the typed text itself.
 * - `pick`: Takes the values picked after each change, in the order they were picked.
 */
export type ChoicesSetup = {
    search: (text: string) => Promise<Choice[]>;
    picked: string[];
    many: boolean;
    adding: boolean;
    add?: (text: string) => Promise<string | null>;
    pick: (values: string[]) => void;
};

/**
 * Most characters the texts of a list may have together to show without a search field, like `Night` and `Day`;
 * a list with more gets one above it.
 */
const searchedLength: number = 60;


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
 * Builds a picker, see the top of this file: the search field, when the list is long or takes new values,
 * above the list of the values found, and `+` at the end for the typed text, where new values are taken.
 * Values picked but not found, like a place an entry kept, come first while nothing is typed;
 * `+` is offered only for a text no value has already, case and accents ignored.
 * - `chosen`: Values picked so far, in the order they were picked.
 * - `long`: Whether the list is long enough for a search field, more than {@link searchedLength} characters
 *   of all values together, fixed at the start.
 * - `found`: Values found for the typed text.
 * - `toggle`: Picks a value or takes it back, and tells the dialog.
 * - `show`: Shows the values found for the text of the search field, unless a newer text came meanwhile.
 * - `typedPick`: Picks the value Enter or `+` gives, empties the search and shows all values again,
 *   the value picked scrolled into sight, like a new dish at the end of a long list; a value picked already,
 *   like the place an entry kept, now added to my places, stays picked, and the dialog is told again.
 * - `typedAdd`: Takes the typed text as a new value, by `+` or by Enter when nothing matches: picks it,
 *   or, with `add`, what `add` gives for it, and nothing when it gives `null`, the text staying typed.
 *
 * @param setup - How the picker is built
 * @returns Picker
 */
export function choicesOf(setup: ChoicesSetup): HTMLDivElement {
    const picker: HTMLDivElement = document.createElement("div");
    const input: HTMLInputElement = document.createElement("input");
    const list: HTMLDivElement = document.createElement("div");
    let chosen: string[] = [...setup.picked];
    let long: boolean = false;
    let found: Choice[] = [];

    const toggle: (value: string) => void = (value: string): void => {
        if (chosen.includes(value))
            chosen = chosen.filter((other: string): boolean => other !== value);
        else
            chosen = setup.many ? [...chosen, value] : [value];
        list.querySelectorAll<HTMLButtonElement>("button[data-value]").forEach((button: HTMLButtonElement): void => {
            button.classList.toggle("chosen", chosen.includes(button.dataset.value ?? ""));
        });
        setup.pick(chosen);
    };
    const show: () => Promise<void> = async (): Promise<void> => {
        const text: string = input.value.trim();
        const choices: Choice[] = await setup.search(text);
        if (input.value.trim() !== text)
            return;

        const missing: Choice[] = text !== "" ? [] : chosen
            .filter((value: string): boolean => !choices.some((choice: Choice): boolean => choice.value === value))
            .map(choiceOf);
        found = [...missing, ...choices];
        list.replaceChildren(...found.flatMap((choice: Choice, index: number): HTMLElement[] => {
            const button: HTMLButtonElement = buttonOf(choice.text, chosen.includes(choice.value), (): void => toggle(choice.value));
            button.dataset.value = choice.value;
            if (choice.group === "" || choice.group === found[index - 1]?.group)
                return [button];
            const group: HTMLParagraphElement = document.createElement("p");
            group.className = "picker-group";
            group.textContent = choice.group;
            return [group, button];
        }));
        if (setup.adding && text !== "" && !found.some((choice: Choice): boolean => searchTextOf(choice.value) === searchTextOf(text)))
            list.append(buttonOf(`+ ${text}`, false, (): void => typedAdd(text)));
    };
    const typedPick: (value: string) => void = (value: string): void => {
        input.value = "";
        if (chosen.includes(value))
            setup.pick(chosen);
        else
            toggle(value);
        show().then((): void => {
            list.querySelector(`button[data-value="${CSS.escape(value)}"]`)?.scrollIntoView({ block: "nearest" });
        }).catch((error: unknown): void => console.error(error));
    };
    const typedAdd: (text: string) => void = (text: string): void => {
        if (setup.add === undefined) {
            typedPick(text);
            return;
        }
        setup.add(text).then((value: string | null): void => {
            if (value !== null)
                typedPick(value);
        }).catch((error: unknown): void => console.error(error));
    };

    picker.className = "picker";
    input.type = "search";
    input.className = "picker-search";
    input.placeholder = setup.adding ? "Search, or type a new one" : "Search";
    input.autocomplete = "off";
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

    setup.search("").then((choices: Choice[]): void => {
        long = choices.reduce((length: number, choice: Choice): number => length + choice.text.length, 0)
            > searchedLength;
        list.className = "picker-list";
        picker.replaceChildren(...(long || setup.adding ? [input] : []), list);
        show().then((): void => {
            requestAnimationFrame((): void => list.querySelector(".chosen")?.scrollIntoView({ block: "nearest" }));
        }).catch((error: unknown): void => console.error(error));
    }).catch((error: unknown): void => console.error(error));
    return picker;
}

/**
 * Makes a row of a dialog: the name of a field before its picker, like `Place`.
 * No `<label>`, which would pass a click on the name to the first button of the picker.
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
    row.append(label, picker);
    return row;
}
