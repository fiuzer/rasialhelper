import { describe, expect, test } from "vitest";
import { detectGameLanguage } from "../src/recognition/matcher";

describe("language-aware matching", () => {
  test("matches English aliases", () => {
    const result = detectGameLanguage("Phase 2", "phase", "auto", false);
    expect(result.resolvedLanguage).toBe("en-US");
    expect(result.best?.id).toBe("phase.two");
    expect(result.confidence).toBeGreaterThan(0.9);
  });

  test("matches Portuguese aliases without accent dependency", () => {
    const result = detectGameLanguage("FASE 2", "phase", "auto", false);
    expect(result.resolvedLanguage).toBe("pt-BR");
    expect(result.best?.id).toBe("phase.two");
  });

  test("allows OCR-noisy samples", () => {
    const result = detectGameLanguage("Ra5ial", "boss", "auto", false);
    expect(result.best?.id).toBe("boss.rasial");
  });

  test("reports mismatch when selected language differs from best profile", () => {
    const result = detectGameLanguage("Fase 2", "phase", "en-US", false);
    expect(result.warning).toBe("language-mismatch");
    expect(result.resolvedLanguage).toBe("pt-BR");
  });

  test("respects forced language selection", () => {
    const result = detectGameLanguage("Fase 2", "phase", "en-US", true);
    expect(result.resolvedLanguage).toBe("en-US");
  });
});
