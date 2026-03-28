import { describe, expect, test } from "vitest";
import { scanTrackerProfile } from "../src/tracking/detector";

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
});
