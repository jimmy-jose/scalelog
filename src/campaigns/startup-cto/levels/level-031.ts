import { defineStartupLevel, changesFor } from "./authoring";

export const level031 = defineStartupLevel({
  "levelNumber": 31,
  "title": "Retention Becomes the Workload",
  "description": "The orders and audit table has grown to 4 terabytes. Running historical data cleanup jobs (like DELETE FROM orders WHERE created_at < NOW() - INTERVAL '1 year') takes 9 hours, locks tables, and spikes disk I/O, causing checkout queries to stall. Queries for today's orders slow down because the index tree has grown massive.",
  "dialogue": [
      {
          "character": "byte",
          "emotion": "thinking",
          "text": "Deleting old records row-by-row is choking the database. If we partition orders by creation month, querying today's orders prunes 90% of the data instantly, and expiring last year's history becomes an instantaneous table drop."
      },
      {
          "character": "byte",
          "emotion": "normal",
          "text": "This month’s operating plan adds 2 engineers. Their compensation is included in every response’s recurring burn. Ownership has to grow with the architecture."
      }
  ],
  "metrics": [
    {
      "label": "History / active window",
      "value": "4 TB / 90 days",
      "severity": "warning"
    },
    {
      "label": "Retention delete duration",
      "value": "9 h",
      "severity": "critical"
    },
    {
      "label": "Date-bounded queries",
      "value": "96%",
      "severity": "normal"
    },
    {
      "label": "Normal write CPU",
      "value": "52%",
      "severity": "normal"
    }
  ],
  "choices": [
    {
      "id": "031-measured",
      "label": "Partition history by time",
      "description": "Migrate in bounded batches to monthly partitions with date-aware queries, local indexes and rehearsed detach/archive retention; maintain tenant/order uniqueness in a separate authoritative key table when needed.",
      "cost": 38000,
      "tone": "recommended",
      "effects": {
        "users": 200000,
        "monthlyRevenue": 110000,
        "monthlyBurn": 26000,
        "engineers": 2,
        "reliability": 0,
        "customerTrust": 2,
        "complexity": 2,
        "xp": 240,
        "confidence": 8
      },
      "tradeoff": {
        "upsideLabel": "Targeted improvement",
        "downsideLabel": "Cost and ownership",
        "upside": "Pruning and partition retirement reduce scanned and deleted data.",
        "downside": "Unique constraints on partitioned tables must include partition keys or use a separate invariant; one writer remains.",
        "byteExplanation": "Partitioning the orders table into monthly chunks lets PostgreSQL prune older partitions during active queries. Purging expired records becomes an instantaneous table drop instead of a 9-hour locking DELETE sweep.",
        "effectReasons": {
          "upfrontCost": "$38,000 covers data backfilling, partition creation, and automated monthly table maintenance scripts.",
          "monthlyBurn": "The monthly change is +$26,000, funding 2 engineers and partition management automation.",
          "reliability": "Eliminates multi-hour table locks from background cleanup, keeping database vacuum and checkout queries fast.",
          "customerTrust": "Merchants experience snappy order search and checkout speeds without unpredictable midnight database slowdowns.",
          "complexity": "Requires maintaining partition lifecycle scripts and routing global order lookups across monthly bounds."
        }
      },
      "architectureChanges": changesFor("time-partitions"),
      "outcomeTitle": "Old history has a retirement path.",
      "outcomeDialogue": "Table partitioning is live. Daily queries only scan this month's partition, and our first automated partition drop freed 400 GB in 20 milliseconds without a hiccup.",
      "outcomeEmotion": "happy",
      "outcomeNote": "Partition for pruning and lifecycle management; it is not automatically sharding. Next pressure: Partitioning retains one writer; later measured aggregate writes may require another boundary."
    },
    {
      "id": "031-bounded",
      "label": "Archive older history to a separate table",
      "description": "Move cold rows incrementally into an archive relation and route history queries explicitly.",
      "cost": 17100,
      "tone": "neutral",
      "effects": {
        "users": 140000,
        "monthlyRevenue": 77000,
        "monthlyBurn": 22100,
        "engineers": 2,
        "reliability": 1,
        "customerTrust": 1,
        "complexity": 0,
        "xp": 120,
        "confidence": 3
      },
      "tradeoff": {
        "upsideLabel": "Smaller contract",
        "downsideLabel": "Limits accepted",
        "upside": "A simple hot/cold split reduces active-table size.",
        "downside": "Recurring moves and archive queries need care; monthly retention remains more manual.",
        "byteExplanation": "Running low-priority background workers to delete expired rows in batches of 1,000 avoids table partitioning, but the single massive table continues to bloat and database indexes remain huge.",
        "effectReasons": {
          "upfrontCost": "$17,100 covers writing throttled background deletion scripts and table vacuum schedules.",
          "monthlyBurn": "The monthly change is +$22,100, funding 2 engineers and background deletion compute cycles.",
          "reliability": "Bounds transaction locks during row deletion, but index bloat continues to degrade query performance over time.",
          "customerTrust": "Orders remain searchable, though merchants notice dashboard queries getting progressively slower.",
          "complexity": "Avoids schema partitioning complexity, but incurs permanent maintenance overhead monitoring vacuum bloat."
        }
      },
      "architectureChanges": changesFor("archived-history"),
      "outcomeTitle": "A narrower contract, deliberately.",
      "outcomeDialogue": "Batched deletes prevent total checkout lockouts, but the primary table remains bloated and index searches are noticeably slower.",
      "outcomeEmotion": "thinking",
      "outcomeNote": "Partition for pruning and lifecycle management; it is not automatically sharding. Next pressure: Partitioning retains one writer; later measured aggregate writes may require another boundary."
    },
    {
      "id": "031-shortcut",
      "label": "Shard all history immediately by random ID",
      "description": "Distribute old and current rows randomly across independent databases.",
      "cost": 24700,
      "tone": "risky",
      "effects": {
        "users": 60000,
        "monthlyRevenue": 33000,
        "monthlyBurn": 29900,
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
        "upside": "Independent writers could add future aggregate write capacity.",
        "downside": "Date queries scatter and retention remains costly; the measured problem is lifecycle maintenance, not writer saturation.",
        "byteExplanation": "Firing off a massive multi-million-row DELETE statement at 2 AM locks the orders table, bloats the transaction log, and crashes checkouts for shoppers in different time zones.",
        "effectReasons": {
          "upfrontCost": "$24,700 is burned in emergency downtime recovery and transaction log cleanup.",
          "monthlyBurn": "The monthly change is +$29,900, funding 2 engineers and high-capacity storage for bloated transaction logs.",
          "reliability": "Massive exclusive table locks block all concurrent checkout transactions and risk database storage exhaustion.",
          "customerTrust": "International merchants and late-night shoppers suffer immediate checkout failures and lost revenue.",
          "complexity": "Heavy operational debt from manual database bloat recovery, emergency VACUUM FULL, and index rebuilds."
        }
      },
      "architectureChanges": changesFor("random-history-shards"),
      "outcomeTitle": "The trade-off catches up.",
      "outcomeDialogue": "A midnight bulk delete locked the orders table for four hours. International checkouts failed and the database ran out of transaction log space.",
      "outcomeEmotion": "concerned",
      "outcomeNote": "Partition for pruning and lifecycle management; it is not automatically sharding. The retained risk remains part of your company’s architecture."
    }
  ],
  "hints": [
    "Lifecycle maintenance of old rows dominates; there is no demonstrated aggregate write-capacity limit yet.",
    "Partition for pruning and lifecycle management; it is not automatically sharding."
  ],
  "lesson": "Partition tables by date: PostgreSQL creates a physical sub-table for each month. Queries for recent orders automatically ignore (prune) past months, and deleting an old year is an instantaneous DROP TABLE instead of millions of slow DELETE statements."
});
