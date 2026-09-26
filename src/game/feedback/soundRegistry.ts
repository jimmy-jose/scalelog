import type { AudioSource } from "expo-audio";
import type { SoundId } from "./feedbackTypes";

/** Original, pre-rendered PCM cues. Static requires keep all platforms bundled. */
export const soundRegistry: Record<SoundId, AudioSource | null> = {
  uiTap: require("../../../assets/audio/designed/tap.wav"),
  choiceSelected: require("../../../assets/audio/designed/choice-select.wav"),
  choiceSuccess: require("../../../assets/audio/designed/success.wav"),
  choiceWarning: require("../../../assets/audio/designed/warning.wav"),
  incidentWarning: require("../../../assets/audio/designed/incident-warning.wav"),
  incidentCritical: require("../../../assets/audio/designed/incident-critical.wav"),
  architectureNodeAdded: require("../../../assets/audio/designed/node-added.wav"),
  architectureNodeFailed: require("../../../assets/audio/designed/node-failed.wav"),
  metricImproved: require("../../../assets/audio/designed/metric-improved.wav"),
  metricWorsened: require("../../../assets/audio/designed/metric-worsened.wav"),
  cashSpent: require("../../../assets/audio/designed/cash-spent.wav"),
  xpGain: require("../../../assets/audio/designed/xp.wav"),
  levelComplete: require("../../../assets/audio/designed/level-complete.wav"),
  awardUnlocked: require("../../../assets/audio/designed/award-unlock.wav"),
  toggleSwitch: require("../../../assets/audio/designed/switch.wav"),
  tabSelect: require("../../../assets/audio/designed/tab-select.wav"),
  hintOpen: require("../../../assets/audio/designed/hint-open.wav"),
};

/** User-supplied ambient tracks; the manager advances them in a continuous playlist. */
export const backgroundMusicSources: AudioSource[] = [
  require("../../../assets/audio/music/bg1.mp3"),
  require("../../../assets/audio/music/bg2.mp3"),
  require("../../../assets/audio/music/bg3.mp3"),
];
