# MadrasaOS AI - Advanced Automation Engine Specification

## 1. Overview & Architecture
The **MadrasaOS AI Automation Engine** empowers non-technical Madrasa administrators to automate routine institutional workflows without writing code, while providing developers with an extensible connector SDK.

```
                      [EVENT & TRIGGER INGRESS]
  ┌─────────────────┬──────────────────┬─────────────────┬─────────────────┐
  ▼                 ▼                  ▼                 ▼                 ▼
[Domain Events]   [Cron Schedules]   [Incoming Webhook] [AI Agent Plan]   [Manual Run]
(e.g., Student    (e.g., Daily 7 AM, (e.g., bKash IPN,  (e.g., Natural    (Run Now button)
 Absent, Payment)  Monthly 1st)       External Form)     Language Request)
  │                 │                  │                 │                 │
  └─────────────────┴──────────────────┼─────────────────┴─────────────────┘
                                       ▼
                       [WORKFLOW DISPATCHER & MATCHER]
         - Match Trigger against Active Tenant Workflows
         - Verify Execution Rate Limits & Idempotency Key
         - Allocate Execution ID & Create Execution State Record
                                       │
                                       ▼
                       [DIRECTED ACYCLIC GRAPH (DAG) RUNNER]
         - Node Top-Sort & Step Evaluation
         - Context Data Passing ($trigger, $steps, $env)
                                       │
   ┌───────────────────────────────────┼───────────────────────────────────┐
   │                                   │                                   │
   ▼                                   ▼                                   ▼
[LOGIC & FILTERS]               [AI AGENT NODES]                [EXTERNAL ACTIONS]
- Conditions (IF / ELSE)        - Pattern Analysis              - Bangla Unicode SMS
- Data Filters & Projections    - Message Drafting              - WhatsApp / Push
- Delays & Batches              - Sentiment / Anomaly           - PDF Document Generation
- Human Approval Gate           - Summary Extraction            - Payment Provider Query
   │                                   │                        - Webhook Egress
   └───────────────────────────────────┼───────────────────────────────────┘
                                       │
                                       ▼
                       [EXECUTION AUDIT & LOGGING LEDGER]
         - Step Timings, Inputs, Outputs & Error Tracing
         - Failure Retries with Exponential Backoff
         - Administrator Alerting on Consecutive Failures
```

---

## 2. Supported Node Types

### A. Triggers (উৎস)
1. `trigger:event` - Domain event (e.g., `attendance.recorded`, `fee.overdue`, `admission.submitted`, `hifz.lesson_recorded`, `hostel.outpass_requested`).
2. `trigger:schedule` - Timezone-aware cron (e.g., `0 7 * * *` for 7:00 AM daily Asia/Dhaka).
3. `trigger:webhook` - Secure webhook endpoint with HMAC signature validation.
4. `trigger:manual` - On-demand trigger initiated from the dashboard.

### B. Logic & Flow Control (যুক্তি ও নিয়ন্ত্রণ)
1. `logic:condition` - Evaluates expressions with multiple operators (`AND`, `OR`, `EQUALS`, `LESS_THAN`, `IN`, `CONTAINS`).
2. `logic:filter` - Filters an array of items (e.g., filter students where `attendanceRate < 70`).
3. `logic:batch` - Processes items in chunks with rate limits to prevent API flooding.
4. `control:approval` - Halts execution and notifies an administrator (Admin, Principal, Accountant) with an interactive approval card.
5. `control:delay` - Waits a specified interval (minutes/hours) before proceeding.

### C. AI Intelligence Nodes (এআই বুদ্ধিমত্তা)
1. `ai:analyze` - Evaluates student performance trends, attendance regressions, or fee risks.
2. `ai:draft_message` - Composes personalized, culturally respectful Bangla messages for guardians.
3. `ai:summarize` - Compiles multi-variable data into executive briefs.

### D. Actions & Output (পদক্ষেপ ও আউটপুট)
1. `action:notification` - In-app notification to specific roles or users.
2. `action:sms` - Sends SMS via integrated Bangladeshi SMS gateways (Bangla Unicode supported).
3. `action:email` - Transactional email delivery.
4. `action:pdf_generate` - Creates PDF reports, marksheets, or fee receipts.
5. `action:database_update` - Safe state mutations (e.g. mark admission status, apply fine waiver).
6. `action:webhook` - Dispatches payload to external systems (e.g., accounting software, Azure).

---

## 3. 20 Pre-Built Madrasa Automation Templates

1. **Daily Madrasa Briefing**: Generates and broadcasts the morning operational summary at 7:00 AM.
2. **Repeated Absence Alert**: Triggers when a student is absent >= 3 times in 7 days; alerts class teacher and drafts guardian SMS.
3. **Monthly Fee Due Reminder**: Runs on the 5th of each month; checks unpaid invoices and sends polite SMS reminders to guardians.
4. **Payment Confirmation & Instant Digital Receipt**: Triggered on bKash/Nagad/Cash payment; generates receipt PDF and sends SMS with transaction ID.
5. **Declining Hifz Progress Alert**: Evaluates 14-day Sabaq/Sabqi trends; alerts Hifz supervisor if mistakes increase and completed pages drop.
6. **Hostel Night Curfew Absence Notice**: Runs at 10:00 PM; flags residential students not checked in and notifies hostel warden.
7. **Exam Schedule Announcement**: Broadcasts timetable and exam guidelines to guardians 7 days prior to term exams.
8. **Result Publication & Marksheet Generator**: When exam results are published, generates marksheet PDFs and notifies guardians with individual results.
9. **Admission Application Intake Alert**: When an online admission form is submitted, validates documents and notifies the admissions committee.
10. **Admission Approval & ID Card Generator**: Upon application approval, assigns student ID, enrolls student, and sends congratulations message.
11. **Library Overdue Book Warning**: Runs daily; alerts students and teachers with books unreturned after 14 days.
12. **Teacher Attendance Daily Summary**: Notifies the Principal at 9:30 AM regarding teacher check-ins and unassigned classes.
13. **End-of-Day Madrasa Operational Report**: Runs at 9:00 PM; compiles total collection, day attendance, and pending administrative tasks.
14. **Monthly Academic & Financial Report for Muhtamim**: Generates executive PDF report on the 1st of every month.
15. **Hifz Daily Lesson Digest for Guardians**: Sends evening update to guardians regarding their child's Sabaq, Sabqi, and Manzil performance.
16. **Hostel Out-Pass Emergency Overdue**: Alerts warden and guardian if an out-pass return time is exceeded by 2 hours.
17. **Kitab Syllabus Milestone Tracker**: Notifies department head when a Kitab's progress falls 15% behind the academic calendar.
18. **Certificate Generation & QR Verification**: Workflow for generating Student/Transfer certificates with verification QR codes upon request.
19. **Fee Concession / Zakat & Sadaqah Application Review**: Routes needy student waiver applications through verification and committee approval.
20. **Automated Weekly Database Snapshot & Cloud Backup**: Executes full automated backup and integrity check every Friday night.

---

## 4. Natural Language to Workflow Compiler
The system allows administrators to type plain Bangla prompts:
> *"যে ছাত্র ৩ দিন টানা অনুপস্থিত থাকবে, তার অভিভাবককে মেসেজ পাঠানোর আগে আমাকে দেখাবে।"*

The AI Workflow Compiler deterministically structures this into:
```json
{
  "name": "টানা ৩ দিন অনুপস্থিতি সতর্কতা",
  "trigger": { "type": "event", "event": "attendance.recorded" },
  "nodes": [
    {
      "id": "node_condition_1",
      "type": "logic:condition",
      "config": { "field": "consecutive_absent_count", "operator": "GREATER_THAN_OR_EQUAL", "value": 3 }
    },
    {
      "id": "node_ai_draft_2",
      "type": "ai:draft_message",
      "config": { "language": "bn", "tone": "polite_islamic" }
    },
    {
      "id": "node_approval_3",
      "type": "control:approval",
      "config": { "required_role": "madrasa_admin", "title": "অনুপস্থিতি মেসেজ অনুমোদন" }
    },
    {
      "id": "node_sms_action_4",
      "type": "action:sms",
      "config": { "recipient": "$trigger.guardian_phone", "message": "$node_ai_draft_2.output" }
    }
  ],
  "connections": [
    { "from": "trigger", "to": "node_condition_1" },
    { "from": "node_condition_1", "to": "node_ai_draft_2" },
    { "from": "node_ai_draft_2", "to": "node_approval_3" },
    { "from": "node_approval_3", "to": "node_sms_action_4" }
  ]
}
```
Before activation, the user is presented with a **Visual Preview & Dry Run Simulator** showing expected recipients and estimated operations.
