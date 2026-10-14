import { StyleSheet, Text, View } from "react-native";
import { colors } from "@/ui/theme";
import { ProgressMeter } from "./ProgressMeter";

export function StatBar({ label, value, max = 100, color = colors.mint }: { label: string; value: number; max?: number; color?: string }) {
  return <View style={styles.wrap}><View style={styles.row}><Text style={styles.label}>{label}</Text><Text style={[styles.value, { color }]}>{Math.round(value)}</Text></View><ProgressMeter label={label} value={value} max={max} color={color} /></View>;
}

const styles = StyleSheet.create({ wrap: { marginBottom: 15 }, row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 7 }, label: { color: colors.muted, fontSize: 12, fontWeight: "700" }, value: { fontSize: 12, fontWeight: "900" } });
