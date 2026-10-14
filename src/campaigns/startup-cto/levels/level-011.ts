import { defineStartupLevel, changesFor } from "./authoring";

export const level011 = defineStartupLevel({
  "levelNumber": 11,
  "title": "Capacity Arrives Too Late",
  "description": "Promotions now start on a known schedule. App CPU rises before new hosts finish booting, even though PostgreSQL has spare capacity. A load test has established the request budget per instance.",
  "dialogue": [
    {
      "character": "jimmy",
      "emotion": "thinking",
      "text": "A host that takes four minutes to start cannot catch a forty-second ramp. We know the promotion time and the tested capacity per host."
    }
  ],
  "metrics": [
    {
      "label": "App CPU at kickoff",
      "value": "97%",
      "severity": "critical"
    },
    {
      "label": "Ready time / spike ramp",
      "value": "4 min / 40 s",
      "severity": "critical"
    },
    {
      "label": "DB CPU / pool wait",
      "value": "51% / 8 ms",
      "severity": "normal"
    },
    {
      "label": "Per-instance safe load",
      "value": "80 RPS at target p95",
      "severity": "normal"
    }
  ],
  "choices": [
    {
      "id": "011-measured",
      "label": "Prewarm a bounded app fleet",
      "description": "Schedule minimum capacity ahead of campaigns; autoscale on saturation and queueing with readiness checks, scale-in draining and an aggregate DB connection budget.",
      "cost": 3200,
      "tone": "recommended",
      "effects": {
        "users": 50000,
        "monthlyRevenue": 18000,
        "monthlyBurn": 3000,
        "engineers": 0,
        "reliability": 3,
        "customerTrust": 2,
        "complexity": 1,
        "xp": 160,
        "confidence": 8
      },
      "tradeoff": {
        "upsideLabel": "Targeted improvement",
        "downsideLabel": "Cost and ownership",
        "upside": "Capacity is ready before the known ramp and remains bounded by downstream limits.",
        "downside": "Warm headroom costs money while idle; load tests must be kept current.",
        "jimmyExplanation": "Capacity is ready before the known ramp and remains bounded by downstream limits. Warm headroom costs money while idle; load tests must be kept current.",
        "effectReasons": {
          "upfrontCost": "$3,200 funds this rollout, verification and migration effort.",
          "monthlyBurn": "The monthly change is $+3,000, including 0 hires and the operating costs of this response.",
          "reliability": "Warm headroom costs money while idle; load tests must be kept current.",
          "customerTrust": "Merchant retention follows the response’s stated service contract and remaining risk.",
          "complexity": "Operational load includes the rollout, ownership and ongoing failure modes described here."
        }
      },
      "architectureChanges": changesFor("app-fleet", "portable-sessions", "durable-media", "bounded-autoscale", "capacity-budget"),
      "outcomeTitle": "Capacity is ready before kickoff.",
      "outcomeDialogue": "Capacity is ready before the known ramp and remains bounded by downstream limits. Warm headroom costs money while idle; load tests must be kept current.",
      "outcomeEmotion": "happy",
      "outcomeNote": "Autoscaling needs lead time, bounded downstream budgets and evidence from load tests. Next pressure: A fleet that survives CPU bursts can still synchronize cache misses."
    },
    {
      "id": "011-bounded",
      "label": "Keep peak capacity running all month",
      "description": "Provision a fixed fleet sized from the load test and retain it between events.",
      "cost": 1440,
      "tone": "neutral",
      "effects": {
        "users": 35000,
        "monthlyRevenue": 12600,
        "monthlyBurn": 4200,
        "engineers": 0,
        "reliability": 1,
        "customerTrust": 1,
        "complexity": 0,
        "xp": 80,
        "confidence": 3
      },
      "tradeoff": {
        "upsideLabel": "Smaller contract",
        "downsideLabel": "Limits accepted",
        "upside": "Simple operations and immediate capacity are technically sound.",
        "downside": "Most of the monthly capacity sits idle; cash funds predictable peaks inefficiently.",
        "jimmyExplanation": "Simple operations and immediate capacity are technically sound. Most of the monthly capacity sits idle; cash funds predictable peaks inefficiently.",
        "effectReasons": {
          "upfrontCost": "$1,440 funds this rollout, verification and migration effort.",
          "monthlyBurn": "The monthly change is $+4,200, including 0 hires and the operating costs of this response.",
          "reliability": "Most of the monthly capacity sits idle; cash funds predictable peaks inefficiently.",
          "customerTrust": "Merchant retention follows the response’s stated service contract and remaining risk.",
          "complexity": "Operational load includes the rollout, ownership and ongoing failure modes described here."
        }
      },
      "architectureChanges": changesFor("app-fleet", "portable-sessions", "durable-media", "fixed-capacity", "capacity-budget"),
      "outcomeTitle": "A narrower contract, deliberately.",
      "outcomeDialogue": "Simple operations and immediate capacity are technically sound. Most of the monthly capacity sits idle; cash funds predictable peaks inefficiently.",
      "outcomeEmotion": "thinking",
      "outcomeNote": "Autoscaling needs lead time, bounded downstream budgets and evidence from load tests. Next pressure: A fleet that survives CPU bursts can still synchronize cache misses."
    },
    {
      "id": "011-shortcut",
      "label": "Scale on CPU with no upper bound",
      "description": "Launch hosts only after CPU crosses 95%, without a shared DB connection budget.",
      "cost": 2080,
      "tone": "risky",
      "effects": {
        "users": 15000,
        "monthlyRevenue": 5400,
        "monthlyBurn": 3450,
        "engineers": 0,
        "reliability": -9,
        "customerTrust": -7,
        "complexity": 7,
        "xp": -30,
        "confidence": -12
      },
      "tradeoff": {
        "upsideLabel": "Immediate relief",
        "downsideLabel": "Unresolved risk",
        "upside": "Scaling follows observed application utilization.",
        "downside": "Boot delay misses the burst and the enlarged fleet can overwhelm downstream resources.",
        "jimmyExplanation": "Scaling follows observed application utilization. Boot delay misses the burst and the enlarged fleet can overwhelm downstream resources.",
        "effectReasons": {
          "upfrontCost": "$2,080 funds this rollout, verification and migration effort.",
          "monthlyBurn": "The monthly change is $+3,450, including 0 hires and the operating costs of this response.",
          "reliability": "Boot delay misses the burst and the enlarged fleet can overwhelm downstream resources.",
          "customerTrust": "Merchant retention follows the response’s stated service contract and remaining risk.",
          "complexity": "Operational load includes the rollout, ownership and ongoing failure modes described here."
        }
      },
      "architectureChanges": changesFor("unbounded-autoscale"),
      "outcomeTitle": "The trade-off catches up.",
      "outcomeDialogue": "Scaling follows observed application utilization. Boot delay misses the burst and the enlarged fleet can overwhelm downstream resources.",
      "outcomeEmotion": "concerned",
      "outcomeNote": "Autoscaling needs lead time, bounded downstream budgets and evidence from load tests. The retained risk remains part of your company’s architecture."
    }
  ],
  "hints": [
    "Reactive capacity arrives later than the burst, and unconstrained scale-out could exhaust the database pool.",
    "Autoscaling needs lead time, bounded downstream budgets and evidence from load tests."
  ],
  "lesson": "Autoscaling needs lead time, bounded downstream budgets and evidence from load tests.",
  "recoveries": [
    {
      "capability": "portable-sessions",
      "choiceIds": [
        "011-measured",
        "011-bounded"
      ],
      "description": "Externalize local sessions before adding disposable hosts.",
      "cost": 1000,
      "monthlyBurn": 400,
      "complexity": 1,
      "architectureChanges": changesFor("portable-sessions", "session-store")
    },
    {
      "capability": "durable-media",
      "choiceIds": [
        "011-measured",
        "011-bounded"
      ],
      "description": "Move local-only uploads to durable object storage before scaling hosts.",
      "cost": 1800,
      "monthlyBurn": 500,
      "complexity": 1,
      "architectureChanges": changesFor("durable-media", "object-media")
    }
  ]
});
