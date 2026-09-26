import { StyleSheet, Text, View } from "react-native";
import { LevelDialogue } from "@/domain/types";
import { colors, radii, spacing, typography } from "@/ui/theme";
import { JimmyAvatar } from "./JimmyAvatar";

export function DialogueCard({ dialogue }: { dialogue: LevelDialogue[] }) {
  const current = dialogue[dialogue.length - 1];
  return (
    <View style={styles.card}>
      <View style={styles.avatarCol}><JimmyAvatar emotion={current.emotion} /></View>
      <View style={styles.copy}><View style={styles.nameRow}><Text style={styles.name}>JIMMY</Text><Text style={styles.role}>YOUR AI ASSISTANT</Text></View><Text style={styles.quote}>{current.text}</Text>{dialogue.length > 1 && <View style={styles.dots}>{dialogue.map((_, index) => <View key={index} style={[styles.dot, index === dialogue.length - 1 && styles.activeDot]} />)}</View>}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: "row", backgroundColor: colors.panel, borderRadius: radii.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.border, overflow: "hidden" },
  avatarCol: { width: 88, alignItems: "center", justifyContent: "center" },
  copy: { flex: 1, paddingLeft: 8, paddingTop: 5 }, nameRow: { flexDirection: "row", alignItems: "center", gap: 8 }, name: { color: colors.mint, fontWeight: "900", fontSize: 11, letterSpacing: 1.2 }, role: { color: colors.dim, fontWeight: "800", fontSize: 9, letterSpacing: 0.8 },
  quote: { color: colors.white, ...typography.heading, marginTop: 10, maxWidth: 520 }, dots: { flexDirection: "row", gap: 5, marginTop: 13 }, dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.border }, activeDot: { width: 18, backgroundColor: colors.mint },
});
