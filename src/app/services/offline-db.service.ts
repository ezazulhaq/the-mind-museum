import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import sqlite3InitModule from '@sqlite.org/sqlite-wasm';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class OfflineDbService {
  private platformId = inject(PLATFORM_ID);
  private http = inject(HttpClient);

  private db: any = null;
  private isInitialized = false;

  async init() {
    if (!isPlatformBrowser(this.platformId)) return;
    if (this.isInitialized) return;

    try {
      const sqlite3 = await sqlite3InitModule();

      if ('opfs' in sqlite3) {
        this.db = new sqlite3.oo1.OpfsDb('/mind_museum_local.db');
        console.log('SQLite initialized with OPFS');
      } else {
        this.db = new sqlite3.oo1.DB('/mind_museum_local.db', 'c');
        console.log('SQLite initialized in memory (fallback)');
      }

      this.createTables();
      this.isInitialized = true;
    } catch (err) {
      console.error('Failed to initialize SQLite WASM', err);
    }
  }

  private createTables() {
    if (!this.db) return;
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS players (
        id TEXT PRIMARY KEY,
        username TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        synced INTEGER DEFAULT 0
      );
      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        player_id TEXT,
        game_id TEXT NOT NULL,
        duration_ms INTEGER NOT NULL,
        synced INTEGER DEFAULT 0,
        FOREIGN KEY(player_id) REFERENCES players(id)
      );
      CREATE TABLE IF NOT EXISTS telemetry (
        id TEXT PRIMARY KEY,
        session_id TEXT,
        metric_type TEXT NOT NULL,
        value NUMERIC NOT NULL,
        payload TEXT,
        synced INTEGER DEFAULT 0,
        FOREIGN KEY(session_id) REFERENCES sessions(id)
      );
      CREATE TABLE IF NOT EXISTS logic_errors (
        id TEXT PRIMARY KEY,
        session_id TEXT,
        gate_type TEXT NOT NULL,
        failed_state TEXT NOT NULL,
        synced INTEGER DEFAULT 0,
        FOREIGN KEY(session_id) REFERENCES sessions(id)
      );
    `);
  }

  generateId(): string {
    return crypto.randomUUID();
  }

  // --- Players ---
  async addPlayer(username: string): Promise<string> {
    await this.init();

    // Check for existing player
    const existing = this.db.exec({
      sql: 'SELECT id FROM players WHERE username = ? COLLATE NOCASE',
      bind: [username],
      returnValue: 'resultRows'
    });

    if (existing && existing.length > 0) {
      return existing[0][0]; // Return existing player ID
    }

    const id = this.generateId();
    this.db.exec({
      sql: 'INSERT INTO players (id, username, synced) VALUES (?, ?, 0)',
      bind: [id, username]
    });
    this.triggerSync();
    return id;
  }

  // --- Sessions ---
  async createSession(playerId: string, gameId: string, durationMs: number): Promise<string> {
    await this.init();
    const id = this.generateId();
    this.db.exec({
      sql: 'INSERT INTO sessions (id, player_id, game_id, duration_ms, synced) VALUES (?, ?, ?, ?, 0)',
      bind: [id, playerId, gameId, durationMs]
    });
    this.triggerSync();
    return id;
  }

  // --- Telemetry ---
  async logTelemetry(sessionId: string, metricType: string, value: number, payload: any) {
    await this.init();
    const id = this.generateId();
    this.db.exec({
      sql: 'INSERT INTO telemetry (id, session_id, metric_type, value, payload, synced) VALUES (?, ?, ?, ?, ?, 0)',
      bind: [id, sessionId, metricType, value, JSON.stringify(payload || {})]
    });
    this.triggerSync();
  }

  // --- Logic Errors ---
  async logLogicError(sessionId: string, gateType: string, failedState: string) {
    await this.init();
    const id = this.generateId();
    this.db.exec({
      sql: 'INSERT INTO logic_errors (id, session_id, gate_type, failed_state, synced) VALUES (?, ?, ?, ?, 0)',
      bind: [id, sessionId, gateType, failedState]
    });
    this.triggerSync();
  }

  // --- Sync Logic ---
  private async triggerSync() {
    if (!navigator.onLine) return;
    try {
      // 1. Get all unsynced data
      const unsyncedPlayers = this.db.exec({ sql: 'SELECT * FROM players WHERE synced = 0', returnValue: 'resultRows' });
      const unsyncedSessions = this.db.exec({ sql: 'SELECT * FROM sessions WHERE synced = 0', returnValue: 'resultRows' });
      const unsyncedTelemetry = this.db.exec({ sql: 'SELECT * FROM telemetry WHERE synced = 0', returnValue: 'resultRows' });
      const unsyncedLogicErrors = this.db.exec({ sql: 'SELECT * FROM logic_errors WHERE synced = 0', returnValue: 'resultRows' });

      if (unsyncedPlayers.length === 0 && unsyncedSessions.length === 0 && unsyncedTelemetry.length === 0 && unsyncedLogicErrors.length === 0) {
        return;
      }

      // 2. Send to server
      const payload = {
        players: unsyncedPlayers.map((r: any) => ({ id: r[0], username: r[1], created_at: r[2] })),
        sessions: unsyncedSessions.map((r: any) => ({ id: r[0], player_id: r[1], game_id: r[2], duration_ms: r[3] })),
        telemetry: unsyncedTelemetry.map((r: any) => ({ id: r[0], session_id: r[1], metric_type: r[2], value: r[3], payload: r[4] })),
        logic_errors: unsyncedLogicErrors.map((r: any) => ({ id: r[0], session_id: r[1], gate_type: r[2], failed_state: r[3] })),
      };

      await firstValueFrom(this.http.post('/api/sync', payload));

      // 3. Mark as synced
      this.db.exec('UPDATE players SET synced = 1 WHERE synced = 0');
      this.db.exec('UPDATE sessions SET synced = 1 WHERE synced = 0');
      this.db.exec('UPDATE telemetry SET synced = 1 WHERE synced = 0');
      this.db.exec('UPDATE logic_errors SET synced = 1 WHERE synced = 0');
    } catch (e) {
      console.warn('Sync failed, will retry later', e);
    }
  }

  // --- Analytics ---
  async getAnalytics() {
    await this.init();
    if (!this.db) return null;

    const totalSessions = this.db.exec({ sql: 'SELECT COUNT(*) FROM sessions', returnValue: 'resultRows' })[0][0];
    const totalPlayers = this.db.exec({ sql: 'SELECT COUNT(*) FROM players', returnValue: 'resultRows' })[0][0];
    const avgWpmRaw = this.db.exec({ sql: 'SELECT AVG(value) FROM telemetry WHERE metric_type = ?', bind: ['WPM'], returnValue: 'resultRows' });
    const avgAccuracyRaw = this.db.exec({ sql: 'SELECT AVG(value) FROM telemetry WHERE metric_type = ?', bind: ['ACCURACY'], returnValue: 'resultRows' });

    const sessionCountByGame = this.db.exec({
      sql: 'SELECT game_id, COUNT(*) as count, AVG(duration_ms) as avg_duration FROM sessions GROUP BY game_id',
      returnValue: 'resultRows'
    }).map((r: any) => ({ game_id: r[0], count: r[1], avg_duration: r[2] }));

    const recentTelemetry = this.db.exec({
      sql: 'SELECT t.metric_type, t.value, s.game_id FROM telemetry t JOIN sessions s ON t.session_id = s.id ORDER BY t.rowid DESC LIMIT 20',
      returnValue: 'resultRows'
    }).map((r: any) => ({ metric_type: r[0], value: r[1], game_id: r[2] }));

    const logicErrorsByGate = this.db.exec({
      sql: 'SELECT gate_type, COUNT(*) as count FROM logic_errors GROUP BY gate_type',
      returnValue: 'resultRows'
    }).map((r: any) => ({ gate_type: r[0], count: r[1] }));

    return {
      totalSessions,
      totalPlayers,
      avgWpm: avgWpmRaw[0] ? avgWpmRaw[0][0] || 0 : 0,
      avgAccuracy: avgAccuracyRaw[0] ? avgAccuracyRaw[0][0] || 0 : 0,
      sessionCountByGame,
      recentTelemetry,
      logicErrorsByGate
    };
  }
}
