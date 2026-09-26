import { z } from "zod";
import { hapticIds, soundIds } from "@/game/feedback/feedbackTypes";

const feedbackSchema = z.object({
  sound: z.enum(soundIds).optional(),
  haptic: z.enum(hapticIds).optional(),
});

export const characterEmotionSchema = z.enum([
  "normal", "happy", "thinking", "concerned", "shocked", "panic", "celebrating", "disappointed", "defeated", "smug",
]);

const architectureNodeSchema = z.object({
  id: z.string(),
  type: z.enum([
    "client", "api", "monolith", "loadBalancer", "postgres", "mysql", "redis", "queue", "worker", "objectStorage", "search", "cdn", "kafka", "service", "readReplica", "region", "rateLimiter",
  ]),
  label: z.string(),
  state: z.enum(["normal", "overloaded", "failed", "warning", "newlyAdded"]).optional(),
  position: z.object({ x: z.number(), y: z.number() }),
  subtitle: z.string().optional(),
});

const architectureSchema = z.object({
  nodes: z.array(architectureNodeSchema),
  edges: z.array(z.object({ from: z.string(), to: z.string(), label: z.string().optional(), dashed: z.boolean().optional() })),
});

const effectsSchema = z.object({
  confidence: z.number().optional(), cash: z.number().optional(), monthlyRevenue: z.number().optional(), monthlyBurn: z.number().optional(), users: z.number().optional(), customerTrust: z.number().optional(), reliability: z.number().optional(), complexity: z.number().optional(), xp: z.number().optional(),
});

const choiceTradeoffSchema = z.object({
  upsideLabel: z.string().trim().min(3), downsideLabel: z.string().trim().min(3),
  upside: z.string().trim().min(20), downside: z.string().trim().min(20), jimmyExplanation: z.string().trim().min(20),
  effectReasons: z.object({ upfrontCost: z.string().optional(), monthlyBurn: z.string().optional(), reliability: z.string().optional(), customerTrust: z.string().optional(), complexity: z.string().optional() }),
});

const choiceSchema = z.object({
  id: z.string(), label: z.string(), description: z.string(), cost: z.number().nonnegative(), tone: z.enum(["recommended", "risky", "overkill", "neutral"]), effects: effectsSchema, tradeoff: choiceTradeoffSchema,
  requirements: z.array(z.object({ stat: z.enum(["cash", "users", "reliability", "complexity"]), min: z.number().optional(), max: z.number().optional() })).optional(),
  feedback: feedbackSchema.optional(),
  architectureChanges: z.array(z.union([
    z.object({ type: z.literal("addNode"), node: architectureNodeSchema, feedback: feedbackSchema.optional() }),
    z.object({ type: z.literal("updateNode"), nodeId: z.string(), patch: architectureNodeSchema.partial(), feedback: feedbackSchema.optional() }),
    z.object({ type: z.literal("addEdge"), edge: z.object({ from: z.string(), to: z.string(), label: z.string().optional(), dashed: z.boolean().optional() }), feedback: feedbackSchema.optional() }),
    z.object({ type: z.literal("removeEdge"), from: z.string(), to: z.string(), feedback: feedbackSchema.optional() }),
  ])).optional(),
  outcomeTitle: z.string(), outcomeDialogue: z.string(), outcomeEmotion: characterEmotionSchema, outcomeNote: z.string(),
});

export const levelSchema = z.object({
  id: z.string(), campaignId: z.string(), chapter: z.number().int().positive(), levelNumber: z.number().int().positive(), title: z.string(), kicker: z.string(), description: z.string(),
  dialogue: z.array(z.object({ character: z.literal("jimmy"), emotion: characterEmotionSchema, text: z.string() })),
  metrics: z.array(z.object({ label: z.string(), value: z.string(), severity: z.enum(["normal", "warning", "critical"]) })), incidentFeedback: feedbackSchema.optional(),
  architectureBefore: architectureSchema, choices: z.array(choiceSchema).min(2), hints: z.array(z.string()), xpReward: z.number().positive(), unlocks: z.array(z.string()), nextLevel: z.string().optional(), lesson: z.string(),
}).superRefine((level, context) => {
  const recommended = level.choices.filter((choice) => choice.tone === "recommended");
  if (recommended.length !== 1) context.addIssue({ code: "custom", path: ["choices"], message: "Each level needs exactly one recommended choice as its growth benchmark." });
  const ids = new Set<string>();
  level.choices.forEach((choice, index) => {
    const issue = (field: string, message: string) => context.addIssue({ code: "custom", path: ["choices", index, field], message });
    if (ids.has(choice.id)) issue("id", "Choice IDs must be unique within the level.");
    ids.add(choice.id);
    if (choice.effects.cash !== undefined && choice.effects.cash !== -choice.cost) issue("effects", "Use cost for upfront spending. If effects.cash is present, it must equal -cost; operating costs are automatic.");
    if (choice.tone !== "risky" && choice.tone !== "overkill") return;
    if (choice.effects.xp !== undefined && choice.effects.xp >= 0) issue("effects", "Bad choices must deduct XP; omit xp to use the default -20.");
    if (choice.effects.confidence !== undefined && choice.effects.confidence >= 0) issue("effects", "Bad choices must reduce confidence; omit confidence to use the default -25.");
    const benchmark = recommended[0];
    if (!benchmark) return;
    const users = choice.effects.users ?? 0;
    const revenue = choice.effects.monthlyRevenue ?? 0;
    const goodUsers = benchmark.effects.users ?? 0;
    const goodRevenue = benchmark.effects.monthlyRevenue ?? 0;
    if (users > goodUsers || revenue > goodRevenue || (users === goodUsers && revenue === goodRevenue)) {
      issue("effects", "Bad choices must have no better user/revenue growth than the recommended choice, and be strictly worse on at least one. Use slower growth or explicit customer/revenue loss.");
    }
  });
});

export function validateLevel(level: unknown) { return levelSchema.parse(level); }
