# MadrasaOS AI - AI Agent Architecture Specification

## Core Philosophy: Deterministic Grounding & Zero Hallucination
Madrasa administrators, accountants, and teachers cannot tolerate invented numbers or hallucinated academic records. The **MadrasaOS AI Agent Engine** does NOT allow language models to guess or fabricate facts. 

All factual claims must be resolved through **backend-authenticated tool calls** executed inside the current user's security and tenant context.

```
                    User Query (Bangla / English / Arabic)
                                      │
                                      ▼
                      [Agent Orchestrator & Guardrail]
       - Check Authentication & Tenant Context
       - User Role & Granular Permission Mapping
       - Input Sanitization & Jailbreak Defense
                                      │
                                      ▼
                      [Intent & Tool Selection Engine]
       - Parse user query
       - Map to authorized function tools
       - Verify tool permissions against RBAC policy
                                      │
                                      ▼
                         [Deterministic Tool Execution]
       ┌──────────────────────────────┼──────────────────────────────┐
       ▼                              ▼                              ▼
 `get_attendance()`             `get_fee_due()`             `get_hifz_progress()`
 Query tenant records           Query unpaid invoices       Query Sabaq/Sabqi logs
       │                              │                              │
       └──────────────────────────────┼──────────────────────────────┘
                                      │
                                      ▼
                         [Data Verification & Guardrail]
       - Ensure payload is bounded, non-empty, and strictly tenant-isolated
       - Sanitize private PII if role lacks disclosure permission
                                      │
                                      ▼
                       [Natural Language Response Synthesis]
       - Generate humanized Bangla/English summary
       - Inject structured data cards (KPIs, tables, graphs)
       - Attach Action Buttons (e.g. [View Students], [Create Report], [Export PDF])
```

---

## 1. Supported Agent Capabilities & Tools

### A. Core Deterministic Tools
| Tool Name | Permissions Required | Description |
|---|---|---|
| `getStudents(filter)` | `students:read` | Queries active/inactive students by class, branch, or enrollment status. |
| `searchStudents(query)` | `students:read` | Full-text search across student name, roll number, or guardian phone. |
| `getAttendance(date, classId)` | `attendance:read` | Summarizes daily attendance percentages, counts, and unrecorded sections. |
| `getRepeatedAbsences(days, threshold)` | `attendance:read` | Identifies students absent more than N times in the past X days. |
| `getFeeSummary(month, year)` | `fees:read` | Returns total billed, collected, and outstanding fee amounts. |
| `getOverdueFees(monthsOverdue)` | `fees:read` | Returns list of students with delinquent payments > N months. |
| `getHifzProgress(studentId, period)` | `hifz:read` | Retrieves Sabaq, Sabqi, and Manzil records with mistake metrics. |
| `getDecliningHifzStudents()` | `hifz:read` | Detects students whose daily Sabaq pages or teacher ratings dropped. |
| `getHostelStatus()` | `hostel:read` | Calculates total capacity, occupied beds, vacant rooms, and out-passes. |
| `getDailyBriefing()` | `dashboard:read` | Synthesizes an executive morning or evening digest of institution metrics. |
| `draftGuardianNotification(target)` | `notices:create` | Prepares a draft SMS or Push message requiring human confirmation. |
| `draftWorkflow(description)` | `automation:create` | Compiles a natural language request into a validated workflow graph. |

---

## 2. Daily Madrasa Briefing (সকালের সংক্ষিপ্ত বিবরণী)
Every morning and evening, the AI Agent generates an executive summary for the Madrasa Admin / Muhtamim:

```markdown
### 🌅 আজকের মাদ্রাসা ব্রিফিং (Morning Briefing)
- **মোট শিক্ষার্থী**: ১,২৪০ জন (উপস্থিত ৯৪%, অনুপস্থিত ৭৪ জন)
- **হিফজ বিভাগ**: ১৮২ জন শিক্ষার্থীর সবক রেকর্ড সম্পন্ন; ৪ জন শিক্ষার্থীর অগ্রগতিতে বিশেষ মনোযোগ প্রয়োজন।
- **আর্থিক অবস্থা**: চলতি মাসের ফি আদায় ৳৪,৮২,০০০ (বকেয়া ৳১,১২,০০০)। আজ সম্ভাব্য আদায় ৳২৮,৪০০।
- **জরুরি নোটিশ**: ৩টি ক্লাসে হাজিরা এখনো চূড়ান্ত হয়নি; ১২ জন শিক্ষার্থী টানা ৩ দিন অনুপস্থিত।

[হাজিরা দেখুন]  [বকেয়া ফি তালিকা]  [অভিভাবকদের মেসেজ ড্রাফট]
```

---

## 3. Human-in-the-Loop AI Action Lifecycle
The AI Agent is strictly prohibited from executing mutations without user confirmation:
1. **Request**: User asks: *"যারা ৩ দিনের বেশি অনুপস্থিত তাদের অভিভাবকদের মেসেজ পাঠাও।"*
2. **Analysis**: Agent executes `getRepeatedAbsences(7, 3)` -> Finds 18 students.
3. **Draft Proposal**: Agent prepares:
   - Recipient Count: 18 guardians.
   - Message Template: *"আসসালামু আলাইকুম। আপনার সন্তান [নাম] গত ৩ দিন যাবৎ মাদ্রাসায় অনুপস্থিত..."*
   - Channel: SMS / Push notification.
4. **Action Gate**: The UI renders a dedicated **Approval Card** with `[Edit Draft]`, `[Reject]`, and `[Approve & Send]`.
5. **Execution**: Upon clicking `[Approve & Send]`, the action is handed over to the Automation Engine with full audit logging.
