import type { FeedbackSpec } from "@/game/feedback/feedbackTypes";

export type CharacterEmotion =
  | "normal"
  | "happy"
  | "thinking"
  | "concerned"
  | "shocked"
  | "panic"
  | "celebrating"
  | "disappointed"
  | "defeated"
  | "smug";

export type ArchitectureNodeType =
  | "client"
  | "api"
  | "monolith"
  | "loadBalancer"
  | "postgres"
  | "mysql"
  | "redis"
  | "queue"
  | "worker"
  | "objectStorage"
  | "search"
  | "cdn"
  | "kafka"
  | "service"
  | "readReplica"
  | "region"
  | "rateLimiter";

export type ArchitectureNodeState = "normal" | "overloaded" | "failed" | "warning" | "newlyAdded";
export type Severity = "normal" | "warning" | "critical";

export interface ArchitectureNode {
  id: string;
  type: ArchitectureNodeType;
  label: string;
  state?: ArchitectureNodeState;
  position: { x: number; y: number };
  subtitle?: string;
}

export interface ArchitectureEdge { from: string; to: string; label?: string; dashed?: boolean }
export interface ArchitectureGraph { nodes: ArchitectureNode[]; edges: ArchitectureEdge[]; capabilities?: string[] }
export interface IncidentMetric { label: string; value: string; severity: Severity }
export interface LevelDialogue { character: "jimmy" | "byte"; emotion: CharacterEmotion; text: string }

export interface StatEffects {
  engineers?: number;
  cash?: number;
  monthlyRevenue?: number;
  monthlyBurn?: number;
  users?: number;
  customerTrust?: number;
  reliability?: number;
  complexity?: number;
  xp?: number;
  confidence?: number;
}

export interface ChoiceRequirement {
  stat: "cash" | "users" | "reliability" | "complexity";
  min?: number;
  max?: number;
}

export type ChoiceEffectKey = "upfrontCost" | "monthlyBurn" | "reliability" | "customerTrust" | "complexity";

export interface ChoiceTradeoff {
  upsideLabel: string;
  downsideLabel: string;
  upside: string;
  downside: string;
  jimmyExplanation: string;
  byteExplanation?: string;
  effectReasons: Partial<Record<ChoiceEffectKey, string>>;
}

export interface Choice {
  id: string;
  label: string;
  description: string;
  cost: number;
  tone: "recommended" | "risky" | "overkill" | "neutral";
  effects: StatEffects;
  feedback?: FeedbackSpec;
  tradeoff: ChoiceTradeoff;
  requirements?: ChoiceRequirement[];
  architectureChanges?: ArchitectureChange[];
  outcomeTitle: string;
  outcomeDialogue: string;
  outcomeEmotion: CharacterEmotion;
  outcomeNote: string;
}

export type ArchitectureChange =
  | { type: "setCapability"; capability: string; enabled: boolean; feedback?: FeedbackSpec }
  | { type: "addNode"; node: ArchitectureNode; feedback?: FeedbackSpec }
  | { type: "updateNode"; nodeId: string; patch: Partial<ArchitectureNode>; feedback?: FeedbackSpec }
  | { type: "addEdge"; edge: ArchitectureEdge; ifNodesExist?: boolean; feedback?: FeedbackSpec }
  | { type: "removeEdge"; from: string; to: string; feedback?: FeedbackSpec };

/** First matching variant replaces the incident presentation, optionally its responses. */
export interface IncidentVariant {
  id: string;
  when: { missingAny?: string[]; hasAny?: string[]; hasAll?: string[] };
  description: string;
  metrics: IncidentMetric[];
  dialogue: LevelDialogue[];
  choices?: Choice[];
}

/** Explicitly priced prerequisite repair, attached only to responses that need it. */
export interface ArchitectureRecovery {
  capability: string;
  choiceIds: string[];
  description: string;
  cost: number;
  monthlyBurn: number;
  complexity: number;
  architectureChanges: ArchitectureChange[];
}

export interface Level {
  variants?: IncidentVariant[];
  recoveries?: ArchitectureRecovery[];
  id: string;
  campaignId: string;
  chapter: number;
  levelNumber: number;
  title: string;
  kicker: string;
  description: string;
  dialogue: LevelDialogue[];
  metrics: IncidentMetric[];
  incidentFeedback?: FeedbackSpec;
  architectureBefore: ArchitectureGraph;
  choices: Choice[];
  hints: string[];
  xpReward: number;
  unlocks: string[];
  nextLevel?: string;
  lesson: string;
}

export interface CampaignCompanyState {
  cash: number;
  monthlyRevenue: number;
  monthlyBurn: number;
  users: number;
  engineers: number;
  customerTrust: number;
  reliability: number;
  complexity: number;
}

export interface CampaignStory {
  companyName: string;
  product: string;
  situation: string;
  objective: string;
  startingCompany: CampaignCompanyState;
}

export interface Campaign {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  accent: string;
  levelIds: string[];
  totalLevels: number;
  story: CampaignStory;
}

export interface Award { id: string; title: string; description: string; requirement: string; unlocked: boolean }

export interface OutcomeSnapshot {
  incidentArchitectureBefore?: ArchitectureGraph;
  architectureBefore?: ArchitectureGraph;
  architectureAfter?: ArchitectureGraph;
  incidentDescription?: string;
  levelId: string;
  choiceId: string;
  choiceLabel: string;
  choiceCost?: number;
  title: string;
  dialogue: string;
  emotion: CharacterEmotion;
  note: string;
  lesson: string;
  xpEarned: number;
  nextLevel?: string;
  companyBefore: CampaignCompanyState;
  companyAfter: CampaignCompanyState;
  confidenceBefore: number;
  confidenceAfter: number;
  operatingCashFlow: number;
  failureReason?: string;
}
