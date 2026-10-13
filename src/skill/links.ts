/**
 * ## Links
 *
 * Shows the links of a skill entry by their names, in the entry by category and in the timer of the session running now:
 * a file by its name, like `04_LogisticPoissonRegression.pdf`, which a click opens in a new tab in the browser's
 * own viewer, sent read only by the reader, see `reader/documents.ts`; a folder by its name alone,
 * like `IN2028_BusinessAnalyticsMachineLearning`, which opens nothing.
 *
 * - `./attempts.ts`: Names a link as the reader sends it.
 */

import type { Link } from "./attempts.ts";


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
