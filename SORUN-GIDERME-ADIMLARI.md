# 🔧 Network Error Sorun Giderme Adımları

## ✅ Backend Durumu: ÇALIŞIYOR ✅

- ✅ Backend aktif (PM2)
- ✅ Health endpoint çalışıyor: `https://api.pornras.com/health`
- ✅ Email endpoint erişilebilir
- ✅ CORS ayarları güncellendi

---

## 🔍 Sorun: Frontend Backend'e Bağlanamıyor

### Olası Nedenler:

1. **Vercel Environment Variable eksik/yanlış**
2. **Vercel deployment yeniden başlatılmamış**
3. **Browser cache sorunu**

---

## 📋 Adım Adım Kontrol

### 1. Vercel Environment Variable Kontrolü

**Vercel Dashboard → Frontend Projesi → Settings → Environment Variables**

Kontrol edin:
- ✅ `REACT_APP_API_BASE_URL` var mı?
- ✅ Value: `https://api.pornras.com` (https:// ile başlamalı!)
- ✅ Environment: Production, Preview, Development (hepsi seçili mi?)

**Eğer yoksa veya yanlışsa:**
1. "Add New" → Key: `REACT_APP_API_BASE_URL`, Value: `https://api.pornras.com`
2. Environment'ları seçin (Production, Preview, Development)
3. Save

### 2. Vercel Deployment Yeniden Başlatma

**MUTLAKA YAPILMALI!**

1. Vercel Dashboard → Deployments
2. Son deployment'in yanındaki **"..."** menüsüne tıklayın
3. **"Redeploy"** seçin
4. Veya yeni bir commit push edin

**ÖNEMLİ:** Environment variable ekledikten sonra **mutlaka** deployment'i yeniden başlatın!

### 3. Browser Console Kontrolü

**Browser'da (F12) → Console tab:**

Kontrol edin:
```javascript
// Console'da çalıştırın:
console.log('API_BASE_URL:', process.env.REACT_APP_API_BASE_URL);
```

**Beklenen:** `https://api.pornras.com`

**Eğer `undefined` veya farklı bir değer görüyorsanız:**
- Environment variable yanlış ayarlanmış
- Deployment yeniden başlatılmamış

### 4. Network Tab Kontrolü

**Browser'da (F12) → Network tab:**

1. Email verification formunu gönderin
2. Network tab'da `api/email/verification` isteğini bulun
3. İsteğin **URL'sini** kontrol edin

**Beklenen URL:** `https://api.pornras.com/api/email/verification`

**Eğer farklı bir URL görüyorsanız:**
- Environment variable yanlış
- Frontend eski build kullanıyor

### 5. Browser Cache Temizleme

**Hard Refresh:**
- Windows: `Ctrl + Shift + R` veya `Ctrl + F5`
- Mac: `Cmd + Shift + R`

**Veya:**
- Browser'da DevTools açıkken Network tab → "Disable cache" işaretleyin
- Sayfayı yenileyin

---

## 🧪 Test Komutları

### Backend Test (Terminal):
```bash
curl https://api.pornras.com/health
```
**Beklenen:** `{"status":"OK","timestamp":"..."}`

### Email Endpoint Test:
```bash
curl -X POST https://api.pornras.com/api/email/verification \
  -H "Content-Type: application/json" \
  -H "Origin: https://www.pornras.com" \
  -d '{"email":"test@example.com","username":"testuser","verifyUrl":"https://www.pornras.com/verify?token=123"}'
```

### Browser Console Test:
```javascript
// Browser console'da çalıştırın:
fetch('https://api.pornras.com/health')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error);
```

---

## ✅ Çözüm Kontrol Listesi

- [ ] Vercel'de `REACT_APP_API_BASE_URL = https://api.pornras.com` ayarlandı
- [ ] Environment variable Production, Preview, Development'da seçili
- [ ] Vercel deployment yeniden başlatıldı (Redeploy)
- [ ] Browser cache temizlendi (Hard refresh)
- [ ] Browser console'da `process.env.REACT_APP_API_BASE_URL` kontrol edildi
- [ ] Network tab'da istek URL'si `https://api.pornras.com/api/email/verification` olarak görünüyor

---

## 🆘 Hala Çalışmıyorsa

### 1. Browser Console Hatalarını Kontrol Edin
- F12 → Console tab
- Kırmızı hataları kontrol edin
- Hata mesajını paylaşın

### 2. Network Tab'da İsteği İnceleyin
- F12 → Network tab
- `api/email/verification` isteğini bulun
- İsteğe tıklayın → "Headers" sekmesi
- Request URL'yi kontrol edin
- Response'u kontrol edin

### 3. Vercel Build Loglarını Kontrol Edin
- Vercel Dashboard → Deployments → Son deployment
- "Build Logs" sekmesine bakın
- Environment variable'ın build sırasında yüklendiğini kontrol edin

---

## 📞 Son Kontrol

**Eğer tüm adımları yaptıysanız ve hala çalışmıyorsa:**

1. Browser console'daki tam hata mesajını paylaşın
2. Network tab'da istek detaylarını paylaşın (Headers, Response)
3. Vercel deployment loglarını kontrol edin

---

## 🎯 Özet

**En yaygın sorun:** Vercel'de environment variable eklendikten sonra **deployment yeniden başlatılmamış**!

**Çözüm:** 
1. Environment variable ekle
2. **MUTLAKA** deployment'i yeniden başlat (Redeploy)
3. Browser cache temizle
4. Test et


