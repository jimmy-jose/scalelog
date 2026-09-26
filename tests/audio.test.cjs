const assert = require('node:assert/strict');
const { test, beforeEach } = require('node:test');
const fs = require('node:fs');
const Module = require('node:module');
const ts = require('typescript');

global.__DEV__ = false;
const players = new Map();
let prepare = async () => {};
let seek = async () => {};
const originalLoad = Module._load;
Module._load = function (id, parent, main) {
  if (id === 'react-native') return { Platform: { OS: 'test' } };
  if (id === 'expo-audio') return {
    setAudioModeAsync: () => prepare(),
    createAudioPlayer: (source) => {
      const player = {
        volume: 1, playing: false, plays: 0,
        seekTo: () => seek(),
        play() { this.plays++; this.playing = true; },
        pause() { this.playing = false; },
      };
      players.set(source, player);
      return player;
    },
  };
  return originalLoad.call(this, id, parent, main);
};
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText, filename);
require.extensions['.wav'] = (module, filename) => { module.exports = filename; };
const { soundRegistry } = require('../src/game/feedback/soundRegistry');
const { soundMix } = require('../src/game/feedback/soundMix');
const { defaultAudioSettings, soundIds } = require('../src/game/feedback/feedbackTypes');
let manager;
const player = (id) => players.get(soundRegistry[id]);
const deferred = () => {
  let resolve;
  const promise = new Promise((done) => { resolve = done; });
  return { promise, resolve };
};

beforeEach(() => {
  players.clear();
  prepare = async () => {};
  seek = async () => {};
  delete require.cache[require.resolve('../src/game/feedback/AudioManager')];
  manager = require('../src/game/feedback/AudioManager').AudioManager;
  manager.configure({ ...defaultAudioSettings });
});

test('every cue is bundled, click-free at its boundaries, and has safe peak headroom', () => {
  for (const id of soundIds) {
    const data = fs.readFileSync(soundRegistry[id]);
    assert.equal(data.toString('ascii', 0, 4), 'RIFF');
    assert.equal(data.readUInt32LE(24), 44100);
    assert.equal(data.readUInt16LE(34), 16);
    const samples = [];
    for (let i = 44; i < data.length; i += 2) samples.push(data.readInt16LE(i));
    const peak = Math.max(...samples.map(Math.abs));
    assert.ok(peak > 1000 && peak < 8300, `${id}: usable level with at least 11 dB headroom`);
    assert.equal(samples[0], 0);
    assert.equal(samples.at(-1), 0);
    assert.ok(Math.abs(samples.length / 44.1 - soundMix[id].durationMs) < 2, `${id}: duration matches mixer`);
  }
  assert.notDeepEqual(fs.readFileSync(soundRegistry.hintOpen), fs.readFileSync(soundRegistry.metricImproved));
});

test('rapid taps are coalesced and volume changes preserve the per-cue mix', async () => {
  await Promise.all([manager.play('uiTap'), manager.play('uiTap'), manager.play('uiTap')]);
  assert.equal(player('uiTap').plays, 1);
  manager.configure({ ...defaultAudioSettings, sfxVolume: .5 });
  assert.equal(player('uiTap').volume, .5 * soundMix.uiTap.gain);
});

test('an incident has space while UI stays responsive and rewards replace lower priority cues', async () => {
  await manager.play('incidentCritical');
  await manager.play('metricImproved');
  assert.equal(player('metricImproved'), undefined);
  await manager.play('uiTap');
  assert.equal(player('uiTap').plays, 1);
  assert.equal(player('incidentCritical').playing, true);
  await manager.play('awardUnlocked');
  assert.equal(player('incidentCritical').playing, false);
  assert.equal(player('awardUnlocked').playing, true);
});

test('muting while audio setup is pending cancels the sound, even if re-enabled', async () => {
  const pending = deferred();
  prepare = () => pending.promise;
  const playback = manager.play('choiceSuccess');
  manager.configure({ ...defaultAudioSettings, soundEnabled: false });
  manager.configure({ ...defaultAudioSettings });
  pending.resolve();
  await playback;
  assert.equal(player('choiceSuccess').plays, 0);
  await manager.play('choiceSuccess');
  assert.equal(player('choiceSuccess').plays, 1);
});

test('zero volume cancels an in-flight seek and stops existing playback', async () => {
  await manager.play('uiTap');
  const pending = deferred();
  seek = () => pending.promise;
  const playback = manager.play('choiceSuccess');
  await Promise.resolve();
  manager.configure({ ...defaultAudioSettings, sfxVolume: 0 });
  pending.resolve();
  await playback;
  assert.equal(player('choiceSuccess').plays, 0);
  assert.equal(player('uiTap').playing, false);
});

test('an older asynchronous request cannot play over the newer event', async () => {
  const pending = deferred();
  prepare = () => pending.promise;
  const old = manager.play('architectureNodeAdded');
  const latest = manager.play('choiceSuccess');
  pending.resolve();
  await Promise.all([old, latest]);
  assert.equal(player('architectureNodeAdded').plays, 0);
  assert.equal(player('choiceSuccess').plays, 1);
});
