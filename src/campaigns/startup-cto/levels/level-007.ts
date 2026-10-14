import { defineStartupLevel, changesFor } from "./authoring";

export const level007 = defineStartupLevel({
  "levelNumber": 7,
  "title": "The Same Catalogue Again",
  "description": "A franchise merchant chain launches identical public catalogues across dozens of stores. Database CPU reaches 88% from hundreds of shoppers repeatedly querying the exact same product rows, while checkout writes remain low. Browsing can tolerate slight delays, but checkout must always be 100% accurate.",
  "dialogue": [
      {
          "character": "jimmy",
          "emotion": "thinking",
          "text": "92% of our database load is shoppers repeatedly reading the exact same product catalogues. This is the classic scenario where caching pays for itself. But we must keep a strict boundary: cache public browse data, never checkout or stock validation."
      }
  ],
  "metrics": [
    {
      "label": "Catalogue read share",
      "value": "92% of DB queries",
      "severity": "warning"
    },
    {
      "label": "Repeated keys",
      "value": "90% within 60 s",
      "severity": "normal"
    },
    {
      "label": "DB CPU / connections",
      "value": "88% / 140",
      "severity": "critical"
    },
    {
      "label": "Indexed query p95",
      "value": "12 ms alone; 210 ms loaded",
      "severity": "warning"
    }
  ],
  "choices": [
    {
      "id": "007-measured",
      "label": "Cache public catalogue reads",
      "description": "Use cache-aside with tenant-scoped keys, a 60-second TTL and a bounded origin fallback; keep checkout price and stock on the primary. Separate cache memory from session storage.",
      "cost": 1800,
      "tone": "recommended",
      "effects": {
        "users": 20000,
        "monthlyRevenue": 8500,
        "monthlyBurn": 1500,
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
        "upside": "High reuse removes repeated DB work without moving transactional truth.",
        "downside": "Expiry, cache outages and invalidation now need explicit behavior.",
        "jimmyExplanation": "Cache-aside for public catalogues is a textbook win: check Redis first; if it is there, return it in 2 milliseconds; if not, query PostgreSQL and populate Redis for 60 seconds. Crucially, checkout price and stock checks still bypass Redis and query PostgreSQL directly, preventing overselling.",
        "effectReasons": {
          "upfrontCost": "$1,800 covers provisioning a dedicated Redis cluster, building cache-aside middleware, and adding cache hit/miss instrumentation.",
          "monthlyBurn": "Running a dedicated managed Redis cluster adds $1,500/month to our infrastructure spend.",
          "reliability": "Offloading 90% of repeat reads protects PostgreSQL from CPU saturation during peak shopping hours.",
          "customerTrust": "Shoppers experience instant catalogue browsing without risking incorrect prices during checkout.",
          "complexity": "The team must now monitor cache hit ratios, set TTL expiration policies, and handle Redis connection failures."
        }
      },
      "architectureChanges": changesFor("catalogue-cache"),
      "outcomeTitle": "Repeated reads stop repeating work.",
      "outcomeDialogue": "PostgreSQL CPU plummeted from 88% down to 22%. Shoppers get instant catalogue browsing, and checkout remains completely accurate because it queries the primary database.",
      "outcomeEmotion": "happy",
      "outcomeNote": "Cache only data whose reuse and freshness contract justify it. Next pressure: Caching introduces stale prices and expiry bursts; stock remains authoritative at checkout."
    },
    {
      "id": "007-bounded",
      "label": "Buy temporary database headroom",
      "description": "Resize PostgreSQL and keep uncached catalogue reads while measuring reuse.",
      "cost": 810,
      "tone": "neutral",
      "effects": {
        "users": 14000,
        "monthlyRevenue": 5950,
        "monthlyBurn": 2100,
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
        "upside": "No new data freshness model; a valid short-term capacity choice.",
        "downside": "A higher recurring bill buys limited headroom for a strongly repetitive workload.",
        "jimmyExplanation": "Upgrading PostgreSQL buys raw CPU and memory to power through the read volume without adding Redis. It avoids managing cache staleness, but paying for a larger database just to repeatedly scan identical rows is expensive and inefficient.",
        "effectReasons": {
          "upfrontCost": "$810 covers the database migration window, benchmarking, and read connection pooling.",
          "monthlyBurn": "Upgrading to a higher-tier database instance raises monthly recurring burn by $2,100.",
          "reliability": "More CPU cores handle the repetitive query volume without introducing cache-invalidation bugs.",
          "customerTrust": "Browsing speeds improve temporarily, though peak traffic will eventually saturate this tier too.",
          "complexity": "Zero caching infrastructure to operate; data stays in one place with simple transactional semantics."
        }
      },
      "architectureChanges": changesFor("vertical-db"),
      "outcomeTitle": "A narrower contract, deliberately.",
      "outcomeDialogue": "The larger database absorbed the catalogue reads for now, but we are paying $2,100/month more just to repeatedly serve the exact same data from disk.",
      "outcomeEmotion": "thinking",
      "outcomeNote": "Cache only data whose reuse and freshness contract justify it. Next pressure: Caching introduces stale prices and expiry bursts; stock remains authoritative at checkout."
    },
    {
      "id": "007-shortcut",
      "label": "Cache the entire checkout response",
      "description": "Cache checkout totals and availability for ten minutes without primary revalidation.",
      "cost": 1170,
      "tone": "risky",
      "effects": {
        "users": 6000,
        "monthlyRevenue": 2550,
        "monthlyBurn": 1725,
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
        "upside": "Most reads become very fast while the cache is warm.",
        "downside": "Stale price and stock can be accepted; a faster incorrect sale damages trust.",
        "jimmyExplanation": "Caching the entire checkout response is a disaster waiting to happen. If you cache checkout totals for 10 minutes without checking the primary database, two customers will buy the very last item in stock, or shoppers will check out at an expired discount price.",
        "effectReasons": {
          "upfrontCost": "$1,170 is spent building an unsafe checkout caching layer that ignores transactional validation.",
          "monthlyBurn": "Running the caching layer adds $1,725/month while introducing serious business correctness risks.",
          "reliability": "Bypassing primary transactional validation causes race conditions, double-sells, and data corruption.",
          "customerTrust": "Customers are charged for out-of-stock items, resulting in angry refunds and merchant churn.",
          "complexity": "Debugging discrepancies between cached checkout totals and actual database inventory creates severe support debt."
        }
      },
      "architectureChanges": changesFor("unsafe-checkout-cache"),
      "outcomeTitle": "The trade-off catches up.",
      "outcomeDialogue": "Checkouts became lightning-fast, and immediately started overselling inventory. Merchants are furious that out-of-stock items were purchased and wrong totals were charged.",
      "outcomeEmotion": "concerned",
      "outcomeNote": "Cache only data whose reuse and freshness contract justify it. The retained risk remains part of your company’s architecture."
    }
  ],
  "hints": [
    "A high-frequency, reusable read workload saturates aggregate DB CPU despite efficient individual queries.",
    "Cache only data whose reuse and freshness contract justify it."
  ],
  "lesson": "Separate browsing from buying: cache public product listings to save database reads, but always check real-time stock and price at the checkout counter."
});
