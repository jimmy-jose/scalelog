import { defineStartupLevel, changesFor } from "./authoring";

export const level022 = defineStartupLevel({
  "levelNumber": 22,
  "title": "The Delete Reached Every Replica",
  "description": "A faulty maintenance command removes an hour of order records. Replicas faithfully apply the deletion. The nightly backup is 19 hours old; the business accepts at most five minutes of recovery-point loss and a one-hour restore.",
  "dialogue": [
    {
      "character": "jimmy",
      "emotion": "thinking",
      "text": "The replicas did exactly their job: they copied the delete. We need an independent point in history, and a plan for the good orders written afterward."
    }
  ],
  "metrics": [
    {
      "label": "Latest snapshot age",
      "value": "19 h",
      "severity": "critical"
    },
    {
      "label": "Deletion on replicas",
      "value": "yes",
      "severity": "critical"
    },
    {
      "label": "Recovery requirement",
      "value": "RPO 5 min / RTO 60 min",
      "severity": "normal"
    }
  ],
  "choices": [
    {
      "id": "022-measured",
      "label": "Archive WAL and rehearse point-in-time restore",
      "description": "Maintain encrypted base backups and continuous WAL archives with <5-minute archive lag; restore before the bad transaction into an isolated environment, validate, fence and reconcile later legitimate orders.",
      "cost": 15000,
      "tone": "recommended",
      "effects": {
        "users": 180000,
        "monthlyRevenue": 65000,
        "monthlyBurn": 7000,
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
        "upside": "A tested recovery path can undo logical corruption with explicit data reconciliation.",
        "downside": "A point-in-time restore also omits good writes after the chosen time; recovery is not just flipping a replica.",
        "jimmyExplanation": "A tested recovery path can undo logical corruption with explicit data reconciliation. A point-in-time restore also omits good writes after the chosen time; recovery is not just flipping a replica.",
        "effectReasons": {
          "upfrontCost": "$15,000 funds this rollout, verification and migration effort.",
          "monthlyBurn": "The monthly change is $+7,000, including 0 hires and the operating costs of this response.",
          "reliability": "A point-in-time restore also omits good writes after the chosen time; recovery is not just flipping a replica.",
          "customerTrust": "Merchant retention follows the response’s stated service contract and remaining risk.",
          "complexity": "Operational load includes the rollout, ownership and ongoing failure modes described here."
        }
      },
      "architectureChanges": changesFor("pitr"),
      "outcomeTitle": "Recovery reaches back in time.",
      "outcomeDialogue": "A tested recovery path can undo logical corruption with explicit data reconciliation. A point-in-time restore also omits good writes after the chosen time; recovery is not just flipping a replica.",
      "outcomeEmotion": "happy",
      "outcomeNote": "Backups count only when a measured restore satisfies the recovery objective. Next pressure: Growing datasets require restore benchmarks and retention controls; schema changes must be staged safely."
    },
    {
      "id": "022-bounded",
      "label": "Take snapshots every hour",
      "description": "Use isolated hourly snapshots and a verified restore runbook, negotiating the longer loss window.",
      "cost": 6750,
      "tone": "neutral",
      "effects": {
        "users": 126000,
        "monthlyRevenue": 45500,
        "monthlyBurn": 5950,
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
        "upside": "Simple snapshots recover data without relying on production replicas.",
        "downside": "An hour between snapshots misses the required five-minute RPO.",
        "jimmyExplanation": "Simple snapshots recover data without relying on production replicas. An hour between snapshots misses the required five-minute RPO.",
        "effectReasons": {
          "upfrontCost": "$6,750 funds this rollout, verification and migration effort.",
          "monthlyBurn": "The monthly change is $+5,950, including 0 hires and the operating costs of this response.",
          "reliability": "An hour between snapshots misses the required five-minute RPO.",
          "customerTrust": "Merchant retention follows the response’s stated service contract and remaining risk.",
          "complexity": "Operational load includes the rollout, ownership and ongoing failure modes described here."
        }
      },
      "architectureChanges": changesFor("snapshots"),
      "outcomeTitle": "A narrower contract, deliberately.",
      "outcomeDialogue": "Simple snapshots recover data without relying on production replicas. An hour between snapshots misses the required five-minute RPO.",
      "outcomeEmotion": "thinking",
      "outcomeNote": "Backups count only when a measured restore satisfies the recovery objective. Next pressure: Growing datasets require restore benchmarks and retention controls; schema changes must be staged safely."
    },
    {
      "id": "022-shortcut",
      "label": "Promote the fastest replica",
      "description": "Switch reads and writes to the reader with the lowest lag.",
      "cost": 9750,
      "tone": "risky",
      "effects": {
        "users": 54000,
        "monthlyRevenue": 19500,
        "monthlyBurn": 8050,
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
        "upside": "Useful for a failed primary when data is healthy.",
        "downside": "The fastest replica has already applied the deletion and cannot restore history.",
        "jimmyExplanation": "Useful for a failed primary when data is healthy. The fastest replica has already applied the deletion and cannot restore history.",
        "effectReasons": {
          "upfrontCost": "$9,750 funds this rollout, verification and migration effort.",
          "monthlyBurn": "The monthly change is $+8,050, including 0 hires and the operating costs of this response.",
          "reliability": "The fastest replica has already applied the deletion and cannot restore history.",
          "customerTrust": "Merchant retention follows the response’s stated service contract and remaining risk.",
          "complexity": "Operational load includes the rollout, ownership and ongoing failure modes described here."
        }
      },
      "architectureChanges": changesFor("deleted-replica"),
      "outcomeTitle": "The trade-off catches up.",
      "outcomeDialogue": "Useful for a failed primary when data is healthy. The fastest replica has already applied the deletion and cannot restore history.",
      "outcomeEmotion": "concerned",
      "outcomeNote": "Backups count only when a measured restore satisfies the recovery objective. The retained risk remains part of your company’s architecture."
    }
  ],
  "hints": [
    "Replication preserves availability, not independent historical recovery points.",
    "Backups count only when a measured restore satisfies the recovery objective."
  ],
  "lesson": "Backups count only when a measured restore satisfies the recovery objective.",
  "variants": [
    {
      "id": "without-multi-az",
      "when": {
        "missingAny": [
          "multi-az"
        ]
      },
      "description": "A maintenance delete removes valid order history. Your current availability tier cannot reconstruct earlier data, whether it uses an asynchronous standby or only a primary. The backup is 19 hours old.",
      "metrics": [
        {
          "label": "Latest independent backup",
          "value": "19 h",
          "severity": "critical"
        },
        {
          "label": "Logical deletion",
          "value": "applied to current data",
          "severity": "critical"
        },
        {
          "label": "Required recovery",
          "value": "RPO 5 min / RTO 60 min",
          "severity": "normal"
        }
      ],
      "dialogue": [
        {
          "character": "jimmy",
          "emotion": "thinking",
          "text": "A maintenance delete removes valid order history. Your current availability tier cannot reconstruct earlier data, whether it uses an asynchronous standby or only a primary. The backup is 19 hours old."
        },
        {
          "character": "jimmy",
          "emotion": "thinking",
          "text": "A current copy cannot undo a logical delete. We need an independent point in history, and a plan for the good orders written afterward."
        }
      ]
    }
  ]
});
