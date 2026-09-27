const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');
const logger = require('./utils/logger');

const app = express();

// Security middleware
app.use(helmet());
// CORS: CORS_ORIGIN may be a single origin or a comma-separated list
// (e.g. "http://localhost:5173,https://logicore.vercel.app"). Keep a single
// origin as a plain string — the cors middleware only emits the header for
// array origins when the request actually carries an Origin header.
const corsOrigins = (process.env.CORS_ORIGIN || '*')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);
const corsOrigin = corsOrigins.length === 1 ? corsOrigins[0] : corsOrigins;

app.use(cors({
  origin: corsOrigin,
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs (was 100 - too tight for polling, caused 429 "An error occurred")
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api', limiter);

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url}`);
  next();
});
// Add this at the top of your routes
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'LogiCore Backend is running!',
    routes: {
      api: '/api',
      auth: '/auth',
      health: '/health'
    }
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    database: 'connected'
  });
});

// Routes
app.use('/api/v1', routes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Error handler
app.use(errorHandler);

module.exports = app;
