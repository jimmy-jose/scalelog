import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { colors } from "@/ui/theme";
import { ScaleLogLogo } from "@/ui/components/ScaleLogLogo";

export default function SplashScreen() {
  useEffect(() => { const timer = setTimeout(() => router.replace("/campaigns"), 900); return () => clearTimeout(timer); }, []);
  return <LinearGradient colors={[colors.ink, colors.navy]} style={styles.container}><View style={styles.glow} /><ScaleLogLogo size={90} /><Text style={styles.wordmark}>ScaleLog</Text><Text style={styles.tagline}>ship smart. scale deliberately.</Text></LinearGradient>;
}

const styles = StyleSheet.create({ container: { flex: 1, alignItems: "center", justifyContent: "center" }, glow: { position: "absolute", width: 260, height: 260, borderRadius: 130, backgroundColor: colors.blue, opacity: 0.1, transform: [{ translateY: -80 }] }, wordmark: { color: colors.white, fontSize: 38, fontWeight: "800", letterSpacing: -1.8, marginTop: 20 }, tagline: { color: colors.muted, fontSize: 13, marginTop: 8, letterSpacing: 1.2 } });
