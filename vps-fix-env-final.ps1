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

Write-Host ".env dosyasi temizlenip yeniden olusturuluyor..." -ForegroundColor Cyan

# Doğru .env içeriği (tırnak ve virgül yok)
$EnvContent = @"
PORT=5000
NODE_ENV=production
PROTON_SMTP_HOST=127.0.0.1
PROTON_SMTP_PORT=1025
PROTON_SMTP_SECURE=false
PROTON_SMTP_USERNAME=pornras@proton.me
PROTON_SMTP_PASSWORD=MoQL_M-Loyi1fB3b9tKWew
PROTON_FROM_EMAIL=pornras@proton.me
PROTON_FROM_NAME=PORNRAS
"@

# Heredoc ile dosya oluştur
$CreateCmd = @"
cd $BackendPath
cat > .env << 'EOFENV'
$EnvContent
EOFENV
chmod 600 .env
cat .env
"@

$CreateResult = Invoke-VpsCmd $CreateCmd
Write-Host ""
Write-Host "Yeni .env dosyasi:" -ForegroundColor Green
Write-Host $CreateResult.Output -ForegroundColor Gray

Write-Host ""
Write-Host "Environment variable test:" -ForegroundColor Cyan
$EnvTest = Invoke-VpsCmd "cd $BackendPath && node -e `"require('dotenv').config(); console.log('HOST:', process.env.PROTON_SMTP_HOST); console.log('PORT:', process.env.PROTON_SMTP_PORT); console.log('USER:', process.env.PROTON_SMTP_USERNAME);`""
Write-Host $EnvTest.Output -ForegroundColor Gray

Write-Host ""
Write-Host "Backend yeniden baslatiliyor..." -ForegroundColor Cyan
Invoke-VpsCmd "pm2 restart adulttube-backend --update-env" | Out-Null
Start-Sleep -Seconds 3

Write-Host ""
Write-Host "Email test ediliyor..." -ForegroundColor Cyan
$TestJson = '{"email":"test@example.com","username":"TestUser","verifyUrl":"https://www.pornras.com/verify?token=test123"}'
$TestResult = Invoke-VpsCmd "curl -X POST http://localhost:5000/api/email/verification -H 'Content-Type: application/json' -d '$TestJson' 2>&1"
Write-Host $TestResult.Output -ForegroundColor Gray

$Logs = Invoke-VpsCmd "pm2 logs adulttube-backend --lines 3 --nostream 2>&1"
Write-Host ""
Write-Host "Son loglar:" -ForegroundColor Cyan
Write-Host $Logs.Output -ForegroundColor Gray

Remove-SSHSession -SessionId $Session.SessionId | Out-Null

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host ".env DOSYASI DUZELTILDI!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green

