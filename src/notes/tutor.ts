/**
 * ## Tutor
 *
 * The text for my tutor, the Claude app on my second screen while I learn: the quiet copy icon of a task
 * in the notes view puts it on the clipboard, see `../skill/task.ts`, and I paste it there.
 * Plain text, its parts apart by an empty line:
 * - the instruction from my rules, CLAUDE.md §4 rule 5, by my last attempt at the task:
 *   before I failed it, never a solution before I say "tried", hints in steps, grading against the official
 *   solution with one sentence on the error; after a wrong, stuck or guided attempt, start from my steps,
 *   name my first wrong step, the right one and its rule, let me redo it alone, then one similar task,
 *   since feedback that explains helps far more than right or wrong alone (van der Kleij 2015) and a similar task
 *   at the end helped (Gallegos 2026);
 * - what my effort on my last attempt asks for next (van Gog 2020): after a right one with low effort a harder
 *   variant, with high effort a similar task; after a failed one with high effort a solved task of the type first;
 * - the task: its heading and its text, without its source line;
 * - after a failed attempt, its official solution, for the tutor only, since grading without it goes wrong far more
 *   often (Liu 2026), and an empty line `My steps:` for mine; before, never its solution;
 * - my earlier attempts at it, one line each, the oldest first, written as its history writes them;
 * - the theory blocks of its note: every block under a heading `##` that is no task, as written.
 * A theory block has its own copy icon, see {@link theoryTextOf}: its text with the instruction to answer
 * my questions at once, then to have me explain it back from memory, the note closed, and to correct what is missing.
 * A link shows its text, like `Ice cream kiosks` of `[[#Task. Kiosk Sales Standard Error|Ice cream kiosks]]`,
 * and an embedded figure its name, since the tutor cannot follow them; the spacer `⠀` of my notes becomes
 * an empty line, and empty lines in a row one; formulas stay TeX, which the tutor reads.
 *
 * - `../skill/attempts.ts`: Writes days out.
 * - `../skill/task.ts`: Writes the result of an attempt.
 */

import { dayTextOf } from "../skill/attempts.ts";
import { resultTextOf } from "../skill/task.ts";

import type { Attempt, SkillTask } from "../skill/attempts.ts";


/**
 * A block of a note: a heading `##` with its lines up to the next one.
 *
 * - `heading`: Its heading as written, like `Definition. Sample Mean Estimator`.
 * - `lines`: Its lines, the heading first.
 */
type Block = {
    heading: string;
    lines: string[];
};

/**
 * The two lines of instruction for my tutor before I failed the task, from my rules (CLAUDE.md §4, rule 5).
 */
const instruction: string[] = [
    "You are my tutor for the task below. Never give me a solution before I say \"tried\"; "
    + "until then, hints in steps, one at a time.",
    "After \"tried\", grade my answer against the official solution and name my error in one sentence.",
];

/**
 * The lines of instruction for my tutor after a wrong, stuck or guided attempt.
 */
const repair: string[] = [
    "You are my tutor for the task below. I tried it and did not get it; my steps follow under \"My steps\".",
    "Start from my steps: name my first wrong step, the right step and the rule behind it, then let me redo it alone.",
    "The official solution is for you only: never show it to me whole.",
    "When I have it, give me one similar task to solve cold.",
];

/**
 * The lines of instruction for my tutor about a theory block.
 */
const theoryInstruction: string[] = [
    "You are my tutor for the theory below. Answer my questions about it at once.",
    "Then I explain it back to you from memory, with the note closed; correct what is missing or wrong.",
];

/**
 * Heading of a block, `## …`, with its text.
 */
const blockHeading: RegExp = /^##[ \t]+(.+?)[ \t]*$/;

/**
 * Heading of a solution, like `#### Solution` or `#### Solution (own, unchecked)`, as the notes view folds it.
 */
const solutionHeading: RegExp = /^#{3,6}[ \t]+Solution\b/;

/**
 * Source line of a task, `> Original: …` or `> Generated: …`.
 */
const sourceLine: RegExp = /^>[ \t]*(?:Original|Generated):/;

/**
 * Wiki link or embed, like `[[#Task. Kiosk Sales Standard Error|Ice cream kiosks]]`
 * or `![[01_14_IncomeResiduals.svg]]`:
 * `!` for an embed, its target, and its text after `|`, or after the `\|` written in tables.
 */
const wikiLink: RegExp = /(!?)\[\[([^\]|\\]*)(?:\\?\|([^\]]*))?\]\]/g;

/**
 * Line that holds nothing to read: only spaces, tabs and the spacer `⠀` of my notes.
 */
const emptyLine: RegExp = /^[\s⠀]*$/;


/**
 * Cuts a note into its blocks, each heading `##` with its lines up to the next one;
 * lines before the first heading stay out.
 * - `blocks`: Blocks so far.
 *
 * @param text - Markdown text of the note
 * @returns Blocks in order
 */
function blocksOf(text: string): Block[] {
    const blocks: Block[] = [];
    text.split(/\r?\n/).forEach((line: string): void => {
        const heading: RegExpExecArray | null = blockHeading.exec(line);
        if (heading !== null)
            blocks.push({ heading: heading[1], lines: [line] });
        else
            blocks.at(-1)?.lines.push(line);
    });
    return blocks;
}

/**
 * Writes a line of a note as plain text for the tutor: a link as its text, or as its target when it has none,
 * an embed as the name of its figure, a line with nothing to read as an empty line.
 *
 * @param line - Line as written, like `[[#Task. Kiosk Sales Standard Error|Ice cream kiosks]]: Campus kiosk`
 * @returns Line like `Ice cream kiosks: Campus kiosk`
 */
function plainOf(line: string): string {
    if (emptyLine.test(line))
        return "";
    return line.replace(wikiLink, (_: string, embed: string, target: string, text: string | undefined): string => {
        if (embed === "!")
            return `[figure: ${target}]`;
        if (text !== undefined)
            return text;
        return target.replace(/^#/, "");
    });
}

/**
 * Writes lines of a note as one part of the text: each as plain text, see {@link plainOf}, empty lines in a row
 * as one, and without empty lines at its start and its end.
 *
 * @param lines - Lines as written
 * @returns Part of the text, its lines parted by line breaks
 */
function partOf(lines: string[]): string {
    return lines.map(plainOf).join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

/**
 * Writes the task of its block: its heading, then its text, without its source line and without its solution,
 * which starts at the heading of the solution.
 * - `end`: Line of the heading of its solution, the end of the block when it has none.
 * - `text`: Lines between the heading and the solution, without the source line.
 *
 * @param block - Block of the task
 * @returns Part of the text with the task
 */
function taskPartOf(block: Block): string {
    const end: number = block.lines.findIndex((line: string): boolean => solutionHeading.test(line));
    const text: string[] = block.lines.slice(1, end === -1 ? undefined : end)
        .filter((line: string): boolean => !sourceLine.test(line));
    return `${block.lines[0]}\n${partOf(text)}`;
}

/**
 * Writes the solution of a task from its block: the lines from the heading of its solution to the end of the block.
 * - `start`: Line of the heading of its solution, -1 for none.
 *
 * @param block - Block of the task
 * @returns Part of the text with the solution, empty for a task without one
 */
function solutionPartOf(block: Block): string {
    const start: number = block.lines.findIndex((line: string): boolean => solutionHeading.test(line));
    return start === -1 ? "" : partOf(block.lines.slice(start + 1));
}

/**
 * Writes what my effort on my last attempt asks of the tutor next, see the top of this file.
 *
 * @param last - My last attempt at the task that is no skip, `undefined` for none
 * @returns Line of instruction, empty when my effort asks nothing
 */
function effortLineOf(last: Attempt | undefined): string {
    if (last?.result === "right" && last.effort === "low")
        return "My last attempt was right with low effort: when I am done, give me a harder variant of it.";
    if (last?.result === "right" && last.effort === "high")
        return "My last attempt was right with high effort: when I am done, give me a similar task.";
    if (last !== undefined && last.result !== "right" && last.effort === "high")
        return "My last attempt failed with high effort: first walk me through a solved task of the same type, "
            + "asking me to predict each next step and say why.";
    return "";
}

/**
 * Writes the text for my tutor about a task, see the top of this file.
 * - `blocks`: Blocks of the note.
 * - `block`: Block of the task, `undefined` when the note no longer holds it.
 * - `theory`: Blocks of the note that are no task.
 * - `attempts`: My earlier attempts, one line each, like `- 17.10.2026, 14:05: b) stuck at step 3 · high effort`.
 * - `last`: My last attempt that is no skip.
 * - `failed`: Whether it was wrong, stuck or guided, so the tutor gets the solution and my steps.
 *
 * @param task - Task with my attempts at it
 * @param note - Markdown text of its note
 * @returns Plain text to paste into the Claude app
 */
export function tutorTextOf(task: SkillTask, note: string): string {
    const blocks: Block[] = blocksOf(note);
    const block: Block | undefined = blocks.find((candidate: Block): boolean => candidate.heading === task.heading);
    const theory: Block[] = blocks.filter((candidate: Block): boolean => !candidate.heading.startsWith("Task."));
    const attempts: string[] = task.attempts.map((attempt: Attempt): string => {
        let when: string = dayTextOf(attempt.day, false);
        if (attempt.time !== "")
            when += `, ${attempt.time}`;
        return `- ${when}: ${resultTextOf(attempt)}`;
    });
    const last: Attempt | undefined = task.attempts.findLast((attempt: Attempt): boolean => attempt.result !== "skipped");
    const failed: boolean = last !== undefined && last.result !== "right";
    return [
        [...(failed ? repair : instruction), effortLineOf(last)].filter((line: string): boolean => line !== "").join("\n"),
        block === undefined ? `## ${task.heading}` : taskPartOf(block),
        ...(failed && block !== undefined ? [`Official solution, for you only:\n${solutionPartOf(block)}`, "My steps:\n"] : []),
        attempts.length === 0 ? "My earlier attempts: none" : ["My earlier attempts:", ...attempts].join("\n"),
        theory.length === 0 ? "Theory of its note: none"
            : ["Theory of its note:", ...theory.map((part: Block): string => partOf(part.lines))].join("\n\n"),
    ].join("\n\n");
}

/**
 * Writes the text for my tutor about a theory block of a note: the instruction, see {@link theoryInstruction},
 * then the block as written, as plain text.
 * - `block`: The block, `undefined` when the note no longer holds it.
 *
 * @param heading - Heading of the block as written, like `Definition. Standard Error of the Mean`
 * @param note - Markdown text of its note
 * @returns Plain text to paste into the Claude app
 */
export function theoryTextOf(heading: string, note: string): string {
    const block: Block | undefined = blocksOf(note).find((candidate: Block): boolean => candidate.heading === heading);
    return [theoryInstruction.join("\n"), block === undefined ? `## ${heading}` : partOf(block.lines)].join("\n\n");
}
