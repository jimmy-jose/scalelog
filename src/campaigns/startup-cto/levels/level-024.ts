import { defineStartupLevel, changesFor } from "./authoring";

export const level024 = defineStartupLevel({
  "levelNumber": 24,
  "title": "Find the Red Shoe, Not a Substring",
  "description": "Merchants demand advanced storefront search: typo tolerance ('snakers' -> 'sneakers'), relevance ranking, and multi-faceted filtering (size, color, brand) across 8 million product variants. An indexed PostgreSQL trigram and full-text prototype handles simple searches, but complex faceted queries take 1.8 seconds and drive database CPU to 90%.",
  "dialogue": [
      {
          "character": "byte",
          "emotion": "thinking",
          "text": "PostgreSQL is built for ACID transactions, not inverted search indexes! Running complex fuzzy matching, stemming, and multi-facet aggregations on our primary transactional database is dragging down core checkouts. We need a derived search index."
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
        "byteExplanation": "We deploy a dedicated search cluster (Elasticsearch or OpenSearch) as a derived read projection. As products are edited, background workers update the search index. The search cluster handles fuzzy queries, faceting, and typo tolerance in 15 milliseconds, keeping PostgreSQL 100% focused on checkout transactions.",
        "effectReasons": {
          "upfrontCost": "$5,500 covers deploying the search cluster, index mapping design, CDC projection pipelines, and fallback routes.",
          "monthlyBurn": "Running managed Elasticsearch/OpenSearch instances and projection workers adds $3,200/month.",
          "reliability": "Completely isolates heavy discovery search traffic from the transactional database.",
          "customerTrust": "Shoppers find products instantly with smart typo tolerance, directly driving higher merchant sales.",
          "complexity": "The team now manages search index mappings, re-indexing pipelines, and projection synchronization lag."
        }
      },
      "architectureChanges": changesFor("search-projection"),
      "outcomeTitle": "Discovery gets a derived index.",
      "outcomeDialogue": "Storefront search is blazing fast! Shoppers get instant fuzzy search and faceting in under 20 milliseconds, and PostgreSQL CPU is completely untouched by search traffic.",
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
        "byteExplanation": "Optimizing PostgreSQL full-text search with strict limit clauses and caching common search phrases provides acceptable search without running a separate Elasticsearch cluster. It saves money, though search lacks fuzzy typo tolerance.",
        "effectReasons": {
          "upfrontCost": "$2,475 covers tuning PostgreSQL GIN indexes, search query limits, and result caching.",
          "monthlyBurn": "Additional PostgreSQL compute and memory headroom add $2,880/month.",
          "reliability": "Keeps search within the existing database infrastructure without managing multi-cluster data sync.",
          "customerTrust": "Basic product searches are fast, though shoppers occasionally complain about missing fuzzy typo matching.",
          "complexity": "Zero new search infrastructure to operate; all data remains in PostgreSQL."
        }
      },
      "architectureChanges": changesFor("postgres-search"),
      "outcomeTitle": "A narrower contract, deliberately.",
      "outcomeDialogue": "PostgreSQL full-text search handles standard keyword queries well enough for now. It saved us from operating an Elasticsearch cluster, though shoppers must type exact words.",
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
        "byteExplanation": "Running unindexed LIKE '%keyword%' queries across 8 million rows on the primary database will trigger full table scans on every keystroke. Five concurrent searches will pin PostgreSQL CPU at 100% and knock down checkout.",
        "effectReasons": {
          "upfrontCost": "$3,575 is burned mitigating severe database contention from unindexed search scans.",
          "monthlyBurn": "Wasted database capacity trying to absorb full-table scans adds $3,680/month.",
          "reliability": "Unindexed substring queries saturate database I/O, causing platform-wide cascading outages.",
          "customerTrust": "Broken search and slow checkouts frustrate merchants and cause shoppers to abandon the site.",
          "complexity": "Constantly killing runaway query processes and troubleshooting database CPU spikes."
        }
      },
      "architectureChanges": changesFor("search-authority"),
      "outcomeTitle": "The trade-off catches up.",
      "outcomeDialogue": "Unindexed substring searches crushed PostgreSQL immediately. A single search for 'shirt' scanned 8 million rows, driving CPU to 100% and causing checkout timeouts across the site.",
      "outcomeEmotion": "concerned",
      "outcomeNote": "Use a derived specialized index when its semantics and measured workload justify it. The retained risk remains part of your company’s architecture."
    }
  ],
  "hints": [
    "The measured search workload and relevance requirements no longer fit the current transactional read path economically.",
    "Use a derived specialized index when its semantics and measured workload justify it."
  ],
  "lesson": "Don't force a relational database to be a search engine: stream data into a derived, specialized search index (like Elasticsearch or OpenSearch) that is optimized for fuzzy search, relevance, and faceting.",
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
