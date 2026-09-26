# Resource brief for the first three levels

The five requested Jimmy expressions have now been supplied and integrated. Their normalized filenames are `jimmy_neutral.png`, `jimmy_disappointed.png`, `jimmy_panic.png`, `jimmy_shocked.png`, and `jimmy_defeated.png` under `assets/characters/`. Neutral replaces the default wave; onboarding keeps the welcome image. Terminal failure overrides the authored choice emotion on both outcome and completion screens, including existing saves. The generation directions below remain as reference; the audio and optional scene assets are still outstanding.

## Existing resources

- Six Jimmy cutouts: welcome, thinking, concerned, explain, happy, smug. All are 1122 × 1402 PNGs with alpha, approximately 1.3–1.7 MB each.
- One office background: 1672 × 941, used in briefings, outcomes, and chapter handoffs.
- Architecture and metric icons are already drawn with SVG. The architecture preview can show changed components and connections.
- Jimmy has a small looping vertical movement. No separate blink, talking, or reaction frames were found.
- Fourteen audio registry entries and the optional background music source are all null. Audio directories contain placeholders only. Selection, incident, architecture, outcome, XP, and completion feedback already have call sites. Several other events are declared but are not yet triggered by gameplay.

## Generate first: five Jimmy expressions

Reuse the existing character as the image reference for every generation. Keep the bald head, beard shape, brown eyes, skin tone, blue hoodie, white shirt, stylized 3D rendering, lighting, lens, proportions, and camera angle consistent. Change expression and gesture only. Deliver one transparent PNG per pose, 1122 × 1402, with the same head size, eye line, and torso alignment. Keep hands within frame with padding. No text, captions, props covering the face, or baked background. Clean the silhouette against dark navy to avoid bright fringes.

Use this shared prompt prefix:

> Create a new expression of the exact Jimmy character in the supplied reference. Preserve his identity, clothing, materials, proportions, camera angle, lighting, and stylized 3D appearance. Upper-body character cutout on a truly transparent background, 1122 × 1402 pixels. Keep head scale and eye line aligned with the reference, and leave padding around all hands. No text or scenery.

Add the relevant direction:

| File | Expression direction | Intended use |
| --- | --- | --- |
| `jimmy_neutral.png` | Attentive, relaxed eyebrows, closed mouth with a very slight friendly smile; hands resting naturally. No wave, thumbs-up, or celebration. | Default listening/waiting state in every level. Keep welcome for onboarding. |
| `jimmy_disappointed.png` | Brows raised slightly at the center, mouth closed with downturned corners, shoulders lowered, one hand rubbing the back of his neck. Regretful and sympathetic; not smiling or mocking the player. | Level 1 premature rewrite; Level 3 unnecessary replica; nonterminal setbacks. |
| `jimmy_panic.png` | Urgent forward lean, wide eyes, tense raised eyebrows, slightly open mouth, both palms lifted near chest height. Clearly stronger than concerned, but still a helpful assistant rather than a screaming caricature. | Level 3 connection-storm opening and critical production incidents. |
| `jimmy_shocked.png` | Frozen surprise, raised brows, wide eyes, small open mouth, one hand held still near the chest. Distinct from the active, urgent panic gesture. | Level 3 raising the connection limit and seeing memory pressure worsen. |
| `jimmy_defeated.png` | Head slightly lowered, lowered shoulders, sober eyes, closed mouth, hands resting together. Compassionate and exhausted, without exaggerated crying. | Bankruptcy, dismissal, or shutdown; separate terminal failure from a recoverable mistake. |

Neutral, disappointed, panic, and shocked can replace mappings for existing emotion keys. Defeated requires a new emotion key or explicit failure-screen asset mapping. Merely copying files into the assets folder will not wire them into the game.

Keep the existing thinking, concerned, explain, happy, and smug art. The happy pose already has a thumbs-up and raised fist, making a separate celebration image lower priority.

## Generate first: eight short sounds

Use one consistent sound palette: soft digital/mechanical UI sounds, restrained synthesizer tones, no speech, no background hiss, no harsh alarm peaks. Keep perceived loudness consistent. Deliver WAV masters and MP3 runtime versions. Short cues should have immediate onset with no leading silence and a clean tail.

| Runtime file | Length target | Generation direction | Integration |
| --- | --- | --- | --- |
| `assets/audio/ui/tap.mp3` | 0.08–0.15 s | Soft, dry tactile click; unobtrusive under rapid navigation. | `uiTap` |
| `assets/audio/gameplay/choice-select.mp3` | 0.15–0.25 s | A card sliding into place followed by a light latch click. Neutral in mood; does not reveal whether the choice is good. | `choiceSelected` |
| `assets/audio/gameplay/success.mp3` | 0.5–0.8 s | Two or three warm ascending synth notes with a restrained resolution. | `choiceSuccess` |
| `assets/audio/gameplay/warning.mp3` | 0.4–0.7 s | Muted descending two-note cue, conveying a costly setback without sounding terminal. | `choiceWarning` |
| `assets/audio/incidents/critical.mp3` | 0.5–0.9 s | Two short urgent electronic pulses, noticeable but not a loud siren. Play once at incident entry. | `incidentCritical` |
| `assets/audio/architecture/node-added.mp3` | 0.15–0.3 s | A precise mechanical snap plus a tiny digital chirp. | `architectureNodeAdded` |
| `assets/audio/rewards/xp.mp3` | 0.25–0.5 s | A light ascending reward sparkle, softer than the success cue. | `xpGain` |
| `assets/audio/gameplay/run-failed.mp3` | 1–1.5 s | A subdued low descending chord and gentle power-down tail. Serious rather than comic. | New failure event/source and trigger required. |

Second audio batch: a distinct level-complete cue, improved/worsened metric ticks, warning incident cue, cash-spent click, and node-failed cue. Award-unlocked audio can wait: the three playable levels cannot reach the Level 10 award. One quiet seamless office ambience loop is optional; music is not required to make these interactions readable.

## Optional background variants

Use the existing office as the reference; preserve the same room and camera position. Deliver 1920 × 1080 or larger, with no Jimmy and no legible UI text. Leave the current character and text areas uncluttered.

- `startup_office_incident.png`: Same office, dimmer working light and restrained amber/red monitor glow. Use for the slow-dashboard and connection-storm incidents. Specific warning lights can also be added with code, so this asset is optional.
- `startup_office_shutdown.png`: Same office after the team has left, most monitors off, subdued lighting. Reserve for terminal failure.

Do not generate new office locations for each choice. Consistency makes the company's changing condition easier to recognize.

## How the three levels would use the pack

| Level | Briefing / waiting | Positive outcome | Negative outcome |
| --- | --- | --- | --- |
| 1: Your First Day | Existing welcome, then thinking; new neutral while choosing. | Existing smug for keeping the monolith. | Existing concerned for microservices; new disappointed for the rewrite. |
| 2: The Dashboard Is Slow | Existing concerned and thinking; one critical-incident cue. | Existing happy after indexing; success cue. | Existing thinking for Redis's partial relief; existing concerned for the database upgrade; warning cue for the latter. |
| 3: Too Many Connections | New panic, then existing concerned. | Existing happy/celebrating after pooling. | New shocked for max connections; new disappointed for the replica. |

Any level can transition to defeated plus the failure cue when the shared failure rules end the run. Outcome reactions should follow committed choices, not reveal correctness while the player is browsing options.

## Interaction improvements that do not require generated art

- Animate numerical losses and gains and keep Jimmy's reaction synchronized with the committed result.
- Use the existing SVG architecture to show Level 1's extra deployment boundaries, Level 2's scan versus indexed lookup, and Level 3's rejected requests versus shared connections. Build accurate animated diagrams in code rather than generating static pictures of technical behavior.
- Replace continuous bobbing with brief, event-specific gestures where possible. Small transition timing and a held reaction can work with the still images above.
- Add two aligned blink frames to neutral/thinking later if desired; they need identical pose and canvas alignment. Do not generate full video clips for the first asset pass.
- Place the extra reactions inside the existing Jimmy area. Keep the compact stats dashboard and avoid introducing more permanent panels.

The first useful delivery is five transparent character images and eight short sounds. Background variants and animation frames are optional follow-up work.
