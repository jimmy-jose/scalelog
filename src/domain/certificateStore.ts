import {
  CERTIFICATE_CAMPAIGN_ID,
  CERTIFICATE_NAME_LIMIT,
  createCredentialSignature,
  isValidCertificateEmail,
  maskEmail,
  normalizeCertificateEmail,
  normalizeCertificateName,
  type CampaignCertificate,
} from "./certificates";

export interface StoredCertificateRecord {
  id: string;
  campaignId: string;
  campaignTitle: string;
  recipientName: string;
  recipientEmail: string;
  levelCount: number;
  issuedAt: string;
  mintedAt: string;
  signature: string;
  verified: true;
}

export interface VerificationResult {
  verified: boolean;
  id?: string;
  recipientName?: string;
  campaignId?: string;
  campaignTitle?: string;
  levelCount?: number;
  issuedAt?: string;
  mintedAt?: string;
  maskedEmail?: string;
  hasLinkedEmail?: boolean;
  error?: string;
}

export function isValidCertificateId(id: unknown): id is string {
  return typeof id === "string" && /^SL-SCTO-\d{8}-[A-Z0-9]{4,16}$/.test(id.trim());
}

export function validateMintPayload(body: unknown): {
  error?: string;
  record?: StoredCertificateRecord;
} {
  if (!body || typeof body !== "object") {
    return { error: "Request body must be a JSON object." };
  }

  const { id, recipientName, recipientEmail, campaignId, levelCount, issuedAt } =
    body as Record<string, unknown>;

  if (!isValidCertificateId(id)) {
    return { error: "Invalid certificate ID format." };
  }

  const cleanName =
    typeof recipientName === "string" ? normalizeCertificateName(recipientName) : "";
  if (!cleanName || cleanName.length > CERTIFICATE_NAME_LIMIT) {
    return { error: `Recipient name must be between 1 and ${CERTIFICATE_NAME_LIMIT} characters.` };
  }

  const cleanEmail =
    typeof recipientEmail === "string" ? normalizeCertificateEmail(recipientEmail) : "";
  if (!cleanEmail || !isValidCertificateEmail(cleanEmail)) {
    return { error: "Please enter a valid email address to link with your certificate." };
  }

  if (campaignId !== CERTIFICATE_CAMPAIGN_ID) {
    return { error: `Unsupported campaign ID "${String(campaignId)}".` };
  }

  const count = Number(levelCount);
  if (!Number.isInteger(count) || count !== 36) {
    return { error: "Level count must be 36 for Startup CTO certification." };
  }

  const issued = typeof issuedAt === "string" ? issuedAt : new Date().toISOString();
  const mintedAt = new Date().toISOString();

  const certPayload: CampaignCertificate = {
    id: id.trim(),
    campaignId: CERTIFICATE_CAMPAIGN_ID,
    campaignTitle: "Startup CTO",
    recipientName: cleanName,
    recipientEmail: cleanEmail,
    levelCount: 36,
    issuedAt: issued,
    mintedAt,
    isMinted: true,
  };

  const signature = createCredentialSignature(certPayload);

  return {
    record: {
      id: certPayload.id,
      campaignId: certPayload.campaignId,
      campaignTitle: certPayload.campaignTitle,
      recipientName: certPayload.recipientName,
      recipientEmail: cleanEmail,
      levelCount: certPayload.levelCount,
      issuedAt: certPayload.issuedAt,
      mintedAt,
      signature,
      verified: true,
    },
  };
}

export function buildPublicVerificationResponse(
  record: StoredCertificateRecord
): VerificationResult {
  return {
    verified: true,
    id: record.id,
    recipientName: record.recipientName,
    campaignId: record.campaignId,
    campaignTitle: record.campaignTitle || "Startup CTO",
    levelCount: record.levelCount,
    issuedAt: record.issuedAt,
    mintedAt: record.mintedAt,
    hasLinkedEmail: Boolean(record.recipientEmail),
    maskedEmail: record.recipientEmail ? maskEmail(record.recipientEmail) : undefined,
  };
}
