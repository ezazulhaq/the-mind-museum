process.env['PORT'] = process.env['PORT'] || '3000';
process.env['pm_id'] = process.env['pm_id'] || '1';
await import('./dist/mind-museum/server/server.mjs');
