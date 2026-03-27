import { drizzle as drizzlePg } from 'drizzle-orm/node-postgres';
import { drizzle as drizzleSqlite } from 'drizzle-orm/better-sqlite3';
import pg from 'pg';
import Database from 'better-sqlite3';
import * as schema from './schema.js';
import { config } from '../config.js';
let db;
if (config.databaseUrl) {
    // Production PostgreSQL
    const pool = new pg.Pool({
        connectionString: config.databaseUrl,
    });
    db = drizzlePg(pool, { schema });
}
else {
    // Development SQLite
    const sqlite = new Database(config.dbPath);
    db = drizzleSqlite(sqlite, { schema });
}
export { db };
