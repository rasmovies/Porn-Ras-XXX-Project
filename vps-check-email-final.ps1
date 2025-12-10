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
Write-Host "EMAIL SORUNU DETAYLI ANALIZ" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "[1/6] Backend error loglari (tam):" -ForegroundColor Red
$ErrorLogs = Invoke-VpsCmd "pm2 logs adulttube-backend --err --lines 50 --nostream 2>&1 | tail -20"
Write-Host $ErrorLogs.Output -ForegroundColor Red

Write-Host ""
Write-Host "[2/6] Email service kod kontrol:" -ForegroundColor Cyan
$EmailServiceCheck = Invoke-VpsCmd "cd $BackendPath/services && grep -A 15 'nodemailer.createTransport' emailService.js"
Write-Host $EmailServiceCheck.Output -ForegroundColor Gray

Write-Host ""
Write-Host "[3/6] Environment variables kontrol:" -ForegroundColor Cyan
$EnvTest = Invoke-VpsCmd "cd $BackendPath && node -e `"require('dotenv').config(); console.log('HOST:', JSON.stringify(process.env.PROTON_SMTP_HOST)); console.log('PORT:', JSON.stringify(process.env.PROTON_SMTP_PORT)); console.log('USER:', JSON.stringify(process.env.PROTON_SMTP_USERNAME)); console.log('PASS:', process.env.PROTON_SMTP_PASSWORD ? 'VAR' : 'YOK');`""
Write-Host $EnvTest.Output -ForegroundColor Gray

Write-Host ""
Write-Host "[4/6] SMTP baglanti testi:" -ForegroundColor Cyan
$SmtpTest = Invoke-VpsCmd "timeout 3 bash -c 'echo QUIT | telnet 127.0.0.1 1025' 2>&1 || nc -zv 127.0.0.1 1025 2>&1"
Write-Host $SmtpTest.Output -ForegroundColor Gray

Write-Host ""
Write-Host "[5/6] Bridge durumu:" -ForegroundColor Cyan
$Bridge = Invoke-VpsCmd "systemctl status protonmail-bridge --no-pager | head -5"
Write-Host $Bridge.Output -ForegroundColor Gray

Write-Host ""
Write-Host "[6/6] Email test (verbose):" -ForegroundColor Cyan
$TestJson = '{"email":"test@example.com","username":"TestUser","verifyUrl":"https://www.pornras.com/verify?token=test123"}'
$TestResult = Invoke-VpsCmd "curl -v -X POST http://localhost:5000/api/email/verification -H 'Content-Type: application/json' -d '$TestJson' 2>&1 | tail -30"
Write-Host $TestResult.Output -ForegroundColor Gray

# Son error logları
Start-Sleep -Seconds 2
Write-Host ""
Write-Host "Guncel error loglari:" -ForegroundColor Red
$LatestErrors = Invoke-VpsCmd "pm2 logs adulttube-backend --err --lines 10 --nostream 2>&1 | tail -10"
Write-Host $LatestErrors.Output -ForegroundColor Red

# Email route kontrolü
Write-Host ""
Write-Host "Email route kontrol:" -ForegroundColor Cyan
$RouteCheck = Invoke-VpsCmd "cd $BackendPath && grep -A 10 'verification' routes/emailRoutes.js | head -15"
Write-Host $RouteCheck.Output -ForegroundColor Gray

Remove-SSHSession -SessionId $Session.SessionId | Out-Null

