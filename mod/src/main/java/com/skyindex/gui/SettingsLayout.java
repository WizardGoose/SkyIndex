package com.skyindex.gui;

/**
 * Geometry for the settings screen, centred in the window.
 *
 * <p>Three groups, top to bottom, each earning its place: the mode question and
 * what follows from it, the greenhouse layout controls, and the export controls.
 * Nothing diagnostic: server addresses, profile names and capture counts live
 * in {@code /skyindex status}, because they are things to read, not things to
 * act on, and a settings screen should only hold the latter.
 *
 * <p>Height matters: at GUI scale 4 on a 1080p display the whole usable area is
 * 270px, so the panel is kept under that with room to spare.
 *
 * <p>Pure integer maths with no Minecraft types, so the layout is testable
 * headlessly even though the screen itself cannot be screenshot.
 */
public final class SettingsLayout {

    public static final int PANEL_W = 320;
    /** Fits 1080p at GUI scale 4 (270px of usable height) with margin. */
    public static final int PANEL_H = 258;
    public static final int MARGIN = 16;
    /** The mode pair is the primary choice, so it gets a taller hit area. */
    public static final int MODE_H = 20;
    public static final int BUTTON_H = 18;
    public static final int LINE_H = 11;
    public static final int GAP = 8;
    /** Progress groove, matching the height the vanilla experience bar reads at. */
    public static final int BAR_H = 5;

    /** Rows, relative to the panel's top edge. */
    private static final int TITLE_DY = 12;
    private static final int SUBTITLE_DY = 28;
    private static final int MODE_DY = 42;
    private static final int OPEN_SITE_DY = 66;
    private static final int GREENHOUSE_DIVIDER_DY = 92;
    private static final int GREENHOUSE_LABEL_DY = 98;
    private static final int GREENHOUSE_NAME_DY = 111;
    private static final int GREENHOUSE_ROW_DY = 124;
    private static final int EXPORT_DIVIDER_DY = 150;
    private static final int EXPORT_LABEL_DY = 156;
    private static final int COPY_DY = 169;
    private static final int COPY_FEEDBACK_DY = 189;
    private static final int INCLUDE_DY = 197;
    private static final int INCLUDE_HINT_DY = 219;
    private static final int DONE_DY = 234;

    public final int panelX;
    public final int panelY;

    private SettingsLayout(int panelX, int panelY) {
        this.panelX = panelX;
        this.panelY = panelY;
    }

    /** Centre the panel, clamped so it never runs off a very small window. */
    public static SettingsLayout of(int screenWidth, int screenHeight) {
        int x = Math.max(0, (screenWidth - PANEL_W) / 2);
        int y = Math.max(0, (screenHeight - PANEL_H) / 2);
        return new SettingsLayout(x, y);
    }

    public int panelRight() {
        return panelX + PANEL_W;
    }

    public int panelBottom() {
        return panelY + PANEL_H;
    }

    public int contentX() {
        return panelX + MARGIN;
    }

    public int contentWidth() {
        return PANEL_W - MARGIN * 2;
    }

    public int centerX() {
        return panelX + PANEL_W / 2;
    }

    // ---------------------------------------------------------- the question

    public int titleY() {
        return panelY + TITLE_DY;
    }

    public int subtitleY() {
        return panelY + SUBTITLE_DY;
    }

    public int modeY() {
        return panelY + MODE_DY;
    }

    /** Two equal buttons side by side with one gap between them. */
    public int modeButtonWidth() {
        return (contentWidth() - GAP) / 2;
    }

    /** 0 = GitHub Pages (left), 1 = Locally Hosted (right). */
    public int modeButtonX(int index) {
        return contentX() + index * (modeButtonWidth() + GAP);
    }

    /**
     * "Open site" sits directly under the Locally Hosted option and matches its
     * width, so it reads as belonging to that choice rather than to the panel.
     */
    public int openSiteY() {
        return panelY + OPEN_SITE_DY;
    }

    public int openSiteX() {
        return modeButtonX(1);
    }

    public int openSiteWidth() {
        return modeButtonWidth();
    }

    // ------------------------------------------------------- greenhouse group

    public int greenhouseDividerY() {
        return panelY + GREENHOUSE_DIVIDER_DY;
    }

    public int greenhouseLabelY() {
        return panelY + GREENHOUSE_LABEL_DY;
    }

    public int greenhouseNameY() {
        return panelY + GREENHOUSE_NAME_DY;
    }

    public int greenhouseRowY() {
        return panelY + GREENHOUSE_ROW_DY;
    }

    /**
     * The row holds three controls, so two gaps come out of the content width
     * before anything is shared.
     *
     * <p>Kept as one row rather than a second one because the panel is already
     * within a few pixels of the height a 1080p screen has at GUI scale 4, and
     * the group's meaning is unchanged: these are the things you do to the
     * loaded layout.
     */
    private int greenhouseRowWidth() {
        return contentWidth() - GAP * 2;
    }

    /**
     * The two toggles share the row evenly and Clear takes what is left.
     *
     * <p>They are a pair — one draws the plan, the other compares it with what
     * is built — so giving them the same width says they belong together.
     * Clear is the one destructive control here and is deliberately the small
     * one, which is also why it sits at the far end rather than between them.
     */
    public int overlayButtonWidth() {
        return greenhouseRowWidth() * 2 / 5;
    }

    public int projectButtonWidth() {
        return greenhouseRowWidth() * 2 / 5;
    }

    public int clearButtonWidth() {
        return greenhouseRowWidth() - overlayButtonWidth() - projectButtonWidth();
    }

    public int overlayButtonX() {
        return contentX();
    }

    public int projectButtonX() {
        return overlayButtonX() + overlayButtonWidth() + GAP;
    }

    public int clearButtonX() {
        return projectButtonX() + projectButtonWidth() + GAP;
    }

    // ----------------------------------------------------------- export group

    public int exportDividerY() {
        return panelY + EXPORT_DIVIDER_DY;
    }

    public int exportLabelY() {
        return panelY + EXPORT_LABEL_DY;
    }

    public int copyY() {
        return panelY + COPY_DY;
    }

    /**
     * The groove under the copy button, which carries that button's transient
     * feedback. The row is reserved whether or not anything is drawn in it, so
     * the feedback appearing never shifts the rows below.
     */
    public int copyFeedbackY() {
        return panelY + COPY_FEEDBACK_DY;
    }

    public int includeY() {
        return panelY + INCLUDE_DY;
    }

    public int includeHintY() {
        return panelY + INCLUDE_HINT_DY;
    }

    // ---------------------------------------------------------------- footer

    public int doneY() {
        return panelY + DONE_DY;
    }

    public int doneWidth() {
        return 96;
    }

    public int doneX() {
        return centerX() - doneWidth() / 2;
    }
}
