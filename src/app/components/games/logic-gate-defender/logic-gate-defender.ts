import { Component, ElementRef, ViewChild, PLATFORM_ID, inject, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-logic-gate-defender',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './logic-gate-defender.html',
  styleUrl: './logic-gate-defender.scss'
})
export class LogicGateDefender implements AfterViewInit, OnDestroy {
  @ViewChild('gameContainer') container!: ElementRef;

  private platformId = inject(PLATFORM_ID);
  private game: any;

  async ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      const Phaser = await import('phaser');

      this.game = new Phaser.Game({
        parent: this.container.nativeElement,
        type: Phaser.AUTO,
        width: 800,
        height: 600,
        backgroundColor: '#1e293b',
        scene: {
          preload: function (this: any) {
          },
          create: function (this: any) {
            const centerX = this.cameras.main.width / 2;

            this.add.text(centerX, 50, 'Logic Gate Defender', {
              fontFamily: 'monospace',
              fontSize: '32px',
              color: '#ef4444'
            }).setOrigin(0.5);

            this.add.text(centerX, this.cameras.main.height - 50, 'Defend the core using AND / OR / NOT gates', {
              fontFamily: 'monospace',
              fontSize: '16px',
              color: '#94a3b8'
            }).setOrigin(0.5);

            // Draw a base
            const base = this.add.rectangle(centerX, this.cameras.main.height / 2, 80, 80, 0xef4444);

            // Draw some incoming enemies
            const e1 = this.add.circle(100, 100, 15, 0x10b981);
            const e2 = this.add.circle(700, 100, 15, 0x10b981);

            this.tweens.add({
              targets: [e1, e2],
              x: centerX,
              y: this.cameras.main.height / 2,
              duration: 3000,
              yoyo: true,
              repeat: -1
            });

            // Add Draggable Gates
            const addGate = (x: number, y: number, text: string) => {
              const gate = this.add.container(x, y);
              const bg = this.add.rectangle(0, 0, 60, 40, 0x3b82f6);
              const label = this.add.text(0, 0, text, { fontFamily: 'monospace', fontSize: '14px', color: '#fff' }).setOrigin(0.5);
              gate.add([bg, label]);

              gate.setSize(60, 40);
              gate.setInteractive({ draggable: true });

              gate.on('drag', (pointer: any, dragX: number, dragY: number) => {
                gate.x = dragX;
                gate.y = dragY;
              });
            };

            addGate(centerX - 100, this.cameras.main.height - 100, 'AND');
            addGate(centerX, this.cameras.main.height - 100, 'OR');
            addGate(centerX + 100, this.cameras.main.height - 100, 'NOT');
          }
        }
      });
    }
  }

  ngOnDestroy() {
    if (this.game) {
      this.game.destroy(true);
    }
  }
}
