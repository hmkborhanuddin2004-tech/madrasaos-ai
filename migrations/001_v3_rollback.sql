-- =====================================================================
-- ROLLBACK 001: MadrasaOS AI v3.0 Rollback Script
-- Drops all tables, triggers, and types in reverse dependency order
-- =====================================================================

DROP TRIGGER IF EXISTS trg_book_semesters_stream_match ON book_semesters;
DROP FUNCTION IF EXISTS check_book_semester_stream_match();

DROP TABLE IF EXISTS file_uploads CASCADE;
DROP TABLE IF EXISTS notification_preferences CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS notification_templates CASCADE;
DROP TABLE IF EXISTS settings CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;

DROP TABLE IF EXISTS re_evaluation_requests CASCADE;
DROP TABLE IF EXISTS results CASCADE;
DROP TABLE IF EXISTS grade_schemes CASCADE;
DROP TABLE IF EXISTS marks CASCADE;
DROP TABLE IF EXISTS exam_seat_plans CASCADE;
DROP TABLE IF EXISTS exam_admit_cards CASCADE;
DROP TABLE IF EXISTS exam_attendance CASCADE;
DROP TABLE IF EXISTS exam_schedules CASCADE;
DROP TABLE IF EXISTS marks_submission CASCADE;
DROP TABLE IF EXISTS exams CASCADE;

DROP TABLE IF EXISTS timetable_versions CASCADE;
DROP TABLE IF EXISTS timetable_slots CASCADE;
DROP TABLE IF EXISTS rooms CASCADE;

DROP TABLE IF EXISTS alerts CASCADE;
DROP TABLE IF EXISTS hifz_conflicts CASCADE;
DROP TABLE IF EXISTS hifz_progress CASCADE;

DROP TABLE IF EXISTS consent_records CASCADE;
DROP TABLE IF EXISTS student_guardians CASCADE;
DROP TABLE IF EXISTS guardians CASCADE;
DROP TABLE IF EXISTS students CASCADE;

DROP TABLE IF EXISTS teacher_subjects CASCADE;
DROP TABLE IF EXISTS book_semesters CASCADE;
DROP TABLE IF EXISTS semesters CASCADE;
DROP TABLE IF EXISTS books CASCADE;
DROP TABLE IF EXISTS subjects CASCADE;
DROP TABLE IF EXISTS classes CASCADE;
DROP TABLE IF EXISTS streams CASCADE;

DROP TABLE IF EXISTS teachers CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS role_permissions CASCADE;
DROP TABLE IF EXISTS permissions CASCADE;
DROP TABLE IF EXISTS roles CASCADE;
DROP TABLE IF EXISTS madrasas CASCADE;
