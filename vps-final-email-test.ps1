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
Write-Host "FINAL EMAIL TEST" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "[1/5] .env dosyasi kontrol:" -ForegroundColor Cyan
$EnvCheck = Invoke-VpsCmd "cd $BackendPath && cat .env"
Write-Host $EnvCheck.Output -ForegroundColor Gray

Write-Host ""
Write-Host "[2/5] Environment variable test:" -ForegroundColor Cyan
$EnvTest = Invoke-VpsCmd "cd $BackendPath && node -e `"require('dotenv').config(); console.log('HOST:', JSON.stringify(process.env.PROTON_SMTP_HOST)); console.log('PORT:', JSON.stringify(process.env.PROTON_SMTP_PORT)); console.log('USER:', JSON.stringify(process.env.PROTON_SMTP_USERNAME)); console.log('PASS (first 10):', process.env.PROTON_SMTP_PASSWORD ? process.env.PROTON_SMTP_PASSWORD.substring(0, 10) + '...' : 'YOK'); console.log('PASS LENGTH:', process.env.PROTON_SMTP_PASSWORD ? process.env.PROTON_SMTP_PASSWORD.length : 0);`""
Write-Host $EnvTest.Output -ForegroundColor Gray

Write-Host ""
Write-Host "[3/5] PM2 tamamen durduruluyor ve yeniden baslatiliyor..." -ForegroundColor Cyan
Invoke-VpsCmd "pm2 delete all 2>&1; pm2 kill 2>&1" | Out-Null
Start-Sleep -Seconds 3

Invoke-VpsCmd "cd $BackendPath && pm2 start server.js --name adulttube-backend" | Out-Null
Start-Sleep -Seconds 5

$Status = Invoke-VpsCmd "pm2 status"
Write-Host $Status.Output -ForegroundColor Gray

Write-Host ""
Write-Host "[4/5] Email test ediliyor..." -ForegroundColor Cyan
$TestJson = '{"email":"test@example.com","username":"TestUser","verifyUrl":"https://www.pornras.com/verify?token=test123"}'
$TestResult = Invoke-VpsCmd "curl -s -X POST http://localhost:5000/api/email/verification -H 'Content-Type: application/json' -d '$TestJson'"
Write-Host "API Response: $($TestResult.Output)" -ForegroundColor Gray

# Başarı kontrolü
if ($TestResult.Output -like '*"success":true*') {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "BASARILI! EMAIL GONDERIMI CALISYOR!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "Hata loglari kontrol ediliyor..." -ForegroundColor Red
    $ErrorLogs = Invoke-VpsCmd "pm2 logs adulttube-backend --err --lines 10 --nostream 2>&1 | tail -10"
    Write-Host $ErrorLogs.Output -ForegroundColor Red
    
    Write-Host ""
    Write-Host "Bridge loglari:" -ForegroundColor Cyan
    $BridgeLogs = Invoke-VpsCmd "sudo journalctl -u protonmail-bridge -n 5 --no-pager | tail -5"
    Write-Host $BridgeLogs.Output -ForegroundColor Gray
}

Write-Host ""
Write-Host "[5/5] Son loglar:" -ForegroundColor Cyan
$Logs = Invoke-VpsCmd "pm2 logs adulttube-backend --lines 3 --nostream 2>&1 | tail -3"
Write-Host $Logs.Output -ForegroundColor Gray

Remove-SSHSession -SessionId $Session.SessionId | Out-Null

