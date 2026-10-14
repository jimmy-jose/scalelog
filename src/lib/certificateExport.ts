import type Svg from "react-native-svg";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { publicSiteUrl } from "@/domain/certificates";
import { CERTIFICATE_EXPORT_SCALE, CERTIFICATE_HEIGHT, CERTIFICATE_WIDTH } from "./certificateArtwork";

export function getCertificateSiteUrl(): string | undefined {
  return publicSiteUrl(process.env.EXPO_PUBLIC_SITE_URL);
}

export async function exportCertificate(_xml: string, id: string, svg: Svg | null): Promise<void> {
  if (!svg || !FileSystem.cacheDirectory) throw new Error("Your certificate is still loading. Please try again.");
  if (!await Sharing.isAvailableAsync()) throw new Error("Image sharing is unavailable on this device. Open ScaleLog in a browser to download your certificate.");
  const data = await new Promise<string>((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error("The certificate image took too long to generate. Please try again.")), 15_000);
    try {
      svg.toDataURL((base64) => {
        clearTimeout(timeout);
        if (base64) resolve(base64);
        else reject(new Error("The certificate image could not be generated."));
      }, { width: CERTIFICATE_WIDTH * CERTIFICATE_EXPORT_SCALE, height: CERTIFICATE_HEIGHT * CERTIFICATE_EXPORT_SCALE });
    } catch (error) { clearTimeout(timeout); reject(error); }
  });
  const uri = `${FileSystem.cacheDirectory}ScaleLog-Startup-CTO-${id}.png`;
  await FileSystem.writeAsStringAsync(uri, data, { encoding: FileSystem.EncodingType.Base64 });
  await Sharing.shareAsync(uri, { mimeType: "image/png", UTI: "public.png", dialogTitle: "Save or share your ScaleLog certificate" });
}
