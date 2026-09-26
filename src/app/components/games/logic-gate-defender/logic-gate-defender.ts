import {
  Component,
  ElementRef,
  ViewChild,
  PLATFORM_ID,
  inject,
  AfterViewInit,
  OnDestroy,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { PlayerStateService } from '../../../services/player-state.service';

import { GameLayout } from '../../game-layout/game-layout';

@Component({
  selector: 'app-logic-gate-defender',
  standalone: true,
  imports: [GameLayout],
  templateUrl: './logic-gate-defender.html',
  styleUrl: './logic-gate-defender.css',
})
export class LogicGateDefender implements AfterViewInit, OnDestroy {
  @ViewChild('gameContainer') container!: ElementRef;

  private platformId = inject(PLATFORM_ID);
  private http = inject(HttpClient);
  private playerState = inject(PlayerStateService);
  private game: any;

  async ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      const Phaser = await import('phaser');
      const playerService = this.playerState;
      const sessionId = await playerService.createSession('logic-gate-defender', 0);

      class MainScene extends Phaser.Scene {
        baseHealth = 5;
        wave = 1;
        score = 0;
        bits = 100;
        maxWaves = 5;
        enemiesPerWave = 5;
        enemiesSpawned = 0;

        enemies!: Phaser.GameObjects.Group;
        towerSlots: Phaser.GameObjects.Rectangle[] = [];
        selectedGate: string | null = null;

        healthText!: Phaser.GameObjects.Text;
        waveText!: Phaser.GameObjects.Text;
        scoreText!: Phaser.GameObjects.Text;
        bitsText!: Phaser.GameObjects.Text;
        statusText!: Phaser.GameObjects.Text;

        spawnTimer!: Phaser.Time.TimerEvent;
        isGameOver = false;

        gateCosts: { [key: string]: number } = {
          'AND': 20,
          'OR': 20,
          'NOR': 20,
          'XOR': 30,
          'NAND': 30
        };

        constructor() {
          super({ key: 'MainScene' });
        }

        create() {
          this.baseHealth = 5;
          this.wave = 1;
          this.score = 0;
          this.bits = 100;
          this.enemiesSpawned = 0;
          this.isGameOver = false;
          this.towerSlots = [];

          // Draw Lane
          this.add.rectangle(400, 300, 800, 40, 0x334155);

          // Draw Base
          this.add.rectangle(750, 300, 60, 100, 0xef4444);
          this.add
            .text(750, 230, 'BASE', { color: '#ef4444', fontSize: '20px', fontFamily: 'monospace' })
            .setOrigin(0.5);

          // UI
          this.healthText = this.add.text(20, 20, `Health: ${this.baseHealth}`, {
            fontSize: '24px',
            color: '#fff',
            fontFamily: 'monospace',
          });
          this.waveText = this.add.text(20, 50, `Wave: ${this.wave}/${this.maxWaves}`, {
            fontSize: '24px',
            color: '#fff',
            fontFamily: 'monospace',
          });
          this.scoreText = this.add.text(20, 80, `Score: ${this.score}`, {
            fontSize: '24px',
            color: '#fff',
            fontFamily: 'monospace',
          });
          this.bitsText = this.add.text(20, 110, `Bits: ${this.bits}`, {
            fontSize: '24px',
            color: '#fbbf24',
            fontFamily: 'monospace',
          });
          this.statusText = this.add
            .text(400, 150, '', { fontSize: '32px', color: '#fff', fontFamily: 'monospace' })
            .setOrigin(0.5);

          // Tower Slots
          const positions = [200, 400, 600];
          positions.forEach((x, index) => {
            const slot = this.add.rectangle(x, 300, 50, 50, 0x64748b).setInteractive();
            slot.setData('hasGate', false);
            slot.setData('gateType', null);
            slot.setData('index', index);
            slot.setData('durability', 0);

            this.add
              .text(x, 350, 'SLOT', { fontSize: '14px', color: '#cbd5e1', fontFamily: 'monospace' })
              .setOrigin(0.5);

            slot.on('pointerdown', () => {
              if (this.selectedGate && !slot.getData('hasGate')) {
                const cost = this.gateCosts[this.selectedGate];
                if (this.bits >= cost) {
                  this.bits -= cost;
                  this.bitsText.setText(`Bits: ${this.bits}`);

                  slot.setData('hasGate', true);
                  slot.setData('gateType', this.selectedGate);
                  slot.setData('durability', 3);
                  slot.setFillStyle(0x3b82f6);

                  const t = this.add
                    .text(x, 300, this.selectedGate, {
                      fontSize: '16px',
                      color: '#ffffff',
                      fontStyle: 'bold',
                      fontFamily: 'monospace',
                    })
                    .setOrigin(0.5);
                  slot.setData('textObj', t);

                  const durT = this.add
                    .text(x, 260, 'Uses: 3', {
                      fontSize: '14px',
                      color: '#10b981',
                      fontFamily: 'monospace',
                    })
                    .setOrigin(0.5);
                  slot.setData('durabilityTextObj', durT);

                  this.selectedGate = null;
                  this.statusText.setText('');
                } else {
                  this.statusText.setText('Not enough Bits!');
                  this.time.delayedCall(1000, () => {
                    if (this.statusText.text === 'Not enough Bits!') this.statusText.setText('');
                  });
                }
              }
            });
            this.towerSlots.push(slot);
          });

          // Gate Selection Buttons
          const createBtn = (x: number, y: number, type: string) => {
            const btn = this.add.rectangle(x, y, 80, 50, 0x0ea5e9).setInteractive();
            this.add
              .text(x, y - 10, type, { fontSize: '18px', color: '#fff', fontFamily: 'monospace', fontStyle: 'bold' })
              .setOrigin(0.5);
            this.add
              .text(x, y + 10, `${this.gateCosts[type]} Bits`, { fontSize: '12px', color: '#fbbf24', fontFamily: 'monospace' })
              .setOrigin(0.5);

            btn.on('pointerdown', () => {
              this.selectedGate = type;
              this.statusText.setText(`Selected: ${type}`);
            });
          };

          createBtn(160, 500, 'AND');
          createBtn(280, 500, 'OR');
          createBtn(400, 500, 'NOR');
          createBtn(520, 500, 'XOR');
          createBtn(640, 500, 'NAND');

          this.enemies = this.add.group();
          this.startWave();
        }

        startWave() {
          this.enemiesSpawned = 0;
          this.spawnTimer = this.time.addEvent({
            delay: Math.max(800, 2000 - (this.wave * 200)),
            callback: this.spawnEnemy,
            callbackScope: this,
            repeat: this.enemiesPerWave - 1,
          });
        }

        spawnEnemy() {
          if (this.isGameOver) return;
          this.enemiesSpawned++;

          const signals = [
            { a: true, b: true, text: 'TT' },
            { a: true, b: false, text: 'TF' },
            { a: false, b: true, text: 'FT' },
            { a: false, b: false, text: 'FF' },
          ];
          const type = Phaser.Utils.Array.GetRandom(signals);

          const enemy = this.add.circle(0, 300, 15, 0xf59e0b) as any;
          const label = this.add
            .text(0, 300, type.text, {
              fontSize: '14px',
              color: '#000',
              fontStyle: 'bold',
              fontFamily: 'monospace',
            })
            .setOrigin(0.5) as any;

          enemy.signalA = type.a;
          enemy.signalB = type.b;
          enemy.labelObj = label;
          enemy.stateText = type.text;
          enemy.lastSlotIndex = -1;

          this.enemies.add(enemy);
        }

        override update(time: number, delta: number) {
          if (this.isGameOver) return;

          const speed = (100 + (this.wave * 15)) * (delta / 1000);
          const enemiesToDestroy: any[] = [];

          this.enemies.getChildren().forEach((child: any) => {
            child.x += speed;
            child.labelObj.x = child.x;

            // Check if passed a tower
            this.towerSlots.forEach((slot, index) => {
              if (child.x >= slot.x && child.lastSlotIndex < index) {
                child.lastSlotIndex = index;

                if (slot.getData('hasGate')) {
                  const gateType = slot.getData('gateType');
                  let destroyed = false;
                  if (gateType === 'AND') {
                    if (child.signalA && child.signalB) destroyed = true;
                  } else if (gateType === 'OR') {
                    if (child.signalA || child.signalB) destroyed = true;
                  } else if (gateType === 'NOR') {
                    if (!child.signalA && !child.signalB) destroyed = true;
                  } else if (gateType === 'XOR') {
                    if (child.signalA !== child.signalB) destroyed = true;
                  } else if (gateType === 'NAND') {
                    if (!(child.signalA && child.signalB)) destroyed = true;
                  }

                  if (destroyed) {
                    this.score += 10;
                    this.bits += 10;
                    this.scoreText.setText(`Score: ${this.score}`);
                    this.bitsText.setText(`Bits: ${this.bits}`);
                    enemiesToDestroy.push(child);

                    let dur = slot.getData('durability');
                    dur--;
                    if (dur <= 0) {
                      slot.setData('hasGate', false);
                      slot.setData('gateType', null);
                      slot.setFillStyle(0x64748b);
                      slot.getData('textObj').destroy();
                      slot.getData('durabilityTextObj').destroy();
                    } else {
                      slot.setData('durability', dur);
                      slot.getData('durabilityTextObj').setText(`Uses: ${dur}`);
                    }
                  } else {
                    // Gate failed to stop enemy
                    playerService.logLogicError(sessionId, gateType, child.stateText);
                  }
                }
              }
            });

            // Check if reached base
            if (child.x >= 720 && !enemiesToDestroy.includes(child)) {
              this.baseHealth--;
              this.healthText.setText(`Health: ${this.baseHealth}`);
              enemiesToDestroy.push(child);

              if (this.baseHealth <= 0) {
                this.gameOver(false);
              }
            }
          });

          enemiesToDestroy.forEach((e) => {
            e.labelObj.destroy();
            this.enemies.remove(e, true, true);
          });

          if (
            this.enemiesSpawned === this.enemiesPerWave &&
            this.enemies.getLength() === 0 &&
            !this.isGameOver
          ) {
            if (this.wave >= this.maxWaves) {
              this.gameOver(true);
            } else {
              this.wave++;
              this.enemiesPerWave += 2;
              this.waveText.setText(`Wave: ${this.wave}/${this.maxWaves}`);
              this.startWave();
            }
          }
        }

        gameOver(win: boolean) {
          this.isGameOver = true;
          this.statusText.setText(win ? 'YOU WIN!' : 'GAME OVER');
          this.statusText.setColor(win ? '#10b981' : '#ef4444');
          if (this.spawnTimer) {
            this.spawnTimer.remove();
          }
        }
      }

      this.game = new Phaser.Game({
        parent: this.container.nativeElement,
        type: Phaser.AUTO,
        width: 800,
        height: 600,
        backgroundColor: '#1e293b',
        scene: MainScene,
      });
    }
  }

  ngOnDestroy() {
    if (this.game) {
      this.game.destroy(true);
    }
  }
}
