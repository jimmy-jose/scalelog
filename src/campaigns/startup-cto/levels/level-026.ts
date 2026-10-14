import { defineStartupLevel, changesFor } from "./authoring";

export const level026 = defineStartupLevel({
  "levelNumber": 26,
  "title": "A Healthy Core Waiting on a Slow Edge",
  "description": "The merchant editor now waits synchronously for a thumbnail preview. During a media rollout that dependency stalls; checkout CPU is healthy but app request slots fill with waiting editor calls.",
  "dialogue": [
    {
      "character": "jimmy",
      "emotion": "thinking",
      "text": "A slow preview has occupied nearly every request slot. Give that dependency a budget and decide what the editor can show while it is unavailable."
    }
  ],
  "metrics": [
    {
      "label": "Media call p99",
      "value": "8 s",
      "severity": "critical"
    },
    {
      "label": "Waiting app slots",
      "value": "92% occupied",
      "severity": "critical"
    },
    {
      "label": "Core CPU / DB p95",
      "value": "41% / 35 ms",
      "severity": "normal"
    }
  ],
  "choices": [
    {
      "id": "026-measured",
      "label": "Bound waits and show pending previews",
      "description": "Apply a deadline, isolated concurrency budget and circuit breaker with limited probes; show an existing image or pending state and finish via durable jobs.",
      "cost": 24000,
      "tone": "recommended",
      "effects": {
        "users": 200000,
        "monthlyRevenue": 85000,
        "monthlyBurn": 10000,
        "engineers": 0,
        "reliability": 3,
        "customerTrust": 2,
        "complexity": -2,
        "xp": 220,
        "confidence": 8
      },
      "tradeoff": {
        "upsideLabel": "Targeted improvement",
        "downsideLabel": "Cost and ownership",
        "upside": "Media failure no longer consumes all application slots.",
        "downside": "The UI must explain pending previews and recover them; a breaker does not fix the dependency itself.",
        "jimmyExplanation": "Media failure no longer consumes all application slots. The UI must explain pending previews and recover them; a breaker does not fix the dependency itself.",
        "effectReasons": {
          "upfrontCost": "$24,000 funds this rollout, verification and migration effort.",
          "monthlyBurn": "The monthly change is $+10,000, including 0 hires and the operating costs of this response.",
          "reliability": "The UI must explain pending previews and recover them; a breaker does not fix the dependency itself.",
          "customerTrust": "Merchant retention follows the response’s stated service contract and remaining risk.",
          "complexity": "Operational load includes the rollout, ownership and ongoing failure modes described here."
        }
      },
      "architectureChanges": changesFor("dependency-bulkheads"),
      "outcomeTitle": "A preview cannot take checkout down.",
      "outcomeDialogue": "Media failure no longer consumes all application slots. The UI must explain pending previews and recover them; a breaker does not fix the dependency itself.",
      "outcomeEmotion": "happy",
      "outcomeNote": "Timeouts, bulkheads and circuit breakers bound a dependency’s blast radius. Next pressure: Protecting requests creates pending work whose status and schema need reliable asynchronous communication."
    },
    {
      "id": "026-bounded",
      "label": "Remove live previews from the editor",
      "description": "Keep durable background processing and notify the merchant when a preview is ready.",
      "cost": 10800,
      "tone": "neutral",
      "effects": {
        "users": 140000,
        "monthlyRevenue": 59500,
        "monthlyBurn": 8500,
        "engineers": 0,
        "reliability": 1,
        "customerTrust": 1,
        "complexity": 0,
        "xp": 110,
        "confidence": 3
      },
      "tradeoff": {
        "upsideLabel": "Smaller contract",
        "downsideLabel": "Limits accepted",
        "upside": "Eliminates the synchronous dependency with very simple operations.",
        "downside": "A reduced editing experience costs adoption, but correctness and core availability remain intact.",
        "jimmyExplanation": "Eliminates the synchronous dependency with very simple operations. A reduced editing experience costs adoption, but correctness and core availability remain intact.",
        "effectReasons": {
          "upfrontCost": "$10,800 funds this rollout, verification and migration effort.",
          "monthlyBurn": "The monthly change is $+8,500, including 0 hires and the operating costs of this response.",
          "reliability": "A reduced editing experience costs adoption, but correctness and core availability remain intact.",
          "customerTrust": "Merchant retention follows the response’s stated service contract and remaining risk.",
          "complexity": "Operational load includes the rollout, ownership and ongoing failure modes described here."
        }
      },
      "architectureChanges": changesFor("dependency-bulkheads", "async-previews"),
      "outcomeTitle": "A narrower contract, deliberately.",
      "outcomeDialogue": "Eliminates the synchronous dependency with very simple operations. A reduced editing experience costs adoption, but correctness and core availability remain intact.",
      "outcomeEmotion": "thinking",
      "outcomeNote": "Timeouts, bulkheads and circuit breakers bound a dependency’s blast radius. Next pressure: Protecting requests creates pending work whose status and schema need reliable asynchronous communication."
    },
    {
      "id": "026-shortcut",
      "label": "Retry the preview three times in every layer",
      "description": "Let gateway, app and media client each retry before returning failure.",
      "cost": 15600,
      "tone": "risky",
      "effects": {
        "users": 60000,
        "monthlyRevenue": 25500,
        "monthlyBurn": 11500,
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
        "upside": "A brief isolated fault may be hidden from the merchant.",
        "downside": "Nested retries multiply attempts and hold slots longer during a sustained outage.",
        "jimmyExplanation": "A brief isolated fault may be hidden from the merchant. Nested retries multiply attempts and hold slots longer during a sustained outage.",
        "effectReasons": {
          "upfrontCost": "$15,600 funds this rollout, verification and migration effort.",
          "monthlyBurn": "The monthly change is $+11,500, including 0 hires and the operating costs of this response.",
          "reliability": "Nested retries multiply attempts and hold slots longer during a sustained outage.",
          "customerTrust": "Merchant retention follows the response’s stated service contract and remaining risk.",
          "complexity": "Operational load includes the rollout, ownership and ongoing failure modes described here."
        }
      },
      "architectureChanges": changesFor("nested-retries"),
      "outcomeTitle": "The trade-off catches up.",
      "outcomeDialogue": "A brief isolated fault may be hidden from the merchant. Nested retries multiply attempts and hold slots longer during a sustained outage.",
      "outcomeEmotion": "concerned",
      "outcomeNote": "Timeouts, bulkheads and circuit breakers bound a dependency’s blast radius. The retained risk remains part of your company’s architecture."
    }
  ],
  "hints": [
    "Unbounded dependency waits consume shared capacity and spread a non-critical failure.",
    "Timeouts, bulkheads and circuit breakers bound a dependency’s blast radius."
  ],
  "lesson": "Timeouts, bulkheads and circuit breakers bound a dependency’s blast radius.",
  "variants": [
    {
      "id": "without-media-service",
      "when": {
        "missingAny": [
          "media-service"
        ]
      },
      "description": "Your route has no independently owned media service. The editor waits for thumbnail work on the retained processing path, occupying app slots. Bound this wait and inspect existing worker isolation rather than assuming extraction or dedicated capacity.",
      "metrics": [
        {
          "label": "Preview job wait p99",
          "value": "8 s",
          "severity": "critical"
        },
        {
          "label": "Waiting app slots",
          "value": "92%",
          "severity": "critical"
        },
        {
          "label": "Core CPU",
          "value": "41%",
          "severity": "normal"
        }
      ],
      "dialogue": [
        {
          "character": "jimmy",
          "emotion": "thinking",
          "text": "Your route has no independently owned media service. The editor waits for thumbnail work on the retained processing path, occupying app slots. Bound this wait and inspect existing worker isolation rather than assuming extraction or dedicated capacity."
        },
        {
          "character": "jimmy",
          "emotion": "thinking",
          "text": "A slow preview has occupied nearly every request slot. Give that dependency a budget and decide what the editor can show while it is unavailable."
        }
      ]
    }
  ]
});
