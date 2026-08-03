import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, PlayCircle, Video, Info } from "lucide-react";

interface TutorialVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  darkMode?: boolean;
}

export default function TutorialVideoModal({
  isOpen,
  onClose,
  darkMode = true
}: TutorialVideoModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6" dir="rtl">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className={`relative w-full max-w-4xl rounded-3xl border overflow-hidden shadow-2xl ${
              darkMode ? "bg-[#0D1B2A] border-slate-800" : "bg-white border-slate-200"
            }`}
          >
            {/* Header */}
            <div className={`p-4 sm:p-6 border-b ${darkMode ? "border-slate-800" : "border-slate-200"} flex items-center justify-between`}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#C5A059]/20 flex items-center justify-center text-[#C5A059]">
                  <Video className="w-5 h-5" />
                </div>
                <div>
                  <h3 className={`text-sm sm:text-base font-black ${darkMode ? "text-slate-100" : "text-slate-900"}`}>
                    الدليل المرئي لاستخدام منصة ميزان
                  </h3>
                  <p className={`text-[10px] sm:text-xs mt-1 ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                    تعرف على كيفية إدارة مكتبك وقضاياك بسهولة من خلال هذا الشرح التفصيلي
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className={`p-2 rounded-xl transition-colors ${
                  darkMode ? "hover:bg-slate-800 text-slate-400" : "hover:bg-slate-100 text-slate-500"
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Video Container */}
            <div className="relative w-full aspect-video bg-black flex items-center justify-center group overflow-hidden">
              {/* Simulated Video Player */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent z-10" />
              
              <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
                <div className="w-20 h-20 rounded-full bg-[#C5A059]/90 flex items-center justify-center text-slate-950 cursor-pointer hover:bg-[#C5A059] hover:scale-110 transition-all shadow-xl shadow-[#C5A059]/20 group-hover:shadow-[#C5A059]/40 mb-4">
                  <PlayCircle className="w-10 h-10" />
                </div>
                <span className="text-white font-bold text-sm bg-black/50 px-4 py-1.5 rounded-full backdrop-blur-md">
                  تشغيل الفيديو التعليمي (12:45)
                </span>
              </div>

              {/* Decorative elements representing the UI in the video */}
              <div className="absolute inset-0 opacity-30 pointer-events-none scale-105 blur-sm" style={{
                backgroundImage: 'linear-gradient(to right, #0A121D, #112236, #0D1B2A)'
              }}>
                <div className="absolute top-1/4 left-1/4 w-32 h-20 bg-slate-800 rounded-lg border border-slate-700" />
                <div className="absolute top-1/3 right-1/4 w-48 h-32 bg-slate-800 rounded-lg border border-slate-700" />
                <div className="absolute bottom-1/4 left-1/3 w-64 h-12 bg-slate-800 rounded-lg border border-slate-700" />
              </div>
              
              {/* Video Player Controls (Mock) */}
              <div className="absolute bottom-0 left-0 right-0 p-4 z-20 flex items-center gap-4 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden cursor-pointer">
                  <div className="w-0 h-full bg-[#C5A059]" />
                </div>
                <span className="text-xs font-mono shrink-0">00:00 / 12:45</span>
              </div>
            </div>

            {/* Timestamps / Chapters */}
            <div className={`p-4 sm:p-6 ${darkMode ? "bg-slate-900/50" : "bg-slate-50"}`}>
              <h4 className={`text-xs font-bold mb-4 flex items-center gap-2 ${darkMode ? "text-slate-300" : "text-slate-700"}`}>
                <Info className="w-4 h-4 text-[#C5A059]" />
                فصول الشرح:
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  { time: "00:00", title: "مقدمة ونظرة عامة على لوحة القيادة" },
                  { time: "02:15", title: "كيفية إضافة موكل جديد" },
                  { time: "04:30", title: "تسجيل القضايا وتعيين المحكمة" },
                  { time: "06:45", title: "متابعة الجلسات وإضافة التطورات" },
                  { time: "09:00", title: "إدارة المصروفات وأتعاب المكتب" },
                  { time: "11:20", title: "إدارة فريق العمل والصلاحيات" },
                ].map((chapter, idx) => (
                  <div 
                    key={idx}
                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                      darkMode 
                        ? "bg-slate-900 border-slate-800 hover:border-[#C5A059]/50 hover:bg-[#C5A059]/5" 
                        : "bg-white border-slate-200 hover:border-[#C5A059]/50 hover:bg-[#C5A059]/5"
                    }`}
                  >
                    <span className={`text-xs font-mono font-bold px-2 py-1 rounded-md ${
                      darkMode ? "bg-slate-800 text-slate-300" : "bg-slate-100 text-slate-600"
                    }`}>
                      {chapter.time}
                    </span>
                    <span className={`text-[11px] font-semibold truncate ${darkMode ? "text-slate-300" : "text-slate-700"}`}>
                      {chapter.title}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
