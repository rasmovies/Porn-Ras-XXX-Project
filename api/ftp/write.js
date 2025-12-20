const { Client } = require('basic-ftp');
const fs = require('fs-extra');
const path = require('path');
const { sanitizePath, sanitizeFilename } = require('../_helpers/pathSecurity');

// FTP Configuration
const FTP_CONFIG = {
  host: 'ftp.streamtape.com',
  user: 'e3eddd5f523e3391352b',
  password: '4Av234M6QRtK30j',
  secure: false,
};

/**
 * POST /api/ftp/write
 * Write content to file on FTP server
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
  
  const client = new Client();
  const { path: remotePath, content } = req.body;
  
  if (!remotePath || content === undefined) {
    return res.status(400).json({ success: false, error: 'Dosya yolu ve içerik gerekli' });
  }
  
  // Sanitize remotePath to prevent Path Traversal
  const safeRemotePath = sanitizeFilename(remotePath);
  if (!safeRemotePath || safeRemotePath === 'unnamed') {
    return res.status(400).json({ success: false, error: 'Geçersiz dosya yolu' });
  }
  
  let tempPath = null;
  
  try {
    console.log('FTP write endpoint called, path:', safeRemotePath);
    await client.access(FTP_CONFIG);
    
    // Geçici dosya oluştur (Path Traversal koruması ile)
    const tempDir = '/tmp';
    await fs.ensureDir(tempDir);
    
    const tempFileName = `${path.basename(safeRemotePath)}_${Date.now()}`;
    tempPath = sanitizePath(path.join(tempDir, tempFileName), tempDir);
    if (!tempPath) {
      return res.status(400).json({ success: false, error: 'Geçersiz geçici dosya yolu' });
    }
    
    await fs.writeFile(tempPath, content, 'utf8');
    await client.uploadFrom(tempPath, safeRemotePath);
    
    await fs.remove(tempPath).catch(() => {});
    await client.close();
    
    res.status(200).json({ success: true });
  } catch (error) {
    try {
      await client.close();
    } catch (e) {}
    if (tempPath) {
      await fs.remove(tempPath).catch(() => {});
    }
    console.error('FTP write error:', error);
    res.status(500).json({ success: false, error: error.message || 'Bilinmeyen hata' });
  }
};

