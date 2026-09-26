export const soundIds = [
  "uiTap",
  "choiceSelected",
  "choiceSuccess",
  "choiceWarning",
  "incidentWarning",
  "incidentCritical",
  "architectureNodeAdded",
  "architectureNodeFailed",
  "metricImproved",
  "metricWorsened",
  "cashSpent",
  "xpGain",
  "levelComplete",
  "awardUnlocked",
  "toggleSwitch",
  "tabSelect",
  "hintOpen",
] as const;

export type SoundId = (typeof soundIds)[number];

export const hapticIds = ["none", "light", "medium", "heavy", "success", "warning", "error"] as const;
export type HapticId = (typeof hapticIds)[number];

export interface FeedbackSpec {
  sound?: SoundId;
  haptic?: HapticId;
}

export interface AudioSettings {
  soundEnabled: boolean;
  musicEnabled: boolean;
  hapticsEnabled: boolean;
  sfxVolume: number;
  musicVolume: number;
}

export const defaultAudioSettings: AudioSettings = {
  soundEnabled: true,
  musicEnabled: true,
  hapticsEnabled: true,
  sfxVolume: 0.8,
  musicVolume: 0.3,
};

export const feedbackEvents = [
  "uiTap",
  "toggleSwitch",
  "choiceSelected",
  "goodDecision",
  "riskyDecision",
  "incidentWarning",
  "criticalIncident",
  "nodeAdded",
  "nodeFailed",
  "metricImproved",
  "metricWorsened",
  "cashSpent",
  "xpGain",
  "levelComplete",
  "awardUnlocked",
  "tabSelect",
  "hintOpen",
] as const;

export type FeedbackEventId = (typeof feedbackEvents)[number];
