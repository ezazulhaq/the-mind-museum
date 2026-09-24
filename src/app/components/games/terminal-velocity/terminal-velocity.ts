import {
  Component,
  HostListener,
  OnInit,
  OnDestroy,
  inject,
  PLATFORM_ID,
  signal,
  effect,
  computed,
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
  gameState = signal<'MENU' | 'PLAYING' | 'GAMEOVER'>('MENU');
  currentDifficulty = signal<'EASY' | 'MEDIUM' | 'HARD'>('MEDIUM');

  private totalKeystrokes = 0;
  private correctKeystrokes = 0;
  private gameLoopId: any;
  private startTime: number = 0;

  private http = inject(HttpClient);
  private platformId = inject(PLATFORM_ID);
  private playerState = inject(PlayerStateService);

  private wordsLists = {
    EASY: ['cat', 'dog', 'tree', 'house', 'car', 'blue', 'red', 'sun', 'moon', 'star', 'bird', 'fish', 'book', 'shoe', 'pen', 'desk', 'door', 'wall', 'room', 'sky'],
    MEDIUM: ['apple', 'banana', 'orange', 'grapes', 'window', 'picture', 'country', 'planet', 'animal', 'garden', 'school', 'friend', 'family', 'summer', 'winter', 'spring', 'autumn', 'forest', 'ocean', 'river'],
    HARD: ['elephant', 'dinosaur', 'computer', 'television', 'university', 'restaurant', 'basketball', 'strawberry', 'watermelon', 'motorcycle', 'helicopter', 'butterfly', 'crocodile', 'astronaut', 'encyclopedia', 'chameleon', 'hippopotamus', 'rhinoceros']
  };

  private wordIdCounter = 0;

  activeKeys = signal<Set<string>>(new Set());

  keyboardRows = [
    ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
    ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';'],
    ['z', 'x', 'c', 'v', 'b', 'n', 'm']
  ];

  fingerKeys = {
    lp: ['q', 'a', 'z'], lr: ['w', 's', 'x'], lm: ['e', 'd', 'c'], li: ['r', 't', 'f', 'g', 'v', 'b'],
    ri: ['y', 'u', 'h', 'j', 'n', 'm'], rm: ['i', 'k'], rr: ['o', 'l'], rp: ['p', ';'],
    lt: [' '], rt: [' ']
  };

  fingerDefaultKeys = {
    lp: 'a', lr: 's', lm: 'd', li: 'f',
    ri: 'j', rm: 'k', rr: 'l', rp: ';',
    lt: ' ', rt: ' '
  };

  fingerColors = {
    lp: 'bg-rose-400', lr: 'bg-amber-400', lm: 'bg-yellow-400', li: 'bg-emerald-400',
    ri: 'bg-cyan-400', rm: 'bg-blue-400', rr: 'bg-indigo-400', rp: 'bg-fuchsia-400',
    lt: 'bg-slate-400', rt: 'bg-slate-400'
  };

  fingerPositions = signal<Record<string, { x: number, y: number, color: string }>>({});

  getFingersArray = computed(() => {
    const positions = this.fingerPositions();
    return Object.keys(positions).map(id => ({ id, ...positions[id] }));
  });

  constructor() {
    effect(() => {
      // Trigger effect on activeKeys or gameState changes
      this.activeKeys();
      const state = this.gameState();
      if (state === 'PLAYING') {
        setTimeout(() => this.updateFingerPositions(), 50);
      }
    });
  }

  getFingerZone(key: string): string {
    const k = key.toLowerCase();
    const active = this.activeKeys().has(k);

    let base = 'bg-slate-900/20 border-slate-700/50 text-slate-400';
    let activeStyle = '';

    if (['q', 'a', 'z'].includes(k)) {
      base = 'bg-slate-900/20 border-rose-500/30 text-rose-400';
      activeStyle = 'bg-rose-500/40 border-rose-400 text-white shadow-[0_0_15px_rgba(225,29,72,0.6)] translate-y-1 scale-95';
    } else if (['w', 's', 'x'].includes(k)) {
      base = 'bg-slate-900/20 border-amber-500/30 text-amber-400';
      activeStyle = 'bg-amber-500/40 border-amber-400 text-white shadow-[0_0_15px_rgba(245,158,11,0.6)] translate-y-1 scale-95';
    } else if (['e', 'd', 'c'].includes(k)) {
      base = 'bg-slate-900/20 border-yellow-500/30 text-yellow-400';
      activeStyle = 'bg-yellow-500/40 border-yellow-400 text-white shadow-[0_0_15px_rgba(234,179,8,0.6)] translate-y-1 scale-95';
    } else if (['r', 't', 'f', 'g', 'v', 'b'].includes(k)) {
      base = 'bg-slate-900/20 border-emerald-500/30 text-emerald-400';
      activeStyle = 'bg-emerald-500/40 border-emerald-400 text-white shadow-[0_0_15px_rgba(16,185,129,0.6)] translate-y-1 scale-95';
    } else if (['y', 'u', 'h', 'j', 'n', 'm'].includes(k)) {
      base = 'bg-slate-900/20 border-cyan-500/30 text-cyan-400';
      activeStyle = 'bg-cyan-500/40 border-cyan-400 text-white shadow-[0_0_15px_rgba(6,182,212,0.6)] translate-y-1 scale-95';
    } else if (['i', 'k'].includes(k)) {
      base = 'bg-slate-900/20 border-blue-500/30 text-blue-400';
      activeStyle = 'bg-blue-500/40 border-blue-400 text-white shadow-[0_0_15px_rgba(59,130,246,0.6)] translate-y-1 scale-95';
    } else if (['o', 'l'].includes(k)) {
      base = 'bg-slate-900/20 border-indigo-500/30 text-indigo-400';
      activeStyle = 'bg-indigo-500/40 border-indigo-400 text-white shadow-[0_0_15px_rgba(99,102,241,0.6)] translate-y-1 scale-95';
    } else if (['p', ';'].includes(k)) {
      base = 'bg-slate-900/20 border-fuchsia-500/30 text-fuchsia-400';
      activeStyle = 'bg-fuchsia-500/40 border-fuchsia-400 text-white shadow-[0_0_15px_rgba(217,70,239,0.6)] translate-y-1 scale-95';
    }

    return `transition-all duration-75 flex flex-col items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-lg border font-bold uppercase relative ${base} ${active ? activeStyle : ''}`;
  }

  isHomeRowKey(key: string): boolean {
    return ['a', 's', 'd', 'f', 'j', 'k', 'l', ';'].includes(key.toLowerCase());
  }

  @HostListener('window:resize')
  onResize() {
    this.updateFingerPositions();
  }

  updateFingerPositions() {
    if (!isPlatformBrowser(this.platformId)) return;

    const container = document.getElementById('keyboard-container');
    if (!container) return;
    const containerRect = container.getBoundingClientRect();

    const positions: Record<string, { x: number, y: number, color: string }> = {};
    const activeKeysSet = this.activeKeys();

    for (const [fingerId, keys] of Object.entries(this.fingerKeys)) {
      let targetKey = this.fingerDefaultKeys[fingerId as keyof typeof this.fingerDefaultKeys];

      for (const k of keys) {
        if (activeKeysSet.has(k)) {
          targetKey = k;
          break;
        }
      }

      const keyId = targetKey === ' ' ? 'key-space' : 'key-' + targetKey;
      const keyEl = document.getElementById(keyId);

      if (keyEl) {
        const rect = keyEl.getBoundingClientRect();
        let x = rect.left - containerRect.left + rect.width / 2;
        let y = rect.top - containerRect.top + rect.height / 2;

        if (fingerId === 'lt') x -= 30;
        if (fingerId === 'rt') x += 30;

        positions[fingerId] = {
          x,
          y,
          color: this.fingerColors[fingerId as keyof typeof this.fingerColors]
        };
      }
    }

    this.fingerPositions.set(positions);
  }

  ngOnInit() {
    this.gameState.set('MENU');
  }

  ngOnDestroy() {
    this.stopGame();
  }

  startGame(difficulty?: 'EASY' | 'MEDIUM' | 'HARD') {
    if (difficulty) {
      this.currentDifficulty.set(difficulty);
    }
    this.words.set([]);
    this.score.set(0);
    this.totalKeystrokes = 0;
    this.correctKeystrokes = 0;
    this.currentInput.set('');
    this.gameState.set('PLAYING');
    this.startTime = Date.now();

    if (isPlatformBrowser(this.platformId)) {
      this.spawnWord();
      this.gameLoopId = setInterval(() => this.gameLoop(), 50);
    }
  }

  goToMenu() {
    this.gameState.set('MENU');
    this.activeKeys.set(new Set());
    clearInterval(this.gameLoopId);
  }

  stopGame() {
    clearInterval(this.gameLoopId);
    if (this.gameState() === 'PLAYING' && isPlatformBrowser(this.platformId)) {
      this.endGame();
    }
  }

  spawnWord() {
    const difficulty = this.currentDifficulty();
    const list = this.wordsLists[difficulty];
    const text = list[Math.floor(Math.random() * list.length)];

    let baseSpeed = 0.1;
    let speedVariance = 0.2;
    if (difficulty === 'EASY') {
      baseSpeed = 0.05;
      speedVariance = 0.1;
    } else if (difficulty === 'HARD') {
      baseSpeed = 0.2;
      speedVariance = 0.3;
    }

    this.words.update((w) => [
      ...w,
      {
        id: this.wordIdCounter++,
        text,
        x: Math.random() * 80 + 10,
        y: 0,
        speed: baseSpeed + Math.random() * speedVariance,
      },
    ]);
  }

  gameLoop() {
    if (this.gameState() !== 'PLAYING') return;

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

    if (this.gameState() === 'PLAYING') {
      const difficulty = this.currentDifficulty();
      const spawnRate = difficulty === 'EASY' ? 0.015 : difficulty === 'HARD' ? 0.03 : 0.02;
      if (Math.random() < spawnRate) {
        this.spawnWord();
      }
    }
  }

  @HostListener('window:keyup', ['$event'])
  handleKeyUpEvent(event: KeyboardEvent) {
    if (this.gameState() !== 'PLAYING') return;
    const key = event.key.toLowerCase();
    this.activeKeys.update((set) => {
      const newSet = new Set(set);
      newSet.delete(key);
      return newSet;
    });
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if (this.gameState() !== 'PLAYING') return;

    if (event.ctrlKey || event.metaKey || event.altKey) return;

    const key = event.key.toLowerCase();
    if (key.length === 1 || key === ' ') {
      this.activeKeys.update((set) => {
        const newSet = new Set(set);
        newSet.add(key);
        return newSet;
      });
    }

    if (event.key === 'Backspace') {
      this.currentInput.update((val) => val.slice(0, -1));
      return;
    }

    if (event.key.length === 1) {
      this.currentInput.update((val) => val + event.key.toLowerCase());
      this.totalKeystrokes++;

      const input = this.currentInput();
      const matchIndex = this.words().findIndex((w) => w.text === input);

      if (matchIndex !== -1) {
        this.correctKeystrokes += input.length;
        const difficulty = this.currentDifficulty();
        const multiplier = difficulty === 'EASY' ? 10 : difficulty === 'HARD' ? 20 : 15;
        this.score.update((s) => s + this.words()[matchIndex].text.length * multiplier);
        this.words.update((w) => {
          const arr = [...w];
          arr.splice(matchIndex, 1);
          return arr;
        });
        this.currentInput.set('');
      } else {
        const isPrefix = this.words().some((w) => w.text.startsWith(input));
        if (!isPrefix) {
          // Apply penalty for incorrect typing
          const difficulty = this.currentDifficulty();
          const penalty = difficulty === 'EASY' ? 5 : difficulty === 'HARD' ? 15 : 10;
          this.score.update((s) => s - penalty);

          this.currentInput.set('');
        }
      }
    }
  }

  async endGame() {
    this.gameState.set('GAMEOVER');
    this.activeKeys.set(new Set());
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
