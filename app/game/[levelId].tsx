import { LearnMore } from "@/ui/components/LearnMore";
import { CompanySummary } from "@/ui/components/CompanySummary";
import { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Redirect, router, useLocalSearchParams } from "expo-router";
import Animated, { FadeInDown, FadeInLeft, FadeOutUp } from "react-native-reanimated";
import { allLevels } from "@/campaigns";
import { getArchitectureAtLevelStart, getCompanyAtLevelStart, getLevelAtStart, useGameStore } from "@/store/gameStore";
import { Screen } from "@/ui/components/Screen";
import { ArchitectureCanvas } from "@/ui/components/ArchitectureCanvas";
import { GameScene } from "@/ui/components/GameScene";
import { MetricStrip } from "@/ui/components/MetricStrip";
import { DecisionDeck } from "@/ui/components/DecisionDeck";
import { Button } from "@/ui/components/Button";
import { StepProgress } from "@/ui/components/StepProgress";
import { ArchitectureTransition } from "@/ui/components/ArchitectureTransition";
import type { Choice } from "@/domain/types";
import { colors } from "@/ui/theme";
import { formatCompact } from "@/lib/format";
import { gameFeedback } from "@/game/feedback/GameFeedbackManager";

export function generateStaticParams() {
  return allLevels.map((level) => ({ levelId: level.id }));
}

const byteExplaining = require("../../assets/characters/jimmy_explain.png");

export default function GameplayScreen() {
  const { levelId } = useLocalSearchParams<{ levelId: string }>();
  const failureReason = useGameStore((state) => state.failureReason);
  const unlockedLevels = useGameStore((state) => state.player.unlockedLevels);
  const company = useGameStore((state) => state.company);
  const playerName = useGameStore((state) => state.profile.name);
  const progress = useGameStore((state) => state.progress);
  const history = useGameStore((state) => state.history);
  const architecture = useGameStore((state) => state.architecture);
  const activeCampaignId = useGameStore((state) => state.activeCampaignId);
  const level = useMemo(() => getLevelAtStart({ activeCampaignId, progress, history, architecture }, String(levelId)), [activeCampaignId, progress, history, architecture, levelId]);
  const chooseChoice = useGameStore((state) => state.chooseChoice);
  const setCurrentLevel = useGameStore((state) => state.setCurrentLevel);
  const [step, setStep] = useState(0);
  const [hintIndex, setHintIndex] = useState(-1);
  const [previewChoice, setPreviewChoice] = useState<Choice | null>(null);
  const companyAtStart = useMemo(
    () => level ? getCompanyAtLevelStart({ activeCampaignId, company, progress, history }, level.id) : company,
    [activeCampaignId, company, progress, history, level],
  );
  const isCompleted = Boolean(level && progress.completedLevels.includes(level.id));
  const recordedOutcome = level ? history.find((entry) => entry.levelId === level.id) : undefined;
  useEffect(() => { if (level) setCurrentLevel(level.id); }, [level, setCurrentLevel]);
  useEffect(() => { setStep(0); setHintIndex(-1); setPreviewChoice(null); }, [level?.id]);
  const incidentFeedback = level?.incidentFeedback ?? (level?.metrics.some((metric) => metric.severity === "critical")
    ? "criticalIncident"
    : level?.metrics.some((metric) => metric.severity === "warning") ? "incidentWarning" : undefined);
  useEffect(() => {
    if (!incidentFeedback || isCompleted) return;
    const timer = setTimeout(() => gameFeedback.trigger(incidentFeedback), 220);
    return () => clearTimeout(timer);
  }, [level?.id, incidentFeedback, isCompleted]);
  const graph = useMemo(
    () => level ? getArchitectureAtLevelStart({ activeCampaignId, progress, history, architecture }, level.id) : undefined,
    [activeCampaignId, level, progress, history, architecture],
  );
  if (!level || !graph) return <Screen><Text style={styles.missing}>Level not found.</Text><Button onPress={() => router.replace("/levels")}>Back to campaign map</Button></Screen>;
  if (level.campaignId !== activeCampaignId || !unlockedLevels.includes(level.id)) return <Redirect href="/levels" />;
  if (failureReason && !isCompleted) return <Redirect href="/complete" />;
  return <Screen contentStyle={styles.screen} resetKey={`${level.id}-${step}`}>
    <CompanySummary key={level.id} levelId={level.id} onBack={() => router.replace("/levels")} />
    {recordedOutcome && <View style={styles.recordedDecision}>
      <Text style={styles.context}>Your recorded decision: {recordedOutcome.choiceLabel}</Text>
      <Button variant="secondary" onPress={() => router.push({ pathname: "/outcome", params: { levelId: level.id } })}>Review this outcome →</Button>
    </View>}
    <StepProgress labels={["The problem", "Your decision"]} current={step} onBack={setStep} />
    {step === 0 && <Animated.View entering={FadeInDown.duration(260)}>
      <GameScene key={level.id} level={level} onContinue={() => setStep(1)} />
    </Animated.View>}
    {level.metrics.some((metric) => metric.severity !== "normal") && <View style={styles.signals}>
      {level.metrics.filter((metric) => metric.severity !== "normal").map((metric) => <Text key={metric.label} style={[styles.signal, metric.severity === "critical" && styles.criticalSignal]}>
        {metric.severity === "critical" ? "!" : "△"} {metric.label}: {metric.value}
      </Text>)}
    </View>}
    <LearnMore key={`${level.id}-${step}`} label={step === 0 ? "Learn more: signals & system" : "Review the problem & system"}>
      {step === 1 && <Text style={styles.context}>{level.description}</Text>}
      <MetricStrip metrics={level.metrics.map((metric) => metric.label === "Users" ? { ...metric, value: formatCompact(companyAtStart.users) } : metric)} />
      <View style={styles.architecture}><ArchitectureCanvas graph={{ ...graph, nodes: graph.nodes.map((node) => node.type === "client" ? { ...node, subtitle: `${companyAtStart.users.toLocaleString()} users` } : node) }} compact /></View>
    </LearnMore>
    <View style={step !== 1 ? styles.hidden : undefined} accessibilityElementsHidden={step !== 1} importantForAccessibility={step !== 1 ? "no-hide-descendants" : "auto"}>
        <DecisionDeck
          key={level.id}
          choices={level.choices}
          xpReward={level.xpReward}
          company={companyAtStart}
          playerName={playerName}
          completed={isCompleted}
          onChoose={(choice) => {
            if (!isCompleted && companyAtStart.cash >= choice.cost) {
              gameFeedback.trigger("choiceSelected");
              setPreviewChoice(choice);
            }
          }}
        />
      {hintIndex < 0 ? (
        <Pressable accessibilityRole="button" accessibilityLabel="Ask Byte, your AI assistant, for a hint" style={({ pressed }) => [styles.hintPrompt, pressed && styles.hintPromptPressed]} onPress={() => { gameFeedback.trigger("hintOpen"); setHintIndex(0); }}>
          <View style={styles.hintIcon}><Text style={styles.hintQuestion}>?</Text></View>
          <View style={styles.hintCopy}><Text style={styles.hintTitle}>Ask Byte for a hint</Text></View>
          <Text style={styles.hintArrow}>↗</Text>
        </Pressable>
      ) : (
        <Animated.View key={`${level.id}-${hintIndex}`} entering={FadeInDown.duration(280)} exiting={FadeOutUp.duration(160)} style={styles.byteHint}>
          <View style={styles.bytePortrait}>
            <Animated.Image entering={FadeInLeft.delay(70).duration(360)} source={byteExplaining} resizeMode="contain" style={styles.byteImage} accessibilityLabel="Byte explaining a system design hint" />
          </View>
          <View style={styles.byteMessage}>
            <View style={styles.byteHeader}>
              <View style={styles.byteIdentity}><View style={styles.byteOnline} /><Text style={styles.byteName}>BYTE</Text><Text style={styles.byteRole}>AI ASSISTANT</Text></View>
              <Pressable accessibilityRole="button" accessibilityLabel="Close hint" hitSlop={8} onPress={() => { gameFeedback.trigger("uiTap"); setHintIndex(-1); }} style={styles.hintClose}><Text style={styles.hintCloseText}>×</Text></Pressable>
            </View>
            <Text style={styles.hintEyebrow}>A THING TO CONSIDER  ·  {String(hintIndex + 1).padStart(2, "0")}/{String(level.hints.length).padStart(2, "0")}</Text>
            <Text style={styles.hintText}>{level.hints[hintIndex]}</Text>
            {level.hints.length > 1 && <Pressable accessibilityRole="button" accessibilityLabel="Ask Byte for another hint" onPress={() => { gameFeedback.trigger("hintOpen"); setHintIndex((current) => (current + 1) % level.hints.length); }} style={styles.nextHint}><Text style={styles.nextHintText}>ANOTHER CLUE</Text><Text style={styles.nextHintArrow}>→</Text></Pressable>}
          </View>
        </Animated.View>
      )}
      <Button variant="ghost" onPress={() => setStep(0)}>← The problem</Button>
    </View>
    {previewChoice && <ArchitectureTransition
      key={`${level.id}-${previewChoice.id}`}
      before={graph}
      choice={previewChoice}
      onCancel={() => setPreviewChoice(null)}
      onContinue={() => { if (chooseChoice(level, previewChoice)) router.replace("/outcome"); else setPreviewChoice(null); }}
    />}
  </Screen>;
}

const styles = StyleSheet.create({
  signals: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 12 },
  signal: { color: colors.yellow, fontSize: 12, lineHeight: 18, fontWeight: "700" },
  criticalSignal: { color: colors.red },
  context: { color: colors.text, fontSize: 13, lineHeight: 20 },
  recordedDecision: { gap: 10, marginBottom: 12 },
  hidden: { display: "none" },
  screen: { maxWidth: 900, paddingHorizontal: 18, paddingBottom: 44 },
  missing: { color: colors.white, padding: 30 },
  architecture: { marginTop: 15 },
  hintPrompt: { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 13, borderRadius: 13, backgroundColor: "#101D30", borderWidth: 1, borderColor: "#30445E", marginTop: 3 },
  hintPromptPressed: { backgroundColor: "#15263D", borderColor: "#668BB6" },
  hintIcon: { width: 32, height: 32, borderRadius: 10, backgroundColor: "#1B2B42", borderWidth: 1, borderColor: "#304A6B", alignItems: "center", justifyContent: "center" },
  hintQuestion: { color: colors.blue, fontSize: 16, fontWeight: "900" },
  hintCopy: { flex: 1, paddingHorizontal: 11 },
  hintTitle: { color: "#E2EAF4", fontSize: 12, fontWeight: "800" },
  hintArrow: { color: colors.blue, fontSize: 17, fontWeight: "700" },
  byteHint: { minHeight: 174, flexDirection: "row", overflow: "hidden", borderRadius: 15, backgroundColor: "#101D30", borderWidth: 1, borderColor: "#344B68", marginTop: 3 },
  bytePortrait: { width: 116, alignSelf: "stretch", overflow: "hidden", backgroundColor: "#14243B", borderRightWidth: 1, borderRightColor: "#283D57" },
  byteImage: { position: "absolute", width: 154, height: 184, left: -19, bottom: -7 },
  byteMessage: { flex: 1, minWidth: 0, paddingHorizontal: 14, paddingTop: 12, paddingBottom: 13 },
  byteHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  byteIdentity: { flexDirection: "row", alignItems: "center", gap: 6 },
  byteOnline: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.mint },
  byteName: { color: colors.mint, fontSize: 10, fontWeight: "900", letterSpacing: 1.3 },
  byteRole: { color: "#8394A9", fontSize: 7, fontWeight: "900", letterSpacing: 1 },
  hintClose: { width: 24, height: 24, alignItems: "center", justifyContent: "center", borderRadius: 7, backgroundColor: "#1A2A40" },
  hintCloseText: { color: "#A9B8C9", fontSize: 20, lineHeight: 22 },
  hintEyebrow: { color: "#8293A8", fontSize: 7, fontWeight: "900", letterSpacing: 0.8, marginTop: 11 },
  hintText: { color: "#E4ECF6", fontSize: 12, lineHeight: 18, fontWeight: "600", marginTop: 5 },
  nextHint: { alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 7, marginTop: 10, paddingVertical: 4 },
  nextHintText: { color: colors.mint, fontSize: 8, fontWeight: "900", letterSpacing: 0.9 },
  nextHintArrow: { color: colors.mint, fontSize: 12, fontWeight: "800" },
});
