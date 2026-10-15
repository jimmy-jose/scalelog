import { formatCampaignScore, isValidCampaignScore } from "@/domain/campaignScore";
import { StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import Svg, { Circle, Path } from "react-native-svg";
import { useGameStore } from "@/store/gameStore";
import { CERTIFICATE_CAMPAIGN_ID } from "@/domain/certificates";
import { Button } from "@/ui/components/Button";
import { colors, radii } from "@/ui/theme";

export function CertificateReward() {
  const certificate = useGameStore((state) => state.certificates[CERTIFICATE_CAMPAIGN_ID]);
  if (!certificate) return null;
  return <View style={styles.card}>
    <View style={styles.heading}>
      <Svg width={40} height={40} viewBox="0 0 40 40" accessible={false}>
        <Circle cx={20} cy={20} r={17} fill="none" stroke={colors.yellow} strokeWidth={1.5} />
        <Path d="m12 20 5 5 11-12" fill="none" stroke={colors.yellow} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
      <View style={styles.copy}><Text style={styles.kicker}>EARNED · FREE CERTIFICATE</Text><Text style={styles.title}>Your decisions deserve to be shared.</Text></View>
    </View>
    <Text style={styles.description}>You completed Startup CTO. Put your name on your certificate and share your milestone on LinkedIn.</Text>
    {isValidCampaignScore(certificate.score) && <Text style={styles.description}>Certificate score: {formatCampaignScore(certificate.score)}. Your certificate preserves the first scored completion, including after replays.</Text>}
    <Button variant="secondary" onPress={() => router.push("/certificate")}>View your certificate</Button>
  </View>;
}

const styles = StyleSheet.create({
  card: { marginTop: 20, padding: 20, gap: 16, backgroundColor: colors.panelSoft, borderWidth: 1, borderColor: colors.yellow, borderRadius: radii.md },
  heading: { flexDirection: "row", alignItems: "center", gap: 12 },
  copy: { flex: 1 },
  kicker: { color: colors.yellow, fontSize: 11, fontWeight: "700", letterSpacing: 1 },
  title: { color: colors.white, fontSize: 20, lineHeight: 26, fontWeight: "700", marginTop: 6 },
  description: { color: colors.text, fontSize: 14, lineHeight: 22 },
});
