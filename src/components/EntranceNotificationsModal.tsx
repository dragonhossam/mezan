/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Bell, 
  X, 
  CheckCheck, 
  Trash2, 
  UserCheck, 
  ShieldAlert, 
  Globe, 
  Search, 
  PlusCircle, 
  Sparkles,
  Smartphone,
  Monitor,
  Clock,
  Filter,
  MapPin,
  Navigation,
  Compass
} from "lucide-react";
import { EntranceNotification, UserRole } from "../types";

interface EntranceNotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: EntranceNotification[];
  onMarkAllAsRead: () => void;
  onClearAll: () => void;
  onSimulateEntrance: (
    customName?: string, 
    customRole?: string, 
    type?: "simulation" | "ad_visitor",
    customEmail?: string
  ) => void;
  darkMode?: boolean;
}

export default function EntranceNotificationsModal({
  isOpen,
  onClose,
  notifications,
  onMarkAllAsRead,
  onClearAll,
  onSimulateEntrance,
  darkMode = true
}: EntranceNotificationsModalProps) {
  const [filterTab, setFilterTab] = useState<"all" | "unread" | "login" | "simulation" | "ad_visitor">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [simName, setSimName] = useState("");
  const [simRole, setSimRole] = useState<string>(UserRole.Lawyer);
  const [simType, setSimType] = useState<"simulation" | "ad_visitor" >("simulation");
  const [simSource, setSimSource] = useState<"google_ads" | "facebook_ads" | "instagram_ads">("google_ads");
  const [simCampaign, setSimCampaign] = useState("حملة_الاستشارات_القانونية_المدفوعة");
  const [showSimForm, setShowSimForm] = useState(false);

  if (!isOpen) return null;

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const filteredNotifications = notifications.filter(n => {
    // Tab filter
    if (filterTab === "unread" && n.isRead) return false;
    if (filterTab === "login" && n.type !== "login" && n.type !== "logout") return false;
    if (filterTab === "simulation" && n.type !== "simulation") return false;
    if (filterTab === "ad_visitor" && n.type !== "ad_visitor") return false;

    // Search query
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchName = n.userName.toLowerCase().includes(q);
      const matchRole = String(n.userRole).toLowerCase().includes(q);
      const matchIp = n.ipAddress?.toLowerCase().includes(q);
      const matchLoc = n.location?.toLowerCase().includes(q);
      return matchName || matchRole || matchIp || matchLoc;
    }
    return true;
  });

  const handleSimulateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (simType === "ad_visitor") {
      const visitorName = simName.trim() || `زائر إعلانات #${Math.floor(Math.random() * 9000 + 1000)}`;
      const visitorRole = "زائر إعلانات / غير مسجل";
      const visitorEmail = `utm_source=${simSource}&utm_campaign=${simCampaign}`;
      onSimulateEntrance(visitorName, visitorRole, "ad_visitor", visitorEmail);
    } else {
      onSimulateEntrance(simName.trim() || undefined, simRole, "simulation");
    }
    setSimName("");
    setShowSimForm(false);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md" dir="rtl">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className={`w-full max-w-3xl rounded-3xl border shadow-2xl overflow-hidden flex flex-col max-h-[85vh] ${
            darkMode 
              ? "bg-[#0D1B2A] border-slate-800 text-white" 
              : "bg-white border-slate-200 text-slate-900"
          }`}
        >
          {/* Header */}
          <div className="p-5 border-b border-slate-800/80 bg-slate-900/40 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#C5A059]/20 text-[#C5A059] border border-[#C5A059]/30 flex items-center justify-center font-bold relative">
                <Bell className="w-5 h-5 text-[#C5A059]" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center border-2 border-[#0D1B2A]">
                    {unreadCount}
                  </span>
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white font-sans">
                    سجل وإشعارات دخول الموقع والزوار
                  </h3>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                    تنبيهات فورية 🟢
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  رصد مباشر ولحظي لجميع عمليات تسجيل الدخول وزيارات الأعضاء والمسؤولين للموقع.
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Action Toolbar */}
          <div className="p-4 border-b border-slate-800/60 bg-slate-950/30 flex flex-wrap items-center justify-between gap-3">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
              <input
                type="text"
                placeholder="بحث باسم المستخدم، الصفة، أو IP..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pr-9 pl-3 py-1.5 text-xs rounded-xl border focus:outline-none focus:border-[#C5A059] ${
                  darkMode ? "bg-slate-900/80 border-slate-700 text-white" : "bg-slate-100 border-slate-300 text-slate-900"
                }`}
              />
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowSimForm(!showSimForm)}
                className="px-3 py-1.5 rounded-xl bg-[#C5A059] hover:bg-[#b08d49] text-white text-xs font-bold flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>إضافة سجل زيارة تجريبية</span>
              </button>

              {unreadCount > 0 && (
                <button
                  onClick={onMarkAllAsRead}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer border border-slate-700"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>تحديد الكل كمقروء</span>
                </button>
              )}

              {notifications.length > 0 && (
                <button
                  onClick={onClearAll}
                  className="px-2.5 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer border border-rose-500/20"
                  title="مسح كافة الإشعارات"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>مسح السجل</span>
                </button>
              )}
            </div>
          </div>

          {/* Test/Simulate Entrance Inline Form */}
          {showSimForm && (
            <motion.form
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              onSubmit={handleSimulateSubmit}
              className="p-4 bg-slate-900/90 border-b border-slate-800 flex flex-col gap-3"
            >
              <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-2">
                <div className="text-xs font-bold text-[#C5A059] flex items-center gap-1.5">
                  <PlusCircle className="w-4 h-4" />
                  <span>توليد إشعار زيارة تجريبية مبرمج للسيستم:</span>
                </div>
                
                {/* Switch between Sim Type */}
                <div className="flex bg-slate-950 p-0.5 rounded-lg border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setSimType("simulation")}
                    className={`px-2 py-1 text-[10px] rounded-md transition-all font-semibold cursor-pointer ${
                      simType === "simulation"
                        ? "bg-[#C5A059] text-white"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    دخول عضو / موكل
                  </button>
                  <button
                    type="button"
                    onClick={() => setSimType("ad_visitor")}
                    className={`px-2 py-1 text-[10px] rounded-md transition-all font-semibold flex items-center gap-1 cursor-pointer ${
                      simType === "ad_visitor"
                        ? "bg-purple-600 text-white"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    <Compass className="w-2.5 h-2.5" />
                    نقرة إعلان ممول
                  </button>
                </div>
              </div>

              {simType === "simulation" ? (
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex-1 min-w-[200px]">
                    <label className="block text-[10px] text-slate-400 mb-1">اسم العضو أو الزائر:</label>
                    <input
                      type="text"
                      placeholder="مثال: أ. محمود السعدني"
                      value={simName}
                      onChange={(e) => setSimName(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-700 bg-slate-950 text-white focus:outline-none focus:border-[#C5A059]"
                    />
                  </div>

                  <div className="min-w-[150px]">
                    <label className="block text-[10px] text-slate-400 mb-1">الصفة أو المسمى الوظيفي:</label>
                    <select
                      value={simRole}
                      onChange={(e) => setSimRole(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-700 bg-slate-950 text-white focus:outline-none focus:border-[#C5A059]"
                    >
                      <option value={UserRole.Owner}>صاحب المكتب</option>
                      <option value={UserRole.Lawyer}>محامي ممارس</option>
                      <option value={UserRole.SuperAdmin}>مدير المنصة والاشتراكات</option>
                      <option value={UserRole.Secretary}>سكرتارية</option>
                      <option value={UserRole.Accountant}>محاسب</option>
                      <option value="موكل جديد">موكل / زائر خارجي</option>
                    </select>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex-1 min-w-[160px]">
                    <label className="block text-[10px] text-slate-400 mb-1">اسم الزائر (اختياري):</label>
                    <input
                      type="text"
                      placeholder="زائر مجهول / رقم عشوائي تلقائي"
                      value={simName}
                      onChange={(e) => setSimName(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-700 bg-slate-950 text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div className="w-[140px]">
                    <label className="block text-[10px] text-slate-400 mb-1">قناة الإعلان (Source):</label>
                    <select
                      value={simSource}
                      onChange={(e) => setSimSource(e.target.value as any)}
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-700 bg-slate-950 text-white focus:outline-none focus:border-purple-500"
                    >
                      <option value="google_ads">🎯 إعلانات جوجل (Google Ads)</option>
                      <option value="facebook_ads">📱 إعلانات فيسبوك (Facebook)</option>
                      <option value="instagram_ads">📸 إعلانات إنستغرام (Instagram)</option>
                    </select>
                  </div>

                  <div className="flex-1 min-w-[180px]">
                    <label className="block text-[10px] text-slate-400 mb-1">اسم الحملة الإعلانية (UTM Campaign):</label>
                    <input
                      type="text"
                      placeholder="مثال: حملة_الاستشارات_المدفوعة"
                      value={simCampaign}
                      onChange={(e) => setSimCampaign(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-700 bg-slate-950 text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end mt-1 border-t border-slate-800 pt-2">
                <button
                  type="submit"
                  className={`px-4 py-1.5 rounded-xl text-white text-xs font-bold cursor-pointer transition-all shadow-md ${
                    simType === "ad_visitor"
                      ? "bg-purple-600 hover:bg-purple-500 shadow-purple-900/20"
                      : "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-950/20"
                  }`}
                >
                  {simType === "ad_visitor" ? "بث نقرة الإعلان الممولة 🎯" : "بث إشعار الدخول الآن 🔔"}
                </button>
              </div>
            </motion.form>
          )}

          {/* Tabs Filter */}
          <div className="px-5 py-2.5 border-b border-slate-800/40 bg-slate-900/20 flex items-center gap-2 overflow-x-auto text-xs">
            <span className="text-slate-500 font-bold flex items-center gap-1 ml-2">
              <Filter className="w-3.5 h-3.5" />
              تصفية:
            </span>

            <button
              onClick={() => setFilterTab("all")}
              className={`px-3 py-1 rounded-xl transition-all cursor-pointer ${
                filterTab === "all"
                  ? "bg-[#C5A059] text-white font-bold"
                  : "bg-slate-800/60 text-slate-400 hover:bg-slate-800"
              }`}
            >
              الكل ({notifications.length})
            </button>

            <button
              onClick={() => setFilterTab("unread")}
              className={`px-3 py-1 rounded-xl transition-all cursor-pointer ${
                filterTab === "unread"
                  ? "bg-rose-500 text-white font-bold"
                  : "bg-slate-800/60 text-slate-400 hover:bg-slate-800"
              }`}
            >
              غير مقروء ({unreadCount})
            </button>

            <button
              onClick={() => setFilterTab("login")}
              className={`px-3 py-1 rounded-xl transition-all cursor-pointer ${
                filterTab === "login"
                  ? "bg-emerald-600 text-white font-bold"
                  : "bg-slate-800/60 text-slate-400 hover:bg-slate-800"
              }`}
            >
              تسجيلات الدخول والانصراف
            </button>

            <button
              onClick={() => setFilterTab("simulation")}
              className={`px-3 py-1 rounded-xl transition-all cursor-pointer ${
                filterTab === "simulation"
                  ? "bg-amber-600 text-white font-bold"
                  : "bg-slate-800/60 text-slate-400 hover:bg-slate-800"
              }`}
            >
              الزيارات الميدانية والتجريبية
            </button>
            
            <button
              onClick={() => setFilterTab("ad_visitor")}
              className={`px-3 py-1 rounded-xl transition-all cursor-pointer flex items-center gap-1 ${
                filterTab === "ad_visitor"
                  ? "bg-purple-600 text-white font-bold"
                  : "bg-slate-800/60 text-purple-300 hover:bg-slate-800"
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              زوار الإعلانات ({notifications.filter(n => n.type === "ad_visitor").length})
            </button>
          </div>

          {/* Notification Items List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
            {filteredNotifications.length === 0 ? (
              <div className="text-center py-16 text-slate-500 space-y-3">
                <Bell className="w-12 h-12 mx-auto text-slate-600 stroke-1" />
                <p className="text-sm font-medium">لا توجد إشعارات دخول في هذه القائمة حالياً.</p>
                <button
                  onClick={() => onSimulateEntrance()}
                  className="px-4 py-2 rounded-xl bg-[#C5A059]/20 text-[#C5A059] border border-[#C5A059]/30 text-xs font-bold hover:bg-[#C5A059]/30 transition-all cursor-pointer"
                >
                  اضغط هنا لإرسال إشعار تجريبي 🔔
                </button>
              </div>
            ) : (
              filteredNotifications.map((notif) => {
                const isSuper = notif.userName.includes("Super") || String(notif.userRole).includes("مدير المنصة");
                return (
                  <div
                    key={notif.id}
                    className={`p-4 rounded-2xl border transition-all flex items-start justify-between gap-3 ${
                      !notif.isRead 
                        ? "bg-[#C5A059]/10 border-[#C5A059]/40 shadow-lg" 
                        : darkMode 
                          ? "bg-slate-900/60 border-slate-800 hover:border-slate-700" 
                          : "bg-slate-50 border-slate-200"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Avatar/Badge Icon */}
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold shrink-0 mt-0.5 ${
                        notif.type === "ad_visitor"
                          ? "bg-purple-500/20 text-purple-400 border border-purple-500/30 font-black text-lg"
                          : isSuper 
                            ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" 
                            : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      }`}>
                        {notif.type === "ad_visitor" ? "🎯" : isSuper ? <ShieldAlert className="w-5 h-5 text-amber-400" /> : <UserCheck className="w-5 h-5 text-emerald-400" />}
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-white">
                            {notif.userName}
                          </h4>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${
                            notif.type === "ad_visitor" 
                              ? "bg-purple-900/60 text-purple-300 border-purple-700/50" 
                              : "bg-slate-800 text-[#C5A059] border-slate-700"
                          }`}>
                            {notif.userRole}
                          </span>
                          {!notif.isRead && (
                            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" title="إشعار جديد" />
                          )}
                        </div>

                        <p className="text-xs text-slate-300 flex items-center gap-1.5">
                          <span>
                            {notif.type === "ad_visitor" 
                              ? "دخول جديد من الحملة الإعلانية" 
                              : notif.type === "logout"
                                ? "تسجيل خروج وانصراف آمن"
                                : "دخول جديد ووصول للمنصة"}
                          </span>
                          {notif.userEmail && (
                            <span className={`text-[10px] font-mono ${notif.type === "ad_visitor" ? "text-purple-400 bg-purple-900/40 px-1 rounded" : "text-slate-400"}`}>
                              ({notif.type === "ad_visitor" ? `UTM: ${notif.userEmail}` : notif.userEmail})
                            </span>
                          )}
                        </p>

                        <div className="flex flex-wrap items-center gap-3 text-[10px] text-slate-400 font-mono pt-1">
                          <span className="flex items-center gap-1 text-amber-400/90">
                            <Clock className="w-3 h-3" />
                            {notif.timestamp}
                          </span>

                          {notif.location && (
                            <span className="flex items-center gap-1 text-amber-300 font-sans font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                              <MapPin className="w-3 h-3 text-amber-400 shrink-0" />
                              <span>{notif.location}</span>
                              {notif.coordinates && (
                                <a
                                  href={`https://www.google.com/maps?q=${notif.coordinates.lat},${notif.coordinates.lng}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-[9px] underline text-[#C5A059] hover:text-white mr-1 flex items-center gap-0.5"
                                  title="فتح الخريطة بالتفصيل"
                                >
                                  <Navigation className="w-2.5 h-2.5" />
                                  <span>الخريطة</span>
                                </a>
                              )}
                            </span>
                          )}

                          {notif.ipAddress && (
                            <span className="flex items-center gap-1">
                              <Globe className="w-3 h-3 text-slate-500" />
                              IP: {notif.ipAddress}
                            </span>
                          )}

                          {notif.deviceInfo && (
                            <span className="flex items-center gap-1 text-slate-400">
                              {notif.deviceInfo.includes("هاتف") ? <Smartphone className="w-3 h-3 text-slate-400" /> : <Monitor className="w-3 h-3 text-slate-400" />}
                              {notif.deviceInfo}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md border shrink-0 ${
                      notif.type === "login" 
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                        : notif.type === "logout"
                          ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                          : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                    }`}>
                      {notif.type === "login" ? "تسجيل دخول" : notif.type === "logout" ? "تسجيل انصراف" : "زيارة موقع"}
                    </span>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-800/80 bg-slate-950/40 text-center text-xs text-slate-400 flex items-center justify-between">
            <span>إجمالي حركة الدخول المسجلة: <strong className="text-white">{notifications.length}</strong> عملية</span>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition-colors cursor-pointer"
            >
              إغلاق النافذة
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
