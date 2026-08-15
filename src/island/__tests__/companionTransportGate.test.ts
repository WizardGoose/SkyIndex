import { describe, expect, it } from "vitest";
import { createCompanionLinkStore } from "../companionLink";
import { createCompanionTransportGate } from "../companionTransportGate";

describe("companion transport permission gate", () => {
  it("keeps localhost completely idle until an opted-in subscriber exists", () => {
    const access = createCompanionLinkStore(null);
    const events: string[] = [];
    const gate = createCompanionTransportGate(
      access,
      () => events.push("start"),
      () => events.push("stop"),
    );

    const release = gate.request();
    expect(events).toEqual([]);

    access.sync("1");
    expect(events).toEqual(["start"]);

    access.sync(null);
    expect(events).toEqual(["start", "stop"]);

    release();
    gate.dispose();
    expect(events).toEqual(["start", "stop"]);
  });

  it("stops the transport when the final linked subscriber leaves", () => {
    const access = createCompanionLinkStore(null);
    access.sync("1");
    const events: string[] = [];
    const gate = createCompanionTransportGate(
      access,
      () => events.push("start"),
      () => events.push("stop"),
    );

    const releaseFirst = gate.request();
    const releaseSecond = gate.request();
    expect(events).toEqual(["start"]);

    releaseFirst();
    expect(events).toEqual(["start"]);
    releaseSecond();
    expect(events).toEqual(["start", "stop"]);
  });
});
