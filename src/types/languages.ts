export const supportedLanguages = ["en-US", "pt-BR"] as const;

export type SupportedLanguage = (typeof supportedLanguages)[number];
export type LanguagePreference = "auto" | SupportedLanguage;

export function isSupportedLanguage(value: string): value is SupportedLanguage {
  return supportedLanguages.includes(value as SupportedLanguage);
}
