import { StyleSheet, Text, View } from "react-native";
import { CAMPAIGN_SCORE_EXPLANATION, formatCampaignScore, isValidCampaignScore } from "@/domain/campaignScore";
import { colors, radii } from "@/ui/theme";

export function CampaignScore({ score, label = "Campaign score" }: { score?: number; label?: string }) {
  return <View style={styles.card}>
    <Text style={styles.label}>{label}</Text>
    <Text style={styles.value} accessibilityLabel={isValidCampaignScore(score) ? `${score.toFixed(1)} out of 10` : "Score unavailable"}>
      {isValidCampaignScore(score) ? formatCampaignScore(score) : "Not scored"}
    </Text>
    <Text style={styles.body}>{isValidCampaignScore(score) ? CAMPAIGN_SCORE_EXPLANATION : "This result has no recorded score. Complete a new run to earn a scored certificate."}</Text>
  </View>;
}

const styles = StyleSheet.create({
  card: { marginTop: 16, marginBottom: 16, padding: 20, gap: 8, borderRadius: radii.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.panelSoft },
  label: { color: colors.text, fontSize: 16, fontWeight: "600" },
  value: { color: colors.mint, fontSize: 32, lineHeight: 40, fontWeight: "700" },
  body: { color: colors.text, fontSize: 14, lineHeight: 22 },
});
