import "react-native-gesture-handler";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { useGameStore, useSaveStatus } from "@/store/gameStore";
import { gameFeedback } from "@/game/feedback/GameFeedbackManager";
import { colors } from "@/ui/theme";

export default function RootLayout() {
  const saveStatus = useSaveStatus((state) => state.status);
  useEffect(() => gameFeedback.connectAudioLifecycle(), []);

  useEffect(() => {
    gameFeedback.configure(useGameStore.getState().audioSettings);
    // Apply toggles inside the originating gesture so browsers can authorize
    // playback, rather than waiting for a React effect after the gesture ends.
    return useGameStore.subscribe((state, previous) => {
      if (state.audioSettings !== previous.audioSettings) gameFeedback.configure(state.audioSettings);
    });
  }, []);

  return <><StatusBar style="light" />{saveStatus === "ready"
    ? <Stack screenOptions={{ headerShown: false, animation: "fade" }} />
    : <View style={styles.loading}>
      {saveStatus === "loading" ? <ActivityIndicator color={colors.mint} /> : null}
      <Text accessibilityRole={saveStatus === "error" ? "alert" : undefined} style={styles.message}>{saveStatus === "error" ? "Saved progress could not be loaded." : "Loading your campaign…"}</Text>
      {saveStatus === "error" && <Pressable accessibilityRole="button" onPress={() => void useGameStore.persist.rehydrate()} style={styles.retry}><Text style={styles.retryText}>Retry</Text></Pressable>}
    </View>}</>;
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16, padding: 24, backgroundColor: colors.ink },
  message: { color: colors.text, fontSize: 14, textAlign: "center" },
  retry: { minHeight: 44, minWidth: 100, alignItems: "center", justifyContent: "center", paddingHorizontal: 20, borderRadius: 10, backgroundColor: colors.mint },
  retryText: { color: colors.ink, fontSize: 14, fontWeight: "800" },
});
