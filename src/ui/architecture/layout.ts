import type { ArchitectureEdge, ArchitectureGraph, ArchitectureNode } from "@/domain/types";

export type Point = { x: number; y: number };
export type PlacedNode = { node: ArchitectureNode; lane: string; laneIndex: number; x: number; y: number };
export type DiagramLayout = {
  width: number; height: number; nodeWidth: number; nodeHeight: number;
  lanes: { id: string; title: string; color: string; x: number; y: number; width: number; height: number }[];
  nodes: PlacedNode[];
};
export type RoutedEdge = { edge: ArchitectureEdge; points: Point[] };

const compare = (a: string, b: string) => a < b ? -1 : a > b ? 1 : 0;

/** Condense cycles before ranking so feedback links cannot break the layout. */
function components(ids: string[], outgoing: Map<string, string[]>) {
  const seen = new Map<string, number>(), low = new Map<string, number>();
  const stack: string[] = [], active = new Set<string>(), groups: string[][] = [];
  function visit(id: string) {
    seen.set(id, seen.size); low.set(id, seen.get(id)!); stack.push(id); active.add(id);
    for (const next of outgoing.get(id) ?? []) {
      if (!seen.has(next)) { visit(next); low.set(id, Math.min(low.get(id)!, low.get(next)!)); }
      else if (active.has(next)) low.set(id, Math.min(low.get(id)!, seen.get(next)!));
    }
    if (low.get(id) === seen.get(id)) {
      const group: string[] = [];
      let next: string;
      do { next = stack.pop()!; active.delete(next); group.push(next); } while (next !== id);
      groups.push(group.sort(compare));
    }
  }
  ids.forEach(id => { if (!seen.has(id)) visit(id); });
  return groups;
}

function stageTitle(nodes: ArchitectureNode[], detached: boolean) {
  if (detached) return "OFF THE ACTIVE PATH";
  if (nodes.every(n => n.type === "client")) return "CLIENTS";
  if (nodes.every(n => ["cdn", "loadBalancer", "api", "rateLimiter"].includes(n.type))) return "TRAFFIC ROUTING";
  if (nodes.every(n => ["postgres", "mysql", "readReplica", "redis", "objectStorage", "search"].includes(n.type))) return "DATA & STORAGE";
  if (nodes.every(n => ["queue", "kafka", "worker"].includes(n.type))) return "BACKGROUND WORK";
  if (nodes.every(n => ["monolith", "service"].includes(n.type))) return "APPLICATION & SERVICES";
  return "PARALLEL PATHS";
}

/** Every dependency advances a stage; siblings share a stage, never a serial chain. */
export function buildArchitectureLayout(graph: ArchitectureGraph, availableWidth: number): DiagramLayout {
  const ids = graph.nodes.map(n => n.id).sort(compare);
  const nodesById = new Map(graph.nodes.map(n => [n.id, n]));
  const edges = graph.edges.filter(e => nodesById.has(e.from) && nodesById.has(e.to));
  const outgoing = new Map(ids.map(id => [id, edges.filter(e => e.from === id).map(e => e.to).sort(compare)]));
  const groups = components(ids, outgoing);
  const groupOf = new Map(groups.flatMap((group, index) => group.map(id => [id, index] as const)));
  const next = groups.map(() => new Set<number>()), indegree = groups.map(() => 0), rank = groups.map(() => 0);
  for (const edge of edges) {
    const from = groupOf.get(edge.from)!, to = groupOf.get(edge.to)!;
    if (from !== to && !next[from].has(to)) { next[from].add(to); indegree[to] += 1; }
  }
  const queue = groups.map((_, i) => i).filter(i => indegree[i] === 0);
  for (let cursor = 0; cursor < queue.length; cursor += 1) {
    const from = queue[cursor];
    for (const to of next[from]) {
      rank[to] = Math.max(rank[to], rank[from] + 1);
      indegree[to] -= 1;
      if (indegree[to] === 0) queue.push(to);
    }
  }
  const clients = graph.nodes.filter(n => n.type === "client").map(n => n.id);
  const reachable = new Set(clients.length ? clients : ids);
  const pending = [...reachable];
  for (let i = 0; i < pending.length; i += 1) for (const to of outgoing.get(pending[i]) ?? []) {
    if (!reachable.has(to)) { reachable.add(to); pending.push(to); }
  }
  const lastActive = Math.max(0, ...ids.filter(id => reachable.has(id)).map(id => rank[groupOf.get(id)!]));
  const stages: string[][] = [];
  for (const id of ids) {
    const index = reachable.has(id) ? rank[groupOf.get(id)!] : lastActive + 1;
    (stages[index] ??= []).push(id);
  }
  const ordered = stages.filter(stage => stage?.length);
  // Barycentric sweeps put branches near their connected siblings and reduce crossings.
  const rows = new Map<string, number>();
  const updateRows = () => ordered.forEach(stage => stage.forEach((id, index) => rows.set(id, index)));
  updateRows();
  for (let sweep = 0; sweep < 4; sweep += 1) {
    const forward = sweep % 2 === 0;
    for (const stage of forward ? ordered : [...ordered].reverse()) {
      const score = (id: string) => {
        const neighbors = edges.filter(e => forward ? e.to === id : e.from === id).map(e => forward ? e.from : e.to);
        return neighbors.length ? neighbors.reduce((sum, neighbor) => sum + (rows.get(neighbor) ?? 0), 0) / neighbors.length : rows.get(id)!;
      };
      const scores = new Map(stage.map(id => [id, score(id)]));
      stage.sort((a, b) => scores.get(a)! - scores.get(b)! || compare(a, b));
      updateRows();
    }
  }
  const nodeWidth = 200, nodeHeight = 96, margin = 24, gap = 72;
  const maxSiblings = Math.max(1, ...ordered.map(stage => stage.length));
  const width = Math.max(availableWidth, margin * 2 + maxSiblings * (nodeWidth + gap) - gap);
  const height = Math.max(180, margin * 2 + ordered.length * (nodeHeight + 80));
  const nodes: PlacedNode[] = [];
  const lanes = ordered.map((stage, index) => {
    const id = `stage-${index}`;
    const laneWidth = width - margin * 2;
    const x = margin;
    const y = margin + index * (nodeHeight + 80);
    stage.forEach((nodeId, row) => nodes.push({ node: nodesById.get(nodeId)!, lane: id, laneIndex: index,
      x: (width - (stage.length * (nodeWidth + gap) - gap)) / 2 + row * (nodeWidth + gap),
      y: y + 32,
    }));
    return { id, title: stageTitle(stage.map(nodeId => nodesById.get(nodeId)!), stage.every(nodeId => !reachable.has(nodeId))),
      color: index === 0 ? "#71C9ED" : "#92A9C0", x, y, width: laneWidth, height: nodeHeight + 44 };
  });
  return { width, height, nodeWidth, nodeHeight, lanes, nodes };
}

export function isBackgroundEdge(edge: ArchitectureEdge, from: ArchitectureNode, to: ArchitectureNode) {
  return [from.type, to.type].some(type => ["queue", "kafka"].includes(type)) ||
    /WAL|replicat|archive|backup|snapshot|recovery|projection feed|committed.*intent|delivery intent|publish|event|subscription|async/i.test(edge.label ?? "");
}

/** Orthogonal visibility-grid routing; no arrow is allowed to pass through a card. */
export function routeArchitectureEdges(graph: ArchitectureGraph, layout: DiagramLayout): RoutedEdge[] {
  const byId = new Map(layout.nodes.map(node => [node.node.id, node]));
  const clearance = 12;
  const boxes = layout.nodes.map(n => ({ left: n.x - clearance, right: n.x + layout.nodeWidth + clearance, top: n.y - clearance, bottom: n.y + layout.nodeHeight + clearance }));
  const blocked = (a: Point, b: Point) => boxes.some(box => a.x === b.x
    ? a.x > box.left && a.x < box.right && Math.max(a.y, b.y) > box.top && Math.min(a.y, b.y) < box.bottom
    : a.y > box.top && a.y < box.bottom && Math.max(a.x, b.x) > box.left && Math.min(a.x, b.x) < box.right);
  return [...graph.edges].sort((a, b) => compare(`${a.from}:${a.to}`, `${b.from}:${b.to}`)).flatMap(edge => {
    const from = byId.get(edge.from), to = byId.get(edge.to);
    if (!from || !to) return [];
    if (from === to) {
      const x = from.x + layout.nodeWidth, top = from.y + layout.nodeHeight / 3, bottom = from.y + layout.nodeHeight * 2 / 3;
      return [{ edge, points: [{ x, y: top }, { x: x + clearance, y: top }, { x: x + clearance, y: bottom }, { x, y: bottom }] }];
    }
    const forward = to.laneIndex > from.laneIndex;
    const source = { x: from.x + layout.nodeWidth / 2, y: from.y + layout.nodeHeight };
    const target = { x: to.x + layout.nodeWidth / 2, y: to.y + (forward ? 0 : layout.nodeHeight) };
    const start = { x: source.x, y: source.y + clearance };
    const end = { x: target.x, y: target.y + (forward ? -clearance : clearance) };
    const xs = [...new Set([12, layout.width - 12, start.x, end.x, ...boxes.flatMap(box => [box.left, box.right])])].sort((a, b) => a - b);
    const ys = [...new Set([12, layout.height - 12, start.y, end.y, ...boxes.flatMap(box => [box.top, box.bottom])])].sort((a, b) => a - b);
    const key = (x: number, y: number) => y * xs.length + x;
    const point = (id: number) => ({ x: xs[id % xs.length], y: ys[Math.floor(id / xs.length)] });
    const first = key(xs.indexOf(start.x), ys.indexOf(start.y)), last = key(xs.indexOf(end.x), ys.indexOf(end.y));
    const distances = new Map([[first, 0]]), previous = new Map<number, number>();
    const open = new Set([first]);
    while (open.size) {
      let current = -1, best = Infinity;
      for (const candidate of open) {
        const p = point(candidate);
        const score = distances.get(candidate)! + Math.abs(p.x - end.x) + Math.abs(p.y - end.y);
        if (score < best) { best = score; current = candidate; }
      }
      if (current === last) break;
      open.delete(current);
      const x = current % xs.length, y = Math.floor(current / xs.length), p = point(current);
      for (const [nx, ny] of [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]]) {
        if (nx < 0 || ny < 0 || nx >= xs.length || ny >= ys.length) continue;
        const id = key(nx, ny), q = point(id);
        if (blocked(p, q)) continue;
        const cost = distances.get(current)! + Math.abs(p.x - q.x) + Math.abs(p.y - q.y);
        if (cost < (distances.get(id) ?? Infinity)) { distances.set(id, cost); previous.set(id, current); open.add(id); }
      }
    }
    // Clear corridors around every card make every valid connection routable.
    if (!distances.has(last)) throw new Error(`Cannot route architecture edge ${edge.from} → ${edge.to}`);
    const path: Point[] = [end];
    let current = last;
    while (current !== first) { current = previous.get(current)!; path.unshift(point(current)); }
    const points = [source, ...path, target].filter((p, i, all) => {
      if (i === 0 || i === all.length - 1) return true;
      const before = all[i - 1], after = all[i + 1];
      return !((before.x === p.x && p.x === after.x) || (before.y === p.y && p.y === after.y));
    });
    return [{ edge, points }];
  });
}
