# 🚀 Proton Bridge'i Siteye Bağlama - Hızlı Başlangıç

## ✅ Durum

- ✅ Backend çalışıyor (port 5000)
- ✅ Proton Bridge çalışıyor (SMTP port 1025)
- ✅ LocalTunnel kurulu ve hazır
- ✅ Email servisi çalışıyor (localhost'ta test edildi)

## 🎯 Şimdi Ne Yapmalısın?

### ADIM 1: LocalTunnel'i Başlat

#### Yöntem A: Script ile (Kolay)
```powershell
.\start-localtunnel.ps1
```

#### Yöntem B: Manuel olarak
```powershell
lt --port 5000
```

### ADIM 2: URL'yi Kopyala

LocalTunnel penceresinde şuna benzer bir satır göreceksin:
```
your url is: https://xxxxx.loca.lt
```

**Bu URL'yi kopyala!** (örnek: `https://happy-sun-1234.loca.lt`)

### ADIM 3: URL'yi Test Et

Browser'da aç veya PowerShell'de test et:
```powershell
Invoke-WebRequest -Uri "https://xxxxx.loca.lt/health" -UseBasicParsing
```

**Başarılı olursa**: Backend LocalTunnel üzerinden erişilebilir! ✅

### ADIM 4: Vercel'de Environment Variable Ekle

1. **Vercel Dashboard**: https://vercel.com/dashboard
2. **Projeni seç**
3. **Settings** → **Environment Variables**
4. **Yeni variable ekle**:
   - **Key**: `REACT_APP_API_BASE_URL`
   - **Value**: LocalTunnel URL'si (örnek: `https://xxxxx.loca.lt`)
   - **Environment**: Production (veya All)
5. **Save** butonuna tıkla

### ADIM 5: Frontend'i Deploy Et

1. **GitHub'a push et** (otomatik deploy olur)
2. **Veya manuel deploy**:
   ```bash
   cd client
   vercel --prod
   ```

## ✅ Test Et

### Backend Test:
```powershell
Invoke-WebRequest -Uri "https://xxxxx.loca.lt/health" -UseBasicParsing
```

### Email Servisi Test:
```powershell
$body = @{ email = "test@example.com"; username = "Test"; verifyUrl = "https://www.pornras.com/verify" } | ConvertTo-Json
Invoke-WebRequest -Uri "https://xxxxx.loca.lt/api/email/verification" -Method POST -Headers @{"Content-Type"="application/json"} -Body $body -UseBasicParsing
```

## ⚠️ Önemli Notlar

1. **LocalTunnel penceresini kapatma!** Çalışırken açık kalmalı
2. **Backend çalışmalı**: Port 5000'de çalışmalı
3. **Proton Bridge çalışmalı**: SMTP port 1025'te çalışmalı
4. **URL değişir**: Her LocalTunnel başlatıldığında URL değişir
5. **Vercel'de güncelle**: URL değiştiğinde Vercel'de environment variable'ı güncelle

## 🔧 LocalTunnel'i Yeniden Başlatmak İçin

1. **Eski LocalTunnel'i durdur**: Pencerede `Ctrl+C` yap
2. **Yeniden başlat**: `.\start-localtunnel.ps1` veya `lt --port 5000`
3. **Yeni URL'yi kopyala**
4. **Vercel'de güncelle**: Environment variable'ı yeni URL ile güncelle

## 📝 Özet

**Yapman Gerekenler:**
1. ✅ LocalTunnel'i başlat (script ile veya manuel)
2. ✅ URL'yi kopyala (LocalTunnel penceresinden)
3. ✅ Vercel'de `REACT_APP_API_BASE_URL` olarak ekle
4. ✅ Frontend'i deploy et

**Hepsi bu kadar!** 🎉

## 🆘 Sorun Giderme

### LocalTunnel URL'si görünmüyorsa:
1. LocalTunnel penceresini kontrol et
2. Backend çalışıyor mu kontrol et (port 5000)
3. LocalTunnel'i yeniden başlat

### URL çalışmıyorsa:
1. Backend çalışıyor mu kontrol et
2. LocalTunnel çalışıyor mu kontrol et
3. Firewall ayarlarını kontrol et

### Email gönderilemiyorsa:
1. Proton Bridge çalışıyor mu kontrol et
2. Backend loglarını kontrol et
3. SMTP ayarlarını kontrol et

## ✅ Başarı Kriterleri

- ✅ LocalTunnel çalışıyor
- ✅ URL erişilebilir (`https://xxxxx.loca.lt/health`)
- ✅ Vercel'de environment variable ayarlandı
- ✅ Frontend deploy edildi
- ✅ Email servisi çalışıyor

## 🎯 Sonuç

**Proton Bridge localhost'ta çalışıyor + Backend localhost'ta çalışıyor + LocalTunnel ile expose ediliyor = Production'da çalışıyor!** 🎉



