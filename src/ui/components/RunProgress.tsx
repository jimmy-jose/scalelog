import { StyleSheet, Text, View } from "react-native";
import { campaigns } from "@/campaigns";
import { useGameStore } from "@/store/gameStore";
import { ProgressMeter } from "./ProgressMeter";
import { colors } from "@/ui/theme";

export function RunProgress() {
  const xp = useGameStore((state) => state.player.ctoXp);
  const campaignId = useGameStore((state) => state.activeCampaignId);
  const completed = useGameStore((state) => state.progress.completedLevels);
  const campaign = campaigns.find((item) => item.id === campaignId);
  const total = campaign?.levelIds.length ?? 0;
  const count = campaign?.levelIds.filter((id) => completed.includes(id)).length ?? 0;
  return <View style={styles.hud}>
    <View style={styles.badge}><Text style={styles.symbol}>✦</Text></View>
    <View style={styles.experience}><Text style={styles.label}>CTO EXPERIENCE</Text><Text style={styles.xp}>{xp.toLocaleString()} <Text style={styles.unit}>XP</Text></Text></View>
    <View style={styles.journey}>
      <View style={styles.row}><Text style={styles.label}>CAMPAIGN</Text><Text style={styles.count}>{count} / {total}</Text></View>
      <ProgressMeter value={count} max={total} label="Incidents completed" />
    </View>
  </View>;
}

const styles = StyleSheet.create({
  hud: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 14 },
  badge: { width: 38, height: 38, borderRadius: 12, backgroundColor: "#2A2630", borderWidth: 1, borderColor: "#65543C", alignItems: "center", justifyContent: "center" },
  symbol: { fontSize: 22, color: colors.yellow },
  experience: { flex: 1 },
  label: { color: colors.muted, fontSize: 9, fontWeight: "800", letterSpacing: 0.8 },
  xp: { color: colors.white, fontSize: 20, fontWeight: "900", fontVariant: ["tabular-nums"], marginTop: 2 },
  unit: { color: colors.yellow, fontSize: 10 },
  journey: { flex: 1, maxWidth: 240, gap: 8 },
  row: { flexDirection: "row", justifyContent: "space-between", gap: 8 },
  count: { color: colors.mint, fontSize: 10, fontWeight: "800", fontVariant: ["tabular-nums"] },
});
