## 2026-09-20T09:22:00Z
You are the Lead Full-Stack Worker (teamwork_preview_worker) for Milestone 1: Segregated Accounting, Fund Isolation & Cash Book.

Your working directory: C:\Users\assdi\.gemini\antigravity\scratch\madrasaos-ai\.agents\worker_m1_1
Your parent orchestrator: orchestrator_1 (Conversation ID: 643bbed0-30b9-40bc-9c5b-226c8019bf72)

MANDATORY INPUTS:
- Read C:\Users\assdi\.gemini\antigravity\scratch\madrasaos-ai\.agents\ORIGINAL_REQUEST.md first.
- Read C:\Users\assdi\.gemini\antigravity\scratch\madrasaos-ai\PROJECT.md.
- Read the 3 Explorer plans:
  1. C:\Users\assdi\.gemini\antigravity\scratch\madrasaos-ai\.agents\explorer_m1_1\plan.md (Backend DB & Services)
  2. C:\Users\assdi\.gemini\antigravity\scratch\madrasaos-ai\.agents\explorer_m1_2\plan.md (Frontend UI)
  3. C:\Users\assdi\.gemini\antigravity\scratch\madrasaos-ai\.agents\explorer_m1_3\plan.md (Test Suite)

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

EXCLUSIVE FILE WRITE OWNERSHIP:
- server/src/types/index.ts
- server/src/db/schema.ts
- server/src/db/seed.ts
- server/src/services/financeService.ts
- server/src/routes/financeRoutes.ts
- server/src/services/donationService.ts
- server/src/routes/donationRoutes.ts
- server/src/services/cashBookService.ts
- server/src/routes/cashBookRoutes.ts
- client/src/components/modules/FinanceScreen.tsx
- client/src/components/modules/DonationsScreen.tsx
- client/src/components/modules/CashBookScreen.tsx
- client/src/App.tsx
- client/src/components/layout/Sidebar.tsx
- tests/accounting_segregation.test.ts
- tests/donations.test.ts
- tests/cash_book.test.ts

IMPLEMENTATION TASKS:
1. Domain Types: Add LedgerType, Donor, DonationReceipt, BankAccount, CashBookDaily interfaces to server/src/types/index.ts and update FeeInvoice.
2. Schema & Migration:
   - In server/src/db/schema.ts, add ledger_type to fee_invoices and run migration check: ALTER TABLE fee_invoices ADD COLUMN ledger_type TEXT DEFAULT 'non_residential'.
   - Add tables donors, donation_receipts, bank_accounts, cash_book_daily with indexes.
3. Seed Fix:
   - In server/src/db/seed.ts, fix if (existingOrg) to ensure overdue invoices exist and M1 tables are seeded.
   - For fresh seeds, generate separate residential vs non-residential invoices, set every 7th invoice overdue, and seed donors, receipts, bank accounts, and daily cash book.
4. Services & Routes:
   - In financeService.ts and financeRoutes.ts: support segregated invoice queries (?type=residential|non_residential), createInvoice with ledgerType, and strict payment idempotency returning HTTP 409 Conflict with code 'DUPLICATE_TRANSACTION' for duplicate transaction_id.
   - Create donationService.ts and donationRoutes.ts: donor CRUD, immutable receipts (lillah_orphan, general, waqf_construction), fund summary calculation with ring-fencing, RBAC guards (teachers blocked 403).
   - Create cashBookService.ts and cashBookRoutes.ts: daily cash book calculation (closing = opening + collections - expenses - bank_deposits), bank deposit recording, bank accounts CRUD, RBAC guards.
   - Mount donation and cash book routes under /api/v1/finance.
5. Client UI:
   - Enhance client/src/components/modules/FinanceScreen.tsx with segregated tabs (All Invoices, Residential Ledgers [আবাসিক], Non-Residential Ledgers [অনাবাসিক]), fee badges, and HTTP 409 Conflict error handling on payments.
   - Create client/src/components/modules/DonationsScreen.tsx: 3 ring-fenced fund cards, donor registry table with category filters, donation modal with printable credit voucher.
   - Create client/src/components/modules/CashBookScreen.tsx: daily cash book view, date picker, bank accounts summary, bank deposit modal.
   - Register new tabs/views in client/src/App.tsx and client/src/components/layout/Sidebar.tsx.
6. Tests:
   - Implement tests/accounting_segregation.test.ts (15 tests).
   - Implement tests/donations.test.ts (12 tests).
   - Implement tests/cash_book.test.ts (11 tests).
7. Verification:
   - Run `npm test` using run_command — verify all tests pass 100% (including tests/api.test.ts line 258 which was failing before).
   - Run `npm run build` using run_command — verify both client and server build with 0 TypeScript errors.

OUTPUT REQUIREMENTS:
- Write your handoff report to: C:\Users\assdi\.gemini\antigravity\scratch\madrasaos-ai\.agents\worker_m1_1\handoff.md detailing all changed files, test output, build output, and verification results.
- Send a completion message via send_message to Recipient: 643bbed0-30b9-40bc-9c5b-226c8019bf72.
