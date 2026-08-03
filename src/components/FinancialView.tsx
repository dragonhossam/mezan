/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  DollarSign, 
  Plus, 
  Printer, 
  Search, 
  Trash2, 
  Edit, 
  X, 
  CreditCard, 
  CheckCircle, 
  AlertTriangle,
  FileText,
  BadgePercent,
  CheckCircle2,
  ShieldAlert
} from "lucide-react";
import { 
  User as UserType, 
  Case, 
  Client, 
  Payment, 
  PaymentMethod 
} from "../types";

interface FinancialViewProps {
  currentUser: UserType;
  payments: Payment[];
  cases: Case[];
  clients: Client[];
  usersList: UserType[];
  onAddPayment: (paymentData: Omit<Payment, "id" | "recipientId" | "receiptNumber">) => void;
  onDeletePayment: (paymentId: string) => void;
  darkMode: boolean;
}

export default function FinancialView({
  currentUser,
  payments,
  cases,
  clients,
  usersList,
  onAddPayment,
  onDeletePayment,
  darkMode
}: FinancialViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedPaymentForReceipt, setSelectedPaymentForReceipt] = useState<Payment | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    caseId: "",
    clientId: "",
    amount: 5000,
    date: new Date().toISOString().split("T")[0],
    method: "نقدي" as PaymentMethod,
    notes: ""
  });

  // Check Permissions (Accountant or Owner typically manages financials)
  const canAdd = currentUser.permissions.add;
  const canDelete = currentUser.permissions.delete;

  const handleCaseChange = (caseId: string) => {
    const caseItem = cases.find(c => c.id === caseId);
    if (caseItem) {
      setFormData({
        ...formData,
        caseId,
        clientId: caseItem.clientId
      });
    } else {
      setFormData({ ...formData, caseId });
    }
  };

  const handleSaveAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.caseId || !formData.clientId || formData.amount <= 0) {
      alert("الرجاء تحديد القضية والموكل وكتابة دفعة مالية صحيحة.");
      return;
    }
    onAddPayment(formData);
    setIsAddModalOpen(false);
  };

  // Search filter (searches payment receipt number, client names, or case numbers)
  const filteredPayments = payments.filter(pay => {
    const term = searchQuery.toLowerCase();
    const caseItem = cases.find(c => c.id === pay.caseId);
    const clientItem = clients.find(cl => cl.id === pay.clientId);

    const matchesSearch = 
      (pay.receiptNumber || "").toLowerCase().includes(term) ||
      (clientItem?.name || "").toLowerCase().includes(term) ||
      (caseItem?.caseNumber || "").toLowerCase().includes(term) ||
      (pay.notes || "").toLowerCase().includes(term);

    return matchesSearch;
  });

  // Arrears / Unpaid cases calculations
  const casesWithDues = cases.filter(c => !c.isDeleted).map(c => {
    const paidForCase = payments.filter(p => p.caseId === c.id).reduce((sum, p) => sum + p.amount, 0);
    const remaining = c.totalFees - paidForCase;
    const clientItem = clients.find(cl => cl.id === c.clientId);
    return {
      caseId: c.id,
      caseNumber: c.caseNumber,
      clientName: clientItem?.name || "عميل عام",
      totalFees: c.totalFees,
      paid: paidForCase,
      remaining: Math.max(0, remaining)
    };
  }).filter(c => c.remaining > 0);

  const paymentMethodsList: PaymentMethod[] = ["نقدي", "تحويل بنكي", "محفظة إلكترونية", "أخرى"];

  return (
    <div className="space-y-6 text-right" dir="rtl">
      
      {/* Title bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className={`text-xl font-bold font-sans ${darkMode ? "text-white" : "text-slate-900"}`}>الخزينة والأتعاب والمدفوعات المالية</h2>
          <p className="text-xs text-slate-500 mt-1">تتبع التدفقات النقدية للمكتب، وأرصدة القضايا المستحقة، وإصدار إيصالات دفع إلكترونية معتمدة للموكلين.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setFormData({
                caseId: cases[0]?.id || "",
                clientId: cases[0]?.clientId || clients[0]?.id || "",
                amount: 5000,
                date: new Date().toISOString().split("T")[0],
                method: "نقدي",
                notes: ""
              });
              setIsAddModalOpen(true);
            }}
            disabled={!canAdd}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              canAdd 
                ? "bg-amber-500 hover:bg-amber-600 text-slate-950 cursor-pointer shadow-md shadow-amber-500/10" 
                : "bg-slate-300 dark:bg-slate-800 text-slate-500 dark:text-slate-600 cursor-not-allowed"
            }`}
          >
            <Plus className="w-4 h-4" />
            تسجيل دفعة واردة
          </button>
        </div>
      </div>

      {currentUser.role !== "محاسب" && currentUser.role !== "صاحب المكتب" && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-xs flex items-center gap-2 text-amber-500">
          <ShieldAlert className="w-4 h-4 flex-shrink-0" />
          <span>أنت تتصفح الحسابات الآن بصفة <strong>({currentUser.role})</strong>. بعض تعديلات الدفاتر الحسابية مقصورة على محاسب المكتب وصاحب العمل لتأمين السيولة المالية.</span>
        </div>
      )}

      {/* Main Grid: Payments log table left, Arrears list right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Area: Payments directory with printing receipt option */}
        <div className="lg:col-span-2 space-y-4">
          <div className={`p-5 rounded-2xl border ${darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
            
            {/* Header and search */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4 mb-4">
              <h3 className={`text-xs font-bold ${darkMode ? "text-white" : "text-slate-900"}`}>
                💰 سجل المقبوضات ووصولات التحصيل المالي
              </h3>

              <div className="relative max-w-xs w-full">
                <input
                  type="text"
                  placeholder="ابحث برقم الإيصال، الموكل..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full pr-9 pl-4 py-1.5 rounded-xl text-xs border focus:outline-none transition-colors ${
                    darkMode 
                      ? "bg-slate-950 border-slate-800 text-white focus:border-amber-400" 
                      : "bg-slate-50 border-slate-200 text-slate-800 focus:border-amber-500"
                  }`}
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-2.5" />
              </div>
            </div>

            {/* Receipts Log List */}
            {filteredPayments.length === 0 ? (
              <div className="text-center py-16 text-xs text-slate-500">
                لا توجد مقبوضات مسجلة تطابق محددات البحث الخاصة بك.
              </div>
            ) : (
              <div className="space-y-3">
                {filteredPayments.map(pay => {
                  const clientItem = clients.find(cl => cl.id === pay.clientId);
                  const caseItem = cases.find(c => c.id === pay.caseId);
                  const accountantItem = usersList.find(u => u.id === pay.recipientId);

                  return (
                    <div 
                      key={pay.id}
                      className={`p-4 rounded-xl border ${
                        darkMode ? "bg-slate-950/60 border-slate-900" : "bg-slate-50 border-slate-100"
                      } flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-right`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-emerald-500 font-mono">+{pay.amount.toLocaleString()} ج.م</span>
                          <span className="text-[10px] bg-slate-900 text-slate-400 font-mono px-1.5 py-0.2 rounded">
                            {pay.receiptNumber}
                          </span>
                        </div>
                        <p className={`text-xs font-bold ${darkMode ? "text-slate-200" : "text-slate-800"}`}>
                          👤 الموكل: {clientItem?.name || "عميل عام"}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          💼 ملف قضية: {caseItem?.caseNumber || "استشارة عامة"} | طريقة الدفع: {pay.method}
                        </p>
                        {pay.notes && (
                          <p className="text-[10px] text-slate-500 leading-relaxed bg-slate-100/50 dark:bg-slate-900/30 p-1 rounded">
                            📝 {pay.notes}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-3 justify-between sm:justify-end border-t sm:border-t-0 border-slate-800/20 pt-2 sm:pt-0">
                        <div className="text-right sm:text-left text-[9px] text-slate-500">
                          <p className="font-mono">قيد: {pay.date}</p>
                          <p>المستلم: {accountantItem?.name || "الحسابات"}</p>
                        </div>

                        {/* Print Receipt Trigger */}
                        <button
                          onClick={() => setSelectedPaymentForReceipt(pay)}
                          className="p-2 rounded bg-slate-900 hover:bg-slate-800 text-amber-400 border border-slate-800 flex items-center justify-center cursor-pointer"
                          title="عرض وطباعة الإيصال الرسمي"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

          </div>
        </div>

        {/* Right Area: Underpaid cases / Arrears Tracker */}
        <div className="space-y-4">
          <div className={`p-5 rounded-2xl border ${darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"} text-right`}>
            <div className="flex items-center justify-between mb-4 border-b border-slate-200 dark:border-slate-800 pb-2">
              <h4 className={`text-xs font-bold ${darkMode ? "text-white" : "text-slate-800"}`}>
                ⚠️ مستحقات أتعاب متأخرة (ذمم معلقة)
              </h4>
              <span className="text-xs font-bold text-rose-500">({casesWithDues.length}) ملفات</span>
            </div>

            {casesWithDues.length === 0 ? (
              <div className="text-center py-12 text-xs text-slate-500">
                ممتاز! لا يوجد أي مبالغ أو أتعاب متأخرة على العملاء حالياً.
              </div>
            ) : (
              <div className="space-y-3">
                {casesWithDues.map(c => {
                  const percentPaid = Math.round((c.paid / (c.totalFees || 1)) * 100);
                  return (
                    <div key={c.caseId} className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/40 text-right space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-amber-500">{c.caseNumber}</span>
                        <span className="text-[10px] font-bold text-rose-500 font-mono">متبقي: {c.remaining.toLocaleString()} ج.م</span>
                      </div>
                      
                      <p className="text-[11px] text-slate-300 font-bold truncate">{c.clientName}</p>
                      
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[9px] text-slate-500">
                          <span>نسبة المسدد من التعاقد</span>
                          <span>{percentPaid}% ({c.paid.toLocaleString()} ج.م)</span>
                        </div>
                        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${percentPaid}%` }}></div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Add Payment Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`w-full max-w-lg rounded-2xl border shadow-xl overflow-hidden text-right ${
            darkMode ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-900"
          }`}>
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-950/20">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-amber-500" />
                تسجيل وتحصيل دفعة أتعاب واردة
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="p-1 rounded hover:bg-slate-800 text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <form onSubmit={handleSaveAdd} className="p-5 space-y-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">حدد القضية وملف التعاقد *</label>
                <select 
                  value={formData.caseId}
                  onChange={(e) => handleCaseChange(e.target.value)}
                  className={`w-full text-xs p-2 rounded-lg border focus:outline-none ${
                    darkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                  }`}
                >
                  <option value="">اختر القضية المعنية بالتحصيل...</option>
                  {cases.filter(c => !c.isDeleted).map(c => (
                    <option key={c.id} value={c.id}>قضية {c.caseNumber} - {clients.find(cl => cl.id === c.clientId)?.name} (متبقي: {c.totalFees} ج.م)</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">المبلغ المحصل (ج.م) *</label>
                  <input 
                    type="number" 
                    required
                    placeholder="5000"
                    value={formData.amount}
                    onChange={(e) => setFormData({...formData, amount: Number(e.target.value)})}
                    className={`w-full text-xs p-2 rounded-lg border focus:outline-none ${
                      darkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">طريقة السداد *</label>
                  <select 
                    value={formData.method}
                    onChange={(e) => setFormData({...formData, method: e.target.value as PaymentMethod})}
                    className={`w-full text-xs p-2 rounded-lg border focus:outline-none ${
                      darkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                    }`}
                  >
                    {paymentMethodsList.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">تاريخ الاستلام *</label>
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
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">ملاحظات التحصيل</label>
                <textarea 
                  placeholder="مثال: الدفعة الثانية من عقد أتعاب الاستئناف، أو شيك رقم... على البنك الأهلي"
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
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
                  تحصيل وإصدار إيصال
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Simulated Receipt Printing Modal */}
      {selectedPaymentForReceipt && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white text-slate-900 rounded-2xl shadow-2xl border border-slate-200 overflow-hidden text-right">
            
            {/* Stamp/Branding Receipt Header */}
            <div className="bg-slate-950 text-white p-5 text-center relative">
              <h3 className="font-bold text-base tracking-tight text-amber-400">مكتب الخدمات القانونية والاستشارات</h3>
              <p className="text-[10px] text-slate-400 mt-1">تلفون: 01009876543 | الإسكان والشركات والجنح</p>
              <div className="absolute top-4 left-4 border border-dashed border-amber-400/40 text-amber-400 text-[9px] px-1.5 py-0.5 rounded font-mono uppercase">
                Receipt
              </div>
            </div>

            {/* Receipt Body content */}
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="text-right">
                  <span className="text-[9px] text-slate-400 block">رقم الإيصال</span>
                  <span className="text-xs font-bold font-mono">{selectedPaymentForReceipt.receiptNumber}</span>
                </div>
                <div className="text-left">
                  <span className="text-[9px] text-slate-400 block">التاريخ</span>
                  <span className="text-xs font-mono font-bold">{selectedPaymentForReceipt.date}</span>
                </div>
              </div>

              {/* Amount Box */}
              <div className="p-3 bg-slate-50 rounded-xl text-center border border-slate-100">
                <span className="text-[10px] text-slate-500 block">القيمة المحصلة والمسددة</span>
                <span className="text-xl font-bold text-slate-950 font-mono">
                  {selectedPaymentForReceipt.amount.toLocaleString()} ج.م
                </span>
                <p className="text-[9px] text-slate-400 mt-0.5">فقط وقدره خمسة آلاف جنيه مصري لا غير.</p>
              </div>

              {/* Detail fields */}
              <div className="space-y-2.5 text-xs text-slate-700">
                <div className="flex justify-between">
                  <span className="text-slate-400">الموكل السيد / الشركة:</span>
                  <span className="font-bold text-slate-900">
                    {clients.find(cl => cl.id === selectedPaymentForReceipt.clientId)?.name || "عميل عام"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">عن ملف القضية رقم:</span>
                  <span className="font-bold text-slate-900">
                    {cases.find(c => c.id === selectedPaymentForReceipt.caseId)?.caseNumber || "استشارات المكتب"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">طريقة السداد:</span>
                  <span className="font-bold text-slate-900 font-mono">{selectedPaymentForReceipt.method}</span>
                </div>
                {selectedPaymentForReceipt.notes && (
                  <div className="pt-2 border-t border-slate-100">
                    <span className="text-slate-400 block mb-1">البيان والملاحظات:</span>
                    <p className="p-2 bg-slate-50 rounded text-[11px] text-slate-600 italic leading-relaxed">
                      {selectedPaymentForReceipt.notes}
                    </p>
                  </div>
                )}
              </div>

              {/* Stamps and signatures */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100/80 text-center">
                <div>
                  <span className="text-[9px] text-slate-400 block mb-3">توقيع المستلم (الحسابات)</span>
                  <span className="text-xs font-serif italic text-slate-800 font-bold block">محمود جلال الشربيني</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 block mb-2">خاتم المكتب الرسمي</span>
                  <div className="mx-auto w-10 h-10 rounded-full border border-double border-blue-500 text-blue-500 flex items-center justify-center text-[8px] font-bold leading-none transform rotate-12">
                    ميزان للمحاماة
                  </div>
                </div>
              </div>
            </div>

            {/* Print action buttons */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-between gap-3">
              <button 
                onClick={() => alert("جاري الاتصال بالطابعة اللاسلكية وتصدير نسخة الإيصال الرسمية...")}
                className="flex-1 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg text-xs flex items-center justify-center gap-1 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                طباعة الآن
              </button>
              <button 
                onClick={() => setSelectedPaymentForReceipt(null)}
                className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-lg text-xs cursor-pointer"
              >
                إغلاق
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
