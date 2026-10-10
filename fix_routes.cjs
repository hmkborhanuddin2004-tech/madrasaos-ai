const fs = require('fs');
const path = require('path');

// 1. Mount route in server/src/routes/index.ts
const routesIndexPath = path.join(__dirname, 'server/src/routes/index.ts');
let routesContent = fs.readFileSync(routesIndexPath, 'utf8');
if (!routesContent.includes('automationRoutes')) {
    routesContent = routesContent.replace("import { backupRoutes } from './backupRoutes.js';", "import { backupRoutes } from './backupRoutes.js';\nimport { automationRoutes } from './automationRoutes.js';");
    routesContent = routesContent.replace("router.use('/backup', backupRoutes);", "router.use('/backup', backupRoutes);\nrouter.use('/automation', automationRoutes);");
    fs.writeFileSync(routesIndexPath, routesContent);
}

// 2. Start scheduler in server/src/index.ts
const indexTsPath = path.join(__dirname, 'server/src/index.ts');
let indexTsContent = fs.readFileSync(indexTsPath, 'utf8');
if (!indexTsContent.includes('startScheduler')) {
    indexTsContent = indexTsContent.replace(
        "import { seedDatabase } from './db/seed.js';",
        "import { seedDatabase } from './db/seed.js';\nimport { startScheduler } from './services/automations/scheduler.js';\nimport { AutomationContext } from './services/automations/context.js';\nimport { getDb } from './db/database.js';\nimport { ConsoleSms, BulkSmsBD, NoSms } from './services/sms/smsGateway.js';"
    );
    
    const schedulerCode = `
    console.log('[MadrasaOS AI] Starting Automation Scheduler...');
    const db = await getDb();
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
    `;

    indexTsContent = indexTsContent.replace(
        "app.listen(Number(PORT)",
        `${schedulerCode}\n    app.listen(Number(PORT)`
    );
    fs.writeFileSync(indexTsPath, indexTsContent);
}

// 3. Fix import path in schema.ts patch script to have .js
// Actually let's just make sure everything has .js in imports
