package com.skyindex.compat;

import net.minecraft.client.Minecraft;
import net.minecraft.client.gui.screens.Screen;
import net.minecraft.network.chat.Component;

import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;

/**
 * The small set of client calls Mojang moved between 26.1.2 and 26.2.
 *
 * <p>Keeping the version probe here means the rest of the mod stays ordinary,
 * typed code. Every fallback names a real method from one of the two supported
 * clients and fails loudly if neither shape is present.
 */
public final class ClientCompat {
    private ClientCompat() {
    }

    public static void addClientSystemMessage(Minecraft client, Component message) {
        Object chat = invokeGuiOrHud(client, "getChat", new Class<?>[0]);
        invokeRequired(chat, "addClientSystemMessage", new Class<?>[]{Component.class}, message);
    }

    public static void setScreen(Minecraft client, Screen screen) {
        if (invokeIfPresent(client, "setScreen", new Class<?>[]{Screen.class}, screen)
                || invokeIfPresent(client, "setScreenAndShow", new Class<?>[]{Screen.class}, screen)) {
            return;
        }
        if (client.gui != null
                && invokeIfPresent(client.gui, "setScreen", new Class<?>[]{Screen.class}, screen)) {
            return;
        }
        throw new IllegalStateException("No supported Minecraft screen setter is available");
    }

    public static void setOverlayMessage(Minecraft client, Component message, boolean animate) {
        invokeGuiOrHud(client, "setOverlayMessage",
                new Class<?>[]{Component.class, boolean.class}, message, animate);
    }

    public static void extractDeferredSubtitles(Minecraft client) {
        invokeGuiOrHud(client, "extractDeferredSubtitles", new Class<?>[0]);
    }

    private static Object invokeGuiOrHud(Minecraft client, String name,
                                         Class<?>[] parameterTypes, Object... args) {
        if (client == null || client.gui == null) {
            throw new IllegalStateException("Minecraft GUI is not available");
        }
        Method guiMethod = findMethod(client.gui.getClass(), name, parameterTypes);
        if (guiMethod != null) {
            return invoke(client.gui, guiMethod, args);
        }
        try {
            Object hud = client.gui.getClass().getField("hud").get(client.gui);
            return invokeRequired(hud, name, parameterTypes, args);
        } catch (NoSuchFieldException | IllegalAccessException failure) {
            throw new IllegalStateException("No supported GUI/HUD method " + name, failure);
        }
    }

    private static boolean invokeIfPresent(Object target, String name,
                                           Class<?>[] parameterTypes, Object... args) {
        Method method = findMethod(target.getClass(), name, parameterTypes);
        if (method == null) {
            return false;
        }
        invoke(target, method, args);
        return true;
    }

    private static Object invokeRequired(Object target, String name,
                                         Class<?>[] parameterTypes, Object... args) {
        Method method = findMethod(target.getClass(), name, parameterTypes);
        if (method == null) {
            throw new IllegalStateException("Required method " + target.getClass().getName()
                    + "." + name + " is unavailable");
        }
        return invoke(target, method, args);
    }

    private static Method findMethod(Class<?> type, String name, Class<?>[] parameterTypes) {
        try {
            return type.getMethod(name, parameterTypes);
        } catch (NoSuchMethodException ignored) {
            return null;
        }
    }

    private static Object invoke(Object target, Method method, Object... args) {
        try {
            return method.invoke(target, args);
        } catch (IllegalAccessException failure) {
            throw new IllegalStateException("Cannot call " + method, failure);
        } catch (InvocationTargetException failure) {
            Throwable cause = failure.getCause();
            if (cause instanceof RuntimeException runtime) {
                throw runtime;
            }
            if (cause instanceof Error error) {
                throw error;
            }
            throw new IllegalStateException("Call failed: " + method, cause);
        }
    }
}
