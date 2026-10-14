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
  capabilities: z.array(z.string().min(1)).optional(),
  nodes: z.array(architectureNodeSchema),
  edges: z.array(z.object({ from: z.string(), to: z.string(), label: z.string().optional(), dashed: z.boolean().optional() })),
});

const effectsSchema = z.object({
  engineers: z.number().int().optional(),
  confidence: z.number().finite().optional(), cash: z.number().finite().optional(), monthlyRevenue: z.number().finite().optional(), monthlyBurn: z.number().finite().optional(), users: z.number().finite().optional(), customerTrust: z.number().finite().optional(), reliability: z.number().finite().optional(), complexity: z.number().finite().optional(), xp: z.number().finite().optional(),
});

const choiceTradeoffSchema = z.object({
  upsideLabel: z.string().trim().min(3), downsideLabel: z.string().trim().min(3),
  upside: z.string().trim().min(20), downside: z.string().trim().min(20),
  byteExplanation: z.string().trim().min(20).optional(),
  jimmyExplanation: z.string().trim().min(20).optional(),
  effectReasons: z.object({ upfrontCost: z.string().optional(), monthlyBurn: z.string().optional(), reliability: z.string().optional(), customerTrust: z.string().optional(), complexity: z.string().optional() }),
}).superRefine((data, ctx) => {
  if (!data.byteExplanation && !data.jimmyExplanation) {
    ctx.addIssue({
      code: "custom",
      path: ["byteExplanation"],
      message: "byteExplanation is required and must be at least 20 characters.",
    });
  }
}).transform((data) => ({
  ...data,
  byteExplanation: (data.byteExplanation ?? data.jimmyExplanation) as string,
}));

const architectureChangesSchema = z.array(z.union([
    z.object({ type: z.literal("setCapability"), capability: z.string().min(1), enabled: z.boolean(), feedback: feedbackSchema.optional() }),
    z.object({ type: z.literal("addNode"), node: architectureNodeSchema, feedback: feedbackSchema.optional() }),
    z.object({ type: z.literal("updateNode"), nodeId: z.string(), patch: architectureNodeSchema.partial(), feedback: feedbackSchema.optional() }),
    z.object({ type: z.literal("addEdge"), ifNodesExist: z.boolean().optional(), edge: z.object({ from: z.string(), to: z.string(), label: z.string().optional(), dashed: z.boolean().optional() }), feedback: feedbackSchema.optional() }),
    z.object({ type: z.literal("removeEdge"), from: z.string(), to: z.string(), feedback: feedbackSchema.optional() }),
   ]));


const choiceSchema = z.object({
  id: z.string(), label: z.string(), description: z.string(), cost: z.number().finite().nonnegative(), tone: z.enum(["recommended", "risky", "overkill", "neutral"]), effects: effectsSchema, tradeoff: choiceTradeoffSchema,
  requirements: z.array(z.object({ stat: z.enum(["cash", "users", "reliability", "complexity"]), min: z.number().finite().optional(), max: z.number().finite().optional() })).optional(),
  feedback: feedbackSchema.optional(),
  architectureChanges: architectureChangesSchema.optional(),
  outcomeTitle: z.string(), outcomeDialogue: z.string(), outcomeEmotion: characterEmotionSchema, outcomeNote: z.string(),
});

const variantSchema = z.object({
  id: z.string().min(1),
  when: z.object({ missingAny: z.array(z.string().min(1)).min(1).optional(), hasAny: z.array(z.string().min(1)).min(1).optional(), hasAll: z.array(z.string().min(1)).min(1).optional() }),
  description: z.string().min(1),
  metrics: z.array(z.object({ label: z.string(), value: z.string(), severity: z.enum(["normal", "warning", "critical"]) })),
  dialogue: z.array(z.object({ character: z.enum(["byte", "jimmy"]), emotion: characterEmotionSchema, text: z.string() })).min(1),
  choices: z.array(choiceSchema).min(2).optional(),
});

export const levelSchema = z.object({
  variants: z.array(variantSchema).optional(),
  recoveries: z.array(z.object({
    capability: z.string().min(1), choiceIds: z.array(z.string()).min(1), description: z.string().min(1),
    cost: z.number().finite().nonnegative(), monthlyBurn: z.number().finite().nonnegative(), complexity: z.number().finite(),
    architectureChanges: architectureChangesSchema,
  })).optional(),
  id: z.string(), campaignId: z.string(), chapter: z.number().int().positive(), levelNumber: z.number().int().positive(), title: z.string(), kicker: z.string(), description: z.string(),
  dialogue: z.array(z.object({ character: z.enum(["byte", "jimmy"]), emotion: characterEmotionSchema, text: z.string() })).min(1),
  metrics: z.array(z.object({ label: z.string(), value: z.string(), severity: z.enum(["normal", "warning", "critical"]) })), incidentFeedback: feedbackSchema.optional(),
  architectureBefore: architectureSchema, choices: z.array(choiceSchema).min(2), hints: z.array(z.string()), xpReward: z.number().positive(), unlocks: z.array(z.string()), nextLevel: z.string().optional(), lesson: z.string(),
}).superRefine((level, context) => {
  const recoveryCapabilities = new Set<string>();
  for (const recovery of level.recoveries ?? []) {
    if (recoveryCapabilities.has(recovery.capability)) context.addIssue({ code: "custom", message: "A prerequisite cannot be charged twice in one level." });
    recoveryCapabilities.add(recovery.capability);
    if (recovery.choiceIds.some(id => !level.choices.some(choice => choice.id === id))) context.addIssue({ code: "custom", message: "Recovery references an unknown choice." });
    const grant = recovery.architectureChanges.filter(change => change.type === "setCapability" && change.capability === recovery.capability).at(-1);
    if (!grant || grant.type !== "setCapability" || !grant.enabled) context.addIssue({ code: "custom", message: "A paid recovery must establish its declared capability." });
  }
  const variantIds = new Set<string>();
  for (const variant of level.variants ?? []) {
    if (variantIds.has(variant.id)) context.addIssue({ code: "custom", message: "Variant IDs must be unique within the level." });
    variantIds.add(variant.id);
    if (variant.choices && (variant.choices.length !== level.choices.length || variant.choices.some(choice => !level.choices.some(base => base.id === choice.id)))) context.addIssue({ code: "custom", message: "Variants must preserve published choice IDs." });
  }
  for (const choices of [level.choices, ...(level.variants ?? []).flatMap(variant => variant.choices ? [variant.choices] : [])]) {
    const recommended = choices.filter((choice) => choice.tone === "recommended");
    if (recommended.length !== 1) context.addIssue({ code: "custom", path: ["choices"], message: "Each level needs exactly one recommended choice as its growth benchmark." });
    const ids = new Set<string>();
    choices.forEach((choice, index) => {
      const issue = (field: string, message: string) => context.addIssue({ code: "custom", path: ["choices", index, field], message });
      if (ids.has(choice.id)) issue("id", "Choice IDs must be unique within the level.");
      ids.add(choice.id);
      if (choice.requirements?.some(({ min, max }) => min !== undefined && max !== undefined && min > max)) issue("requirements", "A requirement minimum cannot exceed its maximum.");
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
  }
});

export function validateLevel(level: unknown) { return levelSchema.parse(level); }
