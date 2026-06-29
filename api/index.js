const serverless = require('serverless-http');
const app = require('../src/backend/app');

module.exports = serverless(app);
