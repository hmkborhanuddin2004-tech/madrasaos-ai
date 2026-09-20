# MadrasaOS AI - Comprehensive Screen & Navigation Map

## 1. Top-Level Screen Hierarchy

```
[ENTRY & AUTHENTICATION]
  ├── /login (Phone / Email + Password + OTP + Tenant Resolution)
  ├── /forgot-password
  └── /onboarding (AI Conversational Institution Setup Wizard)

[APPLICATION WORKSPACE]
  ├── [UNIVERSAL HEADER]
  │     ├── Branch Switcher (Main Campus / Mirpur Campus)
  │     ├── Universal Command Bar (Ctrl+K / "আপনি কী করতে চান?")
  │     ├── Language Switcher (বাংলা / English / العربية)
  │     ├── Offline / Sync Status Indicator
  │     ├── Notifications Flyout Center
  │     └── Profile & Role Switcher
  │
  ├── [DASHBOARDS (Role-Adaptive)]
  │     ├── /dashboard/admin (Overview, Needs Attention, Today's Numbers, AI Brief)
  │     ├── /dashboard/teacher (My Classes, Pending Attendance, Hifz Tasks)
  │     ├── /dashboard/hifz (Daily Sabaq Workspace, Mistake Log, Quran Tracker)
  │     ├── /dashboard/accountant (Fee Collection, Daily Cashbook, Overdue)
  │     ├── /dashboard/hostel (Resident Curfew, Meal Log, Available Beds)
  │     └── /dashboard/guardian (Child Overview, Daily Attendance, Sabaq, Due Fee)
  │
  ├── [CORE MANAGEMENT MODULES]
  │     ├── /students (List, Filters, Quick Search, Add Student Wizard)
  │     │     └── /students/:id (Student 360: Overview, Attendance, Result, Hifz, Fees, Hostel, Timeline)
  │     ├── /teachers (Staff directory, Class assignments, Workload)
  │     ├── /guardians (Guardian directory, Linked students, Emergency contacts)
  │     ├── /academics
  │     │     ├── /academics/classes (Jamaat & Sections configuration)
  │     │     ├── /academics/subjects (Kitab & Subject syllabi)
  │     │     └── /academics/kitab-progress (Daily Kitab lesson tracking)
  │     ├── /attendance
  │     │     ├── /attendance/smart-entry (Fast Mark All Present, Absent toggling)
  │     │     ├── /attendance/history (Class-wise monthly registers)
  │     │     └── /attendance/repeated-absences (Intervention lists)
  │     ├── /hifz
  │     │     ├── /hifz/daily-entry (Sabaq, Sabqi, Manzil fast recording)
  │     │     ├── /hifz/progress-charts (Surah / Para completion tracker)
  │     │     └── /hifz/declining-alerts (Early intervention monitoring)
  │     ├── /exams
  │     │     ├── /exams/schedules (Exam terms, schedules, admit cards)
  │     │     ├── /exams/marks-entry (Subject marks submission & review)
  │     │     └── /exams/results (Tabulation sheet, individual marksheets, PDF)
  │     ├── /finance
  │     │     ├── /finance/fees (Fee types, Monthly billing, Invoices)
  │     │     ├── /finance/collect (Instant POS-style fee collection with bKash/Nagad/Cash)
  │     │     ├── /finance/overdue (Defaulter lists & reminder dispatch)
  │     │     └── /finance/expenses (Vouchers, categorized expense logging)
  │     ├── /hostel (Buildings, Rooms, Beds, Out-pass approvals, Resident attendance)
  │     ├── /admissions (Online/Offline applicant queue, review, interview, enrollment)
  │     ├── /library (Catalog, Borrow/Return checkout, Overdue fines)
  │     ├── /certificates (Templates: Student Certificate, Transfer Certificate, Hifz Sanad, QR generator)
  │     ├── /reports (Configurable report generator: Attendance, Financial, Hifz, Results with PDF/Excel export)
  │     └── /notices (Draft, review, push to In-app, SMS, WhatsApp)
  │
  ├── [AI ASSISTANT CENTER] (/ai)
  │     ├── Conversational Interface ("আজকের অবস্থা বলো", "বকেয়া ফি রিপোর্ট তৈরি করো")
  │     ├── Suggested Prompt Chips & Quick Tool Cards
  │     ├── Daily Briefing Generator (সকালের মাদ্রাসা ব্রিফ)
  │     └── Action Confirmation Dialogs
  │
  ├── [AUTOMATION CENTER] (/automation)
  │     ├── /automation/dashboard (Active automations, execution metrics, time saved)
  │     ├── /automation/builder (Visual node canvas: Triggers, Conditions, AI, Actions)
  │     ├── /automation/natural-language (Prompt-to-workflow AI compiler)
  │     ├── /automation/templates (20 ready-to-use Madrasa templates)
  │     ├── /automation/approvals (Human-in-the-loop pending approval queue)
  │     ├── /automation/connections (Secure credential vault for bKash, SMS, Email)
  │     └── /automation/executions (Real-time run logs, step trace, error recovery)
  │
  └── [SETTINGS & SYSTEM] (/settings)
        ├── /settings/institution (Name, Logo, Hijri/Gregorian calendar, Education models)
        ├── /settings/branches (Multi-branch configuration)
        ├── /settings/roles-permissions (Granular RBAC configuration)
        ├── /settings/audit-logs (Immutable administrative activity log)
        └── /settings/backup (Database snapshots & restore protocol)
```
