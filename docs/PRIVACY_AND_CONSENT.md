# MadrasaOS AI v3.0 — Privacy, Data Retention & Child Consent Framework

This document defines the child protection standards, guardian consent lifecycle, biometric & PII handling policies, and data retention rules enforced by **MadrasaOS AI v3.0** in compliance with Bangladeshi legal standards and Islamic institutional ethics.

---

## 1. Regulatory Context & Institutional Ethics

Madrasa education in Bangladesh accommodates over 4 million students, a significant percentage of whom are minors residing in residential boarding hostels (Lillah Boarding, Hifz Khana).

MadrasaOS AI complies with:
1. **The Children Act, 2013 (Bangladesh)**: Safeguarding the identity, dignity, and private information of minors.
2. **Digital Security Act (DSA) / Cyber Security Act (CSA) of Bangladesh**: Protection of biometric, identity, and personal records against unauthorized disclosure or manipulation.
3. **Amanah (Trust) Principle**: Institutional custodianship of student health records, orphan status, and financial vulnerability details.

---

## 2. Guardian Consent Lifecycle & `consent_records` Schema

No minor student (< 18 years old) may have their photograph published, biometric data recorded, medical record logged, or exam results displayed publicly without an active, verified guardian consent record.

### 2.1 Consent Entity Schema (`consent_records`)
```sql
CREATE TABLE IF NOT EXISTS consent_records (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL,
  guardian_id TEXT NOT NULL,
  type TEXT NOT NULL,              -- 'admission', 'photo_publish', 'medical_disclosure', 'sms_broadcast'
  recorded_at TEXT NOT NULL,       -- ISO 8601 UTC
  recorded_by TEXT NOT NULL,       -- Staff User ID who verified signature/thumbprint
  evidence_file_id TEXT,          -- Scanned physical admission form or voice confirmation file ID
  status TEXT DEFAULT 'ACTIVE',    -- 'ACTIVE', 'REVOKED', 'EXPIRED'
  revoked_at TEXT,
  revocation_reason TEXT,
  FOREIGN KEY (student_id) REFERENCES students(id),
  FOREIGN KEY (guardian_id) REFERENCES guardians(id)
);
```

### 2.2 Consent Types & Scope
| Consent Type Key | Purpose | Mandatory For Admission? | Revocable By Guardian? |
| :--- | :--- | :---: | :---: |
| `admission_academic` | Core student record keeping, routine management, and exam assessment. | **Yes** | No (requires formal student withdrawal). |
| `residential_boarding`| Emergency medical authorization, hostel overnight stay, and guardian gate pass. | Yes (for Boarding) | No while enrolled in residential program. |
| `sms_broadcast` | Automated SMS notifications for daily absence, fee dues, and emergency notices. | No (Opt-out possible) | **Yes** via guardian portal or Madrasa office. |
| `photo_publication` | Publishing student achievement photos on madrasa website, annual yearbook, or banners. | **No** (Strictly optional)| **Yes** at any time. |

---

## 3. PII & Sensitive Data Protection Standards

### 3.1 Ring-Fenced Sensitive Attributes
The following student and guardian fields are classified as **Tier 1 Confidential** and encrypted at rest with AES-256-GCM:
- Guardian National Identity Card (NID) number / Smart Card number
- Orphan / Lillah aid status (`is_orphan`, `zakat_eligible`, `lillah_stipend_amount`)
- Student medical conditions, chronic illnesses, and doctor prescriptions
- Voice notes recorded during oral Hifz evaluations

### 3.2 Access Controls & Segregation of Duties
- Teachers only view academic, attendance, and Hifz marks of students in their assigned classes.
- Lillah and Zakat eligibility details are visible **only** to the Madrasa Muhtamim (Principal) and authorized Chief Accountant. Teachers have zero access to student poverty classifications to prevent stigma or discrimination in the classroom.
- Guardians can only view records for their verified linked children (`linked_student_ids`).

---

## 4. Data Retention & Archiving Schedule

```
  ┌─────────────────────────────────────────────────────────────────────────────┐
  │                               Student Lifecycle                             │
  │                                                                             │
  │  [ Active Student ] ──► [ Graduated / Alim / Hafez ] ──► [ Permanent Archive]
  │           │                                                                 │
  │           └──────────► [ Withdrawn / Expelled ] ──► [ 3-Yr Grace Period ]   │
  │                                                             │               │
  │                                                             ▼               ▼
  │                                                      [ Purge PII ]     [ Anonymize ]
  └─────────────────────────────────────────────────────────────────────────────┘
```

### 4.1 Retention Timeframes
| Category | Retention Duration | Post-Retention Action | Justification |
| :--- | :--- | :--- | :--- |
| **Sanad & Graduation Records** | **Permanent (Indefinite)** | Preserved in immutable historical ledger | Verification of Dawat-e-Hadith, Alim, and Hifz certificates for lifetime credentialing. |
| **Tabulation Sheets & Mark Registers** | 25 Years | Compressed Cold Storage | Academic verification for higher education and Befaq/Alia board records. |
| **Daily Attendance & Daily Hifz Logs** | 5 Years after departure | Aggregated into annual summaries, raw logs purged | System capacity optimization while retaining longitudinal attendance trends. |
| **Fee Invoices & Donation Receipts** | 10 Years | Tax and statutory audit archive | Compliance with Bangladesh National Board of Revenue (NBR) audit requirements. |
| **Withdrawn / Expelled Student PII** | 3 Years after formal exit | Cryptographically scrubbed (`SHRED_PII`) | Resolves pending fee dues or readmission disputes within statutory limitation window. |

---

## 5. Right to Erasure & Rectification Protocol

When a student departs the institution:
1. The guardian submits a formal written request or verified SMS token for record closure.
2. The Madrasa Administrator initiates the erasure workflow:
   - Photographs and scanned identity documents are permanently deleted from object storage.
   - Phone numbers and addresses are replaced with anonymized hashes (`SHA256(phone + salt)`).
   - Core academic completion credentials (Sanad, Exam Ranks, Passing Year) remain permanently linked to the unique Registration Number without public contact vectors.
3. An audit log entry (`STUDENT_DATA_PURGED`) is permanently retained with the authorizing official's credentials.
