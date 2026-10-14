import { defineStartupLevel, changesFor } from "./authoring";

export const level024 = defineStartupLevel({
  "levelNumber": 24,
  "title": "Find the Red Shoe, Not a Substring",
  "description": "Enterprise merchants need typo tolerance, relevance and multiple facets over eight million catalogue variants. An indexed PostgreSQL full-text/trigram prototype handles simple search, but the representative faceted benchmark misses the target.",
  "dialogue": [
    {
      "character": "jimmy",
      "emotion": "thinking",
      "text": "PostgreSQL search was a sensible starting point. Our actual facet benchmark and relevance needs changed. A search index would still be a projection, not inventory truth."
    }
  ],
  "metrics": [
    {
      "label": "Faceted search p95",
      "value": "1.7 s; target 250 ms",
      "severity": "critical"
    },
    {
      "label": "Facet search / DB CPU",
      "value": "64% of read CPU",
      "severity": "warning"
    },
    {
      "label": "Index freshness budget",
      "value": "30 s",
      "severity": "normal"
    }
  ],
  "choices": [
    {
      "id": "024-measured",
      "label": "Build a derived search index",
      "description": "Project versioned catalogue changes into a managed search index, backfill and compare results, and keep PostgreSQL authoritative. The 30-second discovery budget applies to matching and ranking; hydrate displayed prices through the five-second catalogue path and revalidate stock/price at checkout.",
      "cost": 22000,
      "tone": "recommended",
      "effects": {
        "users": 190000,
        "monthlyRevenue": 75000,
        "monthlyBurn": 11000,
        "engineers": 0,
        "reliability": 0,
        "customerTrust": 2,
        "complexity": 1,
        "xp": 220,
        "confidence": 8
      },
      "tradeoff": {
        "upsideLabel": "Targeted improvement",
        "downsideLabel": "Cost and ownership",
        "upside": "Search-specific indexing meets the benchmark without loading transactional reads.",
        "downside": "The index is eventually consistent and needs replay, lag alerts and rebuild procedures.",
        "jimmyExplanation": "Search-specific indexing meets the benchmark without loading transactional reads. The index is eventually consistent and needs replay, lag alerts and rebuild procedures.",
        "effectReasons": {
          "upfrontCost": "$22,000 funds this rollout, verification and migration effort.",
          "monthlyBurn": "The monthly change is $+11,000, including 0 hires and the operating costs of this response.",
          "reliability": "The index is eventually consistent and needs replay, lag alerts and rebuild procedures.",
          "customerTrust": "Merchant retention follows the response’s stated service contract and remaining risk.",
          "complexity": "Operational load includes the rollout, ownership and ongoing failure modes described here."
        }
      },
      "architectureChanges": changesFor("search-projection"),
      "outcomeTitle": "Discovery gets a derived index.",
      "outcomeDialogue": "Search-specific indexing meets the benchmark without loading transactional reads. The index is eventually consistent and needs replay, lag alerts and rebuild procedures.",
      "outcomeEmotion": "happy",
      "outcomeNote": "Use a derived specialized index when its semantics and measured workload justify it. Next pressure: Search index lag and indexing bursts will require independent ownership; it must never authorize stock."
    },
    {
      "id": "024-bounded",
      "label": "Keep PostgreSQL and reduce search scope",
      "description": "Use PostgreSQL full-text/trigram indexes with fewer facets and a negotiated simpler relevance contract.",
      "cost": 9900,
      "tone": "neutral",
      "effects": {
        "users": 133000,
        "monthlyRevenue": 52500,
        "monthlyBurn": 9350,
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
        "upside": "A valid, cheaper design avoids another datastore.",
        "downside": "The enterprise search feature is reduced; the original faceted benchmark remains unmet.",
        "jimmyExplanation": "A valid, cheaper design avoids another datastore. The enterprise search feature is reduced; the original faceted benchmark remains unmet.",
        "effectReasons": {
          "upfrontCost": "$9,900 funds this rollout, verification and migration effort.",
          "monthlyBurn": "The monthly change is $+9,350, including 0 hires and the operating costs of this response.",
          "reliability": "The enterprise search feature is reduced; the original faceted benchmark remains unmet.",
          "customerTrust": "Merchant retention follows the response’s stated service contract and remaining risk.",
          "complexity": "Operational load includes the rollout, ownership and ongoing failure modes described here."
        }
      },
      "architectureChanges": changesFor("postgres-search"),
      "outcomeTitle": "A narrower contract, deliberately.",
      "outcomeDialogue": "A valid, cheaper design avoids another datastore. The enterprise search feature is reduced; the original faceted benchmark remains unmet.",
      "outcomeEmotion": "thinking",
      "outcomeNote": "Use a derived specialized index when its semantics and measured workload justify it. Next pressure: Search index lag and indexing bursts will require independent ownership; it must never authorize stock."
    },
    {
      "id": "024-shortcut",
      "label": "Make search the inventory authority",
      "description": "Store authoritative product stock and checkout availability only in the search index.",
      "cost": 14300,
      "tone": "risky",
      "effects": {
        "users": 57000,
        "monthlyRevenue": 22500,
        "monthlyBurn": 12650,
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
        "upside": "One query engine can serve discovery and availability lookups.",
        "downside": "An eventually refreshed search projection cannot enforce transactional stock decrements.",
        "jimmyExplanation": "One query engine can serve discovery and availability lookups. An eventually refreshed search projection cannot enforce transactional stock decrements.",
        "effectReasons": {
          "upfrontCost": "$14,300 funds this rollout, verification and migration effort.",
          "monthlyBurn": "The monthly change is $+12,650, including 0 hires and the operating costs of this response.",
          "reliability": "An eventually refreshed search projection cannot enforce transactional stock decrements.",
          "customerTrust": "Merchant retention follows the response’s stated service contract and remaining risk.",
          "complexity": "Operational load includes the rollout, ownership and ongoing failure modes described here."
        }
      },
      "architectureChanges": changesFor("search-authority"),
      "outcomeTitle": "The trade-off catches up.",
      "outcomeDialogue": "One query engine can serve discovery and availability lookups. An eventually refreshed search projection cannot enforce transactional stock decrements.",
      "outcomeEmotion": "concerned",
      "outcomeNote": "Use a derived specialized index when its semantics and measured workload justify it. The retained risk remains part of your company’s architecture."
    }
  ],
  "hints": [
    "The measured search workload and relevance requirements no longer fit the current transactional read path economically.",
    "Use a derived specialized index when its semantics and measured workload justify it."
  ],
  "lesson": "Use a derived specialized index when its semantics and measured workload justify it.",
  "recoveries": [
    {
      "capability": "durable-handoff",
      "choiceIds": [
        "024-measured"
      ],
      "description": "Add a transactional catalogue change ledger and idempotent relay for the search projection.",
      "cost": 3500,
      "monthlyBurn": 900,
      "complexity": 1,
      "architectureChanges": changesFor("job-queue", "outbox", "durable-handoff")
    }
  ]
});
