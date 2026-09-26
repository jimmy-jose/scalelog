import { StyleSheet, Text, View } from "react-native";
import { colors, radii } from "@/ui/theme";

export function StatBar({ label, value, max = 100, color = colors.mint }: { label: string; value: number; max?: number; color?: string }) {
  const percent = Math.min(100, Math.max(0, (value / max) * 100));
  return <View style={styles.wrap}><View style={styles.row}><Text style={styles.label}>{label}</Text><Text style={[styles.value, { color }]}>{Math.round(value)}</Text></View><View style={styles.rail}><View style={[styles.fill, { width: `${percent}%`, backgroundColor: color }]} /></View></View>;
}

const styles = StyleSheet.create({ wrap: { marginBottom: 15 }, row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 7 }, label: { color: colors.muted, fontSize: 12, fontWeight: "700" }, value: { fontSize: 12, fontWeight: "900" }, rail: { height: 6, borderRadius: radii.pill, backgroundColor: colors.panelSoft, overflow: "hidden" }, fill: { height: 6, borderRadius: radii.pill } });
