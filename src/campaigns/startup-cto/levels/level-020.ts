import { defineStartupLevel, changesFor, disable } from "./authoring";

export const level020 = defineStartupLevel({
  "levelNumber": 20,
  "title": "The Order That Disappeared",
  "description": "The mobile launch routes a post-checkout order lookup to a lagging replica despite the primary-only confirmation policy. The order appears seconds later, and some buyers retry.",
  "dialogue": [
    {
      "character": "jimmy",
      "emotion": "thinking",
      "text": "The order is there. We asked a reader that has not seen it yet. A one-second sleep is not proof that replication has caught up."
    }
  ],
  "metrics": [
    {
      "label": "Replay lag p95 / p99",
      "value": "1.8 s / 4.2 s",
      "severity": "critical"
    },
    {
      "label": "Post-checkout lookup",
      "value": "reader route",
      "severity": "warning"
    },
    {
      "label": "Primary commit failures",
      "value": "0%",
      "severity": "normal"
    }
  ],
  "choices": [
    {
      "id": "020-measured",
      "label": "Route critical reads by consistency need",
      "description": "Keep checkout confirmations and immediate order lookups on the primary; use a commit token for subsequent replica reads with a bounded wait and controlled primary fallback.",
      "cost": 8000,
      "tone": "recommended",
      "effects": {
        "users": 150000,
        "monthlyRevenue": 55000,
        "monthlyBurn": 5500,
        "engineers": 0,
        "reliability": 3,
        "customerTrust": 2,
        "complexity": -1,
        "xp": 200,
        "confidence": 8
      },
      "tradeoff": {
        "upsideLabel": "Targeted improvement",
        "downsideLabel": "Cost and ownership",
        "upside": "Read-after-write works without forcing every report to be synchronous.",
        "downside": "Primary fallback requires a budget; routing rules must follow the user journey.",
        "jimmyExplanation": "Read-after-write works without forcing every report to be synchronous. Primary fallback requires a budget; routing rules must follow the user journey.",
        "effectReasons": {
          "upfrontCost": "$8,000 funds this rollout, verification and migration effort.",
          "monthlyBurn": "The monthly change is $+5,500, including 0 hires and the operating costs of this response.",
          "reliability": "Primary fallback requires a budget; routing rules must follow the user journey.",
          "customerTrust": "Merchant retention follows the response’s stated service contract and remaining risk.",
          "complexity": "Operational load includes the rollout, ownership and ongoing failure modes described here."
        }
      },
      "architectureChanges": changesFor("consistent-reads"),
      "outcomeTitle": "The buyer reads their own write.",
      "outcomeDialogue": "Read-after-write works without forcing every report to be synchronous. Primary fallback requires a budget; routing rules must follow the user journey.",
      "outcomeEmotion": "happy",
      "outcomeNote": "Consistency belongs to a workflow, not a blanket database label. Next pressure: Primary routing fixes visibility but primary availability still needs a failover contract."
    },
    {
      "id": "020-bounded",
      "label": "Return all reads to the primary",
      "description": "Disable reader routing and resize the primary for the mixed workload.",
      "cost": 3600,
      "tone": "neutral",
      "effects": {
        "users": 105000,
        "monthlyRevenue": 38500,
        "monthlyBurn": 7700,
        "engineers": 0,
        "reliability": 1,
        "customerTrust": 1,
        "complexity": 0,
        "xp": 100,
        "confidence": 3
      },
      "tradeoff": {
        "upsideLabel": "Smaller contract",
        "downsideLabel": "Limits accepted",
        "upside": "A single read source gives straightforward visibility semantics.",
        "downside": "Reports again consume write-tier headroom and raise infrastructure spend.",
        "jimmyExplanation": "A single read source gives straightforward visibility semantics. Reports again consume write-tier headroom and raise infrastructure spend.",
        "effectReasons": {
          "upfrontCost": "$3,600 funds this rollout, verification and migration effort.",
          "monthlyBurn": "The monthly change is $+7,700, including 0 hires and the operating costs of this response.",
          "reliability": "Reports again consume write-tier headroom and raise infrastructure spend.",
          "customerTrust": "Merchant retention follows the response’s stated service contract and remaining risk.",
          "complexity": "Operational load includes the rollout, ownership and ongoing failure modes described here."
        }
      },
      "architectureChanges": [...changesFor("consistent-reads", "primary-reads"), ...disable("reader-routing")],
      "outcomeTitle": "A narrower contract, deliberately.",
      "outcomeDialogue": "A single read source gives straightforward visibility semantics. Reports again consume write-tier headroom and raise infrastructure spend.",
      "outcomeEmotion": "thinking",
      "outcomeNote": "Consistency belongs to a workflow, not a blanket database label. Next pressure: Primary routing fixes visibility but primary availability still needs a failover contract."
    },
    {
      "id": "020-shortcut",
      "label": "Sleep one second before the lookup",
      "description": "Delay the client before issuing the same replica read.",
      "cost": 5200,
      "tone": "risky",
      "effects": {
        "users": 45000,
        "monthlyRevenue": 16500,
        "monthlyBurn": 6325,
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
        "upside": "A delay can hide some short replication gaps.",
        "downside": "Observed lag exceeds one second, so elapsed time is not a consistency guarantee.",
        "jimmyExplanation": "A delay can hide some short replication gaps. Observed lag exceeds one second, so elapsed time is not a consistency guarantee.",
        "effectReasons": {
          "upfrontCost": "$5,200 funds this rollout, verification and migration effort.",
          "monthlyBurn": "The monthly change is $+6,325, including 0 hires and the operating costs of this response.",
          "reliability": "Observed lag exceeds one second, so elapsed time is not a consistency guarantee.",
          "customerTrust": "Merchant retention follows the response’s stated service contract and remaining risk.",
          "complexity": "Operational load includes the rollout, ownership and ongoing failure modes described here."
        }
      },
      "architectureChanges": changesFor("sleep-consistency"),
      "outcomeTitle": "The trade-off catches up.",
      "outcomeDialogue": "A delay can hide some short replication gaps. Observed lag exceeds one second, so elapsed time is not a consistency guarantee.",
      "outcomeEmotion": "concerned",
      "outcomeNote": "Consistency belongs to a workflow, not a blanket database label. The retained risk remains part of your company’s architecture."
    }
  ],
  "hints": [
    "A read-after-write workflow was incorrectly classified as lag tolerant.",
    "Consistency belongs to a workflow, not a blanket database label."
  ],
  "lesson": "Consistency belongs to a workflow, not a blanket database label.",
  "variants": [
    {
      "id": "without-reader-routing",
      "when": {
        "missingAny": [
          "reader-routing"
        ]
      },
      "description": "You kept reports on the primary. The mobile team proposes a replica route; its prelaunch test shows a newly created order missing for up to 4.2 seconds. Keep production reads consistent while deciding whether to enable that route.",
      "metrics": [
        {
          "label": "Production lookup",
          "value": "primary",
          "severity": "normal"
        },
        {
          "label": "Prototype replay lag p99",
          "value": "4.2 s",
          "severity": "critical"
        },
        {
          "label": "Primary commit failures",
          "value": "0%",
          "severity": "normal"
        }
      ],
      "dialogue": [
        {
          "character": "jimmy",
          "emotion": "thinking",
          "text": "You kept reports on the primary. The mobile team proposes a replica route; its prelaunch test shows a newly created order missing for up to 4.2 seconds. Keep production reads consistent while deciding whether to enable that route."
        },
        {
          "character": "jimmy",
          "emotion": "thinking",
          "text": "The order is there. We asked a reader that has not seen it yet. A one-second sleep is not proof that replication has caught up."
        }
      ]
    }
  ]
});
