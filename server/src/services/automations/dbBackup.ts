import { randomUUID } from 'crypto';
import { AutomationContext } from './context.js';
import { AutomationModule } from './result.js';
import fs from 'fs';
import path from 'path';

export const dbBackup: AutomationModule = {
  key: 'db_backup',
  name: 'Database Backup',
  cron: '0 2 * * *',
  priority: 70,
  run: async (ctx: AutomationContext) => {
    const backupDir = ctx.config.backup_dir || path.join(process.cwd(), 'backups');
    if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });

    const timestamp = Date.now();
    const dbPath = path.join(process.cwd(), 'data', 'madrasa.sqlite'); // Assuming this path
    const backupPath = path.join(backupDir, `db_${timestamp}.sqlite`);
    
    let ok = 1;
    let message = 'Backup successful';
    let size = 0;
    try {
      if (fs.existsSync(dbPath)) {
        fs.copyFileSync(dbPath, backupPath);
        size = fs.statSync(backupPath).size;
      } else {
         ok = 0;
         message = 'DB file not found';
      }
    } catch(err: any) {
      ok = 0;
      message = err.message;
    }

    // Clean old
    const keepDays = parseInt(ctx.config.backup_keep_days || '14', 10);
    const cutoff = Date.now() - (keepDays * 24 * 60 * 60 * 1000);
    const files = fs.readdirSync(backupDir);
    for (const f of files) {
      if (f.startsWith('db_') && f.endsWith('.sqlite')) {
        const p = path.join(backupDir, f);
        const stats = fs.statSync(p);
        if (stats.mtimeMs < cutoff) {
          fs.unlinkSync(p);
        }
      }
    }

    const id = require('crypto').randomUUID();
    // Assuming backup_logs table exists or creating inline (as per schema update)
    await ctx.db.run(`
      CREATE TABLE IF NOT EXISTS backup_logs (
        id TEXT PRIMARY KEY,
        path TEXT,
        size_bytes INTEGER,
        ok INTEGER,
        message TEXT,
        created_at TEXT
      )
    `);
    await ctx.db.run(
      'INSERT INTO backup_logs (id, path, size_bytes, ok, message, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      [id, backupPath, size, ok, message, new Date().toISOString()]
    );

    return { ok: ok === 1, processed: 1, data: { size, path: backupPath, message } };
  }
};
