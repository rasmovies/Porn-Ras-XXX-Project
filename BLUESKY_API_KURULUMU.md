# Bluesky API Entegrasyonu Kurulumu

## ✅ Özellikler

- Yeni video yüklendiğinde otomatik olarak Bluesky'de post yayınlanır
- Video başlığı, açıklama, thumbnail ve link içerir
- Görsel desteği (thumbnail otomatik yüklenir)

## 🚀 Kurulum Adımları

### Adım 1: Bluesky App Password Oluştur

1. **Bluesky hesabınıza giriş yapın**: https://bsky.app
2. **Ayarlar** → **Uygulama Şifreleri** (App Passwords) bölümüne gidin
3. **"Yeni Şifre Oluştur"** (Create App Password) butonuna tıklayın
4. **Şifre adı** girin (örnek: "PORNRAS Website")
5. **Şifreyi oluşturun** ve **kopyalayın** (sadece bir kez gösterilir!)

### Adım 2: Environment Variables Ayarla

`server/.env` dosyasını oluşturun veya güncelleyin:

```env
# Bluesky API Ayarları
BLUESKY_HANDLE=pornras.bsky.social  # Bluesky kullanıcı adınız (handle)
BLUESKY_PASSWORD=your-app-password-here  # Oluşturduğunuz App Password
```

**Önemli:**
- `BLUESKY_HANDLE`: Bluesky kullanıcı adınız (örnek: `pornras.bsky.social` veya `@pornras.bsky.social`)
- `BLUESKY_PASSWORD`: App Password (normal şifreniz değil!)

### Adım 3: Backend Paketlerini Yükle

```bash
cd server
npm install
```

Bu komut `@atproto/api` paketini yükleyecektir.

### Adım 4: Backend'i Başlat

```bash
cd server
node server.js
```

Backend başarıyla başladığında şu mesajı görmelisiniz:
```
✅ Bluesky bağlantısı başarılı: pornras.bsky.social
Server running on port 5000
```

### Adım 5: Test Et

1. Frontend'de yeni bir video yükleyin
2. Video başarıyla yüklendikten sonra Bluesky profilinizi kontrol edin
3. Post otomatik olarak yayınlanmış olmalı

## 📋 API Endpoints

### POST `/api/bluesky/share-video`

Yeni video paylaşımı için kullanılır (otomatik olarak `Upload.tsx` tarafından çağrılır).

**Request Body:**
```json
{
  "title": "Video Başlığı",
  "description": "Video açıklaması",
  "thumbnail": "https://example.com/thumbnail.jpg",
  "slug": "video-slug"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Video Bluesky'de paylaşıldı",
  "data": {
    "uri": "at://did:plc:.../app.bsky.feed.post/...",
    "cid": "..."
  }
}
```

### POST `/api/bluesky/post`

Genel post yayınlamak için kullanılır.

**Request Body:**
```json
{
  "text": "Post metni",
  "imageUrl": "https://example.com/image.jpg",  // Opsiyonel
  "linkUrl": "https://example.com"  // Opsiyonel
}
```

## 🔧 Sorun Giderme

### Hata: "BLUESKY_HANDLE ve BLUESKY_PASSWORD environment variable'ları ayarlanmalı"

**Çözüm:** `server/.env` dosyasında `BLUESKY_HANDLE` ve `BLUESKY_PASSWORD` değerlerini kontrol edin.

### Hata: "Bluesky bağlantı hatası: Invalid identifier or password"

**Çözüm:** 
- App Password'un doğru olduğundan emin olun (normal şifreniz değil!)
- Handle formatını kontrol edin (örnek: `pornras.bsky.social` veya `@pornras.bsky.social`)

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

## ✅ Başarılı Kurulum Kontrolü

1. ✅ Backend başlatıldığında "Bluesky bağlantısı başarılı" mesajı görünüyor
2. ✅ Yeni video yüklendiğinde Bluesky'de post görünüyor
3. ✅ Post içeriği doğru (başlık, açıklama, link, thumbnail)

**Hepsi bu kadar!** 🎉


