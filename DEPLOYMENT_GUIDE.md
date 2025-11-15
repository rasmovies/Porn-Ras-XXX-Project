# Site Yayınlama Rehberi (Deployment Guide)

## Adım 1: Hosting Servisi Seçin

### Ücretsiz Seçenekler:
- **Vercel** (Önerilen) - https://vercel.com
- **Netlify** - https://netlify.com
- **GitHub Pages** - https://pages.github.com

### Ücretli Seçenekler:
- **AWS** (S3 + CloudFront)
- **DigitalOcean**
- **Firebase Hosting**

## Adım 2: Domain Alın (Opsiyonel)

### Domain Satıcıları:
- Namecheap
- GoDaddy
- Google Domains
- Cloudflare Registrar

### Maliyet:
- .com domain: ~$10-15/yıl
- .org domain: ~$10-20/yıl
- Yenileme ücretleri genelde aynı fiyattadır

## Adım 3: Supabase Ayarları

### Production URL'leri ekleyin:
1. Supabase Dashboard → Settings → API
2. URL Restrictions'e sitenizin domain'ini ekleyin
3. Rate limiting ayarlarını yapın

## Adım 4: Environment Variables

### Production için .env dosyası:
```env
REACT_APP_SUPABASE_URL=https://xgyjhofakpatrqgvleze.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your_anon_key_here
NODE_ENV=production
```

### Not: 
- **Kesinlikle** API key'leri hardcoded olarak commit etmeyin
- Git'e eklemeyin (.gitignore'da .env olmalı)
- Hosting servisine environment variables olarak ekleyin

## Adım 5: Build Alın

```bash
cd client
npm run build
```

Bu komut `client/build` klasörü oluşturur.

## Adım 6: Hosting'e Deploy Edin

### Vercel ile Deploy:
```bash
npm install -g vercel
vercel login
cd client
vercel
```

### Netlify ile Deploy:
1. Netlify sitesine gidin
2. "Add new site" → "Deploy manually"
3. `client/build` klasörünü sürükleyip bırakın

### GitHub Pages ile Deploy:
1. Repository oluşturun
2. GitHub Actions ile otomatik deploy ayarlayın
3. Settings → Pages'den deploy edin

## Adım 7: Domain Bağlama

### DNS Ayarları:
1. Hosting servisinizde custom domain ekleyin
2. Domain satıcınızdan nameserver'ları değiştirin veya
3. DNS kayıtlarını (A, CNAME) ekleyin

### SSL Sertifikası:
- Vercel, Netlify gibi servisler otomatik SSL verir
- Genelde 1-2 saat içinde aktif olur

## Adım 8: Güvenlik Kontrolleri

### Yapılması Gerekenler:
- [ ] Supabase RLS policies test edildi
- [ ] API key'ler environment variables'a eklendi
- [ ] CORS ayarları doğru yapıldı
- [ ] Rate limiting aktif
- [ ] HTTPS zorunlu
- [ ] Admin panel korunuyor

## Adım 9: İlk Testler

### Kontrol Edilecekler:
- [ ] Ana sayfa yükleniyor
- [ ] Video oynatma çalışıyor
- [ ] Login/Register çalışıyor
- [ ] Admin panel'e erişim korunuyor
- [ ] Upload çalışıyor
- [ ] Mobil görünüm test edildi

## Sorun Giderme

### Build Hatası:
```bash
npm run build --verbose
# Detaylı hata mesajı gösterir
```

### Environment Variables Çalışmıyor:
- Hosting servisinde değişkenlerin doğru eklendiğini kontrol edin
- Build sonrası tekrar deneyin

### API Hatası:
- Supabase URL restrictions kontrolü
- CORS ayarları kontrolü
- API key'in doğru olduğunu kontrol edin

## Maliyet Tahmini (Aylık)

### Basit Başlangıç (Ücretsiz):
- Hosting: $0 (Vercel ücretsiz plan)
- Domain: $0-1 (ücretsiz subdomain)
- Supabase: $0 (gratis plan)
- **Toplam: $0-1/ay**

### Orta Seviye:
- Hosting: $20/ay (Vercel Pro)
- Domain: ~$1/ay ($12/yıl)
- Supabase: $25/ay (Pro plan)
- **Toplam: ~$46/ay**

### İleri Seviye:
- Hosting: $50-100/ay
- Domain: ~$2/ay (çoklu domain)
- Supabase: $59/ay (Team plan)
- **Toplam: ~$111-161/ay**

## Destek

Sorun yaşarsanız:
1. Hosting servisinin dökümanlarına bakın
2. Supabase dökümanlarına bakın
3. Stack Overflow'da araştırın



