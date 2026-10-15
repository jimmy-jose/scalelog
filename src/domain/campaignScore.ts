import { getChoiceRewards } from "./simulation";
import type { Campaign, Choice, Level, OutcomeSnapshot } from "./types";

export const CAMPAIGN_SCORE_EXPLANATION = "Each scenario counts equally. Decisions earn up to 10 points in proportion to the highest XP reward for that scenario. Risky and overkill choices earn 0. Your final score is the average, rounded to one decimal place.";

export function isValidCampaignScore(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 10;
}

export function formatCampaignScore(score: number): string {
  return `${score.toFixed(1)} / 10`;
}

/** Use the resolved incident, including its variant, before recording the decision. */
export function getDecisionScore(level: Level, choice: Choice): number {
  const bestXp = Math.max(0, ...level.choices.map((item) => getChoiceRewards(item, level.xpReward).xp));
  if (bestXp === 0) return 0;
  return Math.max(0, Math.min(10, 10 * getChoiceRewards(choice, level.xpReward).xp / bestXp));
}

/** Missing or ambiguous history is unscored, never assumed to be a perfect run. */
export function calculateCampaignScore(
  campaign: Campaign,
  history: OutcomeSnapshot[],
  resolveHistoricalLevel: (levelId: string) => Level | undefined,
): number | undefined {
  if (!campaign.levelIds.length) return undefined;
  let total = 0;
  for (const id of campaign.levelIds) {
    const entries = history.filter((entry) => entry.levelId === id);
    if (entries.length !== 1 || entries[0].failureReason) return undefined;
    const entry = entries[0];
    let score = entry.decisionScore;
    if (score === undefined) {
      const level = resolveHistoricalLevel(id);
      const choice = level?.choices.find((item) => item.id === entry.choiceId);
      if (!level || !choice) return undefined;
      score = getDecisionScore(level, choice);
    }
    if (!isValidCampaignScore(score)) return undefined;
    total += score;
  }
  return Math.round(total / campaign.levelIds.length * 10) / 10;
}
