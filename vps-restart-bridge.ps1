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
Write-Host "BRIDGE VE EMAIL SERVIS TEST" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "[1/6] Bridge servisi yeniden baslatiliyor..." -ForegroundColor Cyan
Invoke-VpsCmd "sudo systemctl restart protonmail-bridge" | Out-Null
Start-Sleep -Seconds 5

$BridgeStatus = Invoke-VpsCmd "systemctl is-active protonmail-bridge"
Write-Host "Bridge durumu: $($BridgeStatus.Output.Trim())" -ForegroundColor Gray

Write-Host ""
Write-Host "[2/6] Bridge loglari kontrol:" -ForegroundColor Cyan
$BridgeLogs = Invoke-VpsCmd "sudo journalctl -u protonmail-bridge -n 20 --no-pager | tail -10"
Write-Host $BridgeLogs.Output -ForegroundColor Gray

Write-Host ""
Write-Host "[3/6] .env dosyasi ve emailService.js uyumu kontrol:" -ForegroundColor Cyan
$EnvPwd = Invoke-VpsCmd "cd $BackendPath && cat .env | grep PROTON_SMTP_PASSWORD | cut -d= -f2"
$EnvPwdTrimmed = $EnvPwd.Output.Trim()
Write-Host ".env Password: '$EnvPwdTrimmed' (length: $($EnvPwdTrimmed.Length))" -ForegroundColor Gray

# EmailService.js'de secure ayarını kontrol et
$SecureCheck = Invoke-VpsCmd "cd $BackendPath && grep -A 3 'secure:' services/emailService.js"
Write-Host ""
Write-Host "emailService.js secure ayari:" -ForegroundColor Gray
Write-Host $SecureCheck.Output -ForegroundColor Gray

Write-Host ""
Write-Host "[4/6] Environment variable dogru okunuyor mu?" -ForegroundColor Cyan
$EnvTest = Invoke-VpsCmd "cd $BackendPath && node -e `"require('dotenv').config(); const pwd = process.env.PROTON_SMTP_PASSWORD; console.log('Password okundu:', pwd ? 'EVET' : 'HAYIR'); console.log('Password uzunluk:', pwd ? pwd.length : 0); console.log('Password ilk 10:', pwd ? pwd.substring(0, 10) : 'YOK'); console.log('Password tam:', JSON.stringify(pwd));`""
Write-Host $EnvTest.Output -ForegroundColor Gray

Write-Host ""
Write-Host "[5/6] Backend yeniden baslatiliyor..." -ForegroundColor Cyan
Invoke-VpsCmd "pm2 restart adulttube-backend --update-env" | Out-Null
Start-Sleep -Seconds 5

Write-Host ""
Write-Host "[6/6] Email test ediliyor..." -ForegroundColor Cyan
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
    Write-Host "Son error loglari:" -ForegroundColor Red
    $ErrorLogs = Invoke-VpsCmd "pm2 logs adulttube-backend --err --lines 5 --nostream 2>&1 | tail -5"
    Write-Host $ErrorLogs.Output -ForegroundColor Red
}

Remove-SSHSession -SessionId $Session.SessionId | Out-Null

