/** A practical ceiling that also keeps every scaled total a safe integer. */
export const MAX_ITEM_QUANTITY = 1_000_000;

/**
 * Turn URL and number-input values into a usable whole-item count.
 * Empty, non-numeric and non-positive values mean one item.
 */
export const normaliseItemQuantity = (value: unknown): number => {
  const parsed = typeof value === "number" ? value : typeof value === "string" ? Number(value) : Number.NaN;
  if (!Number.isFinite(parsed) || parsed < 1) return 1;
  return Math.min(MAX_ITEM_QUANTITY, Math.floor(parsed));
};
