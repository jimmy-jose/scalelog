# ScaleLog sound asset report

## Current palette (September 2026)

All 17 sound IDs now have original, locally synthesized WAV assets in `assets/audio/designed/`. Rebuild with `python3 scripts/build-sounds.py`. These use no external samples. The original uploaded MP3s remain unchanged in their previous folders.

The replacement palette has short muted clicks, a distinct Jimmy hint chime, restrained low incident pulses, and related ascending reward motifs. Peaks are capped at −12 dBFS (frequent UI/metric cues are quieter), with smooth attacks and releases. `src/game/feedback/soundMix.ts` controls per-cue gain, priority, duration, and repeat cooldowns. The app permits one UI cue and one event cue at a time. Pending cues are cancelled on mute and expired requests are dropped.

The tests cover asset headroom, boundaries, mix duration, distinct hint/metric assets, duplicate taps, event priority, settings changes, and async playback cancellation. See README for the current trigger map. Native device listening remains a manual check.

## Historical sourcing brief

The notes below describe the original plan before assets were supplied. They are retained as creative reference; the missing-asset and MP3 path notes do not describe the current implementation.


No sound files were present in the project when this system was added. The registry intentionally contains `null` for each sound until a licensed asset is supplied; no placeholder audio is bundled.

The current playable slice has three levels. It uses seven core sound files (P0), with three additional files for future/currently locked game states (P1). The remaining four are deferred polish (P2), so they do not block the playable slice.

## Missing asset list

| Priority | ID | Filename | Used for | Duration | Style | Search terms |
|---|---|---|---|---|---|---|
| P0 | `choiceSelected` | `assets/audio/gameplay/choice-select.mp3` | Player confirms a decision and opens its architecture preview | 0.15–0.35 sec | Quiet, neutral digital click | “soft tech UI click”, “subtle digital selection” |
| P0 | `choiceSuccess` | `assets/audio/gameplay/success.mp3` | Recommended decisions and successful outcomes | 0.35–0.8 sec | Warm, clean confirmation tone | “soft technology success UI”, “subtle digital confirmation” |
| P0 | `choiceWarning` | `assets/audio/gameplay/warning.mp3` | Risky or overbuilt decision outcomes | 0.4–0.9 sec | Low, uncertain warning tone; not a failure sting | “soft tech warning UI”, “subtle low digital alert” |
| P0 | `incidentCritical` | `assets/audio/incidents/critical.mp3` | Critical production incident on levels 2 and 3 | 0.8–1.5 sec | Restrained low-frequency warning pulse | “server incident alert”, “soft production warning pulse” |
| P0 | `architectureNodeAdded` | `assets/audio/architecture/node-added.mp3` | New component appears in the architecture transition | 0.3–0.7 sec | Satisfying digital pop with a faint rising shimmer | “digital infrastructure pop”, “soft deploy UI sound” |
| P0 | `xpGain` | `assets/audio/rewards/xp.mp3` | Positive XP is shown on the chapter handoff screen | 0.3–0.7 sec | Small, warm reward chime | “subtle experience point UI”, “small tech reward chime” |
| P0 | `levelComplete` | `assets/audio/rewards/level-complete.mp3` | A non-failed level is handed off as cleared | 0.8–1.4 sec | Recognizable, restrained progression cue | “premium level complete UI”, “warm technology progression” |
| P1 | `incidentWarning` | `assets/audio/incidents/warning.mp3` | Warning-only incident levels added later | 0.5–1.0 sec | Soft alert pulse, below critical in pitch and intensity | “subtle server warning UI”, “soft technical alert” |
| P1 | `architectureNodeFailed` | `assets/audio/architecture/node-failed.mp3` | A component visibly enters the failed state | 0.4–0.8 sec | Deeper, short failure texture without an alarm | “soft system failure UI”, “low digital error tone” |
| P1 | `awardUnlocked` | `assets/audio/rewards/award-unlock.mp3` | Campaign award unlock, expected at level 10 | 1.0–1.8 sec | Memorable warm achievement chime, more special than level clear | “premium achievement unlock”, “warm technology award chime” |
| P2 | `uiTap` | `assets/audio/ui/tap.mp3` | Optional subtle click if later UI flows benefit from sound | 0.08–0.2 sec | Very quiet, soft interface tick | “quiet UI tap”, “soft interface click” |
| P2 | `metricImproved` | `assets/audio/gameplay/metric-improved.mp3` | A future animated metric improvement, if it needs a separate cue | 0.2–0.5 sec | Barely-there upward digital accent | “subtle positive metric UI”, “soft rising data tone” |
| P2 | `metricWorsened` | `assets/audio/gameplay/metric-worsened.mp3` | A future animated metric deterioration, if it needs a separate cue | 0.2–0.5 sec | Muted downward digital accent | “subtle negative metric UI”, “soft descending data tone” |
| P2 | `cashSpent` | `assets/audio/gameplay/cash-spent.mp3` | Future large resource deductions only; not every cost change | 0.2–0.45 sec | Quiet, neutral resource tick | “subtle resource spend UI”, “soft finance interface sound” |

## Asset prompts and usage notes

Use the filenames above and register supplied files in `src/game/feedback/soundRegistry.ts`. Static `require()` calls belong only in that registry. Export short effects as MP3 or another format supported by Expo Audio, trimmed close to the sound, normalized consistently, and without long silence.

For any asset found on Mixkit, Pixabay, Freesound, Kenney, or another library, verify that its current license permits use in a commercial game and check whether attribution is required. Keep a copy of the license/receipt with the project’s asset records.

### P0 — required for current playable levels

#### `choiceSelected` — `choice-select.mp3`

- **Exact purpose:** Plays when the player presses “Choose this path” and the architecture preview opens. It confirms selection without hinting at whether the call is good.
- **Recommended duration:** 0.15–0.35 seconds.
- **Desired sound:** Soft, neutral digital click with a rounded transient. Keep it quiet and avoid a high-pitched glassy ping.
- **Search keywords:** “soft tech UI click”, “subtle digital selection”, “quiet interface confirm”.
- **AI-generation prompt:** `Create a 0.25-second premium strategy-game UI selection sound. Use one soft, neutral digital click with a rounded attack and a very short clean tail. It should confirm that a choice was selected without sounding positive or negative. No music, voice, arcade, casino, or harsh high frequencies.`
- **Licensing:** If sourced from a library, verify commercial-game use and attribution requirements.

#### `choiceSuccess` — `success.mp3`

- **Exact purpose:** Plays on the outcome screen for a recommended decision, after the architecture preview and before the player reviews the result.
- **Recommended duration:** 0.35–0.8 seconds.
- **Desired sound:** Soft, warm electronic confirmation with a small upward movement; satisfying but not celebratory.
- **Search keywords:** “soft technology success UI”, “subtle digital confirmation”, “clean product success sound”.
- **AI-generation prompt:** `Create a 0.6-second clean, warm digital confirmation for a premium developer strategy game. Use two soft synth tones with a slight upward resolution and a short, smooth tail. Professional, subtle, and satisfying. No music, voice, arcade, casino, or loud impact.`
- **Licensing:** If sourced from a library, verify commercial-game use and attribution requirements.

#### `choiceWarning` — `warning.mp3`

- **Exact purpose:** Plays when an outcome is risky, overbuilt, or ends the run. It should signal caution without implying a harsh “wrong answer” buzzer.
- **Recommended duration:** 0.4–0.9 seconds.
- **Desired sound:** Low, restrained two-part tone or pulse with slight uncertainty; distinguishable from the urgent critical-incident cue.
- **Search keywords:** “soft tech warning UI”, “subtle low digital alert”, “gentle system caution tone”.
- **AI-generation prompt:** `Create a 0.7-second understated warning sound for a professional technology strategy game. Use a low, soft digital pulse followed by a slightly unresolved tone. Calm caution, not failure, alarm, or punishment. No music, voice, harsh frequencies, arcade, or casino character.`
- **Licensing:** If sourced from a library, verify commercial-game use and attribution requirements.

#### `incidentCritical` — `critical.mp3`

- **Exact purpose:** Plays as a level with critical production metrics opens; the current levels are “The Dashboard Is Slow” and “Too Many Connections”.
- **Recommended duration:** 0.8–1.5 seconds.
- **Desired sound:** Short low-frequency warning pulse with one restrained secondary beat. Urgent enough to mark production pressure, never an alarm loop.
- **Search keywords:** “server incident alert”, “soft production warning pulse”, “low technical system alert”.
- **AI-generation prompt:** `Create a 1.1-second restrained production-incident cue for a premium developer strategy game. Use a low digital warning pulse and one subtle follow-up pulse, with a clean short tail. Urgent but controlled, technical and professional. No siren, voice, music, casino alarm, or harsh transient.`
- **Licensing:** If sourced from a library, verify commercial-game use and attribution requirements.

#### `architectureNodeAdded` — `node-added.mp3`

- **Exact purpose:** Plays when one or more new architecture nodes become visible in the animated transition, such as Redis, a pooler, or proposed services.
- **Recommended duration:** 0.3–0.7 seconds.
- **Desired sound:** A compact digital pop with a faint rising shimmer. Keep the cue neutral; a later outcome cue communicates whether the decision was wise.
- **Search keywords:** “digital infrastructure pop”, “soft deploy UI sound”, “technology node added”.
- **AI-generation prompt:** `Create a 0.5-second premium UI sound for a new infrastructure component appearing in an architecture diagram. Use a satisfying soft digital pop followed by a very faint rising shimmer. Neutral, clean, and modern. No music, voice, arcade, casino, or exaggerated impact.`
- **Licensing:** If sourced from a library, verify commercial-game use and attribution requirements.

#### `xpGain` — `xp.mp3`

- **Exact purpose:** Plays when positive CTO XP is shown on the chapter handoff screen.
- **Recommended duration:** 0.3–0.7 seconds.
- **Desired sound:** A small warm chime with a soft digital edge; lighter than level completion or an award.
- **Search keywords:** “subtle experience point UI”, “small tech reward chime”, “soft XP gained sound”.
- **AI-generation prompt:** `Create a 0.5-second subtle XP reward cue for a polished technology strategy game. Use a small warm two-note chime with a soft digital texture and short decay. Pleasant and restrained, clearly smaller than a level-complete or award sound. No music, voice, arcade, or casino style.`
- **Licensing:** If sourced from a library, verify commercial-game use and attribution requirements.

#### `levelComplete` — `level-complete.mp3`

- **Exact purpose:** Plays after the XP cue when a level handoff appears, but only if the company run did not fail.
- **Recommended duration:** 0.8–1.4 seconds.
- **Desired sound:** A recognizable warm progression motif, two or three clean notes, more substantial than routine positive feedback.
- **Search keywords:** “premium level complete UI”, “warm technology progression”, “subtle chapter clear sound”.
- **AI-generation prompt:** `Create a 1.1-second signature level-clear cue for a premium developer strategy game. Use a memorable three-note warm synth chime that resolves cleanly, with gentle depth and a short tail. Professional, optimistic, and restrained. No fanfare, voice, music bed, arcade, or casino style.`
- **Licensing:** If sourced from a library, verify commercial-game use and attribution requirements.

### P1 — useful for MVP polish and upcoming levels

#### `incidentWarning` — `warning.mp3` (incident folder)

- **Exact purpose:** Fallback cue for a future level whose metrics are warning severity but not critical. The current playable levels already use the critical cue.
- **Recommended duration:** 0.5–1.0 seconds.
- **Desired sound:** A soft, single alert pulse with less weight than `incidentCritical`.
- **Search keywords:** “subtle server warning UI”, “soft technical alert”, “gentle monitoring warning”.
- **AI-generation prompt:** `Create a 0.7-second low-intensity warning cue for a software operations strategy game. Use one soft digital pulse with a short muted tail. It should suggest attention, not outage or danger. Keep it quieter and lighter than a critical incident sound. No music, voice, siren, or harsh high tones.`
- **Licensing:** If sourced from a library, verify commercial-game use and attribution requirements.

#### `architectureNodeFailed` — `node-failed.mp3`

- **Exact purpose:** Future architecture animation when a component changes to the failed state; no current playable choice sets a component to failed.
- **Recommended duration:** 0.4–0.8 seconds.
- **Desired sound:** Short, deeper digital drop or muted error texture, clearly different from adding a component.
- **Search keywords:** “soft system failure UI”, “low digital error tone”, “muted component failure”.
- **AI-generation prompt:** `Create a 0.6-second restrained component-failure sound for a professional system-design game. Use a short low digital drop with a muted, clean tail. Clear but not frightening; no crash, explosion, alarm, voice, music, arcade, or casino sound.`
- **Licensing:** If sourced from a library, verify commercial-game use and attribution requirements.

#### `awardUnlocked` — `award-unlock.mp3`

- **Exact purpose:** Plays for the campaign award granted after level 10. That level is not part of the current playable three-level slice.
- **Recommended duration:** 1.0–1.8 seconds.
- **Desired sound:** A more memorable warm achievement chime than level completion, with a small rising flourish and clean resolution.
- **Search keywords:** “premium achievement unlock”, “warm technology award chime”, “subtle milestone reward sound”.
- **AI-generation prompt:** `Create a 1.4-second memorable award-unlocked cue for a premium developer strategy game. Use a warm rising three-note chime with a subtle shimmer and confident resolution. More special than a level-clear cue, but polished and restrained. No fanfare, voice, music, arcade, or casino character.`
- **Licensing:** If sourced from a library, verify commercial-game use and attribution requirements.

### P2 — future polish only

#### `uiTap` — `tap.mp3`

- **Exact purpose:** Reserved for a future decision to add quiet sound to selected navigation controls. It is not currently triggered so routine taps stay quiet.
- **Recommended duration:** 0.08–0.2 seconds.
- **Desired sound:** Very quiet soft click/tick with no positive or negative meaning.
- **Search keywords:** “quiet UI tap”, “soft interface click”, “minimal button sound”.
- **AI-generation prompt:** `Create a 0.14-second almost inaudible interface tick for a modern strategy game. Use a soft, rounded digital click with no tonal message and a very short tail. No music, voice, harsh transient, arcade, or casino sound.`
- **Licensing:** If sourced from a library, verify commercial-game use and attribution requirements.

#### `metricImproved` — `metric-improved.mp3`

- **Exact purpose:** Reserved for future metric animations if a metric change needs distinct audio. Current outcomes are presented in a ledger without per-metric sound.
- **Recommended duration:** 0.2–0.5 seconds.
- **Desired sound:** Barely-there rising data accent that can be repeated sparingly.
- **Search keywords:** “subtle positive metric UI”, “soft rising data tone”, “quiet stats improved”.
- **AI-generation prompt:** `Create a 0.35-second subtle upward metric accent for a premium technology game. Use a soft two-tone rise with restrained volume and a short tail. It must sit under other game sounds without drawing attention. No music, voice, arcade, or casino style.`
- **Licensing:** If sourced from a library, verify commercial-game use and attribution requirements.

#### `metricWorsened` — `metric-worsened.mp3`

- **Exact purpose:** Reserved for future metric animations if deterioration needs a distinct cue. Current outcomes are presented in a ledger without per-metric sound.
- **Recommended duration:** 0.2–0.5 seconds.
- **Desired sound:** Muted downward data accent, less alarming than an incident cue.
- **Search keywords:** “subtle negative metric UI”, “soft descending data tone”, “quiet stats worsened”.
- **AI-generation prompt:** `Create a 0.35-second muted downward metric accent for a professional system-design game. Use a soft descending digital tone with a short clean tail. It should indicate a small change, not an incident or failure. No music, voice, alarm, arcade, or casino sound.`
- **Licensing:** If sourced from a library, verify commercial-game use and attribution requirements.

#### `cashSpent` — `cash-spent.mp3`

- **Exact purpose:** Reserved for a future large resource deduction only. It is not played for current choices because the outcome cue already communicates the decision and even modest costs are frequent.
- **Recommended duration:** 0.2–0.45 seconds.
- **Desired sound:** Quiet, neutral resource tick with no coin, cash-register, or slot-machine character.
- **Search keywords:** “subtle resource spend UI”, “soft finance interface sound”, “quiet budget deduction”.
- **AI-generation prompt:** `Create a 0.3-second neutral resource-spend sound for a premium developer strategy game. Use one quiet, clean digital tick with a slight low note and short decay. Avoid coins, cash registers, slot-machine sounds, music, voice, or arcade character.`
- **Licensing:** If sourced from a library, verify commercial-game use and attribution requirements.
