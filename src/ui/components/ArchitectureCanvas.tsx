import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { PanResponder, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, { Easing, FadeInDown, cancelAnimation, useAnimatedProps, useSharedValue, withDelay, withRepeat, withTiming } from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Circle, Defs, Ellipse, G, LinearGradient as SvgGradient, Marker, Path, Pattern, Rect, Stop, Text as SvgText } from "react-native-svg";
import type { ArchitectureGraph, ArchitectureNode, ArchitectureNodeType } from "@/domain/types";
import { colors, radii, spacing } from "@/ui/theme";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const WIDE_CANVAS_WIDTH = 720;
const NODE_HEIGHT = 88;
const WIDE_NODE_WIDTH = 184;
const MOBILE_NODE_HEIGHT = 88;
const EMPTY_HIGHLIGHTS: string[] = [];

type LaneId = "frontend" | "backend" | "data";
type Point = { x: number; y: number };
type Lane = { id: LaneId; title: string; note: string; color: string; x: number; y: number; width: number; height: number };
type PlacedNode = { node: ArchitectureNode; lane: LaneId; laneIndex: number; x: number; y: number };
type DiagramLayout = { width: number; height: number; nodeWidth: number; nodeHeight: number; lanes: Lane[]; nodes: PlacedNode[]; initialPositions: Record<string, Point> };

const laneColors: Record<LaneId, string> = { frontend: "#71C9ED", backend: "#B29DFF", data: "#F0BA7B" };
const nodeColors: Record<ArchitectureNodeType, string> = {
  client: colors.blue, api: "#71B8FF", monolith: colors.purple, loadBalancer: colors.blue,
  postgres: colors.orange, mysql: colors.orange, redis: colors.pink, queue: colors.yellow,
  worker: colors.mint, objectStorage: colors.blue, search: colors.purple, cdn: colors.blue,
  kafka: colors.orange, service: colors.mint, readReplica: colors.yellow, region: colors.purple,
  rateLimiter: colors.pink,
};

const laneCopy: Record<LaneId, { title: string; note: string }> = {
  frontend: { title: "CLIENT LAYER", note: "Entry points" },
  backend: { title: "COMPUTE LAYER", note: "Application services" },
  data: { title: "DATA LAYER", note: "Storage & infrastructure" },
};

function laneFor(type: ArchitectureNodeType): LaneId {
  if (type === "client" || type === "cdn") return "frontend";
  if (["postgres", "mysql", "redis", "queue", "kafka", "objectStorage", "search", "readReplica", "region"].includes(type)) return "data";
  return "backend";
}

function nodeExplanation(node: ArchitectureNode) {
  if (node.type === "api" && node.label === "Gateway") return "Routes each incoming HTTP request to the right service, then sends that service's response back to the client.";
  const descriptions: Partial<Record<ArchitectureNodeType, string>> = {
    client: "The web and mobile apps used by customers. They send requests to the backend and display the returned result.",
    api: "The HTTP entry point. It receives client requests, runs application logic, and sends responses back.",
    monolith: "The backend runs in one deployable application. It handles business logic, asks the database for data, and replies to clients.",
    loadBalancer: "Routes incoming requests across backend instances and returns each response to its caller.",
    postgres: "The primary relational database. It executes SQL queries and returns result rows to the backend.",
    mysql: "A relational database. It executes SQL queries and returns result rows to the backend.",
    redis: "An in-memory cache. It answers lookups quickly when a value is present.",
    queue: "Holds jobs for asynchronous processing. A worker picks them up later; this is not an immediate response path.",
    worker: "Processes background jobs outside the customer-facing request path.",
    objectStorage: "Stores files and objects, then returns them when requested.",
    search: "Indexes data for search and returns matching results.",
    cdn: "Serves cached content near customers, reducing requests to the origin.",
    kafka: "Carries event streams to consumers asynchronously rather than replying to a request directly.",
    service: "An independently deployed backend component with its own logic and network boundary.",
    readReplica: "A copy of the database used for reads. It can reduce load on the primary but may lag behind writes.",
    region: "A deployment location closer to a group of users.",
    rateLimiter: "Controls how many requests a client may send in a time window.",
  };
  return descriptions[node.type] ?? "A component in this system's request path.";
}

function buildLayout(graph: ArchitectureGraph, wide: boolean, mobileWidth: number): DiagramLayout {
  const width = mobileWidth;
  const nodeWidth = wide ? WIDE_NODE_WIDTH : Math.min(238, width - 100);
  const nodeHeight = wide ? NODE_HEIGHT : MOBILE_NODE_HEIGHT;
  const laneIds: LaneId[] = ["frontend", "backend", "data"];
  const grouped = Object.fromEntries(laneIds.map((lane) => [lane, graph.nodes.filter((node) => laneFor(node.type) === lane).sort((a, b) => a.position.x - b.position.x)])) as Record<LaneId, ArchitectureNode[]>;
  const laneCount = Math.max(1, ...laneIds.map((id) => grouped[id].length));
  const lanes: Lane[] = [];
  const nodes: PlacedNode[] = [];
  const initialPositions: Record<string, Point> = {};

  if (wide) {
    const columns = [
      { id: "frontend" as const, x: 16, width: (width - 64) / 3 },
      { id: "backend" as const, x: 32 + (width - 64) / 3, width: (width - 64) / 3 },
      { id: "data" as const, x: 48 + (width - 64) * 2 / 3, width: (width - 64) / 3 },
    ];
    const height = Math.max(250, 92 + laneCount * 128 + 30);
    columns.forEach((column, laneIndex) => {
      const copy = laneCopy[column.id];
      lanes.push({ ...column, ...copy, y: 16, height: height - 32, color: laneColors[column.id] });
      grouped[column.id].forEach((node, index) => {
        const x = column.x + (column.width - nodeWidth) / 2;
        const y = 88 + index * 128 + (column.id === "data" ? (laneCount - grouped[column.id].length) * 64 : 0);
        nodes.push({ node, lane: column.id, laneIndex, x, y });
        initialPositions[node.id] = { x, y };
      });
    });
    return { width, height, nodeWidth, nodeHeight, lanes, nodes, initialPositions };
  }

  let y = 14;
  laneIds.forEach((id, laneIndex) => {
    const copy = laneCopy[id];
    const count = grouped[id].length;
    const height = Math.max(72, 48 + count * 114);
    lanes.push({ id, ...copy, x: 10, y, width: width - 20, height, color: laneColors[id] });
    grouped[id].forEach((node, index) => {
      const x = (width - nodeWidth) / 2;
      const nodeY = y + 48 + index * 114;
      nodes.push({ node, lane: id, laneIndex, x, y: nodeY });
      initialPositions[node.id] = { x, y: nodeY };
    });
    y += height + 20;
  });
  return { width, height: y + 2, nodeWidth, nodeHeight, lanes, nodes, initialPositions };
}

function nodeStatus(node: ArchitectureNode) {
  return { normal: "Operational", overloaded: "Overloaded", failed: "Offline", warning: "Degraded", newlyAdded: "New component" }[node.state ?? "normal"];
}

function healthColor(node: ArchitectureNode) {
  return !node.state || node.state === "normal" ? colors.mint : statusColor(node);
}

function statusColor(node: ArchitectureNode) {
  if (node.state === "failed" || node.state === "overloaded") return colors.red;
  if (node.state === "warning") return colors.yellow;
  if (node.state === "newlyAdded") return colors.mint;
  return nodeColors[node.type];
}

function edgeLabel(from: ArchitectureNode, to: ArchitectureNode, label?: string) {
  if (label) return label;
  if (from.type === "client") return "HTTPS";
  if (["postgres", "mysql", "readReplica"].includes(to.type)) return "SQL query";
  if (to.type === "redis") return "cache lookup";
  if (["queue", "kafka"].includes(to.type)) return "event";
  return "request";
}

function responseLabel(to: ArchitectureNode) {
  if (["postgres", "mysql", "readReplica"].includes(to.type)) return "result rows";
  if (to.type === "redis") return "cache value";
  if (to.type === "search") return "results";
  if (to.type === "objectStorage") return "object";
  return "response";
}

function isOneWayEdge(from: ArchitectureNode, to: ArchitectureNode, label: string | undefined) {
  return ["queue", "kafka"].includes(from.type) || ["queue", "kafka"].includes(to.type) || /event|publish|stream|async/i.test(label ?? "");
}

function connection(from: PlacedNode, to: PlacedNode, wide: boolean, nodeWidth: number, nodeHeight: number) {
  const fromCenter = { x: from.x + nodeWidth / 2, y: from.y + nodeHeight / 2 };
  const toCenter = { x: to.x + nodeWidth / 2, y: to.y + nodeHeight / 2 };
  if (wide && from.laneIndex !== to.laneIndex) {
    const direction = toCenter.x >= fromCenter.x ? 1 : -1;
    return { x1: fromCenter.x + direction * (nodeWidth / 2), y1: fromCenter.y, x2: toCenter.x - direction * (nodeWidth / 2), y2: toCenter.y };
  }
  if (!wide && from.laneIndex !== to.laneIndex) {
    const direction = toCenter.y >= fromCenter.y ? 1 : -1;
    return { x1: fromCenter.x, y1: fromCenter.y + direction * (nodeHeight / 2), x2: toCenter.x, y2: toCenter.y - direction * (nodeHeight / 2) };
  }
  if (Math.abs(toCenter.x - fromCenter.x) > Math.abs(toCenter.y - fromCenter.y)) {
    const direction = toCenter.x >= fromCenter.x ? 1 : -1;
    return { x1: fromCenter.x + direction * (nodeWidth / 2), y1: fromCenter.y, x2: toCenter.x - direction * (nodeWidth / 2), y2: toCenter.y };
  }
  const direction = toCenter.y >= fromCenter.y ? 1 : -1;
  return { x1: fromCenter.x, y1: fromCenter.y + direction * (nodeHeight / 2), x2: toCenter.x, y2: toCenter.y - direction * (nodeHeight / 2) };
}

function edgeFlow(from: PlacedNode, to: PlacedNode, wide: boolean, nodeWidth: number, nodeHeight: number, oneWay: boolean) {
  const line = connection(from, to, wide, nodeWidth, nodeHeight);
  const fromCenter = { x: from.x + nodeWidth / 2, y: from.y + nodeHeight / 2 };
  const toCenter = { x: to.x + nodeWidth / 2, y: to.y + nodeHeight / 2 };
  const routedAroundNodes = from.laneIndex === to.laneIndex || !wide;
  if (routedAroundNodes) {
    const railInset = 18;
    const rightRail = Math.max(from.x, to.x) + nodeWidth + railInset;
    const leftRail = Math.min(from.x, to.x) - railInset;
    return {
      line,
      sameLane: true,
      request: [fromCenter, { x: from.x + nodeWidth, y: fromCenter.y }, { x: rightRail, y: fromCenter.y }, { x: rightRail, y: toCenter.y }, { x: to.x + nodeWidth, y: toCenter.y }, toCenter],
      response: [toCenter, { x: to.x, y: toCenter.y }, { x: leftRail, y: toCenter.y }, { x: leftRail, y: fromCenter.y }, { x: from.x, y: fromCenter.y }, fromCenter],
    };
  }
  const distance = Math.max(1, Math.hypot(line.x2 - line.x1, line.y2 - line.y1));
  const offsetX = oneWay ? 0 : (line.y2 - line.y1) / distance * 6;
  const offsetY = oneWay ? 0 : -(line.x2 - line.x1) / distance * 6;
  const request = [fromCenter, { x: line.x1 + offsetX, y: line.y1 + offsetY }, { x: line.x2 + offsetX, y: line.y2 + offsetY }, toCenter];
  const response = [toCenter, { x: line.x2 - offsetX, y: line.y2 - offsetY }, { x: line.x1 - offsetX, y: line.y1 - offsetY }, fromCenter];
  return { line, sameLane: false, request, response };
}

function pathThrough(points: Point[]) {
  return points.map((point, index) => `${index ? "L" : "M"}${point.x} ${point.y}`).join(" ");
}

function FlowDot({ points, color, delay, duration, phase }: { points: Point[]; color: string; delay: number; duration: number; phase: "single" | "request" | "response" }) {
  const progress = useSharedValue(0);
  const segmentLengths = useMemo(() => points.slice(1).map((point, index) => Math.hypot(point.x - points[index].x, point.y - points[index].y)), [points]);
  const totalLength = segmentLengths.reduce((total, length) => total + length, 0);
  useEffect(() => {
    progress.value = 0;
    progress.value = withDelay(delay, withRepeat(withTiming(1, { duration: phase === "single" ? duration : duration * 2, easing: Easing.linear }), -1, false));
    return () => cancelAnimation(progress);
  }, [delay, duration, phase, progress]);
  const animatedProps = useAnimatedProps(() => {
    if (points.length < 2) return { cx: -10, cy: -10, opacity: 0 };
    const visible = phase === "single" || (phase === "request" ? progress.value < 0.5 : progress.value >= 0.5);
    const routeProgress = phase === "single" ? progress.value : phase === "request" ? Math.min(1, progress.value * 2) : Math.max(0, (progress.value - 0.5) * 2);
    let remaining = routeProgress * totalLength;
    let segment = 0;
    while (segment < segmentLengths.length - 1 && remaining > segmentLengths[segment]) {
      remaining -= segmentLengths[segment];
      segment += 1;
    }
    const localProgress = segmentLengths[segment] > 0 ? Math.min(1, remaining / segmentLengths[segment]) : 1;
    const start = points[segment];
    const end = points[segment + 1];
    return {
      cx: start.x + (end.x - start.x) * localProgress,
      cy: start.y + (end.y - start.y) * localProgress,
      opacity: visible ? 0.5 + Math.sin(routeProgress * Math.PI) * 0.5 : 0,
    };
  });
  return <AnimatedCircle r={4} fill={color} stroke="#081321" strokeWidth={1.5} animatedProps={animatedProps} />;
}

function flowRoutes(graph: ArchitectureGraph, byId: Record<string, PlacedNode>, wide: boolean, nodeWidth: number, nodeHeight: number) {
  const outgoing = new Map<string, string[]>();
  graph.edges.forEach((edge) => outgoing.set(edge.from, [...(outgoing.get(edge.from) ?? []), edge.to]));
  const starts = graph.nodes.filter((node) => node.type === "client");
  const paths: string[][] = [];
  const walk = (id: string, path: string[]) => {
    const next = (outgoing.get(id) ?? []).filter((candidate) => !path.includes(candidate));
    if (!next.length) { if (path.length > 1) paths.push(path); return; }
    next.forEach((candidate) => walk(candidate, [...path, candidate]));
  };
  starts.forEach((node) => walk(node.id, [node.id]));
  return paths.map((path) => {
    const flows = path.slice(1).map((id, index) => {
      const from = byId[path[index]]; const to = byId[id];
      const edge = graph.edges.find((item) => item.from === path[index] && item.to === id);
      if (!from || !to || !edge) return null;
      const oneWay = isOneWayEdge(from.node, to.node, edge.label);
      return { ...edgeFlow(from, to, wide, nodeWidth, nodeHeight, oneWay), oneWay };
    }).filter((flow): flow is NonNullable<typeof flow> => flow !== null);
    const requestPoints = flows.flatMap((flow, index) => index === 0 ? flow.request : flow.request.slice(1));
    const synchronous = flows.length === path.length - 1 && flows.every((flow) => !flow.oneWay);
    const responsePoints = synchronous ? [...flows].reverse().flatMap((flow, index) => index === 0 ? flow.response : flow.response.slice(1)) : [];
    return { requestPoints, responsePoints, synchronous, edgeCount: flows.length };
  }).filter((route) => route.requestPoints.length > 1);
}

function NodeIcon({ type, color, size }: { type: ArchitectureNodeType; color: string; size: number }) {
  const common = { stroke: color, strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, fill: "none" };
  let glyph;
  if (type === "client") glyph = <><Rect x="6" y="2" width="12" height="20" rx="2.5" {...common} /><Path d="M9 5h6M10 18h4" {...common} /><Circle cx="12" cy="15.5" r="0.7" fill={color} /></>;
  else if (type === "postgres" || type === "mysql" || type === "readReplica") glyph = <><Ellipse cx="12" cy="5" rx="8" ry="3" {...common} /><Path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 11c0 1.7 3.6 3 8 3s8-1.3 8-3M4 16c0 1.7 3.6 3 8 3s8-1.3 8-3" {...common} /></>;
  else if (type === "redis") glyph = <><Path d="m12 2 9 4.5-9 4.5-9-4.5L12 2Z M3 11l9 4.5 9-4.5M3 16l9 4.5 9-4.5" {...common} /><Path d="M12 11v10" {...common} /></>;
  else if (type === "queue" || type === "kafka") glyph = <><Path d="M4 6h12M4 12h16M4 18h10" {...common} /><Path d="m16 4 3 2-3 2M16 16l3 2-3 2" {...common} /></>;
  else if (type === "search") glyph = <><Circle cx="10.5" cy="10.5" r="6.5" {...common} /><Path d="m15.5 15.5 5 5" {...common} /></>;
  else if (type === "objectStorage") glyph = <><Path d="M4 8.5 12 4l8 4.5v10L12 23l-8-4.5v-10Z" {...common} /><Path d="m4.5 8.5 7.5 4 7.5-4M12 13v9" {...common} /></>;
  else if (type === "cdn" || type === "region") glyph = <><Circle cx="12" cy="12" r="9" {...common} /><Ellipse cx="12" cy="12" rx="4" ry="9" {...common} /><Path d="M3.5 9h17M3.5 15h17" {...common} /></>;
  else if (type === "loadBalancer" || type === "rateLimiter") glyph = <><Path d="M12 3v6M12 9 5 15M12 9l7 6M5 15v5M19 15v5" {...common} /><Circle cx="12" cy="4" r="2" fill={color} /><Circle cx="5" cy="18" r="2" fill={color} /><Circle cx="19" cy="18" r="2" fill={color} /></>;
  else if (type === "worker") glyph = <><Circle cx="12" cy="12" r="7" {...common} /><Circle cx="12" cy="12" r="2" {...common} /><Path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2" {...common} /></>;
  else glyph = <><Rect x="3" y="4" width="18" height="6" rx="1.5" {...common} /><Rect x="3" y="14" width="18" height="6" rx="1.5" {...common} /><Circle cx="7" cy="7" r="0.8" fill={color} /><Circle cx="7" cy="17" r="0.8" fill={color} /><Path d="M11 7h6M11 17h6" {...common} /></>;
  return <Svg width={size} height={size} viewBox="0 0 24 24">{glyph}</Svg>;
}

function DraggableNode({ placed, position, layout, zoom, offsetX, index, highlighted, selected, onMove, onInfo }: {
  placed: PlacedNode; position: Point; layout: DiagramLayout; zoom: number; offsetX: number; index: number; highlighted: boolean; selected: boolean; onMove: (id: string, dx: number, dy: number) => void; onInfo: (id: string) => void;
}) {
  const previous = useRef({ dx: 0, dy: 0 });
  const accent = statusColor(placed.node);
  const panResponder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => false,
    onMoveShouldSetPanResponder: (_event, gesture) => Math.abs(gesture.dx) + Math.abs(gesture.dy) > 4,
    onPanResponderTerminationRequest: () => false,
    onPanResponderGrant: () => { previous.current = { dx: 0, dy: 0 }; },
    onPanResponderMove: (_event, gesture) => {
      const deltaX = gesture.dx - previous.current.dx;
      const deltaY = gesture.dy - previous.current.dy;
      previous.current = { dx: gesture.dx, dy: gesture.dy };
      onMove(placed.node.id, deltaX / zoom, deltaY / zoom);
    },
  }), [onMove, placed.node.id, zoom]);

  return (
    <Animated.View
      {...panResponder.panHandlers}
      entering={FadeInDown.delay(highlighted ? 170 + index * 75 : index * 55).duration(highlighted ? 430 : 240)}
      style={[
        styles.node,
        { left: offsetX + position.x * zoom, top: position.y * zoom, width: layout.nodeWidth * zoom, height: layout.nodeHeight * zoom, borderColor: highlighted || selected ? accent : `${accent}50`, shadowColor: selected ? accent : "#000", shadowOpacity: selected ? .2 : .3 },
      ]}
    >
      <LinearGradient pointerEvents="none" colors={[`${accent}18`, "#0C1929", "#0A1422"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[StyleSheet.absoluteFill, { borderRadius: 13 }]} />
      <View pointerEvents="none" style={[styles.nodeAccent, { backgroundColor: accent, opacity: selected || highlighted ? 1 : .6 }]} />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Info about ${placed.node.label}`}
        accessibilityState={{ expanded: selected }}
        accessibilityHint={`${nodeStatus(placed.node)}. Tap to inspect, or drag to reposition within its layer.`}
        onPress={() => onInfo(placed.node.id)}
        style={({ pressed }) => [styles.nodeInner, { padding: 10 * zoom }, pressed && { opacity: .8 }]}
      >
        <View style={[styles.nodeMain, { gap: 9 * zoom }]}>
          <View style={[styles.nodeIcon, { width: 31 * zoom, height: 31 * zoom, borderRadius: 9 * zoom, backgroundColor: `${accent}13`, borderColor: `${accent}35` }]}>
            <NodeIcon type={placed.node.type} color={accent} size={20 * zoom} />
          </View>
          <View style={styles.nodeCopy}>
            <Text numberOfLines={1} style={[styles.nodeTitle, { fontSize: 11 * zoom }]}>{placed.node.label}</Text>
            <Text numberOfLines={1} style={[styles.nodeSubtitle, { fontSize: 9 * zoom, marginTop: 3 * zoom }]}>{placed.node.subtitle || laneCopy[placed.lane].note}</Text>
          </View>
        </View>
        <View style={[styles.nodeFooter, { paddingTop: 7 * zoom, marginTop: 7 * zoom }]}>
          <View style={styles.nodeStatus}><View style={[styles.statusDot, { backgroundColor: healthColor(placed.node) }]} /><Text style={[styles.nodeStatusText, { color: healthColor(placed.node), fontSize: 8 * zoom }]}>{nodeStatus(placed.node)}</Text></View>
          <Text style={[styles.inspectIcon, { fontSize: 10 * zoom }]}>{selected ? "−" : "↗"}</Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

export function ArchitectureCanvas({ graph, compact = false, highlightIds = EMPTY_HIGHLIGHTS }: { graph: ArchitectureGraph; compact?: boolean; highlightIds?: string[] }) {
  const [containerWidth, setContainerWidth] = useState<number | null>(null);
  const availableWidth = Math.max(240, containerWidth === null ? 320 : containerWidth - (compact ? 26 : 34));
  const wide = availableWidth >= WIDE_CANVAS_WIDTH;
  const svgId = `map-${useId().replace(/:/g, "")}`;
  const incidentCount = graph.nodes.filter((node) => node.state === "failed" || node.state === "overloaded" || node.state === "warning").length;
  const layout = useMemo(() => buildLayout(graph, wide, availableWidth), [graph, wide, availableWidth]);
  const [positions, setPositions] = useState<Record<string, Point>>(() => layout.initialPositions);
  const [zoom, setZoom] = useState(1);
  const [minimized, setMinimized] = useState(false);
  const [infoNodeId, setInfoNodeId] = useState<string | null>(null);
  useEffect(() => { setPositions(layout.initialPositions); }, [layout]);

  const moveNode = useCallback((id: string, dx: number, dy: number) => {
    setPositions((current) => {
      const node = layout.nodes.find((item) => item.node.id === id);
      const position = current[id];
      if (!node || !position) return current;
      const lane = layout.lanes.find((item) => item.id === node.lane);
      if (!lane) return current;
      const minY = lane.y + (wide ? 64 : 44);
      const maxX = lane.x + lane.width - layout.nodeWidth - 7;
      const maxY = lane.y + lane.height - layout.nodeHeight - 7;
      const minX = lane.x + 7;
      return {
        ...current,
        [id]: {
          x: Math.max(minX, Math.min(maxX, position.x + dx)),
          y: Math.max(minY, Math.min(maxY, position.y + dy)),
        },
      };
    });
  }, [layout, wide]);

  const placed = useMemo(() => layout.nodes.map((item) => ({ ...item, x: positions[item.node.id]?.x ?? item.x, y: positions[item.node.id]?.y ?? item.y })), [layout, positions]);
  const byId = useMemo(() => Object.fromEntries(placed.map((item) => [item.node.id, item])), [placed]);
  const infoNode = infoNodeId ? byId[infoNodeId]?.node : null;
  const routes = useMemo(() => flowRoutes(graph, byId, wide, layout.nodeWidth, layout.nodeHeight), [graph, byId, wide, layout.nodeWidth, layout.nodeHeight]);
  const stageWidth = layout.width * zoom;
  const stageHeight = layout.height * zoom;
  const contentWidth = Math.max(stageWidth, availableWidth);
  const offsetX = (contentWidth - stageWidth) / 2;

  return (
    <View style={[styles.card, compact && styles.compactCard]} onLayout={(event) => setContainerWidth(event.nativeEvent.layout.width)}>
      <View style={styles.headingRow}>
        <View style={styles.headingGlyph}><NodeIcon type="loadBalancer" color="#83DACF" size={22} /></View>
        <View style={styles.headingCopy}>
          <Text style={styles.eyebrow}>SYSTEM TOPOLOGY</Text>
          <Text style={styles.heading}>Architecture map</Text>
        </View>
        <View style={[styles.healthBadge, incidentCount > 0 && styles.healthBadgeWarning]}><View style={[styles.statusDot, { backgroundColor: incidentCount ? colors.yellow : colors.mint }]} /><Text style={[styles.healthText, incidentCount > 0 && { color: colors.yellow }]}>{incidentCount ? `${incidentCount} ALERT${incidentCount > 1 ? "S" : ""}` : "STABLE"}</Text></View>
      </View>
      <View style={styles.toolbar}>
        <Text style={styles.componentCount}>{String(graph.nodes.length).padStart(2, "0")} <Text style={styles.componentCountLabel}>nodes</Text>  <Text style={styles.countDivider}>/</Text>  {String(graph.edges.length).padStart(2, "0")} <Text style={styles.componentCountLabel}>links</Text></Text>
        <View style={styles.zoomTools}>
          {!minimized && <>
            <Pressable accessibilityRole="button" accessibilityLabel="Zoom out" disabled={zoom <= 0.7} onPress={() => setZoom((value) => Math.max(0.7, Math.round((value - 0.1) * 10) / 10))} style={[styles.zoomButton, zoom <= 0.7 && styles.zoomDisabled]}><Text style={styles.zoomButtonText}>−</Text></Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel="Fit all components" onPress={() => { setZoom(1); setPositions(layout.initialPositions); }} style={styles.zoomReadout}><Text style={styles.zoomLabel}>{Math.round(zoom * 100)}%</Text></Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel="Zoom in" disabled={zoom >= 1.5} onPress={() => setZoom((value) => Math.min(1.5, Math.round((value + 0.1) * 10) / 10))} style={[styles.zoomButton, zoom >= 1.5 && styles.zoomDisabled]}><Text style={styles.zoomButtonText}>+</Text></Pressable>
          </>}
          <Pressable accessibilityRole="button" accessibilityLabel={minimized ? "Expand map" : "Minimize map"} onPress={() => setMinimized((value) => !value)} style={styles.minimizeButton}><Text style={styles.minimizeText}>{minimized ? "SHOW" : "HIDE"}</Text></Pressable>
        </View>
      </View>
      {minimized ? <Pressable accessibilityRole="button" accessibilityLabel="Expand map to see all components" onPress={() => setMinimized(false)} style={styles.mapSummary}><Text style={styles.summaryLabel}>{graph.nodes.length} COMPONENTS · TAP TO EXPAND</Text><Text numberOfLines={1} style={styles.summaryNodes}>{graph.nodes.map((node) => node.label).join("  ·  ")}</Text></Pressable> : <>
      <View style={styles.canvasMeta}><View style={styles.live}><View style={styles.liveDot} /><Text style={styles.liveText}>REQUEST FLOW</Text></View><Text style={styles.dragHint}>DRAG TO ARRANGE · TAP TO INSPECT</Text></View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} bounces={false} style={[styles.canvasScroll, { height: stageHeight }]} contentContainerStyle={{ width: contentWidth, height: stageHeight }}>
        <View style={{ width: contentWidth, height: stageHeight, position: "relative" }}>
          <Svg width={stageWidth} height={stageHeight} viewBox={`0 0 ${layout.width} ${layout.height}`} style={[StyleSheet.absoluteFill, { left: offsetX }]}>
            <Defs>
              <Pattern id={`${svgId}-dots`} width={20} height={20} patternUnits="userSpaceOnUse"><Circle cx={10} cy={10} r={.7} fill="#53758B" fillOpacity={.32} /></Pattern>
              <Pattern id={`${svgId}-grid`} width={100} height={100} patternUnits="userSpaceOnUse"><Path d="M100 0H0V100" fill="none" stroke="#244256" strokeWidth={.5} strokeOpacity={.26} /><Path d="M0 4V0H4" fill="none" stroke="#628698" strokeWidth={1} strokeOpacity={.35} /></Pattern>
              <SvgGradient id={`${svgId}-surface`} x1="0%" y1="0%" x2="100%" y2="100%"><Stop offset="0" stopColor="#0C1C2D" /><Stop offset="1" stopColor="#060E1A" /></SvgGradient>
              {layout.lanes.map((lane) => <SvgGradient key={lane.id} id={`${svgId}-${lane.id}`} x1="0%" y1="0%" x2="0%" y2="100%"><Stop offset="0" stopColor={lane.color} stopOpacity={.055} /><Stop offset="1" stopColor={lane.color} stopOpacity={.012} /></SvgGradient>)}
              {([["request", colors.blue], ["response", colors.mint], ["proposal", colors.purple], ["incident", colors.red]] as const).map(([name, color]) => <Marker key={name} id={`${svgId}-${name}-arrow`} markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><Path d="m1 1 3.5 2L1 5" fill="none" stroke={color} strokeWidth={1} strokeLinecap="round" strokeLinejoin="round" /></Marker>)}
            </Defs>
            <Rect width={layout.width} height={layout.height} fill={`url(#${svgId}-surface)`} />
            <Rect width={layout.width} height={layout.height} fill={`url(#${svgId}-dots)`} />
            <Rect width={layout.width} height={layout.height} fill={`url(#${svgId}-grid)`} />
            {layout.lanes.map((lane, index) => <G key={lane.id}>
              <Rect x={lane.x} y={lane.y} width={lane.width} height={lane.height} rx={12} fill={`url(#${svgId}-${lane.id})`} stroke={lane.color} strokeOpacity={.13} strokeWidth={1} />
              <Rect x={lane.x + 12} y={lane.y + 12} width={22} height={19} rx={5} fill={lane.color} fillOpacity={.09} stroke={lane.color} strokeOpacity={.2} />
              <SvgText fontFamily="monospace" x={lane.x + 23} y={lane.y + 25} fill={lane.color} textAnchor="middle" fontSize={8} fontWeight="700">0{index + 1}</SvgText>
              <SvgText fontFamily="monospace" x={lane.x + 42} y={lane.y + 25} fill="#A9BDCF" fontSize={9} fontWeight="700" letterSpacing={1}>{lane.title}</SvgText>
              {wide && <SvgText fontFamily="monospace" x={lane.x + 14} y={lane.y + 47} fill="#658198" fontSize={9}>{lane.note}</SvgText>}
            </G>)}
            {graph.edges.map((edge) => {
              const from = byId[edge.from]; const to = byId[edge.to];
              if (!from || !to) return null;
              const incident = [from.node, to.node].find((node) => node.state === "overloaded" || node.state === "failed");
              const color = incident ? colors.red : edge.dashed ? colors.purple : colors.blue;
              const label = edgeLabel(from.node, to.node, edge.label);
              const oneWay = isOneWayEdge(from.node, to.node, edge.label);
              const flow = edgeFlow(from, to, wide, layout.nodeWidth, layout.nodeHeight, oneWay);
              const line = flow.line;
              const requestPath = pathThrough(flow.request.slice(1, -1));
              const responsePath = pathThrough(flow.response.slice(1, -1));
              const midX = (line.x1 + line.x2) / 2;
              const midY = (line.y1 + line.y2) / 2;
              const labelX = flow.sameLane ? flow.request[2].x + 5 : midX + (wide ? 0 : 20);
              const responseX = flow.sameLane ? flow.response[2].x - 5 : midX + (wide ? 0 : 20);
              const focused = !infoNodeId || edge.from === infoNodeId || edge.to === infoNodeId;
              return <G key={`${edge.from}-${edge.to}`} opacity={focused ? 1 : .2}>
                <Path d={requestPath} fill="none" stroke={color} strokeOpacity={.07} strokeWidth={7} strokeLinejoin="round" />
                <Path d={requestPath} fill="none" stroke={color} strokeOpacity={0.8} strokeWidth={1.4} strokeLinejoin="round" strokeDasharray={edge.dashed ? "5 5" : undefined} markerEnd={`url(#${svgId}-${incident ? "incident" : edge.dashed ? "proposal" : "request"}-arrow)`} />
                {!oneWay && <Path d={responsePath} fill="none" stroke={incident ? colors.red : colors.mint} strokeOpacity={0.45} strokeWidth={1.2} strokeDasharray="3 5" strokeLinejoin="round" markerEnd={`url(#${svgId}-${incident ? "incident" : "response"}-arrow)`} />}
                <SvgText fontFamily="monospace" x={labelX} y={midY - (wide ? 10 : 7)} fill="#B6C4D5" fontSize={wide ? 8.5 : 8} fontWeight="700" textAnchor={flow.sameLane || !wide ? "start" : "middle"}>{(wide && !flow.sameLane || oneWay ? label : "REQ").toUpperCase()}</SvgText>
                {!oneWay && <SvgText fontFamily="monospace" x={responseX} y={midY + (wide ? 19 : 8)} fill="#89D7C0" fontSize={wide ? 8.5 : 8} fontWeight="700" textAnchor={flow.sameLane ? "end" : wide ? "middle" : "start"}>{(wide && !flow.sameLane ? responseLabel(to.node) : "RESP").toUpperCase()}</SvgText>}
              </G>;
            })}
          </Svg>
          {placed.map((item, index) => <DraggableNode key={`${item.node.id}-${highlightIds.includes(item.node.id) ? "changed" : "base"}`} placed={item} position={{ x: item.x, y: item.y }} layout={layout} zoom={zoom} offsetX={offsetX} index={index} highlighted={highlightIds.includes(item.node.id)} selected={infoNodeId === item.node.id} onMove={moveNode} onInfo={(id) => setInfoNodeId((current) => current === id ? null : id)} />)}
          <Svg pointerEvents="none" width={stageWidth} height={stageHeight} viewBox={`0 0 ${layout.width} ${layout.height}`} style={[StyleSheet.absoluteFill, { left: offsetX, zIndex: 1 }]}>
            {routes.map((route, index) => <G key={`flow-${index}`}>
              <FlowDot points={route.requestPoints} color={colors.blue} delay={index * 350} duration={Math.max(1800, route.edgeCount * 1100)} phase={route.synchronous ? "request" : "single"} />
              {route.synchronous && <FlowDot points={route.responsePoints} color={colors.mint} delay={index * 350} duration={Math.max(1800, route.edgeCount * 1100)} phase="response" />}
            </G>)}
          </Svg>
        </View>
      </ScrollView>
      {infoNode && <View style={styles.infoPanel}>
        <View style={styles.infoTop}><View style={[styles.infoGlyph, { borderColor: `${statusColor(infoNode)}55`, backgroundColor: `${statusColor(infoNode)}17` }]}><NodeIcon type={infoNode.type} color={statusColor(infoNode)} size={20} /></View><View style={styles.infoCopy}><Text style={styles.infoEyebrow}>COMPONENT  /  {laneCopy[laneFor(infoNode.type)].title}</Text><Text style={styles.infoTitle}>{infoNode.label}</Text></View><Pressable accessibilityRole="button" accessibilityLabel="Close component info" onPress={() => setInfoNodeId(null)} style={styles.infoClose}><Text style={styles.infoCloseText}>×</Text></Pressable></View>
        <Text style={styles.infoDescription}>{nodeExplanation(infoNode)}</Text>
        <Text style={[styles.infoState, { color: healthColor(infoNode) }]}>{nodeStatus(infoNode).toUpperCase()}{infoNode.subtitle ? `  ·  ${infoNode.subtitle}` : ""}</Text>
      </View>}
      <View style={styles.legend}>
        <Text style={styles.legendLabel}>TRAFFIC</Text>
        <LegendDot color={colors.blue} label="request" />
        <LegendDot color={colors.mint} label="response" />
        <Text style={styles.legendHint}>Select a node to explore</Text>
      </View>
      </>}
    </View>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: color }]} /><Text style={styles.legendText}>{label}</Text></View>;
}

const styles = StyleSheet.create({
  card: { backgroundColor: "#0A1523", borderRadius: radii.lg, borderWidth: 1, borderColor: "#263D50", padding: spacing.md, overflow: "hidden" },
  compactCard: { padding: 12, borderRadius: 18 },
  headingRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 4 },
  headingGlyph: { width: 39, height: 39, borderRadius: 12, borderWidth: 1, borderColor: "#29494F", backgroundColor: "#10282E", alignItems: "center", justifyContent: "center" },
  headingCopy: { flex: 1, minWidth: 0 },
  eyebrow: { color: "#7895A8", fontSize: 7, letterSpacing: 1.8, fontWeight: "800" },
  heading: { color: "#E6F0F8", fontSize: 17, letterSpacing: -.45, fontWeight: "700", marginTop: 3 },
  healthBadge: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 8, paddingVertical: 6, borderRadius: 6, backgroundColor: "#102C2B", borderWidth: 1, borderColor: "#25463F" },
  healthBadgeWarning: { backgroundColor: "#302A1E", borderColor: "#51422A" },
  healthText: { color: colors.mint, fontSize: 7, fontWeight: "800", letterSpacing: .8 },
  toolbar: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 8, marginTop: 15, paddingVertical: 10, borderTopWidth: 1, borderTopColor: "#1D3040" },
  componentCount: { color: "#C2D4E1", fontSize: 10, fontWeight: "700", fontVariant: ["tabular-nums"] },
  componentCountLabel: { color: "#728B9F", fontWeight: "500" },
  countDivider: { color: "#344F64" },
  zoomTools: { flexDirection: "row", alignItems: "center", gap: 3 },
  zoomButton: { width: 28, height: 28, borderRadius: 6, alignItems: "center", justifyContent: "center", backgroundColor: "#132334", borderWidth: 1, borderColor: "#294054" },
  zoomDisabled: { opacity: .35 },
  zoomButtonText: { color: "#BACDDD", fontSize: 16, fontWeight: "500", lineHeight: 20 },
  zoomReadout: { minWidth: 36, height: 28, alignItems: "center", justifyContent: "center" },
  zoomLabel: { color: "#9BB2C4", fontSize: 9, fontWeight: "600", fontVariant: ["tabular-nums"] },
  minimizeButton: { height: 28, paddingHorizontal: 8, marginLeft: 4, borderRadius: 6, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#294054" },
  minimizeText: { color: "#8DA5B9", fontSize: 7, fontWeight: "700", letterSpacing: .7 },
  mapSummary: { marginTop: 3, padding: 14, borderRadius: 10, borderWidth: 1, borderColor: "#263D50", backgroundColor: "#0D1C2C", gap: 7 },
  summaryLabel: { color: colors.mint, fontSize: 8, fontWeight: "700", letterSpacing: .8 },
  summaryNodes: { color: "#A5BBCD", fontSize: 10 },
  canvasMeta: { flexDirection: "row", flexWrap: "wrap", gap: 6, alignItems: "center", justifyContent: "space-between", paddingHorizontal: 2, marginTop: 2, marginBottom: 9 },
  live: { flexDirection: "row", alignItems: "center", gap: 6 },
  liveDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: "#76BDB6" },
  liveText: { color: "#8BAEB7", fontSize: 7, fontWeight: "700", letterSpacing: 1 },
  dragHint: { color: "#6D879B", fontSize: 6, fontWeight: "600", letterSpacing: .6 },
  canvasScroll: { width: "100%", flexGrow: 0, borderRadius: 12, borderWidth: 1, borderColor: "#1E3547", backgroundColor: "#08121E" },
  node: { position: "absolute", borderWidth: 1, borderRadius: 14, backgroundColor: "#0C1929", shadowColor: "#000", shadowOpacity: .3, shadowRadius: 12, shadowOffset: { width: 0, height: 5 }, elevation: 3, zIndex: 2 },
  nodeAccent: { position: "absolute", top: -1, left: 16, width: 26, height: 2, borderRadius: 2 },
  nodeInner: { flex: 1, justifyContent: "center", borderRadius: 13 },
  nodeMain: { flexDirection: "row", alignItems: "center" },
  nodeIcon: { alignItems: "center", justifyContent: "center", borderWidth: 1, flexShrink: 0 },
  nodeCopy: { flex: 1, minWidth: 0 },
  nodeTitle: { color: "#E8F0F7", fontWeight: "700", letterSpacing: -.1 },
  nodeSubtitle: { color: "#8BA3B8", fontWeight: "500" },
  nodeFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: "#213243" },
  nodeStatus: { flexDirection: "row", alignItems: "center", gap: 5 },
  statusDot: { width: 4, height: 4, borderRadius: 2 },
  nodeStatusText: { fontWeight: "600", letterSpacing: .2 },
  inspectIcon: { color: "#7E99B0", fontWeight: "600" },
  infoPanel: { marginTop: 10, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: "#36526B", backgroundColor: "#102234" },
  infoTop: { flexDirection: "row", alignItems: "center", gap: 9 },
  infoGlyph: { width: 35, height: 35, borderRadius: 10, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  infoCopy: { flex: 1 },
  infoEyebrow: { color: "#87A4BF", fontSize: 7, fontWeight: "700", letterSpacing: .7 },
  infoTitle: { color: "#F0F5FA", fontSize: 14, fontWeight: "700", marginTop: 3 },
  infoClose: { width: 30, height: 30, alignItems: "center", justifyContent: "center", borderRadius: 8, backgroundColor: "#1A3045" },
  infoCloseText: { color: "#B5C5D8", fontSize: 19, lineHeight: 22 },
  infoDescription: { color: "#AFC3D4", fontSize: 11, lineHeight: 18, marginTop: 12 },
  infoState: { color: colors.mint, fontSize: 8, fontWeight: "600", letterSpacing: .5, marginTop: 10 },
  legend: { flexDirection: "row", alignItems: "center", gap: 10, paddingTop: 12, paddingBottom: 2, flexWrap: "wrap" },
  legendLabel: { color: "#637F94", fontSize: 6, letterSpacing: 1.2, fontWeight: "700" },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  legendDot: { width: 12, height: 2, borderRadius: 1 },
  legendText: { color: "#91A9BC", fontSize: 8, fontWeight: "500" },
  legendHint: { color: "#647E93", fontSize: 7, marginLeft: "auto" },
});
