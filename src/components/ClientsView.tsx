/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  Users, 
  Plus, 
  Search, 
  Phone, 
  Mail, 
  MapPin, 
  FileText, 
  Calendar as CalendarIcon, 
  DollarSign, 
  Trash2, 
  Edit, 
  X,
  MessageSquare,
  AlertCircle,
  PlusCircle,
  Clock,
  ShieldAlert
} from "lucide-react";
import { 
  User, 
  Client, 
  Case, 
  Session, 
  Payment, 
  CommunicationLog, 
  UserRole 
} from "../types";
import FormTooltip from "./FormTooltip";

interface ClientsViewProps {
  currentUser: User;
  clients: Client[];
  cases: Case[];
  sessions: Session[];
  payments: Payment[];
  onAddClient: (clientData: Omit<Client, "id" | "createdAt" | "communicationLogs">) => void;
  onEditClient: (client: Client) => void;
  onDeleteClient: (clientId: string) => void;
  onAddCommunicationLog: (clientId: string, log: Omit<CommunicationLog, "id">) => void;
  darkMode: boolean;
}

export default function ClientsView({
  currentUser,
  clients,
  cases,
  sessions,
  payments,
  onAddClient,
  onEditClient,
  onDeleteClient,
  onAddCommunicationLog,
  darkMode
}: ClientsViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  // Form States for Add/Edit Client
  const [formData, setFormData] = useState({
    name: "",
    nationalId: "",
    phone: "",
    whatsapp: "",
    email: "",
    address: "",
    type: "فرد" as "فرد" | "شركة",
    notes: ""
  });

  const [editingClient, setEditingClient] = useState<Client | null>(null);

  // Communication Log Form State
  const [isLogFormOpen, setIsLogFormOpen] = useState(false);
  const [logForm, setLogForm] = useState({
    type: "اتصال" as "اتصال" | "واتساب" | "مقابلة" | "بريد",
    summary: "",
    notes: ""
  });

  // Check Permissions
  const canAdd = currentUser.permissions.add;
  const canEdit = currentUser.permissions.edit;
  const canDelete = currentUser.permissions.delete;

  const activeClients = clients.filter(c => !c.isDeleted);

  // Search Logic
  const filteredClients = activeClients.filter(c => {
    const term = searchQuery.toLowerCase();
    const nameMatch = (c.name || "").toLowerCase().includes(term);
    const phoneMatch = (c.phone || "").includes(term) || (c.whatsapp && c.whatsapp.includes(term));
    const nidMatch = c.nationalId?.includes(term) || false;
    
    // Search by case numbers of this client
    const clientCases = cases.filter(cs => cs.clientId === c.id);
    const caseMatch = clientCases.some(cs => (cs.caseNumber || "").toLowerCase().includes(term));

    return nameMatch || phoneMatch || nidMatch || caseMatch;
  });

  const selectedClient = clients.find(c => c.id === selectedClientId && !c.isDeleted);

  // Client Details Calculations
  const clientCases = selectedClient ? cases.filter(c => c.clientId === selectedClient.id && !c.isDeleted) : [];
  const clientCaseIds = clientCases.map(c => c.id);
  const clientSessions = selectedClient ? sessions.filter(s => clientCaseIds.includes(s.caseId)) : [];
  const clientPayments = selectedClient ? payments.filter(p => p.clientId === selectedClient.id) : [];

  const totalFees = clientCases.reduce((sum, c) => sum + c.totalFees, 0);
  const totalPaid = clientPayments.reduce((sum, p) => sum + p.amount, 0);
  const remainingFees = totalFees - totalPaid;

  const handleOpenAddModal = () => {
    if (!canAdd) return;
    setFormData({
      name: "",
      nationalId: "",
      phone: "",
      whatsapp: "",
      email: "",
      address: "",
      type: "فرد",
      notes: ""
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (client: Client) => {
    if (!canEdit) return;
    setEditingClient(client);
    setFormData({
      name: client.name,
      nationalId: client.nationalId || "",
      phone: client.phone,
      whatsapp: client.whatsapp || "",
      email: client.email || "",
      address: client.address || "",
      type: client.type,
      notes: client.notes || ""
    });
    setIsEditModalOpen(true);
  };

  const handleSaveAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) {
      alert("الرجاء ملء حقول الاسم والهاتف الأساسية.");
      return;
    }
    onAddClient(formData);
    setIsAddModalOpen(false);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClient) return;
    onEditClient({
      ...editingClient,
      ...formData
    });
    setIsEditModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (!canDelete) return;
    if (confirm("هل أنت متأكد من رغبتك في حذف هذا العميل؟ سيتم نقل العميل لسلة المهملات القانونية (Soft Delete).")) {
      onDeleteClient(id);
      if (selectedClientId === id) setSelectedClientId(null);
    }
  };

  const handleAddLogSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientId || !logForm.summary) return;
    onAddCommunicationLog(selectedClientId, {
      ...logForm,
      date: new Date().toISOString().split("T")[0],
      recorder: currentUser.name
    });
    setLogForm({
      type: "اتصال",
      summary: "",
      notes: ""
    });
    setIsLogFormOpen(false);
  };

  return (
    <div className="space-y-6 text-right" dir="rtl">
      {/* Page Title & Stats */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className={`text-xl font-bold font-sans ${darkMode ? "text-white" : "text-slate-900"}`}>إدارة علاقات العملاء (CRM)</h2>
          <p className="text-xs text-slate-500 mt-1">تتبع الموكلين، الشركات والأفراد، وسجلات التواصل والمستحقات الخاصة بكل موكل.</p>
        </div>
        
        {/* Permission Alert & Quick Stats */}
        <div className="flex items-center gap-3">
          <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-300 px-3 py-1.5 rounded-lg font-semibold">
            إجمالي الموكلين: {activeClients.length} عميل
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
            عميل جديد
          </button>
        </div>
      </div>

      {!canAdd && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-xs flex items-center gap-2 text-amber-500">
          <ShieldAlert className="w-4 h-4 flex-shrink-0" />
          <span>أنت مسجل حالياً بدور <strong>({currentUser.role})</strong>. بعض الصلاحيات الإدارية مثل الإضافة والحذف قد تكون مقيدة بناءً على سياسة الصلاحيات المطبقة.</span>
        </div>
      )}

      {/* Main CRM Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Right side: Client Directory */}
        <div className="lg:col-span-1 space-y-4">
          <div className={`p-4 rounded-2xl border ${darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
            {/* Search Input */}
            <div className="relative">
              <input
                type="text"
                placeholder="ابحث بالاسم، الهاتف، الرقم القومي، القضية..."
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

            {/* Client Cards List */}
            <div className="mt-4 space-y-2 overflow-y-auto max-h-[550px] pr-1">
              {filteredClients.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-500">
                  لا يوجد عملاء يطابقون محددات البحث الخاصة بك.
                </div>
              ) : (
                filteredClients.map((client) => {
                  const isSelected = selectedClientId === client.id;
                  const clientCasesCount = cases.filter(c => c.clientId === client.id && !c.isDeleted).length;
                  return (
                    <div
                      key={client.id}
                      onClick={() => setSelectedClientId(client.id)}
                      className={`p-3 rounded-xl border text-right transition-all cursor-pointer ${
                        isSelected
                          ? "bg-amber-500/10 border-amber-500"
                          : darkMode
                            ? "bg-slate-950 border-slate-800/80 hover:bg-slate-800/40"
                            : "bg-slate-50 border-slate-100 hover:bg-slate-100/50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <h4 className={`text-xs font-bold truncate max-w-[140px] ${darkMode ? "text-white" : "text-slate-900"}`}>{client.name}</h4>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                          client.type === "شركة" 
                            ? "bg-blue-500/10 text-blue-600 dark:text-blue-400" 
                            : "bg-purple-500/10 text-purple-600 dark:text-purple-400"
                        }`}>
                          {client.type}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 font-mono mt-1 flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-500" />
                        {client.phone}
                      </p>
                      <div className="mt-2 flex items-center justify-between text-[9px] text-slate-400">
                        <span>💼 {clientCasesCount} قضايا</span>
                        <span className="font-mono">قيد: {client.createdAt.split("T")[0]}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Left side: Client Full CRM Workspace */}
        <div className="lg:col-span-2">
          {selectedClient ? (
            <div className={`p-6 rounded-2xl border ${darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"} space-y-6`}>
              
              {/* Header profile of selected client */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center text-xl font-bold font-sans">
                    {selectedClient.name[0]}
                  </div>
                  <div className="text-right">
                    <h3 className={`text-base font-bold ${darkMode ? "text-white" : "text-slate-900"}`}>{selectedClient.name}</h3>
                    <p className="text-xs text-slate-400 mt-1">
                      {selectedClient.nationalId ? `الرقم القومي / السجل: ${selectedClient.nationalId}` : "لم يتم تسجيل رقم قومي"}
                    </p>
                  </div>
                </div>

                {/* Edit & Delete Action Row */}
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => handleOpenEditModal(selectedClient)}
                    disabled={!canEdit}
                    className={`p-2 rounded-lg border flex items-center justify-center transition-colors ${
                      canEdit 
                        ? "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-amber-400 hover:text-slate-950 hover:border-amber-400 cursor-pointer text-slate-600 dark:text-slate-300" 
                        : "bg-slate-200 dark:bg-slate-800 border-slate-100 cursor-not-allowed text-slate-400"
                    }`}
                    title="تعديل بيانات الموكل"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleDelete(selectedClient.id)}
                    disabled={!canDelete}
                    className={`p-2 rounded-lg border flex items-center justify-center transition-colors ${
                      canDelete 
                        ? "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-rose-500 hover:text-white hover:border-rose-500 cursor-pointer text-rose-500" 
                        : "bg-slate-200 dark:bg-slate-800 border-slate-100 cursor-not-allowed text-slate-400"
                    }`}
                    title="حذف الموكل"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Direct Info list (Grid) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800/80 text-right">
                  <span className="text-[10px] text-slate-400 block mb-1">البريد الإلكتروني</span>
                  <span className={`text-xs font-mono break-all ${darkMode ? "text-slate-200" : "text-slate-800"}`}>
                    {selectedClient.email || "غير متوفر"}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800/80 text-right">
                  <span className="text-[10px] text-slate-400 block mb-1">واتساب مباشر</span>
                  <span className="text-xs font-mono block text-emerald-500">
                    {selectedClient.whatsapp ? (
                      <a href={`https://wa.me/${selectedClient.whatsapp}`} target="_blank" rel="noreferrer" className="hover:underline">
                        📱 {selectedClient.whatsapp}
                      </a>
                    ) : "غير متوفر"}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800/80 text-right">
                  <span className="text-[10px] text-slate-400 block mb-1">العنوان الجغرافي</span>
                  <span className={`text-xs block ${darkMode ? "text-slate-200" : "text-slate-800"}`}>
                    {selectedClient.address || "غير متوفر"}
                  </span>
                </div>
              </div>

              {/* Client note widget */}
              {selectedClient.notes && (
                <div className="p-3.5 bg-amber-500/5 border border-amber-500/10 rounded-xl text-right">
                  <h4 className="text-xs font-bold text-amber-500 mb-1">📝 ملاحظات إدارية هامة</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">{selectedClient.notes}</p>
                </div>
              )}

              {/* CRM Sub-Sections Tab Container */}
              <div className="space-y-6 pt-2">
                
                {/* 1. Connected Cases */}
                <div>
                  <h4 className="text-xs font-bold text-slate-400 mb-2.5">💼 القضايا المسجلة لهذا العميل ({clientCases.length})</h4>
                  {clientCases.length === 0 ? (
                    <p className="text-xs text-slate-500 py-3 bg-slate-50 dark:bg-slate-800/20 text-center rounded-xl">لا توجد قضايا حالية مسجلة للعميل.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {clientCases.map(cas => (
                        <div key={cas.id} className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/20 text-right">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-bold text-amber-500">{cas.caseNumber}</span>
                            <span className="text-[10px] bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded">
                              {cas.type}
                            </span>
                          </div>
                          <p className={`text-xs font-semibold truncate ${darkMode ? "text-slate-300" : "text-slate-800"}`} title={cas.description}>
                            {cas.description}
                          </p>
                          <p className="text-[10px] text-slate-400 mt-1">🏠 {cas.court} | {cas.circle}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 2. Outstanding financial balance */}
                <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="text-right">
                    <h4 className="text-xs font-bold text-slate-400">💰 كشف حساب الموكل المالي</h4>
                    <p className="text-[10px] text-slate-500 mt-0.5">القضايا الإجمالية والتعاملات الحسابية المقيدة بالمكتب.</p>
                  </div>
                  <div className="flex items-center gap-4 text-center">
                    <div className="px-3 border-l border-slate-800">
                      <span className="text-[9px] text-slate-500 block">إجمالي الاتفاق</span>
                      <span className="text-sm font-bold text-amber-500 font-mono">{totalFees.toLocaleString()} ج.م</span>
                    </div>
                    <div className="px-3 border-l border-slate-800">
                      <span className="text-[9px] text-slate-500 block">المسدد فعلياً</span>
                      <span className="text-sm font-bold text-emerald-500 font-mono">{totalPaid.toLocaleString()} ج.م</span>
                    </div>
                    <div className="px-3">
                      <span className="text-[9px] text-slate-500 block">المتبقي المطلوب</span>
                      <span className={`text-sm font-bold font-mono ${remainingFees > 0 ? "text-rose-500" : "text-emerald-500"}`}>
                        {remainingFees.toLocaleString()} ج.م
                      </span>
                    </div>
                  </div>
                </div>

                {/* 3. Client Interaction / Communication logs (سجل التواصل) */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-bold text-slate-400">📞 سجل التواصل والتحديثات القانونية ({selectedClient.communicationLogs?.length || 0})</h4>
                    <button 
                      onClick={() => setIsLogFormOpen(!isLogFormOpen)}
                      className="text-xs text-amber-500 hover:text-amber-600 flex items-center gap-1 cursor-pointer font-bold"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      إضافة سجل تواصل
                    </button>
                  </div>

                  {/* Add Log Form */}
                  {isLogFormOpen && (
                    <form onSubmit={handleAddLogSubmit} className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 mb-4 text-right space-y-3">
                      <h5 className="text-xs font-bold text-amber-500">تقييد نشاط تواصل جديد مع الموكل</h5>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[10px] text-slate-400 mb-1">نوع التواصل</label>
                          <select 
                            value={logForm.type}
                            onChange={(e) => setLogForm({...logForm, type: e.target.value as any})}
                            className={`w-full text-xs p-1.5 rounded border focus:outline-none ${
                              darkMode ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-200"
                            }`}
                          >
                            <option value="اتصال">اتصال هاتفي</option>
                            <option value="واتساب">مراسلة WhatsApp</option>
                            <option value="مقابلة">مقابلة بالمكتب</option>
                            <option value="بريد">بريد إلكتروني رسمي</option>
                          </select>
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-[10px] text-slate-400 mb-1">ملخص مكثف للنشاط</label>
                          <input 
                            type="text" 
                            required
                            placeholder="مثال: مناقشة تقديم أصل عقد الإيجار..."
                            value={logForm.summary}
                            onChange={(e) => setLogForm({...logForm, summary: e.target.value})}
                            className={`w-full text-xs p-1.5 rounded border focus:outline-none ${
                              darkMode ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-200"
                            }`}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-400 mb-1">تفاصيل وملاحظات قانونية إضافية</label>
                        <textarea 
                          placeholder="اكتب التوصيات أو ما تم التوافق عليه مع الموكل..."
                          value={logForm.notes}
                          onChange={(e) => setLogForm({...logForm, notes: e.target.value})}
                          rows={2}
                          className={`w-full text-xs p-1.5 rounded border focus:outline-none ${
                            darkMode ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-200"
                          }`}
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <button 
                          type="button" 
                          onClick={() => setIsLogFormOpen(false)}
                          className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-white text-xs cursor-pointer"
                        >
                          إلغاء
                        </button>
                        <button 
                          type="submit" 
                          className="px-3 py-1 rounded bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold cursor-pointer"
                        >
                          حفظ النشاط
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Logs list */}
                  {!selectedClient.communicationLogs || selectedClient.communicationLogs.length === 0 ? (
                    <p className="text-xs text-slate-500 py-2 text-center bg-slate-50 dark:bg-slate-800/10 rounded-xl">لا يوجد سجل تواصل مسجل لهذا العميل حتى الآن.</p>
                  ) : (
                    <div className="space-y-3">
                      {selectedClient.communicationLogs.map((log) => (
                        <div key={log.id} className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-950/10 text-right">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              log.type === "مقابلة" 
                                ? "bg-purple-500/10 text-purple-500" 
                                : log.type === "واتساب" 
                                  ? "bg-emerald-500/10 text-emerald-500" 
                                  : "bg-blue-500/10 text-blue-500"
                            }`}>
                              {log.type}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">{log.date}</span>
                          </div>
                          <p className={`text-xs font-bold ${darkMode ? "text-slate-200" : "text-slate-800"}`}>{log.summary}</p>
                          {log.notes && (
                            <p className="text-xs text-slate-500 mt-1 leading-relaxed bg-slate-100/50 dark:bg-slate-900/40 p-2 rounded">{log.notes}</p>
                          )}
                          <p className="text-[9px] text-amber-500/80 mt-1.5">✍️ مسجل بواسطة: {log.recorder}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            </div>
          ) : (
            <div className={`p-12 rounded-2xl border ${darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"} text-center flex flex-col items-center justify-center h-full min-h-[400px]`}>
              <Users className="w-16 h-16 text-slate-700/80 mb-4 stroke-[1.2]" />
              <h3 className={`text-base font-bold ${darkMode ? "text-slate-300" : "text-slate-700"}`}>قم باختيار موكل للبدء</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm">
                اختر مفرداً من مجلد العملاء على اليمين، أو ابحث في الملفات القانونية لعرض تفاصيل القضايا وجداول الجلسات ومستحقات الأتعاب وسجل الأنشطة.
              </p>
            </div>
          )}
        </div>

      </div>

      {/* Add Client Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`w-full max-w-lg rounded-2xl border shadow-xl overflow-hidden text-right ${
            darkMode ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-900"
          }`}>
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-950/20">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-500" />
                إضافة عميل / موكل جديد للمكتب
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="p-1 rounded hover:bg-slate-800 text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <form onSubmit={handleSaveAdd} className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center gap-1 text-xs text-slate-400 mb-1">
                    <span>نوع العميل *</span>
                    <FormTooltip content="حدد ما إذا كان الموكل فرداً طبيعياً أم شركة/مؤسسة ذات شخصية اعتبارية." />
                  </label>
                  <select 
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value as any})}
                    className={`w-full text-xs p-2 rounded-lg border focus:outline-none ${
                      darkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                    }`}
                  >
                    <option value="فرد">فرد / شخص طبيعي</option>
                    <option value="شركة">شركة / شخص اعتباري</option>
                  </select>
                </div>
                <div>
                  <label className="flex items-center gap-1 text-xs text-slate-400 mb-1">
                    <span>الاسم الكامل *</span>
                    <FormTooltip content="اكتب الاسم الثلاثي أو الرباعي للموكل كما هو مدون في الأوراق الرسمية والتوكيلات المعقودة." />
                  </label>
                  <input 
                    type="text" 
                    required
                    placeholder="مثال: أحمد عبد الهادي منصور"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className={`w-full text-xs p-2 rounded-lg border focus:outline-none ${
                      darkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center gap-1 text-xs text-slate-400 mb-1">
                    <span>الرقم القومي / السجل التجاري</span>
                    <FormTooltip content="الرقم القومي المكون من 14 رقماً للأفراد، أو رقم السجل التجاري والملف الضريبي للشركات والمؤسسات." />
                  </label>
                  <input 
                    type="text" 
                    placeholder="مثال: 29205120102543"
                    value={formData.nationalId}
                    onChange={(e) => setFormData({...formData, nationalId: e.target.value})}
                    className={`w-full text-xs p-2 rounded-lg border focus:outline-none ${
                      darkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                    }`}
                  />
                </div>
                <div>
                  <label className="flex items-center gap-1 text-xs text-slate-400 mb-1">
                    <span>رقم الهاتف الأساسي *</span>
                    <FormTooltip content="رقم الهاتف الفعال للموكل للتواصل السريع وإرسال الإشعارات وتحديثات الجلسات." />
                  </label>
                  <input 
                    type="text" 
                    required
                    placeholder="مثال: 01001234567"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className={`w-full text-xs p-2 rounded-lg border focus:outline-none ${
                      darkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center gap-1 text-xs text-slate-400 mb-1">
                    <span>رقم واتساب (WhatsApp)</span>
                    <FormTooltip content="رقم واتساب الفعال للموكل لإرسال مذكرات الدفاع، المستندات، وجداول الجلسات والتقارير تلقائياً." />
                  </label>
                  <input 
                    type="text" 
                    placeholder="مثال: 01111998877"
                    value={formData.whatsapp}
                    onChange={(e) => setFormData({...formData, whatsapp: e.target.value})}
                    className={`w-full text-xs p-2 rounded-lg border focus:outline-none ${
                      darkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                    }`}
                  />
                </div>
                <div>
                  <label className="flex items-center gap-1 text-xs text-slate-400 mb-1">
                    <span>البريد الإلكتروني</span>
                    <FormTooltip content="البريد الإلكتروني لإرسال التقارير الدورية، كشوف الحسابات المالية، وصور ضوئية من الأحكام القضائية." />
                  </label>
                  <input 
                    type="email" 
                    placeholder="example@mail.com"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className={`w-full text-xs p-2 rounded-lg border focus:outline-none ${
                      darkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="flex items-center gap-1 text-xs text-slate-400 mb-1">
                  <span>العنوان بالتفصيل</span>
                  <FormTooltip content="العنوان السكني الحالي أو المقر الرئيسي للشركة لإدراجه بدقة في صحف الدعاوى والإعلانات الرسمية." />
                </label>
                <input 
                  type="text" 
                  placeholder="مثال: شقة ١٢، عمارة ٥، شارع طنطا، العجوزة، الجيزة"
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  className={`w-full text-xs p-2 rounded-lg border focus:outline-none ${
                    darkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                    }`}
                />
              </div>

              <div>
                <label className="flex items-center gap-1 text-xs text-slate-400 mb-1">
                  <span>ملاحظات المكتب السرية أو العامة</span>
                  <FormTooltip content="أي معلومات إضافية هامة مثل رقم ومكتب التوكيل، صلة القرابة، تواريخ المقابلات، أو تاريخ التعاملات السابقة." />
                </label>
                <textarea 
                  placeholder="اكتب أي ملاحظات إدارية هامة بخصوص العميل أو تعاملاته السابقة..."
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
                  حفظ العميل
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Client Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`w-full max-w-lg rounded-2xl border shadow-xl overflow-hidden text-right ${
            darkMode ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-900"
          }`}>
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-950/20">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <Edit className="w-4 h-4 text-amber-500" />
                تعديل بيانات الموكل: {editingClient?.name}
              </h3>
              <button onClick={() => setIsEditModalOpen(false)} className="p-1 rounded hover:bg-slate-800 text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <form onSubmit={handleSaveEdit} className="p-5 space-y-4">
              {/* Form fields identical to Add Client for simplicity and integrity */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center gap-1 text-xs text-slate-400 mb-1">
                    <span>نوع العميل *</span>
                    <FormTooltip content="حدد ما إذا كان الموكل فرداً طبيعياً أم شركة/مؤسسة ذات شخصية اعتبارية." />
                  </label>
                  <select 
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value as any})}
                    className={`w-full text-xs p-2 rounded-lg border focus:outline-none ${
                      darkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                    }`}
                  >
                    <option value="فرد">فرد / شخص طبيعي</option>
                    <option value="شركة">شركة / شخص اعتباري</option>
                  </select>
                </div>
                <div>
                  <label className="flex items-center gap-1 text-xs text-slate-400 mb-1">
                    <span>الاسم الكامل *</span>
                    <FormTooltip content="اكتب الاسم الثلاثي أو الرباعي للموكل كما هو مدون في الأوراق الرسمية والتوكيلات المعقودة." />
                  </label>
                  <input 
                    type="text" 
                    required
                    placeholder="مثال: أحمد عبد الهادي منصور"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className={`w-full text-xs p-2 rounded-lg border focus:outline-none ${
                      darkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center gap-1 text-xs text-slate-400 mb-1">
                    <span>الرقم القومي / السجل التجاري</span>
                    <FormTooltip content="الرقم القومي المكون من 14 رقماً للأفراد، أو رقم السجل التجاري والملف الضريبي للشركات والمؤسسات." />
                  </label>
                  <input 
                    type="text" 
                    placeholder="مثال: 29205120102543"
                    value={formData.nationalId}
                    onChange={(e) => setFormData({...formData, nationalId: e.target.value})}
                    className={`w-full text-xs p-2 rounded-lg border focus:outline-none ${
                      darkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                    }`}
                  />
                </div>
                <div>
                  <label className="flex items-center gap-1 text-xs text-slate-400 mb-1">
                    <span>رقم الهاتف الأساسي *</span>
                    <FormTooltip content="رقم الهاتف الفعال للموكل للتواصل السريع وإرسال الإشعارات وتحديثات الجلسات." />
                  </label>
                  <input 
                    type="text" 
                    required
                    placeholder="مثال: 01001234567"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className={`w-full text-xs p-2 rounded-lg border focus:outline-none ${
                      darkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center gap-1 text-xs text-slate-400 mb-1">
                    <span>رقم واتساب (WhatsApp)</span>
                    <FormTooltip content="رقم واتساب الفعال للموكل لإرسال مذكرات الدفاع، المستندات، وجداول الجلسات والتقارير تلقائياً." />
                  </label>
                  <input 
                    type="text" 
                    placeholder="مثال: 01111998877"
                    value={formData.whatsapp}
                    onChange={(e) => setFormData({...formData, whatsapp: e.target.value})}
                    className={`w-full text-xs p-2 rounded-lg border focus:outline-none ${
                      darkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                    }`}
                  />
                </div>
                <div>
                  <label className="flex items-center gap-1 text-xs text-slate-400 mb-1">
                    <span>البريد الإلكتروني</span>
                    <FormTooltip content="البريد الإلكتروني لإرسال التقارير الدورية، كشوف الحسابات المالية، وصور ضوئية من الأحكام القضائية." />
                  </label>
                  <input 
                    type="email" 
                    placeholder="example@mail.com"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className={`w-full text-xs p-2 rounded-lg border focus:outline-none ${
                      darkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="flex items-center gap-1 text-xs text-slate-400 mb-1">
                  <span>العنوان بالتفصيل</span>
                  <FormTooltip content="العنوان السكني الحالي أو المقر الرئيسي للشركة لإدراجه بدقة في صحف الدعاوى والإعلانات الرسمية." />
                </label>
                <input 
                  type="text" 
                  placeholder="مثال: شقة ١٢، عمارة ٥، شارع طنطا، العجوزة، الجيزة"
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  className={`w-full text-xs p-2 rounded-lg border focus:outline-none ${
                    darkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                  }`}
                />
              </div>

              <div>
                <label className="flex items-center gap-1 text-xs text-slate-400 mb-1">
                  <span>ملاحظات المكتب السرية أو العامة</span>
                  <FormTooltip content="أي معلومات إضافية هامة مثل رقم ومكتب التوكيل، صلة القرابة، تواريخ المقابلات، أو تاريخ التعاملات السابقة." />
                </label>
                <textarea 
                  placeholder="اكتب أي ملاحظات إدارية هامة بخصوص العميل أو تعاملاته السابقة..."
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
                  تعديل وحفظ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
