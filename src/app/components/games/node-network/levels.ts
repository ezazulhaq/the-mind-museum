export interface WeightedEdge {
  u: number;
  v: number;
  weight: number; // Transmission latency in ms
}

export interface LevelConfig {
  id: number;
  title: string;
  start: number;
  end: number;
  bandwidthBudget: number; // Total ms budget available before timeout
  optimalCost: number;     // Dijkstra minimum latency path
  optimalMoves: number;    // Minimum hops
  firewallNodes: number[]; // Security firewalls blocking path
  edges: WeightedEdge[];
}

export interface DijkstraResult {
  path: number[];
  cost: number;
  nextStep: number | null;
}

/**
 * Computes the minimum latency path from startNode to endNode using Dijkstra's algorithm,
 * taking edge weights and active firewall obstacles into account.
 */
export function findShortestPath(
  level: LevelConfig,
  current: number,
  target: number,
  avoidFirewalls: boolean = true
): DijkstraResult {
  const blocked = new Set(avoidFirewalls ? (level.firewallNodes || []) : []);
  // Ensure the target is never blocked for evaluation
  blocked.delete(target);

  // Adjacency graph with weights
  const adj: Map<number, { neighbor: number; weight: number }[]> = new Map();
  for (let i = 0; i < 36; i++) adj.set(i, []);

  for (const edge of level.edges) {
    if (!blocked.has(edge.u) && !blocked.has(edge.v)) {
      adj.get(edge.u)?.push({ neighbor: edge.v, weight: edge.weight });
      adj.get(edge.v)?.push({ neighbor: edge.u, weight: edge.weight });
    }
  }

  const dist: number[] = new Array(36).fill(Infinity);
  const prev: (number | null)[] = new Array(36).fill(null);
  const visited = new Set<number>();

  dist[current] = 0;

  for (let i = 0; i < 36; i++) {
    // Find unvisited node with minimal distance
    let u = -1;
    let minDist = Infinity;
    for (let j = 0; j < 36; j++) {
      if (!visited.has(j) && dist[j] < minDist) {
        minDist = dist[j];
        u = j;
      }
    }

    if (u === -1 || dist[u] === Infinity) break;
    if (u === target) break;

    visited.add(u);

    for (const { neighbor, weight } of adj.get(u) || []) {
      if (!visited.has(neighbor)) {
        const alt = dist[u] + weight;
        if (alt < dist[neighbor]) {
          dist[neighbor] = alt;
          prev[neighbor] = u;
        }
      }
    }
  }

  if (dist[target] === Infinity) {
    return { path: [], cost: Infinity, nextStep: null };
  }

  // Reconstruct path
  const path: number[] = [];
  let curr: number | null = target;
  while (curr !== null) {
    path.unshift(curr);
    curr = prev[curr];
  }

  const nextStep = path.length > 1 ? path[1] : null;

  return { path, cost: dist[target], nextStep };
}

export const LEVELS: LevelConfig[] = [
  {
    id: 1,
    title: 'Local Gateway Handshake',
    start: 14,
    end: 16,
    bandwidthBudget: 15,
    optimalCost: 4,
    optimalMoves: 2,
    firewallNodes: [8],
    edges: [
      { u: 14, v: 15, weight: 2 },
      { u: 15, v: 16, weight: 2 },
      { u: 14, v: 8, weight: 1 },
      { u: 16, v: 22, weight: 3 },
      { u: 15, v: 21, weight: 4 },
      { u: 21, v: 22, weight: 2 },
    ],
  },
  {
    id: 2,
    title: 'Subnet Switch Bypass',
    start: 8,
    end: 20,
    bandwidthBudget: 24,
    optimalCost: 9,
    optimalMoves: 4,
    firewallNodes: [14],
    edges: [
      { u: 8, v: 9, weight: 2 },
      { u: 9, v: 15, weight: 3 },
      { u: 15, v: 21, weight: 2 },
      { u: 21, v: 20, weight: 2 },
      { u: 9, v: 10, weight: 4 },
      { u: 10, v: 16, weight: 1 },
      { u: 16, v: 22, weight: 2 },
      { u: 22, v: 21, weight: 3 },
      { u: 15, v: 14, weight: 1 },
      { u: 14, v: 13, weight: 2 },
    ],
  },
  {
    id: 3,
    title: 'Firewall Perimeter',
    start: 13,
    end: 33,
    bandwidthBudget: 32,
    optimalCost: 12,
    optimalMoves: 5,
    firewallNodes: [20, 27],
    edges: [
      { u: 13, v: 19, weight: 2 },
      { u: 19, v: 25, weight: 3 },
      { u: 25, v: 26, weight: 2 },
      { u: 26, v: 32, weight: 2 },
      { u: 32, v: 33, weight: 3 },
      { u: 13, v: 14, weight: 4 },
      { u: 14, v: 15, weight: 2 },
      { u: 15, v: 21, weight: 3 },
      { u: 21, v: 27, weight: 1 },
      { u: 27, v: 28, weight: 2 },
      { u: 28, v: 34, weight: 2 },
      { u: 34, v: 33, weight: 3 },
      { u: 19, v: 20, weight: 1 },
      { u: 26, v: 20, weight: 1 },
    ],
  },
  {
    id: 4,
    title: 'Optical Fiber Trunk',
    start: 2,
    end: 28,
    bandwidthBudget: 36,
    optimalCost: 14,
    optimalMoves: 6,
    firewallNodes: [15, 21],
    edges: [
      { u: 2, v: 8, weight: 3 },
      { u: 8, v: 14, weight: 2 },
      { u: 14, v: 20, weight: 2 },
      { u: 20, v: 26, weight: 3 },
      { u: 26, v: 27, weight: 2 },
      { u: 27, v: 28, weight: 2 },
      { u: 2, v: 3, weight: 1 },
      { u: 3, v: 9, weight: 4 },
      { u: 9, v: 15, weight: 2 },
      { u: 15, v: 16, weight: 2 },
      { u: 16, v: 22, weight: 2 },
      { u: 22, v: 28, weight: 4 },
      { u: 8, v: 9, weight: 3 },
      { u: 14, v: 13, weight: 2 },
      { u: 20, v: 21, weight: 1 },
      { u: 21, v: 22, weight: 2 },
    ],
  },
  {
    id: 5,
    title: 'Core Ring Redundancy',
    start: 0,
    end: 17,
    bandwidthBudget: 38,
    optimalCost: 15,
    optimalMoves: 7,
    firewallNodes: [8, 14],
    edges: [
      { u: 0, v: 1, weight: 2 },
      { u: 1, v: 2, weight: 2 },
      { u: 2, v: 3, weight: 2 },
      { u: 3, v: 4, weight: 3 },
      { u: 4, v: 5, weight: 3 },
      { u: 5, v: 11, weight: 1 },
      { u: 11, v: 17, weight: 2 },
      { u: 0, v: 6, weight: 1 },
      { u: 6, v: 12, weight: 2 },
      { u: 12, v: 13, weight: 3 },
      { u: 13, v: 14, weight: 1 },
      { u: 14, v: 15, weight: 2 },
      { u: 15, v: 16, weight: 2 },
      { u: 16, v: 17, weight: 3 },
      { u: 1, v: 7, weight: 2 },
      { u: 7, v: 8, weight: 2 },
      { u: 8, v: 9, weight: 1 },
      { u: 9, v: 10, weight: 3 },
      { u: 10, v: 16, weight: 2 },
      { u: 3, v: 9, weight: 3 },
      { u: 13, v: 19, weight: 2 },
      { u: 19, v: 20, weight: 3 },
    ],
  },
  {
    id: 6,
    title: 'Backbone Mesh Routing',
    start: 6,
    end: 29,
    bandwidthBudget: 42,
    optimalCost: 17,
    optimalMoves: 8,
    firewallNodes: [19, 21, 31],
    edges: [
      { u: 6, v: 7, weight: 2 },
      { u: 7, v: 13, weight: 2 },
      { u: 13, v: 19, weight: 2 },
      { u: 19, v: 25, weight: 1 },
      { u: 25, v: 26, weight: 2 },
      { u: 26, v: 27, weight: 2 },
      { u: 27, v: 28, weight: 3 },
      { u: 28, v: 29, weight: 2 },
      { u: 6, v: 12, weight: 3 },
      { u: 12, v: 18, weight: 2 },
      { u: 18, v: 24, weight: 2 },
      { u: 24, v: 30, weight: 3 },
      { u: 30, v: 31, weight: 1 },
      { u: 31, v: 32, weight: 2 },
      { u: 32, v: 33, weight: 2 },
      { u: 33, v: 34, weight: 2 },
      { u: 34, v: 35, weight: 2 },
      { u: 35, v: 29, weight: 3 },
      { u: 13, v: 14, weight: 2 },
      { u: 14, v: 15, weight: 2 },
      { u: 15, v: 21, weight: 2 },
      { u: 21, v: 22, weight: 2 },
      { u: 22, v: 23, weight: 2 },
      { u: 23, v: 29, weight: 2 },
      { u: 7, v: 8, weight: 3 },
      { u: 8, v: 9, weight: 2 },
      { u: 9, v: 10, weight: 2 },
      { u: 10, v: 11, weight: 3 },
      { u: 11, v: 17, weight: 2 },
      { u: 17, v: 23, weight: 2 },
    ],
  },
  {
    id: 7,
    title: 'Zero-Trust Bastion',
    start: 35,
    end: 0,
    bandwidthBudget: 48,
    optimalCost: 20,
    optimalMoves: 10,
    firewallNodes: [20, 27, 8],
    edges: [
      { u: 35, v: 34, weight: 2 },
      { u: 34, v: 33, weight: 2 },
      { u: 33, v: 32, weight: 2 },
      { u: 32, v: 26, weight: 2 },
      { u: 26, v: 20, weight: 1 },
      { u: 20, v: 14, weight: 2 },
      { u: 14, v: 8, weight: 2 },
      { u: 8, v: 7, weight: 2 },
      { u: 7, v: 1, weight: 2 },
      { u: 1, v: 0, weight: 2 },
      { u: 35, v: 29, weight: 2 },
      { u: 29, v: 23, weight: 2 },
      { u: 23, v: 17, weight: 2 },
      { u: 17, v: 11, weight: 2 },
      { u: 11, v: 5, weight: 2 },
      { u: 5, v: 4, weight: 2 },
      { u: 4, v: 3, weight: 2 },
      { u: 3, v: 2, weight: 2 },
      { u: 2, v: 1, weight: 2 },
      { u: 33, v: 27, weight: 2 },
      { u: 27, v: 21, weight: 2 },
      { u: 21, v: 15, weight: 2 },
      { u: 15, v: 9, weight: 2 },
      { u: 9, v: 3, weight: 2 },
      { u: 26, v: 25, weight: 3 },
      { u: 25, v: 19, weight: 3 },
      { u: 19, v: 13, weight: 2 },
      { u: 13, v: 7, weight: 2 },
    ],
  },
  {
    id: 8,
    title: 'High-Frequency Trading Loop',
    start: 14,
    end: 21,
    bandwidthBudget: 22,
    optimalCost: 6,
    optimalMoves: 2,
    firewallNodes: [15],
    edges: [
      { u: 14, v: 13, weight: 1 },
      { u: 13, v: 7, weight: 1 },
      { u: 7, v: 8, weight: 1 },
      { u: 8, v: 9, weight: 1 },
      { u: 9, v: 10, weight: 1 },
      { u: 10, v: 16, weight: 1 },
      { u: 16, v: 22, weight: 1 },
      { u: 22, v: 21, weight: 1 },
      { u: 14, v: 15, weight: 1 },
      { u: 15, v: 21, weight: 1 },
      { u: 14, v: 20, weight: 4 },
      { u: 20, v: 21, weight: 2 },
    ],
  },
  {
    id: 9,
    title: 'Multi-Path Load Balancer',
    start: 2,
    end: 33,
    bandwidthBudget: 40,
    optimalCost: 16,
    optimalMoves: 6,
    firewallNodes: [10, 21, 24],
    edges: [
      { u: 2, v: 3, weight: 2 },
      { u: 3, v: 9, weight: 2 },
      { u: 9, v: 10, weight: 1 },
      { u: 10, v: 16, weight: 2 },
      { u: 16, v: 17, weight: 3 },
      { u: 17, v: 23, weight: 3 },
      { u: 23, v: 29, weight: 2 },
      { u: 29, v: 28, weight: 2 },
      { u: 28, v: 34, weight: 2 },
      { u: 34, v: 33, weight: 3 },
      { u: 2, v: 1, weight: 3 },
      { u: 1, v: 0, weight: 2 },
      { u: 0, v: 6, weight: 2 },
      { u: 6, v: 12, weight: 3 },
      { u: 12, v: 18, weight: 2 },
      { u: 18, v: 24, weight: 1 },
      { u: 24, v: 30, weight: 2 },
      { u: 30, v: 31, weight: 2 },
      { u: 31, v: 32, weight: 3 },
      { u: 32, v: 33, weight: 2 },
      { u: 9, v: 15, weight: 2 },
      { u: 15, v: 21, weight: 1 },
      { u: 21, v: 27, weight: 2 },
      { u: 27, v: 33, weight: 2 },
      { u: 15, v: 14, weight: 2 },
      { u: 14, v: 8, weight: 3 },
      { u: 8, v: 2, weight: 4 },
      { u: 22, v: 28, weight: 2 },
      { u: 16, v: 22, weight: 3 },
    ],
  },
  {
    id: 10,
    title: 'Quantum Entangled Datacenter',
    start: 18,
    end: 17,
    bandwidthBudget: 42,
    optimalCost: 15,
    optimalMoves: 6,
    firewallNodes: [6, 21, 33],
    edges: [
      { u: 18, v: 12, weight: 2 },
      { u: 12, v: 6, weight: 1 },
      { u: 6, v: 0, weight: 2 },
      { u: 0, v: 1, weight: 2 },
      { u: 1, v: 2, weight: 2 },
      { u: 2, v: 3, weight: 2 },
      { u: 3, v: 4, weight: 2 },
      { u: 4, v: 5, weight: 2 },
      { u: 5, v: 11, weight: 2 },
      { u: 11, v: 17, weight: 2 },
      { u: 18, v: 19, weight: 2 },
      { u: 19, v: 20, weight: 2 },
      { u: 20, v: 21, weight: 2 },
      { u: 21, v: 22, weight: 2 },
      { u: 22, v: 23, weight: 2 },
      { u: 23, v: 17, weight: 2 },
      { u: 19, v: 25, weight: 3 },
      { u: 25, v: 31, weight: 2 },
      { u: 31, v: 32, weight: 2 },
      { u: 32, v: 33, weight: 2 },
      { u: 33, v: 34, weight: 2 },
      { u: 34, v: 35, weight: 3 },
      { u: 35, v: 29, weight: 2 },
      { u: 29, v: 23, weight: 2 },
    ],
  },
];
