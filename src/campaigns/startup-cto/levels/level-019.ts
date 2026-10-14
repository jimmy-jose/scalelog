import { defineStartupLevel, changesFor, disable } from "./authoring";

export const level019 = defineStartupLevel({
  "levelNumber": 19,
  "title": "Every Merchant Has a Dashboard",
  "description": "Personalized reports have low cross-user reuse. Query plans and indexes have been checked, but reads dominate primary CPU. These reports can tolerate five seconds of lag; checkout cannot.",
  "dialogue": [
    {
      "character": "jimmy",
      "emotion": "thinking",
      "text": "These reports are individually cheap and rarely reused. Together they consume the primary. Which readers can tolerate being a few seconds behind?"
    }
  ],
  "metrics": [
    {
      "label": "DB read/write mix",
      "value": "88% / 12%",
      "severity": "warning"
    },
    {
      "label": "Primary CPU / write p95",
      "value": "91% / 95 ms",
      "severity": "critical"
    },
    {
      "label": "Report cache reuse",
      "value": "8%",
      "severity": "normal"
    },
    {
      "label": "Reads / writes",
      "value": "9,000 / 1,200 QPS",
      "severity": "warning"
    }
  ],
  "choices": [
    {
      "id": "019-measured",
      "label": "Route tolerant reports to a read replica",
      "description": "Add an asynchronous PostgreSQL reader, measure replay lag, route only tolerant reports, and keep transactions and immediate confirmations on the primary.",
      "cost": 9000,
      "tone": "recommended",
      "effects": {
        "users": 140000,
        "monthlyRevenue": 50000,
        "monthlyBurn": 6500,
        "engineers": 0,
        "reliability": 0,
        "customerTrust": 2,
        "complexity": 1,
        "xp": 200,
        "confidence": 8
      },
      "tradeoff": {
        "upsideLabel": "Targeted improvement",
        "downsideLabel": "Cost and ownership",
        "upside": "Offloads read CPU while retaining one authoritative write path.",
        "downside": "Replica capacity, lag-aware routing and bounded primary fallback add operational cost.",
        "jimmyExplanation": "Offloads read CPU while retaining one authoritative write path. Replica capacity, lag-aware routing and bounded primary fallback add operational cost.",
        "effectReasons": {
          "upfrontCost": "$9,000 funds this rollout, verification and migration effort.",
          "monthlyBurn": "The monthly change is $+6,500, including 0 hires and the operating costs of this response.",
          "reliability": "Replica capacity, lag-aware routing and bounded primary fallback add operational cost.",
          "customerTrust": "Merchant retention follows the response’s stated service contract and remaining risk.",
          "complexity": "Operational load includes the rollout, ownership and ongoing failure modes described here."
        }
      },
      "architectureChanges": changesFor("read-replicas", "reader-routing"),
      "outcomeTitle": "Reports leave room for transactions.",
      "outcomeDialogue": "Offloads read CPU while retaining one authoritative write path. Replica capacity, lag-aware routing and bounded primary fallback add operational cost.",
      "outcomeEmotion": "happy",
      "outcomeNote": "Read replicas scale eligible reads, not write throughput. Next pressure: Replica lag will become visible when a newly created order is routed to a stale reader."
    },
    {
      "id": "019-bounded",
      "label": "Resize the primary for report headroom",
      "description": "Use a larger primary while enforcing query deadlines and keeping all reads current. Disable any earlier replica read route; retained replicas remain available for later review.",
      "cost": 4050,
      "tone": "neutral",
      "effects": {
        "users": 98000,
        "monthlyRevenue": 35000,
        "monthlyBurn": 9100,
        "engineers": 0,
        "reliability": 1,
        "customerTrust": 1,
        "complexity": 0,
        "xp": 100,
        "confidence": 3
      },
      "tradeoff": {
        "upsideLabel": "Smaller contract",
        "downsideLabel": "Limits accepted",
        "upside": "No read-consistency routing is needed today.",
        "downside": "An expensive single machine has finite CPU; maintenance shares the write failure domain.",
        "jimmyExplanation": "No read-consistency routing is needed today. An expensive single machine has finite CPU; maintenance shares the write failure domain.",
        "effectReasons": {
          "upfrontCost": "$4,050 funds this rollout, verification and migration effort.",
          "monthlyBurn": "The monthly change is $+9,100, including 0 hires and the operating costs of this response.",
          "reliability": "An expensive single machine has finite CPU; maintenance shares the write failure domain.",
          "customerTrust": "Merchant retention follows the response’s stated service contract and remaining risk.",
          "complexity": "Operational load includes the rollout, ownership and ongoing failure modes described here."
        }
      },
      "architectureChanges": [...changesFor("vertical-db", "primary-reads"), ...disable("reader-routing")],
      "outcomeTitle": "A narrower contract, deliberately.",
      "outcomeDialogue": "No read-consistency routing is needed today. An expensive single machine has finite CPU; maintenance shares the write failure domain.",
      "outcomeEmotion": "thinking",
      "outcomeNote": "Read replicas scale eligible reads, not write throughput. Next pressure: Replica lag will become visible when a newly created order is routed to a stale reader."
    },
    {
      "id": "019-shortcut",
      "label": "Send checkout writes to read replicas",
      "description": "Create replicas and round-robin inserts across them.",
      "cost": 5850,
      "tone": "risky",
      "effects": {
        "users": 42000,
        "monthlyRevenue": 15000,
        "monthlyBurn": 7475,
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
        "upside": "Multiple independent writers could scale writes in a different database design.",
        "downside": "Physical hot standbys are read-only; promoting independent writers does not synchronize concurrent updates.",
        "jimmyExplanation": "Multiple independent writers could scale writes in a different database design. Physical hot standbys are read-only; promoting independent writers does not synchronize concurrent updates.",
        "effectReasons": {
          "upfrontCost": "$5,850 funds this rollout, verification and migration effort.",
          "monthlyBurn": "The monthly change is $+7,475, including 0 hires and the operating costs of this response.",
          "reliability": "Physical hot standbys are read-only; promoting independent writers does not synchronize concurrent updates.",
          "customerTrust": "Merchant retention follows the response’s stated service contract and remaining risk.",
          "complexity": "Operational load includes the rollout, ownership and ongoing failure modes described here."
        }
      },
      "architectureChanges": changesFor("replica-write-routing"),
      "outcomeTitle": "The trade-off catches up.",
      "outcomeDialogue": "Multiple independent writers could scale writes in a different database design. Physical hot standbys are read-only; promoting independent writers does not synchronize concurrent updates.",
      "outcomeEmotion": "concerned",
      "outcomeNote": "Read replicas scale eligible reads, not write throughput. The retained risk remains part of your company’s architecture."
    }
  ],
  "hints": [
    "Efficient but numerous lag-tolerant reads compete with transactions on the primary.",
    "Read replicas scale eligible reads, not write throughput."
  ],
  "lesson": "Read replicas scale eligible reads, not write throughput."
});
