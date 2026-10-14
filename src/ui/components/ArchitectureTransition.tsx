import { useEffect, useMemo, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, { Easing, FadeInDown, cancelAnimation, runOnJS, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from "react-native-reanimated";
import type { ArchitectureGraph, Choice } from "@/domain/types";
import { applyArchitectureChanges } from "@/domain/architecture";
import { ArchitectureCanvas } from "@/ui/components/ArchitectureCanvas";
import { colors } from "@/ui/theme";
import { gameFeedback } from "@/game/feedback/GameFeedbackManager";

function getArchitectureFeedback(choice: Choice) {
  const changes = choice.architectureChanges ?? [];
  const configured = changes.find((change) => change.feedback)?.feedback;
  if (configured) return configured;
  if (changes.some((change) => change.type === "addNode")) return "nodeAdded" as const;
  if (changes.some((change) => change.type === "updateNode" && change.patch.state === "failed")) return "nodeFailed" as const;
  return undefined;
}

export function ArchitectureTransition({ before, choice, onCancel, onContinue }: {
  before: ArchitectureGraph;
  choice: Choice;
  onCancel: () => void;
  onContinue: () => void;
}) {
  const [ready, setReady] = useState(false);
  const [continuing, setContinuing] = useState(false);
  const [beforeHeight, setBeforeHeight] = useState(0);
  const [afterHeight, setAfterHeight] = useState(0);
  const reducedMotion = useReducedMotion();
  const progress = useSharedValue(0);
  const beforeStyle = useAnimatedStyle(() => ({ opacity: 1 - progress.value }));
  const afterStyle = useAnimatedStyle(() => ({ opacity: progress.value }));
  const after = useMemo(() => applyArchitectureChanges(before, choice.architectureChanges), [before, choice]);
  const changedIds = useMemo(() => (choice.architectureChanges ?? []).flatMap((change) => {
    if (change.type === "addNode") return [change.node.id];
    if (change.type === "updateNode") return [change.nodeId];
    return [];
  }), [choice]);
  const addedCount = after.nodes.length - before.nodes.length;
  const architectureFeedback = getArchitectureFeedback(choice);
  const measured = beforeHeight > 0 && afterHeight > 0;

  useEffect(() => {
    if (!measured) return;
    // Both maps are already mounted and measured, so revealing the result never
    // restarts node entrances or briefly falls back to the mobile layout.
    const applyTimer = setTimeout(() => {
      if (architectureFeedback) gameFeedback.trigger(architectureFeedback);
      progress.value = withTiming(1, { duration: reducedMotion ? 0 : 680, easing: Easing.inOut(Easing.cubic) }, (finished) => {
        if (finished) runOnJS(setReady)(true);
      });
    }, reducedMotion ? 0 : 450);
    return () => { clearTimeout(applyTimer); cancelAnimation(progress); };
  }, [measured, architectureFeedback, reducedMotion, progress]);

  return <Modal visible transparent animationType={reducedMotion ? "none" : "fade"} onRequestClose={onCancel}>
    <View style={styles.backdrop}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Animated.View entering={reducedMotion ? undefined : FadeInDown.duration(280).easing(Easing.out(Easing.cubic))} style={styles.sheet}>
          <View style={styles.topline}><View style={styles.statusDot} /><Text style={styles.kicker}>SYSTEM CHANGE  /  {ready ? "PREVIEW READY" : "IN PROGRESS"}</Text><Pressable accessibilityRole="button" accessibilityLabel="Back to decisions" onPress={() => { gameFeedback.trigger("uiTap"); onCancel(); }} style={styles.close}><Text style={styles.closeText}>×</Text></Pressable></View>
          <Text style={styles.title}>Preview your architecture.</Text>
          <Text style={styles.subtitle}>{choice.label}{addedCount > 0 ? `  ·  ${addedCount} new components` : choice.architectureChanges?.length ? "  ·  system updated" : "  ·  topology unchanged"}</Text>
          <View style={[styles.map, { height: Math.max(beforeHeight, afterHeight) }]}>
            <Animated.View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" aria-hidden style={[styles.mapLayer, beforeStyle]}>
              <View onLayout={(event) => setBeforeHeight(event.nativeEvent.layout.height)}>
                <ArchitectureCanvas graph={before} compact animateEntrance={false} animateTraffic={false} interactive={false} />
              </View>
            </Animated.View>
            <Animated.View pointerEvents={ready ? "auto" : "none"} accessibilityElementsHidden={!ready} importantForAccessibility={ready ? "auto" : "no-hide-descendants"} aria-hidden={!ready} style={[styles.mapLayer, afterStyle]}>
              <View onLayout={(event) => setAfterHeight(event.nativeEvent.layout.height)}>
                <ArchitectureCanvas graph={after} compact highlightIds={changedIds} animateEntrance={false} animateTraffic={ready && !reducedMotion} interactive={ready} />
              </View>
            </Animated.View>
          </View>
          <View style={styles.footer}>
            <Text style={styles.note}>{ready ? "This is a preview. Commit when you’re ready, or go back to explore another solution." : "Updating components and connections…"}</Text>
            <Pressable accessibilityRole="button" accessibilityLabel="Commit this solution and see the outcome" accessibilityState={{ disabled: !ready || continuing }} disabled={!ready || continuing} onPress={() => { gameFeedback.trigger("uiTap"); setContinuing(true); onContinue(); }} style={[styles.continue, (!ready || continuing) && styles.continueDisabled]}><Text style={styles.continueText}>{ready ? "COMMIT SOLUTION  →" : "WATCHING THE CHANGE…"}</Text></Pressable>
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  </Modal>;
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(3, 9, 19, 0.96)" },
  scrollContent: { flexGrow: 1, justifyContent: "center", alignItems: "center", padding: 14 },
  sheet: { width: "100%", maxWidth: 1040, borderWidth: 1, borderColor: "#3A5670", borderRadius: 19, backgroundColor: "#0B1828", padding: 16 },
  topline: { flexDirection: "row", alignItems: "center", gap: 7 },
  statusDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.mint },
  kicker: { color: colors.mint, fontSize: 9, fontWeight: "900", letterSpacing: 1.1, flex: 1 },
  close: { width: 28, height: 28, alignItems: "center", justifyContent: "center", borderRadius: 8, backgroundColor: "#17283D" },
  closeText: { color: "#B7C5D6", fontSize: 20, lineHeight: 22 },
  title: { color: "#F0F5FA", fontSize: 23, fontWeight: "900", letterSpacing: -0.5, marginTop: 7 },
  subtitle: { color: "#A8BCD0", fontSize: 11, lineHeight: 16, marginTop: 4 },
  map: { marginTop: 14 },
  mapLayer: { position: "absolute", top: 0, left: 0, right: 0 },
  footer: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 15, marginTop: 15, flexWrap: "wrap" },
  note: { color: "#9EB2C5", fontSize: 10, lineHeight: 15, flex: 1, minWidth: 180 },
  continue: { borderRadius: 9, backgroundColor: colors.mint, paddingHorizontal: 17, paddingVertical: 12, alignItems: "center", justifyContent: "center", minWidth: 205 },
  continueDisabled: { opacity: 0.45 },
  continueText: { color: "#081724", fontSize: 10, fontWeight: "900", letterSpacing: 0.55 },
});
