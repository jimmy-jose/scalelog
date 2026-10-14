import { defineStartupLevel, changesFor } from "./authoring";

export const level004 = defineStartupLevel({
  "levelNumber": 4,
  "title": "The Influencer Weekend",
  "description": "A viral promotion sends 180 requests/second to our single application host, pushing app CPU to 96% and latency past two seconds. Profiling shows 78% of request time is spent rendering templates and JSON, while the database is healthy. We need a repeatable way to scale app compute before the next flash sale.",
  "dialogue": [
    {
      "character": "byte",
      "emotion": "thinking",
      "text": "The app CPU is pegged rendering views, but database queries are flying back in 18 milliseconds. We need more app instances behind a load balancer, not a database upgrade. Just remember to keep the total database connection budget capped."
    }
  ],
  "metrics": [
    {
      "label": "App CPU",
      "value": "96% at 180 RPS",
      "severity": "critical"
    },
    {
      "label": "Reference DB CPU / query p95",
      "value": "42% / 18 ms",
      "severity": "normal"
    },
    {
      "label": "App p95 / errors",
      "value": "2.1 s / 6%",
      "severity": "critical"
    },
    {
      "label": "Reference pooled sessions",
      "value": "120 / 500 with pooler",
      "severity": "normal"
    }
  ],
  "choices": [
    {
      "id": "004-measured",
      "label": "Add two app instances and a balancer",
      "description": "Deploy two additional instances with health checks, bounded per-instance DB pools, and a canary. Repair the dashboard index and shared pool if omitted.",
      "cost": 1200,
      "tone": "recommended",
      "effects": {
        "users": 7000,
        "monthlyRevenue": 4000,
        "monthlyBurn": 600,
        "engineers": 0,
        "reliability": 3,
        "customerTrust": 2,
        "complexity": 1,
        "xp": 140,
        "confidence": 8
      },
      "tradeoff": {
        "upsideLabel": "Targeted improvement",
        "downsideLabel": "Cost and ownership",
        "upside": "Measured parallel rendering capacity and a repeatable rollout.",
        "downside": "Three hosts cost more; local sessions and files still need attention.",
        "byteExplanation": "Adding two app instances behind a load balancer directly addresses the bottleneck: 78% of our time was CPU rendering, not database queries. Spreading traffic across three instances gives us parallel headroom immediately. Just be warned: as soon as requests bounce between different servers, anything stored on a local hard drive (like user sessions or uploaded images) will start glitching.",
        "effectReasons": {
          "upfrontCost": "$1,200 covers provisioning the load balancer, deploying two new app instances, and configuring health check draining.",
          "monthlyBurn": "Running two additional cloud app instances adds $600/month to our infrastructure bill.",
          "reliability": "Parallel instances absorb the 180 RPS rendering spike and remove a single point of failure in the app tier.",
          "customerTrust": "Fast page loads during the flash sale keep shoppers happy and stop merchants from seeing timeout errors.",
          "complexity": "A load balancer and multiple instances introduce rolling deploys, instance health monitoring, and multi-host debugging."
        }
      },
      "architectureChanges": changesFor("app-fleet", "indexed", "pooled"),
      "outcomeTitle": "Rendering gets room to breathe.",
      "outcomeDialogue": "The load balancer is up, health checks are green, and p95 latency plummeted back to normal. The app layer has breathing room, though we'll need to watch what happens to local server state next.",
      "outcomeEmotion": "happy",
      "outcomeNote": "Scale the saturated tier; load balancing does not make application state portable. Next pressure: Requests now land on different instances; local sessions and uploaded files will become visible liabilities."
    },
    {
      "id": "004-bounded",
      "label": "Resize the current host first",
      "description": "Buy a larger app host, profile it under load, and cap concurrent requests. Repair outstanding query and pooling debt. Pause contracted roadmap work to save $3,000/month while stabilizing the company.",
      "cost": 540,
      "tone": "neutral",
      "effects": {
        "users": 4900,
        "monthlyRevenue": 2800,
        "monthlyBurn": -3000,
        "engineers": 0,
        "reliability": 1,
        "customerTrust": 1,
        "complexity": 0,
        "xp": 70,
        "confidence": 3
      },
      "tradeoff": {
        "upsideLabel": "Smaller contract",
        "downsideLabel": "Limits accepted",
        "upside": "A cheaper implementation buys measured headroom now.",
        "downside": "One failure domain remains, and the next resize requires a maintenance window.",
        "byteExplanation": "Scaling vertically to a beefier server is the simplest move right now. It buys us CPU headroom without the operational overhead of a load balancer. But remember: a single server is still a single point of failure, and you can only upgrade a box so many times before you hit a hard hardware ceiling.",
        "effectReasons": {
          "upfrontCost": "$540 pays for the scheduled instance resize, load testing, and brief maintenance window.",
          "monthlyBurn": "Pausing contracted roadmap work saves $3,000/month while absorbing the modest cost of the larger server.",
          "reliability": "More CPU cores reduce queueing delays for now, but a single host crash will still take down the entire storefront.",
          "customerTrust": "Shoppers get faster responses during this promotion, though the underlying single-server risk remains.",
          "complexity": "No new network topology or load balancer to maintain; operations remain simple on one host."
        }
      },
      "architectureChanges": changesFor("vertical-app", "indexed", "pooled"),
      "outcomeTitle": "A narrower contract, deliberately.",
      "outcomeDialogue": "The larger instance absorbed the CPU surge without changing our deployment topology. It bought us time cheaply, but one server still means one failure domain.",
      "outcomeEmotion": "thinking",
      "outcomeNote": "Scale the saturated tier; load balancing does not make application state portable. Next pressure: Requests now land on different instances; local sessions and uploaded files will become visible liabilities."
    },
    {
      "id": "004-shortcut",
      "label": "Move rendering behind more services",
      "description": "Split the render path into three synchronous services on the same host.",
      "cost": 780,
      "tone": "risky",
      "effects": {
        "users": 2100,
        "monthlyRevenue": 1200,
        "monthlyBurn": 690,
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
        "upside": "Separate ownership could become useful with independent teams.",
        "downside": "The same CPU quota remains saturated, and two engineers gain network failure paths.",
        "byteExplanation": "Splitting rendering into three separate services on the exact same server doesn't create new CPU capacity: they're all still fighting for the same CPU cores! Worse, you've just turned internal function calls into HTTP network calls, adding latency, serialization overhead, and new ways for requests to fail.",
        "effectReasons": {
          "upfrontCost": "$780 is burned carving up code boundaries without adding any new compute resources.",
          "monthlyBurn": "Running multiple service runtimes and service-level logging adds $690/month in overhead.",
          "reliability": "Internal network calls between services add latency and new failure points without relieving CPU pressure.",
          "customerTrust": "Shoppers experience slower, glitchier checkouts as services time out trying to talk to each other.",
          "complexity": "Two engineers now have to coordinate three microservice deployments and debug cross-service network failures."
        }
      },
      "architectureChanges": changesFor("render-service-split"),
      "outcomeTitle": "The trade-off catches up.",
      "outcomeDialogue": "We split the app into three services, but they're still choking on the same physical CPU host. Now we have the same CPU saturation plus network timeouts and three times the deployment headache.",
      "outcomeEmotion": "concerned",
      "outcomeNote": "Scale the saturated tier; load balancing does not make application state portable. The retained risk remains part of your company’s architecture."
    }
  ],
  "hints": [
    "CPU-bound rendering on a single host queues requests; adding DB capacity cannot remove application CPU work.",
    "Scale the saturated tier; load balancing does not make application state portable."
  ],
  "lesson": "Scale only the saturated layer: add app servers behind a load balancer when app CPU is pinned, but remember that multiple servers will break any state stored on local disks."
});
