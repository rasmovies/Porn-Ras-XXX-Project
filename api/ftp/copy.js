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
 * POST /api/ftp/copy
 * Copy file on FTP server
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
  const { from, to } = req.body;
  
  if (!from || !to) {
    return res.status(400).json({ success: false, error: 'Kaynak ve hedef yolu gerekli' });
  }
  
  let tempPath = null;
  
  try {
    console.log('FTP copy endpoint called, from:', from, 'to:', to);
    await client.access(FTP_CONFIG);
    
    // Geçici dosya oluştur
    const tempDir = '/tmp';
    await fs.ensureDir(tempDir);
    tempPath = path.join(tempDir, path.basename(from) + '_' + Date.now());
    
    // İndir
    await client.downloadTo(tempPath, from);
    
    // Yükle
    await client.uploadFrom(tempPath, to);
    
    // Geçici dosyayı sil
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
    console.error('FTP copy error:', error);
    res.status(500).json({ success: false, error: error.message || 'Bilinmeyen hata' });
  }
};

