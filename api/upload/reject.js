/**
 * POST /api/upload/reject
 * Yükleme reddini işler
 */
module.exports = async function handler(req, res) {
  const origin = req.headers.origin || req.headers.referer;
  res.setHeader('Access-Control-Allow-Origin', origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }
  
  try {
    const { fileName } = req.body || {};
    
    if (!fileName) {
      return res.status(400).json({ success: false, error: 'Dosya adı gerekli' });
    }
    
    const pendingUploads = global.pendingUploads || new Map();
    const pending = pendingUploads.get(fileName);
    
    if (pending) {
      // Timeout'u temizle
      if (pending.timeout) {
        clearTimeout(pending.timeout);
      }
      // Pending'den kaldır
      pendingUploads.delete(fileName);
    }
    
    res.json({ success: true, message: 'Yükleme reddedildi' });
  } catch (error) {
    console.error('Reject upload error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

