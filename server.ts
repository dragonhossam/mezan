import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import rateLimit from "express-rate-limit";

dotenv.config();

const DB_FILE = path.join(process.cwd(), "db.json");

interface DbSchema {
  newUsers: any[];
  newNotifications: any[];
  isInitialized?: boolean;
  clients?: any[];
  cases?: any[];
  sessions?: any[];
  tasks?: any[];
  documents?: any[];
  payments?: any[];
  expenses?: any[];
  auditLogs?: any[];
  leads?: any[];
  officeConfig?: any;
  subscription?: any;
  invoices?: any[];
}

function readDb(): DbSchema {
  try {
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, "utf-8");
      const parsed = JSON.parse(content);
      return {
        newUsers: parsed.newUsers || [],
        newNotifications: parsed.newNotifications || [],
        isInitialized: parsed.isInitialized || false,
        clients: parsed.clients || [],
        cases: parsed.cases || [],
        sessions: parsed.sessions || [],
        tasks: parsed.tasks || [],
        documents: parsed.documents || [],
        payments: parsed.payments || [],
        expenses: parsed.expenses || [],
        auditLogs: parsed.auditLogs || [],
        leads: parsed.leads || [],
        officeConfig: parsed.officeConfig || null,
        subscription: parsed.subscription || null,
        invoices: parsed.invoices || []
      };
    }
  } catch (err) {
    console.error("Error reading db.json:", err);
  }
  return {
    newUsers: [],
    newNotifications: [],
    isInitialized: false,
    clients: [],
    cases: [],
    sessions: [],
    tasks: [],
    documents: [],
    payments: [],
    expenses: [],
    auditLogs: [],
    leads: [],
    officeConfig: null,
    subscription: null,
    invoices: []
  };
}

function writeDb(data: DbSchema) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing db.json:", err);
  }
}

// Security & Password Helpers
function isBcryptHash(str: string): boolean {
  if (!str) return false;
  return (
    (str.startsWith("$2a$") || str.startsWith("$2b$") || str.startsWith("$2y$")) &&
    str.length === 60
  );
}

function hashPassword(password: string): string {
  if (!password) return "";
  if (isBcryptHash(password)) return password;
  return bcrypt.hashSync(password, 10);
}

function comparePassword(password: string, hash: string): boolean {
  if (!password || !hash) return false;
  if (!isBcryptHash(hash)) {
    return password.trim() === hash.trim();
  }
  try {
    return bcrypt.compareSync(password, hash);
  } catch (err) {
    console.error("Error comparing passwords:", err);
    return false;
  }
}

// Session Memory Store
// Token -> { userId, role, isSuperUser, expiresAt }
const activeSessions = new Map<string, {
  userId: string;
  role: string;
  isSuperUser: boolean;
  expiresAt: number;
}>();

const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours

function createSession(user: any): string {
  const token = "sess_" + Math.random().toString(36).substring(2) + "_" + Date.now();
  activeSessions.set(token, {
    userId: user.id,
    role: user.role,
    isSuperUser: !!user.isSuperUser,
    expiresAt: Date.now() + SESSION_DURATION
  });
  return token;
}

function getSession(req: express.Request) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  const token = authHeader.split(" ")[1];
  const session = activeSessions.get(token);
  if (!session) return null;
  if (Date.now() > session.expiresAt) {
    activeSessions.delete(token);
    return null;
  }
  return { token, ...session };
}

// Rate Limiters
const generalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // limit each IP to 100 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
});

const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // limit each IP to 30 registrations per windowMs
  message: { error: "لقد تجاوزت الحد الأقصى للمحاولات، يرجى المحاولة لاحقاً بعد 15 دقيقة" },
  standardHeaders: true,
  legacyHeaders: false,
});

const entranceLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 100, // limit each IP to 100 logs per 5 minutes
  message: { error: "لقد تجاوزت الحد الأقصى لتسجيل الحضور، الرجاء تخفيف الضغط على الخادم" },
  standardHeaders: true,
  legacyHeaders: false,
});

const loginLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 15, // limit each IP to 15 login attempts per 5 minutes to prevent brute-force
  message: { error: "لقد تجاوزت الحد الأقصى لمحاولات تسجيل الدخول، يرجى المحاولة بعد 5 دقائق" },
  standardHeaders: true,
  legacyHeaders: false,
});

// Super Admin environmental seeding helper
function seedSuperAdmin() {
  const superEmail = process.env.SUPER_ADMIN_EMAIL;
  const superPass = process.env.SUPER_ADMIN_INITIAL_PASSWORD;
  if (!superEmail || !superPass) {
    console.log("[SEED] SUPER_ADMIN_EMAIL or SUPER_ADMIN_INITIAL_PASSWORD env variables are not fully configured. Skipping auto-seeding.");
    return;
  }
  try {
    const db = readDb();
    const emailLower = superEmail.trim().toLowerCase();
    const exists = db.newUsers.some(u => u.email && u.email.toLowerCase() === emailLower);
    if (!exists) {
      const superUser = {
        id: "usr-super-env",
        name: "مدير المنصة والاشتراكات (Super Admin)",
        email: emailLower,
        role: "SuperAdmin",
        password: hashPassword(superPass.trim()),
        isSuperUser: true,
        avatarUrl: "",
        permissions: { view: true, add: true, edit: true, delete: true, export: true, viewFinancials: true }
      };
      db.newUsers.push(superUser);
      writeDb(db);
      console.log(`[SEED] Created Super Admin account for ${emailLower} successfully.`);
    } else {
      console.log(`[SEED] Super Admin with email ${emailLower} already exists.`);
    }
  } catch (err) {
    console.error("[SEED] Error seeding super admin account:", err);
  }
}

async function startServer() {
  // Execute Super Admin environmental seeding on startup
  seedSuperAdmin();

  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use(generalLimiter);

  // API routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Shared state routes
  // Never expose passwords or password hashes to the client
  app.get("/api/shared-data", (req, res) => {
    const db = readDb();
    const sanitizedUsers = db.newUsers.map(({ password, ...user }) => user);
    res.json({
      users: sanitizedUsers,
      notifications: db.newNotifications
    });
  });

  // Securely get all office data (requires valid session token)
  app.get("/api/office-data", (req, res) => {
    const session = getSession(req);
    if (!session) {
      return res.status(401).json({ error: "غير مصرح: يرجى تسجيل الدخول أولاً" });
    }

    const db = readDb();
    res.json({
      isInitialized: db.isInitialized || false,
      clients: db.clients || [],
      cases: db.cases || [],
      sessions: db.sessions || [],
      tasks: db.tasks || [],
      documents: db.documents || [],
      payments: db.payments || [],
      expenses: db.expenses || [],
      auditLogs: db.auditLogs || [],
      leads: db.leads || [],
      officeConfig: db.officeConfig || null,
      subscription: db.subscription || null,
      invoices: db.invoices || []
    });
  });

  // Securely persist office data (requires valid session token)
  app.post("/api/save-office-data", (req, res) => {
    const session = getSession(req);
    if (!session) {
      return res.status(401).json({ error: "غير مصرح: يرجى تسجيل الدخول أولاً" });
    }

    const db = readDb();
    const body = req.body;

    if (body.isFullSync) {
      // Full database initialization or migration sync
      db.isInitialized = true;
      if (Array.isArray(body.clients)) db.clients = body.clients;
      if (Array.isArray(body.cases)) db.cases = body.cases;
      if (Array.isArray(body.sessions)) db.sessions = body.sessions;
      if (Array.isArray(body.tasks)) db.tasks = body.tasks;
      if (Array.isArray(body.documents)) db.documents = body.documents;
      if (Array.isArray(body.payments)) db.payments = body.payments;
      if (Array.isArray(body.expenses)) db.expenses = body.expenses;
      if (Array.isArray(body.auditLogs)) db.auditLogs = body.auditLogs;
      if (Array.isArray(body.leads)) db.leads = body.leads;
      if (body.officeConfig) db.officeConfig = body.officeConfig;
      if (body.subscription) db.subscription = body.subscription;
      if (Array.isArray(body.invoices)) db.invoices = body.invoices;

      writeDb(db);
      return res.json({ success: true, message: "تمت مزامنة وتهيئة كامل البيانات على الخادم بنجاح" });
    } else {
      // Individual key differential sync
      const { key, data } = body;
      const whitelist = [
        "clients", "cases", "sessions", "tasks", "documents",
        "payments", "expenses", "auditLogs", "leads",
        "officeConfig", "subscription", "invoices"
      ];

      if (!key || !whitelist.includes(key)) {
        return res.status(400).json({ error: "حقل المزامنة غير صالح أو غير مصرح به" });
      }

      // Update the specific whitelisted key
      (db as any)[key] = data;
      db.isInitialized = true; // Mark as initialized once any write occurs

      writeDb(db);
      return res.json({ success: true, key });
    }
  });

  // Secure login endpoint
  app.post("/api/login", loginLimiter, (req, res) => {
    const { email, userId, password } = req.body;
    if (!password) {
      return res.status(400).json({ error: "كلمة المرور مطلوبة لتسجيل الدخول" });
    }

    const db = readDb();
    let targetUser: any = null;

    if (email) {
      const searchEmail = email.trim().toLowerCase();
      targetUser = db.newUsers.find(u => u.email && u.email.toLowerCase() === searchEmail);
    } else if (userId) {
      targetUser = db.newUsers.find(u => u.id === userId);
    }

    if (!targetUser) {
      return res.status(401).json({ error: "حساب المستخدم غير موجود بالمنصة" });
    }

    const expectedHash = targetUser.password || hashPassword("1234");
    if (!comparePassword(password.trim(), expectedHash)) {
      return res.status(401).json({ error: "كلمة المرور أو الرمز السري غير صحيح" });
    }

    // Create secure session token
    const token = createSession(targetUser);

    // Check for weak default passwords or if it matches the initial env password
    const isWeak = password.trim() === "1234" || 
                   password.trim() === "admin" || 
                   expectedHash === "1234" || 
                   expectedHash === "admin" ||
                   (process.env.SUPER_ADMIN_INITIAL_PASSWORD && password.trim() === process.env.SUPER_ADMIN_INITIAL_PASSWORD.trim());

    // Strip password field
    const { password: _, ...sanitizedUser } = targetUser;

    res.json({
      success: true,
      token,
      user: sanitizedUser,
      resetRequired: isWeak
    });
  });

  // Secure register & update endpoint
  app.post("/api/register", registerLimiter, (req, res) => {
    const body = req.body;
    if (!body || !body.id || !body.email) {
      return res.status(400).json({ error: "بيانات التسجيل غير مكتملة" });
    }

    const db = readDb();
    const searchEmail = body.email.trim().toLowerCase();
    
    // Check if user already exists
    const existingUser = db.newUsers.find(u => u.id === body.id || (u.email && u.email.toLowerCase() === searchEmail));
    
    if (existingUser) {
      // 1. UPDATE flow - Requires proper authentication!
      const session = getSession(req);
      if (!session) {
        return res.status(401).json({ error: "غير مصرح: يرجى تسجيل الدخول أولاً لإجراء هذا التحديث" });
      }
      
      const isUpdatingSelf = session.userId === existingUser.id;
      const isOwnerOrSuper = session.isSuperUser || session.role === "صاحب المكتب" || session.role === "SuperAdmin" || session.role === "مدير المنصة والاشتراكات";
      
      if (!isUpdatingSelf && !isOwnerOrSuper) {
        return res.status(403).json({ error: "غير مصرح: لا تملك الصلاحيات الكافية لتعديل هذا الحساب" });
      }

      // Secure Whitelist fields for updates
      if (body.password) {
        existingUser.password = hashPassword(body.password);
      }
      
      if (isOwnerOrSuper) {
        // Only admins can change role and permissions
        if (body.role && body.role !== "SuperAdmin" && body.role !== "مدير المنصة والاشتراكات") {
          existingUser.role = body.role;
        }
        if (body.permissions) {
          existingUser.permissions = {
            view: !!body.permissions.view,
            add: !!body.permissions.add,
            edit: !!body.permissions.edit,
            delete: !!body.permissions.delete,
            export: !!body.permissions.export,
            viewFinancials: !!body.permissions.viewFinancials,
          };
        }
      }
      
      if (body.name) existingUser.name = body.name.trim();
      if (body.avatarUrl !== undefined) existingUser.avatarUrl = body.avatarUrl;

      writeDb(db);
      
      const sanitizedUsers = db.newUsers.map(({ password, ...user }) => user);
      return res.json({ success: true, users: sanitizedUsers });
      
    } else {
      // 2. SELF-REGISTRATION / NEW USER flow
      // Block email conflicts to prevent account hijack
      const emailConflict = db.newUsers.some(u => u.email && u.email.toLowerCase() === searchEmail);
      if (emailConflict) {
        return res.status(400).json({ error: "البريد الإلكتروني المدخل مسجل مسبقاً بحساب آخر" });
      }

      // Input Validation
      if (!body.name || body.name.trim().length < 2) {
        return res.status(400).json({ error: "يرجى كتابة الاسم الكامل للمحامي بشكل صحيح" });
      }
      if (!searchEmail.includes("@")) {
        return res.status(400).json({ error: "البريد الإلكتروني غير صالح" });
      }

      // Enforce safe server-side defaults:
      // A self-registered trial starts as Owner ("صاحب المكتب"), never SuperAdmin.
      const plainPassword = body.password || "1234";
      const hashedPassword = hashPassword(plainPassword);

      const newUser = {
        id: body.id,
        name: body.name.trim(),
        email: searchEmail,
        password: hashedPassword,
        role: "صاحب المكتب", // Safe default role
        isSuperUser: false,  // Absolutely block escalations
        isActive: true,
        avatarUrl: body.avatarUrl || "",
        permissions: {
          view: true,
          add: true,
          edit: true,
          delete: true,
          export: true,
          viewFinancials: true
        },
        officeName: body.officeName ? body.officeName.trim() : "مكتب ميزان للمحاماة",
        registrationDevice: body.registrationDevice || "",
        registrationLocation: body.registrationLocation || "",
        createdAt: body.createdAt || new Date().toISOString()
      };

      db.newUsers.push(newUser);
      writeDb(db);

      const sanitizedUsers = db.newUsers.map(({ password, ...user }) => user);
      return res.json({ success: true, users: sanitizedUsers });
    }
  });

  // Secure log-entrance with input validation and rate-limiting
  app.post("/api/log-entrance", entranceLimiter, (req, res) => {
    const notification = req.body;
    if (!notification || !notification.id || !notification.userName) {
      return res.status(400).json({ error: "بيانات الإشعار غير صالحة" });
    }
    
    // Strict Whitelisting and Sanitization
    const sanitizedNotification = {
      id: String(notification.id).trim(),
      userName: String(notification.userName).trim(),
      userRole: String(notification.userRole || "محامي").trim(),
      userEmail: String(notification.userEmail || "").trim(),
      type: String(notification.type || "login").trim(),
      timestamp: String(notification.timestamp || new Date().toISOString()),
      location: notification.location ? String(notification.location).trim() : null,
      coordinates: notification.coordinates ? String(notification.coordinates).trim() : null,
      isRead: false
    };

    const db = readDb();
    const existingIndex = db.newNotifications.findIndex(n => n.id === sanitizedNotification.id);
    if (existingIndex !== -1) {
      db.newNotifications[existingIndex] = sanitizedNotification;
    } else {
      db.newNotifications.unshift(sanitizedNotification);
    }
    if (db.newNotifications.length > 1000) {
      db.newNotifications = db.newNotifications.slice(0, 1000);
    }
    writeDb(db);
    res.json({ success: true, notifications: db.newNotifications });
  });

  // Secure clear-notifications (Requires login)
  app.post("/api/clear-notifications", (req, res) => {
    const session = getSession(req);
    if (!session) {
      return res.status(401).json({ error: "غير مصرح: يرجى تسجيل الدخول أولاً" });
    }

    const db = readDb();
    db.newNotifications = [];
    writeDb(db);
    res.json({ success: true });
  });

  // Secure suggest-legal endpoint (Requires login to prevent quota abuse)
  app.post("/api/suggest-legal", async (req, res) => {
    const session = getSession(req);
    if (!session) {
      return res.status(401).json({ error: "غير مصرح: يرجى تسجيل الدخول أولاً للوصول للمستشار الذكي" });
    }

    try {
      const { type, caseType, context } = req.body;
      
      let prompt = "";
      if (type === "case") {
        prompt = `بصفتك مستشار قانوني محترف، اقترح وصفاً قانونياً دقيقاً ورسمياً لقضية من نوع "${caseType}". السياق أو الملاحظات الإضافية: "${context || 'لا يوجد'}". الوصف يجب أن يكون جاهزاً للاستخدام في نظام إدارة قضايا محاماة (فقرة واحدة أو فقرتين).`;
      } else if (type === "document") {
        prompt = `بصفتك مستشار قانوني محترف، اقترح صياغة قانونية أو هيكل لمستند من نوع "${caseType}". السياق أو الملاحظات الإضافية: "${context || 'لا يوجد'}". الصياغة يجب أن تكون رسمية ودقيقة.`;
      } else {
        return res.status(400).json({ error: "Invalid type" });
      }

      const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt,
      });

      res.json({ suggestion: response.text });
    } catch (error: any) {
      console.error("Gemini API Error:", error);
      res.status(500).json({ error: error.message || "Failed to generate suggestion" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

