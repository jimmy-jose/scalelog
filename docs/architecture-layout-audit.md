# Architecture diagram audit

## Cause

The renderer previously grouped all components into three type-based lanes and sorted each lane by authored X coordinates. New campaign components mostly share the same authored position, so this placed a monolith, load balancer, and connection pool beside or above one another irrespective of their edges. Paired request/response lines and labels then overlapped. Later incidents also put job queues before/after workers inconsistently and mixed replication with request traffic.

## Shared fix

- Derive stages from the saved graph's actual directed connections. The reported chain is now **client → load balancer → monolith → connection pool → PostgreSQL**.
- Keep independent branches alongside each other. Use deterministic ordering and neighbor-based sorting to reduce crossings, including after resizing or reopening a saved incident.
- Always flow from top to bottom on mobile and desktop, with parallel branches side by side. Scroll sideways for wide parallel branches, with the entry path initially centered on smaller screens.
- Route orthogonal arrows through free corridors rather than through component cards. Cycle groups and self-links are supported; detached retained components have a separate off-path section.
- Show one directed connection per stored edge. Background work, replication, and recovery links are distinguished from requests. Remove the automatically invented return arrows and crowded inline labels.
- Tap a component to highlight its direct connections and read their original labels. Respect reduced motion and limit animation on large graphs to the selected connections.
- All map consumers use the same renderer: current-state reviews, choice previews, and completion views. No graph mutation, campaign rewrite, migration, or progress reset is needed.

## Audit coverage

`tests/architecture-layout.test.cjs` checks the reported five-component chain, parallel/skip links, cycles, self-links, detached components, empty graphs, immutability, and deterministic placement. It audits the before-state and every choice preview at all 36 incidents on both recommended and compromise routes (216 previews), at 320, 840, and 1600 pixels. It also replays 12 mixed structural histories to cover retained alternative components; economic viability remains covered by the game suite.

Geometry checks require every node and route to remain inside the canvas, no overlapping cards, orthogonal connections, and no connection crossing a card. Mixed-history checks also reject backward stage ordering. Offline renders of early and final milestone layouts were inspected using the same layout and routing functions. These renders validate diagram geometry, not native touch interaction.

Validation commands: `npm run typecheck`, `npm run lint`, `npm test`, `npm run validate:campaign`, and `npm run build`.
