import { catalog, type TranslationTree } from "./catalog";
import {
  isSupportedLanguage,
  type LanguagePreference,
  type SupportedLanguage
} from "../types/languages";

function getByPath(tree: TranslationTree, key: string): string | undefined {
  let current: string | TranslationTree | undefined = tree;
  for (const segment of key.split(".")) {
    if (typeof current === "string" || current === undefined) {
      return undefined;
    }
    current = current[segment] as string | TranslationTree | undefined;
  }
  return typeof current === "string" ? current : undefined;
}

export function resolveAppLanguage(
  preference: LanguagePreference,
  navigatorLanguage?: string
): SupportedLanguage {
  if (preference !== "auto") {
    return preference;
  }
  if (!navigatorLanguage) {
    return "en-US";
  }
  return navigatorLanguage.toLowerCase().startsWith("pt") ? "pt-BR" : "en-US";
}

export class I18n {
  private readonly language: SupportedLanguage;
  private readonly fallbackLanguage: SupportedLanguage;

  constructor(language: SupportedLanguage, fallbackLanguage: SupportedLanguage = "en-US") {
    this.language = language;
    this.fallbackLanguage = fallbackLanguage;
  }

  public t(key: string): string {
    const exact = getByPath(catalog[this.language], key);
    if (exact) {
      return exact;
    }
    const fallback = getByPath(catalog[this.fallbackLanguage], key);
    if (fallback) {
      return fallback;
    }
    return `[missing:${key}]`;
  }
}

export function normalizeLanguageInput(value: string): LanguagePreference {
  if (value === "auto") {
    return "auto";
  }
  return isSupportedLanguage(value) ? value : "auto";
}
