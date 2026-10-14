import { type ReactNode, useEffect, useRef } from "react";
import { Platform, ScrollView, StyleSheet, View, ViewStyle } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { colors } from "@/ui/theme";

interface ScreenProps {
  children?: ReactNode;
  scroll?: boolean;
  resetKey?: string | number;
  contentStyle?: ViewStyle;
}

export function Screen({ children, scroll = true, contentStyle, resetKey }: ScreenProps) {
  const scrollRef = useRef<ScrollView>(null);
  useEffect(() => { scrollRef.current?.scrollTo({ y: 0, animated: false }); }, [resetKey]);
  const content = <View style={[styles.content, contentStyle]}>{children}</View>;
  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <LinearGradient pointerEvents="none" colors={["#102239", colors.ink, colors.ink]} locations={[0, 0.55, 1]} start={{ x: 1, y: 0 }} end={{ x: 0, y: 1 }} style={StyleSheet.absoluteFill} />
      {scroll ? <ScrollView ref={scrollRef} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>{content}</ScrollView> : content}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.ink },
  scrollContent: { flexGrow: 1 },
  content: { width: "100%", maxWidth: 1080, alignSelf: "center", paddingHorizontal: Platform.OS === "web" ? 28 : 18, paddingBottom: 36 },
});
