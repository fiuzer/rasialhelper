import {
  getResolvedLanguages,
  loadSettings,
  saveSettings,
  type AppSettings
} from "../config/settings";
import { detectGameLanguage, type MatchResult } from "../recognition/matcher";
import type { RegionKey } from "../recognition/profiles";
import type { SetupItemState } from "../setup/catalog";
import {
  analyzeSetupSample,
  buildSetupReport,
  createDefaultSetupState,
  mergeSetupDetections
} from "../setup/validator";
import type { SupportedLanguage } from "../types/languages";
import { getVisualProfile, type NormalizedRect } from "../visual/profiles";
import { scanVisualProfile, type VisualRegionResult } from "../visual/detector";
import type { PixelSource } from "../visual/detector";
import { getTrackerProfile } from "../tracking/profiles";
import { scanTrackerProfile, type TrackerRegionResult } from "../tracking/detector";
import type { TrackerValue } from "../tracking/catalog";

export interface DiagnosticEntry {
  timestamp: string;
  message: string;
}

export interface AppState {
  settings: AppSettings;
  resolvedAppLanguage: SupportedLanguage;
  resolvedGameLanguage: SupportedLanguage;
  diagnostics: DiagnosticEntry[];
  lastMatch?: MatchResult;
  timelineIndex: number;
  selectedPresetId: string;
  setupItems: Record<string, SetupItemState>;
  selectedVisualProfileId: string;
  visualRegionOverrides: Record<string, Partial<NormalizedRect>>;
  visualSamples: Record<string, string>;
  visualResults: Record<string, VisualRegionResult>;
  selectedTrackerProfileId: string;
  trackerRegionOverrides: Record<string, Partial<NormalizedRect>>;
  trackerSamples: Record<string, string>;
  trackerResults: Record<string, TrackerRegionResult>;
  trackerValues: Record<string, TrackerValue>;
}

function createDefaultVisualSamples(profileId: string): Record<string, string> {
  return Object.fromEntries(getVisualProfile(profileId).regions.map((region) => [region.id, ""]));
}

function createDefaultTrackerSamples(profileId: string): Record<string, string> {
  return Object.fromEntries(getTrackerProfile(profileId).regions.map((region) => [region.id, ""]));
}

export function createInitialState(
  storage: Storage | undefined,
  navigatorLanguage?: string
): AppState {
  const settings = loadSettings(storage);
  const resolved = getResolvedLanguages(settings, navigatorLanguage);
  return {
    settings,
    resolvedAppLanguage: resolved.appLanguage,
    resolvedGameLanguage: resolved.gameLanguage,
    diagnostics: [],
    timelineIndex: -1,
    selectedPresetId: "safe-learning",
    setupItems: createDefaultSetupState(),
    selectedVisualProfileId: "standard-16x9",
    visualRegionOverrides: {},
    visualSamples: createDefaultVisualSamples("standard-16x9"),
    visualResults: {},
    selectedTrackerProfileId: "rasial-standard",
    trackerRegionOverrides: {},
    trackerSamples: createDefaultTrackerSamples("rasial-standard"),
    trackerResults: {},
    trackerValues: {}
  };
}

export function updateSettings(
  state: AppState,
  storage: Storage | undefined,
  settings: AppSettings,
  navigatorLanguage?: string
): AppState {
  const saved = saveSettings(storage, settings);
  const resolved = getResolvedLanguages(settings, navigatorLanguage);
  return {
    ...state,
    settings,
    resolvedAppLanguage: resolved.appLanguage,
    resolvedGameLanguage: resolved.gameLanguage,
    diagnostics: [
      {
        timestamp: new Date().toISOString(),
        message: saved ? "settings-saved" : "settings-save-failed"
      },
      ...state.diagnostics
    ]
  };
}

export function runCalibration(state: AppState, sample: string, region: RegionKey): AppState {
  const match = detectGameLanguage(
    sample,
    region,
    state.settings.gameLanguage,
    state.settings.forceRecognitionLanguage
  );

  return {
    ...state,
    resolvedGameLanguage: match.resolvedLanguage,
    lastMatch: match,
    diagnostics: [
      {
        timestamp: new Date().toISOString(),
        message: match.warning ?? "calibration-ok"
      },
      ...state.diagnostics
    ]
  };
}

export function advanceTimeline(state: AppState, maxIndex: number): AppState {
  const nextIndex = state.timelineIndex >= maxIndex ? 0 : state.timelineIndex + 1;
  return {
    ...state,
    timelineIndex: nextIndex
  };
}

export function clearDiagnostics(state: AppState): AppState {
  return {
    ...state,
    diagnostics: []
  };
}

export function selectPreset(state: AppState, presetId: string): AppState {
  return {
    ...state,
    selectedPresetId: presetId,
    diagnostics: [
      {
        timestamp: new Date().toISOString(),
        message: "preset-applied"
      },
      ...state.diagnostics
    ]
  };
}

export function updateSetupItem(
  state: AppState,
  itemId: string,
  setupItem: SetupItemState
): AppState {
  return {
    ...state,
    setupItems: {
      ...state.setupItems,
      [itemId]: setupItem
    }
  };
}

export function clearSetup(state: AppState): AppState {
  return {
    ...state,
    setupItems: createDefaultSetupState(),
    diagnostics: [
      {
        timestamp: new Date().toISOString(),
        message: "setup-cleared"
      },
      ...state.diagnostics
    ]
  };
}

export function selectVisualProfile(state: AppState, profileId: string): AppState {
  return {
    ...state,
    selectedVisualProfileId: profileId,
    visualRegionOverrides: {},
    visualSamples: createDefaultVisualSamples(profileId),
    visualResults: {},
    diagnostics: [
      {
        timestamp: new Date().toISOString(),
        message: "visual-profile-applied"
      },
      ...state.diagnostics
    ]
  };
}

export function updateVisualSample(
  state: AppState,
  regionId: string,
  value: string
): AppState {
  return {
    ...state,
    visualSamples: {
      ...state.visualSamples,
      [regionId]: value
    }
  };
}

export function updateVisualRegionOverride(
  state: AppState,
  regionId: string,
  rect: Partial<NormalizedRect>
): AppState {
  return {
    ...state,
    visualRegionOverrides: {
      ...state.visualRegionOverrides,
      [regionId]: {
        ...state.visualRegionOverrides[regionId],
        ...rect
      }
    }
  };
}

export function resetVisualCalibration(state: AppState): AppState {
  return {
    ...state,
    visualRegionOverrides: {},
    visualSamples: createDefaultVisualSamples(state.selectedVisualProfileId),
    visualResults: {},
    diagnostics: [
      {
        timestamp: new Date().toISOString(),
        message: "visual-reset"
      },
      ...state.diagnostics
    ]
  };
}

export function runVisualScan(
  state: AppState,
  source: PixelSource | undefined
): AppState {
  const report = scanVisualProfile(
    source,
    state.selectedVisualProfileId,
    state.settings.gameLanguage,
    state.visualRegionOverrides,
    state.visualSamples
  );

  const nextSetupItems = { ...state.setupItems };
  for (const [itemId, update] of Object.entries(report.setupUpdates)) {
    nextSetupItems[itemId] = {
      confidence: update.confidence,
      lastSource: update.source
    };
  }

  return {
    ...state,
    setupItems: nextSetupItems,
    visualResults: Object.fromEntries(report.regions.map((region) => [region.regionId, region])),
    diagnostics: [
      {
        timestamp: new Date().toISOString(),
        message: report.regions.some((region) => region.status !== "missing")
          ? "visual-scan-complete"
          : "visual-scan-empty"
      },
      ...state.diagnostics
    ]
  };
}

export function selectTrackerProfile(state: AppState, profileId: string): AppState {
  return {
    ...state,
    selectedTrackerProfileId: profileId,
    trackerRegionOverrides: {},
    trackerSamples: createDefaultTrackerSamples(profileId),
    trackerResults: {},
    trackerValues: {},
    diagnostics: [
      {
        timestamp: new Date().toISOString(),
        message: "tracker-profile-applied"
      },
      ...state.diagnostics
    ]
  };
}

export function updateTrackerSample(
  state: AppState,
  regionId: string,
  value: string
): AppState {
  return {
    ...state,
    trackerSamples: {
      ...state.trackerSamples,
      [regionId]: value
    }
  };
}

export function updateTrackerRegionOverride(
  state: AppState,
  regionId: string,
  rect: Partial<NormalizedRect>
): AppState {
  return {
    ...state,
    trackerRegionOverrides: {
      ...state.trackerRegionOverrides,
      [regionId]: {
        ...state.trackerRegionOverrides[regionId],
        ...rect
      }
    }
  };
}

export function resetTrackerCalibration(state: AppState): AppState {
  return {
    ...state,
    trackerRegionOverrides: {},
    trackerSamples: createDefaultTrackerSamples(state.selectedTrackerProfileId),
    trackerResults: {},
    trackerValues: {},
    diagnostics: [
      {
        timestamp: new Date().toISOString(),
        message: "tracker-reset"
      },
      ...state.diagnostics
    ]
  };
}

export function runTrackerScan(
  state: AppState,
  source: PixelSource | undefined
): AppState {
  const report = scanTrackerProfile(
    source,
    state.selectedTrackerProfileId,
    state.settings.gameLanguage,
    state.trackerRegionOverrides,
    state.trackerSamples
  );

  return {
    ...state,
    trackerResults: Object.fromEntries(report.regions.map((region) => [region.regionId, region])),
    trackerValues: report.values,
    diagnostics: [
      {
        timestamp: new Date().toISOString(),
        message: Object.keys(report.values).length ? "tracker-scan-complete" : "tracker-scan-empty"
      },
      ...state.diagnostics
    ]
  };
}

export function analyzeSetup(state: AppState, sample: string): AppState {
  const detections = analyzeSetupSample(sample, state.settings.gameLanguage);
  return {
    ...state,
    setupItems: mergeSetupDetections(state.setupItems, detections),
    diagnostics: [
      {
        timestamp: new Date().toISOString(),
        message: detections.length ? "setup-analyzed" : "setup-no-match"
      },
      ...state.diagnostics
    ]
  };
}

export function getSetupReport(state: AppState) {
  return buildSetupReport(state.selectedPresetId, state.setupItems);
}

export function resetState(
  storage: Storage | undefined,
  navigatorLanguage?: string
): AppState {
  return createInitialState(storage, navigatorLanguage);
}
