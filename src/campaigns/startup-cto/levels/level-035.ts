import { defineStartupLevel, changesFor } from "./authoring";

export const level035 = defineStartupLevel({
  "levelNumber": 35,
  "title": "Protect the Checkout, Shed the Rest",
  "description": "During a regional recovery drill, a flash sale promotion launches simultaneously. Traffic spikes to 5,000 requests per second, overwhelming our tested origin capacity of 3,200 RPS. Core checkout transactions are competing with live merchant analytics, personalized product recommendations, and bulk product imports.",
  "dialogue": [
      {
          "character": "byte",
          "emotion": "thinking",
          "text": "When a ship takes on water, you jettison the cargo, not the passengers. Core checkout must survive at all costs. Everything else (recommendations, live analytics, bulk imports) must be shed or served from stale cache."
      }
  ],
  "metrics": [
    {
      "label": "Offered / tested recovery load",
      "value": "5,000 / 3,200 origin RPS",
      "severity": "critical"
    },
    {
      "label": "Worker backlog drain estimate",
      "value": "47 min",
      "severity": "warning"
    },
    {
      "label": "Checkout objective",
      "value": "p95 500 ms / p99 1.5 s",
      "severity": "normal"
    }
  ],
  "choices": [
    {
      "id": "035-measured",
      "label": "Reserve capacity and shed optional work",
      "description": "Reserve checkout concurrency, enforce tenant budgets, defer imports/analytics, serve bounded stale public content and reject excess non-critical work with retry guidance; monitor queue age and recovery load.",
      "cost": 50000,
      "tone": "recommended",
      "effects": {
        "users": 150000,
        "monthlyRevenue": 115000,
        "monthlyBurn": 20000,
        "engineers": 0,
        "reliability": 3,
        "customerTrust": 2,
        "complexity": -3,
        "xp": 240,
        "confidence": 8
      },
      "tradeoff": {
        "upsideLabel": "Targeted improvement",
        "downsideLabel": "Cost and ownership",
        "upside": "Accepted critical work stays within the measured latency envelope.",
        "downside": "Some features and requests are deliberately unavailable; deferred work needs a bounded drain plan.",
        "byteExplanation": "We implement priority-based load shedding: web servers prioritize checkout transactions, pause background analytics workers, serve cached product pages with stale-while-revalidate headers, and reject non-critical traffic with friendly 429 Retry-After headers.",
        "effectReasons": {
          "upfrontCost": "$50,000 covers priority admission control middleware, stale cache policies, and graceful degradation UI states.",
          "monthlyBurn": "Edge traffic management rules and priority rate-limiting infrastructure cost $20,000/month.",
          "reliability": "Guarantees checkout remains 100% available and responsive even when total traffic exceeds origin server capacity.",
          "customerTrust": "Shoppers can always complete their purchases, even while optional background features temporarily degrade.",
          "complexity": "Reduces cascading outage risk through well-defined, automated degradation tiers."
        }
      },
      "architectureChanges": changesFor("load-shedding", "priority-admission"),
      "outcomeTitle": "Checkout keeps its reserved budget.",
      "outcomeDialogue": "Traffic surged to 5,000 RPS, but our load-shedding policies held the line! Non-critical recommendation widgets degraded gracefully, while 100% of customer checkout transactions completed in under 500ms.",
      "outcomeEmotion": "happy",
      "outcomeNote": "Admission control and graceful degradation protect explicit priorities within finite capacity. Next pressure: The final launch must combine these protections and prove them under one realistic test."
    },
    {
      "id": "035-bounded",
      "label": "Cap the entire site at a lower fixed rate",
      "description": "Apply one conservative admission cap and queue only durable accepted jobs.",
      "cost": 22500,
      "tone": "neutral",
      "effects": {
        "users": 105000,
        "monthlyRevenue": 80500,
        "monthlyBurn": 17000,
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
        "upside": "A simpler envelope prevents collapse without elaborate priorities.",
        "downside": "Checkout and optional work compete for the same quota; more valuable sales are rejected.",
        "byteExplanation": "Buffering all incoming requests in reverse-proxy queues without shedding non-critical load keeps all features running, but queues quickly fill up, causing request timeouts and 504 Gateway errors for everyone, including buyers trying to check out.",
        "effectReasons": {
          "upfrontCost": "$22,500 covers configuring reverse-proxy buffer pools and connection queue timeouts.",
          "monthlyBurn": "Reverse-proxy memory and edge server capacity cost $17,000/month.",
          "reliability": "Buffer bloat causes high request queuing latency, leading to widespread client timeouts and 504 errors.",
          "customerTrust": "Shoppers abandon their carts when checkout pages take 45 seconds to respond.",
          "complexity": "Simple queue configuration, but prone to buffer bloat and uncontrollable cascading queue delays."
        }
      },
      "architectureChanges": changesFor("load-shedding", "global-admission"),
      "outcomeTitle": "A narrower contract, deliberately.",
      "outcomeDialogue": "Proxy buffers filled up during the traffic spike. Checkout requests were stuck behind slow analytics calls, resulting in widespread 504 timeouts.",
      "outcomeEmotion": "thinking",
      "outcomeNote": "Admission control and graceful degradation protect explicit priorities within finite capacity. Next pressure: The final launch must combine these protections and prove them under one realistic test."
    },
    {
      "id": "035-shortcut",
      "label": "Queue every incoming request without limits",
      "description": "Return acceptance for all requests and let queues absorb the full overload.",
      "cost": 32500,
      "tone": "risky",
      "effects": {
        "users": 45000,
        "monthlyRevenue": 34500,
        "monthlyBurn": 23000,
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
        "upside": "Short bursts can be smoothed when capacity catches up.",
        "downside": "Unbounded backlog violates deadlines and storage budgets; a queue cannot create sustained throughput.",
        "byteExplanation": "Spinning up 200 new web servers without admission control simply forwards the 5,000 RPS tidal wave directly into our database, exhausting database connection pools and bringing down the entire cluster.",
        "effectReasons": {
          "upfrontCost": "$32,500 is burned on runaway auto-scaling compute bills and emergency database recovery.",
          "monthlyBurn": "Unconstrained auto-scaling compute and database emergency tiers cost $23,000/month.",
          "reliability": "Unbounded app server scaling overwhelms backend database connection pools, causing total platform collapse.",
          "customerTrust": "Total site outage during a major sales promotion destroys merchant revenue and trust.",
          "complexity": "Managing runaway cloud billing alerts and cleaning up crashed database connection states."
        }
      },
      "architectureChanges": changesFor("unbounded-backlog"),
      "outcomeTitle": "The trade-off catches up.",
      "outcomeDialogue": "Auto-scaling flooded the database with 2,000 new connections. The database crashed under connection thrashing, taking the entire platform offline for an hour.",
      "outcomeEmotion": "concerned",
      "outcomeNote": "Admission control and graceful degradation protect explicit priorities within finite capacity. The retained risk remains part of your company’s architecture."
    }
  ],
  "hints": [
    "Offered work exceeds the tested recovery envelope; accepting everything turns overload into a cascading outage.",
    "Admission control and graceful degradation protect explicit priorities within finite capacity."
  ],
  "lesson": "When capacity runs out, fail gracefully: don't let the whole ship sink. Prioritize revenue-generating checkout requests and aggressively shed non-critical load: disable recommendations, serve cached stale product pages, and pause background analytics.",
  "variants": [
    {
      "id": "without-regional-dr",
      "when": {
        "missingAny": [
          "regional-dr"
        ]
      },
      "description": "Your route has no warm recovery region. A constrained-capacity restore/load rehearsal receives more work than the rebuilt deployment can serve. Protect checkout within the longer recovery tier you actually own.",
      "metrics": [
        {
          "label": "Offered / restored capacity",
          "value": "5,000 / 3,200 RPS",
          "severity": "critical"
        },
        {
          "label": "Regional premium RTO",
          "value": "not qualified",
          "severity": "warning"
        },
        {
          "label": "Backlog drain",
          "value": "47 min",
          "severity": "warning"
        }
      ],
      "dialogue": [
        {
          "character": "byte",
          "emotion": "thinking",
          "text": "Your route has no warm recovery region. A constrained-capacity restore/load rehearsal receives more work than the rebuilt deployment can serve. Protect checkout within the longer recovery tier you actually own."
        },
        {
          "character": "byte",
          "emotion": "thinking",
          "text": "We have more offered work than tested capacity. Choose which promises to keep first, and reject excess work before it traps the system in a backlog."
        }
      ]
    }
  ]
});
