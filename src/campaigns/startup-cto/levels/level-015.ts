import { defineStartupLevel, changesFor } from "./authoring";

export const level015 = defineStartupLevel({
  "levelNumber": 15,
  "title": "Retrying the Provider to Death",
  "description": "The webhook destination returns 429 for two minutes. Concurrent delivery callers immediately retry. Success at the provider is normal once requests fit its documented quota.",
  "dialogue": [
    {
      "character": "jimmy",
      "emotion": "thinking",
      "text": "Safe to retry does not mean safe to retry eighteen hundred times a second. The provider gave us a capacity budget and a time to come back."
    },
    {
      "character": "jimmy",
      "emotion": "normal",
      "text": "This month’s operating plan adds 1 engineer. Their compensation is included in every response’s recurring burn. Ownership has to grow with the architecture."
    }
  ],
  "metrics": [
    {
      "label": "Provider quota",
      "value": "200 attempts/s",
      "severity": "normal"
    },
    {
      "label": "Attempts / useful completions",
      "value": "1,800/s / 80/s",
      "severity": "critical"
    },
    {
      "label": "Retry share",
      "value": "89%",
      "severity": "critical"
    }
  ],
  "choices": [
    {
      "id": "015-measured",
      "label": "Budget retries with exponential backoff",
      "description": "Respect Retry-After, use exponential backoff with jitter and a retry horizon, enforce a provider-wide token budget, and keep stable idempotency keys.",
      "cost": 4500,
      "tone": "recommended",
      "effects": {
        "users": 70000,
        "monthlyRevenue": 31000,
        "monthlyBurn": 6000,
        "engineers": 1,
        "reliability": 3,
        "customerTrust": 2,
        "complexity": -2,
        "xp": 180,
        "confidence": 8
      },
      "tradeoff": {
        "upsideLabel": "Targeted improvement",
        "downsideLabel": "Cost and ownership",
        "upside": "The provider can recover without another synchronized storm.",
        "downside": "Some callbacks arrive later; expiry and oldest-job age need visibility.",
        "jimmyExplanation": "The provider can recover without another synchronized storm. Some callbacks arrive later; expiry and oldest-job age need visibility.",
        "effectReasons": {
          "upfrontCost": "$4,500 funds this rollout, verification and migration effort.",
          "monthlyBurn": "The monthly change is $+6,000, including 1 hires and the operating costs of this response.",
          "reliability": "Some callbacks arrive later; expiry and oldest-job age need visibility.",
          "customerTrust": "Merchant retention follows the response’s stated service contract and remaining risk.",
          "complexity": "Operational load includes the rollout, ownership and ongoing failure modes described here."
        }
      },
      "architectureChanges": changesFor("bounded-retries"),
      "outcomeTitle": "The provider gets room to recover.",
      "outcomeDialogue": "The provider can recover without another synchronized storm. Some callbacks arrive later; expiry and oldest-job age need visibility.",
      "outcomeEmotion": "happy",
      "outcomeNote": "Retries consume capacity; budget them and add jitter. Next pressure: Bounded retries will reveal permanently malformed jobs needing quarantine."
    },
    {
      "id": "015-bounded",
      "label": "Pause delivery and drain manually",
      "description": "Pause sends to this destination in the broker or local dispatch loop, retain committed delivery intent, wait for quota recovery, then restart with a fixed low concurrency.",
      "cost": 2025,
      "tone": "neutral",
      "effects": {
        "users": 49000,
        "monthlyRevenue": 21700,
        "monthlyBurn": 5100,
        "engineers": 1,
        "reliability": 1,
        "customerTrust": 1,
        "complexity": 0,
        "xp": 90,
        "confidence": 3
      },
      "tradeoff": {
        "upsideLabel": "Smaller contract",
        "downsideLabel": "Limits accepted",
        "upside": "An operator can restore a small incident predictably.",
        "downside": "Manual intervention does not scale across many destinations and recovery can be slow.",
        "jimmyExplanation": "An operator can restore a small incident predictably. Manual intervention does not scale across many destinations and recovery can be slow.",
        "effectReasons": {
          "upfrontCost": "$2,025 funds this rollout, verification and migration effort.",
          "monthlyBurn": "The monthly change is $+5,100, including 1 hires and the operating costs of this response.",
          "reliability": "Manual intervention does not scale across many destinations and recovery can be slow.",
          "customerTrust": "Merchant retention follows the response’s stated service contract and remaining risk.",
          "complexity": "Operational load includes the rollout, ownership and ongoing failure modes described here."
        }
      },
      "architectureChanges": changesFor("manual-delivery"),
      "outcomeTitle": "A narrower contract, deliberately.",
      "outcomeDialogue": "An operator can restore a small incident predictably. Manual intervention does not scale across many destinations and recovery can be slow.",
      "outcomeEmotion": "thinking",
      "outcomeNote": "Retries consume capacity; budget them and add jitter. Next pressure: Bounded retries will reveal permanently malformed jobs needing quarantine."
    },
    {
      "id": "015-shortcut",
      "label": "Double the webhook workers",
      "description": "Raise concurrency and keep immediate retries on every 429.",
      "cost": 2925,
      "tone": "risky",
      "effects": {
        "users": 21000,
        "monthlyRevenue": 9300,
        "monthlyBurn": 6900,
        "engineers": 1,
        "reliability": -9,
        "customerTrust": -7,
        "complexity": 7,
        "xp": -30,
        "confidence": -12
      },
      "tradeoff": {
        "upsideLabel": "Immediate relief",
        "downsideLabel": "Unresolved risk",
        "upside": "More workers can help when worker CPU is truly saturated.",
        "downside": "Here they send more attempts into the same provider quota and increase backlog.",
        "jimmyExplanation": "More workers can help when worker CPU is truly saturated. Here they send more attempts into the same provider quota and increase backlog.",
        "effectReasons": {
          "upfrontCost": "$2,925 funds this rollout, verification and migration effort.",
          "monthlyBurn": "The monthly change is $+6,900, including 1 hires and the operating costs of this response.",
          "reliability": "Here they send more attempts into the same provider quota and increase backlog.",
          "customerTrust": "Merchant retention follows the response’s stated service contract and remaining risk.",
          "complexity": "Operational load includes the rollout, ownership and ongoing failure modes described here."
        }
      },
      "architectureChanges": changesFor("retry-storm"),
      "outcomeTitle": "The trade-off catches up.",
      "outcomeDialogue": "More workers can help when worker CPU is truly saturated. Here they send more attempts into the same provider quota and increase backlog.",
      "outcomeEmotion": "concerned",
      "outcomeNote": "Retries consume capacity; budget them and add jitter. The retained risk remains part of your company’s architecture."
    }
  ],
  "hints": [
    "Immediate retries amplify a temporary quota failure and synchronize worker traffic.",
    "Retries consume capacity; budget them and add jitter."
  ],
  "lesson": "Retries consume capacity; budget them and add jitter.",
  "recoveries": [
    {
      "capability": "idempotent-effects",
      "choiceIds": [
        "015-measured"
      ],
      "description": "Install provider-supported idempotency and durable delivery keys before automatic retries.",
      "cost": 1800,
      "monthlyBurn": 300,
      "complexity": 1,
      "architectureChanges": changesFor("idempotent-effects")
    }
  ]
});
