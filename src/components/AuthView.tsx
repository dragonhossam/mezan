/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Scale, 
  Lock, 
  Mail, 
  User as UserIcon, 
  Phone, 
  Award, 
  ShieldCheck, 
  LogIn, 
  UserPlus, 
  Eye, 
  EyeOff,
  CheckCircle2,
  Briefcase
} from "lucide-react";
import { User, UserRole, OfficeConfig } from "../types";
import { comparePassword, hashPassword, validatePasswordPolicy, isWeakDefaultPassword } from "../lib/auth";
import PasswordStrengthIndicator from "./PasswordStrengthIndicator";

interface AuthViewProps {
  usersList: User[];
  officeConfig: OfficeConfig;
  onLogin: (user: User) => void;
  onRegister: (newUser: User) => void;
  onUpdatePassword?: (userId: string, hashedPass: string) => void;
  darkMode: boolean;
}

export default function AuthView({
  usersList,
  officeConfig,
  onLogin,
  onRegister,
  onUpdatePassword,
  darkMode
}: AuthViewProps) {
  const [isRegisterMode, setIsRegisterMode] = useState(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      return params.has("utm_source") || params.has("fbclid") || params.has("gclid");
    }
    return false;
  });
  const [isSuperAdminLogin, setIsSuperAdminLogin] = useState(false);
  
  // Public users list (excludes Super Admin accounts)
  const publicUsers = usersList.filter(
    (usr) => !usr.isSuperUser && usr.id !== "usr-super" && usr.role !== UserRole.SuperAdmin
  );

  const [selectedUserId, setSelectedUserId] = useState<string>(
    publicUsers[0]?.id || usersList.find((u) => !u.isSuperUser)?.id || usersList[0]?.id || ""
  );
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState("");

  // Super Admin specific credentials
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPass, setAdminPass] = useState("");

  // Registration Form State
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regRole, setRegRole] = useState<UserRole>(UserRole.Lawyer);
  const [regPassword, setRegPassword] = useState("");
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [regError, setRegError] = useState("");
  const [regSuccess, setRegSuccess] = useState(false);

  // Forced Password Reset Flow States
  const [resetRequiredUser, setResetRequiredUser] = useState<User | null>(null);
  const [newResetPassword, setNewResetPassword] = useState("");
  const [confirmResetPassword, setConfirmResetPassword] = useState("");
  const [resetError, setResetError] = useState("");
  const [showResetPassword, setShowResetPassword] = useState(false);

  // Handle Login Submit
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");

    try {
      let body: any = {};
      if (isSuperAdminLogin) {
        if (!adminEmail.trim() || !adminPass.trim()) {
          setLoginError("يرجى إدخال البريد الإلكتروني وكلمة المرور");
          return;
        }
        body = { email: adminEmail.trim().toLowerCase(), password: adminPass.trim() };
      } else {
        if (!selectedUserId) {
          setLoginError("يرجى تحديد حساب المحامي أولاً");
          return;
        }
        body = { userId: selectedUserId, password: password.trim() };
      }

      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });

      if (!res.ok) {
        const errData = await res.json();
        setLoginError(errData.error || "اسم المستخدم أو كلمة المرور غير صحيحة");
        return;
      }

      const data = await res.json();
      if (data.success) {
        // Store session token in localStorage for subsequent API requests
        if (data.token) {
          localStorage.setItem("meezan_session_token", data.token);
        }

        if (data.resetRequired) {
          // Pass default empty passwords on resetRequired block
          setResetRequiredUser({ ...data.user, password: "" });
        } else {
          onLogin(data.user);
        }
      }
    } catch (err) {
      console.error("Login request failed:", err);
      setLoginError("حدث خطأ أثناء الاتصال بالخادم، يرجى التحقق من الشبكة");
    }
  };

  // Handle Register Submit
  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRegError("");

    if (!regName.trim()) {
      setRegError("يرجى كتابة الاسم الكامل للمحامي");
      return;
    }
    if (!regEmail.trim() || !regEmail.includes("@")) {
      setRegError("يرجى كتابة بريد إلكتروني صحيح");
      return;
    }

    // Validate using secure password policy
    const policyResult = validatePasswordPolicy(regPassword, regEmail);
    if (!policyResult.isValid) {
      setRegError(policyResult.error || "كلمة المرور غير مطابقة للسياسة الأمنية");
      return;
    }

    // Check if email already exists
    const existing = usersList.find((u) => u.email.toLowerCase() === regEmail.toLowerCase());
    if (existing) {
      setRegError("هذا البريد الإلكتروني مسجل بالفعل لمستخدم آخر");
      return;
    }

    const newUser: User = {
      id: `usr-${Date.now()}`,
      name: regName.trim(),
      email: regEmail.trim(),
      role: regRole,
      avatarUrl: "",
      isActive: true,
      // Securely hash password immediately before saving
      password: hashPassword(regPassword),
      isSuperUser: false,
      permissions: {
        view: true,
        add: true,
        edit: true,
        delete: regRole === UserRole.Owner,
        export: regRole === UserRole.Owner || regRole === UserRole.Lawyer,
        viewFinancials: regRole === UserRole.Owner || regRole === UserRole.Accountant
      }
    };

    setRegSuccess(true);
    setTimeout(() => {
      onRegister(newUser);
    }, 1000);
  };

  // Handle Forced Reset Password Submit
  const handleResetPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setResetError("");

    if (!resetRequiredUser) return;

    if (!newResetPassword.trim() || !confirmResetPassword.trim()) {
      setResetError("يرجى تعبئة حقول كلمة المرور الجديدة وتأكيدها");
      return;
    }

    if (newResetPassword !== confirmResetPassword) {
      setResetError("كلمتا المرور غير متطابقتين");
      return;
    }

    // Check against password policy
    const policyResult = validatePasswordPolicy(newResetPassword, resetRequiredUser.email);
    if (!policyResult.isValid) {
      setResetError(policyResult.error || "كلمة المرور غير صالحة");
      return;
    }

    // Hash immediately!
    const hashedNewPassword = hashPassword(newResetPassword);

    // Call parent handler to update password in state and store
    if (onUpdatePassword) {
      onUpdatePassword(resetRequiredUser.id, hashedNewPassword);
    }

    // Complete login with updated credentials
    const authenticatedUser: User = {
      ...resetRequiredUser,
      password: hashedNewPassword
    };

    onLogin(authenticatedUser);

    // Reset local states
    setResetRequiredUser(null);
    setNewResetPassword("");
    setConfirmResetPassword("");
  };

  return (
    <div className={`min-h-screen w-full flex items-center justify-center p-4 transition-colors duration-300 ${
      darkMode ? "bg-[#0A121D] text-white" : "bg-slate-900 text-slate-100"
    }`} dir="rtl">
      
      {/* Background Decorative Lighting */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-[#C5A059]/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl"></div>
      </div>

      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-12 rounded-3xl border border-slate-800 shadow-2xl overflow-hidden bg-[#0D1B2A]/90 backdrop-blur-xl z-10">
        
        {/* Right Panel: Identity & Branding */}
        <div className="md:col-span-5 bg-gradient-to-br from-[#0D1B2A] via-[#112236] to-[#0A1422] p-8 flex flex-col justify-between border-b md:border-b-0 md:border-l border-slate-800/80 relative">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#C5A059]/20 border border-[#C5A059]/40 flex items-center justify-center text-[#C5A059] shadow-lg shadow-[#C5A059]/10">
                <Scale className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-black text-white tracking-wide">{officeConfig.logoText || "ميزان"}</h1>
                <p className="text-[10px] text-[#C5A059] font-bold">لإدارة مكتب المحاماة والعمليات القانونية</p>
              </div>
            </div>

            <div className="pt-4 space-y-3">
              <h2 className="text-md font-bold text-slate-100 leading-snug">
                منصة ميزان الرقمية لرقمنة وإدارة مكاتب المحاماة
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                منصة ميزان هي بيئة العمل السحابية المتكاملة والمصممة خصيصاً للمحامي المصري والعربي لتنظيم وإدارة القضايا، الجلسات، الموكلين، الحسابات والمهام اليومية بدقة واحترافية متناهية. تعمل المنصة كبديل رقمي متكامل للأجندة الورقية التقليدية وتدعم عزل وسرية بيانات الشركاء والمساعدين، لتوفير أعلى درجات الأمان والتحكم الإداري لمكتبك.
              </p>
              <div className="flex items-center gap-2 bg-[#C5A059]/10 border border-[#C5A059]/20 px-3 py-1.5 rounded-xl w-fit">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-[10px] font-bold text-[#C5A059]">فترة تجريبية مجانية بالكامل لمدة شهر بدون أي التزامات دفع</span>
              </div>
            </div>

            <div className="border-t border-slate-800/60 pt-4 space-y-3.5">
              <h3 className="text-xs font-black text-[#C5A059] uppercase tracking-wider">الخدمات والحلول الرقمية المقدمة:</h3>
              
              <div className="space-y-3">
                <div className="flex items-start gap-2.5">
                  <span className="text-[#C5A059] mt-0.5 font-bold">⚖️</span>
                  <div>
                    <h4 className="text-xs font-bold text-white mb-0.5">أرشفة وإدارة القضايا</h4>
                    <p className="text-[10px] text-slate-400 leading-normal">تنظيم شامل لملفات القضايا والدعاوى والمذكرات والمستندات وأطراف الخصومة.</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <span className="text-[#C5A059] mt-0.5 font-bold">📅</span>
                  <div>
                    <h4 className="text-xs font-bold text-white mb-0.5">تقويم ذكي لأجندة الجلسات</h4>
                    <p className="text-[10px] text-slate-400 leading-normal">متابعة لحظية وتلقائية لمواعيد جلسات المحاكم بمختلف درجاتها وجلسات الخبراء.</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <span className="text-[#C5A059] mt-0.5 font-bold">💳</span>
                  <div>
                    <h4 className="text-xs font-bold text-white mb-0.5">النظام المالي المدمج</h4>
                    <p className="text-[10px] text-slate-400 leading-normal">تسجيل دقيق لأتعاب الموكلين، الدفعات، المصروفات القضائية، وصافي الدخل.</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <span className="text-[#C5A059] mt-0.5 font-bold">👥</span>
                  <div>
                    <h4 className="text-xs font-bold text-white mb-0.5">إدارة العملاء والخصوصية</h4>
                    <p className="text-[10px] text-slate-400 leading-normal">عزل رقمي كامل لبيانات وسجلات كل محامٍ شريك أو مساعد لضمان السرية والخصوصية.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6 text-[11px] text-slate-550 border-t border-slate-800/60 mt-6 flex justify-between items-center">
            <span>{officeConfig.officeName || "مكتب المحاماة"}</span>
            <span className="font-mono text-[#C5A059]">v1.2.0</span>
          </div>
        </div>

        {/* Left Panel: Auth Form */}
        <div className="md:col-span-7 p-6 md:p-8 flex flex-col justify-center bg-[#0D1B2A]/50">
          
          {resetRequiredUser ? (
            /* FORCED PASSWORD RESET FORM */
            <form
              onSubmit={handleResetPasswordSubmit}
              className="space-y-4 text-right"
            >
              <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-2xl text-xs text-red-200 leading-relaxed mb-4 text-right">
                <div className="font-bold mb-1 flex items-center justify-start gap-1.5 text-[#C5A059]">
                  <Lock className="w-4 h-4 text-[#C5A059]" />
                  <span>تنبيه أمني: تعيين كلمة مرور جديدة</span>
                </div>
                <span>
                  الرمز السري الحالي لحسابك (<strong>{resetRequiredUser.name}</strong>) هو كلمة مرور افتراضية ضعيفة وسهلة التخمين. يرجى اختيار وتأكيد كلمة مرور جديدة قوية لمتابعة الدخول وحماية خصوصية بيانات المكتب.
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  كلمة المرور الجديدة:
                </label>
                <div className="relative">
                  <input
                    type={showResetPassword ? "text" : "password"}
                    required
                    placeholder="أدخل 8 خانات أو أكثر تشمل حروفا وأرقاما"
                    value={newResetPassword}
                    onChange={(e) => setNewResetPassword(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 rounded-2xl text-xs font-medium bg-slate-900 border border-slate-800 text-white placeholder-slate-500 outline-none focus:border-[#C5A059] transition-all text-right"
                  />
                  <button
                    type="button"
                    onClick={() => setShowResetPassword(!showResetPassword)}
                    className="absolute left-3.5 top-3.5 text-slate-400 hover:text-white"
                  >
                    {showResetPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  تأكيد كلمة المرور الجديدة:
                </label>
                <div className="relative">
                  <input
                    type={showResetPassword ? "text" : "password"}
                    required
                    placeholder="أعد كتابة كلمة المرور الجديدة للتأكيد"
                    value={confirmResetPassword}
                    onChange={(e) => setConfirmResetPassword(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 rounded-2xl text-xs font-medium bg-slate-900 border border-slate-800 text-white placeholder-slate-500 outline-none focus:border-[#C5A059] transition-all text-right"
                  />
                </div>
              </div>

              {/* Password strength indicator and policy check */}
              <PasswordStrengthIndicator password={newResetPassword} email={resetRequiredUser.email} />

              {resetError && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400 font-bold text-right">
                  ⚠️ {resetError}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-3 px-4 rounded-xl text-xs font-bold bg-[#C5A059] text-slate-950 hover:bg-[#b08b47] hover:shadow-lg hover:shadow-amber-500/5 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>تأكيد وحفظ كلمة المرور والولوج للمكتب</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setResetRequiredUser(null);
                    setNewResetPassword("");
                    setConfirmResetPassword("");
                    setResetError("");
                  }}
                  className="px-4 py-3 rounded-xl text-xs font-bold bg-slate-800 text-slate-300 hover:bg-slate-700 transition-all cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </form>
          ) : (
            <>
              {/* Mode Switcher Tabs */}
              <div className="flex bg-slate-900/80 p-1.5 rounded-2xl border border-slate-800 mb-6">
                <button
                  type="button"
                  onClick={() => setIsRegisterMode(false)}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    !isRegisterMode
                      ? "bg-[#C5A059] text-slate-950 shadow-md"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <LogIn className="w-4 h-4" />
                  <span>تسجيل الدخول</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsRegisterMode(true)}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    isRegisterMode
                      ? "bg-[#C5A059] text-slate-950 shadow-md"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <UserPlus className="w-4 h-4" />
                  <span>ابدأ تجربتك المجانية</span>
                </button>
              </div>

              <AnimatePresence mode="wait">
            {!isRegisterMode ? (
              /* LOGIN FORM */
              <motion.form
                key={isSuperAdminLogin ? "super-admin-form" : "login-form"}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                onSubmit={handleLoginSubmit}
                className="space-y-4"
              >
                {!isSuperAdminLogin ? (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1.5">
                        اختر حساب المحامي / أعضاء المكتب:
                      </label>
                      <div className="relative">
                        <select
                          value={selectedUserId}
                          onChange={(e) => setSelectedUserId(e.target.value)}
                          className="w-full px-3.5 py-3 rounded-2xl text-xs font-medium bg-slate-900 border border-slate-800 text-white outline-none focus:border-[#C5A059] transition-all appearance-none cursor-pointer"
                        >
                          {publicUsers.map((usr) => (
                            <option key={usr.id} value={usr.id}>
                              {usr.name} — ({usr.role})
                            </option>
                          ))}
                        </select>
                        <UserIcon className="w-4 h-4 text-[#C5A059] absolute left-3.5 top-3.5 pointer-events-none" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1.5">
                        كلمة المرور / الرمز السري:
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="أدخل كلمة المرور الخاصة بحسابك..."
                          className="w-full px-3.5 py-3 rounded-2xl text-xs bg-slate-900 border border-slate-800 text-white outline-none focus:border-[#C5A059] transition-all pl-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute left-3.5 top-3.5 text-slate-400 hover:text-white cursor-pointer"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-bold flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>دخول محمي ومخصص لمالك ومدير المنصة الرئيسي</span>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1.5">
                        البريد الإلكتروني المخصص لمدير المنصة:
                      </label>
                      <div className="relative">
                        <input
                          type="email"
                          value={adminEmail}
                          onChange={(e) => setAdminEmail(e.target.value)}
                          placeholder="مثال: superuser@lawmizan.com أو البريد الخاص"
                          className="w-full px-3.5 py-3 rounded-2xl text-xs bg-slate-900 border border-slate-800 text-white outline-none focus:border-[#C5A059] transition-all pl-10"
                          required
                        />
                        <Mail className="w-4 h-4 text-[#C5A059] absolute left-3.5 top-3.5 pointer-events-none" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1.5">
                        كلمة مرور مدير المنصة (Master Password):
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          value={adminPass}
                          onChange={(e) => setAdminPass(e.target.value)}
                          placeholder="كلمة مرور المالك..."
                          className="w-full px-3.5 py-3 rounded-2xl text-xs bg-slate-900 border border-slate-800 text-white outline-none focus:border-[#C5A059] transition-all pl-10"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute left-3.5 top-3.5 text-slate-400 hover:text-white cursor-pointer"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </>
                )}

                {loginError && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold">
                    ⚠️ {loginError}
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-3.5 rounded-2xl text-xs font-black bg-[#C5A059] hover:bg-[#B38E46] text-slate-950 transition-all shadow-xl shadow-[#C5A059]/10 cursor-pointer flex items-center justify-center gap-2 mt-2"
                >
                  <LogIn className="w-4 h-4" />
                  <span>{isSuperAdminLogin ? "تأكيد هوية مدير المنصة والدخول" : "دخول النظام وتأكيد الهوية"}</span>
                </button>

                <div className="pt-2 text-center">
                  {!isSuperAdminLogin ? (
                    <button
                      type="button"
                      onClick={() => {
                        setIsSuperAdminLogin(true);
                        setLoginError("");
                      }}
                      className="text-[11px] text-slate-500 hover:text-[#C5A059] transition-colors cursor-pointer font-medium underline"
                    >
                      🔒 دخول خاص بالإدارة العليا / مدير المنصة
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setIsSuperAdminLogin(false);
                        setLoginError("");
                      }}
                      className="text-[11px] text-slate-400 hover:text-white transition-colors cursor-pointer font-medium"
                    >
                      ⬅ العودة لتسجيل دخول أعضاء والمحامين
                    </button>
                  )}
                </div>
              </motion.form>
            ) : (
              /* REGISTRATION FORM */
              <motion.form
                key="register-form"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                onSubmit={handleRegisterSubmit}
                className="space-y-3"
              >
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-3.5 mb-4 text-right">
                  <div className="flex gap-2.5 items-start">
                    <span className="text-lg">🎁</span>
                    <div>
                      <h4 className="text-xs font-black text-[#C5A059] mb-0.5">الشهر الأول مجاني بالكامل وتلقائياً!</h4>
                      <p className="text-[10px] text-slate-300 leading-relaxed">
                        نحن متحمسون جداً لانضمامك! استمتع بالوصول الفوري والكامل لكافة الأدوات والخصائص الاحترافية لإدارة مكتبك وقضاياك بسهولة مطلقة لمدة 30 يوماً كاملة، بدون الحاجة لأي بيانات دفع أو بطاقات بنكية.
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    اسم المحامي الثلاثي / الرباعي:
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder="مثال: أستاذ علي محمود حسنين"
                      className="w-full px-3 py-2.5 rounded-xl text-xs bg-slate-900 border border-slate-800 text-white outline-none focus:border-[#C5A059]"
                    />
                    <UserIcon className="w-3.5 h-3.5 text-[#C5A059] absolute left-3 top-3 pointer-events-none" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      البريد الإلكتروني:
                    </label>
                    <input
                      type="email"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="lawyer@example.com"
                      className="w-full px-3 py-2.5 rounded-xl text-xs bg-slate-900 border border-slate-800 text-white outline-none focus:border-[#C5A059]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      كلمة المرور:
                    </label>
                    <div className="relative">
                      <input
                        type={showRegPassword ? "text" : "password"}
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-10 pr-3 py-2.5 rounded-xl text-xs bg-slate-900 border border-slate-800 text-white outline-none focus:border-[#C5A059]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegPassword(!showRegPassword)}
                        className="absolute left-3 top-3 text-slate-400 hover:text-white cursor-pointer"
                      >
                        {showRegPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Password strength indicator and policy check */}
                <PasswordStrengthIndicator password={regPassword} email={regEmail} />

                {regError && (
                  <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold">
                    ⚠️ {regError}
                  </div>
                )}

                {regSuccess && (
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>تم إنشاء الحساب بنجاح! جاري تحويلك للنظام...</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={regSuccess}
                  className="w-full py-3 rounded-2xl text-xs font-black bg-[#C5A059] hover:bg-[#B38E46] text-slate-950 transition-all shadow-xl shadow-[#C5A059]/10 cursor-pointer flex items-center justify-center gap-2 mt-4"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>ابدأ تجربتك المجانية الآن (30 يوم)</span>
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </>
      )}

        </div>

      </div>

    </div>
  );
}
