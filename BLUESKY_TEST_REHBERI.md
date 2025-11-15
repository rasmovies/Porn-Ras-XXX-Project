# Bluesky API Test Rehberi

## 🔧 Kurulum

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
- `BLUESKY_HANDLE`: Bluesky kullanıcı adınız (örnek: `pornras.bsky.social` veya `@pornras.bsky.social`)
- `BLUESKY_PASSWORD`: App Password (normal şifreniz değil!)

### 3. Backend Paketlerini Yükleyin

```bash
cd server
npm install
```

## 🧪 Test Etme

### Yöntem 1: Test Scripti (Önerilen)

```bash
cd server
node test-bluesky.js
```

Bu script:
1. Environment variables'ları kontrol eder
2. Bluesky'e bağlanır
3. Basit bir post gönderir
4. Video paylaşımı test eder

### Yöntem 2: Backend'i Başlat ve Manuel Test

```bash
cd server
node server.js
```

Backend başladıktan sonra:

**Test 1: Basit Post**
```bash
curl -X POST http://localhost:5000/api/bluesky/post \
  -H "Content-Type: application/json" \
  -d '{
    "text": "🧪 Test postu - Bluesky API",
    "linkUrl": "https://www.pornras.com"
  }'
```

**Test 2: Video Paylaşımı**
```bash
curl -X POST http://localhost:5000/api/bluesky/share-video \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Video",
    "description": "Bu bir test video açıklamasıdır.",
    "thumbnail": "https://via.placeholder.com/400x225/ff6b6b/ffffff?text=Test+Video",
    "slug": "test-video"
  }'
```

### Yöntem 3: Frontend'den Test

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

### Hata: "Cannot find module '@atproto/api'"

**Çözüm:** 
```bash
cd server
npm install
```

### Post yayınlanmıyor

**Kontrol edin:**
1. Backend loglarında hata var mı?
2. `server/.env` dosyası doğru mu?
3. Bluesky App Password geçerli mi?
4. Network tab'ında API isteği başarılı mı?

## 📝 Notlar

- Bluesky post'ları **otomatik** olarak yayınlanır (video yüklendiğinde)
- Post başarısız olsa bile video yükleme işlemi devam eder (non-blocking)
- Görsel yükleme başarısız olursa sadece metin gönderilir
- Post içeriği: Video başlığı + açıklama (ilk 200 karakter) + video linki

**Hepsi bu kadar!** 🎉


