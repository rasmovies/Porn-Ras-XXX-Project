const { Client } = require('basic-ftp');

// FTP Configuration
const FTP_CONFIG = {
  host: 'ftp.streamtape.com',
  user: 'e3eddd5f523e3391352b',
  password: '4Av234M6QRtK30j',
  secure: false,
};

/**
 * DELETE /api/ftp/delete
 * Delete file from FTP server
 */
module.exports = async function handler(req, res) {
  // Set CORS headers
  const origin = req.headers.origin || req.headers.referer;
  res.setHeader('Access-Control-Allow-Origin', origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'DELETE, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle OPTIONS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Vercel'de DELETE method'u bazen çalışmıyor, POST ile body'den al
  const method = req.method || req.httpMethod || 'GET';
  const remotePath = req.query.path || req.body?.path;
  
  if (!remotePath) {
    return res.status(400).json({ success: false, error: 'Dosya yolu gerekli' });
  }
  
  // DELETE veya POST method'unu kabul et
  if (method !== 'DELETE' && method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed. Use DELETE or POST' });
  }
  
  const client = new Client();
  
  try {
    console.log('FTP delete endpoint called, path:', remotePath);
    await client.access(FTP_CONFIG);
    await client.remove(remotePath);
    await client.close();
    res.status(200).json({ success: true });
  } catch (error) {
    try {
      await client.close();
    } catch (e) {}
    console.error('FTP delete error:', error);
    res.status(500).json({ success: false, error: error.message || 'Bilinmeyen hata' });
  }
};

