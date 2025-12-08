const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs-extra');
const { createReadStream } = require('fs');
const chokidar = require('chokidar');
const { Client } = require('basic-ftp');

const app = express();
const PORT = 3131;

// Middleware
app.use(cors());
app.use(express.json());
// NOT: express.static en sonda olmalı, route'lardan sonra taşındı

// Klasör yolları
const UPLOAD_DIR = path.join(__dirname, 'yuklenecekler');
const SENT_DIR = path.join(__dirname, 'gönderilenler');

// Klasörleri oluştur
fs.ensureDirSync(UPLOAD_DIR);
fs.ensureDirSync(SENT_DIR);
fs.ensureDirSync(path.join(__dirname, 'temp'));

// FTP yapılandırması
const FTP_CONFIG = {
  host: 'ftp.streamtape.com',
  user: 'e3eddd5f523e3391352b',
  password: '4Av234M6QRtK30j',
  secure: false
};

// FTP bağlantısı ve yükleme fonksiyonu
// Export edilmeli (API endpoint'lerinde kullanılacak)
async function uploadFile(filePath) {
  const client = new Client();
  const fileName = path.basename(filePath);
  const fileStats = await fs.stat(filePath);
  const totalBytes = fileStats.size;
  
  let startTime = Date.now();
  let lastUpdateTime = Date.now();
  let lastUploadedBytes = 0;
  let progressInterval = null;
  let uploadPromise = null;
  
  try {
    await client.access(FTP_CONFIG);
    
    // İlerleme takibi - FTP sunucusundaki dosya boyutunu kontrol et
    progressInterval = setInterval(async () => {
      try {
        // FTP sunucusundaki dosya boyutunu kontrol et
        const checkClient = new Client();
        await checkClient.access(FTP_CONFIG);
        const files = await checkClient.list('/');
        await checkClient.close();
        
        const remoteFile = files.find(f => f.name === fileName);
        let uploadedBytes = 0;
        
        if (remoteFile && remoteFile.size) {
          uploadedBytes = parseInt(remoteFile.size) || 0;
        }
        
        const percentage = totalBytes > 0 ? Math.min(Math.round((uploadedBytes / totalBytes) * 100), 99) : 0;
        const now = Date.now();
        const timeDiff = (now - lastUpdateTime) / 1000; // saniye
        const bytesDiff = uploadedBytes - lastUploadedBytes;
        
        if (timeDiff >= 1 && bytesDiff > 0) {
          // Gerçek yükleme hızı
          const speed = bytesDiff / timeDiff; // bytes/saniye
          const remainingBytes = totalBytes - uploadedBytes;
          const estimatedSeconds = speed > 0 ? remainingBytes / speed : 0;
          
          if (io) {
            io.emit('upload-progress', {
              fileName: fileName,
              percentage: percentage,
              transferred: uploadedBytes,
              total: totalBytes,
              speed: speed,
              estimatedSeconds: estimatedSeconds
            });
          }
          
          lastUpdateTime = now;
          lastUploadedBytes = uploadedBytes;
        } else if (uploadedBytes > 0) {
          // İlerleme var ama hız hesaplanamıyorsa sadece yüzdeyi gönder
          const elapsedTime = (now - startTime) / 1000;
          const avgSpeed = uploadedBytes / elapsedTime;
          const remainingBytes = totalBytes - uploadedBytes;
          const estimatedSeconds = avgSpeed > 0 ? remainingBytes / avgSpeed : 0;
          
          if (io) {
            io.emit('upload-progress', {
              fileName: fileName,
              percentage: percentage,
              transferred: uploadedBytes,
              total: totalBytes,
              speed: avgSpeed,
              estimatedSeconds: estimatedSeconds
            });
          }
        }
      } catch (checkError) {
        // İlerleme kontrolü hatası - sessizce devam et
        console.log('Progress check error:', checkError.message);
      }
    }, 2000); // Her 2 saniyede bir kontrol et
    
    // Dosyayı yükle - direkt filePath kullan
    uploadPromise = client.uploadFrom(filePath, fileName);
    await uploadPromise;
    
    // İlerleme takibini durdur
    if (progressInterval) {
      clearInterval(progressInterval);
    }
    
    // %100 gönder
    if (io) {
      io.emit('upload-progress', {
        fileName: fileName,
        percentage: 100,
        transferred: totalBytes,
        total: totalBytes,
        speed: 0,
        estimatedSeconds: 0
      });
    }
    
    // Başarılı yükleme sonrası dosyayı gönderilenler klasörüne taşı
    const destPath = path.join(SENT_DIR, fileName);
    await fs.move(filePath, destPath, { overwrite: true });
    
    client.close();
    return { success: true, fileName };
  } catch (error) {
    if (progressInterval) {
      clearInterval(progressInterval);
    }
    try {
      client.close();
    } catch (e) {}
    return { success: false, fileName, error: error.message };
  }
}

// WebSocket için HTTP server
const http = require('http');
const server = http.createServer(app);
const { Server } = require('socket.io');
let io = null;

// Dosya izleme
let watcher = null;

function startWatching() {
  if (watcher) {
    watcher.close();
  }
  
  watcher = chokidar.watch(UPLOAD_DIR, {
    ignored: /(^|[\/\\])\../, // gizli dosyaları yoksay
    persistent: true,
    ignoreInitial: false
  });
  
  // Bekleyen yüklemeler (onay bekliyor)
  const pendingUploads = new Map(); // { fileName: { filePath, timeout } }
  
  watcher.on('add', async (filePath) => {
    // Sadece dosyaları işle (klasörleri değil)
    const stats = await fs.stat(filePath).catch(() => null);
    if (!stats || !stats.isFile()) return;
    
    // Video dosyalarını kontrol et
    const ext = path.extname(filePath).toLowerCase();
    const videoExts = ['.mp4', '.avi', '.mov', '.mkv', '.wmv', '.flv', '.webm', '.m4v'];
    
    if (videoExts.includes(ext)) {
      const fileName = path.basename(filePath);
      const fileSize = stats.size;
      console.log(`Yeni dosya tespit edildi: ${fileName} (${(fileSize / 1024 / 1024).toFixed(2)} MB)`);
      
      // Dosya tamamen yazıldı mı kontrol et (küçük bir gecikme)
      setTimeout(async () => {
        // Dosya hala var mı kontrol et
        const stillExists = await fs.pathExists(filePath).catch(() => false);
        if (!stillExists) {
          console.log(`Dosya silindi, yükleme iptal: ${fileName}`);
          return;
        }
        
        // Onay için pending listesine ekle (HTTP API ile erişilecek)
        console.log(`📤 Onay isteği oluşturuluyor: ${fileName} (${(fileSize / 1024 / 1024).toFixed(2)} MB)`);
        
        // Global pendingUploads Map'ini başlat
        if (!global.pendingUploads) {
          global.pendingUploads = new Map();
        }
        
        // 30 saniye timeout - onay gelmezse iptal et
        const timeout = setTimeout(() => {
          if (global.pendingUploads.has(fileName)) {
            console.log(`⏰ Yükleme onayı zaman aşımına uğradı: ${fileName}`);
            global.pendingUploads.delete(fileName);
          }
        }, 30000); // 30 saniye
        
        global.pendingUploads.set(fileName, { 
          filePath, 
          fileSize,
          timestamp: Date.now(),
          timeout 
        });
        
        console.log(`✅ Onay isteği eklendi: ${fileName} (Toplam bekleyen: ${global.pendingUploads.size})`);
        
        // Socket.io varsa bildir (local development için)
        if (io) {
          io.emit('upload-pending-approval', { 
            fileName, 
            filePath,
            fileSize,
            timestamp: Date.now()
          });
        }
      }, 2000);
    }
  });
}

// API Endpoints
app.get('/api/status', (req, res) => {
  res.json({ 
    watching: watcher !== null,
    uploadDir: UPLOAD_DIR,
    sentDir: SENT_DIR
  });
});

app.post('/api/upload', async (req, res) => {
  const { fileName } = req.body;
  const filePath = path.join(UPLOAD_DIR, fileName);
  
  if (!await fs.pathExists(filePath)) {
    return res.status(404).json({ success: false, error: 'Dosya bulunamadı' });
  }
  
  const result = await uploadFile(filePath);
  res.json(result);
  
  if (result.success && io) {
    io.emit('upload-result', result);
  }
});

app.get('/api/files', async (req, res) => {
  try {
    const files = await fs.readdir(UPLOAD_DIR);
    const fileList = [];
    
    for (const file of files) {
      const filePath = path.join(UPLOAD_DIR, file);
      const stats = await fs.stat(filePath);
      if (stats.isFile()) {
        fileList.push({
          name: file,
          size: stats.size,
          modified: stats.mtime
        });
      }
    }
    
    res.json(fileList);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/sent-files', async (req, res) => {
  try {
    const files = await fs.readdir(SENT_DIR);
    const fileList = [];
    
    for (const file of files) {
      const filePath = path.join(SENT_DIR, file);
      const stats = await fs.stat(filePath);
      if (stats.isFile()) {
        fileList.push({
          name: file,
          size: stats.size,
          modified: stats.mtime
        });
      }
    }
    
    res.json(fileList);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// FTP Dosya Yönetimi API'leri
app.get('/api/ftp/test', (req, res) => {
  res.json({ success: true, message: 'FTP endpoint çalışıyor' });
});

app.get('/api/ftp/list', async (req, res) => {
  console.log('FTP list endpoint called, path:', req.query.path);
  const client = new Client();
  const remotePath = req.query.path || '/';
  
  try {
    await client.access(FTP_CONFIG);
    const files = await client.list(remotePath);
    
    const fileList = files.map((file, index) => {
      try {
        // basic-ftp FileInfo formatını kontrol et
        let fileType = 'file';
        let fileSize = 0;
        let modifiedDate = null;
        let fileName = 'unknown';
        
        // Name kontrolü
        if (file.name) {
          fileName = String(file.name);
        } else if (file.rawName) {
          fileName = String(file.rawName);
        }
        
        // type kontrolü - basic-ftp'de type: 1 = file, 2 = directory
        if (file.type === 2) {
          fileType = 'directory';
        } else if (file.type === 1) {
          fileType = 'file';
        } else {
          // Alternatif kontrol yöntemleri
          if (file.isDirectory && typeof file.isDirectory === 'function') {
            fileType = file.isDirectory() ? 'directory' : 'file';
          } else if (file.isFile && typeof file.isFile === 'function') {
            fileType = file.isFile() ? 'file' : 'directory';
          } else {
            // Varsayılan olarak file kabul et
            fileType = 'file';
          }
        }
        
        // Size kontrolü
        if (file.size !== undefined && file.size !== null) {
          const parsedSize = parseInt(String(file.size));
          if (!isNaN(parsedSize)) {
            fileSize = parsedSize;
          }
        }
        
        // Modified date kontrolü
        if (file.modified) {
          try {
            // Date objesi ise
            if (file.modified instanceof Date) {
              if (!isNaN(file.modified.getTime())) {
                modifiedDate = file.modified.toISOString();
              }
            } 
            // String ise parse et
            else if (typeof file.modified === 'string') {
              const parsedDate = new Date(file.modified);
              if (!isNaN(parsedDate.getTime())) {
                modifiedDate = parsedDate.toISOString();
              }
            }
            // Number ise (timestamp)
            else if (typeof file.modified === 'number') {
              const parsedDate = new Date(file.modified);
              if (!isNaN(parsedDate.getTime())) {
                modifiedDate = parsedDate.toISOString();
              }
            }
          } catch (e) {
            // Tarih parse edilemezse null bırak
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
    }).filter(file => file.name !== 'error' || files.length === 0); // Hatalı dosyaları filtrele (ama boş liste değilse)
    
    client.close();
    res.json({ success: true, files: fileList, path: remotePath });
  } catch (error) {
    try {
      client.close();
    } catch (e) {}
    console.error('FTP list error:', error);
    res.status(500).json({ success: false, error: error.message || 'Bilinmeyen hata' });
  }
});

app.get('/api/ftp/download', async (req, res) => {
  const client = new Client();
  const remotePath = req.query.path;
  
  if (!remotePath) {
    return res.status(400).json({ success: false, error: 'Dosya yolu gerekli' });
  }
  
  try {
    await client.access(FTP_CONFIG);
    
    // Geçici dosya oluştur
    const tempPath = path.join(__dirname, 'temp', path.basename(remotePath));
    await fs.ensureDir(path.dirname(tempPath));
    
    await client.downloadTo(tempPath, remotePath);
    client.close();
    
    // Dosyayı gönder
    res.download(tempPath, path.basename(remotePath), (err) => {
      if (err) {
        console.error('Download error:', err);
      }
      // Geçici dosyayı sil
      fs.remove(tempPath).catch(() => {});
    });
  } catch (error) {
    try {
      client.close();
    } catch (e) {}
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/ftp/move', async (req, res) => {
  const client = new Client();
  const { from, to } = req.body;
  
  if (!from || !to) {
    return res.status(400).json({ success: false, error: 'Kaynak ve hedef yolu gerekli' });
  }
  
  try {
    await client.access(FTP_CONFIG);
    await client.rename(from, to);
    client.close();
    res.json({ success: true });
  } catch (error) {
    try {
      client.close();
    } catch (e) {}
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/ftp/copy', async (req, res) => {
  const client = new Client();
  const { from, to } = req.body;
  
  if (!from || !to) {
    return res.status(400).json({ success: false, error: 'Kaynak ve hedef yolu gerekli' });
  }
  
  try {
    await client.access(FTP_CONFIG);
    
    // Geçici dosya oluştur
    const tempPath = path.join(__dirname, 'temp', path.basename(from));
    await fs.ensureDir(path.dirname(tempPath));
    
    // İndir
    await client.downloadTo(tempPath, from);
    
    // Yükle
    await client.uploadFrom(tempPath, to);
    
    // Geçici dosyayı sil
    await fs.remove(tempPath);
    
    client.close();
    res.json({ success: true });
  } catch (error) {
    try {
      client.close();
    } catch (e) {}
    await fs.remove(tempPath).catch(() => {});
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete('/api/ftp/delete', async (req, res) => {
  const client = new Client();
  const remotePath = req.query.path;
  
  if (!remotePath) {
    return res.status(400).json({ success: false, error: 'Dosya yolu gerekli' });
  }
  
  try {
    await client.access(FTP_CONFIG);
    await client.remove(remotePath);
    client.close();
    res.json({ success: true });
  } catch (error) {
    try {
      client.close();
    } catch (e) {}
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/ftp/read', async (req, res) => {
  const client = new Client();
  const remotePath = req.query.path;
  
  if (!remotePath) {
    return res.status(400).json({ success: false, error: 'Dosya yolu gerekli' });
  }
  
  try {
    await client.access(FTP_CONFIG);
    
    // Geçici dosya oluştur
    const tempPath = path.join(__dirname, 'temp', path.basename(remotePath));
    await fs.ensureDir(path.dirname(tempPath));
    
    await client.downloadTo(tempPath, remotePath);
    const content = await fs.readFile(tempPath, 'utf8');
    
    await fs.remove(tempPath);
    client.close();
    
    res.json({ success: true, content });
  } catch (error) {
    try {
      client.close();
    } catch (e) {}
    await fs.remove(tempPath).catch(() => {});
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/ftp/write', async (req, res) => {
  const client = new Client();
  const { path: remotePath, content } = req.body;
  
  if (!remotePath || content === undefined) {
    return res.status(400).json({ success: false, error: 'Dosya yolu ve içerik gerekli' });
  }
  
  try {
    await client.access(FTP_CONFIG);
    
    // Geçici dosya oluştur
    const tempPath = path.join(__dirname, 'temp', path.basename(remotePath));
    await fs.ensureDir(path.dirname(tempPath));
    
    await fs.writeFile(tempPath, content, 'utf8');
    await client.uploadFrom(tempPath, remotePath);
    
    await fs.remove(tempPath);
    client.close();
    
    res.json({ success: true });
  } catch (error) {
    try {
      client.close();
    } catch (e) {}
    await fs.remove(tempPath).catch(() => {});
    res.status(500).json({ success: false, error: error.message });
  }
});

// FTP dosya yükleme endpoint'i (multipart/form-data)
let multer, upload;
try {
  multer = require('multer');
  upload = multer({ dest: path.join(__dirname, 'temp') });
} catch (e) {
  console.warn('⚠️ Multer yüklenemedi, dosya yükleme özelliği çalışmayabilir');
}

app.post('/api/ftp/upload', (req, res, next) => {
  if (!upload) {
    return res.status(500).json({ success: false, error: 'Multer yüklenemedi' });
  }
  upload.single('file')(req, res, next);
}, async (req, res) => {
  const client = new Client();
  const remotePath = req.body.path || `/${req.file.originalname}`;
  const filePath = req.file.path;
  
  try {
    await client.access(FTP_CONFIG);
    await client.uploadFrom(filePath, remotePath);
    
    // Geçici dosyayı sil
    await fs.remove(filePath);
    client.close();
    
    res.json({ success: true, message: 'Dosya yüklendi' });
  } catch (error) {
    try {
      client.close();
    } catch (e) {}
    await fs.remove(filePath).catch(() => {});
    res.status(500).json({ success: false, error: error.message });
  }
});

// Static dosya servisi - EN SONDA olmalı (route'lardan sonra)
app.use(express.static('public'));

// Socket.io bağlantıları
io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Global pendingUploads Map (onay bekleyen yüklemeler)
if (!global.pendingUploads) {
  global.pendingUploads = new Map();
}

io.on('connection', (socket) => {
  console.log('Client bağlandı');
  
  // Onay alındığında yüklemeyi başlat
  socket.on('approve-upload', async (data) => {
    const { fileName } = data;
    const pending = global.pendingUploads.get(fileName);
    
    if (!pending) {
      socket.emit('upload-error', { fileName, error: 'Bekleyen yükleme bulunamadı' });
      return;
    }
    
    // Timeout'u temizle
    clearTimeout(pending.timeout);
    global.pendingUploads.delete(fileName);
    
    const { filePath } = pending;
    
    // Yükleme başladığını bildir
    io.emit('upload-start', { fileName });
    
    try {
      const result = await uploadFile(filePath);
      // WebSocket ile frontend'e bildir
      io.emit('upload-result', result);
    } catch (error) {
      io.emit('upload-result', {
        success: false,
        fileName: fileName,
        error: error.message
      });
    }
  });
  
  socket.on('reject-upload', (data) => {
    const { fileName } = data;
    const pending = global.pendingUploads.get(fileName);
    
    if (pending) {
      clearTimeout(pending.timeout);
      global.pendingUploads.delete(fileName);
      io.emit('upload-cancelled', { fileName, reason: 'Kullanıcı tarafından reddedildi' });
    }
  });
  
  socket.on('disconnect', () => {
    console.log('Client ayrıldı');
  });
});

// Sunucuyu başlat (sadece local development için)
if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`Sunucu http://localhost:${PORT} adresinde çalışıyor`);
    startWatching();
  });
}

// uploadFile fonksiyonunu export et (API endpoint'lerinde kullanılacak)
module.exports.uploadFile = uploadFile;

// Vercel için export
module.exports = app;

