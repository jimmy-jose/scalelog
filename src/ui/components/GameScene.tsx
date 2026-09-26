import { useEffect, useState } from "react";
import { Image, ImageBackground, Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeIn, FadeInDown, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from "react-native-reanimated";
import { CharacterEmotion, Level } from "@/domain/types";
import { characterAssets } from "@/ui/components/JimmyAvatar";
import { useGameStore } from "@/store/gameStore";
import { colors } from "@/ui/theme";

const office = require("../../../assets/scenes/startup_office_background.png");

export function GameScene({ level }: { level: Level }) {
  const { width } = useWindowDimensions();
  const wide = width >= 760;
  const playerName = useGameStore((state) => state.profile.name);
  const [lineIndex, setLineIndex] = useState(0);
  const current = level.dialogue[lineIndex] ?? level.dialogue[0];
  const bob = useSharedValue(0);

  useEffect(() => {
    setLineIndex(0);
  }, [level.id]);

  useEffect(() => {
    bob.value = withRepeat(withSequence(withTiming(-2.5, { duration: 1800 }), withTiming(0, { duration: 1800 })), -1, true);
  }, [bob]);

  const characterMotion = useAnimatedStyle(() => ({ transform: [{ translateY: bob.value }] }));
  const characterAsset = characterAssets[current.emotion as CharacterEmotion] ?? characterAssets.normal;
  const hasNextLine = lineIndex < level.dialogue.length - 1;
  const personalizedLine = current.text.replace(/\{name\}/g, playerName.trim() || "CTO");
  const callToAction = playerName.trim() ? `YOUR CALL, ${playerName.trim().toUpperCase()}` : "YOUR CALL, CTO";

  return (
    <View style={[styles.frame, wide && styles.wideFrame]}>
      <ImageBackground source={office} resizeMode="cover" style={StyleSheet.absoluteFill} imageStyle={styles.backgroundImage}>
        <LinearGradient
          colors={["rgba(5, 13, 27, 0.22)", "rgba(5, 13, 27, 0.38)", "rgba(5, 13, 27, 0.98)"]}
          locations={[0, 0.48, 1]}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.sceneLight} />
        <Animated.View entering={FadeIn.duration(450)} style={[styles.character, wide && styles.wideCharacter, characterMotion]}>
          <Image source={characterAsset} resizeMode="contain" style={styles.characterImage} />
        </Animated.View>
        <View style={styles.sceneHeading}>
          <Text style={styles.chapter}>{level.kicker.toUpperCase()}</Text>
          <Text style={[styles.title, wide && styles.wideTitle]}>{level.title}</Text>
          <Text style={styles.summary} numberOfLines={wide ? 3 : 2}>{level.description}</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={hasNextLine ? "Continue Jimmy's dialogue" : "Jimmy's final briefing"}
          disabled={!hasNextLine}
          onPress={() => setLineIndex((index) => Math.min(index + 1, level.dialogue.length - 1))}
          style={({ pressed }) => [styles.dialogue, wide && styles.wideDialogue, pressed && hasNextLine && styles.dialoguePressed]}
        >
          <View style={styles.dialogueTop}>
            <View style={styles.speaker}>
              <View style={styles.speakerDot} />
              <Text style={styles.speakerName}>JIMMY</Text>
              <Text style={styles.speakerRole}>YOUR AI ASSISTANT</Text>
            </View>
            <Text style={styles.dialogueStep}>{String(lineIndex + 1).padStart(2, "0")} / {String(level.dialogue.length).padStart(2, "0")}</Text>
          </View>
          <Animated.Text key={`${level.id}-${lineIndex}`} entering={FadeInDown.duration(220)} style={[styles.quote, wide && styles.wideQuote]}>
            “{personalizedLine}”
          </Animated.Text>
          <View style={styles.dialogueFooter}>
            <View style={styles.dots}>{level.dialogue.map((line, index) => <View key={`${line.text}-${index}`} style={[styles.dot, index === lineIndex && styles.activeDot]} />)}</View>
            <Text style={styles.continue}>{hasNextLine ? "TAP TO CONTINUE  ›" : callToAction}</Text>
          </View>
        </Pressable>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { height: 250, borderRadius: 18, overflow: "hidden", backgroundColor: "#142238", borderWidth: 1, borderColor: "#304563", position: "relative" },
  wideFrame: { height: 258 },
  backgroundImage: { opacity: 0.8 },
  sceneLight: { position: "absolute", width: 200, height: 200, borderRadius: 100, backgroundColor: "#F6A34B", opacity: 0.11, top: -75, right: 12 },
  character: { position: "absolute", width: 150, height: 190, right: 3, top: 4, zIndex: 1 },
  wideCharacter: { width: 184, height: 232, right: 4, top: 3 },
  characterImage: { width: "100%", height: "100%" },
  sceneHeading: { position: "absolute", top: 14, left: 15, right: 12, zIndex: 2 },
  chapter: { color: colors.mint, fontSize: 8, fontWeight: "900", letterSpacing: 1.1, maxWidth: "67%" },
  title: { color: colors.white, fontSize: 22, lineHeight: 27, fontWeight: "900", letterSpacing: -0.7, maxWidth: "75%", marginTop: 5, textShadowColor: "rgba(4,10,20,0.6)", textShadowRadius: 12 },
  wideTitle: { fontSize: 25, lineHeight: 30, maxWidth: "66%" },
  summary: { color: "#DFE8F2", fontSize: 10, lineHeight: 15, maxWidth: "65%", marginTop: 5, textShadowColor: "rgba(4,10,20,0.7)", textShadowRadius: 8 },
  dialogue: { position: "absolute", zIndex: 3, left: 9, right: 9, bottom: 9, borderRadius: 12, borderWidth: 1, borderColor: "rgba(187,211,237,0.22)", backgroundColor: "rgba(6,15,29,0.94)", paddingHorizontal: 11, paddingTop: 9, paddingBottom: 8, minHeight: 91 },
  wideDialogue: { left: 10, right: 10, bottom: 10, paddingHorizontal: 13, paddingVertical: 10 },
  dialoguePressed: { backgroundColor: "rgba(14,30,52,0.98)" },
  dialogueTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  speaker: { flexDirection: "row", alignItems: "center", gap: 7 }, speakerDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.mint },
  speakerName: { color: colors.mint, fontSize: 10, fontWeight: "900", letterSpacing: 1.3 }, speakerRole: { color: "#8B9AAF", fontSize: 8, fontWeight: "800", letterSpacing: 0.8 },
  dialogueStep: { color: "#74849B", fontSize: 9, fontWeight: "800", letterSpacing: 0.8 },
  quote: { color: "#F4F6FA", fontSize: 12, lineHeight: 17, fontWeight: "600", marginTop: 6 },
  wideQuote: { fontSize: 13, lineHeight: 18, maxWidth: 790 },
  dialogueFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 7 },
  dots: { flexDirection: "row", gap: 5 }, dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: "#334157" }, activeDot: { width: 16, backgroundColor: colors.mint },
  continue: { color: "#91A2B8", fontSize: 8, fontWeight: "900", letterSpacing: 0.9 },
});
