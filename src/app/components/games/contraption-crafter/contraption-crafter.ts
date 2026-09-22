import { Component, ElementRef, ViewChild, PLATFORM_ID, inject, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-contraption-crafter',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './contraption-crafter.html',
  styleUrl: './contraption-crafter.scss'
})
export class ContraptionCrafter implements AfterViewInit, OnDestroy {
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
        backgroundColor: '#0f172a',
        physics: {
          default: 'matter',
          matter: {
            gravity: { x: 0, y: 1 },
            debug: true // using matter debug for now as we don't have sprites
          }
        },
        scene: {
          create: function (this: any) {
            const centerX = this.cameras.main.width / 2;

            this.add.text(centerX, 50, 'Contraption Crafter', {
              fontFamily: 'monospace',
              fontSize: '32px',
              color: '#38bdf8'
            }).setOrigin(0.5);

            this.add.text(centerX, 100, 'Guide the ball into the green bucket using physics bodies.', {
              fontFamily: 'monospace',
              fontSize: '16px',
              color: '#94a3b8'
            }).setOrigin(0.5);

            // Ground
            this.matter.add.rectangle(centerX, 580, 800, 40, { isStatic: true });

            // Bucket
            this.matter.add.rectangle(600, 500, 20, 100, { isStatic: true });
            this.matter.add.rectangle(700, 500, 20, 100, { isStatic: true });
            this.matter.add.rectangle(650, 550, 120, 20, { isStatic: true });

            // Ball
            const ball = this.matter.add.circle(100, 200, 20, { restitution: 0.9, density: 0.05 });

            // A draggable ramp
            const ramp = this.matter.add.rectangle(300, 400, 200, 20, { isStatic: true, angle: Math.PI / 8 });

            // Allow dragging physics bodies
            this.matter.add.mouseSpring();

            this.input.on('pointerdown', (pointer: any) => {
              // Only spawn if we didn't click on a body
              const bodies = this.matter.world.engine.world.bodies;
              const hit = this.matter.query.point(bodies, pointer);
              if (hit.length === 0) {
                // Spawn a new block
                const newBlock = this.matter.add.rectangle(pointer.x, pointer.y, 40, 40, { restitution: 0.5 });

                // Add a visual sprite/graphic so we can see it even without debug mode
                // Note: since we're using debug mode for now, we'll just let debug draw it
              }
            });
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
