import { defineStartupLevel, changesFor } from "./authoring";

export const level007 = defineStartupLevel({
  "levelNumber": 7,
  "title": "The Same Catalogue Again",
  "description": "A chain of merchants launches identical public catalogues. Traces show repeated indexed product reads, not order writes. Prices shown while browsing may be 60 seconds old; checkout must revalidate price and stock.",
  "dialogue": [
    {
      "character": "jimmy",
      "emotion": "thinking",
      "text": "Now the same indexed reads really are repeated. This is a workload where caching can earn its cost. What can be stale, and what must be checked at checkout?"
    }
  ],
  "metrics": [
    {
      "label": "Catalogue read share",
      "value": "92% of DB queries",
      "severity": "warning"
    },
    {
      "label": "Repeated keys",
      "value": "90% within 60 s",
      "severity": "normal"
    },
    {
      "label": "DB CPU / connections",
      "value": "88% / 140",
      "severity": "critical"
    },
    {
      "label": "Indexed query p95",
      "value": "12 ms alone; 210 ms loaded",
      "severity": "warning"
    }
  ],
  "choices": [
    {
      "id": "007-measured",
      "label": "Cache public catalogue reads",
      "description": "Use cache-aside with tenant-scoped keys, a 60-second TTL and a bounded origin fallback; keep checkout price and stock on the primary. Separate cache memory from session storage.",
      "cost": 1800,
      "tone": "recommended",
      "effects": {
        "users": 20000,
        "monthlyRevenue": 8500,
        "monthlyBurn": 1500,
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
        "upside": "High reuse removes repeated DB work without moving transactional truth.",
        "downside": "Expiry, cache outages and invalidation now need explicit behavior.",
        "jimmyExplanation": "High reuse removes repeated DB work without moving transactional truth. Expiry, cache outages and invalidation now need explicit behavior.",
        "effectReasons": {
          "upfrontCost": "$1,800 funds this rollout, verification and migration effort.",
          "monthlyBurn": "The monthly change is $+1,500, including 0 hires and the operating costs of this response.",
          "reliability": "Expiry, cache outages and invalidation now need explicit behavior.",
          "customerTrust": "Merchant retention follows the response’s stated service contract and remaining risk.",
          "complexity": "Operational load includes the rollout, ownership and ongoing failure modes described here."
        }
      },
      "architectureChanges": changesFor("catalogue-cache"),
      "outcomeTitle": "Repeated reads stop repeating work.",
      "outcomeDialogue": "High reuse removes repeated DB work without moving transactional truth. Expiry, cache outages and invalidation now need explicit behavior.",
      "outcomeEmotion": "happy",
      "outcomeNote": "Cache only data whose reuse and freshness contract justify it. Next pressure: Caching introduces stale prices and expiry bursts; stock remains authoritative at checkout."
    },
    {
      "id": "007-bounded",
      "label": "Buy temporary database headroom",
      "description": "Resize PostgreSQL and keep uncached catalogue reads while measuring reuse.",
      "cost": 810,
      "tone": "neutral",
      "effects": {
        "users": 14000,
        "monthlyRevenue": 5950,
        "monthlyBurn": 2100,
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
        "upside": "No new data freshness model; a valid short-term capacity choice.",
        "downside": "A higher recurring bill buys limited headroom for a strongly repetitive workload.",
        "jimmyExplanation": "No new data freshness model; a valid short-term capacity choice. A higher recurring bill buys limited headroom for a strongly repetitive workload.",
        "effectReasons": {
          "upfrontCost": "$810 funds this rollout, verification and migration effort.",
          "monthlyBurn": "The monthly change is $+2,100, including 0 hires and the operating costs of this response.",
          "reliability": "A higher recurring bill buys limited headroom for a strongly repetitive workload.",
          "customerTrust": "Merchant retention follows the response’s stated service contract and remaining risk.",
          "complexity": "Operational load includes the rollout, ownership and ongoing failure modes described here."
        }
      },
      "architectureChanges": changesFor("vertical-db"),
      "outcomeTitle": "A narrower contract, deliberately.",
      "outcomeDialogue": "No new data freshness model; a valid short-term capacity choice. A higher recurring bill buys limited headroom for a strongly repetitive workload.",
      "outcomeEmotion": "thinking",
      "outcomeNote": "Cache only data whose reuse and freshness contract justify it. Next pressure: Caching introduces stale prices and expiry bursts; stock remains authoritative at checkout."
    },
    {
      "id": "007-shortcut",
      "label": "Cache the entire checkout response",
      "description": "Cache checkout totals and availability for ten minutes without primary revalidation.",
      "cost": 1170,
      "tone": "risky",
      "effects": {
        "users": 6000,
        "monthlyRevenue": 2550,
        "monthlyBurn": 1725,
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
        "upside": "Most reads become very fast while the cache is warm.",
        "downside": "Stale price and stock can be accepted; a faster incorrect sale damages trust.",
        "jimmyExplanation": "Most reads become very fast while the cache is warm. Stale price and stock can be accepted; a faster incorrect sale damages trust.",
        "effectReasons": {
          "upfrontCost": "$1,170 funds this rollout, verification and migration effort.",
          "monthlyBurn": "The monthly change is $+1,725, including 0 hires and the operating costs of this response.",
          "reliability": "Stale price and stock can be accepted; a faster incorrect sale damages trust.",
          "customerTrust": "Merchant retention follows the response’s stated service contract and remaining risk.",
          "complexity": "Operational load includes the rollout, ownership and ongoing failure modes described here."
        }
      },
      "architectureChanges": changesFor("unsafe-checkout-cache"),
      "outcomeTitle": "The trade-off catches up.",
      "outcomeDialogue": "Most reads become very fast while the cache is warm. Stale price and stock can be accepted; a faster incorrect sale damages trust.",
      "outcomeEmotion": "concerned",
      "outcomeNote": "Cache only data whose reuse and freshness contract justify it. The retained risk remains part of your company’s architecture."
    }
  ],
  "hints": [
    "A high-frequency, reusable read workload saturates aggregate DB CPU despite efficient individual queries.",
    "Cache only data whose reuse and freshness contract justify it."
  ],
  "lesson": "Cache only data whose reuse and freshness contract justify it."
});
