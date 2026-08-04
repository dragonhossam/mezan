import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema.js';
import * as dotenv from 'dotenv';

dotenv.config();

declare global {
  var _postgresPool: Pool | undefined;
}

export const createPool = () => {
  if (!global._postgresPool) {
    const isCloudRun = !!process.env.K_SERVICE; // Cloud Run sets this
    let poolConfig: any = {
      user: process.env.SQL_ADMIN_USER,
      password: process.env.SQL_ADMIN_PASSWORD,
      database: process.env.SQL_DB_NAME,
      max: 10,
      connectionTimeoutMillis: 15000,
    };

    if (isCloudRun && process.env.SQL_INSTANCE_CONNECTION_NAME) {
      // Connect via Unix Socket in Cloud Run
      poolConfig.host = `/cloudsql/${process.env.SQL_INSTANCE_CONNECTION_NAME}`;
    } else {
      // Connect via TCP/IP (local development or generic)
      poolConfig.host = process.env.SQL_HOST;
    }

    global._postgresPool = new Pool(poolConfig);

    global._postgresPool.on('error', (err) => {
      console.error('Unexpected error on idle SQL pool client:', err);
    });
  }
  return global._postgresPool;
};

const pool = createPool();

export const db = drizzle(pool, { schema });
