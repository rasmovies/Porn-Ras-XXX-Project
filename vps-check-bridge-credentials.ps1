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
Write-Host "PROTON MAIL BRIDGE BILGILERI" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "[1/4] Bridge loglari kontrol (SMTP bilgileri):" -ForegroundColor Cyan
$BridgeLogs = Invoke-VpsCmd "sudo journalctl -u protonmail-bridge -n 200 --no-pager | grep -i -E 'SMTP|password|username|User' | tail -20"
Write-Host $BridgeLogs.Output -ForegroundColor Gray

Write-Host ""
Write-Host "[2/4] Bridge config dosyasi:" -ForegroundColor Cyan
$ConfigCheck = Invoke-VpsCmd "test -f ~/.config/protonmail/bridge/prefs.json && cat ~/.config/protonmail/bridge/prefs.json | grep -i -E 'User|SMTP' | head -5 || echo 'Config bulunamadi'"
Write-Host $ConfigCheck.Output -ForegroundColor Gray

Write-Host ""
Write-Host "[3/4] Bridge CLI'den bilgiler:" -ForegroundColor Cyan
Write-Host "NOT: Bridge CLI interaktif oldugu icin burada calistirilamiyor" -ForegroundColor Yellow
Write-Host "Bridge password'u almak icin VPS'te calistir:" -ForegroundColor Yellow
Write-Host "  protonmail-bridge --cli" -ForegroundColor Gray

Write-Host ""
Write-Host "[4/4] Mevcut .env dosyasi:" -ForegroundColor Cyan
$EnvCheck = Invoke-VpsCmd "cd $BackendPath && cat .env | grep PROTON"
Write-Host $EnvCheck.Output -ForegroundColor Gray

Write-Host ""
Write-Host "========================================" -ForegroundColor Yellow
Write-Host "ONERI:" -ForegroundColor Yellow
Write-Host "Bridge password yanlis olabilir veya degismis olabilir." -ForegroundColor Yellow
Write-Host "Bridge GUI'den veya CLI'den yeni password alin ve .env'e girin." -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow

Remove-SSHSession -SessionId $Session.SessionId | Out-Null

