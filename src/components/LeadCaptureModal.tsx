import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Send, User, Phone, Sparkles } from "lucide-react";
import { Lead } from "../types";

interface LeadCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (lead: Omit<Lead, "id" | "createdAt" | "status">) => void;
  darkMode?: boolean;
}

export default function LeadCaptureModal({
  isOpen,
  onClose,
  onSubmit,
  darkMode = true
}: LeadCaptureModalProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setName("");
      setPhone("");
      setIsSubmitted(false);
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;

    onSubmit({ name, phone });
    setIsSubmitted(true);
    
    // Close after a short delay
    setTimeout(() => {
      onClose();
    }, 2500);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6" dir="rtl">
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
            className={`relative w-full max-w-md rounded-3xl border overflow-hidden shadow-2xl ${
              darkMode ? "bg-[#0D1B2A] border-slate-800" : "bg-white border-slate-200"
            }`}
          >
            {/* Header */}
            <div className={`p-5 border-b ${darkMode ? "border-slate-800" : "border-slate-200"} flex items-center justify-between`}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#C5A059]/20 flex items-center justify-center text-[#C5A059]">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className={`font-black ${darkMode ? "text-slate-100" : "text-slate-900"}`}>
                    طلب استشارة أو تواصل
                  </h3>
                  <p className={`text-[10px] mt-1 ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                    اترك بياناتك وسيقوم فريقنا بالتواصل معك في أقرب وقت
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

            {/* Form Content */}
            <div className="p-5">
              {isSubmitted ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4">
                    <Send className="w-8 h-8" />
                  </div>
                  <h4 className={`text-lg font-bold mb-2 ${darkMode ? "text-white" : "text-slate-900"}`}>
                    شكراً لك!
                  </h4>
                  <p className={`text-sm ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                    تم تسجيل بياناتك بنجاح، سنتواصل معك قريباً.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className={`block text-xs font-bold mb-1.5 ${darkMode ? "text-slate-300" : "text-slate-700"}`}>
                      الاسم الكريم
                    </label>
                    <div className="relative">
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                        <User className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="أدخل اسمك"
                        className={`w-full pr-10 pl-4 py-2.5 rounded-xl text-sm border focus:ring-2 focus:ring-[#C5A059] focus:border-transparent transition-all outline-none ${
                          darkMode 
                            ? "bg-slate-900/50 border-slate-700 text-white placeholder-slate-500" 
                            : "bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400"
                        }`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className={`block text-xs font-bold mb-1.5 ${darkMode ? "text-slate-300" : "text-slate-700"}`}>
                      رقم الجوال
                    </label>
                    <div className="relative">
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                        <Phone className="w-4 h-4" />
                      </div>
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="أدخل رقم جوالك"
                        className={`w-full pr-10 pl-4 py-2.5 rounded-xl text-sm border focus:ring-2 focus:ring-[#C5A059] focus:border-transparent transition-all outline-none ${
                          darkMode 
                            ? "bg-slate-900/50 border-slate-700 text-white placeholder-slate-500" 
                            : "bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400"
                        }`}
                        dir="ltr"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full mt-6 bg-[#C5A059] hover:bg-[#d6b36d] text-slate-950 font-bold py-3 rounded-xl transition-all shadow-lg shadow-[#C5A059]/20 flex items-center justify-center gap-2"
                  >
                    <span>إرسال البيانات</span>
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
