# SSH Portu Kapalı - Hızlı Çözüm

## ❌ Sorun
Port 22 kapalı veya erişilemiyor. Bu durumda SSH ile bağlanamazsınız.

## ✅ Çözüm Seçenekleri

### Seçenek 1: VPS Hosting Panelinden SSH'ı Açın (En Kolay)

1. **Hostinger/VPS Kontrol Paneline** giriş yapın
2. **Firewall/Güvenlik** bölümüne gidin
3. **SSH (Port 22)** ekleyin ve kaydedin
4. Birkaç dakika bekleyin
5. Test aracını tekrar çalıştırın:
   ```powershell
   .\vps-connection-test.ps1 -VpsIp "VPS-IP"
   ```

### Seçenek 2: VPS Console (VNC) Üzerinden Manuel Kurulum

SSH çalışmıyorsa, hosting panelinden **Console/VNC** erişimini kullanarak manuel kurulum yapabilirsiniz:

#### Adımlar:

1. **Hosting panelinden VNC/Console'a bağlanın**
2. **VPS'e giriş yapın**
3. **Şu komutları çalıştırın:**

```bash
# 1. Backend dizinine git
cd /var/www/adulttube-backend/server

# 2. .env dosyasını oluştur
nano .env
```

**İçeriği yapıştırın (değerleri kendi bilgilerinizle değiştirin):**
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

```bash
# 3. Backend'i yeniden başlat
pm2 restart adulttube-backend

# 4. Logları kontrol et
pm2 logs adulttube-backend --lines 50
```

### Seçenek 3: SSH Servisini Console'dan Başlatın

Console'a bağlanıp şu komutları çalıştırın:

```bash
# SSH servisini başlat
sudo systemctl start sshd

# SSH servisini otomatik başlatma için etkinleştir
sudo systemctl enable sshd

# Firewall'da SSH portunu aç (ufw kullanıyorsa)
sudo ufw allow 22/tcp
sudo ufw reload

# SSH servisinin çalıştığını kontrol et
sudo systemctl status sshd
```

### Seçenek 4: Otomatik Console Scripti

Console'a bağlandıktan sonra, `vps-console-manuel-kurulum.sh` scriptini kullanabilirsiniz:

1. **Scripti VPS'e yükleyin** (hosting panelinden dosya yükleme özelliği varsa)
2. **Çalıştırılabilir yapın:**
   ```bash
   chmod +x vps-console-manuel-kurulum.sh
   ```
3. **Scripti çalıştırın:**
   ```bash
   ./vps-console-manuel-kurulum.sh
   ```

## 🔍 Kontrol

SSH açıldıktan sonra PowerShell'de test edin:

```powershell
Test-NetConnection -ComputerName "VPS-IP" -Port 22
```

**Başarılı olursa:** `TcpTestSucceeded : True` görmelisiniz.

## 📞 Destek

Hala çalışmıyorsa:
1. Hosting destek ekibine başvurun
2. VPS'inizin **çalıştığından** emin olun
3. VPS IP adresinin **doğru** olduğundan emin olun

