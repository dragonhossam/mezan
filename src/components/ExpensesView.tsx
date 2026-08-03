/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  CreditCard, 
  Plus, 
  Search, 
  Trash2, 
  X, 
  TrendingDown, 
  Scale, 
  Truck, 
  Printer, 
  HelpCircle,
  ShieldAlert
} from "lucide-react";
import { 
  User as UserType, 
  Case, 
  Expense, 
  ExpenseCategory 
} from "../types";

interface ExpensesViewProps {
  currentUser: UserType;
  expenses: Expense[];
  cases: Case[];
  usersList: UserType[];
  onAddExpense: (expenseData: Omit<Expense, "id">) => void;
  onDeleteExpense: (expenseId: string) => void;
  darkMode: boolean;
}

export default function ExpensesView({
  currentUser,
  expenses,
  cases,
  usersList,
  onAddExpense,
  onDeleteExpense,
  darkMode
}: ExpensesViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("الكل");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    caseId: "",
    amount: 500,
    category: "رسوم دعوى" as ExpenseCategory,
    date: new Date().toISOString().split("T")[0],
    description: "",
    paidBy: currentUser.name
  });

  // Check Permissions
  const canAdd = currentUser.permissions.add;
  const canDelete = currentUser.permissions.delete;

  const handleSaveAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.amount <= 0 || !formData.description) {
      alert("الرجاء تحديد مبلغ المصروف وكتابة الوصف التفصيلي.");
      return;
    }
    onAddExpense({
      ...formData,
      caseId: formData.caseId || undefined
    });
    setIsAddModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (!canDelete) return;
    if (confirm("هل أنت متأكد من حذف قيد هذا المصروف نهائياً من الدفاتر المالية للمكتب؟")) {
      onDeleteExpense(id);
    }
  };

  // Filter Expenses
  const filteredExpenses = expenses.filter(exp => {
    const term = searchQuery.toLowerCase();
    const caseItem = exp.caseId ? cases.find(c => c.id === exp.caseId) : null;
    
    const matchesSearch = 
      (exp.description || "").toLowerCase().includes(term) ||
      (caseItem?.caseNumber || "").toLowerCase().includes(term) ||
      (exp.paidBy || "").toLowerCase().includes(term);

    const matchesCategory = categoryFilter === "الكل" || exp.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  // Summary Metrics calculations
  const totalAmount = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  const courtFees = filteredExpenses.filter(e => e.category === "رسوم دعوى").reduce((sum, e) => sum + e.amount, 0);
  const transitFees = filteredExpenses.filter(e => e.category === "انتقالات ومواصلات").reduce((sum, e) => sum + e.amount, 0);
  const expertsFees = filteredExpenses.filter(e => e.category === "مكتب خبراء").reduce((sum, e) => sum + e.amount, 0);

  const expenseCategories: ExpenseCategory[] = [
    "رسوم دعوى", "مكتب خبراء", "قلم المحضرين", "انتقالات ومواصلات", "طباعة وتصوير", "ضيافة", "أخرى"
  ];

  return (
    <div className="space-y-6 text-right" dir="rtl">
      
      {/* Title bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className={`text-xl font-bold font-sans ${darkMode ? "text-white" : "text-slate-900"}`}>مصروفات القضايا والتشغيل اليومي</h2>
          <p className="text-xs text-slate-500 mt-1">تسجيل وتوثيق رسوم رفع الدعاوى، أمانات الخبراء، تكاليف قلم المحضرين، والانتقالات بأسماء القائمين عليها.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setFormData({
                caseId: cases[0]?.id || "",
                amount: 350,
                category: "رسوم دعوى",
                date: new Date().toISOString().split("T")[0],
                description: "",
                paidBy: currentUser.name
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
            تقييد بند مصروف
          </button>
        </div>
      </div>

      {!canAdd && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-xs flex items-center gap-2 text-amber-500">
          <ShieldAlert className="w-4 h-4 flex-shrink-0" />
          <span>دورك الحالي <strong>({currentUser.role})</strong> لا يتضمن صلاحية تسوية العهد المالية للمحامين أو شطب المصاريف.</span>
        </div>
      )}

      {/* KPI Cards section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Total */}
        <div className={`p-4 rounded-2xl border ${darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"} flex items-center justify-between`}>
          <div>
            <span className="text-[10px] text-slate-500 block">إجمالي المصروفات المفهرسة</span>
            <span className="text-lg font-bold font-mono text-rose-500 mt-1 block">-{totalAmount.toLocaleString()} ج.م</span>
          </div>
          <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-500">
            <TrendingDown className="w-5 h-5" />
          </div>
        </div>

        {/* Card 2: Court Fees */}
        <div className={`p-4 rounded-2xl border ${darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"} flex items-center justify-between`}>
          <div>
            <span className="text-[10px] text-slate-500 block">رسوم رفع الدعاوى القضائية</span>
            <span className="text-lg font-bold font-mono text-amber-500 mt-1 block">{courtFees.toLocaleString()} ج.م</span>
          </div>
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500">
            <Scale className="w-5 h-5" />
          </div>
        </div>

        {/* Card 3: Transit */}
        <div className={`p-4 rounded-2xl border ${darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"} flex items-center justify-between`}>
          <div>
            <span className="text-[10px] text-slate-500 block">انتقالات ومواصلات المحامين</span>
            <span className="text-lg font-bold font-mono text-blue-500 mt-1 block">{transitFees.toLocaleString()} ج.م</span>
          </div>
          <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-500">
            <Truck className="w-5 h-5" />
          </div>
        </div>

        {/* Card 4: Experts */}
        <div className={`p-4 rounded-2xl border ${darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"} flex items-center justify-between`}>
          <div>
            <span className="text-[10px] text-slate-500 block">أمانات الخبراء ولجان التحقيق</span>
            <span className="text-lg font-bold font-mono text-purple-500 mt-1 block">{expertsFees.toLocaleString()} ج.م</span>
          </div>
          <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-500">
            <Printer className="w-5 h-5" />
          </div>
        </div>

      </div>

      {/* Main List layout */}
      <div className={`p-5 rounded-2xl border ${darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
        
        {/* Filters control row */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4 mb-4">
          <h3 className={`text-xs font-bold ${darkMode ? "text-white" : "text-slate-900"}`}>
            🗒️ الدفتر اليومي لمصروفات القضايا والتشغيل
          </h3>

          <div className="flex flex-col sm:flex-row gap-2 max-w-lg w-full">
            {/* Search */}
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="ابحث بوصف المصروف أو المحامي..."
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

            {/* Category Filter */}
            <div className="w-full sm:w-48">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className={`w-full text-xs p-2 rounded-xl border focus:outline-none ${
                  darkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                }`}
              >
                <option value="الكل">جميع التصنيفات المالية</option>
                {expenseCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Expenses Log Table/List */}
        {filteredExpenses.length === 0 ? (
          <div className="text-center py-16 text-xs text-slate-500">
            لا توجد مصروفات أو سندات صرف مقيدة حالياً مطابقة للتصفية.
          </div>
        ) : (
          <div className="space-y-3">
            {filteredExpenses.map(exp => {
              const caseItem = exp.caseId ? cases.find(c => c.id === exp.caseId) : null;

              return (
                <div 
                  key={exp.id}
                  className={`p-4 rounded-xl border ${
                    darkMode ? "bg-slate-950/60 border-slate-900" : "bg-slate-50 border-slate-100"
                  } flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-right`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-rose-500 font-mono">-{exp.amount.toLocaleString()} ج.م</span>
                      <span className="text-[10px] bg-slate-900 text-slate-400 font-mono px-2 py-0.2 rounded">
                        {exp.category}
                      </span>
                    </div>
                    <p className={`text-xs font-bold ${darkMode ? "text-slate-200" : "text-slate-800"}`}>
                      {exp.description}
                    </p>
                    {caseItem && (
                      <p className="text-[10px] text-amber-500">
                        📁 مرتبط بالقضية رقم: {caseItem.caseNumber} (المحكمة: {caseItem.court})
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-3 justify-between sm:justify-end border-t sm:border-t-0 border-slate-800/20 pt-2 sm:pt-0">
                    <div className="text-right sm:text-left text-[9px] text-slate-500">
                      <p className="font-mono">التاريخ: {exp.date}</p>
                      <p>المصرفي: {exp.paidBy}</p>
                    </div>

                    <button
                      onClick={() => handleDelete(exp.id)}
                      disabled={!canDelete}
                      className={`p-1.5 rounded border flex items-center justify-center transition-colors ${
                        canDelete 
                          ? "bg-slate-900 hover:bg-rose-500 text-rose-500 hover:text-white border-slate-800 hover:border-rose-500 cursor-pointer" 
                          : "bg-slate-200 dark:bg-slate-800 text-slate-400 border-slate-100 cursor-not-allowed"
                      }`}
                      title="شطب قيد الصرف"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* Add Expense Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`w-full max-w-lg rounded-2xl border shadow-xl overflow-hidden text-right ${
            darkMode ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-900"
          }`}>
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-950/20">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-amber-500" />
                تقييد وقيد بند مصروفات قضائية وتشغيلية
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="p-1 rounded hover:bg-slate-800 text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <form onSubmit={handleSaveAdd} className="p-5 space-y-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">القضية المرتبطة (اختياري)</label>
                <select 
                  value={formData.caseId}
                  onChange={(e) => setFormData({...formData, caseId: e.target.value})}
                  className={`w-full text-xs p-2 rounded-lg border focus:outline-none ${
                    darkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                  }`}
                >
                  <option value="">لا يوجد ارتباط بقضية معينة (مصروفات تشغيلية للمكتب)</option>
                  {cases.filter(c => !c.isDeleted).map(c => (
                    <option key={c.id} value={c.id}>قضية {c.caseNumber} - المحكمة {c.court}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">القيمة المالية (ج.م) *</label>
                  <input 
                    type="number" 
                    required
                    placeholder="500"
                    value={formData.amount}
                    onChange={(e) => setFormData({...formData, amount: Number(e.target.value)})}
                    className={`w-full text-xs p-2 rounded-lg border focus:outline-none ${
                      darkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">التصنيف المالي للبند *</label>
                  <select 
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value as ExpenseCategory})}
                    className={`w-full text-xs p-2 rounded-lg border focus:outline-none ${
                      darkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                    }`}
                  >
                    {expenseCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">تاريخ الصرف والوفاء *</label>
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
                <label className="block text-xs text-slate-400 mb-1">وصف الصرف والبيان التفصيلي للغرض *</label>
                <input 
                  type="text" 
                  required
                  placeholder="مثال: رسوم تسجيل أوراق الإشهار بالشهر العقاري بالجيزة"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className={`w-full text-xs p-2 rounded-lg border focus:outline-none ${
                    darkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">المحامي / الموظف القائم بالصرف *</label>
                <select 
                  value={formData.paidBy}
                  onChange={(e) => setFormData({...formData, paidBy: e.target.value})}
                  className={`w-full text-xs p-2 rounded-lg border focus:outline-none ${
                    darkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                  }`}
                >
                  {usersList.map(u => <option key={u.id} value={u.name}>{u.name} ({u.role})</option>)}
                </select>
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
                  حفظ وتسوية القيد
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
