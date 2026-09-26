import { StyleSheet, Text, View } from "react-native";
import { colors, spacing, typography } from "@/ui/theme";

export function SectionTitle({ title, meta }: { title: string; meta?: string }) { return <View style={styles.row}><Text style={styles.title}>{title}</Text>{meta && <Text style={styles.meta}>{meta}</Text>}</View>; }
const styles = StyleSheet.create({ row: { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", marginTop: spacing.lg, marginBottom: spacing.sm }, title: { color: colors.white, ...typography.heading }, meta: { color: colors.muted, fontSize: 11, fontWeight: "700" } });
