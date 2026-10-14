import { useState, type ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { gameFeedback } from "@/game/feedback/GameFeedbackManager";
import { colors } from "@/ui/theme";

/** Optional context is unmounted until requested, including for screen readers. */
export function LearnMore({ label, children }: { label: string; children: ReactNode }) {
  const [expanded, setExpanded] = useState(false);
  return <View style={styles.section}>
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ expanded }}
      aria-expanded={expanded}
      onPress={() => { gameFeedback.trigger("uiTap"); setExpanded((current) => !current); }}
      style={({ pressed }) => [styles.toggle, pressed && styles.pressed]}
    >
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.symbol} aria-hidden accessibilityElementsHidden importantForAccessibility="no-hide-descendants">{expanded ? "−" : "+"}</Text>
    </Pressable>
    {expanded && <View style={styles.content}>{children}</View>}
  </View>;
}

const styles = StyleSheet.create({
  section: { marginTop: 8 },
  toggle: { minHeight: 44, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12, paddingVertical: 10 },
  pressed: { opacity: 0.7 },
  label: { color: colors.blue, fontSize: 12, lineHeight: 18, fontWeight: "700", flex: 1 },
  symbol: { color: colors.blue, fontSize: 20 },
  content: { gap: 10, paddingBottom: 10 },
});
