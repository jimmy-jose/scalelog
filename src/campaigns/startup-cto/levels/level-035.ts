import { defineStartupLevel, changesFor } from "./authoring";

export const level035 = defineStartupLevel({
  "levelNumber": 35,
  "title": "Protect the Checkout, Shed the Rest",
  "description": "A regional recovery rehearsal and a promotion overlap. Traffic tries to consume all recovered capacity. Core orders matter more than live analytics, fresh recommendations or bulk imports.",
  "dialogue": [
    {
      "character": "jimmy",
      "emotion": "thinking",
      "text": "We have more offered work than tested capacity. Choose which promises to keep first, and reject excess work before it traps the system in a backlog."
    }
  ],
  "metrics": [
    {
      "label": "Offered / tested recovery load",
      "value": "5,000 / 3,200 origin RPS",
      "severity": "critical"
    },
    {
      "label": "Worker backlog drain estimate",
      "value": "47 min",
      "severity": "warning"
    },
    {
      "label": "Checkout objective",
      "value": "p95 500 ms / p99 1.5 s",
      "severity": "normal"
    }
  ],
  "choices": [
    {
      "id": "035-measured",
      "label": "Reserve capacity and shed optional work",
      "description": "Reserve checkout concurrency, enforce tenant budgets, defer imports/analytics, serve bounded stale public content and reject excess non-critical work with retry guidance; monitor queue age and recovery load.",
      "cost": 50000,
      "tone": "recommended",
      "effects": {
        "users": 150000,
        "monthlyRevenue": 115000,
        "monthlyBurn": 20000,
        "engineers": 0,
        "reliability": 3,
        "customerTrust": 2,
        "complexity": -3,
        "xp": 240,
        "confidence": 8
      },
      "tradeoff": {
        "upsideLabel": "Targeted improvement",
        "downsideLabel": "Cost and ownership",
        "upside": "Accepted critical work stays within the measured latency envelope.",
        "downside": "Some features and requests are deliberately unavailable; deferred work needs a bounded drain plan.",
        "jimmyExplanation": "Accepted critical work stays within the measured latency envelope. Some features and requests are deliberately unavailable; deferred work needs a bounded drain plan.",
        "effectReasons": {
          "upfrontCost": "$50,000 funds this rollout, verification and migration effort.",
          "monthlyBurn": "The monthly change is $+20,000, including 0 hires and the operating costs of this response.",
          "reliability": "Some features and requests are deliberately unavailable; deferred work needs a bounded drain plan.",
          "customerTrust": "Merchant retention follows the response’s stated service contract and remaining risk.",
          "complexity": "Operational load includes the rollout, ownership and ongoing failure modes described here."
        }
      },
      "architectureChanges": changesFor("load-shedding", "priority-admission"),
      "outcomeTitle": "Checkout keeps its reserved budget.",
      "outcomeDialogue": "Accepted critical work stays within the measured latency envelope. Some features and requests are deliberately unavailable; deferred work needs a bounded drain plan.",
      "outcomeEmotion": "happy",
      "outcomeNote": "Admission control and graceful degradation protect explicit priorities within finite capacity. Next pressure: The final launch must combine these protections and prove them under one realistic test."
    },
    {
      "id": "035-bounded",
      "label": "Cap the entire site at a lower fixed rate",
      "description": "Apply one conservative admission cap and queue only durable accepted jobs.",
      "cost": 22500,
      "tone": "neutral",
      "effects": {
        "users": 105000,
        "monthlyRevenue": 80500,
        "monthlyBurn": 17000,
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
        "upside": "A simpler envelope prevents collapse without elaborate priorities.",
        "downside": "Checkout and optional work compete for the same quota; more valuable sales are rejected.",
        "jimmyExplanation": "A simpler envelope prevents collapse without elaborate priorities. Checkout and optional work compete for the same quota; more valuable sales are rejected.",
        "effectReasons": {
          "upfrontCost": "$22,500 funds this rollout, verification and migration effort.",
          "monthlyBurn": "The monthly change is $+17,000, including 0 hires and the operating costs of this response.",
          "reliability": "Checkout and optional work compete for the same quota; more valuable sales are rejected.",
          "customerTrust": "Merchant retention follows the response’s stated service contract and remaining risk.",
          "complexity": "Operational load includes the rollout, ownership and ongoing failure modes described here."
        }
      },
      "architectureChanges": changesFor("load-shedding", "global-admission"),
      "outcomeTitle": "A narrower contract, deliberately.",
      "outcomeDialogue": "A simpler envelope prevents collapse without elaborate priorities. Checkout and optional work compete for the same quota; more valuable sales are rejected.",
      "outcomeEmotion": "thinking",
      "outcomeNote": "Admission control and graceful degradation protect explicit priorities within finite capacity. Next pressure: The final launch must combine these protections and prove them under one realistic test."
    },
    {
      "id": "035-shortcut",
      "label": "Queue every incoming request without limits",
      "description": "Return acceptance for all requests and let queues absorb the full overload.",
      "cost": 32500,
      "tone": "risky",
      "effects": {
        "users": 45000,
        "monthlyRevenue": 34500,
        "monthlyBurn": 23000,
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
        "upside": "Short bursts can be smoothed when capacity catches up.",
        "downside": "Unbounded backlog violates deadlines and storage budgets; a queue cannot create sustained throughput.",
        "jimmyExplanation": "Short bursts can be smoothed when capacity catches up. Unbounded backlog violates deadlines and storage budgets; a queue cannot create sustained throughput.",
        "effectReasons": {
          "upfrontCost": "$32,500 funds this rollout, verification and migration effort.",
          "monthlyBurn": "The monthly change is $+23,000, including 0 hires and the operating costs of this response.",
          "reliability": "Unbounded backlog violates deadlines and storage budgets; a queue cannot create sustained throughput.",
          "customerTrust": "Merchant retention follows the response’s stated service contract and remaining risk.",
          "complexity": "Operational load includes the rollout, ownership and ongoing failure modes described here."
        }
      },
      "architectureChanges": changesFor("unbounded-backlog"),
      "outcomeTitle": "The trade-off catches up.",
      "outcomeDialogue": "Short bursts can be smoothed when capacity catches up. Unbounded backlog violates deadlines and storage budgets; a queue cannot create sustained throughput.",
      "outcomeEmotion": "concerned",
      "outcomeNote": "Admission control and graceful degradation protect explicit priorities within finite capacity. The retained risk remains part of your company’s architecture."
    }
  ],
  "hints": [
    "Offered work exceeds the tested recovery envelope; accepting everything turns overload into a cascading outage.",
    "Admission control and graceful degradation protect explicit priorities within finite capacity."
  ],
  "lesson": "Admission control and graceful degradation protect explicit priorities within finite capacity.",
  "variants": [
    {
      "id": "without-regional-dr",
      "when": {
        "missingAny": [
          "regional-dr"
        ]
      },
      "description": "Your route has no warm recovery region. A constrained-capacity restore/load rehearsal receives more work than the rebuilt deployment can serve. Protect checkout within the longer recovery tier you actually own.",
      "metrics": [
        {
          "label": "Offered / restored capacity",
          "value": "5,000 / 3,200 RPS",
          "severity": "critical"
        },
        {
          "label": "Regional premium RTO",
          "value": "not qualified",
          "severity": "warning"
        },
        {
          "label": "Backlog drain",
          "value": "47 min",
          "severity": "warning"
        }
      ],
      "dialogue": [
        {
          "character": "jimmy",
          "emotion": "thinking",
          "text": "Your route has no warm recovery region. A constrained-capacity restore/load rehearsal receives more work than the rebuilt deployment can serve. Protect checkout within the longer recovery tier you actually own."
        },
        {
          "character": "jimmy",
          "emotion": "thinking",
          "text": "We have more offered work than tested capacity. Choose which promises to keep first, and reject excess work before it traps the system in a backlog."
        }
      ]
    }
  ]
});
