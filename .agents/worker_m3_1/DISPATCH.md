## 2026-09-20T11:24:33Z

You are the Lead Full-Stack Worker (teamwork_preview_worker) for Milestone 3: Multi-Channel Notification Adapters & Automation Engine.

Your working directory: C:\Users\assdi\.gemini\antigravity\scratch\madrasaos-ai\.agents\worker_m3_1
Your parent orchestrator: orchestrator_1 (Conversation ID: 643bbed0-30b9-40bc-9c5b-226c8019bf72)

MANDATORY INPUTS:
- Read C:\Users\assdi\.gemini\antigravity\scratch\madrasaos-ai\.agents\ORIGINAL_REQUEST.md first (specifically section R2).
- Read C:\Users\assdi\.gemini\antigravity\scratch\madrasaos-ai\PROJECT.md.
- Review existing workflow models in `server/src/db/schema.ts` (`workflows`, `workflow_executions`, `workflow_approvals`).

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

EXCLUSIVE FILE WRITE OWNERSHIP:
- server/src/types/index.ts
- server/src/services/notification/adapters/smsAdapter.ts
- server/src/services/notification/adapters/whatsappAdapter.ts
- server/src/services/notification/adapters/messengerAdapter.ts
- server/src/services/notification/adapters/emailAdapter.ts
- server/src/services/notification/notificationRouter.ts
- server/src/services/notification/triggerEngine.ts
- server/src/routes/notificationRoutes.ts
- server/src/routes/index.ts
- client/src/components/automation/AutomationCenter.tsx
- tests/multi_channel_automation.test.ts

IMPLEMENTATION REQUIREMENTS:
1. Adapters (`server/src/services/notification/adapters/`):
   - `smsAdapter.ts`: Telco aggregator interface (SSL Wireless / Greenweb / Onnorokom) supporting Bengali unicode detection & part calculations (70 chars per unicode SMS vs 160 GSM), balance tracking, and sandbox/mock dispatch with message log.
   - `whatsappAdapter.ts`: WhatsApp Cloud API adapter with template formatting (attendance alerts, Sabaq progress, fee overdue notices) and session messaging.
   - `messengerAdapter.ts`: Facebook Messenger page-scoped webhook formatting for official notices and payment receipts.
   - `emailAdapter.ts`: Brevo / SMTP adapter with daily quota tracking (e.g. 300/day free tier) and HTML/PDF voucher attachment formatting.
2. Notification Router & Hub (`server/src/services/notification/notificationRouter.ts`):
   - Unifies the 4 adapters under `NotificationRouter.dispatch({ recipient, preferredChannel, message, templateName, metadata })`.
   - Records sent notifications and tracks adapter balances and delivery states.
3. Pre-Built Automation Triggers (`server/src/services/notification/triggerEngine.ts`):
   - Rule 1: `Consecutive Absence Alert`: Checks `attendance_records` for students absent 2+ consecutive days, drafts and routes alerts to guardian preferred channel.
   - Rule 2: `Automated Fee Reminder`: Identifies overdue invoices on the 10th of the month, formats reminder with MFS bKash/Nagad payment link.
   - Rule 3: `Instant Notice Broadcast`: Muhtamim official notices formatted and routed to recipients across their preferred channels.
   - Rule 4: `Hifz Stagnation Warning`: Checks `hifz_records` for students with Sabaq incomplete 3+ consecutive days, alerts Hifz teacher and guardian.
   - Rule 5: `Monthly Payroll Generation`: Scheduled trigger on 1st of month drafting teacher salary slips via `payrollService.generateMonthlyVouchers`.
4. Human-in-the-Loop Mass Approval (>50 recipients):
   - In `POST /api/v1/notifications/broadcast`: If `recipients.length > 50`, message dispatch MUST NOT execute immediately. Instead, create a record in `workflow_approvals` table with status `pending_approval` and return `{ status: 'pending_approval', approvalId, recipientCount }`.
   - Provide `POST /api/v1/notifications/approvals/:id/approve` (Admin/Muhtamim only) to execute the batch dispatch.
   - If `recipients.length <= 50`, dispatch directly and return `{ status: 'dispatched', sentCount }`.
5. REST API (`server/src/routes/notificationRoutes.ts`):
   - `POST /api/v1/notifications/broadcast`: broadcast with >50 threshold guard.
   - `GET /api/v1/notifications/approvals`: list pending approvals.
   - `POST /api/v1/notifications/approvals/:id/approve`: approve and trigger broadcast.
   - `GET /api/v1/notifications/telemetry`: adapter status, credit balances, quota used.
   - `POST /api/v1/notifications/triggers/evaluate`: evaluate trigger rules on demand.
   - Mount in `server/src/routes/index.ts` under `/api/v1/notifications`.
6. Client UI (`client/src/components/automation/AutomationCenter.tsx`):
   - Add a Broadcast Notice Composer with recipient multi-select / count, channel badges (SMS, WhatsApp, Messenger, Brevo), and a warning badge if recipient count > 50 ("৫০ জনের অধিক প্রাপক - মুহতামিমের অনুমোদন আবশ্যক").
   - Add Adapter Status Telemetry cards showing SMS balance, WhatsApp session status, and Brevo daily email quota.
   - Enhance the Approvals tab to approve pending mass broadcasts with 1 click.
7. Automated Tests (`tests/multi_channel_automation.test.ts`):
   - 15+ comprehensive tests covering:
     - SMS adapter (Bengali unicode calculation and credit deduction)
     - WhatsApp, Messenger, and Brevo adapter formatting and dispatch
     - Rule 1 (2+ consecutive days absence detection)
     - Rule 2 (Fee reminder on overdue invoices)
     - Rule 3 (Muhtamim notice broadcast)
     - Rule 4 (Hifz stagnation 3+ days)
     - Rule 5 (Monthly payroll trigger)
     - Mass broadcast threshold: <=50 dispatches directly (status: 'dispatched'); >50 transitions to 'pending_approval'
     - Approval execution: approving mass broadcast dispatches all queued messages.
8. Verification:
   - Run `npm test` using run_command — verify 100% passing tests (existing 89 + new multi-channel tests).
   - Run `npm run build` using run_command — verify 0 TypeScript errors.

OUTPUT REQUIREMENTS:
- Write your handoff report to: C:\Users\assdi\.gemini\antigravity\scratch\madrasaos-ai\.agents\worker_m3_1\handoff.md.
- Send a completion message via send_message to Recipient: 643bbed0-30b9-40bc-9c5b-226c8019bf72.
