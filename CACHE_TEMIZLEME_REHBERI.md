# Browser Cache Temizleme Rehberi

## 🔄 Sayfa Hala Aynı Görünüyorsa

Eğer yeni sayfa hala görünmüyorsa, browser cache'i temizlemeniz gerekiyor.

## ✅ Çözüm Adımları

### 1. Hard Refresh Yapın

**Chrome/Edge:**
- `Ctrl + Shift + R` (Windows/Linux)
- `Cmd + Shift + R` (Mac)
- Veya `Ctrl + F5`

**Firefox:**
- `Ctrl + Shift + R` (Windows/Linux)
- `Cmd + Shift + R` (Mac)

### 2. Developer Tools ile Cache'i Devre Dışı Bırakın

1. **F12** tuşuna basın (Developer Tools)
2. **Network** sekmesine gidin
3. **Disable cache** seçeneğini işaretleyin
4. Sayfayı yenileyin (`F5` veya `Ctrl + R`)

### 3. Incognito/Private Mode'da Test Edin

1. **Yeni bir incognito pencere açın**
   - Chrome/Edge: `Ctrl + Shift + N`
   - Firefox: `Ctrl + Shift + P`
2. **URL'yi test edin:**
   ```
   https://www.pornras.com/verify?token=test&email=test@example.com
   ```
3. **Eğer incognito'da çalışıyorsa**, browser cache sorunu var demektir.

### 4. Browser Cache'i Tamamen Temizleyin

**Chrome/Edge:**
1. `Ctrl + Shift + Delete` tuşlarına basın
2. **Time range:** "All time" seçin
3. **Cached images and files** seçeneğini işaretleyin
4. **Clear data** butonuna tıklayın
5. Browser'ı tamamen kapatın ve yeniden açın

**Firefox:**
1. `Ctrl + Shift + Delete` tuşlarına basın
2. **Time range:** "Everything" seçin
3. **Cache** seçeneğini işaretleyin
4. **Clear Now** butonuna tıklayın
5. Browser'ı tamamen kapatın ve yeniden açın

### 5. Site Ayarlarından Cache'i Temizleyin

**Chrome/Edge:**
1. Adres çubuğunda kilit simgesine tıklayın
2. **Site settings** seçeneğine tıklayın
3. **Clear data** butonuna tıklayın
4. Sayfayı yenileyin

### 6. Service Worker'ı Temizleyin (Eğer Varsa)

1. **F12** tuşuna basın (Developer Tools)
2. **Application** sekmesine gidin
3. **Service Workers** bölümüne gidin
4. **Unregister** butonuna tıklayın
5. Sayfayı yenileyin

## 🔍 Test Etme

### 1. URL'yi Doğru Test Edin

```
https://www.pornras.com/verify?token=test&email=test@example.com
```

### 2. Network Tab'ını Kontrol Edin

1. **F12** tuşuna basın
2. **Network** sekmesine gidin
3. Sayfayı yenileyin
4. `/verify` route'unun yüklendiğini kontrol edin
5. Status kodunun `200` olduğunu kontrol edin

### 3. Console'u Kontrol Edin

1. **F12** tuşuna basın
2. **Console** sekmesine gidin
3. Herhangi bir hata var mı kontrol edin
4. Route'un yüklendiğini kontrol edin

## ⚠️ Önemli Notlar

1. **Browser cache'i temizledikten sonra** sayfayı yeniden açın
2. **Incognito mode'da test edin** - eğer çalışıyorsa cache sorunu var demektir
3. **Vercel deployment'ın tamamlandığından emin olun** - deployment loglarını kontrol edin
4. **URL'yi doğru test edin** - `https://www.pornras.com/verify?token=...&email=...`

## ✅ Başarı Kriterleri

- ✅ `/verify` route'u yükleniyor
- ✅ Email doğrulama sayfası görünüyor
- ✅ Token ve email parametreleri alınıyor
- ✅ Başarı mesajı gösteriliyor
- ✅ 404 hatası yok

## 📝 Özet

**Yapmanız Gerekenler:**
1. ✅ Hard refresh yapın (`Ctrl + Shift + R`)
2. ✅ Incognito mode'da test edin
3. ✅ Browser cache'i temizleyin
4. ✅ Browser'ı tamamen kapatıp yeniden açın
5. ✅ URL'yi doğru test edin

**Hepsi bu kadar!** 🎉



