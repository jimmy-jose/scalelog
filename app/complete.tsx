import { useEffect } from "react";
import { CompanySummary } from "@/ui/components/CompanySummary";
import { Image, ImageBackground, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeInDown } from "react-native-reanimated";
import { signed } from "@/lib/format";
import { getLevel } from "@/campaigns";
import { useGameStore } from "@/store/gameStore";
import { Screen } from "@/ui/components/Screen";
import { TopBar } from "@/ui/components/TopBar";
import { Button } from "@/ui/components/Button";
import { Pill } from "@/ui/components/Pill";
import { characterAssets } from "@/ui/components/JimmyAvatar";
import { colors, radii } from "@/ui/theme";
import { gameFeedback } from "@/game/feedback/GameFeedbackManager";

const office = require("../assets/scenes/startup_office_background.png");

export default function LevelCompleteScreen() {
  const { width } = useWindowDimensions();
  const wide = width >= 760;
  const outcome = useGameStore((state) => state.lastOutcome);
  const playerName = useGameStore((state) => state.profile.name.trim());
  const awardUnlocked = useGameStore((state) => state.player.awards.some((award) => award.unlocked));
  const level = outcome ? getLevel(outcome.levelId) : undefined;
  useEffect(() => {
    if (!outcome || !level) return;
    const successful = !outcome.failureReason && outcome.confidenceAfter >= outcome.confidenceBefore;
    const awardEarned = successful && level.levelNumber === 10 && awardUnlocked;
    const rewardTimer = !outcome.failureReason && outcome.xpEarned > 0
      ? setTimeout(() => gameFeedback.trigger("xpGain"), 180)
      : undefined;
    const completeTimer = successful
      ? setTimeout(() => gameFeedback.trigger("levelComplete"), 650)
      : undefined;
    const awardTimer = awardEarned
      ? setTimeout(() => gameFeedback.trigger("awardUnlocked"), 1450)
      : undefined;
    return () => {
      if (rewardTimer) clearTimeout(rewardTimer);
      if (completeTimer) clearTimeout(completeTimer);
      if (awardTimer) clearTimeout(awardTimer);
    };
  }, [outcome?.levelId, outcome?.choiceId, level?.levelNumber, awardUnlocked]);
  if (!outcome || !level) return <Screen><Text style={styles.missing}>Ready for a new run.</Text><Button onPress={() => router.replace("/levels")}>Start from the campaign map</Button></Screen>;
  const failed = Boolean(outcome.failureReason);
  const setback = outcome.confidenceAfter < outcome.confidenceBefore;
  const nextLevel = !failed && outcome.nextLevel ? getLevel(outcome.nextLevel) : undefined;
  const greeting = failed ? "Your run ends here." : setback ? "A costly lesson." : playerName ? `Nice work, ${playerName}.` : "Decision logged.";

  return <Screen contentStyle={styles.screen}>
    <TopBar back eyebrow="CAMPAIGN PROGRESS" title={failed ? "Run ended" : "Chapter handoff"} right={<Pill color={failed ? colors.red : setback ? colors.yellow : colors.mint}>{failed ? "RUN ENDED" : setback ? "SETBACK" : nextLevel ? "LEVEL CLEARED" : "CHAPTER PAUSED"}</Pill>} />

    <Animated.View entering={FadeInDown.duration(360)} style={[styles.hero, wide && styles.heroWide]}>
      <ImageBackground source={office} resizeMode="cover" style={StyleSheet.absoluteFill} imageStyle={styles.heroImage}>
        <LinearGradient colors={["rgba(5, 13, 27, 0.9)", "rgba(5, 13, 27, 0.74)", "rgba(5, 13, 27, 0.28)"]} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={StyleSheet.absoluteFill} />
      </ImageBackground>
      <View style={styles.heroCopy}>
        <Text style={styles.heroKicker}>LEVEL {String(level.levelNumber).padStart(2, "0")}  ·  DECISION RECORDED</Text>
        <Text style={styles.heroTitle}>{greeting}</Text>
        <Text style={styles.levelTitle}>{level.title}</Text>
        <View style={styles.reward}>
          <Text style={styles.rewardStar}>✦</Text>
          <View><Text style={styles.rewardLabel}>CTO EXPERIENCE</Text><Text style={styles.rewardValue}>{signed(outcome.xpEarned)} XP</Text></View>
        </View>
      </View>
      <Image source={failed ? characterAssets.defeated : setback ? characterAssets.disappointed : characterAssets.celebrating} resizeMode="contain" style={[styles.jimmyImage, wide && styles.jimmyImageWide]} accessibilityLabel={failed ? "Jimmy reacts to the failed run" : setback ? "Jimmy reflects on the setback" : "Jimmy celebrates the decision"} />
    </Animated.View>

    <CompanySummary />
    {failed ? <View style={styles.nextCard}><Text style={styles.nextTitle}>The consequences caught up.</Text><Text style={styles.nextText}>{outcome.failureReason}</Text><Text style={styles.nextText}>Review your decisions in Player & company, or reset the campaign above to try a different path.</Text></View> : nextLevel ? <Animated.View entering={FadeInDown.delay(100).duration(320)} style={styles.nextCard}>
      <View style={styles.nextTopline}><Text style={styles.nextKicker}>NEXT INCIDENT  ·  LEVEL {String(nextLevel.levelNumber).padStart(2, "0")}</Text><Text style={styles.nextCampaign}>CARTLINE</Text></View>
      <Text style={styles.nextTitle}>{nextLevel.title}</Text>
      <Text style={styles.nextText}>{nextLevel.description}</Text>
      <View style={styles.nextRule} />
      <Text style={styles.handoffText}>Your call is in. The company moves on to the next problem.</Text>
    </Animated.View> : <Animated.View entering={FadeInDown.delay(100).duration(320)} style={styles.nextCard}>
      <Text style={styles.nextKicker}>CHAPTER 01 · CURRENTLY PLAYABLE</Text>
      <Text style={styles.nextTitle}>That’s the end of this chapter.</Text>
      <Text style={styles.nextText}>Your decisions are saved. More incidents will appear here as the campaign grows.</Text>
    </Animated.View>}

    <Button variant="secondary" onPress={() => router.push("/stats")}>Review company & decisions</Button>
    <View style={[styles.actions, wide && styles.actionsWide]}>
      <Button style={styles.primaryAction} onPress={() => nextLevel ? router.replace({ pathname: "/game/[levelId]", params: { levelId: nextLevel.id } }) : router.replace("/levels")}>
        {nextLevel ? "Go to the next incident" : "Back to the campaign map"} <Text>→</Text>
      </Button>
      <Button variant="secondary" style={styles.secondaryAction} onPress={() => router.replace("/levels")}>View campaign map</Button>
    </View>
  </Screen>;
}

const styles = StyleSheet.create({
  screen: { maxWidth: 980, paddingHorizontal: 20, paddingBottom: 34 },
  missing: { color: colors.white, padding: 30 },
  hero: { minHeight: 270, position: "relative", justifyContent: "center", overflow: "hidden", borderRadius: 20, borderWidth: 1, borderColor: "#2D465F", backgroundColor: "#11233A" },
  heroWide: { minHeight: 330 },
  heroImage: { opacity: 0.72 },
  heroCopy: { position: "relative", zIndex: 2, paddingVertical: 22, paddingLeft: 22, paddingRight: 128, maxWidth: 710 },
  heroKicker: { color: colors.mint, fontSize: 8, fontWeight: "900", letterSpacing: 1.05 },
  heroTitle: { color: colors.white, fontSize: 27, lineHeight: 33, fontWeight: "900", letterSpacing: -0.8, marginTop: 10 },
  levelTitle: { color: "#BDCCDD", fontSize: 13, fontWeight: "700", marginTop: 5 },
  reward: { alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 9, marginTop: 19, paddingHorizontal: 11, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: "#665539", backgroundColor: "rgba(17, 25, 36, 0.88)" },
  rewardStar: { color: colors.yellow, fontSize: 19 },
  rewardLabel: { color: "#B69C66", fontSize: 7, fontWeight: "900", letterSpacing: 0.8 },
  rewardValue: { color: colors.white, fontSize: 13, fontWeight: "900", marginTop: 2 },
  jimmyImage: { position: "absolute", right: 4, bottom: -4, zIndex: 1, width: 148, height: 238 },
  jimmyImageWide: { right: 12, width: 214, height: 314 },
  nextCard: { marginTop: 15, padding: 17, borderRadius: 14, backgroundColor: "#0D1B2D", borderWidth: 1, borderColor: "#293F59" },
  nextTopline: { flexDirection: "row", justifyContent: "space-between", flexWrap: "wrap", gap: 6 },
  nextKicker: { color: colors.blue, fontSize: 8, fontWeight: "900", letterSpacing: 1 },
  nextCampaign: { color: "#71849C", fontSize: 7, fontWeight: "900", letterSpacing: 1 },
  nextTitle: { color: colors.white, fontSize: 18, lineHeight: 23, fontWeight: "900", marginTop: 8 },
  nextText: { color: "#A5B5C8", fontSize: 11, lineHeight: 17, marginTop: 6 },
  nextRule: { height: 1, backgroundColor: "#263A51", marginTop: 13 },
  handoffText: { color: "#8193AA", fontSize: 9, lineHeight: 14, marginTop: 9 },
  actions: { gap: 9, marginTop: 14 },
  actionsWide: { flexDirection: "row", justifyContent: "flex-end", alignItems: "center" },
  primaryAction: { minWidth: 220, minHeight: 46, borderRadius: radii.sm },
  secondaryAction: { minWidth: 190, minHeight: 46, borderRadius: radii.sm },
});
