# Security policy

## Supported versions

Security fixes are made against the current `main` branch. Older snapshots and forks do not have a separate support commitment.

## Reporting a vulnerability

Email **Jimmy Jose** at [jimmy.jose96@gmail.com](mailto:jimmy.jose96@gmail.com) with the subject `ScaleLog security report`. Please report privately rather than opening a public issue or pull request with exploit details.

Include:

- The affected commit or deployment and component.
- Steps to reproduce or a minimal proof of concept.
- The expected behavior, actual behavior, and likely impact.
- Any proposed remediation, if you have one.

Use synthetic data. Do not include real player names, email addresses, certificate records, access tokens, or other private information in the report. Do not access or modify other people's records to demonstrate a problem.

The maintainer will investigate, discuss follow-up questions with you, and coordinate a fix and disclosure where appropriate. This is a volunteer-maintained project; no fixed response time or paid bug bounty is promised.

## Relevant components

Reports involving certificate issuance and verification (`api/`, `src/domain/certificateStore.ts`, and `src/lib/certificateRegistry.ts`), exposed server credentials, or unsafe handling of user-supplied names and email addresses are especially useful. Ordinary gameplay bugs and balance feedback belong in [GitHub issues](https://github.com/jimmy-jose/scalelog/issues).

`BLOB_READ_WRITE_TOKEN` is a server-only secret. Never prefix it with `EXPO_PUBLIC_`, include it in client code, or commit it to the repository. Variables beginning with `EXPO_PUBLIC_` are visible to app users.
