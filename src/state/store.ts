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
    setupItems: createDefaultSetupState()
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
