// Exercise the real TypeScript campaign and Zustand store without a native runtime.
const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
const saved = new Map();
const originalLoad = Module._load;
Module._load = function (id, parent, main) {
  if (id === '@react-native-async-storage/async-storage') return {
    getItem: async (key) => saved.get(key) ?? null,
    setItem: async (key, value) => { saved.set(key, value); },
    removeItem: async (key) => { saved.delete(key); },
  };
  return originalLoad.call(this, id.startsWith('@/') ? path.join(root, 'src', id.slice(2)) : id, parent, main);
};
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
}).outputText, filename);
const { allLevels, campaigns } = require('../src/campaigns');
const { useGameStore: store, useSaveStatus, getCompanyAtLevelStart } = require('../src/store/gameStore');
const { resolveDecision, getCompanySummary, getFailureReason } = require('../src/domain/simulation');
const { validateLevel } = require('../src/domain/schemas');
const fresh = () => store.getState().resetCampaign('startup-cto');
const choose = (index, id) => store.getState().chooseChoice(allLevels[index], allLevels[index].choices.find(c => c.id === id));

// Finish initial async hydration before manipulating this shared test store.
test.before(async () => { await store.persist.rehydrate(); });
test.beforeEach(fresh);

test('feedback settings persist safely and level feedback stays optional and typed', () => {
  allLevels.forEach(level => assert.equal(validateLevel(level).id, level.id));
  assert.throws(() => validateLevel({ ...allLevels[0], incidentFeedback: { sound: 'made-up-sound' } }));
  assert.throws(() => validateLevel({
    ...allLevels[0],
    choices: [{ ...allLevels[0].choices[0], feedback: { haptic: 'buzz' } }, ...allLevels[0].choices.slice(1)],
  }));

  store.getState().updateAudioSettings({ soundEnabled: false, sfxVolume: 2, musicVolume: -1 });
  assert.deepEqual(store.getState().audioSettings, {
    soundEnabled: false, musicEnabled: true, hapticsEnabled: true, sfxVolume: 1, musicVolume: 0,
  });
  const migrated = store.persist.getOptions().migrate({ audioSettings: { soundEnabled: false, sfxVolume: 0.4 } }, 4);
  assert.deepEqual(migrated.audioSettings, {
    soundEnabled: false, musicEnabled: true, hapticsEnabled: true, sfxVolume: 0.4, musicVolume: 0.3,
  });
  store.getState().updateAudioSettings({ soundEnabled: true, musicEnabled: true, hapticsEnabled: true, sfxVolume: 0.8, musicVolume: 0.3 });
});

test('recommended path survives, charges one month and caps health scores', () => {
  allLevels.slice(0, 3).forEach((level, i) => assert.equal(choose(i, level.choices.find(c => c.tone === 'recommended').id), true));
  const state = store.getState();
  assert.equal(state.failureReason, undefined);
  assert.equal(state.company.cash, 34600);
  assert.equal(state.player.ctoXp, 340);
  assert.equal(state.company.reliability, 100);
  assert.equal(state.history.length, 3);
  assert.equal(getCompanySummary(state.company, state.player.confidence, 3).stage, 'Scaling');
});

test('a first bad choice loses confidence, never rewards XP, and changes growth', () => {
  assert.equal(choose(0, 'rewrite-backend'), true);
  const state = store.getState();
  assert.equal(state.player.ctoXp, 0);
  assert.equal(state.player.confidence, 40);
  assert.equal(state.company.cash, 15000); // 40K - 18K - (9K burn - 2K prior revenue)
  assert.equal(state.company.users, 3000);
  assert.equal(state.company.monthlyRevenue, 2800);
  assert.equal(state.lastOutcome.operatingCashFlow, -7000);
  assert.equal(getCompanySummary(state.company, 40, 1).health, 'Under pressure');
});

test('a costly first mistake can still recover with good decisions', () => {
  choose(0, 'rewrite-backend'); choose(1, 'add-index'); choose(2, 'pool-connections');
  assert.equal(store.getState().failureReason, undefined);
  assert.equal(store.getState().company.cash, 2600);
  assert.equal(store.getState().player.confidence, 60);
});

test('bad decisions remove previously earned XP', () => {
  choose(0, 'keep-monolith'); choose(1, 'upgrade-database');
  assert.equal(store.getState().player.ctoXp, 45);
  assert.equal(store.getState().lastOutcome.xpEarned, -35);
});

test('repeated bad decisions end the CTO tenure and lock progression', () => {
  choose(0, 'split-services'); choose(1, 'upgrade-database');
  const state = store.getState();
  assert.match(state.failureReason, /removed you as CTO/);
  assert.equal(state.lastOutcome.nextLevel, undefined);
  assert.equal(state.player.unlockedLevels.includes('startup-003'), false);
  assert.equal(choose(2, 'pool-connections'), false);
  assert.deepEqual(store.getState(), state);
});

test('cash exhaustion is a reachable failure independent of confidence', () => {
  choose(0, 'rewrite-backend'); choose(1, 'add-redis'); choose(2, 'add-database');
  assert.equal(store.getState().company.cash, 0);
  assert.match(store.getState().failureReason, /Cash exhausted/);
});

test('duplicate, locked, forged and unaffordable choices cannot bypass rules', () => {
  assert.equal(choose(1, 'add-index'), false);
  assert.equal(store.getState().chooseChoice(allLevels[0], { id: 'fake', cost: 0 }), false);
  assert.equal(store.getState().chooseChoice(allLevels[0], { ...allLevels[0].choices[1], cost: 0, effects: { xp: 10000 } }), true);
  assert.equal(store.getState().player.ctoXp, 0);
  assert.equal(store.getState().company.cash, 20400);
  const after = store.getState();
  assert.equal(choose(0, 'keep-monolith'), false);
  assert.deepEqual(store.getState(), after);
  store.setState({ company: { ...after.company, cash: 100 } });
  assert.equal(choose(1, 'add-index'), false);
});

test('historical company snapshots agree with the live decision ledger', () => {
  choose(0, 'split-services'); choose(1, 'add-index');
  const state = store.getState();
  assert.deepEqual(getCompanyAtLevelStart(state, 'startup-002'), state.history[0].companyAfter);
  assert.deepEqual(getCompanyAtLevelStart(state, 'startup-003'), state.company);
  assert.deepEqual(state.history[0].companyBefore, campaigns[0].story.startingCompany);
  assert.deepEqual(state.history[1].companyBefore, state.history[0].companyAfter);
});

test('reset clears failure, history and consequences but keeps the profile', () => {
  store.getState().setProfile({ name: 'Tester', age: 32 });
  choose(0, 'split-services'); choose(1, 'upgrade-database'); fresh();
  const state = store.getState();
  assert.equal(state.failureReason, undefined);
  assert.equal(state.lastOutcome, undefined);
  assert.equal(state.history.length, 0);
  assert.equal(state.player.confidence, 70);
  assert.equal(state.profile.name, 'Tester');
  assert.equal(choose(0, 'keep-monolith'), true);
});

test('migration replays old decisions and truncates progression at failure', () => {
  const legacy = { activeCampaignId: 'startup-cto', profile: { name: 'Legacy', age: null }, briefSeen: true,
    company: { cash: 100000 }, player: { ctoXp: 275 },
    progress: { selectedChoices: { 'startup-001': 'split-services', 'startup-002': 'upgrade-database', 'startup-003': 'pool-connections' } } };
  const migrated = store.persist.getOptions().migrate(legacy, 3);
  assert.equal(migrated.player.ctoXp, 0);
  assert.equal(migrated.history.length, 2);
  assert.match(migrated.failureReason, /removed you as CTO/);
  assert.equal(migrated.briefSeen, true);
  assert.equal(migrated.profile.name, 'Legacy');
  assert.equal(migrated.progress.selectedChoices['startup-003'], undefined);
});

test('persisted failure and ledger survive reload and campaign selection', async () => {
  choose(0, 'split-services'); choose(1, 'upgrade-database');
  const expected = JSON.parse(JSON.stringify(store.getState()));
  await store.persist.rehydrate();
  store.getState().selectCampaign('startup-cto');
  assert.equal(store.getState().failureReason, expected.failureReason);
  assert.deepEqual(store.getState().history, expected.history);
  assert.equal(choose(2, 'pool-connections'), false);
});

test('failure thresholds and health limits include their boundaries', () => {
  const company = campaigns[0].story.startingCompany;
  for (const [key, value, reason] of [['cash', 0, /Cash/], ['customerTrust', 20, /trust/], ['reliability', 35, /outages/], ['complexity', 85, /overwhelmed/]]) {
    assert.match(getFailureReason({ ...company, [key]: value }, 70), reason);
  }
  assert.match(getFailureReason(company, 20), /board/);
  const result = resolveDecision({ ...company, reliability: 99, customerTrust: 99, complexity: 0 }, 0, 99, allLevels[0], allLevels[0].choices[0]);
  assert.equal(result.company.reliability, 100);
  assert.equal(result.company.customerTrust, 100);
  assert.equal(result.company.complexity, 0);
  assert.equal(result.confidence, 100);
});

test('all 27 choice combinations produce consistent histories and terminal states', () => {
  let failed = 0, survived = 0;
  for (const a of allLevels[0].choices) for (const b of allLevels[1].choices) for (const c of allLevels[2].choices) {
    fresh();
    for (const [i, choice] of [a, b, c].entries()) {
      const before = store.getState();
      const accepted = before.chooseChoice(allLevels[i], choice);
      if (before.failureReason || before.company.cash < choice.cost) { assert.equal(accepted, false); break; }
      assert.equal(accepted, true);
      const after = store.getState();
      assert.deepEqual(after.lastOutcome.companyBefore, before.company);
      assert.deepEqual(after.lastOutcome.companyAfter, after.company);
      assert.equal(after.history.length, i + 1);
      if (['risky', 'overkill'].includes(choice.tone)) assert.ok(after.player.ctoXp <= before.player.ctoXp);
    }
    if (store.getState().failureReason) failed++; else survived++;
  }
  assert.ok(failed > 0 && survived > 0);
});

const { defineCampaignLevels } = require('../src/domain/campaignLevels');
const { getChoiceRewards } = require('../src/domain/simulation');
const { levelMap } = require('../src/campaigns');

function futureLevel(badEffects = {}) {
  const template = allLevels[2];
  return {
    ...template, id: 'future-fourth-level', levelNumber: 4, nextLevel: undefined, unlocks: [],
    choices: [template.choices[0], {
      ...template.choices[1], effects: { cash: -1000, users: -100, monthlyRevenue: -50, ...badEffects },
    }],
  };
}

async function withNewLevels(extraLevels, run) {
  const original = [...allLevels];
  const originalIds = campaigns[0].levelIds;
  const extended = defineCampaignLevels('startup-cto', [...original.slice(0, 3), ...extraLevels]);
  allLevels.splice(0, allLevels.length, ...extended);
  campaigns[0].levelIds = extended.map(level => level.id);
  extended.forEach(level => { levelMap[level.id] = level; });
  try { await run(); }
  finally {
    extraLevels.forEach(level => { delete levelMap[level.id]; });
    allLevels.splice(0, allLevels.length, ...original);
    original.forEach(level => { levelMap[level.id] = level; });
    campaigns[0].levelIds = originalIds;
    fresh();
  }
}

function finishCurrentChapter() {
  allLevels.slice(0, 3).forEach((level, i) => assert.equal(choose(i, level.choices.find(choice => choice.tone === 'recommended').id), true));
}

test('new level validation rejects rewards or missing growth consequences on bad choices', () => {
  assert.equal(validateLevel(futureLevel()).id, 'future-fourth-level');
  for (const effects of [
    { xp: 10 }, { xp: 0 }, { confidence: 10 }, { confidence: 0 },
    { users: 3000, monthlyRevenue: 1500 }, // identical to the recommended growth
    { users: 4000, monthlyRevenue: -50 }, // better on one growth axis
    { cash: 0 },
  ]) assert.throws(() => validateLevel(futureLevel(effects)));
  assert.throws(() => validateLevel({ ...futureLevel(), choices: futureLevel().choices.map(choice => ({ ...choice, tone: 'neutral' })) }));
});

test('future bad choices use shared negative defaults and previews match the engine', () => {
  const level = validateLevel(futureLevel());
  const choice = level.choices[1];
  assert.deepEqual(getChoiceRewards(choice, level.xpReward), { xp: -20, confidence: -25 });
  const before = campaigns[0].story.startingCompany;
  const result = resolveDecision(before, 100, 70, level, choice);
  assert.equal(result.ctoXp, 80);
  assert.equal(result.confidence, 45);
  assert.equal(result.company.users, before.users - 100);
  assert.equal(result.company.monthlyRevenue, before.monthlyRevenue - 50);
  assert.equal(result.company.cash, 33200); // 40K - 1K upfront - 5.8K operations
  // Even bypassing content validation cannot turn a bad choice into a leadership reward.
  const malformed = { ...choice, effects: { ...choice.effects, xp: 500, confidence: 50 } };
  const guarded = resolveDecision(before, 100, 70, level, malformed);
  assert.ok(guarded.ctoXp < 100 && guarded.confidence < 70);
});

test('campaign manifest generates future links and rejects duplicate or out-of-order levels', () => {
  const fourth = futureLevel();
  const levels = defineCampaignLevels('startup-cto', [...allLevels.slice(0, 3), fourth]);
  assert.equal(levels[2].nextLevel, fourth.id);
  assert.deepEqual(levels[2].unlocks, [fourth.id]);
  assert.equal(levels[3].nextLevel, undefined);
  assert.throws(() => defineCampaignLevels('startup-cto', [...allLevels.slice(0, 3), { ...fourth, id: allLevels[0].id }]));
  assert.throws(() => defineCampaignLevels('startup-cto', [...allLevels.slice(0, 3), { ...fourth, campaignId: 'wrong' }]));
  assert.throws(() => defineCampaignLevels('startup-cto', [...allLevels.slice(0, 3), { ...fourth, levelNumber: 5 }]));
});

test('appended levels unlock on reload with live company, XP and history intact', async () => {
  finishCurrentChapter();
  const before = store.getState();
  await withNewLevels([futureLevel()], async () => {
    await store.persist.rehydrate();
    const resumed = store.getState();
    assert.equal(resumed.player.currentLevel, 'future-fourth-level');
    assert.equal(resumed.lastOutcome.nextLevel, 'future-fourth-level');
    assert.ok(resumed.player.unlockedLevels.includes('future-fourth-level'));
    assert.deepEqual(resumed.company, before.company);
    assert.deepEqual(resumed.history, JSON.parse(JSON.stringify(before.history)));
    assert.equal(resumed.player.ctoXp, before.player.ctoXp);
    assert.deepEqual(getCompanyAtLevelStart(resumed, 'future-fourth-level'), before.company);
    assert.equal(choose(3, allLevels[3].choices[1].id), true);
    const after = store.getState();
    assert.equal(after.player.ctoXp, before.player.ctoXp - 20);
    assert.equal(after.player.confidence, before.player.confidence - 25);
    assert.equal(after.company.cash, before.company.cash - 1000 + before.company.monthlyRevenue - before.company.monthlyBurn);
    assert.equal(after.history.length, 4);
    assert.deepEqual(after.history[3].companyBefore, before.company);
    await store.persist.rehydrate();
    assert.deepEqual(store.getState().history, JSON.parse(JSON.stringify(after.history)));
    assert.deepEqual(store.getState().company, after.company);
  });
});

test('future incidents can cause each failure type and reset back to $40,000', async () => {
  for (const [effects, reason] of [
    [{ monthlyBurn: 100000 }, /Cash exhausted/],
    [{ confidence: -100 }, /removed you as CTO/],
    [{ customerTrust: -100 }, /trust has collapsed/],
    [{ reliability: -100 }, /outages/],
    [{ complexity: 100 }, /overwhelmed/],
  ]) {
    fresh(); finishCurrentChapter();
    const fourth = futureLevel(effects);
    const fifth = { ...futureLevel(), id: 'future-fifth-level', levelNumber: 5 };
    await withNewLevels([fourth, fifth], async () => {
      store.getState().selectCampaign('startup-cto');
      assert.equal(choose(3, allLevels[3].choices[1].id), true);
      assert.match(store.getState().failureReason, reason);
      assert.equal(store.getState().lastOutcome.nextLevel, undefined);
      assert.equal(choose(4, allLevels[4].choices[0].id), false);
      await store.persist.rehydrate();
      assert.match(store.getState().failureReason, reason);
      assert.equal(store.getState().player.unlockedLevels.includes(fifth.id), false);
      fresh();
      assert.equal(store.getState().company.cash, 40000);
      assert.equal(store.getState().failureReason, undefined);
      assert.equal(store.getState().history.length, 0);
    });
  }
});

test('new content cannot revive a previously failed run', async () => {
  choose(0, 'split-services'); choose(1, 'upgrade-database');
  const before = store.getState();
  await withNewLevels([futureLevel()], async () => {
    await store.persist.rehydrate();
    assert.equal(store.getState().failureReason, before.failureReason);
    assert.deepEqual(store.getState().player.unlockedLevels, before.player.unlockedLevels);
    assert.equal(choose(3, allLevels[3].choices[0].id), false);
  });
});

test('an unaffordable newly released incident ends the run instead of leaving it stuck', async () => {
  finishCurrentChapter();
  const fourth = futureLevel();
  fourth.choices = fourth.choices.map(choice => ({ ...choice, cost: 50000, effects: { ...choice.effects, cash: -50000 } }));
  await withNewLevels([fourth], async () => {
    await store.persist.rehydrate();
    assert.match(store.getState().failureReason, /not enough cash/);
    assert.equal(store.getState().lastOutcome.nextLevel, undefined);
    assert.equal(choose(3, allLevels[3].choices[0].id), false);
    assert.equal(store.getState().history.length, 3);
    fresh();
    assert.equal(store.getState().company.cash, 40000);
  });
});

const { getArchitectureAtLevelStart, getLevelAtStart } = require('../src/store/gameStore');
const { applyArchitectureChanges } = require('../src/domain/architecture');
const { resolveLevel } = require('../src/domain/levelVariants');
const { getCampaignEnding } = require('../src/domain/campaignEnding');
const { premiumLaunchCapabilities } = require('../src/campaigns/startup-cto/launchContract');

function playRoute(pick = () => 'recommended', end = 36) {
  for (const source of allLevels.slice(0, end)) {
    const state = store.getState();
    if (state.failureReason) break;
    const level = getLevelAtStart(state, source.id);
    const requested = pick(level, state);
    const choice = level.choices.find(c => c.id === requested || c.tone === requested) ?? level.choices[0];
    const beforeGraph = JSON.parse(JSON.stringify(state.architecture));
    assert.ok(state.company.cash >= choice.cost, `${level.id}: cannot afford ${choice.id}`);
    assert.equal(state.chooseChoice(source, choice), true, `${level.id}: decision accepted`);
    const after = store.getState();
    assert.deepEqual(state.architecture, beforeGraph, 'previous graph stays immutable');
    assert.deepEqual(after.lastOutcome.companyBefore, state.company);
    assert.deepEqual(after.lastOutcome.architectureAfter, after.architecture);
    assert.equal(after.company.cash, Math.max(0, state.company.cash - choice.cost + state.company.monthlyRevenue - after.company.monthlyBurn));
    for (const value of Object.values(after.company)) assert.ok(Number.isFinite(value) && value >= 0, `${level.id}: finite nonnegative state`);
    for (const score of ['reliability', 'customerTrust', 'complexity']) assert.ok(after.company[score] <= 100);
    assert.equal(new Set(after.architecture.nodes.map(n => n.id)).size, after.architecture.nodes.length);
    for (const edge of after.architecture.edges) {
      assert.ok(after.architecture.nodes.some(n => n.id === edge.from), `${level.id}: missing edge source ${edge.from}`);
      assert.ok(after.architecture.nodes.some(n => n.id === edge.to), `${level.id}: missing edge target ${edge.to}`);
    }
  }
  return store.getState();
}

test('published campaign has 36 consecutive unique levels, six eras, and three valid choices each', () => {
  assert.equal(allLevels.length, 36);
  assert.equal(campaigns[0].totalLevels, 36);
  assert.equal(new Set(allLevels.map(l => l.id)).size, 36);
  allLevels.forEach((level, index) => {
    assert.equal(level.levelNumber, index + 1);
    assert.equal(level.chapter, Math.ceil((index + 1) / 6));
    assert.equal(level.choices.length, 3);
    assert.equal(level.nextLevel, allLevels[index + 1]?.id);
    assert.deepEqual(level.unlocks, allLevels[index + 1] ? [allLevels[index + 1].id] : []);
    validateLevel(level);
  });
});

test('complete recommended route funds hiring and earns only its bounded launch envelope', async () => {
  const state = playRoute();
  assert.equal(state.history.length, 36);
  assert.equal(state.failureReason, undefined);
  assert.equal(state.company.users, 4000000);
  assert.equal(state.company.engineers, 27);
  assert.equal(state.company.cash, 13954600);
  assert.equal(state.company.monthlyBurn, 408100);
  assert.equal(state.company.monthlyRevenue, 1950000);
  assert.equal(state.lastOutcome.nextLevel, undefined);
  assert.ok(state.player.awards[0].unlocked);
  assert.ok(premiumLaunchCapabilities.every(cap => state.architecture.capabilities.includes(cap)));
  const ending = getCampaignEnding(state.architecture, state.company, premiumLaunchCapabilities);
  assert.equal(ending.qualified, true);
  assert.equal(ending.gaps.length, 0);
  assert.ok(state.architecture.nodes.some(node => node.id === 'monolith' && node.type === 'monolith'));
  assert.ok(!state.architecture.nodes.some(node => node.id === 'orders-service'), 'selective extraction retains the core');
  const expected = JSON.parse(JSON.stringify(state));
  await store.persist.rehydrate();
  store.getState().selectCampaign('startup-cto');
  assert.deepEqual(store.getState().company, expected.company);
  assert.deepEqual(store.getState().architecture, expected.architecture);
  assert.deepEqual(store.getState().history, expected.history);
});

test('each milestone replays company, paid recovery and topology from the actual ledger', () => {
  const state = playRoute(level => level.levelNumber >= 4 && level.levelNumber % 3 === 1 ? 'neutral' : 'recommended');
  assert.equal(state.failureReason, undefined);
  for (const n of [4, 6, 12, 18, 24, 30, 36]) {
    const id = allLevels[n - 1].id;
    assert.deepEqual(getCompanyAtLevelStart(state, id), state.history[n - 1].companyBefore, `level ${n} company replay`);
    assert.deepEqual(getArchitectureAtLevelStart(state, id), state.history[n - 1].architectureBefore, `level ${n} architecture replay`);
  }
});

test('neutral route stays playable with a genuinely different constrained ending', () => {
  const state = playRoute(level => level.levelNumber <= 3 ? 'recommended' : 'neutral');
  assert.equal(state.failureReason, undefined);
  assert.equal(state.history.length, 36);
  assert.equal(state.company.engineers, 27);
  assert.ok(!state.architecture.capabilities.includes('regional-dr'));
  assert.ok(!state.architecture.nodes.some(n => n.id === 'media'));
  const ending = getCampaignEnding(state.architecture, state.company, premiumLaunchCapabilities);
  assert.equal(ending.qualified, false);
  assert.ok(ending.gaps.includes('regional dr'));
});

test('a single poor but survivable middle-game decision can recover', () => {
  const state = playRoute(level => level.levelNumber === 12 ? 'risky' : 'recommended');
  assert.equal(state.failureReason, undefined);
  assert.equal(state.history.length, 36);
  assert.ok(state.history[11].confidenceAfter < state.history[11].confidenceBefore);
  assert.ok(state.company.cash > 0);
});

test('expensive legacy rewrite can continue on the deliberate runway-saving response', () => {
  const state = playRoute(level => level.levelNumber === 1 ? 'rewrite-backend' : level.levelNumber === 4 ? 'neutral' : 'recommended');
  assert.equal(state.failureReason, undefined);
  assert.equal(state.history.length, 36);
  assert.ok(state.architecture.nodes.some(n => n.id === 'monolith' && n.label === 'Go backend'));
});

test('conditional incidents replace nonexistent production components with alternate evidence', () => {
  for (const n of [5, 6, 8, 12, 14, 16, 17, 18, 20, 22, 26, 27, 28, 30, 32, 33, 35, 36]) {
    const level = allLevels[n - 1];
    const resolved = resolveLevel(level, { nodes: [], edges: [] });
    assert.notEqual(resolved.description, level.description, `level ${n} alternate incident`);
    assert.notDeepEqual(resolved.metrics, level.metrics);
    validateLevel(resolved);
  }
});

test('cache bypass persists and later adoption does not replace existing topology', () => {
  const state = playRoute(level => level.levelNumber === 8 ? 'neutral' : 'recommended', 11);
  assert.ok(!state.architecture.capabilities.includes('catalogue-cache'));
  const incident = getLevelAtStart(state, 'startup-012');
  assert.match(incident.description, /absent or bypassed/);
  const beforeIds = state.architecture.nodes.map(n => n.id);
  assert.equal(state.chooseChoice(incident, incident.choices[0]), true);
  assert.ok(store.getState().architecture.capabilities.includes('catalogue-cache'));
  for (const id of beforeIds) assert.ok(store.getState().architecture.nodes.some(n => n.id === id));
});

test('state-dependent repair price is canonical even if the caller forges an unmodified choice', () => {
  const state = playRoute(level => level.levelNumber === 13 ? 'neutral' : 'recommended', 16);
  const source = allLevels[16];
  const resolved = getLevelAtStart(state, source.id);
  assert.ok(resolved.choices[0].cost > source.choices[0].cost);
  const expected = resolveDecision(state.company, state.player.ctoXp, state.player.confidence, resolved, resolved.choices[0]);
  assert.equal(state.chooseChoice(source, { ...source.choices[0], cost: 0 }), true);
  assert.deepEqual(store.getState().company, expected.company);
  assert.ok(store.getState().architecture.capabilities.includes('job-queue'));
  assert.match(store.getState().lastOutcome.note, /Prerequisite work completed/);
});

test('the finale cannot grant missing capabilities or an unsupported premium launch', () => {
  const state = playRoute(level => level.levelNumber === 34 ? 'neutral' : 'recommended', 35);
  const source = allLevels[35];
  const resolved = getLevelAtStart(state, source.id);
  assert.match(resolved.description, /missing part of the premium/);
  assert.equal(state.chooseChoice(source, source.choices[0]), true);
  const ending = store.getState();
  assert.equal(ending.history.length, 36);
  assert.ok(!ending.architecture.capabilities.includes('regional-dr'));
  assert.ok(!ending.architecture.capabilities.includes('launch-qualified'));
  assert.match(ending.lastOutcome.title, /honest launch/);
});

test('catastrophic final decision can end a strong company and blocks retries', () => {
  const state = playRoute(level => level.levelNumber === 36 ? 'risky' : 'recommended');
  assert.match(state.failureReason, /outages/);
  assert.equal(state.lastOutcome.nextLevel, undefined);
  assert.equal(state.chooseChoice(allLevels[35], allLevels[35].choices[0]), false);
});

test('legacy three-level saves unlock the real fourth level without reset or replay', async () => {
  finishCurrentChapter();
  const original = JSON.parse(JSON.stringify(store.getState()));
  original.player.currentLevel = 'startup-003';
  original.player.unlockedLevels = allLevels.slice(0, 3).map(l => l.id);
  delete original.lastOutcome.nextLevel;
  delete original.architecture.capabilities;
  original.history.forEach(entry => { delete entry.architectureBefore; delete entry.architectureAfter; delete entry.incidentDescription; });
  saved.set('scalelog-progress', JSON.stringify({ state: original, version: 5 }));
  await store.persist.rehydrate();
  const resumed = store.getState();
  assert.equal(resumed.player.currentLevel, 'startup-004');
  assert.equal(resumed.lastOutcome.nextLevel, 'startup-004');
  assert.deepEqual(resumed.company, original.company);
  assert.deepEqual(resumed.history, original.history);
  assert.equal(resumed.chooseChoice(allLevels[3], allLevels[3].choices[0]), true);
});

test('capability changes are immutable, idempotent, and accept legacy graphs', () => {
  const base = allLevels[0].architectureBefore;
  const serialized = JSON.stringify(base);
  const changes = [{ type: 'setCapability', capability: 'example', enabled: true }];
  const once = applyArchitectureChanges(base, changes);
  assert.deepEqual(applyArchitectureChanges(once, changes), once);
  assert.equal(JSON.stringify(base), serialized);
  assert.deepEqual(applyArchitectureChanges(once, [{ type: 'setCapability', capability: 'example', enabled: false }]).capabilities, []);
});

test('validation rejects nonfinite effects and broken variant choice identities', () => {
  const source = allLevels[35];
  assert.throws(() => validateLevel({ ...source, choices: source.choices.map((choice, i) => i ? choice : { ...choice, effects: { ...choice.effects, users: Infinity } }) }));
  assert.throws(() => validateLevel({ ...source, variants: [{ ...source.variants[0], choices: [{ ...source.choices[0], id: 'forged' }, ...source.choices.slice(1)] }] }));
});

test('deterministic mixed playthroughs retain finite state, graph references and terminal failure', () => {
  let seed = 42636;
  const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
  let completed = 0, failed = 0;
  for (let run = 0; run < 120; run++) {
    fresh();
    const state = playRoute(level => level.levelNumber <= 3 ? 'recommended' : random() < .68 ? 'recommended' : random() < .65 ? 'neutral' : 'risky');
    if (state.failureReason) { failed++; assert.equal(state.chooseChoice(allLevels[35], allLevels[35].choices[0]), false); }
    else { completed++; assert.equal(state.history.length, 36); }
  }
  assert.ok(completed > 0 && failed > 0);
});

test('unresolved correctness hazards invalidate a premium launch even with all capacity capabilities', () => {
  const { launchHazards } = require('../src/campaigns/startup-cto/launchContract');
  const graph = { nodes: [], edges: [], capabilities: [...premiumLaunchCapabilities, 'unsafe-edge-cache'] };
  const final = resolveLevel(allLevels[35], graph);
  assert.match(final.choices[0].label, /limit the launch/);
  const ending = getCampaignEnding({ ...graph, capabilities: [...graph.capabilities, 'launch-qualified'] }, campaigns[0].story.startingCompany, premiumLaunchCapabilities, launchHazards);
  assert.equal(ending.qualified, false);
  assert.ok(ending.gaps.includes('repair unsafe edge cache'));
});

test('fixed peak capacity is a technically valid premium alternative to autoscaling', () => {
  const state = playRoute(level => level.levelNumber === 11 ? 'neutral' : 'recommended');
  assert.equal(state.failureReason, undefined);
  assert.ok(state.architecture.capabilities.includes('fixed-capacity'));
  assert.ok(!state.architecture.capabilities.includes('bounded-autoscale'));
  assert.ok(state.architecture.capabilities.includes('launch-qualified'));
});


test('every new response is reachable and preserves invariants on a complete attempted route', () => {
  let failures = 0;
  for (const source of allLevels.slice(3)) for (const response of source.choices) {
    fresh();
    const state = playRoute(level => level.id === source.id ? response.id : 'recommended');
    assert.equal(state.progress.selectedChoices[source.id], response.id);
    if (state.failureReason) failures++;
    else assert.equal(state.history.length, 36);
  }
  assert.ok(failures > 0, 'at least the deliberately catastrophic finale fails');
});


test('a surviving early service split is retained and its DB connections share the later pool', () => {
  const state = playRoute(level => level.levelNumber === 1 ? 'split-services' : level.levelNumber === 4 ? 'neutral' : 'recommended');
  assert.equal(state.failureReason, undefined);
  for (const id of ['users-service', 'orders-service', 'billing-service']) {
    assert.ok(state.architecture.nodes.some(node => node.id === id));
    assert.ok(state.architecture.edges.some(edge => edge.from === id && edge.to === 'pooler'));
    assert.ok(!state.architecture.edges.some(edge => edge.from === id && edge.to === 'postgres'));
  }
});

test('the first pool rollout actually routes database traffic through the pool', () => {
  const state = playRoute(() => 'recommended', 3);
  assert.ok(state.architecture.edges.some(e => e.from === 'pooler' && e.to === 'postgres'));
  assert.ok(!state.architecture.edges.some(e => e.from === 'monolith' && e.to === 'postgres'));
  assert.ok(state.architecture.capabilities.includes('indexed'));
  assert.ok(state.architecture.capabilities.includes('pooled'));
});

test('resuming catalogue caching clears bypass and repairs the five-second price contract', () => {
  for (const earlierChoice of ['neutral', 'risky']) {
    fresh();
    const state = playRoute(l => l.levelNumber === 8 ? earlierChoice : 'recommended', 12);
    assert.equal(state.failureReason, undefined);
    assert.ok(state.architecture.capabilities.includes('fresh-catalogue'));
    assert.ok(state.architecture.capabilities.includes('catalogue-cache'));
    assert.ok(!state.architecture.capabilities.includes('cache-bypassed'));
    assert.ok(!state.architecture.capabilities.includes('long-cache-ttl'));
  }
});

test('premium launch cannot certify an unresolved synchronous dependency cascade', () => {
  const state = playRoute(l => l.levelNumber === 26 ? 'risky' : 'recommended');
  assert.equal(state.failureReason, undefined);
  assert.ok(!state.architecture.capabilities.includes('launch-qualified'));
  assert.match(state.lastOutcome.title, /honest/i);
});

test('sharded writers retain independent HA and recovery links', () => {
  const state = playRoute(() => 'recommended', 33);
  for (const writer of ['shards', 'whale-writer']) {
    for (const recovery of ['az-standby', 'backups']) {
      assert.ok(state.architecture.edges.some(e => e.from === writer && e.to === recovery), `${writer} needs ${recovery}`);
    }
  }
  const readers = state.architecture.nodes.find(n => n.id === 'read-replica');
  assert.match(readers.subtitle, /per.writer/i, 'one physical standby cannot follow multiple primaries');
});

test('saved snapshots protect history and live previews from later content edits', () => {
  const state = playRoute(() => 'recommended', 5);
  const choice = allLevels[3].choices[0];
  const oldCost = choice.cost;
  const oldChanges = choice.architectureChanges;
  try {
    choice.cost += 9999;
    choice.architectureChanges = [];
    assert.deepEqual(getCompanyAtLevelStart(state, 'startup-005'), state.history[4].companyBefore);
    assert.deepEqual(getCompanyAtLevelStart(state, 'startup-006'), state.company);
    assert.deepEqual(getArchitectureAtLevelStart(state, 'startup-005'), state.history[4].architectureBefore);
    assert.deepEqual(getArchitectureAtLevelStart(state, 'startup-006'), state.architecture);
    assert.equal(getLevelAtStart(state, 'startup-006').description, allLevels[5].description);
  } finally { choice.cost = oldCost; choice.architectureChanges = oldChanges; }
});

test('next-level requirements cannot leave a living run with no selectable response', async () => {
  const locked = futureLevel();
  locked.choices = locked.choices.map(c => ({ ...c, requirements: [{ stat: 'users', min: 999999999 }] }));
  await withNewLevels([locked], () => {
    finishCurrentChapter();
    assert.match(store.getState().failureReason, /requirements/i);
    assert.ok(!store.getState().player.unlockedLevels.includes(locked.id));
  });
});

test('premium contract includes browse freshness and dependency isolation', () => {
  for (const missing of ['fresh-catalogue', 'dependency-bulkheads']) {
    const graph = { nodes: [], edges: [], capabilities: premiumLaunchCapabilities.filter(c => c !== missing) };
    const finale = resolveLevel(allLevels[35], graph);
    const after = applyArchitectureChanges(graph, finale.choices[0].architectureChanges);
    assert.ok(!after.capabilities.includes('launch-qualified'), missing);
  }
});

test('content validation rejects unplayable dialogue and inconsistent prerequisite definitions', () => {
  const source = allLevels[16];
  assert.throws(() => validateLevel({ ...source, dialogue: [] }));
  assert.throws(() => validateLevel({ ...source, recoveries: [...source.recoveries, source.recoveries[0]] }));
  assert.throws(() => validateLevel({ ...source, recoveries: [{ ...source.recoveries[0], architectureChanges: [] }] }));
  assert.throws(() => validateLevel({ ...source, variants: [{ ...source.variants[0], when: { missingAny: [] } }] }));
  assert.throws(() => validateLevel({ ...source, variants: [source.variants[0], source.variants[0]] }));
  assert.throws(() => validateLevel({ ...source, choices: source.choices.map(c => ({ ...c, requirements: [{ stat: 'users', min: 100, max: 50 }] })) }));
});

test('prerequisite repairs disclose recurring cost and operations burden as well as cash', () => {
  const source = allLevels[16];
  const resolved = resolveLevel(source, { nodes: [], edges: [] });
  const repair = source.recoveries[0];
  const response = resolved.choices.find(c => c.id === '017-measured');
  assert.equal(response.effects.monthlyBurn, source.choices[0].effects.monthlyBurn + repair.monthlyBurn);
  assert.match(response.tradeoff.effectReasons.monthlyBurn, /Prerequisite operating costs/);
  assert.match(response.tradeoff.effectReasons.complexity, /operations-load points/);
});

test('broker-free delivery stays a valid durable route without invented outbox infrastructure', () => {
  const state = playRoute(l => l.levelNumber === 17 ? 'neutral' : 'recommended', 26);
  assert.ok(state.architecture.capabilities.includes('durable-handoff'));
  assert.ok(!state.architecture.nodes.some(n => n.id === 'outbox-relay'));
  const level = getLevelAtStart(state, 'startup-027');
  assert.match(level.choices[0].description, /outbox or durable delivery ledger/);
  assert.ok(!level.metrics.some(m => /Outbox publish success/i.test(m.label)));
  assert.equal(state.chooseChoice(level, level.choices[0]), true);
  assert.ok(store.getState().architecture.capabilities.includes('reliable-projections'));
});

test('unindexed paths keep query debt visible at the connection incident', () => {
  const state = playRoute(l => l.levelNumber === 2 ? 'neutral' : 'recommended', 2);
  const level = getLevelAtStart(state, 'startup-003');
  assert.match(level.description, /query debt remains/);
  assert.ok(level.metrics.some(m => m.label === 'Query debt'));
});

test('a whale split on a single-writer route installs real directory routing', () => {
  const state = playRoute(l => l.levelNumber === 32 ? 'neutral' : 'recommended', 33);
  assert.equal(state.failureReason, undefined);
  assert.ok(!state.architecture.capabilities.includes('tenant-shards'));
  assert.ok(state.architecture.nodes.some(n => n.id === 'shard-directory'));
  assert.ok(state.architecture.edges.some(e => e.from === 'shard-directory' && e.to === 'whale-writer'));
});

test('save loading waits for storage and a failed read can retry without overwriting progress', async () => {
  finishCurrentChapter();
  const expected = JSON.parse(JSON.stringify(store.getState()));
  const storage = store.persist.getOptions().storage;
  const stored = await storage.getItem('scalelog-progress');
  let release;
  let writes = 0;
  try {
    store.persist.setOptions({ storage: {
      ...storage,
      getItem: () => new Promise(resolve => { release = resolve; }),
      setItem: async () => { writes++; },
    } });
    const loading = store.persist.rehydrate();
    assert.equal(useSaveStatus.getState().status, 'loading');
    assert.equal(store.persist.hasHydrated(), false);
    release(stored);
    await loading;
    assert.equal(useSaveStatus.getState().status, 'ready');
    assert.equal(store.persist.hasHydrated(), true);
    assert.deepEqual(store.getState().history, expected.history);

    store.persist.setOptions({ storage: {
      ...storage,
      getItem: async () => { throw new Error('Temporary storage failure'); },
      setItem: async () => { writes++; },
    } });
    await store.persist.rehydrate();
    assert.equal(useSaveStatus.getState().status, 'error');
    assert.equal(store.persist.hasHydrated(), false);
    assert.equal(writes, 0, 'reporting hydration status must never replace a saved run');
    assert.deepEqual(store.getState().company, expected.company);
  } finally {
    store.persist.setOptions({ storage });
    await store.persist.rehydrate();
  }
  assert.equal(useSaveStatus.getState().status, 'ready');
  assert.deepEqual(store.getState().history, expected.history);
});

test('every opening architecture preview commits exactly the graph that was shown', () => {
  for (let index = 0; index < 3; index++) for (const response of allLevels[index].choices) {
    fresh();
    for (let prior = 0; prior < index; prior++) choose(prior, allLevels[prior].choices[0].id);
    const before = store.getState();
    const level = getLevelAtStart(before, allLevels[index].id);
    const choice = level.choices.find(c => c.id === response.id);
    const graph = getArchitectureAtLevelStart(before, level.id);
    const preview = applyArchitectureChanges(graph, choice.architectureChanges);
    assert.equal(before.chooseChoice(level, choice), true);
    const after = store.getState();
    assert.deepEqual(after.architecture, preview, `${level.id}/${choice.id}`);
    assert.deepEqual(after.lastOutcome.incidentArchitectureBefore, graph);
    assert.deepEqual(after.lastOutcome.architectureBefore, before.architecture, 'incoming ledger topology is retained separately');
    assert.equal(after.lastOutcome.choiceCost, choice.cost);
  }
});

test('historical incident diagnostics, description and price survive later content edits and reload', async () => {
  choose(0, 'keep-monolith');
  const incident = getLevelAtStart(store.getState(), 'startup-002');
  const graph = getArchitectureAtLevelStart(store.getState(), incident.id);
  choose(1, 'add-index');
  const source = allLevels[1];
  const originalGraph = source.architectureBefore;
  const originalDescription = source.description;
  const originalCost = source.choices[0].cost;
  try {
    source.architectureBefore = { ...originalGraph, nodes: originalGraph.nodes.map(n => ({ ...n, state: 'failed', subtitle: 'changed after this run' })) };
    source.description = 'A different incident after publication.';
    source.choices[0].cost = 9000;
    await store.persist.rehydrate();
    const resumed = store.getState();
    assert.deepEqual(getArchitectureAtLevelStart(resumed, incident.id), graph);
    assert.equal(getLevelAtStart(resumed, incident.id).description, originalDescription);
    assert.equal(resumed.lastOutcome.choiceCost, 200);
    // Older histories lack the additional diagnostic snapshot; preserve their
    // original saved graph rather than applying newly authored diagnostics.
    const legacy = { ...resumed, history: resumed.history.map(({ incidentArchitectureBefore, ...entry }) => entry) };
    assert.deepEqual(getArchitectureAtLevelStart(legacy, incident.id), legacy.history[1].architectureBefore);
  } finally {
    source.architectureBefore = originalGraph;
    source.description = originalDescription;
    source.choices[0].cost = originalCost;
  }
});

test('transactional handoff has no direct publish bypass, including prerequisite queue recovery', () => {
  for (const needsQueue of [false, true]) {
    fresh();
    const state = playRoute(l => needsQueue && l.levelNumber === 13 ? 'neutral' : 'recommended', 17);
    assert.equal(state.failureReason, undefined);
    const has = (from, to) => state.architecture.edges.some(e => e.from === from && e.to === to);
    assert.ok(has('postgres', 'outbox-relay'));
    assert.ok(has('outbox-relay', 'jobs'));
    assert.ok(!has('monolith', 'jobs'), 'committed events must pass through the outbox relay');
  }
});

test('returning to primary reads retires an early replica route without deleting the replica', () => {
  const state = playRoute(l => l.levelNumber === 3 ? 'add-database' : l.levelNumber === 19 ? 'neutral' : 'recommended', 19);
  assert.equal(state.failureReason, undefined);
  assert.ok(state.history[2].architectureAfter.capabilities.includes('read-replicas'));
  assert.ok(state.history[2].architectureAfter.capabilities.includes('reader-routing'));
  assert.ok(state.architecture.nodes.some(n => n.id === 'read-replica'));
  assert.ok(!state.architecture.edges.some(e => e.from === 'monolith' && e.to === 'read-replica'));
  assert.ok(!state.architecture.capabilities.includes('reader-routing'));
  const next = getLevelAtStart(state, 'startup-020');
  assert.equal(next.description, allLevels[19].variants.find(v => v.id === 'without-reader-routing').description);
});

test('sharding and whale isolation retain broker-free durable delivery', () => {
  const state = playRoute(l => [17, 27].includes(l.levelNumber) ? 'neutral' : 'recommended', 33);
  assert.equal(state.failureReason, undefined);
  assert.ok(state.architecture.nodes.some(n => n.id === 'dispatcher'));
  for (const writer of ['shards', 'whale-writer']) {
    assert.ok(state.architecture.edges.some(e => e.from === writer && e.to === 'dispatcher'), writer);
  }
  fresh();
  const withBroker = playRoute(() => 'recommended', 33);
  assert.ok(!withBroker.architecture.nodes.some(n => n.id === 'dispatcher'));
  assert.ok(!withBroker.architecture.edges.some(e => e.to === 'dispatcher'));
});

test('regional recovery retains the shared-files media path', () => {
  const state = playRoute(l => [6, 9, 25].includes(l.levelNumber) ? 'neutral' : 'recommended', 34);
  assert.equal(state.failureReason, undefined);
  assert.ok(!state.architecture.nodes.some(n => n.id === 'object-storage'));
  assert.ok(state.architecture.edges.some(e => e.from === 'shared-files' && e.to === 'standby-region'));
});
