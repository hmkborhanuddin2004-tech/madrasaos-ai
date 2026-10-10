import { app } from './app.js';
import { initializeDatabase } from './db/schema.js';
import { seedDatabase } from './db/seed.js';
import { startScheduler } from './services/automations/scheduler.js';
import { AutomationContext } from './services/automations/context.js';
import { db } from './db/db.js';
import { ConsoleSms, BulkSmsBD, NoSms } from './services/sms/smsGateway.js';

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    console.log('[MadrasaOS AI] Initializing Relational Database Schema...');
    await initializeDatabase();
    
    console.log('[MadrasaOS AI] Seeding Demo Madrasa Data (100+ students, realistic records)...');
    await seedDatabase();

    
    console.log('[MadrasaOS AI] Starting Automation Scheduler...');
    const settings = await db.all('SELECT * FROM institution_settings');
    const config = settings.reduce((acc: any, row: any) => {
      acc[row.setting_key] = row.setting_value;
      return acc;
    }, {});
    
    let smsGw = new NoSms();
    if (config.sms_gateway === 'bulk_sms_bd') {
      smsGw = new BulkSmsBD(config.bulk_sms_api_key, config.bulk_sms_sender_id);
    } else if (config.sms_gateway === 'console') {
      smsGw = new ConsoleSms();
    }
    
    const ctx = new AutomationContext(db, smsGw, config, false);
    startScheduler(ctx);
    
    app.listen(Number(PORT), '0.0.0.0', () => {
      console.log(`[MadrasaOS AI] Server running smoothly at http://127.0.0.1:${PORT}`);
      console.log(`[MadrasaOS AI] Health Check: http://127.0.0.1:${PORT}/health`);
      console.log(`[MadrasaOS AI] API Endpoint: http://127.0.0.1:${PORT}/api/v1`);
    });
  } catch (err) {
    console.error('[MadrasaOS AI] Fatal Error during server bootstrap:', err);
    process.exit(1);
  }
}

if (process.env.NODE_ENV !== 'test') {
  startServer();
}
