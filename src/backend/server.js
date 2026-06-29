const app = require('./app');
const { getDatabase, closeDatabase } = require('./config/database');

const host = process.env.HOST || '127.0.0.1';
const port = Number(process.env.PORT || process.argv[2] || 8000);

if (require.main === module) {
  getDatabase();

  const server = app.listen(port, host, function () {
    console.log(`DiCassia rodando em http://${host}:${port}/`);
  });

  function shutdown() {
    server.close(function () {
      closeDatabase();
      process.exit(0);
    });
  }

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

module.exports = { app, getDatabase, closeDatabase };
