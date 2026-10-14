# Public release checklist

The community files prepare ScaleLog for contributions. Repository visibility and hosting settings are managed separately on GitHub.

Before the first public release:

- [ ] Resolve the outstanding asset provenance in [THIRD_PARTY_NOTICES.md](../THIRD_PARTY_NOTICES.md), especially music and retained MP3 effects. Record redistribution terms or replace/remove assets that cannot be redistributed.
- [ ] Check the current tree and Git history for credentials and private player data. `.gitignore` prevents new accidental additions but does not remove files from old commits. Revoke any exposed credentials before publication.
- [ ] Confirm that the private reporting email in [SECURITY.md](../SECURITY.md) and [CODE_OF_CONDUCT.md](../CODE_OF_CONDUCT.md) is monitored.
- [ ] Run the checks listed in [CONTRIBUTING.md](../CONTRIBUTING.md).
- [ ] Push the community files and CI workflow, then confirm that GitHub Actions passes.
- [ ] Make the repository public when ready. Enable Issues and private vulnerability reporting, and optionally Discussions for community questions.
- [ ] Enable reported-content moderation so community members can report conduct concerns to repository admins.
- [ ] Protect `main` with pull request review and the CI check if appropriate for the maintainer's workflow.

The npm package remains marked `private: true` because ScaleLog is an application. That setting prevents accidental publication to npm; it does not control GitHub visibility or source-code licensing.
