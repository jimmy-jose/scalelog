import type { Campaign } from "./types";

export const CERTIFICATE_CAMPAIGN_ID = "startup-cto";
export const CERTIFICATE_NAME_LIMIT = 100;

export interface CampaignCertificate {
  id: string;
  campaignId: string;
  campaignTitle: string;
  recipientName: string;
  recipientEmail?: string;
  levelCount: number;
  issuedAt: string;
  mintedAt?: string;
  isMinted?: boolean;
}

export function normalizeCertificateName(name: string): string {
  return name.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim();
}

export function normalizeCertificateEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isValidCertificateEmail(email: string): boolean {
  const normalized = normalizeCertificateEmail(email);
  return (
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/.test(
      normalized
    ) && normalized.length <= 120
  );
}

export function maskEmail(email: string): string {
  const normalized = normalizeCertificateEmail(email);
  const atIndex = normalized.indexOf("@");
  if (atIndex <= 1) return normalized;
  const user = normalized.slice(0, atIndex);
  const domain = normalized.slice(atIndex);
  const maskedUser =
    user.length <= 2
      ? `${user[0]}*`
      : `${user[0]}${"*".repeat(Math.min(user.length - 2, 4))}${user.slice(-1)}`;
  return `${maskedUser}${domain}`;
}

export function canEarnCertificate(campaign: Campaign | undefined, save: {
  progress: { completedLevels: string[] };
  failureReason?: string;
}): campaign is Campaign {
  return Boolean(campaign?.id === CERTIFICATE_CAMPAIGN_ID && campaign.levelIds.length > 0 &&
    !save.failureReason && campaign.levelIds.every((id) => save.progress.completedLevels.includes(id)));
}

export function createCampaignCertificate(campaign: Campaign, name: string, now = new Date()): CampaignCertificate {
  return {
    id: `SL-SCTO-${now.toISOString().slice(0, 10).replace(/-/g, "")}-${Math.random().toString(36).slice(2, 10).toUpperCase()}`,
    campaignId: campaign.id,
    campaignTitle: campaign.title,
    recipientName: normalizeCertificateName(name).slice(0, CERTIFICATE_NAME_LIMIT),
    levelCount: campaign.levelIds.length,
    issuedAt: now.toISOString(),
  };
}

export function certificateDate(certificate: CampaignCertificate): string {
  return new Date(certificate.issuedAt).toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
}

export function certificateIssuedMonthYear(certificate: CampaignCertificate): string {
  return new Date(certificate.issuedAt).toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
}

/** Only a public root URL belongs in a certificate. Never carry query strings or player data. */
export function publicSiteUrl(value?: string): string | undefined {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    if (!/^https?:$/.test(url.protocol) || url.username || url.password ||
      /(^localhost$|^127\.|^0\.0\.0\.0$|^\[::1\]$|\.local$)/i.test(url.hostname)) return undefined;
    return url.origin;
  } catch { return undefined; }
}

export function certificateReferralUrl(siteUrl?: string): string | undefined {
  const site = publicSiteUrl(siteUrl);
  return site ? `${site}/?utm_source=linkedin&utm_medium=certificate&utm_campaign=startup_cto` : undefined;
}

export function certificateCaption(certificate: CampaignCertificate, siteUrl?: string): string {
  const referral = certificateReferralUrl(siteUrl);
  return `I completed ${certificate.campaignTitle} on ScaleLog!\n\n${certificate.levelCount} system design scenarios: making architecture decisions, balancing cost and reliability, and learning from the consequences.\n\nWant to try the challenge?${referral ? `\n${referral}` : " Find ScaleLog and play your first campaign."}\n\n#SystemDesign #SoftwareEngineering #ScaleLog`;
}

// Deterministic SHA-256 for secure client & test credential signature without native dependencies.
function sha256Hex(ascii: string): string {
  function rightRotate(value: number, amount: number) { return (value >>> amount) | (value << (32 - amount)); }
  const mathPow = Math.pow;
  const maxWord = mathPow(2, 32);
  const words: number[] = [];
  const asciiBitLength = ascii.length * 8;
  const hash: number[] = [];
  const k: number[] = [];
  let primeCounter = 0;
  const isComposite: Record<number, number> = {};
  for (let candidate = 2; primeCounter < 64; candidate++) {
    if (!isComposite[candidate]) {
      for (let i = 0; i < 313; i += candidate) isComposite[i] = candidate;
      hash[primeCounter] = (mathPow(candidate, 0.5) * maxWord) | 0;
      k[primeCounter++] = (mathPow(candidate, 1 / 3) * maxWord) | 0;
    }
  }
  ascii += "\x80";
  while (ascii.length % 64 - 56) ascii += "\x00";
  for (let i = 0; i < ascii.length; i++) {
    const j = ascii.charCodeAt(i);
    words[i >> 2] |= j << ((3 - i % 4) * 8);
  }
  words[words.length] = ((asciiBitLength / maxWord) | 0);
  words[words.length] = (asciiBitLength);
  for (let j = 0; j < words.length;) {
    const w = words.slice(j, j += 16);
    const oldHash = hash.slice(0);
    for (let i = 0; i < 64; i++) {
      const w15 = w[i - 15], w2 = w[i - 2];
      const s0 = rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3);
      const s1 = rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10);
      const ch = (hash[4] & hash[5]) ^ (~hash[4] & hash[6]);
      const temp1 = (hash[7] + (rightRotate(hash[4], 6) ^ rightRotate(hash[4], 11) ^ rightRotate(hash[4], 25)) + ch + k[i] + (w[i] = (i < 16) ? w[i] : (w[i - 16] + s0 + w[i - 7] + s1) | 0)) | 0;
      const maj = (hash[0] & hash[1]) ^ (hash[0] & hash[2]) ^ (hash[1] & hash[2]);
      const temp2 = ((rightRotate(hash[0], 2) ^ rightRotate(hash[0], 13) ^ rightRotate(hash[0], 22)) + maj) | 0;
      hash[7] = hash[6];
      hash[6] = hash[5];
      hash[5] = hash[4];
      hash[4] = (hash[3] + temp1) | 0;
      hash[3] = hash[2];
      hash[2] = hash[1];
      hash[1] = hash[0];
      hash[0] = (temp1 + temp2) | 0;
    }
    for (let i = 0; i < 8; i++) hash[i] = (hash[i] + oldHash[i]) | 0;
  }
  let result = "";
  for (let i = 0; i < 8; i++) {
    for (let j = 3; j + 1; j--) {
      const b = (hash[i] >> (j * 8)) & 255;
      result += ((b < 16) ? "0" : "") + b.toString(16);
    }
  }
  return result;
}

const CREDENTIAL_SECRET = "scalelog-credential-v1-sig";

export function createCredentialSignature(certificate: {
  id: string;
  campaignId: string;
  recipientName: string;
  levelCount: number;
  issuedAt: string;
}): string {
  const payload = `${CREDENTIAL_SECRET}|${certificate.id}|${certificate.campaignId}|${certificate.recipientName}|${certificate.levelCount}|${certificate.issuedAt}`;
  return sha256Hex(payload).slice(0, 16);
}

export function verifyCredentialSignature(
  certificate: {
    id: string;
    campaignId: string;
    recipientName: string;
    levelCount: number;
    issuedAt: string;
  },
  signature: string
): boolean {
  if (!signature || typeof signature !== "string") return false;
  const expected = createCredentialSignature(certificate);
  return expected.toLowerCase() === signature.toLowerCase();
}

export function getCertificateVerificationUrl(certificate: CampaignCertificate, siteUrl?: string): string | undefined {
  const site = publicSiteUrl(siteUrl);
  if (!site) return undefined;
  return `${site}/verify?id=${encodeURIComponent(certificate.id)}`;
}

export function getCertificateLegacyVerificationUrl(certificate: CampaignCertificate, siteUrl?: string): string | undefined {
  const site = publicSiteUrl(siteUrl);
  if (!site) return undefined;
  const sig = createCredentialSignature(certificate);
  const searchParams = new URLSearchParams({
    id: certificate.id,
    name: certificate.recipientName,
    campaign: certificate.campaignId,
    levels: String(certificate.levelCount),
    issued: certificate.issuedAt,
    sig,
  });
  return `${site}/verify?${searchParams.toString()}`;
}
