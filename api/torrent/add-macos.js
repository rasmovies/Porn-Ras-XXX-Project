const { setCorsHeaders, handleOptions } = require('../_helpers/cors');
const { handleError } = require('../_helpers/errorHandler');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { sanitizePath, sanitizeFilename } = require('../_helpers/pathSecurity');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

/**
 * Add torrent using macOS system integration
 * Opens torrent file with qBittorrent directly
 */
module.exports = async function handler(req, res) {
  setCorsHeaders(res, req.headers.origin || req.headers.referer);

  if (req.method === 'OPTIONS') {
    return handleOptions(req, res);
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  // Check if running on macOS
  if (os.platform() !== 'darwin') {
    return res.status(400).json({
      success: false,
      message: 'Bu yöntem sadece macOS\'ta çalışır. Watch folder yöntemini kullanın.'
    });
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      body = JSON.parse(body);
    }

    const { torrentUrl } = body;

    if (!torrentUrl) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameter: torrentUrl'
      });
    }

    // Create temp directory
    const tempDir = path.join(os.tmpdir(), 'torrent-manager');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    let torrentFilePath = null;

    try {
      // Handle magnet links
      if (torrentUrl.startsWith('magnet:')) {
        // For magnet links, save as .magnet file
        const filename = sanitizeFilename(`magnet_${Date.now()}.magnet`);
        torrentFilePath = sanitizePath(path.join(tempDir, filename), tempDir);
        if (!torrentFilePath) {
          return res.status(400).json({
            success: false,
            error: 'Geçersiz dosya yolu'
          });
        }
        fs.writeFileSync(torrentFilePath, torrentUrl, 'utf8');
      } else {
        // Download torrent file
        const response = await axios.get(torrentUrl, {
          responseType: 'arraybuffer',
          timeout: 30000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
          }
        });

        // Generate filename
        let filename = `torrent_${Date.now()}.torrent`;
        
        // Try to get filename from Content-Disposition header
        if (response.headers['content-disposition']) {
          const match = response.headers['content-disposition'].match(/filename="?([^"]+)"?/);
          if (match && match[1]) {
            // Sanitize filename from header
            filename = sanitizeFilename(match[1]);
            if (!filename || filename === 'unnamed') {
              filename = `torrent_${Date.now()}.torrent`;
            }
          }
        } else {
          filename = sanitizeFilename(filename);
        }

        // Sanitize torrent file path (Path Traversal koruması ile)
        torrentFilePath = sanitizePath(path.join(tempDir, filename), tempDir);
        if (!torrentFilePath) {
          return res.status(400).json({
            success: false,
            error: 'Geçersiz torrent dosya yolu'
          });
        }
        fs.writeFileSync(torrentFilePath, Buffer.from(response.data));
      }

      // Open with qBittorrent on macOS
      try {
        await execAsync(`open -a qBittorrent "${torrentFilePath}"`);
        
        // Clean up file after a delay (qBittorrent reads it)
        setTimeout(() => {
          if (fs.existsSync(torrentFilePath)) {
            try {
              fs.unlinkSync(torrentFilePath);
            } catch (e) {
              // Ignore cleanup errors
            }
          }
        }, 5000);

        return res.json({
          success: true,
          message: 'Torrent qBittorrent\'e gönderildi',
          torrentFile: torrentFilePath,
          note: 'qBittorrent açılıp torrent eklendi. Eğer qBittorrent açılmadıysa, qBittorrent programının kurulu olduğundan emin olun.'
        });

      } catch (openError) {
        throw new Error(`qBittorrent açılamadı: ${openError.message}. qBittorrent programının kurulu olduğundan emin olun.`);
      }

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
    console.error('macOS torrent add error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to add torrent.',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};






