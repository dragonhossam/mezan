/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum UserRole {
  SuperAdmin = "مدير المنصة والاشتراكات",
  Owner = "صاحب المكتب",
  Lawyer = "محامي",
  Trainee = "محام تدريب",
  Secretary = "سكرتير",
  SecretaryPlural = "سكرتارية",
  Accountant = "محاسب"
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole | string;
  avatarUrl?: string;
  isActive?: boolean;
  password?: string;
  isSuperUser?: boolean;
  permissions: {
    view: boolean;
    add: boolean;
    edit: boolean;
    delete: boolean;
    export?: boolean;
    viewFinancials?: boolean;
  };
  referredByAd?: boolean;
  utmSource?: string;
  utmCampaign?: string;
  registrationIp?: string;
  registrationDevice?: string;
  registrationLocation?: string;
  createdAt?: string;
}

export interface AuditLog {
  id: string;
  userId?: string;
  userName: string;
  userRole: UserRole | string;
  actionType?: string;
  targetType?: string;
  targetId?: string;
  targetName?: string;
  details?: string;
  action?: string;      // The descriptive text of the action
  ipAddress?: string;   // The IP address logged
  timestamp: string;
}

export interface EntranceNotification {
  id: string;
  userName: string;
  userRole: UserRole | string;
  userEmail?: string;
  timestamp: string;
  ipAddress?: string;
  deviceInfo?: string;
  location?: string;
  coordinates?: { lat: number; lng: number };
  isRead?: boolean;
  type?: "login" | "entrance" | "register" | "simulation" | "ad_visitor" | "logout";
}

export type ClientType = "فرد" | "شركة";

export interface CommunicationLog {
  id: string;
  date: string;
  time?: string;
  type: "اتصال" | "واتساب" | "مقابلة" | "بريد" | "تسجيل";
  summary: string;
  notes?: string;
  recorder?: string;
  recordedBy?: string;
}

export interface Client {
  id: string;
  name: string;
  nationalId?: string;
  phone: string;
  whatsapp?: string;
  email?: string;
  address?: string;
  type: ClientType;
  notes?: string;
  createdAt: string;
  communicationLogs: CommunicationLog[];
  interactionLogs?: any[]; // Bridge for view compatibility
  isDeleted?: boolean;
}

export type CaseType = 
  | "مدني" 
  | "جنائي" 
  | "أسرة" 
  | "تجاري" 
  | "عمالي" 
  | "إداري" 
  | "مجلس دولة" 
  | "ضرائب" 
  | "إيجارات" 
  | "تنفيذ" 
  | "استئناف" 
  | "نقض" 
  | "أخرى";

export type LitigationDegree = 
  | "أول درجة" 
  | "استئناف" 
  | "نقض" 
  | "تنفيذ" 
  | "محكمة اقتصادية" 
  | "محكمة إدارية" 
  | "محكمة الأسرة";

export type CaseStatus = 
  | "جديدة" 
  | "قيد الدراسة" 
  | "قيد التداول" 
  | "مؤجلة" 
  | "حكم لصالح العميل" 
  | "حكم ضد العميل" 
  | "استئناف" 
  | "تنفيذ" 
  | "مغلقة" 
  | "محفوظة"
  | "مكتملة"; // compatible with views

export interface TimelineEvent {
  id: string;
  date: string;
  event: string;
  type: "جلسة" | "قرار" | "مذكرة" | "أخرى";
}

export interface Case {
  id: string;
  title?: string;
  caseNumber: string; // e.g., "1234 لسنة 2024"
  year?: string;
  type?: CaseType | string;
  degree?: LitigationDegree | string;
  court: string;
  circle: string; // الدائرة
  governorate?: string; // المحافظة
  district?: string; // المركز أو القسم
  registrationDate?: string;
  filingDate?: string;
  status: CaseStatus | string;
  claimValue?: number; // قيمة المطالبة إن وجدت
  clientId: string; // العميل المرتبط
  opponents?: string; // الخصوم
  opponentName?: string;
  opponentLawyer?: string; // محامي الخصم
  assignedLawyerId: string; // المحامي المسؤول
  description?: string;
  notes?: string;
  totalFees?: number; // إجمالي الأتعاب
  paidFees?: number;
  timeline?: TimelineEvent[]; // History list
  isDeleted?: boolean;
}

export type SessionType = 
  | "جلسة محكمة" 
  | "جلسة خبير" 
  | "جلسة تحقيق" 
  | "جلسة تنفيذ" 
  | "جلسة إعلان" 
  | "مرافعة ختامية"
  | "إعادة إعلان وحضور"
  | "حجز الدعوى للحكم"
  | "نطق بالحكم"
  | "أخرى";

export interface Session {
  id: string;
  caseId: string;
  court: string;
  circle: string;
  date: string;
  time: string;
  type: SessionType | string;
  assignedLawyerId: string;
  notesBefore?: string;
  notes?: string;
  requirements?: string;
  result?: string;
  decision?: string;
  nextSessionDate?: string;
  isCompleted: boolean;
}

export type TaskPriority = "منخفضة" | "متوسطة" | "عالية" | "عاجلة";
export type TaskStatus = "لم تبدأ" | "قيد التنفيذ" | "مكتملة" | "متأخرة" | "قيد الانتظار";

export interface Task {
  id: string;
  title: string;
  caseId?: string;
  clientId?: string;
  assignedLawyerId?: string;
  assignedToId?: string;
  assignedToName?: string;
  priority: TaskPriority;
  startDate?: string;
  dueDate: string;
  createdAt?: string;
  status: TaskStatus | string;
  description: string;
}

export type DocumentType = 
  | "توكيل" 
  | "صحيفة دعوى" 
  | "مذكرة" 
  | "حكم" 
  | "محضر" 
  | "عقد" 
  | "إيصال" 
  | "مستندات العميل" 
  | "مستندات الخصم" 
  | "أخرى";

export interface DocumentVersion {
  version: number | string;
  fileName: string;
  fileSize: string;
  uploadedBy: string;
  uploadedById?: string;
  timestamp: string;
}

export interface Document {
  id: string;
  caseId: string;
  clientId?: string;
  title: string;
  type?: DocumentType | string;
  category?: string;
  fileName?: string;
  fileSize: string;
  fileUrl?: string;
  fileType?: string;
  uploadedBy?: string;
  uploadedById?: string;
  uploadedAt?: string;
  timestamp?: string;
  notes?: string;
  tags?: string[];
  versions?: DocumentVersion[];
}

export type PaymentMethod = "نقدي" | "تحويل بنكي" | "محفظة إلكترونية" | "أخرى";

export interface Payment {
  id: string;
  caseId: string;
  clientId: string;
  amount: number;
  date: string;
  method?: PaymentMethod;
  paymentMethod?: PaymentMethod | string;
  recipientId?: string; // الموظف الذي استلم
  receivedBy?: string;
  receiptNumber: string; // رقم الإيصال تلقائي أو يدوي
  notes?: string;
}

export type ExpenseCategory = 
  | "رسوم دعوى" 
  | "مكتب خبراء" 
  | "قلم المحضرين" 
  | "انتقالات ومواصلات" 
  | "طباعة وتصوير" 
  | "ضيافة" 
  | "أخرى";

export interface Expense {
  id: string;
  caseId?: string;
  clientId?: string;
  title?: string;
  type?: string;           // compatible with initialData
  category?: ExpenseCategory | string; // compatible with ExpensesView
  amount: number;
  date: string;
  employeeId?: string;     // compatible with initialData
  paidBy?: string;          // compatible with ExpensesView
  receiptNumber?: string;
  notes?: string;          // compatible with initialData
  description?: string;     // compatible with ExpensesView
}

export interface OfficeConfig {
  officeName: string;      // compatible with views
  lawyerName: string;      // compatible with views
  logoText: string;
  address: string;
  phone: string;
  email: string;
  taxNumber?: string;
  barAssociationNumber?: string; // compatible with views
  reminderSettings: {
    before7Days: boolean;
    before3Days: boolean;
    before1Day: boolean;
    sameDay: boolean;
  };
}

export type SubscriptionPlanId = "basic" | "pro" | "elite";
export type SubscriptionStatus = "trial" | "active" | "inactive" | "expired";

export interface UserSubscription {
  planId: SubscriptionPlanId;
  status: SubscriptionStatus;
  trialStartDate: string;
  trialEndDate: string;
  subscriptionStartDate: string | null;
  subscriptionEndDate: string | null;
  billingCycle: "monthly" | "yearly";
  paymentMethod: "card" | "vodafone" | "instapay" | null;
  cardDetails: {
    last4: string;
    brand: string;
    holderName: string;
  } | null;
  autoRenew: boolean;
  amountPaid: number;
}

export interface SubscriptionInvoice {
  id: string;
  date: string;
  planName: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  status: "paid" | "failed" | "refunded";
  receiptUrl?: string;
}


export interface Lead {
  id: string;
  name: string;
  phone: string;
  createdAt: string;
  status: "جديد" | "تم التواصل" | "غير مهتم";
}
