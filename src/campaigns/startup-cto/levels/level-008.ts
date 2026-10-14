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
  "description": "Merchants edit prices but shoppers still see old catalogue values. This diagnostic checks catalogue browsing; any unsafe checkout caching from an earlier decision remains separate correctness debt. The new promise is visibility within five seconds.",
  "dialogue": [
    {
      "character": "jimmy",
      "emotion": "thinking",
      "text": "The storefront needs its own edit-visibility guarantee; earlier checkout correctness debt remains separate. Think about an edit racing a cache fill, not just the happy invalidation path."
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
        "jimmyExplanation": "Edits meet the five-second bound even when an invalidation fails. More origin traffic is the price of that freshness bound; checkout still uses the primary.",
        "effectReasons": {
          "upfrontCost": "$1,400 funds this rollout, verification and migration effort.",
          "monthlyBurn": "The monthly change is $+700, including 0 hires and the operating costs of this response.",
          "reliability": "More origin traffic is the price of that freshness bound; checkout still uses the primary.",
          "customerTrust": "Merchant retention follows the response’s stated service contract and remaining risk.",
          "complexity": "Operational load includes the rollout, ownership and ongoing failure modes described here."
        }
      },
      "architectureChanges": changesFor("fresh-catalogue"),
      "outcomeTitle": "The storefront catches up with edits.",
      "outcomeDialogue": "Edits meet the five-second bound even when an invalidation fails. More origin traffic is the price of that freshness bound; checkout still uses the primary.",
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
        "jimmyExplanation": "Immediate reads are straightforward and remove this stale-display path. Read capacity costs rise and the repetitive workload still reaches the DB.",
        "effectReasons": {
          "upfrontCost": "$630 funds this rollout, verification and migration effort.",
          "monthlyBurn": "The monthly change is $+980, including 0 hires and the operating costs of this response.",
          "reliability": "Read capacity costs rise and the repetitive workload still reaches the DB.",
          "customerTrust": "Merchant retention follows the response’s stated service contract and remaining risk.",
          "complexity": "Operational load includes the rollout, ownership and ongoing failure modes described here."
        }
      },
      "architectureChanges": [...changesFor("fresh-catalogue", "cache-bypassed"), ...disable("catalogue-cache", "cache-coalescing")],
      "outcomeTitle": "A narrower contract, deliberately.",
      "outcomeDialogue": "Immediate reads are straightforward and remove this stale-display path. Read capacity costs rise and the repetitive workload still reaches the DB.",
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
        "jimmyExplanation": "Origin load falls during steady browsing traffic. Price edits remain invisible much longer than the merchant contract allows.",
        "effectReasons": {
          "upfrontCost": "$910 funds this rollout, verification and migration effort.",
          "monthlyBurn": "The monthly change is $+805, including 0 hires and the operating costs of this response.",
          "reliability": "Price edits remain invisible much longer than the merchant contract allows.",
          "customerTrust": "Merchant retention follows the response’s stated service contract and remaining risk.",
          "complexity": "Operational load includes the rollout, ownership and ongoing failure modes described here."
        }
      },
      "architectureChanges": changesFor("long-cache-ttl"),
      "outcomeTitle": "The trade-off catches up.",
      "outcomeDialogue": "Origin load falls during steady browsing traffic. Price edits remain invisible much longer than the merchant contract allows.",
      "outcomeEmotion": "concerned",
      "outcomeNote": "Cache invalidation is a consistency contract, including races and failed invalidations. The retained risk remains part of your company’s architecture."
    }
  ],
  "hints": [
    "Expiry alone cannot satisfy the tighter edit-visibility contract, and racing fills can resurrect stale values.",
    "Cache invalidation is a consistency contract, including races and failed invalidations."
  ],
  "lesson": "Cache invalidation is a consistency contract, including races and failed invalidations.",
  "variants": [
    {
      "id": "without-catalogue-cache",
      "when": {
        "missingAny": [
          "catalogue-cache"
        ]
      },
      "description": "Your route has no safe catalogue cache. Merchants now require edits visible within five seconds; any unsafe checkout cache remains separate debt. A staging cache experiment with a 60-second TTL fails that contract; choose a safe implementation or keep direct reads.",
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
          "text": "Your route has no safe catalogue cache. Merchants now require edits visible within five seconds; any unsafe checkout cache remains separate debt. A staging cache experiment with a 60-second TTL fails that contract; choose a safe implementation or keep direct reads."
        },
        {
          "character": "jimmy",
          "emotion": "thinking",
          "text": "The storefront needs its own edit-visibility guarantee; earlier checkout correctness debt remains separate. Think about an edit racing a cache fill, not just the happy invalidation path."
        }
      ]
    }
  ]
});
