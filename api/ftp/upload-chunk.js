const { Client } = require('basic-ftp');
const fs = require('fs-extra');
const path = require('path');

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
    
    const chunkKey = `${fileName}-${chunkIndex}`;
    
    // Chunk'ı base64'ten buffer'a çevir
    const chunkBuffer = Buffer.from(chunkData, 'base64');
    
    // Chunk'ı geçici olarak kaydet
    const tempDir = '/tmp/chunks';
    await fs.ensureDir(tempDir);
    const chunkFilePath = path.join(tempDir, chunkKey);
    await fs.writeFile(chunkFilePath, chunkBuffer);
    
    // Chunk bilgisini kaydet
    if (!chunks.has(fileName)) {
      chunks.set(fileName, {
        totalChunks,
        chunks: [],
        remotePath: remotePath || `/${fileName}`,
        startTime: Date.now()
      });
    }
    
    const fileInfo = chunks.get(fileName);
    fileInfo.chunks.push({
      index: chunkIndex,
      path: chunkFilePath,
      size: chunkBuffer.length
    });
    
    // Tüm chunk'lar geldi mi kontrol et
    if (fileInfo.chunks.length === totalChunks) {
      // Chunk'ları sıraya göre sırala
      fileInfo.chunks.sort((a, b) => a.index - b.index);
      
      // Dosyayı birleştir ve FTP'ye yükle
      const finalFilePath = path.join('/tmp', fileName);
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
        chunks.delete(fileName);
        
        return res.status(200).json({ 
          success: true, 
          fileName,
          message: 'Dosya başarıyla yüklendi'
        });
      } catch (ftpError) {
        await client.close().catch(() => {});
        await fs.remove(finalFilePath).catch(() => {});
        chunks.delete(fileName);
        throw ftpError;
      }
    }
    
    // Chunk alındı, devam ediyor
    res.status(200).json({ 
      success: true, 
      chunkIndex,
      totalChunks,
      received: fileInfo.chunks.length,
      message: `Chunk ${chunkIndex + 1}/${totalChunks} alındı`
    });
    
  } catch (error) {
    console.error('Chunk upload error:', error);
    res.status(500).json({ success: false, error: error.message || 'Bilinmeyen hata' });
  }
};

