# Original User Request

## 2026-09-20T09:10:21Z

# Teamwork Project Prompt — Launched

> Status: Launched — Delegated to teamwork_preview
> Goal: Multi-agent execution of MadrasaOS AI v3.0
> Requested team: Full multi-agent team (Madrasa SaaS Architect, Lead Backend Engineer, UI/UX Designer, Database Architect, Automation & AI Engineer)

MadrasaOS AI v3.0 is a production-grade, local-first, scalable Digital Operating System tailored specifically for 1,000–2,000 student Bangladeshi Madrasas (Qawmi, Alia, Hifz, Boarding, and Hybrid). It integrates segregated residential vs. non-residential accounting, comprehensive accountant multi-source finance (student fees, teacher/staff payroll, donor/zakat fund collections), multi-channel automated notices (Facebook Messenger, WhatsApp, Brevo Email, SMS gateway), deterministic AI assistance, and Super Admin telemetry.

Working directory: C:\Users\assdi\.gemini\antigravity\scratch\madrasaos-ai
Integrity mode: development

## Requirements

### R1. Comprehensive Multi-Source Accountant & Financial Management
The accounting system must provide complete double-entry ledger capabilities with separate fund accounting:
1. **Residential vs. Non-Residential Segregation:**
   - Residential (আবাসিক): Tracks boarding charges, meal/mess costs (মাসিক খোরাকি), room/bed rent, laundry/utility charges, and medical aid.
   - Non-Residential (অনাবাসিক): Tracks academic tuition fees (মাসিক বেতন), session fees, exam fees, and optional transport charges.
   - System provides separate financial ledgers, preventing unauthorized cross-fund leakage between general academic revenue and hostel/boarding expenses.
2. **Asatiza & Staff Payroll (ওস্তাদ ও কর্মচারীদের মাসিক বেতন ও ভাতা):**
   - Designation profiles: Muhtamim, Shaykhul Hadith, Senior Muhaddis, Kitab Teachers, Hifz Teachers, Nazir/Office Staff, Cook/Hostel Staff, Security.
   - Payroll fields: Base Salary (`base_salary`), Housing Allowance (`housing_allowance`), Food Allowance (`food_allowance`), Bonus/Special Allowance, Loan/Advance Deductions (`advance_loan_deduction`), Unexcused Absence Deductions (`absent_deduction`), and Net Disbursed (`net_payable`).
   - Disbursement lifecycle: Draft Voucher → Accountant Verification → Principal/Muhtamim Approval → Disbursement (Cash, Bank, or bKash/Nagad) → Downloadable Payslip Voucher with QR validation.
3. **Donations, Grants & Lillah Boarding Collections (মাদ্রাসার অনুদান ও দাতা হিসাব):**
   - Fund categorization:
     - Lillah Boarding & Orphan Fund (লিল্লাহ বোর্ডিং ও এতিম তহবিল: যাকাত, ফিতরা, কুরবানির চামড়া, ছদকা — strictly ring-fenced for poor/orphan residential students).
     - General Operational Fund (সাধারণ তহবিল: মেরামত, বিদ্যুৎ, সাধারণ উপহার).
     - Construction & Waqf Fund (ভবন নির্মাণ ও মসজিদ ওয়াকফ তহবিল).
   - Donor registry: Donor Name, Organization Name, Category (Permanent Donor/আজীবন দাতা, Annual Donor, One-time, Anonymous/বেনামী), Contact/WhatsApp/Phone, Target Fund, Amount, Receipt Number, and Recurring Commitment schedule.
4. **Cash Book & Bank Ledgers:**
   - Daily automated Cash Book (দৈনিক ক্যাশ বই): Opening balance, daily cash collections, expenses, closing balance, bank deposit slips, and dual-authorization journal vouchers.

### R2. Multi-Channel Notification & Automation Engine
Automate institutional alerts and communication workflows across four dedicated channels without third-party vendor lock-in:
1. **Adapter Implementations:**
   - **SMS Gateway Adapter:** Bangladesh telco aggregator integration (SSL Wireless, Onnorokom SMS, Greenweb) with Bengali unicode support and balance tracking.
   - **WhatsApp Cloud API / Provider Adapter:** Session and template messaging (daily attendance alerts, Sabaq progress cards, fee overdue reminders).
   - **Facebook Messenger Adapter:** Page-scoped Webhook integration delivering official notices and fee receipts directly to connected guardian accounts.
   - **Brevo (formerly Sendinblue) / SMTP Email Adapter:** Daily quota-managed transactional dispatch with PDF fee vouchers and academic marksheets.
2. **Pre-Built Automation Trigger Rules:**
   - *Consecutive Absence Alert:* If a student is absent 2+ consecutive days → trigger instant alert to preferred parent channel (WhatsApp/Messenger/SMS).
   - *Automated Fee Reminder:* Scheduled dispatch on 10th of every month for overdue invoices with direct MFS payment link.
   - *Instant Notice Broadcast:* When Muhtamim publishes an official notice → automatically format and route across WhatsApp, Messenger, and SMS based on recipient preferences.
   - *Hifz Stagnation Warning:* If student Sabaq is incomplete for 3+ consecutive days → alert Hifz Teacher and Guardian with action items.
   - *Monthly Payroll Generation:* Automated drafting of monthly teacher salary slips on the 1st of each month.
3. **Human-in-the-Loop Approval:**
   - Mass external notifications (>50 recipients) and fee adjustments require explicit one-click approval from Admin/Muhtamim before network dispatch.

### R3. Core Madrasa Management & Configurable Academic Hierarchy
- Student 360 profile unifying multiple concurrent enrollments (Qawmi Jamaat + Hifz Circle + Residential Hostel Bed) without duplicate student records.
- Fast Daily Attendance POS: One-tap "Mark All Present" with instant toggling for Absent, Late, and Leave.
- Hifz Workspace: Rapid daily recording of Sabaq (Para/Surah/Ayah range), Sabqi (recent 3–5 Paras), Manzil (revision), mistake scoring, and 30-Para progress visualization.
- Kitab & Syllabus Progress: Tracking Bab/Chapter completion percentages and daily lesson logs.
- Online/Offline Admissions pipeline: Application intake, viva/interview scoring, and 1-click enrollment.
- Madrasa Library: Arabic/Bangla catalog, barcode/ISBN lookup, and loan tracking.

### R4. Deterministic AI Operating Assistant
- Grounded conversational assistant executing authorized backend tools with zero hallucination.
- Strict role isolation: Teachers cannot query total institutional revenue or teacher salary records; guardians and students can only query their own linked data.
- Conversational system briefings: "আজকের অবস্থা বলো" summarizes attendance, pending tasks, and collections (for authorized administrators only).

### R5. Super Admin Platform Telemetry & Local-First Stack
- Platform-level dashboard for software creator monitoring total active Madrasas, enrolled student counts, database size, SMS/WhatsApp credit usage, and system health.
- Local-first architecture: Runs seamlessly on local server with PostgreSQL / SQLite and Redis before cloud staging.

## Acceptance Criteria

### Accountant & Financial Verification
- [ ] Student billing generates separate invoices and ledgers for Residential (খোরাকি/সিট) and Non-Residential (টিউশন/সেশন).
- [ ] Teacher/staff payroll workflow generates detailed payslips with allowances, advance deductions, and disbursement records.
- [ ] Donor contributions (Zakat, Lillah, General, Waqf) produce immutable credit vouchers with distinct fund isolation.
- [ ] Duplicate payment attempts with identical transaction IDs return HTTP 409 Conflict.

### Multi-Channel Automation Verification
- [ ] Event triggers correctly format and dispatch payloads to SMS, WhatsApp, Facebook Messenger, and Brevo Email mock/live adapters.
- [ ] High-volume broadcasts (>50 messages) transition to `pending_approval` and require explicit Admin authorization before execution.
- [ ] Consecutive absence detection trigger successfully flags students with 2+ missed days and drafts parent alerts.

### Role-Based Access & Security
- [ ] Teachers, Hifz Teachers, and Hostel Staff are strictly blocked (HTTP 403) from viewing accountant payroll records, institutional revenue, and donation lists.
- [ ] Guardians can only view invoices and attendance for their linked children; students can only view their own records.
- [ ] Super Admin telemetry dashboard aggregates usage statistics without leaking student PII or private financial vouchers.

### Automated Testing & Build
- [ ] Vitest test suite passes 100% of unit and integration tests covering multi-channel automation, payroll, segregated accounting, and RBAC.
- [ ] Production build (`npm run build`) compiles both client and server with zero TypeScript errors or missing imports.
