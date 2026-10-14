import { defineStartupLevel, changesFor, disable } from "./authoring";

export const level008 = defineStartupLevel({
  recoveries: [{
    capability: "catalogue-cache", choiceIds: ["008-measured"],
    description: "Install the bounded catalogue cache whose edit-visibility policy this response manages.",
    cost: 1800, monthlyBurn: 1500, complexity: 1,
    architectureChanges: changesFor("catalogue-cache"),
  }],
  "levelNumber": 8,
  "title": "Yesterday’s Price",
  "description": "Merchants update their product prices, but shoppers continue to see old catalogue prices for up to a minute because of the 60-second cache. Merchants demand that price changes become visible across storefronts within five seconds.",
  "dialogue": [
      {
          "character": "jimmy",
          "emotion": "thinking",
          "text": "When a merchant edits a price in the database, the cache still holds the old price until it is purged or expires. But watch out: if an update query and a cache-fill query run at the exact same millisecond, a slow read can overwrite your new price with stale data."
      }
  ],
  "metrics": [
    {
      "label": "Catalogue TTL",
      "value": "60 s",
      "severity": "warning"
    },
    {
      "label": "Edit visibility p95",
      "value": "58 s; target <5 s",
      "severity": "critical"
    },
    {
      "label": "Checkout price mismatch accepted",
      "value": "0",
      "severity": "normal"
    }
  ],
  "choices": [
    {
      "id": "008-measured",
      "label": "Add versioned cache invalidation",
      "description": "After commit, invalidate tenant/product keys; use version checks against late fills, a five-second expiry budget measured from the source-read start (discard fills that outlive it), and alert on missed invalidations.",
      "cost": 1400,
      "tone": "recommended",
      "effects": {
        "users": 25000,
        "monthlyRevenue": 10000,
        "monthlyBurn": 700,
        "engineers": 0,
        "reliability": 3,
        "customerTrust": 2,
        "complexity": -1,
        "xp": 160,
        "confidence": 8
      },
      "tradeoff": {
        "upsideLabel": "Targeted improvement",
        "downsideLabel": "Cost and ownership",
        "upside": "Edits meet the five-second bound even when an invalidation fails.",
        "downside": "More origin traffic is the price of that freshness bound; checkout still uses the primary.",
        "jimmyExplanation": "Active cache invalidation purges the specific product key in Redis immediately after the database transaction commits. Pairing that with version checks guarantees that a slow, lagging read query won't overwrite fresh data with an older version. It delivers the 5-second freshness promise reliably.",
        "effectReasons": {
          "upfrontCost": "$1,400 covers versioned invalidation hooks, Redis publish/subscribe eventing, and race-condition tests.",
          "monthlyBurn": "Active cache invalidation monitoring and invalidation telemetry add $700/month.",
          "reliability": "Storefront browsing reliably reflects price updates within 5 seconds without risking stale data resurrection.",
          "customerTrust": "Merchants can run flash sales and promotional pricing with confidence that shoppers see updated prices immediately.",
          "complexity": "Adds database commit hooks, versioning tokens on cache keys, and telemetry on dropped invalidation events."
        }
      },
      "architectureChanges": changesFor("fresh-catalogue"),
      "outcomeTitle": "The storefront catches up with edits.",
      "outcomeDialogue": "Price updates now propagate to storefronts in under two seconds. Even when an invalidation packet drops, the tight 5-second TTL ceiling guarantees merchants won't be stuck with yesterday's prices.",
      "outcomeEmotion": "happy",
      "outcomeNote": "Cache invalidation is a consistency contract, including races and failed invalidations. Next pressure: More origin revalidation can expose geographic delivery cost and later expiry stampedes."
    },
    {
      "id": "008-bounded",
      "label": "Bypass the catalogue cache",
      "description": "Serve catalogue reads directly from a resized primary while retaining any existing cache infrastructure for later review.",
      "cost": 630,
      "tone": "neutral",
      "effects": {
        "users": 17500,
        "monthlyRevenue": 7000,
        "monthlyBurn": 980,
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
        "upside": "Immediate reads are straightforward and remove this stale-display path.",
        "downside": "Read capacity costs rise and the repetitive workload still reaches the DB.",
        "jimmyExplanation": "Bypassing the cache and querying PostgreSQL directly guarantees 100% fresh prices on every single page load. It completely eliminates cache invalidation bugs, but it pushes all read traffic straight back to PostgreSQL.",
        "effectReasons": {
          "upfrontCost": "$630 funds safely bypassing the cache, tuning PostgreSQL query plans, and monitoring database I/O.",
          "monthlyBurn": "Increased database connection pools and CPU headroom add $980/month.",
          "reliability": "Zero risk of stale cache reads or invalidation race conditions since all reads hit authoritative storage.",
          "customerTrust": "Shoppers and merchants always see real-time prices with zero lag, eliminating pricing disputes.",
          "complexity": "Simplifies the read architecture by removing cache invalidation logic, at the cost of higher database load."
        }
      },
      "architectureChanges": [...changesFor("fresh-catalogue", "cache-bypassed"), ...disable("catalogue-cache", "cache-coalescing")],
      "outcomeTitle": "A narrower contract, deliberately.",
      "outcomeDialogue": "Catalogue prices are now 100% real-time directly from PostgreSQL. We traded cache complexity for higher database CPU, but the freshness guarantee is rock-solid.",
      "outcomeEmotion": "thinking",
      "outcomeNote": "Cache invalidation is a consistency contract, including races and failed invalidations. Next pressure: More origin revalidation can expose geographic delivery cost and later expiry stampedes."
    },
    {
      "id": "008-shortcut",
      "label": "Extend the TTL to an hour",
      "description": "Reduce misses by retaining catalogue entries for an hour.",
      "cost": 910,
      "tone": "risky",
      "effects": {
        "users": 7500,
        "monthlyRevenue": 3000,
        "monthlyBurn": 805,
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
        "upside": "Origin load falls during steady browsing traffic.",
        "downside": "Price edits remain invisible much longer than the merchant contract allows.",
        "jimmyExplanation": "Extending the cache TTL to an hour to hide database load is a dangerous shortcut. If a merchant makes a typo (like listing a $500 item for $50), that mistake will be locked in the cache for 60 minutes while shoppers snap up underpriced inventory.",
        "effectReasons": {
          "upfrontCost": "$910 pays for basic TTL configuration and cache size adjustments.",
          "monthlyBurn": "Larger cache memory footprints add $1,155/month in infrastructure spend.",
          "reliability": "Database CPU drops, but application consistency degrades severely as prices remain stale for up to an hour.",
          "customerTrust": "Merchants lose faith in the platform when their price adjustments fail to appear, causing immediate churn.",
          "complexity": "Support staff spend hours fielding tickets about why prices aren't updating and manually flushing cache keys."
        }
      },
      "architectureChanges": changesFor("long-cache-ttl"),
      "outcomeTitle": "The trade-off catches up.",
      "outcomeDialogue": "Extending the cache TTL lowered database CPU, but merchants are furious. A pricing typo remained visible for an hour, costing a merchant thousands of dollars in lost revenue.",
      "outcomeEmotion": "concerned",
      "outcomeNote": "Cache invalidation is a consistency contract, including races and failed invalidations. The retained risk remains part of your company’s architecture."
    }
  ],
  "hints": [
    "Expiry alone cannot satisfy the tighter edit-visibility contract, and racing fills can resurrect stale values.",
    "Cache invalidation is a consistency contract, including races and failed invalidations."
  ],
  "lesson": "Cache invalidation is a consistency contract: when data changes, explicitly purge cache keys and use version checks so slow database reads don't overwrite fresh data with stale cache entries.",
  "variants": [
    {
      "id": "without-catalogue-cache",
      "when": {
        "missingAny": [
          "catalogue-cache"
        ]
      },
      "description": "Merchants demand that product price edits become visible on storefronts within five seconds. Direct database queries meet this freshness promise but risk overwhelming database CPU as traffic grows. We need an explicit cache invalidation strategy.",
      "metrics": [
        {
          "label": "Production cache",
          "value": "not enabled",
          "severity": "normal"
        },
        {
          "label": "Prototype edit visibility",
          "value": "58 s; target <5 s",
          "severity": "critical"
        },
        {
          "label": "Primary CPU under forecast",
          "value": "88%",
          "severity": "warning"
        }
      ],
      "dialogue": [
                {
                        "character": "jimmy",
                        "emotion": "thinking",
                        "text": "Merchants are changing product prices for flash sales, but our cache keeps serving stale data for a full minute. We need a way to purge the cache the instant an edit is saved."
                },
                {
                        "character": "jimmy",
                        "emotion": "thinking",
                        "text": "Remember: cache invalidation isn't just deleting a key. You have to handle race conditions where an old database query finishes right after an update and writes stale data back into the cache."
                }
        ]
    }
  ]
});
