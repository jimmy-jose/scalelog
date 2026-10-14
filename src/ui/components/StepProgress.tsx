import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "@/ui/theme";
import { gameFeedback } from "@/game/feedback/GameFeedbackManager";
import { ProgressMeter } from "./ProgressMeter";

export function StepProgress({ labels, current, onBack }: { labels: string[]; current: number; onBack?: (index: number) => void }) {
  return <View style={styles.steps} accessibilityRole="tablist">
    {labels.map((label, index) => <Pressable
      key={label}
      accessibilityRole="tab"
      accessibilityLabel={`Step ${index + 1} of ${labels.length}: ${label}`}
      accessibilityState={{ selected: current === index, disabled: index >= current || !onBack }}
      disabled={index >= current || !onBack}
      onPress={() => { gameFeedback.trigger("tabSelect"); onBack?.(index); }}
      style={styles.step}
    >
      <ProgressMeter label={`${label} progress`} value={index < current ? 100 : index === current ? 45 : 0} />
      <View style={styles.stepHeading}>
        <View style={[styles.number, index === current && styles.activeNumber, index < current && styles.doneNumber]}><Text style={[styles.numberText, index <= current && styles.activeLabel]}>{index < current ? "✓" : index + 1}</Text></View>
        <Text style={[styles.label, index === current && styles.activeLabel]}>{label}</Text>
      </View>
    </Pressable>)}
  </View>;
}

const styles = StyleSheet.create({
  steps: { flexDirection: "row", gap: 10, marginTop: 4, marginBottom: 18 },
  step: { flex: 1, minHeight: 56 },
  stepHeading: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 10 },
  number: { width: 23, height: 23, borderRadius: 8, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center", backgroundColor: colors.panelSoft },
  activeNumber: { borderColor: "#549D8D", backgroundColor: "#173A38" },
  doneNumber: { borderColor: "#32534F", backgroundColor: "#102B2C" },
  numberText: { color: colors.muted, fontSize: 10, fontWeight: "900" },
  label: { flex: 1, color: colors.muted, fontSize: 11, lineHeight: 16, fontWeight: "700" },
  activeLabel: { color: colors.mint },
});
