import { defineStartupLevel, changesFor } from "./authoring";

export const level011 = defineStartupLevel({
  "levelNumber": 11,
  "title": "Capacity Arrives Too Late",
  "description": "Flash sales and marketing promotions start at predictable times (e.g., 9:00 AM sharp). When traffic surges, CPU hits 100% and requests queue up for four minutes before new autoscaled cloud instances finish booting, initializing Docker containers, and passing health checks.",
  "dialogue": [
      {
          "character": "jimmy",
          "emotion": "thinking",
          "text": "Autoscaling is reactive: it sees CPU spike at 9:00 AM, requests new instances from the cloud provider, and waits 4 minutes for them to boot and warm up. By the time the new servers join the load balancer, half the shoppers have already abandoned their carts. We need scheduled pre-warming."
      }
  ],
  "metrics": [
    {
      "label": "App CPU at kickoff",
      "value": "97%",
      "severity": "critical"
    },
    {
      "label": "Ready time / spike ramp",
      "value": "4 min / 40 s",
      "severity": "critical"
    },
    {
      "label": "DB CPU / pool wait",
      "value": "51% / 8 ms",
      "severity": "normal"
    },
    {
      "label": "Per-instance safe load",
      "value": "80 RPS at target p95",
      "severity": "normal"
    }
  ],
  "choices": [
    {
      "id": "011-measured",
      "label": "Prewarm a bounded app fleet",
      "description": "Schedule minimum capacity ahead of campaigns; autoscale on saturation and queueing with readiness checks, scale-in draining and an aggregate DB connection budget.",
      "cost": 3200,
      "tone": "recommended",
      "effects": {
        "users": 50000,
        "monthlyRevenue": 18000,
        "monthlyBurn": 3000,
        "engineers": 0,
        "reliability": 3,
        "customerTrust": 2,
        "complexity": 1,
        "xp": 160,
        "confidence": 8
      },
      "tradeoff": {
        "upsideLabel": "Targeted improvement",
        "downsideLabel": "Cost and ownership",
        "upside": "Capacity is ready before the known ramp and remains bounded by downstream limits.",
        "downside": "Warm headroom costs money while idle; load tests must be kept current.",
        "jimmyExplanation": "Scheduled pre-warming spins up extra app instances 15 minutes before scheduled promotions begin. The instances are warm, registered with the load balancer, and ready the moment traffic hits. Crucially, we enforce a strict maximum fleet cap so a massive spike cannot spin up 500 instances and crash our database connection limits.",
        "effectReasons": {
          "upfrontCost": "$2,000 covers promotion scheduling tools, load-testing benchmarks, and autoscaling schedule automation.",
          "monthlyBurn": "Running targeted pre-warmed instances during promotional windows adds $1,400/month.",
          "reliability": "Eliminates the 4-minute cold-boot latency spike while protecting downstream database connection limits.",
          "customerTrust": "Flash sale shoppers experience instantaneous checkout, maximizing merchant sales during promotions.",
          "complexity": "Requires maintaining promotional calendars, scheduled scaling jobs, and regular load testing."
        }
      },
      "architectureChanges": changesFor("app-fleet", "portable-sessions", "durable-media", "bounded-autoscale", "capacity-budget"),
      "outcomeTitle": "Capacity is ready before kickoff.",
      "outcomeDialogue": "The pre-warmed fleet handled the 9:00 AM rush seamlessly. Latency stayed flat under 200 milliseconds, and our instance cap ensured PostgreSQL remained protected.",
      "outcomeEmotion": "happy",
      "outcomeNote": "Autoscaling needs lead time, bounded downstream budgets and evidence from load tests. Next pressure: A fleet that survives CPU bursts can still synchronize cache misses."
    },
    {
      "id": "011-bounded",
      "label": "Keep peak capacity running all month",
      "description": "Provision a fixed fleet sized from the load test and retain it between events.",
      "cost": 1440,
      "tone": "neutral",
      "effects": {
        "users": 35000,
        "monthlyRevenue": 12600,
        "monthlyBurn": 4200,
        "engineers": 0,
        "reliability": 1,
        "customerTrust": 1,
        "complexity": 0,
        "xp": 80,
        "confidence": 3
      },
      "tradeoff": {
        "upsideLabel": "Smaller contract",
        "downsideLabel": "Limits accepted",
        "upside": "Simple operations and immediate capacity are technically sound.",
        "downside": "Most of the monthly capacity sits idle; cash funds predictable peaks inefficiently.",
        "jimmyExplanation": "Keeping a large fleet of servers running 24/7 guarantees we never suffer cold-boot delays, even during unexpected surges. It is simple and reliable, but paying for peak capacity at 3:00 AM when traffic is dead burns through company runway unnecessarily.",
        "effectReasons": {
          "upfrontCost": "$900 covers instance provisioning, load balancer routing, and static capacity checks.",
          "monthlyBurn": "Running fixed peak capacity around the clock increases monthly recurring spend by $3,200.",
          "reliability": "Zero cold-start delays or autoscaling boot lag since maximum server capacity is always running.",
          "customerTrust": "Storefronts remain fast at all hours, providing a dependable customer experience.",
          "complexity": "Very low operational complexity; no dynamic scaling rules or scheduling scripts to manage."
        }
      },
      "architectureChanges": changesFor("app-fleet", "portable-sessions", "durable-media", "fixed-capacity", "capacity-budget"),
      "outcomeTitle": "A narrower contract, deliberately.",
      "outcomeDialogue": "The storefront easily absorbed the promotion since peak capacity was already running. It is rock-solid, but our cloud bill is painfully high every single night.",
      "outcomeEmotion": "thinking",
      "outcomeNote": "Autoscaling needs lead time, bounded downstream budgets and evidence from load tests. Next pressure: A fleet that survives CPU bursts can still synchronize cache misses."
    },
    {
      "id": "011-shortcut",
      "label": "Scale on CPU with no upper bound",
      "description": "Launch hosts only after CPU crosses 95%, without a shared DB connection budget.",
      "cost": 2080,
      "tone": "risky",
      "effects": {
        "users": 15000,
        "monthlyRevenue": 5400,
        "monthlyBurn": 3450,
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
        "upside": "Scaling follows observed application utilization.",
        "downside": "Boot delay misses the burst and the enlarged fleet can overwhelm downstream resources.",
        "jimmyExplanation": "Setting autoscaling to trigger purely on CPU with no upper bound is a classic cloud trap. If an unindexed query or DDoS attack spikes CPU, the autoscaler will spin up hundreds of new instances, running up a $50,000 cloud bill in hours and crushing our database with thousands of new connections.",
        "effectReasons": {
          "upfrontCost": "$1,300 is spent enabling unbounded cloud autoscaling policies.",
          "monthlyBurn": "Uncontrolled instance scaling and peak cloud usage inflate monthly burn by $2,875.",
          "reliability": "Uncapped instance scaling floods the database with connection storms, causing full system outages.",
          "customerTrust": "Widespread outages during flash sales infuriate merchants and cause severe reputational damage.",
          "complexity": "Managing wild billing fluctuations and debugging cascading database crashes exhausts engineering bandwidth."
        }
      },
      "architectureChanges": changesFor("unbounded-autoscale"),
      "outcomeTitle": "The trade-off catches up.",
      "outcomeDialogue": "Disaster! The autoscaler spun up 40 instances during the spike. The flock of new servers opened 2,000 database connections at once, completely crashing PostgreSQL and running up a massive cloud bill.",
      "outcomeEmotion": "concerned",
      "outcomeNote": "Autoscaling needs lead time, bounded downstream budgets and evidence from load tests. The retained risk remains part of your company’s architecture."
    }
  ],
  "hints": [
    "Reactive capacity arrives later than the burst, and unconstrained scale-out could exhaust the database pool.",
    "Autoscaling needs lead time, bounded downstream budgets and evidence from load tests."
  ],
  "lesson": "Autoscaling is not instant: booting new virtual machines takes minutes. Pre-warm your fleet before scheduled traffic spikes, and always cap the maximum fleet size so you don't overwhelm downstream databases.",
  "recoveries": [
    {
      "capability": "portable-sessions",
      "choiceIds": [
        "011-measured",
        "011-bounded"
      ],
      "description": "Externalize local sessions before adding disposable hosts.",
      "cost": 1000,
      "monthlyBurn": 400,
      "complexity": 1,
      "architectureChanges": changesFor("portable-sessions", "session-store")
    },
    {
      "capability": "durable-media",
      "choiceIds": [
        "011-measured",
        "011-bounded"
      ],
      "description": "Move local-only uploads to durable object storage before scaling hosts.",
      "cost": 1800,
      "monthlyBurn": 500,
      "complexity": 1,
      "architectureChanges": changesFor("durable-media", "object-media")
    }
  ]
});
