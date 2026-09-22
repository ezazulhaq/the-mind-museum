import { Component, OnInit, PLATFORM_ID, inject, ViewChild, ElementRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { DragDropModule, CdkDragDrop, moveItemInArray, copyArrayItem, transferArrayItem } from '@angular/cdk/drag-drop';

interface Command {
  id: string;
  type: 'MoveForward' | 'TurnRight' | 'TurnLeft';
  label: string;
}

@Component({
  selector: 'app-algorithmic-alchemist',
  standalone: true,
  imports: [CommonModule, DragDropModule],
  templateUrl: './algorithmic-alchemist.html',
  styleUrl: './algorithmic-alchemist.scss'
})
export class AlgorithmicAlchemist implements OnInit {
  @ViewChild('gameCanvas', { static: false }) canvasRef!: ElementRef<HTMLCanvasElement>;

  private platformId = inject(PLATFORM_ID);

  availableCommands: Command[] = [
    { id: 'c1', type: 'MoveForward', label: 'Move Forward' },
    { id: 'c2', type: 'TurnRight', label: 'Turn Right' },
    { id: 'c3', type: 'TurnLeft', label: 'Turn Left' }
  ];

  program: Command[] = [];
  trash: Command[] = [];

  gridSize = 5;
  cellSize = 50;

  player = { x: 0, y: 0, dir: 0 }; // dir: 0=right, 1=down, 2=left, 3=up
  target = { x: 4, y: 4 };

  isRunning = false;
  isSuccess = false;

  ngOnInit() {
    this.resetLevel();
  }

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.draw();
    }
  }

  resetLevel() {
    this.player = { x: 0, y: 0, dir: 0 };
    this.isRunning = false;
    this.isSuccess = false;
    if (this.canvasRef && isPlatformBrowser(this.platformId)) {
      this.draw();
    }
  }

  drop(event: CdkDragDrop<Command[]>) {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      if (event.previousContainer.id === 'toolbox') {
        // Copy from toolbox to program
        const item = event.previousContainer.data[event.previousIndex];
        const clone = { ...item, id: item.id + '-' + Date.now() };
        this.program.splice(event.currentIndex, 0, clone);
      } else {
        // Move within program or trash
        if (event.container.id === 'trash') {
          this.program.splice(event.previousIndex, 1);
        } else {
          transferArrayItem(
            event.previousContainer.data,
            event.container.data,
            event.previousIndex,
            event.currentIndex
          );
        }
      }
    }
  }

  trashDrop(event: CdkDragDrop<Command[]>) {
    if (event.previousContainer.id !== 'toolbox') {
      this.program.splice(event.previousIndex, 1);
    }
  }

  async runProgram() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.resetLevel();
    this.isRunning = true;

    for (const cmd of this.program) {
      await this.executeCommand(cmd);
      this.draw();
      await this.delay(400); // 400ms per step
    }

    if (this.player.x === this.target.x && this.player.y === this.target.y) {
      this.isSuccess = true;
    }
    this.isRunning = false;
  }

  executeCommand(cmd: Command): Promise<void> {
    return new Promise(resolve => {
      if (cmd.type === 'MoveForward') {
        if (this.player.dir === 0 && this.player.x < this.gridSize - 1) this.player.x++;
        if (this.player.dir === 1 && this.player.y < this.gridSize - 1) this.player.y++;
        if (this.player.dir === 2 && this.player.x > 0) this.player.x--;
        if (this.player.dir === 3 && this.player.y > 0) this.player.y--;
      } else if (cmd.type === 'TurnRight') {
        this.player.dir = (this.player.dir + 1) % 4;
      } else if (cmd.type === 'TurnLeft') {
        this.player.dir = (this.player.dir + 3) % 4;
      }
      resolve();
    });
  }

  delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  draw() {
    if (!this.canvasRef || !isPlatformBrowser(this.platformId)) return;
    const ctx = this.canvasRef.nativeElement.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, this.gridSize * this.cellSize, this.gridSize * this.cellSize);

    // Draw grid
    ctx.strokeStyle = '#334155';
    for (let i = 0; i <= this.gridSize; i++) {
      ctx.beginPath();
      ctx.moveTo(i * this.cellSize, 0);
      ctx.lineTo(i * this.cellSize, this.gridSize * this.cellSize);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i * this.cellSize);
      ctx.lineTo(this.gridSize * this.cellSize, i * this.cellSize);
      ctx.stroke();
    }

    // Draw target
    ctx.fillStyle = '#10b981';
    ctx.fillRect(this.target.x * this.cellSize + 5, this.target.y * this.cellSize + 5, this.cellSize - 10, this.cellSize - 10);

    // Draw player
    ctx.fillStyle = '#3b82f6';
    const px = this.player.x * this.cellSize + this.cellSize / 2;
    const py = this.player.y * this.cellSize + this.cellSize / 2;

    ctx.beginPath();
    ctx.arc(px, py, this.cellSize / 3, 0, 2 * Math.PI);
    ctx.fill();

    // Draw direction indicator
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(px, py);
    if (this.player.dir === 0) ctx.lineTo(px + 15, py);
    if (this.player.dir === 1) ctx.lineTo(px, py + 15);
    if (this.player.dir === 2) ctx.lineTo(px - 15, py);
    if (this.player.dir === 3) ctx.lineTo(px, py - 15);
    ctx.stroke();
  }
}
