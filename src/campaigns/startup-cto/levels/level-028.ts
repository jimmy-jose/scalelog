import { defineStartupLevel, changesFor } from "./authoring";

export const level028 = defineStartupLevel({
  "levelNumber": 28,
  "title": "The Field That Broke Three Teams",
  "description": "A producer replaces amount_cents with amount in decimal currency units. Old consumers accept the field but interpret the units incorrectly. Replays must still read last month’s events.",
  "dialogue": [
    {
      "character": "jimmy",
      "emotion": "thinking",
      "text": "Both payloads are valid JSON. They mean different amounts of money. Compatibility tests need to care about units and last month’s retained events."
    }
  ],
  "metrics": [
    {
      "label": "Consumers upgraded",
      "value": "1 of 3",
      "severity": "warning"
    },
    {
      "label": "Replayed event retention",
      "value": "30 days",
      "severity": "normal"
    },
    {
      "label": "Contract checks",
      "value": "shape only; no unit checks",
      "severity": "critical"
    }
  ],
  "choices": [
    {
      "id": "028-measured",
      "label": "Evolve a versioned contract additively",
      "description": "Keep amount_cents unchanged, add explicit currency and versioned new fields, run consumer-driven semantic tests and dual-read during a measured migration; retire only after retention and consumer checks.",
      "cost": 26000,
      "tone": "recommended",
      "effects": {
        "users": 200000,
        "monthlyRevenue": 95000,
        "monthlyBurn": 10000,
        "engineers": 0,
        "reliability": 3,
        "customerTrust": 2,
        "complexity": -2,
        "xp": 220,
        "confidence": 8
      },
      "tradeoff": {
        "upsideLabel": "Targeted improvement",
        "downsideLabel": "Cost and ownership",
        "upside": "Old and new consumers coexist and retained events remain interpretable.",
        "downside": "Compatibility windows cost storage and engineering effort; versions do not fix meaning automatically.",
        "jimmyExplanation": "Old and new consumers coexist and retained events remain interpretable. Compatibility windows cost storage and engineering effort; versions do not fix meaning automatically.",
        "effectReasons": {
          "upfrontCost": "$26,000 funds this rollout, verification and migration effort.",
          "monthlyBurn": "The monthly change is $+10,000, including 0 hires and the operating costs of this response.",
          "reliability": "Compatibility windows cost storage and engineering effort; versions do not fix meaning automatically.",
          "customerTrust": "Merchant retention follows the response’s stated service contract and remaining risk.",
          "complexity": "Operational load includes the rollout, ownership and ongoing failure modes described here."
        }
      },
      "architectureChanges": changesFor("versioned-events"),
      "outcomeTitle": "Old and new events can coexist.",
      "outcomeDialogue": "Old and new consumers coexist and retained events remain interpretable. Compatibility windows cost storage and engineering effort; versions do not fix meaning automatically.",
      "outcomeEmotion": "happy",
      "outcomeNote": "Event compatibility includes meaning, units, ordering and old retained data. Next pressure: More independently failing paths make correlation across logs and traces essential."
    },
    {
      "id": "028-bounded",
      "label": "Coordinate a paused cutover and replay adapter",
      "description": "Pause publishers, migrate every consumer and provide an adapter for retained old events before resuming.",
      "cost": 11700,
      "tone": "neutral",
      "effects": {
        "users": 140000,
        "monthlyRevenue": 66500,
        "monthlyBurn": 8500,
        "engineers": 0,
        "reliability": 1,
        "customerTrust": 1,
        "complexity": 0,
        "xp": 110,
        "confidence": 3
      },
      "tradeoff": {
        "upsideLabel": "Smaller contract",
        "downsideLabel": "Limits accepted",
        "upside": "A tightly coordinated small system can make one deliberate incompatible cutover.",
        "downside": "All teams share a release window and downtime; independent delivery is temporarily lost.",
        "jimmyExplanation": "A tightly coordinated small system can make one deliberate incompatible cutover. All teams share a release window and downtime; independent delivery is temporarily lost.",
        "effectReasons": {
          "upfrontCost": "$11,700 funds this rollout, verification and migration effort.",
          "monthlyBurn": "The monthly change is $+8,500, including 0 hires and the operating costs of this response.",
          "reliability": "All teams share a release window and downtime; independent delivery is temporarily lost.",
          "customerTrust": "Merchant retention follows the response’s stated service contract and remaining risk.",
          "complexity": "Operational load includes the rollout, ownership and ongoing failure modes described here."
        }
      },
      "architectureChanges": changesFor("versioned-events", "coordinated-releases"),
      "outcomeTitle": "A narrower contract, deliberately.",
      "outcomeDialogue": "A tightly coordinated small system can make one deliberate incompatible cutover. All teams share a release window and downtime; independent delivery is temporarily lost.",
      "outcomeEmotion": "thinking",
      "outcomeNote": "Event compatibility includes meaning, units, ordering and old retained data. Next pressure: More independently failing paths make correlation across logs and traces essential."
    },
    {
      "id": "028-shortcut",
      "label": "Rename the field and deploy producers first",
      "description": "Publish the new meaning under the old event name and rely on consumers ignoring unknown fields.",
      "cost": 16900,
      "tone": "risky",
      "effects": {
        "users": 60000,
        "monthlyRevenue": 28500,
        "monthlyBurn": 11500,
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
        "upside": "Producer work can ship quickly without a migration window.",
        "downside": "Ignoring fields does not protect consumers from changed units or removed required data.",
        "jimmyExplanation": "Producer work can ship quickly without a migration window. Ignoring fields does not protect consumers from changed units or removed required data.",
        "effectReasons": {
          "upfrontCost": "$16,900 funds this rollout, verification and migration effort.",
          "monthlyBurn": "The monthly change is $+11,500, including 0 hires and the operating costs of this response.",
          "reliability": "Ignoring fields does not protect consumers from changed units or removed required data.",
          "customerTrust": "Merchant retention follows the response’s stated service contract and remaining risk.",
          "complexity": "Operational load includes the rollout, ownership and ongoing failure modes described here."
        }
      },
      "architectureChanges": changesFor("breaking-events"),
      "outcomeTitle": "The trade-off catches up.",
      "outcomeDialogue": "Producer work can ship quickly without a migration window. Ignoring fields does not protect consumers from changed units or removed required data.",
      "outcomeEmotion": "concerned",
      "outcomeNote": "Event compatibility includes meaning, units, ordering and old retained data. The retained risk remains part of your company’s architecture."
    }
  ],
  "hints": [
    "An incompatible semantic change crosses independently deployed consumer versions.",
    "Event compatibility includes meaning, units, ordering and old retained data."
  ],
  "lesson": "Event compatibility includes meaning, units, ordering and old retained data.",
  "variants": [
    {
      "id": "without-reliable-projections",
      "when": {
        "missingAny": [
          "reliable-projections"
        ]
      },
      "description": "Subscriber delivery is still incomplete after the prior queue decision. A producer rollout now changes money units as well. The compatible-contract response includes repairing fan-out before claiming independent consumers are healthy.",
      "metrics": [
        {
          "label": "Delivery semantics",
          "value": "competing; incomplete",
          "severity": "critical"
        },
        {
          "label": "Money units",
          "value": "cents → decimal",
          "severity": "critical"
        },
        {
          "label": "Retained old events",
          "value": "30 days",
          "severity": "normal"
        }
      ],
      "dialogue": [
        {
          "character": "jimmy",
          "emotion": "thinking",
          "text": "Subscriber delivery is still incomplete after the prior queue decision. A producer rollout now changes money units as well. The compatible-contract response includes repairing fan-out before claiming independent consumers are healthy."
        },
        {
          "character": "jimmy",
          "emotion": "thinking",
          "text": "Both payloads are valid JSON. They mean different amounts of money. Compatibility tests need to care about units and last month’s retained events."
        }
      ]
    }
  ],
  "recoveries": [
    {
      "capability": "reliable-projections",
      "choiceIds": [
        "028-measured",
        "028-bounded"
      ],
      "description": "Repair independent subscriber delivery before rolling out their contracts.",
      "cost": 6000,
      "monthlyBurn": 1800,
      "complexity": 1,
      "architectureChanges": changesFor("event-fanout", "reliable-projections")
    }
  ]
});
