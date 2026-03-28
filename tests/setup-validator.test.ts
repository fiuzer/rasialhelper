import { describe, expect, test } from "vitest";
import {
  analyzeSetupSample,
  buildSetupReport,
  createDefaultSetupState,
  mergeSetupDetections
} from "../src/setup/validator";

describe("setup validator", () => {
  test("detects English setup aliases", () => {
    const detections = analyzeSetupSample(
      "overload active, aura active, familiar summoned, food ready",
      "en-US"
    );
    expect(detections.some((item) => item.itemId === "offensive_potion")).toBe(true);
    expect(detections.some((item) => item.itemId === "combat_aura")).toBe(true);
    expect(detections.some((item) => item.itemId === "familiar_active")).toBe(true);
  });

  test("detects Portuguese setup aliases", () => {
    const detections = analyzeSetupSample(
      "overload, aura ativa, familiar invocado, cura pronta",
      "pt-BR"
    );
    expect(detections.some((item) => item.itemId === "offensive_potion")).toBe(true);
    expect(detections.some((item) => item.itemId === "combat_aura")).toBe(true);
    expect(detections.some((item) => item.itemId === "familiar_active")).toBe(true);
  });

  test("builds readiness report with missing required items", () => {
    const state = createDefaultSetupState();
    const merged = mergeSetupDetections(
      state,
      analyzeSetupSample("overload, food, charges checked", "en-US")
    );
    const report = buildSetupReport("minimal-check", merged);
    expect(report.requiredTotal).toBeGreaterThan(0);
    expect(report.missingRequired.length).toBeGreaterThan(0);
    expect(report.readinessScore).toBeGreaterThan(0);
  });
});
