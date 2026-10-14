import { Image, ImageBackground, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeIn, useReducedMotion } from "react-native-reanimated";
import { Button } from "./Button";
import { LearnMore } from "./LearnMore";
import { Level } from "@/domain/types";
import { characterAssets } from "@/ui/components/JimmyAvatar";
import { useGameStore } from "@/store/gameStore";
import { colors } from "@/ui/theme";

const office = require("../../../assets/scenes/startup_office_background.png");

export function GameScene({ level, onContinue }: { level: Level; onContinue?: () => void }) {
  const { width } = useWindowDimensions();
  const reducedMotion = useReducedMotion();
  const wide = width >= 760;
  const playerName = useGameStore((state) => state.profile.name);
  const characterAsset = characterAssets[level.dialogue[0]?.emotion] ?? characterAssets.normal;

  return (
    <View style={[styles.frame, wide && styles.wideFrame]}>
      <ImageBackground source={office} resizeMode="cover" style={styles.sceneBody} imageStyle={styles.backgroundImage}>
        <LinearGradient
          colors={["rgba(5, 13, 27, 0.22)", "rgba(5, 13, 27, 0.38)", "rgba(5, 13, 27, 0.98)"]}
          locations={[0, 0.48, 1]}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.sceneLight} />
        <View style={styles.sceneStage}>
          <Animated.View pointerEvents="none" entering={reducedMotion ? undefined : FadeIn.duration(450)} style={[styles.character, wide && styles.wideCharacter]}>
            <Image source={characterAsset} resizeMode="contain" style={styles.characterImage} />
          </Animated.View>
          <View style={[styles.sceneHeading, wide && styles.wideSceneHeading]}>
            <Text style={[styles.chapter, wide && styles.wideCopy]}>{level.kicker.toUpperCase()}</Text>
            <Text style={[styles.title, wide && styles.wideTitle]}>{level.title}</Text>
            <Text style={[styles.summary, wide && styles.wideCopy]}>{level.description}</Text>
          </View>
        </View>
        <View style={[styles.dialogue, wide && styles.wideDialogue]}>
          {onContinue && <Button onPress={onContinue}>Choose a solution →</Button>}
          <LearnMore key={level.id} label="Learn more: Byte’s briefing">
            {level.dialogue.map((line, index) => <Text key={index} style={styles.quote}>
              {line.text.replace(/\{name\}/g, playerName.trim() || "CTO")}
            </Text>)}
          </LearnMore>
        </View>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { minHeight: 350, borderRadius: 18, overflow: "hidden", backgroundColor: "#142238", borderWidth: 1, borderColor: "#304563", position: "relative" },
  wideFrame: { minHeight: 410 },
  sceneBody: { flexGrow: 1 },
  sceneStage: { flexGrow: 1, position: "relative", overflow: "hidden" },
  backgroundImage: { opacity: 0.8 },
  sceneLight: { position: "absolute", width: 200, height: 200, borderRadius: 100, backgroundColor: "#F6A34B", opacity: 0.11, top: -75, right: 12 },
  character: { position: "absolute", width: 150, aspectRatio: 1122 / 1402, right: 18, bottom: -12, zIndex: 1 },
  wideCharacter: { width: 208, right: 22 },
  characterImage: { width: "100%", height: "100%" },
  sceneHeading: { padding: 22, paddingBottom: 190, zIndex: 2 },
  wideSceneHeading: { paddingBottom: 36, minHeight: 280 },
  wideCopy: { maxWidth: "65%" },
  chapter: { color: colors.mint, fontSize: 8, fontWeight: "900", letterSpacing: 1.1 },
  title: { color: colors.white, fontSize: 22, lineHeight: 27, fontWeight: "900", letterSpacing: -0.7, marginTop: 5, textShadowColor: "rgba(4,10,20,0.6)", textShadowRadius: 12 },
  wideTitle: { fontSize: 25, lineHeight: 30, maxWidth: "66%" },
  summary: { color: "#DFE8F2", fontSize: 14, lineHeight: 21, marginTop: 5, textShadowColor: "rgba(4,10,20,0.7)", textShadowRadius: 8 },
  dialogue: { zIndex: 3, marginHorizontal: 10, marginBottom: 10, borderRadius: 12, borderWidth: 1, borderColor: "rgba(187,211,237,0.22)", backgroundColor: "rgba(6,15,29,0.94)", paddingHorizontal: 11, paddingTop: 9, paddingBottom: 8, minHeight: 91 },
  wideDialogue: { paddingHorizontal: 13, paddingVertical: 10 },
  quote: { color: "#F4F6FA", fontSize: 15, lineHeight: 23, fontWeight: "600", marginTop: 6 },
});
