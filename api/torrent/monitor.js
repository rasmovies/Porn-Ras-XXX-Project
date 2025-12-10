const { setCorsHeaders, handleOptions } = require('../_helpers/cors');
const { handleError } = require('../_helpers/errorHandler');
const { QBittorrentClient } = require('../_helpers/qbittorrent');
const { StreamtapeClient } = require('../_helpers/streamtape');
const fs = require('fs');
const path = require('path');

// Check if running on Vercel (serverless)
const isVercel = process.env.VERCEL === '1';

/**
 * Check torrent status and upload completed downloads to Streamtape
 */
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

    const {
      qbittorrentUrl,
      qbittorrentUsername,
      qbittorrentPassword,
      streamtapeLogin,
      streamtapeKey,
      streamtapeCookies,
      streamtapeAuthMethod,
      torrentHash
    } = body;

    if (!qbittorrentUrl || !qbittorrentUsername || !qbittorrentPassword || !torrentHash) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameters'
      });
    }

    const qbClient = new QBittorrentClient(qbittorrentUrl, qbittorrentUsername, qbittorrentPassword);
    
    // Get torrent info
    const torrents = await qbClient.getTorrentList('all');
    const torrent = torrents.find(t => t.hash === torrentHash);

    if (!torrent) {
      return res.status(404).json({
        success: false,
        message: 'Torrent not found'
      });
    }

    // Check if torrent is completed
    const isCompleted = torrent.state === 'completed' || torrent.progress >= 100;

    if (!isCompleted) {
      return res.json({
        success: true,
        completed: false,
        progress: torrent.progress,
        state: torrent.state,
        message: 'Torrent is still downloading'
      });
    }

    // If Streamtape credentials are provided, upload files
    let uploadResult = null;
    const useCookies = streamtapeAuthMethod === 'cookie' && streamtapeCookies;
    const useApiKey = streamtapeAuthMethod !== 'cookie' && streamtapeLogin && streamtapeKey;
    
    if ((useCookies || useApiKey) && torrent.path) {
      // Note: File upload requires access to the file system
      // This might not work in Vercel serverless environment
      // Consider using a background job service for this
      if (isVercel) {
        console.warn('File upload not supported in Vercel serverless. Use a background service.');
        return res.json({
          success: true,
          completed: true,
          progress: 100,
          state: torrent.state,
          torrentPath: torrent.path,
          message: 'Torrent completed. File upload requires server with file system access.'
        });
      }

      try {
        // Create Streamtape client with cookie or API key
        const streamtapeClient = useCookies 
          ? new StreamtapeClient(null, null, streamtapeCookies)
          : new StreamtapeClient(streamtapeLogin, streamtapeKey);
        
        // Find video files in torrent directory
        const videoExtensions = ['.mp4', '.mkv', '.avi', '.mov', '.wmv', '.flv', '.webm', '.m4v'];
        const files = findVideoFiles(torrent.path, videoExtensions);
        
        if (files.length > 0) {
          // Upload the first (largest) video file
          const fileToUpload = files.sort((a, b) => b.size - a.size)[0];
          
          uploadResult = await streamtapeClient.uploadFile(
            fileToUpload.path,
            fileToUpload.name
          );
        } else {
          return res.json({
            success: true,
            completed: true,
            progress: 100,
            state: torrent.state,
            torrentPath: torrent.path,
            message: 'Torrent completed but no video files found'
          });
        }
      } catch (uploadError) {
        console.error('Streamtape upload error:', uploadError);
        return res.status(500).json({
          success: false,
          completed: true,
          message: 'Torrent completed but upload failed: ' + uploadError.message
        });
      }
    }

    return res.json({
      success: true,
      completed: true,
      progress: 100,
      state: torrent.state,
      torrentPath: torrent.path,
      uploadResult: uploadResult ? {
        streamtapeUrl: uploadResult.embedUrl,
        fileId: uploadResult.fileId
      } : null,
      message: uploadResult ? 'Torrent completed and uploaded to Streamtape' : 'Torrent completed'
    });
  } catch (error) {
    return handleError(res, error, 'Failed to monitor torrent.');
  }
};

/**
 * Find video files in directory
 */
function findVideoFiles(dir, extensions) {
  const files = [];
  
  try {
    if (!fs.existsSync(dir)) {
      return files;
    }

    const items = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const item of items) {
      const fullPath = path.join(dir, item.name);
      
      if (item.isDirectory()) {
        // Recursively search subdirectories
        files.push(...findVideoFiles(fullPath, extensions));
      } else if (item.isFile()) {
        const ext = path.extname(item.name).toLowerCase();
        if (extensions.includes(ext)) {
          const stats = fs.statSync(fullPath);
          files.push({
            path: fullPath,
            name: item.name,
            size: stats.size
          });
        }
      }
    }
  } catch (error) {
    console.error('Error finding video files:', error);
  }
  
  return files;
}

