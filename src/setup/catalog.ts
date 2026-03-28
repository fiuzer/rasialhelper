import type { SupportedLanguage } from "../types/languages";

export type SetupRequirement = "required" | "recommended" | "optional";
export type SetupConfidence = "missing" | "manual" | "detected" | "uncertain";
export type DetectionMethod = "manual" | "visual" | "textual";

export interface SetupItemDefinition {
  id: string;
  category: "buffs" | "survival" | "preparation" | "offense";
  requirement: SetupRequirement;
  titleKey: string;
  summaryKey: string;
  whyKey: string;
  fixKey: string;
  detectionMethods: DetectionMethod[];
  aliases: Record<SupportedLanguage, string[]>;
}

export interface SetupPresetDefinition {
  id: string;
  titleKey: string;
  descriptionKey: string;
  itemIds: string[];
}

export interface SetupItemState {
  confidence: SetupConfidence;
  lastSource: DetectionMethod | "inferred";
}

export const setupItems: SetupItemDefinition[] = [
  {
    id: "offensive_potion",
    category: "buffs",
    requirement: "required",
    titleKey: "setup.items.offensivePotion.title",
    summaryKey: "setup.items.offensivePotion.summary",
    whyKey: "setup.items.offensivePotion.why",
    fixKey: "setup.items.offensivePotion.fix",
    detectionMethods: ["manual", "textual"],
    aliases: {
      "en-US": ["overload", "damage potion", "combat potion"],
      "pt-BR": ["overload", "pocao de dano", "pocao de combate"]
    }
  },
  {
    id: "combat_aura",
    category: "buffs",
    requirement: "recommended",
    titleKey: "setup.items.combatAura.title",
    summaryKey: "setup.items.combatAura.summary",
    whyKey: "setup.items.combatAura.why",
    fixKey: "setup.items.combatAura.fix",
    detectionMethods: ["manual", "visual", "textual"],
    aliases: {
      "en-US": ["aura active", "combat aura", "damage aura"],
      "pt-BR": ["aura ativa", "aura de combate", "aura de dano"]
    }
  },
  {
    id: "familiar_active",
    category: "buffs",
    requirement: "recommended",
    titleKey: "setup.items.familiar.title",
    summaryKey: "setup.items.familiar.summary",
    whyKey: "setup.items.familiar.why",
    fixKey: "setup.items.familiar.fix",
    detectionMethods: ["manual", "visual", "textual"],
    aliases: {
      "en-US": ["familiar summoned", "summon active", "combat familiar"],
      "pt-BR": ["familiar invocado", "invocacao ativa", "familiar de combate"]
    }
  },
  {
    id: "pocket_slot",
    category: "buffs",
    requirement: "recommended",
    titleKey: "setup.items.pocketSlot.title",
    summaryKey: "setup.items.pocketSlot.summary",
    whyKey: "setup.items.pocketSlot.why",
    fixKey: "setup.items.pocketSlot.fix",
    detectionMethods: ["manual", "textual"],
    aliases: {
      "en-US": ["pocket slot", "scripture", "book active"],
      "pt-BR": ["slot de bolso", "escritura", "livro ativo"]
    }
  },
  {
    id: "protection_prayer",
    category: "survival",
    requirement: "required",
    titleKey: "setup.items.protectionPrayer.title",
    summaryKey: "setup.items.protectionPrayer.summary",
    whyKey: "setup.items.protectionPrayer.why",
    fixKey: "setup.items.protectionPrayer.fix",
    detectionMethods: ["manual", "visual", "textual"],
    aliases: {
      "en-US": ["protection prayer", "curses active", "defensive prayer"],
      "pt-BR": ["oracao de protecao", "curses ativas", "oracao defensiva"]
    }
  },
  {
    id: "emergency_healing",
    category: "survival",
    requirement: "required",
    titleKey: "setup.items.emergencyHealing.title",
    summaryKey: "setup.items.emergencyHealing.summary",
    whyKey: "setup.items.emergencyHealing.why",
    fixKey: "setup.items.emergencyHealing.fix",
    detectionMethods: ["manual", "textual"],
    aliases: {
      "en-US": ["food", "healing ready", "panic heal"],
      "pt-BR": ["comida", "cura pronta", "cura de emergencia"]
    }
  },
  {
    id: "weapon_charges",
    category: "preparation",
    requirement: "required",
    titleKey: "setup.items.weaponCharges.title",
    summaryKey: "setup.items.weaponCharges.summary",
    whyKey: "setup.items.weaponCharges.why",
    fixKey: "setup.items.weaponCharges.fix",
    detectionMethods: ["manual", "textual"],
    aliases: {
      "en-US": ["charges checked", "gear charged", "repair complete"],
      "pt-BR": ["cargas verificadas", "equipamento carregado", "reparo concluido"]
    }
  },
  {
    id: "conjure_opener",
    category: "offense",
    requirement: "recommended",
    titleKey: "setup.items.conjureOpener.title",
    summaryKey: "setup.items.conjureOpener.summary",
    whyKey: "setup.items.conjureOpener.why",
    fixKey: "setup.items.conjureOpener.fix",
    detectionMethods: ["manual", "textual"],
    aliases: {
      "en-US": ["conjures ready", "opener ready", "summons prepared"],
      "pt-BR": ["conjuros prontos", "abertura pronta", "invocacoes preparadas"]
    }
  },
  {
    id: "defensive_plan",
    category: "survival",
    requirement: "required",
    titleKey: "setup.items.defensivePlan.title",
    summaryKey: "setup.items.defensivePlan.summary",
    whyKey: "setup.items.defensivePlan.why",
    fixKey: "setup.items.defensivePlan.fix",
    detectionMethods: ["manual"],
    aliases: {
      "en-US": ["defensive plan", "defensives ready", "panic rotation"],
      "pt-BR": ["plano defensivo", "defensivos prontos", "rotacao de emergencia"]
    }
  },
  {
    id: "extra_boost",
    category: "buffs",
    requirement: "optional",
    titleKey: "setup.items.extraBoost.title",
    summaryKey: "setup.items.extraBoost.summary",
    whyKey: "setup.items.extraBoost.why",
    fixKey: "setup.items.extraBoost.fix",
    detectionMethods: ["manual", "textual"],
    aliases: {
      "en-US": ["extra boost", "incense", "small boost"],
      "pt-BR": ["buff extra", "incenso", "boost menor"]
    }
  }
];

export const setupPresets: SetupPresetDefinition[] = [
  {
    id: "safe-learning",
    titleKey: "setup.presets.safeLearning.title",
    descriptionKey: "setup.presets.safeLearning.description",
    itemIds: [
      "offensive_potion",
      "protection_prayer",
      "emergency_healing",
      "weapon_charges",
      "defensive_plan",
      "combat_aura",
      "familiar_active"
    ]
  },
  {
    id: "balanced-farm",
    titleKey: "setup.presets.balancedFarm.title",
    descriptionKey: "setup.presets.balancedFarm.description",
    itemIds: [
      "offensive_potion",
      "combat_aura",
      "familiar_active",
      "pocket_slot",
      "protection_prayer",
      "emergency_healing",
      "weapon_charges",
      "conjure_opener",
      "defensive_plan"
    ]
  },
  {
    id: "minimal-check",
    titleKey: "setup.presets.minimalCheck.title",
    descriptionKey: "setup.presets.minimalCheck.description",
    itemIds: [
      "offensive_potion",
      "protection_prayer",
      "emergency_healing",
      "weapon_charges",
      "defensive_plan"
    ]
  }
];
