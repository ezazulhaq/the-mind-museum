import {
  Component,
  HostListener,
  OnInit,
  OnDestroy,
  inject,
  PLATFORM_ID,
  signal,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { PlayerStateService } from '../../../services/player-state.service';

interface Word {
  id: number;
  text: string;
  x: number;
  y: number;
  speed: number;
}

@Component({
  selector: 'app-terminal-velocity',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './terminal-velocity.html',
  styleUrl: './terminal-velocity.css',
})
export class TerminalVelocity implements OnInit, OnDestroy {
  words = signal<Word[]>([]);
  currentInput = signal<string>('');
  score = signal<number>(0);
  gameOver = signal<boolean>(false);

  private totalKeystrokes = 0;
  private correctKeystrokes = 0;
  private gameLoopId: any;
  private startTime: number = 0;

  private http = inject(HttpClient);
  private platformId = inject(PLATFORM_ID);
  private playerState = inject(PlayerStateService);
  private wordsList = [
    'angular',
    'component',
    'observable',
    'service',
    'module',
    'directive',
    'pipe',
    'template',
    'router',
    'interface',
  ];
  private wordIdCounter = 0;

  ngOnInit() {
    this.startGame();
  }

  ngOnDestroy() {
    this.stopGame();
  }

  startGame() {
    this.words.set([]);
    this.score.set(0);
    this.totalKeystrokes = 0;
    this.correctKeystrokes = 0;
    this.currentInput.set('');
    this.gameOver.set(false);
    this.startTime = Date.now();

    if (isPlatformBrowser(this.platformId)) {
      this.spawnWord();
      this.gameLoopId = setInterval(() => this.gameLoop(), 50);
    }
  }

  stopGame() {
    clearInterval(this.gameLoopId);
    if (!this.gameOver() && isPlatformBrowser(this.platformId)) {
      this.endGame();
    }
  }

  spawnWord() {
    const text = this.wordsList[Math.floor(Math.random() * this.wordsList.length)];
    this.words.update((w) => [
      ...w,
      {
        id: this.wordIdCounter++,
        text,
        x: Math.random() * 80 + 10,
        y: 0,
        speed: 0.1 + Math.random() * 0.2,
      },
    ]);
  }

  gameLoop() {
    if (this.gameOver()) return;

    this.words.update((currentWords) => {
      let isOver = false;
      const newWords = currentWords.map((w) => {
        const nextY = w.y + w.speed;
        if (nextY > 90) {
          isOver = true;
        }
        return { ...w, y: nextY };
      });

      if (isOver) {
        setTimeout(() => this.endGame(), 0);
      }
      return newWords;
    });

    if (!this.gameOver() && Math.random() < 0.02) {
      this.spawnWord();
    }
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if (this.gameOver()) return;

    if (event.ctrlKey || event.metaKey || event.altKey) return;

    if (event.key === 'Backspace') {
      this.currentInput.update((val) => val.slice(0, -1));
      return;
    }

    if (event.key.length === 1) {
      this.currentInput.update((val) => val + event.key);
      this.totalKeystrokes++;

      const input = this.currentInput();
      const matchIndex = this.words().findIndex((w) => w.text === input);

      if (matchIndex !== -1) {
        this.correctKeystrokes += input.length;
        this.score.update((s) => s + this.words()[matchIndex].text.length * 10);
        this.words.update((w) => {
          const arr = [...w];
          arr.splice(matchIndex, 1);
          return arr;
        });
        this.currentInput.set('');
      } else {
        const isPrefix = this.words().some((w) => w.text.startsWith(input));
        if (!isPrefix) {
          this.currentInput.set('');
        }
      }
    }
  }

  async endGame() {
    this.gameOver.set(true);
    clearInterval(this.gameLoopId);

    const durationMs = Date.now() - this.startTime;
    const durationMins = durationMs / 60000;
    const wpm = durationMins > 0 ? this.correctKeystrokes / 5 / durationMins : 0;
    const accuracy =
      this.totalKeystrokes > 0 ? (this.correctKeystrokes / this.totalKeystrokes) * 100 : 0;

    console.log(
      `Game Over! Score: ${this.score()}, WPM: ${Math.round(wpm)}, Acc: ${Math.round(accuracy)}%`,
    );

    const sessionId = await this.playerState.createSession('terminal-velocity', durationMs);
    this.playerState.logTelemetry(sessionId, 'WPM', Math.round(wpm), {
      score: this.score(),
      accuracy: Math.round(accuracy),
      duration_s: Math.round(durationMs / 1000),
    });
    this.playerState.logTelemetry(sessionId, 'ACCURACY', Math.round(accuracy));
  }

  trackByFn(index: number, item: Word) {
    return item.id;
  }

  getTypedPart(word: string): string {
    const input = this.currentInput();
    if (input.length > 0 && word.startsWith(input)) {
      return input;
    }
    return '';
  }

  getUntypedPart(word: string): string {
    const input = this.currentInput();
    if (input.length > 0 && word.startsWith(input)) {
      return word.slice(input.length);
    }
    return word;
  }
}
