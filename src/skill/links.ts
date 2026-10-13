/**
 * ## Links
 *
 * Shows what a skill entry is and its links, in the entry by category and in the timer of the session running now:
 * what it is as written, its `SUMMARY`, like `IN2028_BusinessAnalyticsMachineLearning (VO)`, which for a module
 * opens the module in the notes view in a new tab, its folder being the `ALTREP` of the `SUMMARY`, see
 * `reader/documents.ts`, and for a project, which the notes view has not, opens nothing, like `WokFlow`;
 * then each file it links, by its name, like `04_LogisticPoissonRegression.pdf`, which a click opens in a new tab
 * in the browser's own viewer, sent read only by the reader. A folder in an `ATTACH` of an older entry shows by its
 * name alone, like `IN2028_BusinessAnalyticsMachineLearning`, and opens nothing.
 *
 * - `./attempts.ts`: Names a link as the reader sends it.
 */

import type { Link } from "./attempts.ts";


/**
 * Folder of my modules in `NomWorkspace`, the first part of the folder of a module.
 */
const modulesFolder: string = "NomSkillingmodules";


/**
 * Gives the name of a link, the last part of its path.
 *
 * @param link - Link, like `NomSkillingmodules/IN2028_…/VO_…/04_LogisticPoissonRegression.pdf`
 * @returns Name, like `04_LogisticPoissonRegression.pdf`
 */
export function linkNameOf(link: Link): string {
    return link.path.split("/").at(-1) ?? link.path;
}

/**
 * Makes a link of a skill entry as the page shows it, see the top of this file: a file a link that opens it
 * in a new tab, a folder its name alone; both of the class `skill-link`, the full path as tooltip.
 * - `element`: The link or the name.
 *
 * @param link - Link of a skill entry
 * @returns The link of a file, or the name of a folder
 */
export function linkElementOf(link: Link): HTMLElement {
    const element: HTMLAnchorElement | HTMLSpanElement = document.createElement(link.fingerprint === "" ? "span" : "a");
    element.className = "skill-link";
    element.textContent = linkNameOf(link);
    element.title = link.path;
    if (element instanceof HTMLAnchorElement) {
        element.href = `/api/skill/file?path=${encodeURIComponent(link.path)}`;
        element.target = "_blank";
        element.rel = "noopener";
    }
    return element;
}

/**
 * Makes what a skill entry is as the page shows it, see the top of this file: for a module a link that opens
 * the module in the notes view in a new tab, like `/notes?module=IN2028_BusinessAnalyticsMachineLearning`,
 * else its text alone; both of the class `skill-link`, the folder as tooltip.
 * - `name`: Name of the folder of a module, empty for any other skill.
 * - `element`: The link or the text.
 *
 * @param title - What it is as written, its `SUMMARY`, like `IN2028_BusinessAnalyticsMachineLearning (VO)`
 * @param folder - Folder of its skill from `NomWorkspace`, the `ALTREP` of its `SUMMARY`, empty for none
 * @returns The link or the text
 */
export function skillTitleElementOf(title: string, folder: string): HTMLElement {
    const name: string = folder.startsWith(`${modulesFolder}/`) ? folder.slice(modulesFolder.length + 1) : "";
    const element: HTMLAnchorElement | HTMLSpanElement = document.createElement(name === "" ? "span" : "a");
    element.className = "skill-link";
    element.textContent = title;
    element.title = folder;
    if (element instanceof HTMLAnchorElement) {
        element.href = `/notes?module=${encodeURIComponent(name)}`;
        element.target = "_blank";
        element.rel = "noopener";
    }
    return element;
}
