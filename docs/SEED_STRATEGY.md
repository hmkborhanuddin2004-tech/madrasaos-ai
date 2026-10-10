# MadrasaOS AI v3.0 — Seed Data Strategy & Benchmark Fixtures

This document details the seed data architecture, benchmark fixture catalogs, and automated staging profiles for **MadrasaOS AI v3.0**, designed to reflect authentic Bangladeshi institutional operations.

---

## 1. Objectives & Realism Standards

Generic school data generators fail in madrasa environments because they lack Islamic academic hierarchies, boarding fund segregation, and Quranic memorization progress tracking.

The seed framework models three authentic benchmark institutions:
1. **Jamia Islamia Darul Uloom (Qawmi Stream)**: 850 students, Dars-e-Nizami curriculum aligned with **Befaqul Madarisil Arabia Bangladesh (বেফাক)**.
2. **Al-Madrasatul Aliah Model Institute (Alia Stream)**: 620 students, NCTB + Madrasa Education Board curriculum (Dakhil & Alim).
3. **Markaz Tahfizul Quran International (Hifz & Boarding)**: 310 residential students memorizing the Holy Quran.

---

## 2. Institutional Curricula & Class Fixtures

### 2.1 Qawmi Stream Hierarchy (Dars-e-Nizami / Befaq)
| Marhalah (Stage) | Class Name (BN) | Arabic Name | Kitabs / Core Subjects |
| :--- | :--- | :--- | :--- |
| **Ibtidaiyah** | তাহরির / নূরানী (নুরানী ১ম-৩য়) | الإبتدائية | কায়দা, আমপারা, তা'লিমুল ইসলাম, বাংলা, অঙ্ক |
| **Mutawassitah**| মিজান / নাহবেমীর | المتوسطة | মিজানুস সারফ, নাহবেমীর, পান্দেনামা, গুলিসাঁ |
| **Sanawiyah Ammah**| হেদায়াতুন্নাহু / কাফিয়া | الثانوية العامة | হেদায়াতুন্নাহু, কাফিয়া, কুদুরী, রওজাতুল আদব |
| **Sanawiyah Khassah**| শরহে বেকায়া | الثانوية الخاصة | শরহে বেকায়া, কানজুদ্দাক্বায়েক্ব, নূরুল আনওয়ার |
| **Fazilat** | জালালাইন / মেশকাত | الفضيلة | তাফসীরে জালালাইন, মেশকাতুল মাসাবীহ, হিদায়া |
| **Takmil** | দাওরায়ে হাদীস | التكميل | সহীহ বুখারী, সহীহ মুসলিম, তিরমিযী, আবু দাউদ |

### 2.2 Alia Stream Hierarchy (Government Board)
- **Dakhil (দাখিল ৯ম-১০ম শ্রেণী)**: কুরআন মাজীদ ও তাজবীদ, হাদীস শরীফ, ফিকহ ও আকাইদ, আরবী ১ম ও ২য় পত্র, গণিত, ইংরেজি, তথ্য ও যোগাযোগ প্রযুক্তি।
- **Alim (আলিম একাদশ-দ্বাদশ)**: তাফসীর, হাদীস, ফিকহ উসূল, ইসলামের ইতিহাস, বাংলা, ইংরেজি, পৌরনীতি।

---

## 3. Hifz Progress Fixtures & Conflict Edge Cases

### 3.1 Hifz Daily Progress Schema Fixtures
The seed generator populates realistic longitudinal memorization data over 90 days:
```json
{
  "student_id": "std_hifz_004",
  "date": "2026-10-22",
  "teacher_id": "usr_zubair",
  "sabak_para": 18,
  "sabak_page": 12,
  "sabak_line": 8,
  "sabak_mistakes": 1,
  "sabki_para": 18,
  "sabki_pages": 4.0,
  "sabki_mistakes": 2,
  "amukhta_para_from": 1,
  "amukhta_para_to": 5,
  "amukhta_mistakes": 3,
  "dour_para_from": 6,
  "dour_para_to": 10,
  "dour_mistakes": 1,
  "attendance_status": "present",
  "quality_grade": "mumtaz"
}
```

### 3.2 Pre-Loaded Multi-Teacher Conflict Scenario
To verify head-teacher dispute resolution in `hifz_conflicts`:
- **Student**: `std_004` (Mohammad Abdullah)
- **Date**: `2026-10-22`
- **Submission A (Ustadh Zubair)**: Sabak Para 18, Page 12, Line 8, 1 mistake.
- **Submission B (Ustadh Tariq)**: Sabak Para 18, Page 13, Line 1, 0 mistakes.
- **Status**: Recorded in `hifz_conflicts` awaiting Muhtamim adjudication.

---

## 4. Timetable & Exam Benchmark Scenarios

### 4.1 Timetable Conflict Vectors Fixture
- **Scenario 1 (Teacher Conflict)**: Ustadh Maulana Mahmud assigned simultaneously to Class Nahbemir (Period 2) and Class Kafiya (Period 2).
- **Scenario 2 (Room Collision)**: Darul Hadith Hall reserved simultaneously for Dawrah-e-Hadith lecture and Annual Qira'at Competition.
- **Resolution**: System flags HTTP 409 conflict and prevents snapshot publication until timetable vectors are disjoint.

### 4.2 Two-Level Examination & Re-Evaluation Lifecycle
- **Exam Cycle**: বার্ষিক পরীক্ষা ২০২৬ (Annual Exam 2026).
- **State**: `PUBLISHED` with marks locked.
- **Re-Evaluation Request**: Student `std_001` lodged review for Mishkatul Masabeeh (obtained 88/100, claimed question 3 was miscalculated).
- **Lock Protection**: Unpublish API call is strictly blocked with HTTP 422 `PUBLISH_WHILE_LOCKED` until the review is resolved by Muhtamim.

---

## 5. Financial & Ring-Fenced Fund Fixtures

### 5.1 Isolated Fund Ledgers
1. **Lillah Boarding & Orphan Fund (লিল্লাহ ফান্ড)**:
   - Reserved strictly for feeding and clothing 142 residential orphan students.
   - Non-commingled ledger: Zero balance leakage into general infrastructure accounts.
2. **General Madrasa Fund (সাধারণ তহবিল)**:
   - Monthly tuition fees (৳৫০০ — ৳১,৫০০ per student) and general donations.
3. **Waqf & Construction Fund (ওয়াকফ ও নির্মাণ ফান্ড)**:
   - Earmarked capital contributions for the new 4-story Darul Quran building.

### 5.2 Teacher & Staff Payroll Fixtures
- 28 Faculty members categorized by rank:
  - Muhtamim (Principal): ৳৩৫,০০০ / month
  - Shaikhul Hadith (Senior Professor): ৳৩০,০০০ / month
  - Ustadh / Lecturer: ৳১৮,০০০ — ৳২২,০০০ / month
  - Hifz Teacher: ৳১৫,০০০ — ৳১৮,০০০ / month
  - Khadem / Hostel Staff: ৳১০,০০০ / month
- Complete salary disallowance records for unexcused absences and provident fund deductions.
