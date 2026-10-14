# ScaleLog

ScaleLog is a mobile-first system design strategy game built with Expo, React Native, TypeScript, Expo Router, Zustand, Reanimated, react-native-svg, Zod, and AsyncStorage.

## Running and testing the game

### 1. In your web browser (fastest)

```bash
npm install
npm run web
# or: npx expo start --web
```

- Opens at **`http://localhost:8081`**.
- *Audio note*: Web browsers require a user interaction (first click/tap on the page) before audio can play. After clicking anywhere on the screen, all sound effects play seamlessly.

### 2. On mobile simulators & emulators

```bash
# macOS iOS Simulator (requires Xcode)
npm run ios

# Android Emulator (requires Android Studio)
npm run android
```

### 3. On a physical device (Expo Go)

```bash
npx expo start
```
Scan the terminal QR code with the iOS Camera app or the Android Expo Go app.

### 4. Automated unit tests & typechecking

```bash
# Run test suite (simulation, 27 choice combinations, schemas, migrations)
npm test

# Run TypeScript typecheck
npm run typecheck
```

## Audio feedback & sound test walkthrough

Background music uses the licensed ambient tracks in `assets/audio/music/`. The three-track playlist starts at a varied track, advances through the set, and loops. The `MUSIC ON` / `MUSIC OFF` button stays in the navigation and gameplay headers; the Background Music switch and volume setting are also available in Sound & haptics.

ScaleLog includes 17 original effects in `assets/audio/designed/`, registered in `src/game/feedback/soundRegistry.ts`. The earlier MP3 assets are preserved but are no longer bundled. Rebuild the replacements with `python3 scripts/build-sounds.py` (standard library only).

The palette uses muted tactile clicks and warm, related chimes. Each WAV has a rounded attack, a clean release, and 12–17 dB of peak headroom. Per-cue volume trims, repeat cooldowns, and separate UI/event lanes keep navigation quiet and prevent event sounds from stacking. Muting also cancels pending playback.

| Sound ID | File (under `assets/audio/designed/`) | Interaction |
|---|---|---|
| `uiTap` | `tap.wav` | Buttons, navigation, modal close |
| `toggleSwitch` | `switch.wav` | Settings and company details |
| `tabSelect` | `tab-select.wav` | Decision tabs |
| `hintOpen` | `hint-open.wav` | Byte hints, with a distinct two-note motif |
| `choiceSelected` | `choice-select.wav` | Confirming a decision |
| `choiceSuccess` | `success.wav` | Recommended outcome |
| `choiceWarning` | `warning.wav` | Risky or failed outcome |
| `incidentCritical` | `incident-critical.wav` | Critical incident entry |
| `incidentWarning` | `incident-warning.wav` | Warning incident entry |
| `architectureNodeAdded` | `node-added.wav` | Architecture component added |
| `architectureNodeFailed` | `node-failed.wav` | Architecture component fails |
| `xpGain` | `xp.wav` | Positive XP at +180 ms |
| `levelComplete` | `level-complete.wav` | Successful handoff at +650 ms; silent on setbacks |
| `awardUnlocked` | `award-unlock.wav` | Future milestone at +1450 ms, after the completion tail |
| `metricImproved` | `metric-improved.wav` | Available for future metric animations |
| `metricWorsened` | `metric-worsened.wav` | Available for future metric animations |
| `cashSpent` | `cash-spent.wav` | Available for future resource animations |

### Recommended in-game sound testing path

1. **Controls & Settings**: Tap the gear icon in the top right to open **Settings**. Flip the **Sound Effects** switch to hear `toggleSwitch`. Tap **Back** to hear `uiTap`.
2. **Hints & Decision Tabs**: Enter Level 1 (*"Your First Day"*). Switch between **Option 1, 2, and 3** in the Decision Deck to hear `tabSelect`. Tap **"Ask Byte for a hint"** to hear `hintOpen`. Toggle **"MORE +"** on the top company card to hear `toggleSwitch`.
3. **Architecture & Outcomes**: Tap **"Choose this path"** to hear `choiceSelected`. Watch the rewire modal appear to hear `architectureNodeAdded`. On the outcome screen, hear `choiceSuccess` (for recommended paths) or `choiceWarning` (for risky paths).
4. **Progression & XP**: On the chapter handoff screen, hear `xpGain` as positive XP appears, followed by `levelComplete` on successful handoffs. Setbacks do not play the success motif.
5. **Incident Alerts**: Proceed to Level 2 (*"The Dashboard Is Slow"*) or Level 3 (*"Too Many Connections"*) to hear the deep `incidentCritical` server alert pulse upon entry.

## Deploy the web build to Vercel

The repository includes `vercel.json`. Vercel runs `npx expo export --platform web` and serves the generated `dist` directory.

Vercel Web Analytics is mounted once in the root layout for web builds. Enable **Analytics** for the Vercel project, then deploy the updated code to start collecting visitors and page views. Native builds omit the analytics SDK. No analytics API key or additional environment variable is needed.

## Content architecture

- `src/domain/` contains the data types and Zod validation.
- `src/campaigns/startup-cto/levels/` contains one file per level.
- `src/store/gameStore.ts` contains the persisted game state and choice engine.
- `src/ui/components/ArchitectureCanvas.tsx` renders architecture JSON with SVG nodes, arrows, and incident states.
- `app/` contains only the route-level composition for the screens.

Startup CTO contains 36 playable levels across six eras, taking Cartline from a Laravel/PostgreSQL MVP to a bounded, reviewed launch for millions of registered users. The ending reflects the architecture actually built. Progress is local to the device/browser and can be reset from the main menu developer options.

## Company simulation

Cartline starts with $40,000 and CTO confidence of 70/100. Each decision advances one month: cash pays the upfront cost once, then collects the previous month's recurring revenue and pays the updated monthly burn. New revenue begins the following month. Choice-specific growth, trust, reliability, and operational load persist between levels.

Poor choices deduct XP (floored at zero) and CTO confidence. Good decisions can rebuild confidence. A run ends when cash reaches zero, confidence or customer trust reaches 20, reliability reaches 35, or operational load reaches 85. Having no affordable response to the next incident also ends the run. Failed runs cannot unlock or play further levels; the summary offers a campaign reset.

The company summary shows its growth stage, health, runway, and latest decision. Player & company includes the full monthly decision history. Incident reviews show the company as it was at that level's start.

Save version 6 adds free campaign completion certificates while retaining version 5 financial and history snapshots. Existing three-level saves unlock Level 4 without refilling cash or replaying decisions. Older-version migration rebuilds recorded choices with the shared rules and stops at failure; profiles remain intact.

Completing Startup CTO unlocks a personalized, high-resolution certificate with a LinkedIn caption and ScaleLog referral link. Certificates survive campaign resets. See [certificate behavior and marketing URL configuration](docs/certificates.md) and the [sample certificate](docs/assets/certificate-preview.png).

Run `npm test` for the original 27 opening combinations, complete routes, 120 deterministic mixed playthroughs, every new response, persistence and failures. Run `npm run typecheck`, `npm run lint`, and `npm run validate:campaign`. See [the campaign report](docs/startup-cto-report.md), [progression plan](docs/startup-cto-progression.md), and [technical review](docs/startup-cto-technical-review.md).

## Adding levels

See [Adding campaign levels](docs/adding-levels.md). Append each level to the ordered manifest; progression links are generated automatically. Choice validation enforces penalties and growth tradeoffs. Existing saves can continue into newly added content without resetting their company. Shared cash, failure, summary, and history rules apply to every registered level.
