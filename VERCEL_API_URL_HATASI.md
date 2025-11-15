# 🔴 KRİTİK: API Base URL Hatası

## ❌ Sorun

Console loglarına göre:
- `API_BASE_URL: 'smtp.protonmail.ch'` ❌
- Bu **yanlış!** `smtp.protonmail.ch` Proton Mail SMTP sunucusu, backend API sunucusu değil!
- İstek: `https://www.pornras.com/smtp.protonmail.ch/api/email/verification`
- Sonuç: **405 Method Not Allowed**

## ✅ Çözüm

### Vercel Dashboard'da Düzeltme

1. **Vercel Dashboard'a gidin:** https://vercel.com/dashboard
2. **Projenizi seçin:** porn-ras-xxx-project (frontend)
3. **Settings** → **Environment Variables** sekmesine tıklayın
4. **`REACT_APP_API_BASE_URL`** değişkenini bulun veya ekleyin

### Doğru Backend URL

**Backend URL'si (son deploy edilen):**
```
https://server-pol4jdmuv-ras-projects-6ebe5a01.vercel.app
```

**Veya son backend URL'sini kontrol edin:**
```bash
vercel ls server
```

### Environment Variable Ayarları

**Key:** `REACT_APP_API_BASE_URL`

**Value:** `https://server-pol4jdmuv-ras-projects-6ebe5a01.vercel.app`

**⚠️ ÖNEMLİ:**
- ❌ **YANLIŞ:** `smtp.protonmail.ch`
- ✅ **DOĞRU:** `https://server-pol4jdmuv-ras-projects-6ebe5a01.vercel.app`

### Adım Adım

1. **Vercel Dashboard → porn-ras-xxx-project → Settings → Environment Variables**
2. **`REACT_APP_API_BASE_URL`** değişkenini bulun
3. **Eğer yoksa:** "Add New" butonuna tıklayın
4. **Eğer varsa:** Değerini düzenleyin
5. **Key:** `REACT_APP_API_BASE_URL`
6. **Value:** `https://server-pol4jdmuv-ras-projects-6ebe5a01.vercel.app`
7. **Environment:** ✅ Production, ✅ Preview, ✅ Development (hepsini işaretleyin)
8. **Save** butonuna tıklayın

### Frontend'i Yeniden Deploy Edin

Environment variable'ı düzelttikten sonra:

1. **Vercel Dashboard → porn-ras-xxx-project → Deployments**
2. **En son deployment'ın yanındaki "..." menüsüne tıklayın**
3. **"Redeploy"** butonuna tıklayın
4. **"Use existing Build Cache"** seçeneğini **kapatın** (environment variables için önemli!)
5. **"Redeploy"** butonuna tıklayın

### Kontrol

Frontend yeniden deploy edildikten sonra:

1. **Frontend'i yenileyin** (hard refresh: Ctrl+Shift+R)
2. **Browser Console'u açın (F12)**
3. **Yeni bir kullanıcı kaydedin**
4. **Console'da kontrol edin:**
   - ✅ `API_BASE_URL: 'https://server-pol4jdmuv-ras-projects-6ebe5a01.vercel.app'` görünmeli
   - ❌ `API_BASE_URL: 'smtp.protonmail.ch'` görünmemeli
   - ✅ İstek: `https://server-pol4jdmuv-ras-projects-6ebe5a01.vercel.app/api/email/verification` olmalı
   - ✅ 200 OK veya başarılı yanıt alınmalı

## 🔍 Backend URL'sini Kontrol Etme

Eğer backend URL'sinden emin değilseniz:

```bash
# Son backend deploy URL'sini kontrol edin
vercel ls server

# Veya Vercel Dashboard'da:
# Vercel Dashboard → server → Deployments → En son deployment'ın URL'si
```

## 📝 Notlar

- **SMTP vs API:** `smtp.protonmail.ch` Proton Mail SMTP sunucusu, backend API sunucusu değil!
- **Backend URL:** Backend API sunucusu Vercel'de deploy edilmiş olmalı
- **Environment Variables:** Vercel'de environment variables'ları değiştirdikten sonra frontend'i yeniden deploy etmeniz gerekir

## ✅ Başarılı Düzeltme

Düzeltme başarılı olduğunda:
- ✅ Console'da `API_BASE_URL` doğru backend URL'sini gösterecek
- ✅ API istekleri backend'e gidecek
- ✅ 200 OK yanıtları alınacak
- ✅ Email verification çalışacak
- ✅ Bluesky API çalışacak

**Hepsi bu kadar!** 🎉

