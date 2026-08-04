import { relations } from 'drizzle-orm';
import { pgTable, text, timestamp, boolean, jsonb, integer, real, index, varchar } from 'drizzle-orm/pg-core';

export const offices = pgTable('offices', {
  id: text('id').primaryKey(),
  name: text('name'),
  lawyerName: text('lawyer_name'),
  logoText: text('logo_text'),
  address: text('address'),
  phone: text('phone'),
  email: text('email'),
  taxNumber: text('tax_number'),
  barAssociationNumber: text('bar_association_number'),
  reminderSettings: jsonb('reminder_settings'),
  subscription: jsonb('subscription'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  officeId: text('office_id').references(() => offices.id),
  name: text('name').notNull(),
  email: text('email').notNull(),
  role: text('role'),
  avatarUrl: text('avatar_url'),
  isActive: boolean('is_active').default(true),
  password: text('password'),
  isSuperUser: boolean('is_super_user').default(false),
  permissions: jsonb('permissions'),
  referredByAd: boolean('referred_by_ad'),
  utmSource: text('utm_source'),
  utmCampaign: text('utm_campaign'),
  registrationIp: text('registration_ip'),
  registrationDevice: text('registration_device'),
  registrationLocation: text('registration_location'),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  officeIdx: index('users_office_idx').on(table.officeId),
}));

export const clients = pgTable('clients', {
  id: text('id').primaryKey(),
  officeId: text('office_id').notNull().references(() => offices.id),
  name: text('name').notNull(),
  nationalId: text('national_id'),
  phone: text('phone'),
  whatsapp: text('whatsapp'),
  email: text('email'),
  address: text('address'),
  type: text('type'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
  communicationLogs: jsonb('communication_logs'),
  interactionLogs: jsonb('interaction_logs'),
  isDeleted: boolean('is_deleted').default(false),
}, (table) => ({
  officeIdx: index('clients_office_idx').on(table.officeId),
}));

export const cases = pgTable('cases', {
  id: text('id').primaryKey(),
  officeId: text('office_id').notNull().references(() => offices.id),
  clientId: text('client_id').notNull().references(() => clients.id),
  title: text('title'),
  caseNumber: text('case_number'),
  year: text('year'),
  type: text('type'),
  degree: text('degree'),
  court: text('court'),
  circle: text('circle'),
  governorate: text('governorate'),
  district: text('district'),
  registrationDate: text('registration_date'),
  filingDate: text('filing_date'),
  status: text('status'),
  claimValue: real('claim_value'),
  opponents: text('opponents'),
  opponentName: text('opponent_name'),
  opponentLawyer: text('opponent_lawyer'),
  assignedLawyerId: text('assigned_lawyer_id'),
  description: text('description'),
  notes: text('notes'),
  totalFees: real('total_fees'),
  paidFees: real('paid_fees'),
  timeline: jsonb('timeline'),
  isDeleted: boolean('is_deleted').default(false),
}, (table) => ({
  officeIdx: index('cases_office_idx').on(table.officeId),
  clientIdx: index('cases_client_idx').on(table.clientId),
}));

export const courtSessions = pgTable('court_sessions', {
  id: text('id').primaryKey(),
  officeId: text('office_id').notNull().references(() => offices.id),
  caseId: text('case_id').notNull().references(() => cases.id),
  court: text('court'),
  circle: text('circle'),
  date: text('date'),
  time: text('time'),
  type: text('type'),
  assignedLawyerId: text('assigned_lawyer_id'),
  notesBefore: text('notes_before'),
  notes: text('notes'),
  requirements: text('requirements'),
  result: text('result'),
  decision: text('decision'),
  nextSessionDate: text('next_session_date'),
  isCompleted: boolean('is_completed').default(false),
}, (table) => ({
  officeIdx: index('court_sessions_office_idx').on(table.officeId),
  caseIdx: index('court_sessions_case_idx').on(table.caseId),
}));

export const tasks = pgTable('tasks', {
  id: text('id').primaryKey(),
  officeId: text('office_id').notNull().references(() => offices.id),
  title: text('title').notNull(),
  caseId: text('case_id'),
  clientId: text('client_id'),
  assignedLawyerId: text('assigned_lawyer_id'),
  assignedToId: text('assigned_to_id'),
  assignedToName: text('assigned_to_name'),
  priority: text('priority'),
  startDate: text('start_date'),
  dueDate: text('due_date'),
  createdAt: text('created_at'),
  status: text('status'),
  description: text('description'),
}, (table) => ({
  officeIdx: index('tasks_office_idx').on(table.officeId),
}));

export const documents = pgTable('documents', {
  id: text('id').primaryKey(),
  officeId: text('office_id').notNull().references(() => offices.id),
  caseId: text('case_id'),
  clientId: text('client_id'),
  title: text('title'),
  type: text('type'),
  category: text('category'),
  fileName: text('file_name'),
  fileSize: text('file_size'),
  fileUrl: text('file_url'),
  fileType: text('file_type'),
  uploadedBy: text('uploaded_by'),
  uploadedById: text('uploaded_by_id'),
  uploadedAt: text('uploaded_at'),
  timestamp: text('timestamp'),
  notes: text('notes'),
  tags: jsonb('tags'),
  versions: jsonb('versions'),
}, (table) => ({
  officeIdx: index('documents_office_idx').on(table.officeId),
}));

export const payments = pgTable('payments', {
  id: text('id').primaryKey(),
  officeId: text('office_id').notNull().references(() => offices.id),
  caseId: text('case_id'),
  clientId: text('client_id'),
  amount: real('amount'),
  date: text('date'),
  method: text('method'),
  paymentMethod: text('payment_method'),
  recipientId: text('recipient_id'),
  receivedBy: text('received_by'),
  receiptNumber: text('receipt_number'),
  notes: text('notes'),
}, (table) => ({
  officeIdx: index('payments_office_idx').on(table.officeId),
}));

export const expenses = pgTable('expenses', {
  id: text('id').primaryKey(),
  officeId: text('office_id').notNull().references(() => offices.id),
  caseId: text('case_id'),
  clientId: text('client_id'),
  title: text('title'),
  type: text('type'),
  category: text('category'),
  amount: real('amount'),
  date: text('date'),
  employeeId: text('employee_id'),
  paidBy: text('paid_by'),
  receiptNumber: text('receipt_number'),
  notes: text('notes'),
  description: text('description'),
}, (table) => ({
  officeIdx: index('expenses_office_idx').on(table.officeId),
}));

export const auditLogs = pgTable('audit_logs', {
  id: text('id').primaryKey(),
  officeId: text('office_id').notNull().references(() => offices.id),
  userId: text('user_id'),
  userName: text('user_name'),
  userRole: text('user_role'),
  actionType: text('action_type'),
  targetType: text('target_type'),
  targetId: text('target_id'),
  targetName: text('target_name'),
  details: text('details'),
  action: text('action'),
  ipAddress: text('ip_address'),
  timestamp: text('timestamp'),
}, (table) => ({
  officeIdx: index('audit_logs_office_idx').on(table.officeId),
}));

export const leads = pgTable('leads', {
  id: text('id').primaryKey(),
  officeId: text('office_id').notNull().references(() => offices.id),
  name: text('name'),
  phone: text('phone'),
  createdAt: text('created_at'),
  status: text('status'),
}, (table) => ({
  officeIdx: index('leads_office_idx').on(table.officeId),
}));

export const subscriptionInvoices = pgTable('subscription_invoices', {
  id: text('id').primaryKey(),
  officeId: text('office_id').notNull().references(() => offices.id),
  date: text('date'),
  planName: text('plan_name'),
  amount: real('amount'),
  currency: text('currency'),
  paymentMethod: text('payment_method'),
  status: text('status'),
  receiptUrl: text('receipt_url'),
}, (table) => ({
  officeIdx: index('subscription_invoices_office_idx').on(table.officeId),
}));

export const entranceNotifications = pgTable('entrance_notifications', {
  id: text('id').primaryKey(),
  officeId: text('office_id'), // Might be null for global ones
  userName: text('user_name'),
  userRole: text('user_role'),
  userEmail: text('user_email'),
  timestamp: text('timestamp'),
  ipAddress: text('ip_address'),
  deviceInfo: text('device_info'),
  location: text('location'),
  coordinates: jsonb('coordinates'),
  isRead: boolean('is_read').default(false),
  type: text('type'),
});
