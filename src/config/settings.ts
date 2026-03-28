import { resolveAppLanguage, normalizeLanguageInput } from "../i18n";
import type { LanguagePreference, SupportedLanguage } from "../types/languages";

export interface AppSettings {
  appLanguage: LanguagePreference;
  gameLanguage: LanguagePreference;
  forceRecognitionLanguage: boolean;
}

const settingsKey = "rasial-helper-settings";

export const defaultSettings: AppSettings = {
  appLanguage: "auto",
  gameLanguage: "auto",
  forceRecognitionLanguage: false
};

export function loadSettings(storage: Storage | undefined): AppSettings {
  if (!storage) {
    return defaultSettings;
  }
  try {
    const raw = storage.getItem(settingsKey);
    if (!raw) {
      return defaultSettings;
    }
    const parsed = JSON.parse(raw) as Partial<AppSettings>;
    return {
      appLanguage: normalizeLanguageInput(parsed.appLanguage ?? "auto"),
      gameLanguage: normalizeLanguageInput(parsed.gameLanguage ?? "auto"),
      forceRecognitionLanguage: Boolean(parsed.forceRecognitionLanguage)
    };
  } catch {
    return defaultSettings;
  }
}

export function saveSettings(storage: Storage | undefined, settings: AppSettings): boolean {
  if (!storage) {
    return false;
  }
  try {
    storage.setItem(settingsKey, JSON.stringify(settings));
    return true;
  } catch {
    return false;
  }
}

export function getResolvedLanguages(
  settings: AppSettings,
  navigatorLanguage?: string
): {
  appLanguage: SupportedLanguage;
  gameLanguage: SupportedLanguage;
} {
  const appLanguage = resolveAppLanguage(settings.appLanguage, navigatorLanguage);
  const gameLanguage = settings.gameLanguage === "auto" ? appLanguage : settings.gameLanguage;
  return { appLanguage, gameLanguage };
}
