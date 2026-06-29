const fs = require('fs');
const DatabaseSync = require('better-sqlite3');
const paths = require('./paths');

let database;

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
      const migrationPath = require('path').join(paths.migrationsDir, migrationId + '.sqlite.sql');
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
  if (!database) {
    database = new DatabaseSync(paths.databasePath);
    database.exec('PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL;');
    database.exec(fs.readFileSync(paths.schemaPath, 'utf8'));
    runMigrations(database);
  }

  return database;
}

function closeDatabase() {
  if (database) {
    database.close();
    database = undefined;
  }
}

module.exports = { getDatabase, closeDatabase };
