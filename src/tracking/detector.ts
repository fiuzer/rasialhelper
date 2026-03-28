import type { LanguagePreference, SupportedLanguage } from "../types/languages";
import { normalizeForMatch } from "../utils/text";
import { type PixelSource, resolveRect } from "../visual/detector";
import { trackerDefinitions, type TrackerValue } from "./catalog";
import { matchSlotAgainstTemplates, valueFromIconMatch, type TrackerIconMatch, type TrackerIconTemplateMap } from "./icon-matcher";
import { getTrackerProfile, type TrackerRegionDefinition } from "./profiles";
import type { NormalizedRect } from "../visual/profiles";

export interface TrackerRegionResult {
  regionId: string;
  rawText?: string;
  values: TrackerValue[];
  iconMatches?: TrackerIconMatch[];
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

function firstNumber(sample: string): number | undefined {
  const match = sample.match(/(\d{1,3})/);
  return match?.[1] ? Number(match[1]) : undefined;
}

function detectMappedSlotValue(sample: string, trackerId: string): TrackerValue | undefined {
  const definition = trackerDefinitions.find((entry) => entry.id === trackerId);
  if (!definition) {
    return undefined;
  }

  const trimmed = sample.trim();
  if (!trimmed) {
    return undefined;
  }

  const numericValue = firstNumber(trimmed);

  if (definition.kind === "toggle") {
    return {
      id: definition.id,
      kind: definition.kind,
      active: true,
      source: "textual",
      confidence: 0.82,
      rawMatch: trimmed
    };
  }

  if (numericValue === undefined) {
    return {
      id: definition.id,
      kind: definition.kind,
      active: true,
      source: "textual",
      confidence: 0.55,
      rawMatch: trimmed
    };
  }

  return {
    id: definition.id,
    kind: definition.kind,
    active: true,
    value: numericValue,
    unit: definition.kind === "stack" ? "stacks" : "seconds",
    source: "textual",
    confidence: 0.9,
    rawMatch: trimmed
  };
}

function parseStructuredSlotSamples(sample: string): string[] {
  const trimmed = sample.trim();
  if (!trimmed) {
    return [];
  }

  const explicitSlots = trimmed
    .split(/[|,;]/)
    .map((entry) => entry.trim())
    .filter(Boolean);

  if (explicitSlots.length > 1) {
    return explicitSlots;
  }

  if (/^[\d%\s]+$/.test(trimmed)) {
    return trimmed.split(/\s+/).filter(Boolean);
  }

  return [];
}

function readRegionText(
  source: PixelSource | undefined,
  rect: NormalizedRect,
  region: TrackerRegionDefinition
): string {
  const textProbe = region.probes.find((probe) => probe.kind === "text");
  if (!source?.isReady() || textProbe?.kind !== "text") {
    return "";
  }
  return source.readText(rect, textProbe).trim();
}

function readSlotTexts(
  source: PixelSource | undefined,
  rect: NormalizedRect,
  region: TrackerRegionDefinition
): string[] {
  const textProbe = region.probes.find((probe) => probe.kind === "text");
  if (!source?.isReady() || textProbe?.kind !== "text") {
    return [];
  }

  const slotCount = Math.max(1, region.slotCount ?? 1);
  const slotWidth = rect.w / slotCount;
  const samples: string[] = [];
  for (let index = 0; index < slotCount; index += 1) {
    const slotRect: NormalizedRect = {
      x: rect.x + slotWidth * index,
      y: rect.y,
      w: slotWidth,
      h: rect.h
    };
    const sample = source.readText(slotRect, textProbe).trim();
    samples.push(sample);
  }
  return samples;
}

export function scanTrackerProfile(
  source: PixelSource | undefined,
  profileId: string,
  preference: LanguagePreference,
  overrides: Record<string, Partial<NormalizedRect>>,
  samples: Record<string, string>,
  templates: TrackerIconTemplateMap = {},
  targetRegionIds?: string[]
): TrackerScanReport {
  const profile = getTrackerProfile(profileId);
  const values: Record<string, TrackerValue> = {};
  const activeRegions = targetRegionIds?.length
    ? profile.regions.filter((region) => targetRegionIds.includes(region.id))
    : profile.regions;

  const regions = activeRegions.map((region) => {
    const rect = resolveRect(region.defaultRect, overrides[region.id]);
    const fallbackText = samples[region.id]?.trim() ?? "";
    let rawText = fallbackText;
    let regionValues: TrackerValue[] = [];

    if (region.parser === "slot-bar") {
      const liveSlotSamples = source?.isReady() ? readSlotTexts(source, rect, region) : [];
      const slotSamples = liveSlotSamples.length ? liveSlotSamples : parseStructuredSlotSamples(fallbackText);
      const iconMatches = source?.isReady()
        ? Array.from({ length: region.slotCount ?? 0 }, (_, index) =>
            matchSlotAgainstTemplates(source, rect, region.slotCount ?? 0, index, templates)
          ).filter((match): match is TrackerIconMatch => Boolean(match))
        : [];

      if (slotSamples.some((sample) => sample)) {
        rawText = slotSamples.map((sample) => sample || "-").join(" | ");
        regionValues = slotSamples.flatMap((sample, index) => {
          const iconMappedTrackerId = iconMatches.find((match) => match.slotIndex === index)?.trackerId;
          const mappedTrackerId =
            iconMappedTrackerId ?? region.slotAssignments?.[index] ?? region.trackerIds[index];
          const mappedValue = mappedTrackerId
            ? detectMappedSlotValue(sample, mappedTrackerId)
            : undefined;
          return mappedValue ? [mappedValue] : [];
        });
      } else {
        rawText = fallbackText;
        regionValues = rawText ? detectValue(rawText, preference) : [];
      }

      for (const match of iconMatches) {
        if (!regionValues.some((value) => value.id === match.trackerId)) {
          const iconValue = valueFromIconMatch(match);
          if (iconValue) {
            regionValues.push(iconValue);
          }
        }
      }

      for (const match of iconMatches) {
        values[match.trackerId] = values[match.trackerId] ?? valueFromIconMatch(match)!;
      }

      for (const value of regionValues) {
        values[value.id] = value;
      }

      const status: TrackerRegionResult["status"] =
        regionValues.some((value) => value.confidence >= 0.9)
          ? "detected"
          : regionValues.length || iconMatches.length
            ? "uncertain"
            : rawText
              ? "uncertain"
              : "missing";

      return {
        regionId: region.id,
        rawText: rawText || undefined,
        values: regionValues,
        iconMatches: iconMatches.length ? iconMatches : undefined,
        status
      };
    } else {
      if (!rawText && source?.isReady()) {
        rawText = readRegionText(source, rect, region);
      }
      regionValues = rawText ? detectValue(rawText, preference) : [];
    }

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
      iconMatches: undefined,
      status
    };
  });

  return { regions, values };
}
