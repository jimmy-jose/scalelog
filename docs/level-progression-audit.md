# Level and progression audit

Reviewed all 36 incidents and 108 base responses, including conditional variants, paid prerequisites, stored progress, alternative endings and full-route economics.

## Fixed findings

| Finding | Correction | Evidence |
| --- | --- | --- |
| Level 3 added a pooler but left the direct database path and omitted pooler → PostgreSQL. Earlier service splits bypassed it too. | Reuse the shared pooling topology immediately, including the retained service owners. Record indexing/pooling capabilities and add the missing replication link on the reader alternative. | First-pool regression and retained-service route. |
| Level 3 claimed a healthy database after a Level 2 response that left the query unindexed. | Add an incident variant distinguishing connection admission from remaining query debt. Clarify the composite index and concurrent rollout in Level 2. | Alternate Level 2 → 3 route. |
| Level 12 could reactivate caching while leaving `cache-bypassed` or an hour-long TTL policy active. | Cache adoption clears bypass; both viable responses explicitly establish the five-second price contract and clear the obsolete TTL risk. | Bypass and unsafe-TTL paths through Level 12. |
| Level 24's 30-second search freshness could contradict the five-second displayed-price promise. | Limit the search budget to matching/ranking; hydrate prices through the fresher catalogue path and revalidate at checkout. | Content review across Levels 8, 12 and 24. |
| Some later stories invented a broker, persisted retry task, extracted service or outbox on alternative routes. | Correct Levels 8, 14–15, 17, 26–27 and 32 to describe the retained topology. Broker-free delivery uses immutable transactional intents and per-destination records. | Alternate routes and broker-free fan-out regression. |
| Tenant sharding and whale isolation did not carry HA links into new writers. A single physical reader appeared to follow several primaries; the single-writer whale path lacked the named directory. | Explicitly connect writer groups to independent HA/recovery and projection paths, label reader groups per writer, and install a real directory for the whale route. | Recommended and unsharded-whale graph regressions. |
| Async failover wording suggested a lag alarm guaranteed bounded data loss. | Require usable commit/replay evidence for each writer and block automatic promotion when the loss bound is unknown. Explain that protecting the loss bound may delay recovery. | Levels 21/34 and ending text, checked against PostgreSQL replication documentation. |
| Premium launch prerequisites omitted price freshness and dependency isolation. | Include both capabilities in the contract, retaining the existing correctness-hazard checks. | Missing-capability finale regressions. |
| Editing an earlier cost/topology silently changed historical previews despite unchanged saved balances. | Prefer recorded before-snapshots for history and the live state for the current incident; retain replay for legacy gaps. Wire these inputs through gameplay, outcomes, map, completion and company summary. | Regression mutates old content and verifies both historical and live previews. |
| A future level whose choices all failed stat requirements stayed unlocked but impossible to commit. | Centralize eligibility for previews, commitment, migration and unlock/refresh checks. End the run explicitly if no response is eligible. | Fixture with affordable but inaccessible next-level choices. |
| Content validation permitted empty dialogue, duplicate/unfulfilled repairs and impossible stat ranges. | Reject these definitions, repeated variant IDs and empty capability predicates; show all recurring repair costs. | Invalid-content and repair-disclosure regressions. |
| Level 17 installed the outbox before reapplying queue setup, which recreated the direct application publication path. | Provision the queue first, then route publication through the transactional outbox relay. | Check the relay path and absence of application → jobs after both existing-queue and missing-queue routes. |
| An early reader route was absent from capability state, and a later primary-only choice left that route active. | Level 3 records its deployed reader and routing capabilities; Level 19's primary-only response disables reader routing while retaining the hardware. | Early-reader → primary-only → Level 20 branch regression. |
| New tenant and whale writers omitted the retained database dispatcher, and regional recovery omitted shared file storage. | Attach transactional delivery ledgers for the new writers and include existing shared media storage in the recovery region. | Broker-free writer expansion and shared-file recovery routes. |
| Pooling could leave PostgreSQL's incident warning and exhausted connection count on screen. Some alternate-route dialogue still assumed a larger host, safe checkout, a broker or replicas. | Clear the repaired connection incident without implying indexing; use descriptions consistent with the branch's actual components and unresolved debt. | Pooling outcome topology plus alternate incident copy review. |
| The architecture preview applied incident diagnostics, while commitment applied the choice to the previous raw graph. Historical diagnostics could also change after content edits. | Apply decisions to the same incident graph as the preview; save that diagnostic snapshot separately from the incoming ledger topology. Historical reads prefer saved diagnostics and incident descriptions. | Every opening response's preview equals its committed graph; edited-content and reload regression. |
| Routes could read a fresh campaign before device storage finished loading. | Gate routes on storage readiness and expose retry after a read failure. Keep loading status outside the persisted store so an error cannot overwrite progress. | Delayed read, failed read, zero writes on error, and successful retry checks. |
| Skipping optional age repeated onboarding, failed runs blocked historical incident review, and debriefs depended on current choice content. | A saved name completes the profile; completed incidents remain read-only after failure; individual outcomes use saved labels and costs and return to the map. | Headless route/render regressions plus real-store snapshot checks. |

## Economy and save policy

No published level/choice IDs or economic deltas changed. A full recommended route still reaches 4,000,000 registered users, 27 engineers, $1,950,000 MRR, $408,100 monthly burn and $13,954,600 cash. The compromise route remains viable with a constrained ending: 2,806,900 registered users, 27 engineers, $1,368,150 MRR, $358,755 burn and $9,252,010 cash.

These are fictional campaign balances, not infrastructure benchmarks or a revenue forecast. Their generous later-game cash accumulation makes contract quality and correctness more important than solvency; this review preserves that existing design rather than silently rebalancing saved runs. Existing recorded financial and architecture snapshots stay authoritative. Legacy entries without snapshots use the documented replay fallback. No save reset or economic replay migration is introduced.

New outcomes additionally store the exact incident graph shown before commitment and the resolved upfront cost, including any prerequisite work. Older outcomes retain their recorded graph and can recover upfront cost from the saved cash ledger when cash was not clamped to zero. These optional fields do not require a save-version bump.

A graph node may represent a fleet or several writer/reader groups; labels and edges now make those group boundaries explicit. Individual machines, routing algorithms, replication bandwidth and per-request latency are not simulated.

## Verification

Run `npm run typecheck`, `npm run lint`, `npm test`, `npm run validate:campaign`, and `npm run build`. Tests cover recommended, compromise, mixed, failed, restored and appended-content routes; every response after the introductory levels; 120 deterministic mixed playthroughs; and targeted regressions listed above. The validation script asserts the ending qualification rather than only printing an expectation. Headless route tests verify rendering and callbacks, not native gestures or browser layout.

## Primary references

- [PostgreSQL 17 standby servers](https://www.postgresql.org/docs/17/warm-standby.html): async loss windows, standby scope and synchronous durability.
- [PostgreSQL 17 replication settings](https://www.postgresql.org/docs/17/runtime-config-replication.html): synchronous standby acknowledgement policy.
- [AWS transactional outbox](https://docs.aws.amazon.com/prescriptive-guidance/latest/cloud-design-patterns/transactional-outbox.html): transactional intent, duplicate delivery and idempotent consumers.
- [RabbitMQ publish/subscribe tutorial](https://www.rabbitmq.com/tutorials/tutorial-three-python): independent subscription queues versus competing consumers.
