import { defineStartupLevel, changesFor } from "./authoring";

export const level028 = defineStartupLevel({
  "levelNumber": 28,
  "title": "The Field That Broke Three Teams",
  "description": "A producer replaces amount_cents (an integer, e.g. 1500) with amount (a decimal float, e.g. 15.00) in order events. Old consumer services still receive the JSON payload, but interpret 15.00 as 15 cents instead of 15 dollars! Furthermore, when engineers try to replay historical events from last month, consumer services crash.",
  "dialogue": [
      {
          "character": "jimmy",
          "emotion": "thinking",
          "text": "Both payloads are valid JSON, but 1500 cents and 15.00 dollars mean wildly different things to downstream billing. Schema evolution isn't just about syntax; it's about semantic contracts and replaying historical data."
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
        "jimmyExplanation": "Keep amount_cents unchanged, add the new currency fields alongside it, and run automated consumer schema checks. Downstream services can migrate on their own timeline without breaking historical replays.",
        "effectReasons": {
          "upfrontCost": "$26,000 covers schema registry setup, contract test suites, and additive field migration tooling.",
          "monthlyBurn": "Schema registry hosting, compatibility validation, and contract testing cost $10,000/month.",
          "reliability": "Maintains backward and forward schema compatibility, ensuring old events and new consumers never crash.",
          "customerTrust": "Financial data, invoices, and analytics remain mathematically consistent across all merchant stores.",
          "complexity": "Requires teams to follow additive schema change workflows and maintain contract test suites."
        }
      },
      "architectureChanges": changesFor("versioned-events"),
      "outcomeTitle": "Old and new events can coexist.",
      "outcomeDialogue": "Additive schema versioning let all three downstream teams upgrade at their own pace. Replays of 30-day-old events still parse without a single error.",
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
        "jimmyExplanation": "A coordinated 'big bang' maintenance window upgrades all services at once. It avoids supporting dual schemas, but requires scheduling downtime and makes replaying older historical events impossible without custom translation scripts.",
        "effectReasons": {
          "upfrontCost": "$11,700 covers coordinated deployment planning, downtime scheduling, and manual verification scripts.",
          "monthlyBurn": "Cross-team deployment coordination and sync overhead cost $8,500/month.",
          "reliability": "Prevents active runtime errors during normal operation, but breaks historical event replaying and audit runs.",
          "customerTrust": "Downtime window frustrates international merchants, though live financial calculations remain accurate.",
          "complexity": "High organizational coordination required for every schema change; replay tooling becomes fragile."
        }
      },
      "architectureChanges": changesFor("versioned-events", "coordinated-releases"),
      "outcomeTitle": "A narrower contract, deliberately.",
      "outcomeDialogue": "The maintenance window finished cleanly, but we've locked ourselves out of replaying raw historical events without running translation shims.",
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
        "jimmyExplanation": "Yanking the old field and forcing everyone to scramble creates production calculation errors across analytics and billing. Fixing bugs live in production while corrupted events circulate is a nightmare.",
        "effectReasons": {
          "upfrontCost": "$16,900 is burned dealing with emergency production outages and customer financial discrepancies.",
          "monthlyBurn": "Emergency operational cleanup and ongoing bug investigations add $11,500/month.",
          "reliability": "Silent semantic corruption causes catastrophic errors in billing, analytics, and merchant payouts.",
          "customerTrust": "Incorrect billing and revenue reports cause serious merchant outrage and churn.",
          "complexity": "Massive technical debt from emergency hotfixes, corrupted database records, and manual data adjustments."
        }
      },
      "architectureChanges": changesFor("breaking-events"),
      "outcomeTitle": "The trade-off catches up.",
      "outcomeDialogue": "Analytics calculated monthly merchant revenue off by a factor of 100. We spent the weekend writing emergency data-patching scripts to fix corrupted financial reports.",
      "outcomeEmotion": "concerned",
      "outcomeNote": "Event compatibility includes meaning, units, ordering and old retained data. The retained risk remains part of your company’s architecture."
    }
  ],
  "hints": [
    "An incompatible semantic change crosses independently deployed consumer versions.",
    "Event compatibility includes meaning, units, ordering and old retained data."
  ],
  "lesson": "Treat event schemas as public APIs: never silently change the meaning or unit of an existing field (like changing cents to dollars). Add a new field, maintain backward compatibility, and remember that historical events stored in your log will still have the old format.",
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
