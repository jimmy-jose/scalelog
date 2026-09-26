import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Path, Rect } from "react-native-svg";
import { campaigns } from "@/campaigns";
import { getCompanySummary } from "@/domain/simulation";
import type { OutcomeSnapshot } from "@/domain/types";
import { getCompanyAtLevelStart, useGameStore } from "@/store/gameStore";
import { formatMoney, signed } from "@/lib/format";
import { colors } from "@/ui/theme";
import { gameFeedback } from "@/game/feedback/GameFeedbackManager";
import { CampaignResetButton } from "./CampaignResetButton";
import { MusicButton } from "./MusicButton";

type ResourceKind = "cash" | "runway" | "users" | "revenue" | "burn" | "balance";

function ResourceIcon({ kind, color }: { kind: ResourceKind; color: string }) {
  const stroke = { stroke: color, strokeWidth: 1.6, fill: "none", strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  let shape;
  switch (kind) {
    case "cash": shape = <><Rect x="3" y="5" width="18" height="14" rx="3" {...stroke} /><Path d="M21 10h-6v5h6M6 5V3h11" {...stroke} /><Circle cx="17" cy="12.5" r=".8" fill={color} /></>; break;
    case "runway": shape = <><Circle cx="12" cy="13" r="8" {...stroke} /><Path d="M12 9v4l3 2M9 2h6M12 2v3" {...stroke} /></>; break;
    case "users": shape = <><Circle cx="9" cy="8" r="3" {...stroke} /><Path d="M3 20v-2a6 6 0 0 1 12 0v2M16 5a3 3 0 0 1 0 6M18 14a5 5 0 0 1 3 4v2" {...stroke} /></>; break;
    case "revenue": shape = <><Path d="M4 18 10 12l4 3 6-10M14 5h6v6" {...stroke} /></>; break;
    case "burn": shape = <Path d="M13 2c1 6 6 7 6 13a7 7 0 0 1-14 0c0-3 2-5 4-7 0 4 2 4 2 4s3-4 2-10ZM12 14c-3 3-2 6 0 6s3-3 0-6Z" {...stroke} />; break;
    case "balance": shape = <><Path d="M4 8h15l-4-4M20 16H5l4 4" {...stroke} /></>; break;
  }
  return <Svg width={13} height={13} viewBox="0 0 24 24" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">{shape}</Svg>;
}

function HealthMeter({ label, value, color, limit, inverse = false }: { label: string; value: number; color: string; limit: number; inverse?: boolean }) {
  const danger = inverse ? value >= limit : value <= limit;
  const warning = inverse ? value >= 40 : value < (label === "RELIABILITY" ? 70 : 55);
  const accent = danger ? colors.red : warning ? colors.yellow : color;
  return <View style={styles.meter} accessible accessibilityRole="progressbar" accessibilityLabel={`${label}. ${inverse ? "Lower is better" : "Higher is better"}. Run ends ${inverse ? "at or above" : "at or below"} ${limit}.`} accessibilityValue={{ min: 0, max: 100, now: value }}>
    <View style={styles.meterHeading}><Text style={styles.statLabel}>{label}{inverse ? " ↓" : ""}</Text><Text style={[styles.score, { color: accent }]}>{value}<Text style={styles.scoreMax}>/100</Text></Text></View>
    <View style={styles.meterTrack}>
      <View style={styles.segments}>{Array.from({ length: 10 }, (_, index) => <View key={index} style={styles.segment}><View style={{ height: "100%", width: `${Math.max(0, Math.min(100, (value - index * 10) * 10))}%`, backgroundColor: accent }} /></View>)}</View>
      <View style={[styles.limitMarker, { left: `${limit}%` }]} />
    </View>
  </View>;
}

function DecisionDeltas({ entry }: { entry: OutcomeSnapshot }) {
  const cash = entry.companyAfter.cash - entry.companyBefore.cash;
  const changes = [
    { label: "CASH", value: cash, text: `${cash < 0 ? "−" : "+"}${formatMoney(Math.abs(cash))}` },
    { label: "CONFIDENCE", value: entry.confidenceAfter - entry.confidenceBefore, text: signed(entry.confidenceAfter - entry.confidenceBefore) },
    { label: "XP", value: entry.xpEarned, text: signed(entry.xpEarned) },
  ];
  return <View style={styles.deltas}>{changes.map((change) => <View key={change.label} style={styles.deltaChip}>
    <Text style={styles.deltaLabel}>{change.label}</Text><Text style={[styles.deltaValue, { color: change.value < 0 ? colors.red : change.value > 0 ? colors.mint : colors.muted }]}>{change.text}</Text>
  </View>)}</View>;
}

export function CompanySummary({ levelId, showHistory = false, onBack }: { levelId?: string; showHistory?: boolean; onBack?: () => void }) {
  const [panelWidth, setPanelWidth] = useState(0);
  const [showRules, setShowRules] = useState(false);
  const [expanded, setExpanded] = useState(showHistory);
  const company = useGameStore((state) => state.company);
  const confidence = useGameStore((state) => state.player.confidence);
  const progress = useGameStore((state) => state.progress);
  const history = useGameStore((state) => state.history);
  const failureReason = useGameStore((state) => state.failureReason);
  const activeCampaignId = useGameStore((state) => state.activeCampaignId);
  const campaign = campaigns.find((item) => item.id === activeCampaignId);
  const levelIndex = levelId ? campaign?.levelIds.indexOf(levelId) ?? -1 : -1;
  const visibleHistory = levelIndex >= 0 ? history.filter((item) => (campaign?.levelIds.indexOf(item.levelId) ?? -1) < levelIndex) : history;
  const snapshot = levelId ? getCompanyAtLevelStart({ company, progress, activeCampaignId }, levelId) : company;
  const snapshotConfidence = levelIndex >= 0 ? visibleHistory[visibleHistory.length - 1]?.confidenceAfter ?? 70 : confidence;
  const summary = getCompanySummary(snapshot, snapshotConfidence, visibleHistory.length);
  const failed = levelId ? undefined : failureReason;
  const health = failed ? "Failed" : summary.health;
  const accent = health === "Failed" || health === "Critical" ? colors.red : health === "Under pressure" ? colors.yellow : colors.mint;
  const latest = visibleHistory[visibleHistory.length - 1];
  const netFlow = snapshot.monthlyRevenue - snapshot.monthlyBurn;
  const resourceWidth = expanded && panelWidth >= 880 ? "15.5%" : "32%";
  const meterWidth = panelWidth >= 600 ? "24%" : "49%";
  const resources: { kind: ResourceKind; label: string; value: string; unit: string; color: string }[] = [
    { kind: "cash", label: "TREASURY", value: formatMoney(snapshot.cash), unit: "cash available", color: snapshot.cash <= 0 ? colors.red : colors.mint },
    { kind: "runway", label: "RUNWAY", value: summary.runway === null ? "∞" : summary.runway.toFixed(1), unit: summary.runway === null ? "self-funded" : "months remaining", color: summary.runway !== null && summary.runway < 3 ? colors.red : colors.yellow },
    { kind: "users", label: "ACTIVE USERS", value: snapshot.users.toLocaleString(), unit: "customers", color: colors.blue },
    { kind: "revenue", label: "REVENUE", value: formatMoney(snapshot.monthlyRevenue), unit: "per month", color: colors.mint },
    { kind: "burn", label: "BURN RATE", value: formatMoney(snapshot.monthlyBurn), unit: "per month", color: colors.orange },
    { kind: "balance", label: "NET CASH FLOW", value: `${netFlow < 0 ? "−" : "+"}${formatMoney(Math.abs(netFlow))}`, unit: "per month", color: netFlow < 0 ? colors.red : colors.mint },
  ];

  return <View onLayout={(event) => setPanelWidth(event.nativeEvent.layout.width)} style={styles.card}>
    <View style={styles.heading}>
      <View style={styles.identity}>
        {onBack && <Pressable accessibilityRole="button" accessibilityLabel="Back to campaign map" onPress={() => { gameFeedback.trigger("uiTap"); onBack(); }} hitSlop={6} style={styles.back}><Text style={styles.backArrow}>‹</Text></Pressable>}
        <Text accessibilityRole="header" style={styles.title}>{campaign?.story.companyName ?? "Company"}</Text>
        <Text style={styles.meta}>{levelIndex >= 0 ? `LVL ${String(levelIndex + 1).padStart(2, "0")} · ` : ""}M{String(visibleHistory.length).padStart(2, "0")}</Text>
      </View>
      <View style={styles.headerActions}>
        <MusicButton />
        <View style={[styles.health, { borderColor: `${accent}55`, backgroundColor: `${accent}10` }]}><View style={[styles.statusDot, { backgroundColor: accent }]} /><Text style={[styles.healthText, { color: accent }]}>{health.toUpperCase()}</Text></View>
        <Pressable accessibilityRole="button" accessibilityLabel={expanded ? "Collapse company details" : "Expand company details"} accessibilityState={{ expanded }} onPress={() => { gameFeedback.trigger("toggleSwitch"); setExpanded((current) => !current); }} hitSlop={6} style={styles.rulesButton}><Text style={styles.rulesButtonText}>{expanded ? "LESS −" : "MORE +"}</Text></Pressable>
      </View>
    </View>
    {expanded && <View style={styles.metaRow}><Text style={styles.meta}>{summary.stage.toUpperCase()} · {levelId ? "AT INCIDENT START" : "LIVE SNAPSHOT"}</Text><Text style={styles.meta}>{visibleHistory.length} DECISIONS</Text></View>}

    <View style={styles.resources}>{(expanded ? resources : resources.slice(0, 3)).map((resource) => <View key={resource.kind} style={[styles.resource, { width: resourceWidth }]}>
      <View style={styles.resourceHeading}><ResourceIcon kind={resource.kind} color={resource.color} /><Text style={styles.statLabel}>{resource.label}</Text></View>
      <Text adjustsFontSizeToFit numberOfLines={1} accessibilityLabel={`${resource.label}: ${resource.value} ${resource.unit}`} style={[styles.resourceValue, { color: resource.color }]}>{resource.value}{resource.kind === "runway" && summary.runway !== null ? " mo" : ""}</Text>
      {expanded && <Text style={styles.unit}>{resource.unit}</Text>}
    </View>)}</View>

    <View style={styles.meters}>
      {[
        { label: "CTO CONFIDENCE", value: snapshotConfidence, color: colors.purple, limit: 20 },
        { label: "TRUST", value: snapshot.customerTrust, color: colors.blue, limit: 20 },
        { label: "RELIABILITY", value: snapshot.reliability, color: colors.mint, limit: 35 },
        { label: "OPS LOAD", value: snapshot.complexity, color: colors.orange, limit: 85, inverse: true },
      ].map((meter) => <View key={meter.label} style={{ width: meterWidth }}><HealthMeter {...meter} /></View>)}
    </View>

    {failed && <View accessibilityRole="alert" style={styles.failure}><Text style={styles.failureTitle}>RUN ENDED</Text><Text style={styles.failureText}>{failed}</Text><CampaignResetButton campaignId={activeCampaignId} campaignTitle={campaign?.title ?? "this campaign"} /></View>}
    {expanded && latest && !showHistory && <View style={styles.decision}>
      <View style={styles.decisionCopy}><Text style={styles.eyebrow}>LAST DECISION · MONTH {visibleHistory.length}</Text><Text style={styles.decisionTitle}>{latest.choiceLabel}</Text></View>
      <DecisionDeltas entry={latest} />
    </View>}
    {expanded && showHistory && visibleHistory.length > 0 && <View style={styles.history}>
      <Text style={styles.eyebrow}>DECISION LOG</Text>
      {visibleHistory.map((entry, index) => <View key={entry.levelId} style={styles.historyEntry}>
        <View style={styles.decision}><View style={styles.monthBadge}><Text style={styles.monthNumber}>{String(index + 1).padStart(2, "0")}</Text></View><View style={styles.decisionCopy}><Text style={styles.decisionTitle}>{entry.choiceLabel}</Text><Text style={styles.unit}>{formatMoney(entry.companyBefore.cash)} → {formatMoney(entry.companyAfter.cash)}</Text></View><DecisionDeltas entry={entry} /></View>
        {entry.failureReason && <Text style={styles.failureText}>{entry.failureReason}</Text>}
      </View>)}
    </View>}

    {expanded && <View style={styles.footer}><Text style={styles.footerLabel}>1 DECISION = 1 MONTH</Text><Pressable accessibilityRole="button" accessibilityState={{ expanded: showRules }} onPress={() => { gameFeedback.trigger("uiTap"); setShowRules((current) => !current); }} hitSlop={8} style={styles.rulesButton}><Text style={styles.rulesButtonText}>{showRules ? "HIDE RULES −" : "GAME RULES +"}</Text></Pressable></View>}
    {expanded && showRules && <View style={styles.rules}>
      {[
        ["CASH", "$0 ends the run"], ["CONFIDENCE / TRUST", "20 or lower ends the run"], ["RELIABILITY", "35 or lower ends the run"], ["OPERATIONS LOAD", "85 or higher ends the run"], ["OPERATING COSTS", "Charged with every decision"], ["NEW REVENUE", "Collected from next month"], ["NEXT INCIDENT", "No affordable choice ends the run"],
      ].map(([label, value]) => <View key={label} style={styles.ruleRow}><Text style={styles.statLabel}>{label}</Text><Text style={styles.ruleValue}>{value}</Text></View>)}
    </View>}
  </View>;
}

const styles = StyleSheet.create({
  card: { backgroundColor: "#0B182B", borderWidth: 1, borderColor: "#2B435E", borderRadius: 12, padding: 10, marginVertical: 10, overflow: "hidden" },
  heading: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 6, marginBottom: 8 },
  identity: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 7 },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 8 },
  back: { width: 28, height: 28, borderRadius: 7, backgroundColor: "#1B2940", alignItems: "center", justifyContent: "center" },
  backArrow: { color: colors.white, fontSize: 24, lineHeight: 26 },
  eyebrow: { color: colors.muted, fontSize: 8, fontWeight: "900", letterSpacing: 1 },
  title: { color: colors.white, fontSize: 15, fontWeight: "900", letterSpacing: -0.3 },
  health: { flexDirection: "row", alignItems: "center", gap: 5, borderWidth: 1, borderRadius: 5, paddingVertical: 4, paddingHorizontal: 6 },
  statusDot: { width: 4, height: 4, borderRadius: 2 },
  healthText: { fontSize: 8, fontWeight: "900", letterSpacing: 0.6 },
  metaRow: { flexDirection: "row", justifyContent: "space-between", flexWrap: "wrap", gap: 6, marginBottom: 8 },
  meta: { color: "#7E92AD", fontSize: 8, fontWeight: "800", letterSpacing: 0.5 },
  resources: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", rowGap: 6 },
  resource: { backgroundColor: "#101F33", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 6 },
  resourceHeading: { flexDirection: "row", alignItems: "center", gap: 5 },
  statLabel: { color: "#A2B3C9", fontSize: 8, fontWeight: "800", letterSpacing: 0.3, flexShrink: 1 },
  resourceValue: { fontSize: 17, lineHeight: 21, fontWeight: "900", letterSpacing: -0.4, marginTop: 3, fontVariant: ["tabular-nums"] },
  unit: { color: "#7B90AB", fontSize: 9, marginTop: 3 },
  meters: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", rowGap: 8, marginTop: 9 },
  meter: { paddingHorizontal: 3, paddingVertical: 2 },
  meterHeading: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 5 },
  score: { fontSize: 12, fontWeight: "900", fontVariant: ["tabular-nums"] },
  scoreMax: { color: "#6E839F", fontSize: 8, fontWeight: "700" },
  meterTrack: { height: 6, marginTop: 5 },
  segments: { flexDirection: "row", gap: 2, height: 4 },
  segment: { flex: 1, height: 4, backgroundColor: "#22334B", borderRadius: 1, overflow: "hidden" },
  limitMarker: { position: "absolute", top: -1, height: 6, width: 1, backgroundColor: "#F3A0AC" },
  decision: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 10, marginTop: 12 },
  decisionCopy: { flexGrow: 1, flexShrink: 1, minWidth: 140, gap: 4 },
  decisionTitle: { color: colors.text, fontSize: 12, fontWeight: "800" },
  deltas: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  deltaChip: { backgroundColor: "#13243A", borderRadius: 5, paddingHorizontal: 8, paddingVertical: 6, gap: 3 },
  deltaLabel: { color: "#879BB6", fontSize: 7, fontWeight: "800", letterSpacing: 0.5 },
  deltaValue: { fontSize: 12, fontWeight: "900", fontVariant: ["tabular-nums"] },
  failure: { padding: 10, marginTop: 10, borderRadius: 8, backgroundColor: "#2C1C2D", borderWidth: 1, borderColor: "#6A3549", gap: 8 },
  failureTitle: { color: colors.red, fontSize: 10, fontWeight: "900", letterSpacing: 1 },
  failureText: { color: "#F8B1BB", fontSize: 12, lineHeight: 18 },
  history: { marginTop: 14 },
  historyEntry: { borderBottomWidth: 1, borderBottomColor: "#23354C", paddingBottom: 10, gap: 8 },
  monthBadge: { width: 30, height: 32, alignItems: "center", justifyContent: "center", borderRadius: 6, backgroundColor: "#1B2B42" },
  monthNumber: { color: colors.muted, fontSize: 11, fontWeight: "900", fontVariant: ["tabular-nums"] },
  footer: { borderTopWidth: 1, borderTopColor: "#23354C", marginTop: 10, paddingTop: 6, flexDirection: "row", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 },
  footerLabel: { color: "#6F849F", fontSize: 7, fontWeight: "800", letterSpacing: 0.7 },
  rulesButton: { paddingVertical: 6, paddingHorizontal: 2 },
  rulesButtonText: { color: colors.blue, fontSize: 8, fontWeight: "800", letterSpacing: 0.5 },
  rules: { marginTop: 8, gap: 10, padding: 10, borderRadius: 8, backgroundColor: "#101F33" },
  ruleRow: { flexDirection: "row", justifyContent: "space-between", flexWrap: "wrap", gap: 5 },
  ruleValue: { color: colors.text, fontSize: 10 },
});
