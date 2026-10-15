const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
const saved = new Map();
const writes = [];
const shares = [];
let sharingAvailable = true;
const originalLoad = Module._load;
Module._load = function (id, parent, main) {
  if (id === '@react-native-async-storage/async-storage') return {
    getItem: async (key) => saved.get(key) ?? null,
    setItem: async (key, value) => { saved.set(key, value); },
    removeItem: async (key) => { saved.delete(key); },
  };
  if (id === 'expo-file-system') return {
    cacheDirectory: 'file:///cache/', EncodingType: { Base64: 'base64' },
    writeAsStringAsync: async (...args) => { writes.push(args); },
  };
  if (id === 'expo-sharing') return {
    isAvailableAsync: async () => sharingAvailable,
    shareAsync: async (...args) => { shares.push(args); },
  };
  return originalLoad.call(this, id.startsWith('@/') ? path.join(root, 'src', id.slice(2)) : id, parent, main);
};
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
}).outputText, filename);
const { useGameStore: store, getLevelAtStart } = require('../src/store/gameStore');
const { allLevels, campaigns } = require('../src/campaigns');
const { canEarnCertificate, certificateCaption, certificateDate, publicSiteUrl } = require('../src/domain/certificates');
const { certificateArtwork } = require('../src/lib/certificateArtwork');
const { exportCertificate: exportNative } = require('../src/lib/certificateExport');

function finish(count = allLevels.length) {
  for (const source of allLevels.slice(0, count)) {
    const level = getLevelAtStart(store.getState(), source.id);
    assert.equal(store.getState().chooseChoice(level, level.choices.find((choice) => choice.tone === 'recommended')), true);
  }
}
test.before(async () => { await store.persist.rehydrate(); });
test.beforeEach(() => {
  store.getState().resetCampaign('startup-cto');
  store.setState({ certificates: {} });
  store.getState().setProfile({ name: 'Alex Morgan', age: 30 });
  writes.length = shares.length = 0;
  sharingAvailable = true;
});

test('certificate unlocks on the final successful decision, survives replay and persists', async () => {
  finish(allLevels.length - 1);
  assert.deepEqual(store.getState().certificates, {});
  const last = getLevelAtStart(store.getState(), allLevels.at(-1).id);
  assert.equal(store.getState().chooseChoice(last, last.choices.find((choice) => choice.tone === 'recommended')), true);
  const earned = store.getState().certificates['startup-cto'];
  assert.equal(earned.recipientName, 'Alex Morgan');
  assert.equal(earned.levelCount, 36);
  assert.equal(earned.campaignTitle, 'Startup CTO');
  assert.match(earned.id, /^SL-SCTO-/);
  assert.ok(Number.isFinite(Date.parse(earned.issuedAt)));
  store.getState().resetCampaign('startup-cto');
  assert.deepEqual(store.getState().certificates['startup-cto'], earned);
  await store.persist.rehydrate();
  assert.deepEqual(store.getState().certificates['startup-cto'], earned);
  finish();
  assert.deepEqual(store.getState().certificates['startup-cto'], earned);
});

test('failed, incomplete, duplicate and foreign level lists cannot earn a certificate', () => {
  const campaign = campaigns[0];
  assert.equal(canEarnCertificate(campaign, { progress: { completedLevels: Array(36).fill(campaign.levelIds[0]) } }), false);
  assert.equal(canEarnCertificate(campaign, { progress: { completedLevels: campaign.levelIds }, failureReason: 'Run ended' }), false);
  assert.equal(canEarnCertificate(undefined, { progress: { completedLevels: campaign.levelIds } }), false);
  assert.equal(canEarnCertificate({ ...campaign, id: 'another-campaign' }, { progress: { completedLevels: campaign.levelIds } }), false);
  finish(35);
  store.setState({ company: { ...store.getState().company, monthlyRevenue: 0, monthlyBurn: 100000000 } });
  const last = getLevelAtStart(store.getState(), allLevels.at(-1).id);
  const choice = last.choices.find((item) => item.tone === 'recommended');
  assert.ok(choice);
  assert.equal(store.getState().chooseChoice(last, choice), true);
  assert.ok(store.getState().failureReason);
  assert.deepEqual(store.getState().certificates, {});
});

test('old completed saves are backfilled once; unfinished and failed saves are excluded', () => {
  finish();
  const complete = store.getState();
  const { certificates: _omitted, ...legacy } = complete;
  const merge = store.persist.getOptions().merge;
  const restored = merge(legacy, { ...complete, certificates: {} });
  const earned = restored.certificates['startup-cto'];
  assert.ok(earned);
  assert.deepEqual(merge(restored, restored).certificates['startup-cto'], earned);
  const failed = { ...legacy, failureReason: 'Run ended' };
  assert.deepEqual(merge(failed, { ...complete, certificates: {} }).certificates, {});
  store.getState().resetCampaign('startup-cto');
  const fresh = { ...store.getState(), certificates: undefined };
  assert.deepEqual(merge(fresh, store.getState()).certificates, {});
});

test('version 5 migration saves a backfilled certificate without changing completed decisions', async () => {
  finish();
  const previous = JSON.parse(JSON.stringify(store.getState()));
  delete previous.certificates;
  saved.set('scalelog-progress', JSON.stringify({ state: previous, version: 5 }));
  store.setState({ certificates: {} });
  // setState writes storage, so restore the legacy payload after clearing memory.
  saved.set('scalelog-progress', JSON.stringify({ state: previous, version: 5 }));
  await store.persist.rehydrate();
  const restored = store.getState();
  const certificate = restored.certificates['startup-cto'];
  assert.ok(certificate);
  assert.deepEqual(restored.company, previous.company);
  assert.deepEqual(restored.history, previous.history);
  const persisted = JSON.parse(saved.get('scalelog-progress'));
  assert.equal(persisted.version, 6);
  assert.deepEqual(persisted.state.certificates['startup-cto'], certificate);
  await store.persist.rehydrate();
  assert.deepEqual(store.getState().certificates['startup-cto'], certificate);
});

test('personalization validates names, preserves award identity and never shares age', () => {
  assert.equal(store.getState().personalizeCertificate('startup-cto', 'Alex'), false);
  finish();
  const original = store.getState().certificates['startup-cto'];
  assert.equal(store.getState().personalizeCertificate('startup-cto', '  '), false);
  assert.equal(store.getState().personalizeCertificate('startup-cto', 'A'.repeat(101)), false);
  assert.equal(store.getState().personalizeCertificate('startup-cto', '  Zoë\n  李 & <Morgan>  '), true);
  const certificate = store.getState().certificates['startup-cto'];
  assert.equal(certificate.recipientName, 'Zoë 李 & <Morgan>');
  assert.equal(certificate.id, original.id);
  assert.equal(certificate.issuedAt, original.issuedAt);
  const artwork = certificateArtwork(certificate, 'https://scalelog.example');
  assert.match(artwork, /Zoë 李 &amp; &lt;Morgan&gt;/);
  assert.doesNotMatch(artwork, /<Morgan>|Age 30/);
  assert.equal(certificateDate({ ...certificate, issuedAt: '2026-10-14T23:59:00Z' }), 'October 14, 2026');
});

test('referral captions use public URLs with campaign attribution and strip private data', () => {
  finish();
  const certificate = store.getState().certificates['startup-cto'];
  const caption = certificateCaption(certificate, 'https://scalelog.example/private?token=secret#profile');
  assert.match(caption, /https:\/\/scalelog.example\/\?utm_source=linkedin&utm_medium=certificate&utm_campaign=startup_cto/);
  assert.doesNotMatch(caption, /secret|private|Alex|Age/);
  assert.match(caption, /Learn system design through 36 interactive scenarios. Try ScaleLog:/);
  assert.ok(caption.split(/\s+/).length < 40, 'The promotional message should stay brief');
  assert.doesNotMatch(caption, /#SystemDesign|#SoftwareEngineering|#ScaleLog/);
  for (const url of ['http://localhost:8081', 'http://127.0.0.1', 'https://user:secret@example.com', 'javascript:alert(1)', 'broken']) assert.equal(publicSiteUrl(url), undefined);
  assert.doesNotMatch(certificateCaption(certificate, 'http://localhost:8081'), /localhost/);
});

test('native export creates a high-resolution PNG and passes it to the share sheet', async () => {
  let size;
  await exportNative('<svg/>', 'SL-TEST', {
    toDataURL: (callback, options) => { size = options; callback('PNG_BASE64'); },
  });
  assert.deepEqual(size, { width: 2400, height: 1696 });
  assert.deepEqual(writes[0], ['file:///cache/ScaleLog-Startup-CTO-SL-TEST.png', 'PNG_BASE64', { encoding: 'base64' }]);
  assert.equal(shares[0][0], writes[0][0]);
  assert.equal(shares[0][1].mimeType, 'image/png');
  sharingAvailable = false;
  await assert.rejects(exportNative('<svg/>', 'SL-TEST', {}), /unavailable/);
  assert.equal(writes.length, 1);
});

test('web export rasterizes the vector master, downloads a PNG, and reports rendering failures', async () => {
  const { exportCertificate } = require('../src/lib/certificateExport.web');
  const originalImage = global.Image;
  const originalDocument = global.document;
  const originalCreate = URL.createObjectURL;
  const originalRevoke = URL.revokeObjectURL;
  const originalTimeout = global.setTimeout;
  const objects = [], revoked = [], timers = [];
  let failImage = false;
  let downloaded = false;
  let drawn = false;
  const anchor = { remove() {}, click() { downloaded = true; } };
  const canvas = {
    getContext: () => ({ drawImage: (_image, x, y, width, height) => { assert.deepEqual([x, y, width, height], [0, 0, 2400, 1696]); drawn = true; } }),
    toBlob: (callback, type) => { assert.equal(type, 'image/png'); callback(new Blob(['PNG'], { type })); },
  };
  global.Image = class { set src(_url) { queueMicrotask(() => failImage ? this.onerror() : this.onload()); } };
  global.document = { body: { appendChild() {} }, createElement: (type) => type === 'canvas' ? canvas : anchor };
  URL.createObjectURL = (blob) => { objects.push(blob); return 'blob:' + objects.length; };
  URL.revokeObjectURL = (url) => revoked.push(url);
  global.setTimeout = (callback, ms) => { const timer = originalTimeout(callback, ms); timer.unref(); timers.push(timer); return timer; };
  try {
    await exportCertificate('<svg/>', 'SL-WEB', null);
    assert.ok(drawn && downloaded);
    assert.equal(canvas.width, 2400);
    assert.equal(canvas.height, 1696);
    assert.equal(objects[0].type, 'image/svg+xml;charset=utf-8');
    assert.equal(objects[1].type, 'image/png');
    assert.equal(anchor.download, 'ScaleLog-Startup-CTO-SL-WEB.png');
    assert.ok(revoked.includes('blob:1'));
    failImage = true;
    await assert.rejects(exportCertificate('<svg/>', 'SL-WEB', null), /could not be generated/);
    assert.ok(revoked.includes('blob:3'));
  } finally {
    timers.forEach(clearTimeout);
    global.Image = originalImage;
    global.document = originalDocument;
    URL.createObjectURL = originalCreate;
    URL.revokeObjectURL = originalRevoke;
    global.setTimeout = originalTimeout;
  }
});

const { getDecisionScore, calculateCampaignScore } = require('../src/domain/campaignScore');
const { getCampaignScore } = require('../src/store/gameStore');
const { createCredentialSignature, verifyCredentialSignature, getCertificateLegacyVerificationUrl } = require('../src/domain/certificates');

test('decision scores normalize XP, distinguish partial credit, and zero risky or overkill decisions', () => {
  const level = { ...allLevels[0], xpReward: 100, choices: [
    { id: 'best', tone: 'recommended', effects: { xp: 100 } },
    { id: 'partial', tone: 'neutral', effects: { xp: 60 } },
    { id: 'risk', tone: 'risky', effects: { xp: 500 } },
    { id: 'overkill', tone: 'overkill', effects: {} },
  ] };
  assert.deepEqual(level.choices.map(choice => getDecisionScore(level, choice)), [10, 6, 0, 0]);
  const noReward = { ...level, choices: [{ tone: 'neutral', effects: { xp: 0 } }] };
  assert.equal(getDecisionScore(noReward, noReward.choices[0]), 0);
});

test('campaign scores weight each incident equally, round once, and reject incomplete or ambiguous history', () => {
  const campaign = { ...campaigns[0], levelIds: ['a', 'b', 'c'] };
  const history = [{ levelId: 'a', decisionScore: 10 }, { levelId: 'b', decisionScore: 10 / 3 }, { levelId: 'c', decisionScore: 0 }];
  const noReplay = () => { throw new Error('Saved scores must be authoritative'); };
  assert.equal(calculateCampaignScore(campaign, history, noReplay), 4.4);
  assert.equal(calculateCampaignScore(campaign, history.slice(1), noReplay), undefined);
  assert.equal(calculateCampaignScore(campaign, [...history, history[0]], noReplay), undefined);
  assert.equal(calculateCampaignScore(campaign, [{ ...history[0], failureReason: 'failed' }, ...history.slice(1)], noReplay), undefined);
  for (const decisionScore of [NaN, Infinity, -1, 11]) {
    assert.equal(calculateCampaignScore(campaign, [{ ...history[0], decisionScore }, ...history.slice(1)], noReplay), undefined);
  }
});

test('scores are issued only on completion, survive reload and reset, and resolve legacy incident variants', async () => {
  finish(35);
  assert.equal(getCampaignScore(store.getState()), undefined);
  const source = allLevels.at(-1);
  const level = getLevelAtStart(store.getState(), source.id);
  store.getState().chooseChoice(level, level.choices.find(choice => choice.tone === 'recommended'));
  const completed = store.getState();
  const certificate = completed.certificates['startup-cto'];
  assert.equal(certificate.score, 10);
  assert.equal(getCampaignScore(completed), 10);
  await store.persist.rehydrate();
  assert.equal(store.getState().certificates['startup-cto'].score, 10);
  const legacy = { ...completed, history: completed.history.map(({ decisionScore, ...entry }) => entry) };
  assert.equal(getCampaignScore(legacy), 10);
  const variant = { ...allLevels[0], choices: [{ id: 'variant-choice', tone: 'neutral', effects: { xp: 25 } }, { id: 'best', tone: 'recommended', effects: { xp: 100 } }] };
  assert.equal(calculateCampaignScore({ ...campaigns[0], levelIds: [variant.id] }, [{ levelId: variant.id, choiceId: 'variant-choice' }], () => variant), 2.5);
  store.getState().resetCampaign('startup-cto');
  assert.equal(getCampaignScore(store.getState()), undefined);
  assert.equal(store.getState().certificates['startup-cto'].score, 10);
});

test('unscored existing certificates stay unchanged on load and get a new identity after a scored replay', () => {
  finish();
  const { score, ...oldCertificate } = store.getState().certificates['startup-cto'];
  store.setState({ certificates: { 'startup-cto': oldCertificate } });
  const merge = store.persist.getOptions().merge;
  assert.deepEqual(merge(store.getState(), store.getState()).certificates['startup-cto'], oldCertificate);
  store.getState().resetCampaign('startup-cto');
  finish();
  const scored = store.getState().certificates['startup-cto'];
  assert.equal(scored.score, 10);
  assert.notEqual(scored.id, oldCertificate.id);
});

test('score is included in artwork, captions, registry requests and legacy signature verification', async () => {
  finish();
  const certificate = { ...store.getState().certificates['startup-cto'], score: 8.7, recipientEmail: 'alex@example.com' };
  assert.match(certificateArtwork(certificate), />8.7 \/ 10<\/text>/);
  assert.match(certificateCaption(certificate), /8.7 \/ 10/);
  assert.match(certificateArtwork({ ...certificate, score: 0 }), />0.0 \/ 10<\/text>/);
  assert.doesNotMatch(certificateArtwork({ ...certificate, score: undefined }), /CAMPAIGN SCORE/);
  const signature = createCredentialSignature(certificate);
  assert.equal(verifyCredentialSignature(certificate, signature), true);
  assert.equal(verifyCredentialSignature({ ...certificate, score: 9.8 }, signature), false);
  assert.equal(verifyCredentialSignature({ ...certificate, score: undefined }, signature), false);
  const legacy = { ...certificate, score: undefined };
  assert.equal(verifyCredentialSignature(legacy, createCredentialSignature(legacy)), true);
  const url = new URL(getCertificateLegacyVerificationUrl(certificate, 'https://scalelog.example'));
  assert.equal(url.searchParams.get('score'), '8.7');
  assert.equal(url.searchParams.get('sig'), signature);
  const previousFetch = global.fetch;
  try {
    let submitted;
    global.fetch = async (_url, options) => {
      submitted = JSON.parse(options.body);
      return { ok: true, json: async () => ({ mintedAt: certificate.issuedAt }) };
    };
    const { mintCertificateOnServer } = require('../src/lib/certificateRegistry');
    assert.equal((await mintCertificateOnServer(certificate)).success, true);
    assert.equal(submitted.score, 8.7);
  } finally { global.fetch = previousFetch; }
});
