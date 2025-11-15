# Vercel Environment Variable Kurulumu

## ✅ Durum

- ✅ LocalTunnel başlatıldı
- ✅ URL alındı: `https://hot-showers-notice.loca.lt`
- ✅ Frontend deploy edildi
- ⚠️ Environment variable manuel olarak eklenmesi gerekiyor

## 🎯 Yapmanız Gerekenler

### 1. Vercel Dashboard'a Git

1. **Vercel Dashboard**: https://vercel.com/dashboard
2. **Projeni seç**: `porn-ras-xxx-project`
3. **Settings** → **Environment Variables**

### 2. Environment Variable Ekle

**Yeni variable ekle:**
- **Key**: `REACT_APP_API_BASE_URL`
- **Value**: `https://hot-showers-notice.loca.lt`
- **Environment**: 
  - ✅ Production
  - ✅ Preview
  - ✅ Development
  - (Hepsini seç)

### 3. Save Butonuna Tıkla

Environment variable'ı kaydet.

### 4. Frontend'i Yeniden Deploy Et

Environment variable eklendikten sonra frontend'i yeniden deploy et:

```bash
cd client
vercel --prod
```

Veya GitHub'a push et (otomatik deploy olur).

## ⚠️ Önemli Notlar

1. **LocalTunnel çalışmalı**: LocalTunnel penceresini kapatmayın! Çalışırken açık kalmalı.
2. **Backend çalışmalı**: Port 5000'de çalışmalı
3. **Proton Bridge çalışmalı**: SMTP port 1025'te çalışmalı
4. **URL değişir**: Her LocalTunnel başlatıldığında URL değişir. URL değiştiğinde Vercel'de environment variable'ı güncelle.

## 🔧 LocalTunnel URL'si Değiştiğinde

1. Yeni URL'yi al (LocalTunnel penceresinden)
2. Vercel Dashboard -> Settings -> Environment Variables
3. `REACT_APP_API_BASE_URL` değerini güncelle
4. Frontend'i yeniden deploy et

## ✅ Test Et

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

**Yapılanlar:**
1. ✅ LocalTunnel başlatıldı
2. ✅ URL alındı: `https://hot-showers-notice.loca.lt`
3. ✅ Frontend deploy edildi
4. ⚠️ Environment variable manuel olarak eklenmesi gerekiyor

**Yapmanız Gerekenler:**
1. Vercel Dashboard -> Settings -> Environment Variables
2. `REACT_APP_API_BASE_URL` = `https://hot-showers-notice.loca.lt` ekle
3. Frontend'i yeniden deploy et

**Hepsi bu kadar!** 🎉



