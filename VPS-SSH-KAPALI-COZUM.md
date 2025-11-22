# SSH Portu Kapalı - Çözüm Rehberi

## ❌ Sorun: Port 22 kapalı veya erişilemiyor

Bu sorun, VPS'inizde SSH servisinin çalışmadığını veya firewall'un SSH'ı engellediğini gösterir.

## 🔧 Çözüm Adımları

### 1. VPS Hosting Panelinden Kontrol

#### Hostinger/VPS Paneli:
1. **VPS Kontrol Paneline** giriş yapın
2. **Firewall/Güvenlik** bölümüne gidin
3. **SSH Port (22)** açık olduğundan emin olun
4. VPS'inizin **çalıştığından** emin olun (Running durumunda olmalı)

#### VPS Console'dan Kontrol:
1. Hosting panelinden **VNC/Console** erişimini kullanın
2. VPS'e console üzerinden giriş yapın
3. Şu komutları çalıştırın:

```bash
# SSH servisinin durumunu kontrol et
sudo systemctl status sshd

# SSH servisi çalışmıyorsa başlat
sudo systemctl start sshd

# SSH servisini otomatik başlatma için etkinleştir
sudo systemctl enable sshd

# Firewall durumunu kontrol et (ufw kullanıyorsa)
sudo ufw status

# SSH portunu aç (eğer kapalıysa)
sudo ufw allow 22/tcp
sudo ufw reload

# Firewall durumunu kontrol et (iptables kullanıyorsa)
sudo iptables -L -n | grep 22

# Eğer SSH portu kapalıysa aç
sudo iptables -A INPUT -p tcp --dport 22 -j ACCEPT
sudo iptables-save
```

### 2. Alternatif SSH Port Kontrolü

Bazı VPS'lerde SSH farklı bir portta çalışıyor olabilir (2222, 22000, vb.):

```powershell
# PowerShell'de farklı portları test edin
Test-NetConnection -ComputerName "VPS-IP" -Port 2222
Test-NetConnection -ComputerName "VPS-IP" -Port 22000
Test-NetConnection -ComputerName "VPS-IP" -Port 22022
```

### 3. Hosting Sağlayıcınızdan Yardım

Eğer yukarıdaki adımlar işe yaramazsa:
1. **Hosting destek ekibine** başvurun
2. **SSH erişimi** için destek isteyin
3. VPS'inizin **SSH erişimi aktif** olduğundan emin olun

### 4. VPS Console Üzerinden Manuel Kurulum

SSH çalışmıyorsa, VPS Console (VNC) üzerinden manuel olarak kurulum yapabilirsiniz:

#### Adım 1: Console'a Bağlan
- Hosting panelinden **VNC/Console** erişimini kullanın
- VPS'e giriş yapın

#### Adım 2: Backend Dizinine Git
```bash
cd /var/www/adulttube-backend/server
```

#### Adım 3: .env Dosyasını Oluştur
```bash
nano .env
```

Şu içeriği yapıştırın (değerleri kendi bilgilerinizle değiştirin):
```
PORT=5000
NODE_ENV=production
PROTON_SMTP_HOST=127.0.0.1
PROTON_SMTP_PORT=1025
PROTON_SMTP_SECURE=false
PROTON_SMTP_USERNAME=pornras@proton.me
PROTON_SMTP_PASSWORD=BRIDGE-PASSWORD-BURAYA
PROTON_FROM_EMAIL=pornras@proton.me
PROTON_FROM_NAME=PORNRAS
```

**Kaydet:** `Ctrl+O`, `Enter`, `Ctrl+X`

#### Adım 4: Backend'i Başlat/Yeniden Başlat
```bash
pm2 restart adulttube-backend
# Veya ilk kez başlatıyorsanız:
pm2 start server.js --name adulttube-backend
pm2 save
```

#### Adım 5: Logları Kontrol Et
```bash
pm2 logs adulttube-backend --lines 50
```

### 5. SSH Key Authentication (Opsiyonel)

Bazı VPS'lerde sadece SSH key ile bağlanabilirsiniz. Eğer SSH key'iniz varsa:

```powershell
# PowerShell'de SSH key ile bağlan
ssh -i "C:\Users\User\.ssh\id_rsa" root@VPS-IP
```

## 🔍 Test Komutları

VPS Console'dan şu komutları çalıştırarak SSH durumunu kontrol edin:

```bash
# SSH servis durumu
systemctl status sshd

# SSH portunu dinleyen servisler
netstat -tlnp | grep 22
# veya
ss -tlnp | grep 22

# Firewall kuralları (ufw)
ufw status verbose

# Firewall kuralları (iptables)
iptables -L INPUT -v -n | grep 22

# SSH config dosyası
cat /etc/ssh/sshd_config | grep Port
```

## ✅ Başarı Kontrolü

SSH çalışıyorsa şu çıktıyı görmelisiniz:
```powershell
Test-NetConnection -ComputerName "VPS-IP" -Port 22
# Çıktı: TcpTestSucceeded : True
```

## 📞 Sonraki Adım

SSH çalıştıktan sonra, email setup scriptini tekrar çalıştırın:
```powershell
.\vps-email-setup.ps1
```

