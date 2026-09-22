import { Component, ElementRef, ViewChild, PLATFORM_ID, inject, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-node-network',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './node-network.html',
  styleUrl: './node-network.css'
})
export class NodeNetwork implements AfterViewInit, OnDestroy {
  @ViewChild('gameContainer') container!: ElementRef;

  private platformId = inject(PLATFORM_ID);
  private game: any = null;

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
          create: function (this: any) {
            const scene = this;
            const centerX = scene.cameras.main.width / 2;

            scene.add.text(centerX, 30, 'Node Network', {
              fontFamily: 'monospace', fontSize: '32px', color: '#38bdf8'
            }).setOrigin(0.5);

            let moves = 0;
            const maxMoves = 10;
            let currentNode = 7;
            const destId = 28;
            let gameOver = false;
            let isMoving = false;

            const moveText = scene.add.text(centerX, 570, `Moves: ${moves} / ${maxMoves}`, {
              fontFamily: 'monospace', fontSize: '24px', color: '#facc15'
            }).setOrigin(0.5);

            const statusText = scene.add.text(centerX, 300, '', {
              fontFamily: 'monospace', fontSize: '40px', color: '#ffffff',
              backgroundColor: '#000000', padding: { x: 20, y: 20 }
            }).setOrigin(0.5).setDepth(10).setVisible(false);

            // Sparse edges mapping the 6x6 grid
            const edges = [
              [7, 8], [7, 13], [8, 9], [9, 10], [10, 16],
              [8, 14], [13, 19], [19, 25], [25, 26], [26, 32],
              [14, 15], [15, 16], [15, 21], [21, 27], [21, 22],
              [22, 28], [27, 28], [27, 33], [22, 23], [16, 17]
            ];

            const adj: { [key: number]: number[] } = {};
            for (let i = 0; i < 36; i++) adj[i] = [];
            edges.forEach(([u, v]) => {
              adj[u].push(v);
              adj[v].push(u);
            });

            const nodesData: any[] = [];
            for (let i = 0; i < 36; i++) {
              const c = i % 6;
              const r = Math.floor(i / 6);
              // Nodes arranged in a grid with 90px spacing
              nodesData.push({ id: i, x: 175 + c * 90, y: 75 + r * 90 });
            }

            const graphics = scene.add.graphics();
            graphics.lineStyle(3, 0x334155);
            edges.forEach(([u, v]) => {
              graphics.lineBetween(nodesData[u].x, nodesData[u].y, nodesData[v].x, nodesData[v].y);
            });

            const nodeObjects: any[] = [];
            let packet: any;

            const updateHighlights = () => {
              nodeObjects.forEach((c) => c.setStrokeStyle()); // Clear existing stroke
              if (gameOver || isMoving) return;
              
              adj[currentNode].forEach((neighbor: number) => {
                nodeObjects[neighbor].setStrokeStyle(3, 0xffffff); // Highlight connected
              });
            };

            const checkWinLose = () => {
              if (currentNode === destId) {
                gameOver = true;
                statusText.setText('Route Complete!');
                statusText.setColor('#10b981');
                statusText.setVisible(true);
                updateHighlights();
              } else if (moves >= maxMoves) {
                gameOver = true;
                statusText.setText('Too many hops!');
                statusText.setColor('#ef4444');
                statusText.setVisible(true);
                updateHighlights();
              } else {
                updateHighlights();
              }
            };

            nodesData.forEach(n => {
              let color = 0x475569; // default gray
              if (n.id === 7) color = 0x3b82f6; // source blue
              if (n.id === destId) color = 0x10b981; // dest green
              
              const circle = scene.add.circle(n.x, n.y, 20, color);
              circle.setInteractive();
              nodeObjects.push(circle);

              circle.on('pointerdown', () => {
                if (gameOver || isMoving) return;
                if (!adj[currentNode].includes(n.id)) return; // Validate connected move
                
                isMoving = true;
                currentNode = n.id;
                moves++;
                moveText.setText(`Moves: ${moves} / ${maxMoves}`);
                updateHighlights(); // Clear highlights during move
                
                scene.tweens.add({
                  targets: packet,
                  x: n.x,
                  y: n.y,
                  duration: 250,
                  onComplete: () => {
                    isMoving = false;
                    checkWinLose();
                  }
                });
              });
            });

            packet = scene.add.circle(nodesData[7].x, nodesData[7].y, 10, 0xfacc15).setDepth(5);
            updateHighlights();
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
