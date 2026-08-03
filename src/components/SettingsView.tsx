/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  Settings, 
  Users, 
  Shield, 
  History, 
  Building, 
  Plus, 
  Edit2, 
  Trash2, 
  Save, 
  Check, 
  X,
  AlertTriangle,
  Mail,
  Lock,
  Compass,
  CheckSquare,
  ShieldAlert,
  EyeOff
} from "lucide-react";
import { 
  User as UserType, 
  OfficeConfig, 
  AuditLog, 
  UserRole 
} from "../types";

interface SettingsViewProps {
  currentUser: UserType;
  officeConfig: OfficeConfig;
  auditLogs: AuditLog[];
  usersList: UserType[];
  onUpdateOfficeConfig: (config: OfficeConfig) => void;
  onInviteUser: (userData: Omit<UserType, "id">) => void;
  onUpdateUserRole: (userId: string, newRole: UserRole) => void;
  darkMode: boolean;
  onLoadDemoData?: () => void;
  onWipeAllData?: () => void;
}

export default function SettingsView({
  currentUser,
  officeConfig,
  auditLogs,
  usersList,
  onUpdateOfficeConfig,
  onInviteUser,
  onUpdateUserRole,
  darkMode,
  onLoadDemoData,
  onWipeAllData
}: SettingsViewProps) {
  const [activeTab, setActiveTab] = useState<"office" | "users" | "audit">("office");

  const [excludeMyVisits, setExcludeMyVisits] = useState<boolean>(() => {
    return localStorage.getItem("meezan_exclude_my_visits") === "true";
  });

  // Office Config Form state
  const [officeForm, setOfficeForm] = useState<OfficeConfig>({ ...officeConfig });

  // Invite User state
  const [inviteForm, setInviteForm] = useState({
    name: "",
    role: "محامي" as UserRole,
    email: "",
    isActive: true
  });

  const [isInviteOpen, setIsInviteOpen] = useState(false);

  // Check Permissions
  const isOwner = currentUser.role === "صاحب المكتب";

  const handleSaveOffice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOwner) {
      alert("عذراً، تعديل الإعدادات الأساسية للمؤسسة مقصور على صاحب المكتب الرئيسي فقط.");
      return;
    }
    onUpdateOfficeConfig(officeForm);
    alert("تم حفظ بيانات تكوين مؤسسة المحاماة بنجاح.");
  };

  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOwner) {
      alert("صلاحيات دعوة الزملاء أو الموظفين الجدد خاصة بصاحب المكتب فقط.");
      return;
    }
    if (!inviteForm.name || !inviteForm.email) {
      alert("الرجاء إدخال الاسم والبريد الإلكتروني المهني.");
      return;
    }

    // Default permissions setup based on role selection
    const permissionsMap = {
      "صاحب المكتب": { add: true, edit: true, delete: true, viewFinancials: true },
      "محامي": { add: true, edit: true, delete: false, viewFinancials: false },
      "محام تدريب": { add: true, edit: false, delete: false, viewFinancials: false },
      "سكرتارية": { add: true, edit: true, delete: false, viewFinancials: false },
      "محاسب": { add: true, edit: true, delete: false, viewFinancials: true }
    };

    onInviteUser({
      name: inviteForm.name,
      role: inviteForm.role,
      email: inviteForm.email,
      isActive: true,
      permissions: permissionsMap[inviteForm.role] || { add: true, edit: false, delete: false, viewFinancials: false }
    });

    setIsInviteOpen(false);
    setInviteForm({ name: "", role: "محامي", email: "", isActive: true });
  };

  const handleRoleChange = (userId: string, role: UserRole) => {
    if (!isOwner) {
      alert("عذراً، تغيير أدوار الموظفين يتطلب حساب صاحب المكتب.");
      return;
    }
    onUpdateUserRole(userId, role);
  };

  const rolesList: (UserRole | string)[] = ["صاحب المكتب", "محامي", "محام تدريب", "سكرتارية", "محاسب"];

  return (
    <div className="space-y-6 text-right" dir="rtl">
      
      {/* Title bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className={`text-xl font-bold font-sans ${darkMode ? "text-white" : "text-slate-900"}`}>لوحة التحكم وإعدادات النظام</h2>
          <p className="text-xs text-slate-500 mt-1">تعديل بيانات ترويسة صحف الدعاوى والمطبوعات للمكتب، وإدارة صلاحيات الزملاء والرقابة الإدارية الشاملة.</p>
        </div>
      </div>

      {/* Internal Tabs Navigator */}
      <div className="flex items-center gap-1 border-b border-slate-200 dark:border-slate-800 pb-px">
        <button
          onClick={() => setActiveTab("office")}
          className={`px-4 py-2 text-xs font-bold transition-all border-b-2 cursor-pointer ${
            activeTab === "office"
              ? "border-amber-500 text-amber-500"
              : "border-transparent text-slate-400 hover:text-slate-300"
          }`}
        >
          🏢 بيانات مؤسسة المحاماة
        </button>
        <button
          onClick={() => setActiveTab("users")}
          className={`px-4 py-2 text-xs font-bold transition-all border-b-2 cursor-pointer ${
            activeTab === "users"
              ? "border-amber-500 text-amber-500"
              : "border-transparent text-slate-400 hover:text-slate-300"
          }`}
        >
          👥 صلاحيات وهيكل المحامين والزملاء
        </button>
        <button
          onClick={() => setActiveTab("audit")}
          className={`px-4 py-2 text-xs font-bold transition-all border-b-2 cursor-pointer ${
            activeTab === "audit"
              ? "border-amber-500 text-amber-500"
              : "border-transparent text-slate-400 hover:text-slate-300"
          }`}
        >
          📜 سجل الأنشطة والرقابة القانونية (Audit Logs)
        </button>
      </div>

      {/* Role Protection alert for non-owners */}
      {!isOwner && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-xs flex items-center gap-2 text-amber-500">
          <ShieldAlert className="w-4 h-4 flex-shrink-0" />
          <span>أنت مسجل كـ <strong>({currentUser.role})</strong>. بعض نوافذ هذه اللوحة معطلة ولا يمكن تحرير الصلاحيات الأساسية دون حساب صاحب المكتب.</span>
        </div>
      )}

      {/* Tab Contents */}
      {activeTab === "office" && (
        <div className={`p-6 rounded-2xl border ${darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"} max-w-2xl`}>
          <div className="flex items-center gap-2 text-xs text-amber-500 font-bold mb-5 pb-2 border-b border-slate-800/20">
            <Building className="w-4 h-4" />
            تكوين الترويسة والصحف الرسمية للمكتب
          </div>

          <form onSubmit={handleSaveOffice} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">اسم مكتب المحاماة *</label>
                <input 
                  type="text" 
                  required
                  disabled={!isOwner}
                  value={officeForm.officeName}
                  onChange={(e) => setOfficeForm({...officeForm, officeName: e.target.value})}
                  className={`w-full text-xs p-2.5 rounded-lg border focus:outline-none ${
                    darkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                  } ${!isOwner && "opacity-60 cursor-not-allowed"}`}
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">الاسم التجاري للمالك *</label>
                <input 
                  type="text" 
                  required
                  disabled={!isOwner}
                  value={officeForm.lawyerName}
                  onChange={(e) => setOfficeForm({...officeForm, lawyerName: e.target.value})}
                  className={`w-full text-xs p-2.5 rounded-lg border focus:outline-none ${
                    darkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                  } ${!isOwner && "opacity-60 cursor-not-allowed"}`}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">أرقام الهواتف والتواصل *</label>
                <input 
                  type="text" 
                  required
                  disabled={!isOwner}
                  value={officeForm.phone}
                  onChange={(e) => setOfficeForm({...officeForm, phone: e.target.value})}
                  className={`w-full text-xs p-2.5 rounded-lg border focus:outline-none ${
                    darkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                  } ${!isOwner && "opacity-60 cursor-not-allowed"}`}
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">البريد الإلكتروني المهني للمكتب *</label>
                <input 
                  type="email" 
                  required
                  disabled={!isOwner}
                  value={officeForm.email}
                  onChange={(e) => setOfficeForm({...officeForm, email: e.target.value})}
                  className={`w-full text-xs p-2.5 rounded-lg border focus:outline-none ${
                    darkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                  } ${!isOwner && "opacity-60 cursor-not-allowed"}`}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">العنوان الرئيسي للمكتب بجمهورية مصر العربية *</label>
              <input 
                type="text" 
                required
                disabled={!isOwner}
                value={officeForm.address}
                onChange={(e) => setOfficeForm({...officeForm, address: e.target.value})}
                className={`w-full text-xs p-2.5 rounded-lg border focus:outline-none ${
                  darkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                } ${!isOwner && "opacity-60 cursor-not-allowed"}`}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">رقم نقابة المحامين (القيد العام) *</label>
                <input 
                  type="text" 
                  required
                  disabled={!isOwner}
                  value={officeForm.barAssociationNumber}
                  onChange={(e) => setOfficeForm({...officeForm, barAssociationNumber: e.target.value})}
                  className={`w-full text-xs p-2.5 rounded-lg border focus:outline-none ${
                    darkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                  } ${!isOwner && "opacity-60 cursor-not-allowed"}`}
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">الرقم الضريبي والبطاقة الاستيرادية</label>
                <input 
                  type="text" 
                  disabled={!isOwner}
                  value={officeForm.taxNumber}
                  onChange={(e) => setOfficeForm({...officeForm, taxNumber: e.target.value})}
                  className={`w-full text-xs p-2.5 rounded-lg border focus:outline-none ${
                    darkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                  } ${!isOwner && "opacity-60 cursor-not-allowed"}`}
                />
              </div>
            </div>

            {isOwner && (
              <div className="flex justify-end pt-4 border-t border-slate-800/20">
                <button 
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <Save className="w-4 h-4" />
                  حفظ التعديلات الرسمية
                </button>
              </div>
            )}
          </form>

          {/* Privacy and Personal Visits Exclusion Card */}
          <div className={`mt-6 pt-6 border-t ${darkMode ? "border-slate-800" : "border-slate-200"} space-y-3 text-right`}>
            <h4 className="text-xs font-bold text-amber-500 flex items-center gap-1.5">
              <EyeOff className="w-4 h-4" />
              إعدادات الخصوصية واستبعاد الزيارات الشخصية
            </h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              نظراً لأنك تقوم بالدخول إلى رابط الموقع باستمرار لفحص حملاتك الإعلانية أو حالة الموقع من خارج النظام، فإن الزيارات الشخصية يتم احتسابها كزيارات حقيقية مما يشوه دقة تقارير الإقبال. يمكنك تفعيل الخيار أدناه لمنع احتساب زيارات جهازك/متصفحك هذا تماماً من تقارير الزوار الجدد وحملات Google Ads أو Facebook Ads.
            </p>
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/40 border border-slate-800/40 mt-1">
              <div className="flex flex-col text-right">
                <span className="text-xs font-bold text-white">استبعاد هذا الجهاز من إحصائيات الإقبال</span>
                <span className="text-[10px] text-slate-500 mt-0.5">عند التفعيل، لن يتم احتساب أي زيارة تقوم بها على هذا المتصفح في إحصائيات حملات الإعلانات أو عدد الزوار الإجمالي.</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  const current = localStorage.getItem("meezan_exclude_my_visits") === "true";
                  localStorage.setItem("meezan_exclude_my_visits", current ? "false" : "true");
                  setExcludeMyVisits(!current);
                  alert(current ? "تم إلغاء تفعيل الاستبعاد. سيتم احتساب زيارات هذا المتصفح مجدداً." : "تم تفعيل استبعاد هذا الجهاز بنجاح! لن يتم احتساب زياراتك الشخصية من هذا المتصفح بعد الآن.");
                }}
                className={`px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  excludeMyVisits 
                    ? "bg-emerald-500 text-slate-950 hover:bg-emerald-600 shadow-lg shadow-emerald-500/10" 
                    : "bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700"
                }`}
              >
                {excludeMyVisits ? "✔️ مفعّل (مستبعد)" : "❌ معطّل (يتم احتسابك)"}
              </button>
            </div>
          </div>

          {/* Database & Demo Data Control Tools (UX improvement) */}
          <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-800/80 space-y-3 text-right">
            <h4 className="text-xs font-bold text-rose-500 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4" />
              أدوات التحكم بالبيانات والتهيئة الأولى للمكتب
            </h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              تتيح لك هذه الأدوات إعادة ضبط قاعدة البيانات لبدء تشغيل النظام الفعلي لمكتبك بسجل فارغ وخالٍ من البيانات التجريبية، أو استعادتها مرة أخرى للمعاينة السريعة واختبار الميزات.
            </p>
            <div className="flex flex-wrap gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => {
                  if (confirm("تحذير عاجل: هل أنت متأكد من رغبتك في حذف وتصفير جميع البيانات؟ سيبدأ النظام خالياً تماماً للاستخدام الفعلي.")) {
                    onWipeAllData?.();
                    alert("تم تصفير وحذف جميع البيانات بنجاح. النظام الآن جاهز تماماً للاستخدام الفعلي.");
                  }
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-500/10 hover:bg-rose-500 hover:text-white border border-rose-500/20 text-rose-500 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                حذف وتصفير كافة البيانات (البدء بصفحة فارغة)
              </button>
              <button
                type="button"
                onClick={() => {
                  onLoadDemoData?.();
                  alert("تم تحميل وتوليد البيانات التجريبية المعدة مسبقاً بنجاح لمراجعة وتجربة كافة أقسام النظام.");
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500/10 hover:bg-amber-500 hover:text-slate-950 border border-amber-500/20 text-amber-500 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <History className="w-4 h-4" />
                تحميل واستعادة البيانات التجريبية للمعاينة
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === "users" && (
        <div className="space-y-4">
          <div className={`p-5 rounded-2xl border ${darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
            
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 mb-4">
              <h3 className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-amber-500" />
                هيكل المحامين والزملاء المقيدين بالنظام
              </h3>

              {isOwner && (
                <button
                  onClick={() => setIsInviteOpen(true)}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  دعوة عضو جديد للمكتب
                </button>
              )}
            </div>

            {/* Users grid list */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {usersList
                .filter(usr => !usr.isSuperUser && usr.id !== "usr-super" && usr.role !== UserRole.SuperAdmin)
                .map(usr => (
                <div 
                  key={usr.id}
                  className={`p-4 rounded-xl border ${
                    usr.isActive 
                      ? "bg-slate-950/40 border-slate-800" 
                      : "bg-slate-900/10 border-slate-900/40 opacity-60"
                  } space-y-3 text-right`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className={`text-xs font-bold ${darkMode ? "text-white" : "text-slate-900"}`}>{usr.name}</h4>
                      <p className="text-[10px] text-slate-500">{usr.email}</p>
                    </div>

                    <span className="text-[9px] bg-amber-500/10 text-amber-500 font-bold px-2 py-0.5 rounded">
                      {usr.role}
                    </span>
                  </div>

                  {/* Permissions mini badge block */}
                  <div className="pt-2.5 border-t border-slate-800/40 grid grid-cols-3 gap-1 text-[9px] text-center text-slate-400">
                    <span className={`p-1 rounded ${usr.permissions.add ? "bg-emerald-500/10 text-emerald-500" : "bg-slate-800 text-slate-600"}`}>
                      إضافة
                    </span>
                    <span className={`p-1 rounded ${usr.permissions.edit ? "bg-blue-500/10 text-blue-500" : "bg-slate-800 text-slate-600"}`}>
                      تعديل
                    </span>
                    <span className={`p-1 rounded ${usr.permissions.delete ? "bg-rose-500/10 text-rose-500" : "bg-slate-800 text-slate-600"}`}>
                      حذف
                    </span>
                  </div>

                  {/* Role Swapper Select (For owners only) */}
                  {isOwner && usr.id !== currentUser.id && (
                    <div className="pt-2">
                      <label className="block text-[9px] text-slate-500 mb-1">تغيير المسمى والصفة الوظيفية:</label>
                      <select
                        value={usr.role}
                        onChange={(e) => handleRoleChange(usr.id, e.target.value as UserRole)}
                        className={`w-full text-[10px] p-1 rounded border ${
                          darkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                        }`}
                      >
                        {rolesList.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </div>
                  )}
                </div>
              ))}
            </div>

          </div>
        </div>
      )}

      {activeTab === "audit" && (
        <div className={`p-5 rounded-2xl border ${darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 mb-4">
            <h3 className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
              <History className="w-4 h-4 text-amber-500" />
              سجل تدقيق الرقابة ومكافحة التلاعب الإداري (Audit Trial)
            </h3>
            <span className="text-[10px] bg-red-500/10 text-red-500 px-2 py-0.5 rounded font-bold font-mono">تتبع بصمة المستخدمين</span>
          </div>

          <p className="text-[11px] text-slate-400 mb-4 leading-relaxed">
            يقوم نظام ميزان برصد وتسجيل كل عملية إضافة، تعديل، أو حذف تتم على ملفات القضايا والتوكيلات ومصروفات الخزينة، مع تحديد بصمة وتوقيت وعنوان الـ IP للمستخدم لضمان أعلى مستويات الأمان المؤسسي بمصر.
          </p>

          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
            {auditLogs.map(log => (
              <div 
                key={log.id} 
                className={`p-3 rounded-xl text-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border ${
                  (log.action || "").includes("حذف") 
                    ? "bg-rose-500/5 border-rose-500/10" 
                    : (log.action || "").includes("إضافة") || (log.action || "").includes("تحصيل")
                      ? "bg-emerald-500/5 border-emerald-500/10"
                      : "bg-slate-950/40 border-slate-800"
                }`}
              >
                <div className="space-y-1">
                  <span className={`text-[10px] font-bold ${darkMode ? "text-slate-300" : "text-slate-900"}`}>{log.action || ""}</span>
                  <div className="flex items-center gap-2 text-[10px] text-slate-500">
                    <span>👤 القائم بالعمل: <strong>{log.userName}</strong> ({log.userRole})</span>
                    <span>•</span>
                    <span className="font-mono">IP: {log.ipAddress}</span>
                  </div>
                </div>

                <div className="text-left text-[10px] font-mono text-slate-400 shrink-0">
                  {log.timestamp}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Invite Member Modal */}
      {isInviteOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`w-full max-w-md rounded-2xl border shadow-xl overflow-hidden text-right ${
            darkMode ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-900"
          }`}>
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-950/20">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-500" />
                تسجيل ودعوة عضو جديد لفريق العمل
              </h3>
              <button onClick={() => setIsInviteOpen(false)} className="p-1 rounded hover:bg-slate-800 text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <form onSubmit={handleInviteSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">الاسم الكامل للعضو الجديد *</label>
                <input 
                  type="text" 
                  required
                  placeholder="مثال: أ. محمد علي محمود"
                  value={inviteForm.name}
                  onChange={(e) => setInviteForm({...inviteForm, name: e.target.value})}
                  className={`w-full text-xs p-2 rounded-lg border focus:outline-none ${
                    darkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">البريد الإلكتروني المهني *</label>
                <input 
                  type="email" 
                  required
                  placeholder="lawyer@mizan.com"
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm({...inviteForm, email: e.target.value})}
                  className={`w-full text-xs p-2 rounded-lg border focus:outline-none ${
                    darkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">الصفة والدور الوظيفي الرئيسي *</label>
                <select 
                  value={inviteForm.role}
                  onChange={(e) => setInviteForm({...inviteForm, role: e.target.value as UserRole})}
                  className={`w-full text-xs p-2 rounded-lg border focus:outline-none ${
                    darkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                  }`}
                >
                  {rolesList.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-200 dark:border-slate-800 pt-4">
                <button 
                  type="button" 
                  onClick={() => setIsInviteOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold cursor-pointer"
                >
                  إلغاء
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold cursor-pointer"
                >
                  إرسال دعوة التسجيل
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
