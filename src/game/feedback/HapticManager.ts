import * as Haptics from "expo-haptics";
import { Platform } from "react-native";
import type { AudioSettings, HapticId } from "./feedbackTypes";

class HapticManagerClass {
  private enabled = true;

  configure(settings: Pick<AudioSettings, "hapticsEnabled">) {
    this.enabled = settings.hapticsEnabled;
  }

  async trigger(hapticId: HapticId = "none") {
    // Browsers do not expose a consistent haptics API. Keep game feedback silent
    // on web instead of relying on browser-specific vibration support.
    if (!this.enabled || hapticId === "none" || Platform.OS === "web") return;

    try {
      switch (hapticId) {
        case "light":
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          break;
        case "medium":
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          break;
        case "heavy":
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          break;
        case "success":
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          break;
        case "warning":
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          break;
        case "error":
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          break;
      }
    } catch (error) {
      // Haptics can be absent or disabled by the device; feedback is best-effort.
      if (__DEV__) console.warn(`[ScaleLog haptics] Could not trigger "${hapticId}" on ${Platform.OS}.`, error);
    }
  }
}

export const HapticManager = new HapticManagerClass();
