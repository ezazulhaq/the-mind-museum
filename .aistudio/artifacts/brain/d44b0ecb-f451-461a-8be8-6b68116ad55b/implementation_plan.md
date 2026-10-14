# Node Network 2.0: Cybernetic Routing & Advanced Topology

Elevate the **Node Network** exhibit from a basic grid graph puzzle into an authentic, cognitively demanding computer science simulation. This upgrade introduces weighted network edges (transmission cost/latency), security firewalls, a bandwidth budgeting mechanic, an interactive live-telemetry and Dijkstra-powered hint assistant in the control panel, and a procedural Web Audio sound synthesizer.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> The following directions were confirmed during the Phase 1 consultation:
> 1. **Core Gameplay Mechanics**: Weighted edges, dynamic firewalls, and a bandwidth budget system.
> 2. **Control Panel Enhancements**: Real-time routing telemetry, path breadcrumbs, Dijkstra hint assistant, and sound toggles.
> 3. **Audio Experience**: Procedural, zero-dependency Web Audio API sound effects for node hops, firewall collisions, victory fanfares, and network timeouts.

- **Confirmed Decision 1**: Retain the existing 10 handcrafted levels, enriching each with edge weights, firewall states, and custom bandwidth budgets rather than replacing them with a random generator.
- **Confirmed Decision 2**: Dijkstra Hint Assistant will highlight the next optimal node with a soft star penalty (using 1 hint retains up to 2 stars; 0 hints allows 3 stars).
- **Confirmed Decision 3**: Audio will default to active, with a prominent mute toggle in both the HUD and the control panel.

---

## 1. Overview & Core Concept

- **What It Does**: Players route data packets through network topologies from a source server to a destination core. In addition to avoiding dead ends, players must now balance edge latency (cost in ms/bandwidth) and avoid active firewall security barriers while staying within strict transmission budgets.
- **Target Audience**: Museum visitors ages 10–18 and adult STEM enthusiasts seeking an intuitive, engaging hands-on demonstration of graph theory, Dijkstra's algorithm, and packet switching.
- **Key Value**: Bridges abstract computer science concepts (minimum-cost pathfinding, network latency, firewalls) with tactile, satisfying puzzle mechanics and responsive audiovisual feedback.

---

## 2. User Experience & Visual Design

### Key User Flows

1. **Level Selection**: Players enter from the Exhibits gallery into a futuristic level selector showing earned stars, shortest latency records, and level difficulty tiers.
2. **Active Routing**:
   - The Phaser canvas displays the 6x6 network grid. Edges now display subtle glowing weight tags (e.g. `1`, `2`, `5`).
   - Blocked or firewall-monitored nodes pulse with amber/red security shields.
   - Hovering over an adjacent reachable node previews the latency addition in real-time.
   - Clicking a node moves the packet, plays a pleasant synthesizer tone (pitch mapped to graph coordinates), creates a digital ripple, and updates the breadcrumbs in the control panel.
3. **Telemetry & Assistance (Right Panel)**:
   - **Active Telemetry**: Displays current Node ID, Total Latency Accumulated, Remaining Bandwidth, and Hops.
   - **Path Breadcrumbs**: Horizontal graphical pill stream displaying the trail of traversed nodes (`N14 → N15 → N21`).
   - **Hint Assistant**: Clicking "Run Dijkstra Analysis" triggers a pulsing cyan path hint to the next optimal node.
4. **Resolution**:
   - **Optimal Arrival**: Triggers a victory fanfare, star award calculation (1–3 stars based on combined latency and hop budget), and logs telemetry to the museum backend.
   - **Timeout / Depletion**: If bandwidth drops to zero or hop limit is exceeded, a system alert dialog allows an instant "Retry Route" or "Menu".

### Visual Identity & Theme
- **Color Palette (Dark Cybernetics)**:
  - Dominant Canvas: `bg-slate-950` with deep cyan/indigo ambient backdrops (`bg-cyan-900/15`).
  - Active Data Packet: Glowing Sky Blue (`#38bdf8`) with trailing photon particles.
  - Target Destination: Emerald Core (`#10b981`) with dual-ring expansion pulse.
  - Network Edges: Subtle low-luminance slate (`#334155`) when dormant, illuminated cyan (`#0ea5e9`) when active.
  - Firewalls / Hazards: Crimson/Amber security shields (`#f43f5e` / `#f59e0b`).
- **Typography & Data Display**:
  - Headers: Crisp Plus Jakarta Sans / Inter in gradient cyan-to-indigo.
  - Numbers & Metrics: Strict `font-mono tabular-nums` for latency, bandwidth meters, and node coordinates.
- **Control Layout**:
  - Left Canvas: Immersive full-height interactive Phaser 4 board.
  - Right Panel: Dedicated 450px wide collapsible glassmorphism drawer hosting telemetry cards, breadcrumb trail, Dijkstra hint trigger, and audio volume toggle.

---

## 3. Key Product Decisions & Trade-Offs

- **Procedural Web Audio API vs. External Audio Assets**:
  - *Chosen Approach*: Pure browser `AudioContext` frequency synthesis (sine/triangle oscillators with exponential decay envelopes).
  - *Why*: Zero network latency, zero external asset dependencies, zero risk of 404s in sandboxed preview environments, and dynamic pitch variation based on graph node positions.
- **Edge Weight Representation**:
  - *Chosen Approach*: Render weight numbers directly along edge midpoints using Phaser text objects styled with high-contrast semi-transparent badges.
  - *Why*: Immediate spatial clarity without requiring players to consult external tables or inspect tooltips.
- **State Management & Telemetry**:
  - *Chosen Approach*: Angular Signals (`signal`, `computed`) in the component layer synchronized with the Phaser game scene via event callbacks.
  - *Why*: Unidirectional data flow that updates the right control panel instantly without Zone.js overhead.

---

## 4. Technical Architecture & Data Strategy

### System & Component Architecture

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        Node Network Component                          │
│                                                                        │
│  ┌───────────────────────────────┐  ┌───────────────────────────────┐  │
│  │     Phaser 4 Game Canvas      │  │   Glassmorphic Control Panel  │  │
│  │                               │  │                               │  │
│  │  • Graph Grid (6x6)           │  │  • Telemetry HUD (Signals)    │  │
│  │  • Weighted Edges             │  │  • Breadcrumb Path History    │  │
│  │  • Firewall Node Guards       │  │  • Dijkstra Hint Assistant    │  │
│  │  • Dynamic Packet & Particles │  │  • Web Audio Mute/Volume      │  │
│  └───────────────┬───────────────┘  └───────────────▲───────────────┘  │
│                  │ Scene Events                     │ Reactive State   │
│                  ▼                                  │                  │
│  ┌──────────────────────────────────────────────────┴───────────────┐  │
│  │               Node Network Game Service & State Store            │  │
│  │                                                                  │  │
│  │  • Level Configs (Weights, Firewalls, Bandwidth, Shortest Paths) │  │
│  │  • Dijkstra Shortest Path Solver Algorithm                       │  │
│  │  • Procedural Web Audio Synthesizer (Oscillators, Envelopes)     │  │
│  └──────────────────────────────────┬───────────────────────────────┘  │
└─────────────────────────────────────┼──────────────────────────────────┘
                                      │
                                      ▼
                        ┌───────────────────────────┐
                        │   Player Telemetry API    │
                        │   POST /api/telemetry     │
                        └───────────────────────────┘
```

### Data Model (`LevelConfig` Extension)

```typescript
export interface WeightedEdge {
  u: number;
  v: number;
  weight: number; // Latency cost in ms (1 to 9)
}

export interface LevelConfig {
  id: number;
  title: string;
  start: number;
  end: number;
  bandwidthBudget: number; // Max total cost allowed
  optimalCost: number;     // Dijkstra minimum cost
  optimalHops: number;     // Minimum hop count
  firewallNodes?: number[]; // Security nodes blocking traversal
  edges: WeightedEdge[];
}
```

### Audio Synthesizer Engine Interface

```typescript
export class NetworkAudioSynthesizer {
  playHop(nodeIndex: number, weight: number): void;
  playFirewallHit(): void;
  playSuccess(): void;
  playTimeout(): void;
  toggleMute(): boolean;
}
```

---

## 5. Execution Steps (Post-Approval)

1. **Step 1: Audio Synthesizer Engine**: Implement the zero-dependency browser `AudioContext` synthesizer class inside `src/app/components/games/node-network/network-audio.ts`.
2. **Step 2: Level Configurations & Dijkstra Solver**: Update `levels.ts` with weighted edges, firewall nodes, bandwidth budgets, and an integrated Dijkstra pathfinding solver.
3. **Step 3: Phaser 4 Scene Overhaul**:
   - Render edge weight badges and firewall shields.
   - Animate node traversals with pitch-modulated audio and bandwidth deduction.
   - Add firewall bounce tweens and hover latency tooltips.
4. **Step 4: Control Panel & Signals Integration**:
   - Build live telemetry cards (Accumulated Latency, Remaining Bandwidth, Current Node).
   - Add path breadcrumb timeline.
   - Implement the "Dijkstra Hint" assistant with pulsing node guidance.
   - Add audio volume/mute toggle.
5. **Step 5: Telemetry & Documentation**:
   - Link level completions to `PlayerStateService.logTelemetry`.
   - Update `GAMES.md` to document the new weighted graph and firewall rules.
   - Verify compilation (`compile_applet`) and automated testing.
