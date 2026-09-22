import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class PlayerStateService {
  private platformId = inject(PLATFORM_ID);
  private http = inject(HttpClient);

  get playerId(): number | null {
    if (!isPlatformBrowser(this.platformId)) return null;
    const id = localStorage.getItem('mind_museum_player_id');
    return id ? parseInt(id, 10) : null;
  }

  get playerName(): string | null {
    if (!isPlatformBrowser(this.platformId)) return null;
    return localStorage.getItem('mind_museum_player_name');
  }

  setPlayer(id: number, name: string) {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('mind_museum_player_id', id.toString());
      localStorage.setItem('mind_museum_player_name', name);
    }
  }

  /** Creates a new session for a game and returns the session ID */
  async createSession(gameId: string, durationMs: number = 0): Promise<number> {
    return new Promise((resolve, reject) => {
      this.http.post<{ success: boolean; id: number }>('/api/sessions', {
        player_id: this.playerId || 1,
        game_id: gameId,
        duration_ms: durationMs
      }).subscribe({
        next: (res) => resolve(Number(res.id)),
        error: (err) => { console.error('Failed to create session', err); resolve(1); }
      });
    });
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

