import { premiumLaunchCapabilities, launchHazards } from "../launchContract";
import { defineStartupLevel, changesFor } from "./authoring";

export const level036 = defineStartupLevel({
  "levelNumber": 36,
  "title": "The Cartline Launch Review",
  "description": "The founder proposes a global merchant launch. The expected peak load is 4 million registered users, 400,000 daily active users, 3,000 peak origin requests per second, and 6 terabytes of relational data. Every architectural decision we made over the past three years will now be put to the ultimate test.",
  "dialogue": [
      {
          "character": "jimmy",
          "emotion": "thinking",
          "text": "Three years of scaling have brought us here. We don't launch on hope or whiteboard diagrams; we launch on proven benchmarks, rehearsed disaster recovery drills, and realistic capacity boundaries."
      }
  ],
  "metrics": [
    {
      "label": "Peak origin / order rate",
      "value": "3,000 RPS / 200 orders/s",
      "severity": "normal"
    },
    {
      "label": "Feed + order mutations",
      "value": "24,000/s peak across writer groups",
      "severity": "warning"
    },
    {
      "label": "Checkout SLO",
      "value": "99.9% monthly; p95 500 ms; p99 1.5 s",
      "severity": "normal"
    },
    {
      "label": "Regional recovery",
      "value": "RPO 60 s / RTO 15 min",
      "severity": "normal"
    },
    {
      "label": "Monthly infrastructure ceiling",
      "value": "$180,000 within total burn",
      "severity": "warning"
    }
  ],
  "choices": [
    {
      "id": "036-measured",
      "label": "Gate the launch on an integrated rehearsal",
      "description": "Test the exact topology at the forecast peak plus 30% headroom, zone loss, cache failure and provider stalls. Audit payment/stock invariants, restore every writer group, measure cost and drain time, and publish the proven envelope with named owners.",
      "cost": 60000,
      "tone": "recommended",
      "effects": {
        "users": 100000,
        "monthlyRevenue": 120000,
        "monthlyBurn": 15000,
        "engineers": 0,
        "reliability": 3,
        "customerTrust": 2,
        "complexity": -3,
        "xp": 260,
        "confidence": 8
      },
      "tradeoff": {
        "upsideLabel": "Targeted improvement",
        "downsideLabel": "Cost and ownership",
        "upside": "An earned launch contract combines capacity, correctness and recovery evidence.",
        "downside": "A full production rehearsal consumes significant compute budget and engineering time; ongoing traffic growth will still require continuous measurement.",
        "jimmyExplanation": "We subject our entire production topology to a full end-to-end rehearsal at peak forecast load plus 30% headroom, simulate regional failover, verify payment idempotency, and test priority load shedding. We only sign off when the data proves we can handle the load.",
        "effectReasons": {
          "upfrontCost": "$60,000 covers full-scale synthetic load testing, chaos engineering drills, and third-party security audits.",
          "monthlyBurn": "Full-scale production monitoring, enterprise support tiers, and infrastructure capacity cost $15,000/month.",
          "reliability": "Validates all capacity, consistency, and disaster recovery guarantees under sustained production traffic.",
          "customerTrust": "Merchants and global brands launch with absolute confidence in our platform stability and contractual SLAs.",
          "complexity": "Disciplined operational runbooks and rehearsed failure modes keep ongoing architecture clean and manageable."
        }
      },
      "architectureChanges": changesFor("launch-reviewed", "launch-qualified"),
      "outcomeTitle": "The launch has a proven envelope.",
      "outcomeDialogue": "The global launch rehearsal was an unqualified success! Every system held within its latency budgets, regional failover was seamless, and the board has certified Cartline for global scale.",
      "outcomeEmotion": "happy",
      "outcomeNote": "The simplest acceptable architecture is the one demonstrated to meet the workload and business contract. Next pressure: Completion records the architecture actually built and its launch scope; no design handles arbitrary future load."
    },
    {
      "id": "036-bounded",
      "label": "Launch a smaller contracted cohort",
      "description": "Limit onboarding to measured current capacity, retain a waitlist, reduce availability/recovery promises where necessary and publish unresolved architecture work.",
      "cost": 27000,
      "tone": "neutral",
      "effects": {
        "users": 70000,
        "monthlyRevenue": 84000,
        "monthlyBurn": 12750,
        "engineers": 0,
        "reliability": 1,
        "customerTrust": 1,
        "complexity": 0,
        "xp": 130,
        "confidence": 3
      },
      "tradeoff": {
        "upsideLabel": "Smaller contract",
        "downsideLabel": "Limits accepted",
        "upside": "A viable narrower launch preserves the architecture actually built.",
        "downside": "It sacrifices near-term revenue and the premium global SLA; omitted capabilities remain visible.",
        "jimmyExplanation": "Limiting the initial launch cohort to 1 million users with a staged waitlist guarantees our existing architecture will not be overwhelmed, while giving the engineering team time to observe real production metrics before unlocking global scale.",
        "effectReasons": {
          "upfrontCost": "$27,000 covers waitlist onboarding portals and cohort management tooling.",
          "monthlyBurn": "Staged launch monitoring and cohort support cost $12,750/month.",
          "reliability": "Protects production capacity by strictly bounding incoming user growth to measured server limits.",
          "customerTrust": "Onboarded merchants experience flawless stability, though waitlisted merchants must wait for capacity expansions.",
          "complexity": "Avoids high-stress launch day surprises, allowing measured and controlled operational expansion."
        }
      },
      "architectureChanges": changesFor("scoped-launch"),
      "outcomeTitle": "A narrower contract, deliberately.",
      "outcomeDialogue": "The bounded launch went off without a hitch. The waitlist kept traffic safely within our proven boundaries, and the team is steadily onboarding new merchants each week.",
      "outcomeEmotion": "thinking",
      "outcomeNote": "The simplest acceptable architecture is the one demonstrated to meet the workload and business contract. Next pressure: Completion records the architecture actually built and its launch scope; no design handles arbitrary future load."
    },
    {
      "id": "036-shortcut",
      "label": "Open the full launch before rehearsals",
      "description": "Assume nominal component capacities add up and accept all merchants with the premium SLA.",
      "cost": 39000,
      "tone": "risky",
      "effects": {
        "users": 30000,
        "monthlyRevenue": 36000,
        "monthlyBurn": 17250,
        "engineers": 0,
        "reliability": -70,
        "customerTrust": -18,
        "complexity": 7,
        "xp": -30,
        "confidence": -65
      },
      "tradeoff": {
        "upsideLabel": "Immediate relief",
        "downsideLabel": "Unresolved risk",
        "upside": "The market window opens immediately.",
        "downside": "Unverified bottlenecks and failure domains turn a forecast into an unsupported contractual promise.",
        "jimmyExplanation": "Opening the floodgates globally without integrated load testing or disaster rehearsals is pure gambling. Untested bottlenecks in payment reconciliation or shard routing will fail simultaneously under peak traffic.",
        "effectReasons": {
          "upfrontCost": "$39,000 is burned in emergency hotfixes, PR damage control, and incident triage.",
          "monthlyBurn": "Emergency incident response retainers and crisis infrastructure cost $17,250/month.",
          "reliability": "Simultaneous failures across unverified dependencies cause complete platform collapse under global peak load.",
          "customerTrust": "Public launch day crash destroys company credibility and leads to massive merchant churn.",
          "complexity": "Chaos in production: multiple teams debugging overlapping distributed failures without baseline metrics."
        }
      },
      "architectureChanges": changesFor("unverified-launch"),
      "outcomeTitle": "The trade-off catches up.",
      "outcomeDialogue": "Catastrophic launch day failure! Cascading database connection pool exhaustion and payment timeout storms knocked Cartline offline within twenty minutes of launch.",
      "outcomeEmotion": "concerned",
      "outcomeNote": "The simplest acceptable architecture is the one demonstrated to meet the workload and business contract. The retained risk remains part of your company’s architecture."
    }
  ],
  "hints": [
    "No single new component can certify capacity, consistency and recovery across the system; evidence and unresolved architecture debt determine a safe scope.",
    "The simplest acceptable architecture is the one demonstrated to meet the workload and business contract."
  ],
  "lesson": "The goal of software architecture is not to build the most complex system imaginable, but the simplest system that reliably supports the real business workload within budget. Verify your system with end-to-end load tests, know your failure boundaries, and keep it as boring as possible.",
  "variants": [
    {
      "id": "launch-prerequisites-missing",
      "when": {
        "missingAny": [...premiumLaunchCapabilities],
        "hasAny": [...launchHazards]
      },
      "description": "The founder proposes a global merchant launch. The planning envelope is 4 million registered users, 400,000 DAU, 500 average and 3,000 peak origin RPS (6×), up to 12,000 edge RPS, and 6 TB of relational data including indexes. This is a forecast; your actual company and topology decide the launch tier. Your saved architecture is missing part of the premium launch contract or retains an unresolved correctness risk. The recommended review must limit the launch; it cannot certify omitted capabilities.",
      "metrics": [
        {
          "label": "Peak origin / order rate",
          "value": "3,000 RPS / 200 orders/s",
          "severity": "normal"
        },
        {
          "label": "Feed + order mutations",
          "value": "24,000/s peak across writer groups",
          "severity": "warning"
        },
        {
          "label": "Checkout SLO",
          "value": "99.9% monthly; p95 500 ms; p99 1.5 s",
          "severity": "normal"
        },
        {
          "label": "Regional recovery",
          "value": "RPO 60 s / RTO 15 min",
          "severity": "normal"
        },
        {
          "label": "Monthly infrastructure ceiling",
          "value": "$180,000 within total burn",
          "severity": "warning"
        },
        {
          "label": "Premium launch readiness",
          "value": "gaps in saved architecture",
          "severity": "critical"
        }
      ],
      "dialogue": [
        {
          "character": "jimmy",
          "emotion": "concerned",
          "text": "We cannot promise the full forecast with the capabilities currently recorded. The review should name the gaps and reduce the launch scope, not draw boxes we never built."
        }
      ],
      "choices": [
        {
          "id": "036-measured",
          "label": "Rehearse, repair the plan, and limit the launch",
          "description": "Audit the actual topology against the premium forecast. Missing prerequisites block that SLA: launch only within measured capacity, publish the gaps and defer the wider cohort. This review does not silently install omitted components.",
          "cost": 60000,
          "tone": "recommended",
          "effects": {
            "users": 80000,
            "monthlyRevenue": 96000,
            "monthlyBurn": 15000,
            "engineers": 0,
            "reliability": 3,
            "customerTrust": 2,
            "complexity": -3,
            "xp": 260,
            "confidence": 8
          },
          "tradeoff": {
            "upsideLabel": "Targeted improvement",
            "downsideLabel": "Cost and ownership",
            "upside": "The review prevents an unsupported SLA and names an owner for each missing prerequisite.",
            "downside": "Growth is capped until the unresolved capacity, consistency and recovery gaps have been addressed.",
            "jimmyExplanation": "Your topology is the evidence. A constrained launch is viable; a premium promise is not yet supported.",
            "effectReasons": {
              "upfrontCost": "$60,000 funds this rollout, verification and migration effort.",
              "monthlyBurn": "The monthly change is $+15,000, including 0 hires and the operating costs of this response.",
              "reliability": "Passing a game decision is a modeled rehearsal, not a real production benchmark; continuing growth requires new measurements.",
              "customerTrust": "Merchant retention follows the response’s stated service contract and remaining risk.",
              "complexity": "Operational load includes the rollout, ownership and ongoing failure modes described here."
            }
          },
          "architectureChanges": changesFor("launch-reviewed", "scoped-launch"),
          "outcomeTitle": "An honest launch boundary.",
          "outcomeDialogue": "The review exposed missing prerequisites. Cartline launches a constrained cohort with its actual architecture; the premium forecast remains unqualified.",
          "outcomeEmotion": "happy",
          "outcomeNote": "You completed the review, not every architecture prerequisite. The ending records the remaining capability gaps."
        },
        {
          "id": "036-bounded",
          "label": "Launch a smaller contracted cohort",
          "description": "Limit onboarding to measured current capacity, retain a waitlist, reduce availability/recovery promises where necessary and publish unresolved architecture work.",
          "cost": 27000,
          "tone": "neutral",
          "effects": {
            "users": 70000,
            "monthlyRevenue": 84000,
            "monthlyBurn": 12750,
            "engineers": 0,
            "reliability": 1,
            "customerTrust": 1,
            "complexity": 0,
            "xp": 130,
            "confidence": 3
          },
          "tradeoff": {
            "upsideLabel": "Smaller contract",
            "downsideLabel": "Limits accepted",
            "upside": "A viable narrower launch preserves the architecture actually built.",
            "downside": "It sacrifices near-term revenue and the premium global SLA; omitted capabilities remain visible.",
            "jimmyExplanation": "A viable narrower launch preserves the architecture actually built. It sacrifices near-term revenue and the premium global SLA; omitted capabilities remain visible.",
            "effectReasons": {
              "upfrontCost": "$27,000 funds this rollout, verification and migration effort.",
              "monthlyBurn": "The monthly change is $+12,750, including 0 hires and the operating costs of this response.",
              "reliability": "It sacrifices near-term revenue and the premium global SLA; omitted capabilities remain visible.",
              "customerTrust": "Merchant retention follows the response’s stated service contract and remaining risk.",
              "complexity": "Operational load includes the rollout, ownership and ongoing failure modes described here."
            }
          },
          "architectureChanges": changesFor("scoped-launch"),
          "outcomeTitle": "A narrower contract, deliberately.",
          "outcomeDialogue": "A viable narrower launch preserves the architecture actually built. It sacrifices near-term revenue and the premium global SLA; omitted capabilities remain visible.",
          "outcomeEmotion": "thinking",
          "outcomeNote": "The simplest acceptable architecture is the one demonstrated to meet the workload and business contract. Next pressure: Completion records the architecture actually built and its launch scope; no design handles arbitrary future load."
        },
        {
          "id": "036-shortcut",
          "label": "Open the full launch before rehearsals",
          "description": "Assume nominal component capacities add up and accept all merchants with the premium SLA.",
          "cost": 39000,
          "tone": "risky",
          "effects": {
            "users": 30000,
            "monthlyRevenue": 36000,
            "monthlyBurn": 17250,
            "engineers": 0,
            "reliability": -70,
            "customerTrust": -18,
            "complexity": 7,
            "xp": -30,
            "confidence": -65
          },
          "tradeoff": {
            "upsideLabel": "Immediate relief",
            "downsideLabel": "Unresolved risk",
            "upside": "The market window opens immediately.",
            "downside": "Unverified bottlenecks and failure domains turn a forecast into an unsupported contractual promise.",
            "jimmyExplanation": "The market window opens immediately. Unverified bottlenecks and failure domains turn a forecast into an unsupported contractual promise.",
            "effectReasons": {
              "upfrontCost": "$39,000 funds this rollout, verification and migration effort.",
              "monthlyBurn": "The monthly change is $+17,250, including 0 hires and the operating costs of this response.",
              "reliability": "Unverified bottlenecks and failure domains turn a forecast into an unsupported contractual promise.",
              "customerTrust": "Merchant retention follows the response’s stated service contract and remaining risk.",
              "complexity": "Operational load includes the rollout, ownership and ongoing failure modes described here."
            }
          },
          "architectureChanges": changesFor("unverified-launch"),
          "outcomeTitle": "The trade-off catches up.",
          "outcomeDialogue": "The market window opens immediately. Unverified bottlenecks and failure domains turn a forecast into an unsupported contractual promise.",
          "outcomeEmotion": "concerned",
          "outcomeNote": "The simplest acceptable architecture is the one demonstrated to meet the workload and business contract. The retained risk remains part of your company’s architecture."
        }
      ]
    }
  ]
});
