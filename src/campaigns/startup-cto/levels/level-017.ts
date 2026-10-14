import { defineStartupLevel, changesFor } from "./authoring";

export const level017 = defineStartupLevel({
  "levelNumber": 17,
  "title": "Paid Order, Missing Event",
  "description": "During a software deployment, a server is gracefully shut down. In that exact millisecond, an order API request commits a $500 order into PostgreSQL, but the server is terminated before it can execute queue.push('order.created'). The merchant was paid, but the shipping notification and receipt were never queued. You cannot atomically write to a database and a message queue in one step.",
  "dialogue": [
      {
          "character": "byte",
          "emotion": "thinking",
          "text": "This is the dreaded 'Dual-Write Problem.' PostgreSQL and your message broker are two completely separate distributed systems. You cannot wrap a SQL COMMIT and a queue PUBLISH in a single transaction. If the server dies between the two lines of code, you get silent data loss."
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
        "byteExplanation": "The Transactional Outbox pattern is the industry standard solution: when an order is created, we insert an outbox record into PostgreSQL inside the exact same SQL transaction as the orders row. If the transaction commits, both are saved 100% atomically. A separate lightweight outbox relay process reads new outbox rows, publishes them to the queue, and marks them as sent.",
        "effectReasons": {
          "upfrontCost": "$3,200 covers creating the outbox schema, transaction integration, outbox relay worker deployment, and reconciliation drills.",
          "monthlyBurn": "Running the outbox relay process and monitoring outbox table lag adds $1,700/month.",
          "reliability": "Guarantees zero lost events during server crashes, network partitions, or rapid deployments.",
          "customerTrust": "Every single paid order is guaranteed to receive its receipt, inventory update, and shipping notification.",
          "complexity": "Adds an outbox table to maintain, outbox polling or CDC relay processes, and outbox table row pruning."
        }
      },
      "architectureChanges": changesFor("job-queue", "outbox", "durable-handoff"),
      "outcomeTitle": "The order carries its delivery intent.",
      "outcomeDialogue": "The dual-write gap is closed! Order creation and event generation are now 100% atomic in PostgreSQL. Even if servers are abruptly terminated during deployments, the outbox relay picks up where they left off without losing a single event.",
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
        "byteExplanation": "A periodic reconciliation cron job that queries PostgreSQL for orders with missing notifications every 10 minutes catches missed events after the fact. It works as a safety net, but notifications can be delayed by up to 10 minutes.",
        "effectReasons": {
          "upfrontCost": "$1,440 covers building the database reconciliation scanner and backfill dispatcher.",
          "monthlyBurn": "Running scheduled database reconciliation sweeps adds $1,530/month.",
          "reliability": "Catches dropped events eventually, though events suffer up to 10 minutes of reconciliation delay.",
          "customerTrust": "Customers receive notifications reliably, though slight post-deploy delays occasionally prompt questions.",
          "complexity": "Requires maintaining audit reconciliation queries and ensuring backfill jobs don't overload the primary database."
        }
      },
      "architectureChanges": changesFor("local-dispatch", "durable-handoff"),
      "outcomeTitle": "A narrower contract, deliberately.",
      "outcomeDialogue": "The reconciliation script caught the missing orders and dispatched their events. It is a functional safety net, though customers sometimes wait 10 minutes for their receipts after deployments.",
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
        "byteExplanation": "Publishing to the message queue BEFORE committing the database transaction just flips the disaster around. If the queue publish succeeds, but the database commit fails due to a constraint violation or lock timeout, your workers will process an order that does not actually exist in the database!",
        "effectReasons": {
          "upfrontCost": "$2,080 is spent implementing publish-before-commit logic.",
          "monthlyBurn": "Handling phantom order investigations and data fixes adds $1,955/month.",
          "reliability": "Causes ghost events where downstream workers execute tasks for transactions that were rolled back.",
          "customerTrust": "Customers are horrified when they receive confirmation emails for failed or declined orders.",
          "complexity": "Untangling phantom orders across databases, payment processors, and customer support consumes massive time."
        }
      },
      "architectureChanges": changesFor("publish-before-commit"),
      "outcomeTitle": "The trade-off catches up.",
      "outcomeDialogue": "Disaster! Publishing before commit meant that when an order failed validation, the queue still sent out a confirmation email! Customers received receipts for orders that never existed in the database.",
      "outcomeEmotion": "concerned",
      "outcomeNote": "Transactional outbox closes a dual-write gap but still needs idempotent consumers. The retained risk remains part of your company’s architecture."
    }
  ],
  "hints": [
    "Two independent writes are not atomic; a healthy broker cannot receive a publish that never occurred.",
    "Transactional outbox closes a dual-write gap but still needs idempotent consumers."
  ],
  "lesson": "Solve the dual-write problem with the Transactional Outbox pattern: save the event into an outbox table inside the exact same database transaction as the business entity, then let a reliable relay publish it.",
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
          "character": "byte",
          "emotion": "thinking",
          "text": "Your receipt path has no broker. An audit finds a crash boundary between committing orders and recording delivery work. Make delivery intent transactional, then choose broker publication or direct polling with a weaker delay contract."
        },
        {
          "character": "byte",
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
