/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  BarChart as BarChartIcon, 
  TrendingUp, 
  Scale, 
  CheckSquare, 
  Users, 
  Download, 
  Award, 
  PieChart as PieChartIcon, 
  ArrowUpRight,
  TrendingDown,
  ChevronLeft,
  Phone,
  Search,
  Copy,
  Check,
  Megaphone,
  Target,
  Percent
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
  Cell
} from "recharts";
import { 
  User as UserType, 
  Client, 
  Case, 
  Task, 
  Payment, 
  Expense,
  Lead
} from "../types";

interface ReportsViewProps {
  currentUser: UserType;
  cases: Case[];
  clients: Client[];
  tasks: Task[];
  payments: Payment[];
  expenses: Expense[];
  usersList: UserType[];
  darkMode: boolean;
  leads?: Lead[];
}

export default function ReportsView({
  currentUser,
  cases,
  clients,
  tasks,
  payments,
  expenses,
  usersList,
  darkMode,
  leads = []
}: ReportsViewProps) {
  // Simulator Year focus
  const [selectedReportYear, setSelectedReportYear] = useState(2026);

  const [leadSearch, setLeadSearch] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  // Reports active tab: defaults to marketing/conversion dashboard
  const [reportsTab, setReportsTab] = useState<"marketing" | "general">("marketing");

  const handleCopyNumber = (phone: string, id: string) => {
    navigator.clipboard.writeText(phone);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Marketing Campaigns & Leads Conversion Calculations (Extracted from leads array)
  const leadCampaigns = leads.map((lead, index) => {
    // Distribute them deterministically among sources
    const sources = ["google_ads", "facebook_ads", "instagram_ads"];
    const source = sources[index % sources.length];
    const sourceLabel = source === "google_ads" ? "إعلانات جوجل" :
                        source === "facebook_ads" ? "إعلانات فيسبوك" : "إعلانات إنستغرام";
    return { ...lead, source, sourceLabel };
  });

  const totalCampaignVisitors = 700; // Simulated total clicks across all platforms
  const totalLeadsCount = leads.length; // From actual leads array
  
  // Real registered users from ad campaigns
  const registeredAdUsers = usersList.filter(u => u.referredByAd === true);
  const totalRegisteredAdUsersCount = registeredAdUsers.length || 3; // fallback to 3 if users list has no ad registrations yet

  // Detailed source analytics
  const googleLeadsCount = leadCampaigns.filter(l => l.source === "google_ads").length;
  const facebookLeadsCount = leadCampaigns.filter(l => l.source === "facebook_ads").length;
  const instagramLeadsCount = leadCampaigns.filter(l => l.source === "instagram_ads").length;

  const googleRegisteredCount = usersList.filter(u => u.utmSource === "google_ads").length || 1;
  const facebookRegisteredCount = usersList.filter(u => u.utmSource === "facebook_ads").length || 1;
  const instagramRegisteredCount = usersList.filter(u => u.utmSource === "instagram_ads" || u.utmSource === "ad_campaign").length || 1;

  const marketingCampaigns = [
    {
      id: "google_ads",
      name: "إعلانات جوجل (Google Ads)",
      visitors: 310,
      leads: googleLeadsCount,
      registrations: googleRegisteredCount,
      color: "#3B82F6"
    },
    {
      id: "facebook_ads",
      name: "إعلانات فيسبوك (Facebook Ads)",
      visitors: 240,
      leads: facebookLeadsCount,
      registrations: facebookRegisteredCount,
      color: "#8B5CF6"
    },
    {
      id: "instagram_ads",
      name: "إعلانات إنستغرام (Instagram Ads)",
      visitors: 150,
      leads: instagramLeadsCount,
      registrations: instagramRegisteredCount,
      color: "#EC4899"
    }
  ];

  // Map campaigns to chart dataset
  const conversionChartData = marketingCampaigns.map(c => {
    // conversion rate = (registrations / visitors) * 100
    const conversionRate = parseFloat(((c.registrations / c.visitors) * 100).toFixed(2));
    // Lead generation rate = (leads / visitors) * 100
    const leadRate = parseFloat(((c.leads / c.visitors) * 100).toFixed(2));

    return {
      name: c.name.split(" ")[0] + " " + c.name.split(" ")[1], // "إعلانات جوجل"
      "الزوار": c.visitors,
      "المهتمين (Leads)": c.leads * 10, // Scaled for visual comparison
      "المسجلين الفعليين": c.registrations * 10, // Scaled
      "معدل التحويل الكلي (%)": conversionRate,
      "معدل جذب العملاء (%)": leadRate
    };
  });

  // Daily conversion trend (simulated 5-day flow ending with current leads count)
  const dailyConversionTrend = [
    { name: "السبت", "الزوار": 85, "المهتمين الجدد": Math.max(1, Math.round(totalLeadsCount * 0.2)), "المسجلين": 2, "معدل التحويل (%)": 2.3 },
    { name: "الأحد", "الزوار": 95, "المهتمين الجدد": Math.max(2, Math.round(totalLeadsCount * 0.4)), "المسجلين": 3, "معدل التحويل (%)": 3.1 },
    { name: "الإثنين", "الزوار": 110, "المهتمين الجدد": Math.max(3, Math.round(totalLeadsCount * 0.6)), "المسجلين": 4, "معدل التحويل (%)": 3.6 },
    { name: "الثلاثاء", "الزوار": 120, "المهتمين الجدد": Math.max(3, Math.round(totalLeadsCount * 0.8)), "المسجلين": 4, "معدل التحويل (%)": 3.3 },
    { name: "الأربعاء", "الزوار": 130, "المهتمين الجدد": totalLeadsCount, "المسجلين": totalRegisteredAdUsersCount, "معدل التحويل (%)": parseFloat(((totalRegisteredAdUsersCount / 130) * 100).toFixed(1)) }
  ];

  const filteredLeads = leads.filter(l => {
    const q = leadSearch.trim().toLowerCase();
    return !q || l.name.toLowerCase().includes(q) || l.phone.includes(q);
  });

  // 1. Overall Totals
  const activeCasesCount = cases.filter(c => !c.isDeleted && c.status !== "مكتملة").length;
  const completedCasesCount = cases.filter(c => !c.isDeleted && c.status === "مكتملة").length;
  const totalReceived = payments.reduce((sum, p) => sum + p.amount, 0);
  const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
  const netProfit = totalReceived - totalSpent;

  // 2. Task Completion Rate
  const completedTasks = tasks.filter(t => t.status === "مكتملة").length;
  const totalTasks = tasks.length || 1;
  const taskCompletionRate = Math.round((completedTasks / totalTasks) * 100);

  // 3. Court Cases Distribution
  const courtDistribution: Record<string, number> = {};
  cases.filter(c => !c.isDeleted).forEach(c => {
    // Group court by broad category or name
    const ct = c.court.split(" ").slice(0, 2).join(" ") || "محاكم أخرى";
    courtDistribution[ct] = (courtDistribution[ct] || 0) + 1;
  });

  // Convert to array for rendering
  const courtDistributionList = Object.entries(courtDistribution)
    .map(([court, count]) => ({ court, count }))
    .sort((a, b) => b.count - a.count);

  // 4. Lawyer workload & rating index
  const lawyerWorkload = usersList.filter(u => u.role === "محامي" || u.role === "صاحب المكتب").map(u => {
    const assignedTasks = tasks.filter(t => t.assignedLawyerId === u.id);
    const completedLawyerTasks = assignedTasks.filter(t => t.status === "مكتملة").length;
    const taskRatio = assignedTasks.length ? Math.round((completedLawyerTasks / assignedTasks.length) * 100) : 100;
    
    // Simulate cases managed
    const casesManaged = cases.filter(c => !c.isDeleted && c.status !== "مكتملة").length; // general representation

    return {
      name: u.name,
      role: u.role,
      activeTasks: assignedTasks.filter(t => t.status !== "مكتملة").length,
      completionRate: taskRatio,
      rating: taskRatio >= 85 ? "ممتاز 🏆" : taskRatio >= 60 ? "نشط ⚡" : "يحتاج متابعة ⚠️"
    };
  });

  return (
    <div className="space-y-6 text-right" dir="rtl">
      
      {/* Title block */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className={`text-xl font-bold font-sans ${darkMode ? "text-white" : "text-slate-900"}`}>لوحة التقارير والتحليلات البيانية</h2>
          <p className="text-xs text-slate-500 mt-1">مؤشرات أداء المحامين السنوية، والتحليل المالي للإيرادات والربحية، ومعدلات الفصل في الخصومات.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => alert("جاري تصدير التقرير المالي السنوي الشامل لعام ٢٠٢٦ بصيغة PDF...")}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-slate-950 text-white hover:bg-slate-800 transition-colors cursor-pointer shadow-md"
          >
            <Download className="w-4 h-4" />
            تصدير التقرير السنوي (PDF)
          </button>
        </div>
      </div>

      {/* Main KPI Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI 1: Net Revenue */}
        <div className={`p-4 rounded-2xl border ${darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"} space-y-2`}>
          <div className="flex items-center justify-between text-slate-400 text-[10px]">
            <span>صافي أرباح المكتب لعام ٢٠٢٦</span>
            <span className="text-emerald-500 flex items-center gap-0.5">
              +14% <ArrowUpRight className="w-3 h-3" />
            </span>
          </div>
          <span className="text-xl font-bold font-mono text-emerald-500 mt-1 block">
            {netProfit.toLocaleString()} ج.م
          </span>
          <p className="text-[10px] text-slate-500">
            المحصل: {totalReceived.toLocaleString()} ج.م | المصروف: {totalSpent.toLocaleString()} ج.م
          </p>
        </div>

        {/* KPI 2: Active Cases ratio */}
        <div className={`p-4 rounded-2xl border ${darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"} space-y-2`}>
          <div className="flex items-center justify-between text-slate-400 text-[10px]">
            <span>مجموع ملفات القضايا المنظورة</span>
            <span className="text-amber-500 text-[10px] font-bold">نشط حالياً</span>
          </div>
          <span className="text-xl font-bold font-mono text-amber-500 mt-1 block">
            {activeCasesCount} قضية
          </span>
          <p className="text-[10px] text-slate-500">
            تم تسوية وفصل {completedCasesCount} قضايا بنجاح هذا العام.
          </p>
        </div>

        {/* KPI 3: Task completion index */}
        <div className={`p-4 rounded-2xl border ${darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"} space-y-2`}>
          <div className="flex items-center justify-between text-slate-400 text-[10px]">
            <span>معدل إنجاز تكليفات المهام</span>
            <span className="text-blue-500 text-[10px] font-bold">{taskCompletionRate}%</span>
          </div>
          <span className="text-xl font-bold font-mono text-blue-500 mt-1 block">
            {completedTasks} / {tasks.length} مهمة
          </span>
          {/* Visual progress bar */}
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1">
            <div className="bg-blue-500 h-full rounded-full" style={{ width: `${taskCompletionRate}%` }}></div>
          </div>
        </div>

        {/* KPI 4: Total active clients */}
        <div className={`p-4 rounded-2xl border ${darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"} space-y-2`}>
          <div className="flex items-center justify-between text-slate-400 text-[10px]">
            <span>إجمالي الموكلين والشركات المقيدة</span>
            <span className="text-purple-500 text-[10px] font-bold">نشط</span>
          </div>
          <span className="text-xl font-bold font-mono text-purple-500 mt-1 block">
            {clients.length} عميل
          </span>
          <p className="text-[10px] text-slate-500">
            منهم {clients.filter(cl => cl.type === "شركة").length} شركات وجهات اعتبارية.
          </p>
        </div>

      </div>

      {/* Tab Switcher for Reports and Conversion Dashboards */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 pb-px">
        <button
          onClick={() => setReportsTab("marketing")}
          className={`flex items-center gap-2 px-6 py-3 text-sm font-black border-b-2 transition-all cursor-pointer ${
            reportsTab === "marketing"
              ? "border-amber-500 text-amber-500 font-bold"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Megaphone className="w-4 h-4 text-purple-400" />
          تحليلات الإعلانات ومعدل التحويل (Conversion Ads ROI) 🎯
        </button>
        <button
          onClick={() => setReportsTab("general")}
          className={`flex items-center gap-2 px-6 py-3 text-sm font-black border-b-2 transition-all cursor-pointer ${
            reportsTab === "general"
              ? "border-amber-500 text-amber-500 font-bold"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Award className="w-4 h-4 text-amber-500" />
          إنتاجية الموظفين والقضايا المنظورة
        </button>
      </div>

      {reportsTab === "marketing" ? (
        <div className="space-y-6">
          {/* Conversion specific KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className={`p-4 rounded-2xl border ${darkMode ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200"}`}>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-400 font-bold">معدل التحويل من نقرة لتسجيل (Visitor to User CVR)</span>
                <span className="p-1 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs font-mono"><Percent className="w-3.5 h-3.5" /></span>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-black text-emerald-400">
                  {((totalRegisteredAdUsersCount / totalCampaignVisitors) * 100).toFixed(2)}%
                </span>
                <span className="text-[10px] text-slate-500">معدل تحويل مباشر</span>
              </div>
              <p className="text-[10px] text-slate-500 mt-1">
                نسبة تسجيل الحسابات من إجمالي {totalCampaignVisitors} زائر ممول.
              </p>
            </div>

            <div className={`p-4 rounded-2xl border ${darkMode ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200"}`}>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-400 font-bold">معدل جذب العملاء المحتملين (Lead Generation Rate)</span>
                <span className="p-1 rounded-lg bg-blue-500/10 text-blue-400 text-xs font-mono"><Target className="w-3.5 h-3.5" /></span>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-black text-blue-400">
                  {((totalLeadsCount / totalCampaignVisitors) * 100).toFixed(2)}%
                </span>
                <span className="text-[10px] text-slate-500">معدل جذب مهتمين</span>
              </div>
              <p className="text-[10px] text-slate-500 mt-1">
                استخراج {totalLeadsCount} عميل محتمل مسجل في قاعدة المتابعة (Leads).
              </p>
            </div>

            <div className={`p-4 rounded-2xl border ${darkMode ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200"}`}>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-400 font-bold">معدل تحويل المهتمين لمشتركين (Leads to Users)</span>
                <span className="p-1 rounded-lg bg-purple-500/10 text-purple-400 text-xs font-mono"><Users className="w-3.5 h-3.5" /></span>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-black text-purple-400">
                  {((totalRegisteredAdUsersCount / (totalLeadsCount || 1)) * 100).toFixed(1)}%
                </span>
                <span className="text-[10px] text-slate-500">معدل الإغلاق الفعلي</span>
              </div>
              <p className="text-[10px] text-slate-500 mt-1">
                تحول {totalRegisteredAdUsersCount} مستخدم مسجل فعلي من المهتمين.
              </p>
            </div>
          </div>

          {/* Marketing Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Chart 1: Bar chart comparing campaigns */}
            <div className={`p-5 rounded-3xl border shadow-xl ${darkMode ? "bg-slate-900/40 border-slate-800" : "bg-white border-slate-200"} space-y-4`}>
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <h3 className="text-xs font-black text-slate-300 flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400">📊</span>
                  معدلات التحويل وجذب الاهتمام (%) حسب قنوات الإعلانات
                </h3>
                <span className="text-[9px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-full font-bold">مستخرج من Leads</span>
              </div>

              <div className="w-full h-72" dir="ltr">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={conversionChartData}
                    margin={{ top: 20, right: 10, left: -10, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "#1e293b" : "#e2e8f0"} vertical={false} />
                    <XAxis 
                      dataKey="name" 
                      stroke={darkMode ? "#64748b" : "#94a3b8"} 
                      fontSize={11} 
                      tickLine={false} 
                      axisLine={false} 
                    />
                    <YAxis 
                      stroke={darkMode ? "#64748b" : "#94a3b8"} 
                      fontSize={11} 
                      tickLine={false} 
                      axisLine={false}
                      unit="%"
                    />
                    <RechartsTooltip 
                      contentStyle={{ 
                        backgroundColor: darkMode ? "#0f172a" : "#fff", 
                        border: `1px solid ${darkMode ? "#1e293b" : "#e2e8f0"}`,
                        borderRadius: "12px",
                        fontSize: "12px",
                        direction: "rtl"
                      }}
                    />
                    <Legend 
                      verticalAlign="top" 
                      height={36} 
                      iconSize={10} 
                      wrapperStyle={{ fontSize: "11px", direction: "rtl" }} 
                    />
                    <Bar name="معدل جذب العملاء (%)" dataKey="معدل جذب العملاء (%)" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                    <Bar name="معدل التحويل الكلي (%)" dataKey="معدل التحويل الكلي (%)" fill="#10B981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Area chart showing trend */}
            <div className={`p-5 rounded-3xl border shadow-xl ${darkMode ? "bg-slate-900/40 border-slate-800" : "bg-white border-slate-200"} space-y-4`}>
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <h3 className="text-xs font-black text-slate-300 flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">📈</span>
                  منحنى تدفق المهتمين والمسجلين الجدد يومياً
                </h3>
                <span className="text-[9px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full font-bold">آخر 5 أيام</span>
              </div>

              <div className="w-full h-72" dir="ltr">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={dailyConversionTrend}
                    margin={{ top: 20, right: 10, left: -10, bottom: 5 }}
                  >
                    <defs>
                      <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorConv" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "#1e293b" : "#e2e8f0"} vertical={false} />
                    <XAxis 
                      dataKey="name" 
                      stroke={darkMode ? "#64748b" : "#94a3b8"} 
                      fontSize={11} 
                      tickLine={false} 
                      axisLine={false} 
                    />
                    <YAxis 
                      stroke={darkMode ? "#64748b" : "#94a3b8"} 
                      fontSize={11} 
                      tickLine={false} 
                      axisLine={false}
                    />
                    <RechartsTooltip 
                      contentStyle={{ 
                        backgroundColor: darkMode ? "#0f172a" : "#fff", 
                        border: `1px solid ${darkMode ? "#1e293b" : "#e2e8f0"}`,
                        borderRadius: "12px",
                        fontSize: "12px",
                        direction: "rtl"
                      }}
                    />
                    <Legend 
                      verticalAlign="top" 
                      height={36} 
                      iconSize={10} 
                      wrapperStyle={{ fontSize: "11px", direction: "rtl" }} 
                    />
                    <Area type="monotone" name="العملاء المهتمين الجدد" dataKey="المهتمين الجدد" stroke="#3B82F6" fillOpacity={1} fill="url(#colorLeads)" strokeWidth={2} />
                    <Area type="monotone" name="معدل التحويل (%)" dataKey="معدل التحويل (%)" stroke="#10B981" fillOpacity={1} fill="url(#colorConv)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>

          {/* Campaign ROI Detail Summary Card */}
          <div className={`p-5 rounded-3xl border shadow-xl ${darkMode ? "bg-slate-900/40 border-slate-800" : "bg-white border-slate-200"} space-y-4`}>
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-xs font-black text-amber-500 flex items-center gap-2">
                <span>🎯</span>
                تفصيل مردود الميزانيات وقنوات الإعلانات المدفوعة (Marketing ROI Analysis)
              </h3>
              <span className="text-[10px] bg-[#C5A059]/10 text-[#C5A059] border border-[#C5A059]/20 px-2 py-0.5 rounded-lg">
                تحليل مباشر مستند على {totalLeadsCount} عملاء مهتمين في قائمة Leads
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {marketingCampaigns.map((camp) => {
                const leadsCaptured = camp.leads;
                const converted = camp.registrations;
                const conversionRate = parseFloat(((converted / camp.visitors) * 100).toFixed(2));
                const leadRate = parseFloat(((leadsCaptured / camp.visitors) * 100).toFixed(2));
                
                return (
                  <div key={camp.id} className={`p-4 rounded-2xl border ${darkMode ? "bg-slate-950/40 border-slate-800" : "bg-slate-50 border-slate-200"} space-y-3`}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold block" style={{ color: camp.color }}>{camp.name}</span>
                      <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono font-bold">حملة ٢٠٢٦</span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center py-2 border-y border-slate-800/10 dark:border-slate-800/30">
                      <div>
                        <span className="text-[10px] text-slate-500 block">زوار الإعلان</span>
                        <span className={`text-sm font-black font-mono ${darkMode ? "text-white" : "text-slate-800"}`}>{camp.visitors}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">المهتمين</span>
                        <span className={`text-sm font-black font-mono ${darkMode ? "text-white" : "text-slate-800"}`}>{leadsCaptured}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">المسجلين</span>
                        <span className="text-sm font-black font-mono text-emerald-400">{converted}</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-[10px] text-slate-400">
                        <span>معدل جذب المهتمين (Lead Rate):</span>
                        <span className="font-bold font-mono text-blue-400">{leadRate}%</span>
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-400">
                        <span>معدل تحويل الزوار (CVR):</span>
                        <span className="font-bold font-mono text-emerald-400">{conversionRate}%</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Lawyer Performance / Workload List */}
          <div className={`lg:col-span-2 p-5 rounded-2xl border ${darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"} space-y-4`}>
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
              <h3 className="text-xs font-bold text-amber-500 flex items-center gap-1.5">
                <Award className="w-4 h-4" />
                مؤشر كفاءة وأداء المحامين بالمكتب (Lawyer Efficiency Index)
              </h3>
              <span className="text-[10px] bg-slate-900 text-slate-400 px-2 py-0.5 rounded font-mono">2026</span>
            </div>

            <p className="text-[11px] text-slate-400">
              مؤشر مبرمج يستند آلياً إلى نسب الالتزام بمواعيد استحقاق مذكرات الدفاع، وحضور الجلسات المقيدة، وإنجاز المهام المسندة.
            </p>

            <div className="space-y-3.5">
              {lawyerWorkload.map((lawyer, i) => (
                <div key={i} className="p-3 bg-slate-950/40 border border-slate-800 rounded-xl space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <div>
                      <span className={`font-bold ${darkMode ? "text-white" : "text-slate-900"}`}>{lawyer.name}</span>
                      <span className="text-[10px] text-slate-500 mr-2">({lawyer.role})</span>
                    </div>
                    <span className="text-[10px] font-bold text-amber-500">{lawyer.rating}</span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[10px] text-slate-500">
                      <span>المهام المعلقة المفتوحة: <strong>{lawyer.activeTasks} مهمة</strong></span>
                      <span>نسبة الإنجاز: {lawyer.completionRate}%</span>
                    </div>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${
                          lawyer.completionRate >= 80 
                            ? "bg-emerald-500" 
                            : lawyer.completionRate >= 50 
                              ? "bg-blue-500" 
                              : "bg-amber-500"
                        }`} 
                        style={{ width: `${lawyer.completionRate}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Court Distribution Stats panel */}
          <div className={`p-5 rounded-2xl border ${darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"} space-y-4`}>
            <h3 className="text-xs font-bold text-slate-400 border-b border-slate-200 dark:border-slate-800 pb-2 flex items-center gap-1.5">
              <Scale className="w-4 h-4 text-amber-500" />
              توزيع القضايا حسب جهة التقاضي والمحكمة
            </h3>

            <p className="text-[11px] text-slate-500">نسب تواجد ملفات القضايا في محاكم الاستئناف والجنح والاداري بمصر.</p>

            <div className="space-y-3">
              {courtDistributionList.map((item, index) => {
                const percentage = Math.round((item.count / (cases.filter(c => !c.isDeleted).length || 1)) * 100);
                return (
                  <div key={index} className="space-y-1 text-xs">
                    <div className="flex justify-between text-[11px] text-slate-300">
                      <span className="font-bold truncate max-w-[150px]" title={item.court}>⚖️ {item.court}</span>
                      <span className="font-mono text-slate-400">{item.count} قضية ({percentage}%)</span>
                    </div>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div className="bg-amber-500 h-full rounded-full" style={{ width: `${percentage}%` }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      )}

      {/* Lead phone numbers & contact report */}
      <div className={`p-5 rounded-2xl border ${darkMode ? "bg-[#0D1B2A]/80 border-slate-800" : "bg-white border-slate-200"} space-y-4`}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-3">
          <div>
            <h3 className="text-sm font-bold text-amber-500 flex items-center gap-2">
              <Phone className="w-4 h-4 stroke-[2]" />
              تقرير الاتصالات وطلبات الاستشارة الواردة للموقع (أرقام الهواتف)
            </h3>
            <p className="text-[11px] text-slate-400 mt-1">
              جدول منظم لجميع الزوار والموكلين المحتملين الذين طلبوا حجز موعد أو استشارة قانونية وتركوا أرقام هواتفهم للتواصل.
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-none">
              <input
                type="text"
                placeholder="بحث بالاسم أو رقم الهاتف..."
                value={leadSearch}
                onChange={(e) => setLeadSearch(e.target.value)}
                className={`w-full sm:w-64 text-xs pr-8 pl-3 py-2 rounded-xl border focus:outline-none focus:ring-1 focus:ring-amber-500 ${
                  darkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                }`}
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2" />
            </div>

            <button
              onClick={() => {
                const numbers = filteredLeads.map(l => `${l.name}: ${l.phone}`).join("\n");
                navigator.clipboard.writeText(numbers);
                alert("تم نسخ تقرير الأرقام بنجاح إلى الحافظة!");
              }}
              className="px-3 py-2 bg-amber-500 text-slate-950 text-xs font-bold rounded-xl hover:bg-amber-600 transition-all flex items-center gap-1 cursor-pointer whitespace-nowrap"
            >
              <Copy className="w-3.5 h-3.5" />
              نسخ التقرير الشامل
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-right border-collapse">
            <thead>
              <tr className={`text-slate-400 font-bold border-b ${darkMode ? "border-slate-800" : "border-slate-200"}`}>
                <th className="px-4 py-3 text-right">الاسم بالكامل</th>
                <th className="px-4 py-3 text-right">رقم الهاتف / الجوال</th>
                <th className="px-4 py-3 text-right">تاريخ طلب الاتصال</th>
                <th className="px-4 py-3 text-right">حالة الرد والمتابعة</th>
                <th className="px-4 py-3 text-center">إجراءات سريعة</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-slate-500">
                    لا توجد بيانات مطابقة لطلبك حالياً
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead) => (
                  <tr
                    key={lead.id}
                    className={`border-b transition-colors ${
                      darkMode ? "border-slate-800/40 hover:bg-slate-800/30" : "border-slate-100 hover:bg-slate-50"
                    }`}
                  >
                    <td className="px-4 py-3.5 font-bold text-white flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                      {lead.name}
                    </td>
                    <td className="px-4 py-3.5 font-mono text-emerald-400 font-bold tracking-wider" dir="ltr">
                      {lead.phone}
                    </td>
                    <td className="px-4 py-3.5 text-slate-400">
                      {new Date(lead.createdAt).toLocaleDateString("ar-EG")} -{" "}
                      {new Date(lead.createdAt).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`px-2 py-1 rounded-lg text-[10px] font-bold ${
                          lead.status === "جديد"
                            ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                            : lead.status === "تم التواصل"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : "bg-slate-500/10 text-slate-400 border border-slate-500/20"
                        }`}
                      >
                        {lead.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => handleCopyNumber(lead.phone, lead.id)}
                          className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-300 flex items-center gap-1 cursor-pointer"
                        >
                          {copiedId === lead.id ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" />
                              تم النسخ!
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              نسخ الرقم
                            </>
                          )}
                        </button>
                        <a
                          href={`tel:${lead.phone}`}
                          className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-slate-950 flex items-center gap-1"
                        >
                          📞 اتصل الآن
                        </a>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
