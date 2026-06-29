const express = require('express');
const paths = require('./config/paths');
const apiRoutes = require('./routes');
const { notFound, errorHandler } = require('./middlewares/errors');

const app = express();

app.disable('x-powered-by');
app.use(express.json({ limit: '1mb' }));
app.use('/api', apiRoutes);
app.use(express.static(paths.frontendDir));
app.use(notFound);
app.use(errorHandler);

module.exports = app;
