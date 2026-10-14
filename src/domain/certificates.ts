import type { Campaign } from "./types";

export const CERTIFICATE_CAMPAIGN_ID = "startup-cto";
export const CERTIFICATE_NAME_LIMIT = 100;

export interface CampaignCertificate {
  id: string;
  campaignId: string;
  campaignTitle: string;
  recipientName: string;
  levelCount: number;
  issuedAt: string;
}

export function normalizeCertificateName(name: string): string {
  return name.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim();
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
