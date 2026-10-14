# Contributing to ScaleLog

Contributions are welcome: bug fixes, accessibility improvements, tests, documentation, and technically accurate campaign scenarios all help. Please follow our [code of conduct](CODE_OF_CONDUCT.md).

## Before you start

Search [existing issues](https://github.com/jimmy-jose/scalelog/issues) and pull requests before opening a new one. For a substantial feature or change to game economics, open an issue explaining the proposal first so we can agree on its scope. Small fixes can go straight to a pull request.

For usage questions, see [support](SUPPORT.md). Report vulnerabilities privately using [SECURITY.md](SECURITY.md).

## Local setup

Use Node.js 22 and npm. If you use nvm, `nvm install` and `nvm use` read the repository's `.nvmrc`.

```bash
git clone https://github.com/<your-github-username>/scalelog.git
cd scalelog
npm ci
npm run web
```

Fork the repository on GitHub before cloning your fork. Create a branch for your change, for example `git switch -c fix/describe-the-problem`.

The game runs locally without credentials. Optional certificate registry configuration is documented in [.env.example](.env.example) and [the README](README.md). Never commit real tokens, personal player data, or local environment files.

## Making changes

- Follow the existing TypeScript and React Native conventions. Keep changes focused and avoid unrelated formatting or dependency updates.
- Put shared simulation, progression, and persistence logic in `src/domain/` and `src/store/`; keep route files in `app/` focused on composing screens.
- When changing behavior, add or update meaningful regression tests in `tests/`. Documentation-only changes do not need new tests.
- Keep existing level and choice IDs stable. Changes to saved decisions or economics need an explicit migration policy.
- For campaign content, read [Adding campaign levels](docs/adding-levels.md) and [the campaign authoring guidance](src/campaigns/AGENTS.md). Update technical references when changing a scenario's workload or architecture contract.
- For new media, record its creator, source, redistribution license, and required attribution in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md). Use assets you have permission to redistribute.

## Validation

Run the checks used by CI before submitting code or campaign changes:

```bash
npm run typecheck
npm run lint
npm test
npm run validate:campaign
npm run build
```

For UI or audio changes, also test the affected interactions on the relevant platform. If you cannot run a check, say so in your pull request and explain why. Documentation-only changes should at least have working links and correct commands.

## Pull requests

Target `main`. Explain the problem, the resulting behavior, and how you checked it. Link related issues; include screenshots for visual changes when useful. Keep `package-lock.json` in sync when changing dependencies. Maintainers may request revisions before merging.

By submitting a contribution, you agree that your original contribution is provided under the repository's [MIT license](LICENSE). Third-party material retains its own license and must include the required notices. No contributor license agreement is required.
