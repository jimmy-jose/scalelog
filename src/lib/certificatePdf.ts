/**
 * Pure TypeScript PDF generator for A4 Landscape certificates.
 * Embeds high-resolution rasterized certificate graphics with zero external dependencies.
 */

export const A4_LANDSCAPE_WIDTH_PT = 841.89;
export const A4_LANDSCAPE_HEIGHT_PT = 595.28;

export function buildA4LandscapePdf(jpegBytes: Uint8Array, imageWidth: number, imageHeight: number): Uint8Array {
  const header = "%PDF-1.4\n";
  const offsets: number[] = [];
  const parts: (string | Uint8Array)[] = [header];
  let currentOffset = header.length;

  function addObj(content: string, streamBytes?: Uint8Array) {
    offsets.push(currentOffset);
    let str = `${offsets.length} 0 obj\n${content}\n`;
    if (streamBytes) {
      str += `stream\n`;
    }
    parts.push(str);
    currentOffset += str.length;

    if (streamBytes) {
      parts.push(streamBytes);
      currentOffset += streamBytes.length;
      const endStream = `\nendstream\nendobj\n`;
      parts.push(endStream);
      currentOffset += endStream.length;
    } else {
      const endObj = `endobj\n`;
      parts.push(endObj);
      currentOffset += endObj.length;
    }
  }

  // 1: Catalog
  addObj("<< /Type /Catalog /Pages 2 0 R >>");

  // 2: Pages
  addObj("<< /Type /Pages /Kids [3 0 R] /Count 1 >>");

  // 3: Page (A4 Landscape: 841.89 x 595.28 pt)
  addObj(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${A4_LANDSCAPE_WIDTH_PT} ${A4_LANDSCAPE_HEIGHT_PT}] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>`);

  // 4: Image XObject (JPEG DCTDecode)
  addObj(
    `<< /Type /XObject /Subtype /Image /Width ${imageWidth} /Height ${imageHeight} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpegBytes.length} >>`,
    jpegBytes
  );

  // 5: Contents stream drawing image full page
  const streamContent = `q\n${A4_LANDSCAPE_WIDTH_PT} 0 0 ${A4_LANDSCAPE_HEIGHT_PT} 0 0 cm\n/Im0 Do\nQ\n`;
  const streamBuf = new TextEncoder().encode(streamContent);
  addObj(`<< /Length ${streamBuf.length} >>`, streamBuf);

  // Cross-reference table
  const xrefOffset = currentOffset;
  let xref = `xref\n0 ${offsets.length + 1}\n0000000000 65535 f \n`;
  for (const offset of offsets) {
    xref += `${String(offset).padStart(10, "0")} 00000 n \n`;
  }
  const trailer = `trailer\n<< /Size ${offsets.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;
  parts.push(xref + trailer);

  // Calculate total length and concatenate
  let totalLength = 0;
  const encodedParts = parts.map((part) => {
    if (typeof part === "string") {
      const enc = new TextEncoder().encode(part);
      totalLength += enc.length;
      return enc;
    }
    totalLength += part.length;
    return part;
  });

  const finalPdf = new Uint8Array(totalLength);
  let pos = 0;
  for (const part of encodedParts) {
    finalPdf.set(part, pos);
    pos += part.length;
  }
  return finalPdf;
}

export function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = "";
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return btoa(binary);
}
