$ErrorActionPreference = "Stop"

$VpsIp = "72.61.139.145"
$VpsUser = "root"
$VpsPassword = "Oyunbozan1907+"

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
Write-Host "BRIDGE ACCOUNT DURUM ANALIZI" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "[1/5] Bridge process durumu:" -ForegroundColor Cyan
$BridgeStatus = Invoke-VpsCmd "sudo systemctl status protonmail-bridge --no-pager | head -15"
Write-Host $BridgeStatus.Output -ForegroundColor Gray

Write-Host ""
Write-Host "[2/5] Bridge loglari (account bilgileri):" -ForegroundColor Cyan
$AccountInfo = Invoke-VpsCmd "sudo journalctl -u protonmail-bridge -n 500 --no-pager | grep -i -E 'account|pornras|added|login|sync|active|connected' | tail -20"
Write-Host $AccountInfo.Output -ForegroundColor Gray

Write-Host ""
Write-Host "[3/5] Bridge config dosyalari:" -ForegroundColor Cyan
$ConfigFiles = Invoke-VpsCmd "find ~/.config/protonmail -type f -name '*.json' 2>/dev/null | head -5"
Write-Host $ConfigFiles.Output -ForegroundColor Gray

Write-Host ""
Write-Host "[4/5] Bridge username format testi:" -ForegroundColor Cyan
Write-Host "NOT: Belki username sadece 'pornras' olmalı, '@proton.me' olmamali" -ForegroundColor Yellow
Write-Host "Veya tam tersi - sadece email format olmalı" -ForegroundColor Yellow
Write-Host "Bridge GUI'den kontrol etmeliyiz" -ForegroundColor Yellow

Write-Host ""
Write-Host "[5/5] Olası sorunlar:" -ForegroundColor Red
Write-Host "1. Bridge account'una yeniden login olmak gerekebilir" -ForegroundColor Gray
Write-Host "2. Bridge SMTP username formatı yanlış olabilir" -ForegroundColor Gray
Write-Host "3. Bridge account durumu sorunlu olabilir (logout olmuş)" -ForegroundColor Gray
Write-Host "4. Bridge'in SMTP password'u değişmiş olabilir (GUI'den kontrol gerekir)" -ForegroundColor Gray

Write-Host ""
Write-Host "========================================" -ForegroundColor Yellow
Write-Host "COZUM ONERILERI:" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow
Write-Host "1. Bridge GUI'yi açın ve account durumunu kontrol edin" -ForegroundColor Green
Write-Host "2. Bridge Settings > Advanced > Bridge > SMTP bölümünden:" -ForegroundColor Green
Write-Host "   - Username formatını kontrol edin (email mi yoksa sadece kullanıcı adı mı?)" -ForegroundColor Gray
Write-Host "   - Password'u tekrar kopyalayın" -ForegroundColor Gray
Write-Host "3. Account'u çıkarıp tekrar eklemeyi deneyin" -ForegroundColor Green
Write-Host "4. Bridge'e yeniden login olun" -ForegroundColor Green

Remove-SSHSession -SessionId $Session.SessionId | Out-Null

