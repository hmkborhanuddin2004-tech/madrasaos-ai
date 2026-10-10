## 2026-09-20T09:18:21Z
You are a Codebase Explorer (teamwork_preview_explorer).
Your working directory: C:\Users\assdi\.gemini\antigravity\scratch\madrasaos-ai\.agents\explorer_m1_1
Your parent orchestrator: orchestrator_1 (Conversation ID: 643bbed0-30b9-40bc-9c5b-226c8019bf72)

MANDATORY INPUT:
- Read C:\Users\assdi\.gemini\antigravity\scratch\madrasaos-ai\.agents\ORIGINAL_REQUEST.md first.
- Read C:\Users\assdi\.gemini\antigravity\scratch\madrasaos-ai\PROJECT.md.
- Read C:\Users\assdi\.gemini\antigravity\scratch\madrasaos-ai\server\src\db\schema.ts, server\src\db\seed.ts, server\src\services\financeService.ts, server\src\routes\financeRoutes.ts.

OBJECTIVE: Formulate a concrete, step-by-step implementation strategy for Milestone 1 Backend:
1. Schema & Migration:
   - Extend `fee_invoices` with `ledger_type` ('residential' | 'non_residential') and ensure separate invoice generation.
   - Design table `donors` (id, organization_id, name, org_name, category, contact_phone, whatsapp, email, commitment_frequency, created_at).
   - Design table `donation_receipts` (id, organization_id, receipt_no, donor_id, fund_type: 'lillah_orphan' | 'general' | 'waqf_construction', amount, payment_method, payment_reference, notes, created_at).
   - Design table `bank_accounts` (id, organization_id, bank_name, account_number, branch_name, current_balance, created_at).
   - Design table `cash_book_daily` (id, organization_id, date, opening_balance, cash_collections, cash_expenses, bank_deposits, closing_balance, created_at).
2. Fix seed logic in `server/src/db/seed.ts` so overdue invoices exist and test assertions do not fail.
3. Services & Routes:
   - `financeService.ts` & `financeRoutes.ts`: Support segregated invoice filtering by `ledger_type`, strict payment idempotency returning HTTP 409 Conflict for duplicate transaction IDs.
   - `donationService.ts` & `donationRoutes.ts`: CRUD for donors and immutable donation receipts with distinct fund isolation.
   - `cashBookService.ts` & `cashBookRoutes.ts`: Calculate daily cash book summaries, opening/closing balances, and bank deposit vouchers.

SCOPE BOUNDARIES:
- Read-only analysis and strategy formulation. DO NOT write or edit source code.

OUTPUT REQUIREMENTS:
- Write your strategy plan to: C:\Users\assdi\.gemini\antigravity\scratch\madrasaos-ai\.agents\explorer_m1_1\plan.md
- Write your handoff report to: C:\Users\assdi\.gemini\antigravity\scratch\madrasaos-ai\.agents\explorer_m1_1\handoff.md
- Send a completion message via send_message to Recipient: 643bbed0-30b9-40bc-9c5b-226c8019bf72.
