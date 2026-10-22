/**
 * ## Links
 *
 * Names a link of a skill entry, a document it used, by its name, the last part of its path,
 * like `04_LogisticPoissonRegression.pdf`, as a box lists its documents, see `../day/boxes.ts`; and names the folder
 * of my modules, whose modules open in the scripts view, see `../day/skill.ts`.
 *
 * - `./attempts.ts`: Names a link as the reader sends it.
 */

import type { Link } from "./attempts.ts";


/**
 * Folder of my modules in `NomWorkspace`, the first part of the folder of a module.
 */
export const modulesFolder: string = "NomSkillingmodules";


/**
 * Gives the name of a link, the last part of its path.
 *
 * @param link - Link, like `NomSkillingmodules/IN2028_…/VO_…/04_LogisticPoissonRegression.pdf`
 * @returns Name, like `04_LogisticPoissonRegression.pdf`
 */
export function linkNameOf(link: Link): string {
    return link.path.split("/").at(-1) ?? link.path;
}
