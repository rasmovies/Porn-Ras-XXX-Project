# CORS Hata Çözümü

## ❌ Sorun

```
Access to fetch at 'https://hot-showers-notice.loca.lt/api/email/verification' 
from origin 'https://www.pornras.com' has been blocked by CORS policy: 
Response to preflight request doesn't pass access control check: 
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

**Neden:** Backend'in CORS ayarları preflight (OPTIONS) isteklerini düzgün handle etmiyordu.

## ✅ Çözüm

### 1. CORS Ayarları Güncellendi

`server/server.js` dosyasında CORS ayarları güncellendi:

- ✅ Helmet CORS ile uyumlu hale getirildi
- ✅ CORS preflight (OPTIONS) istekleri düzgün handle ediliyor
- ✅ Allowed headers genişletildi
- ✅ `optionsSuccessStatus: 204` olarak ayarlandı
- ✅ `credentials: true` eklendi
- ✅ `preflightContinue: false` ayarlandı

### 2. Backend'i Yeniden Başlat

**Önemli:** CORS ayarları değişti, backend'i yeniden başlatmanız gerekiyor!

```bash
cd server
node server.js
```

Veya PowerShell'de:
```powershell
cd server; node server.js
```

### 3. LocalTunnel'i Kontrol Et

LocalTunnel'in çalıştığından emin olun:

```bash
lt --port 5000
```

Eğer LocalTunnel çalışmıyorsa:
1. LocalTunnel'i başlat
2. Yeni URL'yi al
3. Vercel'de `REACT_APP_API_BASE_URL` environment variable'ını güncelle
4. Frontend'i yeniden deploy et

## 🔍 Test Et

### Backend Test:
```powershell
Invoke-WebRequest -Uri "https://hot-showers-notice.loca.lt/health" -UseBasicParsing
```

### CORS Test:
```powershell
$headers = @{
    "Origin" = "https://www.pornras.com"
    "Access-Control-Request-Method" = "POST"
    "Access-Control-Request-Headers" = "Content-Type"
}
Invoke-WebRequest -Uri "https://hot-showers-notice.loca.lt/api/email/verification" -Method OPTIONS -Headers $headers -UseBasicParsing
```

### Email Servisi Test:
```powershell
$body = @{ 
    email = "test@example.com"
    username = "Test"
    verifyUrl = "https://www.pornras.com/verify"
} | ConvertTo-Json

$headers = @{
    "Content-Type" = "application/json"
    "Origin" = "https://www.pornras.com"
}

Invoke-WebRequest -Uri "https://hot-showers-notice.loca.lt/api/email/verification" -Method POST -Headers $headers -Body $body -UseBasicParsing
```

## ⚠️ Önemli Notlar

1. **Backend çalışmalı**: Port 5000'de çalışmalı
2. **LocalTunnel çalışmalı**: Backend'e bağlı olmalı
3. **Proton Bridge çalışmalı**: SMTP port 1025'te çalışmalı
4. **CORS ayarları**: Backend'i yeniden başlattıktan sonra aktif olacak
5. **Environment variable**: Vercel'de `REACT_APP_API_BASE_URL` ayarlanmalı

## 📝 Özet

**Yapılacaklar:**
1. ✅ CORS ayarları güncellendi
2. ⚠️ Backend'i yeniden başlat (`cd server && node server.js`)
3. ⚠️ LocalTunnel'i kontrol et (çalışıyorsa, URL'yi al)
4. ⚠️ Vercel'de environment variable'ı güncelle (eğer URL değiştiyse)
5. ⚠️ Frontend'i yeniden deploy et (eğer URL değiştiyse)

**Hepsi bu kadar!** 🎉



