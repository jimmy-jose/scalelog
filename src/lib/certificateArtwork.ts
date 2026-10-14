import { certificateDate, publicSiteUrl, type CampaignCertificate } from "@/domain/certificates";

export const CERTIFICATE_WIDTH = 1200;
export const CERTIFICATE_HEIGHT = 900;
export const CERTIFICATE_EXPORT_SCALE = 2;

const escapeXml = (value: string) => value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[character]!);

function nameLines(name: string): string[] {
  const characters = Array.from(name);
  if (characters.length <= 38) return [name];
  const middle = Math.ceil(characters.length / 2);
  const spaces = characters.map((character, index) => character === " " ? index : -1).filter((index) => index > 0 && index < characters.length - 1);
  const split = spaces.length ? spaces.reduce((nearest, index) => Math.abs(index - middle) < Math.abs(nearest - middle) ? index : nearest) : middle;
  return [characters.slice(0, split).join("").trim(), characters.slice(split).join("").trim()];
}

/** One vector master for the in-app preview and the exported image. No remote assets. */
export function certificateArtwork(certificate: CampaignCertificate, siteUrl?: string): string {
  const name = certificate.recipientName || "Your name";
  const lines = nameLines(name);
  const nameSize = Math.min(58, Math.floor(900 / (Math.max(...lines.map((line) => Array.from(line).length)) * 0.95)));
  const site = publicSiteUrl(siteUrl);
  const domain = site ? new URL(site).host : "ScaleLog";
  const text = (x: number, y: number, value: string, size: number, fill = "#14283F", extra = "") =>
    `<text x="${x}" y="${y}" font-size="${size}" fill="${fill}" ${extra}>${escapeXml(value)}</text>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="900" viewBox="0 0 1200 900">
    <rect width="1200" height="900" fill="#FAF8F1"/>
    <rect width="18" height="820" fill="#14283F"/>
    <rect x="18" y="0" width="1182" height="8" fill="#AA8851"/>
    <rect x="42" y="32" width="1126" height="756" fill="none" stroke="#D9D1C1"/>
    <g font-family="Arial, sans-serif">
      ${text(88, 103, "ScaleLog", 34, "#14283F", 'font-weight="700"')}
      ${text(1110, 99, "SYSTEM DESIGN  /  CAMPAIGN 01", 15, "#576373", 'text-anchor="end" letter-spacing="2"')}
      <path d="M88 143H1110" stroke="#D9D1C1"/>
      ${text(88, 235, "Certificate of Completion", 60, "#14283F", 'font-family="Georgia, serif"')}
      ${text(90, 280, "STARTUP CTO  ·  FROM GARAGE TO GROWTH", 18, "#765A2F", 'letter-spacing="3" font-weight="700"')}
      ${text(90, 343, "PRESENTED TO", 14, "#576373", 'letter-spacing="3"')}
      ${lines.map((line, index) => text(88, (lines.length === 1 ? 418 : 393) + index * 43, line, nameSize, "#14283F", 'font-family="Georgia, serif"')).join("")}
      <path d="M90 458H1110" stroke="#D9D1C1"/>
      ${text(90, 508, `For completing all ${certificate.levelCount} scenarios in ScaleLog’s ${certificate.campaignTitle} campaign,`, 22)}
      ${text(90, 543, "exploring the tradeoffs behind building and scaling a software company.", 22)}
      ${text(90, 601, "ARCHITECTURE    /    SCALABILITY    /    RELIABILITY    /    COST TRADEOFFS", 14, "#576373", 'letter-spacing="1.3"')}
      ${text(90, 696, "DATE ISSUED", 12, "#576373", 'letter-spacing="2"')}
      ${text(90, 727, certificateDate(certificate), 20)}
      ${text(90, 758, certificate.id, 12, "#576373", 'letter-spacing="1"')}
      ${text(615, 697, "ScaleLog", 31, "#14283F", 'font-family="Georgia, serif" font-style="italic"')}
      <path d="M615 711H890" stroke="#AA8851"/>
      ${text(615, 740, "Learn system design. Make the decisions.", 14, "#576373")}
      <circle cx="1036" cy="704" r="59" fill="none" stroke="#AA8851" stroke-width="2"/>
      <circle cx="1036" cy="704" r="51" fill="none" stroke="#D9D1C1"/>
      <path d="m1016 698 14 14 26-29" fill="none" stroke="#765A2F" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
      ${text(1036, 735, "COMPLETED", 10, "#765A2F", 'text-anchor="middle" letter-spacing="1.5"')}
      <rect y="820" width="1200" height="80" fill="#14283F"/>
      ${text(90, 867, "Your next architecture decision starts here.", 21, "#FAF8F1")}
      ${text(1110, 867, domain, Math.min(23, Math.floor(420 / (domain.length * 0.65))), "#8CF4D2", 'text-anchor="end" font-weight="700"')}
    </g>
  </svg>`;
}
