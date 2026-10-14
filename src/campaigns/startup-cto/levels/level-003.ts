import { Level } from "@/domain/types";
import { changesFor } from "./authoring";

export const level003: Level = {
  id: "startup-003", campaignId: "startup-cto", chapter: 1, levelNumber: 3,
  title: "Too Many Connections", kicker: "CHAPTER 01 · SHARE THE PIPE",
  description: "A traffic bump sends the monolith into a connection storm. PostgreSQL is healthy, but the app keeps opening more connections than the database can serve.",
  dialogue: [
    { character: "byte", emotion: "panic", text: "{name}, PostgreSQL is rejecting connections. The database is not out of CPU; it is out of seats." },
    { character: "byte", emotion: "concerned", text: "Every API process is bringing its own crowd. We need a better way to share the room." },
  ],
  metrics: [{ label: "Connections", value: "498 / 500", severity: "critical" }, { label: "DB CPU", value: "42%", severity: "normal" }, { label: "Timeouts", value: "18%", severity: "critical" }],
  incidentFeedback: { sound: "incidentCritical", haptic: "heavy" },
  architectureBefore: {
    nodes: [
      { id: "client", type: "client", label: "Web / Mobile", position: { x: 42, y: 92 }, subtitle: "traffic up" },
      { id: "monolith", type: "monolith", label: "Monolith", position: { x: 176, y: 92 }, subtitle: "6 processes" },
      { id: "postgres", type: "postgres", label: "PostgreSQL", state: "warning", position: { x: 320, y: 92 }, subtitle: "498 conns" },
    ], edges: [{ from: "client", to: "monolith" }, { from: "monolith", to: "postgres" }],
  },
  choices: [
    {
      id: "pool-connections", label: "Add connection pooling", description: "Put a small, shared pool between app processes and PostgreSQL.", cost: 800, tone: "recommended",
      effects: { cash: -800, reliability: 10, customerTrust: 6, complexity: 2, users: 3000, monthlyRevenue: 1500, xp: 140, confidence: 10 },
      feedback: { sound: "choiceSuccess", haptic: "success" },
      tradeoff: {
        upsideLabel: "Fewer rejected requests",
        downsideLabel: "Pool tuning to own",
        upside: "A shared pool reuses a bounded set of database connections, cutting rejections and timeouts.",
        downside: "The pooler is another production component, and a bad pool size can queue requests instead.",
        byteExplanation: "Pooling addresses the exhausted resource directly: six app processes stop opening hundreds of independent database sessions and share a smaller, controlled set. That protects PostgreSQL, but we now need to monitor and tune the pool as traffic changes.",
        effectReasons: {
          upfrontCost: "$800 sets up a lightweight pooler and a safe rollout, rather than expanding the database connection ceiling.",
          reliability: "Requests wait for a reusable connection instead of being rejected when PostgreSQL reaches its 500-session limit.",
          customerTrust: "Fewer rejected sessions mean fewer failed checkouts and fewer customers retrying timed-out requests.",
          complexity: "The new pooler needs configuration and monitoring; that small cost buys a shared connection boundary.",
        },
      },
      architectureChanges: [
        ...changesFor("pooled"),
        { type: "updateNode", nodeId: "postgres", patch: { state: "normal", subtitle: "bounded DB sessions" } },
      ],
      outcomeTitle: "Seats are shared again.", outcomeDialogue: "The pooler keeps a small number of database connections warm and lets requests take turns. Timeouts vanish without touching PostgreSQL's max_connections.", outcomeEmotion: "celebrating", outcomeNote: "Connection pooling protects the database from a stampede of application processes.",
    },
    {
      id: "max-connections", label: "Raise max connections", description: "Push PostgreSQL's connection ceiling from 500 to 2,000.", cost: 1000, tone: "risky",
      effects: { cash: -1000, reliability: -18, customerTrust: -14, complexity: 10, users: -1500, monthlyRevenue: -1000, xp: -60, confidence: -35 },
      feedback: { sound: "choiceWarning", haptic: "warning" },
      tradeoff: {
        upsideLabel: "Short-term admission",
        downsideLabel: "Memory pressure",
        upside: "A higher ceiling can reduce immediate connection rejections during a short-lived burst.",
        downside: "More sessions compete for memory and CPU, so the database can become slower and less stable.",
        byteExplanation: "This moves the limit but does not make app processes share connections. More accepted sessions can all consume memory and contend for work at once, turning a clear rejection into a harder-to-diagnose slowdown. It buys short-term access at the risk of a deeper database outage.",
        effectReasons: {
          upfrontCost: "$1,000 covers the configuration change and capacity checks, but not a fix for connection ownership.",
          reliability: "Allowing far more concurrent sessions increases memory pressure and contention, making timeouts more likely.",
          customerTrust: "Some requests may get through initially, but a saturated database makes customer-facing latency less predictable.",
          complexity: "The team must watch a much larger session count and tune the limit against database memory capacity.",
        },
      },
      architectureChanges: [{ type: "updateNode", nodeId: "postgres", patch: { state: "overloaded", subtitle: "1.4K conns" } }],
      outcomeTitle: "The ceiling moved. The floor did not.", outcomeDialogue: "More connections are accepted, but memory pressure climbs and queries compete harder. The database looks available right up until it does not.", outcomeEmotion: "shocked", outcomeNote: "A higher limit can turn a visible failure into a slower, harder failure.",
    },
    {
      id: "add-database", label: "Add another database", description: "Split writes and reads between two PostgreSQL instances.", cost: 7500, tone: "overkill",
      effects: { cash: -7500, monthlyBurn: 700, reliability: -10, customerTrust: -8, complexity: 24, users: -700, monthlyRevenue: -500, xp: -45, confidence: -25 },
      feedback: { sound: "choiceWarning", haptic: "warning" },
      tradeoff: {
        upsideLabel: "More read capacity",
        downsideLabel: "Lag; storm remains",
        upside: "A read replica can add read capacity if read throughput, not connection count, is the bottleneck.",
        downside: "The connection storm still reaches the primary, while replication lag and $700 monthly spend arrive too.",
        byteExplanation: "A replica creates another place to serve reads, but each app process still opens too many connections to the primary. This can help a different bottleneck; for this incident it leaves the cause in place and adds replication behavior to operate.",
        effectReasons: {
          upfrontCost: "$7,500 pays for provisioning and routing a second database before the current bottleneck is addressed.",
          monthlyBurn: "The extra database and replication monitoring add $700 to recurring spend.",
          reliability: "Separating reads may help later, but it does not reduce the primary's connection count and introduces replication lag.",
          customerTrust: "Some read traffic can move off the primary, but stale replica data may show customers an older order state.",
          complexity: "The team now operates replication, read/write routing, lag alerts, and another database failure mode.",
        },
      },
      architectureChanges: [
        { type: "addNode", node: { id: "read-replica", type: "readReplica", label: "Read replica", state: "newlyAdded", position: { x: 320, y: 34 }, subtitle: "replica" }, feedback: { sound: "architectureNodeAdded", haptic: "medium" } },
        { type: "addEdge", edge: { from: "monolith", to: "read-replica", dashed: true } },
        { type: "addEdge", edge: { from: "postgres", to: "read-replica", label: "async WAL" } },
        { type: "setCapability", capability: "read-replicas", enabled: true },
        { type: "setCapability", capability: "reader-routing", enabled: true },
      ],
      outcomeTitle: "Two databases, one connection storm.", outcomeDialogue: "The replica helps read throughput, but every app process still opens too many connections. You added a second system to solve a pooling problem.", outcomeEmotion: "disappointed", outcomeNote: "Distributed systems multiply the number of things you now have to operate.",
    },
  ],
  variants: [{
    id: "unresolved-query-debt", when: { missingAny: ["indexed"] },
    description: "PostgreSQL is rejecting connections before requests can execute. Earlier dashboard query debt remains; pooling fixes admission pressure but does not remove unindexed scans.",
    metrics: [{ label: "Connections", value: "498 / 500", severity: "critical" }, { label: "Query debt", value: "unindexed dashboard", severity: "warning" }, { label: "Timeouts", value: "18%", severity: "critical" }],
    dialogue: [{ character: "byte", emotion: "concerned", text: "We have two separate problems: connection ownership and the old query plan. Share a bounded pool now, then keep the query repair on the rollout checklist." }],
  }],
  hints: ["CPU is fine. Look at the resource that is actually exhausted.", "Can many app processes reuse fewer database connections?"], xpReward: 140, unlocks: [], lesson: "Protect scarce resources with a shared boundary before raising their limits.",
};
