# Vercel ve GitHub Setup Rehberi

## Önemli Not: Proton Mail Bridge Vercel'de Çalışmaz!

**Neden?**
- Vercel serverless ortamıdır (local servis yoktur)
- Proton Mail Bridge local bir servistir (127.0.0.1)
- Serverless function'lar geçici ve stateless çalışır

## Mevcut Durum

✅ **Backend VPS'te çalışıyor:**
- URL: `http://72.61.139.145:5000`
- PM2 ile yönetiliyor
- Proton Mail Bridge kullanıyor
- Email servisi aktif

✅ **Vercel Config var:**
- `server/vercel.json` mevcut
- Serverless functions yapılandırılmış

## Önerilen Çözüm: Backend Sadece VPS'te

### 1. Vercel Setup

**Backend Vercel'de deploy edilmemeli!**

- Vercel'de sadece frontend deploy edin
- Backend için VPS URL'ini kullanın: `http://72.61.139.145:5000`
- Vercel environment variables'a backend SMTP bilgilerini eklemeyin

**Frontend'de API URL:**
```javascript
// Development
const API_BASE_URL = 'http://72.61.139.145:5000'

// Production (eğer domain varsa)
const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://www.pornras.com/api'
```

### 2. GitHub Setup

**Yapılacaklar:**

1. ✅ `env.example` güncellendi (template olarak)
2. ⚠️ **ASLA gerçek `.env` dosyasını commit etmeyin!**
3. ⚠️ **ASLA gerçek SMTP şifrelerini commit etmeyin!**

**`.gitignore` dosyasında olmalı:**
```
# Environment variables
.env
.env.local
.env.production
server/.env
```

### 3. VPS Setup (Zaten Hazır)

✅ Backend VPS'te çalışıyor
✅ `.env` dosyası VPS'te mevcut
✅ Proton Mail Bridge çalışıyor
✅ Email servisi aktif

## Yapılacaklar Checklist

### Vercel
- [ ] Vercel'de backend deploy'unu kontrol et
- [ ] Eğer backend deploy'u varsa devre dışı bırak
- [ ] Sadece frontend'i deploy et
- [ ] Frontend'de API URL'ini VPS backend'e yönlendir

### GitHub
- [x] `env.example` güncellendi
- [ ] `.gitignore` kontrol et (`.env` dosyası ignore edilmeli)
- [ ] Değişiklikleri commit et
- [ ] ⚠️ Gerçek şifrelerin commit edilmediğini kontrol et

### Frontend
- [ ] API base URL'i VPS backend'e yönlendir
- [ ] Environment variable ekle: `REACT_APP_API_URL`

## Email Servisi

Email servisi **sadece VPS'teki backend** üzerinden çalışacak:

```
Frontend (Vercel) -> VPS Backend (http://72.61.139.145:5000) -> Proton Mail Bridge (127.0.0.1:1025)
```

## Alternatif Çözümler

### Seçenek 2: Hybrid Setup (Önerilmez)
- VPS: Email servisi için
- Vercel: Diğer API'ler için
- ⚠️ Karmaşık yapı, iki farklı backend endpoint

### Seçenek 3: Farklı SMTP Provider (Önerilmez)
- Vercel'de SendGrid/Mailgun kullan
- VPS'te Proton Mail Bridge kullan
- ⚠️ İki farklı email servisi, karmaşık yapı

## Özet

**✅ Yapıldı:**
- VPS'te backend çalışıyor
- Proton Mail Bridge entegrasyonu tamamlandı
- Email servisi aktif
- `env.example` güncellendi

**📋 Yapılacak:**
1. Vercel'de backend deploy'unu kontrol et/devre dışı bırak
2. Frontend'de API URL'ini VPS backend'e yönlendir
3. GitHub'a commit yap (sadece template'ler)

**⚠️ Dikkat:**
- Gerçek `.env` dosyasını ASLA Git'e commit etmeyin!
- SMTP şifreleri sadece VPS'te olmalı!

