import { Component, HostListener, OnInit, OnDestroy, inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';

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
  imports: [CommonModule],
  templateUrl: './terminal-velocity.html',
  styleUrl: './terminal-velocity.scss'
})
export class TerminalVelocity implements OnInit, OnDestroy {
  words: Word[] = [];
  currentInput = '';
  score = 0;
  totalKeystrokes = 0;
  correctKeystrokes = 0;
  gameOver = false;
  gameLoopId: any;
  startTime: number = 0;

  private http = inject(HttpClient);
  private platformId = inject(PLATFORM_ID);
  private wordsList = ['angular', 'component', 'observable', 'service', 'module', 'directive', 'pipe', 'template', 'router', 'interface'];
  private wordIdCounter = 0;

  ngOnInit() {
    this.startGame();
  }

  ngOnDestroy() {
    this.stopGame();
  }

  startGame() {
    this.words = [];
    this.score = 0;
    this.totalKeystrokes = 0;
    this.correctKeystrokes = 0;
    this.currentInput = '';
    this.gameOver = false;
    this.startTime = Date.now();

    if (isPlatformBrowser(this.platformId)) {
      this.spawnWord();
      this.gameLoopId = setInterval(() => this.gameLoop(), 50);
    }
  }

  stopGame() {
    clearInterval(this.gameLoopId);
    if (!this.gameOver) {
      this.endGame();
    }
  }

  spawnWord() {
    const text = this.wordsList[Math.floor(Math.random() * this.wordsList.length)];
    this.words.push({
      id: this.wordIdCounter++,
      text,
      x: Math.random() * 80 + 10, // 10% to 90% width
      y: 0,
      speed: 0.1 + Math.random() * 0.2 // 0.1 to 0.3 % per frame
    });
  }

  gameLoop() {
    if (this.gameOver) return;

    // Update positions
    for (let i = this.words.length - 1; i >= 0; i--) {
      this.words[i].y += this.words[i].speed;

      // If a word hits the bottom, game over!
      if (this.words[i].y > 90) {
        this.endGame();
        return;
      }
    }

    // Spawn new words occasionally
    if (Math.random() < 0.02) {
      this.spawnWord();
    }
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if (this.gameOver) return;

    // Ignore meta keys
    if (event.ctrlKey || event.metaKey || event.altKey) return;

    if (event.key === 'Backspace') {
      this.currentInput = this.currentInput.slice(0, -1);
      return;
    }

    if (event.key.length === 1) { // Normal character
      this.currentInput += event.key;
      this.totalKeystrokes++;

      // Check if current input matches any word
      const matchIndex = this.words.findIndex(w => w.text === this.currentInput);

      if (matchIndex !== -1) {
        // Word typed correctly
        this.correctKeystrokes += this.currentInput.length;
        this.score += this.words[matchIndex].text.length * 10;
        this.words.splice(matchIndex, 1);
        this.currentInput = '';
      } else {
        // Check if current input is at least a prefix of any word
        const isPrefix = this.words.some(w => w.text.startsWith(this.currentInput));
        if (!isPrefix) {
          // Reset if we made a mistake and it's not matching anything
          // Simple penalty: reset input
          this.currentInput = '';
        }
      }
    }
  }

  endGame() {
    this.gameOver = true;
    clearInterval(this.gameLoopId);

    const durationMins = (Date.now() - this.startTime) / 60000;
    const wpm = durationMins > 0 ? (this.correctKeystrokes / 5) / durationMins : 0;
    const accuracy = this.totalKeystrokes > 0 ? (this.correctKeystrokes / this.totalKeystrokes) * 100 : 0;

    console.log(`Game Over! Score: ${this.score}, WPM: ${Math.round(wpm)}, Acc: ${Math.round(accuracy)}%`);

    // Log telemetry
    this.http.post('/api/telemetry', {
      session_id: 1, // Mock session ID for MVP
      metric_type: 'WPM',
      value: Math.round(wpm),
      payload: {
        score: this.score,
        accuracy: Math.round(accuracy),
        duration_s: Math.round(durationMins * 60)
      }
    }).subscribe({
      error: (e) => console.error('Failed to log telemetry', e)
    });
  }

  trackByFn(index: number, item: Word) {
    return item.id;
  }

  getTypedPart(word: string): string {
    if (this.currentInput.length > 0 && word.startsWith(this.currentInput)) {
      return this.currentInput;
    }
    return '';
  }

  getUntypedPart(word: string): string {
    if (this.currentInput.length > 0 && word.startsWith(this.currentInput)) {
      return word.slice(this.currentInput.length);
    }
    return word;
  }
}
