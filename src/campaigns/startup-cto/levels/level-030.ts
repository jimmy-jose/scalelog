import { defineStartupLevel, changesFor } from "./authoring";

export const level030 = defineStartupLevel({
  "levelNumber": 30,
  "title": "The Payment Provider’s Long Tail",
  "description": "The new traces locate checkout’s long tail in an external payment provider. Authorization often succeeds after Cartline’s caller times out. Stock reservations and payment results must remain consistent.",
  "dialogue": [
    {
      "character": "jimmy",
      "emotion": "thinking",
      "text": "A timeout tells us we do not know the result. It does not tell us the charge failed. Keep the payment identity while we find out."
    }
  ],
  "metrics": [
    {
      "label": "Checkout p99",
      "value": "4.8 s",
      "severity": "critical"
    },
    {
      "label": "Core / provider p99",
      "value": "180 ms / 2.7 s",
      "severity": "warning"
    },
    {
      "label": "Retry rate / app CPU",
      "value": "31% / 49%",
      "severity": "critical"
    },
    {
      "label": "Eventual payment success",
      "value": "normal",
      "severity": "normal"
    }
  ],
  "choices": [
    {
      "id": "030-measured",
      "label": "Bound authorization and reconcile pending results",
      "description": "Use a stable payment-attempt key, one retry owner with a strict budget, provider bulkheads and a pending order state; reconcile webhooks/polls before retry or fulfillment and expire stock reservations safely.",
      "cost": 30000,
      "tone": "recommended",
      "effects": {
        "users": 200000,
        "monthlyRevenue": 105000,
        "monthlyBurn": 14000,
        "engineers": 0,
        "reliability": 3,
        "customerTrust": 2,
        "complexity": -2,
        "xp": 240,
        "confidence": 8
      },
      "tradeoff": {
        "upsideLabel": "Targeted improvement",
        "downsideLabel": "Cost and ownership",
        "upside": "Ambiguous authorization cannot trigger duplicate charges or false fulfillment.",
        "downside": "Pending is visible to customers; a late success after reservation expiry needs refund or reallocation handling.",
        "jimmyExplanation": "Ambiguous authorization cannot trigger duplicate charges or false fulfillment. Pending is visible to customers; a late success after reservation expiry needs refund or reallocation handling.",
        "effectReasons": {
          "upfrontCost": "$30,000 funds this rollout, verification and migration effort.",
          "monthlyBurn": "The monthly change is $+14,000, including 0 hires and the operating costs of this response.",
          "reliability": "Pending is visible to customers; a late success after reservation expiry needs refund or reallocation handling.",
          "customerTrust": "Merchant retention follows the response’s stated service contract and remaining risk.",
          "complexity": "Operational load includes the rollout, ownership and ongoing failure modes described here."
        }
      },
      "architectureChanges": changesFor("payment-reconciliation"),
      "outcomeTitle": "Unknown payments stay pending.",
      "outcomeDialogue": "Ambiguous authorization cannot trigger duplicate charges or false fulfillment. Pending is visible to customers; a late success after reservation expiry needs refund or reallocation handling.",
      "outcomeEmotion": "happy",
      "outcomeNote": "A timeout is an unknown result; payment correctness needs stable identity and reconciliation. Next pressure: Bounded provider pressure lets the business grow until data volume and write throughput dominate."
    },
    {
      "id": "030-bounded",
      "label": "Pause new checkout attempts during degradation",
      "description": "Fail fast before starting new provider calls, keep existing attempts in reconciliation and retain carts for retry.",
      "cost": 13500,
      "tone": "neutral",
      "effects": {
        "users": 140000,
        "monthlyRevenue": 73500,
        "monthlyBurn": 11900,
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
        "upside": "Simpler containment protects correctness and provider capacity.",
        "downside": "Sales stop temporarily even when some authorizations could succeed.",
        "jimmyExplanation": "Simpler containment protects correctness and provider capacity. Sales stop temporarily even when some authorizations could succeed.",
        "effectReasons": {
          "upfrontCost": "$13,500 funds this rollout, verification and migration effort.",
          "monthlyBurn": "The monthly change is $+11,900, including 0 hires and the operating costs of this response.",
          "reliability": "Sales stop temporarily even when some authorizations could succeed.",
          "customerTrust": "Merchant retention follows the response’s stated service contract and remaining risk.",
          "complexity": "Operational load includes the rollout, ownership and ongoing failure modes described here."
        }
      },
      "architectureChanges": changesFor("payment-reconciliation", "checkout-paused"),
      "outcomeTitle": "A narrower contract, deliberately.",
      "outcomeDialogue": "Simpler containment protects correctness and provider capacity. Sales stop temporarily even when some authorizations could succeed.",
      "outcomeEmotion": "thinking",
      "outcomeNote": "A timeout is an unknown result; payment correctness needs stable identity and reconciliation. Next pressure: Bounded provider pressure lets the business grow until data volume and write throughput dominate."
    },
    {
      "id": "030-shortcut",
      "label": "Retry timed-out payments with new IDs",
      "description": "Start a fresh payment attempt after every timeout and consider the old attempt failed.",
      "cost": 19500,
      "tone": "risky",
      "effects": {
        "users": 60000,
        "monthlyRevenue": 31500,
        "monthlyBurn": 16100,
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
        "upside": "A second attempt may respond quickly.",
        "downside": "The first attempt may already have charged; new IDs bypass deduplication and can double-charge buyers.",
        "jimmyExplanation": "A second attempt may respond quickly. The first attempt may already have charged; new IDs bypass deduplication and can double-charge buyers.",
        "effectReasons": {
          "upfrontCost": "$19,500 funds this rollout, verification and migration effort.",
          "monthlyBurn": "The monthly change is $+16,100, including 0 hires and the operating costs of this response.",
          "reliability": "The first attempt may already have charged; new IDs bypass deduplication and can double-charge buyers.",
          "customerTrust": "Merchant retention follows the response’s stated service contract and remaining risk.",
          "complexity": "Operational load includes the rollout, ownership and ongoing failure modes described here."
        }
      },
      "architectureChanges": changesFor("new-payment-ids"),
      "outcomeTitle": "The trade-off catches up.",
      "outcomeDialogue": "A second attempt may respond quickly. The first attempt may already have charged; new IDs bypass deduplication and can double-charge buyers.",
      "outcomeEmotion": "concerned",
      "outcomeNote": "A timeout is an unknown result; payment correctness needs stable identity and reconciliation. The retained risk remains part of your company’s architecture."
    }
  ],
  "hints": [
    "A slow but successful dependency creates ambiguous outcomes and retry amplification, not application CPU shortage.",
    "A timeout is an unknown result; payment correctness needs stable identity and reconciliation."
  ],
  "lesson": "A timeout is an unknown result; payment correctness needs stable identity and reconciliation.",
  "variants": [
    {
      "id": "without-observability",
      "when": {
        "missingAny": [
          "observability"
        ]
      },
      "description": "You did not deploy full distributed tracing. A focused synthetic probe and a temporary provider-span sample isolate the long tail in payment authorization; use that evidence rather than assuming CPU is the problem.",
      "metrics": [
        {
          "label": "Sampled provider p99",
          "value": "2.7 s",
          "severity": "critical"
        },
        {
          "label": "Core p99 / CPU",
          "value": "180 ms / 49%",
          "severity": "normal"
        },
        {
          "label": "Retry share",
          "value": "31%",
          "severity": "critical"
        },
        {
          "label": "Eventual payment success",
          "value": "normal",
          "severity": "normal"
        }
      ],
      "dialogue": [
        {
          "character": "jimmy",
          "emotion": "thinking",
          "text": "You did not deploy full distributed tracing. A focused synthetic probe and a temporary provider-span sample isolate the long tail in payment authorization; use that evidence rather than assuming CPU is the problem."
        },
        {
          "character": "jimmy",
          "emotion": "thinking",
          "text": "A timeout tells us we do not know the result. It does not tell us the charge failed. Keep the payment identity while we find out."
        }
      ]
    }
  ]
});
