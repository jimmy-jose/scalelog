import type Svg from "react-native-svg";
import { CERTIFICATE_EXPORT_SCALE, CERTIFICATE_HEIGHT, CERTIFICATE_WIDTH } from "./certificateArtwork";
import { publicSiteUrl } from "@/domain/certificates";
import { base64ToUint8Array, buildA4LandscapePdf } from "./certificatePdf";

export function getCertificateSiteUrl(): string | undefined {
  return (
    publicSiteUrl(process.env.EXPO_PUBLIC_SITE_URL) ??
    publicSiteUrl(typeof window !== "undefined" ? window.location.origin : undefined)
  );
}

export async function exportCertificate(
  xml: string,
  id: string,
  _svg: Svg | null,
  format: "png" | "pdf" = "png"
): Promise<void> {
  if (typeof document !== "undefined" && document.fonts) {
    try {
      await document.fonts.ready;
    } catch {
      // Continue if font readiness check is unsupported
    }
  }

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

    let outputBlob: Blob;
    let extension = "png";

    if (format === "pdf") {
      extension = "pdf";
      try {
        const jpegDataUrl = canvas.toDataURL ? canvas.toDataURL("image/jpeg", 0.98) : "";
        if (jpegDataUrl && jpegDataUrl.startsWith("data:image/jpeg;base64,")) {
          const base64 = jpegDataUrl.slice("data:image/jpeg;base64,".length);
          const jpegBytes = base64ToUint8Array(base64);
          const pdfBytes = buildA4LandscapePdf(jpegBytes, canvas.width, canvas.height);
          outputBlob = new Blob([pdfBytes], { type: "application/pdf" });
        } else {
          outputBlob = await new Promise<Blob>((resolve, reject) =>
            canvas.toBlob(
              (blob) => (blob ? resolve(blob) : reject(new Error("The download could not be prepared. Please try again."))),
              "image/png"
            )
          );
          extension = "png";
        }
      } catch {
        outputBlob = await new Promise<Blob>((resolve, reject) =>
          canvas.toBlob(
            (blob) => (blob ? resolve(blob) : reject(new Error("The download could not be prepared. Please try again."))),
            "image/png"
          )
        );
        extension = "png";
      }
    } else {
      outputBlob = await new Promise<Blob>((resolve, reject) =>
        canvas.toBlob(
          (blob) => (blob ? resolve(blob) : reject(new Error("The download could not be prepared. Please try again."))),
          "image/png"
        )
      );
    }

    const downloadUrl = URL.createObjectURL(outputBlob);
    const link = document.createElement("a");
    try {
      link.href = downloadUrl;
      link.download = `ScaleLog-Startup-CTO-${id}.${extension}`;
      document.body.appendChild(link);
      link.click();
    } finally {
      link.remove();
      // Leave enough time for browsers to begin consuming the download.
      setTimeout(() => URL.revokeObjectURL(downloadUrl), 60_000);
    }
  } finally {
    URL.revokeObjectURL(sourceUrl);
  }
}
