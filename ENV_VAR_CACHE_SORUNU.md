# 🔄 Environment Variable Cache Sorunu - Çözüm

## ❌ Sorun

Vercel'de `REACT_APP_API_BASE_URL` değiştirildi ama hala `smtp.protonmail.ch` görünüyor.

## 🔍 Olası Nedenler

1. **Frontend yeniden deploy edilmemiş** - Environment variable değiştiğinde frontend yeniden build edilmeli
2. **Build cache kullanılmış** - Eski build cache'i kullanılmış olabilir
3. **Browser cache** - Tarayıcı cache'i eski JavaScript'i kullanıyor olabilir
4. **Yanlış proje** - Environment variable yanlış projeye eklenmiş olabilir

## ✅ Çözüm Adımları

### Adım 1: Environment Variable'ı Kontrol Edin

1. **Vercel Dashboard → porn-ras-xxx-project → Settings → Environment Variables**
2. **`REACT_APP_API_BASE_URL`** değişkenini kontrol edin
3. **Value değeri:** `https://server-pol4jdmuv-ras-projects-6ebe5a01.vercel.app` olmalı
4. **Environment:** ✅ Production, ✅ Preview, ✅ Development işaretli olmalı
5. **Eğer yanlışsa:** Düzenleyin ve Save

### Adım 2: Frontend'i Yeniden Deploy Edin (Cache Temizleyerek)

**ÖNEMLİ:** Environment variable değiştiğinde frontend'i **mutlaka** yeniden deploy etmeniz gerekir!

1. **Vercel Dashboard → porn-ras-xxx-project → Deployments**
2. **En son deployment'ın yanındaki "..." menüsüne tıklayın**
3. **"Redeploy"** butonuna tıklayın
4. **"Use existing Build Cache"** seçeneğini **KAPATIN** (çok önemli!)
5. **"Redeploy"** butonuna tıklayın

**Veya terminal'den:**

```bash
cd client
vercel --prod --force
```

`--force` flag'i build cache'i atlayarak yeniden build eder.

### Adım 3: Browser Cache'i Temizleyin

Frontend yeniden deploy edildikten sonra:

1. **Browser'ı kapatın ve yeniden açın**
2. **Hard Refresh yapın:**
   - **Windows/Linux:** `Ctrl + Shift + R` veya `Ctrl + F5`
   - **Mac:** `Cmd + Shift + R`
3. **Veya Developer Tools → Network → "Disable cache" işaretleyin**
4. **Sayfayı yenileyin**

### Adım 4: Environment Variable Build-time Kontrolü

React environment variables **build-time**'da değişkenlere dönüştürülür. Bu yüzden:

1. Environment variable değiştirildikten sonra **mutlaka** yeniden build edilmelidir
2. Build cache kullanılırsa eski değerler kullanılır
3. Bu yüzden **"Use existing Build Cache"** seçeneğini kapatmak çok önemli!

## 🔍 Kontrol

### Console'da Kontrol

1. **Frontend'i açın:** https://www.pornras.com
2. **Browser Console'u açın (F12)**
3. **Console sekmesinde şunları arayın:**
   - `buildUrl called:` log'una bakın
   - `API_BASE_URL` değerini kontrol edin

**Doğru:**
```
🔍 buildUrl called: {path: '/api/email/verification', API_BASE_URL: 'https://server-pol4jdmuv-ras-projects-6ebe5a01.vercel.app', ...}
```

**Yanlış:**
```
🔍 buildUrl called: {path: '/api/email/verification', API_BASE_URL: 'smtp.protonmail.ch', ...}
```

### Network Tab'ında Kontrol

1. **Network sekmesine gidin**
2. **Yeni bir kullanıcı kaydedin**
3. **İsteği kontrol edin:**
   - **Doğru:** `https://server-pol4jdmuv-ras-projects-6ebe5a01.vercel.app/api/email/verification`
   - **Yanlış:** `https://www.pornras.com/smtp.protonmail.ch/api/email/verification`

## 🔧 Terminal'den Kontrol ve Deploy

### Son Backend URL'sini Kontrol

```bash
vercel ls server
```

En son backend URL'sini göreceksiniz.

### Frontend'i Force Deploy Et

```bash
cd client
vercel --prod --force
```

`--force` flag'i build cache'i atlayarak yeni bir build oluşturur.

## 📝 Notlar

### React Environment Variables

- **Build-time:** React environment variables build sırasında JavaScript koduna gömülür
- **Cache:** Build cache kullanılırsa eski değerler kullanılır
- **Çözüm:** Environment variable değiştiğinde **mutlaka** yeniden build edin (cache'siz!)

### Vercel Build Cache

- **Default:** Vercel build cache kullanır (hızlı build için)
- **Sorun:** Environment variable değiştiğinde cache eski değerleri kullanabilir
- **Çözüm:** "Use existing Build Cache" seçeneğini kapatın veya `--force` flag'i kullanın

## ✅ Başarılı Kontrol

Düzeltme başarılı olduğunda:

1. ✅ Console'da `API_BASE_URL: 'https://server-pol4jdmuv-ras-projects-6ebe5a01.vercel.app'` görünmeli
2. ✅ Network tab'ında istek backend URL'sine gitmeli
3. ✅ 200 OK veya başarılı yanıt alınmalı
4. ✅ Email verification çalışmalı
5. ✅ Bluesky API çalışmalı

## 🎯 Özet

**Sorun:** Environment variable değişti ama eski değer hala kullanılıyor

**Neden:** Build cache kullanılmış veya frontend yeniden deploy edilmemiş

**Çözüm:**
1. ✅ Environment variable'ı kontrol edin
2. ✅ Frontend'i **cache'siz** yeniden deploy edin (--force veya "Use existing Build Cache" kapalı)
3. ✅ Browser cache'i temizleyin (hard refresh)
4. ✅ Console'da kontrol edin

**Hepsi bu kadar!** 🎉

