/**
 * ## Router
 *
 * Opens one area of the life system beside the areas named in `index.html`, each shown by its icon there,
 * by the address:
 * the scripts, my notes of my modules in the editor, always writing, at `/scripts`, a due task of the skill area
 * as a card at `/scripts?…&card=1`, my new system at `/plannings`, the skill area at `/skill`, the food area at `/food`,
 * the editor of the files of my new system at `/edit`, the day everywhere else; older addresses of the scripts,
 * `/notes` and a draft at `/edit?path=…`, open them too and become `/scripts`.
 * The editor shows a file of my new system under the link of `/plannings`, which opens the editor without a file,
 * and a note of my modules under that of `/scripts`, see `editor/editor.ts`.
 * Loads the code of the shown area only, with `import()`, so the day loads no MathJax and the scripts no calendar,
 * and puts the area's HTML into the page only once its code and its look are loaded, so it never shows unstyled;
 * the look of the whole page, `base.css` and `variants.css`, comes linked in `index.html` before any script.
 * A phone, a screen as narrow as the phone layout of the stylesheets, which {@link matchMedia} tells,
 * is only for the day, its plan and its log, as simple as can be, nothing for learning and no food for now:
 * it opens the day everywhere, without its daily note, so it loads no Markdown renderer;
 * every device tells the reader what it shows of the page, see {@link deviceReport}.
 * `base.css` hides the areas, so the whole screen stays free.
 *
 * - `vite/client`: Vite types for the type checker only, for `?raw` and stylesheets.
 * - `./day/day.html?raw`, `./notes/notes.html?raw`, `./skill/skill.html?raw`, `./food/food.html?raw`,
 *   `./editor/editor.html?raw`: Html of day, scripts, skill, food and editor as text,
 *   packed into the built code by Vite.
 * - `./day/day.ts`: Shows the log of a day, my one calendar, with the boxes of its plan beside it.
 * - `./notes/notes.ts`: Shows a due task as a card, its text alone, rendered like Obsidian.
 * - `./skill/skill.ts`: Shows my tasks, due ones first, and records my attempts.
 * - `./food/food.ts`: Shows what I ate on a day with its totals, and my foods.
 * - `./editor/editor.ts`: Edits a note of my modules or a Markdown file of my new system as its text, its Markdown
 *   shown as in Obsidian's live preview, saved exactly as edited, with the tree of its root on the left.
 * - {@link History#replaceState}: Turns an older address of the scripts into `/scripts`, without loading
 *   the page again.
 */

/// <reference types="vite/client" />
import dayHtml from "./day/day.html?raw";
import notesHtml from "./notes/notes.html?raw";
import skillHtml from "./skill/skill.html?raw";
import foodHtml from "./food/food.html?raw";
import editorHtml from "./editor/editor.html?raw";


/**
 * Tells the reader what this device shows of the page, its size and that of its screen in CSS pixels, its scale
 * and whether it runs as the installed app, so the dashboard can be shaped for each of my devices,
 * see `reader/devices.ts`.
 * - {@link Navigator#sendBeacon}: Sends a small report to the reader without waiting for its answer.
 */
function deviceReport(): void {
    navigator.sendBeacon("/api/devices", JSON.stringify({
        width: innerWidth, height: innerHeight, scale: devicePixelRatio, screenWidth: screen.width,
        screenHeight: screen.height, app: matchMedia("(display-mode: standalone)").matches, agent: navigator.userAgent,
    }));
}

/**
 * Waiting report of the size of the page after the window changed its size, so a window being dragged
 * reports once, a second after it rests.
 */
let deviceWait: number = 0;

const phone: boolean = matchMedia("(max-width: 900px)").matches;
const address: URLSearchParams = new URLSearchParams(location.search);
if (location.pathname === "/notes" || (location.pathname === "/edit" && address.has("path")))
    history.replaceState(null, "", `/scripts${location.search}${location.hash}`);
const areas: string[] = phone ? [] : ["/scripts", "/plannings", "/skill", "/food", "/edit"];
const area: string = areas.includes(location.pathname) ? location.pathname : "/";
const marked: string = area === "/edit" ? "/plannings" : area;
document.querySelector(`.areas a[href="${marked}"]`)?.setAttribute("aria-current", "page");
deviceReport();
addEventListener("resize", (): void => {
    clearTimeout(deviceWait);
    deviceWait = window.setTimeout(deviceReport, 1000);
});

if (area === "/scripts" && address.has("card")) {
    const notes: { notesStart: () => Promise<void> } = await import("./notes/notes.ts");
    document.body.insertAdjacentHTML("beforeend", notesHtml);
    await notes.notesStart();
} else if (area === "/skill") {
    const skill: { skillStart: () => Promise<void> } = await import("./skill/skill.ts");
    document.body.insertAdjacentHTML("beforeend", skillHtml);
    await skill.skillStart();
} else if (area === "/food") {
    const food: { foodStart: () => void } = await import("./food/food.ts");
    document.body.insertAdjacentHTML("beforeend", foodHtml);
    food.foodStart();
} else if (area === "/scripts" || area === "/edit" || area === "/plannings") {
    const editor: { editorStart: () => Promise<void> } = await import("./editor/editor.ts");
    document.body.insertAdjacentHTML("beforeend", editorHtml);
    await editor.editorStart();
} else {
    const day: { dayStart: (note: boolean) => void } = await import("./day/day.ts");
    document.body.insertAdjacentHTML("beforeend", dayHtml);
    day.dayStart(!phone);
}
