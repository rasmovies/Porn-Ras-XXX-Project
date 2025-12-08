const { Client } = require('basic-ftp');
const fs = require('fs-extra');
const path = require('path');

// FTP Configuration
const FTP_CONFIG = {
  host: 'ftp.streamtape.com',
  user: 'e3eddd5f523e3391352b',
  password: '4Av234M6QRtK30j',
  secure: false,
};

/**
 * GET /api/ftp/download
 * Download file from FTP server
 */
module.exports = async function handler(req, res) {
  // Set CORS headers
  const origin = req.headers.origin || req.headers.referer;
  res.setHeader('Access-Control-Allow-Origin', origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle OPTIONS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Only allow GET
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }
  
  const client = new Client();
  const remotePath = req.query.path;
  
  if (!remotePath) {
    return res.status(400).json({ success: false, error: 'Dosya yolu gerekli' });
  }
  
  try {
    console.log('FTP download endpoint called, path:', remotePath);
    await client.access(FTP_CONFIG);
    
    // Geçici dosya oluştur
    const tempDir = '/tmp';
    await fs.ensureDir(tempDir);
    const tempPath = path.join(tempDir, path.basename(remotePath));
    
    await client.downloadTo(tempPath, remotePath);
    await client.close();
    
    // Dosyayı oku ve gönder
    const fileContent = await fs.readFile(tempPath);
    const fileName = path.basename(remotePath);
    
    // Content-Type belirle
    const ext = path.extname(fileName).toLowerCase();
    const contentTypes = {
      '.txt': 'text/plain',
      '.html': 'text/html',
      '.css': 'text/css',
      '.js': 'application/javascript',
      '.json': 'application/json',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.mp4': 'video/mp4',
      '.avi': 'video/x-msvideo',
      '.mov': 'video/quicktime',
      '.pdf': 'application/pdf',
    };
    
    res.setHeader('Content-Type', contentTypes[ext] || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Length', fileContent.length);
    
    res.send(fileContent);
    
    // Geçici dosyayı sil
    await fs.remove(tempPath).catch(() => {});
  } catch (error) {
    try {
      await client.close();
    } catch (e) {}
    console.error('FTP download error:', error);
    res.status(500).json({ success: false, error: error.message || 'Bilinmeyen hata' });
  }
};

