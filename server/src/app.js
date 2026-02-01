const express = require('express');
const cors = require('cors');
const env = require('./config/env');
const authController = require('./auth/auth.controller');
const casesController = require('./cases/cases.controller');
const rateLimit = require('./middleware/rateLimit');
const errorHandler = require('./middleware/errorHandler');

const app = express();

app.disable('x-powered-by');
app.use(cors({ origin: env.CLIENT_ORIGIN }));
app.use(express.json({ limit: '10kb' }));

app.post('/api/auth/register', rateLimit, authController.register);
app.post('/api/auth/login', rateLimit, authController.login);
app.post('/api/cases', rateLimit, casesController.createCase);
app.get('/api/cases', casesController.listCases);
app.get('/health', (req, res) => res.json({ status: 'healthy' }));

app.use(errorHandler);

module.exports = app;
