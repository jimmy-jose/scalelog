export const premiumLaunchCapabilities = [
  "portable-sessions",
  "durable-media",
  "tenant-limits",
  "capacity-budget",
  "catalogue-cache",
  "fresh-catalogue",
  "cache-coalescing",
  "idempotent-effects",
  "bounded-retries",
  "dead-letter",
  "durable-handoff",
  "isolated-workers",
  "consistent-reads",
  "multi-az",
  "pitr",
  "safe-migrations",
  "reliable-projections",
  "versioned-events",
  "dependency-bulkheads",
  "observability",
  "payment-reconciliation",
  "tenant-shards",
  "whale-isolation",
  "regional-dr",
  "priority-admission"
] as const;

/** Unrepaired correctness risks invalidate a premium SLA even if all capacity boxes exist. */
export const launchHazards = [
  "unsafe-checkout-cache", "unsafe-edge-cache", "early-ack", "infinite-retries",
  "publish-before-commit", "replica-write-routing", "sleep-consistency", "unfenced-failover",
  "search-authority", "nested-retries", "breaking-events", "new-payment-ids",
  "random-tenant-scatter", "uncoordinated-multiwriter", "unbounded-backlog",
] as const;
