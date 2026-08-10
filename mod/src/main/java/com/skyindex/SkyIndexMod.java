package com.skyindex;

import com.skyindex.capture.ContainerCapture;
import com.skyindex.capture.SackChatListener;
import com.skyindex.command.SkyIndexCommand;
import com.skyindex.compat.ClientCompat;
import com.skyindex.config.SiteMode;
import com.skyindex.config.SkyIndexConfig;
import com.skyindex.data.IslandSnapshot;
import com.skyindex.data.SnapshotStore;
import com.skyindex.data.StoreManager;
import com.skyindex.export.ExportCodec;
import com.skyindex.garden.GreenhouseScanner;
import com.skyindex.gui.SkyIndexScreen;
import com.skyindex.http.SkyIndexHttpServer;
import com.skyindex.layout.GreenhouseLayout;
import com.skyindex.layout.LayoutStore;
import com.skyindex.location.LocationTracker;
import com.skyindex.render.LayoutOverlayRenderer;
import net.fabricmc.api.ClientModInitializer;
import net.fabricmc.fabric.api.client.command.v2.ClientCommandRegistrationCallback;
import net.fabricmc.fabric.api.client.event.lifecycle.v1.ClientLifecycleEvents;
import net.fabricmc.fabric.api.client.event.lifecycle.v1.ClientTickEvents;
import net.fabricmc.fabric.api.client.networking.v1.ClientPlayConnectionEvents;
import net.fabricmc.fabric.api.client.screen.v1.ScreenEvents;
import net.fabricmc.fabric.api.event.player.UseBlockCallback;
import net.fabricmc.loader.api.FabricLoader;
import net.minecraft.client.Minecraft;
import net.minecraft.client.gui.screens.Screen;
import net.minecraft.world.InteractionResult;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.nio.file.Path;

/**
 * Client entrypoint.
 *
 * <p>Everything here is passive: the mod reads the scoreboard, the tab list and
 * the contents of screens the player opened themselves. It never sends a packet
 * or a command on the player's behalf, which is the constraint the spec sets
 * for Hypixel-rules compliance.
 *
 * <p>No mixins and no access widener — {@code CustomData.copyTag()} and the
 * Fabric screen/interaction events cover every hook needed, which keeps the mod
 * from breaking on Minecraft updates the way a mixin would.
 */
public final class SkyIndexMod implements ClientModInitializer {

    public static final String MOD_ID = "skyindex";
    private static final Logger LOGGER = LoggerFactory.getLogger("SkyIndex");

    /** Rescan location/profile every second; it changes rarely. */
    private static final int LOCATION_INTERVAL_TICKS = 20;
    /** Refresh the player inventory snapshot every 5 seconds. */
    private static final int INVENTORY_INTERVAL_TICKS = 100;
    /** Flush dirty stores every 30 seconds. */
    private static final int SAVE_INTERVAL_TICKS = 600;

    private Path configFile;
    private SkyIndexConfig config;
    private StoreManager stores;
    private LocationTracker location;
    private ContainerCapture capture;
    private GreenhouseScanner greenhouse;
    private LayoutStore layouts;
    private LayoutOverlayRenderer overlay;
    private SkyIndexHttpServer httpServer;
    private String modVersion = "unknown";

    private int ticks;

    /** One fence per hook, so a failure in one does not silence the others. */
    private final CaptureGuard tickGuard = new CaptureGuard("tick");
    private final CaptureGuard screenGuard = new CaptureGuard("screen");
    private final CaptureGuard interactGuard = new CaptureGuard("block interaction");
    /**
     * Fenced separately from the tick so a failure in the world scan cannot take
     * container capture, location tracking or the inventory refresh down with
     * it. The scan touches entity and block lookups the other paths never do, so
     * it is the likeliest of them to meet something unexpected.
     */
    private final CaptureGuard greenhouseGuard = new CaptureGuard("greenhouse scan");
    /**
     * Opening a screen straight from a command loses the race with the chat
     * screen closing, so the request is parked here and honoured on the next
     * tick instead.
     */
    private Screen pendingScreen;

    @Override
    public void onInitializeClient() {
        Path configDir = FabricLoader.getInstance().getConfigDir().resolve(MOD_ID);
        this.configFile = configDir.resolve("config.json");
        this.modVersion = FabricLoader.getInstance().getModContainer(MOD_ID)
                .map(c -> c.getMetadata().getVersion().getFriendlyString())
                .orElse("unknown");

        // Before anything else: load every class the tick, screen, chat and
        // render paths can reach. Left lazy, a class first touched hours into a
        // session can be read from a jar that has since been replaced on disk,
        // which is precisely what crashed the client once already.
        EagerClasses.loadAll();

        this.config = SkyIndexConfig.load(configFile);
        saveConfig();

        this.stores = new StoreManager(configDir);
        this.location = new LocationTracker();
        this.capture = new ContainerCapture(stores, location, config);
        this.greenhouse = new GreenhouseScanner(stores, location, config);
        this.layouts = LayoutStore.load(configDir.resolve("layout.json"));
        // Held rather than discarded: the overlay now also reads the world on
        // the client tick to work out which cells are already built, so it needs
        // ticking as well as registering.
        this.overlay = new LayoutOverlayRenderer(layouts, location);
        this.overlay.register();
        // Second sack path: keeps totals fresh between sack screen opens.
        new SackChatListener(stores, location).register();

        registerEvents();
        applySiteMode();

        LOGGER.info("SkyIndex {} ready ({} mode, data dir: {})",
                modVersion, config.siteMode.label(), configDir);
    }

    private void registerEvents() {
        // Every hook below runs on a vanilla thread, so each is fenced: a
        // failure disables that one path for the session instead of crashing
        // the client. A passive QoL mod is never worth taking the game down.
        ClientTickEvents.END_CLIENT_TICK.register(client -> tickGuard.run(() -> onTick(client)));

        ScreenEvents.AFTER_INIT.register((client, screen, width, height) -> screenGuard.run(() -> {
            capture.onScreenOpen(screen);
            ScreenEvents.remove(screen).register(
                    closed -> screenGuard.run(() -> capture.onScreenClose(closed)));
        }));

        UseBlockCallback.EVENT.register((player, level, hand, hit) -> {
            interactGuard.run(() -> {
                if (level.isClientSide() && config.captureEnabled) {
                    capture.onBlockInteract(Minecraft.getInstance(), hit.getBlockPos());
                }
            });
            // Purely observational: never consume the interaction.
            return InteractionResult.PASS;
        });

        ClientCommandRegistrationCallback.EVENT.register(
                (dispatcher, registry) -> SkyIndexCommand.register(dispatcher, this));

        ClientPlayConnectionEvents.DISCONNECT.register((handler, client) -> {
            stores.saveDirty();
            location.reset();
            capture.reset();
            greenhouse.reset();
        });

        ClientLifecycleEvents.CLIENT_STOPPING.register(client -> {
            stores.saveDirty();
            stopHttpServer();
        });
    }

    private void onTick(Minecraft client) {
        ticks++;
        if (pendingScreen != null) {
            Screen screen = pendingScreen;
            pendingScreen = null;
            ClientCompat.setScreen(client, screen);
        }
        capture.tick();
        // Its own fence, and its own interval inside the scanner.
        greenhouseGuard.run(() -> greenhouse.tick(client));
        // Already fenced inside, and it returns immediately unless the player
        // turned the projection on.
        overlay.tick(client);

        if (ticks % LOCATION_INTERVAL_TICKS == 0) {
            location.update(client);
            if (location.isOnSkyBlock() && client.player != null) {
                stores.activate(
                        client.player.getUUID().toString(),
                        client.player.getName().getString(),
                        location.profileName(),
                        location.gameMode());
            }
        }
        if (ticks % INVENTORY_INTERVAL_TICKS == 0) {
            capture.captureInventory(client);
        }
        if (ticks % SAVE_INTERVAL_TICKS == 0) {
            stores.saveDirty();
        }
    }

    // ------------------------------------------------------------ site mode

    /** Start or stop the local server so it matches the chosen mode. */
    public void applySiteMode() {
        if (config.siteMode.usesLocalServer()) {
            startHttpServer();
        } else {
            if (httpServer != null) {
                LOGGER.info("GitHub Pages mode: stopping the local server");
            }
            stopHttpServer();
        }
    }

    /** Called by the GUI. Persists immediately so the choice survives a crash. */
    public void setSiteMode(SiteMode mode) {
        if (mode == null || config.siteMode == mode) {
            return;
        }
        config.siteMode = mode;
        saveConfig();
        applySiteMode();
    }

    public void saveConfig() {
        try {
            config.save(configFile);
        } catch (IOException e) {
            LOGGER.warn("Could not write config", e);
        }
    }

    private void startHttpServer() {
        if (httpServer != null && httpServer.isRunning()) {
            return;
        }
        httpServer = new SkyIndexHttpServer(
                config.httpPort, modVersion, stores::activeJson, stores::activeVersion);
        httpServer.setLayoutSink(this::acceptLayout);
        try {
            httpServer.start();
            LOGGER.info("Serving island data on http://127.0.0.1:{}/v1/island (events at /v1/events)",
                    httpServer.port());
        } catch (IOException e) {
            LOGGER.warn("Could not bind 127.0.0.1:{} - live transport disabled ({})",
                    config.httpPort, e.toString());
            httpServer = null;
        }
    }

    private void stopHttpServer() {
        if (httpServer != null) {
            httpServer.stop();
            httpServer = null;
        }
    }

    // --------------------------------------------------------------- layout

    /**
     * Called on an HTTP worker thread when the site pushes a layout. Storing it
     * is all that happens here — drawing is decided later, on the render
     * thread, and only on the private island.
     */
    private void acceptLayout(GreenhouseLayout layout) {
        layouts.setLayout(layout);
        saveLayouts();
        LOGGER.info("Loaded layout \"{}\" ({} cells)", layout.label(), layout.cellCount());
    }

    public void saveLayouts() {
        try {
            layouts.save();
        } catch (IOException e) {
            LOGGER.warn("Could not write layout", e);
        }
    }

    public LayoutStore layouts() {
        return layouts;
    }

    public LayoutOverlayRenderer overlay() {
        return overlay;
    }

    // -------------------------------------------------------------- actions

    /** Queue the settings screen; it opens on the next tick. */
    public void openSettings() {
        pendingScreen = new SkyIndexScreen(this);
    }

    /**
     * Build the export code and put it on the clipboard.
     *
     * @return a human summary of what was copied, or null when nothing has been
     *         captured yet
     */
    public String copyExportCode() {
        SnapshotStore store = stores == null ? null : stores.active();
        if (store == null) {
            return null;
        }
        IslandSnapshot snapshot = store.toSnapshot(System.currentTimeMillis());
        if (!config.includeInventoryInExport()) {
            // The API already covers these, and they are most of the bulk.
            snapshot = snapshot.withoutApiCoveredSections();
        }
        String json = snapshot.toMinifiedJson();
        String code = ExportCodec.encode(json);
        Minecraft.getInstance().keyboardHandler.setClipboard(code);
        return humanBytes(code.length()) + " code (" + humanBytes(json.length()) + " uncompressed)";
    }

    public static String humanBytes(int bytes) {
        if (bytes < 1024) {
            return bytes + " B";
        }
        return String.format("%.1f KB", bytes / 1024.0);
    }

    public SkyIndexConfig config() {
        return config;
    }

    public StoreManager stores() {
        return stores;
    }

    public LocationTracker location() {
        return location;
    }

    public GreenhouseScanner greenhouse() {
        return greenhouse;
    }

    public SkyIndexHttpServer httpServer() {
        return httpServer;
    }

    public String modVersion() {
        return modVersion;
    }
}
