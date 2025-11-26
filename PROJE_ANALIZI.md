# 📊 PORNRAS / AdultTube Proje Analizi

## 🎯 Proje Genel Bakış

**PORNRAS** (AdultTube) - Video paylaşım ve streaming platformu. Full-stack web uygulaması olarak geliştirilmiş modern bir video hosting platformu.

**Domain:** `pornras.com`  
**Backend API:** `api.pornras.com`  
**Frontend:** Vercel üzerinde deploy edilmiş

---

## 🏗️ Teknoloji Stack

### Frontend
- **Framework:** React 19.2.0 (TypeScript)
- **UI Library:** Material-UI (MUI) v7.3.4
- **Routing:** React Router DOM v7.9.4
- **Animasyonlar:** Framer Motion v12.23.24, AnimeJS
- **Video Player:** Video.js v8.23.4
- **State Management:** React Context API
- **Authentication:** Supabase Auth + Google OAuth
- **HTTP Client:** Axios
- **Notifications:** React Hot Toast

### Backend
- **Runtime:** Node.js
- **Framework:** Express.js v5.1.0
- **Database:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth
- **Email Service:** Resend API
- **Bluesky Integration:** @atproto/api
- **Security:** Helmet, CORS, Express Rate Limit
- **Validation:** Express Validator

### Infrastructure
- **Frontend Hosting:** Vercel (Serverless)
- **Backend Hosting:** VPS (Hostinger) - 72.61.139.145
- **Database:** Supabase Cloud
- **Email Provider:** Resend (info@pornras.com)
- **Reverse Proxy:** Nginx
- **SSL:** Let's Encrypt
- **Process Manager:** PM2

---

## 📁 Proje Yapısı

```
adulttube/
├── client/                 # React frontend uygulaması
│   ├── src/
│   │   ├── components/     # React bileşenleri
│   │   ├── pages/          # Sayfa bileşenleri
│   │   ├── services/       # API servisleri
│   │   ├── lib/            # Supabase client
│   │   └── styles/         # CSS dosyaları
│   └── build/              # Production build
│
├── server/                 # Express.js backend
│   ├── api/                # API endpoint'leri
│   ├── routes/             # Route tanımları
│   ├── services/           # Business logic
│   └── emailTemplates/     # Email şablonları
│
├── api/                    # Vercel serverless functions (api klasörünün kopyası)
├── scripts/                # SQL migration scriptleri
├── emailTemplates/         # Global email şablonları
└── lib/                    # Shared utilities
```

---

## 🗄️ Veritabanı Yapısı (Supabase)

### Ana Tablolar

1. **videos**
   - Video bilgileri, thumbnail, URL
   - Views, likes, dislikes sayacı
   - Category, model, channel ilişkileri
   - Slug-based URL routing

2. **categories**
   - Kategori isimleri ve thumbnail'ları
   - Click count tracking

3. **models**
   - Model isimleri ve görselleri

4. **channels**
   - Kanal bilgileri, banner, thumbnail
   - Subscriber count

5. **comments**
   - Video yorumları
   - Author, content, likes/dislikes

6. **profiles**
   - Kullanıcı profil bilgileri
   - Avatar, banner images
   - Subscriber count, videos watched

7. **verification_codes**
   - 6 haneli email doğrulama kodları
   - Expiry time tracking

8. **subscriptions**
   - User-model subscriptions
   - User-channel subscriptions

9. **notifications**
   - Kullanıcı bildirimleri
   - Ban, message, comment, like, system, video tipi

10. **ban_users**
    - Kullanıcı ban sistemi
    - 5 gün, 10 gün, 1 ay, 3 ay, 6 ay, lifetime

11. **settings**
    - Uygulama ayarları (key-value pairs)

12. **background_images**
    - Ana sayfa background görselleri (base64 encoded)

13. **user_posts, user_gifs, user_playlists**
    - Kullanıcı içerik özellikleri

---

## ✨ Ana Özellikler

### 1. Video Yönetimi
- ✅ Video upload ve yayınlama
- ✅ Streamtape URL entegrasyonu
- ✅ Thumbnail upload
- ✅ Video kategorileri
- ✅ Model ve kanal etiketleme
- ✅ Video slug'ları (SEO-friendly URLs)
- ✅ Views, likes, dislikes sayacı

### 2. Kullanıcı Sistemi
- ✅ Email ile kayıt/giriş
- ✅ Google OAuth entegrasyonu
- ✅ 6 haneli email doğrulama kodu
- ✅ Yaş doğrulama sistemi
- ✅ Kullanıcı profilleri
- ✅ Avatar ve banner yükleme
- ✅ Subscriber sistemi

### 3. İçerik Keşfi
- ✅ Ana sayfa video listesi
- ✅ Kategori sayfaları
- ✅ Model profilleri
- ✅ Kanal profilleri
- ✅ Video arama
- ✅ Featured ve trending videolar

### 4. Video Oynatıcı
- ✅ Video.js player entegrasyonu
- ✅ Streamtape streaming
- ✅ Yorum sistemi
- ✅ Like/dislike
- ✅ Paylaşım özellikleri
- ✅ İlgili videolar

### 5. Admin Paneli
- ✅ Admin kullanıcı yetkilendirmesi
- ✅ Video yönetimi
- ✅ Kullanıcı ban sistemi
- ✅ Bildirim yönetimi
- ✅ Ayarlar yönetimi
- ✅ Background image yönetimi

### 6. Email Sistemi
- ✅ Email doğrulama
- ✅ Welcome email
- ✅ Invite email
- ✅ Marketing email
- ✅ Resend API entegrasyonu

### 7. Sosyal Medya Entegrasyonu
- ✅ Bluesky otomatik paylaşım
- ✅ Video yayınlandığında otomatik post
- ✅ Thumbnail ile paylaşım

### 8. Güvenlik
- ✅ Age verification modal
- ✅ Protected routes
- ✅ CORS yapılandırması
- ✅ Rate limiting
- ✅ Helmet security headers
- ✅ Supabase Row Level Security (RLS)

---

## 🔧 Konfigürasyon ve Deployment

### Environment Variables

**Frontend (Client):**
- `REACT_APP_SUPABASE_URL`
- `REACT_APP_SUPABASE_ANON_KEY`
- `REACT_APP_GOOGLE_CLIENT_ID`
- `REACT_APP_API_BASE_URL`

**Backend (Server):**
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`
- `RESEND_FROM_NAME`
- `BLUESKY_HANDLE`
- `BLUESKY_PASSWORD`
- `PORT`

### Deployment Durumu

✅ **Frontend:** Vercel'de deploy edilmiş
- Serverless functions kullanıyor
- Automatic deployments (GitHub entegrasyonu)

✅ **Backend:** VPS'te çalışıyor
- PM2 ile process management
- Nginx reverse proxy
- SSL sertifikası (Let's Encrypt)
- Port 5000'de çalışıyor

✅ **Database:** Supabase Cloud
- PostgreSQL
- Real-time subscriptions desteği
- Row Level Security aktif

---

## 📝 Önemli Dosyalar

### Frontend
- `client/src/App.tsx` - Ana uygulama yapısı ve routing
- `client/src/pages/Home.tsx` - Ana sayfa
- `client/src/pages/VideoPlayer.tsx` - Video oynatıcı
- `client/src/pages/Upload.tsx` - Video upload sayfası
- `client/src/lib/supabase.ts` - Supabase client ve type definitions
- `client/src/services/database.ts` - Database servis fonksiyonları

### Backend
- `server/server.js` - Express server yapılandırması
- `server/services/emailService.js` - Email servisi (Resend)
- `server/services/blueskyService.js` - Bluesky entegrasyonu
- `server/api/auth/*` - Authentication endpoint'leri
- `server/api/email/*` - Email endpoint'leri

### Database
- `scripts/sql/database-schema.sql` - Ana veritabanı şeması
- `scripts/sql/*.sql` - Migration scriptleri

---

## 🚨 Bilinen Sorunlar ve Notlar

### 1. Hardcoded Credentials
⚠️ **ÖNEMLİ:** `client/src/lib/supabase.ts` ve `server/lib/supabase.js` dosyalarında hardcoded Supabase credentials var. Production'da environment variable kullanılmalı.

### 2. Eski Seed.js Dosyası
⚠️ `seed.js` dosyası MongoDB için yazılmış ama proje artık Supabase kullanıyor. Bu dosya kullanılmıyor ve silinebilir.

### 3. Çok Fazla PowerShell Script
📁 Proje kök dizininde 100+ PowerShell script var (`.ps1` dosyaları). Bunlar VPS setup ve troubleshooting için kullanılmış. Temizlenebilir veya `scripts/vps/` klasörüne taşınabilir.

### 4. API Klasörü Duplikasyonu
⚠️ `api/` klasörü `server/api/` klasörünün kopyası gibi görünüyor. Vercel serverless functions için kullanılıyor olabilir. Yapı netleştirilmeli.

### 5. Email Servisi
✅ Resend API kullanılıyor ve doğru yapılandırılmış. `info@pornras.com` adresinden gönderim yapılıyor.

---

## 📊 Proje İstatistikleri

- **Frontend Sayfa Sayısı:** ~20 sayfa
- **Backend API Endpoint:** ~10 endpoint
- **Database Tabloları:** ~13 tablo
- **PowerShell Scriptleri:** 100+ dosya
- **SQL Migration Scriptleri:** ~15 dosya

---

## 🎯 Öneriler

### Kısa Vadeli (Hemen Yapılabilir)
1. ✅ Hardcoded credentials'ları environment variable'lara taşı
2. ✅ `seed.js` dosyasını sil (kullanılmıyor)
3. ✅ PowerShell scriptlerini `scripts/vps/` klasörüne organize et
4. ✅ README.md dosyası ekle

### Orta Vadeli (Yakında Yapılmalı)
1. ⚠️ Error handling ve logging sistemi geliştir
2. ⚠️ Unit testler ekle (Jest, React Testing Library)
3. ⚠️ API documentation (Swagger/OpenAPI)
4. ⚠️ CI/CD pipeline iyileştir
5. ⚠️ Performance optimization (lazy loading, code splitting)

### Uzun Vadeli (Gelecek)
1. 🔮 Video transcoding sistemi
2. 🔮 CDN entegrasyonu
3. 🔮 Analytics dashboard
4. 🔮 Real-time notifications (WebSocket)
5. 🔮 Mobile app (React Native)

---

## 🔐 Güvenlik Kontrol Listesi

- ✅ CORS yapılandırması var
- ✅ Helmet security headers aktif
- ✅ Rate limiting implementasyonu
- ✅ Supabase RLS politikaları
- ⚠️ Hardcoded credentials kaldırılmalı
- ⚠️ Input validation iyileştirilmeli
- ⚠️ SQL injection koruması (Supabase ORM kullanılıyor, güvenli)

---

## 📚 Dokümantasyon

Projede çok sayıda Türkçe dokümantasyon var:
- `DEPLOYMENT_CHECKLIST.md` - Deployment adımları
- `VPS_SETUP_GUIDE.md` - VPS kurulum rehberi
- `VERCEL-SETUP-ODET.md` - Vercel setup
- `RESEND_SETUP.md` - Email servisi kurulumu
- Ve daha fazlası...

---

## 🎉 Sonuç

Bu proje, modern web teknolojileri kullanılarak geliştirilmiş profesyonel bir video platformu. Supabase, React, ve Express.js kullanarak tam fonksiyonel bir full-stack uygulama oluşturulmuş. Email doğrulama, Bluesky entegrasyonu, ve admin paneli gibi gelişmiş özellikler mevcut.

**Genel Durum:** ✅ Production'a hazır (küçük iyileştirmelerle)

**Ana Güçlü Yönler:**
- Modern teknoloji stack
- İyi organize edilmiş kod yapısı
- Comprehensive feature set
- Güvenlik önlemleri

**İyileştirme Alanları:**
- Hardcoded credentials
- Test coverage
- Error handling
- Dokümantasyon organizasyonu

---

*Analiz Tarihi: 2024*  
*Proje: PORNRAS / AdultTube*

