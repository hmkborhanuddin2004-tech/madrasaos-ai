## 2026-09-20T11:14:39Z

You are the Full-Stack Remediation Worker (teamwork_preview_worker) for Milestone 2.

Your working directory: C:\Users\assdi\.gemini\antigravity\scratch\madrasaos-ai\.agents\worker_m2_remediate
Your parent orchestrator: orchestrator_1 (Conversation ID: 643bbed0-30b9-40bc-9c5b-226c8019bf72)

MANDATORY INPUTS:
- Read C:\Users\assdi\.gemini\antigravity\scratch\madrasaos-ai\.agents\ORIGINAL_REQUEST.md first.
- Read C:\Users\assdi\.gemini\antigravity\scratch\madrasaos-ai\.agents\explorer_m2_remediate\plan.md carefully.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

EXCLUSIVE FILE WRITE OWNERSHIP:
- tests/payroll.test.ts
- server/src/db/seed.ts
- server/src/services/payrollService.ts
- tests/challenger_m2.test.ts (delete or remove this ephemeral file)

TASKS TO EXECUTE:
1. In `tests/payroll.test.ts`:
   - In `beforeAll` (and `beforeEach` for test 2.13), reset `vch_02` status to `'muhtamim_approved'`, `disbursed_by = NULL`, `disbursed_at = NULL`, `disbursement_method = NULL`.
   - Clean up any dynamic test vouchers from prior runs: `DELETE FROM payroll_vouchers WHERE id LIKE 'test_%' OR voucher_number LIKE 'VCH-202610%'` and `DELETE FROM staff_payroll_profiles WHERE id LIKE 'test_%'`.
2. In `server/src/db/seed.ts`:
   - In `seedDatabase()` inside the `existingOrg` branch, reset `vch_02` to `muhtamim_approved` with null disbursement fields.
3. In `server/src/services/payrollService.ts`:
   - In `updateProfile`: validate `staff_name` (must not be empty string), valid designation, non-negative `base_salary`.
   - In `generateMonthlyVouchers` and `createVoucher`: clamp `net_payable = Math.max(0, base_salary + housing_allowance + food_allowance + bonus_allowance - advance_loan_deduction - absent_deduction)`.
4. Delete the ephemeral file `tests/challenger_m2.test.ts` if it exists in `tests/`.
5. Run automated verification:
   - Run `npm test` using run_command multiple times consecutively — verify all 89 tests pass 100% on every single run.
   - Run `npm run build` using run_command — verify 0 TypeScript errors.

OUTPUT REQUIREMENTS:
- Write your handoff report to: C:\Users\assdi\.gemini\antigravity\scratch\madrasaos-ai\.agents\worker_m2_remediate\handoff.md.
- Send a completion message via send_message to Recipient: 643bbed0-30b9-40bc-9c5b-226c8019bf72.
