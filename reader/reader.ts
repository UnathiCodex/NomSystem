/**
 * ## Reader for browser (Node)
 *
 * Start with `npm start`.
 *
 * Reads the vault named in `sources.ts` and waits at `localhost:3000`
 * to answer the browser page with data, and with the page itself.
 *
 * - Node may read from disk but browser cannot.
 * - Node cannot draw a window, only the browser draws.
 *
 * ### Modules
 * - `node:http`: Builds the server that answers the browser page
 * - `node:stream/consumers`: Reads a whole request body into one value
 * - `./day.ts`: Reads the log of a day, adds, changes and removes its entries, adds the meal of a cooking,
 *   logs a box of the plan at its real time, and reads how long entries like a box really lasted
 * - `./boxes.ts`: Reads the plan of days as boxes with their birthdays and holidays, adds, changes and removes boxes,
 *   pushes them to the next day and drops them
 * - `./gifts.ts`: Writes my gift idea for a birthday or holiday into `Gifts.md`
 * - `./note.ts`: Reads the daily notes with their callouts, without the placeholders of the template,
 *   and writes my gratitude and my paragraph about the day into them
 * - `./categories.ts`: Offers the categories with the values of their fields, and the places
 * - `./notes.ts`: Reads the modules of the semester, the notes and files of my modules and the links that lead nowhere,
 *   read only
 * - `./edit.ts`: Writes a draft note as I edited it, and keeps the change as a diff
 * - `./skill.ts`: Reads the tasks of my chapter notes with when each is due and what a module offers a skill entry,
 *   writes skill entries, attempts, efforts and copies for my tutor into the log, and reads the session running now
 * - `./suggestions.ts`: Suggests study sessions as boxes for the plan of a day, never written until I accept one
 * - `./food.ts`: Finds foods, mine first, then on Open Food Facts, adds foods to `Foods.md`, reads the meals of a day
 *   and the foods a dish held the last time
 * - `./trackers.ts`: Reads my sleep against my goals, my glasses of water, my neck sessions and what my meals gave
 *   on a day
 * - `./page.ts`: Gives out the files of the page through Vite
 */

import { createServer } from "node:http";
import { json } from "node:stream/consumers";
import { boxLog, dayEntriesRead, entryAdd, entryDelete, entryEdit, mealAfterCookAdd, realMinutesRead } from "./day.ts";
import { boxAdd, boxDelete, boxDrop, boxEdit, boxesRead, boxPush } from "./boxes.ts";
import { giftWrite } from "./gifts.ts";
import { calloutsRead, calloutWrite, noteShownRead } from "./note.ts";
import { categoriesRead, wayEndRead } from "./categories.ts";
import { brokenLinksRead, fileRead, linkedNoteRead, modulesRead } from "./notes.ts";
import { noteWrite } from "./edit.ts";
import {
    attemptAdd, effortSet, moduleRead, sessionRead, skillEntryAdd, skillEntryEdit, skillingRead, tutorAdd,
} from "./skill.ts";
import { suggestionsRead } from "./suggestions.ts";
import { dishFoodsRead, foodAdd, foodDayRead, foodsFind } from "./food.ts";
import { trackersRead } from "./trackers.ts";
import { pageCreate } from "./page.ts";

import type { IncomingMessage, ServerResponse, Server } from "node:http";
import type { ViteDevServer } from "vite";
import type { BoxLogged, EntryChange, EntryNew } from "./day.ts";
import type { BoxChange, BoxNew } from "./boxes.ts";
import type { Gift } from "./gifts.ts";
import type { CalloutNew } from "./note.ts";
import type { NotesFile } from "./notes.ts";
import type { NoteChange } from "./edit.ts";
import type { AttemptNew, EffortNew, SkillEntryChange, SkillEntryNew } from "./skill.ts";
import type { Food } from "./food.ts";


/**
 * Sends an answer as JSON text.
 * - `Cache-Control`: Tells the browser with `no-store` to not keep the answer,
 *   because the files may change any time.
 *
 * @param response - Answer to the browser
 * @param status - HTTP status code
 * @param body - Data to send
 */
function responseSend(response: ServerResponse, status: number, body: unknown): void {
    response.statusCode = status;
    response.setHeader("Content-Type", "application/json; charset=utf-8");
    response.setHeader("Cache-Control", "no-store");
    response.end(JSON.stringify(body));
}

/**
 * Sends a file of my modules as it lies on the disk.
 * - `Cache-Control`: Tells the browser with `no-store` to not keep the file, because it may change any time.
 * - `Content-Security-Policy`: Tells the browser with `script-src 'none'` to run no script of the file,
 *   like one inside an `.svg` opened on its own.
 *
 * @param response - Answer to the browser
 * @param file - File with its content type
 */
function fileSend(response: ServerResponse, file: NotesFile): void {
    response.setHeader("Content-Type", file.type);
    response.setHeader("Cache-Control", "no-store");
    response.setHeader("Content-Security-Policy", "script-src 'none'");
    response.end(file.content);
}

/**
 * Handles a request by its method and its address.
 * The range of the log comes as FullCalendar sends it, `start` and `end` with offset; the range of the plan as days.
 * - `GET /api/day/log?start=…&end=…`: Sends log entries of the range.
 * - `GET /api/day/boxes?start=…&end=…`: Sends the plan of each day from the first day to the day before the last,
 *   like `start=2026-10-13&end=2026-10-14` for one day: its birthdays and holidays with my gift ideas, and its boxes.
 * - `GET /api/day/note?date=…`: Sends daily note of the date without the parts just as in the template, or `null`.
 * - `GET /api/day/callouts?date=…`: Sends callouts of the daily note of the date as texts.
 * - `GET /api/day/categories?now=…`: Sends the categories with the values of their fields.
 * - `GET /api/day/way-end?before=…`: Sends where the last way before the instant ended.
 * - `GET /api/day/trackers?date=…`: Sends my sleep, my glasses of water, my neck sessions and what my meals gave
 *   on the date, with my goals.
 * - `GET /api/day/suggestions?date=…`: Sends the study sessions suggested for the plan of the date.
 * - `GET /api/day/real?category=…&title=…&module=…&type=…`: Sends the minutes the last entries like a box
 *   really lasted, the latest first.
 * - `POST /api/day/log`: Adds entry of the body and sends its identifier.
 * - `POST /api/day/eaten`: Adds the meal of the entry `Cook` named in the body, right after it, and sends its identifier.
 * - `PATCH /api/day/log`: Changes entry of the body.
 * - `DELETE /api/day/log?id=…`: Removes entry of the identifier.
 * - `POST /api/day/boxes`: Adds box of the body and sends its identifier.
 * - `PATCH /api/day/boxes`: Changes box of the body.
 * - `DELETE /api/day/boxes?id=…`: Removes box of the identifier.
 * - `POST /api/day/logged`: Logs the box named in the body at the start and end in the body,
 *   and sends the identifier of the log entry.
 * - `POST /api/day/pushed`: Pushes the box named in the body to the next day.
 * - `POST /api/day/dropped`: Drops the box named in the body, or takes it back when the body says `dropped: false`.
 * - `POST /api/day/callouts`: Writes the callout of the body into its daily note, my gratitude or my paragraph about the day.
 * - `POST /api/day/gifts`: Writes the gift idea of the body for its birthday or holiday, or takes it out when it is empty.
 * - `GET /api/notes/modules`: Sends the modules of the semester with their chapters and notes.
 * - `GET /api/notes/note?path=…`: Sends a note with the files its links lead to.
 * - `GET /api/notes/file?path=…`: Sends a file of my modules, like an image of a note.
 * - `GET /api/notes/broken`: Sends the links that lead nowhere in the notes of the semester, each with its note.
 * - `PUT /api/edit/note`: Writes draft note of the body, refused with 409 when its file changed since the editor read it.
 * - `GET /api/skill/tasks`: Sends the modules with their tasks, when each is due, every module folder,
 *   and the reasons to skip, the types and the efforts.
 * - `GET /api/skill/module?code=…`: Sends the chapters and documents of the module of the code.
 * - `POST /api/skill/attempt`: Writes attempt of the body into the skill entry of the moment.
 * - `POST /api/skill/effort`: Writes the effort of the body into the last attempt at its task.
 * - `POST /api/skill/tutor`: Writes that I copied the task of the body for my tutor into the skill entry of the moment.
 * - `POST /api/skill/entry`: Writes skill entry of the body into the log.
 * - `PATCH /api/skill/entry`: Changes skill entry of the body, adding its new attempts.
 * - `GET /api/skill/session`: Sends the session running now, or `null`.
 * - `GET /api/food/search?q=…`: Sends my foods for a name or barcode, the most eaten first, then those of Open Food Facts.
 * - `POST /api/food/foods`: Adds food of the body to `Foods.md` and sends it as written.
 * - `GET /api/food/day?date=…`: Sends the meals of the date with what they give.
 * - `GET /api/food/dish?title=…`: Sends the lines `X-FOOD` of the last meal of the dish.
 * - Any other address: Hands request to the page.
 *
 * A request as the page sends it:
 *
 * ```
 * GET /api/day/log?start=2026-07-03T00%3A00%3A00%2B02%3A00&end=2026-07-04T00%3A00%3A00%2B02%3A00 HTTP/1.1
 * Host: localhost:3000
 * ```
 *
 * @param page - Vite, answers requests for the page
 * @param request - Request from the browser
 * @param response - Answer to the browser
 * @throws {unknown} - Error of the chosen answer thrown again
 */
async function requestHandle(page: ViteDevServer, request: IncomingMessage,
                             response: ServerResponse): Promise<void> {

    const url: URL = new URL(request.url ?? "/", "http://localhost");
    const start: string = url.searchParams.get("start") ?? "";
    const end: string = url.searchParams.get("end") ?? "";
    const date: string = url.searchParams.get("date") ?? "";
    const now: string = url.searchParams.get("now") ?? "";
    const path: string = url.searchParams.get("path") ?? "";

    if (request.method === "GET" && url.pathname === "/api/day/log") {
        responseSend(response, 200, dayEntriesRead(start, end));

    } else if (request.method === "GET" && url.pathname === "/api/day/boxes") {
        responseSend(response, 200, boxesRead(start, end));

    } else if (request.method === "GET" && url.pathname === "/api/day/note") {
        responseSend(response, 200, noteShownRead(date));

    } else if (request.method === "GET" && url.pathname === "/api/day/callouts") {
        responseSend(response, 200, calloutsRead(date));

    } else if (request.method === "GET" && url.pathname === "/api/day/categories") {
        responseSend(response, 200, categoriesRead(now));

    } else if (request.method === "GET" && url.pathname === "/api/day/way-end") {
        responseSend(response, 200, wayEndRead(url.searchParams.get("before") ?? ""));

    } else if (request.method === "GET" && url.pathname === "/api/day/trackers") {
        responseSend(response, 200, trackersRead(date));

    } else if (request.method === "GET" && url.pathname === "/api/day/suggestions") {
        responseSend(response, 200, suggestionsRead(date));

    } else if (request.method === "GET" && url.pathname === "/api/day/real") {
        responseSend(response, 200, realMinutesRead(url.searchParams.get("category") ?? "",
            url.searchParams.get("title") ?? "", url.searchParams.get("module") ?? "", url.searchParams.get("type") ?? ""));

    } else if (request.method === "POST" && url.pathname === "/api/day/log") {
        responseSend(response, 200, entryAdd(await json(request) as EntryNew));

    } else if (request.method === "POST" && url.pathname === "/api/day/eaten") {
        responseSend(response, 200, mealAfterCookAdd((await json(request) as { cook: string }).cook));

    } else if (request.method === "PATCH" && url.pathname === "/api/day/log") {
        entryEdit(await json(request) as EntryChange);
        responseSend(response, 200, null);

    } else if (request.method === "DELETE" && url.pathname === "/api/day/log") {
        entryDelete(url.searchParams.get("id") ?? "");
        responseSend(response, 200, null);

    } else if (request.method === "POST" && url.pathname === "/api/day/boxes") {
        responseSend(response, 200, boxAdd(await json(request) as BoxNew));

    } else if (request.method === "PATCH" && url.pathname === "/api/day/boxes") {
        boxEdit(await json(request) as BoxChange);
        responseSend(response, 200, null);

    } else if (request.method === "DELETE" && url.pathname === "/api/day/boxes") {
        boxDelete(url.searchParams.get("id") ?? "");
        responseSend(response, 200, null);

    } else if (request.method === "POST" && url.pathname === "/api/day/logged") {
        responseSend(response, 200, boxLog(await json(request) as BoxLogged));

    } else if (request.method === "POST" && url.pathname === "/api/day/pushed") {
        boxPush((await json(request) as { box: string }).box);
        responseSend(response, 200, null);

    } else if (request.method === "POST" && url.pathname === "/api/day/dropped") {
        const dropped: { box: string; dropped: boolean } = await json(request) as { box: string; dropped: boolean };
        boxDrop(dropped.box, dropped.dropped);
        responseSend(response, 200, null);

    } else if (request.method === "POST" && url.pathname === "/api/day/callouts") {
        calloutWrite(await json(request) as CalloutNew);
        responseSend(response, 200, null);

    } else if (request.method === "POST" && url.pathname === "/api/day/gifts") {
        giftWrite(await json(request) as Gift);
        responseSend(response, 200, null);

    } else if (request.method === "GET" && url.pathname === "/api/notes/modules") {
        responseSend(response, 200, modulesRead());

    } else if (request.method === "GET" && url.pathname === "/api/notes/note") {
        responseSend(response, 200, linkedNoteRead(path));

    } else if (request.method === "GET" && url.pathname === "/api/notes/file") {
        fileSend(response, fileRead(path));

    } else if (request.method === "GET" && url.pathname === "/api/notes/broken") {
        responseSend(response, 200, brokenLinksRead());

    } else if (request.method === "PUT" && url.pathname === "/api/edit/note") {
        responseSend(response, noteWrite(await json(request) as NoteChange) ? 200 : 409, null);

    } else if (request.method === "GET" && url.pathname === "/api/skill/tasks") {
        responseSend(response, 200, skillingRead());

    } else if (request.method === "GET" && url.pathname === "/api/skill/module") {
        responseSend(response, 200, moduleRead(url.searchParams.get("code") ?? ""));

    } else if (request.method === "POST" && url.pathname === "/api/skill/attempt") {
        attemptAdd(await json(request) as AttemptNew);
        responseSend(response, 200, null);

    } else if (request.method === "POST" && url.pathname === "/api/skill/effort") {
        effortSet(await json(request) as EffortNew);
        responseSend(response, 200, null);

    } else if (request.method === "POST" && url.pathname === "/api/skill/tutor") {
        tutorAdd((await json(request) as { task: string }).task);
        responseSend(response, 200, null);

    } else if (request.method === "POST" && url.pathname === "/api/skill/entry") {
        skillEntryAdd(await json(request) as SkillEntryNew);
        responseSend(response, 200, null);

    } else if (request.method === "PATCH" && url.pathname === "/api/skill/entry") {
        skillEntryEdit(await json(request) as SkillEntryChange);
        responseSend(response, 200, null);

    } else if (request.method === "GET" && url.pathname === "/api/skill/session") {
        responseSend(response, 200, sessionRead());

    } else if (request.method === "GET" && url.pathname === "/api/food/search") {
        responseSend(response, 200, await foodsFind(url.searchParams.get("q") ?? ""));

    } else if (request.method === "POST" && url.pathname === "/api/food/foods") {
        responseSend(response, 200, foodAdd(await json(request) as Food));

    } else if (request.method === "GET" && url.pathname === "/api/food/day") {
        responseSend(response, 200, foodDayRead(date));

    } else if (request.method === "GET" && url.pathname === "/api/food/dish") {
        responseSend(response, 200, dishFoodsRead(url.searchParams.get("title") ?? ""));

    } else {
        page.middlewares(request, response);
    }
}

const server: Server = createServer();
const page: ViteDevServer = await pageCreate(server);
server.on("request", (request: IncomingMessage, response: ServerResponse): void => {
    requestHandle(page, request, response).catch((error: unknown): void => {
        console.error(new Date().toISOString(), request.method, request.url, error);
        responseSend(response, 500, { error: "The reader failed" });
    });
});
server.listen(3000, "localhost", (): void => console.log("http://localhost:3000"));
