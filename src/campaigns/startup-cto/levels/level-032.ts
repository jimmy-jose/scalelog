import { defineStartupLevel, changesFor } from "./authoring";

export const level032 = defineStartupLevel({
  "levelNumber": 32,
  "title": "One Writer Has Reached Its Budget",
  "description": "Large merchant catalogue feeds now run alongside checkout. Even after query batching, index pruning, and upgrading to the largest affordable cloud database instance, primary writer CPU is pinned at 94% and disk I/O is saturated. Because order transactions are strictly isolated to individual merchants and no transaction ever spans multiple merchants, we can split data across separate databases.",
  "dialogue": [
      {
          "character": "jimmy",
          "emotion": "thinking",
          "text": "We have exhausted vertical scaling on our primary database. Because merchants never share transactions, sharding by merchant ID gives us multiple independent database writers. But sharding is a permanent architectural commitment."
      },
      {
          "character": "jimmy",
          "emotion": "normal",
          "text": "This month’s operating plan adds 3 engineers. Their compensation is included in every response’s recurring burn. Ownership has to grow with the architecture."
      }
  ],
  "metrics": [
    {
      "label": "Optimized write load",
      "value": "18,000 row mutations/s",
      "severity": "critical"
    },
    {
      "label": "Writer CPU / storage bandwidth",
      "value": "94% / 91%",
      "severity": "critical"
    },
    {
      "label": "Read replica CPU",
      "value": "34%",
      "severity": "normal"
    },
    {
      "label": "Cross-tenant transactions",
      "value": "none required",
      "severity": "normal"
    }
  ],
  "choices": [
    {
      "id": "032-measured",
      "label": "Shard by tenant with a directory",
      "description": "Use eight tenant-routed writer groups, preserving tenant-local order/stock transactions and per-shard HA/PITR. Migrate tenants with CDC, checksums and a fenced cutover. Generate globally unique IDs, retaining tenant_id for routing. Hire three data engineers.",
      "cost": 65000,
      "tone": "recommended",
      "effects": {
        "users": 200000,
        "monthlyRevenue": 115000,
        "monthlyBurn": 41000,
        "engineers": 3,
        "reliability": 0,
        "customerTrust": 2,
        "complexity": 3,
        "xp": 240,
        "confidence": 8
      },
      "tradeoff": {
        "upsideLabel": "Targeted improvement",
        "downsideLabel": "Cost and ownership",
        "upside": "Independent writers distribute aggregate work while keeping transactional invariants local.",
        "downside": "Cross-tenant reporting uses projections; backups, migrations and capacity must be managed per shard.",
        "jimmyExplanation": "Splitting our data across eight database writer groups using a tenant routing directory distributes write throughput evenly. Because all checkout transactions stay within a single merchant, we avoid complex distributed cross-database transactions.",
        "effectReasons": {
          "upfrontCost": "$65,000 covers CDC tenant migration pipelines, shard routing directory services, and cross-shard integrity checks.",
          "monthlyBurn": "The monthly change is +$41,000, funding 3 data engineers and running eight independent database clusters.",
          "reliability": "Spreads write load across eight writers, eliminating the single-database CPU and disk I/O bottleneck.",
          "customerTrust": "High-volume catalogue uploads no longer cause checkout delays for other merchants on the platform.",
          "complexity": "Introduces shard routing directory, distributed backup orchestration, and per-shard schema migration tooling."
        }
      },
      "architectureChanges": changesFor("tenant-shards", "distributed-ids"),
      "outcomeTitle": "The writer budget can grow by tenant.",
      "outcomeDialogue": "Tenant sharding succeeded! Write throughput is spread across eight primary databases, writer CPU dropped from 94% to 22%, and checkout transactions remain completely isolated.",
      "outcomeEmotion": "happy",
      "outcomeNote": "Shard only with a measured writer limit and a transaction-local key. Next pressure: Tenant hashing can distribute many merchants while leaving a single whale tenant hot."
    },
    {
      "id": "032-bounded",
      "label": "Throttle imports and postpone contracts",
      "description": "Keep one writer, schedule feeds within a measured write budget and defer high-volume merchants. Hire three data engineers.",
      "cost": 29250,
      "tone": "neutral",
      "effects": {
        "users": 140000,
        "monthlyRevenue": 80500,
        "monthlyBurn": 34850,
        "engineers": 3,
        "reliability": 1,
        "customerTrust": 1,
        "complexity": 0,
        "xp": 120,
        "confidence": 3
      },
      "tradeoff": {
        "upsideLabel": "Smaller contract",
        "downsideLabel": "Limits accepted",
        "upside": "A valid low-complexity operating envelope protects checkout.",
        "downside": "Revenue growth slows because the new simultaneous-feed contract is not met.",
        "jimmyExplanation": "Keeping a single primary database and aggressively throttling catalogue write feeds protects checkout CPU, but enterprise merchants with huge inventories will face multi-hour delays updating product prices and stock.",
        "effectReasons": {
          "upfrontCost": "$29,250 covers building feed rate limiters and background ingestion queues.",
          "monthlyBurn": "The monthly change is +$34,850, funding 3 data engineers and feed queue infrastructure.",
          "reliability": "Protects the single database from write exhaustion, though feed processing queues accumulate large backlogs.",
          "customerTrust": "Core checkout stays operational, but enterprise merchants complain about delayed inventory and price updates.",
          "complexity": "Avoids database sharding complexity, but requires managing large, slow feed ingestion queues."
        }
      },
      "architectureChanges": changesFor("write-admission"),
      "outcomeTitle": "A narrower contract, deliberately.",
      "outcomeDialogue": "Feed throttling kept checkout alive on our single database, but our largest merchant is furious that inventory updates take five hours to appear.",
      "outcomeEmotion": "thinking",
      "outcomeNote": "Shard only with a measured writer limit and a transaction-local key. Next pressure: Tenant hashing can distribute many merchants while leaving a single whale tenant hot."
    },
    {
      "id": "032-shortcut",
      "label": "Add readers to absorb the writes",
      "description": "Add four asynchronous read replicas and retain all writes on the existing primary. Hire three data engineers.",
      "cost": 42250,
      "tone": "risky",
      "effects": {
        "users": 60000,
        "monthlyRevenue": 34500,
        "monthlyBurn": 47150,
        "engineers": 3,
        "reliability": -9,
        "customerTrust": -7,
        "complexity": 7,
        "xp": -30,
        "confidence": -12
      },
      "tradeoff": {
        "upsideLabel": "Immediate relief",
        "downsideLabel": "Unresolved risk",
        "upside": "Lag-tolerant read capacity increases.",
        "downside": "The saturated writer still performs every mutation; readers do not add write throughput.",
        "jimmyExplanation": "Hashing by order ID scatters a single merchant's orders, products, and inventory across eight different databases! A simple inventory reservation or cart checkout now requires a distributed two-phase commit transaction across multiple databases.",
        "effectReasons": {
          "upfrontCost": "$42,250 is burned on a disastrous hash-sharding migration and emergency rollback.",
          "monthlyBurn": "The monthly change is +$47,150, funding 3 engineers and fragmented multi-database infrastructure.",
          "reliability": "Cross-shard distributed deadlocks and partial transaction commits corrupt inventory and crash checkouts.",
          "customerTrust": "Desynchronized order records and phantom inventory states cause severe merchant churn.",
          "complexity": "Untangling cross-database dependencies and rolling back distributed transactions is extraordinarily complex."
        }
      },
      "architectureChanges": changesFor("write-pressure-readers"),
      "outcomeTitle": "The trade-off catches up.",
      "outcomeDialogue": "Hashing by order ID broke atomic transactions. Distributed locks caused massive database deadlocks, leaving carts stuck and inventory numbers completely desynchronized.",
      "outcomeEmotion": "concerned",
      "outcomeNote": "Shard only with a measured writer limit and a transaction-local key. The retained risk remains part of your company’s architecture."
    }
  ],
  "hints": [
    "Aggregate writes exceed one affordable primary; reads and connections are not the limiting resources.",
    "Shard only with a measured writer limit and a transaction-local key."
  ],
  "lesson": "Shard your database only when you cannot vertically scale your single primary any further. Shard by a key where transactions stay isolated (like tenant_id): each merchant's data lives entirely on one database shard, avoiding slow and complex distributed cross-database transactions.",
  "variants": [
    {
      "id": "without-time-partitions",
      "when": {
        "missingAny": [
          "time-partitions"
        ]
      },
      "description": "Your retained history layout is not time-partitioned; it may use an archive split or random placement. A representative feed benchmark now exceeds the optimized primary’s write budget even with retention jobs paused. This is a writer-capacity incident independent of the history layout.",
      "metrics": [
        {
          "label": "Write mutations",
          "value": "18,000/s",
          "severity": "critical"
        },
        {
          "label": "CPU / storage bandwidth",
          "value": "94% / 91%",
          "severity": "critical"
        },
        {
          "label": "Retention jobs during test",
          "value": "paused",
          "severity": "normal"
        },
        {
          "label": "Transactions",
          "value": "tenant-local",
          "severity": "normal"
        }
      ],
      "dialogue": [
        {
          "character": "jimmy",
          "emotion": "thinking",
          "text": "Your retained history layout is not time-partitioned; it may use an archive split or random placement. A representative feed benchmark now exceeds the optimized primary’s write budget even with retention jobs paused. This is a writer-capacity incident independent of the history layout."
        },
        {
          "character": "jimmy",
          "emotion": "thinking",
          "text": "We have measured the writer after fixing avoidable work. Tenant-local transactions give us a possible shard boundary. Plan the migration and recovery before moving data."
        },
        {
          "character": "jimmy",
          "emotion": "normal",
          "text": "This month’s operating plan adds 3 engineers. Their compensation is included in every response’s recurring burn. Ownership has to grow with the architecture."
        }
      ]
    }
  ],
  "recoveries": [
    {
      "capability": "multi-az",
      "choiceIds": [
        "032-measured"
      ],
      "description": "Establish fenced synchronous zone recovery before multiplying writer groups.",
      "cost": 18000,
      "monthlyBurn": 6500,
      "complexity": 1,
      "architectureChanges": changesFor("multi-az")
    },
    {
      "capability": "pitr",
      "choiceIds": [
        "032-measured"
      ],
      "description": "Establish tested per-writer backup and WAL recovery before tenant migration.",
      "cost": 14000,
      "monthlyBurn": 4500,
      "complexity": 1,
      "architectureChanges": changesFor("pitr")
    }
  ]
});
