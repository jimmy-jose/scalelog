import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { colors, radii, spacing } from "@/ui/theme";
import { ScaleLogLogo } from "@/ui/components/ScaleLogLogo";

import { gameFeedback } from "@/game/feedback/GameFeedbackManager";
import { MusicButton } from "@/ui/components/MusicButton";

interface TopBarProps { eyebrow?: string; title?: string; back?: boolean; right?: ReactNode; musicControl?: boolean }

export function TopBar({ eyebrow = "SCALELOG", title, back = false, right, musicControl = true }: TopBarProps) {
  return (
    <View style={styles.row}>
      <View style={styles.left}>
        {back && <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={() => { gameFeedback.trigger("uiTap"); if (router.canGoBack()) router.back(); else router.replace("/campaigns"); }} style={styles.back}><Text style={styles.backText}>‹</Text></Pressable>}
        <ScaleLogLogo size={30} />
        <View>
          <Text style={styles.eyebrow}>{eyebrow}</Text>
          {title && <Text style={styles.title}>{title}</Text>}
        </View>
      </View>
      <View style={styles.actions}>{right}{musicControl && <MusicButton />}</View>
    </View>
  );
}

export function BrandMark() {
  return <View style={styles.brand}><ScaleLogLogo size={40} /><Text style={styles.brandWord}>ScaleLog</Text></View>;
}

const styles = StyleSheet.create({
  row: { minHeight: 58, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: 8, paddingBottom: spacing.md },
  actions: { flexDirection: "row", alignItems: "center", gap: 7 },
  left: { flexDirection: "row", alignItems: "center", gap: 10 },
  back: { width: 34, height: 34, borderRadius: radii.sm, backgroundColor: colors.panel, alignItems: "center", justifyContent: "center" },
  backText: { color: colors.white, fontSize: 28, lineHeight: 30, marginTop: -3 },
  eyebrow: { color: colors.mint, fontSize: 10, letterSpacing: 1.6, fontWeight: "800" },
  title: { color: colors.white, fontSize: 20, fontWeight: "800", marginTop: 2 },
  brand: { flexDirection: "row", alignItems: "center", gap: 10 },
  brandWord: { color: colors.white, fontSize: 16, fontWeight: "900", letterSpacing: -0.25 },
});
