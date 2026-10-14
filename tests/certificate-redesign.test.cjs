const assert = require("node:assert/strict");
const { test } = require("node:test");
const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const ts = require("typescript");

const root = path.resolve(__dirname, "..");
const saved = new Map();
const writes = [];
const shares = [];
let sharingAvailable = true;

const originalLoad = Module._load;
Module._load = function (id, parent, main) {
  if (id === "@react-native-async-storage/async-storage") {
    return {
      getItem: async (key) => saved.get(key) ?? null,
      setItem: async (key, value) => {
        saved.set(key, value);
      },
      removeItem: async (key) => {
        saved.delete(key);
      },
    };
  }
  if (id === "expo-file-system") {
    return {
      cacheDirectory: "file:///cache/",
      EncodingType: { Base64: "base64" },
      writeAsStringAsync: async (...args) => {
        writes.push(args);
      },
    };
  }
  if (id === "expo-sharing") {
    return {
      isAvailableAsync: async () => sharingAvailable,
      shareAsync: async (...args) => {
        shares.push(args);
      },
    };
  }
  return originalLoad.call(
    this,
    id.startsWith("@/") ? path.join(root, "src", id.slice(2)) : id,
    parent,
    main
  );
};

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
  createCampaignCertificate,
  createCredentialSignature,
  verifyCredentialSignature,
  getCertificateVerificationUrl,
  getCertificateLegacyVerificationUrl,
  normalizeCertificateEmail,
  isValidCertificateEmail,
  maskEmail,
  certificateDate,
  certificateIssuedMonthYear,
} = require("../src/domain/certificates");
const {
  certificateArtwork,
  CERTIFICATE_WIDTH,
  CERTIFICATE_HEIGHT,
  CERTIFICATE_EXPORT_SCALE,
} = require("../src/lib/certificateArtwork");
const { exportCertificate: exportNative } = require("../src/lib/certificateExport");
const { exportCertificate: exportWeb } = require("../src/lib/certificateExport.web");
const { buildA4LandscapePdf, base64ToUint8Array } = require("../src/lib/certificatePdf");
const { generateQrMatrix, renderQrSvg } = require("../src/lib/qrCode");

const sampleCertificate = {
  id: "SL-SCTO-20261014-JJ2026",
  campaignId: "startup-cto",
  campaignTitle: "Startup CTO",
  recipientName: "Jimmy Jose",
  levelCount: 36,
  issuedAt: "2026-10-14T12:00:00.000Z",
};

test("certificate artwork renders A4 landscape viewBox and reference colors", () => {
  assert.equal(CERTIFICATE_WIDTH, 1200);
  assert.equal(CERTIFICATE_HEIGHT, 848);
  assert.equal(CERTIFICATE_EXPORT_SCALE, 2);

  const xml = certificateArtwork(sampleCertificate, "https://scalelog.example");
  assert.match(xml, /viewBox="0 0 1200 848"/);
  assert.match(xml, /fill="#F8F5EE"/); // Warm ivory background
  assert.match(xml, /#A35F35/); // Copper accents
  assert.match(xml, /#17202B/); // Deep charcoal typography
});

test("certificate artwork includes full hierarchy: borders, headers, seals, laurels, and wireframes", () => {
  const xml = certificateArtwork(sampleCertificate, "https://scalelog.example");

  // Borders and corner ornaments
  assert.match(xml, /rect x="22" y="22" width="1156" height="804"/);
  assert.match(xml, /rect x="29" y="29" width="1142" height="790"/);

  // Top header branding
  assert.match(xml, /SCALELOG/);
  assert.match(xml, /INTERACTIVE SYSTEM DESIGN SIMULATOR/);
  assert.match(xml, /LEARN/);
  assert.match(xml, /DESIGN/);
  assert.match(xml, /DECIDE/);
  assert.match(xml, /SCALE/);
  assert.match(xml, /SYSTEMS/);
  assert.match(xml, /ARCHITECTURE/);
  assert.match(xml, /TRADEOFFS/);
  assert.match(xml, /IN PRACTICE/);

  // Main headings
  assert.match(xml, /Certificate of Achievement/);
  assert.match(xml, /SOFTWARE ARCHITECTURE &amp; SYSTEM DESIGN/);
  assert.match(xml, /AWARDED TO/);
  assert.match(xml, /Jimmy Jose/);

  // Description
  assert.match(xml, /Startup CTO: From Garage to Growth/);
  assert.match(xml, /scalability, reliability, performance, and cost/);

  // Achievement count and laurels
  assert.match(xml, /36 \/ 36/);
  assert.match(xml, /SCENARIOS COMPLETED/);
  assert.match(xml, /id="achievement-indicator"/);

  // Circular ScaleLog seal
  assert.match(xml, /id="scalelog-seal"/);
  assert.match(xml, /SYSTEM DESIGN SIMULATOR/);

  // Metadata columns and footer
  assert.match(xml, /ISSUED/);
  assert.match(xml, /October 2026/);
  assert.match(xml, /CREDENTIAL ID/);
  assert.match(xml, /SL-SCTO-20261014-JJ2026/);
  assert.match(xml, /PROJECT/);
  assert.match(xml, /scalelog.example/);
  assert.match(xml, /LEARN SYSTEM DESIGN BY MAKING REAL ENGINEERING DECISIONS/);
});

test("long recipient names are scaled gracefully without clipping", () => {
  const longNameCert = {
    ...sampleCertificate,
    recipientName: "Dr. Elizabeth Victoria Montgomery-Windsor of Cambridge the Third",
  };
  const xml = certificateArtwork(longNameCert, "https://scalelog.example");
  assert.match(xml, /Elizabeth Victoria Montgomery-Windsor/);
  assert.match(xml, /of Cambridge the Third/);
  // Verify font-size is dynamically adjusted lower than default 46
  assert.doesNotMatch(xml, /font-size="46".*Elizabeth/);
});

test("QR code is rendered when public site URL is provided and omitted when absent", () => {
  const withPublic = certificateArtwork(sampleCertificate, "https://scalelog.example");
  assert.match(withPublic, /id="qr-verification"/);
  assert.match(withPublic, /VERIFY/);
  assert.match(withPublic, /CREDENTIAL/);

  const withoutPublic = certificateArtwork(sampleCertificate, undefined);
  assert.doesNotMatch(withoutPublic, /id="qr-verification"/);

  const withLocalhost = certificateArtwork(sampleCertificate, "http://localhost:8081");
  assert.doesNotMatch(withLocalhost, /id="qr-verification"/);
});

test("credential signatures are deterministic and reject tampering", () => {
  const sig = createCredentialSignature(sampleCertificate);
  assert.ok(typeof sig === "string" && sig.length === 16);
  assert.equal(verifyCredentialSignature(sampleCertificate, sig), true);

  // Rejection on tampering
  assert.equal(
    verifyCredentialSignature({ ...sampleCertificate, recipientName: "Imposter" }, sig),
    false
  );
  assert.equal(
    verifyCredentialSignature({ ...sampleCertificate, levelCount: 35 }, sig),
    false
  );
  assert.equal(
    verifyCredentialSignature({ ...sampleCertificate, id: "SL-FAKE-ID" }, sig),
    false
  );
  assert.equal(
    verifyCredentialSignature({ ...sampleCertificate, campaignId: "other" }, sig),
    false
  );
  assert.equal(verifyCredentialSignature(sampleCertificate, "invalid-sig"), false);
  assert.equal(verifyCredentialSignature(sampleCertificate, ""), false);
});

test("verification URL includes unique ID for verifiable QR code", () => {
  const url = getCertificateVerificationUrl(sampleCertificate, "https://scalelog.example");
  assert.ok(url);
  const parsed = new URL(url);
  assert.equal(parsed.origin, "https://scalelog.example");
  assert.equal(parsed.pathname, "/verify");
  assert.equal(parsed.searchParams.get("id"), sampleCertificate.id);
  assert.equal(parsed.searchParams.get("name"), null); // Clean URL does not leak name
});

test("legacy verification URL retains full parameters and signature", () => {
  const url = getCertificateLegacyVerificationUrl(sampleCertificate, "https://scalelog.example");
  assert.ok(url);
  const parsed = new URL(url);
  assert.equal(parsed.origin, "https://scalelog.example");
  assert.equal(parsed.pathname, "/verify");
  assert.equal(parsed.searchParams.get("id"), sampleCertificate.id);
  assert.equal(parsed.searchParams.get("name"), "Jimmy Jose");
  assert.equal(parsed.searchParams.get("campaign"), "startup-cto");
  assert.equal(parsed.searchParams.get("levels"), "36");
  assert.ok(parsed.searchParams.get("sig"));
});

test("email validation, normalization, and masking", () => {
  assert.equal(normalizeCertificateEmail("  Test@Example.COM  "), "test@example.com");
  assert.equal(isValidCertificateEmail("test@example.com"), true);
  assert.equal(isValidCertificateEmail("user.name+tag@company.co.uk"), true);
  assert.equal(isValidCertificateEmail("invalid-email"), false);
  assert.equal(isValidCertificateEmail("@nodomain.com"), false);
  assert.equal(maskEmail("jimmy@example.com"), "j***y@example.com");
  assert.equal(maskEmail("al@company.org"), "a*@company.org");
});

test("pure TypeScript QR code matrix generates correct finder patterns and SVG", () => {
  const matrix = generateQrMatrix("https://scalelog.example/verify");
  assert.ok(matrix.length >= 21); // At least Version 1
  assert.equal(matrix.length, matrix[0].length); // Square
  // Top-left finder pattern center (row 3, col 3) is true
  assert.equal(matrix[3][3], true);

  const svg = renderQrSvg("https://scalelog.example/verify", 0, 0, 64, "#17202B");
  assert.match(svg, /^<path d="M/);
  assert.match(svg, /fill="#17202B"/);
});

test("PDF builder generates valid A4 landscape PDF 1.4 document", () => {
  const dummyJpeg = new Uint8Array([
    0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x01,
    0x00, 0x48, 0x00, 0x48, 0x00, 0x00, 0xff, 0xd9,
  ]);
  const pdfBytes = buildA4LandscapePdf(dummyJpeg, 2400, 1696);
  const pdfStr = Buffer.from(pdfBytes).toString("binary");

  assert.match(pdfStr, /^%PDF-1\.4/);
  assert.match(pdfStr, /\/MediaBox \[0 0 841\.89 595\.28\]/); // A4 Landscape
  assert.match(pdfStr, /\/Filter \/DCTDecode/);
  assert.match(pdfStr, /\/Width 2400 \/Height 1696/);
  assert.match(pdfStr, /xref/);
  assert.match(pdfStr, /%%EOF\n?$/);
});

test("web export supports both PNG and PDF formats", async () => {
  const originalImage = global.Image;
  const originalDocument = global.document;
  const originalCreate = URL.createObjectURL;
  const originalRevoke = URL.revokeObjectURL;
  const originalTimeout = global.setTimeout;
  const downloadedFiles = [];

  const anchor = {
    remove() {},
    set download(name) {
      downloadedFiles.push(name);
    },
    click() {},
  };
  const canvas = {
    getContext: () => ({
      drawImage: () => {},
    }),
    toBlob: (callback, type) => {
      callback(new Blob(["IMG"], { type }));
    },
    toDataURL: (type) =>
      "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=",
  };

  global.Image = class {
    set src(_url) {
      queueMicrotask(() => this.onload());
    }
  };
  global.document = {
    fonts: { ready: Promise.resolve() },
    body: { appendChild() {} },
    createElement: (type) => (type === "canvas" ? canvas : anchor),
  };
  URL.createObjectURL = (blob) => "blob:" + blob.type;
  URL.revokeObjectURL = () => {};
  global.setTimeout = (callback, ms) => {
    const timer = originalTimeout(callback, ms);
    timer.unref();
    return timer;
  };

  try {
    // Test PNG export
    await exportWeb("<svg/>", "TEST-PNG", null, "png");
    assert.equal(downloadedFiles.at(-1), "ScaleLog-Startup-CTO-TEST-PNG.png");

    // Test PDF export
    await exportWeb("<svg/>", "TEST-PDF", null, "pdf");
    assert.equal(downloadedFiles.at(-1), "ScaleLog-Startup-CTO-TEST-PDF.pdf");
  } finally {
    global.Image = originalImage;
    global.document = originalDocument;
    URL.createObjectURL = originalCreate;
    URL.revokeObjectURL = originalRevoke;
    global.setTimeout = originalTimeout;
  }
});

test("native export supports both PNG and PDF sharing", async () => {
  writes.length = 0;
  shares.length = 0;

  // Native PNG
  await exportNative("<svg/>", "NAT-PNG", {
    toDataURL: (cb) => cb("BASE64_DATA"),
  }, "png");
  assert.equal(writes.at(-1)[0], "file:///cache/ScaleLog-Startup-CTO-NAT-PNG.png");
  assert.equal(shares.at(-1)[1].mimeType, "image/png");

  // Native PDF
  await exportNative("<svg/>", "NAT-PDF", {
    toDataURL: (cb) => cb("BASE64_DATA"),
  }, "pdf");
  assert.equal(writes.at(-1)[0], "file:///cache/ScaleLog-Startup-CTO-NAT-PDF.pdf");
  assert.equal(shares.at(-1)[1].mimeType, "application/pdf");
});
