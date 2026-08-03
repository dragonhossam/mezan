import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Building2, Users, Briefcase, ChevronLeft, CheckCircle2, ArrowRight } from "lucide-react";

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
  onNavigateTo: (tab: string) => void;
  darkMode: boolean;
}

export default function OnboardingModal({ isOpen, onClose, onComplete, onNavigateTo, darkMode }: OnboardingModalProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      id: "welcome",
      title: "أهلاً بك في ميزان",
      description: "نظامك المتكامل لإدارة مكتب المحاماة بفاعلية. دعنا نساعدك في إعداد مكتبك في 3 خطوات بسيطة.",
      icon: <Building2 className="w-12 h-12 text-[#C5A059]" />,
      action: "ابدأ الإعداد الآن",
      actionIcon: <ArrowRight className="w-4 h-4 ml-2" />,
      onClick: () => setCurrentStep(1)
    },
    {
      id: "office",
      title: "1. إعداد بيانات المكتب",
      description: "قم بضبط إعدادات مكتبك، إضافة الشعار، وتفاصيل التواصل لتظهر في تقاريرك ومستنداتك.",
      icon: <Building2 className="w-12 h-12 text-blue-400" />,
      action: "الذهاب للإعدادات",
      actionIcon: <ChevronLeft className="w-4 h-4" />,
      onClick: () => {
        onNavigateTo("settings");
        setCurrentStep(2);
      }
    },
    {
      id: "client",
      title: "2. إضافة أول موكل",
      description: "سجل بيانات أول موكل لك لبدء بناء قاعدة عملائك وتنظيم وسائل التواصل معهم.",
      icon: <Users className="w-12 h-12 text-emerald-400" />,
      action: "إضافة موكل",
      actionIcon: <ChevronLeft className="w-4 h-4" />,
      onClick: () => {
        onNavigateTo("clients");
        setCurrentStep(3);
      }
    },
    {
      id: "case",
      title: "3. إضافة أول قضية",
      description: "الآن يمكنك ربط الموكل بأول قضية أو استشارة، ومتابعة جلساتها ومهامها بسهولة.",
      icon: <Briefcase className="w-12 h-12 text-purple-400" />,
      action: "إضافة قضية",
      actionIcon: <ChevronLeft className="w-4 h-4" />,
      onClick: () => {
        onNavigateTo("cases");
        setCurrentStep(4);
      }
    },
    {
      id: "done",
      title: "أنت جاهز للعمل!",
      description: "تم إعداد مساحة عملك بنجاح. يمكنك الآن استكشاف باقي ميزات النظام مثل المهام والجلسات والتقارير.",
      icon: <CheckCircle2 className="w-12 h-12 text-emerald-500" />,
      action: "ابدأ العمل",
      actionIcon: <CheckCircle2 className="w-4 h-4 ml-2" />,
      onClick: () => {
        onComplete();
      }
    }
  ];

  const step = steps[currentStep];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 sm:p-6" dir="rtl">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={currentStep === 4 ? onComplete : undefined}
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className={`relative w-full max-w-lg rounded-3xl border overflow-hidden shadow-2xl flex flex-col ${
              darkMode ? "bg-[#0D1B2A] border-slate-800" : "bg-white border-slate-200"
            }`}
          >
            {/* Header */}
            <div className={`p-5 border-b ${darkMode ? "border-slate-800" : "border-slate-200"} flex items-center justify-between`}>
              <div className="flex gap-2">
                {steps.map((s, idx) => (
                  <div 
                    key={s.id} 
                    className={`h-2 rounded-full transition-all duration-500 ${
                      idx === currentStep 
                        ? "w-8 bg-[#C5A059]" 
                        : idx < currentStep 
                          ? "w-4 bg-emerald-500" 
                          : darkMode ? "w-4 bg-slate-800" : "w-4 bg-slate-200"
                    }`} 
                  />
                ))}
              </div>
              <button
                onClick={onComplete}
                className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${
                  darkMode ? "text-slate-400 hover:bg-slate-800" : "text-slate-500 hover:bg-slate-100"
                }`}
              >
                تخطي
              </button>
            </div>

            {/* Content */}
            <div className="p-8 flex flex-col items-center text-center">
              <motion.div
                key={step.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col items-center"
              >
                <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-6 shadow-xl ${
                  darkMode ? "bg-slate-900 border border-slate-800" : "bg-slate-50 border border-slate-100"
                }`}>
                  {step.icon}
                </div>
                <h3 className={`text-2xl font-black mb-3 ${darkMode ? "text-white" : "text-slate-900"}`}>
                  {step.title}
                </h3>
                <p className={`text-sm leading-relaxed mb-8 max-w-sm ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                  {step.description}
                </p>
                <button
                  onClick={step.onClick}
                  className="px-8 py-3 rounded-xl bg-[#C5A059] hover:bg-[#d6b36d] text-slate-950 font-bold transition-all shadow-lg shadow-[#C5A059]/20 flex items-center gap-2"
                >
                  {step.actionIcon && currentStep === 0 && step.actionIcon}
                  <span>{step.action}</span>
                  {step.actionIcon && currentStep > 0 && currentStep < 4 && step.actionIcon}
                  {step.actionIcon && currentStep === 4 && step.actionIcon}
                </button>
              </motion.div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
