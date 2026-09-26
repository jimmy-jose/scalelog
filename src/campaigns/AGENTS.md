# Campaign authoring

- Read `docs/adding-levels.md` before adding or changing levels.
- Register new levels in the ordered `defineCampaignLevels` manifest; do not implement progression or simulation rules in content files.
- Keep published level and choice IDs stable. New levels inherit cash, health, CTO stats, architecture, and decision history.
- Include exactly one recommended choice. Risky/overkill choices must reduce XP and confidence and have worse user/revenue growth than the recommended choice; schema validation enforces this.
- Use `cost` for upfront spending; monthly operating costs are charged by the shared engine.
- Run `npm run typecheck` and `npm test` after content changes, and assess whether intended paths remain recoverable.
