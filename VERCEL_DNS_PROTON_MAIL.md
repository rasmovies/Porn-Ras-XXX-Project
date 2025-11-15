# Vercel DNS - Proton Mail TXT Kaydı Ekleme

## 🔍 Durum Analizi

- **Domain:** pornras.com
- **Nameserver'lar:** Vercel (ns1.vercel-dns.com, ns2.vercel-dns.com)
- **Proton Mail TXT Kaydı:** Vercel'e eklenmeli

## 📋 Adımlar

### 1. Vercel Dashboard'a Giriş Yapın

1. **Vercel Dashboard'a gidin:** https://vercel.com/dashboard
2. **Projenizi seçin:** porn-ras-xxx-project
3. **Settings** → **Domains** sekmesine tıklayın

### 2. Domain'i Seçin

1. **pornras.com** domain'ini seçin
2. **DNS Records** bölümüne gidin

### 3. Proton Mail TXT Kaydını Ekleyin

1. **"Add Record"** butonuna tıklayın
2. **Record Type:** `TXT` seçin
3. **Name:** `@` (root domain için) veya boş bırakın
4. **Value:** `protonmail-verification=a5b1b5104646bb02d...` (Proton Mail'den aldığınız değer)
5. **TTL:** `3600` (1 saat) veya `Auto`
6. **"Save"** butonuna tıklayın

### 4. Spaceship'ten Kaldırın (Gerekirse)

Eğer Spaceship'e eklediyseniz:
1. **Spaceship Dashboard'a gidin**
2. **DNS Records** bölümüne gidin
3. **Proton Mail TXT kaydını silin** (artık kullanılmıyor)

### 5. Doğrulama

1. **Proton Mail Dashboard'a gidin**
2. **Domain verification** bölümüne gidin
3. **"Verify"** butonuna tıklayın
4. DNS propagation için 5 dakika - 1 saat bekleyin

## 🔍 DNS Kontrolü

### Terminal ile Kontrol

```bash
# TXT kaydı kontrolü
nslookup -type=TXT pornras.com

# Tüm DNS kayıtları
nslookup pornras.com
```

### Online Araçlar

1. **whatsmydns.net** → TXT kaydı kontrolü
2. **dnschecker.org** → Detaylı DNS kontrolü
3. **mxtoolbox.com** → TXT kaydı kontrolü

## ⏱️ Propagation Süresi

- **Hızlı:** 5 dakika - 1 saat
- **Normal:** 1-4 saat
- **Maksimum:** 24-48 saat

## ✅ Başarılı Kontrol

1. ✅ TXT kaydı Vercel'de görünüyor
2. ✅ Proton Mail doğrulama başarılı
3. ✅ DNS propagation tamamlandı

## 🔧 Sorun Giderme

### TXT Kaydı Görünmüyor

**Çözüm:**
- Vercel'de kaydın doğru eklendiğinden emin olun
- DNS propagation için bekleyin
- Nameserver'ların Vercel'de olduğundan emin olun

### Proton Mail Doğrulama Başarısız

**Çözüm:**
- TXT kaydının doğru olduğundan emin olun
- Value değerinin tam olduğundan emin olun (kesik olmamalı)
- DNS propagation için bekleyin

### Nameserver'lar Karışık

**Çözüm:**
- Nameserver'ları kontrol edin: `nslookup -type=NS pornras.com`
- Nameserver'lar Vercel'deyse, DNS kayıtlarını Vercel'de yönetin
- Nameserver'lar Spaceship'teyse, DNS kayıtlarını Spaceship'te yönetin

## 📝 Notlar

- **DNS kayıtları nameserver'ların bulunduğu yerde yönetilir**
- **Vercel nameserver kullanıyorsanız, DNS kayıtlarını Vercel'de yönetin**
- **Spaceship nameserver kullanıyorsanız, DNS kayıtlarını Spaceship'te yönetin**
- **Proton Mail TXT kaydı domain verification için kullanılır**

**Hepsi bu kadar!** 🎉

