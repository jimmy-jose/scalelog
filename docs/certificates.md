# Campaign completion certificates

Completing every Startup CTO scenario without a failed run unlocks a free certificate. Players can find it on the ending screen, campaign map, or Player & company screen. The certificate is retained when the campaign is reset and replayed.

The redesigned certificate screen lets players review and edit their name, export high-resolution PNG (2400 × 1696, 2× scale) and landscape A4 PDF documents, share directly to LinkedIn, and copy their cryptographic credential verification URL. Players can attach the exported asset or share the verification link with Open Graph preview cards.

The visual design is an elegant, premium software architecture credential rendered in landscape A4 aspect ratio (1.414:1) with a warm ivory background (`#F8F5EE`), deep charcoal typography (`#17202B`), copper accents (`#A35F35`), double-line decorative border with square corner accents, subtle architectural wireframe illustrations, circular ScaleLog seal with 3D isometric cubes, and copper laurels around the completed scenario count.

## Export and sharing

1. **Download Certificate (PNG):** High-resolution rasterization (2400 × 1696 at 2× scale) preserving vector precision and typography.
2. **Download Certificate (PDF):** Pure vector-compliant PDF 1.4 document sized for standard A4 landscape printing (`841.89 × 595.28` pt).
3. **Share on LinkedIn:** Opens LinkedIn sharing intent linking to the recipient's public credential verification URL.
4. **Copy Credential URL:** Copies the cryptographically signed verification URL to the clipboard.
5. **Copy LinkedIn Caption:** Copies suggested caption with attribution to ScaleLog.

## Credential Verification, Email Linking & Verifiable QR Code

Before minting their certificate, players can update their recipient name and link their email address. Linking an email binds ownership of the credential in the official ScaleLog registry:

1. **Minting & Vercel Blob Registry:** When the player mints their certificate, the app registers it with the Vercel Serverless API (`POST /api/certificates`), which securely records the credential in **Vercel Blob** storage (`certificates/${id}.json`) on the Vercel Hobby tier ($0/month, zero external dependencies).
2. **Unique ID & Clean QR Code:** The certificate artwork renders a crisp, high-reliability vector QR code at the bottom right encoding a clean, short URL:  
   `https://<domain>/verify?id=<unique-id>` (e.g. `SL-SCTO-20261014-ABC12345`).
3. **Registry Verification Route (`/verify`):** When scanned or visited, `/verify` queries `/api/verify?id=<unique-id>`, retrieving the authoritative record from Vercel Blob. It renders a verified badge (`✓ VERIFIED SCALELOG CREDENTIAL`), recipient details, completion statistics, masked email (`j***@example.com`), and vector certificate preview. Visitors can also manually look up any credential ID.
4. **Offline & Dev Fallback:** If `BLOB_READ_WRITE_TOKEN` is unconfigured (such as local testing or offline use), the system gracefully allows local issuance and falls back to client-side cryptographic signatures.

## Validation

`npm test` covers issuance, failed and incomplete runs, legacy-save backfill, replay retention, personalization, email normalization/masking/validation, mint payload validation, safe artwork text, referral URLs, web/native PNG and PDF export orchestration, cryptographic signatures, QR code generation, route access, and visual geometry. `npm run typecheck`, `npm run lint`, and `npm run build` check the app integration.

## Campaign scores

New completions receive a score out of 10, displayed to one decimal place on the ending screen, certificate screen, certificate artwork (including PNG/PDF exports), LinkedIn caption, and public verification page.

Every scenario has equal weight. Its decision score is `10 × max(0, choice XP) / highest response XP`, using the existing XP rules and the actual resolved incident variant. Risky and overkill responses receive zero; neutral responses can receive partial credit. The denominator includes all responses for that incident, even those the player's finances cannot currently fund. Average the decision scores across every campaign scenario and round once to one decimal place. This measures decision quality under the game's reward model, rather than company size, completion percentage, or professional proficiency.

Decision scores are saved with outcome snapshots so later content changes cannot alter a recorded score. Older outcome snapshots can be scored from their recorded choices and resolved historical incidents using current reward rules. Incomplete, failed, missing, or duplicate history does not produce a final score.

The certificate snapshots the first scored completion and retains it through resets and replays. The ending screen always shows the current run's score; the certificate retains its own original score. Existing unscored certificates remain unchanged on load, since the current save may belong to another run. A successful new completion replaces an unscored certificate with a new scored credential ID. Older unscored credentials remain valid. Scores are included in registry requests, public responses, and legacy URL signatures; the registry validates numeric scores from 0 to 10 with at most one decimal place. As with completion data, this is a client-reported game result, not server-validated gameplay.
