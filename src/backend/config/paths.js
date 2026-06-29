const path = require('path');

const projectRoot = path.resolve(__dirname, '..', '..', '..');

const isVercel = Boolean(process.env.VERCEL);
const defaultDatabasePath = isVercel
  ? path.join('/tmp', 'dicassia.sqlite')
  : path.join(projectRoot, 'src', 'database', 'dicassia.sqlite');

module.exports = {
  projectRoot,
  frontendDir: path.join(projectRoot, 'src', 'frontend'),
  databasePath: process.env.SQLITE_DB_PATH
    ? path.resolve(projectRoot, process.env.SQLITE_DB_PATH)
    : defaultDatabasePath,
  schemaPath: path.join(projectRoot, 'src', 'database', 'schema.sql'),
  migrationsDir: path.join(projectRoot, 'src', 'database', 'migrations')
};
