# 🔍 Bluesky Entegrasyonu - Debug Rehberi

## ❌ Sorun: Yüklenen video Bluesky'de post olarak gelmiyor

## 🔍 Kontrol Listesi

### 1. Frontend Console Hataları

**Browser Console'u açın (F12) ve kontrol edin:**
- ✅ "Failed to share to Bluesky:" hatası var mı?
- ✅ "Backend URL is not configured" hatası var mı?
- ✅ Network tab'ında `/api/bluesky/share-video` isteği var mı?

**Kontrol:**
1. Frontend'de video yükleyin
2. Browser Console'u açın (F12)
3. **Console** sekmesinde hata var mı kontrol edin
4. **Network** sekmesinde `/api/bluesky/share-video` isteği var mı kontrol edin

### 2. Backend Environment Variables

**Backend'de Bluesky credentials'ları ayarlı mı?**

**Vercel'de kontrol:**
- Vercel Dashboard → server → Settings → Environment Variables
- `BLUESKY_HANDLE` var mı?
- `BLUESKY_PASSWORD` var mı?

**Local'de kontrol:**
- `server/.env` dosyasında `BLUESKY_HANDLE` ve `BLUESKY_PASSWORD` var mı?

### 3. Backend URL

**Frontend'de backend URL'si doğru mu?**

**Vercel'de kontrol:**
- Vercel Dashboard → porn-ras-xxx-project → Settings → Environment Variables
- `REACT_APP_API_BASE_URL` var mı?
- Değeri backend URL'si mi? (`https://server-xxx.vercel.app`)

**Local'de kontrol:**
- Frontend production'da `localhost:5000` kullanmaya çalışıyor mu?
- Console'da "Backend URL is not configured" hatası var mı?

### 4. Backend Logları

**Backend loglarını kontrol edin:**

**Vercel'de:**
```bash
vercel logs server
```

**Local'de:**
- Backend terminal'inde "Bluesky bağlantısı başarılı" mesajı görünüyor mu?
- "❌ Bluesky post hatası" veya "❌ Bluesky bağlantı hatası" mesajı var mı?

### 5. CORS Hatası

**CORS hatası var mı?**

**Kontrol:**
- Browser Console'da CORS hatası var mı?
- Network tab'ında preflight (OPTIONS) isteği başarılı mı?

## 🔧 Çözüm Adımları

### Adım 1: Frontend Console'u Kontrol Edin

1. **Frontend'de video yükleyin**
2. **Browser Console'u açın (F12)**
3. **Console sekmesinde hata var mı kontrol edin**
4. **Network sekmesinde `/api/bluesky/share-video` isteği var mı kontrol edin**

### Adım 2: Backend Environment Variables'ları Kontrol Edin

**Vercel Dashboard → server → Settings → Environment Variables**

Şunların olduğundan emin olun:
- `BLUESKY_HANDLE=rasmovies.bsky.social`
- `BLUESKY_PASSWORD=your-app-password-here`

### Adım 3: Frontend Environment Variables'ları Kontrol Edin

**Vercel Dashboard → porn-ras-xxx-project → Settings → Environment Variables**

Şunun olduğundan emin olun:
- `REACT_APP_API_BASE_URL=https://server-pol4jdmuv-ras-projects-6ebe5a01.vercel.app`

### Adım 4: Backend Loglarını Kontrol Edin

**Vercel'de:**
```bash
vercel logs server --follow
```

**Local'de:**
- Backend terminal'ini kontrol edin

### Adım 5: Manuel Test

**Backend'i manuel test edin:**

```bash
curl -X POST https://server-pol4jdmuv-ras-projects-6ebe5a01.vercel.app/api/bluesky/share-video \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Video",
    "description": "Test açıklaması",
    "thumbnail": "https://via.placeholder.com/400x225",
    "slug": "test-video"
  }'
```

## 🔍 Olası Sorunlar ve Çözümleri

### Sorun 1: "Backend URL is not configured"

**Çözüm:**
- Vercel Dashboard'da `REACT_APP_API_BASE_URL` environment variable'ını ekleyin
- Frontend'i yeniden deploy edin

### Sorun 2: "BLUESKY_HANDLE ve BLUESKY_PASSWORD environment variable'ları ayarlanmalı"

**Çözüm:**
- Vercel Dashboard → server → Settings → Environment Variables
- `BLUESKY_HANDLE` ve `BLUESKY_PASSWORD` ekleyin
- Backend'i yeniden deploy edin

### Sorun 3: "Bluesky bağlantı hatası: Invalid identifier or password"

**Çözüm:**
- Bluesky App Password'un doğru olduğundan emin olun
- `BLUESKY_HANDLE` formatını kontrol edin (örn: `rasmovies.bsky.social`)

### Sorun 4: "Failed to share to Bluesky" (Frontend Console)

**Çözüm:**
- Backend loglarını kontrol edin
- Network tab'ında isteğin başarısız olup olmadığını kontrol edin
- Backend URL'sinin doğru olduğundan emin olun

### Sorun 5: CORS Hatası

**Çözüm:**
- Backend'de CORS ayarlarını kontrol edin
- `origin: 'https://www.pornras.com'` doğru mu?
- Frontend'in domain'i doğru mu?

## 📝 Notlar

- **Non-blocking:** Bluesky paylaşımı arka planda yapılır, hata olsa bile video yüklenir
- **Console'da hata:** Frontend Console'da "Failed to share to Bluesky:" hatası görünebilir
- **Backend logları:** Backend loglarında Bluesky işlemleri görünür

## ✅ Başarılı Test

Bluesky entegrasyonu çalıştığında:
- ✅ Backend loglarında "✅ Bluesky post başarılı" mesajı görünür
- ✅ Frontend Console'da hata olmaz
- ✅ Bluesky profilinizde post görünür

**Hepsi bu kadar!** 🎉

