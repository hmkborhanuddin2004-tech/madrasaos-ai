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

export type LedgerType = 'residential' | 'non_residential';

export type DonorCategory = 'permanent' | 'annual' | 'one_time' | 'anonymous';
export type CommitmentFrequency = 'monthly' | 'annual' | 'one_time' | 'none';

export interface Donor {
  id: string;
  organizationId?: string;
  tenantId?: string;
  name: string;
  orgName?: string;
  category: DonorCategory;
  contactPhone?: string;
  whatsapp?: string;
  email?: string;
  commitmentFrequency: CommitmentFrequency;
  createdAt: string;
}

export type DonationFundType = 'lillah_orphan' | 'general' | 'waqf_construction';

export interface DonationReceipt {
  id: string;
  organizationId?: string;
  tenantId?: string;
  receiptNo: string;
  donorId: string;
  donorName?: string;
  fundType: DonationFundType;
  amount: number;
  paymentMethod: 'cash' | 'bkash' | 'nagad' | 'rocket' | 'bank';
  paymentReference?: string;
  notes?: string;
  createdAt: string;
}

export interface BankAccount {
  id: string;
  organizationId?: string;
  tenantId?: string;
  bankName: string;
  accountNumber: string;
  branchName: string;
  currentBalance: number;
  createdAt: string;
}

export interface CashBookDaily {
  id: string;
  organizationId?: string;
  tenantId?: string;
  date: string;
  openingBalance: number;
  cashCollections: number;
  cashExpenses: number;
  bankDeposits: number;
  closingBalance: number;
  createdAt: string;
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
  ledgerType: LedgerType;
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

export type StaffDesignation =
  | 'muhtamim'
  | 'shaykhul_hadith'
  | 'senior_muhaddis'
  | 'kitab_teacher'
  | 'hifz_teacher'
  | 'nazir_office'
  | 'cook_hostel'
  | 'security';

export type PayrollStatus =
  | 'draft'
  | 'accountant_verified'
  | 'muhtamim_approved'
  | 'disbursed';

export type PayrollDisbursementMethod = 'cash' | 'bank' | 'bkash' | 'nagad';

export interface StaffPayrollProfile {
  id: string;
  organization_id: string;
  user_id?: string;
  staff_name: string;
  designation: StaffDesignation;
  base_salary: number;
  housing_allowance: number;
  food_allowance: number;
  bonus_allowance: number;
  advance_loan_deduction: number;
  payment_method: PayrollDisbursementMethod;
  account_details?: string;
  status?: 'active' | 'inactive';
  created_at: string;
}

export interface PayrollVoucher {
  id: string;
  organization_id: string;
  voucher_number: string;
  profile_id: string;
  staff_name: string;
  designation: StaffDesignation;
  month: string;
  year: number;
  base_salary: number;
  housing_allowance: number;
  food_allowance: number;
  bonus_allowance: number;
  advance_loan_deduction: number;
  absent_deduction: number;
  net_payable: number;
  status: PayrollStatus;
  verified_by?: string;
  approved_by?: string;
  disbursed_by?: string;
  disbursement_method?: PayrollDisbursementMethod;
  transaction_reference?: string;
  qr_code_token?: string;
  disbursed_at?: string;
  created_at: string;
}

export interface PayslipData {
  voucher: PayrollVoucher;
  profile?: StaffPayrollProfile;
  organizationName: string;
  institutionNameBn: string;
  qrVerificationUrl: string;
  qrCodeToken: string;
  generatedAt: string;
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
  status: 'pending' | 'approved' | 'rejected' | 'pending_approval';
  createdAt: string;
  decidedBy?: string;
  decidedAt?: string;
}

// Multi-Channel Notification & Automation Engine Types (Milestone 3)
export type NotificationChannel = 'sms' | 'whatsapp' | 'messenger' | 'email';

export type SmsProvider = 'ssl_wireless' | 'greenweb' | 'onnorokom' | 'brevo';

export interface SmsCalculationResult {
  isUnicode: boolean;
  charCount: number;
  partsCount: number;
  maxCharsPerPart: number;
  encoding: 'GSM-7' | 'Bengali-Unicode';
}

export interface NotificationDispatchResult {
  success: boolean;
  messageId: string;
  channel: NotificationChannel;
  recipient: string;
  balanceRemaining?: number;
  partsCount?: number;
  quotaUsedToday?: number;
  error?: string;
  details?: any;
  timestamp?: string;
}

export interface INotificationAdapter {
  readonly channel: NotificationChannel;
  send(to: string, message: string, metadata?: any): Promise<NotificationDispatchResult>;
  getTelemetry(): Promise<any>;
}

export type WhatsAppTemplateName =
  | 'attendance_alert'
  | 'sabaq_progress'
  | 'fee_overdue'
  | 'general_notice';

export interface WhatsAppTemplatePayload {
  templateName: WhatsAppTemplateName;
  languageCode?: string;
  parameters: Record<string, string | number>;
}

export interface EmailAttachment {
  name: string;
  content: string; // Base64 encoded or string
  contentType?: string;
}

export interface BroadcastNotificationRequest {
  recipients: string[];
  content: string;
  channels?: NotificationChannel[];
  preferredChannel?: NotificationChannel;
  templateName?: string;
  metadata?: Record<string, any>;
}

export interface BroadcastApprovalResponse {
  status: 'pending_approval' | 'dispatched';
  approvalId?: string;
  recipientCount: number;
  sentCount?: number;
  message?: string;
  results?: NotificationDispatchResult[];
}

export interface NotificationTelemetry {
  sms: {
    provider: string;
    balanceRemaining: number;
    totalSent: number;
    status: string;
  };
  whatsapp: {
    provider: string;
    activeSessions: number;
    totalSent: number;
    status: string;
  };
  messenger: {
    provider: string;
    pageConnected: boolean;
    totalSent: number;
    status: string;
  };
  email: {
    provider: string;
    dailyQuota: number;
    dailyQuotaUsed: number;
    dailyQuotaRemaining: number;
    totalSent: number;
    status: string;
  };
}

// Befaq Board Types
export type BefaqMarhalah =
  | 'takmil'
  | 'fazilat'
  | 'sanabia_ulya'
  | 'mutawassita'
  | 'ibtidaiyah'
  | 'hifzul_quran'
  | 'qiraat';

export type BefaqDivision = 'mumtaz' | 'jayyid_jiddan' | 'jayyid' | 'maqbool' | 'rasib';

export interface BefaqRegistration {
  id: string;
  tenant_id: string;
  student_id: string;
  student_name_bn?: string;
  marhalah: BefaqMarhalah;
  roll_number: string;
  registration_number: string;
  session_year: number;
  exam_center: string;
  status: 'registered' | 'admit_issued' | 'passed' | 'failed';
  total_marks?: number;
  division?: BefaqDivision;
  sanad_number?: string;
  created_at: string;
}

// Muhasaba & Daily Amal Types
export interface MuhasabaRecord {
  id: string;
  tenant_id: string;
  student_id: string;
  student_name_bn?: string;
  date: string;
  fajr: number;
  dhuhr: number;
  asr: number;
  maghrib: number;
  isha: number;
  tahajjud: number;
  tilawat_pages: number;
  duas_read: number;
  truthfulness_score: number;
  adab_score: number;
  total_score: number;
  notes?: string;
  verified_by_user_id?: string;
  created_at: string;
}

// Canteen & Mess Inventory Types
export type CanteenCategory = 'rice' | 'pulse' | 'oil' | 'spices' | 'vegetable' | 'meat_fish' | 'groceries';

export interface CanteenInventoryItem {
  id: string;
  tenant_id: string;
  item_name_bn: string;
  category: CanteenCategory;
  unit: string;
  current_stock: number;
  min_stock_alert: number;
  unit_price: number;
  updated_at: string;
}

export interface CanteenTransaction {
  id: string;
  tenant_id: string;
  type: 'purchase_inflow' | 'consumption_outflow';
  item_id: string;
  item_name_bn?: string;
  quantity: number;
  total_cost: number;
  supplier_name?: string;
  voucher_no: string;
  date: string;
  notes?: string;
  created_at: string;
}

export interface CanteenMealLog {
  id: string;
  tenant_id: string;
  date: string;
  meal_type: 'breakfast' | 'lunch' | 'dinner';
  menu_description: string;
  headcount_students: number;
  headcount_staff: number;
  total_cost: number;
  prepared_by: string;
  created_at: string;
}

// Class Routine Types
export interface ClassRoutine {
  id: string;
  tenant_id: string;
  branch_id: string;
  class_id: string;
  class_name_bn?: string;
  day_of_week: string; // 'Saturday' | 'Sunday' | 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday'
  period_number: number;
  start_time: string;
  end_time: string;
  subject_name_bn: string;
  teacher_id?: string;
  teacher_name_bn: string;
  room_number: string;
}

// Voice SMS Types
export interface VoiceBroadcast {
  id: string;
  tenant_id: string;
  title: string;
  audio_url_or_tts_text: string;
  recipients_count: number;
  channel: 'voice_sms';
  status: 'sent' | 'processing' | 'failed';
  sent_at: string;
  created_by: string;
}

// Institution Customization & Settings Types
export interface LateFeeSettings {
  grace_days: number;
  amount: number;
  type: 'fixed' | 'daily' | 'percentage';
  description?: string;
}

export interface SecuritySettings {
  two_factor_auth?: boolean;
  password_expiry_days?: number;
  session_timeout_minutes?: number;
  ip_restriction?: boolean;
}

export interface InstitutionSettings {
  id: string;
  tenantId: string;
  nameBn: string;
  nameEn: string;
  principalName?: string;
  logoUrl?: string;
  address?: string;
  email?: string;
  phone?: string;
  establishedYear?: number;
  madrasaType: 'Qawmi' | 'Alia' | 'Hifz' | 'Mixed';
  tagline?: string;
  primaryColor: string;
  currencySymbol: string;
  hijriYearEnabled: boolean;
  academicYearType: 'hijri' | 'gregorian';
  smsSenderId?: string;
  brevoApiKey?: string;
  geminiApiKey?: string;
  whatsappEnabled: boolean;
  messengerEnabled: boolean;
  emailEnabled: boolean;
  lateFeeSettings: LateFeeSettings;
  designationLabels: Record<string, string>;
  customDepartments: string[];
  securitySettings?: SecuritySettings;
  createdAt: string;
  updatedAt: string;
}

export interface FeeCategory {
  id: string;
  tenantId: string;
  nameBn: string;
  nameEn: string;
  amount: number;
  frequency: 'monthly' | 'yearly' | 'one_time' | 'per_term';
  ledgerType?: 'residential' | 'non_residential';
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ClassDefinition {
  id: string;
  tenantId: string;
  nameBn: string;
  nameEn: string;
  orderIndex: number;
  department?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SubjectDefinition {
  id: string;
  tenantId: string;
  classId?: string;
  nameBn: string;
  nameEn: string;
  code?: string;
  totalMarks: number;
  passMarks: number;
  createdAt: string;
  updatedAt: string;
}

