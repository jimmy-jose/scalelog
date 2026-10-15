// Render the real routes without a native runtime or browser. Native widgets are
// inert hosts; store decisions, route handlers and rendered copy remain real.
const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');

const root = path.resolve(__dirname, '..');
const saved = new Map();
let params = {};
let saveStatus = 'ready';
let storeModule;
let controls = [];
let decks = [];
let navigation = [];
let clipboardMessages = [];
let openedUrls = [];
let clipboardAvailable = true;
let shareAction = 'sharedAction';
let nativeSharePayloads = [];

function host(tag = 'div') {
  return ({ children }) => React.createElement(tag, null, children);
}

function Pressable(props) {
  controls.push(props);
  return React.createElement('button', { disabled: props.disabled, 'aria-label': props.accessibilityLabel }, props.children);
}

const View = host();
const Text = host('span');
const native = {
  View, Text, Pressable, Image: () => null, ImageBackground: View,
  Platform: { OS: 'web' }, Linking: { openURL: async (url) => { openedUrls.push(url); } },
  Share: { dismissedAction: 'dismissedAction', share: async (payload) => { nativeSharePayloads.push(payload); return { action: shareAction }; } },
  TextInput: host('input'), ActivityIndicator: () => React.createElement('span', null, 'Loading'),
  StyleSheet: { create: (styles) => styles, absoluteFill: {} },
  useWindowDimensions: () => ({ width: 1000, height: 800 }),
};
const animation = new Proxy({}, { get: () => () => animation });
const animated = {
  __esModule: true, default: { View, Text, Image: () => null },
  FadeInDown: animation, FadeInLeft: animation, FadeOutUp: animation,
  useReducedMotion: () => true,
  useSharedValue: (value) => ({ value }), useAnimatedStyle: (callback) => callback(),
  cancelAnimation: () => {}, withRepeat: (value) => value,
  withSequence: (value) => value, withTiming: (value) => value,
};
const router = {
  push: (destination) => navigation.push(['push', destination]),
  replace: (destination) => navigation.push(['replace', destination]),
  back: () => navigation.push(['back']), canGoBack: () => false,
};
const originalLoad = Module._load;
Module._load = function (id, parent, main) {
  if (id === '@react-native-async-storage/async-storage') return {
    getItem: async (key) => saved.get(key) ?? null,
    setItem: async (key, value) => { saved.set(key, value); },
    removeItem: async (key) => { saved.delete(key); },
  };
  if (id === 'react-native') return native;
  if (id === 'react-native-gesture-handler') return {};
  if (id === 'react-native-reanimated') return animated;
  if (id === 'expo-router') return {
    router, useLocalSearchParams: () => params,
    Stack: () => React.createElement('div', null, 'ROUTE STACK'),
    Redirect: ({ href }) => React.createElement('div', null, `REDIRECT ${href}`),
  };
  if (id === 'expo-status-bar') return { StatusBar: () => null };
  if (id === 'expo-linear-gradient') return { LinearGradient: View };
  if (id === 'react-native-svg') return { __esModule: true, default: View, SvgXml: () => null, Circle: () => null, Path: () => null, Rect: () => null };
  if (id === 'expo-clipboard') return { setStringAsync: async (message) => { clipboardMessages.push(message); return clipboardAvailable; } };
  if (id === '@/lib/certificateExport') return { exportCertificate: async () => {}, getCertificateSiteUrl: () => 'https://scalelog.example' };
  if (id === '@/lib/certificateRegistry') return { mintCertificateOnServer: async () => ({ success: true }), fetchVerifiedCertificate: async () => ({ verified: true }) };
  if (id === '@/game/feedback/GameFeedbackManager') return { gameFeedback: { trigger: () => {}, configure: () => {}, connectAudioLifecycle: () => () => {} } };
  if (id === '@/store/gameStore' && storeModule) {
    const useGameStore = (selector) => selector(storeModule.useGameStore.getState());
    useGameStore.persist = storeModule.useGameStore.persist;
    useGameStore.getState = storeModule.useGameStore.getState;
    useGameStore.subscribe = storeModule.useGameStore.subscribe;
    return { ...storeModule, useGameStore, useSaveStatus: (selector) => selector({ status: saveStatus }) };
  }
  if (id.startsWith('@/ui/components/') && !id.endsWith('/TopBar') && !id.endsWith('/CertificateReward') && !id.endsWith('/CampaignScore')) {
    const name = id.slice(id.lastIndexOf('/') + 1);
    if (name === 'JimmyAvatar' || name === 'ByteAvatar') return { characterAssets: {} };
    if (name === 'Button') return { Button: Pressable };
    if (name === 'DecisionDeck') return { DecisionDeck: (props) => { decks.push(props); return null; } };
    return { [name]: View };
  }
  return originalLoad.call(this, id.startsWith('@/') ? path.join(root, 'src', id.slice(2)) : id, parent, main);
};

for (const extension of ['.ts', '.tsx']) {
  require.extensions[extension] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText, filename);
}
require.extensions['.png'] = (module) => { module.exports = {}; };

storeModule = require('../src/store/gameStore');
const { useGameStore: store } = storeModule;
const { allLevels } = require('../src/campaigns');
const Layout = require('../app/_layout').default;
const Campaigns = require('../app/campaigns').default;
const Onboarding = require('../app/campaign/[campaignId]').default;
const Levels = require('../app/levels').default;
const Gameplay = require('../app/game/[levelId]').default;
const Outcome = require('../app/outcome').default;
const Complete = require('../app/complete').default;
const Certificate = require('../app/certificate').default;
const Stats = require('../app/stats').default;

const render = (Component) => {
  controls = [];
  decks = [];
  return renderToStaticMarkup(React.createElement(Component));
};
const content = (children) => React.Children.toArray(children).map((child) => typeof child === 'object' ? content(child.props.children) : String(child)).join('');
const button = (label) => controls.find((control) => content(control.children).includes(label));
const chooseRecommended = (index) => {
  const level = storeModule.getLevelAtStart(store.getState(), allLevels[index].id);
  assert.equal(store.getState().chooseChoice(level, level.choices.find((choice) => choice.tone === 'recommended')), true);
};

test.before(async () => { await store.persist.rehydrate(); });
test.beforeEach(() => {
  store.getState().resetCampaign('startup-cto');
  store.setState({ certificates: {} });
  store.getState().setProfile({ name: '', age: null });
  params = {};
  saveStatus = 'ready';
  navigation = [];
  clipboardMessages = [];
  openedUrls = [];
  clipboardAvailable = true;
  shareAction = 'sharedAction';
  nativeSharePayloads = [];
  native.Platform.OS = 'web';
});

test('certificate route is locked before completion and reachable from the ending, map and profile afterward', () => {
  assert.match(render(Certificate), /Complete every scenario/);
  assert.doesNotMatch(render(Certificate), /Download certificate/);
  assert.doesNotMatch(render(Levels), /View your certificate/);
  store.getState().setProfile({ name: 'Alex Morgan', age: null });
  allLevels.forEach((_level, index) => chooseRecommended(index));
  for (const Component of [Complete, Levels, Stats]) {
    assert.match(render(Component), /View your certificate/);
    button('View your certificate').onPress();
    assert.deepEqual(navigation.at(-1), ['push', '/certificate']);
  }
  const markup = render(Certificate);
  assert.match(markup, /Download certificate · PNG/);
  assert.match(markup, /36 interactive scenarios/);
  assert.match(markup, /Copy message/);
  assert.match(markup, /utm_source=linkedin/);
  assert.equal(button('Download certificate').disabled, false);
  store.getState().personalizeCertificate('startup-cto', '');
  store.setState({ certificates: { 'startup-cto': { ...store.getState().certificates['startup-cto'], recipientName: '' } } });
  render(Certificate);
  assert.equal(button('Download certificate').disabled, true);
});

test('routes wait for saved progress and failed loads offer a retry', () => {
  saveStatus = 'loading';
  assert.match(render(Layout), /Loading your campaign/);
  assert.doesNotMatch(render(Layout), /ROUTE STACK/);
  saveStatus = 'error';
  assert.match(render(Layout), /Saved progress could not be loaded/);
  assert.doesNotMatch(render(Layout), /ROUTE STACK/);
  const originalRehydrate = store.persist.rehydrate;
  let retries = 0;
  store.persist.rehydrate = () => { retries++; };
  try { button('Retry').onPress(); } finally { store.persist.rehydrate = originalRehydrate; }
  assert.equal(retries, 1);
  saveStatus = 'ready';
  assert.match(render(Layout), /ROUTE STACK/);
});

test('skipping optional age keeps the profile ready and resumes the campaign', () => {
  store.getState().setProfile({ name: 'Alex', age: null });
  store.getState().markCampaignBriefSeen('startup-cto');
  assert.match(render(Campaigns), /CONTINUE CAMPAIGN/);
  button('CONTINUE CAMPAIGN').onPress();
  assert.deepEqual(navigation.at(-1), ['push', '/levels']);
  params = { campaignId: 'startup-cto' };
  const markup = render(Onboarding);
  assert.match(markup, /PROFILE READY/);
  assert.doesNotMatch(markup, /WHAT SHOULD I CALL YOU/);
  assert.doesNotMatch(markup, /AGE null/);
});

test('failed runs retain read-only access to completed scenarios and their recorded outcomes', () => {
  chooseRecommended(0);
  store.setState({ failureReason: 'The run has ended.' });
  render(Levels);
  const completed = controls.find((control) => control.accessibilityLabel?.startsWith('Level 1,'));
  const future = controls.find((control) => control.accessibilityLabel?.startsWith('Level 2,'));
  assert.equal(completed.disabled, false);
  assert.equal(future.disabled, true);
  completed.onPress();
  assert.equal(navigation.at(-1)[1].params.levelId, allLevels[0].id);

  params = { levelId: allLevels[0].id };
  const markup = render(Gameplay);
  assert.doesNotMatch(markup, /REDIRECT/);
  assert.match(markup, /Your recorded decision/);
  assert.equal(decks[0].completed, true);
  assert.equal(decks[0].loggedChoiceId, store.getState().history[0].choiceId);
  button('Review this outcome').onPress();
  assert.deepEqual(navigation.at(-1), ['push', { pathname: '/outcome', params: { levelId: allLevels[0].id } }]);
});

test('reviewing an older decision passes its saved choice to the option picker, including legacy saves', () => {
  chooseRecommended(0);
  const recorded = store.getState().history[0];
  chooseRecommended(1);
  params = { levelId: recorded.levelId };
  render(Gameplay);
  assert.equal(decks[0].completed, true);
  assert.equal(decks[0].loggedChoiceId, recorded.choiceId);
  assert.notEqual(decks[0].loggedChoiceId, store.getState().lastOutcome.choiceId);

  store.setState({ history: [] });
  render(Gameplay);
  assert.equal(decks[0].completed, true);
  assert.equal(decks[0].loggedChoiceId, recorded.choiceId);
});

test('historical debrief survives removal of its source choice and returns to the map', () => {
  chooseRecommended(0);
  chooseRecommended(1);
  const recorded = store.getState().lastOutcome;
  chooseRecommended(2);
  const choices = allLevels[1].choices;
  allLevels[1].choices = choices.filter((choice) => choice.id !== recorded.choiceId);
  try {
    params = { levelId: recorded.levelId };
    const markup = render(Outcome);
    assert.match(markup, new RegExp(recorded.choiceLabel));
    assert.doesNotMatch(markup, /No decision to review/);
    assert.match(markup, /\$200 upfront and/);
    button('Back to campaign map').onPress();
    assert.deepEqual(navigation.at(-1), ['replace', '/levels']);
    assert.equal(store.getState().lastOutcome.levelId, allLevels[2].id);
  } finally { allLevels[1].choices = choices; }
});

test('an unknown historical decision never falls back to the latest unrelated result', () => {
  chooseRecommended(0);
  params = { levelId: 'missing-incident' };
  assert.match(render(Outcome), /No decision to review/);
});


test('completion and certificate screens distinguish this run from the saved certificate score', () => {
  for (let index = 0; index < allLevels.length; index++) chooseRecommended(index);
  const earned = store.getState().certificates['startup-cto'];
  assert.match(render(Complete), /This run’s campaign score.*10.0 \/ 10/);
  assert.match(render(Certificate), /Certificate campaign score.*10.0 \/ 10/);
  store.getState().resetCampaign('startup-cto');
  for (let index = 0; index < allLevels.length; index++) {
    const level = storeModule.getLevelAtStart(store.getState(), allLevels[index].id);
    const choice = level.choices.find(item => item.tone === (index >= 3 ? 'neutral' : 'recommended'));
    assert.equal(store.getState().chooseChoice(level, choice), true);
  }
  const score = storeModule.getCampaignScore(store.getState());
  assert.ok(score > 0 && score < 10);
  assert.match(render(Complete), new RegExp(`This run’s campaign score.*${score.toFixed(1)} / 10`));
  assert.equal(store.getState().certificates['startup-cto'].score, earned.score);
  assert.match(render(Certificate), /Certificate campaign score.*10.0 \/ 10/);
  store.setState({ certificates: { 'startup-cto': { ...earned, score: undefined } } });
  assert.match(render(Certificate), /Not scored/);
});


function mockNavigator(t, value) {
  const descriptor = Object.getOwnPropertyDescriptor(global, 'navigator');
  Object.defineProperty(global, 'navigator', { configurable: true, value });
  t.after(() => {
    if (descriptor) Object.defineProperty(global, 'navigator', descriptor);
    else delete global.navigator;
  });
}

test('sharing from the certificate includes the short app invitation, score and certificate link automatically', async (t) => {
  const payloads = [];
  mockNavigator(t, { share: async (payload) => { payloads.push(payload); } });
  allLevels.forEach((_level, index) => chooseRecommended(index));
  render(Certificate);
  await button('Share result').onPress();
  assert.equal(payloads.length, 1);
  assert.match(payloads[0].text, /I completed Startup CTO on ScaleLog! My score: 10.0 \/ 10\./);
  assert.match(payloads[0].text, /Try ScaleLog: https:\/\/scalelog.example/);
  assert.match(payloads[0].text, /My certificate: https:\/\/scalelog.example\/verify\?id=SL-SCTO-/);
  assert.doesNotMatch(payloads[0].text, /#|recipientEmail|Alex/);
  assert.equal(clipboardMessages.length, 0);
});

test('LinkedIn action automatically copies the message and opens only the supported URL share flow', async () => {
  allLevels.forEach((_level, index) => chooseRecommended(index));
  render(Certificate);
  await button('Copy message & open LinkedIn').onPress();
  assert.equal(clipboardMessages.length, 1);
  assert.match(clipboardMessages[0], /Try ScaleLog:/);
  const url = new URL(openedUrls[0]);
  assert.equal(url.origin, 'https://www.linkedin.com');
  assert.equal(url.pathname, '/sharing/share-offsite/');
  assert.deepEqual([...url.searchParams.keys()], ['url']);
  assert.match(url.searchParams.get('url'), /scalelog.example\/verify\?id=/);
});

test('browser sharing falls back to copying but cancellation leaves the clipboard untouched', async (t) => {
  const { shareCertificateMessage } = require('../src/lib/certificateSharing');
  const browser = {};
  mockNavigator(t, browser);
  assert.equal(await shareCertificateMessage('Short invitation'), 'copied');
  assert.deepEqual(clipboardMessages, ['Short invitation']);
  browser.share = async () => { throw Object.assign(new Error('Cancelled'), { name: 'AbortError' }); };
  assert.equal(await shareCertificateMessage('Cancelled invitation'), 'cancelled');
  assert.equal(clipboardMessages.length, 1);
  browser.share = async () => { throw new Error('Permission denied'); };
  assert.equal(await shareCertificateMessage('Fallback invitation'), 'copied');
  clipboardAvailable = false;
  await assert.rejects(shareCertificateMessage('Unavailable'), /Select and copy the message/);
});

test('native sharing includes the message and handles dismissed shares', async () => {
  const { shareCertificateMessage } = require('../src/lib/certificateSharing');
  native.Platform.OS = 'ios';
  assert.equal(await shareCertificateMessage('My result. Try ScaleLog!'), 'shared');
  assert.equal(nativeSharePayloads[0].message, 'My result. Try ScaleLog!');
  shareAction = 'dismissedAction';
  assert.equal(await shareCertificateMessage('Dismissed'), 'cancelled');
});

test('LinkedIn still opens when copying is denied and reports that the caption needs copying manually', async () => {
  const { shareCertificateOnLinkedIn } = require('../src/lib/certificateSharing');
  clipboardAvailable = false;
  assert.equal(await shareCertificateOnLinkedIn('Message', 'https://scalelog.example/verify?id=SAMPLE'), false);
  assert.equal(openedUrls.length, 1);
});
