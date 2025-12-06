# Hostinger VPS Firewall Açma Kılavuzu

## 🔍 SORUN
Port 443 (HTTPS) dışarıdan erişilemiyor. VPS içinde portlar açık ama Hostinger network firewall'u engelliyor.

---

## 📋 ADIM 1: Hostinger hPanel'e Giriş

1. **hPanel'e giriş yapın:**
   - https://hpanel.hostinger.com
   - Email ve şifrenizle giriş yapın

2. **VPS bölümüne gidin:**
   - Sol menüden **"Hosting"** → **"VPS"** seçin
   - Veya **"VPS"** linkine direkt tıklayın

---

## 📋 ADIM 2: VPS Control Panel'e Giriş

Hostinger'da VPS yönetimi için birkaç yöntem var:

### Yöntem A: hPanel VPS Yönetimi
- VPS listenizde VPS'inizi seçin
- **"Manage"** veya **"Yönet"** butonuna tıklayın

### Yöntem B: VPS Control Panel
- hPanel'de VPS'in yanında **"VPS Control Panel"** linki varsa tıklayın
- Veya ayrı bir panel URL'i verilmişse (örn: `https://vps-control.hostinger.com`) oraya gidin

### Yöntem C: Webuzo / CyberPanel
- Hostinger bazı VPS'lerde **Webuzo** veya **CyberPanel** kullanır
- VPS IP'nize direkt erişim: `http://72.61.139.145:4080` (Webuzo) veya `https://72.61.139.145:8090` (CyberPanel)
- Veya hPanel'de "VPS Control Panel" linkini bulun

---

## 📋 ADIM 3: Firewall Ayarlarını Bulma

### Webuzo Panel'de:
1. **"Firewall"** veya **"Security"** menüsüne gidin
2. **"Inbound Rules"** veya **"Firewall Rules"** bölümünü açın

### CyberPanel'de:
1. **"Security"** → **"Firewall"** menüsüne gidin
2. **"Firewall Rules"** veya **"Port Rules"** bölümünü açın

### hPanel'de:
1. VPS yönetim sayfasında **"Firewall"** sekmesini bulun
2. Veya **"Advanced"** → **"Firewall Settings"** seçin

### ISPConfig Panel'de:
1. **"System"** → **"Firewall"** menüsüne gidin
2. **"Ports"** veya **"Rules"** bölümünü açın

---

## 📋 ADIM 4: Port 443 ve 80 Kurallarını Ekleme

### Ekleme Seçenekleri:

#### Seçenek 1: Hızlı Ekleme
- **"Add Rule"** veya **"Yeni Kural"** butonuna tıklayın
- **Port:** `443`
- **Protocol:** `TCP`
- **Action:** `Allow` / `Accept` / `İzin Ver`
- **Source:** `0.0.0.0/0` veya `Any` / `Her Yerden`
- **Kaydet**

Aynı şekilde **Port 80** için de ekleyin:
- **Port:** `80`
- **Protocol:** `TCP`
- **Action:** `Allow`
- **Source:** `0.0.0.0/0`
- **Kaydet**

#### Seçenek 2: Preset Seçim
- Bazı panellerde **"HTTPS (443)"** ve **"HTTP (80)"** seçenekleri hazır gelir
- Bunları seçip **"Add"** veya **"Ekle"** yapın

---

## 📋 ADIM 5: Kuralları Uygulama

1. **"Save"** / **"Kaydet"** butonuna tıklayın
2. **"Apply"** / **"Uygula"** butonuna tıklayın
3. Değişikliklerin etkin olması 1-2 dakika sürebilir

---

## 📋 ADIM 6: Test Etme

Firewall'u açtıktan sonra test edin:

### Tarayıcıdan:
```
https://72.61.139.145/health
```
(Self-signed sertifika uyarısı normal, **"Advanced" → "Proceed"** seçin)

### PowerShell'den:
```powershell
[System.Net.ServicePointManager]::ServerCertificateValidationCallback = {$true}
(New-Object System.Net.WebClient).DownloadString("https://72.61.139.145/health")
```

---

## 🔧 ALTERNATIF: Hostinger Destek Ekibinden Yardım

Eğer panel'de firewall ayarlarını bulamazsanız:

1. **Hostinger Destek'e ulaşın:**
   - hPanel'de **"Support"** → **"Contact Support"**
   - Veya canlı chat / ticket açın

2. **Talepte belirtin:**
   ```
   VPS IP: 72.61.139.145
   Acilacak portlar: 443 (HTTPS) ve 80 (HTTP)
   Sebep: Web uygulaması için HTTPS backend gerekiyor
   ```

3. Hostinger ekibi firewall'u açacaktır.

---

## ⚠️ NOTLAR

- **Self-signed sertifika:** Şu anda self-signed sertifika kullanıyoruz, tarayıcı uyarı verebilir (normal)
- **Production:** İleride `api.pornras.com` subdomain'i ile Let's Encrypt sertifikası kullanılmalı
- **Güvenlik:** Firewall'u açtıktan sonra backend'in güvenlik ayarlarını kontrol edin

---

## ✅ BAŞARILI OLDUĞUNDA

1. **Vercel'de Environment Variable güncelle:**
   - `REACT_APP_API_BASE_URL = https://72.61.139.145`

2. **Deployment'i yeniden başlat:**
   - Vercel Dashboard → Deployments → Redeploy

3. **Site'de test et:**
   - Email verification formunu test edin
   - Artık `ERR_CONNECTION_TIMED_OUT` hatası gitmeli


