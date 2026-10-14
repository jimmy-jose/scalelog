import { defineStartupLevel, changesFor } from "./authoring";

export const level012 = defineStartupLevel({
  "levelNumber": 12,
  "title": "Everyone Misses Together",
  "description": "A celebrity merchant’s catalogue is requested 600 times/s. Many cache entries expire together; a slow fill overlaps hundreds of requests. The app fleet is healthy between expiry waves.",
  "dialogue": [
    {
      "character": "jimmy",
      "emotion": "thinking",
      "text": "Memory is not the issue. Hundreds of requests all discover the same miss. How many of them really need to refill that one key?"
    },
    {
      "character": "jimmy",
      "emotion": "normal",
      "text": "This month’s operating plan adds 1 engineer. Their compensation is included in every response’s recurring burn. Ownership has to grow with the architecture."
    }
  ],
  "metrics": [
    {
      "label": "Cache hit rate",
      "value": "96% → 18% at expiry",
      "severity": "critical"
    },
    {
      "label": "Origin reads during fill",
      "value": "600/s for one hot key",
      "severity": "critical"
    },
    {
      "label": "Fill duration / DB CPU",
      "value": "900 ms / 93%",
      "severity": "critical"
    }
  ],
  "choices": [
    {
      "id": "012-measured",
      "label": "Coalesce fills and spread expirations",
      "description": "Allow one bounded fill per tenant/key, jitter TTLs downward within their freshness ceilings, limit origin concurrency and serve public descriptions stale for at most 30 seconds. Displayed prices keep the five-second visibility bound; checkout revalidates price and stock.",
      "cost": 3500,
      "tone": "recommended",
      "effects": {
        "users": 55000,
        "monthlyRevenue": 22000,
        "monthlyBurn": 5000,
        "engineers": 1,
        "reliability": 3,
        "customerTrust": 2,
        "complexity": -1,
        "xp": 180,
        "confidence": 8
      },
      "tradeoff": {
        "upsideLabel": "Targeted improvement",
        "downsideLabel": "Cost and ownership",
        "upside": "A popular key causes one fill instead of hundreds.",
        "downside": "Locks need expiry and failure handling; freshness-critical fields cannot use unbounded stale fallback.",
        "jimmyExplanation": "A popular key causes one fill instead of hundreds. Locks need expiry and failure handling; freshness-critical fields cannot use unbounded stale fallback.",
        "effectReasons": {
          "upfrontCost": "$3,500 funds this rollout, verification and migration effort.",
          "monthlyBurn": "The monthly change is $+5,000, including 1 hires and the operating costs of this response.",
          "reliability": "Locks need expiry and failure handling; freshness-critical fields cannot use unbounded stale fallback.",
          "customerTrust": "Merchant retention follows the response’s stated service contract and remaining risk.",
          "complexity": "Operational load includes the rollout, ownership and ongoing failure modes described here."
        }
      },
      "architectureChanges": changesFor("catalogue-cache", "fresh-catalogue", "cache-coalescing"),
      "outcomeTitle": "One miss, one bounded fill.",
      "outcomeDialogue": "A popular key causes one fill instead of hundreds. Locks need expiry and failure handling; freshness-critical fields cannot use unbounded stale fallback.",
      "outcomeEmotion": "happy",
      "outcomeNote": "Coalesce expensive work and bound staleness rather than merely making caches bigger. Next pressure: The read path has headroom; synchronous post-order side effects become the next latency problem."
    },
    {
      "id": "012-bounded",
      "label": "Prewarm known campaign catalogues",
      "description": "Warm scheduled campaign keys gradually, with version-checked fills and a five-second price expiry budget measured from the source-read start. Discard late fills and retain a bounded primary fallback.",
      "cost": 1575,
      "tone": "neutral",
      "effects": {
        "users": 38500,
        "monthlyRevenue": 15400,
        "monthlyBurn": 4500,
        "engineers": 1,
        "reliability": 1,
        "customerTrust": 1,
        "complexity": 0,
        "xp": 90,
        "confidence": 3
      },
      "tradeoff": {
        "upsideLabel": "Smaller contract",
        "downsideLabel": "Limits accepted",
        "upside": "Known events avoid most cold misses with a small implementation.",
        "downside": "Unscheduled hot keys and failed refreshes can still cause a herd.",
        "jimmyExplanation": "Known events avoid most cold misses with a small implementation. Unscheduled hot keys and failed refreshes can still cause a herd.",
        "effectReasons": {
          "upfrontCost": "$1,575 funds this rollout, verification and migration effort.",
          "monthlyBurn": "The monthly change is $+4,500, including 1 hires and the operating costs of this response.",
          "reliability": "Unscheduled hot keys and failed refreshes can still cause a herd.",
          "customerTrust": "Merchant retention follows the response’s stated service contract and remaining risk.",
          "complexity": "Operational load includes the rollout, ownership and ongoing failure modes described here."
        }
      },
      "architectureChanges": changesFor("catalogue-cache", "fresh-catalogue", "cache-prewarm"),
      "outcomeTitle": "A narrower contract, deliberately.",
      "outcomeDialogue": "Known events avoid most cold misses with a small implementation. Unscheduled hot keys and failed refreshes can still cause a herd.",
      "outcomeEmotion": "thinking",
      "outcomeNote": "Coalesce expensive work and bound staleness rather than merely making caches bigger. Next pressure: The read path has headroom; synchronous post-order side effects become the next latency problem."
    },
    {
      "id": "012-shortcut",
      "label": "Add a larger cache node only",
      "description": "Increase memory while retaining simultaneous TTL expiry and uncoordinated fills.",
      "cost": 2275,
      "tone": "risky",
      "effects": {
        "users": 16500,
        "monthlyRevenue": 6600,
        "monthlyBurn": 5750,
        "engineers": 1,
        "reliability": -9,
        "customerTrust": -7,
        "complexity": 7,
        "xp": -30,
        "confidence": -12
      },
      "tradeoff": {
        "upsideLabel": "Immediate relief",
        "downsideLabel": "Unresolved risk",
        "upside": "More cold catalogue keys can remain resident.",
        "downside": "Capacity does not prevent hundreds of concurrent misses for the same expired key.",
        "jimmyExplanation": "More cold catalogue keys can remain resident. Capacity does not prevent hundreds of concurrent misses for the same expired key.",
        "effectReasons": {
          "upfrontCost": "$2,275 funds this rollout, verification and migration effort.",
          "monthlyBurn": "The monthly change is $+5,750, including 1 hires and the operating costs of this response.",
          "reliability": "Capacity does not prevent hundreds of concurrent misses for the same expired key.",
          "customerTrust": "Merchant retention follows the response’s stated service contract and remaining risk.",
          "complexity": "Operational load includes the rollout, ownership and ongoing failure modes described here."
        }
      },
      "architectureChanges": changesFor("oversized-cache"),
      "outcomeTitle": "The trade-off catches up.",
      "outcomeDialogue": "More cold catalogue keys can remain resident. Capacity does not prevent hundreds of concurrent misses for the same expired key.",
      "outcomeEmotion": "concerned",
      "outcomeNote": "Coalesce expensive work and bound staleness rather than merely making caches bigger. The retained risk remains part of your company’s architecture."
    }
  ],
  "hints": [
    "Concurrent cache misses duplicate origin work; synchronized expiry creates a thundering herd.",
    "Coalesce expensive work and bound staleness rather than merely making caches bigger."
  ],
  "lesson": "Coalesce expensive work and bound staleness rather than merely making caches bigger.",
  "variants": [
    {
      "id": "without-catalogue-cache",
      "when": {
        "missingAny": [
          "catalogue-cache"
        ]
      },
      "description": "Catalogue caching is absent or bypassed on your route. A new campaign repeats the same product read 600 times/s. The representative prototype expires all keys together; design a bounded cache rollout or prewarm it for the scheduled event.",
      "metrics": [
        {
          "label": "Production read path",
          "value": "direct to primary",
          "severity": "warning"
        },
        {
          "label": "Hot-key origin reads",
          "value": "600/s",
          "severity": "critical"
        },
        {
          "label": "Prototype concurrent fill",
          "value": "900 ms; hundreds of callers",
          "severity": "critical"
        }
      ],
      "dialogue": [
        {
          "character": "jimmy",
          "emotion": "thinking",
          "text": "Catalogue caching is absent or bypassed on your route. A new campaign repeats the same product read 600 times/s. The representative prototype expires all keys together; design a bounded cache rollout or prewarm it for the scheduled event."
        },
        {
          "character": "jimmy",
          "emotion": "thinking",
          "text": "Memory is not the issue. Hundreds of requests all discover the same miss. How many of them really need to refill that one key?"
        },
        {
          "character": "jimmy",
          "emotion": "normal",
          "text": "This month’s operating plan adds 1 engineer. Their compensation is included in every response’s recurring burn. Ownership has to grow with the architecture."
        }
      ]
    }
  ]
});
