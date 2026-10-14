import { defineStartupLevel, changesFor } from "./authoring";

export const level006 = defineStartupLevel({
  "levelNumber": 6,
  "title": "The Missing Product Photos",
  "description": "Merchants upload product images successfully, then see missing pictures after a request moves to another host or a host is replaced. Cartline can now fund its third engineer.",
  "dialogue": [
    {
      "character": "jimmy",
      "emotion": "thinking",
      "text": "The database knows the photo exists. The host serving this request does not have its bytes. A durable reference needs durable storage behind it."
    },
    {
      "character": "jimmy",
      "emotion": "normal",
      "text": "This month’s operating plan adds 1 engineer. Their compensation is included in every response’s recurring burn. Ownership has to grow with the architecture."
    }
  ],
  "metrics": [
    {
      "label": "Image 404s after rerouting",
      "value": "31%",
      "severity": "critical"
    },
    {
      "label": "Upload destination",
      "value": "instance disk",
      "severity": "warning"
    },
    {
      "label": "DB metadata checks",
      "value": "100% present",
      "severity": "normal"
    }
  ],
  "choices": [
    {
      "id": "006-measured",
      "label": "Move uploads to object storage",
      "description": "Copy and checksum existing images, switch to private object storage with signed upload URLs and authorized reads, then retire local copies after verification. Hire one engineer.",
      "cost": 1200,
      "tone": "recommended",
      "effects": {
        "users": 15000,
        "monthlyRevenue": 7000,
        "monthlyBurn": 5500,
        "engineers": 1,
        "reliability": 3,
        "customerTrust": 2,
        "complexity": 1,
        "xp": 160,
        "confidence": 8
      },
      "tradeoff": {
        "upsideLabel": "Targeted improvement",
        "downsideLabel": "Cost and ownership",
        "upside": "Durable bytes outlive any application instance.",
        "downside": "Migration verification, access policies and storage/egress bills need an owner.",
        "jimmyExplanation": "Durable bytes outlive any application instance. Migration verification, access policies and storage/egress bills need an owner.",
        "effectReasons": {
          "upfrontCost": "$1,200 funds this rollout, verification and migration effort.",
          "monthlyBurn": "The monthly change is $+5,500, including 1 hires and the operating costs of this response.",
          "reliability": "Migration verification, access policies and storage/egress bills need an owner.",
          "customerTrust": "Merchant retention follows the response’s stated service contract and remaining risk.",
          "complexity": "Operational load includes the rollout, ownership and ongoing failure modes described here."
        }
      },
      "architectureChanges": changesFor("durable-media", "object-media"),
      "outcomeTitle": "The photo outlives the server.",
      "outcomeDialogue": "Durable bytes outlive any application instance. Migration verification, access policies and storage/egress bills need an owner.",
      "outcomeEmotion": "happy",
      "outcomeNote": "Externalize durable files before treating application hosts as disposable. Next pressure: Public images can later be delivered at the edge; object access and lifecycle rules become responsibilities."
    },
    {
      "id": "006-bounded",
      "label": "Mount managed shared file storage",
      "description": "Migrate images to a managed network filesystem with tested failover and backups. Hire one engineer.",
      "cost": 540,
      "tone": "neutral",
      "effects": {
        "users": 10500,
        "monthlyRevenue": 4900,
        "monthlyBurn": 4675,
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
        "upside": "POSIX access minimizes application changes and works across hosts.",
        "downside": "Filesystem throughput and mounts need monitoring; public delivery still passes through an origin.",
        "jimmyExplanation": "POSIX access minimizes application changes and works across hosts. Filesystem throughput and mounts need monitoring; public delivery still passes through an origin.",
        "effectReasons": {
          "upfrontCost": "$540 funds this rollout, verification and migration effort.",
          "monthlyBurn": "The monthly change is $+4,675, including 1 hires and the operating costs of this response.",
          "reliability": "Filesystem throughput and mounts need monitoring; public delivery still passes through an origin.",
          "customerTrust": "Merchant retention follows the response’s stated service contract and remaining risk.",
          "complexity": "Operational load includes the rollout, ownership and ongoing failure modes described here."
        }
      },
      "architectureChanges": changesFor("durable-media", "shared-files"),
      "outcomeTitle": "A narrower contract, deliberately.",
      "outcomeDialogue": "POSIX access minimizes application changes and works across hosts. Filesystem throughput and mounts need monitoring; public delivery still passes through an origin.",
      "outcomeEmotion": "thinking",
      "outcomeNote": "Externalize durable files before treating application hosts as disposable. Next pressure: Public images can later be delivered at the edge; object access and lifecycle rules become responsibilities."
    },
    {
      "id": "006-shortcut",
      "label": "Replicate disks with a cron job",
      "description": "Copy local upload directories between app hosts or to a recovery host every five minutes. Hire one engineer.",
      "cost": 780,
      "tone": "risky",
      "effects": {
        "users": 4500,
        "monthlyRevenue": 2100,
        "monthlyBurn": 6325,
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
        "upside": "Reuses the existing upload code and storage layout.",
        "downside": "New files are absent until copying completes; deletions and concurrent writes can diverge.",
        "jimmyExplanation": "Reuses the existing upload code and storage layout. New files are absent until copying completes; deletions and concurrent writes can diverge.",
        "effectReasons": {
          "upfrontCost": "$780 funds this rollout, verification and migration effort.",
          "monthlyBurn": "The monthly change is $+6,325, including 1 hires and the operating costs of this response.",
          "reliability": "New files are absent until copying completes; deletions and concurrent writes can diverge.",
          "customerTrust": "Merchant retention follows the response’s stated service contract and remaining risk.",
          "complexity": "Operational load includes the rollout, ownership and ongoing failure modes described here."
        }
      },
      "architectureChanges": changesFor("disk-sync"),
      "outcomeTitle": "The trade-off catches up.",
      "outcomeDialogue": "Reuses the existing upload code and storage layout. New files are absent until copying completes; deletions and concurrent writes can diverge.",
      "outcomeEmotion": "concerned",
      "outcomeNote": "Externalize durable files before treating application hosts as disposable. The retained risk remains part of your company’s architecture."
    }
  ],
  "hints": [
    "Image metadata is durable but the referenced bytes exist only on one disposable application disk.",
    "Externalize durable files before treating application hosts as disposable."
  ],
  "lesson": "Externalize durable files before treating application hosts as disposable.",
  "variants": [
    {
      "id": "without-app-fleet",
      "when": {
        "missingAny": [
          "app-fleet"
        ]
      },
      "description": "The single-host replacement rehearsal loses recently uploaded images. You have not deployed a fleet, but the images still live on an ephemeral application disk.",
      "metrics": [
        {
          "label": "Images lost on replacement",
          "value": "all local-only uploads",
          "severity": "critical"
        },
        {
          "label": "DB metadata",
          "value": "intact",
          "severity": "normal"
        }
      ],
      "dialogue": [
        {
          "character": "jimmy",
          "emotion": "thinking",
          "text": "The single-host replacement rehearsal loses recently uploaded images. You have not deployed a fleet, but the images still live on an ephemeral application disk."
        },
        {
          "character": "jimmy",
          "emotion": "thinking",
          "text": "The database knows the photo exists. The host serving this request does not have its bytes. A durable reference needs durable storage behind it."
        },
        {
          "character": "jimmy",
          "emotion": "normal",
          "text": "This month’s operating plan adds 1 engineer. Their compensation is included in every response’s recurring burn. Ownership has to grow with the architecture."
        }
      ]
    }
  ]
});
