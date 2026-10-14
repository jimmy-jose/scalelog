import { type ReactNode, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, ViewStyle } from "react-native";
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from "react-native-reanimated";
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

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function Button({ children, onPress, variant = "primary", disabled, style, loading }: ButtonProps) {
  const [highlighted, setHighlighted] = useState(false);
  const [focused, setFocused] = useState(false);
  const reducedMotion = useReducedMotion();
  const scale = useSharedValue(1);
  const motion = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const blocked = Boolean(disabled || loading);
  const press = (down: boolean) => { scale.value = withTiming(down && !blocked && !reducedMotion ? 0.975 : 1, { duration: 120 }); };
  const handlePress = () => {
    if (disabled || loading) return;
    gameFeedback.trigger("uiTap");
    onPress();
  };

  return (
    <AnimatedPressable accessibilityRole="button" accessibilityState={{ disabled: blocked, busy: Boolean(loading) }} onPress={handlePress} disabled={blocked}
      onPressIn={() => press(true)} onPressOut={() => press(false)}
      onHoverIn={() => setHighlighted(true)} onHoverOut={() => setHighlighted(false)} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
      style={[styles.base, styles[variant], highlighted && !blocked && styles.highlighted, focused && styles.focused, blocked && styles.disabled, style, motion]}>
      {loading ? <ActivityIndicator color={variant === "primary" ? colors.ink : colors.mint} /> : <Text style={[styles.text, variant === "primary" ? styles.primaryText : styles.secondaryText]}>{children}</Text>}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  base: { minHeight: 52, paddingHorizontal: spacing.lg, borderRadius: radii.md, alignItems: "center", justifyContent: "center" },
  primary: { backgroundColor: colors.mint, borderWidth: 1, borderColor: "#ADFFE7", borderBottomWidth: 3, borderBottomColor: "#3A9C86" }, secondary: { backgroundColor: colors.panelRaised, borderWidth: 1, borderColor: colors.border, borderBottomWidth: 3 }, ghost: { backgroundColor: "transparent" },
  text: { fontSize: 15, fontWeight: "800", letterSpacing: 0.1, textAlign: "center" }, primaryText: { color: colors.ink }, secondaryText: { color: colors.white },
  highlighted: { opacity: 0.88 }, focused: { borderWidth: 2, borderColor: colors.blue }, disabled: { opacity: 0.45 },
});
