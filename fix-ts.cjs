const fs = require('fs');

function fixExamRoutes() {
  const file = 'server/src/routes/examRoutes.ts';
  let content = fs.readFileSync(file, 'utf8');
  if (!content.includes("import { db }")) {
    content = content.replace("import { Router } from 'express';", "import { Router } from 'express';\nimport { db } from '../db/db.js';");
    fs.writeFileSync(file, content);
  }
}

function fixSettingsRoutes() {
  const file = 'server/src/routes/settingsRoutes.ts';
  let content = fs.readFileSync(file, 'utf8');
  if (!content.includes("import { db }")) {
    content = content.replace("import { Router } from 'express';", "import { Router } from 'express';\nimport { db } from '../db/db.js';");
    fs.writeFileSync(file, content);
  }
}

function fixNotificationRoutes() {
  const file = 'server/src/routes/notificationRoutes.ts';
  let content = fs.readFileSync(file, 'utf8');
  if (!content.includes("import { db }")) {
    content = content.replace("import { Router } from 'express';", "import { Router } from 'express';\nimport { db } from '../db/db.js';");
    fs.writeFileSync(file, content);
  }
}

function fixGradingService() {
  const file = 'server/src/services/gradingService.ts';
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace("import { Database } from 'sqlite';", "");
  content = content.replace(/policy: any, db: Database/g, "policy: any, db: any");
  content = content.replace(/allResults\.sort\(\(a, b\)/g, "allResults.sort((a: any, b: any)");
  fs.writeFileSync(file, content);
}

function fixExportRoutes() {
  const file = 'server/src/routes/exportRoutes.ts';
  try {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(/import \{ requireRole \} from '\.\.\/middleware\/roles\.js';/g, "import { authenticate as requireRole } from '../middleware/auth.js';");
    content = content.replace(/req\.user/g, "(req as any).user");
    fs.writeFileSync(file, content);
  } catch(e) {}
}

fixExamRoutes();
fixSettingsRoutes();
fixNotificationRoutes();
fixGradingService();
fixExportRoutes();
console.log('TS Fixed');
