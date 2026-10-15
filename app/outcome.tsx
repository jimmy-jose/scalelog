import { useEffect } from "react";
import { ImageBackground, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeInDown, cancelAnimation, useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withSequence, withTiming } from "react-native-reanimated";
import { getLevelAtStart } from "@/store/gameStore";
import { useGameStore } from "@/store/gameStore";
import { Screen } from "@/ui/components/Screen";
import { TopBar } from "@/ui/components/TopBar";
import { LearnMore } from "@/ui/components/LearnMore";
import { Button } from "@/ui/components/Button";
import { Pill } from "@/ui/components/Pill";
import { characterAssets } from "@/ui/components/ByteAvatar";
import { colors } from "@/ui/theme";
import { formatMoney, signed } from "@/lib/format";
import { gameFeedback } from "@/game/feedback/GameFeedbackManager";

const office = require("../assets/scenes/startup_office_background.png");

type LedgerKey = "engineers" | "cash" | "monthlyRevenue" | "users" | "monthlyBurn" | "reliability" | "customerTrust" | "complexity";
const ledgerFields: { key: LedgerKey; label: string; goodWhen: "higher" | "lower" }[] = [
  { key: "cash", label: "Cash on hand", goodWhen: "higher" },
  { key: "monthlyRevenue", label: "Monthly revenue", goodWhen: "higher" },
  { key: "engineers", label: "Engineers", goodWhen: "higher" },
  { key: "users", label: "Registered users", goodWhen: "higher" },
  { key: "monthlyBurn", label: "Monthly burn", goodWhen: "lower" },
  { key: "reliability", label: "Reliability", goodWhen: "higher" },
  { key: "customerTrust", label: "Customer trust", goodWhen: "higher" },
  { key: "complexity", label: "Operations load", goodWhen: "lower" },
];

function ledgerValue(key: LedgerKey, value: number) {
  if (key === "cash") return formatMoney(value);
  if (key === "monthlyBurn" || key === "monthlyRevenue") return `${formatMoney(value)}/mo`;
  if (key === "reliability") return `${value}/100`;
  return String(value);
}

function ledgerDelta(key: LedgerKey, delta: number) {
  if (key === "cash" || key === "monthlyBurn" || key === "monthlyRevenue") return `${delta < 0 ? "−" : "+"}${formatMoney(Math.abs(delta))}${key === "monthlyBurn" || key === "monthlyRevenue" ? "/mo" : ""}`;
  return `${signed(delta)}${key === "users" || key === "engineers" ? "" : " pts"}`;
}

export default function OutcomeScreen() {
  const { levelId } = useLocalSearchParams<{ levelId?: string }>();
  const { width } = useWindowDimensions();
  const wide = width >= 760;
  const reviewingHistory = typeof levelId === "string";
  const outcome = useGameStore((state) => reviewingHistory ? state.history.find((entry) => entry.levelId === levelId) : state.lastOutcome);
  const reducedMotion = useReducedMotion();
  const byteBob = useSharedValue(0);
  useEffect(() => {
    if (reducedMotion || outcome?.failureReason) { byteBob.value = 0; return; }
    byteBob.value = withRepeat(withSequence(withTiming(-1.5, { duration: 1900 }), withTiming(0, { duration: 1900 })), -1, true);
    return () => cancelAnimation(byteBob);
  }, [byteBob, outcome?.failureReason, reducedMotion]);
  const byteMotion = useAnimatedStyle(() => ({ transform: [{ translateY: byteBob.value }] }));
  const activeCampaignId = useGameStore((state) => state.activeCampaignId);
  const progress = useGameStore((state) => state.progress);
  const history = useGameStore((state) => state.history);
  const architecture = useGameStore((state) => state.architecture);
  const level = outcome ? getLevelAtStart({ activeCampaignId, progress, history, architecture }, outcome.levelId) : undefined;
  const choice = level?.choices.find((item) => item.id === outcome?.choiceId);
  const decisionFeedback = outcome?.failureReason ? "riskyDecision" : choice?.feedback ?? (
    choice?.tone === "recommended" ? "goodDecision"
      : choice?.tone === "risky" || choice?.tone === "overkill" ? "riskyDecision" : undefined
  );
  useEffect(() => {
    if (!decisionFeedback || !outcome) return;
    const timer = setTimeout(() => gameFeedback.trigger(decisionFeedback), 260);
    return () => clearTimeout(timer);
  }, [outcome, decisionFeedback]);
  if (!outcome) return <Screen><Text style={styles.missing}>No decision to review.</Text><Button onPress={() => router.replace("/levels")}>Back to campaign map</Button></Screen>;
  const preferredChoice = level?.choices.find((item) => item.tone === "recommended");
  const missedPreferredPath = choice && preferredChoice && preferredChoice.id !== choice.id ? preferredChoice : undefined;

  const before = outcome.companyBefore;
  const company = outcome.companyAfter;
  // Legacy cash balances can recover the original cost unless cash was clamped at zero.
  const upfrontCost = outcome.choiceCost ?? (company.cash > 0 ? Math.max(0, before.cash + outcome.operatingCashFlow - company.cash) : choice?.cost);
  const ledger = ledgerFields.flatMap(({ key, label, goodWhen }) => {
    const from = before[key];
    const to = company[key];
    const delta = to - from;
    if (delta === 0) return [];
    const improved = goodWhen === "higher" ? delta > 0 : delta < 0;
    return [{ key, label, from, to, delta, improved }];
  });
  const displayedEmotion = outcome.failureReason ? "defeated" : outcome.emotion;
  const character = characterAssets[displayedEmotion];

  return <Screen contentStyle={styles.screen} resetKey={`${outcome.levelId}-${outcome.choiceId}`}>
    <TopBar back eyebrow="DECISION LOG" title="After the call" right={<Pill color={outcome.failureReason ? colors.red : colors.mint}>{outcome.failureReason ? "RUN ENDED" : "RECORDED"}</Pill>} />

    <View style={styles.caseLine}>
      <Text style={styles.caseKicker}>{level ? `INCIDENT ${String(level.levelNumber).padStart(2, "0")}  ·  ${level.title.toUpperCase()}` : outcome.levelId.toUpperCase()}</Text>
      <Text style={styles.caseStatus}>DECISION RECORDED</Text>
    </View>

    <Animated.View entering={FadeInDown.duration(320)} style={styles.heroShell}>
      <View style={[styles.scene, wide && styles.sceneWide]}>
        <ImageBackground source={office} resizeMode="cover" style={StyleSheet.absoluteFill} imageStyle={styles.sceneImage}>
          <LinearGradient colors={["rgba(5, 13, 27, 0.82)", "rgba(5, 13, 27, 0.72)", "rgba(5, 13, 27, 0.3)"]} start={{ x: 0, y: 0.4 }} end={{ x: 1, y: 0.5 }} style={StyleSheet.absoluteFill} />
        </ImageBackground>
        <View style={styles.heroCopy}>
          <Text style={styles.heroKicker}>BYTE’S DEBRIEF</Text>
          <Text style={[styles.heroTitle, wide && styles.heroTitleWide]}>{outcome.title}</Text>
          <Text style={styles.heroChoice}>{outcome.choiceLabel}</Text>
        </View>
        <Animated.Image entering={FadeInDown.delay(90).duration(380)} source={character} resizeMode="contain" style={[styles.byteImage, wide && styles.byteImageWide, byteMotion]} accessibilityLabel={`Byte looks ${displayedEmotion}`} />
        <View pointerEvents="none" style={styles.sceneGround} />
      </View>
    </Animated.View>
    {outcome.failureReason && <Text accessibilityRole="alert" style={styles.failure}>{outcome.failureReason}</Text>}
    <View style={styles.lesson}><Text style={styles.lessonKicker}>TAKE THIS FORWARD</Text><Text style={styles.lessonText}>{outcome.lesson}</Text></View>
    {missedPreferredPath ? (
      <Animated.View entering={FadeInDown.delay(110).duration(300)} style={styles.retrospectiveCard}>
        <View style={styles.retrospectiveHeader}>
          <View style={[styles.speakerDot, { backgroundColor: colors.yellow }]} />
          <Text style={styles.retrospectiveKicker}>BYTE’S RETROSPECTIVE  ·  A STRONGER FIT WAS AVAILABLE</Text>
        </View>
        <Text style={styles.retrospectiveTitle}>I would have chosen {missedPreferredPath.label}.</Text>
        <Text style={styles.retrospectiveExplanation}>{missedPreferredPath.tradeoff.byteExplanation}</Text>
        <View style={styles.retrospectiveComparison}>
          <View style={styles.comparisonBox}>
            <Text style={styles.comparisonLabel}>WHY IT WAS BETTER</Text>
            <Text style={styles.comparisonText}>{missedPreferredPath.tradeoff.upside}</Text>
          </View>
          {choice?.tradeoff.downside ? (
            <View style={[styles.comparisonBox, styles.comparisonBoxDrawback]}>
              <Text style={[styles.comparisonLabel, { color: colors.yellow }]}>DRAWBACK OF YOUR CHOICE</Text>
              <Text style={styles.comparisonText}>{choice.tradeoff.downside}</Text>
            </View>
          ) : null}
        </View>
      </Animated.View>
    ) : choice?.tone === "recommended" ? (
      <View style={styles.idealPathBanner}>
        <View style={[styles.speakerDot, { backgroundColor: colors.mint }]} />
        <Text style={styles.idealPathText}>RECOMMENDED ARCHITECTURE PATH  ·  You made Byte’s optimal call for this incident.</Text>
      </View>
    ) : null}
    <View style={styles.footer}>
      <Button onPress={() => router.replace(reviewingHistory ? "/levels" : "/complete")}>{reviewingHistory ? "Back to campaign map →" : outcome.failureReason ? "View run summary →" : "Continue →"}</Button>
    </View>
    <LearnMore key={`${outcome.levelId}-${outcome.choiceId}`} label="Learn more: results & Byte’s advice">
      <Text style={styles.dialogueText}>{outcome.dialogue}</Text>
    <Animated.View entering={FadeInDown.duration(260)} style={styles.ledgerSection}>

      <View style={styles.sectionHeading}>
        <View><Text style={styles.sectionKicker}>COMPANY LEDGER</Text><Text style={styles.sectionTitle}>The numbers after your call</Text></View>
        <View style={styles.xpBadge}><Text style={[styles.xpText, { color: outcome.xpEarned > 0 ? colors.mint : colors.red }]}>{signed(outcome.xpEarned)} CTO XP</Text></View>
      </View>
      {ledger.length > 0 ? <View style={styles.ledger}>
        <View style={styles.ledgerHead}><Text style={styles.ledgerColumnLabel}>METRIC</Text><Text style={styles.ledgerColumnLabel}>BEFORE  →  AFTER</Text><Text style={styles.ledgerColumnLabel}>CHANGE</Text></View>
        {ledger.map((item) => <View key={item.key} style={styles.ledgerRow}>
          <Text style={styles.metricName}>{item.label}</Text>
          <Text style={styles.metricPath}>{ledgerValue(item.key, item.from)} <Text style={styles.pathArrow}>→</Text> {ledgerValue(item.key, item.to)}</Text>
          <Text style={[styles.metricDelta, item.improved ? styles.deltaBetter : styles.deltaCost]}>{ledgerDelta(item.key, item.delta)}</Text>
        </View>)}
      </View> : <Text style={styles.noMetrics}>No company metrics changed directly in this decision.</Text>}

      <View style={styles.progression}>
        <Text style={styles.progressionKicker}>ONE OPERATING MONTH LATER</Text>
        <Text style={styles.progressionText}>Cash includes {upfrontCost !== undefined ? `${formatMoney(upfrontCost)} upfront and ` : ""}{signed(outcome.operatingCashFlow)} operating cash flow. Revenue from this decision starts next month.</Text>
        <Text style={styles.progressionText}>CTO confidence: {outcome.confidenceBefore} → {outcome.confidenceAfter}/100. {outcome.xpEarned === 0 ? "No XP awarded. XP cannot fall below zero." : ""}</Text>
      </View>
    </Animated.View>
    </LearnMore>

  </Screen>;
}

const styles = StyleSheet.create({
  failure: { color: colors.red, fontSize: 14, lineHeight: 21, marginVertical: 12 },
  screen: { maxWidth: 900, paddingHorizontal: 20, paddingBottom: 32 },
  missing: { color: colors.white, padding: 30 },
  caseLine: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 8, marginTop: 4, marginBottom: 10 },
  caseKicker: { color: "#8497B0", fontSize: 9, fontWeight: "900", letterSpacing: 1 },
  caseStatus: { color: colors.mint, fontSize: 8, fontWeight: "900", letterSpacing: 1 },
  heroShell: { borderRadius: 18, overflow: "hidden", borderWidth: 1, borderColor: "#29415A", backgroundColor: "#0B192A" },
  scene: { height: 204, position: "relative", justifyContent: "center", overflow: "hidden", backgroundColor: "#122238" },
  sceneWide: { height: 236 },
  sceneImage: { opacity: 0.7 },
  heroCopy: { position: "relative", zIndex: 2, paddingLeft: 22, paddingRight: 112, maxWidth: 680 },
  heroKicker: { color: colors.mint, fontSize: 9, fontWeight: "900", letterSpacing: 1.3 },
  heroTitle: { color: colors.white, fontSize: 26, lineHeight: 31, fontWeight: "900", letterSpacing: -0.75, marginTop: 7, maxWidth: 540 },
  heroTitleWide: { fontSize: 34, lineHeight: 39, letterSpacing: -1.1 },
  heroChoice: { color: "#C3D0DF", fontSize: 11, fontWeight: "700", marginTop: 10 },
  byteImage: { position: "absolute", zIndex: 1, right: 2, bottom: 0, width: 142, height: 205 },
  byteImageWide: { right: 8, width: 176, height: 236 },
  sceneGround: { position: "absolute", zIndex: 3, left: 0, right: 0, bottom: 0, height: 18, backgroundColor: "rgba(5, 13, 27, 0.78)", borderTopWidth: 1, borderTopColor: "rgba(168, 191, 213, 0.16)" },
  speakerDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.mint },
  dialogueText: { color: "#DCE6F2", fontSize: 13, lineHeight: 19, fontWeight: "600", marginTop: 7 },
  retrospectiveCard: { marginTop: 14, borderRadius: 14, borderWidth: 1, borderColor: "#61471F", backgroundColor: "#151B25", padding: 15 },
  retrospectiveHeader: { flexDirection: "row", alignItems: "center", gap: 7 },
  retrospectiveKicker: { color: colors.yellow, fontSize: 8, fontWeight: "900", letterSpacing: 1 },
  retrospectiveTitle: { color: colors.white, fontSize: 15, lineHeight: 20, fontWeight: "900", marginTop: 8 },
  retrospectiveExplanation: { color: "#B8C9DC", fontSize: 12, lineHeight: 18, marginTop: 5 },
  retrospectiveComparison: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 },
  comparisonBox: { flex: 1, minWidth: 200, padding: 11, borderRadius: 9, backgroundColor: "#0E1826", borderWidth: 1, borderColor: "#243B54" },
  comparisonBoxDrawback: { borderColor: "#4C381E", backgroundColor: "#171618" },
  comparisonLabel: { color: colors.mint, fontSize: 8, fontWeight: "900", letterSpacing: 0.9 },
  comparisonText: { color: "#D5E1EE", fontSize: 11, lineHeight: 16, marginTop: 4, fontWeight: "600" },
  idealPathBanner: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 13, paddingVertical: 10, borderRadius: 10, backgroundColor: "#0C2329", borderWidth: 1, borderColor: "#1A4947", marginTop: 14 },
  idealPathText: { color: colors.mint, fontSize: 9, fontWeight: "800", letterSpacing: 0.7 },
  sectionHeading: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", gap: 10, marginBottom: 9 },
  sectionKicker: { color: colors.mint, fontSize: 8, fontWeight: "900", letterSpacing: 1.2 },
  sectionTitle: { color: colors.white, fontSize: 17, lineHeight: 22, fontWeight: "900", marginTop: 4 },
  ledgerSection: { marginTop: 19 },
  xpBadge: { borderWidth: 1, borderColor: "#625439", backgroundColor: "#191B20", borderRadius: 99, paddingHorizontal: 9, paddingVertical: 6, marginBottom: 3 },
  xpText: { color: colors.yellow, fontSize: 9, fontWeight: "900", letterSpacing: 0.4 },
  ledger: { borderTopWidth: 1, borderTopColor: "#263950" },
  ledgerHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 8, paddingVertical: 7 },
  ledgerColumnLabel: { color: "#71849C", fontSize: 7, fontWeight: "900", letterSpacing: 0.75 },
  ledgerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8, minHeight: 36, paddingHorizontal: 8, borderTopWidth: 1, borderTopColor: "#1A2C40" },
  metricName: { flex: 1, color: "#BBC8D8", fontSize: 10, fontWeight: "700" },
  metricPath: { flex: 1.35, color: "#E1E9F3", fontSize: 10, fontWeight: "800", textAlign: "right" },
  pathArrow: { color: "#71859D", fontWeight: "700" },
  metricDelta: { width: 82, fontSize: 10, fontWeight: "900", textAlign: "right" },
  deltaBetter: { color: colors.mint },
  deltaCost: { color: colors.yellow },
  noMetrics: { color: "#A6B5C7", fontSize: 11, lineHeight: 17, paddingVertical: 12 },
  progression: { padding: 11, marginTop: 10, borderRadius: 10, backgroundColor: "#0D1A2A", borderWidth: 1, borderColor: "#263B52" },
  progressionKicker: { color: colors.blue, fontSize: 8, fontWeight: "900", letterSpacing: 0.85 },
  progressionText: { color: "#9AABC0", fontSize: 9, lineHeight: 14, marginTop: 5 },
  footer: { marginTop: 22, gap: 12, flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  lesson: { minWidth: 0, borderLeftWidth: 2, borderLeftColor: colors.yellow, paddingLeft: 11, paddingVertical: 2, marginTop: 18 },
  lessonKicker: { color: colors.yellow, fontSize: 8, fontWeight: "900", letterSpacing: 1 },
  lessonText: { color: "#C7D2E0", fontSize: 15, lineHeight: 22, fontWeight: "700", marginTop: 4 },
});
