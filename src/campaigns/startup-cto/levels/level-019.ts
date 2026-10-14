import { defineStartupLevel, changesFor, disable } from "./authoring";

export const level019 = defineStartupLevel({
  "levelNumber": 19,
  "title": "Every Merchant Has a Dashboard",
  "description": "Merchants open their analytics dashboards every morning to view custom revenue charts and filtered sales reports. Because each merchant filters different date ranges, these heavy aggregation queries cannot be cached in Redis. Database CPU on our primary writer hits 92%, causing checkout transactions to queue up. The reports can easily tolerate a few seconds of data delay, but checkout cannot.",
  "dialogue": [
      {
          "character": "jimmy",
          "emotion": "thinking",
          "text": "Our primary database is sweating bullets running heavy reporting queries while shoppers are trying to check out. Analytics can tolerate 5 seconds of delay; checkout cannot. Let's offload those analytical reads to an asynchronous read replica."
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
        "jimmyExplanation": "Provisioning a dedicated read replica with asynchronous WAL replication routes heavy merchant analytics off the primary database. The primary writer's CPU drops back to 30%, keeping checkout instantaneous. If replica replication lag spikes during heavy writes, we monitor it closely and alert on it.",
        "effectReasons": {
          "upfrontCost": "$4,000 covers provisioning the read replica, configuring replication lag monitoring, and updating database connection routers.",
          "monthlyBurn": "Running a high-memory managed read replica adds $2,200/month.",
          "reliability": "Removes heavy read contention from the primary database, protecting checkout transaction latency.",
          "customerTrust": "Merchants can generate complex financial reports anytime without slowing down customer checkouts.",
          "complexity": "The application must now separate read-only database connections from read-write connections and track replication lag."
        }
      },
      "architectureChanges": changesFor("read-replicas", "reader-routing"),
      "outcomeTitle": "Reports leave room for transactions.",
      "outcomeDialogue": "Primary database CPU dropped from 92% to 28%! Merchant dashboards load smoothly from the read replica, and customer checkouts are completely insulated from heavy reporting queries.",
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
        "jimmyExplanation": "Restricting dashboard queries to pre-computed hourly summary tables keeps all reads on the primary database without adding a replica. It is cheaper and avoids replication lag, but merchants lose the ability to query real-time ad-hoc date ranges.",
        "effectReasons": {
          "upfrontCost": "$1,800 covers building aggregation summary tables, scheduled rollup jobs, and query rewrites.",
          "monthlyBurn": "Database maintenance and rollup query execution add $1,980/month.",
          "reliability": "Reduces query execution time on the primary without managing multi-database replication topologies.",
          "customerTrust": "Dashboard loading times stabilize, though power merchants miss real-time ad-hoc filtering.",
          "complexity": "Requires maintaining background aggregation jobs and schema migrations for summary tables."
        }
      },
      "architectureChanges": [...changesFor("vertical-db", "primary-reads"), ...disable("reader-routing")],
      "outcomeTitle": "A narrower contract, deliberately.",
      "outcomeDialogue": "Summary tables reduced primary CPU enough to keep checkouts healthy. It saved money, but merchants are already asking why they cannot filter custom minute-by-minute ranges.",
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
        "jimmyExplanation": "Routing write traffic to a read replica is impossible: physical read replicas in PostgreSQL reject all SQL writes! And routing checkout reads to a lagging replica means customers will buy products that were already purchased a second ago.",
        "effectReasons": {
          "upfrontCost": "$2,600 is burned attempting improper read-replica write routing.",
          "monthlyBurn": "Replica infrastructure spend adds $2,530/month while causing critical errors.",
          "reliability": "Attempting writes on a read-only replica causes immediate transaction crashes and checkout outages.",
          "customerTrust": "Failed checkouts and SQL error screens severely damage merchant and buyer trust.",
          "complexity": "Emergency rollback and connection pool reconfiguration required to restore basic site operation."
        }
      },
      "architectureChanges": changesFor("replica-write-routing"),
      "outcomeTitle": "The trade-off catches up.",
      "outcomeDialogue": "Disaster! The router sent write requests to the read replica, which threw immediate read-only transaction errors. Checkout crashed across the board until we rolled back.",
      "outcomeEmotion": "concerned",
      "outcomeNote": "Read replicas scale eligible reads, not write throughput. The retained risk remains part of your company’s architecture."
    }
  ],
  "hints": [
    "Efficient but numerous lag-tolerant reads compete with transactions on the primary.",
    "Read replicas scale eligible reads, not write throughput."
  ],
  "lesson": "Offload heavy analytical queries to an asynchronous read replica. This keeps your primary database CPU free for customer checkouts, but only use replicas for workflows that can tolerate a few seconds of data lag."
});
