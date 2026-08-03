/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  CheckSquare, 
  Plus, 
  Clock, 
  User, 
  AlertTriangle, 
  Search, 
  Trash2, 
  Edit, 
  X,
  FileText,
  CheckCircle,
  Briefcase,
  Play,
  Check,
  ShieldAlert
} from "lucide-react";
import { 
  User as UserType, 
  Client, 
  Case, 
  Task, 
  TaskPriority, 
  TaskStatus 
} from "../types";

interface TasksViewProps {
  currentUser: UserType;
  tasks: Task[];
  cases: Case[];
  clients: Client[];
  usersList: UserType[];
  onAddTask: (taskData: Omit<Task, "id">) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  darkMode: boolean;
}

export default function TasksView({
  currentUser,
  tasks,
  cases,
  clients,
  usersList,
  onAddTask,
  onEditTask,
  onDeleteTask,
  darkMode
}: TasksViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [lawyerFilter, setLawyerFilter] = useState<string>("الكل");
  const [priorityFilter, setPriorityFilter] = useState<string>("الكل");
  const [statusFilter, setStatusFilter] = useState<string>("الكل");

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    title: "",
    caseId: "",
    clientId: "",
    assignedLawyerId: "",
    priority: "متوسطة" as TaskPriority,
    startDate: new Date().toISOString().split("T")[0],
    dueDate: new Date().toISOString().split("T")[0],
    status: "لم تبدأ" as TaskStatus,
    description: ""
  });

  // Check Permissions
  const canAdd = currentUser.permissions.add;
  const canEdit = currentUser.permissions.edit;
  const canDelete = currentUser.permissions.delete;

  // Filter Tasks list
  const filteredTasks = tasks.filter(t => {
    const term = searchQuery.toLowerCase();
    const matchesSearch = 
      (t.title || "").toLowerCase().includes(term) ||
      (t.description || "").toLowerCase().includes(term);

    const matchesLawyer = lawyerFilter === "الكل" || t.assignedLawyerId === lawyerFilter;
    const matchesPriority = priorityFilter === "الكل" || t.priority === priorityFilter;
    const matchesStatus = statusFilter === "الكل" || t.status === statusFilter;

    return matchesSearch && matchesLawyer && matchesPriority && matchesStatus;
  });

  const handleOpenAddModal = () => {
    if (!canAdd) return;
    setFormData({
      title: "",
      caseId: cases[0]?.id || "",
      clientId: clients[0]?.id || "",
      assignedLawyerId: currentUser.id,
      priority: "متوسطة",
      startDate: new Date().toISOString().split("T")[0],
      dueDate: new Date().toISOString().split("T")[0],
      status: "لم تبدأ",
      description: ""
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (task: Task) => {
    if (!canEdit) return;
    setEditingTask(task);
    setFormData({
      title: task.title,
      caseId: task.caseId || "",
      clientId: task.clientId || "",
      assignedLawyerId: task.assignedLawyerId,
      priority: task.priority,
      startDate: task.startDate,
      dueDate: task.dueDate,
      status: task.status,
      description: task.description
    });
    setIsEditModalOpen(true);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.assignedLawyerId) {
      alert("الرجاء تحديد عنوان المهمة والموظف المسؤول عنها.");
      return;
    }
    onAddTask({
      ...formData,
      caseId: formData.caseId || undefined,
      clientId: formData.clientId || undefined
    });
    setIsAddModalOpen(false);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask) return;
    onEditTask({
      ...editingTask,
      ...formData,
      caseId: formData.caseId || undefined,
      clientId: formData.clientId || undefined
    });
    setIsEditModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (!canDelete) return;
    if (confirm("هل أنت متأكد من حذف هذه المهمة نهائياً؟")) {
      onDeleteTask(id);
    }
  };

  // Quick state toggles
  const handleQuickStatusUpdate = (task: Task, newStatus: TaskStatus) => {
    if (!canEdit) return;
    onEditTask({
      ...task,
      status: newStatus
    });
  };

  const priorities: TaskPriority[] = ["منخفضة", "متوسطة", "عالية", "عاجلة"];
  const statuses: TaskStatus[] = ["لم تبدأ", "قيد التنفيذ", "مكتملة", "متأخرة"];

  return (
    <div className="space-y-6 text-right" dir="rtl">
      
      {/* Title bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className={`text-xl font-bold font-sans ${darkMode ? "text-white" : "text-slate-900"}`}>منصة إسناد وإدارة المهام القانونية</h2>
          <p className="text-xs text-slate-500 mt-1">تنسيق وتتبع الأنشطة المكلف بها المحامون ومواعيد استحقاق المذكرات وتوريد المستندات بالمكتب.</p>
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
            إسناد مهمة جديدة
          </button>
        </div>
      </div>

      {!canAdd && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-xs flex items-center gap-2 text-amber-500">
          <ShieldAlert className="w-4 h-4 flex-shrink-0" />
          <span>دورك الحالي <strong>({currentUser.role})</strong> لا يحمل صلاحيات إسناد مهام جديدة للزملاء أو إعادة الهيكلة الوظيفية.</span>
        </div>
      )}

      {/* Filters bar */}
      <div className={`p-4 rounded-2xl border ${darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"} grid grid-cols-1 md:grid-cols-4 gap-3`}>
        {/* Search */}
        <div className="relative">
          <input
            type="text"
            placeholder="ابحث بكلمات في المهمة..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full pr-10 pl-4 py-1.5 rounded-xl text-xs border focus:outline-none transition-colors ${
              darkMode 
                ? "bg-slate-950 border-slate-800 text-white focus:border-amber-400" 
                : "bg-slate-50 border-slate-200 text-slate-800 focus:border-amber-500"
            }`}
          />
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-2.5" />
        </div>

        {/* Lawyer Filter */}
        <div>
          <select
            value={lawyerFilter}
            onChange={(e) => setLawyerFilter(e.target.value)}
            className={`w-full text-xs p-2 rounded-xl border focus:outline-none ${
              darkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
            }`}
          >
            <option value="الكل">جميع الموظفين والمحامين</option>
            {usersList.map(u => <option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}
          </select>
        </div>

        {/* Priority filter */}
        <div>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className={`w-full text-xs p-2 rounded-xl border focus:outline-none ${
              darkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
            }`}
          >
            <option value="الكل">كل مستويات الأهمية</option>
            {priorities.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>

        {/* Status filter */}
        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={`w-full text-xs p-2 rounded-xl border focus:outline-none ${
              darkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
            }`}
          >
            <option value="الكل">كل حالات الإنجاز</option>
            {statuses.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* Tasks Kanban-like list or structured Table */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statuses.map(status => {
          const statusTasks = filteredTasks.filter(t => t.status === status);
          return (
            <div key={status} className={`p-4 rounded-2xl border ${darkMode ? "bg-slate-950 border-slate-900/60" : "bg-slate-50 border-slate-100"}`}>
              
              {/* Header section of column */}
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800/20">
                <h3 className={`text-xs font-bold ${
                  status === "مكتملة" 
                    ? "text-emerald-500" 
                    : status === "قيد التنفيذ" 
                      ? "text-blue-500" 
                      : status === "متأخرة" 
                        ? "text-rose-500" 
                        : "text-slate-400"
                }`}>
                  ● {status} ({statusTasks.length})
                </h3>
              </div>

              {/* Tasks within this status */}
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {statusTasks.length === 0 ? (
                  <div className="text-center py-8 text-[11px] text-slate-500 border border-dashed border-slate-800/20 rounded-xl">
                    لا يوجد مهام.
                  </div>
                ) : (
                  statusTasks.map(task => {
                    const assignedLawyer = usersList.find(u => u.id === task.assignedLawyerId);
                    const connectedCase = cases.find(c => c.id === task.caseId);
                    
                    return (
                      <div 
                        key={task.id} 
                        className={`p-3.5 rounded-xl border ${
                          darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
                        } space-y-2 text-right relative group hover:border-amber-400 transition-colors`}
                      >
                        <div className="flex items-center justify-between">
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                            task.priority === "عاجلة" 
                              ? "bg-red-500 text-white animate-pulse" 
                              : task.priority === "عالية" 
                                ? "bg-amber-500/15 text-amber-500" 
                                : "bg-slate-800 text-slate-400"
                          }`}>
                            {task.priority}
                          </span>
                          
                          {/* Quick Edit/Delete on Hover */}
                          <div className="flex items-center gap-1">
                            <button 
                              onClick={() => handleOpenEditModal(task)}
                              disabled={!canEdit}
                              className="p-1 rounded text-slate-400 hover:text-white"
                              title="تعديل"
                            >
                              <Edit className="w-3 h-3" />
                            </button>
                            <button 
                              onClick={() => handleDelete(task.id)}
                              disabled={!canDelete}
                              className="p-1 rounded text-rose-500 hover:text-rose-400"
                              title="حذف"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>

                        <h4 className={`text-xs font-bold leading-snug ${darkMode ? "text-white" : "text-slate-800"}`}>
                          {task.title}
                        </h4>

                        {task.description && (
                          <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed bg-slate-950/20 p-1.5 rounded">
                            {task.description}
                          </p>
                        )}

                        {connectedCase && (
                          <div className="text-[10px] text-slate-400 flex items-center gap-1">
                            <Briefcase className="w-3 h-3 text-amber-500 flex-shrink-0" />
                            <span className="truncate">رقم: {connectedCase.caseNumber}</span>
                          </div>
                        )}

                        <div className="pt-2 border-t border-slate-800/40 flex items-center justify-between text-[10px]">
                          <span className="text-slate-500 font-mono">⌛ {task.dueDate}</span>
                          <span className="text-amber-500 truncate max-w-[80px]" title={assignedLawyer?.name}>
                            👤 {assignedLawyer?.name?.split(" ")[1] || assignedLawyer?.name || "عام"}
                          </span>
                        </div>

                        {/* Quick state switcher actions inside task card */}
                        <div className="pt-1.5 flex items-center justify-end gap-1 border-t border-slate-800/20">
                          {task.status !== "مكتملة" ? (
                            <button 
                              onClick={() => handleQuickStatusUpdate(task, "مكتملة")}
                              disabled={!canEdit}
                              className="text-[9px] bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-slate-950 font-bold px-2 py-0.5 rounded flex items-center gap-1 cursor-pointer transition-colors"
                            >
                              <Check className="w-3 h-3" />
                              اكتملت
                            </button>
                          ) : null}
                          {task.status === "لم تبدأ" ? (
                            <button 
                              onClick={() => handleQuickStatusUpdate(task, "قيد التنفيذ")}
                              disabled={!canEdit}
                              className="text-[9px] bg-blue-500/10 text-blue-500 hover:bg-blue-500 hover:text-white font-bold px-2 py-0.5 rounded flex items-center gap-1 cursor-pointer transition-colors"
                            >
                              <Play className="w-3 h-3" />
                              بدء
                            </button>
                          ) : null}
                        </div>

                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Task Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`w-full max-w-lg rounded-2xl border shadow-xl overflow-hidden text-right ${
            darkMode ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-900"
          }`}>
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-950/20">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-amber-500" />
                تكليف بمهمة قانونية جديدة
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="p-1 rounded hover:bg-slate-800 text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <form onSubmit={handleAddSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">اسم / عنوان المهمة المختصر *</label>
                <input 
                  type="text" 
                  required
                  placeholder="مثال: سحب الصورة الرسمية للحكم الجنائي"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className={`w-full text-xs p-2 rounded-lg border focus:outline-none ${
                    darkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                  }`}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">القضية المرتبطة (اختياري)</label>
                  <select 
                    value={formData.caseId}
                    onChange={(e) => setFormData({...formData, caseId: e.target.value})}
                    className={`w-full text-xs p-2 rounded-lg border focus:outline-none ${
                      darkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                    }`}
                  >
                    <option value="">لا توجد قضية مرتبطة (مهمة عامة للمكتب)</option>
                    {cases.map(c => (
                      <option key={c.id} value={c.id}>{c.caseNumber} - {clients.find(cl => cl.id === c.clientId)?.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">الموكل المرتبط (تلقائي أو اختياري)</label>
                  <select 
                    value={formData.clientId}
                    onChange={(e) => setFormData({...formData, clientId: e.target.value})}
                    className={`w-full text-xs p-2 rounded-lg border focus:outline-none ${
                      darkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                    }`}
                  >
                    <option value="">لا يوجد عميل مرتبط</option>
                    {clients.map(cl => (
                      <option key={cl.id} value={cl.id}>{cl.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">المحامي المسؤول *</label>
                  <select 
                    value={formData.assignedLawyerId}
                    onChange={(e) => setFormData({...formData, assignedLawyerId: e.target.value})}
                    className={`w-full text-xs p-2 rounded-lg border focus:outline-none ${
                      darkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                    }`}
                  >
                    {usersList.map(u => <option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">الأولوية / درجة السرعة *</label>
                  <select 
                    value={formData.priority}
                    onChange={(e) => setFormData({...formData, priority: e.target.value as TaskPriority})}
                    className={`w-full text-xs p-2 rounded-lg border focus:outline-none ${
                      darkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                    }`}
                  >
                    {priorities.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">حالة البداية *</label>
                  <select 
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value as TaskStatus})}
                    className={`w-full text-xs p-2 rounded-lg border focus:outline-none ${
                      darkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                    }`}
                  >
                    {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">تاريخ البدء *</label>
                  <input 
                    type="date" 
                    required
                    value={formData.startDate}
                    onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                    className={`w-full text-xs p-2 rounded-lg border focus:outline-none ${
                      darkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">تاريخ الاستحقاق والوفاء *</label>
                  <input 
                    type="date" 
                    required
                    value={formData.dueDate}
                    onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
                    className={`w-full text-xs p-2 rounded-lg border focus:outline-none ${
                      darkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">الوصف التفصيلي والتعليمات المرفقة بالعمل</label>
                <textarea 
                  placeholder="اكتب التوصيات والمستندات المطلوبة، تفاصيل الذهاب لقلم المحضرين أو مكتب الخبراء..."
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
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
                  تكليف بالمهمة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Task Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`w-full max-w-lg rounded-2xl border shadow-xl overflow-hidden text-right ${
            darkMode ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-900"
          }`}>
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-950/20">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <Edit className="w-4 h-4 text-amber-500" />
                تعديل بيانات تكليف المهمة
              </h3>
              <button onClick={() => setIsEditModalOpen(false)} className="p-1 rounded hover:bg-slate-800 text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <form onSubmit={handleEditSubmit} className="p-5 space-y-4">
              {/* Identical Form layout to Add Task */}
              <div>
                <label className="block text-xs text-slate-400 mb-1">اسم المهمة *</label>
                <input 
                  type="text" 
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className={`w-full text-xs p-2 rounded-lg border focus:outline-none ${
                    darkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                  }`}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">القضية المرتبطة</label>
                  <select 
                    value={formData.caseId}
                    onChange={(e) => setFormData({...formData, caseId: e.target.value})}
                    className={`w-full text-xs p-2 rounded-lg border focus:outline-none ${
                      darkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                    }`}
                  >
                    <option value="">لا توجد قضية مرتبطة (مهمة عامة)</option>
                    {cases.map(c => (
                      <option key={c.id} value={c.id}>{c.caseNumber}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">الموكل</label>
                  <select 
                    value={formData.clientId}
                    onChange={(e) => setFormData({...formData, clientId: e.target.value})}
                    className={`w-full text-xs p-2 rounded-lg border focus:outline-none ${
                      darkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                    }`}
                  >
                    <option value="">لا يوجد عميل</option>
                    {clients.map(cl => (
                      <option key={cl.id} value={cl.id}>{cl.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">المحامي المسؤول *</label>
                  <select 
                    value={formData.assignedLawyerId}
                    onChange={(e) => setFormData({...formData, assignedLawyerId: e.target.value})}
                    className={`w-full text-xs p-2 rounded-lg border focus:outline-none ${
                      darkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                    }`}
                  >
                    {usersList.map(u => <option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">الأولوية *</label>
                  <select 
                    value={formData.priority}
                    onChange={(e) => setFormData({...formData, priority: e.target.value as TaskPriority})}
                    className={`w-full text-xs p-2 rounded-lg border focus:outline-none ${
                      darkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                    }`}
                  >
                    {priorities.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">حالة المهمة *</label>
                  <select 
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value as TaskStatus})}
                    className={`w-full text-xs p-2 rounded-lg border focus:outline-none ${
                      darkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                    }`}
                  >
                    {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">تاريخ البدء *</label>
                  <input 
                    type="date" 
                    required
                    value={formData.startDate}
                    onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                    className={`w-full text-xs p-2 rounded-lg border focus:outline-none ${
                      darkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">تاريخ الاستحقاق *</label>
                  <input 
                    type="date" 
                    required
                    value={formData.dueDate}
                    onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
                    className={`w-full text-xs p-2 rounded-lg border focus:outline-none ${
                      darkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">الوصف التفصيلي والتعليمات</label>
                <textarea 
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
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
                  تعديل المهمة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
