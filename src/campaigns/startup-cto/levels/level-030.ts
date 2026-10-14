import { defineStartupLevel, changesFor } from "./authoring";

export const level030 = defineStartupLevel({
  "levelNumber": 30,
  "title": "The Payment Provider’s Long Tail",
  "description": "When charging a credit card, our call to the payment gateway times out after 10 seconds. We mark the order as 'Failed' and tell the customer to try again. But 5 seconds later, the gateway actually processes the charge! The customer is billed twice and stock inventory is corrupted.",
  "dialogue": [
      {
          "character": "jimmy",
          "emotion": "thinking",
          "text": "A network timeout never means the charge failed; it means we don't know what happened. Retrying blindly with a fresh charge request is how customers get double-billed and merchant accounts get banned."
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
        "jimmyExplanation": "We pass a deterministic idempotency key to the payment gateway and mark timed-out orders as 'Pending'. Background workers reconcile the final state using gateway webhooks or status lookups before releasing inventory or notifying the buyer.",
        "effectReasons": {
          "upfrontCost": "$30,000 covers idempotency key generation, pending order state machines, and webhook reconciliation workers.",
          "monthlyBurn": "Webhook ingress endpoints, reconciliation polling jobs, and payment monitoring cost $14,000/month.",
          "reliability": "Completely eliminates double-charging bugs and keeps inventory reservations strictly consistent with payments.",
          "customerTrust": "Shoppers and merchants never experience ghost charges or mysterious double deductions on their credit cards.",
          "complexity": "Reconciliation state machine eliminates edge-case payment race conditions and manual accounting fixes."
        }
      },
      "architectureChanges": changesFor("payment-reconciliation"),
      "outcomeTitle": "Unknown payments stay pending.",
      "outcomeDialogue": "Idempotency keys and webhook reconciliation completely eliminated double charges. When gateway latency spikes, orders stay safely in 'Pending' until the true state is confirmed.",
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
        "jimmyExplanation": "Stopping automatic customer retries and routing timed-out orders into a manual support queue prevents duplicate billing, but creates an operational burden for the merchant support team.",
        "effectReasons": {
          "upfrontCost": "$13,500 covers manual review admin tools and automated support queue triage rules.",
          "monthlyBurn": "Manual review tools and support escalation staffing cost $11,900/month.",
          "reliability": "Prevents accidental duplicate charges, though orders sit in an unresolved state until human intervention.",
          "customerTrust": "Buyers are protected from duplicate charges, but experience slow order confirmation during payment delays.",
          "complexity": "Simple technical design, but transfers operational burden onto customer support staff."
        }
      },
      "architectureChanges": changesFor("payment-reconciliation", "checkout-paused"),
      "outcomeTitle": "A narrower contract, deliberately.",
      "outcomeDialogue": "Double charges have stopped. The support team has to manually verify a dozen ambiguous transactions each day, but customer financial data remains intact.",
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
        "jimmyExplanation": "Immediately retrying timed-out payment requests without idempotency keys creates duplicate authorization holds on customer credit cards, triggering bank fraud flags and merchant chargeback fees.",
        "effectReasons": {
          "upfrontCost": "$19,500 is lost to payment processor dispute fees, chargeback penalties, and emergency hotfixes.",
          "monthlyBurn": "Dispute management overhead and payment processing penalties cost $16,100/month.",
          "reliability": "Duplicate payment authorizations and inventory overselling corrupt core order data integrity.",
          "customerTrust": "Severe customer outrage over duplicate credit card charges and bank overdraft penalties.",
          "complexity": "Nightmarish manual financial reconciliation and chargeback dispute workflows across thousands of transactions."
        }
      },
      "architectureChanges": changesFor("new-payment-ids"),
      "outcomeTitle": "The trade-off catches up.",
      "outcomeDialogue": "Hundreds of shoppers were charged two or three times for a single order. Payment gateway chargeback fees spiked and customer trust took a severe hit.",
      "outcomeEmotion": "concerned",
      "outcomeNote": "A timeout is an unknown result; payment correctness needs stable identity and reconciliation. The retained risk remains part of your company’s architecture."
    }
  ],
  "hints": [
    "A slow but successful dependency creates ambiguous outcomes and retry amplification, not application CPU shortage.",
    "A timeout is an unknown result; payment correctness needs stable identity and reconciliation."
  ],
  "lesson": "A network timeout does NOT mean failure; it means 'unknown.' Never retry a payment with a brand-new ID. Mark the transaction as 'Pending,' use an idempotency key with the provider, and reconcile the final status asynchronously via webhooks or polling before fulfilling or refunding.",
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
