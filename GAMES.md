# The Mind Museum - Games Documentation

This document outlines the six interactive games (exhibits) available in **The Mind Museum**. Each game is built as a standalone Angular component and utilizes different specialized libraries (Phaser, Three.js, CDK Drag-Drop) to deliver unique educational and puzzle-solving experiences.

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
- The player must defend the base by placing specific **Logic Gates (AND, OR, NOT)** into tower slots along the path.
- When an enemy passes a gate, its signals are evaluated by that gate's logic rule:
  - `AND` gate destroys the enemy if signals are True/True.
  - `OR` gate destroys the enemy if at least one signal is True.
  - `NOT` gate destroys the enemy if both signals are False.
- If an enemy bypasses the gates, it damages the Base. The player must survive multiple waves.

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
**Tech Stack:** Angular + Phaser 4

**Functionality:**
A graph-based pathfinding and routing puzzle.
- The player controls a "data packet" located on a starting node within a complex network of interconnected nodes.
- The goal is to navigate the packet across the valid connecting lines (edges) to reach a target destination node.
- The player clicks on adjacent nodes to move the packet.
- Movement is constrained by a maximum move limit (`maxMoves`), requiring the player to find the most efficient path (shortest path) through the network graph.

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
