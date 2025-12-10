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
 * GET /api/ftp/read
 * Read file content from FTP server
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
    console.log('FTP read endpoint called, path:', remotePath);
    await client.access(FTP_CONFIG);
    
    // Geçici dosya oluştur
    const tempDir = '/tmp';
    await fs.ensureDir(tempDir);
    const tempPath = path.join(tempDir, path.basename(remotePath) + '_' + Date.now());
    
    await client.downloadTo(tempPath, remotePath);
    const content = await fs.readFile(tempPath, 'utf8');
    
    await fs.remove(tempPath).catch(() => {});
    await client.close();
    
    res.status(200).json({ success: true, content });
  } catch (error) {
    try {
      await client.close();
    } catch (e) {}
    await fs.remove(tempPath).catch(() => {});
    console.error('FTP read error:', error);
    res.status(500).json({ success: false, error: error.message || 'Bilinmeyen hata' });
  }
};

