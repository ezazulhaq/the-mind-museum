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
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_id INTEGER,
    game_id TEXT NOT NULL,
    duration_ms INTEGER NOT NULL,
    FOREIGN KEY(player_id) REFERENCES players(id)
  );
  CREATE TABLE IF NOT EXISTS telemetry (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id INTEGER,
    metric_type TEXT NOT NULL,
    value NUMERIC NOT NULL,
    payload TEXT,
    FOREIGN KEY(session_id) REFERENCES sessions(id)
  );
  CREATE TABLE IF NOT EXISTS logic_errors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id INTEGER,
    gate_type TEXT NOT NULL,
    failed_state TEXT NOT NULL,
    FOREIGN KEY(session_id) REFERENCES sessions(id)
  );
`);

app.use(express.json());

app.post('/api/telemetry', (req, res) => {
  const { session_id, metric_type, value, payload } = req.body;
  try {
    const stmt = db.prepare('INSERT INTO telemetry (session_id, metric_type, value, payload) VALUES (?, ?, ?, ?)');
    const info = stmt.run(session_id, metric_type, value, JSON.stringify(payload || {}));
    res.json({ success: true, id: info.lastInsertRowid });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/sessions', (req, res) => {
  const { player_id, game_id, duration_ms } = req.body;
  try {
    const stmt = db.prepare('INSERT INTO sessions (player_id, game_id, duration_ms) VALUES (?, ?, ?)');
    const info = stmt.run(player_id, game_id, duration_ms);
    res.json({ success: true, id: info.lastInsertRowid });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/players', (req, res) => {
  const { username } = req.body;
  try {
    const stmt = db.prepare('INSERT INTO players (username) VALUES (?)');
    const info = stmt.run(username);
    res.json({ success: true, id: info.lastInsertRowid });
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
