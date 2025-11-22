# Git Bash'te VPS Kurulum Rehberi

## 🚀 Adım 1: Git Bash'i Aç

Windows'ta Git Bash'i açın (Başlat menüsünden "Git Bash" arayın).

---

## 🔐 Adım 2: SSH ile VPS'e Bağlan

Git Bash'te şu komutu çalıştırın:

```bash
ssh root@72.61.139.145
```

**İlk bağlantıda:**
- "Are you sure you want to continue connecting (yes/no)?" sorusuna `yes` yazın
- Şifre sorulursa, Hostinger'ın verdiği root şifresini girin

**✅ Başarılı bağlantı:** Terminal'de `root@vps-xxxxx:~#` gibi bir prompt göreceksiniz.

---

## 📦 Adım 3: Sistem Güncellemesi

VPS'e bağlandıktan sonra, şu komutları sırayla çalıştırın:

```bash
# Sistem güncellemesi (2-3 dakika sürebilir)
sudo apt update && sudo apt upgrade -y

# Temel araçlar
sudo apt install -y curl wget git build-essential
```

---

## 📧 Adım 4: Proton Mail Bridge Kurulumu

### 4.1. Bridge İndirme ve Kurulum

```bash
# Geçici klasöre git
cd /tmp

# Proton Mail Bridge'i indir (en güncel versiyonu kontrol edin)
wget https://proton.me/download/bridge/protonmail-bridge_3.8.0-1_amd64.deb

# Kurulum
sudo dpkg -i protonmail-bridge_3.8.0-1_amd64.deb

# Eksik bağımlılıkları yükle
sudo apt-get install -f -y
```

**⚠️ Not:** Eğer versiyon hatası alırsanız, [Proton Mail Bridge indirme sayfasından](https://proton.me/mail/bridge) en güncel `.deb` dosyasının linkini alın.

### 4.2. Bridge İlk Yapılandırma

```bash
# Bridge'i CLI modunda başlat
protonmail-bridge --cli
```

**İlk kurulumda:**
1. Proton Mail e-posta adresinizi girin
2. Proton Mail şifrenizi girin
3. 2FA (iki faktörlü doğrulama) varsa, kod girin
4. SMTP ayarlarını not edin:
   - **Host:** `127.0.0.1`
   - **Port:** `1025` (veya gösterilen port)
   - **Username:** `pornras@proton.me` (veya kullandığınız e-posta)
   - **Password:** Bridge'in oluşturduğu özel şifre (Proton Mail hesap şifreniz değil!)

**Bridge şifresini kaydedin!** Bu şifreyi `.env` dosyasında kullanacağız.

### 4.3. Bridge'i Otomatik Başlatma (Systemd Service)

```bash
# Service dosyası oluştur
sudo nano /etc/systemd/system/protonmail-bridge.service
```

**Nano editörde:** Aşağıdaki içeriği yapıştırın, sonra:
- `Ctrl + O` (kaydet)
- `Enter` (onayla)
- `Ctrl + X` (çık)

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

**Service'i etkinleştir ve başlat:**

```bash
# Systemd'yi yenile
sudo systemctl daemon-reload

# Service'i etkinleştir (otomatik başlatma için)
sudo systemctl enable protonmail-bridge

# Service'i başlat
sudo systemctl start protonmail-bridge

# Durumu kontrol et (çalışıyorsa "active (running)" görmelisiniz)
sudo systemctl status protonmail-bridge
```

**Çıkmak için:** `q` tuşuna basın.

---

## 🟢 Adım 5: Node.js Kurulumu

```bash
# NodeSource repository ekle
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -

# Node.js yükle
sudo apt-get install -y nodejs

# Versiyon kontrolü (v18.x.x görmelisiniz)
node --version
npm --version
```

---

## 📁 Adım 6: Backend Kodunu VPS'e Taşıma

### 6.1. Proje Klasörü Oluştur

```bash
# Proje klasörü oluştur
sudo mkdir -p /var/www/adulttube-backend
sudo chown $USER:$USER /var/www/adulttube-backend
```

### 6.2. GitHub'dan Kodları İndir

```bash
# Proje klasörüne git
cd /var/www/adulttube-backend

# GitHub'dan clone (sadece server klasörü için)
git clone https://github.com/rasmovies/Porn-Ras-XXX-Project.git .

# Server klasörüne git
cd server

# Bağımlılıkları yükle (2-3 dakika sürebilir)
npm install
```

---

## ⚙️ Adım 7: Environment Variables (.env) Ayarlama

```bash
# .env dosyası oluştur
nano /var/www/adulttube-backend/server/.env
```

**Nano editörde:** Aşağıdaki içeriği yapıştırın ve değerleri kendi bilgilerinizle değiştirin:

```env
# Proton Mail Bridge SMTP Ayarları
PROTON_SMTP_HOST=127.0.0.1
PROTON_SMTP_PORT=1025
PROTON_SMTP_SECURE=false
PROTON_SMTP_USERNAME=pornras@proton.me
PROTON_SMTP_PASSWORD=BRIDGE_ŞİFRESİ_BURAYA
PROTON_FROM_EMAIL=pornras@proton.me
PROTON_FROM_NAME=PORNRAS

# Server Ayarları
PORT=5000
NODE_ENV=production
```

**Önemli:**
- `PROTON_SMTP_PASSWORD`: Proton Mail Bridge'in oluşturduğu özel şifre (Adım 4.2'de not ettiğiniz)
- `PROTON_SMTP_USERNAME` ve `PROTON_FROM_EMAIL`: Proton Mail e-posta adresiniz

**Kaydet ve çık:**
- `Ctrl + O` → `Enter` → `Ctrl + X`

---

## 🚀 Adım 8: Backend'i PM2 ile Başlatma

### 8.1. PM2 Kurulumu

```bash
# PM2'yi global olarak yükle
sudo npm install -g pm2
```

### 8.2. Backend'i Başlat

```bash
# Server klasöründe olduğunuzdan emin olun
cd /var/www/adulttube-backend/server

# PM2 ile başlat
pm2 start server.js --name adulttube-backend

# PM2'yi systemd'ye entegre et (VPS yeniden başladığında otomatik başlatma için)
pm2 startup
pm2 save
```

**Not:** `pm2 startup` komutu bir komut çıktısı verecek. O komutu kopyalayıp çalıştırın (genellikle `sudo env PATH=...` ile başlar).

### 8.3. Durum Kontrolü

```bash
# PM2 durumunu kontrol et
pm2 status

# Logları görüntüle
pm2 logs adulttube-backend
```

**Çıkmak için:** `Ctrl + C`

---

## 🌐 Adım 9: Nginx Reverse Proxy Kurulumu

### 9.1. Nginx Kurulumu

```bash
# Nginx yükle
sudo apt install -y nginx
```

### 9.2. Nginx Yapılandırması

```bash
# Yapılandırma dosyası oluştur
sudo nano /etc/nginx/sites-available/adulttube-backend
```

**İçeriği yapıştırın:**

```nginx
server {
    listen 80;
    server_name api.pornras.com 72.61.139.145;

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
        
        # CORS headers
        add_header 'Access-Control-Allow-Origin' 'https://www.pornras.com' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'Content-Type, Authorization' always;
    }
}
```

**Kaydet ve çık:** `Ctrl + O` → `Enter` → `Ctrl + X`

### 9.3. Site'ı Etkinleştir

```bash
# Site'ı etkinleştir
sudo ln -s /etc/nginx/sites-available/adulttube-backend /etc/nginx/sites-enabled/

# Nginx yapılandırmasını test et
sudo nginx -t

# Nginx'i yeniden başlat
sudo systemctl restart nginx

# Nginx durumunu kontrol et
sudo systemctl status nginx
```

---

## 🔒 Adım 10: SSL Sertifikası (Let's Encrypt) - Opsiyonel

**Not:** SSL için domain (`api.pornras.com`) gerekli. Eğer domain yoksa bu adımı atlayın.

```bash
# Certbot kurulumu
sudo apt install -y certbot python3-certbot-nginx

# SSL sertifikası al (domain'iniz DNS'te VPS IP'sine yönlendirilmiş olmalı)
sudo certbot --nginx -d api.pornras.com

# Otomatik yenileme testi
sudo certbot renew --dry-run
```

---

## 🔥 Adım 11: Firewall Yapılandırması

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

---

## ✅ Adım 12: Test ve Kontrol

### 12.1. Backend Health Check

```bash
# Local'den test
curl http://localhost:5000/health

# Dışarıdan test (VPS IP)
curl http://72.61.139.145/health
```

### 12.2. Email Test

```bash
# Email endpoint'ini test et
curl -X POST http://72.61.139.145/api/email/verification \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "username": "testuser",
    "verifyUrl": "https://www.pornras.com/verify?token=test"
  }'
```

---

## 📊 Log Kontrolü

```bash
# PM2 logları
pm2 logs adulttube-backend

# Proton Mail Bridge logları
sudo journalctl -u protonmail-bridge -f

# Nginx logları
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

**Çıkmak için:** `Ctrl + C`

---

## 🔧 Sorun Giderme

### Proton Mail Bridge çalışmıyor:
```bash
sudo systemctl status protonmail-bridge
sudo systemctl restart protonmail-bridge
```

### Backend çalışmıyor:
```bash
pm2 status
pm2 logs adulttube-backend
pm2 restart adulttube-backend
```

### Nginx hataları:
```bash
sudo nginx -t
sudo tail -f /var/log/nginx/error.log
```

### Port kullanımını kontrol et:
```bash
sudo netstat -tulpn | grep 5000
```

---

## 🎯 Son Adım: Vercel Frontend'i Güncelle

1. **Vercel Dashboard** → `porn-ras-xxx-project` projesi
2. **Settings** → **Environment Variables**
3. `REACT_APP_API_BASE_URL` değerini güncelle:
   - **Production:** `http://72.61.139.145` (veya `https://api.pornras.com` eğer SSL varsa)
   - **Preview:** `http://72.61.139.145`
4. **Frontend'i yeniden deploy et**

---

## 📝 Önemli Notlar

1. **SSH Bağlantısı:** Git Bash'ten çıkmak için `exit` yazın
2. **Nano Editör:** 
   - Kaydet: `Ctrl + O` → `Enter`
   - Çık: `Ctrl + X`
   - İptal: `Ctrl + X` → `N`
3. **PM2 Komutları:**
   - `pm2 list` - Tüm process'leri listele
   - `pm2 restart adulttube-backend` - Yeniden başlat
   - `pm2 stop adulttube-backend` - Durdur
   - `pm2 delete adulttube-backend` - Sil
4. **Loglar:** Her zaman logları kontrol edin, hataları orada görebilirsiniz

---

## 🎉 Kurulum Tamamlandı!

Artık backend'iniz VPS'te çalışıyor. Frontend'den test edebilirsiniz!




