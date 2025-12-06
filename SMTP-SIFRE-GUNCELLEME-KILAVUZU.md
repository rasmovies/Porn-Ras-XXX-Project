# Proton Mail Bridge SMTP Şifre Güncelleme Kılavuzu

## Durum

- ✅ Port 1025 (SMTP): Açık ve Bridge dinliyor
- ✅ Port 1143 (IMAP): Açık ve Bridge dinliyor  
- ✅ Backend: Online ve port 1025 kullanıyor
- ❌ SMTP Şifresi: Yanlış veya güncel değil

Bridge hatası: `454 4.7.0 invalid username or password`

## Sorun

Proton Mail Bridge'in SMTP şifresi zamanla değişebilir veya `.env` dosyasındaki şifre güncel olmayabilir.

## Çözüm Adımları

### Yöntem 1: Bridge GUI'den Şifre Alma

1. Proton Mail Bridge uygulamasını açın
2. Settings → Bridge → SMTP/IMAP credentials bölümüne gidin
3. SMTP şifresini kopyalayın
4. VPS'te `.env` dosyasını güncelleyin:
   ```bash
   cd /var/www/adulttube-backend/server
   nano .env
   # PROTON_SMTP_PASSWORD değerini güncelleyin
   ```
5. Backend'i yeniden başlatın:
   ```bash
   pm2 restart adulttube-backend --update-env
   ```

### Yöntem 2: Bridge CLI'den Şifre Alma (VPS'te)

```bash
# Bridge'i durdur
systemctl stop protonmail-bridge

# Bridge CLI'yi başlat ve info komutunu çalıştır
protonmail-bridge --cli info

# SMTP bilgilerini not edin, Bridge'i tekrar başlat
systemctl start protonmail-bridge

# .env dosyasını güncelle
cd /var/www/adulttube-backend/server
nano .env
# PROTON_SMTP_PASSWORD değerini güncelleyin

# Backend'i yeniden başlat
pm2 restart adulttube-backend --update-env
```

### Yöntem 3: Bridge SMTP Şifresini Yeniden Generate Etme

Bridge GUI veya CLI'den yeni bir SMTP şifresi oluşturabilirsiniz. Yeni şifre oluşturduktan sonra `.env` dosyasını güncelleyin.

## Test

Şifreyi güncelledikten sonra test edin:

```bash
# Backend log'larını kontrol edin
pm2 logs adulttube-backend --lines 10

# Test email gönderimi yapın
curl -X POST http://localhost:5000/api/email/verification \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "username": "testuser",
    "verifyUrl": "https://www.pornras.com/verify?token=test123"
  }'
```

## Notlar

- Bridge SMTP şifresi, Proton Mail hesabınızın ana şifresinden farklıdır
- Şifre değiştikçe `.env` dosyasını güncellemeyi unutmayın
- Şifre özel karakterler içerebilir (`_`, `-`, vb.), escape edilmesine gerek yoktur
- Backend'i her şifre değişikliğinden sonra yeniden başlatın (`--update-env` ile)

## Şu Anki Yapılandırma

```
PROTON_SMTP_HOST=127.0.0.1
PROTON_SMTP_PORT=1025
PROTON_SMTP_SECURE=false
PROTON_SMTP_USERNAME=pornras@proton.me
PROTON_SMTP_PASSWORD=[GÜNCEL DEĞİL - BRIDGE'DEN ALINMALI]
PROTON_FROM_EMAIL=pornras@proton.me
PROTON_FROM_NAME=PORNRAS
```

