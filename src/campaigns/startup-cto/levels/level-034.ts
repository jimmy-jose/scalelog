import { defineStartupLevel, changesFor } from "./authoring";

export const level034 = defineStartupLevel({
  "levelNumber": 34,
  "title": "The Region Is Unreachable",
  "description": "International merchants request regional disaster recovery, not active-active writes. The business accepts up to 60 seconds of committed-data loss in a regional catastrophe and a 15-minute RTO; a zone failure still has the stricter existing contract.",
  "dialogue": [
    {
      "character": "jimmy",
      "emotion": "thinking",
      "text": "The business gave us a loss budget and a recovery deadline. That is more useful than a request for active-active. Test every dependency needed to reopen checkout."
    },
    {
      "character": "jimmy",
      "emotion": "normal",
      "text": "This month’s operating plan adds 3 engineers. Their compensation is included in every response’s recurring burn. Ownership has to grow with the architecture."
    }
  ],
  "metrics": [
    {
      "label": "Cold regional restore drill",
      "value": "4 h",
      "severity": "critical"
    },
    {
      "label": "Business regional contract",
      "value": "RPO 60 s / RTO 15 min",
      "severity": "normal"
    },
    {
      "label": "Inter-region RTT",
      "value": "170 ms",
      "severity": "warning"
    }
  ],
  "choices": [
    {
      "id": "034-measured",
      "label": "Maintain a fenced warm standby region",
      "description": "Replicate every writer group asynchronously, retain independent commit/replay watermarks, replicate retained media storage (objects or shared files), configuration and replayable delivery intents, and rehearse fencing and traffic shifts within 15 minutes. Promote only when evidence for every writer bounds loss to 60 seconds; stale or unknown evidence blocks automatic promotion. Hire three operators.",
      "cost": 85000,
      "tone": "recommended",
      "effects": {
        "users": 200000,
        "monthlyRevenue": 125000,
        "monthlyBurn": 52000,
        "engineers": 3,
        "reliability": 3,
        "customerTrust": 2,
        "complexity": 3,
        "xp": 240,
        "confidence": 8
      },
      "tradeoff": {
        "upsideLabel": "Targeted improvement",
        "downsideLabel": "Cost and ownership",
        "upside": "Warm recovery meets the rehearsed regional contract without concurrent cross-region writers.",
        "downside": "Stale lag samples cannot prove a hard loss bound. If evidence is insufficient, wait or explicitly renegotiate the loss/recovery contract; reconcile payments and event gaps after promotion and rehearse failback.",
        "jimmyExplanation": "Warm recovery meets the rehearsed regional contract without concurrent cross-region writers. Stale lag samples cannot prove a hard loss bound. If evidence is insufficient, wait or explicitly renegotiate the loss/recovery contract; reconcile payments and event gaps after promotion and rehearse failback.",
        "effectReasons": {
          "upfrontCost": "$85,000 funds this rollout, verification and migration effort.",
          "monthlyBurn": "The monthly change is $+52,000, including 3 hires and the operating costs of this response.",
          "reliability": "Stale lag samples cannot prove a hard loss bound. If evidence is insufficient, wait or explicitly renegotiate the loss/recovery contract; reconcile payments and event gaps after promotion and rehearse failback.",
          "customerTrust": "Merchant retention follows the response’s stated service contract and remaining risk.",
          "complexity": "Operational load includes the rollout, ownership and ongoing failure modes described here."
        }
      },
      "architectureChanges": changesFor("regional-dr"),
      "outcomeTitle": "Regional recovery is rehearsed.",
      "outcomeDialogue": "Warm recovery meets the rehearsed regional contract without concurrent cross-region writers. Stale lag samples cannot prove a hard loss bound. If evidence is insufficient, wait or explicitly renegotiate the loss/recovery contract; reconcile payments and event gaps after promotion and rehearse failback.",
      "outcomeEmotion": "happy",
      "outcomeNote": "Regional architecture follows RPO/RTO and conflict semantics, not a universal active-active ideal. Next pressure: Recovery drills must include queues, objects, secrets, routing and payment reconciliation, not only databases."
    },
    {
      "id": "034-bounded",
      "label": "Negotiate four-hour disaster recovery",
      "description": "Keep verified cross-region backups and publish a four-hour RTO tier instead of maintaining warm compute. Hire three operators.",
      "cost": 38250,
      "tone": "neutral",
      "effects": {
        "users": 140000,
        "monthlyRevenue": 87500,
        "monthlyBurn": 44200,
        "engineers": 3,
        "reliability": 1,
        "customerTrust": 1,
        "complexity": 0,
        "xp": 120,
        "confidence": 3
      },
      "tradeoff": {
        "upsideLabel": "Smaller contract",
        "downsideLabel": "Limits accepted",
        "upside": "Lower steady-state cost is legitimate for customers who accept the recovery delay.",
        "downside": "It cannot meet the premium 15-minute promise, so enterprise expansion is limited.",
        "jimmyExplanation": "Lower steady-state cost is legitimate for customers who accept the recovery delay. It cannot meet the premium 15-minute promise, so enterprise expansion is limited.",
        "effectReasons": {
          "upfrontCost": "$38,250 funds this rollout, verification and migration effort.",
          "monthlyBurn": "The monthly change is $+44,200, including 3 hires and the operating costs of this response.",
          "reliability": "It cannot meet the premium 15-minute promise, so enterprise expansion is limited.",
          "customerTrust": "Merchant retention follows the response’s stated service contract and remaining risk.",
          "complexity": "Operational load includes the rollout, ownership and ongoing failure modes described here."
        }
      },
      "architectureChanges": changesFor("cold-dr"),
      "outcomeTitle": "A narrower contract, deliberately.",
      "outcomeDialogue": "Lower steady-state cost is legitimate for customers who accept the recovery delay. It cannot meet the premium 15-minute promise, so enterprise expansion is limited.",
      "outcomeEmotion": "thinking",
      "outcomeNote": "Regional architecture follows RPO/RTO and conflict semantics, not a universal active-active ideal. Next pressure: Recovery drills must include queues, objects, secrets, routing and payment reconciliation, not only databases."
    },
    {
      "id": "034-shortcut",
      "label": "Accept writes in both regions immediately",
      "description": "Enable independent region-local writers for the same tenants during network partitions. Hire three operators.",
      "cost": 55250,
      "tone": "risky",
      "effects": {
        "users": 60000,
        "monthlyRevenue": 37500,
        "monthlyBurn": 59800,
        "engineers": 3,
        "reliability": -25,
        "customerTrust": -18,
        "complexity": 7,
        "xp": -30,
        "confidence": -22
      },
      "tradeoff": {
        "upsideLabel": "Immediate relief",
        "downsideLabel": "Unresolved risk",
        "upside": "Local write latency remains low in both regions.",
        "downside": "Without conflict and inventory semantics, concurrent writes can oversell stock; asynchronous replication alone does not resolve them.",
        "jimmyExplanation": "Local write latency remains low in both regions. Without conflict and inventory semantics, concurrent writes can oversell stock; asynchronous replication alone does not resolve them.",
        "effectReasons": {
          "upfrontCost": "$55,250 funds this rollout, verification and migration effort.",
          "monthlyBurn": "The monthly change is $+59,800, including 3 hires and the operating costs of this response.",
          "reliability": "Without conflict and inventory semantics, concurrent writes can oversell stock; asynchronous replication alone does not resolve them.",
          "customerTrust": "Merchant retention follows the response’s stated service contract and remaining risk.",
          "complexity": "Operational load includes the rollout, ownership and ongoing failure modes described here."
        }
      },
      "architectureChanges": changesFor("uncoordinated-multiwriter"),
      "outcomeTitle": "The trade-off catches up.",
      "outcomeDialogue": "Local write latency remains low in both regions. Without conflict and inventory semantics, concurrent writes can oversell stock; asynchronous replication alone does not resolve them.",
      "outcomeEmotion": "concerned",
      "outcomeNote": "Regional architecture follows RPO/RTO and conflict semantics, not a universal active-active ideal. The retained risk remains part of your company’s architecture."
    }
  ],
  "hints": [
    "Zone-local redundancy does not survive regional isolation within the promised recovery time.",
    "Regional architecture follows RPO/RTO and conflict semantics, not a universal active-active ideal."
  ],
  "lesson": "Regional architecture follows RPO/RTO and conflict semantics, not a universal active-active ideal.",
  "recoveries": [
    {
      "capability": "pitr",
      "choiceIds": [
        "034-measured",
        "034-bounded"
      ],
      "description": "Establish a tested independent recovery archive before regional recovery.",
      "cost": 14000,
      "monthlyBurn": 4500,
      "complexity": 1,
      "architectureChanges": changesFor("pitr")
    }
  ]
});
