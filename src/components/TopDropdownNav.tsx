/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
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
  Crown,
  ChevronDown,
  ShieldCheck,
  Moon,
  Sun,
  User as UserIcon,
  ShieldAlert,
  LogOut,
  Bell,
  PlayCircle
} from "lucide-react";
import { User, UserRole, UserSubscription } from "../types";

interface TopDropdownNavProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  currentUser: User;
  usersList: User[];
  onSwitchUser: (userId: string) => void;
  officeName: string;
  darkMode: boolean;
  setDarkMode: (dark: boolean) => void;
  subscription?: UserSubscription;
  onLogout?: () => void;
  unreadNotificationCount?: number;
  onOpenNotificationModal?: () => void;
  onOpenTutorial?: () => void;
}

export default function TopDropdownNav({
  currentTab,
  setCurrentTab,
  currentUser,
  usersList,
  onSwitchUser,
  officeName,
  darkMode,
  setDarkMode,
  subscription,
  onLogout,
  unreadNotificationCount = 0,
  onOpenNotificationModal,
  onOpenTutorial
}: TopDropdownNavProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const switcherRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
      if (switcherRef.current && !switcherRef.current.contains(event.target as Node)) {
        setIsSwitcherOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

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

  const currentItem = menuItems.find(item => item.id === currentTab) || menuItems[0];
  const CurrentIcon = currentItem.icon;

  return (
    <header 
      id="top-dropdown-header"
      className={`lg:hidden sticky top-0 z-40 w-full border-b backdrop-blur-md transition-colors duration-300 ${
        darkMode 
          ? "bg-[#0D1B2A]/95 border-[#1E293B] text-white" 
          : "bg-white/95 border-slate-200 text-[#1E293B]"
      }`}
      dir="rtl"
    >
      <div className="px-4 py-3 flex items-center justify-between gap-2 max-w-7xl mx-auto">
        
        {/* Right side: Brand and Badge */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#C5A059] text-white rounded-lg flex items-center justify-center text-md shadow-md font-bold">
            ⚖️
          </div>
          <div>
            <div className="flex items-center gap-1">
              <span className="font-extrabold text-sm font-sans tracking-tight">ميزان</span>
              {subscription && (
                <span className={`text-[7px] font-black px-1.5 py-0.5 rounded-full ${
                  subscription.status === "active" 
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                    : subscription.status === "trial"
                      ? "bg-amber-500/15 text-amber-500 border border-amber-500/20"
                      : "bg-rose-500/10 text-rose-500 border border-rose-500/20"
                }`}>
                  {subscription.status === "active" ? "بريميوم" : subscription.status === "trial" ? "تجريبي" : "منتهي"}
                </span>
              )}
            </div>
            <p className={`text-[8px] truncate max-w-[100px] ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
              {officeName}
            </p>
          </div>
        </div>

        {/* Center: Interactive Dropdown Selector for Navigation */}
        <div className="relative" ref={dropdownRef}>
          <button
            id="mobile-navigation-dropdown-trigger"
            onClick={() => setIsOpen(!isOpen)}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
              darkMode 
                ? "bg-[#1E293B] border-slate-700 text-white hover:bg-slate-800" 
                : "bg-slate-100 border-slate-200 text-[#334155] hover:bg-slate-200"
            }`}
          >
            <CurrentIcon className="w-3.5 h-3.5 text-[#C5A059]" />
            <span>{currentItem.label}</span>
            <ChevronDown className={`w-3.5 h-3.5 text-[#C5A059] transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
          </button>

          {/* Dropdown Menu Overlay */}
          <AnimatePresence>
            {isOpen && (
              <motion.div
                id="mobile-navigation-dropdown-menu"
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className={`absolute left-1/2 -translate-x-1/2 mt-2 w-64 rounded-2xl shadow-2xl border p-2 z-50 ${
                  darkMode 
                    ? "bg-[#0D1B2A] border-slate-800 text-white shadow-black/80" 
                    : "bg-white border-slate-200 text-[#1E293B] shadow-slate-300/50"
                }`}
              >
                <div className="max-h-[380px] overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                  <div className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider border-b pb-1 mb-1.5 ${
                    darkMode ? "text-slate-500 border-slate-800" : "text-slate-400 border-slate-100"
                  }`}>
                    قائمة الأقسام والعمليات
                  </div>
                  {menuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = currentTab === item.id;
                    return (
                      <button
                        key={item.id}
                        id={`mobile-nav-item-${item.id}`}
                        onClick={() => {
                          setCurrentTab(item.id);
                          setIsOpen(false);
                        }}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all text-right cursor-pointer ${
                          isActive
                            ? "bg-[#C5A059] text-white shadow-md"
                            : darkMode
                              ? "text-slate-300 hover:bg-[#1E293B] hover:text-white"
                              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                        }`}
                      >
                        <Icon className={`w-3.5 h-3.5 ${isActive ? "text-white" : "text-[#C5A059]"}`} />
                        <span className="truncate">{item.label}</span>
                        {isActive && <span className="mr-auto text-[10px]">●</span>}
                      </button>
                    );
                  })}

                  {/* Dedicated Mobile Session Profile & Logout */}
                  {onLogout && (
                    <div className={`mt-3 pt-3 border-t ${darkMode ? "border-slate-800" : "border-slate-100"}`}>
                      <div className="flex items-center gap-2 px-3 py-1.5 mb-2">
                        <div className="w-7 h-7 rounded-full bg-[#C5A059]/20 text-[#C5A059] border border-[#C5A059]/30 flex items-center justify-center font-bold text-xs">
                          {currentUser.name[0] || "م"}
                        </div>
                        <div className="overflow-hidden flex-1 text-right">
                          <h4 className={`text-[10px] font-bold truncate ${darkMode ? "text-slate-200" : "text-slate-800"}`} title={currentUser.name}>
                            {currentUser.name}
                          </h4>
                          <p className={`text-[8px] truncate ${darkMode ? "text-slate-400" : "text-slate-500"}`}>{currentUser.email}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setIsOpen(false);
                          onLogout();
                        }}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all text-center cursor-pointer bg-rose-500 hover:bg-rose-600 text-white shadow-md shadow-rose-500/10"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>تسجيل الخروج من الحساب</span>
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Left side: Quick Switcher & Dark Mode Toggle */}
        <div className="flex items-center gap-1.5">
          {/* Quick Role Switcher Button */}
          <div className="relative" ref={switcherRef}>
            <button
              id="mobile-role-switcher-trigger"
              onClick={() => setIsSwitcherOpen(!isSwitcherOpen)}
              className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                darkMode 
                  ? "bg-[#1E293B] border-slate-800 text-[#C5A059] hover:bg-slate-800" 
                  : "bg-slate-100 border-slate-200 text-[#C5A059] hover:bg-slate-200"
              }`}
              title="تغيير المحامي"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
            </button>

            {/* Quick Switcher Dropdown */}
            <AnimatePresence>
              {isSwitcherOpen && (
                <motion.div
                  id="mobile-role-switcher-menu"
                  initial={{ opacity: 0, y: -5, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -5, scale: 0.95 }}
                  transition={{ duration: 0.12 }}
                  className={`absolute left-0 mt-2 w-48 rounded-xl shadow-xl border p-2 z-50 ${
                    darkMode 
                      ? "bg-[#0D1B2A] border-slate-800 text-white" 
                      : "bg-white border-slate-200 text-[#1E293B]"
                  }`}
                >
                  <div className={`px-2 py-1 text-[9px] font-bold border-b mb-1 ${
                    darkMode ? "text-slate-500 border-slate-800" : "text-slate-400 border-slate-100"
                  }`}>
                    تبديل مستخدم النظام:
                  </div>
                  <div className="space-y-0.5">
                    {usersList
                      .filter((usr) => 
                        (currentUser.isSuperUser || currentUser.role === UserRole.SuperAdmin)
                          ? true 
                          : (!usr.isSuperUser && usr.id !== "usr-super" && usr.role !== UserRole.SuperAdmin)
                      )
                      .map((usr) => (
                        <button
                        key={usr.id}
                        onClick={() => {
                          onSwitchUser(usr.id);
                          setIsSwitcherOpen(false);
                        }}
                        className={`w-full text-right px-2 py-1.5 rounded-lg text-[10px] font-medium transition-colors flex flex-col ${
                          currentUser.id === usr.id
                            ? "bg-[#C5A059]/15 text-[#C5A059]"
                            : darkMode
                              ? "text-slate-300 hover:bg-slate-800"
                              : "text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        <span className="font-bold">{usr.name}</span>
                        <span className="text-[8px] text-slate-400 font-mono">{usr.role}</span>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Tutorial Video Modal Button */}
          {onOpenTutorial && (
            <button
              onClick={onOpenTutorial}
              title="شرح استخدام المنصة"
              className={`p-1.5 rounded-lg border transition-all cursor-pointer flex items-center justify-center ${
                darkMode 
                  ? "bg-[#C5A059]/15 border-[#C5A059]/30 text-[#C5A059] hover:bg-[#C5A059]/30" 
                  : "bg-[#C5A059]/10 border-[#C5A059]/20 text-[#C5A059] hover:bg-[#C5A059]/20"
              }`}
            >
              <PlayCircle className="w-5 h-5" />
            </button>
          )}

          {/* Entrance Notification Bell Button */}
          {onOpenNotificationModal && (
            <button
              id="mobile-notification-bell-trigger"
              onClick={onOpenNotificationModal}
              className={`relative p-1.5 rounded-lg border transition-all cursor-pointer ${
                darkMode 
                  ? "bg-[#1E293B] border-slate-800 text-[#C5A059] hover:bg-slate-800" 
                  : "bg-slate-100 border-slate-200 text-[#C5A059] hover:bg-slate-200"
              }`}
              title="إشعارات دخول وسجل الزوار"
            >
              <Bell className="w-3.5 h-3.5 text-[#C5A059]" />
              {unreadNotificationCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[8px] font-black flex items-center justify-center border border-[#0D1B2A]">
                  {unreadNotificationCount > 9 ? "+9" : unreadNotificationCount}
                </span>
              )}
            </button>
          )}

          {/* Theme Toggle */}
          <button
            id="mobile-theme-toggle"
            onClick={() => setDarkMode(!darkMode)}
            className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
              darkMode 
                ? "bg-[#1E293B] border-slate-800 text-[#C5A059]" 
                : "bg-slate-100 border-slate-200 text-[#C5A059]"
            }`}
          >
            {darkMode ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
          </button>

          {/* Logout Button */}
          {onLogout && (
            <button
              onClick={onLogout}
              className="px-2 py-1.5 sm:px-2.5 rounded-lg border border-rose-500/30 bg-rose-500 text-white hover:bg-rose-600 transition-all cursor-pointer flex items-center gap-1 font-bold text-[10px] shadow-sm shadow-rose-500/20 shrink-0"
              title="تسجيل الخروج من الحساب"
            >
              <LogOut className="w-3 h-3" />
              <span className="hidden sm:inline">خروج</span>
            </button>
          )}
        </div>

      </div>
    </header>
  );
}
