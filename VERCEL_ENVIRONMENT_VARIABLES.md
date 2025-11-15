# Vercel Environment Variables Kurulum Rehberi

## 🔴 Sorunlar

1. **Frontend production'da `localhost:5000` kullanıyor** - Backend URL'si ayarlanmamış
2. **Supabase credentials hardcoded** - Production'da environment variables ayarlanmamış
3. **Backend 500 hatası** - Email verification endpoint'inde hata

## ✅ Çözüm

### 1. Backend'i Vercel'e Deploy Edin

```bash
cd server
vercel --prod --yes
```

Backend deploy edildikten sonra backend URL'sini not edin:
- Örnek: `https://server-8ild1ucus-ras-projects-6ebe5a01.vercel.app`

### 2. Vercel Dashboard'da Environment Variables Ayarlayın

#### Frontend Project (porn-ras-xxx-project)

**Vercel Dashboard → Project → Settings → Environment Variables**

Aşağıdaki environment variables'ları ekleyin:

```env
# Backend URL
REACT_APP_API_BASE_URL=https://server-8ild1ucus-ras-projects-6ebe5a01.vercel.app

# Supabase Credentials
REACT_APP_SUPABASE_URL=https://xgyjhofakpatrqgvleze.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhneWpob2Zha3BhdHJxZ3ZsZXplIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE0MjA2NDEsImV4cCI6MjA3Njk5NjY0MX0.RB2QQkjtXaM-GaH0HXP_B14BIDm0Y-MvlvDpOt7V1sQ
```

**Önemli:**
- `REACT_APP_API_BASE_URL`: Backend URL'sini buraya ekleyin (Vercel'den aldığınız backend URL'si)
- `REACT_APP_SUPABASE_URL`: Supabase project URL'si
- `REACT_APP_SUPABASE_ANON_KEY`: Supabase anon key

#### Backend Project (server)

**Vercel Dashboard → Project → Settings → Environment Variables**

Aşağıdaki environment variables'ları ekleyin:

```env
# Server Port
PORT=5000

# Proton Mail SMTP
PROTON_SMTP_HOST=smtp.protonmail.ch
PROTON_SMTP_PORT=587
PROTON_SMTP_SECURE=false
PROTON_SMTP_USERNAME=info@pornras.com
PROTON_SMTP_PASSWORD=LED4C43RUWSPLWCG
PROTON_FROM_EMAIL=info@pornras.com
PROTON_FROM_NAME=PORNRAS

# Bluesky API
BLUESKY_HANDLE=rasmovies.bsky.social
BLUESKY_PASSWORD=your-app-password-here

# CORS Origin
CORS_ORIGIN=https://www.pornras.com
```

### 3. Environment Variables'ları Ekleyin

#### Adım 1: Vercel Dashboard'a Giriş Yapın

1. **Vercel Dashboard'a gidin:** https://vercel.com/dashboard
2. **Projenizi seçin:** porn-ras-xxx-project (frontend)

#### Adım 2: Frontend Environment Variables Ekleyin

1. **Settings** → **Environment Variables** sekmesine tıklayın
2. **Add New** butonuna tıklayın
3. Aşağıdaki değişkenleri ekleyin:

| Key | Value | Environment |
|-----|-------|-------------|
| `REACT_APP_API_BASE_URL` | `https://server-8ild1ucus-ras-projects-6ebe5a01.vercel.app` | Production, Preview, Development |
| `REACT_APP_SUPABASE_URL` | `https://xgyjhofakpatrqgvleze.supabase.co` | Production, Preview, Development |
| `REACT_APP_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` | Production, Preview, Development |

**Önemli:**
- Her environment variable için **Production**, **Preview**, ve **Development** seçeneklerini işaretleyin
- `REACT_APP_API_BASE_URL` değerini backend URL'si ile değiştirin

#### Adım 3: Backend Environment Variables Ekleyin

1. **Backend projesini seçin:** server
2. **Settings** → **Environment Variables** sekmesine tıklayın
3. **Add New** butonuna tıklayın
4. Aşağıdaki değişkenleri ekleyin:

| Key | Value | Environment |
|-----|-------|-------------|
| `PORT` | `5000` | Production, Preview, Development |
| `PROTON_SMTP_HOST` | `smtp.protonmail.ch` | Production, Preview, Development |
| `PROTON_SMTP_PORT` | `587` | Production, Preview, Development |
| `PROTON_SMTP_SECURE` | `false` | Production, Preview, Development |
| `PROTON_SMTP_USERNAME` | `info@pornras.com` | Production, Preview, Development |
| `PROTON_SMTP_PASSWORD` | `LED4C43RUWSPLWCG` | Production, Preview, Development |
| `PROTON_FROM_EMAIL` | `info@pornras.com` | Production, Preview, Development |
| `PROTON_FROM_NAME` | `PORNRAS` | Production, Preview, Development |
| `BLUESKY_HANDLE` | `rasmovies.bsky.social` | Production, Preview, Development |
| `BLUESKY_PASSWORD` | `your-app-password-here` | Production, Preview, Development |
| `CORS_ORIGIN` | `https://www.pornras.com` | Production, Preview, Development |

### 4. Frontend'i Yeniden Deploy Edin

Environment variables'ları ekledikten sonra:

1. **Vercel Dashboard → Project → Deployments**
2. **Redeploy** butonuna tıklayın
3. Veya terminal'den:
   ```bash
   cd client
   vercel --prod --yes
   ```

### 5. Test Edin

1. **Frontend'i açın:** https://www.pornras.com
2. **Yeni bir kullanıcı kaydedin**
3. **Doğrulama e-postasını kontrol edin**
4. **Console'da hata olmamalı**

## 🔍 Sorun Giderme

### Hata: "Backend URL is not configured"

**Çözüm:**
- Vercel Dashboard'da `REACT_APP_API_BASE_URL` environment variable'ını kontrol edin
- Backend URL'sinin doğru olduğundan emin olun
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
- **Backend URL:** Backend URL'sini backend deploy edildikten sonra alın
- **CORS:** Backend'de CORS ayarlarını `https://www.pornras.com` olarak ayarlayın

## 🎉 Başarılı Kurulum

Kurulum başarılı olduğunda:
- ✅ Frontend production'da backend URL'sini kullanacak
- ✅ Supabase credentials environment variables'dan gelecek
- ✅ Email verification çalışacak
- ✅ Console'da hata olmayacak

**Hepsi bu kadar!** 🎉

