# Vercel Backend Deployment Notları

## Mevcut Durum

✅ **Backend zaten deploy edilmiş!**

Vercel'de backend, `api/index.js` dosyası üzerinden serverless function olarak deploy edilmiş durumda.

## Vercel Deployment Yapısı

1. **API Routes**: `/api/*` endpoint'leri → `api/index.js` → `server.js`
2. **Static Files**: `public/*` dosyaları direkt serve ediliyor
3. **Project**: `ftp` (ayrı bir proje olarak oluşturulmuş)

## ⚠️ ÖNEMLİ SINIRLAMALAR

Vercel **serverless functions** kullandığı için:

### ❌ Çalışmayan Özellikler:
- **Dosya izleme (chokidar)**: Serverless functions sürekli çalışmaz
- **Otomatik yükleme**: Dosya izleme olmadan çalışmaz
- **Socket.io real-time**: Sürekli bağlantı gerektirir, serverless'te sınırlı
- **Background processes**: Sürekli çalışan process'ler yok

### ✅ Çalışan Özellikler:
- **API endpoint'leri**: `/api/ftp/list`, `/api/ftp/download`, vb.
- **FTP dosya yöneticisi**: Manuel kullanım için çalışır
- **Static dosyalar**: Frontend dosyaları çalışır

## Mevcut Repository ile Entegrasyon

Eğer `Porn-Ras-XXX-Project` repository'sine bağlı bir Vercel projesi varsa:

1. Vercel dashboard'a gidin: https://vercel.com
2. `Porn-Ras-XXX-Project` projesini bulun
3. Settings → Git → Repository bağlantısını kontrol edin
4. Yeni deployment otomatik olarak tetiklenmiş olabilir

## Önerilen Çözüm

Bu uygulama için **sürekli çalışan bir sunucu** gerektiği için:

### Seçenek 1: Railway.app (Önerilen)
```bash
railway login
railway init
railway up
```

### Seçenek 2: Render.com
- Web Service olarak deploy edin
- Start Command: `npm start`
- Environment: Node.js

### Seçenek 3: Vercel'de Sadece API
- Vercel'de sadece API endpoint'leri çalışır
- Dosya izleme için local sunucu veya başka bir platform kullanın

## Vercel Proje Ayarları

Mevcut Vercel projesi (`ftp`):
- Project ID: `prj_UHsGbabeW0LVPlfZe5GovjQSDQIc`
- URL: https://ftp-1uaqap98p-ras-projects-6ebe5a01.vercel.app

Eğer `Porn-Ras-XXX-Project` repository'sine bağlı başka bir Vercel projesi varsa, orada da otomatik deployment yapılmış olabilir.

