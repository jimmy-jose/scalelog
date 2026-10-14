import { defineStartupLevel, changesFor } from "./authoring";

export const level016 = defineStartupLevel({
  "levelNumber": 16,
  "title": "One Message Never Finishes",
  "description": "A malformed merchant event fails validation on every attempt. It repeatedly consumes the front of one tenant’s ordered work stream, delaying valid receipts.",
  "dialogue": [
    {
      "character": "jimmy",
      "emotion": "thinking",
      "text": "Forty-six attempts have not changed this payload. Keep the evidence, give someone ownership, and decide what ordering guarantees the healthy work still needs."
    }
  ],
  "metrics": [
    {
      "label": "Same event failures",
      "value": "46 attempts",
      "severity": "critical"
    },
    {
      "label": "Oldest valid job",
      "value": "38 min",
      "severity": "critical"
    },
    {
      "label": "Worker CPU",
      "value": "27%",
      "severity": "normal"
    }
  ],
  "choices": [
    {
      "id": "016-measured",
      "label": "Quarantine with a dead-letter queue",
      "description": "Classify permanent failures, send exhausted jobs plus error metadata to a restricted DLQ, alert an owner and replay only after repair with original idempotency keys.",
      "cost": 4500,
      "tone": "recommended",
      "effects": {
        "users": 80000,
        "monthlyRevenue": 35000,
        "monthlyBurn": 2500,
        "engineers": 0,
        "reliability": 3,
        "customerTrust": 2,
        "complexity": -1,
        "xp": 180,
        "confidence": 8
      },
      "tradeoff": {
        "upsideLabel": "Targeted improvement",
        "downsideLabel": "Cost and ownership",
        "upside": "Healthy work progresses while failed work remains inspectable.",
        "downside": "Moving an ordered event aside creates a gap; dependent events must pause or reconcile before replay.",
        "jimmyExplanation": "Healthy work progresses while failed work remains inspectable. Moving an ordered event aside creates a gap; dependent events must pause or reconcile before replay.",
        "effectReasons": {
          "upfrontCost": "$4,500 funds this rollout, verification and migration effort.",
          "monthlyBurn": "The monthly change is $+2,500, including 0 hires and the operating costs of this response.",
          "reliability": "Moving an ordered event aside creates a gap; dependent events must pause or reconcile before replay.",
          "customerTrust": "Merchant retention follows the response’s stated service contract and remaining risk.",
          "complexity": "Operational load includes the rollout, ownership and ongoing failure modes described here."
        }
      },
      "architectureChanges": changesFor("dead-letter"),
      "outcomeTitle": "Bad work has a named owner.",
      "outcomeDialogue": "Healthy work progresses while failed work remains inspectable. Moving an ordered event aside creates a gap; dependent events must pause or reconcile before replay.",
      "outcomeEmotion": "happy",
      "outcomeNote": "Quarantine poison work with evidence and a safe replay path. Next pressure: Quarantine creates an operational backlog; events can still be missing before they ever enter the queue."
    },
    {
      "id": "016-bounded",
      "label": "Park the entire tenant stream",
      "description": "Stop only the affected tenant’s stream and assign a repair owner with a deadline.",
      "cost": 2025,
      "tone": "neutral",
      "effects": {
        "users": 56000,
        "monthlyRevenue": 24500,
        "monthlyBurn": 2125,
        "engineers": 0,
        "reliability": 1,
        "customerTrust": 1,
        "complexity": 0,
        "xp": 90,
        "confidence": 3
      },
      "tradeoff": {
        "upsideLabel": "Smaller contract",
        "downsideLabel": "Limits accepted",
        "upside": "Strict dependent ordering is preserved without losing messages.",
        "downside": "All that tenant’s deliveries wait for manual repair, even independent ones.",
        "jimmyExplanation": "Strict dependent ordering is preserved without losing messages. All that tenant’s deliveries wait for manual repair, even independent ones.",
        "effectReasons": {
          "upfrontCost": "$2,025 funds this rollout, verification and migration effort.",
          "monthlyBurn": "The monthly change is $+2,125, including 0 hires and the operating costs of this response.",
          "reliability": "All that tenant’s deliveries wait for manual repair, even independent ones.",
          "customerTrust": "Merchant retention follows the response’s stated service contract and remaining risk.",
          "complexity": "Operational load includes the rollout, ownership and ongoing failure modes described here."
        }
      },
      "architectureChanges": changesFor("parked-stream"),
      "outcomeTitle": "A narrower contract, deliberately.",
      "outcomeDialogue": "Strict dependent ordering is preserved without losing messages. All that tenant’s deliveries wait for manual repair, even independent ones.",
      "outcomeEmotion": "thinking",
      "outcomeNote": "Quarantine poison work with evidence and a safe replay path. Next pressure: Quarantine creates an operational backlog; events can still be missing before they ever enter the queue."
    },
    {
      "id": "016-shortcut",
      "label": "Keep retrying until success",
      "description": "Remove retry limits to avoid admitting any failed delivery.",
      "cost": 2925,
      "tone": "risky",
      "effects": {
        "users": 24000,
        "monthlyRevenue": 10500,
        "monthlyBurn": 2875,
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
        "upside": "Transient errors sometimes recover without intervention.",
        "downside": "A malformed payload remains malformed and blocks useful work indefinitely.",
        "jimmyExplanation": "Transient errors sometimes recover without intervention. A malformed payload remains malformed and blocks useful work indefinitely.",
        "effectReasons": {
          "upfrontCost": "$2,925 funds this rollout, verification and migration effort.",
          "monthlyBurn": "The monthly change is $+2,875, including 0 hires and the operating costs of this response.",
          "reliability": "A malformed payload remains malformed and blocks useful work indefinitely.",
          "customerTrust": "Merchant retention follows the response’s stated service contract and remaining risk.",
          "complexity": "Operational load includes the rollout, ownership and ongoing failure modes described here."
        }
      },
      "architectureChanges": changesFor("infinite-retries"),
      "outcomeTitle": "The trade-off catches up.",
      "outcomeDialogue": "Transient errors sometimes recover without intervention. A malformed payload remains malformed and blocks useful work indefinitely.",
      "outcomeEmotion": "concerned",
      "outcomeNote": "Quarantine poison work with evidence and a safe replay path. The retained risk remains part of your company’s architecture."
    }
  ],
  "hints": [
    "A permanent payload error cannot be repaired by time or additional retry capacity.",
    "Quarantine poison work with evidence and a safe replay path."
  ],
  "lesson": "Quarantine poison work with evidence and a safe replay path.",
  "variants": [
    {
      "id": "without-job-queue",
      "when": {
        "missingAny": [
          "job-queue"
        ]
      },
      "description": "A malformed integration payload fails every attempt in your local delivery/reconciliation loop. The tenant’s later work waits behind it. The quarantine decision applies to a durable failure table as well as a broker DLQ.",
      "metrics": [
        {
          "label": "Repeated local attempts",
          "value": "46",
          "severity": "critical"
        },
        {
          "label": "Oldest pending delivery",
          "value": "38 min",
          "severity": "critical"
        },
        {
          "label": "Worker CPU",
          "value": "27%",
          "severity": "normal"
        }
      ],
      "dialogue": [
        {
          "character": "jimmy",
          "emotion": "thinking",
          "text": "A malformed integration payload fails every attempt in your local delivery/reconciliation loop. The tenant’s later work waits behind it. The quarantine decision applies to a durable failure table as well as a broker DLQ."
        },
        {
          "character": "jimmy",
          "emotion": "thinking",
          "text": "Forty-six attempts have not changed this payload. Keep the evidence, give someone ownership, and decide what ordering guarantees the healthy work still needs."
        }
      ]
    }
  ]
});
