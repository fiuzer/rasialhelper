export interface TimelineEvent {
  tick: number;
  phase: number;
  mechanicId: string;
  recommendationId:
    | "overlay.start"
    | "overlay.defensive"
    | "overlay.reposition"
    | "overlay.burst";
}

export const studyTimeline: TimelineEvent[] = [
  { tick: 0, phase: 1, mechanicId: "Opening pressure", recommendationId: "overlay.start" },
  { tick: 12, phase: 1, mechanicId: "Soul volley", recommendationId: "overlay.defensive" },
  { tick: 24, phase: 2, mechanicId: "Lane hazard", recommendationId: "overlay.reposition" },
  { tick: 38, phase: 2, mechanicId: "Damage window", recommendationId: "overlay.burst" }
];
