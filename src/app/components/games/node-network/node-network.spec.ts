import { describe, it, expect } from 'vitest';
import { LEVELS, findShortestPath } from './levels';
import { NetworkAudioSynthesizer } from './network-audio';

describe('NodeNetwork Game Engine & Dijkstra Pathfinding', () => {
  it('should load all 10 hand-crafted network levels with complete configs', () => {
    expect(LEVELS.length).toBe(10);
    LEVELS.forEach((level, idx) => {
      expect(level.id).toBe(idx + 1);
      expect(level.edges.length).toBeGreaterThan(0);
      expect(level.bandwidthBudget).toBeGreaterThan(0);
      expect(level.optimalCost).toBeGreaterThan(0);
      expect(level.optimalMoves).toBeGreaterThan(0);
      expect(Array.isArray(level.firewallNodes)).toBe(true);
    });
  });

  it('should calculate shortest path using Dijkstra algorithm for Level 1', () => {
    const level1 = LEVELS[0];
    const result = findShortestPath(level1, level1.start, level1.end, true);

    expect(result.cost).toBe(level1.optimalCost);
    expect(result.nextStep).toBe(15);
    expect(result.path).toEqual([14, 15, 16]);
  });

  it('should route around firewall nodes in Dijkstra solver for Level 3', () => {
    const level3 = LEVELS[2]; // Firewall nodes: [20, 27]
    const result = findShortestPath(level3, level3.start, level3.end, true);

    expect(result.cost).toBeLessThanOrEqual(level3.bandwidthBudget);
    expect(result.cost).toBe(level3.optimalCost);
    expect(result.path.includes(20)).toBe(false);
    expect(result.path.includes(27)).toBe(false);
    expect(result.path[0]).toBe(level3.start);
    expect(result.path[result.path.length - 1]).toBe(level3.end);
  });

  it('should calculate optimal path through high-frequency trading loop (Level 8)', () => {
    const level8 = LEVELS[7]; // Level 8
    const result = findShortestPath(level8, level8.start, level8.end, true);

    expect(result.cost).toBe(level8.optimalCost);
    expect(result.path.includes(15)).toBe(false); // 15 is a firewall
    expect(result.nextStep).toBe(20);
  });

  it('should toggle audio state in NetworkAudioSynthesizer', () => {
    const synth = new NetworkAudioSynthesizer();
    expect(synth.muted).toBe(false);
    expect(synth.toggleMute()).toBe(true);
    expect(synth.muted).toBe(true);
    expect(synth.toggleMute()).toBe(false);
    expect(synth.muted).toBe(false);

    synth.setMute(true);
    expect(synth.muted).toBe(true);
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
      edges: [{ u: 0, v: 1, weight: 2 }],
    };
    const result = findShortestPath(testLevel, testLevel.start, testLevel.end, true);
    expect(result.path).toEqual([]);
    expect(result.cost).toBe(Infinity);
    expect(result.nextStep).toBeNull();
  });
});
