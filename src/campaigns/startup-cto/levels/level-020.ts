import { defineStartupLevel, changesFor, disable } from "./authoring";

export const level020 = defineStartupLevel({
  "levelNumber": 20,
  "title": "The Order That Disappeared",
  "description": "A shopper completes checkout, pays $120, and is immediately redirected to the order confirmation page. The page displays an error: 'Order Not Found!' In a panic, the shopper clicks 'Pay Now' again, getting billed twice. Tracing reveals the order was committed to the primary database, but the confirmation page queried our read replica, which was 600 milliseconds behind.",
  "dialogue": [
      {
          "character": "byte",
          "emotion": "thinking",
          "text": "This is the classic 'Read-Your-Own-Writes' consistency bug! The customer created an order on the primary writer, but their browser was routed to a read replica that was half a second behind. To the replica, the order literally did not exist yet!"
      }
  ],
  "metrics": [
    {
      "label": "Replay lag p95 / p99",
      "value": "1.8 s / 4.2 s",
      "severity": "critical"
    },
    {
      "label": "Post-checkout lookup",
      "value": "reader route",
      "severity": "warning"
    },
    {
      "label": "Primary commit failures",
      "value": "0%",
      "severity": "normal"
    }
  ],
  "choices": [
    {
      "id": "020-measured",
      "label": "Route critical reads by consistency need",
      "description": "Keep checkout confirmations and immediate order lookups on the primary; use a commit token for subsequent replica reads with a bounded wait and controlled primary fallback.",
      "cost": 8000,
      "tone": "recommended",
      "effects": {
        "users": 150000,
        "monthlyRevenue": 55000,
        "monthlyBurn": 5500,
        "engineers": 0,
        "reliability": 3,
        "customerTrust": 2,
        "complexity": -1,
        "xp": 200,
        "confidence": 8
      },
      "tradeoff": {
        "upsideLabel": "Targeted improvement",
        "downsideLabel": "Cost and ownership",
        "upside": "Read-after-write works without forcing every report to be synchronous.",
        "downside": "Primary fallback requires a budget; routing rules must follow the user journey.",
        "byteExplanation": "We establish a session-aware read policy: for 5 seconds after a user performs a write (like placing an order or editing inventory), their subsequent read requests are pinned to the primary database. After 5 seconds, once replication lag is safely passed, their reads return to the read replica.",
        "effectReasons": {
          "upfrontCost": "$4,500 covers session-aware database routing, replication watermark tracking, and checkout flow tests.",
          "monthlyBurn": "Primary database connection capacity and routing telemetry add $2,400/month.",
          "reliability": "Guarantees read-your-own-writes consistency across all user-facing mutation workflows.",
          "customerTrust": "Shoppers see their orders immediately upon payment, eliminating duplicate payment attempts.",
          "complexity": "The database router must inspect user session tokens to decide whether to query the primary or replica."
        }
      },
      "architectureChanges": changesFor("consistent-reads"),
      "outcomeTitle": "The buyer reads their own write.",
      "outcomeDialogue": "Ghost orders are gone! When a shopper places an order, their confirmation page reads directly from the primary database where the order was just saved, while general browsing continues to use the replica.",
      "outcomeEmotion": "happy",
      "outcomeNote": "Consistency belongs to a workflow, not a blanket database label. Next pressure: Primary routing fixes visibility but primary availability still needs a failover contract."
    },
    {
      "id": "020-bounded",
      "label": "Return all reads to the primary",
      "description": "Disable reader routing and resize the primary for the mixed workload.",
      "cost": 3600,
      "tone": "neutral",
      "effects": {
        "users": 105000,
        "monthlyRevenue": 38500,
        "monthlyBurn": 7700,
        "engineers": 0,
        "reliability": 1,
        "customerTrust": 1,
        "complexity": 0,
        "xp": 100,
        "confidence": 3
      },
      "tradeoff": {
        "upsideLabel": "Smaller contract",
        "downsideLabel": "Limits accepted",
        "upside": "A single read source gives straightforward visibility semantics.",
        "downside": "Reports again consume write-tier headroom and raise infrastructure spend.",
        "byteExplanation": "Passing the newly created order details directly in the checkout response or encrypted client state renders the confirmation page without querying the replica at all. It avoids database routing logic, though it only protects the immediate confirmation screen.",
        "effectReasons": {
          "upfrontCost": "$2,025 covers updating checkout response payloads and client-side confirmation rendering.",
          "monthlyBurn": "Payload serialization and client state validation add $2,160/month.",
          "reliability": "Prevents confirmation page 404s without requiring complex dynamic database routing.",
          "customerTrust": "Immediate purchase reassurance prevents panic re-orders on checkout completion.",
          "complexity": "Keeps database topology simple, though client state must be securely validated."
        }
      },
      "architectureChanges": [...changesFor("consistent-reads", "primary-reads"), ...disable("reader-routing")],
      "outcomeTitle": "A narrower contract, deliberately.",
      "outcomeDialogue": "The confirmation page renders reliably from the client payload now. Shoppers see their receipt instantly, though clicking 'Order History' within a few seconds can still show slight replication lag.",
      "outcomeEmotion": "thinking",
      "outcomeNote": "Consistency belongs to a workflow, not a blanket database label. Next pressure: Primary routing fixes visibility but primary availability still needs a failover contract."
    },
    {
      "id": "020-shortcut",
      "label": "Sleep one second before the lookup",
      "description": "Delay the client before issuing the same replica read.",
      "cost": 5200,
      "tone": "risky",
      "effects": {
        "users": 45000,
        "monthlyRevenue": 16500,
        "monthlyBurn": 6325,
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
        "upside": "A delay can hide some short replication gaps.",
        "downside": "Observed lag exceeds one second, so elapsed time is not a consistency guarantee.",
        "byteExplanation": "Adding a 1-second sleep delay before loading the confirmation page is a horrific anti-pattern. If replication lag spikes to 1.5 seconds during a busy sale, the bug still happens. And in the meantime, you have deliberately forced every single paying customer to stare at a blank screen for a second!",
        "effectReasons": {
          "upfrontCost": "$2,925 is wasted on artificial sleep delays and hacky frontend timers.",
          "monthlyBurn": "Tied-up worker threads waiting on sleep timers inflate monthly spend by $2,760.",
          "reliability": "Arbitrary sleep timers cannot guarantee consistency when replication lag fluctuates under load.",
          "customerTrust": "Intentionally slow confirmation screens frustrate shoppers without actually solving the missing order bug.",
          "complexity": "Injecting sleep calls into request pipelines degrades worker capacity and creates difficult race conditions."
        }
      },
      "architectureChanges": changesFor("sleep-consistency"),
      "outcomeTitle": "The trade-off catches up.",
      "outcomeDialogue": "The arbitrary delay failed. During our evening traffic peak, replication lag hit two seconds, and customers STILL saw 'Order Not Found' after waiting through our artificial 1-second freeze!",
      "outcomeEmotion": "concerned",
      "outcomeNote": "Consistency belongs to a workflow, not a blanket database label. The retained risk remains part of your company’s architecture."
    }
  ],
  "hints": [
    "A read-after-write workflow was incorrectly classified as lag tolerant.",
    "Consistency belongs to a workflow, not a blanket database label."
  ],
  "lesson": "Guarantee 'read-your-own-writes' consistency: immediately after a user performs an action, route their subsequent reads to the primary database (or wait for replica catch-up) so they never see their own changes vanish.",
  "variants": [
    {
      "id": "without-reader-routing",
      "when": {
        "missingAny": [
          "reader-routing"
        ]
      },
      "description": "You kept reports on the primary. The mobile team proposes a replica route; its prelaunch test shows a newly created order missing for up to 4.2 seconds. Keep production reads consistent while deciding whether to enable that route.",
      "metrics": [
        {
          "label": "Production lookup",
          "value": "primary",
          "severity": "normal"
        },
        {
          "label": "Prototype replay lag p99",
          "value": "4.2 s",
          "severity": "critical"
        },
        {
          "label": "Primary commit failures",
          "value": "0%",
          "severity": "normal"
        }
      ],
      "dialogue": [
        {
          "character": "byte",
          "emotion": "thinking",
          "text": "You kept reports on the primary. The mobile team proposes a replica route; its prelaunch test shows a newly created order missing for up to 4.2 seconds. Keep production reads consistent while deciding whether to enable that route."
        },
        {
          "character": "byte",
          "emotion": "thinking",
          "text": "The order is there. We asked a reader that has not seen it yet. A one-second sleep is not proof that replication has caught up."
        }
      ]
    }
  ]
});
