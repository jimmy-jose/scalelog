import { defineStartupLevel, changesFor } from "./authoring";

export const level032 = defineStartupLevel({
  "levelNumber": 32,
  "title": "One Writer Has Reached Its Budget",
  "description": "Large merchant catalogue feeds now run alongside checkout. After batching, index pruning and a tested vertical upgrade, the largest affordable writer is saturated. Orders remain tenant-scoped; no transaction spans merchants.",
  "dialogue": [
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
        "jimmyExplanation": "Independent writers distribute aggregate work while keeping transactional invariants local. Cross-tenant reporting uses projections; backups, migrations and capacity must be managed per shard.",
        "effectReasons": {
          "upfrontCost": "$65,000 funds this rollout, verification and migration effort.",
          "monthlyBurn": "The monthly change is $+41,000, including 3 hires and the operating costs of this response.",
          "reliability": "Cross-tenant reporting uses projections; backups, migrations and capacity must be managed per shard.",
          "customerTrust": "Merchant retention follows the response’s stated service contract and remaining risk.",
          "complexity": "Operational load includes the rollout, ownership and ongoing failure modes described here."
        }
      },
      "architectureChanges": changesFor("tenant-shards", "distributed-ids"),
      "outcomeTitle": "The writer budget can grow by tenant.",
      "outcomeDialogue": "Independent writers distribute aggregate work while keeping transactional invariants local. Cross-tenant reporting uses projections; backups, migrations and capacity must be managed per shard.",
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
        "jimmyExplanation": "A valid low-complexity operating envelope protects checkout. Revenue growth slows because the new simultaneous-feed contract is not met.",
        "effectReasons": {
          "upfrontCost": "$29,250 funds this rollout, verification and migration effort.",
          "monthlyBurn": "The monthly change is $+34,850, including 3 hires and the operating costs of this response.",
          "reliability": "Revenue growth slows because the new simultaneous-feed contract is not met.",
          "customerTrust": "Merchant retention follows the response’s stated service contract and remaining risk.",
          "complexity": "Operational load includes the rollout, ownership and ongoing failure modes described here."
        }
      },
      "architectureChanges": changesFor("write-admission"),
      "outcomeTitle": "A narrower contract, deliberately.",
      "outcomeDialogue": "A valid low-complexity operating envelope protects checkout. Revenue growth slows because the new simultaneous-feed contract is not met.",
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
        "jimmyExplanation": "Lag-tolerant read capacity increases. The saturated writer still performs every mutation; readers do not add write throughput.",
        "effectReasons": {
          "upfrontCost": "$42,250 funds this rollout, verification and migration effort.",
          "monthlyBurn": "The monthly change is $+47,150, including 3 hires and the operating costs of this response.",
          "reliability": "The saturated writer still performs every mutation; readers do not add write throughput.",
          "customerTrust": "Merchant retention follows the response’s stated service contract and remaining risk.",
          "complexity": "Operational load includes the rollout, ownership and ongoing failure modes described here."
        }
      },
      "architectureChanges": changesFor("write-pressure-readers"),
      "outcomeTitle": "The trade-off catches up.",
      "outcomeDialogue": "Lag-tolerant read capacity increases. The saturated writer still performs every mutation; readers do not add write throughput.",
      "outcomeEmotion": "concerned",
      "outcomeNote": "Shard only with a measured writer limit and a transaction-local key. The retained risk remains part of your company’s architecture."
    }
  ],
  "hints": [
    "Aggregate writes exceed one affordable primary; reads and connections are not the limiting resources.",
    "Shard only with a measured writer limit and a transaction-local key."
  ],
  "lesson": "Shard only with a measured writer limit and a transaction-local key.",
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
