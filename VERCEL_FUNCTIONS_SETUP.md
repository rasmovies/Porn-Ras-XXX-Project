# 🔧 Vercel Functions Algılanmıyor - Çözüm Rehberi

## ❌ Sorun

Vercel Dashboard'da Functions sayfasında `/api/auth/generate-code` görünmüyor.

## ✅ Kontrol Edilmesi Gerekenler

### 1. Vercel Dashboard → Project Settings → General

**Root Directory:**
- ❌ `client` (YANLIŞ - API functions görünmez)
- ✅ `.` veya boş bırak (DOĞRU - Root directory)

**Build Command:**
- ✅ `cd client && CI=false npm run build`

**Output Directory:**
- ✅ `client/build`

### 2. Root'ta `vercel.json` Dosyası

✅ Root'ta (`/Users/mertcengiz/Desktop/adulttube/vercel.json`) dosya var ve şu şekilde:

```json
{
  "version": 2,
  "buildCommand": "cd client && CI=false npm run build",
  "outputDirectory": "client/build",
  "functions": {
    "api/**/*.js": {
      "maxDuration": 30
    }
  }
}
```

### 3. Dosya Yapısı

```
adulttube/                    # ← ROOT
├── api/                      # ← Serverless functions burada
│   ├── auth/
│   │   └── generate-code.js  # ← Function dosyası
│   └── ...
├── client/                   # ← Frontend
├── package.json              # ← Root package.json (gerekli!)
└── vercel.json               # ← Root vercel.json (gerekli!)
```

## 🔧 Çözüm Adımları

### Adım 1: Vercel Dashboard'da Root Directory'yi Değiştir

1. Vercel Dashboard → Projeniz → Settings → General
2. **Root Directory** alanını bulun
3. Şu anda ne yazıyor?
   - Eğer `client` yazıyorsa → **`.` (nokta)** yapın veya **boş bırakın**
4. **Save** butonuna tıklayın

### Adım 2: Yeni Deployment Yapın

Root Directory değiştiğinde Vercel otomatik olarak yeni bir deployment başlatır. 

**Veya manuel olarak:**
1. Vercel Dashboard → Projeniz → Deployments
2. En üstteki deployment'ın yanındaki **3 nokta** → **Redeploy**
3. **Use existing Build Cache** seçeneğini **KAPATIN**
4. **Redeploy** butonuna tıklayın

### Adım 3: Functions Sayfasını Kontrol Edin

Deployment tamamlandıktan sonra:
1. Vercel Dashboard → Projeniz → Functions
2. Şu function'lar görünmeli:
   - ✅ `/api/auth/generate-code`
   - ✅ `/api/auth/verify-code`
   - ✅ `/api/auth/verify`
   - ✅ `/api/health`
   - ✅ `/api/index`

### Adım 4: Test Edin

Browser console'da:
```javascript
fetch('https://www.pornras.com/api/health')
  .then(r => r.json())
  .then(console.log)
```

**Beklenen:** `{ status: 'OK', timestamp: '...' }`

## 🚨 Önemli Notlar

### Root Directory Neden Önemli?

- Eğer Root Directory `client/` ise:
  - Vercel sadece `client/` klasörünü görür
  - `api/` klasörü görünmez
  - Functions oluşturulmaz

- Eğer Root Directory `.` (root) ise:
  - Vercel tüm projeyi görür
  - `api/` klasöründeki functions algılanır
  - `client/` klasörü build edilir

### Çoklu `vercel.json` Dosyaları

Projede 3 tane `vercel.json` var:
1. ✅ `/vercel.json` - **ROOT** (Bu kullanılmalı)
2. ❌ `/client/vercel.json` - İgnore edilmeli
3. ❌ `/server/vercel.json` - İgnore edilmeli

Vercel sadece **ROOT'taki `vercel.json`** dosyasını okur.

## 📝 Deployment Sonrası Checklist

- [ ] Root Directory `.` veya boş
- [ ] Build Command: `cd client && CI=false npm run build`
- [ ] Output Directory: `client/build`
- [ ] Deployment başarılı
- [ ] Functions sayfasında `/api/auth/generate-code` görünüyor
- [ ] `/api/health` endpoint test edildi
- [ ] Email verification çalışıyor

## 🔍 Sorun Devam Ederse

1. **Deployment Logs'u kontrol edin:**
   - Vercel Dashboard → Deployments → Son deployment → Build Logs
   - `api/` klasörü algılandı mı?
   - Functions oluşturuldu mu?

2. **Git commit'leri kontrol edin:**
   - `api/` klasörü commit edilmiş mi?
   - `vercel.json` commit edilmiş mi?

3. **Vercel CLI ile test edin:**
   ```bash
   npm install -g vercel
   vercel --prod
   ```

