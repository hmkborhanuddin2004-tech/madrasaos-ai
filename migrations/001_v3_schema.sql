-- =====================================================================
-- MIGRATION 001: MadrasaOS AI v3.0 Production Database Schema
-- Dialect: PostgreSQL 14+
-- Supports Multi-Tenancy, RBAC, Dual Calendars, Hifz, Timetable, Exams
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. TENANCY & IDENTITY
CREATE TABLE madrasas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    address TEXT,
    timezone VARCHAR(50) DEFAULT 'Asia/Dhaka',
    settings_jsonb JSONB DEFAULT '{}'::jsonb,
    retention_policy_jsonb JSONB DEFAULT '{"student_data_retention_years": 7, "audit_retention_years": 10}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    madrasa_id UUID REFERENCES madrasas(id) ON DELETE CASCADE,
    key VARCHAR(64) NOT NULL,
    name_bn VARCHAR(100) NOT NULL,
    name_ar VARCHAR(100),
    name_en VARCHAR(100),
    is_system BOOLEAN DEFAULT FALSE NOT NULL
);
CREATE UNIQUE INDEX idx_roles_madrasa_key ON roles(madrasa_id, key) WHERE madrasa_id IS NOT NULL;
CREATE UNIQUE INDEX idx_roles_system_key ON roles(key) WHERE madrasa_id IS NULL;

CREATE TABLE permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key VARCHAR(100) UNIQUE NOT NULL,
    description TEXT
);

CREATE TABLE role_permissions (
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    madrasa_id UUID REFERENCES madrasas(id) ON DELETE CASCADE,
    email VARCHAR(255),
    phone VARCHAR(32) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role_id UUID REFERENCES roles(id),
    status VARCHAR(32) DEFAULT 'active' NOT NULL,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at TIMESTAMPTZ
);
CREATE UNIQUE INDEX idx_users_madrasa_email ON users(madrasa_id, email) WHERE madrasa_id IS NOT NULL AND email IS NOT NULL AND deleted_at IS NULL;
CREATE UNIQUE INDEX idx_users_system_email ON users(email) WHERE madrasa_id IS NULL AND email IS NOT NULL AND deleted_at IS NULL;

CREATE TABLE teachers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    madrasa_id UUID NOT NULL REFERENCES madrasas(id) ON DELETE CASCADE,
    employee_no VARCHAR(64) NOT NULL,
    joined_at DATE NOT NULL,
    status VARCHAR(32) DEFAULT 'active' NOT NULL,
    UNIQUE (madrasa_id, employee_no)
);

-- 2. ACADEMIC STRUCTURE
CREATE TABLE streams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    madrasa_id UUID NOT NULL REFERENCES madrasas(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(32) NOT NULL CHECK (type IN ('Alia', 'Qawmi'))
);

CREATE TABLE classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    madrasa_id UUID NOT NULL REFERENCES madrasas(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    stream_id UUID NOT NULL REFERENCES streams(id) ON DELETE RESTRICT,
    year VARCHAR(16) NOT NULL,
    order_index INTEGER DEFAULT 0 NOT NULL
);

CREATE TABLE subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    madrasa_id UUID NOT NULL REFERENCES madrasas(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE
);

CREATE TABLE books (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    madrasa_id UUID NOT NULL REFERENCES madrasas(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    total_pages INTEGER DEFAULT 100 NOT NULL
);

CREATE TABLE semesters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    madrasa_id UUID NOT NULL REFERENCES madrasas(id) ON DELETE CASCADE,
    stream_id UUID NOT NULL REFERENCES streams(id) ON DELETE RESTRICT,
    name VARCHAR(100) NOT NULL,
    order_index INTEGER NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    UNIQUE (madrasa_id, stream_id, order_index)
);

CREATE TABLE book_semesters (
    book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    semester_id UUID NOT NULL REFERENCES semesters(id) ON DELETE CASCADE,
    page_goal_start INTEGER NOT NULL,
    page_goal_end INTEGER NOT NULL,
    PRIMARY KEY (book_id, semester_id)
);

-- Trigger to validate book_semesters stream-consistency
CREATE OR REPLACE FUNCTION check_book_semester_stream_match()
RETURNS TRIGGER AS $$
DECLARE
    v_book_stream_id UUID;
    v_semester_stream_id UUID;
BEGIN
    SELECT c.stream_id INTO v_book_stream_id
    FROM books b
    JOIN subjects sub ON sub.id = b.subject_id
    JOIN classes c ON c.id = sub.class_id
    WHERE b.id = NEW.book_id;

    SELECT stream_id INTO v_semester_stream_id
    FROM semesters
    WHERE id = NEW.semester_id;

    IF v_book_stream_id IS DISTINCT FROM v_semester_stream_id THEN
        RAISE EXCEPTION 'STREAM_MISMATCH: Book stream (%) must match Semester stream (%)', v_book_stream_id, v_semester_stream_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_book_semesters_stream_match
BEFORE INSERT OR UPDATE ON book_semesters
FOR EACH ROW EXECUTE FUNCTION check_book_semester_stream_match();

CREATE TABLE teacher_subjects (
    teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    PRIMARY KEY (teacher_id, subject_id)
);

-- 3. STUDENTS & GUARDIANS
CREATE TABLE students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    madrasa_id UUID NOT NULL REFERENCES madrasas(id) ON DELETE CASCADE,
    name_bn VARCHAR(200) NOT NULL,
    name_ar VARCHAR(200),
    roll_no VARCHAR(64) NOT NULL,
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE RESTRICT,
    status VARCHAR(32) DEFAULT 'active' NOT NULL,
    hijri_dob VARCHAR(32),
    gregorian_dob DATE NOT NULL,
    admitted_at DATE DEFAULT CURRENT_DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at TIMESTAMPTZ
);
CREATE UNIQUE INDEX idx_students_roll_active ON students(madrasa_id, roll_no) WHERE deleted_at IS NULL;

CREATE TABLE guardians (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    madrasa_id UUID NOT NULL REFERENCES madrasas(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    name VARCHAR(200) NOT NULL,
    relation VARCHAR(64) NOT NULL,
    phone VARCHAR(32) NOT NULL,
    email VARCHAR(255)
);

CREATE TABLE student_guardians (
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    guardian_id UUID NOT NULL REFERENCES guardians(id) ON DELETE CASCADE,
    is_primary BOOLEAN DEFAULT FALSE NOT NULL,
    PRIMARY KEY (student_id, guardian_id)
);

CREATE TABLE consent_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    guardian_id UUID NOT NULL REFERENCES guardians(id) ON DELETE RESTRICT,
    type VARCHAR(64) NOT NULL,
    recorded_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    recorded_by UUID NOT NULL REFERENCES users(id),
    evidence_file_id UUID
);

-- 4. HIFZ DEPARTMENT
CREATE TABLE hifz_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    madrasa_id UUID NOT NULL REFERENCES madrasas(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    teacher_id UUID NOT NULL REFERENCES teachers(id),
    sabak_para INTEGER DEFAULT 1,
    sabak_page INTEGER DEFAULT 1,
    sabak_line INTEGER DEFAULT 1,
    sabak_mistakes INTEGER DEFAULT 0,
    sabki_para_from INTEGER,
    sabki_para_to INTEGER,
    sabki_mistakes INTEGER DEFAULT 0,
    amukhta_para_from INTEGER,
    amukhta_para_to INTEGER,
    amukhta_mistakes INTEGER DEFAULT 0,
    dour_para_from INTEGER,
    dour_para_to INTEGER,
    dour_mistakes INTEGER DEFAULT 0,
    notes TEXT,
    is_offline_sync BOOLEAN DEFAULT FALSE NOT NULL,
    client_uuid UUID,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    UNIQUE (madrasa_id, student_id, date)
);

CREATE TABLE hifz_conflicts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    madrasa_id UUID NOT NULL REFERENCES madrasas(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    teacher_a_id UUID NOT NULL REFERENCES teachers(id),
    teacher_a_payload_jsonb JSONB NOT NULL,
    teacher_b_id UUID NOT NULL REFERENCES teachers(id),
    teacher_b_payload_jsonb JSONB NOT NULL,
    resolved_at TIMESTAMPTZ,
    resolved_by UUID REFERENCES users(id),
    resolution_jsonb JSONB
);

CREATE TABLE alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    madrasa_id UUID NOT NULL REFERENCES madrasas(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    type VARCHAR(64) NOT NULL,
    triggered_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    payload_jsonb JSONB NOT NULL,
    resolved_at TIMESTAMPTZ,
    resolved_by UUID REFERENCES users(id)
);

-- 5. TIMETABLE
CREATE TABLE rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    madrasa_id UUID NOT NULL REFERENCES madrasas(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    capacity INTEGER DEFAULT 40 NOT NULL
);

CREATE TABLE timetable_slots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    madrasa_id UUID NOT NULL REFERENCES madrasas(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    day_of_week VARCHAR(16) NOT NULL,
    period INTEGER NOT NULL,
    subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE RESTRICT,
    room_id UUID REFERENCES rooms(id) ON DELETE SET NULL,
    effective_from DATE NOT NULL,
    effective_to DATE
);

CREATE TABLE timetable_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    madrasa_id UUID NOT NULL REFERENCES madrasas(id) ON DELETE CASCADE,
    published_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    published_by UUID NOT NULL REFERENCES users(id),
    snapshot_jsonb JSONB NOT NULL
);

-- 6. EXAMS & RESULTS
CREATE TABLE exams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    madrasa_id UUID NOT NULL REFERENCES madrasas(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    type VARCHAR(32) NOT NULL CHECK (type IN ('Internal', 'Board')),
    board_name VARCHAR(100),
    stream_id UUID NOT NULL REFERENCES streams(id),
    semester_id UUID NOT NULL REFERENCES semesters(id),
    status VARCHAR(32) DEFAULT 'DRAFT' NOT NULL CHECK (status IN ('DRAFT', 'MARKS_OPEN', 'MARKS_CLOSED', 'UNDER_REVIEW', 'APPROVED', 'PUBLISHED', 'ARCHIVED', 'CANCELLED', 'UNPUBLISHED')),
    marks_open_at TIMESTAMPTZ,
    marks_close_at TIMESTAMPTZ,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE marks_submission (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES teachers(id),
    status VARCHAR(32) DEFAULT 'PENDING' NOT NULL CHECK (status IN ('PENDING', 'SUBMITTED', 'AUDITED', 'REJECTED')),
    submitted_at TIMESTAMPTZ,
    audited_at TIMESTAMPTZ,
    rejection_reason TEXT,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    UNIQUE (exam_id, subject_id)
);

CREATE TABLE exam_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    duration_min INTEGER DEFAULT 120 NOT NULL,
    room_id UUID REFERENCES rooms(id)
);

CREATE TABLE exam_attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    status VARCHAR(32) DEFAULT 'present' NOT NULL CHECK (status IN ('present', 'absent', 'late', 'excused')),
    UNIQUE (exam_id, student_id, subject_id)
);

CREATE TABLE exam_admit_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    file_id UUID,
    issued_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE exam_seat_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    seat_no VARCHAR(32) NOT NULL,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    UNIQUE (exam_id, room_id, seat_no)
);

CREATE TABLE marks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES teachers(id),
    marks_obtained NUMERIC(5,2) NOT NULL CHECK (marks_obtained >= 0),
    max_marks NUMERIC(5,2) DEFAULT 100.00 NOT NULL,
    pass_marks NUMERIC(5,2) DEFAULT 33.00 NOT NULL,
    is_absent BOOLEAN DEFAULT FALSE NOT NULL,
    entered_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    UNIQUE (exam_id, student_id, subject_id)
);

CREATE TABLE grade_schemes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    madrasa_id UUID NOT NULL REFERENCES madrasas(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    config_jsonb JSONB NOT NULL
);

CREATE TABLE results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    total_obtained NUMERIC(7,2) NOT NULL,
    total_max NUMERIC(7,2) NOT NULL,
    percentage NUMERIC(5,2) NOT NULL,
    grade VARCHAR(32) NOT NULL,
    gpa NUMERIC(3,2),
    rank_value INTEGER,
    rank_scope VARCHAR(32) DEFAULT 'class' CHECK (rank_scope IN ('class', 'section', 'stream')),
    status VARCHAR(32) DEFAULT 'DRAFT' NOT NULL,
    published_at TIMESTAMPTZ,
    approved_by UUID REFERENCES users(id),
    grade_scheme_id UUID REFERENCES grade_schemes(id),
    UNIQUE (exam_id, student_id)
);

CREATE TABLE re_evaluation_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    status VARCHAR(32) DEFAULT 'REQUESTED' NOT NULL CHECK (status IN ('REQUESTED', 'UNDER_REVIEW', 'ACCEPTED', 'RECOMPUTED', 'REJECTED', 'CLOSED')),
    requested_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    requested_by UUID NOT NULL REFERENCES users(id),
    reviewed_at TIMESTAMPTZ,
    reviewed_by UUID REFERENCES users(id),
    outcome_jsonb JSONB,
    reason TEXT NOT NULL
);

-- 7. AUDIT, SETTINGS, NOTIFICATIONS & FILES
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    madrasa_id UUID NOT NULL REFERENCES madrasas(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(64) NOT NULL,
    entity VARCHAR(64) NOT NULL,
    entity_id VARCHAR(128) NOT NULL,
    old_value_jsonb JSONB,
    new_value_jsonb JSONB,
    reason TEXT,
    request_id VARCHAR(64),
    ip VARCHAR(64),
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE settings (
    madrasa_id UUID NOT NULL REFERENCES madrasas(id) ON DELETE CASCADE,
    key VARCHAR(100) NOT NULL,
    value_jsonb JSONB NOT NULL,
    updated_by UUID REFERENCES users(id),
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    PRIMARY KEY (madrasa_id, key)
);

CREATE TABLE notification_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    madrasa_id UUID NOT NULL REFERENCES madrasas(id) ON DELETE CASCADE,
    key VARCHAR(100) NOT NULL,
    channel VARCHAR(32) NOT NULL CHECK (channel IN ('sms', 'email', 'in_app', 'whatsapp')),
    body_bn TEXT NOT NULL,
    body_ar TEXT,
    body_en TEXT,
    UNIQUE (madrasa_id, key, channel)
);

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    madrasa_id UUID NOT NULL REFERENCES madrasas(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    channel VARCHAR(32) NOT NULL,
    template_key VARCHAR(100),
    payload_jsonb JSONB,
    status VARCHAR(32) DEFAULT 'queued' NOT NULL,
    sent_at TIMESTAMPTZ,
    read_at TIMESTAMPTZ,
    error TEXT
);

CREATE TABLE notification_preferences (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    channel VARCHAR(32) NOT NULL,
    event_type VARCHAR(64) NOT NULL,
    enabled BOOLEAN DEFAULT TRUE NOT NULL,
    PRIMARY KEY (user_id, channel, event_type)
);

CREATE TABLE file_uploads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    madrasa_id UUID NOT NULL REFERENCES madrasas(id) ON DELETE CASCADE,
    owner_id UUID NOT NULL REFERENCES users(id),
    kind VARCHAR(64) NOT NULL,
    path TEXT NOT NULL,
    mime VARCHAR(100) NOT NULL,
    size BIGINT NOT NULL,
    checksum VARCHAR(64) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Indexes for maximum performance
CREATE INDEX idx_hifz_lookup ON hifz_progress(madrasa_id, student_id, date);
CREATE INDEX idx_audit_lookup ON audit_logs(madrasa_id, entity, created_at);
CREATE INDEX idx_marks_exam_subject ON marks(exam_id, subject_id);
CREATE INDEX idx_results_exam ON results(exam_id, rank_value);
