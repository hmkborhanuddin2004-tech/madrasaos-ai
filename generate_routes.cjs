const fs = require('fs');
const path = require('path');

function writeFile(relPath, content) {
    const absPath = path.join(__dirname, relPath);
    const dir = path.dirname(absPath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(absPath, content.trim() + '\n', 'utf8');
    console.log(`Wrote ${relPath}`);
}

// Routes
writeFile('server/src/routes/automationRoutes.ts', `
import express from 'express';
import { globalRegistry } from '../services/automations/registry';
import { AutomationContext } from '../services/automations/context';
import { ConsoleSms, BulkSmsBD, NoSms } from '../services/sms/smsGateway';
import { getDb } from '../db/database';

const router = express.Router();

router.get('/status', (req, res) => {
  const mods = globalRegistry.listAll();
  res.json(mods);
});

router.post('/run/:key', async (req, res) => {
  const key = req.params.key;
  const params = req.body || {};
  const db = await getDb();
  
  // get config
  const settings = await db.all('SELECT * FROM institution_settings');
  const config = settings.reduce((acc, row) => {
    acc[row.setting_key] = row.setting_value;
    return acc;
  }, {} as any);

  let smsGw = new NoSms();
  if (config.sms_gateway === 'bulk_sms_bd') {
    smsGw = new BulkSmsBD(config.bulk_sms_api_key, config.bulk_sms_sender_id);
  } else if (config.sms_gateway === 'console') {
    smsGw = new ConsoleSms();
  }

  const dryRun = params.dry_run === true;
  const ctx = new AutomationContext(db, smsGw, config, dryRun);

  try {
    const result = await globalRegistry.runOne(key, ctx, params);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/logs', async (req, res) => {
  const db = await getDb();
  const logs = await db.all('SELECT * FROM automation_logs ORDER BY started_at DESC LIMIT 50');
  res.json(logs);
});

export const automationRoutes = router;
`);

// Patch schema
const schemaPath = path.join(__dirname, 'server/src/db/schema.ts');
let schemaContent = fs.readFileSync(schemaPath, 'utf8');
if (!schemaContent.includes('automation_logs')) {
    const tableSql = `
    CREATE TABLE IF NOT EXISTS automation_logs (
      id TEXT PRIMARY KEY,
      key TEXT NOT NULL,
      started_at TEXT NOT NULL,
      finished_at TEXT,
      ok INTEGER DEFAULT 1,
      processed INTEGER DEFAULT 0,
      created INTEGER DEFAULT 0,
      sent INTEGER DEFAULT 0,
      failed INTEGER DEFAULT 0,
      messages TEXT DEFAULT '[]',
      data TEXT DEFAULT '{}'
    );
`;
    // Find the end of initializeDatabase and inject
    schemaContent = schemaContent.replace(/await db\.run\(`([^`]+)`\);/g, (match, p1) => {
        if (p1.includes('CREATE TABLE IF NOT EXISTS users')) {
            return `await db.exec(\`${p1}\n${tableSql}\`);`; // using exec for multiple if they were combined, but let's just append run
        }
        return match;
    });
    // Alternative:
    schemaContent = schemaContent.replace(/(await db.run\(`\s*CREATE TABLE IF NOT EXISTS users[^`]+`\);)/, `$1\n    await db.run(\`${tableSql}\`);`);
    fs.writeFileSync(schemaPath, schemaContent);
    console.log('Patched schema.ts');
}

// Patch index.ts
const indexPath = path.join(__dirname, 'server/src/index.ts');
let indexContent = fs.readFileSync(indexPath, 'utf8');
if (!indexContent.includes('automationRoutes')) {
    indexContent = indexContent.replace("import express from 'express';", "import express from 'express';\nimport { automationRoutes } from './routes/automationRoutes';");
    indexContent = indexContent.replace("app.use('/api/v1/users', userRoutes);", "app.use('/api/v1/users', userRoutes);\napp.use('/api/v1/automation', automationRoutes);");
    fs.writeFileSync(indexPath, indexContent);
    console.log('Patched index.ts');
}
