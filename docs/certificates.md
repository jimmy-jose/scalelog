# Campaign completion certificates

Completing every Startup CTO scenario without a failed run unlocks a free certificate. Players can find it on the ending screen, campaign map, or Player & company screen. The certificate is retained when the campaign is reset and replayed.

The certificate screen lets players review and edit their name, export a 2400 × 1800 PNG, copy a suggested LinkedIn caption, and open LinkedIn. Players attach the image and publish their own post. Web downloads the image; iOS and Android open the system share sheet to save or share it. No LinkedIn login, paid service, or posting permission is required by ScaleLog.

The ivory, navy, and gold design includes the recipient, campaign, scenario count, issue date, certificate reference, ScaleLog wordmark, and a discreet invitation to play. [Sample certificate](assets/certificate-preview.png) uses fictional player data.

## Marketing URL

Set `EXPO_PUBLIC_SITE_URL=https://your-public-domain.example` when building to use a canonical marketing domain. On web, the current deployed origin is the fallback. Native builds need this setting to include a URL; otherwise they include the ScaleLog name and invitation. Localhost URLs are omitted.

Captions link to the site's root with `utm_source=linkedin&utm_medium=certificate&utm_campaign=startup_cto`. Existing paths, query parameters, fragments, and player details are excluded. Attribution parameters are available to the site's analytics; this feature does not add an analytics service.

## Persistence and scope

Save version 6 adds a top-level `certificates` collection. Version 5 financial and history snapshots are retained without replay. Existing completed saves receive a certificate during migration; their issue date is the issuance date, not a reconstructed completion date. Previously earned certificates keep their original reference and date on replay.

Certificates and campaign progress are stored locally. Clearing app/browser storage removes them. Certificate references are local identifiers, not publicly verifiable credentials. The screen identifies the award as completion of an interactive learning campaign.

## Validation

`npm test` covers issuance, failed and incomplete runs, legacy-save backfill, replay retention, personalization, safe artwork text, referral URLs, web/native export orchestration, and route access. `npm run typecheck`, `npm run lint`, and `npm run build` check the app integration.

The sample artwork is rendered and visually reviewed separately from browser UI. Native file and sharing calls are mocked in automated tests; the system share sheet should also be exercised on a physical device before a native release.
