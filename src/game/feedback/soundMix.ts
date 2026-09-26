import type { SoundId } from "./feedbackTypes";

export type SoundLane = "ui" | "event";
interface SoundMix {
  lane: SoundLane;
  gain: number;
  cooldownMs: number;
  durationMs: number;
  priority: number;
}

// Assets already have headroom. These trims keep frequent gestures in the
// background and give important outcomes space without increasing master volume.
export const soundMix: Record<SoundId, SoundMix> = {
  uiTap: { lane: "ui", gain: .65, cooldownMs: 80, durationMs: 82, priority: 0 },
  tabSelect: { lane: "ui", gain: .65, cooldownMs: 90, durationMs: 97, priority: 0 },
  toggleSwitch: { lane: "ui", gain: .7, cooldownMs: 120, durationMs: 137, priority: 0 },
  hintOpen: { lane: "ui", gain: .8, cooldownMs: 350, durationMs: 342, priority: 0 },
  choiceSelected: { lane: "event", gain: .85, cooldownMs: 250, durationMs: 207, priority: 1 },
  choiceSuccess: { lane: "event", gain: .9, cooldownMs: 550, durationMs: 482, priority: 2 },
  choiceWarning: { lane: "event", gain: .9, cooldownMs: 450, durationMs: 362, priority: 2 },
  incidentWarning: { lane: "event", gain: .85, cooldownMs: 1000, durationMs: 392, priority: 3 },
  incidentCritical: { lane: "event", gain: .9, cooldownMs: 1200, durationMs: 482, priority: 3 },
  architectureNodeAdded: { lane: "event", gain: .8, cooldownMs: 300, durationMs: 282, priority: 1 },
  architectureNodeFailed: { lane: "event", gain: .85, cooldownMs: 300, durationMs: 272, priority: 2 },
  metricImproved: { lane: "event", gain: .65, cooldownMs: 350, durationMs: 242, priority: 0 },
  metricWorsened: { lane: "event", gain: .65, cooldownMs: 350, durationMs: 242, priority: 0 },
  cashSpent: { lane: "event", gain: .65, cooldownMs: 250, durationMs: 177, priority: 0 },
  xpGain: { lane: "event", gain: .75, cooldownMs: 300, durationMs: 247, priority: 1 },
  levelComplete: { lane: "event", gain: .9, cooldownMs: 900, durationMs: 672, priority: 2 },
  awardUnlocked: { lane: "event", gain: .95, cooldownMs: 1200, durationMs: 872, priority: 3 },
};
