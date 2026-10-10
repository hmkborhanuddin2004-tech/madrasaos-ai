import cron from 'node-cron';
import { AutomationContext } from './context.js';
import { globalRegistry } from './registry.js';

export function startScheduler(ctx: AutomationContext) {
  const mods = globalRegistry.listAll();
  for (const mod of mods) {
    if (mod.cron) {
      cron.schedule(mod.cron, () => {
        console.log(`[CRON] Running ${mod.name}`);
        globalRegistry.runOne(mod.key, ctx).catch((err: any) => {
          console.error(`[CRON] Error in ${mod.name}:`, err);
        });
      });
    }
  }
  console.log('Scheduler started with modules:', mods.map((m: any) => m.key).join(', '));
}
