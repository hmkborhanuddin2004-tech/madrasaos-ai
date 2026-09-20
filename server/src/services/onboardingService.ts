import { db } from '../db/db.js';
import { v4 as uuidv4 } from 'uuid';

export interface OnboardingAnswerPayload {
  models?: string[]; // qawmi, alia, hifz, boarding, nazera
  qawmiJamaats?: string[];
  hifzTrackingMethod?: 'sabaq_sabqi_manzil' | 'daily_sabaq_only' | 'custom';
  boardingCapacity?: { buildingName: string; roomCount: number; bedsPerRoom: number };
  feeStructure?: { tuitionFee: number; diningFee?: number; admissionFee: number };
}

export class OnboardingService {
  public async getState(tenantId: string): Promise<any> {
    const row = await db.get<any>('SELECT * FROM onboarding_state WHERE tenant_id = ?', [tenantId]);
    if (!row) {
      const defaultState = {
        tenant_id: tenantId,
        is_completed: 0,
        current_step: 1,
        answers_json: JSON.stringify({}),
        updated_at: new Date().toISOString()
      };
      await db.run(
        'INSERT INTO onboarding_state (tenant_id, is_completed, current_step, answers_json, updated_at) VALUES (?, 0, 1, ?, ?)',
        [tenantId, defaultState.answers_json, defaultState.updated_at]
      );
      return { isCompleted: false, currentStep: 1, answers: {} };
    }

    return {
      isCompleted: Boolean(row.is_completed),
      currentStep: row.current_step,
      answers: JSON.parse(row.answers_json || '{}'),
      updatedAt: row.updated_at
    };
  }

  public async saveStep(tenantId: string, step: number, partialAnswers: Partial<OnboardingAnswerPayload>): Promise<any> {
    const current = await this.getState(tenantId);
    const updatedAnswers = { ...current.answers, ...partialAnswers };

    await db.run(
      'UPDATE onboarding_state SET current_step = ?, answers_json = ?, updated_at = ? WHERE tenant_id = ?',
      [step + 1, JSON.stringify(updatedAnswers), new Date().toISOString(), tenantId]
    );

    return {
      isCompleted: current.isCompleted,
      currentStep: step + 1,
      answers: updatedAnswers
    };
  }

  public async finalize(tenantId: string, branchId: string): Promise<any> {
    const current = await this.getState(tenantId);
    const answers: OnboardingAnswerPayload = current.answers;

    // Apply configuration to institution
    const enabledModels = answers.models || ['qawmi', 'hifz'];
    await db.run(
      'UPDATE institutions SET enabled_models = ? WHERE id = ?',
      [JSON.stringify(enabledModels), tenantId]
    );

    // If classes selected, ensure they are scaffolded
    if (answers.qawmiJamaats && answers.qawmiJamaats.length > 0) {
      for (let i = 0; i < answers.qawmiJamaats.length; i++) {
        const jName = answers.qawmiJamaats[i];
        const existing = await db.get('SELECT id FROM classes WHERE tenant_id = ? AND name_bn = ?', [tenantId, jName]);
        if (!existing) {
          await db.run(
            'INSERT INTO classes (id, tenant_id, branch_id, department, name_bn, name_en, order_index) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [`cls_${uuidv4().slice(0, 8)}`, tenantId, branchId, 'কওমী বিভাগ', jName, jName, i + 1]
          );
        }
      }
    }

    // Mark as completed
    await db.run(
      'UPDATE onboarding_state SET is_completed = 1, updated_at = ? WHERE tenant_id = ?',
      [new Date().toISOString(), tenantId]
    );

    return { success: true, message: 'মাদ্রাসার সিস্টেম কনফিগারেশন সফলভাবে সমাপ্ত হয়েছে।' };
  }
}

export const onboardingService = new OnboardingService();
