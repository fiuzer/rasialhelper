export interface NormalizedRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface TextProbeDefinition {
  kind: "text";
  anchorX: number;
  anchorY: number;
  fontName: "chat" | "chatmono" | "xpcounter";
  allowGap?: boolean;
}

export interface BrightnessProbeDefinition {
  kind: "brightness";
  points: Array<{
    x: number;
    y: number;
    min: number;
    max: number;
  }>;
}

export type VisualProbeDefinition = TextProbeDefinition | BrightnessProbeDefinition;

export interface VisualRegionDefinition {
  id: string;
  titleKey: string;
  descriptionKey: string;
  itemIds: string[];
  defaultRect: NormalizedRect;
  probes: VisualProbeDefinition[];
}

export interface VisualProfileDefinition {
  id: string;
  titleKey: string;
  descriptionKey: string;
  regions: VisualRegionDefinition[];
}

export const visualProfiles: VisualProfileDefinition[] = [
  {
    id: "standard-16x9",
    titleKey: "visual.profiles.standard16x9.title",
    descriptionKey: "visual.profiles.standard16x9.description",
    regions: [
      {
        id: "buff-ribbon",
        titleKey: "visual.regions.buffRibbon.title",
        descriptionKey: "visual.regions.buffRibbon.description",
        itemIds: ["offensive_potion", "combat_aura", "pocket_slot"],
        defaultRect: { x: 0.04, y: 0.02, w: 0.24, h: 0.08 },
        probes: [
          { kind: "text", anchorX: 0.08, anchorY: 0.55, fontName: "chat", allowGap: true },
          {
            kind: "brightness",
            points: [
              { x: 0.1, y: 0.5, min: 40, max: 235 },
              { x: 0.45, y: 0.5, min: 40, max: 235 }
            ]
          }
        ]
      },
      {
        id: "survival-tray",
        titleKey: "visual.regions.survivalTray.title",
        descriptionKey: "visual.regions.survivalTray.description",
        itemIds: ["protection_prayer", "emergency_healing", "defensive_plan"],
        defaultRect: { x: 0.72, y: 0.73, w: 0.25, h: 0.2 },
        probes: [
          { kind: "text", anchorX: 0.1, anchorY: 0.2, fontName: "chatmono", allowGap: true },
          {
            kind: "brightness",
            points: [
              { x: 0.3, y: 0.45, min: 30, max: 250 },
              { x: 0.65, y: 0.45, min: 30, max: 250 }
            ]
          }
        ]
      },
      {
        id: "familiar-panel",
        titleKey: "visual.regions.familiarPanel.title",
        descriptionKey: "visual.regions.familiarPanel.description",
        itemIds: ["familiar_active", "conjure_opener"],
        defaultRect: { x: 0.77, y: 0.46, w: 0.19, h: 0.14 },
        probes: [
          { kind: "text", anchorX: 0.08, anchorY: 0.2, fontName: "chat", allowGap: true },
          {
            kind: "brightness",
            points: [
              { x: 0.2, y: 0.55, min: 25, max: 250 }
            ]
          }
        ]
      },
      {
        id: "gear-status",
        titleKey: "visual.regions.gearStatus.title",
        descriptionKey: "visual.regions.gearStatus.description",
        itemIds: ["weapon_charges"],
        defaultRect: { x: 0.56, y: 0.73, w: 0.14, h: 0.12 },
        probes: [
          { kind: "text", anchorX: 0.18, anchorY: 0.2, fontName: "chatmono", allowGap: true }
        ]
      }
    ]
  },
  {
    id: "compact-ui",
    titleKey: "visual.profiles.compactUi.title",
    descriptionKey: "visual.profiles.compactUi.description",
    regions: [
      {
        id: "buff-ribbon",
        titleKey: "visual.regions.buffRibbon.title",
        descriptionKey: "visual.regions.buffRibbon.description",
        itemIds: ["offensive_potion", "combat_aura", "pocket_slot"],
        defaultRect: { x: 0.05, y: 0.03, w: 0.28, h: 0.09 },
        probes: [
          { kind: "text", anchorX: 0.08, anchorY: 0.55, fontName: "chat", allowGap: true }
        ]
      },
      {
        id: "survival-tray",
        titleKey: "visual.regions.survivalTray.title",
        descriptionKey: "visual.regions.survivalTray.description",
        itemIds: ["protection_prayer", "emergency_healing", "defensive_plan"],
        defaultRect: { x: 0.69, y: 0.74, w: 0.27, h: 0.18 },
        probes: [
          { kind: "text", anchorX: 0.1, anchorY: 0.18, fontName: "chatmono", allowGap: true }
        ]
      },
      {
        id: "familiar-panel",
        titleKey: "visual.regions.familiarPanel.title",
        descriptionKey: "visual.regions.familiarPanel.description",
        itemIds: ["familiar_active", "conjure_opener"],
        defaultRect: { x: 0.75, y: 0.49, w: 0.2, h: 0.13 },
        probes: [
          { kind: "text", anchorX: 0.08, anchorY: 0.24, fontName: "chat", allowGap: true }
        ]
      },
      {
        id: "gear-status",
        titleKey: "visual.regions.gearStatus.title",
        descriptionKey: "visual.regions.gearStatus.description",
        itemIds: ["weapon_charges"],
        defaultRect: { x: 0.58, y: 0.75, w: 0.12, h: 0.1 },
        probes: [
          { kind: "text", anchorX: 0.12, anchorY: 0.16, fontName: "chatmono", allowGap: true }
        ]
      }
    ]
  }
];

export function getVisualProfile(profileId: string): VisualProfileDefinition {
  return visualProfiles.find((profile) => profile.id === profileId) ?? visualProfiles[0];
}
