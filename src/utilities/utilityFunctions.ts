export const formatTime = (decimalHours: number): string => {
  const totalSeconds = Math.round(decimalHours * 3600);

  if (totalSeconds < 60) {
    return `${totalSeconds} sec`;
  }

  const hours = Math.floor(decimalHours);
  const minutes = Math.round((decimalHours - hours) * 60);

  if (hours === 0) {
    return `${minutes} min`;
  }
  if (minutes === 0 || isNaN(minutes)) {
    return `${hours} hr`;
  }
  return `${hours} hr ${minutes} min`;
};

export const formatNumber = (num: number): string => {
  if (num === 0) return "0";
  if (num < 0.01) return num.toFixed(4);
  if (num < 1) return num.toFixed(2);
  return num.toFixed(2).replace(/\.00$/, "");
};

export const getRarityColor = (rarity: string): string => {
  // Rarity is game data, so it points at the dedicated rarity tokens rather
  // than at generic Tailwind ramps. Those ramps are chrome and get remapped
  // when the site is retinted: this map used to say `text-purple-400` for
  // epic, which turned every epic shard name into the accent blue the moment
  // purple folded into it. The rarity-* tokens cannot be reached that way.
  // Values come from the game's own colour codes, see index.css.
  const colors = {
    common: "text-rarity-common",
    uncommon: "text-rarity-uncommon",
    rare: "text-rarity-rare",
    epic: "text-rarity-epic",
    legendary: "text-rarity-legendary",
  };
  return colors[rarity as keyof typeof colors] || "text-rarity-common";
};

export const formatLargeNumber = (num: number): string => {
  const absNum = Math.abs(num);
  let formatted: string;
  if (absNum >= 1000000000) {
    formatted = (absNum / 1000000000).toFixed(2) + "B";
  } else if (absNum >= 1000000) {
    formatted = (absNum / 1000000).toFixed(2) + "M";
  } else if (absNum >= 1000) {
    formatted = (absNum / 1000).toFixed(2) + "K";
  } else {
    formatted = absNum.toFixed(2);
  }
  formatted = formatted.replace(/\.00(?=[KMB]|$)/, "");
  return num < 0 ? "-" + formatted : formatted;
};

export function debounce<TArgs extends unknown[], TReturn>(func: (...args: TArgs) => TReturn, wait: number): (...args: TArgs) => void {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  return (...args: TArgs) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => {
      func(...args);
    }, wait);
  };
}

// Stat icon configurations for color mapping
interface StatIconConfig {
  color: string;
  keywords: readonly string[];
  specific?: Record<string, string>;
}

// Stat colours are game data, not theme.
//
// SkyBlock gives every stat a Minecraft colour code and the player already
// knows them: gold is fortune, red is strength, aqua is intelligence. So these
// point at the dedicated `stat-*` tokens, which exist for exactly one reason -
// a generic ramp like `orange-400` or `purple-400` is chrome, and chrome gets
// remapped. That already bit this map once: Attack Speed was `text-orange-400`
// and turned blue the day orange folded into the site accent. Nothing in the
// `stat-*` namespace can be reached by a chrome remap.
//
// Every colour below was read off the game's own data rather than guessed. The
// Hypixel wiki's Module_Stat_Data.lua is vendored in this repo at
// data/wiki/modules/ and records a colour name per stat; the token names here
// are those same Minecraft colour names. Where this map disagreed with the
// game it has been corrected, not preserved.
const STAT_ICON_CONFIG: Record<string, StatIconConfig> = {
  "❤": { color: "text-stat-red", keywords: ["Health"] },
  "❁": { color: "text-stat-red", keywords: ["Strength", "Damage"] },
  // Crit Damage is &9 blue in game, not red. Same code as the Rare tier.
  "☠": { color: "text-stat-blue", keywords: ["Crit Damage"] },
  // Vitality is &4 dark red; Heat Resistance shares the glyph but is &c red.
  "♨": { color: "text-stat-dark-red", keywords: ["Vitality"], specific: { "Heat Resistance": "text-stat-red" } },
  "❈": { color: "text-stat-green", keywords: ["Defense"] },
  // Health Regen is &c red in game. It is a health stat, not a defense one.
  "❣": { color: "text-stat-red", keywords: ["Health Regen"] },
  "∮": { color: "text-stat-dark-green", keywords: ["Sweep"] },
  // Intelligence is &b aqua. It was blue here, which is Crit Damage's colour.
  "✎": { color: "text-stat-aqua", keywords: ["Intelligence"] },
  "α": { color: "text-stat-dark-aqua", keywords: ["Sea Creature Chance"] },
  "⚓": { color: "text-stat-blue", keywords: ["Double Hook Chance"] },
  "⚶": { color: "text-stat-dark-aqua", keywords: ["Respiration"] },
  "☂": { color: "text-stat-aqua", keywords: ["Fishing Speed"] },
  "❍": { color: "text-stat-blue", keywords: ["Pressure Resistance"] },
  // Every skill Fortune is &6 gold. Hunter Fortune is the odd one out at &d.
  "☘": {
    color: "text-stat-light-purple",
    keywords: ["Hunter Fortune"],
    specific: {
      "Mining Fortune": "text-stat-gold",
      "Farming Fortune": "text-stat-gold",
      "Foraging Fortune": "text-stat-gold",
      "Fig Fortune": "text-stat-gold",
      "Mangrove Fortune": "text-stat-gold",
      "Block Fortune": "text-stat-gold",
      "Overbloom": "text-stat-yellow",
    },
  },
  // Attack Speed is &e yellow. This is the entry that was rendering blue.
  "⚔": { color: "text-stat-yellow", keywords: ["Bonus Attack Speed", "Attack Speed"] },
  "✯": { color: "text-stat-aqua", keywords: ["Magic Find"] },
  // Trophy and Mining Speed are &6 gold, which is a warmer orange-gold than
  // the &e yellow above. The game splits them, so this map does too.
  "♔": { color: "text-stat-gold", keywords: ["Trophy Fish Chance"] },
  "⸕": { color: "text-stat-gold", keywords: ["Mining Speed"] },
  "☀": { color: "text-stat-yellow", keywords: ["Overbloom"] },
  "♣": { color: "text-stat-light-purple", keywords: ["Pet Luck"] },
  // Every Wisdom is &3 dark aqua. This was purple, so it would have gone blue.
  "☯": {
    color: "text-stat-dark-aqua",
    keywords: ["Foraging Wisdom", "Fishing Wisdom", "Hunting Wisdom", "Mining Wisdom", "Farming Wisdom", "Enchanting Wisdom", "Taming Wisdom", "Combat Wisdom", "Wisdom"],
  },
  "✦": { color: "text-stat-white", keywords: ["Speed"] },
  "❂": { color: "text-stat-white", keywords: ["True Defense"] },
  // Pristine is &5 dark purple in game, the same code as the Epic tier.
  "✧": { color: "text-stat-dark-purple", keywords: ["Pristine"] },
  "❃": { color: "text-stat-light-purple", keywords: ["Tracking"] },
  "✿": { color: "text-stat-dark-green", keywords: ["Mythological"] },
};

const RARITY_COLORS = {
  common: "text-rarity-common",
  uncommon: "text-rarity-uncommon",
  rare: "text-rarity-rare",
  epic: "text-rarity-epic",
  legendary: "text-rarity-legendary",
} as const;

export const formatShardDescription = (description: string): string => {
  let result = description;

  // Apply stat icon coloring
  for (const [icon, config] of Object.entries(STAT_ICON_CONFIG)) {
    // Handle specific keyword overrides first
    if (config.specific) {
      for (const [keyword, color] of Object.entries(config.specific)) {
        const regex = new RegExp(`(${icon})\\s*(${keyword})`, "gi");
        result = result.replace(regex, `<span class="${color}">$1 $2</span>`);
      }
    }

    // Handle general keywords
    if (config.keywords.length > 0) {
      const keywordPattern = config.keywords.join("|");
      const regex = new RegExp(`(${icon})\\s*(${keywordPattern})`, "gi");
      result = result.replace(regex, `<span class="${config.color}">$1 $2</span>`);
    }

    // Handle standalone icons
    const negativePattern = config.keywords.length > 0 ? `(?!\\s*(${config.keywords.join("|")}))` : "";
    const specificPattern = config.specific ? `(?!\\s*(${Object.keys(config.specific).join("|")}))` : "";
    const standaloneRegex = new RegExp(`(${icon})${negativePattern}${specificPattern}`, "gi");
    result = result.replace(standaloneRegex, `<span class="${config.color}">$1</span>`);
  }

  return applyRangeConversion(result);
};

const applyRangeConversion = (text: string): string => {
  // Convert single values to ranges with context-aware coloring
  let result = text.replace(/\+(\d+(?:\.\d+)?)([%s]?)/g, (match, number, unit, offset, string) => {
    const num = parseFloat(number);
    const max = num * 10;
    const context = string.substring(Math.max(0, offset - 50), offset + match.length + 50);

    const colorClass = determineStatColor(context);
    return `<span class="${colorClass}">+${number}${unit} to +${max}${unit}</span>`;
  });

  // Apply rarity coloring
  for (const [rarity, color] of Object.entries(RARITY_COLORS)) {
    result = result.replace(new RegExp(`\\b${rarity}\\b`, "gi"), `<span class="${color}">${rarity.toUpperCase()}</span>`);
  }

  return result;
};

const determineStatColor = (context: string): string => {
  const lowerContext = context.toLowerCase();

  // Check for specific stat patterns
  for (const [icon, config] of Object.entries(STAT_ICON_CONFIG)) {
    if (lowerContext.includes(icon)) {
      if (config.specific) {
        for (const [keyword, color] of Object.entries(config.specific)) {
          if (lowerContext.includes(keyword.toLowerCase())) {
            return color;
          }
        }
      }
      return config.color;
    }
  }

  return "text-stat-green"; // default
};

// Function to find the longest common prefix between two strings
const findCommonPrefix = (str1: string, str2: string): string => {
  let i = 0;
  while (i < str1.length && i < str2.length && str1[i].toLowerCase() === str2[i].toLowerCase()) {
    i++;
  }
  return str1.substring(0, i);
};

// Helper function to sort by shard ID (rarity letter + number)
export const sortByShardKey = (a: { key: string }, b: { key: string }): number => {
  const aMatch = a.key.match(/^([CUREL])(\d+)$/);
  const bMatch = b.key.match(/^([CUREL])(\d+)$/);

  if (!aMatch || !bMatch) {
    return a.key.localeCompare(b.key);
  }

  const [, aRarity, aNum] = aMatch;
  const [, bRarity, bNum] = bMatch;

  const rarityOrder: Record<string, number> = { C: 1, U: 2, R: 3, E: 4, L: 5 };

  if (rarityOrder[aRarity] !== rarityOrder[bRarity]) {
    return rarityOrder[aRarity] - rarityOrder[bRarity];
  }

  return parseInt(aNum) - parseInt(bNum);
};

// Sorting function that sorts by ID when names share a common prefix, otherwise alphabetically
export const sortShardsByNameWithPrefixAwareness = (a: { name: string; key: string }, b: { name: string; key: string }): number => {
  const aName = a.name.toLowerCase();
  const bName = b.name.toLowerCase();
  
  // Find the common prefix
  const commonPrefix = findCommonPrefix(aName, bName);
  
  // If they share a common prefix of at least 3 characters, sort by ID
  if (commonPrefix.length >= 3) {
    return sortByShardKey(a, b);
  }
  
  // Otherwise, sort alphabetically by name
  return aName.localeCompare(bName);
};

export { isValidShardName } from "./isValidShardName";
