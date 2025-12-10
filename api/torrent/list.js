const { setCorsHeaders, handleOptions } = require('../_helpers/cors');
const { handleError } = require('../_helpers/errorHandler');
const { QBittorrentClient } = require('../_helpers/qbittorrent');

module.exports = async function handler(req, res) {
  setCorsHeaders(res, req.headers.origin || req.headers.referer);

  if (req.method === 'OPTIONS') {
    return handleOptions(req, res);
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      body = JSON.parse(body);
    }

    const { url, username = '', password = '', filter = 'all' } = body;

    if (!url) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameter: url. qBittorrent Web UI URL gerekli.'
      });
    }
    
    // Username and password are optional - qBittorrent might not require auth
    // But we still pass them (empty strings if not provided)

    const client = new QBittorrentClient(url, username, password);
    
    // Test connection first
    try {
      await client.testConnection();
    } catch (connectionError) {
      return res.status(500).json({
        success: false,
        message: `qBittorrent bağlantısı başarısız: ${connectionError.message}`,
        details: {
          url,
          error: connectionError.message,
          hint: 'qBittorrent programının çalıştığından ve Web UI\'nin aktif olduğundan emin olun.'
        }
      });
    }
    
    const torrents = await client.getTorrentList(filter);

    return res.json({
      success: true,
      torrents: torrents || []
    });
  } catch (error) {
    console.error('Torrent list error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to get torrent list.',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

