package com.skyindex.gui;

import com.skyindex.SkydexTheme;
import com.skyindex.compat.ClientCompat;
import com.skyindex.SkyIndexMod;
import com.skyindex.config.SiteMode;
import net.minecraft.client.gui.GuiGraphicsExtractor;
import net.minecraft.client.gui.screens.ConfirmLinkScreen;
import net.minecraft.client.gui.screens.Screen;
import net.minecraft.network.chat.Component;

/**
 * The settings screen, opened with {@code /skyindex}.
 *
 * <p>Three groups, each holding only things the player acts on: the mode
 * question (and the "Open site" shortcut that follows from one answer), the
 * greenhouse layout controls, and the export controls.
 *
 * <p>Deliberately absent: the server address, the profile name, and the capture
 * counts. Those are worth knowing occasionally and worth acting on never, so
 * they live in {@code /skyindex status} instead. A settings screen that also
 * reports diagnostics reads as a debug panel.
 *
 * <p>Client-side only; it reads mod state and writes the config file, and never
 * touches the network or the server connection.
 *
 * <p>Styled as frosted glass, which here is not a metaphor: the renderer can
 * blur what already sits behind a GUI stratum, so the world is genuinely out
 * of focus behind the card and the translucent fills only tint it. Text is
 * drawn without a shadow, which the palette is built to afford; the worst case
 * is a white world seen through the thinnest part of the pane, and muted type
 * still clears the 4.5:1 contrast bar there.
 */
public final class SkyIndexScreen extends Screen {

    private static final long COPIED_FEEDBACK_MS = 1_600L;

    /**
     * The wordmark, in the site's casing. The command, the chat tag and the
     * storage keys keep their older spelling on purpose: renaming those would
     * be a rename, not a restyle, and the site froze its own storage prefixes
     * through the same rename for the same reason.
     */
    private static final String WORDMARK = "SKYDEX";

    private final SkyIndexMod mod;

    private FlatButton copyButton;
    private FlatButton overlayButton;
    private FlatButton projectButton;
    private FlatButton clearButton;
    private FlatButton openSiteButton;
    private long copiedUntil;
    private boolean copyFailed;

    public SkyIndexScreen(SkyIndexMod mod) {
        super(Component.literal("Skydex"));
        this.mod = mod;
    }

    @Override
    protected void init() {
        SettingsLayout layout = SettingsLayout.of(width, height);
        int modeWidth = layout.modeButtonWidth();

        addRenderableWidget(new FlatButton(
                layout.modeButtonX(0), layout.modeY(), modeWidth, SettingsLayout.MODE_H,
                Component.literal(SiteMode.GITHUB_PAGES.label()),
                () -> mod.setSiteMode(SiteMode.GITHUB_PAGES),
                () -> mod.config().siteMode == SiteMode.GITHUB_PAGES));

        addRenderableWidget(new FlatButton(
                layout.modeButtonX(1), layout.modeY(), modeWidth, SettingsLayout.MODE_H,
                Component.literal(SiteMode.LOCAL.label()),
                () -> mod.setSiteMode(SiteMode.LOCAL),
                () -> mod.config().siteMode == SiteMode.LOCAL));

        // Only useful when the site is actually running on this machine.
        openSiteButton = addRenderableWidget(new FlatButton(
                layout.openSiteX(), layout.openSiteY(), layout.openSiteWidth(),
                SettingsLayout.BUTTON_H,
                Component.literal("Open site"), this::openSite));

        // --- greenhouse layout ---
        overlayButton = addRenderableWidget(new FlatButton(
                layout.overlayButtonX(), layout.greenhouseRowY(),
                layout.overlayButtonWidth(), SettingsLayout.BUTTON_H,
                Component.literal("Show overlay"), this::toggleOverlay,
                () -> mod.layouts().overlayEnabled()));

        // "Progress" rather than the code's own word for it. The mechanism is a
        // projection; what the player gets out of it is knowing how far along
        // they are, and the button should be named for the second one. The
        // wordmark makes the same split between SKYDEX and skyindex.
        projectButton = addRenderableWidget(new FlatButton(
                layout.projectButtonX(), layout.greenhouseRowY(),
                layout.projectButtonWidth(), SettingsLayout.BUTTON_H,
                Component.literal("Show progress"), this::toggleProjection,
                () -> mod.layouts().projectionEnabled()));

        clearButton = addRenderableWidget(new FlatButton(
                layout.clearButtonX(), layout.greenhouseRowY(),
                layout.clearButtonWidth(), SettingsLayout.BUTTON_H,
                Component.literal("Clear"), this::clearLayout));

        // --- export ---
        copyButton = addRenderableWidget(new FlatButton(
                layout.contentX(), layout.copyY(), layout.contentWidth(), SettingsLayout.BUTTON_H,
                Component.literal("Copy export code"), this::copy));

        addRenderableWidget(new FlatButton(
                layout.contentX(), layout.includeY(), layout.contentWidth(), SettingsLayout.BUTTON_H,
                Component.literal("Include inventory in export code"), this::toggleIncludeInventory,
                () -> mod.config().includeInventoryInExport()));

        addRenderableWidget(new FlatButton(
                layout.doneX(), layout.doneY(), layout.doneWidth(), SettingsLayout.BUTTON_H,
                Component.literal("Done"), this::onClose));
    }

    // ------------------------------------------------------------------ actions

    /** Confirmation first: opening a browser is the player's call, not ours. */
    private void openSite() {
        ConfirmLinkScreen.confirmLinkNow(this, mod.config().siteUrl, true);
    }

    private void copy() {
        String summary = mod.copyExportCode();
        copyFailed = summary == null;
        copiedUntil = System.currentTimeMillis() + COPIED_FEEDBACK_MS;
    }

    private void toggleIncludeInventory() {
        mod.config().setIncludeInventoryInExport(!mod.config().includeInventoryInExport());
        mod.saveConfig();
    }

    private void toggleOverlay() {
        if (!mod.layouts().hasLayout()) {
            return;
        }
        mod.layouts().toggleOverlay();
        mod.saveLayouts();
    }

    private void toggleProjection() {
        if (!mod.layouts().hasLayout()) {
            return;
        }
        mod.layouts().toggleProjection();
        mod.saveLayouts();
    }

    private void clearLayout() {
        if (!mod.layouts().hasLayout()) {
            return;
        }
        mod.layouts().clear();
        mod.saveLayouts();
    }

    // ------------------------------------------------------------------ drawing

    /**
     * Frosted glass instead of the vanilla dirt backdrop.
     *
     * <p>The blur is the real one the menu background uses, so the world behind
     * the card genuinely goes out of focus rather than being hidden under an
     * opaque wash. It is gated on the player's own blurriness option exactly as
     * vanilla gates it: a player who turned that down did so for motion comfort
     * or for frame rate, and this screen is not the place to overrule them.
     *
     * <p>The subtitle pass is not optional. This screen does not pause the game,
     * so sounds keep playing while it is open, and skipping the call would
     * silently drop sound captions for anyone relying on them.
     */
    @Override
    public void extractBackground(GuiGraphicsExtractor graphics, int mouseX, int mouseY, float partialTick) {
        if (minecraft.options.getMenuBackgroundBlurriness() >= 1) {
            graphics.blurBeforeThisStratum();
        }
        graphics.fill(0, 0, width, height, SkydexTheme.SCRIM);
        ClientCompat.extractDeferredSubtitles(minecraft);
    }

    @Override
    public void extractRenderState(GuiGraphicsExtractor graphics, int mouseX, int mouseY, float partialTick) {
        SettingsLayout layout = SettingsLayout.of(width, height);
        drawPanel(graphics, layout);
        refreshWidgetStates();
        // Widgets last so they sit above the card.
        super.extractRenderState(graphics, mouseX, mouseY, partialTick);
        // Above the widgets, because it reports on one of them.
        drawCopyFeedback(graphics, layout);
    }

    private void drawPanel(GuiGraphicsExtractor graphics, SettingsLayout layout) {
        // One gradient rather than stacked fills: the pane has to thin toward
        // the bottom, and a second fill could only ever add opacity.
        graphics.fillGradient(layout.panelX, layout.panelY, layout.panelRight(), layout.panelBottom(),
                SkydexTheme.PANEL_TOP, SkydexTheme.PANEL_BOTTOM);
        graphics.outline(layout.panelX, layout.panelY, SettingsLayout.PANEL_W, SettingsLayout.PANEL_H,
                SkydexTheme.BORDER);
        // A single accent hairline catching the top edge. Drawn after the
        // border so it replaces that row instead of boxing a second line
        // inside it.
        graphics.fill(layout.panelX, layout.panelY, layout.panelRight(), layout.panelY + 1,
                SkydexTheme.ACCENT);

        drawWordmark(graphics, layout);
        centered(graphics, Component.literal("How do you use Skydex?"),
                layout.centerX(), layout.subtitleY(), SkydexTheme.MUTED);

        drawGreenhouseGroup(graphics, layout);
        drawExportGroup(graphics, layout);
    }

    /**
     * The wordmark, cut corner to corner.
     *
     * <p>The accent is laid down whole and the base colour is painted back over
     * the rows above the seam, one clipped band per pixel of cap height. Two
     * passes rather than per-glyph colouring because the cut crosses letters
     * rather than falling between them.
     */
    private void drawWordmark(GuiGraphicsExtractor graphics, SettingsLayout layout) {
        Component mark = Component.literal(WORDMARK);
        int markWidth = font.width(mark);
        int left = layout.centerX() - markWidth / 2;
        int top = layout.titleY();
        // Capitals fill the line box apart from the row kept for descenders.
        int capHeight = Math.max(1, font.lineHeight - 2);

        graphics.text(font, mark, left, top, SkydexTheme.ACCENT, false);
        for (int row = 0; row < capHeight; row++) {
            int reach = WordmarkSeam.baseWidth(markWidth, capHeight, row);
            if (reach <= 0) {
                continue;
            }
            graphics.enableScissor(left, top + row, left + reach, top + row + 1);
            graphics.text(font, mark, left, top, SkydexTheme.TEXT, false);
            graphics.disableScissor();
        }
    }

    private void drawGreenhouseGroup(GuiGraphicsExtractor graphics, SettingsLayout layout) {
        divider(graphics, layout, layout.greenhouseDividerY());
        graphics.text(font, Component.literal("Greenhouse layout"),
                layout.contentX(), layout.greenhouseLabelY(), SkydexTheme.TEXT, false);

        // Gold is reserved for a value, not for the label naming it: the loaded
        // layout is the one thing in this group the player did not choose here.
        String label = mod.layouts().label();
        graphics.text(font, Component.literal(label == null ? "none loaded" : label),
                layout.contentX(), layout.greenhouseNameY(),
                label == null ? SkydexTheme.MUTED : SkydexTheme.GOLD, false);
    }

    private void drawExportGroup(GuiGraphicsExtractor graphics, SettingsLayout layout) {
        divider(graphics, layout, layout.exportDividerY());
        graphics.text(font, Component.literal("Export code"),
                layout.contentX(), layout.exportLabelY(), SkydexTheme.TEXT, false);
        graphics.text(font, Component.literal(includeHint()),
                layout.contentX(), layout.includeHintY(), SkydexTheme.MUTED, false);
    }

    /**
     * The copy button's feedback, as a bar draining over the window the label
     * swap lasts.
     *
     * <p>It reports state the screen already keeps rather than anything new.
     * Without it the label reverts on a timer with nothing to explain why,
     * which reads as the button changing its mind; with it the revert reads as
     * a timer running out. Gold rather than accent when nothing was captured,
     * because that outcome is worth a second look.
     */
    private void drawCopyFeedback(GuiGraphicsExtractor graphics, SettingsLayout layout) {
        long remaining = copiedUntil - System.currentTimeMillis();
        if (remaining <= 0L) {
            return;
        }
        float fraction = (float) remaining / (float) COPIED_FEEDBACK_MS;
        progressBar(graphics, layout.contentX(), layout.copyFeedbackY(), layout.contentWidth(),
                SettingsLayout.BAR_H, fraction,
                copyFailed ? SkydexTheme.GOLD : SkydexTheme.ACCENT);
    }

    /** A groove in near black, a fill in colour, and a darker line under it. */
    private static void progressBar(GuiGraphicsExtractor graphics, int x, int y, int width, int height,
                                    float fraction, int fill) {
        graphics.fill(x, y, x + width, y + height, SkydexTheme.GROOVE);
        int filled = Math.round(width * Math.clamp(fraction, 0.0f, 1.0f));
        if (filled <= 0) {
            return;
        }
        graphics.fill(x, y, x + filled, y + height - 1, fill);
        graphics.fill(x, y + height - 1, x + filled, y + height, SkydexTheme.darken(fill));
    }

    private static void divider(GuiGraphicsExtractor graphics, SettingsLayout layout, int y) {
        graphics.fill(layout.contentX(), y, layout.contentX() + layout.contentWidth(), y + 1,
                SkydexTheme.BORDER);
    }

    /** Centred text without a shadow; the centring call only offers one with. */
    private void centered(GuiGraphicsExtractor graphics, Component text, int centerX, int y, int colour) {
        graphics.text(font, text, centerX - font.width(text) / 2, y, colour, false);
    }

    /** Why the include toggle sits where it does; it changes with the site mode. */
    private String includeHint() {
        boolean on = mod.config().includeInventoryInExport();
        boolean explicit = mod.config().includeInventoryMode.isExplicit();
        if (on) {
            return explicit
                    ? "Your choice: the code carries these sections."
                    : "The public site reads these from this code.";
        }
        return explicit
                ? "Your choice: the code leaves these out."
                : "The live feed already carries these, so the code skips them.";
    }

    /** Labels and enablement that depend on state the player can change. */
    private void refreshWidgetStates() {
        boolean hasLayout = mod.layouts().hasLayout();
        if (overlayButton != null) {
            overlayButton.active = hasLayout;
            overlayButton.setMessage(Component.literal(
                    mod.layouts().overlayEnabled() ? "Overlay on" : "Show overlay"));
        }
        if (projectButton != null) {
            // Greyed out until the overlay itself is on, because the projection
            // is a way of drawing the overlay and does nothing on its own. The
            // button showing as inert is the shortest way to say that.
            projectButton.active = hasLayout && mod.layouts().overlayEnabled();
            projectButton.setMessage(Component.literal(
                    mod.layouts().projectionEnabled() ? "Progress on" : "Show progress"));
        }
        if (clearButton != null) {
            clearButton.active = hasLayout;
        }
        if (openSiteButton != null) {
            // The hosted site is not on this machine, so there is nothing local
            // to open; the button stays visible but inert to keep the layout stable.
            openSiteButton.active = mod.config().siteMode.usesLocalServer();
        }
        if (copyButton != null) {
            boolean showing = System.currentTimeMillis() < copiedUntil;
            copyButton.setMessage(Component.literal(showing
                    ? (copyFailed ? "Nothing captured yet" : "Copied to clipboard")
                    : "Copy export code"));
        }
    }

    @Override
    public void onClose() {
        mod.saveConfig();
        super.onClose();
    }

    @Override
    public boolean isPauseScreen() {
        return false;
    }
}
