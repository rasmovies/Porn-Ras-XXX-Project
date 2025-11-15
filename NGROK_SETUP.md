# Ngrok Setup Rehberi

## 🎯 Ngrok Nedir?

Ngrok, local backend'inizi internete açmanızı sağlayan bir tunneling servisidir. LocalTunnel'a alternatif olarak kullanılabilir.

## ✅ Avantajlar

- ✅ Ücretsiz
- ✅ Kolay kurulum (`npx ngrok http 5000`)
- ✅ HTTPS desteği
- ✅ Güvenilir
- ✅ URL'yi kontrol edebilirsiniz (ücretsiz versiyonda değişir)

## 🚀 Kurulum ve Kullanım

### 1. Ngrok'u Başlat

Backend port 5000'de çalışıyorsa:

```bash
npx ngrok http 5000
```

Veya global olarak kuruluysa:

```bash
ngrok http 5000
```

### 2. Ngrok URL'sini Al

Ngrok başlatıldıktan sonra terminal'de şöyle bir URL göreceksiniz:

```
Forwarding  https://xxxx-xx-xx-xx-xx.ngrok-free.app -> http://localhost:5000
```

Bu URL'yi kopyalayın (örnek: `https://xxxx.ngrok-free.app`)

### 3. Vercel'de Environment Variable Ayarla

1. **Vercel Dashboard**: https://vercel.com/dashboard
2. **Projeni seç**: `porn-ras-xxx-project`
3. **Settings** → **Environment Variables**
4. **Yeni variable ekle**:
   - **Key**: `REACT_APP_API_BASE_URL`
   - **Value**: Ngrok URL'si (örnek: `https://xxxx.ngrok-free.app`)
   - **Environment**: 
     - ✅ Production
     - ✅ Preview
     - ✅ Development
     - (Hepsini seç)
5. **Save** butonuna tıkla

### 4. Frontend'i Yeniden Deploy Et

Environment variable eklendikten sonra frontend'i yeniden deploy et:

```bash
cd client
vercel --prod
```

Veya GitHub'a push et (otomatik deploy olur).

## ⚠️ Önemli Notlar

1. **Ngrok penceresini kapatmayın!** Çalışırken açık kalmalı.
2. **Backend çalışmalı**: Port 5000'de çalışmalı
3. **Proton Bridge çalışmalı**: SMTP port 1025'te çalışmalı
4. **URL değişir**: Ücretsiz versiyonda her başlatmada URL değişir. URL değiştiğinde Vercel'de environment variable'ı güncelle ve frontend'i yeniden deploy et.

## 🔧 Ngrok URL'si Değiştiğinde

1. Yeni URL'yi al (Ngrok penceresinden)
2. Vercel Dashboard -> Settings -> Environment Variables
3. `REACT_APP_API_BASE_URL` değerini güncelle
4. Frontend'i yeniden deploy et

## ✅ Test Et

### Backend Test:
```powershell
Invoke-WebRequest -Uri "https://xxxx.ngrok-free.app/health" -UseBasicParsing
```

### Email Servisi Test:
```powershell
$body = @{ email = "test@example.com"; username = "Test"; verifyUrl = "https://www.pornras.com/verify" } | ConvertTo-Json
Invoke-WebRequest -Uri "https://xxxx.ngrok-free.app/api/email/verification" -Method POST -Headers @{"Content-Type"="application/json"} -Body $body -UseBasicParsing
```

## 📝 Özet

**Yapılacaklar:**
1. ✅ Ngrok'u başlat (`npx ngrok http 5000`)
2. ✅ URL'yi al (Ngrok penceresinden)
3. ✅ Vercel'de `REACT_APP_API_BASE_URL` = Ngrok URL'si ekle
4. ✅ Frontend'i yeniden deploy et

**Hepsi bu kadar!** 🎉

## 🔄 LocalTunnel'dan Ngrok'a Geçiş

Eğer LocalTunnel kullanıyorsanız ve Ngrok'a geçmek istiyorsanız:

1. **LocalTunnel'ı durdur**: LocalTunnel penceresinde `Ctrl+C` yap
2. **Ngrok'u başlat**: `npx ngrok http 5000`
3. **Yeni URL'yi al**: Ngrok penceresinden URL'yi kopyala
4. **Vercel'de güncelle**: `REACT_APP_API_BASE_URL` = yeni Ngrok URL'si
5. **Frontend'i deploy et**: `cd client && vercel --prod`

**Hepsi bu kadar!** 🎉



