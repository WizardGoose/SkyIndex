package com.skyindex;

import com.skyindex.gui.WordmarkSeam;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * The wordmark cannot be rendered in a test, but the cut across it is integer
 * maths, so the property that matters is still provable: the seam runs corner
 * to corner and it runs the right way round.
 *
 * <p>Direction is the whole point of these. A mirrored seam looks almost
 * identical at a cap height of seven pixels, so "it looked fine" is not
 * evidence; the top row being entirely base colour while the bottom row keeps
 * only the leading letter is.
 */
class WordmarkSeamTest {

    /** Six capitals at the default font's five pixel width and one pixel gap. */
    private static final int WORD_W = 35;
    private static final int CAP_H = 7;

    @Test
    @DisplayName("the seam touches both corners of the cap box")
    void spansCornerToCorner() {
        assertEquals(WORD_W, WordmarkSeam.baseWidth(WORD_W, CAP_H, 0),
                "the top row is entirely base colour, so the seam starts at the top right");
        assertTrue(WordmarkSeam.baseWidth(WORD_W, CAP_H, CAP_H - 1) <= WORD_W / CAP_H + 1,
                "the bottom row keeps only the leading letter, so the seam ends at the bottom left");
        assertTrue(WordmarkSeam.baseWidth(WORD_W, CAP_H, CAP_H - 1) > 0,
                "the bottom row keeps some base colour rather than going fully accent");
    }

    @Test
    @DisplayName("the cut rises left to right, never the other way")
    void isNotMirrored() {
        int previous = Integer.MAX_VALUE;
        for (int row = 0; row < CAP_H; row++) {
            int reach = WordmarkSeam.baseWidth(WORD_W, CAP_H, row);
            assertTrue(reach < previous,
                    "row " + row + " must give back base colour, not gain it (was " + previous
                            + ", now " + reach + ")");
            previous = reach;
        }
    }

    @Test
    @DisplayName("every row stays inside the word")
    void neverOverruns() {
        for (int row = 0; row < CAP_H; row++) {
            int reach = WordmarkSeam.baseWidth(WORD_W, CAP_H, row);
            assertTrue(reach >= 0 && reach <= WORD_W, "row " + row + " reached " + reach);
        }
    }

    @Test
    @DisplayName("the accent lands on the tail of the word, not the head")
    void accentFallsOnTheTail() {
        // Averaged over the cap box, the leading half of the word keeps far
        // more base colour than the trailing half. That is the whole reason the
        // split exists: SKY stays white and DEX takes the accent.
        int half = WORD_W / 2;
        int baseInHead = 0;
        int baseInTail = 0;
        for (int row = 0; row < CAP_H; row++) {
            int reach = WordmarkSeam.baseWidth(WORD_W, CAP_H, row);
            baseInHead += Math.min(reach, half);
            baseInTail += Math.max(0, reach - half);
        }
        assertTrue(baseInHead > baseInTail * 2,
                "the head should hold most of the base colour (head " + baseInHead
                        + ", tail " + baseInTail + ")");
    }

    @Test
    @DisplayName("degenerate inputs return nothing rather than throwing")
    void handlesDegenerateInput() {
        assertEquals(0, WordmarkSeam.baseWidth(0, CAP_H, 0));
        assertEquals(0, WordmarkSeam.baseWidth(WORD_W, 0, 0));
        assertEquals(0, WordmarkSeam.baseWidth(WORD_W, CAP_H, -1));
        assertEquals(0, WordmarkSeam.baseWidth(WORD_W, CAP_H, CAP_H));
        assertEquals(0, WordmarkSeam.baseWidth(WORD_W, CAP_H, CAP_H + 5));
    }

    @Test
    @DisplayName("a one pixel cap box is entirely base colour")
    void singleRowIsAllBase() {
        assertEquals(WORD_W, WordmarkSeam.baseWidth(WORD_W, 1, 0));
    }
}
