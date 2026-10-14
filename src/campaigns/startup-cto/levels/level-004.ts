import { defineStartupLevel, changesFor } from "./authoring";

export const level004 = defineStartupLevel({
  "levelNumber": 4,
  "title": "The Influencer Weekend",
  "description": "A viral merchant sends a measured 180 requests/s to one application host. The founder wants a repeatable way to add capacity before the next promotion. Profiles put 78% of app time in rendering; the database check is separate. The reference rendering test uses the indexed, pooled query path; any production query or pooling debt from your earlier choices is explicitly repaired by the measured and bounded responses.",
  "dialogue": [
    {
      "character": "jimmy",
      "emotion": "thinking",
      "text": "The app CPU is pinned, but the query probe is fast. We can buy more rendering capacity without changing the language. Keep the total DB connection budget bounded."
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
        "jimmyExplanation": "Measured parallel rendering capacity and a repeatable rollout. Three hosts cost more; local sessions and files still need attention.",
        "effectReasons": {
          "upfrontCost": "$1,200 funds this rollout, verification and migration effort.",
          "monthlyBurn": "The monthly change is $+600, including 0 hires and the operating costs of this response.",
          "reliability": "Three hosts cost more; local sessions and files still need attention.",
          "customerTrust": "Merchant retention follows the response’s stated service contract and remaining risk.",
          "complexity": "Operational load includes the rollout, ownership and ongoing failure modes described here."
        }
      },
      "architectureChanges": changesFor("app-fleet", "indexed", "pooled"),
      "outcomeTitle": "Rendering gets room to breathe.",
      "outcomeDialogue": "Measured parallel rendering capacity and a repeatable rollout. Three hosts cost more; local sessions and files still need attention.",
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
        "jimmyExplanation": "A cheaper implementation buys measured headroom now. One failure domain remains, and the next resize requires a maintenance window.",
        "effectReasons": {
          "upfrontCost": "$540 funds this rollout, verification and migration effort.",
          "monthlyBurn": "The monthly change is $-3,000, including 0 hires and the operating costs of this response.",
          "reliability": "One failure domain remains, and the next resize requires a maintenance window.",
          "customerTrust": "Merchant retention follows the response’s stated service contract and remaining risk.",
          "complexity": "Operational load includes the rollout, ownership and ongoing failure modes described here."
        }
      },
      "architectureChanges": changesFor("vertical-app", "indexed", "pooled"),
      "outcomeTitle": "A narrower contract, deliberately.",
      "outcomeDialogue": "A cheaper implementation buys measured headroom now. One failure domain remains, and the next resize requires a maintenance window.",
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
        "jimmyExplanation": "Separate ownership could become useful with independent teams. The same CPU quota remains saturated, and two engineers gain network failure paths.",
        "effectReasons": {
          "upfrontCost": "$780 funds this rollout, verification and migration effort.",
          "monthlyBurn": "The monthly change is $+690, including 0 hires and the operating costs of this response.",
          "reliability": "The same CPU quota remains saturated, and two engineers gain network failure paths.",
          "customerTrust": "Merchant retention follows the response’s stated service contract and remaining risk.",
          "complexity": "Operational load includes the rollout, ownership and ongoing failure modes described here."
        }
      },
      "architectureChanges": changesFor("render-service-split"),
      "outcomeTitle": "The trade-off catches up.",
      "outcomeDialogue": "Separate ownership could become useful with independent teams. The same CPU quota remains saturated, and two engineers gain network failure paths.",
      "outcomeEmotion": "concerned",
      "outcomeNote": "Scale the saturated tier; load balancing does not make application state portable. The retained risk remains part of your company’s architecture."
    }
  ],
  "hints": [
    "CPU-bound rendering on a single host queues requests; adding DB capacity cannot remove application CPU work.",
    "Scale the saturated tier; load balancing does not make application state portable."
  ],
  "lesson": "Scale the saturated tier; load balancing does not make application state portable."
});
