# 🧪 Bluesky API Test Rehberi

## 📋 Ön Hazırlık

### 1. Bluesky App Password Oluşturun

1. **Bluesky hesabınıza giriş yapın**: https://bsky.app
2. **Ayarlar** → **Uygulama Şifreleri** (App Passwords) bölümüne gidin
3. **"Yeni Şifre Oluştur"** (Create App Password) butonuna tıklayın
4. **Şifre adı** girin (örnek: "PORNRAS Website")
5. **Şifreyi oluşturun** ve **kopyalayın** (sadece bir kez gösterilir!)

### 2. Backend `.env` Dosyasını Oluşturun

`server/.env` dosyasını oluşturun veya güncelleyin:

```env
PORT=5000

# Bluesky API Ayarları
BLUESKY_HANDLE=pornras.bsky.social
BLUESKY_PASSWORD=your-app-password-here
```

**Önemli:**
- `BLUESKY_HANDLE`: Bluesky kullanıcı adınız (örnek: `pornras.bsky.social`)
- `BLUESKY_PASSWORD`: App Password (normal şifreniz değil!)

## 🧪 Test Adımları

### Adım 1: Test Scripti Çalıştırın

```bash
cd server
node test-bluesky.js
```

Bu script:
- ✅ Environment variables'ları kontrol eder
- ✅ Bluesky'e bağlanır
- ✅ Basit bir post gönderir
- ✅ Video paylaşımı test eder

### Adım 2: Backend'i Başlatın

```bash
cd server
node server.js
```

Backend başladığında şu mesajı görmelisiniz:
```
✅ Bluesky bağlantısı başarılı: pornras.bsky.social
Server running on port 5000
```

### Adım 3: Frontend'den Test Edin

1. Frontend'de yeni bir video yükleyin
2. Video başarıyla yüklendikten sonra Bluesky profilinizi kontrol edin
3. Post otomatik olarak yayınlanmış olmalı

## ✅ Başarılı Test Kontrolü

1. ✅ Backend başlatıldığında "Bluesky bağlantısı başarılı" mesajı görünüyor
2. ✅ Test scripti başarıyla çalışıyor
3. ✅ Bluesky'de post görünüyor
4. ✅ Post içeriği doğru (başlık, açıklama, link, thumbnail)

## 🔧 Sorun Giderme

### Hata: "BLUESKY_HANDLE ve BLUESKY_PASSWORD environment variable'ları ayarlanmalı"

**Çözüm:** `server/.env` dosyasında `BLUESKY_HANDLE` ve `BLUESKY_PASSWORD` değerlerini kontrol edin.

### Hata: "Bluesky bağlantı hatası: Invalid identifier or password"

**Çözüm:** 
- App Password'un doğru olduğundan emin olun (normal şifreniz değil!)
- Handle formatını kontrol edin (örnek: `pornras.bsky.social`)

## 📝 Notlar

- Bluesky post'ları **otomatik** olarak yayınlanır (video yüklendiğinde)
- Post başarısız olsa bile video yükleme işlemi devam eder (non-blocking)
- Görsel yükleme başarısız olursa sadece metin gönderilir

**Hepsi bu kadar!** 🎉


