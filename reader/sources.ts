/**
 * ## Sources
 *
 * Names every folder and file the reader reads, and every address on the web it asks, grouped by area.
 * The reader reads nothing that is not listed here.
 * It writes only into {@link writeRoot}, the folder of the new system, and the editor into the drafts, see {@link editor};
 * the archive of the old system is read only, never written to.
 *
 * - `node:os`: Gives the home folder and the operating system.
 * - `node:path`: Builds file paths for the operating system.
 */

import { homedir, platform } from "node:os";
import { join, resolve, sep } from "node:path";


/**
 * Files of a calendar: in a folder and its subfolders, the files whose names end in an ending.
 *
 * - `folder`: Folder of the files.
 * - `ending`: End of their names, like `.ics` for every calendar file or `_Log.ics` for the new log.
 * - `until`: First day the calendar holds no entries any more, like `2026-08-01` for a closed calendar,
 *   whose yearly series would else go on; none for a calendar I still keep.
 */
export type CalendarSource = {
    folder: string;
    ending: string;
    until?: string;
};

/**
 * Folder `NomWorkspace` with all zones.
 * Environment variable `NOM_VAULT` when set,
 * else `M:\NomWorkspace` on Windows and `~/NomWorkspace` on Linux.
 */
export const vault: string = process.env.NOM_VAULT
    ?? (platform() === "win32" ? "M:\\NomWorkspace" : join(homedir(), "NomWorkspace"));

/**
 * Archive of the old system, `NomSystemarchivierung`: calendars and diary until 2026, read only.
 */
const archive: string = join(vault, "NomManageplannings", "NomSystemarchivierung");

/**
 * Folder of the new system, `NomSystemcalendar`, the folder the reader writes into, but for the drafts of the editor:
 * one folder per year and one per month, like `2026/2026_10/`, holding the log `2026_10_Log.ics`,
 * the plan `2026_10_Plan.ics` and one daily note per day, like `2026_10_12.md`.
 */
export const writeRoot: string = join(vault, "NomManageplannings", "NomSystemcalendar");

/**
 * End of the names of the month files of the log, like `2026_10_Log.ics`: what happened, as events.
 */
export const logEnding: string = "_Log.ics";

/**
 * End of the names of the month files of the plan, like `2026_10_Plan.ics`: the boxes of the plan, as to-dos,
 * see `boxes.ts`, beside the lectures imported from TUMonline, as events.
 */
export const planEnding: string = "_Plan.ics";

/**
 * Sources of the notes area, read only for it; only the editor writes, and only the drafts, see {@link editor};
 * each module in them is a vault of its own, as in Obsidian.
 *
 * - `drafts`: Unchecked chapter drafts, one folder per module, in `.claude/modules/drafts` of this project;
 *   may be missing.
 * - `modules`: My modules, `NomSkillingmodules`, one folder per module with its notes.
 */
export type NotesSources = {
    drafts: string;
    modules: string;
};

/**
 * {@link NotesSources} as they lie in the vault.
 */
export const notes: NotesSources = {
    drafts: join(vault, "NomSystemdashboard", ".claude", "modules", "drafts"),
    modules: join(vault, "NomSkillingmodules"),
};

/**
 * Places the editor writes, the only ones besides {@link writeRoot}: the drafts, never my modules or the archive.
 *
 * - `drafts`: Unchecked drafts I correct, the drafts of {@link notes}.
 * - `edits`: My corrections, one unified diff per save, in the hidden folder `.edits` of the drafts,
 *   for the AI to turn into rules of my style.
 */
export type EditorSources = {
    drafts: string;
    edits: string;
};

/**
 * {@link EditorSources} as they lie in the vault.
 */
export const editor: EditorSources = {
    drafts: notes.drafts,
    edits: join(notes.drafts, ".edits"),
};

/**
 * Modules of the semester, 2026W, by their folders in `NomSkillingmodules`, each with its drafts:
 * the menu of the notes view and the skill area show only these, in this order, the pilot first.
 * A link in a note still opens a note of any module. Changed on request, when the semester's modules change.
 */
export const activeModules: string[] = [
    "IN2028_BusinessAnalyticsMachineLearning",
    "WI1059_FinancialAccounting",
    "WI0219_InvestitionFinanzmanagement",
    "WI1057_CostAccounting",
    "MGT1373_AppliedEconometrics",
    "WI0969_EntrepreneurshipInformation",
    "IN0004_EinfuehrungRechnerarchitektur",
];

/**
 * Plan calendars of the archive, one folder per semester or year.
 */
const planning: string = join(archive, "NomFrequenzPlanung");

/**
 * Google calendars of the archive, one folder per year, closed in August 2026.
 */
const google: string = join(archive, "NomFrequenzGoogle");

/**
 * First day after the Google log of the archive, 1 August 2026: its yearly series, like an old birthday
 * `SophaleMum-Geburtstag`, end there, since the log holds what happened, and the birthdays show in the plan.
 */
const googleEnd: string = "2026-08-01";

/**
 * Sources of the day area.
 *
 * - `plan`: Calendars of what I intend, read as the boxes of each day, see `boxes.ts`:
 *   the archive's, studies per semester and everything else per year, then the plan of the new system.
 * - `log`: Calendars of what really happened, written as `Verb Objekt Ort`:
 *   the archive's until August 2026, then the log of the new system, my one calendar.
 * - `system`: Calendar of birthdays and holidays, shown above the boxes of their day.
 * - `gifts`: My gift ideas for the birthdays and holidays, `Gifts.md` in the folder of the new system,
 *   one Markdown table with one row per gift idea, which the reader writes as I add them, see `gifts.ts`.
 * - `places`: My places, `Places.md` in the folder of the new system, beside `Foods.md`, one Markdown table
 *   with one row per place, its name and its address, which the reader writes as I add places, see `places.ts`.
 * - `notes`: Diary of the archive, daily notes as `FrequenzEreignis<JJJJ>/<JJJJMM>/<JJJJMMTT>.md`;
 *   a daily note of the new system comes first.
 * - `noteTemplate`: Template of a new daily note.
 */
export type DaySources = {
    plan: CalendarSource[];
    log: CalendarSource[];
    system: CalendarSource[];
    gifts: string;
    places: string;
    notes: string;
    noteTemplate: string;
};

/**
 * {@link DaySources} as they lie in the vault.
 */
export const day: DaySources = {
    plan: [
        { folder: join(planning, "FrequenzSkilling2023S"), ending: ".ics" },
        { folder: join(planning, "FrequenzSkilling2023W"), ending: ".ics" },
        { folder: join(planning, "FrequenzSkilling2024S"), ending: ".ics" },
        { folder: join(planning, "FrequenzSkilling2024W"), ending: ".ics" },
        { folder: join(planning, "FrequenzSkilling2025S"), ending: ".ics" },
        { folder: join(planning, "FrequenzSkilling2025W"), ending: ".ics" },
        { folder: join(planning, "FrequenzSkilling2026S"), ending: ".ics" },
        { folder: join(planning, "FrequenzPlanung2024"), ending: ".ics" },
        { folder: join(planning, "FrequenzPlanung2025"), ending: ".ics" },
        { folder: join(planning, "FrequenzPlanung2026"), ending: ".ics" },
        { folder: writeRoot, ending: planEnding },
    ],
    log: [
        { folder: join(google, "FrequenzGoogle2021"), ending: ".ics", until: googleEnd },
        { folder: join(google, "FrequenzGoogle2022"), ending: ".ics", until: googleEnd },
        { folder: join(google, "FrequenzGoogle2023"), ending: ".ics", until: googleEnd },
        { folder: join(google, "FrequenzGoogle2024"), ending: ".ics", until: googleEnd },
        { folder: join(google, "FrequenzGoogle2025"), ending: ".ics", until: googleEnd },
        { folder: join(google, "FrequenzGoogle2026"), ending: ".ics", until: googleEnd },
        { folder: writeRoot, ending: logEnding },
    ],
    system: [
        { folder: google, ending: "FrequenzSystemNom.ics" },
    ],
    gifts: join(writeRoot, "Gifts.md"),
    places: join(writeRoot, "Places.md"),
    notes: join(archive, "NomFrequenzEreignis"),
    noteTemplate: join(archive, "NomFrequenzEreignis", "FrequenzEreignis2026", "202600", "Template_Daily.md"),
};

/**
 * Log of the skill area: the log of the new system, where each block of learning is an entry of the category `Skill`,
 * holding the attempts made in it. The tasks lie in the chapter notes of the {@link activeModules}.
 */
export const skillLog: CalendarSource[] = [{ folder: writeRoot, ending: logEnding }];

/**
 * Log of the trackers of the day, sleep and water: the log of the new system, where they are entries
 * of the categories `Sleep` and `Drink`; the entries of the archive have no category, so they would count nothing.
 */
export const trackerLog: CalendarSource[] = [{ folder: writeRoot, ending: logEnding }];

/**
 * Sources of the food area.
 *
 * - `foods`: My foods, `Foods.md` in the folder of the new system, one Markdown table with one row per food,
 *   which the reader writes as I add foods, see `food.ts`.
 * - `log`: Log of the new system, where each meal is an entry of the category `Food` listing its foods.
 * - `search`: Search of Open Food Facts, which finds products by their names.
 * - `product`: Products of Open Food Facts, which gives a product by its barcode put after the address.
 */
export type FoodSources = {
    foods: string;
    log: CalendarSource[];
    search: string;
    product: string;
};

/**
 * {@link FoodSources} as they lie in the vault and on the web.
 */
export const food: FoodSources = {
    foods: join(writeRoot, "Foods.md"),
    log: [{ folder: writeRoot, ending: logEnding }],
    search: "https://search.openfoodfacts.org/search",
    product: "https://world.openfoodfacts.org/api/v2/product/",
};

/**
 * Builds the path of a month file of the new system: the log or the plan of the month of a day.
 *
 * @param date - Day like `2026-10-13`
 * @param ending - End of the name, {@link logEnding} or {@link planEnding}
 * @returns Path like `2026/2026_10/2026_10_Plan.ics` in {@link writeRoot}
 */
export function monthFileOf(date: string, ending: string): string {
    const [year, month]: string[] = date.split("-");
    return join(writeRoot, year, `${year}_${month}`, `${year}_${month}${ending}`);
}

/**
 * Tells whether the reader may write a file: only inside {@link writeRoot}, never into the archive.
 * - {@link resolve}: Makes a path absolute and takes out `..`, so no path leaves the folder.
 *
 * @param file - Path of a file to write
 * @returns Whether the file lies inside the folder of the new system
 */
export function writeAllowed(file: string): boolean {
    return resolve(file).startsWith(`${resolve(writeRoot)}${sep}`);
}
