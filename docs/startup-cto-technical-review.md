# Pre-implementation system-design review

Reviewed the complete 36-level progression before implementing new content. The authored incidents are illustrative measurements, not vendor benchmarks. Review outcome: proceed with the corrections and branch rules below.

## Corrections and constraints

- **App scaling (4–6):** CPU profiling and healthy query latency justify scaling app compute. Load balancing alone does not solve local sessions/uploads. A vertical alternative remains legitimate. Its next incidents are rolling-replacement tests, not fabricated cross-instance outages. Level 4’s good and compromise rollout explicitly repair missing indexing/pooling from legacy paths. Fleet adoption at 11 includes portable sessions/durable files if still missing, with disclosed recovery cost.
- **Caching (7–12):** reuse is measured and keys are tenant-scoped. Browse freshness is separate from authoritative checkout validation. Invalidation includes racing fills and a TTL safety bound; after a cache bypass, later cache observations must become a load-test proposal. Session state is isolated from evictable catalogue-cache memory. A CDN caches only public assets; private responses need different policies. Coalescing has bounded locks, TTL jitter and an origin budget.
- **Async (13–18):** a successful HTTP response does not imply durable background execution. Level 13 deliberately accepts a monitored commit/publish gap with reconciliation; Level 17 closes it transactionally. Durable local dispatch is also viable. Idempotency includes unique local records and provider-supported keys; no promise of exactly-once arbitrary email. Acknowledge-before-effect loses work. Retry horizons, jitter and DLQ replay keep original identities. Quarantining a message can break stream ordering, so dependent messages need reconciliation.
- **Replicas (19–22):** physical readers do not accept writes. Report lag is allowed; confirmation lag is not. A time delay cannot guarantee read-after-write. Zone RPO 0 requires synchronous durable acknowledgement and fenced promotion; losing quorum may stop writes. This is not the regional catastrophe contract. PITR must restore to an isolated target and reconcile legitimate later orders; replicas propagate logical deletion.
- **Migrations/search (23–24):** expand/contract spans multiple releases; not all ALTER TABLE operations rewrite data, so the incident specifically combines a locking change with a long backfill. Concurrent index builds still cost I/O. PostgreSQL search is a valid lower-scope alternative; the specialized index is justified by a representative faceted/relevance benchmark, and remains derived.
- **Services/events (25–30):** only media is extracted on the recommended route, after separate worker pools and a funded four-person owner group exist. Media metadata has an owner and order data is not accessed across the boundary. A competing-consumer queue is not fan-out. Event compatibility includes units and retained replay data. Traces use async links and redaction. Circuit breakers contain failure rather than repair dependencies. Payment timeouts remain unknown until reconciled, including late success after stock reservation expiry.
- **Partitioning/sharding (31–33):** time partitions improve pruning/retention, not aggregate writer throughput. Partitioned uniqueness constraints include partition keys or use a separate invariant table. Sharding follows batching, index pruning and a tested vertical limit. Tenant locality avoids cross-shard order/stock transactions. Distributed IDs are unique identifiers, not proof of a global total order. One hot tenant cannot be split by hashing tenant IDs again; isolate it with a bounded feed budget. Consistent hashing is intentionally not a prescribed solution because it cannot fix within-key skew.
- **DR/finale (34–36):** warm standby includes every data group, objects, queue reconstruction, credentials, fencing and traffic shifts. Async regional replication allows bounded acknowledged loss; observed lag can invalidate the RPO and block automatic promotion. Recovery must reconcile externally completed payments and replay gaps. A scoped launch is valid when premium prerequisites are absent; the ending must never award an unearned premium SLA or replace the actual graph. Capacity assertions describe a modeled rehearsal, not measured performance of a real Cartline deployment.

## Workload and organizational review

The final peak origin rate is six times its average. Public edge hits do not all reach the origin. Catalogue imports contribute most row mutations; 24K row mutations/s is not 24K customer orders/s. Six TB includes indexes, audit and catalogue data. There are no claims that registered users determine concurrency. Measured event loads on alternate routes are prospective acceptance tests when actual company growth is lower.

The recommended route grows from two to 27 engineers, with compensation and operational capacity in burn. Final baseline burn is $408,100/month including a modeled infrastructure ceiling of $180,000. $1.95M recurring merchant revenue and $13,954,600 retained cash describe a deliberately successful, profitable trajectory, not an externally validated business forecast. Small neutral decisions reduce growth; costly mistakes remain consequential. Health scores do not replace SLO measurements.

## Branch implementation requirements

Use optional capabilities on the existing architecture graph and declarative incident variants. Resolve variants in the shared engine as well as the UI so modified/forged client choices cannot avoid consequences. Replay must resolve each historical incident against the graph entering that incident. Recovery additions must disclose upfront/burn/operations effects, preserve all existing components, and never reset company state. Old graphs without capability metadata remain readable. Published Levels 1–3 stay unchanged.

At minimum, test absent fleet/session/media paths; cache omitted/bypassed; queue omitted; reader absent/bypassed; media unextracted; fan-out omitted; sharding omitted; regional standby absent; and premium finale readiness. Use complete recommended, compromise, mixed and failing paths plus deterministic randomized runs.

## Reference checks

These sources were consulted to check semantics; incidents, metrics and economic values are original fictional teaching examples.

- [PostgreSQL standby and replication documentation](https://www.postgresql.org/docs/current/warm-standby.html): asynchronous lag, synchronous commit and failover distinctions.
- [PostgreSQL table partitioning](https://www.postgresql.org/docs/current/ddl-partitioning.html): pruning, retention and partition-key uniqueness restrictions.
- [AWS transactional outbox guidance](https://docs.aws.amazon.com/prescriptive-guidance/latest/cloud-design-patterns/transactional-outbox.html): atomic delivery intent and duplicate-tolerant consumers.
- [Amazon Builders’ Library: idempotent APIs](https://aws.amazon.com/builders-library/making-retries-safe-with-idempotent-APIs/): caller-provided identity and retries with the same intent.

## Product choices made explicitly

Use 36 operating months and six eras; show registered users separately from workload forecasts. Treat occasional neutral responses as supported narrower contracts. Retain the existing failure thresholds and the Level 10 award. No new funding, pricing simulation, real cloud provisioning, or separate founder-trust stat is introduced. The final report records scope and architecture debt instead of claiming every surviving route meets the premium forecast.


## Implementation review amendments

- The price-cache expiry budget is measured from the source-read start, so a slow stale fill cannot extend a five-second freshness promise. Stampede jitter stays below the applicable freshness ceiling; stale descriptions have a separate 30-second bound.
- Zone failover uses a primary and two standby candidates across three AZs, with remote durable WAL acknowledgement, fenced election and promotion only of a sufficiently advanced candidate. Loss of a durability quorum stops writes; synchronous replication is not an unconditional availability guarantee.
- Fixed peak capacity qualifies the same capacity-budget prerequisite as bounded autoscaling. The finale checks outstanding correctness hazards as well as missing capabilities; it cannot certify an unsafe cache policy simply because all the capacity components exist.
- A fan-out prototype variant covers routes without a deployed queue or specialized search projection. Source-level route tests include every new response, not only the ideal diagram.
- Level 4’s diagnostic probe explicitly uses an indexed/pooled reference path. Its good/compromise rollout includes repairing production debt; it does not claim that earlier unindexed branches were healthy in production.

## Subsequent level/progression audit

See [the level progression audit](level-progression-audit.md) for reproduced branch, topology and persistence defects and their fixes. It supersedes the earlier instruction to leave Levels 1–3 entirely unchanged: published IDs and economics remain stable, while Level 2 index guidance and Level 3 pooling/replica topology and branch evidence are corrected. It also tightens asynchronous failover evidence, search-price freshness and premium-launch prerequisites. Saved snapshots now take precedence over replaying current content for historical screens.
