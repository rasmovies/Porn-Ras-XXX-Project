# Proton Mail SMTP Ayarları - Hızlı Kurulum

## 📋 Proton Mail'den Alınan Bilgiler

Proton Mail'den aldığınız SMTP bilgileri:

- ✅ **SMTP Kullanıcı Adı:** `info@pornras.com`
- ✅ **SMTP Kodu:** `LED4C43RUWSPLWCG` (Bu kod sadece bir kez gösterilir!)
- ✅ **SMTP Sunucu:** `smtp.protonmail.ch`
- ✅ **SMTP Bağlantı Noktası:** `587`
- ✅ **TLS/SSL:** TLS kullanılmalı (secure: false, port: 587)

## 🔧 Backend `.env` Dosyasını Güncelleyin

`server/.env` dosyasını oluşturun veya güncelleyin:

```env
PORT=5000

# Proton Mail SMTP Gönderimi
PROTON_SMTP_HOST=smtp.protonmail.ch
PROTON_SMTP_PORT=587
PROTON_SMTP_SECURE=false
PROTON_SMTP_USERNAME=info@pornras.com
PROTON_SMTP_PASSWORD=LED4C43RUWSPLWCG
PROTON_FROM_EMAIL=info@pornras.com
PROTON_FROM_NAME=PORNRAS
```

## ✅ Kurulum Adımları

### 1. Backend `.env` Dosyasını Güncelleyin

`server/.env` dosyasında yukarıdaki bilgileri ekleyin veya güncelleyin.

**Önemli:**
- `PROTON_SMTP_PASSWORD`: `LED4C43RUWSPLWCG` (Proton Mail'den aldığınız SMTP kodu)
- `PROTON_SMTP_USERNAME`: `info@pornras.com`
- `PROTON_SMTP_HOST`: `smtp.protonmail.ch`
- `PROTON_SMTP_PORT`: `587`
- `PROTON_SMTP_SECURE`: `false` (TLS için)

### 2. Backend'i Yeniden Başlatın

```bash
cd server
node server.js
```

### 3. Test Edin

Backend başladıktan sonra:

1. **Frontend'de yeni bir kullanıcı kaydedin**
2. **Doğrulama e-postası gönderilip gönderilmediğini kontrol edin**
3. **E-posta gelirse, kurulum başarılı!** ✅

## 🔍 Sorun Giderme

### Hata: "SMTP bağlantı hatası"

**Çözüm:**
- `PROTON_SMTP_HOST` değerini `smtp.protonmail.ch` olarak kontrol edin
- `PROTON_SMTP_PORT` değerini `587` olarak kontrol edin
- Firewall'ın 587 portunu engellemediğinden emin olun

### Hata: "Authentication failed"

**Çözüm:**
- `PROTON_SMTP_USERNAME` değerini `info@pornras.com` olarak kontrol edin
- `PROTON_SMTP_PASSWORD` değerini `LED4C43RUWSPLWCG` olarak kontrol edin
- SMTP kodunun doğru kopyalandığından emin olun (boşluk olmamalı)

### E-posta Gelmiyor

**Kontrol:**
1. Backend loglarında hata var mı?
2. SMTP ayarları doğru mu?
3. Proton Mail'de domain doğrulaması tamamlandı mı?
4. Spam klasörünü kontrol edin

## 📝 Notlar

- **SMTP Kodu:** Bu kod sadece bir kez gösterilir. Pencereyi kapattıysanız, yeni bir kod oluşturmanız gerekir.
- **Domain Doğrulaması:** Proton Mail'de domain doğrulaması (TXT kaydı) tamamlanmalıdır.
- **TLS/SSL:** Port 587 için TLS kullanılır (`secure: false`).

## 🎉 Başarılı Kurulum

Kurulum başarılı olduğunda:
- ✅ Backend başlatıldığında SMTP bağlantısı başarılı olacak
- ✅ Doğrulama e-postaları gönderilecek
- ✅ Davet e-postaları gönderilecek
- ✅ Marketing e-postaları gönderilecek

**Hepsi bu kadar!** 🎉

