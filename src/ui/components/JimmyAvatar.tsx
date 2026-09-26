import { useEffect } from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import type { ImageSourcePropType } from "react-native";
import Animated, { cancelAnimation, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from "react-native-reanimated";
import { CharacterEmotion } from "@/domain/types";
import { colors } from "@/ui/theme";

export const characterAssets: Record<CharacterEmotion, ImageSourcePropType> = {
  normal: require("../../../assets/characters/jimmy_neutral.png"),
  happy: require("../../../assets/characters/jimmy_happy.png"),
  thinking: require("../../../assets/characters/jimmy_thinking.png"),
  concerned: require("../../../assets/characters/jimmy_concerned.png"),
  shocked: require("../../../assets/characters/jimmy_shocked.png"),
  panic: require("../../../assets/characters/jimmy_panic.png"),
  celebrating: require("../../../assets/characters/jimmy_happy.png"),
  disappointed: require("../../../assets/characters/jimmy_disappointed.png"),
  defeated: require("../../../assets/characters/jimmy_defeated.png"),
  smug: require("../../../assets/characters/jimmy_smug.png"),
};

const emotionConfig: Record<CharacterEmotion, { color: string; face: string; label: string }> = {
  normal: { color: colors.blue, face: "•ᴗ•", label: "online" },
  happy: { color: colors.mint, face: "◠ᴗ◠", label: "happy" },
  thinking: { color: colors.purple, face: "¬_¬", label: "thinking" },
  concerned: { color: colors.yellow, face: "•︵•", label: "concerned" },
  shocked: { color: colors.orange, face: "O_O", label: "shocked" },
  panic: { color: colors.red, face: "×_×", label: "panic" },
  celebrating: { color: colors.mint, face: "^ᴗ^", label: "celebrating" },
  disappointed: { color: colors.pink, face: "•︵•", label: "disappointed" },
  defeated: { color: colors.red, face: "︶_︶", label: "defeated" },
  smug: { color: colors.blue, face: "⌐■_■", label: "smug" },
};

export function JimmyAvatar({ emotion = "normal", compact = false }: { emotion?: CharacterEmotion; compact?: boolean }) {
  const config = emotionConfig[emotion];
  const asset = characterAssets[emotion];
  const bob = useSharedValue(0);
  useEffect(() => {
    if (emotion === "defeated") bob.value = 0;
    else bob.value = withRepeat(withSequence(withTiming(-3, { duration: 900 }), withTiming(0, { duration: 900 })), -1, true);
    return () => cancelAnimation(bob);
  }, [bob, emotion]);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ translateY: bob.value }] }));
  return (
    <Animated.View style={[styles.wrap, compact && styles.compactWrap, animatedStyle]}>
      <View style={[styles.orbit, compact && styles.compactOrbit, { borderColor: `${config.color}48` }]} />
      <View style={[styles.avatar, compact && styles.compactAvatar, { backgroundColor: `${config.color}22`, borderColor: config.color }]}>
        {asset ? <Image source={asset} accessibilityLabel={`Jimmy looks ${emotion}`} resizeMode="contain" style={[styles.asset, compact && styles.compactAsset]} /> : <Text style={[styles.face, compact && styles.compactFace, { color: config.color }]}>{config.face}</Text>}
      </View>
      {!compact && <><Text style={styles.name}>JIMMY</Text><Text style={[styles.state, { color: config.color }]}>AI ASSISTANT</Text></>}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: 92, alignItems: "center", justifyContent: "center", position: "relative" },
  compactWrap: { width: 48, height: 48 },
  orbit: { position: "absolute", width: 86, height: 86, borderRadius: 44, borderWidth: 1, opacity: 0.8 },
  compactOrbit: { width: 46, height: 46, borderRadius: 23 },
  avatar: { width: 70, height: 70, borderRadius: 22, borderWidth: 1, alignItems: "center", justifyContent: "center", overflow: "hidden", backgroundColor: colors.panel },
  compactAvatar: { width: 40, height: 40, borderRadius: 14, borderWidth: 1.5 },
  face: { fontSize: 20, fontWeight: "800", letterSpacing: -2 }, compactFace: { fontSize: 13 },
  asset: { width: 122, height: 152, position: "absolute", top: -11, alignSelf: "center" }, compactAsset: { width: 70, height: 88, top: -7 },
  name: { color: colors.white, fontWeight: "900", fontSize: 12, letterSpacing: 1.8, marginTop: 8 },
  state: { fontSize: 9, textTransform: "uppercase", letterSpacing: 1, fontWeight: "800", marginTop: 3 },
});
