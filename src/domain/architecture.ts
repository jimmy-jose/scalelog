import type { ArchitectureChange, ArchitectureGraph } from "@/domain/types";

export function applyArchitectureChanges(graph: ArchitectureGraph, changes: ArchitectureChange[] = []): ArchitectureGraph {
  const nodes = graph.nodes.map((node) => ({ ...node, position: { ...node.position } }));
  const edges = graph.edges.map((edge) => ({ ...edge }));
  for (const change of changes) {
    if (change.type === "addNode" && !nodes.some((node) => node.id === change.node.id)) nodes.push({ ...change.node, position: { ...change.node.position } });
    if (change.type === "updateNode") {
      const index = nodes.findIndex((node) => node.id === change.nodeId);
      if (index >= 0) nodes[index] = { ...nodes[index], ...change.patch };
    }
    if (change.type === "addEdge" && !edges.some((edge) => edge.from === change.edge.from && edge.to === change.edge.to)) edges.push({ ...change.edge });
    if (change.type === "removeEdge") {
      const index = edges.findIndex((edge) => edge.from === change.from && edge.to === change.to);
      if (index >= 0) edges.splice(index, 1);
    }
  }
  return { nodes, edges };
}
