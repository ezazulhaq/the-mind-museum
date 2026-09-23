import { Injectable, PLATFORM_ID, inject, signal, effect } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { OfflineDbService } from './offline-db.service';

export interface Player {
  id: string;
  name: string;
}

@Injectable({ providedIn: 'root' })
export class PlayerStateService {
  private platformId = inject(PLATFORM_ID);
  private offlineDb = inject(OfflineDbService);

  // Modern Signal-based state
  readonly player = signal<Player | null>(this.loadInitialPlayer());

  constructor() {
    // Automatically sync state changes to localStorage
    effect(() => {
      const p = this.player();
      if (isPlatformBrowser(this.platformId)) {
        if (p) {
          localStorage.setItem('mind_museum_player_id', p.id);
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
      return { id, name };
    }
    return null;
  }

  get playerId(): string | null {
    return this.player()?.id || null;
  }

  get playerName(): string | null {
    return this.player()?.name || null;
  }

  async setPlayer(name: string) {
    const id = await this.offlineDb.addPlayer(name);
    this.player.set({ id, name });
  }

  /** Creates a new session for a game and returns the session ID */
  async createSession(gameId: string, durationMs: number = 0): Promise<string> {
    const pId = this.playerId;
    if (!pId) return '';
    return await this.offlineDb.createSession(pId, gameId, durationMs);
  }

  /** Logs telemetry for a session */
  logTelemetry(sessionId: string, metricType: string, value: number, payload: any = {}) {
    if (!sessionId) return;
    this.offlineDb.logTelemetry(sessionId, metricType, value, payload);
  }

  /** Logs a logic error for a session */
  logLogicError(sessionId: string, gateType: string, failedState: string) {
    if (!sessionId) return;
    this.offlineDb.logLogicError(sessionId, gateType, failedState);
  }
}

