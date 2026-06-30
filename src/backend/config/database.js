const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const paths = require('./paths');

const usePostgres = Boolean(process.env.DATABASE_URL);
const isVercel = Boolean(process.env.VERCEL);
let database;
let pool;

function validateProductionEnv() {
  if (!usePostgres) {
    if (isVercel) {
      throw new Error('Vercel deployment requires DATABASE_URL in environment variables.');
    }
    return;
  }

  if (!process.env.DATABASE_URL) {
    throw new Error('Missing required environment variable: DATABASE_URL');
  }
}

function ensurePool() {
  if (!pool) {
    pool = global.__dicassia_pg_pool || new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      max: 1,
      connectionTimeoutMillis: 4000,
      idleTimeoutMillis: 10000,
      query_timeout: 6000
    });
    if (!global.__dicassia_pg_pool) {
      pool.on('connect', () => console.log('Banco conectado'));
      pool.on('error', (error) => console.error('Erro inesperado no pool PostgreSQL:', error));
    }
    global.__dicassia_pg_pool = pool;
  }
  return pool;
}

function preparePg(pool, sql) {
  let parameterIndex = 0;
  const normalizedSql = sql.trim().replace(/\?/g, () => `$${++parameterIndex}`);
  const isInsert = /^INSERT\s+/i.test(normalizedSql);
  const hasReturning = /RETURNING\s+/i.test(normalizedSql);

  return {
    all: async (...params) => {
      const result = await pool.query(normalizedSql, params);
      return result.rows;
    },
    get: async (...params) => {
      const result = await pool.query(normalizedSql, params);
      return result.rows[0];
    },
    run: async (...params) => {
      const text = isInsert && !hasReturning ? `${normalizedSql} RETURNING id` : normalizedSql;
      const result = await pool.query(text, params);
      return {
        lastInsertRowid: result.rows[0]?.id ?? null,
        changes: result.rowCount
      };
    }
  };
}

function prepareSqlite(db, sql) {
  const statement = db.prepare(sql);
  return {
    all: async (...params) => statement.all(...params),
    get: async (...params) => statement.get(...params),
    run: async (...params) => {
      const result = statement.run(...params);
      return {
        lastInsertRowid: result.lastInsertRowid,
        changes: result.changes
      };
    }
  };
}

function hasColumn(db, table, column) {
  return db.prepare(`PRAGMA table_info(${table})`).all().some(function (item) {
    return item.name === column;
  });
}

function runMigrations(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const migrationId = '002_add_sale_status';
  const applied = db.prepare('SELECT 1 FROM schema_migrations WHERE id = ?').get(migrationId);
  if (applied) return;

  db.exec('BEGIN');
  try {
    if (!hasColumn(db, 'vendas', 'status')) {
      const migrationPath = path.join(paths.migrationsDir, migrationId + '.sqlite.sql');
      db.exec(fs.readFileSync(migrationPath, 'utf8'));
    }
    db.prepare('INSERT INTO schema_migrations (id) VALUES (?)').run(migrationId);
    db.exec('COMMIT');
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}

function getDatabase() {
  if (database) return database;
  validateProductionEnv();

  if (usePostgres) {
    const pgPool = ensurePool();
    database = { prepare: (sql) => preparePg(pgPool, sql) };
  } else {
    const DatabaseSync = require('better-sqlite3');
    const sqliteDb = new DatabaseSync(paths.databasePath);
    sqliteDb.exec('PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL;');
    sqliteDb.exec(fs.readFileSync(paths.schemaPath, 'utf8'));
    runMigrations(sqliteDb);
    database = { prepare: (sql) => prepareSqlite(sqliteDb, sql), close: () => sqliteDb.close() };
  }

  return database;
}

async function closeDatabase() {
  if (database && typeof database.close === 'function') {
    await database.close();
  }

  if (pool) {
    await pool.end();
    pool = undefined;
    global.__dicassia_pg_pool = undefined;
  }

  database = undefined;
}

module.exports = { getDatabase, closeDatabase, usePostgres };
