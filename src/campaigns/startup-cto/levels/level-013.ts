import { defineStartupLevel, changesFor } from "./authoring";

export const level013 = defineStartupLevel({
  "levelNumber": 13,
  "title": "The Receipt Holds the Checkout",
  "description": "A successful order waits for invoice rendering and an email API before the buyer sees confirmation. Jimmy’s trace separates the durable order transaction from non-critical side effects.",
  "dialogue": [
    {
      "character": "jimmy",
      "emotion": "thinking",
      "text": "The order commits in ninety milliseconds. The buyer is waiting for a PDF and an email. Which work belongs inside the confirmation deadline?"
    }
  ],
  "metrics": [
    {
      "label": "Checkout p95",
      "value": "3.4 s",
      "severity": "critical"
    },
    {
      "label": "Order transaction p95",
      "value": "90 ms",
      "severity": "normal"
    },
    {
      "label": "Invoice + email span",
      "value": "2.9 s",
      "severity": "critical"
    }
  ],
  "choices": [
    {
      "id": "013-measured",
      "label": "Queue invoices and receipts",
      "description": "Commit the order first, enqueue a durable job, and return the order ID. Reconcile orders missing a job until a transactional handoff is introduced; keep payment authorization synchronous.",
      "cost": 4500,
      "tone": "recommended",
      "effects": {
        "users": 60000,
        "monthlyRevenue": 24000,
        "monthlyBurn": 3500,
        "engineers": 0,
        "reliability": 0,
        "customerTrust": 2,
        "complexity": 1,
        "xp": 180,
        "confidence": 8
      },
      "tradeoff": {
        "upsideLabel": "Targeted improvement",
        "downsideLabel": "Cost and ownership",
        "upside": "Checkout no longer waits for PDF or mail work; workers scale separately.",
        "downside": "A commit/publish gap remains under reconciliation, and workers need retry and duplicate handling.",
        "jimmyExplanation": "Checkout no longer waits for PDF or mail work; workers scale separately. A commit/publish gap remains under reconciliation, and workers need retry and duplicate handling.",
        "effectReasons": {
          "upfrontCost": "$4,500 funds this rollout, verification and migration effort.",
          "monthlyBurn": "The monthly change is $+3,500, including 0 hires and the operating costs of this response.",
          "reliability": "A commit/publish gap remains under reconciliation, and workers need retry and duplicate handling.",
          "customerTrust": "Merchant retention follows the response’s stated service contract and remaining risk.",
          "complexity": "Operational load includes the rollout, ownership and ongoing failure modes described here."
        }
      },
      "architectureChanges": changesFor("job-queue"),
      "outcomeTitle": "The receipt leaves the critical path.",
      "outcomeDialogue": "Checkout no longer waits for PDF or mail work; workers scale separately. A commit/publish gap remains under reconciliation, and workers need retry and duplicate handling.",
      "outcomeEmotion": "happy",
      "outcomeNote": "Move deferrable work behind a durable handoff; asynchronous does not mean unreliable. Next pressure: At-least-once delivery will expose duplicate execution; a crash between commit and publish will later expose a dual-write gap."
    },
    {
      "id": "013-bounded",
      "label": "Keep synchronous work with a strict deadline",
      "description": "Keep receipts inline with provider timeouts and a persisted reconciliation task for deferred failures.",
      "cost": 2025,
      "tone": "neutral",
      "effects": {
        "users": 42000,
        "monthlyRevenue": 16800,
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
        "upside": "Less infrastructure and bounded request time can work at modest volume.",
        "downside": "App slots still wait on I/O; the deadline does not make slow work finish faster.",
        "jimmyExplanation": "Less infrastructure and bounded request time can work at modest volume. App slots still wait on I/O; the deadline does not make slow work finish faster.",
        "effectReasons": {
          "upfrontCost": "$2,025 funds this rollout, verification and migration effort.",
          "monthlyBurn": "The monthly change is $+2,975, including 0 hires and the operating costs of this response.",
          "reliability": "App slots still wait on I/O; the deadline does not make slow work finish faster.",
          "customerTrust": "Merchant retention follows the response’s stated service contract and remaining risk.",
          "complexity": "Operational load includes the rollout, ownership and ongoing failure modes described here."
        }
      },
      "architectureChanges": changesFor("local-dispatch"),
      "outcomeTitle": "A narrower contract, deliberately.",
      "outcomeDialogue": "Less infrastructure and bounded request time can work at modest volume. App slots still wait on I/O; the deadline does not make slow work finish faster.",
      "outcomeEmotion": "thinking",
      "outcomeNote": "Move deferrable work behind a durable handoff; asynchronous does not mean unreliable. Next pressure: At-least-once delivery will expose duplicate execution; a crash between commit and publish will later expose a dual-write gap."
    },
    {
      "id": "013-shortcut",
      "label": "Spawn a process after returning HTTP 200",
      "description": "Fire off invoice work in local process memory with no durable job record.",
      "cost": 2925,
      "tone": "risky",
      "effects": {
        "users": 18000,
        "monthlyRevenue": 7200,
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
        "upside": "The buyer sees a quick response with minimal implementation.",
        "downside": "Host termination or deploys can lose receipts; response success does not establish durable handoff.",
        "jimmyExplanation": "The buyer sees a quick response with minimal implementation. Host termination or deploys can lose receipts; response success does not establish durable handoff.",
        "effectReasons": {
          "upfrontCost": "$2,925 funds this rollout, verification and migration effort.",
          "monthlyBurn": "The monthly change is $+4,025, including 0 hires and the operating costs of this response.",
          "reliability": "Host termination or deploys can lose receipts; response success does not establish durable handoff.",
          "customerTrust": "Merchant retention follows the response’s stated service contract and remaining risk.",
          "complexity": "Operational load includes the rollout, ownership and ongoing failure modes described here."
        }
      },
      "architectureChanges": changesFor("volatile-jobs"),
      "outcomeTitle": "The trade-off catches up.",
      "outcomeDialogue": "The buyer sees a quick response with minimal implementation. Host termination or deploys can lose receipts; response success does not establish durable handoff.",
      "outcomeEmotion": "concerned",
      "outcomeNote": "Move deferrable work behind a durable handoff; asynchronous does not mean unreliable. The retained risk remains part of your company’s architecture."
    }
  ],
  "hints": [
    "Non-critical synchronous work extends the checkout critical path.",
    "Move deferrable work behind a durable handoff; asynchronous does not mean unreliable."
  ],
  "lesson": "Move deferrable work behind a durable handoff; asynchronous does not mean unreliable."
});
