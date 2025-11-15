# 405 Hata Çözümü

## ❌ Sorun

```
POST https://www.pornras.com/api/email/verification 405 (Method Not Allowed)
```

**Neden:** Frontend, `www.pornras.com` adresine istek atıyor, ama backend LocalTunnel üzerinde çalışıyor (`https://hot-showers-notice.loca.lt`).

## 🔍 Analiz

1. **Frontend kendi domain'ine istek atıyor**: `www.pornras.com/api/email/verification`
2. **Backend LocalTunnel'de**: `https://hot-showers-notice.loca.lt/api/email/verification`
3. **REACT_APP_API_BASE_URL environment variable ayarlanmamış**: Vercel'de environment variable yok veya build zamanında alınmamış

## ✅ Çözüm

### 1. Vercel'de Environment Variable Ayarla

1. **Vercel Dashboard'a git**: https://vercel.com/dashboard
2. **Projeni seç**: `porn-ras-xxx-project`
3. **Settings** → **Environment Variables**
4. **Yeni variable ekle**:
   - **Key**: `REACT_APP_API_BASE_URL`
   - **Value**: `https://hot-showers-notice.loca.lt`
   - **Environment**: 
     - ✅ Production
     - ✅ Preview
     - ✅ Development
     - (Hepsini seç)
5. **Save** butonuna tıkla

### 2. Frontend'i Yeniden Deploy Et

**Önemli:** React uygulamalarında environment variable'lar build zamanında alınır, runtime'da değil. Bu yüzden environment variable ayarlandıktan sonra frontend'i yeniden deploy etmeniz gerekir.

```bash
cd client
vercel --prod
```

Veya GitHub'a push et (otomatik deploy olur).

### 3. Kod Değişiklikleri

`client/src/services/emailApi.ts` dosyası güncellendi:

- ✅ Production'da `API_BASE_URL` yoksa hata fırlatılıyor
- ✅ Daha açık hata mesajı eklendi
- ✅ Console'da uyarı mesajı gösteriliyor

## ⚠️ Önemli Notlar

1. **LocalTunnel çalışmalı**: LocalTunnel penceresini kapatmayın! Çalışırken açık kalmalı.
2. **Backend çalışmalı**: Port 5000'de çalışmalı
3. **Proton Bridge çalışmalı**: SMTP port 1025'te çalışmalı
4. **URL değişir**: Her LocalTunnel başlatıldığında URL değişir. URL değiştiğinde Vercel'de environment variable'ı güncelle ve frontend'i yeniden deploy et.

## 🔧 Test Et

### Backend Test:
```powershell
Invoke-WebRequest -Uri "https://hot-showers-notice.loca.lt/health" -UseBasicParsing
```

### Email Servisi Test:
```powershell
$body = @{ email = "test@example.com"; username = "Test"; verifyUrl = "https://www.pornras.com/verify" } | ConvertTo-Json
Invoke-WebRequest -Uri "https://hot-showers-notice.loca.lt/api/email/verification" -Method POST -Headers @{"Content-Type"="application/json"} -Body $body -UseBasicParsing
```

## 📝 Özet

**Yapılacaklar:**
1. ✅ Vercel Dashboard -> Settings -> Environment Variables
2. ✅ `REACT_APP_API_BASE_URL` = `https://hot-showers-notice.loca.lt` ekle
3. ✅ Production, Preview, Development (hepsini seç)
4. ✅ Save
5. ✅ Frontend'i yeniden deploy et (`vercel --prod`)

**Hepsi bu kadar!** 🎉



