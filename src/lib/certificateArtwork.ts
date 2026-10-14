import {
  certificateIssuedMonthYear,
  getCertificateVerificationUrl,
  publicSiteUrl,
  type CampaignCertificate,
} from "@/domain/certificates";
import { renderQrSvg } from "./qrCode";

export const CERTIFICATE_WIDTH = 1200;
export const CERTIFICATE_HEIGHT = 848;
export const CERTIFICATE_EXPORT_SCALE = 2;

const escapeXml = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&apos;",
      })[character]!
  );

function nameLines(name: string): string[] {
  const characters = Array.from(name);
  if (characters.length <= 38) return [name];
  const middle = Math.ceil(characters.length / 2);
  const spaces = characters
    .map((character, index) => (character === " " ? index : -1))
    .filter((index) => index > 0 && index < characters.length - 1);
  const split = spaces.length
    ? spaces.reduce((nearest, index) =>
        Math.abs(index - middle) < Math.abs(nearest - middle) ? index : nearest
      )
    : middle;
  return [
    characters.slice(0, split).join("").trim(),
    characters.slice(split).join("").trim(),
  ];
}

function getRecipientFontSize(lines: string[]): number {
  const maxLen = Math.max(...lines.map((l) => Array.from(l).length));
  if (lines.length > 1) {
    return Math.max(22, Math.min(34, Math.floor(750 / (maxLen * 0.9))));
  }
  if (maxLen <= 24) return 50;
  if (maxLen <= 32) return 42;
  if (maxLen <= 40) return 34;
  return Math.max(24, Math.floor(820 / (maxLen * 0.9)));
}

/**
 * Renders text along a circle arc with per-character rotation.
 * 100% compatible with all SVG engines, canvas, and CoreGraphics.
 */
function renderArcText(
  text: string,
  cx: number,
  cy: number,
  radius: number,
  startAngleDeg: number,
  endAngleDeg: number,
  rotOffset: number,
  fontSize: number,
  fill: string,
  extra = ""
): string {
  const chars = Array.from(text);
  if (chars.length === 0) return "";
  const angleSpan = endAngleDeg - startAngleDeg;
  const step = chars.length > 1 ? angleSpan / (chars.length - 1) : 0;
  return chars
    .map((char, i) => {
      const angle = startAngleDeg + i * step;
      const rad = (angle * Math.PI) / 180;
      const x = cx + radius * Math.cos(rad);
      const y = cy + radius * Math.sin(rad);
      const rotation = angle + rotOffset;
      return `<text x="${x.toFixed(2)}" y="${y.toFixed(2)}" font-size="${fontSize}" fill="${fill}" text-anchor="middle" dominant-baseline="central" transform="rotate(${rotation.toFixed(2)}, ${x.toFixed(2)}, ${y.toFixed(2)})" ${extra}>${escapeXml(char)}</text>`;
    })
    .join("");
}

/**
 * Classical copper laurel wreath flanking the scenarios completed count.
 */
function renderLaurelWreaths(): string {
  // Pairs of leaves along the crescent branch
  const sprigs = [
    { ox: 494, oy: 644, orot: -25, ix: 504, iy: 638, irot: 5 },
    { ox: 483, oy: 636, orot: -45, ix: 494, iy: 628, irot: -12 },
    { ox: 475, oy: 624, orot: -65, ix: 486, iy: 616, irot: -30 },
    { ox: 471, oy: 610, orot: -85, ix: 482, iy: 602, irot: -48 },
    { ox: 471, oy: 595, orot: -105, ix: 482, iy: 588, irot: -68 },
    { ox: 476, oy: 581, orot: -125, ix: 485, iy: 574, irot: -88 },
    { ox: 483, oy: 568, orot: -140, ix: 490, iy: 563, irot: -105 },
  ];

  const renderSide = (mirror: boolean) => {
    const leavesSvg = sprigs
      .map(({ ox, oy, orot, ix, iy, irot }) => {
        const actualOx = mirror ? 600 + (600 - ox) : ox;
        const actualIx = mirror ? 600 + (600 - ix) : ix;
        const actualOrot = mirror ? -orot : orot;
        const actualIrot = mirror ? -irot : irot;
        return `
          <ellipse cx="${actualOx}" cy="${oy}" rx="6" ry="2.7" transform="rotate(${actualOrot}, ${actualOx}, ${oy})" fill="#A35F35" />
          <ellipse cx="${actualIx}" cy="${iy}" rx="5.3" ry="2.4" transform="rotate(${actualIrot}, ${actualIx}, ${iy})" fill="#A35F35" />
        `;
      })
      .join("");

    const topLeafX = mirror ? 600 + (600 - 489) : 489;
    const topLeafRot = mirror ? 65 : -65;
    const topLeaf = `<ellipse cx="${topLeafX}" cy="556" rx="6" ry="2.6" transform="rotate(${topLeafRot}, ${topLeafX}, 556)" fill="#A35F35" />`;

    const stemD = mirror
      ? "M 506 648 C 532 638, 538 608, 521 562"
      : "M 494 648 C 468 638, 462 608, 479 562";

    return `
      <path d="${stemD}" fill="none" stroke="#A35F35" stroke-width="1.3" stroke-linecap="round"/>
      ${leavesSvg}
      ${topLeaf}
    `;
  };

  return `
    <g id="laurel-wreaths">
      ${renderSide(false)}
      ${renderSide(true)}
    </g>
  `;
}

/**
 * ScaleLog Circular Seal (Bottom Left) with 3D isometric architecture emblem.
 */
function renderScaleLogSeal(cx: number, cy: number): string {
  const topText = renderArcText(
    "SCALELOG",
    cx,
    cy,
    44,
    -148,
    -32,
    90,
    9,
    "#A35F35",
    'font-family="system-ui, -apple-system, sans-serif" font-weight="700"'
  );

  const bottomText = renderArcText(
    "SYSTEM DESIGN SIMULATOR",
    cx,
    cy,
    44,
    155,
    25,
    -90,
    6.8,
    "#A35F35",
    'font-family="system-ui, -apple-system, sans-serif" font-weight="600"'
  );

  return `
    <g id="scalelog-seal">
      <!-- Outer & Inner Rings -->
      <circle cx="${cx}" cy="${cy}" r="56" fill="none" stroke="#A35F35" stroke-width="1.5"/>
      <circle cx="${cx}" cy="${cy}" r="48" fill="none" stroke="#A35F35" stroke-width="0.75"/>

      <!-- Side Accent Diamonds -->
      <polygon points="${cx - 43},${cy - 2} ${cx - 41},${cy} ${cx - 43},${cy + 2} ${cx - 45},${cy}" fill="#A35F35"/>
      <polygon points="${cx + 43},${cy - 2} ${cx + 45},${cy} ${cx + 43},${cy + 2} ${cx + 41},${cy}" fill="#A35F35"/>

      <!-- Arched Typography -->
      ${topText}
      ${bottomText}

      <!-- Center Emblem: 3 Clustered Isometric Architecture Cubes -->
      <g stroke="#A35F35" stroke-width="1.2" stroke-linejoin="round">
        <!-- Top Cube -->
        <polygon points="${cx},${cy - 18} ${cx + 12},${cy - 11} ${cx},${cy - 4} ${cx - 12},${cy - 11}" fill="#F8F5EE"/>
        <polygon points="${cx - 12},${cy - 11} ${cx},${cy - 4} ${cx},${cy + 8} ${cx - 12},${cy + 1}" fill="#F8F5EE"/>
        <polygon points="${cx},${cy - 4} ${cx + 12},${cy - 11} ${cx + 12},${cy + 1} ${cx},${cy + 8}" fill="#F8F5EE"/>

        <!-- Bottom-Left Cube -->
        <polygon points="${cx - 12},${cy + 1} ${cx},${cy + 8} ${cx - 12},${cy + 15} ${cx - 24},${cy + 8}" fill="#F8F5EE"/>
        <polygon points="${cx - 24},${cy + 8} ${cx - 12},${cy + 15} ${cx - 12},${cy + 27} ${cx - 24},${cy + 20}" fill="#F8F5EE"/>
        <polygon points="${cx - 12},${cy + 15} ${cx},${cy + 8} ${cx},${cy + 20} ${cx - 12},${cy + 27}" fill="#F8F5EE"/>

        <!-- Bottom-Right Cube -->
        <polygon points="${cx + 12},${cy + 1} ${cx + 24},${cy + 8} ${cx + 12},${cy + 15} ${cx},${cy + 8}" fill="#F8F5EE"/>
        <polygon points="${cx},${cy + 8} ${cx + 12},${cy + 15} ${cx + 12},${cy + 20} ${cx},${cy + 27}" fill="#F8F5EE"/>
        <polygon points="${cx + 12},${cy + 15} ${cx + 24},${cy + 8} ${cx + 24},${cy + 20} ${cx + 12},${cy + 27}" fill="#F8F5EE"/>
      </g>
    </g>
  `;
}

/**
 * Subtle background isometric system architecture wireframes (left and right).
 */
function renderBackgroundArchitecture(): string {
  return `
    <!-- Left Architecture Wireframe -->
    <g opacity="0.2" stroke="#A35F35" stroke-width="1" fill="none" stroke-linejoin="round">
      <!-- Upper Isometric Server Cube -->
      <polygon points="105,330 132,345 105,360 78,345"/>
      <polygon points="78,345 105,360 105,395 78,380"/>
      <polygon points="105,360 132,345 132,380 105,395"/>

      <!-- Lower Server Rack Node with Drawer Slots -->
      <polygon points="138,470 165,485 138,500 111,485"/>
      <polygon points="111,485 138,500 138,538 111,523"/>
      <polygon points="138,500 165,485 165,523 138,538"/>
      <!-- Rack drawer lines -->
      <line x1="116" y1="498" x2="133" y2="508"/>
      <line x1="116" y1="509" x2="133" y2="519"/>
      <line x1="116" y1="520" x2="133" y2="530"/>

      <!-- Stepped Micro-Box -->
      <polygon points="62,425 80,435 62,445 44,435"/>
      <polygon points="44,435 62,445 62,465 44,455"/>
      <polygon points="62,445 80,435 80,455 62,465"/>

      <!-- Database Cylinder -->
      <ellipse cx="182" cy="430" rx="18" ry="7"/>
      <path d="M 164 430 v 26 a 18 7 0 0 0 36 0 v -26"/>
      <path d="M 164 439 a 18 7 0 0 0 36 0"/>
      <path d="M 164 448 a 18 7 0 0 0 36 0"/>

      <!-- Data flow network routing lines -->
      <path d="M 105 395 L 105 445 L 138 464" stroke-dasharray="3,3"/>
      <path d="M 132 362 L 182 390 L 182 423" stroke-dasharray="3,3"/>
      <path d="M 62 465 L 62 495 L 111 523" stroke-dasharray="3,3"/>
      <path d="M 165 504 L 210 530 L 210 560" stroke-dasharray="3,3"/>
      <circle cx="105" cy="445" r="2.5" fill="#A35F35"/>
      <circle cx="182" cy="390" r="2.5" fill="#A35F35"/>
      <circle cx="210" cy="530" r="2.5" fill="#A35F35"/>
    </g>

    <!-- Right Architecture Wireframe -->
    <g opacity="0.2" stroke="#A35F35" stroke-width="1" fill="none" stroke-linejoin="round">
      <!-- Cloud Storage Node -->
      <path d="M 1060 292 a 13 13 0 0 1 18 -9 a 20 20 0 0 1 36 4 a 15 15 0 0 1 18 15 a 13 13 0 0 1 -11 13 l -56 0 a 11 11 0 0 1 -5 -23 z" stroke-dasharray="3,3"/>

      <!-- Tiered Database Cylinder -->
      <ellipse cx="1115" cy="470" rx="22" ry="8"/>
      <path d="M 1093 470 v 34 a 22 8 0 0 0 44 0 v -34"/>
      <path d="M 1093 481 a 22 8 0 0 0 44 0"/>
      <path d="M 1093 493 a 22 8 0 0 0 44 0"/>

      <!-- Distributed Worker Cube 1 -->
      <polygon points="950,440 972,452 950,464 928,452"/>
      <polygon points="928,452 950,464 950,490 928,478"/>
      <polygon points="950,464 972,452 972,478 950,490"/>

      <!-- Distributed Worker Cube 2 -->
      <polygon points="1025,405 1045,416 1025,427 1005,416"/>
      <polygon points="1005,416 1025,427 1025,450 1005,439"/>
      <polygon points="1025,427 1045,416 1045,439 1025,450"/>

      <!-- Network Bus & Interconnects -->
      <path d="M 1088 315 L 1088 370 L 1025 405" stroke-dasharray="3,3"/>
      <path d="M 1025 450 L 1025 490 L 1093 481" stroke-dasharray="3,3"/>
      <path d="M 972 465 L 1005 484" stroke-dasharray="3,3"/>
      <path d="M 950 490 L 950 540 L 1000 570" stroke-dasharray="3,3"/>
      <circle cx="1088" cy="370" r="2.5" fill="#A35F35"/>
      <circle cx="1025" cy="490" r="2.5" fill="#A35F35"/>
      <circle cx="950" cy="540" r="2.5" fill="#A35F35"/>
    </g>
  `;
}

/**
 * Elegant double-line decorative border with square corner accents.
 */
function renderDecorativeBorders(): string {
  const cornerSquare = (x: number, y: number) => `
    <rect x="${x}" y="${y}" width="14" height="14" fill="#F8F5EE" stroke="#A35F35" stroke-width="0.75"/>
    <polygon points="${x + 7},${y + 4} ${x + 10},${y + 7} ${x + 7},${y + 10} ${x + 4},${y + 7}" fill="#A35F35"/>
  `;

  return `
    <!-- Outer Copper Border -->
    <rect x="22" y="22" width="1156" height="804" fill="none" stroke="#A35F35" stroke-width="1.5"/>
    <!-- Inner Fine Border -->
    <rect x="29" y="29" width="1142" height="790" fill="none" stroke="#A35F35" stroke-width="0.75"/>

    <!-- 4 Corner Square Accents -->
    ${cornerSquare(24, 24)}
    ${cornerSquare(1162, 24)}
    ${cornerSquare(24, 810)}
    ${cornerSquare(1162, 810)}
  `;
}

/**
 * One vector master for the in-app preview and exported image/PDF.
 * Faithfully matches the visual hierarchy, typography, colors, and ornamentation
 * of the ScaleLog Certificate of Achievement design.
 */
export function certificateArtwork(
  certificate: CampaignCertificate,
  siteUrl?: string,
  options?: { isOpenSource?: boolean }
): string {
  const name = certificate.recipientName || "Your name";
  const lines = nameLines(name);
  const nameSize = getRecipientFontSize(lines);
  const site = publicSiteUrl(siteUrl);
  const domain = site ? new URL(site).host : "scalelog-fawn.vercel.app";

  const verificationUrl = getCertificateVerificationUrl(certificate, siteUrl);

  const isOpenSource =
    options?.isOpenSource ??
    Boolean(
      process.env.EXPO_PUBLIC_OPEN_SOURCE === "true" ||
        process.env.EXPO_PUBLIC_IS_OPEN_SOURCE === "true" ||
        true
    );
  const simulatorTagline = isOpenSource
    ? "OPEN-SOURCE INTERACTIVE SYSTEM DESIGN SIMULATOR"
    : "INTERACTIVE SYSTEM DESIGN SIMULATOR";

  const campaignDisplay = certificate.campaignTitle.includes(":")
    ? certificate.campaignTitle
    : `${certificate.campaignTitle}: From Garage to Growth`;

  const issueDateStr = certificateIssuedMonthYear(certificate);

  const text = (
    x: number,
    y: number,
    value: string,
    size: number,
    fill = "#17202B",
    extra = ""
  ) =>
    `<text x="${x}" y="${y}" font-size="${size}" fill="${fill}" ${extra}>${escapeXml(
      value
    )}</text>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="848" viewBox="0 0 1200 848">
    <defs>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400&amp;family=Plus+Jakarta+Sans:wght@400;500;600;700&amp;display=swap');
        .serif-head { font-family: 'Cormorant Garamond', Georgia, serif; }
        .sans-head { font-family: 'Plus Jakarta Sans', system-ui, sans-serif; }
      </style>
    </defs>

    <!-- Warm Ivory Background Canvas -->
    <rect width="1200" height="848" fill="#F8F5EE"/>

    <!-- Subtle Paper Tint Layer -->
    <rect x="22" y="22" width="1156" height="804" fill="#FAF7F0" opacity="0.6"/>

    <!-- Decorative Double-Line Copper Border with Square Corners -->
    ${renderDecorativeBorders()}

    <!-- Subtle Background Architecture Wireframes -->
    ${renderBackgroundArchitecture()}

    <!-- Top Left Corner Text & Divider -->
    <g class="sans-head" font-family="system-ui, -apple-system, sans-serif" font-size="8.5" letter-spacing="2.2" fill="#A35F35" font-weight="500">
      ${text(56, 70, "LEARN", 8.5, "#A35F35")}
      ${text(56, 84, "DESIGN", 8.5, "#A35F35")}
      ${text(56, 98, "DECIDE", 8.5, "#A35F35")}
      ${text(56, 112, "SCALE", 8.5, "#A35F35")}
      <line x1="108" y1="64" x2="108" y2="118" stroke="#A35F35" stroke-width="1"/>
    </g>

    <!-- Top Right Corner Text & Divider -->
    <g class="sans-head" font-family="system-ui, -apple-system, sans-serif" font-size="8.5" letter-spacing="2" fill="#A35F35" font-weight="500">
      <line x1="1092" y1="64" x2="1092" y2="118" stroke="#A35F35" stroke-width="1"/>
      ${text(1104, 70, "SYSTEMS", 8.5, "#A35F35")}
      ${text(1104, 84, "ARCHITECTURE", 8.5, "#A35F35")}
      ${text(1104, 98, "TRADEOFFS", 8.5, "#A35F35")}
      ${text(1104, 112, "IN PRACTICE", 8.5, "#A35F35")}
    </g>

    <!-- Top Center Branding -->
    <g class="sans-head" font-family="system-ui, -apple-system, sans-serif">
      <line x1="330" y1="78" x2="455" y2="78" stroke="#A35F35" stroke-width="0.75"/>
      ${text(600, 84, "SCALELOG", 16, "#17202B", 'text-anchor="middle" font-weight="700" letter-spacing="9"')}
      <line x1="745" y1="78" x2="870" y2="78" stroke="#A35F35" stroke-width="0.75"/>
      ${text(600, 109, simulatorTagline, 8.5, "#8B6D55", 'text-anchor="middle" letter-spacing="3" font-weight="500"')}
      <line x1="575" y1="123" x2="625" y2="123" stroke="#A35F35" stroke-width="0.75"/>
    </g>

    <!-- Main Title: Certificate of Achievement -->
    <g class="serif-head" font-family="Georgia, serif">
      ${text(600, 222, "Certificate of Achievement", 56, "#17202B", 'text-anchor="middle" font-weight="500"')}
    </g>

    <!-- Subtitle: SOFTWARE ARCHITECTURE & SYSTEM DESIGN -->
    <g class="serif-head" font-family="Georgia, serif">
      ${text(600, 266, "SOFTWARE ARCHITECTURE & SYSTEM DESIGN", 14.5, "#A35F35", 'text-anchor="middle" letter-spacing="4" font-weight="600"')}
      <polygon points="600,296 605,301 600,306 595,301" fill="#A35F35"/>
    </g>

    <!-- Recipient Section -->
    <g class="sans-head" font-family="system-ui, -apple-system, sans-serif">
      ${text(600, 350, "AWARDED TO", 10.5, "#7A6A5E", 'text-anchor="middle" letter-spacing="3" font-weight="600"')}
    </g>
    <g class="serif-head" font-family="Georgia, serif">
      ${lines
        .map((line, index) =>
          text(
            600,
            (lines.length === 1 ? 418 : 398 + index * (nameSize + 8)),
            line,
            nameSize,
            "#17202B",
            'text-anchor="middle" font-weight="600"'
          )
        )
        .join("")}
    </g>

    <!-- Description Paragraph -->
    <g class="serif-head" font-family="Georgia, serif" font-size="14.5" fill="#17202B" letter-spacing="0.2">
      ${text(600, 478, `For successfully completing the ScaleLog campaign “${campaignDisplay}”`, 14.5, "#17202B", 'text-anchor="middle"')}
      ${text(600, 502, "and demonstrating practical understanding of architecture trade-offs across", 14.5, "#17202B", 'text-anchor="middle"')}
      ${text(600, 526, "scalability, reliability, performance, and cost.", 14.5, "#17202B", 'text-anchor="middle"')}
    </g>

    <!-- Achievement Indicator with Copper Laurels -->
    <g id="achievement-indicator">
      ${renderLaurelWreaths()}
      ${text(600, 600, `${certificate.levelCount} / ${certificate.levelCount}`, 34, "#A35F35", 'class="serif-head" font-family="Georgia, serif" text-anchor="middle" font-weight="600"')}
      ${text(600, 626, "SCENARIOS COMPLETED", 9.5, "#7A6A5E", 'class="sans-head" font-family="system-ui, -apple-system, sans-serif" text-anchor="middle" letter-spacing="2.5" font-weight="600"')}
    </g>

    <!-- Bottom Left: Circular ScaleLog Architecture Seal -->
    ${renderScaleLogSeal(145, 715)}

    <!-- Bottom Center Metadata Columns -->
    <g class="sans-head" font-family="system-ui, -apple-system, sans-serif">
      <!-- Col 1: Issued -->
      ${text(370, 696, "ISSUED", 9, "#7A6A5E", 'text-anchor="middle" letter-spacing="2" font-weight="600"')}
      ${text(370, 722, issueDateStr, 13.5, "#17202B", 'text-anchor="middle"')}
      <line x1="465" y1="688" x2="465" y2="728" stroke="#D8C8B8" stroke-width="1"/>

      <!-- Col 2: Credential ID -->
      ${text(580, 696, "CREDENTIAL ID", 9, "#7A6A5E", 'text-anchor="middle" letter-spacing="2" font-weight="600"')}
      ${text(580, 722, certificate.id, 13.5, "#17202B", 'text-anchor="middle" letter-spacing="0.5"')}
      <line x1="695" y1="688" x2="695" y2="728" stroke="#D8C8B8" stroke-width="1"/>

      <!-- Col 3: Project -->
      ${text(810, 696, "PROJECT", 9, "#7A6A5E", 'text-anchor="middle" letter-spacing="2" font-weight="600"')}
      ${text(810, 722, domain, 13.5, "#17202B", 'text-anchor="middle"')}

      <!-- Horizontal Divider with Centered Copper Diamond -->
      <line x1="360" y1="780" x2="575" y2="780" stroke="#D8C8B8" stroke-width="0.75"/>
      <polygon points="600,776 604,780 600,784 596,780" fill="#A35F35"/>
      <line x1="625" y1="780" x2="840" y2="780" stroke="#D8C8B8" stroke-width="0.75"/>

      <!-- Footer Callout -->
      ${text(600, 804, "LEARN SYSTEM DESIGN BY MAKING REAL ENGINEERING DECISIONS.", 9, "#7A6A5E", 'text-anchor="middle" letter-spacing="2.5" font-weight="500"')}
    </g>

    <!-- Bottom Right: Real QR Code for Credential Verification (if public siteUrl is configured) -->
    ${
      verificationUrl
        ? `<g id="qr-verification" class="sans-head" font-family="system-ui, -apple-system, sans-serif">
            <line x1="955" y1="680" x2="955" y2="760" stroke="#D8C8B8" stroke-width="1"/>
            <g transform="translate(988, 674)">
              ${renderQrSvg(verificationUrl, 0, 0, 64, "#17202B")}
            </g>
            ${text(1020, 756, "VERIFY", 8, "#7A6A5E", 'text-anchor="middle" letter-spacing="1.5" font-weight="600"')}
            ${text(1020, 767, "CREDENTIAL", 8, "#7A6A5E", 'text-anchor="middle" letter-spacing="1.5" font-weight="600"')}
          </g>`
        : ""
    }
  </svg>`;
}
