import { defineStartupLevel, changesFor } from "./authoring";

export const level005 = defineStartupLevel({
  "levelNumber": 5,
  "title": "Logged Out at Random",
  "description": "A merchant logs in and is redirected to login on the next request. Session files live on application disks. The team also needs sessions to survive a rolling replacement.",
  "dialogue": [
    {
      "character": "jimmy",
      "emotion": "thinking",
      "text": "The login worked on one host. The next host has never seen that session file. Decide where authentication state lives when an instance disappears."
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
        "jimmyExplanation": "Requests can move between instances without losing authentication. Session availability now depends on the shared store; budget memory and replication.",
        "effectReasons": {
          "upfrontCost": "$800 funds this rollout, verification and migration effort.",
          "monthlyBurn": "The monthly change is $+400, including 0 hires and the operating costs of this response.",
          "reliability": "Session availability now depends on the shared store; budget memory and replication.",
          "customerTrust": "Merchant retention follows the response’s stated service contract and remaining risk.",
          "complexity": "Operational load includes the rollout, ownership and ongoing failure modes described here."
        }
      },
      "architectureChanges": changesFor("portable-sessions", "session-store"),
      "outcomeTitle": "A login survives the next host.",
      "outcomeDialogue": "Requests can move between instances without losing authentication. Session availability now depends on the shared store; budget memory and replication.",
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
        "jimmyExplanation": "No session-store round trip is required. Immediate per-session revocation needs extra state; short expiry bounds but does not eliminate that risk.",
        "effectReasons": {
          "upfrontCost": "$360 funds this rollout, verification and migration effort.",
          "monthlyBurn": "The monthly change is $+340, including 0 hires and the operating costs of this response.",
          "reliability": "Immediate per-session revocation needs extra state; short expiry bounds but does not eliminate that risk.",
          "customerTrust": "Merchant retention follows the response’s stated service contract and remaining risk.",
          "complexity": "Operational load includes the rollout, ownership and ongoing failure modes described here."
        }
      },
      "architectureChanges": changesFor("portable-sessions", "signed-sessions"),
      "outcomeTitle": "A narrower contract, deliberately.",
      "outcomeDialogue": "No session-store round trip is required. Immediate per-session revocation needs extra state; short expiry bounds but does not eliminate that risk.",
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
        "jimmyExplanation": "Affinity reduces cross-instance logouts while hosts remain healthy. Deployments and host loss still invalidate sessions; sticky routing is a bridge, not durable state.",
        "effectReasons": {
          "upfrontCost": "$520 funds this rollout, verification and migration effort.",
          "monthlyBurn": "The monthly change is $+460, including 0 hires and the operating costs of this response.",
          "reliability": "Deployments and host loss still invalidate sessions; sticky routing is a bridge, not durable state.",
          "customerTrust": "Merchant retention follows the response’s stated service contract and remaining risk.",
          "complexity": "Operational load includes the rollout, ownership and ongoing failure modes described here."
        }
      },
      "architectureChanges": changesFor("sticky-sessions"),
      "outcomeTitle": "The trade-off catches up.",
      "outcomeDialogue": "Affinity reduces cross-instance logouts while hosts remain healthy. Deployments and host loss still invalidate sessions; sticky routing is a bridge, not durable state.",
      "outcomeEmotion": "concerned",
      "outcomeNote": "Stateless application instances require deliberate placement of session state. The retained risk remains part of your company’s architecture."
    }
  ],
  "hints": [
    "Different instances cannot read each other’s session files; CPU and password validation are healthy.",
    "Stateless application instances require deliberate placement of session state."
  ],
  "lesson": "Stateless application instances require deliberate placement of session state.",
  "variants": [
    {
      "id": "without-app-fleet",
      "when": {
        "missingAny": [
          "app-fleet"
        ]
      },
      "description": "The rolling-replacement rehearsal logs out every merchant on the single application host. You have not deployed multiple app instances; this is session loss during replacement.",
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
          "text": "The rolling-replacement rehearsal logs out every merchant on the single application host. You have not deployed multiple app instances; this is session loss during replacement."
        },
        {
          "character": "jimmy",
          "emotion": "thinking",
          "text": "The login worked on one host. The next host has never seen that session file. Decide where authentication state lives when an instance disappears."
        }
      ]
    }
  ]
});
