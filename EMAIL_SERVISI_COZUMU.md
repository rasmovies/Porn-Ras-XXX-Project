# Email Servisi Çözümü (Vercel ile)

## 🎯 Durum

- ✅ Backend Vercel'de çalışıyor (Serverless Functions)
- ✅ Proton Mail SMTP çalışıyor
- ✅ Email servisi çalışıyor
- ✅ Frontend Vercel'de çalışıyor

## 🔍 Sorun

Backend ve frontend Vercel'de çalışıyor. Frontend'in backend'e erişmesi için `REACT_APP_API_BASE_URL` environment variable'ı gerekli.

## 💡 Çözüm: Vercel Deployment

### Backend (Vercel Serverless Functions)

Backend `server/` klasöründe Vercel Serverless Functions olarak deploy ediliyor.

**Vercel Configuration:**
- `server/vercel.json` dosyası mevcut
- Backend endpoint'leri `/api/*` path'lerinde çalışıyor
- CORS ayarları `server/server.js` içinde yapılandırılmış

### Frontend (Vercel Static Site)

Frontend `client/` klasöründe Vercel Static Site olarak deploy ediliyor.

**Vercel Configuration:**
- `client/vercel.json` dosyası mevcut
- Build command: `CI=false npm run build`
- Output directory: `build`

### Environment Variables

**Backend (Vercel):**
- `PROTON_SMTP_HOST` - Proton Mail SMTP host
- `PROTON_SMTP_PORT` - Proton Mail SMTP port
- `PROTON_SMTP_SECURE` - Proton Mail SMTP secure (true/false)
- `PROTON_SMTP_USERNAME` - Proton Mail SMTP username
- `PROTON_SMTP_PASSWORD` - Proton Mail SMTP password
- `PROTON_FROM_EMAIL` - Proton Mail from email
- `PROTON_FROM_NAME` - Proton Mail from name
- `BLUESKY_HANDLE` - Bluesky handle
- `BLUESKY_PASSWORD` - Bluesky app password

**Frontend (Vercel):**
- `REACT_APP_API_BASE_URL` - Backend URL (örnek: `https://your-backend.vercel.app`)

## 📝 Kurulum Adımları

### 1. Backend'i Vercel'e Deploy Et

```bash
cd server
vercel --prod
```

Veya Vercel Dashboard'dan:
1. New Project → Import Git Repository
2. Root Directory: `server`
3. Framework Preset: Other
4. Environment Variables ekle
5. Deploy

### 2. Frontend'i Vercel'e Deploy Et

```bash
cd client
vercel --prod
```

Veya Vercel Dashboard'dan:
1. New Project → Import Git Repository
2. Root Directory: `client`
3. Framework Preset: Create React App
4. Environment Variables ekle (özellikle `REACT_APP_API_BASE_URL`)
5. Deploy

### 3. Environment Variables Ayarla

**Backend Vercel Dashboard:**
- Settings → Environment Variables
- Tüm backend environment variable'ları ekle

**Frontend Vercel Dashboard:**
- Settings → Environment Variables
- `REACT_APP_API_BASE_URL` = Backend Vercel URL'si

### 4. CORS Ayarları

Backend'de CORS ayarları `server/server.js` içinde yapılandırılmış:
- Origin: `https://www.pornras.com`
- Methods: `GET, POST, OPTIONS`
- Headers: `Content-Type, Authorization`

## ✅ Sonuç

**Her şey Vercel'de çalışıyor!**

- ✅ Backend Vercel Serverless Functions olarak deploy edildi
- ✅ Frontend Vercel Static Site olarak deploy edildi
- ✅ Email servisi Proton Mail SMTP ile çalışıyor
- ✅ Bluesky API entegrasyonu çalışıyor
- ✅ CORS ayarları yapılandırıldı

**Tüm servisler Vercel'de!** 🎉



