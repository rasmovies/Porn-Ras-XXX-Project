# VPS Email Setup - PowerShell Rehberi

Bu rehber PowerShell üzerinden VPS email kurulumunu otomatik olarak yapmanızı sağlar.

## 📋 Gereksinimler

1. **PowerShell 5.0 veya üzeri** (Windows PowerShell veya PowerShell Core)
2. **Posh-SSH modülü** (Script otomatik yükleyecek)
3. **VPS erişim bilgileri** (IP adresi, kullanıcı adı, şifre)

## 🚀 Hızlı Başlangıç

### Yöntem 1: Otomatik Script (Önerilen)

1. **PowerShell'i Yönetici Olarak Aç**
   - Windows tuşu + X
   - "Windows PowerShell (Yönetici)" seç

2. **Proje dizinine git**
   ```powershell
   cd C:\Users\User\Desktop\adulttube
   ```

3. **Execution Policy'yi ayarla** (ilk kez kullanıyorsanız)
   ```powershell
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
   ```

4. **Scripti çalıştır**
   ```powershell
   .\vps-email-setup.ps1
   ```

5. **Script soracak:**
   - VPS IP adresi
   - VPS şifresi
   - Bridge password (opsiyonel)

### Yöntem 2: Parametrelerle Çalıştırma

```powershell
.\vps-email-setup.ps1 -VpsIp "192.168.1.100" -VpsUser "root"
```

## 📝 Script Ne Yapıyor?

1. ✅ Posh-SSH modülünü kontrol eder ve yükler
2. ✅ VPS'e SSH ile bağlanır
3. ✅ Proton Mail Bridge durumunu kontrol eder
4. ✅ Bridge SMTP bilgilerini otomatik bulur
5. ✅ `.env` dosyasını oluşturur/günceller
6. ✅ Backend'i yeniden başlatır
7. ✅ Logları gösterir

## 🔧 Manuel İşlemler (Gerekirse)

Eğer script çalışmazsa, `vps-powershell-commands.ps1` dosyasındaki helper fonksiyonları kullanabilirsiniz:

```powershell
# Helper fonksiyonları yükle
. .\vps-powershell-commands.ps1

# VPS'e bağlan
$Session = Connect-Vps -VpsIp "your-vps-ip"

# Komut çalıştır
$Result = Invoke-VpsCommand -Session $Session -Command "pm2 logs adulttube-backend"
Write-Host $Result.Output

# Bağlantıyı kapat
Remove-SSHSession -SessionId $Session.SessionId
```

## 🐛 Sorun Giderme

### "Posh-SSH modülü yüklenemedi"
```powershell
Install-Module -Name Posh-SSH -Scope CurrentUser -Force -AllowClobber
```

### "VPS'e bağlanılamadı"
- VPS IP adresini kontrol edin
- SSH portunun açık olduğundan emin olun (genelde 22)
- Firewall kurallarını kontrol edin

### "Execution Policy hatası"
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Bridge password bulamıyorum
1. Bridge GUI'den: Settings > Advanced > Bridge > SMTP password
2. Bridge CLI'den: `proton-bridge --cli` (VPS'te)
3. Bridge loglarından: `sudo journalctl -u proton-bridge -n 100`

## 📧 Email Test Etme

VPS'te şu komutu çalıştırın:

```bash
curl -X POST http://localhost:5000/api/email/verification \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "username": "TestUser",
    "verifyUrl": "https://www.pornras.com/verify?token=test123"
  }'
```

## ✅ Başarı Kontrolü

Script başarıyla tamamlandıysa:
- ✅ `.env` dosyası `/var/www/adulttube-backend/server/.env` konumunda oluşturuldu
- ✅ Backend `pm2` ile çalışıyor
- ✅ Loglarda hata yok

Logları kontrol etmek için VPS'te:
```bash
pm2 logs adulttube-backend --lines 50
```

