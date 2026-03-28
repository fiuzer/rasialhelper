import type { LanguagePreference, SupportedLanguage } from "../types/languages";
import { normalizeForMatch } from "../utils/text";
import { type PixelSource, resolveRect } from "../visual/detector";
import { trackerDefinitions, type TrackerValue } from "./catalog";
import { getTrackerProfile } from "./profiles";
import type { NormalizedRect } from "../visual/profiles";

export interface TrackerRegionResult {
  regionId: string;
  rawText?: string;
  values: TrackerValue[];
  status: "idle" | "detected" | "uncertain" | "missing";
}

export interface TrackerScanReport {
  regions: TrackerRegionResult[];
  values: Record<string, TrackerValue>;
}

function languagesFor(preference: LanguagePreference): SupportedLanguage[] {
  return preference === "auto" ? ["en-US", "pt-BR"] : [preference];
}

function nearestNumber(text: string, alias: string): number | undefined {
  const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const patterns = [
    new RegExp(`${escaped}\\s*(?:x)?\\s*(\\d{1,2})`, "i"),
    new RegExp(`${escaped}[^\\d]{0,6}(\\d{1,2})`, "i"),
    new RegExp(`(\\d{1,2})\\s*(?:x)?\\s*${escaped}`, "i")
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      return Number(match[1]);
    }
  }
  return undefined;
}

function nearestSeconds(text: string, alias: string): number | undefined {
  const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const patterns = [
    new RegExp(`${escaped}\\s*(\\d{1,2})\\s*(?:s|sec|secs|seg|segs)?`, "i"),
    new RegExp(`${escaped}[^\\d]{0,6}(\\d{1,2})`, "i"),
    new RegExp(`(\\d{1,2})\\s*(?:s|sec|secs|seg|segs)\\s*${escaped}`, "i")
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      return Number(match[1]);
    }
  }
  return undefined;
}

function detectValue(sample: string, preference: LanguagePreference): TrackerValue[] {
  const normalized = normalizeForMatch(sample);
  const result: TrackerValue[] = [];

  for (const definition of trackerDefinitions) {
    let best: TrackerValue | undefined;
    for (const language of languagesFor(preference)) {
      for (const alias of definition.aliases[language]) {
        const normalizedAlias = normalizeForMatch(alias);
        if (!normalized.includes(normalizedAlias)) {
          continue;
        }

        const value =
          definition.kind === "stack"
            ? nearestNumber(sample, alias)
            : definition.kind === "timer"
              ? nearestSeconds(sample, alias)
              : undefined;

        const confidence = value !== undefined || definition.kind === "toggle" ? 0.94 : 0.68;
        const current: TrackerValue = {
          id: definition.id,
          kind: definition.kind,
          active: true,
          value,
          unit: definition.kind === "stack" ? "stacks" : definition.kind === "timer" ? "seconds" : undefined,
          source: "textual",
          confidence,
          rawMatch: alias
        };

        if (!best || current.confidence > best.confidence) {
          best = current;
        }
      }
    }

    if (best) {
      result.push(best);
    }
  }

  return result;
}

export function scanTrackerProfile(
  source: PixelSource | undefined,
  profileId: string,
  preference: LanguagePreference,
  overrides: Record<string, Partial<NormalizedRect>>,
  samples: Record<string, string>
): TrackerScanReport {
  const profile = getTrackerProfile(profileId);
  const values: Record<string, TrackerValue> = {};

  const regions = profile.regions.map((region) => {
    const rect = resolveRect(region.defaultRect, overrides[region.id]);
    let rawText = samples[region.id]?.trim() ?? "";

    if (!rawText && source?.isReady()) {
      const textProbe = region.probes.find((probe) => probe.kind === "text");
      if (textProbe?.kind === "text") {
        rawText = source.readText(rect, textProbe).trim();
      }
    }

    const regionValues = rawText ? detectValue(rawText, preference) : [];
    for (const value of regionValues) {
      values[value.id] = value;
    }

    const status: TrackerRegionResult["status"] =
      regionValues.some((value) => value.confidence >= 0.9)
        ? "detected"
        : regionValues.length
          ? "uncertain"
          : rawText
            ? "uncertain"
            : "missing";

    return {
      regionId: region.id,
      rawText: rawText || undefined,
      values: regionValues,
      status
    };
  });

  return { regions, values };
}
