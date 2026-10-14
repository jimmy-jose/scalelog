import { defineStartupLevel, changesFor } from "./authoring";

export const level015 = defineStartupLevel({
  "levelNumber": 15,
  "title": "Retrying the Provider to Death",
  "description": "Our third-party webhook notification service experiences a brief outage and responds with HTTP 429 (Too Many Requests). Our worker fleet immediately retries every failed webhook every 100 milliseconds in a tight loop. Instead of recovering, the provider is overwhelmed by thousands of aggressive retries, extending the outage for hours.",
  "dialogue": [
      {
          "character": "byte",
          "emotion": "thinking",
          "text": "We are DDOSing our own webhook provider! When a service says 'I am busy, stop hitting me,' retrying 1,000 times a second just keeps their servers in the dirt. We need exponential backoff and randomized jitter."
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
        "byteExplanation": "Exponential backoff increases the wait time after each failure (1s, 2s, 4s, 8s, 16s) up to a bounded maximum ceiling. Adding randomized 'jitter' (e.g. 4s ± random 500ms) prevents all workers from retrying at the exact same millisecond, smoothing out the request curve and allowing the provider to recover gracefully.",
        "effectReasons": {
          "upfrontCost": "$2,000 covers implementing exponential backoff with full jitter, retry budgets, and webhook telemetry.",
          "monthlyBurn": "Monitoring webhook backoff queues and provider latency adds $1,100/month.",
          "reliability": "Prevents self-inflicted retry stampedes and allows struggling downstream APIs to self-heal.",
          "customerTrust": "Webhook deliveries succeed reliably after transient glitches, keeping merchant integrations working.",
          "complexity": "Adds retry schedule tracking, backoff calculations, and max-retry threshold policies."
        }
      },
      "architectureChanges": changesFor("bounded-retries"),
      "outcomeTitle": "The provider gets room to recover.",
      "outcomeDialogue": "The retry storm ended! When the webhook provider hiccuped, our workers backed off smoothly. Once the provider caught its breath, all queued webhooks cleared cleanly without a single dropped event.",
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
        "byteExplanation": "Capping retry attempts to three fixed tries spaced 30 seconds apart avoids an infinite loop and reduces provider load. It is a simple, predictable policy, though without randomized jitter, workers can still retry in small synchronized pulses.",
        "effectReasons": {
          "upfrontCost": "$900 covers setting up fixed 3-attempt retry rules and delay queues.",
          "monthlyBurn": "Basic retry queue monitoring and delay tracking add $990/month.",
          "reliability": "Limits retry volume and prevents runaway queue consumption during third-party degradations.",
          "customerTrust": "Most transient webhook failures resolve on the second or third try without overwhelming destinations.",
          "complexity": "Minimal operational overhead; relies on straightforward fixed-interval retry schedules."
        }
      },
      "architectureChanges": changesFor("manual-delivery"),
      "outcomeTitle": "A narrower contract, deliberately.",
      "outcomeDialogue": "Fixed retries stopped the infinite loop and gave the provider enough breathing room to process requests. It is an effective, simple backoff strategy.",
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
        "byteExplanation": "Retrying immediately in an infinite loop guarantees that any brief 30-second glitch will turn into an all-day outage. Thousands of workers spinning on failed HTTP calls will burn our CPU, exhaust connection pools, and get our API key permanently blacklisted by the provider.",
        "effectReasons": {
          "upfrontCost": "$1,300 is wasted implementing aggressive infinite-retry loops.",
          "monthlyBurn": "Massive CPU burn from constant spinning retries adds $1,265/month.",
          "reliability": "Exhausts worker concurrency and network sockets, causing platform-wide cascading failures.",
          "customerTrust": "Merchants lose real-time webhook updates completely as the platform gets blocked by partners.",
          "complexity": "Engineering must urgently intervene to kill stuck retry jobs and negotiate unblocking with vendors."
        }
      },
      "architectureChanges": changesFor("retry-storm"),
      "outcomeTitle": "The trade-off catches up.",
      "outcomeDialogue": "The webhook provider officially banned our IP address and revoked our API key for aggressive spamming. 10,000 webhook jobs are now permanently failing in our queues.",
      "outcomeEmotion": "concerned",
      "outcomeNote": "Retries consume capacity; budget them and add jitter. The retained risk remains part of your company’s architecture."
    }
  ],
  "hints": [
    "Immediate retries amplify a temporary quota failure and synchronize worker traffic.",
    "Retries consume capacity; budget them and add jitter."
  ],
  "lesson": "Never retry in a tight loop: use exponential backoff with randomized jitter so retries spread out smoothly over time and allow struggling services to recover.",
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
