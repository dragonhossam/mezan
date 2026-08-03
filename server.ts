import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const DB_FILE = path.join(process.cwd(), "db.json");

interface DbSchema {
  newUsers: any[];
  newNotifications: any[];
}

function readDb(): DbSchema {
  try {
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, "utf-8");
      return JSON.parse(content);
    }
  } catch (err) {
    console.error("Error reading db.json:", err);
  }
  return { newUsers: [], newNotifications: [] };
}

function writeDb(data: DbSchema) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing db.json:", err);
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Shared state routes
  app.get("/api/shared-data", (req, res) => {
    const db = readDb();
    res.json({
      users: db.newUsers,
      notifications: db.newNotifications
    });
  });

  app.post("/api/register", (req, res) => {
    const newUser = req.body;
    if (!newUser || !newUser.id) {
      return res.status(400).json({ error: "Invalid user data" });
    }
    const db = readDb();
    const exists = db.newUsers.some(u => u.id === newUser.id || u.email.toLowerCase() === newUser.email.toLowerCase());
    if (!exists) {
      db.newUsers.push(newUser);
      writeDb(db);
    }
    res.json({ success: true, users: db.newUsers });
  });

  app.post("/api/log-entrance", (req, res) => {
    const notification = req.body;
    if (!notification || !notification.id) {
      return res.status(400).json({ error: "Invalid notification data" });
    }
    const db = readDb();
    const existingIndex = db.newNotifications.findIndex(n => n.id === notification.id);
    if (existingIndex !== -1) {
      db.newNotifications[existingIndex] = notification;
    } else {
      db.newNotifications.unshift(notification);
    }
    if (db.newNotifications.length > 1000) {
      db.newNotifications = db.newNotifications.slice(0, 1000);
    }
    writeDb(db);
    res.json({ success: true, notifications: db.newNotifications });
  });

  app.post("/api/clear-notifications", (req, res) => {
    const db = readDb();
    db.newNotifications = [];
    writeDb(db);
    res.json({ success: true });
  });

  app.post("/api/suggest-legal", async (req, res) => {
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
