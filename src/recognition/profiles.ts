import type { SupportedLanguage } from "../types/languages";

export type RegionKey = "boss" | "phase" | "hazard" | "action";

export interface RecognitionAliasEntry {
  id: string;
  region: RegionKey;
  aliases: string[];
}

export interface RecognitionProfile {
  language: SupportedLanguage;
  aliases: RecognitionAliasEntry[];
}

export const recognitionProfiles: Record<SupportedLanguage, RecognitionProfile> = {
  "en-US": {
    language: "en-US",
    aliases: [
      { id: "boss.rasial", region: "boss", aliases: ["rasial", "the first necromancer"] },
      { id: "phase.one", region: "phase", aliases: ["phase 1", "phase one", "opening phase"] },
      { id: "phase.two", region: "phase", aliases: ["phase 2", "phase two", "split soul phase"] },
      { id: "hazard.volley", region: "hazard", aliases: ["soul volley", "incoming volley", "projectile wave"] },
      { id: "hazard.lane", region: "hazard", aliases: ["unsafe lane", "move lane", "shadow lane"] },
      { id: "action.defend", region: "action", aliases: ["use defensive", "prepare defensive", "mitigate hit"] }
    ]
  },
  "pt-BR": {
    language: "pt-BR",
    aliases: [
      { id: "boss.rasial", region: "boss", aliases: ["rasial", "o primeiro necromante"] },
      { id: "phase.one", region: "phase", aliases: ["fase 1", "fase um", "fase inicial"] },
      { id: "phase.two", region: "phase", aliases: ["fase 2", "fase dois", "fase da alma dividida"] },
      { id: "hazard.volley", region: "hazard", aliases: ["rajada de almas", "rajada chegando", "onda de projeteis"] },
      { id: "hazard.lane", region: "hazard", aliases: ["rota insegura", "troque de rota", "faixa sombria"] },
      { id: "action.defend", region: "action", aliases: ["use defensivo", "prepare defensivo", "mitigue o golpe"] }
    ]
  }
};
