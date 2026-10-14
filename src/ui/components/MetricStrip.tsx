import { StyleSheet, Text, View } from "react-native";
import Animated, { FadeInUp, useReducedMotion } from "react-native-reanimated";
import Svg, { Circle, Ellipse, Path, Rect } from "react-native-svg";
import { IncidentMetric } from "@/domain/types";
import { colors } from "@/ui/theme";

const severityColor = { normal: colors.mint, warning: colors.yellow, critical: colors.red };

export function MetricStrip({ metrics }: { metrics: IncidentMetric[] }) {
  const reducedMotion = useReducedMotion();
  return <View style={styles.row}>{metrics.map((metric, index) => {
    const accent = severityColor[metric.severity];
    return <Animated.View entering={reducedMotion ? undefined : FadeInUp.delay(index * 45).duration(260)} key={metric.label} style={[styles.metric, { borderTopColor: accent }]}>
      <View style={styles.top}><View style={[styles.icon, { backgroundColor: `${accent}14`, borderColor: `${accent}45` }]}><MetricIcon label={metric.label} color={accent} /></View><Text numberOfLines={2} style={styles.label}>{metric.label}</Text></View>
      <Text style={[styles.value, { color: accent }]}>{metric.value}</Text>
      <Text style={[styles.status, { color: accent }]}>{metric.severity === "critical" ? "! CRITICAL" : metric.severity === "warning" ? "△ WATCH" : "● NORMAL"}</Text>
    </Animated.View>;
  })}</View>;
}

function MetricIcon({ label, color }: { label: string; color: string }) {
  const key = label.toLowerCase();
  const stroke = { stroke: color, strokeWidth: 1.7, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, fill: "none" };
  let icon;
  if (key.includes("user")) icon = <><Circle cx="8" cy="7" r="2.5" {...stroke} /><Path d="M3.5 17c.3-2.7 1.8-4.1 4.5-4.1s4.2 1.4 4.5 4.1M14 5.2a2.4 2.4 0 0 1 0 4.6M15 13c2 .4 3.1 1.7 3.4 4" {...stroke} /></>;
  else if (key.includes("engineer")) icon = <><Path d="m7.5 6-4.5 4 4.5 4M12.5 6l4.5 4-4.5 4M11.5 4l-3 12" {...stroke} /></>;
  else if (key.includes("deploy")) icon = <><Circle cx="10" cy="10" r="7.2" {...stroke} /><Path d="M10 5.7v4.8l3 1.7M7.7 2h4.6" {...stroke} /></>;
  else if (key.includes("cpu") || key.includes("db")) icon = <><Ellipse cx="10" cy="4.5" rx="6.6" ry="2.4" {...stroke} /><Path d="M3.4 4.5v10.8c0 1.3 3 2.4 6.6 2.4s6.6-1.1 6.6-2.4V4.5M3.4 10c0 1.3 3 2.4 6.6 2.4s6.6-1.1 6.6-2.4" {...stroke} /></>;
  else if (key.includes("p95") || key.includes("latency")) icon = <><Circle cx="10" cy="11" r="6.7" {...stroke} /><Path d="M10 11 13 8M8 1.8h4M10 2v2.3" {...stroke} /></>;
  else if (key.includes("error")) icon = <><Path d="M10 2 18.5 17H1.5L10 2Z" {...stroke} /><Path d="M10 7v5M10 14.7v.4" {...stroke} /></>;
  else icon = <><Rect x="3" y="3" width="14" height="14" rx="2" {...stroke} /><Path d="M6 13V9M10 13V6M14 13v-3" {...stroke} /></>;
  return <Svg width={16} height={16} viewBox="0 0 20 20">{icon}</Svg>;
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  metric: { flex: 1, minWidth: 125, backgroundColor: "#0D192A", borderWidth: 1, borderColor: "#263B55", borderTopWidth: 2, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 12 },
  status: { fontSize: 8, fontWeight: "800", letterSpacing: 0.7, marginTop: 10 },
  top: { flexDirection: "row", alignItems: "center", gap: 6, minHeight: 19 },
  icon: { width: 19, height: 19, borderRadius: 6, borderWidth: 1, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  label: { color: "#9AACC0", fontSize: 8, lineHeight: 10, fontWeight: "900", textTransform: "uppercase", letterSpacing: 0.45, flexShrink: 1 },
  value: { fontSize: 17, fontWeight: "900", marginTop: 5 },
});
