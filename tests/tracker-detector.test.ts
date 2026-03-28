import { describe, expect, test } from "vitest";
import { scanTrackerProfile } from "../src/tracking/detector";
import type { PixelSource } from "../src/visual/detector";

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
        if (rect.x < 0.065) {
          return "living death 24";
        }
        if (rect.x < 0.1) {
          return "bloat 18";
        }
        if (rect.x < 0.135) {
          return "split soul";
        }
        if (rect.x < 0.17) {
          return "overload";
        }
        return "";
      },
      readBrightness: () => ({ average: 0, hits: 0, total: 0 })
    };

    const report = scanTrackerProfile(source, "rasial-standard", "en-US", {}, {});
    expect(report.values.living_death.value).toBe(24);
    expect(report.values.bloat.value).toBe(18);
    expect(report.values.split_soul.active).toBe(true);
    expect(report.values.overload_active.active).toBe(true);
  });
});
