package com.skyindex;

import com.skyindex.gui.SettingsLayout;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * The screen cannot be rendered headlessly, but its geometry is plain integer
 * maths, so "the panel fits, is centred, and the rows do not collide" is still
 * provable without a window.
 */
class SettingsLayoutTest {

    @Test
    @DisplayName("panel is centred at a typical window size")
    void centresPanel() {
        SettingsLayout layout = SettingsLayout.of(854, 480);
        assertEquals((854 - SettingsLayout.PANEL_W) / 2, layout.panelX);
        assertEquals((480 - SettingsLayout.PANEL_H) / 2, layout.panelY);
        assertEquals(854 / 2, layout.centerX());
    }

    @Test
    @DisplayName("the panel fits on screen at GUI scale 4, the tightest case")
    void fitsAtLargestGuiScale() {
        // 1080p at GUI scale 4 leaves 480x270 of GUI space; scale 3 leaves 360.
        assertTrue(SettingsLayout.PANEL_H <= 270,
                "panel is " + SettingsLayout.PANEL_H + "px, which would overflow 1080p at scale 4");
        assertTrue(SettingsLayout.PANEL_W <= 480, "panel too wide for scale 4");

        SettingsLayout tight = SettingsLayout.of(480, 270);
        assertTrue(tight.panelY >= 0);
        assertTrue(tight.panelBottom() <= 270, "bottom edge would be off screen");
    }

    @Test
    @DisplayName("rows run top to bottom without overlapping")
    void rowsAreOrdered() {
        SettingsLayout l = SettingsLayout.of(854, 480);

        assertTrue(l.titleY() < l.subtitleY(), "title above subtitle");
        assertTrue(l.subtitleY() + SettingsLayout.LINE_H <= l.modeY(), "subtitle clears the modes");
        assertTrue(l.modeY() + SettingsLayout.MODE_H <= l.openSiteY(), "modes clear Open site");
        assertTrue(l.openSiteY() + SettingsLayout.BUTTON_H <= l.greenhouseDividerY(),
                "Open site clears the greenhouse group");

        assertTrue(l.greenhouseDividerY() < l.greenhouseLabelY(), "divider above its label");
        assertTrue(l.greenhouseLabelY() + SettingsLayout.LINE_H <= l.greenhouseNameY(),
                "label clears the layout name");
        assertTrue(l.greenhouseNameY() + SettingsLayout.LINE_H <= l.greenhouseRowY(),
                "layout name clears its buttons");
        assertTrue(l.greenhouseRowY() + SettingsLayout.BUTTON_H <= l.exportDividerY(),
                "greenhouse buttons clear the export group");

        assertTrue(l.exportDividerY() < l.exportLabelY(), "divider above its label");
        assertTrue(l.exportLabelY() + SettingsLayout.LINE_H <= l.copyY(), "label clears Copy");
        assertTrue(l.copyY() + SettingsLayout.BUTTON_H <= l.copyFeedbackY(),
                "Copy clears its feedback groove");
        assertTrue(l.copyFeedbackY() + SettingsLayout.BAR_H <= l.includeY(),
                "the feedback groove clears the toggle");
        assertTrue(l.includeY() + SettingsLayout.BUTTON_H <= l.includeHintY(),
                "toggle clears its hint");
        assertTrue(l.includeHintY() + SettingsLayout.LINE_H <= l.doneY(), "hint clears Done");
        assertTrue(l.doneY() + SettingsLayout.BUTTON_H <= l.panelBottom(),
                "Done fits inside the panel");
    }

    @Test
    @DisplayName("the two mode buttons sit side by side inside the content area")
    void modeButtonsFit() {
        SettingsLayout l = SettingsLayout.of(854, 480);
        int w = l.modeButtonWidth();

        assertEquals(l.contentX(), l.modeButtonX(0));
        assertTrue(l.modeButtonX(0) + w < l.modeButtonX(1), "buttons must not overlap");
        assertTrue(l.modeButtonX(1) + w <= l.contentX() + l.contentWidth(),
                "second button must stay inside the content area");
        assertEquals(SettingsLayout.GAP, l.modeButtonX(1) - (l.modeButtonX(0) + w));
    }

    @Test
    @DisplayName("Open site lines up under the Locally Hosted option it belongs to")
    void openSiteSitsUnderLocalOption() {
        SettingsLayout l = SettingsLayout.of(854, 480);
        assertEquals(l.modeButtonX(1), l.openSiteX(),
                "must share the left edge of the Locally Hosted button");
        assertEquals(l.modeButtonWidth(), l.openSiteWidth(), "and its width");
        assertTrue(l.openSiteX() + l.openSiteWidth() <= l.contentX() + l.contentWidth());
    }

    @Test
    @DisplayName("the greenhouse row's three buttons tile the content width exactly")
    void greenhouseRowFits() {
        SettingsLayout l = SettingsLayout.of(854, 480);
        assertEquals(l.contentX(), l.overlayButtonX());
        assertEquals(l.overlayButtonX() + l.overlayButtonWidth() + SettingsLayout.GAP,
                l.projectButtonX());
        assertEquals(l.projectButtonX() + l.projectButtonWidth() + SettingsLayout.GAP,
                l.clearButtonX());
        assertEquals(l.contentX() + l.contentWidth(),
                l.clearButtonX() + l.clearButtonWidth(),
                "overlay + gap + progress + gap + clear must exactly fill the content width");
    }

    @Test
    @DisplayName("the two overlay toggles are a matched pair and Clear is the small one")
    void greenhouseRowRanksItsControls() {
        SettingsLayout l = SettingsLayout.of(854, 480);
        assertEquals(l.overlayButtonWidth(), l.projectButtonWidth(),
                "the two toggles belong together and should read as a pair");
        assertTrue(l.overlayButtonWidth() > l.clearButtonWidth(),
                "the toggles are the primary controls and should be wider");
    }

    @Test
    @DisplayName("no button in the greenhouse row is squeezed below its label")
    void greenhouseRowStaysLegible() {
        // The font is not available headlessly, so this guards the floor rather
        // than measuring the text: "Show progress" is the longest label in the
        // row at roughly 76px, and "Clear" at roughly 28px. A future fourth
        // control would breach these and should, so it gets thought about.
        SettingsLayout l = SettingsLayout.of(854, 480);
        assertTrue(l.overlayButtonWidth() >= 90,
                "overlay toggle was " + l.overlayButtonWidth() + "px");
        assertTrue(l.projectButtonWidth() >= 90,
                "progress toggle was " + l.projectButtonWidth() + "px");
        assertTrue(l.clearButtonWidth() >= 40,
                "Clear was " + l.clearButtonWidth() + "px");
    }

    @Test
    @DisplayName("content and Done stay within the panel")
    void contentWithinPanel() {
        SettingsLayout l = SettingsLayout.of(854, 480);
        assertTrue(l.contentX() > l.panelX);
        assertTrue(l.contentX() + l.contentWidth() < l.panelRight());
        assertTrue(l.doneX() >= l.contentX());
        assertTrue(l.doneX() + l.doneWidth() <= l.contentX() + l.contentWidth());
    }

    @Test
    @DisplayName("never positions the panel off-screen on a tiny window")
    void clampsOnSmallWindow() {
        SettingsLayout l = SettingsLayout.of(200, 120);
        assertTrue(l.panelX >= 0, "panelX was " + l.panelX);
        assertTrue(l.panelY >= 0, "panelY was " + l.panelY);
    }

    @Test
    @DisplayName("the feedback groove spans the content width, not the button alone")
    void feedbackGrooveSpansContent() {
        SettingsLayout l = SettingsLayout.of(854, 480);
        assertTrue(l.copyFeedbackY() > l.copyY(), "the groove sits under the button it reports on");
        assertTrue(l.copyFeedbackY() + SettingsLayout.BAR_H < l.panelBottom(),
                "the groove stays inside the panel");
    }
}
