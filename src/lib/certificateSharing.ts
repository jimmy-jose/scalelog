import { Linking, Platform, Share } from "react-native";
import * as Clipboard from "expo-clipboard";
import { certificateCaption, getCertificateVerificationUrl, type CampaignCertificate } from "@/domain/certificates";

export function certificateShareMessage(certificate: CampaignCertificate, siteUrl?: string): string {
  const verificationUrl = getCertificateVerificationUrl(certificate, siteUrl);
  return `${certificateCaption(certificate, siteUrl)}${verificationUrl ? `\n\nMy certificate: ${verificationUrl}` : ""}`;
}

async function copyMessage(message: string): Promise<"copied"> {
  if (!(await Clipboard.setStringAsync(message))) {
    throw new Error("Sharing is unavailable. Select and copy the message below to share it manually.");
  }
  return "copied";
}

/** Pass the message to the share sheet in the original click, before any async work. */
export async function shareCertificateMessage(message: string): Promise<"shared" | "copied" | "cancelled"> {
  if (Platform.OS === "web") {
    if (typeof navigator === "undefined" || !navigator.share) return copyMessage(message);
    try {
      await navigator.share({ title: "My ScaleLog certificate", text: message });
      return "shared";
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return "cancelled";
      return copyMessage(message);
    }
  }
  const result = await Share.share({ title: "My ScaleLog certificate", message });
  return result.action === Share.dismissedAction ? "cancelled" : "shared";
}

/** LinkedIn accepts a URL, so copy the caption without delaying the new tab. */
export async function shareCertificateOnLinkedIn(message: string, target: string): Promise<boolean> {
  const copy = Clipboard.setStringAsync(message);
  const open = Linking.openURL(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(target)}`);
  const [copied, opened] = await Promise.allSettled([copy, open]);
  if (opened.status === "rejected") {
    throw new Error(copied.status === "fulfilled" && copied.value
      ? "Message copied, but LinkedIn could not be opened. Open LinkedIn and paste it into a new post."
      : "LinkedIn could not be opened. Copy the message below and share it manually.");
  }
  return copied.status === "fulfilled" && copied.value;
}
