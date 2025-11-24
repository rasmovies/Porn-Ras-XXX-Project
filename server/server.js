const express = require('express');
// Mongoose kullanılmıyor, kaldırıyoruz (Vercel serverless için optimize)
// const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();
const emailRoutes = require('./routes/emailRoutes');

// Bluesky routes - opsiyonel (paket yoksa devre dışı)
let blueskyRoutes = null;
try {
  blueskyRoutes = require('./routes/blueskyRoutes');
} catch (error) {
  console.warn('⚠️  Bluesky routes yüklenemedi (opsiyonel):', error.message);
}

const app = express();
const PORT = process.env.PORT || 5000;

// CORS ayarları - Vercel deployment URL'leri ve domain'e izin ver
const allowedOrigins = [
  'https://www.pornras.com',
  'https://api.pornras.com', // Backend API domain
  'http://localhost:3000',
  'http://localhost:3001',
  // Vercel deployment URL'leri için regex pattern
  /^https:\/\/.*\.vercel\.app$/,
  /^https:\/\/.*-.*\.vercel\.app$/,
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Origin yoksa (same-origin veya mobile app gibi) izin ver
      if (!origin) return callback(null, true);
      
      // Exact match kontrolü
      if (allowedOrigins.some(allowed => {
        if (typeof allowed === 'string') {
          return allowed === origin;
        } else if (allowed instanceof RegExp) {
          return allowed.test(origin);
        }
        return false;
      })) {
        callback(null, true);
      } else {
        console.log('⚠️  CORS blocked origin:', origin);
        callback(new Error('Not allowed by CORS'));
      }
    },
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

// Auth routes - Vercel serverless function olarak çalışacak
// Local development için Express route
if (require.main === module) {
  app.post('/api/auth/verify', require('./api/auth/verify'));
  app.post('/api/auth/generate-code', require('./api/auth/generate-code'));
  app.post('/api/auth/verify-code', require('./api/auth/verify-code'));
}

// Bluesky routes - sadece yüklendiyse aktif
if (blueskyRoutes) {
  app.use('/api/bluesky', blueskyRoutes);
  console.log('✅ Bluesky routes aktif');
} else {
  console.log('ℹ️  Bluesky routes devre dışı');
}

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
