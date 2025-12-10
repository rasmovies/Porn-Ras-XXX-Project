const { setCorsHeaders, handleOptions } = require('../_helpers/cors');
const { handleError } = require('../_helpers/errorHandler');
const { QBittorrentClient } = require('../_helpers/qbittorrent');
const { StreamtapeClient } = require('../_helpers/streamtape');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { registerFile } = require('./serve-file');

// Check if running on Vercel (serverless)
const isVercel = process.env.VERCEL === '1' || process.env.VERCEL_ENV;

/**
 * Check completed torrents and upload to Streamtape
 */
module.exports = async function handler(req, res) {
  // Enhanced logging function
  const log = (...args) => {
    const timestamp = new Date().toISOString();
    const message = args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(' ');
    console.log(`[${timestamp}] [UPLOAD-COMPLETED]`, ...args);
    process.stdout.write(`\n[${timestamp}] [UPLOAD-COMPLETED] ${message}\n`);
  };
  
  // Wrap entire handler in try-catch to ensure JSON responses
  try {
    // CRITICAL: Log immediately when endpoint is called
    log('📥 ========== upload-completed endpoint called ==========');
    log('📥 Request method:', req.method);
    log('📥 Request URL:', req.url);
    log('📥 Request headers:', {
      'content-type': req.headers['content-type'],
      origin: req.headers.origin,
      referer: req.headers.referer
    });
    
    // Send early response header to keep connection alive
    setCorsHeaders(res, req.headers.origin || req.headers.referer);

    if (req.method === 'OPTIONS') {
      return handleOptions(req, res);
    }

    if (req.method !== 'POST') {
      return res.status(405).json({ success: false, message: 'Method not allowed' });
    }

    // CRITICAL: Send an immediate chunked response to prevent HeadersTimeoutError
    // Vercel dev server has a ~300s headers timeout, so we need to send headers immediately
    // and use chunked transfer encoding for long-running operations
    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Transfer-Encoding': 'chunked',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no' // Disable nginx buffering
    });
    
    // Send initial chunk to acknowledge request (prevents headers timeout)
    const initialResponse = JSON.stringify({
      success: true,
      message: 'Upload started. Processing in progress...',
      status: 'processing'
    });
    res.write(initialResponse + '\n');
    
    log('✅ Request received - headers sent immediately to prevent timeout');
    
    // Set extended timeout and keep-alive headers for large file uploads (15 minutes)
    // This prevents HeadersTimeoutError and connection drops for long-running uploads
    if (req.setTimeout) {
      req.setTimeout(900000); // 15 minutes
    }
    if (res.setTimeout) {
      res.setTimeout(900000); // 15 minutes
    }

    try {
      let body = req.body;
      if (typeof body === 'string') {
        body = JSON.parse(body);
      }
      
      log('📋 Request body:', {
        qbittorrentUrl: body.qbittorrentUrl,
        hasUsername: !!body.qbittorrentUsername,
        hasPassword: !!body.qbittorrentPassword,
        streamtapeAuthMethod: body.streamtapeAuthMethod,
        hasStreamtapeCreds: !!(body.streamtapeLogin || body.streamtapeCookies)
      });

      const {
        qbittorrentUrl,
        qbittorrentUsername,
        qbittorrentPassword,
        streamtapeLogin,
        streamtapeKey,
        streamtapeCookies,
        streamtapeAuthMethod
      } = body;

      // Validate qBittorrent credentials - username and password are optional
      if (!qbittorrentUrl) {
        return res.status(400).json({
          success: false,
          message: 'Missing qBittorrent URL'
        });
      }

      // Allow empty username/password (some qBittorrent instances don't require auth)
      const qbUsername = qbittorrentUsername || '';
      const qbPassword = qbittorrentPassword || '';

      const useCookies = streamtapeAuthMethod === 'cookie' && streamtapeCookies;
      const useApiKey = streamtapeAuthMethod !== 'cookie' && streamtapeLogin && streamtapeKey;

      if (!useCookies && !useApiKey) {
        return res.status(400).json({
          success: false,
          message: 'Missing Streamtape credentials (need either API Key or Cookies)'
        });
      }

      try {
        log('🔗 Creating qBittorrent client...', { url: qbittorrentUrl, hasUsername: !!qbUsername, hasPassword: !!qbPassword });
        const qbClient = new QBittorrentClient(qbittorrentUrl, qbUsername, qbPassword);
        
        // Test connection first
        try {
          log('🧪 Testing qBittorrent connection...');
          await qbClient.testConnection();
          log('✅ qBittorrent connection test successful');
        } catch (testError) {
          log('❌ qBittorrent connection test failed:', testError.message);
          console.error('Error details:', {
            message: testError.message,
            stack: testError.stack,
            response: testError.response?.data,
            status: testError.response?.status
          });
          return res.status(500).json({
            success: false,
            message: `qBittorrent bağlantı hatası: ${testError.message || 'qBittorrent\'e bağlanılamıyor. Web UI açık mı? URL doğru mu?'}`,
            details: process.env.NODE_ENV === 'development' ? {
              error: testError.message,
              stack: testError.stack,
              response: testError.response?.data,
              status: testError.response?.status
            } : undefined
          });
        }
        
        // Create Streamtape client with cookie or API key
        const streamtapeClient = useCookies 
          ? new StreamtapeClient(null, null, streamtapeCookies)
          : new StreamtapeClient(streamtapeLogin, streamtapeKey);
        
        // Get completed torrents
        let torrents;
        try {
          log('📋 Fetching completed torrents...');
          torrents = await qbClient.getTorrentList('completed');
          log(`✅ Found ${torrents.length} completed torrent(s)`);
        } catch (listError) {
          console.error('❌ Failed to get torrent list:', listError);
          console.error('Error details:', {
            message: listError.message,
            stack: listError.stack,
            response: listError.response?.data,
            status: listError.response?.status
          });
          return res.status(500).json({
            success: false,
            message: `Torrent listesi alınamadı: ${listError.message || 'Bilinmeyen hata'}`,
            details: process.env.NODE_ENV === 'development' ? {
              error: listError.message,
              stack: listError.stack,
              response: listError.response?.data,
              status: listError.response?.status
            } : undefined
          });
        }

        const uploadResults = [];

        // Check if running on Vercel (file system access not available)
        if (isVercel) {
          log('⚠️ Running on Vercel serverless - file system access limited');
          return res.json({
            success: true,
            message: `Found ${torrents.length} completed torrent(s), but file upload requires a server with file system access (VPS or local development).`,
            uploadResults: [],
            note: 'Vercel serverless functions cannot access local file system. Use local development (npx vercel dev) or deploy to a VPS for file upload functionality.'
          });
        }

        for (const torrent of torrents) {
          try {
            if (!torrent.path || !fs.existsSync(torrent.path)) {
              log(`⚠️ Torrent path not found: ${torrent.path}`);
              continue;
            }

            // Find video files
            const videoExtensions = ['.mp4', '.mkv', '.avi', '.mov', '.wmv', '.flv', '.webm', '.m4v'];
            const videoFiles = findVideoFiles(torrent.path, videoExtensions);

            if (videoFiles.length === 0) {
              continue;
            }

            // Upload the largest video file
            const fileToUpload = videoFiles.sort((a, b) => b.size - a.size)[0];
            
            log(`📁 Starting upload for: ${fileToUpload.name}`);
            log(`📁 File size: ${(fileToUpload.size / (1024 * 1024)).toFixed(2)} MB`);
            log(`📁 File path: ${fileToUpload.path}`);

            try {
              // Progress callback for detailed logging
              const progressCallback = (progress) => {
                const etaSeconds = progress.speedMBps && progress.speedMBps > 0 
                  ? Math.round((progress.totalMB - progress.loadedMB) / progress.speedMBps)
                  : null;
                const etaMinutes = etaSeconds ? Math.floor(etaSeconds / 60) : null;
                const etaSecondsRemainder = etaSeconds ? etaSeconds % 60 : null;
                
                let progressLog = `📊 Upload Progress: ${progress.percent}%`;
                progressLog += ` (${progress.loadedMB.toFixed(2)} MB / ${progress.totalMB.toFixed(2)} MB)`;
                
                if (progress.speedMBps) {
                  progressLog += ` - Speed: ${progress.speedMBps.toFixed(2)} MB/s`;
                }
                
                if (etaMinutes !== null) {
                  progressLog += ` - ETA: ${etaMinutes}m ${etaSecondsRemainder}s`;
                }
                
                log(progressLog);
              };
              
              const uploadResult = await streamtapeClient.uploadFile(
                fileToUpload.path,
                fileToUpload.name,
                progressCallback
              );
              
              log(`✅ Upload completed for: ${fileToUpload.name}`);

              uploadResults.push({
                torrentHash: torrent.hash,
                torrentName: torrent.name,
                fileName: fileToUpload.name,
                streamtapeUrl: uploadResult.embedUrl,
                fileId: uploadResult.fileId,
                success: true
              });
            } catch (uploadError) {
              uploadResults.push({
                torrentHash: torrent.hash,
                torrentName: torrent.name,
                fileName: fileToUpload.name,
                success: false,
                error: uploadError.message
              });
            }
          } catch (error) {
            console.error(`Error processing torrent ${torrent.hash}:`, error);
            uploadResults.push({
              torrentHash: torrent.hash,
              torrentName: torrent.name,
              success: false,
              error: error.message
            });
          }
        }

        log('✅ Processing completed. Upload results:', uploadResults.length);
        
        // Send final chunk and close response
        const finalResponse = JSON.stringify({
          success: true,
          message: `Processed ${torrents.length} completed torrents`,
          uploadResults: uploadResults
        });
        res.write('\n' + finalResponse);
        res.end();
        return;
      } catch (qbError) {
        console.error('❌ qBittorrent error in main try block:', qbError);
        console.error('Error details:', {
          message: qbError.message,
          stack: qbError.stack,
          name: qbError.name,
          response: qbError.response?.data,
          status: qbError.response?.status,
          code: qbError.code
        });
        return res.status(500).json({
          success: false,
          message: `qBittorrent hatası: ${qbError.message || 'Unable to connect to qBittorrent. Check URL and credentials.'}`,
          details: process.env.NODE_ENV === 'development' ? {
            error: qbError.message,
            stack: qbError.stack,
            name: qbError.name,
            code: qbError.code,
            response: qbError.response?.data,
            status: qbError.response?.status
          } : undefined
        });
      }
    } catch (error) {
      console.error('❌ Upload completed - Outer catch error:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name,
        code: error.code
      });
      
      // Ensure we send JSON response, not HTML
      try {
        return handleError(res, error, 'Failed to upload completed torrents.');
      } catch (handleErrorErr) {
        // If handleError itself fails, send simple JSON error
        console.error('❌ handleError failed, sending simple error response:', handleErrorErr);
        return res.status(500).json({
          success: false,
          message: `Failed to upload completed torrents: ${error.message}`,
          error: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
      }
    }
  } catch (outerError) {
    // Catch any errors during handler execution (including initialization)
    console.error('❌ Handler error:', outerError);
    console.error('Error details:', {
      message: outerError.message,
      stack: outerError.stack,
      name: outerError.name,
      code: outerError.code
    });
    
    // Always send JSON response, never HTML
    return res.status(500).json({
      success: false,
      message: `Upload handler failed: ${outerError.message}`,
      error: process.env.NODE_ENV === 'development' ? outerError.stack : undefined,
      type: 'handler_error'
    });
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

    const stats = fs.statSync(dir);
    
    // If it's a file, check if it's a video
    if (stats.isFile()) {
      const ext = path.extname(dir).toLowerCase();
      if (extensions.includes(ext)) {
        files.push({
          path: dir,
          name: path.basename(dir),
          size: stats.size
        });
      }
      return files;
    }

    // If it's a directory, search recursively
    const items = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const item of items) {
      const fullPath = path.join(dir, item.name);
      
      if (item.isDirectory()) {
        files.push(...findVideoFiles(fullPath, extensions));
      } else if (item.isFile()) {
        const ext = path.extname(item.name).toLowerCase();
        if (extensions.includes(ext)) {
          const fileStats = fs.statSync(fullPath);
          files.push({
            path: fullPath,
            name: item.name,
            size: fileStats.size
          });
        }
      }
    }
  } catch (error) {
    console.error('Error finding video files:', error);
  }
  
  return files;
}
