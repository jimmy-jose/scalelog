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
const { useGameStore: store, getCompanyAtLevelStart } = require('../src/store/gameStore');
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
  allLevels.forEach((level, i) => assert.equal(choose(i, level.choices.find(c => c.tone === 'recommended').id), true));
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
  const extended = defineCampaignLevels('startup-cto', [...original, ...extraLevels]);
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
  const levels = defineCampaignLevels('startup-cto', [...allLevels, fourth]);
  assert.equal(levels[2].nextLevel, fourth.id);
  assert.deepEqual(levels[2].unlocks, [fourth.id]);
  assert.equal(levels[3].nextLevel, undefined);
  assert.throws(() => defineCampaignLevels('startup-cto', [...allLevels, { ...fourth, id: allLevels[0].id }]));
  assert.throws(() => defineCampaignLevels('startup-cto', [...allLevels, { ...fourth, campaignId: 'wrong' }]));
  assert.throws(() => defineCampaignLevels('startup-cto', [...allLevels, { ...fourth, levelNumber: 5 }]));
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
