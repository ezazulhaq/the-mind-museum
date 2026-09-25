import {
  Component,
  ElementRef,
  ViewChild,
  PLATFORM_ID,
  inject,
  AfterViewInit,
  OnDestroy,
  signal,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

import { GameLayout } from '../../game-layout/game-layout';
import { LEVELS, LevelConfig } from './levels';

@Component({
  selector: 'app-node-network',
  standalone: true,
  imports: [GameLayout],
  templateUrl: './node-network.html',
  styleUrl: './node-network.css',
})
export class NodeNetwork implements AfterViewInit, OnDestroy {
  @ViewChild('gameContainer') container!: ElementRef;

  private platformId = inject(PLATFORM_ID);
  private game: any = null;

  levels = LEVELS;
  currentLevelIndex = signal(0);
  gameState = signal<'MENU' | 'PLAYING' | 'LEVEL_COMPLETE' | 'GAMEOVER'>('MENU');
  stars = signal(0);
  moves = signal(0);
  optimalMoves = signal(0);

  async ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      const Phaser = await import('phaser');
      const component = this;

      class MainScene extends Phaser.Scene {
        levelConfig!: LevelConfig;
        moves = 0;
        maxMoves = 0;
        currentNode = 0;
        gameOver = false;
        isMoving = false;

        adj: { [key: number]: number[] } = {};
        nodesData: any[] = [];
        nodeObjects: any[] = [];
        edgesGraphics!: Phaser.GameObjects.Graphics;
        glowGraphics!: Phaser.GameObjects.Graphics;
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
          if (!this.levelConfig) return; // Prevent crash on Phaser auto-start before a level is selected

          this.moves = 0;
          this.maxMoves = this.levelConfig.optimalMoves * 2 + 2; // Absolute fail limit
          this.currentNode = this.levelConfig.start;
          this.gameOver = false;
          this.isMoving = false;
          this.nodeObjects = [];

          component.moves.set(0);
          component.optimalMoves.set(this.levelConfig.optimalMoves);

          // Prepare Adjacency List
          this.adj = {};
          for (let i = 0; i < 36; i++) this.adj[i] = [];
          this.levelConfig.edges.forEach(([u, v]) => {
            this.adj[u].push(v);
            this.adj[v].push(u);
          });

          // Nodes Grid (6x6)
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

          this.drawEdges();

          // Packet trails
          this.particles = this.add.particles(0, 0, 'flare', {
            speed: 50,
            lifespan: 500,
            scale: { start: 0.5, end: 0 },
            blendMode: 'ADD',
            tint: 0x38bdf8,
          });

          // Create Nodes
          this.nodesData.forEach((n) => {
            // Determine type
            let color = 0x1e293b;
            let radius = 15;
            let strokeColor = 0x334155;

            if (n.id === this.levelConfig.start) {
              color = 0x0ea5e9;
              radius = 20;
              strokeColor = 0x38bdf8;
            } else if (n.id === this.levelConfig.end) {
              color = 0x10b981;
              radius = 25;
              strokeColor = 0x34d399;
            } else if (this.adj[n.id].length > 0) {
              color = 0x334155;
              strokeColor = 0x475569;
            } else {
              // Isolated node
              color = 0x0f172a;
              strokeColor = 0x1e293b;
            }

            const circle = this.add.circle(n.x, n.y, radius, color).setStrokeStyle(2, strokeColor);

            if (this.adj[n.id].length > 0 || n.id === this.levelConfig.start || n.id === this.levelConfig.end) {
              circle.setInteractive();
              circle.on('pointerover', () => {
                if (!this.gameOver && !this.isMoving && this.adj[this.currentNode].includes(n.id)) {
                  circle.setScale(1.2);
                  this.tweens.add({
                    targets: circle,
                    scale: 1.3,
                    yoyo: true,
                    repeat: -1,
                    duration: 400
                  });
                }
              });
              circle.on('pointerout', () => {
                circle.setScale(1);
                this.tweens.killTweensOf(circle);
              });
            }

            this.nodeObjects.push(circle);

            circle.on('pointerdown', () => {
              if (this.gameOver || this.isMoving) return;
              if (!this.adj[this.currentNode].includes(n.id)) return;

              this.isMoving = true;
              this.currentNode = n.id;
              this.moves++;
              component.moves.set(this.moves);
              this.updateHighlights();

              // Digital ripple effect on click
              const ripple = this.add.circle(n.x, n.y, 10, 0x38bdf8).setStrokeStyle(2, 0x7dd3fc);
              ripple.setFillStyle(); // Transparent fill
              this.tweens.add({
                targets: ripple,
                radius: 40,
                alpha: 0,
                duration: 500,
                onComplete: () => ripple.destroy()
              });

              this.tweens.add({
                targets: this.packet,
                x: n.x,
                y: n.y,
                duration: 350,
                ease: 'Sine.easeInOut',
                onComplete: () => {
                  this.isMoving = false;
                  this.checkWinLose();
                },
              });
            });
          });

          // Add pulsing target
          this.tweens.add({
            targets: this.nodeObjects[this.levelConfig.end],
            scale: 1.1,
            alpha: 0.8,
            yoyo: true,
            repeat: -1,
            duration: 800
          });

          // Packet
          this.packet = this.add.circle(this.nodesData[this.levelConfig.start].x, this.nodesData[this.levelConfig.start].y, 8, 0x38bdf8).setDepth(10);

          // Generate texture for particles if not exists
          if (!this.textures.exists('flare')) {
            const g = this.add.graphics();
            g.fillStyle(0xffffff, 1);
            g.fillCircle(4, 4, 4);
            g.generateTexture('flare', 8, 8);
            g.destroy();
          }
          this.particles.startFollow(this.packet);

          // Data flow pulses
          this.time.addEvent({
            delay: 1500,
            callback: this.spawnDataPulses,
            callbackScope: this,
            loop: true
          });

          this.updateHighlights();
        }

        drawEdges() {
          this.edgesGraphics.clear();
          this.edgesGraphics.lineStyle(2, 0x1e293b);
          this.levelConfig.edges.forEach(([u, v]) => {
            this.edgesGraphics.lineBetween(this.nodesData[u].x, this.nodesData[u].y, this.nodesData[v].x, this.nodesData[v].y);
          });
        }

        updateHighlights() {
          this.glowGraphics.clear();
          if (this.gameOver) return;

          // Draw glowing lines to valid neighbors
          this.glowGraphics.lineStyle(4, 0x0ea5e9, 0.4);
          this.adj[this.currentNode].forEach((neighbor: number) => {
            this.glowGraphics.lineBetween(
              this.nodesData[this.currentNode].x,
              this.nodesData[this.currentNode].y,
              this.nodesData[neighbor].x,
              this.nodesData[neighbor].y
            );
          });
        }

        spawnDataPulses() {
          if (this.gameOver) return;
          // Pick a random edge to pulse
          const edge = Phaser.Utils.Array.GetRandom(this.levelConfig.edges);
          if (!edge) return;

          const u = this.nodesData[edge[0]];
          const v = this.nodesData[edge[1]];

          const pulse = this.add.circle(u.x, u.y, 4, 0x7dd3fc).setDepth(2);
          this.tweens.add({
            targets: pulse,
            x: v.x,
            y: v.y,
            duration: 800,
            ease: 'Linear',
            onComplete: () => pulse.destroy()
          });
        }

        checkWinLose() {
          if (this.currentNode === this.levelConfig.end) {
            this.gameOver = true;
            this.glowGraphics.clear();

            // Calculate stars
            let earnedStars = 1;
            if (this.moves <= this.levelConfig.optimalMoves) earnedStars = 3;
            else if (this.moves <= this.levelConfig.optimalMoves + 2) earnedStars = 2;

            component.stars.set(earnedStars);
            component.gameState.set('LEVEL_COMPLETE');

            // Victory explosion
            const victoryEmitter = this.add.particles(this.packet.x, this.packet.y, 'flare', {
              speed: { min: 100, max: 200 },
              angle: { min: 0, max: 360 },
              scale: { start: 0.8, end: 0 },
              blendMode: 'ADD',
              tint: 0x34d399,
              lifespan: 1000,
              quantity: 30
            });
            victoryEmitter.explode(30);

          } else if (this.moves >= this.maxMoves) {
            this.gameOver = true;
            this.glowGraphics.clear();
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
        backgroundColor: '#0f172a',
        scene: MainScene,
      });

      // Pause the game instance until a level is selected
      this.game.scene.stop('MainScene');
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
      this.gameState.set('MENU');
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

  ngOnDestroy() {
    if (this.game) {
      this.game.destroy(true);
    }
  }
}
