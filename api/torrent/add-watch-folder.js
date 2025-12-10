const { setCorsHeaders, handleOptions } = require('../_helpers/cors');
const { handleError } = require('../_helpers/errorHandler');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const os = require('os');

/**
 * Add torrent using watch folder method
 * This method doesn't require Web UI authentication
 */
module.exports = async function handler(req, res) {
  // Debug: Log request details
  console.log('🔍 /api/torrent/add-watch-folder called:', {
    method: req.method,
    httpMethod: req.httpMethod,
    query: req.query,
    body: req.body,
    bodyType: typeof req.body,
    headers: {
      'content-type': req.headers['content-type'],
      origin: req.headers.origin,
      referer: req.headers.referer
    }
  });

  setCorsHeaders(res, req.headers.origin || req.headers.referer);

  // Handle OPTIONS preflight
  const method = req.method || req.httpMethod || 'GET';
  if (method === 'OPTIONS' || req.method === 'OPTIONS' || req.httpMethod === 'OPTIONS') {
    return handleOptions(req, res);
  }

  // Check if POST request - Vercel serverless functions compatibility
  const hasRequestBody = req.body && (typeof req.body === 'object' || typeof req.body === 'string');
  const isPostRequest = method === 'POST' || req.httpMethod === 'POST' || hasRequestBody;

  if (!isPostRequest) {
    return res.status(405).json({
      success: false,
      message: `Method not allowed. Expected POST, got ${method || req.httpMethod || 'undefined'}`,
      debug: {
        method,
        httpMethod: req.httpMethod,
        hasBody: hasRequestBody
      }
    });
  }

  try {
    let body = req.body;
    
    // Handle different body formats (Vercel serverless functions)
    if (!body) {
      // Try to read from request stream if body is undefined
      console.log('⚠️ Body is undefined, trying to read from request...');
      return res.status(400).json({
        success: false,
        message: 'Request body is missing or empty',
        debug: {
          method,
          httpMethod: req.httpMethod,
          contentType: req.headers['content-type']
        }
      });
    }

    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
        console.log('✅ Parsed body from string:', body);
      } catch (e) {
        console.error('❌ Failed to parse body as JSON:', e);
        return res.status(400).json({
          success: false,
          message: 'Invalid JSON in request body',
          details: e.message,
          bodyPreview: body.substring(0, 100)
        });
      }
    }

    // Log received body for debugging
    console.log('📥 Received body:', JSON.stringify(body, null, 2));
    console.log('📥 Body type:', typeof body);
    console.log('📥 Body keys:', body && typeof body === 'object' ? Object.keys(body) : 'not an object');

    const { torrentUrl, watchFolder } = body || {};

    console.log('📥 Extracted values:', {
      torrentUrl: torrentUrl ? torrentUrl.substring(0, 50) + '...' : 'undefined',
      watchFolder: watchFolder || 'undefined'
    });

    if (!torrentUrl || (typeof torrentUrl === 'string' && torrentUrl.trim() === '')) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameter: torrentUrl',
        received: {
          torrentUrl: torrentUrl || 'undefined',
          torrentUrlType: typeof torrentUrl,
          watchFolder: watchFolder || 'undefined',
          bodyKeys: body && typeof body === 'object' ? Object.keys(body) : 'body is not an object',
          bodyType: typeof body,
          rawBody: process.env.NODE_ENV === 'development' ? JSON.stringify(body) : undefined
        }
      });
    }

    // Default watch folder (can be configured)
    // Handle ~ in path (expand to home directory)
    let watchFolderPath = watchFolder || path.join(os.homedir(), 'Downloads', 'qBittorrent-watch');
    if (watchFolderPath.startsWith('~/')) {
      watchFolderPath = path.join(os.homedir(), watchFolderPath.substring(2));
    }
    const defaultWatchFolder = watchFolderPath;
    
    // Ensure watch folder exists
    if (!fs.existsSync(defaultWatchFolder)) {
      try {
        fs.mkdirSync(defaultWatchFolder, { recursive: true });
      } catch (error) {
        return res.status(500).json({
          success: false,
          message: `Watch folder oluşturulamadı: ${defaultWatchFolder}. Hata: ${error.message}`
        });
      }
    }

    let torrentFilePath = null;

    try {
      // Handle magnet links
      if (torrentUrl.startsWith('magnet:')) {
        // qBittorrent watch folder typically only detects .torrent files
        // For magnet links, we need to try different approaches
        // Option 1: Try .magnet extension (some qBittorrent versions support this)
        const filename = `magnet_${Date.now()}.magnet`;
        torrentFilePath = path.join(defaultWatchFolder, filename);
        
        // Write magnet link to file (plain text)
        fs.writeFileSync(torrentFilePath, torrentUrl, 'utf8');
        
        console.log('✅ Magnet link saved to:', torrentFilePath);
        console.log('📋 File content preview:', torrentUrl.substring(0, 100) + '...');
        console.log('⚠️ Note: qBittorrent watch folder may not detect .magnet files.');
        console.log('⚠️ Watch folder typically only works with .torrent files.');
        console.log('💡 Alternative: Use Web UI API for magnet links (requires Web UI enabled).');
      } else {
        // Download torrent file
        const response = await axios.get(torrentUrl, {
          responseType: 'arraybuffer',
          timeout: 30000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });

        // Generate filename
        let filename = `torrent_${Date.now()}.torrent`;
        
        // Try to get filename from Content-Disposition header
        if (response.headers['content-disposition']) {
          const match = response.headers['content-disposition'].match(/filename="?([^"]+)"?/);
          if (match && match[1]) {
            filename = match[1].replace(/[^a-zA-Z0-9._-]/g, '_');
          }
        }

        torrentFilePath = path.join(defaultWatchFolder, filename);
        
        // Save torrent file
        fs.writeFileSync(torrentFilePath, Buffer.from(response.data));
      }

      // Check if it's a magnet link
      const isMagnetLink = torrentUrl.startsWith('magnet:');
      
      return res.json({
        success: true,
        message: isMagnetLink 
          ? 'Magnet link watch folder\'a eklendi, ANCAK qBittorrent watch folder genellikle sadece .torrent dosyalarını algılar. Magnet linkler için Web UI API kullanılması önerilir.'
          : 'Torrent dosyası watch folder\'a eklendi',
        torrentFile: torrentFilePath,
        watchFolder: defaultWatchFolder,
        isMagnetLink: isMagnetLink,
        warning: isMagnetLink 
          ? 'qBittorrent watch folder magnet linkleri algılamayabilir. .torrent dosyaları için çalışır.'
          : 'qBittorrent otomatik olarak torrent\'i ekleyecektir. qBittorrent\'te watch folder ayarlandığından emin olun.'
      });

    } catch (error) {
      // Clean up file if it was created
      if (torrentFilePath && fs.existsSync(torrentFilePath)) {
        try {
          fs.unlinkSync(torrentFilePath);
        } catch (e) {
          // Ignore cleanup errors
        }
      }

      throw error;
    }

  } catch (error) {
    console.error('Watch folder add error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to add torrent to watch folder.',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

