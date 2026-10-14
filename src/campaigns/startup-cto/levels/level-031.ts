import { defineStartupLevel, changesFor } from "./authoring";

export const level031 = defineStartupLevel({
  "levelNumber": 31,
  "title": "Retention Becomes the Workload",
  "description": "Order and audit history occupies four terabytes. Almost every interactive query includes a recent date range, but a single large table makes retention deletes and vacuum compete with current traffic.",
  "dialogue": [
    {
      "character": "jimmy",
      "emotion": "thinking",
      "text": "The expensive work is removing old history. Time-aware queries and retention give us a useful boundary, without pretending we gained another writer."
    },
    {
      "character": "jimmy",
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
        "jimmyExplanation": "Pruning and partition retirement reduce scanned and deleted data. Unique constraints on partitioned tables must include partition keys or use a separate invariant; one writer remains.",
        "effectReasons": {
          "upfrontCost": "$38,000 funds this rollout, verification and migration effort.",
          "monthlyBurn": "The monthly change is $+26,000, including 2 hires and the operating costs of this response.",
          "reliability": "Unique constraints on partitioned tables must include partition keys or use a separate invariant; one writer remains.",
          "customerTrust": "Merchant retention follows the response’s stated service contract and remaining risk.",
          "complexity": "Operational load includes the rollout, ownership and ongoing failure modes described here."
        }
      },
      "architectureChanges": changesFor("time-partitions"),
      "outcomeTitle": "Old history has a retirement path.",
      "outcomeDialogue": "Pruning and partition retirement reduce scanned and deleted data. Unique constraints on partitioned tables must include partition keys or use a separate invariant; one writer remains.",
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
        "jimmyExplanation": "A simple hot/cold split reduces active-table size. Recurring moves and archive queries need care; monthly retention remains more manual.",
        "effectReasons": {
          "upfrontCost": "$17,100 funds this rollout, verification and migration effort.",
          "monthlyBurn": "The monthly change is $+22,100, including 2 hires and the operating costs of this response.",
          "reliability": "Recurring moves and archive queries need care; monthly retention remains more manual.",
          "customerTrust": "Merchant retention follows the response’s stated service contract and remaining risk.",
          "complexity": "Operational load includes the rollout, ownership and ongoing failure modes described here."
        }
      },
      "architectureChanges": changesFor("archived-history"),
      "outcomeTitle": "A narrower contract, deliberately.",
      "outcomeDialogue": "A simple hot/cold split reduces active-table size. Recurring moves and archive queries need care; monthly retention remains more manual.",
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
        "jimmyExplanation": "Independent writers could add future aggregate write capacity. Date queries scatter and retention remains costly; the measured problem is lifecycle maintenance, not writer saturation.",
        "effectReasons": {
          "upfrontCost": "$24,700 funds this rollout, verification and migration effort.",
          "monthlyBurn": "The monthly change is $+29,900, including 2 hires and the operating costs of this response.",
          "reliability": "Date queries scatter and retention remains costly; the measured problem is lifecycle maintenance, not writer saturation.",
          "customerTrust": "Merchant retention follows the response’s stated service contract and remaining risk.",
          "complexity": "Operational load includes the rollout, ownership and ongoing failure modes described here."
        }
      },
      "architectureChanges": changesFor("random-history-shards"),
      "outcomeTitle": "The trade-off catches up.",
      "outcomeDialogue": "Independent writers could add future aggregate write capacity. Date queries scatter and retention remains costly; the measured problem is lifecycle maintenance, not writer saturation.",
      "outcomeEmotion": "concerned",
      "outcomeNote": "Partition for pruning and lifecycle management; it is not automatically sharding. The retained risk remains part of your company’s architecture."
    }
  ],
  "hints": [
    "Lifecycle maintenance of old rows dominates; there is no demonstrated aggregate write-capacity limit yet.",
    "Partition for pruning and lifecycle management; it is not automatically sharding."
  ],
  "lesson": "Partition for pruning and lifecycle management; it is not automatically sharding."
});
