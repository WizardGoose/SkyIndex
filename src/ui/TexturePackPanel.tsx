import React, { useRef, useState, useSyncExternalStore } from "react";
import { Upload, Trash2 } from "lucide-react";
import { parseTexturePack } from "../items/texturePackParse";
import {
  adoptTexturePack,
  packManifest,
  removeTexturePack,
  subscribeTexturePack,
  texturePackVersion,
} from "../items/texturePack";
import { ago } from "../island/format";
import { BTN, BTN_QUIET, PANEL, NUM, ControlGrid, ControlRow, SectionHead, Tag } from "./kit";

/**
 * The Settings block for the user-supplied texture pack.
 *
 * The whole feature rests on one rule: the pack is cached on the user's
 * side, violating nothing. The user downloads a pack
 * themselves (FurfSky Reborn from Modrinth, or any catharsis-format or
 * vanilla-layout pack), hands the zip to this panel, and it is parsed and
 * stored entirely in their own browser. This project distributes nothing:
 * not the pack, not its textures, not a byte of anyone's art. Removing it
 * here deletes the local copy outright.
 *
 * The summary is deliberately an honest ledger rather than a cheer: how
 * many item textures were actually recognised, and how many files were
 * ignored, because a GUI-and-armor-heavy pack contributes far fewer flat
 * item icons than its size suggests and the user deserves to know what
 * they got.
 */

/** Destructive control, in the kit's one destructive colour. */
const BTN_DANGER = `${BTN} bg-red-500/15 hover:bg-red-500/25 text-red-300 border-red-500/35 hover:border-red-400/50`;

type Phase = { state: "idle" } | { state: "reading" } | { state: "error"; message: string };

export const TexturePackPanel: React.FC = () => {
  useSyncExternalStore(subscribeTexturePack, texturePackVersion, texturePackVersion);
  const [phase, setPhase] = useState<Phase>({ state: "idle" });
  const inputRef = useRef<HTMLInputElement>(null);

  const loaded = packManifest();

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    setPhase({ state: "reading" });
    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      /*
       * Parsing is synchronous CPU work over the whole archive, which for a
       * tens-of-megabytes pack costs a moment of jank once, at the moment
       * the user just asked for exactly that. A worker would hide it and is
       * not worth the seam until somebody actually complains.
       */
      const parsed = parseTexturePack(bytes);
      await adoptTexturePack(parsed, file.name);
      setPhase({ state: "idle" });
    } catch (err) {
      setPhase({ state: "error", message: err instanceof Error ? err.message : "could not read that zip" });
    } finally {
      // The same file picked twice must fire change twice.
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const onRemove = async () => {
    await removeTexturePack();
    setPhase({ state: "idle" });
  };

  const counts = loaded?.counts;

  return (
    <div className={PANEL}>
      <SectionHead
        title="Texture pack"
        right={loaded ? <Tag accent>{loaded.name}</Tag> : <span className={`text-[10px] ${NUM} text-slate-400`}>none loaded</span>}
      />
      <div className="space-y-2 p-3">
        <p className="text-[11px] leading-relaxed text-slate-400">
          Load a SkyBlock texture pack you downloaded yourself and item icons across the whole site are drawn from it
          instead of the wiki. The zip is read and kept in this browser only; nothing is uploaded anywhere and nothing
          from the pack is ever served by this site to anyone else. Catharsis-format packs (FurfSky Reborn v2 and
          friends, including .cats archives) are read by SkyBlock item id; plain vanilla-layout packs contribute their
          vanilla item textures as a best effort. OptiFine CIT packs are not supported.
        </p>

        {loaded && counts && (
          <>
            <ControlGrid>
              {loaded.description && (
                <ControlRow label="Pack says" value={<span className="max-w-[16rem] truncate text-slate-300">{loaded.description}</span>} />
              )}
              <ControlRow
                label="Item textures recognised"
                value={<span className="text-emerald-300">{counts.recognised.toLocaleString()}</span>}
                hint={`${counts.catharsis} keyed by SkyBlock item id (catharsis layout), ${counts.vanilla} from the vanilla item-texture layout.`}
              />
              <ControlRow
                label="Files that are not item icons"
                value={<span className="text-slate-300">{counts.ignored.toLocaleString()}</span>}
                hint={`Of ${counts.files.toLocaleString()} files in the pack. Nothing was refused: these files describe things this site does not draw, listed below.`}
              />
              <ControlRow label="Loaded" value={<span className="text-slate-300">{ago(loaded.loadedAt)}</span>} />
            </ControlGrid>
            {/*
              The breakdown is body text rather than a hover, because a bare
              ignored-file count reads as the pack being refused
              (an easy "it refused 10k files" misreading). It was not refused;
              a catharsis pack is mostly GUI art and 3D armor work, and
              saying so is the difference between a count and an accusation.
              `ignoredClasses` is missing from a manifest stored before it
              existed, so its absence renders nothing rather than a lie.
            */}
            {(counts.ignoredClasses ?? []).length > 0 && (
              <p className="text-[11px] leading-relaxed text-slate-400">
                What those files are:{" "}
                {(counts.ignoredClasses ?? [])
                  .map((c) => `${c.count.toLocaleString()} ${c.label}`)
                  .join(", ")}
                .
              </p>
            )}
            {counts.special > 0 && (
              <p className="text-[11px] leading-snug text-amber-300/90">
                {counts.special.toLocaleString()} of those ARE item textures this site deliberately does not apply yet:
                per-variant looks for enchantments, potions, runes and attributes, which need item data an icon does
                not carry here.
              </p>
            )}
          </>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={inputRef}
            type="file"
            accept=".zip"
            className="sr-only"
            aria-hidden
            tabIndex={-1}
            onChange={(e) => void onFile(e.target.files?.[0])}
          />
          <button
            type="button"
            className={BTN_QUIET}
            disabled={phase.state === "reading"}
            onClick={() => inputRef.current?.click()}
          >
            <Upload className="h-3 w-3" />
            {phase.state === "reading" ? "Reading zip..." : loaded ? "Load a different zip" : "Load a pack zip"}
          </button>
          {loaded && (
            <button type="button" className={BTN_DANGER} onClick={() => void onRemove()}>
              <Trash2 className="h-3 w-3" />
              Remove
            </button>
          )}
          {phase.state === "error" && <span className="text-[11px] text-red-300">{phase.message}</span>}
        </div>

        <p className="text-[11px] leading-snug text-slate-400">
          The pack stays its author's work under its author's licence. Loading it here is your own local copy doing
          its job; this project bundles no pack and re-hosts none.
        </p>
      </div>
    </div>
  );
};

export default TexturePackPanel;
