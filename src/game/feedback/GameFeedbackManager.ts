import { AudioManager } from "./AudioManager";
import { HapticManager } from "./HapticManager";
import type { AudioSettings, FeedbackEventId, FeedbackSpec } from "./feedbackTypes";

const eventFeedback: Record<FeedbackEventId, FeedbackSpec> = {
  uiTap: { sound: "uiTap", haptic: "light" },
  toggleSwitch: { sound: "toggleSwitch", haptic: "light" },
  choiceSelected: { sound: "choiceSelected", haptic: "light" },
  goodDecision: { sound: "choiceSuccess", haptic: "success" },
  riskyDecision: { sound: "choiceWarning", haptic: "warning" },
  incidentWarning: { sound: "incidentWarning", haptic: "warning" },
  criticalIncident: { sound: "incidentCritical", haptic: "heavy" },
  nodeAdded: { sound: "architectureNodeAdded", haptic: "medium" },
  nodeFailed: { sound: "architectureNodeFailed", haptic: "error" },
  metricImproved: { sound: "metricImproved", haptic: "light" },
  metricWorsened: { sound: "metricWorsened", haptic: "light" },
  cashSpent: { sound: "cashSpent", haptic: "light" },
  xpGain: { sound: "xpGain" },
  levelComplete: { sound: "levelComplete", haptic: "success" },
  awardUnlocked: { sound: "awardUnlocked", haptic: "success" },
  tabSelect: { sound: "tabSelect", haptic: "light" },
  hintOpen: { sound: "hintOpen", haptic: "light" },
};

class GameFeedbackManagerClass {
  connectAudioLifecycle() {
    return AudioManager.connectLifecycle();
  }

  configure(settings: AudioSettings) {
    AudioManager.configure(settings);
    HapticManager.configure(settings);
    if (settings.soundEnabled) AudioManager.preload();
  }

  play(sound: NonNullable<FeedbackSpec["sound"]>) {
    void AudioManager.play(sound);
  }

  trigger(feedback: FeedbackEventId | FeedbackSpec) {
    const spec = typeof feedback === "string" ? eventFeedback[feedback] : feedback;
    if (spec.sound) this.play(spec.sound);
    if (spec.haptic) void HapticManager.trigger(spec.haptic);
  }
}

export const gameFeedback = new GameFeedbackManagerClass();
