import { defineStartupLevel, changesFor } from "./authoring";

export const level012 = defineStartupLevel({
  "levelNumber": 12,
  "title": "Everyone Misses Together",
  "description": "A celebrity merchant’s catalogue receives 600 requests/second. Everything runs smoothly until the 60-second Redis cache key expires. In that single millisecond, hundreds of concurrent requests find the cache empty and all fire the exact same heavy SQL query at PostgreSQL simultaneously, knocking the database offline.",
  "dialogue": [
      {
          "character": "jimmy",
          "emotion": "thinking",
          "text": "This is the classic 'Cache Stampede' (also known as the Thundering Herd). When a hot key expires, 600 requests all miss at the exact same instant, and they all stampede PostgreSQL to recalculate the exact same thing."
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
        "jimmyExplanation": "Request coalescing (using a distributed lock or Go-style singleflight) solves stampedes elegantly: the first request that misses acquires a lock to query PostgreSQL and update Redis, while the other 599 requests wait for that single result. Adding jitter (randomizing TTLs between 50 and 70 seconds) prevents all keys from expiring at the same time.",
        "effectReasons": {
          "upfrontCost": "$3,500 funds the singleflight mutex implementation, TTL jitter logic, and cache miss telemetry.",
          "monthlyBurn": "Includes our new hire ($5,000/mo) plus monitoring lock contention and cache fill metrics.",
          "reliability": "Protects the database from thundering herd spikes when high-traffic cache entries expire.",
          "customerTrust": "Celebrity flash sales run smoothly without the site freezing when cache keys expire.",
          "complexity": "Adds distributed lock management, lock timeout handling, and probabilistic early expiration logic."
        }
      },
      "architectureChanges": changesFor("catalogue-cache", "fresh-catalogue", "cache-coalescing"),
      "outcomeTitle": "One miss, one bounded fill.",
      "outcomeDialogue": "Stampedes are gone! When the celebrity catalogue expires, exactly one query goes to PostgreSQL while hundreds of other requests wait a few milliseconds for the fresh cache fill.",
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
        "jimmyExplanation": "Pre-warming known promotional catalogues with a background worker refreshes the cache before it expires. It keeps hot keys permanently warm in Redis, but it only works for campaigns we know about in advance, not unexpected viral spikes.",
        "effectReasons": {
          "upfrontCost": "$1,575 covers building the background cache-warming script and cron scheduling.",
          "monthlyBurn": "Includes our new hire ($5,000/mo) offset by internal efficiency and background warmers.",
          "reliability": "Prevents expiry stampedes on scheduled campaigns, though unpredicted viral hits remain vulnerable.",
          "customerTrust": "Planned marketing launches run smoothly, maintaining merchant satisfaction.",
          "complexity": "Requires maintaining a list of high-priority merchants and monitoring background warming jobs."
        }
      },
      "architectureChanges": changesFor("catalogue-cache", "fresh-catalogue", "cache-prewarm"),
      "outcomeTitle": "A narrower contract, deliberately.",
      "outcomeDialogue": "Background pre-warming kept the celebrity catalogue warm and prevented the stampede during the launch. Just remember: spontaneous viral traffic won't be covered by this schedule.",
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
        "jimmyExplanation": "Buying a massive Redis instance does nothing to fix a cache stampede. The bottleneck isn't Redis memory; it's that when the key expires, all 600 requests miss and hit PostgreSQL! A larger cache box just sits there with empty memory while the database burns.",
        "effectReasons": {
          "upfrontCost": "$2,275 is wasted resizing the Redis cluster without addressing concurrency.",
          "monthlyBurn": "Includes our new hire ($5,000/mo) plus paying for oversized Redis instances.",
          "reliability": "PostgreSQL still suffers catastrophic connection and CPU spikes every time a popular key expires.",
          "customerTrust": "Storefronts still crash during high-profile sales, frustrating merchants who expected the expensive upgrade to work.",
          "complexity": "Managing unnecessarily large Redis instances adds cloud cost overhead without solving the underlying problem."
        }
      },
      "architectureChanges": changesFor("oversized-cache"),
      "outcomeTitle": "The trade-off catches up.",
      "outcomeDialogue": "The giant Redis box made no difference. When the key expired, 600 requests still bypassed Redis and smashed PostgreSQL into the ground. We paid thousands more for empty RAM.",
      "outcomeEmotion": "concerned",
      "outcomeNote": "Coalesce expensive work and bound staleness rather than merely making caches bigger. The retained risk remains part of your company’s architecture."
    }
  ],
  "hints": [
    "Concurrent cache misses duplicate origin work; synchronized expiry creates a thundering herd.",
    "Coalesce expensive work and bound staleness rather than merely making caches bigger."
  ],
  "lesson": "Prevent cache stampedes: when a popular cache key expires, use a mutex lock or 'singleflight' so only ONE request queries the database to refill the cache while other requests wait or serve slightly stale data.",
  "variants": [
    {
      "id": "without-catalogue-cache",
      "when": {
        "missingAny": [
          "catalogue-cache"
        ]
      },
      "description": "Catalogue caching is absent or bypassed on your route. A new celebrity campaign repeats the same product read 600 times/second. Without a cache or with all keys expiring together, hundreds of requests hammer PostgreSQL simultaneously. Design a bounded cache rollout or prewarm it for the scheduled event.",
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
                        "text": "We have 600 requests per second hitting the exact same product. Without a coalesced cache, every single one of those requests is hitting our primary database. We need a bounded cache rollout before the primary collapses."
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
