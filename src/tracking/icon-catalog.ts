import {
  getTrackerDefinition,
  trackerDefinitions,
  trackerWikiIndex,
  type TrackerDetectionStrategy
} from "./catalog";

export interface TrackerIconCatalogEntry {
  trackerId: string;
  label: string;
  wikiUrl: string;
  iconFileHint: string;
  buffBarCategory: string;
  strategy: TrackerDetectionStrategy;
  defaultBarSlot?: number;
}

export const trackerIconCatalog: TrackerIconCatalogEntry[] = trackerDefinitions.map((definition) => ({
  trackerId: definition.id,
  label: definition.id,
  wikiUrl: `https://runescape.wiki${definition.wiki.articlePath}`,
  iconFileHint: definition.wiki.iconFileHint,
  buffBarCategory: definition.wiki.buffBarCategory,
  strategy: definition.wiki.strategy,
  defaultBarSlot: definition.wiki.defaultBarSlot
}));

export function buildTrackerIconCatalogSummary(): string[] {
  return [
    `Index: ${trackerWikiIndex.buffsAndDebuffs}`,
    `Settings: ${trackerWikiIndex.buffBarSettings}`,
    ...trackerIconCatalog.map((entry) => {
      const slot = entry.defaultBarSlot ? `slot ${entry.defaultBarSlot}` : "free region";
      return `${entry.trackerId}: ${entry.strategy}, ${entry.buffBarCategory}, ${slot}, ${entry.iconFileHint}`;
    })
  ];
}

export function getTrackerIconCatalogEntry(trackerId: string): TrackerIconCatalogEntry | undefined {
  const definition = getTrackerDefinition(trackerId);
  if (!definition) {
    return undefined;
  }

  return trackerIconCatalog.find((entry) => entry.trackerId === definition.id);
}
