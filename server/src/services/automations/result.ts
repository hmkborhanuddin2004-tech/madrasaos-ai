export interface AutomationResult {
  key: string;
  ok: boolean;
  processed: number;
  created: number;
  updated: number;
  sent: number;
  skipped: number;
  failed: number;
  messages: string[];
  data: Record<string, any>;
}

export interface AutomationModule {
  key: string;
  name: string;
  cron: string;
  priority: number;
  run(ctx: any, params?: any): Promise<Partial<AutomationResult>>;
}
