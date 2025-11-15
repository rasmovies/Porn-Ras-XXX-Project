# Proton Mail SMTP Gönderimi Kurulumu

## ✅ Kısa Cevap

**Evet!** Proton Mail'in "SMTP gönderimi" özelliği ile siteye bağlanabilirsiniz. Bu, Proton Bridge'den **çok daha kolay** bir çözümdür.

## 🎯 Proton Mail SMTP Gönderimi Nedir?

Proton Mail'in "SMTP gönderimi" özelliği, üçüncü taraf servislerin (web siteniz, uygulamanız) Proton Mail üzerinden özel domain adreslerinizle email göndermesine olanak tanır.

## ✅ Avantajlar

- ✅ **Çok kolay kurulum** - Kod oluştur, ayarları yap, kullan
- ✅ **VPS gerekmez** - Herhangi bir sunucuda çalışır
- ✅ **Proton Bridge gerekmez** - Direkt SMTP kullanımı
- ✅ **Güvenli** - Proton Mail'in güvenlik özellikleri
- ✅ **Özel domain desteği** - Kendi domain'inizle email gönderebilirsiniz

## 🚀 Kurulum Adımları

### Adım 1: Proton Mail'de SMTP Kodu Oluştur

1. **Proton Mail'e giriş yapın**: https://mail.proton.me
2. **Ayarlar** → **Güvenlik ve gizlilik** → **IMAP/SMTP** sekmesine gidin
3. **"SMTP gönderimi"** bölümüne gidin
4. **"Kod oluştur"** butonuna tıklayın
5. **Kod adı** girin (örnek: "PORNRAS Website")
6. **E-posta adresi** seçin (örnek: `pornras@proton.me` veya özel domain)
7. **Kodu oluşturun**

### Adım 2: SMTP Bilgilerini Alın

Kod oluşturulduktan sonra şu bilgileri alacaksınız:
- **SMTP Host**: `mail.proton.me` (veya belirtilen host)
- **SMTP Port**: `587` (TLS) veya `465` (SSL)
- **Username**: Oluşturduğunuz kod adı veya email
- **Password**: Oluşturduğunuz SMTP kodu/şifresi

### Adım 3: Backend Yapılandırması

`server/.env` dosyasını güncelleyin:

```env
# Proton Mail SMTP Gönderimi
PROTON_SMTP_HOST=mail.proton.me
PROTON_SMTP_PORT=587
PROTON_SMTP_SECURE=false  # TLS için false, SSL için true
PROTON_SMTP_USERNAME=pornras@proton.me  # veya kod adı
PROTON_SMTP_PASSWORD=your-smtp-code-here  # Oluşturduğunuz SMTP kodu
PROTON_FROM_EMAIL=pornras@proton.me
PROTON_FROM_NAME=PORNRAS
```

### Adım 4: Backend'i Güncelle

`server/services/emailService.js` dosyası zaten Proton Mail SMTP kullanıyor, sadece environment variable'ları güncelleyin.

### Adım 5: Test Et

```bash
# Backend'i başlat
cd server
node server.js

# Test email gönder
curl -X POST http://localhost:5000/api/email/verification \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","username":"Test","verifyUrl":"https://www.pornras.com/verify"}'
```

## 📋 Önemli Notlar

1. **SMTP Kodu Güvenliği**: SMTP kodunu güvenli bir yerde saklayın (environment variable olarak)
2. **Port Seçimi**: 
   - Port `587` (TLS) → `PROTON_SMTP_SECURE=false`
   - Port `465` (SSL) → `PROTON_SMTP_SECURE=true`
3. **Özel Domain**: Özel domain kullanıyorsanız, domain'in Proton Mail'de doğrulanmış olması gerekir
4. **Rate Limiting**: Proton Mail'in rate limit'leri olabilir, kontrol edin

## 🔄 Proton Bridge vs SMTP Gönderimi

| Özellik | Proton Bridge | SMTP Gönderimi |
|---------|---------------|----------------|
| **Kurulum** | ⚠️ Zor (GUI gerekir) | ✅ Kolay (kod oluştur) |
| **VPS Gerekir** | ✅ Evet (localhost) | ❌ Hayır |
| **Kullanım** | Desktop uygulaması | API/SMTP |
| **Özel Domain** | ✅ Var | ✅ Var |
| **Güvenlik** | ✅ Çok iyi | ✅ İyi |

## ✅ Sonuç

**Proton Mail SMTP Gönderimi** kullanarak:
- ✅ VPS gerekmez
- ✅ Proton Bridge gerekmez
- ✅ Herhangi bir sunucuda çalışır (Vercel, vb.)
- ✅ Kolay kurulum
- ✅ Güvenli

**Bu çözüm, Proton Bridge'den çok daha kolay ve pratik!**

## 📝 Adımlar Özeti

1. ✅ Proton Mail'de SMTP kodu oluştur
2. ✅ SMTP bilgilerini al (host, port, username, password)
3. ✅ Backend `.env` dosyasını güncelle
4. ✅ Backend'i test et
5. ✅ Production'da kullan

**Hepsi bu kadar!** 🎉



