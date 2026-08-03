/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { 
  Scale, 
  Users, 
  Briefcase, 
  Calendar as CalendarIcon, 
  CheckSquare, 
  FolderOpen, 
  DollarSign, 
  CreditCard, 
  BarChart3, 
  Settings, 
  Crown, 
  ShieldAlert,
  ArrowLeft,
  Search,
  ArrowUpRight
} from "lucide-react";
import { 
  User, 
  Client, 
  Case, 
  Session, 
  Task, 
  Payment, 
  Expense,
  UserSubscription
} from "../types";

interface MenuViewProps {
  currentUser: User;
  clients: Client[];
  cases: Case[];
  sessions: Session[];
  tasks: Task[];
  payments: Payment[];
  expenses: Expense[];
  subscription?: UserSubscription;
  darkMode: boolean;
  onNavigate: (tabId: string) => void;
}

export default function MenuView({
  currentUser,
  clients,
  cases,
  sessions,
  tasks,
  payments,
  expenses,
  subscription,
  darkMode,
  onNavigate
}: MenuViewProps) {

  const isSuperUser = currentUser.isSuperUser === true || currentUser.id === "usr-super" || currentUser.email === "superuser@lawmizan.com";

  // Quick live state counters for badges
  const todayStr = new Date().toISOString().split("T")[0];
  const activeCasesCount = cases.filter(c => !c.isDeleted && ["جديدة", "قيد الدراسة", "قيد التداول", "مؤجلة", "استئناف", "تنفيذ"].includes(c.status)).length;
  const sessionsTodayCount = sessions.filter(s => s.date === todayStr).length;
  const pendingTasksCount = tasks.filter(t => t.status !== "مكتملة").length;
  const totalClientsCount = clients.filter(c => !c.isDeleted).length;

  const menuSections = [
    {
      id: "dashboard",
      title: "الرئيسية",
      subtitle: "لوحة الأعمال والملخص اليومي",
      description: "إحصائيات المكتب والملخص اليومي للأعمال والمهام العاجلة اليوم والمؤشرات المالية العامة للمكتب.",
      icon: Scale,
      color: "amber",
      badge: null,
    },
    {
      id: "clients",
      title: "العملاء (CRM)",
      subtitle: "دفتر الموكلين والتواصل الفعّال",
      description: "إدارة بيانات الموكلين بالكامل، دفاتر الاتصالات، سجلات الاستفسارات وحالات تواصل العملاء اليومية.",
      icon: Users,
      color: "blue",
      badge: totalClientsCount > 0 ? `${totalClientsCount} موكّل` : null,
    },
    {
      id: "cases",
      title: "القضايا وملفات الدعاوى",
      subtitle: "إدارة الأوراق والمحاكم والدوائر",
      description: "إدارة ملفات القضايا والدعاوى، جهات المحاكم والدوائر، وقيد عقود الأتعاب والتطورات الجارية لكل قضية.",
      icon: Briefcase,
      color: "indigo",
      badge: activeCasesCount > 0 ? `${activeCasesCount} نشطة` : null,
    },
    {
      id: "sessions",
      title: "الجلسات والتقويم القضائي",
      subtitle: "مفكرة حضور الجلسات وتأجيلاتها",
      description: "مفكرة حضور الجلسات وتأجيلات المحكمة والقرارات الفورية وجدول الأعمال اليومي والأسبوعي المجدول للمكتب.",
      icon: CalendarIcon,
      color: "emerald",
      badge: sessionsTodayCount > 0 ? `${sessionsTodayCount} جلسات اليوم` : null,
    },
    {
      id: "tasks",
      title: "المهام والمواعيد الإجرائية",
      subtitle: "تكليفات المحامين ومتابعة التنفيذ",
      description: "تكليفات المحامين المساعدين، المواعيد الإجرائية الهامة، ومتابعة المهام المنجزة والمعلقة وتواريخ الاستحقاق.",
      icon: CheckSquare,
      color: "cyan",
      badge: pendingTasksCount > 0 ? `${pendingTasksCount} معلقة` : null,
    },
    {
      id: "documents",
      title: "الأرشيف والمستندات",
      subtitle: "التوكيلات وصور الصحف والمسودات",
      description: "المستندات، صور الصحف والتوكيلات، والمسودات القضائية المصنفة بمجلدات ذكية وسحابية مشفرة.",
      icon: FolderOpen,
      color: "teal",
      badge: null,
    },
    {
      id: "financial",
      title: "الحسابات والأتعاب",
      subtitle: "المقبوضات المالية وكشوف الحسابات",
      description: "المقبوضات المالية، دفعات أقساط العقود، إيصالات السداد وكشوف حساب الموكلين التفصيلية والعملاء.",
      icon: DollarSign,
      color: "rose",
      badge: null,
    },
    {
      id: "expenses",
      title: "المصروفات ومشتريات المكتب",
      subtitle: "مصروفات التقاضي والرسوم والدمغات",
      description: "مصروفات التقاضي، رسوم الدمغات والمحاضر، ومصاريف التشغيل للمكتب للمتابعة المالية الدقيقة للربح والخسارة.",
      icon: CreditCard,
      color: "orange",
      badge: null,
    },
    {
      id: "reports",
      title: "التقارير والإحصائيات",
      subtitle: "الأداء المالي والكفاءة المهنية للمكتب",
      description: "التقارير التحليلية لأداء المكتب، كفاءة المحامين، الأرباح والمصروفات والعملاء المحتملين القادمين للمكتب.",
      icon: BarChart3,
      color: "violet",
      badge: null,
    },
    {
      id: "subscription",
      title: "باقة الاشتراك والترقية",
      subtitle: "إدارة خطة ميزان السحابية وفواتير الدفع",
      description: "تفاصيل خطة اشتراك المكتب الحالية، ترقية الباقة لبريميوم بالجنيه المصري، وتنزيل فواتير السداد.",
      icon: Crown,
      color: "pink",
      badge: subscription?.status === "active" ? "بريميوم نشط" : "تجريبي",
    },
    {
      id: "settings",
      title: "إعدادات المكتب والزملاء",
      subtitle: "دعوة المحامين وإدارة هوياتهم وقدراتهم",
      description: "إعدادات هوية المكتب، لوحة الألوان واللغات، دعوة الزملاء والمحامين الجدد وتوزيع صلاحياتهم الإدارية.",
      icon: Settings,
      color: "slate",
      badge: null,
    },
    ...(isSuperUser ? [{
      id: "admin_panel",
      title: "لوحة الإدارة الكبرى 🛡️",
      subtitle: "لوحة تحكم مالك المنصة الشاملة",
      description: "لوحة تحكم خاصة لحسابات الملاك والمشرفين الكبار لإدارة ومتابعة الاشتراكات والتحليلات وقاعدة البيانات الكلية.",
      icon: ShieldAlert,
      color: "red",
      badge: "حصري للمدير",
    }] : [])
  ];

  const getColorClasses = (color: string) => {
    switch (color) {
      case "amber":
        return darkMode 
          ? { bg: "bg-amber-500/10", border: "border-amber-500/20 hover:border-amber-500/40", text: "text-amber-400", iconBg: "bg-amber-500/15" }
          : { bg: "bg-amber-50/50", border: "border-amber-100 hover:border-amber-300 shadow-sm", text: "text-amber-700", iconBg: "bg-amber-100" };
      case "blue":
        return darkMode 
          ? { bg: "bg-blue-500/10", border: "border-blue-500/20 hover:border-blue-500/40", text: "text-blue-400", iconBg: "bg-blue-500/15" }
          : { bg: "bg-blue-50/50", border: "border-blue-100 hover:border-blue-300 shadow-sm", text: "text-blue-700", iconBg: "bg-blue-100" };
      case "indigo":
        return darkMode 
          ? { bg: "bg-indigo-500/10", border: "border-indigo-500/20 hover:border-indigo-500/40", text: "text-indigo-400", iconBg: "bg-indigo-500/15" }
          : { bg: "bg-indigo-50/50", border: "border-indigo-100 hover:border-indigo-300 shadow-sm", text: "text-indigo-700", iconBg: "bg-indigo-100" };
      case "emerald":
        return darkMode 
          ? { bg: "bg-emerald-500/10", border: "border-emerald-500/20 hover:border-emerald-500/40", text: "text-emerald-400", iconBg: "bg-emerald-500/15" }
          : { bg: "bg-emerald-50/50", border: "border-emerald-100 hover:border-emerald-300 shadow-sm", text: "text-emerald-700", iconBg: "bg-emerald-100" };
      case "cyan":
        return darkMode 
          ? { bg: "bg-cyan-500/10", border: "border-cyan-500/20 hover:border-cyan-500/40", text: "text-cyan-400", iconBg: "bg-cyan-500/15" }
          : { bg: "bg-cyan-50/50", border: "border-cyan-100 hover:border-cyan-300 shadow-sm", text: "text-cyan-700", iconBg: "bg-cyan-100" };
      case "teal":
        return darkMode 
          ? { bg: "bg-teal-500/10", border: "border-teal-500/20 hover:border-teal-500/40", text: "text-teal-400", iconBg: "bg-teal-500/15" }
          : { bg: "bg-teal-50/50", border: "border-teal-100 hover:border-teal-300 shadow-sm", text: "text-teal-700", iconBg: "bg-teal-100" };
      case "rose":
        return darkMode 
          ? { bg: "bg-rose-500/10", border: "border-rose-500/20 hover:border-rose-500/40", text: "text-rose-400", iconBg: "bg-rose-500/15" }
          : { bg: "bg-rose-50/50", border: "border-rose-100 hover:border-rose-300 shadow-sm", text: "text-rose-700", iconBg: "bg-rose-100" };
      case "orange":
        return darkMode 
          ? { bg: "bg-orange-500/10", border: "border-orange-500/20 hover:border-orange-500/40", text: "text-orange-400", iconBg: "bg-orange-500/15" }
          : { bg: "bg-orange-50/50", border: "border-orange-100 hover:border-orange-300 shadow-sm", text: "text-orange-700", iconBg: "bg-orange-100" };
      case "violet":
        return darkMode 
          ? { bg: "bg-violet-500/10", border: "border-violet-500/20 hover:border-violet-500/40", text: "text-violet-400", iconBg: "bg-violet-500/15" }
          : { bg: "bg-violet-50/50", border: "border-violet-100 hover:border-violet-300 shadow-sm", text: "text-violet-700", iconBg: "bg-violet-100" };
      case "pink":
        return darkMode 
          ? { bg: "bg-pink-500/10", border: "border-pink-500/20 hover:border-pink-500/40", text: "text-pink-400", iconBg: "bg-pink-500/15" }
          : { bg: "bg-pink-50/50", border: "border-pink-100 hover:border-pink-300 shadow-sm", text: "text-pink-700", iconBg: "bg-pink-100" };
      case "red":
        return darkMode 
          ? { bg: "bg-red-500/10", border: "border-red-500/20 hover:border-red-500/40", text: "text-red-400", iconBg: "bg-red-500/15" }
          : { bg: "bg-red-50/50", border: "border-red-100 hover:border-red-300 shadow-sm", text: "text-red-700", iconBg: "bg-red-100" };
      default:
        return darkMode 
          ? { bg: "bg-slate-500/10", border: "border-slate-500/20 hover:border-slate-500/40", text: "text-slate-400", iconBg: "bg-slate-500/15" }
          : { bg: "bg-slate-50/50", border: "border-slate-100 hover:border-slate-300 shadow-sm", text: "text-slate-700", iconBg: "bg-slate-100" };
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      
      {/* Dynamic Welcoming Header */}
      <div className={`p-6 rounded-2xl border transition-all ${
        darkMode ? "bg-[#0D1B2A] border-[#C5A059]/20 text-white" : "bg-white border-slate-200 text-slate-800 shadow-sm"
      }`}>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1 text-right">
            <span className="bg-[#C5A059]/10 text-[#C5A059] border border-[#C5A059]/20 text-[10px] px-2.5 py-0.5 rounded-full font-bold">
              دليل الأقسام الشامل 📋
            </span>
            <h2 className="text-xl md:text-2xl font-black mt-2">خريطة نظام ميزان لإدارة المحاماة</h2>
            <p className={`text-xs ${darkMode ? "text-slate-400" : "text-slate-500"} leading-relaxed max-w-2xl`}>
              تُوفر لك هذه الصفحة دليلًا تفصيليًا مستقلًا لكافة أقسام المنصة ووظائفها الأساسية لتسهيل وصول المحامين والمساعدين في مكتبك دون تشتت أو ضياع.
            </p>
          </div>
          
          <div className={`text-xs px-4 py-2 rounded-xl border flex items-center gap-2 shrink-0 ${
            darkMode ? "bg-slate-900/60 border-slate-800 text-slate-300" : "bg-slate-50 border-slate-200 text-slate-600"
          }`}>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>بوابة المحامي: <strong>{currentUser.name}</strong> ({currentUser.role})</span>
          </div>
        </div>
      </div>

      {/* Grid of Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {menuSections.map((sect) => {
          const Icon = sect.icon;
          const colors = getColorClasses(sect.color);
          
          return (
            <div
              key={sect.id}
              id={`menu-card-tab-${sect.id}`}
              onClick={() => onNavigate(sect.id)}
              className={`p-6 rounded-2xl border cursor-pointer transition-all hover:scale-[1.02] flex flex-col justify-between ${colors.bg} ${colors.border}`}
            >
              <div>
                <div className="flex items-start justify-between gap-4">
                  <div className={`p-3 rounded-xl ${colors.iconBg} ${colors.text} flex items-center justify-center shrink-0`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  
                  {sect.badge && (
                    <span className={`text-[10px] font-black px-2.5 py-1 rounded-full ${
                      darkMode ? "bg-slate-900/80 text-[#C5A059] border border-slate-800" : "bg-white text-[#C5A059] border border-slate-100 shadow-xs"
                    }`}>
                      {sect.badge}
                    </span>
                  )}
                </div>
                
                <div className="mt-5 space-y-1.5 text-right">
                  <h3 className={`text-base font-bold flex items-center gap-1.5 ${darkMode ? "text-white" : "text-slate-900"}`}>
                    <span>{sect.title}</span>
                  </h3>
                  <p className={`text-[10px] font-semibold tracking-wide ${colors.text}`}>
                    {sect.subtitle}
                  </p>
                  <p className={`text-xs mt-2.5 leading-relaxed font-normal ${darkMode ? "text-slate-400" : "text-slate-600"}`}>
                    {sect.description}
                  </p>
                </div>
              </div>
              
              <div className="mt-6 pt-4 border-t border-slate-200/5 dark:border-white/5 flex items-center justify-between text-xs font-bold">
                <span className={`flex items-center gap-1 transition-all ${darkMode ? "text-slate-300 hover:text-white" : "text-slate-700 hover:text-slate-900"}`}>
                  <span>الدخول للقسم</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-[#C5A059]" />
                </span>
                
                <span className="text-[10px] text-slate-400 font-mono font-medium">#{sect.id}</span>
              </div>
            </div>
          );
        })}
      </div>
      
    </div>
  );
}
