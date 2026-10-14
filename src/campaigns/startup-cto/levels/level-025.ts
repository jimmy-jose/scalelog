import { defineStartupLevel, changesFor } from "./authoring";

export const level025 = defineStartupLevel({
  "levelNumber": 25,
  "title": "One Domain Earns Its Own Deploy",
  "description": "Media transforms consume 72% of shared worker CPU and demand six releases a week. Orders release once a week. Cartline has a stable media boundary and can fund a four-person ownership group after hiring three more engineers.",
  "dialogue": [
    {
      "character": "jimmy",
      "emotion": "thinking",
      "text": "Media has its own bottleneck, release cadence and funded owners now. That is a reason to extract one boundary. The rest of the monolith still works."
    },
    {
      "character": "jimmy",
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
        "jimmyExplanation": "Media scales and deploys independently while orders stay in the modular core. Service contracts, on-call ownership and independent capacity now have a recurring cost.",
        "effectReasons": {
          "upfrontCost": "$28,000 funds this rollout, verification and migration effort.",
          "monthlyBurn": "The monthly change is $+26,000, including 3 hires and the operating costs of this response.",
          "reliability": "Service contracts, on-call ownership and independent capacity now have a recurring cost.",
          "customerTrust": "Merchant retention follows the response’s stated service contract and remaining risk.",
          "complexity": "Operational load includes the rollout, ownership and ongoing failure modes described here."
        }
      },
      "architectureChanges": changesFor("media-service", "media-owned"),
      "outcomeTitle": "Media earns an independent deploy.",
      "outcomeDialogue": "Media scales and deploys independently while orders stay in the modular core. Service contracts, on-call ownership and independent capacity now have a recurring cost.",
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
        "jimmyExplanation": "Resource isolation works with fewer distributed contracts. Release coordination remains; some media changes still wait for core releases.",
        "effectReasons": {
          "upfrontCost": "$12,600 funds this rollout, verification and migration effort.",
          "monthlyBurn": "The monthly change is $+22,100, including 3 hires and the operating costs of this response.",
          "reliability": "Release coordination remains; some media changes still wait for core releases.",
          "customerTrust": "Merchant retention follows the response’s stated service contract and remaining risk.",
          "complexity": "Operational load includes the rollout, ownership and ongoing failure modes described here."
        }
      },
      "architectureChanges": changesFor("dedicated-media-workers"),
      "outcomeTitle": "A narrower contract, deliberately.",
      "outcomeDialogue": "Resource isolation works with fewer distributed contracts. Release coordination remains; some media changes still wait for core releases.",
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
        "jimmyExplanation": "Many domains could eventually scale independently. Unproven boundaries and shared-database access create coordination and on-call load faster than the team can absorb.",
        "effectReasons": {
          "upfrontCost": "$18,200 funds this rollout, verification and migration effort.",
          "monthlyBurn": "The monthly change is $+29,900, including 3 hires and the operating costs of this response.",
          "reliability": "Unproven boundaries and shared-database access create coordination and on-call load faster than the team can absorb.",
          "customerTrust": "Merchant retention follows the response’s stated service contract and remaining risk.",
          "complexity": "Operational load includes the rollout, ownership and ongoing failure modes described here."
        }
      },
      "architectureChanges": changesFor("service-sprawl"),
      "outcomeTitle": "The trade-off catches up.",
      "outcomeDialogue": "Many domains could eventually scale independently. Unproven boundaries and shared-database access create coordination and on-call load faster than the team can absorb.",
      "outcomeEmotion": "concerned",
      "outcomeNote": "Extract one stable domain when independent scale and ownership pay for the network boundary. The retained risk remains part of your company’s architecture."
    }
  ],
  "hints": [
    "Media’s resource profile and release cadence now differ enough to justify a deployment and ownership boundary.",
    "Extract one stable domain when independent scale and ownership pay for the network boundary."
  ],
  "lesson": "Extract one stable domain when independent scale and ownership pay for the network boundary.",
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
