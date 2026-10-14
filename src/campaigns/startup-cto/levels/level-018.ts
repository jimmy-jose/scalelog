import { defineStartupLevel, changesFor } from "./authoring";

export const level018 = defineStartupLevel({
  "levelNumber": 18,
  "title": "The Import Ate the Receipts",
  "description": "An enterprise merchant uploads a bulk catalog import of 100,000 product images. All 100,000 image resizing jobs are dumped into the exact same background worker queue used for customer receipts. Because the queue is processed in FIFO order, lightweight, critical customer purchase receipts are stuck waiting behind 100,000 slow, 10-second image resizing tasks. We are also adding two engineers this month.",
  "dialogue": [
      {
          "character": "byte",
          "emotion": "thinking",
          "text": "Bulk image processing and customer purchase receipts are sharing the same worker pool. Receipts take 50 milliseconds, but they are stuck in traffic behind 100,000 heavy image downloads that take 10 seconds each."
      },
      {
          "character": "byte",
          "emotion": "normal",
          "text": "We are hiring two engineers this month to own integrations and operational infrastructure. Their salaries are factored into our recurring monthly burn."
      }
  ],
  "metrics": [
    {
      "label": "Receipt age",
      "value": "23 min; target <30 s",
      "severity": "critical"
    },
    {
      "label": "Media work / worker time",
      "value": "94%",
      "severity": "warning"
    },
    {
      "label": "DB CPU",
      "value": "43%",
      "severity": "normal"
    }
  ],
  "choices": [
    {
      "id": "018-measured",
      "label": "Separate work classes and bound admission",
      "description": "Give receipts reserved concurrency; route media/imports to bounded pools, cap tenant backlog, track age and apply backpressure to imports. Hire two owners.",
      "cost": 7500,
      "tone": "recommended",
      "effects": {
        "users": 110000,
        "monthlyRevenue": 45000,
        "monthlyBurn": 14000,
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
        "upside": "Latency-sensitive jobs retain capacity during bulk imports.",
        "downside": "Separate queues need scheduling and operational ownership; more concurrency must respect DB and provider limits.",
        "byteExplanation": "Queue isolation and class-of-service separation solve head-of-line blocking: we create two separate queues: high-priority-receipts and bulk-imports, each with dedicated worker pools. Even if a merchant queues 500,000 images, the receipt workers are on their own reserved pool and continue processing customer receipts in under 100 milliseconds.",
        "effectReasons": {
          "upfrontCost": "$3,600 covers configuring multi-queue topologies, dedicated worker pool routing, and backpressure metrics.",
          "monthlyBurn": "Includes our two new engineering hires ($10,000/mo) plus dedicated worker instance pools, totaling $12,500/month.",
          "reliability": "Guarantees that bulk batch operations cannot starve or degrade time-sensitive customer-facing workflows.",
          "customerTrust": "Shoppers receive instant receipts even when enterprise merchants run massive catalog syncs.",
          "complexity": "The team now manages separate worker deployments, queue priority rules, and per-queue autoscaling."
        }
      },
      "architectureChanges": changesFor("isolated-workers"),
      "outcomeTitle": "Receipts get reserved capacity.",
      "outcomeDialogue": "Queues are cleanly separated! Customer receipts fly through the high-priority worker pool instantly, while bulk image resizing crunches away peacefully in its own isolated background pool.",
      "outcomeEmotion": "happy",
      "outcomeNote": "Queues need class isolation, backpressure and bounded admission. Next pressure: Reliable async work expands merchant adoption and produces more personalized database reads."
    },
    {
      "id": "018-bounded",
      "label": "Schedule all imports overnight",
      "description": "Reserve daytime workers for receipts and process imports in a published off-peak window. Hire two owners.",
      "cost": 3375,
      "tone": "neutral",
      "effects": {
        "users": 77000,
        "monthlyRevenue": 31500,
        "monthlyBurn": 11900,
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
        "upside": "A simple schedule meets receipt latency without many queues.",
        "downside": "International merchants lack a universal night; imports have a longer turnaround contract.",
        "byteExplanation": "Rate-limiting the bulk import pipeline to 20 jobs per second and running imports during off-peak hours gives receipts breathing room without adding extra worker pools today. It protects receipts, though big imports take longer to finish.",
        "effectReasons": {
          "upfrontCost": "$1,620 covers import rate limiting, scheduling windows, and worker thread balancing.",
          "monthlyBurn": "Includes our two new hires ($10,000/mo) plus baseline worker capacity, totaling $10,625/month.",
          "reliability": "Prevents queue starvation during peak hours by strictly metering incoming batch workloads.",
          "customerTrust": "Purchase receipts arrive promptly, though merchants importing huge catalogs must accept slower sync times.",
          "complexity": "Requires tuning rate-limit parameters and handling merchant expectations around bulk import durations."
        }
      },
      "architectureChanges": changesFor("scheduled-imports"),
      "outcomeTitle": "A narrower contract, deliberately.",
      "outcomeDialogue": "Throttling the import rate prevented receipts from drowning. Bulk imports take longer, but checkout receipts are delivered on time without hiring extra dedicated infrastructure.",
      "outcomeEmotion": "thinking",
      "outcomeNote": "Queues need class isolation, backpressure and bounded admission. Next pressure: Reliable async work expands merchant adoption and produces more personalized database reads."
    },
    {
      "id": "018-shortcut",
      "label": "Let autoscaling chase total queue depth",
      "description": "Add unlimited workers based only on message count. Hire two owners.",
      "cost": 4875,
      "tone": "risky",
      "effects": {
        "users": 33000,
        "monthlyRevenue": 13500,
        "monthlyBurn": 16100,
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
        "upside": "A homogeneous CPU-bound queue could drain faster this way.",
        "downside": "Slow jobs hide in the count and workers can overwhelm database/provider budgets.",
        "byteExplanation": "Simply scaling the single worker pool to 100 workers to power through the combined queue is an expensive disaster. The 100 workers will grab 100 images, flood the database with connection requests, saturate network bandwidth, and run up a huge cloud bill without guaranteeing that receipts won't still get delayed.",
        "effectReasons": {
          "upfrontCost": "$2,340 is burned provisioning large uncapped worker pools.",
          "monthlyBurn": "Includes our two new hires ($10,000/mo) plus massive worker instance spend, totaling $14,375/month.",
          "reliability": "Massive uncoordinated worker pools overwhelm database connections and network egress capacity.",
          "customerTrust": "Platform-wide slowdowns anger both shoppers and merchants while catalog imports still experience delays.",
          "complexity": "Managing huge, bursty worker fleets and debugging downstream database saturation burns engineering time."
        }
      },
      "architectureChanges": changesFor("unbounded-workers"),
      "outcomeTitle": "The trade-off catches up.",
      "outcomeDialogue": "Scaling to 100 workers slammed PostgreSQL with 200 new database connections and saturated our network bandwidth. The database slowed to a crawl, dragging the entire storefront down with it.",
      "outcomeEmotion": "concerned",
      "outcomeNote": "Queues need class isolation, backpressure and bounded admission. The retained risk remains part of your company’s architecture."
    }
  ],
  "hints": [
    "A shared FIFO and concurrency pool let long bulk jobs starve latency-sensitive work.",
    "Queues need class isolation, backpressure and bounded admission."
  ],
  "lesson": "Don't let elephants block the fast lane: isolate heavy, bulk batch jobs from lightweight, customer-facing tasks into dedicated queues and separate worker pools.",
  "variants": [
    {
      "id": "without-job-queue",
      "when": {
        "missingAny": [
          "job-queue"
        ]
      },
      "description": "Imports and receipts contend in the local delivery loop. The five-second enterprise target requires reserved receipt capacity; the queue-based response includes an explicit durable job rollout.",
      "metrics": [
        {
          "label": "Receipt delay",
          "value": "23 min",
          "severity": "critical"
        },
        {
          "label": "Import share of loop time",
          "value": "94%",
          "severity": "warning"
        },
        {
          "label": "DB CPU",
          "value": "43%",
          "severity": "normal"
        }
      ],
      "dialogue": [
        {
          "character": "byte",
          "emotion": "thinking",
          "text": "Imports and receipts contend in the local delivery loop. The five-second enterprise target requires reserved receipt capacity; the queue-based response includes an explicit durable job rollout."
        },
        {
          "character": "byte",
          "emotion": "thinking",
          "text": "A queue preserves work; it does not decide what matters first. Count the oldest receipt, not just how many messages are waiting."
        },
        {
          "character": "byte",
          "emotion": "normal",
          "text": "This month’s operating plan adds 2 engineers. Their compensation is included in every response’s recurring burn. Ownership has to grow with the architecture."
        }
      ]
    }
  ],
  "recoveries": [
    {
      "capability": "job-queue",
      "choiceIds": [
        "018-measured"
      ],
      "description": "Provision durable queues before separating background worker classes.",
      "cost": 3000,
      "monthlyBurn": 1400,
      "complexity": 1,
      "architectureChanges": changesFor("job-queue")
    }
  ]
});
