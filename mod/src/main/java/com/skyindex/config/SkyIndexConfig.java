package com.skyindex.config;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import com.google.gson.JsonPrimitive;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;

/**
 * Tiny hand-rolled config so the mod needs no config library.
 *
 * <p>A corrupt file falls back to defaults rather than preventing the mod from
 * loading — losing settings is annoying, failing to load is not acceptable.
 */
public final class SkyIndexConfig {

    private static final Gson GSON = new GsonBuilder().setPrettyPrinting().create();

    /** The Vite dev server the site currently runs on. */
    public static final String DEFAULT_SITE_URL = "http://localhost:5173";

    /**
     * Which Skydex site the player uses. Decides whether the localhost server
     * runs at all; there is no separate on/off switch, because two overlapping
     * controls for one behaviour is how people end up confused about why the
     * site says "offline".
     */
    public SiteMode siteMode = SiteMode.defaultMode();
    /** Master switch for all capture. */
    public boolean captureEnabled = true;
    /** Spec-pinned port. Configurable only as an escape hatch for port clashes. */
    public int httpPort = com.skyindex.http.SkyIndexHttpServer.DEFAULT_PORT;
    /**
     * Where "Open site" goes. A config value rather than a constant so a hosted
     * URL can replace the dev server without a rebuild.
     */
    public String siteUrl = DEFAULT_SITE_URL;
    /** Capture the player inventory alongside containers. */
    public boolean captureInventory = true;
    /**
     * Whether the clipboard code carries inventory, ender chest and storage.
     *
     * <p>Untouched, it follows the site mode: on for GitHub Pages (the hosted
     * site has no other way to get those sections) and off for Locally Hosted
     * (the live feed carries them and the code stays small). Once the player
     * picks a side, their choice wins in either mode.
     */
    public IncludeMode includeInventoryMode = IncludeMode.AUTO;
    /** Chat line whenever a container is recorded. Off: it is noisy. */
    public boolean chatFeedback = false;

    public static SkyIndexConfig load(Path file) {
        SkyIndexConfig config = new SkyIndexConfig();
        if (!Files.exists(file)) {
            return config;
        }
        try {
            JsonObject o = JsonParser.parseString(
                    Files.readString(file, StandardCharsets.UTF_8)).getAsJsonObject();
            config.siteMode = SiteMode.fromId(str(o, "siteMode"), SiteMode.defaultMode());
            config.captureEnabled = bool(o, "captureEnabled", config.captureEnabled);
            config.captureInventory = bool(o, "captureInventory", config.captureInventory);
            config.includeInventoryMode = readIncludeMode(o);
            config.chatFeedback = bool(o, "chatFeedback", config.chatFeedback);
            String url = str(o, "siteUrl");
            if (url != null && !url.isBlank()) {
                config.siteUrl = url.trim();
            }
            if (o.has("httpPort") && o.get("httpPort").isJsonPrimitive()) {
                int port = o.get("httpPort").getAsInt();
                if (port > 0 && port <= 65535) {
                    config.httpPort = port;
                }
            }
        } catch (Exception e) {
            return new SkyIndexConfig();
        }
        return config;
    }

    public void save(Path file) throws IOException {
        Path parent = file.getParent();
        if (parent != null) {
            Files.createDirectories(parent);
        }
        Files.writeString(file, GSON.toJson(toJson()), StandardCharsets.UTF_8);
    }

    JsonObject toJson() {
        JsonObject o = new JsonObject();
        o.addProperty("siteMode", siteMode.id());
        o.addProperty("captureEnabled", captureEnabled);
        o.addProperty("httpPort", httpPort);
        o.addProperty("captureInventory", captureInventory);
        o.addProperty("includeInventoryInExport", includeInventoryMode.id());
        o.addProperty("chatFeedback", chatFeedback);
        o.addProperty("siteUrl", siteUrl);
        return o;
    }

    /** Does the clipboard code carry inventory/ender chest/storage right now? */
    public boolean includeInventoryInExport() {
        return includeInventoryMode.effective(siteMode);
    }

    /** Record the player's explicit choice, which then outranks the site mode. */
    public void setIncludeInventoryInExport(boolean include) {
        this.includeInventoryMode = IncludeMode.explicit(include);
    }

    /**
     * Reads the setting, migrating the older boolean form.
     *
     * <p>The previous build always wrote this key, so a stored {@code false} is
     * indistinguishable from "never touched" and is treated as untouched — that
     * is what lets existing GitHub Pages users pick up the new default. A stored
     * {@code true} could only have come from someone deliberately turning it on,
     * so it is kept as an explicit choice.
     */
    private static IncludeMode readIncludeMode(JsonObject o) {
        if (!o.has("includeInventoryInExport") || !o.get("includeInventoryInExport").isJsonPrimitive()) {
            return IncludeMode.AUTO;
        }
        JsonPrimitive value = o.getAsJsonPrimitive("includeInventoryInExport");
        if (value.isBoolean()) {
            return value.getAsBoolean() ? IncludeMode.ON : IncludeMode.AUTO;
        }
        return IncludeMode.fromId(value.getAsString(), IncludeMode.AUTO);
    }

    private static boolean bool(JsonObject o, String key, boolean fallback) {
        if (!o.has(key) || !o.get(key).isJsonPrimitive()) {
            return fallback;
        }
        return o.get(key).getAsBoolean();
    }

    private static String str(JsonObject o, String key) {
        if (!o.has(key) || !o.get(key).isJsonPrimitive()) {
            return null;
        }
        return o.get(key).getAsString();
    }
}
