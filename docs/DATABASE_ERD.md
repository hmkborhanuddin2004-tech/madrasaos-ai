# MadrasaOS AI - Comprehensive Database Schema & ERD

## Design Principles
1. **Multi-Tenant Row-Level Scoping**: Every table belonging to an institution carries `tenant_id` and optionally `branch_id`.
2. **Referential Integrity**: Strict Foreign Key constraints on all relational joins.
3. **Audit Immutability**: Critical ledger tables (financial transactions, exam results, attendance logs) have append-only / reversal audit strategies.
4. **Soft Deletion**: `deleted_at` timestamps on primary business entities to prevent accidental data destruction.

---

## Entity Relationship Diagram (Conceptual)

```
[organizations] 1 ──< N [institutions] 1 ──< N [branches]
       │                        │                     │
       ▼                        ▼                     ▼
 [users] 1 ──< N [user_roles] 1 ──< N [roles] 1 ──< N [permissions]
   │
   ├── [teachers] 1 ──< N [classes] 1 ──< N [subjects]
   │                          │
   │                          └──< N [attendance]
   │
   ├── [guardians] 1 ──< N [student_guardians] >── 1 [students]
   │                                                    │
   │   ┌────────────────────────────────────────────────┼───────────────────────┐
   ▼   ▼                                                ▼                       ▼
[hifz_records]                                   [kitab_progress]       [hostel_allocations]
(Sabaq, Sabqi, Manzil)                           (Kitab, Bab, Lesson)   (Hostel, Room, Bed)
   │                                                    │                       │
   ▼                                                    ▼                       ▼
[exams] 1 ──< N [marks]                          [fee_invoices] 1 ──< N [fee_payments]
                                                        │                       │
                                                        ▼                       ▼
                                                [chart_of_accounts] 1 ──< N [journal_entries]

[workflows] 1 ──< N [workflow_versions] 1 ──< N [workflow_executions] 1 ──< N [approvals]
```

---

## Detailed Table Definitions

### 1. Platform & Tenant Tables
- **`organizations`**: `id` (UUID/TEXT PK), `name`, `code`, `contact_email`, `contact_phone`, `subscription_plan` (starter, pro, enterprise), `is_active`, `created_at`, `updated_at`.
- **`institutions`**: `id` (PK), `organization_id` (FK), `name_bn`, `name_en`, `name_ar`, `ein_number`, `established_year`, `logo_url`, `settings_json` (enabled models: qawmi, alia, hifz, boarding), `created_at`.
- **`branches`**: `id` (PK), `institution_id` (FK), `name_bn`, `name_en`, `address`, `phone`, `is_main_branch`, `created_at`.

### 2. Identity, RBAC & Permissions
- **`users`**: `id` (PK), `tenant_id` (FK), `branch_id` (FK), `username`, `phone` (unique), `email`, `password_hash`, `full_name_bn`, `full_name_en`, `avatar_url`, `status` (active, inactive, suspended), `last_login_at`, `created_at`.
- **`roles`**: `id` (PK), `tenant_id` (FK), `code` (super_admin, madrasa_admin, principal, teacher, hifz_teacher, accountant, hostel_manager, librarian, guardian, student), `name_bn`, `name_en`, `is_system_role`.
- **`permissions`**: `id` (PK), `code` (e.g., `students:create`, `attendance:record`, `fees:collect`, `hifz:record`, `reports:generate`, `automation:manage`), `module`, `description`.
- **`role_permissions`**: `role_id` (FK), `permission_id` (FK).
- **`user_roles`**: `user_id` (FK), `role_id` (FK), `tenant_id` (FK), `branch_id` (FK).

### 3. Academic Structure
- **`academic_sessions`**: `id` (PK), `tenant_id` (FK), `name` (e.g., 2025-2026 / ১৪৪৬-১৪৪৭ হিজরী), `start_date`, `end_date`, `is_current`.
- **`departments`**: `id` (PK), `tenant_id` (FK), `branch_id` (FK), `name_bn`, `name_en`, `model_type` (qawmi, alia, hifz, general).
- **`classes`** (Jamaat): `id` (PK), `tenant_id` (FK), `department_id` (FK), `name_bn`, `name_en`, `order_index`.
- **`sections`**: `id` (PK), `class_id` (FK), `name` (Alif, Ba, Jim / A, B), `capacity`, `class_teacher_id` (FK to teachers).
- **`subjects`**: `id` (PK), `class_id` (FK), `name_bn`, `name_ar`, `name_en`, `code`, `total_marks`, `pass_marks`.

### 4. Students & Guardians
- **`students`**: `id` (PK), `tenant_id` (FK), `branch_id` (FK), `student_id_number` (unique), `full_name_bn`, `full_name_en`, `full_name_ar`, `gender`, `date_of_birth`, `blood_group`, `admission_date`, `department_id` (FK), `class_id` (FK), `section_id` (FK), `roll_number`, `photo_url`, `status` (active, alumni, dropped), `is_residential` (boolean), `is_hifz_student` (boolean), `created_at`, `deleted_at`.
- **`guardians`**: `id` (PK), `tenant_id` (FK), `full_name_bn`, `full_name_en`, `relation_type` (father, mother, uncle, other), `phone_primary` (unique per tenant), `phone_secondary`, `nid_number`, `occupation`, `address`, `user_id` (FK optional).
- **`student_guardians`**: `student_id` (FK), `guardian_id` (FK), `is_primary_contact`.

### 5. Smart Attendance
- **`attendance_sessions`**: `id` (PK), `tenant_id` (FK), `branch_id` (FK), `class_id` (FK), `section_id` (FK), `date`, `recorded_by_user_id` (FK), `submitted_at`, `sync_status` (synced, offline_queued).
- **`attendance_records`**: `id` (PK), `session_id` (FK), `student_id` (FK), `status` (present, absent, late, leave), `check_in_time`, `remarks`.

### 6. Dedicated Hifz Management
- **`hifz_records`**: `id` (PK), `tenant_id` (FK), `student_id` (FK), `teacher_id` (FK), `date`, `sabaq_para`, `sabaq_surah`, `sabaq_ayah_from`, `sabaq_ayah_to`, `sabaq_pages`, `sabaq_grade` (excellent, good, average, weak), `sabqi_para`, `sabqi_pages`, `sabqi_mistakes`, `manzil_para`, `manzil_mistakes`, `teacher_notes`, `created_at`.
- **`hifz_student_summary`**: `student_id` (PK), `current_para`, `completed_paras`, `memorization_percentage`, `overall_trend` (improving, steady, declining), `last_updated_at`.

### 7. Kitab & Academic Progress
- **`kitab_progress`**: `id` (PK), `tenant_id` (FK), `class_id` (FK), `subject_id` (FK), `teacher_id` (FK), `date`, `kitab_name`, `bab_chapter`, `lesson_title`, `pages_completed`, `remarks`.

### 8. Examinations & Results
- **`exams`**: `id` (PK), `tenant_id` (FK), `session_id` (FK), `name_bn`, `name_en`, `term` (first_term, mid_term, final), `start_date`, `end_date`, `is_published`.
- **`exam_schedules`**: `id` (PK), `exam_id` (FK), `class_id` (FK), `subject_id` (FK), `exam_date`, `total_marks`.
- **`marks`**: `id` (PK), `exam_id` (FK), `student_id` (FK), `subject_id` (FK), `obtained_marks`, `grade_point`, `letter_grade`, `is_absent`, `evaluated_by_id` (FK).

### 9. Fees, Invoices & Digital Payments
- **`fee_types`**: `id` (PK), `tenant_id` (FK), `name_bn`, `name_en`, `frequency` (one_time, monthly, yearly), `default_amount`.
- **`invoices`**: `id` (PK), `tenant_id` (FK), `invoice_number` (unique), `student_id` (FK), `month`, `year`, `total_amount`, `discount_amount`, `paid_amount`, `due_amount`, `status` (unpaid, partially_paid, paid, overdue), `due_date`, `created_at`.
- **`invoice_items`**: `id` (PK), `invoice_id` (FK), `fee_type_id` (FK), `amount`.
- **`payments`**: `id` (PK), `tenant_id` (FK), `invoice_id` (FK), `payment_number` (unique), `amount`, `payment_method` (cash, bkash, nagad, rocket, bank_transfer), `transaction_id`, `provider_reference`, `payment_status` (pending, success, failed, refunded), `received_by_user_id` (FK), `paid_at`, `created_at`.
- **`expenses`**: `id` (PK), `tenant_id` (FK), `branch_id` (FK), `category` (teacher_salary, food_ration, utility, maintenance, book_purchase), `amount`, `payment_method`, `voucher_number`, `payee`, `approved_by_user_id` (FK), `date`, `description`.

### 10. Hostel / Boarding
- **`hostels`**: `id` (PK), `tenant_id` (FK), `branch_id` (FK), `name_bn`, `name_en`, `building_number`, `warden_id` (FK).
- **`rooms`**: `id` (PK), `hostel_id` (FK), `room_number`, `floor`, `bed_capacity`.
- **`beds`**: `id` (PK), `room_id` (FK), `bed_number`, `status` (available, occupied, maintenance).
- **`hostel_allocations`**: `id` (PK), `student_id` (FK), `bed_id` (FK), `allocated_from`, `allocated_to`, `status` (active, vacated).
- **`hostel_outpasses`**: `id` (PK), `student_id` (FK), `reason`, `departure_time`, `expected_return_time`, `actual_return_time`, `status` (pending, approved, returned), `approved_by` (FK).

### 11. Admissions Funnel
- **`admissions`**: `id` (PK), `tenant_id` (FK), `application_number` (unique), `applicant_name_bn`, `applicant_name_en`, `guardian_name`, `guardian_phone`, `applied_program` (qawmi, alia, hifz), `applied_class_id` (FK), `status` (submitted, under_review, interview_scheduled, approved, rejected, enrolled), `interview_score`, `created_at`.

### 12. Library Circulation
- **`books`**: `id` (PK), `tenant_id` (FK), `title_bn`, `title_ar`, `title_en`, `author`, `isbn`, `category`, `total_copies`, `available_copies`.
- **`library_loans`**: `id` (PK), `book_id` (FK), `student_id` (FK optional), `teacher_id` (FK optional), `issue_date`, `due_date`, `return_date`, `fine_amount`, `status` (issued, returned, overdue).

### 13. Audit & Security Trail
- **`audit_logs`**: `id` (PK), `tenant_id` (FK), `user_id` (FK), `action` (create, update, delete, login, export, permission_change), `entity_name`, `entity_id`, `old_values_json`, `new_values_json`, `ip_address`, `user_agent`, `created_at`.

### 14. Automation & Workflows
- **`workflows`**: `id` (PK), `tenant_id` (FK), `name`, `description`, `trigger_type` (event, schedule, webhook), `is_active`, `created_by_user_id` (FK), `created_at`, `updated_at`.
- **`workflow_versions`**: `id` (PK), `workflow_id` (FK), `version_number`, `definition_json` (nodes, connections, conditions, actions), `created_at`.
- **`workflow_executions`**: `id` (PK), `workflow_version_id` (FK), `tenant_id` (FK), `status` (queued, running, waiting_approval, completed, failed, cancelled), `trigger_event_payload`, `logs_json`, `started_at`, `finished_at`.
- **`workflow_approvals`**: `id` (PK), `execution_id` (FK), `tenant_id` (FK), `action_payload`, `requested_role`, `assigned_to_user_id`, `status` (pending, approved, rejected), `decided_at`, `remarks`.
- **`automation_connections`**: `id` (PK), `tenant_id` (FK), `provider` (bkash, nagad, sms_bd, email_smtp, telegram), `encrypted_credentials`, `is_active`, `last_tested_at`.

### 15. AI Operations
- **`ai_conversations`**: `id` (PK), `tenant_id` (FK), `user_id` (FK), `title`, `created_at`.
- **`ai_messages`**: `id` (PK), `conversation_id` (FK), `sender` (user, assistant, system), `content`, `tool_calls_json`, `created_at`.
- **`ai_tool_logs`**: `id` (PK), `tenant_id` (FK), `user_id` (FK), `tool_name`, `input_args`, `output_summary`, `execution_time_ms`, `created_at`.
