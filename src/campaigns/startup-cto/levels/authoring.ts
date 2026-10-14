import type { ArchitectureChange, ArchitectureNodeType, Level } from "@/domain/types";

const component = (id: string, type: ArchitectureNodeType, label: string, subtitle: string): ArchitectureChange[] => [
  { type: "addNode", node: { id, type, label, subtitle, state: "normal", position: { x: 190, y: 92 } } },
  { type: "updateNode", nodeId: id, patch: { label, subtitle, state: "normal" } },
];
const edge = (from: string, to: string, label?: string): ArchitectureChange => ({ type: "addEdge", edge: { from, to, ...(label ? { label } : {}) } });
const edgeIfPresent = (from: string, to: string, label: string): ArchitectureChange => ({ type: "addEdge", edge: { from, to, label }, ifNodesExist: true });
const remove = (from: string, to: string): ArchitectureChange => ({ type: "removeEdge", from, to });

/** Content vocabulary for changes to the existing topology, not a second simulation. */
const components: Record<string, ArchitectureChange[]> = {
  "render-service-split": [...component("render-services", "service", "Render services", "three processes; same CPU host"), edge("monolith", "render-services")],
  "service-sprawl": [
    ...["catalogue", "accounts", "billing", "orders"].flatMap(domain => [
      ...component(`split-${domain}`, "service", `${domain} service`, "shared database; coordinated migration"),
      edge("monolith", `split-${domain}`), edge(`split-${domain}`, "postgres"),
    ]),
  ],
  "write-pressure-readers": [...component("extra-readers", "readReplica", "Additional readers", "primary still handles all mutations"), edge("postgres", "extra-readers", "async WAL")],
  "replica-write-routing": [...component("invalid-writer", "readReplica", "Read-only replica", "writes rejected"), edge("postgres", "invalid-writer", "async WAL"), edge("monolith", "invalid-writer", "misrouted writes")],
  "unsafe-edge-cache": [...component("unsafe-cdn", "cdn", "Shared URL cache", "unsafe private response policy"), edge("client", "unsafe-cdn"), edge("unsafe-cdn", "monolith")],
  "unsafe-checkout-cache": [...component("unsafe-cache", "redis", "Checkout response cache", "stock and price not revalidated"), edge("monolith", "unsafe-cache")],
  "uncoordinated-multiwriter": [...component("unfenced-region", "region", "Second write region", "unresolved conflicts + stock risk"), edge("monolith", "unfenced-region")],
  "random-history-shards": [...component("random-history", "postgres", "Random history shards", "scatter reads; costly retention"), edge("monolith", "random-history")],
  "random-tenant-scatter": [...component("scattered-orders", "postgres", "Scattered tenant writes", "cross-shard stock invariant unresolved"), edge("monolith", "scattered-orders")],
  indexed: [{ type: "updateNode", nodeId: "postgres", patch: { state: "normal", subtitle: "indexed primary" } }],
  pooled: [...component("pooler", "service", "Connection pool", "bounded DB sessions"), edge("monolith", "pooler"), edge("pooler", "postgres"), remove("monolith", "postgres"), ...["users-service", "orders-service", "billing-service"].flatMap(id => [remove(id, "postgres"), edgeIfPresent(id, "pooler", "bounded DB sessions")])],
  "app-fleet": [...component("load-balancer", "loadBalancer", "Load balancer", "health checks + draining"), { type: "updateNode", nodeId: "monolith", patch: { subtitle: "horizontal app fleet", state: "normal" } }, remove("client", "monolith"), edge("client", "load-balancer"), edge("load-balancer", "monolith")],
  "vertical-app": [{ type: "updateNode", nodeId: "monolith", patch: { subtitle: "larger single app host", state: "normal" } }],
  "session-store": [...component("sessions", "redis", "Session store", "isolated durable session budget"), edge("monolith", "sessions")],
  "object-media": [...component("object-storage", "objectStorage", "Object storage", "authorized durable media"), edge("monolith", "object-storage", "signed object access")],
  "shared-files": [...component("shared-files", "objectStorage", "Shared filesystem", "managed mounts + backups"), edge("monolith", "shared-files")],
  "catalogue-cache": [{ type: "updateNode", nodeId: "unsafe-cache", patch: { label: "Retired checkout cache", subtitle: "bypassed; primary validation restored" } }, remove("monolith", "unsafe-cache"), ...component("redis", "redis", "Catalogue cache", "tenant-scoped; checkout revalidates"), edge("monolith", "redis", "cache-aside")],
  "cache-bypassed": [{ type: "updateNode", nodeId: "redis", patch: { subtitle: "catalogue bypassed", state: "normal" } }],
  "edge-assets": [...component("cdn", "cdn", "Public asset CDN", "versioned assets; private APIs bypass"), edge("client", "cdn"), edge("cdn", "object-storage", "public origin fetch")],
  "regional-assets": [...component("asset-mirror", "region", "Regional asset origin", "public immutable copies"), edge("client", "asset-mirror")],
  "tenant-limits": [...component("rate-limiter", "rateLimiter", "Tenant admission", "quotas + concurrency budgets"), edge("monolith", "rate-limiter", "ingress admission policy")],
  "job-queue": [...component("jobs", "queue", "Durable jobs", "at-least-once; bounded retention"), ...component("workers", "worker", "Background workers", "receipts + media jobs"), edge("monolith", "jobs", "publish jobs"), edge("jobs", "workers", "deliver")],
  "local-dispatch": [...component("dispatcher", "worker", "Durable dispatcher", "database delivery ledger"), edge("postgres", "dispatcher", "poll delivery intents")],
  "dead-letter": [...component("dlq", "queue", "Quarantined jobs", "restricted access + owner + replay"), edge("monolith", "dlq", "quarantine failed work")],
  outbox: [{ type: "updateNode", nodeId: "postgres", patch: { subtitle: "order + outbox transaction", state: "normal" } }, ...component("outbox-relay", "worker", "Outbox relay", "publish; retry; monitor age"), edge("postgres", "outbox-relay", "committed delivery intents"), edge("outbox-relay", "jobs", "publish events"), remove("monolith", "jobs")],
  "isolated-workers": [...component("import-workers", "worker", "Bulk worker pool", "bounded tenant backlogs"), edge("jobs", "import-workers", "bulk jobs"), { type: "updateNode", nodeId: "workers", patch: { subtitle: "reserved receipt capacity" } }],
  "read-replicas": [...component("read-replica", "readReplica", "Report reader", "asynchronous; lag monitored"), edge("postgres", "read-replica", "WAL replication"), edge("monolith", "read-replica", "tolerant reports")],
  "primary-reads": [remove("monolith", "read-replica")],
  "multi-az": [...component("az-standby", "readReplica", "AZ standby group", "durable WAL quorum; fenced election"), edge("postgres", "az-standby", "synchronous WAL")],
  "async-ha": [...component("async-standby", "readReplica", "Asynchronous standby", "fenced; nonzero loss budget"), edge("postgres", "async-standby", "async WAL")],
  pitr: [...component("backups", "objectStorage", "Recovery archive", "base backups + WAL; restore drills"), edge("postgres", "backups", "archive WAL + base backups")],
  snapshots: [...component("snapshots", "objectStorage", "Backup snapshots", "hourly recovery points"), edge("postgres", "snapshots", "scheduled snapshots")],
  "search-projection": [...component("search", "search", "Derived search index", "30-second freshness; rebuildable"), edge("monolith", "search", "discovery only"), edge("postgres", "search", "versioned projection feed")],
  "media-service": [...component("media", "service", "Media service", "owned metadata + deploy + on-call"), edge("jobs", "media", "versioned media jobs"), edge("media", "object-storage", "scoped object access")],
  "event-fanout": [...component("events", "queue", "Event topic", "subscriber-owned durable queues"), ...component("subscribers", "worker", "Projection subscribers", "receipts / search if enabled / analytics"), edge("postgres", "events", "durable outbox or dispatch"), edge("events", "subscribers", "independent subscriptions")],
  "time-partitions": [{ type: "updateNode", nodeId: "postgres", patch: { subtitle: "date-partitioned history; one writer" } }],
  "tenant-shards": [...component("shard-directory", "service", "Tenant directory", "tenant routing + globally unique IDs"), ...component("shards", "postgres", "8 writer groups", "tenant-local transactions; per-group recovery"), edge("monolith", "shard-directory", "resolve tenant"), edge("shard-directory", "shards", "tenant writer"), edgeIfPresent("shards", "backups", "per-group base backups + WAL"), edgeIfPresent("shards", "read-replica", "per-group report readers"),
    { type: "updateNode", nodeId: "read-replica", patch: { label: "Report reader groups", subtitle: "per-writer physical replicas; routed reports" } },
    edgeIfPresent("shards", "az-standby", "independent per-writer synchronous HA"),
    edgeIfPresent("shards", "outbox-relay", "per-writer committed intents"),
    edgeIfPresent("shards", "dispatcher", "per-writer transactional delivery ledger"),
    edgeIfPresent("shards", "events", "per-writer durable publication"),
    edgeIfPresent("shards", "search", "versioned tenant projection feed"),
    ...["users-service", "orders-service", "billing-service"].map(id => edgeIfPresent(id, "shard-directory", "resolve tenant writer; per-writer pool")), { type: "updateNode", nodeId: "postgres", patch: { subtitle: "control plane + legacy migrations" } }],
  "whale-isolation": [...component("shard-directory", "service", "Tenant directory", "tenant routing + globally unique IDs"), edge("monolith", "shard-directory", "resolve tenant"), ...component("whale-writer", "postgres", "Whale writer", "dedicated budget; tenant-local invariants"), edge("shard-directory", "whale-writer", "dedicated tenant writer"),
    edgeIfPresent("whale-writer", "az-standby", "independent synchronous HA"),
    edgeIfPresent("whale-writer", "async-standby", "independent asynchronous recovery"),
    edgeIfPresent("whale-writer", "outbox-relay", "whale committed intents"),
    edgeIfPresent("whale-writer", "dispatcher", "whale transactional delivery ledger"),
    edgeIfPresent("whale-writer", "events", "whale durable publication"),
    edgeIfPresent("whale-writer", "search", "versioned whale projection feed"), edgeIfPresent("whale-writer", "backups", "independent WAL archive")],
  "regional-dr": [...component("standby-region", "region", "Warm recovery region", "all writer groups + media + config"), edge("monolith", "standby-region", "recovery routing; fenced promotion"), edge("postgres", "standby-region", "asynchronous recovery stream"), edgeIfPresent("shards", "standby-region", "all writer groups; async WAL"), edgeIfPresent("whale-writer", "standby-region", "whale recovery stream"), edgeIfPresent("object-storage", "standby-region", "object replication"), edgeIfPresent("shared-files", "standby-region", "shared media recovery copy"), edgeIfPresent("backups", "standby-region", "independent recovery archive")],
};

const repairedRisks: Record<string, string[]> = {
  "portable-sessions": ["sticky-sessions"],
  "durable-media": ["disk-sync"],
  "catalogue-cache": ["unsafe-checkout-cache", "cache-bypassed"],
  "fresh-catalogue": ["long-cache-ttl"],
  "tenant-limits": ["ip-blocking"],
  "capacity-budget": ["unbounded-autoscale"],
  "cache-coalescing": ["oversized-cache"],
  "job-queue": ["volatile-jobs"],
  "idempotent-effects": ["early-ack"],
  "bounded-retries": ["retry-storm"],
  "dead-letter": ["infinite-retries"],
  "durable-handoff": ["publish-before-commit", "volatile-jobs"],
  "isolated-workers": ["unbounded-workers"],
  "consistent-reads": ["sleep-consistency"],
  "multi-az": ["unfenced-failover"],
  "pitr": ["deleted-replica"],
  "safe-migrations": ["blocking-migration"],
  "dependency-bulkheads": ["nested-retries"],
  "reliable-projections": ["competing-projections"],
  "versioned-events": ["breaking-events"],
  "observability": ["cpu-only-alerts"],
  "payment-reconciliation": ["new-payment-ids"],
  "load-shedding": ["unbounded-backlog"],
};

export function changesFor(...capabilities: string[]): ArchitectureChange[] {
  return capabilities.flatMap((capability): ArchitectureChange[] => [
    ...(components[capability] ?? []), { type: "setCapability", capability, enabled: true },
    ...(repairedRisks[capability] ?? []).map((risk): ArchitectureChange => ({ type: "setCapability", capability: risk, enabled: false })),
  ]);
}
export const disable = (...capabilities: string[]): ArchitectureChange[] => capabilities.map((capability) => ({ type: "setCapability", capability, enabled: false }));

export const eras = ["Production Monolith", "Read Scaling and Delivery", "Asynchronous Systems", "Database and Data Scaling", "Service and Event Architecture", "Millions of Users"];

export function defineStartupLevel(content: Pick<Level, "levelNumber" | "title" | "description" | "dialogue" | "metrics" | "choices" | "hints" | "lesson"> & Partial<Pick<Level, "variants" | "recoveries">>): Level {
  const chapter = Math.ceil(content.levelNumber / 6);
  return {
    ...content, id: `startup-${String(content.levelNumber).padStart(3, "0")}`, campaignId: "startup-cto", chapter,
    kicker: `ERA ${String(chapter).padStart(2, "0")} · ${eras[chapter - 1]}`,
    architectureBefore: { nodes: [], edges: [] }, // live topology comes from the decision ledger
    xpReward: 140 + Math.floor(content.levelNumber / 6) * 20, unlocks: [],
  };
}
