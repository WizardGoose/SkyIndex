/**
 * Fixed columns for the island cards.
 *
 * WHY THIS IS NOT MASONRY
 * -----------------------
 * The chest and sack boards are made of collapsible cards, and the whole point
 * of collapsing one is that the card below it moves up to take the space. A
 * masonry layout gets that wrong in the one way that matters: it balances
 * column heights, so collapsing a card in column one can push a card out of
 * column two and into column three. Cards then jump sideways in response to a
 * click that was about something else entirely, and the reader loses the card
 * they were looking at.
 *
 * So a card's column is decided once, from its position in the list, and never
 * from how tall anything is. Collapsing changes only the heights inside one
 * column, which means the cards below it in *that* column move up and nothing
 * anywhere else moves at all. The columns end up ragged, and that is the
 * correct trade: ragged is what "nothing jumps" looks like.
 *
 * `distribute` therefore takes no open/collapsed state, and cannot: there is no
 * argument it could arrive through. That is the guarantee, expressed as a type
 * rather than as a promise in a comment.
 */

/**
 * How many columns a viewport of this width gets.
 *
 * Widest first, so the first match wins and anything narrower than the last
 * entry falls through to a single column.
 *
 * WHY THIS PAGE GOES WIDER THAN THE REST OF THE SITE
 * --------------------------------------------------
 * Every other page is capped and centred, and that uniformity is deliberate.
 * This one is a granted exception: all that space was going unused, and this
 * is the one location allowed to break the everything-looks-the-same rule,
 * because breaking the page up visually is required here.
 *
 * The reason it is required rather than merely nice is that a chest card is not
 * a paragraph. It is a fixed nine-wide grid of fifty-four cells, and a page
 * holding sixty of them is a wall unless the columns can spread. Capping this
 * page at a reading measure would leave two thirds of a wide screen empty while
 * the content it is hiding scrolls for pages.
 *
 * The upper steps are sized to the card, not to round numbers: a nine-wide grid
 * needs roughly 300px to keep a slot recognisable, so each extra column costs
 * about 320px of viewport once gaps and page padding are paid for.
 */
export const COLUMN_STEPS: readonly { minWidth: number; columns: number }[] = [
  { minWidth: 1900, columns: 5 },
  { minWidth: 1500, columns: 4 },
  { minWidth: 1024, columns: 3 },
  { minWidth: 640, columns: 2 },
];

/** The widest step whose `minWidth` the viewport clears, or one column. */
export const columnsFor = (width: number): number => {
  if (!Number.isFinite(width)) return 1;
  for (const step of COLUMN_STEPS) if (width >= step.minWidth) return step.columns;
  return 1;
};

/**
 * The column a card at this position belongs to.
 *
 * Round robin rather than contiguous chunks, so reading left to right across a
 * row follows the list order. Chunking would mean reading all the way down
 * column one before jumping back up to the top of column two, which is not how
 * anybody scans a board of cards.
 */
export const columnOf = (index: number, columns: number): number => {
  const count = Math.max(1, Math.floor(columns));
  return ((index % count) + count) % count;
};

/**
 * Deal a list into `columns` fixed stacks.
 *
 * Always returns exactly `columns` arrays, empty ones included, so the caller
 * renders a stable number of flex children and a short list does not silently
 * change the grid's shape.
 */
export const distribute = <T>(items: readonly T[], columns: number): T[][] => {
  const count = Math.max(1, Math.floor(columns));
  const out: T[][] = Array.from({ length: count }, () => []);
  items.forEach((item, i) => {
    out[columnOf(i, count)].push(item);
  });
  return out;
};
