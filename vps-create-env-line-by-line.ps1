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

Write-Host ".env dosyasi satir satir olusturuluyor..." -ForegroundColor Cyan

# Önce dosyayı sil
Invoke-VpsCmd "cd $BackendPath && rm -f .env" | Out-Null

# Her satırı ayrı ayrı ekle
$EnvLines = @(
    "PORT=5000",
    "NODE_ENV=production",
    "PROTON_SMTP_HOST=127.0.0.1",
    "PROTON_SMTP_PORT=1025",
    "PROTON_SMTP_SECURE=false",
    "PROTON_SMTP_USERNAME=pornras@proton.me",
    "PROTON_SMTP_PASSWORD=MoQL_M-Loyi1fB3b9tKWew",
    "PROTON_FROM_EMAIL=pornras@proton.me",
    "PROTON_FROM_NAME=PORNRAS"
)

foreach ($Line in $EnvLines) {
    $LineEscaped = $Line -replace "'", "'\''"
    Invoke-VpsCmd "cd $BackendPath && echo '$LineEscaped' >> .env" | Out-Null
}

Invoke-VpsCmd "cd $BackendPath && chmod 600 .env" | Out-Null

Write-Host ""
Write-Host "Olusturulan .env dosyasi:" -ForegroundColor Green
$EnvContent = Invoke-VpsCmd "cd $BackendPath && cat .env"
Write-Host $EnvContent.Output -ForegroundColor Gray

Write-Host ""
Write-Host "Environment variable test:" -ForegroundColor Cyan
$EnvTest = Invoke-VpsCmd "cd $BackendPath && node -e `"require('dotenv').config(); console.log('HOST:', JSON.stringify(process.env.PROTON_SMTP_HOST)); console.log('PORT:', JSON.stringify(process.env.PROTON_SMTP_PORT));`""
Write-Host $EnvTest.Output -ForegroundColor Gray

Write-Host ""
Write-Host "Backend yeniden baslatiliyor..." -ForegroundColor Cyan
Invoke-VpsCmd "pm2 restart adulttube-backend --update-env" | Out-Null
Start-Sleep -Seconds 5

Write-Host ""
Write-Host "Email test ediliyor..." -ForegroundColor Cyan
$TestJson = '{"email":"test@example.com","username":"TestUser","verifyUrl":"https://www.pornras.com/verify?token=test123"}'
$TestResult = Invoke-VpsCmd "curl -s -X POST http://localhost:5000/api/email/verification -H 'Content-Type: application/json' -d '$TestJson'"
Write-Host $TestResult.Output -ForegroundColor Gray

$Logs = Invoke-VpsCmd "pm2 logs adulttube-backend --lines 3 --nostream 2>&1"
Write-Host ""
Write-Host "Son loglar:" -ForegroundColor Cyan
Write-Host $Logs.Output -ForegroundColor Gray

Remove-SSHSession -SessionId $Session.SessionId | Out-Null

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host ".env DOSYASI OLUSTURULDU!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green

