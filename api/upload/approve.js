/**
 * POST /api/upload/approve
 * Yükleme onayını işler
 */
const path = require('path');
const fs = require('fs-extra');
const { Client } = require('basic-ftp');

// FTP yapılandırması
const FTP_CONFIG = {
  host: 'ftp.streamtape.com',
  user: 'e3eddd5f523e3391352b',
  password: '4Av234M6QRtK30j',
  secure: false
};

// uploadFile fonksiyonunu buraya kopyala (server.js'den)
async function uploadFile(filePath) {
  const client = new Client();
  const fileName = path.basename(filePath);
  const fileStats = await fs.stat(filePath);
  const totalBytes = fileStats.size;
  
  try {
    await client.access(FTP_CONFIG);
    await client.uploadFrom(filePath, fileName);
    
    // Başarılı yükleme sonrası dosyayı gönderilenler klasörüne taşı
    const SENT_DIR = path.join(__dirname, '../../gönderilenler');
    await fs.ensureDir(SENT_DIR);
    const destPath = path.join(SENT_DIR, fileName);
    await fs.move(filePath, destPath, { overwrite: true });
    
    client.close();
    return { success: true, fileName };
  } catch (error) {
    try {
      client.close();
    } catch (e) {}
    return { success: false, fileName, error: error.message };
  }
}

module.exports = async function handler(req, res) {
  const origin = req.headers.origin || req.headers.referer;
  res.setHeader('Access-Control-Allow-Origin', origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }
  
  try {
    const { fileName } = req.body || {};
    
    if (!fileName) {
      return res.status(400).json({ success: false, error: 'Dosya adı gerekli' });
    }
    
    const pendingUploads = global.pendingUploads || new Map();
    const pending = pendingUploads.get(fileName);
    
    if (!pending) {
      return res.status(404).json({ success: false, error: 'Bekleyen yükleme bulunamadı' });
    }
    
    // Timeout'u temizle
    if (pending.timeout) {
      clearTimeout(pending.timeout);
    }
    
    // Pending'den kaldır
    pendingUploads.delete(fileName);
    
    // Yükleme başlat (async - response'u beklemeden döndür)
    uploadFile(pending.filePath).then(result => {
      console.log('✅ Yükleme tamamlandı:', result);
    }).catch(error => {
      console.error('❌ Yükleme hatası:', error);
    });
    
    res.json({ success: true, message: 'Yükleme başlatıldı' });
  } catch (error) {
    console.error('Approve upload error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

