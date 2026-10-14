import { defineStartupLevel, changesFor } from "./authoring";

export const level023 = defineStartupLevel({
  "levelNumber": 23,
  "title": "A Column Becomes an Outage",
  "description": "An enterprise merchant feature requires adding a tax_region column to our 600-million-row orders table. A migration runs ALTER TABLE orders ADD COLUMN tax_region VARCHAR NOT NULL DEFAULT 'US'. PostgreSQL takes an exclusive table lock to rewrite all 600 million rows. All incoming checkout transactions freeze waiting for the lock, connection pools saturate, and the site crashes.",
  "dialogue": [
      {
          "character": "byte",
          "emotion": "thinking",
          "text": "You cannot run a locking table rewrite on a table with 600 million rows! An exclusive table lock stops all reads and writes dead in their tracks. We must use the Expand and Contract pattern across multiple backward-compatible deployments."
      }
  ],
  "metrics": [
    {
      "label": "Lock wait p99",
      "value": "11 s",
      "severity": "critical"
    },
    {
      "label": "DB CPU",
      "value": "49%",
      "severity": "normal"
    },
    {
      "label": "App versions live",
      "value": "old + new",
      "severity": "warning"
    },
    {
      "label": "Backfill transaction",
      "value": "45 min",
      "severity": "critical"
    }
  ],
  "choices": [
    {
      "id": "023-measured",
      "label": "Expand, backfill, then contract",
      "description": "Add compatible nullable fields, deploy dual-compatible readers/writers, backfill in checkpointed batches with lock/statement timeouts, build indexes concurrently where supported, then remove old fields after all consumers migrate.",
      "cost": 14000,
      "tone": "recommended",
      "effects": {
        "users": 180000,
        "monthlyRevenue": 70000,
        "monthlyBurn": 16000,
        "engineers": 2,
        "reliability": 3,
        "customerTrust": 2,
        "complexity": -2,
        "xp": 200,
        "confidence": 8
      },
      "tradeoff": {
        "upsideLabel": "Targeted improvement",
        "downsideLabel": "Cost and ownership",
        "upside": "Short controlled steps preserve mixed-version operation and allow rollback.",
        "downside": "The migration spans releases; concurrent index builds still consume I/O and need validation.",
        "byteExplanation": "The Expand/Contract pattern achieves zero downtime: 1) Deploy code that can read old or new schemas; 2) Add the column as nullable without a default (instant metadata-only change in PostgreSQL); 3) Dual-write new rows with the new column; 4) Backfill historical rows in small batches of 5,000 rows with pauses; 5) Switch reads to the new column; 6) Remove old code.",
        "effectReasons": {
          "upfrontCost": "$4,800 covers phased migration pipelines, batched backfill workers, and schema compatibility checks.",
          "monthlyBurn": "Background backfill worker capacity and migration observability add $2,600/month.",
          "reliability": "Eliminates exclusive table locks and prevents migration-induced database lockouts on giant datasets.",
          "customerTrust": "Shoppers experience zero interruption during major platform feature upgrades and database migrations.",
          "complexity": "Requires managing multi-phase deployments, maintaining backward compatibility, and monitoring backfill progress."
        }
      },
      "architectureChanges": changesFor("safe-migrations"),
      "outcomeTitle": "The schema changes in safe steps.",
      "outcomeDialogue": "Zero downtime! All 600 million rows were safely updated over 48 hours in the background while storefront checkouts ran at full speed without a single lock timeout.",
      "outcomeEmotion": "happy",
      "outcomeNote": "Evolve schemas with overlapping compatibility and bounded migrations. Next pressure: New enterprise catalogue requirements exceed the search semantics of ordinary order indexes."
    },
    {
      "id": "023-bounded",
      "label": "Book an enterprise maintenance window",
      "description": "Pause writes, take a recovery point, run a rehearsed migration and reopen after validation.",
      "cost": 6300,
      "tone": "neutral",
      "effects": {
        "users": 126000,
        "monthlyRevenue": 49000,
        "monthlyBurn": 13600,
        "engineers": 2,
        "reliability": 1,
        "customerTrust": 1,
        "complexity": 0,
        "xp": 100,
        "confidence": 3
      },
      "tradeoff": {
        "upsideLabel": "Smaller contract",
        "downsideLabel": "Limits accepted",
        "upside": "A declared downtime window can simplify a rare incompatible change.",
        "downside": "The enterprise availability commitment and global merchant schedules make the window expensive.",
        "byteExplanation": "Scheduling a planned 30-minute maintenance window at 2:00 AM on Sunday to run the migration with a strict lock timeout avoids building a phased backfill worker. It causes brief scheduled downtime, but gets the schema updated in one shot.",
        "effectReasons": {
          "upfrontCost": "$2,160 covers maintenance dry-runs, merchant notification banners, and rollback scripts.",
          "monthlyBurn": "Maintenance tooling and off-hours engineer on-call compensation add $2,340/month.",
          "reliability": "Prevents unexpected daytime outages by containing database locks to an off-peak maintenance window.",
          "customerTrust": "Planned maintenance is respected, though global 24/7 merchants increasingly push back on downtime.",
          "complexity": "Keeps schema and code simple by avoiding dual-writing, at the cost of requiring scheduled downtime."
        }
      },
      "architectureChanges": changesFor("safe-migrations", "maintenance-window"),
      "outcomeTitle": "A narrower contract, deliberately.",
      "outcomeDialogue": "The maintenance window migration completed in 18 minutes. It avoided complex backfill code, though European merchants were unhappy about the scheduled Sunday outage.",
      "outcomeEmotion": "thinking",
      "outcomeNote": "Evolve schemas with overlapping compatibility and bounded migrations. Next pressure: New enterprise catalogue requirements exceed the search semantics of ordinary order indexes."
    },
    {
      "id": "023-shortcut",
      "label": "Increase lock timeout and run one transaction",
      "description": "Let the deployment wait longer and backfill the whole table atomically.",
      "cost": 9100,
      "tone": "risky",
      "effects": {
        "users": 54000,
        "monthlyRevenue": 21000,
        "monthlyBurn": 18400,
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
        "upside": "One transaction offers a simple rollback boundary.",
        "downside": "Locks and WAL remain unbounded for the user journey and mixed-version clients still break.",
        "byteExplanation": "Running a blocking ALTER TABLE with a DEFAULT value and a synchronous full-table UPDATE during normal operating hours will lock the table for 25 minutes. Every web worker will hang waiting for the table lock, and the entire platform will crash.",
        "effectReasons": {
          "upfrontCost": "$3,120 is burned recovering from the migration-induced production outage.",
          "monthlyBurn": "Incident debriefs and emergency rollback support add $2,990/month.",
          "reliability": "Exclusive table locks bring down the entire application, causing widespread cascading failures.",
          "customerTrust": "Crashing the site during business hours for a database change destroys merchant confidence.",
          "complexity": "Killing hung migrations, unblocking locked database processes, and repairing corrupted deployments."
        }
      },
      "architectureChanges": changesFor("blocking-migration"),
      "outcomeTitle": "The trade-off catches up.",
      "outcomeDialogue": "Disaster! The migration locked the orders table for 22 minutes. Web servers ran out of connection slots within 10 seconds, and 4,000 active shoppers saw 504 Gateway Timeouts.",
      "outcomeEmotion": "concerned",
      "outcomeNote": "Evolve schemas with overlapping compatibility and bounded migrations. The retained risk remains part of your company’s architecture."
    }
  ],
  "hints": [
    "Long transactions and incompatible rolling changes block concurrent work; raw capacity is not the main limit.",
    "Evolve schemas with overlapping compatibility and bounded migrations."
  ],
  "lesson": "Use the Expand/Contract migration pattern: add nullable columns without defaults, dual-write in code, backfill in small background batches, switch reads, and finally drop the old column."
});
