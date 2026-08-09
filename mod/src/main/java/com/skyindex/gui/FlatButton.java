package com.skyindex.gui;

import com.mojang.blaze3d.platform.InputConstants;
import com.skyindex.SkydexTheme;
import net.minecraft.client.Minecraft;
import net.minecraft.client.gui.Font;
import net.minecraft.client.gui.GuiGraphicsExtractor;
import net.minecraft.client.gui.components.AbstractWidget;
import net.minecraft.client.gui.narration.NarrationElementOutput;
import net.minecraft.client.input.KeyEvent;
import net.minecraft.client.input.MouseButtonEvent;
import net.minecraft.network.chat.Component;

import java.util.function.BooleanSupplier;

/**
 * A flat, site-styled button.
 *
 * <p>Extends {@link AbstractWidget} rather than {@code AbstractButton} because
 * that class renders the vanilla button sprite from a {@code final} method:
 * there is no way to keep its behaviour and drop its looks, and the looks are
 * the point here.
 *
 * <p>The fills are white at low alpha rather than opaque greys, so a control
 * reads as a brighter patch of the same glass instead of a tile sitting on
 * top of it. The selected state tints with the accent rather than flooding
 * with it, which keeps the label legible against the fill it sits on.
 */
public final class FlatButton extends AbstractWidget {

    private final Runnable onPress;
    private final BooleanSupplier selected;

    public FlatButton(int x, int y, int width, int height, Component message, Runnable onPress) {
        this(x, y, width, height, message, onPress, () -> false);
    }

    /**
     * @param selected drives the accent treatment, so a toggle can show which
     *                 option is active without a separate widget type
     */
    public FlatButton(int x, int y, int width, int height, Component message,
                      Runnable onPress, BooleanSupplier selected) {
        super(x, y, width, height, message);
        this.onPress = onPress;
        this.selected = selected;
    }

    @Override
    protected void extractWidgetRenderState(GuiGraphicsExtractor graphics, int mouseX, int mouseY, float partialTick) {
        boolean isSelected = selected.getAsBoolean();
        boolean highlight = isHoveredOrFocused() && active;

        int fill = isSelected ? SkydexTheme.SURFACE_SELECTED
                : highlight ? SkydexTheme.SURFACE_HOVER : SkydexTheme.SURFACE;
        int border = isSelected || highlight ? SkydexTheme.ACCENT : SkydexTheme.BORDER;
        int text = !active ? SkydexTheme.MUTED
                : isSelected ? SkydexTheme.ACCENT : SkydexTheme.TEXT;

        graphics.fill(getX(), getY(), getX() + getWidth(), getY() + getHeight(), fill);
        graphics.outline(getX(), getY(), getWidth(), getHeight(), border);

        // Centred by hand: the centring call has no overload that drops the
        // shadow, and the shadow is what makes vanilla type look stamped on.
        Font font = Minecraft.getInstance().font;
        Component message = getMessage();
        graphics.text(font, message,
                getX() + (getWidth() - font.width(message)) / 2,
                getY() + (getHeight() - 8) / 2, text, false);
    }

    @Override
    public void onClick(MouseButtonEvent event, boolean doubled) {
        press();
    }

    @Override
    public boolean keyPressed(KeyEvent event) {
        if (!active || !visible) {
            return false;
        }
        if (event.key() == InputConstants.KEY_RETURN || event.key() == InputConstants.KEY_SPACE) {
            press();
            return true;
        }
        return false;
    }

    private void press() {
        playButtonClickSound(Minecraft.getInstance().getSoundManager());
        onPress.run();
    }

    @Override
    protected void updateWidgetNarration(NarrationElementOutput output) {
        defaultButtonNarrationText(output);
    }
}
