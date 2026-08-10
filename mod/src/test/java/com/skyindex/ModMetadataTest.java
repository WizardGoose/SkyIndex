package com.skyindex;

import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Entrypoint wiring smoke test.
 *
 * <p>The mod cannot be launched here (no display), and a wrong entrypoint class
 * name in {@code fabric.mod.json} fails only at game start with a hard crash.
 * This catches that statically: the declared entrypoint must correspond to a
 * class that actually compiled.
 */
class ModMetadataTest {

    private static JsonObject modJson() throws IOException {
        Path file = Path.of("build/resources/main/fabric.mod.json");
        assertTrue(Files.exists(file), "fabric.mod.json missing at " + file.toAbsolutePath());
        return JsonParser.parseString(Files.readString(file, StandardCharsets.UTF_8)).getAsJsonObject();
    }

    @Test
    @DisplayName("declared client entrypoint resolves to a compiled class")
    void entrypointClassExists() throws IOException {
        JsonArray client = modJson().getAsJsonObject("entrypoints").getAsJsonArray("client");
        assertEquals(1, client.size(), "expected exactly one client entrypoint");

        String fqcn = client.get(0).getAsString();
        Path classFile = Path.of("build/classes/java/main")
                .resolve(fqcn.replace('.', '/') + ".class");
        assertTrue(Files.exists(classFile),
                "entrypoint " + fqcn + " has no compiled class at " + classFile.toAbsolutePath());
    }

    @Test
    @DisplayName("metadata matches what the config dir and spec assume")
    void metadataIsConsistent() throws IOException {
        JsonObject json = modJson();
        assertEquals(1, json.get("schemaVersion").getAsInt());
        // The config path in the spec is config/skyindex/... which is the mod id.
        assertEquals("skyindex", json.get("id").getAsString());
        assertEquals("client", json.get("environment").getAsString());

        JsonObject depends = json.getAsJsonObject("depends");
        assertEquals(System.getProperty("minecraftVersion"),
                depends.get("minecraft").getAsString(),
                "processed metadata must target exactly the compiled Minecraft version");
        // Both supported releases require a Java 25 runtime (Mojang version manifest).
        assertEquals(">=25", depends.get("java").getAsString());
    }
}
