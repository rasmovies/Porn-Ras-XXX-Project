const { Client } = require('basic-ftp');
const fs = require('fs-extra');
const path = require('path');
const multer = require('multer');

// FTP Configuration
const FTP_CONFIG = {
  host: 'ftp.streamtape.com',
  user: 'e3eddd5f523e3391352b',
  password: '4Av234M6QRtK30j',
  secure: false,
};

// Multer configuration - Vercel'in limiti 4.5MB, bu yüzden chunked upload kullanılmalı
// Ancak şimdilik maksimum limiti artırmaya çalışalım
// Not: Vercel serverless function'ları için maksimum request body size 4.5MB'dir
// Büyük dosyalar için chunked upload veya direkt FTP upload gerekir
const upload = multer({ 
  dest: '/tmp',
  limits: {
    fileSize: 4.5 * 1024 * 1024 // Vercel limiti: 4.5MB (geçici çözüm)
    // Not: 5GB dosyalar için chunked upload implementasyonu gerekli
  }
});

/**
 * POST /api/ftp/upload
 * Upload file to FTP server
 */
module.exports = async function handler(req, res) {
  // Set CORS headers
  const origin = req.headers.origin || req.headers.referer;
  res.setHeader('Access-Control-Allow-Origin', origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle OPTIONS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }
  
  // Multer middleware
  upload.single('file')(req, res, async (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({ 
          success: false, 
          error: 'Dosya çok büyük. Vercel limiti: 4.5MB. Büyük dosyalar için lütfen chunked upload kullanın veya direkt FTP kullanın.' 
        });
      }
      return res.status(400).json({ success: false, error: err.message });
    }
    
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Dosya gerekli' });
    }
    
    const client = new Client();
    const remotePath = req.body.path || `/${req.file.originalname}`;
    const filePath = req.file.path;
    
    try {
      console.log('FTP upload endpoint called, path:', remotePath);
      await client.access(FTP_CONFIG);
      await client.uploadFrom(filePath, remotePath);
      
      // Geçici dosyayı sil
      await fs.remove(filePath).catch(() => {});
      await client.close();
      
      res.status(200).json({ success: true, fileName: req.file.originalname });
    } catch (error) {
      try {
        await client.close();
      } catch (e) {}
      await fs.remove(filePath).catch(() => {});
      console.error('FTP upload error:', error);
      res.status(500).json({ success: false, error: error.message || 'Bilinmeyen hata' });
    }
  });
};

