import type { LanguagePreference, SupportedLanguage } from "../types/languages";
import { normalizeForMatch, diceCoefficient } from "../utils/text";
import {
  setupItems,
  setupPresets,
  type SetupConfidence,
  type SetupItemDefinition,
  type SetupItemState
} from "./catalog";

export interface SetupDetection {
  itemId: string;
  confidence: SetupConfidence;
  score: number;
  alias?: string;
  language: SupportedLanguage;
}

export interface SetupReport {
  readinessScore: number;
  requiredReady: number;
  requiredTotal: number;
  missingRequired: string[];
  missingRecommended: string[];
  detectedCount: number;
  manualCount: number;
  uncertainCount: number;
}

export function createDefaultSetupState(): Record<string, SetupItemState> {
  return Object.fromEntries(
    setupItems.map((item) => [
      item.id,
      { confidence: "missing", lastSource: "inferred" as const }
    ])
  );
}

export function getPresetItems(presetId: string): SetupItemDefinition[] {
  const preset = setupPresets.find((entry) => entry.id === presetId) ?? setupPresets[0];
  return preset.itemIds
    .map((id) => setupItems.find((item) => item.id === id))
    .filter((item): item is SetupItemDefinition => Boolean(item));
}

function scoreAlias(sample: string, alias: string): number {
  const normalizedSample = normalizeForMatch(sample);
  const normalizedAlias = normalizeForMatch(alias);

  if (!normalizedSample || !normalizedAlias) {
    return 0;
  }
  if (normalizedSample.includes(normalizedAlias) || normalizedAlias.includes(normalizedSample)) {
    return 0.94;
  }
  return diceCoefficient(normalizedSample, normalizedAlias);
}

export function analyzeSetupSample(
  sample: string,
  preference: LanguagePreference
): SetupDetection[] {
  const languages: SupportedLanguage[] =
    preference === "auto" ? ["en-US", "pt-BR"] : [preference];
  const detections: SetupDetection[] = [];

  for (const item of setupItems) {
    let best: SetupDetection | undefined;
    for (const language of languages) {
      for (const alias of item.aliases[language]) {
        const score = scoreAlias(sample, alias);
        if (!best || score > best.score) {
          const confidence: SetupConfidence =
            score >= 0.92 ? "detected" : score >= 0.58 ? "uncertain" : "missing";
          best = {
            itemId: item.id,
            confidence,
            score,
            alias,
            language
          };
        }
      }
    }
    if (best && best.score >= 0.58) {
      detections.push(best);
    }
  }

  return detections;
}

export function mergeSetupDetections(
  current: Record<string, SetupItemState>,
  detections: SetupDetection[]
): Record<string, SetupItemState> {
  const next = { ...current };
  for (const detection of detections) {
    next[detection.itemId] = {
      confidence: detection.confidence,
      lastSource: detection.confidence === "detected" ? "textual" : "inferred"
    };
  }
  return next;
}

export function cycleSetupConfidence(
  current: SetupConfidence
): SetupConfidence {
  switch (current) {
    case "missing":
      return "manual";
    case "manual":
      return "detected";
    case "detected":
      return "uncertain";
    default:
      return "missing";
  }
}

export function buildSetupReport(
  presetId: string,
  state: Record<string, SetupItemState>
) : SetupReport {
  const items = getPresetItems(presetId);
  const requiredItems = items.filter((item) => item.requirement === "required");
  const ready = (itemId: string): boolean => {
    const confidence = state[itemId]?.confidence ?? "missing";
    return confidence === "manual" || confidence === "detected";
  };

  const missingRequired = requiredItems.filter((item) => !ready(item.id)).map((item) => item.id);
  const missingRecommended = items
    .filter((item) => item.requirement === "recommended" && !ready(item.id))
    .map((item) => item.id);

  const requiredReady = requiredItems.filter((item) => ready(item.id)).length;
  const statuses = items.map((item) => state[item.id]?.confidence ?? "missing");
  const readinessScore = Math.round(
    (statuses.reduce((sum, confidence) => {
      switch (confidence) {
        case "detected":
          return sum + 1;
        case "manual":
          return sum + 0.9;
        case "uncertain":
          return sum + 0.45;
        default:
          return sum;
      }
    }, 0) /
      Math.max(items.length, 1)) *
      100
  );

  return {
    readinessScore,
    requiredReady,
    requiredTotal: requiredItems.length,
    missingRequired,
    missingRecommended,
    detectedCount: statuses.filter((status) => status === "detected").length,
    manualCount: statuses.filter((status) => status === "manual").length,
    uncertainCount: statuses.filter((status) => status === "uncertain").length
  };
}
