import type { CampaignCompanyState, Choice, Level } from "./types";

const clampScore = (value: number) => Math.max(0, Math.min(100, value));

export function getChoiceRewards(choice: Choice, xpReward: number) {
  const badChoice = choice.tone === "risky" || choice.tone === "overkill";
  return {
    xp: badChoice ? Math.min(-1, choice.effects.xp ?? -20) : choice.effects.xp ?? xpReward,
    confidence: badChoice ? Math.min(-1, choice.effects.confidence ?? -25) : choice.effects.confidence ?? 8,
  };
}

export function getRunway(company: CampaignCompanyState): number | null {
  const netBurn = company.monthlyBurn - company.monthlyRevenue;
  return netBurn > 0 ? company.cash / netBurn : null;
}

export function getFailureReason(company: CampaignCompanyState, confidence: number): string | undefined {
  if (company.cash <= 0) return "Cash exhausted. The company cannot fund another month of operations.";
  if (confidence <= 20) return "The board has lost confidence in your leadership and removed you as CTO.";
  if (company.customerTrust <= 20) return "Customer trust has collapsed. The company can no longer retain its customers.";
  if (company.reliability <= 35) return "Repeated outages have made the product unusable. Operations are shutting down.";
  if (company.complexity >= 85) return "Operations have overwhelmed the engineering team. The company cannot ship or recover safely.";
  return undefined;
}

/** One decision advances one operating month. New revenue starts next month. */
export function resolveDecision(company: CampaignCompanyState, ctoXp: number, confidence: number, level: Level, choice: Choice) {
  const next = { ...company };
  for (const key of ["monthlyRevenue", "monthlyBurn", "users", "customerTrust", "reliability", "complexity"] as const) {
    next[key] = Math.max(0, next[key] + (choice.effects[key] ?? 0));
  }
  for (const key of ["customerTrust", "reliability", "complexity"] as const) next[key] = clampScore(next[key]);
  // Cost is authoritative; legacy effects.cash already contains the same cost.
  const operatingCashFlow = company.monthlyRevenue - next.monthlyBurn;
  next.cash = Math.max(0, company.cash - choice.cost + operatingCashFlow);
  const rewards = getChoiceRewards(choice, level.xpReward);
  const nextXp = Math.max(0, ctoXp + rewards.xp);
  const nextConfidence = clampScore(confidence + rewards.confidence);
  return {
    company: next, ctoXp: nextXp, confidence: nextConfidence,
    xpEarned: nextXp - ctoXp, operatingCashFlow,
    failureReason: getFailureReason(next, nextConfidence),
  };
}

export function getCompanySummary(company: CampaignCompanyState, confidence: number, decisions: number) {
  const runway = getRunway(company);
  const failureReason = getFailureReason(company, confidence);
  const concerns: string[] = [];
  if (runway !== null && runway < 3) concerns.push(`Only ${runway.toFixed(1)} months of runway remain.`);
  if (confidence < 55) concerns.push("The board needs evidence that you can turn things around.");
  if (company.customerTrust < 60) concerns.push("Customers are losing confidence in the product.");
  if (company.reliability < 70) concerns.push("Reliability is putting customer retention at risk.");
  if (company.complexity >= 40) concerns.push("Operational work is crowding out product development.");
  const critical = (runway !== null && runway < 1) || confidence <= 35 || company.customerTrust <= 35 || company.reliability <= 50 || company.complexity >= 70;
  const health = failureReason ? "Failed" : critical ? "Critical" : concerns.length ? "Under pressure" : "Stable";
  const stage = decisions === 0 ? "Beta" : company.users < 5000 ? "Finding traction" : company.users < 20000 ? "Early growth" : "Scaling";
  return { health, stage, runway, failureReason, narrative: failureReason ?? (concerns.length ? concerns.join(" ") : "The company is operating steadily. Keep growth, reliability, and spending in balance.") };
}
