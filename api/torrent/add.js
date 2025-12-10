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

    const { url, username, password, torrentUrl, autoUploadToStreamtape } = body;

    if (!url || !username || !password || !torrentUrl) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameters'
      });
    }

    // Add torrent to qBittorrent
    const client = new QBittorrentClient(url, username, password);
    await client.addTorrent(torrentUrl, {
      paused: false
    });

    // Get torrent hash for monitoring (if possible)
    let torrentHash = null;
    try {
      const torrents = await client.getTorrentList('all');
      // Try to find the just-added torrent by matching URL or name
      // Note: This is a best-effort approach
      if (torrents.length > 0) {
        torrentHash = torrents[0].hash;
      }
    } catch (e) {
      console.warn('Could not get torrent hash:', e);
    }

    return res.json({
      success: true,
      message: 'Torrent added successfully',
      autoUploadEnabled: autoUploadToStreamtape || false,
      torrentHash: torrentHash
    });
  } catch (error) {
    return handleError(res, error, 'Failed to add torrent.');
  }
};

