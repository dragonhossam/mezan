import { db } from '../src/db/index.js';
import * as schema from '../src/db/schema.js';
import fs from 'fs';
import path from 'path';

async function runMigration() {
  console.log("Starting migration from db.json to Postgres...");
  const dbFile = path.join(process.cwd(), "db.json");
  if (!fs.existsSync(dbFile)) {
    console.error("db.json not found!");
    process.exit(1);
  }
  
  const content = fs.readFileSync(dbFile, "utf-8");
  const data = JSON.parse(content);
  
  // Keep track of counts
  const counts: Record<string, number> = {};

  try {
    // 1. Migrate Users
    if (data.newUsers && data.newUsers.length > 0) {
      console.log(`Found ${data.newUsers.length} users. Migrating...`);
      for (const user of data.newUsers) {
        // Create a dummy office for users if officeId is missing
        const officeId = user.officeId || user.id;
        
        // Ensure office exists
        try {
          await db.insert(schema.offices).values({
            id: officeId,
            name: "مكتب افتراضي",
          }).onConflictDoNothing();
        } catch (e) {
            // ignore
        }

        await db.insert(schema.users).values({
          id: user.id,
          officeId: officeId,
          name: user.name,
          email: user.email,
          role: user.role,
          avatarUrl: user.avatarUrl,
          isActive: user.isActive ?? true,
          password: user.password,
          isSuperUser: user.isSuperUser ?? false,
          permissions: user.permissions,
          referredByAd: user.referredByAd,
          utmSource: user.utmSource,
          utmCampaign: user.utmCampaign,
          registrationIp: user.registrationIp,
          registrationDevice: user.registrationDevice,
          registrationLocation: user.registrationLocation,
          createdAt: user.createdAt ? new Date(user.createdAt) : new Date(),
        }).onConflictDoNothing();
      }
      counts['users'] = data.newUsers.length;
    }

    // 2. Migrate Offices Data
    if (data.offices) {
      const officeIds = Object.keys(data.offices);
      console.log(`Found ${officeIds.length} offices. Migrating data...`);
      
      for (const officeId of officeIds) {
        const office = data.offices[officeId];
        
        // Insert Office Record
        await db.insert(schema.offices).values({
          id: officeId,
          name: office.officeConfig?.officeName || 'مكتب ' + officeId,
          lawyerName: office.officeConfig?.lawyerName,
          logoText: office.officeConfig?.logoText,
          address: office.officeConfig?.address,
          phone: office.officeConfig?.phone,
          email: office.officeConfig?.email,
          taxNumber: office.officeConfig?.taxNumber,
          barAssociationNumber: office.officeConfig?.barAssociationNumber,
          reminderSettings: office.officeConfig?.reminderSettings,
          subscription: office.subscription,
        }).onConflictDoUpdate({
          target: schema.offices.id,
          set: {
            name: office.officeConfig?.officeName || 'مكتب ' + officeId,
            lawyerName: office.officeConfig?.lawyerName,
            logoText: office.officeConfig?.logoText,
            address: office.officeConfig?.address,
            phone: office.officeConfig?.phone,
            email: office.officeConfig?.email,
            taxNumber: office.officeConfig?.taxNumber,
            barAssociationNumber: office.officeConfig?.barAssociationNumber,
            reminderSettings: office.officeConfig?.reminderSettings,
            subscription: office.subscription,
          }
        });
        
        counts['offices'] = (counts['offices'] || 0) + 1;

        // Clients
        if (office.clients) {
          for (const item of office.clients) {
            await db.insert(schema.clients).values({
              ...item,
              officeId,
              createdAt: item.createdAt ? new Date(item.createdAt) : new Date()
            }).onConflictDoNothing();
          }
          counts['clients'] = (counts['clients'] || 0) + office.clients.length;
        }

        // Cases
        if (office.cases) {
          for (const item of office.cases) {
            await db.insert(schema.cases).values({
              ...item,
              officeId
            }).onConflictDoNothing();
          }
          counts['cases'] = (counts['cases'] || 0) + office.cases.length;
        }

        // Sessions
        if (office.sessions) {
          for (const item of office.sessions) {
            await db.insert(schema.courtSessions).values({
              ...item,
              officeId
            }).onConflictDoNothing();
          }
          counts['courtSessions'] = (counts['courtSessions'] || 0) + office.sessions.length;
        }

        // Tasks
        if (office.tasks) {
          for (const item of office.tasks) {
            await db.insert(schema.tasks).values({
              ...item,
              officeId
            }).onConflictDoNothing();
          }
          counts['tasks'] = (counts['tasks'] || 0) + office.tasks.length;
        }

        // Documents
        if (office.documents) {
          for (const item of office.documents) {
            await db.insert(schema.documents).values({
              ...item,
              officeId
            }).onConflictDoNothing();
          }
          counts['documents'] = (counts['documents'] || 0) + office.documents.length;
        }

        // Payments
        if (office.payments) {
          for (const item of office.payments) {
            await db.insert(schema.payments).values({
              ...item,
              officeId
            }).onConflictDoNothing();
          }
          counts['payments'] = (counts['payments'] || 0) + office.payments.length;
        }

        // Expenses
        if (office.expenses) {
          for (const item of office.expenses) {
            await db.insert(schema.expenses).values({
              ...item,
              officeId
            }).onConflictDoNothing();
          }
          counts['expenses'] = (counts['expenses'] || 0) + office.expenses.length;
        }

        // Audit Logs
        if (office.auditLogs) {
          for (const item of office.auditLogs) {
            await db.insert(schema.auditLogs).values({
              ...item,
              officeId
            }).onConflictDoNothing();
          }
          counts['auditLogs'] = (counts['auditLogs'] || 0) + office.auditLogs.length;
        }

        // Leads
        if (office.leads) {
          for (const item of office.leads) {
            await db.insert(schema.leads).values({
              ...item,
              officeId
            }).onConflictDoNothing();
          }
          counts['leads'] = (counts['leads'] || 0) + office.leads.length;
        }

        // Invoices
        if (office.invoices) {
          for (const item of office.invoices) {
            await db.insert(schema.subscriptionInvoices).values({
              ...item,
              officeId
            }).onConflictDoNothing();
          }
          counts['subscriptionInvoices'] = (counts['subscriptionInvoices'] || 0) + office.invoices.length;
        }
      }
    }
    
    // 3. Entrance Notifications
    if (data.newNotifications && data.newNotifications.length > 0) {
      console.log(`Found ${data.newNotifications.length} notifications. Migrating...`);
      for (const item of data.newNotifications) {
        await db.insert(schema.entranceNotifications).values({
          id: item.id,
          officeId: item.officeId || null,
          userName: item.userName,
          userRole: item.userRole,
          userEmail: item.userEmail,
          timestamp: item.timestamp,
          ipAddress: item.ipAddress,
          deviceInfo: item.deviceInfo,
          location: item.location,
          coordinates: item.coordinates,
          isRead: item.isRead,
          type: item.type,
        }).onConflictDoNothing();
      }
      counts['entranceNotifications'] = data.newNotifications.length;
    }

    console.log("Migration completed successfully! Summary:");
    console.table(counts);
    process.exit(0);

  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

runMigration();
