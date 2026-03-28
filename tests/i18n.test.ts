import { describe, expect, test } from "vitest";
import enUS from "../src/locales/en-US.json";
import ptBR from "../src/locales/pt-BR.json";
import { I18n, resolveAppLanguage } from "../src/i18n";

function flattenKeys(tree: Record<string, unknown>, prefix = ""): string[] {
  return Object.entries(tree).flatMap(([key, value]) => {
    const nextKey = prefix ? `${prefix}.${key}` : key;
    return typeof value === "string"
      ? [nextKey]
      : flattenKeys(value as Record<string, unknown>, nextKey);
  });
}

describe("i18n", () => {
  test("resolves automatic app language from navigator locale", () => {
    expect(resolveAppLanguage("auto", "pt-BR")).toBe("pt-BR");
    expect(resolveAppLanguage("auto", "en-US")).toBe("en-US");
  });

  test("falls back to English when locale is unknown", () => {
    expect(resolveAppLanguage("auto", "fr-FR")).toBe("en-US");
  });

  test("returns translated labels for both languages", () => {
    expect(new I18n("pt-BR").t("settings.title")).toBe("Configurações");
    expect(new I18n("en-US").t("settings.title")).toBe("Settings");
  });

  test("returns a marked placeholder for missing translations", () => {
    expect(new I18n("en-US").t("missing.key")).toBe("[missing:missing.key]");
  });

  test("keeps locale keysets aligned", () => {
    expect(flattenKeys(ptBR)).toEqual(flattenKeys(enUS));
  });
});
