import { Level } from "@/domain/types";

const baseArchitecture = {
  nodes: [
    { id: "client", type: "client" as const, label: "Web / Mobile", position: { x: 48, y: 92 }, subtitle: "250 users" },
    { id: "monolith", type: "monolith" as const, label: "Monolith", position: { x: 190, y: 92 }, subtitle: "Laravel/PHP" },
    { id: "postgres", type: "postgres" as const, label: "PostgreSQL", position: { x: 330, y: 92 }, subtitle: "primary" },
  ],
  edges: [{ from: "client", to: "monolith" }, { from: "monolith", to: "postgres" }],
};

export const level001: Level = {
  id: "startup-001", campaignId: "startup-cto", chapter: 1, levelNumber: 1,
  title: "Your First Day", kicker: "CHAPTER 01 · KEEP IT BORING",
  description: "The founder wants to know if Cartline’s Laravel/PHP MVP should be rebuilt before the company grows. You have 250 users, two engineers, and no measured runtime bottleneck yet.",
  dialogue: [
    { character: "byte", emotion: "normal", text: "Welcome aboard, {name}. The whole product fits in one repo and deploys before lunch." },
    { character: "byte", emotion: "thinking", text: "The founder is asking about microservices already. What do you want to optimize for today, {name}?" },
  ],
  metrics: [{ label: "Users", value: "250", severity: "normal" }, { label: "Engineers", value: "2", severity: "normal" }, { label: "Deploy time", value: "4 min", severity: "normal" }],
  architectureBefore: baseArchitecture,
  choices: [
    {
      id: "keep-monolith", label: "Keep the monolith", description: "Invest in a clear modular boundary and ship the next feature.", cost: 0, tone: "recommended",
      effects: { users: 17750, monthlyRevenue: 6000, reliability: 2, customerTrust: 2, complexity: -2, xp: 80, confidence: 8 },
      feedback: { sound: "choiceSuccess", haptic: "success" },
      tradeoff: {
        upsideLabel: "Fast, simple releases",
        downsideLabel: "Shared blast radius",
        upside: "One codebase and one deploy keep a two-engineer team fast; clear modules reduce accidental coupling.",
        downside: "Every module still ships together. A bad release can affect the whole product, and traffic spikes compete for the same app capacity.",
        byteExplanation: "A modular Laravel monolith lets two engineers keep shipping without new network boundaries. But modules are not isolated deployments: one faulty release can take down the whole app, and busy features still contend for shared capacity. We'd need discipline and monitoring as traffic grows.",
        effectReasons: {
          upfrontCost: "No infrastructure purchase keeps cash available; the trade is engineering time spent making the module boundaries real.",
          reliability: "A clearer boundary makes unrelated feature changes less likely to break each other, while preserving one simple deploy path.",
          customerTrust: "A small team can ship fixes quickly from one codebase, which helps keep customer-facing behavior dependable.",
          complexity: "One deployable keeps operations simple. The new boundary is in code, so the team must keep it from eroding.",
        },
      },
      architectureChanges: [{ type: "updateNode", nodeId: "monolith", patch: { label: "Modular monolith", subtitle: "clear boundaries", state: "normal" } }],
      outcomeTitle: "Boring wins.", outcomeDialogue: "You kept the system boring, and the team shipped the next feature before standup. The monolith is not a failure state; it is a useful starting line.", outcomeEmotion: "smug", outcomeNote: "A small team gets speed, simple operations, and one place to reason about behavior.",
    },
    {
      id: "split-services", label: "Split into microservices", description: "Create separate services for users, orders, and billing before the first big launch.", cost: 12000, tone: "overkill",
      effects: { cash: -12000, monthlyBurn: 1800, users: 7750, monthlyRevenue: 2000, reliability: -10, customerTrust: -10, complexity: 26, xp: -40, confidence: -25 },
      feedback: { sound: "choiceWarning", haptic: "warning" },
      tradeoff: {
        upsideLabel: "Independent deploys & scale",
        downsideLabel: "More failure paths",
        upside: "Orders and billing could deploy and scale independently, so a future traffic spike need not scale every part of the app.",
        downside: "Two engineers inherit service boundaries, network failures, extra on-call work, and $1,800 in monthly spend now.",
        byteExplanation: "There is a real upside: orders and billing could have their own deploy cadence and capacity, and a billing-only release would not redeploy the storefront. But with only two engineers, those services add network calls, coordination, and more things that can fail before the current app needs that flexibility.",
        effectReasons: {
          upfrontCost: "$12,000 goes to splitting and deploying services before the current monolith has hit a proven scaling limit.",
          monthlyBurn: "Each service needs runtime capacity, monitoring, and deployment infrastructure, adding $1,800 every month.",
          reliability: "More network calls and independently failing deploys add failure paths the tiny team cannot yet absorb.",
          customerTrust: "A request that crosses services can fail at any boundary; that increases the chance customers see an error.",
          complexity: "Every service adds its own deploy, alerts, configuration, and failure modes to the on-call surface.",
        },
      },
      architectureChanges: [
        { type: "updateNode", nodeId: "monolith", patch: { type: "api", label: "Gateway", subtitle: "routes requests" } },
        { type: "removeEdge", from: "monolith", to: "postgres" },
        { type: "addNode", node: { id: "users-service", type: "service", label: "Users service", position: { x: 210, y: 36 }, subtitle: "independent deploy", state: "newlyAdded" }, feedback: { sound: "architectureNodeAdded", haptic: "medium" } },
        { type: "addNode", node: { id: "orders-service", type: "service", label: "Orders service", position: { x: 220, y: 92 }, subtitle: "independent deploy", state: "newlyAdded" } },
        { type: "addNode", node: { id: "billing-service", type: "service", label: "Billing service", position: { x: 230, y: 148 }, subtitle: "independent deploy", state: "newlyAdded" } },
        { type: "addEdge", edge: { from: "monolith", to: "users-service" } },
        { type: "addEdge", edge: { from: "monolith", to: "orders-service" } },
        { type: "addEdge", edge: { from: "monolith", to: "billing-service" } },
        { type: "addEdge", edge: { from: "users-service", to: "postgres" } },
        { type: "addEdge", edge: { from: "orders-service", to: "postgres" } },
        { type: "addEdge", edge: { from: "billing-service", to: "postgres" } },
      ],
      outcomeTitle: "More boxes, same product.", outcomeDialogue: "The architecture diagram got impressive. The team did not. Every small change now crosses deployment boundaries and needs twice the coordination.", outcomeEmotion: "concerned", outcomeNote: "Technically valid does not mean economically wise. Complexity is a monthly bill too.",
    },
    {
      id: "rewrite-backend", label: "Rewrite the backend in Go", description: "Replace Cartline’s Laravel/PHP API with Go for future concurrent request and I/O work.", cost: 18000, tone: "risky",
      effects: { cash: -18000, monthlyBurn: 1200, users: 2750, monthlyRevenue: 800, reliability: -14, customerTrust: -14, complexity: 20, xp: -50, confidence: -30 },
      feedback: { sound: "choiceWarning", haptic: "warning" },
      tradeoff: {
        upsideLabel: "Concurrency headroom",
        downsideLabel: "Migration & feature freeze",
        upside: "Go’s goroutines can make concurrent network and I/O work easier to structure if that becomes a measured bottleneck.",
        downside: "The $18,000 rewrite freezes feature work, risks migration regressions, and does not fix a slow PostgreSQL query.",
        byteExplanation: "Cartline runs Laravel on PHP today. Go's lightweight goroutines could help a future high-concurrency API or worker workload. But we have 250 users and no evidence that PHP is the bottleneck. A rewrite replaces working behavior and tests, runs two stacks during migration, and cannot make a bad SQL plan fast.",
        effectReasons: {
          upfrontCost: "$18,000 pays to rebuild the Laravel/PHP API in Go, migrate behavior, and retest it before customers benefit.",
          monthlyBurn: "Running the replacement alongside migration work adds $1,200 a month until the old path can be retired.",
          reliability: "A rewrite introduces migration defects and leaves less time to fix production issues during the transition.",
          customerTrust: "Customers feel the feature pause and migration regressions before they benefit from the new language.",
          complexity: "For a while the team must understand two implementations, data paths, and deployment histories.",
        },
      },
      architectureChanges: [{ type: "updateNode", nodeId: "monolith", patch: { type: "service", label: "Go backend", subtitle: "migration in progress", state: "warning" } }],
      outcomeTitle: "A very expensive blank canvas.", outcomeDialogue: "The new stack is elegant. Unfortunately, the roadmap is not. Users noticed the missing features before they noticed the language change.", outcomeEmotion: "disappointed", outcomeNote: "Rewrites can be right later. Today, the opportunity cost is the incident.",
    },
  ],
  hints: ["Ask what is actually breaking before designing for a future you do not have yet.", "Your team size is an architecture constraint, too."], xpReward: 80, unlocks: ["startup-002"], nextLevel: "startup-002", lesson: "Don't solve scalability problems you don't have.",
};
