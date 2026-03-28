import { describe, expect, test } from "vitest";
import { trackerDefinitions, trackerWikiIndex } from "../src/tracking/catalog";
import { getTrackerIconCatalogEntry } from "../src/tracking/icon-catalog";

describe("tracker icon catalog", () => {
  test("every tracked value has wiki-backed metadata", () => {
    expect(trackerWikiIndex.buffsAndDebuffs).toContain("Buffs_and_debuffs");
    expect(trackerWikiIndex.buffBarSettings).toContain("Buff_Bar");

    for (const definition of trackerDefinitions) {
      const entry = getTrackerIconCatalogEntry(definition.id);
      expect(entry).toBeDefined();
      expect(entry?.wikiUrl).toContain("runescape.wiki");
      expect(entry?.iconFileHint.length).toBeGreaterThan(4);
      expect(entry?.strategy.length).toBeGreaterThan(3);
    }
  });

  test("slot-driven entries keep their default slot mapping", () => {
    expect(getTrackerIconCatalogEntry("residual_souls")?.defaultBarSlot).toBe(1);
    expect(getTrackerIconCatalogEntry("necrosis_stacks")?.defaultBarSlot).toBe(2);
    expect(getTrackerIconCatalogEntry("living_death")?.defaultBarSlot).toBe(3);
  });
});
