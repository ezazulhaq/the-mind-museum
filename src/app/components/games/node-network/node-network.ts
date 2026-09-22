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
          preload: function(this: any) {
            // No assets for now, we'll draw shapes
          },
          create: function(this: any) {
            const centerX = this.cameras.main.width / 2;
            const centerY = this.cameras.main.height / 2;
            
            this.add.text(centerX, 50, 'Node Network', {
              fontFamily: 'monospace',
              fontSize: '32px',
              color: '#38bdf8'
            }).setOrigin(0.5);

            // Draw a simple network
            const graphics = this.add.graphics({ lineStyle: { width: 2, color: 0x334155 } });
            
            const nodes = [
              { x: centerX - 200, y: centerY },
              { x: centerX, y: centerY - 150 },
              { x: centerX, y: centerY + 150 },
              { x: centerX + 200, y: centerY }
            ];

            // Edges
            graphics.strokeLineShape(new Phaser.Geom.Line(nodes[0].x, nodes[0].y, nodes[1].x, nodes[1].y));
            graphics.strokeLineShape(new Phaser.Geom.Line(nodes[0].x, nodes[0].y, nodes[2].x, nodes[2].y));
            graphics.strokeLineShape(new Phaser.Geom.Line(nodes[1].x, nodes[1].y, nodes[3].x, nodes[3].y));
            graphics.strokeLineShape(new Phaser.Geom.Line(nodes[2].x, nodes[2].y, nodes[3].x, nodes[3].y));

            // Nodes
            nodes.forEach((n, i) => {
              const circle = this.add.circle(n.x, n.y, 25, i === 0 ? 0x3b82f6 : (i === 3 ? 0x10b981 : 0x475569));
              circle.setInteractive();
              circle.on('pointerdown', () => {
                this.tweens.add({
                  targets: circle,
                  scale: 1.2,
                  yoyo: true,
                  duration: 100
                });
              });
            });

            this.add.text(centerX, this.cameras.main.height - 50, 'Route the packet from Blue to Green. (Click nodes to test)', {
              fontFamily: 'monospace',
              fontSize: '16px',
              color: '#94a3b8'
            }).setOrigin(0.5);
          },
          update: function() {
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
