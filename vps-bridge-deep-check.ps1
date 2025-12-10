$ErrorActionPreference = "Stop"

$VpsIp = "72.61.139.145"
$VpsUser = "root"
$VpsPassword = "Oyunbozan1907+"
$BackendPath = "/var/www/adulttube-backend/server"

Import-Module Posh-SSH -Force

$SecurePassword = ConvertTo-SecureString $VpsPassword -AsPlainText -Force
$Credential = New-Object System.Management.Automation.PSCredential($VpsUser, $SecurePassword)
$Session = New-SSHSession -ComputerName $VpsIp -Credential $Credential -AcceptKey

function Invoke-VpsCmd {
    param([string]$Cmd)
    $Result = Invoke-SSHCommand -SessionId $Session.SessionId -Command $Cmd
    return $Result
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "BRIDGE DEEP CHECK" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Username ve Password dogru oldugu dogrulandi" -ForegroundColor Green
Write-Host "Username: pornras@proton.me" -ForegroundColor Gray
Write-Host "Password: MoQL_M-Loyi1fB3b9tKWew" -ForegroundColor Gray
Write-Host ""
Write-Host "Sorun baska bir yerde olmali, derinlemesine kontrol ediyorum..." -ForegroundColor Yellow
Write-Host ""

Write-Host "[1/6] Bridge account sync durumu:" -ForegroundColor Cyan
$SyncStatus = Invoke-VpsCmd "sudo journalctl -u protonmail-bridge -n 1000 --no-pager | grep -i -E 'sync|account|pornras|added|connected|logged' | tail -15"
Write-Host $SyncStatus.Output -ForegroundColor Gray

Write-Host ""
Write-Host "[2/6] Bridge SMTP port ve address kontrol:" -ForegroundColor Cyan
$SmtpConfig = Invoke-VpsCmd "sudo journalctl -u protonmail-bridge -n 500 --no-pager | grep -i -E 'smtp|1025|port|address|listening' | tail -10"
Write-Host $SmtpConfig.Output -ForegroundColor Gray

Write-Host ""
Write-Host "[3/6] Bridge account listesi (CLI test):" -ForegroundColor Cyan
Write-Host "NOT: Bridge CLI interaktif, manuel kontrol gerekir" -ForegroundColor Yellow

Write-Host ""
Write-Host "[4/6] SMTP server'a direkt baglanti testi:" -ForegroundColor Cyan
$DirectTest = Invoke-VpsCmd "timeout 5 bash -c 'echo -e \"EHLO localhost\\nQUIT\" | telnet 127.0.0.1 1025 2>&1' | head -10"
Write-Host $DirectTest.Output -ForegroundColor Gray

Write-Host ""
Write-Host "[5/6] AUTH method'larini test et:" -ForegroundColor Cyan
$AuthMethods = Invoke-VpsCmd "timeout 5 bash -c 'echo -e \"EHLO localhost\\nQUIT\" | openssl s_client -connect 127.0.0.1:1025 -starttls smtp -quiet 2>&1 | grep -i auth'"
Write-Host "Available AUTH methods:" -ForegroundColor Gray
Write-Host $AuthMethods.Output -ForegroundColor Gray

Write-Host ""
Write-Host "[6/6] Bridge config dosyalari (account bilgileri):" -ForegroundColor Cyan
$ConfigCheck = Invoke-VpsCmd "sudo cat ~/.config/protonmail/bridge-v3/keychain.json 2>/dev/null | grep -i -E 'pornras|account|email' | head -5 || echo 'Config dosyasi okunamadi veya account bilgisi yok'"
Write-Host $ConfigCheck.Output -ForegroundColor Gray

Write-Host ""
Write-Host "========================================" -ForegroundColor Yellow
Write-Host "OLASI SORUNLAR:" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow
Write-Host "1. Bridge account'una düzgün login olunmamis olabilir" -ForegroundColor Gray
Write-Host "2. Bridge account sync edilmemis olabilir" -ForegroundColor Gray
Write-Host "3. Bridge SMTP server farkli bir authentication bekliyor olabilir" -ForegroundColor Gray
Write-Host "4. Bridge account logout olmus olabilir" -ForegroundColor Gray
Write-Host ""
Write-Host "COZUM:" -ForegroundColor Green
Write-Host "Bridge'e yeniden login olmak gerekebilir:" -ForegroundColor Green
Write-Host "  sudo systemctl stop protonmail-bridge" -ForegroundColor Gray
Write-Host "  protonmail-bridge --cli" -ForegroundColor Gray
Write-Host "  account list" -ForegroundColor Gray
Write-Host "  account password pornras" -ForegroundColor Gray
Write-Host "  (veya account'u yeniden ekle)" -ForegroundColor Gray

Remove-SSHSession -SessionId $Session.SessionId | Out-Null




