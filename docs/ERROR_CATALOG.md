# RFC 7807 Error Code Catalog — MadrasaOS AI v3.0

MadrasaOS AI returns all client and server exceptions formatted strictly according to [RFC 7807 Problem Details for HTTP APIs](https://datatracker.ietf.org/doc/html/rfc7807), using the `application/problem+json` Content-Type.

---

## Standard JSON Structure
```json
{
  "type": "https://madrasaos.ai/errors/VALIDATION_ERROR",
  "title": "ইনপুট তথ্য অসম্পূর্ণ বা ত্রুটিপূর্ণ",
  "status": 400,
  "detail": "নম্বর অবশ্যই ০ থেকে ১০০-এর মধ্যে হতে হবে।",
  "instance": "/api/v1/exams/exam_term_1/marks",
  "code": "VALIDATION_ERROR",
  "invalidParams": [
    {
      "field": "marks_obtained",
      "message": "মার্ক ১০০-এর বেশি হতে পারে না"
    }
  ]
}
```

---

## Error Catalog Table

| HTTP Status | Machine Code | Bengali Title / Description | Common Causes & Resolution |
| :---: | :--- | :--- | :--- |
| **400** | `VALIDATION_ERROR` | ইনপুট তথ্য অসম্পূর্ণ বা ত্রুটিপূর্ণ | Field validation failure (zod/joi). Correct invalid fields listed in `invalidParams`. |
| **401** | `UNAUTHENTICATED` | প্রমাণীকরণ আবশ্যক (অননুমোদিত) | Missing, expired, or invalid JWT access token. Re-authenticate at `/api/v1/auth/login`. |
| **401** | `TOKEN_REUSE_DETECTED` | সেশন চুরি বা অবৈধ টোকেন পুনঃব্যবহার সনাক্ত | A rotated refresh token family was replayed. All child tokens revoked immediately. |
| **403** | `FORBIDDEN` | পর্যাপ্ত অনুমতি নেই (অ্যাক্সেস অস্বীকৃত) | User lacks required permission key (e.g. attempting to publish results without `result:publish`). |
| **403** | `STUDENT_GUARDIAN_MISMATCH` | শুধুমাত্র নিজস্ব সন্তানের রেকর্ড দৃশ্যমান | Guardian attempted to access marksheet of an unlinked student. |
| **404** | `NOT_FOUND` | অনুরোধকৃত তথ্য ডাটাবেজে পাওয়া যায়নি | Target ID (student, exam, class, subject) does not exist in the active tenant. |
| **409** | `CONFLICT` | ডেটা দ্বন্দ্ব সনাক্ত হয়েছে | Duplicate roll number in same class, or duplicate attendance record for the same date. |
| **409** | `HIFZ_TEACHER_CONFLICT` | একই দিনে একাধিক শিক্ষকের ভিন্ন সবক এন্ট্রি | Two different teachers submitted conflicting Sabak records for the same student on the same date. Preserved in `hifz_conflicts`. |
| **409** | `PUBLISH_WHILE_LOCKED` | ফলাফল ইতোমধ্যে প্রকাশিত বা লক করা আছে | Attempted to modify marks after exam status reached `PUBLISHED`. |
| **422** | `UNPROCESSABLE` | প্রাতিষ্ঠানিক নীতিমালার লঙ্ঘন | Business rule failed (e.g. attempting to unpublish an exam while a re-evaluation request is in progress). |
| **422** | `STREAM_MISMATCH` | কিতাব ও সেমিস্টারের ধারা অমিল | Book mapped to a semester belonging to a different stream (Qawmi vs. Alia). |
| **429** | `RATE_LIMITED` | অতিরিক্ত অনুরোধ (অনুরোধের সীমা অতিক্রম) | IP or user exceeded rate limit bucket. Inspect `Retry-After` header before retrying. |
| **500** | `INTERNAL_SERVER_ERROR` | সার্ভার প্রক্রিয়াকরণে অপ্রত্যাশিত সমস্যা | Unhandled server error. Error reported to Sentry/OpenTelemetry with `X-Request-Id`. |

---

## Error Voice & Tone Policy
- Errors must explain **what happened** and **how to fix it** clearly.
- Never use apologetic phrasing ("Oops!", "Sorry!").
- Tone must be professional, direct, and authoritative in both Bengali and English.
