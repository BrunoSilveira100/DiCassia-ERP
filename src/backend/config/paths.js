const path = require('path');

const projectRoot = path.resolve(__dirname, '..', '..', '..');

module.exports = {
  projectRoot,
  frontendDir: path.join(projectRoot, 'src', 'frontend'),
  databasePath: process.env.SQLITE_DB_PATH
    ? path.resolve(projectRoot, process.env.SQLITE_DB_PATH)
    : path.join(projectRoot, 'src', 'database', 'dicassia.sqlite'),
  schemaPath: path.join(projectRoot, 'src', 'database', 'schema.sql'),
  migrationsDir: path.join(projectRoot, 'src', 'database', 'migrations')
};
