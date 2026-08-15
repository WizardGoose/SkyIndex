import { beforeEach, describe, expect, it, vi } from "vitest";
import type { DesignerPlacement } from "../../context/DesignerContext";
import type { SavedLayout } from "../../types/layout";
import {
  clearDesignerRecovery,
  createDesignerTimeline,
  designerShortcut,
  loadDesignerRecovery,
  pushDesignerTimeline,
  redoDesignerTimeline,
  saveDesignerRecovery,
  toMostRecentLayout,
  undoDesignerTimeline,
  type DesignerWorkspace,
} from "../designerWorkspace";

class MemoryStorage {
  readonly values = new Map<string, string>();
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { this.values.set(key, String(value)); }
  removeItem(key: string) { this.values.delete(key); }
  clear() { throw new Error("designer recovery must never clear unrelated site data"); }
}

const placement = (id: string, cropId = "wheat"): DesignerPlacement => ({
  id,
  cropId,
  cropName: cropId,
  size: 1,
  position: [0, 0],
  isMutation: false,
});

const namedLayout = (id: string): SavedLayout => ({
  id,
  name: id,
  savedAt: 10,
  modifiedAt: 10,
  inputs: [{ cropId: "wheat", position: [0, 0] }],
  targets: [],
});

const workspace = (id = "active"): DesignerWorkspace => ({
  inputPlacements: [placement(id)],
  targetPlacements: [],
  mostRecent: null,
  savedLayouts: [namedLayout("saved")],
});

describe("designer timeline", () => {
  it("keeps exactly one Most Recent layout when a load replaces the active design", () => {
    const before = workspace("before-load");
    const after = { ...before, inputPlacements: [placement("loaded", "carrot")] };

    const timeline = pushDesignerTimeline(createDesignerTimeline(before), after, {
      captureMostRecent: true,
      now: 1234,
    });

    expect(timeline.present.inputPlacements[0].id).toBe("loaded");
    expect(timeline.present.mostRecent).toMatchObject({
      inputPlacements: [{ id: "before-load" }],
      capturedAt: 1234,
    });
    expect(toMostRecentLayout(timeline.present.mostRecent)?.name).toBe("Most Recent");
  });

  it("undoes and redoes edits, clears and loads in their original order", () => {
    const first = createDesignerTimeline(workspace("first"));
    const edited = pushDesignerTimeline(first, {
      ...first.present,
      inputPlacements: [placement("edited")],
    });
    const cleared = pushDesignerTimeline(edited, {
      ...edited.present,
      inputPlacements: [],
    }, { captureMostRecent: true, now: 2000 });

    const undoClear = undoDesignerTimeline(cleared);
    expect(undoClear.present.inputPlacements[0].id).toBe("edited");
    const undoEdit = undoDesignerTimeline(undoClear);
    expect(undoEdit.present.inputPlacements[0].id).toBe("first");
    const redoEdit = redoDesignerTimeline(undoEdit);
    expect(redoEdit.present.inputPlacements[0].id).toBe("edited");
    expect(redoDesignerTimeline(redoEdit).present.inputPlacements).toEqual([]);
  });

  it("restores one deleted named layout through the same undo stack", () => {
    const initial = createDesignerTimeline(workspace());
    const deleted = pushDesignerTimeline(initial, {
      ...initial.present,
      savedLayouts: [],
    });

    expect(deleted.present.savedLayouts).toEqual([]);
    expect(undoDesignerTimeline(deleted).present.savedLayouts).toEqual([namedLayout("saved")]);
  });

  it("bounds the undo stack", () => {
    let timeline = createDesignerTimeline(workspace("0"));
    for (let i = 1; i <= 75; i++) {
      timeline = pushDesignerTimeline(timeline, {
        ...timeline.present,
        inputPlacements: [placement(String(i))],
      });
    }
    expect(timeline.past).toHaveLength(50);
  });
});

describe("designer keyboard shortcuts", () => {
  const key = (value: string, target?: unknown) => ({
    key: value,
    ctrlKey: true,
    metaKey: false,
    altKey: false,
    shiftKey: false,
    target,
  });

  it("maps Ctrl+Z to undo and Ctrl+U to redo", () => {
    expect(designerShortcut(key("z"))).toBe("undo");
    expect(designerShortcut(key("U"))).toBe("redo");
  });

  it("leaves typing fields and modified shortcuts alone", () => {
    expect(designerShortcut(key("z", { tagName: "INPUT" }))).toBeNull();
    expect(designerShortcut({ ...key("u"), shiftKey: true })).toBeNull();
  });
});

describe("designer crash recovery", () => {
  let storage: MemoryStorage;

  beforeEach(() => {
    storage = new MemoryStorage();
    vi.stubGlobal("localStorage", storage);
  });

  it("restores the active design and its one Most Recent slot", () => {
    const active = workspace("active");
    active.mostRecent = {
      inputPlacements: [placement("recent")],
      targetPlacements: [],
      capturedAt: 321,
    };

    expect(saveDesignerRecovery(active)).toBe(true);
    expect(loadDesignerRecovery()).toMatchObject({
      inputPlacements: [{ id: "active" }],
      mostRecent: { inputPlacements: [{ id: "recent" }], capturedAt: 321 },
    });
  });

  it("falls back to the previous valid backup when the newest record is corrupt", () => {
    expect(saveDesignerRecovery(workspace("valid"))).toBe(true);
    expect(saveDesignerRecovery(workspace("newer"))).toBe(true);
    const currentKey = [...storage.values.keys()].find((key) => key.includes("recovery.current"));
    expect(currentKey).toBeTruthy();
    storage.setItem(currentKey!, "{broken-json");

    expect(loadDesignerRecovery()?.inputPlacements[0].id).toBe("valid");
  });

  it("forgets only its own recovery records", () => {
    storage.setItem("some-other-feature", "keep me");
    saveDesignerRecovery(workspace());

    clearDesignerRecovery();

    expect(storage.getItem("some-other-feature")).toBe("keep me");
    expect([...storage.values.keys()].filter((key) => key.includes("designer.recovery"))).toEqual([]);
  });
});
