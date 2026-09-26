import type { ReactNode } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, ViewStyle } from "react-native";
import { colors, radii, spacing } from "@/ui/theme";
import { gameFeedback } from "@/game/feedback/GameFeedbackManager";

interface ButtonProps {
  children?: ReactNode;
  onPress: () => void;
  variant?: "primary" | "secondary" | "ghost";
  disabled?: boolean;
  style?: ViewStyle;
  loading?: boolean;
}

export function Button({ children, onPress, variant = "primary", disabled, style, loading }: ButtonProps) {
  const handlePress = () => {
    if (disabled || loading) return;
    gameFeedback.trigger("uiTap");
    onPress();
  };

  return (
    <Pressable accessibilityRole="button" onPress={handlePress} disabled={disabled || loading} style={({ pressed }) => [styles.base, styles[variant], pressed && !disabled && styles.pressed, disabled && styles.disabled, style]}>
      {loading ? <ActivityIndicator color={variant === "primary" ? colors.ink : colors.mint} /> : <Text style={[styles.text, variant === "primary" ? styles.primaryText : styles.secondaryText]}>{children}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { minHeight: 52, paddingHorizontal: spacing.lg, borderRadius: radii.md, alignItems: "center", justifyContent: "center" },
  primary: { backgroundColor: colors.mint }, secondary: { backgroundColor: colors.panelRaised, borderWidth: 1, borderColor: colors.border }, ghost: { backgroundColor: "transparent" },
  text: { fontSize: 15, fontWeight: "800", letterSpacing: 0.1 }, primaryText: { color: colors.ink }, secondaryText: { color: colors.white },
  pressed: { opacity: 0.76, transform: [{ scale: 0.985 }] }, disabled: { opacity: 0.45 },
});
