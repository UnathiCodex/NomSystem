/**
 * ## Sources
 *
 * Names every folder and file the reader reads, and every address on the web it asks, grouped by area.
 * My new system is three folders in `NomManageplannings`, see {@link systemRoots}: `NomManagecalendar` for plan
 * and log, {@link calendarRoot}, `NomFrequencediary` for the daily notes, {@link diaryRoot}, and `NomMetainformations`
 * for my foods, places, workouts, videos and weight, {@link dataRoot}; my old system, `NomSystemprevious`, lies beside
 * them and is never read.
 * The reader reads only the new system, my modules, see {@link notes}, and the files the skill entries link,
 * in my modules and my projects, see {@link activeSkills} and `documents.ts`, and nothing that is not listed here;
 * every file at its own place, none from a copy elsewhere, like a draft in `.claude`.
 * It writes only into the three folders of the new system, see {@link writeAllowed}, and the editor into the notes
 * of my modules and the file of my corrections, see {@link editor}; the editor shows the tree
 * of `NomManageplannings` but for my old system, and opens only the files of the three folders,
 * see {@link systemFiles}. A file or folder of the new system that is missing, like `Birthdays.ics` or the log
 * of a year without entries, counts as empty.
 *
 * - `node:os`: Gives the home folder.
 * - `node:path`: Builds file paths for the operating system.
 */

import { homedir } from "node:os";
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
 * Environment variable `NOM_VAULT` when set, like `/tmp/nomvault` for a sample vault, else `~/NomWorkspace`.
 */
export const vault: string = process.env.NOM_VAULT ?? join(homedir(), "NomWorkspace");

/**
 * Folder `NomManageplannings`, which holds the three folders of my new system and my old system beside them.
 */
export const manageRoot: string = join(vault, "NomManageplannings");

/**
 * Folder of plan and log of my new system, `NomManagecalendar`: three folders of the same depth, no month folders,
 * {@link livingRoot} for the plan and the log of every category but `Skill`, {@link skillingRoot} for those
 * of my skills and {@link metaRoot} for my birthdays and the holidays. Every view reads all their plans and logs,
 * the Food view its meals from the logs as the Day view its entries, see {@link day}; and still the month files
 * of the layout before, like `2026/2026_10/2026_10_Log.ics`, until their entries are moved: no new entry or box
 * goes into them, and one I change in its dialog, drag or push moves into its file of the new layout.
 */
export const calendarRoot: string = join(manageRoot, "NomManagecalendar");

/**
 * Folder `Living/` in {@link calendarRoot}: one plan and one log per year, like `2026_Plan.ics` and `2026_Log.ics`,
 * for every category but `Skill`, all of them in the same file, an entry by the year of its start in Berlin time,
 * a box by the year of its day, see {@link yearFileOf}.
 */
export const livingRoot: string = join(calendarRoot, "Living");

/**
 * Folder `Skilling/` in {@link calendarRoot}: per skill, a module or a project, a plan and a log, named like
 * the folder of the skill, like `IN2028_BusinessAnalyticsMachineLearning_Plan.ics`
 * and `IN2028_BusinessAnalyticsMachineLearning_Log.ics`: a skill box goes into the plan of its skill, with the lectures
 * imported from TUMonline, a skill entry into its log, see {@link skillFileOf}; a skill box or entry without skill
 * into `Skill_Plan.ics` or `Skill_Log.ics`.
 */
export const skillingRoot: string = join(calendarRoot, "Skilling");

/**
 * Folder `Meta/` in {@link calendarRoot}: `Birthdays.ics` and `Holidays.ics`, see {@link day}.
 */
export const metaRoot: string = join(calendarRoot, "Meta");

/**
 * Folder of my daily notes, `NomFrequencediary`: one note per day in a folder per year and one per month,
 * like `2026/2026_10/2026_10_13.md`, see `note.ts`.
 */
export const diaryRoot: string = join(manageRoot, "NomFrequencediary");

/**
 * Folder of my data, `NomMetainformations`: my foods, `Foods.md`,
 * my meals, `Meals.md`, my places, `Places.md`, the rooms of the university, `Rooms.md`, and my devices, `Devices.md`.
 */
export const dataRoot: string = join(manageRoot, "NomMetainformations");

/**
 * My devices, `Devices.md` in {@link dataRoot}: one Markdown table with one row per device of my tailnet,
 * what it shows of the page, which the reader writes as each of my devices reports it, see `devices.ts`.
 */
export const devicesFile: string = join(dataRoot, "Devices.md");

/**
 * The three folders of my new system, the only ones the reader writes into, but for the notes of my modules
 * and the file of my corrections, which the editor writes, see {@link editor}.
 */
export const systemRoots: string[] = [calendarRoot, diaryRoot, dataRoot];

/**
 * Name of the folder of my old system beside them in `NomManageplannings`, `NomSystemprevious`,
 * which the reader never reads, not even to list it.
 */
export const previousName: string = "NomSystemprevious";

/**
 * End of the names of the files of the log, like `2026_Log.ics` or `IN2028_BusinessAnalyticsMachineLearning_Log.ics`:
 * what happened, as events.
 */
export const logEnding: string = "_Log.ics";

/**
 * End of the names of the files of the plan, like `2026_Plan.ics`
 * or `IN2028_BusinessAnalyticsMachineLearning_Plan.ics`: the boxes of the plan, as to-dos, see `boxes.ts`,
 * beside the lectures imported from TUMonline, as events.
 */
export const planEnding: string = "_Plan.ics";

/**
 * Folder of my modules in `NomWorkspace`, `NomSkillingmodules`, one folder per module.
 */
export const modulesFolder: string = "NomSkillingmodules";

/**
 * Sources of the notes area, read for it; only the editor writes, a note of my modules as I saved it,
 * see {@link editor}; each module in them is a vault of its own, as in Obsidian.
 *
 * - `modules`: My modules, `NomSkillingmodules`, one folder per module with its notes.
 */
export type NotesSources = {
    modules: string;
};

/**
 * {@link NotesSources} as they lie in the vault.
 */
export const notes: NotesSources = {
    modules: join(vault, modulesFolder),
};

/**
 * Places the editor writes, the only ones besides the three folders of the new system, see {@link systemRoots}.
 *
 * - `modules`: My modules, each note right at its place, the modules of {@link notes}.
 * - `corrections`: My corrections, one file, `.claude/modules/corrections.diff` of this project, out of Git,
 *   each save of a note of my modules added at its end as a unified diff, for the AI to turn into rules of my style.
 */
export type EditorSources = {
    modules: string;
    corrections: string;
};

/**
 * {@link EditorSources} as they lie in the vault.
 */
export const editor: EditorSources = {
    modules: notes.modules,
    corrections: join(vault, "NomSystemdashboard", ".claude", "modules", "corrections.diff"),
};

/**
 * Files of my new system the editor shows, see `files.ts`.
 *
 * - `tree`: Folder whose tree the editor shows on the left, `NomManageplannings`, with every folder I add to it later,
 *   but without `previous` and without hidden files and folders, like `.obsidian`.
 * - `previous`: Name of my old system, `NomSystemprevious`, left out of the tree at any depth and never read.
 * - `folders`: The only folders whose files the editor reads and writes, the three folders of my new system,
 *   see {@link systemRoots}: a Markdown file, like `Foods.md`, to edit, an `.ics` file only to read.
 */
export type SystemFilesSources = {
    tree: string;
    previous: string;
    folders: string[];
};

/**
 * {@link SystemFilesSources} as they lie in the vault.
 */
export const systemFiles: SystemFilesSources = {
    tree: manageRoot,
    previous: previousName,
    folders: systemRoots,
};

/**
 * Skills of the semester, 2026W, each by its folder from `NomWorkspace`, written with `/`: my modules
 * in `NomSkillingmodules`, the pilot first, then my projects,
 * like `NomProgramprojects/AsiaWok_Wokflow_2026`, and the time I spend logging, planning and
 * thinking about my day, `NomFrequencediary`, linking the folder of my diary.
 * The Skill picker offers them first, in this order, a module by its code, the part of its folder name before `_`,
 * like `IN2028`, a project by its folder name, like `WokFlow`; the menu of the scripts view and the skill area show
 * the modules, see {@link activeModules}, since a project has no chapters and no tasks.
 * Each skill entry names the folder of its skill in its `SUMMARY` and links it by this path, for a type on into
 * the folder of its material, see `skillLinkOf` in `documents.ts`.
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
    "NomProgramprojects/AsiaWok_Wokflow_2026",
    "NomSystemdashboard",
    "NomManageplannings/NomFrequencediary",
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
 *   or `NomProgramprojects/AsiaWok_Wokflow_2026`
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
 * @returns Its folder from `NomWorkspace`, like `NomProgramprojects/AsiaWok_Wokflow_2026`,
 *   `undefined` when no project of the semester has the name
 */
export function projectOf(name: string): string | undefined {
    return activeSkills.find((skill: string): boolean => !moduleIs(skill) && skillNameOf(skill) === name);
}

/**
 * Modules of the semester among the {@link activeSkills}, by their folders in `NomSkillingmodules`, in their order,
 * like `IN2028_BusinessAnalyticsMachineLearning`: the menu of the scripts view and the skill area show only these.
 */
export const activeModules: string[] = activeSkills
    .filter(moduleIs)
    .map((skill: string): string => skill.slice(modulesFolder.length + 1));

/**
 * Sources of the day area, all in the new system; the daily notes lie in {@link diaryRoot}, see `note.ts`.
 *
 * - `plan`: Calendar of what I intend, every plan file in {@link calendarRoot}, the plans of the years in `Living/`
 *   and those of my skills in `Skilling/`, read as the boxes of each day, see `boxes.ts`.
 * - `log`: Calendar of what really happened, by category, every log file in {@link calendarRoot}, the logs
 *   of the years in `Living/` and those of my skills in `Skilling/`, my one calendar.
 * - `system`: Calendars of birthdays and holidays in {@link metaRoot}, shown above the boxes of their day,
 *   each a whole day: `Birthdays.ics`, which I write by hand, a birthday a yearly series with `CATEGORIES:Birthday`
 *   and the name as `SUMMARY`, like `Birthday: Karlbauer Florian`, and beside it `Holidays.ics`, a holiday
 *   with `CATEGORIES:Holiday`, like `Holiday: Ostermontag (AT, DE)`; my gift idea for one is its `DESCRIPTION`,
 *   which the reader writes, see `gifts.ts`; none of a file while it is missing.
 * - `places`: My places, `Places.md` in {@link dataRoot}, beside `Foods.md`, one Markdown table
 *   with one row per place, its name and its address, which the reader writes as I add places, see `places.ts`.
 * - `rooms`: The rooms of the university, `Rooms.md` beside `Places.md`, one table of the same form,
 *   its name, its address and its link to NavigaTUM, which the reader writes as I add a room, see `places.ts`.
 */
export type DaySources = {
    plan: CalendarSource[];
    log: CalendarSource[];
    system: CalendarSource[];
    places: string;
    rooms: string;
};

/**
 * {@link DaySources} as they lie in the vault.
 */
export const day: DaySources = {
    plan: [{ folder: calendarRoot, ending: planEnding }],
    log: [{ folder: calendarRoot, ending: logEnding }],
    system: [{ folder: metaRoot, ending: "Birthdays.ics" }, { folder: metaRoot, ending: "Holidays.ics" }],
    places: join(dataRoot, "Places.md"),
    rooms: join(dataRoot, "Rooms.md"),
};

/**
 * Log of the skill area: the log of the new system, where each block of learning is an entry of the category `Skill`
 * in the log of its skill in `Skilling/`, holding the attempts made in it. The tasks lie in the chapter notes
 * of the {@link activeModules}.
 */
export const skillLog: CalendarSource[] = [{ folder: calendarRoot, ending: logEnding }];

/**
 * Log of the trackers of the day, sleep and water: the log of the new system, where they are entries
 * of the categories `Sleep` and `Drink` in the log of their year in `Living/`.
 */
export const trackerLog: CalendarSource[] = [{ folder: calendarRoot, ending: logEnding }];

/**
 * Sources of the food area.
 *
 * - `foods`: My foods, `Foods.md` in {@link dataRoot}, one Markdown table with one row per food,
 *   which the reader writes as I add foods, see `food.ts`.
 * - `meals`: My meals, `Meals.md` in {@link dataRoot}, one Markdown table with one row per food of a meal,
 *   which the reader writes as I add meals, see `food.ts`.
 * - `log`: Log of the new system, where each meal is an entry of the category `Food` listing its foods,
 *   in the log of its year in `Living/`.
 * - `search`: Search of Open Food Facts, which finds products by their names.
 * - `product`: Products of Open Food Facts, which gives a product by its barcode put after the address.
 */
export type FoodSources = {
    foods: string;
    meals: string;
    log: CalendarSource[];
    search: string;
    product: string;
};

/**
 * {@link FoodSources} as they lie in the vault and on the web.
 */
export const food: FoodSources = {
    foods: join(dataRoot, "Foods.md"),
    meals: join(dataRoot, "Meals.md"),
    log: [{ folder: calendarRoot, ending: logEnding }],
    search: "https://search.openfoodfacts.org/search",
    product: "https://world.openfoodfacts.org/api/v2/product/",
};

/**
 * Sources of the sport area.
 *
 * - `workouts`: My workouts, `Workouts.md` in {@link dataRoot}, one Markdown table with one row per part of a workout,
 *   an exercise or a video, which the reader writes as I add workouts, see `sport.ts`.
 * - `exercises`: My exercises, `Exercises.md` in {@link dataRoot}, one Markdown table with one row per exercise,
 *   which the reader writes as I add exercises, see `sport.ts`.
 * - `videos`: My videos, `Videos.md` in {@link dataRoot}, one Markdown table with one row per video,
 *   which the reader writes as I add videos, see `sport.ts`.
 * - `weights`: My weight, `Weights.md` in {@link dataRoot}, one Markdown table with one row per day I weighed myself,
 *   which the reader writes as I change my weight in the sport area, see `sport.ts`; each person's own, never
 *   in the code.
 * - `log`: Log of the new system, where each session is an entry of the category `Sport`, in the log of its year
 *   in `Living/`.
 * - `video`: oEmbed of YouTube, which gives the title and the channel of a video by its link put after the address.
 */
export type SportSources = {
    workouts: string;
    exercises: string;
    videos: string;
    weights: string;
    log: CalendarSource[];
    video: string;
};

/**
 * {@link SportSources} as they lie in the vault and on the web.
 */
export const sport: SportSources = {
    workouts: join(dataRoot, "Workouts.md"),
    exercises: join(dataRoot, "Exercises.md"),
    videos: join(dataRoot, "Videos.md"),
    weights: join(dataRoot, "Weights.md"),
    log: [{ folder: calendarRoot, ending: logEnding }],
    video: "https://www.youtube.com/oembed",
};

/**
 * Builds the path of a file of a year in {@link livingRoot}: the log or the plan of the year of a day.
 * - `year`: Year of the day, like `2026`.
 *
 * @param date - Day like `2026-10-13`
 * @param ending - End of the name, {@link logEnding} or {@link planEnding}
 * @returns Path like `Living/2026_Plan.ics` in {@link calendarRoot}
 */
export function yearFileOf(date: string, ending: string): string {
    const year: string = date.split("-")[0];
    return join(livingRoot, `${year}${ending}`);
}

/**
 * Builds the path of a file of a skill in {@link skillingRoot}: its log or its plan.
 *
 * @param name - Name of the folder of the skill, like `IN2028_BusinessAnalyticsMachineLearning` or `WokFlow`,
 *   or `Skill` for a box or an entry without skill
 * @param ending - End of the name, {@link logEnding} or {@link planEnding}
 * @returns Path like `Skilling/IN2028_BusinessAnalyticsMachineLearning_Log.ics` in {@link calendarRoot}
 */
export function skillFileOf(name: string, ending: string): string {
    return join(skillingRoot, `${name}${ending}`);
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
