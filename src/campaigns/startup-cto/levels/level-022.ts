import { defineStartupLevel, changesFor } from "./authoring";

export const level022 = defineStartupLevel({
  "levelNumber": 22,
  "title": "The Delete Reached Every Replica",
  "description": "During a late-night database maintenance task, a junior engineer accidentally runs DELETE FROM orders in production without a WHERE clause. Within 50 milliseconds, our read replicas and failover standbys faithfully execute the exact same command, wiping out orders everywhere. The nightly database backup is 19 hours old, but the business can only afford five minutes of lost data.",
  "dialogue": [
      {
          "character": "byte",
          "emotion": "thinking",
          "text": "Replicas are for hardware failover, NOT backups! A replica is a live mirror: if you shoot yourself in the foot, the replica shoots itself in the foot too. We need Point-In-Time Recovery (PITR) to rewind the database to the exact second before that delete command ran."
      }
  ],
  "metrics": [
    {
      "label": "Latest snapshot age",
      "value": "19 h",
      "severity": "critical"
    },
    {
      "label": "Deletion on replicas",
      "value": "yes",
      "severity": "critical"
    },
    {
      "label": "Recovery requirement",
      "value": "RPO 5 min / RTO 60 min",
      "severity": "normal"
    }
  ],
  "choices": [
    {
      "id": "022-measured",
      "label": "Archive WAL and rehearse point-in-time restore",
      "description": "Maintain encrypted base backups and continuous WAL archives with <5-minute archive lag; restore before the bad transaction into an isolated environment, validate, fence and reconcile later legitimate orders.",
      "cost": 15000,
      "tone": "recommended",
      "effects": {
        "users": 180000,
        "monthlyRevenue": 65000,
        "monthlyBurn": 7000,
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
        "upside": "A tested recovery path can undo logical corruption with explicit data reconciliation.",
        "downside": "A point-in-time restore also omits good writes after the chosen time; recovery is not just flipping a replica.",
        "byteExplanation": "Point-In-Time Recovery (PITR) combines daily base backups with continuous Write-Ahead Log (WAL) archiving to cloud object storage (S3). When a disaster strikes, we spin up an isolated database, replay WAL logs up to 23:14:02 (one second before the accidental delete), verify the recovered data, and restore with under five minutes of data loss.",
        "effectReasons": {
          "upfrontCost": "$5,200 covers WAL archiving pipelines, S3 storage buckets, automated recovery drills, and PITR restore scripts.",
          "monthlyBurn": "Continuous WAL streaming and encrypted long-term object storage add $3,000/month.",
          "reliability": "Enables restoring the database to any chosen second in time, neutralizing human error and software bugs.",
          "customerTrust": "Accidental data deletions are fully recoverable without permanent data loss, maintaining business integrity.",
          "complexity": "Requires testing backup restoration procedures regularly and monitoring WAL archive streaming latency."
        }
      },
      "architectureChanges": changesFor("pitr"),
      "outcomeTitle": "Recovery reaches back in time.",
      "outcomeDialogue": "PITR saved the company! We rewound the database to 23:14:02, exactly one second before the delete query executed. All 19 hours of orders were fully restored with zero data loss.",
      "outcomeEmotion": "happy",
      "outcomeNote": "Backups count only when a measured restore satisfies the recovery objective. Next pressure: Growing datasets require restore benchmarks and retention controls; schema changes must be staged safely."
    },
    {
      "id": "022-bounded",
      "label": "Take snapshots every hour",
      "description": "Use isolated hourly snapshots and a verified restore runbook, negotiating the longer loss window.",
      "cost": 6750,
      "tone": "neutral",
      "effects": {
        "users": 126000,
        "monthlyRevenue": 45500,
        "monthlyBurn": 5950,
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
        "upside": "Simple snapshots recover data without relying on production replicas.",
        "downside": "An hour between snapshots misses the required five-minute RPO.",
        "byteExplanation": "Taking hourly EBS storage snapshots reduces our data loss window from 19 hours down to 60 minutes. It is much cheaper and easier to automate than continuous WAL archiving, but the business must accept losing up to an hour of orders during a disaster.",
        "effectReasons": {
          "upfrontCost": "$2,340 covers snapshot automation policies, restore scripting, and snapshot retention rules.",
          "monthlyBurn": "Storing hourly disk volume snapshots adds $2,700/month.",
          "reliability": "Caps data loss to a predictable 1-hour window without operating complex WAL archiving infrastructure.",
          "customerTrust": "Merchants are relieved that 19 hours of data wasn't lost, though losing 45 minutes still requires explanations.",
          "complexity": "Simple to manage via cloud snapshot schedules, though recovery requires recreating volume attachments."
        }
      },
      "architectureChanges": changesFor("snapshots"),
      "outcomeTitle": "A narrower contract, deliberately.",
      "outcomeDialogue": "The hourly snapshot restored the database to 45 minutes ago. It prevented a total catastrophe, though customer support had to manually contact buyers from the missing 45-minute window.",
      "outcomeEmotion": "thinking",
      "outcomeNote": "Backups count only when a measured restore satisfies the recovery objective. Next pressure: Growing datasets require restore benchmarks and retention controls; schema changes must be staged safely."
    },
    {
      "id": "022-shortcut",
      "label": "Promote the fastest replica",
      "description": "Switch reads and writes to the reader with the lowest lag.",
      "cost": 9750,
      "tone": "risky",
      "effects": {
        "users": 54000,
        "monthlyRevenue": 19500,
        "monthlyBurn": 8050,
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
        "upside": "Useful for a failed primary when data is healthy.",
        "downside": "The fastest replica has already applied the deletion and cannot restore history.",
        "byteExplanation": "Relying solely on read replicas as your backup strategy is complete negligence. Replicas propagate DROP TABLE and DELETE queries within milliseconds. When a bad query runs, you have zero backup.",
        "effectReasons": {
          "upfrontCost": "$3,380 is burned during emergency data recovery and forensic analysis.",
          "monthlyBurn": "Manual data patch tools and external audit consultants add $3,450/month.",
          "reliability": "Leaves the company with a catastrophic 24-hour data loss window whenever human error occurs.",
          "customerTrust": "Permanent loss of a full day's commercial transactions destroys merchant trust and causes massive churn.",
          "complexity": "Reconciling 19 hours of missing transactions from third-party Stripe logs takes weeks of grueling effort."
        }
      },
      "architectureChanges": changesFor("deleted-replica"),
      "outcomeTitle": "The trade-off catches up.",
      "outcomeDialogue": "We had to restore from the 19-hour-old nightly backup. 19 hours of customer orders, payments, and tracking numbers are permanently gone. Merchants are furious and threatening legal action.",
      "outcomeEmotion": "concerned",
      "outcomeNote": "Backups count only when a measured restore satisfies the recovery objective. The retained risk remains part of your company’s architecture."
    }
  ],
  "hints": [
    "Replication preserves availability, not independent historical recovery points.",
    "Backups count only when a measured restore satisfies the recovery objective."
  ],
  "lesson": "Replicas do not protect against human error: you need Point-In-Time Recovery (PITR) with continuous Write-Ahead Log (WAL) archiving to restore data to the exact second before a corrupting query ran.",
  "variants": [
    {
      "id": "without-multi-az",
      "when": {
        "missingAny": [
          "multi-az"
        ]
      },
      "description": "A maintenance delete removes valid order history. Your current availability tier cannot reconstruct earlier data, whether it uses an asynchronous standby or only a primary. The backup is 19 hours old.",
      "metrics": [
        {
          "label": "Latest independent backup",
          "value": "19 h",
          "severity": "critical"
        },
        {
          "label": "Logical deletion",
          "value": "applied to current data",
          "severity": "critical"
        },
        {
          "label": "Required recovery",
          "value": "RPO 5 min / RTO 60 min",
          "severity": "normal"
        }
      ],
      "dialogue": [
        {
          "character": "byte",
          "emotion": "thinking",
          "text": "A maintenance delete removes valid order history. Your current availability tier cannot reconstruct earlier data, whether it uses an asynchronous standby or only a primary. The backup is 19 hours old."
        },
        {
          "character": "byte",
          "emotion": "thinking",
          "text": "A current copy cannot undo a logical delete. We need an independent point in history, and a plan for the good orders written afterward."
        }
      ]
    }
  ]
});
