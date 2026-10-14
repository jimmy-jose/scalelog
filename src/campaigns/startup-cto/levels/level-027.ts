import { defineStartupLevel, changesFor } from "./authoring";

export const level027 = defineStartupLevel({
  variants: [{
    id: "fanout-prototype", when: { missingAny: ["job-queue", "search-projection"] },
    description: "The expansion team tests three independent projections: receipts, analytics and a proposed search feed. Your current delivery path is not a complete broadcast system. In the prototype, competing consumers each receive only a third of the events. Choose reliable fan-out semantics without assuming every proposed consumer is already deployed.",
    metrics: [
      { label: "Proposed subscribers", value: "3 independent projections", severity: "normal" },
      { label: "Prototype delivery per subscriber", value: "about 1/3", severity: "critical" },
      { label: "Durable source record", value: "verify intent and handoff", severity: "normal" },
    ],
    dialogue: [{ character: "jimmy", emotion: "thinking", text: "Your current transport can keep doing its job. But three distinct projections each need a copy; distributing one copy among them is the wrong relationship." }],
  }],
  "levelNumber": 27,
  "title": "One Event, Three Different Jobs",
  "description": "Search indexing, receipts and merchant analytics now share a competing-consumer queue. Engineers discover that each event goes to only one consumer rather than all interested projections.",
  "dialogue": [
    {
      "character": "jimmy",
      "emotion": "thinking",
      "text": "Those workers are not interchangeable. Search, receipts and analytics each need the event. Competing for one copy gives us the wrong delivery semantics."
    },
    {
      "character": "jimmy",
      "emotion": "normal",
      "text": "This month’s operating plan adds 2 engineers. Their compensation is included in every response’s recurring burn. Ownership has to grow with the architecture."
    }
  ],
  "metrics": [
    {
      "label": "Consumers needing every event",
      "value": "3",
      "severity": "normal"
    },
    {
      "label": "Each consumer sees",
      "value": "about 1/3",
      "severity": "critical"
    },
    {
      "label": "Committed-source delivery audit",
      "value": "inspect source handoff",
      "severity": "normal"
    }
  ],
  "choices": [
    {
      "id": "027-measured",
      "label": "Fan out into subscriber-owned queues",
      "description": "Publish committed events from the outbox or durable delivery ledger through a managed topic to one durable queue per subscriber, with retention, per-subscriber DLQs and idempotent consumers.",
      "cost": 28000,
      "tone": "recommended",
      "effects": {
        "users": 200000,
        "monthlyRevenue": 90000,
        "monthlyBurn": 23000,
        "engineers": 2,
        "reliability": 0,
        "customerTrust": 2,
        "complexity": 2,
        "xp": 220,
        "confidence": 8
      },
      "tradeoff": {
        "upsideLabel": "Targeted improvement",
        "downsideLabel": "Cost and ownership",
        "upside": "Each projection sees each event and can fail or scale independently.",
        "downside": "Fan-out multiplies stored work; global ordering is not promised and per-order versions need handling.",
        "jimmyExplanation": "Each projection sees each event and can fail or scale independently. Fan-out multiplies stored work; global ordering is not promised and per-order versions need handling.",
        "effectReasons": {
          "upfrontCost": "$28,000 funds this rollout, verification and migration effort.",
          "monthlyBurn": "The monthly change is $+23,000, including 2 hires and the operating costs of this response.",
          "reliability": "Fan-out multiplies stored work; global ordering is not promised and per-order versions need handling.",
          "customerTrust": "Merchant retention follows the response’s stated service contract and remaining risk.",
          "complexity": "Operational load includes the rollout, ownership and ongoing failure modes described here."
        }
      },
      "architectureChanges": changesFor("event-fanout", "reliable-projections"),
      "outcomeTitle": "Each subscriber gets its own delivery.",
      "outcomeDialogue": "Each projection sees each event and can fail or scale independently. Fan-out multiplies stored work; global ordering is not promised and per-order versions need handling.",
      "outcomeEmotion": "happy",
      "outcomeNote": "Choose messaging semantics for the consumer relationship. Next pressure: Independent subscribers deploy on different schedules and need compatible versioned contracts."
    },
    {
      "id": "027-bounded",
      "label": "Use one dispatcher with durable delivery records",
      "description": "Track per-subscriber completion durably in PostgreSQL and dispatch each destination independently.",
      "cost": 12600,
      "tone": "neutral",
      "effects": {
        "users": 140000,
        "monthlyRevenue": 63000,
        "monthlyBurn": 19550,
        "engineers": 2,
        "reliability": 1,
        "customerTrust": 1,
        "complexity": 0,
        "xp": 110,
        "confidence": 3
      },
      "tradeoff": {
        "upsideLabel": "Smaller contract",
        "downsideLabel": "Limits accepted",
        "upside": "A database-backed dispatcher can supply the same logical fan-out at moderate volume.",
        "downside": "More polling and custom dispatch logic burden the core team; it needs the same duplicate and retry discipline.",
        "jimmyExplanation": "A database-backed dispatcher can supply the same logical fan-out at moderate volume. More polling and custom dispatch logic burden the core team; it needs the same duplicate and retry discipline.",
        "effectReasons": {
          "upfrontCost": "$12,600 funds this rollout, verification and migration effort.",
          "monthlyBurn": "The monthly change is $+19,550, including 2 hires and the operating costs of this response.",
          "reliability": "More polling and custom dispatch logic burden the core team; it needs the same duplicate and retry discipline.",
          "customerTrust": "Merchant retention follows the response’s stated service contract and remaining risk.",
          "complexity": "Operational load includes the rollout, ownership and ongoing failure modes described here."
        }
      },
      "architectureChanges": changesFor("dispatch-fanout", "reliable-projections", "local-dispatch"),
      "outcomeTitle": "A narrower contract, deliberately.",
      "outcomeDialogue": "A database-backed dispatcher can supply the same logical fan-out at moderate volume. More polling and custom dispatch logic burden the core team; it needs the same duplicate and retry discipline.",
      "outcomeEmotion": "thinking",
      "outcomeNote": "Choose messaging semantics for the consumer relationship. Next pressure: Independent subscribers deploy on different schedules and need compatible versioned contracts."
    },
    {
      "id": "027-shortcut",
      "label": "Add more consumers to the same queue",
      "description": "Scale search, mail and analytics consumer counts on the existing work queue.",
      "cost": 18200,
      "tone": "risky",
      "effects": {
        "users": 60000,
        "monthlyRevenue": 27000,
        "monthlyBurn": 26450,
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
        "upside": "More consumers increase throughput for interchangeable workers.",
        "downside": "They divide work further instead of ensuring all distinct subscribers receive it.",
        "jimmyExplanation": "More consumers increase throughput for interchangeable workers. They divide work further instead of ensuring all distinct subscribers receive it.",
        "effectReasons": {
          "upfrontCost": "$18,200 funds this rollout, verification and migration effort.",
          "monthlyBurn": "The monthly change is $+26,450, including 2 hires and the operating costs of this response.",
          "reliability": "They divide work further instead of ensuring all distinct subscribers receive it.",
          "customerTrust": "Merchant retention follows the response’s stated service contract and remaining risk.",
          "complexity": "Operational load includes the rollout, ownership and ongoing failure modes described here."
        }
      },
      "architectureChanges": changesFor("competing-projections"),
      "outcomeTitle": "The trade-off catches up.",
      "outcomeDialogue": "More consumers increase throughput for interchangeable workers. They divide work further instead of ensuring all distinct subscribers receive it.",
      "outcomeEmotion": "concerned",
      "outcomeNote": "Choose messaging semantics for the consumer relationship. The retained risk remains part of your company’s architecture."
    }
  ],
  "hints": [
    "A work queue distributes messages among competing consumers; it does not independently deliver every event to each subscriber.",
    "Choose messaging semantics for the consumer relationship."
  ],
  "lesson": "Choose messaging semantics for the consumer relationship.",
  "recoveries": [
    {
      "capability": "durable-handoff",
      "choiceIds": [
        "027-measured",
        "027-bounded"
      ],
      "description": "Repair the atomic event handoff before claiming reliable subscriber delivery.",
      "cost": 3500,
      "monthlyBurn": 900,
      "complexity": 1,
      "architectureChanges": changesFor("job-queue", "outbox", "durable-handoff")
    }
  ]
});
