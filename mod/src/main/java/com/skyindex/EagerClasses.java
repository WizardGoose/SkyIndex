package com.skyindex;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.List;

/**
 * Forces every capture and codec class to load at startup.
 *
 * <p>The JVM loads classes lazily, so a class only reached from a tick or screen
 * handler may not be loaded until the player happens to trigger it — possibly
 * hours in. If the mod jar is replaced on disk in the meantime, the classloader
 * is still holding the old zip directory and reads the new file at stale
 * offsets. That is exactly what crashed the client: {@code SackLoreParser} had
 * never loaded, the player opened a composter, the sack path touched it for the
 * first time, and the read landed in the middle of a different file.
 *
 * <p>Loading everything up front costs a few milliseconds and closes that window
 * entirely: after startup there is nothing left to lazily read. It does not make
 * swapping a live jar safe — {@link com.skyindex.SkyIndexMod} cannot fix the
 * deployment process — but it removes the mod's own contribution to it.
 *
 * <p>{@code SkyIndexEagerClassesTest} fails the build if a class is added to the
 * capture or export packages without appearing here.
 */
public final class EagerClasses {

    private static final Logger LOGGER = LoggerFactory.getLogger("Skydex");

    /**
     * Every class reachable from a tick, screen, chat or render handler, plus
     * the codecs the export command reaches. Order is irrelevant.
     */
    public static final List<String> LOADED_EAGERLY = List.of(
            // Nested classes are listed individually and deliberately. A nested
            // class is a separate class file with its own entry in the jar, and
            // it loads on FIRST USE, not with its owner. That makes them the
            // worst case for the hazard this list exists for, not an exception
            // to it: ContainerCapture$1 is the switch map over ScreenKind, so it
            // is first touched when a container is captured, and
            // GreenhouseScanner$Scan only when a scan is fully corroborated,
            // both of which can be hours into a session.
            "com.skyindex.capture.ContainerCapture$1",
            "com.skyindex.capture.ContainerCapture$SlottedStack",
            "com.skyindex.capture.SackChatParser$Update",
            "com.skyindex.export.BinaryCodec$Pool",
            "com.skyindex.export.CompactCodec$Pool",
            "com.skyindex.export.ExportCodec$MaxCompressionGzip",
            "com.skyindex.garden.GreenhouseDiagnostics$Status",
            "com.skyindex.garden.GreenhouseScanner$Located",
            "com.skyindex.garden.GreenhouseScanner$Scan",
            "com.skyindex.http.SkyIndexHttpServer$SseClient",
            // The switch map over CellStatus, first touched when the player
            // looks at a cell with the progress view on.
            "com.skyindex.render.LayoutOverlayRenderer$1",
            // http: reached from the server's own worker threads
            "com.skyindex.http.SkyIndexHttpServer",
            "com.skyindex.http.SseFrames",
            // capture: reached from tick / screen / chat handlers
            "com.skyindex.capture.ChromeFilter",
            "com.skyindex.capture.ContainerCapture",
            "com.skyindex.capture.ItemIds",
            "com.skyindex.capture.SackChatListener",
            "com.skyindex.capture.SackChatParser",
            "com.skyindex.capture.SackLoreParser",
            "com.skyindex.capture.ScreenKind",
            "com.skyindex.capture.TitleParser",
            // export: reached from the copy command
            "com.skyindex.export.BinaryCodec",
            "com.skyindex.export.BinaryFormatException",
            "com.skyindex.export.BinaryReader",
            "com.skyindex.export.BinaryWriter",
            "com.skyindex.export.CompactCodec",
            "com.skyindex.export.ExportCodec",
            // garden: reached from the tick handler's greenhouse scan
            "com.skyindex.garden.BedBlocks",
            "com.skyindex.garden.BedShape",
            "com.skyindex.garden.BedShape$Bed",
            "com.skyindex.garden.GreenhouseOffset",
            "com.skyindex.garden.GreenhouseDiagnostics$Source",
            "com.skyindex.garden.CropDiagnosticsParser",
            "com.skyindex.garden.CropIds",
            "com.skyindex.garden.GardenGrid",
            "com.skyindex.garden.GreenhouseDiagnostics",
            "com.skyindex.garden.GreenhouseScanner",
            "com.skyindex.garden.MutationNames",
            // data: reached from every capture path
            "com.skyindex.data.ChestRecord",
            "com.skyindex.data.GreenhouseBoard",
            "com.skyindex.data.GreenhouseCell",
            "com.skyindex.data.IslandSnapshot",
            "com.skyindex.data.ItemEntry",
            "com.skyindex.data.ItemExtra",
            "com.skyindex.data.ItemNames",
            "com.skyindex.data.SkinTextures",
            "com.skyindex.data.SnapshotStore",
            "com.skyindex.data.StoreManager",
            // layout + render: reached from the render thread
            "com.skyindex.layout.CellStatus",
            "com.skyindex.layout.EstimateFormat",
            "com.skyindex.layout.GreenhouseLayout",
            "com.skyindex.layout.GridOrientation",
            "com.skyindex.layout.LayoutAnchor",
            "com.skyindex.layout.LayoutCell",
            "com.skyindex.layout.LayoutFormatException",
            "com.skyindex.layout.LayoutMatch",
            "com.skyindex.layout.LayoutPalette",
            "com.skyindex.layout.LayoutParser",
            "com.skyindex.layout.LayoutStore",
            "com.skyindex.render.LayoutOverlayRenderer",
            "com.skyindex.render.LayoutProgress",
            // location: reached from the tick handler
            "com.skyindex.location.GardenAreas",
            "com.skyindex.location.GameModes",
            "com.skyindex.location.LocationTracker");

    private EagerClasses() {
    }

    /**
     * Initialise every listed class. A class literal alone does not guarantee
     * initialisation, so each is loaded explicitly.
     */
    public static void loadAll() {
        int loaded = 0;
        ClassLoader loader = EagerClasses.class.getClassLoader();
        for (String name : LOADED_EAGERLY) {
            try {
                Class.forName(name, true, loader);
                loaded++;
            } catch (Throwable failure) {
                // A class that will not load is a real problem, but not one
                // worth refusing to start over.
                LOGGER.warn("Could not preload {}", name, failure);
            }
        }
        LOGGER.debug("Preloaded {} of {} classes", loaded, LOADED_EAGERLY.size());
    }
}
