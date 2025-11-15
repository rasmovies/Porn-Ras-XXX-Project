# VPS Email Servisi Kurulum Rehberi

## 🎯 Amaç

Hostinger VPS'de email servisi kurmak için iki seçenek:
1. **Proton Bridge VPS'de kurulum** (zor, ama mümkün)
2. **Mailgun/SendGrid kullanımı** (kolay, önerilen)

## 📋 Seçenek 1: Proton Bridge VPS Kurulumu

### Gereksinimler

- Hostinger VPS (Ubuntu 20.04/22.04 veya Debian 11/12)
- Minimum 2GB RAM (4GB+ önerilir)
- Root erişimi
- Proton Mail ücretli hesabı (Bridge için gerekli)

### Adım 1: VPS Hazırlığı

```bash
# SSH ile VPS'e bağlan
ssh root@your-vps-ip

# Sistem güncellemesi
apt update && apt upgrade -y

# Gerekli paketler
apt install -y wget curl gnupg2
```

### Adım 2: Proton Bridge Kurulumu

```bash
# Proton Bridge'i indir (en son versiyonu kontrol et)
wget https://proton.me/download/bridge/protonmail-bridge_3.x.x_amd64.deb

# Kurulum
sudo dpkg -i protonmail-bridge_3.x.x_amd64.deb
sudo apt-get install -f  # Eksik bağımlılıkları yükle
```

### Adım 3: Headless Mode Yapılandırması

**Zorluk:** Proton Bridge ilk kurulumda GUI gerektirebilir.

**Çözüm 1: X11 Forwarding**
```bash
# SSH ile X11 forwarding ile bağlan
ssh -X root@your-vps-ip

# Bridge'i GUI modda başlat
protonmail-bridge
```

**Çözüm 2: VNC Server**
```bash
# VNC server kur
apt install -y tigervnc-standalone-server

# VNC server başlat
vncserver :1

# VNC client ile bağlan ve Bridge'i kur
```

**Çözüm 3: Docker ile (Eğer mümkünse)**
```bash
# Docker kur
apt install -y docker.io

# Proton Bridge Docker image'i (varsa)
docker run -d --name proton-bridge ...
```

### Adım 4: Bridge Yapılandırması

```bash
# Bridge'i CLI modda başlat
protonmail-bridge --cli

# İlk kurulum:
# 1. Proton Mail hesabınızla giriş yapın
# 2. SMTP/IMAP şifrelerini alın
# 3. Port ayarlarını yapın (varsayılan: SMTP 1025, IMAP 1143)
```

### Adım 5: Backend Yapılandırması

VPS'de backend'i çalıştırırken `.env` dosyası:

```env
PROTON_SMTP_HOST=127.0.0.1
PROTON_SMTP_PORT=1025
PROTON_SMTP_SECURE=false
PROTON_SMTP_USERNAME=your-bridge-username
PROTON_SMTP_PASSWORD=your-bridge-password
PROTON_FROM_EMAIL=your-email@proton.me
PROTON_FROM_NAME=Your Name
```

### Adım 6: Systemd Service Oluşturma

```bash
# /etc/systemd/system/proton-bridge.service
[Unit]
Description=Proton Mail Bridge
After=network.target

[Service]
Type=simple
User=root
ExecStart=/usr/bin/protonmail-bridge --cli
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

```bash
# Service'i başlat
systemctl enable proton-bridge
systemctl start proton-bridge
systemctl status proton-bridge
```

## 📋 Seçenek 2: Mailgun Kullanımı (Önerilen)

### Avantajlar

- ✅ Çok kolay kurulum
- ✅ Güvenilir
- ✅ Ücretsiz tier (5,000 email/ay)
- ✅ API ve SMTP desteği
- ✅ Detaylı analytics

### Adım 1: Mailgun Hesabı Oluştur

1. https://www.mailgun.com → Sign Up
2. Domain ekle (veya sandbox domain kullan)
3. API key'i al

### Adım 2: Backend'e Mailgun Entegrasyonu

```bash
# Mailgun paketini yükle
npm install mailgun.js
```

### Adım 3: emailService.js Güncellemesi

```javascript
const formData = require('form-data');
const Mailgun = require('mailgun.js');
const mailgun = new Mailgun(formData);

const mg = mailgun.client({
  username: 'api',
  key: process.env.MAILGUN_API_KEY,
});

// Email gönderme
await mg.messages.create(domain, {
  from: process.env.MAILGUN_FROM_EMAIL,
  to: email,
  subject: subject,
  html: htmlContent,
  text: textContent,
});
```

### Adım 4: Environment Variables

```env
MAILGUN_API_KEY=your-api-key
MAILGUN_DOMAIN=your-domain.com
MAILGUN_FROM_EMAIL=noreply@your-domain.com
MAILGUN_FROM_NAME=Your Name
```

## 📋 Seçenek 3: SendGrid Kullanımı

### Avantajlar

- ✅ Kolay kurulum
- ✅ Güvenilir
- ✅ Ücretsiz tier (100 email/gün)
- ✅ API ve SMTP desteği

### Adım 1: SendGrid Hesabı Oluştur

1. https://sendgrid.com → Sign Up
2. API key oluştur
3. Sender identity doğrula

### Adım 2: Backend'e SendGrid Entegrasyonu

```bash
npm install @sendgrid/mail
```

### Adım 3: emailService.js Güncellemesi

```javascript
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Email gönderme
await sgMail.send({
  from: process.env.SENDGRID_FROM_EMAIL,
  to: email,
  subject: subject,
  html: htmlContent,
  text: textContent,
});
```

### Adım 4: Environment Variables

```env
SENDGRID_API_KEY=your-api-key
SENDGRID_FROM_EMAIL=noreply@your-domain.com
SENDGRID_FROM_NAME=Your Name
```

## 💰 Maliyet Karşılaştırması

| Servis | Ücretsiz Tier | Sonraki Tier |
|--------|---------------|--------------|
| **Proton Bridge** | ❌ Yok (ücretli Proton hesabı gerekir) | Proton Mail ücretli |
| **Mailgun** | ✅ 5,000 email/ay | $0.80/1,000 email |
| **SendGrid** | ✅ 100 email/gün | $19.95/ay (40,000 email) |
| **Postmark** | ✅ 100 email/ay | $15/ay (10,000 email) |
| **Brevo** | ✅ 300 email/gün | €25/ay (20,000 email) |

## 🎯 Öneri

**Kısa vadede (Hemen çalıştırmak için):**
- ✅ **Mailgun** veya **SendGrid** kullan (kolay ve güvenilir)

**Uzun vadede (Güvenlik öncelikliyse):**
- ⚠️ **Proton Bridge VPS'de kur** (teknik bilgi gerekir)

## 📝 Sonuç

**Proton Bridge VPS'de kurulabilir**, ancak:
- ⚠️ Teknik bilgi gerektirir
- ⚠️ Headless mode yapılandırması gerekir
- ⚠️ İlk kurulumda GUI gerekebilir

**Alternatif olarak:**
- ✅ Mailgun/SendGrid daha kolay ve güvenilir
- ✅ Ücretsiz tier'lar var
- ✅ Daha iyi analytics ve deliverability

**Hangi seçeneği tercih edersiniz?**



