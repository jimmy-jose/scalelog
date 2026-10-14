import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, { cancelAnimation, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from "react-native-reanimated";
import { colors } from "@/ui/theme";

/** Short, finite motion: progress always settles and never delays interaction. */
export function ProgressMeter({ value, max = 100, color = colors.mint, label }: { value: number; max?: number; color?: string; label: string }) {
  const fraction = max > 0 ? Math.max(0, Math.min(1, value / max)) : 0;
  const reducedMotion = useReducedMotion();
  const progress = useSharedValue(fraction);
  useEffect(() => {
    progress.value = withTiming(fraction, { duration: reducedMotion ? 0 : 420 });
    return () => cancelAnimation(progress);
  }, [fraction, progress, reducedMotion]);
  const fill = useAnimatedStyle(() => ({ width: `${progress.value * 100}%` }));
  return <View accessibilityRole="progressbar" accessibilityLabel={label} accessibilityValue={{ min: 0, max, now: fraction * max }} style={styles.track}>
    <Animated.View style={[styles.fill, { backgroundColor: color }, fill]} />
  </View>;
}

const styles = StyleSheet.create({
  track: { height: 5, borderRadius: 4, backgroundColor: "#24374D", overflow: "hidden" },
  fill: { height: "100%", borderRadius: 4 },
});
