import type { PropsWithChildren } from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors, radii } from "@/ui/theme";

export function Pill({ children, color = colors.blue }: PropsWithChildren<{ color?: string }>) {
  return <View style={[styles.wrap, { backgroundColor: `${color}18`, borderColor: `${color}42` }]}><View style={[styles.dot, { backgroundColor: color }]} /><Text style={[styles.text, { color }]}>{children}</Text></View>;
}

const styles = StyleSheet.create({ wrap: { alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 6, borderRadius: radii.pill, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 6 }, dot: { width: 5, height: 5, borderRadius: 3 }, text: { fontSize: 10, fontWeight: "800", letterSpacing: 0.6, textTransform: "uppercase" } });
