import { Pressable, StyleSheet, Text } from "react-native";
import { useGameStore } from "@/store/gameStore";
import { gameFeedback } from "@/game/feedback/GameFeedbackManager";
import { colors } from "@/ui/theme";

/** Persistent one-tap soundtrack control for the campaign and game headers. */
export function MusicButton() {
  const musicEnabled = useGameStore((state) => state.audioSettings.musicEnabled);
  const updateAudioSettings = useGameStore((state) => state.updateAudioSettings);
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={musicEnabled ? "Turn off background music" : "Turn on background music"}
      accessibilityState={{ checked: musicEnabled }}
      onPress={() => {
        gameFeedback.trigger("toggleSwitch");
        updateAudioSettings({ musicEnabled: !musicEnabled });
      }}
      style={({ pressed }) => [styles.button, musicEnabled && styles.enabled, pressed && styles.pressed]}
    >
      <Text style={[styles.icon, musicEnabled && styles.iconEnabled]}>{musicEnabled ? "♫" : "♪"}</Text>
      <Text style={[styles.label, musicEnabled && styles.labelEnabled]}>{musicEnabled ? "ON" : "OFF"}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { minHeight: 36, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, paddingHorizontal: 8, borderRadius: 10, borderWidth: 1, borderColor: "#30445E", backgroundColor: "#111F32" },
  enabled: { borderColor: "#36675E", backgroundColor: "#102722" },
  icon: { color: "#8395AB", fontSize: 14, fontWeight: "800" },
  iconEnabled: { color: colors.mint },
  label: { color: "#92A2B7", fontSize: 7, fontWeight: "900", letterSpacing: .55 },
  labelEnabled: { color: "#BDEDDD" },
  pressed: { opacity: .72 },
});
