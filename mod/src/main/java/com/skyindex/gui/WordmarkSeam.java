package com.skyindex.gui;

/**
 * The Skydex wordmark's two-tone seam, as integer maths.
 *
 * <p>The mark is one hard diagonal cut across the cap box, corner to corner:
 * it leaves the bottom left and rises to the top right, base colour above the
 * cut and accent below it. That puts the accent on DEX and leaves SKY in the
 * base colour, which is the entire point of the split. Mirroring the cut is
 * the failure this class exists to make provable, because at a cap height of
 * seven pixels the mirrored version is nearly indistinguishable until the two
 * are held side by side.
 *
 * <p>A GUI can only clip to rectangles, so the cut is drawn as one clipped
 * band per pixel row of the cap box rather than as a real line. Row zero is
 * the top of the caps.
 *
 * <p>Pure integer maths with no Minecraft types, so the seam is provable
 * headlessly even though the screen it lands on cannot be rendered in a test.
 */
public final class WordmarkSeam {

    private WordmarkSeam() {
    }

    /**
     * How far the base colour reaches across one row, in pixels measured from
     * the left edge of the word.
     *
     * <p>The top row is entirely base colour and every row below it gives back
     * an equal slice, so the last row keeps only the leading letter. Rounding
     * up keeps the seam anchored to the top right corner: with truncation the
     * top row would fall a pixel short and leak accent onto the final glyph.
     *
     * @param wordWidth rendered width of the whole word, in pixels
     * @param capHeight height of the cap box, in pixels
     * @param row       distance below the top of the cap box, in pixels
     * @return pixels of base colour on that row, clamped to the word
     */
    public static int baseWidth(int wordWidth, int capHeight, int row) {
        if (wordWidth <= 0 || capHeight <= 0 || row < 0 || row >= capHeight) {
            return 0;
        }
        int remaining = capHeight - row;
        int reach = (wordWidth * remaining + capHeight - 1) / capHeight;
        return Math.min(wordWidth, reach);
    }
}
