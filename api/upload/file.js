const { setCorsHeaders, handleOptions } = require('../_helpers/cors');
const { handleError } = require('../_helpers/errorHandler');
const { StreamtapeClient } = require('../_helpers/streamtape');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Check if running on Vercel (serverless)
const isVercel = process.env.VERCEL === '1' || process.env.VERCEL_ENV;

/**
 * Upload file to Streamtape
 * Accepts multipart/form-data with file and Streamtape credentials
 */
module.exports = async function handler(req, res) {
  const log = (...args) => {
    const timestamp = new Date().toISOString();
    const message = args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(' ');
    console.log(`[${timestamp}] [UPLOAD-FILE]`, ...args);
    process.stdout.write(`\n[${timestamp}] [UPLOAD-FILE] ${message}\n`);
  };

  try {
    log('📥 ========== upload/file endpoint called ==========');
    log('📥 Request method:', req.method);
    
    setCorsHeaders(res, req.headers.origin || req.headers.referer);

    if (req.method === 'OPTIONS') {
      return handleOptions(req, res);
    }

    if (req.method !== 'POST') {
      return res.status(405).json({ success: false, message: 'Method not allowed' });
    }

    // Send immediate response headers to prevent timeout
    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Transfer-Encoding': 'chunked',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no'
    });

    const initialResponse = JSON.stringify({
      success: true,
      message: 'Upload started. Processing...',
      status: 'processing'
    });
    res.write(initialResponse + '\n');

    log('✅ Request received - headers sent immediately');

    // Set extended timeout for large file uploads (15 minutes)
    if (req.setTimeout) {
      req.setTimeout(900000);
    }
    if (res.setTimeout) {
      res.setTimeout(900000);
    }

    try {
      // Parse multipart form data
      // Note: Vercel serverless functions handle multipart differently
      // We need to use a library like busboy or multer, or handle it manually
      
      // For now, we'll expect the file to be sent as base64 or use a library
      // Let's check if we have a file in the request
      
      let body = req.body;
      if (typeof body === 'string') {
        try {
          body = JSON.parse(body);
        } catch (e) {
          // Might be form data, handle differently
        }
      }

      log('📋 Request body keys:', Object.keys(body || {}));

      // Extract Streamtape credentials
      const {
        streamtapeLogin,
        streamtapeKey,
        streamtapeCookies,
        streamtapeAuthMethod
      } = body || {};

      const useCookies = streamtapeAuthMethod === 'cookie' && streamtapeCookies;
      const useApiKey = streamtapeAuthMethod !== 'cookie' && streamtapeLogin && streamtapeKey;

      if (!useCookies && !useApiKey) {
        return res.status(400).json({
          success: false,
          message: 'Missing Streamtape credentials (need either API Key or Cookies)'
        });
      }

      // Check if we have file data
      // In Vercel, files might come as base64 or in a different format
      let fileBuffer = null;
      let filename = null;

      // Try to get file from different possible formats
      if (body.file) {
        // If file is base64 encoded (data:video/mp4;base64,...)
        if (typeof body.file === 'string') {
          if (body.file.startsWith('data:')) {
            // Extract base64 data (everything after the comma)
            const base64Match = body.file.match(/^data:.*?;base64,(.+)$/);
            if (base64Match && base64Match[1]) {
              fileBuffer = Buffer.from(base64Match[1], 'base64');
              filename = body.filename || 'video.mp4';
              log(`✅ File decoded from base64: ${filename} (${(fileBuffer.length / (1024 * 1024)).toFixed(2)} MB)`);
            } else {
              // Try simple split if regex doesn't match
              const parts = body.file.split(',');
              if (parts.length > 1) {
                fileBuffer = Buffer.from(parts[1], 'base64');
                filename = body.filename || 'video.mp4';
                log(`✅ File decoded from base64 (simple): ${filename} (${(fileBuffer.length / (1024 * 1024)).toFixed(2)} MB)`);
              }
            }
          } else {
            // Assume it's already base64 without data URL prefix
            try {
              fileBuffer = Buffer.from(body.file, 'base64');
              filename = body.filename || 'video.mp4';
              log(`✅ File decoded from base64 (no prefix): ${filename} (${(fileBuffer.length / (1024 * 1024)).toFixed(2)} MB)`);
            } catch (e) {
              log('⚠️ Failed to decode base64:', e.message);
            }
          }
        } else if (Buffer.isBuffer(body.file)) {
          fileBuffer = body.file;
          filename = body.filename || 'video.mp4';
          log(`✅ File received as buffer: ${filename} (${(fileBuffer.length / (1024 * 1024)).toFixed(2)} MB)`);
        }
      }

      // If no file found, return error
      if (!fileBuffer) {
        log('⚠️ File not found in request body');
        const errorResponse = JSON.stringify({
          success: false,
          message: 'File not found in request. Please send file as base64 data URL.'
        });
        res.write('\n' + errorResponse);
        res.end();
        return;
      }

      log(`📁 File received: ${filename} (${(fileBuffer.length / (1024 * 1024)).toFixed(2)} MB)`);

      // Save file temporarily (Path Traversal koruması ile)
      const tempDir = os.tmpdir();
      const { sanitizePath, sanitizeFilename } = require('../_helpers/pathSecurity');
      
      // Sanitize filename
      const safeFilename = sanitizeFilename(filename);
      const tempFileName = `upload-${Date.now()}-${safeFilename}`;
      const tempFilePath = sanitizePath(path.join(tempDir, tempFileName), tempDir);
      
      if (!tempFilePath) {
        return res.status(400).json({ 
          success: false, 
          error: 'Geçersiz dosya yolu' 
        });
      }
      
      try {
        await fs.promises.writeFile(tempFilePath, fileBuffer);
        log(`💾 File saved to temp location: ${tempFilePath}`);

        // Create Streamtape client
        const streamtapeClient = useCookies 
          ? new StreamtapeClient(null, null, streamtapeCookies)
          : new StreamtapeClient(streamtapeLogin, streamtapeKey);

        // Progress callback
        const progressCallback = (progress) => {
          const progressData = JSON.stringify({
            success: true,
            status: 'uploading',
            progress: progress.percent,
            loadedMB: progress.loadedMB,
            totalMB: progress.totalMB,
            speedMBps: progress.speedMBps
          });
          res.write('\n' + progressData);
        };

        // Upload to Streamtape
        log('📤 Starting Streamtape upload...');
        const uploadResult = await streamtapeClient.uploadFile(
          tempFilePath,
          filename,
          progressCallback
        );

        log('✅ Upload completed successfully!');
        log('📋 Upload result:', uploadResult);

        // Clean up temp file
        try {
          await fs.promises.unlink(tempFilePath);
          log('🗑️ Temp file deleted');
        } catch (cleanupError) {
          log('⚠️ Failed to delete temp file:', cleanupError.message);
        }

        // Send final response
        const finalResponse = JSON.stringify({
          success: true,
          message: 'File uploaded successfully',
          streamtapeUrl: uploadResult.embedUrl,
          fileId: uploadResult.fileId,
          downloadUrl: uploadResult.downloadUrl
        });
        res.write('\n' + finalResponse);
        res.end();
        return;

      } catch (uploadError) {
        // Clean up temp file on error
        try {
          if (fs.existsSync(tempFilePath)) {
            await fs.promises.unlink(tempFilePath);
          }
        } catch (cleanupError) {
          log('⚠️ Failed to delete temp file after error:', cleanupError.message);
        }

        log('❌ Upload error:', uploadError.message);
        throw uploadError;
      }

    } catch (error) {
      console.error('❌ Upload file error:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });

      const errorResponse = JSON.stringify({
        success: false,
        message: `Upload failed: ${error.message}`,
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
      res.write('\n' + errorResponse);
      res.end();
      return;
    }

  } catch (outerError) {
    console.error('❌ Handler error:', outerError);
    return res.status(500).json({
      success: false,
      message: `Upload handler failed: ${outerError.message}`,
      error: process.env.NODE_ENV === 'development' ? outerError.stack : undefined
    });
  }
};

