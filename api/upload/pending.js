/**
 * GET /api/upload/pending
 * Bekleyen yükleme onaylarını listeler
 */
module.exports = async function handler(req, res) {
  const origin = req.headers.origin || req.headers.referer;
  res.setHeader('Access-Control-Allow-Origin', origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }
  
  try {
    // Global pendingUploads Map'ini kontrol et
    const pendingUploads = global.pendingUploads || new Map();
    
    const pendingList = Array.from(pendingUploads.entries()).map(([fileName, data]) => ({
      fileName,
      filePath: data.filePath,
      fileSize: data.fileSize || 0,
      timestamp: data.timestamp || Date.now()
    }));
    
    res.json({ success: true, pending: pendingList });
  } catch (error) {
    console.error('Pending uploads error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

