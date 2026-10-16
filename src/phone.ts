/**
 * ## Phone
 *
 * Tells the code whether the page shows on a phone, a screen at most 900 CSS pixels wide, like my phone's 388,
 * the one width at which the whole dashboard changes to its phone layout: every stylesheet ends in one block
 * `@media (max-width: 900px)`, which holds all its rules for a phone, and the code asks {@link phone} for what
 * a stylesheet cannot do, like a skill shown by its code alone. My PC and my laptop, 1920 and 1601 wide, are far above
 * it, so they keep their layout.
 */


/**
 * Whether the page shows on a phone, as narrow as the phone layout of the stylesheets, read once at the start.
 */
export const phone: boolean = matchMedia("(max-width: 900px)").matches;
