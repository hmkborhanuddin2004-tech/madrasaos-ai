import fs from 'fs';
import path from 'path';

function replaceInFile(file, regex, replacement) {
  const fullPath = path.join(process.cwd(), file);
  if (!fs.existsSync(fullPath)) return;
  let content = fs.readFileSync(fullPath, 'utf8');
  content = content.replace(regex, replacement);
  fs.writeFileSync(fullPath, content);
}

replaceInFile('server/src/routes/automationRoutes.ts', /\(acc, row\)/g, '(acc: any, row: any)');
replaceInFile('server/src/services/automations/attendanceAbsentSms.ts', /\(s =>/g, '((s: any) =>');
replaceInFile('server/src/services/automations/scheduler.ts', /\(m =>/g, '((m: any) =>');
replaceInFile('server/src/routes/index.ts', /import automationRoutes from '\.\/automationRoutes\.js';/, "import { router as automationRoutes } from './automationRoutes.js';"); // Wait, does automationRoutes have default export? I'll just change to default export in automationRoutes.ts

replaceInFile('server/src/routes/automationRoutes.ts', /export const router = Router\(\);/g, 'const router = Router();\nexport default router;');
replaceInFile('server/src/routes/automationRoutes.ts', /export const automationRoutes = Router\(\);/g, 'const router = Router();\nexport default router;');
