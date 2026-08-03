/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  Briefcase, 
  Plus, 
  Search, 
  User, 
  Calendar as CalendarIcon, 
  Clock, 
  FileText, 
  DollarSign, 
  Trash2, 
  Edit, 
  X,
  AlertCircle,
  TrendingUp,
  MapPin,
  Scale,
  Paperclip,
  CheckCircle2,
  ShieldAlert,
  Sparkles
} from "lucide-react";
import { 
  User as UserType, 
  Client, 
  Case, 
  Session, 
  Task, 
  Document, 
  Payment, 
  Expense, 
  CaseType, 
  LitigationDegree, 
  CaseStatus 
} from "../types";
import FormTooltip from "./FormTooltip";

interface CasesViewProps {
  currentUser: UserType;
  cases: Case[];
  clients: Client[];
  sessions: Session[];
  tasks: Task[];
  documents: Document[];
  payments: Payment[];
  expenses: Expense[];
  usersList: UserType[];
  onAddCase: (caseData: Omit<Case, "id">) => void;
  onEditCase: (caseItem: Case) => void;
  onDeleteCase: (caseId: string) => void;
  darkMode: boolean;
}

export default function CasesView({
  currentUser,
  cases,
  clients,
  sessions,
  tasks,
  documents,
  payments,
  expenses,
  usersList,
  onAddCase,
  onEditCase,
  onDeleteCase,
  darkMode
}: CasesViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingCase, setEditingCase] = useState<Case | null>(null);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);

  const handleGenerateAiDescription = async (context: string) => {
    setIsGeneratingAi(true);
    try {
      const token = localStorage.getItem("meezan_session_token");
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      const response = await fetch("/api/suggest-legal", {
        method: "POST",
        headers,
        body: JSON.stringify({ type: "case", caseType: formData.type || "دعوى", context })
      });
      const data = await response.json();
      if (data.suggestion) {
        setFormData(prev => ({ ...prev, description: data.suggestion }));
      } else {
        alert("فشل في استرداد الاقتراح");
      }
    } catch (error) {
      console.error(error);
      alert("حدث خطأ أثناء الاتصال بالمساعد الذكي");
    } finally {
      setIsGeneratingAi(false);
    }
  };

  // Filter options
  const [statusFilter, setStatusFilter] = useState<string>("الكل");
  const [typeFilter, setTypeFilter] = useState<string>("الكل");

  // Form States for Case Add/Edit
  const [formData, setFormData] = useState({
    caseNumber: "",
    year: "2026",
    type: "مدني" as CaseType,
    degree: "أول درجة" as LitigationDegree,
    court: "",
    circle: "",
    governorate: "القاهرة",
    district: "",
    registrationDate: new Date().toISOString().split("T")[0],
    status: "جديدة" as CaseStatus,
    claimValue: 0,
    clientId: "",
    opponents: "",
    opponentLawyer: "",
    assignedLawyerId: "",
    description: "",
    notes: "",
    totalFees: 0
  });


  // Check Permissions
  const canAdd = currentUser.permissions.add;
  const canEdit = currentUser.permissions.edit;
  const canDelete = currentUser.permissions.delete;

  const activeCases = cases.filter(c => !c.isDeleted);

  // Filtered cases list based on Search + Filters
  const filteredCases = activeCases.filter(c => {
    const term = searchQuery.toLowerCase();
    const caseClient = clients.find(cl => cl.id === c.clientId);
    const clientName = caseClient ? (caseClient.name || "").toLowerCase() : "";

    const matchesSearch = 
      (c.caseNumber || "").toLowerCase().includes(term) ||
      (c.court || "").toLowerCase().includes(term) ||
      (c.circle || "").toLowerCase().includes(term) ||
      clientName.includes(term) ||
      (c.opponents || "").toLowerCase().includes(term) ||
      (c.description || "").toLowerCase().includes(term);

    const matchesStatus = statusFilter === "الكل" || c.status === statusFilter;
    const matchesType = typeFilter === "الكل" || c.type === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  const selectedCase = cases.find(c => c.id === selectedCaseId && !c.isDeleted);

  // Case Specific items
  const caseClient = selectedCase ? clients.find(cl => cl.id === selectedCase.clientId) : null;
  const caseLawyer = selectedCase ? usersList.find(u => u.id === selectedCase.assignedLawyerId) : null;
  const caseSessions = selectedCase ? sessions.filter(s => s.caseId === selectedCase.id) : [];
  const caseTasks = selectedCase ? tasks.filter(t => t.caseId === selectedCase.id) : [];
  const caseDocs = selectedCase ? documents.filter(d => d.caseId === selectedCase.id) : [];
  const casePayments = selectedCase ? payments.filter(p => p.caseId === selectedCase.id) : [];
  const caseExpenses = selectedCase ? expenses.filter(e => e.caseId === selectedCase.id) : [];

  // Financial calculations
  const totalPaid = casePayments.reduce((sum, p) => sum + p.amount, 0);
  const remainingFees = selectedCase ? selectedCase.totalFees - totalPaid : 0;
  const totalCaseExpenses = caseExpenses.reduce((sum, e) => sum + e.amount, 0);

  // Compile a cohesive visual timeline for the case
  // Merge sessions, payments, documents, and tasks sorted by date
  interface TimelineEvent {
    id: string;
    date: string;
    type: "جلسة" | "دفعة" | "مستند" | "مهمة";
    title: string;
    description: string;
    badge?: string;
  }

  const caseTimeline: TimelineEvent[] = [];
  if (selectedCase) {
    caseSessions.forEach(s => {
      caseTimeline.push({
        id: `timeline-ses-${s.id}`,
        date: s.date,
        type: "جلسة",
        title: `جلسة مرافعة: ${s.type}`,
        description: s.isCompleted 
          ? `القرار: ${s.decision || "لم يُسجل قرار"} | النتيجة: ${s.result || "لا يوجد ملاحظات"}`
          : `ساعة الجلسة: ${s.time} | المحامي المسؤول: ${usersList.find(u => u.id === s.assignedLawyerId)?.name || "غير محدد"}`
      });
    });

    casePayments.forEach(p => {
      caseTimeline.push({
        id: `timeline-pay-${p.id}`,
        date: p.date,
        type: "دفعة",
        title: `تحصيل أتعاب: + ${p.amount} ج.م`,
        description: `طريقة الدفع: ${p.method} | إيصال: ${p.receiptNumber} | مستلم بواسطة: ${usersList.find(u => u.id === p.recipientId)?.name || "الحسابات"}`
      });
    });

    caseDocs.forEach(d => {
      caseTimeline.push({
        id: `timeline-doc-${d.id}`,
        date: d.timestamp.split(" ")[0],
        type: "مستند",
        title: `مستند مرفق: ${d.title}`,
        description: `نوع المستند: ${d.type} | الملف: ${d.fileName} (${d.fileSize})`
      });
    });

    caseTasks.forEach(t => {
      caseTimeline.push({
        id: `timeline-tsk-${t.id}`,
        date: t.dueDate,
        type: "مهمة",
        title: `مهمة قانونية: ${t.title}`,
        description: `الأولوية: ${t.priority} | الحالة الحالية: ${t.status} | إسناد إلى: ${usersList.find(u => u.id === t.assignedLawyerId)?.name || "غير مححدد"}`
      });
    });

    // Sort descending by date
    caseTimeline.sort((a, b) => b.date.localeCompare(a.date));
  }

  const handleOpenAddModal = () => {
    if (!canAdd) return;
    setFormData({
      caseNumber: "",
      year: "2026",
      type: "مدني",
      degree: "أول درجة",
      court: "",
      circle: "",
      governorate: "القاهرة",
      district: "",
      registrationDate: new Date().toISOString().split("T")[0],
      status: "جديدة",
      claimValue: 0,
      clientId: clients[0]?.id || "",
      opponents: "",
      opponentLawyer: "",
      assignedLawyerId: usersList.find(u => u.role === "محامي" || u.role === "صاحب المكتب")?.id || usersList[0]?.id || "",
      description: "",
      notes: "",
      totalFees: 0
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (c: Case) => {
    if (!canEdit) return;
    setEditingCase(c);
    setFormData({
      caseNumber: c.caseNumber,
      year: c.year,
      type: c.type,
      degree: c.degree,
      court: c.court,
      circle: c.circle,
      governorate: c.governorate,
      district: c.district,
      registrationDate: c.registrationDate,
      status: c.status,
      claimValue: c.claimValue || 0,
      clientId: c.clientId,
      opponents: c.opponents,
      opponentLawyer: c.opponentLawyer || "",
      assignedLawyerId: c.assignedLawyerId,
      description: c.description,
      notes: c.notes,
      totalFees: c.totalFees
    });
    setIsEditModalOpen(true);
  };

  const handleSaveAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.caseNumber || !formData.clientId || !formData.assignedLawyerId) {
      alert("الرجاء التحقق من كتابة رقم القضية واختيار الموكل والمحامي المسؤول.");
      return;
    }
    onAddCase(formData);
    setIsAddModalOpen(false);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCase) return;
    onEditCase({
      ...editingCase,
      ...formData
    });
    setIsEditModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (!canDelete) return;
    if (confirm("هل أنت متأكد من نقل هذه القضية لسلة المحفوظات المحذوفة؟ (Soft Delete)")) {
      onDeleteCase(id);
      if (selectedCaseId === id) setSelectedCaseId(null);
    }
  };

  const caseTypes: CaseType[] = [
    "مدني", "جنائي", "أسرة", "تجاري", "عمالي", "إداري", "مجلس دولة", "ضرائب", "إيجارات", "تنفيذ", "استئناف", "نقض", "أخرى"
  ];

  const litigationDegrees: LitigationDegree[] = [
    "أول درجة", "استئناف", "نقض", "تنفيذ", "محكمة اقتصادية", "محكمة إدارية", "محكمة الأسرة"
  ];

  const caseStatuses: CaseStatus[] = [
    "جديدة", "قيد الدراسة", "قيد التداول", "مؤجلة", "حكم لصالح العميل", "حكم ضد العميل", "استئناف", "تنفيذ", "مغلقة", "محفوظة"
  ];

  const egyptianGovernorates = [
    "القاهرة", "الجيزة", "الإسكندرية", "القليوبية", "الدقهلية", "الغربية", "الشرقية", "المنوفية", "دمياط", "بورسعيد", "السويس", "الإسماعيلية", "البحيرة", "الفيوم", "بني سويف", "المنيا", "أسيوط", "سوهاج", "قنا", "الأقصر", "أسوان", "البحر الأحمر", "الوادي الجديد", "مطروح", "شمال سيناء", "جنوب سيناء"
  ];

  return (
    <div className="space-y-6 text-right" dir="rtl">
      
      {/* Title Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className={`text-xl font-bold font-sans ${darkMode ? "text-white" : "text-slate-900"}`}>دفتر القضايا والملفات القانونية</h2>
          <p className="text-xs text-slate-500 mt-1">سجل كامل بجميع القضايا بمختلف درجات التقاضي، وتواريخ القيد والمحاكم والدوائر المختصة بمصر.</p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-300 px-3 py-1.5 rounded-lg font-semibold">
            قضايا نشطة ومغلقة: {activeCases.length} ملف
          </span>
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
            قضية جديدة
          </button>
        </div>
      </div>

      {!canAdd && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-xs flex items-center gap-2 text-amber-500">
          <ShieldAlert className="w-4 h-4 flex-shrink-0" />
          <span>دورك الحالي <strong>({currentUser.role})</strong> يقيد صلاحيات التسجيل أو التعديل للقضايا طبقاً للائحة المكتب.</span>
        </div>
      )}

      {/* Main Panel splitting Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Right Pane: Case Catalogue with Filter and Search */}
        <div className="lg:col-span-1 space-y-4">
          <div className={`p-4 rounded-2xl border ${darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"} space-y-3`}>
            
            {/* Case Search */}
            <div className="relative">
              <input
                type="text"
                placeholder="ابحث برقم القضية، الموكل، المحكمة..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pr-10 pl-4 py-2 rounded-xl text-xs border focus:outline-none transition-colors ${
                  darkMode 
                    ? "bg-slate-950 border-slate-800 text-white focus:border-amber-400" 
                    : "bg-slate-50 border-slate-200 text-slate-800 focus:border-amber-500"
                }`}
              />
              <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-2.5" />
            </div>

            {/* Quick Filter Selects */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[9px] text-slate-400 mb-1">فلترة بالحالة</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full text-[11px] bg-slate-950 border border-slate-800/80 rounded px-2 py-1 text-white"
                >
                  <option value="الكل">كل الحالات</option>
                  {caseStatuses.map(st => <option key={st} value={st}>{st}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[9px] text-slate-400 mb-1">فلترة بالنوع</label>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="w-full text-[11px] bg-slate-950 border border-slate-800/80 rounded px-2 py-1 text-white"
                >
                  <option value="الكل">كل الأنواع</option>
                  {caseTypes.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>

            {/* Cases List */}
            <div className="pt-2 space-y-2 overflow-y-auto max-h-[500px] pr-1">
              {filteredCases.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-500">
                  لا توجد قضايا تطابق هذه الفلاتر حالياً.
                </div>
              ) : (
                filteredCases.map((cas) => {
                  const isSelected = selectedCaseId === cas.id;
                  const caseCli = clients.find(cl => cl.id === cas.clientId);
                  return (
                    <div
                      key={cas.id}
                      onClick={() => setSelectedCaseId(cas.id)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer text-right ${
                        isSelected
                          ? "bg-amber-500/10 border-amber-500"
                          : darkMode
                            ? "bg-slate-950 border-slate-800/80 hover:bg-slate-800/40"
                            : "bg-slate-50 border-slate-100 hover:bg-slate-100/50"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-bold text-amber-500">{cas.caseNumber}</span>
                        <span className={`text-[9px] px-2 py-0.5 rounded font-bold ${
                          cas.status === "حكم لصالح العميل" || cas.status === "مغلقة"
                            ? "bg-emerald-500/10 text-emerald-500"
                            : cas.status === "مؤجلة" || cas.status === "قيد التداول"
                              ? "bg-amber-500/10 text-amber-500"
                              : "bg-blue-500/10 text-blue-500"
                        }`}>
                          {cas.status}
                        </span>
                      </div>
                      <p className={`text-xs font-semibold truncate ${darkMode ? "text-slate-200" : "text-slate-800"}`}>
                        {caseCli?.name || "موكل مجهول"}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-1 truncate">🏛️ {cas.court} | {cas.circle}</p>
                      <div className="mt-2.5 pt-1.5 border-t border-slate-100 dark:border-slate-800/40 flex items-center justify-between text-[9px] text-slate-500">
                        <span>🏷️ {cas.type}</span>
                        <span className="font-mono">{cas.registrationDate}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Left Pane: Detailed Case Hub */}
        <div className="lg:col-span-2">
          {selectedCase ? (
            <div className={`p-6 rounded-2xl border ${darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"} space-y-6`}>
              
              {/* Header profile */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center">
                    <Scale className="w-6 h-6" />
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2">
                      <h3 className={`text-base font-bold ${darkMode ? "text-white" : "text-slate-900"}`}>قضية رقم {selectedCase.caseNumber}</h3>
                      <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-bold font-mono">
                        {selectedCase.year}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">🏛️ المختص: {selectedCase.court} - {selectedCase.circle}</p>
                  </div>
                </div>

                {/* Edit & Delete Action Row */}
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => handleOpenEditModal(selectedCase)}
                    disabled={!canEdit}
                    className={`p-2 rounded-lg border flex items-center justify-center transition-colors ${
                      canEdit 
                        ? "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-amber-400 hover:text-slate-950 hover:border-amber-400 cursor-pointer text-slate-600 dark:text-slate-300" 
                        : "bg-slate-200 dark:bg-slate-800 border-slate-100 cursor-not-allowed text-slate-400"
                    }`}
                    title="تعديل ملف القضية"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleDelete(selectedCase.id)}
                    disabled={!canDelete}
                    className={`p-2 rounded-lg border flex items-center justify-center transition-colors ${
                      canDelete 
                        ? "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-rose-500 hover:text-white hover:border-rose-500 cursor-pointer text-rose-500" 
                        : "bg-slate-200 dark:bg-slate-800 border-slate-100 cursor-not-allowed text-slate-400"
                    }`}
                    title="حذف القضية"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Grid 4-Column quick characteristics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800/80 text-right">
                  <span className="text-[10px] text-slate-400 block mb-1">الموكل القانوني</span>
                  <span className={`text-xs font-bold block truncate ${darkMode ? "text-amber-400" : "text-amber-600"}`}>
                    👤 {caseClient?.name || "غير محدد"}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800/80 text-right">
                  <span className="text-[10px] text-slate-400 block mb-1">الخصوم والمدعى عليهم</span>
                  <span className={`text-xs font-bold block truncate ${darkMode ? "text-slate-200" : "text-slate-800"}`} title={selectedCase.opponents}>
                    👥 {selectedCase.opponents}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800/80 text-right">
                  <span className="text-[10px] text-slate-400 block mb-1">المحافظة والقسم</span>
                  <span className={`text-xs block ${darkMode ? "text-slate-200" : "text-slate-800"}`}>
                    📍 {selectedCase.governorate} - {selectedCase.district || "عام"}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800/80 text-right">
                  <span className="text-[10px] text-slate-400 block mb-1">المحامي المسؤول</span>
                  <span className={`text-xs block truncate ${darkMode ? "text-slate-200" : "text-slate-800"}`}>
                    ⚖️ {caseLawyer?.name || "غير مسند"}
                  </span>
                </div>
              </div>

              {/* Case Claim/Summary Info block */}
              <div className="p-4 bg-slate-950/30 border border-slate-800/80 rounded-2xl space-y-2">
                <h4 className="text-xs font-bold text-slate-400">📝 موضوع وعريضة الدعوى</h4>
                <p className={`text-xs leading-relaxed ${darkMode ? "text-slate-300" : "text-slate-700"}`}>
                  {selectedCase.description || "لم يُسجل موضوع تفصيلي للقضية."}
                </p>
                {selectedCase.claimValue ? (
                  <p className="text-xs text-amber-500 pt-1 font-bold">
                    💰 قيمة المطالبات / النزاع المالي: {selectedCase.claimValue.toLocaleString()} جنيه مصري.
                  </p>
                ) : null}
              </div>

              {/* Financial Box Specific to Case */}
              <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="text-right">
                  <h4 className="text-xs font-bold text-emerald-500">💰 التقرير المالي التعاقدي للقضية</h4>
                  <p className="text-[10px] text-slate-500 mt-0.5">القيمة المقررة للأتعاب، المسدد الفعلي بمكتب الحسابات، والمصروفات القضائية المستهلكة.</p>
                </div>
                <div className="flex items-center gap-4 text-center">
                  <div className="px-3 border-l border-slate-200 dark:border-slate-800">
                    <span className="text-[9px] text-slate-500 block">إجمالي الاتفاق</span>
                    <span className="text-xs font-bold text-slate-400 font-mono">{selectedCase.totalFees.toLocaleString()} ج.م</span>
                  </div>
                  <div className="px-3 border-l border-slate-200 dark:border-slate-800">
                    <span className="text-[9px] text-slate-500 block">المحصل الفعلي</span>
                    <span className="text-xs font-bold text-emerald-500 font-mono">{totalPaid.toLocaleString()} ج.م</span>
                  </div>
                  <div className="px-3 border-l border-slate-200 dark:border-slate-800">
                    <span className="text-[9px] text-slate-500 block">متبقي مطلوب</span>
                    <span className={`text-xs font-bold font-mono ${remainingFees > 0 ? "text-rose-500" : "text-emerald-500"}`}>
                      {remainingFees.toLocaleString()} ج.م
                    </span>
                  </div>
                  <div className="px-3">
                    <span className="text-[9px] text-slate-500 block">مصروفات قضائية</span>
                    <span className="text-xs font-bold text-amber-500 font-mono">{totalCaseExpenses.toLocaleString()} ج.م</span>
                  </div>
                </div>
              </div>

              {/* Secondary Layout Tabs: Timeline and active items */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                
                {/* Right Tab side: Case Court Sessions and Tasks */}
                <div className="md:col-span-2 space-y-6">
                  
                  {/* Sessions widget */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 mb-2.5">📅 الجلسات الخاصة بهذه القضية ({caseSessions.length})</h4>
                    {caseSessions.length === 0 ? (
                      <p className="text-xs text-slate-500 py-3 bg-slate-50 dark:bg-slate-800/10 text-center rounded-xl">لا توجد جلسات مجدولة بعد لهذه القضية.</p>
                    ) : (
                      <div className="space-y-2">
                        {caseSessions.map(ses => (
                          <div key={ses.id} className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/20 text-right">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-amber-500">{ses.type}</span>
                              <span className="text-[10px] text-slate-400 font-mono">{ses.date} | {ses.time}</span>
                            </div>
                            <p className="text-xs text-slate-400 mt-1">🏛️ {ses.court} | {ses.circle}</p>
                            {ses.isCompleted && (
                              <div className="mt-2 text-[11px] text-emerald-500 bg-emerald-500/5 p-2 rounded border border-emerald-500/10">
                                <strong>القرار:</strong> {ses.decision || "حفظ المحضر أو القرار"}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Visual Case Timeline events */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 mb-2.5">🕒 التاريخ الزمني لملف القضية (Timeline)</h4>
                    {caseTimeline.length === 0 ? (
                      <p className="text-xs text-slate-500 py-3 bg-slate-50 dark:bg-slate-800/10 text-center rounded-xl">لا يوجد أحداث مسجلة بعد في الملف المدمج.</p>
                    ) : (
                      <div className="relative border-r border-slate-200 dark:border-slate-800 pr-4 space-y-4">
                        {caseTimeline.map(evt => (
                          <div key={evt.id} className="relative">
                            {/* Dot */}
                            <span className={`absolute -right-[21px] top-1.5 w-2.5 h-2.5 rounded-full border-2 border-slate-900 ${
                              evt.type === "جلسة" 
                                ? "bg-amber-500" 
                                : evt.type === "دفعة" 
                                  ? "bg-emerald-500" 
                                  : evt.type === "مستند" 
                                    ? "bg-blue-500" 
                                    : "bg-purple-500"
                            }`}></span>

                            <div className="text-right">
                              <span className="text-[9px] font-mono font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded">
                                {evt.date}
                              </span>
                              <h5 className={`text-xs font-bold mt-1 ${darkMode ? "text-slate-200" : "text-slate-800"}`}>
                                {evt.title}
                              </h5>
                              <p className="text-[11px] text-slate-400 leading-relaxed mt-0.5">
                                {evt.description}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                </div>

                {/* Left Tab side: Case Documents Archive and Tasks list */}
                <div className="md:col-span-1 space-y-6">
                  
                  {/* Document Mapped vault */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 mb-2.5">📂 مستندات الأرشيف المودعة ({caseDocs.length})</h4>
                    {caseDocs.length === 0 ? (
                      <p className="text-xs text-slate-500 py-3 bg-slate-50 dark:bg-slate-800/10 text-center rounded-xl">لا يوجد مستندات مؤرشفة بعد لهذه القضية.</p>
                    ) : (
                      <div className="space-y-2">
                        {caseDocs.map(doc => (
                          <div key={doc.id} className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-950/40 text-right">
                            <div className="flex items-center gap-2 text-xs font-bold truncate text-slate-300">
                              <Paperclip className="w-3.5 h-3.5 text-amber-500" />
                              <span className="truncate" title={doc.title}>{doc.title}</span>
                            </div>
                            <p className="text-[10px] text-slate-400 mt-1 truncate">{doc.fileName} ({doc.fileSize})</p>
                            <span className="text-[9px] text-amber-500/80 block mt-1 font-mono">{doc.type}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Tasks list */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 mb-2.5">📋 المهام الموكلة بالمكتب ({caseTasks.length})</h4>
                    {caseTasks.length === 0 ? (
                      <p className="text-xs text-slate-500 py-3 bg-slate-50 dark:bg-slate-800/10 text-center rounded-xl">لا يوجد مهام حالية معلقة.</p>
                    ) : (
                      <div className="space-y-2">
                        {caseTasks.map(t => (
                          <div key={t.id} className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 text-right">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold text-slate-300 truncate max-w-[100px]" title={t.title}>{t.title}</span>
                              <span className={`text-[8px] font-bold px-1 py-0.2 rounded ${
                                t.priority === "عاجلة" ? "bg-red-500 text-white animate-pulse" : "bg-slate-800 text-slate-400"
                              }`}>{t.priority}</span>
                            </div>
                            <p className="text-[9px] text-slate-400 mt-1">الحالة: {t.status} | استحقاق: {t.dueDate}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                </div>

              </div>

            </div>
          ) : (
            <div className={`p-12 rounded-2xl border ${darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"} text-center flex flex-col items-center justify-center h-full min-h-[400px]`}>
              <Scale className="w-16 h-16 text-slate-700/80 mb-4 stroke-[1.2]" />
              <h3 className={`text-base font-bold ${darkMode ? "text-slate-300" : "text-slate-700"}`}>اختر ملف قضية للمراجعة</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm">
                قم باختيار قضية من الفهرس القانوني على اليمين للوصول لكامل الصلاحيات، ومراجعة الجلسات، وعرض الجدول المالي والخط الزمني المدمج.
              </p>
            </div>
          )}
        </div>

      </div>

      {/* Add Case Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className={`w-full max-w-2xl rounded-2xl border shadow-xl overflow-hidden text-right my-8 ${
            darkMode ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-900"
          }`}>
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-950/20">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-amber-500" />
                تسجيل قضية جديدة وتعيين محكمة الاختصار
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="p-1 rounded hover:bg-slate-800 text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <form onSubmit={handleSaveAdd} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="flex items-center gap-1 text-xs text-slate-400 mb-1">
                    <span>رقم القضية (بالكامل) *</span>
                    <FormTooltip content="رقم القضية المسجل في قلم كتاب المحكمة بالكامل، متبوعاً بسنة القيد (مثال: 4152 لسنة 2023)." />
                  </label>
                  <input 
                    type="text" 
                    required
                    placeholder="مثال: 4152 لسنة 2023"
                    value={formData.caseNumber}
                    onChange={(e) => setFormData({...formData, caseNumber: e.target.value})}
                    className={`w-full text-xs p-2 rounded-lg border focus:outline-none ${
                      darkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                    }`}
                  />
                </div>
                <div>
                  <label className="flex items-center gap-1 text-xs text-slate-400 mb-1">
                    <span>سنة القضية *</span>
                    <FormTooltip content="السنة الميلادية التي تم فيها تسجيل أو قيد القضية رسمياً في جدول المحكمة." />
                  </label>
                  <input 
                    type="text" 
                    required
                    placeholder="2023"
                    value={formData.year}
                    onChange={(e) => setFormData({...formData, year: e.target.value})}
                    className={`w-full text-xs p-2 rounded-lg border focus:outline-none ${
                      darkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                    }`}
                  />
                </div>
                <div>
                  <label className="flex items-center gap-1 text-xs text-slate-400 mb-1">
                    <span>الموكل المرتبط *</span>
                    <FormTooltip content="اختر الموكل صاحب القضية من قائمة عملاء المكتب المسجلين." />
                  </label>
                  <select 
                    value={formData.clientId}
                    onChange={(e) => setFormData({...formData, clientId: e.target.value})}
                    className={`w-full text-xs p-2 rounded-lg border focus:outline-none ${
                      darkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                    }`}
                  >
                    <option value="">اختر العميل...</option>
                    {clients.map(cl => (
                      <option key={cl.id} value={cl.id}>{cl.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="flex items-center gap-1 text-xs text-slate-400 mb-1">
                    <span>نوع القضية *</span>
                    <FormTooltip content="التصنيف القانوني العام لنوع الدعوى (مدني، جنائي، أسرة، تجاري، إلخ)." />
                  </label>
                  <select 
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value as CaseType})}
                    className={`w-full text-xs p-2 rounded-lg border focus:outline-none ${
                      darkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                    }`}
                  >
                    {caseTypes.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="flex items-center gap-1 text-xs text-slate-400 mb-1">
                    <span>درجة التقاضي *</span>
                    <FormTooltip content="المرحلة القضائية الحالية للدعوى (ابتدائي، استئناف، نقض، إلخ)." />
                  </label>
                  <select 
                    value={formData.degree}
                    onChange={(e) => setFormData({...formData, degree: e.target.value as LitigationDegree})}
                    className={`w-full text-xs p-2 rounded-lg border focus:outline-none ${
                      darkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                    }`}
                  >
                    {litigationDegrees.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="flex items-center gap-1 text-xs text-slate-400 mb-1">
                    <span>حالة القضية القانونية *</span>
                    <FormTooltip content="الحالة الإجرائية والعملية الحالية للملف (متداولة، محجوزة للحكم، مشطوبة، مغلقة، إلخ)." />
                  </label>
                  <select 
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value as CaseStatus})}
                    className={`w-full text-xs p-2 rounded-lg border focus:outline-none ${
                      darkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                    }`}
                  >
                    {caseStatuses.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="flex items-center gap-1 text-xs text-slate-400 mb-1">
                    <span>المحكمة المختصة *</span>
                    <FormTooltip content="المحكمة التي تنظر الدعوى حالياً (مثال: محكمة شمال القاهرة الابتدائية)." />
                  </label>
                  <input 
                    type="text" 
                    required
                    placeholder="مثال: محكمة شمال القاهرة الابتدائية"
                    value={formData.court}
                    onChange={(e) => setFormData({...formData, court: e.target.value})}
                    className={`w-full text-xs p-2 rounded-lg border focus:outline-none ${
                      darkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                    }`}
                  />
                </div>
                <div>
                  <label className="flex items-center gap-1 text-xs text-slate-400 mb-1">
                    <span>الدائرة *</span>
                    <FormTooltip content="الدائرة المحددة لنظر الدعوى وجلساتها بالمحكمة (مثال: الدائرة 12 مدني العباسية)." />
                  </label>
                  <input 
                    type="text" 
                    required
                    placeholder="مثال: الدائرة 12 مدني العباسية"
                    value={formData.circle}
                    onChange={(e) => setFormData({...formData, circle: e.target.value})}
                    className={`w-full text-xs p-2 rounded-lg border focus:outline-none ${
                      darkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                    }`}
                  />
                </div>
                <div>
                  <label className="flex items-center gap-1 text-xs text-slate-400 mb-1">
                    <span>المحافظة القانونية *</span>
                    <FormTooltip content="المحافظة الجغرافية التابع لها المحكمة المختصة قانوناً." />
                  </label>
                  <select 
                    value={formData.governorate}
                    onChange={(e) => setFormData({...formData, governorate: e.target.value})}
                    className={`w-full text-xs p-2 rounded-lg border focus:outline-none ${
                      darkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                    }`}
                  >
                    {egyptianGovernorates.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="flex items-center gap-1 text-xs text-slate-400 mb-1">
                    <span>المركز أو القسم (اختياري)</span>
                    <FormTooltip content="المركز أو قسم الشرطة التابع له النطاق الجغرافي للدعوى ومقر النزاع." />
                  </label>
                  <input 
                    type="text" 
                    placeholder="مثال: الوايلي"
                    value={formData.district}
                    onChange={(e) => setFormData({...formData, district: e.target.value})}
                    className={`w-full text-xs p-2 rounded-lg border focus:outline-none ${
                      darkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                    }`}
                  />
                </div>
                <div>
                  <label className="flex items-center gap-1 text-xs text-slate-400 mb-1">
                    <span>الخصوم والمدعى عليهم *</span>
                    <FormTooltip content="أسماء الأطراف الأخرى أو الخصوم في الدعوى والمدعى عليهم بالكامل وصفاتهم." />
                  </label>
                  <input 
                    type="text" 
                    required
                    placeholder="مثال: شركة الفرسان للمقاولات"
                    value={formData.opponents}
                    onChange={(e) => setFormData({...formData, opponents: e.target.value})}
                    className={`w-full text-xs p-2 rounded-lg border focus:outline-none ${
                      darkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                    }`}
                  />
                </div>
                <div>
                  <label className="flex items-center gap-1 text-xs text-slate-400 mb-1">
                    <span>محامي الخصم (إن وجد)</span>
                    <FormTooltip content="اسم الزميل محامي الطرف الآخر أو الخصم لتسهيل التواصل والترتيبات الإجرائية الودية." />
                  </label>
                  <input 
                    type="text" 
                    placeholder="مثال: أستاذ بهاء الدين"
                    value={formData.opponentLawyer}
                    onChange={(e) => setFormData({...formData, opponentLawyer: e.target.value})}
                    className={`w-full text-xs p-2 rounded-lg border focus:outline-none ${
                      darkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="flex items-center gap-1 text-xs text-slate-400 mb-1">
                    <span>المحامي المسؤول بمكتبنا *</span>
                    <FormTooltip content="المحامي الشريك أو المساعد من مكتبنا المكلف بمتابعة وحضور جلسات هذه القضية." />
                  </label>
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
                  <label className="flex items-center gap-1 text-xs text-slate-400 mb-1">
                    <span>تاريخ قيد الدعوى *</span>
                    <FormTooltip content="التاريخ الرسمي لتقديم صحيفة الدعوى رسمياً ودفعه الرسوم بمقلم كتاب المحكمة." />
                  </label>
                  <input 
                    type="date" 
                    required
                    value={formData.registrationDate}
                    onChange={(e) => setFormData({...formData, registrationDate: e.target.value})}
                    className={`w-full text-xs p-2 rounded-lg border focus:outline-none ${
                      darkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                    }`}
                  />
                </div>
                <div>
                  <label className="flex items-center gap-1 text-xs text-slate-400 mb-1">
                    <span>قيمة المطالبات المالية (إن وجد)</span>
                    <FormTooltip content="القيمة المالية المتنازع عليها أو التعويضات المادية المطلوبة بصحيفة الدعوى بالجنيه." />
                  </label>
                  <input 
                    type="number" 
                    placeholder="0"
                    value={formData.claimValue}
                    onChange={(e) => setFormData({...formData, claimValue: Number(e.target.value)})}
                    className={`w-full text-xs p-2 rounded-lg border focus:outline-none ${
                      darkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center gap-1 text-xs text-slate-400 mb-1">
                    <span>إجمالي الأتعاب المقررة بعقد الموكل *</span>
                    <FormTooltip content="إجمالي القيمة التعاقدية المتفق عليها مع الموكل لمباشرة هذه القضية بالكامل." />
                  </label>
                  <input 
                    type="number" 
                    required
                    placeholder="10000"
                    value={formData.totalFees}
                    onChange={(e) => setFormData({...formData, totalFees: Number(e.target.value)})}
                    className={`w-full text-xs p-2 rounded-lg border focus:outline-none ${
                      darkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                    }`}
                  />
                </div>
                <div className="sm:col-span-3">
                  <div className="flex items-center justify-between mb-1">
                    <label className="flex items-center gap-1 text-xs text-slate-400">
                      <span>موضوع الدعوى / الوصف بالتفصيل *</span>
                      <FormTooltip content="ملخص أو وصف دقيق لموضوع القضية، طلبات الموكل، والأسس القانونية التي تستند إليها الدعوى." />
                    </label>
                    <button
                      type="button"
                      onClick={() => handleGenerateAiDescription(formData.notes || "لا توجد ملاحظات")}
                      disabled={isGeneratingAi}
                      className="text-[10px] flex items-center gap-1 bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 px-2 py-1 rounded transition-colors disabled:opacity-50"
                    >
                      <Sparkles className="w-3 h-3" />
                      {isGeneratingAi ? "جاري الاقتراح..." : "صياغة ذكية بالذكاء الاصطناعي"}
                    </button>
                  </div>
                  <input 
                    type="text" 
                    required
                    placeholder="دعوى إخلال بالتزام تعاقدي ومطالبة بالتعويض..."
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className={`w-full text-xs p-2 rounded-lg border focus:outline-none ${
                      darkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="flex items-center gap-1 text-xs text-slate-400 mb-1">
                  <span>ملاحظات ودفوع قانونية ختامية</span>
                  <FormTooltip content="دفوع قانونية هامة، ملاحظات للمرافعة، تواريخ الإعلان بالحق والقلم، أي تفاصيل إجرائية هامة." />
                </label>
                <textarea 
                  placeholder="ملاحظات المرافعة، تواريخ الإعلان بالقلم، أي تفاصيل إجرائية سرية..."
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  rows={3}
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
                  حفظ القضية
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Case Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className={`w-full max-w-2xl rounded-2xl border shadow-xl overflow-hidden text-right my-8 ${
            darkMode ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-900"
          }`}>
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-950/20">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <Edit className="w-4 h-4 text-amber-500" />
                تعديل ملف القضية: {editingCase?.caseNumber}
              </h3>
              <button onClick={() => setIsEditModalOpen(false)} className="p-1 rounded hover:bg-slate-800 text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <form onSubmit={handleSaveEdit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
              {/* Identical Form layout to Add Case for integrity */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="flex items-center gap-1 text-xs text-slate-400 mb-1">
                    <span>رقم القضية *</span>
                    <FormTooltip content="رقم القضية المسجل في قلم كتاب المحكمة بالكامل، متبوعاً بسنة القيد (مثال: 4152 لسنة 2023)." />
                  </label>
                  <input 
                    type="text" 
                    required
                    value={formData.caseNumber}
                    onChange={(e) => setFormData({...formData, caseNumber: e.target.value})}
                    className={`w-full text-xs p-2 rounded-lg border focus:outline-none ${
                      darkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                    }`}
                  />
                </div>
                <div>
                  <label className="flex items-center gap-1 text-xs text-slate-400 mb-1">
                    <span>سنة القضية *</span>
                    <FormTooltip content="السنة الميلادية التي تم فيها تسجيل أو قيد القضية رسمياً في جدول المحكمة." />
                  </label>
                  <input 
                    type="text" 
                    required
                    value={formData.year}
                    onChange={(e) => setFormData({...formData, year: e.target.value})}
                    className={`w-full text-xs p-2 rounded-lg border focus:outline-none ${
                      darkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                    }`}
                  />
                </div>
                <div>
                  <label className="flex items-center gap-1 text-xs text-slate-400 mb-1">
                    <span>الموكل المرتبط *</span>
                    <FormTooltip content="اختر الموكل صاحب القضية من قائمة عملاء المكتب المسجلين." />
                  </label>
                  <select 
                    value={formData.clientId}
                    onChange={(e) => setFormData({...formData, clientId: e.target.value})}
                    className={`w-full text-xs p-2 rounded-lg border focus:outline-none ${
                      darkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                    }`}
                  >
                    {clients.map(cl => (
                      <option key={cl.id} value={cl.id}>{cl.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="flex items-center gap-1 text-xs text-slate-400 mb-1">
                    <span>نوع القضية *</span>
                    <FormTooltip content="التصنيف القانوني العام لنوع الدعوى (مدني، جنائي، أسرة، تجاري، إلخ)." />
                  </label>
                  <select 
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value as CaseType})}
                    className={`w-full text-xs p-2 rounded-lg border focus:outline-none ${
                      darkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                    }`}
                  >
                    {caseTypes.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="flex items-center gap-1 text-xs text-slate-400 mb-1">
                    <span>درجة التقاضي *</span>
                    <FormTooltip content="المرحلة القضائية الحالية للدعوى (ابتدائي، استئناف، نقض، إلخ)." />
                  </label>
                  <select 
                    value={formData.degree}
                    onChange={(e) => setFormData({...formData, degree: e.target.value as LitigationDegree})}
                    className={`w-full text-xs p-2 rounded-lg border focus:outline-none ${
                      darkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                    }`}
                  >
                    {litigationDegrees.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="flex items-center gap-1 text-xs text-slate-400 mb-1">
                    <span>حالة القضية *</span>
                    <FormTooltip content="الحالة الإجرائية والعملية الحالية للملف (متداولة، محجوزة للحكم، مشطوبة، مغلقة، إلخ)." />
                  </label>
                  <select 
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value as CaseStatus})}
                    className={`w-full text-xs p-2 rounded-lg border focus:outline-none ${
                      darkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                    }`}
                  >
                    {caseStatuses.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="flex items-center gap-1 text-xs text-slate-400 mb-1">
                    <span>المحكمة المختصة *</span>
                    <FormTooltip content="المحكمة التي تنظر الدعوى حالياً (مثال: محكمة شمال القاهرة الابتدائية)." />
                  </label>
                  <input 
                    type="text" 
                    required
                    value={formData.court}
                    onChange={(e) => setFormData({...formData, court: e.target.value})}
                    className={`w-full text-xs p-2 rounded-lg border focus:outline-none ${
                      darkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                    }`}
                  />
                </div>
                <div>
                  <label className="flex items-center gap-1 text-xs text-slate-400 mb-1">
                    <span>الدائرة *</span>
                    <FormTooltip content="الدائرة المحددة لنظر الدعوى وجلساتها بالمحكمة (مثال: الدائرة 12 مدني العباسية)." />
                  </label>
                  <input 
                    type="text" 
                    required
                    value={formData.circle}
                    onChange={(e) => setFormData({...formData, circle: e.target.value})}
                    className={`w-full text-xs p-2 rounded-lg border focus:outline-none ${
                      darkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                    }`}
                  />
                </div>
                <div>
                  <label className="flex items-center gap-1 text-xs text-slate-400 mb-1">
                    <span>المحافظة *</span>
                    <FormTooltip content="المحافظة الجغرافية التابع لها المحكمة المختصة قانوناً." />
                  </label>
                  <select 
                    value={formData.governorate}
                    onChange={(e) => setFormData({...formData, governorate: e.target.value})}
                    className={`w-full text-xs p-2 rounded-lg border focus:outline-none ${
                      darkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                    }`}
                  >
                    {egyptianGovernorates.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="flex items-center gap-1 text-xs text-slate-400 mb-1">
                    <span>المركز أو القسم</span>
                    <FormTooltip content="المركز أو قسم الشرطة التابع له النطاق الجغرافي للدعوى ومقر النزاع." />
                  </label>
                  <input 
                    type="text" 
                    value={formData.district}
                    onChange={(e) => setFormData({...formData, district: e.target.value})}
                    className={`w-full text-xs p-2 rounded-lg border focus:outline-none ${
                      darkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                    }`}
                  />
                </div>
                <div>
                  <label className="flex items-center gap-1 text-xs text-slate-400 mb-1">
                    <span>الخصوم *</span>
                    <FormTooltip content="أسماء الأطراف الأخرى أو الخصوم في الدعوى والمدعى عليهم بالكامل وصفاتهم." />
                  </label>
                  <input 
                    type="text" 
                    required
                    value={formData.opponents}
                    onChange={(e) => setFormData({...formData, opponents: e.target.value})}
                    className={`w-full text-xs p-2 rounded-lg border focus:outline-none ${
                      darkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                    }`}
                  />
                </div>
                <div>
                  <label className="flex items-center gap-1 text-xs text-slate-400 mb-1">
                    <span>محامي الخصم</span>
                    <FormTooltip content="اسم الزميل محامي الطرف الآخر أو الخصم لتسهيل التواصل والترتيبات الإجرائية الودية." />
                  </label>
                  <input 
                    type="text" 
                    value={formData.opponentLawyer}
                    onChange={(e) => setFormData({...formData, opponentLawyer: e.target.value})}
                    className={`w-full text-xs p-2 rounded-lg border focus:outline-none ${
                      darkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="flex items-center gap-1 text-xs text-slate-400 mb-1">
                    <span>المحامي المسؤول *</span>
                    <FormTooltip content="المحامي الشريك أو المساعد من مكتبنا المكلف بمتابعة وحضور جلسات هذه القضية." />
                  </label>
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
                  <label className="flex items-center gap-1 text-xs text-slate-400 mb-1">
                    <span>تاريخ قيد الدعوى *</span>
                    <FormTooltip content="التاريخ الرسمي لتقديم صحيفة الدعوى رسمياً ودفعه الرسوم بمقلم كتاب المحكمة." />
                  </label>
                  <input 
                    type="date" 
                    required
                    value={formData.registrationDate}
                    onChange={(e) => setFormData({...formData, registrationDate: e.target.value})}
                    className={`w-full text-xs p-2 rounded-lg border focus:outline-none ${
                      darkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                    }`}
                  />
                </div>
                <div>
                  <label className="flex items-center gap-1 text-xs text-slate-400 mb-1">
                    <span>قيمة المطالبة</span>
                    <FormTooltip content="القيمة المالية المتنازع عليها أو التعويضات المادية المطلوبة بصحيفة الدعوى بالجنيه." />
                  </label>
                  <input 
                    type="number" 
                    value={formData.claimValue}
                    onChange={(e) => setFormData({...formData, claimValue: Number(e.target.value)})}
                    className={`w-full text-xs p-2 rounded-lg border focus:outline-none ${
                      darkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center gap-1 text-xs text-slate-400 mb-1">
                    <span>إجمالي الأتعاب المقررة *</span>
                    <FormTooltip content="إجمالي القيمة التعاقدية المتفق عليها مع الموكل لمباشرة هذه القضية بالكامل." />
                  </label>
                  <input 
                    type="number" 
                    required
                    value={formData.totalFees}
                    onChange={(e) => setFormData({...formData, totalFees: Number(e.target.value)})}
                    className={`w-full text-xs p-2 rounded-lg border focus:outline-none ${
                      darkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                    }`}
                  />
                </div>
                <div className="sm:col-span-3">
                  <div className="flex items-center justify-between mb-1">
                    <label className="flex items-center gap-1 text-xs text-slate-400">
                      <span>موضوع الدعوى *</span>
                      <FormTooltip content="ملخص أو وصف دقيق لموضوع القضية، طلبات الموكل، والأسس القانونية التي تستند إليها الدعوى." />
                    </label>
                    <button
                      type="button"
                      onClick={() => handleGenerateAiDescription(formData.notes || "لا توجد ملاحظات")}
                      disabled={isGeneratingAi}
                      className="text-[10px] flex items-center gap-1 bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 px-2 py-1 rounded transition-colors disabled:opacity-50"
                    >
                      <Sparkles className="w-3 h-3" />
                      {isGeneratingAi ? "جاري الاقتراح..." : "صياغة ذكية بالذكاء الاصطناعي"}
                    </button>
                  </div>
                  <input 
                    type="text" 
                    required
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className={`w-full text-xs p-2 rounded-lg border focus:outline-none ${
                      darkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="flex items-center gap-1 text-xs text-slate-400 mb-1">
                  <span>ملاحظات ودفوع قانونية</span>
                  <FormTooltip content="دفوع قانونية هامة، ملاحظات للمرافعة، تواريخ الإعلان بالحق والقلم، أي تفاصيل إجرائية هامة." />
                </label>
                <textarea 
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  rows={3}
                  className={`w-full text-xs p-2 rounded-lg border focus:outline-none ${
                    darkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                  }`}
                />
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-200 dark:border-slate-800 pt-4">
                <button 
                  type="button" 
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold cursor-pointer"
                >
                  إلغاء
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold cursor-pointer"
                >
                  تعديل وحفظ الملف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
