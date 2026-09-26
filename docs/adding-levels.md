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
- Cash ≤0, confidence ≤20, trust ≤20, reliability ≤35, or operations load ≥85 ends the run. No affordable response to the next incident also ends the run.
- Failure blocks further decisions and unlocks. Reset restores the campaign's starting state while retaining the player profile and audio preferences.
- Every decision adds before/after company and confidence snapshots to persistent history. The shared dashboard derives stage, health, and runway for any number of levels.

## Validation

The suite adds temporary fourth and fifth levels to the actual registry. It checks old-save continuation, default penalties, monthly spending, history across reloads, all five failure conditions, blocked continuation, and reset. These fixtures are tests, not published game content.

Content authors still need to balance the intended paths. Validation ensures negative consequences exist; it cannot establish that a 50-level campaign is fair or winnable.
