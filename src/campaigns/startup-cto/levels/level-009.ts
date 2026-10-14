import { defineStartupLevel, changesFor } from "./authoring";

export const level009 = defineStartupLevel({
  "levelNumber": 9,
  "title": "A Storefront Across the Ocean",
  "description": "International merchants and overseas shoppers report that Cartline storefronts take four seconds to load. Performance tracing reveals that 80% of the delay is the physical time required to transfer multi-megabyte product images, CSS stylesheets, and JavaScript bundles across oceans from our single origin data center.",
  "dialogue": [
      {
          "character": "jimmy",
          "emotion": "thinking",
          "text": "The speed of light is real: transmitting megabytes of JavaScript and high-res images from Virginia to Tokyo takes round trips across the globe. A CDN brings those static files right to the user's doorstep."
      }
  ],
  "metrics": [
    {
      "label": "Overseas page p95",
      "value": "2.8 s",
      "severity": "critical"
    },
    {
      "label": "Origin RTT",
      "value": "240 ms",
      "severity": "warning"
    },
    {
      "label": "Public assets / API time",
      "value": "2.3 s / 180 ms",
      "severity": "warning"
    }
  ],
  "choices": [
    {
      "id": "009-measured",
      "label": "Put public versioned assets on a CDN",
      "description": "Serve immutable public assets through an edge cache; use a durable origin, content-hashed URLs and explicit private/no-store API policies.",
      "cost": 2500,
      "tone": "recommended",
      "effects": {
        "users": 35000,
        "monthlyRevenue": 12000,
        "monthlyBurn": 1800,
        "engineers": 0,
        "reliability": 0,
        "customerTrust": 2,
        "complexity": 1,
        "xp": 160,
        "confidence": 8
      },
      "tradeoff": {
        "upsideLabel": "Targeted improvement",
        "downsideLabel": "Cost and ownership",
        "upside": "Nearby delivery removes repeat long-distance asset transfers.",
        "downside": "Cache keys, invalidation and egress budgets must be monitored.",
        "jimmyExplanation": "Deploying a Content Delivery Network (CDN) like Cloudflare or Fastly caches our versioned JavaScript, CSS, and product images on edge servers around the world. International users download assets from a server in their home city, dropping initial page load times from 4 seconds to under 800 milliseconds.",
        "effectReasons": {
          "upfrontCost": "$1,600 covers CDN DNS configuration, asset cache-header tuning, asset versioning/hashing, and SSL setup.",
          "monthlyBurn": "CDN edge bandwidth and global routing fees add $1,100/month.",
          "reliability": "Offloading multi-megabyte static file downloads to the CDN protects our origin web servers from bandwidth saturation.",
          "customerTrust": "International shoppers get fast, responsive storefronts, increasing checkout completion and merchant signups.",
          "complexity": "The deployment pipeline must now generate content-hashed asset filenames (e.g., app.a8f2.js) to handle asset cache-busting."
        }
      },
      "architectureChanges": changesFor("edge-assets", "durable-media", "object-media"),
      "outcomeTitle": "Public bytes move closer to shoppers.",
      "outcomeDialogue": "Global page load times dropped dramatically. Static assets are served from local edge nodes worldwide, while our origin servers only have to handle lightweight API calls.",
      "outcomeEmotion": "happy",
      "outcomeNote": "Edge delivery improves cacheable content; it does not make private APIs safe to cache. Next pressure: Fast public pages expose automated scraping and bursty origin traffic."
    },
    {
      "id": "009-bounded",
      "label": "Use a nearer regional asset mirror",
      "description": "Replicate only public versioned assets to a second regional origin and route by geography.",
      "cost": 1125,
      "tone": "neutral",
      "effects": {
        "users": 24500,
        "monthlyRevenue": 8400,
        "monthlyBurn": 1530,
        "engineers": 0,
        "reliability": 1,
        "customerTrust": 1,
        "complexity": 0,
        "xp": 80,
        "confidence": 3
      },
      "tradeoff": {
        "upsideLabel": "Smaller contract",
        "downsideLabel": "Limits accepted",
        "upside": "A regional copy improves RTT for the new market.",
        "downside": "Fewer edge locations and manual replication/routing cost more operational effort.",
        "jimmyExplanation": "Setting up a regional asset mirror in Europe or Asia provides local asset downloads without a commercial CDN contract. It is cheaper and keeps file hosting within our own control, though it covers fewer global regions.",
        "effectReasons": {
          "upfrontCost": "$720 funds spinning up a regional storage mirror and configuring geographic DNS routing.",
          "monthlyBurn": "Running the regional storage mirror and cross-region replication adds $880/month.",
          "reliability": "Reduces latency for targeted overseas markets without introducing third-party CDN vendor dependencies.",
          "customerTrust": "Merchants in covered regions notice the speedup, though customers in other continents still see delays.",
          "complexity": "The team must now maintain cross-region file replication and keep the regional mirror in sync."
        }
      },
      "architectureChanges": changesFor("regional-assets"),
      "outcomeTitle": "A narrower contract, deliberately.",
      "outcomeDialogue": "The regional asset mirror reduced load times for European customers significantly. It is a pragmatic intermediate step, even if it lacks global edge coverage.",
      "outcomeEmotion": "thinking",
      "outcomeNote": "Edge delivery improves cacheable content; it does not make private APIs safe to cache. Next pressure: Fast public pages expose automated scraping and bursty origin traffic."
    },
    {
      "id": "009-shortcut",
      "label": "Cache all responses by URL at the edge",
      "description": "Apply a shared URL-only cache policy to storefront and authenticated dashboard routes.",
      "cost": 1625,
      "tone": "risky",
      "effects": {
        "users": 10500,
        "monthlyRevenue": 3600,
        "monthlyBurn": 2070,
        "engineers": 0,
        "reliability": -25,
        "customerTrust": -18,
        "complexity": 7,
        "xp": -30,
        "confidence": -22
      },
      "tradeoff": {
        "upsideLabel": "Immediate relief",
        "downsideLabel": "Unresolved risk",
        "upside": "A broad hit rate reduces requests to the origin.",
        "downside": "Ignoring tenant and authorization context can expose private responses; public and private paths need distinct policies.",
        "jimmyExplanation": "Caching every HTTP response by URL at the edge is a critical security and privacy hazard. If the CDN caches an API URL like /api/cart or /api/account, Customer B in London will be served Customer A's private address and credit card details.",
        "effectReasons": {
          "upfrontCost": "$1,040 is burned configuring aggressive whole-URL edge caching rules.",
          "monthlyBurn": "Edge caching network overhead adds $1,265/month.",
          "reliability": "Unsafe edge caching corrupts dynamic session states and causes severe privacy regressions across users.",
          "customerTrust": "Leaking private customer data and mixed-up shopping carts causes catastrophic trust loss and compliance penalties.",
          "complexity": "Emergency on-call incident response is required to purge edge caches, audit leaked sessions, and notify merchants."
        }
      },
      "architectureChanges": changesFor("unsafe-edge-cache"),
      "outcomeTitle": "The trade-off catches up.",
      "outcomeDialogue": "Disaster! Caching full API responses at the edge caused shoppers to see each other's carts and personal account details. We had to immediately disable edge caching to stop the data leak.",
      "outcomeEmotion": "concerned",
      "outcomeNote": "Edge delivery improves cacheable content; it does not make private APIs safe to cache. The retained risk remains part of your company’s architecture."
    }
  ],
  "hints": [
    "Geographic distance and repeated public-asset transfer dominate page load.",
    "Edge delivery improves cacheable content; it does not make private APIs safe to cache."
  ],
  "lesson": "Use a CDN to serve static assets (images, CSS, JS) from edge servers physically close to users, but never cache personalized API responses at the edge.",
  "recoveries": [
    {
      "capability": "object-media",
      "choiceIds": [
        "009-measured"
      ],
      "description": "Migrate images from a local or shared filesystem to a verified durable object origin.",
      "cost": 1800,
      "monthlyBurn": 500,
      "complexity": 1,
      "architectureChanges": changesFor("durable-media", "object-media")
    }
  ]
});
