import { defineStartupLevel, changesFor } from "./authoring";

export const level017 = defineStartupLevel({
  "levelNumber": 17,
  "title": "Paid Order, Missing Event",
  "description": "A deploy terminates a process after its order transaction commits but before the notification publish. The reconciliation report finds paid orders with no receipt job.",
  "dialogue": [
    {
      "character": "jimmy",
      "emotion": "thinking",
      "text": "The broker was up. We crashed before we asked it to do anything. The order and its delivery intent need a shared commit boundary."
    }
  ],
  "metrics": [
    {
      "label": "Committed orders without jobs",
      "value": "0.4%",
      "severity": "critical"
    },
    {
      "label": "Broker availability",
      "value": "99.99%",
      "severity": "normal"
    },
    {
      "label": "Crash boundary",
      "value": "commit → publish",
      "severity": "warning"
    }
  ],
  "choices": [
    {
      "id": "017-measured",
      "label": "Write an outbox in the order transaction",
      "description": "Insert order and event into the same PostgreSQL transaction, relay committed events with retries, keep per-order sequence numbers and monitor outbox age.",
      "cost": 6500,
      "tone": "recommended",
      "effects": {
        "users": 100000,
        "monthlyRevenue": 40000,
        "monthlyBurn": 3500,
        "engineers": 0,
        "reliability": 3,
        "customerTrust": 2,
        "complexity": 1,
        "xp": 180,
        "confidence": 8
      },
      "tradeoff": {
        "upsideLabel": "Targeted improvement",
        "downsideLabel": "Cost and ownership",
        "upside": "Committed orders always have a durable delivery intent.",
        "downside": "The relay may publish duplicates; consumers still need idempotency and retained event IDs.",
        "jimmyExplanation": "Committed orders always have a durable delivery intent. The relay may publish duplicates; consumers still need idempotency and retained event IDs.",
        "effectReasons": {
          "upfrontCost": "$6,500 funds this rollout, verification and migration effort.",
          "monthlyBurn": "The monthly change is $+3,500, including 0 hires and the operating costs of this response.",
          "reliability": "The relay may publish duplicates; consumers still need idempotency and retained event IDs.",
          "customerTrust": "Merchant retention follows the response’s stated service contract and remaining risk.",
          "complexity": "Operational load includes the rollout, ownership and ongoing failure modes described here."
        }
      },
      "architectureChanges": changesFor("job-queue", "outbox", "durable-handoff"),
      "outcomeTitle": "The order carries its delivery intent.",
      "outcomeDialogue": "Committed orders always have a durable delivery intent. The relay may publish duplicates; consumers still need idempotency and retained event IDs.",
      "outcomeEmotion": "happy",
      "outcomeNote": "Transactional outbox closes a dual-write gap but still needs idempotent consumers. Next pressure: Reliable delivery increases worker traffic; isolated queues and backpressure become necessary."
    },
    {
      "id": "017-bounded",
      "label": "Keep reconciliation as the delivery source",
      "description": "Persist immutable per-order delivery intents in the order transaction, then poll that ledger with stable idempotency keys and per-destination completion records. Keep a two-minute lag budget; no broker is required.",
      "cost": 2925,
      "tone": "neutral",
      "effects": {
        "users": 70000,
        "monthlyRevenue": 28000,
        "monthlyBurn": 2975,
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
        "upside": "A durable, simpler recovery loop can work without a separate broker.",
        "downside": "Higher polling load and bounded delay weaken the enterprise five-second delivery target.",
        "jimmyExplanation": "A durable, simpler recovery loop can work without a separate broker. Higher polling load and bounded delay weaken the enterprise five-second delivery target.",
        "effectReasons": {
          "upfrontCost": "$2,925 funds this rollout, verification and migration effort.",
          "monthlyBurn": "The monthly change is $+2,975, including 0 hires and the operating costs of this response.",
          "reliability": "Higher polling load and bounded delay weaken the enterprise five-second delivery target.",
          "customerTrust": "Merchant retention follows the response’s stated service contract and remaining risk.",
          "complexity": "Operational load includes the rollout, ownership and ongoing failure modes described here."
        }
      },
      "architectureChanges": changesFor("local-dispatch", "durable-handoff"),
      "outcomeTitle": "A narrower contract, deliberately.",
      "outcomeDialogue": "A durable, simpler recovery loop can work without a separate broker. Higher polling load and bounded delay weaken the enterprise five-second delivery target.",
      "outcomeEmotion": "thinking",
      "outcomeNote": "Transactional outbox closes a dual-write gap but still needs idempotent consumers. Next pressure: Reliable delivery increases worker traffic; isolated queues and backpressure become necessary."
    },
    {
      "id": "017-shortcut",
      "label": "Publish first, then commit the order",
      "description": "Send the event before attempting the order transaction.",
      "cost": 4225,
      "tone": "risky",
      "effects": {
        "users": 30000,
        "monthlyRevenue": 12000,
        "monthlyBurn": 4025,
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
        "upside": "No committed order waits for a later publish call in the normal path.",
        "downside": "A rolled-back transaction can leave a phantom order event; the inconsistency changed direction.",
        "jimmyExplanation": "No committed order waits for a later publish call in the normal path. A rolled-back transaction can leave a phantom order event; the inconsistency changed direction.",
        "effectReasons": {
          "upfrontCost": "$4,225 funds this rollout, verification and migration effort.",
          "monthlyBurn": "The monthly change is $+4,025, including 0 hires and the operating costs of this response.",
          "reliability": "A rolled-back transaction can leave a phantom order event; the inconsistency changed direction.",
          "customerTrust": "Merchant retention follows the response’s stated service contract and remaining risk.",
          "complexity": "Operational load includes the rollout, ownership and ongoing failure modes described here."
        }
      },
      "architectureChanges": changesFor("publish-before-commit"),
      "outcomeTitle": "The trade-off catches up.",
      "outcomeDialogue": "No committed order waits for a later publish call in the normal path. A rolled-back transaction can leave a phantom order event; the inconsistency changed direction.",
      "outcomeEmotion": "concerned",
      "outcomeNote": "Transactional outbox closes a dual-write gap but still needs idempotent consumers. The retained risk remains part of your company’s architecture."
    }
  ],
  "hints": [
    "Two independent writes are not atomic; a healthy broker cannot receive a publish that never occurred.",
    "Transactional outbox closes a dual-write gap but still needs idempotent consumers."
  ],
  "lesson": "Transactional outbox closes a dual-write gap but still needs idempotent consumers.",
  "variants": [
    {
      "id": "without-job-queue",
      "when": {
        "missingAny": [
          "job-queue"
        ]
      },
      "description": "Your receipt path has no broker. An audit finds a crash boundary between committing orders and recording delivery work. Make delivery intent transactional, then choose broker publication or direct polling with a weaker delay contract.",
      "metrics": [
        {
          "label": "Orders without delivery record",
          "value": "0.4%",
          "severity": "critical"
        },
        {
          "label": "Boundary",
          "value": "order commit → delivery record",
          "severity": "warning"
        },
        {
          "label": "Enterprise delivery target",
          "value": "5 s",
          "severity": "normal"
        }
      ],
      "dialogue": [
        {
          "character": "jimmy",
          "emotion": "thinking",
          "text": "Your receipt path has no broker. An audit finds a crash boundary between committing orders and recording delivery work. Make delivery intent transactional, then choose broker publication or direct polling with a weaker delay contract."
        },
        {
          "character": "jimmy",
          "emotion": "thinking",
          "text": "A process can die between committing an order and recording delivery work. The order and its immutable delivery intent need a shared commit boundary."
        }
      ]
    }
  ],
  "recoveries": [
    {
      "capability": "job-queue",
      "choiceIds": [
        "017-measured"
      ],
      "description": "Provision the durable queue and relay worker used by this outbox response.",
      "cost": 3000,
      "monthlyBurn": 1400,
      "complexity": 1,
      "architectureChanges": changesFor("job-queue")
    }
  ]
});
