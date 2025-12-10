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
Write-Host "BRIDGE ACCOUNT DURUM KONTROLU" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "[1/4] Bridge servis durumu:" -ForegroundColor Cyan
$BridgeStatus = Invoke-VpsCmd "systemctl status protonmail-bridge --no-pager | head -15"
Write-Host $BridgeStatus.Output -ForegroundColor Gray

Write-Host ""
Write-Host "[2/4] Bridge loglari (account bilgileri):" -ForegroundColor Cyan
$BridgeLogs = Invoke-VpsCmd "sudo journalctl -u protonmail-bridge -n 100 --no-pager | grep -i -E 'account|login|pornras|sync' | tail -15"
Write-Host $BridgeLogs.Output -ForegroundColor Gray

Write-Host ""
Write-Host "[3/4] Bridge config dosyasi kontrol:" -ForegroundColor Cyan
$ConfigCheck = Invoke-VpsCmd "find ~/.config -name '*bridge*' -o -name '*proton*' 2>/dev/null | head -10"
Write-Host $ConfigCheck.Output -ForegroundColor Gray

$PrefsCheck = Invoke-VpsCmd "test -f ~/.config/protonmail/bridge/prefs.json && cat ~/.config/protonmail/bridge/prefs.json 2>/dev/null | head -50 || echo 'Prefs dosyasi bulunamadi'"
Write-Host $PrefsCheck.Output -ForegroundColor Gray

Write-Host ""
Write-Host "[4/4] Son authentication denemeleri:" -ForegroundColor Cyan
$AuthLogs = Invoke-VpsCmd "sudo journalctl -u protonmail-bridge -n 200 --no-pager | grep -i 'Incorrect\|invalid\|login\|auth' | tail -10"
Write-Host $AuthLogs.Output -ForegroundColor Gray

Write-Host ""
Write-Host "========================================" -ForegroundColor Yellow
Write-Host "ONERI:" -ForegroundColor Yellow
Write-Host "1. Bridge GUI'den Settings > Accounts > pornras@proton.me kontrol edin" -ForegroundColor Yellow
Write-Host "2. Account durumu 'Active' olmalı" -ForegroundColor Yellow
Write-Host "3. SMTP password'u Bridge'den tekrar kopyalayin (belki degismistir)" -ForegroundColor Yellow
Write-Host "4. Veya Bridge'e yeniden login olmayi deneyin" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow

Remove-SSHSession -SessionId $Session.SessionId | Out-Null

