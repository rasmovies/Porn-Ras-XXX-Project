# VPS Email Setup - Hızlı Başlangıç Scripti
# Bu script tüm işlemleri otomatik yapar

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "VPS Email Setup - Otomatik Kurulum" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# VPS bilgilerini al
$VpsIp = Read-Host "VPS IP adresini girin"
$VpsUser = Read-Host "VPS kullanıcı adı (varsayılan: root)" -DefaultValue "root"
$VpsPassword = Read-Host "VPS şifresini girin" -AsSecureString

# Secure string'i plain text'e çevir
$BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($VpsPassword)
$PlainPassword = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)

Write-Host ""
Write-Host "Bilgiler alındı. Kurulum başlatılıyor..." -ForegroundColor Green
Write-Host ""

# Ana scripti parametrelerle çalıştır
& ".\vps-email-setup.ps1" -VpsIp $VpsIp -VpsUser $VpsUser -VpsPassword $PlainPassword

