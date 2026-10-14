import { defineStartupLevel, changesFor } from "./authoring";

export const level006 = defineStartupLevel({
  "levelNumber": 6,
  "title": "The Missing Product Photos",
  "description": "Merchants upload product images successfully, but customers see broken image icons (404s). The database saved the image path, but the actual image file was written to Server A's local hard drive. When a customer's request hits Server B or a server is replaced, the image file simply isn't there.",
  "dialogue": [
    {
      "character": "jimmy",
      "emotion": "thinking",
      "text": "The database knows the photo exists, but the web server trying to serve the image has an empty folder. You can't store customer uploads on disposable server disks."
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
        "jimmyExplanation": "Cloud object storage (like AWS S3 or Google Cloud Storage) is designed for this exact purpose: virtually unlimited storage, 99.999999999% durability, and direct signed URLs so users can upload and download without bogging down our web servers. It completely decouples file storage from server lifecycles.",
        "effectReasons": {
          "upfrontCost": "$1,200 pays for the S3 integration, signed upload URL generation, data migration, and verification.",
          "monthlyBurn": "Adding our 3rd engineer ($5,000/mo) plus cloud storage and egress fees brings the monthly increase to $5,500.",
          "reliability": "Images achieve cloud durability; app servers can be created or destroyed without risking file loss.",
          "customerTrust": "Merchants' storefronts display product pictures consistently with zero 404 errors.",
          "complexity": "The team now manages bucket permissions, secure signed URLs, and storage lifecycle policies."
        }
      },
      "architectureChanges": changesFor("durable-media", "object-media"),
      "outcomeTitle": "The photo outlives the server.",
      "outcomeDialogue": "Images are safe in object storage. We can destroy, reboot, or scale app instances anytime without losing a single product photo, and our new engineer is already onboarded.",
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
        "jimmyExplanation": "Mounting a managed network filesystem (like NFS or EFS) lets our servers read and write files using standard folder paths without changing application code. It's an easy transition, but shared network mounts can become I/O bottlenecks and still tie our app servers to a shared filesystem.",
        "effectReasons": {
          "upfrontCost": "$540 funds configuring network file mounts, mounting scripts, and file synchronization.",
          "monthlyBurn": "Includes our 3rd engineer ($5,000/mo) plus managed NFS mount fees, offset by internal efficiency.",
          "reliability": "Files are accessible from any host, but network filesystem latency can stall web worker threads under load.",
          "customerTrust": "Product images load reliably across the site, restoring merchant confidence.",
          "complexity": "Maintaining network mounts, handling mount disconnects, and tuning NFS locking add operational chores."
        }
      },
      "architectureChanges": changesFor("durable-media", "shared-files"),
      "outcomeTitle": "A narrower contract, deliberately.",
      "outcomeDialogue": "The shared filesystem mount is working and images appear across all servers. It solved the 404s without rewriting our upload code, though network mount latency needs monitoring.",
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
        "jimmyExplanation": "Running an rsync cron script to copy uploads between servers every five minutes is an operational nightmare. Any image uploaded at 2:01 PM will 404 until the 2:05 PM cron job runs. And if two servers write at the same time or a server crashes, files diverge and get lost.",
        "effectReasons": {
          "upfrontCost": "$780 covers writing and debugging custom rsync scripts and SSH key distribution across hosts.",
          "monthlyBurn": "Includes our 3rd engineer ($5,000/mo) plus wasted disk space across multiple instances.",
          "reliability": "Sync delays leave newly uploaded images missing for up to 5 minutes, and cron failures silently drop files.",
          "customerTrust": "Merchants get frustrated seeing broken images right after uploading products, leading to support tickets.",
          "complexity": "Managing custom cron scripts, SSH access, and split-brain sync collisions creates constant on-call friction."
        }
      },
      "architectureChanges": changesFor("disk-sync"),
      "outcomeTitle": "The trade-off catches up.",
      "outcomeDialogue": "The cron sync started colliding immediately. Merchants are still seeing 404s for the first five minutes after uploading, and server disks are filling up with duplicate files.",
      "outcomeEmotion": "concerned",
      "outcomeNote": "Externalize durable files before treating application hosts as disposable. The retained risk remains part of your company’s architecture."
    }
  ],
  "hints": [
    "Image metadata is durable but the referenced bytes exist only on one disposable application disk.",
    "Externalize durable files before treating application hosts as disposable."
  ],
  "lesson": "Servers are disposable; user data is not: store uploaded files in cloud object storage (like S3) so any server can access them and no file is lost when a server is destroyed.",
  "variants": [
    {
      "id": "without-app-fleet",
      "when": {
        "missingAny": [
          "app-fleet"
        ]
      },
      "description": "We simulated replacing our app host, and every uploaded product image vanished. Even without a load balancer, servers are ephemeral; when a cloud VM dies, everything on its local disk dies with it.",
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
          "text": "We spun up a replacement host during the rehearsal, and every recently uploaded photo vanished into thin air. The database still points to the file paths, but the disk they were on was destroyed. We need storage that outlives the server."
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
