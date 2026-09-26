import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import type { CampaignCompanyState, Choice } from "@/domain/types";
import { formatMoney } from "@/lib/format";
import { ChoiceCard } from "@/ui/components/ChoiceCard";
import { colors } from "@/ui/theme";
import { gameFeedback } from "@/game/feedback/GameFeedbackManager";

function shuffleChoices(choices: Choice[]) {
  const shuffled = [...choices];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const otherIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[otherIndex]] = [shuffled[otherIndex], shuffled[index]];
  }
  return shuffled;
}

interface DecisionDeckProps {
  choices: Choice[];
  xpReward: number;
  company: CampaignCompanyState;
  playerName: string;
  completed: boolean;
  onChoose: (choice: Choice) => void;
}

export function DecisionDeck({ choices, xpReward, company, playerName, completed, onChoose }: DecisionDeckProps) {
  const [orderedChoices, setOrderedChoices] = useState<Choice[] | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  useEffect(() => {
    setOrderedChoices(shuffleChoices(choices));
    setSelectedIndex(0);
  }, [choices]);
  const selected = orderedChoices?.[selectedIndex] ?? orderedChoices?.[0];
  if (!orderedChoices || !selected) return null;
  const cashAfterMonth = company.cash - selected.cost + company.monthlyRevenue - (company.monthlyBurn + (selected.effects.monthlyBurn ?? 0));

  return (
    <View style={styles.deck}>
      <View style={styles.headingRow}>
        <View style={styles.headingCopy}>
          <Text style={styles.kicker}>YOUR DECISION</Text>
          <Text style={styles.heading}>{playerName.trim() ? `Your call, ${playerName.trim()}` : "Your call, CTO"}</Text>
          <Text style={styles.subheading}>Inspect each response, then choose one.</Text>
        </View>
        <Text style={styles.count}>{String(selectedIndex + 1).padStart(2, "0")} / {String(choices.length).padStart(2, "0")}</Text>
      </View>

      <View style={styles.hand} accessibilityRole="tablist">
        {orderedChoices.map((choice, index) => {
          const active = index === selectedIndex;
          return (
            <Pressable
              key={choice.id}
              accessibilityRole="tab"
              accessibilityLabel={`Option ${index + 1}: ${choice.label}`}
              accessibilityHint="Show this option's details without choosing it"
              accessibilityState={{ selected: active }}
              onPress={() => {
                if (!active) gameFeedback.trigger("tabSelect");
                setSelectedIndex(index);
              }}
              style={({ pressed }) => [styles.handCard, active && styles.handCardActive, pressed && styles.handCardPressed]}
            >
              <Text style={[styles.handNumber, active && styles.handNumberActive]}>{String(index + 1).padStart(2, "0")}</Text>
              <Text numberOfLines={2} style={[styles.handTitle, active && styles.handTitleActive]}>{choice.label}</Text>
              <Text style={styles.handCost}>{choice.cost === 0 ? "NO UPFRONT COST" : `$${choice.cost.toLocaleString()} UPFRONT`}</Text>
            </Pressable>
          );
        })}
      </View>

      <Animated.View key={selected.id} entering={FadeInDown.duration(190)} style={styles.focusedCard}>
        <ChoiceCard
          choice={selected}
          xpReward={xpReward}
          index={selectedIndex}
          disabled={completed || company.cash < selected.cost}
          disabledLabel={completed ? "DECISION ALREADY LOGGED" : undefined}
          onPress={() => onChoose(selected)}
        />
      </Animated.View>
      <Text style={[styles.forecast, cashAfterMonth <= 0 && { color: colors.red }]}>
        After upfront cost and one operating month: {formatMoney(Math.max(0, cashAfterMonth))} cash.
        {cashAfterMonth <= 0 ? " This choice will exhaust your cash and end the run." : " New revenue starts next month."}
      </Text>
      <Text style={styles.footer}>SELECTING A CARD ONLY SHOWS ITS DETAILS</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  deck: { minWidth: 0, backgroundColor: "#0A1728", borderWidth: 1, borderColor: "#2C415C", borderRadius: 18, padding: 14 },
  headingRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 10, marginBottom: 14 },
  headingCopy: { flex: 1, minWidth: 0 },
  kicker: { color: colors.mint, fontSize: 8, fontWeight: "900", letterSpacing: 1.3 },
  heading: { color: colors.white, fontSize: 22, lineHeight: 26, fontWeight: "900", letterSpacing: -0.55, marginTop: 4 },
  subheading: { color: "#92A4BA", fontSize: 10, lineHeight: 14, marginTop: 4 },
  count: { color: "#A1B3C9", fontSize: 10, fontWeight: "900", letterSpacing: 1, marginTop: 3 },
  hand: { flexDirection: "row", gap: 7, alignItems: "stretch" },
  handCard: { flex: 1, minWidth: 0, minHeight: 100, paddingHorizontal: 9, paddingVertical: 9, borderRadius: 11, borderWidth: 1, borderColor: "#2B3E57", backgroundColor: "#111E30", justifyContent: "space-between" },
  handCardActive: { borderColor: "#70B9BA", backgroundColor: "#153039", transform: [{ translateY: -3 }] },
  handCardPressed: { opacity: 0.75 },
  handNumber: { color: "#657B95", fontSize: 9, fontWeight: "900", letterSpacing: 0.8 },
  handNumberActive: { color: colors.mint },
  handTitle: { color: "#BCC8D8", fontSize: 10, lineHeight: 13, fontWeight: "800" },
  handTitleActive: { color: colors.white },
  handCost: { color: "#7F93AA", fontSize: 7, lineHeight: 10, fontWeight: "800", letterSpacing: 0.2 },
  focusedCard: { marginTop: 13 },
  footer: { color: "#657B95", fontSize: 7, fontWeight: "800", letterSpacing: 0.65, textAlign: "center", marginTop: 2 },
  forecast: { color: colors.muted, fontSize: 11, lineHeight: 17, marginVertical: 10 },
});
