# 🚀 Vercel Environment Variables - Hızlı Kurulum

## ✅ Backend Deploy Edildi!

**Backend URL:** `https://server-pol4jdmuv-ras-projects-6ebe5a01.vercel.app`

## 📋 Yapılacaklar

### 1. Frontend Project (porn-ras-xxx-project) - Environment Variables

**Vercel Dashboard → porn-ras-xxx-project → Settings → Environment Variables**

Aşağıdaki environment variables'ları ekleyin:

| Key | Value | Environment |
|-----|-------|-------------|
| `REACT_APP_API_BASE_URL` | `https://server-pol4jdmuv-ras-projects-6ebe5a01.vercel.app` | ✅ Production, ✅ Preview, ✅ Development |
| `REACT_APP_SUPABASE_URL` | `https://xgyjhofakpatrqgvleze.supabase.co` | ✅ Production, ✅ Preview, ✅ Development |
| `REACT_APP_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhneWpob2Zha3BhdHJxZ3ZsZXplIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE0MjA2NDEsImV4cCI6MjA3Njk5NjY0MX0.RB2QQkjtXaM-GaH0HXP_B14BIDm0Y-MvlvDpOt7V1sQ` | ✅ Production, ✅ Preview, ✅ Development |

### 2. Backend Project (server) - Environment Variables

**Vercel Dashboard → server → Settings → Environment Variables**

Aşağıdaki environment variables'ları ekleyin:

| Key | Value | Environment |
|-----|-------|-------------|
| `PORT` | `5000` | ✅ Production, ✅ Preview, ✅ Development |
| `PROTON_SMTP_HOST` | `smtp.protonmail.ch` | ✅ Production, ✅ Preview, ✅ Development |
| `PROTON_SMTP_PORT` | `587` | ✅ Production, ✅ Preview, ✅ Development |
| `PROTON_SMTP_SECURE` | `false` | ✅ Production, ✅ Preview, ✅ Development |
| `PROTON_SMTP_USERNAME` | `info@pornras.com` | ✅ Production, ✅ Preview, ✅ Development |
| `PROTON_SMTP_PASSWORD` | `LED4C43RUWSPLWCG` | ✅ Production, ✅ Preview, ✅ Development |
| `PROTON_FROM_EMAIL` | `info@pornras.com` | ✅ Production, ✅ Preview, ✅ Development |
| `PROTON_FROM_NAME` | `PORNRAS` | ✅ Production, ✅ Preview, ✅ Development |
| `BLUESKY_HANDLE` | `rasmovies.bsky.social` | ✅ Production, ✅ Preview, ✅ Development |
| `BLUESKY_PASSWORD` | `your-app-password-here` | ✅ Production, ✅ Preview, ✅ Development |
| `CORS_ORIGIN` | `https://www.pornras.com` | ✅ Production, ✅ Preview, ✅ Development |

### 3. Frontend'i Yeniden Deploy Edin

Environment variables'ları ekledikten sonra:

1. **Vercel Dashboard → porn-ras-xxx-project → Deployments**
2. **En son deployment'ın yanındaki "..." menüsüne tıklayın**
3. **"Redeploy" butonuna tıklayın**
4. **"Use existing Build Cache" seçeneğini kapatın** (environment variables'lar için)
5. **"Redeploy" butonuna tıklayın**

## 🔍 Test Edin

1. **Frontend'i açın:** https://www.pornras.com
2. **Browser Console'u açın** (F12)
3. **Yeni bir kullanıcı kaydedin**
4. **Console'da hata olmamalı:**
   - ✅ `localhost:5000` hatası olmamalı
   - ✅ Supabase warning'i olmamalı
   - ✅ Backend'e istek başarılı olmalı

## ✅ Başarılı Kontrol

Kurulum başarılı olduğunda:
- ✅ Frontend production'da backend URL'sini kullanacak
- ✅ Supabase credentials environment variables'dan gelecek
- ✅ Email verification çalışacak
- ✅ Console'da hata olmayacak

## 🔧 Sorun Giderme

### Hata: "Backend URL is not configured"

**Çözüm:**
- Vercel Dashboard'da `REACT_APP_API_BASE_URL` environment variable'ını kontrol edin
- Backend URL'sinin doğru olduğundan emin olun: `https://server-pol4jdmuv-ras-projects-6ebe5a01.vercel.app`
- Frontend'i yeniden deploy edin

### Hata: "500 Internal Server Error"

**Çözüm:**
- Backend environment variables'larını kontrol edin
- Backend loglarını kontrol edin: `vercel logs server`
- Proton Mail SMTP credentials'larını kontrol edin

### Hata: "Supabase credentials hardcoded"

**Çözüm:**
- Vercel Dashboard'da `REACT_APP_SUPABASE_URL` ve `REACT_APP_SUPABASE_ANON_KEY` environment variables'larını kontrol edin
- Frontend'i yeniden deploy edin

## 📝 Notlar

- **Environment Variables:** Vercel'de environment variables'ları ekledikten sonra frontend'i yeniden deploy etmeniz gerekir
- **Backend URL:** Backend URL'si: `https://server-pol4jdmuv-ras-projects-6ebe5a01.vercel.app`
- **CORS:** Backend'de CORS ayarları `https://www.pornras.com` olarak ayarlı

## 🎉 Başarılı Kurulum

Kurulum başarılı olduğunda:
- ✅ Frontend production'da backend URL'sini kullanacak
- ✅ Supabase credentials environment variables'dan gelecek
- ✅ Email verification çalışacak
- ✅ Console'da hata olmayacak

**Hepsi bu kadar!** 🎉

