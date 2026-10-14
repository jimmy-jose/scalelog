import { defineStartupLevel, changesFor } from "./authoring";

export const level010 = defineStartupLevel({
  "levelNumber": 10,
  "title": "The Scraper Next Door",
  "description": "A single merchant’s automated inventory script sends hundreds of unthrottled API requests every second. Its requests monopolize 85% of our web server worker processes, causing normal shoppers and other merchants to experience 504 Gateway Timeouts. We are also recruiting an integration engineer this month.",
  "dialogue": [
      {
          "character": "jimmy",
          "emotion": "thinking",
          "text": "One aggressive merchant script is hammering our import endpoint without any backoff. Because all our web workers are busy answering that one script, every other customer is getting locked out."
      },
      {
          "character": "jimmy",
          "emotion": "normal",
          "text": "We are adding an integration engineer this month to help build and enforce proper developer API contracts. Their salary is included in our monthly burn."
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
        "jimmyExplanation": "Enforcing per-tenant rate limits using a Token Bucket or Leaky Bucket algorithm in Redis ensures fair access. When this merchant exceeds their tier limit (e.g., 50 requests/sec), our API returns HTTP 429 (Too Many Requests) with a Retry-After header, protecting our servers while allowing healthy customers to proceed uninterrupted.",
        "effectReasons": {
          "upfrontCost": "$2,600 covers building Redis-backed rate limiting middleware, HTTP 429 response formatting, and quota metrics.",
          "monthlyBurn": "Includes our new integration engineer ($5,000/mo) plus Redis token bucket capacity, totaling $6,800/month.",
          "reliability": "Prevents any single client or automated script from monopolizing application worker capacity.",
          "customerTrust": "Protects the platform's availability for all merchants; the offending merchant gets clear headers on how to adapt.",
          "complexity": "Requires defining tiered API limits, monitoring quota breaches, and publishing API rate-limit documentation."
        }
      },
      "architectureChanges": changesFor("tenant-limits"),
      "outcomeTitle": "One tenant no longer owns the queue.",
      "outcomeDialogue": "Per-tenant rate limiting stopped the noisy neighbor dead in its tracks. The scraper receives clean 429 responses to pace itself, while all other merchants enjoy fast, uninterrupted service.",
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
        "jimmyExplanation": "Reaching out to the merchant's development team to negotiate a client-side throttle solves the immediate outage without code changes today. It buys breathing room, but it relies on developer goodwill rather than architectural enforcement.",
        "effectReasons": {
          "upfrontCost": "$1,170 covers developer outreach, manual traffic monitoring, and engineering coordination.",
          "monthlyBurn": "Includes our integration engineer ($5,000/mo) plus ongoing manual API traffic oversight, totaling $5,780/month.",
          "reliability": "Restores server availability temporarily, but leaves the platform vulnerable to any other unthrottled client.",
          "customerTrust": "Normal customers see immediate relief, but relying on verbal agreements leaves reliability fragile.",
          "complexity": "Avoids building a rate-limiting system for now, but increases operational overhead as engineers manually monitor API abuse."
        }
      },
      "architectureChanges": changesFor("negotiated-limits"),
      "outcomeTitle": "A narrower contract, deliberately.",
      "outcomeDialogue": "The merchant throttled their script, restoring platform stability for now. It was a fast, cheap fix, but without automated rate limiting, the next rogue script will cause the exact same outage.",
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
        "jimmyExplanation": "Blocking the IP address range is a crude blunt instrument. Many businesses and developers share corporate proxy IP addresses or cloud ranges. Blocking the IP locks out innocent users, and the script author will simply rotate to a new IP in 10 minutes anyway.",
        "effectReasons": {
          "upfrontCost": "$1,690 covers firewall rule configuration and emergency IP routing changes.",
          "monthlyBurn": "Includes our integration engineer ($5,000/mo) plus firewall administration costs, totaling $7,820/month.",
          "reliability": "Fails to stop automated scrapers with rotating IPs while causing accidental collateral outages for legitimate users.",
          "customerTrust": "Legitimate merchants who were mistakenly blocked submit angry complaints and question platform competence.",
          "complexity": "Managing brittle IP blocklists and dealing with false-positive IP bans creates ongoing on-call headaches."
        }
      },
      "architectureChanges": changesFor("ip-blocking"),
      "outcomeTitle": "The trade-off catches up.",
      "outcomeDialogue": "We blocked the IP range, and immediately locked out several innocent merchants who shared that corporate gateway. Meanwhile, the scraper rotated to a cloud VPN and resumed hammering us 15 minutes later.",
      "outcomeEmotion": "concerned",
      "outcomeNote": "Fair admission is part of availability; quota scope matters. The retained risk remains part of your company’s architecture."
    }
  ],
  "hints": [
    "Unbounded per-tenant admission allows one caller to consume shared request capacity.",
    "Fair admission is part of availability; quota scope matters."
  ],
  "lesson": "Tame noisy neighbors: rate-limit by merchant account or API token, not just IP address, so one runaway script cannot starve the rest of your customers."
});
