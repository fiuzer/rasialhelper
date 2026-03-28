import { describe, expect, test } from "vitest";
import { scanTrackerProfile } from "../src/tracking/detector";
import type { PixelSource } from "../src/visual/detector";
import type { TrackerIconTemplateMap } from "../src/tracking/icon-matcher";

describe("tracker detector", () => {
  test("parses Rasial-oriented gauge and buff samples", () => {
    const report = scanTrackerProfile(undefined, "rasial-standard", "en-US", {}, {
      "necro-gauge": "necrosis 8 residual souls 3",
      "summon-bar": "ghost 22s skeleton 14s zombie 11s",
      "buff-bar": "living death 24s bloat 18s split soul overload"
    });

    expect(report.values.necrosis_stacks.value).toBe(8);
    expect(report.values.residual_souls.value).toBe(3);
    expect(report.values.living_death.value).toBe(24);
    expect(report.values.bloat.value).toBe(18);
    expect(report.values.split_soul.active).toBe(true);
  });

  test("supports portuguese aliases", () => {
    const report = scanTrackerProfile(undefined, "rasial-standard", "pt-BR", {}, {
      "necro-gauge": "necrosis 7 almas residuais 2",
      "summon-bar": "fantasma 20s esqueleto 15s",
      "buff-bar": "morte viva 26s overload"
    });

    expect(report.values.necrosis_stacks.value).toBe(7);
    expect(report.values.residual_souls.value).toBe(2);
    expect(report.values.living_death.value).toBe(26);
  });

  test("reads buff-bar slots automatically with a slot-based pixel reader", () => {
    const source: PixelSource = {
      isReady: () => true,
      readText: (rect) => {
        if (rect.x <= 0.03) {
          return "2";
        }
        if (rect.x <= 0.065) {
          return "8";
        }
        if (rect.x <= 0.1) {
          return "24";
        }
        if (rect.x <= 0.135) {
          return "20%";
        }
        return "";
      },
      readBrightness: () => ({ average: 0, hits: 0, total: 0 }),
      readSignature: () => []
    };

    const report = scanTrackerProfile(source, "rasial-standard", "en-US", {}, {});
    expect(report.values.residual_souls.value).toBe(2);
    expect(report.values.necrosis_stacks.value).toBe(8);
    expect(report.values.living_death.value).toBe(24);
    expect(report.values.split_soul.active).toBe(true);
  });

  test("supports manual slot samples for buff-bar fallback", () => {
    const report = scanTrackerProfile(undefined, "rasial-standard", "en-US", {}, {
      "buff-bar": "2 | 8 | 24 | 20%"
    });

    expect(report.values.residual_souls.value).toBe(2);
    expect(report.values.necrosis_stacks.value).toBe(8);
    expect(report.values.living_death.value).toBe(24);
    expect(report.values.split_soul.active).toBe(true);
  });

  test("uses icon templates to detect toggle buffs when OCR is weak", () => {
    const templates: TrackerIconTemplateMap = {
      split_soul: {
        trackerId: "split_soul",
        regionId: "buff-bar",
        slotIndex: 3,
        gridSize: 2,
        signature: [5, 10, 200, 210],
        capturedAt: "2026-03-28T00:00:00.000Z"
      }
    };

    const source: PixelSource = {
      isReady: () => true,
      readText: () => "",
      readBrightness: () => ({ average: 0, hits: 0, total: 0 }),
      readSignature: (rect) =>
        rect.x >= 0.13 && rect.x <= 0.14 ? [5, 10, 200, 210] : [0, 0, 0, 0]
    };

    const report = scanTrackerProfile(source, "rasial-standard", "en-US", {}, {}, templates);
    expect(report.values.split_soul.active).toBe(true);
    expect(report.regions.find((region) => region.regionId === "buff-bar")?.iconMatches?.length).toBe(1);
  });
});
