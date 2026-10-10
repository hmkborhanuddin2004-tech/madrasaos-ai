# Product Requirement Document (PRD) — MadrasaOS AI v3.0
**Product**: MadrasaOS AI (Hifz + Academic + Exam + Timetable + Admission)  
**Version**: 3.0 Production-Ready  
**Audience**: Bangladeshi Madrasas (Qawmi, Alia, Hifz, Boarding / Residential)

---

## 1. Executive Summary & Product Vision
MadrasaOS AI is an enterprise-grade, multi-tenant digital management system engineered specifically for Islamic educational institutions in Bangladesh. Unlike generic school management ERPs, MadrasaOS AI is architected from the ground up to reflect the genuine workflows, marhalas, terminology, and traditions of Qawmi and Alia education systems, while upholding modern security standards (Argon2id, rotating JWTs, hybrid rate limiting, append-only audit trails, and strict tenant isolation).

The platform bridges traditional manuscript integrity ("Kitabkhana" design system) with modern cloud automation, providing a unified platform for Muhtamims (Principals), Teachers, Exam Controllers, Accountants, Guardians, and Students.

---

## 2. Core Personas & User Journeys

| Persona | Core Responsibility | Primary Interfaces | Key Permissions |
| :--- | :--- | :--- | :--- |
| **Super Admin (System)** | Platform hosting, tenant provisioning, system maintenance. | System Console | Break-glass emergency tenant access (MFA, reason ≥ 20 chars, audit notification). |
| **Muhtamim (Principal)** | Institutional oversight, academic approval, financial sign-off, exam publishing. | Executive Dashboard | `result:publish`, `result:unpublish`, `exam:approve`, `academic:approve`, `hifz:read`. |
| **Exam Controller** | Exam creation, schedules, admit cards, seat planning, mark auditing, tabulation. | Exam Desk | `exam:create`, `exam:schedule`, `exam:marks:audit`, `exam:marks:reject`, `result:re-evaluate:review`. |
| **Majlis-e-Ilmi** | Academic committee responsible for curriculum, syllabus, and book-semester mapping. | Syllabus & Routine | `academic:read`, `academic:edit`, `timetable:edit`, `timetable:publish`. |
| **Teacher (Kitab / Hifz)** | Daily attendance, Sabak/Sabki/Amukhta entry, marks entry for assigned subjects. | Teacher Portal & PWA | `hifz:entry`, `exam:marks:enter`, `academic:read`. |
| **Guardian / Student** | Track daily progress, 30 Juz memorization path, notice board, own published results. | Portal & Mobile Web | `result:read:own`, `result:re-evaluate:request`, `hifz:read:own`. |

---

## 3. Functional Requirements & Module Specifications

### 3.1 Hifz Department (`/hifz`)
1. **Curriculum Division & Terminology**:
   - **Sabak (সবক)**: Daily new lesson. Fields: `sabak_para`, `sabak_page`, `sabak_line`, `sabak_mistakes`.
   - **Sabki (সবকি / সাত-সবক)**: Recent revisions. Fields: `sabki_para_from`, `sabki_para_to`, `sabki_mistakes`.
   - **Amukhta (আমুখতা)**: Older memorized sections. Fields: `amukhta_para_from`, `amukhta_para_to`, `amukhta_mistakes`.
   - **Dour (দৌর)**: Complete cycle revision. Fields: `dour_para_from`, `dour_para_to`, `dour_mistakes`.
   - *Strict Rule*: Amukhta and Dour must never be merged or treated as synonyms.
2. **Offline-First PWA Synchronization**:
   - Sabak entry is the single offline-capable workflow in v1.
   - Client generates a UUID (`client_uuid`) for idempotency.
   - Conflict resolution:
     - **Same teacher, same `(student_id, date)`**: Last-Write-Wins (LWW) per field with an automatic merge log.
     - **Different teachers, same `(student_id, date)`**: Server returns `409 Conflict`. Both payloads are archived in `hifz_conflicts` for head-teacher manual adjudication.
3. **Dynamic Alert Thresholds**:
   - Head teacher configures multi-criteria rules in institutional settings:
     - `> N` mistakes in a single Sabak.
     - `X` consecutive days without Sabak.
     - `Y` consecutive days without Dour.
     - `Z` consecutive days without Sabki.
     - Combined boolean conditions (AND / OR).
4. **Visual Presentation**:
   - 1–30 Juz progress route marked with Rub el Hizb (۞) motifs.
   - Virtualized page-level detail (604 pages per Quran mushaf) on student profile.

### 3.2 Academic Syllabus & Timetable (`/academic-routine`)
1. **Academic Hierarchy**:
   ```
   Stream (Qawmi | Alia)
     ├── Semester (belongs strictly to Stream)
     └── Class / Marhala (e.g. Ibtedai, Nahbemir, Hidayah, Dawra-e-Hadith)
           └── Subject (class-scoped)
                 └── Book
                       └── Book-Semester mapping (page goals)
   ```
2. **Stream Consistency**:
   - A book mapped to a semester must belong to the exact stream as that semester. Enforced by database constraint and trigger.
3. **Timetable & Scheduling**:
   - Drag-and-drop periodic table editor.
   - Automated conflict detection checking 4 vectors: `(teacher | room | class | time)`.
   - Publishing generates an immutable snapshot record in `timetable_versions`.

### 3.3 Examination & Results (`/exams`)
1. **Two-Level State Machine**:
   - **Exam-Level (`exams.status`)**:
     `DRAFT` → `MARKS_OPEN` → `MARKS_CLOSED` → `UNDER_REVIEW` → `APPROVED` → `PUBLISHED` → `ARCHIVED`.
     (Side states: `CANCELLED`, `UNPUBLISHED`).
   - **Subject-Level (`marks_submission.status`)**:
     `PENDING` → `SUBMITTED` → `AUDITED` (Side: `REJECTED` with reason back to teacher).
2. **Marks Entry & Validation**:
   - Fast, keyboard-first grid supporting arrow key navigation, Tab, Enter, Esc, and `/` search.
   - Bounds validation: `0 ≤ marks ≤ max_marks` with immediate feedback ("মার্ক ১০০-এর বেশি হতে পারে না").
   - Draft autosave persisted in browser storage.
3. **Grading & Ranking**:
   - Configurable grading schemes (Percentage, Letter Grade, GPA, Arabic Marhala).
   - Standardized `DENSE_RANK` recomputation across configurable scopes (`class`, `section`, `stream`).
4. **Re-Evaluation Workflow**:
   - State machine: `REQUESTED` → `UNDER_REVIEW` → `ACCEPTED` → `RECOMPUTED` → `REJECTED` → `CLOSED`.
   - *Integrity constraint*: Unpublishing an exam is strictly blocked while any re-evaluation request remains in progress.

### 3.4 Multi-Tenant Identity, RBAC & Break-Glass Flow
1. **Tenant Isolation**:
   - All tenant tables strictly contain `madrasa_id` (or `tenant_id`).
   - Repository-layer interceptor verifies tenant context and rejects queries missing tenant scope.
2. **Permission Keys**:
   - Granular string keys (`hifz:entry`, `exam:marks:enter`, `result:publish`, etc.) instead of hardcoded role checks.
3. **Super Admin Break-Glass Flow**:
   - Super Admin accounts have `madrasa_id = NULL`.
   - Emergency access into any tenant requires:
     - MFA re-verification.
     - Mandatory written justification (`reason`, minimum 20 characters).
     - High-severity audit entry recorded in `audit_logs`.
     - Automated alert dispatched to the tenant Muhtamim within 5 minutes.

---

## 4. Non-Functional Requirements
1. **Performance**:
   - p95 API response time < 300ms.
   - Fast mark entry table handling 150+ student rows without lag.
2. **Security & Privacy**:
   - Password hashing with Argon2id.
   - Strict XSS sanitization, CSRF double-submit protection, Helmet, and CSP.
   - Child Data Protection: Zero third-party trackers, student data retention policy with configurable purge jobs, signed guardian consent records.
3. **Auditability**:
   - Append-only `audit_logs` storing `request_id`, user ID, IP address, user agent, old value JSON, new value JSON, and reason.
4. **Design System & Localization**:
   - Section 11 "Kitabkhana" design tokens: Kagoj (`#E9E3D5`), Kali (`#17161A`), Madder (`#93321F`), Indigo (`#1F2A44`), Brass (`#A87A2E`), Slate (`#4A4A52`).
   - Multilingual: Bengali, Arabic (RTL scoped to text containers), and English.
   - Dual calendar: Gregorian + Umm al-Qura Hijri calendar toggle.
