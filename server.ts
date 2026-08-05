import express from "express";
import "express-async-errors";
import path from "path";
import fs from "fs";
import { db } from "./src/db/index.js";
import * as schema from "./src/db/schema.js";
import { eq, and, notInArray, desc, sql } from "drizzle-orm";
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

let gcs: Storage;
if (process.env.GCS_SERVICE_ACCOUNT_KEY) {
  try {
    const credentials = JSON.parse(process.env.GCS_SERVICE_ACCOUNT_KEY);
    gcs = new Storage({ credentials });
  } catch (err) {
    console.warn("Could not parse GCS_SERVICE_ACCOUNT_KEY as JSON.");
    gcs = new Storage();
  }
} else {
  gcs = new Storage();
}
const GCS_BUCKET_NAME = process.env.GCS_BUCKET_NAME;

dotenv.config();

function isBcryptHash(str: string): boolean {
  if (!str) return false;
  return ((str.startsWith("$2a$") || str.startsWith("$2b$") || str.startsWith("$2y$")) && str.length === 60);
}
function hashPassword(password: string): string {
  if (!password) return "";
  if (isBcryptHash(password)) return password;
  return bcrypt.hashSync(password, 10);
}
function comparePassword(password: string, hash: string): boolean {
  if (!password || !hash) return false;
  if (!isBcryptHash(hash)) return password.trim() === hash.trim();
  try { return bcrypt.compareSync(password, hash); } catch (err) { return false; }
}

const activeSessions = new Map<string, { userId: string; officeId: string; role: string; isSuperUser: boolean; expiresAt: number; }>();
const SESSION_DURATION = 24 * 60 * 60 * 1000;
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
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  const token = authHeader.split(" ")[1];
  const session = activeSessions.get(token);
  if (!session) return null;
  if (Date.now() > session.expiresAt) {
    activeSessions.delete(token);
    return null;
  }
  return { token, ...session };
}

const generalLimiter = rateLimit({ windowMs: 1 * 60 * 1000, max: 100, message: { error: "Too many requests, please try again later." }, standardHeaders: true, legacyHeaders: false, validate: { xForwardedForHeader: false, default: true } });
const registerLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 30, message: { error: "Limit exceeded" }, standardHeaders: true, legacyHeaders: false, validate: { xForwardedForHeader: false, default: true } });
const entranceLimiter = rateLimit({ windowMs: 5 * 60 * 1000, max: 100, message: { error: "Limit exceeded" }, standardHeaders: true, legacyHeaders: false, validate: { xForwardedForHeader: false, default: true } });
const loginLimiter = rateLimit({ windowMs: 5 * 60 * 1000, max: 15, message: { error: "Limit exceeded" }, standardHeaders: true, legacyHeaders: false, validate: { xForwardedForHeader: false, default: true } });

async function syncTable(table: any, data: any[], officeId: string) {
  if (!data || data.length === 0) {
    await db.delete(table).where(eq(table.officeId, officeId));
    return;
  }
  const incomingIds = data.map((item: any) => item.id).filter(Boolean);
  if (incomingIds.length) {
    await db.delete(table).where(and(eq(table.officeId, officeId), notInArray(table.id, incomingIds)));
  } else {
    await db.delete(table).where(eq(table.officeId, officeId));
  }
  for (const item of data) {
    try {
      await db.insert(table).values({ ...item, officeId }).onConflictDoUpdate({ target: table.id, set: { ...item, officeId } });
    } catch(e) { console.error('Sync error:', e); }
  }
}

/*
 * CRITICAL SECURITY WARNING:
 * NEVER, UNDER ANY CIRCUMSTANCES, REINTRODUCE HARDCODED FALLBACK CREDENTIALS IN THIS SEED FUNCTION.
 * Seeding MUST ONLY run if actual, secure environment variables (SUPER_ADMIN_EMAIL and SUPER_ADMIN_INITIAL_PASSWORD)
 * are provided in the runtime configuration. Hardcoding default emails or passwords (like 'superuser@lawmizan.com' or 'superuser123')
 * creates high-risk backdoors. Additionally, NEVER force-overwrite any existing user's password, role,
 * or permissions automatically during startup, as this is destructive and insecure.
 */
async function seedSuperAdmin() {
  const superEmail = process.env.SUPER_ADMIN_EMAIL;
  const superPass = process.env.SUPER_ADMIN_INITIAL_PASSWORD;

  if (!superEmail || !superPass) {
    console.warn("[SEED] WARNING: SUPER_ADMIN_EMAIL or SUPER_ADMIN_INITIAL_PASSWORD env variable is missing. Skipping Super Admin seeding.");
    return;
  }

  try {
    const emailLower = superEmail.trim().toLowerCase();
    const existing = await db.select().from(schema.users).where(eq(schema.users.email, emailLower));
    
    if (existing.length > 0) {
      console.log(`[SEED] Seeding skipped. A user with email ${emailLower} already exists in the database. Existing accounts must never be overwritten on startup.`);
      return;
    }

    // Insert default office if not present
    await db.insert(schema.offices).values({ id: "office-migrated-default", name: "مكتب افتراضي" }).onConflictDoNothing();
    
    // Insert new super admin safely
    await db.insert(schema.users).values({
      id: "usr-super",
      name: "مدير المنصة والاشتراكات (Super Admin)",
      email: emailLower,
      role: "SuperAdmin",
      password: hashPassword(superPass.trim()),
      isSuperUser: true,
      officeId: "office-migrated-default",
      permissions: { view: true, add: true, edit: true, delete: true, export: true, viewFinancials: true }
    });
    console.log(`[SEED] Created new Super Admin account for ${emailLower} successfully.`);
  } catch (err) {
    console.error("[SEED] Error seeding super admin account:", err);
  }
}

async function startServer() {
  seedSuperAdmin();
  const app = express();
  app.set("trust proxy", 1);
  const PORT = 3000;

  app.use(express.json());
  app.use(generalLimiter);

  app.get("/api/health", async (req, res) => res.json({ status: "ok" }));

  app.get("/api/shared-data", async (req, res) => {
    const session = getSession(req);
    let users = [];
    if (session) {
      if (session.isSuperUser) {
        users = await db.select().from(schema.users);
      } else {
        users = await db.select().from(schema.users).where(eq(schema.users.officeId, session.officeId));
      }
    } else {
      users = await db.select().from(schema.users).where(eq(schema.users.isSuperUser, false));
    }
    const sanitized = users.map(({ password, ...user }) => user);
    res.json({ success: true, users: sanitized });
  });

  app.post("/api/login", loginLimiter, async (req, res) => {
    const { email, userId, password } = req.body;
    if (!password) return res.status(400).json({ error: "كلمة المرور مطلوبة لتسجيل الدخول" });
    
    let targetUser: any = null;
    if (email) {
      const searchEmail = email.trim().toLowerCase();
      const users = await db.select().from(schema.users).where(eq(schema.users.email, searchEmail));
      if (users.length) targetUser = users[0];
    } else if (userId) {
      const users = await db.select().from(schema.users).where(eq(schema.users.id, userId));
      if (users.length) targetUser = users[0];
    }
    
    if (!targetUser) return res.status(401).json({ error: "حساب المستخدم غير موجود بالمنصة" });
    
    const expectedHash = targetUser.password || hashPassword("1234");
    if (!comparePassword(password.trim(), expectedHash)) {
      return res.status(401).json({ error: "كلمة المرور أو الرمز السري غير صحيح" });
    }
    
    const token = createSession(targetUser);
    const isWeak = password.trim() === "1234" || password.trim() === "admin" || expectedHash === "1234" || expectedHash === "admin" || (process.env.SUPER_ADMIN_INITIAL_PASSWORD && password.trim() === process.env.SUPER_ADMIN_INITIAL_PASSWORD.trim());
    
    const { password: _, ...sanitizedUser } = targetUser;
    res.json({ success: true, token, user: sanitizedUser, resetRequired: isWeak });
  });

  app.get("/api/office-data", async (req, res) => {
    const session = getSession(req);
    if (!session) return res.status(401).json({ error: "غير مصرح" });
    const oid = session.officeId;
    
    try {
      const officeRec = await db.select().from(schema.offices).where(eq(schema.offices.id, oid));
      if (!officeRec.length) return res.json({ isInitialized: false });
      
      const o = officeRec[0];
      const data = {
        isInitialized: true,
        officeConfig: { officeName: o.name, lawyerName: o.lawyerName, logoText: o.logoText, address: o.address, phone: o.phone, email: o.email, taxNumber: o.taxNumber, barAssociationNumber: o.barAssociationNumber, reminderSettings: o.reminderSettings },
        subscription: o.subscription,
        clients: await db.select().from(schema.clients).where(eq(schema.clients.officeId, oid)),
        cases: await db.select().from(schema.cases).where(eq(schema.cases.officeId, oid)),
        sessions: await db.select().from(schema.courtSessions).where(eq(schema.courtSessions.officeId, oid)),
        tasks: await db.select().from(schema.tasks).where(eq(schema.tasks.officeId, oid)),
        documents: await db.select().from(schema.documents).where(eq(schema.documents.officeId, oid)),
        payments: await db.select().from(schema.payments).where(eq(schema.payments.officeId, oid)),
        expenses: await db.select().from(schema.expenses).where(eq(schema.expenses.officeId, oid)),
        auditLogs: await db.select().from(schema.auditLogs).where(eq(schema.auditLogs.officeId, oid)),
        leads: await db.select().from(schema.leads).where(eq(schema.leads.officeId, oid)),
        invoices: await db.select().from(schema.subscriptionInvoices).where(eq(schema.subscriptionInvoices.officeId, oid))
      };
      res.json(data);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.post("/api/save-office-data", async (req, res) => {
    const session = getSession(req);
    if (!session) return res.status(401).json({ error: "غير مصرح" });
    const oid = session.officeId;
    const body = req.body;
    try {
      if (body.isFullSync) {
        let sub = body.subscription;
        if (sub && sub.status === "active") {
           const existing = await db.select().from(schema.offices).where(eq(schema.offices.id, oid));
           // @ts-ignore
           const wasActive = existing.length && (existing[0].subscription as any)?.status === "active";
           // @ts-ignore
           if (!wasActive) sub.status = existing.length ? ((existing[0].subscription as any)?.status || "trial") : "trial";
        }
        await db.insert(schema.offices).values({
          id: oid, name: body.officeConfig?.officeName, lawyerName: body.officeConfig?.lawyerName, logoText: body.officeConfig?.logoText, address: body.officeConfig?.address, phone: body.officeConfig?.phone, email: body.officeConfig?.email, taxNumber: body.officeConfig?.taxNumber, barAssociationNumber: body.officeConfig?.barAssociationNumber, reminderSettings: body.officeConfig?.reminderSettings, subscription: sub
        }).onConflictDoUpdate({ target: schema.offices.id, set: { name: body.officeConfig?.officeName, lawyerName: body.officeConfig?.lawyerName, logoText: body.officeConfig?.logoText, address: body.officeConfig?.address, phone: body.officeConfig?.phone, email: body.officeConfig?.email, taxNumber: body.officeConfig?.taxNumber, barAssociationNumber: body.officeConfig?.barAssociationNumber, reminderSettings: body.officeConfig?.reminderSettings, subscription: sub } });
        
        await syncTable(schema.clients, body.clients || [], oid);
        await syncTable(schema.cases, body.cases || [], oid);
        await syncTable(schema.courtSessions, body.sessions || [], oid);
        await syncTable(schema.tasks, body.tasks || [], oid);
        await syncTable(schema.documents, body.documents || [], oid);
        await syncTable(schema.payments, body.payments || [], oid);
        await syncTable(schema.expenses, body.expenses || [], oid);
        await syncTable(schema.auditLogs, body.auditLogs || [], oid);
        await syncTable(schema.leads, body.leads || [], oid);
        await syncTable(schema.subscriptionInvoices, body.invoices || [], oid);
        return res.json({ success: true, message: "تمت المزامنة بنجاح" });
      } else {
        const { key, data } = body;
        if (key === "subscription") {
           const existing = await db.select().from(schema.offices).where(eq(schema.offices.id, oid));
           if (data && data.status === "active") {
             // @ts-ignore
           const wasActive = existing.length && (existing[0].subscription as any)?.status === "active";
             // @ts-ignore
             if (!wasActive) data.status = existing.length ? ((existing[0].subscription as any)?.status || "trial") : "trial";
           }
           await db.update(schema.offices).set({ subscription: data }).where(eq(schema.offices.id, oid));
        } else if (key === "officeConfig") {
           await db.update(schema.offices).set({
             name: data.officeName, lawyerName: data.lawyerName, logoText: data.logoText, address: data.address, phone: data.phone, email: data.email, taxNumber: data.taxNumber, barAssociationNumber: data.barAssociationNumber, reminderSettings: data.reminderSettings
           }).where(eq(schema.offices.id, oid));
        } else if (key === "clients") await syncTable(schema.clients, data, oid);
        else if (key === "cases") await syncTable(schema.cases, data, oid);
        else if (key === "sessions") await syncTable(schema.courtSessions, data, oid);
        else if (key === "tasks") await syncTable(schema.tasks, data, oid);
        else if (key === "documents") await syncTable(schema.documents, data, oid);
        else if (key === "payments") await syncTable(schema.payments, data, oid);
        else if (key === "expenses") await syncTable(schema.expenses, data, oid);
        else if (key === "auditLogs") await syncTable(schema.auditLogs, data, oid);
        else if (key === "leads") await syncTable(schema.leads, data, oid);
        else if (key === "invoices") await syncTable(schema.subscriptionInvoices, data, oid);
        return res.json({ success: true });
      }
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.post("/api/documents/upload", upload.single("file"), async (req, res) => {
    const session = getSession(req);
    if (!session) return res.status(401).json({ error: "غير مصرح" });
    if (!req.file) return res.status(400).json({ error: "لم يتم إرسال ملف" });
    const officeId = session.officeId;
    if (!GCS_BUCKET_NAME) return res.status(500).json({ error: "GCS Bucket not configured" });
    try {
      const bucket = gcs.bucket(GCS_BUCKET_NAME);
      const uniqueFileName = `${officeId}/${Date.now()}_${Math.round(Math.random() * 1e9)}_${req.file.originalname}`;
      const blob = bucket.file(uniqueFileName);
      const blobStream = blob.createWriteStream({ resumable: false, contentType: req.file.mimetype });
      blobStream.on("error", (err) => res.status(500).json({ error: err.message }));
      blobStream.on("finish", () => {
        const publicUrl = `https://storage.googleapis.com/${GCS_BUCKET_NAME}/${uniqueFileName}`;
        res.json({ success: true, fileReference: publicUrl, originalName: req.file!.originalname, mimeType: req.file!.mimetype, size: req.file!.size });
      });
      blobStream.end(req.file.buffer);
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  app.get("/api/documents/:documentId/download", async (req, res) => {
    const session = getSession(req);
    if (!session) return res.status(401).json({ error: "غير مصرح" });
    try {
      const docs = await db.select().from(schema.documents).where(and(eq(schema.documents.id, req.params.documentId), eq(schema.documents.officeId, session.officeId)));
      if (!docs.length) return res.status(404).json({ error: "المستند غير موجود" });
      const doc = docs[0];
      if (!doc.fileUrl) return res.status(400).json({ error: "لا يوجد ملف مرفق بهذا المستند" });
      res.json({ success: true, url: doc.fileUrl });
    } catch (err: any) { res.status(500).json({ error: "Failed to generate download URL" }); }
  });

  app.delete("/api/documents/:documentId", async (req, res) => {
    const session = getSession(req);
    if (!session) return res.status(401).json({ error: "غير مصرح" });
    try {
      const docs = await db.select().from(schema.documents).where(and(eq(schema.documents.id, req.params.documentId), eq(schema.documents.officeId, session.officeId)));
      if (!docs.length) return res.status(404).json({ error: "المستند غير موجود" });
      const doc = docs[0];
      if (doc.fileUrl && GCS_BUCKET_NAME) {
        const filePathMatch = doc.fileUrl.match(/storage\.googleapis\.com\/[^\/]+\/(.+)$/);
        if (filePathMatch && filePathMatch[1]) {
          try { await gcs.bucket(GCS_BUCKET_NAME).file(filePathMatch[1]).delete(); } catch(e) { console.error("Error deleting from GCS", e); }
        }
      }
      await db.delete(schema.documents).where(eq(schema.documents.id, req.params.documentId));
      res.json({ success: true });
    } catch(err: any) { res.status(500).json({ error: err.message }); }
  });

  app.post("/api/register", registerLimiter, async (req, res) => {
    const body = req.body;
    if (!body || !body.id || !body.email) return res.status(400).json({ error: "بيانات غير مكتملة" });
    const searchEmail = body.email.trim().toLowerCase();
    const existUsers = await db.select().from(schema.users).where(eq(schema.users.email, searchEmail));
    
    if (existUsers.length) {
      const session = getSession(req);
      if (!session) return res.status(401).json({ error: "غير مصرح: يرجى تسجيل الدخول أولاً" });
      const existingUser = existUsers[0];
      const isOwnerOrSuper = session.isSuperUser || session.role === "صاحب المكتب" || session.role === "SuperAdmin" || session.role === "مدير المنصة والاشتراكات";
      const isUpdatingSelf = session.userId === existingUser.id;
      if (!isUpdatingSelf && !isOwnerOrSuper) return res.status(403).json({ error: "غير مصرح بالتعديل" });
      if (session.officeId !== existingUser.officeId && !session.isSuperUser) return res.status(403).json({ error: "غير مصرح" });
      
      let newPass = existingUser.password;
      if (body.password) newPass = hashPassword(body.password.trim());
      await db.update(schema.users).set({
        name: body.name ? body.name.trim() : existingUser.name,
        avatarUrl: body.avatarUrl !== undefined ? body.avatarUrl : existingUser.avatarUrl,
        password: newPass,
        role: isOwnerOrSuper && body.role ? body.role : existingUser.role,
        isActive: isOwnerOrSuper && body.isActive !== undefined ? body.isActive : existingUser.isActive,
        permissions: isOwnerOrSuper && body.permissions ? body.permissions : existingUser.permissions
      }).where(eq(schema.users.id, existingUser.id));
      
      const sanitizedUsers = await db.select().from(schema.users).where(eq(schema.users.officeId, session.officeId));
      res.json({ success: true, users: sanitizedUsers.map(({ password, ...u }) => u) });
    } else {
      const session = getSession(req);
      let officeId = body.id;
      let role = "صاحب المكتب";
      let perms = { view: true, add: true, edit: true, delete: true, export: true, viewFinancials: true };
      
      if (session) {
        const isOwnerOrSuper = session.isSuperUser || session.role === "صاحب المكتب" || session.role === "SuperAdmin" || session.role === "مدير المنصة والاشتراكات";
        if (!isOwnerOrSuper) return res.status(403).json({ error: "غير مصرح" });
        officeId = session.officeId;
        role = body.role || "محامي";
        perms = body.permissions || perms;
      }
      
      await db.insert(schema.offices).values({ id: officeId, name: body.officeName || "مكتب ميزان" }).onConflictDoNothing();
      await db.insert(schema.users).values({
        id: body.id, officeId, name: body.name.trim(), email: searchEmail, password: hashPassword(body.password || "1234"),
        role, isSuperUser: false, isActive: true, avatarUrl: body.avatarUrl || "", permissions: perms,
        registrationDevice: body.registrationDevice, registrationLocation: body.registrationLocation, createdAt: new Date()
      });
      const targetOfficeId = session ? session.officeId : officeId;
      const sanitizedUsers = await db.select().from(schema.users).where(eq(schema.users.officeId, targetOfficeId));
      res.json({ success: true, users: sanitizedUsers.map(({ password, ...u }) => u) });
    }
  });

  app.post("/api/update-user", async (req, res) => {
    const session = getSession(req);
    if (!session) return res.status(401).json({ error: "غير مصرح" });
    const { id, name, avatarUrl } = req.body;
    if (!id || !name) return res.status(400).json({ error: "بيانات غير مكتملة" });
    if (session.userId !== id && !session.isSuperUser) return res.status(403).json({ error: "غير مصرح" });
    
    await db.update(schema.users).set({ name: name.trim(), avatarUrl: avatarUrl || "" }).where(eq(schema.users.id, id));
    res.json({ success: true });
  });

  app.post("/api/log-entrance", entranceLimiter, async (req, res) => {
    const notification = req.body;
    if (!notification || !notification.id || !notification.userName) return res.status(400).json({ error: "بيانات غير صالحة" });
    await db.insert(schema.entranceNotifications).values({
      id: String(notification.id).trim(), userName: String(notification.userName).trim(),
      userRole: String(notification.userRole || "محامي").trim(), userEmail: String(notification.userEmail || "").trim(),
      type: String(notification.type || "login").trim(), timestamp: String(notification.timestamp || new Date().toISOString()),
      location: notification.location ? String(notification.location).trim() : null,
      coordinates: notification.coordinates ? notification.coordinates : null, isRead: false
    }).onConflictDoUpdate({ target: schema.entranceNotifications.id, set: { timestamp: String(notification.timestamp) } });
    
    const notifs = await db.select().from(schema.entranceNotifications).orderBy(desc(schema.entranceNotifications.timestamp)).limit(100);
    res.json({ success: true, notifications: notifs });
  });

  app.post("/api/clear-notifications", async (req, res) => {
    const session = getSession(req);
    if (!session) return res.status(401).json({ error: "غير مصرح" });
    await db.delete(schema.entranceNotifications);
    res.json({ success: true });
  });

  app.post("/api/admin/users", async (req, res) => {
    const session = getSession(req);
    if (!session || !session.isSuperUser) return res.status(403).json({ error: "غير مصرح" });
    const { action, userId, officeId, changes } = req.body;
    if (action === "update") {
      await db.update(schema.users).set(changes).where(eq(schema.users.id, userId));
      res.json({ success: true });
    } else if (action === "delete") {
      await db.delete(schema.users).where(eq(schema.users.id, userId));
      res.json({ success: true });
    } else {
      res.status(400).json({ error: "Action not supported" });
    }
  });

  app.post("/api/subscription/request", async (req, res) => {
    const session = getSession(req);
    if (!session) return res.status(401).json({ error: "غير مصرح" });
    const { planId, billingCycle } = req.body;
    const officeId = session.officeId;
    
    const reqs = await db.select().from(schema.offices).where(eq(schema.offices.id, officeId));
    if (reqs.length) {
      let sub: any = (reqs[0].subscription as any) || {};
      sub.planId = planId;
      sub.billingCycle = billingCycle;
      sub.status = "pending";
      await db.update(schema.offices).set({ subscription: sub }).where(eq(schema.offices.id, officeId));
    }
    res.json({ success: true });
  });

  app.get("/api/subscription/pending-requests", async (req, res) => {
    const session = getSession(req);
    if (!session || !session.isSuperUser) return res.status(403).json({ error: "غير مصرح" });

    try {
      const allOffices = await db.select().from(schema.offices);
      const pending = [];
      for (const off of allOffices) {
        const sub = off.subscription as any;
        if (sub && sub.status === "pending") {
          const users = await db.select().from(schema.users).where(eq(schema.users.officeId, off.id));
          const owner = users.find(u => u.role === "صاحب المكتب") || users[0] || { name: "غير معروف", email: "غير معروف" };
          pending.push({
            id: off.id,
            officeId: off.id,
            officeName: off.name,
            userName: owner.name,
            userEmail: owner.email,
            planId: sub.planId,
            billingCycle: sub.billingCycle,
            createdAt: off.createdAt ? off.createdAt.toISOString().split("T")[0] : new Date().toISOString().split("T")[0]
          });
        }
      }
      res.json({ success: true, requests: pending });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/subscription-status", async (req, res) => {
    const session = getSession(req);
    if (!session) return res.status(401).json({ error: "غير مصرح" });
    const oid = session.officeId;

    try {
      const officeRec = await db.select().from(schema.offices).where(eq(schema.offices.id, oid));
      if (!officeRec.length) return res.json({ success: true, subscription: null, invoices: [] });

      const o = officeRec[0];
      const invoices = await db.select().from(schema.subscriptionInvoices).where(eq(schema.subscriptionInvoices.officeId, oid));
      res.json({
        success: true,
        subscription: o.subscription,
        invoices: invoices
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/subscription/approve", async (req, res) => {
    const session = getSession(req);
    if (!session || !session.isSuperUser) return res.status(403).json({ error: "غير مصرح" });
    const { requestId, officeId, status } = req.body;
    const targetOfficeId = requestId || officeId;
    if (!targetOfficeId) return res.status(400).json({ error: "معرف المكتب مطلوب" });

    try {
      const existing = await db.select().from(schema.offices).where(eq(schema.offices.id, targetOfficeId));
      if (!existing.length) return res.status(404).json({ error: "المكتب غير موجود" });

      let sub: any = (existing[0].subscription as any) || {};
      if (status === "active") {
        sub.status = "active";
        sub.subscriptionStartDate = new Date().toISOString().split("T")[0];
        if (!sub.planId) sub.planId = "pro";
        if (!sub.billingCycle) sub.billingCycle = "monthly";
      } else {
        sub.status = status;
      }

      await db.update(schema.offices).set({ subscription: sub }).where(eq(schema.offices.id, targetOfficeId));
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/subscription/admin/approve", async (req, res) => {
    const session = getSession(req);
    if (!session || !session.isSuperUser) return res.status(403).json({ error: "غير مصرح" });
    const { officeId, planId, billingCycle, status } = req.body;
    
    try {
      const existing = await db.select().from(schema.offices).where(eq(schema.offices.id, officeId));
      if (existing.length) {
        let sub: any = (existing[0].subscription as any) || {};
        sub.planId = planId || sub.planId || "pro";
        sub.billingCycle = billingCycle || sub.billingCycle || "monthly";
        sub.status = status;
        if (status === "active") {
          sub.subscriptionStartDate = new Date().toISOString().split("T")[0];
        }
        await db.update(schema.offices).set({ subscription: sub }).where(eq(schema.offices.id, officeId));
      }
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/suggest-legal", async (req, res) => {
    const session = getSession(req);
    if (!session) return res.status(401).json({ error: "غير مصرح" });
    try {
      const { type, caseType, context } = req.body;
      let prompt = "";
      if (type === "case") prompt = `بصفتك مستشار قانوني محترف، اقترح وصفاً قانونياً دقيقاً ورسمياً لقضية من نوع "${caseType}". السياق أو الملاحظات الإضافية: "${context || 'لا يوجد'}". الوصف يجب أن يكون جاهزاً للاستخدام في نظام إدارة قضايا محاماة (فقرة واحدة أو فقرتين).`;
      else if (type === "document") prompt = `بصفتك مستشار قانوني محترف، اقترح صياغة قانونية أو هيكل لمستند من نوع "${caseType}". السياق أو الملاحظات الإضافية: "${context || 'لا يوجد'}". الصياغة يجب أن تكون رسمية ودقيقة.`;
      else return res.status(400).json({ error: "Invalid type" });
      
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({ model: "gemini-3.6-flash", contents: prompt });
      res.json({ suggestion: response.text });
    } catch (error: any) { res.status(500).json({ error: error.message }); }
  });

  app.post("/api/paymob/callback", async (req, res) => res.json({ success: true }));
  app.post("/api/paymob/hmac", async (req, res) => res.json({ success: true }));

  // Global error handler for unhandled sync/async API errors
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error("Unhandled API error:", err);
    res.status(500).json({ error: err.message || "حدث خطأ غير متوقع في الخادم" });
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => res.sendFile(path.join(distPath, 'index.html')));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
