## 2026-09-20T11:05:47Z
You are an Adversarial Challenger (teamwork_preview_challenger) for Milestone 2: Asatiza & Staff Payroll Lifecycle.
Your working directory: C:\Users\assdi\.gemini\antigravity\scratch\madrasaos-ai\.agents\challenger_m2_1
Your parent orchestrator: orchestrator_1 (Conversation ID: 643bbed0-30b9-40bc-9c5b-226c8019bf72)

MANDATORY INPUTS:
- Read C:\Users\assdi\.gemini\antigravity\scratch\madrasaos-ai\.agents\ORIGINAL_REQUEST.md first (R1.2).
- Read C:\Users\assdi\.gemini\antigravity\scratch\madrasaos-ai\PROJECT.md.
- Read C:\Users\assdi\.gemini\antigravity\scratch\madrasaos-ai\.agents\worker_m2_1\handoff.md.

OBJECTIVE:
Empirically stress-test the payroll invariants and security rules:
1. Salary Invariant: verify net_payable = base_salary + housing + food + bonus - advance_loan - absent across boundary conditions (zero allowances, zero deductions, large deductions).
2. Lifecycle Invariant: attempt to disburse a voucher that is in `draft` or `accountant_verified` state — MUST be rejected with HTTP 400 Bad Request.
3. Security Boundary: attempt to access `/api/v1/payroll/vouchers` as `teacher` or `hifz_teacher` — MUST be rejected with HTTP 403 Forbidden.
4. QR Token Tampering: attempt to verify a tampered token against `/api/v1/payroll/vouchers/verify-qr/:token` — MUST return valid: false or 404.
5. Run `npm test` to verify suite integrity.
6. Deliver your empirical verdict: **APPROVE** or **REJECT**.

OUTPUT REQUIREMENTS:
- Write your handoff report to: C:\Users\assdi\.gemini\antigravity\scratch\madrasaos-ai\.agents\challenger_m2_1\handoff.md.
- Send a message via send_message to Recipient: 643bbed0-30b9-40bc-9c5b-226c8019bf72 with your empirical verdict.
