import { describe, it, expect } from 'vitest';
import { LEVELS, findShortestPath, getEdgeWeight } from './levels';
import { NetworkAudioSynthesizer } from './network-audio';

describe('NodeNetwork Game Engine & Dijkstra Dual-Metric Pathfinding', () => {
  it('should load all 10 hand-crafted network levels with complete edge weights, latency, and bandwidth', () => {
    expect(LEVELS.length).toBe(10);
    LEVELS.forEach((level, idx) => {
      expect(level.id).toBe(idx + 1);
      expect(level.edges.length).toBeGreaterThan(0);
      expect(level.bandwidthBudget).toBeGreaterThan(0);
      expect(level.optimalCost).toBeGreaterThan(0);
      expect(level.optimalMoves).toBeGreaterThan(0);
      expect(Array.isArray(level.firewallNodes)).toBe(true);

      // Verify all edges contain latency, bandwidth, and baseline weight
      level.edges.forEach((edge) => {
        expect(edge.latency).toBeGreaterThan(0);
        expect(edge.bandwidth).toBeGreaterThanOrEqual(10);
        expect(edge.weight).toBeGreaterThan(0);
      });
    });
  });

  it('should compute appropriate edge weights for LOW_LATENCY vs HIGH_BANDWIDTH modes', () => {
    const opticalEdge = { u: 1, v: 2, weight: 4, latency: 4, bandwidth: 100 };
    const copperEdge = { u: 1, v: 3, weight: 1, latency: 1, bandwidth: 10 };

    // In Low-Latency mode, weight is directly the latency (lower latency = lower cost)
    expect(getEdgeWeight(opticalEdge, 'LOW_LATENCY')).toBe(4);
    expect(getEdgeWeight(copperEdge, 'LOW_LATENCY')).toBe(1);

    // In High-Bandwidth mode, high capacity (100G) yields minimal cost (1)
    // while narrow link (10G) yields higher cost (8)
    expect(getEdgeWeight(opticalEdge, 'HIGH_BANDWIDTH')).toBe(1);
    expect(getEdgeWeight(copperEdge, 'HIGH_BANDWIDTH')).toBe(8);
  });

  it('should calculate shortest path using Dijkstra algorithm for Level 1 in LOW_LATENCY mode', () => {
    const level1 = LEVELS[0];
    const result = findShortestPath(level1, level1.start, level1.end, true, 'LOW_LATENCY');

    expect(result.cost).toBe(level1.optimalCost); // 4ms
    expect(result.nextStep).toBe(15);
    expect(result.path).toEqual([14, 15, 16]);
    expect(result.totalLatency).toBe(4);
    expect(result.bottleneckBandwidth).toBe(25);
  });

  it('should calculate optimal path through 100G optical lines in HIGH_BANDWIDTH mode', () => {
    const level1 = LEVELS[0];
    // Level 1 has high-bandwidth optical bypass: 14 -> 15 (25G) -> 21 (100G) -> 22 (100G) -> 16 (100G)
    // Direct path 15 -> 16 is 25G (weight 4). Path through 21 -> 22 -> 16 uses 100G (weights 1, 1, 1).
    const bwResult = findShortestPath(level1, level1.start, level1.end, true, 'HIGH_BANDWIDTH');

    expect(bwResult.path.length).toBeGreaterThan(0);
    expect(bwResult.path[0]).toBe(14);
    expect(bwResult.path[bwResult.path.length - 1]).toBe(16);
    expect(bwResult.nextStep).not.toBeNull();
  });

  it('should route around firewall nodes in Dijkstra solver for Level 3', () => {
    const level3 = LEVELS[2]; // Firewall nodes: [20, 27]
    const result = findShortestPath(level3, level3.start, level3.end, true, 'LOW_LATENCY');

    expect(result.cost).toBeLessThanOrEqual(level3.bandwidthBudget);
    expect(result.cost).toBe(level3.optimalCost);
    expect(result.path.includes(20)).toBe(false);
    expect(result.path.includes(27)).toBe(false);
    expect(result.path[0]).toBe(level3.start);
    expect(result.path[result.path.length - 1]).toBe(level3.end);
  });

  it('should calculate optimal path through high-frequency trading loop (Level 8)', () => {
    const level8 = LEVELS[7]; // Level 8
    const result = findShortestPath(level8, level8.start, level8.end, true, 'LOW_LATENCY');

    expect(result.cost).toBe(level8.optimalCost);
    expect(result.path.includes(15)).toBe(false); // 15 is a firewall
    expect(result.nextStep).toBe(20);
  });

  it('should toggle audio and support playModeSwitch without errors in NetworkAudioSynthesizer', () => {
    const synth = new NetworkAudioSynthesizer();
    expect(synth.muted).toBe(false);
    expect(synth.toggleMute()).toBe(true);
    expect(synth.muted).toBe(true);
    expect(synth.toggleMute()).toBe(false);
    expect(synth.muted).toBe(false);

    synth.setMute(true);
    expect(synth.muted).toBe(true);

    // Verify playModeSwitch does not throw
    expect(() => synth.playModeSwitch('LOW_LATENCY')).not.toThrow();
    expect(() => synth.playModeSwitch('HIGH_BANDWIDTH')).not.toThrow();
  });

  it('should return empty path and infinity cost when target is unreachable', () => {
    const testLevel = {
      id: 99,
      title: 'Disconnected',
      start: 0,
      end: 35,
      bandwidthBudget: 10,
      optimalCost: 10,
      optimalMoves: 1,
      firewallNodes: [],
      edges: [{ u: 0, v: 1, weight: 2, latency: 2, bandwidth: 50 }],
    };
    const result = findShortestPath(testLevel, testLevel.start, testLevel.end, true);
    expect(result.path).toEqual([]);
    expect(result.cost).toBe(Infinity);
    expect(result.nextStep).toBeNull();
  });
});
