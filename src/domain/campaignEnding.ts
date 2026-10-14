import type { ArchitectureGraph, CampaignCompanyState } from "./types";

/** Describe saved decisions; never substitute a fixed ideal architecture. */
export function getCampaignEnding(architecture: ArchitectureGraph, company: CampaignCompanyState, required: readonly string[], hazards: readonly string[] = []) {
  const capabilities = architecture.capabilities ?? [];
  const gaps = [...required.filter((capability) => !capabilities.includes(capability)), ...hazards.filter((capability) => capabilities.includes(capability)).map((capability) => `repair ${capability}`)];
  const qualified = capabilities.includes("launch-qualified") && !gaps.length;
  return {
    title: qualified ? "A launch backed by evidence." : "A company with an honest operating boundary.",
    summary: qualified
      ? `Cartline’s modeled rehearsal qualifies the 4M-user planning envelope: 3,000 peak origin RPS, checkout p95 500 ms / p99 1.5 s, 99.9% monthly availability, and regional RPO 60 s / RTO 15 min. Your company has ${company.users.toLocaleString()} registered users; these targets apply to the rehearsed load and failure envelope. Regional promotion pauses if the data-loss bound cannot be established, even when that delays recovery.`
      : "Cartline completes the campaign with a constrained launch. The premium workload and recovery forecast is not qualified by this route. Retain the actual components below, publish the smaller contract, and address the recorded gaps before expanding.",
    capabilities: capabilities.map((capability) => capability.replace(/-/g, " ")),
    gaps: gaps.map((capability) => capability.replace(/-/g, " ")),
    qualified,
  };
}
