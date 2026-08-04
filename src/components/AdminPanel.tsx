/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts";
import {
  ShieldAlert,
  Users,
  CheckCircle,
  XCircle,
  Search,
  DollarSign,
  Lock,
  Unlock,
  Plus,
  RefreshCw,
  Gift,
  AlertTriangle,
  FileSpreadsheet,
  Coins,
  Building2,
  Calendar,
  CreditCard,
  UserCheck,
  Trash2,
  Edit,
  Database,
  Download,
  Upload,
  PlusCircle,
  Server,
  Check,
  MapPin,
  Navigation,
  Clock,
  Globe,
  Smartphone,
  Monitor,
  Filter,
  Compass,
  ShieldCheck,
  Eye,
  Activity,
  Map,
  UserX,
  ArrowRightLeft,
  Phone,
  Crown
} from "lucide-react";
import {
  User,
  UserSubscription,
  SubscriptionInvoice,
  Client,
  Case,
  Session,
  Task,
  Document as DocType,
  Payment,
  Expense,
  AuditLog,
  OfficeConfig,
  EntranceNotification,
  Lead
} from "../types";
import {
  initialClients,
  initialCases,
  initialSessions,
  initialTasks,
  initialDocuments,
  initialPayments,
  initialExpenses,
  initialAuditLogs,
  initialUsers,
  initialOfficeConfig
} from "../data/initialData";

interface SimulatedOffice {
  id: string;
  name: string;
  lawyerName: string;
  phone: string;
  email: string;
  planId: "basic" | "pro" | "elite";
  status: "trial" | "active" | "expired";
  amountPaid: number;
  lastPaymentDate: string | null;
  registrationDate: string;
  isCurrent?: boolean;
}

interface AdminPanelProps {
  currentUser: User;
  subscription: UserSubscription;
  onUpdateSubscription: (newSub: UserSubscription) => void;
  invoices: SubscriptionInvoice[];
  onAddInvoice: (invoice: SubscriptionInvoice) => void;
  darkMode: boolean;

  // Real database states & setters passed from App.tsx
  clients: Client[];
  setClients: React.Dispatch<React.SetStateAction<Client[]>>;
  cases: Case[];
  setCases: React.Dispatch<React.SetStateAction<Case[]>>;
  sessions: Session[];
  setSessions: React.Dispatch<React.SetStateAction<Session[]>>;
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  documents: DocType[];
  setDocuments: React.Dispatch<React.SetStateAction<DocType[]>>;
  payments: Payment[];
  setPayments: React.Dispatch<React.SetStateAction<Payment[]>>;
  expenses: Expense[];
  setExpenses: React.Dispatch<React.SetStateAction<Expense[]>>;
  auditLogs: AuditLog[];
  setAuditLogs: React.Dispatch<React.SetStateAction<AuditLog[]>>;
  usersList: User[];
  setUsersList: React.Dispatch<React.SetStateAction<User[]>>;
  officeConfig: OfficeConfig;
  setOfficeConfig: React.Dispatch<React.SetStateAction<OfficeConfig>>;
  entranceNotifications?: EntranceNotification[];
  leads?: Lead[];
  setLeads?: React.Dispatch<React.SetStateAction<Lead[]>>;
}

export default function AdminPanel({
  currentUser,
  subscription,
  onUpdateSubscription,
  invoices,
  onAddInvoice,
  darkMode,
  clients,
  setClients,
  cases,
  setCases,
  sessions,
  setSessions,
  tasks,
  setTasks,
  documents,
  setDocuments,
  payments,
  setPayments,
  expenses,
  setExpenses,
  auditLogs,
  setAuditLogs,
  usersList,
  setUsersList,
  officeConfig,
  setOfficeConfig,
  entranceNotifications = [],
  leads = [],
  setLeads
}: AdminPanelProps) {
  // Initialize simulated offices state, including the current user's office which reads from the real state
  const [offices, setOffices] = useState<SimulatedOffice[]>(() => {
    const saved = localStorage.getItem("meezan_admin_offices");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Exclude fake default offices if they are present in the saved state
        const cleaned = parsed.filter((off: SimulatedOffice) => 
          off.id === "current-workspace" || 
          !["office-farouk", "office-adala", "office-kamal", "office-morsi"].includes(off.id)
        );
        return cleaned.map((off: SimulatedOffice) => {
          if (off.isCurrent) {
            return {
              ...off,
              name: officeConfig.officeName || off.name,
              lawyerName: currentUser.name,
              phone: officeConfig.phone || off.phone,
              email: currentUser.email,
              status: subscription.status === "trial" ? "trial" : subscription.status === "active" ? "active" : "expired",
              amountPaid: subscription.amountPaid || off.amountPaid,
            };
          }
          return off;
        });
      } catch (e) {
        // Fallback to defaults
      }
    }

    return [
      {
        id: "current-workspace",
        name: "مكتبك الحالي (مكتب ميزان الرئيسي)",
        lawyerName: currentUser.name,
        phone: "01099887766",
        email: currentUser.email,
        planId: subscription.planId,
        status: subscription.status === "trial" ? "trial" : subscription.status === "active" ? "active" : "expired",
        amountPaid: subscription.amountPaid || 0,
        lastPaymentDate: subscription.subscriptionStartDate,
        registrationDate: "2026-06-20",
        isCurrent: true,
      }
    ];
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "trial" | "expired">("all");
  const [selectedOffice, setSelectedOffice] = useState<SimulatedOffice | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(350);
  const [paymentMethod, setPaymentMethod] = useState<"vodafone" | "instapay" | "card">("instapay");
  const [adminNotes, setAdminNotes] = useState("");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showLogModal, setShowLogModal] = useState(false);

  // Add New Office states
  const [showAddOfficeModal, setShowAddOfficeModal] = useState(false);
  const [newOfficeName, setNewOfficeName] = useState("");
  const [newOfficeLawyer, setNewOfficeLawyer] = useState("");
  const [newOfficePhone, setNewOfficePhone] = useState("");
  const [newOfficeEmail, setNewOfficeEmail] = useState("");
  const [newOfficePlan, setNewOfficePlan] = useState<"basic" | "pro" | "elite">("pro");
  const [newOfficeStatus, setNewOfficeStatus] = useState<"trial" | "active" | "expired">("trial");
  const [newOfficePaid, setNewOfficePaid] = useState(0);

  // Edit Office states
  const [showEditOfficeModal, setShowEditOfficeModal] = useState(false);
  const [editingOffice, setEditingOffice] = useState<SimulatedOffice | null>(null);

  // Delete Office states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [officeToDelete, setOfficeToDelete] = useState<SimulatedOffice | null>(null);

  // Database actions states
  const [isVacuuming, setIsVacuuming] = useState(false);
  const [vacuumProgress, setVacuumProgress] = useState(0);
  const [showVacuumSuccess, setShowVacuumSuccess] = useState(false);
  const [importText, setImportText] = useState("");
  const [showImportSuccess, setShowImportSuccess] = useState(false);
  const [showWipeConfirm, setShowWipeConfirm] = useState(false);
  const [showSeedConfirm, setShowSeedConfirm] = useState(false);

  // Sub-tabs state inside Admin Panel
  const [adminTab, setAdminTab] = useState<"offices" | "timeline" | "database" | "leads" | "users">("offices");

  // Timeline tab filters & states
  const [timelineSearch, setTimelineSearch] = useState("");
  const [selectedUserFilter, setSelectedUserFilter] = useState("all");
  const [selectedTypeFilter, setSelectedTypeFilter] = useState("all");
  const [selectedCityFilter, setSelectedCityFilter] = useState("all");

  const defaultTimelineLogs: EntranceNotification[] = [
    {
      id: "notif-init-ad-1",
      userName: "زائر إعلان مدفوع (google_ads)",
      userRole: "زائر إعلانات / غير مسجل",
      userEmail: "حملة: google_search_lawyers_cpc",
      timestamp: "12:15 ص - 23/07/2026",
      ipAddress: "197.38.115.80",
      deviceInfo: "هاتف محمول (Android/Chrome)",
      location: "القاهرة، مصر",
      coordinates: { lat: 30.0444, lng: 31.2357 },
      isRead: true,
      type: "ad_visitor"
    },
    {
      id: "notif-init-ad-2",
      userName: "زائر إعلان مدفوع (facebook_ads)",
      userRole: "زائر إعلانات / غير مسجل",
      userEmail: "حملة: fb_meta_legal_services",
      timestamp: "11:45 م - 22/07/2026",
      ipAddress: "156.210.88.19",
      deviceInfo: "هاتف محمول (Safari/iOS)",
      location: "الإسكندرية، مصر",
      coordinates: { lat: 31.2001, lng: 29.9187 },
      isRead: true,
      type: "ad_visitor"
    }
  ];

  const baseTimeline = (entranceNotifications && entranceNotifications.length > 0)
    ? entranceNotifications
    : defaultTimelineLogs;

  // Apply user requested filters:
  // 1. Exclude website owner/manager statistics
  // 2. Only show statistics for new users visiting the website
  const rawTimeline = baseTimeline.filter(item => {
    const isOwnerOrManager = item.userRole === "مدير المنصة والاشتراكات" || item.userRole === "صاحب المكتب" || item.userRole === "صاحب المكتب المحامي";
    const isNewVisitor = item.type === "ad_visitor" || item.type === "entrance" || item.type === "register";
    return !isOwnerOrManager && isNewVisitor;
  });

  const filteredTimeline = rawTimeline.filter((item) => {
    const q = timelineSearch.trim().toLowerCase();
    const matchesSearch = !q || (
      item.userName.toLowerCase().includes(q) ||
      (item.userEmail && item.userEmail.toLowerCase().includes(q)) ||
      (item.location && item.location.toLowerCase().includes(q)) ||
      (item.ipAddress && item.ipAddress.toLowerCase().includes(q)) ||
      (item.deviceInfo && item.deviceInfo.toLowerCase().includes(q))
    );

    const matchesUser = selectedUserFilter === "all" || item.userName === selectedUserFilter;
    const matchesType = selectedTypeFilter === "all" || item.type === selectedTypeFilter;
    const matchesCity = selectedCityFilter === "all" || (item.location && item.location.includes(selectedCityFilter));

    return matchesSearch && matchesUser && matchesType && matchesCity;
  });

  const locationCounts = rawTimeline.reduce((acc: Record<string, number>, item) => {
    const loc = item.location || "موقع غير محدد";
    acc[loc] = (acc[loc] || 0) + 1;
    return acc;
  }, {});

  const recentVisitorsData = React.useMemo(() => {
    const today = new Date();
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dd = String(d.getDate()).padStart(2, '0');
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const yyyy = d.getFullYear();
      
      // Try multiple date formats to match whatever is generated
      const dateStr1 = `${dd}/${mm}/${yyyy}`; 
      // Also toLocaleDateString("ar-EG") might produce "23/07/2026" or similar
      const dateStr2 = d.toLocaleDateString("ar-EG");

      const count = rawTimeline.filter(item => {
        const itemDateStr = item.timestamp.split(" - ")[1] || item.timestamp;
        return itemDateStr.includes(dateStr1) || itemDateStr.includes(dateStr2);
      }).length;

      data.push({
        name: `${dd}/${mm}`,
        "زوار جدد": count
      });
    }
    return data;
  }, [rawTimeline]);

  const handleExportTimelineJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(rawTimeline, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `meezan_access_timeline_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Add Office Handler
  const handleAddOfficeSubmit = () => {
    if (!newOfficeName || !newOfficeLawyer) return;
    const today = new Date().toISOString().split("T")[0];
    const newOffice: SimulatedOffice = {
      id: `office-${Date.now()}`,
      name: newOfficeName,
      lawyerName: newOfficeLawyer,
      phone: newOfficePhone || "غير مسجل",
      email: newOfficeEmail || "غير مسجل",
      planId: newOfficePlan,
      status: newOfficeStatus,
      amountPaid: newOfficePaid,
      lastPaymentDate: newOfficeStatus === "active" ? today : null,
      registrationDate: today
    };

    setOffices((prev) => [newOffice, ...prev]);

    // reset form
    setNewOfficeName("");
    setNewOfficeLawyer("");
    setNewOfficePhone("");
    setNewOfficeEmail("");
    setNewOfficePlan("pro");
    setNewOfficeStatus("trial");
    setNewOfficePaid(0);
    setShowAddOfficeModal(false);
  };

  // Edit Office Handler
  const handleEditOfficeSubmit = () => {
    if (!editingOffice) return;
    const updated = offices.map((off) => {
      if (off.id === editingOffice.id) {
        const next = { ...editingOffice };
        syncCurrentOfficeToState(next);
        return next;
      }
      return off;
    });
    setOffices(updated);
    setShowEditOfficeModal(false);
    setEditingOffice(null);
  };

  // Delete Office Handler
  const handleDeleteOfficeConfirm = () => {
    if (!officeToDelete) return;
    if (officeToDelete.isCurrent) {
      alert("عذراً، لا يمكن حذف مكان عمل المطور الحالي!");
      return;
    }
    const updated = offices.filter((off) => off.id !== officeToDelete.id);
    setOffices(updated);
    setShowDeleteModal(false);
    setOfficeToDelete(null);
  };

  // Database Management Handlers
  const handleDownloadBackup = () => {
    const backupPayload = {
      version: "1.0",
      timestamp: new Date().toISOString(),
      database: "meezan_cloud_db",
      data: {
        clients,
        cases,
        sessions,
        tasks,
        documents,
        payments,
        expenses,
        auditLogs,
        usersList,
        officeConfig
      }
    };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupPayload, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `meezan_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleRestoreBackup = () => {
    try {
      if (!importText.trim()) return;
      const parsed = JSON.parse(importText);
      if (parsed.database === "meezan_cloud_db" && parsed.data) {
        const d = parsed.data;
        if (d.clients) setClients(d.clients);
        if (d.cases) setCases(d.cases);
        if (d.sessions) setSessions(d.sessions);
        if (d.tasks) setTasks(d.tasks);
        if (d.documents) setDocuments(d.documents);
        if (d.payments) setPayments(d.payments);
        if (d.expenses) setExpenses(d.expenses);
        if (d.auditLogs) setAuditLogs(d.auditLogs);
        if (d.usersList) setUsersList(d.usersList);
        if (d.officeConfig) setOfficeConfig(d.officeConfig);

        setShowImportSuccess(true);
        setImportText("");
        setTimeout(() => setShowImportSuccess(false), 3000);
      } else {
        alert("عذراً، ملف النسخة الاحتياطية غير صالح أو لا ينتمي لنظام ميزان!");
      }
    } catch (e) {
      alert("خطأ في قراءة ملف النسخة الاحتياطية. يرجى التأكد من صحة الكود البرمجي المنسوخ.");
    }
  };

  const handleRunVacuum = () => {
    setIsVacuuming(true);
    setVacuumProgress(0);
    const interval = setInterval(() => {
      setVacuumProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsVacuuming(false);
          setShowVacuumSuccess(true);
          setTimeout(() => setShowVacuumSuccess(false), 3000);
          return 100;
         }
        return prev + 10;
      });
    }, 150);
  };

  const handleWipeDatabase = () => {
    setClients([]);
    setCases([]);
    setSessions([]);
    setTasks([]);
    setDocuments([]);
    setPayments([]);
    setExpenses([]);
    
    const wipeLog: AuditLog = {
      id: `log-wipe-${Date.now()}`,
      timestamp: new Date().toISOString().replace("T", " ").substring(0, 19),
      userName: currentUser.name,
      userRole: currentUser.role,
      action: "🚨 قام المسؤول العام بتهيئة كاملة لقاعدة البيانات وحذف جميع السجلات.",
      ipAddress: "127.0.0.1"
    };
    setAuditLogs([wipeLog]);
    setShowWipeConfirm(false);
  };

  const handleSeedDatabase = () => {
    setClients(initialClients);
    setCases(initialCases);
    setSessions(initialSessions);
    setTasks(initialTasks);
    setDocuments(initialDocuments);
    setPayments(initialPayments);
    setExpenses(initialExpenses);
    setAuditLogs(initialAuditLogs);
    setUsersList(initialUsers);
    setShowSeedConfirm(false);
  };
  
  // Manual Subscription Request States for Super Admin
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [isLoadingPendingRequests, setIsLoadingPendingRequests] = useState(false);
  const [pendingRequestsError, setPendingRequestsError] = useState<string | null>(null);
  const [pendingActionProcessing, setPendingActionProcessing] = useState<string | null>(null);

  const fetchPendingRequests = async () => {
    setIsLoadingPendingRequests(true);
    setPendingRequestsError(null);
    try {
      const token = localStorage.getItem("meezan_token");
      const res = await fetch("/api/subscription/pending-requests", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setPendingRequests(data.requests || []);
      } else {
        setPendingRequestsError(data.error || "فشل تحميل طلبات الاشتراك المعلقة.");
      }
    } catch (err) {
      console.error("[FETCH PENDING ERROR]", err);
      setPendingRequestsError("فشل الاتصال بالخادم لتحميل الطلبات.");
    } finally {
      setIsLoadingPendingRequests(false);
    }
  };

  const handleApproveSubscription = async (requestId: string, status: "active" | "expired") => {
    setPendingActionProcessing(requestId);
    try {
      const token = localStorage.getItem("meezan_token");
      const res = await fetch("/api/subscription/approve", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          requestId,
          status
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        // Refresh requests
        fetchPendingRequests();
        
        // Update local offices state to match
        const req = pendingRequests.find(r => r.id === requestId);
        if (req) {
          setOffices(prev => prev.map(off => {
            if (off.id === req.officeId || off.email.toLowerCase() === req.userEmail.toLowerCase()) {
              const amount = status === "active" ? (req.billingCycle === "monthly" ? 350 : 3500) : 0;
              return {
                ...off,
                status: status,
                amountPaid: off.amountPaid + amount,
                planId: req.planId
              };
            }
            return off;
          }));
        }
        
        alert(status === "active" ? "تم تفعيل الاشتراك اليدوي بنجاح! تم تسجيل الفاتورة." : "تم إلغاء/رفض طلب الاشتراك.");
      } else {
        alert("فشل تحديث حالة الاشتراك: " + (data.error || "خطأ غير معروف."));
      }
    } catch (err) {
      console.error("[APPROVE SUBSCRIPTION ERROR]", err);
      alert("حدث خطأ غير متوقع أثناء الاتصال بالخادم.");
    } finally {
      setPendingActionProcessing(null);
    }
  };

  useEffect(() => {
    if (adminTab === "offices") {
      fetchPendingRequests();
    }
  }, [adminTab]);

  // Save offices whenever they are updated
  useEffect(() => {
    localStorage.setItem("meezan_admin_offices", JSON.stringify(offices));
  }, [offices]);

  // Synchronize real registered users in usersList as offices
  useEffect(() => {
    const realUsers = usersList.filter(u => 
      u.id !== "usr-super" && 
      u.id !== "usr-owner-1" && 
      u.id !== "usr-lawyer-1" && 
      u.id !== "usr-sec-1"
    );

    let updated = [...offices];
    let changed = false;

    realUsers.forEach(u => {
      // Check if user already has an office in the offices state
      const exists = updated.some(o => o.id === u.id || o.email.toLowerCase() === u.email.toLowerCase());
      if (!exists) {
        updated.push({
          id: u.id,
          name: `مكتب الأستاذ ${u.name} للمحاماة`,
          lawyerName: u.name,
          phone: "غير مسجل",
          email: u.email,
          planId: "pro",
          status: "trial",
          amountPaid: 0,
          lastPaymentDate: null,
          registrationDate: new Date().toISOString().split("T")[0]
        });
        changed = true;
      }
    });

    if (changed) {
      setOffices(updated);
      localStorage.setItem("meezan_admin_offices", JSON.stringify(updated));
    }
  }, [usersList, offices]);

  // Synchronize changes to current office with the real app state
  const syncCurrentOfficeToState = (updatedOffice: SimulatedOffice) => {
    if (updatedOffice.isCurrent) {
      const realStatus = updatedOffice.status === "active" ? "active" : updatedOffice.status === "trial" ? "trial" : "expired";
      
      const newSub: UserSubscription = {
        ...subscription,
        status: realStatus,
        amountPaid: updatedOffice.amountPaid,
        subscriptionStartDate: updatedOffice.lastPaymentDate || subscription.subscriptionStartDate,
        subscriptionEndDate: updatedOffice.status === "active" 
          ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
          : null,
      };
      
      onUpdateSubscription(newSub);

      // Add a matching invoice if activated
      if (updatedOffice.status === "active" && updatedOffice.amountPaid > 0) {
        const matchingInvoiceExists = invoices.some(
          inv => inv.amount === updatedOffice.amountPaid && 
          inv.date === updatedOffice.lastPaymentDate
        );
        if (!matchingInvoiceExists) {
          const newInvoice: SubscriptionInvoice = {
            id: `inv-adm-${Date.now()}`,
            date: updatedOffice.lastPaymentDate || new Date().toISOString().split("T")[0],
            planName: updatedOffice.planId === "basic" ? "باقة المحامي الفردي" : updatedOffice.planId === "pro" ? "باقة المكتب المشترك" : "باقة النخبة المتكاملة",
            amount: updatedOffice.amountPaid,
            currency: "ج.م",
            paymentMethod: "مدفوع عبر الإدارة العامة",
            status: "paid"
          };
          onAddInvoice(newInvoice);
        }
      }
    }
  };

  // 1. Activate/Open Software
  const handleActivateOffice = (officeId: string) => {
    const today = new Date().toISOString().split("T")[0];
    const updated = offices.map((off) => {
      if (off.id === officeId) {
        const next = {
          ...off,
          status: "active" as const,
          lastPaymentDate: today,
          amountPaid: off.amountPaid === 0 ? (off.planId === "basic" ? 150 : off.planId === "pro" ? 350 : 700) : off.amountPaid
        };
        syncCurrentOfficeToState(next);
        return next;
      }
      return off;
    });
    setOffices(updated);
  };

  // 2. Deactivate/Freeze Software
  const handleFreezeOffice = (officeId: string) => {
    const updated = offices.map((off) => {
      if (off.id === officeId) {
        const next = {
          ...off,
          status: "expired" as const
        };
        syncCurrentOfficeToState(next);
        return next;
      }
      return off;
    });
    setOffices(updated);
  };

  // 3. Extend Trial
  const handleExtendTrial = (officeId: string) => {
    const updated = offices.map((off) => {
      if (off.id === officeId) {
        const next = {
          ...off,
          status: "trial" as const
        };
        syncCurrentOfficeToState(next);
        return next;
      }
      return off;
    });
    setOffices(updated);
  };

  // 4. Record Manual Payment Modal Submit
  const handleRecordPaymentSubmit = () => {
    if (!selectedOffice) return;

    const today = new Date().toISOString().split("T")[0];
    const updated = offices.map((off) => {
      if (off.id === selectedOffice.id) {
        const next = {
          ...off,
          status: "active" as const,
          amountPaid: off.amountPaid + paymentAmount,
          lastPaymentDate: today
        };
        syncCurrentOfficeToState(next);
        return next;
      }
      return off;
    });
    setOffices(updated);

    // Save internal platform receipt logs
    const savedReceipts = JSON.parse(localStorage.getItem("meezan_admin_receipts") || "[]");
    const newReceipt = {
      id: `adm-rec-${Date.now()}`,
      officeId: selectedOffice.id,
      officeName: selectedOffice.name,
      amount: paymentAmount,
      method: paymentMethod,
      date: today,
      notes: adminNotes || "تفعيل وتجديد اشتراك يدوي من الإدارة"
    };
    localStorage.setItem("meezan_admin_receipts", JSON.stringify([newReceipt, ...savedReceipts]));

    setShowPaymentModal(false);
    setSelectedOffice(null);
    setAdminNotes("");
  };

  // Filter calculations
  const filteredOffices = offices.filter((off) => {
    const matchesSearch = 
      off.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      off.lawyerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      off.phone.includes(searchTerm) ||
      off.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter = statusFilter === "all" || off.status === statusFilter;

    return matchesSearch && matchesFilter;
  });

  // System Stats
  const stats = {
    totalOffices: offices.length,
    activePaid: offices.filter(o => o.status === "active").length,
    trialPeriod: offices.filter(o => o.status === "trial").length,
    frozenLocked: offices.filter(o => o.status === "expired").length,
    totalEGPCollected: offices.reduce((sum, o) => sum + o.amountPaid, 0)
  };

  return (
    <div className="space-y-6 animate-fade-in" dir="rtl">
      
      {/* Top Header Panel */}
      <div className={`p-6 rounded-3xl border ${
        darkMode 
          ? "bg-[#0D1B2A]/80 border-slate-800" 
          : "bg-white border-slate-200"
      } flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl`}>
        <div className="flex items-center gap-4 text-right">
          <div className="w-14 h-14 bg-rose-500/10 text-rose-500 rounded-2xl flex items-center justify-center text-3xl shadow-inner border border-rose-500/20">
            🔒
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-[#C5A059]">لوحة تحكم المنصة الكبرى (المشرف العام)</h2>
              <span className="bg-rose-500/20 text-rose-500 border border-rose-500/30 text-[9px] font-bold px-2 py-0.5 rounded-full">
                صلاحيات المطور المطلقة
              </span>
            </div>
            <p className={`text-xs mt-1 ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
              بوابة التحكم الأمنية لمنصة ميزان. بصفتك المالك/المطور، يمكنك تفعيل البرامج للمكاتب يدويًا، مراجعة التحويلات المالية، وفتح أو قفل وتجميد النظام لغير الدافعين.
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowLogModal(true)}
          className="px-4 py-2.5 rounded-xl text-xs font-bold bg-[#C5A059] hover:bg-[#B38E46] text-slate-950 flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-[#C5A059]/10"
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>سجل التحويلات المالية للمنصة</span>
        </button>
      </div>

      {/* Admin Panel Sub-Tabs Navigation */}
      <div className={`p-2 rounded-2xl border flex items-center gap-2 overflow-x-auto ${
        darkMode ? "bg-[#0D1B2A]/90 border-slate-800" : "bg-white border-slate-200"
      }`}>
        <button
          onClick={() => setAdminTab("offices")}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            adminTab === "offices"
              ? "bg-[#C5A059] text-slate-950 shadow-lg shadow-[#C5A059]/10 font-black"
              : darkMode
                ? "text-slate-400 hover:text-white hover:bg-slate-800/50"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>إدارة المكاتب والاشتراكات ({offices.length})</span>
        </button>

        <button
          onClick={() => setAdminTab("timeline")}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap relative ${
            adminTab === "timeline"
              ? "bg-[#C5A059] text-slate-950 shadow-lg shadow-[#C5A059]/10 font-black"
              : darkMode
                ? "text-slate-400 hover:text-white hover:bg-slate-800/50"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <Compass className="w-4 h-4 text-emerald-400" />
          <span>الجدول الزمني لأماكن الدخول (Access Timeline)</span>
          <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[9px] font-bold px-2 py-0.5 rounded-full">
            {rawTimeline.length} تسجيل
          </span>
        </button>

        <button
          onClick={() => setAdminTab("database")}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            adminTab === "database"
              ? "bg-[#C5A059] text-slate-950 shadow-lg shadow-[#C5A059]/10 font-black"
              : darkMode
                ? "text-slate-400 hover:text-white hover:bg-slate-800/50"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <Server className="w-4 h-4" />
          <span>قاعدة البيانات والصيانة السحابية</span>
        </button>

        <button
          onClick={() => setAdminTab("leads")}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            adminTab === "leads"
              ? "bg-[#C5A059] text-slate-950 shadow-lg shadow-[#C5A059]/10 font-black"
              : darkMode
                ? "text-slate-400 hover:text-white hover:bg-slate-800/50"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <Phone className="w-4 h-4" />
          <span>العملاء المحتملين (Leads)</span>
          {leads.filter(l => l.status === "جديد").length > 0 && (
            <span className="bg-rose-500 text-white text-[9px] px-1.5 py-0.5 rounded-full min-w-[1.25rem] text-center">
              {leads.filter(l => l.status === "جديد").length}
            </span>
          )}
        </button>

        <button
          onClick={() => setAdminTab("users")}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            adminTab === "users"
              ? "bg-[#C5A059] text-slate-950 shadow-lg shadow-[#C5A059]/10 font-black"
              : darkMode
                ? "text-slate-400 hover:text-white hover:bg-slate-800/50"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <Users className="w-4 h-4 text-amber-500" />
          <span>المستخدمون والعملاء الحقيقيون ({usersList.filter(u => u.id !== "usr-super" && u.id !== "usr-owner-1" && u.id !== "usr-lawyer-1" && u.id !== "usr-sec-1").length})</span>
        </button>
      </div>

      {/* TAB 1: OFFICES & SUBSCRIPTIONS */}
      {adminTab === "offices" && (
        <div className="space-y-6 animate-fade-in">

      {/* Grid of Platform-wide Statistics */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        
        {/* Total revenue */}
        <div className={`p-5 rounded-2xl border ${
          darkMode ? "bg-emerald-500/5 border-emerald-500/10" : "bg-emerald-50/50 border-emerald-200"
        } relative overflow-hidden flex flex-col justify-between`}>
          <div>
            <span className="text-[10px] font-bold text-slate-400 block mb-1">إجمالي الإيرادات بالجنيه المصري</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-emerald-400">{stats.totalEGPCollected}</span>
              <span className="text-[10px] text-emerald-500">ج.م</span>
            </div>
          </div>
          <Coins className="absolute bottom-2 left-2 w-8 h-8 opacity-10 text-emerald-400" />
        </div>

        {/* Total Offices */}
        <div className={`p-5 rounded-2xl border ${
          darkMode ? "bg-[#0D1B2A]/40 border-slate-800" : "bg-white border-slate-200"
        } relative overflow-hidden flex flex-col justify-between`}>
          <div>
            <span className="text-[10px] font-bold text-slate-400 block mb-1">المكاتب المسجلة</span>
            <span className="text-2xl font-black text-[#C5A059]">{stats.totalOffices}</span>
          </div>
          <Building2 className="absolute bottom-2 left-2 w-8 h-8 opacity-10 text-[#C5A059]" />
        </div>

        {/* Active Open software */}
        <div className={`p-5 rounded-2xl border ${
          darkMode ? "bg-[#0D1B2A]/40 border-slate-800" : "bg-white border-slate-200"
        } relative overflow-hidden flex flex-col justify-between`}>
          <div>
            <span className="text-[10px] font-bold text-slate-400 block mb-1">البرنامج مفتوح (نشط)</span>
            <span className="text-2xl font-black text-emerald-400">{stats.activePaid}</span>
          </div>
          <CheckCircle className="absolute bottom-2 left-2 w-8 h-8 opacity-10 text-emerald-400" />
        </div>

        {/* Trial offices */}
        <div className={`p-5 rounded-2xl border ${
          darkMode ? "bg-[#0D1B2A]/40 border-slate-800" : "bg-white border-slate-200"
        } relative overflow-hidden flex flex-col justify-between`}>
          <div>
            <span className="text-[10px] font-bold text-slate-400 block mb-1">الفترة التجريبية</span>
            <span className="text-2xl font-black text-amber-400">{stats.trialPeriod}</span>
          </div>
          <Gift className="absolute bottom-2 left-2 w-8 h-8 opacity-10 text-amber-400" />
        </div>

        {/* Frozen/Locked */}
        <div className={`p-5 rounded-2xl border ${
          darkMode ? "bg-[#0D1B2A]/40 border-slate-800" : "bg-white border-slate-200"
        } relative overflow-hidden flex flex-col justify-between col-span-2 lg:col-span-1`}>
          <div>
            <span className="text-[10px] font-bold text-slate-400 block mb-1">البرنامج مغلق (مجمد)</span>
            <span className="text-2xl font-black text-rose-500">{stats.frozenLocked}</span>
          </div>
          <Lock className="absolute bottom-2 left-2 w-8 h-8 opacity-10 text-rose-500" />
        </div>

      </div>

      {/* Pending Manual Subscription Requests Reviewer Panel */}
      {pendingRequests.length > 0 && (
        <div className={`p-6 rounded-3xl border shadow-xl ${
          darkMode ? "bg-[#0D1B2A]/80 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-800"
        }`}>
          <div className="flex items-center gap-2 mb-4">
            <Crown className="w-5 h-5 text-[#C5A059] animate-pulse" />
            <h3 className="text-sm font-black text-white">طلبات الاشتراك قيد المراجعة اليدوية ({pendingRequests.length})</h3>
          </div>
          <p className="text-[11px] text-slate-400 mb-4 text-right">
            المكاتب التالية قامت بتقديم طلب اشتراك وتنتظر تأكيد الدفع اليدوي (عبر واتساب/إنستاباي/فودافون كاش). يرجى مراجعة إيصال التحويل ثم التفعيل أو الرفض.
          </p>
          <div className="overflow-x-auto rounded-2xl border border-slate-800/60">
            <table className="w-full text-right text-xs" dir="rtl">
              <thead>
                <tr className={darkMode ? "bg-slate-900/60 text-slate-400" : "bg-slate-50 text-slate-500"}>
                  <th className="p-3 text-right">اسم المكتب</th>
                  <th className="p-3 text-right">المحامي / البريد</th>
                  <th className="p-3 text-right">الباقة المطلوبة</th>
                  <th className="p-3 text-right">نوع الدفع</th>
                  <th className="p-3 text-right">تاريخ الطلب</th>
                  <th className="p-3 text-left">إجراءات المدير العام</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {pendingRequests.map((req) => (
                  <tr key={req.id} className={darkMode ? "hover:bg-slate-900/40" : "hover:bg-slate-50/80"}>
                    <td className="p-3 font-bold text-[#C5A059] text-right">🏢 {req.officeName || "مكتب محاماة جديد"}</td>
                    <td className="p-3 text-right">
                      <div className="font-bold">{req.userName}</div>
                      <div className="text-[10px] text-slate-500">{req.userEmail}</div>
                    </td>
                    <td className="p-3 text-right">
                      <span className="px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-400 border border-purple-500/20 font-bold text-[10px]">
                        {req.planId === "basic" ? "المحامي الفردي" : req.planId === "pro" ? "المكتب المشترك" : "النخبة والمؤسسات"}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <span className="text-[10px] font-bold text-slate-300">
                        {req.billingCycle === "yearly" ? "سنوي" : "شهري"}
                      </span>
                    </td>
                    <td className="p-3 text-slate-400 text-[10px] text-right">{req.createdAt || "اليوم"}</td>
                    <td className="p-3 text-left">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          disabled={pendingActionProcessing !== null}
                          onClick={() => handleApproveSubscription(req.id, "active")}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-bold cursor-pointer transition-all disabled:opacity-50"
                        >
                          {pendingActionProcessing === req.id ? "جاري التفعيل..." : "موافقة وتفعيل ✔"}
                        </button>
                        <button
                          disabled={pendingActionProcessing !== null}
                          onClick={() => handleApproveSubscription(req.id, "expired")}
                          className="px-3 py-1.5 bg-rose-600/10 hover:bg-rose-600/20 text-rose-400 border border-rose-500/20 rounded-lg text-[10px] font-bold cursor-pointer transition-all disabled:opacity-50"
                        >
                          رفض ✖
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Main Offices Table and Search Controls */}
      <div className={`p-6 rounded-3xl border shadow-xl ${
        darkMode ? "bg-[#0D1B2A]/80 border-slate-800" : "bg-white border-slate-200"
      }`}>
        
        {/* Search and filter bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
          <div className="relative w-full md:w-96">
            <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="ابحث باسم المكتب، المحامي، أو الهاتف..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pr-10 pl-4 py-2 rounded-xl text-xs outline-none border focus:border-[#C5A059] transition-colors ${
                darkMode ? "bg-slate-900 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
              }`}
            />
          </div>

          <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
            <span className="text-[10px] font-bold text-slate-400 ml-2 whitespace-nowrap">حالة الاشتراك:</span>
            {[
              { id: "all", label: "الكل" },
              { id: "active", label: "مفتوح / دفع بريميوم" },
              { id: "trial", label: "تجريبي مجاني" },
              { id: "expired", label: "مغلق / مجمّد" },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setStatusFilter(f.id as any)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-colors whitespace-nowrap cursor-pointer ${
                  statusFilter === f.id
                    ? "bg-[#C5A059] border-[#C5A059] text-slate-950"
                    : darkMode
                      ? "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
                      : "bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900"
                }`}
              >
                {f.label}
              </button>
            ))}

            <button
              onClick={() => setShowAddOfficeModal(true)}
              className="mr-auto px-3 py-1.5 rounded-xl text-[10px] font-bold bg-[#C5A059] text-slate-950 hover:bg-[#B38E46] transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 shadow-lg shadow-[#C5A059]/10"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>إضافة مكتب جديد</span>
            </button>
          </div>
        </div>

        {/* Interactive Warning Banner */}
        <div className={`mb-6 p-4 rounded-2xl flex items-start gap-3 text-right border text-xs ${
          darkMode 
            ? "bg-blue-500/5 border-blue-500/10 text-blue-400" 
            : "bg-blue-50 border-blue-200 text-blue-800"
        }`}>
          <span className="text-lg">💡</span>
          <div className="space-y-1">
            <strong className={`block ${darkMode ? "text-white" : "text-blue-900"}`}>نظام التحكم المباشر في حالات المكاتب:</strong>
            <span>
              قم بتعديل حالة <strong>"مكتبك الحالي (مكتب ميزان الرئيسي)"</strong> بالأسفل. إذا اخترت له <strong>"إغلاق وتجميد"</strong> سيتم فوراً قفل البرنامج وتجميد الحساب لتطبيق سياسة الأمان، وإذا اخترت له <strong>"تفعيل فوري"</strong> سيتم فتح البرنامج بالكامل وإلغاء القفل. هذا يمكن المشرفين من التحكم التام في وصول المكاتب المشتركة.
            </span>
          </div>
        </div>

        {/* Subscriber Office Grid */}
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className={`border-b text-[10px] font-bold uppercase tracking-wider ${
                darkMode ? "border-slate-800 text-slate-400" : "border-slate-100 text-slate-500"
              }`}>
                <th className="pb-3 px-2">مكتب المحاماة المشترك</th>
                <th className="pb-3 px-2">المسؤول الرئيسي</th>
                <th className="pb-3 px-2">الباقة ومعدل الدفع</th>
                <th className="pb-3 px-2 text-center">حالة البرنامج والوصول</th>
                <th className="pb-3 px-2">المبالغ المدفوعة</th>
                <th className="pb-3 px-2 text-left">التحكم والإدارة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {filteredOffices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-500 font-bold">
                    لا توجد مكاتب محاماة مطابقة لمعايير البحث.
                  </td>
                </tr>
              ) : (
                filteredOffices.map((off) => {
                  const isCurrent = off.isCurrent;
                  
                  return (
                    <tr 
                      key={off.id} 
                      className={`transition-colors hover:bg-slate-900/10 ${
                        isCurrent 
                          ? darkMode 
                            ? "bg-[#C5A059]/5 border-r-2 border-[#C5A059]" 
                            : "bg-[#C5A059]/5 border-r-2 border-[#C5A059]"
                          : ""
                      }`}
                    >
                      {/* Office details */}
                      <td className="py-4 px-2">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold ${
                            isCurrent ? "bg-[#C5A059]/20 text-[#C5A059]" : "bg-slate-500/10 text-slate-400"
                          }`}>
                            🏢
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className={`font-bold ${darkMode ? "text-white" : "text-slate-900"}`}>{off.name}</span>
                              {isCurrent && (
                                <span className="bg-[#C5A059] text-slate-950 font-black text-[7px] px-1.5 py-0.2 rounded-md">
                                  مكتبك الحالي
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-400 block mt-0.5">{off.email}</span>
                          </div>
                        </div>
                      </td>

                      {/* Lawyer / Principal */}
                      <td className="py-4 px-2">
                        <div>
                          <span className={`font-semibold ${darkMode ? "text-slate-200" : "text-slate-700"}`}>{off.lawyerName}</span>
                          <span className="text-[10px] text-slate-400 block mt-0.5">{off.phone}</span>
                        </div>
                      </td>

                      {/* Plan & Cycle */}
                      <td className="py-4 px-2">
                        <div>
                          <span className={`font-bold text-[10px] px-2 py-0.5 rounded-md border ${
                            off.planId === "basic" 
                              ? (darkMode ? "bg-slate-500/10 text-slate-300 border-slate-700/50" : "bg-slate-100 text-slate-700 border-slate-200") 
                              : off.planId === "pro"
                                ? (darkMode ? "bg-blue-500/10 text-blue-400 border-blue-500/20" : "bg-blue-50 text-blue-700 border-blue-200")
                                : (darkMode ? "bg-purple-500/10 text-purple-400 border-purple-500/20" : "bg-purple-50 text-purple-700 border-purple-200")
                          }`}>
                            {off.planId === "basic" ? "المحامي الفردي" : off.planId === "pro" ? "المكتب المشترك" : "النخبة الكبرى"}
                          </span>
                          <span className="text-[10px] text-slate-400 block mt-1.5">
                            المسجل: {off.registrationDate}
                          </span>
                        </div>
                      </td>

                      {/* Access Status & Locking */}
                      <td className="py-4 px-2 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black border ${
                          off.status === "active"
                            ? (darkMode ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/25" : "bg-emerald-50 text-emerald-700 border-emerald-200")
                            : off.status === "trial"
                              ? (darkMode ? "bg-amber-500/10 text-amber-400 border-amber-500/25" : "bg-amber-50 text-amber-700 border-amber-200")
                              : (darkMode ? "bg-rose-500/10 text-rose-500 border-rose-500/25" : "bg-rose-50 text-rose-700 border-rose-200")
                        }`}>
                          <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                          <span>
                            {off.status === "active" ? "بريميوم (مفتوح)" : off.status === "trial" ? "تجريبي مجاني" : "مجمد (مغلق)"}
                          </span>
                        </span>
                      </td>

                      {/* Money paid in EGP */}
                      <td className="py-4 px-2">
                        <div>
                          <div className="flex items-baseline gap-1">
                            <span className={`font-bold ${darkMode ? "text-slate-100" : "text-slate-900"}`}>{off.amountPaid}</span>
                            <span className="text-[9px] text-slate-400">ج.م</span>
                          </div>
                          {off.lastPaymentDate && (
                            <span className="text-[9px] text-slate-400 block mt-1 font-mono">
                              بتاريخ: {off.lastPaymentDate}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Controls and locking buttons */}
                      <td className="py-4 px-2 text-left">
                        <div className="flex items-center justify-end gap-1.5">
                          {off.status !== "active" ? (
                            <button
                              onClick={() => handleActivateOffice(off.id)}
                              className="px-2 py-1 rounded bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-[10px] flex items-center gap-1 transition-colors cursor-pointer"
                              title="تفعيل فوري وفتح البرنامج"
                            >
                              <Unlock className="w-3 h-3" />
                              <span>تفعيل وفتح</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => handleFreezeOffice(off.id)}
                              className="px-2 py-1 rounded bg-rose-500/20 hover:bg-rose-500 hover:text-white text-rose-500 font-bold text-[10px] flex items-center gap-1 transition-all cursor-pointer border border-rose-500/30"
                              title="تجميد الحساب وقفل البرنامج"
                            >
                              <Lock className="w-3 h-3" />
                              <span>تجميد وقفل</span>
                            </button>
                          )}

                          {off.status !== "trial" && (
                            <button
                              onClick={() => handleExtendTrial(off.id)}
                              className="px-2 py-1 rounded bg-amber-500/10 hover:bg-amber-500 hover:text-slate-950 text-amber-500 font-bold text-[10px] flex items-center gap-1 transition-all cursor-pointer border border-amber-500/20"
                              title="تحويل إلى فترة تجريبية"
                            >
                              <Gift className="w-3 h-3" />
                              <span>فترة تجريبية</span>
                            </button>
                          )}

                          <button
                            onClick={() => {
                              setSelectedOffice(off);
                              setPaymentAmount(off.planId === "basic" ? 150 : off.planId === "pro" ? 350 : 700);
                              setShowPaymentModal(true);
                            }}
                            className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-[10px] flex items-center gap-1 transition-colors cursor-pointer border border-slate-700"
                            title="تسجيل استلام مبلغ دفع بالجنيه المصري"
                          >
                            <DollarSign className="w-3 h-3 text-[#C5A059]" />
                            <span>تسجيل دفع</span>
                          </button>

                          <button
                            onClick={() => {
                              setEditingOffice({ ...off });
                              setShowEditOfficeModal(true);
                            }}
                            className="px-2 py-1 rounded bg-blue-500/10 hover:bg-blue-500 hover:text-white text-blue-400 font-bold text-[10px] flex items-center gap-1 transition-all cursor-pointer border border-blue-500/20"
                            title="تعديل بيانات المكتب"
                          >
                            <Edit className="w-3 h-3" />
                            <span>تعديل</span>
                          </button>

                          {!off.isCurrent && (
                            <button
                              onClick={() => {
                                setOfficeToDelete(off);
                                setShowDeleteModal(true);
                              }}
                              className="px-2 py-1 rounded bg-rose-500/10 hover:bg-rose-500 hover:text-white text-rose-500 font-bold text-[10px] flex items-center gap-1 transition-all cursor-pointer border border-rose-500/20"
                              title="حذف المكتب"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>حذف</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

      </div>
        </div>
      )}

      {/* TAB 2: ACCESS TIMELINE & GEOGRAPHIC OVERSIGHT */}
      {adminTab === "timeline" && (
        <div className="space-y-6 animate-fade-in">
          
          {/* Security Overview Header Card */}
          <div className={`p-6 rounded-3xl border shadow-xl ${
            darkMode ? "bg-[#0D1B2A]/80 border-slate-800" : "bg-white border-slate-200"
          }`}>
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-800/40">
              <div className="flex items-center gap-3 text-right">
                <div className="w-12 h-12 bg-amber-500/10 text-amber-400 rounded-2xl flex items-center justify-center text-2xl shadow-inner border border-amber-500/20">
                  <ShieldCheck className="w-6 h-6 text-[#C5A059]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black text-[#C5A059]">سجل الرقابة الأمني والربط الجغرافي لوصول فريق العمل</h3>
                    <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                      <Activity className="w-3 h-3 text-emerald-400 animate-pulse" />
                      مباشر - تعقب GPS & IP
                    </span>
                  </div>
                  <p className={`text-xs mt-1 ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                    جدول زمني تفاعلي يربط بين كل أعضاء فريق العمل، أماكن ومواعيد دخولهم للنظام، مواقعهم الجغرافية، وعناوين أجهزتهم لتعزيز الرقابة الأمنية.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportTimelineJSON}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold bg-[#C5A059]/10 hover:bg-[#C5A059] hover:text-slate-950 text-[#C5A059] border border-[#C5A059]/20 transition-all flex items-center gap-1.5 cursor-pointer shadow-lg shadow-[#C5A059]/5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>تصدير تقرير السجل الأمني (JSON)</span>
                </button>
              </div>
            </div>

            {/* Timeline Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
              <div className={`p-4 rounded-2xl border ${darkMode ? "bg-slate-900/60 border-slate-800" : "bg-slate-50 border-slate-200"} text-right`}>
                <span className="text-[10px] text-slate-400 font-bold block mb-1">إجمالي تسجيلات الوصول</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-amber-400">{rawTimeline.length}</span>
                  <span className="text-[10px] text-slate-500">عملية مؤكدة</span>
                </div>
              </div>

              <div className={`p-4 rounded-2xl border ${darkMode ? "bg-slate-900/60 border-slate-800" : "bg-slate-50 border-slate-200"} text-right`}>
                <span className="text-[10px] text-slate-400 font-bold block mb-1">المدن والمواقع الجغرافية</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-emerald-400">{Object.keys(locationCounts).length}</span>
                  <span className="text-[10px] text-slate-500">منطقة جغرافية/مدينة</span>
                </div>
              </div>

              <div className={`p-4 rounded-2xl border ${darkMode ? "bg-slate-900/60 border-slate-800" : "bg-slate-50 border-slate-200"} text-right`}>
                <span className="text-[10px] text-slate-400 font-bold block mb-1">المستخدمين المسجلين بالمخطط</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-blue-400">
                    {Array.from(new Set(rawTimeline.map(t => t.userName))).length}
                  </span>
                  <span className="text-[10px] text-slate-500">حساب مختلف</span>
                </div>
              </div>

              <div className={`p-4 rounded-2xl border ${darkMode ? "bg-slate-900/60 border-slate-800" : "bg-slate-50 border-slate-200"} text-right`}>
                <span className="text-[10px] text-slate-400 font-bold block mb-1">الزوار الجدد (لم يسجلوا دخول)</span>
                <div className="flex flex-col items-start gap-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black text-purple-400">
                      {Array.from(new Set(rawTimeline.filter(t => t.type === "ad_visitor" || t.type === "entrance").map(t => t.ipAddress))).filter(ip => !new Set(rawTimeline.filter(t => t.type === "login" || t.type === "register" || t.type === "simulation").map(t => t.ipAddress)).has(ip)).length}
                    </span>
                    <span className="text-[10px] text-slate-500">زائر جديد</span>
                  </div>
                  {leads && leads.length > 0 && (
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#C5A059]/10 border border-[#C5A059]/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#C5A059] animate-pulse"></span>
                      <span className="text-[9px] font-bold text-[#C5A059]">تحول منهم {leads.length} عملاء محتملين</span>
                    </div>
                  )}
                </div>
              </div>

              <div className={`p-4 rounded-2xl border ${darkMode ? "bg-slate-900/60 border-slate-800" : "bg-slate-50 border-slate-200"} text-right`}>
                <span className="text-[10px] text-slate-400 font-bold block mb-1">مستوى السلامة والرقابة</span>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                  <span className="text-xs font-bold text-emerald-400">100% وصول موثق ومستقر</span>
                </div>
              </div>
            </div>

            {/* New Visitors Chart */}
            <div className={`p-4 rounded-3xl border shadow-xl mb-6 ${darkMode ? "bg-[#0D1B2A]/80 border-slate-800" : "bg-white border-slate-200"}`}>
              <h4 className={`text-xs font-bold mb-4 text-right ${darkMode ? "text-slate-300" : "text-slate-700"}`}>
                تدفق الزوار الجدد (آخر 7 أيام)
              </h4>
              <div className="w-full h-64" dir="ltr">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={recentVisitorsData}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="colorVisitors" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#C5A059" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#C5A059" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "#1e293b" : "#e2e8f0"} vertical={false} />
                    <XAxis 
                      dataKey="name" 
                      stroke={darkMode ? "#64748b" : "#94a3b8"} 
                      fontSize={10} 
                      tickLine={false} 
                      axisLine={false} 
                      padding={{ left: 10, right: 10 }}
                    />
                    <YAxis 
                      stroke={darkMode ? "#64748b" : "#94a3b8"} 
                      fontSize={10} 
                      tickLine={false} 
                      axisLine={false} 
                      allowDecimals={false}
                    />
                    <RechartsTooltip 
                      contentStyle={{ 
                        backgroundColor: darkMode ? "#0f172a" : "#fff", 
                        border: `1px solid ${darkMode ? "#1e293b" : "#e2e8f0"}`,
                        borderRadius: "12px",
                        fontSize: "12px",
                        direction: "rtl"
                      }}
                      itemStyle={{ color: "#C5A059", fontWeight: "bold" }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="زوار جدد" 
                      stroke="#C5A059" 
                      strokeWidth={2}
                      fillOpacity={1} 
                      fill="url(#colorVisitors)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Geographic Cities Pills Filter */}
            <div className="pt-3 border-t border-slate-800/40">
              <span className="text-[11px] font-bold text-slate-400 block mb-2 text-right">
                التوزيع الجغرافي لأماكن الدخول (تصفية الجدول حسب المدينة):
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setSelectedCityFilter("all")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                    selectedCityFilter === "all"
                      ? "bg-[#C5A059] border-[#C5A059] text-slate-950 font-black"
                      : darkMode
                        ? "bg-slate-900 border-slate-800 text-slate-300 hover:text-white"
                        : "bg-slate-100 border-slate-200 text-slate-700"
                  }`}
                >
                  <Map className="w-3.5 h-3.5" />
                  <span>جميع المدن ({rawTimeline.length})</span>
                </button>

                {Object.entries(locationCounts).map(([city, count]) => (
                  <button
                    key={city}
                    onClick={() => setSelectedCityFilter(city)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                      selectedCityFilter === city
                        ? "bg-amber-500 border-amber-500 text-slate-950 font-black"
                        : darkMode
                          ? "bg-slate-900 border-slate-800 text-amber-300/80 hover:text-white"
                          : "bg-amber-50 border-amber-200 text-amber-800"
                    }`}
                  >
                    <MapPin className="w-3.5 h-3.5 text-amber-400" />
                    <span>{city}</span>
                    <span className="bg-amber-500/20 text-amber-400 px-1.5 py-0.2 rounded-md text-[9px] font-mono">
                      {count}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Performance & Paid Ads Campaign Dashboard */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className={`p-4 rounded-3xl border shadow-lg flex flex-col justify-between ${darkMode ? "bg-[#0D1B2A]/80 border-slate-800" : "bg-white border-slate-200"}`}>
              <div className="flex justify-between items-start mb-2">
                <div className="p-2 bg-purple-500/10 text-purple-500 rounded-xl">
                  <Compass className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold px-2 py-1 bg-emerald-500/10 text-emerald-500 rounded-lg flex items-center gap-1">
                  <Activity className="w-3 h-3" /> مباشر
                </span>
              </div>
              <div className="text-right mt-2">
                <h3 className="text-slate-400 text-xs font-bold mb-1">إجمالي زوار الحملات الإعلانية</h3>
                <div className="flex items-baseline gap-2 justify-end">
                  <span className="text-2xl font-black text-purple-500">{rawTimeline.filter(t => t.type === "ad_visitor").length}</span>
                  <span className="text-xs text-slate-500 font-mono">زائر</span>
                </div>
              </div>
            </div>

            <div className={`p-4 rounded-3xl border shadow-lg flex flex-col justify-between ${darkMode ? "bg-[#0D1B2A]/80 border-slate-800" : "bg-white border-slate-200"}`}>
              <div className="flex justify-between items-start mb-2">
                <div className="p-2 bg-sky-500/10 text-sky-500 rounded-xl">
                  <Monitor className="w-5 h-5" />
                </div>
              </div>
              <div className="text-right mt-2">
                <h3 className="text-slate-400 text-xs font-bold mb-1">معدل ارتداد الزوار (Bounce Rate)</h3>
                <div className="flex items-baseline gap-2 justify-end">
                  <span className="text-2xl font-black text-sky-500">24.5%</span>
                  <span className="text-[10px] text-emerald-500 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded">-2%</span>
                </div>
              </div>
            </div>

            <div className={`p-4 rounded-3xl border shadow-lg flex flex-col justify-between ${darkMode ? "bg-[#0D1B2A]/80 border-slate-800" : "bg-white border-slate-200"}`}>
              <div className="flex justify-between items-start mb-2">
                <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-xl">
                  <UserCheck className="w-5 h-5" />
                </div>
              </div>
              <div className="text-right mt-2">
                <h3 className="text-slate-400 text-xs font-bold mb-1">معدل تحويل الزوار إلى عملاء</h3>
                <div className="flex items-baseline gap-2 justify-end">
                  <span className="text-2xl font-black text-emerald-500">12.8%</span>
                  <span className="text-[10px] text-slate-500 font-bold">متوسط</span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-5 rounded-3xl border border-purple-500/30 bg-gradient-to-r from-purple-900/10 via-[#0D1B2A] to-slate-900 shadow-xl text-right mb-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-500/20 text-purple-400 border border-purple-500/40 flex items-center justify-center font-black text-lg shrink-0">
                  🎯
                </div>
                <div>
                  <h4 className="text-sm font-black text-purple-400 flex items-center gap-2">
                    <span>مراقبة وتحليل حركة مرور الإعلانات المدفوعة</span>
                    <span className="bg-purple-500/20 text-purple-300 border border-purple-500/40 text-[9px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
                      تتبع نشط
                    </span>
                  </h4>
                  <p className="text-xs text-slate-300 mt-1.5 leading-relaxed max-w-3xl">
                    يتم تسجيل أي شخص يضغط على إعلانك المدفوع في هذه اللوحة فور دخوله للموقع وقبل أن يقوم بتسجيل حساب أو تسجيل الدخول. النظام يلتقط <strong className="text-purple-300">عناوين IP، الموقع الجغرافي الدقيق، نوع الجهاز والمتصفح، ووسم الحملة الإعلانية (UTM Parameters)</strong>. هذا يساعدك على معرفة ما إذا كانت زيارات الإعلانات حقيقية أم وهمية، وتقييم جودة الاستهداف لحملتك الإعلانية.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedTypeFilter("ad_visitor")}
                className="px-4 py-2.5 rounded-2xl bg-purple-500 hover:bg-purple-600 text-white font-black text-xs transition-all cursor-pointer shrink-0 shadow-lg shadow-purple-500/20 flex items-center gap-2"
              >
                <Compass className="w-4 h-4" />
                <span>فرز زوار الإعلانات فقط</span>
              </button>
            </div>

            <div className="mt-4 pt-3 border-t border-purple-500/20 flex flex-wrap items-center justify-between text-[11px] text-slate-400 gap-2">
              <div className="flex items-center gap-2">
                <span className="font-bold text-amber-400">💡 لتحسين دقة التتبع:</span>
                <span>تأكد من إضافة <code className="bg-slate-900 text-amber-300 px-2 py-0.5 rounded font-mono border border-slate-800" dir="ltr">?utm_source=facebook&utm_campaign=ads</code> في نهاية رابط موقعك داخل منصة الإعلانات.</span>
              </div>
            </div>
          </div>

          {/* Timeline Search & Filter Bar */}
          <div className={`p-4 rounded-3xl border shadow-xl ${
            darkMode ? "bg-[#0D1B2A]/80 border-slate-800" : "bg-white border-slate-200"
          }`}>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-right">
              {/* Search */}
              <div className="md:col-span-2 relative">
                <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="ابحث باسم المستخدم، البريد، المدينة، الـ IP..."
                  value={timelineSearch}
                  onChange={(e) => setTimelineSearch(e.target.value)}
                  className={`w-full pr-10 pl-4 py-2.5 rounded-2xl text-xs outline-none border focus:border-[#C5A059] transition-colors ${
                    darkMode ? "bg-slate-900 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                  }`}
                />
              </div>

              {/* User Filter */}
              <div>
                <select
                  value={selectedUserFilter}
                  onChange={(e) => setSelectedUserFilter(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-2xl text-xs outline-none border focus:border-[#C5A059] transition-colors cursor-pointer ${
                    darkMode ? "bg-slate-900 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                  }`}
                >
                  <option value="all">كل أعضاء فريق العمل</option>
                  {Array.from(new Set(rawTimeline.map(t => t.userName))).map((uName) => (
                    <option key={uName} value={uName}>{uName}</option>
                  ))}
                </select>
              </div>

              {/* Type Filter */}
              <div>
                <select
                  value={selectedTypeFilter}
                  onChange={(e) => setSelectedTypeFilter(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-2xl text-xs outline-none border focus:border-[#C5A059] transition-colors cursor-pointer ${
                    darkMode ? "bg-slate-900 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                  }`}
                >
                  <option value="all">جميع أنواع الوصول والدخول</option>
                  <option value="ad_visitor">🎯 زوار الإعلانات المدفوعة (غير المسجلين)</option>
                  <option value="login">تسجيل دخول كلاسيكي (Login)</option>
                  <option value="logout">تسجيل انصراف (Logout)</option>
                  <option value="entrance">زيارة تفاعلية للموقع (Entrance)</option>
                  <option value="register">حساب جديد (Register)</option>
                  <option value="simulation">زيارات وسجلات تجريبية</option>
                </select>
              </div>
            </div>
          </div>

          {/* Interactive Timeline List */}
          <div className={`p-6 rounded-3xl border shadow-xl ${
            darkMode ? "bg-[#0D1B2A]/80 border-slate-800" : "bg-white border-slate-200"
          }`}>
            <h4 className="text-sm font-black text-[#C5A059] mb-6 flex items-center gap-2 text-right">
              <Clock className="w-4 h-4 text-[#C5A059]" />
              <span>المخطط الزمني للوصول الجغرافي ({filteredTimeline.length} سجل متاح)</span>
            </h4>

            {filteredTimeline.length === 0 ? (
              <div className="py-16 text-center text-slate-500 font-bold space-y-2">
                <UserX className="w-10 h-10 mx-auto text-slate-600 opacity-40" />
                <p className="text-xs">لا توجد سجلات دخول مطابقة لمعايير البحث الحالية.</p>
              </div>
            ) : (
              <div className="relative border-r-2 border-[#C5A059]/30 mr-4 pr-6 space-y-6">
                {filteredTimeline.map((item, index) => {
                  return (
                    <div key={item.id || index} className="relative group">
                      {/* Timeline Dot */}
                      <div className={`absolute -right-[31px] top-1.5 w-4 h-4 rounded-full bg-[#C5A059] border-4 shadow-md group-hover:scale-125 transition-transform ${darkMode ? "border-[#0D1B2A]" : "border-white"}`} />

                      <div className={`p-5 rounded-2xl border transition-all ${
                        darkMode 
                          ? "bg-slate-900/80 border-slate-800 hover:border-[#C5A059]/50" 
                          : "bg-slate-50 border-slate-200 hover:border-[#C5A059]"
                      } shadow-sm`}>
                        
                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 mb-3">
                          
                          {/* User info & Role */}
                          <div className="flex items-center gap-3">
                            {item.type === "ad_visitor" ? (
                              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-lg border ${
                                darkMode 
                                  ? "bg-purple-500/10 text-purple-400 border-purple-500/20" 
                                  : "bg-purple-50 text-purple-600 border-purple-200"
                              }`}>
                                🎯
                              </div>
                            ) : (
                              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm border ${
                                darkMode 
                                  ? "bg-[#C5A059]/10 text-[#C5A059] border-[#C5A059]/20" 
                                  : "bg-[#C5A059]/15 text-[#b08b43] border-[#C5A059]/30"
                              }`}>
                                {item.userName.charAt(0)}
                              </div>
                            )}
                            <div className="text-right">
                              <div className="flex items-center gap-2">
                                <span className={`font-bold text-sm ${darkMode ? "text-white" : "text-slate-900"}`}>{item.userName}</span>
                                {item.type === "ad_visitor" ? (
                                  <span className={`text-[10px] px-2 py-0.5 rounded-md font-semibold border ${
                                    darkMode 
                                      ? "bg-purple-500/20 text-purple-300 border-purple-500/30" 
                                      : "bg-purple-50 text-purple-700 border-purple-200"
                                  }`}>
                                    غير مسجل - من الإعلانات
                                  </span>
                                ) : (
                                  <span className={`text-[10px] px-2 py-0.5 rounded-md font-semibold border ${
                                    darkMode 
                                      ? "bg-[#C5A059]/20 text-[#C5A059] border-[#C5A059]/30" 
                                      : "bg-[#C5A059]/10 text-amber-800 border-[#C5A059]/20"
                                  }`}>
                                    {item.userRole}
                                  </span>
                                )}
                              </div>
                              {item.userEmail && (
                                <span className={`text-[10px] block mt-0.5 font-mono ${
                                  item.type === "ad_visitor" 
                                    ? (darkMode 
                                        ? "text-purple-300 font-bold bg-purple-900/40 inline-block px-1.5 py-0.5 rounded border border-purple-500/20" 
                                        : "text-purple-800 font-bold bg-purple-100/50 inline-block px-1.5 py-0.5 rounded border border-purple-200") 
                                    : (darkMode ? "text-slate-400" : "text-slate-500")
                                }`}>
                                  {item.type === "ad_visitor" ? `UTM: ${item.userEmail}` : item.userEmail}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Badge Type & Timestamp */}
                          <div className="flex items-center gap-2">
                            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border flex items-center gap-1 ${
                              item.type === "ad_visitor"
                                ? (darkMode ? "bg-purple-500/15 text-purple-300 border-purple-500/30" : "bg-purple-50 text-purple-700 border-purple-200")
                                : item.type === "login" 
                                  ? (darkMode ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-emerald-50 text-emerald-700 border-emerald-200")
                                  : item.type === "logout"
                                    ? (darkMode ? "bg-rose-500/10 text-rose-400 border-rose-500/20" : "bg-rose-50 text-rose-700 border-rose-200")
                                    : item.type === "register"
                                      ? (darkMode ? "bg-amber-500/10 text-amber-400 border-amber-500/20" : "bg-amber-50 text-amber-700 border-amber-200")
                                      : item.type === "simulation"
                                        ? (darkMode ? "bg-sky-500/10 text-sky-400 border-sky-500/20" : "bg-sky-50 text-sky-700 border-sky-200")
                                        : (darkMode ? "bg-blue-500/10 text-blue-400 border-blue-500/20" : "bg-blue-50 text-blue-700 border-blue-200")
                            }`}>
                              <Compass className="w-3 h-3" />
                              <span>
                                {item.type === "ad_visitor"
                                  ? "🎯 زائر إعلان مدفوع (غير مسجل)"
                                  : item.type === "login" 
                                    ? "تسجيل دخول" 
                                    : item.type === "logout"
                                      ? "تسجيل انصراف (خروج)"
                                      : item.type === "register" 
                                        ? "تسجيل حساب" 
                                        : item.type === "simulation" 
                                          ? "محاكاة وتبديل" 
                                          : "زيارة وتصفح"}
                              </span>
                            </span>

                            <span className={`text-[10px] font-sans flex items-center gap-1 px-2 py-1 rounded-lg border ${
                              darkMode 
                                ? "text-slate-300 bg-slate-800/40 border-slate-700/40" 
                                : "text-slate-700 bg-slate-100 border-slate-200"
                            }`}>
                              <Clock className="w-3 h-3 text-[#C5A059]" />
                              <span>{item.timestamp}</span>
                            </span>
                          </div>

                        </div>

                        {/* Location and Device details */}
                        <div className={`grid grid-cols-1 md:grid-cols-3 gap-3 pt-3 border-t text-right ${
                          darkMode ? "border-slate-800/50" : "border-slate-100"
                        }`}>
                          
                          {/* Location Card */}
                          <div className={`p-2.5 rounded-xl border flex items-center justify-between ${
                            darkMode 
                              ? "bg-amber-500/5 border-amber-500/15" 
                              : "bg-amber-50/50 border-amber-100"
                          }`}>
                            <div className="flex items-center gap-2">
                              <MapPin className={`w-4 h-4 shrink-0 ${darkMode ? "text-amber-400" : "text-amber-600"}`} />
                              <div>
                                <span className={`text-[9px] block font-bold ${darkMode ? "text-slate-400" : "text-amber-800/70"}`}>الموقع الجغرافي:</span>
                                <span className={`text-xs font-bold ${darkMode ? "text-amber-300" : "text-amber-900"}`}>{item.location || "القاهرة، مصر"}</span>
                              </div>
                            </div>

                            {item.coordinates && (
                              <a
                                href={`https://www.google.com/maps?q=${item.coordinates.lat},${item.coordinates.lng}`}
                                target="_blank"
                                rel="noreferrer"
                                className="px-2 py-1 rounded bg-[#C5A059]/20 hover:bg-[#C5A059] text-[#C5A059] hover:text-slate-950 text-[9px] font-bold transition-all flex items-center gap-1"
                                title="فتح الموقع المباشر في خرائط جوجل"
                              >
                                <Navigation className="w-2.5 h-2.5" />
                                <span>الخريطة</span>
                              </a>
                            )}
                          </div>

                          {/* IP Address Card */}
                          <div className={`p-2.5 rounded-xl border flex items-center gap-2 ${
                            darkMode 
                              ? "bg-slate-800/40 border-slate-700/50" 
                              : "bg-blue-50/30 border-blue-100"
                          }`}>
                            <Globe className={`w-4 h-4 shrink-0 ${darkMode ? "text-blue-400" : "text-blue-600"}`} />
                            <div>
                              <span className={`text-[9px] block font-bold ${darkMode ? "text-slate-400" : "text-blue-800/70"}`}>العنوان الرقمي (IP):</span>
                              <span className={`text-xs font-mono ${darkMode ? "text-slate-200" : "text-slate-900"}`}>{item.ipAddress || "197.38.120.45"}</span>
                            </div>
                          </div>

                          {/* Device Info Card */}
                          <div className={`p-2.5 rounded-xl border flex items-center gap-2 ${
                            darkMode 
                              ? "bg-slate-800/40 border-slate-700/50" 
                              : "bg-emerald-50/30 border-emerald-100"
                          }`}>
                            {item.deviceInfo?.includes("محمول") ? (
                              <Smartphone className={`w-4 h-4 shrink-0 ${darkMode ? "text-emerald-400" : "text-emerald-600"}`} />
                            ) : (
                              <Monitor className={`w-4 h-4 shrink-0 ${darkMode ? "text-purple-400" : "text-purple-600"}`} />
                            )}
                            <div>
                              <span className={`text-[9px] block font-bold ${darkMode ? "text-slate-400" : "text-emerald-800/70"}`}>جهاز الوصول المتصل:</span>
                              <span className={`text-xs font-sans ${darkMode ? "text-slate-200" : "text-slate-900"}`}>{item.deviceInfo || "متصفح حاسوب"}</span>
                            </div>
                          </div>

                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      )}

      {/* TAB 3: DATABASE CONSOLE */}
      {adminTab === "database" && (
      <div className={`p-6 rounded-3xl border shadow-xl ${
        darkMode ? "bg-[#0D1B2A]/80 border-slate-800" : "bg-white border-slate-200"
      }`}>
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6 border-b border-slate-800/40 pb-4">
          <div className="flex items-center gap-3 text-right">
            <div className="w-10 h-10 bg-amber-500/10 text-[#C5A059] rounded-xl flex items-center justify-center text-xl shadow-inner border border-[#C5A059]/20">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-[#C5A059]">لوحة إدارة واستعادة قاعدة البيانات السحابية (SQL & Storage Console)</h3>
              <p className={`text-[10px] mt-0.5 ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                تحكم كامل في فهارس وجداول البيانات المشتركة، تصدير واستيراد النسخ الاحتياطية، وتهيئة النظام بالكامل.
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleRunVacuum}
              disabled={isVacuuming}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
                isVacuuming 
                  ? "bg-slate-800 text-slate-500 border border-slate-700/50 cursor-not-allowed" 
                  : "bg-blue-500/10 hover:bg-blue-500 hover:text-white text-blue-400 border border-blue-500/20"
              }`}
            >
              <Server className="w-3.5 h-3.5" />
              <span>{isVacuuming ? "جاري تحسين الفهارس..." : "تنظيف وتحسين الفهارس (VACUUM)"}</span>
            </button>

            <button
              onClick={handleDownloadBackup}
              className="px-3 py-1.5 rounded-xl text-[10px] font-bold bg-[#C5A059]/10 hover:bg-[#C5A059] hover:text-slate-950 text-[#C5A059] border border-[#C5A059]/20 transition-all flex items-center gap-1 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>تصدير نسخة احتياطية (JSON)</span>
            </button>
          </div>
        </div>

        {/* Vacuum progress simulation */}
        {isVacuuming && (
          <div className="mb-6 p-4 rounded-2xl bg-blue-500/5 border border-blue-500/10 space-y-2 text-right">
            <div className="flex justify-between text-[10px] font-bold text-blue-400">
              <span>جاري محاكاة تحسين وضغط الفهارس (REINDEX & ANALYZE)...</span>
              <span>{vacuumProgress}%</span>
            </div>
            <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
              <div 
                className="bg-blue-500 h-1.5 transition-all duration-150" 
                style={{ width: `${vacuumProgress}%` }}
              />
            </div>
          </div>
        )}

        {showVacuumSuccess && (
          <div className="mb-6 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-[10px] text-emerald-400 font-bold flex items-center gap-2 text-right">
            <Check className="w-4 h-4" />
            <span>تم تنظيف قاعدة البيانات وضغط الملفات والـ Transaction Logs بنجاح! تم تحرير مساحات التخزين وتحسين كفاءة البحث.</span>
          </div>
        )}

        {/* Database Table Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 mb-6">
          {[
            { label: "الموكلين", count: clients.length, color: "text-blue-400", bg: "bg-blue-500/5" },
            { label: "القضايا", count: cases.length, color: "text-amber-400", bg: "bg-amber-500/5" },
            { label: "الجلسات", count: sessions.length, color: "text-emerald-400", bg: "bg-emerald-500/5" },
            { label: "المهام", count: tasks.length, color: "text-indigo-400", bg: "bg-indigo-500/5" },
            { label: "المستندات", count: documents.length, color: "text-violet-400", bg: "bg-violet-500/5" },
            { label: "المقبوضات", count: payments.length, color: "text-rose-400", bg: "bg-rose-500/5" },
            { label: "المصروفات", count: expenses.length, color: "text-teal-400", bg: "bg-teal-500/5" },
            { label: "سجلات الأمان", count: auditLogs.length, color: "text-pink-400", bg: "bg-pink-500/5" }
          ].map((metric, i) => (
            <div key={i} className={`p-3 rounded-xl border border-slate-800/60 ${metric.bg} text-center`}>
              <span className="text-[10px] text-slate-400 block font-bold mb-1">{metric.label}</span>
              <span className={`text-lg font-black ${metric.color}`}>{metric.count}</span>
              <span className="text-[8px] text-slate-500 block mt-0.5">سجل نشط</span>
            </div>
          ))}
        </div>

        {/* Import & Advanced Tools */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-800/40 text-right">
          <div>
            <h4 className="text-xs font-bold text-slate-300 mb-2 flex items-center gap-1.5 justify-start">
              <Upload className="w-4 h-4 text-[#C5A059]" />
              <span>استيراد واستعادة قاعدة البيانات (JSON Import)</span>
            </h4>
            <p className="text-[10px] text-slate-500 mb-3">
              قم بلصق محتويات ملف النسخة الاحتياطية المُصَدَّر سابقاً من نظام ميزان في الحقل أدناه لاستعادة الجداول فوراً.
            </p>
            <div className="flex gap-2">
              <textarea
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder='قم بلصق كود الـ JSON للنسخة الاحتياطية هنا... { "database": "meezan_cloud_db", ... }'
                className={`flex-1 p-2.5 rounded-xl text-[10px] font-mono outline-none border focus:border-[#C5A059] h-20 resize-none ${
                  darkMode ? "bg-slate-900 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                }`}
              />
              <button
                onClick={handleRestoreBackup}
                disabled={!importText.trim()}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer ${
                  importText.trim()
                    ? "bg-[#C5A059] text-slate-950 hover:bg-[#B38E46]"
                    : "bg-slate-800 text-slate-500 border border-slate-700/50 cursor-not-allowed"
                }`}
              >
                <Check className="w-4 h-4" />
                <span>تنفيذ الاستعادة</span>
              </button>
            </div>
            {showImportSuccess && (
              <div className="mt-2 p-2 rounded-lg bg-emerald-500/10 text-emerald-400 text-[10px] font-bold">
                ✓ تم استيراد الجداول والمصروفات وجميع السجلات بنجاح وتحديث النظام!
              </div>
            )}
          </div>

          <div>
            <h4 className="text-xs font-bold text-slate-300 mb-2 flex items-center gap-1.5 justify-start">
              <AlertTriangle className="w-4 h-4 text-rose-500" />
              <span>إجراءات الصيانة الجذرية وقاعدة البيانات (Danger Zone)</span>
            </h4>
            <p className="text-[10px] text-slate-500 mb-4">
              هذه العمليات تمس كامل النظام؛ يمكنك حذف كل السجلات وتهيئة الجداول، أو إعادة تحميل البيانات التجريبية الافتراضية للتجربة.
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowSeedConfirm(true)}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-emerald-500/10 hover:bg-emerald-500 hover:text-slate-950 text-emerald-400 border border-emerald-500/20 transition-all cursor-pointer"
              >
                تحميل السجلات الافتراضية (Seed Data)
              </button>
              
              <button
                onClick={() => setShowWipeConfirm(true)}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-rose-500/10 hover:bg-rose-500 hover:text-white text-rose-500 border border-rose-500/20 transition-all cursor-pointer"
              >
                مسح وتهيئة قاعدة البيانات (Truncate DB)
              </button>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* TAB 4: LEADS */}
      {adminTab === "leads" && (
        <div className={`p-6 rounded-3xl border shadow-xl ${
          darkMode ? "bg-[#0D1B2A]/80 border-slate-800" : "bg-white border-slate-200"
        }`}>
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6 border-b border-slate-800/40 pb-4">
            <div className="flex items-center gap-3 text-right">
              <div className="w-10 h-10 rounded-xl bg-[#C5A059]/20 flex items-center justify-center text-[#C5A059]">
                <Phone className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-black text-white">العملاء المحتملين (Leads)</h2>
                <p className="text-[10px] text-slate-400 mt-1">
                  إدارة طلبات الاستشارة المسجلة من الزوار الجدد
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="text-center px-4 py-2 rounded-xl bg-slate-900/50 border border-slate-800">
                <span className="block text-[10px] text-slate-400 font-bold mb-1">إجمالي الطلبات</span>
                <span className="text-xl font-black text-[#C5A059]">{leads.length}</span>
              </div>
              <div className="text-center px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <span className="block text-[10px] text-emerald-400 font-bold mb-1">تم التواصل</span>
                <span className="text-xl font-black text-emerald-400">{leads.filter(l => l.status === "تم التواصل").length}</span>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-right" dir="rtl">
              <thead className={`text-xs ${darkMode ? "text-slate-400 bg-slate-900/80" : "text-slate-500 bg-slate-50"}`}>
                <tr>
                  <th className="px-4 py-3 rounded-tr-xl">اسم العميل المحتمل</th>
                  <th className="px-4 py-3">رقم الجوال</th>
                  <th className="px-4 py-3">تاريخ التسجيل</th>
                  <th className="px-4 py-3">الحالة</th>
                  <th className="px-4 py-3 rounded-tl-xl text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {leads.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                      لا يوجد عملاء محتملين حالياً
                    </td>
                  </tr>
                ) : (
                  leads.map((lead) => (
                    <tr key={lead.id} className={`border-b ${darkMode ? "border-slate-800/50 hover:bg-slate-800/30" : "border-slate-100 hover:bg-slate-50"}`}>
                      <td className="px-4 py-3 font-bold text-white">{lead.name}</td>
                      <td className="px-4 py-3 text-[#C5A059]" dir="ltr">{lead.phone}</td>
                      <td className="px-4 py-3 text-slate-400">
                        {new Date(lead.createdAt).toLocaleDateString("ar-EG")} - {new Date(lead.createdAt).toLocaleTimeString("ar-EG", { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-md text-[10px] font-bold ${
                          lead.status === "جديد" ? "bg-rose-500/10 text-rose-400" :
                          lead.status === "تم التواصل" ? "bg-emerald-500/10 text-emerald-400" :
                          "bg-slate-500/10 text-slate-400"
                        }`}>
                          {lead.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => {
                              if (!setLeads) return;
                              setLeads(leads.map(l => l.id === lead.id ? { ...l, status: "تم التواصل" } : l));
                            }}
                            className={`px-2 py-1.5 rounded-lg text-[10px] font-bold transition-colors cursor-pointer ${
                              lead.status === "تم التواصل" 
                                ? "bg-slate-800 text-slate-500 opacity-50 cursor-not-allowed" 
                                : "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-slate-950"
                            }`}
                            disabled={lead.status === "تم التواصل"}
                          >
                            <Check className="w-3 h-3 inline-block ml-1" />
                            تم التواصل
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: REAL REGISTERED USERS & SYSTEM ACCOUNTS */}
      {adminTab === "users" && (
        <div className="space-y-6 animate-fade-in text-right" dir="rtl">
          {/* Header */}
          <div className={`p-6 rounded-3xl border shadow-xl ${
            darkMode ? "bg-[#0D1B2A]/80 border-slate-800" : "bg-white border-slate-200"
          }`}>
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center text-[#C5A059]">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h2 className={`text-base font-black ${darkMode ? "text-white" : "text-slate-900"}`}>تحليل وتتبع المستخدمين والعملاء الفعليين</h2>
                  <p className={`text-[10px] mt-1 ${darkMode ? "text-slate-400" : "text-slate-650"}`}>
                    راقب من جرب موقعك، من سجل حساباً حقيقياً، ومعدلات نشاط وتجربة النظام الإداري بالتفصيل
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 bg-[#C5A059]/10 border border-[#C5A059]/20 px-4 py-2.5 rounded-2xl">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-[10px] font-bold text-[#C5A059]">تتبع حي ومباشر لنشاط العملاء</span>
              </div>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className={`p-4 rounded-2xl border ${darkMode ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200"}`}>
              <span className={`text-[10px] font-bold block mb-1 ${darkMode ? "text-slate-400" : "text-slate-600"}`}>إجمالي حسابات المنصة</span>
              <div className="flex items-baseline gap-2">
                <span className={`text-2xl font-black ${darkMode ? "text-white" : "text-slate-900"}`}>{usersList.length}</span>
                <span className={`text-[10px] ${darkMode ? "text-slate-500" : "text-slate-500"}`}>مستخدم</span>
              </div>
            </div>

            <div className={`p-4 rounded-2xl border ${darkMode ? "bg-amber-500/5 border-amber-500/10" : "bg-amber-50/50 border-amber-200"}`}>
              <span className={`text-[10px] font-bold block mb-1 ${darkMode ? "text-[#C5A059]" : "text-amber-800"}`}>العملاء الحقيقيون (مسجلون)</span>
              <div className="flex items-baseline gap-2">
                <span className={`text-2xl font-black ${darkMode ? "text-[#C5A059]" : "text-amber-700"}`}>
                  {usersList.filter(u => u.id !== "usr-super" && u.id !== "usr-owner-1" && u.id !== "usr-lawyer-1" && u.id !== "usr-sec-1").length}
                </span>
                <span className={`text-[10px] ${darkMode ? "text-slate-500" : "text-slate-650"}`}>عميل حقيقي</span>
              </div>
            </div>

            <div className={`p-4 rounded-2xl border ${darkMode ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200"}`}>
              <span className={`text-[10px] font-bold block mb-1 ${darkMode ? "text-slate-400" : "text-slate-600"}`}>الحسابات التجريبية الافتراضية</span>
              <div className="flex items-baseline gap-2">
                <span className={`text-2xl font-black ${darkMode ? "text-white" : "text-slate-900"}`}>4</span>
                <span className={`text-[10px] ${darkMode ? "text-slate-500" : "text-slate-500"}`}>حسابات ديمو</span>
              </div>
            </div>

            <div className={`p-4 rounded-2xl border ${darkMode ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200"}`}>
              <span className={`text-[10px] font-bold block mb-1 ${darkMode ? "text-slate-400" : "text-slate-600"}`}>طلبات الاستشارة الواردة</span>
              <div className="flex items-baseline gap-2">
                <span className={`text-2xl font-black ${darkMode ? "text-emerald-400" : "text-emerald-700"}`}>{leads.length}</span>
                <span className={`text-[10px] ${darkMode ? "text-slate-500" : "text-slate-500"}`}>طلب استشارة</span>
              </div>
            </div>
          </div>

          {/* Section: AD CAMPAIGN & VISIT CONVERSIONS (مردود الزيارات ومعدلات التسجيل للحملات الإعلانية) */}
          <div className={`p-6 rounded-3xl border shadow-xl space-y-6 ${
            darkMode ? "bg-[#0D1B2A]/85 border-slate-800" : "bg-white border-slate-200"
          }`}>
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-slate-800/40 pb-4">
              <div className="space-y-1">
                <span className="bg-purple-500/10 text-purple-400 border border-purple-500/20 text-[9px] px-2.5 py-0.5 rounded-full font-bold">
                  مؤشر الأداء التسويقي (Marketing Analytics ROI) 🎯
                </span>
                <h3 className={`text-base font-black ${darkMode ? "text-white" : "text-slate-900"}`}>
                  مردود حملاتك الإعلانية ومعدل التسجيل الفعلي
                </h3>
                <p className={`text-[10px] ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                  مراقبة تفصيلية لعدد زوار الإعلانات الممولة مقارنة بالذين قاموا بإنشاء حسابات مكاتب ومتابعة هوياتهم وأجهزتهم.
                </p>
              </div>
              
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 bg-emerald-500/5 px-3 py-1.5 rounded-xl border border-emerald-500/10">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>تحديث تلقائي: مستبعد منه زيارات مدير المنصة والافتراضيين 🛡️</span>
              </div>
            </div>

            {/* Sub Metrics for Marketing Return */}
            {(() => {
              // total organic vs ad registrations
              const realUsers = usersList.filter(u => u.id !== "usr-super" && u.id !== "usr-owner-1" && u.id !== "usr-lawyer-1" && u.id !== "usr-sec-1");
              const totalRealRegistered = realUsers.length;
              
              const adRegisteredUsers = realUsers.filter(u => u.referredByAd === true);
              const organicRegisteredUsers = realUsers.filter(u => !u.referredByAd);
              
              // total ad visitors in timeline
              const totalAdVisitors = baseTimeline.filter(t => t.type === "ad_visitor").length;
              const totalOrganicVisitors = baseTimeline.filter(t => t.type === "entrance" && !(t.userRole === "صاحب المكتب" || t.userRole === "مدير المنصة والاشتراكات" || t.userRole === "مدير النظام")).length;
              
              // conversion rate
              const adConversionRate = totalAdVisitors > 0 ? ((adRegisteredUsers.length / totalAdVisitors) * 100).toFixed(1) : "0.0";

              return (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Card 1: Visitors from Ads */}
                    <div className={`p-4 rounded-2xl border ${darkMode ? "bg-slate-900/40 border-slate-800" : "bg-slate-50 border-slate-200"}`}>
                      <div className="flex justify-between items-start">
                        <span className={`text-[10px] font-bold ${darkMode ? "text-slate-400" : "text-slate-600"}`}>زيارات زوار الإعلانات (Visits)</span>
                        <span className="p-1 rounded-lg bg-blue-500/10 text-blue-400 text-xs">🎯</span>
                      </div>
                      <div className="mt-2 flex items-baseline gap-2">
                        <span className={`text-2xl font-black ${darkMode ? "text-white" : "text-slate-900"}`}>{totalAdVisitors}</span>
                        <span className="text-[10px] text-slate-500">نقرة إعلان</span>
                      </div>
                      <p className="text-[9px] text-slate-400 mt-1">من قنوات Google Ads و Facebook Ads</p>
                    </div>

                    {/* Card 2: Registered from Ads */}
                    <div className={`p-4 rounded-2xl border ${darkMode ? "bg-purple-500/5 border-purple-500/10" : "bg-purple-50 border-purple-200"}`}>
                      <div className="flex justify-between items-start">
                        <span className={`text-[10px] font-bold ${darkMode ? "text-purple-400" : "text-purple-700"}`}>الحسابات المسجلة من الإعلانات</span>
                        <span className="p-1 rounded-lg bg-purple-500/10 text-purple-400 text-xs">✨</span>
                      </div>
                      <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-2xl font-black text-purple-400">{adRegisteredUsers.length}</span>
                        <span className="text-[10px] text-slate-500">حساب محامي جديد</span>
                      </div>
                      <p className="text-[9px] text-slate-400 mt-1">أصحاب مكاتب سجلوا تفاعلياً</p>
                    </div>

                    {/* Card 3: Ad Conversion Rate */}
                    <div className={`p-4 rounded-2xl border ${darkMode ? "bg-emerald-500/5 border-emerald-500/10" : "bg-emerald-50 border-emerald-200"}`}>
                      <div className="flex justify-between items-start">
                        <span className={`text-[10px] font-bold ${darkMode ? "text-emerald-400" : "text-emerald-700"}`}>معدل التحويل للإعلانات (CVR)</span>
                        <span className="p-1 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs">📈</span>
                      </div>
                      <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-2xl font-black text-emerald-400">{adConversionRate}%</span>
                        <span className="text-[10px] text-slate-500">نسبة التحويل</span>
                      </div>
                      <p className="text-[9px] text-slate-400 mt-1">معدل التسجيل مقابل عدد نقرات الإعلان</p>
                    </div>

                    {/* Card 4: Organic Signups */}
                    <div className={`p-4 rounded-2xl border ${darkMode ? "bg-slate-900/40 border-slate-800" : "bg-slate-50 border-slate-200"}`}>
                      <div className="flex justify-between items-start">
                        <span className={`text-[10px] font-bold ${darkMode ? "text-slate-400" : "text-slate-600"}`}>المسجلين بشكل طبيعي (Organic)</span>
                        <span className="p-1 rounded-lg bg-amber-500/10 text-[#C5A059] text-xs">🌱</span>
                      </div>
                      <div className="mt-2 flex items-baseline gap-2">
                        <span className={`text-2xl font-black ${darkMode ? "text-white" : "text-slate-900"}`}>{organicRegisteredUsers.length}</span>
                        <span className="text-[10px] text-slate-500">مستخدم طبيعي</span>
                      </div>
                      <p className="text-[9px] text-slate-400 mt-1">عن طريق البحث المباشر أو التوصية</p>
                    </div>
                  </div>

                  {/* Table of Campaign Registered Users details */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className={`text-xs font-black flex items-center gap-2 ${darkMode ? "text-slate-200" : "text-slate-800"}`}>
                        <span>📋 جدول المسجلين الجدد وتفاصيل القنوات التسويقية (Conversions Report)</span>
                      </h4>
                      <span className="text-[10px] bg-[#C5A059]/10 text-[#C5A059] border border-[#C5A059]/20 px-2 py-0.5 rounded-lg">
                        تفاصيل المسجلين الفعليين: {totalRealRegistered} مستخدمين
                      </span>
                    </div>

                    <div className="overflow-x-auto rounded-2xl border border-slate-800/40">
                      <table className="w-full text-right text-xs bg-slate-950/20 backdrop-blur-md" dir="rtl">
                        <thead>
                          <tr className={`border-b text-[10px] font-bold uppercase tracking-wider ${
                            darkMode ? "border-slate-800 text-slate-400 bg-slate-900/50" : "border-slate-200 text-slate-600 bg-slate-50"
                          }`}>
                            <th className="py-3 px-4">الاسم / البريد الإلكتروني</th>
                            <th className="py-3 px-4">نوع الدخول / وسيط الإعلان</th>
                            <th className="py-3 px-4">اسم الحملة الإعلانية (UTM)</th>
                            <th className="py-3 px-4">موقع وجهاز التسجيل</th>
                            <th className="py-3 px-4">تاريخ التسجيل</th>
                            <th className="py-3 px-4 text-center">التفاعل مع المنصة</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/30">
                          {realUsers.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="text-center py-8 text-slate-500">
                                لا يوجد مستخدمين مسجلين حالياً لعرض تفاصيل حملاتهم
                              </td>
                            </tr>
                          ) : (
                            realUsers.map((user) => {
                              // Link user with their timeline logs
                              const userLogs = rawTimeline.filter(t => t.userEmail?.toLowerCase() === user.email?.toLowerCase() || t.userName?.toLowerCase() === user.name?.toLowerCase());
                              const loginCount = userLogs.length;

                              const utmLabel = user.utmSource === "google_ads" ? "🎯 إعلانات جوجل (Google Ads)" :
                                               user.utmSource === "facebook_ads" ? "📱 إعلانات فيسبوك (Facebook)" :
                                               user.utmSource === "ad_campaign" ? "🎯 حملة مدفوعة ممولة" :
                                               user.utmSource === "organic_search" ? "🌱 بحث عضوي (Organic)" :
                                               user.utmSource ? `🔗 إحالة: ${user.utmSource}` : "🌱 بحث مباشر وعضوي";

                              return (
                                <tr key={user.id} className={`transition-colors ${darkMode ? "hover:bg-slate-900/25" : "hover:bg-slate-50"}`}>
                                  {/* Name and email */}
                                  <td className="py-3 px-4">
                                    <div>
                                      <span className={`font-bold block ${darkMode ? "text-white" : "text-slate-900"}`}>{user.name}</span>
                                      <span className="text-[10px] text-slate-400 block font-mono">{user.email}</span>
                                    </div>
                                  </td>

                                  {/* Entry Type */}
                                  <td className="py-3 px-4">
                                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                      user.referredByAd 
                                        ? "bg-purple-500/10 text-purple-400 border border-purple-500/20" 
                                        : "bg-slate-500/10 text-slate-400 border border-slate-500/15"
                                    }`}>
                                      {user.referredByAd ? "🎯 زائر ممول" : "🌱 دخول عضوي"}
                                    </span>
                                  </td>

                                  {/* Campaign Name */}
                                  <td className="py-3 px-4">
                                    <div>
                                      <span className={`font-semibold block text-[10px] ${user.referredByAd ? "text-purple-300" : "text-slate-400"}`}>{utmLabel}</span>
                                      <span className="text-[9px] text-slate-400 block mt-0.5">{user.utmCampaign || "زيارة مباشرة خارج الإعلانات"}</span>
                                    </div>
                                  </td>

                                  {/* Location & Device */}
                                  <td className="py-3 px-4">
                                    <div>
                                      <span className={`font-bold block ${darkMode ? "text-slate-300" : "text-slate-800"}`}>{user.registrationLocation || "القاهرة، مصر"}</span>
                                      <span className="text-[9px] text-slate-400 block mt-0.5">{user.registrationDevice || "متصفح حاسوب"} (IP: {user.registrationIp || "197.38.12.5"})</span>
                                    </div>
                                  </td>

                                  {/* Date */}
                                  <td className="py-3 px-4 text-slate-400 font-mono">
                                    {user.createdAt ? (
                                      <span>
                                        {new Date(user.createdAt).toLocaleDateString("ar-EG")} - {new Date(user.createdAt).toLocaleTimeString("ar-EG", { hour: '2-digit', minute: '2-digit' })}
                                      </span>
                                    ) : (
                                      <span>تاريخ مسبق</span>
                                    )}
                                  </td>

                                  {/* Tries / Active interaction */}
                                  <td className="py-3 px-4 text-center">
                                    <div className="flex flex-col items-center justify-center">
                                      {loginCount > 0 ? (
                                        <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/15 text-[9px] font-black">
                                          نشط ({loginCount} زيارة)
                                        </span>
                                      ) : (
                                        <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/15 text-[9px] font-black">
                                          سجل فقط (بدون زيارات لاحقة)
                                        </span>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Section 1: Real Registered Users Table */}
          <div className={`p-6 rounded-3xl border shadow-xl ${
            darkMode ? "bg-[#0D1B2A]/80 border-slate-800" : "bg-white border-slate-200"
          }`}>
            <h3 className={`text-sm font-black mb-4 flex items-center gap-2 ${darkMode ? "text-white" : "text-slate-900"}`}>
              <CheckCircle className="w-4 h-4 text-emerald-500" />
              <span>قائمة حسابات المكاتب والعملاء الفعليين (المسجلين ذاتياً)</span>
            </h3>

            <p className={`text-xs mb-6 leading-relaxed ${darkMode ? "text-slate-400" : "text-slate-700"}`}>
              هذه هي قائمة الحسابات التي قام أصحاب مكاتب المحاماة أو زوار موقعك بتسجيلها فعلياً عبر صفحة إنشاء حساب جديد بالموقع. نقوم هنا بربطها ببيانات المخطط الزمني للتحقق من تفاعلهم الفعلي.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className={`border-b text-[10px] font-bold uppercase tracking-wider ${
                    darkMode ? "border-slate-800 text-slate-400" : "border-slate-200 text-slate-600"
                  }`}>
                    <th className="pb-3 px-3">العميل / صاحب الحساب الجديد</th>
                    <th className="pb-3 px-3">البريد الإلكتروني</th>
                    <th className="pb-3 px-3">الصلاحية المختارة</th>
                    <th className="pb-3 px-3 text-center">هل جرب وتفاعل مع الموقع؟</th>
                    <th className="pb-3 px-3 text-center">مرات الدخول والتصفح</th>
                    <th className="pb-3 px-3">آخر موقع جغرافي وجهاز</th>
                    <th className="pb-3 px-3 text-left">آخر تاريخ وصول</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {usersList.filter(u => u.id !== "usr-super" && u.id !== "usr-owner-1" && u.id !== "usr-lawyer-1" && u.id !== "usr-sec-1").length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12">
                        <div className="max-w-md mx-auto space-y-3">
                          <span className="text-3xl block">👋</span>
                          <p className={`font-black text-xs ${darkMode ? "text-amber-400" : "text-amber-800"}`}>
                            لا توجد حسابات جديدة مسجلة ذاتياً في النظام حتى الآن
                          </p>
                          <p className={`text-[10px] leading-relaxed ${darkMode ? "text-slate-400" : "text-slate-650"}`}>
                            جميع الزوار يتصفحون الآن أو يستخدمون الحسابات التجريبية الافتراضية. يمكنك بكل سهولة فتح المتصفح الخفي (Incognito Window)، والضغط على <strong>تسجيل الخروج</strong> ثم <strong>إنشاء حساب جديد</strong>، لتجرب العملية بنفسك وستظهر بياناتك المسجلة وتفاصيل موقعك الجغرافي ونشاطك هنا فوراً وفي المخطط الزمني!
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    usersList.filter(u => u.id !== "usr-super" && u.id !== "usr-owner-1" && u.id !== "usr-lawyer-1" && u.id !== "usr-sec-1").map((user) => {
                      // Lookup user logs in timeline
                      const userLogs = rawTimeline.filter(t => t.userEmail?.toLowerCase() === user.email?.toLowerCase() || t.userName?.toLowerCase() === user.name?.toLowerCase());
                      const hasTriedSite = userLogs.length > 0;
                      const loginCount = userLogs.length;
                      const lastLog = userLogs[0]; // Sorted descending by default or newest on top

                      return (
                        <tr key={user.id} className={`transition-colors ${darkMode ? "hover:bg-slate-900/30" : "hover:bg-slate-50"}`}>
                          {/* Name & Avatar */}
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-[#C5A059]/20 text-[#C5A059] flex items-center justify-center font-bold text-[10px] border border-[#C5A059]/30">
                                {user.avatarUrl ? (
                                  <img src={user.avatarUrl} alt={user.name} className="w-full h-full rounded-full object-cover" referrerPolicy="no-referrer" />
                                ) : (
                                  user.name.substring(0, 2)
                                )}
                              </div>
                              <div>
                                <span className={`font-bold block ${darkMode ? "text-white" : "text-slate-900"}`}>{user.name}</span>
                                <span className={`text-[9px] px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-600 border border-amber-500/20 inline-block mt-0.5 font-bold`}>
                                  عميل حقيقي (سجل بالنموذج)
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Email */}
                          <td className="py-3 px-3">
                            <span className={`font-mono ${darkMode ? "text-slate-300" : "text-slate-800"}`}>{user.email}</span>
                          </td>

                          {/* Role */}
                          <td className="py-3 px-3">
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                              user.role === "صاحب المكتب" ? "bg-blue-500/10 text-blue-400" :
                              user.role === "محامي" ? "bg-purple-500/10 text-purple-400" :
                              user.role === "سكرتير" ? "bg-emerald-500/10 text-emerald-400" :
                              "bg-slate-500/10 text-slate-500"
                            }`}>
                              {user.role}
                            </span>
                          </td>

                          {/* Tried site? */}
                          <td className="py-3 px-3 text-center">
                            {hasTriedSite ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600 border border-emerald-500/20">
                                🟢 نعم (تفاعل نشط)
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-600 border border-rose-500/20">
                                🟡 سجل الحساب فقط
                              </span>
                            )}
                          </td>

                          {/* Interaction counts */}
                          <td className="py-3 px-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <span className={`font-black ${darkMode ? "text-white" : "text-slate-900"}`}>{loginCount}</span>
                              <span className={`text-[10px] ${darkMode ? "text-slate-500" : "text-slate-600"}`}>عملية تصفح</span>
                            </div>
                          </td>

                          {/* Geo tracking and Device */}
                          <td className="py-3 px-3">
                            {lastLog ? (
                              <div>
                                <span className={`font-bold block ${darkMode ? "text-slate-300" : "text-slate-850"}`}>{lastLog.location || "الجمهورية، مصر"}</span>
                                <span className="text-[10px] text-slate-400 block mt-0.5">{lastLog.deviceInfo || "متصفح الويب"} (IP: {lastLog.ipAddress})</span>
                              </div>
                            ) : (
                              <span className="text-slate-500 text-[10px]">- لا تتوفر تتبعات IP -</span>
                            )}
                          </td>

                          {/* Last interaction date */}
                          <td className="py-3 px-3 text-left">
                            {lastLog ? (
                              <span className={`font-mono ${darkMode ? "text-slate-400" : "text-slate-700"}`}>
                                {lastLog.timestamp}
                              </span>
                            ) : (
                              <span className="text-slate-500 text-[10px]">-</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 2: Real Consultation Requests (Leads) Explanation */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className={`p-6 rounded-3xl border shadow-xl ${
              darkMode ? "bg-[#0D1B2A]/80 border-slate-800" : "bg-white border-slate-200"
            } text-right space-y-4`}>
              <div className="flex items-center gap-2 text-emerald-500 font-black text-sm">
                <span>📞</span>
                <span className={darkMode ? "text-white" : "text-slate-900"}>طلبات الاستشارة والعملاء المستهدفين (Leads)</span>
              </div>
              <p className={`text-xs leading-relaxed ${darkMode ? "text-slate-300" : "text-slate-700"}`}>
                عندما يزور عملاء حقيقيون موقعك، قد لا يقومون بإنشاء حساب في الحال، بل يضغطون على زر <strong>"طلب استشارة"</strong> العائم لترك أسمائهم وأرقام جوالاتهم للتواصل معهم من قِبل مكتبك.
              </p>
              <div className={`p-4 rounded-2xl border text-xs ${darkMode ? "bg-slate-900/60 border-slate-800 text-slate-300" : "bg-slate-50 border-slate-200 text-slate-800"}`}>
                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold text-[#C5A059]">إجمالي الطلبات المستلمة:</span>
                  <span className={`font-black text-base ${darkMode ? "text-white" : "text-slate-950"}`}>{leads.length} عميل محتمل</span>
                </div>
                <span>
                  يمكنك استعراض أسمائهم وأرقام هواتفهم وتحديث حالة التواصل معهم بكل سهولة من خلال الانتقال إلى تبويب <strong>"العملاء المحتملين (Leads)"</strong> المتاح في القائمة العلوية للوحة التحكم.
                </span>
              </div>
              <button
                onClick={() => setAdminTab("leads")}
                className="w-full py-2.5 rounded-xl text-xs font-bold bg-[#C5A059] text-slate-950 hover:bg-[#B38E46] transition-colors cursor-pointer text-center"
              >
                انتقل لإدارة طلبات الاستشارة الآن ➔
              </button>
            </div>

            {/* Section 3: Reference/Seed Accounts (Demo) */}
            <div className={`p-6 rounded-3xl border shadow-xl ${
              darkMode ? "bg-[#0D1B2A]/80 border-slate-800" : "bg-white border-slate-200"
            } text-right space-y-4`}>
              <div className="flex items-center gap-2 text-[#C5A059] font-black text-sm">
                <span>🛡️</span>
                <span className={darkMode ? "text-white" : "text-slate-900"}>الحسابات الافتراضية والتجريبية للنظام (الديمو)</span>
              </div>
              <p className={`text-xs leading-relaxed ${darkMode ? "text-slate-300" : "text-slate-700"}`}>
                هذه حسابات مرجعية تم تزويد النظام بها مسبقاً للسماح للمقّيمين والمشرفين بتجربة أدوار العمل المختلفة (صاحب مكتب، محام، سكرتارية) دون الحاجة لإنشاء حسابات جديدة في كل مرة.
              </p>
              <div className="overflow-x-auto text-[11px]">
                <table className="w-full text-right" dir="rtl">
                  <thead>
                    <tr className={`border-b ${darkMode ? "border-slate-800 text-slate-400" : "border-slate-200 text-slate-600"}`}>
                      <th className="pb-2">اسم الحساب الافتراضي</th>
                      <th className="pb-2">البريد الإلكتروني</th>
                      <th className="pb-2 text-[#C5A059]">مستوى الأمان وحالة الحساب</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className={`py-1.5 font-bold ${darkMode ? "text-white" : "text-slate-900"}`}>الأستاذ رئيس المكتب</td>
                      <td className="font-mono text-slate-400">owner@lawmizan.com</td>
                      <td className="text-emerald-500 font-bold text-xs flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                        مجزأة ومشفرة (bcrypt)
                      </td>
                    </tr>
                    <tr>
                      <td className={`py-1.5 font-bold ${darkMode ? "text-white" : "text-slate-900"}`}>محامي الاستشارات</td>
                      <td className="font-mono text-slate-400">lawyer@lawmizan.com</td>
                      <td className="text-emerald-500 font-bold text-xs flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                        مجزأة ومشفرة (bcrypt)
                      </td>
                    </tr>
                    <tr>
                      <td className={`py-1.5 font-bold ${darkMode ? "text-white" : "text-slate-900"}`}>أحمد عبد المجيد (السكرتارية)</td>
                      <td className="font-mono text-slate-400">sec@lawmizan.com</td>
                      <td className="text-emerald-500 font-bold text-xs flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                        مجزأة ومشفرة (bcrypt)
                      </td>
                    </tr>
                    <tr>
                      <td className={`py-1.5 font-bold ${darkMode ? "text-white" : "text-slate-900"}`}>مدير المنصة والاشتراكات</td>
                      <td className="font-mono text-slate-400">superuser@lawmizan.com</td>
                      <td className="text-amber-500 font-bold text-xs flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />
                        مجزأة ومشفرة (bcrypt)
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Manual payment modal */}
      <AnimatePresence>
        {showPaymentModal && selectedOffice && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`w-full max-w-md p-6 rounded-3xl border shadow-2xl text-right ${
                darkMode ? "bg-[#0D1B2A] border-slate-800 text-white" : "bg-white border-slate-200 text-slate-800"
              }`}
            >
              <div className="flex items-center justify-between border-b pb-3 mb-4 border-slate-800">
                <h3 className="font-black text-sm text-[#C5A059] flex items-center gap-2">
                  <span>💰</span>
                  <span>تسجيل استلام مبلغ بالجنيه المصري يدويًا</span>
                </h3>
                <button 
                  onClick={() => setShowPaymentModal(false)}
                  className="text-slate-400 hover:text-white font-bold text-md cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                  <span className="text-slate-400 block">تسجيل تحصيل لصالح:</span>
                  <span className="font-bold text-white block mt-1">{selectedOffice.name}</span>
                  <span className="text-[10px] text-slate-500 mt-0.5 block">الباقة: {selectedOffice.planId === "basic" ? "المحامي الفردي" : selectedOffice.planId === "pro" ? "المكتب المشترك" : "النخبة"}</span>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1.5">القيمة المستلمة بالجنيه المصري (ج.م):</label>
                  <input
                    type="number"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(Number(e.target.value))}
                    className={`w-full px-4 py-2 rounded-xl text-xs outline-none border focus:border-[#C5A059] ${
                      darkMode ? "bg-slate-900 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1.5">وسيلة الدفع:</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: "instapay", label: "إنستاباي (InstaPay)" },
                      { id: "vodafone", label: "فودافون كاش" },
                      { id: "card", label: "فيزا / ماستركارد" }
                    ].map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setPaymentMethod(m.id as any)}
                        className={`py-2 rounded-lg text-[9px] font-bold border transition-colors cursor-pointer text-center ${
                          paymentMethod === m.id
                            ? "bg-[#C5A059]/20 border-[#C5A059] text-[#C5A059]"
                            : darkMode
                              ? "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
                              : "bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1.5">ملاحظات التحصيل (تظهر للمحامي):</label>
                  <textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="مثال: تم الاستلام عبر فودافون كاش وتأكيد العملية بنجاح."
                    rows={2}
                    className={`w-full p-3 rounded-xl text-xs outline-none border focus:border-[#C5A059] ${
                      darkMode ? "bg-slate-900 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                    }`}
                  />
                </div>
              </div>

              <div className="flex gap-2.5 mt-6 pt-3 border-t border-slate-800">
                <button
                  onClick={handleRecordPaymentSubmit}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-[#C5A059] hover:bg-[#B38E46] text-slate-950 transition-colors cursor-pointer"
                >
                  تسجيل وتأكيد تفعيل الباقة
                </button>
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer border border-slate-700"
                >
                  إلغاء
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Internal system receipts log modal */}
      <AnimatePresence>
        {showLogModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`w-full max-w-3xl p-6 rounded-3xl border shadow-2xl text-right ${
                darkMode ? "bg-[#0D1B2A] border-slate-800 text-white" : "bg-white border-slate-200 text-slate-800"
              }`}
            >
              <div className="flex items-center justify-between border-b pb-3 mb-4 border-slate-800">
                <h3 className="font-black text-sm text-[#C5A059] flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5" />
                  <span>سجل المعاملات والتحصيلات اليدوية لمنصة ميزان</span>
                </h3>
                <button 
                  onClick={() => setShowLogModal(false)}
                  className="text-slate-400 hover:text-white font-bold text-md cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="max-h-[350px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                {JSON.parse(localStorage.getItem("meezan_admin_receipts") || "[]").length === 0 ? (
                  <div className="text-center py-12 text-slate-500 font-bold text-xs">
                    لم يتم تسجيل أي تحصيلات أو معاملات مالية يدوية بعد.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-right text-xs min-w-[500px]">
                      <thead>
                        <tr className="text-slate-400 border-b border-slate-800 pb-2 font-bold text-[10px]">
                          <th className="pb-2">رقم العملية</th>
                          <th className="pb-2">مكتب المحاماة</th>
                          <th className="pb-2 text-center">المبلغ المستلم</th>
                          <th className="pb-2">الوسيلة</th>
                          <th className="pb-2">التاريخ</th>
                          <th className="pb-2 text-left">ملاحظات المسؤول</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/30">
                        {JSON.parse(localStorage.getItem("meezan_admin_receipts") || "[]").map((rec: any, idx: number) => (
                          <tr key={rec.id} className="hover:bg-slate-900/40">
                            <td className="py-2.5 font-mono text-[10px] text-[#C5A059]">{idx + 1}</td>
                            <td className="py-2.5 font-bold text-slate-200">{rec.officeName}</td>
                            <td className="py-2.5 text-center font-bold text-emerald-400">{rec.amount} ج.م</td>
                            <td className="py-2.5">
                              <span className="px-2 py-0.5 rounded-md bg-slate-800 text-[9px] font-bold">
                                {rec.method === "instapay" ? "إنستاباي" : rec.method === "vodafone" ? "فودافون كاش" : "فيزا/ماستركارد"}
                              </span>
                            </td>
                            <td className="py-2.5 text-[10px] font-mono text-slate-400">{rec.date}</td>
                            <td className="py-2.5 text-left text-slate-400 truncate max-w-[200px]" title={rec.notes}>
                              {rec.notes}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="flex justify-end mt-6 pt-3 border-t border-slate-800">
                <button
                  onClick={() => setShowLogModal(false)}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-[#C5A059] hover:bg-[#B38E46] text-slate-950 transition-colors cursor-pointer"
                >
                  إغلاق السجل
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ADD OFFICE MODAL */}
      <AnimatePresence>
        {showAddOfficeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`w-full max-w-lg p-6 rounded-3xl border shadow-2xl text-right ${
                darkMode ? "bg-[#0D1B2A] border-slate-800 text-white" : "bg-white border-slate-200 text-slate-800"
              }`}
            >
              <div className="flex items-center justify-between border-b pb-3 mb-4 border-slate-800/40">
                <h3 className="font-black text-sm text-[#C5A059] flex items-center gap-2">
                  <PlusCircle className="w-5 h-5" />
                  <span>إضافة مكتب محاماة مشترك جديد للمنصة</span>
                </h3>
                <button 
                  onClick={() => setShowAddOfficeModal(false)}
                  className="text-slate-400 hover:text-white font-bold text-md cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-300 mb-1">اسم مكتب المحاماة:</label>
                  <input
                    type="text"
                    value={newOfficeName}
                    onChange={(e) => setNewOfficeName(e.target.value)}
                    placeholder="مثال: مكتب النخبة للمحاماة والاستشارات"
                    className={`w-full px-3 py-2 rounded-xl text-xs outline-none border focus:border-[#C5A059] ${
                      darkMode ? "bg-slate-900 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-300 mb-1">اسم المحامي الرئيسي:</label>
                  <input
                    type="text"
                    value={newOfficeLawyer}
                    onChange={(e) => setNewOfficeLawyer(e.target.value)}
                    placeholder="مثال: أ. محمد محمود الكردي"
                    className={`w-full px-3 py-2 rounded-xl text-xs outline-none border focus:border-[#C5A059] ${
                      darkMode ? "bg-slate-900 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-300 mb-1">الهاتف:</label>
                  <input
                    type="text"
                    value={newOfficePhone}
                    onChange={(e) => setNewOfficePhone(e.target.value)}
                    placeholder="01012345678"
                    className={`w-full px-3 py-2 rounded-xl text-xs outline-none border focus:border-[#C5A059] ${
                      darkMode ? "bg-slate-900 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-300 mb-1">البريد الإلكتروني:</label>
                  <input
                    type="email"
                    value={newOfficeEmail}
                    onChange={(e) => setNewOfficeEmail(e.target.value)}
                    placeholder="office@example.com"
                    className={`w-full px-3 py-2 rounded-xl text-xs outline-none border focus:border-[#C5A059] ${
                      darkMode ? "bg-slate-900 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-300 mb-1">باقة الاشتراك:</label>
                  <select
                    value={newOfficePlan}
                    onChange={(e) => setNewOfficePlan(e.target.value as any)}
                    className={`w-full px-3 py-2 rounded-xl text-xs outline-none border focus:border-[#C5A059] ${
                      darkMode ? "bg-slate-900 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                    }`}
                  >
                    <option value="basic">المحامي الفردي (150 ج.م / شهرياً)</option>
                    <option value="pro">المكتب المشترك (350 ج.م / شهرياً)</option>
                    <option value="elite">النخبة الكبرى (700 ج.م / شهرياً)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-300 mb-1">حالة الوصول الفورية:</label>
                  <select
                    value={newOfficeStatus}
                    onChange={(e) => setNewOfficeStatus(e.target.value as any)}
                    className={`w-full px-3 py-2 rounded-xl text-xs outline-none border focus:border-[#C5A059] ${
                      darkMode ? "bg-slate-900 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                    }`}
                  >
                    <option value="trial">فترة تجريبية مجانية (Trial)</option>
                    <option value="active">مفتوح ومدفوع (Active)</option>
                    <option value="expired">مغلق ومجمد (Expired)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-300 mb-1">إجمالي المبالغ المدفوعة (ج.م):</label>
                  <input
                    type="number"
                    value={newOfficePaid}
                    onChange={(e) => setNewOfficePaid(Number(e.target.value))}
                    className={`w-full px-3 py-2 rounded-xl text-xs outline-none border focus:border-[#C5A059] ${
                      darkMode ? "bg-slate-900 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                    }`}
                  />
                </div>
              </div>

              <div className="flex gap-2.5 mt-6 pt-3 border-t border-slate-800/40">
                <button
                  onClick={handleAddOfficeSubmit}
                  disabled={!newOfficeName || !newOfficeLawyer}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    newOfficeName && newOfficeLawyer
                      ? "bg-[#C5A059] hover:bg-[#B38E46] text-slate-950"
                      : "bg-slate-800 text-slate-500 border border-slate-700/50 cursor-not-allowed"
                  }`}
                >
                  إضافة المكتب وحفظه بالسجلات
                </button>
                <button
                  onClick={() => setShowAddOfficeModal(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer border border-slate-700"
                >
                  إلغاء
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* EDIT OFFICE MODAL */}
      <AnimatePresence>
        {showEditOfficeModal && editingOffice && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`w-full max-w-lg p-6 rounded-3xl border shadow-2xl text-right ${
                darkMode ? "bg-[#0D1B2A] border-slate-800 text-white" : "bg-white border-slate-200 text-slate-800"
              }`}
            >
              <div className="flex items-center justify-between border-b pb-3 mb-4 border-slate-800/40">
                <h3 className="font-black text-sm text-[#C5A059] flex items-center gap-2">
                  <Edit className="w-5 h-5" />
                  <span>تعديل بيانات مكتب المحاماة</span>
                </h3>
                <button 
                  onClick={() => {
                    setShowEditOfficeModal(false);
                    setEditingOffice(null);
                  }}
                  className="text-slate-400 hover:text-white font-bold text-md cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-300 mb-1">اسم مكتب المحاماة:</label>
                  <input
                    type="text"
                    value={editingOffice.name}
                    onChange={(e) => setEditingOffice({ ...editingOffice, name: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl text-xs outline-none border focus:border-[#C5A059] ${
                      darkMode ? "bg-slate-900 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-300 mb-1">اسم المحامي الرئيسي:</label>
                  <input
                    type="text"
                    value={editingOffice.lawyerName}
                    onChange={(e) => setEditingOffice({ ...editingOffice, lawyerName: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl text-xs outline-none border focus:border-[#C5A059] ${
                      darkMode ? "bg-slate-900 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-300 mb-1">الهاتف:</label>
                  <input
                    type="text"
                    value={editingOffice.phone}
                    onChange={(e) => setEditingOffice({ ...editingOffice, phone: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl text-xs outline-none border focus:border-[#C5A059] ${
                      darkMode ? "bg-slate-900 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-300 mb-1">البريد الإلكتروني:</label>
                  <input
                    type="email"
                    value={editingOffice.email}
                    onChange={(e) => setEditingOffice({ ...editingOffice, email: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl text-xs outline-none border focus:border-[#C5A059] ${
                      darkMode ? "bg-slate-900 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-300 mb-1">باقة الاشتراك:</label>
                  <select
                    value={editingOffice.planId}
                    onChange={(e) => setEditingOffice({ ...editingOffice, planId: e.target.value as any })}
                    className={`w-full px-3 py-2 rounded-xl text-xs outline-none border focus:border-[#C5A059] ${
                      darkMode ? "bg-slate-900 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                    }`}
                  >
                    <option value="basic">المحامي الفردي (150 ج.م)</option>
                    <option value="pro">المكتب المشترك (350 ج.م)</option>
                    <option value="elite">النخبة الكبرى (700 ج.م)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-300 mb-1">حالة الدخول والوصول:</label>
                  <select
                    value={editingOffice.status}
                    onChange={(e) => setEditingOffice({ ...editingOffice, status: e.target.value as any })}
                    className={`w-full px-3 py-2 rounded-xl text-xs outline-none border focus:border-[#C5A059] ${
                      darkMode ? "bg-slate-900 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                    }`}
                  >
                    <option value="trial">فترة تجريبية (Trial)</option>
                    <option value="active">نشط ومفتوح (Active)</option>
                    <option value="expired">مغلق ومجمد (Expired)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-300 mb-1">إجمالي الدفعات المحصلة (ج.م):</label>
                  <input
                    type="number"
                    value={editingOffice.amountPaid}
                    onChange={(e) => setEditingOffice({ ...editingOffice, amountPaid: Number(e.target.value) })}
                    className={`w-full px-3 py-2 rounded-xl text-xs outline-none border focus:border-[#C5A059] ${
                      darkMode ? "bg-slate-900 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                    }`}
                  />
                </div>
              </div>

              {editingOffice.isCurrent && (
                <div className="mt-4 p-3 rounded-2xl bg-amber-500/5 border border-amber-500/10 text-[10px] text-amber-500">
                  ⚠️ تنبيه: هذا هو حساب مكتبك الحالي. تعديل هذه البيانات وتغيير الحالة سيؤثر مباشرة على جلسة عملك النشطة.
                </div>
              )}

              <div className="flex gap-2.5 mt-6 pt-3 border-t border-slate-800/40">
                <button
                  onClick={handleEditOfficeSubmit}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-[#C5A059] hover:bg-[#B38E46] text-slate-950 transition-colors cursor-pointer"
                >
                  حفظ وتحديث التغييرات
                </button>
                <button
                  onClick={() => {
                    setShowEditOfficeModal(false);
                    setEditingOffice(null);
                  }}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer border border-slate-700"
                >
                  إلغاء
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DELETE CONFIRM MODAL */}
      <AnimatePresence>
        {showDeleteModal && officeToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`w-full max-w-sm p-6 rounded-3xl border shadow-2xl text-right ${
                darkMode ? "bg-[#0D1B2A] border-slate-800 text-white" : "bg-white border-slate-200 text-slate-800"
              }`}
            >
              <div className="text-center space-y-4">
                <div className="w-12 h-12 bg-rose-500/10 text-rose-500 rounded-2xl flex items-center justify-center text-2xl mx-auto border border-rose-500/20">
                  ⚠️
                </div>
                <div>
                  <h3 className="font-black text-sm text-slate-100">تأكيد حذف مكتب المشترك</h3>
                  <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
                    هل أنت متأكد تماماً من رغبتك في حذف <strong>"{officeToDelete.name}"</strong> من سجلات النظام؟
                  </p>
                  <p className="text-[10px] text-rose-400 font-bold mt-1">
                    هذا الإجراء سيقوم بإزالة بيانات الاشتراك والمبالغ المدفوعة نهائياً ولا يمكن الرجوع عنه!
                  </p>
                </div>
              </div>

              <div className="flex gap-2.5 mt-6 pt-3 border-t border-slate-800/40">
                <button
                  onClick={handleDeleteOfficeConfirm}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-rose-500 hover:bg-rose-600 text-white transition-colors cursor-pointer"
                >
                  نعم، احذف المكتب
                </button>
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setOfficeToDelete(null);
                  }}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer border border-slate-700"
                >
                  تراجع وإلغاء
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* WIPE DATABASE CONFIRM MODAL */}
      <AnimatePresence>
        {showWipeConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`w-full max-w-sm p-6 rounded-3xl border shadow-2xl text-right ${
                darkMode ? "bg-[#0D1B2A] border-slate-800 text-white" : "bg-white border-slate-200 text-slate-800"
              }`}
            >
              <div className="text-center space-y-4">
                <div className="w-12 h-12 bg-rose-500/20 text-rose-500 rounded-2xl flex items-center justify-center text-2xl mx-auto border border-rose-500/30">
                  🚨
                </div>
                <div>
                  <h3 className="font-black text-sm text-rose-500">تهيئة وحذف كامل قاعدة البيانات</h3>
                  <p className="text-[11px] text-slate-300 mt-2 leading-relaxed">
                    تحذير أمني مطلق! أنت على وشك مسح جميع الموكلين، القضايا، الجلسات، المهام، المستندات، المعاملات المالية بالكامل من تخزين المتصفح المشترك.
                  </p>
                  <p className="text-[10px] text-rose-400 font-bold mt-1">
                    هذا العمل يؤدي لحذف كلي فوري لجميع المدخلات! هل تود المتابعة؟
                  </p>
                </div>
              </div>

              <div className="flex gap-2.5 mt-6 pt-3 border-t border-slate-800/40">
                <button
                  onClick={handleWipeDatabase}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white transition-colors cursor-pointer"
                >
                  نعم، امسح كل شيء
                </button>
                <button
                  onClick={() => setShowWipeConfirm(false)}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer border border-slate-700"
                >
                  تراجع
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* SEED DATABASE CONFIRM MODAL */}
      <AnimatePresence>
        {showSeedConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`w-full max-w-sm p-6 rounded-3xl border shadow-2xl text-right ${
                darkMode ? "bg-[#0D1B2A] border-slate-800 text-white" : "bg-white border-slate-200 text-slate-800"
              }`}
            >
              <div className="text-center space-y-4">
                <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 rounded-2xl flex items-center justify-center text-2xl mx-auto border border-emerald-500/20">
                  🌱
                </div>
                <div>
                  <h3 className="font-black text-sm text-emerald-400">تحميل واستعادة السجلات التجريبية</h3>
                  <p className="text-[11px] text-slate-300 mt-2 leading-relaxed">
                    سيرجع هذا الخيار قاعدة البيانات إلى حالتها الأصلية مع تحميل مجموعة غنية من الموكلين، القضايا، الجلسات والمهام الافتراضية المناسبة للتجربة والتدريب.
                  </p>
                  <p className="text-[10px] text-amber-400 font-bold mt-1">
                    سيتم استبدال البيانات الحالية بالبيانات الافتراضية المصنفة للبرنامج.
                  </p>
                </div>
              </div>

              <div className="flex gap-2.5 mt-6 pt-3 border-t border-slate-800/40">
                <button
                  onClick={handleSeedDatabase}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-slate-950 transition-colors cursor-pointer"
                >
                  نعم، حمّل البيانات الافتراضية
                </button>
                <button
                  onClick={() => setShowSeedConfirm(false)}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer border border-slate-700"
                >
                  إلغاء
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
