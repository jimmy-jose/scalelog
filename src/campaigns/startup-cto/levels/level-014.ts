import { defineStartupLevel, changesFor } from "./authoring";

export const level014 = defineStartupLevel({
  "levelNumber": 14,
  "title": "Two Receipts for One Order",
  "description": "A receipt worker crashes after the provider accepted the request but before the queue acknowledgement. The broker redelivers it. Merchants report duplicate invoices in an integration that supports idempotency keys.",
  "dialogue": [
    {
      "character": "jimmy",
      "emotion": "thinking",
      "text": "The provider did its job; our worker never acknowledged it. Redelivery is doing exactly what we asked. Repeating the attempt must preserve the same intent."
    }
  ],
  "metrics": [
    {
      "label": "Redelivered jobs",
      "value": "1.8%",
      "severity": "warning"
    },
    {
      "label": "Duplicate side effects",
      "value": "1.6%",
      "severity": "critical"
    },
    {
      "label": "Crash window",
      "value": "after effect; before ack",
      "severity": "warning"
    }
  ],
  "choices": [
    {
      "id": "014-measured",
      "label": "Use durable idempotency keys",
      "description": "Use tenant/order/action keys, unique invoice records and provider-side idempotency; retain keys beyond the retry horizon and reconcile ambiguous responses.",
      "cost": 4000,
      "tone": "recommended",
      "effects": {
        "users": 60000,
        "monthlyRevenue": 28000,
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
        "upside": "Repeated attempts return the same logical invoice without duplicating the supported provider action.",
        "downside": "Keys need retention and parameter validation; arbitrary email providers cannot promise exactly-once delivery.",
        "jimmyExplanation": "Repeated attempts return the same logical invoice without duplicating the supported provider action. Keys need retention and parameter validation; arbitrary email providers cannot promise exactly-once delivery.",
        "effectReasons": {
          "upfrontCost": "$4,000 funds this rollout, verification and migration effort.",
          "monthlyBurn": "The monthly change is $+2,500, including 0 hires and the operating costs of this response.",
          "reliability": "Keys need retention and parameter validation; arbitrary email providers cannot promise exactly-once delivery.",
          "customerTrust": "Merchant retention follows the response’s stated service contract and remaining risk.",
          "complexity": "Operational load includes the rollout, ownership and ongoing failure modes described here."
        }
      },
      "architectureChanges": changesFor("idempotent-effects"),
      "outcomeTitle": "A retry keeps the same identity.",
      "outcomeDialogue": "Repeated attempts return the same logical invoice without duplicating the supported provider action. Keys need retention and parameter validation; arbitrary email providers cannot promise exactly-once delivery.",
      "outcomeEmotion": "happy",
      "outcomeNote": "Deduplication must cover the side effect, not just the queue message. Next pressure: Safe retries still need pacing when a downstream provider is overloaded."
    },
    {
      "id": "014-bounded",
      "label": "Quarantine ambiguous attempts for review",
      "description": "Persist uncertain results and reconcile provider receipts before a human-approved retry.",
      "cost": 1800,
      "tone": "neutral",
      "effects": {
        "users": 42000,
        "monthlyRevenue": 19600,
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
        "upside": "Avoids blind duplication even without provider idempotency.",
        "downside": "Manual review delays receipts and raises support cost.",
        "jimmyExplanation": "Avoids blind duplication even without provider idempotency. Manual review delays receipts and raises support cost.",
        "effectReasons": {
          "upfrontCost": "$1,800 funds this rollout, verification and migration effort.",
          "monthlyBurn": "The monthly change is $+2,125, including 0 hires and the operating costs of this response.",
          "reliability": "Manual review delays receipts and raises support cost.",
          "customerTrust": "Merchant retention follows the response’s stated service contract and remaining risk.",
          "complexity": "Operational load includes the rollout, ownership and ongoing failure modes described here."
        }
      },
      "architectureChanges": changesFor("reviewed-effects"),
      "outcomeTitle": "A narrower contract, deliberately.",
      "outcomeDialogue": "Avoids blind duplication even without provider idempotency. Manual review delays receipts and raises support cost.",
      "outcomeEmotion": "thinking",
      "outcomeNote": "Deduplication must cover the side effect, not just the queue message. Next pressure: Safe retries still need pacing when a downstream provider is overloaded."
    },
    {
      "id": "014-shortcut",
      "label": "Acknowledge before performing the action",
      "description": "Remove the queue message before sending the invoice.",
      "cost": 2600,
      "tone": "risky",
      "effects": {
        "users": 18000,
        "monthlyRevenue": 8400,
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
        "upside": "A crash after acknowledgement will not trigger redelivery.",
        "downside": "A crash before the effect now loses work permanently; duplicates became omissions.",
        "jimmyExplanation": "A crash after acknowledgement will not trigger redelivery. A crash before the effect now loses work permanently; duplicates became omissions.",
        "effectReasons": {
          "upfrontCost": "$2,600 funds this rollout, verification and migration effort.",
          "monthlyBurn": "The monthly change is $+2,875, including 0 hires and the operating costs of this response.",
          "reliability": "A crash before the effect now loses work permanently; duplicates became omissions.",
          "customerTrust": "Merchant retention follows the response’s stated service contract and remaining risk.",
          "complexity": "Operational load includes the rollout, ownership and ongoing failure modes described here."
        }
      },
      "architectureChanges": changesFor("early-ack"),
      "outcomeTitle": "The trade-off catches up.",
      "outcomeDialogue": "A crash after acknowledgement will not trigger redelivery. A crash before the effect now loses work permanently; duplicates became omissions.",
      "outcomeEmotion": "concerned",
      "outcomeNote": "Deduplication must cover the side effect, not just the queue message. The retained risk remains part of your company’s architecture."
    }
  ],
  "hints": [
    "At-least-once processing repeats an externally committed effect when acknowledgement is lost.",
    "Deduplication must cover the side effect, not just the queue message."
  ],
  "lesson": "Deduplication must cover the side effect, not just the queue message.",
  "variants": [
    {
      "id": "without-job-queue",
      "when": {
        "missingAny": [
          "job-queue"
        ]
      },
      "description": "Without a durable broker, an audit compares committed orders and provider receipts. Some calls timed out after provider acceptance, and volatile work may be missing entirely. Reconciliation can duplicate an action; establish durable attempt records before retrying rather than assuming a recovery task already exists.",
      "metrics": [
        {
          "label": "Ambiguous timeout attempts",
          "value": "1.8%",
          "severity": "warning"
        },
        {
          "label": "Duplicate provider effects",
          "value": "1.6%",
          "severity": "critical"
        },
        {
          "label": "Boundary",
          "value": "provider accepted; caller timed out",
          "severity": "warning"
        }
      ],
      "dialogue": [
        {
          "character": "jimmy",
          "emotion": "thinking",
          "text": "Without a durable broker, an audit compares committed orders and provider receipts. Some calls timed out after provider acceptance, and volatile work may be missing entirely. Reconciliation can duplicate an action; establish durable attempt records before retrying rather than assuming a recovery task already exists."
        },
        {
          "character": "jimmy",
          "emotion": "thinking",
          "text": "The provider did its job; our worker never acknowledged it. Redelivery is doing exactly what we asked. Repeating the attempt must preserve the same intent."
        }
      ]
    }
  ]
});
