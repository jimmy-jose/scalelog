import { defineStartupLevel, changesFor } from "./authoring";

export const level018 = defineStartupLevel({
  "levelNumber": 18,
  "title": "The Import Ate the Receipts",
  "description": "A merchant imports 100,000 images into the same worker pool as receipts. The queue is durable but normal receipts now wait behind slow media jobs. Two engineers join to own integrations and operations.",
  "dialogue": [
    {
      "character": "jimmy",
      "emotion": "thinking",
      "text": "A queue preserves work; it does not decide what matters first. Count the oldest receipt, not just how many messages are waiting."
    },
    {
      "character": "jimmy",
      "emotion": "normal",
      "text": "This month’s operating plan adds 2 engineers. Their compensation is included in every response’s recurring burn. Ownership has to grow with the architecture."
    }
  ],
  "metrics": [
    {
      "label": "Receipt age",
      "value": "23 min; target <30 s",
      "severity": "critical"
    },
    {
      "label": "Media work / worker time",
      "value": "94%",
      "severity": "warning"
    },
    {
      "label": "DB CPU",
      "value": "43%",
      "severity": "normal"
    }
  ],
  "choices": [
    {
      "id": "018-measured",
      "label": "Separate work classes and bound admission",
      "description": "Give receipts reserved concurrency; route media/imports to bounded pools, cap tenant backlog, track age and apply backpressure to imports. Hire two owners.",
      "cost": 7500,
      "tone": "recommended",
      "effects": {
        "users": 110000,
        "monthlyRevenue": 45000,
        "monthlyBurn": 14000,
        "engineers": 2,
        "reliability": 3,
        "customerTrust": 2,
        "complexity": -2,
        "xp": 200,
        "confidence": 8
      },
      "tradeoff": {
        "upsideLabel": "Targeted improvement",
        "downsideLabel": "Cost and ownership",
        "upside": "Latency-sensitive jobs retain capacity during bulk imports.",
        "downside": "Separate queues need scheduling and operational ownership; more concurrency must respect DB and provider limits.",
        "jimmyExplanation": "Latency-sensitive jobs retain capacity during bulk imports. Separate queues need scheduling and operational ownership; more concurrency must respect DB and provider limits.",
        "effectReasons": {
          "upfrontCost": "$7,500 funds this rollout, verification and migration effort.",
          "monthlyBurn": "The monthly change is $+14,000, including 2 hires and the operating costs of this response.",
          "reliability": "Separate queues need scheduling and operational ownership; more concurrency must respect DB and provider limits.",
          "customerTrust": "Merchant retention follows the response’s stated service contract and remaining risk.",
          "complexity": "Operational load includes the rollout, ownership and ongoing failure modes described here."
        }
      },
      "architectureChanges": changesFor("isolated-workers"),
      "outcomeTitle": "Receipts get reserved capacity.",
      "outcomeDialogue": "Latency-sensitive jobs retain capacity during bulk imports. Separate queues need scheduling and operational ownership; more concurrency must respect DB and provider limits.",
      "outcomeEmotion": "happy",
      "outcomeNote": "Queues need class isolation, backpressure and bounded admission. Next pressure: Reliable async work expands merchant adoption and produces more personalized database reads."
    },
    {
      "id": "018-bounded",
      "label": "Schedule all imports overnight",
      "description": "Reserve daytime workers for receipts and process imports in a published off-peak window. Hire two owners.",
      "cost": 3375,
      "tone": "neutral",
      "effects": {
        "users": 77000,
        "monthlyRevenue": 31500,
        "monthlyBurn": 11900,
        "engineers": 2,
        "reliability": 1,
        "customerTrust": 1,
        "complexity": 0,
        "xp": 100,
        "confidence": 3
      },
      "tradeoff": {
        "upsideLabel": "Smaller contract",
        "downsideLabel": "Limits accepted",
        "upside": "A simple schedule meets receipt latency without many queues.",
        "downside": "International merchants lack a universal night; imports have a longer turnaround contract.",
        "jimmyExplanation": "A simple schedule meets receipt latency without many queues. International merchants lack a universal night; imports have a longer turnaround contract.",
        "effectReasons": {
          "upfrontCost": "$3,375 funds this rollout, verification and migration effort.",
          "monthlyBurn": "The monthly change is $+11,900, including 2 hires and the operating costs of this response.",
          "reliability": "International merchants lack a universal night; imports have a longer turnaround contract.",
          "customerTrust": "Merchant retention follows the response’s stated service contract and remaining risk.",
          "complexity": "Operational load includes the rollout, ownership and ongoing failure modes described here."
        }
      },
      "architectureChanges": changesFor("scheduled-imports"),
      "outcomeTitle": "A narrower contract, deliberately.",
      "outcomeDialogue": "A simple schedule meets receipt latency without many queues. International merchants lack a universal night; imports have a longer turnaround contract.",
      "outcomeEmotion": "thinking",
      "outcomeNote": "Queues need class isolation, backpressure and bounded admission. Next pressure: Reliable async work expands merchant adoption and produces more personalized database reads."
    },
    {
      "id": "018-shortcut",
      "label": "Let autoscaling chase total queue depth",
      "description": "Add unlimited workers based only on message count. Hire two owners.",
      "cost": 4875,
      "tone": "risky",
      "effects": {
        "users": 33000,
        "monthlyRevenue": 13500,
        "monthlyBurn": 16100,
        "engineers": 2,
        "reliability": -9,
        "customerTrust": -7,
        "complexity": 7,
        "xp": -30,
        "confidence": -12
      },
      "tradeoff": {
        "upsideLabel": "Immediate relief",
        "downsideLabel": "Unresolved risk",
        "upside": "A homogeneous CPU-bound queue could drain faster this way.",
        "downside": "Slow jobs hide in the count and workers can overwhelm database/provider budgets.",
        "jimmyExplanation": "A homogeneous CPU-bound queue could drain faster this way. Slow jobs hide in the count and workers can overwhelm database/provider budgets.",
        "effectReasons": {
          "upfrontCost": "$4,875 funds this rollout, verification and migration effort.",
          "monthlyBurn": "The monthly change is $+16,100, including 2 hires and the operating costs of this response.",
          "reliability": "Slow jobs hide in the count and workers can overwhelm database/provider budgets.",
          "customerTrust": "Merchant retention follows the response’s stated service contract and remaining risk.",
          "complexity": "Operational load includes the rollout, ownership and ongoing failure modes described here."
        }
      },
      "architectureChanges": changesFor("unbounded-workers"),
      "outcomeTitle": "The trade-off catches up.",
      "outcomeDialogue": "A homogeneous CPU-bound queue could drain faster this way. Slow jobs hide in the count and workers can overwhelm database/provider budgets.",
      "outcomeEmotion": "concerned",
      "outcomeNote": "Queues need class isolation, backpressure and bounded admission. The retained risk remains part of your company’s architecture."
    }
  ],
  "hints": [
    "A shared FIFO and concurrency pool let long bulk jobs starve latency-sensitive work.",
    "Queues need class isolation, backpressure and bounded admission."
  ],
  "lesson": "Queues need class isolation, backpressure and bounded admission.",
  "variants": [
    {
      "id": "without-job-queue",
      "when": {
        "missingAny": [
          "job-queue"
        ]
      },
      "description": "Imports and receipts contend in the local delivery loop. The five-second enterprise target requires reserved receipt capacity; the queue-based response includes an explicit durable job rollout.",
      "metrics": [
        {
          "label": "Receipt delay",
          "value": "23 min",
          "severity": "critical"
        },
        {
          "label": "Import share of loop time",
          "value": "94%",
          "severity": "warning"
        },
        {
          "label": "DB CPU",
          "value": "43%",
          "severity": "normal"
        }
      ],
      "dialogue": [
        {
          "character": "jimmy",
          "emotion": "thinking",
          "text": "Imports and receipts contend in the local delivery loop. The five-second enterprise target requires reserved receipt capacity; the queue-based response includes an explicit durable job rollout."
        },
        {
          "character": "jimmy",
          "emotion": "thinking",
          "text": "A queue preserves work; it does not decide what matters first. Count the oldest receipt, not just how many messages are waiting."
        },
        {
          "character": "jimmy",
          "emotion": "normal",
          "text": "This month’s operating plan adds 2 engineers. Their compensation is included in every response’s recurring burn. Ownership has to grow with the architecture."
        }
      ]
    }
  ],
  "recoveries": [
    {
      "capability": "job-queue",
      "choiceIds": [
        "018-measured"
      ],
      "description": "Provision durable queues before separating background worker classes.",
      "cost": 3000,
      "monthlyBurn": 1400,
      "complexity": 1,
      "architectureChanges": changesFor("job-queue")
    }
  ]
});
