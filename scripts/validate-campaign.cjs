// Source-level campaign validation, without Expo, browser automation or native storage.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
const originalLoad = Module._load;
Module._load = function (id, parent, main) {
  return originalLoad.call(this, id.startsWith('@/') ? path.join(root, 'src', id.slice(2)) : id, parent, main);
};
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
}).outputText, filename);
const { allLevels, campaigns } = require('../src/campaigns');
const { resolveLevel } = require('../src/domain/levelVariants');
const { getChoiceBlockReason, resolveDecision } = require('../src/domain/simulation');
const { applyArchitectureChanges } = require('../src/domain/architecture');
const { validateLevel } = require('../src/domain/schemas');
const { getCampaignEnding } = require('../src/domain/campaignEnding');
const { premiumLaunchCapabilities, launchHazards } = require('../src/campaigns/startup-cto/launchContract');
function play(compromise) {
  let company = { ...campaigns[0].story.startingCompany }, architecture = allLevels[0].architectureBefore;
  let xp = 0, confidence = 70;
  const milestones = [];
  for (const source of allLevels) {
    const level = resolveLevel(source, architecture);
    validateLevel(level);
    const choice = level.choices.find(c => c.tone === (compromise && level.levelNumber > 3 ? 'neutral' : 'recommended'));
    assert.equal(getChoiceBlockReason(company, choice), undefined, `${source.id}: response must be eligible`);
    const result = resolveDecision(company, xp, confidence, level, choice);
    assert.equal(result.failureReason, undefined, source.id);
    company = result.company; xp = result.ctoXp; confidence = result.confidence;
    architecture = applyArchitectureChanges(architecture, choice.architectureChanges);
    if ([1, 6, 12, 18, 24, 30, 36].includes(level.levelNumber)) milestones.push({ level: level.levelNumber, company, architecture });
  }
  return { company, milestones, ending: getCampaignEnding(architecture, company, premiumLaunchCapabilities, launchHazards) };
}
assert.equal(allLevels.length, 36);
assert.equal(new Set(allLevels.map(level => level.id)).size, 36);
const report = { levels: allLevels.length, choices: allLevels.reduce((n,l) => n + l.choices.length, 0), variants: allLevels.reduce((n,l) => n + (l.variants?.length ?? 0), 0), recoveries: allLevels.reduce((n,l) => n + (l.recoveries?.length ?? 0), 0), recommended: play(false), compromise: play(true) };
assert.equal(report.recommended.ending.qualified, true, 'recommended route must earn its launch contract');
assert.equal(report.compromise.ending.qualified, false, 'compromise route must retain its narrower contract');
if (process.argv.includes('--json')) process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
else {
  console.log(`Validated ${report.levels} levels, ${report.choices} choices, ${report.variants} incident variants and ${report.recoveries} priced prerequisite repairs.`);
  console.log('Recommended route:', JSON.stringify(report.recommended.company));
  console.log('Compromise route:', JSON.stringify(report.compromise.company));
  console.log('Both routes complete; only the qualified route earns the premium forecast.');
}
