import type { NormalizedRect, VisualProbeDefinition } from "../visual/profiles";

export interface TrackerRegionDefinition {
  id: string;
  titleKey: string;
  descriptionKey: string;
  trackerIds: string[];
  defaultRect: NormalizedRect;
  probes: VisualProbeDefinition[];
  parser?: "free-text" | "slot-bar";
  slotCount?: number;
}

export interface TrackerProfileDefinition {
  id: string;
  titleKey: string;
  descriptionKey: string;
  supportedModeKey: string;
  regions: TrackerRegionDefinition[];
}

export const trackerProfiles: TrackerProfileDefinition[] = [
  {
    id: "rasial-standard",
    titleKey: "tracker.profiles.rasialStandard.title",
    descriptionKey: "tracker.profiles.rasialStandard.description",
    supportedModeKey: "tracker.supportedMode",
    regions: [
      {
        id: "necro-gauge",
        titleKey: "tracker.regions.necroGauge.title",
        descriptionKey: "tracker.regions.necroGauge.description",
        trackerIds: ["necrosis_stacks", "residual_souls"],
        defaultRect: { x: 0.74, y: 0.66, w: 0.15, h: 0.1 },
        probes: [
          { kind: "text", anchorX: 0.15, anchorY: 0.35, fontName: "chatmono", allowGap: true }
        ],
        parser: "free-text"
      },
      {
        id: "summon-bar",
        titleKey: "tracker.regions.summonBar.title",
        descriptionKey: "tracker.regions.summonBar.description",
        trackerIds: ["ghost_timer", "skeleton_timer", "zombie_timer"],
        defaultRect: { x: 0.68, y: 0.55, w: 0.25, h: 0.09 },
        probes: [
          { kind: "text", anchorX: 0.08, anchorY: 0.3, fontName: "chat", allowGap: true }
        ],
        parser: "free-text"
      },
      {
        id: "buff-bar",
        titleKey: "tracker.regions.buffBar.title",
        descriptionKey: "tracker.regions.buffBar.description",
        trackerIds: ["living_death", "bloat", "split_soul", "overload_active"],
        defaultRect: { x: 0.03, y: 0.02, w: 0.28, h: 0.08 },
        probes: [
          { kind: "text", anchorX: 0.1, anchorY: 0.55, fontName: "chat", allowGap: true }
        ],
        parser: "slot-bar",
        slotCount: 8
      }
    ]
  }
];

export function getTrackerProfile(profileId: string): TrackerProfileDefinition {
  return trackerProfiles.find((profile) => profile.id === profileId) ?? trackerProfiles[0];
}
