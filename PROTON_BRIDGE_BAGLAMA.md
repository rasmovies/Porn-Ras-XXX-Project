# Proton Bridge'i Siteye Bağlama Rehberi

## 🎯 Amaç

Proton Bridge localhost'ta çalışıyor (SMTP port 1025). Backend de localhost'ta çalışıyor (port 5000). Production'da (Vercel'de) frontend, backend'e nasıl erişecek?

## 💡 Çözüm: Ngrok veya LocalTunnel

### Seçenek 1: Ngrok (Önerilen)

**Avantajlar:**
- ✅ Ücretsiz
- ✅ Kolay kurulum
- ✅ Güvenilir
- ✅ Otomatik URL oluşturur
- ✅ HTTPS desteği

**Dezavantajlar:**
- ⚠️ URL her başlatmada değişir (ücretsiz versiyonda)
- ⚠️ Ücretsiz versiyonda sınırlı trafik

### Seçenek 2: LocalTunnel (Daha Kolay)

**Avantajlar:**
- ✅ Ücretsiz
- ✅ Çok kolay kurulum (npm ile)
- ✅ Otomatik URL oluşturur
- ✅ HTTPS desteği

**Dezavantajlar:**
- ⚠️ URL her başlatmada değişir
- ⚠️ Bazen yavaş olabilir

## 🚀 Ngrok Kurulumu ve Kullanımı

### Adım 1: Ngrok Kur

#### Seçenek A: Manuel Kurulum
1. https://ngrok.com/download → Windows indir
2. Zip'i aç ve `ngrok.exe`'yi `C:\Users\User\AppData\Local\Programs\` klasörüne kopyala
3. Veya istediğin bir klasöre kopyala

#### Seçenek B: Windows Package Manager
```powershell
winget install ngrok
```

### Adım 2: Ngrok Hesabı Oluştur (Opsiyonel)

1. https://ngrok.com → Sign Up
2. Email doğrula
3. Dashboard'a git
4. **Authtoken**'ı kopyala
5. Ngrok'i auth token ile yapılandır:
   ```powershell
   ngrok config add-authtoken YOUR_AUTH_TOKEN
   ```

**Not**: Auth token olmadan da çalışır ama bazı sınırlamalar vardır.

### Adım 3: Ngrok'i Başlat

```powershell
# Port 5000 için ngrok başlat
ngrok http 5000
```

**Sonuç**: Terminal'de URL görünecek (örnek: `https://xxxxx.ngrok-free.app`)

### Adım 4: URL'yi Kopyala

Terminal'de görünen URL'yi kopyala (örnek: `https://xxxxx.ngrok-free.app`)

### Adım 5: Vercel'de Environment Variable Ekle

1. Vercel Dashboard → Projen → Settings → Environment Variables
2. Yeni variable ekle:
   - **Key**: `REACT_APP_API_BASE_URL`
   - **Value**: Ngrok URL'si (örnek: `https://xxxxx.ngrok-free.app`)
   - **Environment**: Production
3. **Save**

### Adım 6: Frontend'i Deploy Et

1. GitHub'a push et (otomatik deploy)
2. Veya: `cd client && vercel --prod`

## 🚀 LocalTunnel Kurulumu ve Kullanımı (Daha Kolay)

### Adım 1: LocalTunnel Kur

```powershell
npm install -g localtunnel
```

### Adım 2: LocalTunnel'i Başlat

```powershell
# Port 5000 için localtunnel başlat
lt --port 5000
```

**Sonuç**: Terminal'de URL görünecek (örnek: `https://xxxxx.loca.lt`)

### Adım 3: URL'yi Kopyala

Terminal'de görünen URL'yi kopyala (örnek: `https://xxxxx.loca.lt`)

### Adım 4: Vercel'de Environment Variable Ekle

1. Vercel Dashboard → Projen → Settings → Environment Variables
2. Yeni variable ekle:
   - **Key**: `REACT_APP_API_BASE_URL`
   - **Value**: LocalTunnel URL'si (örnek: `https://xxxxx.loca.lt`)
   - **Environment**: Production
3. **Save**

### Adım 5: Frontend'i Deploy Et

1. GitHub'a push et (otomatik deploy)
2. Veya: `cd client && vercel --prod`

## 📝 Otomatik Başlatma Scriptleri

### Ngrok Script

`start-ngrok.ps1` dosyası oluşturdum - çift tıkla ve çalıştır!

### LocalTunnel Script

`start-localtunnel.ps1` dosyası oluşturdum - çift tıkla ve çalıştır!

## ⚠️ Önemli Notlar

1. **Ngrok/LocalTunnel penceresini kapatma!** Çalışırken açık kalmalı
2. **Backend çalışmalı**: Port 5000'de çalışmalı
3. **Proton Bridge çalışmalı**: SMTP port 1025'te çalışmalı
4. **URL değişir**: Her başlatmada URL değişir (ücretsiz versiyonda)
5. **Vercel'de güncelle**: URL değiştiğinde Vercel'de environment variable'ı güncelle

## 🔧 Kalıcı URL İçin (Ngrok Pro)

Ngrok Pro kullanırsan:
- ✅ Kalıcı URL (her başlatmada aynı)
- ✅ Özel domain
- ✅ Daha fazla trafik
- ✅ Daha fazla özellik

**Fiyat**: $8/ay (veya daha fazla)

## ✅ Test Et

### Backend Test:
```powershell
# Ngrok URL'si ile test
Invoke-WebRequest -Uri "https://xxxxx.ngrok-free.app/health" -UseBasicParsing

# LocalTunnel URL'si ile test
Invoke-WebRequest -Uri "https://xxxxx.loca.lt/health" -UseBasicParsing
```

### Email Servisi Test:
```powershell
$body = @{ email = "test@example.com"; username = "Test"; verifyUrl = "https://www.pornras.com/verify" } | ConvertTo-Json
Invoke-WebRequest -Uri "https://xxxxx.ngrok-free.app/api/email/verification" -Method POST -Headers @{"Content-Type"="application/json"} -Body $body -UseBasicParsing
```

## 🎯 Hızlı Başlangıç (LocalTunnel - Önerilen)

### 1. LocalTunnel Kur:
```powershell
npm install -g localtunnel
```

### 2. Backend Çalıştığından Emin Ol:
```powershell
# Backend kontrol
Test-NetConnection -ComputerName localhost -Port 5000
```

### 3. LocalTunnel Başlat:
```powershell
lt --port 5000
```

### 4. URL'yi Kopyala:
Terminal'de görünen URL'yi kopyala (örnek: `https://xxxxx.loca.lt`)

### 5. Vercel'de Environment Variable Ekle:
- Key: `REACT_APP_API_BASE_URL`
- Value: LocalTunnel URL'si
- Environment: Production

### 6. Frontend'i Deploy Et:
GitHub'a push et veya `vercel --prod`

## ✅ Sonuç

**Proton Bridge localhost'ta çalışıyor + Backend localhost'ta çalışıyor + Ngrok/LocalTunnel ile expose ediliyor = Production'da çalışıyor!** 🎉



