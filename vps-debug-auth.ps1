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
Write-Host "AUTHENTICATION DEBUG" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "[1/5] .env dosyasindaki password:" -ForegroundColor Cyan
$EnvCheck = Invoke-VpsCmd "cd $BackendPath && cat .env | grep PROTON_SMTP_PASSWORD"
Write-Host $EnvCheck.Output -ForegroundColor Gray

Write-Host ""
Write-Host "[2/5] Environment variable test (Node.js ile):" -ForegroundColor Cyan
$EnvTest = Invoke-VpsCmd "cd $BackendPath && node -e `"require('dotenv').config(); console.log('PASSWORD LENGTH:', process.env.PROTON_SMTP_PASSWORD ? process.env.PROTON_SMTP_PASSWORD.length : 'YOK'); console.log('PASSWORD (first 5):', process.env.PROTON_SMTP_PASSWORD ? process.env.PROTON_SMTP_PASSWORD.substring(0, 5) + '...' : 'YOK');`""
Write-Host $EnvTest.Output -ForegroundColor Gray

Write-Host ""
Write-Host "[3/5] Detayli error loglari:" -ForegroundColor Red
$ErrorLogs = Invoke-VpsCmd "pm2 logs adulttube-backend --err --lines 20 --nostream 2>&1 | grep -A 5 -B 5 'AUTH\|password\|EAUTH' | tail -30"
Write-Host $ErrorLogs.Output -ForegroundColor Red

Write-Host ""
Write-Host "[4/5] Bridge loglari (son authentication denemeleri):" -ForegroundColor Cyan
$BridgeLogs = Invoke-VpsCmd "sudo journalctl -u protonmail-bridge -n 50 --no-pager | grep -i -E 'login|password|auth|incorrect' | tail -10"
Write-Host $BridgeLogs.Output -ForegroundColor Gray

Write-Host ""
Write-Host "[5/5] Bridge CLI test (manuel olarak):" -ForegroundColor Yellow
Write-Host "NOT: Bridge CLI interaktif oldugu icin otomatik test edilemiyor" -ForegroundColor Yellow
Write-Host "VPS'te manuel test icin:" -ForegroundColor Yellow
Write-Host "  protonmail-bridge --cli" -ForegroundColor Gray
Write-Host "  veya" -ForegroundColor Gray
Write-Host "  Bridge GUI'den Settings > Advanced > Bridge kontrol edin" -ForegroundColor Gray

# Password'ü test et - base64 encode ile
Write-Host ""
Write-Host "Password format test:" -ForegroundColor Cyan
$PwdTest = Invoke-VpsCmd "cd $BackendPath && echo 'Oyunbozan*fb35*1907' | wc -c"
Write-Host "Password uzunlugu: $($PwdTest.Output)" -ForegroundColor Gray

Remove-SSHSession -SessionId $Session.SessionId | Out-Null

