/**
 * ## Gate
 *
 * The one thing the key of a person I share with may do on my server, like Vu's key `vu@skriptum`: SSH runs this file
 * for that key, whatever the key asks, since `~/.ssh/authorized_keys` of my server names it before the key with
 * `restrict`, which allows no shell, no forwarding and no terminal, my name first, then the person's, like
 * `restrict,command="/usr/bin/node /home/sopha/NomWorkspace/NomSystemdashboard/reader/gate.ts Sopha Vu" ssh-ed25519 …`.
 * What the key asks stands in `SSH_ORIGINAL_COMMAND`, a command and maybe a path after one space,
 * like `get 2026-10-20_2113_gemeinsame-listen-und-with.md`; the gate does only these commands, all inside
 * `NomKommunikation`, see `kommunikationRoot` in `sources.ts`, and refuses every other, telling which there are:
 * - `readme`: Gives `README.md` of `NomKommunikation`, which says how we write to each other.
 * - `list`: Lists the messages for the person, every file of their box, like `to_vu/`, by its path in it,
 *   but those of `archive/` and `dashboard/`.
 * - `get <path>`: Gives one file of their box, like `2026-10-15_studien-nacht/CLAIMS.tsv`, also of `archive/`.
 * - `archive <name>`: Moves a message or folder of their box into its `archive/`, as `README.md` asks of who read it.
 * - `put <path>`: Writes what comes in as a new message into my box, like `to_sopha/2026-10-21_0930_antwort.md`,
 *   or into a folder of it, like `to_sopha/2026-10-21_0930_antwort/Tabelle.tsv`, never over a file there.
 * - `sent`: Lists my box with its `archive/`, so the person sees what came and what I archived.
 * - `share <name>`: Writes what comes in into `dashboard/` of my box: an entry, a food, a meal or a place the dashboard
 *   of the person shares with mine, named by the moment, the person and what it is,
 *   like `20261021T093000123Z_Vu_entry_….ics`, see `shared.ts`; one my box has already it takes no second time.
 * - `hello`: Tells my dashboard that the dashboard of the person runs again, so it sends what waits for them.
 * A path is parted by `/`, each part letters, digits, spaces and `._()+,&'-`, not starting with a dot, so it holds
 * no `..` and names no hidden file, and every file it reads or writes lies inside the box after symbolic links
 * are followed. A new file is written beside under a hidden name first, then renamed, so no one sees half of it.
 * Says `ok` after a write and the reason of a refusal on the error output, with the exit code 1, 2 for an unknown
 * command.
 *
 * - `node:fs`: Lists, reads, writes and moves the files of the boxes.
 * - `node:path`: Builds the paths of the boxes.
 * - `./sources.ts`: Names `NomKommunikation`.
 */

import { createReadStream, existsSync, mkdirSync, readdirSync, readFileSync, realpathSync, renameSync, statSync,
    writeFileSync } from "node:fs";
import { dirname, join, sep } from "node:path";
import { kommunikationRoot } from "./sources.ts";

import type { Dirent } from "node:fs";


/**
 * The commands of the gate, as it tells them when it refuses one.
 */
const usage: string = [
    "Allowed: readme | list | get <path> | archive <name> | put <path> | sent | share <name> | hello",
    "  list, get and archive work in the box of the caller, put and sent in the box of the owner of this server.",
].join("\n");

/**
 * The most bytes a message takes, 50 MB, like a PDF of solutions.
 */
const messageMost: number = 50 * 1024 * 1024;

/**
 * The most bytes a shared entry, food, meal or place takes, 1 MB.
 */
const shareMost: number = 1024 * 1024;

/**
 * The most parts a path has, like `baumkuchen_results/footer_2026-10-13/…/Endterm_Solutions.pdf`.
 */
const partsMost: number = 12;

/**
 * One part of a path: letters, digits, spaces and `._()+,&'-`, starting with a letter or a digit, at most 200 characters.
 */
const partForm: RegExp = /^[\p{L}\p{N}][\p{L}\p{N} ._()+,&'-]{0,199}$/u;

/**
 * A name of a person, as the boxes are named: letters and digits of ASCII, starting with a letter, like `Vu`.
 */
const nameForm: RegExp = /^[A-Za-z][A-Za-z0-9]*$/;


/**
 * Ends the gate with a refusal.
 *
 * @param reason - Why, like `No such message: x.md`
 * @param code - Exit code, 1 for a refusal, 2 for an unknown command
 */
function refuse(reason: string, code: number = 1): never {
    process.stderr.write(`${reason}\n`);
    process.exit(code);
}

/**
 * Splits a path as the caller sends it into its parts, refusing one with a part not allowed, see {@link partForm}.
 *
 * @param path - Path like `2026-10-15_studien-nacht/CLAIMS.tsv`
 * @returns Its parts
 */
function partsOf(path: string): string[] {
    const parts: string[] = path.split("/");
    if (path === "" || parts.length > partsMost || !parts.every((part: string): boolean => partForm.test(part)))
        refuse(`No path allowed: ${path}`);
    return parts;
}

/**
 * Refuses a file or folder that does not lie inside a box after symbolic links are followed.
 *
 * @param box - The box, like `NomKommunikation/to_vu`
 * @param path - The file or folder, which exists
 */
function insideCheck(box: string, path: string): void {
    if (!realpathSync(path).startsWith(`${realpathSync(box)}${sep}`))
        refuse(`Not inside the box: ${path}`);
}

/**
 * Lists the files of a folder, by their paths in it, parted by `/`, hidden ones and symbolic links left out.
 *
 * @param folder - The folder
 * @param left - Names of folders right in it left out, like `archive`
 * @returns Paths, sorted
 */
function filesOf(folder: string, left: string[]): string[] {
    if (!existsSync(folder))
        return [];
    return readdirSync(folder, { recursive: true, withFileTypes: true })
        .filter((found: Dirent): boolean => found.isFile())
        .map((found: Dirent): string => join(found.parentPath, found.name).slice(folder.length + 1).split(sep).join("/"))
        .filter((path: string): boolean => !path.split("/").some((part: string): boolean => part.startsWith("."))
            && !left.includes(path.split("/")[0]))
        .sort();
}

/**
 * Reads what comes in, refusing more than a number of bytes.
 *
 * @param most - The most bytes
 * @returns The bytes
 */
async function inputRead(most: number): Promise<Buffer> {
    const chunks: Buffer[] = [];
    let size: number = 0;
    for await (const chunk of process.stdin) {
        size += (chunk as Buffer).length;
        if (size > most)
            refuse(`Too big, more than ${most} bytes`);
        chunks.push(chunk as Buffer);
    }
    return Buffer.concat(chunks);
}

/**
 * Writes a new file under a hidden name beside it first, then renames it, so no one sees half of it.
 *
 * @param file - The file
 * @param bytes - What it holds
 */
function fileWrite(file: string, bytes: Buffer | string): void {
    const hidden: string = join(dirname(file), `.${file.split(sep).at(-1)}.part`);
    writeFileSync(hidden, bytes);
    renameSync(hidden, file);
}

/**
 * Does what the key asks, see the top of this file.
 * - `me`, `caller`: The owner of this server and the person whose key calls, as `authorized_keys` names them.
 * - `theirs`, `mine`: The box of the person and mine, like `to_vu` and `to_sopha`.
 * - `asked`: What the key asks.
 * - `command`, `path`: Its command and the path after it, empty for none.
 */
async function gateRun(): Promise<void> {
    const [me, caller]: string[] = process.argv.slice(2);
    if (!nameForm.test(me ?? "") || !nameForm.test(caller ?? ""))
        refuse("The gate needs the name of the owner and of the caller, like gate.ts Sopha Vu");
    const theirs: string = join(kommunikationRoot, `to_${caller.toLowerCase()}`);
    const mine: string = join(kommunikationRoot, `to_${me.toLowerCase()}`);
    const asked: string = (process.env.SSH_ORIGINAL_COMMAND ?? "").trim();
    const at: number = asked.indexOf(" ");
    const command: string = at === -1 ? asked : asked.slice(0, at);
    const path: string = at === -1 ? "" : asked.slice(at + 1).trim();

    if (command === "readme") {
        process.stdout.write(readFileSync(join(kommunikationRoot, "README.md")));
    } else if (command === "list") {
        process.stdout.write(filesOf(theirs, ["archive", "dashboard"]).map((file: string): string => `${file}\n`).join(""));
    } else if (command === "sent") {
        process.stdout.write(filesOf(mine, ["dashboard"]).map((file: string): string => `${file}\n`).join(""));
    } else if (command === "get") {
        const parts: string[] = partsOf(path);
        const file: string = join(theirs, ...parts);
        if (parts[0] === "dashboard" || !existsSync(file) || !statSync(file).isFile())
            refuse(`No such message: ${path}`);
        insideCheck(theirs, file);
        createReadStream(file).pipe(process.stdout);
    } else if (command === "archive") {
        const parts: string[] = partsOf(path);
        const from: string = join(theirs, ...parts);
        const to: string = join(theirs, "archive", ...parts);
        if (parts.length !== 1 || ["archive", "dashboard"].includes(parts[0]) || !existsSync(from))
            refuse(`No such message: ${path}`);
        insideCheck(theirs, from);
        if (existsSync(to))
            refuse(`Already archived: ${path}`);
        mkdirSync(join(theirs, "archive"), { recursive: true });
        renameSync(from, to);
        process.stdout.write("ok\n");
    } else if (command === "put") {
        const parts: string[] = partsOf(path);
        const file: string = join(mine, ...parts);
        if (["archive", "dashboard"].includes(parts[0]) || existsSync(file))
            refuse(`No new message: ${path}`);
        mkdirSync(dirname(file), { recursive: true });
        if (dirname(file) !== mine)
            insideCheck(mine, dirname(file));
        fileWrite(file, await inputRead(messageMost));
        process.stdout.write("ok\n");
    } else if (command === "share") {
        const box: string = join(mine, "dashboard");
        if (!new RegExp(`^\\d{8}T\\d{9}Z_${caller}_(?:entry|list)_[\\w.@-]{1,160}\\.(?:ics|json)$`).test(path))
            refuse(`No shared name: ${path}`);
        const bytes: Buffer = await inputRead(shareMost);
        if (!existsSync(join(box, path)) && !existsSync(join(box, "archive", path))) {
            mkdirSync(box, { recursive: true });
            fileWrite(join(box, path), bytes);
        }
        process.stdout.write("ok\n");
    } else if (command === "hello") {
        const box: string = join(mine, "dashboard");
        mkdirSync(box, { recursive: true });
        fileWrite(join(box, `hello_${caller}`), `${new Date().toISOString()}\n`);
        process.stdout.write("ok\n");
    } else {
        refuse(`Unknown command: ${asked}\n${usage}`, 2);
    }
}

await gateRun().catch((error: unknown): never => refuse(`The gate failed: ${String(error)}`));
