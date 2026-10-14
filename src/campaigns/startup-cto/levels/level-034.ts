import { defineStartupLevel, changesFor } from "./authoring";

export const level034 = defineStartupLevel({
  "levelNumber": 34,
  "title": "The Region Is Unreachable",
  "description": "A major cloud provider outage takes down an entire geographic region (US-East). Enterprise merchants demand regional disaster recovery. However, multi-region active-active writing is notorious for impossible data conflicts and network latency. The business agrees that losing up to 60 seconds of data during an extreme regional disaster (RPO 60s) is acceptable if the site can be back up within 15 minutes (RTO 15 min).",
  "dialogue": [
      {
          "character": "jimmy",
          "emotion": "thinking",
          "text": "Active-active multi-region databases sound wonderful in vendor pitch decks, but cross-region latency and data conflict resolution will bury us. A warm standby region with a 60-second RPO and 15-minute failover is achievable, affordable, and tested."
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
        "jimmyExplanation": "Asynchronously replicating all database shards and object storage to a secondary region gives us a proven warm standby. In a disaster, automated fencing prevents split-brain writes, and DNS traffic shifts restore checkout within 15 minutes.",
        "effectReasons": {
          "upfrontCost": "$85,000 covers secondary region VPC setup, cross-region replication pipelines, and automated failover runbooks.",
          "monthlyBurn": "The monthly change is +$52,000, funding 3 engineers and standing cross-region secondary database clusters.",
          "reliability": "Guarantees 15-minute recovery from total cloud datacenter disasters without complex multi-master write conflicts.",
          "customerTrust": "Enterprise merchants sign multi-year contracts knowing our disaster recovery meets audited enterprise SLA standards.",
          "complexity": "Requires regular rehearsed disaster recovery drills, failover fencing automation, and replication lag monitoring."
        }
      },
      "architectureChanges": changesFor("regional-dr"),
      "outcomeTitle": "Regional recovery is rehearsed.",
      "outcomeDialogue": "Our unannounced regional failover drill completed in 11 minutes with zero data corruption! The warm standby region promoted cleanly, and asynchronous replication stayed well within our 60-second loss budget.",
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
        "jimmyExplanation": "Storing daily encrypted backups in a secondary region and spinning up infrastructure from Terraform scripts during a disaster saves money, but restoring 6 terabytes of data from cold storage will take over 4 hours instead of 15 minutes.",
        "effectReasons": {
          "upfrontCost": "$38,250 covers infrastructure-as-code automation and off-site backup storage pipelines.",
          "monthlyBurn": "The monthly change is +$44,200, funding 3 engineers and cross-region backup storage.",
          "reliability": "Data is safe off-site, but recovery time (RTO) stretches to multiple hours during a catastrophic regional outage.",
          "customerTrust": "Cost-conscious merchants accept the longer recovery window, but enterprise accounts withhold expansion.",
          "complexity": "Low operational complexity during steady state, but high-stress manual verification required during disaster recovery."
        }
      },
      "architectureChanges": changesFor("cold-dr"),
      "outcomeTitle": "A narrower contract, deliberately.",
      "outcomeDialogue": "Cold restore drills took 4 hours to rehydrate database volumes. It saves money, but the business must accept extended downtime if a region dies.",
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
        "jimmyExplanation": "Running synchronous cross-region database transactions introduces a mandatory 170-millisecond speed-of-light network roundtrip on every single checkout click, making the site feel agonizingly slow worldwide.",
        "effectReasons": {
          "upfrontCost": "$55,250 is wasted attempting multi-region synchronous write clusters.",
          "monthlyBurn": "The monthly change is +$59,800, funding 3 engineers plus extreme cross-region network egress and database clustering costs.",
          "reliability": "Inter-region network latency spikes and split-brain partition bugs bring down checkout reliability worldwide.",
          "customerTrust": "Sluggish checkout speeds and inconsistent cart states cause immediate customer abandonment and merchant complaints.",
          "complexity": "Nightmarish complexity debugging distributed consensus algorithms, cross-region latency jitter, and split-brain data conflicts."
        }
      },
      "architectureChanges": changesFor("uncoordinated-multiwriter"),
      "outcomeTitle": "The trade-off catches up.",
      "outcomeDialogue": "Synchronous cross-region writes crippled checkout performance. Latency spiked by 300ms, database connection pools exhausted, and network partitions caused split-brain data conflicts.",
      "outcomeEmotion": "concerned",
      "outcomeNote": "Regional architecture follows RPO/RTO and conflict semantics, not a universal active-active ideal. The retained risk remains part of your company’s architecture."
    }
  ],
  "hints": [
    "Zone-local redundancy does not survive regional isolation within the promised recovery time.",
    "Regional architecture follows RPO/RTO and conflict semantics, not a universal active-active ideal."
  ],
  "lesson": "Disaster recovery is about pragmatism, not perfection: don't attempt complex multi-region active-active writes unless you are Google. Maintain a warm standby region with asynchronous replication and rehearsed failover procedures.",
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
