import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import rateLimit from "express-rate-limit";
import crypto from "crypto";
import multer from "multer";
import { Storage } from "@google-cloud/storage";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB limit
});

// Setup Google Cloud Storage
let gcs: Storage;
if (process.env.GCS_SERVICE_ACCOUNT_KEY) {
  try {
    const credentials = JSON.parse(process.env.GCS_SERVICE_ACCOUNT_KEY);
    gcs = new Storage({ credentials });
  } catch (err) {
    console.warn("Could not parse GCS_SERVICE_ACCOUNT_KEY as JSON. Falling back to application default credentials.");
    gcs = new Storage();
  }
} else {
  gcs = new Storage();
}

const GCS_BUCKET_NAME = process.env.GCS_BUCKET_NAME;

dotenv.config();

const DB_FILE = path.join(process.cwd(), "db.json");

interface DbSchema {
  newUsers: any[];
  newNotifications: any[];
  isInitialized?: boolean;
  offices?: Record<string, {
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
  }>;
  // Keep flat keys for backward compatibility migration
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
        offices: parsed.offices || {},
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
    offices: {},
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

function migrateDb(db: DbSchema) {
  let changed = false;

  // 1. Ensure all users have an officeId
  if (Array.isArray(db.newUsers)) {
    db.newUsers.forEach((user: any) => {
      if (!user.officeId) {
        user.officeId = user.id;
        changed = true;
      }
    });
  }

  // 2. Ensure offices structure exists
  if (!db.offices) {
    db.offices = {};
    changed = true;
  }

  // 3. Check for legacy flat data to migrate
  const hasFlatData = db.isInitialized && (
    (Array.isArray(db.clients) && db.clients.length > 0) ||
    (Array.isArray(db.cases) && db.cases.length > 0) ||
    (Array.isArray(db.sessions) && db.sessions.length > 0) ||
    (Array.isArray(db.tasks) && db.tasks.length > 0) ||
    db.officeConfig ||
    db.subscription
  );

  if (hasFlatData) {
    // Determine target officeId: find first Owner or fallback
    const ownerUser = db.newUsers.find((u: any) => u.role === "صاحب المكتب");
    const targetOfficeId = ownerUser ? ownerUser.officeId : "office-migrated-default";

    if (!db.offices[targetOfficeId]) {
      db.offices[targetOfficeId] = {
        isInitialized: true,
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
      };
      changed = true;
    }

    // Clean up flat data to avoid redundancy
    delete db.clients;
    delete db.cases;
    delete db.sessions;
    delete db.tasks;
    delete db.documents;
    delete db.payments;
    delete db.expenses;
    delete db.auditLogs;
    delete db.leads;
    delete db.officeConfig;
    delete db.subscription;
    delete db.invoices;
  }

  if (changed) {
    writeDb(db);
    console.log("[MIGRATION] db.json successfully migrated to office-centric structure.");
  }
}

function getOfficeData(db: DbSchema, officeId: string) {
  if (!db.offices) {
    db.offices = {};
  }
  if (!db.offices[officeId]) {
    db.offices[officeId] = {
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
  return db.offices[officeId];
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
// Token -> { userId, officeId, role, isSuperUser, expiresAt }
const activeSessions = new Map<string, {
  userId: string;
  officeId: string;
  role: string;
  isSuperUser: boolean;
  expiresAt: number;
}>();

const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours

function createSession(user: any): string {
  const token = "sess_" + crypto.randomBytes(32).toString("hex") + "_" + Date.now();
  activeSessions.set(token, {
    userId: user.id,
    officeId: user.officeId || user.id,
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
  validate: { xForwardedForHeader: false, default: true },
});

const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // limit each IP to 30 registrations per windowMs
  message: { error: "لقد تجاوزت الحد الأقصى للمحاولات، يرجى المحاولة لاحقاً بعد 15 دقيقة" },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false, default: true },
});

const entranceLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 100, // limit each IP to 100 logs per 5 minutes
  message: { error: "لقد تجاوزت الحد الأقصى لتسجيل الحضور، الرجاء تخفيف الضغط على الخادم" },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false, default: true },
});

const loginLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 15, // limit each IP to 15 login attempts per 5 minutes to prevent brute-force
  message: { error: "لقد تجاوزت الحد الأقصى لمحاولات تسجيل الدخول، يرجى المحاولة بعد 5 دقائق" },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false, default: true },
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
        id: "usr-super",
        name: "مدير المنصة والاشتراكات (Super Admin)",
        email: emailLower,
        role: "SuperAdmin",
        password: hashPassword(superPass.trim()),
        isSuperUser: true,
        avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
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
  // Execute database migration on startup
  try {
    const db = readDb();
    migrateDb(db);
  } catch (err) {
    console.error("[MIGRATION] Migration on startup failed:", err);
  }

  // Execute Super Admin environmental seeding on startup
  seedSuperAdmin();

  const app = express();
  app.set("trust proxy", 1);
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
    const session = getSession(req);

    let filteredUsers = db.newUsers;

    if (session) {
      if (!session.isSuperUser) {
        filteredUsers = db.newUsers.filter(u => u.officeId === session.officeId);
      }
    } else {
      // If NOT authenticated, exclude SuperAdmins/platform managers to protect tenant list privacy
      // but retain other normal users to support selection in standard quick-login dropdown.
      filteredUsers = db.newUsers.filter(u => !u.isSuperUser && u.role !== "SuperAdmin" && u.role !== "مدير المنصة والاشتراكات");
    }

    const sanitizedUsers = filteredUsers.map(({ password, ...user }) => user);
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
    const officeData = getOfficeData(db, session.officeId);

    res.json({
      isInitialized: officeData.isInitialized || false,
      clients: officeData.clients || [],
      cases: officeData.cases || [],
      sessions: officeData.sessions || [],
      tasks: officeData.tasks || [],
      documents: officeData.documents || [],
      payments: officeData.payments || [],
      expenses: officeData.expenses || [],
      auditLogs: officeData.auditLogs || [],
      leads: officeData.leads || [],
      officeConfig: officeData.officeConfig || null,
      subscription: officeData.subscription || null,
      invoices: officeData.invoices || []
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
    const officeId = session.officeId;

    if (!db.offices) {
      db.offices = {};
    }
    if (!db.offices[officeId]) {
      db.offices[officeId] = {
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

    const officeData = db.offices[officeId];

    if (body.isFullSync) {
      // Full database initialization or migration sync for this specific office
      officeData.isInitialized = true;
      if (Array.isArray(body.clients)) officeData.clients = body.clients;
      if (Array.isArray(body.cases)) officeData.cases = body.cases;
      if (Array.isArray(body.sessions)) officeData.sessions = body.sessions;
      if (Array.isArray(body.tasks)) officeData.tasks = body.tasks;
      if (Array.isArray(body.documents)) officeData.documents = body.documents;
      if (Array.isArray(body.payments)) officeData.payments = body.payments;
      if (Array.isArray(body.expenses)) officeData.expenses = body.expenses;
      if (Array.isArray(body.auditLogs)) officeData.auditLogs = body.auditLogs;
      if (Array.isArray(body.leads)) officeData.leads = body.leads;
      if (body.officeConfig) officeData.officeConfig = body.officeConfig;

      // Guard subscription status when fully synced (disable backdoor bypasses)
      if (body.subscription) {
        const existingSub = officeData.subscription;
        if (body.subscription.status === "active") {
          const wasActive = existingSub && existingSub.status === "active";
          if (!wasActive) {
            body.subscription.status = existingSub ? existingSub.status : "trial";
          }
        }
        officeData.subscription = body.subscription;
      }

      if (Array.isArray(body.invoices)) officeData.invoices = body.invoices;

      writeDb(db);
      return res.json({ success: true, message: "تمت مزامنة وتهيئة كامل البيانات على الخادم بنجاح" });
    } else {
      // Individual key differential sync inside the office's namespace
      const { key, data } = body;
      const whitelist = [
        "clients", "cases", "sessions", "tasks", "documents",
        "payments", "expenses", "auditLogs", "leads",
        "officeConfig", "subscription", "invoices"
      ];

      if (!key || !whitelist.includes(key)) {
        return res.status(400).json({ error: "حقل المزامنة غير صالح أو غير مصرح به" });
      }

      // Guard subscription status when key-synced (disable backdoor bypasses)
      if (key === "subscription") {
        const existingSub = officeData.subscription;
        if (data && data.status === "active") {
          const wasActive = existingSub && existingSub.status === "active";
          if (!wasActive) {
            data.status = existingSub ? existingSub.status : "trial";
          }
        }
      }

      // Update the specific whitelisted key under the office's namespace
      (officeData as any)[key] = data;
      officeData.isInitialized = true; // Mark as initialized once any write occurs

      writeDb(db);
      return res.json({ success: true, key });
    }
  });

  // Document Storage API: Upload
  app.post("/api/documents/upload", upload.single("file"), async (req, res) => {
    const session = getSession(req);
    if (!session) return res.status(401).json({ error: "غير مصرح" });
    if (!req.file) return res.status(400).json({ error: "لم يتم إرسال ملف" });

    const officeId = session.officeId;
    if (!GCS_BUCKET_NAME) {
      return res.status(500).json({ error: "إعدادات التخزين غير متوفرة (GCS_BUCKET_NAME)" });
    }

    try {
      const uuid = crypto.randomUUID();
      const originalName = req.file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, "_"); // sanitize
      const gcsPath = `offices/${officeId}/documents/${uuid}-${originalName}`;
      
      const bucket = gcs.bucket(GCS_BUCKET_NAME);
      const file = bucket.file(gcsPath);
      
      await file.save(req.file.buffer, {
        contentType: req.file.mimetype,
        resumable: false
      });

      res.json({ success: true, fileReference: gcsPath });
    } catch (err) {
      console.error("[UPLOAD ERROR]", err);
      res.status(500).json({ error: "فشل رفع الملف إلى التخزين السحابي" });
    }
  });

  // Document Storage API: Download (Signed URL)
  app.get("/api/documents/:documentId/download", async (req, res) => {
    const session = getSession(req);
    if (!session) return res.status(401).json({ error: "غير مصرح" });

    const { documentId } = req.params;
    const officeId = session.officeId;
    const db = readDb();
    const officeData = getOfficeData(db, officeId);
    
    // Check if document exists and belongs to this office
    const documentRecord = officeData.documents?.find(d => d.id === documentId);
    if (!documentRecord) {
      return res.status(404).json({ error: "المستند غير موجود" });
    }

    // Security: Only allow paths under this office's namespace
    const gcsPath = documentRecord.fileUrl;
    if (!gcsPath || !gcsPath.startsWith(`offices/${officeId}/documents/`)) {
      return res.status(403).json({ error: "غير مصرح بالوصول إلى هذا الملف" });
    }

    if (!GCS_BUCKET_NAME) {
      return res.status(500).json({ error: "إعدادات التخزين غير متوفرة (GCS_BUCKET_NAME)" });
    }

    try {
      const bucket = gcs.bucket(GCS_BUCKET_NAME);
      const file = bucket.file(gcsPath);

      // Generate a signed URL valid for 5 minutes
      const [url] = await file.getSignedUrl({
        version: "v4",
        action: "read",
        expires: Date.now() + 5 * 60 * 1000,
      });

      res.json({ success: true, url });
    } catch (err) {
      console.error("[DOWNLOAD ERROR]", err);
      res.status(500).json({ error: "فشل إنشاء رابط التحميل" });
    }
  });

  // Document Storage API: Delete
  app.delete("/api/documents/:documentId", async (req, res) => {
    const session = getSession(req);
    if (!session) return res.status(401).json({ error: "غير مصرح" });

    const { documentId } = req.params;
    const officeId = session.officeId;
    const db = readDb();
    const officeData = getOfficeData(db, officeId);
    
    // Check if document exists
    const docIndex = officeData.documents?.findIndex(d => d.id === documentId);
    if (docIndex === undefined || docIndex === -1) {
      return res.status(404).json({ error: "المستند غير موجود" });
    }

    const documentRecord = officeData.documents[docIndex];
    const gcsPath = documentRecord.fileUrl;

    if (gcsPath && gcsPath.startsWith(`offices/${officeId}/documents/`)) {
      if (GCS_BUCKET_NAME) {
        try {
          const bucket = gcs.bucket(GCS_BUCKET_NAME);
          const file = bucket.file(gcsPath);
          await file.delete({ ignoreNotFound: true });
        } catch (err) {
          console.error("[DELETE FILE ERROR]", err);
          // Continue to remove DB record even if GCS delete fails to prevent stuck states
        }
      }
    }

    // Remove from DB
    officeData.documents.splice(docIndex, 1);
    writeDb(db);

    res.json({ success: true, message: "تم حذف المستند بنجاح" });
  });

  // Manual Subscription: Create Subscription Request (Status: pending / قيد المراجعة)
  app.post("/api/subscription/request", (req, res) => {
    const session = getSession(req);
    if (!session) {
      return res.status(401).json({ error: "غير مصرح: يرجى تسجيل الدخول أولاً" });
    }

    const { planId, billingCycle } = req.body;
    if (!planId || !billingCycle) {
      return res.status(400).json({ error: "الرجاء تحديد الباقة ودورة الفوترة المطلوبة" });
    }

    // Pricing structures matching client plans
    const pricingTable: Record<string, { monthly: number; yearly: number; name: string }> = {
      basic: { monthly: 150, yearly: 1500, name: "باقة المحامي الفردي" },
      pro: { monthly: 350, yearly: 3500, name: "باقة المكتب المشترك" },
      elite: { monthly: 800, yearly: 8000, name: "باقة النخبة والمؤسسات" }
    };

    const planInfo = pricingTable[planId];
    if (!planInfo) {
      return res.status(400).json({ error: "خطة الاشتراك المحددة غير صالحة" });
    }

    const price = billingCycle === "monthly" ? planInfo.monthly : planInfo.yearly;

    const db = readDb();
    const officeId = session.officeId;
    const officeData = getOfficeData(db, officeId);

    // Create the pending subscription state
    officeData.isInitialized = true;
    officeData.subscription = {
      planId: planId,
      status: "pending",
      trialStartDate: officeData.subscription?.trialStartDate || new Date().toISOString().split("T")[0],
      trialEndDate: officeData.subscription?.trialEndDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      subscriptionStartDate: null,
      subscriptionEndDate: null,
      billingCycle: billingCycle,
      paymentMethod: null,
      cardDetails: null,
      autoRenew: false,
      amountPaid: price,
      requestDate: new Date().toISOString()
    };

    writeDb(db);
    console.log(`[SUBSCRIPTION REQUEST] Office ${officeId} requested Plan: ${planId}, Cycle: ${billingCycle}`);
    
    return res.json({ 
      success: true, 
      message: "تم تسجيل طلب الاشتراك بنجاح وهو قيد المراجعة حالياً",
      subscription: officeData.subscription 
    });
  });

  // Super-Admin: List all offices with "pending" subscription requests
  app.get("/api/subscription/pending-requests", (req, res) => {
    const session = getSession(req);
    if (!session) {
      return res.status(401).json({ error: "غير مصرح: يرجى تسجيل الدخول أولاً" });
    }
    if (!session.isSuperUser) {
      return res.status(403).json({ error: "غير مصرح: هذه الصفحة مخصصة لمدير المنصة فقط" });
    }

    const db = readDb();
    const pendingList: any[] = [];

    if (db.offices) {
      Object.keys(db.offices).forEach(officeId => {
        const office = db.offices![officeId];
        const sub = office.subscription;
        if (sub && sub.status === "pending") {
          // Find the owner user of this office to get their info
          const owner = db.newUsers.find(u => u.officeId === officeId && !u.isSuperUser);
          const officeName = office.officeConfig?.officeName || owner?.officeName || `مكتب ${owner?.name || officeId}`;
          pendingList.push({
            officeId,
            officeName,
            lawyerName: owner?.name || "محامي غير معروف",
            email: owner?.email || "غير متوفر",
            phone: office.officeConfig?.phone || owner?.phone || "غير متوفر",
            requestedPlan: sub.planId,
            billingCycle: sub.billingCycle,
            amount: sub.amountPaid || 0,
            requestDate: sub.requestDate || new Date().toISOString()
          });
        }
      });
    }

    return res.json({ success: true, requests: pendingList });
  });

  // Super-Admin: Approve or Reject subscription request
  app.post("/api/subscription/approve", (req, res) => {
    const session = getSession(req);
    if (!session) {
      return res.status(401).json({ error: "غير مصرح: يرجى تسجيل الدخول أولاً" });
    }
    if (!session.isSuperUser) {
      return res.status(403).json({ error: "غير مصرح: هذه العملية مخصصة لمدير المنصة فقط" });
    }

    const { officeId, planId, billingCycle, status } = req.body;
    if (!officeId) {
      return res.status(400).json({ error: "معرف المكتب مطلوب" });
    }

    const db = readDb();
    if (!db.offices || !db.offices[officeId]) {
      return res.status(404).json({ error: "المكتب المطلوب غير موجود" });
    }

    const officeData = db.offices[officeId];

    if (status === "active") {
      const pricingTable: Record<string, { monthly: number; yearly: number; name: string }> = {
        basic: { monthly: 150, yearly: 1500, name: "باقة المحامي الفردي" },
        pro: { monthly: 350, yearly: 3500, name: "باقة المكتب المشترك" },
        elite: { monthly: 800, yearly: 8000, name: "باقة النخبة والمؤسسات" }
      };

      const requestedPlan = planId || officeData.subscription?.planId || "pro";
      const requestedCycle = billingCycle || officeData.subscription?.billingCycle || "monthly";
      const planInfo = pricingTable[requestedPlan] || pricingTable["pro"];
      const price = requestedCycle === "monthly" ? planInfo.monthly : planInfo.yearly;

      officeData.subscription = {
        planId: requestedPlan,
        status: "active",
        trialStartDate: officeData.subscription?.trialStartDate || new Date().toISOString().split("T")[0],
        trialEndDate: officeData.subscription?.trialEndDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        subscriptionStartDate: new Date().toISOString().split("T")[0],
        subscriptionEndDate: requestedCycle === "monthly"
          ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
          : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        billingCycle: requestedCycle,
        paymentMethod: "instapay", // manual/bank/instapay
        cardDetails: null,
        autoRenew: true,
        amountPaid: price,
        activatedBy: session.userId,
        activationDate: new Date().toISOString()
      };

      // Create a verified invoice
      if (!Array.isArray(officeData.invoices)) {
        officeData.invoices = [];
      }

      const newInvoice = {
        id: `INV-MANUAL-${Math.floor(100000 + Math.random() * 900000)}`,
        date: new Date().toISOString().split("T")[0],
        planName: planInfo.name,
        amount: price,
        currency: "ج.م",
        paymentMethod: "تفعيل يدوي (تحويل / كاش)",
        status: "paid"
      };
      officeData.invoices.unshift(newInvoice);

      writeDb(db);
      console.log(`[SUBSCRIPTION APPROVED] Office ${officeId} activated on Plan: ${requestedPlan}`);
      return res.json({ success: true, message: "تم تفعيل الاشتراك بنجاح", subscription: officeData.subscription });
    } else if (status === "rejected" || status === "expired") {
      const existingSub = officeData.subscription;
      officeData.subscription = {
        planId: existingSub?.planId || "pro",
        status: "expired",
        trialStartDate: existingSub?.trialStartDate || new Date().toISOString().split("T")[0],
        trialEndDate: existingSub?.trialEndDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        subscriptionStartDate: null,
        subscriptionEndDate: null,
        billingCycle: existingSub?.billingCycle || "monthly",
        paymentMethod: null,
        cardDetails: null,
        autoRenew: false,
        amountPaid: 0,
        requestDate: null
      };

      writeDb(db);
      console.log(`[SUBSCRIPTION REJECTED] Office ${officeId} request rejected/canceled.`);
      return res.json({ success: true, message: "تم إلغاء/رفض طلب الاشتراك", subscription: officeData.subscription });
    }

    return res.status(400).json({ error: "حالة التحديث غير صالحة" });
  });

  // Client: Get Verified Subscription Status
  app.get("/api/subscription-status", (req, res) => {
    const session = getSession(req);
    if (!session) {
      return res.status(401).json({ error: "غير مصرح: يرجى تسجيل الدخول أولاً" });
    }

    const db = readDb();
    const officeData = getOfficeData(db, session.officeId);

    res.json({
      success: true,
      subscription: officeData.subscription || {
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
      },
      invoices: officeData.invoices || []
    });
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

      // Security check: cannot edit users from other offices unless SuperAdmin
      if (!session.isSuperUser && existingUser.officeId !== session.officeId) {
        return res.status(403).json({ error: "غير مصرح: لا يمكنك تعديل مستخدمين من مكاتب أخرى" });
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
      
      // Filter users to only return colleague users of the same office
      const sanitizedUsers = db.newUsers
        .filter(u => session.isSuperUser || u.officeId === session.officeId)
        .map(({ password, ...user }) => user);
      return res.json({ success: true, users: sanitizedUsers });
      
    } else {
      // 2. SELF-REGISTRATION / NEW USER flow (or AD-HOC team member creation by owner)
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

      const session = getSession(req);
      
      let officeId = body.id; // Default to their own ID (self registration / new office)
      let role = "صاحب المكتب"; // Default role
      let permissions = {
        view: true,
        add: true,
        edit: true,
        delete: true,
        export: true,
        viewFinancials: true
      };

      if (session) {
        // If a logged-in user is adding a new user, they must be owner or super
        const isOwnerOrSuper = session.isSuperUser || session.role === "صاحب المكتب" || session.role === "SuperAdmin" || session.role === "مدير المنصة والاشتراكات";
        if (!isOwnerOrSuper) {
          return res.status(403).json({ error: "غير مصرح: لا تملك الصلاحيات الكافية لإضافة مستخدم جديد" });
        }
        officeId = session.officeId;
        role = body.role || "محامي"; // Allow role from body when created by Owner
        permissions = body.permissions || {
          view: true,
          add: true,
          edit: role !== "محام تدريب",
          delete: role === "صاحب المكتب",
          export: role === "صاحب المكتب",
          viewFinancials: role === "صاحب المكتب" || role === "محاسب"
        };
      }

      const plainPassword = body.password || "1234";
      const hashedPassword = hashPassword(plainPassword);

      const newUser = {
        id: body.id,
        name: body.name.trim(),
        email: searchEmail,
        password: hashedPassword,
        role: role,
        isSuperUser: false,  // Absolutely block escalations
        isActive: true,
        officeId: officeId,
        avatarUrl: body.avatarUrl || "",
        permissions: permissions,
        officeName: body.officeName ? body.officeName.trim() : "مكتب ميزان للمحاماة",
        registrationDevice: body.registrationDevice || "",
        registrationLocation: body.registrationLocation || "",
        createdAt: body.createdAt || new Date().toISOString()
      };

      db.newUsers.push(newUser);
      writeDb(db);

      // Filter users list to return only members of the caller's office (if logged in)
      const targetOfficeId = session ? session.officeId : officeId;
      const sanitizedUsers = db.newUsers
        .filter(u => !session || session.isSuperUser || u.officeId === targetOfficeId)
        .map(({ password, ...user }) => user);
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

