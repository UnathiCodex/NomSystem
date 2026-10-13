/**
 * ## Sources
 *
 * Names every folder and file the reader reads, and every address on the web it asks, grouped by area.
 * My new system is three folders in `NomManageplannings`, see {@link systemRoots}: `NomSystemcalendar` for plan
 * and log, {@link calendarRoot}, `NomSystemdiary` for the daily notes, {@link diaryRoot}, and `NomSystemdata`
 * for my foods and places, {@link dataRoot}; my old system, `NomSystemprevious`, lies beside them and is never read.
 * The reader reads only the new system, my modules and the drafts, see {@link notes}, and the files the skill
 * entries link, in my modules and my projects, see {@link activeSkills} and `documents.ts`, and nothing that is
 * not listed here.
 * It writes only into the three folders of the new system, see {@link writeAllowed}, and the editor into the drafts,
 * see {@link editor}. A file or folder of the new system that is missing, like `Birthdays.ics` or the log of a month
 * without entries, counts as empty.
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
 * - `ending`: End of their names, like `_Log.ics` for the log or `Birthdays.ics` for the birthdays and holidays.
 */
export type CalendarSource = {
    folder: string;
    ending: string;
};

/**
 * Folder `NomWorkspace` with all zones.
 * Environment variable `NOM_VAULT` when set,
 * else `M:\NomWorkspace` on Windows and `~/NomWorkspace` on Linux.
 */
export const vault: string = process.env.NOM_VAULT
    ?? (platform() === "win32" ? "M:\\NomWorkspace" : join(homedir(), "NomWorkspace"));

/**
 * Folder `NomManageplannings`, which holds the three folders of my new system and my old system beside them.
 */
export const manageRoot: string = join(vault, "NomManageplannings");

/**
 * Folder of plan and log of my new system, `NomSystemcalendar`: one folder per year and one per month,
 * like `2026/2026_10/`, holding the log `2026_10_Log.ics` and the plan `2026_10_Plan.ics`; in `Skilling/` a plan
 * per module, like `Skilling/IN2028_BusinessAnalyticsMachineLearning_Plan.ics`, read as plan too; at its top
 * `Birthdays.ics` and `Holidays.ics`.
 */
export const calendarRoot: string = join(manageRoot, "NomSystemcalendar");

/**
 * Folder of my daily notes, `NomSystemdiary`: one note per day in a folder per year and one per month,
 * like `2026/2026_10/2026_10_13.md`, see `note.ts`.
 */
export const diaryRoot: string = join(manageRoot, "NomSystemdiary");

/**
 * Folder of my data, `NomSystemdata`: my foods, `Foods.md`, and my places, `Places.md`.
 */
export const dataRoot: string = join(manageRoot, "NomSystemdata");

/**
 * The three folders of my new system, the only ones the reader writes into, but for the drafts of the editor.
 */
export const systemRoots: string[] = [calendarRoot, diaryRoot, dataRoot];

/**
 * Name of the folder of my old system beside them in `NomManageplannings`, `NomSystemprevious`,
 * which the reader never reads, not even to list it.
 */
export const previousName: string = "NomSystemprevious";

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
 * Folder of my modules in `NomWorkspace`, `NomSkillingmodules`, one folder per module.
 */
export const modulesFolder: string = "NomSkillingmodules";

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
    modules: join(vault, modulesFolder),
};

/**
 * Places the editor writes, the only ones besides the three folders of the new system, see {@link systemRoots}:
 * the drafts, never my modules.
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
 * Skills of the semester, 2026W, each by its folder from `NomWorkspace`, written with `/`: my modules
 * in `NomSkillingmodules`, the pilot first, then my projects,
 * like `NomProgramprojects/AsiaWok_Bonierungssystem_2026/WokFlow`.
 * The Skill picker offers them first, in this order, a module by its code, the part of its folder name before `_`,
 * like `IN2028`, a project by its folder name, like `WokFlow`; the menu of the notes view and the skill area show
 * the modules, see {@link activeModules}, since a project has no chapters and no tasks.
 * Each skill entry links the folder of its skill by this path, see `documents.ts`.
 * A link in a note still opens a note of any module. Changed on request, when the semester's skills change.
 */
export const activeSkills: string[] = [
    "NomSkillingmodules/IN2028_BusinessAnalyticsMachineLearning",
    "NomSkillingmodules/WI1059_FinancialAccounting",
    "NomSkillingmodules/WI0219_InvestitionFinanzmanagement",
    "NomSkillingmodules/WI1057_CostAccounting",
    "NomSkillingmodules/MGT1373_AppliedEconometrics",
    "NomSkillingmodules/IN0004_EinfuehrungRechnerarchitektur",
    "NomSkillingmodules/MGT1372_EntrepreneurialBusiness",
    "NomProgramprojects/AsiaWok_Bonierungssystem_2026/WokFlow",
    "NomSystemdashboard",
];

/**
 * Tells whether a skill of {@link activeSkills} is a module, a folder in `NomSkillingmodules`, else a project.
 *
 * @param skill - Folder from `NomWorkspace`, like `NomSkillingmodules/IN2028_BusinessAnalyticsMachineLearning`
 * @returns Whether it is a module
 */
export function moduleIs(skill: string): boolean {
    return skill.startsWith(`${modulesFolder}/`);
}

/**
 * Gives the name of a skill of the semester by its folder: a module its code, the part of its folder name before `_`,
 * a project its folder name, the last part of its path.
 * - `folder`: Name of the folder, the last part of its path.
 *
 * @param skill - Folder from `NomWorkspace`, like `NomSkillingmodules/IN2028_BusinessAnalyticsMachineLearning`
 *   or `NomProgramprojects/AsiaWok_Bonierungssystem_2026/WokFlow`
 * @returns Name, like `IN2028` or `WokFlow`
 */
export function skillNameOf(skill: string): string {
    const folder: string = skill.split("/").at(-1) ?? skill;
    return moduleIs(skill) ? folder.split("_")[0] : folder;
}

/**
 * Finds a project of the semester by its name, see {@link skillNameOf}.
 *
 * @param name - Name of the project, like `WokFlow`
 * @returns Its folder from `NomWorkspace`, like `NomProgramprojects/AsiaWok_Bonierungssystem_2026/WokFlow`,
 *   `undefined` when no project of the semester has the name
 */
export function projectOf(name: string): string | undefined {
    return activeSkills.find((skill: string): boolean => !moduleIs(skill) && skillNameOf(skill) === name);
}

/**
 * Modules of the semester among the {@link activeSkills}, by their folders in `NomSkillingmodules`, in their order,
 * like `IN2028_BusinessAnalyticsMachineLearning`: the menu of the notes view and the skill area show only these.
 */
export const activeModules: string[] = activeSkills
    .filter(moduleIs)
    .map((skill: string): string => skill.slice(modulesFolder.length + 1));

/**
 * Sources of the day area, all in the new system; the daily notes lie in {@link diaryRoot}, see `note.ts`.
 *
 * - `plan`: Calendar of what I intend, the plan files of the months, read as the boxes of each day, see `boxes.ts`.
 * - `log`: Calendar of what really happened, by category, the log files of the months, my one calendar.
 * - `system`: Calendars of birthdays and holidays in {@link calendarRoot}, shown above the boxes of their day,
 *   each a whole day: `Birthdays.ics`, which I write by hand, a birthday a yearly series with `CATEGORIES:Birthday`
 *   and the name as `SUMMARY`, like `Birthday: KarlbauerFlorian`, and beside it `Holidays.ics`, a holiday
 *   with `CATEGORIES:Holiday`, like `Holiday: Ostermontag (AT, DE)`; my gift idea for one is its `DESCRIPTION`,
 *   which the reader writes, see `gifts.ts`; none of a file while it is missing.
 * - `places`: My places, `Places.md` in {@link dataRoot}, beside `Foods.md`, one Markdown table
 *   with one row per place, its name and its address, which the reader writes as I add places, see `places.ts`.
 */
export type DaySources = {
    plan: CalendarSource[];
    log: CalendarSource[];
    system: CalendarSource[];
    places: string;
};

/**
 * {@link DaySources} as they lie in the vault.
 */
export const day: DaySources = {
    plan: [{ folder: calendarRoot, ending: planEnding }],
    log: [{ folder: calendarRoot, ending: logEnding }],
    system: [{ folder: calendarRoot, ending: "Birthdays.ics" }, { folder: calendarRoot, ending: "Holidays.ics" }],
    places: join(dataRoot, "Places.md"),
};

/**
 * Log of the skill area: the log of the new system, where each block of learning is an entry of the category `Skill`,
 * holding the attempts made in it. The tasks lie in the chapter notes of the {@link activeModules}.
 */
export const skillLog: CalendarSource[] = [{ folder: calendarRoot, ending: logEnding }];

/**
 * Log of the trackers of the day, sleep and water: the log of the new system, where they are entries
 * of the categories `Sleep` and `Drink`.
 */
export const trackerLog: CalendarSource[] = [{ folder: calendarRoot, ending: logEnding }];

/**
 * Sources of the food area.
 *
 * - `foods`: My foods, `Foods.md` in {@link dataRoot}, one Markdown table with one row per food,
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
    foods: join(dataRoot, "Foods.md"),
    log: [{ folder: calendarRoot, ending: logEnding }],
    search: "https://search.openfoodfacts.org/search",
    product: "https://world.openfoodfacts.org/api/v2/product/",
};

/**
 * Builds the path of a month file of the new system: the log or the plan of the month of a day.
 *
 * @param date - Day like `2026-10-13`
 * @param ending - End of the name, {@link logEnding} or {@link planEnding}
 * @returns Path like `2026/2026_10/2026_10_Plan.ics` in {@link calendarRoot}
 */
export function monthFileOf(date: string, ending: string): string {
    const [year, month]: string[] = date.split("-");
    return join(calendarRoot, year, `${year}_${month}`, `${year}_${month}${ending}`);
}

/**
 * Tells whether the reader may write a file: only inside one of the three folders of the new system,
 * see {@link systemRoots}.
 * - {@link resolve}: Makes a path absolute and takes out `..`, so no path leaves the folders.
 *
 * @param file - Path of a file to write
 * @returns Whether the file lies inside one of the folders of the new system
 */
export function writeAllowed(file: string): boolean {
    return systemRoots.some((root: string): boolean => resolve(file).startsWith(`${resolve(root)}${sep}`));
}
