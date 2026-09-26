import { Level } from "@/domain/types";

export const level002: Level = {
  id: "startup-002", campaignId: "startup-cto", chapter: 1, levelNumber: 2,
  title: "The Dashboard Is Slow", kicker: "CHAPTER 01 · FIND THE BOTTLENECK",
  description: "Customers are staring at a loading spinner for four seconds. Your trace points to an orders query scanning hundreds of thousands of rows.",
  dialogue: [
    { character: "jimmy", emotion: "concerned", text: "{name}, the dashboard is slow enough for users to question their life choices." },
    { character: "jimmy", emotion: "thinking", text: "PostgreSQL is doing a full table scan for every orders view. We need a precise fix, not a shiny one." },
  ],
  metrics: [{ label: "DB CPU", value: "94%", severity: "critical" }, { label: "p95", value: "3.8s", severity: "warning" }, { label: "Errors", value: "11%", severity: "critical" }],
  incidentFeedback: { sound: "incidentCritical", haptic: "heavy" },
  architectureBefore: {
    nodes: [
      { id: "client", type: "client", label: "Web / Mobile", position: { x: 48, y: 92 }, subtitle: "18K users" },
      { id: "monolith", type: "monolith", label: "Monolith", position: { x: 190, y: 92 }, subtitle: "busy" },
      { id: "postgres", type: "postgres", label: "PostgreSQL", state: "overloaded", position: { x: 330, y: 92 }, subtitle: "94% CPU" },
    ], edges: [{ from: "client", to: "monolith" }, { from: "monolith", to: "postgres" }],
  },
  choices: [
    {
      id: "add-index", label: "Add an index", description: "Index the customer_id and created_at columns used by the orders query.", cost: 200, tone: "recommended",
      effects: { cash: -200, reliability: 8, customerTrust: 5, complexity: 1, users: 2000, monthlyRevenue: 1000, xp: 120, confidence: 10 },
      feedback: { sound: "choiceSuccess", haptic: "success" },
      tradeoff: {
        upsideLabel: "Faster order reads",
        downsideLabel: "Write & storage overhead",
        upside: "A targeted index turns the expensive full scan into a fast lookup for the orders view.",
        downside: "The index uses storage and adds a little work to writes; it must match the real query pattern.",
        jimmyExplanation: "This is a precise fix because the trace identified the columns the query filters and sorts by. Reads stop scanning every row, so the incident pressure falls. The trade is a small amount of index storage and write overhead—not a new service to keep warm.",
        effectReasons: {
          upfrontCost: "$200 covers a focused schema change and rollout, far less than buying a larger database tier.",
          reliability: "Fewer rows scanned means less CPU contention and fewer slow requests and timeouts on this hot path.",
          customerTrust: "The dashboard returns orders quickly instead of making customers wait or retry a failed request.",
          complexity: "One maintained index adds a small schema responsibility, but no new runtime component.",
        },
      },
      architectureChanges: [{ type: "updateNode", nodeId: "postgres", patch: { state: "normal", subtitle: "indexed" } }],
      outcomeTitle: "The query found its shortcut.", outcomeDialogue: "The index turns a table scan into a quick lookup. p95 drops below 400ms, the error graph goes quiet, and you still have almost all your cash.", outcomeEmotion: "happy", outcomeNote: "Measure the bottleneck, then remove exactly that bottleneck.",
    },
    {
      id: "add-redis", label: "Add Redis", description: "Cache the dashboard response and hope the hot path stays hot.", cost: 500, tone: "neutral",
      effects: { cash: -500, monthlyBurn: 150, reliability: 3, customerTrust: 2, complexity: 5, users: 300, monthlyRevenue: 150, xp: 35, confidence: 2 },
      feedback: { sound: "choiceWarning", haptic: "warning" },
      tradeoff: {
        upsideLabel: "Fast repeat reads",
        downsideLabel: "Stale data & cache misses",
        upside: "Repeated dashboard reads can return quickly while the cached response is still warm.",
        downside: "Cache misses still hit the slow query; stale data, invalidation, and $150 monthly spend become new concerns.",
        jimmyExplanation: "Redis can make popular dashboards feel faster, but it sits in front of the cause rather than removing it. A miss or expired entry sends the same full scan to PostgreSQL. You gain a fast common path and accept cache correctness plus another service to operate.",
        effectReasons: {
          upfrontCost: "$500 starts a separate cache path before we have measured how much repeated traffic it will absorb.",
          monthlyBurn: "The Redis instance and monitoring add $150 to the monthly bill, even when its cache is not helping.",
          reliability: "Warm hits reduce database work, but misses still trigger the full scan, so the improvement is partial.",
          customerTrust: "Frequently viewed dashboards load faster; cache expiry can still bring back the spinner unexpectedly.",
          complexity: "The team must define cache keys, expiry, invalidation, and behavior when Redis is unavailable.",
        },
      },
      architectureChanges: [
        { type: "addNode", node: { id: "redis", type: "redis", label: "Redis", state: "newlyAdded", position: { x: 190, y: 34 }, subtitle: "cache" }, feedback: { sound: "architectureNodeAdded", haptic: "medium" } },
        { type: "addEdge", edge: { from: "monolith", to: "redis", dashed: true } },
        { type: "updateNode", nodeId: "postgres", patch: { state: "warning", subtitle: "still scans" } },
      ],
      outcomeTitle: "A faster symptom.", outcomeDialogue: "Redis masks the slow query for popular dashboards, but cache misses still hammer PostgreSQL. The incident is quieter, not solved.", outcomeEmotion: "thinking", outcomeNote: "Caching is powerful. It is not a substitute for understanding your read path.",
    },
    {
      id: "upgrade-database", label: "Upgrade the database", description: "Move to a larger PostgreSQL instance and buy more headroom.", cost: 9000, tone: "risky",
      effects: { cash: -9000, monthlyBurn: 900, reliability: -6, customerTrust: -8, complexity: 8, users: -800, monthlyRevenue: -500, xp: -35, confidence: -25 },
      feedback: { sound: "choiceWarning", haptic: "warning" },
      tradeoff: {
        upsideLabel: "Immediate CPU headroom",
        downsideLabel: "Higher bill, same scan",
        upside: "More CPU and memory can reduce saturation immediately and buy time for a measured fix.",
        downside: "The same query still scans every row, while the larger instance costs $900 more each month.",
        jimmyExplanation: "More headroom can help when the database is short on capacity. Here, the trace shows an inefficient query plan, so a larger machine mainly delays the next saturation point. You buy breathing room, not a durable fix.",
        effectReasons: {
          upfrontCost: "$9,000 is the one-time migration and provisioning effort for the larger database tier.",
          monthlyBurn: "The larger managed instance raises recurring infrastructure spend by $900 per month.",
          reliability: "The initial relief wears off during the month. The unindexed scan saturates the larger instance and recurring incidents reduce reliability.",
          customerTrust: "Customers initially see shorter waits, then the same slowdown returns. Some leave and recurring revenue falls.",
          complexity: "The unresolved query still demands incident response, now alongside a larger database and higher costs to manage.",
        },
      },
      architectureChanges: [{ type: "updateNode", nodeId: "postgres", patch: { state: "warning", subtitle: "larger box" } }],
      outcomeTitle: "More horsepower, same route.", outcomeDialogue: "The bigger instance buys you time, but the query still scans everything. You paid to delay the same problem and gained a much larger cloud bill.", outcomeEmotion: "concerned", outcomeNote: "Scaling up can be right when capacity is the bottleneck. Here, the query plan was.",
    },
  ],
  hints: ["The database is not slow in the abstract. Which operation is expensive?", "A cache hit can hide a bad query until the day it matters most."], xpReward: 120, unlocks: ["startup-003"], nextLevel: "startup-003", lesson: "Diagnose the hot path before adding infrastructure.",
};
