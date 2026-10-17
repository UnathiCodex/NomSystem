/**
 * ## Changes
 *
 * Loads what a view shows anew the moment a file of my new system changes, whoever changed it: this page, another
 * page, another device, or Claude through the reader, like a food renamed in every entry that holds it, since the
 * reader tells every open page so, see `reader/changes.ts`. So no view shows what the files held before.
 * The page hears the reader on one open answer for all its views; once it hears the reader again after losing it,
 * like a phone whose app lay in the background, or the reader started anew after a change of its code, every view
 * loads anew too, since a change may have come meanwhile.
 *
 * - {@link EventSource}: Keeps one answer of the reader open, hears each change on it, and asks again by itself
 *   when it breaks.
 */


/**
 * Loads of the views that follow the changes, each run after every change.
 */
const followers: (() => void)[] = [];

/**
 * The open answer of the reader, `null` until the first view follows the changes.
 */
let source: EventSource | null = null;

/**
 * Whether the page lost the reader since it last heard it.
 */
let lost: boolean = false;

/**
 * Loads anew what a view shows, after every change of a file of my new system, and once the page hears the reader
 * again after losing it, see the top of this file; the first view to follow opens the answer of the reader.
 * - `loadAll`: Runs the loads of every view that follows.
 *
 * @param again - Loads what the view shows anew, as it lies in the files now
 */
export function changesFollow(again: () => void): void {
    followers.push(again);
    if (source !== null)
        return;
    const loadAll: () => void = (): void => followers.forEach((follower: () => void): void => follower());
    source = new EventSource("/api/changes");
    source.addEventListener("message", loadAll);
    source.addEventListener("error", (): void => {
        lost = true;
    });
    source.addEventListener("open", (): void => {
        if (lost)
            loadAll();
        lost = false;
    });
}
