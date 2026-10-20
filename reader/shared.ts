/**
 * ## Shared
 *
 * Shares my log with Vu, who has a dashboard of their own on a server of their own, through `NomSharedinformations`,
 * a folder Syncthing keeps the same on both servers, see `sharedRoot` in `sources.ts`: our foods, meals, places
 * and rooms are one list of each in it for both of us, and an entry I log with Vu goes to Vu once, so we both have it.
 * Each of us has an inbox in it, a folder named as the other writes the person in `With`, like `Inbox/Vu/`,
 * which the reader of each creates for its own name, see `myName` in `sources.ts`, as the reader starts,
 * see {@link sharedStart}; a name of `With` is one of us when an inbox has that name, small and capital letters alike.
 * When I add an entry, log a box, or change an entry, each of us in its `With` who has not had it yet gets a copy
 * in their inbox, one `.ics` file named by its `UID`, see {@link entryShare}: the same `UID`, its times, category,
 * what, the link of what when it is a web address, its place with the link of the place, where a way starts,
 * the semester of a skill entry, the foods of a meal or a cooking and the cooking a meal draws from, with me in `With`
 * in place of the person, the others staying; not my note, my attempts, my rounds, my chapters, the links
 * to my files, my pain, what a session of sport did, nor the box it was logged from, which are mine alone.
 * After that each copy is its owner's: a change goes to nobody, and one who had the entry never gets it again,
 * also when the name left `With` and came back.
 * My reader takes every entry of my inbox into my log as a new entry, as the dialog would add it, see `entryAdd`
 * in `day.ts`, with the `UID` it brought, so it comes in only once, see {@link inboxTake}: as the reader starts
 * and whenever my inbox changes, the earliest first, so a meal finds the cooking it draws from; then it moves the file
 * into my archive, `Archive/<my name>/`, so the sender sees it came. An entry I took in I never send on, since its
 * sender sends it to everyone in its `With`; one my log cannot take, like one of a category my reader does not know,
 * stays in my inbox, and the reader says so once.
 *
 * - `node:fs`: Creates my inbox, lists and watches it, and moves an entry taken into my archive.
 * - `node:path`: Builds the paths of the inboxes and archives.
 * - `./calendar.ts`: Reads the entries of my log and my inbox, and writes a copy into an inbox.
 * - `./day.ts`: Adds an entry of my inbox to my log, as the dialog adds one.
 * - `./places.ts`: Tells a link I typed, a web address.
 * - `./sources.ts`: Names the folder I share, the inboxes, the archives, my name and the people I share with.
 */

import { existsSync, mkdirSync, renameSync, watch } from "node:fs";
import { basename, join } from "node:path";
import { entriesOnceRead, entryAppend, entryLookup, fileOfId } from "./calendar.ts";
import { entryAdd } from "./day.ts";
import { linkForm } from "./places.ts";
import { archiveRoot, day, inboxRoot, myName, partnersRead, sharedRoot } from "./sources.ts";

import type { Attendee, Entry, EntryFields } from "./calendar.ts";
import type { EntryNew } from "./day.ts";
import type { CalendarSource } from "./sources.ts";


/**
 * Milliseconds without a change of my inbox before the reader takes its entries, so Syncthing brings every file
 * of a moment first, like a meal and the cooking it draws from.
 */
const quiet: number = 1000;

/**
 * Files of my inbox my log could not take, each told once, see {@link inboxTake}.
 */
const failed: Set<string> = new Set();


/**
 * Tells whether the reader shares entries: the folder I share lies there, see `sharedRoot` in `sources.ts`, and I have
 * a name, see `myName` there, which can name a folder and stand in `With`, so without `/`, `\` and comma, and not
 * starting with a dot.
 *
 * @returns Whether it shares
 */
function sharingIs(): boolean {
    return /^[^./\\,][^/\\,]*$/.test(myName) && existsSync(sharedRoot);
}

/**
 * Gives my inbox, see `inboxRoot` in `sources.ts`.
 *
 * @returns Its folder, like `NomSharedinformations/Inbox/Sopha` in `NomManageplannings`
 */
function inboxOf(): string {
    return join(inboxRoot, myName);
}

/**
 * Gives the name of the file of an entry in an inbox or an archive: its `UID`, every character but letters, digits,
 * `.`, `@` and `-` as `_`, then `.ics`.
 *
 * @param id - Identifier of the entry, like `b8f1e81f-15b4-460e-910d-ef6b1b3d09b3@nomsystem`
 * @returns Name, like `b8f1e81f-15b4-460e-910d-ef6b1b3d09b3@nomsystem.ics`
 */
function fileNameOf(id: string): string {
    return `${id.replace(/[^\w.@-]/g, "_")}.ics`;
}

/**
 * Tells whether two names of `With` name the same person, small and capital letters alike.
 *
 * @param first - A name, like `Vu`
 * @param second - Another, like `vu`
 * @returns Whether they are the same
 */
function sameName(first: string, second: string): boolean {
    return first.toLowerCase() === second.toLowerCase();
}

/**
 * Gives my address in an entry I send, the standard address the dialog gives a name, see `standardAddressOf`
 * in `src/day/categories.ts`: the name in small letters, ä, ö, ü and ß as ae, oe, ue and ss, every other letter with
 * an accent plainly, every other character but a–z and 0–9 a dot, never two in a row and none at either end,
 * then `@invalid`, the ending reserved for addresses that never work.
 * - `local`: The part before `@`.
 *
 * @param name - Name, like `Sopha`
 * @returns Address, like `sopha@invalid`
 */
function addressOf(name: string): string {
    const local: string = name.toLowerCase().replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue")
        .replace(/ß/g, "ss").normalize("NFD").replace(/\p{Diacritic}/gu, "")
        .replace(/[^a-z0-9]+/g, ".").replace(/^\.|\.$/g, "");
    return `${local}@invalid`;
}

/**
 * Writes the copy of an entry of my log into the inbox of one of us, see the top of this file:
 * what we both have of it, with me in `With` in place of the person.
 * - `fields`: Its fields and times as the copy has them.
 * - `own`: Its foods and the cooking a meal draws from.
 *
 * @param entry - The entry as my log holds it
 * @param partner - The person, as the inbox is named, like `Vu`
 */
function copyWrite(entry: Entry, partner: string): void {
    const fields: EntryFields = {
        category: entry.category, title: entry.title, titleLink: linkForm.test(entry.titleLink) ? entry.titleLink : "",
        location: entry.location, locationLink: entry.locationLink, from: entry.from,
        attendees: [
            { name: myName, address: addressOf(myName) },
            ...entry.attendees.filter((attendee: Attendee): boolean => !sameName(attendee.name, partner)
                && !sameName(attendee.name, myName)),
        ],
        module: entry.module, type: entry.type, semester: entry.semester, note: "",
        start: new Date(entry.start), end: new Date(entry.end),
    };
    const own: [string, string][] = entry.foods.map((food: string): [string, string] => ["x-food", food]);
    if (entry.cooked !== "")
        own.push(["x-cooked", entry.cooked]);
    entryAppend(join(inboxRoot, partner, fileNameOf(entry.id)), fields, own, entry.id);
}

/**
 * Sends an entry of my log to each of us in its `With` who has not had it yet, see the top of this file: after
 * it is added, logged from a box or changed, never after a drag, which leaves `With` as it is. Sends nothing while
 * the reader shares no entries, see {@link sharingIs}, for an entry I took from my inbox, for a whole day, and to one
 * whose inbox or archive holds the entry already; a copy that fails is told, never failing what I saved.
 * - `name`: Name of the file of the entry in an inbox or an archive.
 * - `found`: The entry as my log holds it, `undefined` when gone.
 * - `partners`: The people I share with, see `partnersRead` in `sources.ts`.
 * - `to`: Those of them in its `With`, each once, as their inboxes are named.
 *
 * @param id - Identifier of the entry
 */
export function entryShare(id: string): void {
    if (!sharingIs())
        return;
    try {
        const name: string = fileNameOf(id);
        const found: [string, Entry] | undefined = entryLookup(day.log, id);
        if (found === undefined || found[1].allDay || existsSync(join(archiveRoot, myName, name)))
            return;
        const partners: string[] = partnersRead();
        const to: Set<string> = new Set(found[1].attendees
            .map((attendee: Attendee): string | undefined =>
                partners.find((partner: string): boolean => sameName(partner, attendee.name)))
            .filter((partner: string | undefined): partner is string => partner !== undefined));
        [...to].filter((partner: string): boolean => !existsSync(join(inboxRoot, partner, name))
            && !existsSync(join(archiveRoot, partner, name)))
            .forEach((partner: string): void => {
                copyWrite(found[1], partner);
            });
    } catch (error: unknown) {
        console.error(new Date().toISOString(), `No copy of ${id}`, error);
    }
}

/**
 * Turns an entry of my inbox into a new entry of my log, as the dialog sends one, see `EntryNew` in `day.ts`:
 * its fields as it brought them, a skill entry its link anew, to the folder of its skill in my modules,
 * see `titleOf` in `documents.ts`, and the cooking a meal draws from only when it is an entry `Cook` of my log
 * before the meal, as I have it once it came with us both in its `With`.
 * - `cooking`: The entry of that cooking in my log, `undefined` for none.
 *
 * @param entry - The entry as my inbox holds it
 * @returns The entry to add
 */
function entryNewOf(entry: Entry): EntryNew {
    const cooking: Entry | undefined = entry.cooked === "" ? undefined : entryLookup(day.log, entry.cooked)?.[1];
    return {
        category: entry.category, title: entry.title, titleLink: entry.titleLink, location: entry.location,
        locationLink: entry.locationLink, from: entry.from, attendees: entry.attendees, module: entry.module,
        type: entry.type, semester: entry.semester, note: "", foods: entry.foods, planned: "",
        cooked: cooking !== undefined && cooking.category === "Cook"
            && Date.parse(cooking.start) < Date.parse(entry.start) ? entry.cooked : "",
        start: entry.start, end: entry.end,
    };
}

/**
 * Takes every entry of my inbox into my log, the earliest first, see the top of this file: one my log has already,
 * by its `UID`, it only moves into my archive; one my log cannot take stays in my inbox, told once.
 * - `inbox`: My inbox as a calendar, each of its `.ics` files.
 * - `archive`: My archive, like `NomSharedinformations/Archive/Sopha`.
 * - `file`: The `.ics` file of an entry in my inbox.
 */
export function inboxTake(): void {
    if (!sharingIs())
        return;
    const inbox: CalendarSource[] = [{ folder: inboxOf(), ending: ".ics" }];
    const archive: string = join(archiveRoot, myName);
    entriesOnceRead(inbox)
        .sort((first: Entry, second: Entry): number => first.start.localeCompare(second.start))
        .forEach((entry: Entry): void => {
            const file: string | undefined = fileOfId(inbox, entry.id);
            if (file === undefined)
                return;
            try {
                if (entryLookup(day.log, entry.id) === undefined)
                    entryAdd(entryNewOf(entry), entry.id);
                mkdirSync(archive, { recursive: true });
                renameSync(file, join(archive, basename(file)));
            } catch (error: unknown) {
                if (!failed.has(file))
                    console.error(new Date().toISOString(), `My log cannot take ${file}`, error);
                failed.add(file);
            }
        });
}

/**
 * Starts sharing as the reader starts, while it shares entries, see {@link sharingIs}: creates my inbox, so Vu's
 * reader knows my name, takes what lies in it, and watches it as long as the reader runs, taking its entries
 * after every change once it is quiet for {@link quiet}.
 * - `waiting`: Timer of the next taking, `undefined` while none waits.
 */
export function sharedStart(): void {
    if (!sharingIs())
        return;
    mkdirSync(inboxOf(), { recursive: true });
    inboxTake();
    let waiting: NodeJS.Timeout | undefined = undefined;
    watch(inboxOf(), (): void => {
        clearTimeout(waiting);
        waiting = setTimeout(inboxTake, quiet);
    });
}
