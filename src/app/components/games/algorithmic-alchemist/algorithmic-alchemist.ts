import {
  Component,
  OnInit,
  PLATFORM_ID,
  inject,
  ViewChild,
  ElementRef,
  signal,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import {
  DragDropModule,
  CdkDragDrop,
  moveItemInArray,
  copyArrayItem,
  transferArrayItem,
} from '@angular/cdk/drag-drop';

interface Command {
  id: string;
  type: 'MoveForward' | 'TurnRight' | 'TurnLeft' | 'Repeat3' | 'IfWall';
  label: string;
}

import { GameLayout } from '../../game-layout/game-layout';

@Component({
  selector: 'app-algorithmic-alchemist',
  standalone: true,
  imports: [DragDropModule, GameLayout],
  templateUrl: './algorithmic-alchemist.html',
  styleUrl: './algorithmic-alchemist.css',
})
export class AlgorithmicAlchemist implements OnInit {
  @ViewChild('gameCanvas', { static: false }) canvasRef!: ElementRef<HTMLCanvasElement>;

  private platformId = inject(PLATFORM_ID);

  availableCommands: Command[] = [
    { id: 'c1', type: 'MoveForward', label: '⬆ Move Forward' },
    { id: 'c2', type: 'TurnRight', label: '↻ Turn Right' },
    { id: 'c3', type: 'TurnLeft', label: '↺ Turn Left' },
    { id: 'c4', type: 'Repeat3', label: '🔁 Repeat ×3' },
    { id: 'c5', type: 'IfWall', label: '🧱 If Wall → Turn' },
  ];

  program = signal<Command[]>([]);
  trash = signal<Command[]>([]);

  gridSize = 5;
  cellSize = 50;

  player = { x: 0, y: 0, dir: 0 };
  target = { x: 4, y: 4 };

  isRunning = signal(false);
  isSuccess = signal(false);

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
    this.isRunning.set(false);
    this.isSuccess.set(false);
    if (this.canvasRef && isPlatformBrowser(this.platformId)) {
      this.draw();
    }
  }

  drop(event: CdkDragDrop<Command[]>) {
    const data = [...this.program()];

    if (event.previousContainer === event.container) {
      moveItemInArray(data, event.previousIndex, event.currentIndex);
      this.program.set(data);
    } else {
      if (event.previousContainer.id === 'toolbox') {
        const item = event.previousContainer.data[event.previousIndex];
        const clone = { ...item, id: item.id + '-' + Date.now() };
        data.splice(event.currentIndex, 0, clone);
        this.program.set(data);
      } else {
        if (event.container.id === 'trash') {
          data.splice(event.previousIndex, 1);
          this.program.set(data);
        } else {
          // Both are same type for this simple array management
          const prevData = [...event.previousContainer.data];
          transferArrayItem(prevData, data, event.previousIndex, event.currentIndex);
          // Wait, CdkDragDrop modifies data directly if we let it.
          // We must update the signal array manually.
          this.program.set(data);
        }
      }
    }
  }

  trashDrop(event: CdkDragDrop<Command[]>) {
    if (event.previousContainer.id !== 'toolbox') {
      const data = [...this.program()];
      data.splice(event.previousIndex, 1);
      this.program.set(data);
    }
  }

  async runProgram() {
    if (this.isRunning()) return;
    this.isRunning.set(true);
    this.resetLevel();
    this.isRunning.set(true);

    const expanded: Command[] = [];
    const prog = this.program();
    for (let i = 0; i < prog.length; i++) {
      const cmd = prog[i];
      if (cmd.type === 'Repeat3') {
        const next = prog[i + 1];
        if (next && next.type !== 'Repeat3' && next.type !== 'IfWall') {
          for (let r = 0; r < 3; r++) expanded.push(next);
          i++;
        }
      } else {
        expanded.push(cmd);
      }
    }

    for (const cmd of expanded) {
      await this.executeCommand(cmd);
      this.draw();
      await this.delay(400);
    }

    if (this.player.x === this.target.x && this.player.y === this.target.y) {
      this.isSuccess.set(true);
    }
    this.isRunning.set(false);
  }

  executeCommand(cmd: Command): Promise<void> {
    return new Promise((resolve) => {
      if (cmd.type === 'MoveForward') {
        if (this.player.dir === 0 && this.player.x < this.gridSize - 1) this.player.x++;
        if (this.player.dir === 1 && this.player.y < this.gridSize - 1) this.player.y++;
        if (this.player.dir === 2 && this.player.x > 0) this.player.x--;
        if (this.player.dir === 3 && this.player.y > 0) this.player.y--;
      } else if (cmd.type === 'TurnRight') {
        this.player.dir = (this.player.dir + 1) % 4;
      } else if (cmd.type === 'TurnLeft') {
        this.player.dir = (this.player.dir + 3) % 4;
      } else if (cmd.type === 'IfWall') {
        // If facing a wall, turn right automatically
        const facingWall =
          (this.player.dir === 0 && this.player.x >= this.gridSize - 1) ||
          (this.player.dir === 1 && this.player.y >= this.gridSize - 1) ||
          (this.player.dir === 2 && this.player.x <= 0) ||
          (this.player.dir === 3 && this.player.y <= 0);
        if (facingWall) {
          this.player.dir = (this.player.dir + 1) % 4;
        }
      }
      resolve();
    });
  }

  delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
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
    ctx.fillRect(
      this.target.x * this.cellSize + 5,
      this.target.y * this.cellSize + 5,
      this.cellSize - 10,
      this.cellSize - 10,
    );

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
