# Vercel Otomatik Deployment Rehberi

Siteniz Vercel'de çalışıyor. Güncellemeleri otomatik olarak Vercel'e yüklemek için:

## Yöntem 1: GitHub Push ile Otomatik Deployment (Önerilen)

Vercel, GitHub repository'nize bağlıysa, her push otomatik olarak yeni bir deployment oluşturur.

### Nasıl Çalışır:
1. Kodunuzu lokal olarak güncelleyin
2. Değişiklikleri commit edin
3. GitHub'a push yapın
4. Vercel otomatik olarak yeni deployment başlatır

### Komutlar:
```bash
cd C:\Users\User\Desktop\adulttube\client

# Değişiklikleri ekleyin
git add .

# Commit edin
git commit -m "Yapılan güncellemelerin açıklaması"

# GitHub'a push yapın
git push origin main
```

### Vercel Dashboard'da Kontrol:
1. **Vercel Dashboard** → Projenizi seçin
2. **Deployments** sekmesine gidin
3. En üstte son deployment'ı göreceksiniz:
   - ✅ **Yeşil tik**: Deployment başarılı
   - ⏳ **Mavi daire**: Deployment devam ediyor
   - ❌ **Kırmızı X**: Deployment başarısız
4. **"..."** menüsüne tıklayarak deployment detaylarını görebilirsiniz
5. Her GitHub push otomatik olarak yeni bir deployment oluşturur

### Push Sonrası Ne Olur? (Adım Adım):
1. ✅ **GitHub'a push yapın**: `git push origin main`
2. ✅ **GitHub webhook tetiklenir**: GitHub, Vercel'e yeni commit olduğunu bildirir
3. ✅ **Vercel deployment başlatır**: Dashboard'da yeni deployment görünür
4. ✅ **Build başlar**: Vercel dependencies yükler ve projeyi build eder
5. ✅ **Deploy edilir**: Başarılı olursa siteniz otomatik güncellenir
6. ✅ **Size bildirim gelir**: Email ve Dashboard'da bildirim görürsünüz

**⏱️ Süre**: Genellikle 2-5 dakika arası sürer

## Yöntem 2: Vercel CLI ile Manuel Deployment

GitHub kullanmak istemiyorsanız veya hızlı test için:

```bash
# Vercel CLI'yi global olarak yükleyin (eğer yüklü değilse)
npm install -g vercel

# Client klasörüne gidin
cd C:\Users\User\Desktop\adulttube\client

# Deploy edin
vercel --prod
```

## Yöntem 3: Vercel Dashboard'dan Manuel Redeploy

1. Vercel Dashboard → Projeniz
2. **Deployments** sekmesi
3. Son deployment'ın yanındaki **"..."** menüsüne tıklayın
4. **"Redeploy"** seçin

## Otomatik Deployment Ayarlarını Kontrol Etme

Eğer GitHub push'ları otomatik deploy olmuyorsa, aşağıdaki adımları kontrol edin:

### 1. GitHub Integration Kontrolü (ÖNEMLİ!)
1. **Vercel Dashboard** → **Settings** (solda)
2. **Git** sekmesine tıklayın
3. **Connected Git Repository** bölümünü kontrol edin
   - ✅ GitHub repository'nizin göründüğünden emin olun
   - ❌ Eğer görünmüyorsa, **"Connect Git Repository"** butonuna tıklayın
   - Repository'nizi seçin ve **"Import"** butonuna tıklayın

### 2. Production Branch Ayarları
1. **Settings** → **Git** sekmesi
2. **Production Branch** bölümünü kontrol edin:
   - Değer: `main` veya `master` olmalı
   - Eğer farklıysa, dropdown'dan `main` seçin
3. ✅ Bu branch'e yapılan push'lar otomatik olarak production'a deploy edilir

### 3. Automatic Deployments Ayarları
1. **Settings** → **Git** sekmesi
2. **Automatic deployments** bölümünü kontrol edin:
   - ✅ **"Automatically deploy new commits"** AÇIK olmalı
   - ✅ **"Automatically deploy pull requests"** AÇIK olmalı (opsiyonel)
3. Eğer kapalıysa, toggle'ı açın

### 4. GitHub Webhook Kontrolü
1. **GitHub Repository** → **Settings** → **Webhooks** sekmesi
2. `vercel.com` webhook'unun olduğunu kontrol edin
3. Eğer yoksa, Vercel otomatik oluşturmalı (bazen gecikebilir)

### 5. Repository Erişim İzni Kontrolü
1. **Vercel Dashboard** → **Settings** → **General**
2. GitHub bağlantısını kontrol edin
3. **Vercel GitHub App** veya **OAuth App** izinlerini kontrol edin
   - Gerekirse **"Reconnect"** butonuna tıklayın

### 6. Manuel Test Deployment
1. **Vercel Dashboard** → **Deployments** sekmesi
2. **"Redeploy"** butonuna tıklayın
3. Deployment başarılı olursa, build sistemi çalışıyor demektir
4. Sorun GitHub integration'da olabilir

## Environment Variables Güncelleme

Yeni environment variable eklemeniz gerekiyorsa:

1. Vercel Dashboard → Projeniz → **Settings**
2. **Environment Variables** sekmesi
3. Yeni variable ekleyin veya mevcut olanları güncelleyin
4. **Redeploy** gerekebilir (yeni variable'lar için)

## Pull Request Preview'ları

GitHub'da pull request açarsanız:
- Vercel otomatik olarak preview URL oluşturur
- Her PR için ayrı preview deployment oluşturur
- PR merge edildiğinde otomatik production'a deploy edilir

## Sorun Giderme

### Deployment Otomatik Olmuyorsa - Adım Adım Kontrol:

**Adım 1: GitHub'a Push Yaptınız mı?**
```bash
# Terminal'de kontrol edin:
git status
# Eğer "Your branch is up to date with 'origin/main'" görüyorsanız, push yapılmış demektir
```

**Adım 2: Vercel Dashboard'da Kontrol**
1. Vercel Dashboard → Projeniz → **Deployments** sekmesi
2. Son deployment'ın ne zaman oluşturulduğunu kontrol edin
3. Yeni bir push sonrası yeni deployment görünmüyorsa → **Adım 3'e** gidin

**Adım 3: Settings Kontrolü**
1. **Settings** → **Git** sekmesi
2. **Connected Git Repository**: Repository görünüyor mu?
   - ❌ **YOKSA**: **"Connect Git Repository"** → Repository seç → **"Import"**
   - ✅ **VARSA**: **Adım 4'e** gidin

**Adım 4: Production Branch Kontrolü**
1. **Settings** → **Git** → **Production Branch**
2. Değer `main` mi? (veya `master`)
   - ❌ **DEĞİLSE**: Dropdown'dan `main` seçin
   - ✅ **EVETSE**: **Adım 5'e** gidin

**Adım 5: Automatic Deployments Kontrolü**
1. **Settings** → **Git** → **Automatic Deployments**
2. **"Automatically deploy new commits"** AÇIK mı?
   - ❌ **KAPALIYSA**: Toggle'ı açın
   - ✅ **AÇIKSA**: **Adım 6'ya** gidin

**Adım 6: Manuel Trigger Test**
1. Küçük bir değişiklik yapın (örn: bir dosyaya yorum ekleyin)
2. Commit ve push yapın:
   ```bash
   git add .
   git commit -m "Test: trigger deployment"
   git push origin main
   ```
3. Vercel Dashboard → **Deployments** sekmesini yenileyin (F5)
4. Yeni bir deployment görünüyor mu?
   - ✅ **EVET**: Sistem çalışıyor! Önceki push'lar başka bir sorundan kaynaklanıyor olabilir
   - ❌ **HAYIR**: **Adım 7'ye** gidin

**Adım 7: GitHub Webhook Kontrolü**
1. GitHub Repository → **Settings** → **Webhooks**
2. `vercel.com` webhook'u var mı?
   - ❌ **YOKSA**: Vercel'e tekrar repository bağlayın (Adım 3)
   - ✅ **VARSA**: Webhook'a tıklayın → **Recent Deliveries** sekmesi
   - Son delivery'ye tıklayın → Response'u kontrol edin
   - 200 OK görüyorsanız, webhook çalışıyor demektir

**Adım 8: Vercel GitHub App İzni Kontrolü**
1. Vercel Dashboard → **Settings** → **General** → **Git**
2. **"Reconnect GitHub"** veya **"Configure"** butonuna tıklayın
3. GitHub'da izinleri kontrol edin:
   - Repository access izni olmalı
   - Webhook oluşturma izni olmalı

### Build Hatası:
1. **Deployments** sekmesinde hata detaylarını kontrol edin
2. Lokal olarak `npm run build` çalıştırın
3. Environment variables'ı kontrol edin

### Değişiklikler Gözükmüyor:
1. Build başarılı mı kontrol edin
2. Cache temizlemeyi deneyin
3. Browser cache'i temizleyin (Ctrl+F5)

