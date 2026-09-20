// MadrasaOS AI - Master TypeScript Domain Types

export type LanguageCode = 'bn' | 'en' | 'ar';

export type UserRoleCode =
  | 'super_admin'
  | 'madrasa_admin'
  | 'principal'
  | 'teacher'
  | 'hifz_teacher'
  | 'accountant'
  | 'hostel_manager'
  | 'librarian'
  | 'guardian'
  | 'student'
  | 'staff'
  | 'branch_manager';

export type EducationModelType =
  | 'qawmi'
  | 'alia'
  | 'hifz'
  | 'nazera'
  | 'kitab'
  | 'boarding'
  | 'general'
  | 'hybrid';

export interface User {
  id: string;
  tenantId: string;
  branchId: string;
  username: string;
  phone: string;
  email?: string;
  fullNameBn: string;
  fullNameEn: string;
  role: UserRoleCode;
  avatarUrl?: string;
  status: 'active' | 'inactive' | 'suspended';
  assignedClassIds?: string[];
  linkedStudentIds?: string[]; // for guardians
  createdAt: string;
}

export interface Institution {
  id: string;
  organizationId: string;
  nameBn: string;
  nameEn: string;
  nameAr?: string;
  code: string;
  logoUrl?: string;
  address: string;
  phone: string;
  enabledModels: EducationModelType[];
  settings: {
    hijriDateEnabled: boolean;
    currency: string;
    hifzTrackingMethod: 'sabaq_sabqi_manzil' | 'daily_sabaq_only' | 'custom';
    attendanceType: 'subject_wise' | 'daily_once';
    autoSmsGuardianOnAbsence: boolean;
    currentSessionId: string;
  };
}

export interface Branch {
  id: string;
  institutionId: string;
  nameBn: string;
  nameEn: string;
  address: string;
  phone: string;
  isMainBranch: boolean;
}

export interface AcademicSession {
  id: string;
  tenantId: string;
  nameBn: string;
  nameEn: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
}

export interface ClassRoom {
  id: string;
  tenantId: string;
  branchId: string;
  department: string;
  nameBn: string;
  nameEn: string;
  orderIndex: number;
  classTeacherId?: string;
}

export interface Student {
  id: string;
  tenantId: string;
  branchId: string;
  studentIdNumber: string;
  fullNameBn: string;
  fullNameEn: string;
  gender: 'male' | 'female';
  dateOfBirth: string;
  bloodGroup?: string;
  admissionDate: string;
  classId: string;
  classNameBn?: string;
  section: string;
  rollNumber: string;
  photoUrl?: string;
  status: 'active' | 'alumni' | 'dropped';
  isResidential: boolean;
  isHifzStudent: boolean;
  guardianNameBn: string;
  guardianPhone: string;
  guardianRelation: string;
  emergencyContact: string;
  monthlyFee: number;
  address: string;
  createdAt: string;
}

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'leave';

export interface AttendanceRecord {
  id: string;
  tenantId: string;
  branchId: string;
  classId: string;
  studentId: string;
  studentNameBn?: string;
  rollNumber?: string;
  date: string;
  status: AttendanceStatus;
  checkInTime?: string;
  remarks?: string;
  recordedByUserId: string;
}

export interface HifzRecord {
  id: string;
  tenantId: string;
  studentId: string;
  studentNameBn?: string;
  date: string;
  teacherId: string;
  teacherNameBn?: string;
  sabaqPara: number;
  sabaqSurah: string;
  sabaqAyahRange: string;
  sabaqPages: number;
  sabaqRating: 'excellent' | 'good' | 'average' | 'weak';
  sabqiPara: number;
  sabqiPages: number;
  sabqiMistakes: number;
  manzilPara: number;
  manzilMistakes: number;
  teacherNotes?: string;
  createdAt: string;
}

export interface KitabProgress {
  id: string;
  tenantId: string;
  classId: string;
  classNameBn: string;
  subjectNameBn: string;
  kitabName: string;
  teacherNameBn: string;
  date: string;
  babOrChapter: string;
  lessonTitle: string;
  pagesCompleted: number;
  totalKitabPages: number;
  percentageCompleted: number;
  remarks?: string;
}

export interface Exam {
  id: string;
  tenantId: string;
  nameBn: string;
  term: 'first_term' | 'mid_term' | 'annual';
  academicYear: string;
  startDate: string;
  endDate: string;
  isPublished: boolean;
}

export interface ExamMark {
  id: string;
  tenantId: string;
  examId: string;
  studentId: string;
  studentNameBn: string;
  rollNumber: string;
  classId: string;
  subjectNameBn: string;
  totalMarks: number;
  obtainedMarks: number;
  letterGrade: string;
  gradePoint: number;
  isAbsent: boolean;
}

export interface FeeInvoice {
  id: string;
  tenantId: string;
  invoiceNumber: string;
  studentId: string;
  studentNameBn: string;
  classNameBn: string;
  month: string;
  year: number;
  feeItems: { title: string; amount: number }[];
  totalAmount: number;
  discountAmount: number;
  paidAmount: number;
  dueAmount: number;
  status: 'paid' | 'partially_paid' | 'unpaid' | 'overdue';
  dueDate: string;
  createdAt: string;
}

export interface FeePayment {
  id: string;
  tenantId: string;
  invoiceId: string;
  paymentNumber: string;
  studentId: string;
  studentNameBn: string;
  amount: number;
  paymentMethod: 'cash' | 'bkash' | 'nagad' | 'rocket' | 'bank';
  transactionId?: string;
  status: 'pending' | 'success' | 'failed' | 'refunded';
  receivedByUserId: string;
  paidAt: string;
}

export interface ExpenseRecord {
  id: string;
  tenantId: string;
  branchId: string;
  category: 'teacher_salary' | 'food_ration' | 'utility' | 'maintenance' | 'books' | 'other';
  amount: number;
  paymentMethod: 'cash' | 'bank' | 'bkash';
  voucherNumber: string;
  payee: string;
  approvedBy: string;
  date: string;
  description: string;
}

export interface HostelRoom {
  id: string;
  tenantId: string;
  branchId: string;
  buildingName: string;
  roomNumber: string;
  floor: number;
  capacity: number;
  occupied: number;
  beds: { bedNumber: string; studentId?: string; studentNameBn?: string; status: 'occupied' | 'available' }[];
}

export interface HostelOutpass {
  id: string;
  tenantId: string;
  studentId: string;
  studentNameBn: string;
  reason: string;
  departureTime: string;
  expectedReturnTime: string;
  actualReturnTime?: string;
  status: 'pending' | 'approved' | 'returned' | 'overdue';
  approvedBy?: string;
}

export interface AdmissionApplication {
  id: string;
  tenantId: string;
  applicationNumber: string;
  applicantNameBn: string;
  applicantNameEn: string;
  dateOfBirth: string;
  guardianNameBn: string;
  guardianPhone: string;
  appliedDepartment: string;
  appliedClass: string;
  status: 'submitted' | 'under_review' | 'interview_scheduled' | 'approved' | 'rejected' | 'enrolled';
  interviewScore?: number;
  notes?: string;
  createdAt: string;
}

export interface LibraryBook {
  id: string;
  tenantId: string;
  titleBn: string;
  titleAr?: string;
  author: string;
  category: string;
  isbn?: string;
  totalCopies: number;
  availableCopies: number;
}

export interface CertificateRecord {
  id: string;
  tenantId: string;
  certificateNumber: string;
  studentId: string;
  studentNameBn: string;
  certificateType: 'student_certificate' | 'transfer_certificate' | 'hifz_sanad' | 'marksheet';
  issueDate: string;
  issuedBy: string;
  qrVerificationUrl: string;
  metadataJson: Record<string, any>;
}

export interface AuditLog {
  id: string;
  tenantId: string;
  userId: string;
  userName: string;
  userRole: string;
  action: string;
  entityName: string;
  entityId: string;
  details: string;
  timestamp: string;
  ipAddress?: string;
}

// AI Agent Types
export interface AIAgentToolCall {
  tool: string;
  parameters: Record<string, any>;
}

export interface AIAgentResponse {
  summaryBn: string;
  summaryEn?: string;
  data?: any;
  dataType?: 'attendance' | 'fees' | 'hifz' | 'students' | 'brief' | 'general';
  actions?: {
    labelBn: string;
    labelEn: string;
    actionType: 'navigate' | 'create_report' | 'draft_message' | 'export_pdf';
    payload: any;
  }[];
  sources: string[];
  requiresApproval?: boolean;
  approvalPayload?: any;
}

// Automation Engine Types
export type WorkflowTriggerType = 'event' | 'schedule' | 'webhook' | 'manual';

export interface WorkflowNode {
  id: string;
  type:
    | 'trigger:event'
    | 'trigger:schedule'
    | 'trigger:webhook'
    | 'logic:condition'
    | 'logic:filter'
    | 'control:approval'
    | 'ai:analyze'
    | 'ai:draft_message'
    | 'action:sms'
    | 'action:notification'
    | 'action:pdf_generate'
    | 'action:webhook';
  title: string;
  config: Record<string, any>;
}

export interface WorkflowConnection {
  from: string;
  to: string;
  condition?: string;
}

export interface WorkflowDefinition {
  id: string;
  tenantId: string;
  name: string;
  description: string;
  category: 'attendance' | 'fees' | 'hifz' | 'hostel' | 'academic' | 'general';
  triggerType: WorkflowTriggerType;
  isActive: boolean;
  nodes: WorkflowNode[];
  connections: WorkflowConnection[];
  createdAt: string;
  lastExecutedAt?: string;
}

export interface WorkflowExecution {
  id: string;
  tenantId: string;
  workflowId: string;
  workflowName: string;
  status: 'queued' | 'running' | 'waiting_approval' | 'completed' | 'failed';
  startedAt: string;
  finishedAt?: string;
  logs: { timestamp: string; nodeTitle: string; status: 'info' | 'success' | 'error'; message: string }[];
  error?: string;
}

export interface WorkflowApproval {
  id: string;
  tenantId: string;
  executionId: string;
  workflowName: string;
  title: string;
  description: string;
  requiredRole: UserRoleCode;
  actionPayload: any;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  decidedBy?: string;
  decidedAt?: string;
}
