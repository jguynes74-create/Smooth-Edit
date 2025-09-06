import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

// Create database connection only if DATABASE_URL is available
export let pool: Pool | null = null;
export let db: any = null;

if (process.env.DATABASE_URL) {
  try {
    // Configure pool with connection timeout and retry settings
    pool = new Pool({ 
      connectionString: process.env.DATABASE_URL,
      connectionTimeoutMillis: 10000, // 10 seconds
      idleTimeoutMillis: 30000, // 30 seconds
      max: 5, // Reduce max connections to prevent resource exhaustion
      maxUses: 7500, // Add connection cycling
      allowExitOnIdle: true
    });

    db = drizzle({ client: pool, schema });

    // Handle pool errors gracefully
    pool.on('error', (err) => {
      console.error('Database pool error:', err);
    });

    // Test connection on startup with timeout (non-blocking)
    setTimeout(() => {
      pool?.connect()
        .then(client => {
          console.log('Database connection established successfully');
          client.release();
        })
        .catch(err => {
          console.error('Database connection failed on startup:', err);
          console.log('Server will continue but database operations may fail');
        });
    }, 1000); // Delay connection test to not block startup

  } catch (error) {
    console.error('Failed to initialize database:', error);
    console.log('Server will continue without database functionality');
    pool = null;
    db = null;
  }
} else {
  console.warn("DATABASE_URL not set. Database features will be disabled.");
}