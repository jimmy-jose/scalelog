import { defineStartupLevel, changesFor } from "./authoring";

export const level033 = defineStartupLevel({
  "levelNumber": 33,
  "title": "The Whale Does Not Hash Smaller",
  "description": "One merchant accounts for 42% of catalogue-feed writes. With eight tenant-routed groups, its assigned shard saturates while others remain cool. Checkout transactions must still stay tenant-local.",
  "dialogue": [
    {
      "character": "jimmy",
      "emotion": "thinking",
      "text": "Hashing a merchant ID again still sends that merchant to one place. Protect the neighbors and keep the stock transaction local."
    }
  ],
  "metrics": [
    {
      "label": "Hottest shard / median CPU",
      "value": "97% / 31%",
      "severity": "critical"
    },
    {
      "label": "Largest tenant write share",
      "value": "42%",
      "severity": "warning"
    },
    {
      "label": "Tenant-local invariants",
      "value": "orders + stock",
      "severity": "normal"
    }
  ],
  "choices": [
    {
      "id": "033-measured",
      "label": "Isolate the whale and enforce feed budgets",
      "description": "Move the whale to a dedicated larger writer group through the directory, cap its bulk import rate, reserve checkout throughput and rebalance smaller tenants.",
      "cost": 55000,
      "tone": "recommended",
      "effects": {
        "users": 200000,
        "monthlyRevenue": 120000,
        "monthlyBurn": 18000,
        "engineers": 0,
        "reliability": 0,
        "customerTrust": 2,
        "complexity": 1,
        "xp": 240,
        "confidence": 8
      },
      "tradeoff": {
        "upsideLabel": "Targeted improvement",
        "downsideLabel": "Cost and ownership",
        "upside": "Tenant-local invariants remain intact and neighbors regain headroom.",
        "downside": "The whale still has a finite single-writer ceiling; admission control limits its import throughput.",
        "jimmyExplanation": "Tenant-local invariants remain intact and neighbors regain headroom. The whale still has a finite single-writer ceiling; admission control limits its import throughput.",
        "effectReasons": {
          "upfrontCost": "$55,000 funds this rollout, verification and migration effort.",
          "monthlyBurn": "The monthly change is $+18,000, including 0 hires and the operating costs of this response.",
          "reliability": "The whale still has a finite single-writer ceiling; admission control limits its import throughput.",
          "customerTrust": "Merchant retention follows the response’s stated service contract and remaining risk.",
          "complexity": "Operational load includes the rollout, ownership and ongoing failure modes described here."
        }
      },
      "architectureChanges": changesFor("whale-isolation"),
      "outcomeTitle": "The whale has its own boundary.",
      "outcomeDialogue": "Tenant-local invariants remain intact and neighbors regain headroom. The whale still has a finite single-writer ceiling; admission control limits its import throughput.",
      "outcomeEmotion": "happy",
      "outcomeNote": "Hot tenants require isolation or a proven sub-key, not another hash function. Next pressure: More write groups create more recovery units; regional failover needs a complete inventory."
    },
    {
      "id": "033-bounded",
      "label": "Negotiate an off-peak whale import window",
      "description": "Keep placement fixed, throttle this merchant during checkout peaks and schedule its largest feeds.",
      "cost": 24750,
      "tone": "neutral",
      "effects": {
        "users": 140000,
        "monthlyRevenue": 84000,
        "monthlyBurn": 15300,
        "engineers": 0,
        "reliability": 1,
        "customerTrust": 1,
        "complexity": 0,
        "xp": 120,
        "confidence": 3
      },
      "tradeoff": {
        "upsideLabel": "Smaller contract",
        "downsideLabel": "Limits accepted",
        "upside": "No migration and minimal operational cost can protect availability.",
        "downside": "The merchant loses real-time feed throughput and may reject the reduced service tier.",
        "jimmyExplanation": "No migration and minimal operational cost can protect availability. The merchant loses real-time feed throughput and may reject the reduced service tier.",
        "effectReasons": {
          "upfrontCost": "$24,750 funds this rollout, verification and migration effort.",
          "monthlyBurn": "The monthly change is $+15,300, including 0 hires and the operating costs of this response.",
          "reliability": "The merchant loses real-time feed throughput and may reject the reduced service tier.",
          "customerTrust": "Merchant retention follows the response’s stated service contract and remaining risk.",
          "complexity": "Operational load includes the rollout, ownership and ongoing failure modes described here."
        }
      },
      "architectureChanges": changesFor("whale-budget"),
      "outcomeTitle": "A narrower contract, deliberately.",
      "outcomeDialogue": "No migration and minimal operational cost can protect availability. The merchant loses real-time feed throughput and may reject the reduced service tier.",
      "outcomeEmotion": "thinking",
      "outcomeNote": "Hot tenants require isolation or a proven sub-key, not another hash function. Next pressure: More write groups create more recovery units; regional failover needs a complete inventory."
    },
    {
      "id": "033-shortcut",
      "label": "Hash each order randomly across shards",
      "description": "Scatter one merchant’s orders and stock across databases without a transaction redesign.",
      "cost": 35750,
      "tone": "risky",
      "effects": {
        "users": 60000,
        "monthlyRevenue": 36000,
        "monthlyBurn": 20700,
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
        "upside": "More machines could share a large tenant’s raw traffic.",
        "downside": "Stock/order invariants now cross shards; changing placement alone does not supply distributed atomicity.",
        "jimmyExplanation": "More machines could share a large tenant’s raw traffic. Stock/order invariants now cross shards; changing placement alone does not supply distributed atomicity.",
        "effectReasons": {
          "upfrontCost": "$35,750 funds this rollout, verification and migration effort.",
          "monthlyBurn": "The monthly change is $+20,700, including 0 hires and the operating costs of this response.",
          "reliability": "Stock/order invariants now cross shards; changing placement alone does not supply distributed atomicity.",
          "customerTrust": "Merchant retention follows the response’s stated service contract and remaining risk.",
          "complexity": "Operational load includes the rollout, ownership and ongoing failure modes described here."
        }
      },
      "architectureChanges": changesFor("random-tenant-scatter"),
      "outcomeTitle": "The trade-off catches up.",
      "outcomeDialogue": "More machines could share a large tenant’s raw traffic. Stock/order invariants now cross shards; changing placement alone does not supply distributed atomicity.",
      "outcomeEmotion": "concerned",
      "outcomeNote": "Hot tenants require isolation or a proven sub-key, not another hash function. The retained risk remains part of your company’s architecture."
    }
  ],
  "hints": [
    "Hashing tenants cannot divide one very large tenant’s workload.",
    "Hot tenants require isolation or a proven sub-key, not another hash function."
  ],
  "lesson": "Hot tenants require isolation or a proven sub-key, not another hash function.",
  "variants": [
    {
      "id": "without-tenant-shards",
      "when": {
        "missingAny": [
          "tenant-shards"
        ]
      },
      "description": "You retained one writer and constrained imports. A whale tenant now consumes 42% of the write budget, hurting neighboring merchants. A dedicated whale writer can isolate it without requiring a full eight-shard rollout.",
      "metrics": [
        {
          "label": "Whale write share",
          "value": "42%",
          "severity": "critical"
        },
        {
          "label": "Primary CPU",
          "value": "97%",
          "severity": "critical"
        },
        {
          "label": "Other tenants p95",
          "value": "1.8 s",
          "severity": "warning"
        }
      ],
      "dialogue": [
        {
          "character": "jimmy",
          "emotion": "thinking",
          "text": "You retained one writer and constrained imports. A whale tenant now consumes 42% of the write budget, hurting neighboring merchants. A dedicated whale writer can isolate it without requiring a full eight-shard rollout."
        },
        {
          "character": "jimmy",
          "emotion": "thinking",
          "text": "Hashing a merchant ID again still sends that merchant to one place. Protect the neighbors and keep the stock transaction local."
        }
      ]
    }
  ],
  "recoveries": [
    {
      "capability": "pitr",
      "choiceIds": [
        "033-measured"
      ],
      "description": "Establish independent WAL recovery before moving the whale’s authoritative data.",
      "cost": 14000,
      "monthlyBurn": 4500,
      "complexity": 1,
      "architectureChanges": changesFor("pitr")
    }
  ]
});
