import { defineStartupLevel, changesFor } from "./authoring";

export const level014 = defineStartupLevel({
  "levelNumber": 14,
  "title": "Two Receipts for One Order",
  "description": "Customers complain they are receiving duplicate invoice emails for the exact same order. Logs show that our receipt worker sent the email, but crashed right before acknowledging the message back to the queue. The queue broker assumed the job failed and redelivered it to another worker, who sent the email a second time.",
  "dialogue": [
      {
          "character": "byte",
          "emotion": "thinking",
          "text": "Message queues guarantee 'at-least-once' delivery, never 'exactly-once.' If a worker crashes after calling the email provider but before telling the queue it finished, that job will be redelivered. Your worker must be idempotent."
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
        "byteExplanation": "We pass a deterministic idempotency key (like receipt-order-12345) to the email and invoice provider, and record the completed delivery in our database before acknowledging the queue. If the job is redelivered, our worker checks the database or provider, sees the key was already processed, and cleanly acknowledges without sending a duplicate.",
        "effectReasons": {
          "upfrontCost": "$2,200 covers idempotency token generation, provider key integration, and receipt ledger tables.",
          "monthlyBurn": "Recording delivery keys and monitoring idempotency conflicts adds $1,200/month.",
          "reliability": "Guarantees that network retries and worker crashes never duplicate external side effects.",
          "customerTrust": "Shoppers receive exactly one clean receipt email, restoring confidence in billing accuracy.",
          "complexity": "Workers must now record execution states and verify idempotency keys before executing side effects."
        }
      },
      "architectureChanges": changesFor("idempotent-effects"),
      "outcomeTitle": "A retry keeps the same identity.",
      "outcomeDialogue": "Duplicate receipts are eliminated! Even when workers crash or networks retry, the idempotency key ensures the external provider only sends one invoice per order.",
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
        "byteExplanation": "Recording delivery intents in a local database table and delaying queue retries by 30 seconds catches most duplicate deliveries. It handles our current volume well, though it doesn't utilize provider-level idempotency APIs.",
        "effectReasons": {
          "upfrontCost": "$990 covers building the local deduplication table and retry delay middleware.",
          "monthlyBurn": "Database deduplication query load adds $1,080/month.",
          "reliability": "Substantially cuts duplicate side effects using local transaction records.",
          "customerTrust": "Nearly all duplicate receipt complaints disappear, protecting merchant reputation.",
          "complexity": "Requires maintaining deduplication tables and running periodic cleanup of expired tokens."
        }
      },
      "architectureChanges": changesFor("reviewed-effects"),
      "outcomeTitle": "A narrower contract, deliberately.",
      "outcomeDialogue": "The local deduplication ledger caught 98% of duplicate attempts. It is a reliable internal fix, even if third-party provider deduplication isn't integrated.",
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
        "byteExplanation": "Acknowledging the queue message BEFORE executing the work is the worst thing you can do. If the worker marks the job as done and then immediately crashes or hits an exception, that receipt is completely lost with zero retries. You traded duplicates for silent data loss!",
        "effectReasons": {
          "upfrontCost": "$1,430 is wasted on an unsafe early-acknowledgement queue pattern.",
          "monthlyBurn": "Queue telemetry and lost-message investigation add $1,380/month.",
          "reliability": "Workers that crash mid-task permanently lose jobs because the queue already marked them as completed.",
          "customerTrust": "Customers never receive their purchase confirmation, creating confusion and customer support backlogs.",
          "complexity": "Tracking down silently dropped jobs with no queue audit trail is an engineering nightmare."
        }
      },
      "architectureChanges": changesFor("early-ack"),
      "outcomeTitle": "The trade-off catches up.",
      "outcomeDialogue": "Disaster! Acknowledging messages before execution stopped duplicates, but when our email worker ran out of memory, 80 orders silently had their receipts dropped forever without any retry.",
      "outcomeEmotion": "concerned",
      "outcomeNote": "Deduplication must cover the side effect, not just the queue message. The retained risk remains part of your company’s architecture."
    }
  ],
  "hints": [
    "At-least-once processing repeats an externally committed effect when acknowledgement is lost.",
    "Deduplication must cover the side effect, not just the queue message."
  ],
  "lesson": "Queues deliver messages 'at least once.' Any worker that produces external side effects (charging cards, sending emails) must be idempotent: doing it twice must produce the same result as doing it once.",
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
          "character": "byte",
          "emotion": "thinking",
          "text": "Without a durable broker, an audit compares committed orders and provider receipts. Some calls timed out after provider acceptance, and volatile work may be missing entirely. Reconciliation can duplicate an action; establish durable attempt records before retrying rather than assuming a recovery task already exists."
        },
        {
          "character": "byte",
          "emotion": "thinking",
          "text": "The provider did its job; our worker never acknowledged it. Redelivery is doing exactly what we asked. Repeating the attempt must preserve the same intent."
        }
      ]
    }
  ]
});
