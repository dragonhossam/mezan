/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { 
  Scale, 
  LayoutGrid,
  Users, 
  Briefcase, 
  Calendar as CalendarIcon, 
  CheckSquare, 
  FolderOpen, 
  DollarSign, 
  CreditCard, 
  BarChart3, 
  Settings, 
  ShieldCheck,
  Moon,
  Sun,
  User as UserIcon,
  Search,
  Crown,
  ShieldAlert,
  LogOut,
  Bell,
  PlayCircle
} from "lucide-react";
import { User, UserRole } from "../types";

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  currentUser: User;
  usersList: User[];
  onSwitchUser: (userId: string) => void;
  officeName: string;
  darkMode: boolean;
  setDarkMode: (dark: boolean) => void;
  onOpenSearch: () => void;
  subscription?: any;
  onLogout?: () => void;
  unreadNotificationCount?: number;
  onOpenNotificationModal?: () => void;
  onOpenTutorial?: () => void;
}

export default function Sidebar({
  currentTab,
  setCurrentTab,
  currentUser,
  usersList,
  onSwitchUser,
  officeName,
  darkMode,
  setDarkMode,
  onOpenSearch,
  subscription,
  onLogout,
  unreadNotificationCount = 0,
  onOpenNotificationModal,
  onOpenTutorial
}: SidebarProps) {
  
  const isSuperUser = currentUser.isSuperUser === true || currentUser.id === "usr-super" || currentUser.email === "superuser@lawmizan.com";

  const allMenuItems = [
    { id: "dashboard", label: "الرئيسية", icon: Scale },
    { id: "menu", label: "دليل الأقسام الشامل 📋", icon: LayoutGrid },
    { id: "clients", label: "العملاء (CRM)", icon: Users },
    { id: "cases", label: "القضايا", icon: Briefcase },
    { id: "sessions", label: "الجلسات والتقويم", icon: CalendarIcon },
    { id: "tasks", label: "المهام والمواعيد", icon: CheckSquare },
    { id: "documents", label: "الأرشيف والمستندات", icon: FolderOpen },
    { id: "financial", label: "الحسابات والأتعاب", icon: DollarSign },
    { id: "expenses", label: "المصروفات", icon: CreditCard },
    { id: "reports", label: "التقارير والإحصائيات", icon: BarChart3 },
    { id: "subscription", label: "باقة الاشتراك والترقية", icon: Crown },
    { id: "settings", label: "إعدادات المكتب", icon: Settings },
    { id: "admin_panel", label: "لوحة الإدارة الكبرى 🛡️", icon: ShieldAlert },
  ];

  const menuItems = allMenuItems.filter((item) => {
    if (item.id === "admin_panel") return isSuperUser;
    return true;
  });

  return (
    <aside 
      className="hidden lg:flex w-64 flex-shrink-0 flex-col h-screen border-l border-[#1E293B] bg-[#0D1B2A] text-white transition-all duration-300 shadow-xl fixed right-0 top-0 z-30"
    >
      {/* Brand & Logo */}
      <div className="p-5 border-b border-[#1E293B] flex items-center gap-3">
        <div className="w-10 h-10 bg-[#C5A059] text-white rounded-lg flex items-center justify-center text-xl shadow-lg shadow-[#C5A059]/10 font-bold">
          ⚖️
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <h1 className="font-bold text-lg leading-tight text-white font-sans">ميزان</h1>
            {subscription && (
              <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-full ${
                subscription.status === "active" 
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                  : subscription.status === "trial"
                    ? "bg-amber-500/15 text-amber-400 border border-amber-500/20"
                    : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
              }`}>
                {subscription.status === "active" ? "بريميوم" : subscription.status === "trial" ? "تجريبي" : "منتهي"}
              </span>
            )}
          </div>
          <p className="text-[10px] text-[#94A3B8] tracking-widest uppercase">لإدارة المحاماة والعمليات</p>
        </div>
      </div>

      {/* Office Quick Banner */}
      <div className="px-4 py-2 bg-[#1E293B]/60 border-b border-[#1E293B]/80">
        <p className="text-xs text-[#94A3B8] truncate text-right font-medium" title={officeName}>
          🏢 {officeName}
        </p>
      </div>

      {/* Role Switcher Sandbox for Reviewers */}
      <div className="p-3 bg-[#1E293B]/40 border border-[#1E293B]/80 mx-3 my-3 rounded-lg">
        <label className="block text-[10px] font-bold text-[#C5A059] mb-1.5 text-right flex items-center justify-between">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-[#C5A059]" />
            تغيير صلاحية مستخدم النظام:
          </span>
        </label>
        <select 
          value={currentUser.id}
          onChange={(e) => onSwitchUser(e.target.value)}
          className="w-full text-xs bg-[#0D1B2A] border border-[#1E293B] rounded px-2 py-1 text-white focus:outline-none focus:border-[#C5A059]"
          dir="rtl"
        >
          {usersList
            .filter((usr) => 
              (currentUser.isSuperUser || currentUser.role === UserRole.SuperAdmin)
                ? true 
                : (!usr.isSuperUser && usr.id !== "usr-super" && usr.role !== UserRole.SuperAdmin)
            )
            .map((usr) => (
              <option key={usr.id} value={usr.id} className="bg-[#0D1B2A] text-white">
                {usr.name} ({usr.role})
              </option>
            ))}
        </select>
        <div className="mt-1.5 text-[9px] text-[#94A3B8] text-left" dir="ltr">
          Current Role: <span className="text-[#C5A059] font-mono font-bold">{currentUser.role}</span>
        </div>
      </div>

      {/* Search Trigger */}
      <button 
        onClick={onOpenSearch}
        className="mx-3 mb-2 flex items-center justify-between text-right text-xs bg-[#0D1B2A]/80 border border-[#1E293B] hover:border-[#C5A059]/40 rounded px-3 py-2 text-[#94A3B8] hover:text-white transition-all cursor-pointer"
      >
        <span className="flex items-center gap-2">
          <Search className="w-3.5 h-3.5 text-[#94A3B8]" />
          البحث الشامل...
        </span>
        <span className="text-[10px] bg-[#1E293B] px-1.5 py-0.5 rounded text-[#94A3B8]/60 font-mono">CTRL + K</span>
      </button>

      {/* Entrance Notifications Button Trigger */}
      {onOpenNotificationModal && (
        <button 
          onClick={onOpenNotificationModal}
          className="mx-3 mb-2 flex items-center justify-between text-right text-xs bg-[#C5A059]/15 border border-[#C5A059]/30 hover:border-[#C5A059] rounded-lg px-3 py-2 text-[#C5A059] font-bold transition-all cursor-pointer group"
        >
          <span className="flex items-center gap-2">
            <Bell className="w-3.5 h-3.5 text-[#C5A059] group-hover:scale-110 transition-transform" />
            <span>إشعارات دخول الموقع</span>
          </span>
          {unreadNotificationCount > 0 ? (
            <span className="bg-rose-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full animate-pulse">
              {unreadNotificationCount} جديد
            </span>
          ) : (
            <span className="text-[9px] text-[#C5A059]/70 font-mono">نشط 🟢</span>
          )}
        </button>
      )}

      {/* Navigation Menu */}
      <nav className="flex-1 overflow-y-auto px-2 space-y-1 py-2" dir="rtl">
        {onOpenTutorial && (
          <button
            onClick={onOpenTutorial}
            className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg mb-2 text-right transition-colors cursor-pointer group bg-[#C5A059]/10 hover:bg-[#C5A059] hover:text-slate-950 text-[#C5A059] border border-[#C5A059]/30`}
          >
            <div className="flex items-center gap-2.5">
              <PlayCircle className="w-4 h-4 group-hover:scale-110 transition-transform" />
              <span className="font-bold text-sm leading-none pt-0.5">شرح استخدام المنصة</span>
            </div>
            <span className="text-[10px] bg-slate-900/50 px-1.5 py-0.5 rounded-sm">فيديو</span>
          </button>
        )}
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 text-right ${
                isActive
                  ? "bg-[#C5A059] text-white font-semibold shadow-lg shadow-[#C5A059]/10"
                  : "text-[#94A3B8] hover:bg-[#1E293B] hover:text-white"
              }`}
            >
              <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? "text-white" : "text-[#C5A059]"}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* User Session Profile & Mode Toggle */}
      <div className="p-4 border-t border-[#1E293B] bg-[#1E293B]/40 mt-auto flex flex-col gap-3">
        <div className="flex items-center gap-3 justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#C5A059]/20 text-[#C5A059] border border-[#C5A059]/30 flex items-center justify-center font-bold">
              {currentUser.name[0] || "م"}
            </div>
            <div className="overflow-hidden">
              <h4 className="text-xs font-semibold text-white truncate" title={currentUser.name}>
                {currentUser.name}
              </h4>
              <p className="text-[10px] text-[#94A3B8] truncate">{currentUser.email}</p>
            </div>
          </div>

          <button 
            onClick={() => setDarkMode(!darkMode)}
            className="p-1.5 rounded bg-[#0D1B2A] hover:bg-[#1E293B] text-[#C5A059] border border-[#1E293B] flex items-center justify-center transition-colors cursor-pointer"
            title={darkMode ? "الوضع المضيء" : "الوضع الليلي"}
          >
            {darkMode ? <Sun className="w-3.5 h-3.5 text-[#C5A059]" /> : <Moon className="w-3.5 h-3.5 text-[#C5A059]" />}
          </button>
        </div>

        {/* Clear & Highly Visible Full-width Logout Button */}
        {onLogout && (
          <button 
            onClick={onLogout}
            className="w-full py-2 px-3 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs transition-all shadow-lg shadow-rose-500/15 cursor-pointer flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99]"
            title="تسجيل الخروج من الحساب"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>تسجيل الخروج من الحساب</span>
          </button>
        )}
        
        <div className="text-center text-[9px] text-[#94A3B8]/40 font-mono">
          v1.2.0
        </div>
      </div>
    </aside>
  );
}
