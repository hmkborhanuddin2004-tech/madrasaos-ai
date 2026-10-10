# E2E Test Infra: MadrasaOS AI v3.0

## Test Philosophy
- Opaque-box, requirement-driven. No dependency on implementation design.
- Methodology: Category-Partition + Boundary Value Analysis + Pairwise Combinatorial + Real-World Workload Testing.
- Zero tolerance for cheating, dummy facades, or mock leakage in production paths.

## Feature Inventory & Test Matrix
| # | Feature | Source | Tier 1 (Coverage) | Tier 2 (Boundary) | Tier 3 (Cross-Feature) | Tier 4 (Scenario) |
|---|---------|--------|:-----------------:|:-----------------:|:----------------------:|:-----------------:|
| 1 | Residential Fee Tracking | R1.1 | 5 | 5 | ✓ | ✓ |
| 2 | Non-Residential Fee Tracking | R1.1 | 5 | 5 | ✓ | ✓ |
| 3 | Financial Fund Segregation | R1.1 | 5 | 5 | ✓ | ✓ |
| 4 | Staff Payroll Breakdown | R1.2 | 5 | 5 | ✓ | ✓ |
| 5 | Payroll Lifecycle & Approval | R1.2 | 5 | 5 | ✓ | ✓ |
| 6 | Payslip QR Validation | R1.2 | 5 | 5 | ✓ | ✓ |
| 7 | Zakat/Lillah Fund Ring-fencing | R1.3 | 5 | 5 | ✓ | ✓ |
| 8 | Donor Registry & Receipts | R1.3 | 5 | 5 | ✓ | ✓ |
| 9 | Daily Cash Book | R1.4 | 5 | 5 | ✓ | ✓ |
| 10 | Payment Idempotency | Acceptance | 5 | 5 | ✓ | ✓ |
| 11 | SMS Gateway Adapter | R2.1 | 5 | 5 | ✓ | ✓ |
| 12 | WhatsApp Cloud API Adapter | R2.1 | 5 | 5 | ✓ | ✓ |
| 13 | FB Messenger Adapter | R2.1 | 5 | 5 | ✓ | ✓ |
| 14 | Brevo / SMTP Email Adapter | R2.1 | 5 | 5 | ✓ | ✓ |
| 15 | 2+ Day Absence Trigger | R2.2 | 5 | 5 | ✓ | ✓ |
| 16 | 10th-of-Month Fee Reminder | R2.2 | 5 | 5 | ✓ | ✓ |
| 17 | Muhtamim Notice Broadcast | R2.2 | 5 | 5 | ✓ | ✓ |
| 18 | 3-Day Sabaq Stagnation | R2.2 | 5 | 5 | ✓ | ✓ |
| 19 | 1st-of-Month Payroll Trigger | R2.2 | 5 | 5 | ✓ | ✓ |
| 20 | >50 Recipient Approval Gate | R2.3 | 5 | 5 | ✓ | ✓ |
| 21 | RBAC Isolation (Teacher Guard) | Acceptance | 5 | 5 | ✓ | ✓ |
| 22 | Guardian/Student Isolation | Acceptance | 5 | 5 | ✓ | ✓ |
| 23 | Super Admin Telemetry Aggregation | R5 | 5 | 5 | ✓ | ✓ |
| 24 | Telemetry Zero-PII Leakage | Acceptance | 5 | 5 | ✓ | ✓ |

## Test Architecture
- Test runner: Vitest (`npm test` / `npx vitest run`)
- Target test files:
  - `tests/api.test.ts` (Existing baseline tests)
  - `tests/accounting_segregation.test.ts` (M1: Fee segregation, fund isolation, cash book, idempotency)
  - `tests/payroll.test.ts` (M2: Profiles, allowances, deductions, lifecycle, payslips, QR verification)
  - `tests/donations.test.ts` (M1: Lillah/Zakat/Waqf donor registry, immutable vouchers, ring-fencing)
  - `tests/multi_channel_automation.test.ts` (M3: SMS/WhatsApp/Messenger/Email adapters, triggers, >50 gate)
  - `tests/rbac_comprehensive.test.ts` (M4: Financial isolation for teachers, student/guardian data isolation)
  - `tests/telemetry.test.ts` (M4: Multi-madrasa aggregation, SQLite metrics, zero PII)

## Real-World Application Scenarios (Tier 4)
| # | Scenario | Features Exercised |
|---|----------|--------------------|
| 1 | Full Residential Admission, Boarding Billing, and Lillah Subsidy | F1, F3, F7, F8, F10 |
| 2 | Teacher Monthly Attendance, Loan Deduction, Payroll Approval, and Disbursal | F4, F5, F6, F9, F19 |
| 3 | Multi-Day Absence Detection, Channel Selection, and Parent Alerting | F11, F12, F13, F14, F15 |
| 4 | Emergency Institutional Weather/Holiday Notice with >50 Guardian Gate | F11, F12, F17, F20 |
| 5 | Super Admin Multi-Madrasa Health Audit without Private Financial Exposure | F21, F22, F23, F24 |

## Coverage Thresholds
- Minimum 100% test pass on all suites.
- Production build compiles cleanly with zero TypeScript errors.
