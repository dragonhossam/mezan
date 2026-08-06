/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Bell, X, ShieldAlert, UserCheck, ExternalLink, Globe, MapPin } from "lucide-react";
import { EntranceNotification } from "../types";

interface EntranceToastProps {
  notification: EntranceNotification | null;
  onClose: () => void;
  onOpenModal: () => void;
  darkMode?: boolean;
}

export default function EntranceToast({
  notification,
  onClose,
  onOpenModal,
  darkMode = true
}: EntranceToastProps) {
  if (!notification) return null;

  const isSuper = notification.userName.includes("Super") || notification.userRole.includes("مدير المنصة");

  return (
    <AnimatePresence>
      <motion.div
        key={notification.id}
        initial={{ opacity: 0, y: -60, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -40, scale: 0.95 }}
        transition={{ type: "spring", stiffness: 350, damping: 25 }}
        className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-lg px-4 pointer-events-auto"
        dir="rtl"
      >
        <div className={`p-4 rounded-2xl shadow-2xl border flex items-center gap-3 relative overflow-hidden backdrop-blur-xl ${
          darkMode 
            ? "bg-[#0D1B2A]/95 border-[#C5A059]/40 text-white shadow-black/80" 
            : "bg-white/95 border-[#C5A059]/50 text-slate-900 shadow-slate-400/50"
        }`}>
          {/* Top accent gradient bar */}
          <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-emerald-500 via-[#C5A059] to-amber-500" />

          {/* Icon Badge */}
          <div className="relative shrink-0">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-lg shadow-md ${
              isSuper
                ? "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
            }`}>
              {isSuper ? <ShieldAlert className="w-6 h-6 animate-pulse text-amber-400" /> : <UserCheck className="w-6 h-6 text-emerald-400" />}
            </div>
            {/* Pulsing indicator dot */}
            <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-[#0D1B2A]"></span>
            </span>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 pr-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#C5A059]/20 text-[#C5A059] border border-[#C5A059]/30 flex items-center gap-1">
                <Bell className="w-3 h-3 text-[#C5A059]" />
                إشعار دخول للموقع
              </span>
              <span className="text-[10px] text-slate-400 font-mono mr-auto flex items-center gap-1">
                <Globe className="w-2.5 h-2.5" />
                {notification.timestamp.split(" - ")[0] || "الآن"}
              </span>
            </div>

            <h4 className="text-sm font-bold mt-1 text-right truncate">
              {notification.userName}
            </h4>

            <p className="text-xs text-slate-300 mt-0.5 text-right flex items-center gap-1.5 truncate">
              <span>قام بالدخول للنظام الآن</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-amber-300 font-mono border border-slate-700">
                ({notification.userRole})
              </span>
            </p>

            {notification.location && (
              <p className="text-[10px] text-amber-300/90 font-medium mt-0.5 text-right flex items-center gap-1 truncate">
                <MapPin className="w-3 h-3 text-amber-400 shrink-0" />
                <span>الموقع: <strong>{notification.location}</strong></span>
              </p>
            )}

            {notification.ipAddress && (
              <p className="text-[10px] text-slate-400 mt-0.5 font-mono text-right truncate">
                🌐 العنوان الرقمي: {notification.ipAddress} {notification.deviceInfo ? `• ${notification.deviceInfo}` : ""}
              </p>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex flex-col gap-1.5 shrink-0 pr-1">
            <button
              onClick={() => {
                onClose();
                onOpenModal();
              }}
              className="p-1.5 rounded-lg bg-[#C5A059] hover:bg-[#b08d49] text-slate-950 text-[11px] font-bold flex items-center gap-1 transition-all shadow-md cursor-pointer"
              title="عرض سجل الدخول الكامل"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>السجل</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-all flex items-center justify-center cursor-pointer"
              title="إغلاق التنبيه"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
