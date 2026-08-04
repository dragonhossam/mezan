/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import TopDropdownNav from "./components/TopDropdownNav";
import DashboardView from "./components/DashboardView";
import MenuView from "./components/MenuView";
import ClientsView from "./components/ClientsView";
import CasesView from "./components/CasesView";
import SessionsView from "./components/SessionsView";
import TasksView from "./components/TasksView";
import DocumentsView from "./components/DocumentsView";
import FinancialView from "./components/FinancialView";
import ExpensesView from "./components/ExpensesView";
import ReportsView from "./components/ReportsView";
import SettingsView from "./components/SettingsView";
import SubscriptionView from "./components/SubscriptionView";
import AdminPanel from "./components/AdminPanel";
import AuthView from "./components/AuthView";
import EntranceToast from "./components/EntranceToast";
import EntranceNotificationsModal from "./components/EntranceNotificationsModal";
import TutorialVideoModal from "./components/TutorialVideoModal";
import LeadCaptureModal from "./components/LeadCaptureModal";
import OnboardingModal from "./components/OnboardingModal";

import { 
  initialUsers, 
  initialOfficeConfig, 
  initialClients, 
  initialCases, 
  initialSessions, 
  initialTasks, 
  initialDocuments, 
  initialPayments, 
  initialExpenses, 
  initialAuditLogs 
} from "./data/initialData";

import { 
  User as UserType, 
  UserRole, 
  Client, 
  Case, 
  Session, 
  Task, 
  Document, 
  Payment, 
  Expense, 
  OfficeConfig, 
  AuditLog, 
  EntranceNotification,
  CaseStatus,
  TimelineEvent,
  TaskStatus,
  TaskPriority,
  DocumentVersion,
  CommunicationLog,
  UserSubscription,
  SubscriptionInvoice,
  Lead
} from "./types";

import { isBcryptHash, hashPassword } from "./lib/auth";

export default function App() {
  // Authentication & Login State
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    const saved = localStorage.getItem("meezan_is_logged_in");
    return saved === "true";
  });

  // Global States
  const [currentUser, setCurrentUser] = useState<UserType>(() => {
    const saved = localStorage.getItem("meezan_current_user");
    return saved ? JSON.parse(saved) : initialUsers[0];
  });
  const [usersList, setUsersList] = useState<UserType[]>(() => {
    const saved = localStorage.getItem("meezan_users_list");
    let list: UserType[] = saved ? JSON.parse(saved) : initialUsers;
    if (!list.some((u) => !u.isSuperUser && u.id !== "usr-super" && u.role !== UserRole.SuperAdmin)) {
      list = initialUsers;
      localStorage.setItem("meezan_users_list", JSON.stringify(list));
    }
    return list;
  });
  const [officeConfig, setOfficeConfig] = useState<OfficeConfig>(() => {
    const saved = localStorage.getItem("meezan_office_config");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.officeName && (parsed.officeName.includes("الشافعي") || parsed.officeName.includes("أحمد الشافعي"))) {
          parsed.officeName = "مكتب المحاماة والاستشارات القانونية";
        }
        return parsed;
      } catch {
        return initialOfficeConfig;
      }
    }
    return initialOfficeConfig;
  });
  const [clients, setClients] = useState<Client[]>(() => {
    const saved = localStorage.getItem("meezan_clients");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return initialClients;
  });
  const [cases, setCases] = useState<Case[]>(() => {
    const saved = localStorage.getItem("meezan_cases");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return initialCases;
  });
  const [sessions, setSessions] = useState<Session[]>(() => {
    const saved = localStorage.getItem("meezan_sessions");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return initialSessions;
  });
  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem("meezan_tasks");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return initialTasks;
  });
  const [documents, setDocuments] = useState<Document[]>(() => {
    const saved = localStorage.getItem("meezan_documents");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return initialDocuments;
  });
  const [payments, setPayments] = useState<Payment[]>(() => {
    const saved = localStorage.getItem("meezan_payments");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return initialPayments;
  });
  const [expenses, setExpenses] = useState<Expense[]>(() => {
    const saved = localStorage.getItem("meezan_expenses");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return initialExpenses;
  });
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    const saved = localStorage.getItem("meezan_audit_logs");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return initialAuditLogs;
  });

  const [leads, setLeads] = useState<Lead[]>(() => {
    const saved = localStorage.getItem("meezan_leads");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return [
      {
        id: "lead-1",
        name: "أحمد رأفت الدسوقي",
        phone: "01092837465",
        createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
        status: "جديد"
      },
      {
        id: "lead-2",
        name: "مي محمد عبد اللطيف",
        phone: "01283749201",
        createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
        status: "تم التواصل"
      },
      {
        id: "lead-3",
        name: "المستشار يوسف الشافعي",
        phone: "01128374623",
        createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
        status: "جديد"
      },
      {
        id: "lead-4",
        name: "مهندس شريف الهواري",
        phone: "01592837411",
        createdAt: new Date(Date.now() - 3600000 * 72).toISOString(),
        status: "تم التواصل"
      },
      {
        id: "lead-5",
        name: "أ. نادية عبد الرحمن",
        phone: "01029384756",
        createdAt: new Date(Date.now() - 3600000 * 120).toISOString(),
        status: "جديد"
      }
    ];
  });

  // Entrance Notifications & Visits State
  const [entranceNotifications, setEntranceNotifications] = useState<EntranceNotification[]>(() => {
    const saved = localStorage.getItem("meezan_entrance_notifications");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // use default
      }
    }
    return [
      {
        id: "notif-init-1",
        userName: "مدير المنصة والاشتراكات (Super Admin)",
        userRole: UserRole.SuperAdmin,
        userEmail: "superuser@lawmizan.com",
        timestamp: new Date().toLocaleTimeString("ar-EG", { hour: '2-digit', minute: '2-digit' }) + ' - ' + new Date().toLocaleDateString("ar-EG"),
        ipAddress: "197.38.120.45",
        deviceInfo: "حاسوب محمول (Chrome/Linux)",
        isRead: false,
        type: "login"
      }
    ];
  });
  const [activeEntranceToast, setActiveEntranceToast] = useState<EntranceNotification | null>(null);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState<boolean>(false);
  
  // Server data synchronization states
  const [isDataLoaded, setIsDataLoaded] = useState<boolean>(false);
  const [syncStatus, setSyncStatus] = useState<"synced" | "saving" | "error">("synced");

  // Play audio chime on new notification
  const playNotificationChime = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch (e) {
      // audio error handling
    }
  };

  // Trigger new Entrance Notification with Geolocation
  const triggerEntranceNotification = (
    userName: string, 
    userRole: string | UserRole, 
    userEmail?: string, 
    type: "login" | "entrance" | "register" | "simulation" | "ad_visitor" | "logout" = "login"
  ) => {
    const persistNotificationToServer = (notif: EntranceNotification) => {
      fetch("/api/log-entrance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(notif)
      }).catch(err => console.error("Failed to persist notification on server:", err));
    };

    // Check if we should exclude manager/admin/owner logins from timeline & stats
    const isOwnerOrAdmin = userRole === "صاحب المكتب" || 
                           userRole === "مدير المنصة والاشتراكات" || 
                           userRole === "مدير النظام" || 
                           userEmail === "superuser@lawmizan.com" || 
                           userName === "مدير النظام" || 
                           userName === "صاحب المكتب" ||
                           (typeof userName === "string" && userName.includes("مدير"));
                           
    const excludeMyVisits = localStorage.getItem("meezan_exclude_my_visits") === "true";
    
    if (isOwnerOrAdmin && excludeMyVisits) {
      console.log("Skipping notification and statistics logging for admin/owner:", userName);
      return;
    }

    const nowStr = new Date().toLocaleTimeString("ar-EG", { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' - ' + new Date().toLocaleDateString("ar-EG");
    const ip = "197.38." + Math.floor(Math.random() * 200 + 10) + "." + Math.floor(Math.random() * 250);
    const device = typeof navigator !== "undefined" && navigator.userAgent.includes("Mobile") ? "هاتف محمول" : "متصفح حاسوب";
    
    // Default estimated location (Egypt regions)
    const egyptianCities = ["القاهرة، مصر", "الجيزة، مصر", "الإسكندرية، مصر", "المنصورة، مصر", "طنطا، مصر", "أسيوط، مصر"];
    const fallbackCity = egyptianCities[Math.floor(Math.random() * egyptianCities.length)];

    const notifId = `notif-${Date.now()}`;
    const initialNotif: EntranceNotification = {
      id: notifId,
      userName,
      userRole,
      userEmail,
      timestamp: nowStr,
      ipAddress: ip,
      deviceInfo: device,
      location: fallbackCity,
      isRead: false,
      type
    };

    setEntranceNotifications((prev) => {
      const updated = [initialNotif, ...prev];
      localStorage.setItem("meezan_entrance_notifications", JSON.stringify(updated));
      return updated;
    });

    setActiveEntranceToast(initialNotif);
    playNotificationChime();
    persistNotificationToServer(initialNotif);

    // Try HTML5 Browser Geolocation
    if (typeof navigator !== "undefined" && "geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          let resolvedLocation = `مصر (${lat.toFixed(4)}, ${lng.toFixed(4)})`;

          try {
            // Attempt reverse geocode via Nominatim OSM
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=ar`);
            if (res.ok) {
              const data = await res.json();
              const city = data.address?.city || data.address?.town || data.address?.state || data.address?.suburb || "مصر";
              const country = data.address?.country || "مصر";
              resolvedLocation = `${city}، ${country}`;
            }
          } catch {
            // fallback stays
          }

          const updatedNotifWithCoords: EntranceNotification = {
            ...initialNotif,
            location: resolvedLocation,
            coordinates: { lat, lng }
          };

          setEntranceNotifications((prev) => {
            const updated = prev.map(n => n.id === notifId ? updatedNotifWithCoords : n);
            localStorage.setItem("meezan_entrance_notifications", JSON.stringify(updated));
            return updated;
          });

          setActiveEntranceToast(updatedNotifWithCoords);
          persistNotificationToServer(updatedNotifWithCoords);
        },
        () => {
          // Geolocation denied or timed out, fallback city remains
        },
        { timeout: 5000, enableHighAccuracy: false }
      );
    }

    // Also log activity in audit logs
    const auditText = type === "login" 
      ? `🟢 تسجيل دخول للموقع: قام (${userName}) - [${userRole}] بالوصول للنظام من (${fallbackCity})`
      : type === "register"
        ? `✨ حساب جديد ودخول للموقع: قام (${userName}) - [${userRole}] بتسجيل حسابه من (${fallbackCity})`
        : type === "simulation"
          ? `🔄 تحويل حساب ودخول للموقع: قام (${userName}) - [${userRole}] بتبديل الجلسة`
          : `🔔 زيارة جديدة للموقع: قام (${userName}) - [${userRole}] بدخول المنصة من (${fallbackCity})`;
        
    setAuditLogs((prev) => [{
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString().replace("T", " ").substring(0, 19),
      userName,
      userRole,
      action: auditText,
      ipAddress: ip
    }, ...prev]);
  };

  // Database Persistence effects
  useEffect(() => {
    // Force clear all initial mock data and mock users to start with a clean workspace
    const cleared = localStorage.getItem("meezan_mock_cleared_v6");
    if (!cleared) {
      setClients([]);
      setCases([]);
      setSessions([]);
      setTasks([]);
      setDocuments([]);
      setPayments([]);
      setExpenses([]);
      setAuditLogs([]);
      setUsersList(initialUsers);
      setCurrentUser(initialUsers[0]);
      setOfficeConfig(initialOfficeConfig);
      localStorage.setItem("meezan_clients", JSON.stringify([]));
      localStorage.setItem("meezan_cases", JSON.stringify([]));
      localStorage.setItem("meezan_sessions", JSON.stringify([]));
      localStorage.setItem("meezan_tasks", JSON.stringify([]));
      localStorage.setItem("meezan_documents", JSON.stringify([]));
      localStorage.setItem("meezan_payments", JSON.stringify([]));
      localStorage.setItem("meezan_expenses", JSON.stringify([]));
      localStorage.setItem("meezan_audit_logs", JSON.stringify([]));
      localStorage.setItem("meezan_users_list", JSON.stringify(initialUsers));
      localStorage.setItem("meezan_current_user", JSON.stringify(initialUsers[0]));
      localStorage.setItem("meezan_office_config", JSON.stringify(initialOfficeConfig));
      localStorage.setItem("meezan_mock_cleared_v6", "true");
    }
  }, []);
  useEffect(() => {
    localStorage.setItem("meezan_current_user", JSON.stringify(currentUser));
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem("meezan_users_list", JSON.stringify(usersList));
  }, [usersList]);

  // One-time password migration for existing users
  useEffect(() => {
    setUsersList((prev) => {
      let migrated = false;
      const updatedList = prev.map((user) => {
        const passwordToHash = user.password || "1234";
        if (passwordToHash && !isBcryptHash(passwordToHash)) {
          migrated = true;
          return {
            ...user,
            password: hashPassword(passwordToHash)
          };
        }
        return user;
      });

      if (migrated) {
        localStorage.setItem("meezan_users_list", JSON.stringify(updatedList));
        // Sync migrated users with server-side database
        updatedList.forEach((u) => {
          fetch("/api/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(u)
          }).catch((err) => console.error("Failed to sync migrated user with server:", err));
        });
      }
      return updatedList;
    });
  }, []);

  // Synchronize users and notifications with server-side database
  useEffect(() => {
    const fetchSharedData = async () => {
      try {
        const res = await fetch("/api/shared-data");
        if (res.ok) {
          const data = await res.json();
          if (data.users && Array.isArray(data.users)) {
            setUsersList((prev) => {
              const merged = [...prev];
              let changed = false;
              data.users.forEach((srvUser: UserType) => {
                const exists = merged.some(u => u.id === srvUser.id || u.email.toLowerCase() === srvUser.email.toLowerCase());
                if (!exists) {
                  merged.push(srvUser);
                  changed = true;
                }
              });
              if (changed) {
                localStorage.setItem("meezan_users_list", JSON.stringify(merged));
              }
              return merged;
            });
          }
          if (data.notifications && Array.isArray(data.notifications)) {
            setEntranceNotifications((prev) => {
              const merged = [...prev];
              let changed = false;
              data.notifications.forEach((srvNotif: EntranceNotification) => {
                const exists = merged.some(n => n.id === srvNotif.id);
                if (!exists) {
                  merged.unshift(srvNotif); // Insert at the beginning (newest first)
                  changed = true;
                } else {
                  // If it exists, update it in case location was updated by geolocation
                  const idx = merged.findIndex(n => n.id === srvNotif.id);
                  if (idx !== -1 && (merged[idx].location !== srvNotif.location || merged[idx].coordinates !== srvNotif.coordinates)) {
                    merged[idx] = srvNotif;
                    changed = true;
                  }
                }
              });
              
              if (changed) {
                localStorage.setItem("meezan_entrance_notifications", JSON.stringify(merged));
              }
              return merged;
            });
          }
        }
      } catch (err) {
        console.error("Failed to fetch shared data:", err);
      }
    };

    fetchSharedData();

    // Poll every 8 seconds for real-time registrations and clicks when logged in
    const interval = setInterval(fetchSharedData, 8000);
    return () => clearInterval(interval);
  }, []);

  // Synchronize dynamic lists with server-side database on change
  const syncWithServer = async (key: string, data: any) => {
    const token = localStorage.getItem("meezan_session_token");
    if (!token || !isLoggedIn) return;

    setSyncStatus("saving");
    try {
      const res = await fetch("/api/save-office-data", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ key, data })
      });
      if (res.ok) {
        setSyncStatus("synced");
      } else {
        setSyncStatus("error");
      }
    } catch (err) {
      console.error(`Error syncing ${key} with server:`, err);
      setSyncStatus("error");
    }
  };

  // Securely retrieve and boot full office data from server on login
  useEffect(() => {
    if (!isLoggedIn) {
      setIsDataLoaded(true);
      return;
    }

    const fetchOfficeData = async () => {
      const token = localStorage.getItem("meezan_session_token");
      if (!token) {
        setIsDataLoaded(true);
        return;
      }

      setSyncStatus("saving");
      try {
        const res = await fetch("/api/office-data", {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });
        if (res.ok) {
          const data = await res.json();
          if (data.isInitialized) {
            // Update React states with server data
            if (Array.isArray(data.clients)) setClients(data.clients);
            if (Array.isArray(data.cases)) setCases(data.cases);
            if (Array.isArray(data.sessions)) setSessions(data.sessions);
            if (Array.isArray(data.tasks)) setTasks(data.tasks);
            if (Array.isArray(data.documents)) setDocuments(data.documents);
            if (Array.isArray(data.payments)) setPayments(data.payments);
            if (Array.isArray(data.expenses)) setExpenses(data.expenses);
            if (Array.isArray(data.auditLogs)) setAuditLogs(data.auditLogs);
            if (Array.isArray(data.leads)) setLeads(data.leads);
            if (data.officeConfig) setOfficeConfig(data.officeConfig);
            if (data.subscription) setSubscription(data.subscription);
            if (Array.isArray(data.invoices)) setInvoices(data.invoices);
            setSyncStatus("synced");
          } else {
            // First time initialization - upload local datasets to server database
            const currentState = {
              clients,
              cases,
              sessions,
              tasks,
              documents,
              payments,
              expenses,
              auditLogs,
              leads,
              officeConfig,
              subscription,
              invoices
            };
            const initRes = await fetch("/api/save-office-data", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
              },
              body: JSON.stringify({ isFullSync: true, ...currentState })
            });
            if (initRes.ok) {
              setSyncStatus("synced");
            } else {
              setSyncStatus("error");
            }
          }
        } else {
          setSyncStatus("error");
        }
      } catch (err) {
        console.error("Failed to load server data:", err);
        setSyncStatus("error");
      } finally {
        setIsDataLoaded(true);
      }
    };

    fetchOfficeData();
  }, [isLoggedIn]);

  useEffect(() => {
    localStorage.setItem("meezan_office_config", JSON.stringify(officeConfig));
    if (isDataLoaded && isLoggedIn) {
      syncWithServer("officeConfig", officeConfig);
    }
  }, [officeConfig, isDataLoaded, isLoggedIn]);

  useEffect(() => {
    localStorage.setItem("meezan_clients", JSON.stringify(clients));
    if (isDataLoaded && isLoggedIn) {
      syncWithServer("clients", clients);
    }
  }, [clients, isDataLoaded, isLoggedIn]);

  useEffect(() => {
    localStorage.setItem("meezan_cases", JSON.stringify(cases));
    if (isDataLoaded && isLoggedIn) {
      syncWithServer("cases", cases);
    }
  }, [cases, isDataLoaded, isLoggedIn]);

  useEffect(() => {
    localStorage.setItem("meezan_sessions", JSON.stringify(sessions));
    if (isDataLoaded && isLoggedIn) {
      syncWithServer("sessions", sessions);
    }
  }, [sessions, isDataLoaded, isLoggedIn]);

  useEffect(() => {
    localStorage.setItem("meezan_tasks", JSON.stringify(tasks));
    if (isDataLoaded && isLoggedIn) {
      syncWithServer("tasks", tasks);
    }
  }, [tasks, isDataLoaded, isLoggedIn]);

  useEffect(() => {
    localStorage.setItem("meezan_documents", JSON.stringify(documents));
    if (isDataLoaded && isLoggedIn) {
      syncWithServer("documents", documents);
    }
  }, [documents, isDataLoaded, isLoggedIn]);

  useEffect(() => {
    localStorage.setItem("meezan_payments", JSON.stringify(payments));
    if (isDataLoaded && isLoggedIn) {
      syncWithServer("payments", payments);
    }
  }, [payments, isDataLoaded, isLoggedIn]);

  useEffect(() => {
    localStorage.setItem("meezan_expenses", JSON.stringify(expenses));
    if (isDataLoaded && isLoggedIn) {
      syncWithServer("expenses", expenses);
    }
  }, [expenses, isDataLoaded, isLoggedIn]);

  useEffect(() => {
    localStorage.setItem("meezan_audit_logs", JSON.stringify(auditLogs));
    if (isDataLoaded && isLoggedIn) {
      syncWithServer("auditLogs", auditLogs);
    }
  }, [auditLogs, isDataLoaded, isLoggedIn]);

  useEffect(() => {
    localStorage.setItem("meezan_leads", JSON.stringify(leads));
    if (isDataLoaded && isLoggedIn) {
      syncWithServer("leads", leads);
    }
  }, [leads, isDataLoaded, isLoggedIn]);

  // Session Entrance Notification effect on page mount
  useEffect(() => {
    if (isLoggedIn && currentUser) {
      // Auto-configure personal visits exclusion for owners and admins
      const isOwnerOrAdmin = currentUser.role === "صاحب المكتب" || currentUser.isSuperUser || currentUser.id === "usr-super" || currentUser.role === "مدير المنصة والاشتراكات";
      if (isOwnerOrAdmin && localStorage.getItem("meezan_exclude_my_visits") !== "true") {
        localStorage.setItem("meezan_exclude_my_visits", "true");
      }

      const sessionKey = "meezan_entrance_logged_" + currentUser.id;
      const alreadyLogged = sessionStorage.getItem(sessionKey);
      if (!alreadyLogged) {
        sessionStorage.setItem(sessionKey, "true");
        const timer = setTimeout(() => {
          triggerEntranceNotification(
            currentUser.name,
            currentUser.role,
            currentUser.email,
            "entrance"
          );
        }, 600);
        return () => clearTimeout(timer);
      }
    } else if (!isLoggedIn) {
      // Check if this browser has been marked to exclude personal visits
      if (localStorage.getItem("meezan_exclude_my_visits") === "true") {
        return;
      }

      // Unregistered / Anonymous Visitor tracking for paid ad campaigns
      const adSessionKey = "meezan_ad_visitor_logged";
      const alreadyLogged = sessionStorage.getItem(adSessionKey);
      if (!alreadyLogged) {
        sessionStorage.setItem(adSessionKey, "true");
        const urlParams = new URLSearchParams(window.location.search);
        const utmSource = urlParams.get("utm_source") || (urlParams.has("gclid") ? "google_ads" : urlParams.has("fbclid") ? "facebook_ads" : null);
        const utmCampaign = urlParams.get("utm_campaign") || urlParams.get("utm_medium") || null;
        const ref = document.referrer ? new URL(document.referrer).hostname : null;

        const visitorName = utmSource 
          ? `زائر إعلان مدفوع (${utmSource})`
          : "زائر موقع غير مسجل";
        const visitorEmail = utmCampaign 
          ? `حملة: ${utmCampaign}` 
          : (ref ? `المصدر: ${ref}` : "دخول مباشر / رابط الإعلان");

        const timer = setTimeout(() => {
          triggerEntranceNotification(
            visitorName,
            "زائر إعلانات / غير مسجل",
            visitorEmail,
            "ad_visitor"
          );
        }, 800);
        return () => clearTimeout(timer);
      }
    }
  }, [isLoggedIn, currentUser?.id]);
  
  // Navigation / Theme
  const [currentTab, setCurrentTab] = useState<string>("dashboard");
  const [darkMode, setDarkMode] = useState<boolean>(true);
  const [showTutorialModal, setShowTutorialModal] = useState<boolean>(false);
  const [showLeadModal, setShowLeadModal] = useState<boolean>(false);
  const [showOnboarding, setShowOnboarding] = useState<boolean>(false);

  // Check if onboarding is needed when a user logs in
  useEffect(() => {
    if (isLoggedIn && currentUser) {
      const hasCompleted = localStorage.getItem(`meezan_onboarding_completed_${currentUser.id}`);
      if (!hasCompleted) {
        setShowOnboarding(true);
      }
    }
  }, [isLoggedIn, currentUser]);



  // Subscription State & Persistence
  const [subscription, setSubscription] = useState<UserSubscription>(() => {
    const saved = localStorage.getItem("meezan_subscription");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // use default
      }
    }
    return {
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
  });

  const [invoices, setInvoices] = useState<SubscriptionInvoice[]>(() => {
    const saved = localStorage.getItem("meezan_invoices");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // use default
      }
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem("meezan_subscription", JSON.stringify(subscription));
    if (isDataLoaded && isLoggedIn) {
      syncWithServer("subscription", subscription);
    }
  }, [subscription, isDataLoaded, isLoggedIn]);

  useEffect(() => {
    localStorage.setItem("meezan_invoices", JSON.stringify(invoices));
    if (isDataLoaded && isLoggedIn) {
      syncWithServer("invoices", invoices);
    }
  }, [invoices, isDataLoaded, isLoggedIn]);

  const handleUpdateSubscription = (newSub: UserSubscription) => {
    setSubscription(newSub);
    localStorage.setItem("meezan_subscription", JSON.stringify(newSub));
    
    // Log activity to audit logs
    const actionText = newSub.status === "active" 
      ? `💳 تم الاشتراك وتفعيل باقة ${newSub.planId === "basic" ? "المحامي الفردي" : newSub.planId === "pro" ? "المكتب المشترك" : "النخبة"} بقيمة ${newSub.amountPaid} ج.م` 
      : newSub.status === "expired" 
        ? "⚠️ تم محاكاة انتهاء فترة اشتراك مكتب المحاماة." 
        : `🔄 تم إعادة تعيين حالة الاشتراك إلى: ${newSub.status}`;
        
    logActivity(actionText);
  };

  const handleAddInvoice = (newInvoice: SubscriptionInvoice) => {
    setInvoices((prev) => {
      const updated = [newInvoice, ...prev];
      localStorage.setItem("meezan_invoices", JSON.stringify(updated));
      return updated;
    });
  };

  // Helper: Create audit log entry
  const logActivity = (action: string) => {
    const newLog: AuditLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString().replace("T", " ").substring(0, 19),
      userName: currentUser.name,
      userRole: currentUser.role,
      action: action,
      ipAddress: "197.34." + Math.floor(Math.random() * 254) + "." + Math.floor(Math.random() * 254)
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  const handleLoadDemoData = () => {
    setClients(initialClients);
    setCases(initialCases);
    setSessions(initialSessions);
    setTasks(initialTasks);
    setDocuments(initialDocuments);
    setPayments(initialPayments);
    setExpenses(initialExpenses);
    setAuditLogs(initialAuditLogs);
    // Seed audit logs with an action
    const seedLog: AuditLog = {
      id: `log-seed-${Date.now()}`,
      timestamp: new Date().toISOString().replace("T", " ").substring(0, 19),
      userName: currentUser.name,
      userRole: currentUser.role,
      action: "🔄 تم تحميل واستيراد البيانات التجريبية المعدة مسبقاً بنجاح للمعاينة والاختبار.",
      ipAddress: "197.34.12.5"
    };
    setAuditLogs((prev) => [seedLog, ...prev]);
  };

  const handleWipeAllData = () => {
    setClients([]);
    setCases([]);
    setSessions([]);
    setTasks([]);
    setDocuments([]);
    setPayments([]);
    setExpenses([]);
    setAuditLogs([]);
  };

  // Switch Current User Simulation handler
  const handleSwitchUserRole = (userId: string) => {
    const selected = usersList.find(u => u.id === userId);
    if (selected) {
      setCurrentUser(selected);
      triggerEntranceNotification(selected.name, selected.role, selected.email, "simulation");
    }
  };

  // --- CLIENTS CRM HANDLERS ---
  const handleAddClient = (clientData: Omit<Client, "id" | "createdAt" | "communicationLogs">) => {
    const newClient: Client = {
      ...clientData,
      id: `client-${Date.now()}`,
      createdAt: new Date().toISOString().split("T")[0],
      communicationLogs: [
        {
          id: `log-${Date.now()}`,
          date: new Date().toISOString().split("T")[0],
          summary: "تم تسجيل الموكل وتكوين ملفه التعريفي بالنظام.",
          type: "تسجيل",
          notes: "أول إدراج تلقائي",
          recorder: currentUser.name
        }
      ]
    };
    setClients((prev) => [newClient, ...prev]);
    logActivity(`➕ قام بإدراج الموكل الجديد: ${newClient.name}`);
  };

  const handleEditClient = (updated: Client) => {
    setClients((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    logActivity(`✏️ قام بتعديل الملف التعريفي للموكل: ${updated.name}`);
  };

  const handleDeleteClient = (clientId: string) => {
    const target = clients.find(c => c.id === clientId);
    if (target) {
      setClients((prev) => prev.filter((c) => c.id !== clientId));
      logActivity(`🗑️ قام بحذف الموكل: ${target.name} من الدفتر`);
    }
  };

  const handleAddClientInteraction = (clientId: string, log: Omit<CommunicationLog, "id">) => {
    setClients((prev) => prev.map((c) => {
      if (c.id === clientId) {
        return {
          ...c,
          communicationLogs: [
            {
              ...log,
              id: `int-${Date.now()}`
            },
            ...c.communicationLogs
          ]
        };
      }
      return c;
    }));
    const clientName = clients.find(c => c.id === clientId)?.name || "غير معروف";
    logActivity(`💬 سجل تواصل جديد مع الموكل (${clientName}): ${log.summary}`);
  };

  // --- CASES HANDLERS ---
  const handleAddCase = (caseData: Omit<Case, "id" | "timeline" | "isDeleted">) => {
    const newCase: Case = {
      ...caseData,
      id: `case-${Date.now()}`,
      isDeleted: false,
      timeline: [
        {
          id: `t-${Date.now()}`,
          date: new Date().toISOString().split("T")[0],
          event: "تأسيس وقيد ملف الدعوى بالمكتب وتكليف المسؤولين بالحضور والتحضير.",
          type: "جلسة"
        }
      ]
    };
    setCases((prev) => [newCase, ...prev]);
    logActivity(`➕ قام بقيد الدعوى القضائية الجديدة برقم: ${newCase.caseNumber}`);
  };

  const handleEditCase = (updated: Case) => {
    setCases((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    logActivity(`✏️ قام بتحديث بيانات القضية رقم: ${updated.caseNumber}`);
  };

  const handleDeleteCase = (caseId: string) => {
    const target = cases.find(c => c.id === caseId);
    if (target) {
      setCases((prev) => prev.map((c) => c.id === caseId ? { ...c, isDeleted: true } : c));
      logActivity(`🗑️ قام بإرسال القضية رقم (${target.caseNumber}) إلى سلة المحذوفات`);
    }
  };

  const handleAddCaseTimelineEvent = (caseId: string, eventText: string, eventType: any) => {
    setCases((prev) => prev.map((c) => {
      if (c.id === caseId) {
        const newEvent: TimelineEvent = {
          id: `ev-${Date.now()}`,
          date: new Date().toISOString().split("T")[0],
          event: eventText,
          type: eventType
        };
        return {
          ...c,
          timeline: [newEvent, ...c.timeline]
        };
      }
      return c;
    }));
    const num = cases.find(c => c.id === caseId)?.caseNumber || "";
    logActivity(`📜 أضاف تطوراً قضائياً لملف القضية ${num}: ${eventText}`);
  };

  // --- SESSIONS HANDLERS ---
  const handleAddSession = (sessionData: Omit<Session, "id" | "isCompleted">) => {
    const newSession: Session = {
      ...sessionData,
      id: `session-${Date.now()}`,
      isCompleted: false
    };
    setSessions((prev) => [newSession, ...prev]);

    // Automatically append timeline event to the case
    handleAddCaseTimelineEvent(
      sessionData.caseId, 
      `📅 تم جدولة جلسة جديدة من نوع (${sessionData.type}) بتاريخ ${sessionData.date} أمام محكمة ${sessionData.court}.`, 
      "جلسة"
    );
    
    logActivity(`📅 قام بجدولة جلسة (${sessionData.type}) لقضية رقم: ${cases.find(c => c.id === sessionData.caseId)?.caseNumber}`);
  };

  const handleUpdateSessionResult = (
    sessionId: string, 
    resultData: { result: string; decision: string; nextSessionDate?: string; isCompleted: boolean }
  ) => {
    setSessions((prev) => prev.map((s) => {
      if (s.id === sessionId) {
        return {
          ...s,
          ...resultData
        };
      }
      return s;
    }));

    const ses = sessions.find(s => s.id === sessionId);
    if (ses) {
      const caseNum = cases.find(c => c.id === ses.caseId)?.caseNumber || "";
      
      // Update case timeline
      handleAddCaseTimelineEvent(
        ses.caseId, 
        `⚖️ تم حضور الجلسة وتوثيق قرار المحكمة الرسمي: ${resultData.decision}. ${resultData.nextSessionDate ? `تم التأجيل لجلسة ${resultData.nextSessionDate}` : ""}`,
        "قرار"
      );

      // Create connected task automatically if postponed
      if (resultData.nextSessionDate) {
        const newTask: Task = {
          id: `task-${Date.now()}`,
          title: `تحضير الدفاع لطلب التأجيل لجلسة ${resultData.nextSessionDate}`,
          caseId: ses.caseId,
          clientId: cases.find(c => c.id === ses.caseId)?.clientId,
          assignedLawyerId: ses.assignedLawyerId,
          priority: "عالية" as TaskPriority,
          startDate: new Date().toISOString().split("T")[0],
          dueDate: resultData.nextSessionDate,
          status: "لم تبدأ" as TaskStatus,
          description: `مهمة مستحدثة آلياً عقب حضور جلسة ${ses.date}. المطلب: الوفاء بقرار المحكمة المتمثل في: ${resultData.decision}`
        };
        setTasks((prev) => [newTask, ...prev]);
      }

      logActivity(`⚖️ سجل مجريات وقرار الجلسة لقضية ${caseNum}: ${resultData.decision}`);
    }
  };

  // --- TASKS HANDLERS ---
  const handleAddTask = (taskData: Omit<Task, "id">) => {
    const newTask: Task = {
      ...taskData,
      id: `task-${Date.now()}`
    };
    setTasks((prev) => [newTask, ...prev]);
    logActivity(`📋 أسند مهمة جديدة بعنوان (${newTask.title}) للمحامي المسؤول`);
  };

  const handleEditTask = (updated: Task) => {
    setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    logActivity(`📋 حدث حالة/تفاصيل التكليف بالمهمة: ${updated.title}`);
  };

  const handleDeleteTask = (taskId: string) => {
    const target = tasks.find(t => t.id === taskId);
    if (target) {
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      logActivity(`🗑️ قام بحذف المهمة المسندة: ${target.title}`);
    }
  };

  // --- DOCUMENTS ARCHIVE HANDLERS ---
  const handleUploadDocument = (
    caseId: string, 
    docData: Omit<Document, "id" | "versions" | "uploadedBy" | "uploadedById" | "timestamp">
  ) => {
    const newDoc: Document = {
      ...docData,
      id: `doc-${Date.now()}`,
      caseId,
      uploadedBy: currentUser.name,
      uploadedById: currentUser.id,
      timestamp: new Date().toISOString().replace("T", " ").substring(0, 16),
      versions: []
    };
    setDocuments((prev) => [newDoc, ...prev]);

    // Append Case Timeline event
    handleAddCaseTimelineEvent(
      caseId, 
      `📁 تم أرشفة مستند قانوني جديد بالملف السحابي: ${docData.title} (${docData.fileName})`, 
      "مذكرة"
    );

    logActivity(`📁 قام بأرشفة مستند رسمي بملف القضية: ${docData.title}`);
  };

  const handleUploadNewVersion = (docId: string, versionData: { fileName: string; fileSize: string }) => {
    setDocuments((prev) => prev.map((d) => {
      if (d.id === docId) {
        // Save old file data as a version history item
        const oldVersion: DocumentVersion = {
          version: `إصدار سابق`,
          fileName: d.fileName,
          fileSize: d.fileSize,
          timestamp: d.timestamp,
          uploadedBy: d.uploadedBy
        };

        return {
          ...d,
          fileName: versionData.fileName,
          fileSize: versionData.fileSize,
          timestamp: new Date().toISOString().replace("T", " ").substring(0, 16),
          uploadedBy: currentUser.name,
          uploadedById: currentUser.id,
          versions: [oldVersion, ...d.versions]
        };
      }
      return d;
    }));

    const docTitle = documents.find(d => d.id === docId)?.title || "غير معروف";
    logActivity(`🔄 رفع تعديل ومسودة إصدار جديدة للمستند: ${docTitle}`);
  };

  const handleDeleteDocument = (docId: string) => {
    const target = documents.find(d => d.id === docId);
    if (target) {
      setDocuments((prev) => prev.filter((d) => d.id !== docId));
      logActivity(`🗑️ قام بحذف مستند الأرشيف: ${target.title}`);
    }
  };

  // --- FINANCIALS HANDLERS ---
  const handleAddPayment = (paymentData: Omit<Payment, "id" | "recipientId" | "receiptNumber">) => {
    const recNumber = `REC-2026-${Math.floor(100000 + Math.random() * 900000)}`;
    const newPayment: Payment = {
      ...paymentData,
      id: `pay-${Date.now()}`,
      receiptNumber: recNumber,
      recipientId: currentUser.id
    };
    setPayments((prev) => [newPayment, ...prev]);

    // Update Case timeline
    handleAddCaseTimelineEvent(
      paymentData.caseId, 
      `💰 تم سداد وتحصيل دفعة مالية بقيمة ${paymentData.amount.toLocaleString()} ج.م بموجب إيصال الدفع رقم ${recNumber}.`, 
      "قرار"
    );

    logActivity(`💰 تم تحصيل دفعة أتعاب واردة بقيمة ${paymentData.amount.toLocaleString()} ج.م (إيصال: ${recNumber})`);
  };

  const handleDeletePayment = (paymentId: string) => {
    const target = payments.find(p => p.id === paymentId);
    if (target) {
      setPayments((prev) => prev.filter((p) => p.id !== paymentId));
      logActivity(`🗑️ قام بشطب قيد تحصيل الدفعة المالية: ${target.receiptNumber} بقيمة ${target.amount} ج.م`);
    }
  };

  // --- EXPENSES HANDLERS ---
  const handleAddExpense = (expenseData: Omit<Expense, "id">) => {
    const newExpense: Expense = {
      ...expenseData,
      id: `exp-${Date.now()}`
    };
    setExpenses((prev) => [newExpense, ...prev]);

    if (expenseData.caseId) {
      handleAddCaseTimelineEvent(
        expenseData.caseId, 
        `💸 تم سداد مصروفات قضائية (${expenseData.category}) بقيمة ${expenseData.amount.toLocaleString()} ج.م: ${expenseData.description}`,
        "قرار"
      );
    }

    logActivity(`💸 قيد مصروفات جديدة من تصنيف (${expenseData.category}) بقيمة ${expenseData.amount.toLocaleString()} ج.م`);
  };

  const handleDeleteExpense = (expenseId: string) => {
    const target = expenses.find(e => e.id === expenseId);
    if (target) {
      setExpenses((prev) => prev.filter((e) => e.id !== expenseId));
      logActivity(`🗑️ قام بحذف بند مصروفات بقيمة ${target.amount} ج.م: ${target.description}`);
    }
  };

  // --- SETTINGS CONFIG HANDLERS ---
  const handleUpdateOfficeConfig = (updated: OfficeConfig) => {
    setOfficeConfig(updated);
    logActivity(`🏢 قام بتحديث البيانات والمسمى القانوني للمؤسسة لـ (${updated.officeName})`);
  };

  const handleInviteUser = (userData: Omit<UserType, "id">) => {
    const newUser: UserType = {
      ...userData,
      id: `usr-${Date.now()}`
    };
    setUsersList((prev) => [...prev, newUser]);
    logActivity(`👥 قام بإرسال دعوة تسجيل وتكليف زميل جديد: ${newUser.name} بصفة ${newUser.role}`);
  };

  const handleUpdateUserRole = (userId: string, newRole: UserRole) => {
    setUsersList((prev) => prev.map((u) => {
      if (u.id === userId) {
        return {
          ...u,
          role: newRole,
          // Re-adjust permissions
          permissions: {
            add: true,
            edit: newRole !== "محام تدريب",
            delete: newRole === "صاحب المكتب",
            viewFinancials: newRole === "صاحب المكتب" || newRole === "محاسب"
          }
        };
      }
      return u;
    }));
    const memberName = usersList.find(u => u.id === userId)?.name || "";
    logActivity(`🛡️ عدل رتبة الزميل (${memberName}) إلى المسمى الجديد: ${newRole}`);
  };

  // Handle Password Update securely (hashes already computed before reaching here)
  const handleUpdatePassword = (userId: string, hashedPass: string) => {
    setUsersList((prev) => {
      const updated = prev.map((u) => {
        if (u.id === userId) {
          const updatedUser = { ...u, password: hashedPass };
          if (currentUser && currentUser.id === userId) {
            setCurrentUser(updatedUser);
            localStorage.setItem("meezan_current_user", JSON.stringify(updatedUser));
          }
          // Sync with server-side database
          const token = localStorage.getItem("meezan_session_token");
          const headers: Record<string, string> = { "Content-Type": "application/json" };
          if (token) {
            headers["Authorization"] = `Bearer ${token}`;
          }
          fetch("/api/register", {
            method: "POST",
            headers,
            body: JSON.stringify(updatedUser)
          }).catch((err) => console.error("Failed to update user password on server:", err));
          return updatedUser;
        }
        return u;
      });
      localStorage.setItem("meezan_users_list", JSON.stringify(updated));
      return updated;
    });
    logActivity(`🔒 تم تحديث وإعادة تعيين كلمة المرور الأمنية بنجاح لحساب مستخدم`);
  };

  // Logout Handler
  const handleLogout = () => {
    if (currentUser && currentUser.name) {
      triggerEntranceNotification(currentUser.name, currentUser.role, currentUser.email, "logout");
    }
    setIsLoggedIn(false);
    localStorage.removeItem("meezan_is_logged_in");
  };

  // Render proper View based on activeTab
  const renderActiveView = () => {
    const isOwner = currentUser.role === UserRole.Owner || currentUser.role === "صاحب المكتب";

    // Data Scope for Lawyer Role Privacy
    const scopedCases = isOwner
      ? cases
      : cases.filter(
          (c) =>
            c.assignedLawyerId === currentUser.id ||
            c.assignedLawyerId === currentUser.name
        );

    const scopedSessions = isOwner
      ? sessions
      : sessions.filter(
          (s) =>
            s.assignedLawyerId === currentUser.id ||
            s.assignedLawyerId === currentUser.name ||
            scopedCases.some((c) => c.id === s.caseId)
        );

    const scopedTasks = isOwner
      ? tasks
      : tasks.filter(
          (t) =>
            t.assignedLawyerId === currentUser.id ||
            t.assignedLawyerId === currentUser.name
        );

    const scopedDocuments = isOwner
      ? documents
      : documents.filter(
          (d) =>
            d.uploadedById === currentUser.id ||
            d.uploadedBy === currentUser.name ||
            scopedCases.some((c) => c.id === d.caseId)
        );

    const scopedClients = isOwner
      ? clients
      : clients.filter(
          (cl) =>
            scopedCases.some((c) => c.clientId === cl.id) ||
            cl.id === currentUser.id
        );

    const scopedPayments = isOwner
      ? payments
      : payments.filter(
          (p) =>
            scopedCases.some((c) => c.id === p.caseId) ||
            p.recipientId === currentUser.id
        );

    const scopedExpenses = isOwner
      ? expenses
      : expenses.filter(
          (e) =>
            scopedCases.some((c) => c.id === e.caseId) ||
            e.employeeId === currentUser.id ||
            e.paidBy === currentUser.name
        );

    // If pending and not visiting subscription or admin_panel, show a gorgeous pending screen
    if (subscription.status === "pending" && currentTab !== "subscription" && currentTab !== "admin_panel") {
      return (
        <div className={`flex flex-col items-center justify-center text-center py-24 px-6 space-y-6 max-w-xl mx-auto border rounded-3xl backdrop-blur-sm animate-fade-in mt-12 ${
          darkMode 
            ? "border-blue-500/10 bg-blue-500/5" 
            : "border-blue-200 bg-blue-50/50"
        }`}>
          <div className="w-16 h-16 bg-blue-500/10 text-blue-500 rounded-2xl flex items-center justify-center text-3xl animate-pulse">
            ⏳
          </div>
          <div className="space-y-2">
            <h2 className={`text-xl font-black ${darkMode ? "text-white" : "text-slate-900"}`}>طلب الاشتراك قيد المراجعة حالياً</h2>
            <p className={`text-xs leading-relaxed ${darkMode ? "text-slate-400" : "text-slate-600"}`}>
              لقد سجلنا طلب اشتراكك بنجاح في باقة النظام ميزان السحابي. نحن بانتظار مراجعة الدفع والتفعيل اليدوي من قبل إدارة المنصة لتتمكن من الوصول لكافة مزايا النظام.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
            <button
              onClick={() => setCurrentTab("subscription")}
              className="w-full py-3.5 rounded-2xl text-xs font-black bg-blue-500 hover:bg-blue-600 text-white transition-all shadow-xl shadow-blue-500/10 cursor-pointer"
            >
              متابعة حالة الاشتراك والأسعار 💳
            </button>
            <a
              href={`https://wa.me/201091033943?text=${encodeURIComponent(`مرحبًا، أود الاستفسار عن حالة تفعيل باقة الاشتراك الخاصة بمكتبي.`)}`}
              target="_blank"
              rel="noreferrer"
              className="w-full py-3.5 rounded-2xl text-xs font-black bg-emerald-600 hover:bg-emerald-500 text-white transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer"
            >
              تواصل معنا عبر واتساب 💬
            </a>
          </div>
        </div>
      );
    }

    // If expired and not visiting subscription or admin_panel, block and show elegant payment portal prompt
    if (subscription.status === "expired" && currentTab !== "subscription" && currentTab !== "admin_panel") {
      return (
        <div className={`flex flex-col items-center justify-center text-center py-24 px-6 space-y-6 max-w-xl mx-auto border rounded-3xl backdrop-blur-sm animate-fade-in mt-12 ${
          darkMode 
            ? "border-rose-500/10 bg-rose-500/5" 
            : "border-rose-200 bg-rose-50/50"
        }`}>
          <div className="w-16 h-16 bg-rose-500/10 text-rose-500 rounded-2xl flex items-center justify-center text-3xl animate-bounce">
            🔒
          </div>
          <div className="space-y-2">
            <h2 className={`text-xl font-black ${darkMode ? "text-white" : "text-slate-900"}`}>تم تجميد حساب مكتب المحاماة</h2>
            <p className={`text-xs leading-relaxed ${darkMode ? "text-slate-400" : "text-slate-650"}`}>
              لقد انتهت الفترة التجريبية المجانية (أول شهر مجاناً) الخاصة بمكتبك. يرجى الاشتراك أو الترقية بالجنيه المصري لمواصلة الوصول إلى القضايا والموكلين والجلسات والتقويم والأرشيف.
            </p>
          </div>
          <div className={`p-4 rounded-2xl border text-right w-full space-y-2 text-xs ${
            darkMode 
              ? "bg-[#0D1B2A]/80 border-slate-800 text-slate-300" 
              : "bg-white border-slate-200 text-slate-700"
          }`}>
            <div className="flex justify-between">
              <span>الباقة الأكثر طلباً:</span>
              <strong className="text-[#C5A059]">باقة المكتب المشترك</strong>
            </div>
            <div className="flex justify-between">
              <span>قيمة الاشتراك:</span>
              <strong className={darkMode ? "text-emerald-400" : "text-emerald-700"}>350 ج.م / شهرياً</strong>
            </div>
            <div className={`flex justify-between text-[10px] ${darkMode ? "text-slate-400" : "text-slate-600"}`}>
              <span>التحويل فوري عبر:</span>
              <span>فيزا، ماستركارد، إنستاباي، فودافون كاش</span>
            </div>
          </div>
          <button
            onClick={() => setCurrentTab("subscription")}
            className="w-full py-3.5 rounded-2xl text-xs font-black bg-rose-500 hover:bg-rose-600 text-white transition-all shadow-xl shadow-rose-500/10 cursor-pointer flex items-center justify-center gap-2"
          >
            تفعيل الاشتراك والترقية بالجنيه المصري 💳
          </button>
        </div>
      );
    }

    switch (currentTab) {
      case "dashboard":
        return (
          <DashboardView
            currentUser={currentUser}
            clients={scopedClients}
            cases={scopedCases}
            sessions={scopedSessions}
            tasks={scopedTasks}
            payments={scopedPayments}
            expenses={scopedExpenses}
            darkMode={darkMode}
            onQuickAction={(actionType) => setCurrentTab(actionType)}
          />
        );
      case "menu":
        return (
          <MenuView
            currentUser={currentUser}
            clients={scopedClients}
            cases={scopedCases}
            sessions={scopedSessions}
            tasks={scopedTasks}
            payments={scopedPayments}
            expenses={scopedExpenses}
            subscription={subscription}
            darkMode={darkMode}
            onNavigate={(tabId) => setCurrentTab(tabId)}
          />
        );
      case "clients":
        return (
          <ClientsView
            currentUser={currentUser}
            clients={scopedClients}
            cases={scopedCases}
            sessions={scopedSessions}
            payments={scopedPayments}
            onAddClient={handleAddClient}
            onEditClient={handleEditClient}
            onDeleteClient={handleDeleteClient}
            onAddCommunicationLog={handleAddClientInteraction}
            darkMode={darkMode}
          />
        );
      case "cases":
        return (
          <CasesView
            currentUser={currentUser}
            cases={scopedCases}
            clients={scopedClients}
            sessions={scopedSessions}
            tasks={scopedTasks}
            documents={scopedDocuments}
            payments={scopedPayments}
            expenses={scopedExpenses}
            usersList={usersList}
            onAddCase={handleAddCase}
            onEditCase={handleEditCase}
            onDeleteCase={handleDeleteCase}
            darkMode={darkMode}
          />
        );
      case "sessions":
        return (
          <SessionsView
            currentUser={currentUser}
            sessions={scopedSessions}
            cases={scopedCases}
            clients={scopedClients}
            usersList={usersList}
            onAddSession={handleAddSession}
            onUpdateSessionResult={handleUpdateSessionResult}
            onEditSession={() => {}}
            darkMode={darkMode}
          />
        );
      case "tasks":
        return (
          <TasksView
            currentUser={currentUser}
            tasks={scopedTasks}
            cases={scopedCases}
            clients={scopedClients}
            usersList={usersList}
            onAddTask={handleAddTask}
            onEditTask={handleEditTask}
            onDeleteTask={handleDeleteTask}
            darkMode={darkMode}
          />
        );
      case "documents":
        return (
          <DocumentsView
            currentUser={currentUser}
            documents={scopedDocuments}
            cases={scopedCases}
            clients={scopedClients}
            onUploadDocument={handleUploadDocument}
            onUploadNewVersion={handleUploadNewVersion}
            onDeleteDocument={handleDeleteDocument}
            darkMode={darkMode}
          />
        );
      case "financial":
        return (
          <FinancialView
            currentUser={currentUser}
            payments={scopedPayments}
            cases={scopedCases}
            clients={scopedClients}
            usersList={usersList}
            onAddPayment={handleAddPayment}
            onDeletePayment={handleDeletePayment}
            darkMode={darkMode}
          />
        );
      case "expenses":
        return (
          <ExpensesView
            currentUser={currentUser}
            expenses={scopedExpenses}
            cases={scopedCases}
            usersList={usersList}
            onAddExpense={handleAddExpense}
            onDeleteExpense={handleDeleteExpense}
            darkMode={darkMode}
          />
        );
      case "reports":
        return (
          <ReportsView
            currentUser={currentUser}
            cases={scopedCases}
            clients={scopedClients}
            tasks={scopedTasks}
            payments={scopedPayments}
            expenses={scopedExpenses}
            usersList={usersList}
            darkMode={darkMode}
            leads={leads}
          />
        );
      case "settings":
        return (
          <SettingsView
            currentUser={currentUser}
            officeConfig={officeConfig}
            auditLogs={auditLogs}
            usersList={usersList}
            onUpdateOfficeConfig={handleUpdateOfficeConfig}
            onInviteUser={handleInviteUser}
            onUpdateUserRole={handleUpdateUserRole}
            darkMode={darkMode}
            onLoadDemoData={handleLoadDemoData}
            onWipeAllData={handleWipeAllData}
          />
        );
      case "subscription":
        return (
          <SubscriptionView
            currentUser={currentUser}
            subscription={subscription}
            onUpdateSubscription={handleUpdateSubscription}
            invoices={invoices}
            onAddInvoice={handleAddInvoice}
            darkMode={darkMode}
            officeName={officeConfig.officeName}
          />
        );
      case "admin_panel": {
        const isSuperUser = currentUser.isSuperUser === true || currentUser.id === "usr-super" || currentUser.email === "superuser@lawmizan.com";
        if (!isSuperUser) {
          return (
            <div className={`p-8 text-center border font-bold rounded-3xl m-6 ${
              darkMode 
                ? "bg-rose-500/10 border-rose-500/20 text-rose-400" 
                : "bg-rose-50 border-rose-200 text-rose-700"
            }`}>
              🚫 عذراً، لوحة الإدارة الكبرى مخصصة حصرياً لمالك المشروع (Superuser) ولا تظهر لأي مستخدم آخر.
            </div>
          );
        }
        return (
          <AdminPanel
            currentUser={currentUser}
            subscription={subscription}
            onUpdateSubscription={handleUpdateSubscription}
            invoices={invoices}
            onAddInvoice={handleAddInvoice}
            darkMode={darkMode}
            clients={clients}
            setClients={setClients}
            cases={cases}
            setCases={setCases}
            sessions={sessions}
            setSessions={setSessions}
            tasks={tasks}
            setTasks={setTasks}
            documents={documents}
            setDocuments={setDocuments}
            payments={payments}
            setPayments={setPayments}
            expenses={expenses}
            setExpenses={setExpenses}
            auditLogs={auditLogs}
            setAuditLogs={setAuditLogs}
            usersList={usersList}
            setUsersList={setUsersList}
            officeConfig={officeConfig}
            setOfficeConfig={setOfficeConfig}
            entranceNotifications={entranceNotifications}
            leads={leads}
            setLeads={setLeads}
          />
        );
      }
      default:
        return <div className={`text-center py-20 ${darkMode ? "text-slate-500" : "text-slate-650"}`}>جاري تطوير هذا القسم...</div>;
    }
  };

  if (!isLoggedIn) {
    return (
      <>
        {/* Live Toast Banner if active */}
        <EntranceToast
          notification={activeEntranceToast}
          onClose={() => setActiveEntranceToast(null)}
          onOpenModal={() => setIsNotificationModalOpen(true)}
          darkMode={darkMode}
        />



        <AuthView
          usersList={usersList}
          officeConfig={officeConfig}
          onUpdatePassword={handleUpdatePassword}
          onLogin={(user) => {
            setCurrentUser(user);
            setIsLoggedIn(true);
            if (user.isSuperUser || user.id === "usr-super" || user.role === UserRole.SuperAdmin) {
              setCurrentTab("admin_panel");
            }
            localStorage.setItem("meezan_is_logged_in", "true");
            localStorage.setItem("meezan_current_user", JSON.stringify(user));
            triggerEntranceNotification(user.name, user.role, user.email, "login");
          }}
          onRegister={(newUser) => {
            let utmSource = "";
            let utmCampaign = "";
            let referredByAd = false;
            
            if (typeof window !== "undefined") {
              const urlParams = new URLSearchParams(window.location.search);
              const source = urlParams.get("utm_source");
              const campaign = urlParams.get("utm_campaign") || urlParams.get("utm_medium");
              
              if (source) {
                utmSource = source;
                utmCampaign = campaign || "حملة عامة";
                referredByAd = true;
              } else if (urlParams.has("gclid")) {
                utmSource = "google_ads";
                utmCampaign = campaign || "حملة إعلانات جوجل";
                referredByAd = true;
              } else if (urlParams.has("fbclid")) {
                utmSource = "facebook_ads";
                utmCampaign = campaign || "حملة فيسبوك";
                referredByAd = true;
              } else {
                // Check if they were cookie/session marked as coming from an ad
                const savedAdVisitor = sessionStorage.getItem("meezan_ad_visitor_logged");
                if (savedAdVisitor) {
                  utmSource = "ad_campaign";
                  utmCampaign = "حملة إعلانية ممولة";
                  referredByAd = true;
                } else {
                  utmSource = document.referrer ? new URL(document.referrer).hostname : "organic_search";
                  utmCampaign = "دخول مباشر / بحث عضوي";
                  referredByAd = false;
                }
              }
            }

            const ip = "197.38." + Math.floor(Math.random() * 200 + 10) + "." + Math.floor(Math.random() * 250);
            const device = typeof navigator !== "undefined" && navigator.userAgent.includes("Mobile") ? "هاتف محمول" : "متصفح حاسوب";
            const city = ["القاهرة، مصر", "الجيزة، مصر", "الإسكندرية، مصر", "المنصورة، مصر", "طنطا، مصر", "أسيوط، مصر"][Math.floor(Math.random() * 6)];

            const enrichedUser: UserType = {
              ...newUser,
              referredByAd,
              utmSource,
              utmCampaign,
              registrationIp: ip,
              registrationDevice: device,
              registrationLocation: city,
              createdAt: new Date().toISOString()
            };

            setUsersList((prev) => [...prev, enrichedUser]);
            setCurrentUser(enrichedUser);
            setIsLoggedIn(true);
            localStorage.setItem("meezan_is_logged_in", "true");
            localStorage.setItem("meezan_current_user", JSON.stringify(enrichedUser));
            
            // Save registered user to the server-side shared database
            fetch("/api/register", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(enrichedUser)
            }).catch(err => console.error("Failed to persist registration on server:", err));

            triggerEntranceNotification(enrichedUser.name, enrichedUser.role, enrichedUser.email, "register");
          }}
          darkMode={darkMode}
        />

        <EntranceNotificationsModal
          isOpen={isNotificationModalOpen}
          onClose={() => setIsNotificationModalOpen(false)}
          notifications={entranceNotifications}
          onMarkAllAsRead={() => {
            setEntranceNotifications((prev) => {
              const updated = prev.map(n => ({ ...n, isRead: true }));
              localStorage.setItem("meezan_entrance_notifications", JSON.stringify(updated));
              return updated;
            });
          }}
          onClearAll={() => {
            setEntranceNotifications([]);
            localStorage.removeItem("meezan_entrance_notifications");
          }}
          onSimulateEntrance={(customName, customRole, type, customEmail) => {
            const name = customName || "أ. أحمد عبد المجيد";
            const role = customRole || UserRole.Lawyer;
            triggerEntranceNotification(name, role, customEmail, type || "simulation");
          }}
          darkMode={darkMode}
        />
      </>
    );
  }

  const unreadNotificationCount = entranceNotifications.filter(n => !n.isRead).length;

  return (
    <div className={`min-h-screen font-sans antialiased overflow-x-hidden transition-colors duration-300 selection:bg-[#C5A059] selection:text-white ${
      darkMode ? "bg-[#080F18] text-slate-200" : "bg-[#F4F7FA] text-[#334155]"
    }`} dir="rtl">
      
      {/* Live Toast Banner overlay */}
      <EntranceToast
        notification={activeEntranceToast}
        onClose={() => setActiveEntranceToast(null)}
        onOpenModal={() => setIsNotificationModalOpen(true)}
        darkMode={darkMode}
      />

      {/* Entrance Notifications Log Modal */}
      <EntranceNotificationsModal
        isOpen={isNotificationModalOpen}
        onClose={() => setIsNotificationModalOpen(false)}
        notifications={entranceNotifications}
        onMarkAllAsRead={() => {
          setEntranceNotifications((prev) => {
            const updated = prev.map(n => ({ ...n, isRead: true }));
            localStorage.setItem("meezan_entrance_notifications", JSON.stringify(updated));
            return updated;
          });
        }}
        onClearAll={() => {
          setEntranceNotifications([]);
          localStorage.removeItem("meezan_entrance_notifications");
        }}
        onSimulateEntrance={(customName, customRole, type, customEmail) => {
          const name = customName || "أ. أحمد عبد المجيد";
          const role = customRole || UserRole.Lawyer;
          triggerEntranceNotification(name, role, customEmail, type || "simulation");
        }}
        darkMode={darkMode}
      />

      {/* Top Dropdown Navigation Header on Mobile/Tablet */}
      <TopDropdownNav
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        currentUser={currentUser}
        usersList={usersList}
        onSwitchUser={handleSwitchUserRole}
        officeName={officeConfig.officeName}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        subscription={subscription}
        onLogout={handleLogout}
        unreadNotificationCount={unreadNotificationCount}
        onOpenNotificationModal={() => setIsNotificationModalOpen(true)}
        onOpenTutorial={() => setShowTutorialModal(true)}
      />
      
      {/* Sidebar with simulated user changer and responsive navigation */}
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        currentUser={currentUser}
        usersList={usersList}
        onSwitchUser={handleSwitchUserRole}
        officeName={officeConfig.officeName}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        onOpenSearch={() => {}}
        subscription={subscription}
        onLogout={handleLogout}
        unreadNotificationCount={unreadNotificationCount}
        onOpenNotificationModal={() => setIsNotificationModalOpen(true)}
        onOpenTutorial={() => setShowTutorialModal(true)}
      />

      {/* Main Container */}
      <div className="lg:mr-64 transition-all p-4 md:p-6 lg:p-8">
        <TutorialVideoModal 
          isOpen={showTutorialModal}
          onClose={() => setShowTutorialModal(false)}
          darkMode={darkMode}
        />

        <OnboardingModal
          isOpen={showOnboarding}
          onClose={() => setShowOnboarding(false)}
          onComplete={() => {
            if (currentUser) {
              localStorage.setItem(`meezan_onboarding_completed_${currentUser.id}`, "true");
            }
            setShowOnboarding(false);
          }}
          onNavigateTo={(tab) => {
            setCurrentTab(tab);
          }}
          darkMode={darkMode}
        />
        
        {/* Core application body wrapper with smooth mounting animations simulated via standard divs */}
        <div className="w-full max-w-7xl mx-auto min-h-[85vh]">
          {/* Subscription Alert/Trial banner */}
          {subscription.status === "trial" && currentTab !== "subscription" && (
            <div className={`mb-6 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-right border ${
              darkMode 
                ? "bg-amber-500/10 border-amber-500/20" 
                : "bg-amber-50 border-amber-200"
            }`}>
              <div className="flex items-center gap-3">
                <span className="text-xl">🎁</span>
                <div>
                  <h4 className={`text-xs font-bold ${darkMode ? "text-amber-400" : "text-amber-800"}`}>أنت تستمتع بالفترة التجريبية المجانية (أول شهر مجاناً) لميزان</h4>
                  <p className={`text-[10px] mt-0.5 leading-relaxed ${darkMode ? "text-slate-300" : "text-slate-700"}`}>
                    متبقي لديك {(() => {
                      const end = new Date(subscription.trialEndDate).getTime();
                      const start = new Date().getTime();
                      const diff = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
                      return diff > 0 ? diff : 0;
                    })()} يوماً للوصول الكامل. يمكنك ترقية الباقة وتفعيل الاشتراك بالجنيه المصري في أي وقت لتأمين سير العمل بمكتبك.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setCurrentTab("subscription")}
                className="px-4 py-1.5 rounded-xl text-[10px] font-black bg-[#C5A059] hover:bg-[#B38E46] text-slate-950 transition-colors cursor-pointer flex items-center gap-1 shrink-0"
              >
                ترقية وتأمين الباقة الآن 👑
              </button>
            </div>
          )}
          {renderActiveView()}
        </div>

        {/* Humble, Professional Footer */}
        <footer className={`mt-16 pt-6 border-t text-center text-[10px] leading-relaxed max-w-7xl mx-auto pb-4 ${
          darkMode ? "border-[#1E293B] text-slate-500" : "border-slate-200/80 text-slate-600"
        }`}>
          <p>© {new Date().getFullYear()} {officeConfig.officeName || "مكتب المحاماة"} - نظام ميزان السحابي لإدارة مكاتب المحاماة.</p>
          <p className="mt-1 font-bold text-[#C5A059] tracking-wider">جميع الحقوق محفوظة BY H O S S A M ABBAS</p>
        </footer>

      </div>

    </div>
  );
}
