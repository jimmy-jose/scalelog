const assert = require("node:assert/strict");
const { test } = require("node:test");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");

// Enable TypeScript transpilation
require.extensions[".ts"] = (module, filename) =>
  module._compile(
    ts.transpileModule(fs.readFileSync(filename, "utf8"), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2020,
        esModuleInterop: true,
      },
    }).outputText,
    filename
  );

const {
  isValidCertificateId,
  validateMintPayload,
  buildPublicVerificationResponse,
} = require("../src/domain/certificateStore");
const { maskEmail, isValidCertificateEmail } = require("../src/domain/certificates");

test("isValidCertificateId validates format correctly", () => {
  assert.equal(isValidCertificateId("SL-SCTO-20261014-JJ2026"), true);
  assert.equal(isValidCertificateId("SL-SCTO-20261014-ABC12345"), true);
  assert.equal(isValidCertificateId("SL-SCTO-2026-JJ2026"), false);
  assert.equal(isValidCertificateId("INVALID-ID"), false);
  assert.equal(isValidCertificateId(""), false);
  assert.equal(isValidCertificateId(null), false);
});

test("validateMintPayload requires name and valid email before minting", () => {
  // Missing email
  const noEmail = validateMintPayload({
    id: "SL-SCTO-20261014-JJ2026",
    recipientName: "Jimmy Jose",
    campaignId: "startup-cto",
    levelCount: 36,
  });
  assert.ok(noEmail.error);
  assert.match(noEmail.error, /email/i);

  // Invalid email
  const badEmail = validateMintPayload({
    id: "SL-SCTO-20261014-JJ2026",
    recipientName: "Jimmy Jose",
    recipientEmail: "not-an-email",
    campaignId: "startup-cto",
    levelCount: 36,
  });
  assert.ok(badEmail.error);
  assert.match(badEmail.error, /valid email/i);

  // Missing name
  const noName = validateMintPayload({
    id: "SL-SCTO-20261014-JJ2026",
    recipientName: "   ",
    recipientEmail: "jimmy@example.com",
    campaignId: "startup-cto",
    levelCount: 36,
  });
  assert.ok(noName.error);
  assert.match(noName.error, /Recipient name/i);

  // Invalid campaign
  const badCampaign = validateMintPayload({
    id: "SL-SCTO-20261014-JJ2026",
    recipientName: "Jimmy Jose",
    recipientEmail: "jimmy@example.com",
    campaignId: "other-campaign",
    levelCount: 36,
  });
  assert.ok(badCampaign.error);
  assert.match(badCampaign.error, /Unsupported campaign/i);

  // Incomplete levels
  const badLevels = validateMintPayload({
    id: "SL-SCTO-20261014-JJ2026",
    recipientName: "Jimmy Jose",
    recipientEmail: "jimmy@example.com",
    campaignId: "startup-cto",
    levelCount: 35,
  });
  assert.ok(badLevels.error);
  assert.match(badLevels.error, /Level count must be 36/i);

  // Valid payload
  const valid = validateMintPayload({
    id: "SL-SCTO-20261014-JJ2026",
    recipientName: "Jimmy Jose",
    recipientEmail: "  Jimmy@Example.com  ",
    campaignId: "startup-cto",
    levelCount: 36,
    issuedAt: "2026-10-14T12:00:00.000Z",
  });
  assert.equal(valid.error, undefined);
  assert.ok(valid.record);
  assert.equal(valid.record.id, "SL-SCTO-20261014-JJ2026");
  assert.equal(valid.record.recipientName, "Jimmy Jose");
  assert.equal(valid.record.recipientEmail, "jimmy@example.com");
  assert.equal(valid.record.levelCount, 36);
  assert.equal(valid.record.verified, true);
  assert.ok(valid.record.signature);
  assert.ok(valid.record.mintedAt);
});

test("buildPublicVerificationResponse returns masked email and verification details", () => {
  const publicRes = buildPublicVerificationResponse({
    id: "SL-SCTO-20261014-JJ2026",
    campaignId: "startup-cto",
    campaignTitle: "Startup CTO",
    recipientName: "Jimmy Jose",
    recipientEmail: "jimmy@example.com",
    levelCount: 36,
    issuedAt: "2026-10-14T12:00:00.000Z",
    mintedAt: "2026-10-14T12:05:00.000Z",
    signature: "sig12345",
    verified: true,
  });

  assert.equal(publicRes.verified, true);
  assert.equal(publicRes.id, "SL-SCTO-20261014-JJ2026");
  assert.equal(publicRes.recipientName, "Jimmy Jose");
  assert.equal(publicRes.maskedEmail, "j***y@example.com");
  assert.equal(publicRes.hasLinkedEmail, true);
  assert.equal(publicRes.levelCount, 36);
  // Email raw is not exposed in public verification response
  assert.equal(publicRes.recipientEmail, undefined);
});

test('minting validates and preserves scores including zero while accepting older unscored certificates', () => {
  const payload = { id: 'SL-SCTO-20261014-ABC12345', recipientName: 'Alex', recipientEmail: 'alex@example.com', campaignId: 'startup-cto', levelCount: 36 };
  for (const score of [0, 8.7, 10]) {
    const result = validateMintPayload({ ...payload, score });
    assert.equal(result.error, undefined);
    assert.equal(result.record.score, score);
    assert.equal(buildPublicVerificationResponse(result.record).score, score);
  }
  for (const score of [-0.1, 10.1, NaN, Infinity, '8.7', null, {}, 8.75]) {
    assert.match(validateMintPayload({ ...payload, score }).error, /score/i);
  }
  const legacy = validateMintPayload(payload);
  assert.equal(legacy.error, undefined);
  assert.equal(legacy.record.score, undefined);
  assert.equal(buildPublicVerificationResponse(legacy.record).score, undefined);
});
