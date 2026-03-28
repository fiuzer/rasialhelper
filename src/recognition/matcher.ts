import { normalizeForMatch, diceCoefficient } from "../utils/text";
import type { LanguagePreference, SupportedLanguage } from "../types/languages";
import { recognitionProfiles, type RegionKey } from "./profiles";

export interface MatchCandidate {
  id: string;
  alias: string;
  region: RegionKey;
  language: SupportedLanguage;
  score: number;
}

export interface MatchResult {
  best?: MatchCandidate;
  candidates: MatchCandidate[];
  resolvedLanguage: SupportedLanguage;
  confidence: number;
  warning?: string;
}

function scoreAlias(sample: string, alias: string): number {
  const normalizedSample = normalizeForMatch(sample);
  const normalizedAlias = normalizeForMatch(alias);

  if (!normalizedSample || !normalizedAlias) {
    return 0;
  }
  if (normalizedSample === normalizedAlias) {
    return 1;
  }
  if (
    normalizedSample.includes(normalizedAlias) ||
    normalizedAlias.includes(normalizedSample)
  ) {
    return 0.92;
  }
  return diceCoefficient(normalizedSample, normalizedAlias);
}

export function detectGameLanguage(
  sample: string,
  region: RegionKey,
  preference: LanguagePreference,
  forcePreference: boolean
): MatchResult {
  const languages: SupportedLanguage[] =
    preference !== "auto" && forcePreference ? [preference] : ["en-US", "pt-BR"];

  const candidates: MatchCandidate[] = [];
  for (const language of languages) {
    for (const entry of recognitionProfiles[language].aliases) {
      if (entry.region !== region) {
        continue;
      }
      for (const alias of entry.aliases) {
        const score = scoreAlias(sample, alias);
        if (score >= 0.45) {
          candidates.push({ id: entry.id, alias, region, language, score });
        }
      }
    }
  }

  candidates.sort((left, right) => right.score - left.score);
  const best = candidates[0];
  const resolvedLanguage = best?.language ?? (preference !== "auto" ? preference : "en-US");
  const confidence = best?.score ?? 0;

  let warning: string | undefined;
  if (!best) {
    warning = "no-match";
  } else if (confidence < 0.7) {
    warning = "uncertain";
  } else if (preference !== "auto" && !forcePreference && best.language !== preference) {
    warning = "language-mismatch";
  }

  return {
    best,
    candidates,
    resolvedLanguage,
    confidence,
    warning
  };
}
