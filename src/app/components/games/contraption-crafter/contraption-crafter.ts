import { Component, ElementRef, ViewChild, PLATFORM_ID, inject, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-contraption-crafter',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './contraption-crafter.html',
  styleUrl: './contraption-crafter.css'
})
export class ContraptionCrafter implements AfterViewInit, OnDestroy {
  @ViewChild('gameContainer') container!: ElementRef;

  private platformId = inject(PLATFORM_ID);
  private game: any;

  async ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      const Phaser = await import('phaser');

      class MainScene extends Phaser.Scene {
        private placedItems: any[] = [];
        private ball: any | null = null;
        private selectedItemType: string | null = null;
        private bucketSensor: any;
        private fans: any[] = [];
        private maxItems = 8;

        private uiGroup!: Phaser.GameObjects.Group;
        private statusText!: Phaser.GameObjects.Text;
        private winText!: Phaser.GameObjects.Text;
        private itemButtons: any[] = [];

        constructor() {
          super({ key: 'MainScene' });
        }

        create() {
          // Setup bucket
          this.matter.add.rectangle(620, 500, 10, 100, { isStatic: true }); // left wall
          this.matter.add.rectangle(780, 500, 10, 100, { isStatic: true }); // right wall
          this.matter.add.rectangle(700, 545, 150, 10, { isStatic: true }); // floor

          // Sensor for bucket to detect win
          this.bucketSensor = this.matter.add.rectangle(700, 500, 140, 80, {
            isStatic: true,
            isSensor: true,
            label: 'bucketSensor'
          });

          // Ground (fallback)
          this.matter.add.rectangle(400, 590, 800, 20, { isStatic: true });

          // Collision event
          this.matter.world.on('collisionstart', (event: any) => {
            event.pairs.forEach((pair: any) => {
              const { bodyA, bodyB } = pair;
              if (
                (bodyA.label === 'bucketSensor' && bodyB.label === 'ball') ||
                (bodyB.label === 'bucketSensor' && bodyA.label === 'ball')
              ) {
                this.winText.setVisible(true);
              }
            });
          });

          this.createUI();

          // Placement logic
          this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            // Ignore if clicking UI (top 100 pixels)
            if (pointer.y < 100) return;

            if (this.selectedItemType && this.placedItems.length < this.maxItems) {
              this.placeItem(this.selectedItemType, pointer.x, pointer.y);
            }
          });
        }

        override update() {
          if (this.ball && this.fans.length > 0) {
            this.fans.forEach(fan => {
              // Simple AABB check for fan zone
              const fanBounds = fan.getBounds();
              if (this.ball.position.x > fanBounds.x &&
                this.ball.position.x < fanBounds.x + fanBounds.width &&
                this.ball.position.y > fanBounds.y &&
                this.ball.position.y < fanBounds.y + fanBounds.height) {
                this.matter.body.applyForce(this.ball, this.ball.position, { x: 0, y: -0.005 });
              }
            });
          }
        }

        createUI() {
          this.uiGroup = this.add.group();

          // Top bar background
          const bg = this.add.rectangle(400, 40, 800, 80, 0x1e293b);
          bg.setDepth(10);
          this.uiGroup.add(bg);

          const createButton = (x: number, y: number, text: string, onClick: () => void, isItem = false) => {
            const btnBg = this.add.rectangle(x, y, 100, 30, 0x3b82f6).setInteractive().setDepth(11);
            const btnText = this.add.text(x, y, text, { fontSize: '16px', color: '#fff' }).setOrigin(0.5).setDepth(12);

            btnBg.on('pointerdown', onClick);

            const btn = { bg: btnBg, text: btnText, name: text };
            if (isItem) {
              this.itemButtons.push(btn);
            }
            return btn;
          };

          // Launch button
          createButton(70, 20, 'Launch', () => this.launchBall());

          // Reset button
          createButton(70, 60, 'Reset', () => this.resetLevel());

          // Inventory
          const startX = 220;
          createButton(startX, 40, 'Ramp', () => this.selectItem('Ramp'), true);
          createButton(startX + 110, 40, 'Bumper', () => this.selectItem('Bumper'), true);
          createButton(startX + 220, 40, 'Platform', () => this.selectItem('Platform'), true);
          createButton(startX + 330, 40, 'Fan', () => this.selectItem('Fan'), true);

          this.statusText = this.add.text(400, 85, 'Select an item to place (0/8)', { fontSize: '14px', color: '#cbd5e1' }).setOrigin(0.5).setDepth(12);

          this.winText = this.add.text(400, 300, 'Contraption Success!', {
            fontSize: '48px',
            color: '#4ade80',
            fontStyle: 'bold',
            stroke: '#000',
            strokeThickness: 6
          }).setOrigin(0.5).setDepth(20).setVisible(false);

          this.updateStatus();
        }

        selectItem(type: string) {
          this.selectedItemType = type;
          this.itemButtons.forEach(btn => {
            if (btn.name === type) {
              btn.bg.setFillStyle(0x2563eb);
            } else {
              btn.bg.setFillStyle(0x3b82f6);
            }
          });
          this.updateStatus();
        }

        placeItem(type: string, x: number, y: number) {
          let item;
          if (type === 'Ramp') {
            item = this.matter.add.rectangle(x, y, 150, 20, { isStatic: true, angle: Math.PI / 6 });
          } else if (type === 'Bumper') {
            item = this.matter.add.circle(x, y, 25, { isStatic: true, restitution: 1.2 });
          } else if (type === 'Platform') {
            item = this.matter.add.rectangle(x, y, 150, 20, { isStatic: true });
          } else if (type === 'Fan') {
            // Fan visually and functionally
            // A small base and a zone above it
            const base = this.matter.add.rectangle(x, y, 60, 20, { isStatic: true });

            // We use a Phaser Zone for the upward wind area
            const windZone = this.add.zone(x - 30, y - 150, 60, 150).setOrigin(0, 0);
            this.fans.push(windZone);

            // Group them to easily delete later
            item = { type: 'fan', base, windZone };
          }

          this.placedItems.push(item);
          this.updateStatus();
        }

        launchBall() {
          if (this.ball) {
            this.matter.world.remove(this.ball);
          }
          this.winText.setVisible(false);
          this.ball = this.matter.add.circle(50, 150, 15, {
            restitution: 0.6,
            density: 0.05,
            label: 'ball'
          });
        }

        resetLevel() {
          if (this.ball) {
            this.matter.world.remove(this.ball);
            this.ball = null;
          }

          this.placedItems.forEach(item => {
            if (item.type === 'fan') {
              this.matter.world.remove(item.base);
              item.windZone.destroy();
            } else {
              this.matter.world.remove(item);
            }
          });

          this.placedItems = [];
          this.fans = [];
          this.winText.setVisible(false);
          this.updateStatus();
        }

        updateStatus() {
          let text = `Placed: ${this.placedItems.length}/${this.maxItems}`;
          if (this.selectedItemType) {
            text = `Selected: ${this.selectedItemType} | ` + text;
          }
          if (this.statusText) {
            this.statusText.setText(text);
          }
        }
      }

      this.game = new Phaser.Game({
        parent: this.container.nativeElement,
        type: Phaser.AUTO,
        width: 800,
        height: 600,
        backgroundColor: '#0f172a',
        physics: {
          default: 'matter',
          matter: {
            gravity: { x: 0, y: 1 },
            debug: true
          }
        },
        scene: MainScene
      });
    }
  }

  ngOnDestroy() {
    if (this.game) {
      this.game.destroy(true);
    }
  }
}
