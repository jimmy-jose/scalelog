# Adding campaign levels

Every registered level uses the shared decision engine. Do not implement cash, XP, failure checks, or persistence inside a level or screen.

## Register a level

1. Add a `Level` export in `src/campaigns/startup-cto/levels/`. Use a unique, stable `id`, `campaignId: "startup-cto"`, and the next consecutive `levelNumber`.
2. Import it in `src/campaigns/startup-cto/campaign.ts` and append it to the `defineCampaignLevels` array.
3. Run `npm run typecheck` and `npm test`.

The manifest generates `levelIds`, `nextLevel`, and `unlocks`. Set `unlocks: []` in authored levels; authored links are replaced by manifest order. The last listed level ends the currently playable chapter. `totalLevels` is the planned campaign size, not the playable list.

Existing healthy saves unlock appended levels on reload or campaign selection, preserving company state, XP, and history. Adding content does not refill cash or revive failed runs. No save-version bump is needed just to append a level. Keep existing level and choice IDs stable; editing past decisions' effects needs a deliberate save migration.

## Define consequences

Each level must have exactly one `recommended` choice. `risky` and `overkill` identify bad choices in the current game model; `neutral` is a compromise.

Bad choices must have user and revenue growth no higher than the recommended choice, with at least one strictly lower. This can mean slower growth, zero growth versus a positive benchmark, or explicit losses. Validation rejects identical or better growth. It also rejects nonnegative XP or confidence effects on bad choices.

Example effects for a bad choice:

```ts
cost: 1000,
tone: "risky",
effects: {
  users: -500,
  monthlyRevenue: -200,
  monthlyBurn: 300,
  customerTrust: -8,
  reliability: -10,
  complexity: 6,
  xp: -40,
  confidence: -20,
},
```

Omitting XP/confidence on a bad choice uses -20 XP and -25 confidence. Other choices default to the level's `xpReward` and +8 confidence. Explicit negative effects override those defaults; XP and confidence cannot fall below zero. Choice previews use the same reward calculation as the engine.

`cost` is deducted exactly once. Omit `effects.cash`; legacy values are accepted only when equal to `-cost`. Cash grants are not supported through this field. Do not add a second operating-cost deduction to a level.

## Automatic rules for every turn

- A fresh Startup CTO campaign starts with $40,000. Later levels inherit its remaining cash.
- Each accepted decision advances one month. Cash changes by `-cost + previous monthlyRevenue - updated monthlyBurn`. Newly earned recurring revenue begins next month.
- Users, revenue, burn, trust, reliability, and operations load carry forward. Health scores stay between 0 and 100.
- Cash ≤0, confidence ≤20, trust ≤20, reliability ≤35, or operations load ≥85 ends the run. No eligible response to the next incident also ends the run: affordability and min/max stat requirements use the same rule as choice acceptance and the preview.
- Failure blocks further decisions and unlocks. Reset restores the campaign's starting state while retaining the player profile and audio preferences.
- Every decision adds before/after company and confidence snapshots to persistent history. The shared dashboard derives stage, health, and runway for any number of levels.

## Validation

The suite temporarily isolates the original three-level manifest and appends fixture fourth/fifth levels to test extensibility. It also runs all 36 published levels, each new response, recommended/compromise routes and 120 deterministic mixed routes. It checks old-save continuation, default penalties, monthly spending, history across reloads, all five failure conditions, blocked continuation, and reset. These fixtures are tests, not published game content.

Content authors still need to balance the intended paths. Validation ensures negative consequences exist; it cannot establish that a long campaign is fair or winnable.


## Stateful incidents and hiring

`ArchitectureGraph.capabilities` is optional so older saves remain readable. Use `setCapability` changes for behavioral contracts (idempotency, recovery, admission) and existing node/edge changes for deployed components. `addEdge.ifNodesExist` can attach a shared policy/recovery link only when both optional components exist; it never creates phantom nodes. Disabling a capability does not delete retained hardware. Explain whether retained components are bypassed or still active.

`Level.variants` is an ordered first-match list. A variant matches when any `missingAny` capability is absent **or** any `hasAny` capability is present, AND all `hasAll` entries are present. Omitted predicates impose no condition. It replaces description, diagnostics and Byte dialogue; optional replacement choices must retain the same stable IDs and pass the same consequence validation.

Use `Level.recoveries` for an explicit prerequisite repair on named choice IDs. The shared `resolveLevel` adds its disclosed cost, burn, operational load and topology changes only while that capability is missing. Do not pre-deduct its cost in content. Both UI and canonical choice acceptance resolve the same incident. Historical screens prefer saved company/architecture snapshots, and current previews use live state. Replay is only a fallback for missing legacy snapshots or an explicit migration; current content edits must not silently recalculate an existing balance. Replay and migration resolve against the graph entering each historical decision.

`effects.engineers` is an integer delta, clamped at zero by the shared simulation. Fund compensation in `monthlyBurn` and explain hiring/ownership in the incident. Users are registered accounts; incident RPS/DAU are separate observations or forecasts. Reliability is a game health score, not an uptime percentage.

New history entries retain the incident description plus before/after architecture snapshots. The finale displays the saved topology, retained capabilities, unresolved correctness risks and missing premium-launch prerequisites. Fixed peak capacity is a valid alternative to autoscaling; selective media extraction is not mandatory for a viable ending. No component is installed by the finale review.

`architectureBefore` records the incoming ledger topology. `incidentArchitectureBefore` additionally records the diagnostic graph shown in the preview; commitment applies the choice to that same graph. If an incident marks a component unhealthy, the response that repairs it must explicitly clear that state. Outcomes also retain `choiceCost`, including resolved prerequisite costs, so later content edits cannot change the historical ledger explanation.

`npm run validate:campaign` verifies both full routes and prints their economics. `node scripts/validate-campaign.cjs --json` emits milestone topology/company snapshots for author review. Schema checks alone do not prove technical truth: update the progression plan and technical review when changing a workload or contract.


## Authoring invariants

A playable incident must contain dialogue. Capability predicate arrays cannot be empty. Variants need unique IDs. Recovery capabilities must be unique per incident and their changes must actually enable the capability being charged for. Stat requirements cannot have a minimum above their maximum. Paid repairs disclose cash, monthly burn and operations load in the decision preview.

Snapshot-preserving edits do not retroactively purchase prerequisites or rewrite old financial outcomes. Keep IDs stable. An economic rebalance that should affect already-completed decisions still needs an explicit migration policy; do not merely change past deltas and replay history on screen.
