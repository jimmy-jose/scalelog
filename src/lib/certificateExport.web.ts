import type Svg from "react-native-svg";
import { CERTIFICATE_EXPORT_SCALE, CERTIFICATE_HEIGHT, CERTIFICATE_WIDTH } from "./certificateArtwork";
import { publicSiteUrl } from "@/domain/certificates";

export function getCertificateSiteUrl(): string | undefined {
  return publicSiteUrl(process.env.EXPO_PUBLIC_SITE_URL) ?? publicSiteUrl(typeof window !== "undefined" ? window.location.origin : undefined);
}

export async function exportCertificate(xml: string, id: string, _svg: Svg | null): Promise<void> {
  const sourceUrl = URL.createObjectURL(new Blob([xml], { type: "image/svg+xml;charset=utf-8" }));
  try {
    const image = new Image();
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error("The certificate image could not be generated. Please try again."));
      image.src = sourceUrl;
    });
    const canvas = document.createElement("canvas");
    canvas.width = CERTIFICATE_WIDTH * CERTIFICATE_EXPORT_SCALE;
    canvas.height = CERTIFICATE_HEIGHT * CERTIFICATE_EXPORT_SCALE;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("This browser cannot generate the certificate image. Try another browser.");
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const png = await new Promise<Blob>((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("The download could not be prepared. Please try again.")), "image/png"));
    const downloadUrl = URL.createObjectURL(png);
    const link = document.createElement("a");
    try {
      link.href = downloadUrl;
      link.download = `ScaleLog-Startup-CTO-${id}.png`;
      document.body.appendChild(link);
      link.click();
    } finally {
      link.remove();
      // Leave enough time for browsers to begin consuming the download.
      setTimeout(() => URL.revokeObjectURL(downloadUrl), 60_000);
    }
  } finally { URL.revokeObjectURL(sourceUrl); }
}
