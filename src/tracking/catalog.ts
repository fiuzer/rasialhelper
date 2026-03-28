import type { SupportedLanguage } from "../types/languages";

export type TrackerKind = "stack" | "timer" | "toggle";

export interface TrackerDefinition {
  id: string;
  kind: TrackerKind;
  titleKey: string;
  shortKey: string;
  descriptionKey: string;
  aliases: Record<SupportedLanguage, string[]>;
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
      "pt-BR": ["zumbi", "zumbi pútrido"]
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
      "pt-BR": ["overload", "poção de combate"]
    }
  }
];

export function getTrackerDefinition(id: string): TrackerDefinition | undefined {
  return trackerDefinitions.find((item) => item.id === id);
}
