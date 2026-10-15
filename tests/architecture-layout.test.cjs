const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const originalLoad = Module._load;
Module._load = function (id, parent, main) {
  return originalLoad.call(this, id.startsWith('@/') ? path.resolve(__dirname, '../src', id.slice(2)) : id, parent, main);
};
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
}).outputText, filename);
const { buildArchitectureLayout, routeArchitectureEdges, isBackgroundEdge } = require('../src/ui/architecture/layout');
const { allLevels } = require('../src/campaigns');
const { applyArchitectureChanges } = require('../src/domain/architecture');
const { resolveLevel } = require('../src/domain/levelVariants');

function verify(graph, width) {
  const before = JSON.stringify(graph);
  const layout = buildArchitectureLayout(graph, width);
  for (let index = 1; index < layout.lanes.length; index += 1) {
    assert.ok(layout.lanes[index].y > layout.lanes[index - 1].y, 'Every stage must flow vertically, including on wide screens');
  }
  assert.equal(layout.nodes.length, graph.nodes.length);
  for (const node of layout.nodes) {
    assert.ok(node.x >= 0 && node.y >= 0);
    assert.ok(node.x + layout.nodeWidth <= layout.width);
    assert.ok(node.y + layout.nodeHeight <= layout.height);
    const lane = layout.lanes[node.laneIndex];
    assert.ok(lane, `Node ${node.node.id} missing lane`);
    assert.ok(node.y >= lane.y + 40, `Node ${node.node.id} overlaps stage header: node.y=${node.y}, lane.y=${lane.y}`);
    assert.ok(node.y + layout.nodeHeight <= lane.y + lane.height, `Node ${node.node.id} extends outside lane`);
    for (const other of layout.nodes) if (node !== other) {
      assert.ok(node.x + layout.nodeWidth <= other.x || other.x + layout.nodeWidth <= node.x ||
        node.y + layout.nodeHeight <= other.y || other.y + layout.nodeHeight <= node.y, `Overlapping cards: ${node.node.id}, ${other.node.id}`);
    }
  }
  const routes = routeArchitectureEdges(graph, layout);
  assert.equal(routes.length, graph.edges.length);
  for (const route of routes) {
    assert.ok(route.points.length >= 2);
    route.points.forEach(p => assert.ok(Number.isFinite(p.x) && Number.isFinite(p.y) && p.x >= 0 && p.x <= layout.width && p.y >= 0 && p.y <= layout.height));
    for (let i = 1; i < route.points.length; i += 1) {
      const a = route.points[i - 1], b = route.points[i];
      assert.ok(a.x === b.x || a.y === b.y, 'Connections must be orthogonal');
      for (const node of layout.nodes) {
        const intersects = a.x === b.x
          ? a.x > node.x && a.x < node.x + layout.nodeWidth && Math.max(a.y, b.y) > node.y && Math.min(a.y, b.y) < node.y + layout.nodeHeight
          : a.y > node.y && a.y < node.y + layout.nodeHeight && Math.max(a.x, b.x) > node.x && Math.min(a.x, b.x) < node.x + layout.nodeWidth;
        assert.equal(intersects, false, `${route.edge.from} → ${route.edge.to} crosses ${node.node.id}`);
      }
    }
  }
  assert.equal(JSON.stringify(graph), before, 'Layout must not mutate campaign topology or saved positions');
  return layout;
}

const node = (id, type = 'service') => ({ id, type, label: id, position: { x: 190, y: 92 } });
const chain = {
  nodes: [node('monolith', 'monolith'), node('postgres', 'postgres'), node('client', 'client'), node('load-balancer', 'loadBalancer'), node('pooler')],
  edges: [{ from: 'client', to: 'load-balancer' }, { from: 'load-balancer', to: 'monolith' }, { from: 'monolith', to: 'pooler' }, { from: 'pooler', to: 'postgres' }],
};

test('the reported load-balancer topology flows top to bottom on desktop and mobile', () => {
  for (const width of [320, 840, 1600]) {
    const layout = verify(chain, width);
    const byId = Object.fromEntries(layout.nodes.map(n => [n.node.id, n]));
    for (const edge of chain.edges) {
      assert.ok(byId[edge.from].laneIndex < byId[edge.to].laneIndex);
      assert.ok(byId[edge.from].y < byId[edge.to].y);
    }
    assert.equal(new Set(layout.nodes.map(node => node.x)).size, 1, "Serial components share one vertical column");
  }
});

test('parallel branches, skip links, cycles and retained components remain readable', () => {
  const graph = {
    nodes: [...chain.nodes, node('cache', 'redis'), node('retired', 'redis')],
    edges: [...chain.edges, { from: 'monolith', to: 'cache' }, { from: 'client', to: 'postgres', label: 'legacy path' }],
  };
  const layout = verify(graph, 840);
  const byId = Object.fromEntries(layout.nodes.map(n => [n.node.id, n]));
  assert.equal(byId.cache.laneIndex, byId.pooler.laneIndex);
  assert.ok(byId.retired.laneIndex > byId.postgres.laneIndex);
  assert.match(layout.lanes.at(-1).title, /OFF THE ACTIVE PATH/);
  const cycle = { ...graph, edges: [...graph.edges, { from: 'pooler', to: 'monolith' }] };
  verify(cycle, 320);
  verify(cycle, 2000);
  assert.deepEqual(buildArchitectureLayout({ nodes: [...graph.nodes].reverse(), edges: [...graph.edges].reverse() }, 840), layout, 'Input insertion order must not reorder the production graph');
  verify({ nodes: [], edges: [] }, 320);
  verify({ nodes: [node("self")], edges: [{ from: "self", to: "self" }] }, 320);
});

test('replication, archives and asynchronous delivery are not drawn as request/response pairs', () => {
  for (const label of ['WAL replication', 'synchronous WAL', 'archive WAL + base backups', 'versioned projection feed', 'committed delivery intents']) {
    assert.equal(isBackgroundEdge({ from: 'a', to: 'b', label }, node('a', 'postgres'), node('b', 'readReplica')), true, label);
  }
  assert.equal(isBackgroundEdge(chain.edges[0], chain.nodes[2], chain.nodes[3]), false);
});

test('audit every level and choice preview on recommended and compromise routes', () => {
  let audited = 0;
  for (const tone of ['recommended', 'neutral']) {
    let graph = allLevels[0].architectureBefore;
    for (const source of allLevels) {
      const level = resolveLevel(source, graph);
      for (const width of [320, 840, 1600]) verify(graph, width);
      for (const choice of level.choices) {
        const preview = applyArchitectureChanges(graph, choice.architectureChanges);
        for (const width of [320, 840, 1600]) verify(preview, width);
        audited += 1;
      }
      const choice = level.choices.find(c => c.tone === (source.levelNumber <= 3 ? 'recommended' : tone));
      graph = applyArchitectureChanges(graph, choice.architectureChanges);
    }
  }
  assert.equal(audited, 216);
});


test('mixed and legacy topology histories preserve ordering and obstacle-free connections', () => {
  for (let seed = 0; seed < 12; seed += 1) {
    let graph = allLevels[0].architectureBefore;
    for (const source of allLevels) {
      const level = resolveLevel(source, graph);
      const choice = level.choices[(seed + source.levelNumber * (seed % 3 + 1)) % level.choices.length];
      graph = applyArchitectureChanges(graph, choice.architectureChanges);
      const layout = verify(graph, seed % 2 ? 320 : 1600);
      const nodes = Object.fromEntries(layout.nodes.map(n => [n.node.id, n]));
      for (const edge of graph.edges) assert.ok(nodes[edge.from].laneIndex <= nodes[edge.to].laneIndex, `${source.id}: backwards ${edge.from} → ${edge.to}`);
    }
  }
});
