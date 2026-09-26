import type { ReactNode } from "react";
import { Platform, ScrollView, StyleSheet, View, ViewStyle } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "@/ui/theme";

interface ScreenProps {
  children?: ReactNode;
  scroll?: boolean;
  contentStyle?: ViewStyle;
}

export function Screen({ children, scroll = true, contentStyle }: ScreenProps) {
  const content = <View style={[styles.content, contentStyle]}>{children}</View>;
  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      {scroll ? <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>{content}</ScrollView> : content}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.ink },
  scrollContent: { flexGrow: 1 },
  content: { width: "100%", maxWidth: 1080, alignSelf: "center", paddingHorizontal: Platform.OS === "web" ? 28 : 18, paddingBottom: 36 },
});
