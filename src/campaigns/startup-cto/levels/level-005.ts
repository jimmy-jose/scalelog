import { defineStartupLevel, changesFor } from "./authoring";

export const level005 = defineStartupLevel({
  "levelNumber": 5,
  "title": "Logged Out at Random",
  "description": "Merchants complain that they log in, click a link, and immediately get kicked back to the login screen. Now that we have multiple web servers, Request #1 creates a session file on Server A's local disk, but Request #2 lands on Server B, which has never seen that session.",
  "dialogue": [
    {
      "character": "jimmy",
      "emotion": "thinking",
      "text": "Server A authenticated the merchant, but their next request landed on Server B. Server B looked on its local disk, found no session file, and said 'Who are you?' We need authentication state to live in a shared place that all servers can reach."
    }
  ],
  "metrics": [
    {
      "label": "Cross-instance login failures",
      "value": "34%",
      "severity": "critical"
    },
    {
      "label": "Same-instance failures",
      "value": "0%",
      "severity": "normal"
    },
    {
      "label": "Session backend",
      "value": "local files",
      "severity": "warning"
    }
  ],
  "choices": [
    {
      "id": "005-measured",
      "label": "Use shared server-side sessions",
      "description": "Move opaque session IDs to a small managed Redis session store with expiry, secure cookies, and fail-closed authentication.",
      "cost": 800,
      "tone": "recommended",
      "effects": {
        "users": 10000,
        "monthlyRevenue": 5000,
        "monthlyBurn": 400,
        "engineers": 0,
        "reliability": 3,
        "customerTrust": 2,
        "complexity": 1,
        "xp": 140,
        "confidence": 8
      },
      "tradeoff": {
        "upsideLabel": "Targeted improvement",
        "downsideLabel": "Cost and ownership",
        "upside": "Requests can move between instances without losing authentication.",
        "downside": "Session availability now depends on the shared store; budget memory and replication.",
        "jimmyExplanation": "Moving sessions to a small managed Redis instance is the industry standard for stateless web tiers. Redis is blazing fast, and every app server can look up the merchant's session ID in sub-millisecond time. The only catch is that Redis is now on the critical login path, so we have to monitor its memory and uptime.",
        "effectReasons": {
          "upfrontCost": "$800 covers provisioning managed Redis, updating session middleware, and migrating existing active tokens.",
          "monthlyBurn": "Running a managed Redis instance with automatic backups adds $400/month.",
          "reliability": "Merchants no longer get logged out as requests bounce between web instances or during rolling deployments.",
          "customerTrust": "Store owners can manage inventory and process sales without unexpected login interruptions.",
          "complexity": "The team now manages a Redis instance, connection settings, and session expiration (TTL) policies."
        }
      },
      "architectureChanges": changesFor("portable-sessions", "session-store"),
      "outcomeTitle": "A login survives the next host.",
      "outcomeDialogue": "Redis is handling sessions smoothly. Merchants stay logged in whether their next request hits Server A, B, or C, and deploys no longer disrupt active carts.",
      "outcomeEmotion": "happy",
      "outcomeNote": "Stateless application instances require deliberate placement of session state. Next pressure: Files are still local even after sessions move; a shared session tier also needs capacity and failure handling."
    },
    {
      "id": "005-bounded",
      "label": "Use signed short-lived session cookies",
      "description": "Store minimal signed session claims client-side, with secure cookie flags, key rotation and a short expiry.",
      "cost": 360,
      "tone": "neutral",
      "effects": {
        "users": 7000,
        "monthlyRevenue": 3500,
        "monthlyBurn": 340,
        "engineers": 0,
        "reliability": 1,
        "customerTrust": 1,
        "complexity": 0,
        "xp": 70,
        "confidence": 3
      },
      "tradeoff": {
        "upsideLabel": "Smaller contract",
        "downsideLabel": "Limits accepted",
        "upside": "No session-store round trip is required.",
        "downside": "Immediate per-session revocation needs extra state; short expiry bounds but does not eliminate that risk.",
        "jimmyExplanation": "Signed session cookies keep session claims encrypted right in the user's browser. It avoids running a Redis cluster entirely, which saves money. The downside: if an account is compromised or an employee is fired, you can't instantly revoke that cookie on the server until its timer expires.",
        "effectReasons": {
          "upfrontCost": "$360 covers implementing signed cookie middleware, key rotation routines, and security auditing.",
          "monthlyBurn": "Bandwidth and security monitoring add a modest $340/month without needing dedicated cache hardware.",
          "reliability": "Authentication works across any server because claims travel in the encrypted browser cookie.",
          "customerTrust": "Merchants stay logged in reliably, though token expiration must stay short to limit exposure.",
          "complexity": "Cookie signing keys require secure storage and rotation, but there is no new database cluster to operate."
        }
      },
      "architectureChanges": changesFor("portable-sessions", "signed-sessions"),
      "outcomeTitle": "A narrower contract, deliberately.",
      "outcomeDialogue": "Signed cookies resolved the cross-server login bug without adding a database trip. Just remember: instant server-side session revocation is off the table for now.",
      "outcomeEmotion": "thinking",
      "outcomeNote": "Stateless application instances require deliberate placement of session state. Next pressure: Files are still local even after sessions move; a shared session tier also needs capacity and failure handling."
    },
    {
      "id": "005-shortcut",
      "label": "Pin each browser to one instance",
      "description": "Keep each browser on its current application host, using affinity wherever a balancer exists, and retain local session files.",
      "cost": 520,
      "tone": "risky",
      "effects": {
        "users": 3000,
        "monthlyRevenue": 1500,
        "monthlyBurn": 460,
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
        "upside": "Affinity reduces cross-instance logouts while hosts remain healthy.",
        "downside": "Deployments and host loss still invalidate sessions; sticky routing is a bridge, not durable state.",
        "jimmyExplanation": "Sticky sessions tell the load balancer to send the same user to the same server every time. It's a quick hack that avoids changing session storage, but it breaks during deployments, causes uneven traffic distribution if one merchant gets huge, and logs everyone out whenever a server restarts.",
        "effectReasons": {
          "upfrontCost": "$520 pays to configure sticky cookies on the load balancer and test session affinity.",
          "monthlyBurn": "Load balancer affinity tracking and skewed instance headroom add $460/month.",
          "reliability": "Sticky sessions fall apart whenever a host is restarted, drained, or crashes, causing random mass logouts.",
          "customerTrust": "Merchants experience jarring session drops during routine deploys, damaging confidence.",
          "complexity": "Load balancing becomes uneven, making capacity planning harder when one server gets overloaded with sticky users."
        }
      },
      "architectureChanges": changesFor("sticky-sessions"),
      "outcomeTitle": "The trade-off catches up.",
      "outcomeDialogue": "Sticky sessions patched the immediate complaint, but the moment Server 2 restarted for a security patch, every merchant connected to it was booted offline. Sticky routing is a band-aid, not stateless architecture.",
      "outcomeEmotion": "concerned",
      "outcomeNote": "Stateless application instances require deliberate placement of session state. The retained risk remains part of your company’s architecture."
    }
  ],
  "hints": [
    "Different instances cannot read each other’s session files; CPU and password validation are healthy.",
    "Stateless application instances require deliberate placement of session state."
  ],
  "lesson": "Make app servers stateless: store session data in a fast, shared store (like Redis) so any server can handle any user request without logging them out.",
  "variants": [
    {
      "id": "without-app-fleet",
      "when": {
        "missingAny": [
          "app-fleet"
        ]
      },
      "description": "During a routine rolling restart rehearsal on our single app host, every merchant was logged out. Even without multiple instances, storing sessions on local ephemeral disks breaks during deploys.",
      "metrics": [
        {
          "label": "Replacement logout rate",
          "value": "100%",
          "severity": "critical"
        },
        {
          "label": "Session location",
          "value": "old instance disk",
          "severity": "warning"
        },
        {
          "label": "Password verification",
          "value": "healthy",
          "severity": "normal"
        }
      ],
      "dialogue": [
        {
          "character": "jimmy",
          "emotion": "thinking",
          "text": "We simulated replacing our app host, and every logged-in merchant was instantly kicked out because their session files only existed on the old server's ephemeral disk."
        },
        {
          "character": "jimmy",
          "emotion": "thinking",
          "text": "Even on a single server, whenever we deploy new code or replace a dying host, local session files vanish. Let's decide where authentication state lives so users stay logged in across deployments."
        }
      ]
    }
  ]
});
