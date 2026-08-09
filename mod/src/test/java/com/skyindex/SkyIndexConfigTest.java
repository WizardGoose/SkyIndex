package com.skyindex;

import com.skyindex.config.IncludeMode;
import com.skyindex.config.SiteMode;
import com.skyindex.config.SkyIndexConfig;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class SkyIndexConfigTest {

    @Test
    @DisplayName("default is Locally hosted, which means the server runs")
    void defaults() {
        SkyIndexConfig config = new SkyIndexConfig();
        assertEquals(SiteMode.LOCAL, config.siteMode);
        assertTrue(config.siteMode.usesLocalServer());
        assertEquals(27916, config.httpPort);
        assertTrue(config.captureEnabled);
    }

    @Test
    @DisplayName("GitHub Pages mode stops the local server")
    void githubPagesHasNoServer() {
        assertFalse(SiteMode.GITHUB_PAGES.usesLocalServer(),
                "GitHub Pages must not run the local server");
        assertEquals("GitHub Pages", SiteMode.GITHUB_PAGES.label());
        assertEquals("Locally Hosted", SiteMode.LOCAL.label());
    }

    @Test
    @DisplayName("untouched, the export toggle follows the site mode")
    void includeDefaultFollowsMode() {
        SkyIndexConfig config = new SkyIndexConfig();
        assertEquals(IncludeMode.AUTO, config.includeInventoryMode);

        // Locally Hosted: the live feed carries these, so the code stays small.
        config.siteMode = SiteMode.LOCAL;
        assertFalse(config.includeInventoryInExport());

        // GitHub Pages: the code is the only way the hosted site can get them.
        config.siteMode = SiteMode.GITHUB_PAGES;
        assertTrue(config.includeInventoryInExport());
    }

    @Test
    @DisplayName("an explicit choice outranks the site mode in both directions")
    void explicitChoiceWins() {
        SkyIndexConfig config = new SkyIndexConfig();

        // Turned ON while on Locally Hosted, where the default would be off.
        config.siteMode = SiteMode.LOCAL;
        config.setIncludeInventoryInExport(true);
        assertTrue(config.includeInventoryInExport());
        config.siteMode = SiteMode.GITHUB_PAGES;
        assertTrue(config.includeInventoryInExport(), "switching mode must not undo the choice");

        // Turned OFF while on GitHub Pages, where the default would be on.
        config.setIncludeInventoryInExport(false);
        assertFalse(config.includeInventoryInExport());
        config.siteMode = SiteMode.LOCAL;
        assertFalse(config.includeInventoryInExport());
    }

    @Test
    @DisplayName("an explicit choice survives a restart; an untouched one stays automatic")
    void explicitChoicePersists(@TempDir Path dir) throws IOException {
        Path file = dir.resolve("config.json");

        SkyIndexConfig untouched = new SkyIndexConfig();
        untouched.siteMode = SiteMode.GITHUB_PAGES;
        untouched.save(file);
        SkyIndexConfig reloadedAuto = SkyIndexConfig.load(file);
        assertEquals(IncludeMode.AUTO, reloadedAuto.includeInventoryMode);
        assertTrue(reloadedAuto.includeInventoryInExport(), "still follows GitHub Pages");

        SkyIndexConfig chosen = new SkyIndexConfig();
        chosen.siteMode = SiteMode.GITHUB_PAGES;
        chosen.setIncludeInventoryInExport(false);
        chosen.save(file);
        assertTrue(Files.readString(file, StandardCharsets.UTF_8).contains("\"includeInventoryInExport\": \"off\""));

        SkyIndexConfig reloaded = SkyIndexConfig.load(file);
        assertEquals(IncludeMode.OFF, reloaded.includeInventoryMode);
        assertFalse(reloaded.includeInventoryInExport(),
                "an explicit off must survive, even on GitHub Pages");
    }

    @Test
    @DisplayName("the older boolean form migrates without stranding anyone on the old default")
    void migratesLegacyBoolean(@TempDir Path dir) throws IOException {
        Path file = dir.resolve("config.json");

        // The previous build always wrote false, so it cannot mean "chosen".
        Files.writeString(file, "{\"siteMode\":\"githubPages\",\"includeInventoryInExport\":false}",
                StandardCharsets.UTF_8);
        SkyIndexConfig migrated = SkyIndexConfig.load(file);
        assertEquals(IncludeMode.AUTO, migrated.includeInventoryMode);
        assertTrue(migrated.includeInventoryInExport(), "picks up the new GitHub Pages default");

        // A stored true could only have come from someone turning it on.
        Files.writeString(file, "{\"siteMode\":\"local\",\"includeInventoryInExport\":true}",
                StandardCharsets.UTF_8);
        SkyIndexConfig kept = SkyIndexConfig.load(file);
        assertEquals(IncludeMode.ON, kept.includeInventoryMode);
        assertTrue(kept.includeInventoryInExport());
    }

    @Test
    @DisplayName("site mode survives a save/load round trip")
    void persistsSiteMode(@TempDir Path dir) throws IOException {
        Path file = dir.resolve("config.json");
        SkyIndexConfig config = new SkyIndexConfig();
        config.siteMode = SiteMode.GITHUB_PAGES;
        config.chatFeedback = true;
        config.save(file);

        String written = Files.readString(file, StandardCharsets.UTF_8);
        assertTrue(written.contains("\"siteMode\": \"githubPages\""), written);

        SkyIndexConfig reloaded = SkyIndexConfig.load(file);
        assertEquals(SiteMode.GITHUB_PAGES, reloaded.siteMode);
        assertTrue(reloaded.chatFeedback);
    }

    @Test
    @DisplayName("an unknown or missing mode falls back to the default")
    void lenientModeParsing(@TempDir Path dir) throws IOException {
        assertEquals(SiteMode.LOCAL, SiteMode.fromId("nonsense", SiteMode.defaultMode()));
        assertEquals(SiteMode.LOCAL, SiteMode.fromId(null, SiteMode.defaultMode()));
        assertEquals(SiteMode.GITHUB_PAGES, SiteMode.fromId("  GITHUBPAGES ", SiteMode.LOCAL));

        Path file = dir.resolve("c.json");
        Files.writeString(file, "{\"siteMode\":\"whatever\"}", StandardCharsets.UTF_8);
        assertEquals(SiteMode.LOCAL, SkyIndexConfig.load(file).siteMode);
    }

    @Test
    @DisplayName("a corrupt config file falls back to defaults instead of failing to load")
    void corruptFileFallsBack(@TempDir Path dir) throws IOException {
        Path file = dir.resolve("c.json");
        Files.writeString(file, "{ this is not json", StandardCharsets.UTF_8);

        SkyIndexConfig config = SkyIndexConfig.load(file);
        assertEquals(SiteMode.LOCAL, config.siteMode);
        assertEquals(27916, config.httpPort);
    }

    @Test
    @DisplayName("an out-of-range port is ignored rather than used")
    void rejectsBadPort(@TempDir Path dir) throws IOException {
        Path file = dir.resolve("c.json");
        Files.writeString(file, "{\"httpPort\":99999}", StandardCharsets.UTF_8);
        assertEquals(27916, SkyIndexConfig.load(file).httpPort);
    }

    @Test
    @DisplayName("loading a missing file yields defaults")
    void missingFile(@TempDir Path dir) {
        assertEquals(SiteMode.LOCAL, SkyIndexConfig.load(dir.resolve("nope.json")).siteMode);
    }
}
