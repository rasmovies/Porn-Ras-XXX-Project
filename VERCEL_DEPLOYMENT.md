# Vercel Deployment Guide

Bu rehber, AdultTube uygulamasını Vercel'e deploy etmek için gerekli adımları açıklar.

## Ön Gereksinimler

1. **Vercel Hesabı**: [https://vercel.com](https://vercel.com) adresinden ücretsiz hesap oluşturun
2. **GitHub/GitLab/Bitbucket Hesabı**: Projenizi bir Git repository'de tutmanız gerekiyor
3. **Supabase Credentials**: Supabase URL ve Anon Key'iniz hazır olmalı

## Adım 1: Projeyi Git Repository'ye Yükleyin

```bash
# Projeyi Git repository'ye yükleyin (eğer henüz yapmadıysanız)
cd client
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin YOUR_GITHUB_REPO_URL
git push -u origin main
```

## Adım 2: Vercel'e Proje Ekleyin

### Seçenek 1: GitHub Integration (Önerilen)

1. [Vercel Dashboard](https://vercel.com/dashboard) → **Add New** → **Project**
2. GitHub/GitLab/Bitbucket ile bağlanın
3. Repository'nizi seçin
4. **Root Directory** olarak `client` klasörünü seçin
5. **Framework Preset**: Create React App otomatik algılanacak

### Seçenek 2: Vercel CLI

```bash
# Vercel CLI'yi global olarak yükleyin
npm i -g vercel

# Client klasörüne gidin
cd client

# Deploy edin
vercel

# Production için
vercel --prod
```

## Adım 3: Environment Variables Ekleme

Vercel Dashboard'da projenizi seçin → **Settings** → **Environment Variables**

Aşağıdaki environment variable'ları ekleyin:

```
REACT_APP_SUPABASE_URL=https://xgyjhofakpatrqgvleze.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhneWpob2Zha3BhdHJxZ3ZsZXplIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE0MjA2NDEsImV4cCI6MjA3Njk5NjY0MX0.RB2QQkjtXaM-GaH0HXP_B14BIDm0Y-MvlvDpOt7V1sQ
```

**ÖNEMLİ**: Her environment için (Production, Preview, Development) ayrı ayrı ekleyin.

## Adım 4: Build Ayarları

Vercel otomatik olarak algılar, ancak manuel ayar isterseniz:

- **Build Command**: `npm run build`
- **Output Directory**: `build`
- **Install Command**: `npm install`
- **Framework**: Create React App

## Adım 5: Deployment

1. Environment variable'ları ekledikten sonra **Deploy** butonuna tıklayın
2. Vercel otomatik olarak:
   - Dependencies'i yükler
   - Projeyi build eder
   - Deploy eder

## Adım 6: Domain Yapılandırması (Opsiyonel)

1. **Settings** → **Domains**
2. Custom domain ekleyebilirsiniz veya Vercel'in verdiği URL'i kullanabilirsiniz

## Sorun Giderme

### Build Hatası
- Environment variable'ların doğru eklendiğinden emin olun
- `npm run build` komutunu lokal olarak test edin

### Routing Sorunları
- `vercel.json` dosyasındaki rewrites kuralını kontrol edin
- Tüm route'lar `index.html`'e yönlendiriliyor olmalı

### Environment Variables
- Production, Preview ve Development için ayrı ayrı eklenmiş olmalı
- Variable isimleri `REACT_APP_` ile başlamalı

## Önemli Notlar

⚠️ **Yetişkin İçerik Politikası**: Vercel'in yetişkin içerik politikasını kontrol edin. Yetişkin içerikli siteler için Vercel kullanım şartlarını ihlal edebilir.

📝 **Alternatif Hosting**: Eğer Vercel yetişkin içeriğe izin vermezse, alternatif hosting seçenekleri:
- **Railway.app**: Yetişkin içeriğe izin verir
- **Render.com**: Yetişkin içeriğe izin verir
- **Cloudflare Pages**: Politikalarını kontrol edin
- **DigitalOcean App Platform**: Yetişkin içeriğe izin verir

## Otomatik Deployment

GitHub ile bağladıysanız:
- Her `push` otomatik olarak yeni bir deployment oluşturur
- Pull request'ler için preview URL'leri oluşturur
- Production branch'i (`main`) otomatik olarak production'a deploy edilir

