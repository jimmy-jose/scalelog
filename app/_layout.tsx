import "react-native-gesture-handler";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { useGameStore } from "@/store/gameStore";
import { gameFeedback } from "@/game/feedback/GameFeedbackManager";

export default function RootLayout() {
  const audioSettings = useGameStore((state) => state.audioSettings);

  useEffect(() => {
    gameFeedback.configure(audioSettings);
  }, [audioSettings]);

  return <><StatusBar style="light" /><Stack screenOptions={{ headerShown: false, animation: "fade" }} /></>;
}
