import { defineStartupLevel, changesFor } from "./authoring";

export const level010 = defineStartupLevel({
  "levelNumber": 10,
  "title": "The Scraper Next Door",
  "description": "A single API tenant’s integration retries a catalogue import without pacing. Its authenticated requests consume most application slots and delay unrelated merchants. Cartline recruits an integration engineer.",
  "dialogue": [
    {
      "character": "jimmy",
      "emotion": "thinking",
      "text": "One merchant is using most of the seats. More seats might delay this, but we need a fair rule about who gets to occupy them."
    },
    {
      "character": "jimmy",
      "emotion": "normal",
      "text": "This month’s operating plan adds 1 engineer. Their compensation is included in every response’s recurring burn. Ownership has to grow with the architecture."
    }
  ],
  "metrics": [
    {
      "label": "One tenant / origin traffic",
      "value": "68% of 650 RPS",
      "severity": "critical"
    },
    {
      "label": "Other tenants p95",
      "value": "1.9 s",
      "severity": "critical"
    },
    {
      "label": "DB CPU",
      "value": "48%",
      "severity": "normal"
    },
    {
      "label": "Import concurrency / tenant",
      "value": "240",
      "severity": "warning"
    }
  ],
  "choices": [
    {
      "id": "010-measured",
      "label": "Enforce tenant quotas and fair concurrency",
      "description": "Apply authenticated tenant token buckets and concurrency caps at ingress, return 429 with Retry-After, and reserve checkout capacity. Hire an integration engineer.",
      "cost": 2600,
      "tone": "recommended",
      "effects": {
        "users": 40000,
        "monthlyRevenue": 15000,
        "monthlyBurn": 6800,
        "engineers": 1,
        "reliability": 3,
        "customerTrust": 2,
        "complexity": -2,
        "xp": 160,
        "confidence": 8
      },
      "tradeoff": {
        "upsideLabel": "Targeted improvement",
        "downsideLabel": "Cost and ownership",
        "upside": "A noisy tenant cannot monopolize all app slots.",
        "downside": "Limits need contractual tiers and monitoring so legitimate imports can adapt.",
        "jimmyExplanation": "A noisy tenant cannot monopolize all app slots. Limits need contractual tiers and monitoring so legitimate imports can adapt.",
        "effectReasons": {
          "upfrontCost": "$2,600 funds this rollout, verification and migration effort.",
          "monthlyBurn": "The monthly change is $+6,800, including 1 hires and the operating costs of this response.",
          "reliability": "Limits need contractual tiers and monitoring so legitimate imports can adapt.",
          "customerTrust": "Merchant retention follows the response’s stated service contract and remaining risk.",
          "complexity": "Operational load includes the rollout, ownership and ongoing failure modes described here."
        }
      },
      "architectureChanges": changesFor("tenant-limits"),
      "outcomeTitle": "One tenant no longer owns the queue.",
      "outcomeDialogue": "A noisy tenant cannot monopolize all app slots. Limits need contractual tiers and monitoring so legitimate imports can adapt.",
      "outcomeEmotion": "happy",
      "outcomeNote": "Fair admission is part of availability; quota scope matters. Next pressure: Legitimate bursts still require capacity planning rather than blanket rejection."
    },
    {
      "id": "010-bounded",
      "label": "Negotiate a temporary client throttle",
      "description": "Cap the offending integration client and monitor its compliance; hire an integration engineer.",
      "cost": 1170,
      "tone": "neutral",
      "effects": {
        "users": 28000,
        "monthlyRevenue": 10500,
        "monthlyBurn": 5780,
        "engineers": 1,
        "reliability": 1,
        "customerTrust": 1,
        "complexity": 0,
        "xp": 80,
        "confidence": 3
      },
      "tradeoff": {
        "upsideLabel": "Smaller contract",
        "downsideLabel": "Limits accepted",
        "upside": "A cooperative customer can restore service quickly with little infrastructure.",
        "downside": "Protection depends on every client honoring the agreement; new callers can repeat the incident.",
        "jimmyExplanation": "A cooperative customer can restore service quickly with little infrastructure. Protection depends on every client honoring the agreement; new callers can repeat the incident.",
        "effectReasons": {
          "upfrontCost": "$1,170 funds this rollout, verification and migration effort.",
          "monthlyBurn": "The monthly change is $+5,780, including 1 hires and the operating costs of this response.",
          "reliability": "Protection depends on every client honoring the agreement; new callers can repeat the incident.",
          "customerTrust": "Merchant retention follows the response’s stated service contract and remaining risk.",
          "complexity": "Operational load includes the rollout, ownership and ongoing failure modes described here."
        }
      },
      "architectureChanges": changesFor("negotiated-limits"),
      "outcomeTitle": "A narrower contract, deliberately.",
      "outcomeDialogue": "A cooperative customer can restore service quickly with little infrastructure. Protection depends on every client honoring the agreement; new callers can repeat the incident.",
      "outcomeEmotion": "thinking",
      "outcomeNote": "Fair admission is part of availability; quota scope matters. Next pressure: Legitimate bursts still require capacity planning rather than blanket rejection."
    },
    {
      "id": "010-shortcut",
      "label": "Block the shared IP range",
      "description": "Apply a coarse IP deny rule covering the noisy client’s outbound range. Hire an integration engineer.",
      "cost": 1690,
      "tone": "risky",
      "effects": {
        "users": 12000,
        "monthlyRevenue": 4500,
        "monthlyBurn": 7820,
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
        "upside": "The immediate traffic source is cheap to block.",
        "downside": "Merchants behind the same NAT lose service, and rotating IPs evade the policy.",
        "jimmyExplanation": "The immediate traffic source is cheap to block. Merchants behind the same NAT lose service, and rotating IPs evade the policy.",
        "effectReasons": {
          "upfrontCost": "$1,690 funds this rollout, verification and migration effort.",
          "monthlyBurn": "The monthly change is $+7,820, including 1 hires and the operating costs of this response.",
          "reliability": "Merchants behind the same NAT lose service, and rotating IPs evade the policy.",
          "customerTrust": "Merchant retention follows the response’s stated service contract and remaining risk.",
          "complexity": "Operational load includes the rollout, ownership and ongoing failure modes described here."
        }
      },
      "architectureChanges": changesFor("ip-blocking"),
      "outcomeTitle": "The trade-off catches up.",
      "outcomeDialogue": "The immediate traffic source is cheap to block. Merchants behind the same NAT lose service, and rotating IPs evade the policy.",
      "outcomeEmotion": "concerned",
      "outcomeNote": "Fair admission is part of availability; quota scope matters. The retained risk remains part of your company’s architecture."
    }
  ],
  "hints": [
    "Unbounded per-tenant admission allows one caller to consume shared request capacity.",
    "Fair admission is part of availability; quota scope matters."
  ],
  "lesson": "Fair admission is part of availability; quota scope matters."
});
