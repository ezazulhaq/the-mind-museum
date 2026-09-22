import { Component, ElementRef, ViewChild, PLATFORM_ID, inject, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-node-network',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './node-network.html',
  styleUrl: './node-network.scss'
})
export class NodeNetwork implements AfterViewInit, OnDestroy {
  @ViewChild('gameContainer') container!: ElementRef;

  private platformId = inject(PLATFORM_ID);
  private game: any; // Type as any to avoid SSR issues if types aren't available

  async ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      const Phaser = await import('phaser');

      this.game = new Phaser.Game({
        parent: this.container.nativeElement,
        type: Phaser.AUTO,
        width: 800,
        height: 600,
        backgroundColor: '#0f172a',
        scene: {
          preload: function (this: any) {
            // No assets for now, we'll draw shapes
          },
          create: function (this: any) {
            const centerX = this.cameras.main.width / 2;
            const centerY = this.cameras.main.height / 2;

            this.add.text(centerX, 50, 'Node Network', {
              fontFamily: 'monospace',
              fontSize: '32px',
              color: '#38bdf8'
            }).setOrigin(0.5);

            // Nodes and Edges
            const nodes = [
              { id: 0, x: centerX - 200, y: centerY, obj: null as any },
              { id: 1, x: centerX, y: centerY - 150, obj: null as any },
              { id: 2, x: centerX, y: centerY + 150, obj: null as any },
              { id: 3, x: centerX + 200, y: centerY, obj: null as any }
            ];

            const edges = [
              { from: 0, to: 1 },
              { from: 0, to: 2 },
              { from: 1, to: 3 },
              { from: 2, to: 3 }
            ];

            const graphics = this.add.graphics({ lineStyle: { width: 2, color: 0x334155 } });

            const drawEdges = () => {
              graphics.clear();
              graphics.lineStyle(2, 0x334155);
              edges.forEach(e => {
                graphics.strokeLineShape(new Phaser.Geom.Line(
                  nodes[e.from].obj.x, nodes[e.from].obj.y,
                  nodes[e.to].obj.x, nodes[e.to].obj.y
                ));
              });
            };

            nodes.forEach((n, i) => {
              const circle = this.add.circle(n.x, n.y, 25, i === 0 ? 0x3b82f6 : (i === 3 ? 0x10b981 : 0x475569));
              n.obj = circle;
              circle.setInteractive({ draggable: true });

              circle.on('pointerdown', () => {
                this.tweens.add({ targets: circle, scale: 1.2, yoyo: true, duration: 100 });
              });

              circle.on('drag', (pointer: any, dragX: number, dragY: number) => {
                circle.x = dragX;
                circle.y = dragY;
                drawEdges(); // Redraw lines when dragging
              });
            });

            // Initial draw
            drawEdges();

            this.add.text(centerX, this.cameras.main.height - 50, 'Route the packet from Blue to Green. (Click nodes to test)', {
              fontFamily: 'monospace',
              fontSize: '16px',
              color: '#94a3b8'
            }).setOrigin(0.5);
          },
          update: function () {
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
