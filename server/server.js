const express = require('express');
// Mongoose kullanılmıyor, kaldırıyoruz (Vercel serverless için optimize)
// const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();
const emailRoutes = require('./routes/emailRoutes');
const blueskyRoutes = require('./routes/blueskyRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// OPTIONS preflight için manuel handler (CORS middleware'den ÖNCE - Vercel serverless için)
app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', 'https://www.pornras.com');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type', 'Authorization');
  res.header('Access-Control-Max-Age', '86400'); // 24 saat
  res.sendStatus(200);
});

// CORS ayarları - sadece www.pornras.com domain'ine izin ver
app.use(
  cors({
    origin: 'https://www.pornras.com', // sadece kendi domain'ine izin ver
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: false,
    optionsSuccessStatus: 200, // Vercel için önemli
    preflightContinue: false, // CORS middleware preflight'i handle etsin
  })
);

// Helmet'i CORS ile uyumlu olacak şekilde yapılandır (CORS'tan SONRA)
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: false, // CORS ile uyumluluk için
  })
);

// Morgan logging - production'da sadece errors, development'ta combined
if (process.env.NODE_ENV === 'production') {
  app.use(morgan('combined'));
} else {
  app.use(morgan('dev'));
}

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Global error handler - Vercel serverless için kritik
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'AdultTube API Server', status: 'OK' });
});

app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.use('/api/email', emailRoutes);
app.use('/api/bluesky', blueskyRoutes);

// 404 handler - Vercel için önemli
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Vercel serverless functions için export
// Local development için listen
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

// Vercel için export - IMPORTANT: Bu export olmalı
module.exports = app;
