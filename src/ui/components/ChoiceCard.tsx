import { getChoiceRewards } from "@/domain/simulation";
import { useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import Svg, { Circle, Path, Rect } from "react-native-svg";
import type { Choice, ChoiceEffectKey } from "@/domain/types";
import { colors, spacing } from "@/ui/theme";
import { gameFeedback } from "@/game/feedback/GameFeedbackManager";

const jimmyExplaining = require("../../../assets/characters/jimmy_explain.png");

type Impact = { key: Exclude<ChoiceEffectKey, "upfrontCost">; label: string; value: string; reason: string };

function signed(value: number) {
  return `${value >= 0 ? "+" : "−"}${Math.abs(value).toLocaleString()}`;
}

function getImpacts(choice: Choice): Impact[] {
  const effects = choice.effects;
  return [
    effects.monthlyBurn ? { key: "monthlyBurn", label: "MONTHLY BURN", value: `${signed(effects.monthlyBurn)}/mo`, reason: choice.tradeoff.effectReasons.monthlyBurn ?? choice.tradeoff.jimmyExplanation } : undefined,
    effects.reliability ? { key: "reliability", label: "RELIABILITY", value: signed(effects.reliability), reason: choice.tradeoff.effectReasons.reliability ?? choice.tradeoff.jimmyExplanation } : undefined,
    effects.customerTrust ? { key: "customerTrust", label: "CUSTOMER TRUST", value: signed(effects.customerTrust), reason: choice.tradeoff.effectReasons.customerTrust ?? choice.tradeoff.jimmyExplanation } : undefined,
    effects.complexity ? { key: "complexity", label: "OPS LOAD", value: signed(effects.complexity), reason: choice.tradeoff.effectReasons.complexity ?? choice.tradeoff.jimmyExplanation } : undefined,
  ].filter((impact): impact is Impact => Boolean(impact));
}

function DecisionGlyph({ choice }: { choice: Choice }) {
  const signature = `${choice.id} ${choice.label}`.toLowerCase();
  const stroke = colors.blue;
  let icon;
  if (/index|query|search|database/.test(signature)) icon = <><Path d="M4 6.5C4 4.6 7.6 3 12 3s8 1.6 8 3.5S16.4 10 12 10 4 8.4 4 6.5Z" fill="none" stroke={stroke} strokeWidth="1.7" /><Path d="M4 6.5v5C4 13.4 7.6 15 12 15m8-8.5v3m-16 2v5C4 18.4 7.6 20 12 20m8-8v-1m-8 4v5m2-7 3 3 5-6" fill="none" stroke={stroke} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></>;
  else if (/redis|cache/.test(signature)) icon = <><Path d="m12 3 8 4-8 4-8-4 8-4Zm-8 9 8 4 8-4M4 17l8 4 8-4" fill="none" stroke={stroke} strokeWidth="1.7" strokeLinejoin="round" /></>;
  else if (/pool|connection|replica/.test(signature)) icon = <><Circle cx="6" cy="6" r="2.3" fill="none" stroke={stroke} strokeWidth="1.7" /><Circle cx="18" cy="6" r="2.3" fill="none" stroke={stroke} strokeWidth="1.7" /><Circle cx="12" cy="18" r="2.3" fill="none" stroke={stroke} strokeWidth="1.7" /><Path d="M7.8 7.5 10.5 16m5.7-8.5L13.5 16M8.5 6h7" fill="none" stroke={stroke} strokeWidth="1.7" /></>;
  else if (/split|service/.test(signature)) icon = <><Path d="M12 3v7M12 10 5 16M12 10l7 6M5 16v4M19 16v4" fill="none" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" /><Circle cx="12" cy="3" r="2" fill={stroke} /><Circle cx="5" cy="20" r="2" fill={stroke} /><Circle cx="19" cy="20" r="2" fill={stroke} /></>;
  else if (/rewrite|language|stack/.test(signature)) icon = <><Path d="m8.5 6-5 6 5 6M15.5 6l5 6-5 6M13.5 4l-3 16" fill="none" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></>;
  else if (/monolith|modular|module/.test(signature)) icon = <><Rect x="4" y="4" width="16" height="16" rx="2.5" fill="none" stroke={stroke} strokeWidth="1.8" /><Path d="M12 4v16M4 12h8" fill="none" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" /></>;
  else icon = <><Rect x="4" y="4" width="16" height="6" rx="1.5" fill="none" stroke={stroke} strokeWidth="1.7" /><Rect x="4" y="14" width="16" height="6" rx="1.5" fill="none" stroke={stroke} strokeWidth="1.7" /><Circle cx="7" cy="7" r=".8" fill={stroke} /><Circle cx="7" cy="17" r=".8" fill={stroke} /><Path d="M11 7h6m-6 10h6" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" /></>;
  return <View style={styles.glyph}><Svg width={24} height={24} viewBox="0 0 24 24">{icon}</Svg></View>;
}

export function ChoiceCard({ choice, xpReward, onPress, disabled, disabledLabel, index = 0 }: { choice: Choice; xpReward: number; onPress: () => void; disabled?: boolean; disabledLabel?: string; index?: number }) {
  const impacts = getImpacts(choice);
  const rewards = getChoiceRewards(choice, xpReward);
  const [explanation, setExplanation] = useState<{ label: string; text: string } | null>(null);
  const showExplanation = (label: string, key: ChoiceEffectKey) => {
    gameFeedback.trigger("uiTap");
    const text = choice.tradeoff.effectReasons[key] ?? choice.tradeoff.jimmyExplanation;
    setExplanation((current) => current?.label === label ? null : { label, text });
  };

  return (
    <View style={styles.card}>
      <View style={styles.topline}>
        <View style={styles.optionMark}><View style={styles.optionDot} /><Text style={styles.optionLabel}>OPTION {String(index + 1).padStart(2, "0")}</Text></View>
        <Pressable accessibilityRole="button" accessibilityLabel={`Why ${choice.cost === 0 ? "there is no upfront cost" : `this costs $${choice.cost.toLocaleString()} upfront`}`} onPress={() => showExplanation("UPFRONT COST", "upfrontCost")} style={({ pressed }) => [styles.cost, pressed && styles.costPressed]}>
          <Text style={styles.costValue}>{choice.cost === 0 ? "NO COST" : `$${choice.cost.toLocaleString()}`}</Text>
          <Text style={styles.costCaption}>{choice.cost === 0 ? "TO SHIP" : "UPFRONT"}</Text>
          <QuestionMark />
        </Pressable>
      </View>
      <View style={styles.decision}>
        <DecisionGlyph choice={choice} />
        <View style={styles.copy}>
          <Text style={styles.label}>{choice.label}</Text>
          <Text style={styles.description}>{choice.description}</Text>
        </View>
      </View>
      <View style={styles.tradeoffRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`What you gain: ${choice.tradeoff.upsideLabel}. ${choice.tradeoff.upside} Ask Jimmy why.`}
          accessibilityState={{ expanded: explanation?.label === "WHAT YOU GAIN" }}
          onPress={() => {
            gameFeedback.trigger("uiTap");
            setExplanation((current) => current?.label === "WHAT YOU GAIN" ? null : { label: "WHAT YOU GAIN", text: choice.tradeoff.jimmyExplanation });
          }}
          style={({ pressed }) => [styles.tradeoffCell, explanation?.label === "WHAT YOU GAIN" && styles.tradeoffSelected, pressed && styles.impactPressed]}
        >
          <View style={styles.tradeoffHeading}><Text style={[styles.tradeoffLabel, styles.gainLabel]}>WHAT YOU GAIN</Text><QuestionMark /></View>
          <Text style={styles.tradeoffTitle}>{choice.tradeoff.upsideLabel}</Text>
          <Text style={styles.tradeoffText}>{choice.tradeoff.upside}</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`What you give up: ${choice.tradeoff.downsideLabel}. ${choice.tradeoff.downside} Ask Jimmy why.`}
          accessibilityState={{ expanded: explanation?.label === "WHAT YOU GIVE UP" }}
          onPress={() => {
            gameFeedback.trigger("uiTap");
            setExplanation((current) => current?.label === "WHAT YOU GIVE UP" ? null : { label: "WHAT YOU GIVE UP", text: choice.tradeoff.jimmyExplanation });
          }}
          style={({ pressed }) => [styles.tradeoffCell, explanation?.label === "WHAT YOU GIVE UP" && styles.tradeoffSelected, pressed && styles.impactPressed]}
        >
          <View style={styles.tradeoffHeading}><Text style={[styles.tradeoffLabel, styles.costLabel]}>WHAT YOU GIVE UP</Text><QuestionMark /></View>
          <Text style={styles.tradeoffTitle}>{choice.tradeoff.downsideLabel}</Text>
          <Text style={styles.tradeoffText}>{choice.tradeoff.downside}</Text>
        </Pressable>
      </View>
      {impacts.length > 0 && <View style={styles.impactSection}>
        <View style={styles.impactRow}>{impacts.map((impact) => <Pressable key={impact.key} accessibilityRole="button" accessibilityLabel={`Why ${impact.label.toLowerCase()} changes by ${impact.value}`} onPress={() => showExplanation(impact.label, impact.key)} style={({ pressed }) => [styles.impact, explanation?.label === impact.label && styles.impactSelected, pressed && styles.impactPressed]}>
          <Text style={styles.impactLabel}>{impact.label}</Text><Text style={styles.impactValue}>{impact.value}</Text><QuestionMark />
        </Pressable>)}</View>
        <Text style={styles.impactHint}>TAP ? FOR JIMMY’S REASONING</Text>
      </View>}
      <Text style={[styles.description, { marginTop: 10 }]}>
        CTO confidence {signed(rewards.confidence)} · XP {signed(rewards.xp)} (minimum 0 total XP)
      </Text>

      {explanation && <Animated.View entering={FadeInDown.duration(220)} style={styles.jimmyExplanation}>
        <Image source={jimmyExplaining} resizeMode="contain" style={styles.jimmyImage} accessibilityLabel="Jimmy explaining the choice" />
        <View style={styles.explanationCopy}>
          <View style={styles.explanationHeading}><View style={styles.jimmyOnline} /><Text style={styles.explanationLabel}>JIMMY EXPLAINS · {explanation.label}</Text></View>
          <Text style={styles.explanationText}>{explanation.text}</Text>
        </View>
      </Animated.View>}

      <View style={styles.actions}>
        <Pressable accessibilityRole="button" accessibilityLabel={`Ask Jimmy why ${choice.label} is a trade-off`} accessibilityState={{ expanded: explanation !== null }} onPress={() => { gameFeedback.trigger("uiTap"); setExplanation((current) => current?.label === "THE WHOLE CALL" ? null : { label: "THE WHOLE CALL", text: choice.tradeoff.jimmyExplanation }); }} style={styles.askJimmy}>
          <Text style={styles.askJimmyText}>{explanation?.label === "THE WHOLE CALL" ? "HIDE JIMMY’S TAKE" : "ASK JIMMY WHY"}</Text>
          <Text style={styles.askJimmyArrow}>{explanation?.label === "THE WHOLE CALL" ? "−" : "+"}</Text>
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel={`Choose option ${index + 1}: ${choice.label}`} onPress={onPress} disabled={disabled} style={({ pressed }) => [styles.chooseButton, disabled && styles.chooseDisabled, pressed && styles.choosePressed]}>
          <Text style={styles.chooseText}>{disabled ? disabledLabel ?? "NOT ENOUGH CASH" : "CHOOSE THIS PATH"}</Text><Text style={styles.chooseArrow}>→</Text>
        </Pressable>
      </View>
    </View>
  );
}

function QuestionMark() {
  return <View style={styles.questionMark}><Text style={styles.questionText}>?</Text></View>;
}

const styles = StyleSheet.create({
  card: { backgroundColor: "#0E1A2B", borderRadius: 14, borderWidth: 1, borderColor: "#2A3E57", padding: spacing.md, marginBottom: 9, overflow: "hidden" },
  topline: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingBottom: 9, borderBottomWidth: 1, borderBottomColor: "#22354B" },
  optionMark: { flexDirection: "row", alignItems: "center", gap: 7 },
  optionDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.blue },
  optionLabel: { color: "#8494A9", fontSize: 9, fontWeight: "900", letterSpacing: 1 },
  cost: { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 4, paddingLeft: 7 },
  costPressed: { opacity: 0.72 },
  costValue: { color: "#E4EBF3", fontSize: 12, fontWeight: "900" },
  costCaption: { color: "#718198", fontSize: 7, fontWeight: "800", letterSpacing: 0.65 },
  decision: { flexDirection: "row", alignItems: "center", gap: 11, paddingTop: 10 },
  glyph: { width: 38, height: 38, borderRadius: 11, borderWidth: 1, borderColor: "#324B68", backgroundColor: "#14243A", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  copy: { flex: 1, minWidth: 0 },
  label: { color: colors.white, fontSize: 15, lineHeight: 19, fontWeight: "800", letterSpacing: -0.15 },
  description: { color: "#99A8BB", fontSize: 12, lineHeight: 17, marginTop: 3 },
  impactSection: { paddingTop: 10, marginTop: 9, borderTopWidth: 1, borderTopColor: "#22354B" },
  impactRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  impact: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 6, flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#14243A", borderWidth: 1, borderColor: "#30445E" },
  impactSelected: { borderColor: "#7099C8", backgroundColor: "#1A2C43" },
  impactPressed: { opacity: 0.72 },
  impactLabel: { color: "#A5B4C7", fontSize: 8, fontWeight: "800", letterSpacing: 0.45 },
  impactValue: { color: "#E0E8F2", fontSize: 10, fontWeight: "900" },
  questionMark: { width: 15, height: 15, borderRadius: 7.5, borderWidth: 1, borderColor: "#5B7595", alignItems: "center", justifyContent: "center", marginLeft: 1 },
  questionText: { color: "#BAD0E8", fontSize: 9, lineHeight: 11, fontWeight: "900" },
  impactHint: { color: "#71849D", fontSize: 7, fontWeight: "800", letterSpacing: 0.55, marginTop: 7 },
  tradeoffRow: { flexDirection: "row", gap: 8, marginTop: 11 },
  tradeoffCell: { flex: 1, minWidth: 0, padding: 10, borderRadius: 10, borderWidth: 1, borderColor: "#30445E", backgroundColor: "#142338" },
  tradeoffSelected: { borderColor: "#7099C8", backgroundColor: "#1A2C43" },
  tradeoffHeading: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 4 },
  tradeoffLabel: { fontSize: 8, fontWeight: "900", letterSpacing: 0.6 },
  gainLabel: { color: "#83B7EC" },
  costLabel: { color: "#E5BC77" },
  tradeoffTitle: { color: "#E4EBF3", fontSize: 12, lineHeight: 16, fontWeight: "800", marginTop: 7 },
  tradeoffText: { color: "#ACBACB", fontSize: 10, lineHeight: 15, marginTop: 4 },
  jimmyExplanation: { flexDirection: "row", alignItems: "center", gap: 8, padding: 9, marginTop: 10, borderWidth: 1, borderColor: "#31516C", borderRadius: 10, backgroundColor: "#12243A" },
  jimmyImage: { width: 48, height: 66, flexShrink: 0 },
  explanationCopy: { flex: 1, minWidth: 0 },
  explanationHeading: { flexDirection: "row", alignItems: "center", gap: 6 },
  jimmyOnline: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: colors.mint },
  explanationLabel: { color: colors.mint, fontSize: 7, fontWeight: "900", letterSpacing: 0.6 },
  explanationText: { color: "#D7E1ED", fontSize: 10, lineHeight: 15, fontWeight: "600", marginTop: 4 },
  actions: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8, marginTop: 11, paddingTop: 9, borderTopWidth: 1, borderTopColor: "#22354B" },
  askJimmy: { flexDirection: "row", alignItems: "center", gap: 7, paddingHorizontal: 9, paddingVertical: 8, borderRadius: 8 },
  askJimmyText: { color: colors.blue, fontSize: 8, fontWeight: "900", letterSpacing: 0.65 },
  askJimmyArrow: { color: colors.blue, fontSize: 14, lineHeight: 16, fontWeight: "700" },
  chooseButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, minHeight: 36, paddingHorizontal: 12, borderRadius: 9, borderWidth: 1, borderColor: "#355779", backgroundColor: "#172D47" },
  chooseDisabled: { opacity: 0.45 },
  choosePressed: { backgroundColor: "#203B5B" },
  chooseText: { color: colors.white, fontSize: 8, fontWeight: "900", letterSpacing: 0.55 },
  chooseArrow: { color: colors.mint, fontSize: 13, fontWeight: "900" },
});
