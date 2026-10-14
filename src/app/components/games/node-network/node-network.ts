import {
  Component,
  ElementRef,
  ViewChild,
  PLATFORM_ID,
  inject,
  AfterViewInit,
  OnDestroy,
  signal,
  computed,
  ChangeDetectionStrategy,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

import { GameLayout } from '../../game-layout/game-layout';
import { LEVELS, LevelConfig, findShortestPath, WeightedEdge } from './levels';
import { NetworkAudioSynthesizer } from './network-audio';
import { PlayerStateService } from '../../../services/player-state.service';

@Component({
  selector: 'app-node-network',
  standalone: true,
  imports: [GameLayout],
  templateUrl: './node-network.html',
  styleUrl: './node-network.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NodeNetwork implements AfterViewInit, OnDestroy {
  @ViewChild('gameContainer') container!: ElementRef;

  private platformId = inject(PLATFORM_ID);
  private playerState = inject(PlayerStateService);
  private game: any = null;
  private currentScene: any = null;
  private audio = new NetworkAudioSynthesizer();

  readonly levels = LEVELS;
  readonly currentLevelIndex = signal(0);
  readonly gameState = signal<'MENU' | 'PLAYING' | 'LEVEL_COMPLETE' | 'GAMEOVER'>('MENU');
  readonly stars = signal(0);
  readonly moves = signal(0);
  readonly optimalMoves = signal(0);
  readonly accumulatedLatency = signal(0);
  readonly optimalCost = signal(0);
  readonly remainingBandwidth = signal(0);
  readonly initialBandwidth = signal(0);
  readonly pathBreadcrumbs = signal<number[]>([]);
  readonly currentNodeIndex = signal(0);
  readonly hintsUsed = signal(0);
  readonly activeHintNode = signal<number | null>(null);
  readonly isMuted = signal(false);
  readonly previewNextEdgeCost = signal<number | null>(null);
  readonly levelBestStars = signal<Record<number, number>>(this.loadSavedStars());

  readonly bandwidthPercent = computed(() => {
    const init = this.initialBandwidth();
    if (init <= 0) return 100;
    const pct = Math.max(0, Math.min(100, Math.round((this.remainingBandwidth() / init) * 100)));
    return pct;
  });

  private loadSavedStars(): Record<number, number> {
    if (typeof window === 'undefined') return {};
    try {
      const data = localStorage.getItem('mind_museum_node_network_stars');
      return data ? JSON.parse(data) : {};
    } catch {
      return {};
    }
  }

  private saveStar(levelId: number, earnedStars: number) {
    if (typeof window === 'undefined') return;
    try {
      const current = { ...this.levelBestStars() };
      if (!current[levelId] || current[levelId] < earnedStars) {
        current[levelId] = earnedStars;
        this.levelBestStars.set(current);
        localStorage.setItem('mind_museum_node_network_stars', JSON.stringify(current));
      }
    } catch {
      // Storage error is non-critical
    }
  }

  async ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      const Phaser = await import('phaser');
      const component = this;

      class MainScene extends Phaser.Scene {
        levelConfig!: LevelConfig;
        moves = 0;
        maxMoves = 0;
        currentNode = 0;
        accumulatedLatency = 0;
        remainingBandwidth = 0;
        gameOver = false;
        isMoving = false;

        adj: { [key: number]: { neighbor: number; weight: number }[] } = {};
        firewalls: Set<number> = new Set();
        nodesData: { id: number; x: number; y: number }[] = [];
        nodeObjects: Phaser.GameObjects.Arc[] = [];
        firewallObjects: Phaser.GameObjects.Arc[] = [];
        edgesGraphics!: Phaser.GameObjects.Graphics;
        glowGraphics!: Phaser.GameObjects.Graphics;
        hintGraphics!: Phaser.GameObjects.Graphics;
        edgeLabels: Phaser.GameObjects.Text[] = [];
        packet!: Phaser.GameObjects.Arc;
        particles!: Phaser.GameObjects.Particles.ParticleEmitter;

        constructor() {
          super({ key: 'MainScene' });
        }

        init(data: { levelConfig?: LevelConfig }) {
          if (data && data.levelConfig) {
            this.levelConfig = data.levelConfig;
          }
        }

        create() {
          if (!this.levelConfig) return;
          component.currentScene = this;

          this.moves = 0;
          this.accumulatedLatency = 0;
          this.remainingBandwidth = this.levelConfig.bandwidthBudget;
          this.maxMoves = this.levelConfig.optimalMoves * 2 + 4;
          this.currentNode = this.levelConfig.start;
          this.gameOver = false;
          this.isMoving = false;
          this.nodeObjects = [];
          this.firewallObjects = [];
          this.edgeLabels = [];
          this.firewalls = new Set(this.levelConfig.firewallNodes || []);

          component.moves.set(0);
          component.optimalMoves.set(this.levelConfig.optimalMoves);
          component.accumulatedLatency.set(0);
          component.optimalCost.set(this.levelConfig.optimalCost);
          component.remainingBandwidth.set(this.levelConfig.bandwidthBudget);
          component.initialBandwidth.set(this.levelConfig.bandwidthBudget);
          component.currentNodeIndex.set(this.currentNode);
          component.pathBreadcrumbs.set([this.currentNode]);
          component.hintsUsed.set(0);
          component.activeHintNode.set(null);
          component.previewNextEdgeCost.set(null);

          // Build adjacency graph with weights
          this.adj = {};
          for (let i = 0; i < 36; i++) this.adj[i] = [];
          this.levelConfig.edges.forEach(({ u, v, weight }) => {
            this.adj[u].push({ neighbor: v, weight });
            this.adj[v].push({ neighbor: u, weight });
          });

          // 6x6 Grid with centered coordinates
          this.nodesData = [];
          const offsetX = 175;
          const offsetY = 75;
          for (let i = 0; i < 36; i++) {
            const c = i % 6;
            const r = Math.floor(i / 6);
            this.nodesData.push({ id: i, x: offsetX + c * 90, y: offsetY + r * 90 });
          }

          // Graphics layers
          this.glowGraphics = this.add.graphics();
          this.edgesGraphics = this.add.graphics();
          this.hintGraphics = this.add.graphics().setDepth(5);

          this.drawEdges();

          // Particle texture creation
          if (!this.textures.exists('flare')) {
            const g = this.add.graphics();
            g.fillStyle(0xffffff, 1);
            g.fillCircle(4, 4, 4);
            g.generateTexture('flare', 8, 8);
            g.destroy();
          }

          this.particles = this.add.particles(0, 0, 'flare', {
            speed: 50,
            lifespan: 500,
            scale: { start: 0.5, end: 0 },
            blendMode: 'ADD',
            tint: 0x38bdf8,
          });

          // Build Nodes
          this.nodesData.forEach((n) => {
            let color = 0x1e293b;
            let radius = 15;
            let strokeColor = 0x334155;
            const isStart = n.id === this.levelConfig.start;
            const isEnd = n.id === this.levelConfig.end;
            const isFirewall = this.firewalls.has(n.id);
            const isConnected = (this.adj[n.id]?.length || 0) > 0;

            if (isStart) {
              color = 0x0284c7;
              radius = 20;
              strokeColor = 0x38bdf8;
            } else if (isEnd) {
              color = 0x059669;
              radius = 24;
              strokeColor = 0x34d399;
            } else if (isFirewall) {
              color = 0x881337;
              radius = 18;
              strokeColor = 0xf43f5e;
            } else if (isConnected) {
              color = 0x1e293b;
              strokeColor = 0x475569;
            } else {
              color = 0x090d16;
              strokeColor = 0x1e293b;
            }

            const circle = this.add.circle(n.x, n.y, radius, color).setStrokeStyle(2, strokeColor);

            // Firewall shield ring animation
            if (isFirewall) {
              const shield = this.add.circle(n.x, n.y, radius + 4, 0xf43f5e, 0.15)
                .setStrokeStyle(1.5, 0xf43f5e, 0.7);
              this.tweens.add({
                targets: shield,
                scale: 1.25,
                alpha: 0.1,
                yoyo: true,
                repeat: -1,
                duration: 900,
              });
              this.firewallObjects.push(shield);
            }

            // Node index label (subtle monospace ID)
            if (isConnected || isStart || isEnd) {
              this.add.text(n.x, n.y, String(n.id), {
                fontSize: '10px',
                fontFamily: 'monospace',
                color: isStart || isEnd ? '#ffffff' : '#64748b',
              }).setOrigin(0.5);
            }

            // Node interactive triggers
            if (isConnected || isStart || isEnd || isFirewall) {
              circle.setInteractive();

              circle.on('pointerover', () => {
                if (this.gameOver || this.isMoving) return;
                const edge = this.adj[this.currentNode]?.find((e) => e.neighbor === n.id);

                if (edge) {
                  circle.setScale(1.25);
                  component.previewNextEdgeCost.set(edge.weight);
                } else if (isFirewall) {
                  circle.setScale(1.15);
                }
              });

              circle.on('pointerout', () => {
                circle.setScale(1);
                component.previewNextEdgeCost.set(null);
              });

              circle.on('pointerdown', () => {
                if (this.gameOver || this.isMoving) return;

                // Handle Firewall click rejection
                if (isFirewall) {
                  component.audio.playFirewallAlert();
                  this.cameras.main.shake(140, 0.007);

                  // Warning flash pulse
                  const flash = this.add.circle(n.x, n.y, radius + 15, 0xf43f5e, 0.4);
                  this.tweens.add({
                    targets: flash,
                    scale: 1.5,
                    alpha: 0,
                    duration: 300,
                    onComplete: () => flash.destroy(),
                  });
                  return;
                }

                // Check reachable edge from current node
                const edge = this.adj[this.currentNode]?.find((e) => e.neighbor === n.id);
                if (!edge) return;

                this.isMoving = true;
                const weight = edge.weight;
                this.currentNode = n.id;
                this.moves++;
                this.accumulatedLatency += weight;
                this.remainingBandwidth -= weight;

                component.moves.set(this.moves);
                component.accumulatedLatency.set(this.accumulatedLatency);
                component.remainingBandwidth.set(Math.max(0, this.remainingBandwidth));
                component.currentNodeIndex.set(this.currentNode);
                component.pathBreadcrumbs.update((crumbs) => [...crumbs, n.id]);
                component.activeHintNode.set(null);
                this.hintGraphics.clear();

                // Sound feedback
                component.audio.playHop(n.id, weight);

                // Digital ripple animation on target
                const ripple = this.add.circle(n.x, n.y, 8, 0x38bdf8).setStrokeStyle(2, 0x7dd3fc);
                ripple.setFillStyle();
                this.tweens.add({
                  targets: ripple,
                  radius: 36,
                  alpha: 0,
                  duration: 450,
                  onComplete: () => ripple.destroy(),
                });

                // Move packet smoothly
                this.tweens.add({
                  targets: this.packet,
                  x: n.x,
                  y: n.y,
                  duration: 280,
                  ease: 'Cubic.easeOut',
                  onComplete: () => {
                    this.isMoving = false;
                    this.checkWinLose();
                  },
                });

                this.updateHighlights();
              });
            }

            this.nodeObjects.push(circle);
          });

          // End node pulse animation
          const endCircle = this.nodeObjects[this.levelConfig.end];
          if (endCircle) {
            this.tweens.add({
              targets: endCircle,
              scale: 1.15,
              alpha: 0.85,
              yoyo: true,
              repeat: -1,
              duration: 800,
            });
          }

          // Packet visual
          const startNode = this.nodesData[this.levelConfig.start];
          this.packet = this.add.circle(startNode.x, startNode.y, 9, 0x38bdf8)
            .setStrokeStyle(2, 0xffffff)
            .setDepth(10);
          this.particles.startFollow(this.packet);

          // Background ambient cyber pulses
          this.time.addEvent({
            delay: 1400,
            callback: this.spawnDataPulses,
            callbackScope: this,
            loop: true,
          });

          this.updateHighlights();
        }

        drawEdges() {
          this.edgesGraphics.clear();
          this.edgeLabels.forEach((label) => label.destroy());
          this.edgeLabels = [];

          this.levelConfig.edges.forEach(({ u, v, weight }) => {
            const nodeU = this.nodesData[u];
            const nodeV = this.nodesData[v];
            const isFirewallEdge = this.firewalls.has(u) || this.firewalls.has(v);

            // Line style: firewall edges are dimmed red; regular are slate
            const lineColor = isFirewallEdge ? 0x4c0519 : 0x1e293b;
            const lineAlpha = isFirewallEdge ? 0.6 : 0.85;
            this.edgesGraphics.lineStyle(2, lineColor, lineAlpha);
            this.edgesGraphics.lineBetween(nodeU.x, nodeU.y, nodeV.x, nodeV.y);

            // Midpoint coordinates for weight badge
            const midX = (nodeU.x + nodeV.x) / 2;
            const midY = (nodeU.y + nodeV.y) / 2;

            const badgeText = this.add.text(midX, midY, `${weight}`, {
              fontSize: '11px',
              fontFamily: 'monospace',
              color: isFirewallEdge ? '#f43f5e' : '#38bdf8',
              backgroundColor: '#030712dd',
              padding: { x: 3, y: 1 },
            }).setOrigin(0.5).setDepth(3);

            this.edgeLabels.push(badgeText);
          });
        }

        updateHighlights() {
          this.glowGraphics.clear();
          if (this.gameOver) return;

          // Highlight reachable edges from current position
          const edgesFromCurrent = this.adj[this.currentNode] || [];
          edgesFromCurrent.forEach(({ neighbor }) => {
            const isFirewall = this.firewalls.has(neighbor);
            const color = isFirewall ? 0xf43f5e : 0x0ea5e9;
            const alpha = isFirewall ? 0.3 : 0.6;
            this.glowGraphics.lineStyle(3, color, alpha);
            this.glowGraphics.lineBetween(
              this.nodesData[this.currentNode].x,
              this.nodesData[this.currentNode].y,
              this.nodesData[neighbor].x,
              this.nodesData[neighbor].y
            );
          });
        }

        showDijkstraHint(nextStep: number) {
          this.hintGraphics.clear();
          const targetNode = this.nodesData[nextStep];
          if (!targetNode) return;

          // Draw animated pulsing line from current to next optimal step
          this.hintGraphics.lineStyle(4, 0x34d399, 0.9);
          this.hintGraphics.lineBetween(
            this.nodesData[this.currentNode].x,
            this.nodesData[this.currentNode].y,
            targetNode.x,
            targetNode.y
          );

          // Pulsing halo on the target node
          const halo = this.add.circle(targetNode.x, targetNode.y, 28, 0x34d399, 0.25).setDepth(6);
          this.tweens.add({
            targets: halo,
            scale: 1.4,
            alpha: 0,
            duration: 700,
            repeat: 2,
            onComplete: () => halo.destroy(),
          });
        }

        spawnDataPulses() {
          if (this.gameOver || !this.levelConfig.edges.length) return;
          const edge = Phaser.Utils.Array.GetRandom(this.levelConfig.edges);
          if (!edge) return;

          const u = this.nodesData[edge.u];
          const v = this.nodesData[edge.v];
          if (!u || !v) return;

          const pulse = this.add.circle(u.x, u.y, 3.5, 0x38bdf8).setDepth(4);
          this.tweens.add({
            targets: pulse,
            x: v.x,
            y: v.y,
            duration: 750,
            ease: 'Linear',
            onComplete: () => pulse.destroy(),
          });
        }

        checkWinLose() {
          if (this.currentNode === this.levelConfig.end) {
            this.gameOver = true;
            this.glowGraphics.clear();
            this.hintGraphics.clear();

            // Calculate stars based on latency budget and hint penalties
            let earnedStars = 1;
            const hints = component.hintsUsed();
            if (this.accumulatedLatency <= this.levelConfig.optimalCost && hints === 0) {
              earnedStars = 3;
            } else if (this.accumulatedLatency <= this.levelConfig.bandwidthBudget && hints <= 1) {
              earnedStars = 2;
            }

            component.stars.set(earnedStars);
            component.gameState.set('LEVEL_COMPLETE');
            component.saveStar(this.levelConfig.id, earnedStars);
            component.audio.playVictoryFanfare();

            // Victory explosion
            const victoryEmitter = this.add.particles(this.packet.x, this.packet.y, 'flare', {
              speed: { min: 100, max: 220 },
              angle: { min: 0, max: 360 },
              scale: { start: 0.8, end: 0 },
              blendMode: 'ADD',
              tint: 0x34d399,
              lifespan: 1200,
              quantity: 35,
            });
            victoryEmitter.explode(35);

            // Log Telemetry to Museum Backend
            component.logCompletionTelemetry(this.levelConfig.id, earnedStars, this.accumulatedLatency, this.moves);

          } else if (this.remainingBandwidth <= 0 || this.moves >= this.maxMoves) {
            this.gameOver = true;
            this.glowGraphics.clear();
            this.hintGraphics.clear();
            component.audio.playTimeout();
            component.gameState.set('GAMEOVER');
          } else {
            this.updateHighlights();
          }
        }
      }

      this.game = new Phaser.Game({
        parent: this.container.nativeElement,
        type: Phaser.AUTO,
        width: 800,
        height: 600,
        backgroundColor: '#030712',
        scene: MainScene,
      });

      this.game.scene.stop('MainScene');
    }
  }

  private async logCompletionTelemetry(levelId: number, stars: number, latency: number, hops: number) {
    try {
      const sessionId = await this.playerState.createSession(`node-network-lvl-${levelId}`);
      if (sessionId) {
        this.playerState.logTelemetry(sessionId, 'LATENCY_MS', latency, { levelId, hops, stars });
        this.playerState.logTelemetry(sessionId, 'NETWORK_STARS', stars, { levelId, latency });
      }
    } catch {
      // Telemetry errors are non-critical
    }
  }

  startGame(index: number) {
    this.currentLevelIndex.set(index);
    this.gameState.set('PLAYING');
    if (this.game) {
      this.game.scene.start('MainScene', { levelConfig: this.levels[index] });
    }
  }

  nextLevel() {
    if (this.currentLevelIndex() < this.levels.length - 1) {
      this.startGame(this.currentLevelIndex() + 1);
    } else {
      this.goToMenu();
    }
  }

  restartLevel() {
    this.startGame(this.currentLevelIndex());
  }

  goToMenu() {
    this.gameState.set('MENU');
    if (this.game) {
      this.game.scene.stop('MainScene');
    }
  }

  toggleAudio() {
    const muted = this.audio.toggleMute();
    this.isMuted.set(muted);
  }

  requestDijkstraHint() {
    if (this.gameState() !== 'PLAYING') return;
    const level = this.levels[this.currentLevelIndex()];
    const current = this.currentNodeIndex();
    const result = findShortestPath(level, current, level.end, true);

    if (result.nextStep !== null) {
      this.activeHintNode.set(result.nextStep);
      this.hintsUsed.update((h) => h + 1);
      this.audio.playHintChime();
      if (this.currentScene) {
        this.currentScene.showDijkstraHint(result.nextStep);
      }
    }
  }

  ngOnDestroy() {
    if (this.game) {
      this.game.destroy(true);
    }
  }
}
