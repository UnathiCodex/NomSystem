/**
 * ## Links
 *
 * Names a file or folder in words, as the dashboard shows every name, while the name on disk keeps its CamelCase
 * and underscores: a chapter, a section, a module, as the tree, the overview, a box and Learn show them; names
 * a link of a skill entry, a document it used, by the last part of its path in words, like
 * `04. Logistic Poisson Regression.pdf`, as a box lists its documents, see `../day/boxes.ts`; and names the folder
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
 * Gives the name of a file or folder in words: the numbers in front, two digits each, joined by dots with a dot
 * after them, then the words parted by spaces, without `_` and without `.md`, like `01. Regression Analysis`
 * of `01_RegressionAnalysis`, `01.01. Sample Mean Estimator` of `01_01_SampleMeanEstimator.md` and
 * `IN2028 Business Analytics Machine Learning` of `IN2028_BusinessAnalyticsMachineLearning`, as the reader names
 * a skill, see `skillLabelOf` in `reader/documents.ts`. A word starts at a capital after a small letter, after a digit
 * when a small letter follows the capital, and at the last capital of a run before a small letter, so a code or
 * a semester stays whole, like `IN2028` and `TUM 2026W`, and `ITSecurity` reads `IT Security`; a name of my system
 * stays one word, like `NomSkillingmodules`.
 * - `numbers`, `rest`: The numbers in front with their underscores, like `01_01_`, and the name after them.
 * - `number`: The numbers as shown, like `01.01. `, empty for none.
 *
 * @param name - Name on disk, like `01_01_SampleMeanEstimator.md`
 * @returns Name in words, like `01.01. Sample Mean Estimator`
 */
export function airyOf(name: string): string {
    const [, numbers, rest]: string[] = /^((?:\d{2}_)*)(.*)$/s.exec(name.replace(/\.md$/i, "")) as RegExpExecArray;
    const number: string = numbers === "" ? "" : `${numbers.slice(0, -1).replaceAll("_", ".")}. `;
    return number + rest.split("_").map((part: string): string => part.startsWith("Nom") ? part
        : part.replace(/(\p{Ll})(?=\p{Lu})/gu, "$1 ").replace(/(\d)(?=\p{Lu}\p{Ll})/gu, "$1 ")
            .replace(/(\p{Lu})(?=\p{Lu}\p{Ll})/gu, "$1 ")).join(" ");
}

/**
 * Gives a path in words, each of its parts by {@link airyOf}, apart by `/`.
 *
 * @param path - Path, like `NomSkillingmodules/IN2028_BusinessAnalyticsMachineLearning`
 * @returns Path in words, like `NomSkillingmodules/IN2028 Business Analytics Machine Learning`
 */
export function airyPathOf(path: string): string {
    return path.split("/").map(airyOf).join("/");
}

/**
 * Gives the name of a link in words, the last part of its path, see {@link airyOf}.
 *
 * @param link - Link, like `NomSkillingmodules/IN2028_…/VO_…/04_LogisticPoissonRegression.pdf`
 * @returns Name, like `04. Logistic Poisson Regression.pdf`
 */
export function linkNameOf(link: Link): string {
    return airyOf(link.path.split("/").at(-1) ?? link.path);
}
