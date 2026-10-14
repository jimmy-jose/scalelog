# Gameplay reading audit

The shared gameplay screens cover all 36 incidents, their 108 choices, and state-dependent incident variants. The reading burden came primarily from mandatory screens and repeated explanations, so this change is in the presentation layer rather than individual campaign scripts.

| Area | Friction found | Default experience | Available on request |
| --- | --- | --- | --- |
| Company header | Seven metrics plus campaign progress preceded every step | Company health, cash, runway, users | Health meters, finances, rules, history |
| Incident briefing | Description plus sequential dialogue had to be read before proceeding | Full problem description and direct decision button | All personalized Byte dialogue |
| System review | Metrics and architecture formed a mandatory intermediate step | Warning/critical signals remain visible; two steps: problem and decision | Full metrics and interactive architecture; problem can be reviewed from the decision |
| Choice cards | Description, two trade-off paragraphs, effects, reward math, forecast, and advice competed with the action | Option, upfront cost, gain, trade-off, monthly cost change, cash forecast | Implementation details, full trade-offs, effect explanations, XP/confidence, Byte's advice |
| Results | Three mandatory pages separated result, ledger, and takeaway | Result, takeaway, failure reason when applicable, Continue | Dialogue, before/after ledger, operating-month math, retrospective |
| Completion | Dashboard and repeated next-incident description delayed continuation | Reward/progress, next incident title, next action; reset remains visible after failure | Company details/history and final architecture analysis |

## Interaction rules

- Optional sections begin collapsed and reset for each level, choice, or outcome.
- Disclosure buttons have explicit labels, expanded accessibility state, and a minimum 44-point height. Closed content is unmounted so it is absent from keyboard and screen-reader navigation.
- Choice order and selection remain stable when reviewing the problem. The existing preview and explicit commit step remain in place.
- Costs, cash exhaustion warnings, affordability/requirement blocks, and run failure reasons stay visible. Prerequisite repair costs remain included in totals; their full explanations remain available in the choice details.
- No campaign content, scoring, persistence, or simulation rules are changed.

## Validation

Use `npm run typecheck`, `npm run lint`, `npm test`, `npm run validate:campaign`, and `npm run build`. Prefer source and command-line verification for this presentation change, as requested by the repository guidance. Native touch behavior and visual layout are not covered by those checks.
