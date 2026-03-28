import type { NormalizedRect } from "../visual/profiles";
import type { PixelSource } from "../visual/detector";
import { getTrackerDefinition, type TrackerValue } from "./catalog";

export interface TrackerIconTemplate {
  trackerId: string;
  regionId: string;
  slotIndex: number;
  gridSize: number;
  signature: number[];
  capturedAt: string;
}

export interface TrackerIconMatch {
  trackerId: string;
  slotIndex: number;
  score: number;
}

export type TrackerIconTemplateMap = Record<string, TrackerIconTemplate>;

export const DEFAULT_ICON_GRID_SIZE = 8;

function normalizeSignature(signature: number[]): number[] {
  if (!signature.length) {
    return [];
  }
  const min = Math.min(...signature);
  const max = Math.max(...signature);
  const range = Math.max(1, max - min);
  return signature.map((value) => (value - min) / range);
}

export function compareIconSignatures(a: number[], b: number[]): number {
  if (!a.length || !b.length || a.length !== b.length) {
    return 0;
  }
  const normalizedA = normalizeSignature(a);
  const normalizedB = normalizeSignature(b);
  const averageDiff =
    normalizedA.reduce((sum, value, index) => sum + Math.abs(value - normalizedB[index]), 0) /
    normalizedA.length;
  return Math.max(0, 1 - averageDiff);
}

export function createSlotRect(rect: NormalizedRect, slotCount: number, slotIndex: number): NormalizedRect {
  const width = rect.w / Math.max(1, slotCount);
  return {
    x: rect.x + width * slotIndex,
    y: rect.y,
    w: width,
    h: rect.h
  };
}

export function captureIconTemplate(
  source: PixelSource | undefined,
  regionId: string,
  rect: NormalizedRect,
  slotCount: number,
  slotIndex: number,
  trackerId: string,
  gridSize = DEFAULT_ICON_GRID_SIZE
): TrackerIconTemplate | undefined {
  if (!source?.isReady()) {
    return undefined;
  }

  const slotRect = createSlotRect(rect, slotCount, slotIndex);
  const signature = source.readSignature(slotRect, gridSize);
  if (!signature.length) {
    return undefined;
  }

  return {
    trackerId,
    regionId,
    slotIndex,
    gridSize,
    signature,
    capturedAt: new Date().toISOString()
  };
}

export function matchSlotAgainstTemplates(
  source: PixelSource | undefined,
  rect: NormalizedRect,
  slotCount: number,
  slotIndex: number,
  templates: TrackerIconTemplateMap,
  minScore = 0.84
): TrackerIconMatch | undefined {
  if (!source?.isReady()) {
    return undefined;
  }

  const slotRect = createSlotRect(rect, slotCount, slotIndex);
  const candidates = Object.values(templates);
  let best: TrackerIconMatch | undefined;

  for (const template of candidates) {
    const liveSignature = source.readSignature(slotRect, template.gridSize);
    const score = compareIconSignatures(template.signature, liveSignature);
    if (score >= minScore && (!best || score > best.score)) {
      best = {
        trackerId: template.trackerId,
        slotIndex,
        score
      };
    }
  }

  return best;
}

export function valueFromIconMatch(match: TrackerIconMatch): TrackerValue | undefined {
  const definition = getTrackerDefinition(match.trackerId);
  if (!definition) {
    return undefined;
  }

  return {
    id: definition.id,
    kind: definition.kind,
    active: true,
    source: "sample",
    confidence: match.score,
    rawMatch: `icon-slot-${match.slotIndex + 1}`
  };
}
