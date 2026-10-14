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
  for (const url of ['http://localhost:8081', 'http://127.0.0.1', 'https://user:secret@example.com', 'javascript:alert(1)', 'broken']) assert.equal(publicSiteUrl(url), undefined);
  assert.doesNotMatch(certificateCaption(certificate, 'http://localhost:8081'), /localhost/);
});

test('native export creates a high-resolution PNG and passes it to the share sheet', async () => {
  let size;
  await exportNative('<svg/>', 'SL-TEST', {
    toDataURL: (callback, options) => { size = options; callback('PNG_BASE64'); },
  });
  assert.deepEqual(size, { width: 2400, height: 1800 });
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
    getContext: () => ({ drawImage: (_image, x, y, width, height) => { assert.deepEqual([x, y, width, height], [0, 0, 2400, 1800]); drawn = true; } }),
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
    assert.equal(canvas.height, 1800);
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
