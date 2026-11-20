import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import { connectDB } from './config/db.js';
import { nexconnService } from './services/nexconnService.js';
import { geminiService } from './services/geminiService.js';

import authRoutes from './routes/authRoutes.js';
import communityRoutes from './routes/communityRoutes.js';
import roomRoutes from './routes/roomRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import moderationRoutes from './routes/moderationRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Database connection
connectDB();

// Middleware
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Rate Limiting to prevent API abuse and DoS
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many authentication attempts, please try again later.' },
});

const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 80,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'AI rate limit exceeded, please try again later.' },
});

app.use('/api', apiLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/ai', aiLimiter);

// System Health & Diagnostics Endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'ConnectSphere API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    nexconn: nexconnService.getStatus(),
    ai: {
      configured: geminiService.isConfigured(),
      model: geminiService.isConfigured() ? geminiService.modelName : 'Heuristic Engine',
    },
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/communities', communityRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/moderation', moderationRoutes);
app.use('/api/notifications', notificationRoutes);

// 404 Handler
app.use((req, res, next) => {
  res.status(404).json({ message: `API route not found - ${req.originalUrl}` });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    message: err.message || 'Internal Server Error',
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
});

app.listen(PORT, () => {
  console.log(`🚀 ConnectSphere Backend Server running on port ${PORT}`);
  console.log(`📡 Health check available at http://localhost:${PORT}/api/health`);
  console.log(`🔌 Nexconn Status: ${nexconnService.isConfigured() ? 'Configured ✅' : 'Running in Dev/Test Mode ⚠️'}`);
  console.log(`🤖 AI Status: ${geminiService.isConfigured() ? 'Gemini Live ✅' : 'Built-in Synthesizer Active ⚡'}`);
});

