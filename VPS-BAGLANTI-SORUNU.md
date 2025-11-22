# VPS Bağlantı Sorunu Giderme Rehberi

## ❌ Hata: "Bir veritabanı araması sırasında kurtarılabilir olmayan bir hata oluştu"

Bu hata genellikle SSH bağlantısı kurarken oluşur. Aşağıdaki adımları deneyin:

## 🔍 Adım 1: Bağlantı Test Aracını Kullanın

Önce bağlantıyı test edin:

```powershell
.\vps-connection-test.ps1 -VpsIp "VPS-IP-ADRESI"
```

Bu script şunları kontrol eder:
- ✅ Ping erişilebilirliği
- ✅ SSH portu (22) açık mı
- ✅ SSH kimlik doğrulama çalışıyor mu
- ✅ Uzak komut çalıştırabiliyor muyuz

## 🔧 Adım 2: Manuel SSH Testi

PowerShell'den manuel olarak SSH bağlantısını test edin:

```powershell
# 1. Posh-SSH modülünü yükle
Import-Module Posh-SSH

# 2. Şifreyi güvenli şekilde al
$SecurePassword = Read-Host "VPS şifresi" -AsSecureString
$Credential = New-Object System.Management.Automation.PSCredential("root", $SecurePassword)

# 3. Bağlan
$Session = New-SSHSession -ComputerName "VPS-IP" -Credential $Credential -AcceptKey
```

## 🐛 Olası Sorunlar ve Çözümleri

### 1. VPS IP Adresi Yanlış
- **Kontrol:** VPS hosting panelinden doğru IP'yi alın
- **Test:** `ping VPS-IP` komutu ile ping atın

### 2. SSH Portu Kapalı
- **Test:** `Test-NetConnection -ComputerName VPS-IP -Port 22`
- **Çözüm:** VPS hosting panelinden firewall kurallarını kontrol edin
- **VPS'te:** `sudo systemctl status sshd` ile SSH servisini kontrol edin

### 3. Şifre Yanlış
- **Kontrol:** VPS hosting panelinden şifreyi sıfırlayın
- **Alternatif:** SSH key authentication kullanın

### 4. SSH Key Authentication Gerekli
Bazı VPS'lerde sadece SSH key ile bağlanabilirsiniz:

```powershell
# SSH key oluştur (eğer yoksa)
ssh-keygen -t rsa -b 4096

# Public key'i VPS'e kopyala
ssh-copy-id root@VPS-IP

# Key ile bağlan
ssh -i ~/.ssh/id_rsa root@VPS-IP
```

### 5. Firewall Kuralları
VPS'te firewall SSH'ı engelliyor olabilir:

```bash
# VPS'te (SSH ile bağlandıktan sonra)
sudo ufw status
sudo ufw allow 22/tcp
sudo ufw reload
```

### 6. Posh-SSH Modülü Sorunu
Eski bir hata mesajı olabilir. Modülü yeniden yükleyin:

```powershell
Uninstall-Module -Name Posh-SSH -AllVersions -Force
Install-Module -Name Posh-SSH -Scope CurrentUser -Force -AllowClobber
Import-Module Posh-SSH -Force
```

## 🔄 Alternatif Yöntem: Putty/WinSCP Kullanın

Eğer PowerShell SSH çalışmazsa, manuel olarak bağlanıp komutları çalıştırabilirsiniz:

1. **Putty** veya **WinSCP** ile VPS'e bağlanın
2. Aşağıdaki komutları sırayla çalıştırın:

```bash
# 1. Backend dizinine git
cd /var/www/adulttube-backend/server

# 2. .env dosyasını oluştur
nano .env

# 3. İçeriği yapıştır:
PORT=5000
NODE_ENV=production
PROTON_SMTP_HOST=127.0.0.1
PROTON_SMTP_PORT=1025
PROTON_SMTP_SECURE=false
PROTON_SMTP_USERNAME=pornras@proton.me
PROTON_SMTP_PASSWORD=BRIDGE-PASSWORD-BURAYA
PROTON_FROM_EMAIL=pornras@proton.me
PROTON_FROM_NAME=PORNRAS

# 4. Kaydet (Ctrl+O, Enter, Ctrl+X)

# 5. Backend'i yeniden başlat
pm2 restart adulttube-backend

# 6. Logları kontrol et
pm2 logs adulttube-backend
```

## 📞 Destek

Hala bağlanamıyorsanız:
1. VPS hosting sağlayıcınızın destek ekibine başvurun
2. VPS'in çalıştığından emin olun
3. VPS IP adresinin doğru olduğunu kontrol edin
4. Firewall kurallarını kontrol edin

## ✅ Başarı Kontrolü

Bağlantı başarılı olursa şu çıktıyı görmelisiniz:
```
✅ VPS'e bağlanıldı (Session ID: X)
✅ Proton Mail Bridge çalışıyor
✅ Backend dizini mevcut
✅ .env dosyası oluşturuldu/güncellendi
✅ Backend yeniden başlatıldı
```

