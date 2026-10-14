import { defineStartupLevel, changesFor } from "./authoring";

export const level025 = defineStartupLevel({
  "levelNumber": 25,
  "title": "One Domain Earns Its Own Deploy",
  "description": "Media transforms (resizing product photos, transcoding promotional clips) consume 72% of shared worker CPU and demand six releases a week, while core orders release only once a week. Cartline has a clean media boundary and can fund a dedicated four-person team.",
  "dialogue": [
      {
          "character": "byte",
          "emotion": "thinking",
          "text": "Media has completely different resource needs and deploys six times as often as core checkout. That's a textbook reason to extract a dedicated service. But remember: every network boundary turns local function calls into distributed failure modes."
      },
      {
          "character": "byte",
          "emotion": "normal",
          "text": "This month’s operating plan adds 3 engineers. Their compensation is included in every response’s recurring burn. Ownership has to grow with the architecture."
      }
  ],
  "metrics": [
    {
      "label": "Media / worker CPU",
      "value": "72%",
      "severity": "warning"
    },
    {
      "label": "Media/order releases",
      "value": "6 / 1 per week",
      "severity": "normal"
    },
    {
      "label": "Cross-domain rollout incidents",
      "value": "3 this month",
      "severity": "critical"
    }
  ],
  "choices": [
    {
      "id": "025-measured",
      "label": "Extract only media processing",
      "description": "Give media its own deployment, queue, scoped object access and media-owned metadata; consume versioned jobs and publish completion events without reading order tables. Hire three engineers for a four-person group.",
      "cost": 28000,
      "tone": "recommended",
      "effects": {
        "users": 200000,
        "monthlyRevenue": 80000,
        "monthlyBurn": 26000,
        "engineers": 3,
        "reliability": 0,
        "customerTrust": 2,
        "complexity": 2,
        "xp": 220,
        "confidence": 8
      },
      "tradeoff": {
        "upsideLabel": "Targeted improvement",
        "downsideLabel": "Cost and ownership",
        "upside": "Media scales and deploys independently while orders stay in the modular core.",
        "downside": "Service contracts, on-call ownership and independent capacity now have a recurring cost.",
        "byteExplanation": "Giving media its own deploy and job queue frees our order workers from heavy image crunching. But running an independent service means managing API contracts, network retries, and dedicated on-call rotations.",
        "effectReasons": {
          "upfrontCost": "$28,000 covers provisioning independent media services, deployment pipelines, and scoped storage access.",
          "monthlyBurn": "The monthly change is +$26,000, which includes 3 new engineers and independent service infrastructure.",
          "reliability": "Isolates media encoding workloads so CPU spikes never impact checkout and order processing.",
          "customerTrust": "Product image uploads and updates process reliably without causing site-wide lag.",
          "complexity": "Introduces a new network boundary, independent CI/CD pipeline, and service contract testing."
        }
      },
      "architectureChanges": changesFor("media-service", "media-owned"),
      "outcomeTitle": "Media earns an independent deploy.",
      "outcomeDialogue": "Media runs as its own service now. Heavy image uploads no longer starve checkout workers, and the media team can deploy updates without waiting for the core release train.",
      "outcomeEmotion": "happy",
      "outcomeNote": "Extract one stable domain when independent scale and ownership pay for the network boundary. Next pressure: A real service boundary needs a durable contract and can fail independently."
    },
    {
      "id": "025-bounded",
      "label": "Keep isolated media workers in the monolith repo",
      "description": "Retain the shared release train but dedicate worker pools and a media owner. Hire three engineers.",
      "cost": 12600,
      "tone": "neutral",
      "effects": {
        "users": 140000,
        "monthlyRevenue": 56000,
        "monthlyBurn": 22100,
        "engineers": 3,
        "reliability": 1,
        "customerTrust": 1,
        "complexity": 0,
        "xp": 110,
        "confidence": 3
      },
      "tradeoff": {
        "upsideLabel": "Smaller contract",
        "downsideLabel": "Limits accepted",
        "upside": "Resource isolation works with fewer distributed contracts.",
        "downside": "Release coordination remains; some media changes still wait for core releases.",
        "byteExplanation": "Keeping the code in the monolith while dedicating worker pools gives us CPU isolation without the overhead of maintaining separate microservice infrastructure. The downside is the media team still has to coordinate deployments with the core team.",
        "effectReasons": {
          "upfrontCost": "$12,600 covers configuring dedicated worker queues and segregating compute pools.",
          "monthlyBurn": "The monthly change is +$22,100, including 3 new engineers and dedicated worker instances.",
          "reliability": "Worker pool segregation prevents media tasks from starving core checkout workers.",
          "customerTrust": "Merchants see consistent checkout speeds, though media features deploy at the slower monolith pace.",
          "complexity": "Monolith deployment coordination remains, but network and service operations remain simple."
        }
      },
      "architectureChanges": changesFor("dedicated-media-workers"),
      "outcomeTitle": "A narrower contract, deliberately.",
      "outcomeDialogue": "Dedicated worker pools keep media processing from hogging checkout CPU, all without creating another git repository or deployment pipeline.",
      "outcomeEmotion": "thinking",
      "outcomeNote": "Extract one stable domain when independent scale and ownership pay for the network boundary. Next pressure: A real service boundary needs a durable contract and can fail independently."
    },
    {
      "id": "025-shortcut",
      "label": "Split every module into services now",
      "description": "Create separate users, orders, billing, catalogue and media APIs in one migration. Hire three engineers.",
      "cost": 18200,
      "tone": "risky",
      "effects": {
        "users": 60000,
        "monthlyRevenue": 24000,
        "monthlyBurn": 29900,
        "engineers": 3,
        "reliability": -9,
        "customerTrust": -7,
        "complexity": 25,
        "xp": -30,
        "confidence": -12
      },
      "tradeoff": {
        "upsideLabel": "Immediate relief",
        "downsideLabel": "Unresolved risk",
        "upside": "Many domains could eventually scale independently.",
        "downside": "Unproven boundaries and shared-database access create coordination and on-call load faster than the team can absorb.",
        "byteExplanation": "Splitting users, orders, billing, catalogue, and media into five separate microservices all at once is organizational suicide. We would spend all our time debugging distributed transactions and network timeouts instead of shipping features.",
        "effectReasons": {
          "upfrontCost": "$18,200 is spent attempting a rushed multi-service migration across multiple domains.",
          "monthlyBurn": "The monthly change is +$29,900, funding 3 engineers plus multi-service overhead and network costs.",
          "reliability": "Distributed transaction failures, network hops, and missing contract tests cause widespread outages.",
          "customerTrust": "Intermittent cross-service failures degrade merchant trust and break shopping workflows.",
          "complexity": "Explosion of network boundaries, operational overhead, and distributed debugging debt."
        }
      },
      "architectureChanges": changesFor("service-sprawl"),
      "outcomeTitle": "The trade-off catches up.",
      "outcomeDialogue": "We shattered the monolith into five services without the tooling or headcount to support them. Network latency exploded, distributed transactions are failing, and on-call is a living nightmare.",
      "outcomeEmotion": "concerned",
      "outcomeNote": "Extract one stable domain when independent scale and ownership pay for the network boundary. The retained risk remains part of your company’s architecture."
    }
  ],
  "hints": [
    "Media’s resource profile and release cadence now differ enough to justify a deployment and ownership boundary.",
    "Extract one stable domain when independent scale and ownership pay for the network boundary."
  ],
  "lesson": "Only extract a microservice when the domain has distinct compute requirements (heavy media encoding vs. fast checkout) and a dedicated team to own its deployment, monitoring, and network failure modes.",
  "recoveries": [
    {
      "capability": "job-queue",
      "choiceIds": [
        "025-measured"
      ],
      "description": "Provision a durable media job boundary before extracting its consumer.",
      "cost": 3000,
      "monthlyBurn": 1400,
      "complexity": 1,
      "architectureChanges": changesFor("job-queue")
    },
    {
      "capability": "object-media",
      "choiceIds": [
        "025-measured"
      ],
      "description": "Migrate the media service origin to object storage with scoped access.",
      "cost": 2500,
      "monthlyBurn": 800,
      "complexity": 1,
      "architectureChanges": changesFor("durable-media", "object-media")
    }
  ]
});
