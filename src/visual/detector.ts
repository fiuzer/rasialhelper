import type { LanguagePreference, SupportedLanguage } from "../types/languages";
import { normalizeForMatch, diceCoefficient } from "../utils/text";
import { setupItems, type SetupConfidence } from "../setup/catalog";
import {
  getVisualProfile,
  type BrightnessProbeDefinition,
  type NormalizedRect,
  type VisualProbeDefinition,
  type VisualRegionDefinition
} from "./profiles";

export interface PixelSource {
  isReady(): boolean;
  readText(rect: NormalizedRect, probe: Extract<VisualProbeDefinition, { kind: "text" }>): string;
  readBrightness(
    rect: NormalizedRect,
    probe: BrightnessProbeDefinition
  ): { average: number; hits: number; total: number };
}

export interface VisualRegionResult {
  regionId: string;
  rawText?: string;
  brightness?: number;
  items: Array<{
    itemId: string;
    confidence: SetupConfidence;
    score: number;
    alias?: string;
    language?: SupportedLanguage;
  }>;
  status: "idle" | "detected" | "uncertain" | "missing";
  note: string;
}

export interface VisualScanReport {
  regions: VisualRegionResult[];
  setupUpdates: Record<string, { confidence: SetupConfidence; source: "visual" | "textual" }>;
}

export function resolveRect(
  defaultRect: NormalizedRect,
  override?: Partial<NormalizedRect>
): NormalizedRect {
  const merged = {
    x: override?.x ?? defaultRect.x,
    y: override?.y ?? defaultRect.y,
    w: override?.w ?? defaultRect.w,
    h: override?.h ?? defaultRect.h
  };

  const x = Math.max(0, Math.min(0.98, merged.x));
  const y = Math.max(0, Math.min(0.98, merged.y));

  return {
    x,
    y,
    w: Math.max(0.02, Math.min(1 - x, merged.w)),
    h: Math.max(0.02, Math.min(1 - y, merged.h))
  };
}

function itemScore(sample: string, alias: string): number {
  const normalizedSample = normalizeForMatch(sample);
  const normalizedAlias = normalizeForMatch(alias);

  if (!normalizedSample || !normalizedAlias) {
    return 0;
  }
  if (
    normalizedSample.includes(normalizedAlias) ||
    normalizedAlias.includes(normalizedSample)
  ) {
    return 0.94;
  }
  return diceCoefficient(normalizedSample, normalizedAlias);
}

function detectItemsFromText(
  sample: string,
  itemIds: string[],
  preference: LanguagePreference
): VisualRegionResult["items"] {
  const languages: SupportedLanguage[] =
    preference === "auto" ? ["en-US", "pt-BR"] : [preference];
  const results: VisualRegionResult["items"] = [];

  for (const itemId of itemIds) {
    const item = setupItems.find((entry) => entry.id === itemId);
    if (!item) {
      continue;
    }

    let bestScore = 0;
    let bestAlias: string | undefined;
    let bestLanguage: SupportedLanguage | undefined;
    for (const language of languages) {
      for (const alias of item.aliases[language]) {
        const score = itemScore(sample, alias);
        if (score > bestScore) {
          bestScore = score;
          bestAlias = alias;
          bestLanguage = language;
        }
      }
    }

    if (bestScore >= 0.58) {
      results.push({
        itemId,
        confidence: bestScore >= 0.9 ? "detected" : "uncertain",
        score: bestScore,
        alias: bestAlias,
        language: bestLanguage
      });
    }
  }

  return results;
}

function detectItemsFromBrightness(
  brightnessData: { average: number; hits: number; total: number },
  itemIds: string[]
): VisualRegionResult["items"] {
  if (!itemIds.length || brightnessData.total === 0) {
    return [];
  }
  const ratio = brightnessData.hits / brightnessData.total;
  if (ratio < 0.5) {
    return [];
  }
  return itemIds.map((itemId) => ({
    itemId,
    confidence: ratio > 0.8 ? "uncertain" : "missing",
    score: ratio
  }));
}

function summarizeRegionResult(
  regionId: string,
  textItems: VisualRegionResult["items"],
  rawText: string | undefined,
  brightnessItems: VisualRegionResult["items"],
  brightnessAverage?: number
): VisualRegionResult {
  const mergedById = new Map<string, VisualRegionResult["items"][number]>();
  for (const item of [...textItems, ...brightnessItems]) {
    const existing = mergedById.get(item.itemId);
    if (!existing || item.score > existing.score) {
      mergedById.set(item.itemId, item);
    }
  }

  const items = [...mergedById.values()];
  const status =
    items.some((item) => item.confidence === "detected")
      ? "detected"
      : items.some((item) => item.confidence === "uncertain")
        ? "uncertain"
        : "missing";

  const note =
    rawText?.trim()
      ? rawText
      : brightnessAverage !== undefined
        ? `brightness:${Math.round(brightnessAverage)}`
        : "no-data";

  return {
    regionId,
    rawText,
    brightness: brightnessAverage,
    items,
    status,
    note
  };
}

export function scanVisualRegion(
  source: PixelSource | undefined,
  region: VisualRegionDefinition,
  preference: LanguagePreference,
  override?: Partial<NormalizedRect>,
  fallbackSample?: string
): VisualRegionResult {
  const rect = resolveRect(region.defaultRect, override);
  let rawText = fallbackSample?.trim() || "";
  let brightnessAverage: number | undefined;
  let textItems: VisualRegionResult["items"] = [];
  let brightnessItems: VisualRegionResult["items"] = [];

  if (source?.isReady()) {
    for (const probe of region.probes) {
      if (probe.kind === "text" && !rawText) {
        rawText = source.readText(rect, probe).trim();
      }
      if (probe.kind === "brightness") {
        const result = source.readBrightness(rect, probe);
        brightnessAverage = result.average;
        brightnessItems = detectItemsFromBrightness(result, region.itemIds);
      }
    }
  }

  if (rawText) {
    textItems = detectItemsFromText(rawText, region.itemIds, preference);
  }

  return summarizeRegionResult(
    region.id,
    textItems,
    rawText || undefined,
    brightnessItems,
    brightnessAverage
  );
}

export function scanVisualProfile(
  source: PixelSource | undefined,
  profileId: string,
  preference: LanguagePreference,
  overrides: Record<string, Partial<NormalizedRect>>,
  samples: Record<string, string>
): VisualScanReport {
  const profile = getVisualProfile(profileId);
  const regions = profile.regions.map((region) =>
    scanVisualRegion(source, region, preference, overrides[region.id], samples[region.id])
  );

  const setupUpdates: VisualScanReport["setupUpdates"] = {};
  for (const region of regions) {
    for (const item of region.items) {
      const previous = setupUpdates[item.itemId];
      if (!previous || item.score >= 0.75) {
        setupUpdates[item.itemId] = {
          confidence: item.confidence,
          source: item.confidence === "detected" ? "textual" : "visual"
        };
      }
    }
  }

  return { regions, setupUpdates };
}
