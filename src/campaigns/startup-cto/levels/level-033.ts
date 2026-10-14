import { defineStartupLevel, changesFor } from "./authoring";

export const level033 = defineStartupLevel({
  "levelNumber": 33,
  "title": "The Whale Does Not Hash Smaller",
  "description": "We split our database into 8 shards using tenant ID hashing. Shards 1 through 7 are sitting at 31% CPU. But Shard 8 is constantly crashing at 97% CPU because our biggest enterprise merchant (who generates 42% of all company sales) was assigned there. Re-hashing just moves the fire to another shard, starving smaller merchants sharing that database.",
  "dialogue": [
      {
          "character": "jimmy",
          "emotion": "thinking",
          "text": "No hashing algorithm can shrink an elephant. Our biggest merchant generates nearly half of all writes across the platform. We have to isolate them onto a dedicated database instance before they drown all their neighbors."
      }
  ],
  "metrics": [
    {
      "label": "Hottest shard / median CPU",
      "value": "97% / 31%",
      "severity": "critical"
    },
    {
      "label": "Largest tenant write share",
      "value": "42%",
      "severity": "warning"
    },
    {
      "label": "Tenant-local invariants",
      "value": "orders + stock",
      "severity": "normal"
    }
  ],
  "choices": [
    {
      "id": "033-measured",
      "label": "Isolate the whale and enforce feed budgets",
      "description": "Move the whale to a dedicated larger writer group through the directory, cap its bulk import rate, reserve checkout throughput and rebalance smaller tenants.",
      "cost": 55000,
      "tone": "recommended",
      "effects": {
        "users": 200000,
        "monthlyRevenue": 120000,
        "monthlyBurn": 18000,
        "engineers": 0,
        "reliability": 0,
        "customerTrust": 2,
        "complexity": 1,
        "xp": 240,
        "confidence": 8
      },
      "tradeoff": {
        "upsideLabel": "Targeted improvement",
        "downsideLabel": "Cost and ownership",
        "upside": "Tenant-local invariants remain intact and neighbors regain headroom.",
        "downside": "The whale still has a finite single-writer ceiling; admission control limits its import throughput.",
        "jimmyExplanation": "Moving our whale merchant to a dedicated high-capacity database cluster completely insulates our other merchants from their traffic spikes. Enforcing ingestion rate limits ensures the whale doesn't even overwhelm their own dedicated writer.",
        "effectReasons": {
          "upfrontCost": "$55,000 covers live tenant migration to dedicated infrastructure, rate-limiting gateways, and routing directory updates.",
          "monthlyBurn": "Dedicated high-performance database instance and custom monitoring cost $18,000/month.",
          "reliability": "Completely eliminates noisy-neighbor contention across shared database shards while keeping transactions tenant-local.",
          "customerTrust": "Both the whale and smaller merchants receive guaranteed performance and dedicated capacity.",
          "complexity": "Requires managing tier-based database routing and dedicated infrastructure configurations."
        }
      },
      "architectureChanges": changesFor("whale-isolation"),
      "outcomeTitle": "The whale has its own boundary.",
      "outcomeDialogue": "The whale is successfully isolated on their own dedicated database cluster. The remaining seven shared shards dropped to a tranquil 25% CPU, and our smaller merchants have never been happier.",
      "outcomeEmotion": "happy",
      "outcomeNote": "Hot tenants require isolation or a proven sub-key, not another hash function. Next pressure: More write groups create more recovery units; regional failover needs a complete inventory."
    },
    {
      "id": "033-bounded",
      "label": "Negotiate an off-peak whale import window",
      "description": "Keep placement fixed, throttle this merchant during checkout peaks and schedule its largest feeds.",
      "cost": 24750,
      "tone": "neutral",
      "effects": {
        "users": 140000,
        "monthlyRevenue": 84000,
        "monthlyBurn": 15300,
        "engineers": 0,
        "reliability": 1,
        "customerTrust": 1,
        "complexity": 0,
        "xp": 120,
        "confidence": 3
      },
      "tradeoff": {
        "upsideLabel": "Smaller contract",
        "downsideLabel": "Limits accepted",
        "upside": "No migration and minimal operational cost can protect availability.",
        "downside": "The merchant loses real-time feed throughput and may reject the reduced service tier.",
        "jimmyExplanation": "Splitting the whale's catalogue tables across two shards while keeping checkout local reduces feed write pressure, but introduces complex custom routing logic for a single merchant.",
        "effectReasons": {
          "upfrontCost": "$24,750 covers custom table partitioning and routing logic for the whale merchant.",
          "monthlyBurn": "Custom monitoring and multi-table routing overhead cost $15,300/month.",
          "reliability": "Reduces catalogue write pressure on the shared shard, though routing edge cases require vigilance.",
          "customerTrust": "Whale inventory updates process faster, while smaller neighbors see reduced interference.",
          "complexity": "Custom tenant-specific code paths increase maintenance burden and complicate future migrations."
        }
      },
      "architectureChanges": changesFor("whale-budget"),
      "outcomeTitle": "A narrower contract, deliberately.",
      "outcomeDialogue": "Catalogue sub-sharding relieved write pressure on Shard 8, but we now maintain custom code paths just for one customer.",
      "outcomeEmotion": "thinking",
      "outcomeNote": "Hot tenants require isolation or a proven sub-key, not another hash function. Next pressure: More write groups create more recovery units; regional failover needs a complete inventory."
    },
    {
      "id": "033-shortcut",
      "label": "Hash each order randomly across shards",
      "description": "Scatter one merchant’s orders and stock across databases without a transaction redesign.",
      "cost": 35750,
      "tone": "risky",
      "effects": {
        "users": 60000,
        "monthlyRevenue": 36000,
        "monthlyBurn": 20700,
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
        "upside": "More machines could share a large tenant’s raw traffic.",
        "downside": "Stock/order invariants now cross shards; changing placement alone does not supply distributed atomicity.",
        "jimmyExplanation": "Doubling shard count from 8 to 16 changes nothing: the whale's 42% write volume still lands on one shard! Now 15 shards are idling at 10% CPU while 1 shard continues to crash at 100%.",
        "effectReasons": {
          "upfrontCost": "$35,750 is wasted on an unnecessary 16-shard migration.",
          "monthlyBurn": "Running 16 database clusters doubles cloud infrastructure spend to $20,700/month with zero relief.",
          "reliability": "The whale continues to crush whichever shard it is assigned to, leaving neighbor tenants vulnerable to outages.",
          "customerTrust": "Merchants suffered downtime during the re-hash migration with zero improvement in overall system stability.",
          "complexity": "Managing 16 database shards doubles operational overhead, backup orchestration, and connection pooling complexity."
        }
      },
      "architectureChanges": changesFor("random-tenant-scatter"),
      "outcomeTitle": "The trade-off catches up.",
      "outcomeDialogue": "We spent two weeks re-hashing all 16 shards, only for the whale to pin Shard 12 to 100% CPU on day one. Nothing changed except our cloud bill doubled.",
      "outcomeEmotion": "concerned",
      "outcomeNote": "Hot tenants require isolation or a proven sub-key, not another hash function. The retained risk remains part of your company’s architecture."
    }
  ],
  "hints": [
    "Hashing tenants cannot divide one very large tenant’s workload.",
    "Hot tenants require isolation or a proven sub-key, not another hash function."
  ],
  "lesson": "A massive 'whale' customer cannot be hashed away. Isolate extreme tenants onto their own dedicated database instance with custom resource budgets, leaving the shared shards for smaller merchants.",
  "variants": [
    {
      "id": "without-tenant-shards",
      "when": {
        "missingAny": [
          "tenant-shards"
        ]
      },
      "description": "You retained one writer and constrained imports. A whale tenant now consumes 42% of the write budget, hurting neighboring merchants. A dedicated whale writer can isolate it without requiring a full eight-shard rollout.",
      "metrics": [
        {
          "label": "Whale write share",
          "value": "42%",
          "severity": "critical"
        },
        {
          "label": "Primary CPU",
          "value": "97%",
          "severity": "critical"
        },
        {
          "label": "Other tenants p95",
          "value": "1.8 s",
          "severity": "warning"
        }
      ],
      "dialogue": [
        {
          "character": "jimmy",
          "emotion": "thinking",
          "text": "You retained one writer and constrained imports. A whale tenant now consumes 42% of the write budget, hurting neighboring merchants. A dedicated whale writer can isolate it without requiring a full eight-shard rollout."
        },
        {
          "character": "jimmy",
          "emotion": "thinking",
          "text": "Hashing a merchant ID again still sends that merchant to one place. Protect the neighbors and keep the stock transaction local."
        }
      ]
    }
  ],
  "recoveries": [
    {
      "capability": "pitr",
      "choiceIds": [
        "033-measured"
      ],
      "description": "Establish independent WAL recovery before moving the whale’s authoritative data.",
      "cost": 14000,
      "monthlyBurn": 4500,
      "complexity": 1,
      "architectureChanges": changesFor("pitr")
    }
  ]
});
