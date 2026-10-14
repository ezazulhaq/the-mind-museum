# The Mind Museum - Games Documentation

This document outlines the six interactive games (exhibits) available in **The Mind Museum**. Each game is built as a standalone Angular component and utilizes different specialized libraries (Phaser, Three.js, CDK Drag-Drop) to deliver unique educational and puzzle-solving experiences.

**Global Layout Architecture:** All games now utilize a unified split-screen `<app-game-layout>` wrapper. This ensures a consistent user experience by providing an immersive, full-height game area on the left and a dedicated, 450px wide collapsible control panel on the right (which houses game-specific instructions, controls, drag-and-drop toolboxes, or virtual keyboards). On mobile devices, this control panel automatically collapses into a drawer accessible via a hamburger menu in the top right.

---

## 1. Terminal Velocity
**Component:** `src/app/components/games/terminal-velocity`
**Tech Stack:** Angular + CSS Animations

**Functionality:**
A fast-paced typing game designed to test a player's typing speed and accuracy. 
- Features a full **Difficulty Selection Menu** (Easy, Medium, Hard).
- Words spawn at the top of the screen and fall downwards. The speed, length, and spawn rate of the words scale up based on the chosen difficulty.
- Easy uses short dictionary words, Medium uses intermediate words, and Hard introduces complex words with much faster fall speeds.
- The player must type the words exactly as they appear in the terminal prompt at the bottom of the screen.
- Successfully typing a word destroys it before it hits the bottom and grants points, with score multipliers scaling by difficulty (10x, 15x, 20x per character).
- **Penalty System:** Typing an incorrect character (one that does not match the prefix of any falling word) clears the current input and deducts points based on difficulty (-5 Easy, -10 Medium, -15 Hard).
- **Interactive Virtual Keyboard:** An animated, color-coded virtual keyboard is hosted within the right control panel. It tracks physical keystrokes in real-time, highlights pressed keys, and features glowing "ghost fingertips" that dynamically move to guide players on proper touch-typing finger placements across the home row and beyond.
- The game tracks and logs telemetry metrics such as **Words Per Minute (WPM)**, **Accuracy (%)**, and total score.
- The game ends when a word hits the bottom of the screen ("Game Over"), providing an option to restart or change the difficulty level.

---

## 2. Algorithmic Alchemist
**Component:** `src/app/components/games/algorithmic-alchemist`
**Tech Stack:** Angular + `@angular/cdk/drag-drop` + HTML5 Canvas

**Functionality:**
A visual drag-and-drop programming puzzle that teaches basic algorithmic logic and control flow.
- The player is presented with a grid and must guide a character (alchemist) to a target destination.
- The player drags command blocks from a **Toolbox** into a **Sequence** workspace. Available commands include:
  - Move Forward
  - Turn Right
  - Turn Left
  - Repeat ×3
  - If Wall → Turn
- Once the sequence is built, clicking "Run Sequence" executes the commands step-by-step, animating the character's movement on the Canvas grid.
- Success is achieved when the character lands exactly on the target.

---

## 3. Logic Gate Defender
**Component:** `src/app/components/games/logic-gate-defender`
**Tech Stack:** Angular + Phaser 4

**Functionality:**
A Tower Defense game that teaches boolean logic and digital circuitry.
- Enemies spawn and move along a path towards the player's Base.
- Each enemy carries two boolean signals (e.g., True/True, True/False, False/False).
- The player must defend the base by placing specific **Logic Gates (AND, OR, NOR, XOR, NAND)** into tower slots along the path.
- **Economy System:** Placing gates costs "Bits" (20-30 Bits depending on the gate). Destroying enemies rewards Bits (+10 Bits). The player starts with 100 Bits.
- **Overheating Mechanics:** Gates have limited durability (3 uses). After destroying 3 enemies, the gate overheats, breaks, and must be replaced.
- When an enemy passes a gate, its signals are evaluated by that gate's logic rule:
  - `AND` gate destroys the enemy if signals are True/True.
  - `OR` gate destroys the enemy if at least one signal is True.
  - `NOR` gate destroys the enemy if both signals are False.
  - `XOR` gate destroys the enemy if the signals are different (True/False or False/True).
  - `NAND` gate destroys the enemy unless the signals are True/True.
- If an enemy bypasses the gates, it damages the Base. The player must survive escalating waves of enemies.

---

## 4. Contraption Crafter
**Component:** `src/app/components/games/contraption-crafter`
**Tech Stack:** Angular + Phaser 4 + Matter.js (Physics Engine)

**Functionality:**
A physics-based sandbox puzzle game where players build Rube Goldberg-style machines.
- The goal is to drop a ball from a starting point and successfully guide it into a target bucket.
- The player has a limited inventory (e.g., 8 items) and can select and place mechanical parts onto the screen:
  - **Ramps:** Static angled surfaces for the ball to roll down.
  - **Bumpers:** Highly elastic circles that bounce the ball away.
  - **Platforms:** Flat static surfaces.
  - **Fans:** Blow an invisible column of wind upwards, pushing the ball against gravity.
- After arranging the parts, the player clicks "Launch" to drop the ball and test the physics simulation.

---

## 5. Node Network
**Component:** `src/app/components/games/node-network`
**Tech Stack:** Angular + Phaser 4 + Web Audio API + Graph Theory (Dijkstra)

**Functionality:**
An advanced graph-based routing simulation teaching network latency, weighted graph theory, and cybersecurity topologies.
- Features **10 hand-crafted stages** with diverse network topologies and escalating routing complexity.
- **Weighted Channels (Latency Costs):** Edges are annotated with millisecond latency costs (1ms–4ms). Traversal along an edge adds to the player's total accumulated transmission latency.
- **Firewall Obstacles:** Key nodes are protected by active security firewalls (marked with crimson pulsing shields). Attempting to route through firewalls triggers audio-visual security alerts and camera shakes.
- **Bandwidth Budget System:** Each stage allocates a finite bandwidth pool. Exhausting the pool before reaching the destination causes a transmission timeout failure.
- **Dijkstra Hint Assistant:** An interactive assistant in the right control panel applies Dijkstra's algorithm to calculate the mathematically optimal next step, illuminating the target node with a glowing guidance beam (at the cost of a 1-star penalty).
- **Procedural Cyberpunk Audio:** Built-in zero-dependency Web Audio synthesizer providing pitch-modulated routing chirps, firewall warning pulses, timeout alarms, and victory fanfares.
- **Live Routing Telemetry:** Control panel delivers real-time HUD metrics including node IDs, hop counters, bandwidth capacity meters, and a sequential route breadcrumb trail.
- **Scoring & Persistence:** 3-Star rating system based on meeting theoretical Dijkstra minimums. Best star ratings are saved locally and synced to backend telemetry.

---

## 6. Optic Architect
**Component:** `src/app/components/games/optic-architect`
**Tech Stack:** Angular + Three.js (WebGL)

**Functionality:**
A 3D spatial reasoning and perspective puzzle.
- An isometric 3D structure (made of interlocking cubes) is rendered in the center of the screen using Three.js.
- The player can click and drag their mouse to freely rotate the 3D structure in space along the X and Y axes.
- The goal is to rotate the structure until it perfectly aligns with a specific 2D visual projection (e.g., looking directly down the Z-axis so the shape forms a perfect "L").
- The game detects when the camera's perspective perfectly aligns with the target rotation and declares success ("Alignment Complete").
