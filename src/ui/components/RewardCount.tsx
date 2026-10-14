import { useEffect, useState } from "react";
import { Text, type StyleProp, type TextStyle } from "react-native";
import { useReducedMotion } from "react-native-reanimated";

export function RewardCount({ value, style }: { value: number; style?: StyleProp<TextStyle> }) {
  const reducedMotion = useReducedMotion();
  const [display, setDisplay] = useState(reducedMotion ? value : 0);
  useEffect(() => {
    if (reducedMotion || value === 0) { setDisplay(value); return; }
    setDisplay(0);
    const started = Date.now();
    const timer = setInterval(() => {
      const fraction = Math.min(1, (Date.now() - started) / 700);
      setDisplay(Math.round(value * (1 - Math.pow(1 - fraction, 3))));
      if (fraction === 1) clearInterval(timer);
    }, 32);
    return () => clearInterval(timer);
  }, [value, reducedMotion]);
  return <Text accessibilityLabel={`${value >= 0 ? "+" : ""}${value} experience points`} style={[style, { fontVariant: ["tabular-nums"] }]}>{display >= 0 ? "+" : "−"}{Math.abs(display)} XP</Text>;
}
