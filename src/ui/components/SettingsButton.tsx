import { Pressable, StyleSheet } from "react-native";
import { router } from "expo-router";
import Svg, { Circle, Path } from "react-native-svg";
import { gameFeedback } from "@/game/feedback/GameFeedbackManager";

export function SettingsButton() {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Open sound and haptics settings"
      onPress={() => { gameFeedback.trigger("uiTap"); router.push("/settings"); }}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
    >
      <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
        <Path d="M4 7h9m4 0h3M4 17h3m4 0h9" stroke="#B9C8D9" strokeWidth={1.7} strokeLinecap="round" />
        <Circle cx="15" cy="7" r="2" fill="#0D1B2C" stroke="#72D8BC" strokeWidth={1.7} />
        <Circle cx="9" cy="17" r="2" fill="#0D1B2C" stroke="#72D8BC" strokeWidth={1.7} />
      </Svg>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { width: 38, height: 38, alignItems: "center", justifyContent: "center", borderRadius: 11, borderWidth: 1, borderColor: "#30445E", backgroundColor: "#111F32" },
  pressed: { opacity: 0.7, backgroundColor: "#182B43" },
});
