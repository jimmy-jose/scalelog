import { useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { useGameStore } from "@/store/gameStore";
import { colors, radii, spacing } from "@/ui/theme";
import { gameFeedback } from "@/game/feedback/GameFeedbackManager";

export function CampaignResetButton({ campaignId, campaignTitle }: { campaignId: string; campaignTitle: string }) {
  const [confirming, setConfirming] = useState(false);
  const resetCampaign = useGameStore((state) => state.resetCampaign);

  const confirmReset = () => {
    gameFeedback.trigger("uiTap");
    resetCampaign(campaignId);
    setConfirming(false);
  };

  return <>
    <Pressable accessibilityRole="button" accessibilityLabel={`Reset ${campaignTitle} campaign`} onPress={() => { gameFeedback.trigger("uiTap"); setConfirming(true); }} style={({ pressed }) => [styles.trigger, pressed && styles.triggerPressed]}>
      <Svg width={14} height={14} viewBox="0 0 16 16" fill="none"><Path d="M13 5.5A5.5 5.5 0 1 0 13.3 9M13 2v3.5H9.5" stroke={colors.red} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" /></Svg>
      <Text style={styles.triggerText}>RESET</Text>
    </Pressable>

    <Modal transparent visible={confirming} animationType="fade" onRequestClose={() => setConfirming(false)}>
      <View style={styles.modalRoot}>
        <Pressable accessibilityRole="button" accessibilityLabel="Cancel reset" onPress={() => { gameFeedback.trigger("uiTap"); setConfirming(false); }} style={StyleSheet.absoluteFill} />
        <View accessibilityViewIsModal style={styles.dialog}>
          <View style={styles.dialogIcon}><Svg width={20} height={20} viewBox="0 0 16 16" fill="none"><Path d="M13 5.5A5.5 5.5 0 1 0 13.3 9M13 2v3.5H9.5" stroke={colors.red} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" /></Svg></View>
          <Text accessibilityRole="header" style={styles.dialogTitle}>Reset {campaignTitle}?</Text>
          <Text style={styles.dialogCopy}>This clears this campaign’s company, decisions, and level progress. Other campaigns will not be affected.</Text>
          <View style={styles.dialogActions}>
            <Pressable accessibilityRole="button" onPress={() => { gameFeedback.trigger("uiTap"); setConfirming(false); }} style={({ pressed }) => [styles.cancelButton, pressed && styles.buttonPressed]}><Text style={styles.cancelText}>Keep progress</Text></Pressable>
            <Pressable accessibilityRole="button" onPress={confirmReset} style={({ pressed }) => [styles.resetButton, pressed && styles.buttonPressed]}><Text style={styles.resetText}>Reset campaign</Text></Pressable>
          </View>
        </View>
      </View>
    </Modal>
  </>;
}

const styles = StyleSheet.create({
  trigger: { minHeight: 32, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingHorizontal: 9, borderRadius: 9, borderWidth: 1, borderColor: "#563C4A", backgroundColor: "#211C29" },
  triggerPressed: { backgroundColor: "#30202C" },
  triggerText: { color: colors.red, fontSize: 8, fontWeight: "900", letterSpacing: 0.8 },
  modalRoot: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.lg, backgroundColor: "rgba(2,8,18,0.78)" },
  dialog: { width: "100%", maxWidth: 390, padding: spacing.lg, borderRadius: radii.lg, borderWidth: 1, borderColor: "#3A4558", backgroundColor: "#111D30", shadowColor: "#000", shadowOpacity: 0.32, shadowRadius: 24, shadowOffset: { width: 0, height: 14 }, elevation: 12 },
  dialogIcon: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: "#2B202B", borderWidth: 1, borderColor: "#553645" },
  dialogTitle: { color: colors.white, fontSize: 18, fontWeight: "800", marginTop: 15 },
  dialogCopy: { color: "#A2B0C3", fontSize: 12, lineHeight: 18, marginTop: 8 },
  dialogActions: { flexDirection: "row", justifyContent: "flex-end", gap: 9, marginTop: 22 },
  cancelButton: { minHeight: 42, alignItems: "center", justifyContent: "center", paddingHorizontal: 13, borderRadius: 10, backgroundColor: "#18263A", borderWidth: 1, borderColor: "#30435B" },
  cancelText: { color: "#D3DCE8", fontSize: 11, fontWeight: "800" },
  resetButton: { minHeight: 42, alignItems: "center", justifyContent: "center", paddingHorizontal: 13, borderRadius: 10, backgroundColor: "#873D50" },
  resetText: { color: "#FFF7F9", fontSize: 11, fontWeight: "800" },
  buttonPressed: { opacity: 0.78 },
});
