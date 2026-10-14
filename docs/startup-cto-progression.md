# Startup CTO: From Garage to Growth - progression plan

Design completed before implementation. Levels 1–3 retain their published content, IDs and economic effects. This plan specifies the recommended continuity; live branch variations must describe omitted components as experiments or alternate bottlenecks, never as components the player already owns.

## Modeling contract

- One decision is one operating month. This is a compressed 36-month startup story. Users means registered users, not concurrent sessions, paying merchants, or DAU. Revenue comes from merchant subscriptions and usage, not a charge per registered shopper. The early launch growth is inherited unchanged.
- Diagnostics are authored incident observations / representative load tests, not computed telemetry. Branches replace observations when their architecture prerequisite is absent. Later projected load is a prospective contracted workload; live users, cash and team size remain visible and authoritative.
- Dollars are balancing estimates, not cloud-provider quotes. Burn includes salaries, infrastructure and support. Early founders take subsidized compensation; later hiring costs $4–9K/person/month plus growth infrastructure. No financing grants or silent cash resets. New revenue begins next month.
- Reliability is a bounded game health score, not measured uptime. Availability promises appear separately in incident metrics. Complexity is operational load relative to available organization, not number of boxes.
- All three responses have persistent costs, growth and health effects. A compromise can satisfy a narrower contract. Repeated dangerous choices fail under existing thresholds. Good choices can add cost/operations even when health is already capped.
- The final forecast is 4M registered / 400K DAU, 500 mean / 3K peak origin RPS, 12K peak edge RPS, 200 peak orders/s and 24K row mutations/s including merchant feeds, audit and index-related application writes. 500 RPS averages 108 origin requests/DAU/day. Average orders are much lower than peaks. 6TB includes relational indexes, catalogue/history/audit, not object bytes. No implied one-user/one-request correspondence.
- Final healthy checkout target: 99.9% monthly successful eligible requests, p95 500ms / p99 1.5s. Rate-limit exclusions must be contractual; dropping legitimate promised checkout traffic still consumes the error budget. A provider stall may return pending within the deadline, never a false payment success. Zone contract: acknowledged-write RPO 0 / RTO 2min. Regional catastrophe is a separate contract: RPO 60s / RTO 15min; recovery can consume availability budget. A 15min outage fits one 43.2min monthly 99.9% budget, not an unlimited number of outages.

## Six eras

1. Production Monolith (1–6): diagnose resources, scale app compute, then externalize state.
2. Read Scaling and Delivery (7–12): reuse/freshness, edge delivery, fair admission and bounded capacity.
3. Asynchronous Systems (13–18): durable deferral, duplicates, retries, poison jobs, atomic handoff and backpressure.
4. Database and Data Scaling (19–24): eligible read scaling, workflow consistency, failover, recovery, schema changes and derived search.
5. Service and Event Architecture (25–30): earned extraction, failure isolation, event contracts, observability and payment ambiguity.
6. Millions of Users (31–36): lifecycle partitioning, measured write sharding, skew, regional recovery and a bounded launch.

## Levels

### 01 - Your First Day

- Story event: Founder proposes replacing a working Laravel/PostgreSQL MVP.
- Company entering: 250 users; 2 engineers; $40,000; $2,000 revenue / $7,800 burn.
- Architecture entering: Laravel → PostgreSQL.
- Symptoms / evidence: No runtime bottleneck; deploy 4min.
- Root cause: No scaling diagnosis justifies a rewrite.
- Choices: Keep modular monolith ($0); split services ($12K); Go rewrite ($18K).
- Recommended / why now / alternatives: Keep modular monolith: two engineers retain one deployment. Alternatives have valid future uses but high immediate opportunity cost.
- Architecture and state consequences: Modular boundaries; +17,750 users, +$6,000 MRR, reliability +2, trust +2, ops −2, XP +80, confidence +8. Cash follows the shared monthly rule.
- Lesson: Diagnose before adding complexity.
- Previous link: Founder pressure, not measured demand.
- Future link: Orders query load.

### 02 - The Dashboard Is Slow

- Story event: New merchants wait on an orders query.
- Company entering: 18,000 users / 2 engineers on recommended route.
- Architecture entering: Modular monolith → PostgreSQL.
- Symptoms / evidence: DB CPU 94%; p95 3.8s; errors 11%; full table scan.
- Root cause: Missing query-aligned index.
- Choices: Add index ($200); Redis ($500); larger DB ($9K).
- Recommended / why now / alternatives: Index now because the trace identifies the expensive scan. Cache misses retain it; resizing only buys headroom.
- Architecture and state consequences: Index; +2,000 users, +$1,000 MRR, reliability +8, trust +5, ops +1, XP +120, confidence +10. Cash follows the shared monthly rule.
- Lesson: Fix query work before buying capacity.
- Previous link: Growth after Level 1.
- Future link: More app processes open DB sessions.

### 03 - Too Many Connections

- Story event: Traffic bump exhausts sessions.
- Company entering: 20,000 users / 2 engineers on recommended route.
- Architecture entering: Indexed PostgreSQL and monolith.
- Symptoms / evidence: 498/500 connections; DB CPU 42%; timeouts 18%.
- Root cause: Unbounded connection ownership, not CPU saturation.
- Choices: Pool connections ($800); raise max ($1K); second database ($7.5K).
- Recommended / why now / alternatives: Share bounded connections now; more sessions can add memory pressure and a reader does not pool primary connections.
- Architecture and state consequences: Pooler; +3,000 users, +$1,500 MRR, reliability +10, trust +6, ops +2, XP +140, confidence +10. Exit: $34,600 cash / $10,500 MRR / $7,800 burn. Cash follows the shared monthly rule.
- Lesson: Protect scarce resources before raising limits.
- Previous link: Earlier successful queries and new processes.
- Future link: Application CPU saturation.

### 04 - The Influencer Weekend

- Story event / symptoms: A viral merchant sends a measured 180 requests/s to one application host. The founder wants a repeatable way to add capacity before the next promotion. Profiles put 78% of app time in rendering; the database check is separate.
- Company entering (recommended baseline): 23,000 registered users, 2 engineers; $10,500 MRR / $7,800 burn.
- Architecture entering: modular monolith, PostgreSQL, query index, connection pooler.
- Evidence: App CPU: 96% at 180 RPS; DB CPU / query p95: 42% / 18 ms; App p95 / errors: 2.1 s / 6%; Backend sessions: 120 / 500 with pooler.
- Root cause: CPU-bound rendering on a single host queues requests; adding DB capacity cannot remove application CPU work.
- Recommended - **Add two app instances and a balancer**: Deploy two additional instances with health checks, bounded per-instance DB pools, and a canary. Repair the dashboard index and shared pool if omitted. Benefit: Measured parallel rendering capacity and a repeatable rollout. Trade-off / why alternatives are weaker now: Three hosts cost more; local sessions and files still need attention.
- Compromise - **Resize the current host first**: Buy a larger app host, profile it under load, and cap concurrent requests. Repair outstanding query and pooling debt. Benefit: A cheaper implementation buys measured headroom now. Trade-off / why alternatives are weaker now: One failure domain remains, and the next resize requires a maintenance window.
- Risky - **Move rendering behind more services**: Split the render path into three synchronous services on the same host. Benefit: Separate ownership could become useful with independent teams. Trade-off / why alternatives are weaker now: The same CPU quota remains saturated, and two engineers gain network failure paths.
- Why appropriate now: CPU-bound rendering on a single host queues requests; adding DB capacity cannot remove application CPU work. Measured parallel rendering capacity and a repeatable rollout.
- Architecture change: app-fleet, indexed, pooled; only a selected response's actual capability is retained.
- State consequences (recommended): upfront $1,200; burn +$600/month; users +7,000; MRR +$4,000; engineers +0; reliability +3; trust +2; operations +1; XP 140; confidence +8. End cash $35,500, team 2.
- Alternative balance: compromise has 70% of recommended user/MRR gains, reliability +1, trust +1, confidence +3, half XP and 45% implementation cost; infrastructure-heavy alternatives pay higher burn. Risky has 30% growth, reliability −9, trust −7, operations +7, XP −30, confidence −12 and 65% implementation cost. Hiring salary obligations remain with every choice. Specific incident risks can override these values.
- Lesson: Scale the saturated tier; load balancing does not make application state portable.
- Previous decision link: Indexing and pooling expose the next bottleneck. A legacy branch without either must repair it as part of the rollout.
- Future incident link: Requests now land on different instances; local sessions and uploaded files will become visible liabilities.

### 05 - Logged Out at Random

- Story event / symptoms: A merchant logs in and is redirected to login on the next request. Session files live on application disks. The team also needs sessions to survive a rolling replacement.
- Company entering (recommended baseline): 30,000 registered users, 2 engineers; $14,500 MRR / $8,400 burn.
- Architecture entering: modular monolith, PostgreSQL, query index, connection pooler, app-fleet, indexed, pooled.
- Evidence: Cross-instance login failures: 34%; Same-instance failures: 0%; Session backend: local files.
- Root cause: Different instances cannot read each other’s session files; CPU and password validation are healthy.
- Recommended - **Use shared server-side sessions**: Move opaque session IDs to a small managed Redis session store with expiry, secure cookies, and fail-closed authentication. Benefit: Requests can move between instances without losing authentication. Trade-off / why alternatives are weaker now: Session availability now depends on the shared store; budget memory and replication.
- Compromise - **Use signed short-lived session cookies**: Store minimal signed session claims client-side, with secure cookie flags, key rotation and a short expiry. Benefit: No session-store round trip is required. Trade-off / why alternatives are weaker now: Immediate per-session revocation needs extra state; short expiry bounds but does not eliminate that risk.
- Risky - **Pin each browser to one instance**: Enable load-balancer affinity while retaining local session files. Benefit: Affinity reduces cross-instance logouts while hosts remain healthy. Trade-off / why alternatives are weaker now: Deployments and host loss still invalidate sessions; sticky routing is a bridge, not durable state.
- Why appropriate now: Different instances cannot read each other’s session files; CPU and password validation are healthy. Requests can move between instances without losing authentication.
- Architecture change: portable-sessions; only a selected response's actual capability is retained.
- State consequences (recommended): upfront $800; burn +$400/month; users +10,000; MRR +$5,000; engineers +0; reliability +3; trust +2; operations +1; XP 140; confidence +8. End cash $40,400, team 2.
- Alternative balance: compromise has 70% of recommended user/MRR gains, reliability +1, trust +1, confidence +3, half XP and 45% implementation cost; infrastructure-heavy alternatives pay higher burn. Risky has 30% growth, reliability −9, trust −7, operations +7, XP −30, confidence −12 and 65% implementation cost. Hiring salary obligations remain with every choice. Specific incident risks can override these values.
- Lesson: Stateless application instances require deliberate placement of session state.
- Previous decision link: The fleet from Level 4 exposes local state. On the single-host path, a rolling-replacement rehearsal exposes the same loss.
- Future incident link: Files are still local even after sessions move; a shared session tier also needs capacity and failure handling.

### 06 - The Missing Product Photos

- Story event / symptoms: Merchants upload product images successfully, then see missing pictures after a request moves to another host or a host is replaced. Cartline can now fund its third engineer.
- Company entering (recommended baseline): 40,000 registered users, 2 engineers; $19,500 MRR / $8,800 burn.
- Architecture entering: modular monolith, PostgreSQL, query index, connection pooler, app-fleet, indexed, pooled, portable-sessions.
- Evidence: Image 404s after rerouting: 31%; Upload destination: instance disk; DB metadata checks: 100% present.
- Root cause: Image metadata is durable but the referenced bytes exist only on one disposable application disk.
- Recommended - **Move uploads to object storage**: Copy and checksum existing images, switch to private object storage with signed upload URLs and authorized reads, then retire local copies after verification. Hire one engineer. Benefit: Durable bytes outlive any application instance. Trade-off / why alternatives are weaker now: Migration verification, access policies and storage/egress bills need an owner.
- Compromise - **Mount managed shared file storage**: Migrate images to a managed network filesystem with tested failover and backups. Hire one engineer. Benefit: POSIX access minimizes application changes and works across hosts. Trade-off / why alternatives are weaker now: Filesystem throughput and mounts need monitoring; public delivery still passes through an origin.
- Risky - **Replicate disks with a cron job**: Copy local upload directories between app hosts every five minutes. Hire one engineer. Benefit: Reuses the existing upload code and storage layout. Trade-off / why alternatives are weaker now: New files are absent until copying completes; deletions and concurrent writes can diverge.
- Why appropriate now: Image metadata is durable but the referenced bytes exist only on one disposable application disk. Durable bytes outlive any application instance.
- Architecture change: durable-media; only a selected response's actual capability is retained.
- State consequences (recommended): upfront $1,200; burn +$5,500/month; users +15,000; MRR +$7,000; engineers +1; reliability +3; trust +2; operations +1; XP 160; confidence +8. End cash $44,400, team 3.
- Alternative balance: compromise has 70% of recommended user/MRR gains, reliability +1, trust +1, confidence +3, half XP and 45% implementation cost; infrastructure-heavy alternatives pay higher burn. Risky has 30% growth, reliability −9, trust −7, operations +7, XP −30, confidence −12 and 65% implementation cost. Hiring salary obligations remain with every choice. Specific incident risks can override these values.
- Lesson: Externalize durable files before treating application hosts as disposable.
- Previous decision link: Level 4 introduced host mobility; Level 5 repaired sessions but not file storage.
- Future incident link: Public images can later be delivered at the edge; object access and lifecycle rules become responsibilities.

### 07 - The Same Catalogue Again

- Story event / symptoms: A chain of merchants launches identical public catalogues. Traces show repeated indexed product reads, not order writes. Prices shown while browsing may be 60 seconds old; checkout must revalidate price and stock.
- Company entering (recommended baseline): 55,000 registered users, 3 engineers; $26,500 MRR / $14,300 burn.
- Architecture entering: modular monolith, PostgreSQL, query index, connection pooler, app-fleet, indexed, pooled, portable-sessions, durable-media.
- Evidence: Catalogue read share: 92% of DB queries; Repeated keys: 90% within 60 s; DB CPU / connections: 88% / 140; Indexed query p95: 12 ms alone; 210 ms loaded.
- Root cause: A high-frequency, reusable read workload saturates aggregate DB CPU despite efficient individual queries.
- Recommended - **Cache public catalogue reads**: Use cache-aside with tenant-scoped keys, a 60-second TTL and a bounded origin fallback; keep checkout price and stock on the primary. Separate cache memory from session storage. Benefit: High reuse removes repeated DB work without moving transactional truth. Trade-off / why alternatives are weaker now: Expiry, cache outages and invalidation now need explicit behavior.
- Compromise - **Buy temporary database headroom**: Resize PostgreSQL and keep uncached catalogue reads while measuring reuse. Benefit: No new data freshness model; a valid short-term capacity choice. Trade-off / why alternatives are weaker now: A higher recurring bill buys limited headroom for a strongly repetitive workload.
- Risky - **Cache the entire checkout response**: Cache checkout totals and availability for ten minutes without primary revalidation. Benefit: Most reads become very fast while the cache is warm. Trade-off / why alternatives are weaker now: Stale price and stock can be accepted; a faster incorrect sale damages trust.
- Why appropriate now: A high-frequency, reusable read workload saturates aggregate DB CPU despite efficient individual queries. High reuse removes repeated DB work without moving transactional truth.
- Architecture change: catalogue-cache; only a selected response's actual capability is retained.
- State consequences (recommended): upfront $1,800; burn +$1,500/month; users +20,000; MRR +$8,500; engineers +0; reliability +3; trust +2; operations +1; XP 160; confidence +8. End cash $53,300, team 3.
- Alternative balance: compromise has 70% of recommended user/MRR gains, reliability +1, trust +1, confidence +3, half XP and 45% implementation cost; infrastructure-heavy alternatives pay higher burn. Risky has 30% growth, reliability −9, trust −7, operations +7, XP −30, confidence −12 and 65% implementation cost. Hiring salary obligations remain with every choice. Specific incident risks can override these values.
- Lesson: Cache only data whose reuse and freshness contract justify it.
- Previous decision link: The healthy application and media paths now allow repeated catalogue reads to reach PostgreSQL.
- Future incident link: Caching introduces stale prices and expiry bursts; stock remains authoritative at checkout.

### 08 - Yesterday’s Price

- Story event / symptoms: Merchants edit prices but shoppers still see old catalogue values. Checkout revalidates correctly, so the problem is misleading browsing rather than corrupt order totals. The new promise is visibility within five seconds.
- Company entering (recommended baseline): 75,000 registered users, 3 engineers; $35,000 MRR / $15,800 burn.
- Architecture entering: modular monolith, PostgreSQL, query index, connection pooler, app-fleet, indexed, pooled, portable-sessions, durable-media, catalogue-cache.
- Evidence: Catalogue TTL: 60 s; Edit visibility p95: 58 s; target <5 s; Checkout price mismatch accepted: 0.
- Root cause: Expiry alone cannot satisfy the tighter edit-visibility contract, and racing fills can resurrect stale values.
- Recommended - **Add versioned cache invalidation**: After commit, invalidate tenant/product keys; use version checks against late fills, a five-second TTL ceiling as the safety bound, and alert on missed invalidations. Benefit: Edits meet the five-second bound even when an invalidation fails. Trade-off / why alternatives are weaker now: More origin traffic is the price of that freshness bound; checkout still uses the primary.
- Compromise - **Bypass the catalogue cache**: Serve catalogue reads directly from a resized primary while retaining any existing cache infrastructure for later review. Benefit: Immediate reads are straightforward and remove this stale-display path. Trade-off / why alternatives are weaker now: Read capacity costs rise and the repetitive workload still reaches the DB.
- Risky - **Extend the TTL to an hour**: Reduce misses by retaining catalogue entries for an hour. Benefit: Origin load falls during steady browsing traffic. Trade-off / why alternatives are weaker now: Price edits remain invisible much longer than the merchant contract allows.
- Why appropriate now: Expiry alone cannot satisfy the tighter edit-visibility contract, and racing fills can resurrect stale values. Edits meet the five-second bound even when an invalidation fails.
- Architecture change: fresh-catalogue; only a selected response's actual capability is retained.
- State consequences (recommended): upfront $1,400; burn +$700/month; users +25,000; MRR +$10,000; engineers +0; reliability +3; trust +2; operations -1; XP 160; confidence +8. End cash $70,400, team 3.
- Alternative balance: compromise has 70% of recommended user/MRR gains, reliability +1, trust +1, confidence +3, half XP and 45% implementation cost; infrastructure-heavy alternatives pay higher burn. Risky has 30% growth, reliability −9, trust −7, operations +7, XP −30, confidence −12 and 65% implementation cost. Hiring salary obligations remain with every choice. Specific incident risks can override these values.
- Lesson: Cache invalidation is a consistency contract, including races and failed invalidations.
- Previous decision link: The cache from Level 7 intentionally allowed 60-second staleness. Without it, this is a prelaunch cache experiment, not a fictional production cache outage.
- Future incident link: More origin revalidation can expose geographic delivery cost and later expiry stampedes.

### 09 - A Storefront Across the Ocean

- Story event / symptoms: International merchants report slow first paint. A controlled page load attributes most delay to public images and versioned scripts, not personalized API responses.
- Company entering (recommended baseline): 100,000 registered users, 3 engineers; $45,000 MRR / $16,500 burn.
- Architecture entering: modular monolith, PostgreSQL, query index, connection pooler, app-fleet, indexed, pooled, portable-sessions, durable-media, catalogue-cache, fresh-catalogue.
- Evidence: Overseas page p95: 2.8 s; Origin RTT: 240 ms; Public assets / API time: 2.3 s / 180 ms.
- Root cause: Geographic distance and repeated public-asset transfer dominate page load.
- Recommended - **Put public versioned assets on a CDN**: Serve immutable public assets through an edge cache; use a durable origin, content-hashed URLs and explicit private/no-store API policies. Benefit: Nearby delivery removes repeat long-distance asset transfers. Trade-off / why alternatives are weaker now: Cache keys, invalidation and egress budgets must be monitored.
- Compromise - **Use a nearer regional asset mirror**: Replicate only public versioned assets to a second regional origin and route by geography. Benefit: A regional copy improves RTT for the new market. Trade-off / why alternatives are weaker now: Fewer edge locations and manual replication/routing cost more operational effort.
- Risky - **Cache all responses by URL at the edge**: Apply a shared URL-only cache policy to storefront and authenticated dashboard routes. Benefit: A broad hit rate reduces requests to the origin. Trade-off / why alternatives are weaker now: Ignoring tenant and authorization context can expose private responses; public and private paths need distinct policies.
- Why appropriate now: Geographic distance and repeated public-asset transfer dominate page load. Nearby delivery removes repeat long-distance asset transfers.
- Architecture change: edge-assets, durable-media; only a selected response's actual capability is retained.
- State consequences (recommended): upfront $2,500; burn +$1,800/month; users +35,000; MRR +$12,000; engineers +0; reliability +3; trust +2; operations +1; XP 160; confidence +8. End cash $94,600, team 3.
- Alternative balance: compromise has 70% of recommended user/MRR gains, reliability +1, trust +1, confidence +3, half XP and 45% implementation cost; infrastructure-heavy alternatives pay higher burn. Risky has 30% growth, reliability −9, trust −7, operations +7, XP −30, confidence −12 and 65% implementation cost. Hiring salary obligations remain with every choice. Specific incident risks can override these values.
- Lesson: Edge delivery improves cacheable content; it does not make private APIs safe to cache.
- Previous decision link: Durable media from Level 6 gives the delivery layer a stable origin. Local-media branches must migrate that origin first.
- Future incident link: Fast public pages expose automated scraping and bursty origin traffic.

### 10 - The Scraper Next Door

- Story event / symptoms: A single API tenant’s integration retries a catalogue import without pacing. Its authenticated requests consume most application slots and delay unrelated merchants. Cartline recruits an integration engineer.
- Company entering (recommended baseline): 135,000 registered users, 3 engineers; $57,000 MRR / $18,300 burn.
- Architecture entering: modular monolith, PostgreSQL, query index, connection pooler, app-fleet, indexed, pooled, portable-sessions, durable-media, catalogue-cache, fresh-catalogue, edge-assets.
- Evidence: One tenant / origin traffic: 68% of 650 RPS; Other tenants p95: 1.9 s; DB CPU: 48%; Import concurrency / tenant: 240.
- Root cause: Unbounded per-tenant admission allows one caller to consume shared request capacity.
- Recommended - **Enforce tenant quotas and fair concurrency**: Apply authenticated tenant token buckets and concurrency caps at ingress, return 429 with Retry-After, and reserve checkout capacity. Hire an integration engineer. Benefit: A noisy tenant cannot monopolize all app slots. Trade-off / why alternatives are weaker now: Limits need contractual tiers and monitoring so legitimate imports can adapt.
- Compromise - **Negotiate a temporary client throttle**: Cap the offending integration client and monitor its compliance; hire an integration engineer. Benefit: A cooperative customer can restore service quickly with little infrastructure. Trade-off / why alternatives are weaker now: Protection depends on every client honoring the agreement; new callers can repeat the incident.
- Risky - **Block the shared IP range**: Apply a coarse IP deny rule covering the noisy client’s outbound range. Hire an integration engineer. Benefit: The immediate traffic source is cheap to block. Trade-off / why alternatives are weaker now: Merchants behind the same NAT lose service, and rotating IPs evade the policy.
- Why appropriate now: Unbounded per-tenant admission allows one caller to consume shared request capacity. A noisy tenant cannot monopolize all app slots.
- Architecture change: tenant-limits; only a selected response's actual capability is retained.
- State consequences (recommended): upfront $2,600; burn +$6,800/month; users +40,000; MRR +$15,000; engineers +1; reliability +3; trust +2; operations -2; XP 160; confidence +8. End cash $123,900, team 4.
- Alternative balance: compromise has 70% of recommended user/MRR gains, reliability +1, trust +1, confidence +3, half XP and 45% implementation cost; infrastructure-heavy alternatives pay higher burn. Risky has 30% growth, reliability −9, trust −7, operations +7, XP −30, confidence −12 and 65% implementation cost. Hiring salary obligations remain with every choice. Specific incident risks can override these values.
- Lesson: Fair admission is part of availability; quota scope matters.
- Previous decision link: Faster delivery attracts integrations; private API requests still reach shared application capacity.
- Future incident link: Legitimate bursts still require capacity planning rather than blanket rejection.

### 11 - Capacity Arrives Too Late

- Story event / symptoms: Promotions now start on a known schedule. App CPU rises before new hosts finish booting, even though PostgreSQL has spare capacity. A load test has established the request budget per instance.
- Company entering (recommended baseline): 175,000 registered users, 4 engineers; $72,000 MRR / $25,100 burn.
- Architecture entering: modular monolith, PostgreSQL, query index, connection pooler, app-fleet, indexed, pooled, portable-sessions, durable-media, catalogue-cache, fresh-catalogue, edge-assets, tenant-limits.
- Evidence: App CPU at kickoff: 97%; Ready time / spike ramp: 4 min / 40 s; DB CPU / pool wait: 51% / 8 ms; Per-instance safe load: 80 RPS at target p95.
- Root cause: Reactive capacity arrives later than the burst, and unconstrained scale-out could exhaust the database pool.
- Recommended - **Prewarm a bounded app fleet**: Schedule minimum capacity ahead of campaigns; autoscale on saturation and queueing with readiness checks, scale-in draining and an aggregate DB connection budget. Benefit: Capacity is ready before the known ramp and remains bounded by downstream limits. Trade-off / why alternatives are weaker now: Warm headroom costs money while idle; load tests must be kept current.
- Compromise - **Keep peak capacity running all month**: Provision a fixed fleet sized from the load test and retain it between events. Benefit: Simple operations and immediate capacity are technically sound. Trade-off / why alternatives are weaker now: Most of the monthly capacity sits idle; cash funds predictable peaks inefficiently.
- Risky - **Scale on CPU with no upper bound**: Launch hosts only after CPU crosses 95%, without a shared DB connection budget. Benefit: Scaling follows observed application utilization. Trade-off / why alternatives are weaker now: Boot delay misses the burst and the enlarged fleet can overwhelm downstream resources.
- Why appropriate now: Reactive capacity arrives later than the burst, and unconstrained scale-out could exhaust the database pool. Capacity is ready before the known ramp and remains bounded by downstream limits.
- Architecture change: app-fleet, portable-sessions, durable-media, bounded-autoscale; only a selected response's actual capability is retained.
- State consequences (recommended): upfront $3,200; burn +$3,000/month; users +50,000; MRR +$18,000; engineers +0; reliability +3; trust +2; operations +1; XP 160; confidence +8. End cash $164,600, team 4.
- Alternative balance: compromise has 70% of recommended user/MRR gains, reliability +1, trust +1, confidence +3, half XP and 45% implementation cost; infrastructure-heavy alternatives pay higher burn. Risky has 30% growth, reliability −9, trust −7, operations +7, XP −30, confidence −12 and 65% implementation cost. Hiring salary obligations remain with every choice. Specific incident risks can override these values.
- Lesson: Autoscaling needs lead time, bounded downstream budgets and evidence from load tests.
- Previous decision link: Rate limiting protects fairness but cannot manufacture capacity for legitimate demand.
- Future incident link: A fleet that survives CPU bursts can still synchronize cache misses.

### 12 - Everyone Misses Together

- Story event / symptoms: A celebrity merchant’s catalogue is requested 600 times/s. Many cache entries expire together; a slow fill overlaps hundreds of requests. The app fleet is healthy between expiry waves.
- Company entering (recommended baseline): 225,000 registered users, 4 engineers; $90,000 MRR / $28,100 burn.
- Architecture entering: modular monolith, PostgreSQL, query index, connection pooler, app-fleet, indexed, pooled, portable-sessions, durable-media, catalogue-cache, fresh-catalogue, edge-assets, tenant-limits, bounded-autoscale.
- Evidence: Cache hit rate: 96% → 18% at expiry; Origin reads during fill: 600/s for one hot key; Fill duration / DB CPU: 900 ms / 93%.
- Root cause: Concurrent cache misses duplicate origin work; synchronized expiry creates a thundering herd.
- Recommended - **Coalesce fills and spread expirations**: Allow one bounded fill per tenant/key, jitter TTLs, limit origin concurrency and serve stale public descriptions only within a defined window. Price/stock still revalidate at checkout. Benefit: A popular key causes one fill instead of hundreds. Trade-off / why alternatives are weaker now: Locks need expiry and failure handling; freshness-critical fields cannot use unbounded stale fallback.
- Compromise - **Prewarm known campaign catalogues**: Warm scheduled campaign keys gradually before their TTLs expire and retain a bounded fallback. Benefit: Known events avoid most cold misses with a small implementation. Trade-off / why alternatives are weaker now: Unscheduled hot keys and failed refreshes can still cause a herd.
- Risky - **Add a larger cache node only**: Increase memory while retaining simultaneous TTL expiry and uncoordinated fills. Benefit: More cold catalogue keys can remain resident. Trade-off / why alternatives are weaker now: Capacity does not prevent hundreds of concurrent misses for the same expired key.
- Why appropriate now: Concurrent cache misses duplicate origin work; synchronized expiry creates a thundering herd. A popular key causes one fill instead of hundreds.
- Architecture change: catalogue-cache, cache-coalescing; only a selected response's actual capability is retained.
- State consequences (recommended): upfront $3,500; burn +$5,000/month; users +55,000; MRR +$22,000; engineers +1; reliability +3; trust +2; operations -1; XP 180; confidence +8. End cash $218,000, team 5.
- Alternative balance: compromise has 70% of recommended user/MRR gains, reliability +1, trust +1, confidence +3, half XP and 45% implementation cost; infrastructure-heavy alternatives pay higher burn. Risky has 30% growth, reliability −9, trust −7, operations +7, XP −30, confidence −12 and 65% implementation cost. Hiring salary obligations remain with every choice. Specific incident risks can override these values.
- Lesson: Coalesce expensive work and bound staleness rather than merely making caches bigger.
- Previous decision link: The TTL strategy from Levels 7–8 creates expiry waves. With caching bypassed, the incident instead shows repeated reads before installing a bounded cache.
- Future incident link: The read path has headroom; synchronous post-order side effects become the next latency problem.

### 13 - The Receipt Holds the Checkout

- Story event / symptoms: A successful order waits for invoice rendering and an email API before the buyer sees confirmation. Byte’s trace separates the durable order transaction from non-critical side effects.
- Company entering (recommended baseline): 280,000 registered users, 5 engineers; $112,000 MRR / $33,100 burn.
- Architecture entering: modular monolith, PostgreSQL, query index, connection pooler, app-fleet, indexed, pooled, portable-sessions, durable-media, catalogue-cache, fresh-catalogue, edge-assets, tenant-limits, bounded-autoscale, cache-coalescing.
- Evidence: Checkout p95: 3.4 s; Order transaction p95: 90 ms; Invoice + email span: 2.9 s.
- Root cause: Non-critical synchronous work extends the checkout critical path.
- Recommended - **Queue invoices and receipts**: Commit the order first, enqueue a durable job, and return the order ID. Reconcile orders missing a job until a transactional handoff is introduced; keep payment authorization synchronous. Benefit: Checkout no longer waits for PDF or mail work; workers scale separately. Trade-off / why alternatives are weaker now: A commit/publish gap remains under reconciliation, and workers need retry and duplicate handling.
- Compromise - **Keep synchronous work with a strict deadline**: Keep receipts inline with provider timeouts and a persisted reconciliation task for deferred failures. Benefit: Less infrastructure and bounded request time can work at modest volume. Trade-off / why alternatives are weaker now: App slots still wait on I/O; the deadline does not make slow work finish faster.
- Risky - **Spawn a process after returning HTTP 200**: Fire off invoice work in local process memory with no durable job record. Benefit: The buyer sees a quick response with minimal implementation. Trade-off / why alternatives are weaker now: Host termination or deploys can lose receipts; response success does not establish durable handoff.
- Why appropriate now: Non-critical synchronous work extends the checkout critical path. Checkout no longer waits for PDF or mail work; workers scale separately.
- Architecture change: job-queue; only a selected response's actual capability is retained.
- State consequences (recommended): upfront $4,500; burn +$3,500/month; users +60,000; MRR +$24,000; engineers +0; reliability +3; trust +2; operations +1; XP 180; confidence +8. End cash $288,900, team 5.
- Alternative balance: compromise has 70% of recommended user/MRR gains, reliability +1, trust +1, confidence +3, half XP and 45% implementation cost; infrastructure-heavy alternatives pay higher burn. Risky has 30% growth, reliability −9, trust −7, operations +7, XP −30, confidence −12 and 65% implementation cost. Hiring salary obligations remain with every choice. Specific incident risks can override these values.
- Lesson: Move deferrable work behind a durable handoff; asynchronous does not mean unreliable.
- Previous decision link: Read delivery is fast enough for checkout side effects to dominate.
- Future incident link: At-least-once delivery will expose duplicate execution; a crash between commit and publish will later expose a dual-write gap.

### 14 - Two Receipts for One Order

- Story event / symptoms: A receipt worker crashes after the provider accepted the request but before the queue acknowledgement. The broker redelivers it. Merchants report duplicate invoices in an integration that supports idempotency keys.
- Company entering (recommended baseline): 340,000 registered users, 5 engineers; $136,000 MRR / $36,600 burn.
- Architecture entering: modular monolith, PostgreSQL, query index, connection pooler, app-fleet, indexed, pooled, portable-sessions, durable-media, catalogue-cache, fresh-catalogue, edge-assets, tenant-limits, bounded-autoscale, cache-coalescing, job-queue.
- Evidence: Redelivered jobs: 1.8%; Duplicate side effects: 1.6%; Crash window: after effect; before ack.
- Root cause: At-least-once processing repeats an externally committed effect when acknowledgement is lost.
- Recommended - **Use durable idempotency keys**: Use tenant/order/action keys, unique invoice records and provider-side idempotency; retain keys beyond the retry horizon and reconcile ambiguous responses. Benefit: Repeated attempts return the same logical invoice without duplicating the supported provider action. Trade-off / why alternatives are weaker now: Keys need retention and parameter validation; arbitrary email providers cannot promise exactly-once delivery.
- Compromise - **Quarantine ambiguous attempts for review**: Persist uncertain results and reconcile provider receipts before a human-approved retry. Benefit: Avoids blind duplication even without provider idempotency. Trade-off / why alternatives are weaker now: Manual review delays receipts and raises support cost.
- Risky - **Acknowledge before performing the action**: Remove the queue message before sending the invoice. Benefit: A crash after acknowledgement will not trigger redelivery. Trade-off / why alternatives are weaker now: A crash before the effect now loses work permanently; duplicates became omissions.
- Why appropriate now: At-least-once processing repeats an externally committed effect when acknowledgement is lost. Repeated attempts return the same logical invoice without duplicating the supported provider action.
- Architecture change: idempotent-effects; only a selected response's actual capability is retained.
- State consequences (recommended): upfront $4,000; burn +$2,500/month; users +60,000; MRR +$28,000; engineers +0; reliability +3; trust +2; operations -1; XP 180; confidence +8. End cash $381,800, team 5.
- Alternative balance: compromise has 70% of recommended user/MRR gains, reliability +1, trust +1, confidence +3, half XP and 45% implementation cost; infrastructure-heavy alternatives pay higher burn. Risky has 30% growth, reliability −9, trust −7, operations +7, XP −30, confidence −12 and 65% implementation cost. Hiring salary obligations remain with every choice. Specific incident risks can override these values.
- Lesson: Deduplication must cover the side effect, not just the queue message.
- Previous decision link: Level 13 introduced durable work; the synchronous branch reproduces the same ambiguity through a timeout-and-retry rehearsal.
- Future incident link: Safe retries still need pacing when a downstream provider is overloaded.

### 15 - Retrying the Provider to Death

- Story event / symptoms: The webhook destination returns 429 for two minutes. All workers immediately retry. Success at the provider is normal once requests fit its documented quota.
- Company entering (recommended baseline): 400,000 registered users, 5 engineers; $164,000 MRR / $39,100 burn.
- Architecture entering: modular monolith, PostgreSQL, query index, connection pooler, app-fleet, indexed, pooled, portable-sessions, durable-media, catalogue-cache, fresh-catalogue, edge-assets, tenant-limits, bounded-autoscale, cache-coalescing, job-queue, idempotent-effects.
- Evidence: Provider quota: 200 attempts/s; Attempts / useful completions: 1,800/s / 80/s; Retry share: 89%.
- Root cause: Immediate retries amplify a temporary quota failure and synchronize worker traffic.
- Recommended - **Budget retries with exponential backoff**: Respect Retry-After, use exponential backoff with jitter and a retry horizon, enforce a provider-wide token budget, and keep stable idempotency keys. Benefit: The provider can recover without another synchronized storm. Trade-off / why alternatives are weaker now: Some callbacks arrive later; expiry and oldest-job age need visibility.
- Compromise - **Pause delivery and drain manually**: Stop this destination queue, wait for quota recovery, then restart with a fixed low concurrency. Benefit: An operator can restore a small incident predictably. Trade-off / why alternatives are weaker now: Manual intervention does not scale across many destinations and recovery can be slow.
- Risky - **Double the webhook workers**: Raise concurrency and keep immediate retries on every 429. Benefit: More workers can help when worker CPU is truly saturated. Trade-off / why alternatives are weaker now: Here they send more attempts into the same provider quota and increase backlog.
- Why appropriate now: Immediate retries amplify a temporary quota failure and synchronize worker traffic. The provider can recover without another synchronized storm.
- Architecture change: bounded-retries; only a selected response's actual capability is retained.
- State consequences (recommended): upfront $4,500; burn +$6,000/month; users +70,000; MRR +$31,000; engineers +1; reliability +3; trust +2; operations -2; XP 180; confidence +8. End cash $496,200, team 6.
- Alternative balance: compromise has 70% of recommended user/MRR gains, reliability +1, trust +1, confidence +3, half XP and 45% implementation cost; infrastructure-heavy alternatives pay higher burn. Risky has 30% growth, reliability −9, trust −7, operations +7, XP −30, confidence −12 and 65% implementation cost. Hiring salary obligations remain with every choice. Specific incident risks can override these values.
- Lesson: Retries consume capacity; budget them and add jitter.
- Previous decision link: Idempotency makes repeating an operation safe for correctness, not free for capacity.
- Future incident link: Bounded retries will reveal permanently malformed jobs needing quarantine.

### 16 - One Message Never Finishes

- Story event / symptoms: A malformed merchant event fails validation on every attempt. It repeatedly consumes the front of one tenant’s ordered work stream, delaying valid receipts.
- Company entering (recommended baseline): 470,000 registered users, 6 engineers; $195,000 MRR / $45,100 burn.
- Architecture entering: modular monolith, PostgreSQL, query index, connection pooler, app-fleet, indexed, pooled, portable-sessions, durable-media, catalogue-cache, fresh-catalogue, edge-assets, tenant-limits, bounded-autoscale, cache-coalescing, job-queue, idempotent-effects, bounded-retries.
- Evidence: Same event failures: 46 attempts; Oldest valid job: 38 min; Worker CPU: 27%.
- Root cause: A permanent payload error cannot be repaired by time or additional retry capacity.
- Recommended - **Quarantine with a dead-letter queue**: Classify permanent failures, send exhausted jobs plus error metadata to a restricted DLQ, alert an owner and replay only after repair with original idempotency keys. Benefit: Healthy work progresses while failed work remains inspectable. Trade-off / why alternatives are weaker now: Moving an ordered event aside creates a gap; dependent events must pause or reconcile before replay.
- Compromise - **Park the entire tenant stream**: Stop only the affected tenant’s stream and assign a repair owner with a deadline. Benefit: Strict dependent ordering is preserved without losing messages. Trade-off / why alternatives are weaker now: All that tenant’s deliveries wait for manual repair, even independent ones.
- Risky - **Keep retrying until success**: Remove retry limits to avoid admitting any failed delivery. Benefit: Transient errors sometimes recover without intervention. Trade-off / why alternatives are weaker now: A malformed payload remains malformed and blocks useful work indefinitely.
- Why appropriate now: A permanent payload error cannot be repaired by time or additional retry capacity. Healthy work progresses while failed work remains inspectable.
- Architecture change: dead-letter; only a selected response's actual capability is retained.
- State consequences (recommended): upfront $4,500; burn +$2,500/month; users +80,000; MRR +$35,000; engineers +0; reliability +3; trust +2; operations -1; XP 180; confidence +8. End cash $639,100, team 6.
- Alternative balance: compromise has 70% of recommended user/MRR gains, reliability +1, trust +1, confidence +3, half XP and 45% implementation cost; infrastructure-heavy alternatives pay higher burn. Risky has 30% growth, reliability −9, trust −7, operations +7, XP −30, confidence −12 and 65% implementation cost. Hiring salary obligations remain with every choice. Specific incident risks can override these values.
- Lesson: Quarantine poison work with evidence and a safe replay path.
- Previous decision link: Retries from Level 15 reveal the difference between transient and permanent errors.
- Future incident link: Quarantine creates an operational backlog; events can still be missing before they ever enter the queue.

### 17 - Paid Order, Missing Event

- Story event / symptoms: A deploy terminates a process after its order transaction commits but before the notification publish. The reconciliation report finds paid orders with no receipt job.
- Company entering (recommended baseline): 550,000 registered users, 6 engineers; $230,000 MRR / $47,600 burn.
- Architecture entering: modular monolith, PostgreSQL, query index, connection pooler, app-fleet, indexed, pooled, portable-sessions, durable-media, catalogue-cache, fresh-catalogue, edge-assets, tenant-limits, bounded-autoscale, cache-coalescing, job-queue, idempotent-effects, bounded-retries, dead-letter.
- Evidence: Committed orders without jobs: 0.4%; Broker availability: 99.99%; Crash boundary: commit → publish.
- Root cause: Two independent writes are not atomic; a healthy broker cannot receive a publish that never occurred.
- Recommended - **Write an outbox in the order transaction**: Insert order and event into the same PostgreSQL transaction, relay committed events with retries, keep per-order sequence numbers and monitor outbox age. Benefit: Committed orders always have a durable delivery intent. Trade-off / why alternatives are weaker now: The relay may publish duplicates; consumers still need idempotency and retained event IDs.
- Compromise - **Keep reconciliation as the delivery source**: Poll committed orders missing delivery records with stable idempotency keys and a two-minute lag budget. Benefit: A durable, simpler recovery loop can work without a separate broker. Trade-off / why alternatives are weaker now: Higher polling load and bounded delay weaken the enterprise five-second delivery target.
- Risky - **Publish first, then commit the order**: Send the event before attempting the order transaction. Benefit: No committed order waits for a later publish call in the normal path. Trade-off / why alternatives are weaker now: A rolled-back transaction can leave a phantom order event; the inconsistency changed direction.
- Why appropriate now: Two independent writes are not atomic; a healthy broker cannot receive a publish that never occurred. Committed orders always have a durable delivery intent.
- Architecture change: outbox, job-queue; only a selected response's actual capability is retained.
- State consequences (recommended): upfront $6,500; burn +$3,500/month; users +100,000; MRR +$40,000; engineers +0; reliability +3; trust +2; operations +1; XP 180; confidence +8. End cash $811,500, team 6.
- Alternative balance: compromise has 70% of recommended user/MRR gains, reliability +1, trust +1, confidence +3, half XP and 45% implementation cost; infrastructure-heavy alternatives pay higher burn. Risky has 30% growth, reliability −9, trust −7, operations +7, XP −30, confidence −12 and 65% implementation cost. Hiring salary obligations remain with every choice. Specific incident risks can override these values.
- Lesson: Transactional outbox closes a dual-write gap but still needs idempotent consumers.
- Previous decision link: Level 13’s temporary reconciliation exposes its commit/publish gap. A durable local job branch can reuse its transaction instead.
- Future incident link: Reliable delivery increases worker traffic; isolated queues and backpressure become necessary.

### 18 - The Import Ate the Receipts

- Story event / symptoms: A merchant imports 100,000 images into the same worker pool as receipts. The queue is durable but normal receipts now wait behind slow media jobs. Two engineers join to own integrations and operations.
- Company entering (recommended baseline): 650,000 registered users, 6 engineers; $270,000 MRR / $51,100 burn.
- Architecture entering: modular monolith, PostgreSQL, query index, connection pooler, app-fleet, indexed, pooled, portable-sessions, durable-media, catalogue-cache, fresh-catalogue, edge-assets, tenant-limits, bounded-autoscale, cache-coalescing, job-queue, idempotent-effects, bounded-retries, dead-letter, outbox.
- Evidence: Receipt age: 23 min; target <30 s; Media work / worker time: 94%; DB CPU: 43%.
- Root cause: A shared FIFO and concurrency pool let long bulk jobs starve latency-sensitive work.
- Recommended - **Separate work classes and bound admission**: Give receipts reserved concurrency; route media/imports to bounded pools, cap tenant backlog, track age and apply backpressure to imports. Hire two owners. Benefit: Latency-sensitive jobs retain capacity during bulk imports. Trade-off / why alternatives are weaker now: Separate queues need scheduling and operational ownership; more concurrency must respect DB and provider limits.
- Compromise - **Schedule all imports overnight**: Reserve daytime workers for receipts and process imports in a published off-peak window. Hire two owners. Benefit: A simple schedule meets receipt latency without many queues. Trade-off / why alternatives are weaker now: International merchants lack a universal night; imports have a longer turnaround contract.
- Risky - **Let autoscaling chase total queue depth**: Add unlimited workers based only on message count. Hire two owners. Benefit: A homogeneous CPU-bound queue could drain faster this way. Trade-off / why alternatives are weaker now: Slow jobs hide in the count and workers can overwhelm database/provider budgets.
- Why appropriate now: A shared FIFO and concurrency pool let long bulk jobs starve latency-sensitive work. Latency-sensitive jobs retain capacity during bulk imports.
- Architecture change: isolated-workers; only a selected response's actual capability is retained.
- State consequences (recommended): upfront $7,500; burn +$14,000/month; users +110,000; MRR +$45,000; engineers +2; reliability +3; trust +2; operations -2; XP 200; confidence +8. End cash $1,008,900, team 8.
- Alternative balance: compromise has 70% of recommended user/MRR gains, reliability +1, trust +1, confidence +3, half XP and 45% implementation cost; infrastructure-heavy alternatives pay higher burn. Risky has 30% growth, reliability −9, trust −7, operations +7, XP −30, confidence −12 and 65% implementation cost. Hiring salary obligations remain with every choice. Specific incident risks can override these values.
- Lesson: Queues need class isolation, backpressure and bounded admission.
- Previous decision link: Durable jobs and retries preserve work but do not guarantee fair scheduling.
- Future incident link: Reliable async work expands merchant adoption and produces more personalized database reads.

### 19 - Every Merchant Has a Dashboard

- Story event / symptoms: Personalized reports have low cross-user reuse. Query plans and indexes have been checked, but reads dominate primary CPU. These reports can tolerate five seconds of lag; checkout cannot.
- Company entering (recommended baseline): 760,000 registered users, 8 engineers; $315,000 MRR / $65,100 burn.
- Architecture entering: modular monolith, PostgreSQL, query index, connection pooler, app-fleet, indexed, pooled, portable-sessions, durable-media, catalogue-cache, fresh-catalogue, edge-assets, tenant-limits, bounded-autoscale, cache-coalescing, job-queue, idempotent-effects, bounded-retries, dead-letter, outbox, isolated-workers.
- Evidence: DB read/write mix: 88% / 12%; Primary CPU / write p95: 91% / 95 ms; Report cache reuse: 8%; Reads / writes: 9,000 / 1,200 QPS.
- Root cause: Efficient but numerous lag-tolerant reads compete with transactions on the primary.
- Recommended - **Route tolerant reports to a read replica**: Add an asynchronous PostgreSQL reader, measure replay lag, route only tolerant reports, and keep transactions and immediate confirmations on the primary. Benefit: Offloads read CPU while retaining one authoritative write path. Trade-off / why alternatives are weaker now: Replica capacity, lag-aware routing and bounded primary fallback add operational cost.
- Compromise - **Resize the primary for report headroom**: Use a larger primary while enforcing query deadlines and keeping all reads current. Benefit: No read-consistency routing is needed today. Trade-off / why alternatives are weaker now: An expensive single machine has finite CPU; maintenance shares the write failure domain.
- Risky - **Send checkout writes to read replicas**: Create replicas and round-robin inserts across them. Benefit: Multiple independent writers could scale writes in a different database design. Trade-off / why alternatives are weaker now: Physical hot standbys are read-only; promoting independent writers does not synchronize concurrent updates.
- Why appropriate now: Efficient but numerous lag-tolerant reads compete with transactions on the primary. Offloads read CPU while retaining one authoritative write path.
- Architecture change: read-replicas; only a selected response's actual capability is retained.
- State consequences (recommended): upfront $9,000; burn +$6,500/month; users +140,000; MRR +$50,000; engineers +0; reliability +3; trust +2; operations +1; XP 200; confidence +8. End cash $1,243,300, team 8.
- Alternative balance: compromise has 70% of recommended user/MRR gains, reliability +1, trust +1, confidence +3, half XP and 45% implementation cost; infrastructure-heavy alternatives pay higher burn. Risky has 30% growth, reliability −9, trust −7, operations +7, XP −30, confidence −12 and 65% implementation cost. Hiring salary obligations remain with every choice. Specific incident risks can override these values.
- Lesson: Read replicas scale eligible reads, not write throughput.
- Previous decision link: Caching public data and separating jobs leaves personalized reports as the dominant primary workload.
- Future incident link: Replica lag will become visible when a newly created order is routed to a stale reader.

### 20 - The Order That Disappeared

- Story event / symptoms: The mobile launch routes a post-checkout order lookup to a lagging replica despite the primary-only confirmation policy. The order appears seconds later, and some buyers retry.
- Company entering (recommended baseline): 900,000 registered users, 8 engineers; $365,000 MRR / $71,600 burn.
- Architecture entering: modular monolith, PostgreSQL, query index, connection pooler, app-fleet, indexed, pooled, portable-sessions, durable-media, catalogue-cache, fresh-catalogue, edge-assets, tenant-limits, bounded-autoscale, cache-coalescing, job-queue, idempotent-effects, bounded-retries, dead-letter, outbox, isolated-workers, read-replicas.
- Evidence: Replay lag p95 / p99: 1.8 s / 4.2 s; Post-checkout lookup: reader route; Primary commit failures: 0%.
- Root cause: A read-after-write workflow was incorrectly classified as lag tolerant.
- Recommended - **Route critical reads by consistency need**: Keep checkout confirmations and immediate order lookups on the primary; use a commit token for subsequent replica reads with a bounded wait and controlled primary fallback. Benefit: Read-after-write works without forcing every report to be synchronous. Trade-off / why alternatives are weaker now: Primary fallback requires a budget; routing rules must follow the user journey.
- Compromise - **Return all reads to the primary**: Disable reader routing and resize the primary for the mixed workload. Benefit: A single read source gives straightforward visibility semantics. Trade-off / why alternatives are weaker now: Reports again consume write-tier headroom and raise infrastructure spend.
- Risky - **Sleep one second before the lookup**: Delay the client before issuing the same replica read. Benefit: A delay can hide some short replication gaps. Trade-off / why alternatives are weaker now: Observed lag exceeds one second, so elapsed time is not a consistency guarantee.
- Why appropriate now: A read-after-write workflow was incorrectly classified as lag tolerant. Read-after-write works without forcing every report to be synchronous.
- Architecture change: consistent-reads; only a selected response's actual capability is retained.
- State consequences (recommended): upfront $8,000; burn +$5,500/month; users +150,000; MRR +$55,000; engineers +0; reliability +3; trust +2; operations -1; XP 200; confidence +8. End cash $1,523,200, team 8.
- Alternative balance: compromise has 70% of recommended user/MRR gains, reliability +1, trust +1, confidence +3, half XP and 45% implementation cost; infrastructure-heavy alternatives pay higher burn. Risky has 30% growth, reliability −9, trust −7, operations +7, XP −30, confidence −12 and 65% implementation cost. Hiring salary obligations remain with every choice. Specific incident risks can override these values.
- Lesson: Consistency belongs to a workflow, not a blanket database label.
- Previous decision link: Level 19 introduced asynchronous readers. A primary-only branch tests the proposed mobile routing before launch.
- Future incident link: Primary routing fixes visibility but primary availability still needs a failover contract.

### 21 - A Zone Goes Dark

- Story event / symptoms: An availability-zone failure takes out the primary. Enterprise merchants require no loss of acknowledged orders for a single-zone failure and recovery within two minutes. The rehearsal shows asynchronous readers alone do not satisfy that promise.
- Company entering (recommended baseline): 1,050,000 registered users, 8 engineers; $420,000 MRR / $77,100 burn.
- Architecture entering: modular monolith, PostgreSQL, query index, connection pooler, app-fleet, indexed, pooled, portable-sessions, durable-media, catalogue-cache, fresh-catalogue, edge-assets, tenant-limits, bounded-autoscale, cache-coalescing, job-queue, idempotent-effects, bounded-retries, dead-letter, outbox, isolated-workers, read-replicas, consistent-reads.
- Evidence: Failover drill: 18 min; Async replay gap: 2 s; Zone-failure contract: RPO 0; RTO 2 min.
- Root cause: Capacity replicas are not automatically a fenced, synchronous high-availability system.
- Recommended - **Build tested multi-AZ failover**: Use a synchronous cross-AZ standby for acknowledged commits, a quorum/fenced writer election, multi-AZ app and queue placement, and rehearse reconnects. Stop writes if durability quorum is lost. Hire two reliability engineers. Benefit: The specified single-zone failure can meet RPO 0 and the measured two-minute RTO. Trade-off / why alternatives are weaker now: Synchronous acknowledgement adds intra-region latency and may sacrifice write availability when quorum is unavailable.
- Compromise - **Use asynchronous failover with a revised SLA**: Fence the old primary and promote an asynchronous standby; explicitly negotiate a five-second loss budget before selling that tier. Hire two engineers. Benefit: Lower commit latency and cost are viable when the customer accepts possible loss. Trade-off / why alternatives are weaker now: It does not satisfy the original RPO-zero contract, so the premium launch is delayed.
- Risky - **Promote on a heartbeat timeout alone**: Let either database promote itself when it cannot contact the other. Hire two engineers. Benefit: Promotion is fast during a simple host failure. Trade-off / why alternatives are weaker now: A network partition can leave two writers without fencing, violating order consistency.
- Why appropriate now: Capacity replicas are not automatically a fenced, synchronous high-availability system. The specified single-zone failure can meet RPO 0 and the measured two-minute RTO.
- Architecture change: multi-az; only a selected response's actual capability is retained.
- State consequences (recommended): upfront $16,000; burn +$20,000/month; users +150,000; MRR +$60,000; engineers +2; reliability +3; trust +2; operations +2; XP 200; confidence +8. End cash $1,830,100, team 10.
- Alternative balance: compromise has 70% of recommended user/MRR gains, reliability +1, trust +1, confidence +3, half XP and 45% implementation cost; infrastructure-heavy alternatives pay higher burn. Risky has 30% growth, reliability −9, trust −7, operations +7, XP −30, confidence −12 and 65% implementation cost. Hiring salary obligations remain with every choice. Specific incident risks can override these values.
- Lesson: Define the failure domain and acknowledgement policy before promising RPO zero.
- Previous decision link: Primary-based correctness from Level 20 makes primary failover critical.
- Future incident link: Replication also copies accidental deletes; the next drill tests restoration, not failover.

### 22 - The Delete Reached Every Replica

- Story event / symptoms: A faulty maintenance command removes an hour of order records. Replicas faithfully apply the deletion. The nightly backup is 19 hours old; the business accepts at most five minutes of recovery-point loss and a one-hour restore.
- Company entering (recommended baseline): 1,200,000 registered users, 10 engineers; $480,000 MRR / $97,100 burn.
- Architecture entering: modular monolith, PostgreSQL, query index, connection pooler, app-fleet, indexed, pooled, portable-sessions, durable-media, catalogue-cache, fresh-catalogue, edge-assets, tenant-limits, bounded-autoscale, cache-coalescing, job-queue, idempotent-effects, bounded-retries, dead-letter, outbox, isolated-workers, read-replicas, consistent-reads, multi-az.
- Evidence: Latest snapshot age: 19 h; Deletion on replicas: yes; Recovery requirement: RPO 5 min / RTO 60 min.
- Root cause: Replication preserves availability, not independent historical recovery points.
- Recommended - **Archive WAL and rehearse point-in-time restore**: Maintain encrypted base backups and continuous WAL archives with <5-minute archive lag; restore before the bad transaction into an isolated environment, validate, fence and reconcile later legitimate orders. Benefit: A tested recovery path can undo logical corruption with explicit data reconciliation. Trade-off / why alternatives are weaker now: A point-in-time restore also omits good writes after the chosen time; recovery is not just flipping a replica.
- Compromise - **Take snapshots every hour**: Use isolated hourly snapshots and a verified restore runbook, negotiating the longer loss window. Benefit: Simple snapshots recover data without relying on production replicas. Trade-off / why alternatives are weaker now: An hour between snapshots misses the required five-minute RPO.
- Risky - **Promote the fastest replica**: Switch reads and writes to the reader with the lowest lag. Benefit: Useful for a failed primary when data is healthy. Trade-off / why alternatives are weaker now: The fastest replica has already applied the deletion and cannot restore history.
- Why appropriate now: Replication preserves availability, not independent historical recovery points. A tested recovery path can undo logical corruption with explicit data reconciliation.
- Architecture change: pitr; only a selected response's actual capability is retained.
- State consequences (recommended): upfront $15,000; burn +$7,000/month; users +180,000; MRR +$65,000; engineers +0; reliability +3; trust +2; operations -1; XP 200; confidence +8. End cash $2,191,000, team 10.
- Alternative balance: compromise has 70% of recommended user/MRR gains, reliability +1, trust +1, confidence +3, half XP and 45% implementation cost; infrastructure-heavy alternatives pay higher burn. Risky has 30% growth, reliability −9, trust −7, operations +7, XP −30, confidence −12 and 65% implementation cost. Hiring salary obligations remain with every choice. Specific incident risks can override these values.
- Lesson: Backups count only when a measured restore satisfies the recovery objective.
- Previous decision link: Level 21 improved failover, which correctly reproduces logical corruption.
- Future incident link: Growing datasets require restore benchmarks and retention controls; schema changes must be staged safely.

### 23 - A Column Becomes an Outage

- Story event / symptoms: An enterprise feature adds and backfills a field on a 600-million-row order/audit dataset. A deployment combines a locking schema change, a full-table update and removal of the old API field.
- Company entering (recommended baseline): 1,380,000 registered users, 10 engineers; $545,000 MRR / $104,100 burn.
- Architecture entering: modular monolith, PostgreSQL, query index, connection pooler, app-fleet, indexed, pooled, portable-sessions, durable-media, catalogue-cache, fresh-catalogue, edge-assets, tenant-limits, bounded-autoscale, cache-coalescing, job-queue, idempotent-effects, bounded-retries, dead-letter, outbox, isolated-workers, read-replicas, consistent-reads, multi-az, pitr.
- Evidence: Lock wait p99: 11 s; DB CPU: 49%; App versions live: old + new; Backfill transaction: 45 min.
- Root cause: Long transactions and incompatible rolling changes block concurrent work; raw capacity is not the main limit.
- Recommended - **Expand, backfill, then contract**: Add compatible nullable fields, deploy dual-compatible readers/writers, backfill in checkpointed batches with lock/statement timeouts, build indexes concurrently where supported, then remove old fields after all consumers migrate. Benefit: Short controlled steps preserve mixed-version operation and allow rollback. Trade-off / why alternatives are weaker now: The migration spans releases; concurrent index builds still consume I/O and need validation.
- Compromise - **Book an enterprise maintenance window**: Pause writes, take a recovery point, run a rehearsed migration and reopen after validation. Benefit: A declared downtime window can simplify a rare incompatible change. Trade-off / why alternatives are weaker now: The enterprise availability commitment and global merchant schedules make the window expensive.
- Risky - **Increase lock timeout and run one transaction**: Let the deployment wait longer and backfill the whole table atomically. Benefit: One transaction offers a simple rollback boundary. Trade-off / why alternatives are weaker now: Locks and WAL remain unbounded for the user journey and mixed-version clients still break.
- Why appropriate now: Long transactions and incompatible rolling changes block concurrent work; raw capacity is not the main limit. Short controlled steps preserve mixed-version operation and allow rollback.
- Architecture change: safe-migrations; only a selected response's actual capability is retained.
- State consequences (recommended): upfront $14,000; burn +$16,000/month; users +180,000; MRR +$70,000; engineers +2; reliability +3; trust +2; operations -2; XP 200; confidence +8. End cash $2,601,900, team 12.
- Alternative balance: compromise has 70% of recommended user/MRR gains, reliability +1, trust +1, confidence +3, half XP and 45% implementation cost; infrastructure-heavy alternatives pay higher burn. Risky has 30% growth, reliability −9, trust −7, operations +7, XP −30, confidence −12 and 65% implementation cost. Hiring salary obligations remain with every choice. Specific incident risks can override these values.
- Lesson: Evolve schemas with overlapping compatibility and bounded migrations.
- Previous decision link: Durable order growth from earlier levels makes once-small migrations operational events.
- Future incident link: New enterprise catalogue requirements exceed the search semantics of ordinary order indexes.

### 24 - Find the Red Shoe, Not a Substring

- Story event / symptoms: Enterprise merchants need typo tolerance, relevance and multiple facets over eight million catalogue variants. An indexed PostgreSQL full-text/trigram prototype handles simple search, but the representative faceted benchmark misses the target.
- Company entering (recommended baseline): 1,560,000 registered users, 12 engineers; $615,000 MRR / $120,100 burn.
- Architecture entering: modular monolith, PostgreSQL, query index, connection pooler, app-fleet, indexed, pooled, portable-sessions, durable-media, catalogue-cache, fresh-catalogue, edge-assets, tenant-limits, bounded-autoscale, cache-coalescing, job-queue, idempotent-effects, bounded-retries, dead-letter, outbox, isolated-workers, read-replicas, consistent-reads, multi-az, pitr, safe-migrations.
- Evidence: Faceted search p95: 1.7 s; target 250 ms; Facet search / DB CPU: 64% of read CPU; Index freshness budget: 30 s.
- Root cause: The measured search workload and relevance requirements no longer fit the current transactional read path economically.
- Recommended - **Build a derived search index**: Project versioned catalogue changes into a managed search index, backfill and compare results, retain source-of-truth data in PostgreSQL and revalidate stock/price at checkout. Benefit: Search-specific indexing meets the benchmark without loading transactional reads. Trade-off / why alternatives are weaker now: The index is eventually consistent and needs replay, lag alerts and rebuild procedures.
- Compromise - **Keep PostgreSQL and reduce search scope**: Use PostgreSQL full-text/trigram indexes with fewer facets and a negotiated simpler relevance contract. Benefit: A valid, cheaper design avoids another datastore. Trade-off / why alternatives are weaker now: The enterprise search feature is reduced; the original faceted benchmark remains unmet.
- Risky - **Make search the inventory authority**: Store authoritative product stock and checkout availability only in the search index. Benefit: One query engine can serve discovery and availability lookups. Trade-off / why alternatives are weaker now: An eventually refreshed search projection cannot enforce transactional stock decrements.
- Why appropriate now: The measured search workload and relevance requirements no longer fit the current transactional read path economically. Search-specific indexing meets the benchmark without loading transactional reads.
- Architecture change: search-projection; only a selected response's actual capability is retained.
- State consequences (recommended): upfront $22,000; burn +$11,000/month; users +190,000; MRR +$75,000; engineers +0; reliability +3; trust +2; operations +1; XP 220; confidence +8. End cash $3,063,800, team 12.
- Alternative balance: compromise has 70% of recommended user/MRR gains, reliability +1, trust +1, confidence +3, half XP and 45% implementation cost; infrastructure-heavy alternatives pay higher burn. Risky has 30% growth, reliability −9, trust −7, operations +7, XP −30, confidence −12 and 65% implementation cost. Hiring salary obligations remain with every choice. Specific incident risks can override these values.
- Lesson: Use a derived specialized index when its semantics and measured workload justify it.
- Previous decision link: Outbox delivery and safe schema evolution make a rebuildable search projection practical.
- Future incident link: Search index lag and indexing bursts will require independent ownership; it must never authorize stock.

### 25 - One Domain Earns Its Own Deploy

- Story event / symptoms: Media transforms consume 72% of shared worker CPU and demand six releases a week. Orders release once a week. Cartline has a stable media boundary and can fund a four-person ownership group after hiring three more engineers.
- Company entering (recommended baseline): 1,750,000 registered users, 12 engineers; $690,000 MRR / $131,100 burn.
- Architecture entering: modular monolith, PostgreSQL, query index, connection pooler, app-fleet, indexed, pooled, portable-sessions, durable-media, catalogue-cache, fresh-catalogue, edge-assets, tenant-limits, bounded-autoscale, cache-coalescing, job-queue, idempotent-effects, bounded-retries, dead-letter, outbox, isolated-workers, read-replicas, consistent-reads, multi-az, pitr, safe-migrations, search-projection.
- Evidence: Media / worker CPU: 72%; Media/order releases: 6 / 1 per week; Cross-domain rollout incidents: 3 this month.
- Root cause: Media’s resource profile and release cadence now differ enough to justify a deployment and ownership boundary.
- Recommended - **Extract only media processing**: Give media its own deployment, queue, scoped object access and media-owned metadata; consume versioned jobs and publish completion events without reading order tables. Hire three engineers for a four-person group. Benefit: Media scales and deploys independently while orders stay in the modular core. Trade-off / why alternatives are weaker now: Service contracts, on-call ownership and independent capacity now have a recurring cost.
- Compromise - **Keep isolated media workers in the monolith repo**: Retain the shared release train but dedicate worker pools and a media owner. Hire three engineers. Benefit: Resource isolation works with fewer distributed contracts. Trade-off / why alternatives are weaker now: Release coordination remains; some media changes still wait for core releases.
- Risky - **Split every module into services now**: Create separate users, orders, billing, catalogue and media APIs in one migration. Hire three engineers. Benefit: Many domains could eventually scale independently. Trade-off / why alternatives are weaker now: Unproven boundaries and shared-database access create coordination and on-call load faster than the team can absorb.
- Why appropriate now: Media’s resource profile and release cadence now differ enough to justify a deployment and ownership boundary. Media scales and deploys independently while orders stay in the modular core.
- Architecture change: media-service; only a selected response's actual capability is retained.
- State consequences (recommended): upfront $28,000; burn +$26,000/month; users +200,000; MRR +$80,000; engineers +3; reliability +3; trust +2; operations +2; XP 220; confidence +8. End cash $3,568,700, team 15.
- Alternative balance: compromise has 70% of recommended user/MRR gains, reliability +1, trust +1, confidence +3, half XP and 45% implementation cost; infrastructure-heavy alternatives pay higher burn. Risky has 30% growth, reliability −9, trust −7, operations +7, XP −30, confidence −12 and 65% implementation cost. Hiring salary obligations remain with every choice. Specific incident risks can override these values.
- Lesson: Extract one stable domain when independent scale and ownership pay for the network boundary.
- Previous decision link: Object storage and isolated work queues already provide a narrow asynchronous media boundary.
- Future incident link: A real service boundary needs a durable contract and can fail independently.

### 26 - A Healthy Core Waiting on a Slow Edge

- Story event / symptoms: The merchant editor now waits synchronously for a thumbnail preview. During a media rollout that dependency stalls; checkout CPU is healthy but app request slots fill with waiting editor calls.
- Company entering (recommended baseline): 1,950,000 registered users, 15 engineers; $770,000 MRR / $157,100 burn.
- Architecture entering: modular monolith, PostgreSQL, query index, connection pooler, app-fleet, indexed, pooled, portable-sessions, durable-media, catalogue-cache, fresh-catalogue, edge-assets, tenant-limits, bounded-autoscale, cache-coalescing, job-queue, idempotent-effects, bounded-retries, dead-letter, outbox, isolated-workers, read-replicas, consistent-reads, multi-az, pitr, safe-migrations, search-projection, media-service.
- Evidence: Media call p99: 8 s; Waiting app slots: 92% occupied; Core CPU / DB p95: 41% / 35 ms.
- Root cause: Unbounded dependency waits consume shared capacity and spread a non-critical failure.
- Recommended - **Bound waits and show pending previews**: Apply a deadline, isolated concurrency budget and circuit breaker with limited probes; show an existing image or pending state and finish via durable jobs. Benefit: Media failure no longer consumes all application slots. Trade-off / why alternatives are weaker now: The UI must explain pending previews and recover them; a breaker does not fix the dependency itself.
- Compromise - **Remove live previews from the editor**: Keep durable background processing and notify the merchant when a preview is ready. Benefit: Eliminates the synchronous dependency with very simple operations. Trade-off / why alternatives are weaker now: A reduced editing experience costs adoption, but correctness and core availability remain intact.
- Risky - **Retry the preview three times in every layer**: Let gateway, app and media client each retry before returning failure. Benefit: A brief isolated fault may be hidden from the merchant. Trade-off / why alternatives are weaker now: Nested retries multiply attempts and hold slots longer during a sustained outage.
- Why appropriate now: Unbounded dependency waits consume shared capacity and spread a non-critical failure. Media failure no longer consumes all application slots.
- Architecture change: dependency-bulkheads; only a selected response's actual capability is retained.
- State consequences (recommended): upfront $24,000; burn +$10,000/month; users +200,000; MRR +$85,000; engineers +0; reliability +3; trust +2; operations -2; XP 220; confidence +8. End cash $4,147,600, team 15.
- Alternative balance: compromise has 70% of recommended user/MRR gains, reliability +1, trust +1, confidence +3, half XP and 45% implementation cost; infrastructure-heavy alternatives pay higher burn. Risky has 30% growth, reliability −9, trust −7, operations +7, XP −30, confidence −12 and 65% implementation cost. Hiring salary obligations remain with every choice. Specific incident risks can override these values.
- Lesson: Timeouts, bulkheads and circuit breakers bound a dependency’s blast radius.
- Previous decision link: Level 25’s extracted service exposes a network failure; a shared-worker branch has the equivalent blocking job wait.
- Future incident link: Protecting requests creates pending work whose status and schema need reliable asynchronous communication.

### 27 - One Event, Three Different Jobs

- Story event / symptoms: Search indexing, receipts and merchant analytics now share a competing-consumer queue. Engineers discover that each event goes to only one consumer rather than all interested projections.
- Company entering (recommended baseline): 2,150,000 registered users, 15 engineers; $855,000 MRR / $167,100 burn.
- Architecture entering: modular monolith, PostgreSQL, query index, connection pooler, app-fleet, indexed, pooled, portable-sessions, durable-media, catalogue-cache, fresh-catalogue, edge-assets, tenant-limits, bounded-autoscale, cache-coalescing, job-queue, idempotent-effects, bounded-retries, dead-letter, outbox, isolated-workers, read-replicas, consistent-reads, multi-az, pitr, safe-migrations, search-projection, media-service, dependency-bulkheads.
- Evidence: Consumers needing every event: 3; Each consumer sees: about 1/3; Outbox publish success: 100%.
- Root cause: A work queue distributes messages among competing consumers; it does not independently deliver every event to each subscriber.
- Recommended - **Fan out into subscriber-owned queues**: Publish outbox events through a managed topic to one durable queue per subscriber, with retention, per-subscriber DLQs and idempotent consumers. Benefit: Each projection sees each event and can fail or scale independently. Trade-off / why alternatives are weaker now: Fan-out multiplies stored work; global ordering is not promised and per-order versions need handling.
- Compromise - **Use one dispatcher with durable delivery records**: Track per-subscriber completion durably in PostgreSQL and dispatch each destination independently. Benefit: A database-backed dispatcher can supply the same logical fan-out at moderate volume. Trade-off / why alternatives are weaker now: More polling and custom dispatch logic burden the core team; it needs the same duplicate and retry discipline.
- Risky - **Add more consumers to the same queue**: Scale search, mail and analytics consumer counts on the existing work queue. Benefit: More consumers increase throughput for interchangeable workers. Trade-off / why alternatives are weaker now: They divide work further instead of ensuring all distinct subscribers receive it.
- Why appropriate now: A work queue distributes messages among competing consumers; it does not independently deliver every event to each subscriber. Each projection sees each event and can fail or scale independently.
- Architecture change: event-fanout; only a selected response's actual capability is retained.
- State consequences (recommended): upfront $28,000; burn +$23,000/month; users +200,000; MRR +$90,000; engineers +2; reliability +3; trust +2; operations +2; XP 220; confidence +8. End cash $4,784,500, team 17.
- Alternative balance: compromise has 70% of recommended user/MRR gains, reliability +1, trust +1, confidence +3, half XP and 45% implementation cost; infrastructure-heavy alternatives pay higher burn. Risky has 30% growth, reliability −9, trust −7, operations +7, XP −30, confidence −12 and 65% implementation cost. Hiring salary obligations remain with every choice. Specific incident risks can override these values.
- Lesson: Choose messaging semantics for the consumer relationship.
- Previous decision link: The queue introduced for jobs is now being reused for independent business projections.
- Future incident link: Independent subscribers deploy on different schedules and need compatible versioned contracts.

### 28 - The Field That Broke Three Teams

- Story event / symptoms: A producer replaces amount_cents with amount in decimal currency units. Old consumers accept the field but interpret the units incorrectly. Replays must still read last month’s events.
- Company entering (recommended baseline): 2,350,000 registered users, 17 engineers; $945,000 MRR / $190,100 burn.
- Architecture entering: modular monolith, PostgreSQL, query index, connection pooler, app-fleet, indexed, pooled, portable-sessions, durable-media, catalogue-cache, fresh-catalogue, edge-assets, tenant-limits, bounded-autoscale, cache-coalescing, job-queue, idempotent-effects, bounded-retries, dead-letter, outbox, isolated-workers, read-replicas, consistent-reads, multi-az, pitr, safe-migrations, search-projection, media-service, dependency-bulkheads, event-fanout.
- Evidence: Consumers upgraded: 1 of 3; Replayed event retention: 30 days; Contract checks: shape only; no unit checks.
- Root cause: An incompatible semantic change crosses independently deployed consumer versions.
- Recommended - **Evolve a versioned contract additively**: Keep amount_cents unchanged, add explicit currency and versioned new fields, run consumer-driven semantic tests and dual-read during a measured migration; retire only after retention and consumer checks. Benefit: Old and new consumers coexist and retained events remain interpretable. Trade-off / why alternatives are weaker now: Compatibility windows cost storage and engineering effort; versions do not fix meaning automatically.
- Compromise - **Coordinate a paused cutover and replay adapter**: Pause publishers, migrate every consumer and provide an adapter for retained old events before resuming. Benefit: A tightly coordinated small system can make one deliberate incompatible cutover. Trade-off / why alternatives are weaker now: All teams share a release window and downtime; independent delivery is temporarily lost.
- Risky - **Rename the field and deploy producers first**: Publish the new meaning under the old event name and rely on consumers ignoring unknown fields. Benefit: Producer work can ship quickly without a migration window. Trade-off / why alternatives are weaker now: Ignoring fields does not protect consumers from changed units or removed required data.
- Why appropriate now: An incompatible semantic change crosses independently deployed consumer versions. Old and new consumers coexist and retained events remain interpretable.
- Architecture change: versioned-events; only a selected response's actual capability is retained.
- State consequences (recommended): upfront $26,000; burn +$10,000/month; users +200,000; MRR +$95,000; engineers +0; reliability +3; trust +2; operations -2; XP 220; confidence +8. End cash $5,503,400, team 17.
- Alternative balance: compromise has 70% of recommended user/MRR gains, reliability +1, trust +1, confidence +3, half XP and 45% implementation cost; infrastructure-heavy alternatives pay higher burn. Risky has 30% growth, reliability −9, trust −7, operations +7, XP −30, confidence −12 and 65% implementation cost. Hiring salary obligations remain with every choice. Specific incident risks can override these values.
- Lesson: Event compatibility includes meaning, units, ordering and old retained data.
- Previous decision link: Level 27 gave subscribers independent deployment and replay lifecycles.
- Future incident link: More independently failing paths make correlation across logs and traces essential.

### 29 - Everything Looks Green

- Story event / symptoms: CPU dashboards are green while merchants report slow confirmations. Request IDs disappear at the outbox boundary, queue-age alarms are missing and every team blames a different component.
- Company entering (recommended baseline): 2,550,000 registered users, 17 engineers; $1,040,000 MRR / $200,100 burn.
- Architecture entering: modular monolith, PostgreSQL, query index, connection pooler, app-fleet, indexed, pooled, portable-sessions, durable-media, catalogue-cache, fresh-catalogue, edge-assets, tenant-limits, bounded-autoscale, cache-coalescing, job-queue, idempotent-effects, bounded-retries, dead-letter, outbox, isolated-workers, read-replicas, consistent-reads, multi-az, pitr, safe-migrations, search-projection, media-service, dependency-bulkheads, event-fanout, versioned-events.
- Evidence: Confirmation p99: 4.8 s; Core CPU: 46%; Trace coverage across queue: 12%; Oldest unobserved work: unknown.
- Root cause: Resource metrics alone do not explain user-visible latency across asynchronous boundaries.
- Recommended - **Instrument the end-to-end journey**: Propagate trace/event IDs with async span links, record RED metrics and queue age, correlate structured redacted logs, and page owners on multi-window error-budget burn against 99.9% monthly availability. Hire two SREs. Benefit: The team can locate latency and act on customer impact. Trade-off / why alternatives are weaker now: Sampling, retention and cardinality need budgets; telemetry must not contain payment secrets.
- Compromise - **Start with a focused synthetic journey**: Probe checkout and receipt completion, correlate order IDs in logs and page one owner. Hire two SREs. Benefit: A focused monitor detects the main customer symptom at lower instrumentation cost. Trade-off / why alternatives are weaker now: Localization across fan-out remains slower and less complete than correlated traces.
- Risky - **Alert on every host above 60% CPU**: Add per-host CPU pages and retain every log indefinitely. Hire two SREs. Benefit: Saturation incidents may become visible early. Trade-off / why alternatives are weaker now: This I/O delay is not CPU saturation; noisy alerts and unbounded retention waste attention and money.
- Why appropriate now: Resource metrics alone do not explain user-visible latency across asynchronous boundaries. The team can locate latency and act on customer impact.
- Architecture change: observability; only a selected response's actual capability is retained.
- State consequences (recommended): upfront $32,000; burn +$22,000/month; users +200,000; MRR +$100,000; engineers +2; reliability +3; trust +2; operations -4; XP 220; confidence +8. End cash $6,289,300, team 19.
- Alternative balance: compromise has 70% of recommended user/MRR gains, reliability +1, trust +1, confidence +3, half XP and 45% implementation cost; infrastructure-heavy alternatives pay higher burn. Risky has 30% growth, reliability −9, trust −7, operations +7, XP −30, confidence −12 and 65% implementation cost. Hiring salary obligations remain with every choice. Specific incident risks can override these values.
- Lesson: Observe the user journey with correlated signals and actionable ownership.
- Previous decision link: Independent workers, services and subscribers fragmented the debugging context.
- Future incident link: Traces will locate the next provider tail-latency problem and enable an SLO-based response.

### 30 - The Payment Provider’s Long Tail

- Story event / symptoms: The new traces locate checkout’s long tail in an external payment provider. Authorization often succeeds after Cartline’s caller times out. Stock reservations and payment results must remain consistent.
- Company entering (recommended baseline): 2,750,000 registered users, 19 engineers; $1,140,000 MRR / $222,100 burn.
- Architecture entering: modular monolith, PostgreSQL, query index, connection pooler, app-fleet, indexed, pooled, portable-sessions, durable-media, catalogue-cache, fresh-catalogue, edge-assets, tenant-limits, bounded-autoscale, cache-coalescing, job-queue, idempotent-effects, bounded-retries, dead-letter, outbox, isolated-workers, read-replicas, consistent-reads, multi-az, pitr, safe-migrations, search-projection, media-service, dependency-bulkheads, event-fanout, versioned-events, observability.
- Evidence: Checkout p99: 4.8 s; Core / provider p99: 180 ms / 2.7 s; Retry rate / app CPU: 31% / 49%; Eventual payment success: normal.
- Root cause: A slow but successful dependency creates ambiguous outcomes and retry amplification, not application CPU shortage.
- Recommended - **Bound authorization and reconcile pending results**: Use a stable payment-attempt key, one retry owner with a strict budget, provider bulkheads and a pending order state; reconcile webhooks/polls before retry or fulfillment and expire stock reservations safely. Benefit: Ambiguous authorization cannot trigger duplicate charges or false fulfillment. Trade-off / why alternatives are weaker now: Pending is visible to customers; a late success after reservation expiry needs refund or reallocation handling.
- Compromise - **Pause new checkout attempts during degradation**: Fail fast before starting new provider calls, keep existing attempts in reconciliation and retain carts for retry. Benefit: Simpler containment protects correctness and provider capacity. Trade-off / why alternatives are weaker now: Sales stop temporarily even when some authorizations could succeed.
- Risky - **Retry timed-out payments with new IDs**: Start a fresh payment attempt after every timeout and consider the old attempt failed. Benefit: A second attempt may respond quickly. Trade-off / why alternatives are weaker now: The first attempt may already have charged; new IDs bypass deduplication and can double-charge buyers.
- Why appropriate now: A slow but successful dependency creates ambiguous outcomes and retry amplification, not application CPU shortage. Ambiguous authorization cannot trigger duplicate charges or false fulfillment.
- Architecture change: payment-reconciliation; only a selected response's actual capability is retained.
- State consequences (recommended): upfront $30,000; burn +$14,000/month; users +200,000; MRR +$105,000; engineers +0; reliability +3; trust +2; operations -2; XP 240; confidence +8. End cash $7,163,200, team 19.
- Alternative balance: compromise has 70% of recommended user/MRR gains, reliability +1, trust +1, confidence +3, half XP and 45% implementation cost; infrastructure-heavy alternatives pay higher burn. Risky has 30% growth, reliability −9, trust −7, operations +7, XP −30, confidence −12 and 65% implementation cost. Hiring salary obligations remain with every choice. Specific incident risks can override these values.
- Lesson: A timeout is an unknown result; payment correctness needs stable identity and reconciliation.
- Previous decision link: Level 29 finally exposes where time is spent; earlier idempotency knowledge now protects money.
- Future incident link: Bounded provider pressure lets the business grow until data volume and write throughput dominate.

### 31 - Retention Becomes the Workload

- Story event / symptoms: Order and audit history occupies four terabytes. Almost every interactive query includes a recent date range, but a single large table makes retention deletes and vacuum compete with current traffic.
- Company entering (recommended baseline): 2,950,000 registered users, 19 engineers; $1,245,000 MRR / $236,100 burn.
- Architecture entering: modular monolith, PostgreSQL, query index, connection pooler, app-fleet, indexed, pooled, portable-sessions, durable-media, catalogue-cache, fresh-catalogue, edge-assets, tenant-limits, bounded-autoscale, cache-coalescing, job-queue, idempotent-effects, bounded-retries, dead-letter, outbox, isolated-workers, read-replicas, consistent-reads, multi-az, pitr, safe-migrations, search-projection, media-service, dependency-bulkheads, event-fanout, versioned-events, observability, payment-reconciliation.
- Evidence: History / active window: 4 TB / 90 days; Retention delete duration: 9 h; Date-bounded queries: 96%; Normal write CPU: 52%.
- Root cause: Lifecycle maintenance of old rows dominates; there is no demonstrated aggregate write-capacity limit yet.
- Recommended - **Partition history by time**: Migrate in bounded batches to monthly partitions with date-aware queries, local indexes and rehearsed detach/archive retention; maintain tenant/order uniqueness in a separate authoritative key table when needed. Benefit: Pruning and partition retirement reduce scanned and deleted data. Trade-off / why alternatives are weaker now: Unique constraints on partitioned tables must include partition keys or use a separate invariant; one writer remains.
- Compromise - **Archive older history to a separate table**: Move cold rows incrementally into an archive relation and route history queries explicitly. Benefit: A simple hot/cold split reduces active-table size. Trade-off / why alternatives are weaker now: Recurring moves and archive queries need care; monthly retention remains more manual.
- Risky - **Shard all history immediately by random ID**: Distribute old and current rows randomly across independent databases. Benefit: Independent writers could add future aggregate write capacity. Trade-off / why alternatives are weaker now: Date queries scatter and retention remains costly; the measured problem is lifecycle maintenance, not writer saturation.
- Why appropriate now: Lifecycle maintenance of old rows dominates; there is no demonstrated aggregate write-capacity limit yet. Pruning and partition retirement reduce scanned and deleted data.
- Architecture change: time-partitions; only a selected response's actual capability is retained.
- State consequences (recommended): upfront $38,000; burn +$26,000/month; users +200,000; MRR +$110,000; engineers +2; reliability +3; trust +2; operations +2; XP 240; confidence +8. End cash $8,108,100, team 21.
- Alternative balance: compromise has 70% of recommended user/MRR gains, reliability +1, trust +1, confidence +3, half XP and 45% implementation cost; infrastructure-heavy alternatives pay higher burn. Risky has 30% growth, reliability −9, trust −7, operations +7, XP −30, confidence −12 and 65% implementation cost. Hiring salary obligations remain with every choice. Specific incident risks can override these values.
- Lesson: Partition for pruning and lifecycle management; it is not automatically sharding.
- Previous decision link: Three years of durable events and orders accumulate storage and maintenance work.
- Future incident link: Partitioning retains one writer; later measured aggregate writes may require another boundary.

### 32 - One Writer Has Reached Its Budget

- Story event / symptoms: Large merchant catalogue feeds now run alongside checkout. After batching, index pruning and a tested vertical upgrade, the largest affordable writer is saturated. Orders remain tenant-scoped; no transaction spans merchants.
- Company entering (recommended baseline): 3,150,000 registered users, 21 engineers; $1,355,000 MRR / $262,100 burn.
- Architecture entering: modular monolith, PostgreSQL, query index, connection pooler, app-fleet, indexed, pooled, portable-sessions, durable-media, catalogue-cache, fresh-catalogue, edge-assets, tenant-limits, bounded-autoscale, cache-coalescing, job-queue, idempotent-effects, bounded-retries, dead-letter, outbox, isolated-workers, read-replicas, consistent-reads, multi-az, pitr, safe-migrations, search-projection, media-service, dependency-bulkheads, event-fanout, versioned-events, observability, payment-reconciliation, time-partitions.
- Evidence: Optimized write load: 18,000 row mutations/s; Writer CPU / storage bandwidth: 94% / 91%; Read replica CPU: 34%; Cross-tenant transactions: none required.
- Root cause: Aggregate writes exceed one affordable primary; reads and connections are not the limiting resources.
- Recommended - **Shard by tenant with a directory**: Use eight tenant-routed writer groups, preserving tenant-local order/stock transactions and per-shard HA/PITR. Migrate tenants with CDC, checksums and a fenced cutover. Generate globally unique IDs, retaining tenant_id for routing. Hire three data engineers. Benefit: Independent writers distribute aggregate work while keeping transactional invariants local. Trade-off / why alternatives are weaker now: Cross-tenant reporting uses projections; backups, migrations and capacity must be managed per shard.
- Compromise - **Throttle imports and postpone contracts**: Keep one writer, schedule feeds within a measured write budget and defer high-volume merchants. Hire three data engineers. Benefit: A valid low-complexity operating envelope protects checkout. Trade-off / why alternatives are weaker now: Revenue growth slows because the new simultaneous-feed contract is not met.
- Risky - **Add readers to absorb the writes**: Add four asynchronous read replicas and retain all writes on the existing primary. Hire three data engineers. Benefit: Lag-tolerant read capacity increases. Trade-off / why alternatives are weaker now: The saturated writer still performs every mutation; readers do not add write throughput.
- Why appropriate now: Aggregate writes exceed one affordable primary; reads and connections are not the limiting resources. Independent writers distribute aggregate work while keeping transactional invariants local.
- Architecture change: tenant-shards; only a selected response's actual capability is retained.
- State consequences (recommended): upfront $65,000; burn +$41,000/month; users +200,000; MRR +$115,000; engineers +3; reliability +3; trust +2; operations +3; XP 240; confidence +8. End cash $9,095,000, team 24.
- Alternative balance: compromise has 70% of recommended user/MRR gains, reliability +1, trust +1, confidence +3, half XP and 45% implementation cost; infrastructure-heavy alternatives pay higher burn. Risky has 30% growth, reliability −9, trust −7, operations +7, XP −30, confidence −12 and 65% implementation cost. Hiring salary obligations remain with every choice. Specific incident risks can override these values.
- Lesson: Shard only with a measured writer limit and a transaction-local key.
- Previous decision link: Time partitioning fixed maintenance but did not add independent writers.
- Future incident link: Tenant hashing can distribute many merchants while leaving a single whale tenant hot.

### 33 - The Whale Does Not Hash Smaller

- Story event / symptoms: One merchant accounts for 42% of catalogue-feed writes. With eight tenant-routed groups, its assigned shard saturates while others remain cool. Checkout transactions must still stay tenant-local.
- Company entering (recommended baseline): 3,350,000 registered users, 24 engineers; $1,470,000 MRR / $303,100 burn.
- Architecture entering: modular monolith, PostgreSQL, query index, connection pooler, app-fleet, indexed, pooled, portable-sessions, durable-media, catalogue-cache, fresh-catalogue, edge-assets, tenant-limits, bounded-autoscale, cache-coalescing, job-queue, idempotent-effects, bounded-retries, dead-letter, outbox, isolated-workers, read-replicas, consistent-reads, multi-az, pitr, safe-migrations, search-projection, media-service, dependency-bulkheads, event-fanout, versioned-events, observability, payment-reconciliation, time-partitions, tenant-shards.
- Evidence: Hottest shard / median CPU: 97% / 31%; Largest tenant write share: 42%; Tenant-local invariants: orders + stock.
- Root cause: Hashing tenants cannot divide one very large tenant’s workload.
- Recommended - **Isolate the whale and enforce feed budgets**: Move the whale to a dedicated larger writer group through the directory, cap its bulk import rate, reserve checkout throughput and rebalance smaller tenants. Benefit: Tenant-local invariants remain intact and neighbors regain headroom. Trade-off / why alternatives are weaker now: The whale still has a finite single-writer ceiling; admission control limits its import throughput.
- Compromise - **Negotiate an off-peak whale import window**: Keep placement fixed, throttle this merchant during checkout peaks and schedule its largest feeds. Benefit: No migration and minimal operational cost can protect availability. Trade-off / why alternatives are weaker now: The merchant loses real-time feed throughput and may reject the reduced service tier.
- Risky - **Hash each order randomly across shards**: Scatter one merchant’s orders and stock across databases without a transaction redesign. Benefit: More machines could share a large tenant’s raw traffic. Trade-off / why alternatives are weaker now: Stock/order invariants now cross shards; changing placement alone does not supply distributed atomicity.
- Why appropriate now: Hashing tenants cannot divide one very large tenant’s workload. Tenant-local invariants remain intact and neighbors regain headroom.
- Architecture change: whale-isolation; only a selected response's actual capability is retained.
- State consequences (recommended): upfront $55,000; burn +$18,000/month; users +200,000; MRR +$120,000; engineers +0; reliability +3; trust +2; operations +1; XP 240; confidence +8. End cash $10,188,900, team 24.
- Alternative balance: compromise has 70% of recommended user/MRR gains, reliability +1, trust +1, confidence +3, half XP and 45% implementation cost; infrastructure-heavy alternatives pay higher burn. Risky has 30% growth, reliability −9, trust −7, operations +7, XP −30, confidence −12 and 65% implementation cost. Hiring salary obligations remain with every choice. Specific incident risks can override these values.
- Lesson: Hot tenants require isolation or a proven sub-key, not another hash function.
- Previous decision link: Level 32 distributed many merchants, revealing within-key skew. A single-writer branch sees the same whale consuming its shared write budget.
- Future incident link: More write groups create more recovery units; regional failover needs a complete inventory.

### 34 - The Region Is Unreachable

- Story event / symptoms: International merchants request regional disaster recovery, not active-active writes. The business accepts up to 60 seconds of committed-data loss in a regional catastrophe and a 15-minute RTO; a zone failure still has the stricter existing contract.
- Company entering (recommended baseline): 3,550,000 registered users, 24 engineers; $1,590,000 MRR / $321,100 burn.
- Architecture entering: modular monolith, PostgreSQL, query index, connection pooler, app-fleet, indexed, pooled, portable-sessions, durable-media, catalogue-cache, fresh-catalogue, edge-assets, tenant-limits, bounded-autoscale, cache-coalescing, job-queue, idempotent-effects, bounded-retries, dead-letter, outbox, isolated-workers, read-replicas, consistent-reads, multi-az, pitr, safe-migrations, search-projection, media-service, dependency-bulkheads, event-fanout, versioned-events, observability, payment-reconciliation, time-partitions, tenant-shards, whale-isolation.
- Evidence: Cold regional restore drill: 4 h; Business regional contract: RPO 60 s / RTO 15 min; Inter-region RTT: 170 ms.
- Root cause: Zone-local redundancy does not survive regional isolation within the promised recovery time.
- Recommended - **Maintain a fenced warm standby region**: Replicate every writer group asynchronously with lag alarms under 60 seconds, replicate objects/configuration, retain replayable outboxes and rehearse fencing, promotion and traffic shifts within 15 minutes. Refuse an automatic promotion if the measured loss budget is exceeded. Hire three operators. Benefit: Warm recovery meets the rehearsed regional contract without concurrent cross-region writers. Trade-off / why alternatives are weaker now: Acknowledged writes can be lost within the accepted bound; reconcile payments and event gaps after promotion, and rehearse failback.
- Compromise - **Negotiate four-hour disaster recovery**: Keep verified cross-region backups and publish a four-hour RTO tier instead of maintaining warm compute. Hire three operators. Benefit: Lower steady-state cost is legitimate for customers who accept the recovery delay. Trade-off / why alternatives are weaker now: It cannot meet the premium 15-minute promise, so enterprise expansion is limited.
- Risky - **Accept writes in both regions immediately**: Enable independent region-local writers for the same tenants during network partitions. Hire three operators. Benefit: Local write latency remains low in both regions. Trade-off / why alternatives are weaker now: Without conflict and inventory semantics, concurrent writes can oversell stock; asynchronous replication alone does not resolve them.
- Why appropriate now: Zone-local redundancy does not survive regional isolation within the promised recovery time. Warm recovery meets the rehearsed regional contract without concurrent cross-region writers.
- Architecture change: regional-dr; only a selected response's actual capability is retained.
- State consequences (recommended): upfront $85,000; burn +$52,000/month; users +200,000; MRR +$125,000; engineers +3; reliability +3; trust +2; operations +3; XP 240; confidence +8. End cash $11,320,800, team 27.
- Alternative balance: compromise has 70% of recommended user/MRR gains, reliability +1, trust +1, confidence +3, half XP and 45% implementation cost; infrastructure-heavy alternatives pay higher burn. Risky has 30% growth, reliability −9, trust −7, operations +7, XP −30, confidence −12 and 65% implementation cost. Hiring salary obligations remain with every choice. Specific incident risks can override these values.
- Lesson: Regional architecture follows RPO/RTO and conflict semantics, not a universal active-active ideal.
- Previous decision link: Per-shard recovery and outbox replay must now work as one system across regions.
- Future incident link: Recovery drills must include queues, objects, secrets, routing and payment reconciliation, not only databases.

### 35 - Protect the Checkout, Shed the Rest

- Story event / symptoms: A regional recovery rehearsal and a promotion overlap. Traffic tries to consume all recovered capacity. Core orders matter more than live analytics, fresh recommendations or bulk imports.
- Company entering (recommended baseline): 3,750,000 registered users, 27 engineers; $1,715,000 MRR / $373,100 burn.
- Architecture entering: modular monolith, PostgreSQL, query index, connection pooler, app-fleet, indexed, pooled, portable-sessions, durable-media, catalogue-cache, fresh-catalogue, edge-assets, tenant-limits, bounded-autoscale, cache-coalescing, job-queue, idempotent-effects, bounded-retries, dead-letter, outbox, isolated-workers, read-replicas, consistent-reads, multi-az, pitr, safe-migrations, search-projection, media-service, dependency-bulkheads, event-fanout, versioned-events, observability, payment-reconciliation, time-partitions, tenant-shards, whale-isolation, regional-dr.
- Evidence: Offered / tested recovery load: 5,000 / 3,200 origin RPS; Worker backlog drain estimate: 47 min; Checkout objective: p95 500 ms / p99 1.5 s.
- Root cause: Offered work exceeds the tested recovery envelope; accepting everything turns overload into a cascading outage.
- Recommended - **Reserve capacity and shed optional work**: Reserve checkout concurrency, enforce tenant budgets, defer imports/analytics, serve bounded stale public content and reject excess non-critical work with retry guidance; monitor queue age and recovery load. Benefit: Accepted critical work stays within the measured latency envelope. Trade-off / why alternatives are weaker now: Some features and requests are deliberately unavailable; deferred work needs a bounded drain plan.
- Compromise - **Cap the entire site at a lower fixed rate**: Apply one conservative admission cap and queue only durable accepted jobs. Benefit: A simpler envelope prevents collapse without elaborate priorities. Trade-off / why alternatives are weaker now: Checkout and optional work compete for the same quota; more valuable sales are rejected.
- Risky - **Queue every incoming request without limits**: Return acceptance for all requests and let queues absorb the full overload. Benefit: Short bursts can be smoothed when capacity catches up. Trade-off / why alternatives are weaker now: Unbounded backlog violates deadlines and storage budgets; a queue cannot create sustained throughput.
- Why appropriate now: Offered work exceeds the tested recovery envelope; accepting everything turns overload into a cascading outage. Accepted critical work stays within the measured latency envelope.
- Architecture change: load-shedding; only a selected response's actual capability is retained.
- State consequences (recommended): upfront $50,000; burn +$20,000/month; users +150,000; MRR +$115,000; engineers +0; reliability +3; trust +2; operations -3; XP 240; confidence +8. End cash $12,592,700, team 27.
- Alternative balance: compromise has 70% of recommended user/MRR gains, reliability +1, trust +1, confidence +3, half XP and 45% implementation cost; infrastructure-heavy alternatives pay higher burn. Risky has 30% growth, reliability −9, trust −7, operations +7, XP −30, confidence −12 and 65% implementation cost. Hiring salary obligations remain with every choice. Specific incident risks can override these values.
- Lesson: Admission control and graceful degradation protect explicit priorities within finite capacity.
- Previous decision link: Regional recovery and tenant isolation create a known but finite capacity budget.
- Future incident link: The final launch must combine these protections and prove them under one realistic test.

### 36 - The Cartline Launch Review

- Story event / symptoms: The founder proposes a global merchant launch. The planning envelope is 4 million registered users, 400,000 DAU, 500 average and 3,000 peak origin RPS (6×), up to 12,000 edge RPS, and 6 TB of relational data including indexes. This is a forecast; your actual company and topology decide the launch tier.
- Company entering (recommended baseline): 3,900,000 registered users, 27 engineers; $1,830,000 MRR / $393,100 burn.
- Architecture entering: modular monolith, PostgreSQL, query index, connection pooler, app-fleet, indexed, pooled, portable-sessions, durable-media, catalogue-cache, fresh-catalogue, edge-assets, tenant-limits, bounded-autoscale, cache-coalescing, job-queue, idempotent-effects, bounded-retries, dead-letter, outbox, isolated-workers, read-replicas, consistent-reads, multi-az, pitr, safe-migrations, search-projection, media-service, dependency-bulkheads, event-fanout, versioned-events, observability, payment-reconciliation, time-partitions, tenant-shards, whale-isolation, regional-dr, load-shedding.
- Evidence: Peak origin / order rate: 3,000 RPS / 200 orders/s; Feed + order mutations: 24,000/s peak across writer groups; Checkout SLO: 99.9% monthly; p95 500 ms; p99 1.5 s; Regional recovery: RPO 60 s / RTO 15 min; Monthly infrastructure ceiling: $180,000 within total burn.
- Root cause: No single new component can certify capacity, consistency and recovery across the system; evidence and unresolved architecture debt determine a safe scope.
- Recommended - **Gate the launch on an integrated rehearsal**: Test the exact topology at the forecast peak plus 30% headroom, zone loss, cache failure and provider stalls. Audit payment/stock invariants, restore every writer group, measure cost and drain time, and publish the proven envelope with named owners. Benefit: An earned launch contract combines capacity, correctness and recovery evidence. Trade-off / why alternatives are weaker now: Passing a game decision is a modeled rehearsal, not a real production benchmark; continuing growth requires new measurements.
- Compromise - **Launch a smaller contracted cohort**: Limit onboarding to measured current capacity, retain a waitlist, reduce availability/recovery promises where necessary and publish unresolved architecture work. Benefit: A viable narrower launch preserves the architecture actually built. Trade-off / why alternatives are weaker now: It sacrifices near-term revenue and the premium global SLA; omitted capabilities remain visible.
- Risky - **Open the full launch before rehearsals**: Assume nominal component capacities add up and accept all merchants with the premium SLA. Benefit: The market window opens immediately. Trade-off / why alternatives are weaker now: Unverified bottlenecks and failure domains turn a forecast into an unsupported contractual promise.
- Why appropriate now: No single new component can certify capacity, consistency and recovery across the system; evidence and unresolved architecture debt determine a safe scope. An earned launch contract combines capacity, correctness and recovery evidence.
- Architecture change: launch-reviewed; only a selected response's actual capability is retained.
- State consequences (recommended): upfront $60,000; burn +$15,000/month; users +100,000; MRR +$120,000; engineers +0; reliability +3; trust +2; operations -3; XP 260; confidence +8. End cash $13,954,600, team 27.
- Alternative balance: compromise has 70% of recommended user/MRR gains, reliability +1, trust +1, confidence +3, half XP and 45% implementation cost; infrastructure-heavy alternatives pay higher burn. Risky has 30% growth, reliability −9, trust −7, operations +7, XP −30, confidence −12 and 65% implementation cost. Hiring salary obligations remain with every choice. Specific incident risks can override these values.
- Lesson: The simplest acceptable architecture is the one demonstrated to meet the workload and business contract.
- Previous decision link: Every earlier boundary, cache policy, delivery guarantee and recovery choice affects the launch decision.
- Future incident link: Completion records the architecture actually built and its launch scope; no design handles arbitrary future load.

## Continuity check

Recommended endpoint before balancing overrides: 4,000,000 users, 27 engineers, $1,950,000 MRR, $408,100 burn, $13,954,600 cash. Costs are paid before new revenue; there is no funding reset. Growth represents commercially retained demand, not capacity manufactured by adding a box.


## Implemented balance and continuity amendments

The final content is authoritative for response-by-response deltas. Focused capacity/data additions (7, 9, 13, 19, 24, 25, 27, 31–33) give no automatic reliability increase; the health benefit depends on the incident rather than adding a box. High-impact unsafe choices (9, 21, 30, 34) impose larger trust/reliability penalties. A knowingly unverified full launch at 36 can terminate the campaign. The Level 4 vertical compromise pauses contracted roadmap work, reducing burn by $3,000/month; this gives an expensive but survivable opening rewrite a deliberate recovery route. Recovery prerequisites are individually priced in the published levels.

Fixed peak capacity and autoscaling share a capacity-budget qualification, while omitted recovery contracts and unresolved correctness hazards restrict the final launch. The constrained recommended finale grants 80% of that turn’s forecast growth and no missing infrastructure. Incidents use live architecture capabilities; workload numbers are scenario observations/acceptance tests, not a function of registered-user count. See the implementation report for exact tested milestone balances and the graph produced by the recommended route.

## Audit corrections to this planning baseline

The [level progression audit](level-progression-audit.md) records the implemented corrections. In particular, Level 3 immediately routes connections through its pool, Level 12 restores the five-second price contract when adopting a cache, Level 17's broker-free alternative records transactional immutable intents, and Level 24 hydrates displayed prices separately from the slower search projection. Tenant/whale writer groups retain independent recovery, and the finale requires freshness and dependency isolation. Async regional targets apply to rehearsed scenarios with usable per-writer loss evidence; unknown evidence blocks automatic promotion and may delay recovery. Company balances above are unchanged by these corrections.
