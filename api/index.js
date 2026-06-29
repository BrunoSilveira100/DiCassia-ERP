const serverless = require('serverless-http');
const { app, getDatabase } = require('../src/backend/server');

getDatabase();

module.exports = serverless(app);
