import { defineStartupLevel, changesFor } from "./authoring";

export const level016 = defineStartupLevel({
  "levelNumber": 16,
  "title": "One Message Never Finishes",
  "description": "A merchant sends a malformed catalog event containing unexpected unicode characters that causes our JSON parsing library to crash with an unhandled exception. The worker crashes, the queue restarts the job, and the worker crashes again. This single broken 'poison pill' message is stuck at the head of the queue, blocking thousands of healthy orders behind it.",
  "dialogue": [
      {
          "character": "byte",
          "emotion": "thinking",
          "text": "This is a classic 'Poison Pill' message. It is completely corrupted, so no matter how many times we retry it, it will fail 100% of the time. Because it is stuck at the front of the queue, it is starving every valid merchant behind it."
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
        "byteExplanation": "A Dead-Letter Queue (DLQ) acts as a quarantine hospital: after a message fails 5 times, the broker automatically pulls it off the main queue and deposits it in the DLQ along with the stack trace and error payload. The main queue resumes processing at full speed, while engineers can inspect, fix, and safely replay the quarantined message later.",
        "effectReasons": {
          "upfrontCost": "$2,400 covers dead-letter queue routing, DLQ alerting, payload inspection tooling, and replay scripts.",
          "monthlyBurn": "Operating secondary DLQ storage and monitoring queue quarantine rates adds $1,300/month.",
          "reliability": "Eliminates head-of-line blocking so a single corrupted message cannot stall the entire processing pipeline.",
          "customerTrust": "Healthy merchant orders process without delay; affected merchants receive specific validation feedback.",
          "complexity": "The team must monitor DLQ depth, investigate quarantined payloads, and operate replay procedures."
        }
      },
      "architectureChanges": changesFor("dead-letter"),
      "outcomeTitle": "Bad work has a named owner.",
      "outcomeDialogue": "The poison pill was safely moved to the Dead-Letter Queue! The main queue immediately cleared its backlog of 5,000 valid orders, and Byte has the corrupt payload isolated for debugging.",
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
        "byteExplanation": "Dropping unparseable messages into an audit log table after 3 failed attempts clears the queue without building a separate DLQ infrastructure. It keeps the pipeline moving, though replaying fixed payloads requires manual database scripting.",
        "effectReasons": {
          "upfrontCost": "$1,080 covers error-logging handlers and manual discard rules.",
          "monthlyBurn": "Logging storage and audit table indexing add $1,170/month.",
          "reliability": "Prevents queue lockups by discarding unprocessable messages after bounded attempts.",
          "customerTrust": "Restores normal throughput for 99.9% of merchants, though the broken payload's merchant needs manual help.",
          "complexity": "Simple to implement, but manual event recovery from logs requires developer time."
        }
      },
      "architectureChanges": changesFor("parked-stream"),
      "outcomeTitle": "A narrower contract, deliberately.",
      "outcomeDialogue": "The broken message was logged to the database and cleared from the queue. Valid orders are flowing again, though replaying that merchant's event will require a manual script.",
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
        "byteExplanation": "Letting workers retry failing messages infinitely without a quarantine ceiling means one broken payload can permanently jam the queue. The queue will back up with tens of thousands of messages, latency will skyrocket, and workers will burn 100% CPU crashing and rebooting forever.",
        "effectReasons": {
          "upfrontCost": "$1,560 is wasted on unmonitored retry loops without dead-letter boundaries.",
          "monthlyBurn": "Wasted compute from endless worker crash-reboot cycles adds $1,495/month.",
          "reliability": "A single invalid payload causes complete head-of-line blocking across the entire asynchronous tier.",
          "customerTrust": "System-wide delivery delays anger thousands of merchants whose valid orders are stuck.",
          "complexity": "Emergency on-call firefighting is required to manually purge queues and restart worker fleets."
        }
      },
      "architectureChanges": changesFor("infinite-retries"),
      "outcomeTitle": "The trade-off catches up.",
      "outcomeDialogue": "The queue completely froze. 20 workers spent all night crashing on that single bad payload, while 15,000 healthy merchant orders piled up in the queue waiting for attention.",
      "outcomeEmotion": "concerned",
      "outcomeNote": "Quarantine poison work with evidence and a safe replay path. The retained risk remains part of your company’s architecture."
    }
  ],
  "hints": [
    "A permanent payload error cannot be repaired by time or additional retry capacity.",
    "Quarantine poison work with evidence and a safe replay path."
  ],
  "lesson": "Quarantine poison pills: route repeatedly failing messages to a Dead-Letter Queue (DLQ) with error diagnostics so the main queue can continue processing healthy traffic.",
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
          "character": "byte",
          "emotion": "thinking",
          "text": "A malformed integration payload fails every attempt in your local delivery/reconciliation loop. The tenant’s later work waits behind it. The quarantine decision applies to a durable failure table as well as a broker DLQ."
        },
        {
          "character": "byte",
          "emotion": "thinking",
          "text": "Forty-six attempts have not changed this payload. Keep the evidence, give someone ownership, and decide what ordering guarantees the healthy work still needs."
        }
      ]
    }
  ]
});
