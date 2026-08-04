/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  Crown, 
  Check, 
  HelpCircle, 
  CreditCard, 
  Smartphone, 
  QrCode, 
  ShieldCheck, 
  Lock, 
  Info, 
  FileText, 
  Download, 
  Calendar, 
  Coins, 
  RefreshCw, 
  AlertCircle,
  Clock,
  ArrowRight,
  Sparkles,
  PhoneCall,
  CheckCircle2,
  X,
  Upload,
  MessageSquare
} from "lucide-react";
import { UserSubscription, SubscriptionPlanId, SubscriptionInvoice, User } from "../types";

interface SubscriptionViewProps {
  currentUser: User;
  subscription: UserSubscription;
  onUpdateSubscription: (sub: UserSubscription) => void;
  invoices: SubscriptionInvoice[];
  onAddInvoice: (invoice: SubscriptionInvoice) => void;
  darkMode: boolean;
  officeName: string;
}

export default function SubscriptionView({
  currentUser,
  subscription,
  onUpdateSubscription,
  invoices,
  onAddInvoice,
  darkMode,
  officeName
}: SubscriptionViewProps) {
  // UI states
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlanId>("pro");
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [showCheckout, setShowCheckout] = useState<boolean>(false);
  const [paymentMethod, setPaymentMethod] = useState<"card" | "vodafone" | "instapay">("card");
  
  // State indicator for tracking gateway processing & polling
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // Quick sandbox helper to generate initial mock invoices if list is empty
  useEffect(() => {
    if (invoices.length === 0 && subscription.status === "active") {
      const initialInvoice: SubscriptionInvoice = {
        id: `INV-${Math.floor(100000 + Math.random() * 900000)}`,
        date: new Date().toISOString().split("T")[0],
        planName: subscription.planId === "basic" ? "الباقة الأساسية" : subscription.planId === "pro" ? "الباقة الاحترافية" : "باقة النخبة",
        amount: subscription.amountPaid,
        currency: "ج.م",
        paymentMethod: subscription.paymentMethod === "card" ? "بطاقة ائتمان" : subscription.paymentMethod === "vodafone" ? "محفظة هاتف" : "إنستاباي",
        status: "paid"
      };
      onAddInvoice(initialInvoice);
    }
  }, [subscription.status]);

  // Pricing configuration in Egyptian Pounds (EGP)
  const plans = [
    {
      id: "basic" as SubscriptionPlanId,
      name: "باقة المحامي الفردي",
      description: "الحل الأمثل للمحامين المستقلين لإدارة مكتبهم الإلكتروني بذكاء وسهولة.",
      monthlyPrice: 150,
      yearlyPrice: 1500, // 2 months discount
      features: [
        "إدارة حتى 50 قضية نشطة",
        "تسجيل حتى 100 عميل (CRM)",
        "جدولة الجلسات والتقويم الذكي",
        "نظام كشف حساب الأتعاب والمصروفات",
        "تنبيهات المواعيد قبل 24 ساعة",
        "مستخدم نشط واحد للمنصة",
        "دعم فني عبر البريد والواتساب"
      ],
      color: "border-slate-300 dark:border-slate-800",
      accent: "bg-slate-500",
      badge: "الأساسية"
    },
    {
      id: "pro" as SubscriptionPlanId,
      name: "باقة المكتب المشترك",
      description: "الخيار الأكثر شعبية للشركاء والمكاتب المتوسطة للتنسيق والربط الإلكتروني.",
      monthlyPrice: 350,
      yearlyPrice: 3500, // 2 months discount
      features: [
        "قضايا نشطة بلا حدود",
        "عملاء وموكلين بلا حدود",
        "أرشيف سحابي للمستندات (5 جيجا)",
        "حتى 5 محامين وموظفين نشطين",
        "تقارير مالية وإحصائيات متكاملة",
        "تنبيهات مخصصة (7 أيام، 3 أيام، نفس اليوم)",
        "محرك بحث متطور بالرقم والنوع والدائرة",
        "دعم فني ذو أولوية"
      ],
      color: "border-[#C5A059] bg-[#C5A059]/5",
      accent: "bg-[#C5A059]",
      badge: "الأكثر طلباً",
      recommended: true
    },
    {
      id: "elite" as SubscriptionPlanId,
      name: "باقة النخبة والمؤسسات",
      description: "المستوى الرفيع لشركات المحاماة الكبرى التي تبحث عن أقصى درجات الأمان والتحكم.",
      monthlyPrice: 800,
      yearlyPrice: 8000, // 2 months discount
      features: [
        "جميع ميزات الباقة الاحترافية",
        "فريق عمل وموظفين بلا حدود",
        "أرشيف سحابي غير محدود للمستندات والمذكرات",
        "سجل رقابة أمان شامل (Audit Logs) لجميع الإجراءات",
        "تصدير واستيراد البيانات بصيغة Excel / PDF بضغطة زر",
        "ربط النماذج والصيغ القانونية الجاهزة",
        "مدير حساب شخصي مخصص ودعم طوال 24 ساعة",
        "نسخ احتياطي يومي آلي لقاعدة البيانات"
      ],
      color: "border-purple-500 bg-purple-500/5",
      accent: "bg-purple-600",
      badge: "النخبة"
    }
  ];

  const currentPlanObj = plans.find(p => p.id === subscription.planId);
  const activePrice = subscription.billingCycle === "monthly" 
    ? currentPlanObj?.monthlyPrice 
    : currentPlanObj?.yearlyPrice;

  // Manual WhatsApp Subscription State
  const [whatsappError, setWhatsappError] = useState<string | null>(null);

  const handleStartSubscribe = (planId: SubscriptionPlanId) => {
    setSelectedPlan(planId);
    setShowCheckout(true);
    setWhatsappError(null);
    setPaymentSuccess(false);
  };

  const handleSendWhatsAppRequest = async () => {
    setIsProcessing(true);
    setWhatsappError(null);

    try {
      const token = localStorage.getItem("meezan_token");
      const res = await fetch("/api/subscription/request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          planId: selectedPlan,
          billingCycle: billingCycle
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        // Update local React state with the "pending" subscription
        onUpdateSubscription(data.subscription);
        
        // Construct the WhatsApp custom message link
        const currentOfficeName = officeName || "مكتب المحاماة";
        const ownerName = currentUser.name;
        const ownerEmail = currentUser.email;
        const planName = plans.find(p => p.id === selectedPlan)?.name || "الباقة الاحترافية";
        const price = billingCycle === "monthly"
          ? plans.find(p => p.id === selectedPlan)?.monthlyPrice
          : plans.find(p => p.id === selectedPlan)?.yearlyPrice;
        const cycleText = billingCycle === "monthly" ? "شهرياً" : "سنوياً";
        
        const text = `مرحبًا، أريد الاشتراك في باقة [${planName}] (${price} ج.م ${cycleText}) لمكتب [${currentOfficeName}]. الاسم: [${ownerName}]، البريد الإلكتروني: [${ownerEmail}]`;
        const whatsappUrl = `https://wa.me/201091033943?text=${encodeURIComponent(text)}`;
        
        // Open WhatsApp in a new tab
        window.open(whatsappUrl, "_blank");
        setShowCheckout(false);
      } else {
        setWhatsappError(data.error || "عذراً، فشل تسجيل طلب الاشتراك على الخادم.");
      }
    } catch (err) {
      console.error("[SUBSCRIPTION REQ ERROR]", err);
      setWhatsappError("عذراً، لم نتمكن من الاتصال بالخادم لتسجيل الطلب. يرجى مراجعة الاتصال وإعادة المحاولة.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Manual status check for the user
  const handleCheckStatus = async () => {
    setIsProcessing(true);
    try {
      const token = localStorage.getItem("meezan_token");
      const res = await fetch("/api/subscription-status", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          onUpdateSubscription(data.subscription);
          if (data.subscription?.status === "active") {
            setPaymentSuccess(true);
          }
          // Sync invoices
          if (Array.isArray(data.invoices)) {
            data.invoices.forEach((inv: SubscriptionInvoice) => {
              if (!invoices.some(existing => existing.id === inv.id)) {
                onAddInvoice(inv);
              }
            });
          }
        }
      }
    } catch (err) {
      console.error("[STATUS CHECK ERROR]", err);
    } finally {
      setIsProcessing(false);
    }
  };


  // Sandbox simulation actions for review/QA
  const handleResetToTrial = () => {
    const freshTrial: UserSubscription = {
      planId: "pro",
      status: "trial",
      trialStartDate: new Date().toISOString().split("T")[0],
      trialEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      subscriptionStartDate: null,
      subscriptionEndDate: null,
      billingCycle: "monthly",
      paymentMethod: null,
      cardDetails: null,
      autoRenew: false,
      amountPaid: 0
    };
    onUpdateSubscription(freshTrial);
    alert("تم إعادة تفعيل الفترة التجريبية المجانية بنجاح (30 يوم متبقي).");
  };

  const handleSimulateExpiration = () => {
    const expiredSub: UserSubscription = {
      ...subscription,
      status: "expired",
      planId: "pro"
    };
    onUpdateSubscription(expiredSub);
    alert("تم اختبار تغيير حالة الاشتراك إلى منتهي الصلاحية. تم تفعيل نظام الحماية واقتصار الصلاحيات.");
  };

  const handleCancelSubscription = () => {
    const canceledSub: UserSubscription = {
      ...subscription,
      status: "inactive",
      autoRenew: false
    };
    onUpdateSubscription(canceledSub);
    alert("تم إلغاء التجديد التلقائي لباقتك بنجاح.");
  };

  // Mock Invoice download
  const handleDownloadInvoice = (inv: SubscriptionInvoice) => {
    alert(`تحميل الفاتورة رقم ${inv.id}\nالقيمة: ${inv.amount} ${inv.currency}\nالباقة: ${inv.planName}\nالتاريخ: ${inv.date}\nتم التحميل بنجاح وصياغته بصيغة PDF قابلة للطباعة الضريبية المصرية.`);
  };

  // Calculated variables
  const trialDaysLeft = () => {
    const end = new Date(subscription.trialEndDate).getTime();
    const start = new Date().getTime();
    const diff = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 0;
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "trial": return "bg-amber-500/10 text-amber-500 border-amber-500/20";
      case "active": return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
      case "expired": return "bg-rose-500/10 text-rose-500 border-rose-500/20";
      default: return "bg-slate-500/10 text-slate-400 border-slate-500/20";
    }
  };

  const getStatusTextArabic = (status: string) => {
    switch (status) {
      case "trial": return `فترة تجريبية مجانية (${trialDaysLeft()} يوم متبقي)`;
      case "active": return "نشط (مدفوع)";
      case "expired": return "منتهي الصلاحية";
      default: return "غير مشترك";
    }
  };

  return (
    <div className="space-y-8 animate-fade-in text-right" dir="rtl">
      
      {/* Upper Dashboard Sandbox Bar */}
      <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
            <Coins className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-amber-500">مركز اختبار باقات الاشتراك وإدارة الحساب للمسؤولين</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">تتيح لك هذه اللوحة اختبار باقات الاشتراك وإلغائها وتجربة أساليب الدفع الإلكتروني المباشر.</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={handleResetToTrial} 
            className="px-3 py-1.5 rounded-xl text-[10px] font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/20 transition-colors cursor-pointer"
          >
            🔄 إعادة تفعيل الفترة التجريبية (30 يوم مجاناً)
          </button>
          <button 
            onClick={handleSimulateExpiration} 
            className="px-3 py-1.5 rounded-xl text-[10px] font-bold bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/20 transition-colors cursor-pointer"
          >
            ⚠️ تجربة حالة انتهاء الاشتراك
          </button>
          {subscription.status === "active" && (
            <button 
              onClick={handleCancelSubscription} 
              className="px-3 py-1.5 rounded-xl text-[10px] font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors cursor-pointer"
            >
              🚫 إلغاء التجديد التلقائي
            </button>
          )}
        </div>
      </div>

      {/* Main Subscription Status Overview card */}
      <div className={`p-6 md:p-8 rounded-3xl border shadow-xl relative overflow-hidden transition-all duration-300 ${
        darkMode ? "bg-gradient-to-br from-[#0F1E32] to-[#0A1422] border-slate-800" : "bg-white border-slate-200"
      }`}>
        {/* Decorative ambient light */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#C5A059]/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="p-1 bg-[#C5A059]/10 rounded-lg text-[#C5A059]">
                <Crown className="w-5 h-5" />
              </span>
              <h2 className="text-xl md:text-2xl font-black tracking-tight">نظام الاشتراك وإدارة باقة الخدمة</h2>
            </div>
            
            <p className="text-xs md:text-sm text-slate-400 max-w-2xl leading-relaxed">
              محرك الدفع الإلكتروني مدمج مع البنوك المصرية ومحافظ الهواتف الذكية بنسبة أمان 100%. أول 30 يوماً من تسجيلك مجانية تماماً لتجربة المنصة بلا حدود وبدون الحاجة لربط وسيلة دفع أولاً.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <span className="text-xs font-semibold text-slate-400">حالة الاشتراك الحالية:</span>
              <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusBadgeColor(subscription.status)}`}>
                {getStatusTextArabic(subscription.status)}
              </span>
              {subscription.status === "active" && (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  باقة {subscription.planId === "basic" ? "المحامي الفردي" : subscription.planId === "pro" ? "المكتب المشترك" : "النخبة والمؤسسات"}
                </span>
              )}
            </div>
          </div>

          <div className="p-4 md:p-6 rounded-2xl bg-slate-900/30 border border-slate-800 text-center space-y-2 min-w-[200px]">
            <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">بوابة الدفع الإلكتروني المصري</p>
            {subscription.status === "trial" ? (
              <div className="space-y-2">
                <span className="text-3xl font-black text-[#C5A059] block">30 يوم</span>
                <span className="text-xs font-bold text-emerald-500 block">فترة تجريبية مجانية</span>
                <div className="w-full bg-slate-800 rounded-full h-1.5 mt-2">
                  <div 
                    className="bg-amber-500 h-1.5 rounded-full transition-all duration-500" 
                    style={{ width: `${(trialDaysLeft() / 30) * 100}%` }}
                  />
                </div>
              </div>
            ) : subscription.status === "active" ? (
              <div className="space-y-1">
                <span className="text-2xl font-black text-emerald-500 block">مشترك ونشط</span>
                <span className="text-xs text-slate-400 block">قيمة الاشتراك المدفوع:</span>
                <span className="text-lg font-black text-white">{subscription.amountPaid} ج.م</span>
                <span className="text-[10px] text-slate-500 block mt-1">تجدد في: {subscription.subscriptionEndDate}</span>
              </div>
            ) : subscription.status === "pending" ? (
              <div className="space-y-1">
                <span className="text-2xl font-black text-blue-500 block">قيد المراجعة</span>
                <span className="text-xs text-slate-400 block">بانتظار تأكيد الدفع</span>
                <button
                  onClick={handleCheckStatus}
                  className="px-3 py-1 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 rounded-xl text-[10px] font-bold mt-2 cursor-pointer transition-colors"
                >
                  تحديث الحالة 🔄
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <span className="text-2xl font-black text-rose-500 block">منتهي الصلاحية</span>
                <span className="text-[11px] text-slate-400 block">يرجى اختيار باقة لفتح حسابك لمواصلة العمل</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {subscription.status === "pending" && (
        <div className="p-5 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-blue-400">
          <div className="flex items-center gap-4">
            <Clock className="w-8 h-8 flex-shrink-0 animate-pulse" />
            <div>
              <h4 className="text-sm font-bold">طلب اشتراكك قيد المراجعة حالياً ⏳</h4>
              <p className="text-xs mt-1 text-slate-300">
                لقد سجلنا طلبك للاشتراك في باقة <span className="text-[#C5A059] font-bold">({plans.find(p => p.id === subscription.planId)?.name})</span>. سيتم تفعيل حسابك مباشرة بمجرد تأكيد الدفع من قبل الإدارة.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCheckStatus}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              تحديث الحالة 🔄
            </button>
            <a
              href={`https://wa.me/201091033943?text=${encodeURIComponent(`مرحبًا، أود الاستفسار عن حالة تفعيل باقة الاشتراك الخاصة بمكتبي.`)}`}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              متابعة عبر واتساب
            </a>
          </div>
        </div>
      )}

      {paymentSuccess && (
        <div className="p-5 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center gap-4 text-emerald-500 animate-bounce">
          <CheckCircle2 className="w-8 h-8 flex-shrink-0" />
          <div>
            <h4 className="text-sm font-bold">تهانينا! تم تفعيل الاشتراك المدفوع بنجاح بالجنيه المصري 🎉</h4>
            <p className="text-xs mt-1 text-emerald-500/80">
              تم إصدار الفاتورة الضريبية وتحديث ميزات حسابك في الحال. يمكنك الاستمتاع الآن بكامل قدرات باقتك المختارة بلا حدود.
            </p>
          </div>
        </div>
      )}

      {/* Subscription Plans Selection Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3 pt-4">
        <h3 className="text-xl md:text-2xl font-black text-white">خطط الأسعار ومزايا الاشتراكات بالجنيه المصري</h3>
        <p className="text-xs md:text-sm text-slate-400">
          تسهيلاً على مكاتب المحاماة في مصر، نوفر نظام دفع محلي متكامل وبسيط بالتعاون مع البنك الأهلي وفوري وإنستاباي مع شهر تجريبي مجاني تماماً لتبدأ تجربتك فوراً وبكل أمان.
        </p>

        {/* Monthly / Yearly cycle selector */}
        <div className="inline-flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-xl mt-4">
          <button
            onClick={() => setBillingCycle("yearly")}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              billingCycle === "yearly" 
                ? "bg-[#C5A059] text-white shadow" 
                : "text-slate-400 hover:text-white"
            }`}
          >
            سنوياً (خصم شهريْن 🎁)
          </button>
          <button
            onClick={() => setBillingCycle("monthly")}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              billingCycle === "monthly" 
                ? "bg-[#C5A059] text-white shadow" 
                : "text-slate-400 hover:text-white"
            }`}
          >
            شهرياً
          </button>
        </div>
      </div>

      {/* Pricing Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const isCurrent = subscription.status === "active" && subscription.planId === plan.id;
          const price = billingCycle === "monthly" ? plan.monthlyPrice : plan.yearlyPrice;
          
          return (
            <div 
              key={plan.id}
              className={`rounded-3xl border p-6 flex flex-col justify-between transition-all duration-300 relative ${
                plan.recommended ? "shadow-2xl scale-102 border-[#C5A059]" : "border-slate-800"
              } ${darkMode ? "bg-[#0B1521]" : "bg-white"} hover:shadow-2xl hover:-translate-y-1`}
            >
              {plan.recommended && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-[#C5A059] text-slate-950 text-[10px] font-black rounded-full uppercase tracking-wider">
                  {plan.badge}
                </span>
              )}
              {!plan.recommended && (
                <span className="absolute -top-3 left-6 px-3 py-1 bg-slate-800 border border-slate-700 text-slate-300 text-[9px] font-bold rounded-full">
                  {plan.badge}
                </span>
              )}

              <div className="space-y-4">
                <div>
                  <h4 className="text-lg font-black text-white">{plan.name}</h4>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed min-h-[32px]">
                    {plan.description}
                  </p>
                </div>

                <div className="py-4 border-y border-slate-800/60 my-2">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-3xl font-black text-white">{price}</span>
                    <span className="text-xs font-bold text-slate-400">ج.م</span>
                    <span className="text-xs text-slate-500">/ {billingCycle === "monthly" ? "شهرياً" : "سنوياً"}</span>
                  </div>
                  {billingCycle === "yearly" && (
                    <span className="text-[10px] text-emerald-500 font-bold mt-1 block">
                      وفرت {(plan.monthlyPrice * 2)} ج.م سنوياً مع الدفع السنوي!
                    </span>
                  )}
                  <span className="text-[10px] text-amber-500 font-bold block mt-1">
                    🎁 أول 30 يوماً مجانية تماماً لتجربة ممتازة
                  </span>
                </div>

                {/* Features List */}
                <div className="space-y-2.5">
                  <p className="text-xs font-bold text-slate-300">ميزات الباقة تشمل:</p>
                  {plan.features.map((feat, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                      <Check className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <span className="leading-tight">{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-6 mt-6 border-t border-slate-800/40">
                {isCurrent ? (
                  <div className="w-full text-center py-2.5 rounded-xl text-xs font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center justify-center gap-1.5">
                    <ShieldCheck className="w-4 h-4" />
                    باقتك الحالية النشطة
                  </div>
                ) : subscription.status === "pending" && subscription.planId === plan.id ? (
                  <div className="w-full text-center py-2.5 rounded-xl text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center gap-1.5">
                    <Clock className="w-4 h-4 animate-pulse" />
                    طلب الاشتراك قيد المراجعة
                  </div>
                ) : (
                  <button
                    onClick={() => handleStartSubscribe(plan.id)}
                    className={`w-full py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                      plan.recommended 
                        ? "bg-[#C5A059] text-slate-950 hover:bg-[#B38E46]" 
                        : "bg-slate-800 text-white hover:bg-slate-700"
                    }`}
                  >
                    {subscription.status === "trial" ? "الترقية وتفعيل الدفع الآن" : "اشترك الآن بالباقة"}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Checkout Section Modal overlay (Only shows when showCheckout is true) */}
      {showCheckout && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0D1B2A] border border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden transition-all text-right animate-fade-in" dir="rtl">
            
            {/* Header */}
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-[#C5A059]" />
                <h3 className="text-base font-black text-white">تفاصيل طلب الاشتراك اليدوي</h3>
              </div>
              <button 
                onClick={() => {
                  setShowCheckout(false);
                  setWhatsappError(null);
                }}
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content info */}
            <div className="p-5 bg-slate-950/40 border-b border-slate-800/60 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-[#C5A059]">
                  الباقة المطلوبة: {plans.find(p => p.id === selectedPlan)?.name}
                </p>
                <p className="text-xs text-slate-500 mt-1">الدورة الحسابية: {billingCycle === "yearly" ? "سنوياً (خصم شهرين)" : "شهرياً"}</p>
              </div>
              <div className="text-left">
                <span className="text-2xl font-black text-white">
                  {billingCycle === "monthly" 
                    ? plans.find(p => p.id === selectedPlan)?.monthlyPrice 
                    : plans.find(p => p.id === selectedPlan)?.yearlyPrice}
                </span>
                <span className="text-xs text-slate-400 mr-1">ج.م</span>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10 text-xs text-amber-500 leading-relaxed space-y-2">
                <p className="font-bold">⚠️ خطوات إتمام تفعيل الاشتراك:</p>
                <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-300">
                  <li>اضغط على الزر أدناه لتسجيل طلبك قيد المراجعة في النظام.</li>
                  <li>سيتم توجيهك تلقائياً إلى واتساب لإرسال تفاصيل مكتبك.</li>
                  <li>بعد إرسال الرسالة، يمكنك إتمام الدفع (عبر تحويل بنكي، إنستاباي، أو فودافون كاش).</li>
                  <li>بمجرد تأكيد الدفع من الإدارة، سيتم تفعيل باقتك مباشرة.</li>
                </ol>
              </div>

              {whatsappError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400 text-center">
                  {whatsappError}
                </div>
              )}

              <button
                onClick={handleSendWhatsAppRequest}
                disabled={isProcessing}
                className="w-full py-3.5 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-500 text-white transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg hover:shadow-emerald-900/30 disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    جاري تسجيل الطلب وتجهيز الرابط...
                  </>
                ) : (
                  <>
                    <MessageSquare className="w-4 h-4" />
                    تواصل معنا عبر واتساب لإتمام الاشتراك
                  </>
                )}
              </button>
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-950/60 border-t border-slate-800/80 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowCheckout(false);
                  setWhatsappError(null);
                }}
                className="px-5 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                إلغاء
              </button>
            </div>

          </div>
        </div>
      )}


      {/* Invoice History List */}
      <div className={`p-6 rounded-3xl border ${
        darkMode ? "bg-slate-950/40 border-slate-800" : "bg-white border-slate-200"
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/40 pb-4 mb-4">
          <div className="space-y-1">
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#C5A059]" />
              سجل الفواتير الضريبية والمدفوعات
            </h3>
            <p className="text-[11px] text-slate-400">جميع المعاملات المالية الموثقة للاشتراك في المنصة وإشعارات الدفع.</p>
          </div>
        </div>

        {invoices.length === 0 ? (
          <div className="text-center py-12 text-slate-500 space-y-2">
            <FileText className="w-8 h-8 mx-auto opacity-30" />
            <p className="text-xs">لا يوجد فواتير صادرة حتى الآن لعدم تفعيل معاملات اشتراك مدفوعة.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                  <th className="pb-3 pr-2">رقم الفاتورة</th>
                  <th className="pb-3">التاريخ</th>
                  <th className="pb-3">الباقة المتكاملة</th>
                  <th className="pb-3 text-center">القيمة</th>
                  <th className="pb-3 text-center">طريقة الدفع</th>
                  <th className="pb-3 text-center">الحالة</th>
                  <th className="pb-3 pl-2 text-left">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/30">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="text-slate-300 hover:bg-slate-900/10">
                    <td className="py-3.5 pr-2 font-mono font-bold text-white">{inv.id}</td>
                    <td className="py-3.5 text-slate-400">{inv.date}</td>
                    <td className="py-3.5">{inv.planName}</td>
                    <td className="py-3.5 text-center font-bold text-emerald-500">{inv.amount} {inv.currency}</td>
                    <td className="py-3.5 text-center text-slate-400">{inv.paymentMethod}</td>
                    <td className="py-3.5 text-center">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        مقبولة ومدفوعة
                      </span>
                    </td>
                    <td className="py-3.5 pl-2 text-left">
                      <button
                        onClick={() => handleDownloadInvoice(inv)}
                        className="p-1 px-2.5 rounded-lg text-[10px] font-bold bg-slate-800 hover:bg-slate-700 hover:text-white border border-slate-700 transition-colors cursor-pointer inline-flex items-center gap-1 text-[#C5A059]"
                      >
                        <Download className="w-3 h-3" />
                        تنزيل PDF
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
