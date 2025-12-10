const { Client } = require('basic-ftp');

// FTP Configuration
const FTP_CONFIG = {
  host: 'ftp.streamtape.com',
  user: 'e3eddd5f523e3391352b',
  password: '4Av234M6QRtK30j',
  secure: false,
};

/**
 * POST /api/ftp/move
 * Move/rename file on FTP server
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
  
  try {
    console.log('FTP move endpoint called, from:', from, 'to:', to);
    await client.access(FTP_CONFIG);
    await client.rename(from, to);
    await client.close();
    
    res.status(200).json({ success: true });
  } catch (error) {
    try {
      await client.close();
    } catch (e) {}
    console.error('FTP move error:', error);
    res.status(500).json({ success: false, error: error.message || 'Bilinmeyen hata' });
  }
};

