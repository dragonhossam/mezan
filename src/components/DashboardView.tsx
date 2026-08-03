/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  Briefcase, 
  Calendar as CalendarIcon, 
  CheckSquare, 
  Users, 
  DollarSign, 
  TrendingUp, 
  AlertTriangle, 
  Plus, 
  Clock, 
  ChevronLeft,
  Award,
  BookOpen,
  ArrowUpRight,
  ShieldAlert,
  ArrowDownRight,
  CreditCard
} from "lucide-react";
import { 
  User, 
  Client, 
  Case, 
  Session, 
  Task, 
  Payment, 
  Expense, 
  UserRole 
} from "../types";

interface DashboardViewProps {
  currentUser: User;
  clients: Client[];
  cases: Case[];
  sessions: Session[];
  tasks: Task[];
  payments: Payment[];
  expenses: Expense[];
  onQuickAction: (actionType: string) => void;
  darkMode: boolean;
}

export default function DashboardView({
  currentUser,
  clients,
  cases,
  sessions,
  tasks,
  payments,
  expenses,
  onQuickAction,
  darkMode
}: DashboardViewProps) {
  // Dynamic local date calculation
  const todayObj = new Date();
  const TODAY_STR = todayObj.toISOString().split("T")[0];
  const in7Days = new Date();
  in7Days.setDate(in7Days.getDate() + 7);
  const IN_7_DAYS_STR = in7Days.toISOString().split("T")[0];
  const currentMonthPrefix = TODAY_STR.substring(0, 7);

  // KPIs Calculations
  const activeCasesCount = cases.filter(c => !c.isDeleted && ["جديدة", "قيد الدراسة", "قيد التداول", "مؤجلة", "استئناف", "تنفيذ"].includes(c.status)).length;
  const closedCasesCount = cases.filter(c => !c.isDeleted && ["حكم لصالح العميل", "حكم ضد العميل", "مغلقة", "محفوظة"].includes(c.status)).length;
  const clientsCount = clients.filter(c => !c.isDeleted).length;

  // Sessions today
  const sessionsToday = sessions.filter(s => s.date === TODAY_STR);
  const upcomingSessions = sessions.filter(s => s.date > TODAY_STR && s.date <= IN_7_DAYS_STR); // Next 7 days

  // Tasks overdue
  const overdueTasks = tasks.filter(t => t.dueDate < TODAY_STR && t.status !== "مكتملة");

  // Financial calculations
  const totalFeesExpected = cases.filter(c => !c.isDeleted).reduce((sum, c) => sum + (c.totalFees || 0), 0);
  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  const totalOutstanding = Math.max(0, totalFeesExpected - totalPaid);
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const netProfit = totalPaid - totalExpenses;

  // Financial this month
  const paymentsThisMonth = payments.filter(p => p.date.startsWith(currentMonthPrefix)).reduce((sum, p) => sum + p.amount, 0);
  const expensesThisMonth = expenses.filter(e => e.date.startsWith(currentMonthPrefix)).reduce((sum, e) => sum + e.amount, 0);

  // Case Status Breakdown
  const statusCounts = cases.reduce((acc, c) => {
    if (c.isDeleted) return acc;
    acc[c.status] = (acc[c.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // "Needs Attention Today" lists
  const delayedPayments = cases.filter(c => {
    if (c.isDeleted) return false;
    const paidForCase = payments.filter(p => p.caseId === c.id).reduce((sum, p) => sum + p.amount, 0);
    const remaining = c.totalFees - paidForCase;
    return remaining > (c.totalFees * 0.5) && c.status !== "مغلقة";
  });

  const formattedArabicDate = todayObj.toLocaleDateString("ar-EG", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const formattedTimeStr = todayObj.toLocaleTimeString("ar-EG", { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="space-y-6" dir="rtl">
      {/* Welcome & Status Header */}
      <div className={`p-6 rounded-2xl border transition-all ${
        darkMode ? "bg-[#0D1B2A] border-[#C5A059]/20 text-white" : "bg-white border-slate-200 text-slate-800 shadow-sm"
      }`}>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1.5 text-right">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="bg-[#C5A059]/10 text-[#C5A059] border border-[#C5A059]/20 text-[10px] px-2.5 py-0.5 rounded-full font-bold">الميزان السحابي ⚖️</span>
              <h2 className="text-xl md:text-2xl font-black font-sans">مرحباً بك مجدداً، {currentUser.name}</h2>
            </div>
            <p className={`text-xs ${darkMode ? "text-slate-400" : "text-slate-500"} max-w-xl leading-relaxed`}>
              هذه هي لوحة التحكم الموحدة لمكتبك القانوني ليوم <strong className="text-[#C5A059]">{formattedArabicDate}</strong>. الميزان يراقب القضايا والجلسات تلقائياً لمساعدتك على التركيز على مرافعتك.
            </p>
          </div>
          
          <div className="flex items-center gap-2.5 bg-slate-900/40 dark:bg-[#0D1B2A]/60 p-3 rounded-xl border border-slate-200/10 dark:border-[#1E293B] self-start md:self-auto">
            <Clock className="w-4 h-4 text-[#C5A059]" />
            <div className="text-right">
              <p className="text-[9px] text-slate-400 font-medium">التوقيت المحلي للمكتب</p>
              <p className={`text-xs font-mono font-bold ${darkMode ? "text-white" : "text-slate-800"}`}>{TODAY_STR} | {formattedTimeStr}</p>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid - Clean & Minimalist */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI: Active Cases */}
        <div className={`p-5 rounded-2xl border transition-all ${
          darkMode ? "bg-[#0D1B2A]/40 border-[#1E293B]" : "bg-white border-slate-100 shadow-sm"
        }`}>
          <div className="flex items-center justify-between">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              darkMode ? "bg-blue-500/10 text-blue-400" : "bg-blue-50 text-blue-600"
            }`}>نشط</span>
            <div className="text-blue-500 bg-blue-500/5 p-2 rounded-xl">
              <Briefcase className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 text-right">
            <h3 className={`text-3xl font-black font-sans ${darkMode ? "text-white" : "text-slate-900"}`}>{activeCasesCount}</h3>
            <p className="text-xs text-slate-400 font-medium mt-1">القضايا المتداولة والنشطة</p>
          </div>
        </div>

        {/* KPI: Today's Sessions */}
        <div className={`p-5 rounded-2xl border transition-all ${
          darkMode ? "bg-[#0D1B2A]/40 border-[#1E293B]" : "bg-white border-slate-100 shadow-sm"
        }`}>
          <div className="flex items-center justify-between">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              sessionsToday.length > 0 
                ? (darkMode ? "bg-rose-500/10 text-rose-400 animate-pulse" : "bg-rose-50 text-rose-600 animate-pulse")
                : (darkMode ? "bg-slate-800 text-slate-400" : "bg-slate-100 text-slate-500")
            }`}>
              {sessionsToday.length > 0 ? "اليوم" : "مستقر"}
            </span>
            <div className="text-[#C5A059] bg-[#C5A059]/5 p-2 rounded-xl">
              <CalendarIcon className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 text-right">
            <h3 className={`text-3xl font-black font-sans ${darkMode ? "text-white" : "text-slate-900"}`}>{sessionsToday.length}</h3>
            <p className="text-xs text-slate-400 font-medium mt-1">جلسات المحاكم المحددة اليوم</p>
          </div>
        </div>

        {/* KPI: Overdue Tasks */}
        <div className={`p-5 rounded-2xl border transition-all ${
          darkMode ? "bg-[#0D1B2A]/40 border-[#1E293B]" : "bg-white border-slate-100 shadow-sm"
        }`}>
          <div className="flex items-center justify-between">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              overdueTasks.length > 0 
                ? (darkMode ? "bg-rose-500/10 text-rose-400" : "bg-rose-50 text-rose-600")
                : (darkMode ? "bg-emerald-500/10 text-emerald-400" : "bg-emerald-50 text-emerald-600")
            }`}>
              {overdueTasks.length > 0 ? "تحتاج تنفيذ" : "مكتملة"}
            </span>
            <div className="text-rose-500 bg-rose-500/5 p-2 rounded-xl">
              <CheckSquare className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 text-right">
            <h3 className={`text-3xl font-black font-sans ${darkMode ? "text-white" : "text-slate-900"}`}>{overdueTasks.length}</h3>
            <p className="text-xs text-slate-400 font-medium mt-1">مهام قانونية متأخرة</p>
          </div>
        </div>

        {/* KPI: Outstanding Dues */}
        <div className={`p-5 rounded-2xl border transition-all ${
          darkMode ? "bg-[#0D1B2A]/40 border-[#1E293B]" : "bg-white border-slate-100 shadow-sm"
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] bg-[#C5A059]/10 text-[#C5A059] border border-[#C5A059]/20 font-bold px-2 py-0.5 rounded-full">ذمم معلقة</span>
            <div className="text-emerald-500 bg-emerald-500/5 p-2 rounded-xl">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 text-right">
            <h3 className={`text-2.5xl font-black font-sans leading-none ${darkMode ? "text-white" : "text-slate-900"}`}>
              {totalOutstanding.toLocaleString()} <span className="text-xs font-bold text-slate-400">ج.م</span>
            </h3>
            <p className="text-xs text-slate-400 font-medium mt-1">متبقي أتعاب مستحقة التحصيل</p>
          </div>
        </div>
      </div>

      {/* Slim Quick Actions Ribbon (Decluttered layout replacement) */}
      <div className={`p-4 rounded-2xl border transition-all ${
        darkMode ? "bg-[#0D1B2A]/40 border-[#1E293B]" : "bg-white border-slate-200/80 shadow-sm"
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h3 className={`text-xs font-bold text-right flex items-center gap-2 shrink-0 ${darkMode ? "text-white" : "text-slate-900"}`}>
            <span className="w-1.5 h-3.5 bg-[#C5A059] rounded-full"></span>
            الوصول السريع والعمليات:
          </h3>
          <div className="flex flex-wrap items-center gap-2">
            <button 
              onClick={() => onQuickAction("clients")}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800/80 hover:bg-[#C5A059]/10 border border-slate-200 dark:border-slate-800 hover:border-[#C5A059] text-slate-700 dark:text-slate-300 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Users className="w-3.5 h-3.5 text-[#C5A059]" />
              <span>إضافة عميل</span>
            </button>
            <button 
              onClick={() => onQuickAction("cases")}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800/80 hover:bg-[#C5A059]/10 border border-slate-200 dark:border-slate-800 hover:border-[#C5A059] text-slate-700 dark:text-slate-300 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Briefcase className="w-3.5 h-3.5 text-[#C5A059]" />
              <span>تسجيل قضية جديدة</span>
            </button>
            <button 
              onClick={() => onQuickAction("sessions")}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800/80 hover:bg-[#C5A059]/10 border border-slate-200 dark:border-slate-800 hover:border-[#C5A059] text-slate-700 dark:text-slate-300 transition-all flex items-center gap-2 cursor-pointer"
            >
              <CalendarIcon className="w-3.5 h-3.5 text-[#C5A059]" />
              <span>إضافة جلسة محكمة</span>
            </button>
            <button 
              onClick={() => onQuickAction("tasks")}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800/80 hover:bg-[#C5A059]/10 border border-slate-200 dark:border-slate-800 hover:border-[#C5A059] text-slate-700 dark:text-slate-300 transition-all flex items-center gap-2 cursor-pointer"
            >
              <CheckSquare className="w-3.5 h-3.5 text-[#C5A059]" />
              <span>إسناد مهمة</span>
            </button>
            <button 
              onClick={() => onQuickAction("financial")}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800/80 hover:bg-[#C5A059]/10 border border-slate-200 dark:border-slate-800 hover:border-[#C5A059] text-slate-700 dark:text-slate-300 transition-all flex items-center gap-2 cursor-pointer"
            >
              <DollarSign className="w-3.5 h-3.5 text-[#C5A059]" />
              <span>تسجيل أتعاب أو دفعات</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Dashboard Splitted Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Right column: Needs Attention Today Panel */}
        <div className="lg:col-span-2 space-y-6">
          <div className={`p-5 rounded-2xl border transition-all ${
            darkMode ? "bg-[#0D1B2A]/40 border-[#1E293B]" : "bg-white border-slate-200/80 shadow-sm"
          }`}>
            <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className={`text-sm font-bold text-right flex items-center gap-2 ${darkMode ? "text-white" : "text-slate-900"}`}>
                <AlertTriangle className="w-4 h-4 text-[#C5A059]" />
                ملفات تحتاج انتباهك العاجل اليوم
              </h3>
              <span className="text-[10px] bg-[#C5A059]/10 text-[#C5A059] px-2 py-0.5 rounded-full font-bold">تحديث فوري</span>
            </div>

            {/* Attention Grid Content - Flattened layout without nested cards */}
            <div className="space-y-6">
              {/* Today's Court Sessions list */}
              <div>
                <h4 className="text-xs font-bold text-slate-400 mb-3 text-right flex items-center gap-1">
                  <span>📅</span>
                  <span>جلسات المحاكم المحددة لليوم ({sessionsToday.length})</span>
                </h4>
                {sessionsToday.length === 0 ? (
                  <p className="text-xs text-emerald-600 bg-emerald-500/5 p-3 rounded-xl border border-emerald-500/10 text-center font-medium">
                    لا يوجد جلسات مقررة اليوم أمام جهات التحقيق أو المحاكم.
                  </p>
                ) : (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {sessionsToday.map(ses => {
                      const caseItem = cases.find(c => c.id === ses.caseId);
                      return (
                        <div key={ses.id} className="flex items-center justify-between py-3">
                          <div className="text-right">
                            <p className={`text-xs font-bold ${darkMode ? "text-slate-200" : "text-slate-800"}`}>
                              {ses.type} — {caseItem?.caseNumber || "قضية عامة"}
                            </p>
                            <p className="text-[11px] text-slate-400 mt-1">
                              🏛️ {ses.court} | {ses.circle}
                            </p>
                          </div>
                          <div className="text-left">
                            <span className="text-xs bg-[#0D1B2A] text-white font-mono px-2.5 py-1 rounded-lg font-bold">
                              {ses.time}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Overdue Tasks */}
              <div className="pt-2">
                <h4 className="text-xs font-bold text-slate-400 mb-3 text-right flex items-center gap-1">
                  <span>⚠️</span>
                  <span>المهام القانونية المتأخرة ({overdueTasks.length})</span>
                </h4>
                {overdueTasks.length === 0 ? (
                  <p className="text-xs text-emerald-600 bg-emerald-500/5 p-3 rounded-xl border border-emerald-500/10 text-center font-medium">
                    رائع! تم إنجاز جميع المهام المحددة بمواعيد استحقاق سابقة.
                  </p>
                ) : (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {overdueTasks.map(tsk => (
                      <div key={tsk.id} className="flex items-center justify-between py-3">
                        <div className="text-right">
                          <p className="text-xs font-bold text-rose-500">{tsk.title}</p>
                          <p className="text-[11px] text-slate-400 mt-1">
                            المسؤول: {currentUser.id === tsk.assignedLawyerId ? "أنت" : "محامي زميل"} | تاريخ الاستحقاق: {tsk.dueDate}
                          </p>
                        </div>
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-rose-500/15 text-rose-500 border border-rose-500/20">متأخرة</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Delayed Payments list */}
              <div className="pt-2">
                <h4 className="text-xs font-bold text-slate-400 mb-3 text-right flex items-center gap-1">
                  <span>💰</span>
                  <span>أتعاب معلقة بنسب مرتفعة (أكثر من ٥٠٪ متبقي)</span>
                </h4>
                {delayedPayments.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-2">لا يوجد مبالغ معلقة بنسب مرتفعة حالياً.</p>
                ) : (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {delayedPayments.slice(0, 3).map(c => {
                      const paidForCase = payments.filter(p => p.caseId === c.id).reduce((sum, p) => sum + p.amount, 0);
                      const remaining = c.totalFees - paidForCase;
                      const clientName = clients.find(cl => cl.id === c.clientId)?.name || "عميل مجهول";
                      return (
                        <div key={c.id} className="flex items-center justify-between py-3">
                          <div className="text-right truncate max-w-xs">
                            <p className={`text-xs font-bold ${darkMode ? "text-slate-200" : "text-slate-800"}`}>{c.caseNumber} — {clientName}</p>
                            <p className="text-[11px] text-slate-400 mt-1">القيمة التعاقدية الكاملة: {c.totalFees.toLocaleString()} ج.م</p>
                          </div>
                          <div className="text-left">
                            <span className="text-xs text-rose-500 font-mono font-bold">
                              متبقي: {remaining.toLocaleString()} ج.م
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Legal Insights Block - Flattened */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className={`p-5 rounded-2xl border transition-all ${
              darkMode ? "bg-[#0D1B2A]/40 border-[#1E293B]" : "bg-white border-slate-200/80 shadow-sm"
            }`}>
              <h4 className={`text-xs font-bold mb-4 text-right flex items-center gap-1.5 ${darkMode ? "text-white" : "text-slate-900"}`}>
                <Award className="w-4 h-4 text-[#C5A059]" />
                حالة ملفات القضايا بالمكتب
              </h4>
              <div className="space-y-3">
                {Object.entries(statusCounts).map(([status, count]) => {
                  const percent = Math.round((count / (cases.filter(c => !c.isDeleted).length || 1)) * 100);
                  return (
                    <div key={status} className="space-y-1.5 text-right">
                      <div className="flex items-center justify-between text-[11px] font-medium text-slate-400">
                        <span className="font-semibold text-slate-300">{status}</span>
                        <span className="font-mono">{count} قضايا ({percent}%)</span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-800/80 h-1 rounded-full overflow-hidden">
                        <div 
                          className="bg-[#C5A059] h-full rounded-full transition-all" 
                          style={{ width: `${percent}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className={`p-5 rounded-2xl border transition-all ${
              darkMode ? "bg-[#0D1B2A]/40 border-[#1E293B]" : "bg-white border-slate-200/80 shadow-sm"
            }`}>
              <h4 className={`text-xs font-bold mb-4 text-right flex items-center gap-1.5 ${darkMode ? "text-white" : "text-slate-900"}`}>
                <BookOpen className="w-4 h-4 text-[#C5A059]" />
                ملخص يوليو ٢٠٢٦ المالي
              </h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                  <div className="text-right">
                    <p className="text-[10px] text-slate-400">تحصيل الأتعاب الفعلي</p>
                    <p className="text-sm font-bold text-emerald-500 mt-0.5">{paymentsThisMonth.toLocaleString()} ج.م</p>
                  </div>
                  <ArrowUpRight className="w-7 h-7 text-emerald-500 bg-emerald-500/10 p-1.5 rounded-full" />
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-rose-500/5 border border-rose-500/10">
                  <div className="text-right">
                    <p className="text-[10px] text-slate-400">المصروفات والدمغات</p>
                    <p className="text-sm font-bold text-rose-500 mt-0.5">{expensesThisMonth.toLocaleString()} ج.م</p>
                  </div>
                  <ArrowDownRight className="w-7 h-7 text-rose-500 bg-rose-500/10 p-1.5 rounded-full" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Left column: Upcoming Calendar & Platform Tip */}
        <div className="space-y-6">
          {/* Next 7 Days Court Calendar Schedule */}
          <div className={`p-5 rounded-2xl border transition-all ${
            darkMode ? "bg-[#0D1B2A]/40 border-[#1E293B]" : "bg-white border-slate-200/80 shadow-sm"
          }`}>
            <h3 className={`text-sm font-bold mb-4 text-right flex items-center gap-2 ${darkMode ? "text-white" : "text-slate-900"}`}>
              <span className="w-1.5 h-3.5 bg-[#C5A059] rounded-full"></span>
              أجندة السبعة أيام القادمة
            </h3>

            {upcomingSessions.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-8">
                لا يوجد أي جلسات محاكم أو خبراء مقررة في الأسبوع القادم.
              </p>
            ) : (
              <div className="relative border-r border-slate-200 dark:border-slate-800 pr-4 space-y-4 text-right">
                {upcomingSessions.map(ses => {
                  const caseItem = cases.find(c => c.id === ses.caseId);
                  const clientName = clients.find(cl => cl.id === caseItem?.clientId)?.name || "عميل مجهول";
                  return (
                    <div key={ses.id} className="relative">
                      {/* Timeline dot */}
                      <span className="absolute -right-[21px] top-1.5 w-2 h-2 rounded-full bg-[#C5A059] border-2 border-slate-950"></span>
                      
                      <div>
                        <span className="text-[9px] font-mono font-semibold bg-slate-100 dark:bg-slate-800 text-[#C5A059] px-2 py-0.5 rounded">
                          {ses.date}
                        </span>
                        <h4 className={`text-xs font-bold mt-1 ${darkMode ? "text-white" : "text-slate-800"}`}>
                          {ses.type} — {caseItem?.caseNumber}
                        </h4>
                        <p className="text-[10px] text-slate-400 truncate mt-0.5">
                          الموكل: {clientName}
                        </p>
                        <p className="text-[10px] text-slate-500">
                          🏛️ {ses.court} ({ses.time})
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Clean Tip/Quote Card (Decluttered replacement of bright yellow solid box) */}
          <div className={`p-5 rounded-2xl border text-right space-y-3 ${
            darkMode ? "bg-slate-900/30 border-slate-800 text-slate-300" : "bg-slate-50/80 border-slate-200 text-slate-700"
          }`}>
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-[#C5A059]" />
              <h4 className="font-bold text-xs text-[#C5A059]">إشعار التنظيم الإداري</h4>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              ينصح ميزان بمراجعة قرارات الطب الشرعي والتقارير المالية المودعة قبل موعد تداول الجلسات بـ ٤٨ ساعة لتفادي فوات المهل القانونية للطعن أو إبداء الدفوع الشفوية.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
