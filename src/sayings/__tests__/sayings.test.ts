import { describe, expect, it } from "vitest";
import { ACTIVITIES, MOODS, QUANTITY_WORDS, hasLongDash, isUsableName, usableNames } from "../banks";
import { FIXED_BANKS, MAX_LENGTH, PATTERNS, isSlot } from "../patterns";
import { countSayings, explainCount, pickSaying, prepareSayings } from "../sayings";
import { makeRng, seedFrom } from "../prng";

/**
 * A stand-in for the live index.
 *
 * Built rather than imported, because the real names are fetched from the wiki
 * at runtime and are deliberately not bundled with this app. What matters for
 * these tests is the shape of the data and not its contents: a couple of
 * thousand Title Case names spread across the length range the real index
 * spans, from three characters to well past any pattern's budget.
 */
const POOL = (() => {
  const heads = ["Foul", "Enchanted", "Glacial", "Hollow", "Bitter", "Sunken", "Radiant", "Withered", "Gilded", "Frozen"];
  const tails = ["Flesh", "Diamond", "Lantern", "Root", "Husk", "Bloom", "Cinder", "Shard", "Kernel", "Fragment"];
  const out: string[] = ["Cod", "Mist", "Grove", "Choconut", "Veilshroom"];

  for (const h of heads) {
    for (const t of tails) {
      out.push(`${h} ${t}`);
      out.push(`${h} ${t} of the Deepening Hollow Below`);
    }
  }
  return out;
})();

const deck = prepareSayings(POOL);

/** A big spread of sentences, drawn from consecutive seeds. */
const sample = (n: number, d = deck): string[] => Array.from({ length: n }, (_, i) => pickSaying(d, i));

describe("banks", () => {
  it("holds no punctuation, padding or double spacing", () => {
    for (const entry of [...ACTIVITIES, ...MOODS, ...QUANTITY_WORDS]) {
      expect(entry).toBe(entry.trim());
      expect(entry.length).toBeGreaterThan(0);
      expect(entry).not.toMatch(/\s{2}/);
      expect(entry).not.toMatch(/[.?!;:]/);
    }
  });

  it("rejects names that would read badly in a sentence", () => {
    expect(isUsableName("Foul Flesh")).toBe(true);
    expect(isUsableName("Emperor's Skull")).toBe(true);
    expect(isUsableName("Gill Membrane, 64")).toBe(false);
    expect(isUsableName("Inferno Minion Fuel (Crude Gabagool Legendary)")).toBe(false);
    expect(isUsableName("2 IQ Points")).toBe(false);
    expect(isUsableName(" Padded ")).toBe(false);
    expect(isUsableName("Double  Space")).toBe(false);
    expect(isUsableName("No")).toBe(false);
    /* A spaced hyphen is a dash by function. A hyphen inside a word is not. */
    expect(isUsableName("Perfect Chestplate - Tier XI")).toBe(false);
    expect(isUsableName("Anti-Healing Potion")).toBe(true);
  });

  it("dedupes and preserves order", () => {
    expect(usableNames(["Cod", "Mist", "Cod", "2 Bad"])).toEqual(["Cod", "Mist"]);
  });

  it("groups digits without depending on the machine locale", () => {
    expect(QUANTITY_WORDS).toContain("64");
    expect(QUANTITY_WORDS).toContain("1,024");
    expect(QUANTITY_WORDS).toContain("25,600");
    expect(QUANTITY_WORDS).toContain("102,400");
  });
});

describe("patterns", () => {
  it("never puts an indefinite article in front of a slot", () => {
    for (const p of PATTERNS) {
      p.parts.forEach((part, i) => {
        if (!isSlot(part) || i === 0) return;
        const before = p.parts[i - 1];
        if (typeof before !== "string") return;
        expect(before, `${p.id} leads a slot with an article`).not.toMatch(/\b(a|an)\s+$/i);
      });
    }
  });

  it("gives every slot a bank that exists", () => {
    for (const p of PATTERNS) {
      for (const part of p.parts) {
        if (!isSlot(part) || part.kind === "thing") continue;
        expect(FIXED_BANKS[part.kind].length).toBeGreaterThan(0);
      }
    }
  });

  it("has unique ids and positive weights", () => {
    const ids = PATTERNS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const p of PATTERNS) expect(p.weight).toBeGreaterThan(0);
  });

  it("keeps the house line first and heaviest", () => {
    expect(PATTERNS[0].id).toBe("house");
    expect(PATTERNS[0].parts).toEqual(["What are we grinding?"]);
    for (const p of PATTERNS.slice(1)) expect(p.weight).toBeLessThan(PATTERNS[0].weight);
  });
});

describe("grammaticality by construction", () => {
  const strings = sample(20000);

  it("produces a well formed sentence every time", () => {
    for (const s of strings) {
      expect(s).toBe(s.trim());
      expect(s).not.toMatch(/\s{2}/);
      expect(s).not.toMatch(/\s[.?,]/);
      expect(s).toMatch(/[.?]$/);
      expect(s).toMatch(/^[A-Z0-9]/);
      /* "Cod?" is the shortest thing this can say, and it is a fine one. */
      expect(s.length).toBeGreaterThanOrEqual(4);
    }
  });

  it("never exceeds the field's character budget", () => {
    for (const s of strings) expect(s.length).toBeLessThanOrEqual(MAX_LENGTH);
  });

  it("never leaves a slot empty or unresolved", () => {
    for (const s of strings) {
      expect(s).not.toContain("undefined");
      expect(s).not.toContain("[object");
      expect(s).not.toMatch(/\bx\?/);
      expect(s).not.toMatch(/^,|,,|, ?\?/);
    }
  });

  it("never emits an em dash or an en dash", () => {
    for (const s of strings) expect(hasLongDash(s)).toBe(false);
  });

  it("carries no long dash in any literal or bank entry either", () => {
    for (const entry of [...ACTIVITIES, ...MOODS, ...QUANTITY_WORDS]) expect(hasLongDash(entry)).toBe(false);
    for (const p of PATTERNS) {
      for (const part of p.parts) {
        if (typeof part === "string") expect(hasLongDash(part)).toBe(false);
      }
    }
  });

  it("never repeats a name inside the two noun pattern", () => {
    const pairs = strings.filter((s) => s.includes(", or "));
    expect(pairs.length).toBeGreaterThan(100);
    for (const s of pairs) {
      const [left, right] = s.replace(/\?$/, "").split(", or ");
      expect(left).not.toBe(right);
      expect(POOL).toContain(left);
      expect(POOL).toContain(right);
    }
  });
});

describe("seeding", () => {
  it("reproduces a sentence from its seed", () => {
    for (const seed of [0, 1, 7, 12345, 99999]) {
      expect(pickSaying(deck, seed)).toBe(pickSaying(deck, seed));
    }
    expect(pickSaying(deck, "choconut")).toBe(pickSaying(deck, "choconut"));
  });

  it("folds strings and numbers into distinct seeds", () => {
    expect(seedFrom("choconut")).not.toBe(seedFrom("choconuts"));
    expect(seedFrom(7)).toBe(7);
  });

  /**
   * Two thousand consecutive seeds do not give two thousand distinct
   * sentences, and should not. The house line is one string drawn about one
   * time in six, and the four patterns that need no index draw from banks of
   * twenty and a hundred, so they collide by design. The thing-bearing
   * patterns are the ones that have to spread, and they do: the only strings
   * that repeat more than a handful of times are the small-bank ones.
   */
  it("spreads as widely as the bank sizes allow", () => {
    const strings = sample(2000);
    const seen = new Map<string, number>();
    for (const s of strings) seen.set(s, (seen.get(s) ?? 0) + 1);

    expect(seen.size).toBeGreaterThan(1100);

    const [top] = [...seen.entries()].sort((a, b) => b[1] - a[1]);
    expect(top[0]).toBe("What are we grinding?");

    /* Every sentence carrying a name is drawn from a set of at least a
       hundred, so none of them should be piling up. */
    for (const [s, n] of seen) {
      if (s.startsWith("What are we ") || s.startsWith("Time to stop ") || s.startsWith("Are we still ")) continue;
      expect(n, s).toBeLessThan(12);
    }
  });

  it("runs uniformly enough to trust the weighting", () => {
    const rng = makeRng("uniformity");
    const buckets = [0, 0, 0, 0];
    for (let i = 0; i < 40000; i++) buckets[Math.floor(rng() * 4)] += 1;
    for (const b of buckets) expect(Math.abs(b - 10000)).toBeLessThan(600);
  });
});

describe("weighting", () => {
  const strings = sample(40000);
  const house = strings.filter((s) => s === "What are we grinding?").length;

  it("shows the house line more often than anything else", () => {
    const counts = new Map<string, number>();
    for (const p of PATTERNS) counts.set(p.id, 0);

    /* Every other pattern is weight one, so its share is bounded by the house
       line's share divided by four. Comparing against the single most common
       non-house sentence would be noise, so the comparison is against the
       whole activity-only family, which is the largest fixed size group. */
    const activityOnly = strings.filter((s) => s.startsWith("What are we ") && s !== "What are we grinding?").length;
    expect(house).toBeGreaterThan(activityOnly);
  });

  it("lands close to the four in twenty seven share the weights imply", () => {
    const expected = 4 / PATTERNS.reduce((n, p) => n + p.weight, 0);
    const actual = house / strings.length;
    expect(actual).toBeGreaterThan(expected * 0.85);
    expect(actual).toBeLessThan(expected * 1.15);
    expect(actual).toBeGreaterThan(0.1);
    expect(actual).toBeLessThan(0.25);
  });
});

describe("counting", () => {
  it("matches a brute force enumeration on a small pool", () => {
    const small = prepareSayings(["Cod", "Mist", "Grove", "Choconut", "Veilshroom"]);

    const all = new Set<string>();
    for (const prepared of small.usable) {
      const slots = prepared.pattern.parts.filter(isSlot);
      const options = slots.map((s) => (s.kind === "thing" ? prepared.things : FIXED_BANKS[s.kind]));

      const walk = (depth: number, chosen: string[]) => {
        if (depth === options.length) {
          /* Skip the assignments the drawer can never make: a name twice. */
          const things = chosen.filter((_, i) => slots[i].kind === "thing");
          if (new Set(things).size !== things.length) return;

          let out = "";
          let slot = 0;
          for (const part of prepared.pattern.parts) out += isSlot(part) ? chosen[slot++] : part;
          all.add(out);
          return;
        }
        for (const opt of options[depth]) walk(depth + 1, [...chosen, opt]);
      };
      walk(0, []);
    }

    expect(countSayings(small)).toBe(all.size);
  });

  it("only reports patterns it can actually draw", () => {
    for (const row of explainCount(deck)) expect(row.combinations).toBeGreaterThan(0);
    expect(explainCount(deck).reduce((n, r) => n + r.combinations, 0)).toBe(countSayings(deck));
  });

  it("grows with the index and is a plain sum of products", () => {
    const half = prepareSayings(POOL.slice(0, Math.floor(POOL.length / 2)));
    expect(countSayings(half)).toBeLessThan(countSayings(deck));
    expect(countSayings(deck)).toBeGreaterThan(10000);
  });
});

describe("degraded states", () => {
  it("still speaks with no index at all", () => {
    const empty = prepareSayings([]);
    expect(empty.usable.length).toBeGreaterThan(0);
    expect(empty.nameCount).toBe(0);

    for (const s of sample(500, empty)) {
      expect(s).toMatch(/^[A-Z]/);
      expect(s).toMatch(/[.?]$/);
      expect(s).not.toMatch(/\s{2}/);
      expect(s.length).toBeLessThanOrEqual(MAX_LENGTH);
    }
    expect(sample(200, empty)).toContain("What are we grinding?");
  });

  it("drops the two noun pattern when only one name is eligible", () => {
    const one = prepareSayings(["Cod"]);
    expect(one.usable.some((p) => p.pattern.id === "or")).toBe(false);
    expect(one.usable.some((p) => p.pattern.id === "bare")).toBe(true);
  });

  it("excludes names too long for a given pattern rather than clipping them", () => {
    const long = "Perma Jelled Garlic Flavoured Reheated Gummy Polar Bear";
    const d = prepareSayings(["Cod", long]);
    const mines = d.usable.find((p) => p.pattern.id === "mines");
    expect(mines?.things).toEqual(["Cod"]);
    for (const s of sample(400, d)) expect(s.length).toBeLessThanOrEqual(MAX_LENGTH);
  });
});
