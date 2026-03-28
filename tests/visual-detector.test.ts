import { describe, expect, test } from "vitest";
import { resolveRect, scanVisualProfile } from "../src/visual/detector";
import type { PixelSource } from "../src/visual/detector";

describe("visual detector", () => {
  test("clamps normalized rectangles safely", () => {
    expect(
      resolveRect(
        { x: 0.1, y: 0.1, w: 0.2, h: 0.2 },
        { x: -0.5, y: 1.2, w: 2, h: 0.001 }
      )
    ).toEqual({
      x: 0,
      y: 0.98,
      w: 1,
      h: 0.02
    });
  });

  test("maps OCR-like visual samples into setup updates", () => {
    const report = scanVisualProfile(
      undefined,
      "standard-16x9",
      "en-US",
      {},
      {
        "buff-ribbon": "overload aura active",
        "survival-tray": "protection prayer food ready",
        "familiar-panel": "familiar summoned",
        "gear-status": "charges checked"
      }
    );

    expect(report.setupUpdates.offensive_potion.confidence).toBe("detected");
    expect(report.setupUpdates.protection_prayer.confidence).toBe("detected");
    expect(report.setupUpdates.familiar_active.confidence).toBe("detected");
    expect(report.setupUpdates.weapon_charges.confidence).toBe("detected");
  });

  test("uses brightness probes as uncertain visual evidence", () => {
    const source: PixelSource = {
      isReady: () => true,
      readText: () => "",
      readBrightness: () => ({ average: 100, hits: 2, total: 2 })
    };

    const report = scanVisualProfile(
      source,
      "standard-16x9",
      "auto",
      {},
      {}
    );

    expect(Object.values(report.setupUpdates).some((item) => item.confidence === "uncertain")).toBe(
      true
    );
  });
});
