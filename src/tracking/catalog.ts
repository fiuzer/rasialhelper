import type { SupportedLanguage } from "../types/languages";

export type TrackerKind = "stack" | "timer" | "toggle";
export type TrackerDetectionStrategy = "slot-numeric" | "slot-toggle" | "ocr-text" | "icon-template";

export interface TrackerWikiReference {
  articlePath: string;
  iconFileHint: string;
  buffBarCategory:
    | "Potions"
    | "Prayers"
    | "Pet effects"
    | "Boss specific"
    | "Status effects"
    | "Offensive abilities";
  strategy: TrackerDetectionStrategy;
  defaultBarSlot?: number;
}

export interface TrackerDefinition {
  id: string;
  kind: TrackerKind;
  titleKey: string;
  shortKey: string;
  descriptionKey: string;
  aliases: Record<SupportedLanguage, string[]>;
  wiki: TrackerWikiReference;
}

export interface TrackerValue {
  id: string;
  kind: TrackerKind;
  active: boolean;
  value?: number;
  unit?: "stacks" | "seconds";
  source: "textual" | "sample";
  confidence: number;
  rawMatch?: string;
}

export const trackerWikiIndex = {
  buffsAndDebuffs: "https://runescape.wiki/w/Buffs_and_debuffs",
  buffBarSettings: "https://runescape.wiki/w/Settings/Interfaces/Buff_Bar"
} as const;

export const trackerDefinitions: TrackerDefinition[] = [
  {
    id: "necrosis_stacks",
    kind: "stack",
    titleKey: "tracker.items.necrosis.title",
    shortKey: "tracker.items.necrosis.short",
    descriptionKey: "tracker.items.necrosis.description",
    aliases: {
      "en-US": ["necrosis", "necrosis stacks"],
      "pt-BR": ["necrosis", "pilhas de necrosis"]
    },
    wiki: {
      articlePath: "/w/Necrosis",
      iconFileHint: "Necrosis (status).png",
      buffBarCategory: "Status effects",
      strategy: "slot-numeric",
      defaultBarSlot: 2
    }
  },
  {
    id: "residual_souls",
    kind: "stack",
    titleKey: "tracker.items.residualSouls.title",
    shortKey: "tracker.items.residualSouls.short",
    descriptionKey: "tracker.items.residualSouls.description",
    aliases: {
      "en-US": ["residual soul", "residual souls", "soul stacks"],
      "pt-BR": ["almas residuais", "alma residual", "pilhas de alma"]
    },
    wiki: {
      articlePath: "/w/Residual_Soul",
      iconFileHint: "Residual Soul (status).png",
      buffBarCategory: "Status effects",
      strategy: "slot-numeric",
      defaultBarSlot: 1
    }
  },
  {
    id: "living_death",
    kind: "timer",
    titleKey: "tracker.items.livingDeath.title",
    shortKey: "tracker.items.livingDeath.short",
    descriptionKey: "tracker.items.livingDeath.description",
    aliases: {
      "en-US": ["living death"],
      "pt-BR": ["morte viva"]
    },
    wiki: {
      articlePath: "/w/Living_Death",
      iconFileHint: "Living Death (status).png",
      buffBarCategory: "Status effects",
      strategy: "slot-numeric",
      defaultBarSlot: 3
    }
  },
  {
    id: "bloat",
    kind: "timer",
    titleKey: "tracker.items.bloat.title",
    shortKey: "tracker.items.bloat.short",
    descriptionKey: "tracker.items.bloat.description",
    aliases: {
      "en-US": ["bloat"],
      "pt-BR": ["bloat"]
    },
    wiki: {
      articlePath: "/w/Bloat",
      iconFileHint: "Bloat (status).png",
      buffBarCategory: "Offensive abilities",
      strategy: "ocr-text"
    }
  },
  {
    id: "ghost_timer",
    kind: "timer",
    titleKey: "tracker.items.ghost.title",
    shortKey: "tracker.items.ghost.short",
    descriptionKey: "tracker.items.ghost.description",
    aliases: {
      "en-US": ["ghost", "vengeful ghost"],
      "pt-BR": ["fantasma", "fantasma vingativo"]
    },
    wiki: {
      articlePath: "/w/Conjure_Vengeful_Ghost",
      iconFileHint: "Vengeful ghost conjure duration buff.png",
      buffBarCategory: "Pet effects",
      strategy: "ocr-text"
    }
  },
  {
    id: "skeleton_timer",
    kind: "timer",
    titleKey: "tracker.items.skeleton.title",
    shortKey: "tracker.items.skeleton.short",
    descriptionKey: "tracker.items.skeleton.description",
    aliases: {
      "en-US": ["skeleton", "warrior skeleton"],
      "pt-BR": ["esqueleto", "esqueleto guerreiro"]
    },
    wiki: {
      articlePath: "/w/Conjure_Skeleton_Warrior",
      iconFileHint: "Skeleton conjure duration buff.png",
      buffBarCategory: "Pet effects",
      strategy: "ocr-text"
    }
  },
  {
    id: "zombie_timer",
    kind: "timer",
    titleKey: "tracker.items.zombie.title",
    shortKey: "tracker.items.zombie.short",
    descriptionKey: "tracker.items.zombie.description",
    aliases: {
      "en-US": ["zombie", "putrid zombie"],
      "pt-BR": ["zumbi", "zumbi putrido"]
    },
    wiki: {
      articlePath: "/w/Conjure_Putrid_Zombie",
      iconFileHint: "Zombie conjure duration buff.png",
      buffBarCategory: "Pet effects",
      strategy: "ocr-text"
    }
  },
  {
    id: "split_soul",
    kind: "toggle",
    titleKey: "tracker.items.splitSoul.title",
    shortKey: "tracker.items.splitSoul.short",
    descriptionKey: "tracker.items.splitSoul.description",
    aliases: {
      "en-US": ["split soul"],
      "pt-BR": ["alma dividida"]
    },
    wiki: {
      articlePath: "/w/Split_Soul",
      iconFileHint: "Split Soul (status).png",
      buffBarCategory: "Prayers",
      strategy: "slot-toggle",
      defaultBarSlot: 4
    }
  },
  {
    id: "overload_active",
    kind: "toggle",
    titleKey: "tracker.items.overload.title",
    shortKey: "tracker.items.overload.short",
    descriptionKey: "tracker.items.overload.description",
    aliases: {
      "en-US": ["overload", "combat potion"],
      "pt-BR": ["overload", "pocao de combate"]
    },
    wiki: {
      articlePath: "/w/Overload",
      iconFileHint: "Overload (status).png",
      buffBarCategory: "Potions",
      strategy: "slot-toggle",
      defaultBarSlot: 5
    }
  }
];

export function getTrackerDefinition(id: string): TrackerDefinition | undefined {
  return trackerDefinitions.find((item) => item.id === id);
}

export function getTrackerWikiUrl(id: string): string | undefined {
  const definition = getTrackerDefinition(id);
  return definition ? `https://runescape.wiki${definition.wiki.articlePath}` : undefined;
}
