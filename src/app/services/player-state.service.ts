import { Injectable, PLATFORM_ID, inject, signal, effect } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export interface Player {
  id: number;
  name: string;
}

@Injectable({ providedIn: 'root' })
export class PlayerStateService {
  private platformId = inject(PLATFORM_ID);
  private http = inject(HttpClient);

  // Modern Signal-based state
  readonly player = signal<Player | null>(this.loadInitialPlayer());

  constructor() {
    // Automatically sync state changes to localStorage
    effect(() => {
      const p = this.player();
      if (isPlatformBrowser(this.platformId)) {
        if (p) {
          localStorage.setItem('mind_museum_player_id', p.id.toString());
          localStorage.setItem('mind_museum_player_name', p.name);
        } else {
          localStorage.removeItem('mind_museum_player_id');
          localStorage.removeItem('mind_museum_player_name');
        }
      }
    });
  }

  private loadInitialPlayer(): Player | null {
    if (!isPlatformBrowser(this.platformId)) return null;
    const id = localStorage.getItem('mind_museum_player_id');
    const name = localStorage.getItem('mind_museum_player_name');
    if (id && name) {
      return { id: parseInt(id, 10), name };
    }
    return null;
  }

  get playerId(): number | null {
    return this.player()?.id || null;
  }

  get playerName(): string | null {
    return this.player()?.name || null;
  }

  setPlayer(id: number, name: string) {
    this.player.set({ id, name });
  }

  /** Creates a new session for a game and returns the session ID */
  async createSession(gameId: string, durationMs: number = 0): Promise<number> {
    try {
      const res = await firstValueFrom(
        this.http.post<{ success: boolean; id: number }>('/api/sessions', {
          player_id: this.playerId || 1,
          game_id: gameId,
          duration_ms: durationMs
        })
      );
      return Number(res.id);
    } catch (err) {
      console.error('Failed to create session', err);
      return 1;
    }
  }

  /** Logs telemetry for a session */
  logTelemetry(sessionId: number, metricType: string, value: number, payload: any = {}) {
    this.http.post('/api/telemetry', {
      session_id: sessionId,
      metric_type: metricType,
      value,
      payload
    }).subscribe({
      error: (err) => console.error('Failed to log telemetry', err)
    });
  }

  /** Logs a logic error for a session */
  logLogicError(sessionId: number, gateType: string, failedState: string) {
    this.http.post('/api/logic-errors', {
      session_id: sessionId,
      gate_type: gateType,
      failed_state: failedState
    }).subscribe({
      error: (err) => console.error('Failed to log logic error', err)
    });
  }
}

