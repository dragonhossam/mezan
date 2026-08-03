/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  Calendar as CalendarIcon, 
  Plus, 
  Clock, 
  Scale, 
  User, 
  Edit2, 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  Bell, 
  ChevronLeft, 
  ChevronRight,
  HelpCircle,
  FileText,
  ShieldAlert,
  BookOpen
} from "lucide-react";
import { 
  User as UserType, 
  Client, 
  Case, 
  Session, 
  SessionType 
} from "../types";

interface SessionsViewProps {
  currentUser: UserType;
  sessions: Session[];
  cases: Case[];
  clients: Client[];
  usersList: UserType[];
  onAddSession: (sessionData: Omit<Session, "id" | "isCompleted">) => void;
  onUpdateSessionResult: (sessionId: string, resultData: { result: string; decision: string; nextSessionDate?: string; isCompleted: boolean }) => void;
  onEditSession: (session: Session) => void;
  darkMode: boolean;
}

export default function SessionsView({
  currentUser,
  sessions,
  cases,
  clients,
  usersList,
  onAddSession,
  onUpdateSessionResult,
  onEditSession,
  darkMode
}: SessionsViewProps) {
  // Dynamic Date Focus
  const now = new Date();
  const [currentYear, setCurrentYear] = useState(now.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(now.getMonth()); // 0-indexed
  const [selectedDate, setSelectedDate] = useState<string>(now.toISOString().split("T")[0]);
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);
  const [activeSessionForResult, setActiveSessionForResult] = useState<Session | null>(null);

  // Form states for Add Session
  const [formData, setFormData] = useState({
    caseId: "",
    court: "",
    circle: "",
    date: now.toISOString().split("T")[0],
    time: "09:00",
    type: "جلسة محكمة" as SessionType,
    assignedLawyerId: "",
    notesBefore: ""
  });

  // Form states for Result Logging
  const [resultData, setResultData] = useState({
    result: "",
    decision: "",
    nextSessionDate: "",
    isCompleted: true,
    createNextTask: false
  });

  // Permissions Check
  const canAdd = currentUser.permissions.add;
  const canEdit = currentUser.permissions.edit;

  // Daily Journal Note states (local storage backed)
  const [journalNote, setJournalNote] = useState<string>("");
  const [journalSpacing, setJournalSpacing] = useState<string>(() => {
    return localStorage.getItem("meezan_journal_spacing") || "2.2rem";
  });
  const [journalFontSize, setJournalFontSize] = useState<string>(() => {
    return localStorage.getItem("meezan_journal_font_size") || "13px";
  });
  const [journalRows, setJournalRows] = useState<number>(() => {
    return parseInt(localStorage.getItem("meezan_journal_rows") || "8", 10);
  });

  // Keep journal note in sync with selectedDate
  useEffect(() => {
    setJournalNote(localStorage.getItem(`meezan_daily_journal_${selectedDate}`) || "");
  }, [selectedDate]);

  const saveJournalNote = (text: string) => {
    setJournalNote(text);
    localStorage.setItem(`meezan_daily_journal_${selectedDate}`, text);
  };

  const monthNames = [
    "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
    "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"
  ];

  const daysOfWeek = ["ح", "ن", "ث", "ر", "خ", "ج", "س"];

  // Calendar Helpers
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDayIndex = getFirstDayOfMonth(currentYear, currentMonth);

  // Filter sessions matching month
  const getMonthSessions = () => {
    const monthPrefix = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}`;
    return sessions.filter(s => s.date.startsWith(monthPrefix));
  };

  const monthSessions = getMonthSessions();

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const handleDateClick = (day: number) => {
    const formattedDate = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    setSelectedDate(formattedDate);
  };

  // Get sessions on selected date
  const selectedDateSessions = sessions.filter(s => s.date === selectedDate);

  // System Alerts Section
  const TODAY_STR = new Date().toISOString().split("T")[0];
  const getAlertLogs = () => {
    const alerts: { id: string; message: string; type: "عاجل" | "تنبيه" | "إشعار"; caseNum: string }[] = [];
    
    sessions.forEach(s => {
      const caseItem = cases.find(c => c.id === s.caseId);
      if (!caseItem) return;
      
      const sessionTime = new Date(s.date).getTime();
      const todayTime = new Date(TODAY_STR).getTime();
      const diffDays = Math.ceil((sessionTime - todayTime) / (1000 * 60 * 60 * 24));

      if (diffDays === 0) {
        alerts.push({
          id: `alert-0-${s.id}`,
          message: `🚨 اليوم موعد جلسة ${s.type} بقضية ${caseItem.caseNumber} بمحكمة ${s.court}.`,
          type: "عاجل",
          caseNum: caseItem.caseNumber
        });
      } else if (diffDays === 1) {
        alerts.push({
          id: `alert-1-${s.id}`,
          message: `⏰ تنبيه قبل الجلسة بيوم: غداً جلسة ${s.type} لقضية ${caseItem.caseNumber} - الدائرة ${s.circle}.`,
          type: "عاجل",
          caseNum: caseItem.caseNumber
        });
      } else if (diffDays === 3) {
        alerts.push({
          id: `alert-3-${s.id}`,
          message: `🔔 تنبيه قبل الجلسة بـ ٣ أيام: جلسة ${s.type} متبقي عليها ٣ أيام لقضية ${caseItem.caseNumber}.`,
          type: "تنبيه",
          caseNum: caseItem.caseNumber
        });
      } else if (diffDays > 3 && diffDays <= 7) {
        alerts.push({
          id: `alert-7-${s.id}`,
          message: `📅 تنبيه قبل الجلسة بـ ٧ أيام: هناك جلسة ${s.type} مدرجة للأسبوع القادم لقضية ${caseItem.caseNumber}.`,
          type: "إشعار",
          caseNum: caseItem.caseNumber
        });
      }
    });
    return alerts;
  };

  const activeAlertsList = getAlertLogs();

  const handleOpenAddModal = () => {
    if (!canAdd) return;
    const defaultCase = cases[0]?.id || "";
    const activeCaseItem = cases.find(c => c.id === defaultCase);
    setFormData({
      caseId: defaultCase,
      court: activeCaseItem?.court || "",
      circle: activeCaseItem?.circle || "",
      date: selectedDate || "2026-07-20",
      time: "09:30",
      type: "جلسة محكمة",
      assignedLawyerId: usersList.find(u => u.role === "محامي" || u.role === "صاحب المكتب")?.id || usersList[0]?.id || "",
      notesBefore: ""
    });
    setIsAddModalOpen(true);
  };

  const handleCaseChangeInAdd = (caseId: string) => {
    const selectedCaseItem = cases.find(c => c.id === caseId);
    if (selectedCaseItem) {
      setFormData({
        ...formData,
        caseId,
        court: selectedCaseItem.court,
        circle: selectedCaseItem.circle
      });
    } else {
      setFormData({ ...formData, caseId });
    }
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.caseId || !formData.court || !formData.assignedLawyerId) {
      alert("الرجاء تحديد القضية، المحكمة، والمحامي المسؤول.");
      return;
    }
    onAddSession(formData);
    setIsAddModalOpen(false);
  };

  const handleOpenResultModal = (session: Session) => {
    if (!canEdit) return;
    setActiveSessionForResult(session);
    setResultData({
      result: session.result || "",
      decision: session.decision || "",
      nextSessionDate: session.nextSessionDate || "",
      isCompleted: true,
      createNextTask: false
    });
    setIsResultModalOpen(true);
  };

  const handleResultSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSessionForResult) return;
    onUpdateSessionResult(activeSessionForResult.id, {
      result: resultData.result,
      decision: resultData.decision,
      nextSessionDate: resultData.nextSessionDate || undefined,
      isCompleted: resultData.isCompleted
    });
    setIsResultModalOpen(false);
  };

  const sessionTypesList: SessionType[] = [
    "جلسة محكمة", "جلسة خبير", "جلسة تحقيق", "جلسة تنفيذ", "جلسة إعلان", "أخرى"
  ];

  return (
    <div className="space-y-6 text-right" dir="rtl">
      
      {/* Title block */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className={`text-xl font-bold font-sans ${darkMode ? "text-white" : "text-slate-900"}`}>أجندة الجلسات والتقويم القانوني</h2>
          <p className="text-xs text-slate-500 mt-1">متابعة دقيقة لجلسات المحاكم، لجان الخبراء، وتحقيق النيابة بذكاء مع نظام التنبيهات البرمجية المدمج.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleOpenAddModal}
            disabled={!canAdd}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              canAdd 
                ? "bg-amber-500 hover:bg-amber-600 text-slate-950 cursor-pointer shadow-md shadow-amber-500/10" 
                : "bg-slate-300 dark:bg-slate-800 text-slate-500 dark:text-slate-600 cursor-not-allowed"
            }`}
          >
            <Plus className="w-4 h-4" />
            إدراج جلسة جديدة
          </button>
        </div>
      </div>

      {!canAdd && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-xs flex items-center gap-2 text-amber-500">
          <ShieldAlert className="w-4 h-4 flex-shrink-0" />
          <span>دورك الحالي <strong>({currentUser.role})</strong> لا يمنح صلاحيات تعديل قرارات الجلسات الختامية أو إدراج مواعيد جديدة.</span>
        </div>
      )}

      {/* Main layout splitting: Left calendar, Right side selected sessions details & Alert hub */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Calendar Grid (Interactive Month View) */}
        <div className="lg:col-span-2 space-y-6">
          <div className={`p-5 rounded-2xl border ${darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
            
            {/* Month selector header */}
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-200 dark:border-slate-800">
              <h3 className={`text-xs font-bold font-sans ${darkMode ? "text-white" : "text-slate-800"}`}>
                🗓️ أجندة الجلسات: {monthNames[currentMonth]} {currentYear}
              </h3>
              
              <div className="flex items-center gap-2">
                <button 
                  onClick={handlePrevMonth} 
                  className="p-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-400 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => { setCurrentMonth(6); setCurrentYear(2026); }}
                  className="px-2 py-0.5 text-[10px] rounded bg-slate-950 text-white font-mono"
                >
                  العودة (يوليو 2026)
                </button>
                <button 
                  onClick={handleNextMonth} 
                  className="p-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-400 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Calendar Days Header and Cells - Responsive Wrapper */}
            <div className="overflow-x-auto w-full">
              <div className="min-w-[500px]">
                {/* Calendar Days Header */}
                <div className="grid grid-cols-7 gap-1 text-center mb-1">
                  {daysOfWeek.map(day => (
                    <span key={day} className="text-xs font-bold text-slate-400 py-1">{day}</span>
                  ))}
                </div>

                {/* Calendar Grid Cells */}
                <div className="grid grid-cols-7 gap-1 text-center">
                  {/* Empty padding cells */}
                  {Array.from({ length: firstDayIndex }).map((_, i) => (
                    <div key={`empty-${i}`} className="p-3"></div>
                  ))}

                  {/* Day cells */}
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1;
                    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                    const isSelected = selectedDate === dateStr;
                    const dateSessions = sessions.filter(s => s.date === dateStr);
                    const hasSessions = dateSessions.length > 0;
                    const hasUncompleted = dateSessions.some(s => !s.isCompleted);

                    return (
                      <div
                        key={`day-${day}`}
                        onClick={() => handleDateClick(day)}
                        className={`p-3 rounded-lg border text-xs cursor-pointer transition-all flex flex-col items-center justify-between min-h-[60px] relative ${
                          isSelected
                            ? "bg-amber-500 border-amber-600 text-slate-950 font-bold"
                            : dateStr === "2026-07-19" // Today marker
                              ? "bg-blue-500/10 border-blue-500 text-blue-500 font-bold"
                              : darkMode
                                ? "bg-slate-950 border-slate-900/60 hover:bg-slate-800 text-slate-300"
                                : "bg-slate-50 border-slate-100 hover:bg-slate-100 text-slate-700"
                        }`}
                      >
                        <span className="font-mono text-xs">{day}</span>
                        
                        {/* Visual indicators of sessions */}
                        {hasSessions && (
                          <div className="flex gap-0.5 mt-1.5">
                            {dateSessions.map((_, idx) => (
                              <span 
                                key={idx} 
                                className={`w-1.5 h-1.5 rounded-full ${
                                  isSelected 
                                    ? "bg-slate-900" 
                                    : hasUncompleted 
                                      ? "bg-amber-500" 
                                      : "bg-emerald-500"
                                }`}
                              ></span>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Programmable Alert Reminders Control */}
          <div className={`p-5 rounded-2xl border ${darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
            <div className="flex items-center justify-between mb-3.5">
              <h3 className="text-xs font-bold text-amber-500 flex items-center gap-1.5">
                <Bell className="w-4 h-4" />
                مركز التنبيهات القانونية والرسائل التلقائية (SMS & WhatsApp)
              </h3>
              <span className="text-[10px] bg-amber-500/10 text-amber-600 px-2 py-0.5 rounded font-bold font-mono">نشط</span>
            </div>
            
            <p className="text-[11px] text-slate-400 mb-3.5">
              نظام ميزان يطلق تنبيهات آلية للموكلين والمحامين قبل الجلسة بـ (٧ أيام، ٣ أيام، يوم، ويوم الجلسة) لتقليل نسب الغياب وضمان الحضور مع المستندات.
            </p>

            {activeAlertsList.length === 0 ? (
              <p className="text-xs text-slate-500 py-3 text-center bg-slate-950/20 rounded-xl">لا توجد تنبيهات مستحقة الإطلاق حالياً.</p>
            ) : (
              <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                {activeAlertsList.map(al => (
                  <div key={al.id} className="p-2.5 rounded-lg text-xs flex items-center justify-between bg-slate-950/40 border border-slate-800">
                    <span className="text-slate-300 font-medium">{al.message}</span>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                      al.type === "عاجل" ? "bg-red-500/10 text-red-500" : "bg-amber-500/10 text-amber-500"
                    }`}>
                      {al.type}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right side: Sessions Scheduled on clicked day */}
        <div className="space-y-4">
          <div className={`p-5 rounded-2xl border ${darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"} text-right`}>
            <div className="flex items-center justify-between mb-4 border-b border-slate-200 dark:border-slate-800 pb-2">
              <h4 className={`text-xs font-bold ${darkMode ? "text-white" : "text-slate-800"}`}>
                📅 جلسات يوم: <span className="text-amber-500 font-mono">{selectedDate}</span>
              </h4>
              <span className="text-xs font-bold text-slate-500">({selectedDateSessions.length}) جلسات</span>
            </div>

            {selectedDateSessions.length === 0 ? (
              <div className="text-center py-12 text-xs text-slate-500">
                لا توجد جلسات أو محاكم مدرجة لهذا اليوم المحدد.
              </div>
            ) : (
              <div className="space-y-3">
                {selectedDateSessions.map(ses => {
                  const caseItem = cases.find(c => c.id === ses.caseId);
                  const clientItem = clients.find(cl => cl.id === caseItem?.clientId);
                  const lawyerItem = usersList.find(u => u.id === ses.assignedLawyerId);

                  return (
                    <div 
                      key={ses.id} 
                      className={`p-3.5 rounded-xl border ${
                        ses.isCompleted 
                          ? "bg-emerald-500/5 border-emerald-500/20" 
                          : "bg-slate-950/40 border-slate-800"
                      } space-y-2`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-amber-500">{ses.type}</span>
                        <span className="text-[11px] bg-slate-900 text-slate-300 font-mono px-2 py-0.5 rounded font-bold">{ses.time}</span>
                      </div>

                      <p className={`text-xs font-bold ${darkMode ? "text-white" : "text-slate-950"}`}>
                        رقم القضية: {caseItem?.caseNumber || "قضية عامة"}
                      </p>
                      
                      <p className="text-[11px] text-slate-400">
                        👤 الموكل: {clientItem?.name}
                      </p>

                      <div className="text-[11px] text-slate-400">
                        🏛️ {ses.court} | {ses.circle}
                      </div>

                      <div className="text-[10px] text-slate-500 flex items-center gap-1 pt-1 border-t border-slate-800/40">
                        <User className="w-3 h-3 text-amber-500" />
                        المحامي المسؤول: {lawyerItem?.name || "غير مسند"}
                      </div>

                      {ses.notesBefore && (
                        <div className="p-2 bg-slate-950 text-[10px] text-slate-400 rounded border border-slate-800/60 leading-relaxed">
                          📌 <strong>ملاحظات التحضير:</strong> {ses.notesBefore}
                        </div>
                      )}

                      {/* Display Decisions / results if saved */}
                      {ses.isCompleted ? (
                        <div className="p-2 bg-emerald-500/5 border border-emerald-500/10 text-[10px] text-emerald-500 rounded space-y-1">
                          <p>⚖️ <strong>القرار المحكم:</strong> {ses.decision}</p>
                          {ses.result && <p>🗒️ <strong>المجريات:</strong> {ses.result}</p>}
                          {ses.nextSessionDate && <p>📅 <strong>تأجيل لجلسة:</strong> {ses.nextSessionDate}</p>}
                        </div>
                      ) : (
                        <button
                          onClick={() => handleOpenResultModal(ses)}
                          disabled={!canEdit}
                          className={`w-full py-1.5 mt-2 rounded bg-amber-500 hover:bg-amber-600 text-slate-950 text-[11px] font-bold cursor-pointer transition-colors ${
                            !canEdit && "opacity-50 cursor-not-allowed"
                          }`}
                        >
                          ⚖️ تسجيل القرار ومجريات الجلسة
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Daily Memo / Notepad - Lined Journal with Line Adjusters */}
          <div className={`p-5 rounded-2xl border ${darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"} text-right space-y-4 shadow-sm`}>
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2.5">
              <div className="flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-amber-500" />
                <h4 className={`text-xs font-bold ${darkMode ? "text-white" : "text-slate-800"}`}>
                  دفتر اليومية ومذكرات المكتب القانونية الحرة
                </h4>
              </div>
              <span className="text-[9px] bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded font-bold">
                حفظ تلقائي مدمج
              </span>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              مسودة ذكية لتدوين مجريات العمل والمشاهدات اليومية أو تعليقات مكتبك الخاصة لليوم المختار: <span className="text-amber-500 font-mono font-bold">{selectedDate}</span>.
            </p>

            {/* Toolbar for adjusting lines */}
            <div className={`p-2 rounded-xl space-y-2 text-[10px] ${
              darkMode ? "bg-slate-950/60" : "bg-slate-50"
            } border ${darkMode ? "border-slate-800" : "border-slate-100"}`}>
              <div className="text-slate-400 font-bold border-b border-slate-800/40 pb-1 text-right">⚙️ لوحة ضبط السطور والخطوط (سهولة الاستخدام)</div>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {/* 1. Rows Adjustment */}
                <div className="flex flex-col gap-1 text-right">
                  <span className="text-slate-500 font-medium">📏 عدد السطور:</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        const next = Math.max(journalRows - 2, 4);
                        setJournalRows(next);
                        localStorage.setItem("meezan_journal_rows", String(next));
                      }}
                      className={`px-1.5 py-1 rounded cursor-pointer text-[10px] font-bold flex-1 text-center transition-all ${
                        darkMode 
                          ? "bg-amber-500/10 text-amber-400 hover:bg-amber-500/20" 
                          : "bg-amber-500 text-slate-950 hover:bg-amber-600"
                      }`}
                      title="تقليل عدد السطور"
                    >
                      تقليل
                    </button>
                    <span className={`font-mono px-1.5 py-0.5 rounded font-bold min-w-[24px] text-center transition-all ${
                      darkMode ? "text-white bg-slate-950 border border-slate-800" : "text-slate-900 bg-slate-200 border border-slate-300"
                    }`}>{journalRows}</span>
                    <button
                      type="button"
                      onClick={() => {
                        const next = Math.min(journalRows + 2, 24);
                        setJournalRows(next);
                        localStorage.setItem("meezan_journal_rows", String(next));
                      }}
                      className={`px-1.5 py-1 rounded cursor-pointer text-[10px] font-bold flex-1 text-center transition-all ${
                        darkMode 
                          ? "bg-amber-500/10 text-amber-400 hover:bg-amber-500/20" 
                          : "bg-amber-500 text-slate-950 hover:bg-amber-600"
                      }`}
                      title="زيادة عدد السطور"
                    >
                      زيادة
                    </button>
                  </div>
                </div>

                {/* 2. Spacing / LineHeight Adjustment */}
                <div className="flex flex-col gap-1 text-right">
                  <span className="text-slate-500 font-medium">↕️ تباعد الأسطر:</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        let next = "2.2rem";
                        if (journalSpacing === "3.0rem") next = "2.6rem";
                        else if (journalSpacing === "2.6rem") next = "2.2rem";
                        else if (journalSpacing === "2.2rem") next = "1.8rem";
                        else return;
                        setJournalSpacing(next);
                        localStorage.setItem("meezan_journal_spacing", next);
                      }}
                      className={`px-1.5 py-1 rounded cursor-pointer text-[10px] font-bold flex-1 text-center transition-all ${
                        darkMode 
                          ? "bg-amber-500/10 text-amber-400 hover:bg-amber-500/20" 
                          : "bg-amber-500 text-slate-950 hover:bg-amber-600"
                      }`}
                      title="تقريب السطور"
                    >
                      تضييق
                    </button>
                    <span className={`font-mono px-1.5 py-0.5 rounded font-bold flex-1 text-center truncate transition-all ${
                      darkMode ? "text-white bg-slate-950 border border-slate-800" : "text-slate-900 bg-slate-200 border border-slate-300"
                    }`}>
                      {journalSpacing === "1.8rem" ? "أضيق" : journalSpacing === "2.2rem" ? "متوسط" : journalSpacing === "2.6rem" ? "واسع" : "أوسع"}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        let next = "2.2rem";
                        if (journalSpacing === "1.8rem") next = "2.2rem";
                        else if (journalSpacing === "2.2rem") next = "2.6rem";
                        else if (journalSpacing === "2.6rem") next = "3.0rem";
                        else return;
                        setJournalSpacing(next);
                        localStorage.setItem("meezan_journal_spacing", next);
                      }}
                      className={`px-1.5 py-1 rounded cursor-pointer text-[10px] font-bold flex-1 text-center transition-all ${
                        darkMode 
                          ? "bg-amber-500/10 text-amber-400 hover:bg-amber-500/20" 
                          : "bg-amber-500 text-slate-950 hover:bg-amber-600"
                      }`}
                      title="إبعاد السطور"
                    >
                      توسيع
                    </button>
                  </div>
                </div>

                {/* 3. FontSize Adjustment */}
                <div className="flex flex-col gap-1 text-right">
                  <span className="text-slate-500 font-medium">🔤 حجم الخط:</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        let next = "13px";
                        if (journalFontSize === "17px") next = "15px";
                        else if (journalFontSize === "15px") next = "13px";
                        else if (journalFontSize === "13px") next = "11px";
                        else return;
                        setJournalFontSize(next);
                        localStorage.setItem("meezan_journal_font_size", next);
                      }}
                      className={`px-1.5 py-1 rounded cursor-pointer text-[10px] font-bold flex-1 text-center transition-all ${
                        darkMode 
                          ? "bg-amber-500/10 text-amber-400 hover:bg-amber-500/20" 
                          : "bg-amber-500 text-slate-950 hover:bg-amber-600"
                      }`}
                    >
                      أصغر
                    </button>
                    <span className={`font-mono px-1.5 py-0.5 rounded font-bold min-w-[24px] text-center transition-all ${
                      darkMode ? "text-white bg-slate-950 border border-slate-800" : "text-slate-900 bg-slate-200 border border-slate-300"
                    }`}>{journalFontSize}</span>
                    <button
                      type="button"
                      onClick={() => {
                        let next = "13px";
                        if (journalFontSize === "11px") next = "13px";
                        else if (journalFontSize === "13px") next = "15px";
                        else if (journalFontSize === "15px") next = "17px";
                        else return;
                        setJournalFontSize(next);
                        localStorage.setItem("meezan_journal_font_size", next);
                      }}
                      className={`px-1.5 py-1 rounded cursor-pointer text-[10px] font-bold flex-1 text-center transition-all ${
                        darkMode 
                          ? "bg-amber-500/10 text-amber-400 hover:bg-amber-500/20" 
                          : "bg-amber-500 text-slate-950 hover:bg-amber-600"
                      }`}
                    >
                      أكبر
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Notebook view with background lines */}
            <div className="relative">
              <textarea
                placeholder="اكتب هنا يوميات ومذكرات العمل القانونية الحرة لهذا اليوم، وسيتم حفظها تلقائياً..."
                value={journalNote}
                onChange={(e) => saveJournalNote(e.target.value)}
                rows={journalRows}
                style={{
                  "--journal-spacing": journalSpacing,
                  "--journal-font-size": journalFontSize
                } as React.CSSProperties}
                className={`w-full p-4 rounded-2xl border focus:outline-none focus:ring-1 focus:ring-amber-500 text-right overflow-y-auto placeholder:text-slate-400 dark:placeholder:text-slate-500 ${
                  darkMode 
                    ? "journal-ruled-dark bg-slate-950/60 border-slate-800 text-slate-200" 
                    : "journal-ruled-light bg-slate-50 border-slate-200 text-slate-950"
                }`}
              />
              
              {/* Notebook Left-Side Rule Line (Classic look on the right side for Arabic RTL) */}
              <div className={`absolute top-0 bottom-0 right-7 w-[1px] pointer-events-none ${
                darkMode ? "bg-red-500/20" : "bg-red-500/40"
              }`}></div>
            </div>

            <div className="flex items-center justify-between text-[10px] text-slate-500">
              <span>آخر تعديل للمفكرة: {selectedDate}</span>
              <button
                type="button"
                onClick={() => {
                  if (confirm("هل تريد مسح مفكرة ويوميات هذا اليوم بالكامل؟")) {
                    saveJournalNote("");
                  }
                }}
                className="text-rose-500 hover:text-rose-400 font-semibold cursor-pointer"
              >
                🗑️ مسح المفكرة
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* Add Session Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`w-full max-w-lg rounded-2xl border shadow-xl overflow-hidden text-right ${
            darkMode ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-900"
          }`}>
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-950/20">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-amber-500" />
                جدولة جلسة تحقيق أو محاكمة جديدة
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="p-1 rounded hover:bg-slate-800 text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <form onSubmit={handleAddSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">اختر القضية المرتبطة *</label>
                <select 
                  value={formData.caseId}
                  onChange={(e) => handleCaseChangeInAdd(e.target.value)}
                  className={`w-full text-xs p-2 rounded-lg border focus:outline-none ${
                    darkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                  }`}
                >
                  <option value="">اختر القضية من الدفتر...</option>
                  {cases.map(c => (
                    <option key={c.id} value={c.id}>{c.caseNumber} - {clients.find(cl => cl.id === c.clientId)?.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">المحكمة *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="تلقائي من ملف القضية"
                    value={formData.court}
                    onChange={(e) => setFormData({...formData, court: e.target.value})}
                    className={`w-full text-xs p-2 rounded-lg border focus:outline-none ${
                      darkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">الدائرة *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="تلقائي من ملف القضية"
                    value={formData.circle}
                    onChange={(e) => setFormData({...formData, circle: e.target.value})}
                    className={`w-full text-xs p-2 rounded-lg border focus:outline-none ${
                      darkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">نوع الجلسة *</label>
                  <select 
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value as any})}
                    className={`w-full text-xs p-2 rounded-lg border focus:outline-none ${
                      darkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                    }`}
                  >
                    {sessionTypesList.map(st => <option key={st} value={st}>{st}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">تاريخ الجلسة *</label>
                  <input 
                    type="date" 
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                    className={`w-full text-xs p-2 rounded-lg border focus:outline-none ${
                      darkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">وقت الحضور *</label>
                  <input 
                    type="time" 
                    required
                    value={formData.time}
                    onChange={(e) => setFormData({...formData, time: e.target.value})}
                    className={`w-full text-xs p-2 rounded-lg border focus:outline-none ${
                      darkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">المحامي المسؤول بالحضور والمرافعة *</label>
                <select 
                  value={formData.assignedLawyerId}
                  onChange={(e) => setFormData({...formData, assignedLawyerId: e.target.value})}
                  className={`w-full text-xs p-2 rounded-lg border focus:outline-none ${
                    darkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                  }`}
                >
                  {usersList.filter(u => u.role === "محامي" || u.role === "صاحب المكتب").map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">تعليمات وتوصيات قبل حضور الجلسة (للمحامي)</label>
                <textarea 
                  placeholder="مثال: تقديم أصل تقرير الخبراء، أو إثبات توكيل جديد رقم..."
                  value={formData.notesBefore}
                  onChange={(e) => setFormData({...formData, notesBefore: e.target.value})}
                  rows={2}
                  className={`w-full text-xs p-2 rounded-lg border focus:outline-none ${
                    darkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                  }`}
                />
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-200 dark:border-slate-800 pt-4">
                <button 
                  type="button" 
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold cursor-pointer"
                >
                  إلغاء
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold cursor-pointer"
                >
                  جدولة الجلسة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Decision / Result Modal */}
      {isResultModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`w-full max-w-lg rounded-2xl border shadow-xl overflow-hidden text-right ${
            darkMode ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-900"
          }`}>
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-950/20">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <Scale className="w-4 h-4 text-amber-500" />
                تسجيل القرار والمجريات القانونية للجلسة
              </h3>
              <button onClick={() => setIsResultModalOpen(false)} className="p-1 rounded hover:bg-slate-800 text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <form onSubmit={handleResultSubmit} className="p-5 space-y-4">
              <p className="text-[11px] text-slate-400">
                قضية: <strong>{cases.find(c => c.id === activeSessionForResult?.caseId)?.caseNumber}</strong> | المحكمة: {activeSessionForResult?.court}
              </p>

              <div>
                <label className="block text-xs text-slate-400 mb-1">القرار الرسمي الصادر من هيئة المحكمة *</label>
                <input 
                  type="text" 
                  required
                  placeholder="مثال: التأجيل لجلسة ٢٥ سبتمبر لتقديم مستندات الإثبات وصحيفة المعلن."
                  value={resultData.decision}
                  onChange={(e) => setResultData({...resultData, decision: e.target.value})}
                  className={`w-full text-xs p-2 rounded-lg border focus:outline-none ${
                    darkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">مجريات وما حدث أثناء الجلسة بالتفصيل</label>
                <textarea 
                  placeholder="مثال: مثل الموكل بالجلسة وترافعنا دافعين بـ... وحضر وكيل الخصم وطلب أجل للإطلاع."
                  value={resultData.result}
                  onChange={(e) => setResultData({...resultData, result: e.target.value})}
                  rows={3}
                  className={`w-full text-xs p-2 rounded-lg border focus:outline-none ${
                    darkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                  }`}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">تاريخ الجلسة القادمة (إن وجد تأجيل)</label>
                  <input 
                    type="date" 
                    value={resultData.nextSessionDate}
                    onChange={(e) => setResultData({...resultData, nextSessionDate: e.target.value})}
                    className={`w-full text-xs p-2 rounded-lg border focus:outline-none ${
                      darkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                    }`}
                  />
                </div>
                <div className="flex items-center pt-5">
                  <input 
                    type="checkbox" 
                    id="createNextTask"
                    checked={resultData.createNextTask}
                    onChange={(e) => setResultData({...resultData, createNextTask: e.target.checked})}
                    className="w-4 h-4 ml-2 text-amber-500 rounded border-slate-800 bg-slate-950"
                  />
                  <label htmlFor="createNextTask" className="text-xs text-slate-400 cursor-pointer">
                    إنشاء مهمة عمل تلقائية للتحضير للتأجيل
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-200 dark:border-slate-800 pt-4">
                <button 
                  type="button" 
                  onClick={() => setIsResultModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold cursor-pointer"
                >
                  إلغاء
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold cursor-pointer"
                >
                  حفظ وتسجيل النتيجة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
