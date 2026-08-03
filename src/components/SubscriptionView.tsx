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
  Upload
} from "lucide-react";
import { UserSubscription, SubscriptionPlanId, SubscriptionInvoice, User } from "../types";

interface SubscriptionViewProps {
  currentUser: User;
  subscription: UserSubscription;
  onUpdateSubscription: (sub: UserSubscription) => void;
  invoices: SubscriptionInvoice[];
  onAddInvoice: (invoice: SubscriptionInvoice) => void;
  darkMode: boolean;
}

export default function SubscriptionView({
  currentUser,
  subscription,
  onUpdateSubscription,
  invoices,
  onAddInvoice,
  darkMode
}: SubscriptionViewProps) {
  // UI states
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlanId>("pro");
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [showCheckout, setShowCheckout] = useState<boolean>(false);
  const [paymentMethod, setPaymentMethod] = useState<"card" | "vodafone" | "instapay">("card");
  
  // Checkout Form states
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCVV, setCardCVV] = useState("");
  const [cardHolder, setCardHolder] = useState("");
  const [instapayRef, setInstapayRef] = useState("");
  const [vodaSender, setVodaSender] = useState("");
  const [vodaProvider, setVodaProvider] = useState("vodafone");
  const [screenshotUploaded, setScreenshotUploaded] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState("");
  
  // Payment gateway simulation states
  const [isProcessing, setIsProcessing] = useState(false);
  const [showOTP, setShowOTP] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpError, setOtpError] = useState("");
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

  // Simulate Card Formatting
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 16) value = value.slice(0, 16);
    const formatted = value.match(/.{1,4}/g)?.join(" ") || value;
    setCardNumber(formatted);
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 4) value = value.slice(0, 4);
    if (value.length >= 2) {
      setCardExpiry(`${value.slice(0, 2)}/${value.slice(2)}`);
    } else {
      setCardExpiry(value);
    }
  };

  const handleCVVChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "");
    if (value.length <= 3) setCardCVV(value);
  };

  // Trigger Checkout Start
  const handleStartSubscribe = (planId: SubscriptionPlanId) => {
    setSelectedPlan(planId);
    setShowCheckout(true);
    setPaymentSuccess(false);
  };

  // Payment process simulation
  const handleProcessPayment = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    if (paymentMethod === "card") {
      // Visa simulation needs OTP challenge
      setTimeout(() => {
        setIsProcessing(false);
        setShowOTP(true);
      }, 1500);
    } else {
      // Vodafone cash or Instapay processes instantly as manual proof submission
      setTimeout(() => {
        setIsProcessing(false);
        finalizeSubscription();
      }, 2000);
    }
  };

  const handleVerifyOTP = () => {
    if (otpCode === "1234") {
      setShowOTP(false);
      finalizeSubscription();
    } else {
      setOtpError("رمز التحقق غير صحيح، برجاء إدخال الرمز التجريبي 1234");
    }
  };

  const finalizeSubscription = () => {
    const targetPlan = plans.find(p => p.id === selectedPlan);
    const amount = billingCycle === "monthly" ? (targetPlan?.monthlyPrice || 0) : (targetPlan?.yearlyPrice || 0);
    
    const newSub: UserSubscription = {
      planId: selectedPlan,
      status: "active",
      trialStartDate: subscription.trialStartDate,
      trialEndDate: subscription.trialEndDate,
      subscriptionStartDate: new Date().toISOString().split("T")[0],
      subscriptionEndDate: billingCycle === "monthly" 
        ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
        : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      billingCycle: billingCycle,
      paymentMethod: paymentMethod,
      cardDetails: paymentMethod === "card" ? {
        last4: cardNumber.replace(/\s/g, "").slice(-4) || "4242",
        brand: cardNumber.startsWith("5") ? "ماستركارد" : "فيزا",
        holderName: cardHolder || "المحامي المشترك"
      } : null,
      autoRenew: true,
      amountPaid: amount
    };

    onUpdateSubscription(newSub);

    // Create an Invoice
    const newInvoice: SubscriptionInvoice = {
      id: `INV-${Math.floor(100000 + Math.random() * 900000)}`,
      date: new Date().toISOString().split("T")[0],
      planName: targetPlan?.name || "الباقة الاحترافية",
      amount: amount,
      currency: "ج.م",
      paymentMethod: paymentMethod === "card" ? "بطاقة ائتمان" : paymentMethod === "vodafone" ? "محفظة هاتف" : "إنستاباي",
      status: "paid"
    };
    onAddInvoice(newInvoice);

    setPaymentSuccess(true);
    setShowCheckout(false);
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
            ) : (
              <div className="space-y-2">
                <span className="text-2xl font-black text-rose-500 block">منتهي الصلاحية</span>
                <span className="text-[11px] text-slate-400 block">يرجى اختيار باقة لفتح حسابك لمواصلة العمل</span>
              </div>
            )}
          </div>
        </div>
      </div>

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

      {/* Checkout Section Form Modal overlay (Only shows when showCheckout is true) */}
      {showCheckout && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0D1B2A] border border-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden transition-all text-right animate-fade-in" dir="rtl">
            
            {/* Header */}
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-[#C5A059]" />
                <h3 className="text-base font-black text-white">إتمام الاشتراك الآمن بالجنيه المصري</h3>
              </div>
              <button 
                onClick={() => setShowCheckout(false)}
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content info */}
            <div className="p-5 bg-slate-950/40 border-b border-slate-800/60 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold text-slate-300">
                  الباقة المختارة: <span className="text-[#C5A059]">{plans.find(p => p.id === selectedPlan)?.name}</span>
                </p>
                <p className="text-[10px] text-slate-500 mt-1">الدورة الحسابية: {billingCycle === "yearly" ? "سنوياً" : "شهرياً"}</p>
              </div>
              <div className="text-left">
                <span className="text-xl font-black text-white">
                  {billingCycle === "monthly" 
                    ? plans.find(p => p.id === selectedPlan)?.monthlyPrice 
                    : plans.find(p => p.id === selectedPlan)?.yearlyPrice}
                </span>
                <span className="text-[10px] text-slate-400 mr-1">ج.م</span>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleProcessPayment} className="p-6 space-y-6">
              
              {/* Payment Type Tab Selectors */}
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("card")}
                  className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                    paymentMethod === "card"
                      ? "border-[#C5A059] bg-[#C5A059]/5 text-[#C5A059]"
                      : "border-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  <CreditCard className="w-5 h-5" />
                  <span className="text-[10px] font-bold">بطاقة ائتمانية</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod("instapay")}
                  className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                    paymentMethod === "instapay"
                      ? "border-[#C5A059] bg-[#C5A059]/5 text-[#C5A059]"
                      : "border-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  <QrCode className="w-5 h-5" />
                  <span className="text-[10px] font-bold">إنستاباي (InstaPay)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod("vodafone")}
                  className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                    paymentMethod === "vodafone"
                      ? "border-[#C5A059] bg-[#C5A059]/5 text-[#C5A059]"
                      : "border-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  <Smartphone className="w-5 h-5" />
                  <span className="text-[10px] font-bold">كاش (محافظ ذكية)</span>
                </button>
              </div>

              {/* Dynamic Payment Method View */}
              {paymentMethod === "card" && (
                <div className="space-y-4">
                  <div className="bg-[#1E293B]/20 p-4 rounded-2xl border border-slate-800 flex items-center gap-2 text-[11px] text-[#C5A059]">
                    <ShieldCheck className="w-4 h-4 flex-shrink-0" />
                    <span>مؤمن بالكامل بالاتفاق مع البنوك المصرية الكبرى. الدفع يتم مباشرة عبر الخوادم المشفرة الآمنة.</span>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-300">اسم صاحب البطاقة (الاسم المدون على الكارت)</label>
                    <input
                      type="text"
                      required
                      placeholder="HOSSAM ABBAS"
                      value={cardHolder}
                      onChange={(e) => setCardHolder(e.target.value.toUpperCase())}
                      className="w-full text-xs bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-[#C5A059] uppercase tracking-wider"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-300">رقم البطاقة الائتمانية</label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        placeholder="4242 4242 4242 4242"
                        value={cardNumber}
                        onChange={handleCardNumberChange}
                        className="w-full text-xs bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-[#C5A059] tracking-widest ltr"
                        dir="ltr"
                      />
                      <CreditCard className="w-4 h-4 absolute left-3 top-3 text-slate-600" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-slate-300">تاريخ الانتهاء</label>
                      <input
                        type="text"
                        required
                        placeholder="MM/YY"
                        value={cardExpiry}
                        onChange={handleExpiryChange}
                        className="w-full text-xs bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-[#C5A059] text-center tracking-widest"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-slate-300">رمز الأمان (CVV)</label>
                      <input
                        type="password"
                        required
                        placeholder="123"
                        value={cardCVV}
                        onChange={handleCVVChange}
                        className="w-full text-xs bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-[#C5A059] text-center tracking-widest"
                      />
                    </div>
                  </div>
                </div>
              )}

              {paymentMethod === "instapay" && (
                <div className="space-y-4">
                  <div className="p-4 bg-slate-950/50 rounded-2xl border border-slate-800 space-y-3">
                    <h4 className="text-xs font-bold text-[#C5A059]">خطوات الدفع عبر تطبيق إنستاباي (InstaPay):</h4>
                    <ol className="text-[11px] text-slate-300 space-y-2 list-decimal pr-4 leading-relaxed">
                      <li>افتح تطبيق إنستاباي على هاتفك المحمول.</li>
                      <li>قم بالتحويل إلى عنوان الدفع الخاص بالمنصة: <strong className="text-white font-mono bg-slate-900 px-2 py-0.5 rounded border border-slate-800 select-all">meezan@instapay</strong></li>
                      <li>أو امسح رمز الاستجابة السريع للشركة (QR Code).</li>
                      <li>اكتب القيمة الدقيقة للاشتراك: <strong>{billingCycle === "monthly" ? plans.find(p => p.id === selectedPlan)?.monthlyPrice : plans.find(p => p.id === selectedPlan)?.yearlyPrice} ج.م</strong></li>
                      <li>بعد إتمام العملية، قم بنسخ رقم مرجع المعاملة (Ref ID) والصقه في الحقل أدناه لتأكيد التحويل فوراً.</li>
                    </ol>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-4 p-3 bg-slate-950/30 border border-slate-800/80 rounded-2xl">
                    <div className="w-24 h-24 bg-white p-1 rounded-xl flex items-center justify-center">
                      {/* Simulated QR Code for Instapay */}
                      <div className="text-slate-950 text-center font-bold text-[8px] space-y-1">
                        <QrCode className="w-12 h-12 mx-auto text-[#C5A059]" />
                        <span>Meezan Pay</span>
                      </div>
                    </div>
                    <div className="space-y-1 text-right flex-1">
                      <span className="text-[10px] text-slate-500 uppercase font-mono block">Instapay Address</span>
                      <strong className="text-xs text-white font-mono block">meezan@instapay</strong>
                      <span className="text-[10px] text-slate-400 block leading-relaxed mt-1">التحويل فوري ويعمل على مدار الساعة لجميع البنوك المصرية.</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-300">رقم مرجع المعاملة من تطبيق إنستاباي (Ref Number)</label>
                    <input
                      type="text"
                      required
                      placeholder="مثال: 402839485930"
                      value={instapayRef}
                      onChange={(e) => setInstapayRef(e.target.value.replace(/\D/g, ""))}
                      className="w-full text-xs bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-[#C5A059] tracking-wider"
                    />
                  </div>
                </div>
              )}

              {paymentMethod === "vodafone" && (
                <div className="space-y-4">
                  <div className="p-4 bg-slate-950/50 rounded-2xl border border-slate-800 space-y-3">
                    <h4 className="text-xs font-bold text-[#C5A059]">خطوات التحويل عبر فودافون كاش ومحافظ الهواتف الذكية:</h4>
                    <ol className="text-[11px] text-slate-300 space-y-2 list-decimal pr-4 leading-relaxed">
                      <li>قم بتحويل قيمة الاشتراك إلى رقم محفظتنا: <strong className="text-white font-mono bg-slate-900 px-2 py-0.5 rounded border border-slate-800 select-all">01012345678</strong></li>
                      <li>التحويل مدعوم من جميع محافظ المحمول بمصر (فودافون كاش، اتصالات كاش، أورنج كاش، WE Pay، محفظة الأهلي، CIB).</li>
                      <li>بعد التحويل بنجاح، يرجى ملء بيانات رقم الهاتف المُرسِل، وإرفاق لقطة شاشة لإيصال العملية بالأسفل لسرعة المراجعة والتفعيل التلقائي.</li>
                    </ol>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-slate-300">مزود خدمة المحفظة</label>
                      <select
                        value={vodaProvider}
                        onChange={(e) => setVodaProvider(e.target.value)}
                        className="w-full text-xs bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-[#C5A059]"
                      >
                        <option value="vodafone">فودافون كاش (Vodafone Cash)</option>
                        <option value="etisalat">اتصالات كاش (Etisalat Cash)</option>
                        <option value="orange">أورنج كاش (Orange Money)</option>
                        <option value="we">وي باي (WE Pay)</option>
                        <option value="bank">محفظة بنك مصري (CIB / NBE)</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-slate-300">رقم الهاتف الذي قمت بالتحويل منه</label>
                      <input
                        type="text"
                        required
                        placeholder="010XXXXXXXX"
                        value={vodaSender}
                        onChange={(e) => setVodaSender(e.target.value.replace(/\D/g, ""))}
                        maxLength={11}
                        className="w-full text-xs bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-[#C5A059] tracking-wider"
                      />
                    </div>
                  </div>

                  {/* Attachment simulation */}
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-300">أرفق لقطة الشاشة للتحويل (اختياري للتأكيد الفوري)</label>
                    <div className="border border-dashed border-slate-800 rounded-2xl p-4 text-center hover:border-[#C5A059]/40 transition-colors cursor-pointer relative bg-slate-950/20">
                      <input
                        type="file"
                        accept="image/*"
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            setScreenshotUploaded(true);
                            setUploadedFileName(e.target.files[0].name);
                          }
                        }}
                      />
                      <div className="space-y-2">
                        <Upload className="w-8 h-8 mx-auto text-slate-500" />
                        <p className="text-xs text-slate-300 font-bold">
                          {screenshotUploaded ? `✅ تم إرفاق: ${uploadedFileName}` : "انقر لاختيار صورة إيصال التحويل أو اسحبها هنا"}
                        </p>
                        <p className="text-[10px] text-slate-500">الملفات المدعومة: PNG, JPG, GIF حتى 5 ميجابايت</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Submit Buttons */}
              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCheckout(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="px-6 py-2.5 rounded-xl text-xs font-black bg-[#C5A059] text-slate-950 hover:bg-[#B38E46] transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      جاري فحص المعاملة...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      تأكيد ودفع {billingCycle === "monthly" ? plans.find(p => p.id === selectedPlan)?.monthlyPrice : plans.find(p => p.id === selectedPlan)?.yearlyPrice} ج.م
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* OTP Challenge Simulation Modal (For Visa security) */}
      {showOTP && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white text-slate-950 rounded-2xl w-full max-w-sm shadow-2xl p-6 text-center space-y-6 animate-scale-up" dir="rtl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-[10px] text-slate-400 font-bold tracking-widest">SECURE BANK PAYMENT</span>
              <span className="text-xs font-bold text-slate-500">نظام الأمان الثنائي (3D Secure)</span>
            </div>

            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto text-xl font-bold">
              🛡️
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-black text-slate-800">تحقق الأمان المصرفي الإلكتروني</h4>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                تم إرسال رمز تحقق مؤقت (OTP) إلى هاتفك المسجل لدى البنك لعملية الشراء لمرة واحدة بقيمة{" "}
                <strong className="text-slate-800">
                  {billingCycle === "monthly" 
                    ? plans.find(p => p.id === selectedPlan)?.monthlyPrice 
                    : plans.find(p => p.id === selectedPlan)?.yearlyPrice} ج.م
                </strong>.
              </p>
              <div className="p-2 bg-slate-50 border border-slate-100 rounded-lg text-[10px] text-blue-600 font-bold mt-1">
                💡 رمز الأمان البنكي للتأكيد الفوري: <span className="font-mono bg-blue-100 px-1.5 py-0.5 rounded">1234</span>
              </div>
            </div>

            <div className="space-y-1 max-w-[200px] mx-auto">
              <input
                type="text"
                placeholder="XXXX"
                value={otpCode}
                onChange={(e) => {
                  setOtpCode(e.target.value.replace(/\D/g, ""));
                  setOtpError("");
                }}
                maxLength={4}
                className="w-full text-center text-lg font-bold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 tracking-widest"
              />
              {otpError && <p className="text-[10px] text-rose-500 font-bold">{otpError}</p>}
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowOTP(false);
                  setIsProcessing(false);
                }}
                className="flex-1 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
              >
                إلغاء المعاملة
              </button>
              <button
                type="button"
                onClick={handleVerifyOTP}
                className="flex-1 py-2 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white transition-all cursor-pointer"
              >
                تأكيد الرمز والدفع
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
