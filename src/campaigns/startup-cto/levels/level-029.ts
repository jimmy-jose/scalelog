import { defineStartupLevel, changesFor } from "./authoring";

export const level029 = defineStartupLevel({
  "levelNumber": 29,
  "title": "Everything Looks Green",
  "description": "CPU dashboards are green while merchants report slow confirmations. Request IDs disappear at the durable handoff boundary, queue-age alarms are missing and every team blames a different component.",
  "dialogue": [
    {
      "character": "jimmy",
      "emotion": "thinking",
      "text": "Green CPU charts cannot tell us where the buyer waited. Follow the same request and event identity across boundaries, then page whoever can act."
    },
    {
      "character": "jimmy",
      "emotion": "normal",
      "text": "This month’s operating plan adds 2 engineers. Their compensation is included in every response’s recurring burn. Ownership has to grow with the architecture."
    }
  ],
  "metrics": [
    {
      "label": "Confirmation p99",
      "value": "4.8 s",
      "severity": "critical"
    },
    {
      "label": "Core CPU",
      "value": "46%",
      "severity": "normal"
    },
    {
      "label": "Trace coverage across queue",
      "value": "12%",
      "severity": "warning"
    },
    {
      "label": "Oldest unobserved work",
      "value": "unknown",
      "severity": "critical"
    }
  ],
  "choices": [
    {
      "id": "029-measured",
      "label": "Instrument the end-to-end journey",
      "description": "Propagate trace/event IDs with async span links, record RED metrics and queue age, correlate structured redacted logs, and page owners on multi-window error-budget burn against 99.9% monthly availability. Hire two SREs.",
      "cost": 32000,
      "tone": "recommended",
      "effects": {
        "users": 200000,
        "monthlyRevenue": 100000,
        "monthlyBurn": 22000,
        "engineers": 2,
        "reliability": 3,
        "customerTrust": 2,
        "complexity": -4,
        "xp": 220,
        "confidence": 8
      },
      "tradeoff": {
        "upsideLabel": "Targeted improvement",
        "downsideLabel": "Cost and ownership",
        "upside": "The team can locate latency and act on customer impact.",
        "downside": "Sampling, retention and cardinality need budgets; telemetry must not contain payment secrets.",
        "jimmyExplanation": "The team can locate latency and act on customer impact. Sampling, retention and cardinality need budgets; telemetry must not contain payment secrets.",
        "effectReasons": {
          "upfrontCost": "$32,000 funds this rollout, verification and migration effort.",
          "monthlyBurn": "The monthly change is $+22,000, including 2 hires and the operating costs of this response.",
          "reliability": "Sampling, retention and cardinality need budgets; telemetry must not contain payment secrets.",
          "customerTrust": "Merchant retention follows the response’s stated service contract and remaining risk.",
          "complexity": "Operational load includes the rollout, ownership and ongoing failure modes described here."
        }
      },
      "architectureChanges": changesFor("observability"),
      "outcomeTitle": "The customer journey becomes visible.",
      "outcomeDialogue": "The team can locate latency and act on customer impact. Sampling, retention and cardinality need budgets; telemetry must not contain payment secrets.",
      "outcomeEmotion": "happy",
      "outcomeNote": "Observe the user journey with correlated signals and actionable ownership. Next pressure: Traces will locate the next provider tail-latency problem and enable an SLO-based response."
    },
    {
      "id": "029-bounded",
      "label": "Start with a focused synthetic journey",
      "description": "Probe checkout and receipt completion, correlate order IDs in logs and page one owner. Hire two SREs.",
      "cost": 14400,
      "tone": "neutral",
      "effects": {
        "users": 140000,
        "monthlyRevenue": 70000,
        "monthlyBurn": 18700,
        "engineers": 2,
        "reliability": 1,
        "customerTrust": 1,
        "complexity": 0,
        "xp": 110,
        "confidence": 3
      },
      "tradeoff": {
        "upsideLabel": "Smaller contract",
        "downsideLabel": "Limits accepted",
        "upside": "A focused monitor detects the main customer symptom at lower instrumentation cost.",
        "downside": "Localization across fan-out remains slower and less complete than correlated traces.",
        "jimmyExplanation": "A focused monitor detects the main customer symptom at lower instrumentation cost. Localization across fan-out remains slower and less complete than correlated traces.",
        "effectReasons": {
          "upfrontCost": "$14,400 funds this rollout, verification and migration effort.",
          "monthlyBurn": "The monthly change is $+18,700, including 2 hires and the operating costs of this response.",
          "reliability": "Localization across fan-out remains slower and less complete than correlated traces.",
          "customerTrust": "Merchant retention follows the response’s stated service contract and remaining risk.",
          "complexity": "Operational load includes the rollout, ownership and ongoing failure modes described here."
        }
      },
      "architectureChanges": changesFor("synthetic-monitoring"),
      "outcomeTitle": "A narrower contract, deliberately.",
      "outcomeDialogue": "A focused monitor detects the main customer symptom at lower instrumentation cost. Localization across fan-out remains slower and less complete than correlated traces.",
      "outcomeEmotion": "thinking",
      "outcomeNote": "Observe the user journey with correlated signals and actionable ownership. Next pressure: Traces will locate the next provider tail-latency problem and enable an SLO-based response."
    },
    {
      "id": "029-shortcut",
      "label": "Alert on every host above 60% CPU",
      "description": "Add per-host CPU pages and retain every log indefinitely. Hire two SREs.",
      "cost": 20800,
      "tone": "risky",
      "effects": {
        "users": 60000,
        "monthlyRevenue": 30000,
        "monthlyBurn": 25300,
        "engineers": 2,
        "reliability": -9,
        "customerTrust": -7,
        "complexity": 7,
        "xp": -30,
        "confidence": -12
      },
      "tradeoff": {
        "upsideLabel": "Immediate relief",
        "downsideLabel": "Unresolved risk",
        "upside": "Saturation incidents may become visible early.",
        "downside": "This I/O delay is not CPU saturation; noisy alerts and unbounded retention waste attention and money.",
        "jimmyExplanation": "Saturation incidents may become visible early. This I/O delay is not CPU saturation; noisy alerts and unbounded retention waste attention and money.",
        "effectReasons": {
          "upfrontCost": "$20,800 funds this rollout, verification and migration effort.",
          "monthlyBurn": "The monthly change is $+25,300, including 2 hires and the operating costs of this response.",
          "reliability": "This I/O delay is not CPU saturation; noisy alerts and unbounded retention waste attention and money.",
          "customerTrust": "Merchant retention follows the response’s stated service contract and remaining risk.",
          "complexity": "Operational load includes the rollout, ownership and ongoing failure modes described here."
        }
      },
      "architectureChanges": changesFor("cpu-only-alerts"),
      "outcomeTitle": "The trade-off catches up.",
      "outcomeDialogue": "Saturation incidents may become visible early. This I/O delay is not CPU saturation; noisy alerts and unbounded retention waste attention and money.",
      "outcomeEmotion": "concerned",
      "outcomeNote": "Observe the user journey with correlated signals and actionable ownership. The retained risk remains part of your company’s architecture."
    }
  ],
  "hints": [
    "Resource metrics alone do not explain user-visible latency across asynchronous boundaries.",
    "Observe the user journey with correlated signals and actionable ownership."
  ],
  "lesson": "Observe the user journey with correlated signals and actionable ownership."
});
