/**
 * Small shared helpers. Ported from SkyHelper-Networth 2.8.0 (MIT, see NOTICE.md)
 * where the behaviour has to match exactly.
 */

/** `ENCHANTED_BROWN_MUSHROOM` to `Enchanted Brown Mushroom`. Upstream's exact rule. */
export const titleCase = (str: unknown): string => {
  if (!str || typeof str !== "string") return "";
  return str
    .toLowerCase()
    .replaceAll("_", " ")
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

/**
 * A number, or zero when the field held anything else.
 *
 * Deliberately not `Number(x)`: `Number(null)`, `Number("")` and `Number([])`
 * are all 0, which is the right answer here only by accident, and `Number({})`
 * is NaN, which would poison every sum it touched. The same rule the island
 * layer runs on.
 */
export const finiteNumber = (value: unknown): number => {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value === "string" && value.trim() !== "") {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
};

/** A plain object, and not an array. */
export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);
