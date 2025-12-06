# VPS Backend + Proton Mail Bridge Kurulum Rehberi

## 1. VPS Hazırlığı

### Gereksinimler:
- Ubuntu 22.04 LTS (veya 20.04)
- En az 1GB RAM, 1 CPU core
- Root/SSH erişimi

### İlk Kurulum:
```bash
# Sistem güncellemesi
sudo apt update && sudo apt upgrade -y

# Temel araçlar
sudo apt install -y curl wget git build-essential
```

## 2. Proton Mail Bridge Kurulumu

### 2.1. Proton Mail Bridge İndirme ve Kurulum

```bash
# Proton Mail Bridge'i indir (Linux için)
cd /tmp
wget https://proton.me/download/bridge/protonmail-bridge_3.8.0-1_amd64.deb

# Kurulum
sudo dpkg -i protonmail-bridge_3.8.0-1_amd64.deb

# Eksik bağımlılıkları yükle
sudo apt-get install -f -y
```

**Not:** Proton Mail Bridge versiyonu güncel olmayabilir. En son versiyonu [Proton Mail Bridge indirme sayfasından](https://proton.me/mail/bridge) kontrol edin.

### 2.2. Password Manager Kurulumu (Gerekli)

Proton Mail Bridge bir password manager gerektirir. VPS'te `pass` kullanacağız:

```bash
# Pass password manager kurulumu
sudo apt install -y pass

# GPG key oluştur (eğer yoksa)
gpg --full-generate-key
# Seçenekler:
# 1. (1) RSA and RSA
# 2. Keysize: 2048
# 3. Expiry: 0 (süresiz)
# 4. İsim ve e-posta girin (herhangi bir değer olabilir)
# 5. Şifre belirleyin (veya Enter'a basarak şifresiz bırakın)

# Pass'i başlat
pass init "your-email@example.com"  # GPG key'inizin e-posta adresini kullanın
```

**Alternatif (Daha Basit):** Eğer GPG key oluşturmak istemiyorsanız, `secret-service` kullanabilirsiniz:

```bash
sudo apt install -y libsecret-tools dbus-x11
```

### 2.3. Proton Mail Bridge Yapılandırması

**Önemli:** Bridge'in Pass password manager'ı bulabilmesi için environment variable ayarlayın:

```bash
# Pass password store dizinini belirt
export PASSWORD_STORE_DIR=~/.password-store
export GPG_TTY=$(tty)

# Bridge'i başlat (CLI modunda)
protonmail-bridge --cli
```

**Eğer hala keychain hatası alırsanız:**

Bridge başladıktan sonra, interactive shell'de şu komutları kullanın:

```
login
```

Bu komut Proton Mail hesabınızla giriş yapmanızı isteyecek. Giriş yaptıktan sonra:
1. SMTP ayarlarını not edin (genellikle `127.0.0.1:1025`)
2. Bridge şifresini kaydedin (Proton Mail hesap şifreniz değil, Bridge'in oluşturduğu özel şifre)

**Alternatif:** Eğer Bridge başlamazsa, direkt systemd service olarak başlatın (Adım 2.4).

### 2.3. Bridge'i Systemd Service Olarak Çalıştırma

```bash
# Service dosyası oluştur
sudo nano /etc/systemd/system/protonmail-bridge.service
```

İçeriği:
```ini
[Unit]
Description=ProtonMail Bridge
After=network.target

[Service]
Type=simple
User=root
ExecStart=/usr/bin/protonmail-bridge --noninteractive
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

```bash
# Service'i etkinleştir ve başlat
sudo systemctl daemon-reload
sudo systemctl enable protonmail-bridge
sudo systemctl start protonmail-bridge

# Durumu kontrol et
sudo systemctl status protonmail-bridge
```

## 3. Node.js ve Backend Kurulumu

### 3.1. Node.js Kurulumu (v18 veya üzeri)

```bash
# NodeSource repository ekle
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -

# Node.js yükle
sudo apt-get install -y nodejs

# Versiyon kontrolü
node --version
npm --version
```

### 3.2. Backend Kodunu VPS'e Taşıma

```bash
# Proje klasörü oluştur
sudo mkdir -p /var/www/adulttube-backend
sudo chown $USER:$USER /var/www/adulttube-backend

# GitHub'dan clone (veya SCP ile dosyaları yükle)
cd /var/www/adulttube-backend
git clone https://github.com/rasmovies/Porn-Ras-XXX-Project.git .

# Sadece server klasörünü kullan
cd server
npm install
```

### 3.3. Environment Variables Ayarlama

```bash
# .env dosyası oluştur
nano /var/www/adulttube-backend/server/.env
```

İçeriği:
```env
# Proton Mail Bridge SMTP Ayarları (localhost'ta çalışıyor)
PROTON_SMTP_HOST=127.0.0.1
PROTON_SMTP_PORT=1025
PROTON_SMTP_SECURE=false
PROTON_SMTP_USERNAME=pornras@proton.me
PROTON_SMTP_PASSWORD=ProtonMail_Bridge_Şifresi
PROTON_FROM_EMAIL=pornras@proton.me
PROTON_FROM_NAME=PORNRAS

# Server Ayarları
PORT=5000
NODE_ENV=production
```

**Not:** `PROTON_SMTP_PASSWORD` Proton Mail Bridge'in oluşturduğu özel şifre (Proton Mail hesap şifreniz değil).

### 3.4. Express.js Server'ı Systemd Service Olarak Çalıştırma

```bash
# PM2 kurulumu (önerilen - process manager)
sudo npm install -g pm2

# PM2 ile başlat
cd /var/www/adulttube-backend/server
pm2 start server.js --name adulttube-backend

# PM2'yi systemd'ye entegre et
pm2 startup
pm2 save
```

**Alternatif:** Systemd service (PM2 kullanmak istemiyorsanız):

```bash
# Service dosyası oluştur
sudo nano /etc/systemd/system/adulttube-backend.service
```

İçeriği:
```ini
[Unit]
Description=AdultTube Backend API
After=network.target protonmail-bridge.service

[Service]
Type=simple
User=root
WorkingDirectory=/var/www/adulttube-backend/server
Environment=NODE_ENV=production
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

```bash
# Service'i etkinleştir ve başlat
sudo systemctl daemon-reload
sudo systemctl enable adulttube-backend
sudo systemctl start adulttube-backend

# Durumu kontrol et
sudo systemctl status adulttube-backend
```

## 4. Nginx Reverse Proxy Kurulumu

### 4.1. Nginx Kurulumu

```bash
sudo apt install -y nginx
```

### 4.2. Nginx Yapılandırması

```bash
sudo nano /etc/nginx/sites-available/adulttube-backend
```

İçeriği:
```nginx
server {
    listen 80;
    server_name api.pornras.com;  # Veya VPS IP adresi

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # CORS headers (backend'de de var ama ekstra güvenlik için)
        add_header 'Access-Control-Allow-Origin' 'https://www.pornras.com' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'Content-Type, Authorization' always;
    }
}
```

```bash
# Site'ı etkinleştir
sudo ln -s /etc/nginx/sites-available/adulttube-backend /etc/nginx/sites-enabled/

# Nginx yapılandırmasını test et
sudo nginx -t

# Nginx'i yeniden başlat
sudo systemctl restart nginx
```

### 4.3. SSL Sertifikası (Let's Encrypt)

```bash
# Certbot kurulumu
sudo apt install -y certbot python3-certbot-nginx

# SSL sertifikası al
sudo certbot --nginx -d api.pornras.com

# Otomatik yenileme testi
sudo certbot renew --dry-run
```

## 5. Firewall Yapılandırması

```bash
# UFW firewall kurulumu
sudo apt install -y ufw

# Gerekli portları aç
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS

# Firewall'u etkinleştir
sudo ufw enable

# Durumu kontrol et
sudo ufw status
```

## 6. Vercel Frontend'i VPS Backend'e Bağlama

### 6.1. Vercel Frontend Projesinde Environment Variable

1. Vercel Dashboard → `porn-ras-xxx-project` projesi
2. Settings → Environment Variables
3. `REACT_APP_API_BASE_URL` değerini güncelle:
   - Production: `https://api.pornras.com` (veya VPS IP: `http://VPS_IP_ADRESI`)
   - Preview: `https://api.pornras.com`
4. Frontend'i yeniden deploy et

## 7. Test ve Kontrol

### 7.1. Backend Health Check

```bash
# Local'den test
curl http://localhost:5000/health

# Dışarıdan test (VPS IP veya domain)
curl https://api.pornras.com/health
```

### 7.2. Email Test

```bash
# Email endpoint'ini test et
curl -X POST https://api.pornras.com/api/email/verification \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "username": "testuser",
    "verifyUrl": "https://www.pornras.com/verify?token=test"
  }'
```

## 8. Log Kontrolü

```bash
# PM2 logları
pm2 logs adulttube-backend

# Systemd logları (PM2 kullanmıyorsanız)
sudo journalctl -u adulttube-backend -f

# Proton Mail Bridge logları
sudo journalctl -u protonmail-bridge -f

# Nginx logları
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

## 9. Sorun Giderme

### Proton Mail Bridge bağlanamıyor:
```bash
# Bridge durumunu kontrol et
sudo systemctl status protonmail-bridge

# Bridge'i yeniden başlat
sudo systemctl restart protonmail-bridge
```

### Backend çalışmıyor:
```bash
# PM2 durumunu kontrol et
pm2 status
pm2 logs adulttube-backend

# Port kullanımını kontrol et
sudo netstat -tulpn | grep 5000
```

### Nginx hataları:
```bash
# Nginx yapılandırmasını test et
sudo nginx -t

# Nginx loglarını kontrol et
sudo tail -f /var/log/nginx/error.log
```

## 10. Güvenlik Notları

1. **Firewall:** Sadece gerekli portları açın
2. **SSH:** Key-based authentication kullanın, password authentication'ı kapatın
3. **SSL:** Mutlaka HTTPS kullanın (Let's Encrypt ücretsiz)
4. **Environment Variables:** `.env` dosyasını asla Git'e commit etmeyin
5. **Proton Mail Bridge:** Sadece localhost'tan erişilebilir olmalı (127.0.0.1)

## 11. Otomatik Yeniden Başlatma

VPS yeniden başladığında tüm servislerin otomatik başlaması için:

```bash
# PM2 kullanıyorsanız (zaten yapıldı)
pm2 startup
pm2 save

# Systemd servisleri (zaten enable edildi)
sudo systemctl enable protonmail-bridge
sudo systemctl enable adulttube-backend
sudo systemctl enable nginx
```


