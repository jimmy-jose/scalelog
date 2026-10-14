import { defineStartupLevel, changesFor } from "./authoring";

export const level021 = defineStartupLevel({
  "levelNumber": 21,
  "title": "A Zone Goes Dark",
  "description": "A power failure knocks out an entire cloud Availability Zone (data center), abruptly killing our primary database server. Enterprise merchants require zero lost orders for single-zone failures (Recovery Point Objective RPO = 0) and recovery within two minutes (RTO < 2 min). With standard asynchronous replication, completed orders that were in-flight over the network when the data center died are lost forever.",
  "dialogue": [
      {
          "character": "byte",
          "emotion": "thinking",
          "text": "If you promise 'zero lost data' (RPO = 0), asynchronous replication is not enough! With async replication, the primary tells the user 'Success!' before the standby server in Zone B has written the data. If Zone A dies, those orders vanish into thin air. We need synchronous quorum replication across zones."
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
        "byteExplanation": "We deploy a primary and two synchronous standby replicas across three independent Availability Zones using synchronous commit (synchronous_commit = on). A transaction is only confirmed to the shopper once at least one standby in another zone confirms receipt. Automated fenced failover promotes the standby within 60 seconds if the primary dies, achieving true RPO 0.",
        "effectReasons": {
          "upfrontCost": "$6,000 covers 3-AZ synchronous replica provisioning, fencing agent configuration, and automated failover drills.",
          "monthlyBurn": "Running two multi-zone synchronous database standbys with cross-AZ traffic adds $3,600/month.",
          "reliability": "Guarantees zero data loss (RPO = 0) and sub-2-minute recovery (RTO < 2 min) during full data center outages.",
          "customerTrust": "Enterprise merchants sign multi-year contracts backed by proven, rehearsed disaster recovery guarantees.",
          "complexity": "Synchronous replication adds slight network commit latency and requires careful quorum fencing to avoid split-brain."
        }
      },
      "architectureChanges": changesFor("multi-az"),
      "outcomeTitle": "Promotion has a durability contract.",
      "outcomeDialogue": "Multi-AZ synchronous replication tested and verified! When Zone A went dark, automated failover promoted the Zone B standby in 45 seconds with zero lost orders. Enterprise merchants are thrilled.",
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
        "byteExplanation": "Maintaining an asynchronous standby with automated failover recovers the database in two minutes (RTO < 2 min), but accepts up to 30 seconds of data loss (RPO = 30s) during a sudden catastrophe. It avoids synchronous write latency and saves money, but enterprise merchants must accept the risk of slight data loss.",
        "effectReasons": {
          "upfrontCost": "$2,700 covers asynchronous standby setup, automated failover scripting, and recovery documentation.",
          "monthlyBurn": "Operating a single cross-zone asynchronous standby adds $3,240/month.",
          "reliability": "Restores database availability rapidly after a zone failure, but accepts bounded in-flight transaction loss.",
          "customerTrust": "Fast recovery pleases merchants, though auditing and reconciling lost in-flight orders requires support effort.",
          "complexity": "Easier to operate than synchronous quorum, without the write latency overhead of synchronous commits."
        }
      },
      "architectureChanges": changesFor("async-ha"),
      "outcomeTitle": "A narrower contract, deliberately.",
      "outcomeDialogue": "The async standby successfully restored database service in 90 seconds. It meets our recovery time goal, though we had to explain to merchants that a few recent in-flight orders required manual verification.",
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
        "byteExplanation": "Promoting a standby blindly without fencing or checking replication lag guarantees a split-brain disaster or severe data loss. If the old primary comes back online while the new one is accepting writes, you end up with two divergent databases with conflicting order IDs and corrupted inventory!",
        "effectReasons": {
          "upfrontCost": "$3,900 is burned recovering from an unfenced split-brain failover.",
          "monthlyBurn": "Emergency database repair and data reconciliation tools add $4,140/month.",
          "reliability": "Unfenced failovers corrupt relational integrity, generate duplicate keys, and cause severe split-brain outages.",
          "customerTrust": "Merchants experience corrupted sales data and conflicting reports, destroying trust in platform accuracy.",
          "complexity": "Untangling two divergent PostgreSQL write-ahead logs (WAL) by hand is an operational nightmare."
        }
      },
      "architectureChanges": changesFor("unfenced-failover"),
      "outcomeTitle": "The trade-off catches up.",
      "outcomeDialogue": "Split-brain catastrophe! Both database instances started accepting writes simultaneously with different order sequences. Reconciling conflicting orders took 48 hours of manual engineering labor.",
      "outcomeEmotion": "concerned",
      "outcomeNote": "Define the failure domain and acknowledgement policy before promising RPO zero. The retained risk remains part of your company’s architecture."
    }
  ],
  "hints": [
    "Capacity replicas are not automatically a fenced, synchronous high-availability system.",
    "Define the failure domain and acknowledgement policy before promising RPO zero."
  ],
  "lesson": "Zero data loss (RPO = 0) requires synchronous replication: a transaction is not confirmed to the user until at least one standby server in a separate availability zone confirms it has written the data to disk."
});
