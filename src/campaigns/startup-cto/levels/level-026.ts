import { defineStartupLevel, changesFor } from "./authoring";

export const level026 = defineStartupLevel({
  "levelNumber": 26,
  "title": "A Healthy Core Waiting on a Slow Edge",
  "description": "The merchant product editor hangs because the new media service is slow generating thumbnails. Because the monolith waits synchronously without a strict timeout, every web worker process becomes stuck waiting on the media service. Soon, all web workers are occupied, and even core checkout requests start failing with 504 Gateway Timeout.",
  "dialogue": [
      {
          "character": "jimmy",
          "emotion": "thinking",
          "text": "A thumbnail preview is an optional convenience. Allowing a slow preview service to consume all our web worker threads and bring down core checkout is an unacceptable cascading failure."
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
        "jimmyExplanation": "We put thumbnail calls on a strict deadline, set up a circuit breaker, and isolate media calls to a dedicated worker pool. If the media service stalls, the editor shows a 'Processing...' placeholder while checkout keeps humming along.",
        "effectReasons": {
          "upfrontCost": "$24,000 covers implementing circuit breakers, fallback UI components, and bulkhead concurrency limits.",
          "monthlyBurn": "Circuit breaker telemetry and fallback polling infrastructure add $10,000/month.",
          "reliability": "Stops slow external dependencies from exhausting web worker threads and knocking checkout offline.",
          "customerTrust": "Merchants can continue editing products without facing total site lockouts when media stalls.",
          "complexity": "Requires configuring fallback UI states and tuning timeout and circuit breaker thresholds."
        }
      },
      "architectureChanges": changesFor("dependency-bulkheads"),
      "outcomeTitle": "A preview cannot take checkout down.",
      "outcomeDialogue": "The circuit breaker tripped during yesterday's media hiccup, showed merchants a clean placeholder, and preserved 100% of our core checkout capacity.",
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
        "jimmyExplanation": "Ripping out synchronous previews and making them purely asynchronous completely protects our core request slots. It is slightly worse UX for merchants, but it eliminates an entire class of cascading failure.",
        "effectReasons": {
          "upfrontCost": "$10,800 covers refactoring the product editor to use asynchronous background status polling.",
          "monthlyBurn": "Background job notifications and polling infrastructure add $8,500/month.",
          "reliability": "Eliminating the synchronous network call permanently prevents media service lag from blocking web workers.",
          "customerTrust": "Merchants must wait for email or in-app alerts for previews, but core checkout never crashes.",
          "complexity": "Simple asynchronous workflow with no complex circuit breaker tuning needed."
        }
      },
      "architectureChanges": changesFor("dependency-bulkheads", "async-previews"),
      "outcomeTitle": "A narrower contract, deliberately.",
      "outcomeDialogue": "Synchronous previews are gone. Merchants get a notification when their images finish processing, and core app servers are totally immune to media lag.",
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
        "jimmyExplanation": "Retrying three times in the browser, three times in the gateway, and three times in the app multiplies 1 failing request into 27 repeated requests. When a backend dependency slows down, nested retries turn a minor hiccup into a total stampede.",
        "effectReasons": {
          "upfrontCost": "$15,600 is spent implementing aggressive retries across all application layers.",
          "monthlyBurn": "Retry storm compute overhead and server capacity add $11,500/month.",
          "reliability": "Nested retries multiply failing requests by 27x, triggering catastrophic cascading thread starvation.",
          "customerTrust": "Total site timeouts and 504 gateway crashes cause severe merchant frustration and lost sales.",
          "complexity": "Untangling nested retry policies across gateways, reverse proxies, and app code creates major operational debt."
        }
      },
      "architectureChanges": changesFor("nested-retries"),
      "outcomeTitle": "The trade-off catches up.",
      "outcomeDialogue": "Nested retries turned a transient slowdown into an avalanche of self-inflicted traffic. Web workers remained wedged for minutes after the media service recovered.",
      "outcomeEmotion": "concerned",
      "outcomeNote": "Timeouts, bulkheads and circuit breakers bound a dependency’s blast radius. The retained risk remains part of your company’s architecture."
    }
  ],
  "hints": [
    "Unbounded dependency waits consume shared capacity and spread a non-critical failure.",
    "Timeouts, bulkheads and circuit breakers bound a dependency’s blast radius."
  ],
  "lesson": "Prevent cascading failures: wrap external network calls in short timeouts, use circuit breakers to trip open when a dependency is struggling, and assign separate thread pools (bulkheads) so a slow optional feature cannot bring down core checkout.",
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
