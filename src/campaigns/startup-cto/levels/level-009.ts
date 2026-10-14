import { defineStartupLevel, changesFor } from "./authoring";

export const level009 = defineStartupLevel({
  "levelNumber": 9,
  "title": "A Storefront Across the Ocean",
  "description": "International merchants report slow first paint. A controlled page load attributes most delay to public images and versioned scripts, not personalized API responses.",
  "dialogue": [
    {
      "character": "jimmy",
      "emotion": "thinking",
      "text": "The API is quick. Most of the page time is spent moving the same public bytes across an ocean. Keep private responses out of that shared cache."
    }
  ],
  "metrics": [
    {
      "label": "Overseas page p95",
      "value": "2.8 s",
      "severity": "critical"
    },
    {
      "label": "Origin RTT",
      "value": "240 ms",
      "severity": "warning"
    },
    {
      "label": "Public assets / API time",
      "value": "2.3 s / 180 ms",
      "severity": "warning"
    }
  ],
  "choices": [
    {
      "id": "009-measured",
      "label": "Put public versioned assets on a CDN",
      "description": "Serve immutable public assets through an edge cache; use a durable origin, content-hashed URLs and explicit private/no-store API policies.",
      "cost": 2500,
      "tone": "recommended",
      "effects": {
        "users": 35000,
        "monthlyRevenue": 12000,
        "monthlyBurn": 1800,
        "engineers": 0,
        "reliability": 0,
        "customerTrust": 2,
        "complexity": 1,
        "xp": 160,
        "confidence": 8
      },
      "tradeoff": {
        "upsideLabel": "Targeted improvement",
        "downsideLabel": "Cost and ownership",
        "upside": "Nearby delivery removes repeat long-distance asset transfers.",
        "downside": "Cache keys, invalidation and egress budgets must be monitored.",
        "jimmyExplanation": "Nearby delivery removes repeat long-distance asset transfers. Cache keys, invalidation and egress budgets must be monitored.",
        "effectReasons": {
          "upfrontCost": "$2,500 funds this rollout, verification and migration effort.",
          "monthlyBurn": "The monthly change is $+1,800, including 0 hires and the operating costs of this response.",
          "reliability": "Cache keys, invalidation and egress budgets must be monitored.",
          "customerTrust": "Merchant retention follows the response’s stated service contract and remaining risk.",
          "complexity": "Operational load includes the rollout, ownership and ongoing failure modes described here."
        }
      },
      "architectureChanges": changesFor("edge-assets", "durable-media", "object-media"),
      "outcomeTitle": "Public bytes move closer to shoppers.",
      "outcomeDialogue": "Nearby delivery removes repeat long-distance asset transfers. Cache keys, invalidation and egress budgets must be monitored.",
      "outcomeEmotion": "happy",
      "outcomeNote": "Edge delivery improves cacheable content; it does not make private APIs safe to cache. Next pressure: Fast public pages expose automated scraping and bursty origin traffic."
    },
    {
      "id": "009-bounded",
      "label": "Use a nearer regional asset mirror",
      "description": "Replicate only public versioned assets to a second regional origin and route by geography.",
      "cost": 1125,
      "tone": "neutral",
      "effects": {
        "users": 24500,
        "monthlyRevenue": 8400,
        "monthlyBurn": 1530,
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
        "upside": "A regional copy improves RTT for the new market.",
        "downside": "Fewer edge locations and manual replication/routing cost more operational effort.",
        "jimmyExplanation": "A regional copy improves RTT for the new market. Fewer edge locations and manual replication/routing cost more operational effort.",
        "effectReasons": {
          "upfrontCost": "$1,125 funds this rollout, verification and migration effort.",
          "monthlyBurn": "The monthly change is $+1,530, including 0 hires and the operating costs of this response.",
          "reliability": "Fewer edge locations and manual replication/routing cost more operational effort.",
          "customerTrust": "Merchant retention follows the response’s stated service contract and remaining risk.",
          "complexity": "Operational load includes the rollout, ownership and ongoing failure modes described here."
        }
      },
      "architectureChanges": changesFor("regional-assets"),
      "outcomeTitle": "A narrower contract, deliberately.",
      "outcomeDialogue": "A regional copy improves RTT for the new market. Fewer edge locations and manual replication/routing cost more operational effort.",
      "outcomeEmotion": "thinking",
      "outcomeNote": "Edge delivery improves cacheable content; it does not make private APIs safe to cache. Next pressure: Fast public pages expose automated scraping and bursty origin traffic."
    },
    {
      "id": "009-shortcut",
      "label": "Cache all responses by URL at the edge",
      "description": "Apply a shared URL-only cache policy to storefront and authenticated dashboard routes.",
      "cost": 1625,
      "tone": "risky",
      "effects": {
        "users": 10500,
        "monthlyRevenue": 3600,
        "monthlyBurn": 2070,
        "engineers": 0,
        "reliability": -25,
        "customerTrust": -18,
        "complexity": 7,
        "xp": -30,
        "confidence": -22
      },
      "tradeoff": {
        "upsideLabel": "Immediate relief",
        "downsideLabel": "Unresolved risk",
        "upside": "A broad hit rate reduces requests to the origin.",
        "downside": "Ignoring tenant and authorization context can expose private responses; public and private paths need distinct policies.",
        "jimmyExplanation": "A broad hit rate reduces requests to the origin. Ignoring tenant and authorization context can expose private responses; public and private paths need distinct policies.",
        "effectReasons": {
          "upfrontCost": "$1,625 funds this rollout, verification and migration effort.",
          "monthlyBurn": "The monthly change is $+2,070, including 0 hires and the operating costs of this response.",
          "reliability": "Ignoring tenant and authorization context can expose private responses; public and private paths need distinct policies.",
          "customerTrust": "Merchant retention follows the response’s stated service contract and remaining risk.",
          "complexity": "Operational load includes the rollout, ownership and ongoing failure modes described here."
        }
      },
      "architectureChanges": changesFor("unsafe-edge-cache"),
      "outcomeTitle": "The trade-off catches up.",
      "outcomeDialogue": "A broad hit rate reduces requests to the origin. Ignoring tenant and authorization context can expose private responses; public and private paths need distinct policies.",
      "outcomeEmotion": "concerned",
      "outcomeNote": "Edge delivery improves cacheable content; it does not make private APIs safe to cache. The retained risk remains part of your company’s architecture."
    }
  ],
  "hints": [
    "Geographic distance and repeated public-asset transfer dominate page load.",
    "Edge delivery improves cacheable content; it does not make private APIs safe to cache."
  ],
  "lesson": "Edge delivery improves cacheable content; it does not make private APIs safe to cache.",
  "recoveries": [
    {
      "capability": "object-media",
      "choiceIds": [
        "009-measured"
      ],
      "description": "Migrate images from a local or shared filesystem to a verified durable object origin.",
      "cost": 1800,
      "monthlyBurn": 500,
      "complexity": 1,
      "architectureChanges": changesFor("durable-media", "object-media")
    }
  ]
});
