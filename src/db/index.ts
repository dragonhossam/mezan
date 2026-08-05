import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema.js';
import * as dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

declare global {
  var _postgresPool: Pool | undefined;
}

export const createPool = () => {
  if (!global._postgresPool) {
    const isCloudRun = !!process.env.K_SERVICE; // Cloud Run sets this
    let poolConfig: any = {
      user: process.env.SQL_ADMIN_USER || process.env.SQL_USER,
      password: process.env.SQL_ADMIN_PASSWORD || process.env.SQL_PASSWORD,
      database: process.env.SQL_DB_NAME,
      max: 10,
      connectionTimeoutMillis: 15000,
    };

    let host = process.env.SQL_HOST;
    if (isCloudRun && process.env.SQL_INSTANCE_CONNECTION_NAME) {
      const socketDir = fs.existsSync('/cloudsql') ? '/cloudsql' : '/app/cloudsql';
      host = `${socketDir}/${process.env.SQL_INSTANCE_CONNECTION_NAME}`;
    }

    // Safeguard for Unix socket paths: ensure the socket directory corresponds to the actual environment filesystem
    if (host && host.startsWith('/')) {
      if (host.includes('/cloudsql/')) {
        const parts = host.split('/cloudsql/');
        const instanceName = parts[parts.length - 1];
        const actualSocketDir = fs.existsSync('/cloudsql') ? '/cloudsql' : '/app/cloudsql';
        host = `${actualSocketDir}/${instanceName}`;
      }
    }

    poolConfig.host = host;

    global._postgresPool = new Pool(poolConfig);

    global._postgresPool.on('error', (err: any) => {
      if (err.message && err.message.includes('terminating connection due to administrator command')) {
        return; // Ignore connection terminations from the database (common in Cloud Run)
      }
      console.error('Unexpected error on idle SQL pool client:', err);
    });
  }
  return global._postgresPool;
};

const pool = createPool();

export const db = drizzle(pool, { schema });
