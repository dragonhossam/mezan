/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  User, 
  UserRole, 
  Client, 
  Case, 
  Session, 
  Task, 
  Document, 
  Payment, 
  Expense, 
  OfficeConfig, 
  AuditLog,
  EntranceNotification 
} from "../types";

// Dynamic Date Helpers
const today = new Date();
const formatDate = (d: Date) => d.toISOString().split("T")[0];

const addDays = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return formatDate(d);
};

export const TODAY_STR = formatDate(today);
export const YESTERDAY_STR = addDays(-1);
export const TOMORROW_STR = addDays(1);
export const IN_3_DAYS_STR = addDays(3);
export const IN_7_DAYS_STR = addDays(7);

export const initialUsers: User[] = [
  {
    id: "usr-super",
    name: "مدير المنصة والاشتراكات (Super Admin)",
    email: "superuser@lawmizan.com",
    role: UserRole.SuperAdmin,
    password: "admin",
    isSuperUser: true,
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    permissions: { view: true, add: true, edit: true, delete: true, export: true, viewFinancials: true }
  },
  {
    id: "usr-owner-1",
    name: "أ. المحامي رئيس المكتب",
    email: "owner@lawmizan.com",
    role: UserRole.Owner,
    password: "1234",
    isSuperUser: false,
    avatarUrl: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80",
    permissions: { view: true, add: true, edit: true, delete: true, export: true, viewFinancials: true }
  },
  {
    id: "usr-lawyer-1",
    name: "أ. محامي الاستشارات والقضايا",
    email: "lawyer@lawmizan.com",
    role: UserRole.Lawyer,
    password: "1234",
    isSuperUser: false,
    avatarUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
    permissions: { view: true, add: true, edit: true, delete: false, export: true, viewFinancials: false }
  },
  {
    id: "usr-sec-1",
    name: "م. أحمد عبد المجيد (السكرتارية)",
    email: "sec@lawmizan.com",
    role: UserRole.Secretary,
    password: "1234",
    isSuperUser: false,
    avatarUrl: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80",
    permissions: { view: true, add: true, edit: true, delete: false, export: false, viewFinancials: false }
  },
  {
    id: "usr-ad-1",
    name: "أ. مصطفى الشافعي",
    email: "mostafa.shafey@lawmizan.net",
    role: UserRole.Owner,
    password: "1234",
    isSuperUser: false,
    avatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80",
    permissions: { view: true, add: true, edit: true, delete: true, export: true, viewFinancials: true },
    referredByAd: true,
    utmSource: "google_ads",
    utmCampaign: "محاماة سحابية 2026",
    registrationIp: "197.38.112.54",
    registrationDevice: "متصفح حاسوب",
    registrationLocation: "القاهرة، مصر",
    createdAt: new Date(Date.now() - 4 * 3600000).toISOString()
  },
  {
    id: "usr-ad-2",
    name: "أ. نادين يوسف",
    email: "nadine.youssef@lawmizan.net",
    role: UserRole.Owner,
    password: "1234",
    isSuperUser: false,
    avatarUrl: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80",
    permissions: { view: true, add: true, edit: true, delete: true, export: true, viewFinancials: true },
    referredByAd: true,
    utmSource: "facebook_ads",
    utmCampaign: "برنامج إدارة مكاتب ميزان",
    registrationIp: "197.38.89.201",
    registrationDevice: "هاتف محمول",
    registrationLocation: "الإسكندرية، مصر",
    createdAt: new Date(Date.now() - 12 * 3600000).toISOString()
  },
  {
    id: "usr-ad-3",
    name: "أ. هشام الهواري",
    email: "hisham.hawary@lawmizan.net",
    role: UserRole.Owner,
    password: "1234",
    isSuperUser: false,
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    permissions: { view: true, add: true, edit: true, delete: true, export: true, viewFinancials: true },
    referredByAd: false, // Organic
    utmSource: "organic_search",
    utmCampaign: "بحث جوجل العضوي",
    registrationIp: "197.38.21.140",
    registrationDevice: "متصفح حاسوب",
    registrationLocation: "الجيزة، مصر",
    createdAt: new Date(Date.now() - 24 * 3600000).toISOString()
  }
];

export const initialOfficeConfig: OfficeConfig = {
  officeName: "مكتب المحاماة والاستشارات القانونية والتحكيم",
  lawyerName: "الأستاذ رئيس المكتب والمُحاضر القانوني",
  logoText: "ميزان",
  address: "شارع مصطفى النحاس - مدينة نصر - القاهرة - مصر",
  phone: "01001234567",
  email: "contact@lawmizan.com",
  taxNumber: "104-592-881",
  barAssociationNumber: "289410 - نقابة المحامين الفرعية بالقاهرة",
  reminderSettings: {
    before7Days: true,
    before3Days: true,
    before1Day: true,
    sameDay: true
  }
};

export const initialClients: Client[] = [];

export const initialCases: Case[] = [];

export const initialSessions: Session[] = [];

export const initialTasks: Task[] = [];

export const initialDocuments: Document[] = [];

export const initialPayments: Payment[] = [];

export const initialExpenses: Expense[] = [];

export const initialAuditLogs: AuditLog[] = [];

export const initialEntranceNotifications: EntranceNotification[] = [];
