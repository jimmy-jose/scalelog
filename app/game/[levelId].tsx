import { CompanySummary } from "@/ui/components/CompanySummary";
import { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { Redirect, router, useLocalSearchParams } from "expo-router";
import Animated, { FadeInDown, FadeInLeft, FadeOutUp } from "react-native-reanimated";
import { allLevels, getLevel } from "@/campaigns";
import { getArchitectureAtLevelStart, getCompanyAtLevelStart, useGameStore } from "@/store/gameStore";
import { Screen } from "@/ui/components/Screen";
import { ArchitectureCanvas } from "@/ui/components/ArchitectureCanvas";
import { GameScene } from "@/ui/components/GameScene";
import { MetricStrip } from "@/ui/components/MetricStrip";
import { DecisionDeck } from "@/ui/components/DecisionDeck";
import { ArchitectureTransition } from "@/ui/components/ArchitectureTransition";
import type { Choice } from "@/domain/types";
import { colors, spacing } from "@/ui/theme";
import { formatCompact } from "@/lib/format";
import { gameFeedback } from "@/game/feedback/GameFeedbackManager";

export function generateStaticParams() {
  return allLevels.map((level) => ({ levelId: level.id }));
}

const jimmyExplaining = require("../../assets/characters/jimmy_explain.png");

export default function GameplayScreen() {
  const { width } = useWindowDimensions();
  const wideLayout = width >= 900;
  const { levelId } = useLocalSearchParams<{ levelId: string }>();
  const level = getLevel(String(levelId));
  const failureReason = useGameStore((state) => state.failureReason);
  const unlockedLevels = useGameStore((state) => state.player.unlockedLevels);
  const company = useGameStore((state) => state.company);
  const playerName = useGameStore((state) => state.profile.name);
  const progress = useGameStore((state) => state.progress);
  const activeCampaignId = useGameStore((state) => state.activeCampaignId);
  const chooseChoice = useGameStore((state) => state.chooseChoice);
  const setCurrentLevel = useGameStore((state) => state.setCurrentLevel);
  const [hintIndex, setHintIndex] = useState(-1);
  const [previewChoice, setPreviewChoice] = useState<Choice | null>(null);
  const companyAtStart = useMemo(
    () => level ? getCompanyAtLevelStart({ activeCampaignId, company, progress }, level.id) : company,
    [activeCampaignId, company, progress, level?.id],
  );
  const isCompleted = Boolean(level && progress.completedLevels.includes(level.id));
  useEffect(() => { if (level) setCurrentLevel(level.id); }, [level, setCurrentLevel]);
  useEffect(() => { setHintIndex(-1); }, [level?.id]);
  const incidentFeedback = level?.incidentFeedback ?? (level?.metrics.some((metric) => metric.severity === "critical")
    ? "criticalIncident"
    : level?.metrics.some((metric) => metric.severity === "warning") ? "incidentWarning" : undefined);
  useEffect(() => {
    if (!incidentFeedback || isCompleted) return;
    const timer = setTimeout(() => gameFeedback.trigger(incidentFeedback), 220);
    return () => clearTimeout(timer);
  }, [level?.id, incidentFeedback, isCompleted]);
  const graph = useMemo(
    () => level ? getArchitectureAtLevelStart({ activeCampaignId, progress }, level.id) : undefined,
    [activeCampaignId, level?.id, progress],
  );
  if (!level || !graph) return <Screen><Text style={styles.missing}>Level not found.</Text></Screen>;
  if (failureReason) return <Redirect href="/complete" />;
  if (level.campaignId !== activeCampaignId || !unlockedLevels.includes(level.id)) return <Redirect href="/levels" />;
  return <Screen contentStyle={styles.screen}>
    <CompanySummary levelId={level.id} onBack={() => router.replace("/levels")} />
    <View style={[styles.workspace, wideLayout && styles.wideWorkspace]}>
      <View style={[styles.briefingColumn, wideLayout && styles.wideBriefingColumn]}>
        <Animated.View entering={FadeInDown.duration(300)}><GameScene level={level} /></Animated.View>
        <View style={styles.systemColumn}>
          <View style={styles.sectionHead}><View><Text style={styles.sectionTitle}>INCIDENT SIGNALS</Text><Text style={styles.sectionSub}>What is happening right now</Text></View><Text style={styles.signalCount}>0{level.metrics.length} SIGNALS</Text></View>
          <MetricStrip metrics={level.metrics.map((metric) => metric.label === "Users" ? { ...metric, value: formatCompact(companyAtStart.users) } : metric)} />
        </View>
        <View style={styles.architecture}><ArchitectureCanvas graph={{ ...graph, nodes: graph.nodes.map((node) => node.type === "client" ? { ...node, subtitle: `${companyAtStart.users.toLocaleString()} users` } : node) }} compact /></View>
      </View>
      <View style={[styles.decisionColumn, wideLayout && styles.wideDecisionColumn]}>
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
        <Pressable accessibilityRole="button" accessibilityLabel="Ask Jimmy, your AI assistant, for a hint" style={({ pressed }) => [styles.hintPrompt, pressed && styles.hintPromptPressed]} onPress={() => { gameFeedback.trigger("hintOpen"); setHintIndex(0); }}>
          <View style={styles.hintIcon}><Text style={styles.hintQuestion}>?</Text></View>
          <View style={styles.hintCopy}><Text style={styles.hintTitle}>Ask Jimmy for a hint</Text><Text style={styles.hintSub}>Get a tactical clue from your AI assistant</Text></View>
          <Text style={styles.hintArrow}>↗</Text>
        </Pressable>
      ) : (
        <Animated.View key={`${level.id}-${hintIndex}`} entering={FadeInDown.duration(280)} exiting={FadeOutUp.duration(160)} style={styles.jimmyHint}>
          <View style={styles.jimmyPortrait}>
            <Animated.Image entering={FadeInLeft.delay(70).duration(360)} source={jimmyExplaining} resizeMode="contain" style={styles.jimmyImage} accessibilityLabel="Jimmy explaining a system design hint" />
          </View>
          <View style={styles.jimmyMessage}>
            <View style={styles.jimmyHeader}>
              <View style={styles.jimmyIdentity}><View style={styles.jimmyOnline} /><Text style={styles.jimmyName}>JIMMY</Text><Text style={styles.jimmyRole}>AI ASSISTANT</Text></View>
              <Pressable accessibilityRole="button" accessibilityLabel="Close hint" hitSlop={8} onPress={() => { gameFeedback.trigger("uiTap"); setHintIndex(-1); }} style={styles.hintClose}><Text style={styles.hintCloseText}>×</Text></Pressable>
            </View>
            <Text style={styles.hintEyebrow}>A THING TO CONSIDER  ·  {String(hintIndex + 1).padStart(2, "0")}/{String(level.hints.length).padStart(2, "0")}</Text>
            <Text style={styles.hintText}>{level.hints[hintIndex]}</Text>
            {level.hints.length > 1 && <Pressable accessibilityRole="button" accessibilityLabel="Ask Jimmy for another hint" onPress={() => { gameFeedback.trigger("hintOpen"); setHintIndex((current) => (current + 1) % level.hints.length); }} style={styles.nextHint}><Text style={styles.nextHintText}>ANOTHER CLUE</Text><Text style={styles.nextHintArrow}>→</Text></Pressable>}
          </View>
        </Animated.View>
      )}
      </View>
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
  screen: { paddingHorizontal: 18, paddingBottom: 44 }, missing: { color: colors.white, padding: 30 },
  workspace: { minWidth: 0 }, wideWorkspace: { flexDirection: "row", alignItems: "flex-start", gap: 14 },
  briefingColumn: { minWidth: 0 }, wideBriefingColumn: { flex: 0.92 },
  systemColumn: { minWidth: 0, marginTop: 15 }, decisionColumn: { minWidth: 0, marginTop: 15 }, wideDecisionColumn: { flex: 1.08, marginTop: 0 },
  sectionHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.sm }, sectionTitle: { color: colors.white, fontSize: 12, fontWeight: "900", letterSpacing: 1.1 }, sectionSub: { color: colors.muted, fontSize: 10, marginTop: 4 }, signalCount: { color: colors.dim, fontSize: 8, fontWeight: "900", letterSpacing: 0.7 }, architecture: { marginTop: 15 },
  hintPrompt: { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 13, borderRadius: 13, backgroundColor: "#101D30", borderWidth: 1, borderColor: "#30445E", marginTop: 3 }, hintPromptPressed: { backgroundColor: "#15263D", borderColor: "#668BB6" }, hintIcon: { width: 32, height: 32, borderRadius: 10, backgroundColor: "#1B2B42", borderWidth: 1, borderColor: "#304A6B", alignItems: "center", justifyContent: "center" }, hintQuestion: { color: colors.blue, fontSize: 16, fontWeight: "900" }, hintCopy: { flex: 1, paddingHorizontal: 11 }, hintTitle: { color: "#E2EAF4", fontSize: 12, fontWeight: "800" }, hintSub: { color: colors.muted, fontSize: 10, marginTop: 3 }, hintArrow: { color: colors.blue, fontSize: 17, fontWeight: "700" },
  jimmyHint: { minHeight: 174, flexDirection: "row", overflow: "hidden", borderRadius: 15, backgroundColor: "#101D30", borderWidth: 1, borderColor: "#344B68", marginTop: 3 }, jimmyPortrait: { width: 116, alignSelf: "stretch", overflow: "hidden", backgroundColor: "#14243B", borderRightWidth: 1, borderRightColor: "#283D57" }, jimmyImage: { position: "absolute", width: 154, height: 184, left: -19, bottom: -7 }, jimmyMessage: { flex: 1, minWidth: 0, paddingHorizontal: 14, paddingTop: 12, paddingBottom: 13 }, jimmyHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, jimmyIdentity: { flexDirection: "row", alignItems: "center", gap: 6 }, jimmyOnline: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.mint }, jimmyName: { color: colors.mint, fontSize: 10, fontWeight: "900", letterSpacing: 1.3 }, jimmyRole: { color: "#8394A9", fontSize: 7, fontWeight: "900", letterSpacing: 1 }, hintClose: { width: 24, height: 24, alignItems: "center", justifyContent: "center", borderRadius: 7, backgroundColor: "#1A2A40" }, hintCloseText: { color: "#A9B8C9", fontSize: 20, lineHeight: 22 }, hintEyebrow: { color: "#8293A8", fontSize: 7, fontWeight: "900", letterSpacing: 0.8, marginTop: 11 }, hintText: { color: "#E4ECF6", fontSize: 12, lineHeight: 18, fontWeight: "600", marginTop: 5 }, nextHint: { alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 7, marginTop: 10, paddingVertical: 4 }, nextHintText: { color: colors.mint, fontSize: 8, fontWeight: "900", letterSpacing: 0.9 }, nextHintArrow: { color: colors.mint, fontSize: 12, fontWeight: "800" },
});
