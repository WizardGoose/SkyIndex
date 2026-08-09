import { describe, it, expect } from "vitest";
import { detectContainer, nbt, readNbtBlob, writeNbt, writeNbtBlob, readInventoryItems, readItemIds, stripColourCodes } from "..";
import type { NbtCompound } from "..";

/**
 * The transport, and the SkyBlock projection on top of it.
 *
 * Hypixel hands these over as base64 of gzipped NBT, but the wrapper is not
 * guaranteed forever and has differed between fields and eras, so the reader
 * sniffs the magic bytes rather than assuming. These tests build each of the
 * three containers for real and check the sniffing end to end, because getting
 * this wrong produces a decode failure that looks exactly like a corrupt bag.
 */

const bytesOf = (base64: string): Uint8Array => {
  const binary = atob(base64);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
  return out;
};

const toBase64 = (bytes: Uint8Array): string => {
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary);
};

/** Compress with the browser's own streams, the same ones the reader uses. */
const compress = async (bytes: Uint8Array, format: "gzip" | "deflate"): Promise<Uint8Array> => {
  const stream = new Blob([bytes]).stream().pipeThrough(new CompressionStream(format));
  return new Uint8Array(await new Response(stream).arrayBuffer());
};

const sample = (): NbtCompound =>
  nbt.compound({
    i: nbt.list("compound", [
      nbt.compound({
        Count: nbt.byte(1),
        tag: nbt.compound({ ExtraAttributes: nbt.compound({ id: nbt.string("HEGEMONY_ARTIFACT") }) }),
      }),
    ]),
  });

describe("detectContainer", () => {
  it("recognises gzip by its magic bytes", async () => {
    expect(detectContainer(await compress(writeNbt("", sample()), "gzip"))).toBe("gzip");
  });

  it("recognises zlib by its header check", async () => {
    // `CompressionStream("deflate")` emits the zlib wrapper, which is why the
    // reader must decompress it as "deflate" and not "deflate-raw".
    const bytes = await compress(writeNbt("", sample()), "deflate");
    expect(bytes[0] & 0x0f).toBe(8);
    expect(detectContainer(bytes)).toBe("zlib");
  });

  it("recognises uncompressed NBT by its root tag byte", () => {
    expect(detectContainer(writeNbt("", sample()))).toBe("nbt");
  });

  it("recognises nothing else", () => {
    expect(detectContainer(Uint8Array.from([0x50, 0x4b, 0x03, 0x04]))).toBe("unknown"); // a zip
    expect(detectContainer(Uint8Array.from([0x7b, 0x22, 0x61]))).toBe("unknown"); // JSON
    expect(detectContainer(new Uint8Array(0))).toBe("unknown");
  });
});

describe("readNbtBlob", () => {
  it("round trips through gzip and base64, which is the real wire format", async () => {
    const base64 = await writeNbtBlob("", sample());
    // Proof it really is gzip on the wire, not just something we can read back.
    expect(bytesOf(base64).slice(0, 2)).toStrictEqual(Uint8Array.from([0x1f, 0x8b]));

    const doc = await readNbtBlob(base64);
    expect(readItemIds(doc.value)).toStrictEqual(["HEGEMONY_ARTIFACT"]);
  });

  it("reads a zlib blob", async () => {
    const base64 = toBase64(await compress(writeNbt("", sample()), "deflate"));
    const doc = await readNbtBlob(base64);
    expect(readItemIds(doc.value)).toStrictEqual(["HEGEMONY_ARTIFACT"]);
  });

  it("reads an uncompressed blob", async () => {
    const base64 = toBase64(writeNbt("", sample()));
    const doc = await readNbtBlob(base64);
    expect(readItemIds(doc.value)).toStrictEqual(["HEGEMONY_ARTIFACT"]);
  });

  it("refuses bytes that are no container it knows", async () => {
    await expect(readNbtBlob(toBase64(Uint8Array.from([0x50, 0x4b, 0x03, 0x04])))).rejects.toThrow();
  });

  it("refuses input that is not base64 at all", async () => {
    await expect(readNbtBlob("!!! not base64 !!!")).rejects.toThrow();
  });

  it("refuses an empty string", async () => {
    await expect(readNbtBlob("")).rejects.toThrow();
  });

  it("refuses a truncated gzip stream", async () => {
    const full = await compress(writeNbt("", sample()), "gzip");
    await expect(readNbtBlob(toBase64(full.slice(0, Math.floor(full.length / 2))))).rejects.toThrow();
  });

  it("handles a bag the size Hypixel actually sends", async () => {
    /*
     * A real accessory bag decodes to 92,788 bytes, so a bag of this
     * order is the ordinary case rather than a stress test. Worth one run
     * because the base64 helpers chunk their work, and a chunking bug only
     * shows up above the chunk size.
     */
    const many = Array.from({ length: 600 }, (_, n) =>
      nbt.compound({
        Count: nbt.byte(1),
        tag: nbt.compound({
          ExtraAttributes: nbt.compound({ id: nbt.string(`ACCESSORY_${n}`), uuid: nbt.string("x".repeat(36)) }),
          display: nbt.compound({ Name: nbt.string(`§bAccessory ${n}`) }),
        }),
      })
    );
    const base64 = await writeNbtBlob("", nbt.compound({ i: nbt.list("compound", many) }));
    const ids = readItemIds((await readNbtBlob(base64)).value);

    expect(ids).toHaveLength(600);
    expect(ids[599]).toBe("ACCESSORY_599");
  });
});

describe("readInventoryItems", () => {
  it("projects every field it claims to, and keeps the slot", () => {
    const root = nbt.compound({
      i: nbt.list("compound", [
        nbt.compound({}),
        nbt.compound({
          Count: nbt.byte(3),
          tag: nbt.compound({
            display: nbt.compound({
              Name: nbt.string("§6Bioanalysis §lRing"),
              Lore: nbt.list("string", [nbt.string("§7Grants stuff."), nbt.string("§6§lLEGENDARY ACCESSORY")]),
            }),
            ExtraAttributes: nbt.compound({
              id: nbt.string("BIOANALYSIS_RING"),
              modifier: nbt.string("spicy"),
              rarity_upgrades: nbt.int(1),
              uuid: nbt.string("abc-123"),
              enchantments: nbt.compound({ sharpness: nbt.int(5), critical: nbt.int(6) }),
            }),
          }),
        }),
      ]),
    });

    const items = readInventoryItems(root);

    // The empty slot is skipped, not reported as an item with no id.
    expect(items).toHaveLength(1);
    expect(items[0].slot).toBe(1);
    expect(items[0].id).toBe("BIOANALYSIS_RING");
    expect(items[0].count).toBe(3);
    expect(items[0].name).toBe("Bioanalysis Ring");
    expect(items[0].lore).toStrictEqual(["Grants stuff.", "LEGENDARY ACCESSORY"]);
    expect(items[0].reforge).toBe("spicy");
    expect(items[0].rarityUpgrades).toBe(1);
    expect(items[0].uuid).toBe("abc-123");
    expect(items[0].enchantments).toStrictEqual({ sharpness: 5, critical: 6 });
  });

  it("answers null for absent fields rather than zero or empty string", () => {
    const root = nbt.compound({
      i: nbt.list("compound", [
        nbt.compound({
          Count: nbt.byte(1),
          tag: nbt.compound({ ExtraAttributes: nbt.compound({ id: nbt.string("WOLF_TALISMAN") }) }),
        }),
      ]),
    });

    const item = readInventoryItems(root)[0];
    // Absent is not "none". A zero here would read as "recombobulated zero
    // times", which is a claim we were not given the data to make.
    expect(item.name).toBeNull();
    expect(item.lore).toBeNull();
    expect(item.reforge).toBeNull();
    expect(item.rarityUpgrades).toBeNull();
    expect(item.enchantments).toBeNull();
  });

  it("reads an empty container as empty rather than malformed", () => {
    // An empty list is legitimately typed TAG_End, not TAG_Compound.
    expect(readInventoryItems(nbt.compound({ i: nbt.list("end", []) }))).toStrictEqual([]);
  });

  it("refuses a document that is not an inventory", () => {
    expect(() => readInventoryItems(nbt.compound({ notI: nbt.int(1) }))).toThrow(/`i`/);
  });
});

describe("stripColourCodes", () => {
  it("removes the formatting codes a display name carries", () => {
    expect(stripColourCodes("§6Bioanalysis §lRing")).toBe("Bioanalysis Ring");
    expect(stripColourCodes("plain")).toBe("plain");
  });
});
