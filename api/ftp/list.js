const { Client } = require('basic-ftp');

// FTP Configuration
const FTP_CONFIG = {
  host: 'ftp.streamtape.com',
  user: 'e3eddd5f523e3391352b',
  password: '4Av234M6QRtK30j',
  secure: false,
};

/**
 * GET /api/ftp/list
 * List files in FTP directory
 */
module.exports = async function handler(req, res) {
  // Set CORS headers
  const origin = req.headers.origin || req.headers.referer;
  res.setHeader('Access-Control-Allow-Origin', origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle OPTIONS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Only allow GET
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }
  
  const client = new Client();
  const remotePath = req.query.path || '/';
  
  try {
    console.log('FTP list endpoint called, path:', remotePath);
    await client.access(FTP_CONFIG);
    const files = await client.list(remotePath);
    
    const fileList = files.map((file, index) => {
      try {
        let fileType = 'file';
        let fileSize = 0;
        let modifiedDate = null;
        let fileName = 'unknown';
        
        if (file.name) {
          fileName = String(file.name);
        } else if (file.rawName) {
          fileName = String(file.rawName);
        }
        
        if (file.type === 2) {
          fileType = 'directory';
        } else if (file.type === 1) {
          fileType = 'file';
        } else {
          if (file.isDirectory && typeof file.isDirectory === 'function') {
            fileType = file.isDirectory() ? 'directory' : 'file';
          } else if (file.isFile && typeof file.isFile === 'function') {
            fileType = file.isFile() ? 'file' : 'directory';
          } else {
            fileType = 'file';
          }
        }
        
        if (file.size !== undefined && file.size !== null) {
          const parsedSize = parseInt(String(file.size));
          if (!isNaN(parsedSize)) {
            fileSize = parsedSize;
          }
        }
        
        if (file.modified) {
          try {
            if (file.modified instanceof Date) {
              if (!isNaN(file.modified.getTime())) {
                modifiedDate = file.modified.toISOString();
              }
            } else if (typeof file.modified === 'string') {
              const parsedDate = new Date(file.modified);
              if (!isNaN(parsedDate.getTime())) {
                modifiedDate = parsedDate.toISOString();
              }
            } else if (typeof file.modified === 'number') {
              const parsedDate = new Date(file.modified);
              if (!isNaN(parsedDate.getTime())) {
                modifiedDate = parsedDate.toISOString();
              }
            }
          } catch (e) {
            modifiedDate = null;
          }
        }
        
        return {
          name: fileName,
          type: fileType,
          size: fileSize,
          modified: modifiedDate
        };
      } catch (itemError) {
        console.error(`Error processing file item ${index}:`, itemError);
        return {
          name: 'error',
          type: 'file',
          size: 0,
          modified: null
        };
      }
    }).filter(file => file.name !== 'error' || files.length === 0);
    
    await client.close();
    res.status(200).json({ success: true, files: fileList, path: remotePath });
  } catch (error) {
    try {
      await client.close();
    } catch (e) {}
    console.error('FTP list error:', error);
    res.status(500).json({ success: false, error: error.message || 'Bilinmeyen hata' });
  }
};

