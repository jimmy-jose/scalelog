import { defineStartupLevel, changesFor } from "./authoring";

export const level021 = defineStartupLevel({
  "levelNumber": 21,
  "title": "A Zone Goes Dark",
  "description": "An availability-zone failure takes out the primary. Enterprise merchants require no loss of acknowledged orders for a single-zone failure and recovery within two minutes. A candidate asynchronous-standby rehearsal shows that replication alone would not satisfy that promise.",
  "dialogue": [
    {
      "character": "jimmy",
      "emotion": "thinking",
      "text": "A spare database is not an availability policy. Before we promote it, who can prove the old writer is fenced and the acknowledged data is present?"
    },
    {
      "character": "jimmy",
      "emotion": "normal",
      "text": "This month’s operating plan adds 2 engineers. Their compensation is included in every response’s recurring burn. Ownership has to grow with the architecture."
    }
  ],
  "metrics": [
    {
      "label": "Failover drill",
      "value": "18 min",
      "severity": "critical"
    },
    {
      "label": "Candidate async replay gap",
      "value": "2 s",
      "severity": "warning"
    },
    {
      "label": "Zone-failure contract",
      "value": "RPO 0; RTO 2 min",
      "severity": "normal"
    }
  ],
  "choices": [
    {
      "id": "021-measured",
      "label": "Build tested multi-AZ failover",
      "description": "Use a primary and two standby candidates across three AZs; acknowledge commits after at least one remote durable WAL flush. Fence the former writer and elect a standby containing all acknowledged WAL, place app/queues across AZs, and rehearse reconnects. Stop writes without a durability quorum. Hire two reliability engineers.",
      "cost": 16000,
      "tone": "recommended",
      "effects": {
        "users": 150000,
        "monthlyRevenue": 60000,
        "monthlyBurn": 20000,
        "engineers": 2,
        "reliability": 3,
        "customerTrust": 2,
        "complexity": 2,
        "xp": 200,
        "confidence": 8
      },
      "tradeoff": {
        "upsideLabel": "Targeted improvement",
        "downsideLabel": "Cost and ownership",
        "upside": "The specified single-zone failure can meet RPO 0 and the measured two-minute RTO.",
        "downside": "Synchronous acknowledgement adds intra-region latency and may sacrifice write availability when quorum is unavailable.",
        "jimmyExplanation": "The specified single-zone failure can meet RPO 0 and the measured two-minute RTO. Synchronous acknowledgement adds intra-region latency and may sacrifice write availability when quorum is unavailable.",
        "effectReasons": {
          "upfrontCost": "$16,000 funds this rollout, verification and migration effort.",
          "monthlyBurn": "The monthly change is $+20,000, including 2 hires and the operating costs of this response.",
          "reliability": "Synchronous acknowledgement adds intra-region latency and may sacrifice write availability when quorum is unavailable.",
          "customerTrust": "Merchant retention follows the response’s stated service contract and remaining risk.",
          "complexity": "Operational load includes the rollout, ownership and ongoing failure modes described here."
        }
      },
      "architectureChanges": changesFor("multi-az"),
      "outcomeTitle": "Promotion has a durability contract.",
      "outcomeDialogue": "The specified single-zone failure can meet RPO 0 and the measured two-minute RTO. Synchronous acknowledgement adds intra-region latency and may sacrifice write availability when quorum is unavailable.",
      "outcomeEmotion": "happy",
      "outcomeNote": "Define the failure domain and acknowledgement policy before promising RPO zero. Next pressure: Replication also copies accidental deletes; the next drill tests restoration, not failover."
    },
    {
      "id": "021-bounded",
      "label": "Use asynchronous failover with a revised SLA",
      "description": "Fence the old primary and promote an asynchronous standby only when independently recorded commit/replay evidence bounds loss to five seconds. Pause promotion if that bound is unknown or exceeded; negotiate this weaker tier before selling it. Hire two engineers.",
      "cost": 7200,
      "tone": "neutral",
      "effects": {
        "users": 105000,
        "monthlyRevenue": 42000,
        "monthlyBurn": 17000,
        "engineers": 2,
        "reliability": 1,
        "customerTrust": 1,
        "complexity": 0,
        "xp": 100,
        "confidence": 3
      },
      "tradeoff": {
        "upsideLabel": "Smaller contract",
        "downsideLabel": "Limits accepted",
        "upside": "Lower commit latency and cost are viable when the customer accepts possible loss.",
        "downside": "A lag alarm alone cannot guarantee a loss bound during isolation. Blocking promotion can miss the recovery-time target; this tier does not satisfy the RPO-zero contract.",
        "jimmyExplanation": "Lower commit latency and cost are viable when the customer accepts possible loss. A lag alarm alone cannot guarantee a loss bound during isolation. Blocking promotion can miss the recovery-time target; this tier does not satisfy the RPO-zero contract.",
        "effectReasons": {
          "upfrontCost": "$7,200 funds this rollout, verification and migration effort.",
          "monthlyBurn": "The monthly change is $+17,000, including 2 hires and the operating costs of this response.",
          "reliability": "A lag alarm alone cannot guarantee a loss bound during isolation. Blocking promotion can miss the recovery-time target; this tier does not satisfy the RPO-zero contract.",
          "customerTrust": "Merchant retention follows the response’s stated service contract and remaining risk.",
          "complexity": "Operational load includes the rollout, ownership and ongoing failure modes described here."
        }
      },
      "architectureChanges": changesFor("async-ha"),
      "outcomeTitle": "A narrower contract, deliberately.",
      "outcomeDialogue": "Lower commit latency and cost are viable when the customer accepts possible loss. A lag alarm alone cannot guarantee a loss bound during isolation. Blocking promotion can miss the recovery-time target; this tier does not satisfy the RPO-zero contract.",
      "outcomeEmotion": "thinking",
      "outcomeNote": "Define the failure domain and acknowledgement policy before promising RPO zero. Next pressure: Replication also copies accidental deletes; the next drill tests restoration, not failover."
    },
    {
      "id": "021-shortcut",
      "label": "Promote on a heartbeat timeout alone",
      "description": "Let either database promote itself when it cannot contact the other. Hire two engineers.",
      "cost": 10400,
      "tone": "risky",
      "effects": {
        "users": 45000,
        "monthlyRevenue": 18000,
        "monthlyBurn": 23000,
        "engineers": 2,
        "reliability": -25,
        "customerTrust": -18,
        "complexity": 7,
        "xp": -30,
        "confidence": -22
      },
      "tradeoff": {
        "upsideLabel": "Immediate relief",
        "downsideLabel": "Unresolved risk",
        "upside": "Promotion is fast during a simple host failure.",
        "downside": "A network partition can leave two writers without fencing, violating order consistency.",
        "jimmyExplanation": "Promotion is fast during a simple host failure. A network partition can leave two writers without fencing, violating order consistency.",
        "effectReasons": {
          "upfrontCost": "$10,400 funds this rollout, verification and migration effort.",
          "monthlyBurn": "The monthly change is $+23,000, including 2 hires and the operating costs of this response.",
          "reliability": "A network partition can leave two writers without fencing, violating order consistency.",
          "customerTrust": "Merchant retention follows the response’s stated service contract and remaining risk.",
          "complexity": "Operational load includes the rollout, ownership and ongoing failure modes described here."
        }
      },
      "architectureChanges": changesFor("unfenced-failover"),
      "outcomeTitle": "The trade-off catches up.",
      "outcomeDialogue": "Promotion is fast during a simple host failure. A network partition can leave two writers without fencing, violating order consistency.",
      "outcomeEmotion": "concerned",
      "outcomeNote": "Define the failure domain and acknowledgement policy before promising RPO zero. The retained risk remains part of your company’s architecture."
    }
  ],
  "hints": [
    "Capacity replicas are not automatically a fenced, synchronous high-availability system.",
    "Define the failure domain and acknowledgement policy before promising RPO zero."
  ],
  "lesson": "Define the failure domain and acknowledgement policy before promising RPO zero."
});
