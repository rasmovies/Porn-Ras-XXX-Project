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
Write-Host "MEVCUT ACCOUNT KULLANIMI" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "NOT: Account zaten var ve 'connected' durumda!" -ForegroundColor Green
Write-Host "Yeni account eklemeye gerek yok." -ForegroundColor Yellow
Write-Host ""
Write-Host "Mevcut password'u kullanip email'i test ediyoruz..." -ForegroundColor Cyan
Write-Host ""

Write-Host "[1/3] Mevcut .env dosyasindaki password:" -ForegroundColor Cyan
$CurrentPassword = Invoke-VpsCmd "cd $BackendPath && grep PROTON_SMTP_PASSWORD .env"
Write-Host $CurrentPassword.Output -ForegroundColor Gray

Write-Host ""
Write-Host "[2/3] Password dogrulama:" -ForegroundColor Cyan
Write-Host "Mevcut password: MoQL_M-Loyi1fB3b9tKWew" -ForegroundColor Gray
Write-Host "Bu password Bridge GUI'den alinmis ve dogru oldugu belirtilmisti." -ForegroundColor Gray

Write-Host ""
Write-Host "[3/3] Bridge servisini baslatip email test ediyoruz..." -ForegroundColor Cyan

# Bridge servisini başlat
Invoke-VpsCmd "sudo systemctl start protonmail-bridge" | Out-Null
Start-Sleep -Seconds 5

# Bridge durumu kontrol
$BridgeStatus = Invoke-VpsCmd "sudo systemctl status protonmail-bridge --no-pager | head -3"
Write-Host $BridgeStatus.Output -ForegroundColor Gray

Write-Host ""
Write-Host "Email test ediliyor..." -ForegroundColor Cyan
$TestJson = '{"email":"test@example.com","username":"TestUser","verifyUrl":"https://www.pornras.com/verify?token=test123"}'
$TestResult = Invoke-VpsCmd "curl -s -X POST http://localhost:5000/api/email/verification -H 'Content-Type: application/json' -d '$TestJson'"
Write-Host "API Response: $($TestResult.Output)" -ForegroundColor Gray

if ($TestResult.Output -like '*"success":true*') {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "BASARILI! EMAIL GONDERIMI CALISYOR!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "Hata devam ediyor. Son loglar:" -ForegroundColor Red
    $ErrorLogs = Invoke-VpsCmd "pm2 logs adulttube-backend --err --lines 10 --nostream 2>&1 | tail -10"
    Write-Host $ErrorLogs.Output -ForegroundColor Red
    
    Write-Host ""
    Write-Host "Bridge loglari:" -ForegroundColor Cyan
    $BridgeLogs = Invoke-VpsCmd "sudo journalctl -u protonmail-bridge -n 10 --no-pager | tail -10"
    Write-Host $BridgeLogs.Output -ForegroundColor Gray
}

Remove-SSHSession -SessionId $Session.SessionId | Out-Null

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "NOT:" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow
Write-Host "Account zaten var ve connected!" -ForegroundColor Green
Write-Host "Yeni account eklemeye gerek yok." -ForegroundColor Yellow
Write-Host "Mevcut password'u kullaniyoruz: MoQL_M-Loyi1fB3b9tKWew" -ForegroundColor Gray
Write-Host ""




