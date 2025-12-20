const { Client } = require('basic-ftp');
const fs = require('fs-extra');
const path = require('path');
const { sanitizePath, sanitizeFilename } = require('../_helpers/pathSecurity');

// FTP Configuration
const FTP_CONFIG = {
  host: 'ftp.streamtape.com',
  user: 'e3eddd5f523e3391352b',
  password: '4Av234M6QRtK30j',
  secure: false,
};

// Chunk storage (memory'de tutulacak - production'da Redis kullanılabilir)
const chunks = new Map();

/**
 * POST /api/ftp/upload-chunk
 * Upload file chunk to FTP server (chunked upload)
 */
module.exports = async function handler(req, res) {
  // Set CORS headers
  const origin = req.headers.origin || req.headers.referer;
  res.setHeader('Access-Control-Allow-Origin', origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle OPTIONS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }
  
  try {
    // Request body'yi parse et
    let body;
    if (typeof req.body === 'string') {
      body = JSON.parse(req.body);
    } else {
      body = req.body;
    }
    
    const { fileName, chunkIndex, totalChunks, chunkData, filePath: remotePath } = body;
    
    if (!fileName || chunkIndex === undefined || !totalChunks || !chunkData) {
      return res.status(400).json({ success: false, error: 'Eksik parametreler' });
    }
    
    // Sanitize fileName to prevent Path Traversal
    const safeFileName = sanitizeFilename(fileName);
    if (!safeFileName || safeFileName === 'unnamed') {
      return res.status(400).json({ success: false, error: 'Geçersiz dosya adı' });
    }
    
    // Validate chunkIndex
    const chunkIdx = parseInt(chunkIndex, 10);
    if (isNaN(chunkIdx) || chunkIdx < 0 || chunkIdx >= parseInt(totalChunks, 10)) {
      return res.status(400).json({ success: false, error: 'Geçersiz chunk index' });
    }
    
    const chunkKey = `${safeFileName}-${chunkIdx}`;
    
    // Chunk'ı base64'ten buffer'a çevir
    const chunkBuffer = Buffer.from(chunkData, 'base64');
    
    // Chunk'ı geçici olarak kaydet (Path Traversal koruması ile)
    const tempDir = '/tmp/chunks';
    await fs.ensureDir(tempDir);
    
    // Sanitize chunk file path
    const chunkFilePath = sanitizePath(path.join(tempDir, chunkKey), tempDir);
    if (!chunkFilePath) {
      return res.status(400).json({ success: false, error: 'Geçersiz dosya yolu' });
    }
    
    await fs.writeFile(chunkFilePath, chunkBuffer);
    
    // Chunk bilgisini kaydet (sanitized fileName kullan)
    if (!chunks.has(safeFileName)) {
      // Sanitize remotePath if provided
      const safeRemotePath = remotePath ? sanitizeFilename(remotePath) : `/${safeFileName}`;
      chunks.set(safeFileName, {
        totalChunks: parseInt(totalChunks, 10),
        chunks: [],
        remotePath: safeRemotePath,
        startTime: Date.now()
      });
    }
    
    const fileInfo = chunks.get(safeFileName);
    fileInfo.chunks.push({
      index: chunkIndex,
      path: chunkFilePath,
      size: chunkBuffer.length
    });
    
    // Tüm chunk'lar geldi mi kontrol et
    if (fileInfo.chunks.length === totalChunks) {
      // Chunk'ları sıraya göre sırala
      fileInfo.chunks.sort((a, b) => a.index - b.index);
      
      // Dosyayı birleştir ve FTP'ye yükle (Path Traversal koruması ile)
      const finalFilePath = sanitizePath(path.join('/tmp', safeFileName), '/tmp');
      if (!finalFilePath) {
        chunks.delete(safeFileName);
        return res.status(400).json({ success: false, error: 'Geçersiz dosya yolu' });
      }
      const writeStream = fs.createWriteStream(finalFilePath);
      
      for (const chunk of fileInfo.chunks) {
        const chunkData = await fs.readFile(chunk.path);
        writeStream.write(chunkData);
        // Geçici chunk dosyasını sil
        await fs.remove(chunk.path).catch(() => {});
      }
      
      writeStream.end();
      
      // Dosya yazılmasını bekle
      await new Promise((resolve, reject) => {
        writeStream.on('finish', resolve);
        writeStream.on('error', reject);
      });
      
      // FTP'ye yükle
      const client = new Client();
      try {
        await client.access(FTP_CONFIG);
        await client.uploadFrom(finalFilePath, fileInfo.remotePath);
        await client.close();
        
        // Birleştirilmiş dosyayı sil
        await fs.remove(finalFilePath).catch(() => {});
        
        // Chunk bilgisini temizle
        chunks.delete(safeFileName);
        
        return res.status(200).json({ 
          success: true, 
          fileName: safeFileName,
          message: 'Dosya başarıyla yüklendi'
        });
      } catch (ftpError) {
        await client.close().catch(() => {});
        await fs.remove(finalFilePath).catch(() => {});
        chunks.delete(safeFileName);
        throw ftpError;
      }
    }
    
    // Chunk alındı, devam ediyor
    res.status(200).json({ 
      success: true, 
      chunkIndex: chunkIdx,
      totalChunks: parseInt(totalChunks, 10),
      received: fileInfo.chunks.length,
      message: `Chunk ${chunkIdx + 1}/${totalChunks} alındı`
    });
    
  } catch (error) {
    console.error('Chunk upload error:', error);
    res.status(500).json({ success: false, error: error.message || 'Bilinmeyen hata' });
  }
};

