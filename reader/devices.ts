/**
 * ## Devices
 *
 * Writes what each of my devices shows of the page into `Devices.md`, so the dashboard is shaped for each of them:
 * one Markdown table, as `Places.md`, one row per device, its system and browser, like `Linux, Chrome`, its page
 * in CSS pixels, like `1920 × 1003`, its scale, like `2` for a 4K screen at 200 %, its screen in CSS pixels,
 * like `1920 × 1080`, whether it runs as the installed app, and when its page had that size first, like
 * `13.10.2026 23:20`.
 * A device is its system and browser, its screen, its scale and whether it is the app; a report with another size
 * of its page writes its row anew, the same size leaves the file as it is, and a new device gets a row of its own
 * at the end; the reader creates the file with the first report. The browser of Claude's screenshots, which names
 * itself `HeadlessChrome`, is no device of mine and writes nothing.
 *
 * - `node:fs`: Reads and writes `Devices.md`.
 * - `node:path`: Gives the folder of the file.
 * - `./calendar.ts`: Writes the day and the time of now in Berlin time.
 * - `./sources.ts`: Names `Devices.md` and tells which files the reader may write.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { berlinDateOf, berlinTimeOf } from "./calendar.ts";
import { devicesFile, writeAllowed } from "./sources.ts";


/**
 * What a device shows of the page, as the page sends it.
 *
 * - `width`, `height`: Size of the page in CSS pixels, like 1920 and 1003.
 * - `scale`: Device pixels per CSS pixel, like 2 for a 4K screen at 200 %.
 * - `screenWidth`, `screenHeight`: Size of the screen in CSS pixels, like 1920 and 1080.
 * - `app`: Whether the page runs as the installed app, in a window of its own.
 * - `agent`: User agent of the browser, which names its system and itself.
 */
export type DeviceReport = {
    width: number;
    height: number;
    scale: number;
    screenWidth: number;
    screenHeight: number;
    app: boolean;
    agent: string;
};

/**
 * Head of a new `Devices.md`, its table without rows.
 */
const fileHead: string[] = ["| Device | Page | Scale | Screen | App | Since |", "|---|---|---|---|---|---|"];

/**
 * Systems by what their user agent holds, the first that matches naming it; Android before Linux, whose name
 * an Android browser holds too.
 */
const systems: [string, RegExp][] = [["Android", /Android/], ["iOS", /iPhone|iPad/], ["Windows", /Windows/],
    ["macOS", /Mac OS X/], ["ChromeOS", /CrOS/], ["Linux", /Linux/]];

/**
 * Browsers by what their user agent holds, the first that matches naming it; Edge before Chrome, whose name Edge
 * holds too.
 */
const browsers: [string, RegExp][] = [["Edge", /Edg\//], ["Firefox", /Firefox\//], ["Chrome", /Chrome\//],
    ["Safari", /Safari\//]];


/**
 * Names a device by its system and browser, read from its user agent.
 *
 * @param agent - User agent, like `Mozilla/5.0 (X11; Linux x86_64) … Chrome/141.0.0.0 Safari/537.36`
 * @returns Name like `Linux, Chrome`, `Other` for what it does not know
 */
function deviceNameOf(agent: string): string {
    const system: string = systems.find(([, form]: [string, RegExp]): boolean => form.test(agent))?.[0] ?? "Other";
    const browser: string = browsers.find(([, form]: [string, RegExp]): boolean => form.test(agent))?.[0] ?? "Other";
    return `${system}, ${browser}`;
}

/**
 * Gives the cells of a device that make it this device, its name, its scale, its screen and whether it is the app.
 *
 * @param row - Row of `Devices.md`
 * @returns The four cells in one text
 */
function keyOf(row: string): string {
    const cells: string[] = row.split("|").slice(1, -1).map((cell: string): string => cell.trim());
    return [cells[0], cells[2], cells[3], cells[4]].join("|");
}

/**
 * Writes the report of a device into its row of `Devices.md`, see the top of this file, every other line staying
 * as it is.
 * - `sizes`: The numbers of the report, each checked.
 * - `now`: The moment, whose day and time in Berlin time the row holds.
 * - `row`: The row of the device as the report gives it.
 * - `lines`: Lines of the file.
 * - `index`: Index of the row of the device, -1 for none.
 *
 * @param report - Report as the page sends it
 * @throws {Error} - When a size is no number above 0, or the file lies outside the new system
 */
export function deviceReport(report: DeviceReport): void {
    const agent: string = String(report.agent ?? "");
    if (agent.includes("HeadlessChrome"))
        return;
    const sizes: number[] = [report.width, report.height, report.scale, report.screenWidth, report.screenHeight];
    if (!sizes.every((size: unknown): boolean => typeof size === "number" && Number.isFinite(size) && size > 0))
        throw new Error(`No sizes of a device: ${sizes.join(", ")}`);
    if (!writeAllowed(devicesFile))
        throw new Error(`No writing outside the new system: ${devicesFile}`);

    const now: Date = new Date();
    const row: string = `| ${deviceNameOf(agent)} | ${Math.round(report.width)} × ${Math.round(report.height)} `
        + `| ${Math.round(report.scale * 100) / 100} `
        + `| ${Math.round(report.screenWidth)} × ${Math.round(report.screenHeight)} `
        + `| ${report.app === true ? "yes" : "no"} `
        + `| ${berlinDateOf(now).split("-").reverse().join(".")} ${berlinTimeOf(now)} |`;
    const lines: string[] =
        existsSync(devicesFile) ? readFileSync(devicesFile, "utf8").split("\n") : [...fileHead, ""];
    const index: number = lines.findIndex((line: string): boolean =>
        line.startsWith("|") && !line.startsWith("|---") && keyOf(line) === keyOf(row));
    if (index !== -1 && lines[index].split("|")[2].trim() === row.split("|")[2].trim())
        return;
    if (index === -1)
        lines.splice(lines.findLastIndex((line: string): boolean => line.startsWith("|")) + 1, 0, row);
    else
        lines[index] = row;
    mkdirSync(dirname(devicesFile), { recursive: true });
    writeFileSync(devicesFile, lines.join("\n"));
}
