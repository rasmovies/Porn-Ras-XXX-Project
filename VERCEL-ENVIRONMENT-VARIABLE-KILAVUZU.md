# 📋 Vercel Environment Variable Ekleme Kılavuzu

## 🎯 Hangi Projede?

**FRONTEND (CLIENT) PROJESİNE** ekleyeceksiniz!

- ✅ **Frontend projesi:** `client/` klasörü (React uygulaması)
- ❌ **Backend projesi DEĞİL:** `server/` klasörü (VPS'de çalışıyor)

---

## 🔍 Vercel'de Projeyi Bulma

### Yöntem 1: Domain'e Göre Bulma
1. Vercel Dashboard → https://vercel.com/dashboard
2. Projeler listesinde **`www.pornras.com`** domain'ine sahip projeyi bulun
3. Bu proje **FRONTEND** projesidir

### Yöntem 2: Proje Adına Göre Bulma
Vercel'de proje adı şunlardan biri olabilir:
- `porn-ras`
- `pornras`
- `adulttube`
- `pornras-frontend`
- `pornras-client`

**Hangi proje?** → Domain'i **`www.pornras.com`** olan proje!

---

## 📝 Adım Adım Environment Variable Ekleme

### 1. Vercel Dashboard'a Giriş
- https://vercel.com/dashboard
- Giriş yapın

### 2. Frontend Projesini Seçin
- Projeler listesinde **`www.pornras.com`** domain'ine sahip projeyi bulun
- Projeye tıklayın

### 3. Settings → Environment Variables
- Sol menüden **"Settings"** seçin
- **"Environment Variables"** sekmesine tıklayın

### 4. Yeni Variable Ekle
**"Add New"** butonuna tıklayın ve şunları girin:

| Alan | Değer |
|------|-------|
| **Key** | `REACT_APP_API_BASE_URL` |
| **Value** | `https://api.pornras.com` |
| **Environment** | ✅ Production<br>✅ Preview<br>✅ Development |

**ÖNEMLİ:** 
- Key'de **büyük/küçük harf** önemli: `REACT_APP_API_BASE_URL` (tam olarak böyle)
- Value'da **https://** ile başlamalı: `https://api.pornras.com`
- Environment'ların **hepsini** seçin (Production, Preview, Development)

### 5. Kaydet
- **"Save"** butonuna tıklayın

### 6. Deployment'i Yeniden Başlat
- **"Deployments"** sekmesine gidin
- En son deployment'in yanındaki **"..."** (üç nokta) menüsüne tıklayın
- **"Redeploy"** seçin
- Veya yeni bir commit push edin

---

## ✅ Kontrol

### Environment Variable Kontrolü:
1. Settings → Environment Variables
2. `REACT_APP_API_BASE_URL` listede görünmeli
3. Value: `https://api.pornras.com` olmalı

### Site'de Test:
1. https://www.pornras.com adresine gidin
2. Email verification formunu test edin
3. Browser console'da hata olmamalı
4. Network tab'da `https://api.pornras.com` istekleri görünmeli

---

## ⚠️ Önemli Notlar

1. **Backend projesine EKLEMEYİN:**
   - Backend VPS'de çalışıyor, Vercel'de değil
   - Sadece **frontend** projesine ekleyin

2. **Environment Variable Değişikliği:**
   - Environment variable ekledikten sonra **mutlaka** deployment'i yeniden başlatın
   - Yeni build'de environment variable kullanılır

3. **Build Time Variable:**
   - `REACT_APP_*` prefix'i önemli
   - React build zamanında bu değişkenleri kullanır
   - Runtime'da değiştirilemez

---

## 🆘 Sorun Giderme

### Environment Variable Görünmüyor:
- Deployment'i yeniden başlatın
- Build loglarını kontrol edin
- Key'in doğru yazıldığından emin olun: `REACT_APP_API_BASE_URL`

### Hala Hata Alıyorsanız:
1. Browser console'u kontrol edin
2. Network tab'da istekleri kontrol edin
3. Backend loglarını kontrol edin: `pm2 logs adulttube-backend`

---

## 📸 Görsel Rehber

```
Vercel Dashboard
├── Projects
│   └── [www.pornras.com] ← BU PROJEYE TIKLAYIN
│       ├── Settings
│       │   └── Environment Variables ← BURAYA GİRİN
│       │       └── Add New
│       │           ├── Key: REACT_APP_API_BASE_URL
│       │           ├── Value: https://api.pornras.com
│       │           └── Environment: ✅ Production, ✅ Preview, ✅ Development
│       └── Deployments
│           └── [Son Deployment] → ... → Redeploy
```

---

## ✅ Özet

**Hangi Proje?** → **Frontend projesi** (www.pornras.com domain'ine sahip)

**Ne Eklenecek?**
- Key: `REACT_APP_API_BASE_URL`
- Value: `https://api.pornras.com`
- Environment: Production, Preview, Development (hepsi)

**Sonra Ne Yapılacak?** → Deployment'i yeniden başlatın!


