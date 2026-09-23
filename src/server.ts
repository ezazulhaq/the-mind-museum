import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { join } from 'node:path';
import Database from 'better-sqlite3';

const browserDistFolder = join(import.meta.dirname, '../browser');

const app = express();
const angularApp = new AngularNodeAppEngine();

// Initialize SQLite Database
const db = new Database('mind_museum.db');
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS players (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    synced INTEGER DEFAULT 1
  );
  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    player_id TEXT,
    game_id TEXT NOT NULL,
    duration_ms INTEGER NOT NULL,
    synced INTEGER DEFAULT 1,
    FOREIGN KEY(player_id) REFERENCES players(id)
  );
  CREATE TABLE IF NOT EXISTS telemetry (
    id TEXT PRIMARY KEY,
    session_id TEXT,
    metric_type TEXT NOT NULL,
    value NUMERIC NOT NULL,
    payload TEXT,
    synced INTEGER DEFAULT 1,
    FOREIGN KEY(session_id) REFERENCES sessions(id)
  );
  CREATE TABLE IF NOT EXISTS logic_errors (
    id TEXT PRIMARY KEY,
    session_id TEXT,
    gate_type TEXT NOT NULL,
    failed_state TEXT NOT NULL,
    synced INTEGER DEFAULT 1,
    FOREIGN KEY(session_id) REFERENCES sessions(id)
  );
`);

app.use(express.json());

app.post('/api/sync', (req, res) => {
  const { players, sessions, telemetry, logic_errors } = req.body;
  
  try {
    const insertPlayer = db.prepare('INSERT OR REPLACE INTO players (id, username, created_at, synced) VALUES (?, ?, ?, 1)');
    const insertSession = db.prepare('INSERT OR REPLACE INTO sessions (id, player_id, game_id, duration_ms, synced) VALUES (?, ?, ?, ?, 1)');
    const insertTelemetry = db.prepare('INSERT OR REPLACE INTO telemetry (id, session_id, metric_type, value, payload, synced) VALUES (?, ?, ?, ?, ?, 1)');
    const insertLogicError = db.prepare('INSERT OR REPLACE INTO logic_errors (id, session_id, gate_type, failed_state, synced) VALUES (?, ?, ?, ?, 1)');
    
    db.transaction(() => {
      for (const p of players || []) insertPlayer.run(p.id, p.username, p.created_at);
      for (const s of sessions || []) insertSession.run(s.id, s.player_id, s.game_id, s.duration_ms);
      for (const t of telemetry || []) insertTelemetry.run(t.id, t.session_id, t.metric_type, t.value, JSON.stringify(t.payload));
      for (const l of logic_errors || []) insertLogicError.run(l.id, l.session_id, l.gate_type, l.failed_state);
    })();
    
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Serve static files from /browser
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

/**
 * Handle all other requests by rendering the Angular application.
 */
app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then((response) => (response ? writeResponseToNodeResponse(response, res) : next()))
    .catch(next);
});

/**
 * Start the server if this module is the main entry point, or it is ran via PM2.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
 */
if (isMainModule(import.meta.url) || process.env['pm_id']) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, (error) => {
    if (error) {
      throw error;
    }

    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

/**
 * Request handler used by the Angular CLI (for dev-server and during build) or Firebase Cloud Functions.
 */
export const reqHandler = createNodeRequestHandler(app);
