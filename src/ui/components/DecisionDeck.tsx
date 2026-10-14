import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import Animated, { FadeInDown, useReducedMotion } from "react-native-reanimated";
import type { CampaignCompanyState, Choice } from "@/domain/types";
import { formatMoney } from "@/lib/format";
import { ChoiceCard } from "@/ui/components/ChoiceCard";
import { colors } from "@/ui/theme";
import { gameFeedback } from "@/game/feedback/GameFeedbackManager";
import { getChoiceBlockReason } from "@/domain/simulation";

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
  loggedChoiceId?: string;
  onChoose: (choice: Choice) => void;
}

export function DecisionDeck({ choices, xpReward, company, playerName, completed, loggedChoiceId, onChoose }: DecisionDeckProps) {
  const { width } = useWindowDimensions();
  const reducedMotion = useReducedMotion();
  const [orderedChoices, setOrderedChoices] = useState<Choice[] | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  useEffect(() => {
    const ordered = shuffleChoices(choices);
    setOrderedChoices(ordered);
    setSelectedIndex(completed ? Math.max(0, ordered.findIndex((choice) => choice.id === loggedChoiceId)) : 0);
  }, [choices, completed, loggedChoiceId]);
  const selected = orderedChoices?.[selectedIndex];
  if (!orderedChoices || !selected) return null;
  const loggedChoice = completed ? choices.find((choice) => choice.id === loggedChoiceId) : undefined;
  const isLoggedChoice = completed && selected.id === loggedChoiceId;
  const blockedReason = getChoiceBlockReason(company, selected);
  const cashAfterMonth = company.cash - selected.cost + company.monthlyRevenue - (company.monthlyBurn + (selected.effects.monthlyBurn ?? 0));

  return (
    <View style={styles.deck}>
      <View style={styles.headingRow}>
        <View style={styles.headingCopy}>
          <Text style={styles.kicker}>YOUR DECISION</Text>
          <Text style={styles.heading}>{completed ? "Review your decision" : playerName.trim() ? `Your call, ${playerName.trim()}` : "Your call, CTO"}</Text>
          <Text style={styles.subheading}>{completed ? loggedChoice ? `You logged: ${loggedChoice.label}. Explore any option below.` : "Your decision is saved. Explore the available options below." : "Pick an option to preview before committing."}</Text>
        </View>
        <Text style={styles.count}>{String(selectedIndex + 1).padStart(2, "0")} / {String(choices.length).padStart(2, "0")}</Text>
      </View>

      <View style={[styles.hand, width < 480 && styles.handStack]} accessibilityRole="tablist">
        {orderedChoices.map((choice, index) => {
          const active = index === selectedIndex;
          const logged = completed && choice.id === loggedChoiceId;
          return (
            <Pressable
              key={choice.id}
              accessibilityRole="tab"
              accessibilityLabel={`Option ${index + 1}: ${choice.label}${logged ? ", your logged choice" : completed ? ", not chosen" : ""}`}
              accessibilityHint={completed ? "Show this option’s details. Your logged decision will not change." : "Show this option’s details without committing"}
              accessibilityState={{ selected: active }}
              onPress={() => {
                if (!active) gameFeedback.trigger("tabSelect");
                setSelectedIndex(index);
              }}
              style={({ pressed }) => [styles.handCard, width < 480 && styles.handCardCompact, active && styles.handCardActive, pressed && styles.handCardPressed]}
            >
              <Text style={[styles.handNumber, active && styles.handNumberActive]}>{active ? "◆" : String(index + 1).padStart(2, "0")}</Text>
              <View style={[styles.handCopy, width < 480 && styles.compactTitle]}>
                <Text style={[styles.handTitle, active && styles.handTitleActive]}>{choice.label}</Text>
                {logged && <Text style={styles.loggedBadge}>LOGGED</Text>}
              </View>
              <Text style={[styles.handCost, company.cash < choice.cost && styles.unaffordable]}>{company.cash < choice.cost ? "OVER BUDGET" : choice.cost === 0 ? "NO COST" : `${formatMoney(choice.cost)}`}</Text>
            </Pressable>
          );
        })}
      </View>

      <Animated.View key={selected.id} entering={reducedMotion ? undefined : FadeInDown.duration(190)} style={styles.focusedCard}>
        {completed && <Text style={[styles.reviewStatus, isLoggedChoice && styles.loggedStatus]}>{isLoggedChoice ? "YOUR LOGGED CHOICE" : "ALTERNATIVE · NOT CHOSEN"}</Text>}
        <ChoiceCard
          choice={selected}
          xpReward={xpReward}
          index={selectedIndex}
          forecast={`Cash after this month: ${formatMoney(Math.max(0, cashAfterMonth))}.${cashAfterMonth <= 0 ? " This will end your run." : ""}`}
          cashExhausted={cashAfterMonth <= 0}
          disabled={completed || Boolean(blockedReason)}
          disabledLabel={completed ? isLoggedChoice ? "YOUR LOGGED CHOICE" : "REVIEW ONLY · NOT CHOSEN" : blockedReason}
          onPress={() => onChoose(selected)}
        />
      </Animated.View>
      {completed && <Text style={styles.footer}>REVIEW ONLY · YOUR LOGGED DECISION WILL NOT CHANGE</Text>}

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
  handStack: { flexDirection: "column" },
  handCardCompact: { flexDirection: "row", alignItems: "center", minHeight: 60, flex: 0, gap: 10 },
  compactTitle: { flex: 1 },
  unaffordable: { color: colors.orange },
  handCard: { flex: 1, minWidth: 0, minHeight: 100, gap: 7, paddingHorizontal: 9, paddingVertical: 10, borderRadius: 11, borderWidth: 1, borderColor: "#2B3E57", backgroundColor: "#111E30", justifyContent: "space-between" },
  handCardActive: { borderColor: colors.mint, backgroundColor: "#153039" },
  handNumberActive: { color: colors.mint },
  handTitleActive: { color: colors.white },
  handCardPressed: { opacity: 0.75 },
  handNumber: { color: "#657B95", fontSize: 9, fontWeight: "900", letterSpacing: 0.8 },
  handTitle: { color: "#BCC8D8", fontSize: 12, lineHeight: 17, fontWeight: "800" },
  handCopy: { minWidth: 0, gap: 6 },
  loggedBadge: { alignSelf: "flex-start", color: colors.mint, backgroundColor: colors.panelRaised, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 3, fontSize: 10, lineHeight: 14, fontWeight: "900", letterSpacing: 0.5 },
  handCost: { color: "#9BAFC7", fontSize: 9, lineHeight: 13, fontWeight: "800", letterSpacing: 0.2 },
  focusedCard: { marginTop: 13 },
  reviewStatus: { color: colors.text, fontSize: 11, lineHeight: 16, fontWeight: "900", letterSpacing: 0.65, marginBottom: 8 },
  loggedStatus: { color: colors.mint },
  footer: { color: colors.text, fontSize: 9, lineHeight: 14, fontWeight: "800", letterSpacing: 0.65, textAlign: "center", marginTop: 2 },
});
