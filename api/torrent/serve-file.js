const { setCorsHeaders, handleOptions } = require('../_helpers/cors');
const fs = require('fs');
const path = require('path');

// Simple in-memory file registry for temporary file serving
// In production, consider using a proper file storage service
const fileRegistry = new Map();

/**
 * Register a file for temporary serving
 * @param {string} fileHash - Unique identifier for the file
 * @param {string} filePath - Absolute path to the file
 * @param {number} ttl - Time to live in milliseconds (default: 1 hour)
 */
function registerFile(fileHash, filePath, ttl = 3600000) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }
  
  fileRegistry.set(fileHash, {
    path: filePath,
    expiresAt: Date.now() + ttl
  });
  
  // Auto-cleanup after TTL
  setTimeout(() => {
    fileRegistry.delete(fileHash);
  }, ttl);
  
  return fileHash;
}

/**
 * Serve file via HTTP GET request
 * GET /api/torrent/serve-file/:hash
 */
module.exports = async function handler(req, res) {
  setCorsHeaders(res, req.headers.origin || req.headers.referer);
  
  if (req.method === 'OPTIONS') {
    return handleOptions(req, res);
  }
  
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }
  
  try {
    // Extract hash from URL path
    // URL format: /api/torrent/serve-file/HASH or /api/torrent/serve-file?hash=HASH
    let fileHash = null;
    
    if (req.query && req.query.hash) {
      fileHash = req.query.hash;
    } else {
      // Try to extract from path
      const pathMatch = req.url.match(/\/serve-file\/([a-zA-Z0-9]+)/);
      if (pathMatch && pathMatch[1]) {
        fileHash = pathMatch[1];
      }
    }
    
    if (!fileHash) {
      return res.status(400).json({ 
        success: false, 
        message: 'File hash parameter missing. Use ?hash=HASH or /serve-file/HASH' 
      });
    }
    
    // Get file info from registry
    const fileInfo = fileRegistry.get(fileHash);
    
    if (!fileInfo) {
      return res.status(404).json({ 
        success: false, 
        message: 'File not found or expired. File hash may be invalid or file registration expired.' 
      });
    }
    
    // Check if file expired
    if (Date.now() > fileInfo.expiresAt) {
      fileRegistry.delete(fileHash);
      return res.status(404).json({ 
        success: false, 
        message: 'File registration expired' 
      });
    }
    
    // Check if file still exists
    if (!fs.existsSync(fileInfo.path)) {
      fileRegistry.delete(fileHash);
      return res.status(404).json({ 
        success: false, 
        message: 'File no longer exists on disk' 
      });
    }
    
    // Get file stats
    const stats = fs.statSync(fileInfo.path);
    const fileSize = stats.size;
    const ext = path.extname(fileInfo.path);
    const filename = path.basename(fileInfo.path);
    
    // Determine content type
    const contentTypes = {
      '.mp4': 'video/mp4',
      '.mkv': 'video/x-matroska',
      '.avi': 'video/x-msvideo',
      '.mov': 'video/quicktime',
      '.wmv': 'video/x-ms-wmv',
      '.flv': 'video/x-flv',
      '.webm': 'video/webm',
      '.m4v': 'video/x-m4v'
    };
    
    const contentType = contentTypes[ext.toLowerCase()] || 'application/octet-stream';
    
    // Set headers for file download/streaming
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Length', fileSize);
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    // Handle range requests (for video streaming)
    const range = req.headers.range;
    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = (end - start) + 1;
      
      res.status(206); // Partial Content
      res.setHeader('Content-Range', `bytes ${start}-${end}/${fileSize}`);
      res.setHeader('Content-Length', chunksize);
      
      const fileStream = fs.createReadStream(fileInfo.path, { start, end });
      fileStream.pipe(res);
    } else {
      // Send entire file
      res.status(200);
      const fileStream = fs.createReadStream(fileInfo.path);
      fileStream.pipe(res);
    }
  } catch (error) {
    console.error('Error serving file:', error);
    return res.status(500).json({ 
      success: false, 
      message: `Error serving file: ${error.message}` 
    });
  }
};

// Export registerFile function for use in other modules
module.exports.registerFile = registerFile;
module.exports.fileRegistry = fileRegistry;


