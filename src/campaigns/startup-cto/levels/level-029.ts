import { defineStartupLevel, changesFor } from "./authoring";

export const level029 = defineStartupLevel({
  "levelNumber": 29,
  "title": "Everything Looks Green",
  "description": "Server dashboards show CPU and memory are completely green (under 40%), yet merchants are flooding support with complaints that checkout confirmations take 30 seconds. Because each service logs separately without shared IDs, the engineers have no idea which service or queue is causing the delay.",
  "dialogue": [
      {
          "character": "byte",
          "emotion": "thinking",
          "text": "Green CPU graphs are useless when buyers are staring at spinning spinners for five seconds. We need a trace ID that follows a request across HTTP calls, database queries, and async queues to pinpoint where the time is actually spent."
      },
      {
          "character": "byte",
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
        "byteExplanation": "Propagating trace IDs across HTTP headers and queue messages gives us end-to-end distributed traces. Tracking RED metrics (Rate, Errors, Duration) and queue age lets us page teams based on real merchant impact rather than raw CPU spikes.",
        "effectReasons": {
          "upfrontCost": "$32,000 covers distributed tracing SDK integration, OpenTelemetry collectors, and error budget alerting.",
          "monthlyBurn": "The monthly change is +$22,000, funding 2 SREs and high-throughput trace storage and indexing.",
          "reliability": "Pinpoints latency bottlenecks across service boundaries immediately, preventing long mystery degradations.",
          "customerTrust": "SLO-based alerting lets us detect and resolve checkout delays before merchants notice and complain.",
          "complexity": "Reduces operational mystery and cross-team finger-pointing through clear distributed trace visibility."
        }
      },
      "architectureChanges": changesFor("observability"),
      "outcomeTitle": "The customer journey becomes visible.",
      "outcomeDialogue": "Distributed tracing illuminated the entire path immediately. We discovered a 4-second delay inside an unmonitored queue worker that CPU charts completely missed.",
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
        "byteExplanation": "Aggregating application logs into a searchable cluster with queue depth alerts gives us solid debugging visibility with lower overhead than a full distributed tracing platform, even if tracking cross-service handoffs takes extra grepping.",
        "effectReasons": {
          "upfrontCost": "$14,400 covers setting up structured log aggregation and queue depth monitoring alerts.",
          "monthlyBurn": "The monthly change is +$18,700, funding 2 SREs and log storage/search infrastructure.",
          "reliability": "Detects queue backlogs and surface errors, though manual log grepping is still needed to trace requests.",
          "customerTrust": "Customer-facing latency issues get detected faster than before, though resolution takes longer than with traces.",
          "complexity": "Modest operational overhead with simple log aggregation and threshold-based alarms."
        }
      },
      "architectureChanges": changesFor("synthetic-monitoring"),
      "outcomeTitle": "A narrower contract, deliberately.",
      "outcomeDialogue": "Centralized logs and queue metrics surfaced the delay. It took a few manual correlation queries, but the bottleneck is resolved.",
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
        "byteExplanation": "Making CPU alerts more sensitive does nothing to detect delays caused by locked queues, third-party network timeouts, or slow database queries. It just floods engineers with alert fatigue while users still suffer.",
        "effectReasons": {
          "upfrontCost": "$20,800 is spent on emergency incident response and manual log reviews.",
          "monthlyBurn": "The monthly change is +$25,300, funding 2 SREs plus redundant alerting tooling and on-call paging costs.",
          "reliability": "Noisy, false alerts exhaust engineering on-call while real customer checkout delays go unaddressed.",
          "customerTrust": "Ongoing checkout delays and unmonitored latency spikes erode merchant confidence and drive cart abandonment.",
          "complexity": "High alert fatigue, team burnout, and lack of systemic visibility into distributed request flows."
        }
      },
      "architectureChanges": changesFor("cpu-only-alerts"),
      "outcomeTitle": "The trade-off catches up.",
      "outcomeDialogue": "The on-call team was woken up six times by false CPU alerts, while the 30-second checkout confirmation delay continued completely undetected.",
      "outcomeEmotion": "concerned",
      "outcomeNote": "Observe the user journey with correlated signals and actionable ownership. The retained risk remains part of your company’s architecture."
    }
  ],
  "hints": [
    "Resource metrics alone do not explain user-visible latency across asynchronous boundaries.",
    "Observe the user journey with correlated signals and actionable ownership."
  ],
  "lesson": "Host metrics don't measure user experience: pass a unique trace/correlation ID across every HTTP call and queue message, monitor queue age (how long messages wait before processing), and alert on latency and error budgets (SLOs)."
});
